/**
 * Taigenic AI Prompts - Luxury Editorial Content Generation
 *
 * SINGLE SOURCE OF TRUTH for all ListingStudio AI generation.
 * Do NOT duplicate prompt text across section components.
 * Import and use these builders exclusively.
 *
 * Backend MUST validate all outputs:
 * - SEO title length (50-60 chars)
 * - Meta description length (150-160 chars)
 * - FAQ JSON parse success
 * - Alt text length (<125 chars)
 * - Non-empty text validation
 *
 * Usage:
 *   import { LUXURY_TONE_SYSTEM, buildAboutPrompt } from '../lib/aiPrompts';
 */

// ═══════════════════════════════════════════════════════════════════════════
// SYSTEM PROMPTS - Define AI behavior and luxury editorial tone
// ═══════════════════════════════════════════════════════════════════════════

export const LUXURY_TONE_SYSTEM = `You are a luxury wedding editor writing in an elegant, high-end editorial style.

Write sophisticated prose that captures exclusivity and timeless appeal.
- Avoid generic marketing language and clichés
- Use ONLY information provided - never invent or assume facts
- Write in flowing paragraphs, not bullet points
- Emphasize craftsmanship, exclusivity, and emotional experience
- Maintain a warm, sophisticated tone
- Focus on what makes this venue special and memorable`;

export const SEO_SYSTEM = `You are an SEO-focused luxury copywriter.

Generate precise, keyword-rich copy that maintains luxury tone.
- Be concise but descriptive
- Include relevant keywords naturally
- Never use clichés or overused wedding/travel phrases
- Focus on unique selling points
- Use ONLY information provided - do not invent or assume facts`;

export const ALT_TEXT_SYSTEM = `You are an accessibility expert and SEO copywriter.

Write concise, descriptive alt text that:
- Describes what's visible in the image
- Includes relevant keywords naturally
- Is clear for screen readers
- Is under 125 characters
- Never invent details not visible in the image`;

export const FAQ_SYSTEM = `You are a luxury customer experience expert.

Generate FAQ questions and answers that:
- Anticipate genuine customer concerns
- Provide specific, valuable information
- Maintain sophisticated, helpful tone
- Are concise but complete
- Use ONLY provided facts - never invent or assume details`;

// ═══════════════════════════════════════════════════════════════════════════
// PROMPT BUILDERS - Generate user prompts with venue data
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build prompt for About Description generation
 */
export const buildAboutPrompt = (venueName, venueData) => {
  return `Generate a luxury editorial description for ${venueName}, a luxury wedding venue.

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Venue Style: ${venueData.style}` : 'Venue Style: (not provided)'}
${venueData?.highlights?.length > 0 ? `Key Features: ${venueData.highlights.join(', ')}` : 'Key Features: (not provided)'}
${venueData?.history ? `Historical Context: ${venueData.history}` : 'Historical Context: (not provided)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided above.

Write a compelling 2-3 paragraph editorial that captures the venue's essence. Focus on experience and emotion, not marketing language. Ensure it reads like luxury editorial content, not a listing description.`;
};

/**
 * Build prompt for SEO Title generation
 */
