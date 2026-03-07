/**
 * Real Wedding Service
 * Handles CRUD operations for real weddings and vendor credits
 */

import { supabase } from "../lib/supabaseClient";

/**
 * Get all published real weddings
 */
export const getAllRealWeddings = async (filters = {}) => {
  try {
    let query = supabase
      .from("real_weddings")
      .select("*")
      .eq("status", "published");

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }

    if (filters.featured) {
      query = query.eq("featured", true);
    }

    const { data, error } = await query.order("wedding_date", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching real weddings:", error);
    return { data: [], error };
  }
};

/**
 * Get single real wedding by slug with vendor credits
 */
export const getRealWeddingBySlug = async (slug) => {
  try {
    const { data: wedding, error: weddingError } = await supabase
      .from("real_weddings")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .single();

    if (weddingError) throw weddingError;

    // Get vendor credits for this wedding
    const { data: vendors, error: vendorsError } = await supabase
      .from("real_wedding_vendors")
      .select("*")
      .eq("real_wedding_id", wedding.id)
      .order("created_at");

    if (vendorsError) throw vendorsError;

    return {
      data: {
        ...wedding,
        vendors: vendors || [],
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching real wedding:", error);
    return { data: null, error };
  }
};

/**
 * Search real weddings by title, location, or description
 */
export const searchRealWeddings = async (query) => {
  try {
    if (!query.trim()) {
      return { data: [], error: null };
    }

    const searchQuery = `%${query}%`;
    const { data, error } = await supabase
      .from("real_weddings")
      .select("*")
      .eq("status", "published")
      .or(
        `title.ilike.${searchQuery},location.ilike.${searchQuery},description.ilike.${searchQuery}`
      )
      .order("wedding_date", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error searching real weddings:", error);
    return { data: [], error };
  }
};

/**
 * Get featured real weddings (for homepage)
 */
export const getFeaturedRealWeddings = async (limit = 3) => {
  try {
    const { data, error } = await supabase
      .from("real_weddings")
      .select("*")
      .eq("status", "published")
      .eq("featured", true)
      .order("wedding_date", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching featured real weddings:", error);
    return { data: [], error };
  }
};

/**
 * Get real weddings by location
 */
export const getRealWeddingsByLocation = async (location) => {
  try {
    const { data, error } = await supabase
      .from("real_weddings")
      .select("*")
      .eq("status", "published")
      .ilike("location", `%${location}%`)
      .order("wedding_date", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching weddings by location:", error);
    return { data: [], error };
  }
};

/**
 * Get vendor credits for a real wedding
 */
export const getRealWeddingVendors = async (realWeddingId) => {
  try {
    const { data, error } = await supabase
      .from("real_wedding_vendors")
      .select("*")
      .eq("real_wedding_id", realWeddingId)
      .order("created_at");

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching wedding vendors:", error);
    return { data: [], error };
  }
};

/**
 * Get all locations with real weddings (for filter dropdown)
 */
export const getAllRealWeddingLocations = async () => {
  try {
    const { data, error } = await supabase
      .from("real_weddings")
      .select("location")
      .eq("status", "published")
      .not("location", "is", null);

    if (error) throw error;

    // Extract unique locations
    const locations = [...new Set(data?.map((w) => w.location) || [])];
    return { data: locations.sort(), error: null };
  } catch (error) {
    console.error("Error fetching locations:", error);
    return { data: [], error };
  }
};

/**
 * Get paginated real weddings
 */
export const getPaginatedRealWeddings = async (page = 1, pageSize = 12, filters = {}) => {
  try {
    const offset = (page - 1) * pageSize;

    let query = supabase
      .from("real_weddings")
      .select("*", { count: "exact" })
      .eq("status", "published");

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }

    if (filters.featured) {
      query = query.eq("featured", true);
    }

    const { data, error, count } = await query
      .order("wedding_date", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    return {
      data: data || [],
      count: count || 0,
      totalPages: Math.ceil((count || 0) / pageSize),
      currentPage: page,
      error: null,
    };
  } catch (error) {
    console.error("Error fetching paginated weddings:", error);
    return {
      data: [],
      count: 0,
      totalPages: 0,
      currentPage: page,
      error,
    };
  }
};

/**
 * Subscribe to real wedding updates (for future real-time features)
 */
export const subscribeToRealWeddings = (callback) => {
  const subscription = supabase
    .from("real_weddings:status=eq.published")
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
};
