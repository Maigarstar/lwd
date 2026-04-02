/**
 * salesPipelineAiService.js
 * AI assistance for the sales pipeline.
 * Generates follow-up emails, proposals, and next-step advice.
 * Routes through the existing ai-generate Edge Function (no secrets in client).
 */

import { supabase } from '../lib/supabaseClient';

// ── System prompt ─────────────────────────────────────────────────────────────

const BASE_SYSTEM = `You are a senior B2B sales strategist for Luxury Wedding Directory, an elite UK wedding venue and vendor discovery platform.
Your job is to help acquire high-value venue and vendor partnerships through persuasive, professional outreach.

Rules:
- Professional but warm tone - think senior account executive, not pushy salesperson
- Brief and purposeful: every sentence earns its place
- Focus on value to the prospect, not platform features
- UK English spelling (favour, colour, recognise, etc.)
- Never use em dashes - use commas or periods instead
- No spam language (never say "amazing opportunity", "act now", "limited time")
- Address the contact by first name where available
- Reference specific details about the venue or vendor when provided`;

// ── Core AI caller ────────────────────────────────────────────────────────────

async function callAI(feature, systemPrompt, userPrompt) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt, userPrompt },
  });
  if (error) throw new Error(error.message || 'AI service error');
  if (!data || data.error) {
    const msg = data?.status === 'not_configured'
      ? 'AI not configured - set up a provider in Admin > AI Settings'
      : (data?.error || 'AI service unavailable');
    throw new Error(msg);
  }
  return data.text;
}

function safeParseJSON(text, fallback) {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(cleaned); } catch { return fallback; }
}

// ── Context builder ───────────────────────────────────────────────────────────

function prospectContext(prospect) {
  const lines = [`Company: ${prospect.company_name}`];
  if (prospect.contact_name)   lines.push(`Contact: ${prospect.contact_name}`);
  if (prospect.venue_type)     lines.push(`Type: ${prospect.venue_type}`);
  if (prospect.country)        lines.push(`Country: ${prospect.country}`);
  if (prospect.website)        lines.push(`Website: ${prospect.website}`);
  if (prospect.package)        lines.push(`Package interest: ${prospect.package}`);
  if (prospect.proposal_value) lines.push(`Proposal value: GBP ${prospect.proposal_value}`);
  if (prospect.notes)          lines.push(`Notes: ${prospect.notes}`);
  return lines.join('\n');
}

function historyContext(history = []) {
  if (!history.length) return 'No previous emails sent.';
  const lines = history.slice(0, 5).map((h, i) =>
    `Email ${i + 1} (${h.email_type || 'custom'}, ${h.status || 'sent'}): Subject: ${h.subject}`
  );
  const replied = history.some(h => h.status === 'replied');
  if (replied) lines.unshift('NOTE: Prospect has replied to a previous email.');
  return lines.join('\n');
}

// ── Exported service functions ────────────────────────────────────────────────

/**
 * Generate a personalised follow-up email.
 * Returns { subject, body } ready to pre-fill the outreach modal.
 */
export async function generateFollowUpEmail({ prospect, history = [], stageName = '' }) {
  const system = BASE_SYSTEM;
  const user = `Write a follow-up sales email for the prospect below.

Prospect details:
${prospectContext(prospect)}

Current pipeline stage: ${stageName || prospect.pipeline_stage || 'Follow Up'}

Previous email history:
${historyContext(history)}

The email should:
- Reference the previous contact naturally without being awkward
- Provide a clear, low-friction call to action (a quick call or reply)
- Be 3-4 short paragraphs maximum
- Sound like it was written personally for this specific venue or vendor

Return ONLY valid JSON with no markdown fences:
{
  "subject": "email subject line",
  "body": "full email body text with line breaks as \\n"
}`;

  const raw = await callAI('pipeline_followup_email', system, user);
  return safeParseJSON(raw, { subject: `Following up - Luxury Wedding Directory`, body: '' });
}

