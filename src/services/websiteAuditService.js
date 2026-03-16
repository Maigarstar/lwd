// ─── src/services/websiteAuditService.js ─────────────────────────────────────
// Shared audit engine powering two workflows:
//   1. Sales Pipeline - prospect outreach (prospect_id)
//   2. Vendor Dashboard - Authority Score (listing_id)
//
// Reuses: ai-generate edge function, SEO_SYSTEM prompt, logOutreachEmail pattern

import { supabase } from '../lib/supabaseClient';
import { SEO_SYSTEM } from '../lib/aiPrompts';

// ── Score labels + colours ────────────────────────────────────────────────────

export function scoreLabel(score) {
  if (score < 35)  return 'Critical';
  if (score < 55)  return 'Weak';
  if (score < 75)  return 'Fair';
  if (score < 90)  return 'Good';
  return 'Strong';
}

export function scoreColor(score) {
  if (score < 35)  return '#ef4444';  // red
  if (score < 55)  return '#f97316';  // amber
  if (score < 75)  return '#eab308';  // yellow
  if (score < 90)  return '#22c55e';  // green
  return '#10b981';                   // emerald
}

// ── Issue labels (human-readable, ordered by signal weight) ──────────────────

const SIGNAL_META = {
  title: {
    weight: 15,
    label: (f) => {
      if (!f.title.value) return 'Missing page title';
      if (f.title.length < 40) return `Page title too short (${f.title.length} chars, min 40)`;
      if (f.title.length > 65) return `Page title too long (${f.title.length} chars, max 65)`;
      return null;
    },
  },
  description: {
    weight: 15,
    label: (f) => {
      if (!f.description.value) return 'No meta description';
      if (f.description.length < 120) return `Meta description too short (${f.description.length} chars, min 120)`;
      if (f.description.length > 160) return `Meta description too long (${f.description.length} chars, max 160)`;
      return null;
    },
  },
  schema: {
    weight: 15,
    label: (f) => (!f.schema.present ? 'No structured data (JSON-LD)' : null),
  },
  h1: {
    weight: 10,
    label: (f) => {
      if (f.h1.count === 0) return 'No H1 heading';
      if (f.h1.count > 1)  return `${f.h1.count} H1 headings (should be 1)`;
      return null;
    },
  },
  og: {
    weight: 10,
    label: (f) => {
      if (!f.og.title && !f.og.description && !f.og.image) return 'No Open Graph (social sharing) tags';
      if (!f.og.complete) return 'Incomplete Open Graph tags';
      return null;
    },
  },
  https: {
    weight: 10,
    label: (f) => (!f.https.ok ? 'Site not served over HTTPS' : null),
  },
  viewport: {
    weight: 5,
    label: (f) => (!f.viewport.present ? 'No viewport meta tag (mobile unfriendly)' : null),
  },
  canonical: {
    weight: 5,
    label: (f) => (!f.canonical.present ? 'No canonical URL tag' : null),
  },
  sitemap: {
    weight: 5,
    label: (f) => (!f.sitemap.found ? 'No sitemap.xml found' : null),
  },
  robots: {
    weight: 5,
    label: (f) => (f.robots.noindex ? 'Page is set to noindex (hidden from Google)' : null),
  },
  images: {
    weight: 5,
    label: (f) => {
      if (f.images.total > 0 && !f.images.ok) {
        return `${f.images.total - f.images.withAlt} images missing alt text`;
      }
      return null;
    },
  },
};

/**
 * Returns up to `limit` failing signals ordered by weight (critical first).
 * Each item: { signal, label, weight, severity }
 */
export function getTopIssues(findings, limit = 3) {
  if (!findings || typeof findings !== 'object') return [];

  const issues = [];
  for (const [signal, meta] of Object.entries(SIGNAL_META)) {
    if (!findings[signal]) continue;
    const label = meta.label(findings);
    if (label) {
      issues.push({
        signal,
        label,
        weight:   meta.weight,
        severity: meta.weight >= 10 ? 'critical' : 'warning',
      });
    }
  }

  // Sort by weight descending, return top `limit`
  return issues
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit);
}

// ── AI helper ─────────────────────────────────────────────────────────────────

async function callAI(feature, userPrompt) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt: SEO_SYSTEM, userPrompt },
  });
  if (error) throw new Error(error.message || 'AI service error');
  if (!data || data.error) {
    const msg = data?.status === 'not_configured'
      ? 'AI not configured - set up a provider in Admin > AI Settings'
      : (data?.error || 'AI service unavailable');
    throw new Error(msg);
  }
  return (data.text || '').trim();
}

// ── runAudit ─────────────────────────────────────────────────────────────────

/**
 * Fetches the URL via the audit-website edge function, saves to website_audits,
 * optionally logs a CRM activity row, and returns the saved row.
 *
 * @param {string} url - Website URL to audit
 * @param {{ prospectId?: string, listingId?: string, logActivity?: boolean }} opts
 * @returns {Promise<object>} Saved website_audits row
 */
