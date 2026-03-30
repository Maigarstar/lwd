/**
 * Geo-location Service
 * Detects user's country via IP geolocation (no browser permissions)
 * Used for smart venue reordering (local first, global second)
 */

const GEO_CACHE_KEY = 'lwd_user_country';
const GEO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Get user's country code from IP address
 * Uses ipapi.co (free, no API key required)
 * Caches result for 24 hours
 * @returns {Promise<string|null>} Country code (e.g., 'IT', 'US', 'FR') or null if detection fails
 */
export async function getUserCountryFromIP() {
  try {
    // Check cache first
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (cached) {
      const { countryCode, timestamp } = JSON.parse(cached);
      if (Date.now() - timestamp < GEO_CACHE_TTL) {
        return countryCode;
      }
    }

    // Fetch country from IP
    const response = await fetch('https://ipapi.co/json/', { timeout: 5000 });
    if (!response.ok) throw new Error('IP geolocation failed');

    const data = await response.json();
    const countryCode = data.country_code || null;

    // Cache the result
    if (countryCode) {
      localStorage.setItem(
        GEO_CACHE_KEY,
        JSON.stringify({ countryCode, timestamp: Date.now() })
      );
    }

    return countryCode;
  } catch (error) {
    console.warn('[GeoLocation] Failed to detect country:', error.message);
    return null;
  }
}

/**
 * Clear the cached country (for testing/resetting)
 */
export function clearGeoCache() {
  localStorage.removeItem(GEO_CACHE_KEY);
}

/**
 * Sort venues by country priority
 * User's country venues first, then rest of world
 * @param {Array} venues - Array of venue objects
 * @param {string|null} userCountryCode - User's country code (e.g., 'IT')
 * @param {string} countryField - Field name in venue object that contains country code (default: 'countrySlug')
 * @returns {Array} Reordered venues array
 */
export function sortByCountryPriority(venues, userCountryCode, countryField = 'countrySlug') {
  if (!venues || !Array.isArray(venues) || !userCountryCode) {
    return venues;
  }

  const userCountryUpper = userCountryCode.toUpperCase();

  const userCountryVenues = venues.filter(
    (v) => v[countryField]?.toUpperCase?.() === userCountryUpper
  );

  const otherVenues = venues.filter(
    (v) => v[countryField]?.toUpperCase?.() !== userCountryUpper
  );

  return [...userCountryVenues, ...otherVenues];
}
