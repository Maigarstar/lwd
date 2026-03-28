/**
 * locationContentAiService.js
 * AI-powered content generation for location page sections (hero, editorial, planning, motto, etc.).
 * Uses the existing ai-generate Edge Function.
 */

import { supabase } from '../lib/supabaseClient';

// ── System prompt for location content ──────────────────────────────────────

const CONTENT_SYSTEM = `You are a senior editorial writer for Luxury Wedding Directory, an exclusive platform for high-end destination weddings worldwide. Your writing is:

- Elegant, warm, and aspirational — never generic or templated
- Rich with sensory detail specific to each destination
- Confident and authoritative, like a luxury travel magazine
- Concise — every word earns its place
- SEO-aware without being keyword-stuffed
- Never clichéd (avoid "nestled", "breathtaking", "unforgettable", "fairy-tale", "picture-perfect")

You write for couples planning luxury destination weddings. Your tone should make them feel they've discovered something exclusive.`;

// ── Core AI caller ──────────────────────────────────────────────────────────

async function callAI(feature, userPrompt) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt: CONTENT_SYSTEM, userPrompt },
  });
  if (error) throw new Error(error.message || 'AI service error');
  if (!data || data.error) {
    const msg = data?.status === 'not_configured'
      ? 'AI not configured — set up a provider in Admin > AI Settings'
      : (data?.error || 'AI service unavailable');
    throw new Error(msg);
  }
  return (data.text || '').trim();
}

// ── Context builder ─────────────────────────────────────────────────────────

function buildContext(ctx) {
  const parts = [];
  parts.push(`Location type: ${ctx.locationType || 'unknown'}`);
  if (ctx.locationName) parts.push(`Location name: ${ctx.locationName}`);
  if (ctx.countrySlug) parts.push(`Country: ${ctx.countrySlug}`);
  if (ctx.regionSlug) parts.push(`Region: ${ctx.regionSlug}`);
  if (ctx.citySlug) parts.push(`City: ${ctx.citySlug}`);
  if (ctx.heroTitle) parts.push(`Current hero title: ${ctx.heroTitle}`);
  if (ctx.heroSubtitle) parts.push(`Current hero subtitle: ${ctx.heroSubtitle}`);
  if (ctx.venueCount) parts.push(`Number of venues listed: ${ctx.venueCount}`);
  if (ctx.regionCount) parts.push(`Number of regions: ${ctx.regionCount}`);
  if (ctx.existingContent) parts.push(`Existing page content context: ${ctx.existingContent}`);
  parts.push(`Brand: Luxury Wedding Directory`);
  parts.push(`Site: luxuryweddingdirectory.com`);
  return parts.join('\n');
}

// ── Tone modifiers ──────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS = {
  luxury: 'Use an elegant, high-end luxury wedding tone. Emphasise exclusivity and sophistication.',
  editorial: 'Write in a polished magazine editorial voice. Confident, authoritative, warm.',
  seo_strong: 'Prioritise keyword density and search intent. Still elegant but more direct.',
  direct: 'Be concise and straightforward. No fluff. Clear value proposition.',
  romantic: 'Emphasise romance, emotion, and the wedding experience. Warm and evocative.',
};

function getTone(tone) {
  return TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.luxury;
}

const delay = () => new Promise(r => setTimeout(r, 300));

// ═══════════════════════════════════════════════════════════════════════════
// SECTION GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

// ── Hero ────────────────────────────────────────────────────────────────────

export async function generateHeroTitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate a hero headline for this luxury wedding destination page.
Rules:
- 3-6 words maximum
- Evocative and aspirational
- Include the location name naturally
- Should work as a large display heading over a hero image
- No quotes around the text

Return ONLY the headline text, nothing else.`;

  return callAI('location_hero_title', prompt);
}

export async function generateHeroSubtitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate a hero subtitle for this luxury wedding destination page.
Rules:
- One sentence, maximum 20 words
- Evocative and elegant — sets the scene
- Complements the hero title, does not repeat it
- Should work as smaller text beneath a large headline

Return ONLY the subtitle text, nothing else.`;

  return callAI('location_hero_subtitle', prompt);
}

// ── Info Strip ───────────────────────────────────────────────────────────────

