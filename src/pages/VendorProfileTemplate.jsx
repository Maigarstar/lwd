// ─── src/pages/VendorProfileTemplate.jsx ──────────────────────────────────────
// Reusable vendor detail template: planner first, then photographer, florist, etc.
// Desktop: 2-col grid (content + sticky sidebar). Mobile: bottom bar + sheet.
// ──────────────────────────────────────────────────────────────────────────────
import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import CatNav from "../components/nav/CatNav";
import SiteFooter from "../components/sections/SiteFooter";
import SliderNav from "../components/ui/SliderNav";
import PlannerMapPanel from "../components/maps/PlannerMapPanel";
import LightboxModal from "../components/ui/LightboxModal";

import VendorSidebar, { ContactPersonCard } from "../components/vendor/VendorSidebar";
import VendorMobileBar from "../components/vendor/VendorMobileBar";
import VendorContactForm from "../components/vendor/VendorContactForm";

// ── Tokens ───────────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const GOLD = "#C9A84C";

const FALLBACK_HERO =
  "https://images.unsplash.com/photo-1523438097201-512ae7d59c2a?auto=format&fit=crop&w=2000&q=80";

const DEFAULT_STEPS = [
  { title: "Discovery", description: "A calm, focused call to define the feeling, the guest journey, and the priorities." },
  { title: "Design", description: "Creative direction, vendor curation, and a plan that keeps everything aligned." },
  { title: "Execution", description: "On the day, they run point, protect the couple, and keep the room effortless." },
];

// ── Utility helpers ──────────────────────────────────────────────────────────
function money(n) {
  if (!n && n !== 0) return null;
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP", maximumFractionDigits: 0 }).format(n);
  } catch {
    return `£${n}`;
  }
}

function stars(r = 0) {
  const x = Math.max(0, Math.min(5, Math.round(r)));
  return "★".repeat(x) + "☆".repeat(5 - x);
}

