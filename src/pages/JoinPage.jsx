import React, { useState } from "react";

const GD = "var(--font-heading-primary, 'Cormorant Garamond', serif)";
const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * JoinPage Component
 * Entry selection page: Choose between couple or vendor
 * Routes to appropriate signup/login flows
 */
export default function JoinPage() {
  const [hoveredCard, setHoveredCard] = useState(null);

  const handleCoupleClick = () => {
    if (window.coupleGoSignup) {
      window.coupleGoSignup();
    } else {
      window.history.pushState(null, "", "/couple/signup");
      window.location.href = "/couple/signup";
    }
  };

  const handleVendorClick = () => {
    if (window.vendorGoLogin) {
      window.vendorGoLogin();
    } else {
      window.history.pushState(null, "", "/vendor/login");
      window.location.href = "/vendor/login";
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f5f0",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "40px 20px",
        fontFamily: NU,
      }}
    >
      {/* Header Section */}
      <div style={{ textAlign: "center", marginBottom: "80px", maxWidth: "600px" }}>
        <h1
          style={{
            fontFamily: GD,
            fontSize: "48px",
            color: "#0a0a08",
            margin: "0 0 20px 0",
            fontWeight: 400,
            letterSpacing: "0.02em",
          }}
        >
          Join Luxury Wedding Directory
        </h1>
        <p
          style={{
            fontFamily: NU,
            fontSize: "16px",
            color: "#666",
            margin: 0,
            lineHeight: 1.6,
          }}
        >
          Whether you're planning your wedding or showcasing your services, start your journey here.
        </p>
      </div>

      {/* Selection Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: "40px",
          maxWidth: "800px",
          width: "100%",
        }}
      >
        {/* Getting Married Card */}
        <div
          onClick={handleCoupleClick}
          onMouseEnter={() => setHoveredCard("couple")}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "60px 40px",
            border: "1px solid #e0e0d5",
            cursor: "pointer",
            transition: "all 0.3s ease",
            transform: hoveredCard === "couple" ? "translateY(-8px)" : "translateY(0)",
            boxShadow:
              hoveredCard === "couple"
                ? "0 20px 40px rgba(0,0,0,0.1)"
                : "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: "56px",
              marginBottom: "24px",
              height: "64px",
              display: "flex",
              alignItems: "center",
            }}
          >
            💍
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: GD,
              fontSize: "28px",
              color: "#0a0a08",
              margin: "0 0 16px 0",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            Getting Married
          </h2>

          {/* Description */}
          <p
            style={{
              fontFamily: NU,
              fontSize: "14px",
              color: "#666",
              margin: "0 0 32px 0",
              lineHeight: 1.6,
            }}
          >
            Plan your wedding, save venues, and connect with trusted vendors. Build your perfect celebration with our curated network of luxury services.
          </p>

          {/* CTA Button */}
          <button
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#c9a84c",
              color: "#0a0a08",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: NU,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              opacity: 1,
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
            onMouseLeave={(e) => (e.target.style.opacity = 1)}
          >
            Get Started
          </button>

          {/* Subtext */}
          <p
            style={{
              fontFamily: NU,
              fontSize: "12px",
              color: "#999",
              margin: "16px 0 0 0",
              textAlign: "center",
            }}
          >
            Sign up to save vendors and receive personalized matches
          </p>
        </div>

        {/* Vendor Card */}
        <div
          onClick={handleVendorClick}
          onMouseEnter={() => setHoveredCard("vendor")}
          onMouseLeave={() => setHoveredCard(null)}
          style={{
            background: "#ffffff",
            borderRadius: "12px",
            padding: "60px 40px",
            border: "1px solid #e0e0d5",
            cursor: "pointer",
            transition: "all 0.3s ease",
            transform: hoveredCard === "vendor" ? "translateY(-8px)" : "translateY(0)",
            boxShadow:
              hoveredCard === "vendor"
                ? "0 20px 40px rgba(0,0,0,0.1)"
                : "0 4px 12px rgba(0,0,0,0.05)",
          }}
        >
          {/* Icon */}
          <div
            style={{
              fontSize: "56px",
              marginBottom: "24px",
              height: "64px",
              display: "flex",
              alignItems: "center",
            }}
          >
            🎨
          </div>

          {/* Headline */}
          <h2
            style={{
              fontFamily: GD,
              fontSize: "28px",
              color: "#0a0a08",
              margin: "0 0 16px 0",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            Vendor
          </h2>

          {/* Description */}
          <p
            style={{
              fontFamily: NU,
              fontSize: "14px",
              color: "#666",
              margin: "0 0 32px 0",
              lineHeight: 1.6,
            }}
          >
            Showcase your business, receive qualified enquiries, and manage your leads in one place. Grow your wedding services business.
          </p>

          {/* CTA Button */}
          <button
            style={{
              width: "100%",
              padding: "14px 24px",
              background: "#c9a84c",
              color: "#0a0a08",
              border: "none",
              borderRadius: "6px",
              fontSize: "13px",
              fontWeight: 600,
              fontFamily: NU,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "all 0.2s",
              opacity: 1,
            }}
            onMouseEnter={(e) => (e.target.style.opacity = 0.85)}
            onMouseLeave={(e) => (e.target.style.opacity = 1)}
          >
            Access Dashboard
          </button>

          {/* Subtext */}
          <p
            style={{
              fontFamily: NU,
              fontSize: "12px",
              color: "#999",
              margin: "16px 0 0 0",
              textAlign: "center",
            }}
          >
            Sign in or set up your vendor account with an invitation code
          </p>
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          marginTop: "80px",
          textAlign: "center",
          fontSize: "12px",
          color: "#999",
        }}
      >
        <p>
          Already have an account?{" "}
          <a
            href="javascript:void(0)"
            onClick={(e) => {
              e.preventDefault();
              if (window.coupleGoLogin) {
                window.coupleGoLogin();
              } else {
                window.location.href = "/couple/login";
              }
            }}
            style={{
              color: "#c9a84c",
              textDecoration: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Sign in
          </a>
        </p>
      </div>
    </div>
  );
}
