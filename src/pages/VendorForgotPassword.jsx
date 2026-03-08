import { useState } from "react";
import { DARK_C as C } from "../theme/tokens";
import { resetPasswordForEmail } from "../services/vendorAuthService";

export default function VendorForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }

    setLoading(true);
    const { error: resetError } = await resetPasswordForEmail(email);

    if (resetError) {
      setError(resetError.message || "Failed to send reset email");
    } else {
      setSuccess(true);
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        fontFamily: "var(--font-body)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "32px",
          background: C.white,
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0, 0, 0, 0.08)",
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, color: C.dark, marginBottom: 8 }}>
          Reset Password
        </h1>
        <p style={{ fontSize: 14, color: C.grey, marginBottom: 24 }}>
          Enter your email address and we'll send you a link to reset your password.
        </p>

        {success && (
          <div
            style={{
              padding: "12px 16px",
              background: "#e8f5e9",
              border: `1px solid #4caf50`,
              borderRadius: "8px",
              marginBottom: 20,
              color: "#2e7d32",
              fontSize: 14,
            }}
          >
            ✓ Check your email for the password reset link
          </div>
        )}

        {error && (
          <div
            style={{
              padding: "12px 16px",
              background: "#ffebee",
              border: `1px solid #f44336`,
              borderRadius: "8px",
              marginBottom: 20,
              color: "#c62828",
              fontSize: 14,
            }}
          >
            ✕ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 14,
                fontWeight: 500,
                color: C.dark,
                marginBottom: 8,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 14,
                border: `1px solid ${C.border}`,
                borderRadius: "8px",
                fontFamily: "inherit",
                boxSizing: "border-box",
              }}
              disabled={loading}
            />
          </div>

          <button
            type="submit"
            disabled={loading || success}
            style={{
              width: "100%",
              padding: "10px 16px",
              fontSize: 14,
              fontWeight: 600,
              color: C.white,
              background: loading || success ? C.grey : C.accent,
              border: "none",
              borderRadius: "8px",
              cursor: loading || success ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Sending..." : success ? "Email Sent" : "Send Reset Link"}
          </button>
        </form>

        <div style={{ marginTop: 20, textAlign: "center", fontSize: 14, color: C.grey }}>
          <p style={{ margin: 0 }}>
            Remember your password?{" "}
            <a
              href="/vendor/login"
              style={{
                color: C.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              Sign in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
