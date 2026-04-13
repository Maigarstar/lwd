// ─── src/pages/GridResponsiveTest.jsx ───────────────────────────────────
// GRID RESPONSIVE TEST
// Tests: 3-column grid (map off) vs 2-column grid (map on)
// ─────────────────────────────────────────────────────────────────────────

import { useState, useMemo } from "react";
import { Helmet } from "react-helmet-async";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import { VENUES } from "../data/italyVenues";
import { getDarkPalette, getLightPalette } from "../theme/tokens";
import { useTheme } from "../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function GridResponsiveTest() {
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;
  const C = darkMode ? getDarkPalette() : getLightPalette();

  // State
  const [mapOn, setMapOn] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [qvItem, setQvItem] = useState(null);

  // Sample data (first 12 venues for testing)
  const venues = VENUES.slice(0, 12);

  return (
    <>
      <Helmet>
        <title>Grid Responsive Test | LWD</title>
      </Helmet>

      <div style={{ background: darkMode ? C.dark : "#f2f0ea", minHeight: "100vh", padding: "40px 20px" }}>
        {/* HEADER */}
        <div style={{
          maxWidth: 1400,
          margin: "0 auto",
          marginBottom: 48,
        }}>
          <h1 style={{
            fontFamily: GD,
            fontSize: 40,
            color: C.white,
            marginBottom: 24,
          }}>
            Grid Responsive Test
          </h1>

          <div style={{
            display: "flex",
            gap: 16,
            flexWrap: "wrap",
            background: C.card,
            padding: 24,
            borderRadius: 8,
          }}>
            {/* Toggle Map */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: C.white }}>
                <input
                  type="checkbox"
                  checked={mapOn}
                  onChange={(e) => setMapOn(e.target.checked)}
                  style={{ cursor: "pointer", width: 20, height: 20 }}
                />
                <span style={{ fontFamily: NU, fontSize: 14 }}>
                  {mapOn ? "🗺️ Map ON (2 cols)" : "✕ Map OFF (3 cols)"}
                </span>
              </label>
            </div>

            {/* Toggle Mobile */}
            <div>
              <label style={{ display: "flex", alignItems: "center", gap: 12, cursor: "pointer", color: C.white }}>
                <input
                  type="checkbox"
                  checked={isMobile}
                  onChange={(e) => setIsMobile(e.target.checked)}
                  style={{ cursor: "pointer", width: 20, height: 20 }}
                />
                <span style={{ fontFamily: NU, fontSize: 14 }}>
                  {isMobile ? "📱 Mobile" : "🖥️ Desktop"}
                </span>
              </label>
            </div>

            {/* Info */}
            <div style={{
              marginLeft: "auto",
              fontFamily: NU,
              fontSize: 13,
              color: C.gold,
            }}>
              Grid: {mapOn ? "2 columns" : "3 columns"} | {isMobile ? "Mobile" : "Desktop"}
            </div>
          </div>
        </div>

        {/* GRID CONTAINER */}
        <div style={{
          maxWidth: 1400,
          margin: "0 auto",
        }}>
          <div
            className="lwd-venue-grid"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile
                ? "1fr"
                : mapOn
                  ? "repeat(2, minmax(0, 1fr))"
                  : "repeat(3, minmax(0, 1fr))",
              gap: 20,
            }}
            aria-label="Test venue grid"
          >
            {venues.map((v) => (
              <div
                key={v.id}
                style={{
                  height: 560,
                  borderRadius: "var(--lwd-radius-card, 8px)",
                  overflow: "hidden",
                }}
              >
                <LuxuryVenueCard
                  v={v}
                  onView={() => console.log("View", v.name)}
                  quickViewItem={qvItem}
                  setQuickViewItem={setQvItem}
                  matchedStyles={[]}
                  otherFilters={{}}
                />
              </div>
            ))}
          </div>
        </div>

        {/* DEBUG INFO */}
        <div style={{
          maxWidth: 1400,
          margin: "40px auto 0",
          padding: 24,
          background: C.card,
          borderRadius: 8,
          fontFamily: NU,
          fontSize: 12,
          color: C.textSecondary,
        }}>
          <strong>Debug Info:</strong>
          <br />
          mapOn: {String(mapOn)} | isMobile: {String(isMobile)} | Cards: {venues.length}
          <br />
          Expected columns: {isMobile ? 1 : mapOn ? 2 : 3}
        </div>
      </div>
    </>
  );
}
