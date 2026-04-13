// ─── src/pages/LuxuryRegionPageTest.jsx ───────────────────────────────────
// LUXURY DISCOVERY EXPERIENCE — Test/Prototype
//
// Vision: Transform from "wedding directory" to "curated discovery platform"
//
// Architecture:
// 1. THE EDIT — Immersive, emotional, one dominant moment
// 2. CURATED PICKS — Featured venues (taste layer, not quantity)
// 3. EXPLORE — Filters appear here (guidance first, control second)
// 4. DISCOVERY LOOP — Nearby regions, related destinations
// 5. DEEP CONTENT — Editorial, real weddings (optional, never interrupts)
//
// Design DNA: Airbnb Luxe + Net-a-Porter + Apple
// - Space = luxury
// - One clear focus per screen
// - Confidence in design
// - Discovery feels effortless
// ─────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import { VENUES } from "../data/italyVenues";
import { VENDORS } from "../data/vendors.js";
import { getDarkPalette, getLightPalette } from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function LuxuryRegionPageTest({
  countrySlug = "italy",
  regionSlug = "amalfi-coast"
}) {
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;
  const C = darkMode ? getDarkPalette() : getLightPalette();

  // State
  const [viewMode, setViewMode] = useState("grid");
  const [expandFilters, setExpandFilters] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState(null);
  const [selectedCapacity, setSelectedCapacity] = useState(null);
  const [qvItem, setQvItem] = useState(null);

  // Data
  const regionName = "Amalfi Coast";
  const countryName = "Italy";
  const categoryLabel = "Wedding Venues";

  const allVenues = useMemo(() => {
    return VENUES.filter(v => v.region === regionName);
  }, []);

  // Filter logic
  const filteredVenues = useMemo(() => {
    let result = allVenues;
    if (selectedStyle) {
      result = result.filter(v => v.style === selectedStyle);
    }
    if (selectedCapacity) {
      result = result.filter(v => {
        const cap = parseInt(v.capacity || 0);
        if (selectedCapacity === "small") return cap <= 100;
        if (selectedCapacity === "medium") return cap > 100 && cap <= 250;
        if (selectedCapacity === "large") return cap > 250;
        return true;
      });
    }
    return result;
  }, [allVenues, selectedStyle, selectedCapacity]);

  // Featured venues (top 3)
  const featuredVenues = useMemo(() => {
    return allVenues.slice(0, 3);
  }, [allVenues]);

  // Nearby regions
  const nearbyRegions = [
    { name: "Ravello", description: "Clifftop charm and timeless elegance" },
    { name: "Positano", description: "Cascading coastline, romantic escapes" },
    { name: "Lake Como", description: "Alpine grandeur and refined luxury" },
    { name: "Tuscany", description: "Rolling hills and rustic sophistication" },
  ];

  // Styles available
  const availableStyles = [...new Set(allVenues.map(v => v.style))];

  return (
    <>
      <Helmet>
        <title>Wedding Venues in Amalfi Coast | Luxury Wedding Directory</title>
        <meta name="description" content="Discover extraordinary wedding venues in Amalfi Coast. Curated collection of luxury coastal destinations for unforgettable celebrations." />
      </Helmet>

      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>
        {/* ═════════════════════════════════════════════════════════════════════
            1. THE EDIT — Immersive, Emotional, One Dominant Moment
        ═════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            position: "relative",
            height: "60vh",
            minHeight: 500,
            overflow: "hidden",
            background: "#0a0806",
          }}
        >
          {/* Hero Image */}
          <img
            src="https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80"
            alt="Amalfi Coast"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.6,
            }}
          />

          {/* Gradient Overlays */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(180deg, rgba(4,3,2,0.4) 0%, rgba(4,3,2,0.6) 50%, rgba(4,3,2,0.85) 100%)",
            }}
          />

          {/* Gold shimmer top */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg, #C9A84C, #e8c97a, #C9A84C)",
            }}
          />

          {/* Content — Centered, Minimal, Emotional */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "flex-start",
              padding: "0 80px",
              zIndex: 2,
            }}
          >
            {/* Category tag */}
            <div style={{ marginBottom: 32 }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  color: "rgba(201,168,76,0.85)",
                  fontFamily: NU,
                  fontWeight: 600,
                }}
              >
                {categoryLabel.toUpperCase()}
              </span>
            </div>

            {/* Main headline — Emotional, not functional */}
            <h1
              style={{
                fontFamily: GD,
                fontSize: "clamp(48px, 6vw, 72px)",
                fontWeight: 400,
                color: "#fff",
                lineHeight: 1.1,
                letterSpacing: "-1px",
                margin: "0 0 24px",
                maxWidth: 800,
              }}
            >
              {regionName}
            </h1>

            {/* Subheading — Emotional copy */}
            <p
              style={{
                fontFamily: GD,
                fontSize: "clamp(18px, 2.5vw, 28px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: "#d1a352",
                lineHeight: 1.4,
                maxWidth: 700,
                margin: 0,
              }}
            >
              A collection of extraordinary places to marry
            </p>

            {/* Venue count — Subtle credibility */}
            <div
              style={{
                marginTop: 48,
                display: "flex",
                alignItems: "baseline",
                gap: 24,
              }}
            >
              <div>
                <div
                  style={{
                    fontFamily: GD,
                    fontSize: 32,
                    fontWeight: 600,
                    color: "#C9A84C",
                  }}
                >
                  {allVenues.length}
                </div>
                <div
                  style={{
                    fontSize: 10,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "rgba(255,255,255,0.45)",
                    marginTop: 4,
                  }}
                >
                  Curated Venues
                </div>
              </div>
              <div style={{ width: 1, height: 32, background: "rgba(255,255,255,0.15)" }} />
              <div>
                <div
                  style={{
                    fontFamily: NU,
                    fontSize: 14,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  100% Personally Verified
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            2. CURATED PICKS — Featured Venues (Taste Layer)
        ═════════════════════════════════════════════════════════════════════ */}
        {featuredVenues.length > 0 && (
          <section
            style={{
              background: darkMode ? "rgba(201,168,76,0.02)" : "rgba(201,168,76,0.01)",
              padding: "96px 80px",
              borderBottom: `1px solid rgba(201,168,76,0.08)`,
            }}
          >
            <div style={{ maxWidth: 1400, margin: "0 auto" }}>
              {/* Section header — Minimal */}
              <div style={{ marginBottom: 64 }}>
                <span
                  style={{
                    fontSize: 10,
                    letterSpacing: "3px",
                    textTransform: "uppercase",
                    color: "rgba(201,168,76,0.7)",
                    fontFamily: NU,
                    fontWeight: 600,
                  }}
                >
                  Our Selection
                </span>
                <h2
                  style={{
                    fontFamily: GD,
                    fontSize: "clamp(28px, 4vw, 42px)",
                    fontWeight: 400,
                    color: C.white,
                    lineHeight: 1.2,
                    margin: "16px 0 0",
                    letterSpacing: "-0.5px",
                  }}
                >
                  Featured Collections
                </h2>
              </div>

              {/* Featured venues grid — Large, breathing */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(420px, 1fr))",
                  gap: 32,
                }}
              >
                {featuredVenues.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      borderRadius: "var(--lwd-radius-card)",
                      overflow: "hidden",
                      height: 560,
                    }}
                  >
                    <LuxuryVenueCard
                      v={v}
                      onView={() => {}}
                      quickViewItem={qvItem}
                      setQuickViewItem={setQvItem}
                    />
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ═════════════════════════════════════════════════════════════════════
            3. EXPLORE — Filters Appear Here (Guidance First, Control Second)
        ═════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: C.dark,
            padding: "64px 80px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Section header */}
            <div style={{ marginBottom: 48 }}>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(24px, 3vw, 36px)",
                  fontWeight: 400,
                  color: C.white,
                  lineHeight: 1.2,
                  margin: 0,
                  letterSpacing: "-0.5px",
                }}
              >
                Discover Your Perfect Venue
              </h2>
            </div>

            {/* Filter bar — Clean, minimal */}
            <div
              style={{
                display: "flex",
                gap: 16,
                flexWrap: "wrap",
                marginBottom: 48,
                alignItems: "center",
              }}
            >
              {/* Style filter */}
              <div>
                <label
                  style={{
                    fontSize: 10,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "rgba(201,168,76,0.6)",
                    display: "block",
                    marginBottom: 8,
                    fontFamily: NU,
                  }}
                >
                  Style
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {["All", ...availableStyles].map((style) => (
                    <button
                      key={style}
                      onClick={() => setSelectedStyle(style === "All" ? null : style)}
                      style={{
                        padding: "8px 16px",
                        background:
                          selectedStyle === style || (style === "All" && !selectedStyle)
                            ? "rgba(201,168,76,0.2)"
                            : "transparent",
                        border: `1px solid ${selectedStyle === style || (style === "All" && !selectedStyle) ? "#C9A84C" : "rgba(201,168,76,0.3)"}`,
                        color: C.white,
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: NU,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#C9A84C";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedStyle !== style && !(style === "All" && !selectedStyle)) {
                          e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                        }
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              {/* Capacity filter */}
              <div style={{ borderLeft: `1px solid ${C.border}`, paddingLeft: 32 }}>
                <label
                  style={{
                    fontSize: 10,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    color: "rgba(201,168,76,0.6)",
                    display: "block",
                    marginBottom: 8,
                    fontFamily: NU,
                  }}
                >
                  Guest Count
                </label>
                <div style={{ display: "flex", gap: 8 }}>
                  {[
                    { label: "Small (0-100)", value: "small" },
                    { label: "Medium (100-250)", value: "medium" },
                    { label: "Large (250+)", value: "large" },
                  ].map((cap) => (
                    <button
                      key={cap.value}
                      onClick={() =>
                        setSelectedCapacity(selectedCapacity === cap.value ? null : cap.value)
                      }
                      style={{
                        padding: "8px 16px",
                        background:
                          selectedCapacity === cap.value
                            ? "rgba(201,168,76,0.2)"
                            : "transparent",
                        border: `1px solid ${selectedCapacity === cap.value ? "#C9A84C" : "rgba(201,168,76,0.3)"}`,
                        color: C.white,
                        borderRadius: 4,
                        cursor: "pointer",
                        fontSize: 12,
                        fontFamily: NU,
                        transition: "all 0.2s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = "#C9A84C";
                      }}
                      onMouseLeave={(e) => {
                        if (selectedCapacity !== cap.value) {
                          e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
                        }
                      }}
                    >
                      {cap.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Result count */}
              <div style={{ marginLeft: "auto" }}>
                <span style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: NU }}>
                  {filteredVenues.length} venue{filteredVenues.length !== 1 ? "s" : ""}
                </span>
              </div>
            </div>

            {/* Venues grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap: 20,
              }}
            >
              {filteredVenues.map((v) => (
                <div
                  key={v.id}
                  style={{
                    borderRadius: "var(--lwd-radius-card)",
                    overflow: "hidden",
                    height: 400,
                  }}
                >
                  <LuxuryVenueCard
                    v={v}
                    onView={() => {}}
                    quickViewItem={qvItem}
                    setQuickViewItem={setQvItem}
                  />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            4. DISCOVERY LOOP — Nearby Regions
        ═════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: C.black,
            padding: "96px 80px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: 1400, margin: "0 auto" }}>
            {/* Section header */}
            <div style={{ marginBottom: 64 }}>
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "rgba(201,168,76,0.6)",
                  fontFamily: NU,
                  fontWeight: 600,
                }}
              >
                Explore
              </span>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(28px, 4vw, 42px)",
                  fontWeight: 400,
                  color: C.white,
                  lineHeight: 1.2,
                  margin: "16px 0 0",
                  letterSpacing: "-0.5px",
                }}
              >
                Nearby Destinations
              </h2>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.6,
                  maxWidth: 600,
                  marginTop: 12,
                }}
              >
                Discover similar venues and experiences in neighbouring regions.
              </p>
            </div>

            {/* Nearby regions grid */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {nearbyRegions.map((region) => (
                <a
                  key={region.name}
                  href="#"
                  style={{
                    display: "block",
                    padding: 32,
                    background: darkMode ? "rgba(201,168,76,0.04)" : "rgba(201,168,76,0.02)",
                    border: `1px solid rgba(201,168,76,0.1)`,
                    borderRadius: "var(--lwd-radius-card)",
                    textDecoration: "none",
                    transition: "all 0.3s",
                    cursor: "pointer",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "#C9A84C";
                    e.currentTarget.style.background = darkMode ? "rgba(201,168,76,0.08)" : "rgba(201,168,76,0.05)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.1)";
                    e.currentTarget.style.background = darkMode ? "rgba(201,168,76,0.04)" : "rgba(201,168,76,0.02)";
                  }}
                >
                  <h3
                    style={{
                      fontFamily: GD,
                      fontSize: 22,
                      fontWeight: 400,
                      color: C.white,
                      margin: "0 0 12px",
                      letterSpacing: "-0.3px",
                    }}
                  >
                    {region.name}
                  </h3>
                  <p
                    style={{
                      fontFamily: NU,
                      fontSize: 13,
                      color: "rgba(255,255,255,0.6)",
                      lineHeight: 1.6,
                      margin: 0,
                    }}
                  >
                    {region.description}
                  </p>
                </a>
              ))}
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            5. DEEP CONTENT — Editorial (Optional, Never Interrupts)
        ═════════════════════════════════════════════════════════════════════ */}
        <section
          style={{
            background: darkMode ? "rgba(201,168,76,0.03)" : "rgba(201,168,76,0.01)",
            padding: "96px 80px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: 900, margin: "0 auto" }}>
            <h2
              style={{
                fontFamily: GD,
                fontSize: "clamp(24px, 3vw, 36px)",
                fontWeight: 400,
                color: C.white,
                lineHeight: 1.2,
                margin: "0 0 32px",
                letterSpacing: "-0.5px",
              }}
            >
              Why Amalfi Coast
            </h2>
            <p
              style={{
                fontFamily: NU,
                fontSize: 15,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.8,
                margin: "0 0 24px",
              }}
            >
              The Amalfi Coast represents the pinnacle of Italian destination weddings. Perched on dramatic cliffsides overlooking the Mediterranean, these venues offer unparalleled natural beauty combined with refined Italian hospitality.
            </p>
            <p
              style={{
                fontFamily: NU,
                fontSize: 15,
                color: "rgba(255,255,255,0.75)",
                lineHeight: 1.8,
                margin: 0,
              }}
            >
              From intimate ceremonies in centuries-old villas to celebrations in terraced gardens, the region's venues deliver the romance and elegance that defines luxury destination weddings.
            </p>
          </div>
        </section>

        {/* Footer spacer */}
        <div style={{ height: 120 }} />
      </div>
    </>
  );
}
