// ─── src/pages/VendorActivate.jsx ─────────────────────────────────────────────
// Vendor account activation page - activate account from invitation link
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { useVendorAuth } from "../context/VendorAuthContext";
import { supabase } from "../lib/supabaseClient";
import AuthSplitLayout from "../components/AuthSplitLayout";

const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  gold: "#c9a84c",
  text: "#2a2a2a",
  border: "#e0e0d5",
  error: "#d32f2f",
};

export default function VendorActivate({ activationToken, onActivationSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tokenError, setTokenError] = useState("");
  const { activate, error, clearError } = useVendorAuth();

  // Load vendor email from activation token on mount
  useEffect(() => {
    const loadVendorEmail = async () => {
      if (!activationToken) {
        setTokenError("No activation token provided");
        setIsLoading(false);
        return;
      }

      if (!supabase) {
        setTokenError("Service unavailable");
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: queryError } = await supabase
          .from("vendors")
          .select("email, activation_token_expires_at, is_activated")
          .eq("activation_token", activationToken)
          .single();

        if (queryError || !data) {
          setTokenError("Invalid or expired activation token");
          setIsLoading(false);
          return;
        }

        // Check if already activated
        if (data.is_activated) {
          setTokenError("This account has already been activated. Please log in instead.");
          setIsLoading(false);
          return;
        }

        // Check if token expired
        if (data.activation_token_expires_at) {
          const expiresAt = new Date(data.activation_token_expires_at);
          if (expiresAt < new Date()) {
            setTokenError("Activation token has expired");
            setIsLoading(false);
            return;
          }
        }

        setEmail(data.email);
        setIsLoading(false);
      } catch (err) {
        setTokenError("Error loading activation data");
        setIsLoading(false);
      }
    };

    loadVendorEmail();
  }, [activationToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    // Validation
    if (!password.trim()) {
      setTokenError("Password is required");
      return;
    }

    if (password.length < 8) {
      setTokenError("Password must be at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      setTokenError("Passwords do not match");
      return;
    }

    setIsSubmitting(true);
    const { data, error: activateError } = await activate(activationToken, password);

    if (!activateError && data) {
      // Activation successful, notify parent to redirect to login
      if (onActivationSuccess) {
        onActivationSuccess();
      } else {
        window.history.pushState(null, "", "/vendor/login");
      }
    }

    setIsSubmitting(false);
  };

  // Loading state
  if (isLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ fontFamily: FB, fontSize: 13, color: "#666" }}>Loading activation form...</p>
      </div>
    );
  }

  // Token error state
  if (tokenError && !email) {
    return (
      <div style={{ minHeight: "100vh", background: "#f5f5f5", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ width: "100%", maxWidth: "400px" }}>
          <div style={{ background: "#fff", borderRadius: "var(--lwd-radius-input)", padding: 24, boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
            <h2 style={{ fontFamily: FD, fontSize: 20, fontWeight: 700, color: "#dc2626", marginBottom: 12 }}>
              Activation Error
            </h2>
            <p style={{ fontFamily: FB, fontSize: 13, color: "#666", marginBottom: 20 }}>
              {tokenError}
            </p>
            <a
              href="/vendor/login"
              style={{
                display: "inline-block",
                padding: "13px 20px",
                background: "#c9a84c",
                color: "#fff",
                textDecoration: "none",
                borderRadius: "var(--lwd-radius-input)",
                fontFamily: FB,
                fontSize: 12,
                fontWeight: 700,
                textTransform: "uppercase",
              }}
            >
              Go to Login
            </a>
          </div>
        </div>
      </div>
    );
  }

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formContent = (
    <>
      {/* Error Message */}
      {(tokenError || error) && (
        <div style={{ background: C.error, color: "#ffffff", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontSize: "13px", lineHeight: 1.4 }}>
          {tokenError || (typeof error === "string" ? error : error?.message || "Activation failed")}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Email Field (Read-only) */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
            Email Address
          </label>
          <input type="email" value={email} readOnly style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box", background: "#f5f5f0", color: "#999", cursor: "default" }} />
        </div>

        {/* Password Field */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
            Password
          </label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" disabled={isSubmitting} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }} />
        </div>

        {/* Confirm Password Field */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
            Confirm Password
          </label>
          <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" disabled={isSubmitting} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }} />
        </div>

        {/* Activate Button */}
        <button
          type="submit"
          disabled={isSubmitting || !password.trim() || !confirmPassword.trim()}
          style={{ width: "100%", padding: "12px 16px", background: isSubmitting || !password.trim() || !confirmPassword.trim() ? "#ccc" : C.gold, color: C.text, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: NU, cursor: isSubmitting || !password.trim() || !confirmPassword.trim() ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={(e) => !isSubmitting && !(!password.trim() || !confirmPassword.trim()) && (e.target.style.opacity = 0.9)}
          onMouseLeave={(e) => !isSubmitting && !(!password.trim() || !confirmPassword.trim()) && (e.target.style.opacity = 1)}
        >
          {isSubmitting ? "Activating..." : "Activate Account"}
        </button>
      </form>

      {/* Footer Link */}
      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>
          Already activated?{" "}
          <a href="/vendor/login" style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}>
            Sign in here
          </a>
        </p>
      </div>
    </>
  );

  return (
    <AuthSplitLayout
      headline="Activate Your Account"
      subheading="Set a password to access your vendor dashboard and start connecting with couples."
      imageSrc="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
      imageHeadline="Grow Your Wedding Business"
      imageSubtext="Connect with couples, manage your leads, and build your brand."
      isMobile={isMobile}
    >
      {formContent}
    </AuthSplitLayout>
  );
}
