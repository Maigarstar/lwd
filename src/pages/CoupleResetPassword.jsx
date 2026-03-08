import { useState, useEffect } from "react";
import { DARK_C as C } from "../theme/tokens";
import { resetPassword } from "../services/coupleAuthService";

export default function CoupleResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have the reset token in URL (from email link)
    const hash = window.location.hash;
    if (hash.includes("type=recovery") && hash.includes("access_token")) {
      setValidToken(true);
    } else {
      setError("Invalid or expired reset link. Please request a new password reset.");
    }
  }, []);

  const validateForm = () => {
    if (!password) {
      setError("Please enter a new password");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setLoading(true);
    const { error: resetError } = await resetPassword(password);

    if (resetError) {
      setError(resetError || "Failed to reset password");
    } else {
      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      // Redirect after 2 seconds
      setTimeout(() => {
        window.location.href = "/getting-married/login";
      }, 2000);
    }
    setLoading(false);
  };

  if (!validToken && !error) {
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
        <p style={{ fontSize: 14, color: C.grey }}>Validating reset link...</p>
      </div>
    );
  }

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
          Set New Password
        </h1>
        <p style={{ fontSize: 14, color: C.grey, marginBottom: 24 }}>
          Enter a new password for your account.
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
            ✓ Password reset successfully! Redirecting to login...
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

        {!error && (
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: 16 }}>
              <label
                style={{
                  display: "block",
                  fontSize: 14,
                  fontWeight: 500,
                  color: C.dark,
                  marginBottom: 8,
                }}
              >
                New Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
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
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Re-enter password"
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
              {loading ? "Resetting..." : success ? "Password Reset" : "Reset Password"}
            </button>
          </form>
        )}

        {error && (
          <div style={{ marginTop: 20, textAlign: "center" }}>
            <a
              href="/getting-married/forgot-password"
              style={{
                fontSize: 14,
                color: C.accent,
                textDecoration: "none",
                fontWeight: 600,
              }}
              onMouseEnter={(e) => (e.target.style.textDecoration = "underline")}
              onMouseLeave={(e) => (e.target.style.textDecoration = "none")}
            >
              Request a new reset link
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
