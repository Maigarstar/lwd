/**
 * campaignService.js
 *
 * Bulk outreach campaigns: send personalised emails to filtered prospect groups.
 *
 * Lifecycle: draft -> sending -> sent | paused
 * Safety rules:
 *   - Once 'sent', campaign cannot resend. "Send Again" creates a new record.
 *   - Idempotency guard: sendCampaign() checks status !== 'sent' before proceeding.
 *   - 300ms delay between sends to respect Resend rate limits (~3 req/s).
 *   - Every email includes a working unsubscribe footer.
 *   - Tracking pixel appended to every body for open tracking.
 *
 * All new tables are accessed only from admin-controlled flows (no public routes).
 */

import { supabase }          from '../lib/supabaseClient';
import { logOutreachEmail }  from './salesPipelineService';
import { sendEmail }         from './emailSendService';
import { mergeTags }         from './pipelineBuilderService';
import { generateColdEmail } from './salesPipelineAiService';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const PIXEL_BASE   = `${SUPABASE_URL}/functions/v1/track-email-open`;
const SEND_DELAY_MS = 300;

async function isEmailSuppressed(email) {
  if (!email) return false;
  const { data } = await supabase
    .from('email_suppressions')
    .select('id')
    .eq('email', email.toLowerCase().trim())
    .maybeSingle();
  return !!data;
}

// ── Body conversion ────────────────────────────────────────────────────────────

/**
 * Ensure the email body is delivered as HTML to the send-email edge function.
 * If the body already contains HTML tags (e.g. from a rich template or the
 * tracking pixel), pass it through untouched. Otherwise wrap plain-text
 * content in a minimal HTML structure so Resend renders it correctly and
 * the tracking pixel <img> tag fires.
 */
