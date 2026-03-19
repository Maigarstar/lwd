// reviewThemeService.js
// Canonical theme extraction + Aura-ready queries
// Mirrors the SQL function extract_review_themes() for client-side use

import { supabase } from '../lib/supabaseClient';

// ── Canonical 11-theme taxonomy ───────────────────────────────────────────────
export const THEMES = {
  service: {
    label: 'Service',
    keywords: ['team', 'coordination', 'concierge', 'professional', 'attentive', 'handled', 'seamless', 'flawless'],
  },
  food: {
    label: 'Food & Dining',
    keywords: ['cuisine', 'chef', 'dining', 'restaurant', 'catering', 'meal', 'menu', 'taste', 'culinary'],
  },
  privacy: {
    label: 'Privacy',
    keywords: ['private', 'secluded', 'exclusive', 'buyout', 'intimate', 'no strangers', 'just us'],
  },
  views: {
    label: 'Setting & Views',
    keywords: ['views', 'scenery', 'landscape', 'ocean', 'beach', 'jungle', 'waterfront', 'sunrise', 'sunset', 'nature'],
  },
  staff: {
    label: 'Staff',
    keywords: ['staff', 'hospitality', 'helpful', 'warmth', 'personal'],
  },
  planning: {
    label: 'Planning',
    keywords: ['planning', 'organised', 'organized', 'detail', 'logistics', 'every detail', 'nothing was missed'],
  },
  rooms: {
    label: 'Accommodation',
    keywords: ['villa', 'suite', 'accommodation', 'overwater', 'beachfront', 'hideaway'],
  },
  exclusivity: {
    label: 'Exclusivity',
    keywords: ['island buyout', 'exclusive use', 'entire venue', 'sole use', 'private island', 'complete privacy'],
  },
  ceremony: {
    label: 'Ceremony',
    keywords: ['ceremony', 'vows', 'aisle', 'chapel', 'altar', 'officiant', 'blessing'],
  },
  destination: {
    label: 'Destination',
    keywords: ['destination', 'travel', 'journey', 'remote', 'international', 'cambodia', 'tuscany', 'france'],
  },
  value: {
    label: 'Value',
    keywords: ['worth it', 'value', 'exceeded expectations', 'investment', 'price', 'pricing'],
  },
};

// ── Client-side theme extraction ──────────────────────────────────────────────
/**
 * Extract themes from review text using the canonical keyword rules.
 * Returns array of matched theme keys e.g. ['service', 'privacy', 'views']
 * Mirrors extract_review_themes() SQL function.
 *
 * @param {string} text
 * @returns {string[]}
 */
export function extractThemesFromText(text) {
  if (!text || typeof text !== 'string') return [];
  const lower = text.toLowerCase();
  const matched = [];

  for (const [themeKey, theme] of Object.entries(THEMES)) {
    const hits = theme.keywords.some(kw => lower.includes(kw));
    if (hits) matched.push(themeKey);
  }

  return matched;
}

// ── Sentiment from rating ─────────────────────────────────────────────────────
/**
 * @param {number} rating
 * @returns {string}
 */
function getSentimentFromRating(rating) {
  const r = parseFloat(rating) || 0;
  if (r >= 4.8) return 'exceptional';
  if (r >= 4.0) return 'very-positive';
  if (r >= 3.5) return 'positive';
  if (r >= 3.0) return 'mixed';
  return 'needs-improvement';
}

// ── Key phrase extraction ─────────────────────────────────────────────────────
const KEY_PHRASE_PATTERNS = [
  { pattern: /island buyout/i,            phrase: 'island buyout' },
  { pattern: /private beach/i,            phrase: 'private beach ceremony' },
  { pattern: /chef.*personally.*walked|personally walked/i, phrase: 'chef personally walked us' },
  { pattern: /overwater/i,                phrase: 'overwater villas' },
  { pattern: /sunrise/i,                  phrase: 'sunrise ceremony' },
  { pattern: /sunset/i,                   phrase: 'sunset ceremony' },
  { pattern: /jungle/i,                   phrase: 'jungle setting' },
  { pattern: /complete privacy|no strangers/i, phrase: 'complete privacy' },
  { pattern: /seamless/i,                 phrase: 'seamless coordination' },
  { pattern: /exceeded/i,                 phrase: 'exceeded expectations' },
];

function extractKeyPhrases(text) {
  if (!text) return [];
  const found = [];
  for (const { pattern, phrase } of KEY_PHRASE_PATTERNS) {
    if (pattern.test(text)) found.push(phrase);
  }
  return found;
}

// ── Full aura_metadata object ─────────────────────────────────────────────────
/**
 * Build the full aura_metadata object for a review.
 *
 * @param {string} reviewText
 * @param {number} rating
 * @returns {{ themes: string[], sentiment: string, key_phrases: string[], word_count: number }}
 */
