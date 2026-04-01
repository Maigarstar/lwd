// ═══════════════════════════════════════════════════════════════════════════
// Canonical Lead Status Model — single source of truth
// Used by: CRM module, edge functions, lead engine, dashboards
//
// Statuses are minimal by design. Partner workflow detail lives in
// dedicated metadata fields (vendor_notified_at, responded_at, etc).
// ═══════════════════════════════════════════════════════════════════════════

export const LEAD_STATUSES = [
  { key: 'new',           label: 'New',           color: '#3b82f6', bg: 'rgba(59,130,246,0.1)',   order: 0 },
  { key: 'qualified',     label: 'Qualified',     color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)',   order: 1 },
  { key: 'engaged',       label: 'Engaged',       color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',    order: 2 },
  { key: 'proposal_sent', label: 'Proposal Sent', color: '#ec4899', bg: 'rgba(236,72,153,0.1)',   order: 3 },
  { key: 'booked',        label: 'Booked',        color: '#16a34a', bg: 'rgba(22,163,74,0.1)',    order: 4 },
  { key: 'lost',          label: 'Lost',          color: '#ef4444', bg: 'rgba(239,68,68,0.1)',    order: 5 },
  { key: 'spam',          label: 'Spam',          color: '#9ca3af', bg: 'rgba(156,163,175,0.1)',  order: 6 },
];

// Quick lookup map: key → config
export const STATUS_MAP = Object.fromEntries(LEAD_STATUSES.map(s => [s.key, s]));

// Pipeline statuses (excludes spam — not a sales stage)
export const PIPELINE_STATUSES = LEAD_STATUSES.filter(s => s.key !== 'spam');

// Valid status keys (for validation)
export const VALID_STATUS_KEYS = LEAD_STATUSES.map(s => s.key);

// Status dot color lookup
export const statusColor = (status) => STATUS_MAP[status]?.color || '#6b7280';
export const statusBg = (status) => STATUS_MAP[status]?.bg || 'rgba(107,114,128,0.1)';
export const statusLabel = (status) => STATUS_MAP[status]?.label || status || 'Unknown';

// Lead score color
export const scoreColor = (score) =>
  score >= 70 ? '#10b981' :
  score >= 40 ? '#f59e0b' :
  '#ef4444';

// Lead score calculation — persisted to DB on write, computed client-side for preview
export function calcLeadScore(lead) {
  let score = 0;
  const req = lead.requirements_json || {};

  // Contact completeness
  if (lead.phone) score += 10;
  if (req.website) score += 8;
  if (req.interests?.length) score += Math.min(req.interests.length * 7, 28);

  // Source quality
  if (lead.lead_source === 'Partner Enquiry Form') score += 20;
  else if (lead.lead_source?.toLowerCase().includes('venue')) score += 15;
  else if (lead.lead_source) score += 8;

  // Engagement signals
  if (lead.message && lead.message.length > 80) score += 7;

  // Status progression bonus
  const statusBonus = {
    new: 0, qualified: 12, engaged: 20,
    proposal_sent: 35, booked: 55, lost: 0, spam: 0,
  };
  score += statusBonus[lead.status || 'new'] || 0;

  return Math.min(100, score);
}

// Priority levels (from Leads module — preserved)
export const LEAD_PRIORITIES = [
  { key: 'urgent', label: 'Urgent', color: '#ef4444' },
  { key: 'high',   label: 'High',   color: '#f59e0b' },
  { key: 'normal', label: 'Normal', color: '#6b7280' },
  { key: 'low',    label: 'Low',    color: '#9ca3af' },
];

// Lead type labels
export const LEAD_TYPES = [
  { key: 'venue_enquiry',   label: 'Venue' },
  { key: 'vendor_enquiry',  label: 'Vendor' },
  { key: 'couple_enquiry',  label: 'Couple' },
  { key: 'aura_chat',       label: 'Aura' },
  { key: 'partner_enquiry', label: 'Partner' },
  { key: 'manual',          label: 'Manual' },
];

// Source labels (human-readable)
export const SOURCE_LABELS = {
  'Partner Enquiry Form': 'Partner Enquiry',
  'Sticky Enquiry Form':  'Venue Enquiry',
  'Venue Enquiry Form':   'Venue Enquiry',
  'Contact Form':         'Contact Form',
  'Admin CRM':            'Manual Entry',
  'venue_page':           'Venue Page',
  'aura_chat':            'Aura AI',
};
