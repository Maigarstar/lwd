// ─── src/services/vendorMetricsService.js ───────────────────────────────────
// Vendor dashboard metrics - real platform data from Supabase
// Aggregates enquiries, shortlist, and profile view data for vendor insights

import { supabase } from "../lib/supabaseClient";

// Get profile views count for a vendor
export const getProfileViews = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("profile_views")
      .select("id")
      .eq("vendor_id", vendorId);

    if (error) throw error;
    return { data: data?.length || 0, error: null };
  } catch (error) {
    console.error("Error fetching profile views:", error);
    return { data: 0, error };
  }
};

// Get shortlist count - how many couples saved this vendor
export const getSavedByCouples = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_shortlists")
      .select("id")
      .eq("item_id", vendorId);

    if (error) throw error;
    return { data: data?.length || 0, error: null };
  } catch (error) {
    console.error("Error fetching shortlist count:", error);
    return { data: 0, error };
  }
};

// Get new enquiries count for a vendor
export const getNewEnquiries = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("status", "new");

    if (error) throw error;
    return { data: data?.length || 0, error: null };
  } catch (error) {
    console.error("Error fetching new enquiries:", error);
    return { data: 0, error };
  }
};

// Get total enquiries for conversion calculation
export const getTotalEnquiries = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("id")
      .eq("vendor_id", vendorId);

    if (error) throw error;
    return { data: data?.length || 0, error: null };
  } catch (error) {
    console.error("Error fetching total enquiries:", error);
    return { data: 0, error };
  }
};

// Get booked enquiries for conversion rate
export const getBookedEnquiries = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("status", "booked");

    if (error) throw error;
    return { data: data?.length || 0, error: null };
  } catch (error) {
    console.error("Error fetching booked enquiries:", error);
    return { data: 0, error };
  }
};

// Calculate average response time (hours)
export const getAverageResponseTime = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("created_at, replied_at")
      .eq("vendor_id", vendorId)
      .not("replied_at", "is", null);

    if (error) throw error;

    if (!data || data.length === 0) {
      return { data: 0, error: null }; // No replies yet
    }

    const responseTimes = data.map((enquiry) => {
      const createdAt = new Date(enquiry.created_at);
      const repliedAt = new Date(enquiry.replied_at);
      const hours = (repliedAt - createdAt) / (1000 * 60 * 60);
      return hours;
    });

    const avgHours = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    return { data: Math.round(avgHours * 10) / 10, error: null };
  } catch (error) {
    console.error("Error calculating response time:", error);
    return { data: 0, error };
  }
};

// Get enquiry details for dashboard
export const getVendorEnquiries = async (vendorId, limit = 5) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return { data: [], error };
  }
};

// Get all vendor metrics at once (for dashboard)
export const getVendorMetrics = async (vendorId) => {
  try {
    const [profileViews, savedCouples, newEnquiries, totalEnquiries, bookedEnquiries, responseTime] = await Promise.all([
      getProfileViews(vendorId),
      getSavedByCouples(vendorId),
      getNewEnquiries(vendorId),
      getTotalEnquiries(vendorId),
      getBookedEnquiries(vendorId),
      getAverageResponseTime(vendorId),
    ]);

    // Calculate conversion rate
    const total = totalEnquiries.data || 0;
    const booked = bookedEnquiries.data || 0;
    const conversionRate = total > 0 ? Math.round((booked / total) * 100) : 0;

    return {
      data: {
        profileViews: profileViews.data,
        savedByCouples: savedCouples.data,
        newEnquiries: newEnquiries.data,
        totalEnquiries: total,
        bookedEnquiries: booked,
        responseTimeHours: responseTime.data,
        conversionRate: conversionRate,
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching vendor metrics:", error);
    return { data: null, error };
  }
};

// Subscribe to real-time metrics updates
export const subscribeToVendorMetrics = (vendorId, callback) => {
  const subscriptions = [];

  // Subscribe to profile views changes
  subscriptions.push(
    supabase
      .from("profile_views")
      .on("*", (payload) => {
        if (payload.new?.vendor_id === vendorId || payload.old?.vendor_id === vendorId) {
          // Refetch all metrics when profile views change
          getVendorMetrics(vendorId).then((result) => {
            if (!result.error) {
              callback(result.data);
            }
          });
        }
      })
      .subscribe()
  );

  // Subscribe to shortlist changes
  subscriptions.push(
    supabase
      .from("vendor_shortlists")
      .on("*", (payload) => {
        if (payload.new?.item_id === vendorId || payload.old?.item_id === vendorId) {
          getVendorMetrics(vendorId).then((result) => {
            if (!result.error) {
              callback(result.data);
            }
          });
        }
      })
      .subscribe()
  );

  // Subscribe to enquiry changes
  subscriptions.push(
    supabase
      .from("vendor_enquiries")
      .on("*", (payload) => {
        if (payload.new?.vendor_id === vendorId || payload.old?.vendor_id === vendorId) {
          getVendorMetrics(vendorId).then((result) => {
            if (!result.error) {
              callback(result.data);
            }
          });
        }
      })
      .subscribe()
  );

  // Return unsubscribe function
  return () => {
    subscriptions.forEach((sub) => {
      supabase.removeSubscription(sub);
    });
  };
};
