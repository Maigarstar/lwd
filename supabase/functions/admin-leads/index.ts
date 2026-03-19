// Supabase Edge Function: admin-leads
// Secure server-side access to the leads table using service_role.
// The service_role key never touches the browser.
//
// Actions: list | get | update | insert_event

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const corsHeaders = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

function err(message: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: message }), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });
}

async function handleList(filters: Record<string, unknown>) {
  let query = supabase
    .from("leads")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false });

  if (filters.leadType)  query = query.eq("lead_type",  filters.leadType);
  if (filters.status)    query = query.eq("status",     filters.status);
  if (filters.priority)  query = query.eq("priority",   filters.priority);

  const limit  = typeof filters.limit  === "number" ? filters.limit  : 200;
  const offset = typeof filters.offset === "number" ? filters.offset : 0;
  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;
  if (error) return err(error.message, 500);
  return ok({ leads: data ?? [], count: count ?? 0 });
}

async function handleGet(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error) return err(error.message, 404);
  return ok({ lead: data });
}

type LeadStatus =
  | "new" | "contacted" | "qualified" | "sent_to_partner"
  | "partner_replied" | "booked" | "lost" | "archived";

const VALID_STATUSES: LeadStatus[] = [
  "new", "contacted", "qualified", "sent_to_partner",
  "partner_replied", "booked", "lost", "archived",
];

async function handleUpdate(leadId: string, status: string, lossReason?: string) {
  if (!VALID_STATUSES.includes(status as LeadStatus)) {
    return err(`Invalid status: ${status}`);
  }

  const now = new Date().toISOString();
  const updates: Record<string, unknown> = { status, updated_at: now };

  const tsMap: Partial<Record<LeadStatus, string>> = {
    booked:          "booked_at",
    lost:            "lost_at",
    sent_to_partner: "vendor_notified_at",
    partner_replied: "responded_at",
  };
  const tsField = tsMap[status as LeadStatus];
  if (tsField) updates[tsField] = now;
  if (status === "lost" && lossReason) updates.loss_reason = lossReason;

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId)
    .select()
    .single();

  if (error) return err(error.message, 500);

  await supabase.from("lead_events").insert({
    lead_id:    leadId,
    event_type: "status_changed",
    event_data: { new_status: status, changed_by: "admin", loss_reason: lossReason ?? null },
  });

  return ok({ lead: data });
}

async function handleInsertEvent(leadId: string, eventType: string, eventData: unknown) {
  const { data, error } = await supabase
    .from("lead_events")
    .insert({ lead_id: leadId, event_type: eventType, event_data: eventData ?? {} })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok({ event: data });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return err("Method not allowed. Use POST.", 405);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return err("Invalid JSON body");
  }

  const { action, filters = {}, leadId, status, lossReason, eventType, eventData } = body;

  if (!action || typeof action !== "string") {
    return err("Missing or invalid action. Must be: list | get | update | insert_event");
  }

  switch (action) {
    case "list":
      return handleList(filters as Record<string, unknown>);
    case "get":
      if (!leadId || typeof leadId !== "string") return err("leadId is required for get");
      return handleGet(leadId);
    case "update":
      if (!leadId || typeof leadId !== "string") return err("leadId is required for update");
      if (!status  || typeof status  !== "string") return err("status is required for update");
      return handleUpdate(leadId, status, lossReason as string | undefined);
    case "insert_event":
      if (!leadId    || typeof leadId    !== "string") return err("leadId is required for insert_event");
      if (!eventType || typeof eventType !== "string") return err("eventType is required for insert_event");
      return handleInsertEvent(leadId, eventType, eventData);
    default:
      return err(`Unknown action: ${action}. Must be: list | get | update | insert_event`);
  }
});
