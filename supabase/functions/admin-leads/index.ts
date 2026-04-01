// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: admin-leads
// ═══════════════════════════════════════════════════════════════════════════
// Secure server-side access to the leads table using service_role.
// The service_role key never touches the browser — it lives only here.
//
// Actions:
//   list          — paginated lead list with optional filters
//   get           — single lead by ID
//   update        — update lead status (+ lifecycle timestamps + event log)
//   insert_event  — append a lead_events row
//
// Deploy:
//   supabase functions deploy admin-leads
//
// Caller passes:  Authorization: Bearer <anon key>
// Supabase verifies the JWT. Function uses service_role for DB access.
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── Lead scoring (canonical — mirrors src/constants/leadStatuses.js) ─────────
// Owned by the write layer. Calculate on every write, display everywhere.

function calcLeadScore(lead: Record<string, unknown>): number {
  let score = 0;
  const req = (lead.requirements_json as Record<string, unknown>) || {};

  // Contact completeness
  if (lead.phone) score += 10;
  if (req.website) score += 8;
  const interests = req.interests as unknown[] | undefined;
  if (interests?.length) score += Math.min(interests.length * 7, 28);

  // Source quality
  const src = lead.lead_source as string | undefined;
  if (src === "Partner Enquiry Form") score += 20;
  else if (src?.toLowerCase().includes("venue")) score += 15;
  else if (src) score += 8;

  // Engagement signals
  const msg = lead.message as string | undefined;
  if (msg && msg.length > 80) score += 7;

  // Status progression bonus
  const statusBonus: Record<string, number> = {
    new: 0, qualified: 12, engaged: 20,
    proposal_sent: 35, booked: 55, lost: 0, spam: 0,
  };
  score += statusBonus[(lead.status as string) || "new"] || 0;

  return Math.min(100, score);
}

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

// ─── Action: create ───────────────────────────────────────────────────────────

async function handleCreate(payload: Record<string, unknown>) {
  if (!payload.email && !payload.first_name) {
    return err("Missing required fields: email or first_name");
  }
  const withScore = { ...payload, score: calcLeadScore(payload) };
  const { data, error } = await supabase
    .from("leads")
    .insert([withScore])
    .select()
    .single();
  if (error) return err(error.message, 500);
  return ok({ lead: data });
}

// ─── Action: update_field ─────────────────────────────────────────────────────

async function handleUpdateField(leadId: string, updates: Record<string, unknown>) {
  // Fetch current lead to recompute score with merged state
  const { data: current } = await supabase.from("leads").select("*").eq("id", leadId).single();
  const merged = { ...(current || {}), ...updates };
  const score = calcLeadScore(merged);

  const { data, error } = await supabase
    .from("leads")
    .update({ ...updates, score, updated_at: new Date().toISOString() })
    .eq("id", leadId)
    .select()
    .single();
  if (error) return err(error.message, 500);
  return ok({ lead: data });
}

// ─── Action: insert_message ───────────────────────────────────────────────────

async function handleInsertMessage(leadId: string, messageType: string, body: string) {
  const { data, error } = await supabase
    .from("lead_messages")
    .insert({ lead_id: leadId, message_type: messageType, body })
    .select()
    .single();
  if (error) return err(error.message, 500);
  return ok({ message: data });
}

// ─── Action: list ─────────────────────────────────────────────────────────────

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

// ─── Action: get ──────────────────────────────────────────────────────────────

async function handleGet(leadId: string) {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .eq("id", leadId)
    .single();

  if (error) return err(error.message, 404);
  return ok({ lead: data });
}

// ─── Action: update ───────────────────────────────────────────────────────────

type LeadStatus =
  | "new" | "qualified" | "engaged" | "proposal_sent"
  | "booked" | "lost" | "spam";

const VALID_STATUSES: LeadStatus[] = [
  "new", "qualified", "engaged", "proposal_sent",
  "booked", "lost", "spam",
];

