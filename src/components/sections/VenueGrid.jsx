// ─── src/components/sections/VenueGrid.jsx ──────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";
import LuxuryVenueCard from "../cards/LuxuryVenueCard";
import SliderNav from "../ui/SliderNav";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setMobile(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [bp]);
  return mobile;
}

export default function VenueGrid({ venues = [], onViewVenue }) {
  const C = useTheme();
  const isMobile = useIsMobile();
  const display = venues.slice(0, 12);

  return (
    <section
      aria-label="Featured wedding venues"
      className="home-venue-grid-section"
      style={{
        position: "relative",
        background: C.black,
        padding: "80px 0 100px",
        overflow: "hidden",
      }}
    >
      <div style={{ maxWidth: 1320, margin: "0 auto", padding: "0 60px" }}>
        {/* Heading — mirrors VendorPreview style */}
        <div style={{ marginBottom: 48 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }}
            />
            <span
              style={{
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: C.gold,
                fontWeight: 600,
              }}
            >
              The Edit
            </span>
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(32px, 3.5vw, 52px)",
              color: C.off,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Venues Beyond{" "}
            <span style={{ fontStyle: "italic", color: C.gold }}>
              Compare
            </span>
          </h2>
          <p
            style={{
              fontFamily: NU,
              fontSize: 14,
              color: C.grey,
              lineHeight: 1.7,
              maxWidth: 560,
              marginTop: 14,
              fontWeight: 300,
            }}
          >
            Explore our hand-picked selection of the world's most extraordinary
            wedding venues — filtered by location, capacity, style, and features.
          </p>
        </div>

        {/* Card slider */}
        <div style={{ marginBottom: 48 }}>
          <SliderNav className="home-venue-grid" cardWidth={isMobile ? 300 : 400} gap={isMobile ? 12 : 24}>
            {display.map((v) => (
              <div key={v.id} className="home-venue-card" style={{ flex: isMobile ? "0 0 300px" : "0 0 400px", scrollSnapAlign: "start" }}>
                <LuxuryVenueCard
                  v={v}
                  isMobile={isMobile}
                  onView={() => {
                    track("venue_card_click", { id: v.id, name: v.name });
                    onViewVenue?.(v);
                  }}
                />
              </div>
            ))}
          </SliderNav>
        </div>

        {/* View all CTA */}
        <div style={{ textAlign: "center" }}>
          <button
            style={{
              background: "transparent",
              color: C.gold,
              border: "1px solid rgba(201,168,76,0.4)",
              borderRadius: "var(--lwd-radius-input)",
              padding: "14px 40px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              transition: "all 0.25s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.gold;
              e.currentTarget.style.color = "#0a0906";
              e.currentTarget.style.borderColor = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.gold;
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
            }}
          >
            View All Venues →
          </button>
        </div>
      </div>

    </section>
  );
}
