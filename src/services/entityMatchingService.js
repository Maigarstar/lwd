/**
 * entityMatchingService.js
 *
 * Intelligent mention detection for articles.
 * Finds references to venues and planners in article text using fuzzy matching.
 * Builds normalized index for efficient lookup.
 */

import { VENUES } from '../data/italyVenues';
import { VENDORS } from '../data/vendors';

// ─── Build Entity Directory ─────────────────────────────────────────────────

/**
 * Normalize text for matching: lowercase, trim whitespace, remove punctuation
 */
function normalizeText(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[.,!?;:—–]/g, '');
}

/**
 * Extract planners from vendors list (category === 'planner')
 */
function getPlanners() {
  return VENDORS.filter(v => v.category === 'planner');
}

/**
 * Build searchable entity directory on module load
 * Returns: { venues: [], planners: [], regionNames: Set }
 */
function buildEntityDirectory() {
  const planners = getPlanners();

  // Collect unique region names for location context
  const regionNames = new Set();
  const cityNames = new Set();

  VENUES.forEach(v => {
    if (v.region) regionNames.add(v.region.toLowerCase());
    if (v.city) cityNames.add(v.city.toLowerCase());
  });

  planners.forEach(p => {
    if (p.region) regionNames.add(p.region.toLowerCase());
    if (p.city) cityNames.add(p.city.toLowerCase());
  });

  return {
    venues: VENUES,
    planners,
    regionNames,
    cityNames,
  };
}

// Initialize on module load
const DIRECTORY = buildEntityDirectory();

// ─── Fuzzy Name Matching ────────────────────────────────────────────────────

/**
 * Calculate similarity score between two strings (0-100)
 * Uses character overlap and length similarity
 */
function calculateSimilarity(str1, str2) {
  const s1 = normalizeText(str1);
  const s2 = normalizeText(str2);

  // Exact match
  if (s1 === s2) return 100;

  // One contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    const shortLen = Math.min(s1.length, s2.length);
    const longLen = Math.max(s1.length, s2.length);
    return Math.round((shortLen / longLen) * 90 + 10);
  }

  // Character overlap (Jaccard similarity)
  const set1 = new Set(s1.split(''));
  const set2 = new Set(s2.split(''));
  const intersection = new Set([...set1].filter(x => set2.has(x)));
  const union = new Set([...set1, ...set2]);
  const similarity = intersection.size / union.size;

  return Math.round(similarity * 80);
}

/**
 * Find best matching entity by name
 * Returns: { entity, type, confidence } or null
 */
function matchEntityName(nameFragment) {
  if (!nameFragment || nameFragment.trim().length < 2) return null;

  const normalized = normalizeText(nameFragment);
  let bestMatch = null;
  let bestScore = 40; // Minimum confidence threshold

  // Try venues
  for (const venue of DIRECTORY.venues) {
    const score = calculateSimilarity(nameFragment, venue.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { entity: venue, type: 'venue', confidence: score / 100 };
    }
  }

  // Try planners
  for (const planner of DIRECTORY.planners) {
    const score = calculateSimilarity(nameFragment, planner.name);
    if (score > bestScore) {
      bestScore = score;
      bestMatch = { entity: planner, type: 'planner', confidence: score / 100 };
    }
  }

  return bestMatch;
}

/**
 * Get entity by ID and type
 */
function getEntityById(id, type) {
  if (type === 'venue') {
    return DIRECTORY.venues.find(v => v.id === id);
  } else if (type === 'planner') {
    return DIRECTORY.planners.find(p => p.id === id);
  }
  return null;
}

// ─── Text Mention Extraction ────────────────────────────────────────────────

/**
 * Extract potential mentions from text
 * Returns: array of { text, startIndex, endIndex, match }
 *
 * Strategy:
 * 1. Find capitalized phrases (proper nouns)
 * 2. Try to match against entity directory
 * 3. Return matches with confidence > 0.6
 */
function extractPotentialMentions(text) {
  const mentions = [];

  // Regex: capitalized words and phrases (1-4 words)
  // Matches: "Villa Rosanova", "Fiore Events", "Tuscany", etc.
  const properNounRegex = /\b([A-Z][a-z]*(?:\s+[A-Z][a-z]*){0,3})\b/g;

  let match;
  while ((match = properNounRegex.exec(text)) !== null) {
    const phrase = match[1].trim();

    // Skip very short phrases
    if (phrase.length < 3) continue;

    // Try to match against entities
    const entityMatch = matchEntityName(phrase);

    if (entityMatch && entityMatch.confidence >= 0.6) {
      mentions.push({
        text: phrase,
        startIndex: match.index,
        endIndex: match.index + phrase.length,
        match: entityMatch,
      });
    }
  }

  return mentions;
}

/**
 * Extract all mentions from article text
 * Combines title, excerpt, standfirst, and block text
 *
 * Returns: array of { name, type, entityId, confidence, context }
 */
export function findMentionsInArticle(article) {
  if (!article) return [];

  const textParts = [];

  // Collect text from various sources
  if (article.title) textParts.push(article.title);
  if (article.excerpt) textParts.push(article.excerpt);
  if (article.standfirst) textParts.push(article.standfirst);

  // Extract text from content blocks
  if (Array.isArray(article.content)) {
    article.content.forEach((block, blockIndex) => {
      if (block.text) textParts.push(block.text);
      if (block.heading) textParts.push(block.heading);
      if (block.caption) textParts.push(block.caption);
    });
  }

  // Combine all text
  const fullText = textParts.join(' ');

  // Find mentions
  const foundMentions = extractPotentialMentions(fullText);

  // Deduplicate by entity ID and type
  const uniqueMentions = new Map();

  for (const mention of foundMentions) {
    const key = `${mention.match.type}:${mention.match.entity.id}`;

    // Keep highest confidence for each entity
    if (!uniqueMentions.has(key) || uniqueMentions.get(key).confidence < mention.match.confidence) {
      uniqueMentions.set(key, {
        name: mention.match.entity.name,
        type: mention.match.type,
        entityId: mention.match.entity.id,
        confidence: mention.match.confidence,
        context: mention.text,
      });
    }
  }

  return Array.from(uniqueMentions.values()).sort((a, b) => b.confidence - a.confidence);
}

/**
 * Get all venues with optional region filter
 */
export function getAllVenues() {
  return DIRECTORY.venues;
}

/**
 * Get all planners with optional region filter
 */
export function getAllPlanners() {
  return DIRECTORY.planners;
}

/**
 * Search entities by name pattern
 */
export function searchEntities(pattern) {
  if (!pattern || pattern.length < 2) return { venues: [], planners: [] };

  const normalized = normalizeText(pattern);
  const threshold = 0.7;

  const venueResults = DIRECTORY.venues
    .map(v => ({
      entity: v,
      type: 'venue',
      score: calculateSimilarity(pattern, v.name) / 100,
    }))
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score);

  const plannerResults = DIRECTORY.planners
    .map(p => ({
      entity: p,
      type: 'planner',
      score: calculateSimilarity(pattern, p.name) / 100,
    }))
    .filter(r => r.score >= threshold)
    .sort((a, b) => b.score - a.score);

  return { venues: venueResults, planners: plannerResults };
}

export default {
  findMentionsInArticle,
  matchEntityName,
  getEntityById,
  getAllVenues,
  getAllPlanners,
  searchEntities,
};
