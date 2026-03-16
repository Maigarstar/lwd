/**
 * leadScoringService.js
 * Prospect lead scoring: 0-100.
 *
 * Score components:
 *   Profile completeness  0-15
 *   Package / value tier  0-20
 *   Location              0-10
 *   Stage progression     0-25
 *   Engagement behaviour  0-30
 * Total max: 100
 *
 * Color thresholds:
 *   0-30   #ef4444  Cold
 *   31-55  #f97316  Warming
 *   56-75  #f59e0b  Hot
 *   76-100 #22c55e  High Priority
 */

import { supabase } from '../lib/supabaseClient';

// ── Scoring constants ─────────────────────────────────────────────────────────

const PACKAGE_SCORES = { Elite: 20, Premium: 13, Standard: 7 };

const STAGE_KEYWORD_SCORES = [
  { keyword: 'closed won',     points: 30 },
  { keyword: 'negotiation',    points: 25 },
  { keyword: 'proposal',       points: 22 },
  { keyword: 'meeting',        points: 18 },
  { keyword: 'conversation',   points: 12 },
  { keyword: 'information',    points: 10 },
  { keyword: 'feature',        points: 10 },
  { keyword: 'collaboration',  points: 14 },
  { keyword: 'follow',         points: 7  },
  { keyword: 'cold email',     points: 5  },
  { keyword: 'prospect',       points: 0  },
  { keyword: 'closed lost',    points: 0  },
];

const LUXURY_UK_REGIONS = [
  'london', 'cotswolds', 'bath', 'oxford', 'hampshire', 'surrey',
  'kent', 'scotland', 'edinburgh', 'lake district', 'yorkshire',
  'cornwall', 'devon', 'norfolk', 'suffolk',
];

// ── Core scoring function ─────────────────────────────────────────────────────

/**
 * Calculate a lead score 0-100 from prospect data + outreach history.
 * Pure function - no side effects.
 *
 * @param {object} prospect   - Row from prospects table
 * @param {Array}  history    - Rows from outreach_emails for this prospect
 * @returns {number}          - Score 0-100
 */
export function calculateLeadScore(prospect, history = []) {
  let score = 0;

  // ── 1. Profile completeness (0-15) ─────────────────────────────────────────
  if (prospect.email)        score += 6;
  if (prospect.contact_name) score += 4;
  if (prospect.phone)        score += 3;
  if (prospect.website)      score += 2;

  // ── 2. Package / proposal value (0-20) ─────────────────────────────────────
  score += PACKAGE_SCORES[prospect.package] || 0;

  const val = Number(prospect.proposal_value) || 0;
  if (val > 15000)      score += 5;  // bonus on top of package
  else if (val > 8000)  score += 3;
  else if (val > 2000)  score += 1;

  // ── 3. Location quality (0-10) ─────────────────────────────────────────────
  if (prospect.country === 'United Kingdom') {
    score += 8;
    // Bonus for known luxury regions in notes/website
    const haystack = `${prospect.notes || ''} ${prospect.website || ''}`.toLowerCase();
    if (LUXURY_UK_REGIONS.some(r => haystack.includes(r))) score += 2;
  } else if (['Ireland', 'France', 'Italy', 'Spain'].includes(prospect.country)) {
    score += 6;
  } else if (prospect.country) {
    score += 2;
  }

  // ── 4. Stage progression (0-25) ────────────────────────────────────────────
  const stageName = (prospect.pipeline_stage || '').toLowerCase();
  for (const { keyword, points } of STAGE_KEYWORD_SCORES) {
    if (stageName.includes(keyword)) {
      score += points;
      break;
    }
  }

  // ── 5. Engagement behaviour (0-30) ─────────────────────────────────────────
  const replied      = history.some(h => h.status === 'replied');
  const emailCount   = history.length;
  const lastReply    = history.find(h => h.status === 'replied');

  if (replied) {
    score += 20;
    // Extra if they replied recently
    if (lastReply?.replied_at) {
      const daysSince = (Date.now() - new Date(lastReply.replied_at)) / 86400000;
      if (daysSince < 3)  score += 5;
      else if (daysSince < 14) score += 2;
    }
  } else if (emailCount > 0) {
    score += 4; // at least we have contact data and sent something
  }

  if (emailCount >= 3) score += 3;
  else if (emailCount >= 2) score += 1;

  // Recent contact recency bonus
  if (prospect.last_contacted_at) {
    const daysSince = (Date.now() - new Date(prospect.last_contacted_at)) / 86400000;
    if (daysSince < 5)  score += 4;
    else if (daysSince < 14) score += 2;
  }

  // Active status bonus
  if (prospect.status === 'active')    score += 2;
  if (prospect.status === 'converted') score += 0; // already won, don't inflate

  return Math.min(100, Math.round(score));
}

// ── Score metadata ────────────────────────────────────────────────────────────

export function scoreColor(score) {
  if (score >= 76) return '#22c55e';
  if (score >= 56) return '#f59e0b';
  if (score >= 31) return '#f97316';
  return '#ef4444';
}

export function scoreLabel(score) {
  if (score >= 76) return 'High Priority';
  if (score >= 56) return 'Hot';
  if (score >= 31) return 'Warming';
  return 'Cold';
}

// ── DB persistence ────────────────────────────────────────────────────────────

/**
 * Fetch history + recalculate + save score for one prospect.
 */
export async function refreshProspectScore(prospectId) {
  const [{ data: prospect }, { data: history }] = await Promise.all([
    supabase.from('prospects').select('*').eq('id', prospectId).single(),
    supabase.from('outreach_emails').select('*').eq('prospect_id', prospectId),
  ]);
  if (!prospect) return null;

  const score = calculateLeadScore(prospect, history || []);

  await supabase
    .from('prospects')
    .update({ lead_score: score, updated_at: new Date().toISOString() })
    .eq('id', prospectId);

  return score;
}

/**
 * Recalculate scores for all active prospects.
 * Call from Dashboard "Recalculate Scores" button.
 * Returns how many were updated.
 */
export async function batchRefreshScores() {
  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('id, pipeline_stage, package, proposal_value, country, email, contact_name, phone, website, notes, website, last_contacted_at, status')
    .eq('status', 'active');

  if (error || !prospects) return 0;

  // Fetch all outreach emails in one query
  const { data: allEmails } = await supabase
    .from('outreach_emails')
    .select('prospect_id, status, replied_at');

  const emailsByProspect = (allEmails || []).reduce((acc, e) => {
    if (!acc[e.prospect_id]) acc[e.prospect_id] = [];
    acc[e.prospect_id].push(e);
    return acc;
  }, {});

  // Calculate and batch update
  const updates = prospects.map(p => ({
    id: p.id,
    lead_score: calculateLeadScore(p, emailsByProspect[p.id] || []),
    updated_at: new Date().toISOString(),
  }));

  // Upsert in chunks of 50
  const CHUNK = 50;
  for (let i = 0; i < updates.length; i += CHUNK) {
    await supabase.from('prospects').upsert(updates.slice(i, i + CHUNK));
  }

  return updates.length;
}

// ── Compatibility aliases for leadEngineService ────────────────────────────
export const scoreLead        = calculateLeadScore;
export const getLeadPriority  = (score) => score >= 70 ? 'high' : score >= 40 ? 'medium' : 'low';
export const getLeadValueBand = (score) => score >= 80 ? 'A' : score >= 60 ? 'B' : score >= 40 ? 'C' : 'D';