function useIsMobile(bp = 900) {
  const [m, setM] = useState(() => typeof window !== "undefined" && window.innerWidth < bp);
  useEffect(() => {
    const fn = () => setM(window.innerWidth < bp);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, [bp]);
  return m;
}

function slugToLabel(s) {
  return s ? s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";
}

function vendorTypeLabel(vendorType) {
  switch (vendorType) {
    case "planner": return "Wedding Planners";
    case "photographer": return "Photographers";
    case "florist": return "Florists";
    default: return slugToLabel(vendorType);
  }
}

function vendorTypeBadge(vendorType) {
  switch (vendorType) {
    case "planner": return "Wedding Planner";
    case "photographer": return "Photographer";
    case "florist": return "Florist";
    default: return slugToLabel(vendorType);
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN TEMPLATE
// ═══════════════════════════════════════════════════════════════════════════════
export default function VendorProfileTemplate({
  vendor,
  vendorType = "planner",
  similarVendors = [],
  onBack = () => {},
  onViewVendor,
  countrySlug,
  regionSlug,
  onViewRegion,
  footerNav = {},
}) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [scrolled, setScrolled] = useState(false);
  const heroRef = useRef(null);
  const isMobile = useIsMobile();

  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Chat context ───────────────────────────────────────────────────────────
  const { setChatContext } = useChat();
  useEffect(() => {
    if (!vendor) return;
    setChatContext({
      page: "vendor-profile",
      country: vendor.country || countrySlug || null,
      region: vendor.region || regionSlug || null,
      category: vendorType === "planner" ? "wedding-planners" : vendorType + "s",
      entityId: vendor.id,
      entityName: vendor.name,
    });
  }, [setChatContext, vendor, vendorType, countrySlug, regionSlug]);

  // ── Scroll tracking ────────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Lightbox state ─────────────────────────────────────────────────────────
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [rwModal, setRwModal] = useState(null);

  const openGallery = useCallback((i) => { setLightboxIdx(i); setLightboxOpen(true); }, []);

  // ── Enrich vendor with trustBadges if missing ──────────────────────────────
  const enrichedVendor = useMemo(() => {
    if (!vendor) return null;
    const badges = vendor.trustBadges ? [...vendor.trustBadges] : [];
    if (!badges.length) {
      if (vendor.responseTime) badges.push(`Responds ${vendor.responseTime.toLowerCase()}`);
      if (vendor.responseRate) badges.push(`${vendor.responseRate}% response rate`);
      if (vendor.weddingsPlanned) badges.push(`${vendor.weddingsPlanned}+ weddings planned`);
    }
    return { ...vendor, trustBadges: badges };
  }, [vendor]);

  // ── Memoised arrays ────────────────────────────────────────────────────────
  const galleryItems  = useMemo(() => vendor?.imgs?.slice(0, 16) || [], [vendor]);
  const testimonials  = useMemo(() => vendor?.testimonials || [], [vendor]);
  const realWeddings  = useMemo(() => vendor?.realWeddings || [], [vendor]);
  const approachSteps = useMemo(() => vendor?.approachSteps?.length ? vendor.approachSteps : DEFAULT_STEPS, [vendor]);
  const packages      = useMemo(() => vendor?.packages || [], [vendor]);
  const simVendors    = useMemo(() => (similarVendors || []).slice(0, 6), [similarVendors]);

  // ── Coverage markers ───────────────────────────────────────────────────────
  const coverageMarkers = useMemo(() => {
    if (!vendor) return [];
    if (vendor.coverageCoords?.length) {
      return vendor.coverageCoords.map((c, i) => ({
        id: `cov-${i}`,
        name: c.label || vendor.name,
        city: c.label || "",
        region: vendor.region || "",
        rating: vendor.rating || 0,
        reviews: vendor.reviews || 0,
        priceFrom: vendor.feeFrom ? money(vendor.feeFrom) : null,
        verified: !!vendor.verified,
        lat: c.lat,
        lng: c.lng,
      }));
    }
    if (!vendor.lat || !vendor.lng) return [];
    return [{
      id: vendor.id,
      name: vendor.name,
      city: vendor.city || "",
      region: vendor.region || "",
      rating: vendor.rating || 0,
      reviews: vendor.reviews || 0,
      priceFrom: vendor.feeFrom ? money(vendor.feeFrom) : null,
      verified: !!vendor.verified,
      lat: vendor.lat,
      lng: vendor.lng,
    }];
  }, [vendor]);

  // ── Breadcrumbs ────────────────────────────────────────────────────────────
  const navCrumbs = useMemo(() => {
    if (!vendor) return [];
    return [
      ...(countrySlug ? [{ label: slugToLabel(countrySlug), onClick: onViewRegion ? () => onViewRegion(countrySlug, null) : null }] : []),
      ...(regionSlug  ? [{ label: slugToLabel(regionSlug),  onClick: onViewRegion ? () => onViewRegion(countrySlug, regionSlug) : null }] : []),
      { label: vendorTypeLabel(vendorType), onClick: onBack },
      { label: vendor.name },
    ];
  }, [vendor, countrySlug, regionSlug, vendorType, onBack, onViewRegion]);

  // ── Not found ──────────────────────────────────────────────────────────────
  if (!vendor) {
    return (
      <ThemeCtx.Provider value={C}>
        <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>
          <CatNav onBack={onBack} scrolled={scrolled} darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
          <div style={{ maxWidth: 980, margin: "0 auto", padding: "120px 24px" }}>
            <div style={{ fontFamily: NU, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: C.grey, opacity: 0.6 }}>
              Vendor not found
            </div>
          </div>
          <SiteFooter {...footerNav} />
        </div>
      </ThemeCtx.Provider>
    );
  }

  const heroImg = vendor.heroImg || vendor.imgs?.[0] || FALLBACK_HERO;

  // ═════════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═════════════════════════════════════════════════════════════════════════════
  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>
        <CatNav onBack={onBack} scrolled={scrolled} darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} crumbs={navCrumbs} />

        {/* ════════════════════════════════════════════════════════════════════
            HERO
        ═══════════════════════════════════════════════════════════════════ */}
        <section
          ref={heroRef}
          className={isMobile ? "lwd-hero480" : undefined}
          style={{
            position: "relative",
            height: "72vh",
            minHeight: isMobile ? 400 : 520,
            overflow: "hidden",
            background: "#0a0806",
          }}
        >
          <img
            src={heroImg}
            alt={vendor.name}
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", opacity: 0.55, transform: "scale(1.03)",
            }}
          />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(4,3,2,0.35) 0%,rgba(4,3,2,0.2) 40%,rgba(4,3,2,0.88) 100%)" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(4,3,2,0.7) 0%,transparent 60%)" }} />
          <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},#e8c97a,${GOLD})`, backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", zIndex: 2 }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: isMobile ? "0 20px 40px" : "0 64px 72px" }}>
            <div style={{ maxWidth: 860 }}>
              {/* Badges */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(201,168,76,0.9)", fontWeight: 700 }}>
                  {vendorTypeBadge(vendorType)}
                </span>
                {vendor.verified && (
                  <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0f0d0a", background: GOLD, padding: "5px 12px", borderRadius: "var(--lwd-radius-input)", fontWeight: 800 }}>
                    Verified
                  </span>
                )}
                {vendor.online && (
                  <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(140,255,180,0.85)", background: "rgba(10,12,10,0.55)", border: "1px solid rgba(140,255,180,0.25)", padding: "5px 12px", borderRadius: "var(--lwd-radius-input)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: "rgba(140,255,180,0.9)" }} />
                    Online
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: GD, fontSize: "clamp(40px,5.5vw,76px)", fontWeight: 400, lineHeight: 1.02, margin: 0, letterSpacing: "-0.5px" }}>
                {vendor.name}
              </h1>

              {/* Location + rating + response */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontFamily: NU, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
                  {vendor.city ? `${vendor.city}, ` : ""}{vendor.region || ""}{vendor.country ? `, ${vendor.country}` : ""}
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: GOLD, letterSpacing: "0.1em" }}>
                  {stars(vendor.rating)} <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>({vendor.reviews || 0})</span>
                </div>
                {vendor.responseTime && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Typical reply, {vendor.responseTime}
                  </div>
                )}
              </div>

              {/* Hero CTAs */}
              <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <PrimaryBtn label="Send enquiry" onClick={() => {
                  const formEl = document.querySelector(".vpt-sidebar .vpt-form-anchor") || document.querySelector(".vpt-mobile-enquiry");
                  if (formEl) formEl.scrollIntoView({ behavior: "smooth", block: "center" });
                }} C={C} />
                <GhostBtn label="Chat" onClick={() => {}} C={C} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            MOBILE-ONLY CONTACT PERSON CARD
        ═══════════════════════════════════════════════════════════════════ */}
        <div className="vpt-mobile-contact" style={{ padding: "0 16px", marginTop: 16 }}>
          <ContactPersonCard vendor={enrichedVendor} C={C} />
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            MAIN 2-COLUMN GRID
        ═══════════════════════════════════════════════════════════════════ */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "clamp(32px,5vw,48px) clamp(16px,4vw,40px) 120px" }}>
          <div className="vpt-main-grid" style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) 360px", gap: 56, alignItems: "start" }}>

            {/* ── LEFT RAIL ─────────────────────────────────────────────── */}
            <div>
              {/* 1. EDITORIAL + AT A GLANCE */}
              <EditorialSection vendor={vendor} C={C} isMobile={isMobile} />

              {/* 2. GALLERY */}
              {galleryItems.length > 0 && (
                <GallerySection
                  vendor={vendor} C={C} isMobile={isMobile}
                  galleryItems={galleryItems} openGallery={openGallery}
                />
              )}

              {/* 3. TESTIMONIALS */}
              {testimonials.length > 0 && (
                <TestimonialsSection testimonials={testimonials} C={C} isMobile={isMobile} />
              )}

              {/* 4. REAL WEDDINGS */}
              {realWeddings.length > 0 && (
                <RealWeddingsSection
                  vendor={vendor} C={C} isMobile={isMobile}
                  realWeddings={realWeddings} setRwModal={setRwModal}
                />
              )}

              {/* 5. HOW THEY WORK */}
              <HowTheyWorkSection approachSteps={approachSteps} C={C} />

              {/* 6. SERVICES & FEES */}
              {packages.length > 0 && (
                <ServicesSection packages={packages} C={C} isMobile={isMobile} />
              )}

              {/* 7. COVERAGE */}
              <CoverageSection vendor={vendor} C={C} isMobile={isMobile} coverageMarkers={coverageMarkers} />

              {/* 8. MOBILE-ONLY ENQUIRY */}
              <div className="vpt-mobile-enquiry" style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
                <SectionLabel C={C} label="Enquiry" />
                <h3 style={{ fontFamily: GD, fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: "0 0 18px" }}>
                  Send an enquiry
                </h3>
                <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 22 }}>
                  <VendorContactForm vendor={enrichedVendor} C={C} />
                </div>
              </div>

              {/* 9. SIMILAR VENDORS */}
              {simVendors.length > 0 && (
                <SimilarSection
                  simVendors={simVendors} C={C} isMobile={isMobile}
                  onViewVendor={onViewVendor} vendorType={vendorType}
                />
              )}
            </div>

            {/* ── RIGHT RAIL (STICKY SIDEBAR) ───────────────────────────── */}
            <div className="vpt-sidebar" style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 56, alignSelf: "start" }}>
              <VendorSidebar vendor={enrichedVendor} vendorType={vendorType} C={C} />
            </div>
          </div>
        </div>

        {/* Gallery lightbox */}
        <LightboxModal isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={960} bare>
          {galleryItems[lightboxIdx] && (() => {
            const item = galleryItems[lightboxIdx];
            const isVideo = typeof item === "object" && item.videoUrl;
            return (
              <div style={{ position: "relative" }}>
                {isVideo ? (
                  <video src={item.videoUrl} controls preload="metadata" style={{ width: "100%", maxHeight: "85vh", background: "#000", display: "block" }} />
                ) : (
                  <img src={item} alt={`${vendor.name} gallery ${lightboxIdx + 1}`} style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", display: "block" }} />
                )}
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 12px", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  {lightboxIdx > 0 && (
                    <button onClick={() => setLightboxIdx((p) => p - 1)} style={{ ...navBtnStyle, pointerEvents: "auto" }} aria-label="Previous">‹</button>
                  )}
                  <div />
                  {lightboxIdx < galleryItems.length - 1 && (
                    <button onClick={() => setLightboxIdx((p) => p + 1)} style={{ ...navBtnStyle, pointerEvents: "auto" }} aria-label="Next">›</button>
                  )}
                </div>
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: 20 }}>
                  {lightboxIdx + 1} / {galleryItems.length}
                </div>
              </div>
            );
          })()}
        </LightboxModal>

        {/* Real weddings modal */}
        <LightboxModal isOpen={!!rwModal} onClose={() => setRwModal(null)} maxWidth={720}>
          {rwModal && (
            <div>
              <img src={rwModal.img || rwModal.imageUrl} alt={rwModal.title} style={{ width: "100%", height: 400, objectFit: "cover" }} />
              <div style={{ padding: 28 }}>
                <div style={{ fontFamily: GD, fontSize: 26, fontStyle: "italic", color: C.off }}>{rwModal.title}</div>
                {(rwModal.venue || rwModal.location) && <div style={{ fontFamily: NU, fontSize: 13, color: GOLD, marginTop: 6 }}>{rwModal.venue || rwModal.location}</div>}
                {rwModal.date && <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, opacity: 0.7, marginTop: 4 }}>{rwModal.date}</div>}
                {rwModal.description && (
                  <p style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.85, marginTop: 16, fontWeight: 300 }}>
                    {rwModal.description}
                  </p>
                )}
              </div>
            </div>
          )}
        </LightboxModal>

        <SiteFooter {...footerNav} />

        {/* Mobile bottom bar */}
        <VendorMobileBar vendor={enrichedVendor} C={C} />
      </div>
    </ThemeCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECTION COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const navBtnStyle = {
  width: 40, height: 40, borderRadius: "50%",
  background: "rgba(0,0,0,0.55)", border: "1px solid rgba(255,255,255,0.15)",
  color: "#fff", fontSize: 22, cursor: "pointer", display: "flex",
  alignItems: "center", justifyContent: "center",
};

