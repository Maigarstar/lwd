import { supabase } from "../lib/supabaseClient";

/**
 * Couple Authentication Service
 * Handles signup, login, logout, and session management for couples
 * All functions return { data, error } tuple pattern
 */

/**
 * Sign up a new couple account
 * Creates Supabase Auth user and couple record
 */
export const signupCouple = async (email, password, firstName, lastName, eventDate, guestCount) => {
  try {
    // 1. Create Supabase Auth user
    // redirectTo points to confirmation page which handles email verification token
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        redirectTo: `${window.location.origin}/getting-married/confirm-email`,
        data: {
          first_name: firstName,
          last_name: lastName,
        },
      },
    });

    if (authError) return { data: null, error: authError.message };
    if (!authData.user) return { data: null, error: "Failed to create auth user" };

    // 2. Create couple record in database
    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .insert([
        {
          user_id: authData.user.id,
          email,
          first_name: firstName,
          last_name: lastName,
          event_date: eventDate || null,
          guest_count: guestCount || null,
        },
      ])
      .select()
      .single();

    if (coupleError) {
      // If couple record fails, delete auth user
      await supabase.auth.admin.deleteUser(authData.user.id);
      return { data: null, error: coupleError.message };
    }

    return { data: coupleData, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Log in with email and password
 * Returns couple record on success
 */
export const loginCouple = async (email, password) => {
  try {
    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) return { data: null, error: authError.message };
    if (!authData.user) return { data: null, error: "Authentication failed" };

    // 2. Fetch couple record
    const couple = await getCurrentCouple();
    return couple;
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Log out the current couple
 * Clears Supabase session
 */
export const logoutCouple = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { data: null, error: error.message };
    return { data: { success: true }, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Get the currently authenticated couple
 * Returns couple record linked to auth user
 */
export const getCurrentCouple = async () => {
  try {
    if (!supabase) return { data: null, error: "Supabase not configured" };
    // 1. Get current auth user
    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) return { data: null, error: authError.message };
    if (!authData.user) return { data: null, error: "Not authenticated" };

    // 2. Fetch couple record
    const { data: coupleData, error: coupleError } = await supabase
      .from("couples")
      .select("*")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (coupleError) return { data: null, error: coupleError.message };
    if (!coupleData) return { data: null, error: "Couple record not found" };

    return { data: coupleData, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Get current auth session
 * Returns session object or null if not authenticated
 */
export const getSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) return { data: null, error: error.message };
    return { data: data.session, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Listen for auth state changes
 * Calls callback whenever auth state changes (login, logout, token refresh)
 * Returns unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });

  return subscription?.unsubscribe || (() => {});
};

/**
 * Update couple profile information
 */
export const updateCoupleProfile = async (coupleId, updates) => {
  try {
    const { data, error } = await supabase
      .from("couples")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", coupleId)
      .select()
      .single();

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};

/**
 * Request password reset for couple
 * Sends reset link to couple email
 * @param {string} email - Couple email
 * @returns {Promise<{data: Object, error: null|Object}>}
 */
export const resetPasswordForEmail = async (email) => {
  try {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/getting-married/reset-password`,
    });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
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
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) return { data: null, error: error.message };
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
};
