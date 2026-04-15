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

// Address lookup is structured data extraction, NOT copywriting. Using
// SEO_SYSTEM as the system prompt makes the model add prose, markdown
// fences, or apologetic disclaimers around the JSON, which breaks the
// downstream JSON.parse silently. This prompt forces strict JSON-only output.
export const ADDRESS_LOOKUP_SYSTEM = `You are a structured-data extraction tool, not a copywriter.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- Use empty string "" for any field you are not certain about. Never invent or guess.
- Numeric coordinates may be returned as strings or numbers; the consumer accepts both.
- If you cannot find the business with confidence, return the JSON object with empty strings for every field.`;

// Pricing lookup is also structured data extraction. Same strict JSON-only
// contract — no copywriting, no caveats, no markdown.
export const PRICING_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches public wedding-venue pricing information. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no disclaimers about pricing accuracy, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- Use empty string "" or 0 for any field you are not certain about. Never invent or guess prices.
- Numeric fields (price_from, capacity) must be plain integers without currency symbols, commas, or units.
- price_currency is a single character: £, $, €, etc.
- price_range is the symbolic price-band ("€", "€€", "€€€", "€€€€") that best matches the absolute price_from.
- If the venue cannot be confidently identified or has no public pricing, return the JSON object with empty/zero values for every field.`;

export const ROOMS_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches publicly available accommodation information for wedding venues. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- Use empty string "" or 0 for any field you are not certain about. Never invent or guess room counts.
- Numeric fields must be plain integers (no commas, no units, no words).
- accommodation_type must be one of the allowed values from the user prompt — empty string if unknown.
- exclusive_use must be a boolean true or false. Default to false unless the venue explicitly markets exclusive-use weddings.
- showcase_intro must be a single short editorial sentence (under 300 characters) suitable for a luxury magazine page intro. If the venue has no public accommodation, return "" — do not invent.
- If the venue cannot be confidently identified or has no public accommodation information, return the JSON object with empty/zero/false values for every field.`;

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
- Use editorial tone, no marketing clichés, no exclamation marks

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
 * Returns: address, city, postcode, country, region, lat, lng
 */
export const buildAddressLookupPrompt = (venueName, websiteUrl) => {
  return `Look up the complete address and coordinates for the business "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "address": "Street address line 1",
  "address_line2": "Second line if any, otherwise empty string",
  "city": "City or town name",
  "postcode": "Postcode or ZIP code",
  "country": "One of: italy, france, spain, greece, portugal, england, scotland, wales, us, caribbean, or empty string",
  "region": "Region, county, or area name, or empty string",
  "lat": "Latitude as a decimal number (e.g. 51.9261745), or empty string",
  "lng": "Longitude as a decimal number (e.g. -0.1550093), or empty string"
}

IMPORTANT: Only include information you are certain about. Use empty string "" for any field you are unsure about. For coordinates, provide decimal format only. Never invent or guess an address.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation.`;
};

/**
 * Build prompt for Pricing Lookup from business name + URL + optional location.
 * Returns: price_from (integer), price_currency (1 char), price_range (€-bands),
 * capacity (integer guest count).
 */
export const buildPricingLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up public wedding-venue pricing and guest capacity for the business "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "price_from": 12000,
  "price_currency": "£",
  "price_range": "€€€",
  "capacity": 150
}

Field rules:
- price_from: lowest published wedding-package or venue-hire price as a plain integer (no commas, no currency symbol). Use 0 if not publicly available.
- price_currency: single symbol matching the venue's home currency — "£" for UK, "€" for EU, "$" for US, etc. Empty string if unknown.
- price_range: symbolic band that best matches price_from. Use "€" (under 5,000), "€€" (5,000–15,000), "€€€" (15,000–40,000), or "€€€€" (40,000+). Empty string if unknown.
- capacity: maximum seated guest capacity as a plain integer. Use 0 if not published.

