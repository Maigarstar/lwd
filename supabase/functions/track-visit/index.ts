// ═══════════════════════════════════════════════════════════════════════════
// Supabase Edge Function: track-visit
// ═══════════════════════════════════════════════════════════════════════════
// Receives anonymous tracking events from the LWD client-side tracker.
// Reads Cloudflare geo headers for city-level location (no raw IP stored).
// Upserts live_sessions + inserts page_events (skips heartbeats in events).
//
// Always returns HTTP 200 so client-side is never disrupted by errors.
//
// Deploy (no JWT required — public endpoint):
//   supabase functions deploy track-visit --no-verify-jwt
// ═══════════════════════════════════════════════════════════════════════════

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL              = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Geo resolution ───────────────────────────────────────────────────────────
// Priority 1: Cloudflare headers (present when traffic routes through CF)
// Priority 2: Client-provided geo from ipapi.co (tracker.js fallback)
// This covers both Cloudflare and non-Cloudflare hosting environments.

function getGeo(req: Request, body: Record<string, unknown>) {
  const h   = req.headers;
  const lat = h.get("cf-iplatitude");
  const lng = h.get("cf-iplongitude");

  // CF headers present — use them (most accurate, zero latency)
  if (lat && lng) {
    return {
      country_code: h.get("cf-ipcountry") || null,
      country_name: null,  // resolved via COUNTRY_NAMES below
      city:         h.get("cf-ipcity")    || null,
      region:       h.get("cf-region")    || null,
      latitude:     parseFloat(lat),
      longitude:    parseFloat(lng),
      geo_source:   "cf",
    };
  }

  // Client-provided fallback (from ipapi.co, sent by tracker.js)
  const clientLat = body.geo_lat as number | null;
  const clientLng = body.geo_lng as number | null;
  if (clientLat && clientLng) {
    // Strip ASN prefix from org field: "AS5089 Virgin Media Limited" → "Virgin Media Limited"
    const rawIsp = (body.geo_isp as string) || null;
    const isp = rawIsp ? rawIsp.replace(/^AS\d+\s+/i, "").trim() : null;
    return {
      country_code: (body.geo_country_code as string) || null,
      country_name: (body.geo_country_name as string) || null,
      city:         (body.geo_city         as string) || null,
      region:       (body.geo_region       as string) || null,
      latitude:     clientLat,
      longitude:    clientLng,
      isp,
      geo_source:   "client",
    };
  }

  // No geo available
  return {
    country_code: null, country_name: null,
    city: null, region: null,
    latitude: null, longitude: null,
    geo_source: null,
  };
}

// ── Country name from ISO code ───────────────────────────────────────────────

const COUNTRY_NAMES: Record<string, string> = {
  GB: "United Kingdom", US: "United States", IT: "Italy", FR: "France",
  DE: "Germany", ES: "Spain", PT: "Portugal", GR: "Greece", CH: "Switzerland",
  AT: "Austria", NL: "Netherlands", BE: "Belgium", SE: "Sweden", NO: "Norway",
  DK: "Denmark", FI: "Finland", IE: "Ireland", AU: "Australia", NZ: "New Zealand",
  CA: "Canada", AE: "UAE", SA: "Saudi Arabia", ZA: "South Africa",
  BR: "Brazil", MX: "Mexico", AR: "Argentina", IN: "India", SG: "Singapore",
  JP: "Japan", TH: "Thailand", MY: "Malaysia", ID: "Indonesia", PH: "Philippines",
  HK: "Hong Kong", CN: "China", TW: "Taiwan", KR: "South Korea",
  TR: "Turkey", PL: "Poland", CZ: "Czech Republic", HU: "Hungary", RO: "Romania",
};

// ── UA parser (lightweight) ──────────────────────────────────────────────────

