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
  const termsStr = nlpTerms.slice(0, 12).join(', ');
  return `You are the editorial AI for Luxury Wedding Directory — a premium UK/Europe wedding publisher. Your writing is refined, authoritative, and deeply specific. You write like a senior editor at Condé Nast Traveller or Vogue Weddings.

VOICE & STYLE:
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
  ...
]

STRICT RULES:
- Return ONLY the JSON array. No intro text, no explanation.
- Every string value must be plain text (no HTML tags, no markdown).
- "image_hint" blocks must have a "caption" field describing what image should go there.
- "quote" blocks must have both "text" and "attribution" fields.
- "heading" blocks must have "level": 2.
- Never pad with filler paragraphs — every sentence earns its place.`;
}

// ── Build user prompt from the editor brief ────────────────────────────────────
function buildUserPrompt(brief, title, category, focusKeyword) {
  const parts = [`Write a luxury editorial magazine article for Luxury Wedding Directory.`];
  if (title) parts.push(`Article title: "${title}"`);
  if (category) parts.push(`Category: ${category}`);
  if (focusKeyword) parts.push(`Focus keyword: ${focusKeyword}`);
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
function parseBlocks(raw) {
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

// ── Main: generate full article body ─────────────────────────────────────────
export async function generateArticleBody({ brief, title, category, tone, focusKeyword }) {
  const categoryKey = (category || 'default').toLowerCase();
  const wordTarget  = (WORD_TARGETS[categoryKey]  || WORD_TARGETS['default']).target;
  const imageTarget = (IMAGE_TARGETS[categoryKey] || IMAGE_TARGETS['default']).target;
  const nlpTerms    = NLP_TERMS[categoryKey] || NLP_TERMS['default'] || [];

  const systemPrompt = buildSystemPrompt(category, wordTarget, imageTarget, nlpTerms, tone);
  const userPrompt   = buildUserPrompt(brief, title, category, focusKeyword);

  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: {
      feature:      'taigenic-writer',
      systemPrompt,
      userPrompt,
      maxTokens:    4000,
    },
  });

  if (error || !data?.text) {
    throw new Error(error?.message || 'AI generation failed — check AI Settings in Admin.');
  }

  const blocks = parseBlocks(data.text);
  if (!blocks || blocks.length === 0) {
    throw new Error('Could not parse AI output. Try again or adjust your brief.');
  }

  return {
    blocks,
    wordCount:    countBlockWords(blocks),
    nlpTermsUsed: detectUsedNlpTerms(blocks, categoryKey),
    provider:     data.provider || 'ai',
    model:        data.model    || '',
  };
}

// ── Generate outline only (headings) ─────────────────────────────────────────
export async function generateOutline({ brief, title, category }) {
  const prompt = buildOutlinePrompt(brief, title, category);

  const { supabase } = await import('../lib/supabaseClient');
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: {
      feature:   'taigenic-outline',
      userPrompt: prompt,
      maxTokens:  600,
    },
  });

  if (error || !data?.text) {
    throw new Error(error?.message || 'Outline generation failed.');
  }

  const blocks = parseBlocks(data.text);
  return blocks?.filter(b => b.type === 'heading') || [];
}
