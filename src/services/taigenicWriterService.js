// ═══════════════════════════════════════════════════════════════════════════════
// taigenicWriterService.js — Taigenic AI Article Writer
// Generates structured, luxury-editorial article content via the ai-generate
// edge function. Output is an array of typed blocks compatible with ArticleBody.
//
// Block schema produced:
//   { type: 'intro',      text: string }
//   { type: 'paragraph',  text: string }
//   { type: 'heading',    text: string, level: 2 }
//   { type: 'quote',      text: string, attribution: string }
//   { type: 'image_hint', caption: string }   ← placeholder, no src — editor fills in
//
// ═══════════════════════════════════════════════════════════════════════════════

import { NLP_TERMS } from '../pages/MagazineStudio/ContentIntelligence';
import { callAiGenerate } from '../lib/aiGenerate';
import { getVoiceInjection } from './studioVoiceService';

// Word count targets per category (mirrored from ContentIntelligence.jsx)
const WORD_TARGETS = {
  'destinations':  { min: 900,  target: 1200 },
  'venues':        { min: 700,  target: 1000 },
  'fashion':       { min: 600,  target: 900  },
  'real-weddings': { min: 500,  target: 800  },
  'planning':      { min: 800,  target: 1200 },
  'honeymoons':    { min: 700,  target: 1000 },
  'trends':        { min: 600,  target: 900  },
  'news':          { min: 300,  target: 500  },
  'default':       { min: 600,  target: 900  },
};

// Image count targets per category
const IMAGE_TARGETS = {
  'destinations':  { min: 4, target: 8  },
  'venues':        { min: 3, target: 6  },
  'fashion':       { min: 5, target: 10 },
  'real-weddings': { min: 6, target: 12 },
  'planning':      { min: 2, target: 4  },
  'honeymoons':    { min: 4, target: 8  },
  'trends':        { min: 3, target: 6  },
  'news':          { min: 1, target: 3  },
  'default':       { min: 3, target: 6  },
};

const LOADING_MESSAGES = [
  'Taigenic is writing your article…',
  'Crafting editorial voice…',
  'Weaving NLP signals…',
  'Refining structure and flow…',
  'Polishing the luxury editorial…',
  'Almost ready…',
];

export { LOADING_MESSAGES };

// ── Count words across all text-bearing blocks ─────────────────────────────────
export function countBlockWords(blocks = []) {
  return blocks.reduce((n, b) => {
    const txt = [b.text, b.caption, b.quote, b.body, b.attribution]
      .filter(Boolean)
      .join(' ')
      .replace(/<[^>]*>/g, ' ');
    return n + txt.split(/\s+/).filter(Boolean).length;
  }, 0);
}