function bodyToHtml(text) {
  if (!text) return '';
  // Already has HTML - pass through (pixel img tag qualifies)
  if (/<[a-z][\s\S]*>/i.test(text)) return text;
  // Plain text: convert line breaks and wrap
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  const paragraphs = escaped
    .split(/\n\n+/)
    .map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`)
    .join('\n');
  return `<div style="font-family:sans-serif;font-size:15px;line-height:1.7;color:#1a1a1a;max-width:600px">${paragraphs}</div>`;
}

// ── Pixel helper ───────────────────────────────────────────────────────────────

/**
 * Build the 1x1 tracking pixel HTML for a logged outreach_emails row.
 * Note: pixel tracking is approximate (some clients preload or block images).
 */
function buildPixelHtml(emailId) {
  if (!emailId || !SUPABASE_URL) return '';
  return `<img src="${PIXEL_BASE}?id=${emailId}" width="1" height="1" style="display:none;border:0;outline:0" alt="" />`;
}

// ── Unsubscribe footer ─────────────────────────────────────────────────────────

function buildUnsubscribeFooter(fromName = 'Luxury Wedding Directory', prospectEmail = '') {
  const encoded = prospectEmail ? btoa(prospectEmail.toLowerCase().trim()) : '';
  const unsubUrl = encoded
    ? `${SUPABASE_URL}/functions/v1/handle-unsubscribe?e=${encoded}`
    : `${SUPABASE_URL}/functions/v1/handle-unsubscribe?e=`;
  return `
<div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e5e5;font-family:sans-serif;font-size:12px;color:#999;line-height:1.8">
  <p>This email was sent by <strong style="color:#666">${fromName}</strong> as part of a sales outreach campaign.</p>
  <p>If you no longer wish to receive emails from us, <a href="${unsubUrl}" style="color:#8f7420;text-decoration:underline">click here to unsubscribe</a>.</p>
  <p>Luxury Wedding Directory &bull; hello@luxuryweddingdirectory.co.uk</p>
</div>`;
}

// ── CRUD ───────────────────────────────────────────────────────────────────────

export async function fetchCampaigns() {
  const { data, error } = await supabase
    .from('prospect_campaigns')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createCampaign(fields) {
  const { data, error } = await supabase
    .from('prospect_campaigns')
    .insert([{ ...fields, status: 'draft', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateCampaign(id, fields) {
  const { data, error } = await supabase
    .from('prospect_campaigns')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteCampaign(id) {
  const { error } = await supabase
    .from('prospect_campaigns')
    .delete()
    .eq('id', id);
  if (error) throw error;
}

// ── Audience filter (pure, client-side) ───────────────────────────────────────

/**
 * Filter a prospect list using campaign filter criteria.
 * Pure function - no DB calls.
 *
 * @param {Array}  prospects  - All loaded prospects
 * @param {object} filters
 *   @param {string}   [filters.pipeline_id]
 *   @param {string[]} [filters.stage_ids]
 *   @param {string[]} [filters.venue_types]
 *   @param {number}   [filters.min_score]
 *   @param {string[]} [filters.statuses]  - defaults to ['active']
 * @returns {Array} Filtered prospect list (only those with an email address)
 */
export function filterProspectsForCampaign(prospects, filters = {}) {
  const {
    pipeline_id,
    stage_ids,
    venue_types,
    min_score,
    statuses = ['active'],
    country,
    keywords,
  } = filters;

  return prospects.filter(p => {
    if (!p.email) return false; // must have email to receive campaign
    if (statuses.length && !statuses.includes(p.status)) return false;
    if (pipeline_id && p.pipeline_id !== pipeline_id) return false;
    if (stage_ids?.length && !stage_ids.includes(p.stage_id)) return false;
    if (venue_types?.length && !venue_types.includes(p.venue_type)) return false;
    if (min_score != null && (p.lead_score ?? 0) < min_score) return false;
    // Country filter: case-insensitive match
    if (country) {
      if (!p.country?.toLowerCase().includes(country.toLowerCase())) return false;
    }
    // Keywords: any keyword in company_name, notes, website, country, or venue_type
    if (keywords?.length) {
      const haystack = `${p.company_name || ''} ${p.notes || ''} ${p.website || ''} ${p.country || ''} ${p.venue_type || ''}`.toLowerCase();
      if (!keywords.some(k => haystack.includes(k.toLowerCase()))) return false;
    }
    return true;
  });
}

// ── Send ───────────────────────────────────────────────────────────────────────

/**
 * Send a campaign to a filtered list of prospects.
 * Logs each send to outreach_emails, appends tracking pixel, includes unsubscribe footer.
 *
 * @param {object} opts
 *   @param {object}   opts.campaign         - Campaign row from prospect_campaigns
 *   @param {Array}    opts.prospects         - Filtered prospect list (must all have email)
 *   @param {string}   opts.fromEmail
 *   @param {string}   opts.fromName
 *   @param {Array}    [opts.templates]       - Pipeline email templates (for merge)
 *   @param {boolean}  [opts.personaliseWithAI] - Use generateColdEmail() per prospect
 *   @param {Function} [opts.onProgress]      - Called after each send: (sent, total) => void
 * @returns {Promise<{ sent: number, failed: number, campaignId: string }>}
 */
export async function sendCampaign({
  campaign,
  prospects,
  fromEmail,
  fromName,
  templates = [],
  personaliseWithAI = false,
  onProgress,
}) {
  const campaignId = campaign.id;
  const total      = prospects.length;
  let   sent       = 0;
  let   failed     = 0;

  // Atomic claim: compare-and-swap draft/paused -> sending in one DB round-trip.
  // If two simultaneous sends race, only one will get a row back; the other throws.
  // This replaces the client-side status check which had a race window.
  const { data: claimed, error: claimErr } = await supabase
    .from('prospect_campaigns')
    .update({ status: 'sending', total_recipients: total, sent_count: 0 })
    .eq('id', campaignId)
    .in('status', ['draft', 'paused'])
    .select('id')
    .single();

  if (claimErr || !claimed) {
    throw new Error(
      'Campaign is already sending or has been sent. Refresh the page and try again.'
    );
  }

  // Track personalisation mode for A/B analysis
  if (personaliseWithAI) {
    await updateCampaign(campaignId, { personalisation_mode: 'ai_assisted' }).catch(() => {});
  }

  try {
    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];

      try {
        // 1. Resolve subject + body
        let subject = campaign.subject || '';
        let body    = campaign.body    || '';

        // Apply template merge tags if a template was selected
        const tpl = templates.find(t => t.id === campaign.template_id);
        if (tpl) {
          subject = mergeTags(tpl.subject, prospect);
          body    = mergeTags(tpl.body,    prospect);
        } else {
          subject = mergeTags(subject, prospect);
          body    = mergeTags(body,    prospect);
        }

        // 2. AI personalisation (replaces body only)
        if (personaliseWithAI) {
          try {
            const generated = await generateColdEmail({ prospect });
            if (generated?.subject) subject = generated.subject;
            if (generated?.body)    body    = generated.body;
          } catch (aiErr) {
            console.warn('[Campaign] AI personalisation failed for', prospect.company_name, aiErr.message);
            // Fall through to use template body
          }
        }

        // 3. Append unsubscribe footer
        body = body + buildUnsubscribeFooter(fromName, prospect.email);

        // 4. Log to outreach_emails first (to get the id for the pixel)
        const emailRow = await logOutreachEmail({
          prospectId: prospect.id,
          emailType:  'campaign',
          subject,
          body,
          campaignId,
        });

        // 5. Append tracking pixel to body (after logging so we have the id)
        const pixelHtml = buildPixelHtml(emailRow.id);
        const bodyWithPixel = body + pixelHtml;

        // 6. Send via Resend (skip if suppressed)
        const suppressed = await isEmailSuppressed(prospect.email);
        if (prospect.email && !suppressed) {
          await sendEmail({
            subject,
            fromEmail,
            fromName,
            html:       bodyToHtml(bodyWithPixel),
            recipients: [{ email: prospect.email, name: prospect.contact_name || prospect.company_name }],
          });
        }

        sent++;
        await updateCampaign(campaignId, { sent_count: sent });
        onProgress?.(sent, total);

      } catch (prospectErr) {
        failed++;
        console.warn('[Campaign] Failed to send to', prospect.company_name, prospectErr.message);
      }

      // Rate limit: 300ms between sends
      if (i < prospects.length - 1) {
        await new Promise(r => setTimeout(r, SEND_DELAY_MS));
      }
    }

    // Mark campaign as sent
    await updateCampaign(campaignId, {
      status:  'sent',
      sent_at: new Date().toISOString(),
    });

  } catch (fatalErr) {
    // Pause campaign if we hit a fatal error mid-send
    await updateCampaign(campaignId, { status: 'paused' }).catch(() => {});
    throw fatalErr;
  }

  return { sent, failed, campaignId };
}

// ── Stats ──────────────────────────────────────────────────────────────────────

/**
 * Fetch aggregate stats for a single campaign.
 *
 * @param {string} campaignId
 * @returns {Promise<{ sent, opens, openRate, replies, replyRate, openToReplyRate }>}
 */
export async function fetchCampaignStats(campaignId) {
  const { data, error } = await supabase
    .from('outreach_emails')
    .select('id, status, opened_at, open_count')
    .eq('campaign_id', campaignId);

  if (error) throw error;
  const rows = data || [];

  const totalSent  = rows.length;
  const opens      = rows.filter(r => r.opened_at != null).length;
  const replies    = rows.filter(r => r.status === 'replied').length;
  const openAndReplied = rows.filter(r => r.opened_at != null && r.status === 'replied').length;

  const openRate        = totalSent > 0 ? Math.round((opens  / totalSent) * 100) : 0;
  const replyRate       = totalSent > 0 ? Math.round((replies / totalSent) * 100) : 0;
  const openToReplyRate = opens     > 0 ? Math.round((openAndReplied / opens) * 100) : 0;

  return { sent: totalSent, opens, openRate, replies, replyRate, openToReplyRate };
}

// ── Sequence step sender ───────────────────────────────────────────────────────

/**
 * Send one step of a multi-step sequence campaign.
 *
 * Handles stop-on-reply filtering, max-per-send throttling, AI personalisation
 * for step 1, and tracks step_sent progress on the campaign record.
 *
 * @param {object} opts
 *   @param {object}   opts.campaign        - Full campaign row (must have sequence_steps + settings)
 *   @param {number}   opts.stepIndex       - 0-based index into campaign.sequence_steps
 *   @param {Array}    opts.allProspects    - Full prospect list (filtering applied inside)
 *   @param {string}   opts.fromEmail
 *   @param {string}   opts.fromName
 *   @param {Function} [opts.onProgress]   - (sent, total) => void
 * @returns {Promise<{ sent, failed, skipped, campaignId }>}
 */
export async function sendSequenceStep({
  campaign,
  stepIndex,
  allProspects,
  fromEmail,
  fromName,
  onProgress,
}) {
  const sequenceSteps = campaign.sequence_steps || [];
  const step          = sequenceSteps[stepIndex];
  if (!step) throw new Error(`Sequence step ${stepIndex} not found on campaign ${campaign.id}`);

  const settings   = campaign.settings || {};
  const campaignId = campaign.id;

  // ── 1. Filter prospects by campaign filters ──────────────────────────────────
  let prospects = filterProspectsForCampaign(allProspects, campaign.filters || {});

  // ── 2. Stop-on-reply: exclude anyone who replied to a previous step ──────────
  if (settings.stop_on_reply !== false) {
    const { data: replied } = await supabase
      .from('outreach_emails')
      .select('prospect_id')
      .eq('campaign_id', campaignId)
      .eq('status', 'replied');
    if (replied?.length) {
      const repliedIds = new Set(replied.map(r => r.prospect_id));
      prospects = prospects.filter(p => !repliedIds.has(p.id));
    }
  }

  // ── 3. Cap at max_per_send ───────────────────────────────────────────────────
  const maxPerSend = settings.max_per_send;
  if (maxPerSend && maxPerSend > 0) {
    prospects = prospects.slice(0, maxPerSend);
  }

  const total   = prospects.length;
  let   sent    = 0;
  let   failed  = 0;
  let   skipped = 0;

  // Mark as sending
  await updateCampaign(campaignId, { status: 'sending', total_recipients: total });

  try {
    for (let i = 0; i < prospects.length; i++) {
      const prospect = prospects[i];
      try {
        // Resolve subject + body from step config
        let subject = mergeTags(step.subject || '', prospect);
        let body    = mergeTags(step.body    || '', prospect);

        // AI personalise only for step 1 (cold outreach)
        if (settings.ai_personalisation && stepIndex === 0) {
          try {
            const generated = await generateColdEmail({ prospect });
            if (generated?.subject) subject = generated.subject;
            if (generated?.body)    body    = generated.body;
          } catch (aiErr) {
            console.warn('[Sequence] AI personalisation failed for', prospect.company_name, aiErr.message);
          }
        }

        // Append unsubscribe footer
        body = body + buildUnsubscribeFooter(fromName, prospect.email);

        // Log to outreach_emails (returns row with id for pixel)
        const emailRow = await logOutreachEmail({
          prospectId: prospect.id,
          emailType:  'campaign',
          subject,
          body,
          campaignId,
        });

        // Append tracking pixel
        const bodyWithPixel = body + buildPixelHtml(emailRow.id);

        // Deliver via Resend (skip suppressed addresses)
        const suppressed = await isEmailSuppressed(prospect.email);
        if (prospect.email && !suppressed) {
          await sendEmail({
            subject,
            fromEmail,
            fromName,
            html:       bodyToHtml(bodyWithPixel),
            recipients: [{ email: prospect.email, name: prospect.contact_name || prospect.company_name }],
          });
        } else {
          skipped++;
        }

        sent++;
        onProgress?.(sent, total);

      } catch (prospectErr) {
        failed++;
        console.warn('[Sequence] Failed to send to', prospect.company_name, prospectErr.message);
      }

      // Rate limit
      if (i < prospects.length - 1) await new Promise(r => setTimeout(r, SEND_DELAY_MS));
    }

    // ── Update step progress ──────────────────────────────────────────────────
    const newStepSent   = stepIndex + 1;
    const allStepsDone  = newStepSent >= sequenceSteps.length;

    await updateCampaign(campaignId, {
      status:     allStepsDone ? 'sent' : 'draft',   // 'draft' allows re-claiming for next step
      step_sent:  newStepSent,
      sent_count: (campaign.sent_count || 0) + sent,
      ...(allStepsDone ? { sent_at: new Date().toISOString() } : {}),
    });

  } catch (fatalErr) {
    await updateCampaign(campaignId, { status: 'paused' }).catch(() => {});
    throw fatalErr;
  }

  return { sent, failed, skipped, campaignId };
}
