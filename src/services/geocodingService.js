// ─── src/services/geocodingService.js ─────────────────────────────────────
// Shared geocoding utility — Nominatim with session cache, rate limiting
// Used by MASTERMap and any future map components

const GEO_CACHE = {};
const NOMINATIM_DELAY = 1100; // ms between requests (Nominatim guideline: 1/sec)

/**
 * Geocode a single item using Nominatim
 * Tries multiple query patterns: name+city+country → name+region+country → name+country → region+country
 * Results cached for the session.
 * @param {Object} item - venue/vendor object with name, city, region, country/countrySlug
 * @returns {Promise<{lat, lng}|null>}
 */
export async function geocodeItem(item) {
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
        const coords = { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
        GEO_CACHE[cacheKey] = coords;
        return coords;
      }
    } catch (err) {
      // Silently continue to next query on error
    }
  }

  // All queries exhausted, no result
  return null;
}

/**
 * Geocode multiple items sequentially with Nominatim rate limiting
 * Fires analytics event for each miss.
 * @param {Array} items - list of venue/vendor objects needing geocoding
 * @param {Function} onGeocode - callback(item, coords) fired on successful geocode
 * @param {Function} onMiss - callback(item) fired on geocode failure
 * @returns {Promise<void>}
 */
export async function geocodeItemsBatch(items, onGeocode, onMiss) {
  for (const item of items) {
    const coords = await geocodeItem(item);
    if (coords) {
      onGeocode?.(item, coords);
    } else {
      onMiss?.(item);
    }
  }
}

/**
 * Clear the geocoding cache (useful for testing or force-refresh)
 */
export function clearGeocodeCache() {
  Object.keys(GEO_CACHE).forEach((k) => delete GEO_CACHE[k]);
}

/**
 * Get cache statistics
 * @returns {Object} { size, keys }
 */
export function getGeocacheMeta() {
  return {
    size: Object.keys(GEO_CACHE).length,
    keys: Object.keys(GEO_CACHE),
  };
}
