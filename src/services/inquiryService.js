/**
 * Inquiry Service
 * Handles CRUD operations for vendor inquiries in Supabase
 */

import { supabase } from "../lib/supabaseClient";

/**
 * Save a new inquiry to Supabase
 */
export const saveInquiry = async (inquiryData) => {
  try {
    const { data, error } = await supabase
      .from("vendor_inquiries")
      .insert([
        {
          vendor_id: inquiryData.vendorId,
          vendor_name: inquiryData.vendorName,
          vendor_email: inquiryData.vendorEmail,
          couple_name: inquiryData.coupleName,
          couple_email: inquiryData.coupleEmail,
          couple_phone: inquiryData.couplePhone || null,
          wedding_date: inquiryData.weddingDate,
          guest_count: inquiryData.guestCount || null,
          budget: inquiryData.budget || null,
          message: inquiryData.message || null,
          status: "new",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error saving inquiry:", error);
    return { data: null, error };
  }
};

/**
 * Get all inquiries for a specific vendor
 */
export const getVendorInquiries = async (vendorId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_inquiries")
      .select("*")
      .eq("vendor_id", vendorId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching inquiries:", error);
    return { data: [], error };
  }
};

/**
 * Update inquiry status
 */
export const updateInquiryStatus = async (inquiryId, newStatus) => {
  try {
    const { data, error } = await supabase
      .from("vendor_inquiries")
      .update({
        status: newStatus,
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error updating inquiry status:", error);
    return { data: null, error };
  }
};

/**
 * Add vendor reply to inquiry
 */
export const addVendorReply = async (inquiryId, replyMessage) => {
  try {
    const { data, error } = await supabase
      .from("vendor_inquiries")
      .update({
        vendor_reply: replyMessage,
        status: "replied",
        replied_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error adding vendor reply:", error);
    return { data: null, error };
  }
};

/**
 * Subscribe to real-time inquiry updates for a vendor
 */
export const subscribeToVendorInquiries = (vendorId, callback) => {
  const subscription = supabase
    .from(`vendor_inquiries:vendor_id=eq.${vendorId}`)
    .on("*", (payload) => {
      callback(payload);
    })
    .subscribe();

  return subscription;
};

/**
 * Get single inquiry by ID
 */
export const getInquiry = async (inquiryId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_inquiries")
      .select("*")
      .eq("id", inquiryId)
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error("Error fetching inquiry:", error);
    return { data: null, error };
  }
};

/**
 * Delete inquiry (soft delete via status)
 */
export const closeInquiry = async (inquiryId) => {
  try {
    const { data, error } = await supabase
      .from("vendor_inquiries")
      .update({
        status: "closed",
        updated_at: new Date().toISOString(),
      })
      .eq("id", inquiryId)
      .select();

    if (error) throw error;
    return { data: data?.[0], error: null };
  } catch (error) {
    console.error("Error closing inquiry:", error);
    return { data: null, error };
  }
};
