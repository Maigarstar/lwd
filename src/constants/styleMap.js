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
 * ─── STRICT STYLE TAXONOMY ──────────────────────────────────────────────────
 *
 * Each category is a specific, recognizable aesthetic.
 * No catch-all values. No generic adjectives. No features masquerading as styles.
 *
 * Refined from semantic audit (STYLE_TAXONOMY_AUDIT.md) with these rules:
 * - "Elegant" removed (too generic, appeared 5+ times)
 * - "Modern" consolidated (was in 3 categories)
 * - "Intimate" removed (atmosphere, not aesthetic)
 * - All remaining values have clear, defensible meaning
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Canonical mapping: UI Label → Array of real data values
 *
 * This mapping is curated from analysis of actual venue/vendor style arrays.
 * When a user selects a UI label, it expands to all matching data values.
 *
 * CRITICAL: Each value must genuinely represent that aesthetic category.
 * Better to return 5 correct results than 7 with false positives.
 */
export const STYLE_MAP = {
  // Traditional design, heritage architecture, timeless elegance
  "Classic & Traditional": [
    "Classic",
    "Historic",
  ],

  // Modern design, clean lines, architectural innovation
  "Contemporary & Modern": [
    "Minimalist",
    "Art Deco",
  ],

  // Natural, countryside, earthy aesthetic
  "Rustic & Country": [
    "Rustic",
    "Rustic Luxe",
  ],

  // Eclectic, artistic, unconventional, expressive
  "Bohemian & Free-Spirit": [
    "Bohemian",
  ],

  // Formal opulence, luxury positioning, exclusive access
  "Glamorous & Grand": [
    "Black Tie",
    "Exclusive",
  ],

  // Small gatherings, romantic atmosphere, personal scale
  "Intimate & Elopement": [
    "Romantic",
  ],

  // Travel-worthy locations, exotic settings, destination weddings
  "Destination": [
    "Destination",
    "Coastal",
    "Lakeside",
  ],

  // Open-air venues, natural settings, outdoor celebrations
  "Festival & Outdoor": [
    "Garden",
    "Vineyard",
    "Coastal",
  ],

  // Non-traditional, artistic, unconventional spaces
  "Alternative & Creative": [
    "Gothic",
    "Contemporary",
  ],

  // High-end properties, premium positioning, heritage luxury
  "Luxury & Opulent": [
    "Historic",
    "Exclusive",
  ],

  // Sentimental, enchanting, dreamlike atmosphere
  // NOTE: "Garden" removed (belongs to Festival & Outdoor)
  // Garden-only venues are architectural feature, not romantic aesthetic
  "Romantic & Whimsical": [
    "Romantic",
  ],

  // Clean design, spare aesthetic, architectural purity
  "Minimalist & Chic": [
    "Minimalist",
  ],

  // Formal evening wear events, traditional black-tie venues
  "Black Tie & Formal": [
    "Black Tie",
    "Classic",
    "Historic",
  ],
};

/**
 * STYLE TAXONOMY - Extended metadata for each category
 *
 * Powers:
 * - Aura semantic understanding ("show me romantic venues")
 * - SEO landing pages ("Classic Wedding Venues in Italy")
 * - Editorial consistency (marketing copy, filters, recommendations)
 * - Filter descriptions (tooltip help text)
 *
 * Structure:
 * - description: Human-readable category meaning
 * - query_aliases: Natural language variations that map to this category
 * - seo_title_pattern: For auto-generated SEO pages
 */
