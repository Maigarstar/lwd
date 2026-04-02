// ─── Admin Leads Service ──────────────────────────────────────────────────────
// Calls the admin-leads edge function (server-side service_role).
// No Supabase client, no secret keys in the browser.
// ─────────────────────────────────────────────────────────────────────────────

export type LeadStatus =
  | "new" | "contacted" | "qualified" | "sent_to_partner"
  | "partner_replied" | "booked" | "lost" | "archived";

export interface LeadRow {
  id: string;
  created_at: string;
  updated_at: string;
  lead_source: string;
  lead_channel: string;
  lead_type: string;
  status: LeadStatus;
  priority: string;
  score: number;
  listing_id: string | null;
  listing_type: string | null;
  venue_id: string | null;
  vendor_id: string | null;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  preferred_contact_method: string | null;
  wedding_month: string | null;
  wedding_year: number | null;
  exact_date_known: boolean;
  guest_count: string | null;
  budget_range: string | null;
  location_preference: string | null;
  message: string | null;
  intent_summary: string | null;
  requirements_json: Record<string, unknown>;
  tags_json: string[];
  consent_marketing: boolean;
  vendor_notified_at: string | null;
  internal_notified_at: string | null;
  responded_at: string | null;
  booked_at: string | null;
  lost_at: string | null;
  loss_reason: string | null;
  lead_value_band: string | null;
}

// ─── Edge function caller ─────────────────────────────────────────────────────

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-leads`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdge(payload: Record<string, unknown>) {
  const res = await fetch(EDGE_URL, {
    method: "POST",
    headers: {
      "Content-Type":  "application/json",
      "Authorization": `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Edge function error");
  return json.data;
}

// ─── Public API ───────────────────────────────────────────────────────────────

export async function adminListLeads(filters: {
  leadType?: string;
  status?: string;
  priority?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<{ data: LeadRow[]; count: number; error: unknown }> {
  try {
    const data = await callEdge({ action: "list", filters });
    return { data: data.leads ?? [], count: data.count ?? 0, error: null };
  } catch (e) {
    return { data: [], count: 0, error: e };
  }
}

export async function adminGetLead(
  leadId: string
): Promise<{ data: LeadRow | null; error: unknown }> {
  try {
    const data = await callEdge({ action: "get", leadId });
    return { data: data.lead ?? null, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function adminUpdateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  opts: { lossReason?: string } = {}
): Promise<{ data: LeadRow | null; error: unknown }> {
  try {
    const data = await callEdge({
      action:     "update",
      leadId,
      status:     newStatus,
      lossReason: opts.lossReason,
    });
    return { data: data.lead ?? null, error: null };
  } catch (e) {
    return { data: null, error: e };
  }
}

export async function adminGetLeadEvents(
  leadId: string
): Promise<{ data: unknown[]; error: unknown }> {
  // Events are fetched via the get action — extend if needed.
  // For now return empty; add a dedicated list_events action to the edge function if required.
  try {
    const data = await callEdge({ action: "get", leadId });
    return { data: data.events ?? [], error: null };
  } catch (e) {
    return { data: [], error: e };
  }
}
