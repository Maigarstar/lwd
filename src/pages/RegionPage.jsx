// ─── src/pages/RegionPage.jsx ──────────────────────────────────────────────────
// County hub template — renders any region entity as a mini website.
// Data-driven: one template, many counties.
import { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import {
  getRegionBySlug,
  getCountryBySlug,
  getCityBySlug,
  getRegionsByCountry,
  VENDOR_CATEGORIES,
} from "../data/geo.js";
import { VENUES, DEFAULT_FILTERS } from "../data/italyVenues";
import { getRegionPageConfig } from "../services/regionPageConfig";

import GCard from "../components/cards/GCard";
import GCardMobile from "../components/cards/GCardMobile";
import QuickViewModal from "../components/modals/QuickViewModal";
import SiteFooter from "../components/sections/SiteFooter";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import FeaturedSlider from "../components/sections/FeaturedSlider";
import RegionHero from "../components/sections/RegionHero";
import RegionFeatured from "../components/sections/RegionFeatured";
import RegionRealWeddings from "../components/sections/RegionRealWeddings";
import MapSection from "../components/sections/MapSection";
import SliderNav from "../components/ui/SliderNav";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import { useInView, CountUp, SplitText, revealStyle } from "../components/ui/Animations";
import "../category.css";

// ── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Mobile detection hook ────────────────────────────────────────────────────
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

// ── Initial visible count for paginated sections (backend can override later) ─
const INITIAL_VISIBLE = 4;

// ── Default hero fallback ────────────────────────────────────────────────────
const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

export default function RegionPage({
  onBack = () => {},
  onViewVenue = () => {},
  onViewCategory = () => {},
  onViewRegion = () => {},
  onViewRegionCategory = () => {},
  countrySlug = null,
  regionSlug = null,
  footerNav = {},
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [qvItem, setQvItem] = useState(null);
  const [visibleCities, setVisibleCities] = useState(4);
  const [visibleRelated, setVisibleRelated] = useState(4);
  const [venueViewMode, setVenueViewMode] = useState("slider"); // slider, grid, list, map
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState(() => ({ region: regionSlug }));
  const [sortMode, setSortMode] = useState("recommended");
  const isMobile = useIsMobile();

  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Filter handler ──────────────────────────────────────────────────────
  const handleFiltersChange = useCallback((f) => setFilters(f), []);

  // ── Entity lookup ────────────────────────────────────────────────────────
  const region = useMemo(() => getRegionBySlug(regionSlug), [regionSlug]);
  const country = useMemo(() => getCountryBySlug(countrySlug), [countrySlug]);

  // ── Premium Page Configuration (Phase 2.1) ──────────────────────────────────────
  // Merge base region data with editable premium page config
  const pageConfig = useMemo(
    () => (region && regionSlug ? getRegionPageConfig(regionSlug) : null),
    [regionSlug, region]
  );

  // Merged region data: base data + premium page config
  const regionWithConfig = useMemo(
    () => (region && pageConfig ? { ...region, pageConfig } : region),
    [region, pageConfig]
  );

  // Cities resolved from slug list
  const cities = useMemo(
    () => (region.cities || []).map(getCityBySlug).filter(Boolean),
    [region]
  );

  // Related regions resolved
  const relatedRegions = useMemo(
    () =>
      (region.relatedRegionSlugs || [])
        .map(getRegionBySlug)
        .filter((r) => r && r.slug !== "all"),
    [region]
  );

  // Matching venues (for Italy regions that have listings)
  const regionVenues = useMemo(
    () => VENUES.filter((v) => v.region === region.name),
    [region.name]
  );
  const featuredVenues = useMemo(
    () => regionVenues.filter((v) => v.featured),
    [regionVenues]
  );

  const toggleSave = useCallback(
    (id) => setSavedIds((s) => s.includes(id) ? s.filter((x) => x !== id) : [...s, id]),
    [],
  );

  // ── Scroll-reveal observers for staggered grid entrances ──────────────────
  const [grid1Ref, grid1In] = useInView({ threshold: 0.1 });
  const [grid2Ref, grid2In] = useInView({ threshold: 0.1 });
  const [citiesRef, citiesIn] = useInView({ threshold: 0.1 });
  const [relatedRef, relatedIn] = useInView({ threshold: 0.1 });

  // ── Chat context ─────────────────────────────────────────────────────────
  const { setChatContext } = useChat();
  useEffect(() => {
    setChatContext?.({
      page: "region",
      country: country?.name || null,
      region: region.name,
    });
  }, [setChatContext, country, region]);

  // ── Scroll listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Fade-in on mount ─────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  // ── Initialize venue view mode from pageConfig ────────────────────────────
  useEffect(() => {
    if (pageConfig?.layout?.defaultViewMode) {
      setVenueViewMode(pageConfig.layout.defaultViewMode || "slider");
    }
  }, [pageConfig?.layout?.defaultViewMode]);

  // ── Inject CSS vars for theme ────────────────────────────────────────────
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--lwd-dark", C.dark);
    root.style.setProperty("--lwd-gold", C.gold);
    root.style.setProperty("--lwd-white", C.white);
  }, [C.dark, C.gold, C.white]);

  const heroImg = region.heroImg || DEFAULT_HERO;
  const countryName = country?.name || "United Kingdom";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>

        {/* ═══ NAVIGATION ═══════════════════════════════════════════════════ */}
        <RegionNav
          onBack={onBack}
          scrolled={scrolled}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          countryName={countryName}
          regionName={region.name}
          C={C}
        />

        {/* ═══ HERO SECTION ═════════════════════════════════════════════════ */}
        {/* Use premium RegionHero if configured, otherwise default hero */}
        {/* Use standard inline hero design for all regions */}
        {(
        <section
          aria-label={`Weddings in ${region.name}`}
          style={{
            position: "relative",
            height: "72vh",
            minHeight: 580,
            overflow: "hidden",
            background: "#0a0806",
          }}
        >
          {/* Background image */}
          <img
            src={heroImg}
            alt={`Luxury wedding setting in ${region.name}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.55,
              transform: "scale(1.04)",
              transition: "transform 8s ease",
            }}
          />

          {/* Gradient overlays */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg,rgba(4,3,2,0.45) 0%,rgba(4,3,2,0.25) 40%,rgba(4,3,2,0.75) 100%)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg,rgba(4,3,2,0.6) 0%,transparent 60%)",
            }}
          />

          {/* Gold shimmer bar */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              height: 2,
              background: "linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
              backgroundSize: "200% 100%",
              animation: "shimmer 3s linear infinite",
              zIndex: 2,
            }}
          />

          {/* Content */}
          <div
            className="lwd-hero-content"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "0 80px 80px",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.9s ease",
            }}
          >
            {/* Region label */}
            <div
              style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}
              aria-hidden="true"
            >
              <div style={{ width: 32, height: 1, background: "rgba(201,168,76,0.6)" }} />
              <span
                style={{
                  fontSize: 10,
                  letterSpacing: "4px",
                  textTransform: "uppercase",
                  color: "rgba(201,168,76,0.9)",
                  fontFamily: NU,
                  fontWeight: 600,
                }}
              >
                {countryName} · {region.name}
              </span>
            </div>

            {/* Title */}
            <h1
              style={{
                fontFamily: GD,
                fontSize: "clamp(44px,6vw,76px)",
                fontWeight: 400,
                color: "#fff",
                lineHeight: 1.05,
                letterSpacing: "-0.5px",
                marginBottom: 18,
                maxWidth: 700,
              }}
            >
              {region.heroTitle ? (
                <SplitText trigger={loaded} delay={200} stagger={90}>
                  {region.heroTitle}
                </SplitText>
              ) : (
                <>
                  <div>
                    <SplitText trigger={loaded} delay={200} stagger={90}>
                      Weddings in
                    </SplitText>
                  </div>
                  <div style={{ fontStyle: "italic", color: "#C9A84C" }}>
                    <SplitText trigger={loaded} delay={400} stagger={90}>
                      {region.name}
                    </SplitText>
                  </div>
                </>
              )}
            </h1>

            {/* Subtitle / editorial excerpt */}
            {region.heroSubtitle && (
              <p
                style={{
                  fontSize: 16,
                  color: "rgba(255,255,255,0.65)",
                  fontFamily: NU,
                  fontWeight: 300,
                  lineHeight: 1.6,
                  maxWidth: 520,
                  marginBottom: 36,
                }}
              >
                {region.heroSubtitle}
              </p>
            )}

            {/* Stats row */}
            <div
              className="lwd-hero-stats"
              style={{ display: "flex", gap: 32, alignItems: "center" }}
              aria-label="Key statistics"
            >
              {[
                { val: regionVenues.length || "—", label: "Curated Venues" },
                { val: cities.length || "—", label: region.localTerm || "Cities" },
                { val: region.listingCount > 0 ? "100%" : "Coming Soon", label: region.listingCount > 0 ? "Personally Verified" : "Listings", soft: region.listingCount === 0 },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
                    paddingLeft: i > 0 ? 32 : 0,
                  }}
                >
                  <div
                    style={{
                      fontFamily: GD,
                      fontSize: s.soft ? 22 : 28,
                      fontWeight: s.soft ? 300 : 600,
                      color: s.soft ? "rgba(255,255,255,0.45)" : "#C9A84C",
                      lineHeight: 1,
                      opacity: s.soft ? 0.6 : 1,
                    }}
                  >
                    {typeof s.val === "number" && loaded ? (
                      <CountUp end={s.val} duration={1400} />
                    ) : s.val}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      letterSpacing: "2px",
                      textTransform: "uppercase",
                      color: "rgba(255,255,255,0.45)",
                      marginTop: 4,
                      fontFamily: NU,
                    }}
                  >
                    {s.label}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Scroll indicator */}
          <div
            aria-hidden="true"
            className="lwd-hero-scroll"
            style={{
              position: "absolute",
              bottom: 24,
              right: 48,
              display: "flex",
              alignItems: "center",
              gap: 8,
              opacity: 0.5,
            }}
          >
            <span
              style={{
                fontSize: 9,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: "#fff",
                fontFamily: NU,
              }}
            >
              Scroll
            </span>
            <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.4)" }} />
          </div>
        </section>
        )}

        {/* ═══ FILTER BAR — Search, filter, view mode, and sort ═══════════════════ */}
        <CountrySearchBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          viewMode={venueViewMode}
          onViewMode={setVenueViewMode}
          sortMode={sortMode}
          onSortChange={setSortMode}
          total={regionVenues.length}
          regions={[{ name: region.name, slug: region.slug }]}
          countryFilter={country?.name}
          mapContent={
            venueViewMode === "map" ? (
              <MapSection
                venues={regionVenues}
                vendors={[]}
                headerLabel={`${regionVenues.length} Wedding Venues in ${region.name}`}
                mapTitle={`◎ ${region.name} Wedding Venues`}
                countryFilter={country?.name || "Italy"}
              />
            ) : null
          }
        />

        {/* ═══ TRUST SIGNAL STRIP — region-specific authority tags ═══════════ */}
        {region.trustSignals && region.trustSignals.length > 0 && (
          <div
            aria-label="Regional credentials"
            className="lwd-region-trust-strip"
            style={{
              background: C.dark,
              borderBottom: `1px solid ${C.border}`,
              padding: "18px 48px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
            {region.trustSignals.map((sig, i) => (
              <span
                key={i}
                style={{
                  fontSize: 10,
                  fontFamily: NU,
                  fontWeight: 600,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: C.gold,
                  padding: "6px 16px",
                  border: `1px solid rgba(201,168,76,0.2)`,
                  borderRadius: "var(--lwd-radius-input)",
                  whiteSpace: "nowrap",
                }}
              >
                {sig}
              </span>
            ))}
          </div>
        )}

        {/* ═══ ABOUT SECTION (Configurable) ═══════════════════════════════════ */}
        {(pageConfig?.about?.content || region.introEditorial) && (
          <section
            aria-label={`About weddings in ${region.name}`}
            className="lwd-region-intro"
            style={{
              background: C.dark,
              borderBottom: `1px solid ${C.border}`,
              padding: "72px 48px",
            }}
          >
            <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: C.gold,
                    fontWeight: 600,
                  }}
                >
                  {pageConfig?.about?.title || `About ${region.name}`}
                </span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 15,
                  color: C.grey,
                  lineHeight: 1.9,
                  fontWeight: 300,
                }}
              >
                {pageConfig?.about?.content || region.introEditorial}
              </p>
            </div>
          </section>
        )}

        {/* ═══ CATEGORY SHORTCUTS ════════════════════════════════════════════ */}
        <section
          aria-label="Browse by category"
          className="lwd-region-categories"
          style={{
            background: C.black,
            padding: "72px 48px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            {/* Heading */}
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: C.gold,
                    fontWeight: 600,
                  }}
                >
                  Find Your Team
                </span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 400,
                  color: C.off,
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {region.name}{" "}
                <span style={{ fontStyle: "italic", color: C.gold }}>Wedding Vendors</span>
              </h2>
            </div>

            {/* Paginated category carousel — 8 per page */}
            <CategoryCarousel
              categories={VENDOR_CATEGORIES}
              C={C}
              onSelect={(slug) => onViewRegionCategory(countrySlug, regionSlug, slug)}
            />
          </div>
        </section>

        {/* ═══ FEATURED LISTINGS / COMING SOON ═══════════════════════════════ */}
        {regionVenues.length > 0 ? (
          <>
            {/* Premium Featured Section (configurable) or default featured slider */}
            {pageConfig?.featured?.enabled ? (
              <RegionFeatured
                config={pageConfig.featured}
                region={region}
                venues={regionVenues}
                C={C}
                isMobile={isMobile}
                onViewVenue={onViewVenue}
                savedIds={savedIds}
                onToggleSave={toggleSave}
              />
            ) : featuredVenues.length > 0 ? (
              <FeaturedSlider venues={featuredVenues} />
            ) : null}

{/* Venue grid — first 6 GCards (horizontal slider) */}
            <section
              aria-label={`Venues in ${region.name}`}
              className="lwd-region-section"
              style={{
                maxWidth: 1280,
                margin: "0 auto",
                padding: "24px 48px 32px",
              }}
            >
              <div ref={grid1Ref}>
                <SliderNav
                  className="lwd-region-venue-grid"
                  cardWidth={isMobile ? 300 : 340}
                  gap={isMobile ? 12 : 16}
                >
                  {regionVenues.slice(0, 6).map((v, i) => (
                    <div
                      key={v.id}
                      className="lwd-region-venue-card"
                      style={{
                        flex: isMobile ? "0 0 300px" : "0 0 340px",
                        scrollSnapAlign: "start",
                        ...revealStyle(grid1In, i),
                      }}
                    >
                      {isMobile ? (
                        <GCardMobile
                          v={v}
                          saved={savedIds.includes(v.id)}
                          onSave={toggleSave}
                          onView={onViewVenue}
                        />
                      ) : (
                        <GCard
                          v={v}
                          saved={savedIds.includes(v.id)}
                          onSave={toggleSave}
                          onView={onViewVenue}
                          onQuickView={setQvItem}
                        />
                      )}
                    </div>
                  ))}
                </SliderNav>
              </div>
            </section>

            {/* ═══ E-E-A-T EDITORIAL — between map & second grid ═════════════ */}
            {region.editorial && (
              <EditorialSection editorial={region.editorial} region={region} C={C} />
            )}

            {/* Venue grid — remaining cards (7+, horizontal slider) */}
            {regionVenues.length > 6 && (
              <section
                aria-label={`More venues in ${region.name}`}
                className="lwd-region-section"
                style={{
                  maxWidth: 1280,
                  margin: "0 auto",
                  padding: "64px 48px 48px",
                }}
              >
                <div ref={grid2Ref}>
                  <SliderNav
                    className="lwd-region-venue-grid"
                    cardWidth={isMobile ? 300 : 340}
                    gap={isMobile ? 12 : 16}
                  >
                    {regionVenues.slice(6).map((v, i) => (
                      <div
                        key={v.id}
                        className="lwd-region-venue-card"
                        style={{
                          flex: isMobile ? "0 0 300px" : "0 0 340px",
                          scrollSnapAlign: "start",
                          ...revealStyle(grid2In, i),
                        }}
                      >
                        {isMobile ? (
                          <GCardMobile
                            v={v}
                            saved={savedIds.includes(v.id)}
                            onSave={toggleSave}
                            onView={onViewVenue}
                          />
                        ) : (
                          <GCard
                            v={v}
                            saved={savedIds.includes(v.id)}
                            onSave={toggleSave}
                            onView={onViewVenue}
                            onQuickView={setQvItem}
                          />
                        )}
                      </div>
                    ))}
                  </SliderNav>
                </div>
              </section>
            )}
          </>
        ) : (
          /* ── Premium "Coming Soon" editorial state ── */
          <section
            aria-label="Coming soon"
            className="lwd-region-section"
            style={{
              background: C.dark,
              padding: "96px 48px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 640, margin: "0 auto", textAlign: "center" }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 20,
                }}
              >
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: C.gold,
                    fontWeight: 600,
                  }}
                >
                  Coming Soon
                </span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 400,
                  color: C.off,
                  lineHeight: 1.2,
                  margin: "0 0 20px",
                }}
              >
                {region.name} Venues{" "}
                <span style={{ fontStyle: "italic", color: C.gold }}>Arriving Soon</span>
              </h2>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 15,
                  color: C.grey,
                  lineHeight: 1.9,
                  fontWeight: 300,
                  marginBottom: 32,
                }}
              >
                Our editorial team is personally visiting and verifying the finest wedding
                venues in {region.name}. Every listing on LWD is hand-selected — we never
                accept pay-to-play placements. Sign up below to be the first to know when
                {region.name} venues go live.
              </p>
              <button
                style={{
                  background: "none",
                  border: `1px solid ${C.gold}`,
                  borderRadius: "var(--lwd-radius-input)",
                  color: C.gold,
                  padding: "13px 36px",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  transition: "all 0.25s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.gold;
                  e.currentTarget.style.color = "#fff";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                  e.currentTarget.style.color = C.gold;
                }}
              >
                Notify Me
              </button>
            </div>
          </section>
        )}

        {/* ═══ REAL WEDDINGS GALLERY ════════════════════════════════════════ */}
        {pageConfig?.realWeddings?.enabled && (
          <RegionRealWeddings
            config={pageConfig.realWeddings}
            region={region}
            C={C}
            isMobile={isMobile}
          />
        )}

        {/* ═══ CITIES BLOCK ═════════════════════════════════════════════════ */}
        {cities.length > 0 && (
          <section
            aria-label={`${region.localTerm || "Cities"} in ${region.name}`}
            className="lwd-region-cities"
            style={{
              background: C.black,
              padding: "72px 48px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {/* Heading */}
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                  <span
                    style={{
                      fontFamily: NU,
                      fontSize: 9,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: C.gold,
                      fontWeight: 600,
                    }}
                  >
                    Explore
                  </span>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                </div>
                <h2
                  style={{
                    fontFamily: GD,
                    fontSize: "clamp(26px, 3vw, 36px)",
                    fontWeight: 400,
                    color: C.off,
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  {region.localTerm || "Cities"} in{" "}
                  <span style={{ fontStyle: "italic", color: C.gold }}>{region.name}</span>
                </h2>
              </div>

              {/* City cards grid */}
              <div
                ref={citiesRef}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                  gap: 20,
                }}
              >
                {cities.slice(0, visibleCities).map((city, i) => (
                  <div key={city.slug} style={revealStyle(citiesIn, i)}>
                    <CityCard
                      city={city}
                      C={C}
                      onClick={() => onViewRegionCategory(countrySlug, regionSlug, "wedding-venues")}
                    />
                  </div>
                ))}
              </div>

              {/* Load More / Show Less */}
              {cities.length > INITIAL_VISIBLE && (
                <div style={{ textAlign: "center", marginTop: 36 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.grey,
                      marginBottom: 14,
                      fontFamily: NU,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Showing{" "}
                    <span style={{ color: C.gold, fontWeight: 600 }}>
                      {Math.min(visibleCities, cities.length)}
                    </span>{" "}
                    of {cities.length} {(region.localTerm || "cities").toLowerCase()}
                  </div>
                  {visibleCities < cities.length ? (
                    <ToggleBtn C={C} label={`Load More ${region.localTerm || "Cities"}`} onClick={() => setVisibleCities((c) => c + 4)} />
                  ) : (
                    <ToggleBtn C={C} label="Show Less" onClick={() => setVisibleCities(INITIAL_VISIBLE)} />
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ RELATED REGIONS ══════════════════════════════════════════════ */}
        {relatedRegions.length > 0 && (
          <section
            aria-label="Related regions"
            className="lwd-region-related"
            style={{
              background: C.dark,
              padding: "72px 48px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              {/* Heading */}
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    marginBottom: 16,
                  }}
                >
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                  <span
                    style={{
                      fontFamily: NU,
                      fontSize: 9,
                      letterSpacing: "0.3em",
                      textTransform: "uppercase",
                      color: C.gold,
                      fontWeight: 600,
                    }}
                  >
                    Nearby
                  </span>
                  <div style={{ width: 28, height: 1, background: C.gold }} />
                </div>
                <h2
                  style={{
                    fontFamily: GD,
                    fontSize: "clamp(26px, 3vw, 36px)",
                    fontWeight: 400,
                    color: C.off,
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  Explore Nearby{" "}
                  <span style={{ fontStyle: "italic", color: C.gold }}>Regions</span>
                </h2>
              </div>

              {/* Related region cards */}
              <div
                ref={relatedRef}
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
                  gap: 20,
                }}
              >
                {relatedRegions.slice(0, visibleRelated).map((r, i) => (
                  <div key={r.slug} style={revealStyle(relatedIn, i)}>
                    <RelatedRegionCard
                      region={r}
                      C={C}
                      onClick={() =>
                        onBack === undefined
                          ? null
                          : onViewCategory({
                              countrySlug: r.countrySlug,
                              regionSlug: r.slug,
                            })
                      }
                    />
                  </div>
                ))}
              </div>

              {/* Load More / Show Less */}
              {relatedRegions.length > INITIAL_VISIBLE && (
                <div style={{ textAlign: "center", marginTop: 36 }}>
                  <div
                    style={{
                      fontSize: 10,
                      color: C.grey,
                      marginBottom: 14,
                      fontFamily: NU,
                      letterSpacing: "0.5px",
                    }}
                  >
                    Showing{" "}
                    <span style={{ color: C.gold, fontWeight: 600 }}>
                      {Math.min(visibleRelated, relatedRegions.length)}
                    </span>{" "}
                    of {relatedRegions.length} regions
                  </div>
                  {visibleRelated < relatedRegions.length ? (
                    <ToggleBtn C={C} label="Load More Regions" onClick={() => setVisibleRelated((c) => c + 4)} />
                  ) : (
                    <ToggleBtn C={C} label="Show Less" onClick={() => setVisibleRelated(INITIAL_VISIBLE)} />
                  )}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ SEO & AI PANEL ═══════════════════════════════════════════════ */}
        <SEOPanel region={region} C={C} />

        {/* ═══ BROWSE BY REGION ══════════════════════════════════════════ */}
        <DirectoryBrands onViewRegion={onViewRegion} onViewCategory={onViewCategory} showInternational={false} showUK={countrySlug !== "italy" && countrySlug !== "usa"} showItaly={countrySlug === "italy"} showUSA={countrySlug === "usa"} />

        {/* ═══ FOOTER ═══════════════════════════════════════════════════════ */}
        <SiteFooter {...footerNav} />

        {/* Quick-view modal */}
        {qvItem && (
          <QuickViewModal
            item={qvItem}
            onClose={() => setQvItem(null)}
            onViewFull={(v) => { setQvItem(null); onViewVenue(v); }}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}


// ── Sub-components ─────────────────────────────────────────────────────────────

// ── RegionNav — CatNav-style fixed nav with dynamic breadcrumbs ─────────────
function RegionNav({ onBack, scrolled, darkMode, onToggleDark, countryName, regionName, C }) {
  const [hovBack, setHovBack] = useState(false);
  const [hovHome, setHovHome] = useState(false);
  const [hovToggle, setHovToggle] = useState(false);

  const ghostBorder = scrolled ? C.border2 : "rgba(255,255,255,0.25)";
  const ghostColor = scrolled ? C.grey : "rgba(255,255,255,0.7)";

  return (
    <nav
      aria-label="Region navigation"
      className="lwd-catnav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        padding: scrolled ? "12px 48px" : "18px 48px",
        background: scrolled
          ? darkMode
            ? "rgba(8,8,8,0.97)"
            : "rgba(250,248,245,0.97)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.35s ease",
      }}
    >
      {/* Left: back + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
        <button
          onClick={onBack}
          aria-label="Go back"
          onMouseEnter={() => setHovBack(true)}
          onMouseLeave={() => setHovBack(false)}
          style={{
            background: "none",
            border: `1px solid ${hovBack ? C.gold : ghostBorder}`,
            borderRadius: "var(--lwd-radius-input)",
            color: hovBack ? C.gold : ghostColor,
            padding: "7px 14px",
            fontSize: 11,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.2s",
          }}
        >
          ← Back
        </button>

        <nav aria-label="Breadcrumb" className="lwd-catnav-breadcrumb">
          <ol
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: scrolled ? C.grey : "rgba(255,255,255,0.5)",
              letterSpacing: "0.5px",
              listStyle: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <li>
              <button
                onClick={onBack}
                onMouseEnter={() => setHovHome(true)}
                onMouseLeave={() => setHovHome(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 11,
                  color: hovHome ? C.gold : (scrolled ? C.grey : "rgba(255,255,255,0.5)"),
                  transition: "color 0.2s",
                  letterSpacing: "0.5px",
                }}
              >
                Home
              </button>
            </li>
            <li aria-hidden="true" style={{ opacity: 0.4 }}>›</li>
            <li>{countryName}</li>
            <li aria-hidden="true" style={{ opacity: 0.4 }}>›</li>
            <li>
              <span
                style={{
                  color: scrolled ? C.gold : "rgba(201,168,76,0.9)",
                  fontWeight: 600,
                }}
                aria-current="page"
              >
                {regionName}
              </span>
            </li>
          </ol>
        </nav>
      </div>

      {/* Centre: logo */}
      <button
        onClick={onBack}
        aria-label="Luxury Wedding Directory home"
        className="lwd-catnav-logo"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: GD,
          fontSize: 18,
          fontWeight: 600,
          color: scrolled ? C.white : "#ffffff",
          letterSpacing: 0.5,
        }}
      >
        Luxury{" "}
        <span style={{ color: C.gold }}>Wedding</span>{" "}
        Directory
      </button>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleDark}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle theme"
          onMouseEnter={() => setHovToggle(true)}
          onMouseLeave={() => setHovToggle(false)}
          style={{
            background: "none",
            border: `1px solid ${hovToggle ? C.gold : C.border2}`,
            borderRadius: "var(--lwd-radius-input)",
            color: hovToggle ? C.gold : C.grey,
            width: 34,
            height: 34,
            cursor: "pointer",
            fontSize: 14,
            transition: "all 0.2s",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          {darkMode ? "☀" : "☽"}
        </button>

        <button
          className="lwd-btn-list-venue"
          style={{
            background: `linear-gradient(135deg,${C.gold},${C.gold2})`,
            border: "none",
            borderRadius: "var(--lwd-radius-input)",
            color: "#fff",
            padding: "9px 20px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          List Your Venue
        </button>
      </div>
    </nav>
  );
}


// ── Category Shortcut Card ──────────────────────────────────────────────────
// ── Luxury SVG icons — matching RegionCategoryPage ──────────────────────────
const LUXURY_ICONS = {
  "wedding-venues": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M10 10h.01M14 10h.01" />
    </svg>
  ),
  "wedding-planners": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  "photographers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  "florists": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c0 0 0-3 0-6" />
      <path d="M9 18c-2 0-4-1.5-4-4 0-2 2-3.5 4-3.5.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5c2 0 4 1.5 4 3.5 0 2.5-2 4-4 4" />
      <path d="M12 8c0-2 1-4 3-5" />
      <path d="M12 8c0-2-1-4-3-5" />
    </svg>
  ),
  "caterers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  "hair-makeup": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8" />
      <path d="M9 18h6" />
      <path d="M15 5c1-2 3-3 4-2" />
    </svg>
  ),
  "entertainment": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  "videographers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  "wedding-cakes": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
      <path d="M6 14h12v4H6z" />
      <path d="M8 10h8v4H8z" />
      <path d="M12 3v3" />
      <circle cx="12" cy="2" r="1" />
    </svg>
  ),
  "stationery": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  "bridal-wear": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 7 5 7 8c0 2 1 3 2 4l-3 10h12l-3-10c1-1 2-2 2-4 0-3-2-6-5-6z" />
      <path d="M9 22h6" />
    </svg>
  ),
  "jewellers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6" />
      <path d="M12 8V2" />
      <path d="M8 10l-3-5" />
      <path d="M16 10l3-5" />
    </svg>
  ),
  "transport": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-5H5v5z" />
      <path d="M2 12h20" />
      <path d="M5 12V7c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  "event-design": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

// ── Category Carousel — show 7 per page with next/prev arrows ───────────
const CATS_PER_PAGE = 7;

function CategoryCarousel({ categories, C, onSelect }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(categories.length / CATS_PER_PAGE);
  const start = page * CATS_PER_PAGE;
  const visible = categories.slice(start, start + CATS_PER_PAGE);

  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);

  const arrowBtn = (dir, hov, setHov, disabled, onClick) => (
    <button
      aria-label={dir === "prev" ? "Previous categories" : "Next categories"}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov && !disabled ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent",
        border: `1px solid ${disabled ? (C.border || "rgba(255,255,255,0.06)") : hov ? C.gold : (C.border2 || "rgba(255,255,255,0.12)")}`,
        borderRadius: "50%",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.25 : 1,
        transition: "all 0.25s",
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hov && !disabled ? C.gold : (C.grey || "#888")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );

  return (
    <div>
      {/* Grid of cards */}
      <div
        className="lwd-region-cat-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 16,
        }}
      >
        {visible.map((vc) => (
          <CategoryShortcutCard
            key={vc.slug}
            vc={vc}
            C={C}
            onClick={() => onSelect(vc.slug)}
          />
        ))}
      </div>

      {/* Navigation row — arrows + dots */}
      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            marginTop: 28,
          }}
        >
          {arrowBtn("prev", hovPrev, setHovPrev, page === 0, () => setPage((p) => p - 1))}

          {/* Page dots */}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                aria-label={`Page ${i + 1}`}
                onClick={() => setPage(i)}
                style={{
                  width: page === i ? 20 : 6,
                  height: 6,
                  borderRadius: 3,
                  background: page === i ? C.gold : (C.border2 || "rgba(255,255,255,0.12)"),
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  transition: "all 0.3s ease",
                }}
              />
            ))}
          </div>

          {arrowBtn("next", hovNext, setHovNext, page >= totalPages - 1, () => setPage((p) => p + 1))}
        </div>
      )}
    </div>
  );
}

function CategoryShortcutCard({ vc, C, onClick }) {
  const [hov, setHov] = useState(false);
  const iconColor = hov ? C.gold : (C.grey || "#888");
  const renderIcon = LUXURY_ICONS[vc.slug];

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.card : C.dark,
        border: `1px solid ${hov ? C.gold : C.border2}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: "28px 20px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.25s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
      }}
    >
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: hov ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent",
          border: `1px solid ${hov ? C.gold : (C.border2 || "rgba(255,255,255,0.08)")}`,
          transition: "all 0.3s ease",
        }}
        aria-hidden="true"
      >
        {renderIcon ? renderIcon(iconColor) : <span style={{ fontSize: 22, opacity: 0.6 }}>{vc.icon}</span>}
      </span>
      <span
        style={{
          fontFamily: NU,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "1.5px",
          textTransform: "uppercase",
          color: hov ? C.gold : C.off,
          transition: "color 0.2s",
        }}
      >
        {vc.label}
      </span>
    </button>
  );
}


