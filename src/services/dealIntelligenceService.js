/**
 * dealIntelligenceService.js
 *
 * AI Deal Intelligence layer for the Sales Pipeline.
 *
 * Provides:
 *   - Deal Health scoring (Hot Opportunity / Healthy / At Risk / Cold)
 *   - Close Probability estimation (0-100%)
 *   - AI Next Action suggestions (via ai-generate edge function)
 *   - Pipeline Intelligence aggregates (at-risk deals, revenue potential, etc.)
 *
 * All pure functions are sync; AI Next Action is async.
 */

import { supabase } from '../lib/supabaseClient';

// ── Constants ──────────────────────────────────────────────────────────────────

const HEALTH_HOT_OPPORTUNITY  = 'hot_opportunity';
const HEALTH_HEALTHY          = 'healthy';
const HEALTH_AT_RISK          = 'at_risk';
const HEALTH_COLD             = 'cold';

// Days in a stage before a deal is considered stale
const STALE_DAYS_AT_RISK = 14;
const STALE_DAYS_COLD    = 30;

// Close probability base weights
const STAGE_PROB = {
  'closed won':   100,
  'closed lost':  0,
  'negotiation':  82,
  'proposal':     65,
  'meeting':      50,
  'conversation': 35,
  'information':  22,
  'feature':      22,
  'collaboration':28,
  'follow':       18,
  'cold email':   10,
  'prospect':     8,
};

const PACKAGE_PROB_BONUS = { Elite: 8, Premium: 4, Standard: 0 };

// ── Deal Health ────────────────────────────────────────────────────────────────

/**
 * Compute deal health status + signals.
 *
 * @param {object} prospect      - Prospect row
 * @param {Array}  history       - outreach_emails rows for this prospect
 * @param {object|null} stage    - Current stage row (optional)
 * @returns {{ status: string, score: number, color: string, label: string, reasons: string[] }}
 */
export function calculateDealHealth(prospect, history = [], stage = null) {
  const reasons = [];
  let score = 50; // Start neutral

  const hasReplied     = history.some(h => h.status === 'replied');
  const emailCount     = history.length;
  const lastReply      = history.find(h => h.status === 'replied');
  const lastContact    = prospect.last_contacted_at ? new Date(prospect.last_contacted_at) : null;
  const createdAt      = prospect.created_at ? new Date(prospect.created_at) : new Date();
  const daysSinceCreate = (Date.now() - createdAt) / 86400000;
  const daysSinceContact = lastContact ? (Date.now() - lastContact) / 86400000 : daysSinceCreate;
  const isOverdue      = prospect.next_follow_up_at && new Date(prospect.next_follow_up_at) < new Date();
  const stageName      = (stage?.name || prospect.pipeline_stage || '').toLowerCase();
  const leadScore      = prospect.lead_score ?? 0;

  // ── Positive signals ────────────────────────────────────────────────────────

  if (hasReplied) {
    score += 22;
    reasons.push('Has replied to outreach');
    if (lastReply?.replied_at) {
      const daysSinceReply = (Date.now() - new Date(lastReply.replied_at)) / 86400000;
      if (daysSinceReply < 7) { score += 8; reasons.push('Replied recently'); }
    }
  }

  if (emailCount >= 3) { score += 5; reasons.push('Multiple touch points'); }

  if (leadScore >= 70) { score += 12; reasons.push(`Strong lead score (${leadScore})`); }
  else if (leadScore >= 50) { score += 6; }

  const isAdvancedStage = stageName.includes('proposal') || stageName.includes('negotiation')
    || stageName.includes('meeting') || stageName.includes('conversation');
  if (isAdvancedStage) { score += 15; reasons.push(`In ${stage?.name || prospect.pipeline_stage} stage`); }

  if (prospect.proposal_value > 0) { score += 5; reasons.push('Has proposal value set'); }

  if (daysSinceContact < 5 && lastContact) { score += 8; reasons.push('Recently contacted'); }

  if (prospect.package === 'Elite') { score += 6; reasons.push('Elite package enquiry'); }
  else if (prospect.package === 'Premium') { score += 3; }

  // ── Negative signals ────────────────────────────────────────────────────────

  if (isOverdue) { score -= 20; reasons.push('Follow-up is overdue'); }

  if (daysSinceContact > STALE_DAYS_COLD) { score -= 25; reasons.push(`No contact in ${Math.round(daysSinceContact)} days`); }
  else if (daysSinceContact > STALE_DAYS_AT_RISK) { score -= 14; reasons.push(`Inactive for ${Math.round(daysSinceContact)} days`); }

  if (!hasReplied && emailCount > 2) { score -= 10; reasons.push('No reply after multiple emails'); }
  if (emailCount === 0) { score -= 8; reasons.push('No outreach sent yet'); }

  if (stageName.includes('cold email') || stageName.includes('prospect')) {
    if (daysSinceCreate > 21) { score -= 12; reasons.push('Stuck in early stage'); }
  }

  if (prospect.status === 'lost') { score = 0; reasons.push('Marked as lost'); }
  if (prospect.status === 'converted') { score = 100; reasons.push('Closed won'); }

  const clamped = Math.max(0, Math.min(100, Math.round(score)));

  // ── Classify ───────────────────────────────────────────────────────────────
  let status;
  if (stageName.includes('closed won') || prospect.status === 'converted') {
    status = HEALTH_HOT_OPPORTUNITY;
  } else if (stageName.includes('closed lost') || prospect.status === 'lost') {
    status = HEALTH_COLD;
  } else if (clamped >= 70) {
    status = HEALTH_HOT_OPPORTUNITY;
  } else if (clamped >= 45) {
    status = HEALTH_HEALTHY;
  } else if (clamped >= 22) {
    status = HEALTH_AT_RISK;
  } else {
    status = HEALTH_COLD;
  }

  return {
    status,
    score: clamped,
    color: dealHealthColor(status),
    label: dealHealthLabel(status),
    reasons: reasons.slice(0, 4), // top 4 reasons
  };
}

