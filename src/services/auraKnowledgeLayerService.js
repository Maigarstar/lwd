// auraKnowledgeLayerService.js
// Aura AI Knowledge Layer - Integrates listings, venue_content, and reviews
// Provides unified data structure for AI-powered venue summaries and insights
//
// This service connects three data sources:
// 1. listings - Core venue information (name, location, capacity, style)
// 2. venue_content - Editorial metadata (section intros, visibility, approval status, content score)
// 3. reviews - Guest feedback and ratings (for sentiment analysis, themes, strengths)
//
// Usage:
//   const knowledge = await fetchVenueKnowledgeLayer(venueId);
//   const summary = generateVenueSummary(knowledge);
//   const highlights = extractVenueHighlights(knowledge);
//   const themes = analyzeReviewThemes(knowledge);

import { supabase } from '../lib/supabaseClient';
import { getQualityTier, QUALITY_TIERS, transformListingForCard } from './listings';

/**
 * Fetch complete knowledge layer for a venue
 * Combines: listings + venue_content + reviews + related data
 * Returns unified structure ready for Aura AI consumption
 */
export async function fetchVenueKnowledgeLayer(venueId) {
  if (!venueId) {
    console.warn('fetchVenueKnowledgeLayer: venueId is required');
    return null;
  }

  try {
    // Parallel fetch: listings and reviews
    // Note: venue_content table not queried as all needed data is in listings table
    const [listingRes, reviewsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('id', venueId)
        .single(),
      supabase
        .from('reviews')
        .select('overall_rating, review_text, created_at')
        .eq('entity_id', venueId)
        .eq('entity_type', 'listing')
        .order('created_at', { ascending: false })
    ]);

    // Check for query errors - log them but don't fail
    if (listingRes.error) {
      console.error(`[fetchVenueKnowledgeLayer] Listing query error for ${venueId}:`, {
        code: listingRes.error.code,
        message: listingRes.error.message,
        details: listingRes.error.details
      });
      // Continue with null data - will build empty knowledge object below
    }

    if (reviewsRes.error) {
      // Don't return null - reviews are optional, continue with empty reviews
    }

    // contentRes is no longer needed since all data comes from listings
    const contentRes = { data: null, error: null };

    // Build knowledge layer structure
    return {
      venue: listingRes.data ? {
        id: listingRes.data.id,
        name: listingRes.data.name,
        city: listingRes.data.city,
        region: listingRes.data.region,
        country: listingRes.data.country,
        style: listingRes.data.style,
        capacity: listingRes.data.capacity,
        onSiteCoordinator: listingRes.data.on_site_coordinator,
        catering: listingRes.data.catering,
        chef: listingRes.data.chef,
        accommodations: listingRes.data.accommodations,
        description: listingRes.data.about,
        highlights: listingRes.data.highlights,
      } : null,

      content: {
        id: contentRes.data?.id || null,
        // Phase 3: Read editorial fields from listings table (source of truth)
        // Fallback to venue_content for backward compatibility
        heroSummary: listingRes.data?.hero_summary || '',
        sectionIntros: listingRes.data?.section_intros || contentRes.data?.section_intros || {},
        sectionVisibility: contentRes.data?.section_visibility || {},
        editorial_approved: listingRes.data?.editorial_approved ?? contentRes.data?.approved ?? false,
        editorial_fact_checked: listingRes.data?.editorial_fact_checked ?? contentRes.data?.fact_checked ?? false,
        contentQualityScore: listingRes.data?.content_quality_score ?? contentRes.data?.content_score ?? 0,
        lastReviewedAt: listingRes.data?.editorial_last_reviewed_at || contentRes.data?.last_reviewed_at,
        refreshNotes: listingRes.data?.refresh_notes || null,
        updatedBy: contentRes.data?.updated_by || null,
        // Keep old field names for backward compatibility
        approved: listingRes.data?.editorial_approved ?? contentRes.data?.approved ?? false,
        factChecked: listingRes.data?.editorial_fact_checked ?? contentRes.data?.fact_checked ?? false,
        contentScore: listingRes.data?.content_quality_score ?? contentRes.data?.content_score ?? 0,
      },

      reviews: reviewsRes.data ? {
        total: reviewsRes.data.length,
        items: reviewsRes.data.map(r => ({
          rating: r.overall_rating,
          content: r.review_text,
          createdAt: r.created_at,
        })),
        averageRating: reviewsRes.data.length > 0
          ? (reviewsRes.data.reduce((sum, r) => sum + (r.overall_rating || 0), 0) / reviewsRes.data.length).toFixed(1)
          : null,
        ratingDistribution: calculateRatingDistribution(reviewsRes.data),
      } : {
        total: 0,
        items: [],
        averageRating: null,
        ratingDistribution: {},
      },

      // Metadata for AI consumption
      metadata: {
        fetchedAt: new Date().toISOString(),
        contentQualityLevel: getContentQualityLevel(
          listingRes.data?.content_quality_score ?? contentRes.data?.content_score
        ),
        isApprovedEditorial: listingRes.data?.editorial_approved ?? contentRes.data?.approved ?? false,
        hasCompleteSectionIntros: Object.values(listingRes.data?.section_intros || contentRes.data?.section_intros || {}).filter(
          intro => intro && typeof intro === 'string' && intro.trim().length > 0
        ).length >= 4, // At least 4 sections have intros
      },
    };
  } catch (err) {
    console.error('fetchVenueKnowledgeLayer exception:', err);
    return null;
  }
}