// ── Build the system prompt with editorial voice + scoring targets ─────────────
function buildSystemPrompt(category, wordTarget, imageTarget, nlpTerms, tone) {
  const termsStr    = nlpTerms.slice(0, 12).join(', ');
  const voiceBlock  = getVoiceInjection(); // pulls from localStorage voice training
  return `You are the editorial AI for Luxury Wedding Directory — a premium UK/Europe wedding publisher. Your writing is refined, authoritative, and deeply specific. You write like a senior editor at Condé Nast Traveller or Vogue Weddings.

${voiceBlock ? `── TRAINED EDITORIAL VOICE ──\n${voiceBlock}\n────────────────────────────\n\n` : ''}VOICE & STYLE:
- Tone: ${tone || 'Luxury Editorial'}
- Use sensory detail and specific place/product names — never generic
- Sentences are varied: some short and declarative, some richly layered
- Do not use hollow superlatives (best, amazing, perfect) — show, don't tell
- Avoid generic travel or wedding language. Be specific, considered, distinctive

CONTENT REQUIREMENTS for category "${category}":
- Target word count: approximately ${wordTarget} words (aim for this range)
- Include approximately ${imageTarget} image placeholder blocks throughout
- Naturally weave in these NLP terms where relevant: ${termsStr}
- Structure: opening lead → 2–4 body sections with headings → one pull quote → closing paragraph
- Place image hints after vivid descriptive passages or at section breaks

OUTPUT FORMAT — return ONLY valid JSON array, no markdown, no commentary:
[
  { "type": "intro",      "text": "..." },
  { "type": "heading",    "text": "...", "level": 2 },
  { "type": "paragraph",  "text": "..." },
  { "type": "image_hint", "caption": "Descriptive caption hint for the editor" },
  { "type": "quote",      "text": "...", "attribution": "..." },
  { "type": "faq",        "question": "...", "answer": "..." },
  { "type": "meta",       "title": "SEO title under 60 chars", "description": "Meta description 140-155 chars" },
  ...
]

STRUCTURE REQUIREMENTS:
1. Start with one "intro" block (2-3 evocative sentences)
2. Then 3-5 sections, each starting with a "heading" block (level 2) followed by 1-3 "paragraph" blocks
3. Include at least one "quote" block with attribution
4. Include ${imageTarget} "image_hint" blocks placed after vivid passages
5. End with 2-3 "faq" blocks (question + answer pairs targeting "People Also Ask")
6. End with exactly one "meta" block containing seoTitle and metaDescription

STRICT RULES:
- Return ONLY the JSON array. No intro text, no explanation.
- Every string value must be plain text (no HTML tags, no markdown).
- "image_hint" blocks must have a "caption" field describing what image should go there.
- "quote" blocks must have both "text" and "attribution" fields.
- "heading" blocks must have "level": 2.
- "faq" blocks must have both "question" and "answer" fields.
- "meta" block must have "title" (under 60 chars) and "description" (140-155 chars).
- Never pad with filler paragraphs — every sentence earns its place.`;
}

// ── Build user prompt from the editor brief ────────────────────────────────────
function buildUserPrompt(brief, title, category, focusKeyword) {
  const parts = [`Write a luxury editorial magazine article for Luxury Wedding Directory.`];
  if (title) parts.push(`Article title: "${title}"`);
  if (category) parts.push(`Category: ${category}`);
  if (focusKeyword) parts.push(`Primary focus keyword: "${focusKeyword}" — weave naturally into the content without forcing it.`);
  if (brief) parts.push(`Editorial brief:\n${brief}`);
  parts.push(`\nGenerate the full article now as a JSON block array per the system prompt.`);
  return parts.join('\n');
}

// ── Build outline-only prompt ─────────────────────────────────────────────────
function buildOutlinePrompt(brief, title, category) {
  return `Generate a structured article outline for a luxury wedding editorial article.

Title: "${title || 'Untitled'}"
Category: ${category || 'general'}
Brief: ${brief || 'No brief provided'}

Return ONLY a JSON array of heading blocks:
[
  { "type": "heading", "text": "Section title", "level": 2 },
  ...
]

4–6 headings. No other block types. Plain JSON only.`;
}

// ── Parse AI text response into block array ────────────────────────────────────
export function parseBlocks(raw) {
  if (!raw) return null;
  // Strip markdown code fences if present
  const cleaned = raw.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
  try {
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return null;

    // Validate and sanitise each block
    return parsed
      .filter(b => b && typeof b === 'object' && typeof b.type === 'string')
      .map((b, idx) => ({
        id: crypto.randomUUID ? crypto.randomUUID() : `taigenic-${Date.now()}-${idx}`,
        type: b.type,
        text:    (b.text        || '').replace(/<[^>]*>/g, '').trim(),
        caption: (b.caption     || '').replace(/<[^>]*>/g, '').trim(),
        attribution: (b.attribution || '').replace(/<[^>]*>/g, '').trim(),
        level:   b.level || (b.type === 'heading' ? 2 : undefined),
        // image_hint blocks: no src, wide flag for editorial placement
        ...(b.type === 'image_hint' ? { src: '', alt: '', wide: true } : {}),
        // FAQ blocks: question + answer
        ...(b.type === 'faq' ? { question: (b.question || '').trim(), answer: (b.answer || '').trim() } : {}),
        // Meta blocks: SEO title + description (extracted by caller, not rendered as content)
        ...(b.type === 'meta' ? { seoTitle: (b.title || '').trim(), metaDescription: (b.description || '').trim() } : {}),
      }))
      // Convert image_hint to the editor's 'image' type
      .map(b => b.type === 'image_hint' ? { ...b, type: 'image' } : b);
  } catch (_) {
    return null;
  }
}

