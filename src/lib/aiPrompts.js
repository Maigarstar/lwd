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

export const DINING_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches publicly available dining and culinary information for wedding venues. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- Use empty string "" or empty array [] for any field you are not certain about. Never invent chef names, restaurant names or culinary credentials.
- Boolean fields default to false unless the venue explicitly markets that capability.
- Array fields (menu_styles, dietary, drinks) MUST only use the exact allowed values listed in the user prompt — drop anything that does not match.
- showcase_intro must be a single short editorial sentence (under 300 characters) suitable for a luxury magazine page intro. If the venue has no public dining information, return "" — do not invent.
- chef_name must be the actual chef's full name only — no titles, no awards, no restaurant prefix. Empty string if not publicly known.
- If the venue cannot be confidently identified or has no public dining information, return the JSON object with empty/false values for every field.`;

export const WEDDING_PACKAGES_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches publicly available wedding-package offerings for venues. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- The object must have a single top-level key "packages" whose value is an array of at most 5 wedding-package objects.
- All numeric fields (duration_days, price_from, min_guests, max_guests, dining_capacity, accommodation_capacity) must be plain integers — no commas, currency symbols, units or words. Use 0 for any number you cannot confirm.
- price_currency is a single character: £, $, €, etc. Empty string if unknown.
- season MUST be one of "winter", "summer", "year-round", or "" (empty when unknown / not seasonal).
- exclusive_use is a boolean — true only if the venue clearly markets the package as exclusive-use / whole-venue buyout.
- inclusions is an array of short string labels (e.g. "Golf", "Shooting", "Hot Tubs", "Dance til Dawn"). Empty array if no public list. Do NOT invent activities.
- description is one short sentence (under 240 characters) summarising the package. Empty string if no public summary.
- NEVER invent prices, durations, guest counts, accommodation capacity or inclusion lists — venues take inaccurate package quotes very seriously.
- If the venue cannot be confidently identified or has no public package information, return { "packages": [] }.`;

export const CATERING_CARDS_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches publicly available catering and dining-service information for wedding venues. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- The object must have a single top-level key "cards" whose value is an array of at most 3 catering-feature card objects.
- Each card's "icon" MUST be one of the exact allowed values listed in the user prompt — drop the entry if you cannot match.
- title is short (under 60 characters), description is 1–2 sentences (under 300 characters), subtext is optional and under 100 characters.
- Use empty string "" for any field you cannot confirm from public sources.
- Never invent chef credentials, supplier names, corkage fees or service claims.
- If the venue has no public catering / dining-service information, return { "cards": [] }.`;

export const SPACES_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches publicly available event-space information for wedding venues. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- The object must have a single top-level key "spaces" whose value is an array of space objects (return at most 5 spaces — the venue's most prominent ceremony / reception / dining areas).
- Each space object's "type" MUST be one of the exact allowed values listed in the user prompt — drop the entry or use "Other" if you cannot match.
- Numeric capacity fields must be plain integers (no commas, no units, no words). Use 0 for any capacity that is not publicly stated — never invent numbers.
- Boolean fields (indoor, covered, accessible) default to null when unknown — only set true/false when the venue clearly documents the attribute.
- description must be a single short evocative sentence (under 200 characters) suitable for a luxury listing card. Use "" if no public description exists — do not invent.
- showcase_intro must be a single short editorial sentence (under 300 characters) suitable for a luxury magazine page intro. If the venue has no public spaces information, return "" — do not invent.
- If the venue cannot be confidently identified or has no public event-space information, return { "spaces": [], "showcase_intro": "" }.`;