function SectionLabel({ C, label }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
      <div style={{ width: 28, height: 1, background: C.gold }} />
      <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>{label}</span>
    </div>
  );
}

function Facts({ rows, C }) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      {rows.map(([k, v]) => (
        <div key={k} style={{ display: "flex", alignItems: "baseline", gap: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
          <div style={{ width: 140, fontFamily: NU, fontSize: 10, letterSpacing: "0.25em", textTransform: "uppercase", color: C.grey, opacity: 0.7 }}>{k}</div>
          <div style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 500, lineHeight: 1.6 }}>{v || "On request"}</div>
        </div>
      ))}
    </div>
  );
}

function PrimaryBtn({ label, onClick, C }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "linear-gradient(135deg,#C9A84C,#9b7a1a)" : `linear-gradient(135deg,${C.gold},${C.gold2 || "#e8c97a"})`,
        border: "none",
        borderRadius: "var(--lwd-radius-input)",
        color: "#0f0d0a",
        padding: "12px 18px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: NU,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function GhostBtn({ label, onClick, C }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(201,168,76,0.10)" : "transparent",
        border: `1px solid ${hov ? "rgba(201,168,76,0.45)" : C.border2}`,
        borderRadius: "var(--lwd-radius-input)",
        color: hov ? C.gold : C.grey,
        padding: "12px 18px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: NU,
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

// ── Editorial + At a Glance ──────────────────────────────────────────────────
function EditorialSection({ vendor, C, isMobile }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
      <div className="lwd-stack900" style={{ display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,0.8fr)", gap: 32 }}>
        <div>
          <SectionLabel C={C} label="Editorial" />
          <h2 style={{ fontFamily: GD, fontSize: "clamp(24px,3vw,36px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: 0 }}>
            The feeling they create
          </h2>
          <p style={{ marginTop: 18, fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
            {vendor.editorial || vendor.desc ||
              "A vendor who moves with calm authority, protects the couple's energy, and choreographs every detail with taste. Expect strong creative direction, discreet logistics, and a celebration that reads beautifully in photography while feeling effortless on the day."}
          </p>
        </div>

        <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 22 }}>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: C.gold, fontWeight: 800, marginBottom: 16 }}>
            At a glance
          </div>
          <Facts C={C} rows={[
            ["Service tier", vendor.serviceTier || "Curated"],
            ["Based in", vendor.city || vendor.region || "Italy"],
            ["Regions served", vendor.coverage?.join(", ") || vendor.region || "Italy"],
            ["Starting fee", vendor.priceFrom || "On request"],
            ["Languages", Array.isArray(vendor.languages) ? vendor.languages.join(", ") : (vendor.languages || "English, Italian")],
            ["Style", vendor.planningStyle || vendor.styles?.join(", ") || "Modern, classic"],
          ]} />
        </div>
      </div>
    </section>
  );
}

// ── Gallery ──────────────────────────────────────────────────────────────────
function GallerySection({ vendor, C, isMobile, galleryItems, openGallery }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 16 }}>
        <div style={{ fontFamily: GD, fontSize: 26, fontWeight: 400, fontStyle: "italic", color: C.off }}>Gallery</div>
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, opacity: 0.7 }}>Tap to view</div>
      </div>
      <SliderNav cardWidth={isMobile ? 280 : 480} gap={14}>
        {galleryItems.map((src, i) => {
          const isVideo = typeof src === "object" && src.videoUrl;
          const imgSrc = isVideo ? (src.thumb || src.videoUrl) : src;
          return (
            <div
              key={i}
              onClick={() => openGallery(i)}
              style={{
                flex: `0 0 ${isMobile ? 280 : 480}px`,
                borderRadius: "var(--lwd-radius-card)",
                overflow: "hidden",
                border: `1px solid ${C.border2}`,
                background: C.card,
                cursor: "pointer",
                position: "relative",
              }}
            >
              <img
                src={imgSrc}
                alt={`${vendor.name} gallery ${i + 1}`}
                loading="lazy"
                style={{ width: "100%", height: isMobile ? 220 : 340, objectFit: "cover" }}
              />
              {isVideo && (
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.25)" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(0,0,0,0.6)", border: "2px solid rgba(255,255,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </SliderNav>
    </section>
  );
}

// ── Testimonials ─────────────────────────────────────────────────────────────
function TestimonialsSection({ testimonials, C, isMobile }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
      <SectionLabel C={C} label="Testimonials" />
      <h3 style={{ fontFamily: GD, fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: "0 0 18px" }}>
        What couples say
      </h3>
      <SliderNav cardWidth={isMobile ? 300 : 400} gap={14}>
        {testimonials.map((t, i) => (
          <div
            key={i}
            style={{
              flex: `0 0 ${isMobile ? 300 : 400}px`,
              background: C.card,
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-card)",
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 14,
            }}
          >
            <div style={{ fontFamily: GD, fontSize: 28, color: GOLD, lineHeight: 1, opacity: 0.4 }}>"</div>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.off, lineHeight: 1.8, fontWeight: 300, flex: 1 }}>
              {t.quote}
            </p>
            <div>
              <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: C.off }}>
                {t.couple}
              </div>
              {(t.location || t.date) && (
                <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, opacity: 0.7, marginTop: 2 }}>
                  {[t.location, t.date].filter(Boolean).join(" · ")}
                </div>
              )}
            </div>
          </div>
        ))}
      </SliderNav>
    </section>
  );
}

