/**
 * salesPipelineService.js
 * CRM + sales pipeline operations for venue/vendor outreach.
 * Tables: prospects, outreach_emails
 */

import { supabase } from '../lib/supabaseClient';

// ── Fetch ──────────────────────────────────────────────────────────────────────

export async function fetchProspects({ stage, status, search } = {}) {
  let q = supabase
    .from('prospects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (stage && stage !== 'all') q = q.eq('pipeline_stage', stage);
  if (status && status !== 'all') q = q.eq('status', status);
  if (search) q = q.or(`company_name.ilike.%${search}%,contact_name.ilike.%${search}%,email.ilike.%${search}%`);

  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function fetchProspectById(id) {
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
}

export async function fetchOutreachHistory(prospectId) {
  const { data, error } = await supabase
    .from('outreach_emails')
    .select('*')
    .eq('prospect_id', prospectId)
    .order('sent_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

// ── Prospect CRUD ──────────────────────────────────────────────────────────────

export async function createProspect(fields) {
  const { data, error } = await supabase
    .from('prospects')
    .insert([{
      ...fields,
      pipeline_stage: fields.pipeline_stage || 'prospect',
      status: 'active',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateProspect(id, fields) {
  const { data, error } = await supabase
    .from('prospects')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function moveStage(id, newStage) {
  return updateProspect(id, {
    pipeline_stage: newStage,
    last_contacted_at: ['cold_email_sent','follow_up_sent','proposal_sent'].includes(newStage)
      ? new Date().toISOString()
      : undefined,
  });
}

export async function deleteProspect(id) {
  const { error } = await supabase.from('prospects').delete().eq('id', id);
  if (error) throw error;
}

// ── Outreach email log ────────────────────────────────────────────────────────

/**
 * Log an outreach email and return the created row (including its id).
 * The id is used by callers to append a tracking pixel to the email body.
 *
 * @param {object} opts
 * @param {string} opts.prospectId
 * @param {string} opts.emailType  - 'cold'|'follow_up_1'|'follow_up_2'|'proposal'|'campaign'|'custom'
 * @param {string} opts.subject
 * @param {string} opts.body
 * @param {string} [opts.campaignId]  - Optional: link to a prospect_campaigns row
 * @returns {Promise<object>} Created outreach_emails row with id
 */
export async function logOutreachEmail({ prospectId, emailType, subject, body, campaignId }) {
  const row = {
    prospect_id: prospectId,
    email_type:  emailType,
    subject,
    body,
    sent_at: new Date().toISOString(),
    status:  'sent',
  };
  if (campaignId) row.campaign_id = campaignId;

  const { data, error } = await supabase
    .from('outreach_emails')
    .insert([row])
    .select()
    .single();
  if (error) throw error;
  return data; // includes data.id for pixel URL construction
}

export async function markReplied(outreachEmailId) {
  const { error } = await supabase
    .from('outreach_emails')
    .update({ status: 'replied', replied_at: new Date().toISOString() })
    .eq('id', outreachEmailId);
  if (error) throw error;
}

// ── Dashboard stats ───────────────────────────────────────────────────────────

export async function fetchSalesStats() {
  const [{ data: prospects }, { data: emails }] = await Promise.all([
    supabase.from('prospects').select('pipeline_stage,status,created_at'),
    supabase.from('outreach_emails').select('status,sent_at,email_type'),
  ]);

  const p = prospects || [];
  const e = emails || [];
  const now = new Date();
  const monthAgo = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const stageCounts = {};
  p.forEach(r => { stageCounts[r.pipeline_stage] = (stageCounts[r.pipeline_stage] || 0) + 1; });

  const emailsThisMonth = e.filter(x => x.sent_at >= monthAgo).length;
  const replies = e.filter(x => x.status === 'replied').length;
  const replyRate = e.length > 0 ? Math.round((replies / e.length) * 100) : 0;

  const closedWon  = stageCounts['closed_won']  || 0;
  const closedLost = stageCounts['closed_lost'] || 0;
  const totalClosed = closedWon + closedLost;
  const closeRate = totalClosed > 0 ? Math.round((closedWon / totalClosed) * 100) : 0;

  return {
    totalProspects: p.length,
    activeProspects: p.filter(x => x.status === 'active').length,
    emailsThisMonth,
    replyRate,
    meetingsBooked: stageCounts['meeting_booked'] || 0,
    proposalsSent: stageCounts['proposal_sent'] || 0,
    closedWon,
    closeRate,
    stageCounts,
  };
}

// ── Follow-up check ───────────────────────────────────────────────────────────

export async function fetchFollowUpsDue() {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('prospects')
    .select('*')
    .eq('status', 'active')
    .not('pipeline_stage', 'in', '("closed_won","closed_lost","prospect")')
    .lte('next_follow_up_at', now)
    .order('next_follow_up_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

// ── Closed Won trigger ────────────────────────────────────────────────────────

export async function triggerClosedWonFlow(prospectId) {
  // Update prospect status + stage
  await updateProspect(prospectId, {
    pipeline_stage: 'closed_won',
    status: 'converted',
  });
  // Additional onboarding flows can be added here
  // e.g. create vendor listing, send welcome email, etc.
}

// ── Prospect deduplication ─────────────────────────────────────────────────

/**
 * Check if a prospect with the same email or website domain already exists.
 * Used to warn before saving discovered or manually entered prospects.
 *
 * @param {object} opts
 * @param {string} [opts.email]
 * @param {string} [opts.website]
 * @returns {Promise<Array<{id, company_name, email, website, status}>>} Matching prospects
 */
export async function findDuplicateProspects({ email, website } = {}) {
  const conditions = [];

  if (email?.trim()) {
    conditions.push(`email.ilike.${email.trim()}`);
  }

  if (website?.trim()) {
    try {
      // Extract domain for fuzzy match: "https://www.villabalbiano.com/about" -> "villabalbiano.com"
      const domain = new URL(website.trim().startsWith('http') ? website.trim() : `https://${website.trim()}`).hostname
        .replace(/^www\./, '');
      if (domain) conditions.push(`website.ilike.%${domain}%`);
    } catch {
      // Invalid URL - skip website check
    }
  }

  if (conditions.length === 0) return [];

  const { data, error } = await supabase
    .from('prospects')
    .select('id, company_name, email, website, status')
    .or(conditions.join(','))
    .limit(5);

  if (error) return [];
  return data || [];
}
