// ═══════════════════════════════════════════════════════════════════════════
// LWD Visitor Tracker
// Admin-only intelligence layer — fires silently, never blocks the user.
// Sends: page_view on route change, heartbeat every 30s, intent events on
// key actions (shortlist, compare, enquire, outbound click, Aura query).
// Session ID stored in sessionStorage — ephemeral, anonymous, no PII.
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

// ── Core send ────────────────────────────────────────────────────────────────

async function send(event_type, extras = {}) {
  try {
    await supabase.functions.invoke("track-visit", {
      body: {
        session_id:  getSessionId(),
        event_type,
        path:        window.location.pathname,
        title:       document.title,
        user_agent:  navigator.userAgent,
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
  trackPageView();
  startHeartbeat();
  // Stop heartbeat when tab closes
  window.addEventListener("beforeunload", stopHeartbeat, { once: true });
}

export { stopHeartbeat };
