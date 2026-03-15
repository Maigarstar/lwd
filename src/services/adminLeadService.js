// ─── src/services/adminLeadService.js ────────────────────────────────────────
// Admin service: View all enquiries across all vendors
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabaseClient";

/**
 * Format response time as human-readable string
 * @param {string} createdAt - ISO timestamp
 * @param {string} repliedAt - ISO timestamp
 * @returns {string} Formatted response time or "Pending"
 */
function formatResponseTime(createdAt, repliedAt) {
  if (!repliedAt) return "Pending";
  const created = new Date(createdAt);
  const replied = new Date(repliedAt);
  const diffMs = replied - created;
  const diffMins = Math.floor(diffMs / 60000);
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (hours === 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

/**
 * Get all enquiries across all vendors with enhanced data
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (new, replied, booked, archived)
 * @param {string} filters.vendorId - Filter by specific vendor
 * @param {string} filters.budget - Filter by budget range
 * @param {string} filters.leadSource - Filter by lead source
 * @param {string} filters.searchEmail - Search by couple email
 * @param {string} filters.searchName - Search by couple name
 * @param {number} filters.limit - Results per page (default: 50)
 * @param {number} filters.offset - Pagination offset (default: 0)
 * @returns {Promise<{data: Array, total: number, error: null|Object}>}
 */
export const getAllEnquiries = async (filters = {}) => {
  try {
    if (!supabase) {
      console.warn("Supabase not configured");
      return { data: [], total: 0, error: null };
    }

    const { status, vendorId, budget, leadSource, searchEmail, searchName, limit = 50, offset = 0 } = filters;

    let query = supabase.from("vendor_enquiries").select("*", { count: "exact" });

    // Apply filters
    if (status) query = query.eq("status", status);
    if (vendorId) query = query.eq("vendor_id", vendorId);
    if (budget) query = query.eq("budget_range", budget);
    if (leadSource) query = query.eq("lead_source", leadSource);
    if (searchEmail) query = query.ilike("couple_email", `%${searchEmail}%`);
    if (searchName) query = query.ilike("couple_name", `%${searchName}%`);

    // Sort by created_at DESC and apply pagination
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Enhance data with formatted response times
    const enrichedData = (data || []).map((enquiry) => ({
      ...enquiry,
      response_time: formatResponseTime(enquiry.created_at, enquiry.replied_at),
    }));

    return { data: enrichedData, total: count || 0, error: null };
  } catch (error) {
    console.error("Error fetching all enquiries:", error);
    return { data: [], total: 0, error };
  }
};

/**
 * Get enquiry statistics across all vendors
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const getEnquiryStats = async () => {
  try {
    if (!supabase) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase.from("vendor_enquiries").select("status");

    if (error) throw error;

    const stats = {
      total: data?.length || 0,
      new: data?.filter((e) => e.status === "new").length || 0,
      replied: data?.filter((e) => e.status === "replied").length || 0,
      booked: data?.filter((e) => e.status === "booked").length || 0,
      archived: data?.filter((e) => e.status === "archived").length || 0,
    };

    return { data: stats, error: null };
  } catch (error) {
    console.error("Error fetching enquiry stats:", error);
    return { data: null, error };
  }
};

/**
 * Get list of all vendors with lead counts
 * @returns {Promise<{data: Array, error: null|Object}>}
 */
export const getVendorsWithLeadCounts = async () => {
  try {
    if (!supabase) {
      return { data: [], error: null };
    }

    const { data, error } = await supabase.from("vendor_enquiries").select("vendor_id, vendor_name");

    if (error) throw error;

    // Group by vendor_id and count
    const vendorMap = {};
    (data || []).forEach((enquiry) => {
      if (!vendorMap[enquiry.vendor_id]) {
        vendorMap[enquiry.vendor_id] = {
          vendorId: enquiry.vendor_id,
          vendorName: enquiry.vendor_name || "Unknown Vendor",
          count: 0,
        };
      }
      vendorMap[enquiry.vendor_id].count++;
    });

    const vendors = Object.values(vendorMap).sort((a, b) => b.count - a.count);

    return { data: vendors, error: null };
  } catch (error) {
    console.error("Error fetching vendors with lead counts:", error);
    return { data: [], error };
  }
};

/**
 * Update enquiry status (admin action)
 * @param {number} enquiryId - Enquiry ID
 * @param {string} newStatus - New status (new, replied, booked, archived)
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const updateEnquiryStatus = async (enquiryId, newStatus) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase
      .from("vendor_enquiries")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", enquiryId)
      .select();

    if (error) throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    return { data: null, error };
  }
};

/**
 * Add admin note/reply to enquiry (admin action)
 * @param {number} enquiryId - Enquiry ID
 * @param {string} adminReply - Admin reply message
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const addAdminReply = async (enquiryId, adminReply) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase
      .from("vendor_enquiries")
      .update({
        vendor_reply: adminReply,
        status: "replied",
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", enquiryId)
      .select();

    if (error) throw error;

    return { data: data?.[0] || null, error: null };
  } catch (error) {
    console.error("Error adding admin reply:", error);
    return { data: null, error };
  }
};