export async function generateInfoVibes(ctx) {
  const prompt = `${buildContext(ctx)}

Generate 4-6 "vibe" tags for this luxury wedding destination.
These are short mood/atmosphere descriptors shown as pills on the page.
Examples: "Countryside Elegance", "Historic Grandeur", "Coastal Romance", "Vineyard Charm"

Rules:
- Each tag is 1-3 words
- Specific to this destination's character
- Aspirational and evocative
- No generic tags like "Beautiful" or "Nice"

Return as a comma-separated list, nothing else.`;

  return callAI('location_info_vibes', prompt);
}

export async function generateInfoServices(ctx) {
  const prompt = `${buildContext(ctx)}

Generate 4-6 wedding service categories commonly available at this destination.
These are shown as informational pills on the location page.
Examples: "Wedding Planners", "Luxury Catering", "Floral Design", "Bespoke Photography"

Rules:
- Each item is 1-3 words
- Relevant to luxury weddings in this specific destination
- Use title case

Return as a comma-separated list, nothing else.`;

  return callAI('location_info_services', prompt);
}

export async function generateInfoRegions(ctx) {
  const prompt = `${buildContext(ctx)}

Generate 3-6 notable sub-regions, areas, or neighbourhoods within this ${ctx.locationType} that are popular for luxury weddings.
These are shown as location pills on the page.

Rules:
- Use real place names
- Focus on areas known for wedding venues or luxury hospitality
- Each item is just the place name (1-3 words)

Return as a comma-separated list, nothing else.`;

  return callAI('location_info_regions', prompt);
}

// ── Editorial ───────────────────────────────────────────────────────────────

export async function generateEditorialContent(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate editorial content for the "${ctx.locationName}" wedding destination page.
Return ONLY a JSON object with these exact keys:

{
  "editorialPara1": "First paragraph (3-4 sentences). Introduce this destination as a wedding location. What makes it special? Set the scene with sensory detail.",
  "editorialPara2": "Second paragraph (3-4 sentences). Go deeper — talk about the wedding experience here, the venues, the culture, why couples choose this destination.",
  "editorialBlock1Text": "Short text (1-2 sentences) about the venue landscape — what types of venues are available.",
  "editorialBlock2Text": "Short text (1-2 sentences) about the local culture and traditions that enhance weddings.",
  "editorialBlock3Text": "Short text (1-2 sentences) about seasonal considerations or best times for weddings.",
  "editorialBlock4Text": "Short text (1-2 sentences) about logistics, accessibility, or guest experience."
}

Rules:
- Write actual compelling copy, not placeholder descriptions
- Each paragraph should be self-contained and publishable
- Block texts should be concise (under 30 words each)
- Do NOT include the field descriptions in your output — write real content
- Return ONLY the JSON object, no markdown fences, no explanation`;

  const raw = await callAI('location_editorial', prompt);
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : raw);
  } catch {
    throw new Error('AI returned invalid editorial content. Try again.');
  }
}

export async function generateEditorialPara(ctx, paraNum, tone = 'luxury') {
  const paraContext = paraNum === 1
    ? 'an introductory paragraph that sets the scene for this wedding destination. What makes it special? Use sensory detail.'
    : 'a deeper paragraph about the wedding experience, venues, culture, and why couples choose this destination.';

  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Write ${paraContext}

Rules:
- 3-4 sentences
- Publishable quality — elegant, specific, evocative
- Avoid clichés
- Do not start with "Welcome" or "When it comes to"

Return ONLY the paragraph text, nothing else.`;

  return callAI(`location_editorial_para${paraNum}`, prompt);
}

// ── Planning Guide / SEO Content ────────────────────────────────────────────

export async function generatePlanningGuide(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Write a planning guide section for couples considering a luxury wedding in ${ctx.locationName}.
This appears as the main body content on the location page.

Rules:
- 3-5 paragraphs, well-structured
- Cover: why this destination, what to expect, venue types, best seasons, practical considerations
- Write in second person ("you", "your wedding")
- Naturally include keywords like "${ctx.locationName} wedding venues", "luxury wedding ${ctx.locationName}"
- Each paragraph should flow naturally into the next
- Do not use headers or bullet points — write flowing prose

Return ONLY the guide text, nothing else.`;

  return callAI('location_planning_guide', prompt);
}

export async function generateSeoHeading(ctx) {
  const prompt = `${buildContext(ctx)}

Generate a heading for the planning guide section of this location page.
Format: "Planning Your [Location Name] Wedding" or a compelling variation.

Rules:
- 4-8 words
- Include the location name
- Include "wedding" or "celebration"
- Aspirational but informative

Return ONLY the heading text, nothing else.`;

  return callAI('location_seo_heading', prompt);
}

export async function generateFaqs(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate 4-6 frequently asked questions about luxury weddings in ${ctx.locationName}.
Return ONLY a JSON array of objects with "q" and "a" keys:

[
  {"q": "question text", "a": "answer text (2-3 sentences, helpful and specific)"},
  ...
]

Rules:
- Questions should be what real couples would search for
- Answers should be specific to this destination, not generic
- Cover topics like: best time to marry, legal requirements, venue types, guest logistics, budget considerations
- Answers should be 2-3 sentences, informative and warm
- Return ONLY the JSON array, no markdown fences, no explanation`;

  const raw = await callAI('location_faqs', prompt);
  try {
    const match = raw.match(/\[[\s\S]*\]/);
    return JSON.parse(match ? match[0] : raw);
  } catch {
    throw new Error('AI returned invalid FAQ content. Try again.');
  }
}