export const LISTING_INFO_LOOKUP_SYSTEM = `You are a structured-data extraction tool that researches publicly available business information for wedding venues. You are NOT a copywriter or sales agent.

Your only output is a single valid JSON object — nothing else. No prose, no markdown code fences, no explanation, no apology, no leading or trailing characters.

Rules:
- Return ONLY the JSON object literal, starting with { and ending with }.
- The object must contain the top-level keys: "contact_profile", "opening_hours", "press_features", "awards".
- contact_profile fields (name, title, bio, email, phone, whatsapp, website, social.{instagram,facebook,linkedin,tiktok,twitter,pinterest,youtube}) — use empty string "" for any field you cannot confirm. NEVER invent contact people, phone numbers, email addresses or social handles.
- opening_hours: an object with keys mon, tue, wed, thu, fri, sat, sun. Each day is { "type": "open"|"closed"|"by_appointment", "from": "HH:MM" (24h, half-hour increments), "to": "HH:MM" }. Times must be drawn from this fixed set: "06:00","06:30","07:00","07:30","08:00","08:30","09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30","13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30","18:00","18:30","19:00","19:30","20:00","20:30","21:00","21:30","22:00","22:30","23:00","23:30". If hours are unknown for a day, use { "type": "by_appointment", "from": "09:00", "to": "17:00" }. If a day is clearly closed, use { "type": "closed", "from": "09:00", "to": "17:00" }.
- press_features: an array of at most 6 objects, each with { "outlet": "", "year": 0, "title": "", "url": "" }. Only include features you can confirm from public sources. Empty array if unknown. NEVER invent press coverage.
- awards: an array of at most 8 objects, each with { "award": "", "year": 0, "issuer": "" }. Only include awards confirmed by public sources. Empty array if unknown. NEVER invent awards.
- All year fields must be plain integers (e.g., 2024). Use 0 if unknown.
- If the venue cannot be confidently identified or has no public listing information, return the JSON object with empty/closed/zero values throughout.`;

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
 * Build prompt for Wedding Packages Lookup from business name + URL + optional location.
 * Returns: packages[] array (each with name, duration_days, price_from, currency,
 * exclusive_use bool, season enum, min/max guests, dining + accommodation
 * capacity integers, description sentence, inclusions[] of short labels).
 */
export const buildWeddingPackagesLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up the public wedding-package offerings for the venue "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "packages": [
    {
      "name": "House Weddings",
      "duration_days": 4,
      "exclusive_use": true,
      "price_from": 8889,
      "price_currency": "£",
      "season": "winter",
      "min_guests": 60,
      "max_guests": 144,
      "dining_capacity": 144,
      "accommodation_capacity": 95,
      "description": "1, 2, 3 or 4 day weddings with exclusive use of the main house.",
      "inclusions": ["Golf", "Shooting", "Fishing", "Hot Tubs", "Dance til Dawn"]
    },
    {
      "name": "Estate Weddings",
      "duration_days": 4,
      "exclusive_use": true,
      "price_from": 0,
      "price_currency": "£",
      "season": "year-round",
      "min_guests": 120,
      "max_guests": 250,
      "dining_capacity": 250,
      "accommodation_capacity": 165,
      "description": "Bespoke multi-day weddings across the entire 500-acre parkland estate.",
      "inclusions": ["Golf", "Shooting", "Fishing", "Hot Tubs", "Dance til Dawn"]
    }
  ]
}

Field rules:
- packages: array of at most 5 of the venue's most prominent wedding packages. Empty array if no public information.
- name: the venue's actual marketing name for the package (e.g. "House Weddings", "Estate Buyout", "Winter Elopement"). Empty string if generic / unnamed.
- duration_days: number of days the package covers as a plain integer (1, 2, 3, 4 etc.). Use 0 if not stated.
- exclusive_use: true ONLY if the venue clearly markets the package as exclusive-use / whole-venue buyout, otherwise false.
- price_from: lowest published price for this package as a plain integer (no currency symbol, no commas, no thousands separator). Use 0 if not publicly available.
- price_currency: single symbol — "£" for UK, "€" for EU, "$" for US, etc. Empty string if unknown.
- season: MUST be one of "winter", "summer", "year-round" or "" (empty if not seasonal or unknown).
- min_guests: minimum guest count required as a plain integer. Use 0 if no minimum stated.
- max_guests: maximum guest count permitted as a plain integer. Use 0 if not stated.
- dining_capacity: maximum seated dining capacity for this package as a plain integer. Use 0 if not stated.
- accommodation_capacity: maximum overnight guest capacity for this package as a plain integer. Use 0 if not stated.
- description: ONE short factual sentence (under 240 characters) summarising what the package covers. Empty string if no public summary.
- inclusions: array of short string labels of activities or facilities included in the package (e.g. ["Golf", "Shooting", "Fishing", "Hot Tubs", "Dance til Dawn"]). Empty array if no public list.