// ── Detect which NLP terms were used in the generated blocks ──────────────────
export function detectUsedNlpTerms(blocks = [], category = '') {
  const terms = NLP_TERMS[category] || NLP_TERMS['default'] || [];
  const allText = blocks
    .map(b => [b.text, b.caption, b.attribution].filter(Boolean).join(' '))
    .join(' ')
    .toLowerCase();
  return terms.filter(t => allText.includes(t.toLowerCase()));
}

// ── Log generation to ai_generation_logs (fire-and-forget) ──────────────────
async function logGeneration(entry) {
  try {
    const { supabase } = await import('../lib/supabaseClient');
    await supabase.from('ai_generation_logs').insert(entry);
  } catch (_) {
    // Non-critical — never block the UI
  }
}

// ── Update log outcome after user action ────────────────────────────────────
export async function updateGenerationOutcome(logId, outcome) {
  if (!logId) return;
  try {
    const { supabase } = await import('../lib/supabaseClient');
    await supabase.from('ai_generation_logs').update({
      outcome: outcome.outcome,
      blocks_accepted: outcome.blocksAccepted ?? null,
      blocks_rejected: outcome.blocksRejected ?? null,
      outcome_at: new Date().toISOString(),
    }).eq('id', logId);
  } catch (_) {
    // Non-critical
  }
}

// ── Refine content with targeted modifications (Phase 2) ─────────────────────
// Actions:
//   'shorten': reduce by X% while preserving meaning
//   'expand': add X% more content with deeper insights
//   'rewrite-intro': rewrite only intro (first 1-2 paragraphs)
//   'add-keywords': find sections where focusKeyword fits, suggest targeted additions
//   'fix-title': regenerate title with length constraint
export async function refineContent({
  blocks = [],
  action,
  tone,
  focusKeyword,
  constraint = 15,
  context = {},
}) {
  if (!action) throw new Error('Refinement action required');

  const content = blocks
    .map(b => b.text || b.caption || '')
    .filter(Boolean)
    .join('\n\n');

  const wordCount = content.split(/\s+/).filter(Boolean).length;

  const prompts = {
    'shorten': `You are a luxury editorial editor. Reduce this article by ${constraint}% while preserving all meaning, nuance, and luxury tone. Remove padding and redundancy, but keep every important idea.

Current article (${wordCount} words):
${content}

Return ONLY the shortened article text. No markdown, no explanation.`,

    'expand': `You are a luxury editorial editor. Expand this article by ${constraint}% with deeper insights, specific examples, and more sensory detail. Maintain the ${tone || 'Luxury Editorial'} tone throughout.

Current article (${wordCount} words):
${content}

Return ONLY the expanded article text. No markdown, no explanation.`,

    'rewrite-intro': `You are a luxury editorial editor. Rewrite ONLY the introduction (opening 1-2 paragraphs) in a ${tone || 'Luxury Editorial'} tone. Create a compelling hook that draws readers in.${focusKeyword ? ` Naturally introduce "${focusKeyword}" in the opening.` : ''}

Current introduction:
${blocks
  .filter(b => b.type === 'intro' || b.type === 'paragraph')
  .slice(0, 2)
  .map(b => b.text)
  .join('\n\n')}

Return ONLY the rewritten introduction (1-2 paragraphs). No markdown, no explanation.`,

    'add-keywords': `You are a luxury editorial editor. Find 2-3 sections in this article where "${focusKeyword}" naturally fits and would strengthen the content. For each section, suggest 1-2 sentence additions that complement the existing text WITHOUT replacing it.

Article:
${content}

Return ONLY a JSON array with no markdown:
[
  { "sectionIndex": 0, "suggestion": "One or two sentences to add after paragraph X..." },
  { "sectionIndex": 2, "suggestion": "One or two sentences to add after paragraph Y..." }
]`,

    'fix-title': `You are a luxury editorial editor. Generate an SEO-optimised title (50-60 characters) for this article.${focusKeyword ? ` Include or strongly relate to "${focusKeyword}".` : ''} Write in a ${tone || 'Luxury Editorial'} tone.

Article snippet:
${content.slice(0, 300)}

Return ONLY the title text. No markdown, no explanation.`,
  };

  const prompt = prompts[action];
  if (!prompt) throw new Error(`Unknown refinement action: ${action}`);

  let data;
  try {
    data = await callAiGenerate({
      feature: `refine_${action}`,
      systemPrompt: `You are a luxury magazine editor with expertise in wedding editorial content. ${tone ? `Write in a ${tone} tone.` : ''} Focus on quality, engagement, and natural language. Never regenerate text unless specifically asked to.`,
      userPrompt: prompt,
      maxTokens: action === 'add-keywords' ? 600 : 2000,
    });
  } catch (err) {
    throw new Error(err?.message || `Refinement failed: ${action}`);
  }

  if (!data?.text) {
    throw new Error(`Refinement failed for action: ${action}`);
  }

  // Fire-and-forget log
  logGeneration({
    feature: `refine_${action}`,
    topic: context.title || '',
    word_count: wordCount,
    provider: data.provider || 'ai',
    model: data.model || '',
    tokens_in: data.usage?.prompt_tokens ?? null,
    tokens_out: data.usage?.completion_tokens ?? null,
    focus_keyword: focusKeyword,
  });

  return {
    text: data.text.trim(),
    action,
    fullArticleRegen: ['shorten', 'expand'].includes(action),
  };
}

