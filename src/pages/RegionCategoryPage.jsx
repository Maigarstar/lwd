// ─── src/pages/RegionCategoryPage.jsx ──────────────────────────────────────────
// Editorial intent page for every Region × Category combination.
// e.g. /uk/london/wedding-venues  /italy/tuscany/photographers
// Data-driven: one template, many region×category combos.
// Phase 1: adopts useDirectoryState + transformListing (shared platform logic).
import { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeCtx, useTheme } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, DARK_C } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";
import { normalizeStyle } from "../constants/styleMap";

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
import { fetchListings } from "../services/listings";

// ── Phase 1: shared directory state + transform ───────────────────────────────
import { useDirectoryState, applyDirectoryFilters, applyDirectorySort } from "../hooks/useDirectoryState";
import { transformListing, transformListings, mergeListings } from "../utils/transformListing";
import { DEFAULT_FILTERS } from "../data/italyVenues"; // Phase 2: remove when MasterFilterBar replaces CountrySearchBar

import SiteFooter from "../components/sections/SiteFooter";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import EmptyResultState from "../components/sections/EmptyResultState";
import NearMatchSection from "../components/sections/NearMatchSection";
import ImmersiveSearch from "../components/search/ImmersiveSearch";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import VenueListItemCard from "../components/cards/VenueListItemCard";
import MASTERMap        from "../components/maps/MASTERMap";
import { PinSyncBus }  from "../components/maps/PinSyncBus";
import QuickViewModal  from "../components/modals/QuickViewModal";
import AICommandBar    from "../components/filters/AICommandBar";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import InfoStrip        from "../components/sections/InfoStrip";
import HomeNav          from "../components/nav/HomeNav";
import RegionRealWeddings from "../components/sections/RegionRealWeddings";
import MasterCategoryCard from "../components/cards/MasterCategoryCard";
import "../category.css";

