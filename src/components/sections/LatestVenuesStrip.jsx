// ─── src/components/sections/LatestVenuesStrip.jsx ───────────────────────────
// "Latest Venues." section — editorial heading + subtext + horizontal LuxuryVenueCard slider
// Mirrors the Italy page pattern. Fully prop-driven, all text editable from the studio.
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import SliderNav from "../ui/SliderNav";
import LuxuryVenueCard from "../cards/LuxuryVenueCard";
import GCard from "../cards/GCard";
import GCardMobile from "../cards/GCardMobile";
import HCard from "../cards/HCard";
import VenueListItemCard from "../cards/VenueListItemCard";
import VenueMapPanel from "../maps/VenueMapPanel";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function LatestVenuesStrip({
  venues = [],
  heading,
  subtext,
  locationName = "",
  onViewVenue,
  onQuickView,
  isMobile = false,
  cardStyle = "luxury", // "luxury" | "standard"
  viewMode = "grid",
  onViewMode,
}) {
  const C = useTheme();
  const [qvItem, setQvItem] = useState(null);
  const [hoveredVenueId, setHoveredVenueId] = useState(null);
  const [activePinnedId, setActivePinnedId] = useState(null);

  if (venues.length === 0) return null;

  const displayHeading = heading || "Latest Venues.";
  const displaySub =
    subtext ||
    `Newly added${locationName ? ` ${locationName}` : ""} villas, palazzi, and estates, each personally vetted by our editorial team.`;

  const cardW = isMobile ? 300 : 340;

  return (
    <div style={{ background: C.black }}>

      {/* ── Editorial header ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "52px 16px 8px" : "52px 48px 8px" }}>
        <p
          style={{
            fontFamily: GD,
            fontSize: "clamp(22px,2.5vw,32px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: C.grey,
            letterSpacing: "0.5px",
            margin: "0 0 6px",
          }}
        >
          {displayHeading}
        </p>
        <p
          style={{
            fontFamily: NU,
            fontSize: 13,
            color: C.grey,
            opacity: 0.6,
            lineHeight: 1.6,
            maxWidth: 520,
            margin: 0,
          }}
        >
          {displaySub}
        </p>
      </div>

      {/* ── Venue card slider ── */}
      <div
        className="lwd-venue-list-wrap"
        style={{
          maxWidth: viewMode === "list" && !isMobile ? "none" : 1280,
          margin: "0 auto",
          padding: isMobile
            ? "28px 0 56px"
            : viewMode === "list"
              ? "28px 0 56px 48px"
              : "28px 48px 56px",
        }}
      >
        {isMobile ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 10 }}>
            {venues.map((v) => (
              <LuxuryVenueCard
                key={v.id}
                v={v}
                onView={onViewVenue}
                isMobile={isMobile}
                quickViewItem={qvItem}
                setQuickViewItem={setQvItem}
              />
            ))}
          </div>
        ) : viewMode === "list" ? (
          /* ── List + Map split layout ── */
          <div style={{
            display:             "grid",
            gridTemplateColumns: "minmax(0, 1fr) clamp(360px, 32vw, 480px)",
            columnGap:           32,
            alignItems:          "start",
            minWidth:            0,
          }}>
            {/* Left: venue list */}
            <div aria-label="Venues list" style={{
              minWidth:      0,
              display:       "flex",
              flexDirection: "column",
              gap:           12,
              paddingLeft:   50,
            }}>
              {venues.map((v) => (
                <div
                  key={v.id}
                  data-venue-id={v.id}
                  onMouseEnter={() => setHoveredVenueId(v.id)}
                  onMouseLeave={() => setHoveredVenueId(null)}
                >
                  <VenueListItemCard
                    v={v}
                    onView={() => onViewVenue?.(v.id || v.slug)}
                    isHighlighted={hoveredVenueId === v.id || activePinnedId === v.id}
                    quickViewItem={qvItem}
                    setQuickViewItem={setQvItem}
                  />
                </div>
              ))}
            </div>

            {/* Right: sticky map panel */}
            <div style={{
              width:        "100%",
              minWidth:     0,
              position:     "sticky",
              top:          72,
              height:       "calc(100vh - 120px)",
              borderRadius: "var(--lwd-radius-card) 0 0 var(--lwd-radius-card)",
              overflow:     "hidden",
            }}>
              <VenueMapPanel
                venues={venues}
                hoveredId={hoveredVenueId}
                activePinnedId={activePinnedId}
                onPinHover={setHoveredVenueId}
                onPinLeave={() => setHoveredVenueId(null)}
                onPinClick={(id) => {
                  setActivePinnedId(id);
                  const el = document.querySelector(`[data-venue-id="${id}"]`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }}
                onToggleView={() => onViewMode?.("grid")}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16, maxWidth: 1180 }}>
            {venues.map((v) => (
              <LuxuryVenueCard
                key={v.id}
                v={v}
                onView={onViewVenue}
                isMobile={false}
                quickViewItem={qvItem}
                setQuickViewItem={setQvItem}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