IMPORTANT: Use 0 or "" for any field you cannot confirm from public sources. NEVER invent or estimate pricing — wedding venues sue over inaccurate price quotes. If you cannot find published pricing for this venue, return zeros and empty strings.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation, no disclaimers.`;
};

/**
 * Build prompt for Rooms / Accommodation Lookup from business name + URL + optional location.
 * Returns: accommodation_type (one of the allowed strings), rooms_total, rooms_suites,
 * rooms_max_guests, rooms_min_stay (integers), exclusive_use (boolean), showcase_intro
 * (short editorial sentence for the showcase page rooms intro).
 */
export const buildRoomsLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up public accommodation information for the wedding venue "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "accommodation_type": "Historic Villa",
  "rooms_total": 18,
  "rooms_suites": 6,
  "rooms_max_guests": 40,
  "rooms_min_stay": 2,
  "exclusive_use": true,
  "showcase_intro": "Eighteen restored rooms and six suites set within centuries-old walls — the entire estate yours for a single weekend."
}

Field rules:
- accommodation_type: MUST be one of exactly these values (or "" if unknown): "Historic Villa", "Boutique Hotel", "Castle", "Resort", "Manor House", "Country Estate".
- rooms_total: total number of guest rooms (suites included) as a plain integer. Use 0 if not published.
- rooms_suites: number of suites as a plain integer. Use 0 if not published.
- rooms_max_guests: maximum overnight guest capacity as a plain integer. Use 0 if not published.
- rooms_min_stay: minimum night stay required for wedding bookings as a plain integer. Use 0 if not published.
- exclusive_use: boolean true if the venue offers full exclusive-use buyouts for weddings, false otherwise.
- showcase_intro: ONE short editorial sentence (under 300 characters) describing the accommodation experience in luxury-magazine tone, suitable for the rooms section intro on the showcase page. Use "" if there is no public accommodation information.

IMPORTANT: Use 0, "" or false for any field you cannot confirm from public sources. NEVER invent room counts or capacity numbers — venues complain about inaccurate listings. If you cannot find published accommodation information for this venue, return zeros and empty strings.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation, no disclaimers.`;
};

/**
 * Build prompt for Section Intro generation (Overview, Event Spaces, Dining, etc.)
 */
export const buildSectionIntroPrompt = (sectionKey, label, venueName, venueData) => {
  const sectionGuidance = {
    overview: 'A compelling introduction to the venue itself—its character, heritage, and what makes it special.',
    spaces: 'Describe the variety and sophistication of event spaces available for ceremonies, receptions, and celebrations.',
    dining: 'Highlight the culinary experience, chef expertise, and dining options available.',
    rooms: 'Introduce the guest accommodation experience and what makes staying overnight special.',
    art: 'Describe any art collections, cultural heritage, or curated design elements at the venue.',
    weddings: 'Capture what makes a wedding at this venue uniquely memorable and special.'
  };

  return `Generate a refined editorial introduction for the "${label}" section at ${venueName}.

VENUE INFORMATION:
${venueName ? `Venue: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Venue Style: ${venueData.style}` : 'Venue Style: (not provided)'}
${venueData?.description ? `About: ${venueData.description.substring(0, 200)}` : ''}

SECTION GUIDANCE:
${sectionGuidance[sectionKey] || 'Create an engaging introduction to this section.'}

IMPORTANT: If information is missing, do not invent facts. Use only the details provided above.

Write 2–3 sentences that:
- Introduce the section naturally
- Capture the luxury and exclusivity of this aspect
- Use sophisticated editorial tone
- Appeal directly to luxury couples
- Avoid clichés and marketing language

Maximum 300 characters.

RETURN ONLY THE INTRODUCTION TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Listing Name generation
 */
export const buildListingNamePrompt = (venueData) => {
  return `Generate an elegant, evocative name for a luxury wedding venue.

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.destination ? `Destination: ${venueData.destination}` : 'Destination: (not provided)'}
${venueData?.style ? `Style: ${venueData.style}` : 'Style: (not provided)'}

IMPORTANT: If information is missing, do not invent details. Use only what's provided above.

The name should:
- Be elegant and memorable
- Reflect the venue's character and location
- Be suitable for a luxury wedding directory
- Be 2-5 words maximum
- Sound exclusive and refined

RETURN ONLY THE VENUE NAME. No explanation, no commentary.`;
};

/**
 * Build prompt for Hero Tagline generation
 */
export const buildHeroTaglinePrompt = (venueData) => {
  return `Generate a short, elegant tagline for a luxury wedding venue.

