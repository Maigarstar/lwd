// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: admin-user-events
// ═══════════════════════════════════════════════════════════════════════════
// Server-side read access to user_events using service_role.
// user_events has insert-only RLS — this function is the only way to read.
//
// Actions:
//   summary         — platform totals by event type, last N days
//   search_queries  — top search queries, zero-result queries, filter usage
//   enquiry_funnel  — started vs submitted per entity + platform rates
//   shortlist_top   — most shortlisted venues/vendors
//   compare_top     — most compared venues, top pairs, per-venue competitors
//   timeline        — daily event counts by type (last N days)
//   entity_events   — all events for a specific entity (venue/vendor drill-down)
//
// Deploy:
//   supabase functions deploy admin-user-events
// ═══════════════════════════════════════════════════════════════════════════

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

function sinceDate(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

function fillTimeline(byDay: Record<string, number>, days: number) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    result.push({ date: key, count: byDay[key] || 0 });
  }
  return result;
}

// ── summary ──────────────────────────────────────────────────────────────────
async function handleSummary(days: number) {
  const { data, error } = await supabase
    .from("user_events")
    .select("event_type")
    .gte("created_at", sinceDate(days));

  if (error) return err(error.message, 500);

  const rows = (data || []) as { event_type: string }[];
  const byType: Record<string, number> = {};
  rows.forEach(r => {
    byType[r.event_type] = (byType[r.event_type] || 0) + 1;
  });

  // Convenience totals
  const searches        = byType["search"]               || 0;
  const enquiryStarts   = byType["enquiry_started"]       || 0;
  const enquirySubs     = byType["enquiry_submitted"]     || 0;
  const shortlistAdds   = byType["shortlist_add"]         || 0;
  const auraQueries     = byType["aura_query"]            || 0;
  const profileViews    = byType["profile_view"]          || 0;
  const returns         = byType["returned_after_outbound"] || 0;
  const compareAdds     = byType["compare_add"]           || 0;
  const comparePairs    = byType["compare_pair"]          || 0;
  const compareViews    = byType["compare_view"]          || 0;

  const enquiryRate = enquiryStarts > 0
    ? Math.round((enquirySubs / enquiryStarts) * 100)
    : null;

  return ok({
    total: rows.length,
    days,
    byType,
    highlights: {
      searches,
      profileViews,
      enquiryStarts,
      enquirySubmissions: enquirySubs,
      enquiryConversionRate: enquiryRate,
      shortlistAdds,
      compareAdds,
      comparePairs,
      compareViews,
      auraQueries,
      returnsAfterOutbound: returns,
    },
  });
}

// ── search_queries ────────────────────────────────────────────────────────────
async function handleSearchQueries(days: number, limit: number) {
  const { data, error } = await supabase
    .from("user_events")
    .select("metadata")
    .eq("event_type", "search")
    .gte("created_at", sinceDate(days));

  if (error) return err(error.message, 500);

  const rows = (data || []) as { metadata: Record<string, unknown> }[];

  // Aggregate queries
  const queryCounts: Record<string, number> = {};
  let totalSearches = 0;
  let zeroResultCount = 0;

  rows.forEach(r => {
    totalSearches++;
    const q = String(r.metadata?.query || "").trim().toLowerCase();
    if (r.metadata?.zero_results) zeroResultCount++;
    if (q) {
      queryCounts[q] = (queryCounts[q] || 0) + 1;
    }
  });

  const topQueries = Object.entries(queryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([query, count]) => ({ query, count }));

  // Zero result queries
  const { data: zeroData } = await supabase
    .from("user_events")
    .select("metadata")
    .eq("event_type", "search")
    .gte("created_at", sinceDate(days))
    .contains("metadata", { zero_results: true });

  const zeroCounts: Record<string, number> = {};
  ((zeroData || []) as { metadata: Record<string, unknown> }[]).forEach(r => {
    const q = String(r.metadata?.query || "").trim().toLowerCase();
    if (q) zeroCounts[q] = (zeroCounts[q] || 0) + 1;
  });

  const topZeroResults = Object.entries(zeroCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query, count]) => ({ query, count }));

  return ok({
    totalSearches,
    zeroResultCount,
    zeroResultRate: totalSearches > 0 ? Math.round((zeroResultCount / totalSearches) * 100) : 0,
    topQueries,
    topZeroResults,
    days,
  });
}

