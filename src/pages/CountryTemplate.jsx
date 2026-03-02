// ─── src/pages/CountryTemplate.jsx ───────────────────────────────────────────
// Legacy template route at /category — noindexed, canonical → /italy.
// Each country now has its own dedicated page (ItalyPage, USAPage, etc.)
import "../category.css";
import { useState, useEffect, useMemo, useCallback } from "react";

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

// ── Components ──────────────────────────────────────────────────────────────
import { useChat }     from "../chat/ChatContext";
import CatNav          from "../components/nav/CatNav";
import Hero            from "../components/hero/Hero";
import InfoStrip       from "../components/sections/InfoStrip";
import LatestSplit     from "../components/sections/LatestSplit";
import FeaturedSlider  from "../components/sections/FeaturedSlider";
import EditorialBanner from "../components/sections/EditorialBanner";
import MapSection      from "../components/sections/MapSection";
import SEOBlock        from "../components/sections/SEOBlock";
import SiteFooter      from "../components/sections/SiteFooter";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import FilterBar       from "../components/filters/FilterBar";
import HCard           from "../components/cards/HCard";
import GCard           from "../components/cards/GCard";
import QuickViewModal  from "../components/modals/QuickViewModal";
import VendorFinder    from "../components/sections/VendorFinder";
import { VENDORS as ALL_VENDORS } from "../data/vendors";

// ── Italy-only subset (template defaults to Italy) ──────────────────────────
const ITALY_VENUES = VENUES.filter((v) => v.countrySlug === "italy");
// Featured venues (static — never changes)
const FEATURED = ITALY_VENUES.filter((v) => v.featured);
// Latest 5 venues for the editorial split section
const LATEST_5 = ITALY_VENUES.slice(0, 5);

// ── Italy regions for the filter mega menu (with priority levels) ─────────────
const ITALY_REGIONS = [
  { slug: "all", name: "All Regions" },
  ...getRegionsByCountry("italy"),
];

// ── Italy vendors for the vendors grid ───────────────────────────────────────
const ITALY_VENDORS = (ALL_VENDORS || []).filter((v) => v.countrySlug === "italy").slice(0, 6);

// ── Filter helpers ────────────────────────────────────────────────────────────
function matchesCapacity(v, cap) {
  if (cap === CAPS[0]) return true;
  if (cap === CAPS[1]) return v.capacity <= 50;
  if (cap === CAPS[2]) return v.capacity > 50  && v.capacity <= 100;
  if (cap === CAPS[3]) return v.capacity > 100 && v.capacity <= 200;
  if (cap === CAPS[4]) return v.capacity > 200;
  return true;
}

