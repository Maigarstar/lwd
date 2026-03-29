/**
 * categoryContentAiService.js
 * AI-powered content generation for category page sections (hero, editorial, planning, motto, etc.).
 * Mirrors locationContentAiService.js pattern, adapted for vendor/service categories.
 */

import { supabase } from '../lib/supabaseClient';

// ── System prompt for category content ──────────────────────────────────────

const CONTENT_SYSTEM = `You are a senior editorial writer for Luxury Wedding Directory, an exclusive platform for high-end destination weddings worldwide. You are writing content for vendor and service category pages. Your writing is:

- Elegant, warm, and aspirational — never generic or templated
- Authoritative about wedding services and what makes each category exceptional
- Confident, like a luxury lifestyle magazine recommending the finest professionals
- Concise — every word earns its place
- SEO-aware without being keyword-stuffed
- Never clichéd (avoid "dream team", "big day", "special day", "picture-perfect", "unforgettable")

You write for couples planning luxury destination weddings who expect only the finest professionals.`;

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
  parts.push(`Category type: ${ctx.categoryType || 'parent'}`);
  if (ctx.categoryName) parts.push(`Category name: ${ctx.categoryName}`);
  if (ctx.parentCategory) parts.push(`Parent category: ${ctx.parentCategory}`);
  if (ctx.categorySlug) parts.push(`Slug: ${ctx.categorySlug}`);
  if (ctx.subCategories) parts.push(`Sub-categories: ${ctx.subCategories}`);
  if (ctx.vendorCount) parts.push(`Number of vendors listed: ${ctx.vendorCount}`);
  if (ctx.schemaType) parts.push(`Schema.org type: ${ctx.schemaType}`);
  if (ctx.heroTitle) parts.push(`Current hero title: ${ctx.heroTitle}`);
  if (ctx.heroSubtitle) parts.push(`Current hero subtitle: ${ctx.heroSubtitle}`);
  if (ctx.existingContent) parts.push(`Existing content: ${ctx.existingContent}`);
  parts.push('Brand: Luxury Wedding Directory');
  parts.push('Site: luxuryweddingdirectory.com');
  return parts.join('\n');
}

// ── Tone modifiers ──────────────────────────────────────────────────────────

const TONE_INSTRUCTIONS = {
  luxury: 'Use an elegant, high-end luxury wedding tone. Emphasise exclusivity and craftsmanship.',
  editorial: 'Write in a polished magazine editorial voice. Confident, authoritative, warm.',
  seo_strong: 'Prioritise keyword density and search intent. Still elegant but more direct.',
  direct: 'Be concise and straightforward. No fluff. Clear value proposition.',
  romantic: 'Emphasise the artistry, emotion, and transformative power of these professionals.',
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

Generate a hero headline for this luxury wedding service category page.
Rules:
- 3-6 words maximum
- Evocative and aspirational
- Include the category name naturally (e.g. "Photographers", "Florists")
- Should work as a large display heading over a hero image
- No quotes around the text

Return ONLY the headline text, nothing else.`;

  return callAI('category_hero_title', prompt);
}

export async function generateHeroSubtitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate a hero subtitle for this luxury wedding service category page.
Rules:
- One sentence, maximum 20 words
- Evocative and elegant — speaks to what makes these professionals exceptional
- Complements the hero title, does not repeat it
- Should work as smaller text beneath a large headline

Return ONLY the subtitle text, nothing else.`;

  return callAI('category_hero_subtitle', prompt);
}

// ── CTA ─────────────────────────────────────────────────────────────────────

export async function generateCtaText(ctx) {
  const prompt = `${buildContext(ctx)}

Generate a CTA button label for this category page.
Examples: "Browse Photographers", "Discover Our Florists", "View Collection"
Rules:
- 2-4 words
- Action-oriented
- Luxury tone

Return ONLY the CTA text, nothing else.`;

  return callAI('category_cta', prompt);
}

// ── Info Strip ──────────────────────────────────────────────────────────────

