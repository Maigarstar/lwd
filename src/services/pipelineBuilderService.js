/**
 * pipelineBuilderService.js
 * CRUD for pipelines, pipeline_stages, pipeline_email_templates.
 * Closed Won automation trigger.
 */

import { supabase } from '../lib/supabaseClient';

// ── Pipelines ─────────────────────────────────────────────────────────────────

export async function fetchPipelines() {
  const { data, error } = await supabase
    .from('pipelines')
    .select('*')
    .order('sort_order', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function fetchPipelineWithStages(pipelineId) {
  const [{ data: pipeline, error: pe }, { data: stages, error: se }] = await Promise.all([
    supabase.from('pipelines').select('*').eq('id', pipelineId).single(),
    supabase
      .from('pipeline_stages')
      .select('*')
      .eq('pipeline_id', pipelineId)
      .order('position', { ascending: true }),
  ]);
  if (pe) throw pe;
  if (se) throw se;
  return { pipeline, stages: stages || [] };
}

export async function createPipeline(fields) {
  const { data, error } = await supabase
    .from('pipelines')
    .insert([{
      ...fields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updatePipeline(id, fields) {
  const { data, error } = await supabase
    .from('pipelines')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deletePipeline(id) {
  const { error } = await supabase.from('pipelines').delete().eq('id', id);
  if (error) throw error;
}

// ── Stages ────────────────────────────────────────────────────────────────────

export async function fetchStages(pipelineId) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('position', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createStage(fields) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert([{ ...fields, created_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateStage(id, fields) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .update(fields)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteStage(id) {
  const { error } = await supabase.from('pipeline_stages').delete().eq('id', id);
  if (error) throw error;
}

// Bulk update positions after reorder
export async function reorderStages(stageIds) {
  const updates = stageIds.map((id, idx) =>
    supabase.from('pipeline_stages').update({ position: idx }).eq('id', id)
  );
  await Promise.all(updates);
}

// ── Email templates ───────────────────────────────────────────────────────────

export async function fetchTemplates(pipelineId) {
  const { data, error } = await supabase
    .from('pipeline_email_templates')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('email_type', { ascending: true });
  if (error) throw error;
  return data || [];
}

export async function createTemplate(fields) {
  const { data, error } = await supabase
    .from('pipeline_email_templates')
    .insert([{
      ...fields,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateTemplate(id, fields) {
  const { data, error } = await supabase
    .from('pipeline_email_templates')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteTemplate(id) {
  const { error } = await supabase.from('pipeline_email_templates').delete().eq('id', id);
  if (error) throw error;
}

// Fetch the template attached to a specific stage
export async function fetchStageTemplate(stageId) {
  const { data: stage } = await supabase
    .from('pipeline_stages')
    .select('email_template_id')
    .eq('id', stageId)
    .single();
  if (!stage?.email_template_id) return null;
  const { data, error } = await supabase
    .from('pipeline_email_templates')
    .select('*')
    .eq('id', stage.email_template_id)
    .single();
  if (error) return null;
  return data;
}

// ── Closed Won Trigger ────────────────────────────────────────────────────────

/**
 * Fire all closed_won_actions for a prospect moving to a won stage.
 * actions array comes from pipeline_stages.closed_won_actions JSONB.
 */
export async function fireClosedWonActions(prospect, actions = []) {
  const results = { activated: false, newsletterAdded: false, welcomeSent: false, taskCreated: false };

  for (const action of actions) {
    try {
      if (action === 'activate_profile' && prospect.listing_id) {
        await supabase
          .from('listings')
          .update({ status: 'active', updated_at: new Date().toISOString() })
          .eq('id', prospect.listing_id);
        results.activated = true;
      }

      if (action === 'add_to_newsletter' && prospect.email) {
        await supabase
          .from('newsletter_subscribers')
          .upsert({
            email: prospect.email,
            name: prospect.contact_name || prospect.company_name,
            status: 'active',
            source: 'closed_won',
            subscribed_at: new Date().toISOString(),
          }, { onConflict: 'email' });
        results.newsletterAdded = true;
      }

      if (action === 'send_welcome_email' && prospect.email) {
        // Fetch welcome template for this pipeline
        const { data: tpl } = await supabase
          .from('pipeline_email_templates')
          .select('subject, body')
          .eq('pipeline_id', prospect.pipeline_id)
          .eq('email_type', 'welcome')
          .limit(1)
          .single();

        if (tpl) {
          const subject = mergeTags(tpl.subject, prospect);
          const body    = mergeTags(tpl.body, prospect);

          // Fire and forget via edge function
          await supabase.functions.invoke('send-email', {
            body: {
              to: prospect.email,
              toName: prospect.contact_name,
              subject,
              text: body,
            },
          }).catch(() => {});

          // Log the email
          await supabase.from('outreach_emails').insert([{
            prospect_id: prospect.id,
            email_type: 'custom',
            subject,
            body,
            sent_at: new Date().toISOString(),
            status: 'sent',
          }]);

          results.welcomeSent = true;
        }
      }

      if (action === 'create_onboarding_task') {
        // Log a system note in outreach history
        await supabase.from('outreach_emails').insert([{
          prospect_id: prospect.id,
          email_type: 'custom',
          subject: 'Onboarding task created',
          body: `Onboarding initiated for ${prospect.company_name}. Status: Closed Won. Begin profile setup and account activation.`,
          sent_at: new Date().toISOString(),
          status: 'sent',
        }]);
        results.taskCreated = true;
      }
    } catch (err) {
      console.error(`Closed Won action "${action}" failed:`, err);
    }
  }

  return results;
}

// ── Auto Follow-Up Engine ─────────────────────────────────────────────────────

/**
 * Check for overdue follow-ups and send the next email in sequence.
 * Called manually from the dashboard or by a scheduled Edge Function.
 * Returns count of emails sent.
 */
export async function runAutoFollowUps({ fromEmail, fromName, dryRun = false } = {}) {
  const now = new Date().toISOString();

  // Fetch overdue active prospects with their current stage
  const { data: prospects, error } = await supabase
    .from('prospects')
    .select('*, pipeline_stages(*)')
    .eq('status', 'active')
    .lte('next_follow_up_at', now)
    .not('stage_id', 'is', null);

  if (error) throw error;
  if (!prospects?.length) return { sent: 0, prospects: [] };

  let sent = 0;
  const log = [];

  for (const p of prospects) {
    try {
      const stage = p.pipeline_stages;
      if (!stage) continue;

      // Fetch the stage template
      const template = await fetchStageTemplate(stage.id);
      if (!template) continue;

      const subject = mergeTags(template.subject, p);
      const body    = mergeTags(template.body, p);

      if (!dryRun && p.email) {
        // Send via edge function
        await supabase.functions.invoke('send-email', {
          body: { to: p.email, toName: p.contact_name, subject, text: body, fromEmail, fromName },
        }).catch(() => {});

        // Log
        await supabase.from('outreach_emails').insert([{
          prospect_id: p.id,
          email_type: template.email_type,
          subject,
          body,
          sent_at: now,
          status: 'sent',
        }]);

        // Update next_follow_up_at
        const nextFU = stage.auto_follow_up_days
          ? new Date(Date.now() + stage.auto_follow_up_days * 86400000).toISOString()
          : null;

        await supabase
          .from('prospects')
          .update({
            last_contacted_at: now,
            next_follow_up_at: nextFU,
            updated_at: now,
          })
          .eq('id', p.id);

        sent++;
      }

      log.push({ company: p.company_name, email: p.email, subject, stage: stage.name });
    } catch (err) {
      console.error(`Auto follow-up failed for ${p.company_name}:`, err);
    }
  }

  return { sent, prospects: log };
}

// ── Merge tags helper ─────────────────────────────────────────────────────────

export function mergeTags(text, prospect) {
  if (!text) return '';
  const senderName = localStorage.getItem('emailFromName') || 'The Team';
  return text
    .replace(/\{\{contact_name\}\}/g,  prospect.contact_name  || prospect.company_name || '')
    .replace(/\{\{company_name\}\}/g,  prospect.company_name  || '')
    .replace(/\{\{venue_name\}\}/g,    prospect.company_name  || '')
    .replace(/\{\{sender_name\}\}/g,   senderName)
    .replace(/\{\{proposal_value\}\}/g, prospect.proposal_value || '');
}
