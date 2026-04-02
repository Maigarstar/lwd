import { useState } from "react";
import { useVendorAuth } from "../context/VendorAuthContext";
import AuthSplitLayout from "../components/AuthSplitLayout";
import { fetchManagedAccountByVendorId } from "../services/socialStudioService";

const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";
const C = {
  gold: "#c9a84c",
  text: "#2a2a2a",
  border: "#e0e0d5",
  error: "#d32f2f",
};

export default function VendorLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { login, error, clearError } = useVendorAuth();

  useState(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    clearError();

    if (!email.trim() || !password.trim()) {
      return;
    }

    setIsLoading(true);
    const { data, error: loginError } = await login(email, password);

    if (!loginError && data) {
      // Check if this vendor has a managed account (client portal access)
      const managedAccount = data?.id ? await fetchManagedAccountByVendorId(data.id) : null;
      const dest = managedAccount ? 'portal' : 'vendor';

      if (onLoginSuccess) {
        onLoginSuccess(dest);
      } else {
        const path = dest === 'portal' ? '/portal' : '/vendor/dashboard';
        window.history.pushState(null, "", path);
        window.location.href = path;
      }
    }

    setIsLoading(false);
  };

  const formContent = (
    <>
      {/* Error Message */}
      {error && (
        <div style={{ background: C.error, color: "#ffffff", padding: "12px 16px", borderRadius: "6px", marginBottom: "20px", fontSize: "13px", lineHeight: 1.4 }}>
          {typeof error === "string" ? error : error?.message || "Login failed"}
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
            disabled={isLoading}
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
            disabled={isLoading}
            style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }}
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          style={{ width: "100%", padding: "12px 16px", background: isLoading ? "#ccc" : C.gold, color: C.text, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: NU, cursor: isLoading ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}
          onMouseEnter={(e) => !isLoading && (e.target.style.opacity = 0.9)}
          onMouseLeave={(e) => !isLoading && (e.target.style.opacity = 1)}
        >
          {isLoading ? "Signing In..." : "Sign In"}
        </button>
      </form>

      {/* Links */}
      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>
          Forgot your password?{" "}
          <a href="/vendor/forgot-password" style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}>
            Reset it here
          </a>
        </p>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>
          Don't have an account?{" "}
          <a
            href="javascript:void(0)"
            onClick={(e) => {
              e.preventDefault();
              if (window.vendorGoSignup) {
                window.vendorGoSignup();
              } else {
                window.history.pushState(null, "", "/vendor/signup");
                window.location.href = "/vendor/signup";
              }
            }}
            style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}
          >
            Create one here
          </a>
        </p>
      </div>
    </>
  );

  return (
    <AuthSplitLayout
      headline="Access Your Vendor Dashboard"
      subheading="Manage enquiries, track leads, and showcase your wedding services."
      imageSrc="https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&q=80"
      imageHeadline="Grow Your Wedding Business"
      imageSubtext="Connect with couples, manage your leads, and build your brand."
      isMobile={isMobile}
    >
      {formContent}
    </AuthSplitLayout>
  );
}
