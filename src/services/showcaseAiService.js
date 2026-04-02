// ─── src/services/showcaseAiService.js ───────────────────────────────────────
// Magic AI for Showcase Studio.
// Calls the existing ai-generate edge function with a structured prompt.
// Returns a fully populated sections array ready to load into the Studio.
// ─────────────────────────────────────────────────────────────────────────────

const AI_GENERATE_URL = 'https://qpkggfibwreznussudfh.supabase.co/functions/v1/ai-generate';
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a luxury venue showcase generator for Luxury Wedding Directory.
Your role is to take raw venue information and produce a complete, fully-populated showcase in structured JSON.

OUTPUT RULES:
- Return ONLY a valid JSON object. Start your response with { and end with }. Nothing before, nothing after.
- No markdown code fences, no explanation, no preamble, no trailing text. Raw JSON only.
- Every string field must have real, editorial-quality content. No placeholders.
- Write in the luxury editorial voice: evocative, precise, authoritative. Never generic.
- Use British English spelling throughout.

OUTPUT FORMAT:
{
  "meta": {
    "title": "Venue name",
    "slug": "url-slug-kebab-case",
    "location": "Full address · City · Country",
    "excerpt": "One or two sentence editorial description for cards and SEO."
  },
  "sections": [
    { "id": "unique-id", "type": "section-type", "content": {...}, "layout": {...} }
  ]
}

AVAILABLE SECTION TYPES AND THEIR EXACT SCHEMAS:

hero: { "title": "", "tagline": "", "eyebrow": "", "image": "", "overlay_opacity": 0.45 }
layout: {}

stats: { "eyebrow": "", "items": [{"value":"","label":"","sublabel":""}] }  // 4-6 items
layout: { "variant": "strip", "accentBg": "#1a1209" }

intro: { "eyebrow": "", "headline": "", "body": "" }
layout: { "variant": "left-aligned", "accentBg": "#faf9f6" }

highlight-band: { "eyebrow": "", "headline": "", "body": "" }
layout: { "accentBg": "#0f0e0c" }

feature: { "eyebrow": "", "headline": "", "body": "", "image": "" }
layout: { "variant": "image-right" }  // or "image-left"

dining: { "eyebrow": "", "headline": "", "body": "", "image": "" }
layout: { "variant": "image-left", "accentBg": "#0f0e0c" }

weddings: { "eyebrow": "", "headline": "", "body": "", "image": "" }
layout: { "variant": "image-right", "accentBg": "#131c14" }

gallery: { "title": "", "images": [{"url":"","caption":""}] }  // 4 images only — URLs left empty, filled manually later
layout: { "variant": "grid" }

mosaic: { "title": "", "body": "", "images": [{"url":"","alt":""}] }  // 4 images — URLs left empty
layout: { "variant": "grid" }

bento-grid: {
  "cells": [
    { "type": "image", "url": "", "alt": "" },
    { "type": "text",  "title": "", "body": "", "cta": "Discover",  "ctaUrl": "" },
    { "type": "image", "url": "", "alt": "" },
    { "type": "text",  "title": "", "body": "", "cta": "Explore",   "ctaUrl": "" },
    { "type": "text",  "title": "", "body": "", "cta": "Learn More","ctaUrl": "" },
    { "type": "image", "url": "", "alt": "" },
    { "type": "text",  "title": "", "body": "", "cta": "Discover",  "ctaUrl": "" },
    { "type": "image", "url": "", "alt": "" }
  ]
}
layout: {}
// 8 cells: alternating image/text in a 4-column grid. Fill title and body with editorial copy. All image URLs remain empty string. CTA labels should be varied and action-oriented.

quote: { "text": "", "attribution": "", "attributionRole": "" }
layout: { "variant": "centered", "accentBg": "#1a1209" }

verified: {
  "eyebrow": "At a Glance",
  "headline": "Venue Intelligence",
  "venue_hire_from": "",
  "typical_spend_min": "",
  "typical_spend_max": "",
  "ceremony_capacity": "",
  "dining_capacity": "",
  "reception_capacity": "",
  "bedrooms": "",
  "exclusive_use": "",
  "catering": "",
  "outdoor_ceremony": "",
  "accommodation": "",
  "location_summary": "",
  "style": "",
  "best_for": "",
  "verified_date": "",
  "verification_notes": ""
}
layout: {}

