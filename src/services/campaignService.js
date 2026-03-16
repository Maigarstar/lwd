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

function buildUnsubscribeFooter(fromName = 'Luxury Wedding Directory') {
  return `

---
This email was sent by ${fromName} as part of a sales outreach campaign.

If you no longer wish to receive emails from us, please reply with "Unsubscribe" in the subject line and we will remove you promptly.

Luxury Wedding Directory
hello@luxuryweddingdirectory.co.uk`;
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
  } = filters;

  return prospects.filter(p => {
    if (!p.email) return false; // must have email to receive campaign
    if (statuses.length && !statuses.includes(p.status)) return false;
    if (pipeline_id && p.pipeline_id !== pipeline_id) return false;
    if (stage_ids?.length && !stage_ids.includes(p.stage_id)) return false;
    if (venue_types?.length && !venue_types.includes(p.venue_type)) return false;
    if (min_score != null && (p.lead_score ?? 0) < min_score) return false;
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
  // Idempotency guard: never resend a sent campaign
  if (campaign.status === 'sent') {
    throw new Error('This campaign has already been sent. Use "Send Again" to create a new campaign.');
  }

  const campaignId = campaign.id;
  const total      = prospects.length;
  let   sent       = 0;
  let   failed     = 0;

  // Lock the campaign into 'sending' state
  await updateCampaign(campaignId, {
    status:           'sending',
    total_recipients: total,
    sent_count:       0,
  });

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
        body = body + buildUnsubscribeFooter(fromName);

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

        // 6. Send via Resend
        if (prospect.email) {
          await sendEmail({
            to:       prospect.email,
            toName:   prospect.contact_name || prospect.company_name,
            subject,
            text:     bodyWithPixel,
            fromEmail,
            fromName,
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
