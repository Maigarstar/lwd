/**
 * emailAnalyticsService.js
 *
 * Email engagement analytics computed from outreach_emails data.
 *
 * Open rate is directional only - pixel blocking means true opens are under-counted.
 * Reply rate is the primary hard engagement metric.
 *
 * Provides:
 *   - Overall KPIs: open rate, reply rate, open-to-reply %, avg reply time
 *   - Subject line performance table
 *   - Send time heatmap (24 hourly buckets by reply rate)
 *   - Volume trend (last 30 days)
 *   - Per-campaign attribution
 */

import { supabase } from '../lib/supabaseClient';

// ── Helper ────────────────────────────────────────────────────────────────────

function pct(num, denom) {
  return denom > 0 ? Math.round((num / denom) * 100) : 0;
}

function hoursLabel(h) {
  if (h === 0) return '12am';
  if (h < 12)  return `${h}am`;
  if (h === 12) return '12pm';
  return `${h - 12}pm`;
}

// ── Main analytics fetch ───────────────────────────────────────────────────────

/**
 * Fetch and compute email analytics from outreach_emails.
 *
 * @param {object} opts
 *   @param {string} [opts.pipeline_id]  - Restrict to prospects in this pipeline
 *   @param {Date}   [opts.dateFrom]     - Start of date range
 *   @param {Date}   [opts.dateTo]       - End of date range (defaults to now)
 * @returns {Promise<{
 *   totalSent: number,
 *   openRate: number,
 *   replyRate: number,
 *   openToReplyRate: number,
 *   avgReplyHours: number,
 *   subjectLines: Array,
 *   sendTimePatterns: Array,
 *   volumeByDay: Array,
 *   openRateNote: string,
 * }>}
 */
export async function fetchEmailAnalytics({ pipeline_id, dateFrom, dateTo } = {}) {
  // Fetch outreach_emails + prospect pipeline_id in one join
  let query = supabase
    .from('outreach_emails')
    .select(`
      id, email_type, subject, status, sent_at, replied_at, opened_at, open_count, campaign_id,
      prospects!inner(pipeline_id)
    `)
    // Exclude note entries (custom emails logged as system notes have no meaningful subject)
    .not('sent_at', 'is', null);

  if (pipeline_id) {
    query = query.eq('prospects.pipeline_id', pipeline_id);
  }
  if (dateFrom) {
    query = query.gte('sent_at', dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom);
  }
  if (dateTo) {
    query = query.lte('sent_at', dateTo instanceof Date ? dateTo.toISOString() : dateTo);
  }

  const { data, error } = await query.order('sent_at', { ascending: false });
  if (error) throw error;

  const rows = (data || []).filter(r =>
    // Exclude pure system note entries (blank subjects)
    r.subject && r.subject.trim().length > 0
  );

  // ── KPIs ────────────────────────────────────────────────────────────────────
  const totalSent      = rows.length;
  const opens          = rows.filter(r => r.opened_at != null).length;
  const replies        = rows.filter(r => r.status === 'replied').length;
  const openAndReplied = rows.filter(r => r.opened_at != null && r.status === 'replied').length;

  const openRate       = pct(opens, totalSent);
  const replyRate      = pct(replies, totalSent);
  const openToReplyRate = pct(openAndReplied, opens);

  // Average time to reply (in hours)
  const replyTimes = rows
    .filter(r => r.status === 'replied' && r.replied_at && r.sent_at)
    .map(r => (new Date(r.replied_at) - new Date(r.sent_at)) / 3600000);
  const avgReplyHours = replyTimes.length > 0
    ? Math.round(replyTimes.reduce((a, b) => a + b, 0) / replyTimes.length)
    : 0;

  // ── Subject line performance ─────────────────────────────────────────────────
  const subjectMap = {};
  for (const r of rows) {
    const key = r.subject.trim();
    if (!subjectMap[key]) subjectMap[key] = { subject: key, sent: 0, opens: 0, replies: 0, openAndReplied: 0 };
    subjectMap[key].sent++;
    if (r.opened_at) subjectMap[key].opens++;
    if (r.status === 'replied') subjectMap[key].replies++;
    if (r.opened_at && r.status === 'replied') subjectMap[key].openAndReplied++;
  }

  const subjectLines = Object.values(subjectMap)
    .filter(s => s.sent >= 2) // require at least 2 sends for meaningful data
    .map(s => ({
      subject:      s.subject,
      sent:         s.sent,
      opens:        s.opens,
      openRate:     pct(s.opens, s.sent),
      replies:      s.replies,
      replyRate:    pct(s.replies, s.sent),
      openToReply:  pct(s.openAndReplied, s.opens),
    }))
    .sort((a, b) => b.openRate - a.openRate)
    .slice(0, 10);

  // ── Send time patterns (hourly buckets 0-23) ─────────────────────────────────
  const hourBuckets = Array.from({ length: 24 }, (_, h) => ({
    hour:      h,
    label:     hoursLabel(h),
    sent:      0,
    opens:     0,
    replies:   0,
    openRate:  0,
    replyRate: 0,
  }));

  for (const r of rows) {
    if (!r.sent_at) continue;
    const h = new Date(r.sent_at).getHours();
    hourBuckets[h].sent++;
    if (r.opened_at) hourBuckets[h].opens++;
    if (r.status === 'replied') hourBuckets[h].replies++;
  }

  const sendTimePatterns = hourBuckets.map(b => ({
    ...b,
    openRate:  pct(b.opens, b.sent),
    replyRate: pct(b.replies, b.sent),
  }));

  // ── Volume by day (last 30 days) ─────────────────────────────────────────────
  const dayMap = {};
  const now    = new Date();
  // Pre-fill last 30 days with zeros
  for (let i = 29; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    dayMap[key] = { date: key, sent: 0, opened: 0, replied: 0 };
  }

  for (const r of rows) {
    if (!r.sent_at) continue;
    const key = r.sent_at.slice(0, 10);
    if (!dayMap[key]) continue; // outside 30-day window
    dayMap[key].sent++;
    if (r.opened_at) dayMap[key].opened++;
    if (r.status === 'replied') dayMap[key].replied++;
  }

  const volumeByDay = Object.values(dayMap);

  return {
    totalSent,
    openRate,
    replyRate,
    openToReplyRate,
    avgReplyHours,
    subjectLines,
    sendTimePatterns,
    volumeByDay,
    // Shown in analytics UI so users understand the caveat
    openRateNote: 'Open rate is approximate. Some email clients preload or block tracking pixels. Use reply rate as your primary engagement metric.',
  };
}

