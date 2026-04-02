// ═══════════════════════════════════════════════════════════════════════════
// Location Content Service
// Manages persistence of location content to/from Supabase.
// Supports two page types:
//   hub      — country, region, city pages (/england/london)
//   category — region×category pages (/vendors/lake-como/wedding-planners)
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from "../lib/supabaseClient";

// ─── Location Key Builders ───────────────────────────────────────────────────

/**
 * Build location_key from type + slugs
 * Formats:
 *   "country:italy"
 *   "region:italy:tuscany"
 *   "city:italy:tuscany:siena"
 *   "category:italy:lake-como:wedding-planners"
 */
export function buildLocationKey(locationType, locationSlug, parentSlug1 = null, parentSlug2 = null) {
  if (locationType === "country")  return `country:${locationSlug}`;
  if (locationType === "region")   return `region:${parentSlug1}:${locationSlug}`;
  if (locationType === "city")     return `city:${parentSlug1}:${parentSlug2}:${locationSlug}`;
  if (locationType === "category") return `category:${parentSlug1}:${parentSlug2}:${locationSlug}`;
  return null;
}

/**
 * Parse location_key into components
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
  if (parts[0] === "category") {
    return { type: "category", slug: parts[3], countrySlug: parts[1], regionSlug: parts[2], categorySlug: parts[3] };
  }
  return null;
}

// ─── Fetch ───────────────────────────────────────────────────────────────────

/**
 * Fetch one location row by key
 */