// ── Motto Banner ────────────────────────────────────────────────────────────

export async function generateMotto(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate a motto or inspirational quote for the ${ctx.locationName} wedding destination page.
This appears as large display text on a cinematic banner.

Rules:
- One sentence, 8-15 words
- Poetic, evocative, aspirational
- Specific to this destination's character
- Should feel like a tagline or editorial pullquote
- Written in third person (about the place, not "you")

Return ONLY the motto text, nothing else.`;

  return callAI('location_motto', prompt);
}

export async function generateMottoSubline(ctx) {
  const prompt = `${buildContext(ctx)}

Generate a short subline for the motto banner on this location page.
This appears in small caps below the main motto quote.

Rules:
- 2-5 words
- Brand-aligned (e.g. "Luxury Wedding Directory · ${ctx.locationName}")
- Simple and understated

Return ONLY the subline text, nothing else.`;

  return callAI('location_motto_subline', prompt);
}

// ── Featured & Latest Sections ──────────────────────────────────────────────

export async function generateFeaturedVenuesTitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate a section heading for the featured wedding venues in ${ctx.locationName}.
Examples: "Signature Venues", "Distinguished Venues of ${ctx.locationName}", "Curated ${ctx.locationName} Venues"

Rules:
- 2-5 words
- Aspirational, luxury-aligned
- Can include location name if it flows naturally

Return ONLY the heading text, nothing else.`;

  return callAI('location_featured_venues_title', prompt);
}

export async function generateLatestHeadings(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate headings and summaries for the "Latest Venues" and "Latest Vendors" sections on this location page.
Return ONLY a JSON object:

{
  "latestVenuesHeading": "2-4 word heading for latest venues section",
  "latestVenuesSub": "One sentence summary (under 15 words) about discovering venues in this destination",
  "latestVendorsHeading": "2-4 word heading for latest vendors section",
  "latestVendorsSub": "One sentence summary (under 15 words) about discovering wedding professionals"
}

Rules:
- Headings should be short and elegant
- Summaries should be warm and inviting
- Include location name where natural
- Return ONLY the JSON object, no markdown fences`;

  const raw = await callAI('location_latest_headings', prompt);
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : raw);
  } catch {
    throw new Error('AI returned invalid headings. Try again.');
  }
}

// ── CTA Text ────────────────────────────────────────────────────────────────

export async function generateCtaText(ctx) {
  const prompt = `${buildContext(ctx)}

Generate a call-to-action button label for the hero section of this location page.
Examples: "Explore Venues", "Discover ${ctx.locationName}", "Browse Wedding Venues"

Rules:
- 2-4 words
- Action-oriented
- Can include location name if short enough

Return ONLY the CTA text, nothing else.`;

  return callAI('location_cta_text', prompt);
}

// ═══════════════════════════════════════════════════════════════════════════
// SPIN / REDO / MODIFY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

export async function spinField(currentValue, fieldType, ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Here is the current ${fieldType}:
"${currentValue}"

Create a fresh variation that:
- Keeps the same meaning and key information
- Changes the phrasing, emphasis, and word choice
- Maintains appropriate length for ${fieldType}
- Does NOT repeat the same opening words
- Feels genuinely different, not just a word swap

Return ONLY the new text, nothing else.`;

  return callAI('location_content_spin', prompt);
}

export async function shortenField(currentValue, fieldType, maxWords) {
  const prompt = `Shorten this ${fieldType} to under ${maxWords} words while preserving the key message and luxury tone:

"${currentValue}"

Return ONLY the shortened text, nothing else.`;

  return callAI('location_content_shorten', prompt);
}

