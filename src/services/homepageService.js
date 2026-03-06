// ═══════════════════════════════════════════════════════════════════════════════
// Homepage Content Service
// ═══════════════════════════════════════════════════════════════════════════════
import { supabase } from "../lib/supabaseClient";
import { DEFAULT_HOMEPAGE_CONTENT } from "../data/homepageDefaults";

/**
 * Fetch published homepage content
 * Falls back to defaults if no published content exists
 */
export async function getPublishedContent() {
  try {
    const { data, error } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("status", "published")
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows found (expected on first load)
      console.warn("Error fetching published content:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("Published content fetch failed:", err);
    return null;
  }
}

/**
 * Fetch draft content (for admin editor)
 */
export async function getDraftContent() {
  try {
    const { data, error } = await supabase
      .from("homepage_content")
      .select("*")
      .eq("status", "draft")
      .single();

    if (error && error.code !== "PGRST116") {
      console.warn("Error fetching draft content:", error);
      return null;
    }

    return data || null;
  } catch (err) {
    console.error("Draft content fetch failed:", err);
    return null;
  }
}

/**
 * Save or update draft content
 * Creates new row if doesn't exist, updates if does
 */
export async function saveDraft(contentData) {
  try {
    // Try to find existing draft
    const { data: existing } = await supabase
      .from("homepage_content")
      .select("id")
      .eq("status", "draft")
      .single();

    let result;

    if (existing?.id) {
      // Update existing draft
      result = await supabase
        .from("homepage_content")
        .update({
          ...contentData,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select();
    } else {
      // Create new draft
      result = await supabase
        .from("homepage_content")
        .insert([
          {
            ...contentData,
            status: "draft",
          },
        ])
        .select();
    }

    if (result.error) {
      throw result.error;
    }

    return result.data?.[0] || null;
  } catch (err) {
    console.error("Save draft failed:", err);
    throw err;
  }
}

/**
 * Publish draft content
 * Sets status to 'published' and published_at timestamp
 */
export async function publishHomepage() {
  try {
    const { data: user } = await supabase.auth.getUser();

    const { data, error } = await supabase
      .from("homepage_content")
      .update({
        status: "published",
        published_at: new Date().toISOString(),
        published_by: user?.user?.id,
      })
      .eq("status", "draft")
      .select();

    if (error) {
      throw error;
    }

    return data?.[0] || null;
  } catch (err) {
    console.error("Publish failed:", err);
    throw err;
  }
}

/**
 * Get content for preview
 * Shows draft if available, falls back to published, then defaults
 */
export async function getPreviewContent() {
  const draft = await getDraftContent();
  if (draft) return draft;

  const published = await getPublishedContent();
  if (published) return published;

  return null; // Will be handled by component fallback
}

/**
 * Merge content with defaults (fill in missing fields)
 */
export function mergeWithDefaults(content) {
  if (!content) return DEFAULT_HOMEPAGE_CONTENT;

  return {
    // Hero
    hero_title: content.hero_title || DEFAULT_HOMEPAGE_CONTENT.hero_title,
    hero_subtitle:
      content.hero_subtitle || DEFAULT_HOMEPAGE_CONTENT.hero_subtitle,
    hero_cta_text: content.hero_cta_text || DEFAULT_HOMEPAGE_CONTENT.hero_cta_text,
    hero_cta_link: content.hero_cta_link || DEFAULT_HOMEPAGE_CONTENT.hero_cta_link,
    hero_image_url:
      content.hero_image_url || DEFAULT_HOMEPAGE_CONTENT.hero_image_url,

    // Destination Strip
    destination_heading:
      content.destination_heading ||
      DEFAULT_HOMEPAGE_CONTENT.destination_heading,
    destination_subtitle:
      content.destination_subtitle ||
      DEFAULT_HOMEPAGE_CONTENT.destination_subtitle,
    destination_ids:
      content.destination_ids || DEFAULT_HOMEPAGE_CONTENT.destination_ids,

    // Featured Venues
    venues_heading:
      content.venues_heading || DEFAULT_HOMEPAGE_CONTENT.venues_heading,
    venues_subtitle:
      content.venues_subtitle || DEFAULT_HOMEPAGE_CONTENT.venues_subtitle,
    venues_ids: content.venues_ids || DEFAULT_HOMEPAGE_CONTENT.venues_ids,

    // Signature
    signature_heading:
      content.signature_heading || DEFAULT_HOMEPAGE_CONTENT.signature_heading,
    signature_subtitle:
      content.signature_subtitle ||
      DEFAULT_HOMEPAGE_CONTENT.signature_subtitle,
    signature_venue_ids:
      content.signature_venue_ids ||
      DEFAULT_HOMEPAGE_CONTENT.signature_venue_ids,

    // Vendor Section
    vendor_heading:
      content.vendor_heading || DEFAULT_HOMEPAGE_CONTENT.vendor_heading,
    vendor_subtitle:
      content.vendor_subtitle || DEFAULT_HOMEPAGE_CONTENT.vendor_subtitle,
    vendor_ids: content.vendor_ids || DEFAULT_HOMEPAGE_CONTENT.vendor_ids,

    // Newsletter
    newsletter_heading:
      content.newsletter_heading ||
      DEFAULT_HOMEPAGE_CONTENT.newsletter_heading,
    newsletter_subtitle:
      content.newsletter_subtitle ||
      DEFAULT_HOMEPAGE_CONTENT.newsletter_subtitle,
    newsletter_button_text:
      content.newsletter_button_text ||
      DEFAULT_HOMEPAGE_CONTENT.newsletter_button_text,
  };
}

/**
 * Subscribe to homepage content changes (real-time updates)
 * Useful for admin preview updates
 */
export function subscribeToHomepageChanges(callback) {
  const subscription = supabase
    .from("homepage_content")
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return () => subscription.unsubscribe();
}
