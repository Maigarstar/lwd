// ─── src/pages/LocationPage.jsx ──────────────────────────────────────────────────
// Dynamic location page renderer — country, region, city pages unified
// Loads location data by slug and renders appropriate template

import "../category.css";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";

import { ThemeCtx }        from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";

// ── Components ──────────────────────────────────────────────────────────────
import { useChat }     from "../chat/ChatContext";
import Hero            from "../components/hero/Hero";
import InfoStrip       from "../components/sections/InfoStrip";
import LatestSplit          from "../components/sections/LatestSplit";
import LatestVenuesStrip    from "../components/sections/LatestVenuesStrip";
import LatestVendorsStrip   from "../components/sections/LatestVendorsStrip";
import MottoStrip           from "../components/sections/MottoStrip";
import MapSection      from "../components/sections/MapSection";
import SEOBlock        from "../components/sections/SEOBlock";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import CatNav          from "../components/nav/CatNav";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import GCard           from "../components/cards/GCard";
import GCardMobile     from "../components/cards/GCardMobile";
import HCard           from "../components/cards/HCard";
import QuickViewModal  from "../components/modals/QuickViewModal";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import SliderNav       from "../components/ui/SliderNav";

// ── Data services (self-fetch when rendered standalone) ─────────────────────
import { COUNTRIES, REGIONS, CITIES } from "../data/geo";
import { fetchListings } from "../services/listings";
import { fetchLocationContent, buildLocationKey, fetchLocationMetadata } from "../services/locationContentService";

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
export default function LocationPage({
  locationType = "country", // "country" | "region" | "city"
  locationSlug = "",

  // Data references (injected from admin or context) — null defaults avoid new [] on every render
  countries = null,
  regions = null,
  cities = null,
  venues = null,
  vendors = null,

  // Location content data (from admin studio) — null default avoids new {} on every render
  locationContent = null,
  featuredVenueIds = null,
  featuredVendorIds = null,

  // Navigation
  onBack = () => {},
  onViewVenue = () => {},
  onViewRegion = () => {},
  onViewCountry = () => {},
  onViewCategory = () => {},

  // UI
  noIndex = false,
  footerNav = {},
  hideNav = false, // When true, hides CatNav (for admin preview mode)
}) {
  // ── State ──────────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({ region: "all", capacity: "any", style: [], price: "any" });
  const [viewMode, setViewMode] = useState("grid");
  const [sortMode, setSortMode] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(12);
  const [savedIds, setSavedIds] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const [qvItem, setQvItem] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);

  // ── Location resolution state ───────────────────────────────────────────────
  // resolving = true while Supabase lookup is in flight. No 404 until this is false.
  const [resolving, setResolving] = useState(true);
  const [supabaseRow, setSupabaseRow] = useState(null);    // Full Supabase locations row
  const [draftMode, setDraftMode] = useState(false);

  const isMobile = useIsMobile();
  const C = darkMode ? getDarkPalette() : getLightPalette();
  const { setChatContext } = useChat();

  // ═════════════════════════════════════════════════════════════════════════════
  // CANONICAL LOCATION RESOLUTION
  // ═════════════════════════════════════════════════════════════════════════════
  // Supabase locations table is the SINGLE source of truth for all locations.
  // Static geo.js arrays are a temporary migration fallback only.
  //
  // Resolution order:
  //   1. Query Supabase for location_key → canonical row
  //   2. If found: use it, check published state
  //   3. If not found in Supabase: check static geo.js as migration fallback
  //   4. If still not found: render 404 (only after lookup completes)
  //
  // The loading state prevents flash-404 during async resolution.
  // ═════════════════════════════════════════════════════════════════════════════

  // ── Self-fetch: venues, vendors when rendered standalone ─────────────────────
  const [_fetchedVenues,  setFetchedVenues]  = useState([]);
  const [_fetchedVendors, setFetchedVendors] = useState([]);
  const [_fetchedContent, setFetchedContent] = useState(null);

  // ── CANONICAL RESOLUTION: Supabase first, then static fallback ────────────
  // This is the SINGLE resolution effect. It runs on mount and slug change.
  // It sets resolving=false only after Supabase lookup completes.
  useEffect(() => {
    if (!locationSlug || !locationType) {
      setResolving(false);
      setSupabaseRow(null);
      setDraftMode(false);
      return;
    }

    let cancelled = false;
    setResolving(true);
    setSupabaseRow(null);
    setDraftMode(false);

    // Build location_key for Supabase lookup
    let locationKey = null;
    if (locationType === "country") {
      locationKey = buildLocationKey("country", locationSlug);
    } else if (locationType === "region") {
      // Regions need parent slug — check static arrays for now (migration support)
      const region = REGIONS.find(r => r.slug === locationSlug);
      if (region) locationKey = buildLocationKey("region", locationSlug, region.countrySlug);
    } else if (locationType === "city") {
      const city = CITIES.find(c => c.slug === locationSlug);
      if (city) locationKey = buildLocationKey("city", locationSlug, city.countrySlug, city.regionSlug);
    }

    // Query Supabase for the canonical location record
    const resolve = async () => {
      try {
        if (locationKey) {
          // Fetch full content row (not just metadata) — this IS the canonical record
          const row = await fetchLocationContent(locationKey);
          if (!cancelled && row) {
            setSupabaseRow(row);
            setDraftMode(!row.published);
            setFetchedContent(row);
            setResolving(false);
            return; // Found in Supabase — done
          }
        }
      } catch (err) {
        console.warn("[LocationPage] Supabase lookup failed, falling back to static:", err);
      }

      // Not found in Supabase (or key couldn't be built) — mark resolution complete.
      // currentLocation resolver will check static arrays as migration fallback.
      if (!cancelled) {
        setSupabaseRow(null);
        setDraftMode(false);
        setResolving(false);
      }
    };

    resolve();
    return () => { cancelled = true; };
  }, [locationSlug, locationType]);

  // ── Self-fetch venues/vendors once we know the location exists ──────────────
  useEffect(() => {
    if (!locationSlug || resolving) return;
    // Only self-fetch if parent hasn't injected data
    if (!venues || venues.length === 0) {
      const f = { listing_type: 'venue' };
      if (locationType === "country") f.country_slug = locationSlug;
      else if (locationType === "region") f.region_slug = locationSlug;
      else if (locationType === "city")   f.city_slug   = locationSlug;
      fetchListings({ ...f, status: "published" })
        .then(d => setFetchedVenues(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
    if (!vendors || vendors.length === 0) {
      const f = { listing_type: 'vendor' };
      if (locationType === "country") f.country_slug = locationSlug;
      else if (locationType === "region") f.region_slug = locationSlug;
      else if (locationType === "city")   f.city_slug   = locationSlug;
      fetchListings({ ...f, status: "published" })
        .then(d => setFetchedVendors(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
  }, [locationSlug, locationType, resolving]);

  // Merge injected props with self-fetched data — all memoised to avoid new object refs on every render
  const _venues  = useMemo(() => (venues  && venues.length  > 0) ? venues  : _fetchedVenues,  [venues,  _fetchedVenues]);
  const _vendors = useMemo(() => (vendors && vendors.length > 0) ? vendors : _fetchedVendors, [vendors, _fetchedVendors]);

  // Merge locationContent: injected prop takes priority, then fetched, then empty
  const _locationContent = useMemo(() => {
    if (locationContent) return locationContent;
    if (!_fetchedContent) return {};
    const raw = _fetchedContent.metadata || {};
    const m = typeof raw === 'string' ? JSON.parse(raw) : raw;
    return {
      heroTitle:    _fetchedContent.hero_title    || "",
      heroSubtitle: _fetchedContent.hero_subtitle || "",
      heroImage:    _fetchedContent.hero_image    || "",
      heroVideo:    _fetchedContent.hero_video    || "",
      heroImages:   m.heroImages   || [],
      ctaText:      _fetchedContent.cta_text      || "Explore Venues",
      ctaLink:      _fetchedContent.cta_link      || "#",
      infoVibes:    m.infoVibes    || [],
      infoServices: m.infoServices || [],
      infoRegions:  m.infoRegions  || [],
      seoContent:   m.seoContent   || "",
      seoFaqs:      m.seoFaqs      || [],
      seoHeading:   m.seoHeading   || "",
      showEditorialSplit:  m.showEditorialSplit  !== false,
      showLatestVenues:    m.showLatestVenues    !== false,
      showLatestVendors:   m.showLatestVendors   !== false,
      showPlanningGuide:   m.showPlanningGuide   !== false,
      showMotto:           m.showMotto           !== false,
      motto:               m.motto               || "",
      mottoSubline:        m.mottoSubline        || "",
      mottoBgImage:        m.mottoBgImage        || "",
      mottoOverlay:        m.mottoOverlay        ?? 0.55,
      editorialPara1:      m.editorialPara1      || "",
      editorialPara2:      m.editorialPara2      || "",
      editorialEyebrow:    m.editorialEyebrow    || "",
      editorialHeadingPrefix: m.editorialHeadingPrefix || "",
      editorialCtaText:    m.editorialCtaText    || "",
      editorialBlocks:     m.editorialBlocks     || [],
      editorialVenueMode:  m.editorialVenueMode  || "latest",
      latestVenuesHeading: m.latestVenuesHeading || "",
      latestVenuesSub:     m.latestVenuesSub     || "",
      latestVenuesCount:   m.latestVenuesCount   || 12,
      latestVenuesMode:    m.latestVenuesMode    || "latest",
      latestVenuesCardStyle: m.latestVenuesCardStyle || "luxury",
      latestVenuesSelected:  m.latestVenuesSelected  || [],
      latestVendorsHeading: m.latestVendorsHeading || "",
      latestVendorsSub:    m.latestVendorsSub    || "",
      latestVendorsCount:  m.latestVendorsCount  || 12,
      latestVendorsMode:   m.latestVendorsMode   || "latest",
      latestVendorsCardStyle: m.latestVendorsCardStyle || "luxury",
      latestVendorsSelected:  m.latestVendorsSelected  || [],
      featuredVenueIds:    _fetchedContent.featured_venues  || [],
      featuredVendorIds:   _fetchedContent.featured_vendors || [],
      mapLat:  _fetchedContent.map_lat  || null,
      mapLng:  _fetchedContent.map_lng  || null,
      mapZoom: _fetchedContent.map_zoom || 8,
    };
  }, [locationContent, _fetchedContent]);

  // Use geo constants as fallback when parent doesn't inject geo arrays
  const _countries = useMemo(() => (countries && countries.length > 0) ? countries : COUNTRIES, [countries]);
  const _regions   = useMemo(() => (regions   && regions.length   > 0) ? regions   : REGIONS,   [regions]);
  const _cities    = useMemo(() => (cities    && cities.length    > 0) ? cities    : CITIES,     [cities]);

  // ── Resolve current location ────────────────────────────────────────────────
  // Supabase is the canonical source. Static geo.js is migration fallback only.
  const currentLocation = useMemo(() => {
    // 1. SUPABASE (canonical) — if we have a row, use it
    if (supabaseRow) {
      // Build a location object from the canonical Supabase record.
      // Use hero_title as the display name if set, otherwise derive from slug.
      const nameFromSlug = locationSlug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
      return {
        slug: locationSlug,
        name: supabaseRow.hero_title || nameFromSlug,
        description: supabaseRow.hero_subtitle || "",
        countrySlug: supabaseRow.country_slug,
        regionSlug: supabaseRow.region_slug,
        citySlug: supabaseRow.city_slug,
        published: supabaseRow.published,
        _source: "supabase", // Tracks where this came from
      };
    }

    // 2. STATIC FALLBACK (migration support only) — check geo.js arrays
    //    This path will shrink as locations are migrated to Supabase.
    if (locationType === "country") {
      const s = _countries.find(c => c.slug === locationSlug);
      if (s) return { ...s, _source: "static" };
    } else if (locationType === "region") {
      const s = _regions.find(r => r.slug === locationSlug);
      if (s) return { ...s, _source: "static" };
    } else if (locationType === "city") {
      const s = _cities.find(c => c.slug === locationSlug);
      if (s) return { ...s, _source: "static" };
    }

    // 3. Not found in either source
    return null;
  }, [locationType, locationSlug, _countries, _regions, _cities, supabaseRow]);

  // ── Get parent location for breadcrumbs ─────────────────────────────────────
  const parentLocation = useMemo(() => {
    if (!currentLocation) return null;
    if (locationType === "region") {
      return _countries.find(c => c.slug === currentLocation.countrySlug);
    } else if (locationType === "city") {
      return _regions.find(r => r.slug === currentLocation.regionSlug);
    }
    return null;
  }, [currentLocation, locationType, _countries, _regions]);

  // Merged featured IDs: from injected props OR fetched content
  const _featuredVenueIds  = (featuredVenueIds  && featuredVenueIds.length  > 0) ? featuredVenueIds  : (_locationContent?.featuredVenueIds  || []);
  const _featuredVendorIds = (featuredVendorIds && featuredVendorIds.length > 0) ? featuredVendorIds : (_locationContent?.featuredVendorIds || []);

  // ── Get featured venues/vendors for this location ────────────────────────────
  const featuredVenues = useMemo(() => {
    if (locationType === "country") {
      return _venues
        .filter(v => v.countrySlug === currentLocation?.slug && _featuredVenueIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "region") {
      return _venues
        .filter(v => v.regionSlug === currentLocation?.slug && _featuredVenueIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "city") {
      return _venues
        .filter(v => v.citySlug === currentLocation?.slug && _featuredVenueIds.includes(v.id))
        .slice(0, 4);
    }
    return [];
  }, [currentLocation, locationType, _venues, _featuredVenueIds]);

  const featuredVendors = useMemo(() => {
    if (locationType === "country") {
      return _vendors
        .filter(v => v.countrySlug === currentLocation?.slug && _featuredVendorIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "region") {
      return _vendors
        .filter(v => v.regionSlug === currentLocation?.slug && _featuredVendorIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "city") {
      return _vendors
        .filter(v => v.citySlug === currentLocation?.slug && _featuredVendorIds.includes(v.id))
        .slice(0, 4);
    }
    return [];
  }, [currentLocation, locationType, _vendors, _featuredVendorIds]);

  // ── Get filterable venues for this location ─────────────────────────────────
  const locationVenues = useMemo(() => {
    let filtered = [];
    if (locationType === "country") {
      filtered = _venues.filter(v => v.countrySlug === currentLocation?.slug);
    } else if (locationType === "region") {
      filtered = _venues.filter(v => v.regionSlug === currentLocation?.slug);
    } else if (locationType === "city") {
      filtered = _venues.filter(v => v.citySlug === currentLocation?.slug);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [currentLocation, locationType, _venues, searchQuery]);

  // ── Compute editorial split venues (Latest / Random / Featured) ─────────────
  const editorialVenues = useMemo(() => {
    const mode = _locationContent?.editorialVenueMode || 'latest';
    if (mode === 'featured' && featuredVenues.length >= 5) return featuredVenues.slice(0, 5);
    if (mode === 'random' && locationVenues.length >= 5) {
      const shuffled = [...locationVenues].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    }
    return locationVenues.slice(0, 5);
  }, [locationVenues, featuredVenues, _locationContent?.editorialVenueMode]);

  // ── Stable slice for the map (new array ref on every render breaks map effect) ─
  const mapVenues = useMemo(() => locationVenues.slice(0, 40), [locationVenues]);

  // ── Compute Latest Venues strip venues ──────────────────────────────────────
  const latestVenuesVenues = useMemo(() => {
    const mode  = _locationContent?.latestVenuesMode  || 'latest';
    const count = _locationContent?.latestVenuesCount || 12;

    if (mode === 'selected') {
      const ids = _locationContent?.latestVenuesSelected || [];
      return ids.map(id => _venues.find(v => v.id === id)).filter(Boolean);
    }
    if (mode === 'featured' && featuredVenues.length > 0) return featuredVenues.slice(0, count);
    if (mode === 'random' && locationVenues.length > 0) {
      return [...locationVenues].sort(() => Math.random() - 0.5).slice(0, count);
    }
    return locationVenues.slice(0, count);
  }, [locationVenues, featuredVenues, _venues, _locationContent?.latestVenuesMode, _locationContent?.latestVenuesCount, _locationContent?.latestVenuesSelected]);

  // ── Get vendors for this location ────────────────────────────────────────────
  const locationVendors = useMemo(() => {
    let filtered = [];
    if (locationType === "country") {
      filtered = _vendors.filter(v => v.countrySlug === currentLocation?.slug);
    } else if (locationType === "region") {
      filtered = _vendors.filter(v => v.regionSlug === currentLocation?.slug);
    } else if (locationType === "city") {
      filtered = _vendors.filter(v => v.citySlug === currentLocation?.slug);
    }
    return filtered;
  }, [currentLocation, locationType, _vendors]);

  // ── Compute Latest Vendors strip vendors ─────────────────────────────────────
  const latestVendorsVenues = useMemo(() => {
    const mode  = _locationContent?.latestVendorsMode  || 'latest';
    const count = _locationContent?.latestVendorsCount || 12;

    if (mode === 'selected') {
      const ids = _locationContent?.latestVendorsSelected || [];
      return ids.map(id => _vendors.find(v => v.id === id)).filter(Boolean);
    }
    if (mode === 'featured' && featuredVendors.length > 0) return featuredVendors.slice(0, count);
    if (mode === 'random' && locationVendors.length > 0) {
      return [...locationVendors].sort(() => Math.random() - 0.5).slice(0, count);
    }
    return locationVendors.slice(0, count);
  }, [locationVendors, featuredVendors, _vendors, _locationContent?.latestVendorsMode, _locationContent?.latestVendorsCount, _locationContent?.latestVendorsSelected]);

  // ── Hero section content ────────────────────────────────────────────────────
  const heroData = useMemo(() => {
    if (!currentLocation) return null;

    // Build eyebrow: "Venues · Italy", "Venues · Tuscany, Italy", "Venues · Siena, Tuscany"
    let eyebrow = `Venues · ${currentLocation.name}`;
    if (locationType === "region" && parentLocation) {
      eyebrow = `Venues · ${currentLocation.name}, ${parentLocation.name}`;
    } else if (locationType === "city" && parentLocation) {
      eyebrow = `Venues · ${currentLocation.name}, ${parentLocation.name}`;
    }

    return {
      title: _locationContent?.heroTitle || currentLocation.name,
      subtitle: _locationContent?.heroSubtitle || currentLocation.description || "",
      backgroundImage: _locationContent?.heroImage || "",
      backgroundVideo: _locationContent?.heroVideo || "",
      ctaText: _locationContent?.ctaText || "Explore Venues",
      ctaLink: _locationContent?.ctaLink || "#",
      eyebrow,
    };
  }, [currentLocation, locationType, parentLocation, _locationContent]);

  // ── SEO content ─────────────────────────────────────────────────────────────
  const seoData = useMemo(() => {
    if (!currentLocation) return null;

    return {
      title: currentLocation.seoTitleTemplate || `${currentLocation.name} | LWD`,
      description: currentLocation.metaDescriptionTemplate || currentLocation.description || "",
      keywords: (currentLocation.focusKeywords || []).join(", "),
      ogTitle: currentLocation.ogTitle || currentLocation.name,
      ogDescription: currentLocation.ogDescription || currentLocation.description || "",
      ogImage: currentLocation.thumbnail || _locationContent?.heroImage || "",
      noIndex: noIndex,
    };
  }, [currentLocation, _locationContent, noIndex]);

  // ── Feed location content into Aura's context ───────────────────────────────
  useEffect(() => {
    if (!currentLocation) return;
    setChatContext({
      page: `${locationType}-location`,
      country: locationType === "country" ? currentLocation.name : parentLocation?.name || "",
      region: locationType === "region" ? currentLocation.name : locationType === "city" ? parentLocation?.name : "",
      locationContent: {
        name: currentLocation.name,
        type: locationType,
        editorial: _locationContent?.seoContent || currentLocation.evergreenContent || "",
        faqs: Array.isArray(_locationContent?.seoFaqs) ? _locationContent.seoFaqs : [],
        vibes: Array.isArray(_locationContent?.infoVibes) ? _locationContent.infoVibes : [],
        services: Array.isArray(_locationContent?.infoServices) ? _locationContent.infoServices : [],
        heroSubtitle: _locationContent?.heroSubtitle || "",
        focusKeywords: (currentLocation.focusKeywords || []).join(", "),
      },
    });
  }, [currentLocation, locationType, parentLocation, _locationContent, setChatContext]);

  // ── Scroll tracking for nav slide-up effect ─────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ── Render guard: loading → not-found → content ────────────────────────────
  // CRITICAL: No 404 until Supabase lookup has completed (resolving === false).
  if (resolving) {
    return (
      <div style={{
        minHeight: "100vh",
        background: C.black,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ textAlign: "center", color: C.grey }}>
          <div style={{
            width: 36, height: 36, border: `2px solid ${C.gold}`,
            borderTopColor: "transparent", borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
            margin: "0 auto 16px",
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <p style={{ fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            Loading location…
          </p>
        </div>
      </div>
    );
  }

  if (!currentLocation) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: C.grey, minHeight: "100vh", background: C.black }}>
        <h2>Location not found</h2>
        <p>The {locationType} "{locationSlug}" doesn't exist.</p>
        <button onClick={onBack} style={{ marginTop: 20, padding: "10px 20px", background: C.gold, color: "#000", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Back
        </button>
      </div>
    );
  }

  // Draft mode indicator (displayed when location exists but not yet published)
  const draftIndicator = draftMode ? (
    <div style={{
      padding: "12px 20px",
      background: "rgba(255, 193, 7, 0.15)",
      borderBottom: "1px solid rgba(255, 193, 7, 0.3)",
      color: "#ffc107",
      textAlign: "center",
      fontSize: 13,
      fontWeight: 500,
    }}>
      Draft — This location is not yet published.
    </div>
  ) : null;

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.black, color: C.white, minHeight: "100vh" }}>

        {/* Draft Mode Indicator — shown when location is in draft status */}
        {draftIndicator}

        {/* Fixed Navigation — hidden in admin preview mode */}
        {!hideNav && (
          <CatNav
            onBack={onBack}
            scrolled={scrolled}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(d => !d)}
          />
        )}

        {/* Hero Section */}
        {heroData && (
          <Hero
            title={heroData.title}
            subtitle={heroData.subtitle}
            backgroundImage={heroData.backgroundImage}
            backgroundVideo={heroData.backgroundVideo}
            ctaText={heroData.ctaText}
            ctaLink={heroData.ctaLink}
            eyebrow={heroData.eyebrow}
            C={C}
            onBack={onBack}
          />
        )}


        {/* Info Strip */}
        {locationType === "country" && (
          <InfoStrip
            regionNames={
              (Array.isArray(_locationContent?.infoRegions) && _locationContent.infoRegions.length > 0)
                ? _locationContent.infoRegions
                : _regions.filter(r => r.countrySlug === currentLocation.slug).map(r => r.name)
            }
            vibes={_locationContent?.infoVibes}
            services={_locationContent?.infoServices}
            C={C}
          />
        )}

        {/* Editorial Split — "The Art of the {Location} Wedding" — Hidden when map is open */}
        {_locationContent?.showEditorialSplit !== false && editorialVenues.length >= 5 && (
          <LatestSplit
            venues={editorialVenues}
            locationName={currentLocation.name}
            eyebrow={_locationContent?.editorialEyebrow || ''}
            headingPrefix={_locationContent?.editorialHeadingPrefix || ''}
            ctaText={_locationContent?.editorialCtaText || ''}
            para1={_locationContent?.editorialPara1 || ""}
            para2={_locationContent?.editorialPara2 || ""}
            infoBlocks={
              Array.isArray(_locationContent?.editorialBlocks)
                ? _locationContent.editorialBlocks
                : []
            }
          />
        )}

        {/* Search & Filters — Sticky */}
        <div style={{ position: "sticky", top: 61, zIndex: 100, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <CountrySearchBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewMode={setViewMode}
            sortMode={sortMode}
            onSortChange={setSortMode}
            total={locationVenues.length}
            regions={_regions.filter(r => r.countrySlug === currentLocation.slug).map(r => ({ slug: r.slug, name: r.name }))}
            countryFilter={currentLocation.slug}
            mapContent={
              <MapSection
                title={`Explore ${currentLocation.name}`}
                venues={mapVenues}
                lat={parseFloat(_locationContent?.mapLat || currentLocation.mapLat || "0")}
                lng={parseFloat(_locationContent?.mapLng || currentLocation.mapLng || "0")}
                zoom={_locationContent?.mapZoom || 8}
                C={C}
                onMarkerClick={(venueId) => onViewVenue && onViewVenue(venueId)}
              />
            }
          />
        </div>

        {/* Latest Venues Strip — Hidden when map is open */}
        {_locationContent?.showLatestVenues !== false && (
        <LatestVenuesStrip
          venues={latestVenuesVenues}
          heading={_locationContent?.latestVenuesHeading || ''}
          subtext={_locationContent?.latestVenuesSub || ''}
          locationName={currentLocation.name}
          onViewVenue={onViewVenue}
          onQuickView={setQvItem}
          isMobile={isMobile}
          cardStyle={_locationContent?.latestVenuesCardStyle || 'luxury'}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
        )}

        {/* Latest Vendors Strip — Hidden when map is open */}
        {_locationContent?.showLatestVendors !== false && (
        <LatestVendorsStrip
          vendors={latestVendorsVenues}
          heading={_locationContent?.latestVendorsHeading || ''}
          subtext={_locationContent?.latestVendorsSub || ''}
          locationName={currentLocation.name}
          onViewVendor={onViewVenue}
          onQuickView={setQvItem}
          isMobile={isMobile}
          cardStyle={_locationContent?.latestVendorsCardStyle || 'luxury'}
          viewMode={viewMode}
          onViewMode={setViewMode}
        />
        )}

        {/* Featured Venues Section — Hidden when map is open */}
        {featuredVenues.length > 0 && (
          <div style={{ padding: "40px 20px", background: C.card }}>
            <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 20, marginBottom: 24, textAlign: "center" }}>
              {_locationContent?.featuredVenuesTitle || "Signature Venues"}
            </h3>
            {viewMode === "grid" ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 20,
                maxWidth: "1400px",
                margin: "0 auto",
              }}>
                {featuredVenues.map(venue => (
                  <LuxuryVenueCard
                    key={venue.id}
                    venue={venue}
                    onClick={() => onViewVenue && onViewVenue(venue.id)}
                    C={C}
                  />
                ))}
              </div>
            ) : (
              <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                {featuredVenues.map(venue => (
                  <HCard
                    key={venue.id}
                    v={venue}
                    onView={() => onViewVenue && onViewVenue(venue.id)}
                    onQuickView={setQvItem}
                    onSave={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Main Venue Grid — Hidden when map is open */}
        {(
        <div style={{ padding: "40px 20px", background: C.card }}>
          <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 18, marginBottom: 20, textAlign: "center" }}>
            All Venues
          </h3>
          {viewMode === "grid" ? (
            <SliderNav className="lwd-venue-grid" cardWidth={isMobile ? 300 : 340} gap={isMobile ? 12 : 16}>
              {locationVenues.slice(0, visibleCount).filter(venue => venue?.imgs?.length > 0).map(venue => (
                <div key={venue.id} className="lwd-venue-card" style={{ flex: isMobile ? "0 0 300px" : "0 0 340px", scrollSnapAlign: "start" }}>
                  {isMobile ? (
                    <GCardMobile v={venue} onView={onViewVenue} />
                  ) : (
                    <GCard
                      v={venue}
                      onView={onViewVenue}
                      onQuickView={setQvItem}
                      onSave={() => {}}
                    />
                  )}
                </div>
              ))}
            </SliderNav>
          ) : (
            <div aria-label="Venue list" style={{ maxWidth: 1280, margin: "0 auto" }}>
              {locationVenues.slice(0, visibleCount).filter(venue => venue?.imgs?.length > 0).map(venue => (
                <HCard
                  key={venue.id}
                  v={venue}
                  onView={onViewVenue}
                  onQuickView={setQvItem}
                  onSave={() => {}}
                />
              ))}
            </div>
          )}

          {visibleCount < locationVenues.length && (
            <div style={{ textAlign: "center", marginTop: 30 }}>
              <button
                onClick={() => setVisibleCount(v => v + 12)}
                style={{
                  padding: "12px 24px",
                  background: C.gold,
                  color: "#000",
                  border: "none",
                  borderRadius: 4,
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Load More
              </button>
            </div>
          )}
        </div>
        )}

        {/* Featured Vendors Section — Hidden when map is open */}
        {featuredVendors.length > 0 && (
          <div style={{ padding: "40px 20px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 20, marginBottom: 24, textAlign: "center" }}>
              {_locationContent?.featuredVendorsTitle || "Top Wedding Planners"}
            </h3>
            {viewMode === "grid" ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(300px, 1fr))",
                gap: 20,
                maxWidth: "1400px",
                margin: "0 auto",
              }}>
                {featuredVendors.map(vendor => (
                  <LuxuryVendorCard
                    key={vendor.id}
                    vendor={vendor}
                    onClick={() => onViewVenue && onViewVenue(vendor.id)}
                    C={C}
                  />
                ))}
              </div>
            ) : (
              <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                {featuredVendors.map(vendor => (
                  <HCard
                    key={vendor.id}
                    v={vendor}
                    onView={() => onViewVenue && onViewVenue(vendor.id)}
                    onQuickView={setQvItem}
                    onSave={() => {}}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* SEO Block / Planning Guide */}
        {seoData && _locationContent?.showPlanningGuide !== false && (
          <SEOBlock
            title={currentLocation.name}
            seoHeading={_locationContent?.seoHeading || ''}
            content={_locationContent?.seoContent || currentLocation.evergreenContent || ""}
            faqs={_locationContent?.seoFaqs}
            regionNames={_regions
              .filter(r => r.countrySlug === currentLocation.slug)
              .map(r => r.name)}
            venueCount={locationVenues.length}
            regionCount={_regions.filter(r => r.countrySlug === currentLocation.slug).length}
            C={C}
          />
        )}

        {/* Motto / Quote Banner */}
        {_locationContent?.showMotto !== false && (
          <MottoStrip
            motto={
              _locationContent?.motto ||
              `${currentLocation.name}, where every moment becomes a memory worth keeping forever.`
            }
            subline={_locationContent?.mottoSubline || ''}
            backgroundImage={_locationContent?.mottoBgImage || ''}
            overlayOpacity={
              _locationContent?.mottoOverlay != null
                ? parseFloat(_locationContent.mottoOverlay)
                : 0.55
            }
          />
        )}

        {/* Quick View Modal */}
        {qvItem && (
          <QuickViewModal
            item={qvItem}
            onClose={() => setQvItem(null)}
            onViewFull={() => {
              onViewVenue && onViewVenue(qvItem.id);
              setQvItem(null);
            }}
            C={C}
          />
        )}
      </div>
    </ThemeCtx.Provider>
  );
}
