/**
 * adminUserEventsService.js
 *
 * Thin fetch wrapper around the admin-user-events edge function.
 * Uses service_role via edge function to bypass insert-only RLS on user_events.
 */

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-user-events`;
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

/** Platform event summary — totals by type + highlights */
export async function fetchEventSummary(days = 30) {
  try { return await callEdge({ action: 'summary', days }); }
  catch (e) { console.warn('[userEvents] fetchEventSummary:', e.message); return null; }
}

/** Top search queries + zero-result queries */
export async function fetchSearchQueries(days = 30, limit = 20) {
  try { return await callEdge({ action: 'search_queries', days, limit }); }
  catch (e) { console.warn('[userEvents] fetchSearchQueries:', e.message); return null; }
}

/** Enquiry funnel — started vs submitted, per entity + platform rate */
export async function fetchEnquiryFunnel(days = 30, limit = 10) {
  try { return await callEdge({ action: 'enquiry_funnel', days, limit }); }
  catch (e) { console.warn('[userEvents] fetchEnquiryFunnel:', e.message); return null; }
}

/** Most shortlisted venues/vendors */
export async function fetchShortlistTop(days = 30, limit = 10) {
  try { return await callEdge({ action: 'shortlist_top', days, limit }); }
  catch (e) { console.warn('[userEvents] fetchShortlistTop:', e.message); return null; }
}

/** Daily timeline by event type */
export async function fetchEventTimeline(days = 30, eventTypes = []) {
  try { return await callEdge({ action: 'timeline', days, eventTypes }); }
  catch (e) { console.warn('[userEvents] fetchEventTimeline:', e.message); return null; }
}

/** All events for a specific entity (venue/vendor drill-down) */
export async function fetchEntityEvents(entityId, days = 30) {
  try { return await callEdge({ action: 'entity_events', entityId, days }); }
  catch (e) { console.warn('[userEvents] fetchEntityEvents:', e.message); return null; }
}

/** Compare intelligence — most compared, top pairs, per-venue competitors */
export async function fetchCompareTop(days = 30, limit = 10) {
  try { return await callEdge({ action: 'compare_top', days, limit }); }
  catch (e) { console.warn('[userEvents] fetchCompareTop:', e.message); return null; }
}
