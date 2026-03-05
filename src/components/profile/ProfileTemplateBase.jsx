import { useState } from "react";
import { ThemeCtx, LIGHT, DARK, GlobalStyles, useIsMobile, FB, FD } from "./ProfileDesignSystem";
import HeroCinematic from "./HeroCinematic";
import StatsStrip from "./StatsStrip";
import ReviewsSection from "./ReviewsSection";
import MediaBlock from "./MediaBlock";

// ── Static discovery data ─────────────────────────────────────────────────────
const SIMILAR_PLANNERS = [
  {
    id: "sp1", name: "Palazzo Events", location: "Rome, Italy",
    rating: 4.9, price: "From £6,500",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sp2", name: "Amalfi Wedding Co.", location: "Amalfi Coast, Italy",
    rating: 4.8, price: "From £5,800",
    img: "https://images.unsplash.com/photo-1507504031003-b417219a0fde?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "sp3", name: "Lake Como Atelier", location: "Como, Lombardy",
    rating: 5.0, price: "From £9,000",
    img: "https://images.unsplash.com/photo-1469371670807-013ccf25f16a?auto=format&fit=crop&w=600&q=80",
  },
];

const RECENTLY_VIEWED = [
  {
    id: "rv1", name: "Villa d'Este", location: "Lake Como",
    rating: 5.0, price: "From £35,000",
    img: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=600&q=80",
  },
  {
    id: "rv2", name: "Claridge's London", location: "London, UK",
    rating: 4.9, price: "From £28,000",
    img: "https://images.unsplash.com/photo-1544078751-58fee2d8a03b?w=600&q=80",
  },
  {
    id: "rv3", name: "Aman Venice", location: "Venice, Italy",
    rating: 5.0, price: "From £35,000",
    img: "https://images.unsplash.com/photo-1520854221256-17451cc331bf?w=600&q=80",
  },
];

function Stars({ rating, size = 12 }) {
  const full = Math.round(rating);
  return (
    <span style={{ color: "#C9A84C", fontSize: size, letterSpacing: 1 }}>
      {"★".repeat(Math.min(full, 5))}{"☆".repeat(Math.max(0, 5 - full))}
    </span>
  );
}

