/**
 * publicationsAnalyticsService.js
 * Reader event tracking for the /publications flipbook.
 * All inserts are fire-and-forget — never block the reader UI.
 *
 * Events written to magazine_analytics:
 *   view        — issue opened in reader
 *   page_turn   — reader navigated to a new spread/page
 *   download    — PDF download triggered
 *   dwell       — time spent on a page spread (batched on navigate/close)
 *
 * view_count / download_count on magazine_issues are incremented
 * as a convenience denormalized counter (non-atomic, acceptable at this scale).
 */

import { supabase } from '../lib/supabaseClient';

const ANALYTICS_TABLE = 'magazine_analytics';
const ISSUES_TABLE    = 'magazine_issues';

// ── Session ID ────────────────────────────────────────────────────────────────
// Anonymous per-tab session identifier.
let _sessionId = null;
function getSessionId() {
  if (_sessionId) return _sessionId;
  try {
    const existing = sessionStorage.getItem('lwd_pub_session');
    if (existing) { _sessionId = existing; return _sessionId; }
  } catch {}
  _sessionId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  try { sessionStorage.setItem('lwd_pub_session', _sessionId); } catch {}
  return _sessionId;
}

// ── Device type ───────────────────────────────────────────────────────────────
function getDeviceType() {
  const w = window.innerWidth;
  if (w < 640)  return 'mobile';
  if (w < 1024) return 'tablet';
  return 'desktop';
}

// ── Core insert (fire-and-forget) ─────────────────────────────────────────────
async function insertEvent(payload) {
  try {
    await supabase.from(ANALYTICS_TABLE).insert({
      ...payload,
      session_id:  getSessionId(),
      device_type: getDeviceType(),
      created_at:  new Date().toISOString(),
    });
  } catch {}
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Call when the reader first opens for an issue.
 * Inserts a 'view' event and increments view_count.
 */
export async function trackIssueView(issueId, readerMode) {
  insertEvent({
    issue_id:    issueId,
    event_type:  'view',
    reader_mode: readerMode, // 'spread' or 'single'
  });

  // Increment view_count (best-effort, non-blocking)
  try {
    const { data } = await supabase
      .from(ISSUES_TABLE)
      .select('view_count')
      .eq('id', issueId)
      .single();
    if (data) {
      supabase
        .from(ISSUES_TABLE)
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq('id', issueId)
        .then(() => {}).catch(() => {});
    }
  } catch {}
}

/**
 * Call when the reader navigates to a new page / spread.
 * @param {string}  issueId
 * @param {number}  pageNumber    — the primary (left on desktop, or single on mobile) page
 * @param {string}  readerMode    — 'spread' | 'single'
 * @param {number}  [durationMs]  — optional dwell time for the PREVIOUS page
 * @param {number}  [prevPage]    — previous page number (for dwell event)
 */
export function trackPageTurn(issueId, pageNumber, readerMode, durationMs, prevPage) {
  // Page turn event
  insertEvent({
    issue_id:    issueId,
    page_number: pageNumber,
    event_type:  'page_turn',
    reader_mode: readerMode,
  });

  // Dwell event for the page we just left
  if (durationMs && durationMs > 500 && prevPage) {
    insertEvent({
      issue_id:    issueId,
      page_number: prevPage,
      event_type:  'dwell',
      reader_mode: readerMode,
      duration_ms: durationMs,
    });
  }
}

/**
 * Fetch per-page average dwell time for a heatmap.
 * Groups dwell events by page_number and computes avg duration_ms.
 * @param {string} issueId
 * @returns {{ data: Array<{page_number, avg_dwell_ms, views}>, error }}
 */
export async function fetchPageHeatmap(issueId) {
  const { data, error } = await supabase
    .from(ANALYTICS_TABLE)
    .select('page_number, duration_ms')
    .eq('issue_id', issueId)
    .eq('event_type', 'dwell')
    .not('page_number', 'is', null);
  if (error) return { data: [], error };

  // Aggregate: avg dwell per page
  const map = {};
  (data || []).forEach(r => {
    if (!map[r.page_number]) map[r.page_number] = { total: 0, count: 0 };
    map[r.page_number].total += r.duration_ms;
    map[r.page_number].count++;
  });
  const result = Object.entries(map).map(([page, v]) => ({
    page_number:  parseInt(page),
    avg_dwell_ms: Math.round(v.total / v.count),
    views:        v.count,
  })).sort((a, b) => b.avg_dwell_ms - a.avg_dwell_ms);
  return { data: result, error: null };
}

/**
 * Call when the user triggers a PDF download.
 * Inserts a 'download' event and increments download_count.
 */
export async function trackDownload(issueId) {
  insertEvent({
    issue_id:   issueId,
    event_type: 'download',
  });

  // Increment download_count (best-effort)
  try {
    const { data } = await supabase
      .from(ISSUES_TABLE)
      .select('download_count')
      .eq('id', issueId)
      .single();
    if (data) {
      supabase
        .from(ISSUES_TABLE)
        .update({ download_count: (data.download_count || 0) + 1 })
        .eq('id', issueId)
        .then(() => {}).catch(() => {});
    }
  } catch {}
}