export async function runAudit(url, { prospectId, listingId, logActivity = true } = {}) {
  // 1. Call audit-website edge function
  const { data: fnData, error: fnError } = await supabase.functions.invoke('audit-website', {
    body: { url },
  });

  if (fnError) throw new Error(fnError.message || 'Audit function error');

  const score    = fnData?.score    ?? 0;
  const findings = fnData?.findings ?? {};
  const auditUrl = fnData?.url      ?? url;

  // 2. Save to website_audits
  const row = {
    url:          auditUrl,
    score,
    findings,
    audit_type: 'manual',
    ...(prospectId && { prospect_id: prospectId }),
    ...(listingId  && { listing_id:  listingId  }),
  };

  const { data: saved, error: saveError } = await supabase
    .from('website_audits')
    .insert([row])
    .select()
    .single();

  if (saveError) throw new Error(saveError.message);

  // 3. Log CRM activity if for a prospect
  if (prospectId && logActivity) {
    try {
      await supabase.from('outreach_emails').insert([{
        prospect_id: prospectId,
        email_type:  'audit',
        subject:     `Website audit completed - Score ${score} (${scoreLabel(score)})`,
        body:        `Audit run on ${auditUrl}. Score: ${score}/100 (${scoreLabel(score)}). Top issues: ${getTopIssues(findings, 3).map(i => i.label).join('; ') || 'None detected'}.`,
        sent_at:     new Date().toISOString(),
        status:      'sent',
        direction:   'internal',
      }]);
    } catch (actErr) {
      // Activity log failure is non-fatal
      console.warn('Could not log audit activity:', actErr);
    }
  }

  return saved;
}

// ── fetchLatestAudit ──────────────────────────────────────────────────────────

/**
 * Fetches the most recent website_audits row for a prospect or listing.
 * Returns null if none found.
 */
export async function fetchLatestAudit({ prospectId, listingId } = {}) {
  if (!prospectId && !listingId) return null;

  let query = supabase
    .from('website_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1);

  if (prospectId) query = query.eq('prospect_id', prospectId);
  else            query = query.eq('listing_id', listingId);

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

// ── fetchAllAudits ────────────────────────────────────────────────────────────

/**
 * Fetches all website_audits rows for the Visibility Intelligence admin tabs.
 * @param {{ type?: 'prospect'|'listing'|'all', limit?: number }} opts
 */
export async function fetchAllAudits({ type = 'all', limit = 100 } = {}) {
  let query = supabase
    .from('website_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (type === 'prospect') query = query.not('prospect_id', 'is', null);
  if (type === 'listing')  query = query.not('listing_id',  'is', null);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data ?? [];
}

// ── checkAiVisibility ─────────────────────────────────────────────────────────

/**
 * Asks the AI whether it has knowledge of a venue.
 * Updates the website_audits row in place if auditId provided.
 * @returns {{ visible: boolean, note: string }}
 */
export async function checkAiVisibility(venueName, location, { auditId } = {}) {
  const prompt = `Do you have knowledge of "${venueName}" in ${location} as a wedding venue? Reply with exactly one of:\nKNOWN: [one sentence about what you know]\nUNKNOWN`;

  const raw = await callAI('ai_visibility', prompt);

  const visible = raw.toUpperCase().startsWith('KNOWN');
  const note    = visible
    ? raw.replace(/^KNOWN:\s*/i, '').trim()
    : 'No AI knowledge found for this venue';

  // Persist result to the audit row
  if (auditId) {
    await supabase
      .from('website_audits')
      .update({ ai_visible: visible, ai_visible_note: note })
      .eq('id', auditId);
  }

  return { visible, note };
}

// ── generateAuditEmail ────────────────────────────────────────────────────────

/**
 * Generates a personalised cold outreach email citing specific SEO issues.
 * Returns { subject, body } ready to pre-fill OutreachModal.
 */
export async function generateAuditEmail(auditRow, prospect) {
  const issues    = getTopIssues(auditRow.findings, 3);
  const issueList = issues.map((i, idx) => `${idx + 1}. ${i.label}`).join('\n');
  const label     = scoreLabel(auditRow.score);
  const company   = prospect?.company || prospect?.name || 'your business';

  const userPrompt = `Write a cold outreach email for ${company} who has a website at ${auditRow.url}.

Their website visibility score is ${auditRow.score}/100 (${label}).

Top issues found:
${issueList || 'General visibility improvements needed.'}

Rules:
- Under 200 words
- Reference 1-2 specific issues from the list by name
- Position Luxury Wedding Directory's team as the solution
- Professional but warm tone
- CTA: invite them to a call or reply
- NO generic filler phrases
- Return JSON only: {"subject":"...","body":"..."}`;

  const raw = await callAI('audit_email', userPrompt);

  // Parse JSON response
  try {
    // Handle markdown code fences if present
    const cleaned = raw.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed  = JSON.parse(cleaned);
    return {
      subject: parsed.subject || `Your website visibility needs attention - ${label} score`,
      body:    parsed.body    || raw,
    };
  } catch {
    // Fallback: use raw text as body
    return {
      subject: `Your website visibility needs attention - ${label} score`,
      body:    raw,
    };
  }
}
