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
import AICommandBar    from "../components/filters/AICommandBar";
import GCard           from "../components/cards/GCard";
import GCardMobile     from "../components/cards/GCardMobile";
import HCard           from "../components/cards/HCard";
import QuickViewModal  from "../components/modals/QuickViewModal";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import SliderNav       from "../components/ui/SliderNav";

// ── Data services (self-fetch when rendered standalone) ─────────────────────
import { COUNTRIES, REGIONS, CITIES } from "../data/geo";
import { DIRECTORY_REGIONS } from "../data/directoryRegions.js";
import { DEFAULT_FILTERS, CAPS } from "../data/italyVenues";
import { fetchListings } from "../services/listings";
import { fetchLocationContent, buildLocationKey } from "../services/locationContentService";
import { REGION_INSIGHTS } from "../data/regionInsights";
import { useAdminAuth } from "../context/AdminAuthContext";

// ── Default map coordinates per country (fallback when Supabase has no coords) ──
// Prevents map from showing Italy/ocean for newly created locations.
const COUNTRY_MAP_DEFAULTS = {
  italy:            { lat: 42.5, lng: 12.5, zoom: 6 },
  france:           { lat: 46.6, lng: 2.2, zoom: 6 },
  "united-kingdom": { lat: 54.0, lng: -2.5, zoom: 6 },
  uk:               { lat: 54.0, lng: -2.5, zoom: 6 },
  usa:              { lat: 39.0, lng: -98.0, zoom: 4 },
  spain:            { lat: 40.0, lng: -3.7, zoom: 6 },
  portugal:         { lat: 39.5, lng: -8.0, zoom: 7 },
  greece:           { lat: 38.5, lng: 23.5, zoom: 7 },
  thailand:         { lat: 13.75, lng: 100.5, zoom: 6 },
  cambodia:         { lat: 12.5, lng: 105.0, zoom: 7 },
  indonesia:        { lat: -2.5, lng: 118.0, zoom: 5 },
  india:            { lat: 22.0, lng: 78.0, zoom: 5 },
  japan:            { lat: 36.5, lng: 138.0, zoom: 6 },
  australia:        { lat: -25.5, lng: 134.0, zoom: 4 },
  "new-zealand":    { lat: -41.0, lng: 174.0, zoom: 6 },
  mexico:           { lat: 23.5, lng: -102.0, zoom: 5 },
  morocco:          { lat: 32.0, lng: -6.0, zoom: 7 },
  uae:              { lat: 24.5, lng: 54.5, zoom: 8 },
  "south-africa":   { lat: -30.5, lng: 25.0, zoom: 6 },
  kenya:            { lat: -0.5, lng: 37.9, zoom: 7 },
  maldives:         { lat: 3.2, lng: 73.2, zoom: 8 },
  "sri-lanka":      { lat: 7.8, lng: 80.8, zoom: 8 },
  croatia:          { lat: 44.5, lng: 15.5, zoom: 7 },
  ireland:          { lat: 53.4, lng: -7.7, zoom: 7 },
  switzerland:      { lat: 46.8, lng: 8.2, zoom: 8 },
  turkey:           { lat: 39.0, lng: 35.0, zoom: 6 },
  egypt:            { lat: 26.5, lng: 30.8, zoom: 6 },
};

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
  onViewRegionCategory = () => {},
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
  // services is not in DEFAULT_FILTERS (it's a new dimension) — extend locally
  const [filters, setFilters] = useState({ ...DEFAULT_FILTERS, services: null });
  const FULL_DEFAULT_FILTERS = useMemo(() => ({ ...DEFAULT_FILTERS, services: null }), []);
  const [viewMode, setViewMode] = useState("grid");
  const [sortMode, setSortMode] = useState("recommended");
  const [visibleCount, setVisibleCount] = useState(12);
  const [savedIds, setSavedIds] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const filterReleaseTimer = useRef(null);
  const [qvItem, setQvItem] = useState(null);
  const [mapOpen, setMapOpen] = useState(false);
  const [aiMapTrigger, setAiMapTrigger] = useState(0); // increment to auto-open map

  // ── Location resolution state ───────────────────────────────────────────────
  // resolving = true while Supabase lookup is in flight. No 404 until this is false.
  const [resolving, setResolving] = useState(true);
  const [supabaseRow, setSupabaseRow] = useState(null);    // Full Supabase locations row
  const [draftMode, setDraftMode] = useState(false);

  const isMobile = useIsMobile();
  const C = darkMode ? getDarkPalette() : getLightPalette();
  const { setChatContext } = useChat();
  const { isAuthenticated: isAdmin } = useAdminAuth();

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
  // DIRECTORY_REGIONS covers all countries; REGIONS (geo.js) is Italy+UK only — use as last resort
  const _regions   = useMemo(() => (regions && regions.length > 0) ? regions : DIRECTORY_REGIONS, [regions]);
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

  // ── Apply user-selected filters to locationVenues ─────────────────────────────
  // filteredVenues is what the All Venues grid shows. Curated/editorial sections
  // always use locationVenues (unfiltered) — they're hand-picked, not search results.
  const filteredVenues = useMemo(() => {
    let result = locationVenues;

    // Region (country pages only — "all" = no filter)
    if (filters.region && filters.region !== DEFAULT_FILTERS.region) {
      result = result.filter(v => v.regionSlug === filters.region);
    }

    // Style — match against v.styles array (case-insensitive partial)
    if (filters.style && filters.style !== DEFAULT_FILTERS.style) {
      result = result.filter(v => {
        const vs = Array.isArray(v.styles) ? v.styles : [];
        return vs.some(s =>
          s === filters.style ||
          s.toLowerCase().includes(filters.style.toLowerCase()) ||
          filters.style.toLowerCase().includes(s.toLowerCase())
        );
      });
    }

    // Capacity — CAPS = ["Any Capacity","Up to 50","51–100","101–200","200+"]
    if (filters.capacity && filters.capacity !== DEFAULT_FILTERS.capacity) {
      const ci = CAPS.indexOf(filters.capacity);
      if (ci > 0) {
        result = result.filter(v => {
          const cap = parseInt(v.capacity);
          if (!cap || isNaN(cap)) return true; // include unlisted capacities
          if (ci === 1) return cap <= 50;
          if (ci === 2) return cap >= 51  && cap <= 100;
          if (ci === 3) return cap >= 101 && cap <= 200;
          if (ci === 4) return cap >= 200;
          return true;
        });
      }
    }

    // Price — parse "£10,000–£25,000" or "£100,000+" style strings
    if (filters.price && filters.price !== DEFAULT_FILTERS.price) {
      const stripped = filters.price.replace(/[£,\s]/g, "");
      const isPlus   = stripped.endsWith("+");
      const parts    = stripped.replace("+", "").split("–").map(Number);
      const minP     = parts[0] || 0;
      const maxP     = isPlus ? Infinity : (parts[1] || Infinity);
      if (!isNaN(minP)) {
        result = result.filter(v => {
          if (!v.priceFrom) return true; // include venues without price data
          return v.priceFrom >= minP && v.priceFrom <= maxP;
        });
      }
    }

    // Services — match against v.includes (amenities) array, case-insensitive substring
    if (filters.services) {
      const q = filters.services.toLowerCase();
      result = result.filter(v => {
        const inc = Array.isArray(v.includes) ? v.includes : [];
        const spc = Array.isArray(v.specialties) ? v.specialties : [];
        const all = [...inc, ...spc];
        return all.some(s => s.toLowerCase().includes(q) || q.includes(s.toLowerCase()));
      });
    }

    return result;
  }, [locationVenues, filters]);

  // ── Map venues: use filteredVenues so pins reflect active filter state ─────
  // Capped at 40 for map perf. locationVenues (unfiltered) is still used by
  // curated/editorial sections above the fold — they're hand-picked, not search.
  const mapVenues = useMemo(() => filteredVenues.slice(0, 40), [filteredVenues]);

  // ── AI map: fly-to target derived from active region filter ─────────────────
  const flyToTarget = useMemo(() => {
    const defaultRegion = FULL_DEFAULT_FILTERS?.region ?? "all";
    if (!filters.region || filters.region === defaultRegion) return null;
    const insight = REGION_INSIGHTS[filters.region];
    if (!insight) return null;
    const r = _regions.find(r => r.slug === filters.region);
    return {
      slug:      filters.region,
      name:      r?.name || filters.region,
      ...insight,
    };
  }, [filters.region, _regions, FULL_DEFAULT_FILTERS]);

  // ── AI map: zone circles — one per region with mapped venues ────────────────
  const regionZones = useMemo(() => {
    if (!currentLocation) return [];
    return _regions
      .filter(r => r.countrySlug === currentLocation.slug)
      .map(r => {
        const insight = REGION_INSIGHTS[r.slug];
        if (!insight) return null;
        const count = locationVenues.filter(v =>
          v.regionSlug === r.slug || v.region === r.name
        ).length;
        if (count === 0) return null;
        return { slug: r.slug, name: r.name, lat: insight.lat, lng: insight.lng, count };
      })
      .filter(Boolean);
  }, [_regions, currentLocation, locationVenues]);

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

  // ── Scroll to top on location change (navigation + first load) ──────────────
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [locationSlug]);

  // ── Scroll tracking: nav slide-up + filter sticky release ───────────────────
  // Two separate states control the fade-then-release sequence:
  //   filterSticky:  position sticky (true) vs relative (false)
  //   filterVisible: opacity 1 (true) vs 0 (false)
  //
  // Release sequence: fade out (350ms) → switch position (element snaps off-screen while invisible)
  // Restore sequence: switch position back → fade in (snapping back while invisible, then fade in)
  const [filterSticky,  setFilterSticky]  = useState(true);
  const [filterVisible, setFilterVisible] = useState(true);

  useEffect(() => {
    let prevShouldStick = true;

    const handleScroll = () => {
      setScrolled(window.scrollY > 100);

      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const shouldStick = scrollable <= 0 || window.scrollY < scrollable * 0.4;

      if (shouldStick === prevShouldStick) return;
      prevShouldStick = shouldStick;

      clearTimeout(filterReleaseTimer.current);

      if (shouldStick) {
        // Restore: snap sticky back (while invisible), then fade in
        setFilterSticky(true);
        filterReleaseTimer.current = setTimeout(() => setFilterVisible(true), 20);
      } else {
        // Release: fade out, then switch to relative (invisible snap doesn't matter)
        setFilterVisible(false);
        filterReleaseTimer.current = setTimeout(() => setFilterSticky(false), 380);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(filterReleaseTimer.current);
    };
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

        {/* Admin Edit Bar — visible only when logged-in admin is viewing */}
        {isAdmin && !hideNav && (
          <div style={{
            position: "fixed", bottom: 90, right: 28, zIndex: 9999,
            display: "flex", gap: 8, alignItems: "center",
          }}>
            <button
              onClick={() => {
                const locationKey = buildLocationKey(locationType, locationSlug);
                sessionStorage.setItem("lwd_admin_edit_intent", JSON.stringify({
                  type: "location",
                  locationKey,
                  returnPath: window.location.pathname,
                }));
                window.location.href = "/admin";
              }}
              style={{
                fontFamily: "var(--font-body)", fontSize: 11, fontWeight: 700,
                letterSpacing: "0.12em", textTransform: "uppercase",
                padding: "10px 20px", borderRadius: 4,
                background: "#C9A84C", color: "#000", border: "none",
                cursor: "pointer", boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
              }}
            >
              Edit in Studio
            </button>
          </div>
        )}

        {/* Fixed Navigation — hidden in admin preview mode */}
        {!hideNav && (
          <CatNav
            onBack={onBack}
            scrolled={scrolled}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode(d => !d)}
            crumbs={[
              { label: "Venues" },
              { label: currentLocation.name, active: true },
            ]}
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
            count={locationVenues.length || "—"}
            regionCount={_regions.filter(r => r.countrySlug === currentLocation?.slug).length || "—"}
            C={C}
            onBack={onBack}
          />
        )}

        {/* ── Sticky filter system: AI bar + filter bar + chip strip ──────── */}
        {/* Sticks until the user has scrolled ~50% of the page, then fades and releases. */}
        <div style={{
          position:   filterSticky  ? "sticky"  : "relative",
          top:        filterSticky  ? 56        : "auto",
          opacity:    filterVisible ? 1         : 0,
          transition: "opacity 0.35s ease",
          zIndex:     800,
        }}>

          {/* AI Command Bar — Phase 2 */}
          {locationType === "country" && (
            <AICommandBar
              countrySlug={currentLocation.slug}
              countryName={currentLocation.name}
              availableRegions={_regions
                .filter(r => r.countrySlug === currentLocation.slug && (r.listingCount ?? 0) > 0)
                .map(r => ({ name: r.name, slug: r.slug }))}
              filters={filters}
              onFiltersChange={setFilters}
              defaultFilters={FULL_DEFAULT_FILTERS}
              onRegionDetected={() => setAiMapTrigger(t => t + 1)}
            />
          )}

          {/* Filter Bar */}
          <CountrySearchBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewMode={setViewMode}
            sortMode={sortMode}
            onSortChange={setSortMode}
            total={filteredVenues.length}
            regions={_regions
              .filter(r => r.countrySlug === currentLocation.slug)
              .map(r => ({ slug: r.slug, name: r.name }))}
            countryFilter={currentLocation.slug}
            forceMapOpen={aiMapTrigger}
            mapContent={
              <MapSection
                countryFilter={currentLocation.name}
                venues={mapVenues}
                darkMode={darkMode}
                flyToTarget={flyToTarget}
                regionZones={regionZones}
                onRegionZoneClick={(slug) => setFilters(f => ({ ...f, region: slug }))}
              />
            }
          />

          {/* Info Strip — chip filters, collapses into the sticky bar */}
          {locationType === "country" && (
            <InfoStrip
              availableRegions={
                (Array.isArray(_locationContent?.infoRegions) && _locationContent.infoRegions.length > 0)
                  ? _locationContent.infoRegions.map(name => {
                      const r = _regions.find(r => r.name === name && r.countrySlug === currentLocation.slug);
                      return { name, slug: r?.slug ?? name };
                    })
                  : _regions
                      .filter(r => r.countrySlug === currentLocation.slug && (r.listingCount ?? 0) > 0)
                      .sort((a, b) => {
                        if (a.priorityLevel === "primary" && b.priorityLevel !== "primary") return -1;
                        if (a.priorityLevel !== "primary" && b.priorityLevel === "primary") return 1;
                        return (b.listingCount || 0) - (a.listingCount || 0);
                      })
                      .slice(0, 8)
                      .map(r => ({ name: r.name, slug: r.slug }))
              }
              vibes={_locationContent?.infoVibes}
              services={_locationContent?.infoServices}
              filters={filters}
              onFiltersChange={setFilters}
              defaultFilters={FULL_DEFAULT_FILTERS}
            />
          )}

        </div>{/* end sticky filter system */}

        {/* ── Country Hub: Explore by Region + Browse by Category ─────────── */}
        {locationType === "country" && (() => {
          const countryRegions = _regions
            .filter(r => r.countrySlug === currentLocation.slug && (r.listingCount ?? 0) > 0)
            .sort((a, b) => {
              if (a.priorityLevel === "primary" && b.priorityLevel !== "primary") return -1;
              if (a.priorityLevel !== "primary" && b.priorityLevel === "primary") return 1;
              return (b.listingCount || 0) - (a.listingCount || 0);
            });
          const HUB_CATEGORIES = [
            { slug: "wedding-venues",   label: "Wedding Venues",   icon: "◻" },
            { slug: "wedding-planners", label: "Wedding Planners", icon: "◇" },
            { slug: "photographers",    label: "Photographers",    icon: "◎" },
            { slug: "florists",         label: "Florists",         icon: "◈" },
          ];
          if (countryRegions.length === 0) return null;
          return (
            <div style={{ background: C.card, borderTop: `1px solid ${C.border}`, padding: "64px 60px" }}>
              <div style={{ maxWidth: 1200, margin: "0 auto" }}>

                {/* Browse by Category */}
                <div style={{ marginBottom: 56 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 24, height: 1, background: C.gold }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
                      Browse {currentLocation.name}
                    </span>
                    <div style={{ width: 24, height: 1, background: C.gold }} />
                  </div>
                  <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                    {HUB_CATEGORIES.map(cat => (
                      <button
                        key={cat.slug}
                        onClick={() => onViewRegionCategory(currentLocation.slug, null, cat.slug)}
                        style={{
                          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 500,
                          letterSpacing: "0.06em", textTransform: "uppercase",
                          color: C.off, background: "transparent",
                          border: `1px solid ${C.border}`,
                          borderRadius: 2, padding: "10px 20px", cursor: "pointer",
                          transition: "border-color 0.2s, color 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.gold; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.off; }}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Explore by Region */}
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
                    <div style={{ width: 24, height: 1, background: C.gold }} />
                    <span style={{ fontFamily: "var(--font-body)", fontSize: 9, letterSpacing: "0.28em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
                      Explore by Region
                    </span>
                    <div style={{ width: 24, height: 1, background: C.gold }} />
                  </div>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(auto-fill, minmax(180px, 1fr))",
                    gap: 8,
                  }}>
                    {countryRegions.map(region => (
                      <button
                        key={region.slug}
                        onClick={() => onViewRegion(currentLocation.slug, region.slug)}
                        style={{
                          fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 400,
                          color: C.grey, background: "transparent",
                          border: `1px solid ${C.border}`,
                          borderRadius: 2, padding: "12px 16px", cursor: "pointer",
                          textAlign: "left", transition: "all 0.2s",
                          display: "flex", justifyContent: "space-between", alignItems: "center",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = C.gold; e.currentTarget.style.color = C.off; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.grey; }}
                      >
                        <span>{region.name}</span>
                        {region.listingCount > 0 && (
                          <span style={{ fontSize: 10, color: C.grey2, marginLeft: 8 }}>{region.listingCount}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          );
        })()}

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

        {/* Filter bar is now rendered directly below the hero — see above */}

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
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
              maxWidth: "1400px",
              margin: "0 auto",
            }}>
              {featuredVenues.map(venue => (
                <LuxuryVenueCard
                  key={venue.id}
                  v={venue}
                  onView={onViewVenue}
                  isMobile={isMobile}
                  setQuickViewItem={setQvItem}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Venue Grid — driven by filteredVenues */}
        <div style={{ padding: "40px 20px", background: C.card }}>
          {/* Section heading with live filtered count */}
          <div style={{ maxWidth: 1280, margin: "0 auto 24px", display: "flex", alignItems: "baseline", gap: 12 }}>
            <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 18, margin: 0, color: C.off }}>
              All Venues
            </h3>
            <span style={{ fontSize: 12, color: C.grey2, fontFamily: "var(--font-body)" }}>
              {filteredVenues.length} result{filteredVenues.length !== 1 ? "s" : ""}
              {filteredVenues.length < locationVenues.length && (
                <span style={{ marginLeft: 6, color: C.grey2 }}>
                  of {locationVenues.length}
                </span>
              )}
            </span>
          </div>

          {/* Empty state */}
          {filteredVenues.length === 0 && (
            <div style={{ textAlign: "center", padding: "60px 20px", color: C.grey }}>
              <p style={{ fontSize: 15, marginBottom: 12 }}>No venues match your current filters.</p>
              <button
                onClick={() => setFilters(FULL_DEFAULT_FILTERS)}
                style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 3, padding: "8px 20px", color: C.off, cursor: "pointer", fontSize: 12, fontFamily: "var(--font-body)" }}
              >
                Clear filters
              </button>
            </div>
          )}

          <div aria-label="Venue list" style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 20,
            maxWidth: 1400,
            margin: "0 auto",
          }}>
            {filteredVenues.slice(0, visibleCount).map(venue => (
              <LuxuryVenueCard
                key={venue.id}
                v={venue}
                onView={onViewVenue}
                isMobile={isMobile}
                setQuickViewItem={setQvItem}
              />
            ))}
          </div>

          {visibleCount < filteredVenues.length && (
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

        {/* Featured Vendors Section — Hidden when map is open */}
        {featuredVendors.length > 0 && (
          <div style={{ padding: "40px 20px", background: C.card, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}` }}>
            <h3 style={{ fontFamily: "'Neue Haas Display', serif", fontSize: 20, marginBottom: 24, textAlign: "center" }}>
              {_locationContent?.featuredVendorsTitle || "Top Wedding Planners"}
            </h3>
            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fill, minmax(320px, 1fr))",
              gap: 20,
              maxWidth: "1400px",
              margin: "0 auto",
            }}>
              {featuredVendors.map(vendor => (
                <LuxuryVendorCard
                  key={vendor.id}
                  v={vendor}
                  onView={onViewVenue}
                  isMobile={isMobile}
                  setQuickViewItem={setQvItem}
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
      </div>
    </ThemeCtx.Provider>
  );
}