function parseUA(ua: string) {
  if (!ua) return { device_type: "Unknown", browser: "Unknown", os: "Unknown" };

  // Device
  const isMobile = /Mobi|Android|iPhone/.test(ua);
  const isTablet  = !isMobile && /iPad|Tablet/.test(ua);
  const device_type = isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop";

  // Browser
  let browser = "Other";
  if (/Edg\//.test(ua))            browser = "Edge";
  else if (/Chrome\//.test(ua))    browser = "Chrome";
  else if (/Safari\//.test(ua))    browser = "Safari";
  else if (/Firefox\//.test(ua))   browser = "Firefox";
  else if (/OPR\/|Opera\//.test(ua)) browser = "Opera";

  // OS
  let os = "Unknown";
  if (/Windows NT 10/.test(ua))       os = "Windows 10/11";
  else if (/Windows NT/.test(ua))     os = "Windows";
  else if (/iPhone|iPad/.test(ua)) {
    const m = ua.match(/OS ([\d_]+)/);
    os = m ? `iOS ${m[1].replace(/_/g, ".")}` : "iOS";
  } else if (/Android/.test(ua)) {
    const m = ua.match(/Android ([\d.]+)/);
    os = m ? `Android ${m[1]}` : "Android";
  } else if (/Mac OS X ([\d_]+)/.test(ua)) {
    const m = ua.match(/Mac OS X ([\d_]+)/);
    os = m ? `macOS ${m[1].replace(/_/g, ".")}` : "macOS";
  } else if (/Linux/.test(ua)) {
    os = "Linux";
  }

  return { device_type, browser, os };
}

// ── Main handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  // Always CORS-safe and always 200
  const headers = {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers });
  }

  try {
    const body = await req.json();
    const {
      session_id, event_type, path, title,
      user_agent, referrer, utm_source, utm_medium, utm_campaign,
      metadata,
      // Listing intelligence — set by listing pages, null everywhere else
      listing_id, listing_slug, entity_type,
    } = body;

    if (!session_id || !event_type) {
      return new Response(JSON.stringify({ ok: false, reason: "missing_fields" }), { status: 200, headers });
    }

    const geo     = getGeo(req, body);
    const ua      = parseUA(user_agent || "");
    const now     = new Date().toISOString();

    // ── 1. Check if session exists ───────────────────────────────────────────
    const { data: existing } = await supabase
      .from("live_sessions")
      .select("session_id, page_count, intent_count, entry_path")
      .eq("session_id", session_id)
      .maybeSingle();

    const isNew          = !existing;
    const isIntentEvent  = ["shortlist_add","compare_add","enquiry_started","enquiry_submitted","outbound_click","aura_query"].includes(event_type);
    const isPageView     = event_type === "page_view";

    if (isNew) {
      // Insert new session
      await supabase.from("live_sessions").insert({
        session_id,
        first_seen_at:  now,
        last_seen_at:   now,
        country_code:   geo.country_code,
        country_name:   geo.country_code ? (COUNTRY_NAMES[geo.country_code] || geo.country_code) : null,
        city:           geo.city,
        region:         geo.region,
        latitude:       geo.latitude,
        longitude:      geo.longitude,
        isp:            (geo as Record<string, unknown>).isp as string || null,
        device_type:    ua.device_type,
        browser:        ua.browser,
        os:             ua.os,
        user_agent:     user_agent || null,
        current_path:   path || null,
        current_title:  title || null,
        entry_path:     path || null,
        referrer:       referrer || null,
        utm_source:     utm_source || null,
        utm_medium:     utm_medium || null,
        utm_campaign:   utm_campaign || null,
        page_count:              1,
        intent_count:            isIntentEvent ? 1 : 0,
        current_listing_id:      listing_id   || null,
        current_listing_slug:    listing_slug || null,
        current_entity_type:     entity_type  || null,
      });
    } else {
      // Update existing session
      const updates: Record<string, unknown> = {
        last_seen_at:         now,
        current_path:         path || null,
        current_title:        title || null,
        // Always update current listing context — null when leaving a listing page
        current_listing_id:   listing_id   ?? null,
        current_listing_slug: listing_slug ?? null,
        current_entity_type:  entity_type  ?? null,
      };
      if (isPageView)    updates.page_count    = (existing.page_count || 0) + 1;
      if (isIntentEvent) updates.intent_count  = (existing.intent_count || 0) + 1;
      // Refresh geo if previously unknown (e.g. first call had no CF headers)
      if (!existing.country_code && geo.country_code) {
        updates.country_code  = geo.country_code;
        updates.country_name  = COUNTRY_NAMES[geo.country_code] || geo.country_code;
        updates.city          = geo.city;
        updates.region        = geo.region;
        updates.latitude      = geo.latitude;
        updates.longitude     = geo.longitude;
        updates.isp           = (geo as Record<string, unknown>).isp || null;
      }

      await supabase.from("live_sessions").update(updates).eq("session_id", session_id);
    }

    // ── 2. Append to page_events (skip heartbeats) ──────────────────────────
    if (event_type !== "heartbeat") {
      await supabase.from("page_events").insert({
        session_id,
        event_type,
        path:         path || null,
        title:        title || null,
        metadata:     metadata || null,
        listing_id:   listing_id   || null,
        listing_slug: listing_slug || null,
        entity_type:  entity_type  || null,
      });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers });

  } catch (err) {
    // Always 200 — tracker must never surface errors to users
    console.error("[track-visit]", err);
    return new Response(JSON.stringify({ ok: false, reason: "internal_error" }), { status: 200, headers });
  }
});