// ── enquiry_funnel ────────────────────────────────────────────────────────────
async function handleEnquiryFunnel(days: number, limit: number) {
  const since = sinceDate(days);

  // Fetch both event types together
  const { data, error } = await supabase
    .from("user_events")
    .select("event_type, entity_id, entity_type, metadata")
    .in("event_type", ["enquiry_started", "enquiry_submitted"])
    .gte("created_at", since);

  if (error) return err(error.message, 500);

  const rows = (data || []) as {
    event_type: string;
    entity_id: string | null;
    entity_type: string | null;
    metadata: Record<string, unknown>;
  }[];

  // Platform totals
  let totalStarts = 0;
  let totalSubmits = 0;

  // Per-entity funnel
  const entityFunnel: Record<string, { starts: number; submits: number; name: string | null; entityType: string | null }> = {};

  rows.forEach(r => {
    if (r.event_type === "enquiry_started") totalStarts++;
    if (r.event_type === "enquiry_submitted") totalSubmits++;

    if (r.entity_id) {
      if (!entityFunnel[r.entity_id]) {
        entityFunnel[r.entity_id] = {
          starts: 0, submits: 0,
          name: String(r.metadata?.entity_name || ""),
          entityType: r.entity_type,
        };
      }
      if (r.event_type === "enquiry_started")   entityFunnel[r.entity_id].starts++;
      if (r.event_type === "enquiry_submitted") entityFunnel[r.entity_id].submits++;
    }
  });

  const platformConversionRate = totalStarts > 0
    ? Math.round((totalSubmits / totalStarts) * 100)
    : null;

  const topEntities = Object.entries(entityFunnel)
    .map(([entityId, v]) => ({
      entityId,
      ...v,
      conversionRate: v.starts > 0 ? Math.round((v.submits / v.starts) * 100) : null,
    }))
    .sort((a, b) => b.starts - a.starts)
    .slice(0, limit);

  return ok({
    platform: { starts: totalStarts, submits: totalSubmits, conversionRate: platformConversionRate },
    topEntities,
    days,
  });
}

// ── shortlist_top ─────────────────────────────────────────────────────────────
async function handleShortlistTop(days: number, limit: number) {
  const { data, error } = await supabase
    .from("user_events")
    .select("event_type, entity_id, entity_type, metadata")
    .in("event_type", ["shortlist_add", "shortlist_remove"])
    .gte("created_at", sinceDate(days));

  if (error) return err(error.message, 500);

  const rows = (data || []) as {
    event_type: string;
    entity_id: string | null;
    entity_type: string | null;
    metadata: Record<string, unknown>;
  }[];

  // Net shortlist count per entity (adds minus removes)
  const counts: Record<string, { net: number; adds: number; removes: number; name: string | null; entityType: string | null }> = {};

  rows.forEach(r => {
    if (!r.entity_id) return;
    if (!counts[r.entity_id]) {
      counts[r.entity_id] = {
        net: 0, adds: 0, removes: 0,
        name: String(r.metadata?.entity_name || ""),
        entityType: r.entity_type,
      };
    }
    if (r.event_type === "shortlist_add")    { counts[r.entity_id].adds++;   counts[r.entity_id].net++; }
    if (r.event_type === "shortlist_remove") { counts[r.entity_id].removes++; counts[r.entity_id].net--; }
  });

  const ranked = Object.entries(counts)
    .map(([entityId, v]) => ({ entityId, ...v }))
    .sort((a, b) => b.adds - a.adds)
    .slice(0, limit);

  return ok({ leaderboard: ranked, days });
}

// ── timeline ──────────────────────────────────────────────────────────────────
async function handleTimeline(days: number, eventTypes: string[]) {
  let query = supabase
    .from("user_events")
    .select("event_type, created_at")
    .gte("created_at", sinceDate(days))
    .order("created_at", { ascending: true });

  if (eventTypes.length > 0) {
    query = query.in("event_type", eventTypes);
  }

  const { data, error } = await query;
  if (error) return err(error.message, 500);

  const rows = (data || []) as { event_type: string; created_at: string }[];

  // Build per-type timeline
  const byTypeDay: Record<string, Record<string, number>> = {};
  const allDayTotals: Record<string, number> = {};

  rows.forEach(r => {
    const day = r.created_at.slice(0, 10);
    if (!byTypeDay[r.event_type]) byTypeDay[r.event_type] = {};
    byTypeDay[r.event_type][day] = (byTypeDay[r.event_type][day] || 0) + 1;
    allDayTotals[day] = (allDayTotals[day] || 0) + 1;
  });

  const timeline = fillTimeline(allDayTotals, days);
  const byType: Record<string, { date: string; count: number }[]> = {};
  Object.keys(byTypeDay).forEach(t => {
    byType[t] = fillTimeline(byTypeDay[t], days);
  });

  return ok({ timeline, byType, total: rows.length, days });
}