// ── Real Weddings ────────────────────────────────────────────────────────────
function RealWeddingsSection({ vendor, C, isMobile, realWeddings, setRwModal }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
      <SectionLabel C={C} label="Real Weddings" />
      <h3 style={{ fontFamily: GD, fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: "0 0 18px" }}>
        Celebrations they have created
      </h3>
      <SliderNav cardWidth={isMobile ? 280 : 400} gap={14}>
        {realWeddings.map((rw, i) => (
          <div
            key={i}
            onClick={() => setRwModal(rw)}
            style={{
              flex: `0 0 ${isMobile ? 280 : 400}px`,
              borderRadius: "var(--lwd-radius-card)",
              overflow: "hidden",
              border: `1px solid ${C.border2}`,
              background: C.card,
              cursor: "pointer",
            }}
          >
            <img src={rw.img || rw.imageUrl} alt={rw.title} loading="lazy" style={{ width: "100%", height: isMobile ? 200 : 280, objectFit: "cover" }} />
            <div style={{ padding: 16 }}>
              <div style={{ fontFamily: GD, fontSize: 18, fontStyle: "italic", color: C.off }}>{rw.title}</div>
              {(rw.venue || rw.location) && <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, marginTop: 4 }}>{rw.venue || rw.location}</div>}
              {rw.date && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, opacity: 0.6, marginTop: 2 }}>{rw.date}</div>}
            </div>
          </div>
        ))}
      </SliderNav>
    </section>
  );
}