export default function CountryTemplate({
  onBack      = () => {},
  onViewVenue = () => {},
  onViewRegion = () => {},
  onViewCategory = () => {},
  initialRegion = null,
  initialSearchQuery = null,
  footerNav = {},
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const [darkMode,     setDarkMode]     = useState(() => getDefaultMode() === "dark");
  const [searchQuery, setSearchQuery]   = useState(initialSearchQuery || "");
  const [filters,      setFilters]      = useState(() => ({
    ...DEFAULT_FILTERS,
    ...(initialRegion ? { region: initialRegion } : {}),
  }));
  const [viewMode,     setViewMode]     = useState("list");
  const [sortMode,     setSortMode]     = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(12);
  const [savedIds,     setSavedIds]     = useState([]);
  const [scrolled,     setScrolled]     = useState(false);
  const [qvItem,       setQvItem]       = useState(null);

  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Register active context with global chat ──────────────────────────────
  const { setChatContext } = useChat();
  useEffect(() => {
    setChatContext({ country: "Italy", region: null, page: "category" });
  }, [setChatContext]);

  // ── SEO: noindex template route, canonical to /italy ──────────────────────
  // CountryTemplate is a rendering template only. The indexable entity is /italy.
  // Prevents /category from competing with /italy, /italy/tuscany, etc.
  useEffect(() => {
    // robots — noindex, follow
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, follow");

    // canonical — point to /italy (the SEO entity)
    let canon = document.querySelector('link[rel="canonical"]');
    if (!canon) {
      canon = document.createElement("link");
      canon.setAttribute("rel", "canonical");
      document.head.appendChild(canon);
    }
    canon.setAttribute("href", "https://luxuryweddingdirectory.com/italy");

    return () => {
      // Clean up when leaving this page so other pages aren't affected
      robots.remove();
      canon.remove();
    };
  }, []);

  // ── Update region filter when navigated from another page ────────────────
  useEffect(() => {
    if (initialRegion) {
      setFilters((f) => ({ ...f, region: initialRegion }));
    }
  }, [initialRegion]);

  // ── Update search query when navigated from RegionCategoryPage ──────────
  useEffect(() => {
    if (initialSearchQuery) setSearchQuery(initialSearchQuery);
  }, [initialSearchQuery]);

  // ── Scroll listener ──────────────────────────────────────────────────────
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // ── Inject CSS vars for theme-aware scrollbar + select options ───────────
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty("--lwd-dark",  C.dark);
    root.style.setProperty("--lwd-gold",  C.gold);
    root.style.setProperty("--lwd-white", C.white);
  }, [C.dark, C.gold, C.white]);

  // ── Filtered + sorted venue list — memoised ─────────────────────────────
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
    // Sort
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

  // ── Reset visible count when filters change ──────────────────────────────
  useEffect(() => { setVisibleCount(12); }, [filters]);

  // ── Stable callbacks ─────────────────────────────────────────────────────
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

  // ── Batched venue slices ─────────────────────────────────────────────────
  const batch1 = filtered.slice(0, 6);
  const batch2 = filtered.slice(6, Math.min(visibleCount, filtered.length));
  const showSlider = FEATURED.length > 0 && filtered.length >= 5;

  // ── Render ───────────────────────────────────────────────────────────────
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

        {/* ── Hero (72vh) ── */}
        <Hero count={filtered.length} />

        {/* ── Info strip ── */}
        <InfoStrip />

        {/* ── Bridge: Choose your backdrop ── */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "56px 48px 0", textAlign: "center" }}>
          <p style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: "clamp(22px,2.5vw,32px)",
            fontWeight: 300,
            fontStyle: "italic",
            color: "rgba(255,255,255,0.4)",
            letterSpacing: "0.5px",
          }}>
            Choose your backdrop.
          </p>
        </div>

        {/* ── Latest 5 + editorial text split ── */}
        <LatestSplit venues={LATEST_5} />

        {/* ── Divider ── */}
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px" }}>
          <div style={{ height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* ── Bridge: Refine your selection ── */}
        <div style={{ textAlign: "center", padding: "48px 48px 20px" }}>
          <p style={{
            fontSize: 10,
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "rgba(201,168,76,0.5)",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
          }}>
            Refine your selection
          </p>
        </div>

        {/* ── Sticky filter bar ── */}
        <FilterBar
          filters={filters}
          onChange={handleFiltersChange}
          viewMode={viewMode}
          onViewMode={handleViewMode}
          sortMode={sortMode}
          onSortChange={setSortMode}
          total={filtered.length}
          regions={ITALY_REGIONS}
        />

        {/* ══ MAP VIEW ══════════════════════════════════════════════════════ */}
        {viewMode === "map" && <MapSection venues={filtered} />}

        {/* ══ LIST / GRID VIEW ══════════════════════════════════════════════ */}
        {viewMode !== "map" && (
          <>
            {/* ── Bridge: Latest Venues ── */}
            {filtered.length > 0 && (
              <div style={{ maxWidth: 1280, margin: "0 auto", padding: "52px 48px 8px" }}>
                <p style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize: "clamp(22px,2.5vw,32px)",
                  fontWeight: 300,
                  fontStyle: "italic",
                  color: "rgba(255,255,255,0.35)",
                  letterSpacing: "0.5px",
                  margin: "0 0 6px",
                }}>
                  Latest Venues.
                </p>
                <p style={{
                  fontFamily: "var(--font-body)",
                  fontSize: 13,
                  color: "rgba(255,255,255,0.35)",
                  lineHeight: 1.6,
                  maxWidth: 520,
                  margin: 0,
                }}>
                  Newly added villas, palazzi, and estates — each personally vetted by our editorial team.
                </p>
              </div>
            )}

            {/* Batch 1 (first 6) */}
            <div className="lwd-venue-list-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 0" }}>
              {filtered.length === 0 ? (
                /* Empty state — brand-aligned tone */
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
                    Nothing here — yet
                  </div>
                  <div
                    style={{
                      fontFamily: "var(--font-heading-primary)",
                      fontSize: "clamp(24px,3vw,34px)",
                      fontWeight: 300,
                      fontStyle: "italic",
                      color: "rgba(255,255,255,0.7)",
                      marginBottom: 12,
                      lineHeight: 1.3,
                    }}
                  >
                    We couldn't find a match for that combination.
                  </div>
                  <p style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 300,
                    marginBottom: 28,
                  }}>
                    Try broadening your filters — or let us surprise you.
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
                <div
                  className="lwd-venue-grid"
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3,1fr)",
                    gap: 16,
                  }}
                  aria-label="Venue grid"
                >
                  {batch1.map((v) => (
                    <GCard
                      key={v.id}
                      v={v}
                      saved={savedIds.includes(v.id)}
                      onSave={toggleSave}
                      onView={onViewVenue}
                      onQuickView={setQvItem}
                    />
                  ))}
                </div>
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

            {/* ── Signature Collection — premium tier ── */}
            {showSlider && (
              <div style={{ marginTop: 72 }}>
                {/* Thin gold divider */}
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", marginBottom: 0 }}>
                  <div style={{ height: 1, background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.3), transparent)" }} />
                </div>
                <FeaturedSlider venues={FEATURED} />
              </div>
            )}

            {/* Batch 2 (venues 6 → visibleCount) */}
            {batch2.length > 0 && (
              <div className="lwd-venue-grid-wrap" style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 0" }}>
                {viewMode === "grid" ? (
                  <div
                    className="lwd-venue-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 16,
                    }}
                  >
                    {batch2.map((v) => (
                      <GCard
                        key={v.id}
                        v={v}
                        saved={savedIds.includes(v.id)}
                        onSave={toggleSave}
                        onView={onViewVenue}
                        onQuickView={setQvItem}
                      />
                    ))}
                  </div>
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

            {/* ── Vendor Finder + Latest Vendors ── */}
            {ITALY_VENDORS.length > 0 && (
              <>
                <div style={{ marginTop: 72 }}>
                  <VendorFinder onViewCategory={onViewCategory} defaultLocation="Italy" />
                </div>
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: "48px 48px 8px" }}>
                  <p style={{
                    fontFamily: "var(--font-heading-primary)",
                    fontSize: "clamp(22px,2.5vw,32px)",
                    fontWeight: 300,
                    fontStyle: "italic",
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: "0.5px",
                    margin: "0 0 6px",
                  }}>
                    Latest Vendors.
                  </p>
                  <p style={{
                    fontFamily: "var(--font-body)",
                    fontSize: 13,
                    color: "rgba(255,255,255,0.35)",
                    lineHeight: 1.6,
                    maxWidth: 520,
                    margin: 0,
                  }}>
                    Planners, photographers, florists, and culinary artists — the professionals behind Italy's finest celebrations.
                  </p>
                </div>
                <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 48px 0" }}>
                  <div className="lwd-venue-grid" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16 }}>
                    {ITALY_VENDORS.map((v) => (
                      <GCard
                        key={v.id}
                        v={v}
                        saved={savedIds.includes(v.id)}
                        onSave={toggleSave}
                        onView={onViewVenue}
                        onQuickView={setQvItem}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* ── Load more ── */}
            {visibleCount < filtered.length && (
              <div style={{ textAlign: "center", padding: "60px 0 24px" }}>
                <div
                  style={{
                    fontSize: 10,
                    color: "rgba(255,255,255,0.3)",
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
        )}

        {/* ── SEO / planning guide block ── */}
        <SEOBlock />

        {/* ── Browse Italian Regions ── */}
        <DirectoryBrands onViewRegion={onViewRegion} onViewCategory={onViewCategory} showInternational={false} showUK={false} showItaly />

        {/* ── Black footer ── */}
        <SiteFooter {...footerNav} />

        {/* Aura chat is now global — rendered by AuraChat in main.jsx */}

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

// ── Tiny helper — Load More button with state-driven hover ────────────────────
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
