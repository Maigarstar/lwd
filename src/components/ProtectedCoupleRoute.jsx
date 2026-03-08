import React from "react";
import { useCoupleAuth } from "../context/CoupleAuthContext";

const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * Protected Route Wrapper for Couple Routes
 * Checks authentication before rendering children
 * Redirects to login if not authenticated
 */
export default function ProtectedCoupleRoute({ children }) {
  const { isAuthenticated, loading } = useCoupleAuth();

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

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (window.coupleGoLogin) {
      window.coupleGoLogin();
    } else {
      window.history.pushState(null, "", "/couple/login");
      window.location.href = "/couple/login";
    }
    return null;
  }

  // Render children if authenticated
  return children;
}
