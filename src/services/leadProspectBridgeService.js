/**
 * leadProspectBridgeService.js
 * Links B2C leads (couples/planners) to B2B prospects (business partners)
 * via the lead_prospect_links table — matched by email.
 */

import { supabase } from '../lib/supabaseClient';
import { callLeadsEdge } from './leadEngineService';

const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ── Find prospect for a given email ───────────────────────────────────────────

export async function findProspectByEmail(email) {
  if (!email) return null;
  const { data, error } = await supabase
    .from('prospects')
    .select('id, company_name, contact_name, email, pipeline_stage, status, pipeline_id')
    .ilike('email', email.trim())
    .limit(1)
    .single();
  if (error || !data) return null;
  return data;
}

// ── Find lead for a given email ────────────────────────────────────────────────

export async function findLeadByEmail(email) {
  if (!email) return null;
  const result = await callLeadsEdge('list', { filters: { limit: 500, offset: 0 } });
  const leads = result.data?.leads || [];
  const emailLower = email.trim().toLowerCase();
  return leads.find(l => typeof l.email === 'string' && l.email.toLowerCase() === emailLower) || null;
}

// ── Create a link between a lead and a prospect ────────────────────────────────

export async function linkLeadToProspect(leadId, prospectId, method = 'email') {
  const { data, error } = await supabase
    .from('lead_prospect_links')
    .upsert({ lead_id: leadId, prospect_id: prospectId, match_method: method },
             { onConflict: 'lead_id,prospect_id' })
    .select()
    .single();
  if (error) {
    console.warn('[bridge] Failed to link lead↔prospect:', error.message);
    return null;
  }
  return data;
}

// ── Auto-link: called after a prospect is created ─────────────────────────────
// Looks for an existing lead with the same email and links them.

export async function autoLinkProspect(prospectId, email) {
  if (!prospectId || !email) return null;
  const lead = await findLeadByEmail(email);
  if (!lead?.id) return null;
  return linkLeadToProspect(lead.id, prospectId, 'email');
}

// ── Auto-link: called after a lead is created ─────────────────────────────────
// Looks for an existing prospect with the same email and links them.

export async function autoLinkLead(leadId, email) {
  if (!leadId || !email) return null;
  const prospect = await findProspectByEmail(email);
  if (!prospect?.id) return null;
  return linkLeadToProspect(leadId, prospect.id, 'email');
}

// ── Fetch linked prospect for a lead ──────────────────────────────────────────

export async function getLinkedProspectForLead(leadId) {
  if (!leadId) return null;
  const { data, error } = await supabase
    .from('lead_prospect_links')
    .select(`
      match_method,
      prospect:prospect_id (
        id, company_name, contact_name, email,
        pipeline_stage, status, pipeline_id,
        last_contacted_at, next_follow_up_at
      )
    `)
    .eq('lead_id', leadId)
    .limit(1)
    .single();
  if (error || !data) return null;
  return { ...data.prospect, match_method: data.match_method };
}

// ── Fetch linked lead for a prospect ──────────────────────────────────────────

export async function getLinkedLeadForProspect(prospectId) {
  if (!prospectId) return null;
  const { data, error } = await supabase
    .from('lead_prospect_links')
    .select('lead_id, match_method')
    .eq('prospect_id', prospectId)
    .limit(1)
    .single();
  if (error || !data) return null;

  // Fetch the lead via edge function (bypasses RLS)
  const result = await callLeadsEdge('get', { leadId: data.lead_id });
  if (!result.success || !result.data) return null;
  return { ...result.data, match_method: data.match_method };
}

// ── Manual link (from UI) ──────────────────────────────────────────────────────

export async function manualLinkByEmail(leadId, prospectEmail) {
  const prospect = await findProspectByEmail(prospectEmail);
  if (!prospect) throw new Error(`No prospect found with email: ${prospectEmail}`);
  return linkLeadToProspect(leadId, prospect.id, 'manual');
}