IMPORTANT: Use 0, "", false or [] for any field you cannot confirm from public sources. NEVER invent prices, durations, guest counts, accommodation capacity or inclusion lists — venues complain about inaccurate package quotes. If you cannot find published wedding-package information for this venue, return { "packages": [] }.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation, no disclaimers.`;
};

/**
 * Build prompt for Catering Cards Lookup from business name + URL + optional location.
 * Returns: cards[] array (each with icon from fixed list, title, description, subtext).
 * Used to pre-fill the "Catering & Dining cards" block in the listing editor.
 */
export const buildCateringCardsLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up the public catering and dining-service offering for the wedding venue "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "cards": [
    {
      "icon": "dining",
      "title": "In-house catering",
      "description": "Our resident kitchen brigade builds bespoke menus around estate-grown produce and seasonal market finds.",
      "subtext": ""
    },
    {
      "icon": "wine",
      "title": "Sommelier-led wine pairings",
      "description": "A curated cellar of more than 400 bins, with optional pairings designed alongside our head sommelier.",
      "subtext": "Corkage fee £25 per bottle"
    }
  ]
}

Field rules:
- cards: array of at most 3 catering / dining service highlights for this venue. Empty array if no public information.
- icon: MUST be one of exactly these values: "dining", "cooking", "wine", "truffle", "spa", "nature", "tour", "check". Pick the closest match. Default to "dining" if unsure.
- title: short label for the service (under 60 characters). Empty string if unknown.
- description: 1–2 sentences (under 300 characters) describing what the venue offers — only facts you can confirm from public sources.
- subtext: optional small note such as a corkage fee, supplier name or restriction (under 100 characters). Empty string if not publicly stated.

IMPORTANT: Use "" or [] for any field you cannot confirm from public sources. NEVER invent chef credentials, supplier partnerships, corkage fees or service claims — venues complain about inaccurate listings. If you cannot find published catering information for this venue, return { "cards": [] }.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation, no disclaimers.`;
};

/**
 * Build prompt for Venue Spaces Lookup from business name + URL + optional location.
 * Returns: spaces[] array (each with name, type from fixed list, description,
 * capacityCeremony/Reception/Dining/Standing integers, indoor/covered/accessible
 * booleans-or-null) plus showcase_intro for the spaces section header.
 */
export const buildSpacesLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up the public event-space layout for the wedding venue "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "spaces": [
    {
      "name": "The Grand Salon",
      "type": "Ballroom",
      "description": "A frescoed 18th-century ballroom anchored by a vaulted ceiling and original chandeliers.",
      "capacityCeremony": 180,
      "capacityReception": 220,
      "capacityDining": 160,
      "capacityStanding": 250,
      "indoor": true,
      "covered": true,
      "accessible": true
    },
    {
      "name": "Cypress Garden",
      "type": "Garden",
      "description": "A walled formal garden framed by century-old cypress alleys, ideal for outdoor ceremonies at golden hour.",
      "capacityCeremony": 120,
      "capacityReception": 0,
      "capacityDining": 80,
      "capacityStanding": 150,
      "indoor": false,
      "covered": false,
      "accessible": true
    }
  ],
  "showcase_intro": "Five distinct spaces — from a frescoed ballroom to a cypress-lined garden — let every couple shape the day on their own terms."
}