// ── Deal Health helpers ────────────────────────────────────────────────────────

export function dealHealthLabel(status) {
  switch (status) {
    case HEALTH_HOT_OPPORTUNITY: return 'Hot Opportunity';
    case HEALTH_HEALTHY:         return 'Healthy';
    case HEALTH_AT_RISK:         return 'At Risk';
    case HEALTH_COLD:            return 'Cold';
    default:                     return 'Unknown';
  }
}

export function dealHealthColor(status) {
  switch (status) {
    case HEALTH_HOT_OPPORTUNITY: return '#f97316'; // orange
    case HEALTH_HEALTHY:         return '#22c55e'; // green
    case HEALTH_AT_RISK:         return '#f59e0b'; // amber
    case HEALTH_COLD:            return '#6b7280'; // gray
    default:                     return '#aaa';
  }
}

export function dealHealthBgColor(status) {
  switch (status) {
    case HEALTH_HOT_OPPORTUNITY: return 'rgba(249,115,22,0.1)';
    case HEALTH_HEALTHY:         return 'rgba(34,197,94,0.1)';
    case HEALTH_AT_RISK:         return 'rgba(245,158,11,0.1)';
    case HEALTH_COLD:            return 'rgba(107,114,128,0.1)';
    default:                     return 'rgba(0,0,0,0.05)';
  }
}

// ── Close Probability ─────────────────────────────────────────────────────────

/**
 * Estimate the probability that this deal will close (0-100).
 * Pure function - no AI, runs instantly.
 *
 * @param {object} prospect
 * @param {Array}  history
 * @param {object|null} stage
 * @returns {number} 0-100
 */
export function calculateCloseProbability(prospect, history = [], stage = null) {
  if (prospect.status === 'converted') return 100;
  if (prospect.status === 'lost')      return 0;

  const stageName = (stage?.name || prospect.pipeline_stage || '').toLowerCase();

  // Stage base probability
  let prob = 8;
  for (const [keyword, base] of Object.entries(STAGE_PROB)) {
    if (stageName.includes(keyword)) {
      prob = base;
      break;
    }
  }

  // Engagement modifier (+/-)
  const hasReplied   = history.some(h => h.status === 'replied');
  const emailCount   = history.length;
  const lastReply    = history.find(h => h.status === 'replied');

  if (hasReplied) {
    prob += 18;
    if (lastReply?.replied_at) {
      const daysSinceReply = (Date.now() - new Date(lastReply.replied_at)) / 86400000;
      if (daysSinceReply < 7) prob += 6;
    }
  } else if (emailCount === 0) {
    prob -= 5;
  } else if (emailCount > 3 && !hasReplied) {
    prob -= 10; // many emails, no reply = not interested
  }

  // Lead score modifier
  const ls = prospect.lead_score ?? 0;
  prob += Math.round((ls / 100) * 12); // max +12 from score

  // Staleness penalty
  const lastContact = prospect.last_contacted_at ? new Date(prospect.last_contacted_at) : null;
  const daysSinceContact = lastContact ? (Date.now() - lastContact) / 86400000 :
    (Date.now() - new Date(prospect.created_at || Date.now())) / 86400000;

  if (daysSinceContact > STALE_DAYS_COLD) prob -= 20;
  else if (daysSinceContact > STALE_DAYS_AT_RISK) prob -= 10;

  const isOverdue = prospect.next_follow_up_at && new Date(prospect.next_follow_up_at) < new Date();
  if (isOverdue) prob -= 8;

  // Package bonus
  prob += PACKAGE_PROB_BONUS[prospect.package] || 0;

  // Proposal value signal (if set, they were serious)
  if (prospect.proposal_value > 0) prob += 5;

  return Math.max(0, Math.min(100, Math.round(prob)));
}

// ── AI Next Action ─────────────────────────────────────────────────────────────

