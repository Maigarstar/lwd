/**
 * Enquiry Service
 * Handles CRUD operations for vendor enquiries in Supabase
 * Schema: vendor_enquiries(id, vendor_id, couple_id, listing_id, message, guest_count, budget_range, event_date, status, created_at, updated_at)
 */

import { supabase } from "../lib/supabaseClient";

/**
 * Save a new enquiry to Supabase
 * @param {Object} enquiryData - Enquiry details
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const saveInquiry = async (enquiryData) => {
  try {
    const insertData = {
      vendor_id: enquiryData.vendorId,
      couple_id: enquiryData.couple_id || enquiryData.coupleEmail,
      listing_id: enquiryData.vendorId,
      message: enquiryData.message || null,
      guest_count: enquiryData.guestCount || null,
      budget_range: enquiryData.budgetRange || null,
      event_date: enquiryData.weddingDate || null,
      couple_name: enquiryData.coupleName || null,
      couple_email: enquiryData.coupleEmail || null,
      couple_phone: enquiryData.couplePhone || null,
      lead_source: enquiryData.leadSource || "Venue Profile",
      status: "new",
    };

    const { data, error } = await supabase
      .from("vendor_enquiries")
      .insert([insertData])
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error saving enquiry:", error);
    return { data: null, error };
  }
};

/**
 * Get all enquiries for a specific vendor
 * @param {number} vendorId - Vendor ID
 * @returns {Promise<{data: Array, error: Error|null}>}
 */
export const getVendorInquiries = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching enquiries:", error);
    return { data: [], error };
  }
};

/**
 * Update enquiry status
 * @param {number} enquiryId - Enquiry ID
 * @param {string} newStatus - New status (new, replied, booked, archived)
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const updateInquiryStatus = async (enquiryId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", enquiryId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error updating enquiry status:", error);
    return { data: null, error };
  }
};

/**
 * Add vendor reply to enquiry
 * @param {number} enquiryId - Enquiry ID
 * @param {string} replyMessage - Reply message from vendor
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const addVendorReply = async (enquiryId, replyMessage) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .update({
        vendor_reply: replyMessage,
        status: "replied",
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", enquiryId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error adding vendor reply:", error);
    return { data: null, error };
  }
};

/**
 * Subscribe to real-time enquiry updates for a vendor
 * @param {number} vendorId - Vendor ID
 * @param {Function} callback - Called with updated enquiry
 * @returns {Function} Unsubscribe function
 */
export const subscribeToVendorInquiries = (vendorId, callback) => {
  const subscription = supabase
    .from(`vendor_enquiries:vendor_id=eq.${vendorId}`)
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
};

/**
 * Get single enquiry by ID
 * @param {number} enquiryId - Enquiry ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const getInquiry = async (enquiryId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .select("*")
      .eq("id", enquiryId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching enquiry:", error);
    return { data: null, error };
  }
};

/**
 * Archive enquiry (soft delete via status)
 * @param {number} enquiryId - Enquiry ID
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
export const closeInquiry = async (enquiryId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_enquiries")
      .update({
        status: "archived",
        updated_at: new Date().toISOString(),
      })
      .eq("id", enquiryId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error archiving enquiry:", error);
    return { data: null, error };
  }
};
