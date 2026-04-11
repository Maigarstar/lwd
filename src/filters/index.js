// ─── src/filters/index.js ─────────────────────────────────────────────────────
// Public API for the dynamic filter system.
// Import from here: import { getFilterConfig, applyVendorFilters, ... } from "../filters";
// ─────────────────────────────────────────────────────────────────────────────

export {
  CATEGORY_FILTERS,
  SORT_OPTIONS,
  getFilterConfig,
  buildInitialFilters,
  hasActiveFilters,
  resetFilters,
} from "./filterConfig.js";

export {
  applyVendorFilters,
  applyVendorSort,
  extractFilterOptions,
} from "./filterEngine.js";

export {
  normaliseFilterValue,
  normaliseListingField,
  normaliseSpecialties,
  normalisePriceLabel,
  matchesFilter,
} from "./normalise.js";
