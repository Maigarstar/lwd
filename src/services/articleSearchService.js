/**
 * articleSearchService.js
 *
 * Article discovery, indexing, and ranking for Aura integration.
 * Enables semantic magazine content surfacing in chat recommendations.
 */

/**
 * Index published articles for efficient lookup
 * Extracts keywords, topics, and metadata for ranking
 */
export function indexArticlesByContent(articles = []) {
  if (!Array.isArray(articles)) return [];

  return articles.map(article => ({
    ...article,
    // Extract keywords from title, excerpt, tags
    keywords: extractKeywords(article),
    // Calculate content strength
    contentScore: calculateContentScore(article),
  }));
}

/**
 * Extract relevant keywords and topics from article
 */
function extractKeywords(article) {
  const keywords = [];

  if (article.title) {
    keywords.push(...article.title.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  }

  if (article.excerpt) {
    keywords.push(...article.excerpt.toLowerCase().split(/\s+/).filter(w => w.length > 3));
  }

  if (Array.isArray(article.tags)) {
    keywords.push(...article.tags.map(t => t.toLowerCase()));
  }

  if (article.categorySlug) {
    keywords.push(article.categorySlug.toLowerCase());
  }

  // Remove duplicates and common words
  const commonWords = new Set(['the', 'and', 'or', 'a', 'an', 'in', 'on', 'at', 'to', 'for', 'is', 'are', 'was', 'were', 'be']);
  return [...new Set(keywords)].filter(w => !commonWords.has(w));
}

/**
 * Calculate content strength (0-100) based on metadata
 */
function calculateContentScore(article) {
  let score = 50; // Base score

  // Word count bonus
  const wordCount = article.aiWordCount || 0;
  if (wordCount > 800) score += 15;
  else if (wordCount > 600) score += 10;
  else if (wordCount > 400) score += 5;

  // Featured/trending boost
  if (article.featured) score += 20;
  if (article.trending) score += 10;
  if (article.editorsChoice) score += 15;

  // AI-generated confidence (if available)
  if (article.aiGenerated) score += 5;

  // Editor's picks and high content intelligence
  if (article.contentScore && article.contentScore > 75) score += 10;

  return Math.min(score, 100);
}

/**
 * Search articles using full-text matching on title, excerpt, tags
 */
export async function searchArticlesFullText(articles = [], query = '') {
  if (!query.trim()) return [];

  const lowerQuery = query.toLowerCase();

  return articles.filter(article => {
    // Match in title (weighted highest)
    if (article.title?.toLowerCase().includes(lowerQuery)) return true;

    // Match in excerpt
    if (article.excerpt?.toLowerCase().includes(lowerQuery)) return true;

    // Match in tags
    if (Array.isArray(article.tags)) {
      if (article.tags.some(t => t.toLowerCase().includes(lowerQuery))) return true;
    }

    // Match in category
    if (article.categoryLabel?.toLowerCase().includes(lowerQuery)) return true;

    return false;
  });
}

/**
 * Get article recommendations based on user intent
 */
export function getArticleRecommendations(articles = [], intent = {}, options = {}) {
  const {
    maxResults = 5,
    minScore = 30,
    sortBy = 'relevance', // 'relevance' | 'recent' | 'featured'
  } = options;

  if (!Array.isArray(articles) || articles.length === 0) return [];

  // Score each article against the intent
  const scored = articles.map(article => ({
    article,
    score: scoreArticle(article, intent),
  }));

  // Filter by minimum score
  const filtered = scored.filter(s => s.score >= minScore);

  // Sort by selected criterion
  let sorted;
  if (sortBy === 'recent') {
    sorted = filtered.sort((a, b) =>
      new Date(b.article.publishedAt || 0) - new Date(a.article.publishedAt || 0)
    );
  } else if (sortBy === 'featured') {
    sorted = filtered.sort((a, b) => {
      // Featured first
      if (a.article.featured !== b.article.featured) {
        return a.article.featured ? -1 : 1;
      }
      // Then by score
      return b.score - a.score;
    });
  } else {
    // Default: sort by relevance score (descending)
    sorted = filtered.sort((a, b) => b.score - a.score);
  }

  // Return top N results
  return sorted.slice(0, maxResults).map(s => s.article);
}

/**
 * Score an article against user intent
 * Multi-factor scoring: category (40) + tags (30) + recency (20) + featured (10)
 */
function scoreArticle(article, intent = {}) {
  let score = 0;

  // 1. Category/topic match (40 points max)
  if (intent.articleCategory) {
    const categoryMatch = article.categorySlug === intent.articleCategory;
    const categoryFuzzyMatch = article.categoryLabel?.toLowerCase().includes(
      intent.articleCategory.toLowerCase()
    );
    if (categoryMatch) score += 40;
    else if (categoryFuzzyMatch) score += 20;
  }

  // 2. Tag overlap (30 points max)
  if (intent.tags && Array.isArray(intent.tags)) {
    const articleTags = (article.tags || []).map(t => t.toLowerCase());
    const matchingTags = intent.tags.filter(t =>
      articleTags.some(at => at.includes(t.toLowerCase()) || t.toLowerCase().includes(at))
    ).length;
    const tagScore = Math.min(matchingTags * 5, 30);
    score += tagScore;
  }

  // 3. Recency boost (20 points max)
  if (article.publishedAt) {
    const ageInDays = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60 * 24);
    if (ageInDays < 30) score += 20;
    else if (ageInDays < 90) score += 10;
    else if (ageInDays < 180) score += 5;
  }

  // 4. Featured/curated bonus (10 points max)
  if (article.featured) score += 8;
  if (article.editorsChoice) score += 10;
  if (article.trending) score += 6;

  // 5. AI-generated quality boost (5 points max)
  if (article.aiGenerated && intent.articleCategory === article.categorySlug) {
    score += 5;
  }

  // 6. Content intelligence score (if available)
  if (article.contentScore && article.contentScore > 75) {
    score += Math.min((article.contentScore - 75) / 5, 5);
  }

  return Math.round(score);
}