Field rules:
- spaces: array of at most 5 of the venue's most prominent event spaces. Empty array if no public information.
- name: the venue's actual name for the space (e.g. "The Orangery", "Sala degli Specchi"). Empty string only if it is referred to generically.
- type: MUST be one of exactly these values: "Ballroom", "Garden", "Terrace", "Private Dining Room", "Poolside Area", "Chapel / Ceremony Space", "Rooftop", "Courtyard", "Vineyard", "Barn / Rustic Hall", "Beach / Waterfront", "Library / Drawing Room", "Gallery Space", "Other". Use "Other" if no match.
- description: ONE short evocative sentence (under 200 characters). Empty string if no public description.
- capacityCeremony / capacityReception / capacityDining / capacityStanding: plain integers. Use 0 for any layout the venue does not publish.
- indoor: true if the space is fully indoors, false if outdoors, null if unknown / partial.
- covered: true if the space has a permanent roof or marquee cover, false if open-air, null if unknown.
- accessible: true if the venue documents step-free / wheelchair access, false if it explicitly does not, null if unknown.
- showcase_intro: ONE short editorial sentence (under 300 characters) describing the venue's overall event-space offering in luxury-magazine tone. Use "" if there is no public information.

IMPORTANT: Use 0, "", null or [] for any field you cannot confirm from public sources. NEVER invent capacities or attributes — venues complain about inaccurate listings. If you cannot find published space information for this venue, return { "spaces": [], "showcase_intro": "" }.
RETURN ONLY THE JSON OBJECT. No markdown, no code fences, no explanation, no disclaimers.`;
};

/**
 * Build prompt for Dining Lookup from business name + URL + optional location.
 * Returns: dining_style (free text), chef_name (free text), in_house_catering /
 * external_catering_allowed (booleans), menu_styles / dietary / drinks (arrays
 * constrained to the allowed values), showcase_intro (short editorial sentence).
 */
export const buildDiningLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up public dining and culinary information for the wedding venue "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "dining_style": "Michelin-inspired Tuscan farm-to-table",
  "chef_name": "Marco Ricci",
  "in_house_catering": true,
  "external_catering_allowed": false,
  "menu_styles": ["Plated Dinner", "Tasting Menu"],
  "dietary": ["Vegetarian", "Vegan", "Gluten Free"],
  "drinks": ["Wine Pairing", "Signature Cocktails"],
  "showcase_intro": "A seasonal kitchen led by a Michelin-trained chef, where every plate is built from estate-grown produce and the wine cellar runs four floors deep."
}

Field rules:
- dining_style: short free-text description of the culinary style (under 80 characters). Empty string if not public.
- chef_name: head chef's full name only — no honorifics, no restaurant prefix, no awards. Empty string if not publicly named.
- in_house_catering: true if the venue runs its own kitchen / has resident chef. Default false.
- external_catering_allowed: true if outside caterers are explicitly permitted. Default false.
- menu_styles: array — MUST only contain values from this fixed list: "Plated Dinner", "Tasting Menu", "Family Style", "Buffet", "Custom". Drop anything else. Empty array if unknown.
- dietary: array — MUST only contain values from this fixed list: "Vegetarian", "Vegan", "Halal", "Kosher", "Gluten Free", "Dairy Free". Drop anything else. Empty array if unknown.
- drinks: array — MUST only contain values from this fixed list: "Open Bar", "Wine Pairing", "Signature Cocktails", "Beer & Spirits", "Non-Alcoholic", "Soft Drinks Only". Drop anything else. Empty array if unknown.
- showcase_intro: ONE short editorial sentence (under 300 characters) describing the dining experience in luxury-magazine tone, suitable for the dining section intro on the showcase page. Use "" if there is no public dining information.

IMPORTANT: Use "", false, or [] for any field you cannot confirm from public sources. NEVER invent chef names, restaurant credentials or culinary claims — venues take this seriously and inaccurate claims cause complaints. If you cannot find published dining information for this venue, return empty values throughout.
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
 * Build prompt for Listing Info Lookup from business name + URL + optional location.
 * Returns: contact_profile, opening_hours (mon-sun), press_features (max 6), awards (max 8).
 */
export const buildListingInfoLookupPrompt = (venueName, websiteUrl, locationHint) => {
  return `Look up public listing information for the wedding venue "${venueName}"${websiteUrl ? ` (website: ${websiteUrl})` : ''}${locationHint ? ` located in ${locationHint}` : ''}.

