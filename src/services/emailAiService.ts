/**
 * emailAiService.ts
 * AI layer for the newsletter builder.
 * All calls route through the existing ai-generate Edge Function which
 * reads the active provider/key from ai_settings - no secrets in the client.
 */

import { supabase } from '../lib/supabaseClient';

// ── Shared types ──────────────────────────────────────────────────────────────

export interface Block {
  id: string;
  type: string;
  props: Record<string, unknown>;
}

export interface SubjectResult {
  subjects: string[];
  previews: string[];
}

export interface SpotlightResult {
  summary: string;
  cta: string;
}

export interface NewsletterDraft {
  intro: string;
  closing: string;
}

export interface AiTemplateResult {
  blockTypes: string[];
  heading: string;
  intro: string;
}

export type RewriteAction = 'rewrite' | 'shorten' | 'expand' | 'luxury' | 'editorial' | 'concise';

// ── Tone descriptions ─────────────────────────────────────────────────────────

const TONE_DESCRIPTIONS: Record<string, string> = {
  luxury:   'Luxury editorial: refined, elegant, exclusive. Think Vogue Weddings. Aspirational and evocative.',
  romantic: 'Warm and romantic: heartfelt, celebratory, intimate and personal.',
  travel:   'High-end travel editorial: sophisticated, evocative of place and atmosphere. Think Conde Nast Traveler.',
  concise:  'Elegant and concise: minimal, precise, every word earns its place. Clean and authoritative.',
  launch:   'Launch announcement: confident, exciting, newsworthy, driving urgency and excitement.',
};

const BASE_SYSTEM = `You are an AI editorial assistant for Luxury Wedding Directory, an elite wedding planning and venue discovery platform based in the UK.
Write for a sophisticated audience planning luxury weddings.
Rules:
- Luxury editorial voice always
- Email-appropriate length (short paragraphs, clear CTAs)
- Never fabricate specific facts about venues, prices or people
- Never use em dashes (use commas or periods instead)
- No spam language
- Base content strictly on provided source data when available`;

// ── Core AI caller ────────────────────────────────────────────────────────────

async function callAI(feature: string, systemPrompt: string, userPrompt: string): Promise<string> {
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
  return data.text as string;
}

function safeParseJSON<T>(text: string, fallback: T): T {
  // Strip markdown code fences if present
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();
  try { return JSON.parse(cleaned) as T; } catch { return fallback; }
}

function toneInstructions(tone: string): string {
  return TONE_DESCRIPTIONS[tone] || TONE_DESCRIPTIONS.luxury;
}

// ── Exported service functions ────────────────────────────────────────────────

/**
 * Generate 4-5 subject line options and 3-4 preview text options.
 */
export async function generateSubjectLines(params: {
  newsletterType: string;
  tone: string;
  blocks: Block[];
  destination?: string;
}): Promise<SubjectResult> {
  const { newsletterType, tone, blocks, destination } = params;

  const contentItems: string[] = [];
  blocks.forEach(b => {
    if (b.type === 'article')     contentItems.push(`Article: "${b.props.headline || ''}"`);
    if (b.type === 'venue_spot')  contentItems.push(`Venue: "${b.props.venueName || ''}"`);
    if (b.type === 'vendor_spot') contentItems.push(`Vendor: "${b.props.vendorName || ''}"`);
    if (b.type === 'destination') contentItems.push(`Destination: ${b.props.destination || ''}`);
    if (b.type === 'latest_art')  contentItems.push('Latest magazine articles section');
  });

  const system = `${BASE_SYSTEM}\nTone: ${toneInstructions(tone)}`;
  const user = `Generate subject lines and preview text for a ${newsletterType} email.
${contentItems.length ? `Content in this newsletter:\n${contentItems.join('\n')}` : ''}
${destination ? `Key destination: ${destination}` : ''}

Return ONLY valid JSON with no markdown fences:
{
  "subjects": ["subject 1", "subject 2", "subject 3", "subject 4", "subject 5"],
  "previews": ["preview 1", "preview 2", "preview 3"]
}

Rules:
- Subject lines: under 60 characters, intriguing, no spam words, no em dashes
- Preview text: under 90 characters, complements the subject
- Luxury wedding editorial tone`;

  const raw = await callAI('newsletter_subject_lines', system, user);
  return safeParseJSON<SubjectResult>(raw, { subjects: [], previews: [] });
}

/**
 * Rewrite/shorten/expand/refine a block's text.
 */
