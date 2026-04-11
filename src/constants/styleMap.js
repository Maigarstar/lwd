/**
 * ─── src/constants/styleMap.js ────────────────────────────────────────────
 * CANONICAL STYLE MAPPING LAYER
 *
 * Maps UI presentation labels → actual data values in VENUES and VENDORS.
 * This is the single source of truth for style filtering across the entire platform.
 *
 * ALL filters, Aura, and pages must use normalizeStyle() to translate UI values
 * to data values before filtering.
 *
 * CRITICAL RULE:
 * - UI labels are presentation only
 * - Filters always work with canonical data values
 * - normalizeStyle() is called at the boundary between UI input and filter logic
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Canonical mapping: UI Label → Array of real data values
 *
 * This mapping is curated from analysis of actual venue/vendor style arrays.
 * When a user selects a UI label, it expands to all matching data values.
 */
export const STYLE_MAP = {
  // Grouping: Traditional Luxury
  "Classic & Traditional": [
    "Classic",
    "Elegant",
    "Historic",
  ],

  // Grouping: Contemporary/Modern
  "Contemporary & Modern": [
    "Modern",
    "Minimalist",
    "Art Deco",
  ],

  // Grouping: Rustic & Nature
  "Rustic & Country": [
    "Rustic",
    "Rustic Luxe",
  ],

  // Grouping: Intimate & Personal
  "Bohemian & Free-Spirit": [
    "Bohemian",
    "Intimate",
  ],

  // Grouping: Opulent & Formal
  "Glamorous & Grand": [
    "Black Tie",
    "Elegant",
    "Exclusive",
  ],

  // Grouping: Intimate & Elopement
  "Intimate & Elopement": [
    "Intimate",
    "Romantic",
  ],

  // Grouping: Destination & Exotic
  "Destination": [
    "Destination",
    "Coastal",
    "Lakeside",
  ],

  // Grouping: Outdoor & Natural
  "Festival & Outdoor": [
    "Garden",
    "Vineyard",
    "Coastal",
  ],

  // Grouping: Creative & Alternative
  "Alternative & Creative": [
    "Modern",
    "Contemporary",
    "Gothic",
  ],

  // Grouping: Opulent & Luxury
  "Luxury & Opulent": [
    "Elegant",
    "Black Tie",
    "Historic",
    "Exclusive",
  ],

  // Grouping: Romantic & Whimsical
  "Romantic & Whimsical": [
    "Romantic",
    "Garden",
    "Intimate",
  ],

  // Grouping: Minimalist & Chic
  "Minimalist & Chic": [
    "Modern",
    "Minimalist",
    "Contemporary",
  ],

  // Grouping: Formal & Black Tie
  "Black Tie & Formal": [
    "Black Tie",
    "Classic",
    "Historic",
  ],
};

/**
 * Reverse mapping: Data value → UI labels
 * Used for displaying "which filters match this venue" when Aura infers styles
 *
 * Built automatically from STYLE_MAP
 */
export const STYLE_REVERSE_MAP = (() => {
  const reverse = {};
  Object.entries(STYLE_MAP).forEach(([uiLabel, dataValues]) => {
    dataValues.forEach((dataValue) => {
      if (!reverse[dataValue]) {
        reverse[dataValue] = [];
      }
      reverse[dataValue].push(uiLabel);
    });
  });
  return reverse;
})();

/**
 * Normalize a style value to canonical data values
 *
 * @param {string} styleInput - Either a UI label or a data value
 * @returns {string[]} Array of canonical data values
 *
 * Usage:
 *   normalizeStyle("Rustic & Country") → ["Rustic", "Rustic Luxe", "Garden", "Vineyard"]
 *   normalizeStyle("Rustic Luxe") → ["Rustic Luxe"]  (pass-through if already canonical)
 */
export function normalizeStyle(styleInput) {
  if (!styleInput) return [];

  // If it's a known UI label, map it to data values
  if (STYLE_MAP[styleInput]) {
    return STYLE_MAP[styleInput];
  }

  // If it's already a data value (not in UI labels), pass it through
  // This allows Aura to output real data values directly
  if (Object.values(STYLE_MAP).flat().includes(styleInput)) {
    return [styleInput];
  }

  // Unknown value — pass through as-is (will likely match nothing, which is correct)
  return [styleInput];
}

/**
 * Normalize an array of styles (for handling multiple selected styles)
 *
 * @param {string[]} styles - Array of UI labels or data values
 * @returns {string[]} Flattened array of canonical data values
 *
 * Usage:
 *   normalizeStyles(["Rustic & Country", "Romantic & Whimsical"])
 *   → ["Rustic", "Rustic Luxe", "Garden", "Vineyard", "Romantic", "Intimate", "Garden"]
 *   (note: Garden appears twice but Set/dedupe later)
 */
export function normalizeStyles(styles) {
  if (!Array.isArray(styles) || styles.length === 0) return [];
  return [...new Set(styles.flatMap((s) => normalizeStyle(s)))];
}

/**
 * Check if a venue matches a style filter
 *
 * @param {object} venue - Venue object with `styles` array
 * @param {string[]} filterStyles - Canonical data values from filter
 * @returns {boolean}
 *
 * Usage:
 *   const matches = matchesStyleFilter(venue, ["Rustic", "Rustic Luxe", "Garden"]);
 */
export function matchesStyleFilter(venue, filterStyles) {
  if (!filterStyles || filterStyles.length === 0) return true;
  if (!venue.styles || venue.styles.length === 0) return false;

  return venue.styles.some((venueStyle) =>
    filterStyles.includes(venueStyle)
  );
}

/**
 * Get all possible UI labels (for UI dropdowns)
 *
 * @returns {string[]}
 */
export function getAllStyleLabels() {
  return Object.keys(STYLE_MAP).sort();
}

/**
 * Get all canonical data values (for validation and mapping)
 *
 * @returns {string[]}
 */
export function getAllCanonicalStyles() {
  return [...new Set(Object.values(STYLE_MAP).flat())].sort();
}