/**
 * Generate an AI-powered next action recommendation for a prospect.
 * Calls the ai-generate edge function.
 *
 * @param {{ prospect: object, stage: object|null, history: Array }} params
 * @returns {Promise<string>} Plain text recommendation (1-3 sentences)
 */
export async function generateNextAction({ prospect, stage, history = [] }) {
  const stageName      = stage?.name || prospect.pipeline_stage || 'Prospect';
  const hasReplied     = history.some(h => h.status === 'replied');
  const emailCount     = history.length;
  const lastContact    = prospect.last_contacted_at;
  const daysSinceContact = lastContact
    ? Math.round((Date.now() - new Date(lastContact)) / 86400000)
    : null;

  const systemPrompt = `You are a senior sales director at Luxury Wedding Directory, a premium UK wedding venue and vendor platform.
Give ONE concise, specific next action recommendation for a sales prospect.
Write 1-3 sentences. Be direct and actionable. Use a professional but warm tone.
Focus on: timing, channel (call/email/LinkedIn), message angle, and goal.
Never use bullet points. Never use em dashes.`;

  const lines = [
    `Company: ${prospect.company_name}`,
    `Type: ${prospect.venue_type || 'Unknown'}`,
    `Stage: ${stageName}`,
    `Package: ${prospect.package || 'Standard'}`,
    `Lead score: ${prospect.lead_score ?? 'N/A'}/100`,
    emailCount > 0 ? `Emails sent: ${emailCount}` : 'No emails sent yet',
    hasReplied ? 'Status: Has replied to outreach' : 'Status: No reply received',
    daysSinceContact !== null ? `Days since last contact: ${daysSinceContact}` : 'Never contacted',
    prospect.next_follow_up_at ? `Follow-up due: ${new Date(prospect.next_follow_up_at).toLocaleDateString('en-GB')}` : null,
    prospect.proposal_value ? `Proposal value: GBP ${prospect.proposal_value}` : null,
    prospect.notes ? `Notes: ${String(prospect.notes).slice(0, 200)}` : null,
  ].filter(Boolean).join('\n');

  const userPrompt = `Give the best next action for this prospect:\n\n${lines}\n\nRespond with 1-3 plain sentences only.`;

  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature: 'pipeline_next_action', systemPrompt, userPrompt },
  });

  if (error || !data?.text) throw new Error(error?.message || 'AI generation failed');
  return data.text.trim();
}

// ── Pipeline Intelligence ──────────────────────────────────────────────────────

/**
 * Compute aggregate intelligence for a set of prospects.
 * Pure function - uses pre-computed health/probability if provided.
 *
 * @param {Array}  prospects    - All active prospects to analyse
 * @param {Array}  stages       - All pipeline stages
 * @param {object} healthMap    - { [prospectId]: dealHealth result } (optional pre-computed)
 * @param {object} probMap      - { [prospectId]: closeProbability } (optional pre-computed)
 * @returns {{
 *   dealsAtRisk:      Array,   // At Risk or Cold with proposal value
 *   highProbDeals:    Array,   // closeProbability >= 65
 *   revenuePotential: number,  // Weighted sum: proposal_value * (prob / 100)
 *   totalPipelineValue: number,
 *   avgDaysInPipeline: number,
 *   wonThisMonth:     number,
 * }}
 */
export function getPipelineIntelligence(prospects, stages = [], healthMap = {}, probMap = {}) {
  const active = prospects.filter(p => p.status === 'active' || p.status === 'converted');
  const now = Date.now();

  const dealsAtRisk = active.filter(p => {
    const h = healthMap[p.id];
    return h && (h.status === HEALTH_AT_RISK || h.status === HEALTH_COLD);
  });

  const highProbDeals = active.filter(p => {
    const prob = probMap[p.id];
    return prob != null && prob >= 65 && p.status !== 'converted';
  }).sort((a, b) => (probMap[b.id] || 0) - (probMap[a.id] || 0));

  const revenuePotential = active.reduce((sum, p) => {
    const val  = Number(p.proposal_value) || 0;
    const prob = (probMap[p.id] ?? 30) / 100;
    return sum + val * prob;
  }, 0);

  const totalPipelineValue = active.reduce((sum, p) => sum + (Number(p.proposal_value) || 0), 0);

  const daysList = active
    .filter(p => p.created_at)
    .map(p => (now - new Date(p.created_at)) / 86400000);
  const avgDaysInPipeline = daysList.length
    ? Math.round(daysList.reduce((a, b) => a + b, 0) / daysList.length)
    : 0;

  const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
  const wonThisMonth = prospects.filter(p => {
    const stage = stages.find(s => s.id === p.stage_id);
    return stage?.is_won && p.updated_at && new Date(p.updated_at) >= monthStart;
  }).length;

  return {
    dealsAtRisk,
    highProbDeals,
    revenuePotential: Math.round(revenuePotential),
    totalPipelineValue,
    avgDaysInPipeline,
    wonThisMonth,
  };
}
