// ─── src/components/sections/LatestVendorsStrip.jsx ──────────────────────────
// "Latest Vendors." section — editorial heading + subtext + horizontal vendor card slider
// Mirrors LatestVenuesStrip pattern exactly, using LuxuryVendorCard.
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import LuxuryVendorCard from "../cards/LuxuryVendorCard";
import GCard from "../cards/GCard";
import GCardMobile from "../cards/GCardMobile";
import HCard from "../cards/HCard";

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
  viewMode = "grid",
  onViewMode,
}) {
  const C = useTheme();
  const [qvItem, setQvItem] = useState(null);

  if (vendors.length === 0) return null;

  const displayHeading = heading || "Latest Vendors.";
  const displaySub =
    subtext ||
    `Planners, photographers, florists, and culinary artists — the professionals behind${locationName ? ` ${locationName}'s` : ""} finest celebrations.`;

  return (
    <div style={{ background: C.black }}>

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

      {/* ── Vendor card grid ── */}
      <div
        className="lwd-premium-grid"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 56px" }}
      >
        {viewMode === "grid" ? (
          <div
            className="lwd-vendor-grid"
            style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 360px)",
              gap: isMobile ? 12 : 16,
              justifyContent: "center",
            }}
            aria-label="Vendors grid"
          >
            {vendors.map((v) => (
              <div
                key={v.id}
                className="lwd-vendor-card"
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
          </div>
        ) : (
          <div aria-label="Vendors list" style={{ maxWidth: 1280, margin: "0 auto" }}>
            {vendors.map((v) => (
              <HCard
                key={v.id}
                v={v}
                onView={onViewVendor}
                onQuickView={onQuickView || setQvItem}
                onSave={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
