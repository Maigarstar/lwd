/**
 * enquiryToProspectService.js
 *
 * Bridge between website enquiry forms and the B2B sales pipeline.
 * When a partner enquiry arrives (venue listing, vendor application, planner
 * collaboration, general contact) this service:
 *
 *   1. Normalises the raw form data into a prospect record
 *   2. Runs auto pipeline assignment (rules -> AI -> fallback)
 *   3. Places the prospect in the first stage of the assigned pipeline
 *   4. Seeds the lead score immediately
 *   5. Logs a note in outreach_emails
 *   6. Fires the stage's first-response email template if one is configured
 *
 * Usage:
 *   import { createProspectFromEnquiry } from './enquiryToProspectService';
 *
 *   // In PartnerEnquiryForm.handleSubmit:
 *   await createProspectFromEnquiry({
 *     company_name:  form.businessName,
 *     contact_name:  form.contactName,
 *     email:         form.email,
 *     phone:         form.phone,
 *     website:       form.website,
 *     venue_type:    form.businessType,
 *     source:        'Partner Enquiry Form',
 *     notes:         form.message,
 *     interests:     form.interests,   // array of strings
 *   });
 */

import { supabase }             from '../lib/supabaseClient';
import { createProspect }       from './salesPipelineService';
import {
  assignProspectPipeline,
  fetchAssignmentRules,
  fetchAssignmentSettings,
}                               from './pipelineAssignmentService';
import { calculateLeadScore }   from './leadScoringService';
import { autoLinkProspect }     from './leadProspectBridgeService';
import {
  fetchPipelines,
  fetchStages,
  fetchStageTemplate,
  mergeTags,
}                               from './pipelineBuilderService';

// ── Source to venue_type mapper ───────────────────────────────────────────────
// Maps form `businessType` values to a normalised venue_type string

const BUSINESS_TYPE_MAP = {
  venue:       'Venue',
  photographer:'Photographer',
  florist:     'Florist',
  caterer:     'Caterer',
  planner:     'Planner',
  musician:    'Musician',
  band:        'Band',
  hair_makeup: 'Hair and Makeup',
  cake:        'Cake Designer',
  stationery:  'Stationer',
  jewellery:   'Jewellery',
  transport:   'Transport',
  other:       'Vendor',
};

// Maps interests array to a source string for the rules engine
const INTEREST_SOURCE_MAP = {
  'Venue Listing':      'List Your Venue',
  'Vendor Listing':     'Vendor Signup',
  'Featured Placement': 'Featured',
  'Advertising':        'Advertising',
  'Editorial Feature':  'Editorial',
  'Partnership':        'Partnership',
};

// ── Main function ─────────────────────────────────────────────────────────────

/**
 * Full pipeline entry point for any website enquiry form.
 *
 * @param {object} enquiry
 *   @param {string}   enquiry.company_name  - Business name (required)
 *   @param {string}   enquiry.contact_name  - Contact person
 *   @param {string}   enquiry.email         - Email address
 *   @param {string}   enquiry.phone
 *   @param {string}   enquiry.website
 *   @param {string}   enquiry.venue_type    - Raw business type (mapped internally)
 *   @param {string}   enquiry.source        - Where they came from (overrides interest-map)
 *   @param {string}   enquiry.country       - Country (defaults to 'United Kingdom')
 *   @param {string}   enquiry.notes         - Message / notes
 *   @param {string[]} enquiry.interests     - Interests array from PartnerEnquiryForm
 *   @param {string}   enquiry.package       - 'Standard' | 'Premium' | 'Elite'
 *   @param {boolean}  enquiry.sendFirstEmail - Whether to fire stage email template (default true)
 *
 * @returns {Promise<{
 *   prospect: object,
 *   pipeline_name: string,
 *   stage_name: string,
 *   lead_score: number,
 *   assignment_method: 'rule'|'ai'|'fallback',
 *   email_sent: boolean,
 * }>}
 */