export const STYLE_TAXONOMY = {
  "Classic & Traditional": {
    description: "Timeless elegance, period venues, heritage architecture",
    query_aliases: ["classic", "traditional", "elegant", "historic", "timeless"],
    seo_title: "Classic & Traditional Wedding Venues",
  },
  "Contemporary & Modern": {
    description: "Modern design, clean lines, architectural innovation",
    query_aliases: ["modern", "contemporary", "minimalist", "art deco", "innovative"],
    seo_title: "Contemporary & Modern Wedding Venues",
  },
  "Rustic & Country": {
    description: "Natural, countryside, earthy aesthetic",
    query_aliases: ["rustic", "country", "farmhouse", "barn", "estate"],
    seo_title: "Rustic & Country Wedding Venues",
  },
  "Bohemian & Free-Spirit": {
    description: "Eclectic, artistic, unconventional, expressive",
    query_aliases: ["bohemian", "boho", "artistic", "eclectic", "unconventional"],
    seo_title: "Bohemian & Free-Spirit Wedding Venues",
  },
  "Glamorous & Grand": {
    description: "Formal opulence, luxury positioning, exclusive access",
    query_aliases: ["glamorous", "grand", "formal", "opulent", "luxurious"],
    seo_title: "Glamorous & Grand Wedding Venues",
  },
  "Intimate & Elopement": {
    description: "Small gatherings, romantic atmosphere, personal scale",
    query_aliases: ["intimate", "elopement", "small", "romantic", "couple"],
    seo_title: "Intimate & Elopement Wedding Venues",
  },
  "Destination": {
    description: "Travel-worthy locations, exotic settings, destination weddings",
    query_aliases: ["destination", "exotic", "travel", "coastal", "tropical"],
    seo_title: "Destination Wedding Venues",
  },
  "Festival & Outdoor": {
    description: "Open-air venues, natural settings, outdoor celebrations",
    query_aliases: ["outdoor", "garden", "festival", "vineyard", "al fresco"],
    seo_title: "Festival & Outdoor Wedding Venues",
  },
  "Alternative & Creative": {
    description: "Non-traditional, artistic, unconventional spaces",
    query_aliases: ["alternative", "creative", "artistic", "gothic", "unconventional"],
    seo_title: "Alternative & Creative Wedding Venues",
  },
  "Luxury & Opulent": {
    description: "High-end properties, premium positioning, heritage luxury",
    query_aliases: ["luxury", "opulent", "exclusive", "premium", "high-end"],
    seo_title: "Luxury & Opulent Wedding Venues",
  },
  "Romantic & Whimsical": {
    description: "Sentimental, enchanting, dreamlike atmosphere",
    query_aliases: ["romantic", "whimsical", "dreamy", "enchanting", "fairy tale"],
    seo_title: "Romantic & Whimsical Wedding Venues",
  },
  "Minimalist & Chic": {
    description: "Clean design, spare aesthetic, architectural purity",
    query_aliases: ["minimalist", "chic", "clean", "modern", "simple"],
    seo_title: "Minimalist & Chic Wedding Venues",
  },
  "Black Tie & Formal": {
    description: "Formal evening wear events, traditional black-tie venues",
    query_aliases: ["black tie", "formal", "traditional", "elegant", "ceremony"],
    seo_title: "Black Tie & Formal Wedding Venues",
  },
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
 * STRICT MODE: Unknown styles return empty array (safer than false positives)
 *
 * @param {string} styleInput - Either a UI label or a data value
 * @param {boolean} strictMode - If true, unknown values return [] instead of [value]
 * @returns {string[]} Array of canonical data values
 *
 * Usage:
 *   normalizeStyle("Rustic & Country") → ["Rustic", "Rustic Luxe"]
 *   normalizeStyle("Rustic Luxe") → ["Rustic Luxe"]  (canonical value)
 *   normalizeStyle("Unknown", true) → [] (strict mode — safer)
 *   normalizeStyle("Unknown", false) → ["Unknown"] (legacy fallback)
 */
export function normalizeStyle(styleInput, strictMode = true) {
  if (!styleInput) return [];

  // If it's a known UI label, map it to data values
  if (STYLE_MAP[styleInput]) {
    return STYLE_MAP[styleInput];
  }

  // Get all canonical values from the map
  const allCanonicalValues = [...new Set(Object.values(STYLE_MAP).flat())];

  // If it's already a data value (not in UI labels), pass it through
  // This allows Aura to output real data values directly
  if (allCanonicalValues.includes(styleInput)) {
    return [styleInput];
  }

  // Unknown value handling
  if (strictMode) {
    // STRICT: Better to return nothing than wrong results
    if (typeof window !== 'undefined' && window.console) {
      console.warn(`[STYLE_MAP] Unknown style in strict mode: "${styleInput}" — returning empty array`);
    }
    return [];
  }

  // LEGACY: Pass through as-is (will likely match nothing anyway)
  if (typeof window !== 'undefined' && window.console) {
    console.warn(`[STYLE_MAP] Unknown style in legacy mode: "${styleInput}" — passing through`);
  }
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
 *   → ["Rustic", "Rustic Luxe", "Romantic", "Garden"]
 */
export function normalizeStyles(styles) {
  if (!Array.isArray(styles) || styles.length === 0) return [];
  return [...new Set(styles.flatMap((s) => normalizeStyle(s)))];
}

/**
 * CRITICAL: Resolve Aura semantic intent to full category mapping
 *
 * Problem:
 * - User selects "Rustic & Country" UI filter → returns ["Rustic", "Rustic Luxe"]
 * - Aura outputs "Rustic" (canonical data value) → was returning just ["Rustic"]
 * - Results differed! System appeared broken.
 *
 * Solution:
 * When Aura outputs a canonical value, we find which category it belongs to,
 * then return ALL values from that category (full semantic intent).
 *
 * @param {string} aurasStyleValue - Raw value from Aura (e.g., "Rustic", "Romantic")
 * @returns {string[]} Full category values representing Aura's semantic intent
 *
 * Usage:
 *   When Aura outputs "Rustic" → find it's in "Rustic & Country" → return ["Rustic", "Rustic Luxe"]
 *   When Aura outputs "Romantic" → find it's in "Romantic & Whimsical" → return ["Romantic", "Garden"]
 *   When Aura outputs "Unknown" → return [] (strict safety mode)
 */
export function resolveAuraSemanticIntent(aurasStyleValue, strictMode = true) {
  if (!aurasStyleValue) return [];

  // First, check if it's a UI category label (user selected from dropdown)
  if (STYLE_MAP[aurasStyleValue]) {
    return STYLE_MAP[aurasStyleValue];
  }

  // Second, check if it's a canonical data value (Aura parsed it from text)
  // Find which category(s) this value belongs to
  const matchingCategories = [];
  Object.entries(STYLE_MAP).forEach(([category, values]) => {
    if (values.includes(aurasStyleValue)) {
      matchingCategories.push(category);
    }
  });

  if (matchingCategories.length > 0) {
    // Return values from the FIRST matching category (primary semantic intent)
    // If a value appears in multiple categories (e.g., "Historic"), we use the first one
    const primaryCategory = matchingCategories[0];
    return STYLE_MAP[primaryCategory];
  }

  // Unknown value
  if (strictMode) {
    console.warn(
      `[AURA_SEMANTIC] Unknown style value: "${aurasStyleValue}" — returning empty array`
    );
    return [];
  }

  return [aurasStyleValue];
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

/**
 * DEBUG: Log truth verification for a filter operation
 *
 * Use this to visually confirm:
 * - Mapping is correct
 * - Results are justified
 * - No false positives creeping in
 *
 * @param {object} context - Debug context object
 * @param {string} context.selectedStyle - User-selected filter label
 * @param {array} context.matchedListings - Listings that passed the filter
 * @param {array} context.canonicalValues - Normalized canonical values
 * @param {object} context.metadata - Optional metadata
 *
 * Usage:
 *   debugStyleMapping({
 *     selectedStyle: "Rustic & Country",
 *     canonicalValues: normalizeStyle("Rustic & Country"),
 *     matchedListings: results.map(r => ({ id: r.id, styles: r.styles })),
 *   })
 */
export function debugStyleMapping({ selectedStyle, canonicalValues, matchedListings, metadata = {} }) {
  if (typeof window === 'undefined' || !window.console) return;

  const log = {
    filter: {
      selectedStyle,
      canonicalValues,
      totalMatches: matchedListings.length,
    },
    matches: matchedListings.map((listing) => ({
      id: listing.id,
      name: listing.name,
      styles: listing.styles,
      matchedStyles: listing.styles.filter((s) => canonicalValues.includes(s)),
    })),
    metadata,
  };

  console.group(`🔍 STYLE FILTER DEBUG: "${selectedStyle}"`);
  console.log("Filter Configuration:", log.filter);
  console.table(log.matches);
  if (Object.keys(metadata).length > 0) {
    console.log("Metadata:", log.metadata);
  }
  console.groupEnd();

  return log;
}

/**
 * VALIDATION: Ensure no overlapping catch-all values
 *
 * Runs semantic checks on the taxonomy to catch mapping errors:
 * - No value appears in more than 2 categories (unless intentional)
 * - No truly generic values (e.g., "Elegant" shouldn't appear in 5+ categories)
 * - All values have clear meaning
 *
 * @returns {object} Validation report
 */
export function validateStyleTaxonomy() {
  const report = {
    valid: true,
    issues: [],
    stats: {},
  };

  // Count occurrences of each value
  const valueCount = {};
  Object.entries(STYLE_MAP).forEach(([category, values]) => {
    values.forEach((value) => {
      valueCount[value] = (valueCount[value] || 0) + 1;
    });
  });

  report.stats.totalCategories = Object.keys(STYLE_MAP).length;
  report.stats.totalUniqueValues = Object.keys(valueCount).length;
  report.stats.valueDistribution = valueCount;

  // Check for overused values
  const overusedValues = Object.entries(valueCount).filter(([_, count]) => count > 2);
  if (overusedValues.length > 0) {
    report.issues.push({
      severity: "warning",
      message: "Values appearing in 3+ categories (potential catch-all):",
      values: overusedValues.map(([value, count]) => `${value} (${count} categories)`),
    });
  }

  // Generic values that should never exist
  const genericValues = ["Elegant", "Modern", "Intimate"];
  const foundGeneric = genericValues.filter((generic) =>
    Object.values(STYLE_MAP).flat().includes(generic)
  );
  if (foundGeneric.length > 0) {
    report.valid = false;
    report.issues.push({
      severity: "error",
      message: "Generic catch-all values found (these should have been removed):",
      values: foundGeneric,
    });
  }

  if (typeof window !== 'undefined' && window.console) {
    console.group("📋 STYLE TAXONOMY VALIDATION");
    console.log("Stats:", report.stats);
    if (report.issues.length > 0) {
      console.warn("Issues Found:", report.issues);
    } else {
      console.log("✓ Taxonomy is valid — no generic catch-all values detected");
    }
    console.groupEnd();
  }

  return report;
}
