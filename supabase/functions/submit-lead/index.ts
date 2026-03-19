// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: submit-lead
// ═══════════════════════════════════════════════════════════════════════════
// Public-facing lead submission endpoint.
// Uses service_role to bypass RLS — anon callers can submit leads without
// needing any INSERT policy on the leads table.
//
// Deploy:
//   supabase functions deploy submit-lead
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const cors = {
  "Access-Control-Allow-Origin":  "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

function ok(data: unknown) {
  return new Response(JSON.stringify({ success: true, data }), {
    status: 200, headers: { "Content-Type": "application/json", ...cors },
  });
}
function err(msg: string, status = 400) {
  return new Response(JSON.stringify({ success: false, error: msg }), {
    status, headers: { "Content-Type": "application/json", ...cors },
  });
}

// UUID validation — reject non-UUID strings to avoid DB type errors
const toUUID = (v: unknown): string | null => {
  if (!v) return null;
  const s = String(v);
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s : null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  if (req.method !== "POST") return err("Method not allowed", 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON"); }

  const leadRow = {
    lead_source:  body.leadSource  || "unknown",
    lead_channel: body.leadChannel || "form",
    lead_type:    body.leadType    || "venue_enquiry",

    status:   "new",
    priority: body.priority || "normal",
    score:    Number(body.score)    || 0,

    listing_id:   toUUID(body.listingId),
    listing_type: body.listingType  || null,
    venue_id:     toUUID(body.venueId),
    vendor_id:    toUUID(body.vendorId),

    user_id:          toUUID(body.userId),
    aura_session_id:  body.auraSessionId  || null,
    conversation_id:  body.conversationId || null,

    first_name: body.firstName || null,
    last_name:  body.lastName  || null,
    full_name:  body.fullName  || [body.firstName, body.lastName].filter(Boolean).join(" ") || null,
    email:      body.email     || null,
    phone:      body.phone     || null,
    preferred_contact_method: body.preferredContactMethod || null,

    wedding_date:       body.weddingDate       || null,
    wedding_month:      body.weddingMonth      || null,
    wedding_year:       body.weddingYear       ? Number(body.weddingYear) : null,
    exact_date_known:   body.exactDateKnown    || false,
    guest_count:        body.guestCount        || null,
    budget_range:       body.budgetRange       || null,
    location_preference: body.locationPreference || null,
    event_location:     body.eventLocation     || null,

    message:          body.message          || null,
    intent_summary:   body.intentSummary    || null,
    requirements_json: body.requirementsJson || {},
    tags_json:         body.tagsJson         || [],

    consent_marketing:       body.consentMarketing       || false,
    consent_data_processing: body.consentDataProcessing !== false,

    lead_value_band: body.leadValueBand || null,
  };

  // Insert lead
  const { data: lead, error: insertError } = await supabase
    .from("leads")
    .insert(leadRow)
    .select("id")
    .single();

  if (insertError) {
    console.error("submit-lead: insert failed:", insertError);
    return err(insertError.message, 500);
  }

  const leadId = lead.id;

  // Log lead_created event (non-fatal)
  await supabase.from("lead_events").insert({
    lead_id:    leadId,
    event_type: "lead_created",
    event_data: { source: leadRow.lead_source, channel: leadRow.lead_channel, score: leadRow.score },
  }).then(({ error }) => { if (error) console.warn("submit-lead: event log failed:", error.message); });

  // Store initial message (non-fatal)
  if (leadRow.message) {
    await supabase.from("lead_messages").insert({
      lead_id:      leadId,
      message_type: "initial_enquiry",
      body:         leadRow.message,
    }).then(({ error }) => { if (error) console.warn("submit-lead: message log failed:", error.message); });
  }

  return ok({ leadId });
});
