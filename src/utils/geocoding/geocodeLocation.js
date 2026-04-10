// ─── src/utils/geocoding/geocodeLocation.js ─────────────────────────────────
// Shared location intelligence layer — Nominatim with session cache, rate limiting
// Single source of truth for all map components (MASTERMap, PlannerMapPanel, future v2)
//
// Output contract (immutable):
// {
//   lat: number,
//   lng: number,
//   displayName: string,    // Best human-readable name from Nominatim
//   confidence: number,     // 0-1 based on query specificity + Nominatim importance
//   source: "nominatim" | "fallback" | null
// }

const GEO_CACHE = {};
const NOMINATIM_DELAY = 1100; // ms between requests (Nominatim guideline: 1/sec)

/**
 * Compute confidence score based on query specificity and Nominatim result importance
 * @param {string} originalQuery - the query that was sent
 * @param {Object} nominatimResult - result object from Nominatim API
 * @returns {number} 0-1
 */
function computeConfidence(originalQuery, nominatimResult) {
  if (!nominatimResult) return 0;

  // Importance score from Nominatim (0-1)
  const importance = parseFloat(nominatimResult.importance) || 0.5;

  // Query specificity bonus: specific queries (name+city+country) score higher
  const queryParts = originalQuery.split(",").length;
  const specificity = Math.min(queryParts / 3, 1);

  // Combined confidence
  return Math.round((importance * 0.7 + specificity * 0.3) * 100) / 100;
}

/**
 * Geocode a single location using Nominatim
 * Tries multiple query patterns: name+city+country → name+region+country → name+country → region+country
 * Results cached for the session.
 *
 * @param {Object} item - venue/vendor/planner object with name, city, region, country/countrySlug
 * @returns {Promise<{lat, lng, displayName, confidence, source} | null>}
 */
export async function geocodeLocation(item) {
  const cacheKey = item.id || item.slug || item.name;
  if (GEO_CACHE[cacheKey]) return GEO_CACHE[cacheKey];

  const name    = item.name    || "";
  const city    = item.city    || item.citySlug    || "";
  const region  = item.region  || item.regionSlug  || "";
  const country = item.country || item.countrySlug || "";

  // Build query fallback chain (most specific → least)
  const queries = [];
  if (name && city && country)   queries.push(`${name}, ${city}, ${country}`);
  if (name && region && country) queries.push(`${name}, ${region}, ${country}`);
  if (name && country)           queries.push(`${name}, ${country}`);
  if (region && country)         queries.push(`${region}, ${country}`);

  for (const q of queries) {
    try {
      // Rate limiting: Nominatim expects max 1/sec per client
      await new Promise((r) => setTimeout(r, NOMINATIM_DELAY));

      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`
      );
      const data = await res.json();

      if (data?.[0]) {
        const result = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          displayName: data[0].display_name || q,
          confidence: computeConfidence(q, data[0]),
          source: "nominatim",
        };
        GEO_CACHE[cacheKey] = result;
        return result;
      }
    } catch (err) {
      // Silently continue to next query on error
    }
  }

  // All queries exhausted, no result
  return null;
}

/**
 * Geocode multiple locations sequentially with Nominatim rate limiting
 * Fires callbacks for each result (success or miss).
 *
 * @param {Array} items - list of objects needing geocoding
 * @param {Function} onSuccess - callback(item, result) fired on successful geocode
 * @param {Function} onMiss - callback(item) fired on geocode failure
 * @returns {Promise<void>}
 */
export async function geocodeLocationsBatch(items, onSuccess, onMiss) {
  for (const item of items) {
    const result = await geocodeLocation(item);
    if (result) {
      onSuccess?.(item, result);
    } else {
      onMiss?.(item);
    }
  }
}

/**
 * Clear the geocoding cache (testing/force-refresh utility)
 */
export function clearGeocodeCache() {
  Object.keys(GEO_CACHE).forEach((k) => delete GEO_CACHE[k]);
}

/**
 * Get cache statistics (introspection)
 * @returns {Object} { size, keys }
 */
export function getGeocacheMeta() {
  return {
    size: Object.keys(GEO_CACHE).length,
    keys: Object.keys(GEO_CACHE),
  };
}
