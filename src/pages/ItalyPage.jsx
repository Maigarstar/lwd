// ─── src/pages/ItalyPage.jsx ──────────────────────────────────────────────────
// Dedicated Italy country hub at /italy, the canonical, indexable Italy page.
// Full luxury editorial page with venue browsing, vendor discovery, and filters.
import "../category.css";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { ThemeCtx }        from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import {
  VENUES,
  REGIONS,
  STYLES,
  CAPS,
  PRICES,
  DEFAULT_FILTERS,
  getRegionNameBySlug,
} from "../data/italyVenues";
import { getRegionsByCountry } from "../data/geo";
import { usePremiumCardData } from "../hooks/usePremiumCardData";

// ── Components ──────────────────────────────────────────────────────────────
import { useChat }     from "../chat/ChatContext";
import CatNav          from "../components/nav/CatNav";
import CleanFilterBar  from "../components/filters/CleanFilterBar";
import Hero            from "../components/hero/Hero";
import InfoStrip       from "../components/sections/InfoStrip";
import LatestSplit     from "../components/sections/LatestSplit";
import FeaturedSlider  from "../components/sections/FeaturedSlider";
import EditorialBanner from "../components/sections/EditorialBanner";
import MapSection      from "../components/sections/MapSection";
import SEOBlock        from "../components/sections/SEOBlock";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import HCard           from "../components/cards/HCard";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import QuickViewModal  from "../components/modals/QuickViewModal";
import SliderNav       from "../components/ui/SliderNav";
import { VENDORS as ALL_VENDORS } from "../data/vendors";

// ── Italy-only data subsets ─────────────────────────────────────────────────
const ITALY_VENUES  = VENUES.filter((v) => v.countrySlug === "italy");
// Note: FEATURED and LATEST_5 now come from usePremiumCardData hook (unified pipeline)
// Keeping ITALY_REGIONS and ITALY_VENDORS for filter/vendor sections (non-premium)
const ITALY_REGIONS = [
  { slug: "all", name: "All Regions" },
  ...getRegionsByCountry("italy"),
];
const ITALY_VENDORS = (ALL_VENDORS || []).filter((v) => v.countrySlug === "italy").slice(0, 12);

// ── Filter helpers ──────────────────────────────────────────────────────────
function matchesCapacity(v, cap) {
  if (cap === CAPS[0]) return true;
  if (cap === CAPS[1]) return v.capacity <= 50;
  if (cap === CAPS[2]) return v.capacity > 50  && v.capacity <= 100;
  if (cap === CAPS[3]) return v.capacity > 100 && v.capacity <= 200;
  if (cap === CAPS[4]) return v.capacity > 200;
  return true;
}

// ── Mobile detection hook ─────────────────────────────────────────────────
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

