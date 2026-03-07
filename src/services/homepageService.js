// ═══════════════════════════════════════════════════════════════════════════════
// Homepage Content Service
// ═══════════════════════════════════════════════════════════════════════════════

import { supabase } from "../lib/supabaseClient";

const TABLE_NAME = "homepage_content";

/**
 * Get the current draft homepage content
 */
export async function getDraftContent() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("status", "draft")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching draft:", error);
      throw error;
    }

    return data || null;
  } catch (err) {
    console.error("getDraftContent error:", err);
    return null;
  }
}

/**
 * Get the published homepage content
 */
export async function getPublishedContent() {
  try {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*")
      .eq("status", "published")
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching published:", error);
      throw error;
    }

    return data || null;
  } catch (err) {
    console.error("getPublishedContent error:", err);
    return null;
  }
}

/**
 * Save draft homepage content
 */
export async function saveDraft(content) {
  try {
    // Check if draft exists
    const existing = await getDraftContent();

    if (existing) {
      // Update existing draft
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          ...content,
          status: "draft",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new draft
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            ...content,
            status: "draft",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.error("saveDraft error:", err);
    throw err;
  }
}

/**
 * Publish homepage (copy draft to published)
 */
export async function publishHomepage() {
  try {
    const draft = await getDraftContent();
    if (!draft) {
      throw new Error("No draft content to publish");
    }

    const published = await getPublishedContent();

    if (published) {
      // Update existing published version
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update({
          ...draft,
          status: "published",
          updated_at: new Date().toISOString(),
        })
        .eq("id", published.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Create new published version
      const { data, error } = await supabase
        .from(TABLE_NAME)
        .insert([
          {
            ...draft,
            status: "published",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  } catch (err) {
    console.error("publishHomepage error:", err);
    throw err;
  }
}