export async function rewriteBlockCopy(params: {
  text: string;
  action: RewriteAction;
  tone: string;
  context?: string;
}): Promise<string> {
  const { text, action, tone, context } = params;

  const instructions: Record<RewriteAction, string> = {
    rewrite:   'Rewrite this in a fresh, engaging way while keeping the same meaning',
    shorten:   'Shorten to approximately half the length while keeping all key information',
    expand:    'Expand with more evocative detail and context, adding about 50% more content',
    luxury:    'Rewrite in a more luxurious, premium, aspirational tone - elevated and exclusive',
    editorial: 'Rewrite in a more editorial, journalistic style - vivid, engaging, with narrative quality',
    concise:   'Rewrite more concisely, removing filler and making every word count',
  };

  const system = `${BASE_SYSTEM}\nTone: ${toneInstructions(tone)}`;
  const user = `${instructions[action] || instructions.rewrite}.

${context ? `Source context (do not fabricate beyond this): ${context}\n` : ''}Original text:
"${text}"

Return ONLY the rewritten text. No quotes, no explanation, no extra commentary.`;

  return callAI('newsletter_rewrite', system, user);
}

/**
 * Auto-generate summary + CTA for an article, venue or vendor spotlight block.
 */
export async function generateSpotlightSummary(params: {
  type: 'article' | 'venue' | 'vendor';
  name: string;
  description?: string;
  location?: string;
  category?: string;
  tone: string;
}): Promise<SpotlightResult> {
  const { type, name, description, location, category, tone } = params;

  const labels = { article: 'magazine article', venue: 'wedding venue', vendor: 'wedding vendor' };
  const system = `${BASE_SYSTEM}\nTone: ${toneInstructions(tone)}`;
  const user = `Write a short luxury editorial summary for this ${labels[type]}:

Name: ${name}
${location    ? `Location: ${location}\n`    : ''}
${description ? `Description: ${description}\n` : ''}
${category    ? `Category: ${category}\n`    : ''}

Return ONLY valid JSON with no markdown fences:
{
  "summary": "1-2 sentence luxury editorial description",
  "cta": "3-5 word CTA button text"
}

Rules: based only on provided information, no fabricated facts, no em dashes, luxury tone.`;

  const raw = await callAI('newsletter_spotlight_summary', system, user);
  return safeParseJSON<SpotlightResult>(raw, { summary: '', cta: 'Learn More' });
}

/**
 * Generate an intro paragraph and closing CTA for a full newsletter draft.
 */
export async function generateNewsletterDraft(params: {
  blocks: Block[];
  topic?: string;
  tone: string;
}): Promise<NewsletterDraft> {
  const { blocks, topic, tone } = params;

  const sections: string[] = [];
  blocks.forEach((b, i) => {
    if (b.type === 'hero')        sections.push(`${i+1}. Hero banner: "${b.props.headline || ''}"`);
    if (b.type === 'article')     sections.push(`${i+1}. Magazine article: "${b.props.headline || ''}"`);
    if (b.type === 'venue_spot')  sections.push(`${i+1}. Venue spotlight: "${b.props.venueName || ''}"`);
    if (b.type === 'vendor_spot') sections.push(`${i+1}. Vendor spotlight: "${b.props.vendorName || ''}"`);
    if (b.type === 'destination') sections.push(`${i+1}. Destination discovery: ${b.props.destination || ''}`);
    if (b.type === 'latest_art')  sections.push(`${i+1}. Latest magazine articles section`);
  });

  const system = `${BASE_SYSTEM}\nTone: ${toneInstructions(tone)}`;
  const user = `Write opening and closing copy for a luxury wedding newsletter.

${topic ? `Newsletter theme: ${topic}` : ''}
Newsletter sections:
${sections.length ? sections.join('\n') : '(General newsletter)'}

Return ONLY valid JSON with no markdown fences:
{
  "intro": "2-3 sentence opening paragraph that sets the theme and draws the reader in",
  "closing": "2 sentence closing paragraph with a warm CTA to explore or browse"
}

Rules: no fabricated facts, no em dashes, luxury editorial tone, short email-friendly paragraphs.`;

  const raw = await callAI('newsletter_draft', system, user);
  return safeParseJSON<NewsletterDraft>(raw, { intro: '', closing: '' });
}

/**
 * Generate a block layout plan for an AI-powered email template.
 */
export async function generateAiTemplate(params: {
  topic: string;
  audience: string;
  destination?: string;
  sections: number;
  tone: string;
}): Promise<AiTemplateResult> {
  const { topic, audience, destination, sections, tone } = params;

  const system = `${BASE_SYSTEM}\nTone: ${toneInstructions(tone)}`;
  const user = `Plan a luxury wedding newsletter layout.

Topic/goal: ${topic}
Audience: ${audience}
${destination ? `Destination: ${destination}` : ''}
Number of main content sections: ${sections}

Choose from these block types: header, hero, heading, text, image, button, columns, divider, spacer, social, footer, article, venue_spot, latest_art, destination

Return ONLY valid JSON with no markdown fences:
{
  "blockTypes": ["header", "hero", "heading", "text", ...],
  "heading": "A suggested section heading",
  "intro": "1-2 sentence newsletter intro copy"
}

Rules: always start with header, end with footer, include relevant platform blocks (article/venue_spot/destination) based on topic.`;

  const raw = await callAI('newsletter_template', system, user);
  return safeParseJSON<AiTemplateResult>(raw, { blockTypes: ['header','hero','heading','text','button','footer'], heading: topic, intro: '' });
}