pricing: {
  "eyebrow": "Pricing & What to Expect",
  "headline": "",
  "body": "",
  "price_from": "",
  "price_context": "Venue hire from",
  "typical_min": "",
  "typical_max": "",
  "typical_label": "Typical total wedding investment",
  "includes": [],
  "excludes": [],
  "guidance": ""
}
layout: {}

spaces: { "eyebrow": "", "headline": "", "body": "", "image": "" }
layout: { "variant": "image-left", "accentBg": "#0f0e0c" }

wellness: { "eyebrow": "", "headline": "", "body": "", "image": "" }
layout: { "variant": "image-right", "accentBg": "#0f0e0c" }

faq: { "eyebrow": "Frequently Asked Questions", "headline": "", "faqs": [{"question":"","answer":""},{"question":"","answer":""},{"question":"","answer":""}] }
layout: {}
// Include 3–5 realistic FAQs based on the venue type and information provided.

cta: { "headline": "", "subline": "", "venueName": "" }
layout: {}

SECTION ORDER (use this structure):
1. hero
2. stats (4 key numbers only)
3. gallery (exactly 4 images — all URLs as empty string "")
4. intro (editorial opening)
5. highlight-band (brand statement)
6. verified (At a Glance structured data)
7. pricing (if pricing data available)
8. feature (rooms/suites)
9. dining (if relevant)
10. spaces (if relevant — event rooms, ballrooms)
11. wellness (if relevant — spa, fitness)
12. bento-grid (optional — use when venue has 4+ distinct experiences/offerings to showcase, e.g. activities, events, relaxation, dining)
13. weddings
14. faq (optional — 3–5 questions specific to weddings or events at this venue)
15. quote (editorial — one short sentence)
16. cta

IMPORTANT: Keep JSON compact. stats: exactly 4 items. gallery: exactly 4 images. quote: under 30 words.
For image URLs: always use empty string "". Images are added manually after generation.
For pricing/capacity: use whatever figures are in the venue info. If unknown, use "POA" or leave blank.
Generate unique IDs as: type + "-" + 3 random chars (e.g. "hero-a4f", "stats-b2k").`;

// ── User prompt builder ───────────────────────────────────────────────────────
function buildUserPrompt(venueInfo, mode) {
  const modeInstruction = mode === 'template'
    ? 'Use The Ritz London section structure as your template. Replace all content with content specific to this venue.'
    : 'Generate the best section structure for this specific venue. Adapt the section order and selection to suit the venue type and available information.';

  return `Generate a complete luxury showcase for the following venue.

MODE: ${mode === 'template' ? 'Template (Ritz-style structure)' : 'Bespoke (tailored structure)'}
${modeInstruction}

VENUE INFORMATION:
${venueInfo}

