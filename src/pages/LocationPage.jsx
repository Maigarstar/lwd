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
import LatestSplit     from "../components/sections/LatestSplit";
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

// ── Data ────────────────────────────────────────────────────────────────────
// Import directory data (will be in AdminDashboard)
// For now, we'll receive it as props or fetch from context

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

  // ── Resolve current location ────────────────────────────────────────────────
  const currentLocation = useMemo(() => {
    if (locationType === "country") {
      return countries.find(c => c.slug === locationSlug);
    } else if (locationType === "region") {
      return regions.find(r => r.slug === locationSlug);
    } else if (locationType === "city") {
      return cities.find(c => c.slug === locationSlug);
    }
    return null;
  }, [locationType, locationSlug, countries, regions, cities]);

  // ── Get parent location for breadcrumbs ─────────────────────────────────────
  const parentLocation = useMemo(() => {
    if (!currentLocation) return null;
    if (locationType === "region") {
      return countries.find(c => c.slug === currentLocation.countrySlug);
    } else if (locationType === "city") {
      return regions.find(r => r.slug === currentLocation.regionSlug);
    }
    return null;
  }, [currentLocation, locationType, countries, regions]);

  // ── Get featured venues/vendors for this location ────────────────────────────
  const featuredVenues = useMemo(() => {
    if (locationType === "country") {
      return venues
        .filter(v => v.countrySlug === currentLocation?.slug && featuredVenueIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "region") {
      return venues
        .filter(v => v.regionSlug === currentLocation?.slug && featuredVenueIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "city") {
      return venues
        .filter(v => v.citySlug === currentLocation?.slug && featuredVenueIds.includes(v.id))
        .slice(0, 4);
    }
    return [];
  }, [currentLocation, locationType, venues, featuredVenueIds]);

  const featuredVendors = useMemo(() => {
    if (locationType === "country") {
      return vendors
        .filter(v => v.countrySlug === currentLocation?.slug && featuredVendorIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "region") {
      return vendors
        .filter(v => v.regionSlug === currentLocation?.slug && featuredVendorIds.includes(v.id))
        .slice(0, 6);
    } else if (locationType === "city") {
      return vendors
        .filter(v => v.citySlug === currentLocation?.slug && featuredVendorIds.includes(v.id))
        .slice(0, 4);
    }
    return [];
  }, [currentLocation, locationType, vendors, featuredVendorIds]);

  // ── Get filterable venues for this location ─────────────────────────────────
  const locationVenues = useMemo(() => {
    let filtered = [];
    if (locationType === "country") {
      filtered = venues.filter(v => v.countrySlug === currentLocation?.slug);
    } else if (locationType === "region") {
      filtered = venues.filter(v => v.regionSlug === currentLocation?.slug);
    } else if (locationType === "city") {
      filtered = venues.filter(v => v.citySlug === currentLocation?.slug);
    }

    // Apply search query
    if (searchQuery) {
      filtered = filtered.filter(v =>
        v.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (v.description || "").toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [currentLocation, locationType, venues, searchQuery]);

  // ── Hero section content ────────────────────────────────────────────────────
  const heroData = useMemo(() => {
    if (!currentLocation) return null;

    return {
      title: locationContent?.heroTitle || currentLocation.name,
      subtitle: locationContent?.heroSubtitle || currentLocation.description || "",
      backgroundImage: locationContent?.heroImage || "",
      backgroundVideo: locationContent?.heroVideo || "",
      ctaText: locationContent?.ctaText || "Explore Venues",
      ctaLink: locationContent?.ctaLink || "#",
    };
  }, [currentLocation, locationContent]);

  // ── SEO content ─────────────────────────────────────────────────────────────
  const seoData = useMemo(() => {
    if (!currentLocation) return null;

    return {
      title: currentLocation.seoTitleTemplate || `${currentLocation.name} | LWD`,
      description: currentLocation.metaDescriptionTemplate || currentLocation.description || "",
      keywords: (currentLocation.focusKeywords || []).join(", "),
      ogTitle: currentLocation.ogTitle || currentLocation.name,
      ogDescription: currentLocation.ogDescription || currentLocation.description || "",
      ogImage: currentLocation.thumbnail || locationContent?.heroImage || "",
      noIndex: noIndex,
    };
  }, [currentLocation, locationContent, noIndex]);

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
            title={`${locationVenues.length} Luxury Venues in ${currentLocation.name}`}
            subtitle="Browse curated wedding destinations across the country"
            C={C}
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
              {locationContent?.featuredVenuesTitle || "Signature Venues"}
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
            lat={parseFloat(locationContent?.mapLat || currentLocation.mapLat || "0")}
            lng={parseFloat(locationContent?.mapLng || currentLocation.mapLng || "0")}
            zoom={locationContent?.mapZoom || 8}
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
              {locationContent?.featuredVendorsTitle || "Top Wedding Planners"}
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

        {/* SEO Block */}
        {seoData && (
          <SEOBlock
            title={currentLocation.name}
            content={currentLocation.evergreenContent || ""}
            C={C}
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
