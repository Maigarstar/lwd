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
  const { setChatContext } = useChat();

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

  // ── Compute editorial split venues (Latest / Random / Featured) ─────────────
  const editorialVenues = useMemo(() => {
    const mode = locationContent?.editorialVenueMode || 'latest';
    if (mode === 'featured' && featuredVenues.length >= 5) return featuredVenues.slice(0, 5);
    if (mode === 'random' && locationVenues.length >= 5) {
      const shuffled = [...locationVenues].sort(() => Math.random() - 0.5);
      return shuffled.slice(0, 5);
    }
    // 'latest' — first 5 in order
    return locationVenues.slice(0, 5);
  }, [locationVenues, featuredVenues, locationContent?.editorialVenueMode]);

  // ── Compute Latest Venues strip venues ──────────────────────────────────────
  const latestVenuesVenues = useMemo(() => {
    const mode  = locationContent?.latestVenuesMode  || 'latest';
    const count = locationContent?.latestVenuesCount || 12;

    if (mode === 'selected') {
      const ids = locationContent?.latestVenuesSelected || [];
      // Preserve the exact order admin set; match against ALL venues (not just location-filtered)
      return ids
        .map(id => venues.find(v => v.id === id))
        .filter(Boolean);
    }
    if (mode === 'featured' && featuredVenues.length > 0) return featuredVenues.slice(0, count);
    if (mode === 'random' && locationVenues.length > 0) {
      return [...locationVenues].sort(() => Math.random() - 0.5).slice(0, count);
    }
    return locationVenues.slice(0, count);
  }, [locationVenues, featuredVenues, venues, locationContent?.latestVenuesMode, locationContent?.latestVenuesCount, locationContent?.latestVenuesSelected]);

  // ── Get vendors for this location ────────────────────────────────────────────
  const locationVendors = useMemo(() => {
    let filtered = [];
    if (locationType === "country") {
      filtered = vendors.filter(v => v.countrySlug === currentLocation?.slug);
    } else if (locationType === "region") {
      filtered = vendors.filter(v => v.regionSlug === currentLocation?.slug);
    } else if (locationType === "city") {
      filtered = vendors.filter(v => v.citySlug === currentLocation?.slug);
    }
    return filtered;
  }, [currentLocation, locationType, vendors]);

  // ── Compute Latest Vendors strip vendors ─────────────────────────────────────
  const latestVendorsVenues = useMemo(() => {
    const mode  = locationContent?.latestVendorsMode  || 'latest';
    const count = locationContent?.latestVendorsCount || 12;

    if (mode === 'selected') {
      const ids = locationContent?.latestVendorsSelected || [];
      return ids
        .map(id => vendors.find(v => v.id === id))
        .filter(Boolean);
    }
    if (mode === 'featured' && featuredVendors.length > 0) return featuredVendors.slice(0, count);
    if (mode === 'random' && locationVendors.length > 0) {
      return [...locationVendors].sort(() => Math.random() - 0.5).slice(0, count);
    }
    return locationVendors.slice(0, count);
  }, [locationVendors, featuredVendors, vendors, locationContent?.latestVendorsMode, locationContent?.latestVendorsCount, locationContent?.latestVendorsSelected]);

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
      title: locationContent?.heroTitle || currentLocation.name,
      subtitle: locationContent?.heroSubtitle || currentLocation.description || "",
      backgroundImage: locationContent?.heroImage || "",
      backgroundVideo: locationContent?.heroVideo || "",
      ctaText: locationContent?.ctaText || "Explore Venues",
      ctaLink: locationContent?.ctaLink || "#",
      eyebrow,
    };
  }, [currentLocation, locationType, parentLocation, locationContent]);

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
        editorial: locationContent?.seoContent || currentLocation.evergreenContent || "",
        faqs: Array.isArray(locationContent?.seoFaqs) ? locationContent.seoFaqs : [],
        vibes: Array.isArray(locationContent?.infoVibes) ? locationContent.infoVibes : [],
        services: Array.isArray(locationContent?.infoServices) ? locationContent.infoServices : [],
        heroSubtitle: locationContent?.heroSubtitle || "",
        focusKeywords: (currentLocation.focusKeywords || []).join(", "),
      },
    });
  }, [currentLocation, locationType, parentLocation, locationContent, setChatContext]);

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
              (Array.isArray(locationContent?.infoRegions) && locationContent.infoRegions.length > 0)
                ? locationContent.infoRegions
                : regions.filter(r => r.countrySlug === currentLocation.slug).map(r => r.name)
            }
            vibes={locationContent?.infoVibes}
            services={locationContent?.infoServices}
            C={C}
          />
        )}

        {/* Editorial Split — "The Art of the {Location} Wedding" */}
        {locationContent?.showEditorialSplit !== false && editorialVenues.length >= 5 && (
          <LatestSplit
            venues={editorialVenues}
            locationName={currentLocation.name}
            eyebrow={locationContent?.editorialEyebrow || ''}
            headingPrefix={locationContent?.editorialHeadingPrefix || ''}
            ctaText={locationContent?.editorialCtaText || ''}
            para1={locationContent?.editorialPara1 || ""}
            para2={locationContent?.editorialPara2 || ""}
            infoBlocks={
              Array.isArray(locationContent?.editorialBlocks)
                ? locationContent.editorialBlocks
                : []
            }
          />
        )}

        {/* Latest Venues Strip */}
        {locationContent?.showLatestVenues !== false && (
        <LatestVenuesStrip
          venues={latestVenuesVenues}
          heading={locationContent?.latestVenuesHeading || ''}
          subtext={locationContent?.latestVenuesSub || ''}
          locationName={currentLocation.name}
          onViewVenue={onViewVenue}
          onQuickView={setQvItem}
          isMobile={isMobile}
          cardStyle={locationContent?.latestVenuesCardStyle || 'luxury'}
        />
        )}

        {/* Latest Vendors Strip */}
        {locationContent?.showLatestVendors !== false && (
        <LatestVendorsStrip
          vendors={latestVendorsVenues}
          heading={locationContent?.latestVendorsHeading || ''}
          subtext={locationContent?.latestVendorsSub || ''}
          locationName={currentLocation.name}
          onViewVendor={onViewVenue}
          onQuickView={setQvItem}
          isMobile={isMobile}
          cardStyle={locationContent?.latestVendorsCardStyle || 'luxury'}
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

        {/* SEO Block / Planning Guide */}
        {seoData && locationContent?.showPlanningGuide !== false && (
          <SEOBlock
            title={currentLocation.name}
            seoHeading={locationContent?.seoHeading || ''}
            content={locationContent?.seoContent || currentLocation.evergreenContent || ""}
            faqs={locationContent?.seoFaqs}
            regionNames={regions
              .filter(r => r.countrySlug === currentLocation.slug)
              .map(r => r.name)}
            venueCount={locationVenues.length}
            regionCount={regions.filter(r => r.countrySlug === currentLocation.slug).length}
            C={C}
          />
        )}

        {/* Motto / Quote Banner */}
        {locationContent?.showMotto !== false && (
          <MottoStrip
            motto={
              locationContent?.motto ||
              `${currentLocation.name}, where every moment becomes a memory worth keeping forever.`
            }
            subline={locationContent?.mottoSubline || ''}
            backgroundImage={locationContent?.mottoBgImage || ''}
            overlayOpacity={
              locationContent?.mottoOverlay != null
                ? parseFloat(locationContent.mottoOverlay)
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
