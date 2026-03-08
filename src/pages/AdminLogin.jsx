// ─── src/pages/AdminLogin.jsx ──────────────────────────────────────────────

import { useState } from "react";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function AdminLogin({ onBack }) {
  const { login, loading } = useAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await login(email, password);
      if (result.error) {
        setError(result.error);
      } else {
        // Login successful - redirect to admin dashboard
        window.location.href = "/admin";
      }
    } finally {
      setIsLoading(false);
    }
  };

  const C = {
    bg: "#f5f3f0",
    text: "#0f0d0a",
    border: "#d4ccc4",
    error: "#c84c3c",
    gold: "#C9A84C",
    dark: "#1a1816",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: C.bg,
        fontFamily: "'Calibre', 'Inter', sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: 40, textAlign: "center" }}>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 700,
              color: C.text,
              margin: "0 0 8px 0",
              letterSpacing: "-0.5px",
            }}
          >
            Admin Portal
          </h1>
          <p style={{ fontSize: 13, color: "#6b6359", margin: 0 }}>
            Luxury Wedding Directory Control Room
          </p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: C.dark,
                marginBottom: 8,
              }}
            >
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@lwd.com"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 14,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                fontFamily: "inherit",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: C.text,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "text",
              }}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <label
              style={{
                display: "block",
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                letterSpacing: "0.5px",
                color: C.dark,
                marginBottom: 8,
              }}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "12px 16px",
                fontSize: 14,
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                fontFamily: "inherit",
                boxSizing: "border-box",
                backgroundColor: "#ffffff",
                color: C.text,
                opacity: isLoading ? 0.6 : 1,
                cursor: isLoading ? "not-allowed" : "text",
              }}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div
              style={{
                marginBottom: 16,
                padding: "10px 12px",
                backgroundColor: "#fce5e5",
                border: `1px solid ${C.error}`,
                borderRadius: 4,
                fontSize: 12,
                color: C.error,
                lineHeight: 1.4,
              }}
            >
              {error}
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !email || !password}
            style={{
              width: "100%",
              padding: "12px 16px",
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              color: "#ffffff",
              backgroundColor: isLoading || !email || !password ? "#d4ccc4" : C.gold,
              border: "none",
              borderRadius: 4,
              cursor: isLoading || !email || !password ? "not-allowed" : "pointer",
              transition: "background-color 0.2s ease",
            }}
            onMouseEnter={(e) => {
              if (!isLoading && email && password) {
                e.target.style.backgroundColor = "#b8903e";
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && email && password) {
                e.target.style.backgroundColor = C.gold;
              }
            }}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        {/* Demo Credentials */}
        <div
          style={{
            marginTop: 32,
            padding: 16,
            backgroundColor: "#ffffff",
            border: `1px solid ${C.border}`,
            borderRadius: 4,
            fontSize: 12,
            color: "#6b6359",
            lineHeight: 1.6,
          }}
        >
          <p style={{ margin: "0 0 8px 0", fontWeight: 600 }}>Demo Credentials:</p>
          <p style={{ margin: "0 0 4px 0" }}>📧 Email: <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 2, fontFamily: "monospace" }}>admin@lwd.com</code></p>
          <p style={{ margin: 0 }}>🔐 Password: <code style={{ background: "#f0f0f0", padding: "2px 6px", borderRadius: 2, fontFamily: "monospace" }}>admin123</code></p>
        </div>

        {/* Back Button */}
        <button
          onClick={onBack}
          style={{
            marginTop: 20,
            width: "100%",
            padding: "10px 16px",
            fontSize: 12,
            fontWeight: 600,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            color: C.gold,
            backgroundColor: "transparent",
            border: `1px solid ${C.gold}`,
            borderRadius: 4,
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#fffbf5";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "transparent";
          }}
        >
          ← Back to Site
        </button>
      </div>
    </div>
  );
}
