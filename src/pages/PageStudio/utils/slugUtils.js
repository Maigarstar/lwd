/**
 * Slug generation and validation utilities
 */

/**
 * Generate a slug from text
 */
export const generateSlug = (text) => {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
};

/**
 * Check if slug is unique among existing pages
 */
export const isSlugUnique = (slug, pages, excludePageId = null) => {
  return !pages.some(p =>
    p.slug === slug && (!excludePageId || p.id !== excludePageId)
  );
};

/**
 * Make a slug unique by appending a number
 */
export const makeSlugUnique = (slug, pages, excludePageId = null) => {
  if (isSlugUnique(slug, pages, excludePageId)) {
    return slug;
  }

  let counter = 1;
  let newSlug = `${slug}-${counter}`;

  while (!isSlugUnique(newSlug, pages, excludePageId)) {
    counter++;
    newSlug = `${slug}-${counter}`;
  }

  return newSlug;
};

/**
 * Validate slug format
 */
export const isValidSlug = (slug) => {
  const slugRegex = /^[a-z0-9]+(-[a-z0-9]+)*$/;
  return slugRegex.test(slug) && slug.length > 0 && slug.length <= 255;
};
