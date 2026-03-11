// ─── src/components/sections/VendorPreview.jsx ──────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useShortlist } from "../../shortlist/ShortlistContext";
import { GLOBAL_VENDORS } from "../../data/globalVendors";
import { track } from "../../utils/track";
import LuxuryVendorCard from "../cards/LuxuryVendorCard";
import SliderNav from "../ui/SliderNav";
import QuickViewModal from "../modals/QuickViewModal";

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

/* Map global vendor schema → Card expected props */
function normalise(v) {
  return {
    ...v,
    region: v.country,
    priceFrom: v.price,
    online: v.featured,
    type: "vendor",
    specialties: v.includes,
  };
}

export default function VendorPreview({ onViewVendor, dbVendors }) {
  const C = useTheme();
  const { isShortlisted, toggleItem } = useShortlist();
  const [quickViewItem, setQuickViewItem] = useState(null);
  const isMobile = useIsMobile();
  // Use live DB vendors when available; fall back to curated static data
  const featured = (dbVendors && dbVendors.length > 0)
    ? dbVendors.slice(0, 12)
    : GLOBAL_VENDORS.filter((v) => v.featured).slice(0, 12).map(normalise);

  // Mobile: vertical feed. Desktop: horizontal carousel
  if (isMobile) {
    return (
      <>
        <div
          aria-label="Handpicked vendors – Mobile feed"
          className="home-vendor-preview-mobile"
          style={{
            position: "relative",
            background: C.black,
            width: "100vw",
            overflowX: "hidden",
            overflowY: "auto",
            scrollSnapType: "y mandatory",
            display: "flex",
            flexDirection: "column",
            margin: 0,
            padding: 0,
            gap: "3px",
          }}
        >
          {featured.map((v) => {
            // DB vendors are already normalised; only run normalise() on static fallback data
            const nv = (dbVendors && dbVendors.length > 0) ? v : normalise(v);
            return (
              <div
                key={v.id}
                className="home-vendor-card"
                style={{
                  width: "100vw",
                  flex: "0 0 calc(100dvh - 10px)",
                  scrollSnapAlign: "start",
                  scrollMarginTop: 0,
                  borderRadius: 0,
                  margin: 0,
                  padding: 0,
                }}
              >
                <LuxuryVendorCard
                  v={nv}
                  isMobile={true}
                  onView={() => {
                    track("card_click", { id: v.id });
                    onViewVendor?.(v);
                  }}
                  onQuickView={() => {
                    track("card_quick_view", { id: v.id });
                  }}
                  quickViewItem={quickViewItem}
                  setQuickViewItem={setQuickViewItem}
                />
              </div>
            );
          })}
        </div>
        {/* Quick View modal - outside overflow clip */}
        {quickViewItem && (
          <QuickViewModal
            item={quickViewItem}
            onClose={() => setQuickViewItem(null)}
            onViewFull={() => {
              const raw = featured.find((f) => f.id === quickViewItem.id);
              setQuickViewItem(null);
              onViewVendor?.(raw ?? quickViewItem);
            }}
          />
        )}
      </>
    );
  }

  // Desktop: Section with heading + carousel + CTA
  return (
    <>
      <section
        aria-label="Handpicked vendors"
        className="home-vendor-preview"
        style={{
          position: "relative",
          background: C.black,
          padding: "110px 60px",
          overflow: "hidden",
          borderTop: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative" }}>
          {/* Heading */}
          <div style={{ marginBottom: 56 }}>
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
                Handpicked for You
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
              The Finest{" "}
              <span style={{ fontStyle: "italic", color: C.gold }}>
                Wedding Vendors
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
              126 venues and vendors currently available. Refine by style,
              guest count, and region. Trusted by couples planning weddings
              across Europe and beyond.
            </p>
          </div>

          {/* Card slider */}
          <div style={{ marginBottom: 48 }}>
            <SliderNav className="home-vendor-grid" cardWidth={360} gap={24}>
              {featured.map((v) => {
                // DB vendors are already normalised; only run normalise() on static fallback data
                const nv = (dbVendors && dbVendors.length > 0) ? v : normalise(v);
                return (
                  <div key={v.id} className="home-vendor-card" style={{ flex: "0 0 360px", scrollSnapAlign: "start" }}>
                    <LuxuryVendorCard
                      v={nv}
                      isMobile={false}
                      onView={() => {
                        track("card_click", { id: v.id });
                        onViewVendor?.(v);
                      }}
                      onQuickView={() => {
                        track("card_quick_view", { id: v.id });
                      }}
                      quickViewItem={quickViewItem}
                      setQuickViewItem={setQuickViewItem}
                    />
                  </div>
                );
              })}
            </SliderNav>
          </div>

          {/* CTA */}
          <div style={{ textAlign: "center" }}>
            <button
              style={{
                background: "transparent",
                color: C.gold,
                border: `1px solid rgba(201,168,76,0.4)`,
                borderRadius: "var(--lwd-radius-card)",
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
              View All Vendors →
            </button>
          </div>
        </div>
      </section>

      {/* Quick View modal - outside overflow clip */}
      {quickViewItem && (
        <QuickViewModal
          item={quickViewItem}
          onClose={() => setQuickViewItem(null)}
          onViewFull={() => {
            const raw = featured.find((f) => f.id === quickViewItem.id);
            setQuickViewItem(null);
            onViewVendor?.(raw ?? quickViewItem);
          }}
        />
      )}
    </>
  );
}