Return the complete JSON object now.`;
}

// ── Per-section schemas ───────────────────────────────────────────────────────
const SECTION_SCHEMAS = {
  'hero':           `{"title":"","tagline":"","eyebrow":"","overlay_opacity":0.45}`,
  'stats':          `{"eyebrow":"","items":[{"value":"","label":"","sublabel":""}]} — exactly 4 items. Values should be key numbers (capacity, bedrooms, acres, years established, etc.)`,
  'intro':          `{"eyebrow":"","headline":"","body":""} — body should be 3-4 editorial sentences`,
  'highlight-band': `{"eyebrow":"","headline":"","body":""} — short punchy brand statement, 1-2 sentences max`,
  'feature':        `{"eyebrow":"","headline":"","body":"","image":""} — leave image as ""`,
  'dining':         `{"eyebrow":"","headline":"","body":"","image":""} — leave image as ""`,
  'spaces':         `{"eyebrow":"","headline":"","body":"","image":""} — leave image as ""`,
  'wellness':       `{"eyebrow":"","headline":"","body":"","image":""} — leave image as ""`,
  'weddings':       `{"eyebrow":"","headline":"","body":"","image":""} — wedding-specific editorial`,
  'quote':          `{"text":"","attribution":"","attributionRole":""} — under 25 words, guest or editorial quote`,
  'mosaic':         `{"title":"","body":"","images":[{"url":"","alt":""}]} — 4 images, leave URLs as ""`,
  'gallery':        `{"title":"","images":[{"url":"","caption":""}]} — 4 images, leave URLs as ""`,
  'pricing':        `{"eyebrow":"Pricing & What to Expect","headline":"","body":"","price_from":"","price_context":"Venue hire from","typical_min":"","typical_max":"","typical_label":"Typical total wedding investment","includes":[],"excludes":[],"guidance":""}`,
  'verified':       `{"eyebrow":"At a Glance","headline":"Venue Intelligence","venue_hire_from":"","typical_spend_min":"","typical_spend_max":"","ceremony_capacity":"","dining_capacity":"","reception_capacity":"","bedrooms":"","exclusive_use":"","catering":"","outdoor_ceremony":"","accommodation":"","location_summary":"","style":"","best_for":"","verified_date":"","verification_notes":""}`,
  'faq':            `{"eyebrow":"Frequently Asked Questions","headline":"","faqs":[{"question":"","answer":""},{"question":"","answer":""},{"question":"","answer":""}]} — 3-5 realistic FAQs specific to this venue`,
  'cta':            `{"headline":"","subline":"","venueName":""}`,
  'nearby':         `{"eyebrow":"","headline":"","body":"","items":[{"icon":"train","label":"","distance":""},{"icon":"city","label":"","distance":""},{"icon":"airport","label":"","distance":""},{"icon":"shopping","label":"","distance":""}]} — 4-6 real nearby points. Use accurate distances/times if known. Icon must be one of: train, water, city, airport, beach, park, restaurant, shopping, museum, golf, spa, castle, marina, forest, business`,
  'rooms':          `{"eyebrow":"","headline":"","rooms":[{"name":"","tagline":"","capacity":2,"size":"","body":"","amenities":[{"icon":"bed","label":""},{"icon":"bath","label":""}],"images":[{"url":"","alt":""}],"ctaLabel":"To Book","ctaUrl":""}]} — 2-4 room types. Amenity icons: bed, bath, shower, sofa, desk, table, tv, wardrobe, safe, ac, balcony, kitchen, minibar, coffee`,
  'bento-grid':     `{"cells":[{"type":"image","images":[{"url":"","alt":""}]},{"type":"text","eyebrow":"","headline":"","title":"","body":"","cta":"Discover","ctaUrl":""},{"type":"image","images":[{"url":"","alt":""}]},{"type":"text","eyebrow":"","headline":"","title":"","body":"","cta":"Explore","ctaUrl":""},{"type":"text","eyebrow":"","headline":"","title":"","body":"","cta":"Learn More","ctaUrl":""},{"type":"image","images":[{"url":"","alt":""}]},{"type":"text","eyebrow":"","headline":"","title":"","body":"","cta":"Discover","ctaUrl":""},{"type":"image","images":[{"url":"","alt":""}]}]} — 8 cells: alternating image/text. Fill text cells with editorial copy. Leave all image URLs as "".`,
  'map':            `{"headline":"Find Us","zoom":14} — headline is optional (e.g. "Find Us" or "Getting Here"). Coordinates are auto-resolved from the venue name and location — do not include lat/lng or address fields.`,
  'films':          `{"eyebrow":"","headline":"","body":"","videos":[]} — eyebrow (e.g. "A Cinematic Experience"), headline, short body paragraph about the venue's film/video presence. Leave videos array empty — media is added manually.`,
  'image-full':     `{"url":"","alt":"","caption":"","height":"60vh"} — leave url as "". caption is optional short description.`,
  'cta':            `{"headline":"","subline":"","venueName":""} — headline is a compelling final call to action (e.g. "Begin Your Story Here"). subline is a warm one-liner invitation.`,
};

// Per-section system prompt
const SECTION_SYSTEM_PROMPT = `You are a luxury venue content writer for Luxury Wedding Directory.
Generate content for ONE specific section of a venue showcase page.

OUTPUT RULES:
- Return ONLY a valid JSON object: {"content": {...}, "layout": {...}}
- Start with { and end with }. No markdown, no explanation, raw JSON only.
- Every string must be real, editorial-quality content. No placeholders.
- Write in luxury editorial voice: evocative, precise, authoritative. Never generic.
- Use British English throughout.
- For image fields (url, image): always use empty string "".
- layout object: return {} if no specific layout needed, or include accentBg if appropriate.`;