// ── Venue Card (minimal — for region listings) ─────────────────────────────
function VenueCard({ v, C, onView }) {
  const [hov, setHov] = useState(false);
  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${hov ? C.gold : C.border2}`,
        borderRadius: "var(--lwd-radius-card)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.25s",
      }}
      onClick={() => onView?.(v)}
    >
      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img
          src={v.imgs?.[0]}
          alt={v.name}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: hov ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.5s ease",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(180deg,transparent 50%,rgba(0,0,0,0.6) 100%)",
          }}
        />
        {v.tag && (
          <span
            style={{
              position: "absolute",
              top: 12,
              left: 12,
              background: "rgba(201,168,76,0.9)",
              color: "#0f0d0a",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: NU,
            }}
          >
            {v.tag}
          </span>
        )}
      </div>
      <div style={{ padding: "20px 20px 24px" }}>
        <h3
          style={{
            fontFamily: GD,
            fontSize: 20,
            fontWeight: 400,
            color: C.off,
            marginBottom: 6,
            fontStyle: "italic",
          }}
        >
          {v.name}
        </h3>
        <div
          style={{
            fontSize: 12,
            color: C.grey,
            fontFamily: NU,
            marginBottom: 8,
          }}
        >
          {v.city}, {v.region}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: C.gold, fontWeight: 700, fontFamily: NU }}>
            {v.rating} ★
          </span>
          <span style={{ fontSize: 11, color: C.grey, fontFamily: NU }}>
            From {v.priceFrom}
          </span>
        </div>
      </div>
    </article>
  );
}


// ── Reusable Load More / Show Less toggle button ────────────────────────────
function ToggleBtn({ C, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "rgba(201,168,76,0.12)" : "none",
        border: `1px solid ${hov ? "rgba(201,168,76,0.5)" : "rgba(201,168,76,0.25)"}`,
        borderRadius: "var(--lwd-radius-input)",
        color: hov ? C.gold : "rgba(201,168,76,0.7)",
        padding: "13px 44px",
        fontSize: 10,
        fontWeight: 600,
        letterSpacing: "2.5px",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.35s",
      }}
    >
      {label}
    </button>
  );
}

function CityCard({ city, C, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.card : C.dark,
        border: `1px solid ${hov ? C.gold : C.border2}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: "24px 24px",
        cursor: "pointer",
        transition: "all 0.25s",
        textAlign: "left",
        display: "block",
        width: "100%",
        fontFamily: "inherit",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3
          style={{
            fontFamily: GD,
            fontSize: 18,
            fontWeight: 400,
            fontStyle: "italic",
            color: hov ? C.gold : C.off,
            transition: "color 0.2s",
            margin: 0,
          }}
        >
          {city.name}
        </h3>
        <span
          style={{
            fontSize: 14,
            color: C.gold,
            opacity: hov ? 1 : 0,
            transform: hov ? "translateX(0)" : "translateX(-4px)",
            transition: "all 0.3s ease",
          }}
          aria-hidden="true"
        >
          →
        </span>
      </div>
      {city.introEditorial && (
        <p
          style={{
            fontFamily: NU,
            fontSize: 13,
            color: C.grey,
            lineHeight: 1.7,
            fontWeight: 300,
            margin: 0,
          }}
        >
          {city.introEditorial}
        </p>
      )}
      {city.listingCount > 0 && (
        <div
          style={{
            marginTop: 12,
            fontSize: 11,
            color: C.gold,
            fontFamily: NU,
            fontWeight: 600,
            letterSpacing: "0.5px",
          }}
        >
          {city.listingCount} venue{city.listingCount !== 1 ? "s" : ""} →
        </div>
      )}
    </button>
  );
}


