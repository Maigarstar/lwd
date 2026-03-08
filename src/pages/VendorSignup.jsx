// ─── src/pages/VendorSignup.jsx ──────────────────────────────────────────────
// Vendor signup form - create new vendor account with email/password
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState } from "react";
import { useVendorAuth } from "../context/VendorAuthContext";
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
 * Vendor Signup Component
 * Simple form: Email → Password → Venue Name → Create Account
 */
export default function VendorSignup({ onSignupSuccess }) {
  const { signup, loading, error, clearError } = useVendorAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    vendorName: "",
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (localError) setLocalError(null);
  };

  const validateForm = () => {
    setLocalError(null);

    if (!formData.email.trim()) {
      setLocalError("Email is required");
      return false;
    }

    if (!formData.email.includes("@")) {
      setLocalError("Please enter a valid email");
      return false;
    }

    if (!formData.password) {
      setLocalError("Password is required");
      return false;
    }

    if (formData.password.length < 8) {
      setLocalError("Password must be at least 8 characters");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setLocalError("Passwords do not match");
      return false;
    }

    if (!formData.vendorName.trim()) {
      setLocalError("Venue/business name is required");
      return false;
    }

    return true;
  };

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    const { error: signupError } = await signup(
      formData.email,
      formData.password,
      formData.vendorName
    );

    if (!signupError) {
      // Redirect to dashboard on success
      if (onSignupSuccess) {
        onSignupSuccess();
      } else {
        window.location.href = "/vendor";
      }
    }
  };

  const displayError = localError || error;

  return (
    <AuthSplitLayout direction="ltr">
      <div style={{ padding: "40px 30px" }}>
        <div style={{ marginBottom: "30px" }}>
          <h1
            style={{
              fontSize: 32,
              fontFamily: "var(--font-heading-primary)",
              margin: "0 0 10px 0",
              color: C.text,
            }}
          >
            Vendor Signup
          </h1>
          <p
            style={{
              fontSize: 14,
              color: "#666",
              margin: 0,
              fontFamily: NU,
            }}
          >
            Get started managing enquiries and connecting with couples.
          </p>
        </div>

        <form onSubmit={handleSignup}>
          {displayError && (
            <div
              style={{
                background: C.error,
                color: C.white,
                padding: "12px 15px",
                borderRadius: "4px",
                marginBottom: "20px",
                fontSize: 14,
                fontFamily: NU,
              }}
            >
              {displayError}
            </div>
          )}

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: "8px",
                color: C.text,
                fontFamily: NU,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 15px",
                border: `1px solid ${C.border}`,
                borderRadius: "4px",
                fontSize: 14,
                fontFamily: NU,
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: "8px",
                color: C.text,
                fontFamily: NU,
              }}
            >
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a secure password (min 8 characters)"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 15px",
                border: `1px solid ${C.border}`,
                borderRadius: "4px",
                fontSize: 14,
                fontFamily: NU,
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: "8px",
                color: C.text,
                fontFamily: NU,
              }}
            >
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 15px",
                border: `1px solid ${C.border}`,
                borderRadius: "4px",
                fontSize: 14,
                fontFamily: NU,
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: 13,
                fontWeight: 600,
                marginBottom: "8px",
                color: C.text,
                fontFamily: NU,
              }}
            >
              Venue / Business Name
            </label>
            <input
              type="text"
              name="vendorName"
              value={formData.vendorName}
              onChange={handleChange}
              placeholder="e.g. The Grand Pavilion"
              disabled={loading}
              style={{
                width: "100%",
                padding: "12px 15px",
                border: `1px solid ${C.border}`,
                borderRadius: "4px",
                fontSize: 14,
                fontFamily: NU,
                boxSizing: "border-box",
                opacity: loading ? 0.6 : 1,
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              padding: "14px",
              background: C.gold,
              color: "#0a0a08",
              border: "none",
              borderRadius: "4px",
              fontSize: 14,
              fontWeight: 600,
              fontFamily: NU,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              transition: "opacity 0.3s",
            }}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          <div
            style={{
              marginTop: "20px",
              fontSize: 13,
              textAlign: "center",
              color: "#666",
              fontFamily: NU,
            }}
          >
            Already have an account?{" "}
            <a
              href="/vendor/login"
              style={{
                color: C.gold,
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign in
            </a>
          </div>
        </form>
      </div>
    </AuthSplitLayout>
  );
}
