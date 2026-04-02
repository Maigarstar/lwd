// ═══════════════════════════════════════════════════════════════════════════
// Category Content Service
// Manages persistence of category content (hero, featured, SEO) to/from Supabase
// Mirrors locationContentService.js pattern
// ═══════════════════════════════════════════════════════════════════════════

import { supabase } from "../lib/supabaseClient";

/**
 * Build category_key from type and slugs
 * Format: "parent:photographers" or "sub:photographers:documentary"
 */
export function buildCategoryKey(categoryType, parentSlug, subSlug = null) {
  if (categoryType === "parent") return `parent:${parentSlug}`;
  if (categoryType === "sub" && subSlug) return `sub:${parentSlug}:${subSlug}`;
  return null;
}

/**
 * Parse category_key into components
 * Returns { type, parentSlug, subSlug }
 */
export function parseCategoryKey(categoryKey) {
  if (!categoryKey) return null;
  const parts = categoryKey.split(":");
  if (parts[0] === "parent") {
    return { type: "parent", parentSlug: parts[1], subSlug: null };
  }
  if (parts[0] === "sub") {
    return { type: "sub", parentSlug: parts[1], subSlug: parts[2] };
  }
  return null;
}

/**
 * Fetch category content from Supabase
 */
export async function fetchCategoryContent(categoryKey) {
  try {
    const { data, error } = await supabase
      .from("category_content")
      .select("*")
      .eq("category_key", categoryKey)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("[categoryContentService] fetch error:", error);
      return null;
    }
    return data || null;
  } catch (err) {
    console.error("[categoryContentService] fetch exception:", err);
    return null;
  }
}

/**
 * Save category content to Supabase (insert or update)
 */
export async function saveCategoryContent(contentData) {
  try {
    const {
      categoryKey,
      categoryType,
      parentSlug,
      subSlug,
      heroTitle,
      heroSubtitle,
      heroImage,
      heroVideo,
      ctaText,
      ctaLink,
      featuredVendorsTitle,
      featuredVendorIds,
      featuredVenuesTitle,
      featuredVenueIds,
      schemaType,
      schemaJson,
      metadata,
      published,
      // SEO
      seoTitle,
      seoDescription,
      seoKeywords,
      seoCanonicalUrl,
      seoRobotsIndex,
      seoRobotsFollow,
      ogTitle,
      ogDescription,
      ogImage,
      twitterTitle,
      twitterDescription,
      twitterImage,
      seoPrimaryKeyword,
      seoSecondaryKeywords,
    } = contentData;

    const existing = await fetchCategoryContent(categoryKey);

    const seoFields = { seoTitle, seoDescription, seoKeywords, seoCanonicalUrl, seoRobotsIndex, seoRobotsFollow, ogTitle, ogDescription, ogImage, twitterTitle, twitterDescription, twitterImage, seoPrimaryKeyword, seoSecondaryKeywords };
    const anySeoProvided = Object.values(seoFields).some(v => v !== undefined);

    const payload = {
      category_key: categoryKey,
      category_type: categoryType,
      parent_slug: parentSlug,
      sub_slug: subSlug || null,
      hero_title: heroTitle || null,
      hero_subtitle: heroSubtitle || null,
      hero_image: heroImage || null,
      hero_video: heroVideo || null,
      cta_text: ctaText || "Browse Vendors",
      cta_link: ctaLink || "#",
      featured_vendors_title: featuredVendorsTitle || "Featured Vendors",
      featured_vendors: featuredVendorIds?.length > 0 ? JSON.stringify(featuredVendorIds) : "[]",
      featured_venues_title: featuredVenuesTitle || "Signature Venues",
      featured_venues: featuredVenueIds?.length > 0 ? JSON.stringify(featuredVenueIds) : "[]",
      schema_type: schemaType || "Service",
      schema_json: schemaJson ? JSON.stringify(schemaJson) : null,
      metadata: metadata ? JSON.stringify(metadata) : "{}",
      published: published !== undefined ? published : false,
      // SEO
      seo_title: seoTitle ?? null,
      seo_description: seoDescription ?? null,
      seo_keywords: seoKeywords ?? null,
      seo_canonical_url: seoCanonicalUrl ?? null,
      seo_robots_index: seoRobotsIndex !== undefined ? seoRobotsIndex : true,
      seo_robots_follow: seoRobotsFollow !== undefined ? seoRobotsFollow : true,
      og_title: ogTitle ?? null,
      og_description: ogDescription ?? null,
      og_image: ogImage ?? null,
      twitter_title: twitterTitle ?? null,
      twitter_description: twitterDescription ?? null,
      twitter_image: twitterImage ?? null,
      seo_primary_keyword: seoPrimaryKeyword ?? null,
      seo_secondary_keywords: seoSecondaryKeywords ?? null,
      ...(anySeoProvided ? { last_seo_updated_at: new Date().toISOString() } : {}),
    };

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from("category_content")
        .update(payload)
        .eq("category_key", categoryKey)
        .select();
      if (error) {
        console.error("[categoryContentService] update error:", error);
        return { error };
      }
      result = data?.[0] || null;
    } else {
      const { data, error } = await supabase
        .from("category_content")
        .insert([payload])
        .select();
      if (error) {
        console.error("[categoryContentService] insert error:", error);
        return { error };
      }
      result = data?.[0] || null;
    }

    return { data: result, error: null };
  } catch (err) {
    console.error("[categoryContentService] save exception:", err);
    return { error: err };
  }
}

/**
 * Publish category content
 */
export async function publishCategoryContent(categoryKey) {
  try {
    const { data, error } = await supabase
      .from("category_content")
      .update({ published: true, published_at: new Date().toISOString() })
      .eq("category_key", categoryKey)
      .select();
    if (error) {
      console.error("[categoryContentService] publish error:", error);
      return { error };
    }
    return { data: data?.[0], error: null };
  } catch (err) {
    console.error("[categoryContentService] publish exception:", err);
    return { error: err };
  }
}

/**
 * Unpublish category content
 */
export async function unpublishCategoryContent(categoryKey) {
  try {
    const { data, error } = await supabase
      .from("category_content")
      .update({ published: false })
      .eq("category_key", categoryKey)
      .select();
    if (error) return { error };
    return { data: data?.[0], error: null };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Delete category content
 */
export async function deleteCategoryContent(categoryKey) {
  try {
    const { error } = await supabase
      .from("category_content")
      .delete()
      .eq("category_key", categoryKey);
    if (error) return { error };
    return { data: true, error: null };
  } catch (err) {
    return { error: err };
  }
}

/**
 * Fetch all category content records (for admin listing)
 */
export async function fetchAllCategoryContent(categoryType = null) {
  try {
    let query = supabase.from("category_content").select("*").order("parent_slug");
    if (categoryType) query = query.eq("category_type", categoryType);
    const { data, error } = await query;
    if (error) {
      console.error("[categoryContentService] fetchAll error:", error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error("[categoryContentService] fetchAll exception:", err);
    return [];
  }
}