/**
 * Fetch venue knowledge layer by slug instead of ID
 * Useful for public-facing pages that use slug routing
 */
export async function fetchVenueKnowledgeLayerBySlug(slug) {
  if (!slug) return null;

  try {
    // First fetch listing by slug to get ID
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id')
      .eq('slug', slug)
      .single();

    if (listingError || !listing) {
      console.error('fetchVenueKnowledgeLayerBySlug: listing not found for slug', slug);
      return null;
    }

    // Now fetch full knowledge layer using ID
    return fetchVenueKnowledgeLayer(listing.id);
  } catch (err) {
    console.error('fetchVenueKnowledgeLayerBySlug exception:', err);
    return null;
  }
}

/**
 * Calculate content quality level for easier UI/AI consumption
 * Returns: 'low', 'medium', 'high', 'premium'
 */
function getContentQualityLevel(contentData) {
  if (!contentData) return 'low';

  const score = contentData.content_score || 0;

  if (score >= 90) return 'premium'; // Fully filled + fact-checked + approved
  if (score >= 70) return 'high';     // Mostly filled + some approvals
  if (score >= 40) return 'medium';   // Some content present
  return 'low';                        // Minimal content
}

/**
 * Calculate distribution of ratings from reviews
 * Returns counts for 1-5 star ratings
 */
function calculateRatingDistribution(reviews) {
  const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.forEach(review => {
    if (review.rating && review.rating >= 1 && review.rating <= 5) {
      dist[review.rating]++;
    }
  });

  return dist;
}

/**
 * Generate venue summary from knowledge layer
 * Used for search results, cards, and Aura AI insights
 */
export function generateVenueSummary(knowledge) {
  if (!knowledge || !knowledge.venue) return null;

  const { venue, content, reviews } = knowledge;

  // Prefer approved section intro, fall back to listing description
  const summaryText =
    content.approved && content.sectionIntros.overview
      ? content.sectionIntros.overview
      : venue.description;

  return {
    name: venue.name,
    location: venue.location,
    summary: summaryText,
    contentApproved: content.approved,
    contentScore: content.contentScore,
    averageRating: reviews.averageRating,
    reviewCount: reviews.total,
  };
}

/**
 * Extract key venue highlights and strengths
 * Combines listing highlights with review themes
 */
export function extractVenueHighlights(knowledge) {
  if (!knowledge) return [];

  const { venue, reviews, content } = knowledge;
  const highlights = [];

  // Add listing highlights
  if (venue.highlights && Array.isArray(venue.highlights)) {
    highlights.push(...venue.highlights);
  }

  // Add content-driven highlights based on section intros
  if (content.approved) {
    if (content.sectionIntros.spaces) highlights.push('Distinctive Spaces');
    if (content.sectionIntros.dining) highlights.push('Culinary Excellence');
    if (content.sectionIntros.rooms) highlights.push('Luxury Accommodations');
    if (content.sectionIntros.art) highlights.push('Curated Art Collection');
    if (content.sectionIntros.golf) highlights.push('Championship Golf');
    if (content.sectionIntros.weddings) highlights.push('Bespoke Ceremonies');
  }

  // Add review-driven highlights (top themes)
  const themes = extractReviewThemes(reviews.items);
  if (themes.service) highlights.push('Exceptional Service');
  if (themes.venue) highlights.push('Stunning Venue');
  if (themes.food) highlights.push('Outstanding Cuisine');

  // Deduplicate and return
  return [...new Set(highlights)].slice(0, 6);
}

/**
 * Extract themes from review content using simple keyword matching
 * Returns object with theme counts
 */
