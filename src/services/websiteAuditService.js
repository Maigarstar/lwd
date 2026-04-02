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

// ── extractContactFromUrl ─────────────────────────────────────────────────────

const CONTACT_SYSTEM = `You are a B2B research assistant for a luxury wedding directory sales team.
Given a website URL and its page metadata, extract real business contact details.
Rules:
- Only report email or phone if you can actually see them in the provided metadata.
- For contact_name: use 'inferred' if you know the business owner from public knowledge, otherwise 'not_found'.
- For company_name: use 'found' if it is in og.title or page title, otherwise 'inferred'.
- Never invent email addresses, phone numbers, or personal names.
- location should be a city or region if inferable, otherwise empty string.
- business_type should be one of: Venue, Photographer, Florist, Caterer, Planner, Musician, Hair and Makeup, Cake Designer, Stationery, Jewellery, Transport, Vendor
- Return ONLY valid JSON, no markdown.`;

/**
 * Uses AI to extract contact details from a website URL + its audit findings.
 * Each field carries a confidence label: 'found' | 'inferred' | 'not_found'.
 *
 * @param {string}  url      - Website URL
 * @param {object}  findings - findings object from runAudit (title, og, h1, schema)
 * @returns {Promise<{
 *   company_name, contact_name, phone, email, location, business_type, notes,
 *   confidence: { company_name, contact_name, phone, email, location }
 * }>}
 */
export async function extractContactFromUrl(url, findings = {}) {
  const meta = {
    title:          findings.title?.value       || '',
    og_title:       findings.og?.title          || '',
    og_description: findings.og?.description    || '',
    h1:             findings.h1?.firstValue      || '',
    schema_types:   (findings.schema?.types || []).join(', '),
  };

  const userPrompt = `Website URL: ${url}
Page title: "${meta.title}"
OG title: "${meta.og_title}"
OG description: "${meta.og_description}"
H1: "${meta.h1}"
Schema types: "${meta.schema_types}"

Extract business contact details. Return JSON only:
{
  "company_name": "",
  "contact_name": "",
  "email": "",
  "phone": "",
  "location": "",
  "business_type": "",
  "notes": "",
  "confidence": {
    "company_name": "found|inferred|not_found",
    "contact_name": "found|inferred|not_found",
    "email": "found|not_found",
    "phone": "found|not_found",
    "location": "found|inferred|not_found"
  }
}`;

  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature: 'url_contact_extract', systemPrompt: CONTACT_SYSTEM, userPrompt },
  });

  const raw = data?.text || '';
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

  let result = {};
  try { result = JSON.parse(cleaned); } catch { result = {}; }

  // Safe defaults - never invent missing data
  return {
    company_name:  result.company_name  || '',
    contact_name:  result.contact_name  || '',
    email:         result.email         || '',
    phone:         result.phone         || '',
    location:      result.location      || '',
    business_type: result.business_type || 'Venue',
    notes:         result.notes         || '',
    confidence: {
      company_name:  result.confidence?.company_name  || 'not_found',
      contact_name:  result.confidence?.contact_name  || 'not_found',
      email:         result.confidence?.email         || 'not_found',
      phone:         result.confidence?.phone         || 'not_found',
      location:      result.confidence?.location      || 'not_found',
    },
  };
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
  const locationClause = location ? ` in ${location}` : '';
  const prompt = `You are evaluating AI search presence for a wedding business.

Business name: "${venueName}"${locationClause}

Answer the following as JSON only. Base every answer strictly on your training data - do not speculate or infer:
{
  "known": true or false,
  "note": "One sentence: what you know about this specific business, or 'No knowledge of this brand found in training data'",
  "highIntentPresence": true or false,
  "highIntentNote": "One sentence: whether this brand would appear in AI responses to high-intent queries like 'best wedding venues near [location]', and why"
}`;

  const raw = await callAI('ai_visibility', prompt);

  let parsed = null;
  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    parsed = JSON.parse(cleaned);
  } catch {
    // Fallback to legacy format
    const visible = raw.toUpperCase().startsWith('KNOWN');
    parsed = {
      known: visible,
      note: visible ? raw.replace(/^KNOWN:\s*/i, '').trim() : 'No knowledge of this brand found in training data',
      highIntentPresence: null,
      highIntentNote: null,
    };
  }

  const visible             = Boolean(parsed.known);
  const note                = parsed.note || (visible ? 'Brand is known in training data' : 'No knowledge of this brand found in training data');
  const highIntentPresence  = parsed.highIntentPresence ?? null;
  const highIntentNote      = parsed.highIntentNote || null;

  if (auditId) {
    await supabase
      .from('website_audits')
      .update({ ai_visible: visible, ai_visible_note: note })
      .eq('id', auditId);
  }

  return { visible, note, highIntentPresence, highIntentNote };
}

