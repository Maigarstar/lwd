// ─── src/filters/filterConfig.js ──────────────────────────────────────────────
// Category Filter Map — declares which filters each category uses.
// One config, all categories. New category? Add an entry or use _default.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Filter dimension definition:
 * @property {string} key        — unique filter key, maps to vendorFilters state
 * @property {string} label      — display label for the trigger button
 * @property {"select"|"range"|"boolean"} type — filter behaviour
 * @property {string} dataField  — field on listing object. Suffix "[]" = array field
 * @property {boolean} [navigates] — true = selecting this filter changes the URL (region only)
 * @property {string[]} [staticOptions] — optional hardcoded options (overrides auto-population)
 */

// ── Sort options (shared across ALL categories) ──────────────────────────────
export const SORT_OPTIONS = [
  { slug: "recommended", name: "Recommended" },
  { slug: "rating",      name: "Highest Rated" },
  { slug: "price-low",   name: "Price: Low \u2192 High" },
  { slug: "price-high",  name: "Price: High \u2192 Low" },
  { slug: "reviews",     name: "Most Reviews" },
];

// ── Category Filter Map ─────────────────────────────────────────────────────

export const CATEGORY_FILTERS = {

  "wedding-venues": {
    filters: [
      { key: "region",   label: "Region",   type: "select", dataField: "regionSlug", navigates: true },
      { key: "style",    label: "Style",    type: "select", dataField: "styles[]" },
      { key: "capacity", label: "Guests",   type: "select", dataField: "capacity",
        staticOptions: ["All", "Up to 50", "50\u2013100", "100\u2013200", "200+"] },
      { key: "budget",   label: "Budget",   type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVenueCard",
  },

  "wedding-planners": {
    filters: [
      { key: "region",    label: "Region",       type: "select", dataField: "regionSlug", navigates: true },
      { key: "tier",      label: "Service Tier",  type: "select", dataField: "serviceTier" },
      { key: "specialty", label: "Specialty",     type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",        type: "select", dataField: "priceLabel" },
    ],
    card: "PlannerCard",
  },

  "photographers": {
    filters: [
      { key: "region",    label: "Region",  type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Style",   type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",  type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  "videographers": {
    filters: [
      { key: "region",    label: "Region",  type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Style",   type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",  type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  "florists": {
    filters: [
      { key: "region",    label: "Region",    type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Specialty", type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",    type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  "caterers": {
    filters: [
      { key: "region",    label: "Region",    type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Specialty", type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",    type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  "hair-makeup": {
    filters: [
      { key: "region",    label: "Region",    type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Specialty", type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",    type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  "entertainment": {
    filters: [
      { key: "region",    label: "Region",    type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Type",      type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",    type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  "wedding-cakes": {
    filters: [
      { key: "region",    label: "Region",    type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Style",     type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",    type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },

  // ── Default: any category not explicitly listed above ──────────────────────
  "_default": {
    filters: [
      { key: "region",    label: "Region",    type: "select", dataField: "regionSlug", navigates: true },
      { key: "specialty", label: "Specialty", type: "select", dataField: "specialties[]" },
      { key: "budget",    label: "Budget",    type: "select", dataField: "priceLabel" },
    ],
    card: "LuxuryVendorCard",
  },
};

// ── Helper: resolve config for a category slug ──────────────────────────────
export function getFilterConfig(categorySlug) {
  return CATEGORY_FILTERS[categorySlug] || CATEGORY_FILTERS["_default"];
}

// ── Helper: build initial filter state from config ──────────────────────────
export function buildInitialFilters(config, regionName) {
  const state = { sort: "recommended" };
  config.filters.forEach(dim => {
    if (dim.key === "region") {
      state[dim.key] = regionName || "All";
    } else {
      state[dim.key] = "All";
    }
  });
  return state;
}

// ── Helper: check if any filter is active ───────────────────────────────────
export function hasActiveFilters(filters) {
  return Object.entries(filters).some(([key, val]) => {
    if (key === "sort") return val !== "recommended";
    return val && val !== "All";
  });
}

// ── Helper: reset all filters to defaults ───────────────────────────────────
export function resetFilters(config) {
  return buildInitialFilters(config, "All");
}