export async function makeLuxury(currentValue, fieldType, ctx) {
  const prompt = `${buildContext(ctx)}

Here is the current ${fieldType}:
"${currentValue}"

Rewrite this with a more luxurious, exclusive, high-end tone. Emphasise sophistication, elegance, and exclusivity. Maintain the same meaning and approximate length.

Return ONLY the rewritten text, nothing else.`;

  return callAI('location_content_luxury', prompt);
}

export async function makeEditorial(currentValue, fieldType, ctx) {
  const prompt = `${buildContext(ctx)}

Here is the current ${fieldType}:
"${currentValue}"

Rewrite this in a polished magazine editorial voice. Confident, authoritative, warm. Like it belongs in Vogue or Condé Nast Traveller. Maintain the same meaning and approximate length.

Return ONLY the rewritten text, nothing else.`;

  return callAI('location_content_editorial', prompt);
}

export async function makeSeoAware(currentValue, fieldType, ctx) {
  const prompt = `${buildContext(ctx)}

Here is the current ${fieldType}:
"${currentValue}"

Rewrite this to be more SEO-aware. Naturally include keywords like "${ctx.locationName} wedding venues", "luxury wedding ${ctx.locationName}", "${ctx.locationName} weddings". Keep the elegant tone but improve search visibility. Maintain approximate length.

Return ONLY the rewritten text, nothing else.`;

  return callAI('location_content_seo', prompt);
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fill only empty content fields. Does NOT overwrite existing content.
 * Returns an object with generated values for empty fields only.
 */
export async function fillEmptyContentFields(form, ctx, tone = 'luxury') {
  const results = {};

  // Hero
  if (!form.heroTitle) {
    results.heroTitle = await generateHeroTitle(ctx, tone); await delay();
  }
  if (!form.heroSubtitle) {
    results.heroSubtitle = await generateHeroSubtitle(ctx, tone); await delay();
  }
  if (!form.ctaText || form.ctaText === 'Explore Venues') {
    results.ctaText = await generateCtaText(ctx); await delay();
  }

  // Info Strip
  if (!form.infoVibes) {
    results.infoVibes = await generateInfoVibes(ctx); await delay();
  }
  if (!form.infoServices) {
    results.infoServices = await generateInfoServices(ctx); await delay();
  }
  if (!form.infoRegions) {
    results.infoRegions = await generateInfoRegions(ctx); await delay();
  }

  // Editorial
  if (!form.editorialPara1 || !form.editorialPara2) {
    const editorial = await generateEditorialContent(ctx, tone); await delay();
    if (!form.editorialPara1 && editorial.editorialPara1) results.editorialPara1 = editorial.editorialPara1;
    if (!form.editorialPara2 && editorial.editorialPara2) results.editorialPara2 = editorial.editorialPara2;
    if (!form.editorialBlock1Text && editorial.editorialBlock1Text) results.editorialBlock1Text = editorial.editorialBlock1Text;
    if (!form.editorialBlock2Text && editorial.editorialBlock2Text) results.editorialBlock2Text = editorial.editorialBlock2Text;
    if (!form.editorialBlock3Text && editorial.editorialBlock3Text) results.editorialBlock3Text = editorial.editorialBlock3Text;
    if (!form.editorialBlock4Text && editorial.editorialBlock4Text) results.editorialBlock4Text = editorial.editorialBlock4Text;
  }

  // Featured
  if (!form.featuredVenuesTitle || form.featuredVenuesTitle === 'Signature Venues') {
    results.featuredVenuesTitle = await generateFeaturedVenuesTitle(ctx, tone); await delay();
  }

  // Planning Guide
  if (!form.seoHeading) {
    results.seoHeading = await generateSeoHeading(ctx); await delay();
  }
  if (!form.seoContent) {
    results.seoContent = await generatePlanningGuide(ctx, tone); await delay();
  }
  if (!form.seoFaqs || form.seoFaqs.length === 0 || (form.seoFaqs.length === 1 && !form.seoFaqs[0].q)) {
    results.seoFaqs = await generateFaqs(ctx, tone); await delay();
  }

  // Motto
  if (!form.motto) {
    results.motto = await generateMotto(ctx, tone); await delay();
  }
  if (!form.mottoSubline) {
    results.mottoSubline = await generateMottoSubline(ctx); await delay();
  }

  // Latest sections
  if (!form.latestVenuesHeading || !form.latestVendorsHeading) {
    const headings = await generateLatestHeadings(ctx, tone);
    if (!form.latestVenuesHeading && headings.latestVenuesHeading) results.latestVenuesHeading = headings.latestVenuesHeading;
    if (!form.latestVenuesSub && headings.latestVenuesSub) results.latestVenuesSub = headings.latestVenuesSub;
    if (!form.latestVendorsHeading && headings.latestVendorsHeading) results.latestVendorsHeading = headings.latestVendorsHeading;
    if (!form.latestVendorsSub && headings.latestVendorsSub) results.latestVendorsSub = headings.latestVendorsSub;
  }

  return results;
}

/**
 * Regenerate ALL content fields (overwrites existing).
 */
export async function regenerateAllContent(ctx, tone = 'luxury') {
  const results = {};

  // Hero
  results.heroTitle = await generateHeroTitle(ctx, tone); await delay();
  results.heroSubtitle = await generateHeroSubtitle(ctx, tone); await delay();
  results.ctaText = await generateCtaText(ctx); await delay();

  // Info Strip
  results.infoVibes = await generateInfoVibes(ctx); await delay();
  results.infoServices = await generateInfoServices(ctx); await delay();
  results.infoRegions = await generateInfoRegions(ctx); await delay();

  // Editorial
  const editorial = await generateEditorialContent(ctx, tone); await delay();
  Object.assign(results, editorial);

  // Featured
  results.featuredVenuesTitle = await generateFeaturedVenuesTitle(ctx, tone); await delay();

  // Planning Guide
  results.seoHeading = await generateSeoHeading(ctx); await delay();
  results.seoContent = await generatePlanningGuide(ctx, tone); await delay();
  results.seoFaqs = await generateFaqs(ctx, tone); await delay();

  // Motto
  results.motto = await generateMotto(ctx, tone); await delay();
  results.mottoSubline = await generateMottoSubline(ctx); await delay();

  // Latest sections
  const headings = await generateLatestHeadings(ctx, tone);
  Object.assign(results, headings);

  return results;
}

/**
 * Spin all existing content fields (rewrites without changing meaning).
 */
export async function spinAllContent(form, ctx, tone = 'luxury') {
  const results = {};
  const spinnable = [
    ['heroTitle', 'hero title'],
    ['heroSubtitle', 'hero subtitle'],
    ['editorialPara1', 'editorial paragraph'],
    ['editorialPara2', 'editorial paragraph'],
    ['motto', 'motto quote'],
    ['seoContent', 'planning guide'],
    ['latestVenuesHeading', 'section heading'],
    ['latestVenuesSub', 'section summary'],
    ['latestVendorsHeading', 'section heading'],
    ['latestVendorsSub', 'section summary'],
    ['featuredVenuesTitle', 'section heading'],
  ];

  for (const [key, label] of spinnable) {
    if (form[key]) {
      results[key] = await spinField(form[key], label, ctx, tone);
      await delay();
    }
  }

  return results;
}

/**
 * Generate content for a specific section only.
 */
export async function generateSection(section, form, ctx, tone = 'luxury') {
  const results = {};

  switch (section) {
    case 'hero':
      results.heroTitle = await generateHeroTitle(ctx, tone); await delay();
      results.heroSubtitle = await generateHeroSubtitle(ctx, tone); await delay();
      results.ctaText = await generateCtaText(ctx);
      break;

    case 'infoStrip':
      results.infoVibes = await generateInfoVibes(ctx); await delay();
      results.infoServices = await generateInfoServices(ctx); await delay();
      results.infoRegions = await generateInfoRegions(ctx);
      break;

    case 'editorial': {
      const editorial = await generateEditorialContent(ctx, tone);
      Object.assign(results, editorial);
      break;
    }

    case 'planning':
      results.seoHeading = await generateSeoHeading(ctx); await delay();
      results.seoContent = await generatePlanningGuide(ctx, tone); await delay();
      results.seoFaqs = await generateFaqs(ctx, tone);
      break;

    case 'motto':
      results.motto = await generateMotto(ctx, tone); await delay();
      results.mottoSubline = await generateMottoSubline(ctx);
      break;

    case 'featured':
      results.featuredVenuesTitle = await generateFeaturedVenuesTitle(ctx, tone);
      break;

    case 'latest': {
      const headings = await generateLatestHeadings(ctx, tone);
      Object.assign(results, headings);
      break;
    }

    default:
      throw new Error(`Unknown section: ${section}`);
  }

  return results;
}