/**
 * Format article for preview in chat
 */
export function getArticlePreview(article) {
  if (!article) return null;

  return {
    id: article.id,
    slug: article.slug,
    title: article.title || 'Untitled',
    excerpt: (article.excerpt || article.standfirst || '').slice(0, 140),
    category: article.categoryLabel || article.categorySlug || 'Magazine',
    categorySlug: article.categorySlug,
    coverImage: article.coverImage,
    heroImage: article.heroImage,
    publishedAt: article.publishedAt,
    readingTime: article.readingTime || Math.ceil((article.aiWordCount || 600) / 200),
    featured: article.featured,
    trending: article.trending,
    tags: (article.tags || []).slice(0, 3), // Top 3 tags
  };
}

/**
 * Get related articles (same category or overlapping tags)
 */
export function getRelatedArticles(articles = [], articleId, options = {}) {
  const { maxResults = 3 } = options;

  const sourceArticle = articles.find(a => a.id === articleId);
  if (!sourceArticle) return [];

  const related = articles.filter(a => {
    if (a.id === articleId) return false;
    if (!a.published) return false;

    // Same category is strong signal
    if (a.categorySlug === sourceArticle.categorySlug) return true;

    // Tag overlap
    const sourceTags = (sourceArticle.tags || []).map(t => t.toLowerCase());
    const hasTagMatch = (a.tags || []).some(t =>
      sourceTags.includes(t.toLowerCase())
    );
    return hasTagMatch;
  });

  // Sort by recency and featured status
  return related
    .sort((a, b) => {
      if (a.featured !== b.featured) return a.featured ? -1 : 1;
      return new Date(b.publishedAt || 0) - new Date(a.publishedAt || 0);
    })
    .slice(0, maxResults);
}

/**
 * Article intent detection — what kind of articles is user interested in?
 */
export const ARTICLE_TOPICS = {
  photography: ['photographer', 'photo', 'videograph', 'video', 'shoot', 'album', 'footage'],
  planning: ['plan', 'timeline', 'budget', 'organize', 'checklist', 'how to', 'guide'],
  style: ['aesthetic', 'theme', 'dress', 'design', 'decor', 'style', 'inspiration'],
  wellness: ['spa', 'yoga', 'health', 'relax', 'mindfulness', 'wellbeing', 'retreat'],
  trends: ['trend', 'modern', 'contemporary', '2025', '2026', 'new', 'emerging'],
  destinations: ['tuscany', 'amalfi', 'lake como', 'italy', 'rome', 'region', 'destination'],
  vendors: ['caterer', 'florist', 'musician', 'planner', 'band', 'DJ', 'coordinator'],
  realweddings: ['real', 'wedding', 'couple', 'story', 'inspiration', 'showcase'],
};

export default {
  indexArticlesByContent,
  searchArticlesFullText,
  getArticleRecommendations,
  getArticlePreview,
  getRelatedArticles,
  ARTICLE_TOPICS,
};