function DiscoveryCards({ title, subtitle, items, C, isMobile }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: isMobile ? 22 : 26, color: C.text, marginBottom: 6 }}>{title}</div>
          <div style={{ width: 32, height: 1, background: C.gold, marginBottom: 0 }} />
        </div>
      </div>
      <div style={{ fontFamily: FB, fontSize: 12, color: C.gold, marginBottom: 24, marginTop: 12 }}>{subtitle}</div>
      {isMobile ? (
        <div style={{
          display: "flex", gap: 12, overflowX: "auto", scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch", scrollbarWidth: "none", msOverflowStyle: "none",
          marginLeft: -16, marginRight: -16, paddingLeft: 16, paddingRight: 16,
        }}>
          {items.map(v => (
            <div key={v.id} style={{ flex: "0 0 260px", scrollSnapAlign: "start" }}>
              <div style={{ border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ overflow: "hidden", aspectRatio: "4/3" }}>
                  <img src={v.img} alt={v.name} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                </div>
                <div style={{ padding: 14 }}>
                  <div style={{ fontFamily: FD, fontSize: 16, color: C.text, marginBottom: 3 }}>{v.name}</div>
                  <div style={{ fontFamily: FB, fontSize: 11, color: C.textLight, marginBottom: 8 }}>📍 {v.location}</div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                      <Stars rating={v.rating} size={11} />
                      <span style={{ fontFamily: FB, fontSize: 11, color: C.textLight }}>{v.rating}</span>
                    </div>
                    <span style={{ fontFamily: FD, fontSize: 14, color: C.gold }}>{v.price}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="lwd-discovery-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
          {items.map(v => (
            <div key={v.id}
              style={{ border: `1px solid ${C.border}`, background: C.surface, overflow: "hidden", cursor: "pointer", transition: "box-shadow 0.2s" }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = "0 4px 20px rgba(0,0,0,0.1)"}
              onMouseLeave={e => e.currentTarget.style.boxShadow = "none"}
            >
              <div style={{ overflow: "hidden", aspectRatio: "1/1" }}>
                <img src={v.img} alt={v.name} style={{
                  width: "100%", height: "100%", objectFit: "cover", display: "block",
                  transition: "transform 0.4s",
                }}
                  onMouseEnter={e => e.currentTarget.style.transform = "scale(1.04)"}
                  onMouseLeave={e => e.currentTarget.style.transform = "scale(1)"}
                />
              </div>
              <div style={{ padding: 18 }}>
                <div style={{ fontFamily: FD, fontSize: 18, color: C.text, marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontFamily: FB, fontSize: 12, color: C.textLight, marginBottom: 10 }}>📍 {v.location}</div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <Stars rating={v.rating} size={11} />
                    <span style={{ fontFamily: FB, fontSize: 12, color: C.textLight }}>{v.rating}</span>
                  </div>
                  <span style={{ fontFamily: FD, fontSize: 16, color: C.gold }}>{v.price}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * ProfileTemplateBase - Unified profile page template for Venues and Planners
 *
 * Section order:
 * 1. Hero (cinematic)
 * 2. Stats bar
 * 3. Awards and As Seen In
 * 4. About/Editorial section
 * 5. Featured image block (750px centered)
 * 6. Media gallery (images + videos)
 * 7. Reviews with star distribution
 * 8. FAQ accordion
 * 9. You Might Also Love (related)
 * 10. Recently Viewed
 * 11. Footer
 */
export default function ProfileTemplateBase({
  entity,           // venue or planner data object
  entityType,       // "venue" or "planner"
  hideAtAGlance = false, // true for planners
  onEnquire = () => {},
  header = null,    // React component for navigation header
  sidebar = null,   // React component for sidebar
  mobileBar = null, // React component for mobile bottom bar
  footer = null,    // React component for footer
  children = null,  // Additional content
}) {
  const [darkMode, setDarkMode] = useState(false);
  const C = darkMode ? DARK : LIGHT;
  const isMobile = useIsMobile();

  if (!entity) return null;

  return (
    <ThemeCtx.Provider value={C}>
      <GlobalStyles />
      <div style={{
        background: C.bg,
        minHeight: "100vh",
        color: C.text,
      }}>
        {/* Navigation header */}
        {header || <div style={{ height: 72 }} />}

        {/* Hero Section */}
        <HeroCinematic
          entity={entity}
          onEnquire={onEnquire}
          featured={entity.featured}
        />

        {/* Stats Bar */}
        <StatsStrip entity={entity} />

        {/* Awards & As Seen In */}
        {entity.awards && entity.awards.length > 0 && (
          <div className="lwd-awards-band" style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "28px 40px" }}>
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>Awards & Recognition</div>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {entity.awards.map(a => (
                    <div key={a} style={{
                      padding: "8px 14px",
                      border: `1px solid ${C.gold}30`,
                      background: `${C.gold}08`,
                      borderRadius: 3,
                      fontFamily: FB, fontSize: 11, fontWeight: 600,
                      color: C.gold, letterSpacing: "0.3px",
                    }}>
                      ✦ {a}
                    </div>
                  ))}
                </div>
              </div>
              {entity.press && entity.press.length > 0 && (
                <div>
                  <div style={{ fontFamily: FB, fontSize: 9, color: C.textMuted, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 12 }}>As Seen In</div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                    {entity.press.map(p => (
                      <span key={p} style={{
                        fontFamily: FD, fontSize: isMobile ? 15 : 17, fontWeight: 400,
                        color: C.textLight, letterSpacing: "0.5px",
                      }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="lwd-main-content" style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "32px 16px 120px" : "48px 40px 120px" }}>
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 360px", gap: isMobile ? 0 : 56, alignItems: "start" }}>
            {/* Left Column - Main Content */}
            <div>
              {/* 1. Editorial/About */}
              {entity.editorial && (
                <section style={{ marginBottom: 56 }}>
                  <p style={{ fontFamily: FB, fontSize: isMobile ? 15 : 16, color: C.textMid, lineHeight: 1.9, marginBottom: 24, maxWidth: 720 }}>
                    {entity.editorial}
                  </p>
                </section>
              )}

              {/* 2. Featured Image Block (750px centered) */}
              {entity.featuredImage && (
                <section style={{ marginBottom: 56, display: "flex", justifyContent: "center" }}>
                  <img
                    src={entity.featuredImage}
                    alt="Featured"
                    style={{ maxWidth: 750, width: "100%", height: "auto", borderRadius: 3, display: "block" }}
                  />
                </section>
              )}

              {/* 3. Media Gallery (Videos + Images) */}
              {(entity.videos?.length > 0 || entity.gallery?.length > 0) && (
                <MediaBlock
                  videos={entity.videos || []}
                  gallery={entity.gallery || []}
                />
              )}

              {/* 4. Reviews */}
              {entity.testimonials && entity.testimonials.length > 0 && (
                <ReviewsSection testimonials={entity.testimonials} entity={entity} />
              )}

              {/* 5. FAQ / extra children */}
              {children && children.faq}

              {/* 6. You Might Also Love */}
              <DiscoveryCards
                title="You Might Also Love"
                subtitle="✦ Curated by Aura based on your browsing"
                items={entity.similarItems || SIMILAR_PLANNERS}
                C={C}
                isMobile={isMobile}
              />

              {/* 7. Recently Viewed */}
              <DiscoveryCards
                title="Recently Viewed"
                subtitle="✦ Based on your browsing history"
                items={RECENTLY_VIEWED}
                C={C}
                isMobile={isMobile}
              />

              {/* 8. Extra children */}
              {children && children.questionCTA}
            </div>

            {/* Right Column - Sidebar (Desktop Only) */}
            {!isMobile && sidebar && (
              <div className="lwd-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 56, alignSelf: "start" }}>
                {sidebar}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        {footer}

        {/* Mobile Bar (Mobile Only) */}
        {isMobile && mobileBar}
      </div>
    </ThemeCtx.Provider>
  );
}
