// ─── src/pages/RegionCategoryPage.jsx ──────────────────────────────────────────
// Editorial intent page for every Region × Category combination.
// e.g. /uk/london/wedding-venues  /italy/tuscany/photographers
// Data-driven: one template, many region×category combos.
import { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import {
  getRegionBySlug,
  getCountryBySlug,
  getRegionsByCountry,
  VENDOR_CATEGORIES,
  getRegionCategoryPath,
  getRegionCategoryEditorial,
  geoSlugToVendorCategory,
  getVendorCategoryByGeoSlug,
} from "../data/geo.js";
import { VENUES } from "../data/italyVenues";
import { VENDORS } from "../data/vendors.js";
import { getUserCountryFromIP, sortByCountryPriority } from "../services/geoLocationService";

import { DEFAULT_FILTERS } from "../data/italyVenues";

import SiteFooter from "../components/sections/SiteFooter";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import VenueListItemCard from "../components/cards/VenueListItemCard";
import VenueMapPanel    from "../components/maps/VenueMapPanel";
import MapSection      from "../components/sections/MapSection";
import QuickViewModal  from "../components/modals/QuickViewModal";
import AICommandBar    from "../components/filters/AICommandBar";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import InfoStrip        from "../components/sections/InfoStrip";
import HomeNav          from "../components/nav/HomeNav";
import RegionRealWeddings from "../components/sections/RegionRealWeddings";
import "../category.css";

// ── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Default hero fallback ────────────────────────────────────────────────────
const DEFAULT_HERO =
  "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

export default function RegionCategoryPage({
  onBack = () => {},
  onBackHome = () => {},
  onViewVenue = () => {},
  onViewCategory = () => {},
  onViewRegion = () => {},
  onViewRegionCategory = () => {},
  countrySlug = null,
  regionSlug = null,
  categorySlug = null,
  footerNav = {},
}) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [qvItem, setQvItem] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState(null);
  const [activeFilters, setActiveFilters] = useState({
    styles: [],
    prices: [],
    capacities: [],
    locations: [],
  });
  const [venueFilters, setVenueFilters] = useState(() => ({ ...DEFAULT_FILTERS, region: regionSlug }));
  const [sortMode, setSortMode] = useState("recommended");
  const [venueViewMode, setVenueViewMode] = useState("grid");
  const [isMobile, setIsMobile] = useState(false);
  const [hoveredVenueId, setHoveredVenueId] = useState(null);
  const [activePinnedId, setActivePinnedId] = useState(null);

  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Mobile detection ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Register active context with global chat ──────────────────────────────
  const { setChatContext } = useChat();
  useEffect(() => {
    setChatContext({ country: countrySlug, region: regionSlug, category: categorySlug, page: "region-category" });
  }, [setChatContext, countrySlug, regionSlug, categorySlug]);

  // ── Detect user's country for geo-targeted reordering ──────────────────────
  useEffect(() => {
    (async () => {
      const detectedCountry = await getUserCountryFromIP();
      if (detectedCountry) {
        setUserCountryCode(detectedCountry);
      }
    })();
  }, []);

  // ── Data lookups ───────────────────────────────────────────────────────────
  const region = useMemo(() => getRegionBySlug(regionSlug), [regionSlug]);
  const country = useMemo(() => getCountryBySlug(countrySlug), [countrySlug]);
  const vcObj = useMemo(() => getVendorCategoryByGeoSlug(categorySlug), [categorySlug]);
  const categoryLabel = vcObj?.label || categorySlug || "Category";
  const categoryIcon = vcObj?.icon || "📋";

  const regionName = region?.name || regionSlug || "Region";
  const countryName = country?.name || countrySlug || "Country";
  const heroImg = region?.heroImg || DEFAULT_HERO;
  const editorial = useMemo(
    () => getRegionCategoryEditorial(regionSlug, categorySlug),
    [regionSlug, categorySlug],
  );

  // ── Listings — wedding-venues → VENUES, else → VENDORS ───────────────────
  const listings = useMemo(() => {
    if (categorySlug === "wedding-venues") {
      // If region specified, filter by that region
      if (regionSlug) {
        return VENUES.filter(
          (v) => v.region === regionName || (region && v.region === region.name),
        );
      }
      // If country specified but no region (country page), filter by countrySlug
      if (countrySlug) {
        return VENUES.filter((v) => v.countrySlug === countrySlug);
      }
      // No country or region specified (global category page), return all venues
      return VENUES;
    }
    const vendorCats = geoSlugToVendorCategory(categorySlug);
    if (!vendorCats) return [];

    // If region specified, filter by region and category
    if (regionSlug) {
      return VENDORS.filter((v) => {
        const catMatch = vendorCats.includes(v.category);
        // Match by regionSlug first, then fallback to countrySlug
        const regionMatch =
          v.regionSlug === regionSlug ||
          (v.legacyRegionName && region && v.legacyRegionName === region.name);
        return catMatch && regionMatch;
      });
    }

    // If country specified but no region (country page), filter by countrySlug and category
    if (countrySlug) {
      return VENDORS.filter((v) => {
        const catMatch = vendorCats.includes(v.category);
        const countryMatch = v.countrySlug === countrySlug;
        return catMatch && countryMatch;
      });
    }

    // No country or region specified (global category page), return all vendors in category
    return VENDORS.filter((v) => vendorCats.includes(v.category));
  }, [categorySlug, regionSlug, countrySlug, region]);

  // ── Extract available filter values (wedding-venues only) ────────────────────
  const availableFilters = useMemo(() => {
    if (categorySlug !== "wedding-venues") {
      return { styles: [], prices: [], capacities: [], locations: [] };
    }
    const styles = new Set();
    const prices = new Set();
    const capacities = new Set();
    const locations = new Set();

    listings.forEach((v) => {
      // Styles
      if (v.styles && Array.isArray(v.styles)) {
        v.styles.forEach((s) => styles.add(s));
      }
      // Prices (extract from priceFrom field)
      if (v.priceFrom) {
        if (v.priceFrom <= 15000) prices.add("£0–15k");
        if (v.priceFrom > 15000 && v.priceFrom <= 30000) prices.add("£15–30k");
        if (v.priceFrom > 30000) prices.add("£30k+");
      }
      // Capacities
      if (v.capacity) {
        if (v.capacity <= 50) capacities.add("Up to 50");
        if (v.capacity > 50 && v.capacity <= 100) capacities.add("50–100");
        if (v.capacity > 100 && v.capacity <= 200) capacities.add("100–200");
        if (v.capacity > 200) capacities.add("200+");
      }
      // Locations (region/district)
      if (v.region) {
        locations.add(v.region);
      }
    });

    return {
      styles: Array.from(styles).sort(),
      prices: ["£0–15k", "£15–30k", "£30k+"],
      capacities: ["Up to 50", "50–100", "100–200", "200+"],
      locations: Array.from(locations).sort(),
    };
  }, [listings, categorySlug]);

  // ── Apply filters to listings ───────────────────────────────────────────────
  const filteredListings = useMemo(() => {
    if (categorySlug !== "wedding-venues") return listings;

    return listings.filter((v) => {
      // Style filter
      if (activeFilters.styles?.length > 0) {
        const hasStyle = activeFilters.styles.some((s) =>
          v.styles?.includes(s)
        );
        if (!hasStyle) return false;
      }

      // Price filter
      if (activeFilters.prices?.length > 0) {
        let priceMatch = false;
        activeFilters.prices.forEach((priceRange) => {
          if (priceRange === "£0–15k" && v.priceFrom <= 15000) priceMatch = true;
          if (priceRange === "£15–30k" && v.priceFrom > 15000 && v.priceFrom <= 30000) priceMatch = true;
          if (priceRange === "£30k+" && v.priceFrom > 30000) priceMatch = true;
        });
        if (!priceMatch) return false;
      }

      // Capacity filter
      if (activeFilters.capacities?.length > 0) {
        let capacityMatch = false;
        activeFilters.capacities.forEach((capRange) => {
          if (capRange === "Up to 50" && v.capacity <= 50) capacityMatch = true;
          if (capRange === "50–100" && v.capacity > 50 && v.capacity <= 100) capacityMatch = true;
          if (capRange === "100–200" && v.capacity > 100 && v.capacity <= 200) capacityMatch = true;
          if (capRange === "200+" && v.capacity > 200) capacityMatch = true;
        });
        if (!capacityMatch) return false;
      }

      // Location filter
      if (activeFilters.locations?.length > 0) {
        if (!activeFilters.locations.includes(v.region)) return false;
      }

      return true;
    });
  }, [listings, activeFilters, categorySlug]);

  // ── Sort filtered listings by country priority (geo-targeting) ─────────────
  const sortedFilteredListings = useMemo(() => {
    if (!userCountryCode) {
      return filteredListings;
    }
    // For wedding-venues, use countrySlug field; for vendors, use countrySlug too
    return sortByCountryPriority(filteredListings, userCountryCode, "countrySlug");
  }, [filteredListings, userCountryCode]);

  const listingCount = sortedFilteredListings.length;

  // ── Related categories (sibling categories in same region) ────────────────
  const siblingCategories = useMemo(
    () => VENDOR_CATEGORIES.filter((vc) => vc.slug !== categorySlug),
    [categorySlug],
  );

  // ── Related regions (same category in nearby regions) ─────────────────────
  const relatedRegions = useMemo(() => {
    if (!region?.relatedRegionSlugs?.length) return [];
    const allRegions = countrySlug ? getRegionsByCountry(countrySlug) : [];
    return region.relatedRegionSlugs
      .map((slug) => allRegions.find((r) => r.slug === slug))
      .filter(Boolean)
      .slice(0, 4);
  }, [region, countrySlug]);

  // ── Scroll & load-in ──────────────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  const handleVenueFiltersChange = useCallback((f) => setVenueFilters(f), []);

  // ── Search submit → route to CategoryPage ─────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const q = searchInput.trim();
    if (!q) return;
    onViewCategory({
      countrySlug,
      regionSlug,
      searchQuery: q,
    });
  };

  const toggleSave = useCallback(
    (id) =>
      setSavedIds((s) =>
        s.includes(id) ? s.filter((x) => x !== id) : [...s, id],
      ),
    [],
  );

  const searchLabel = countrySlug === "uk" ? "UK Search" : "Search";
  const searchPlaceholder = `Search ${categoryLabel.toLowerCase()} in ${regionName}…`;

  // ── Canonical path for SEO panel ──────────────────────────────────────────
  const canonicalPath = getRegionCategoryPath(countrySlug, regionSlug, categorySlug);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>

        {/* ════════════════════════════════════════════════════════════════════
            1. NAV — main site navigation
        ════════════════════════════════════════════════════════════════════ */}
        <HomeNav
          hasHero={true}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode((d) => !d)}
          onNavigateStandard={() => onBackHome()}
          onNavigateAbout={() => onBackHome()}
        />

        {/* ════════════════════════════════════════════════════════════════════
            2. HERO — 50vh
        ════════════════════════════════════════════════════════════════════ */}
        <section
          aria-label={`${categoryLabel} in ${regionName}`}
          style={{
            position: "relative",
            height: "50vh",
            minHeight: 420,
            overflow: "hidden",
            background: "#0a0806",
          }}
        >
          {/* Background image */}
          <img
            src={heroImg}
            alt={`${categoryLabel} in ${regionName}`}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.5,
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
                "linear-gradient(180deg,rgba(4,3,2,0.45) 0%,rgba(4,3,2,0.25) 40%,rgba(4,3,2,0.8) 100%)",
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

          {/* Hero content */}
          <div
            className="lwd-rc-hero-content"
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "flex-end",
              padding: "0 80px 24px",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "all 0.9s ease",
            }}
          >
            {/* Category label */}
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
                {categoryIcon} {categoryLabel}
              </span>
            </div>

            {/* Title + count badge */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 20, marginBottom: 16, flexWrap: "wrap" }}>
              <h1
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(36px,5vw,62px)",
                  fontWeight: 400,
                  color: "#fff",
                  lineHeight: 1.05,
                  letterSpacing: "-0.5px",
                  margin: 0,
                }}
              >
                {categoryLabel} in{" "}
                <em style={{ fontStyle: "italic", color: "#d1a352" }}>
                  {regionName}
                </em>
              </h1>
            </div>

            {/* Subtitle — first sentence of editorial */}
            <p
              style={{
                fontSize: 16,
                color: "rgba(255,255,255,0.65)",
                fontFamily: NU,
                fontWeight: 300,
                lineHeight: 1.6,
                maxWidth: 560,
                marginBottom: 32,
              }}
            >
              {editorial.split(". ")[0]}.
            </p>

            {/* Stats row */}
            <div
              className="lwd-rc-hero-stats"
              style={{ display: "flex", gap: 32, alignItems: "center" }}
              aria-label="Key statistics"
            >
              {[
                { val: listingCount > 0 ? listingCount : "—", label: categorySlug === "wedding-venues" ? "Curated Venues" : "Curated Listings" },
                { val: regionName, label: "Region", isText: true },
                {
                  val: listingCount > 0 ? "100%" : "Coming Soon",
                  label: listingCount > 0 ? "Personally Verified" : "Listings",
                  soft: listingCount === 0,
                },
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
                      fontFamily: s.isText ? NU : GD,
                      fontSize: s.soft ? 18 : s.isText ? 16 : 28,
                      fontWeight: s.soft ? 300 : s.isText ? 600 : 600,
                      color: s.soft ? "rgba(255,255,255,0.45)" : "#C9A84C",
                      lineHeight: 1,
                      opacity: s.soft ? 0.6 : 1,
                    }}
                  >
                    {s.val}
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

            {/* Breadcrumb trail */}
            <nav
              aria-label="Breadcrumb"
              style={{
                marginTop: 48,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: "0.5px",
                fontFamily: NU,
              }}
            >
              <button
                onClick={onBackHome}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                  padding: 0,
                  fontFamily: NU,
                  letterSpacing: "0.5px",
                }}
              >
                Home
              </button>
              <span style={{ opacity: 0.4 }}>›</span>
              <span>{countryName}</span>
              <span style={{ opacity: 0.4 }}>›</span>
              <button
                onClick={onBack}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 11,
                  color: "rgba(255,255,255,0.45)",
                  padding: 0,
                  fontFamily: NU,
                  letterSpacing: "0.5px",
                }}
              >
                {regionName}
              </button>
              <span style={{ opacity: 0.4 }}>›</span>
              <span style={{ color: "rgba(201,168,76,0.9)", fontWeight: 600 }}>
                {categoryLabel}
              </span>
            </nav>
          </div>
        </section>



        {/* ════════════════════════════════════════════════════════════════════
            4. EDITORIAL INTRO — PLANNERS PAGE PATTERN
        ════════════════════════════════════════════════════════════════════ */}
        <section
          className="lwd-rc-section"
          aria-label="Editorial introduction"
          style={{
            background: C.dark,
            padding: isMobile ? "40px 16px" : "56px 32px",
          }}
        >
          <div
            style={{
              maxWidth: 1200,
              margin: "0 auto",
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
              gap: isMobile ? 28 : 48,
              alignItems: "start",
            }}
          >
            {/* LEFT: Editorial Copy */}
            <div>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color: C.gold,
                  marginBottom: 12,
                }}
              >
                Editorial {categorySlug === "wedding-venues" ? "Guide" : ""}
              </div>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: 32,
                  fontWeight: 400,
                  color: C.white,
                  lineHeight: 1.2,
                  margin: "0 0 20px",
                }}
              >
                {categoryLabel} in {regionName}
              </h2>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.grey,
                  lineHeight: 1.7,
                  margin: "0 0 16px",
                  maxWidth: 600,
                }}
              >
                {editorial}
              </p>
            </div>

            {/* RIGHT: Trust Cards (for wedding-venues only) */}
            {categorySlug === "wedding-venues" && (
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { icon: "✦", title: "Personally Verified", desc: "Every venue hand-selected by our editorial team" },
                  { icon: "◈", title: "No Pay-to-Play", desc: "Ranked by quality and couple reviews" },
                  { icon: "✓", title: "Authentic Photos", desc: "Real weddings, real venues, no stock images" },
                ].map((t) => (
                  <div
                    key={t.title}
                    style={{
                      background: C.card,
                      border: `1px solid ${C.border}`,
                      borderRadius: "var(--lwd-radius-card)",
                      padding: "16px 18px",
                      display: "flex",
                      alignItems: "flex-start",
                      gap: 14,
                    }}
                  >
                    <span style={{ fontSize: 18, color: C.gold, flexShrink: 0, marginTop: 1 }}>{t.icon}</span>
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 }}>
                        {t.title}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.5 }}>
                        {t.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ════════════════════════════════════════════════════════════════════
            5. FEATURED VENUES SECTION (Wedding Venues Only)
        ════════════════════════════════════════════════════════════════════ */}
        {listingCount > 0 && categorySlug === "wedding-venues" && sortedFilteredListings.filter((v) => v.featured).length > 0 && (
          <section
            className="lwd-rc-section"
            style={{
              background: "#000",
              padding: isMobile ? "40px 16px" : "56px 32px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 1280, margin: "0 auto" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
                <span style={{ fontFamily: NU, fontSize: 11, letterSpacing: "0.25em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>
                  ★ Editor's Selection
                </span>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 16 }}>
                {sortedFilteredListings.filter((v) => v.featured).slice(0, 3).map((v) => (
                  <LuxuryVenueCard key={v.id} v={v} onView={() => onViewVenue(v.id || v.slug)} quickViewItem={qvItem} setQuickViewItem={setQvItem} />
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            6. REAL WEDDINGS SECTION (Wedding Venues Only)
        ════════════════════════════════════════════════════════════════════ */}
        {listingCount > 0 && categorySlug === "wedding-venues" && (
          <section
            className="lwd-rc-section"
            style={{
              background: C.light || "#F2EFE9",
              padding: isMobile ? "40px 16px 48px" : "56px 32px 64px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 1200, margin: "0 auto" }}>
              <RegionRealWeddings region={regionSlug} country={countrySlug} />
            </div>
          </section>
        )}

        {/* ════════════════════════════════════════════════════════════════════
            7. FILTER & SEARCH SECTION
        ════════════════════════════════════════════════════════════════════ */}
        {listingCount > 0 ? (
          <>
            {/* ═══ AI COMMAND BAR + FILTER BAR — same as RegionPage ═══ */}
            <AICommandBar
              countrySlug={countrySlug}
              countryName={countryName}
              regionSlug={regionSlug}
              regionName={regionName}
              categorySlug={categorySlug}
              entityType="venue"
              availableRegions={availableFilters.locations.map(l => ({ name: l, slug: l.toLowerCase().replace(/\s+/g, "-") }))}
              filters={venueFilters}
              onFiltersChange={handleVenueFiltersChange}
              defaultFilters={DEFAULT_FILTERS}
            />
            <CountrySearchBar
              filters={venueFilters}
              onFiltersChange={handleVenueFiltersChange}
              viewMode={venueViewMode}
              onViewMode={setVenueViewMode}
              sortMode={sortMode}
              onSortChange={setSortMode}
              total={listingCount}
              regions={[{ name: regionName, slug: regionSlug }]}
              countryFilter={countryName}
              mapContent={
                venueViewMode === "map" ? (
                  <MapSection
                    venues={filteredListings}
                    vendors={[]}
                    headerLabel={`${listingCount} ${categoryLabel} in ${regionName}`}
                    mapTitle={`◎ ${regionName} ${categoryLabel}`}
                    countryFilter={countryName || "England"}
                    onMarkerClick={(slug) => onViewVenue(slug)}
                    onClose={() => setVenueViewMode("grid")}
                  />
                ) : null
              }
            />
            <InfoStrip
              availableRegions={[{ name: regionName, slug: regionSlug }]}
              filters={venueFilters}
              onFiltersChange={handleVenueFiltersChange}
              defaultFilters={DEFAULT_FILTERS}
            />

            {/* ════════════════════════════════════════════════════════════════════
                8. LISTINGS GRID / LIST+MAP VIEW
            ════════════════════════════════════════════════════════════════════ */}
            <section
              className="lwd-rc-section"
              aria-label={`${categoryLabel} listings`}
              style={{
                background: C.dark,
                padding: venueViewMode === "list" && !isMobile
                  ? "40px 0 72px 48px"
                  : "40px 48px 72px",
                borderBottom: `1px solid ${C.border}`,
              }}
            >
              <div style={{ maxWidth: venueViewMode === "list" ? "none" : 1280, margin: "0 auto" }}>

              {categorySlug === "wedding-venues" ? (
                venueViewMode === "grid" ? (
                  <div
                    className="lwd-venue-grid"
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(3,1fr)",
                      gap: 16,
                    }}
                    aria-label="Venue grid"
                  >
                    {sortedFilteredListings.filter((v) => !v.featured).map((v) => (
                      <LuxuryVenueCard
                        key={v.id}
                        v={v}
                        onView={() => onViewVenue(v.id || v.slug)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    ))}
                  </div>
                ) : (
                  <>
                    {/* Mobile: Show Map button */}
                    {isMobile && (
                      <div style={{ marginBottom: 20 }}>
                        <button
                          onClick={() => setMapOpen(true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                            background: "rgba(201,168,76,0.08)",
                            border: "1px solid rgba(201,168,76,0.3)",
                            borderRadius: "var(--lwd-radius-input)",
                            padding: "9px 18px",
                            fontFamily: NU,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.5px",
                            color: "#C9A84C",
                            cursor: "pointer",
                          }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                            <line x1="9" y1="3" x2="9" y2="18" />
                            <line x1="15" y1="6" x2="15" y2="21" />
                          </svg>
                          Show Map
                        </button>
                      </div>
                    )}

                    {/* List + Map Layout — mirrors WeddingPlannersPage pattern */}
                    <div style={{
                      ...(isMobile
                        ? { display: "flex", flexDirection: "column", gap: 12 }
                        : {
                            display:             "grid",
                            gridTemplateColumns: "minmax(0, 1fr) clamp(360px, 32vw, 480px)",
                            columnGap:           32,
                            alignItems:          "start",
                            minWidth:            0,
                          }
                      ),
                    }}>
                      {/* Left: venue list */}
                      <div style={{
                        minWidth:      0,
                        display:       "flex",
                        flexDirection: "column",
                        gap:           12,
                        paddingLeft:   155,
                      }}>
                        {sortedFilteredListings.filter((v) => !v.featured).map((v) => (
                          <div
                            key={v.id}
                            data-venue-id={v.id}
                            onMouseEnter={() => setHoveredVenueId(v.id)}
                            onMouseLeave={() => setHoveredVenueId(null)}
                          >
                            <VenueListItemCard
                              v={v}
                              onView={() => onViewVenue(v.id || v.slug)}
                              isHighlighted={hoveredVenueId === v.id || activePinnedId === v.id}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Right: sticky map panel — flush to viewport right edge */}
                      {!isMobile && (
                        <div style={{
                          width:    "100%",
                          minWidth: 0,
                          position: "sticky",
                          top:      72,
                          height:   "calc(100vh - 120px)",
                          borderRadius: "var(--lwd-radius-card) 0 0 var(--lwd-radius-card)",
                          overflow: "hidden",
                        }}>
                          <VenueMapPanel
                            venues={sortedFilteredListings.filter((v) => !v.featured)}
                            hoveredId={hoveredVenueId}
                            activePinnedId={activePinnedId}
                            onPinHover={setHoveredVenueId}
                            onPinLeave={() => setHoveredVenueId(null)}
                            onPinClick={(id) => {
                              setActivePinnedId(id);
                              const el = document.querySelector(`[data-venue-id="${id}"]`);
                              if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                            }}
                            onToggleView={() => setVenueViewMode("grid")}
                            label={`Venue Map · ${regionName || "All Regions"}`}
                          />
                        </div>
                      )}
                    </div>

                    {/* Mobile Map Modal */}
                    {isMobile && mapOpen && (
                      <div
                        style={{
                          position: "fixed",
                          inset: 0,
                          background: "rgba(0,0,0,0.5)",
                          display: "flex",
                          alignItems: "flex-end",
                          zIndex: 1000,
                        }}
                        onClick={() => setMapOpen(false)}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "80vh",
                            background: C.dark,
                            borderRadius: "16px 16px 0 0",
                            overflow: "hidden",
                            display: "flex",
                            flexDirection: "column",
                          }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            style={{
                              padding: "12px 16px",
                              borderBottom: `1px solid ${C.border}`,
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "center",
                            }}
                          >
                            <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: C.white }}>
                              Map
                            </span>
                            <button
                              onClick={() => setMapOpen(false)}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: 20,
                                cursor: "pointer",
                                color: C.grey,
                              }}
                            >
                              ×
                            </button>
                          </div>
                          <div style={{ flex: 1, overflow: "hidden" }}>
                            <MapSection
                              venues={sortedFilteredListings.filter((v) => !v.featured)}
                              vendors={[]}
                              headerLabel={`${listingCount} ${categoryLabel}`}
                              mapTitle={`◎ ${categoryLabel}`}
                              countryFilter={countryName || "Italy"}
                              onMarkerClick={(slug) => onViewVenue(slug)}
                              onClose={() => setMapOpen(false)}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )
              ) : (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                    gap: 24,
                  }}
                >
                  {sortedFilteredListings.map((item) => (
                    <ListingCard
                      key={item.id}
                      item={item}
                      C={C}
                      isVenue={false}
                    />
                  ))}
                </div>
              )}
            </div>
            </section>
          </>
        ) : (
          /* ── Premium "Coming Soon" editorial state ── */
          <section
            className="lwd-rc-section"
            aria-label="Coming soon"
            style={{
              background: C.dark,
              padding: "96px 48px",
              borderBottom: `1px solid ${C.border}`,
            }}
          >
            <div style={{ maxWidth: 600, margin: "0 auto", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 28 }}>
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
                  fontStyle: "italic",
                  color: C.off,
                  lineHeight: 1.2,
                  marginBottom: 20,
                }}
              >
                {categoryLabel} in {regionName}
              </h2>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.grey,
                  lineHeight: 1.8,
                  fontWeight: 300,
                  marginBottom: 36,
                }}
              >
                Our editorial team is personally vetting {categoryLabel.toLowerCase()} in {regionName}.
                Premium listings are arriving soon — every recommendation is editorially
                verified, never pay-to-play.
              </p>
              <BrowseAllButton
                C={C}
                label={`Browse All ${categoryLabel}`}
                onClick={() => onViewCategory({ countrySlug, regionSlug })}
              />
            </div>
          </section>
        )}






        {/* ════════════════════════════════════════════════════════════════════
            7. WEDDING VENDORS — carousel (same as RegionPage)
        ════════════════════════════════════════════════════════════════════ */}
        <section
          className="lwd-rc-section"
          aria-label="Wedding vendors"
          style={{
            background: C.dark,
            padding: "96px 120px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
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
                margin: "0 0 32px",
              }}
            >
              {regionName}{" "}
              <span style={{ fontStyle: "italic", color: C.gold }}>Wedding Vendors</span>
            </h2>
            <VendorCategoryCarousel
              categories={VENDOR_CATEGORIES}
              C={C}
              onSelect={(slug) => onViewRegionCategory(countrySlug, regionSlug, slug)}
            />
          </div>
        </section>


        {/* Related Regions — removed per user request */}


        {/* ════════════════════════════════════════════════════════════════════
            9. SEO PANEL — collapsible (dev only)
        ════════════════════════════════════════════════════════════════════ */}
        {false && (
        <section
          className="lwd-rc-section"
          aria-label="SEO data"
          style={{
            background: C.black,
            padding: "48px 48px",
            borderBottom: `1px solid ${C.border}`,
          }}
        >
          <div style={{ maxWidth: 800, margin: "0 auto" }}>
            <button
              onClick={() => setSeoExpanded((e) => !e)}
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
                SEO & Canonical Data
              </span>
              <div style={{ width: 28, height: 1, background: C.gold }} />
              <span
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.grey,
                  marginLeft: "auto",
                  transition: "transform 0.2s",
                  transform: seoExpanded ? "rotate(180deg)" : "rotate(0deg)",
                }}
              >
                ▾
              </span>
            </button>

            {seoExpanded && (
              <div style={{ marginTop: 32 }}>
                <div style={{ marginBottom: 24 }}>
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
                    Canonical Path
                  </h3>
                  <code
                    style={{
                      fontSize: 13,
                      color: C.gold,
                      fontFamily: "monospace",
                      background: C.card,
                      padding: "8px 16px",
                      borderRadius: "var(--lwd-radius-input)",
                      display: "inline-block",
                    }}
                  >
                    {canonicalPath}
                  </code>
                </div>

                <div style={{ marginBottom: 24 }}>
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
                    Page Title
                  </h3>
                  <div style={{ fontSize: 13, color: C.grey, fontFamily: NU, lineHeight: 1.7 }}>
                    {categoryLabel} in {regionName} — Luxury Wedding Directory
                  </div>
                </div>

                <div style={{ marginBottom: 24 }}>
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
                    Meta Description
                  </h3>
                  <div style={{ fontSize: 13, color: C.grey, fontFamily: NU, lineHeight: 1.7 }}>
                    Discover {listingCount > 0 ? listingCount : "the finest"} curated {categoryLabel.toLowerCase()} in {regionName}. Every recommendation editorially verified by the LWD team.
                  </div>
                </div>

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
                    Entity Data
                  </h3>
                  <div style={{ fontSize: 12, color: C.grey, fontFamily: "monospace", lineHeight: 1.8 }}>
                    <div>country: <span style={{ color: C.gold }}>{countrySlug}</span></div>
                    <div>region: <span style={{ color: C.gold }}>{regionSlug}</span></div>
                    <div>category: <span style={{ color: C.gold }}>{categorySlug}</span></div>
                    <div>listings: <span style={{ color: C.gold }}>{listingCount}</span></div>
                    <div>relatedRegions: <span style={{ color: C.gold }}>{relatedRegions.length}</span></div>
                    <div>siblingCategories: <span style={{ color: C.gold }}>{siblingCategories.length}</span></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
        )}


        {/* ════════════════════════════════════════════════════════════════════
            10. BROWSE BY REGION
        ════════════════════════════════════════════════════════════════════ */}
        <DirectoryBrands onViewRegion={onViewRegion} onViewCategory={onViewCategory} showInternational={false} showUK={countrySlug !== "italy" && countrySlug !== "usa"} showItaly={countrySlug === "italy"} showUSA={countrySlug === "usa"} />


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


// ═════════════════════════════════════════════════════════════════════════════
// SUB-COMPONENTS — local to this file
// ═════════════════════════════════════════════════════════════════════════════


// ── Nav ────────────────────────────────────────────────────────────────────
function RegionCategoryNav({ onBack, onBackHome, scrolled, darkMode, onToggleDark, C, countryName, regionName, categoryLabel, countrySlug, regionSlug }) {
  const [hovBack, setHovBack] = useState(false);
  const [hovHome, setHovHome] = useState(false);
  const [hovRegion, setHovRegion] = useState(false);
  const [hovToggle, setHovToggle] = useState(false);

  const ghostBorder = scrolled ? C.border2 : "rgba(255,255,255,0.25)";
  const ghostColor = scrolled ? C.grey : "rgba(255,255,255,0.7)";

  return (
    <nav
      className="lwd-rc-nav"
      aria-label="Page navigation"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        padding: scrolled ? "12px 48px" : "18px 48px",
        background: scrolled
          ? darkMode ? "rgba(8,8,8,0.97)" : "rgba(250,248,245,0.97)"
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
          aria-label="Go back to region"
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

      </div>

      {/* Centre: logo */}
      <button
        className="lwd-rc-logo"
        onClick={onBackHome}
        aria-label="Luxury Wedding Directory home"
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

      {/* Right: theme toggle */}
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
      </div>
    </nav>
  );
}


// ── Listing Card — works for both venues and vendors ─────────────────────
function ListingCard({ item, C, isVenue, onView }) {
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
        cursor: isVenue ? "pointer" : "default",
        transition: "all 0.25s",
      }}
      onClick={() => isVenue && onView?.(item)}
    >
      <div style={{ position: "relative", height: 200, overflow: "hidden" }}>
        <img
          src={item.imgs?.[0]}
          alt={item.name}
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
        {item.tag && (
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
            {item.tag}
          </span>
        )}
        {item.verified && (
          <span
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              background: "rgba(255,255,255,0.12)",
              color: "#C9A84C",
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              padding: "4px 10px",
              borderRadius: "var(--lwd-radius-input)",
              fontFamily: NU,
              backdropFilter: "blur(4px)",
            }}
          >
            ✓ Verified
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
          {item.name}
        </h3>
        <div
          style={{
            fontSize: 12,
            color: C.grey,
            fontFamily: NU,
            marginBottom: 8,
          }}
        >
          {item.city}{item.city && item.region ? ", " : ""}{item.region}
        </div>
        {item.desc && (
          <p
            style={{
              fontFamily: NU,
              fontSize: 13,
              color: C.grey,
              lineHeight: 1.65,
              fontWeight: 300,
              marginBottom: 12,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {item.desc}
          </p>
        )}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, color: C.gold, fontWeight: 700, fontFamily: NU }}>
            {item.rating} ★
          </span>
          {item.reviews > 0 && (
            <span style={{ fontSize: 11, color: C.grey, fontFamily: NU }}>
              ({item.reviews} reviews)
            </span>
          )}
          <span style={{ fontSize: 11, color: C.grey, fontFamily: NU, marginLeft: "auto" }}>
            From {item.priceFrom}
          </span>
        </div>
      </div>
    </article>
  );
}