export async function createProspectFromEnquiry(enquiry) {
  const {
    company_name,
    contact_name,
    email,
    phone,
    website,
    venue_type: rawType,
    source: rawSource,
    country = 'United Kingdom',
    notes,
    interests = [],
    package: pkg = 'Standard',
    sendFirstEmail = true,
  } = enquiry;

  // Normalise venue_type
  const venue_type = BUSINESS_TYPE_MAP[rawType?.toLowerCase()] || rawType || 'Vendor';

  // Derive source from interests if not explicitly provided
  const source = rawSource || INTEREST_SOURCE_MAP[interests[0]] || 'Partner Enquiry Form';

  // Build the prospect data shape used by the assignment engine
  const prospectData = { company_name, contact_name, email, phone, website, venue_type, source, country, notes };

  // 1. Load pipelines, rules, settings in parallel
  const [pipelines, rules, settings] = await Promise.all([
    fetchPipelines(),
    fetchAssignmentRules(),
    fetchAssignmentSettings(),
  ]);

  // 2. Auto-assign pipeline
  const assignment = await assignProspectPipeline(prospectData, { rules, settings, pipelines });
  const pipeline_id = assignment.pipeline_id;

  // 3. Load stages for the assigned pipeline, pick position=0
  const stages = await fetchStages(pipeline_id);
  const firstStage = stages.sort((a, b) => a.position - b.position)[0];
  const stage_id   = firstStage?.id   || null;
  const stage_name = firstStage?.name || 'Prospect';

  // 4. Seed lead score (no history yet)
  const partialProspect = { ...prospectData, pipeline_stage: stage_name };
  const lead_score = calculateLeadScore(partialProspect, []);

  // 5. Create the prospect record
  const payload = {
    company_name,
    contact_name:  contact_name || null,
    email:         email || null,
    phone:         phone || null,
    website:       website || null,
    venue_type:    venue_type,
    source:        source,
    country,
    notes:         notes || null,
    package:       pkg,
    pipeline_id,
    stage_id,
    pipeline_stage: stage_name,
    status:        'active',
    lead_score,
    last_contacted_at: null,
    next_follow_up_at: firstStage?.auto_follow_up_days
      ? new Date(Date.now() + firstStage.auto_follow_up_days * 86400000).toISOString()
      : null,
  };

  const prospect = await createProspect(payload);

  // Auto-link to any existing B2C lead with the same email (fire-and-forget)
  if (email) autoLinkProspect(prospect.id, email).catch(() => {});

  // 6. Log the enquiry as an activity note
  const noteBody = [
    `Enquiry received from website form.`,
    interests.length ? `Interests: ${interests.join(', ')}.` : null,
    notes ? `Message: "${notes.slice(0, 400)}"` : null,
    `Assigned via ${assignment.method} to ${pipelines.find(p => p.id === pipeline_id)?.name || 'pipeline'}.`,
  ].filter(Boolean).join(' ');

  await supabase.from('outreach_emails').insert([{
    prospect_id: prospect.id,
    email_type:  'custom',
    subject:     `Enquiry received: ${company_name}`,
    body:        noteBody,
    status:      'sent',
    sent_at:     new Date().toISOString(),
  }]);

  // 7. Fire first-response email template if stage has one configured
  let email_sent = false;
  if (sendFirstEmail && stage_id && email) {
    try {
      const template = await fetchStageTemplate(stage_id);
      if (template) {
        const subject = mergeTags(template.subject, prospect);
        const body    = mergeTags(template.body,    prospect);

        const fromEmail = typeof localStorage !== 'undefined'
          ? localStorage.getItem('emailFromAddress') || ''
          : '';
        const fromName = typeof localStorage !== 'undefined'
          ? localStorage.getItem('emailFromName') || 'Luxury Wedding Directory'
          : 'Luxury Wedding Directory';

        if (fromEmail) {
          const { error: sendErr } = await supabase.functions.invoke('send-email', {
            body: { to: email, subject, body, fromEmail, fromName },
          });

          if (!sendErr) {
            // Log the sent email
            await supabase.from('outreach_emails').insert([{
              prospect_id: prospect.id,
              email_type:  template.email_type || 'custom',
              subject,
              body,
              status:  'sent',
              sent_at: new Date().toISOString(),
            }]);

            // Schedule next follow-up if stage has auto_follow_up_days
            if (firstStage?.auto_follow_up_days) {
              await supabase.from('prospects').update({
                last_contacted_at: new Date().toISOString(),
                next_follow_up_at: new Date(
                  Date.now() + firstStage.auto_follow_up_days * 86400000
                ).toISOString(),
              }).eq('id', prospect.id);
            }

            email_sent = true;
          }
        }
      }
    } catch (e) {
      // Non-fatal: email failed but prospect was still created
      console.warn('[enquiryToProspect] First-response email failed:', e.message);
    }
  }

  const pipeline_name = pipelines.find(p => p.id === pipeline_id)?.name || 'Pipeline';

  return {
    prospect,
    pipeline_name,
    stage_name,
    lead_score,
    assignment_method: assignment.method,
    email_sent,
  };
}

// ── Convenience wrappers for specific form types ──────────────────────────────

/**
 * Venue listing enquiry from "List Your Venue" page/form.
 */
export async function createVenueEnquiryProspect({ company_name, contact_name, email, phone, website, country, notes, package: pkg }) {
  return createProspectFromEnquiry({
    company_name, contact_name, email, phone, website, country, notes,
    venue_type: 'Venue',
    source:     'List Your Venue',
    package:    pkg || 'Standard',
  });
}

/**
 * Vendor application from "Join as a Vendor" form.
 */
export async function createVendorApplicationProspect({ company_name, contact_name, email, phone, website, business_type, country, notes }) {
  return createProspectFromEnquiry({
    company_name, contact_name, email, phone, website, country, notes,
    venue_type: BUSINESS_TYPE_MAP[business_type?.toLowerCase()] || business_type || 'Vendor',
    source:     'Vendor Signup',
  });
}

/**
 * Wedding planner collaboration request.
 */
export async function createPlannerCollaborationProspect({ company_name, contact_name, email, phone, website, country, notes }) {
  return createProspectFromEnquiry({
    company_name, contact_name, email, phone, website, country, notes,
    venue_type: 'Planner',
    source:     'Planner Collaboration',
  });
}

/**
 * General partnership / contact form (PartnerEnquiryForm).
 * Accepts the raw form shape from that component.
 */
export async function createPartnerEnquiryProspect(form) {
  return createProspectFromEnquiry({
    company_name: form.businessName,
    contact_name: form.contactName,
    email:        form.email,
    phone:        form.phone,
    website:      form.website,
    venue_type:   form.businessType,
    source:       form.source || 'Partner Enquiry Form',
    notes:        [
      form.message,
      form.interests?.length ? `Interests: ${form.interests.join(', ')}` : null,
    ].filter(Boolean).join('\n'),
    interests:    form.interests || [],
    package:      form.package || 'Standard',
  });
}