// ── Build a human-readable Aura summary from immersive refinement fields ─────
function buildImmersiveSummary(ref, categoryLabel, regionName, countryName) {
  const parts = [];
  if (ref.style) parts.push(ref.style);
  parts.push(categoryLabel.toLowerCase());
  const loc = (regionName && regionName !== countryName) ? regionName : countryName;
  if (loc) parts.push(`in ${loc}`);
  const gMap = {
    "Just us":  "for an intimate elopement",
    "Up to 50": "for up to 50 guests",
    "50–100":   "for 50–100 guests",
    "100–200":  "for 100–200 guests",
    "200+":     "for over 200 guests",
  };
  if (ref.guests && gMap[ref.guests]) parts.push(gMap[ref.guests]);
  if (ref.setting && !["Both","Any Season","Standard","Flexible"].includes(ref.setting))
    parts.push(`with an ${ref.setting.toLowerCase()} setting`);
  if (parts.length <= 1) return null;
  const s = parts.join(" ");
  return s.charAt(0).toUpperCase() + s.slice(1) + ".";
}

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
  onViewCountry = () => {},
  countrySlug = null,
  regionSlug = null,
  categorySlug = null,
  footerNav = {},
}) {
  // ── Theme (global, persisted) ─────────────────────────────────────────────
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;

  // ── State ──────────────────────────────────────────────────────────────────
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [seoExpanded, setSeoExpanded] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [qvItem, setQvItem] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [userCountryCode, setUserCountryCode] = useState(null);
  const [dbListings, setDbListings] = useState([]);
  const [listingsLoaded, setListingsLoaded] = useState(false);
  const [auraSummary,         setAuraSummary]         = useState(null);
  const [summaryDismissed,    setSummaryDismissed]    = useState(false);
  const [auraMapFilter,       setAuraMapFilter]       = useState(null);
  const [auraCrossNav,        setAuraCrossNav]        = useState(null);
  const [auraRecommendedIds,  setAuraRecommendedIds]  = useState(null);
  const [sparseZoneAlert,     setSparseZoneAlert]     = useState(null);

  // ── Phase 1: shared directory state (replaces viewMode/mapOn/isMobile/activeListingId) ──
  const {
    filters,
    updateFilters,
    viewMode,
    setViewMode,
    mapOn,
    toggleMap:       handleToggleMap,
    setMapOn,
    mapTransitioning,
    activeListingId,
    setActiveListingId,
    isMobile,
  } = useDirectoryState({
    initialFilters: {
      region:   regionSlug   || null,
      country:  countrySlug  || null,
      category: categorySlug || null,
    },
  });

  // ── Legacy filter shim — CountrySearchBar still drives venueFilters shape ──
  // Phase 2 will replace CountrySearchBar with MasterFilterBar.
  // For now, keep venueFilters in sync with the shared filters object.
  const venueFilters = useMemo(() => ({
    region:   filters.region   || regionSlug || "all",
    style:    filters.styles?.[0] || "All Styles",
    capacity: filters.capacity || "All Capacities",
    price:    filters.priceFrom ? `£${filters.priceFrom}+` : "All Prices",
  }), [filters, regionSlug]);

  const setVenueFilters = useCallback((f) => {
    // Normalize UI style label to canonical data values
    const normalizedStyles = f.style && f.style !== "All Styles"
      ? normalizeStyle(f.style)
      : [];

    updateFilters({
      region:    f.region   !== "all" ? f.region   : null,
      styles:    normalizedStyles,
      capacity:  f.capacity && f.capacity !== "All Capacities"  ? f.capacity   : null,
    });
  }, [updateFilters]);

  const sortMode    = filters.sort || "recommended";
  const setSortMode = useCallback((s) => updateFilters({ sort: s }), [updateFilters]);

  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Apply immersive refinement filters on mount ───────────────────────────
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("lwd:immersive-refinement");
      if (!raw) return;
      sessionStorage.removeItem("lwd:immersive-refinement");
      const ref = JSON.parse(raw);
      // Map refinement → venueFilters shape
      const styleMap = {
        "Romantic": "Romantic", "Historic": "Historic", "Rustic Luxe": "Rustic Luxe",
        "Coastal": "Coastal", "Vineyard": "Vineyard", "Intimate": "Intimate", "Modern": null,
      };
      const capacityMap = {
        "Just us": "Up to 50", "Up to 50": "Up to 50",
        "50–100": "51–100", "100–200": "101–200", "200+": "200+",
      };
      const priceMap = { "Mid-range £££": "£££", "Luxury ££££": "££££" };
      const next = { ...DEFAULT_FILTERS, region: regionSlug || "all" };
      if (ref.style    && styleMap[ref.style])    next.style    = styleMap[ref.style];
      if (ref.guests   && capacityMap[ref.guests]) next.capacity = capacityMap[ref.guests];
      if (ref.budget   && priceMap[ref.budget])    next.price    = priceMap[ref.budget];
      setVenueFilters(next);
      // Build concierge summary banner text
      const summary = buildImmersiveSummary(ref, categoryLabel, regionName, countryName);
      if (summary) { setAuraSummary(summary); setSummaryDismissed(false); }
    } catch (_) { /* ignore */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── View mode handler (wraps shared setViewMode) ─────────────────────────
  const handleViewMode = useCallback((mode) => setViewMode(mode), [setViewMode]);

  // ── Fetch live Supabase listings for this region/country ──────────────────
  useEffect(() => {
    const filters = { status: "published" };
    if (regionSlug) filters.region_slug = regionSlug;
    else if (countrySlug) filters.country_slug = countrySlug;
    fetchListings(filters)
      .then((rows) => { setDbListings(rows || []); setListingsLoaded(true); })
      .catch(() => setListingsLoaded(true));
  }, [regionSlug, countrySlug]);

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
  const region = useMemo(() => {
    const r = getRegionBySlug(regionSlug);
    // If getRegionBySlug falls back to the ALL_REGIONS_SENTINEL (slug="all"),
    // treat as unknown region so we still display a clean name from the slug.
    if (!r || r.slug === "all") return null;
    return r;
  }, [regionSlug]);
  const country = useMemo(() => getCountryBySlug(countrySlug), [countrySlug]);
  const vcObj = useMemo(() => getVendorCategoryByGeoSlug(categorySlug), [categorySlug]);
  const categoryLabel = vcObj?.label || categorySlug || "Category";
  const categoryIcon = vcObj?.icon || "📋";

  const countryName = country?.name || "";
  const regionName = region?.name ||
    (regionSlug ? regionSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ") : countryName);
  const heroImg = region?.heroImg || DEFAULT_HERO;
  const editorial = useMemo(
    () => getRegionCategoryEditorial(regionSlug, categorySlug),
    [regionSlug, categorySlug],
  );

  // ── Listings — wedding-venues → VENUES (+ DB), else → VENDORS ───────────
  const listings = useMemo(() => {
    if (categorySlug === "wedding-venues") {
      // Transform DB rows via shared utility
      const dbVenues = transformListings(dbListings, { type: "venue", category: "wedding-venues" });

      // Static venues matching this region/country
      let staticVenues;
      if (regionSlug) {
        staticVenues = VENUES.filter(
          (v) => v.region === regionName || (region && v.region === region.name),
        );
      } else if (countrySlug) {
        staticVenues = VENUES.filter((v) => v.countrySlug === countrySlug);
      } else {
        staticVenues = VENUES;
      }

      // Merge: DB first, deduplicate by name
      return mergeListings(dbVenues, staticVenues);
    }

    const vendorCats = geoSlugToVendorCategory(categorySlug);
    if (!vendorCats) return [];

    // If region specified, filter by region and category
    if (regionSlug) {
      return VENDORS.filter((v) => {
        const catMatch = vendorCats.includes(v.category);
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
  }, [categorySlug, regionSlug, countrySlug, region, regionName, dbListings]);

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
  // ── Filter + sort via shared utilities ────────────────────────────────────
  const filteredListings = useMemo(
    () => applyDirectoryFilters(listings, filters),
    [listings, filters],
  );

  const sortedFilteredListings = useMemo(() => {
    const sorted = applyDirectorySort(filteredListings, filters.sort);
    if (!userCountryCode) return sorted;
    return sortByCountryPriority(sorted, userCountryCode, "countrySlug");
  }, [filteredListings, filters.sort, userCountryCode]);

  const listingCount = sortedFilteredListings.length;

  // ── Related categories (sibling categories in same region) ────────────────
  const siblingCategories = useMemo(
    () => VENDOR_CATEGORIES.filter((vc) => vc.slug !== categorySlug),
    [categorySlug],
  );

  // ── Alternative categories (for empty/low result UX) ──────────────────────
  // Compute result counts for all categories to suggest when current is empty
  const alternativeCategories = useMemo(() => {
    const alternatives = [];
    VENDOR_CATEGORIES.forEach((vc) => {
      if (vc.slug === categorySlug) return; // Skip current category

      // Apply same filters but with this category
      const categoryListings = listings.filter((v) => {
        const catMatch = !filters.category || v.category === filters.category || vc.slug === "wedding-venues";
        const regionMatch = !filters.region || v.region === filters.region || v.regionSlug === filters.region;
        return catMatch && regionMatch;
      });

      if (categoryListings.length > 0) {
        alternatives.push({
          category: vc.label,
          slug: vc.slug,
          count: categoryListings.length,
        });
      }
    });

    // Sort by count descending, take top 6
    return alternatives.sort((a, b) => b.count - a.count).slice(0, 6);
  }, [listings, filters.category, filters.region, categorySlug]);

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

  const handleVenueFiltersChange = useCallback((f) => setVenueFilters(f), [setVenueFilters]);

  // ── Handle alternative category selection from empty result state ─────────
  const handleSelectAlternative = useCallback((altSlug) => {
    const path = getRegionCategoryPath(countrySlug || "italy", regionSlug || "all", altSlug);
    // Navigate to the new category
    if (onViewRegionCategory) {
      onViewRegionCategory(countrySlug || "italy", regionSlug || "all", altSlug);
    }
  }, [countrySlug, regionSlug, onViewRegionCategory]);

  // ── Sparse zone detection: < 3 pins visible for active category ────────────
  const handleSparsePins = useCallback((data) => {
    const { category, count } = data;
    if (count < 3) {
      // Find best nearby region suggestion (prefer regions with more listings)
      let nearbyRegionUrl = null;
      let nearbyRegionName = null;

      if (relatedRegions && relatedRegions.length > 0) {
        // Suggest the first related region (sorted by relevance in geo data)
        const suggestedRegion = relatedRegions[0];
        if (suggestedRegion) {
          nearbyRegionName = suggestedRegion.name;
          nearbyRegionUrl = getRegionCategoryPath(countrySlug, suggestedRegion.slug, category);
        }
      }

      const categoryLabel = category === "wedding-venues" ? "venue" : category.replace(/-/g, " ");
      const nearbyText = nearbyRegionName ? ` Try <strong>${nearbyRegionName}</strong> nearby.` : " Try nearby regions for more options.";

      setSparseZoneAlert({
        category,
        count,
        nearbyRegionUrl,
        nearbyRegionName,
        message: `Only ${count} ${categoryLabel}${count !== 1 ? "s" : ""} here.${nearbyText}`,
      });
    } else {
      setSparseZoneAlert(null);
    }
  }, [relatedRegions, categorySlug, countrySlug]);

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
  const searchPlaceholder = `Search ${categoryLabel.toLowerCase()}${regionName ? ` in ${regionName}` : ""}…`;

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
          onToggleDark={themeCtx.toggleDark}
          onNavigateStandard={() => onBackHome()}
          onNavigateAbout={() => onBackHome()}
        />

        {/* ════════════════════════════════════════════════════════════════════
            2. HERO — 50vh
        ════════════════════════════════════════════════════════════════════ */}
        <section
          aria-label={`${categoryLabel}${regionName ? ` in ${regionName}` : ""}`}
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
            alt={`${categoryLabel}${regionName ? ` in ${regionName}` : ""}`}
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
                {categoryLabel}
                {regionName && (
                  <>{" "}in{" "}<em style={{ fontStyle: "italic", color: "#d1a352" }}>{regionName}</em></>
                )}
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

            {/* AI Search trigger */}
            <button
              onClick={() => setImmersiveOpen(true)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(201,168,76,0.12)",
                border: "1px solid rgba(201,168,76,0.38)",
                borderRadius: 3,
                color: "#C9A84C",
                fontFamily: NU,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                padding: "9px 20px",
                cursor: "pointer",
                marginBottom: 28,
                transition: "all 0.2s ease",
                alignSelf: "flex-start",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.2)"; e.currentTarget.style.borderColor = "#C9A84C"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.12)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.38)"; }}
            >
              <span style={{ fontSize: 13 }}>✦</span>
              Explore with Aura
              <span style={{ fontSize: 13 }}>✦</span>
            </button>

            {/* Stats row */}
            <div
              className="lwd-rc-hero-stats"
              style={{ display: "flex", gap: 32, alignItems: "center" }}
              aria-label="Key statistics"
            >
              {[
                { val: listingCount > 0 ? listingCount : "—", label: categorySlug === "wedding-venues" ? "Curated Venues" : "Curated Listings" },
                ...(regionName ? [{ val: regionName, label: "Region", isText: true }] : []),
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
              <button
                onClick={() => onViewCountry(countrySlug)}
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
                {countryName}
              </button>
              {regionName && regionName !== countryName && (
                <>
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
                </>
              )}
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
            background: darkMode ? C.dark : "#f2f0ea",
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
                {categoryLabel}{regionName ? ` in ${regionName}` : ""}
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

        {/* Featured section removed — unified into main grid below */}

        {/* ════════════════════════════════════════════════════════════════════
            6. REAL WEDDINGS SECTION (Wedding Venues Only)
        ════════════════════════════════════════════════════════════════════ */}
        {listingCount > 0 && categorySlug === "wedding-venues" && (
          <section
            className="lwd-rc-section"
            style={{
              background: darkMode ? C.black : "#f2f0ea",
              padding: isMobile ? "40px 16px 48px" : "56px 32px 64px",
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
            {/* ═══ AURA CONCIERGE BANNER ═══ */}
            {auraSummary && !summaryDismissed && (
              <div style={{
                background:   darkMode ? "rgba(201,168,76,0.06)" : "rgba(201,168,76,0.07)",
                borderLeft:   "3px solid rgba(201,168,76,0.45)",
                borderBottom: `1px solid ${darkMode ? "rgba(201,168,76,0.12)" : "rgba(201,168,76,0.18)"}`,
              }}>
                <div style={{
                  maxWidth:      1280,
                  margin:        "0 auto",
                  padding:       isMobile ? "14px 20px" : "16px 48px",
                  display:       "flex",
                  alignItems:    "flex-start",
                  justifyContent: "space-between",
                  gap:           16,
                }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                      <span style={{ color: "rgba(201,168,76,0.9)", fontSize: 9 }}>✦</span>
                      <span style={{
                        fontFamily:    NU,
                        fontSize:      9,
                        letterSpacing: "0.22em",
                        textTransform: "uppercase",
                        color:         "rgba(201,168,76,0.7)",
                        fontWeight:    700,
                      }}>
                        Curated for you
                      </span>
                    </div>
                    <p style={{
                      fontFamily:    GD,
                      fontSize:      isMobile ? 14 : 15,
                      fontWeight:    300,
                      fontStyle:     "italic",
                      color:         C.off,
                      margin:        0,
                      letterSpacing: "0.01em",
                      lineHeight:    1.45,
                    }}>
                      {auraSummary}
                    </p>
                  </div>
                  <button
                    onClick={() => setSummaryDismissed(true)}
                    aria-label="Dismiss"
                    style={{
                      background:  "none",
                      border:      "none",
                      cursor:      "pointer",
                      color:       darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
                      fontSize:    16,
                      lineHeight:  1,
                      padding:     "2px 4px",
                      flexShrink:  0,
                      marginTop:   2,
                      transition:  "color 0.15s",
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)"}
                    onMouseLeave={e => e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}

            {/* ═══ AURA CROSS-CATEGORY NAVIGATION SUGGESTION ═══ */}
            {auraCrossNav && (
              <div style={{
                background:   darkMode ? "rgba(201,168,76,0.05)" : "rgba(201,168,76,0.06)",
                borderLeft:   "3px solid rgba(201,168,76,0.55)",
                borderBottom: `1px solid ${darkMode ? "rgba(201,168,76,0.1)" : "rgba(201,168,76,0.15)"}`,
              }}>
                <div style={{
                  maxWidth:       1280,
                  margin:         "0 auto",
                  padding:        isMobile ? "14px 20px" : "16px 48px",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "space-between",
                  gap:            16,
                  flexWrap:       "wrap",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, minWidth: 0 }}>
                    <span style={{ color: "rgba(201,168,76,0.85)", fontSize: 10, flexShrink: 0 }}>✦</span>
                    <span style={{
                      fontFamily:    GD,
                      fontSize:      isMobile ? 13 : 14,
                      fontWeight:    300,
                      fontStyle:     "italic",
                      color:         C.off,
                      letterSpacing: "0.01em",
                    }}>
                      Looking for{" "}
                      <span style={{ fontWeight: 500 }}>{auraCrossNav.label}</span>
                      {auraCrossNav.region ? ` in ${auraCrossNav.region}` : ""}?
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                    <a
                      href={auraCrossNav.url}
                      style={{
                        display:       "inline-flex",
                        alignItems:    "center",
                        gap:           6,
                        fontFamily:    NU,
                        fontSize:      9,
                        fontWeight:    700,
                        letterSpacing: "0.14em",
                        textTransform: "uppercase",
                        color:         "rgba(201,168,76,0.9)",
                        background:    "rgba(201,168,76,0.1)",
                        border:        "1px solid rgba(201,168,76,0.35)",
                        borderRadius:  4,
                        padding:       "7px 14px",
                        textDecoration: "none",
                        transition:    "all 0.2s",
                        whiteSpace:    "nowrap",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.18)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.6)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.1)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; }}
                    >
                      View {auraCrossNav.label} →
                    </a>
                    <button
                      onClick={() => setAuraCrossNav(null)}
                      aria-label="Dismiss"
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        color: darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)",
                        fontSize: 16, lineHeight: 1, padding: "2px 4px",
                        transition: "color 0.15s",
                      }}
                      onMouseEnter={e => e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.55)"}
                      onMouseLeave={e => e.currentTarget.style.color = darkMode ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.25)"}
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            )}

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
              onSummary={(s) => { setAuraSummary(s || null); setSummaryDismissed(false); }}
              onClearSummary={() => { setAuraSummary(null); setAuraMapFilter(null); setAuraCrossNav(null); }}
              onCategoryIntent={(cat) => {
                if (!cat) { setAuraMapFilter(null); setAuraCrossNav(null); return; }
                if (cat !== categorySlug) {
                  // Cross-category intent — suggest navigation, don't filter current page
                  const CAT_LABELS = {
                    "wedding-venues":   "Wedding Venues",
                    "photographers":    "Photographers",
                    "wedding-planners": "Wedding Planners",
                    "florists":         "Florists",
                    "videographers":    "Videographers",
                    "caterers":         "Caterers",
                    "musicians":        "Musicians",
                    "hair-beauty":      "Hair & Beauty",
                  };
                  const label = CAT_LABELS[cat] || cat;
                  const url   = getRegionCategoryPath(countrySlug, regionSlug || "all", cat);
                  setAuraCrossNav({ label, url, region: regionName || countryName });
                  setAuraMapFilter(null);
                } else {
                  // Same-category — treat as filter intent
                  setAuraMapFilter(cat);
                  setAuraCrossNav(null);
                }
              }}
              onMapIntent={(open) => {
                if (open && !mapOn && !isMobile) {
                  setMapOn(true);
                }
              }}
            />
            <CountrySearchBar
              filters={venueFilters}
              onFiltersChange={handleVenueFiltersChange}
              viewMode={viewMode}
              onViewMode={handleViewMode}
              sortMode={sortMode}
              onSortChange={setSortMode}
              total={listingCount}
              regions={[{ name: regionName, slug: regionSlug }]}
              countryFilter={countryName}
              mapOn={mapOn}
              onToggleMap={categorySlug === "wedding-venues" ? handleToggleMap : undefined}
            />
            {!mapOn && (
              <InfoStrip
                availableRegions={[{ name: regionName, slug: regionSlug }]}
                filters={venueFilters}
                onFiltersChange={handleVenueFiltersChange}
                defaultFilters={DEFAULT_FILTERS}
              />
            )}

            {/* ════════════════════════════════════════════════════════════════════
                8. LISTINGS — EXPLORE LAYOUT (map on · desktop) or NORMAL SECTION
                Explore layout: any category, map on, desktop only.
                Normal section: map off, mobile, or non-venue categories.
            ════════════════════════════════════════════════════════════════════ */}

            {/* ── EXPLORE LAYOUT ── map on · desktop · any category ───────────── */}
            {mapOn && !isMobile && (
              <div
                aria-label={`${categoryLabel} listings`}
                style={{
                  display:      "flex",
                  height:       "calc(100vh - 72px)",
                  overflow:     "hidden",
                  background:   darkMode ? C.dark : "#f2f0ea",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                {/* Left: scrollable card panel — owns its own padding, no hacks needed */}
                <div style={{
                  flex:       "0 1 900px",
                  overflowY:  "auto",
                  padding:    "40px 20px 40px 85px",
                  opacity:    mapTransitioning ? 0.55 : 1,
                  transition: "opacity 0.2s ease",
                }}>
                  {listingCount <= 3 ? (
                    <EmptyResultState
                      resultCount={listingCount}
                      categoryLabel={categoryLabel}
                      alternatives={alternativeCategories}
                      onSelectAlternative={handleSelectAlternative}
                      darkMode={darkMode}
                    />
                  ) : viewMode === "grid" ? (
                    /* Grid — 2 × 386px fixed columns */
                    <div
                      className="lwd-venue-grid"
                      style={{
                        display:             "grid",
                        gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                        gap:                 20,
                      }}
                      aria-label="Venue grid"
                    >
                      {sortedFilteredListings.map((v) => (
                        <div
                          key={v.id}
                          data-listing-id={v.id}
                          onMouseEnter={() => { setActiveListingId(v.id); PinSyncBus.emit("card:hover", v.id); }}
                          onMouseLeave={() => { setActiveListingId(null); PinSyncBus.emit("card:leave", v.id); }}
                          style={{
                            height:       560,
                            outline:      activeListingId === v.id ? "2px solid rgba(201,168,76,0.5)" : "none",
                            borderRadius: "var(--lwd-radius-card, 8px)",
                            transition:   "outline 0.2s",
                            overflow:     "hidden",
                          }}
                        >
                          <LuxuryVenueCard
                            v={v}
                            onView={() => onViewVenue(v.id || v.slug)}
                            quickViewItem={qvItem}
                            setQuickViewItem={setQvItem}
                            matchedStyles={filters.styles || []}
                            otherFilters={{ region: filters.region, capacity: filters.capacity }}
                          />
                        </div>
                      ))}
                    </div>
                  ) : (
                    /* List — single column, full width */
                    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                      {sortedFilteredListings.map((v) => (
                        <div
                          key={v.id}
                          data-listing-id={v.id}
                          onMouseEnter={() => { setActiveListingId(v.id); PinSyncBus.emit("card:hover", v.id); }}
                          onMouseLeave={() => { setActiveListingId(null); PinSyncBus.emit("card:leave", v.id); }}
                          onClick={() => PinSyncBus.emit("card:click", v.id)}
                        >
                          <VenueListItemCard
                            v={v}
                            onView={() => onViewVenue(v.id || v.slug)}
                            isHighlighted={activeListingId === v.id}
                            quickViewItem={qvItem}
                            setQuickViewItem={setQvItem}
                          />
                        </div>
                      ))}
                    </div>
                  ))}

                  {/* Near match suggestions (when results are low) */}
                  {listingCount > 0 && listingCount <= 3 && (
                    <NearMatchSection
                      allListings={listings}
                      matchedStyles={filters.styles || []}
                      primaryResults={sortedFilteredListings}
                      onView={onViewVenue}
                      darkMode={darkMode}
                      categoryLabel={categoryLabel}
                    />
                  )}
                </div>

                {/* Right: MASTERMap — naturally full height, zero hacks */}
                <div style={{
                  flex:       1,
                  position:   "relative",
                  opacity:    mapTransitioning ? 0 : 1,
                  transform:  mapTransitioning ? "translateX(24px)" : "translateX(0)",
                  transition: "opacity 0.3s ease, transform 0.3s ease-out",
                }}>
                  <MASTERMap
                    venues={sortedFilteredListings}
                    label={`Venue Map · ${regionName || countryName || "Italy"}`}
                    viewMode={viewMode}
                    onToggleView={viewMode === "grid" ? handleToggleMap : () => handleViewMode("grid")}
                    countrySlug={countrySlug || "italy"}
                    pageBg={darkMode ? C.dark : "#f2f0ea"}
                    auraSummary={auraSummary && !summaryDismissed ? auraSummary : null}
                    activeFilter={auraMapFilter}
                    onFilterChange={(cat) => setAuraMapFilter(cat)}
                    auraRecommendedIds={auraRecommendedIds}
                    onSparsePins={handleSparsePins}
                    activeListingId={activeListingId}
                    showFollowToggle={true}
                    onPinClick={(listingId) => {
                      setActiveListingId(listingId);
                      const el = document.querySelector(`[data-listing-id="${listingId}"]`);
                      if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                    }}
                  />
                </div>
              </div>
            )}

            {/* ── NORMAL SECTION ── map off · mobile · non-venue categories ─────── */}
            {(!mapOn || isMobile) && (
              <section
                className="lwd-rc-section"
                aria-label={`${categoryLabel} listings`}
                style={{
                  background:   darkMode ? C.dark : "#f2f0ea",
                  padding:      isMobile ? "40px 0 72px" : "40px 48px 72px",
                  borderBottom: `1px solid ${C.border}`,
                }}
              >
                <div style={{ maxWidth: 1280, margin: "0 auto" }}>

                  {/* Empty/low result state */}
                  {listingCount <= 3 && categorySlug === "wedding-venues" && (
                    <EmptyResultState
                      resultCount={listingCount}
                      categoryLabel={categoryLabel}
                      alternatives={alternativeCategories}
                      onSelectAlternative={handleSelectAlternative}
                      darkMode={darkMode}
                    />
                  )}

                  {/* wedding-venues · grid view — mobile: 1-col, desktop: 3-col */}
                  {categorySlug === "wedding-venues" && viewMode === "grid" && listingCount > 3 && (
                    <div
                      className="lwd-venue-grid"
                      style={{
                        display:             "grid",
                        gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                        gap:                 isMobile ? 3 : 16,
                      }}
                      aria-label="Venue grid"
                    >
                      {sortedFilteredListings.map((v) => (
                        <div
                          key={v.id}
                          data-listing-id={v.id}
                          onMouseEnter={() => { setActiveListingId(v.id); PinSyncBus.emit("card:hover", v.id); }}
                          onMouseLeave={() => { setActiveListingId(null); PinSyncBus.emit("card:leave", v.id); }}
                        >
                          <LuxuryVenueCard
                            v={v}
                            onView={() => onViewVenue(v.id || v.slug)}
                            quickViewItem={qvItem}
                            setQuickViewItem={setQvItem}
                            matchedStyles={filters.styles || []}
                            otherFilters={{ region: filters.region, capacity: filters.capacity }}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* wedding-venues · list view — single col, mobile map modal */}
                  {categorySlug === "wedding-venues" && viewMode !== "grid" && listingCount > 3 && (
                    <>
                      {isMobile && (
                        <div style={{ marginBottom: 20 }}>
                          <button
                            onClick={() => setMapOpen(true)}
                            style={{
                              display: "flex", alignItems: "center", gap: 8,
                              background: "rgba(201,168,76,0.08)",
                              border: "1px solid rgba(201,168,76,0.3)",
                              borderRadius: "var(--lwd-radius-input)",
                              padding: "9px 18px",
                              fontFamily: NU, fontSize: 11, fontWeight: 600,
                              letterSpacing: "0.5px", color: "#C9A84C", cursor: "pointer",
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
                      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                        {sortedFilteredListings.map((v) => (
                          <div
                            key={v.id}
                            data-listing-id={v.id}
                            onMouseEnter={() => { setActiveListingId(v.id); PinSyncBus.emit("card:hover", v.id); }}
                            onMouseLeave={() => { setActiveListingId(null); PinSyncBus.emit("card:leave", v.id); }}
                            onClick={() => PinSyncBus.emit("card:click", v.id)}
                          >
                            <VenueListItemCard
                              v={v}
                              onView={() => onViewVenue(v.id || v.slug)}
                              isHighlighted={activeListingId === v.id}
                              quickViewItem={qvItem}
                              setQuickViewItem={setQvItem}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Mobile map modal — full intelligence props, parity with desktop */}
                      {isMobile && mapOpen && (
                        <div
                          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "flex-end", zIndex: 1000 }}
                          onClick={() => setMapOpen(false)}
                        >
                          <div
                            style={{ width: "100%", height: "80vh", background: darkMode ? C.dark : "#f2f0ea", borderRadius: "16px 16px 0 0", overflow: "hidden", display: "flex", flexDirection: "column" }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: C.white }}>Map</span>
                              <button onClick={() => setMapOpen(false)} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: C.grey }}>×</button>
                            </div>
                            <div style={{ flex: 1, overflow: "hidden" }}>
                              <MASTERMap
                                venues={sortedFilteredListings}
                                label={`${categoryLabel} · ${regionName || countryName || "Italy"}`}
                                viewMode={viewMode}
                                onToggleView={() => setMapOpen(false)}
                                countrySlug={countrySlug || "italy"}
                                pageBg={darkMode ? C.dark : "#f2f0ea"}
                                auraSummary={auraSummary && !summaryDismissed ? auraSummary : null}
                                activeFilter={auraMapFilter}
                                onFilterChange={(cat) => setAuraMapFilter(cat)}
                                auraRecommendedIds={auraRecommendedIds}
                                onSparsePins={handleSparsePins}
                                activeListingId={activeListingId}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* non-venue categories */}
                  {categorySlug !== "wedding-venues" && (
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 24 }}>
                      {sortedFilteredListings.map((item) => (
                        <ListingCard key={item.id} item={item} C={C} isVenue={false} />
                      ))}
                    </div>
                  )}

                </div>
              </section>
            )}
          </>
        ) : (
          /* ── Premium "Coming Soon" editorial state ── */
          <section
            className="lwd-rc-section"
            aria-label="Coming soon"
            style={{
              background: darkMode ? C.dark : "#f2f0ea",
              padding: "96px 48px",
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
                {categoryLabel}{regionName ? ` in ${regionName}` : ""}
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
            background: "#000000",
            padding: isMobile ? "56px 20px" : "96px 120px",
          }}
        >
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
              <span
                style={{
                  fontFamily: NU,
                  fontSize: 9,
                  letterSpacing: "0.3em",
                  textTransform: "uppercase",
                  color: "#C9A84C",
                  fontWeight: 600,
                }}
              >
                Find Your Team
              </span>
              <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
            </div>
            <h2
              style={{
                fontFamily: GD,
                fontSize: isMobile ? "clamp(22px, 6vw, 30px)" : "clamp(26px, 3vw, 36px)",
                fontWeight: 400,
                color: "#f5f0e8",
                lineHeight: 1.2,
                margin: "0 0 32px",
              }}
            >
              {regionName ? <><span style={{ color: "rgba(245,240,232,0.85)" }}>{regionName}</span>{" "}</> : null}
              <span style={{ fontStyle: "italic", color: "#C9A84C" }}>Wedding Vendors</span>
            </h2>
            <VendorCategoryCarousel
              categories={VENDOR_CATEGORIES}
              C={DARK_C}
              onSelect={(slug) => onViewRegionCategory(countrySlug, regionSlug, slug)}
              activeCategorySlugs={listingsLoaded ? (() => { const s = new Set(); dbListings.forEach(l => { const cat = l.categorySlug || l.category_slug || ""; if (cat) s.add(cat); const lt = l.listingType || l.listing_type || ""; if (!cat && (lt === "venue" || !lt)) s.add("wedding-venues"); }); return s; })() : null}
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
                    {categoryLabel}{regionName ? ` in ${regionName}` : ""} — Luxury Wedding Directory
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
                    Discover {listingCount > 0 ? listingCount : "the finest"} curated {categoryLabel.toLowerCase()}{regionName ? ` in ${regionName}` : ""}. Every recommendation editorially verified by the LWD team.
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
        <DirectoryBrands onViewRegion={onViewRegion} onViewCategory={onViewCategory} showInternational={false} showUK={countrySlug === "england"} showItaly={countrySlug === "italy"} showUSA={countrySlug === "usa"} liveRegions={regionSlug && countrySlug ? [{ slug: regionSlug, name: regionName, countrySlug }] : []} darkMode={darkMode} />


        {/* ── Quick View modal (page-level) ── */}
        {qvItem && (
          <QuickViewModal
            item={qvItem}
            onClose={() => setQvItem(null)}
            onViewFull={(v) => { setQvItem(null); onViewVenue(v); }}
          />
        )}

        <ImmersiveSearch
          isOpen={immersiveOpen}
          onClose={() => setImmersiveOpen(false)}
          onViewCategory={onViewCategory}
          onViewRegionCategory={onViewRegionCategory}
        />
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

function VendorCategoryCarousel({ categories, C, onSelect, activeCategorySlugs = null }) {
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
            isEmpty={activeCategorySlugs !== null && !activeCategorySlugs.has(vc.slug)}
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

function VendorCategoryCard({ vc, C, onClick, isEmpty = false }) {
  return (
    <MasterCategoryCard
      category={vc}
      colors={C}
      onClick={onClick}
      isEmpty={isEmpty}
    />
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