function extractReviewThemes(reviews) {
  const themes = {
    service: 0,
    venue: 0,
    food: 0,
    location: 0,
    team: 0,
    garden: 0,
    staff: 0,
  };

  const serviceKeywords = ['service', 'staff', 'team', 'helpful', 'professional', 'attentive', 'coordination'];
  const venueKeywords = ['venue', 'beautiful', 'stunning', 'elegant', 'space', 'setting', 'landscape'];
  const foodKeywords = ['food', 'cuisine', 'meal', 'dinner', 'catering', 'chef', 'taste'];
  const locationKeywords = ['location', 'access', 'parking', 'drive', 'convenient', 'journey'];
  const gardenKeywords = ['garden', 'park', 'landscape', 'grounds', 'nature', 'flowers'];

  reviews.forEach(review => {
    const text = (review.content || '').toLowerCase();

    if (serviceKeywords.some(k => text.includes(k))) themes.service++;
    if (venueKeywords.some(k => text.includes(k))) themes.venue++;
    if (foodKeywords.some(k => text.includes(k))) themes.food++;
    if (locationKeywords.some(k => text.includes(k))) themes.location++;
    if (gardenKeywords.some(k => text.includes(k))) themes.garden++;
  });

  return themes;
}

/**
 * Analyze reviews for common themes and sentiment
 * Returns structured data for Aura AI analysis
 */
export function analyzeReviewThemes(knowledge) {
  if (!knowledge || !knowledge.reviews) return null;

  const { reviews } = knowledge;
  const themes = extractReviewThemes(reviews.items);

  // Sort themes by frequency
  const sortedThemes = Object.entries(themes)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  return {
    topThemes: sortedThemes.map(([theme, count]) => ({
      theme,
      mentions: count,
      percentage: reviews.total > 0 ? Math.round((count / reviews.total) * 100) : 0,
    })),
    sentimentOverview: getSentimentOverview(reviews),
    commonPraise: extractCommonPraise(reviews.items),
  };
}

/**
 * Determine overall sentiment from rating distribution
 */
function getSentimentOverview(reviews) {
  if (reviews.total === 0) return 'no-reviews';

  const avg = parseFloat(reviews.averageRating);
  if (avg >= 4.5) return 'exceptional';
  if (avg >= 4.0) return 'very-positive';
  if (avg >= 3.5) return 'positive';
  if (avg >= 3.0) return 'mixed';
  return 'needs-improvement';
}

/**
 * Extract commonly praised aspects from reviews
 */
function extractCommonPraise(reviews) {
  const praisePhrases = [];
  const keywords = ['amazing', 'wonderful', 'beautiful', 'excellent', 'fantastic', 'loved', 'perfect', 'incredible'];

  reviews.slice(0, 10).forEach(review => { // Sample first 10 reviews
    const text = review.content || '';
    keywords.forEach(keyword => {
      if (text.toLowerCase().includes(keyword)) {
        praisePhrases.push(keyword);
      }
    });
  });

  // Get top 3 most common
  return [...new Set(praisePhrases)].slice(0, 3);
}

/**
 * Check if venue has all critical content filled
 * Useful for determining if editorial is "complete"
 */
export function isVenueContentComplete(knowledge) {
  if (!knowledge || !knowledge.content) return false;

  const { content } = knowledge;
  const requiredSections = ['overview', 'spaces', 'dining', 'rooms', 'weddings'];
  const filledSections = Object.entries(content.sectionIntros)
    .filter(([key, value]) => requiredSections.includes(key) && value && typeof value === 'string' && value.trim().length > 0);

  return {
    isComplete: filledSections.length === requiredSections.length,
    filledSections: filledSections.length,
    totalRequired: requiredSections.length,
    missingFields: requiredSections.filter(
      section => !content.sectionIntros[section] || content.sectionIntros[section].trim().length === 0
    ),
  };
}

/**
 * Get Aura AI prompt context from knowledge layer
 * Formats all data for use in AI prompts
 */
