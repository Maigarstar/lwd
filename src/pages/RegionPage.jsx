// ─── src/pages/RegionPage.jsx ──────────────────────────────────────────────────
// County hub template — renders any region entity as a mini website.
// Data-driven: one template, many counties.
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { useTheme } from "../theme/ThemeContext";
import { DARK_C } from "../theme/tokens";
import { useChat } from "../chat/ChatContext";

import {
  getRegionBySlug,
  getCountryBySlug,
  getCityBySlug,
  getRegionsByCountry,
  VENDOR_CATEGORIES,
} from "../data/geo.js";
import { DEFAULT_FILTERS } from "../data/venues";
import { getVenuesByRegion, getVenuesByCity } from "../services/venueService";
import { fetchListings } from "../services/listings";
import { getRegionPageConfig } from "../services/regionPageConfig";
import { fetchLocationContent } from "../services/locationContentService";

import LuxuryVenueCard  from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import VenueListItemCard from "../components/cards/VenueListItemCard";
import { PinSyncBus }   from "../components/maps/PinSyncBus";
import QuickViewModal   from "../components/modals/QuickViewModal";
import { useDirectoryState } from "../hooks/useDirectoryState";
import SiteFooter from "../components/sections/SiteFooter";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import FeaturedSlider from "../components/sections/FeaturedSlider";
import RegionHero from "../components/sections/RegionHero";
import RegionFeatured from "../components/sections/RegionFeatured";
import SliderNav from "../components/ui/SliderNav";
import HomeNav from "../components/nav/HomeNav";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import AICommandBar from "../components/filters/AICommandBar";
import ImmersiveSearch from "../components/search/ImmersiveSearch";
import InfoStrip from "../components/sections/InfoStrip";
import MASTERMap from "../components/maps/MASTERMap";
import { useInView, CountUp, SplitText, revealStyle } from "../components/ui/Animations";
import MasterCategoryCard, { LUXURY_ICONS } from "../components/cards/MasterCategoryCard";
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
  onViewCity = () => {},
  onViewCountry = () => {},
  countrySlug = null,
  regionSlug = null,
  footerNav = {},
  _cityData = null,
  hideNav = false,
}) {
  // ── State ────────────────────────────────────────────────────────────────
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;
  const [scrolled, setScrolled] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [savedIds, setSavedIds] = useState([]);
  const [qvItem, setQvItem] = useState(null);
  const [visibleCities, setVisibleCities] = useState(4);
  const [visibleRelated, setVisibleRelated] = useState(4);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const [venueViewMode, setVenueViewMode] = useState("grid"); // grid, list — kept for legacy compat
  const [listingMode, setListingMode] = useState("venues"); // "venues" | "vendors"
  const {
    mapOn,
    toggleMap,
    setMapOn,
    mapTransitioning,
    viewMode,
    setViewMode: _setViewMode,
    activeListingId,
    setActiveListingId,
  } = useDirectoryState({ storageKey: "lwd-region-view" });
  // List view always opens with the map (split layout)
  const setViewMode = useCallback((mode) => {
    _setViewMode(mode);
    if (mode === "list" && !mapOn) setMapOn(true);
  }, [_setViewMode, mapOn, setMapOn]);
  const [currentPage, setCurrentPage] = useState(0);
  const [filters, setFilters] = useState(() => ({ ...DEFAULT_FILTERS, region: regionSlug }));
  const [sortMode, setSortMode] = useState("recommended");

  // ── Reset filters + mode whenever the region changes ────────────────────────
  useEffect(() => {
    setFilters({ ...DEFAULT_FILTERS, region: regionSlug });
    setSortMode("recommended");
    setListingMode("venues");
  }, [regionSlug]);
  const [citiesWithContent, setCitiesWithContent] = useState([]);
  const [dbContent,         setDbContent]         = useState(null);
  const [slideIdx,          setSlideIdx]          = useState(0);
  const [filterSticky,      setFilterSticky]      = useState(true);
  const [filterVisible,     setFilterVisible]     = useState(true);
  const [dbListings,        setDbListings]        = useState([]);
  const filterReleaseTimer = useRef(null);
  const filterBarRef = useRef(null);
  const isMobile = useIsMobile();

  const C = themeCtx;

  // ── Filter handler ──────────────────────────────────────────────────────
  const handleFiltersChange = useCallback((f) => setFilters(f), []);

  // ── Ensure page scrolls to top on mount ──────────────────────────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [regionSlug]);

  // ── Entity lookup ────────────────────────────────────────────────────────
  // If _cityData is provided, use it as the region (for city pages)
  const region = useMemo(() => {
    if (_cityData) return _cityData;
    const found = getRegionBySlug(regionSlug);
    // getRegionBySlug falls back to ALL_REGIONS_SENTINEL (slug:"all") when not found.
    // For unknown regions (France/Hungary etc.) build a minimal synthetic region so the
    // page renders with the correct name and listings rather than "All Regions".
    if (found?.slug === "all" && regionSlug && regionSlug !== "all") {
      const name = regionSlug
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
      return {
        slug: regionSlug,
        name,
        countrySlug: countrySlug || null,
        group: countrySlug || null,
        priorityLevel: null,
        listingCount: 0,
        heroTitle: `Weddings in ${name}`,
        heroSubtitle: null,
        heroImg: null,
        introEditorial: null,
        cities: [],
        seo: {
          title: `Luxury Wedding Venues in ${name} | LWD`,
          metaDescription: `Discover curated luxury wedding venues in ${name}.`,
          canonicalPath: `/${countrySlug}/${regionSlug}`,
        },
        ai: { summary: "", focusKeywords: [] },
        relatedRegionSlugs: [],
        _synthetic: true, // flag: no rich editorial data
      };
    }
    return found;
  }, [regionSlug, _cityData, countrySlug]);
  // Use the region's actual country — prevents mismatches like /england/lake-como
  const actualCountrySlug = region?.countrySlug || countrySlug;
  const country = useMemo(() => getCountryBySlug(actualCountrySlug), [actualCountrySlug]);

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

  // Fetch database content for cities and merge with hardcoded data
  useEffect(() => {
    if (!cities || cities.length === 0 || !countrySlug) {
      setCitiesWithContent(cities);
      return;
    }

    const mergeWithDatabaseContent = async () => {
      const enhancedCities = await Promise.all(
        cities.map(async (city) => {
          try {
            const locationKey = `city:${countrySlug}:${city.regionSlug}:${city.slug}`;
            const dbContent = await fetchLocationContent(locationKey);

            if (dbContent && dbContent.published) {
              // Merge database content with hardcoded city data
              return {
                ...city,
                // Use database heroTitle if available, otherwise use hardcoded name
                heroTitle: dbContent.hero_title || city.name,
                // Use database editorialPara1 as intro if available, otherwise use hardcoded introEditorial
                introEditorial: dbContent.metadata?.editorialPara1 || city.introEditorial,
                heroSubtitle: dbContent.hero_subtitle || undefined,
                heroImage: dbContent.hero_image || undefined,
              };
            }
          } catch (err) {
            console.error(`[RegionPage] Failed to fetch content for ${city.slug}:`, err);
          }
          // Return original city if no database content found
          return city;
        })
      );
      setCitiesWithContent(enhancedCities);
    };

    mergeWithDatabaseContent();
  }, [cities, countrySlug]);

  // Related regions resolved
  const relatedRegions = useMemo(
    () =>
      (region.relatedRegionSlugs || [])
        .map(getRegionBySlug)
        .filter((r) => r && r.slug !== "all"),
    [region]
  );

  // Venues for this region — DB listings first, static fallback
  const regionVenues = useMemo(() => {
    // Convert DB listings to the same shape as static venue objects
    const dbVenues = dbListings
      .filter((l) => l.listingType === "venue" || l.cat === "venue" || !l.listingType)
      .map((l) => ({
        id:          l.id,
        name:        l.cardTitle || l.name || "",
        region:      l.region    || "",
        regionSlug:  l.regionSlug || l.region_slug || "",
        countrySlug: l.countrySlug || l.country_slug || "",
        city:        l.city || "",
        citySlug:    l.citySlug || l.city_slug || "",
        imgs:        Array.isArray(l.imgs)
          ? l.imgs.map((img) => typeof img === "string" ? img : (img.src || img.url || "")).filter(Boolean)
          : l.heroImage ? [l.heroImage] : [],
        desc:        l.cardSummary || l.shortDescription || l.desc || "",
        priceFrom:   (() => {
          const p = l.priceFrom;
          if (!p) return "";
          // Already formatted (e.g. "£18,000")
          if (typeof p === "string" && p.includes("£")) return p;
          const num = parseInt(p, 10);
          if (isNaN(num)) return p;
          const currency = l.priceCurrency || "GBP";
          const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : "£";
          return `${sym}${num.toLocaleString("en-GB")}`;
        })(),
        capacity:    l.capacityMax || l.capacityMin || l.capacity || null,
        rating:      l.rating ?? null,
        reviews:     l.reviewCount ?? l.reviews ?? null,
        verified:    l.isVerified ?? l.verified ?? false,
        featured:    l.isFeatured ?? l.featured ?? false,
        lwdScore:    l.lwdScore ?? null,
        tag:         l.cardBadge || l.tag || null,
        styles:      Array.isArray(l.styles) ? l.styles : [],
        includes:    Array.isArray(l.amenities)
          ? l.amenities
          : (typeof l.amenities === "string" && l.amenities.trim()
              ? l.amenities.split(",").map(s => s.trim()).filter(Boolean)
              : []),
        slug:        l.slug || "",
        showcaseUrl: l.showcaseEnabled && l.slug ? `/showcase/${l.slug}` : null,
        lat:         l.lat ?? null,
        lng:         l.lng ?? null,
        online:      l.isFeatured ?? true,
      }));

    // Static venues for this region
    const staticSlug = _cityData?.regionSlug || region.slug;
    const staticVenues = _cityData?.citySlug
      ? getVenuesByCity(_cityData.citySlug)
      : getVenuesByRegion(staticSlug);

    // Merge: DB venues first (they're real listings), then static venues that
    // don't share an id or name with a DB venue (avoid duplicates)
    const dbNames = new Set(dbVenues.map((v) => v.name.toLowerCase()));
    const uniqueStatic = staticVenues.filter((v) => !dbNames.has(v.name.toLowerCase()));
    return [...dbVenues, ...uniqueStatic];
  }, [region.slug, _cityData, dbListings]);

  // Vendors for this region — from the same dbListings fetch
  const regionVendors = useMemo(() => {
    return dbListings
      .filter((l) => l.listingType === "vendor" || l.cat === "vendor")
      .map((l) => ({
        id:          l.id,
        name:        l.cardTitle || l.name || "",
        region:      l.region    || "",
        regionSlug:  l.regionSlug || l.region_slug || "",
        countrySlug: l.countrySlug || l.country_slug || "",
        city:        l.city || "",
        citySlug:    l.citySlug || l.city_slug || "",
        imgs:        Array.isArray(l.imgs)
          ? l.imgs.map((img) => typeof img === "string" ? img : (img.src || img.url || "")).filter(Boolean)
          : l.heroImage ? [l.heroImage] : [],
        desc:        l.cardSummary || l.shortDescription || l.desc || "",
        priceFrom:   l.priceFrom || "",
        capacity:    l.capacityMax || l.capacityMin || l.capacity || null,
        rating:      l.rating ?? null,
        reviews:     l.reviewCount ?? l.reviews ?? null,
        verified:    l.isVerified ?? l.verified ?? false,
        featured:    l.isFeatured ?? l.featured ?? false,
        lwdScore:    l.lwdScore ?? null,
        tag:         l.cardBadge || l.tag || null,
        styles:      Array.isArray(l.styles) ? l.styles : [],
        slug:        l.slug || "",
        lat:         l.lat ?? null,
        lng:         l.lng ?? null,
        type:        "vendor",
        category:    l.category || l.categorySlug || "photographers",
      }));
  }, [dbListings]);

  // ── Apply CountrySearchBar filters + sort on top of regionVenues ─────────────
  const filteredRegionVenues = useMemo(() => {
    let out = [...regionVenues];
    if (filters.region && filters.region !== "all" && filters.region !== regionSlug) {
      out = out.filter(v => v.regionSlug === filters.region || v.region?.toLowerCase() === filters.region.toLowerCase());
    }
    if (filters.style && filters.style !== "All Styles") {
      out = out.filter(v => Array.isArray(v.styles) ? v.styles.includes(filters.style) : v.style === filters.style);
    }
    if (filters.capacity && filters.capacity !== "Any Capacity") {
      out = out.filter(v => {
        const cap = v.capacity ?? v.capacityMax ?? v.capacityMin;
        if (cap == null) return false;
        if (filters.capacity === "Up to 50")  return cap <= 50;
        if (filters.capacity === "51–100")    return cap >= 51  && cap <= 100;
        if (filters.capacity === "101–200")   return cap >= 101 && cap <= 200;
        if (filters.capacity === "200+")      return cap > 200;
        return true;
      });
    }
    if (filters.price && filters.price !== "All Budgets") {
      out = out.filter(v => {
        const raw = v.priceFromRaw ?? (typeof v.priceFrom === "number" ? v.priceFrom : parseInt((v.priceFrom || "").replace(/[^0-9]/g, ""), 10));
        if (!raw || isNaN(raw)) return true;
        const nums = filters.price.replace(/£|,/g, "").split("–").map(n => parseInt(n, 10));
        if (nums.length === 2) return raw >= nums[0] && raw <= nums[1];
        if (filters.price.includes("+")) return raw >= (nums[0] || 0);
        return true;
      });
    }
    switch (sortMode) {
      case "rating":     out = out.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)); break;
      case "price-low":  out = out.sort((a, b) => (a.priceFromRaw ?? Infinity) - (b.priceFromRaw ?? Infinity)); break;
      case "price-high": out = out.sort((a, b) => (b.priceFromRaw ?? 0) - (a.priceFromRaw ?? 0)); break;
      default: out = out.sort((a, b) => { if (b.featured !== a.featured) return b.featured ? 1 : -1; return (b.lwdScore ?? b.rating ?? 0) - (a.lwdScore ?? a.rating ?? 0); });
    }
    return out;
  }, [regionVenues, filters, sortMode, regionSlug]);

  const featuredVenues = useMemo(() => {
    // DB-pinned IDs take priority over hardcoded `featured: true` flag
    const pinnedIds = dbContent?.featured_venues;
    if (Array.isArray(pinnedIds) && pinnedIds.length > 0) {
      return pinnedIds
        .map(id => regionVenues.find(v => v.id === id || v.id === Number(id)))
        .filter(Boolean);
    }
    return regionVenues.filter(v => v.featured);
  }, [regionVenues, dbContent]);

  // Set of category slugs that have ≥1 live listing in this region.
  // Used to show "Coming Soon" badge on empty category cards.
  const activeCategorySlugs = useMemo(() => {
    const s = new Set();
    dbListings.forEach((l) => {
      const cat = l.categorySlug || l.category_slug || "";
      if (cat) s.add(cat);
      // Venue listings may not have categorySlug — map by listingType
      const lt = l.listingType || l.listing_type || "";
      if (!cat && (lt === "venue" || !lt)) s.add("wedding-venues");
    });
    // If any venues exist (regionVenues) also mark wedding-venues active
    if (regionVenues.length > 0) s.add("wedding-venues");
    return s;
  }, [dbListings, regionVenues]);


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
    let prevShouldStick = true;
    const fn = () => {
      setScrolled(window.scrollY > 80);
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const shouldStick = scrollable <= 0 || window.scrollY < scrollable * 0.3;
      if (shouldStick === prevShouldStick) return;
      prevShouldStick = shouldStick;
      clearTimeout(filterReleaseTimer.current);
      if (shouldStick) {
        setFilterSticky(true);
        filterReleaseTimer.current = setTimeout(() => setFilterVisible(true), 20);
      } else {
        setFilterVisible(false);
        filterReleaseTimer.current = setTimeout(() => setFilterSticky(false), 380);
      }
    };
    window.addEventListener("scroll", fn, { passive: true });
    return () => {
      window.removeEventListener("scroll", fn);
      clearTimeout(filterReleaseTimer.current);
    };
  }, []);

  // ── Click outside map panel to close ────────────────────────────────────
  useEffect(() => {
    if (venueViewMode !== "map") return;
    const handler = (e) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target)) {
        setVenueViewMode("grid");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [venueViewMode]);

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

  // ── Fetch region-level content from Locations studio (Supabase) ──────────
  // Locations studio saves as: region:{countrySlug}:{regionSlug}
  // RegionPage reads the same key and merges with hardcoded fallbacks.
  useEffect(() => {
    if (!countrySlug || !regionSlug || _cityData) return; // skip for city overrides
    const key = `region:${countrySlug}:${regionSlug}`;
    fetchLocationContent(key)
      .then(data => { if (data) setDbContent(data); })
      .catch(() => {});
  }, [countrySlug, regionSlug, _cityData]);

  // Fetch live Supabase listings for this region
  useEffect(() => {
    if (!regionSlug) return;
    fetchListings({ status: "published", region_slug: regionSlug })
      .then((listings) => setDbListings(listings || []))
      .catch(() => {});
  }, [regionSlug]);

  // DB content overrides hardcoded region data where populated
  const heroImg        = dbContent?.hero_image   || region.heroImg       || DEFAULT_HERO;

  // Parse up to 8 hero images from metadata.heroImages (JSON string in DB)
  const heroImages = useMemo(() => {
    try {
      const meta = dbContent?.metadata
        ? (typeof dbContent.metadata === "string" ? JSON.parse(dbContent.metadata) : dbContent.metadata)
        : {};
      const imgs = Array.isArray(meta.heroImages) && meta.heroImages.length > 0
        ? meta.heroImages.slice(0, 4)
        : [];
      return imgs.length > 0 ? imgs : [heroImg];
    } catch {
      return [heroImg];
    }
  }, [dbContent, heroImg]);

  // Auto-rotate slideshow
  useEffect(() => {
    if (heroImages.length <= 1) return;
    const timer = setInterval(() => setSlideIdx(i => (i + 1) % heroImages.length), 5500);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Standardised title: only use DB/hardcoded title if it already follows "Weddings in X" format
  const rawHeroTitle   = dbContent?.hero_title   || region.heroTitle     || null;
  const heroTitle      = rawHeroTitle?.toLowerCase().startsWith("weddings")
    ? rawHeroTitle
    : `Weddings in ${region.name}`;
  const heroSubtitle   = dbContent?.hero_subtitle|| region.heroSubtitle  || null;
  const introEditorial = dbContent?.metadata?.editorialPara1 || region.introEditorial || null;
  const seoText = region.seoText || null;

  const countryName = country?.name || "United Kingdom";

  // ── Render ─────────────────────────────────────────────────────────────
  return (
      <div style={{ background: C.black, minHeight: "100vh", color: C.white }}>

        {/* ═══ NAVIGATION ═══════════════════════════════════════════════════ */}
        {!hideNav && (
          <HomeNav
            hasHero={true}
            darkMode={darkMode}
            onToggleDark={themeCtx.toggleDark}
            onNavigateStandard={() => onBack()}
            onNavigateAbout={() => onBack()}
          />
        )}

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
          {/* Background images — crossfade slideshow (max 8) */}
          {heroImages.map((src, i) => (
            <img
              key={src}
              src={src}
              alt={i === 0 ? `Luxury wedding setting in ${region.name}` : ""}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
                objectFit: "cover",
                opacity: slideIdx === i ? 0.55 : 0,
                transform: slideIdx === i ? "scale(1.04)" : "scale(1.0)",
                transition: "opacity 1.8s ease, transform 8s ease",
                willChange: "opacity, transform",
              }}
            />
          ))}

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
              padding: isMobile ? "0 20px 56px" : "0 80px 80px",
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
              Weddings in{" "}
              <span style={{ fontStyle: "italic", color: "#d1a352" }}>{region.name}</span>
            </h1>

            {/* SEO description */}
            {seoText && (
              <p style={{
                fontFamily: NU,
                fontSize: 15,
                color: "#fff",
                fontWeight: 300,
                lineHeight: 1.7,
                maxWidth: 560,
                marginBottom: 28,
              }}>
                {seoText.split("\n\n")[0]}
              </p>
            )}

            {/* Subtitle / editorial excerpt */}
            {heroSubtitle && (
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
                {heroSubtitle}
              </p>
            )}

            {/* Aura trigger */}
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
                width: "fit-content",
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
              className="lwd-hero-stats"
              style={{ display: "flex", gap: 32, alignItems: "center" }}
              aria-label="Key statistics"
            >
              {[
                { val: regionVenues.length || "—", label: "Curated Venues" },
                { val: cities.length || "—", label: region.localTerm || "Cities" },
                { val: (region.listingCount > 0 || regionVenues.length > 0) ? "100%" : "Coming Soon", label: (region.listingCount > 0 || regionVenues.length > 0) ? "Personally Verified" : "Listings", soft: region.listingCount === 0 && regionVenues.length === 0 },
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

          {/* Breadcrumb — floating over hero bottom */}
          {!_cityData && (
            <nav
              aria-label="Breadcrumb"
              style={{
                position: "absolute",
                bottom: isMobile ? 14 : 24,
                left: isMobile ? 20 : 80,
                display: "flex",
                alignItems: "center",
                gap: isMobile ? 5 : 6,
                zIndex: 4,
                flexWrap: "nowrap",
              }}
            >
              {[
                { label: "Home", action: footerNav.onNavigateHome || onBack },
                { label: country?.name || actualCountrySlug, action: actualCountrySlug ? () => onViewCountry(actualCountrySlug) : null },
                { label: region.name, active: true },
              ].map((crumb, i) => (
                <span key={i} style={{ display: "flex", alignItems: "center", gap: isMobile ? 5 : 6 }}>
                  {i > 0 && <span style={{ color: "rgba(255,255,255,0.3)", fontSize: isMobile ? 10 : 11 }}>›</span>}
                  {crumb.active ? (
                    <span style={{ color: "#C9A84C", fontFamily: NU, fontSize: isMobile ? 11 : 12, fontWeight: 600, letterSpacing: "0.3px" }}>
                      {crumb.label}
                    </span>
                  ) : crumb.action ? (
                    <button onClick={crumb.action} style={{
                      background: "none", border: "none", padding: 0,
                      color: "rgba(255,255,255,0.6)", fontFamily: NU, fontSize: isMobile ? 11 : 12,
                      cursor: "pointer", lineHeight: 1,
                    }}>
                      {crumb.label}
                    </button>
                  ) : (
                    <span style={{ color: "rgba(255,255,255,0.4)", fontFamily: NU, fontSize: isMobile ? 11 : 12 }}>{crumb.label}</span>
                  )}
                </span>
              ))}
            </nav>
          )}

          {/* Slide dots — bottom-right, only when multiple images */}
          {heroImages.length > 1 && (
            <div style={{
              position: "absolute",
              bottom: isMobile ? 14 : 24,
              right: isMobile ? 20 : 80,
              display: "flex",
              gap: 6,
              alignItems: "center",
              zIndex: 4,
            }}>
              {heroImages.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSlideIdx(i)}
                  aria-label={`Show image ${i + 1}`}
                  style={{
                    width: i === slideIdx ? 18 : 6,
                    height: 6,
                    borderRadius: 3,
                    background: i === slideIdx ? "#C9A84C" : "rgba(255,255,255,0.35)",
                    border: "none",
                    padding: 0,
                    cursor: "pointer",
                    transition: "all 0.35s ease",
                  }}
                />
              ))}
            </div>
          )}
        </section>
        )}

        {/* ═══ AI COMMAND BAR + FILTER BAR ════════ */}
        <AICommandBar
          countrySlug={actualCountrySlug}
          countryName={countryName}
          regionSlug={regionSlug}
          regionName={region?.name}
          entityType="venue"
          availableRegions={[]}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          defaultFilters={DEFAULT_FILTERS}
        />
        <CountrySearchBar
          ref={filterBarRef}
          filters={filters}
          onFiltersChange={handleFiltersChange}
          viewMode={viewMode}
          onViewMode={setViewMode}
          sortMode={sortMode}
          onSortChange={setSortMode}
          total={filteredRegionVenues.length}
          regions={[{ name: region.name, slug: region.slug }]}
          countryFilter={country?.name}
          mapOn={mapOn}
          onToggleMap={toggleMap}
          mode={listingMode}
          onModeChange={setListingMode}
        />
        {!mapOn && (
          <InfoStrip
            availableRegions={cities.map((c) => ({ name: c.name, slug: c.slug }))}
            filters={filters}
            onFiltersChange={handleFiltersChange}
            defaultFilters={DEFAULT_FILTERS}
          />
        )}

        {/* ── EXPLORE LAYOUT — map on · desktop ─────────────────────────────── */}
        {mapOn && !isMobile && (() => {
          const exploreItems = listingMode === "vendors" ? regionVendors : filteredRegionVenues;
          return (
          <div
            aria-label={`Explore ${listingMode} in ${region.name}`}
            style={{
              display:      "flex",
              height:       "calc(100vh - 72px)",
              overflow:     "hidden",
              background:   C.black,
              borderBottom: `1px solid rgba(201,168,76,0.12)`,
            }}
          >
            {/* Left: scrollable card panel */}
            <div style={{
              flex:       "0 1 900px",
              overflowY:  "auto",
              padding:    "40px 20px 40px 85px",
              opacity:    mapTransitioning ? 0.55 : 1,
              transition: "opacity 0.2s ease",
            }}>
              {viewMode === "grid" ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 20 }}>
                  {exploreItems.map((v) => (
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
                      {listingMode === "vendors"
                        ? <LuxuryVendorCard v={v} onView={() => onViewVenue(v.slug || v.id)} quickViewItem={qvItem} setQuickViewItem={setQvItem} />
                        : <LuxuryVenueCard  v={v} onView={() => onViewVenue(v.slug || v.id)} quickViewItem={qvItem} setQuickViewItem={setQvItem} />
                      }
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {exploreItems.map((v) => (
                    <div
                      key={v.id}
                      data-listing-id={v.id}
                      onMouseEnter={() => { setActiveListingId(v.id); PinSyncBus.emit("card:hover", v.id); }}
                      onMouseLeave={() => { setActiveListingId(null); PinSyncBus.emit("card:leave", v.id); }}
                    >
                      <VenueListItemCard
                        v={v}
                        onView={() => onViewVenue(v.slug || v.id)}
                        isHighlighted={activeListingId === v.id}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: MASTERMap */}
            <div style={{
              flex:       1,
              position:   "relative",
              opacity:    mapTransitioning ? 0 : 1,
              transform:  mapTransitioning ? "translateX(24px)" : "translateX(0)",
              transition: "opacity 0.3s ease, transform 0.3s ease-out",
            }}>
              <MASTERMap
                venues={exploreItems}
                label={`${region.name} · ${listingMode === "vendors" ? "Vendors" : "Venues"}`}
                viewMode={viewMode}
                onToggleView={toggleMap}
                countrySlug={country?.slug || "italy"}
                pageBg={C.black}
                activeListingId={activeListingId}
                onPinClick={(listingId) => {
                  setActiveListingId(listingId);
                  const el = document.querySelector(`[data-listing-id="${listingId}"]`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "nearest" });
                }}
              />
            </div>
          </div>
          );
        })()}

        {/* ── NORMAL SECTIONS — map off · mobile ──────────────────────────── */}
        {(!mapOn || isMobile) && (<>

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
        {(pageConfig?.about?.content || introEditorial) && (
          <section
            aria-label={`About weddings in ${region.name}`}
            className="lwd-region-intro"
            style={{
              background: C.dark,
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
                <h2
                  style={{
                    fontFamily: NU,
                    fontSize: 9,
                    letterSpacing: "0.3em",
                    textTransform: "uppercase",
                    color: C.gold,
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {pageConfig?.about?.title || `${region.name} Weddings`}
                </h2>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              {(() => {
                const paras = (pageConfig?.about?.content || introEditorial).split("\n\n");
                return (
                  <>
                    <p style={{ fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.9, fontWeight: 300, marginBottom: 0 }}>
                      {paras[0]}
                    </p>
                    <button
                      onClick={() => setAboutExpanded(v => !v)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 8,
                        marginTop: 18,
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        padding: 0,
                      }}
                    >
                      <span style={{ fontFamily: NU, fontSize: 11, letterSpacing: "0.2em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
                        {aboutExpanded ? "Close" : "Continue reading"}
                      </span>
                      <span style={{
                        display: "inline-block",
                        width: 0,
                        height: 0,
                        borderLeft: "4px solid transparent",
                        borderRight: "4px solid transparent",
                        ...(aboutExpanded
                          ? { borderBottom: `5px solid ${C.gold}`, borderTop: "none", marginTop: -2 }
                          : { borderTop: `5px solid ${C.gold}`, borderBottom: "none", marginTop: 1 }
                        ),
                      }} />
                    </button>
                    {paras.slice(1).map((para, i) => (
                      <p
                        key={i}
                        style={{
                          fontFamily: NU,
                          fontSize: 15,
                          color: C.grey,
                          lineHeight: 1.9,
                          fontWeight: 300,
                          marginTop: 16,
                          marginBottom: 0,
                          maxHeight: aboutExpanded ? 600 : 0,
                          overflow: "hidden",
                          opacity: aboutExpanded ? 1 : 0,
                          transition: "max-height 0.6s ease, opacity 0.5s ease",
                        }}
                      >
                        {para}
                      </p>
                    ))}
                  </>
                );
              })()}
            </div>
          </section>
        )}

        {/* ═══ DIRECTORY LISTINGS — viewMode-aware grid / list ═══════════════ */}
        {filteredRegionVenues.length > 0 ? (
          <>
            <section
              aria-label={`${listingMode === "vendors" ? "Vendors" : "Venues"} in ${region.name}`}
              className="lwd-region-section"
              style={{
                maxWidth: 1280,
                margin: "0 auto",
                padding: isMobile ? "24px 16px 32px" : "24px 48px 32px",
              }}
            >
              {viewMode === "grid" ? (
                <div
                  ref={grid1Ref}
                  style={{
                    display: "grid",
                    gridTemplateColumns: isMobile
                      ? "1fr"
                      : "repeat(auto-fill, minmax(340px, 1fr))",
                    gap: isMobile ? 16 : 20,
                  }}
                >
                  {(listingMode === "vendors" ? regionVendors : filteredRegionVenues).map((v, i) => (
                    <div
                      key={v.id}
                      data-listing-id={v.id}
                      style={{
                        height: 560,
                        ...revealStyle(grid1In, i < 8 ? i : 0),
                      }}
                    >
                      {listingMode === "vendors"
                        ? <LuxuryVendorCard v={v} onView={() => onViewVenue(v.slug || v.id)} isMobile={isMobile} quickViewItem={qvItem} setQuickViewItem={setQvItem} />
                        : <LuxuryVenueCard  v={v} onView={() => onViewVenue(v.slug || v.id)} isMobile={isMobile} quickViewItem={qvItem} setQuickViewItem={setQvItem} />
                      }
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {(listingMode === "vendors" ? regionVendors : filteredRegionVenues).map((v) => (
                    <div key={v.id} data-listing-id={v.id}>
                      <VenueListItemCard
                        v={v}
                        onView={() => onViewVenue(v.slug || v.id)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* ═══ E-E-A-T EDITORIAL — below directory listings ══════════════ */}
            {region.editorial && (
              <EditorialSection editorial={region.editorial} region={region} C={C} />
            )}
          </>
        ) : (
          /* ── Premium "Coming Soon" editorial state ── */
          <section
            aria-label="Coming soon"
            className="lwd-region-section"
            style={{
              background: C.black,
              padding: "96px 48px",
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

        {/* Districts + Related Regions — removed per user request */}

        {/* SEO & AI Panel — hidden per user request */}

        {/* ═══ FIND YOUR TEAM — Category Shortcuts ══════════════════════ */}
        <section
          aria-label="Browse by category"
          className="lwd-region-categories"
          style={{
            background: "#000000",
            padding: isMobile ? "56px 20px" : "72px 48px",
          }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: "#C9A84C", fontWeight: 600 }}>Find Your Team</span>
                <div style={{ width: 28, height: 1, background: "#C9A84C" }} />
              </div>
              <h2 style={{ fontFamily: GD, fontSize: isMobile ? "clamp(22px, 6vw, 30px)" : "clamp(26px, 3vw, 36px)", fontWeight: 400, color: "#f5f0e8", lineHeight: 1.2, margin: 0 }}>
                <span style={{ color: "rgba(245,240,232,0.85)" }}>{region.name}</span>{" "}
                <span style={{ fontStyle: "italic", color: "#C9A84C" }}>Wedding Vendors</span>
              </h2>
            </div>
            <CategoryCarousel
              categories={VENDOR_CATEGORIES}
              C={DARK_C}
              onSelect={(slug) => onViewRegionCategory(countrySlug, regionSlug, slug)}
              activeCategorySlugs={activeCategorySlugs}
              isMobile={isMobile}
            />
          </div>
        </section>

        {/* ═══ BROWSE BY REGION ══════════════════════════════════════════ */}
        <DirectoryBrands onViewRegion={onViewRegion} onViewCategory={onViewCategory} showInternational={false} showUK={actualCountrySlug === "england"} showItaly={actualCountrySlug === "italy"} showUSA={actualCountrySlug === "usa"} darkMode={darkMode} />


        </>)}
        {/* Quick-view modal */}
        {qvItem && (
          <QuickViewModal
            item={qvItem}
            onClose={() => setQvItem(null)}
            onViewFull={(v) => { setQvItem(null); onViewVenue(v); }}
          />
        )}
      </div>
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
// ── Luxury SVG icons — imported from shared master component
// MOVED to src/components/cards/MasterCategoryCard.jsx (shared master component)

// ── Category Carousel — show 7 per page with next/prev arrows ───────────
const CATS_PER_PAGE = 6;

function CategoryCarousel({ categories, C, onSelect, activeCategorySlugs = null, isMobile = false }) {
  const catsPerPage = isMobile ? 4 : CATS_PER_PAGE;
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(categories.length / catsPerPage);
  const start = page * catsPerPage;
  const visible = categories.slice(start, start + catsPerPage);

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
        background: hov && !disabled ? "rgba(201,168,76,0.15)" : "rgba(255,255,255,0.06)",
        border: `1px solid ${disabled ? "rgba(255,255,255,0.15)" : hov ? "#C9A84C" : "rgba(255,255,255,0.25)"}`,
        borderRadius: "50%",
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.35 : 1,
        transition: "all 0.25s",
        flexShrink: 0,
      }}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hov && !disabled ? "#C9A84C" : "rgba(255,255,255,0.7)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(6, 200px)",
          gap: isMobile ? 12 : 16,
          justifyContent: "center",
        }}
      >
        {visible.map((vc) => (
          <CategoryShortcutCard
            key={vc.slug}
            vc={vc}
            C={C}
            onClick={() => onSelect(vc.slug)}
            isEmpty={activeCategorySlugs !== null && !activeCategorySlugs.has(vc.slug)}
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
                  background: page === i ? "#C9A84C" : "rgba(255,255,255,0.25)",
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

function CategoryShortcutCard({ vc, C, onClick, isEmpty = false }) {
  return (
    <MasterCategoryCard
      category={vc}
      colors={C}
      onClick={onClick}
      isEmpty={isEmpty}
    />
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
  const heroImg = city.heroImage || city.heroImg ||
    "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80";

  return (
    <article
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: C.card,
        border: `1px solid ${hov ? C.goldDim : C.border}`,
        borderRadius: "var(--lwd-radius-card)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "all 0.5s ease",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        boxShadow: hov ? "0 12px 40px rgba(0,0,0,0.18)" : "none",
      }}
    >
      {/* ── Image ── */}
      <div style={{ height: 200, position: "relative", overflow: "hidden", background: "#0a0806" }}>
        <img
          src={heroImg}
          alt={city.name}
          loading="lazy"
          style={{
            width: "100%", height: "100%", objectFit: "cover",
            transform: hov ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.8s ease",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            background: "linear-gradient(180deg,rgba(0,0,0,0.08) 0%,rgba(0,0,0,0.6) 100%)",
          }}
        />
        {/* Listing count badge */}
        {city.listingCount > 0 && (
          <div style={{
            position: "absolute", bottom: 12, left: 12,
            background: "rgba(201,168,76,0.92)",
            borderRadius: 20, padding: "3px 10px",
            fontSize: 10, fontFamily: NU, fontWeight: 600,
            color: "#1a1208", letterSpacing: "0.4px",
          }}>
            {city.listingCount} venue{city.listingCount !== 1 ? "s" : ""}
          </div>
        )}
        {/* Arrow — appears on hover */}
        <div style={{
          position: "absolute", bottom: 12, right: 12,
          width: 28, height: 28, borderRadius: "50%",
          background: "rgba(0,0,0,0.5)",
          border: "1px solid rgba(255,255,255,0.25)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "rgba(255,255,255,0.9)", fontSize: 14,
          opacity: hov ? 1 : 0,
          transform: hov ? "translateX(0)" : "translateX(4px)",
          transition: "all 0.3s ease",
        }}>
          →
        </div>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "18px 20px 20px" }}>
        <h3 style={{
          fontFamily: GD, fontSize: 20, fontWeight: 400,
          fontStyle: "italic",
          color: hov ? C.gold : C.off,
          transition: "color 0.2s",
          margin: "0 0 8px",
          lineHeight: 1.2,
        }}>
          {city.name}
        </h3>
        {city.introEditorial && (
          <p style={{
            fontFamily: NU, fontSize: 12, color: C.grey,
            lineHeight: 1.65, fontWeight: 300, margin: 0,
            display: "-webkit-box", WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical", overflow: "hidden",
          }}>
            {city.introEditorial}
          </p>
        )}
        <div style={{
          marginTop: 14, paddingTop: 12,
          borderTop: `1px solid ${C.border}`,
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{
            fontSize: 9, fontFamily: NU, color: C.grey,
            letterSpacing: "1.2px", textTransform: "uppercase",
          }}>
            Explore destination
          </span>
          <span style={{ fontSize: 11, color: C.gold, fontFamily: NU }}>→</span>
        </div>
      </div>
    </article>
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

      {createPortal(
        <ImmersiveSearch
          isOpen={immersiveOpen}
          onClose={() => setImmersiveOpen(false)}
          onViewCategory={onViewCategory}
          onViewRegionCategory={onViewRegionCategory}
        />,
        document.body
      )}

    </section>
  );
}