export async function generateInfoVibes(ctx) {
  const prompt = `${buildContext(ctx)}

Generate 4-6 "style" tags for this wedding service category.
These are short descriptors shown as pills on the page.
Examples for Photographers: "Documentary", "Fine Art", "Editorial", "Destination Specialist"
Examples for Florists: "English Garden", "Minimalist", "Tropical Luxe", "Baroque Opulence"

Rules:
- Each tag is 1-3 words
- Specific to this category's specialisations and styles
- Aspirational and evocative
- No generic tags

Return as a comma-separated list, nothing else.`;

  return callAI('category_info_vibes', prompt);
}

export async function generateInfoServices(ctx) {
  const prompt = `${buildContext(ctx)}

Generate 4-6 related services or offerings within this wedding category.
These are shown as informational pills on the category page.
Examples for Photographers: "Pre-Wedding Shoots", "Same-Day Edits", "Albums & Prints", "Drone Footage"
Examples for Planners: "Full Planning", "On-the-Day Coordination", "Destination Specialist", "Elopements"

Rules:
- Each item is 1-3 words
- Relevant to luxury weddings
- Use title case

Return as a comma-separated list, nothing else.`;

  return callAI('category_info_services', prompt);
}

// ── Editorial ───────────────────────────────────────────────────────────────

export async function generateEditorialContent(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate editorial content for the "${ctx.categoryName}" category page on a luxury wedding directory.
Return ONLY a JSON object with these exact keys:
{
  "eyebrow": "2-3 word section label (e.g. 'The Craft', 'Our Curation')",
  "headingPrefix": "3-5 word heading that works before '${ctx.categoryName}' (e.g. 'The Art of')",
  "editorialPara1": "First paragraph (3-4 sentences). What makes this category of professionals essential to a luxury wedding. The artistry and skill involved.",
  "editorialPara2": "Second paragraph (3-4 sentences). What couples should look for. How the right professional transforms the experience.",
  "block1Icon": "emoji",
  "block1Text": "Short benefit statement (8-12 words)",
  "block2Icon": "emoji",
  "block2Text": "Short benefit statement (8-12 words)",
  "block3Icon": "emoji",
  "block3Text": "Short benefit statement (8-12 words)",
  "block4Icon": "emoji",
  "block4Text": "Short benefit statement (8-12 words)",
  "ctaText": "CTA button text (2-4 words)"
}

Rules:
- Each paragraph should be self-contained and publishable
- Info blocks should highlight what distinguishes luxury-tier professionals
- Avoid clichés

Return ONLY the JSON object, no explanation.`;

  const raw = await callAI('category_editorial', prompt);
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) throw new Error('Failed to parse editorial JSON');
  return JSON.parse(match[0]);
}

// ── Planning Guide / Body Text ──────────────────────────────────────────────

export async function generatePlanningGuide(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Write a buyer's guide section for couples looking for luxury ${ctx.categoryName} for their wedding.
This appears as the main body content on the category page.

Rules:
- Exactly 2 paragraphs, no more
- First paragraph: why this category matters — the artistry, what separates luxury from standard
- Second paragraph: practical guidance — what to look for, questions to ask, when to book
- Write in second person ("you", "your wedding")
- Naturally include keywords like "luxury wedding ${ctx.categoryName?.toLowerCase()}", "best ${ctx.categoryName?.toLowerCase()}"
- Each paragraph should be 3-4 sentences, flowing prose
- Do not use headers or bullet points

Return ONLY the guide text, nothing else.`;

  return callAI('category_planning_guide', prompt);
}

// ── SEO Heading ─────────────────────────────────────────────────────────────

export async function generateSeoHeading(ctx) {
  const prompt = `${buildContext(ctx)}

Generate a heading for the planning guide section of this category page.
Format: "Choosing Your ${ctx.categoryName}" or a compelling variation.

Rules:
- 4-8 words
- Include the category name
- Informative and aspirational
- Should work as an H2 heading

Return ONLY the heading text, nothing else.`;

  return callAI('category_seo_heading', prompt);
}