export function buildAuraPromptContext(knowledge) {
  if (!knowledge || !knowledge.venue) return '';

  const { venue, content, reviews } = knowledge;
  const highlights = extractVenueHighlights(knowledge);
  const themes = analyzeReviewThemes(knowledge);

  return `
VENUE CORE INFORMATION:
- Name: ${venue.name}
- Location: ${venue.location}
- Country: ${venue.country}
- Style: ${venue.style}
- Capacity: ${venue.capacity} guests
- On-Site Coordinator: ${venue.onSiteCoordinator ? 'Yes' : 'No'}

EDITORIAL CONTENT:
- Content Approved: ${content.approved ? 'Yes' : 'No'}
- Content Score: ${content.contentScore}/100
- Fact-Checked: ${content.factChecked ? 'Yes' : 'No'}
- Overview: ${content.sectionIntros.overview || 'Not provided'}
- Spaces: ${content.sectionIntros.spaces || 'Not provided'}
- Dining: ${content.sectionIntros.dining || 'Not provided'}
- Rooms: ${content.sectionIntros.rooms || 'Not provided'}

GUEST REVIEWS:
- Average Rating: ${reviews.averageRating}/5 (${reviews.total} reviews)
- Rating Distribution: ${JSON.stringify(reviews.ratingDistribution)}
- Top Themes: ${themes?.topThemes.map(t => t.theme).join(', ') || 'None'}
- Common Praise: ${themes?.commonPraise.join(', ') || 'None'}

KEY HIGHLIGHTS:
${highlights.map(h => `- ${h}`).join('\n')}

VENUE DESCRIPTION:
${venue.description || 'No description available'}
`;
}

// ─────────────────────────────────────────────────────────────────────────────
// PHASE 4c: AURA RECOMMENDATION PRIORITIZATION
// Ranks venues by quality tier, approval status, and guest ratings for discovery
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate recommendation score for Aura discovery ranking
 * Combines: quality tier (0-40), approval status (0-30), freshness (0-20), reviews (0-10)
 * Returns 0-100 score for use in venue ranking
 *
 * Scoring breakdown:
 * - Quality tier: Platinum=40, Signature=30, Approved=20, Standard=0
 * - Approval status: Approved=30 pts (10 pts per week freshness bonus, capped at 30)
 * - Freshness: 0-20 pts (recently reviewed venues score higher)
 * - Guest ratings: 0-10 pts (based on average rating)
 */
