// ─── src/services/vendorAuthService.js ───────────────────────────────────────
// Vendor authentication service - handles login, logout, activation, session
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabaseClient";

/**
 * Login vendor with email and password
 * @param {string} email - Vendor email
 * @param {string} password - Vendor password
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const loginVendor = async (email, password) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    // Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Login failed - no user returned");

    // Fetch vendor record
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (vendorError) throw vendorError;
    if (!vendorData) throw new Error("Vendor profile not found");

    return { data: vendorData, error: null };
  } catch (error) {
    console.error("Error logging in vendor:", error);
    return { data: null, error };
  }
};

/**
 * Sign up new vendor with email and password
 * @param {string} email - Vendor email
 * @param {string} password - Vendor password
 * @param {string} vendorName - Vendor/venue name
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const signupVendor = async (email, password, vendorName) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    // Sign up with Supabase Auth
    // redirectTo points to confirmation page which handles email verification token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        redirectTo: `${window.location.origin}/vendor/confirm-email`,
      },
    });

    if (authError) throw authError;
    if (!authData.user) throw new Error("Signup failed - no user returned");

    // Create vendor record
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .insert([
        {
          user_id: authData.user.id,
          email: email,
          legacy_vendor_id: `vdr-${Date.now()}`,
          is_activated: true,
          name: vendorName,
        },
      ])
      .select()
      .single();

    if (vendorError) throw vendorError;
    if (!vendorData) throw new Error("Vendor record creation failed");

    return { data: vendorData, error: null };
  } catch (error) {
    console.error("Error signing up vendor:", error);
    return { data: null, error };
  }
};

/**
 * Logout vendor and clear session
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const logoutVendor = async () => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error("Error logging out vendor:", error);
    return { data: null, error };
  }
};

/**
 * Get currently authenticated vendor
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const getCurrentVendor = async () => {
  // Retry logic for handling lock errors during concurrent operations
  const maxRetries = 3;
  let lastError = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (!supabase) {
        return { data: null, error: null };
      }

      // Get current auth user
      const { data: authData, error: authError } = await supabase.auth.getUser();

      if (authError || !authData.user) {
        return { data: null, error: null };
      }

      // Fetch vendor record for this user
      const { data: vendorData, error: vendorError } = await supabase
        .from("vendors")
        .select("*")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (vendorError) {
        // Check if it's a lock error - retry if so
        if (vendorError.message && vendorError.message.includes('Lock')) {
          lastError = vendorError;
          if (attempt < maxRetries - 1) {
            // Exponential backoff: 50ms, 100ms, 150ms
            await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
            continue;
          }
        }
        // Vendor record doesn't exist, but user is authenticated
        return { data: null, error: null };
      }

      return { data: vendorData, error: null };
    } catch (error) {
      lastError = error;
      // If lock error, retry with backoff
      if (error.message && error.message.includes('Lock') && attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        continue;
      }
      console.error("Error getting current vendor:", error);
      return { data: null, error: null };
    }
  }

  // After all retries failed due to lock, return null error
  return { data: null, error: null };
};

/**
 * Activate vendor account with invitation token
 * @param {string} activationToken - Token from invitation link
 * @param {string} password - Password to set for vendor
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const activateVendor = async (activationToken, password) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    // Fetch vendor record by activation token
    const { data: vendorData, error: vendorError } = await supabase
      .from("vendors")
      .select("*")
      .eq("activation_token", activationToken)
      .maybeSingle();

    if (vendorError) {
      throw new Error("Invalid or expired activation token");
    }

    if (!vendorData) {
      throw new Error("Activation token not found");
    }

    // Check if token is expired
    if (vendorData.activation_token_expires_at) {
      const expiresAt = new Date(vendorData.activation_token_expires_at);
      if (expiresAt < new Date()) {
        throw new Error("Activation token has expired");
      }
    }

    // Check if already activated
    if (vendorData.is_activated) {
      throw new Error("This account has already been activated");
    }

    // Update password for the auth user
    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) throw passwordError;

    // Mark vendor as activated and clear activation token
    const { error: updateError } = await supabase
      .from("vendors")
      .update({
        is_activated: true,
        activation_token: null,
        activation_token_expires_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq("activation_token", activationToken);

    if (updateError) throw updateError;

    return {
      data: {
        success: true,
        message: "Account activated successfully. You can now log in.",
      },
      error: null,
    };
  } catch (error) {
    console.error("Error activating vendor:", error);
    return { data: null, error };
  }
};

/**
 * Get auth user session (for checking if user is authenticated)
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const getSession = async () => {
  try {
    if (!supabase) {
      return { data: null, error: null };
    }

    const { data, error } = await supabase.auth.getSession();

    if (error) throw error;

    return { data: data?.session || null, error: null };
  } catch (error) {
    console.error("Error getting session:", error);
    return { data: null, error: null };
  }
};

/**
 * Listen for auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Function} Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  if (!supabase) return () => {};

  const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
    if (session?.user) {
      // User is logged in, fetch vendor record with retry logic
      let vendor = null;
      let retries = 3;
      let lastError = null;

      while (retries > 0) {
        try {
          const result = await getCurrentVendor();
          if (!result.error) {
            vendor = result.data;
            break;
          }
          lastError = result.error;
          // If lock error, wait before retry
          if (lastError && lastError.message && lastError.message.includes('Lock')) {
            await new Promise(resolve => setTimeout(resolve, 100 * (4 - retries)));
          }
          retries--;
        } catch (err) {
          lastError = err;
          retries--;
          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 100 * (4 - retries)));
        }
      }

      callback({ user: session.user, vendor, isAuthenticated: true });
    } else {
      // User is logged out
      callback({ user: null, vendor: null, isAuthenticated: false });
    }
  });

  // Return unsubscribe function
  return () => {
    authListener?.subscription?.unsubscribe();
  };
};

/**
 * Request password reset for vendor
 * Sends reset link to vendor email
 * @param {string} email - Vendor email
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const resetPasswordForEmail = async (email) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/vendor/reset-password`,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error requesting password reset:", error);
    return { data: null, error };
  }
};

/**
 * Update password with reset token
 * Called after user clicks reset link in email
 * @param {string} newPassword - New password to set
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const resetPassword = async (newPassword) => {
  try {
    if (!supabase) {
      return { data: null, error: new Error("Supabase not configured") };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error resetting password:", error);
    return { data: null, error };
  }
};
