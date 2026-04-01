// ─── Admin Authentication Service ────────────────────────────────────────────
// Uses Supabase Auth so the browser client holds a real JWT.
// That JWT is automatically attached to every supabase.from(...) query,
// satisfying RLS policies that check auth.role() = 'authenticated'.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from "../lib/supabaseClient";

/**
 * Sign in with email + password via Supabase Auth.
 * On success the supabase client caches the session in localStorage and
 * attaches the JWT to all subsequent DB requests automatically.
 */
export async function loginAdmin(email, password) {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { data: null, error: error.message };
    return { data: data.user, error: null };
  } catch (err) {
    return { data: null, error: err.message || "Sign-in failed" };
  }
}

/**
 * Return the current session user, or null if not signed in.
 * Supabase restores the session from localStorage automatically on init.
 */
export async function getCurrentAdmin() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) return { data: session.user, error: null };
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}

/**
 * Sign out and clear the session.
 */
export async function logoutAdmin() {
  try {
    await supabase.auth.signOut();
    return { data: null, error: null };
  } catch (err) {
    return { data: null, error: err.message };
  }
}