export const buildSeoTitlePrompt = (venueName, venueData) => {
  return `Generate a concise SEO-optimized title for ${venueName} (50-60 characters MAXIMUM).

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.destination ? `Destination: ${venueData.destination}` : 'Destination: (not provided)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Title must:
- Include location if it's a known luxury destination
- Include wedding-related keywords naturally
- Be elegant and specific (avoid bland or generic phrasing)
- Appeal to luxury couples searching
- Be search-friendly while maintaining sophistication

RETURN ONLY THE TITLE TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for SEO Meta Description generation
 */
export const buildSeoDescriptionPrompt = (venueName, venueData) => {
  return `Generate a compelling SEO meta description for ${venueName} (150-160 characters MAXIMUM).

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.highlights?.length > 0 ? `Key Features: ${venueData.highlights.join(', ')}` : 'Key Features: (not provided)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Description must:
- Summarize the venue's luxury appeal
- Include wedding/venue keywords naturally
- Encourage clicks from luxury couples in search results
- Not exceed 160 characters

RETURN ONLY THE META DESCRIPTION TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for SEO Keywords generation
 */
export const buildSeoKeywordsPrompt = (venueName, venueData) => {
  return `Generate 5-8 relevant SEO keywords for ${venueName}, formatted as a comma-separated list.

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.destination ? `Destination: ${venueData.destination}` : 'Destination: (not provided)'}
${venueData?.style ? `Venue Style: ${venueData.style}` : 'Venue Style: (not provided)'}
${venueData?.capacity ? `Capacity: ${venueData.capacity} guests` : 'Capacity: (not provided)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Keywords should:
- Target luxury wedding couples
- Include location + venue type combinations
- Include destination + wedding keywords
- Focus on high-intent search terms
- Avoid generic keywords like "wedding venue" or "event space"

RETURN ONLY A COMMA-SEPARATED LIST. No numbering, no extra commentary.`;
};

/**
 * Build prompt for Image Alt Text generation
 */
export const buildAltTextPrompt = (imageName, venueName, venueContext, additionalContext) => {
  return `Generate accessible alt text for an image associated with ${venueName}.

IMAGE CONTEXT:
${imageName ? `Image Name/File: ${imageName}` : ''}
${venueContext ? `Venue Context: ${venueContext}` : 'Venue Context: (not provided)'}
${additionalContext ? `Additional Details: ${additionalContext}` : ''}

IMPORTANT: If information is missing, do not invent details. Only describe what would be visible in the image based on the venue context provided.

Alt text must:
- Describe what's visible (not guess hidden details)
- Include relevant keywords naturally
- Be clear for screen reader users
- Be under 125 characters
- Not include "image of" or "photo of" (redundant)

RETURN ONLY THE ALT TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Image Caption generation
 */
export const buildImageCaptionPrompt = (imageName, venueName, venueData) => {
  return `Generate a brief luxury caption for an image at ${venueName}.

IMAGE & VENUE CONTEXT:
${imageName ? `Image: ${imageName}` : ''}
${venueName ? `Venue: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : ''}
${venueData?.style ? `Venue Style: ${venueData.style}` : ''}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Caption must:
- Be 1-2 sentences maximum
- Describe the image in editorial tone
- Include venue name or location if relevant
- Appeal to luxury couples
- Maintain magazine-quality writing

RETURN ONLY THE CAPTION. No explanation, no numbering.`;
};

/**
 * Build prompt for FAQ generation
 */
export const buildFaqPrompt = (venueName, venueData) => {
  const topics = [];
  if (venueData?.capacity) topics.push('capacity and guest limits');
  if (venueData?.catering) topics.push('catering and cuisine options');
  if (venueData?.accommodations) topics.push('guest accommodations');
  if (venueData?.parking) topics.push('parking and arrival logistics');
  if (venueData?.outdoorSpace) topics.push('outdoor ceremony possibilities');

  return `Generate 5-8 FAQ questions and answers for ${venueName}, a luxury wedding venue.

VENUE INFORMATION:
${venueName ? `Venue Name: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.capacity ? `Capacity: ${venueData.capacity} guests` : 'Capacity: (not provided)'}
${topics.length > 0 ? `Topics to Consider: ${topics.join(', ')}` : ''}

IMPORTANT: If information is missing, do not invent or assume facts. Answer only based on information provided.

For each question:
1. Phrase as a luxury couple would genuinely ask
2. Provide specific, valuable answer based on venue details
3. Reference the venue by name when appropriate
4. Maintain sophisticated, helpful tone

FORMAT AS VALID JSON ARRAY (backend will parse this):
[
  { "question": "Question text here?", "answer": "Answer text here." },
  { "question": "Another question?", "answer": "Another answer." }
]

RETURN ONLY THE JSON ARRAY. No explanation, no markdown code blocks.`;
};

/**
 * Build prompt for Ceremony Description generation
 */
export const buildCeremonyDescriptionPrompt = (venueName, venueData) => {
  return `Generate a luxury editorial description of ceremony possibilities at ${venueName}.

VENUE INFORMATION:
${venueName ? `Venue: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.outdoorSpace ? `Outdoor Ceremony Space: Available` : 'Outdoor Ceremony Space: (not mentioned)'}
${venueData?.capacity ? `Capacity: ${venueData.capacity} guests` : 'Capacity: (not provided)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Write 1-2 paragraphs describing how couples can celebrate their ceremony at this venue.
Focus on the experience, emotional significance, and how the venue's setting enhances the moment.
Use editorial tone, not marketing language.`;
};

/**
 * Build prompt for Dining Description generation
 */
export const buildDiningDescriptionPrompt = (venueName, venueData) => {
  return `Generate a luxury editorial description of dining experiences at ${venueName}.

VENUE INFORMATION:
${venueName ? `Venue: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.catering ? `Catering Style: ${venueData.catering}` : 'Catering Style: (not specified)'}
${venueData?.chef ? `Chef/Kitchen Leadership: ${venueData.chef}` : ''}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Write 1-2 paragraphs about the culinary experience couples can expect.
Emphasize quality, sourcing, and the relationship between food and location.
Use editorial tone focused on experience and emotion.`;
};

/**
 * Build prompt for Rooms/Accommodation Description generation
 */
export const buildRoomsDescriptionPrompt = (venueName, venueData) => {
  return `Generate a luxury editorial description of guest accommodations at ${venueName}.

VENUE INFORMATION:
${venueName ? `Venue: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.accommodationType ? `Room Type: ${venueData.accommodationType}` : 'Room Type: (not specified)'}
${venueData?.totalRooms ? `Total Rooms: ${venueData.totalRooms}` : 'Total Rooms: (not provided)'}
${venueData?.roomAmenities?.length > 0 ? `Amenities: ${venueData.roomAmenities.join(', ')}` : 'Amenities: (not specified)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided.

Write 1-2 paragraphs describing the guest accommodation experience.
Focus on comfort, design, and how rooms enhance the overall wedding experience.
Use editorial tone that appeals to luxury couples.`;
};

/**
 * Build prompt for Pricing/Investment Description generation
 */
export const buildPricingDescriptionPrompt = (venueName, venueData) => {
  return `Generate a luxury editorial description of the investment and value at ${venueName}.

VENUE INFORMATION:
${venueName ? `Venue: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.priceFrom ? `Price Range Starts From: ${venueData.priceFrom}` : 'Price Range: (not specified)'}
${venueData?.inclusionsHighlights?.length > 0 ? `Key Inclusions: ${venueData.inclusionsHighlights.join(', ')}` : 'Key Inclusions: (not specified)'}

IMPORTANT: If information is missing, do not invent or assume facts. Use only the details provided. Do not make up pricing or inclusions.

Write 1-2 paragraphs explaining the value and investment in hosting a wedding at this venue.
Frame it around the experience, memories created, and exclusivity.
Never compare to other venues or use marketing tactics.
Use editorial tone focused on what makes this investment worthwhile.`;
};

/**
 * Build prompt for Exclusive Use Description generation
 */
export const buildExclusiveUsePrompt = (venueName, venueData) => {
  return `Generate a compelling editorial description for the Exclusive Use block at ${venueName}.

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.price ? `Exclusive Use Price: ${venueData.price}` : 'Price: (not provided)'}
${venueData?.totalRooms ? `Rooms: ${venueData.totalRooms}` : ''}
${venueData?.capacity ? `Capacity: ${venueData.capacity} guests` : ''}

IMPORTANT: If information is missing, do not invent details. Use only what's provided above.

Write 2–3 sentences that:
- Capture the intimacy and exclusivity of hiring the entire estate
- Convey what makes the experience uniquely private and special
- Speak directly to luxury couples ("your guests", "your day")
- Use editorial tone — no marketing clichés, no exclamation marks

RETURN ONLY THE DESCRIPTION TEXT. No explanation, no labels.`;
};

/**
 * Build prompt for Featured Amenities generation
 */
export const buildAmenitiesPrompt = (venueName, venueData) => {
  return `Generate a list of featured amenities and highlights for ${venueName}, a luxury wedding venue.

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Venue Style: ${venueData.style}` : 'Venue Style: (not provided)'}
${venueData?.capacity ? `Capacity: ${venueData.capacity} guests` : 'Capacity: (not provided)'}

IMPORTANT: If information is missing, do not invent details. Only include what can be reasonably inferred from the venue type, style, and location provided.

Return a comma-separated list of 10–16 specific, evocative amenity phrases (e.g. "Private chapel, Helicopter landing pad, 40-room estate, Michelin-star catering, Bridal suite with lake views, On-site coordinator, Dedicated parking").

Each item should be:
- 2–5 words, title-case
- Specific and distinctive (avoid generic phrases like "great views" or "beautiful gardens")
- Relevant to luxury wedding experiences

RETURN ONLY THE COMMA-SEPARATED LIST. No numbering, no explanation.`;
};