Return ONLY a valid JSON object in this exact format:
{
  "contact_profile": {
    "name": "",
    "title": "",
    "bio": "",
    "email": "",
    "phone": "",
    "whatsapp": "",
    "website": "https://example.com",
    "social": {
      "instagram": "",
      "facebook": "",
      "linkedin": "",
      "tiktok": "",
      "twitter": "",
      "pinterest": "",
      "youtube": ""
    }
  },
  "opening_hours": {
    "mon": { "type": "open", "from": "09:00", "to": "17:00" },
    "tue": { "type": "open", "from": "09:00", "to": "17:00" },
    "wed": { "type": "open", "from": "09:00", "to": "17:00" },
    "thu": { "type": "open", "from": "09:00", "to": "17:00" },
    "fri": { "type": "open", "from": "09:00", "to": "17:00" },
    "sat": { "type": "by_appointment", "from": "10:00", "to": "16:00" },
    "sun": { "type": "closed", "from": "09:00", "to": "17:00" }
  },
  "press_features": [
    { "outlet": "Vogue", "year": 2024, "title": "Italy's Most Romantic Wedding Venues", "url": "https://example.com/article" }
  ],
  "awards": [
    { "award": "Best Destination Wedding Venue", "year": 2023, "issuer": "Condé Nast Traveller" }
  ]
}

Field rules:
- contact_profile.name / title / bio: ONLY include if a public-facing wedding contact, manager or sales lead is published on the venue website. Use "" if no named contact is published. NEVER invent a person.
- contact_profile.email / phone / whatsapp: ONLY include if explicitly published on the venue's public website or official directory listing. Use "" otherwise. NEVER invent contact details.
- contact_profile.website: the venue's official website URL if known, "" otherwise.
- contact_profile.social: object with seven keys (instagram, facebook, linkedin, tiktok, twitter, pinterest, youtube). Each value is the FULL public profile URL (e.g. "https://instagram.com/venue") or "" if unknown. NEVER invent handles.
- opening_hours: object with keys mon, tue, wed, thu, fri, sat, sun. Each day must be { "type": "open"|"closed"|"by_appointment", "from": "HH:MM", "to": "HH:MM" }. Times must be on the half hour from "06:00" to "23:30". If the venue does not publish opening hours for a day, use { "type": "by_appointment", "from": "09:00", "to": "17:00" }. If a day is clearly closed (e.g. weekends for an office), use { "type": "closed", ... }.
- press_features: array of at most 6 confirmed public press features. Each: { "outlet", "year" (integer), "title", "url" }. Empty array if no public press coverage exists. NEVER invent magazine names, article titles or URLs.
- awards: array of at most 8 confirmed public awards. Each: { "award", "year" (integer), "issuer" }. Empty array if no public awards exist. NEVER invent awards or industry recognition.

IMPORTANT: Use "", 0, [] or { "type": "by_appointment", "from": "09:00", "to": "17:00" } for any field you cannot confirm from public sources. NEVER invent contact people, phone numbers, email addresses, social handles, press features or awards — venues take this seriously and inaccurate listings cause complaints. If you cannot find published listing information for this venue, return empty values throughout.
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
  LISTING_INFO_LOOKUP_SYSTEM,
  DINING_LOOKUP_SYSTEM,
  SPACES_LOOKUP_SYSTEM,
  CATERING_CARDS_LOOKUP_SYSTEM,
  WEDDING_PACKAGES_LOOKUP_SYSTEM,
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
  buildListingInfoLookupPrompt,
  buildDiningLookupPrompt,
  buildSpacesLookupPrompt,
  buildCateringCardsLookupPrompt,
  buildWeddingPackagesLookupPrompt,
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
