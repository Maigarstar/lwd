// ─── src/services/shortlistService.js ──────────────────────────────────────
// Shortlist/Favorites service for vendor and venue curation
// Supports both authenticated (user_id) and anonymous (device_id) users

import { supabase } from "../lib/supabaseClient";

/**
 * Get all shortlisted items for a user or device
 * @param {string} userIdOrDeviceId - User ID (authenticated) or Device ID (anonymous)
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getUserShortlist = async (userIdOrDeviceId, isAuthenticated = false) => {
  try {
    const column = isAuthenticated ? "user_id" : "device_id";

    const { data, error } = await supabase
      .from("vendor_shortlists")
      .select("*")
      .eq(column, userIdOrDeviceId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching shortlist:", error);
    return { data: [], error };
  }
};

/**
 * Add an item to the shortlist
 * @param {number} itemId - Vendor/venue ID
 * @param {Object} itemData - Item metadata { id, name, image, category, price, type }
 * @param {string} userIdOrDeviceId - User ID or Device ID
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const addToShortlist = async (itemId, itemData, userIdOrDeviceId, isAuthenticated = false) => {
  try {
    const column = isAuthenticated ? "user_id" : "device_id";

    const { data, error } = await supabase
      .from("vendor_shortlists")
      .insert([
        {
          [column]: userIdOrDeviceId,
          item_id: itemId,
          item_type: itemData.type || "vendor",
          item_name: itemData.name,
          item_image: itemData.image || null,
          item_category: itemData.category || null,
          item_price: itemData.price || null,
        },
      ])
      .select();

    if (error) throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error("Error adding to shortlist:", error);
    return { data: null, error };
  }
};

/**
 * Remove an item from the shortlist
 * @param {number} itemId - Vendor/venue ID
 * @param {string} userIdOrDeviceId - User ID or Device ID
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export const removeFromShortlist = async (itemId, userIdOrDeviceId, isAuthenticated = false) => {
  try {
    const column = isAuthenticated ? "user_id" : "device_id";

    const { data, error } = await supabase
      .from("vendor_shortlists")
      .delete()
      .eq(column, userIdOrDeviceId)
      .eq("item_id", itemId);

    if (error) throw error;

    return { data: { itemId, deleted: true }, error: null };
  } catch (error) {
    console.error("Error removing from shortlist:", error);
    return { data: null, error };
  }
};

/**
 * Check if an item is in the shortlist
 * @param {number} itemId - Vendor/venue ID
 * @param {string} userIdOrDeviceId - User ID or Device ID
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @returns {Promise<{data: boolean, error: Error|null}>}
 */
export const isItemShortlisted = async (itemId, userIdOrDeviceId, isAuthenticated = false) => {
  try {
    const column = isAuthenticated ? "user_id" : "device_id";

    const { data, error } = await supabase
      .from("vendor_shortlists")
      .select("id")
      .eq(column, userIdOrDeviceId)
      .eq("item_id", itemId)
      .maybeSingle();

    if (error) throw error;

    return { data: !!data, error: null };
  } catch (error) {
    console.error("Error checking if item is shortlisted:", error);
    return { data: false, error };
  }
};

/**
 * Get shortlist count for a user or device
 * @param {string} userIdOrDeviceId - User ID or Device ID
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @returns {Promise<{data: number, error: Error|null}>}
 */
export const getShortlistCount = async (userIdOrDeviceId, isAuthenticated = false) => {
  try {
    const column = isAuthenticated ? "user_id" : "device_id";

    const { count, error } = await supabase
      .from("vendor_shortlists")
      .select("*", { count: "exact", head: true })
      .eq(column, userIdOrDeviceId);

    if (error) throw error;

    return { data: count || 0, error: null };
  } catch (error) {
    console.error("Error getting shortlist count:", error);
    return { data: 0, error };
  }
};

/**
 * Clear entire shortlist for a user or device
 * @param {string} userIdOrDeviceId - User ID or Device ID
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @returns {Promise<{data: Object, error: Error|null}>}
 */
export const clearUserShortlist = async (userIdOrDeviceId, isAuthenticated = false) => {
  try {
    const column = isAuthenticated ? "user_id" : "device_id";

    // First get count before deleting
    const { data: countData } = await getShortlistCount(userIdOrDeviceId, isAuthenticated);

    const { error } = await supabase
      .from("vendor_shortlists")
      .delete()
      .eq(column, userIdOrDeviceId);

    if (error) throw error;

    return { data: { cleared: true, count: countData }, error: null };
  } catch (error) {
    console.error("Error clearing shortlist:", error);
    return { data: null, error };
  }
};

/**
 * Subscribe to shortlist changes in real-time
 * @param {string} userIdOrDeviceId - User ID or Device ID
 * @param {boolean} isAuthenticated - Whether this is an authenticated user
 * @param {Function} callback - Called with updated shortlist when changes occur
 * @returns {Function} Unsubscribe function
 */
export const subscribeToShortlist = (userIdOrDeviceId, isAuthenticated = false, callback) => {
  const column = isAuthenticated ? "user_id" : "device_id";

  const subscription = supabase
    .channel(`shortlist_${userIdOrDeviceId}`)
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "vendor_shortlists",
        filter: `${column}=eq.${userIdOrDeviceId}`,
      },
      (payload) => {
        console.log("Shortlist updated:", payload);
        // Fetch updated list and call callback
        getUserShortlist(userIdOrDeviceId, isAuthenticated).then(({ data }) => {
          callback(data);
        });
      }
    )
    .subscribe();

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(subscription);
  };
};