// ═════════════════════════════════════════════════════════════════════════════
export default function ItalyPage({
  onBack         = () => {},
  onViewVenue    = () => {},
  onViewVendor   = () => {},
  onViewRegion   = () => {},
  onViewCategory = () => {},
  initialRegion       = null,
  initialSearchQuery  = null,
  noIndex        = false,
  footerNav = {},
}) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [darkMode,     setDarkMode]     = useState(() => getDefaultMode() === "dark");
  const [searchQuery,  setSearchQuery]  = useState(initialSearchQuery || "");
  const [filters,      setFilters]      = useState(() => ({
    ...DEFAULT_FILTERS,
    ...(initialRegion ? { region: initialRegion } : {}),
  }));
  const [viewMode,     setViewMode]     = useState("grid");
  const [sortMode,     setSortMode]     = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(12);
  const [savedIds,     setSavedIds]     = useState([]);
  const [scrolled,     setScrolled]     = useState(false);
  const [qvItem,       setQvItem]       = useState(null);

  const isMobile = useIsMobile();
  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Fetch premium card data from unified pipeline ─────────────────────────
  const { listings: latestVenues } = usePremiumCardData({
    sectionType: "latest",
    listingType: "venue",
  });
  const { listings: signatureVenues } = usePremiumCardData({
    sectionType: "signature",
    listingType: "venue",
  });
  const { listings: latestVendors } = usePremiumCardData({
    sectionType: "latest",
    listingType: "vendor",
  });

  // ── Register active context with global chat ────────────────────────────
  const { setChatContext } = useChat();
  useEffect(() => {
    setChatContext({ country: "Italy", region: null, page: "italy" });
  }, [setChatContext]);

  // ── SEO: indexable entity or noindex template ────────────────────────────
  useEffect(() => {
    // Robots, noindex only when used as /category template
    let robots = document.querySelector('meta[name="robots"]');
    if (noIndex) {
      if (!robots) {
        robots = document.createElement("meta");
        robots.setAttribute("name", "robots");
        document.head.appendChild(robots);
      }
      robots.setAttribute("content", "noindex, follow");
    } else if (robots) {
      robots.remove();
    }

    // Canonical, always point to /italy
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", "https://luxuryweddingdirectory.com/italy");

    return () => {
      if (noIndex && robots?.parentNode) robots.remove();
      canon.remove();
    };
  }, [noIndex]);

  // ── Update region filter when navigated from another page ──────────────
  useEffect(() => {
    if (initialRegion) {
      setFilters((f) => ({ ...f, region: initialRegion }));
    }
  }, [initialRegion]);

  // ── Update search query when navigated from RegionCategoryPage ────────
  useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // ── Scroll listener ────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Inject CSS vars for theme-aware scrollbar + select options ─────────
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--lwd-dark",  C.dark);
    root.style.setProperty("--lwd-gold",  C.gold);
    root.style.setProperty("--lwd-white", C.white);
  }, [C.dark, C.gold, C.white]);

  // ── Filtered + sorted venue list, memoised ───────────────────────────
  const filtered = useMemo(() => {
    const parsePrice = (s) => parseInt(String(s).replace(/[^0-9]/g, ""), 10) || 0;
    const q = searchQuery.trim().toLowerCase();
    let result = ITALY_VENUES.filter((v) => {
      const rOk = filters.region   === "all"       || v.region           === getRegionNameBySlug(filters.region);
      const sOk = filters.style    === STYLES[0]  || v.styles.includes(filters.style);
      const pOk = filters.price    === PRICES[0]  || v.priceLabel       === filters.price;
      const cOk = matchesCapacity(v, filters.capacity);
      const qOk = !q || v.name.toLowerCase().includes(q) || (v.desc || "").toLowerCase().includes(q) || (v.city || "").toLowerCase().includes(q) || (v.region || "").toLowerCase().includes(q);
      return rOk && sOk && pOk && cOk && qOk;
    });
    if (sortMode === "recommended") {
      result = [...result].sort((a, b) => (b.lwdScore || 0) - (a.lwdScore || 0) || b.rating - a.rating);
    } else if (sortMode === "rating") {
      result = [...result].sort((a, b) => b.rating - a.rating || (b.lwdScore || 0) - (a.lwdScore || 0));
    } else if (sortMode === "price-low") {
      result = [...result].sort((a, b) => parsePrice(a.priceFrom) - parsePrice(b.priceFrom));
    } else if (sortMode === "price-high") {
      result = [...result].sort((a, b) => parsePrice(b.priceFrom) - parsePrice(a.priceFrom));
    }
    return result;
  }, [filters, sortMode, searchQuery]);

  // ── Reset visible count when filters change ────────────────────────────
  useEffect(() => { setVisibleCount(12); }, [filters]);

  // ── Stable callbacks ───────────────────────────────────────────────────
  const toggleSave = useCallback(
    (id) =>
      setSavedIds((s) =>
        s.includes(id) ? s.filter((x) => x !== id) : [...s, id]
      ),
    []
  );

  const handleFiltersChange = useCallback((f) => setFilters(f), []);
  const handleViewMode      = useCallback((m) => setViewMode(m), []);
  const handleLoadMore      = useCallback(() => setVisibleCount((c) => c + 12), []);
  const handleToggleDark    = useCallback(() => setDarkMode((d) => !d), []);

  // ── Batched venue slices (8 on mobile, 12 on desktop) ─────────────────
  const batch1 = filtered.slice(0, isMobile ? 8 : 12);
  const batch2 = filtered.slice(isMobile ? 8 : 12, Math.min(visibleCount, filtered.length));
  const showSlider = signatureVenues.length > 0 && filtered.length >= 5;

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <ThemeCtx.Provider value={C}>
      <div
        style={{ background: C.black, minHeight: "100vh", color: C.white }}
      >
        {/* ── Fixed navigation ── */}
        <CatNav
          onBack={onBack}
          scrolled={scrolled}
          darkMode={darkMode}
          onToggleDark={handleToggleDark}
        />

        {/* ── Clean filter bar ── */}
        <CleanFilterBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          regions={ITALY_REGIONS}
          sortMode={sortMode}
          onSortChange={setSortMode}
          resultCount={filtered.length}
          C={C}
        />

        {/* ── Hero (72vh) ── */}
        <Hero count={filtered.length} />

        {/* ── Info strip ── */}
        <InfoStrip />

        {/* ── Unified sticky search bar (venues + vendors toggle) ── */}
        <CountrySearchBar
          filters={filters}
          onFiltersChange={handleFiltersChange}
          viewMode={viewMode}
          onViewMode={handleViewMode}
          sortMode={sortMode}
          onSortChange={setSortMode}
          total={filtered.length}
          regions={ITALY_REGIONS}
          onVendorSearch={(q) => onViewCategory?.({ searchQuery: q.location || q.category })}
          countryFilter="Italy"
          mapContent={
            <MapSection
              venues={filtered}
              vendors={ITALY_VENDORS}
              countryFilter="Italy"
            />
          }
        />

        {/* ── Editorial content (hidden when map is active) ── */}
        {viewMode !== "map" && (
          <>
            {/* ── Bridge: Choose your backdrop ── */}
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "56px 16px 0" : "56px 48px 0", textAlign: "center" }}>
              <p style={{
                fontFamily: "var(--font-heading-primary)",
                fontSize: "clamp(22px,2.5vw,32px)",
                fontWeight: 300,
                fontStyle: "italic",
                color: C.grey,
                letterSpacing: "0.5px",
              }}>
                Choose your backdrop.
              </p>
            </div>

            {/* ── Latest Venues + editorial text split (unified pipeline) ── */}
            <LatestSplit venues={latestVenues} />

            {/* ── Divider ── */}
            <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 16px" : "0 48px" }}>
              <div style={{ height: 1, background: C.border }} />
            </div>
          </>
        )}

        {/* ══ VENUE + VENDOR CARDS (always visible, scroll below map) ════ */}
          <>
            {/* ── Bridge: Latest Venues ── */}
            {filtered.length > 0 && (
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "52px 16px 8px" : "52px 48px 8px" }}>
                <p style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize: "clamp(22px,2.5vw,32px)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: C.grey,
                  letterSpacing: "0.5px",
                  margin: "0 0 6px",
                }}>
                  Latest Venues.
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: C.grey,
                  opacity: 0.6,
                  lineHeight: 1.6,
                  maxWidth: 520,
                  margin: 0,
                }}>
                  Newly added villas, palazzi, and estates, each personally vetted by our editorial team.
                </p>
              </div>
            )}

            {/* Batch 1 (first 6) */}
            <div className="lwd-venue-list-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "28px 16px 0" : "28px 48px 0" }}>
              {filtered.length === 0 ? (
                /* Empty state, brand-aligned tone */
                <div style={{ textAlign: "center", padding: "100px 0" }}>
                  <div
                    style={{
                      fontSize: 9,
                      letterSpacing: "4px",
                      textTransform: "uppercase",
                      color: "rgba(201,168,76,0.5)",
                      marginBottom: 20,
                      fontFamily: "var(--font-body)",
                    }}
                  >
                    Nothing here, yet
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading-primary)",
                      fontSize: "clamp(24px,3vw,34px)",
                      fontWeight: 300,
                      fontStyle: "italic",
                      color: C.off,
                      marginBottom: 12,
                      lineHeight: 1.3,
                    }}
                  >
                    We couldn't find a match for that combination.
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: C.grey,
                    fontFamily: "var(--font-body)",
                    fontWeight: 300,
                    marginBottom: 28,
                  }}>
                    Try broadening your filters, or let us surprise you.
                  </p>
                  <button
                    onClick={() => setFilters(DEFAULT_FILTERS)}
                    style={{
                      background: "none",
                      border: `1px solid rgba(201,168,76,0.4)`,
                      borderRadius: "var(--lwd-radius-input)",
                      color: "rgba(201,168,76,0.8)",
                      padding: "12px 32px",
                      fontSize: 10,
                      fontWeight: 600,
                      letterSpacing: "2.5px",
                      textTransform: "uppercase",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      transition: "all 0.3s",
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)"; e.currentTarget.style.color = "rgba(201,168,76,0.8)"; }}
                  >
                    See All Venues
                  </button>
                </div>
              ) : viewMode === "grid" ? (
                <SliderNav className="lwd-venue-grid" cardWidth={432} gap={24}>
                  {batch1.map((v) => (
                    <div key={v.id} className="lwd-venue-card" style={{ flex: "0 0 432px", width: 432, height: 560, scrollSnapAlign: "start" }}>
                      <LuxuryVenueCard
                        v={v}
                        isMobile={isMobile}
                        onView={() => onViewVenue?.(v)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    </div>
                  ))}
                </SliderNav>
              ) : (
                <div aria-label="Venue list">
                  {batch1.map((v) => (
                    <HCard
                      key={v.id}
                      v={v}
                      saved={savedIds.includes(v.id)}
                      onSave={toggleSave}
                      onView={onViewVenue}
                      onQuickView={setQvItem}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* ── Signature Collection, premium tier (unified pipeline) ── */}
            {showSlider && (
              <div style={{ marginTop: 72 }}>
                {/* Thin gold divider */}
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "0 16px" : "0 48px", marginBottom: 0 }}>
                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
                </div>
                <FeaturedSlider venues={signatureVenues} />
              </div>
            )}

            {/* Batch 2 (venues 6 → visibleCount) */}
            {batch2.length > 0 && (
              <div className="lwd-venue-grid-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "28px 16px 0" : "28px 48px 0" }}>
                {viewMode === "grid" ? (
                  <SliderNav className="lwd-venue-grid" cardWidth={432} gap={24}>
                    {batch2.map((v) => (
                      <div key={v.id} className="lwd-venue-card" style={{ flex: "0 0 432px", width: 432, height: 560, scrollSnapAlign: "start" }}>
                        <LuxuryVenueCard
                          v={v}
                          isMobile={isMobile}
                          onView={() => onViewVenue?.(v)}
                          quickViewItem={qvItem}
                          setQuickViewItem={setQvItem}
                        />
                      </div>
                    ))}
                  </SliderNav>
                ) : (
                  batch2.map((v) => (
                    <HCard
                      key={v.id}
                      v={v}
                      saved={savedIds.includes(v.id)}
                      onSave={toggleSave}
                      onView={onViewVenue}
                      onQuickView={setQvItem}
                    />
                  ))
                )}
              </div>
            )}

            {/* ── Editorial banner break ── */}
            <div style={{ marginTop: 80 }}>
              <EditorialBanner />
            </div>

            {/* ── Latest Vendors (unified pipeline) ── */}
            {latestVendors.length > 0 && (
              <>
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "48px 16px 8px" : "48px 48px 8px", marginTop: 40 }}>
                  <p style={{
                    fontFamily: "var(--font-heading-primary)",
                    fontSize: "clamp(22px,2.5vw,32px)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    color: C.grey,
                    letterSpacing: "0.5px",
                    margin: "0 0 6px",
                  }}>
                    Latest Vendors.
                  </p>
                  <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: C.grey,
                    opacity: 0.6,
                    lineHeight: 1.6,
                    maxWidth: 520,
                    margin: 0,
                  }}>
                    Planners, photographers, florists, and culinary artists, the professionals behind Italy's finest celebrations.
                  </p>
                </div>
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "28px 16px 0" : "28px 48px 0" }}>
                  <SliderNav className="lwd-vendor-slider" cardWidth={432} gap={24}>
                    {latestVendors.map((v) => (
                      <div key={v.id} className="lwd-vendor-card" style={{ flex: "0 0 432px", width: 432, height: 560, scrollSnapAlign: "start" }}>
                        <LuxuryVendorCard
                          v={v}
                          isMobile={isMobile}
                          onView={() => onViewVendor?.(v)}
                          quickViewItem={qvItem}
                          setQuickViewItem={setQvItem}
                        />
                      </div>
                    ))}
                  </SliderNav>
                </div>
              </>
            )}

            {/* ── Load more ── */}
            {visibleCount < filtered.length && (
              <div style={{ textAlign: "center", padding: "64px 0 24px" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: C.grey,
                    opacity: 0.6,
                    marginBottom: 18,
                    fontFamily: "var(--font-body)",
                    letterSpacing: "0.5px",
                  }}
                >
                  Showing <span style={{ color: "rgba(201,168,76,0.6)", fontWeight: 600 }}>{Math.min(visibleCount, filtered.length)}</span> of{" "}
                  {filtered.length} venues
                </div>
                <LoadMoreBtn C={C} onClick={handleLoadMore} />
              </div>
            )}
          </>

        {/* ── SEO / planning guide block ── */}
        <SEOBlock />

        {/* ── Browse Italian Regions ── */}
        <DirectoryBrands onViewRegion={onViewRegion} onViewCategory={onViewCategory} showInternational={false} showUK={false} showItaly darkMode={darkMode} />

        {/* ── Quick View modal (page-level) ── */}
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

// ── Tiny helper, Load More button with state-driven hover ──────────────────
function LoadMoreBtn({ C, onClick }) {
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
        color: hov ? "#C9A84C" : "rgba(201,168,76,0.7)",
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
      See More Venues
    </button>
  );
}