// ── FAQs ────────────────────────────────────────────────────────────────────

export async function generateFaqs(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate 4 FAQs for the ${ctx.categoryName} category page on a luxury wedding directory.
Return ONLY a JSON array of objects with "q" and "a" keys.

Rules:
- Questions should be what luxury couples actually search for
- Answers should be 2-3 sentences, authoritative and helpful
- Include practical advice (pricing ranges, booking timelines, what to ask)
- Naturally include SEO keywords
- Do not be generic — be specific to luxury ${ctx.categoryName?.toLowerCase()}

Return ONLY the JSON array, no explanation.`;

  const raw = await callAI('category_faqs', prompt);
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) throw new Error('Failed to parse FAQ JSON');
  return JSON.parse(match[0]);
}

// ── Motto ───────────────────────────────────────────────────────────────────

export async function generateMotto(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Generate a short aspirational motto/quote for the ${ctx.categoryName} category page.
This appears as a large statement in a full-width banner.

Rules:
- 5-12 words
- Aspirational, elegant, memorable
- Speaks to the transformative power of these professionals
- Should work as a standalone statement

Return ONLY the motto text, nothing else.`;

  return callAI('category_motto', prompt);
}

export async function generateMottoSubline(ctx) {
  const prompt = `${buildContext(ctx)}

Generate a short subline to sit beneath this motto: "${ctx.motto || ''}"
For the ${ctx.categoryName} category page.

Rules:
- One sentence, max 15 words
- Grounds the motto with a practical or editorial note
- Warm but not sentimental

Return ONLY the subline text, nothing else.`;

  return callAI('category_motto_subline', prompt);
}

// ═══════════════════════════════════════════════════════════════════════════
// FIELD MODIFIERS (spin, shorten, luxury, editorial, SEO)
// ═══════════════════════════════════════════════════════════════════════════

export async function spinContentField(value, fieldLabel, ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getTone(tone)}

Rewrite this ${fieldLabel} with a fresh angle. Keep the same length and purpose but use completely different wording.

Current text:
"${value}"

Return ONLY the new text, nothing else.`;

  return callAI('category_spin', prompt);
}

export async function shortenContentField(value, fieldLabel, maxWords = 15) {
  const prompt = `Shorten this ${fieldLabel} to ${maxWords} words or fewer while keeping its essence and luxury tone.

Current text:
"${value}"

Return ONLY the shortened text, nothing else.`;

  return callAI('category_shorten', prompt);
}

export async function makeLuxury(value, fieldLabel, ctx) {
  const prompt = `${buildContext(ctx)}

Make this ${fieldLabel} sound more luxurious and exclusive. Elevate the language without making it longer.

Current text:
"${value}"

Return ONLY the elevated text, nothing else.`;

  return callAI('category_luxury', prompt);
}

export async function makeEditorial(value, fieldLabel, ctx) {
  const prompt = `${buildContext(ctx)}

Rewrite this ${fieldLabel} in a polished magazine editorial voice. Confident, authoritative, warm.

Current text:
"${value}"

Return ONLY the rewritten text, nothing else.`;

  return callAI('category_editorial_rewrite', prompt);
}

export async function makeSeoAware(value, fieldLabel, ctx) {
  const prompt = `${buildContext(ctx)}

Rewrite this ${fieldLabel} to be more SEO-friendly. Naturally weave in keywords related to "luxury wedding ${ctx.categoryName?.toLowerCase()}" and "${ctx.categoryName?.toLowerCase()} directory". Keep the luxury tone.

Current text:
"${value}"

