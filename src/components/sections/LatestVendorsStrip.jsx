// ─── src/components/sections/LatestVendorsStrip.jsx ──────────────────────────
// "Latest Vendors." section — editorial heading + subtext + horizontal vendor card slider
// Mirrors LatestVenuesStrip pattern exactly, using LuxuryVendorCard.
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import SliderNav from "../ui/SliderNav";
import LuxuryVendorCard from "../cards/LuxuryVendorCard";
import GCard from "../cards/GCard";
import GCardMobile from "../cards/GCardMobile";
import HCard from "../cards/HCard";
import VenueListItemCard from "../cards/VenueListItemCard";
import MASTERMap from "../maps/MASTERMap";
import { PinSyncBus } from "../maps/PinSyncBus";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function LatestVendorsStrip({
  vendors = [],
  heading,
  subtext,
  locationName = "",
  countrySlug = "italy",
  onViewVendor,
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

  if (vendors.length === 0) return null;

  const displayHeading = heading || "Latest Vendors.";
  const displaySub =
    subtext ||
    `Planners, photographers, florists, and culinary artists — the professionals behind${locationName ? ` ${locationName}'s` : ""} finest celebrations.`;

  const cardW = isMobile ? 300 : 320;

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

      {/* ── Vendor card slider ── */}
      <div
        className="lwd-vendor-list-wrap"
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
            {vendors.map((v) => (
              <LuxuryVendorCard
                key={v.id}
                v={v}
                onView={onViewVendor}
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
            {/* Left: vendor list */}
            <div aria-label="Vendors list" style={{
              minWidth:      0,
              display:       "flex",
              flexDirection: "column",
              gap:           12,
              paddingLeft:   50,
            }}>
              {vendors.map((v) => (
                <div
                  key={v.id}
                  data-venue-id={v.id}
                  onMouseEnter={() => { setHoveredVenueId(v.id); PinSyncBus.emit("card:hover", v.id); }}
                  onMouseLeave={() => { setHoveredVenueId(null); PinSyncBus.emit("card:leave", v.id); }}
                >
                  <VenueListItemCard
                    v={v}
                    onView={() => onViewVendor?.(v.id || v.slug)}
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
              height:       "calc(100vh - 72px)",
              borderRadius: "var(--lwd-radius-card) 0 0 var(--lwd-radius-card)",
              overflow:     "hidden",
            }}>
              <MASTERMap
                venues={vendors}
                label={`Vendors · ${locationName || "Latest"}`}
                viewMode="list"
                onToggleView={() => onViewMode?.("grid")}
                countrySlug={countrySlug}
                pageBg={C.black}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: 16, maxWidth: 1180 }}>
            {vendors.map((v) => (
              <LuxuryVendorCard
                key={v.id}
                v={v}
                onView={onViewVendor}
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
