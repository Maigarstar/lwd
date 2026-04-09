// ═══════════════════════════════════════════════════════════════════════════════
// Premium Card Service
// ═══════════════════════════════════════════════════════════════════════════════
// Unified data pipeline for premium card sections (Latest, Signature, Featured)
// Fetches listing IDs from Supabase admin config, enriches with full listing data
// and metadata payload needed for Aura context, tracking, compare, shortlist, enquiry

import { supabase } from "../lib/supabaseClient";

/**
 * Fetch premium card listings by section type
 * @param {string} sectionType - 'latest' | 'featured' | 'signature'
 * @param {string} listingType - 'venue' | 'vendor' | 'planner'
 * @returns {Promise<Array>} Array of enriched listing objects
 */
export async function getPremiumListings(sectionType = "latest", listingType = "venue") {
  try {
    // Step 1: Get admin config from homepage_content table
    const config = await getAdminConfig();
    if (!config) {
      console.warn(`[premiumCardService] No admin config found for ${listingType} ${sectionType}`);
      return [];
    }

    // Step 2: Determine which ID array to use based on section + type
    const idFieldMap = {
      venue: {
        featured: "venues_ids",
        signature: "signature_venue_ids",
        latest: null, // Latest comes from DB ordering, not admin IDs
      },
      vendor: {
        featured: "vendor_ids",
        signature: "signature_vendor_ids",
        latest: null,
      },
      planner: {
        featured: "planner_ids",
        signature: "signature_planner_ids",
        latest: null,
      },
    };

    const idField = idFieldMap[listingType]?.[sectionType];
    const ids = idField ? config[idField] : null;

    // Step 3: Fetch full listing data
    let listings = [];
    if (ids && Array.isArray(ids) && ids.length > 0) {
      listings = await fetchListingsByIds(ids, listingType);
    } else if (sectionType === "latest") {
      // Latest sections: fetch from DB ordered by created_at DESC, limit to 5
      listings = await fetchLatestListings(listingType, 5);
    }

    // Step 4: Enrich each listing with metadata payload
    const enriched = listings.map((listing) =>
      enrichListingMetadata(listing, listingType, sectionType)
    );

    return enriched;
  } catch (err) {
    console.error(`[premiumCardService] Failed to fetch ${listingType} ${sectionType}:`, err);
    return [];
  }
}

/**
 * Fetch admin configuration (featured/signature IDs)
 */
async function getAdminConfig() {
  try {
    // Try draft first, then published
    const { data: draft } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("status", "draft")
      .single();

    if (draft) return draft;

    const { data: published } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("status", "published")
      .single();

    return published;
  } catch (err) {
    console.error("[premiumCardService] Failed to fetch admin config:", err);
    return null;
  }
}

/**
 * Fetch specific listings by ID
 */
async function fetchListingsByIds(ids, listingType = "venue") {
  try {
    const tableName = {
      venue: "listings",
      vendor: "vendors",
      planner: "planners",
    }[listingType] || "listings";

    // Fetch all listings first, filter by ID (safety for RLS)
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .in("id", ids);

    if (error) {
      console.error(`[premiumCardService] Failed to fetch ${listingType}s by ID:`, error);
      return [];
    }

    // Preserve the order from the admin-defined IDs array
    const idIndexMap = Object.fromEntries(ids.map((id, i) => [id, i]));
    return (data || []).sort((a, b) => {
      const aIdx = idIndexMap[a.id] ?? 999;
      const bIdx = idIndexMap[b.id] ?? 999;
      return aIdx - bIdx;
    });
  } catch (err) {
    console.error("[premiumCardService] Fetch by IDs failed:", err);
    return [];
  }
}

/**
 * Fetch latest listings (newest first, limited)
 */