async function handleUpdate(leadId: string, status: string, lossReason?: string) {
  if (!VALID_STATUSES.includes(status as LeadStatus)) {
    return err(`Invalid status: ${status}`);
  }

  const now = new Date().toISOString();

  // Fetch current lead to recompute score with new status
  const { data: current } = await supabase.from("leads").select("*").eq("id", leadId).single();
  const score = calcLeadScore({ ...(current || {}), status });

  const updates: Record<string, unknown> = {
    status,
    score,
    updated_at: now,
  };

  // Lifecycle timestamps
  const tsMap: Partial<Record<LeadStatus, string>> = {
    engaged:       "engaged_at",
    proposal_sent: "proposal_sent_at",
    booked:        "booked_at",
    lost:          "lost_at",
  };
  const tsField = tsMap[status as LeadStatus];
  if (tsField) updates[tsField] = now;
  if (status === "lost"  && lossReason) updates.loss_reason = lossReason;
  if (status === "spam"  && lossReason) updates.spam_reason = lossReason;

  const { data, error } = await supabase
    .from("leads")
    .update(updates)
    .eq("id", leadId)
    .select()
    .single();

  if (error) return err(error.message, 500);

  // Log the status change event
  await supabase.from("lead_events").insert({
    lead_id:    leadId,
    event_type: "status_changed",
    event_data: {
      new_status:  status,
      changed_by:  "admin",
      loss_reason: lossReason ?? null,
    },
  });

  return ok({ lead: data });
}

// ─── Action: insert_event ─────────────────────────────────────────────────────

async function handleInsertEvent(leadId: string, eventType: string, eventData: unknown) {
  if (!eventType) return err("eventType is required for insert_event");

  const { data, error } = await supabase
    .from("lead_events")
    .insert({ lead_id: leadId, event_type: eventType, event_data: eventData ?? {} })
    .select()
    .single();

  if (error) return err(error.message, 500);
  return ok({ event: data });
}

// ─── Main handler ─────────────────────────────────────────────────────────────

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

  const { action, filters = {}, leadId, status, lossReason, eventType, eventData, payload, updates, messageType, body: msgBody } = body;

  if (!action || typeof action !== "string") {
    return err("Missing or invalid action. Must be: create | list | get | update | update_field | insert_event | insert_message");
  }

  switch (action) {
    case "create":
      if (!payload || typeof payload !== "object") return err("payload is required for create");
      return handleCreate(payload as Record<string, unknown>);

    case "list":
      return handleList(filters as Record<string, unknown>);

    case "get":
      if (!leadId || typeof leadId !== "string") return err("leadId is required for get");
      return handleGet(leadId);

    case "update":
      if (!leadId || typeof leadId !== "string") return err("leadId is required for update");
      if (!status  || typeof status  !== "string") return err("status is required for update");
      return handleUpdate(leadId, status, lossReason as string | undefined);

    case "update_field":
      if (!leadId  || typeof leadId  !== "string") return err("leadId is required for update_field");
      if (!updates || typeof updates !== "object") return err("updates is required for update_field");
      return handleUpdateField(leadId, updates as Record<string, unknown>);

    case "insert_event":
      if (!leadId    || typeof leadId    !== "string") return err("leadId is required for insert_event");
      if (!eventType || typeof eventType !== "string") return err("eventType is required for insert_event");
      return handleInsertEvent(leadId, eventType, eventData);

    case "insert_message":
      if (!leadId      || typeof leadId      !== "string") return err("leadId is required for insert_message");
      if (!messageType || typeof messageType !== "string") return err("messageType is required for insert_message");
      if (!msgBody     || typeof msgBody     !== "string") return err("body is required for insert_message");
      return handleInsertMessage(leadId, messageType, msgBody);

    default:
      return err(`Unknown action: ${action}. Must be: create | list | get | update | update_field | insert_event | insert_message`);
  }
});
