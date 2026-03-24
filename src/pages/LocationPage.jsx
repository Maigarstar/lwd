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
import SiteFooter      from "../components/sections/SiteFooter";
import DirectoryBrands from "../components/sections/DirectoryBrands";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import GCard           from "../components/cards/GCard";
import GCardMobile     from "../components/cards/GCardMobile";
import QuickViewModal  from "../components/modals/QuickViewModal";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";

// ── Data services (self-fetch when rendered standalone) ─────────────────────
import { COUNTRIES, REGIONS, CITIES } from "../data/geo";
import { fetchListings } from "../services/listings";
import { fetchLocationContent, buildLocationKey } from "../services/locationContentService";

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

  // Data references (injected from admin or context)
  countries = [],
  regions = [],
  cities = [],
  venues = [],
  vendors = [],

  // Location content data (from admin studio)
  locationContent = {},
  featuredVenueIds = [],
  featuredVendorIds = [],

  // Navigation
  onBack = () => {},
  onViewVenue = () => {},
  onViewRegion = () => {},
  onViewCountry = () => {},
  onViewCategory = () => {},

  // UI
  noIndex = false,
  footerNav = {},
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

  const isMobile = useIsMobile();
  const C = darkMode ? getDarkPalette() : getLightPalette();
  const { setChatContext } = useChat();

  // ── Self-fetch: venues, vendors, locationContent when rendered standalone ───
  const [_fetchedVenues,  setFetchedVenues]  = useState([]);
  const [_fetchedVendors, setFetchedVendors] = useState([]);
  const [_fetchedContent, setFetchedContent] = useState(null);

  useEffect(() => {
    if (!locationSlug) return;
    // Only self-fetch if parent hasn't injected data
    if (venues.length === 0) {
      const filters = {};
      if (locationType === "country") filters.country_slug = locationSlug;
      else if (locationType === "region") filters.region_slug = locationSlug;
      else if (locationType === "city")   filters.city_slug   = locationSlug;
      fetchListings({ ...filters, status: "active" })
        .then(d => setFetchedVenues(Array.isArray(d) ? d : []))
        .catch(() => {});
    }
    if (locationContent && Object.keys(locationContent).length > 0) return;
    // Build location key for Supabase fetch
    let key = null;
    if (locationType === "country") key = buildLocationKey("country", locationSlug);
    else if (locationType === "region") {
      const r = REGIONS.find(r => r.slug === locationSlug);
      if (r) key = buildLocationKey("region", locationSlug, r.countrySlug);
    } else if (locationType === "city") {
      const c = CITIES.find(c => c.slug === locationSlug);
      if (c) key = buildLocationKey("city", locationSlug, c.countrySlug, c.regionSlug);
    }
    if (key) {
      fetchLocationContent(key)
        .then(d => { if (d) setFetchedContent(d); })
        .catch(() => {});
    }
  }, [locationSlug, locationType]);

  // Merge injected props with self-fetched data
  const _venues  = venues.length  > 0 ? venues  : _fetchedVenues;
  const _vendors = vendors.length > 0 ? vendors : _fetchedVendors;

  // Merge locationContent: injected prop takes priority, then fetched, then empty
  const _locationContent = (locationContent && Object.keys(locationContent).length > 0)
    ? locationContent
    : _fetchedContent
      ? {
          heroTitle:    _fetchedContent.hero_title    || "",
          heroSubtitle: _fetchedContent.hero_subtitle || "",
          heroImage:    _fetchedContent.hero_image    || "",
          heroVideo:    _fetchedContent.hero_video    || "",
          heroImages:   _fetchedContent.metadata?.heroImages   || [],
          ctaText:      _fetchedContent.cta_text      || "Explore Venues",
          ctaLink:      _fetchedContent.cta_link      || "#",
          infoVibes:    _fetchedContent.metadata?.infoVibes    || [],
          infoServices: _fetchedContent.metadata?.infoServices || [],
          infoRegions:  _fetchedContent.metadata?.infoRegions  || [],
          seoContent:   _fetchedContent.metadata?.seoContent   || "",
          seoFaqs:      _fetchedContent.metadata?.seoFaqs      || [],
          seoHeading:   _fetchedContent.metadata?.seoHeading   || "",
          showEditorialSplit:  _fetchedContent.metadata?.showEditorialSplit  !== false,
          showLatestVenues:    _fetchedContent.metadata?.showLatestVenues    !== false,
          showLatestVendors:   _fetchedContent.metadata?.showLatestVendors   !== false,
          showPlanningGuide:   _fetchedContent.metadata?.showPlanningGuide   !== false,
          showMotto:           _fetchedContent.metadata?.showMotto           !== false,
          motto:               _fetchedContent.metadata?.motto               || "",
          mottoSubline:        _fetchedContent.metadata?.mottoSubline        || "",
          mottoBgImage:        _fetchedContent.metadata?.mottoBgImage        || "",
          mottoOverlay:        _fetchedContent.metadata?.mottoOverlay        ?? 0.55,
          editorialPara1:      _fetchedContent.metadata?.editorialPara1      || "",
          editorialPara2:      _fetchedContent.metadata?.editorialPara2      || "",
          editorialEyebrow:    _fetchedContent.metadata?.editorialEyebrow    || "",
          editorialHeadingPrefix: _fetchedContent.metadata?.editorialHeadingPrefix || "",
          editorialCtaText:    _fetchedContent.metadata?.editorialCtaText    || "",
          editorialBlocks:     _fetchedContent.metadata?.editorialBlocks     || [],
          editorialVenueMode:  _fetchedContent.metadata?.editorialVenueMode  || "latest",
          latestVenuesHeading: _fetchedContent.metadata?.latestVenuesHeading || "",
          latestVenuesSub:     _fetchedContent.metadata?.latestVenuesSub     || "",
          latestVenuesCount:   _fetchedContent.metadata?.latestVenuesCount   || 12,
          latestVenuesMode:    _fetchedContent.metadata?.latestVenuesMode    || "latest",
          latestVenuesCardStyle: _fetchedContent.metadata?.latestVenuesCardStyle || "luxury",
          latestVenuesSelected:  _fetchedContent.metadata?.latestVenuesSelected  || [],
          latestVendorsHeading: _fetchedContent.metadata?.latestVendorsHeading || "",
          latestVendorsSub:    _fetchedContent.metadata?.latestVendorsSub    || "",
          latestVendorsCount:  _fetchedContent.metadata?.latestVendorsCount  || 12,
          latestVendorsMode:   _fetchedContent.metadata?.latestVendorsMode   || "latest",
          latestVendorsCardStyle: _fetchedContent.metadata?.latestVendorsCardStyle || "luxury",
          latestVendorsSelected:  _fetchedContent.metadata?.latestVendorsSelected  || [],
          featuredVenueIds:    _fetchedContent.featured_venues  || [],
          featuredVendorIds:   _fetchedContent.featured_vendors || [],
          mapLat:   _fetchedContent.map_lat  || null,
          mapLng:   _fetchedContent.map_lng  || null,
          mapZoom:  _fetchedContent.map_zoom || 8,
        }
      : {};

  // Use geo constants as fallback when parent doesn't inject geo arrays
  const _countries = countries.length > 0 ? countries : COUNTRIES;
  const _regions   = regions.length   > 0 ? regions   : REGIONS;
  const _cities    = cities.length    > 0 ? cities    : CITIES;

  // ── Resolve current location ────────────────────────────────────────────────
  const currentLocation = useMemo(() => {
    if (locationType === "country") {
      return _countries.find(c => c.slug === locationSlug);
    } else if (locationType === "region") {
      return _regions.find(r => r.slug === locationSlug);
    } else if (locationType === "city") {
      return _cities.find(c => c.slug === locationSlug);
    }
    return null;
  }, [locationType, locationSlug, _countries, _regions, _cities]);

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
  const _featuredVenueIds  = featuredVenueIds.length  > 0 ? featuredVenueIds  : (_locationContent?.featuredVenueIds  || []);
  const _featuredVendorIds = featuredVendorIds.length > 0 ? featuredVendorIds : (_locationContent?.featuredVendorIds || []);

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

  // ── Render guard ────────────────────────────────────────────────────────────
  if (!currentLocation) {
    return (
      <div style={{ padding: "40px 20px", textAlign: "center", color: C.grey }}>
        <h2>Location not found</h2>
        <p>The {locationType} you're looking for doesn't exist.</p>
        <button onClick={onBack} style={{ marginTop: 20, padding: "10px 20px", background: C.gold, color: "#000", border: "none", borderRadius: 4, cursor: "pointer" }}>
          Back
        </button>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: C.bg, color: C.text, minHeight: "100vh" }}>

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

        {/* Breadcrumb / Navigation */}
        <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: "12px 0", textAlign: "center", fontFamily: "'Neue Haas Display', serif", fontSize: 12, color: C.grey }}>
          {locationType === "country" && currentLocation.name}
          {locationType === "region" && (
            <>
              {parentLocation?.name} › {currentLocation.name}
            </>
          )}
          {locationType === "city" && (
            <>
              {parentLocation?.name} › {currentLocation.name}
            </>
          )}
        </div>

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

        {/* Editorial Split — "The Art of the {Location} Wedding" */}
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

        {/* Latest Venues Strip */}
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
        />
        )}

        {/* Latest Vendors Strip */}
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
        />
        )}

        {/* Search & Filters */}
        <div style={{ padding: "20px", background: C.bg }}>
          <CountrySearchBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewMode={setViewMode}
            sortMode={sortMode}
            onSortChange={setSortMode}
          />
        </div>

        {/* Featured Venues Section */}
        {featuredVenues.length > 0 && (
          <div style={{ padding: "40px 20px", background: C.bg }}>
            <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 20, marginBottom: 24, textAlign: "center" }}>
              {_locationContent?.featuredVenuesTitle || "Signature Venues"}
            </h3>
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
          </div>
        )}

        {/* Map Section */}
        {locationType !== "city" && (
          <MapSection
            title={`Explore ${currentLocation.name}`}
            venues={locationVenues.slice(0, 20)}
            lat={parseFloat(_locationContent?.mapLat || currentLocation.mapLat || "0")}
            lng={parseFloat(_locationContent?.mapLng || currentLocation.mapLng || "0")}
            zoom={_locationContent?.mapZoom || 8}
            C={C}
            onMarkerClick={(venueId) => onViewVenue && onViewVenue(venueId)}
          />
        )}

        {/* Main Venue Grid */}
        <div style={{ padding: "40px 20px", background: C.bg }}>
          <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 18, marginBottom: 20, textAlign: "center" }}>
            All Venues
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(250px, 1fr))",
            gap: 20,
            maxWidth: "1400px",
            margin: "0 auto",
          }}>
            {locationVenues.slice(0, visibleCount).map(venue => (
              <GCard
                key={venue.id}
                data={venue}
                onClick={() => setQvItem(venue)}
                C={C}
              />
            ))}
          </div>

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

        {/* Featured Vendors Section */}
        {featuredVendors.length > 0 && (
          <div style={{ padding: "40px 20px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 20, marginBottom: 24, textAlign: "center" }}>
              {_locationContent?.featuredVendorsTitle || "Top Wedding Planners"}
            </h3>
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

        {/* Footer */}
        <SiteFooter C={C} onNavigate={onViewCountry} footerNav={footerNav} />
      </div>
    </ThemeCtx.Provider>
  );
}
