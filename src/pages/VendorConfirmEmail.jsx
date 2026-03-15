// ─── src/pages/VendorConfirmEmail.jsx ──────────────────────────────────────
// Vendor email confirmation page - shown after signup email is verified
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";

const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  darkBg: "#0a0a08",
  lightBg: "#f5f5f0",
  gold: "#c9a84c",
  white: "#ffffff",
  text: "#2a2a2a",
  border: "#e0e0d5",
  success: "#4caf50",
};

/**
 * Vendor Email Confirmation Page
 * Shows confirmation message and redirects to login after 2 seconds
 */
export default function VendorConfirmEmail() {
  const [message, setMessage] = useState("Confirming your email...");
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(2);

  useEffect(() => {
    // Check if this is an email confirmation redirect from Supabase
    const handleEmailConfirmation = async () => {
      try {
        // Get the hash fragment which contains the auth token
        const hash = window.location.hash;

        if (!hash) {
          setError("No confirmation token found. Please check your email link.");
          return;
        }

        // Parse hash parameters
        const params = new URLSearchParams(hash.substring(1));
        const type = params.get("type");
        const accessToken = params.get("access_token");

        if (type === "signup" && accessToken) {
          // Email is confirmed by Supabase automatically when user clicks link
          // The access_token in URL means the email was verified
          setMessage("✓ Email confirmed! Redirecting to login...");

          // Start countdown and redirect
          const timer = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                clearInterval(timer);
                window.location.href = "/vendor/login";
              }
              return prev - 1;
            });
          }, 1000);
        } else {
          setError("Invalid confirmation link. Please try signing up again.");
        }
      } catch (err) {
        console.error("Error confirming email:", err);
        setError("An error occurred. Please try signing up again.");
      }
    };

    handleEmailConfirmation();
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.lightBg,
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: 500,
          background: C.white,
          borderRadius: "8px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontFamily: "var(--font-heading-primary)",
            margin: "0 0 20px 0",
            color: error ? "#d32f2f" : C.success,
          }}
        >
          {error ? "⚠ Error" : "✓ Success"}
        </h1>

        <p
          style={{
            fontSize: 16,
            fontFamily: NU,
            color: C.text,
            margin: "0 0 30px 0",
            lineHeight: 1.6,
          }}
        >
          {error || message}
        </p>

        {!error && countdown > 0 && (
          <p
            style={{
              fontSize: 14,
              fontFamily: NU,
              color: "#666",
              margin: 0,
            }}
          >
            Redirecting in {countdown} second{countdown !== 1 ? "s" : ""}...
          </p>
        )}

        {error && (
          <a
            href="/vendor/signup"
            style={{
              display: "inline-block",
              marginTop: "20px",
              padding: "12px 24px",
              background: C.gold,
              color: "#0a0a08",
              textDecoration: "none",
              borderRadius: "4px",
              fontFamily: NU,
              fontWeight: 600,
              fontSize: 14,
              cursor: "pointer",
            }}
          >
            Try Signing Up Again
          </a>
        )}
      </div>
    </div>
  );
}
