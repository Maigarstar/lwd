import React, { useEffect } from "react";
import { useCoupleAuth } from "../context/CoupleAuthContext";

const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Protected Route Wrapper for Couple Routes
 * Checks authentication before rendering children
 * Redirects to login if not authenticated
 */
export default function ProtectedCoupleRoute({ children }) {
  const { isAuthenticated, loading } = useCoupleAuth();

  // ── Admin Preview Mode bypass ──────────────────────────────────────────────
  // Admin sets "lwd_admin_preview" in sessionStorage before navigating here.
  // M12 fix: enforce a 5-minute expiry so the bypass can't linger indefinitely.
  const _p = (() => {
    try {
      const raw = JSON.parse(sessionStorage.getItem("lwd_admin_preview") || "null");
      if (!raw) return null;
      // Expire after 5 minutes
      if (raw.at && Date.now() - raw.at > 5 * 60 * 1000) {
        sessionStorage.removeItem("lwd_admin_preview");
        return null;
      }
      return raw;
    } catch { return null; }
  })();
  if (_p?.type === "couple") return children;
  // ──────────────────────────────────────────────────────────────────────────

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f5f5f0",
        }}
      >
        <p style={{ fontFamily: NU, fontSize: 13, color: "#666" }}>Loading...</p>
      </div>
    );
  }

  // C2 fix: use reliable window.location.href — drop unstable window.coupleGoLogin dependency.
  // Full page reload ensures auth state is fresh on the login page.
  if (!isAuthenticated) {
    window.location.href = "/couple/login";
    return null;
  }

  // Render children if authenticated
  return children;
}