// ── Impact descriptions per signal ───────────────────────────────────────────

const SIGNAL_IMPACT = {
  title:       'The page title is the first thing both search engines and couples see in search results. Without a compelling, well-optimised title, this page is unlikely to rank - and even less likely to earn a click when it does.',
  description: 'The meta description is effectively a 160-character pitch in search results. A missing or weak description leaves couples with no reason to click through, even when the site does appear.',
  schema:      'Structured data tells Google exactly what this business is and what it offers. Without it, the site misses out on rich results, star ratings, and event features that help listings stand out from competitors.',
  h1:          'The main heading sets the tone for both visitors and search engines. Without a clear H1, the page can feel unfocused - reducing confidence and increasing the chance a couple leaves without enquiring.',
  og:          'When links are shared on Instagram, Facebook, or WhatsApp, Open Graph tags control the preview image and description. Without them, links appear as plain text and lose the visual impact that drives referral clicks.',
  https:       'HTTPS is now a baseline expectation for any professional website. Sites flagged as "Not Secure" by browsers risk losing trust at the exact moment a couple is deciding whether to make an enquiry.',
  viewport:    'A missing viewport tag means the site may not display correctly on mobile phones. Given that most couples browse venues on their phone, a poor mobile experience directly reduces the chance of an enquiry.',
  canonical:   'A canonical tag prevents search engines from treating similar pages as duplicates. Without one, ranking authority can be divided across multiple URLs, weakening the overall search performance of the site.',
  sitemap:     'A sitemap helps search engines discover and index every page on the site. Without one, key pages - such as galleries, packages, or location-specific content - may never appear in search results.',
  robots:      'This page is currently set to noindex, meaning it is actively excluded from Google and other search engines. No SEO investment will help a page that is hidden from search.',
  images:      'Images without descriptive alt text miss keyword opportunities and reduce the perceived quality of the site. For premium and luxury venues, presentation standards matter at every level of the experience.',
};

// ── Severity thresholds ───────────────────────────────────────────────────────
// critical  : weight >= 15 (directly affects indexing and visibility)
// important : weight 10-14 (affects ranking, trust, and usability)
// minor     : weight < 10  (best-practice gaps)

function _signalSeverity(weight) {
  if (weight >= 15) return 'critical';
  if (weight >= 10) return 'important';
  return 'minor';
}

/** Returns { critical, important, minor } counts for a findings object */
export function getIssueSeverityCounts(findings) {
  if (!findings || typeof findings !== 'object') return { critical: 0, important: 0, minor: 0 };
  const counts = { critical: 0, important: 0, minor: 0 };
  for (const [signal, meta] of Object.entries(SIGNAL_META)) {
    if (!findings[signal]) continue;
    if (meta.label(findings)) counts[_signalSeverity(meta.weight)]++;
  }
  return counts;
}

/** Returns all failing issues with labels, impact text, and severity */
export function getIssuesWithImpact(findings) {
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
        severity: _signalSeverity(meta.weight),
        impact:   SIGNAL_IMPACT[signal] || '',
      });
    }
  }
  return issues.sort((a, b) => b.weight - a.weight);
}