// ── Per-campaign attribution ───────────────────────────────────────────────────

/**
 * Fetch analytics broken down by campaign for a given date range.
 * Returns: sent, opened, replied, openRate, replyRate, openToReplyRate per campaign.
 *
 * @param {object} opts
 *   @param {Date} [opts.dateFrom]
 *   @param {Date} [opts.dateTo]
 * @returns {Promise<Array<{ campaign_id, campaign_name, sent, opens, replies, openRate, replyRate, openToReplyRate }>>}
 */
export async function fetchCampaignAttribution({ dateFrom, dateTo } = {}) {
  let query = supabase
    .from('outreach_emails')
    .select('campaign_id, status, opened_at, sent_at, prospect_campaigns!inner(name)')
    .not('campaign_id', 'is', null);

  if (dateFrom) query = query.gte('sent_at', dateFrom instanceof Date ? dateFrom.toISOString() : dateFrom);
  if (dateTo)   query = query.lte('sent_at', dateTo instanceof Date ? dateTo.toISOString() : dateTo);

  const { data, error } = await query;
  if (error) throw error;
  const rows = data || [];

  const bycamp = {};
  for (const r of rows) {
    const id = r.campaign_id;
    if (!bycamp[id]) bycamp[id] = {
      campaign_id:   id,
      campaign_name: r.prospect_campaigns?.name || 'Unknown',
      sent: 0, opens: 0, replies: 0, openAndReplied: 0,
    };
    bycamp[id].sent++;
    if (r.opened_at) bycamp[id].opens++;
    if (r.status === 'replied') bycamp[id].replies++;
    if (r.opened_at && r.status === 'replied') bycamp[id].openAndReplied++;
  }

  return Object.values(bycamp).map(c => ({
    campaign_id:    c.campaign_id,
    campaign_name:  c.campaign_name,
    sent:           c.sent,
    opens:          c.opens,
    replies:        c.replies,
    openRate:       pct(c.opens, c.sent),
    replyRate:      pct(c.replies, c.sent),
    openToReplyRate: pct(c.openAndReplied, c.opens),
  })).sort((a, b) => b.sent - a.sent);
}
