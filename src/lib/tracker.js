// ═══════════════════════════════════════════════════════════════════════════
// LWD Visitor Tracker
// Admin-only intelligence layer — fires silently, never blocks the user.
// Sends: page_view on route change, heartbeat every 30s, intent events on
// key actions (shortlist, compare, enquire, outbound click, Aura query).
// Session ID stored in sessionStorage — ephemeral, anonymous, no PII.
// Geo: Cloudflare headers (production) with ipapi.co client-side fallback.
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from "./supabaseClient";

// ── Session ID ───────────────────────────────────────────────────────────────

function getSessionId() {
  const KEY = "lwd_sid";
  let id = sessionStorage.getItem(KEY);
  if (!id) {
    id = typeof crypto?.randomUUID === "function"
      ? crypto.randomUUID()
      : Date.now().toString(36) + Math.random().toString(36).slice(2);
    sessionStorage.setItem(KEY, id);
  }
  return id;
}

// ── UTM from URL ─────────────────────────────────────────────────────────────

function getUTM() {
  const params = new URLSearchParams(window.location.search);
  return {
    utm_source:   params.get("utm_source")   || undefined,
    utm_medium:   params.get("utm_medium")   || undefined,
    utm_campaign: params.get("utm_campaign") || undefined,
  };
}

// ── Client-side geo (fallback when CF headers are absent) ────────────────────
// Fetches once per session from ipapi.co (free, no key, 30k/month).
// Result cached in sessionStorage — zero cost on subsequent pages.

let _geoPromise = null;

function getGeo() {
  if (_geoPromise) return _geoPromise;

  const cached = sessionStorage.getItem("lwd_geo");
  if (cached) {
    try {
      _geoPromise = Promise.resolve(JSON.parse(cached));
      return _geoPromise;
    } catch { /* fall through to fetch */ }
  }

  _geoPromise = fetch("https://ipapi.co/json/", {
    signal: AbortSignal.timeout(4000),
  })
    .then(r => r.json())
    .then(d => {
      const geo = {
        geo_lat:          d.latitude     ?? null,
        geo_lng:          d.longitude    ?? null,
        geo_country_code: d.country_code ?? null,
        geo_country_name: d.country_name ?? null,
        geo_city:         d.city         ?? null,
        geo_region:       d.region       ?? null,
        geo_isp:          d.org          ?? null,  // e.g. "AS5089 Virgin Media Limited"
      };
      sessionStorage.setItem("lwd_geo", JSON.stringify(geo));
      return geo;
    })
    .catch(() => ({}));   // silent — geo failure must never break tracking

  return _geoPromise;
}

// ── Listing context ───────────────────────────────────────────────────────────
// Set by listing pages (VenueProfile, PlannerProfile, Showcase, etc.) on mount.
// Cleared on unmount. Attached to every event payload while set.
// This is the primary source for listing_id — never rely solely on URL parsing.

let _listingCtx = { listing_id: null, listing_slug: null, entity_type: null };

/**
 * Call on listing page mount once the entity id is known.
 * @param {string|null} listingId   — UUID of the venue/planner/vendor
 * @param {string|null} listingSlug — URL slug (for debugging + backfill)
 * @param {string|null} entityType  — 'venue' | 'planner' | 'vendor'
 */
export function setListingContext(listingId, listingSlug, entityType) {
  _listingCtx = {
    listing_id:   listingId   || null,
    listing_slug: listingSlug || null,
    entity_type:  entityType  || null,
  };
}

/**
 * Call on listing page unmount to clear the context.
 */
export function clearListingContext() {
  _listingCtx = { listing_id: null, listing_slug: null, entity_type: null };
}

// ── Core send ────────────────────────────────────────────────────────────────

async function send(event_type, extras = {}) {
  try {
    const geo = await getGeo();
    await supabase.functions.invoke("track-visit", {
      body: {
        session_id:  getSessionId(),
        event_type,
        path:        window.location.pathname,
        title:       document.title,
        user_agent:  navigator.userAgent,
        // Listing context — present when on a listing page, null everywhere else
        ..._listingCtx,
        ...geo,
        ...extras,
      },
    });
  } catch {
    // Silent — tracker errors must never reach the user
  }
}

// ── Heartbeat ────────────────────────────────────────────────────────────────

let _heartbeat = null;

function startHeartbeat() {
  stopHeartbeat();
  _heartbeat = setInterval(() => {
    if (!document.hidden) send("heartbeat");
  }, 30_000);
}

function stopHeartbeat() {
  if (_heartbeat) { clearInterval(_heartbeat); _heartbeat = null; }
}

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Call on every route/page change.
 * On first call also sends entry referrer + UTM.
 */
export function trackPageView() {
  const isFirst = !sessionStorage.getItem("lwd_entry");
  if (isFirst) sessionStorage.setItem("lwd_entry", window.location.pathname);

  send("page_view", {
    referrer: isFirst ? document.referrer || undefined : undefined,
    ...getUTM(),
  });
}

/**
 * Call for high-value intent events.
 * event_type: 'shortlist_add' | 'compare_add' | 'enquiry_started' |
 *             'enquiry_submitted' | 'outbound_click' | 'aura_query'
 */
export function trackEvent(event_type, metadata = {}) {
  send(event_type, { metadata });
}

/**
 * Init tracker: fire first page view + start heartbeat.
 * Call once in App on mount.
 */
export function initTracker() {
  getGeo();          // kick off geo fetch immediately so it's ready for first send
  trackPageView();
  startHeartbeat();
  window.addEventListener("beforeunload", stopHeartbeat, { once: true });
}

export { stopHeartbeat };
