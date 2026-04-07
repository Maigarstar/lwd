/**
 * editingUtils.js — Universal frontend editing system
 * Shared utilities, constants, and helpers for editing across all entity types
 */

/**
 * Entity type constants
 */
export const ENTITY_TYPES = {
  ARTICLE: 'article',
  LISTING: 'listing',
  SHOWCASE: 'showcase',
  LOCATION: 'location',
  CATEGORY: 'category',
};

/**
 * Build a universal edit URL for any entity type
 * @param {string} entityType - One of ENTITY_TYPES (article, listing, showcase, location, category)
 * @param {string} slug - Entity slug
 * @param {string} from - Optional return path (defaults to current location)
 * @returns {string} Edit URL like /studio/edit/article/my-cake?from=/magazine/my-cake
 */
export function buildEditUrl(entityType, slug, from) {
  if (!entityType || !slug) {
    console.warn('[editingUtils] buildEditUrl requires entityType and slug');
    return '/studio';
  }

  const fromPath = from || (typeof window !== 'undefined' ? window.location.pathname : '/');
  const encodedFrom = encodeURIComponent(fromPath);

  return `/studio/edit/${entityType}/${slug}?from=${encodedFrom}`;
}

/**
 * Check if a user can edit content
 * @param {object} user - User object with role property
 * @returns {boolean} True if user has admin or editor role
 */
export function canUserEdit(user) {
  return user && (user.role === 'admin' || user.role === 'editor');
}

/**
 * Get human-readable label for entity type
 * @param {string} entityType - One of ENTITY_TYPES
 * @returns {string} Singular label (e.g., "article", "listing")
 */
export function getEntityLabel(entityType) {
  const labels = {
    [ENTITY_TYPES.ARTICLE]: 'article',
    [ENTITY_TYPES.LISTING]: 'listing',
    [ENTITY_TYPES.SHOWCASE]: 'showcase',
    [ENTITY_TYPES.LOCATION]: 'location',
    [ENTITY_TYPES.CATEGORY]: 'category',
  };

  return labels[entityType] || 'item';
}

/**
 * Parse return path from URL query params
 * @returns {string} Decoded return path, or '/' if not found
 */
export function getReturnPathFromUrl() {
  if (typeof window === 'undefined') return '/';

  const params = new URLSearchParams(window.location.search);
  const from = params.get('from');

  if (!from) return '/';

  try {
    return decodeURIComponent(from);
  } catch (e) {
    console.warn('[editingUtils] Failed to decode return path:', e);
    return '/';
  }
}

/**
 * Parse entity type and slug from URL path
 * Used by UniversalStudioRouter and other router components
 * @returns {object} { entityType, slug } or { entityType: null, slug: null }
 */
export function parseEditPath() {
  if (typeof window === 'undefined') return { entityType: null, slug: null };

  // Expect URL like /studio/edit/article/my-cake
  const match = window.location.pathname.match(/^\/studio\/edit\/([^/]+)\/(.+)$/);

  if (!match) return { entityType: null, slug: null };

  const [, entityType, slug] = match;

  return {
    entityType: entityType || null,
    slug: slug ? decodeURIComponent(slug) : null,
  };
}

/**
 * Get the live URL for an entity
 * @param {string} entityType - One of ENTITY_TYPES
 * @param {string} slug - Entity slug
 * @returns {string} Full URL to the live entity page
 */
export function getLiveUrl(entityType, slug) {
  if (!entityType || !slug) return '/';

  const urlMap = {
    [ENTITY_TYPES.ARTICLE]: `/magazine/${slug}`,
    [ENTITY_TYPES.LISTING]: `/listing/${slug}`, // May need adjustment based on your routing
    [ENTITY_TYPES.SHOWCASE]: `/showcase/${slug}`,
    [ENTITY_TYPES.LOCATION]: `/${slug}`, // Country/region page
    [ENTITY_TYPES.CATEGORY]: `/magazine/category/${slug}`,
  };

  return urlMap[entityType] || '/';
}

/**
 * Validate entity type
 * @param {string} entityType - Entity type to validate
 * @returns {boolean} True if valid entity type
 */
export function isValidEntityType(entityType) {
  return Object.values(ENTITY_TYPES).includes(entityType);
}

export default {
  ENTITY_TYPES,
  buildEditUrl,
  canUserEdit,
  getEntityLabel,
  getReturnPathFromUrl,
  parseEditPath,
  getLiveUrl,
  isValidEntityType,
};