// ── Hotel URL lookup: fetch hotel identity + brand palette from URL ────────────
// For well-known properties the AI returns accurate brand colors from its training
// data. For independent hotels it infers a luxury-appropriate palette from context.
// Returns a plain object — caller decides what to pre-fill.
export async function fetchHotelFromUrl({ url = '', hotelName = '' } = {}) {
  if (!url && !hotelName) throw new Error('Provide a URL or hotel name');

  const data = await callAiGenerate({
    feature: 'hotel-url-lookup',
    systemPrompt: `You are a luxury hospitality brand analyst. Given a hotel website URL and/or hotel name, return everything known about the property's identity and visual brand.

Return ONLY valid JSON — no markdown fences, no explanation:
{
  "hotel_name": "Official full hotel name",
  "location": "City, Country",
  "star_rating": 5,
  "price_range": "££££",
  "description": "2-sentence editorial description of the property",
  "restaurant_name": "Name of the main restaurant (or null)",
  "cuisine_style": "e.g. 'BRITISH · SEASONAL ✦' (for dining page tag)",
  "room_types": "e.g. 'Classic Room · Deluxe Suite · Penthouse'",
  "best_for": "e.g. 'Honeymoons, Anniversary Stays, City Escapes'",
  "key_facts": "e.g. '198 Rooms · Rooftop Bar · Spa · 2 Restaurants'",
  "brand_colors": {
    "primary": "#hex — dominant brand/accent color (from logo, CTAs, hero elements)",
    "accent":  "#hex — secondary accent (often a contrasting or complementary tone)",
    "bg":      "#hex — typical page/background color",
    "text":    "#hex — primary body text color"
  }
}

For major hotel brands (Four Seasons, Dorchester, Ritz, Claridge's, Aman, Rosewood, etc.) use their known brand colors exactly.
For independent hotels, infer a premium palette appropriate for the property's style and location.
star_rating must be 1–5. price_range must be one of: £, ££, £££, ££££.`,
    userPrompt: `Hotel URL: ${url || 'not provided'}\nHotel name: ${hotelName || 'not provided'}\n\nReturn the hotel brand profile as JSON.`,
    maxTokens: 700,
  });

  if (!data?.text) throw new Error('Could not fetch hotel info — check AI Settings.');

  let raw = data.text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '');

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Hotel lookup returned invalid data. Try again.');
  }
}

