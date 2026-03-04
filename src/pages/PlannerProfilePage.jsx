import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import CatNav from "../components/nav/CatNav";
import SiteFooter from "../components/sections/SiteFooter";
import SliderNav from "../components/ui/SliderNav";
import PlannerMapPanel from "../components/maps/PlannerMapPanel";
import LightboxModal from "../components/ui/LightboxModal";

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

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export default function PlannerProfilePage({
  plannerId = null,
  plannerSlug = null,
  getPlannerByIdOrSlug = null,
  onBack = () => {},
  onOpenChat = () => {},
  onSave = () => {},
  isSaved = false,
  similarPlanners = [],
  onViewPlanner,
  footerNav = {},
  countrySlug = null,
  regionSlug = null,
  onViewRegion = null,
  onViewRegionCategory = null,
}) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const heroRef = useRef(null);
  const isMobile = useIsMobile();

  const C = darkMode ? getDarkPalette() : getLightPalette();

  const planner = useMemo(() => {
    if (!getPlannerByIdOrSlug) return null;
    return getPlannerByIdOrSlug(plannerId || plannerSlug);
  }, [getPlannerByIdOrSlug, plannerId, plannerSlug]);

  const { setChatContext } = useChat();
  useEffect(() => {
    if (!planner) return;
    setChatContext({
      page: "planner-profile",
      country: planner.country || planner.countrySlug || null,
      region: planner.region || planner.regionSlug || null,
      category: "wedding-planners",
      entityId: planner.id,
      entityName: planner.name,
    });
  }, [setChatContext, planner]);

  /* ── Scroll tracking ──────────────────────────────────────────────────── */
  useEffect(() => {
    const fn = () => {
      setScrolled(window.scrollY > 80);
      if (heroRef.current) {
        setPastHero(window.scrollY > heroRef.current.offsetHeight - 60);
      }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  /* ── Lightbox state ───────────────────────────────────────────────────── */
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIdx, setLightboxIdx] = useState(0);
  const [rwModal, setRwModal] = useState(null);       // real wedding modal

  const openGallery = useCallback((i) => { setLightboxIdx(i); setLightboxOpen(true); }, []);

  /* ── Memoised arrays ──────────────────────────────────────────────────── */
  const galleryItems  = useMemo(() => planner?.imgs?.slice(0, 16) || [], [planner]);
  const testimonials  = useMemo(() => planner?.testimonials || [], [planner]);
  const realWeddings  = useMemo(() => planner?.realWeddings || [], [planner]);
  const approachSteps = useMemo(() => planner?.approachSteps?.length ? planner.approachSteps : DEFAULT_STEPS, [planner]);
  const packages      = useMemo(() => planner?.packages || [], [planner]);
  const simPlanners   = useMemo(() => similarPlanners.slice(0, 6), [similarPlanners]);

  /* ── Coverage markers ─────────────────────────────────────────────────── */
  const coverageMarkers = useMemo(() => {
    if (!planner) return [];
    if (planner.coverageCoords?.length) {
      return planner.coverageCoords.map((c, i) => ({
        id: `cov-${i}`,
        name: c.label || planner.name,
        city: c.label || "",
        region: planner.region || "",
        rating: planner.rating || 0,
        reviews: planner.reviews || 0,
        priceFrom: planner.feeFrom ? money(planner.feeFrom) : null,
        verified: !!planner.verified,
        lat: c.lat,
        lng: c.lng,
      }));
    }
    if (!planner.lat || !planner.lng) {
      console.warn(`[LWD] Planner "${planner.name}" has no lat/lng`);
      return [];
    }
    return [{
      id: planner.id,
      name: planner.name,
      city: planner.city || "",
      region: planner.region || "",
      rating: planner.rating || 0,
      reviews: planner.reviews || 0,
      priceFrom: planner.feeFrom ? money(planner.feeFrom) : null,
      verified: !!planner.verified,
      lat: planner.lat,
      lng: planner.lng,
    }];
  }, [planner]);

  /* ── Not found ────────────────────────────────────────────────────────── */
  if (!planner) {
    return (
      <ThemeCtx.Provider value={C}>
        <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>
          <CatNav onBack={onBack} scrolled={scrolled} darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} />
          <div style={{ maxWidth: 980, margin: "0 auto", padding: "120px 24px" }}>
            <div style={{ fontFamily: NU, fontSize: 11, letterSpacing: "0.3em", textTransform: "uppercase", color: C.grey, opacity: 0.6 }}>
              Planner not found
            </div>
          </div>
          <SiteFooter {...footerNav} />
        </div>
      </ThemeCtx.Provider>
    );
  }

  const heroImg = planner.heroImg || planner.imgs?.[0] || FALLBACK_HERO;
  const SP = isMobile ? "40px 16px" : "72px 48px";        // section padding
  const SP_SM = isMobile ? "40px 16px" : "56px 48px";

  // ── Breadcrumb crumbs for CatNav ──────────────────────────────────────────
  const slugToLabel = (s) => s ? s.split("-").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : "";
  const navCrumbs = [
    ...(countrySlug ? [{ label: slugToLabel(countrySlug), onClick: onViewRegion ? () => onViewRegion(countrySlug, null) : null }] : []),
    ...(regionSlug  ? [{ label: slugToLabel(regionSlug),  onClick: onViewRegion ? () => onViewRegion(countrySlug, regionSlug) : null }] : []),
    { label: "Wedding Planners", onClick: onBack },
    { label: planner.name },
  ];

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>
        <CatNav onBack={onBack} scrolled={scrolled} darkMode={darkMode} onToggleDark={() => setDarkMode((d) => !d)} crumbs={navCrumbs} />

        {/* ════════════════════════════════════════════════════════════════════
            1. HERO
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
            alt={planner.name}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
              transform: "scale(1.03)",
            }}
          />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg,rgba(4,3,2,0.35) 0%,rgba(4,3,2,0.2) 40%,rgba(4,3,2,0.88) 100%)" }} />
          <div aria-hidden="true" style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg,rgba(4,3,2,0.7) 0%,transparent 60%)" }} />
          <div aria-hidden="true" style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${GOLD},#e8c97a,${GOLD})`, backgroundSize: "200% 100%", animation: "shimmer 3s linear infinite", zIndex: 2 }} />

          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "flex-end", padding: isMobile ? "0 20px 40px" : "0 64px 72px" }}>
            <div style={{ maxWidth: 860 }}>
              {/* Badges row */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(201,168,76,0.9)", fontWeight: 700 }}>
                  Wedding Planner
                </span>
                {planner.verified && (
                  <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: "#0f0d0a", background: GOLD, padding: "5px 12px", borderRadius: "var(--lwd-radius-input)", fontWeight: 800 }}>
                    Verified
                  </span>
                )}
                {planner.online && (
                  <span style={{ fontFamily: NU, fontSize: 10, color: "rgba(140,255,180,0.85)", background: "rgba(10,12,10,0.55)", border: "1px solid rgba(140,255,180,0.25)", padding: "5px 12px", borderRadius: "var(--lwd-radius-input)", display: "inline-flex", alignItems: "center", gap: 8 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 99, background: "rgba(140,255,180,0.9)" }} />
                    Online
                  </span>
                )}
              </div>

              <h1 style={{ fontFamily: GD, fontSize: "clamp(40px,5.5vw,76px)", fontWeight: 400, lineHeight: 1.02, margin: 0, letterSpacing: "-0.5px" }}>
                {planner.name}
              </h1>

              {/* Location + rating + response */}
              <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
                <div style={{ fontFamily: NU, fontSize: 14, color: "rgba(255,255,255,0.65)" }}>
                  {planner.city ? `${planner.city}, ` : ""}{planner.region || planner.regionName || ""}{planner.country ? `, ${planner.country}` : ""}
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: GOLD, letterSpacing: "0.1em" }}>
                  {stars(planner.rating)} <span style={{ color: "rgba(255,255,255,0.45)", fontSize: 11 }}>({planner.reviews || 0})</span>
                </div>
                {planner.responseTime && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.5)" }}>
                    Typical reply, {planner.responseTime}
                  </div>
                )}
              </div>

              {/* Hero CTAs */}
              <div style={{ marginTop: 26, display: "flex", gap: 12, flexWrap: "wrap" }}>
                <PrimaryBtn label="Enquire" onClick={() => document.getElementById("planner-enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" })} C={C} />
                <GhostBtn label="Chat" onClick={() => onOpenChat(planner)} C={C} />
                <GhostBtn label={isSaved ? "Saved" : "Save"} onClick={() => onSave(planner)} C={C} />
              </div>
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            3. SOCIAL LINKS ROW
        ═══════════════════════════════════════════════════════════════════ */}
        {(planner.instagramUrl || planner.pinterestUrl || planner.websiteUrl) && (
          <div style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: "14px 48px" }}>
            <div style={{ maxWidth: 980, margin: "0 auto", display: "flex", alignItems: "center", gap: 18 }}>
              <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.grey, opacity: 0.5 }}>
                Follow
              </span>
              {planner.instagramUrl && (
                <a href={planner.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="Instagram" style={{ color: C.grey, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)} onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="5"/><circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none"/></svg>
                </a>
              )}
              {planner.pinterestUrl && (
                <a href={planner.pinterestUrl} target="_blank" rel="noopener noreferrer" aria-label="Pinterest" style={{ color: C.grey, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)} onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.08 3.15 9.42 7.6 11.18-.1-.95-.2-2.41.04-3.45l1.4-5.96s-.36-.72-.36-1.78c0-1.67.97-2.92 2.17-2.92 1.03 0 1.52.77 1.52 1.69 0 1.03-.66 2.57-.99 4-.28 1.19.6 2.16 1.77 2.16 2.13 0 3.76-2.24 3.76-5.49 0-2.87-2.06-4.87-5-4.87-3.41 0-5.41 2.55-5.41 5.19 0 1.03.4 2.13.89 2.73.1.12.11.22.08.34l-.33 1.36c-.05.22-.18.27-.41.16-1.55-.72-2.52-2.99-2.52-4.81 0-3.92 2.85-7.52 8.21-7.52 4.31 0 7.66 3.07 7.66 7.18 0 4.28-2.7 7.73-6.45 7.73-1.26 0-2.44-.66-2.85-1.43l-.77 2.95c-.28 1.08-1.04 2.43-1.55 3.26C9.58 23.81 10.76 24 12 24c6.63 0 12-5.37 12-12S18.63 0 12 0z"/></svg>
                </a>
              )}
              {planner.websiteUrl && (
                <a href={planner.websiteUrl} target="_blank" rel="noopener noreferrer" aria-label="Website" style={{ color: C.grey, transition: "color 0.2s" }} onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)} onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </a>
              )}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            EDITORIAL INTRO
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="lwd-stack900-pad" style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: SP }}>
          <div className="lwd-stack900" style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1.2fr) minmax(0,0.8fr)", gap: 32 }}>
            <div>
              <SectionLabel C={C} label="Editorial" />
              <h2 style={{ fontFamily: GD, fontSize: "clamp(24px,3vw,36px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: 0 }}>
                The feeling they create
              </h2>
              <p style={{ marginTop: 18, fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
                {planner.editorial ||
                  "A planner who moves with calm authority, protects the couple's energy, and choreographs every detail with taste. Expect strong creative direction, discreet logistics, and a celebration that reads beautifully in photography while feeling effortless on the day."}
              </p>
            </div>

            <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 22 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: C.gold, fontWeight: 800, marginBottom: 16 }}>
                At a glance
              </div>
              <Facts C={C} rows={[
                ["Service tier", planner.tier || "Curated"],
                ["Based in", planner.city || planner.region || "Italy"],
                ["Regions served", planner.coverage?.join(", ") || planner.region || "Italy"],
                ["Starting fee", planner.feeFrom ? money(planner.feeFrom) : "On request"],
                ["Languages", planner.languages?.join(", ") || "English, Italian"],
                ["Planning style", planner.styles?.join(", ") || "Modern, classic"],
              ]} />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            5. TESTIMONIALS
        ═══════════════════════════════════════════════════════════════════ */}
        {testimonials.length > 0 && (
          <section className="lwd-stack900-pad" style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: SP_SM }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            4. GALLERY (upgraded)
        ═══════════════════════════════════════════════════════════════════ */}
        {galleryItems.length > 0 && (
          <section className="lwd-stack900-pad" style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: SP_SM }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
                        alt={`${planner.name} gallery ${i + 1}`}
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
            </div>
          </section>
        )}

        {/* Gallery lightbox */}
        <LightboxModal isOpen={lightboxOpen} onClose={() => setLightboxOpen(false)} maxWidth={960} bare>
          {galleryItems[lightboxIdx] && (() => {
            const item = galleryItems[lightboxIdx];
            const isVideo = typeof item === "object" && item.videoUrl;
            return (
              <div style={{ position: "relative" }}>
                {isVideo ? (
                  <video
                    src={item.videoUrl}
                    controls
                    preload="metadata"
                    style={{ width: "100%", maxHeight: "85vh", background: "#000", display: "block" }}
                  />
                ) : (
                  <img
                    src={item}
                    alt={`${planner.name} gallery ${lightboxIdx + 1}`}
                    style={{ width: "100%", maxHeight: "85vh", objectFit: "contain", display: "block" }}
                  />
                )}
                {/* Prev / Next */}
                <div style={{ position: "absolute", top: "50%", left: 0, right: 0, display: "flex", justifyContent: "space-between", padding: "0 12px", transform: "translateY(-50%)", pointerEvents: "none" }}>
                  {lightboxIdx > 0 && (
                    <button onClick={() => setLightboxIdx((p) => p - 1)} style={{ ...navBtnStyle, pointerEvents: "auto" }} aria-label="Previous">‹</button>
                  )}
                  <div />
                  {lightboxIdx < galleryItems.length - 1 && (
                    <button onClick={() => setLightboxIdx((p) => p + 1)} style={{ ...navBtnStyle, pointerEvents: "auto" }} aria-label="Next">›</button>
                  )}
                </div>
                {/* Counter */}
                <div style={{ position: "absolute", bottom: 12, left: "50%", transform: "translateX(-50%)", fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.55)", background: "rgba(0,0,0,0.5)", padding: "4px 12px", borderRadius: 20 }}>
                  {lightboxIdx + 1} / {galleryItems.length}
                </div>
              </div>
            );
          })()}
        </LightboxModal>

        {/* ════════════════════════════════════════════════════════════════════
            6. REAL WEDDINGS
        ═══════════════════════════════════════════════════════════════════ */}
        {realWeddings.length > 0 && (
          <section className="lwd-stack900-pad" style={{ background: C.black, borderBottom: `1px solid ${C.border}`, padding: SP_SM }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
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
                    <img src={rw.img} alt={rw.title} loading="lazy" style={{ width: "100%", height: isMobile ? 200 : 280, objectFit: "cover" }} />
                    <div style={{ padding: 16 }}>
                      <div style={{ fontFamily: GD, fontSize: 18, fontStyle: "italic", color: C.off }}>{rw.title}</div>
                      {rw.venue && <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, marginTop: 4 }}>{rw.venue}</div>}
                      {rw.date && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, opacity: 0.6, marginTop: 2 }}>{rw.date}</div>}
                    </div>
                  </div>
                ))}
              </SliderNav>
            </div>
          </section>
        )}

        {/* Real weddings modal */}
        <LightboxModal isOpen={!!rwModal} onClose={() => setRwModal(null)} maxWidth={720}>
          {rwModal && (
            <div>
              <img src={rwModal.img} alt={rwModal.title} style={{ width: "100%", height: 400, objectFit: "cover" }} />
              <div style={{ padding: 28 }}>
                <div style={{ fontFamily: GD, fontSize: 26, fontStyle: "italic", color: C.off }}>{rwModal.title}</div>
                {rwModal.venue && <div style={{ fontFamily: NU, fontSize: 13, color: GOLD, marginTop: 6 }}>{rwModal.venue}</div>}
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

        {/* ════════════════════════════════════════════════════════════════════
            7. HOW THEY WORK (data-driven)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="lwd-stack900-pad" style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: SP }}>
          <div style={{ maxWidth: 980, margin: "0 auto" }}>
            <h3 style={{ fontFamily: GD, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.off, margin: 0 }}>
              How they work
            </h3>
            <div className="lwd-grid3" style={{ marginTop: 18, display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 14 }}>
              {approachSteps.map((x, i) => (
                <div key={x.title || i} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 20 }}>
                  <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 800 }}>
                    {x.title || x.t}
                  </div>
                  <div style={{ marginTop: 10, fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.75, fontWeight: 300 }}>
                    {x.description || x.d}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            8. PRICING TIERS
        ═══════════════════════════════════════════════════════════════════ */}
        {packages.length > 0 && (
          <section className="lwd-stack900-pad" style={{ background: C.black, borderBottom: `1px solid ${C.border}`, padding: SP }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            MAP + COVERAGE (10. multi-markers)
        ═══════════════════════════════════════════════════════════════════ */}
        <section className="lwd-stack900-pad" style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: SP }}>
          <div className="lwd-stack900" style={{ maxWidth: 1200, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 18 }}>
            <div>
              <h3 style={{ fontFamily: GD, fontSize: 30, fontWeight: 400, fontStyle: "italic", color: C.off, margin: 0 }}>Coverage</h3>
              <p style={{ marginTop: 14, fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
                {planner.coverageNote || "Based locally, available across key destinations. Use the enquiry form to share your date, guest count, and the atmosphere you want, and we will guide the next step."}
              </p>
              <div style={{ marginTop: 18 }}>
                <Facts C={C} rows={[
                  ["Primary base", planner.city || planner.region || "Italy"],
                  ["Regions served", planner.coverage?.join(", ") || planner.region || "Italy"],
                  ["Travel", planner.travelPolicy || "Available for destination weddings"],
                  ["Best suited for", planner.bestFor || "Luxury destination couples"],
                ]} />
              </div>
            </div>
            <div style={{ minHeight: isMobile ? 320 : 520 }}>
              <PlannerMapPanel planners={coverageMarkers} C={C} bleed={false} />
            </div>
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            ENQUIRY
        ═══════════════════════════════════════════════════════════════════ */}
        <section id="planner-enquiry" className="lwd-stack900-pad" style={{ background: C.black, borderBottom: `1px solid ${C.border}`, padding: isMobile ? "56px 16px" : "84px 48px" }}>
          <div className="lwd-stack900" style={{ maxWidth: 980, margin: "0 auto", display: "grid", gridTemplateColumns: "minmax(0,1fr) minmax(0,1fr)", gap: 22 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: C.gold, fontWeight: 800 }}>Enquiry</div>
              <h3 style={{ marginTop: 16, fontFamily: GD, fontSize: 34, fontWeight: 400, fontStyle: "italic", color: C.off }}>
                Tell them what you are planning
              </h3>
              <p style={{ marginTop: 14, fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
                Keep it simple, date, destination, guest count, budget range, and the atmosphere you want. If you want a faster response, add your venue shortlist.
              </p>
            </div>
            <EnquiryForm C={C} planner={planner} />
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            9. SIMILAR PLANNERS
        ═══════════════════════════════════════════════════════════════════ */}
        {simPlanners.length > 0 && (
          <section className="lwd-stack900-pad" style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: SP_SM }}>
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <SectionLabel C={C} label="You may also like" />
              <h3 style={{ fontFamily: GD, fontSize: "clamp(22px,3vw,30px)", fontWeight: 400, fontStyle: "italic", color: C.off, margin: "0 0 18px" }}>
                Similar planners
              </h3>
              <SliderNav cardWidth={isMobile ? 260 : 320} gap={14}>
                {simPlanners.map((sp) => (
                  <div
                    key={sp.id}
                    onClick={() => onViewPlanner?.(sp)}
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
            </div>
          </section>
        )}

        <SiteFooter {...footerNav} />

        {/* ════════════════════════════════════════════════════════════════════
            2. STICKY CTA BAR
        ═══════════════════════════════════════════════════════════════════ */}
        <div
          className="lwd-sticky-cta"
          aria-hidden={!pastHero}
          style={{
            position: "fixed",
            bottom: 24,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            alignItems: "center",
            gap: 10,
            background: "rgba(8,6,4,0.88)",
            backdropFilter: "blur(14px)",
            WebkitBackdropFilter: "blur(14px)",
            border: `1px solid ${pastHero ? "rgba(201,168,76,0.2)" : "transparent"}`,
            borderRadius: 14,
            padding: "10px 18px",
            paddingBottom: "max(10px, env(safe-area-inset-bottom))",
            zIndex: 900,
            opacity: pastHero ? 1 : 0,
            pointerEvents: pastHero ? "auto" : "none",
            transition: "opacity 0.35s ease, border-color 0.35s ease",
          }}
        >
          <span style={{ fontFamily: GD, fontSize: 15, fontStyle: "italic", color: C.off, whiteSpace: "nowrap", marginRight: 6 }}>
            {planner.name}
          </span>
          <PrimaryBtn label="Enquire" onClick={() => document.getElementById("planner-enquiry")?.scrollIntoView({ behavior: "smooth", block: "start" })} C={C} />
          <GhostBtn label="Chat" onClick={() => onOpenChat(planner)} C={C} />
          <GhostBtn label={isSaved ? "Saved" : "Save"} onClick={() => onSave(planner)} C={C} />
        </div>
      </div>
    </ThemeCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS
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

function EnquiryForm({ C, planner }) {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));
    setLoading(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 22 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 800 }}>Sent</div>
        <div style={{ marginTop: 12, fontFamily: GD, fontSize: 26, fontWeight: 400, fontStyle: "italic", color: C.off }}>
          Your message is with {planner.name}
        </div>
        <p style={{ marginTop: 12, fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
          If you want, open Aura chat and add any venue shortlist or special logistics, multiple events, guest travel, cultural ceremonies.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} style={{ background: C.card, border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: 22 }}>
      <Field C={C} label="Your name"><input required style={inputStyle(C)} /></Field>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field C={C} label="Email"><input required type="email" style={inputStyle(C)} /></Field>
        <Field C={C} label="Phone"><input style={inputStyle(C)} /></Field>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <Field C={C} label="Wedding date"><input type="date" style={inputStyle(C)} /></Field>
        <Field C={C} label="Guest count"><input type="number" min="2" style={inputStyle(C)} /></Field>
      </div>
      <Field C={C} label="Budget range">
        <select style={inputStyle(C)}>
          <option value="">Select</option>
          <option>£20,000 to £40,000</option>
          <option>£40,000 to £80,000</option>
          <option>£80,000 to £150,000</option>
          <option>£150,000 plus</option>
        </select>
      </Field>
      <Field C={C} label="Message">
        <textarea rows={5} style={{ ...inputStyle(C), resize: "vertical" }} placeholder="Tell us the destination, the feeling, and what you want handled." />
      </Field>
      <button
        type="submit"
        disabled={loading}
        style={{
          width: "100%", marginTop: 10,
          background: loading ? "rgba(201,168,76,0.25)" : `linear-gradient(135deg,${C.gold},${C.gold2 || "#e8c97a"})`,
          border: "none", borderRadius: "var(--lwd-radius-input)",
          color: "#0f0d0a", padding: "13px 14px",
          fontFamily: NU, fontSize: 11, fontWeight: 900,
          letterSpacing: "0.25em", textTransform: "uppercase",
          cursor: loading ? "default" : "pointer", transition: "all 0.2s",
        }}
      >
        {loading ? "Sending" : "Send enquiry"}
      </button>
      <div style={{ marginTop: 10, fontFamily: NU, fontSize: 11, color: C.grey, opacity: 0.7, lineHeight: 1.6 }}>
        By sending, you agree we may share your message with this planner to respond.
      </div>
    </form>
  );
}

function Field({ label, children, C }) {
  return (
    <label style={{ display: "block", marginBottom: 12 }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 800, marginBottom: 8 }}>{label}</div>
      {children}
    </label>
  );
}

function inputStyle(C) {
  return {
    width: "100%", padding: "12px 14px", fontSize: 13,
    fontFamily: NU, background: "rgba(8,6,4,0.35)",
    border: `1px solid ${C.border2}`,
    borderRadius: "var(--lwd-radius-input)",
    color: C.white, outline: "none",
  };
}