export function extractAuraMetadata(reviewText, rating) {
  const themes = extractThemesFromText(reviewText);
  const sentiment = getSentimentFromRating(rating);
  const key_phrases = extractKeyPhrases(reviewText);
  const word_count = reviewText
    ? reviewText.trim().replace(/\s+/g, ' ').split(' ').length
    : 0;

  return { themes, sentiment, key_phrases, word_count };
}

// ── Per-venue theme aggregation ───────────────────────────────────────────────
/**
 * Fetch all approved reviews for a venue and aggregate theme frequencies.
 *
 * @param {string} entityId - listing UUID
 * @returns {Promise<object>} e.g. { service: { count: 4, pct: 80 }, privacy: { count: 3, pct: 60 }, ... }
 */
export async function getVenueThemeSummary(entityId) {
  if (!entityId) return {};

  const { data, error } = await supabase
    .from('reviews')
    .select('themes, overall_rating')
    .eq('entity_id', entityId)
    .eq('entity_type', 'venue')
    .eq('moderation_status', 'approved');

  if (error) {
    console.error('[reviewThemeService] getVenueThemeSummary error:', error);
    return {};
  }

  const reviews = data || [];
  const total = reviews.length;
  if (total === 0) return {};

  // Build counts for each canonical theme
  const counts = {};
  for (const themeKey of Object.keys(THEMES)) {
    counts[themeKey] = 0;
  }

  for (const review of reviews) {
    const reviewThemes = review.themes || [];
    for (const t of reviewThemes) {
      if (counts[t] !== undefined) {
        counts[t]++;
      }
    }
  }

  // Build summary with count + pct
  const summary = {};
  for (const [themeKey, count] of Object.entries(counts)) {
    if (count > 0) {
      summary[themeKey] = {
        count,
        pct: Math.round((count / total) * 100),
        label: THEMES[themeKey]?.label || themeKey,
      };
    }
  }

  return summary;
}

// ── Cross-venue theme query ───────────────────────────────────────────────────
/**
 * Find listings where approved reviews mention ALL requested themes.
 * Used by Aura: "show me venues with strong reviews about privacy and food"
 *
 * @param {string[]} themes - Array of theme keys to match e.g. ['privacy', 'food']
 * @returns {Promise<Array<{ listingId: string, venueName: string, slug: string, themeMatches: string[], avgRating: number }>>}
 */
export async function getVenuesByTheme(themes) {
  if (!themes || themes.length === 0) return [];

  // Query reviews that have any of the requested themes
  const { data: reviewRows, error } = await supabase
    .from('reviews')
    .select('entity_id, themes, overall_rating')
    .eq('entity_type', 'venue')
    .eq('moderation_status', 'approved')
    .contains('themes', themes.slice(0, 1)); // start with first theme for index use

  if (error) {
    console.error('[reviewThemeService] getVenuesByTheme error:', error);
    return [];
  }

  const rows = reviewRows || [];

  // Group by entity_id
  const byVenue = {};
  for (const row of rows) {
    if (!byVenue[row.entity_id]) {
      byVenue[row.entity_id] = { ratings: [], themeUnion: new Set() };
    }
    byVenue[row.entity_id].ratings.push(row.overall_rating || 0);
    for (const t of (row.themes || [])) {
      byVenue[row.entity_id].themeUnion.add(t);
    }
  }

  // Filter: only venues where ALL requested themes appear across reviews
  const matchingIds = Object.entries(byVenue)
    .filter(([, val]) => themes.every(t => val.themeUnion.has(t)))
    .map(([id]) => id);

  if (matchingIds.length === 0) return [];

  // Fetch listing names + slugs
  const { data: listings, error: listErr } = await supabase
    .from('listings')
    .select('id, name, slug')
    .in('id', matchingIds);

  if (listErr) {
    console.error('[reviewThemeService] listing lookup error:', listErr);
    return [];
  }

  return (listings || []).map(l => {
    const venueData = byVenue[l.id];
    const ratings = venueData?.ratings || [];
    const avgRating = ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;
    return {
      listingId: l.id,
      venueName: l.name,
      slug: l.slug,
      themeMatches: themes.filter(t => venueData?.themeUnion.has(t)),
      avgRating,
    };
  });
}

// ── Save themes to DB ─────────────────────────────────────────────────────────
/**
 * Update themes + aura_metadata on a review row.
 * Called from admin approval flow as fallback (trigger handles it automatically).
 *
 * @param {string} reviewId
 * @param {string} text
 * @param {number} rating
 * @returns {Promise<object>}
 */
export async function saveReviewThemes(reviewId, text, rating) {
  const themes = extractThemesFromText(text);
  const aura_metadata = extractAuraMetadata(text, rating);

  const { data, error } = await supabase
    .from('reviews')
    .update({ themes, aura_metadata })
    .eq('id', reviewId)
    .select('id, themes, aura_metadata')
    .single();

  if (error) {
    console.error('[reviewThemeService] saveReviewThemes error:', error);
    throw error;
  }

  return data;
}
