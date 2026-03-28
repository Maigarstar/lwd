/**
 * locationSeoAiService.js
 * AI-powered SEO generation for location pages (countries, regions, cities).
 * Uses the existing ai-generate Edge Function + SEO_SYSTEM prompt.
 */

import { supabase } from '../lib/supabaseClient';
import { SEO_SYSTEM } from '../lib/aiPrompts';

// ── Core AI caller ──────────────────────────────────────────────────────────

async function callAI(feature, userPrompt, systemPrompt = SEO_SYSTEM) {
  const { data, error } = await supabase.functions.invoke('ai-generate', {
    body: { feature, systemPrompt, userPrompt },
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
  if (ctx.heroTitle) parts.push(`Hero title: ${ctx.heroTitle}`);
  if (ctx.heroSubtitle) parts.push(`Hero subtitle: ${ctx.heroSubtitle}`);
  if (ctx.editorialPara1) parts.push(`Editorial intro: ${ctx.editorialPara1}`);
  if (ctx.venueCount) parts.push(`Number of venues: ${ctx.venueCount}`);
  if (ctx.regionCount) parts.push(`Number of regions: ${ctx.regionCount}`);
  parts.push(`Brand: Luxury Wedding Directory`);
  parts.push(`Site: luxuryweddingdirectory.com`);
  const pagePath = ctx.citySlug
    ? `/${ctx.countrySlug}/${ctx.regionSlug}/${ctx.citySlug}`
    : ctx.regionSlug
      ? `/${ctx.countrySlug}/${ctx.regionSlug}`
      : `/${ctx.countrySlug || ''}`;
  parts.push(`Page path: ${pagePath}`);
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

function getToneInstruction(tone) {
  return TONE_INSTRUCTIONS[tone] || TONE_INSTRUCTIONS.luxury;
}

// ── Individual field generators ─────────────────────────────────────────────

export async function generateSeoTitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Generate an SEO title for this luxury wedding location page.
Rules:
- Maximum 60 characters
- Include the location name
- Include "Wedding Venues" or similar intent keyword
- End with "| Luxury Wedding Directory" only if space allows
- Make it compelling for search results

Return ONLY the title text, nothing else.`;

  return callAI('location_seo_title', prompt);
}

export async function generateSeoDescription(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Generate a meta description for this luxury wedding location page.
Rules:
- 150-160 characters maximum
- Include the location name and "wedding venues" keyword
- Create urgency or appeal to click
- Mention what makes this destination special for weddings

Return ONLY the description text, nothing else.`;

  return callAI('location_seo_description', prompt);
}

export async function generatePrimaryKeyword(ctx) {
  const prompt = `${buildContext(ctx)}

What is the single best primary keyword for this luxury wedding location page?
Consider search volume and intent.
Return ONLY the keyword phrase (2-4 words), nothing else.`;

  return callAI('location_seo_keyword', prompt);
}

export async function generateSecondaryKeywords(ctx) {
  const prompt = `${buildContext(ctx)}

Generate 6-8 secondary keywords for this luxury wedding location page.
Include long-tail variations and related search terms.
Return as comma-separated list, nothing else.`;

  return callAI('location_seo_keywords', prompt);
}

export async function generateOgTitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Generate an Open Graph title for social media sharing.
Rules:
- 60-70 characters
- Compelling and click-worthy for Facebook/LinkedIn
- Include location name
- More editorial than SEO title — designed to spark curiosity

Return ONLY the title text, nothing else.`;

  return callAI('location_og_title', prompt);
}

export async function generateOgDescription(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Generate an Open Graph description for social media sharing.
Rules:
- 100-150 characters
- Compelling for social feeds
- More emotional/editorial than meta description
- Emphasise the wedding experience in this location

Return ONLY the description text, nothing else.`;

  return callAI('location_og_description', prompt);
}

export async function generateTwitterTitle(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Generate a Twitter card title.
Rules:
- Under 70 characters
- Punchy and social-friendly
- Works as a standalone headline

Return ONLY the title text, nothing else.`;

  return callAI('location_twitter_title', prompt);
}

export async function generateTwitterDescription(ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Generate a Twitter card description.
Rules:
- Under 125 characters
- Social-friendly, concise
- Include a compelling hook

Return ONLY the description text, nothing else.`;

  return callAI('location_twitter_description', prompt);
}

export async function generateSchemaJson(ctx) {
  const schemaType = ctx.schemaType || (ctx.locationType === 'country' ? 'Country' : ctx.locationType === 'city' ? 'City' : 'Place');
  const prompt = `${buildContext(ctx)}

Generate a valid JSON-LD schema for this location page.
Schema type: ${schemaType}
Rules:
- Must be valid JSON-LD with @context and @type
- Include name, description, url
- Include geo coordinates if available (lat: ${ctx.mapLat || 'unknown'}, lng: ${ctx.mapLng || 'unknown'})
- Include image if available
- Keep it clean and well-structured

Return ONLY the JSON object, no markdown fences, no explanation.`;

  const raw = await callAI('location_schema', prompt);
  // Try to parse and re-format
  try {
    const match = raw.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(match ? match[0] : raw);
    return JSON.stringify(parsed, null, 2);
  } catch {
    return raw; // Return raw if parse fails, user can fix
  }
}

// ── Spin / Redo helpers ─────────────────────────────────────────────────────

export async function spinField(currentValue, fieldType, ctx, tone = 'luxury') {
  const prompt = `${buildContext(ctx)}

${getToneInstruction(tone)}

Here is the current ${fieldType}:
"${currentValue}"

Create a fresh variation that:
- Keeps the same meaning and key information
- Changes the phrasing, emphasis, and word choice
- Maintains appropriate length for ${fieldType}
- Does NOT repeat the same opening words
- Feels genuinely different, not just a word swap

Return ONLY the new text, nothing else.`;

  return callAI('location_seo_spin', prompt);
}

export async function shortenField(currentValue, fieldType, maxChars) {
  const prompt = `Shorten this ${fieldType} to under ${maxChars} characters while preserving the key message and luxury tone:

"${currentValue}"

Return ONLY the shortened text, nothing else.`;

  return callAI('location_seo_shorten', prompt);
}

// ── Bulk generators ─────────────────────────────────────────────────────────

/**
 * Fill only empty SEO fields. Does NOT overwrite existing content.
 * Returns an object with generated values for empty fields only.
 */
export async function fillEmptySeoFields(form, ctx, tone = 'luxury') {
  const results = {};
  const delay = () => new Promise(r => setTimeout(r, 300));

  if (!form.seoTitle) {
    results.seoTitle = await generateSeoTitle(ctx, tone); await delay();
  }
  if (!form.seoDescription) {
    results.seoDescription = await generateSeoDescription(ctx, tone); await delay();
  }
  if (!form.seoPrimaryKeyword) {
    results.seoPrimaryKeyword = await generatePrimaryKeyword(ctx); await delay();
  }
  if (!form.seoSecondaryKeywords) {
    results.seoSecondaryKeywords = await generateSecondaryKeywords(ctx); await delay();
  }
  if (!form.ogTitle) {
    results.ogTitle = await generateOgTitle(ctx, tone); await delay();
  }
  if (!form.ogDescription) {
    results.ogDescription = await generateOgDescription(ctx, tone); await delay();
  }
  if (!form.twitterTitle) {
    results.twitterTitle = await generateTwitterTitle(ctx, tone); await delay();
  }
  if (!form.twitterDescription) {
    results.twitterDescription = await generateTwitterDescription(ctx, tone); await delay();
  }
  if (!form.seoCanonicalUrl && ctx.countrySlug) {
    const path = ctx.citySlug
      ? `/${ctx.countrySlug}/${ctx.regionSlug}/${ctx.citySlug}`
      : ctx.regionSlug
        ? `/${ctx.countrySlug}/${ctx.regionSlug}`
        : `/${ctx.countrySlug}`;
    results.seoCanonicalUrl = `https://luxuryweddingdirectory.com${path}`;
  }

  return results;
}

/**
 * Regenerate ALL SEO fields (overwrites existing).
 */
export async function regenerateAllSeo(ctx, tone = 'luxury') {
  const results = {};
  const delay = () => new Promise(r => setTimeout(r, 300));

  results.seoTitle = await generateSeoTitle(ctx, tone); await delay();
  results.seoDescription = await generateSeoDescription(ctx, tone); await delay();
  results.seoPrimaryKeyword = await generatePrimaryKeyword(ctx); await delay();
  results.seoSecondaryKeywords = await generateSecondaryKeywords(ctx); await delay();
  results.ogTitle = await generateOgTitle(ctx, tone); await delay();
  results.ogDescription = await generateOgDescription(ctx, tone); await delay();
  results.twitterTitle = await generateTwitterTitle(ctx, tone); await delay();
  results.twitterDescription = await generateTwitterDescription(ctx, tone); await delay();
  results.schemaJson = await generateSchemaJson(ctx);

  // Auto-computed fields
  const path = ctx.citySlug
    ? `/${ctx.countrySlug}/${ctx.regionSlug}/${ctx.citySlug}`
    : ctx.regionSlug
      ? `/${ctx.countrySlug}/${ctx.regionSlug}`
      : `/${ctx.countrySlug || ''}`;
  results.seoCanonicalUrl = `https://luxuryweddingdirectory.com${path}`;

  return results;
}

/**
 * Spin all copywriting fields (keeps structure, changes wording).
 */
export async function spinAllSeo(form, ctx, tone = 'luxury') {
  const results = {};
  const delay = () => new Promise(r => setTimeout(r, 300));

  if (form.seoTitle) {
    results.seoTitle = await spinField(form.seoTitle, 'SEO title', ctx, tone); await delay();
  }
  if (form.seoDescription) {
    results.seoDescription = await spinField(form.seoDescription, 'meta description', ctx, tone); await delay();
  }
  if (form.ogTitle) {
    results.ogTitle = await spinField(form.ogTitle, 'Open Graph title', ctx, tone); await delay();
  }
  if (form.ogDescription) {
    results.ogDescription = await spinField(form.ogDescription, 'Open Graph description', ctx, tone); await delay();
  }
  if (form.twitterTitle) {
    results.twitterTitle = await spinField(form.twitterTitle, 'Twitter title', ctx, tone); await delay();
  }
  if (form.twitterDescription) {
    results.twitterDescription = await spinField(form.twitterDescription, 'Twitter description', ctx, tone); await delay();
  }

  return results;
}

/**
 * Auto-compute fields that don't need AI.
 */
export function autoComputeSeoDefaults(ctx) {
  const path = ctx.citySlug
    ? `/${ctx.countrySlug}/${ctx.regionSlug}/${ctx.citySlug}`
    : ctx.regionSlug
      ? `/${ctx.countrySlug}/${ctx.regionSlug}`
      : `/${ctx.countrySlug || ''}`;

  return {
    seoCanonicalUrl: `https://luxuryweddingdirectory.com${path}`,
    seoRobotsIndex: true,
    seoRobotsFollow: true,
    schemaType: ctx.locationType === 'country' ? 'Country'
      : ctx.locationType === 'city' ? 'City'
      : 'TouristDestination',
  };
}
