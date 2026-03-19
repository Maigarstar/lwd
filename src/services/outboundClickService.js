/**
 * outboundClickService.js
 *
 * Three responsibilities, deliberately separated:
 *   1. Session ID management       — persistent identifier for the browser session
 *   2. Modal frequency control     — show exit modal once per session only
 *   3. Outbound click tracking     — fire-and-forget insert to outbound_clicks
 *
 * Tracking is always async and non-blocking. No awaits at call site.
 */

import { supabase } from '../lib/supabaseClient';
import { markOutboundPending } from './userEventService';

// ─────────────────────────────────────────────────────────────────────────────
// Session ID
// Generated once per session, stored in sessionStorage.
// Used as the primary correlation key in outbound_clicks.
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_ID_KEY  = 'lwd_session_id';
const MODAL_SEEN_KEY  = 'lwd_ext_modal_seen_domains'; // JSON array of hostnames

export function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Modal frequency control
// Modal shows once per session. After that, external links open directly.
// Social media links always skip the modal entirely (but may still track).
// ─────────────────────────────────────────────────────────────────────────────

// Returns true only if this specific domain has already been introduced this session.
// Each new destination gets its own modal — once per domain per session.
export function hasSeenModalThisSession(url) {
  try {
    const hostname = new URL(url).hostname;
    const seen = JSON.parse(sessionStorage.getItem(MODAL_SEEN_KEY) || '[]');
    return seen.includes(hostname);
  } catch {
    return false;
  }
}

export function markModalSeen(url) {
  try {
    const hostname = new URL(url).hostname;
    const seen = JSON.parse(sessionStorage.getItem(MODAL_SEEN_KEY) || '[]');
    if (!seen.includes(hostname)) {
      seen.push(hostname);
      sessionStorage.setItem(MODAL_SEEN_KEY, JSON.stringify(seen));
    }
  } catch {
    // sessionStorage unavailable — silently ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Outbound click tracking
//
// Standardised link_type values:
//   website | brochure | instagram | facebook | linkedin | pinterest |
//   tiktok  | twitter  | youtube   | whatsapp | email
//
// Rules:
//   - Modal links   → call trackExternalClick() when user clicks CONTINUE
//   - Social links  → call trackExternalClick() immediately on click
//   - Always fire-and-forget. Never block the redirect.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} params
 * @param {'venue'|'vendor'} params.entityType
 * @param {string|null}      params.entityId    — venue or vendor uuid
 * @param {string|null}      params.venueId     — always set when originating from a venue page
 * @param {string}           params.linkType    — see standardised values above
 * @param {string}           params.url
 */
export function trackExternalClick({ entityType, entityId, venueId, linkType, url }) {
  if (!supabase) return;

  const payload = {
    entity_type : entityType  || null,
    entity_id   : entityId    || null,
    venue_id    : venueId     || null,
    link_type   : linkType    || 'website',
    url         : url         || null,
    session_id  : getSessionId(),
    user_id     : null,               // reserved for future auth integration
  };

  // Store pending return marker — detected by initReturnDetection() visibilitychange
  markOutboundPending({ entityType, entityId, linkType, url });

  // Fire and forget — never block the redirect
  supabase
    .from('outbound_clicks')
    .insert(payload)
    .then(() => {})
    .catch(() => {});
}
