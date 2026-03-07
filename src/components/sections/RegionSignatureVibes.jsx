// ════════════════════════════════════════════════════════════════════════════════
// RegionSignatureVibes.jsx - Regional Signature Styles & Aesthetics
//
// Showcases the unique wedding aesthetics and vibes specific to a region.
// Similar to USA's "Signature Vibe" section but tailored per region.
//
// Features:
// - Region-specific vibe cards (Masseria, Coastal, Baroque, etc.)
// - Hover effects with subtle animations
// - Responsive grid layout (3 cols desktop, 1-2 mobile)
// - Customizable per region via config
//
// Props:
//   - vibes: Array of vibe objects {name, description, icon, color}
//   - C: Color palette from theme context
//   - isMobile: Boolean for responsive behavior
// ════════════════════════════════════════════════════════════════════════════════

import React, { useState } from "react";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

/**
 * VibeCard - Individual vibe/style card
 */
function VibeCard({ vibe, C, isMobile }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
        padding: "32px 24px",
        background: hov ? `rgba(${vibe.rgbColor}, 0.08)` : C.card,
        border: `1px solid ${hov ? `rgb(${vibe.rgbColor})` : C.border}`,
        borderRadius: "var(--lwd-radius-card)",
        transition: "all 0.35s ease",
        cursor: "pointer",
        transform: hov ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `rgba(${vibe.rgbColor}, 0.12)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 16,
          fontSize: 28,
          transition: "all 0.3s ease",
          transform: hov ? "scale(1.1)" : "scale(1)",
        }}
      >
        {vibe.icon}
      </div>

      {/* Name */}
      <h3
        style={{
          fontFamily: GD,
          fontSize: isMobile ? 16 : 18,
          fontWeight: 400,
          color: C.white,
          margin: "0 0 8px",
          lineHeight: 1.3,
        }}
      >
        {vibe.name}
      </h3>

      {/* Description */}
      <p
        style={{
          fontFamily: NU,
          fontSize: 13,
          color: C.grey2,
          margin: 0,
          lineHeight: 1.5,
        }}
      >
        {vibe.description}
      </p>
    </div>
  );
}

/**
 * RegionSignatureVibes - Regional wedding styles/aesthetics
 *
 * @param {Array} vibes - Vibe objects with name, description, icon, rgbColor
 * @param {Object} C - Color palette
 * @param {Boolean} isMobile - Mobile layout flag
 */
export default function RegionSignatureVibes({ vibes, C, isMobile }) {
  if (!vibes || vibes.length === 0) return null;

  return (
    <section
      aria-label="Signature wedding vibes"
      style={{
        background: C.dark,
        borderBottom: `1px solid ${C.border}`,
        padding: "60px 48px",
      }}
    >
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: 48, textAlign: "center" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span
              style={{
                fontFamily: NU,
                fontSize: 9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: C.gold,
                fontWeight: 600,
              }}
            >
              Signature Vibes
            </span>
            <div style={{ width: 28, height: 1, background: C.gold }} />
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(28px, 5vw, 42px)",
              fontWeight: 400,
              margin: 0,
              color: C.white,
              lineHeight: 1.2,
            }}
          >
            Wedding Styles & Aesthetics
          </h2>
        </div>

        {/* Grid of vibe cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? 20 : 28,
          }}
        >
          {vibes.map((vibe) => (
            <VibeCard key={vibe.id} vibe={vibe} C={C} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </section>
  );
}