export function calculateRecommendationScore(venue, knowledge) {
  let score = 0;

  // 1. Quality tier (0-40 points)
  const tier = getQualityTier(venue.content_quality_score || 0);
  const tierScores = {
    platinum: 40,
    signature: 30,
    approved: 20,
    standard: 0
  };
  score += tierScores[tier] || 0;

  // 2. Approval status (0-30 points)
  if (venue.editorial_approved) {
    score += 30;

    // Freshness bonus: Recently reviewed venues score higher
    if (venue.editorial_last_reviewed_at) {
      const daysSinceReview = Math.floor(
        (new Date() - new Date(venue.editorial_last_reviewed_at)) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceReview <= 30) {
        score += 10; // Very fresh (< 1 month)
      } else if (daysSinceReview <= 90) {
        score += 5;  // Recent (< 3 months)
      }
      // Beyond 90 days: no freshness bonus
    }
  }

  // 3. Guest ratings (0-10 points)
  if (knowledge && knowledge.reviews && knowledge.reviews.averageRating) {
    const avgRating = parseFloat(knowledge.reviews.averageRating) || 0;
    if (avgRating >= 4.5) {
      score += 10;
    } else if (avgRating >= 4.0) {
      score += 7;
    } else if (avgRating >= 3.5) {
      score += 5;
    } else if (avgRating >= 3.0) {
      score += 2;
    }
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Fetch and rank venues for Aura discovery with quality tier prioritization
 * Returns venues ordered by: tier (platinum first), then approval, then score
 *
 * @param {Object} options - Configuration options
 * @param {number} options.limit - Max venues to return (default: 12)
 * @param {number} options.minScore - Minimum content quality score (default: 0)
 * @param {string} options.sort - Sort strategy: 'tier' (default), 'rating', 'recent'
 * @param {boolean} options.includeNonEditorial - Include venues with editorial_enabled=false (default: true)
 * @returns {Array} Venues ranked for Aura discovery, with recommendation scores
 */
export async function fetchRankedVenuesForDiscovery(options = {}) {
  const {
    limit = 12,
    minScore = 0,
    sort = 'tier',
    includeNonEditorial = true
  } = options;

  try {
    let query = supabase
      .from('listings')
      .select('*')
      .limit(limit * 2); // Fetch extra to account for filtering

    const { data: listings, error } = await query;

    if (error) {
      console.error('[AURA] Query error:', error);
      return [];
    }

    if (!listings || listings.length === 0) {
      return [];
    }

    // ── Master pipeline: normalise raw DB rows to canonical card shape ──
    const normalised = listings.map(transformListingForCard);

    // Enrich with knowledge layers and calculate recommendation scores
    const rankedVenues = await Promise.all(
      normalised.map(async (venue) => {
        try {
          const knowledge = await fetchVenueKnowledgeLayer(venue.id);
          const recommendationScore = calculateRecommendationScore(venue, knowledge);
          const tier = getQualityTier(venue.content_quality_score || 0);

          // FALLBACK: If knowledge fetch failed, still return venue with basic data
          const knowledgeOrFallback = knowledge || {
            venue: {
              id: venue.id,
              name: venue.name,
              city: venue.city,
              region: venue.region,
              country: venue.country,
            },
            content: {
              contentQualityScore: venue.content_quality_score || 0,
              approved: false,
              factChecked: false,
              contentScore: venue.content_quality_score || 0,
            },
            reviews: {
              total: 0,
              items: [],
              averageRating: null,
              ratingDistribution: {},
            },
            metadata: {
              fetchedAt: new Date().toISOString(),
              contentQualityLevel: getContentQualityLevel(venue.content_quality_score),
              isApprovedEditorial: false,
              hasCompleteSectionIntros: false,
            }
          };

          const enrichedVenue = {
            ...venue,
            knowledge: knowledgeOrFallback,
            tier,
            recommendationScore,
            averageRating: knowledgeOrFallback?.reviews?.averageRating || 0,
            approved: venue.editorial_approved || false,
          };

          return enrichedVenue;
        } catch (err) {
          console.error(`[ENRICHMENT ERROR] venue ${venue.id}: ${err.message}`);

          // FALLBACK: Return minimal venue object on exception
          const fallbackVenue = {
            ...venue,
            knowledge: {
              venue: { id: venue.id, name: venue.name },
              content: { contentScore: 0, approved: false },
              reviews: { total: 0, items: [], averageRating: null },
              metadata: { fetchedAt: new Date().toISOString(), isApprovedEditorial: false }
            },
            tier: getQualityTier(venue.content_quality_score || 0),
            recommendationScore: calculateRecommendationScore(venue, null),
            averageRating: 0,
            approved: false,
          };

          return fallbackVenue;
        }
      })
    );

    // Filter out null entries and invalid knowledge (minScore filtering disabled for testing)
    let filtered = rankedVenues.filter(v => v && v.knowledge);

    // Sort based on strategy
    if (sort === 'tier') {
      // Primary: tier (platinum > signature > approved > standard)
      // Secondary: approval status
      // Tertiary: recommendation score
      const tierOrder = { platinum: 0, signature: 1, approved: 2, standard: 3 };
      filtered.sort((a, b) => {
        const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
        if (tierDiff !== 0) return tierDiff;

        const approveDiff = (b.approved ? 1 : 0) - (a.approved ? 1 : 0);
        if (approveDiff !== 0) return approveDiff;

        return b.recommendationScore - a.recommendationScore;
      });
    } else if (sort === 'rating') {
      // Sort by guest rating, then by tier
      filtered.sort((a, b) => {
        const ratingDiff = (b.averageRating || 0) - (a.averageRating || 0);
        if (ratingDiff !== 0) return ratingDiff;

        const tierOrder = { platinum: 0, signature: 1, approved: 2, standard: 3 };
        return tierOrder[a.tier] - tierOrder[b.tier];
      });
    } else if (sort === 'recent') {
      // Sort by freshness (recently reviewed first)
      filtered.sort((a, b) => {
        const aDate = a.editorial_last_reviewed_at ? new Date(a.editorial_last_reviewed_at) : new Date(0);
        const bDate = b.editorial_last_reviewed_at ? new Date(b.editorial_last_reviewed_at) : new Date(0);
        return bDate - aDate;
      });
    } else {
      // Default: by recommendation score
      filtered.sort((a, b) => b.recommendationScore - a.recommendationScore);
    }

    // Sort and slice to limit
    const final = filtered.slice(0, limit);
    return final;
  } catch (err) {
    console.error('fetchRankedVenuesForDiscovery exception:', err);
    return [];
  }
}

/**
 * Mark top N venues as "Aura Recommended" for the current session
 * This is used to show "Aura Recommended" badge on top-ranked venues
 * Called by AuraDiscoveryGrid after fetching recommendations
 *
 * @param {Array} venues - Venues returned from fetchRankedVenuesForDiscovery
 * @param {number} topN - Number of top venues to mark as recommended (default: 3)
 * @returns {Array} Venues with auraRecommended flag set on top N
 */
export function markAuraRecommendedVenues(venues, topN = 3) {
  return venues.map((venue, idx) => ({
    ...venue,
    auraRecommended: idx < topN
  }));
}
