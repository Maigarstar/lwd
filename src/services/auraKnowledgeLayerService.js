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
    // Parallel fetch: listings, venue_content, reviews
    const [listingRes, contentRes, reviewsRes] = await Promise.all([
      supabase
        .from('listings')
        .select('*')
        .eq('id', venueId)
        .single(),
      supabase
        .from('venue_content')
        .select('*')
        .eq('venue_id', venueId)
        .single(),
      supabase
        .from('reviews')
        .select('rating, content, created_at')
        .eq('listing_id', venueId)
        .is('deleted_at', null) // Exclude soft-deleted reviews
        .order('created_at', { ascending: false })
    ]);

    // Build knowledge layer structure
    return {
      venue: listingRes.data ? {
        id: listingRes.data.id,
        name: listingRes.data.name,
        location: listingRes.data.location,
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
          rating: r.rating,
          content: r.content,
          createdAt: r.created_at,
        })),
        averageRating: reviewsRes.data.length > 0
          ? (reviewsRes.data.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewsRes.data.length).toFixed(1)
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