/** Returns signals that passed (no issue found) */
export function getPassedSignals(findings) {
  if (!findings || typeof findings !== 'object') return [];
  const LABELS = {
    title: 'Page title present and well-formed',
    description: 'Meta description present and within length',
    schema: 'Structured data (JSON-LD) detected',
    h1: 'Single H1 heading present',
    og: 'Open Graph tags complete',
    https: 'Site served over HTTPS',
    viewport: 'Mobile viewport tag present',
    canonical: 'Canonical URL tag present',
    sitemap: 'sitemap.xml found',
    robots: 'Page is indexable',
    images: 'All images have alt text',
  };
  return Object.entries(SIGNAL_META)
    .filter(([signal, meta]) => findings[signal] && !meta.label(findings))
    .map(([signal]) => ({ signal, label: LABELS[signal] || signal }));
}

// ── Domain normalisation ──────────────────────────────────────────────────────

export function normalizeDomain(url) {
  if (!url) return '';
  try {
    const u = new URL(url.startsWith('http') ? url : `https://${url}`);
    return u.hostname.replace(/^www\./, '');
  } catch {
    return url.replace(/^https?:\/\/(www\.)?/, '').split('/')[0].split('?')[0];
  }
}

// ── Trend computation ─────────────────────────────────────────────────────────

/** Compares current score against previous audit to produce a trend indicator */
export function computeTrend(latestScore, history) {
  if (!history || history.length === 0) return { label: 'No history yet', value: 0, direction: 'none' };
  const prev = history[0];
  const diff = latestScore - prev.score;
  if (Math.abs(diff) <= 2) return { label: 'Stable', value: 0, direction: 'stable' };
  if (diff > 0) return { label: `+${diff}`, value: diff, direction: 'up' };
  return { label: String(diff), value: diff, direction: 'down' };
}

// ── Enquiry Experience scoring ────────────────────────────────────────────────

/**
 * Derives an enquiry experience score from structural audit signals.
 * Tier 1 only: no external data required.
 * Returns { score: 0-100, label, signals[] }
 */
export function scoreEnquiryExperience(findings) {
  if (!findings) return { score: 50, label: 'Unknown', signals: [] };

  const signals = [];
  let score = 100;

  if (!findings.https?.ok) {
    score -= 25;
    signals.push({ issue: 'Site not served over HTTPS', impact: 'Lack of a security certificate reduces visitor trust and may deter enquiries from cautious couples.', severity: 'critical' });
  }
  if (!findings.viewport?.present) {
    score -= 20;
    signals.push({ issue: 'No mobile viewport', impact: 'Visitors on mobile may struggle to read content or locate the contact form, increasing drop-off.', severity: 'important' });
  }
  if (!findings.og?.title && !findings.og?.description) {
    score -= 15;
    signals.push({ issue: 'No brand messaging detected', impact: 'Limited OG tags suggest the site has not invested in how it communicates online, which can feel impersonal.', severity: 'important' });
  }
  if (findings.h1?.count === 0) {
    score -= 15;
    signals.push({ issue: 'No clear page headline', impact: 'Without a strong H1, visitors may not immediately understand the offer, increasing the chance they leave without enquiring.', severity: 'important' });
  }
  if (!findings.schema?.present) {
    score -= 10;
    signals.push({ issue: 'No structured business identity', impact: 'Google and visitors may struggle to categorise what this business offers, reducing confidence in the brand.', severity: 'minor' });
  }
  if (findings.images?.total > 0 && !findings.images?.ok) {
    score -= 5;
    signals.push({ issue: 'Images without descriptive labels', impact: 'Reduces perceived professionalism, particularly for visitors using screen readers or slow connections.', severity: 'minor' });
  }

  score = Math.max(0, score);

  let label = 'Excellent';
  if (score < 40)      label = 'Poor';
  else if (score < 60) label = 'Weak';
  else if (score < 80) label = 'Good';

  return { score, label, signals };
}

