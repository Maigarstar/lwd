// ════════════════════════════════════════════════════════════════════════════════
// RegionFeatured.jsx - Premium Featured Items Section for Region Pages
// Renders configurable featured venues: carousel or grid, with sticky controls
// Data-driven from regionPageConfig.featured
// ════════════════════════════════════════════════════════════════════════════════

import React, { useState, useMemo } from "react";
import FeaturedSlider from "./FeaturedSlider";
import GCard from "../cards/GCard";
import GCardMobile from "../cards/GCardMobile";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function RegionFeatured({ config, region, venues, C, isMobile, onViewVenue, savedIds, onToggleSave }) {
  if (!config || !config.enabled) return null;

  const [displayMode, setDisplayMode] = useState(config.displayType || "carousel");
  const [isStickyActive, setIsStickyActive] = useState(false);

  // Resolve featured venues based on config itemIds, fall back to all venues
  const featuredVenues = useMemo(() => {
    let result = [];

    // If itemIds are configured, pull those specific venues
    if (config.itemIds && config.itemIds.length > 0) {
      result = venues.filter((v) => config.itemIds.includes(v.id));
    } else {
      // Otherwise, use all venues from region
      result = venues;
    }

    // Limit to configured count
    return result.slice(0, config.count || 6);
  }, [config, venues]);

  if (featuredVenues.length === 0) return null;

  const title = config.title || "Featured Venues";

  // For carousel mode, use FeaturedSlider
  if (displayMode === "carousel") {
    return (
      <section style={{ position: "relative", margin: "60px 0 0" }}>
        {/* Title + Controls — Constrained Width */}
        <div
          style={{
            maxWidth: 1280,
            margin: "0 auto",
            padding: "0 48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 36,
            position: "relative",
            zIndex: 10,
          }}
        >
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
            {title}
          </h2>

          {/* View Mode Toggle */}
          <div
            style={{
              display: "flex",
              gap: 12,
              alignItems: "center",
              padding: "8px 16px",
              background: `rgba(201,168,76,0.08)`,
              border: `1px solid ${C.border}`,
              borderRadius: 6,
              backdropFilter: "blur(8px)",
            }}
          >
            {["carousel", "grid"].map((mode) => (
              <button
                key={mode}
                onClick={() => setDisplayMode(mode)}
                style={{
                  padding: "6px 14px",
                  background: displayMode === mode ? C.gold : "transparent",
                  color: displayMode === mode ? C.dark : C.grey2,
                  border: "none",
                  borderRadius: 4,
                  fontFamily: NU,
                  fontSize: 12,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                }}
              >
                {mode === "carousel" ? "Slide" : "Grid"}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Slider — Full Width */}
        <FeaturedSlider venues={featuredVenues} />
      </section>
    );
  }

  // Grid mode - render as GCard grid
  return (
    <section style={{ margin: "60px 0 0" }}>
      {/* Title + Controls — Constrained Width */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 36,
          position: "relative",
          zIndex: 10,
        }}
      >
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
          {title}
        </h2>

        {/* View Mode Toggle */}
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
            padding: "8px 16px",
            background: `rgba(201,168,76,0.08)`,
            border: `1px solid ${C.border}`,
            borderRadius: 6,
            backdropFilter: "blur(8px)",
          }}
        >
          {["carousel", "grid"].map((mode) => (
            <button
              key={mode}
              onClick={() => setDisplayMode(mode)}
              style={{
                padding: "6px 14px",
                background: displayMode === mode ? C.gold : "transparent",
                color: displayMode === mode ? C.dark : C.grey2,
                border: "none",
                borderRadius: 4,
                fontFamily: NU,
                fontSize: 12,
                fontWeight: 600,
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "all 0.3s ease",
              }}
            >
              {mode === "carousel" ? "Slide" : "Grid"}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of venues — Full Width */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
          gap: 32,
          marginBottom: 60,
          padding: "0 48px",
        }}
      >
        {featuredVenues.map((v) => (
          <div key={v.id} onClick={() => onViewVenue?.(v.slug)}>
            {isMobile ? (
              <GCardMobile
                venue={v}
                saved={savedIds?.includes(v.id)}
                onToggleSave={() => onToggleSave?.(v.id)}
                C={C}
              />
            ) : (
              <GCard
                venue={v}
                saved={savedIds?.includes(v.id)}
                onToggleSave={() => onToggleSave?.(v.id)}
                C={C}
              />
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
