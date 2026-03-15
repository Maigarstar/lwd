// ─── src/components/ProtectedVendorRoute.jsx ──────────────────────────────────
// Route wrapper that protects vendor-only pages
// ─────────────────────────────────────────────────────────────────────────────

import { Navigate } from "react-router-dom";
import { useVendorAuth } from "../context/VendorAuthContext";

const FB = "var(--font-body)";

export default function ProtectedVendorRoute({ children }) {
  const { isAuthenticated, loading } = useVendorAuth();

  // Show loading state
  if (loading) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f5f5f5" }}>
        <p style={{ fontFamily: FB, fontSize: 13, color: "#666" }}>Loading...</p>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/vendor/login" replace />;
  }

  // Render protected content
  return children;
}