// ── Per-section generate function ─────────────────────────────────────────────
export async function generateSectionWithAi({ sectionType, venueInfo }) {
  if (!venueInfo?.trim()) throw new Error('Please provide venue information.');

  const schema = SECTION_SCHEMAS[sectionType];
  if (!schema) throw new Error(`No AI schema defined for section type: ${sectionType}`);

  const userPrompt = `Generate a "${sectionType}" section for this venue.

CONTENT SCHEMA: ${schema}

VENUE INFORMATION:
${venueInfo}

Return {"content": {...}, "layout": {...}} now. Content must match the schema exactly. Be specific and accurate to this venue.`;

  const response = await fetch(AI_GENERATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      feature:      'showcase_section_fill',
      systemPrompt: SECTION_SYSTEM_PROMPT,
      userPrompt,
    }),
  });

  const result = await response.json();

  if (!response.ok || result.error) {
    if (result.status === 'not_configured') throw new Error('AI provider not configured.');
    throw new Error(result.error || 'AI generation failed.');
  }

  const rawText = result.text || result.content || result.response || result.output || result.result || '';

  let parsed;
  try {
    let cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
    if (!cleaned.startsWith('{')) { const s = cleaned.indexOf('{'); if (s !== -1) cleaned = cleaned.slice(s); }
    const e = cleaned.lastIndexOf('}');
    if (e !== -1 && e < cleaned.length - 1) cleaned = cleaned.slice(0, e + 1);
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  if (!parsed.content) throw new Error('AI response missing content. Please try again.');
  return { content: parsed.content, layout: parsed.layout || {} };
}

// ── Main function ─────────────────────────────────────────────────────────────
export async function generateShowcaseWithAi({ venueInfo, mode = 'template' }) {
  if (!venueInfo?.trim()) throw new Error('Please provide venue information.');

  const response = await fetch(AI_GENERATE_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify({
      feature:      'showcase_generate',
      systemPrompt: SYSTEM_PROMPT,
      userPrompt:   buildUserPrompt(venueInfo, mode),
    }),
  });

  const result = await response.json();

  console.log('[showcaseAiService] edge function response status:', response.status);
  console.log('[showcaseAiService] result keys:', Object.keys(result));
  console.log('[showcaseAiService] result.text (first 300):', result.text?.slice(0, 300));
  console.log('[showcaseAiService] result.content (first 300):', result.content?.slice(0, 300));

  if (!response.ok || result.error) {
    if (result.status === 'not_configured') {
      throw new Error('AI provider not configured. Go to Admin → AI Settings to add your API key.');
    }
    throw new Error(result.error || 'AI generation failed.');
  }

  // The edge function may return the AI text under different keys — try all
  const rawText = result.text || result.content || result.response || result.output || result.result || '';

  // Parse the JSON from the AI response text
  let parsed;
  try {
    // 1. Strip markdown fences
    let cleaned = rawText.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

    // 2. Extract the outermost JSON object if surrounded by text
    if (!cleaned.startsWith('{')) {
      const start = cleaned.indexOf('{');
      if (start !== -1) cleaned = cleaned.slice(start);
    }
    const end = cleaned.lastIndexOf('}');
    if (end !== -1 && end < cleaned.length - 1) cleaned = cleaned.slice(0, end + 1);

    console.log('[showcaseAiService] cleaned JSON (first 300):', cleaned.slice(0, 300));
    parsed = JSON.parse(cleaned);
  } catch (parseErr) {
    console.error('[showcaseAiService] JSON parse failed.');
    console.error('[showcaseAiService] rawText:', rawText.slice(0, 1000));
    console.error('[showcaseAiService] full result:', JSON.stringify(result).slice(0, 500));
    throw new Error('AI returned invalid JSON. Please try again.');
  }

  if (!parsed.sections || !Array.isArray(parsed.sections)) {
    throw new Error('AI response missing sections array. Please try again.');
  }

  // Ensure each section has a valid id
  const sections = parsed.sections.map((s, i) => ({
    ...s,
    id: s.id || `${s.type}-${Date.now()}-${i}`,
  }));

  return {
    meta:     parsed.meta     || {},
    sections,
  };
}
