import React from "react";

const GD = "var(--font-heading-primary, 'Cormorant Garamond', serif)";
const NU = "'Nunito Sans', -apple-system, BlinkMacSystemFont, sans-serif";

/**
 * AuthSplitLayout Component
 * Premium auth page with split layout: form on left, image + overlay on right
 *
 * Props:
 * - headline: Large heading for the form panel
 * - subheading: Supporting text for the form panel
 * - children: Form content (inputs, buttons, etc.)
 * - imageSrc: Image URL for right panel
 * - imageHeadline: Large text overlay for image
 * - imageSubtext: Supporting text overlay for image
 * - isMobile: Boolean for mobile layout (optional)
 */
export default function AuthSplitLayout({
  headline,
  subheading,
  children,
  imageSrc,
  imageHeadline,
  imageSubtext,
  isMobile = false,
}) {
  if (isMobile) {
    // Mobile layout: full-width form with image background
    return (
      <div
        style={{
          minHeight: "100vh",
          background: `url('${imageSrc}') center / cover no-repeat`,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          fontFamily: NU,
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(10, 10, 8, 0.7)",
            zIndex: 0,
          }}
        />

        {/* Form container */}
        <div
          style={{
            position: "relative",
            zIndex: 1,
            width: "100%",
            padding: "40px 20px",
            background: "rgba(10, 10, 8, 0.95)",
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: "30px" }}>
            <h1
              style={{
                fontFamily: GD,
                fontSize: "28px",
                color: "#ffffff",
                margin: "0 0 12px 0",
                fontWeight: 400,
                letterSpacing: "0.02em",
              }}
            >
              {headline}
            </h1>
            <p
              style={{
                fontFamily: NU,
                fontSize: "14px",
                color: "rgba(255, 255, 255, 0.7)",
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              {subheading}
            </p>
          </div>

          {/* Form content */}
          {children}
        </div>
      </div>
    );
  }

  // Desktop layout: side-by-side
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        fontFamily: NU,
      }}
    >
      {/* Left Panel: Form */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "60px",
          background: "#ffffff",
          overflowY: "auto",
        }}
      >
        {/* Logo/back */}
        <div style={{ marginBottom: "60px" }}>
          <a
            href="javascript:void(0)"
            onClick={(e) => {
              e.preventDefault();
              if (window.goJoin) {
                window.goJoin();
              } else {
                window.location.href = "/join";
              }
            }}
            style={{
              fontSize: "13px",
              color: "#999",
              textDecoration: "none",
              fontWeight: 600,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              cursor: "pointer",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.target.style.color = "#000")}
            onMouseLeave={(e) => (e.target.style.color = "#999")}
          >
            ← Back
          </a>
        </div>

        {/* Headline */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontFamily: GD,
              fontSize: "36px",
              color: "#0a0a08",
              margin: "0 0 16px 0",
              fontWeight: 400,
              letterSpacing: "0.02em",
            }}
          >
            {headline}
          </h1>
          <p
            style={{
              fontFamily: NU,
              fontSize: "15px",
              color: "#666",
              margin: 0,
              lineHeight: 1.6,
              maxWidth: "450px",
            }}
          >
            {subheading}
          </p>
        </div>

        {/* Form content */}
        <div style={{ maxWidth: "400px", width: "100%" }}>{children}</div>
      </div>

      {/* Right Panel: Image */}
      <div
        style={{
          flex: 1,
          background: `url('${imageSrc}') center / cover no-repeat`,
          position: "relative",
          display: "flex",
          alignItems: "flex-end",
          padding: "60px",
          minHeight: "100vh",
        }}
      >
        {/* Dark overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.6))",
          }}
        />

        {/* Overlay text */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: "450px" }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "42px",
              color: "#ffffff",
              margin: "0 0 20px 0",
              fontWeight: 400,
              letterSpacing: "0.02em",
              lineHeight: 1.2,
            }}
          >
            {imageHeadline}
          </h2>
          <p
            style={{
              fontFamily: NU,
              fontSize: "16px",
              color: "rgba(255, 255, 255, 0.85)",
              margin: 0,
              lineHeight: 1.6,
            }}
          >
            {imageSubtext}
          </p>
        </div>
      </div>
    </div>
  );
}
