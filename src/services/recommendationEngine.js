/**
 * recommendationEngine.js
 *
 * Aura recommendation engine for blending articles, venues, and profiles.
 * Phase 2: Article discovery and surfacing in chat recommendations.
 *
 * Integrates:
 *   - articleSearchService: article discovery and ranking
 *   - magazineService: database access layer
 */

import {
  indexArticlesByContent,
  searchArticlesFullText,
  getArticleRecommendations,
  getArticlePreview,
  getRelatedArticles,
  ARTICLE_TOPICS,
} from './articleSearchService';

import { fetchPublishedArticles, searchArticlesFullText as dbSearchArticles } from './magazineService';

/**
 * Get article recommendations for a given user intent.
 *
 * Intent object:
 *   - articleCategory?: string — e.g. 'photography', 'planning', 'style'
 *   - tags?: string[] — user-specified article interests
 *   - query?: string — free-text search query
 *   - maxResults?: number — max articles to return (default 5)
 *
 * Returns: { articles: [...], error: null } | { articles: [], error }
 */
export async function getArticleRecommendationsForIntent(intent = {}) {
  try {
    const { query, articleCategory, tags, maxResults = 5 } = intent;

    // Step 1: Fetch published articles from database
    let fetchFilters = {};
    if (articleCategory) {
      fetchFilters.category_slug = articleCategory;
    }
    if (tags && Array.isArray(tags)) {
      fetchFilters.tags = tags;
    }

    const { data: published, error: fetchErr } = await fetchPublishedArticles(fetchFilters);
    if (fetchErr) {
      console.error('[recommendationEngine] fetchPublishedArticles failed:', fetchErr);
      return { articles: [], error: fetchErr };
    }

    if (!published || published.length === 0) {
      return { articles: [], error: null };
    }

    // Step 2: Index articles for scoring
    const indexed = indexArticlesByContent(published);

    // Step 3: Filter by search query if provided
    let candidates = indexed;
    if (query && query.trim()) {
      candidates = indexed.filter(article => {
        const normalizedQuery = query.toLowerCase();
        return (
          article.title?.toLowerCase().includes(normalizedQuery) ||
          article.excerpt?.toLowerCase().includes(normalizedQuery) ||
          (Array.isArray(article.keywords) && article.keywords.some(k => k.includes(normalizedQuery)))
        );
      });
    }

    // Step 4: Score and rank
    const recommendations = getArticleRecommendations(candidates, intent, {
      maxResults,
      minScore: 30,
      sortBy: 'relevance',
    });

    // Step 5: Format for display
    const formatted = recommendations.map(article => getArticlePreview(article));

    return { articles: formatted, error: null };
  } catch (err) {
    console.error('[recommendationEngine] getArticleRecommendationsForIntent:', err);
    return { articles: [], error: err };
  }
}

/**
 * Search articles by keyword across title, excerpt, tags.
 * Used for direct search queries in chat.
 *
 * @param {string} query — search terms
 * @param {Object} options
 *   - limit?: number — max results (default 10)
 *   - category?: string — filter by category slug
 *
 * Returns: { articles: [...], error: null } | { articles: [], error }
 */
export async function searchArticles(query = '', options = {}) {
  try {
    const { limit = 10, category } = options;

    // Step 1: Fetch published articles
    let filters = { limit: 100 };
    if (category) {
      filters.category_slug = category;
    }

    const { data: published, error: fetchErr } = await fetchPublishedArticles(filters);
    if (fetchErr) {
      console.error('[recommendationEngine] searchArticles fetch failed:', fetchErr);
      return { articles: [], error: fetchErr };
    }

    // Step 2: Full-text search via service
    const indexed = indexArticlesByContent(published);
    const results = searchArticlesFullText(indexed, query);

    // Step 3: Format for display
    const formatted = results.slice(0, limit).map(article => getArticlePreview(article));

    return { articles: formatted, error: null };
  } catch (err) {
    console.error('[recommendationEngine] searchArticles:', err);
    return { articles: [], error: err };
  }
}

/**
 * Get articles related to a specific venue or profile.
 *
 * Relations:
 *   - Same category (e.g. venues → destination articles)
 *   - Overlapping tags (e.g. "rustic" venue → "rustic style" articles)
 *
 * @param {Object} context — the item to find related articles for
 *   - categorySlug?: string — category of the venue/profile
 *   - tags?: string[] — tags on the venue/profile
 *   - name?: string — name for relevance scoring
 *
 * @param {Object} options
 *   - maxResults?: number — max articles (default 3)
 *
 * Returns: { articles: [...], error: null } | { articles: [], error }
 */
export async function getRelatedArticlesForContext(context = {}, options = {}) {
  try {
    const { categorySlug, tags = [], name } = context;
    const { maxResults = 3 } = options;

    // Step 1: Fetch published articles
    let filters = { limit: 200 };
    if (categorySlug) {
      filters.category_slug = categorySlug;
    }

    const { data: published, error: fetchErr } = await fetchPublishedArticles(filters);
    if (fetchErr) {
      console.error('[recommendationEngine] getRelatedArticlesForContext fetch failed:', fetchErr);
      return { articles: [], error: fetchErr };
    }

    // Step 2: Build intent from context
    const intent = {
      articleCategory: categorySlug,
      tags: tags && Array.isArray(tags) ? tags : [],
    };

    // Step 3: Score and rank
    const indexed = indexArticlesByContent(published);
    const recommendations = getArticleRecommendations(indexed, intent, {
      maxResults,
      minScore: 20, // Lower threshold for related articles
      sortBy: 'featured', // Featured first, then recent
    });

    // Step 4: Format for display
    const formatted = recommendations.map(article => getArticlePreview(article));

    return { articles: formatted, error: null };
  } catch (err) {
    console.error('[recommendationEngine] getRelatedArticlesForContext:', err);
    return { articles: [], error: err };
  }
}

/**
 * Detect user intent from search query for article discovery.
 *
 * Maps keywords to ARTICLE_TOPICS categories:
 *   photographer → photography
 *   plan/timeline/guide → planning
 *   aesthetic/theme/design → style
 *   spa/yoga/relax → wellness
 *   trend/modern/2025 → trends
 *   destination names → destinations
 *   vendor types → vendors
 *   real/couple/story → realweddings
 *
 * @param {string} query — user search query
 * @returns {Object} { articleCategory?, tags?, confidence }
 */
export function detectArticleIntent(query = '') {
  if (!query || !query.trim()) {
    return { confidence: 0 };
  }

  const normalized = query.toLowerCase();
  const matches = {};

  // Match query terms against article topics
  for (const [topic, keywords] of Object.entries(ARTICLE_TOPICS)) {
    const matchCount = keywords.filter(kw => normalized.includes(kw)).length;
    if (matchCount > 0) {
      matches[topic] = matchCount;
    }
  }

  if (Object.keys(matches).length === 0) {
    return { confidence: 0 };
  }

  // Return the best matching topic
  const [topCategory, confidence] = Object.entries(matches).sort((a, b) => b[1] - a[1])[0];

  return {
    articleCategory: topCategory,
    confidence: Math.min(confidence / 5, 1), // Normalize to 0-1 range
    query,
  };
}

export default {
  getArticleRecommendationsForIntent,
  searchArticles,
  getRelatedArticlesForContext,
  detectArticleIntent,
};
