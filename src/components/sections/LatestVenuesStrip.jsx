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
import QuickViewModal from "../modals/QuickViewModal";

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
  const [localQvItem, setLocalQvItem] = useState(null);

  // If parent passes onQuickView, use it (parent owns the modal).
  // Otherwise manage locally with a self-contained QuickViewModal.
  const handleQv = onQuickView || setLocalQvItem;

  if (venues.length === 0) return null;

  const displayHeading = heading || "Latest Venues.";
  const displaySub =
    subtext ||
    `Newly added${locationName ? ` ${locationName}` : ""} venues and estates, each personally vetted by our editorial team.`;

  const cardW = isMobile ? 300 : 340;

  return (
    <div style={{ background: C.card }}>
      {/* ── Divider ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
        <div style={{ height: 1, background: C.border }} />
      </div>

      {/* ── Editorial header ── */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 48px 8px" }}>
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
        style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 56px" }}
      >
        <SliderNav className="home-venue-grid" cardWidth={360} gap={24}>
          {venues.map((v) => (
            <div key={v.id} className="home-venue-card" style={{ flex: "0 0 360px", scrollSnapAlign: "start" }}>
              <LuxuryVenueCard
                v={v}
                onView={onViewVenue}
                isMobile={isMobile}
                setQuickViewItem={handleQv}
              />
            </div>
          ))}
        </SliderNav>
      </div>

      {/* Self-contained QV modal — only used when no parent onQuickView prop */}
      {!onQuickView && localQvItem && (
        <QuickViewModal
          item={localQvItem}
          onClose={() => setLocalQvItem(null)}
          onViewFull={() => { setLocalQvItem(null); onViewVenue?.(localQvItem); }}
        />
      )}
    </div>
  );
}
