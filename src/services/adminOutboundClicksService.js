/**
 * adminOutboundClicksService.js
 *
 * Thin fetch wrapper around the admin-outbound-clicks edge function.
 * The edge function uses service_role to bypass insert-only RLS on outbound_clicks.
 * Never use the Supabase client directly for this table from the browser.
 *
 * Actions proxied:
 *   summary     — platform total + breakdown by link_type
 *   leaderboard — top N venues or vendors by click count
 *   venue       — per-entity breakdown + daily timeline
 *   timeline    — platform-wide daily clicks (last N days)
 *   batch       — click counts for an array of entity IDs
 */

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-outbound-clicks`;
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

async function callEdge(payload) {
  if (!EDGE_URL || EDGE_URL.startsWith('undefined')) {
    throw new Error('Supabase URL not configured');
  }
  const res = await fetch(EDGE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Edge function error');
  return json.data;
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform summary — total + byLinkType + byEntityType + {website, social, other}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number} days
 * @returns {{ total, days, byLinkType, byEntityType, summary: { website, social, other } }}
 */
export async function fetchClickSummary(days = 30) {
  try {
    return await callEdge({ action: 'summary', days });
  } catch (e) {
    console.warn('[outboundClicks] fetchClickSummary:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Leaderboard — top N entities by click count
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {object} opts
 * @param {number}  opts.days
 * @param {string}  opts.entityType  'venue' | 'vendor' | 'all'
 * @param {number}  opts.limit
 */
export async function fetchClickLeaderboard({ days = 30, entityType = 'venue', limit = 10 } = {}) {
  try {
    return await callEdge({ action: 'leaderboard', days, entityType, limit });
  } catch (e) {
    console.warn('[outboundClicks] fetchClickLeaderboard:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Per-entity (venue/vendor) breakdown + timeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string} entityId
 * @param {number} days
 */
export async function fetchVenueClicks(entityId, days = 30) {
  try {
    return await callEdge({ action: 'venue', entityId, days });
  } catch (e) {
    console.warn('[outboundClicks] fetchVenueClicks:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Platform-wide daily timeline
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {number} days
 */
export async function fetchClickTimeline(days = 30) {
  try {
    return await callEdge({ action: 'timeline', days });
  } catch (e) {
    console.warn('[outboundClicks] fetchClickTimeline:', e.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Batch — click counts for a list of entity IDs (listing cards)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @param {string[]} entityIds
 * @param {number}   days
 * @returns {{ counts: Record<string, number>, days }}
 */
export async function fetchBatchClickCounts(entityIds, days = 30) {
  if (!entityIds || entityIds.length === 0) return { counts: {}, days };
  try {
    return await callEdge({ action: 'batch', entityIds, days });
  } catch (e) {
    console.warn('[outboundClicks] fetchBatchClickCounts:', e.message);
    return { counts: {}, days };
  }
}
