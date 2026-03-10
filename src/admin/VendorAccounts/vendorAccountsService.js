// ─── src/admin/VendorAccounts/vendorAccountsService.js ───────────────────────
// Vendor Accounts Management Service
// Handles: fetching vendor accounts, creating accounts, sending invitations,
// managing account status, resending invites, disabling accounts
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../../lib/supabaseClient";

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

    // Filter by status (5-state model)
    if (status) {
      if (status === "pending-approval") {
        query = query.eq("approval_status", "pending");
      } else if (status === "approved") {
        query = query.eq("approval_status", "approved").eq("is_activated", false).is("activation_token", null);
      } else if (status === "invited") {
        query = query.eq("approval_status", "approved").eq("is_activated", false).not("activation_token", "is", null);
      } else if (status === "activated") {
        query = query.eq("is_activated", true);
      } else if (status === "suspended") {
        query = query.eq("approval_status", "approved").eq("is_activated", false).is("activation_token", null);
      } else if (status === "rejected") {
        query = query.eq("approval_status", "rejected");
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
 * Approve a vendor account (allow them to receive activation email)
 * @param {string} vendorId - Vendor UUID
 * @param {string} adminId - Admin user ID who is approving
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const approveVendorAccount = async (vendorId, adminId) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase
      .from("vendors")
      .update({
        approval_status: "approved",
        approved_at: new Date().toISOString(),
        approved_by_admin_id: adminId,
      })
      .eq("id", vendorId)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error approving vendor account:", error);
    return { data: null, error };
  }
};

/**
 * Reject a vendor account (prevent activation)
 * @param {string} vendorId - Vendor UUID
 * @param {string} adminId - Admin user ID who is rejecting
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const rejectVendorAccount = async (vendorId, adminId) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase
      .from("vendors")
      .update({
        approval_status: "rejected",
        approved_by_admin_id: adminId,
      })
      .eq("id", vendorId)
      .select();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error rejecting vendor account:", error);
    return { data: null, error };
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

    // Fetch vendor and check approval status
    const { data: vendorData, error: fetchError } = await supabase
      .from("vendors")
      .select("activation_token, approval_status")
      .eq("id", vendorId)
      .single();

    if (fetchError) throw fetchError;

    // Only send email if approved
    if (vendorData?.approval_status !== "approved") {
      throw new Error("Vendor account must be approved before sending activation email");
    }

    // Generate token if one doesn't exist yet
    let activationToken = vendorData?.activation_token;
    if (!activationToken) {
      activationToken = crypto.randomUUID ? crypto.randomUUID() : generateUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      const { error: tokenError } = await supabase
        .from("vendors")
        .update({ activation_token: activationToken, activation_token_expires_at: expiresAt })
        .eq("id", vendorId);
      if (tokenError) throw tokenError;
    }

    // Invoke Edge Function to send email
    const { data, error } = await supabase.functions.invoke("send-vendor-activation-email", {
      body: {
        email,
        vendorName,
        activationToken,
      },
    });

    if (error) {
      // Extract the actual error message from the edge function response body
      let errorMessage = error.message;
      if (error.context) {
        try {
          const body = await error.context.json();
          errorMessage = body.error || errorMessage;
          console.error("SendGrid error details:", body);
        } catch (e) {
          // Could not parse response body, use original message
        }
      }
      throw new Error(errorMessage);
    }

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

    if (emailError) {
      // Extract the actual error message from the edge function response body
      let errorMessage = emailError.message;
      if (emailError.context) {
        try {
          const body = await emailError.context.json();
          errorMessage = body.error || errorMessage;
          console.error("SendGrid error details:", body);
        } catch (e) {
          // Could not parse response body, use original message
        }
      }
      throw new Error(errorMessage);
    }

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

    // Set is_activated = false, clear token, mark as suspended
    const { data, error } = await supabase
      .from("vendors")
      .update({
        is_activated: false,
        activation_token: null,
        approval_status: "suspended",
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
 * Derive vendor account status from fields (5-state model)
 * @param {Object} vendor - Vendor record
 * @returns {string} Status: "pending-approval", "approved", "invited", "activated", "suspended", or "rejected"
 */
function deriveVendorStatus(vendor) {
  // Check activation first — overrides everything else
  if (vendor.is_activated) {
    return "activated";
  }

  // Explicit rejected or suspended states
  if (vendor.approval_status === "rejected") {
    return "rejected";
  }

  if (vendor.approval_status === "suspended") {
    return "suspended";
  }

  // Pending approval (not yet reviewed by admin)
  if (vendor.approval_status === "pending" || !vendor.approval_status) {
    return "pending-approval";
  }

  // Approved — check if invitation has been sent
  if (vendor.approval_status === "approved") {
    if (vendor.activation_token) {
      return "invited";
    }
    return "approved"; // approved but email not sent yet
  }

  return "pending-approval"; // safe default
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