Return ONLY the rewritten text, nothing else.`;

  return callAI('category_seo_rewrite', prompt);
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION-LEVEL GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

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
      results.infoServices = await generateInfoServices(ctx);
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

    default:
      break;
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════════
// BULK GENERATORS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fill only empty fields — does not overwrite existing content
 */
export async function fillEmptyContentFields(form, ctx, tone = 'luxury') {
  const results = {};

  // Hero
  if (!form.heroTitle) { results.heroTitle = await generateHeroTitle(ctx, tone); await delay(); }
  if (!form.heroSubtitle) { results.heroSubtitle = await generateHeroSubtitle(ctx, tone); await delay(); }
  if (!form.ctaText) { results.ctaText = await generateCtaText(ctx); await delay(); }

  // Info strip
  if (!form.infoVibes) { results.infoVibes = await generateInfoVibes(ctx); await delay(); }
  if (!form.infoServices) { results.infoServices = await generateInfoServices(ctx); await delay(); }

  // Editorial
  if (!form.editorialPara1 || !form.editorialPara2) {
    try {
      const editorial = await generateEditorialContent(ctx, tone);
      if (!form.editorialPara1) results.editorialPara1 = editorial.editorialPara1;
      if (!form.editorialPara2) results.editorialPara2 = editorial.editorialPara2;
      if (!form.editorialBlock1Icon) results.editorialBlock1Icon = editorial.block1Icon;
      if (!form.editorialBlock1Text) results.editorialBlock1Text = editorial.block1Text;
      if (!form.editorialBlock2Icon) results.editorialBlock2Icon = editorial.block2Icon;
      if (!form.editorialBlock2Text) results.editorialBlock2Text = editorial.block2Text;
      if (!form.editorialBlock3Icon) results.editorialBlock3Icon = editorial.block3Icon;
      if (!form.editorialBlock3Text) results.editorialBlock3Text = editorial.block3Text;
      if (!form.editorialBlock4Icon) results.editorialBlock4Icon = editorial.block4Icon;
      if (!form.editorialBlock4Text) results.editorialBlock4Text = editorial.block4Text;
      await delay();
    } catch (e) { console.warn('Editorial generation failed:', e); }
  }

  // Planning guide
  if (!form.seoContent) { results.seoContent = await generatePlanningGuide(ctx, tone); await delay(); }
  if (!form.seoFaqs || form.seoFaqs.length === 0) { results.seoFaqs = await generateFaqs(ctx, tone); await delay(); }

  // Motto
  if (!form.motto) { results.motto = await generateMotto(ctx, tone); await delay(); }
  if (!form.mottoSubline) { results.mottoSubline = await generateMottoSubline({ ...ctx, motto: results.motto || form.motto }); }

  return results;
}

/**
 * Regenerate ALL content fields (overwrites everything)
 */
export async function regenerateAllContent(form, ctx, tone = 'luxury') {
  const results = {};

  results.heroTitle = await generateHeroTitle(ctx, tone); await delay();
  results.heroSubtitle = await generateHeroSubtitle(ctx, tone); await delay();
  results.ctaText = await generateCtaText(ctx); await delay();
  results.infoVibes = await generateInfoVibes(ctx); await delay();
  results.infoServices = await generateInfoServices(ctx); await delay();

  try {
    const editorial = await generateEditorialContent(ctx, tone);
    Object.assign(results, {
      editorialPara1: editorial.editorialPara1,
      editorialPara2: editorial.editorialPara2,
      editorialBlock1Icon: editorial.block1Icon,
      editorialBlock1Text: editorial.block1Text,
      editorialBlock2Icon: editorial.block2Icon,
      editorialBlock2Text: editorial.block2Text,
      editorialBlock3Icon: editorial.block3Icon,
      editorialBlock3Text: editorial.block3Text,
      editorialBlock4Icon: editorial.block4Icon,
      editorialBlock4Text: editorial.block4Text,
      eyebrow: editorial.eyebrow,
      headingPrefix: editorial.headingPrefix,
      editorialCtaText: editorial.ctaText,
    });
    await delay();
  } catch (e) { console.warn('Editorial generation failed:', e); }

  results.seoContent = await generatePlanningGuide(ctx, tone); await delay();
  results.seoFaqs = await generateFaqs(ctx, tone); await delay();
  results.motto = await generateMotto(ctx, tone); await delay();
  results.mottoSubline = await generateMottoSubline({ ...ctx, motto: results.motto });

  return results;
}