// ── How They Work ────────────────────────────────────────────────────────────
function HowTheyWorkSection({ approachSteps, C }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: "56px 0" }}>
      <h3 style={{ fontFamily: GD, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.off, margin: 0 }}>
        How they work
      </h3>
      <div className="lwd-grid3" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
        {approachSteps.map((x, i) => (
          <div key={x.title || i} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 20 }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 800 }}>
              {x.title}
            </div>
            <div style={{ marginTop: 10, fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.75, fontWeight: 300 }}>
              {x.description}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

// ── Services & Fees ──────────────────────────────────────────────────────────
function ServicesSection({ packages, C, isMobile }) {
  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
      <SectionLabel C={C} label="Packages" />
      <h3 style={{ fontFamily: GD, fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: "0 0 24px" }}>
        Service tiers
      </h3>
      {isMobile ? (
        <SliderNav cardWidth={280} gap={14}>
          {packages.map((pkg, i) => (
            <div key={i} style={{ flex: "0 0 280px" }}>
              <PackageCard pkg={pkg} C={C} />
            </div>
          ))}
        </SliderNav>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(packages.length, 3)}, minmax(0, 1fr))`, gap: 18 }}>
          {packages.map((pkg, i) => (
            <PackageCard key={i} pkg={pkg} C={C} />
          ))}
        </div>
      )}
    </section>
  );
}

function PackageCard({ pkg, C }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${pkg.highlighted ? GOLD : C.border2}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: 24,
        display: "flex",
        flexDirection: "column",
        position: "relative",
      }}
    >
      {pkg.highlighted && (
        <div style={{ position: "absolute", top: -1, left: 24, right: 24, height: 2, background: GOLD }} />
      )}
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: pkg.highlighted ? GOLD : C.grey, fontWeight: 800 }}>
        {pkg.name}
      </div>
      {pkg.price && (
        <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: C.off, marginTop: 10 }}>
          {typeof pkg.price === "number" ? money(pkg.price) : pkg.price}
        </div>
      )}
      {pkg.features?.length > 0 && (
        <ul style={{ marginTop: 16, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
          {pkg.features.map((f, i) => (
            <li key={i} style={{ fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.6, fontWeight: 300, paddingLeft: 16, position: "relative" }}>
              <span style={{ position: "absolute", left: 0, color: GOLD, fontSize: 10 }}>✦</span>
              {f}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Coverage ─────────────────────────────────────────────────────────────────
function CoverageSection({ vendor, C, isMobile, coverageMarkers }) {
  const mapRef = useRef(null);
  const [mapVisible, setMapVisible] = useState(false);

  // Lazy mount Leaflet using IntersectionObserver
  useEffect(() => {
    if (!mapRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setMapVisible(true); observer.disconnect(); } },
      { rootMargin: "200px" }
    );
    observer.observe(mapRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section style={{ borderBottom: `1px solid ${C.border}`, padding: isMobile ? "40px 0" : "56px 0" }}>
      <div className="lwd-stack900" style={{ display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 18 }}>
        <div>
          <h3 style={{ fontFamily: GD, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.off, margin: 0 }}>Coverage</h3>
          <p style={{ marginTop: 14, fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
            {vendor.coverageNote || "Based locally, available across key destinations. Use the enquiry form to share your date, guest count, and the atmosphere you want, and we will guide the next step."}
          </p>
          <div style={{ marginTop: 18 }}>
            <Facts C={C} rows={[
              ["Primary base", vendor.city || vendor.region || "Italy"],
              ["Regions served", vendor.coverage?.join(", ") || vendor.region || "Italy"],
              ["Travel", vendor.travelPolicy || "Available for destination weddings"],
              ["Best suited for", vendor.bestFor || "Luxury destination couples"],
            ]} />
          </div>
        </div>
        <div ref={mapRef} style={{ minHeight: isMobile ? 320 : 520 }}>
          {mapVisible && coverageMarkers.length > 0 && (
            <PlannerMapPanel planners={coverageMarkers} C={C} bleed={false} />
          )}
        </div>
      </div>
    </section>
  );
}

// ── Similar Vendors ──────────────────────────────────────────────────────────
function SimilarSection({ simVendors, C, isMobile, onViewVendor, vendorType }) {
  return (
    <section style={{ padding: isMobile ? "40px 0" : "56px 0" }}>
      <SectionLabel C={C} label="You may also like" />
      <h3 style={{ fontFamily: GD, fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: "0 0 18px" }}>
        Similar {vendorType === "planner" ? "planners" : "vendors"}
      </h3>
      <SliderNav cardWidth={isMobile ? 260 : 320} gap={14}>
        {simVendors.map((sp) => (
          <div
            key={sp.id}
            onClick={() => onViewVendor?.(sp)}
            style={{
              flex: `0 0 ${isMobile ? 260 : 320}px`,
              borderRadius: "var(--lwd-radius-card)",
              overflow: "hidden",
              border: `1px solid ${C.border2}`,
              background: C.card,
              cursor: "pointer",
            }}
          >
            <img src={sp.imgs?.[0] || FALLBACK_HERO} alt={sp.name} loading="lazy" style={{ width: "100%", height: isMobile ? 180 : 220, objectFit: "cover" }} />
            <div style={{ padding: 14 }}>
              <div style={{ fontFamily: GD, fontSize: 17, fontStyle: "italic", color: C.off }}>{sp.name}</div>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, marginTop: 4 }}>
                {sp.city ? `${sp.city}, ` : ""}{sp.region || ""}
              </div>
              <div style={{ fontFamily: NU, fontSize: 11, color: GOLD, marginTop: 6 }}>
                {stars(sp.rating)} <span style={{ color: C.grey, fontSize: 10 }}>({sp.reviews || 0})</span>
              </div>
            </div>
          </div>
        ))}
      </SliderNav>
    </section>
  );
}