// ── Luxury SVG icons for category cards ──────────────────────────────────────
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

// ── Sibling Category Card ──────────────────────────────────────────────────
function SiblingCategoryCard({ vc, C, onClick }) {
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
        transition: "all 0.3s ease",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        flexShrink: 0,
        minWidth: "calc((100% - 55px) / 5.5)",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: hov ? C.goldDim : "transparent",
          border: `1px solid ${hov ? C.gold : C.border2}`,
          transition: "all 0.3s ease",
        }}
      >
        {renderIcon ? renderIcon(iconColor) : (
          <span style={{ fontSize: 22, opacity: 0.6 }}>{vc.icon}</span>
        )}
      </span>
      <span
        style={{
          fontFamily: NU,
          fontSize: 11,
          fontWeight: 600,
          letterSpacing: "1px",
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


// ── Vendor Category Carousel (matches RegionPage) ───────────────────────
const VENDOR_CATS_PER_PAGE = 6;

function VendorCategoryCarousel({ categories, C, onSelect }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(categories.length / VENDOR_CATS_PER_PAGE);
  const start = page * VENDOR_CATS_PER_PAGE;
  const visible = categories.slice(start, start + VENDOR_CATS_PER_PAGE);

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
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(6, 1fr)",
          gap: 16,
        }}
      >
        {visible.map((vc) => (
          <VendorCategoryCard
            key={vc.slug}
            vc={vc}
            C={C}
            onClick={() => onSelect(vc.slug)}
          />
        ))}
      </div>

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

function VendorCategoryCard({ vc, C, onClick }) {
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
        padding: "28px 12px",
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.25s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        minWidth: 0,
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
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {renderIcon ? renderIcon(iconColor) : <span style={{ fontSize: 22, opacity: 0.6 }}>{vc.icon}</span>}
      </span>
      <span
        style={{
          fontFamily: NU,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: hov ? C.gold : C.off,
          transition: "color 0.2s",
          lineHeight: 1.4,
          wordBreak: "break-word",
          textAlign: "center",
        }}
      >
        {vc.label}
      </span>
    </button>
  );
}