/**
 * Generate a proposal email.
 * Returns { subject, body }.
 */
export async function generateProposalEmail({ prospect, history = [], packageDetails = '' }) {
  const senderName = localStorage.getItem('emailFromName') || 'The Team at Luxury Wedding Directory';
  const system = BASE_SYSTEM;
  const user = `Write a proposal email for the venue or vendor below.

Prospect details:
${prospectContext(prospect)}

Previous contact history:
${historyContext(history)}

${packageDetails ? `Package / pricing details to include:\n${packageDetails}\n` : ''}
Sender: ${senderName}

The email should:
- Open by referencing previous conversations warmly
- Present the partnership opportunity clearly
- Highlight the specific value for THIS venue or vendor (use their details)
- Include a next step (call, reply, or sign-up link placeholder)
- Be confident but not aggressive
- 4-5 short paragraphs

Return ONLY valid JSON with no markdown fences:
{
  "subject": "email subject line",
  "body": "full email body text with line breaks as \\n"
}`;

  const raw = await callAI('pipeline_proposal_email', system, user);
  return safeParseJSON(raw, { subject: `Partnership proposal - ${prospect.company_name}`, body: '' });
}

/**
 * Generate a next-step recommendation for a salesperson.
 * Returns plain text advice, not an email.
 */
export async function generateNextStepAdvice({ prospect, stage, history = [] }) {
  const system = BASE_SYSTEM;
  const user = `You are advising a sales manager on the best next action for this prospect.

Prospect details:
${prospectContext(prospect)}

Current stage: ${stage?.name || prospect.pipeline_stage || 'Unknown'}
Lead score: ${prospect.lead_score || 'not yet calculated'}

Email history summary:
${historyContext(history)}

What is the single best next action to advance this deal?

Consider:
- If they have not replied after 2+ emails, should we change approach?
- If they replied, what is the natural progression?
- Is there a specific value angle we have not tried?
- Should we suggest a call, a visit, a case study, or a referral?

Respond in 2-4 sentences. Be specific and actionable. Plain text only, no lists or headers.`;

  return callAI('pipeline_next_step', system, user);
}

/**
 * Generate a personalised cold email from scratch.
 * Returns { subject, body }.
 */
export async function generateColdEmail({ prospect }) {
  const senderName = localStorage.getItem('emailFromName') || 'The Team at Luxury Wedding Directory';
  const system = BASE_SYSTEM;
  const user = `Write a cold outreach email to introduce Luxury Wedding Directory to a prospective partner.

Prospect details:
${prospectContext(prospect)}

Sender: ${senderName}

The email should:
- Open with a genuine observation about this specific venue or vendor (not generic flattery)
- Explain Luxury Wedding Directory in one sentence
- State the value proposition clearly: we connect venues with high-net-worth couples planning luxury weddings
- End with a low-friction ask: a brief call or just a reply
- Sound human and individual, not like a marketing email
- Under 200 words

Return ONLY valid JSON with no markdown fences:
{
  "subject": "email subject line (under 60 chars, no em dashes)",
  "body": "full email body text with line breaks as \\n"
}`;

  const raw = await callAI('pipeline_cold_email', system, user);
  return safeParseJSON(raw, { subject: `Partnership enquiry - Luxury Wedding Directory`, body: '' });
}

/**
 * Score and explain why a prospect is at their current lead score.
 * Returns a short explanation string.
 */
export async function explainLeadScore({ prospect, score, history = [] }) {
  const system = BASE_SYSTEM;
  const user = `Explain in 2 sentences why this prospect has a lead score of ${score}/100.
Be specific about which factors are driving the score up or down.
Use plain text, no lists.

Prospect:
${prospectContext(prospect)}

Email count: ${history.length}
Replied: ${history.some(h => h.status === 'replied') ? 'Yes' : 'No'}`;

  return callAI('pipeline_score_explain', system, user);
}
