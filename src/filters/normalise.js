// ─── src/filters/normalise.js ─────────────────────────────────────────────────
// Filter Normalisation Layer
//
// Dynamic filter systems break when listing data is inconsistent:
//   "Luxury" vs "luxury"
//   "Full Service" vs "full service"  vs "Full-Service"
//   empty strings, null values, trailing whitespace
//
// This layer cleans and standardises values BEFORE options are generated
// or filters are applied. One normalisation, everywhere.
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Normalise a filter VALUE (what the user selects).
 * Used for comparison, not display.
 *
 * @param {string} val — raw filter value
 * @returns {string} normalised lowercase trimmed value
 */
export function normaliseFilterValue(val) {
  if (val == null) return "";
  return String(val)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")           // collapse multiple spaces
    .replace(/[\u2013\u2014]/g, "-") // en-dash/em-dash → hyphen
    .replace(/['']/g, "'");          // smart quotes → plain
}

/**
 * Normalise a listing FIELD value (what the data contains).
 * Must match the same normalisation as normaliseFilterValue.
 *
 * @param {*} val — raw listing field value
 * @returns {string} normalised lowercase trimmed value
 */
export function normaliseListingField(val) {
  if (val == null) return "";
  return String(val)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[\u2013\u2014]/g, "-")
    .replace(/['']/g, "'");
}

/**
 * Normalise an array of specialty/style values.
 * Removes nulls, empty strings, duplicates.
 *
 * @param {string[]} arr — raw specialties array from listing
 * @returns {string[]} cleaned array with original casing preserved
 */
export function normaliseSpecialties(arr) {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];
  for (const s of arr) {
    if (s == null || String(s).trim() === "") continue;
    const norm = normaliseFilterValue(s);
    if (!seen.has(norm)) {
      seen.add(norm);
      result.push(String(s).trim()); // preserve original casing for display
    }
  }
  return result;
}

/**
 * Normalise a price label to a consistent format.
 * Handles: "£", "££", "£££", "££££", and equivalents with €/$
 *
 * @param {string} val — raw price label
 * @returns {string} normalised price label
 */
export function normalisePriceLabel(val) {
  if (!val) return "";
  const stripped = String(val).replace(/[^£€$]/g, "");
  if (stripped.length === 0) return String(val).trim();
  // Count currency symbols
  const count = stripped.length;
  const symbol = stripped[0];
  return symbol.repeat(Math.min(count, 4)); // cap at 4
}

/**
 * Check if two normalised values match.
 * Supports partial matching for array fields (specialty "Fine Art" matches "Fine Art Editorial").
 *
 * @param {string} filterVal  — normalised filter value
 * @param {string} fieldVal   — normalised field value
 * @param {boolean} [partial] — allow partial match (default false)
 * @returns {boolean}
 */
export function matchesFilter(filterVal, fieldVal, partial = false) {
  if (!filterVal || !fieldVal) return false;
  if (partial) return fieldVal.includes(filterVal);
  return fieldVal === filterVal;
}