// ── Related Region Card ──────────────────────────────────────────────────
function RelatedRegionCard({ region, categoryLabel, C, onClick }) {
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
        flexShrink: 0,
        minWidth: 260,
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
        {categoryLabel} · {region.group || ""}
      </div>
    </button>
  );
}


// ── Search Button ──────────────────────────────────────────────────────────
function SearchButton({ C }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      type="submit"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? "linear-gradient(135deg,#C9A84C,#9b7a1a)" : `linear-gradient(135deg,${C.gold},${C.gold2 || "#e8c97a"})`,
        border: "none",
        borderRadius: "var(--lwd-radius-input)",
        color: "#0f0d0a",
        padding: "14px 28px",
        fontSize: 11,
        fontWeight: 800,
        letterSpacing: "2px",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.2s",
        whiteSpace: "nowrap",
      }}
    >
      Search →
    </button>
  );
}


// ── Browse All Button ─────────────────────────────────────────────────────
function BrowseAllButton({ C, label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? C.gold : "none",
        border: `1px solid ${C.gold}`,
        borderRadius: "var(--lwd-radius-input)",
        color: hov ? "#0f0d0a" : C.gold,
        padding: "13px 36px",
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: "2px",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "all 0.25s",
      }}
    >
      {label} →
    </button>
  );
}