// ── Related Region Card ─────────────────────────────────────────────────────
function RelatedRegionCard({ region, C, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.card : "transparent",
        border: `1px solid ${hov ? C.gold : C.border2}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: "28px 24px",
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.25s",
        display: "block",
        width: "100%",
      }}
    >
      <div
        style={{
          fontFamily: GD,
          fontSize: 20,
          fontWeight: 400,
          fontStyle: "italic",
          color: hov ? C.gold : C.off,
          marginBottom: 6,
          transition: "color 0.2s",
        }}
      >
        {region.name}
      </div>
      <div
        style={{
          fontFamily: NU,
          fontSize: 11,
          color: C.grey,
          letterSpacing: "0.5px",
        }}
      >
        {region.group || ""}
        {region.listingCount > 0 && ` · ${region.listingCount} venues`}
      </div>
    </button>
  );
}


// ── EditorialSection — E-E-A-T rich content block ───────────────────────────
function EditorialSection({ editorial, region, C }) {
  const [expanded, setExpanded] = useState(false);
  const visibleSections = expanded ? editorial.sections : editorial.sections.slice(0, 2);

  return (
    <section
      aria-label={`Editorial guide to weddings in ${region.name}`}
      className="lwd-region-section"
      style={{
        background: C.dark,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "80px 48px",
      }}
    >
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        {/* Section label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <div style={{ width: 28, height: 1, background: C.gold }} />
          <span
            style={{
              fontFamily: NU,
              fontSize: 9,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: C.gold,
              fontWeight: 700,
            }}
          >
            Editorial
          </span>
          <div style={{ width: 28, height: 1, background: C.gold }} />
        </div>

        {/* Headline */}
        <h2
          style={{
            fontFamily: GD,
            fontSize: "clamp(26px, 3.2vw, 38px)",
            fontWeight: 400,
            color: C.off,
            lineHeight: 1.2,
            textAlign: "center",
            margin: "0 0 16px",
          }}
        >
          {editorial.headline}
        </h2>

        {/* Standfirst — the E-E-A-T credibility line */}
        <p
          style={{
            fontFamily: NU,
            fontSize: 14,
            color: C.gold,
            lineHeight: 1.7,
            textAlign: "center",
            fontWeight: 400,
            fontStyle: "italic",
            maxWidth: 640,
            margin: "0 auto 48px",
            opacity: 0.85,
          }}
        >
          {editorial.standfirst}
        </p>

        {/* Content sections */}
        {visibleSections.map((s, i) => (
          <article key={i} style={{ marginBottom: 40 }}>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                fontWeight: 400,
                fontStyle: "italic",
                color: C.off,
                marginBottom: 14,
                paddingLeft: 20,
                borderLeft: `2px solid ${C.gold}`,
              }}
            >
              {s.heading}
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                lineHeight: 1.95,
                fontWeight: 300,
              }}
            >
              {s.body}
            </p>
          </article>
        ))}

        {/* Read more / less toggle */}
        {editorial.sections.length > 2 && (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <button
              onClick={() => setExpanded((e) => !e)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontFamily: NU,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "2px",
                textTransform: "uppercase",
                color: C.gold,
                padding: "8px 0",
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                transition: "opacity 0.2s",
              }}
            >
              {expanded ? "Read Less" : `Continue Reading (${editorial.sections.length - 2} more)`}
              <svg
                width="12" height="12" viewBox="0 0 24 24" fill="none"
                stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                style={{
                  transition: "transform 0.3s",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </button>
          </div>
        )}

        {/* Expert note — the trust signal */}
        {editorial.expertNote && (
          <div
            style={{
              background: C.black,
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-card)",
              padding: "32px 36px",
              position: "relative",
            }}
          >
            {/* Decorative quote mark */}
            <span
              aria-hidden="true"
              style={{
                position: "absolute",
                top: -8,
                left: 32,
                background: C.dark,
                padding: "0 12px",
                fontFamily: GD,
                fontSize: 28,
                color: C.gold,
                lineHeight: 1,
              }}
            >
              "
            </span>

            <blockquote
              style={{
                fontFamily: GD,
                fontSize: 16,
                fontStyle: "italic",
                color: C.off,
                lineHeight: 1.7,
                margin: "0 0 20px",
              }}
            >
              {editorial.expertNote.quote}
            </blockquote>

            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {/* Avatar placeholder — gold circle with initials */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  background: `linear-gradient(135deg, ${C.gold}, rgba(201,168,76,0.6))`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "#0f0d0a",
                  fontFamily: NU,
                  flexShrink: 0,
                }}
              >
                LWD
              </div>
              <div>
                <div
                  style={{
                    fontSize: 12,
                    fontFamily: NU,
                    fontWeight: 700,
                    color: C.off,
                    letterSpacing: "0.5px",
                  }}
                >
                  {editorial.expertNote.author}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    fontFamily: NU,
                    color: C.grey,
                    letterSpacing: "0.3px",
                  }}
                >
                  {editorial.expertNote.credential}
                </div>
              </div>

              {/* Verified badge */}
              {editorial.lastVerified && (
                <div
                  style={{
                    marginLeft: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: 10,
                    fontFamily: NU,
                    color: C.gold,
                    fontWeight: 600,
                    letterSpacing: "0.5px",
                    border: `1px solid rgba(201,168,76,0.2)`,
                    borderRadius: "var(--lwd-radius-input)",
                    padding: "5px 12px",
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                    <polyline points="22 4 12 14.01 9 11.01" />
                  </svg>
                  Verified {editorial.lastVerified}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}


// ── MapVenueList — sidebar venue list for inline map ────────────────────────
function MapVenueList({ venues, C }) {
  const [active, setActive] = useState(null);
  return (
    <ul style={{ flex: 1, overflowY: "auto", listStyle: "none", padding: 0, margin: 0 }}>
      {venues.map((v) => (
        <li
          key={v.id}
          onMouseEnter={() => setActive(v.id)}
          onMouseLeave={() => setActive(null)}
          style={{
            display: "flex",
            gap: 12,
            padding: "12px 16px",
            cursor: "pointer",
            borderBottom: `1px solid ${C.border}`,
            background: active === v.id ? (C.goldDim || "rgba(201,168,76,0.06)") : "transparent",
            transition: "background 0.2s",
          }}
        >
          <img
            src={v.imgs[0]}
            alt={v.name}
            style={{
              width: 52,
              height: 52,
              objectFit: "cover",
              flexShrink: 0,
              borderRadius: 4,
              border: `1px solid ${active === v.id ? C.gold : C.border}`,
              transition: "border-color 0.2s",
            }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontSize: 13, fontFamily: GD, color: C.white, fontWeight: 500, marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {v.name}
            </div>
            <div style={{ fontSize: 11, color: C.grey, fontFamily: NU }}>
              {v.city || v.region}{v.capacity ? ` · ${v.capacity} guests` : ""}
            </div>
            <div style={{ fontSize: 10, color: C.gold, fontWeight: 700, marginTop: 2 }}>
              {v.priceFrom}
            </div>
          </div>
          <span
            style={{
              fontSize: 10,
              color: C.gold,
              marginLeft: "auto",
              alignSelf: "center",
              opacity: active === v.id ? 1 : 0,
              transition: "opacity 0.2s",
            }}
            aria-hidden="true"
          >
            →
          </span>
        </li>
      ))}
    </ul>
  );
}


// ── SEO Panel — collapsible AI/SEO data blocks ─────────────────────────────
function SEOPanel({ region, C }) {
  const [expanded, setExpanded] = useState(false);

  const hasSEO = region.seo?.metaDescription;
  const hasAI = region.ai?.summary;

  if (!hasSEO && !hasAI) return null;

  return (
    <section
      aria-label="SEO and AI insights"
      className="lwd-region-section"
      style={{
        background: C.black,
        padding: "48px 48px",
        borderBottom: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <button
          onClick={() => setExpanded((e) => !e)}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 12,
            width: "100%",
            padding: 0,
          }}
        >
          <div style={{ width: 28, height: 1, background: C.gold }} />
          <span
            style={{
              fontFamily: NU,
              fontSize: 9,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: C.gold,
              fontWeight: 600,
            }}
          >
            SEO & AI Insights
          </span>
          <div style={{ width: 28, height: 1, background: C.gold }} />
          <span
            style={{
              fontFamily: NU,
              fontSize: 14,
              color: C.grey,
              marginLeft: "auto",
              transition: "transform 0.2s",
              transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            ▾
          </span>
        </button>

        {expanded && (
          <div style={{ marginTop: 32 }}>
            {/* SEO block */}
            {hasSEO && (
              <div style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    fontFamily: NU,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: C.off,
                    marginBottom: 12,
                  }}
                >
                  Meta
                </h3>
                <div style={{ fontSize: 13, color: C.grey, fontFamily: NU, lineHeight: 1.7 }}>
                  <div style={{ marginBottom: 8 }}>
                    <strong style={{ color: C.off }}>Title:</strong> {region.seo.title}
                  </div>
                  <div>
                    <strong style={{ color: C.off }}>Description:</strong> {region.seo.metaDescription}
                  </div>
                </div>
              </div>
            )}

            {/* AI block */}
            {hasAI && (
              <div style={{ marginBottom: 32 }}>
                <h3
                  style={{
                    fontFamily: NU,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: C.off,
                    marginBottom: 12,
                  }}
                >
                  AI Summary
                </h3>
                <p style={{ fontSize: 13, color: C.grey, fontFamily: NU, lineHeight: 1.7 }}>
                  {region.ai.summary}
                </p>
                {region.ai.focusKeywords?.length > 0 && (
                  <div style={{ marginTop: 16, display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {region.ai.focusKeywords.map((kw) => (
                      <span
                        key={kw}
                        style={{
                          fontSize: 10,
                          fontFamily: NU,
                          color: C.gold,
                          border: `1px solid ${C.border2}`,
                          borderRadius: "var(--lwd-radius-input)",
                          padding: "4px 10px",
                          letterSpacing: "0.5px",
                        }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Intent signals */}
            {region.ai?.intentSignals && (
              <div>
                <h3
                  style={{
                    fontFamily: NU,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: C.off,
                    marginBottom: 12,
                  }}
                >
                  Intent Signals
                </h3>
                {["high", "mid", "low"].map(
                  (level) =>
                    region.ai.intentSignals[level]?.length > 0 && (
                      <div key={level} style={{ marginBottom: 12 }}>
                        <span
                          style={{
                            fontSize: 10,
                            fontFamily: NU,
                            fontWeight: 700,
                            color:
                              level === "high"
                                ? "#4ade80"
                                : level === "mid"
                                ? C.gold
                                : C.grey,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                          }}
                        >
                          {level}:
                        </span>
                        <span
                          style={{
                            fontSize: 12,
                            fontFamily: NU,
                            color: C.grey,
                            marginLeft: 8,
                          }}
                        >
                          {region.ai.intentSignals[level].join(" · ")}
                        </span>
                      </div>
                    )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