// ── Hotel Review: generate structured page plan for a hotel review ────────────
// Returns a page structure array compatible with handleAIBuildIssue.
// Each item: { template_id, page_label, kicker, headline, body, byline }
export async function generateHotelReview({
  hotelName,
  location = '',
  starRating = 5,
  priceRange = '££££',
  reviewType = 'editorial',
  reviewText = '',
  headline = '',
  standfirst = '',
  verdict = '',
  sections = { arrival: true, rooms: true, dining: true, spa: false, bar: false, wedding: true },
  bestFor = [],
  keyFacts = {},
  tone = 'Luxury Editorial',
  brandColors = null, // { primary, accent, bg, text } — from fetchHotelFromUrl
} = {}) {
  if (!hotelName) throw new Error('Hotel name is required');

  // Build which sections to generate (always include cover + verdict)
  const activeSections = [
    'arrival',
    ...(sections.rooms    ? ['rooms']   : []),
    ...(sections.dining   ? ['dining']  : []),
    ...(sections.spa      ? ['spa']     : []),
    ...(sections.bar      ? ['bar']     : []),
    ...(sections.pool     ? ['pool']    : []),
    ...(sections.wedding  ? ['wedding'] : []),
    ...(sections.location ? ['location']: []),
  ];

  const bestForStr = Array.isArray(bestFor) ? bestFor.join(', ') : bestFor;
  const keyFactsStr = Object.entries(keyFacts)
    .filter(([, v]) => v)
    .map(([k, v]) => `${k}: ${v}`)
    .join(', ');

  const systemPrompt = `You are the editorial AI for Luxury Wedding Directory — building a premium hotel review for The LWD Hotel Review format.

You must return ONLY a valid JSON array. No markdown, no explanation, just the raw JSON array.

Each item represents one page in the review:
{
  "template_id": "one of: hotel-review-cover, hotel-review-arrival, hotel-review-rooms, hotel-review-dining, hotel-review-verdict",
  "page_label": "short descriptive label",
  "kicker": "SHORT KICKER — e.g. 'THE LWD HOTEL REVIEW' or 'FIRST IMPRESSIONS' or 'THE ROOMS'",
  "headline": "hotel name for cover, room type for rooms, restaurant name for dining, etc.",
  "body": "2-3 sentences of luxury editorial copy in ${tone} voice — sensory, specific, authoritative",
  "byline": "Optional: 'Reviewed by Charlotte Ashford, Editor-in-Chief'",
  "best_for": "comma-separated list for verdict page only — e.g. 'Honeymoons, Anniversaries, City Breaks'",
  "cuisine": "cuisine style tag for dining page — e.g. 'BRITISH · SEASONAL ✦' or 'JAPANESE · OMAKASE ✦'",
  "layout": {
    "composition": "for cover only: 'centered' (default) | 'editorial-left' | 'bold-bottom'",
    "mood": "for rooms only: 'dark' (default) | 'light'",
    "image_split": "for arrival/rooms: 'narrow-image' (default 44%) | 'wide-image' (56%)",
    "image_style": "for dining: 'full-width-top' (default) | 'split-right'",
    "headline_size": "font size integer — compute from headline text length: ≤12 chars=62, ≤18=50, ≤24=40, ≤32=32, longer=26",
    "ratings": { "rooms": 1-10, "dining": 1-10, "service": 1-10, "value": 1-10 },
    "star_rating": 1-5
  }
}

Layout rules:
- Choose composition based on the hotel's character. Understated English hotels → 'editorial-left'. Grand palaces → 'centered'. Brutalist/design hotels → 'bold-bottom'.
- Mood 'light' for rooms pages when the hotel has airy, Scandinavian or coastal aesthetic. 'dark' for dramatic, historic, or city properties.
- image_split 'wide-image' when the property is visually spectacular. 'narrow-image' when the editorial copy is the star.
- Dining 'split-right' for intimate restaurants. 'full-width-top' for grand dining rooms or terrace settings.
- headline_size MUST be computed from the headline text length. Never let a long name clip.
- ratings must reflect the actual review sentiment. Do not default to 8/8/9/7 for everything.

ALWAYS produce pages in this exact order:
1. hotel-review-cover  (page 1 — always)
2. hotel-review-arrival (page 2 — always)
3. hotel-review-rooms  (if rooms section active)
4. hotel-review-dining (if dining section active)
5. hotel-review-verdict (last page — always)

Write like a senior editor at Condé Nast Traveller. Use sensory detail, specific place names, architectural language. Never generic.`;

  const userPrompt = `Write a luxury hotel review for The LWD Hotel Review.

Hotel: ${hotelName}
Location: ${location || 'Not specified'}
Star Rating: ${starRating} stars
Price Range: ${priceRange}
Review Type: ${reviewType}
${headline ? `Suggested headline: ${headline}` : ''}
${standfirst ? `Standfirst: ${standfirst}` : ''}
${verdict ? `Verdict notes: ${verdict}` : ''}
${bestForStr ? `Best for: ${bestForStr}` : ''}
${keyFactsStr ? `Key facts: ${keyFactsStr}` : ''}
${reviewText ? `Editor's notes / paste-in content:\n${reviewText.slice(0, 1200)}` : ''}

Active sections: ${['cover', ...activeSections, 'verdict'].join(', ')}

Produce pages in this order: hotel-review-cover, hotel-review-arrival${sections.rooms ? ', hotel-review-rooms' : ''}${sections.dining ? ', hotel-review-dining' : ''}, hotel-review-verdict.

Return exactly ${2 + activeSections.filter(s => ['rooms','dining'].includes(s)).length + 1} pages.`;

  let data;
  try {
    data = await callAiGenerate({
      feature: 'hotel-review-builder',
      systemPrompt,
      userPrompt,
      maxTokens: 2000,
    });
  } catch (err) {
    throw new Error(err?.message || 'Hotel review generation failed — check AI Settings in Admin.');
  }

  if (!data?.text) throw new Error('Hotel review generation failed — no response from AI.');

  // Parse JSON — strip markdown fences if present
  let raw = data.text.trim();
  raw = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Hotel review generation failed — AI returned invalid JSON. Try again.');
  }

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Hotel review generation failed — empty structure returned.');
  }

  // Validate template IDs — only allow hotel-review-* templates
  const VALID_HR_IDS = [
    'hotel-review-cover', 'hotel-review-arrival', 'hotel-review-rooms',
    'hotel-review-dining', 'hotel-review-verdict',
  ];
  const validated = parsed.map((p, i) => ({
    ...p,
    template_id: VALID_HR_IDS.includes(p.template_id)
      ? p.template_id
      : i === 0 ? 'hotel-review-cover'
        : i === parsed.length - 1 ? 'hotel-review-verdict'
          : 'hotel-review-arrival',
    // Always stamp hotel identity so role-based injection can target named slots.
    // The AI generates prose (kicker/headline/body) but never carries hotel_name
    // or location forward — we inject them here so every page gets them.
    hotel_name: hotelName,
    location:   location || '',
    // Merge AI layout with star_rating from the form so the cover always shows
    // the correct star count even if the AI omits it.
    layout: {
      star_rating: starRating,
      ...(p.layout || {}),
      // Brand colors flow from fetchHotelFromUrl → panel state → here.
      // Layout renderers use them to replace accent colors with hotel identity.
      // null means "use LWD defaults" — safe to omit.
      brand: brandColors || null,
    },
  }));

  // Fire-and-forget log
  logGeneration({
    feature: 'hotel-review-builder',
    topic: hotelName,
    word_count: parsed.length,
    provider: data.provider || 'ai',
    model: data.model || '',
    tokens_in: data.usage?.prompt_tokens ?? null,
    tokens_out: data.usage?.completion_tokens ?? null,
  }).catch(() => {});

  return validated;
}

// ── Main: generate full article body ─────────────────────────────────────────
export async function generateArticleBody({ brief, title, category, tone, focusKeyword }) {
  const categoryKey = (category || 'default').toLowerCase();
  const wordTarget  = (WORD_TARGETS[categoryKey]  || WORD_TARGETS['default']).target;
  const imageTarget = (IMAGE_TARGETS[categoryKey] || IMAGE_TARGETS['default']).target;
  const nlpTerms    = NLP_TERMS[categoryKey] || NLP_TERMS['default'] || [];

  const systemPrompt = buildSystemPrompt(category, wordTarget, imageTarget, nlpTerms, tone);
  const userPrompt   = buildUserPrompt(brief, title, category, focusKeyword);

  const t0 = Date.now();
  let data;
  try {
    data = await callAiGenerate({
      feature:      'taigenic-writer',
      systemPrompt,
      userPrompt,
      maxTokens:    4000,
    });
  } catch (err) {
    throw new Error(err?.message || 'AI generation failed — check AI Settings in Admin.');
  }
  const latencyMs = Date.now() - t0;

  if (!data?.text) {
    throw new Error('AI generation failed — check AI Settings in Admin.');
  }

  const blocks = parseBlocks(data.text);
  if (!blocks || blocks.length === 0) {
    throw new Error('Could not parse AI output. Try again or adjust your brief.');
  }

  // Extract meta block (SEO title + description) — separate from content blocks
  const metaBlock = blocks.find(b => b.type === 'meta');
  const contentBlocks = blocks.filter(b => b.type !== 'meta');

  const wordCount    = countBlockWords(contentBlocks);
  const nlpTermsUsed = detectUsedNlpTerms(contentBlocks, categoryKey);
  const faqs         = contentBlocks.filter(b => b.type === 'faq');

  // Fire-and-forget: log this generation
  const logId = crypto.randomUUID ? crypto.randomUUID() : `log-${Date.now()}`;
  logGeneration({
    id:               logId,
    feature:          'taigenic-writer',
    topic:            brief,
    title,
    category:         categoryKey,
    tone,
    focus_keyword:    focusKeyword,
    word_target:      wordTarget,
    word_count:       wordCount,
    block_count:      contentBlocks.length,
    nlp_terms_used:   nlpTermsUsed,
    nlp_coverage:     nlpTerms.length > 0 ? nlpTermsUsed.length / nlpTerms.length : 0,
    provider:         data.provider || 'ai',
    model:            data.model || '',
    tokens_in:        data.usage?.prompt_tokens ?? null,
    tokens_out:       data.usage?.completion_tokens ?? null,
    latency_ms:       latencyMs,
    seo_title_generated:   metaBlock?.seoTitle || null,
    meta_desc_generated:   metaBlock?.metaDescription || null,
    faq_count:             faqs.length,
  });

  return {
    blocks: contentBlocks,
    wordCount,
    nlpTermsUsed,
    provider:     data.provider || 'ai',
    model:        data.model    || '',
    logId,
    // Structured extras
    seoTitle:        metaBlock?.seoTitle || '',
    metaDescription: metaBlock?.metaDescription || '',
    faqs,
  };
}

// ── Generate content brief ──────────────────────────────────────────────────
// Returns: { keywords, headings, wordTarget, toneRecommendation, nlpTerms, summary }
export async function generateContentBrief({ topic, category }) {
  const categoryKey = (category || 'default').toLowerCase();
  const wt = WORD_TARGETS[categoryKey] || WORD_TARGETS['default'];
  const nlpTerms = NLP_TERMS[categoryKey] || NLP_TERMS['default'] || [];

  const prompt = `You are an SEO content strategist for a luxury wedding directory. Generate a content brief for:

Topic: "${topic}"
Category: ${category || 'general'}

Return ONLY valid JSON (no markdown, no commentary):
{
  "keywords": ["primary keyword", "secondary keyword 1", "secondary keyword 2", "long-tail keyword 1", "long-tail keyword 2"],
  "headings": [
    { "level": 2, "text": "H2 heading suggestion" },
    { "level": 2, "text": "H2 heading suggestion" },
    { "level": 2, "text": "H2 heading suggestion" },
    { "level": 2, "text": "H2 heading suggestion" },
    { "level": 3, "text": "H3 sub-heading suggestion" },
    { "level": 3, "text": "H3 sub-heading suggestion" }
  ],
  "wordTarget": ${wt.target},
  "toneRecommendation": "One of: Luxury Editorial, Vogue Style, Travel Luxe, Wedding Romance, Elegant Sales, Soft Informative, SEO Optimised Luxury",
  "faqs": [
    { "question": "FAQ question 1", "answer": "Brief suggested answer" },
    { "question": "FAQ question 2", "answer": "Brief suggested answer" },
    { "question": "FAQ question 3", "answer": "Brief suggested answer" }
  ],
  "summary": "One sentence summary of what this article should cover and its angle."
}

RULES:
- Keywords must be specific to luxury weddings, not generic
- Headings should follow a logical editorial flow
- FAQs should target "People Also Ask" style queries
- Tone recommendation should match the topic and category
- Return ONLY the JSON object`;

  const t0 = Date.now();
  let data;
  try {
    data = await callAiGenerate({
      feature: 'taigenic-brief',
      systemPrompt: 'You are an expert SEO content strategist specialising in luxury wedding editorial. You return only valid JSON matching the schema requested — no markdown, no commentary, no code fences.',
      userPrompt: prompt,
      maxTokens: 1200,
    });
  } catch (err) {
    throw new Error(err?.message || 'Brief generation failed.');
  }
  const latencyMs = Date.now() - t0;

  if (!data?.text) {
    throw new Error('Brief generation failed.');
  }

  try {
    const cleaned = data.text.replace(/^```(?:json)?\n?/i, '').replace(/\n?```$/i, '').trim();
    const brief = JSON.parse(cleaned);

    // Fire-and-forget log
    logGeneration({
      feature:       'taigenic-brief',
      topic,
      category:      categoryKey,
      word_target:   brief.wordTarget || wt.target,
      provider:      data.provider || 'ai',
      model:         data.model || '',
      tokens_in:     data.usage?.prompt_tokens ?? null,
      tokens_out:    data.usage?.completion_tokens ?? null,
      latency_ms:    latencyMs,
      faq_count:     (brief.faqs || []).length,
      metadata:      { keywords: brief.keywords, tone: brief.toneRecommendation },
    });

    return {
      keywords:           brief.keywords || [],
      headings:           brief.headings || [],
      wordTarget:         brief.wordTarget || wt.target,
      toneRecommendation: brief.toneRecommendation || 'Luxury Editorial',
      faqs:               brief.faqs || [],
      nlpTerms:           nlpTerms.slice(0, 10),
      summary:            brief.summary || '',
    };
  } catch (_) {
    throw new Error('Could not parse brief. Try again.');
  }
}

// ── Generate outline only (headings) ─────────────────────────────────────────
export async function generateOutline({ brief, title, category }) {
  const prompt = buildOutlinePrompt(brief, title, category);

  let data;
  try {
    data = await callAiGenerate({
      feature:   'taigenic-outline',
      systemPrompt: 'You are a luxury magazine editor. Return only a clean list of H2/H3 headings for the requested article, one per line, no numbering, no commentary.',
      userPrompt: prompt,
      maxTokens:  600,
    });
  } catch (err) {
    throw new Error(err?.message || 'Outline generation failed.');
  }

  if (!data?.text) {
    throw new Error('Outline generation failed.');
  }

  const blocks = parseBlocks(data.text);
  return blocks?.filter(b => b.type === 'heading') || [];
}
