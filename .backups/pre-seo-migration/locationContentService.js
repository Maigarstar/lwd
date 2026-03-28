// ═══════════════════════════════════════════════════════════════════════════
// Location Content Service
// Manages persistence of location content (hero, featured, geography) to/from Supabase
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from "../lib/supabaseClient";

/**
 * Build location_key from location type and slug
 * Format: "country:italy", "region:italy:tuscany", "city:italy:tuscany:siena"
 */
export function buildLocationKey(locationType, locationSlug, parentSlug1 = null, parentSlug2 = null) {
  if (locationType === "country") return `country:${locationSlug}`;
  if (locationType === "region") return `region:${parentSlug1}:${locationSlug}`;
  if (locationType === "city") return `city:${parentSlug1}:${parentSlug2}:${locationSlug}`;
  return null;
}

/**
 * Parse location_key into components
 * Returns { type, slug, countrySlug, regionSlug }
 */
export function parseLocationKey(locationKey) {
  const parts = locationKey.split(":");
  if (parts[0] === "country") {
    return { type: "country", slug: parts[1], countrySlug: parts[1] };
  }
  if (parts[0] === "region") {
    return { type: "region", slug: parts[2], countrySlug: parts[1], regionSlug: parts[2] };
  }
  if (parts[0] === "city") {
    return { type: "city", slug: parts[3], countrySlug: parts[1], regionSlug: parts[2], citySlug: parts[3] };
  }
  return null;
}

/**
 * Check if a location exists in Supabase (published or draft)
 * OPTION A: Supabase as primary source of truth
 * @param {string} locationKey - e.g., "country:thailand"
 * @returns {Promise<Object>} Location record or null if not found
 */
export async function fetchLocationMetadata(locationKey) {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("location_key, location_type, country_slug, region_slug, city_slug, published, created_at")
      .eq("location_key", locationKey)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[locationContentService] fetchLocationMetadata error:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("[locationContentService] fetchLocationMetadata exception:", err);
    return null;
  }
}

/**
 * Fetch location content from Supabase
 * @param {string} locationKey - e.g., "country:italy", "region:italy:tuscany"
 * @returns {Promise<Object>} Location content object or null if not found
 */
export async function fetchLocationContent(locationKey) {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("location_key", locationKey)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found, which is fine
      console.error("[locationContentService] fetchLocationContent error:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("[locationContentService] fetchLocationContent exception:", err);
    return null;
  }
}

/**
 * Save location content to Supabase (insert or update)
 * @param {Object} contentData - Content form data
 * @returns {Promise<Object>} Saved row or error object
 */
export async function saveLocationContent(contentData) {
  try {
    const {
      locationKey,
      locationType,
      countrySlug,
      regionSlug,
      citySlug,
      heroTitle,
      heroSubtitle,
      heroImage,
      heroVideo,
      ctaText,
      ctaLink,
      featuredVenuesTitle,
      featuredVenueIds,
      featuredVendorsTitle,
      featuredVendorIds,
      mapLat,
      mapLng,
      mapZoom,
      discoveryFilters,
      metadata,
      published,
    } = contentData;

    // Check if location exists
    const existing = await fetchLocationContent(locationKey);

    const payload = {
      location_key: locationKey,
      location_type: locationType,
      country_slug: countrySlug,
      region_slug: regionSlug || null,
      city_slug: citySlug || null,
      hero_title: heroTitle || null,
      hero_subtitle: heroSubtitle || null,
      hero_image: heroImage || null,
      hero_video: heroVideo || null,
      cta_text: ctaText || "Explore Venues",
      cta_link: ctaLink || "#",
      featured_venues_title: featuredVenuesTitle || "Signature Venues",
      featured_venues: featuredVenueIds && featuredVenueIds.length > 0 ? JSON.stringify(featuredVenueIds) : "[]",
      featured_vendors_title: featuredVendorsTitle || "Top Wedding Planners",
      featured_vendors: featuredVendorIds && featuredVendorIds.length > 0 ? JSON.stringify(featuredVendorIds) : "[]",
      map_lat: mapLat ? parseFloat(mapLat) : null,
      map_lng: mapLng ? parseFloat(mapLng) : null,
      map_zoom: mapZoom ? parseInt(mapZoom) : 8,
      discovery_filters: discoveryFilters ? JSON.stringify(discoveryFilters) : JSON.stringify({
        showCapacityFilter: true,
        showStyleFilter: true,
        showPriceFilter: true,
        defaultSort: "recommended",
      }),
      metadata: metadata ? JSON.stringify(metadata) : JSON.stringify({}),
      published: published !== undefined ? published : false,
    };

    let result;
    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from("locations")
        .update(payload)
        .eq("location_key", locationKey)
        .select();

      if (error) {
        console.error("[locationContentService] Update error:", error);
        return { error };
      }
      result = data?.[0] || null;
    } else {
      // Insert new
      const { data, error } = await supabase
        .from("locations")
        .insert([payload])
        .select();

      if (error) {
        console.error("[locationContentService] Insert error:", error);
        return { error };
      }
      result = data?.[0] || null;
    }

    return { data: result, error: null };
  } catch (err) {
    console.error("[locationContentService] saveLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Delete location content from Supabase
 * @param {string} locationKey - e.g., "country:italy"
 * @returns {Promise<Object>} Success or error
 */
export async function deleteLocationContent(locationKey) {
  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("location_key", locationKey);

    if (error) {
      console.error("[locationContentService] Delete error:", error);
      return { error };
    }

    return { success: true };
  } catch (err) {
    console.error("[locationContentService] deleteLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Publish location content (set published=true and published_at=now)
 * @param {string} locationKey
 * @returns {Promise<Object>} Updated row or error
 */
export async function publishLocationContent(locationKey) {
  try {
    const { data, error } = await supabase
      .from("locations")
      .update({
        published: true,
        published_at: new Date().toISOString(),
      })
      .eq("location_key", locationKey)
      .select();

    if (error) {
      console.error("[locationContentService] Publish error:", error);
      return { error };
    }

    return { data: data?.[0] || null };
  } catch (err) {
    console.error("[locationContentService] publishLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Unpublish location content
 * @param {string} locationKey
 * @returns {Promise<Object>} Updated row or error
 */
export async function unpublishLocationContent(locationKey) {
  try {
    const { data, error } = await supabase
      .from("locations")
      .update({
        published: false,
        published_at: null,
      })
      .eq("location_key", locationKey)
      .select();

    if (error) {
      console.error("[locationContentService] Unpublish error:", error);
      return { error };
    }

    return { data: data?.[0] || null };
  } catch (err) {
    console.error("[locationContentService] unpublishLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Fetch all locations by type and country
 * Used for admin listing/bulk operations
 * @param {string} locationType - "country", "region", or "city"
 * @param {string} countrySlug - optional country filter
 * @returns {Promise<Array>} Array of location rows
 */
export async function fetchLocationsByType(locationType, countrySlug = null) {
  try {
    let query = supabase
      .from("locations")
      .select("*")
      .eq("location_type", locationType);

    if (countrySlug) {
      query = query.eq("country_slug", countrySlug);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[locationContentService] fetchLocationsByType error:", error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[locationContentService] fetchLocationsByType exception:", err);
    return [];
  }
}
