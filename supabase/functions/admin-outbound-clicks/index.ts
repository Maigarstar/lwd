// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: admin-outbound-clicks
// ═══════════════════════════════════════════════════════════════════════════
// Server-side read access to outbound_clicks using service_role.
// outbound_clicks has insert-only RLS — this function is the only way
// to read the data. Never expose the service_role key in the browser.
//
// Actions:
//   summary     — platform total + breakdown by link_type
//   leaderboard — top N venues or vendors by click count
//   venue       — per-entity breakdown + daily timeline
//   timeline    — platform-wide daily clicks (last N days)
//   batch       — click counts for an array of entity IDs (listing cards)
//
// Deploy:
//   supabase functions deploy admin-outbound-clicks
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

function groupBy(rows: Record<string, unknown>[], field: string): Record<string, number> {
  return rows.reduce((acc: Record<string, number>, row) => {
    const key = String(row[field] || "other");
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
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
    .from("outbound_clicks")
    .select("link_type, entity_type")
    .gte("created_at", sinceDate(days));

  if (error) return err(error.message, 500);

  const rows = (data || []) as Record<string, unknown>[];
  const byLinkType  = groupBy(rows, "link_type");
  const byEntityType = groupBy(rows, "entity_type");

  // Roll up social vs website vs other for the subline
  const social = ["instagram","facebook","tiktok","pinterest","twitter","youtube","linkedin"];
  const socialTotal  = social.reduce((s, k) => s + (byLinkType[k] || 0), 0);
  const websiteTotal = byLinkType["website"] || 0;
  const otherTotal   = rows.length - socialTotal - websiteTotal;

  return ok({
    total: rows.length,
    days,
    byLinkType,
    byEntityType,
    summary: { website: websiteTotal, social: socialTotal, other: Math.max(0, otherTotal) },
  });
}

// ── leaderboard ───────────────────────────────────────────────────────────────
async function handleLeaderboard(days: number, entityType: string, limit: number) {
  const since = sinceDate(days);
  let query = supabase
    .from("outbound_clicks")
    .select("entity_id, entity_type, link_type")
    .gte("created_at", since)
    .not("entity_id", "is", null);

  if (entityType !== "all") query = query.eq("entity_type", entityType);

  const { data, error } = await query;
  if (error) return err(error.message, 500);

  const rows = (data || []) as { entity_id: string; entity_type: string; link_type: string }[];

  // Aggregate by entity
  const counts: Record<string, { count: number; entityType: string; linkTypes: Record<string, number> }> = {};
  rows.forEach(row => {
    if (!counts[row.entity_id]) {
      counts[row.entity_id] = { count: 0, entityType: row.entity_type, linkTypes: {} };
    }
    counts[row.entity_id].count++;
    const lt = row.link_type || "other";
    counts[row.entity_id].linkTypes[lt] = (counts[row.entity_id].linkTypes[lt] || 0) + 1;
  });

  const ranked = Object.entries(counts)
    .map(([entityId, v]) => ({ entityId, ...v }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);

  // Enrich venue names
  const venueIds = ranked.filter(e => e.entityType === "venue").map(e => e.entityId);
  let nameMap: Record<string, string> = {};
  if (venueIds.length > 0) {
    const { data: venues } = await supabase
      .from("listings")
      .select("id, name")
      .in("id", venueIds);
    if (venues) venues.forEach((v: { id: string; name: string }) => { nameMap[v.id] = v.name; });
  }

  return ok({
    leaderboard: ranked.map(e => ({ ...e, name: nameMap[e.entityId] || null })),
    days,
  });
}

// ── venue (per-entity breakdown) ─────────────────────────────────────────────
async function handleVenue(entityId: string, days: number) {
  const { data, error } = await supabase
    .from("outbound_clicks")
    .select("link_type, created_at")
    .eq("entity_id", entityId)
    .gte("created_at", sinceDate(days))
    .order("created_at", { ascending: false });

  if (error) return err(error.message, 500);

  const rows = (data || []) as { link_type: string; created_at: string }[];
  const byLinkType = groupBy(rows as Record<string, unknown>[], "link_type");

  const byDay: Record<string, number> = {};
  rows.forEach(row => {
    const day = row.created_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return ok({
    total: rows.length,
    days,
    byLinkType,
    timeline: fillTimeline(byDay, days),
  });
}

// ── timeline (platform-wide) ─────────────────────────────────────────────────
async function handleTimeline(days: number) {
  const { data, error } = await supabase
    .from("outbound_clicks")
    .select("created_at, entity_type")
    .gte("created_at", sinceDate(days))
    .order("created_at", { ascending: true });

  if (error) return err(error.message, 500);

  const rows = (data || []) as { created_at: string; entity_type: string }[];
  const byDay: Record<string, number> = {};
  rows.forEach(row => {
    const day = row.created_at.slice(0, 10);
    byDay[day] = (byDay[day] || 0) + 1;
  });

  return ok({
    timeline: fillTimeline(byDay, days),
    total: rows.length,
    days,
  });
}

// ── batch (click counts per entity ID list) ───────────────────────────────────
async function handleBatch(entityIds: string[], days: number) {
  const { data, error } = await supabase
    .from("outbound_clicks")
    .select("entity_id")
    .in("entity_id", entityIds)
    .gte("created_at", sinceDate(days));

  if (error) return err(error.message, 500);

  const rows = (data || []) as { entity_id: string }[];
  const counts: Record<string, number> = {};
  rows.forEach(row => {
    if (!row.entity_id) return;
    counts[row.entity_id] = (counts[row.entity_id] || 0) + 1;
  });

  return ok({ counts, days });
}

// ── main handler ─────────────────────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return err("Method not allowed. Use POST.", 405);

  let body: Record<string, unknown>;
  try { body = await req.json(); }
  catch { return err("Invalid JSON body"); }

  const { action, days = 30, entityType = "venue", entityId, limit = 10, entityIds } = body;
  if (!action) return err("Missing action");

  switch (String(action)) {
    case "summary":     return handleSummary(Number(days));
    case "leaderboard": return handleLeaderboard(Number(days), String(entityType), Number(limit));
    case "venue":
      if (!entityId) return err("entityId required for venue action");
      return handleVenue(String(entityId), Number(days));
    case "timeline":    return handleTimeline(Number(days));
    case "batch":
      if (!Array.isArray(entityIds) || entityIds.length === 0) return err("entityIds array required");
      return handleBatch(entityIds as string[], Number(days));
    default:
      return err(`Unknown action: ${action}. Must be: summary | leaderboard | venue | timeline | batch`);
  }
});