VENUE INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Style: ${venueData.style}` : 'Style: (not provided)'}
${venueData?.description ? `Details: ${venueData.description.substring(0, 150)}` : ''}

IMPORTANT: If information is missing, do not invent facts. Use only what's provided.

The tagline should:
- Be 1-2 sentences maximum
- Be under 12 words
- Capture the essence and luxury of the venue
- Sound editorial and refined
- Appeal to high-end couples

RETURN ONLY THE TAGLINE. No explanation, no commentary.`;
};

/**
 * Build prompt for Card Title generation (Venue, Vendor, or GCard)
 */
export const buildCardTitlePrompt = (cardType, venueName, venueData) => {
  const cardTypeGuidance = {
    venue: 'a luxury wedding venue card',
    vendor: 'a luxury wedding vendor card',
    gcard: 'a luxury wedding listing card'
  };

  return `Generate a compelling headline for ${cardTypeGuidance[cardType] || 'a luxury wedding listing card'}.

VENUE/VENDOR INFORMATION:
${venueName ? `Name: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Style/Type: ${venueData.style}` : 'Style: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent or assume facts.

The title should:
- Be 5-15 words
- Be elegant and evocative
- Highlight what makes this unique
- Appeal to luxury couples
- Fit naturally on a card

RETURN ONLY THE TITLE. No explanation, no commentary.`;
};

/**
 * Build prompt for Card Short Description generation
 */
export const buildCardDescriptionPrompt = (cardType, venueName, venueData) => {
  return `Generate a compelling short description for a luxury wedding listing card.

VENUE INFORMATION:
${venueName ? `Name: ${venueName}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Style: ${venueData.style}` : 'Style: (not provided)'}
${venueData?.highlights?.length > 0 ? `Key Features: ${venueData.highlights.join(', ')}` : 'Key Features: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The description should:
- Be 2-3 sentences maximum
- Be under 160 characters
- Capture the essence and appeal
- Use sophisticated, editorial language
- Make couples want to learn more

RETURN ONLY THE DESCRIPTION. No explanation, no commentary.`;
};

/**
 * Build prompt for Contact Profile Bio generation
 */
