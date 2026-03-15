import { supabase } from "../lib/supabaseClient";

/**
 * Couple Dashboard Service
 * Fetches couple profile, shortlist, and enquiry data for the Getting Married dashboard
 * All functions return { data, error } tuple pattern
 */

/**
 * Get couple profile by couple ID
 */
export const getCoupleProfile = async (coupleId) => {
  try {
    const { data, error } = await supabase
      .from("couples")
      .select("*")
      .eq("id", coupleId)
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Get couple's saved vendors (shortlist)
 * Returns saved vendors with their details
 */
export const getCoupleShortlist = async (coupleId) => {
  try {
    const { data, error } = await supabase
      .from("couple_shortlists")
      .select("*")
      .eq("couple_id", coupleId)
      .order("saved_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Get couple's enquiry history
 * Returns all enquiries submitted by the couple to vendors
 */
export const getCoupleEnquiries = async (coupleId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (error) return { data: null, error: error.message };
    return { data: data || [], error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Get couple's enquiries with vendor details
 * Joins vendor info for display in dashboard
 */
export const getCoupleEnquiriesWithVendors = async (coupleId) => {
  try {
    // Query vendor_enquiries for couple's enquiries
    const { data: enquiries, error: enquiriesError } = await supabase
      .from("vendor_enquiries")
      .select("*")
      .eq("couple_id", coupleId)
      .order("created_at", { ascending: false });

    if (enquiriesError) return { data: null, error: enquiriesError.message };

    // For each enquiry, we'd normally join vendor data
    // Since vendors are currently in-memory, this is handled in the component
    return { data: enquiries || [], error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Get enquiry count by status for couple
 * Used for dashboard metrics/badges
 */
export const getCoupleEnquiryStats = async (coupleId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("status")
      .eq("couple_id", coupleId);

    if (error) return { data: null, error: error.message };

    // Count enquiries by status
    const stats = {
      new: 0,
      replied: 0,
      booked: 0,
      archived: 0,
      total: data?.length || 0,
    };

    data?.forEach((enquiry) => {
      if (enquiry.status in stats) {
        stats[enquiry.status]++;
      }
    });

    return { data: stats, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Remove vendor from couple's shortlist
 */
export const removeFromShortlist = async (coupleId, vendorId) => {
  try {
    const { data, error } = await supabase
      .from("couple_shortlists")
      .delete()
      .eq("couple_id", coupleId)
      .eq("vendor_id", vendorId)
      .select();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Add vendor to couple's shortlist
 */
export const addToShortlist = async (coupleId, vendorId, vendorName, vendorCategory, vendorImage) => {
  try {
    const { data, error } = await supabase
      .from("couple_shortlists")
      .insert([
        {
          couple_id: coupleId,
          vendor_id: vendorId,
          vendor_name: vendorName,
          vendor_category: vendorCategory,
          vendor_image: vendorImage,
        },
      ])
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Subscribe to couple's shortlist changes in real-time
 */
export const subscribeToShortlist = (coupleId, callback) => {
  const subscription = supabase
    .from(`couple_shortlists:couple_id=eq.${coupleId}`)
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
};

/**
 * Subscribe to couple's enquiry changes in real-time
 */
export const subscribeToEnquiries = (coupleId, callback) => {
  const subscription = supabase
    .from(`vendor_enquiries:couple_id=eq.${coupleId}`)
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
};
