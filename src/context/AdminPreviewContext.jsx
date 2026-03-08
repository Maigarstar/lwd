// ─── src/context/AdminPreviewContext.jsx ────────────────────────────────────
// Admin Impersonation / Preview Mode
//
// Allows an authenticated admin to enter Vendor or Couple dashboards without
// requiring separate logins. Scoped to sessionStorage (tab-only, clears on
// browser close). Only admin can activate preview mode via the AdminDashboard
// sidebar. Real vendor and couple auth is completely unaffected.
//
// To REMOVE later: delete this file and remove references in:
//   - VendorAuthContext.jsx (getAdminPreview check in initAuth)
//   - CoupleAuthContext.jsx (getAdminPreview check in checkSession)
//   - AdminDashboard.jsx (portal buttons in sidebar)
//   - VendorDashboard.jsx (AdminPreviewBanner)
//   - GettingMarriedDashboard.jsx (AdminPreviewBanner)
// ─────────────────────────────────────────────────────────────────────────────

export const ADMIN_PREVIEW_KEY = "lwd_admin_preview";

/**
 * Read admin preview state from sessionStorage.
 * Returns { type: "vendor"|"couple", id: string|null } or null.
 * Safe to call from outside React (e.g. in useEffect init).
 */
export function getAdminPreview() {
  try {
    const raw = sessionStorage.getItem(ADMIN_PREVIEW_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/**
 * Start admin preview mode.
 * @param {"vendor"|"couple"} type
 * @param {string|null} id  - vendor/couple id to preview (null = use default)
 */
export function startAdminPreview(type, id = null) {
  sessionStorage.setItem(ADMIN_PREVIEW_KEY, JSON.stringify({ type, id }));
}

/**
 * Clear admin preview mode and return to admin dashboard.
 * Called by the "Return to Admin" button in vendor/couple dashboards.
 */
export function exitAdminPreview() {
  sessionStorage.removeItem(ADMIN_PREVIEW_KEY);
  window.location.href = "/admin";
}

/**
 * Default mock records used when no specific id is provided.
 * Swap these out for real records as needed.
 */
export const PREVIEW_DEFAULTS = {
  vendor: {
    id: "vdr-13",
    name: "The Grand Pavilion",
    email: "contact@grandpavilion.com",
  },
  couple: {
    id: "couple-1",
    email: "preview@couple.com",
    firstName: "Emma",
    lastName: "& James",
    first_name: "Emma",
    last_name: "& James",
  },
};
