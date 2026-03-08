import React, { useState } from "react";
import { useCoupleAuth } from "../context/CoupleAuthContext";
import AuthSplitLayout from "../components/AuthSplitLayout";

const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  darkBg: "#0a0a08",
  lightBg: "#f5f5f0",
  gold: "#c9a84c",
  white: "#ffffff",
  text: "#2a2a2a",
  border: "#e0e0d5",
  error: "#d32f2f",
};

/**
 * Couple Login Component
 * Email/password login form with error handling
 */
export default function CoupleLogin({ onLoginSuccess }) {
  const { login, loading, error, clearError } = useCoupleAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);

    if (!email.trim()) {
      setLocalError("Email is required");
      return;
    }

    if (!password) {
      setLocalError("Password is required");
      return;
    }

    const { error: loginError } = await login(email, password);

    if (loginError) {
      setLocalError(loginError);
      return;
    }

    // Success - navigate or callback
    if (onLoginSuccess) {
      onLoginSuccess();
    } else {
      window.history.pushState(null, "", "/couple/dashboard");
      window.location.href = "/couple/dashboard";
    }
  };

  const displayError = localError || error;

  // Check if mobile
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  React.useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formContent = (
    <>
      {/* Error Message */}
      {displayError && (
        <div style={{ background: C.error, color: C.white, padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontSize: "13px", lineHeight: 1.4 }}>
          {displayError}
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit}>
        {/* Email */}
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }}
          />
        </div>

        {/* Password */}
        <div style={{ marginBottom: "24px" }}>
          <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          style={{ width: "100%", padding: "12px 16px", background: loading ? "#ccc" : C.gold, color: C.text, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: NU, cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={(e) => !loading && (e.target.style.opacity = 0.9)}
          onMouseLeave={(e) => !loading && (e.target.style.opacity = 1)}
        >
          {loading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* Forgot Password and Signup Links */}
      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>
          Forgot your password?{" "}
          <a href="/getting-married/forgot-password" style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}>
            Reset it here
          </a>
        </p>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>
          Don't have an account?{" "}
          <a
            href="javascript:void(0)"
            onClick={(e) => {
              e.preventDefault();
              if (window.coupleGoSignup) {
                window.coupleGoSignup();
              } else {
                window.history.pushState(null, "", "/couple/signup");
                window.location.href = "/couple/signup";
              }
            }}
            style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}
          >
            Create an account
          </a>
        </p>
      </div>
    </>
  );

  return (
    <AuthSplitLayout
      headline="Start Your Wedding Journey"
      subheading="Save venues, shortlist vendors, and begin planning your perfect celebration."
      imageSrc="https://images.unsplash.com/photo-1519741497674-611481863552?w=800&q=80"
      imageHeadline="Your Perfect Wedding Awaits"
      imageSubtext="Connect with luxury venues and trusted vendors curated just for you."
      isMobile={isMobile}
    >
      {formContent}
    </AuthSplitLayout>
  );
}
