// ─── src/components/sections/VendorPreview.jsx ──────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { useShortlist } from "../../shortlist/ShortlistContext";
import { GLOBAL_VENDORS } from "../../data/globalVendors";
import { track } from "../../utils/track";
import GCard from "../cards/GCard";
import QuickViewModal from "../modals/QuickViewModal";
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

/* Map global vendor schema → GCard expected props */
function normalise(v) {
  return {
    ...v,
    region: v.country,
    priceFrom: v.price,
    online: v.featured, // featured vendors shown as online
    type: "vendor",
    specialties: v.includes,
  };
}

export default function VendorPreview({ onViewVendor }) {
  const C = useTheme();
  const { isShortlisted, toggleItem } = useShortlist();
  const [quickViewItem, setQuickViewItem] = useState(null);
  const isMobile = useIsMobile();
  const featured = GLOBAL_VENDORS.filter((v) => v.featured).slice(0, 12);

  return (
    <section
      aria-label="Handpicked vendors"
      className="home-vendor-preview"
      style={{
        position: "relative",
        background: C.black,
        paddingTop: isMobile ? "80px" : "110px",
        paddingBottom: isMobile ? "100px" : "100px",
        overflow: "hidden",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      {/* Heading */}
      <div style={{ maxWidth: 1320, margin: "0 auto", position: "relative", paddingLeft: isMobile ? "16px" : "60px", paddingRight: isMobile ? "16px" : "60px", marginBottom: 56 }}>
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

      {/* Card slider — full bleed */}
      <div style={{ marginBottom: 48, paddingLeft: isMobile ? "0" : "60px", paddingRight: isMobile ? "0" : "60px" }}>
          {isMobile ? (
            /* Mobile: full width vertical scroll */
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "16px",
              }}
            >
              {featured.map((v) => {
                const nv = normalise(v);
                return (
                  <div
                    key={v.id}
                    className="home-vendor-card-mobile"
                    style={{
                      flex: "0 0 auto",
                      width: "100%",
                      paddingLeft: "0",
                      paddingRight: "0",
                    }}
                  >
                    <GCard
                      v={nv}
                      saved={isShortlisted(v.id)}
                      onSave={() => {
                        toggleItem({ id: v.id, name: v.name, type: v.cat });
                        track("shortlist_add", { id: v.id });
                      }}
                      onView={() => {
                        track("card_click", { id: v.id });
                        onViewVendor?.(v);
                      }}
                      onQuickView={() => {
                        track("card_quick_view", { id: v.id });
                        setQuickViewItem(nv);
                      }}
                    />
                  </div>
                );
              })}
            </div>
          ) : (
            /* Desktop: horizontal carousel */
            <SliderNav className="home-vendor-grid" cardWidth={360} gap={24}>
              {featured.map((v) => {
                const nv = normalise(v);
                return (
                  <div key={v.id} className="home-vendor-card" style={{ flex: "0 0 360px", scrollSnapAlign: "start" }}>
                    <GCard
                      v={nv}
                      saved={isShortlisted(v.id)}
                      onSave={() => {
                        toggleItem({ id: v.id, name: v.name, type: v.cat });
                        track("shortlist_add", { id: v.id });
                      }}
                      onView={() => {
                        track("card_click", { id: v.id });
                        onViewVendor?.(v);
                      }}
                      onQuickView={() => {
                        track("card_quick_view", { id: v.id });
                        setQuickViewItem(nv);
                      }}
                    />
                  </div>
                );
              })}
            </SliderNav>
          )}
        </div>

      {/* CTA */}
      <div style={{ textAlign: "center", paddingLeft: isMobile ? "0" : "60px", paddingRight: isMobile ? "0" : "60px" }}>
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

      {/* Quick View modal */}
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
    </section>
  );
}
