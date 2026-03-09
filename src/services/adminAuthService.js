// ─── Admin Authentication Service ──────────────────────────────────────────

/**
 * Simple admin authentication
 * In production, this should use Supabase with an admin table
 * For now, using hardcoded credentials for development
 */

const ADMIN_CREDENTIALS = {
  email: "admin@lwd.com",
  password: "admin123"
};

const ADMIN_SESSION_KEY = "lwd_admin_session";

/**
 * Authenticate admin with email and password
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: {email, token}, error: null}|{data: null, error: string}>}
 */
export async function loginAdmin(email, password) {
  try {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Validate credentials
    if (email === ADMIN_CREDENTIALS.email && password === ADMIN_CREDENTIALS.password) {
      // Create a simple token (in production, use JWT from Supabase)
      const token = btoa(`${email}:${Date.now()}`);
      const adminData = { email, token };

      // Store in sessionStorage
      sessionStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(adminData));

      return { data: adminData, error: null };
    } else {
      return { data: null, error: "Invalid email or password" };
    }
  } catch (error) {
    return { data: null, error: error.message };
  }
}

/**
 * Get current admin session
 * @returns {Promise<{data: {email, token}, error: null}|{data: null, error: string}>}
 */
export async function getCurrentAdmin() {
  try {
    const sessionData = sessionStorage.getItem(ADMIN_SESSION_KEY);

    if (sessionData) {
      const admin = JSON.parse(sessionData);
      return { data: admin, error: null };
    }

    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}

/**
 * Logout admin
 * @returns {Promise<{data: null, error: null}>}
 */
export async function logoutAdmin() {
  try {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    return { data: null, error: null };
  } catch (error) {
    return { data: null, error: error.message };
  }
}