export const buildContactBioPrompt = (contactName, venueData) => {
  return `Generate a brief, professional bio for a luxury venue contact/manager.

CONTACT & VENUE INFORMATION:
${contactName ? `Contact: ${contactName}` : 'Contact: (name not provided)'}
${venueData?.venue_name ? `Venue: ${venueData.venue_name}` : 'Venue: (not provided)'}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.style ? `Venue Style: ${venueData.style}` : 'Venue Style: (not provided)'}

IMPORTANT: Do not invent details or credentials. Use only what's provided.

The bio should:
- Be 2-3 sentences maximum
- Be professional and approachable
- Highlight their role in creating memorable weddings
- Convey expertise and care
- Sound warm and personal

RETURN ONLY THE BIO TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Event Title generation
 */
export const buildEventTitlePrompt = (venueData) => {
  return `Generate a compelling event title for a luxury wedding event.

EVENT INFORMATION:
${venueData?.venueName || venueData?.venue_name ? `Venue: ${venueData.venueName || venueData.venue_name}` : 'Venue: (not provided)'}
${venueData?.eventType ? `Event Type: ${venueData.eventType}` : 'Event Type: (not provided)'}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The title should:
- Be 4-8 words
- Be engaging and descriptive
- Highlight the venue and event type
- Appeal to luxury couples
- Example: "Open Day at Belmond Villa San Michele"

RETURN ONLY THE TITLE. No explanation, no commentary.`;
};

/**
 * Build prompt for Event Subtitle generation
 */
export const buildEventSubtitlePrompt = (venueData) => {
  return `Generate a catchy subtitle for a luxury wedding event.

EVENT INFORMATION:
${venueData?.title ? `Event: ${venueData.title}` : 'Event: (not provided)'}
${venueData?.eventType ? `Type: ${venueData.eventType}` : 'Type: (not provided)'}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The subtitle should:
- Be 1-2 sentences maximum
- Be under 12 words
- Explain the event purpose or invitation
- Sound elegant and exclusive
- Example: "An exclusive morning tour for invited couples"

RETURN ONLY THE SUBTITLE. No explanation, no commentary.`;
};

/**
 * Build prompt for Event Location Name generation
 */
export const buildLocationNamePrompt = (venueData) => {
  return `Generate or identify the location name for a luxury wedding event.

VENUE INFORMATION:
${venueData?.venueName || venueData?.venue_name ? `Venue: ${venueData.venueName || venueData.venue_name}` : 'Venue: (not provided)'}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.city ? `City: ${venueData.city}` : 'City: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The location name should:
- Be the venue name or a specific location identifier
- Be 2-5 words
- Be precise and recognizable
- Example: "Belmond Villa San Michele"

RETURN ONLY THE LOCATION NAME. No explanation, no commentary.`;
};

/**
 * Build prompt for Event Full Address generation
 */
export const buildFullAddressPrompt = (venueData) => {
  return `Generate or provide the full address for a luxury wedding event location.

VENUE INFORMATION:
${venueData?.venueName || venueData?.venue_name ? `Venue: ${venueData.venueName || venueData.venue_name}` : 'Venue: (not provided)'}
${venueData?.address ? `Address: ${venueData.address}` : 'Address: (not provided)'}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.city ? `City: ${venueData.city}` : 'City: (not provided)'}
${venueData?.country ? `Country: ${venueData.country}` : 'Country: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The address should:
- Be a complete, accurate postal address
- Include street, city, postal code, country
- Be formatted for international use
- Example: "Via Doccia, 4, 50014 Fiesole FI, Italy"

RETURN ONLY THE FULL ADDRESS. No explanation, no commentary.`;
};

/**
 * Build prompt for Nearest Airport generation
 */
export const buildNearestAirportPrompt = (venueData) => {
  return `Identify the nearest major airport for a luxury wedding event location.

LOCATION INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.city ? `City: ${venueData.city}` : 'City: (not provided)'}
${venueData?.country ? `Country: ${venueData.country}` : 'Country: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The airport should:
- Be the closest major international airport
- Include airport code if possible
- Be 2-4 words
- Example: "Florence Airport" or "Florence Peretola (FLR)"

RETURN ONLY THE AIRPORT NAME. No explanation, no commentary.`;
};

/**
 * Build prompt for Air Travel Time generation
 */
export const buildAirTravelTimePrompt = (venueData) => {
  return `Generate estimated travel time from the nearest airport to the event venue.

LOCATION & TRANSPORT INFORMATION:
${venueData?.nearestAirport ? `Airport: ${venueData.nearestAirport}` : 'Airport: (not provided)'}
${venueData?.location ? `Venue Location: ${venueData.location}` : 'Venue Location: (not provided)'}
${venueData?.city ? `City: ${venueData.city}` : 'City: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The travel time should:
- Be realistic and accurate
- Include the mode of transport (car, taxi)
- Be formatted as duration with mode
- Example: "approx. 1hr 15min by car"

RETURN ONLY THE TRAVEL TIME ESTIMATE. No explanation, no commentary.`;
};

/**
 * Build prompt for Nearest Train Station generation
 */
export const buildNearestTrainStationPrompt = (venueData) => {
  return `Identify the nearest major train station for a luxury wedding event location.

LOCATION INFORMATION:
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}
${venueData?.city ? `City: ${venueData.city}` : 'City: (not provided)'}
${venueData?.country ? `Country: ${venueData.country}` : 'Country: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The train station should:
- Be the closest major train station
- Be a primary transit hub if possible
- Be 2-3 words
- Example: "Pisa Centrale" or "Florence Santa Maria Novella"

RETURN ONLY THE TRAIN STATION NAME. No explanation, no commentary.`;
};

/**
 * Build prompt for Train Travel Time generation
 */
export const buildTrainTravelTimePrompt = (venueData) => {
  return `Generate estimated train travel time to the event venue.

LOCATION & TRANSPORT INFORMATION:
${venueData?.nearestTrainStation ? `Train Station: ${venueData.nearestTrainStation}` : 'Train Station: (not provided)'}
${venueData?.location ? `Venue Location: ${venueData.location}` : 'Venue Location: (not provided)'}
${venueData?.city ? `City: ${venueData.city}` : 'City: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The travel time should:
- Be realistic and accurate
- Include direct/connecting information if known
- Be formatted as duration with origin
- Example: "45 min direct from Florence"

RETURN ONLY THE TRAVEL TIME ESTIMATE. No explanation, no commentary.`;
};

/**
 * Build prompt for Transport Notes generation
 */
export const buildTransportNotesPrompt = (venueData) => {
  return `Generate helpful transport and logistics notes for guests attending a luxury wedding event.

VENUE & LOCATION INFORMATION:
${venueData?.venueName || venueData?.venue_name ? `Venue: ${venueData.venueName || venueData.venue_name}` : 'Venue: (not provided)'}
${venueData?.nearestAirport ? `Nearest Airport: ${venueData.nearestAirport}` : ''}
${venueData?.nearestTrainStation ? `Nearest Train: ${venueData.nearestTrainStation}` : ''}
${venueData?.location ? `Location: ${venueData.location}` : 'Location: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The notes should:
- Be concise but informative
- Cover transfer, car rental, and taxi options
- Be formatted as a series of short points or sentences
- Appeal to luxury guests
- Example: "Private transfers available · Car hire recommended · Taxi access from city center"

RETURN ONLY THE TRANSPORT NOTES. No explanation, no commentary.`;
};

/**
 * Build prompt for Category Meta Description generation
 */
export const buildCategoryMetaDescriptionPrompt = (categoryData) => {
  return `Generate an SEO-optimized meta description for a category on the Luxury Wedding Directory.

CATEGORY INFORMATION:
${categoryData?.name ? `Category: ${categoryData.name}` : 'Category: (not provided)'}
${categoryData?.description ? `Description: ${categoryData.description}` : 'Description: (not provided)'}
${categoryData?.count ? `Listings: ${categoryData.count} professionals` : ''}

IMPORTANT: Use only the information provided. Do not invent facts.

The meta description should:
- Be exactly 150-160 characters (optimal for search results)
- Include the category name naturally
- Include key benefits and value proposition
- Be compelling to click from search results
- Emphasize luxury, curation, and expertise
- Example: "Discover the finest photographers for luxury destination weddings. Curated professionals across 62 countries on the Luxury Wedding Directory."

RETURN ONLY THE META DESCRIPTION. No explanation, no commentary.`;
};

/**
 * Build prompt for Category OG Title generation
 */
export const buildCategoryOgTitlePrompt = (categoryData) => {
  return `Generate a compelling Open Graph title for sharing on social media.

CATEGORY INFORMATION:
${categoryData?.name ? `Category: ${categoryData.name}` : 'Category: (not provided)'}
${categoryData?.description ? `Description: ${categoryData.description}` : 'Description: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The OG title should:
- Be under 60 characters
- Be engaging and shareable
- Highlight the luxury and exclusivity
- Work well as a social media preview
- Example: "Luxury Wedding Photographers | Worldwide"

RETURN ONLY THE OG TITLE. No explanation, no commentary.`;
};

/**
 * Build prompt for Category OG Description generation
 */
export const buildCategoryOgDescriptionPrompt = (categoryData) => {
  return `Generate a compelling Open Graph description for social media sharing.

CATEGORY INFORMATION:
${categoryData?.name ? `Category: ${categoryData.name}` : 'Category: (not provided)'}
${categoryData?.description ? `Description: ${categoryData.description}` : 'Description: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent facts.

The OG description should:
- Be 2-3 sentences maximum
- Be engaging and appealing for social sharing
- Highlight what makes this category special
- Include a call to action (explore, discover, browse)
- Example: "Browse the world's finest luxury wedding photographers. Handpicked professionals creating timeless memories for exceptional weddings."

RETURN ONLY THE OG DESCRIPTION. No explanation, no commentary.`;
};

/**
 * Build prompt for Category H1 / Main Heading generation
 */
export const buildCategoryH1Prompt = (categoryData) => {
  return `Generate a compelling H1 heading for a luxury category page.

CATEGORY INFORMATION:
${categoryData?.name ? `Category: ${categoryData.name}` : 'Category: (not provided)'}
${categoryData?.description ? `Description: ${categoryData.description}` : 'Description: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The H1 should:
- Be 1-2 sentences
- Be elegant and editorial in tone
- Emphasize luxury, expertise, and curation
- Appeal directly to luxury couples
- Example: "The World's Finest Wedding Photographers"

RETURN ONLY THE H1. No explanation, no commentary.`;
};

/**
 * Build prompt for Category Page Content / Intro generation
 */
export const buildCategoryPageContentPrompt = (categoryData) => {
  return `Generate an engaging introductory paragraph for a luxury category page.

CATEGORY INFORMATION:
${categoryData?.name ? `Category: ${categoryData.name}` : 'Category: (not provided)'}
${categoryData?.description ? `Description: ${categoryData.description}` : 'Description: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent facts.

The content should:
- Be 2-3 paragraphs maximum
- Be written in luxury editorial tone
- Explain why this category matters for weddings
- Highlight curation and global reach
- Include subtle SEO keywords naturally
- Appeal to high-end couples planning destination weddings

RETURN ONLY THE PAGE CONTENT. No explanation, no commentary.`;
};

/**
 * Build prompt for Category Studio Browse Section Title generation
 */
export const buildCategoryBrowseSectionTitlePrompt = (categoryData) => {
  return `Generate a compelling section title for a category browse section.

CATEGORY INFORMATION:
${categoryData?.name ? `Category: ${categoryData.name}` : 'Category: (not provided)'}
${categoryData?.description ? `Description: ${categoryData.description}` : 'Description: (not provided)'}

IMPORTANT: Use only the information provided. Do not invent details.

The section title should:
- Be 2-4 words maximum
- Be action-oriented and engaging
- Invite users to explore the category
- Use active verbs when possible
- Be elegant and editorial in tone
- Appeal to luxury couples
- Examples: "Discover Our Photographers", "Browse Wedding Venues", "Explore Top Planners", "Meet Our Florists"

RETURN ONLY THE SECTION TITLE. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination Meta Description generation
 */
export const buildCountryMetaDescriptionPrompt = (countryName) => {
  return `Generate a compelling meta description for a luxury wedding destination page.

DESTINATION: ${countryName || 'destination (not provided)'}

The meta description should:
- Be 150-160 characters exactly
- Include primary keyword naturally ("${countryName} wedding" or similar)
- Highlight luxury, curation, selection
- Appeal to engaged couples
- Include call to action subtly
- Be specific, not generic
- Example: "Discover luxury wedding venues and vendors in ${countryName}. Handpicked for discerning couples. Explore the finest ${countryName} wedding professionals on Luxury Wedding Directory."

RETURN ONLY THE META DESCRIPTION. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination og:title generation
 */
export const buildCountryOgTitlePrompt = (countryName) => {
  return `Generate a compelling Open Graph title for social sharing.

DESTINATION: ${countryName || 'destination (not provided)'}

The og:title should:
- Be under 60 characters
- Lead with the country name
- Emphasize luxury and curation
- Be optimized for social sharing
- Appeal to engaged couples
- Example: "Luxury Wedding Venues in ${countryName} | LWD"

RETURN ONLY THE OG:TITLE. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination og:description generation
 */
export const buildCountryOgDescriptionPrompt = (countryName) => {
  return `Generate a compelling Open Graph description for social sharing.

DESTINATION: ${countryName || 'destination (not provided)'}

The og:description should:
- Be 2-3 sentences (under 160 characters total)
- Highlight the curated, luxury nature of the directory
- Appeal to engaged couples planning a destination wedding
- Be engaging and evocative
- Include ${countryName} naturally
- Example: "Discover ${countryName}'s most exceptional wedding venues and vendors. Curated by our editorial team for couples seeking unforgettable luxury weddings."

RETURN ONLY THE OG:DESCRIPTION. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination H1 heading generation
 */
export const buildCountryH1Prompt = (countryName) => {
  return `Generate a compelling H1 page heading for a luxury wedding destination.

DESTINATION: ${countryName || 'destination (not provided)'}

The H1 should:
- Be 3-8 words maximum
- Lead with the destination name
- Emphasize luxury, weddings, or destination appeal
- Be elegant and editorial
- Appeal to engaged couples
- Examples: "Luxury Weddings in ${countryName}", "Destination Wedding Venues in ${countryName}", "Wedding in ${countryName}: Curated Excellence"

RETURN ONLY THE H1 HEADING. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination page content (HTML source) generation
 */
export const buildCountryPageContentPrompt = (countryName) => {
  return `Generate compelling HTML page content for a luxury wedding destination.

DESTINATION: ${countryName || 'destination (not provided)'}

Create structured HTML with:
- 1-2 <h2> headings about the destination
- 2-3 <p> paragraphs describing ${countryName} as a wedding destination
- Emphasis on luxury, beauty, cultural richness
- Appeal to high-end couples
- References to "Luxury Wedding Directory" and curation
- Natural SEO keywords (${countryName} wedding, luxury weddings, destination wedding)

Be specific to ${countryName}. Do not invent facts.

RETURN ONLY THE HTML. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination intro text generation
 */
export const buildCountryIntroTextPrompt = (countryName) => {
  return `Generate a compelling 2-4 sentence editorial intro for a luxury wedding destination.

DESTINATION: ${countryName || 'destination (not provided)'}

The intro should:
- Be 2-4 sentences maximum
- Highlight the luxury and beauty of ${countryName}
- Emphasize the curated selection on Luxury Wedding Directory
- Appeal to engaged couples
- Be editorial and evocative
- Set context for the venue/vendor listings below

RETURN ONLY THE INTRO TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Country/Destination body HTML generation
 */
export const buildCountryBodyHtmlPrompt = (countryName) => {
  return `Generate compelling rich HTML body content for a luxury wedding destination page.

DESTINATION: ${countryName || 'destination (not provided)'}

Create editorial HTML with:
- 1-2 <h2> headings (e.g., "Why Choose ${countryName}?", "Luxury Weddings in ${countryName}")
- 3-4 <p> paragraphs describing ${countryName} as a wedding destination
- Emphasis on luxury, beauty, cultural heritage, sophistication
- Specific details about ${countryName} (history, landscapes, cuisine, culture)
- References to the Luxury Wedding Directory's curation and editorial standards
- Natural integration of keywords like "destination wedding", "luxury wedding", "wedding venues"
- Appeal to discerning couples planning destination weddings

Be authentic and specific to ${countryName}. Do not invent facts.

RETURN ONLY THE HTML. No explanation, no commentary.`;
};

/**
 * Build prompt for Location Editorial Eyebrow generation
 */
export const buildLocationEditorialEyebrowPrompt = (locationName) => {
  return `Generate a short, elegant eyebrow/subheading for a luxury location page editorial section.

LOCATION: ${locationName || 'location (not provided)'}

Write a single line (max 10 words) that:
- Sets the tone for the editorial section
- Captures the essence or highlight of this location
- Uses sophisticated, editorial language
- Appeals to luxury couples
- Works well as an eyebrow above a main heading

IMPORTANT: Do not invent facts about the location. Use only general knowledge about the destination.

RETURN ONLY THE EYEBROW TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Location Editorial Heading Prefix generation
 */
export const buildLocationHeadingPrefixPrompt = (locationName) => {
  return `Generate a short prefix word or phrase for a location's editorial section main heading.

LOCATION: ${locationName || 'location (not provided)'}

Create a 1-3 word prefix (e.g., "Discover", "Experience", "The Romance of") that:
- Precedes the location name as the main heading
- Sets an elegant, editorial tone
- Captures why couples should explore this destination
- Is natural and not clichéd

IMPORTANT: Do not invent facts. Use only general knowledge about the destination.

RETURN ONLY THE PREFIX. No explanation, no commentary.`;
};

/**
 * Build prompt for Location Editorial CTA Text generation
 */
export const buildLocationEditorialCtaPrompt = (locationName) => {
  return `Generate compelling call-to-action text for a location's editorial section.

LOCATION: ${locationName || 'location (not provided)'}

Write a single sentence (max 15 words) that:
- Encourages couples to explore venues in this location
- Conveys luxury and exclusivity
- Is action-oriented but sophisticated
- Speaks directly to luxury couples planning their wedding

IMPORTANT: Do not invent facts about the location. Use only general knowledge.

RETURN ONLY THE CTA TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Location Editorial Info Block generation
 */
export const buildLocationInfoBlockPrompt = (locationName) => {
  return `Generate a short luxury editorial description for a location info block.

LOCATION: ${locationName || 'location (not provided)'}

Write 1-2 sentences (max 100 characters) that:
- Highlight a unique aspect, cultural feature, or benefit of this location
- Use sophisticated, editorial language
- Appeal to luxury couples
- Be evocative without being clichéd

IMPORTANT: Do not invent facts about the location. Use only general knowledge about the destination.

Examples of aspects to focus on: culture, cuisine, scenery, history, romance, access, experiences.

RETURN ONLY THE INFO BLOCK TEXT. No explanation, no commentary.`;
};

/**
 * Build prompt for Location Latest Vendors Heading generation
 */
export const buildLocationLatestVendorsHeadingPrompt = (locationName) => {
  return `Generate a heading for the "Latest Vendors" section on a location page.

LOCATION: ${locationName || 'location (not provided)'}

Write a single heading (max 8 words) that:
- Introduces vendors/suppliers recently featured in this location
- Uses sophisticated, editorial language
- Encourages couples to explore vendor options
- Is elegant and professional

Examples: "Curated Vendors in [Location]", "Luxury Partners in [Location]", "Featured Specialists in [Location]"

RETURN ONLY THE HEADING. No explanation, no commentary.`;
};

/**
 * Build prompt for Location Latest Vendors Subtext generation
 */
export const buildLocationLatestVendorsSubPrompt = (locationName) => {
  return `Generate subtext for the "Latest Vendors" section on a location page.

LOCATION: ${locationName || 'location (not provided)'}

Write a single sentence (max 15 words) that:
- Explains the purpose or benefit of the featured vendors section
- Encourages couples to explore
- Uses sophisticated, editorial language
- Is warm and inviting

IMPORTANT: Do not invent facts about vendors. Focus on the value of seeing featured specialists.

RETURN ONLY THE SUBTEXT. No explanation, no commentary.`;
};

// ═══════════════════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════════════════

export default {
  LUXURY_TONE_SYSTEM,
  SEO_SYSTEM,
  ADDRESS_LOOKUP_SYSTEM,
  PRICING_LOOKUP_SYSTEM,
  ROOMS_LOOKUP_SYSTEM,
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
  buildPricingLookupPrompt,
  buildRoomsLookupPrompt,
  buildSectionIntroPrompt,
  buildListingNamePrompt,
  buildHeroTaglinePrompt,
  buildCardTitlePrompt,
  buildCardDescriptionPrompt,
  buildContactBioPrompt,
  buildEventTitlePrompt,
  buildEventSubtitlePrompt,
  buildLocationNamePrompt,
  buildFullAddressPrompt,
  buildNearestAirportPrompt,
  buildAirTravelTimePrompt,
  buildNearestTrainStationPrompt,
  buildTrainTravelTimePrompt,
  buildTransportNotesPrompt,
  buildCategoryMetaDescriptionPrompt,
  buildCategoryOgTitlePrompt,
  buildCategoryOgDescriptionPrompt,
  buildCategoryH1Prompt,
  buildCategoryPageContentPrompt,
  buildCategoryBrowseSectionTitlePrompt,
  buildCountryMetaDescriptionPrompt,
  buildCountryOgTitlePrompt,
  buildCountryOgDescriptionPrompt,
  buildCountryH1Prompt,
  buildCountryPageContentPrompt,
  buildCountryIntroTextPrompt,
  buildCountryBodyHtmlPrompt,
  buildLocationEditorialEyebrowPrompt,
  buildLocationHeadingPrefixPrompt,
  buildLocationEditorialCtaPrompt,
  buildLocationInfoBlockPrompt,
  buildLocationLatestVendorsHeadingPrompt,
  buildLocationLatestVendorsSubPrompt,
};