// ── compare_top ───────────────────────────────────────────────────────────────
async function handleCompareTop(days: number, limit: number) {
  // Fetch compare_add, compare_pair events together
  const { data, error } = await supabase
    .from("user_events")
    .select("event_type, entity_id, metadata")
    .in("event_type", ["compare_add", "compare_pair"])
    .gte("created_at", sinceDate(days));

  if (error) return err(error.message, 500);

  const rows = (data || []) as {
    event_type: string;
    entity_id: string | null;
    metadata: Record<string, unknown>;
  }[];

  // ── Most compared venues (by compare_add events) ──────────────────────────
  const addCounts: Record<string, { adds: number; name: string | null }> = {};

  rows
    .filter(r => r.event_type === "compare_add" && r.entity_id)
    .forEach(r => {
      const id = r.entity_id!;
      if (!addCounts[id]) {
        addCounts[id] = { adds: 0, name: String(r.metadata?.venue_name || "") || null };
      }
      addCounts[id].adds++;
    });

  const mostCompared = Object.entries(addCounts)
    .map(([venueId, v]) => ({ venueId, ...v }))
    .sort((a, b) => b.adds - a.adds)
    .slice(0, limit);

  // ── Top compare pairs (from compare_pair events) ──────────────────────────
  const pairCounts: Record<string, { count: number; nameA: string | null; nameB: string | null }> = {};

  rows
    .filter(r => r.event_type === "compare_pair")
    .forEach(r => {
      const m = r.metadata;
      const idA = String(m?.venue_a_id || "");
      const idB = String(m?.venue_b_id || "");
      if (!idA || !idB) return;
      // Canonical key: always smaller id first for de-duplication
      const [k1, k2, n1, n2] = idA < idB
        ? [idA, idB, String(m.venue_a_name || ""), String(m.venue_b_name || "")]
        : [idB, idA, String(m.venue_b_name || ""), String(m.venue_a_name || "")];
      const key = `${k1}:::${k2}`;
      if (!pairCounts[key]) pairCounts[key] = { count: 0, nameA: n1 || null, nameB: n2 || null };
      pairCounts[key].count++;
    });

  const topPairs = Object.entries(pairCounts)
    .map(([key, v]) => {
      const [venueAId, venueBId] = key.split(":::");
      return { venueAId, venueBId, ...v };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // ── Per-venue top competitors (venues most compared against each target) ───
  const competitorMap: Record<string, Record<string, { count: number; name: string | null }>> = {};

  rows
    .filter(r => r.event_type === "compare_pair")
    .forEach(r => {
      const m = r.metadata;
      const idA = String(m?.venue_a_id || "");
      const idB = String(m?.venue_b_id || "");
      const nA  = String(m?.venue_a_name || "") || null;
      const nB  = String(m?.venue_b_name || "") || null;
      if (!idA || !idB) return;
      // A vs B: record B as competitor of A, and A as competitor of B
      if (!competitorMap[idA]) competitorMap[idA] = {};
      if (!competitorMap[idA][idB]) competitorMap[idA][idB] = { count: 0, name: nB };
      competitorMap[idA][idB].count++;

      if (!competitorMap[idB]) competitorMap[idB] = {};
      if (!competitorMap[idB][idA]) competitorMap[idB][idA] = { count: 0, name: nA };
      competitorMap[idB][idA].count++;
    });

  // Top 5 competitors per venue, for top N venues only
  const venueCompetitors = Object.entries(competitorMap)
    .map(([venueId, rivals]) => ({
      venueId,
      venueName: addCounts[venueId]?.name || null,
      topCompetitors: Object.entries(rivals)
        .map(([rivalId, rv]) => ({ rivalId, ...rv }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5),
    }))
    .filter(v => v.topCompetitors.length > 0)
    .sort((a, b) => {
      const aTotal = a.topCompetitors.reduce((s, r) => s + r.count, 0);
      const bTotal = b.topCompetitors.reduce((s, r) => s + r.count, 0);
      return bTotal - aTotal;
    })
    .slice(0, limit);

  return ok({ mostCompared, topPairs, venueCompetitors, days });
}

// ── entity_events ─────────────────────────────────────────────────────────────
async function handleEntityEvents(entityId: string, days: number) {
  const { data, error } = await supabase
    .from("user_events")
    .select("event_type, session_id, metadata, created_at")
    .eq("entity_id", entityId)
    .gte("created_at", sinceDate(days))
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) return err(error.message, 500);

  const rows = (data || []) as { event_type: string; session_id: string; metadata: unknown; created_at: string }[];

  const byType: Record<string, number> = {};
  rows.forEach(r => {
    byType[r.event_type] = (byType[r.event_type] || 0) + 1;
  });

  return ok({ total: rows.length, byType, events: rows, days });
}

// ── main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Method not allowed. Use POST.", 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON body"); }

  const {
    action, days = 30, limit = 10,
    eventTypes = [],
    entityId,
  } = body;

  if (!action) return err("Missing action");

  switch (String(action)) {
    case "summary":        return handleSummary(Number(days));
    case "search_queries": return handleSearchQueries(Number(days), Number(limit));
    case "enquiry_funnel": return handleEnquiryFunnel(Number(days), Number(limit));
    case "shortlist_top":  return handleShortlistTop(Number(days), Number(limit));
    case "timeline":       return handleTimeline(Number(days), Array.isArray(eventTypes) ? eventTypes as string[] : []);
    case "compare_top":   return handleCompareTop(Number(days), Number(limit));
    case "entity_events":
      if (!entityId) return err("entityId required for entity_events action");
      return handleEntityEvents(String(entityId), Number(days));
    default:
      return err(`Unknown action: ${action}. Must be: summary | search_queries | enquiry_funnel | shortlist_top | compare_top | timeline | entity_events`);
  }
});
