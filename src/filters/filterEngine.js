// ─── src/filters/filterEngine.js ──────────────────────────────────────────────
// Shared filter + sort engine for ALL vendor categories.
// One function, one truth. Grid, List, Map, and Count all use the same output.
// ─────────────────────────────────────────────────────────────────────────────

import { normaliseFilterValue, normaliseListingField } from "./normalise.js";

// ── Apply vendor filters using the config-driven system ─────────────────────
/**
 * Filters a listings array using active filter values and filter config.
 *
 * @param {Object[]} listings     — geo-filtered listings (already scoped to country/region)
 * @param {Object}   filters      — active filter state { sort, region, specialty, tier, ... }
 * @param {Object[]} filterConfig — array of filter dimension definitions from filterConfig.js
 * @returns {Object[]} filtered listings (not sorted — call applyVendorSort separately)
 */
export function applyVendorFilters(listings, filters, filterConfig) {
  let result = listings;

  for (const dim of filterConfig) {
    const val = filters[dim.key];

    // Skip inactive filters
    if (!val || val === "All") continue;

    // Region is handled by URL navigation, not client-side filtering
    // (unless the page is at country level and region is selected in the dropdown
    //  without URL navigation — backward compat safety)
    if (dim.navigates) continue;

    const normVal = normaliseFilterValue(val);

    switch (dim.type) {
      case "select": {
        if (dim.dataField.endsWith("[]")) {
          // Array field — match if ANY element matches the normalised value
          const field = dim.dataField.replace("[]", "");
          result = result.filter(v => {
            const arr = v[field];
            if (!Array.isArray(arr)) return false;
            return arr.some(s => normaliseListingField(s).includes(normVal));
          });
        } else if (dim.key === "capacity") {
          // Special: capacity is a range band, not an exact match
          result = applyCapacityFilter(result, val);
        } else {
          // Scalar field — exact match (normalised)
          result = result.filter(v =>
            normaliseListingField(v[dim.dataField]) === normVal
          );
        }
        break;
      }

      case "range": {
        // Future: min/max range filtering
        // Not used in Phase A
        break;
      }

      case "boolean": {
        result = result.filter(v => v[dim.dataField] === true);
        break;
      }
    }
  }

  return result;
}


// ── Sort listings ────────────────────────────────────────────────────────────
/**
 * Sorts a listings array by the given sort key.
 * Returns a NEW sorted array (does not mutate input).
 *
 * @param {Object[]} listings — filtered listings
 * @param {string}   sortKey  — "recommended" | "rating" | "price-low" | "price-high" | "reviews"
 * @returns {Object[]} sorted listings
 */
export function applyVendorSort(listings, sortKey) {
  const list = [...listings];

  switch (sortKey) {
    case "rating":
      return list.sort((a, b) => (b.rating || 0) - (a.rating || 0));

    case "price-low":
      return list.sort((a, b) => parsePrice(a) - parsePrice(b));

    case "price-high":
      return list.sort((a, b) => parsePrice(b) - parsePrice(a));

    case "reviews":
      return list.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));

    case "recommended":
    default:
      return list.sort((a, b) => (b.lwdScore || 0) - (a.lwdScore || 0));
  }
}


// ── Extract filter options from data ─────────────────────────────────────────
/**
 * Auto-populates filter dropdown options from the listings data.
 * Returns { [filterKey]: string[] } with sorted unique values.
 *
 * @param {Object[]} listings     — geo-filtered listings
 * @param {Object[]} filterConfig — filter dimensions
 * @param {string[]} [extraRegions] — additional region names (from geo.js) to merge
 * @returns {Object} { region: [...], specialty: [...], tier: [...], ... }
 */
export function extractFilterOptions(listings, filterConfig, extraRegions = []) {
  const opts = {};

  for (const dim of filterConfig) {
    if (dim.staticOptions) {
      // Use hardcoded options (e.g., capacity bands)
      opts[dim.key] = dim.staticOptions;
      continue;
    }

    if (dim.type !== "select") continue;

    const values = new Set();

    if (dim.dataField.endsWith("[]")) {
      // Array field — flatten all values
      const field = dim.dataField.replace("[]", "");
      for (const v of listings) {
        const arr = v[field];
        if (Array.isArray(arr)) {
          for (const s of arr) {
            if (s) values.add(String(s).trim());
          }
        }
      }
    } else if (dim.key === "region" && extraRegions.length) {
      // Region — merge from listings + geo.js
      for (const v of listings) {
        if (v.region) values.add(String(v.region).trim());
      }
      for (const r of extraRegions) {
        values.add(r);
      }
    } else {
      // Scalar field
      for (const v of listings) {
        const val = v[dim.dataField];
        if (val != null && val !== "") values.add(String(val).trim());
      }
    }

    opts[dim.key] = [...values].sort();
  }

  return opts;
}


// ── Internal helpers ─────────────────────────────────────────────────────────

function parsePrice(v) {
  const raw = String(v?.priceFrom || v?.priceLabel || "");
  const m = raw.match(/[\d,]+/);
  return m ? parseInt(m[0].replace(/,/g, ""), 10) : 0;
}

function applyCapacityFilter(listings, band) {
  switch (band) {
    case "Up to 50":
      return listings.filter(v => v.capacity && v.capacity <= 50);
    case "50\u2013100":
      return listings.filter(v => v.capacity && v.capacity > 50 && v.capacity <= 100);
    case "100\u2013200":
      return listings.filter(v => v.capacity && v.capacity > 100 && v.capacity <= 200);
    case "200+":
      return listings.filter(v => v.capacity && v.capacity > 200);
    default:
      return listings;
  }
}
