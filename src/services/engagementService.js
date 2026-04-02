/**
 * engagementService.js
 * Lightweight engagement intelligence layer.
 * Pure computation over already-loaded data (prospects + outreach_emails).
 * No extra DB queries - reuses history fetched by ProspectPanel and prospect
 * fields (last_contacted_at, next_follow_up_at) already on Kanban cards.
 */

// ── Status thresholds ──────────────────────────────────────────────────────────

const HOT_REPLY_HOURS   = 48;   // reply within 48h = Hot Opportunity
const ACTIVE_DAYS       = 7;    // contacted within 7d = Active
const COOLING_MAX_DAYS  = 14;   // 7-14d = Cooling, >14d = At Risk

// ── Status config ─────────────────────────────────────────────────────────────

export const ENGAGEMENT_STATUS_CONFIG = {
  'Hot Opportunity': { color: '#f97316', bg: 'rgba(249,115,22,0.12)', dot: '#f97316' },
  'Active':          { color: '#22c55e', bg: 'rgba(34,197,94,0.10)',  dot: '#22c55e' },
  'Cooling':         { color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', dot: '#f59e0b' },
  'At Risk':         { color: '#ef4444', bg: 'rgba(239,68,68,0.10)',  dot: '#ef4444' },
};

// ── Core status logic ─────────────────────────────────────────────────────────

/**
 * Determine engagement status from timing signals.
 * @param {string|null} lastContactedAt - ISO string of last outbound email sent
 * @param {string|null} lastReplyAt     - ISO string of most recent reply
 * @param {boolean}     isOverdue       - true if next_follow_up_at is in the past
 */
export function calcEngagementStatus({ lastContactedAt, lastReplyAt, isOverdue }) {
  const now = new Date();

  // Hot Opportunity: reply received within last 48 hours
  if (lastReplyAt) {
    const replyHours = (now - new Date(lastReplyAt)) / (1000 * 60 * 60);
    if (replyHours <= HOT_REPLY_HOURS) return 'Hot Opportunity';
  }

  const daysSinceContact = lastContactedAt
    ? (now - new Date(lastContactedAt)) / (1000 * 60 * 60 * 24)
    : 9999;

  // At Risk: overdue follow-up or not contacted in over 14 days
  if (isOverdue || daysSinceContact > COOLING_MAX_DAYS) return 'At Risk';

  // Active: contacted within 7 days
  if (daysSinceContact <= ACTIVE_DAYS) return 'Active';

  // Cooling: 7-14 days since last contact
  return 'Cooling';
}

// ── Full engagement computation (uses already-loaded history) ─────────────────

/**
 * Compute all engagement metrics for a prospect.
 * Call this inside ProspectPanel once history is loaded - zero extra queries.
 *
 * @param {object}   prospect - prospect row
 * @param {object[]} history  - outreach_emails rows for this prospect
 * @returns {object} engagement metrics
 */
export function computeEngagement(prospect, history) {
  // Only count actual sent/received emails, not internal notes
  const emails = (history || []).filter(h => h.direction !== 'internal');

  const emailsSent   = emails.length;
  const opens        = emails.filter(h => h.opened_at).length;
  const replies      = emails.filter(h => h.status === 'replied').length;

  // Most recent outbound email date (history is sorted sent_at DESC)
  const lastOutbound   = emails[0];
  const lastContactedAt = lastOutbound?.sent_at || prospect.last_contacted_at || null;

  // Most recent reply
  const lastReplyEntry = emails.find(h => h.status === 'replied');
  const lastReplyAt    = lastReplyEntry?.replied_at || null;

  // Days in pipeline
  const created = prospect.created_at ? new Date(prospect.created_at) : new Date();
  const daysInPipeline = Math.max(0, Math.floor((new Date() - created) / (1000 * 60 * 60 * 24)));

  // Overdue follow-up
  const isOverdue = !!(
    prospect.next_follow_up_at &&
    new Date(prospect.next_follow_up_at) < new Date()
  );

  const engagementStatus = calcEngagementStatus({ lastContactedAt, lastReplyAt, isOverdue });

  return {
    emailsSent,
    opens,
    replies,
    lastContacted:    lastContactedAt,
    daysInPipeline,
    engagementStatus,
    isOverdue,
  };
}

// ── Kanban dot color (prospect row only, no history needed) ───────────────────

/**
 * Returns a CSS color for the engagement dot on Kanban cards.
 * Uses only prospect-level fields already present on the card.
 *
 * green  (#22c55e) = contacted within 7 days
 * yellow (#f59e0b) = contacted 7-14 days ago
 * red    (#ef4444) = never contacted, overdue, or >14 days
 */
export function engagementDotColor(prospect) {
  const now = new Date();

  const isOverdue = !!(
    prospect.next_follow_up_at &&
    new Date(prospect.next_follow_up_at) < now
  );
  if (isOverdue) return '#ef4444';

  const lastContacted = prospect.last_contacted_at;
  if (!lastContacted) return '#ef4444'; // never contacted

  const daysSince = (now - new Date(lastContacted)) / (1000 * 60 * 60 * 24);

  if (daysSince <= ACTIVE_DAYS)      return '#22c55e';
  if (daysSince <= COOLING_MAX_DAYS) return '#f59e0b';
  return '#ef4444';
}

// ── Formatting helpers ────────────────────────────────────────────────────────

export function fmtLastContact(isoString) {
  if (!isoString) return 'Never';
  const days = (new Date() - new Date(isoString)) / (1000 * 60 * 60 * 24);
  if (days < 1)   return 'Today';
  if (days < 2)   return 'Yesterday';
  if (days < 7)   return `${Math.floor(days)}d ago`;
  if (days < 30)  return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

export function fmtDaysInPipeline(days) {
  if (days < 1)  return 'Today';
  if (days < 7)  return `${days}d`;
  if (days < 30) return `${Math.floor(days / 7)}w`;
  return `${Math.floor(days / 30)}mo ${days % 30}d`;
}
