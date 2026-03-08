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
 * Couple Signup Component
 * Multi-step form: Email/Password → Personal Details → Confirmation
 */
export default function CoupleSignup({ onSignupSuccess }) {
  const { signup, loading, error, clearError } = useCoupleAuth();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    eventDate: "",
    guestCount: "",
  });
  const [localError, setLocalError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateStep1 = () => {
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

    return true;
  };

  const validateStep2 = () => {
    setLocalError(null);

    if (!formData.firstName.trim()) {
      setLocalError("First name is required");
      return false;
    }

    if (!formData.lastName.trim()) {
      setLocalError("Last name is required");
      return false;
    }

    return true;
  };

  const handleNextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    const { error: signupError } = await signup(
      formData.email,
      formData.password,
      formData.firstName,
      formData.lastName,
      formData.eventDate || null,
      formData.guestCount ? parseInt(formData.guestCount) : null
    );

    if (signupError) {
      setLocalError(signupError);
      return;
    }

    // Success - navigate or callback
    if (onSignupSuccess) {
      onSignupSuccess();
    } else {
      window.history.pushState(null, "", "/couple/dashboard");
      window.location.href = "/couple/dashboard";
    }
  };

  const handleBackStep = () => {
    setStep(1);
    setLocalError(null);
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
      {/* Header */}
      <div style={{ marginBottom: "30px" }}>
        <p style={{ fontSize: "12px", color: "#999", margin: "0 0 12px 0", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 600 }}>
          Step {step} of 2
        </p>
      </div>

      {/* Error Message */}
      {displayError && (
        <div
          style={{
            background: C.error,
            color: C.white,
            padding: "12px 16px",
            borderRadius: "6px",
            marginBottom: "20px",
            fontSize: "13px",
            lineHeight: 1.4,
          }}
        >
          {displayError}
        </div>
      )}

      {/* Step 1: Email & Password */}
      {step === 1 && (
        <div>
          {/* Email */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              Email Address
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="At least 8 characters"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }}
            />
          </div>

          {/* Confirm Password */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Re-enter your password"
              style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }}
            />
          </div>

          {/* Next Button */}
          <button
            onClick={handleNextStep}
            style={{ width: "100%", padding: "12px 16px", background: C.gold, color: C.text, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: NU, cursor: "pointer", transition: "opacity 0.2s" }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.9)}
            onMouseLeave={(e) => (e.target.style.opacity = 1)}
          >
            Continue
          </button>
        </div>
      )}

      {/* Step 2: Personal Details */}
      {step === 2 && (
        <div>
          {/* First Name */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              First Name
            </label>
            <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First name" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }} />
          </div>

          {/* Last Name */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              Last Name
            </label>
            <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last name" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }} />
          </div>

          {/* Wedding Date (Optional) */}
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              Wedding Date (Optional)
            </label>
            <input type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }} />
          </div>

          {/* Guest Count (Optional) */}
          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: C.text, marginBottom: "6px" }}>
              Expected Guest Count (Optional)
            </label>
            <input type="number" name="guestCount" value={formData.guestCount} onChange={handleChange} placeholder="e.g., 100" min="0" style={{ width: "100%", padding: "10px 12px", border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontFamily: NU, boxSizing: "border-box" }} />
          </div>

          {/* Button Group */}
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={handleBackStep} style={{ flex: 1, padding: "12px 16px", background: "transparent", color: C.text, border: `1px solid ${C.border}`, borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: NU, cursor: "pointer", transition: "background 0.2s" }} onMouseEnter={(e) => (e.target.style.background = C.lightBg)} onMouseLeave={(e) => (e.target.style.background = "transparent")}>
              Back
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ flex: 1, padding: "12px 16px", background: loading ? "#ccc" : C.gold, color: C.text, border: "none", borderRadius: "6px", fontSize: "13px", fontWeight: 600, fontFamily: NU, cursor: loading ? "not-allowed" : "pointer", transition: "opacity 0.2s" }}
              onMouseEnter={(e) => !loading && (e.target.style.opacity = 0.9)}
              onMouseLeave={(e) => !loading && (e.target.style.opacity = 1)}
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </div>
        </div>
      )}

      {/* Login Link */}
      <div style={{ marginTop: "24px", paddingTop: "24px", borderTop: `1px solid ${C.border}` }}>
        <p style={{ fontSize: "13px", color: "#666", margin: "0 0 12px 0" }}>
          Already have an account?{" "}
          <a
            href="javascript:void(0)"
            onClick={(e) => {
              e.preventDefault();
              if (window.coupleGoLogin) {
                window.coupleGoLogin();
              } else {
                window.history.pushState(null, "", "/couple/login");
                window.location.href = "/couple/login";
              }
            }}
            style={{ color: C.gold, textDecoration: "none", fontWeight: 600 }}
          >
            Sign in instead
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