export async function fetchLocationContent(locationKey) {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .eq("location_key", locationKey)
      .single();

    if (error && error.code !== "PGRST116") {
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
 * Fetch all location rows (for studio list view)
 * Optionally filter by page_type ("hub" | "category")
 */
export async function fetchAllLocations(pageType = null) {
  try {
    let query = supabase
      .from("locations")
      .select("location_key, location_type, page_type, country_slug, region_slug, city_slug, category_slug, hero_title, published, updated_at")
      .order("updated_at", { ascending: false });

    if (pageType) query = query.eq("page_type", pageType);

    const { data, error } = await query;
    if (error) {
      console.error("[locationContentService] fetchAllLocations error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[locationContentService] fetchAllLocations exception:", err);
    return [];
  }
}

/**
 * Fetch all locations of a given type + optional country filter
 */
export async function fetchLocationsByType(locationType, countrySlug = null) {
  try {
    let query = supabase
      .from("locations")
      .select("*")
      .eq("location_type", locationType);

    if (countrySlug) query = query.eq("country_slug", countrySlug);

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

// ─── Save / Draft / Publish ───────────────────────────────────────────────────

/**
 * Build DB payload from content form data
 * Shared by saveLocationContent and saveLocationDraft
 */
function buildPayload(contentData) {
  const {
    locationKey,
    locationType,
    pageType = "hub",
    countrySlug,
    regionSlug,
    citySlug,
    categorySlug,
    // Core fields (DB columns)
    heroTitle,
    heroSubtitle,
    heroImage,
    heroVideo,
    ctaText,
    ctaLink,
    featuredVenueIds,
    featuredVendorIds,
    featuredVenuesTitle,
    featuredVendorsTitle,
    mapLat,
    mapLng,
    mapZoom,
    discoveryFilters,
    // Section visibility
    sectionVisibility,
    // All extended content goes into metadata
    ...rest
  } = contentData;

  // Strip internal keys that shouldn't go into metadata
  const { locationKey: _lk, locationType: _lt, pageType: _pt, countrySlug: _cs,
    regionSlug: _rs, citySlug: _ci, categorySlug: _ca, ...metaFields } = contentData;

  // Build metadata from everything not in a dedicated column
  const metaOnly = { ...rest };
  // Remove dedicated column keys from metaOnly
  [
    "heroTitle","heroSubtitle","heroImage","heroVideo","ctaText","ctaLink",
    "featuredVenueIds","featuredVendorIds","featuredVenuesTitle","featuredVendorsTitle",
    "mapLat","mapLng","mapZoom","discoveryFilters","sectionVisibility",
  ].forEach((k) => delete metaOnly[k]);

  return {
    location_key:    locationKey,
    location_type:   locationType,
    page_type:       pageType,
    country_slug:    countrySlug,
    region_slug:     regionSlug || null,
    city_slug:       citySlug   || null,
    category_slug:   categorySlug || null,
    hero_title:      heroTitle    || null,
    hero_subtitle:   heroSubtitle || null,
    hero_image:      heroImage    || null,
    hero_video:      heroVideo    || null,
    cta_text:        ctaText      || "Explore Venues",
    cta_link:        ctaLink      || "#",
    featured_venues_title:  featuredVenuesTitle  || "Signature Venues",
    featured_vendors_title: featuredVendorsTitle || "Top Wedding Planners",
    featured_venues:  featuredVenueIds  && featuredVenueIds.length  > 0 ? JSON.stringify(featuredVenueIds)  : "[]",
    featured_vendors: featuredVendorIds && featuredVendorIds.length > 0 ? JSON.stringify(featuredVendorIds) : "[]",
    map_lat:  mapLat  ? parseFloat(mapLat)  : null,
    map_lng:  mapLng  ? parseFloat(mapLng)  : null,
    map_zoom: mapZoom ? parseInt(mapZoom)   : 8,
    discovery_filters: discoveryFilters ? JSON.stringify(discoveryFilters) : JSON.stringify({
      showCapacityFilter: true, showStyleFilter: true, showPriceFilter: true, defaultSort: "recommended",
    }),
    section_visibility: sectionVisibility ? JSON.stringify(sectionVisibility) : "{}",
    metadata: JSON.stringify(metaOnly),
  };
}

/**
 * Save location content (insert or update).
 * Does NOT change published state.
 */
export async function saveLocationContent(contentData) {
  try {
    const existing = await fetchLocationContent(contentData.locationKey);
    const payload = buildPayload(contentData);
    // Preserve published state on save
    if (existing) delete payload.published;

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("locations")
        .update(payload)
        .eq("location_key", contentData.locationKey)
        .select();
      if (error) { console.error("[locationContentService] Update error:", error); return { error }; }
      result = data?.[0] || null;
    } else {
      const { data, error } = await supabase
        .from("locations")
        .insert([{ ...payload, published: false }])
        .select();
      if (error) { console.error("[locationContentService] Insert error:", error); return { error }; }
      result = data?.[0] || null;
    }
    return { data: result, error: null };
  } catch (err) {
    console.error("[locationContentService] saveLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Save draft without touching live/published content.
 * Stores in draft_content column only.
 */
export async function saveLocationDraft(locationKey, draftData) {
  try {
    const existing = await fetchLocationContent(locationKey);
    if (!existing) {
      // No record yet — do a full save as unpublished
      return saveLocationContent({ ...draftData, locationKey });
    }

    const { error } = await supabase
      .from("locations")
      .update({ draft_content: JSON.stringify(draftData) })
      .eq("location_key", locationKey);

    if (error) { console.error("[locationContentService] saveLocationDraft error:", error); return { error }; }
    return { data: { draft_content: draftData }, error: null };
  } catch (err) {
    console.error("[locationContentService] saveLocationDraft exception:", err);
    return { error: err };
  }
}

/**
 * Publish: promote draft → live metadata, set published = true
 */
export async function publishLocationContent(locationKey) {
  try {
    // Fetch current record
    const existing = await fetchLocationContent(locationKey);
    if (!existing) return { error: new Error("Location not found") };

    const updates = {
      published:    true,
      published_at: new Date().toISOString(),
      draft_content: null,
    };

    // If there's a draft, promote it to live
    if (existing.draft_content) {
      const draft = typeof existing.draft_content === "string"
        ? JSON.parse(existing.draft_content)
        : existing.draft_content;
      const livePayload = buildPayload({ ...draft, locationKey });
      Object.assign(updates, livePayload);
    }
    updates.published = true;
    updates.published_at = new Date().toISOString();
    updates.draft_content = null;

    const { data, error } = await supabase
      .from("locations")
      .update(updates)
      .eq("location_key", locationKey)
      .select();

    if (error) { console.error("[locationContentService] Publish error:", error); return { error }; }
    return { data: data?.[0] || null };
  } catch (err) {
    console.error("[locationContentService] publishLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Unpublish location
 */
export async function unpublishLocationContent(locationKey) {
  try {
    const { data, error } = await supabase
      .from("locations")
      .update({ published: false, published_at: null })
      .eq("location_key", locationKey)
      .select();

    if (error) { console.error("[locationContentService] Unpublish error:", error); return { error }; }
    return { data: data?.[0] || null };
  } catch (err) {
    console.error("[locationContentService] unpublishLocationContent exception:", err);
    return { error: err };
  }
}

/**
 * Delete location content
 */
export async function deleteLocationContent(locationKey) {
  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("location_key", locationKey);

    if (error) { console.error("[locationContentService] Delete error:", error); return { error }; }
    return { success: true };
  } catch (err) {
    console.error("[locationContentService] deleteLocationContent exception:", err);
    return { error: err };
  }
}

// ─── Content Normaliser ───────────────────────────────────────────────────────

/**
 * Normalise a raw DB row into a flat content object ready for the renderers.
 * Merges dedicated columns + metadata JSONB into one object.
 * Used by both LocationPage and LocationBuilder preview.
 */
export function normaliseLocationRow(row) {
  if (!row) return {};
  const raw = row.metadata || {};
  const m = typeof raw === "string" ? JSON.parse(raw) : raw;

  return {
    // Core
    locationKey:  row.location_key,
    locationType: row.location_type,
    pageType:     row.page_type || "hub",
    countrySlug:  row.country_slug,
    regionSlug:   row.region_slug,
    citySlug:     row.city_slug,
    categorySlug: row.category_slug,
    published:    row.published,
    // Hero
    heroTitle:    row.hero_title    || m.heroTitle    || "",
    heroSubtitle: row.hero_subtitle || m.heroSubtitle || "",
    heroImage:    row.hero_image    || m.heroImage    || "",
    heroVideo:    row.hero_video    || m.heroVideo    || "",
    heroImages:   m.heroImages  || [],
    ctaText:      row.cta_text  || "Explore Venues",
    ctaLink:      row.cta_link  || "#",
    // Featured
    featuredVenuesTitle:  row.featured_venues_title  || "Signature Venues",
    featuredVendorsTitle: row.featured_vendors_title || "Top Wedding Planners",
    featuredVenueIds:     row.featured_venues  || [],
    featuredVendorIds:    row.featured_vendors || [],
    // Map
    mapLat:  row.map_lat  || null,
    mapLng:  row.map_lng  || null,
    mapZoom: row.map_zoom || 8,
    discoveryFilters: row.discovery_filters || {},
    // Section visibility
    sectionVisibility: row.section_visibility || {},
    // Hub — info strip
    infoVibes:    m.infoVibes    || [],
    infoServices: m.infoServices || [],
    infoRegions:  m.infoRegions  || [],
    // Hub — editorial split
    showEditorialSplit:     m.showEditorialSplit     !== false,
    editorialEyebrow:       m.editorialEyebrow       || "",
    editorialHeadingPrefix: m.editorialHeadingPrefix || "",
    editorialCtaText:       m.editorialCtaText       || "",
    editorialPara1:         m.editorialPara1         || "",
    editorialPara2:         m.editorialPara2         || "",
    editorialBlocks:        m.editorialBlocks        || [],
    editorialVenueMode:     m.editorialVenueMode     || "latest",
    // Hub — latest strips
    showLatestVenues:      m.showLatestVenues      !== false,
    latestVenuesHeading:   m.latestVenuesHeading   || "",
    latestVenuesSub:       m.latestVenuesSub       || "",
    latestVenuesCardStyle: m.latestVenuesCardStyle || "luxury",
    latestVenuesSelected:  m.latestVenuesSelected  || [],
    showLatestVendors:     m.showLatestVendors     !== false,
    latestVendorsHeading:  m.latestVendorsHeading  || "",
    latestVendorsSub:      m.latestVendorsSub      || "",
    latestVendorsCardStyle: m.latestVendorsCardStyle || "luxury",
    latestVendorsSelected:  m.latestVendorsSelected  || [],
    // Hub — motto
    showMotto:    m.showMotto    !== false,
    motto:        m.motto        || "",
    mottoSubline: m.mottoSubline || "",
    mottoBgImage: m.mottoBgImage || "",
    mottoOverlay: m.mottoOverlay ?? 0.55,
    // Hub — SEO block
    showPlanningGuide: m.showPlanningGuide !== false,
    seoHeading:  m.seoHeading  || "",
    seoContent:  m.seoContent  || "",
    seoFaqs:     m.seoFaqs     || [],
    // Category — editorial intro
    showCategoryEditorial:  m.showCategoryEditorial  !== false,
    categoryEditorialLabel:  m.categoryEditorialLabel  || "Editorial",
    categoryEditorialHeading: m.categoryEditorialHeading || "",
    categoryEditorialBody:   m.categoryEditorialBody   || "",
    // Category — why hire
    showWhyHire:        m.showWhyHire        !== false,
    whyHireLabel:       m.whyHireLabel       || "",
    whyHireHeadline:    m.whyHireHeadline    || "",
    whyHireHeadlineItalic: m.whyHireHeadlineItalic || "",
    whyHirePara1:       m.whyHirePara1       || "",
    whyHirePara2:       m.whyHirePara2       || "",
    whyHireBadges:      m.whyHireBadges      || [],
    // Category — featured strip
    categoryFeaturedHeading: m.categoryFeaturedHeading || "",
    categoryFeaturedSub:     m.categoryFeaturedSub     || "",
    categoryFeaturedIds:     m.categoryFeaturedIds     || [],
    // Category — real weddings
    showRealWeddings:    m.showRealWeddings    !== false,
    realWeddingsLabel:   m.realWeddingsLabel   || "",
    realWeddingsHeading: m.realWeddingsHeading || "",
    realWeddingsPostIds: m.realWeddingsPostIds || [],
    // SEO
    seoTitle:       m.seoTitle       || "",
    seoDescription: m.seoDescription || "",
  };
}