/**
 * Build prompt for Address Lookup from business name + URL
 */
export const buildAddressLookupPrompt = (venueName, websiteUrl) => {
  return `Look up the address for the business "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "address": "Street address line 1",
  "address_line2": "Second line if any, otherwise empty string",
  "city": "City or town name",
  "postcode": "Postcode or ZIP code",
  "country": "One of: italy, france, spain, greece, portugal, uk, us, caribbean — or empty string",
  "region": "Region, county, or area name — or empty string"
}

IMPORTANT: Only include information you are certain about. Use empty string "" for any field you are unsure about. Never invent or guess an address.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation.`;
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  LUXURY_TONE_SYSTEM,
  SEO_SYSTEM,
  ALT_TEXT_SYSTEM,
  FAQ_SYSTEM,
  buildAboutPrompt,
  buildSeoTitlePrompt,
  buildSeoDescriptionPrompt,
  buildSeoKeywordsPrompt,
  buildAltTextPrompt,
  buildImageCaptionPrompt,
  buildFaqPrompt,
  buildCeremonyDescriptionPrompt,
  buildDiningDescriptionPrompt,
  buildRoomsDescriptionPrompt,
  buildPricingDescriptionPrompt,
  buildAmenitiesPrompt,
  buildExclusiveUsePrompt,
  buildAddressLookupPrompt,
};
