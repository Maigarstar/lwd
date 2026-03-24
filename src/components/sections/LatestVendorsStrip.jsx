// ─── src/components/sections/LatestVendorsStrip.jsx ──────────────────────────
// "Latest Vendors." section — editorial heading + subtext + horizontal vendor card slider
// Mirrors LatestVenuesStrip pattern exactly, using LuxuryVendorCard.
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import SliderNav from "../ui/SliderNav";
import LuxuryVendorCard from "../cards/LuxuryVendorCard";
import GCard from "../cards/GCard";
import GCardMobile from "../cards/GCardMobile";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function LatestVendorsStrip({
  vendors = [],
  heading,
  subtext,
  locationName = "",
  onViewVendor,
  onQuickView,
  isMobile = false,
  cardStyle = "luxury", // "luxury" | "standard"
}) {
  const C = useTheme();
  const [qvItem, setQvItem] = useState(null);

  if (vendors.length === 0) return null;

  const displayHeading = heading || "Latest Vendors.";
  const displaySub =
    subtext ||
    `Planners, photographers, florists, and culinary artists — the professionals behind${locationName ? ` ${locationName}'s` : ""} finest celebrations.`;

  const cardW = isMobile ? 300 : 320;

  return (
    <div style={{ background: C.bg }}>
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

      {/* ── Vendor card slider ── */}
      <div
        className="lwd-vendor-list-wrap"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 56px" }}
      >
        <SliderNav
          className="lwd-vendor-slider"
          cardWidth={cardW}
          gap={isMobile ? 12 : 16}
        >
          {vendors.map((v) => (
            <div
              key={v.id}
              className="lwd-vendor-card"
              style={{ flex: `0 0 ${cardW}px`, scrollSnapAlign: "start" }}
            >
              {cardStyle === "luxury" ? (
                <LuxuryVendorCard
                  v={v}
                  onView={onViewVendor}
                  isMobile={isMobile}
                  quickViewItem={qvItem}
                  setQuickViewItem={setQvItem}
                />
              ) : isMobile ? (
                <GCardMobile v={v} onView={onViewVendor} />
              ) : (
                <GCard
                  v={v}
                  onView={onViewVendor}
                  onQuickView={onQuickView || setQvItem}
                />
              )}
            </div>
          ))}
        </SliderNav>
      </div>
    </div>
  );
}