// ── Opportunity Score ─────────────────────────────────────────────────────────

/**
 * Computes a commercial opportunity score from SEO score, issue severity,
 * and enquiry experience. Returns 'High' | 'Medium' | 'Low'.
 */
export function computeOpportunityScore(seoScore, findings) {
  const { critical, important } = getIssueSeverityCounts(findings);
  const { score: eqScore } = scoreEnquiryExperience(findings);

  let raw = 100 - seoScore;
  raw += critical * 8;
  raw += important * 4;
  raw += Math.round((100 - eqScore) * 0.15);
  raw = Math.min(100, raw);

  if (raw >= 55) return 'High';
  if (raw >= 30) return 'Medium';
  return 'Low';
}

// ── Domain-grouped audit fetch ────────────────────────────────────────────────

/**
 * Fetches all audits and groups them by normalised domain.
 * Each entry: { domain, latest: auditRow, history: auditRow[] }
 * Returns an array sorted by latest audit date descending.
 */
export async function fetchDomainGroupedAudits(limit = 400) {
  const { data, error } = await supabase
    .from('website_audits')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  const byDomain = {};
  for (const audit of (data ?? [])) {
    const domain = normalizeDomain(audit.url);
    if (!byDomain[domain]) {
      byDomain[domain] = { domain, latest: audit, history: [] };
    } else {
      byDomain[domain].history.push(audit);
    }
  }

  return Object.values(byDomain);
}

// ── Intelligence summary (AI) ─────────────────────────────────────────────────

/**
 * Generates a 3-part client-ready summary: visibility, conversion, opportunity.
 * Uses the existing ai-generate edge function.
 */
export async function generateIntelligenceSummary(auditRow) {
  const issues = getIssuesWithImpact(auditRow.findings);
  const { label: eqLabel, score: eqScore } = scoreEnquiryExperience(auditRow.findings);
  const criticalList = issues.filter(i => i.severity === 'critical').map(i => i.label).slice(0, 2).join('; ');

  const userPrompt = `Website: ${auditRow.url}
SEO Score: ${auditRow.score}/100 (${scoreLabel(auditRow.score)})
Critical issues: ${criticalList || 'None'}
Enquiry experience: ${eqLabel} (${eqScore}/100)
Total issues: ${issues.length}

Generate a 4-part intelligence summary as JSON only:
{
  "visibility": "1-2 sentences on current search visibility and what is limiting it",
  "conversion": "1-2 sentences on the enquiry experience and what signals affect conversion",
  "opportunity": "1 sentence on the primary commercial gain if key issues are addressed",
  "experienceInsight": "1 sentence describing how the enquiry journey feels from a couple's perspective - e.g. warm and inviting, clinical and impersonal, unclear, confusing, polished, etc."
}

Rules: commercial and client-ready tone, not developer language. Reference specific signals where relevant. Under 160 words total. No jargon, no bullet points, no markdown.`;

  const raw = await callAI('intelligence_summary', userPrompt);

  try {
    const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
    const parsed  = JSON.parse(cleaned);
    return {
      visibility:        parsed.visibility        || '',
      conversion:        parsed.conversion        || '',
      opportunity:       parsed.opportunity       || '',
      experienceInsight: parsed.experienceInsight || '',
    };
  } catch {
    const crit = issues.filter(i => i.severity === 'critical').length;
    return {
      visibility:        `This site scores ${auditRow.score}/100 with ${crit} critical visibility ${crit === 1 ? 'issue' : 'issues'} identified.`,
      conversion:        `The enquiry experience is rated ${eqLabel}, which may be affecting how many visitors complete contact forms.`,
      opportunity:       'Addressing the key issues identified could meaningfully improve both search visibility and enquiry rates.',
      experienceInsight: '',
    };
  }
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