async function fetchLatestListings(listingType = "venue", limit = 5) {
  try {
    const tableName = {
      venue: "listings",
      vendor: "vendors",
      planner: "planners",
    }[listingType] || "listings";

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) {
      console.error(`[premiumCardService] Failed to fetch latest ${listingType}s:`, error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error("[premiumCardService] Fetch latest failed:", err);
    return [];
  }
}

/**
 * Enrich listing with complete metadata payload for Aura, tracking, etc.
 * Adds all context needed by cards, tracking, compare, shortlist, enquiry, and map rendering
 */
function enrichListingMetadata(listing, listingType = "venue", sectionType = "latest") {
  // Handle null/undefined
  if (!listing) return null;

  // Extract/compute key fields
  const id = listing.id;
  const slug = listing.slug || listing.name?.toLowerCase().replace(/\s+/g, "-") || `listing-${id}`;

  // Location context
  const city = listing.city || listing.location || "";
  const region = listing.region || listing.area || "";
  const country = listing.country || listing.countrySlug || "";
  const countrySlug = listing.countrySlug || "";
  const regionSlug = listing.regionSlug || "";
  const address = listing.address || listing.full_address || "";

  // Canonical path (depends on listing type)
  const canonicalPath = buildCanonicalPath(listingType, { slug, countrySlug, regionSlug });

  // Featured/Signature flags
  const isFeatured = sectionType === "featured" || listing.featured === true;
  const isSignature = sectionType === "signature" || listing.signature === true;

  // Cards/conversions metadata
  const rating = listing.rating || 0;
  const reviews = listing.reviews || listing.reviewCount || 0;
  const price = listing.price || listing.priceFrom || null;
  const capacity = listing.capacity || listing.guestCapacity || null;
  const styles = Array.isArray(listing.styles) ? listing.styles : [listing.style || ""];

  // Media
  const imgs = listing.imgs || listing.images || [];
  const videoUrl = listing.videoUrl || listing.video || null;

  // Descriptive
  const name = listing.name || "";
  const desc = listing.desc || listing.description || "";
  const tag = listing.tag || (isFeatured ? "Featured" : isSignature ? "Signature" : null);
  const verified = listing.verified === true;

  // Map fields (critical for list view + map rendering)
  const latitude = listing.latitude || listing.lat || null;
  const longitude = listing.longitude || listing.lng || null;
  const mapMarkerTitle = listing.name || "";
  const mapMarkerImage = imgs?.[0] || null;

  return {
    // Core identity
    id,
    slug,
    name,
    desc,

    // Location context
    city,
    region,
    country,
    countrySlug,
    regionSlug,
    address,
    canonicalPath,

    // Category & flags
    category: listingType, // 'venue', 'vendor', 'planner'
    isFeatured,
    isSignature,
    sectionType, // 'latest', 'featured', 'signature'

    // Card display fields
    tag,
    verified,
    rating,
    reviews,
    price,
    priceFrom: price,
    capacity,
    styles,
    imgs,
    videoUrl,

    // Media
    images: imgs,
    video: videoUrl,

    // Map fields (for list view + map rendering)
    latitude,
    longitude,
    mapMarkerTitle,
    mapMarkerImage,

    // Original listing object (for full details)
    _raw: listing,
  };
}

/**
 * Build canonical path for listing type
 * Venue: /[country]/[region]/[slug]
 * Vendor/Planner: /[type]/[slug]
 */
function buildCanonicalPath(listingType, { slug, countrySlug, regionSlug }) {
  if (listingType === "venue") {
    if (countrySlug && regionSlug) {
      return `/${countrySlug}/${regionSlug}/${slug}`;
    } else if (countrySlug) {
      return `/${countrySlug}/${slug}`;
    }
  }

  // Vendor/Planner: /[type]/[slug]
  const typePrefix = listingType === "planner" ? "planner" : "vendor";
  return `/${typePrefix}/${slug}`;
}

/**
 * Fetch a single listing by ID (for studio preview)
 */
export async function getPremiumListingById(id, listingType = "venue") {
  try {
    const tableName = {
      venue: "listings",
      vendor: "vendors",
      planner: "planners",
    }[listingType] || "listings";

    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      console.error("[premiumCardService] Failed to fetch listing:", error);
      return null;
    }

    return enrichListingMetadata(data, listingType, "preview");
  } catch (err) {
    console.error("[premiumCardService] Fetch by ID failed:", err);
    return null;
  }
}

/**
 * Subscribe to admin config changes (real-time updates)
 */
export function subscribeToAdminConfig(callback) {
  const subscription = supabase
    .from("homepage_content")
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}
