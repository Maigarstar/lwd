// ─── src/admin/VendorAccounts/vendorAccountsService.js ───────────────────────
// Vendor Accounts Management Service
// Handles: fetching vendor accounts, creating accounts, sending invitations,
// managing account status, resending invites, disabling accounts
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../../lib/supabase";

/**
 * Get all vendor accounts with status and login info
 * @param {Object} filters - Filter options
 * @param {string} filters.status - Filter by status: "not-invited", "invited", "activated", "suspended"
 * @param {string} filters.search - Search by name or email
 * @param {number} filters.limit - Results per page (default: 20)
 * @param {number} filters.offset - Pagination offset (default: 0)
 * @returns {Promise<{data: Array, total: number, error: null|Object}>}
 */
export const getAllVendorAccounts = async (filters = {}) => {
  try {
    if (!supabase) {
      return { data: [], total: 0, error: null };
    }

    const { status, search, limit = 20, offset = 0 } = filters;

    let query = supabase
      .from("vendors")
      .select("*", { count: "exact" });

    // Filter by status
    if (status) {
      if (status === "not-invited") {
        query = query.is("activation_token", null).eq("is_activated", false);
      } else if (status === "invited") {
        query = query.not("activation_token", "is", null).eq("is_activated", false);
      } else if (status === "activated") {
        query = query.eq("is_activated", true);
      } else if (status === "suspended") {
        query = query.eq("is_activated", false).not("activation_token", "is", null);
      }
    }

    // Search by name or email
    if (search) {
      query = query.or(`email.ilike.%${search}%`);
    }

    // Pagination
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    // Enrich data with status information
    const enrichedData = (data || []).map((vendor) => ({
      ...vendor,
      status: deriveVendorStatus(vendor),
      last_login: vendor.last_login_at ? formatLastLogin(vendor.last_login_at) : "Never",
    }));

    return { data: enrichedData, total: count || 0, error: null };
  } catch (error) {
    console.error("Error fetching vendor accounts:", error);
    return { data: [], total: 0, error };
  }
};

/**
 * Create a new vendor account via Edge Function
 * @param {Object} vendorData - New vendor data
 * @param {string} vendorData.vendorName - Vendor/venue name
 * @param {string} vendorData.email - Vendor email
 * @param {string} vendorData.linkedListingId - Optional listing ID to link
 * @param {string} vendorData.category - Vendor category
 * @param {string} vendorData.contactName - Optional contact person name
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const createVendorAccount = async (vendorData) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    console.log("Invoking create-vendor-account function with:", vendorData);

    // Invoke Edge Function to create account (server-side)
    const { data, error } = await supabase.functions.invoke("create-vendor-account", {
      body: {
        vendorName: vendorData.vendorName,
        email: vendorData.email,
        linkedListingId: vendorData.linkedListingId || null,
        category: vendorData.category,
        contactName: vendorData.contactName || null,
      },
    });

    console.log("Function response:", { data, error });

    if (error) {
      console.error("Function error:", error);
      throw error;
    }

    return { data, error: null };
  } catch (error) {
    console.error("Error creating vendor account:", error);
    const errorMessage = error?.message || JSON.stringify(error) || "Unknown error";
    return { data: null, error: new Error(`Failed to send a request to the Edge Function: ${errorMessage}`) };
  }
};

/**
 * Send activation email for a vendor account
 * @param {string} vendorId - Vendor UUID
 * @param {string} email - Vendor email
 * @param {string} vendorName - Vendor name
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const sendActivationEmail = async (vendorId, email, vendorName) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    // Get activation token from vendors table
    const { data: vendorData, error: fetchError } = await supabase
      .from("vendors")
      .select("activation_token")
      .eq("id", vendorId)
      .single();

    if (fetchError) throw fetchError;
    if (!vendorData?.activation_token) {
      throw new Error("No activation token found for this vendor");
    }

    // Invoke Edge Function to send email
    const { data, error } = await supabase.functions.invoke("send-vendor-activation-email", {
      body: {
        email,
        vendorName,
        activationToken: vendorData.activation_token,
      },
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error sending activation email:", error);
    return { data: null, error };
  }
};

/**
 * Resend activation email (generates new token with fresh expiry)
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const resendActivationEmail = async (vendorId) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    // Fetch vendor to get email and name
    const { data: vendor, error: fetchError } = await supabase
      .from("vendors")
      .select("email, name")
      .eq("id", vendorId)
      .single();

    if (fetchError) throw fetchError;

    // Generate new activation token
    const newToken = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Update vendor with new token
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        activation_token: newToken,
        activation_token_expires_at: expiresAt,
      })
      .eq("id", vendorId);

    if (updateError) throw updateError;

    // Send email
    const { error: emailError } = await supabase.functions.invoke("send-vendor-activation-email", {
      body: {
        email: vendor.email,
        vendorName: vendor.name,
        activationToken: newToken,
      },
    });

    if (emailError) throw emailError;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Error resending activation email:", error);
    return { data: null, error };
  }
};

/**
 * Disable/suspend a vendor account
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const disableVendorAccount = async (vendorId) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    // Set is_activated = false and clear token
    const { data, error } = await supabase
      .from("vendors")
      .update({
        is_activated: false,
        activation_token: null,
      })
      .eq("id", vendorId)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error disabling vendor account:", error);
    return { data: null, error };
  }
};

/**
 * Get vendor account details
 * @param {string} vendorId - Vendor UUID
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const getVendorDetails = async (vendorId) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase
      .from("vendors")
      .select("*")
      .eq("id", vendorId)
      .single();

    if (error) throw error;

    // Enrich with status
    return {
      data: {
        ...data,
        status: deriveVendorStatus(data),
      },
      error: null,
    };
  } catch (error) {
    console.error("Error fetching vendor details:", error);
    return { data: null, error };
  }
};

/**
 * Get all listings for dropdown selector
 * @returns {Promise<{data: Array, error: null|Object}>}
 */
export const getListingsForDropdown = async () => {
  try {
    if (!supabase) {
      return { data: [], error: null };
    }

    // Try to fetch from listings table
    // If column doesn't exist, return empty gracefully
    const { data, error } = await supabase
      .from("listings")
      .select("id, name");

    if (error) {
      // Column might not exist yet, return empty gracefully
      console.warn("Could not fetch listings:", error);
      return { data: [], error: null };
    }

    return { data: data || [], error: null };
  } catch (error) {
    console.error("Error fetching listings:", error);
    return { data: [], error: null };
  }
};

/**
 * Derive vendor account status from fields
 * @param {Object} vendor - Vendor record
 * @returns {string} Status: "not-invited", "invited", "activated", or "suspended"
 */
function deriveVendorStatus(vendor) {
  if (vendor.is_activated) {
    return "activated";
  }
  if (vendor.activation_token) {
    return "invited";
  }
  return "not-invited";
}

/**
 * Format last login timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted date or relative time
 */
function formatLastLogin(timestamp) {
  if (!timestamp) return "Never";
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

/**
 * Simple UUID generator fallback
 * @returns {string} UUID string
 */
function generateUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
