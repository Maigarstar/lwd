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
import HomeNav         from "../components/nav/HomeNav";
import CountrySearchBar from "../components/filters/CountrySearchBar";
import AICommandBar    from "../components/filters/AICommandBar";
import GCard           from "../components/cards/GCard";
import GCardMobile     from "../components/cards/GCardMobile";
import HCard           from "../components/cards/HCard";
import QuickViewModal  from "../components/modals/QuickViewModal";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import SliderNav       from "../components/ui/SliderNav";
import FeaturedSlider  from "../components/sections/FeaturedSlider";
import { useInView, revealStyle } from "../components/ui/Animations";

// ── Data services (self-fetch when rendered standalone) ─────────────────────
import { COUNTRIES, REGIONS, CITIES, getCountryBySlug, VENDOR_CATEGORIES } from "../data/geo";
import { fetchListings } from "../services/listings";
import { fetchLocationContent, buildLocationKey, fetchLocationMetadata } from "../services/locationContentService";
import { DEFAULT_FILTERS } from "../data/venues";

// ── Font tokens ──────────────────────────────────────────────────────────────
const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// ── Shared sub-components (reused from RegionPage) ──────────────────────────

const LUXURY_ICONS = {
  "wedding-venues": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /><path d="M10 10h.01M14 10h.01" /></svg>),
  "wedding-planners": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" /></svg>),
  "photographers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" /></svg>),
  "florists": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c0 0 0-3 0-6" /><path d="M9 18c-2 0-4-1.5-4-4 0-2 2-3.5 4-3.5.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5c2 0 4 1.5 4 3.5 0 2.5-2 4-4 4" /><path d="M12 8c0-2 1-4 3-5" /><path d="M12 8c0-2-1-4-3-5" /></svg>),
  "caterers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" /></svg>),
  "hair-makeup": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5" /><path d="M12 13v8" /><path d="M9 18h6" /><path d="M15 5c1-2 3-3 4-2" /></svg>),
  "entertainment": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" /></svg>),
  "videographers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" /></svg>),
  "wedding-cakes": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" /><path d="M6 14h12v4H6z" /><path d="M8 10h8v4H8z" /><path d="M12 3v3" /><circle cx="12" cy="2" r="1" /></svg>),
  "stationery": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>),
  "bridal-wear": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 2 4l-3 10h12l-3-10c1-1 2-2 2-4 0-3-2-6-5-6z" /><path d="M9 22h6" /></svg>),
  "jewellers": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6" /><path d="M12 8V2" /><path d="M8 10l-3-5" /><path d="M16 10l3-5" /></svg>),
  "transport": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14v-5H5v5z" /><path d="M2 12h20" /><path d="M5 12V7c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5" /><circle cx="7" cy="17" r="2" /><circle cx="17" cy="17" r="2" /></svg>),
  "event-design": (color) => (<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg>),
};

const CATS_PER_PAGE = 7;

function CategoryShortcutCard({ vc, C, onClick }) {
  const [hov, setHov] = useState(false);
  const iconColor = hov ? C.gold : (C.grey || "#888");
  const renderIcon = LUXURY_ICONS[vc.slug];
  return (
    <button onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov ? C.card : C.dark, border: `1px solid ${hov ? C.gold : C.border2}`, borderRadius: "var(--lwd-radius-card)", padding: "28px 20px", textAlign: "center", cursor: "pointer", transition: "all 0.25s", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: 48, height: 48, borderRadius: "50%", background: hov ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent", border: `1px solid ${hov ? C.gold : (C.border2 || "rgba(255,255,255,0.08)")}`, transition: "all 0.3s ease" }} aria-hidden="true">
        {renderIcon ? renderIcon(iconColor) : <span style={{ fontSize: 22, opacity: 0.6 }}>{vc.icon}</span>}
      </span>
      <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: "1.5px", textTransform: "uppercase", color: hov ? C.gold : C.off, transition: "color 0.2s" }}>{vc.label}</span>
    </button>
  );
}

function CategoryCarousel({ categories, C, onSelect }) {
  const [page, setPage] = useState(0);
  const totalPages = Math.ceil(categories.length / CATS_PER_PAGE);
  const start = page * CATS_PER_PAGE;
  const visible = categories.slice(start, start + CATS_PER_PAGE);
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);
  const arrowBtn = (dir, hov, setHov, disabled, onClick) => (
    <button aria-label={dir === "prev" ? "Previous categories" : "Next categories"} disabled={disabled} onClick={onClick} onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: hov && !disabled ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent", border: `1px solid ${disabled ? (C.border || "rgba(255,255,255,0.06)") : hov ? C.gold : (C.border2 || "rgba(255,255,255,0.12)")}`, borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", cursor: disabled ? "default" : "pointer", opacity: disabled ? 0.25 : 1, transition: "all 0.25s", flexShrink: 0 }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hov && !disabled ? C.gold : (C.grey || "#888")} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        {dir === "prev" ? <polyline points="15 18 9 12 15 6" /> : <polyline points="9 6 15 12 9 18" />}
      </svg>
    </button>
  );
  return (
    <div>
      <div className="lwd-region-cat-grid" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 16 }}>
        {visible.map((vc) => (<CategoryShortcutCard key={vc.slug} vc={vc} C={C} onClick={() => onSelect(vc.slug)} />))}
      </div>
      {totalPages > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 16, marginTop: 28 }}>
          {arrowBtn("prev", hovPrev, setHovPrev, page === 0, () => setPage((p) => p - 1))}
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} aria-label={`Page ${i + 1}`} onClick={() => setPage(i)}
                style={{ width: page === i ? 20 : 6, height: 6, borderRadius: 3, background: page === i ? C.gold : (C.border2 || "rgba(255,255,255,0.12)"), border: "none", cursor: "pointer", padding: 0, transition: "all 0.3s ease" }} />
            ))}
          </div>
          {arrowBtn("next", hovNext, setHovNext, page >= totalPages - 1, () => setPage((p) => p + 1))}
        </div>
      )}
    </div>
  );
}

function EditorialSection({ editorial, locationName, C }) {
  const [expanded, setExpanded] = useState(false);
  if (!editorial?.sections?.length) return null;
  const visibleSections = expanded ? editorial.sections : editorial.sections.slice(0, 2);
  return (
    <section aria-label={`Editorial guide to weddings in ${locationName}`} className="lwd-region-section" style={{ background: C.dark, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: "80px 48px" }}>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
          <div style={{ width: 28, height: 1, background: C.gold }} />
          <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.35em", textTransform: "uppercase", color: C.gold, fontWeight: 700 }}>Editorial</span>
          <div style={{ width: 28, height: 1, background: C.gold }} />
        </div>
        <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3.2vw, 38px)", fontWeight: 400, color: C.off, lineHeight: 1.2, textAlign: "center", margin: "0 0 16px" }}>{editorial.headline}</h2>
        {editorial.standfirst && <p style={{ fontFamily: NU, fontSize: 14, color: C.gold, lineHeight: 1.7, textAlign: "center", fontWeight: 400, fontStyle: "italic", maxWidth: 640, margin: "0 auto 48px", opacity: 0.85 }}>{editorial.standfirst}</p>}
        {visibleSections.map((s, i) => (
          <article key={i} style={{ marginBottom: 40 }}>
            <h3 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, fontStyle: "italic", color: C.off, marginBottom: 14, paddingLeft: 20, borderLeft: `2px solid ${C.gold}` }}>{s.heading}</h3>
            <p style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.95, fontWeight: 300 }}>{s.body}</p>
          </article>
        ))}
        {editorial.sections.length > 2 && (
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <button onClick={() => setExpanded((e) => !e)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: "2px", textTransform: "uppercase", color: C.gold, padding: "8px 0", display: "inline-flex", alignItems: "center", gap: 8, transition: "opacity 0.2s" }}>
              {expanded ? "Read Less" : `Continue Reading (${editorial.sections.length - 2} more)`}
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.gold} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ transition: "transform 0.3s", transform: expanded ? "rotate(180deg)" : "rotate(0deg)" }}><polyline points="6 9 12 15 18 9" /></svg>
            </button>
          </div>
        )}
      </div>
    </section>
  );
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
  const filterBarRef = useRef(null);

  // ── Animation refs for venue rows ─────────────────────────────────────────
  const [grid1Ref, grid1In] = useInView({ threshold: 0.15 });

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
      heroStats:    m.heroStats    || [],
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

  // ── Country display name for filter/map components ─────────────────────────
  const countryObj = useMemo(() => {
    if (locationType === "country") return currentLocation;
    if (parentLocation && locationType === "region") return parentLocation;
    // For cities, find the country via countrySlug
    return currentLocation ? getCountryBySlug(currentLocation.countrySlug) : null;
  }, [currentLocation, parentLocation, locationType]);
  const countryName = countryObj?.name || currentLocation?.name || "United Kingdom";

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

    // Build eyebrow: "Wedding Directory · Italy", etc.
    let eyebrow = `Wedding Directory · ${currentLocation.name}`;
    if (locationType === "region" && parentLocation) {
      eyebrow = `Wedding Directory · ${currentLocation.name}, ${parentLocation.name}`;
    } else if (locationType === "city" && parentLocation) {
      eyebrow = `Wedding Directory · ${currentLocation.name}, ${parentLocation.name}`;
    }

    return {
      title: _locationContent?.heroTitle || currentLocation.name,
      subtitle: _locationContent?.heroSubtitle || currentLocation.description || "",
      backgroundImage: _locationContent?.heroImage || "",
      backgroundVideo: _locationContent?.heroVideo || "",
      ctaText: _locationContent?.ctaText || "Explore Listings",
      ctaLink: _locationContent?.ctaLink || "#",
      eyebrow,
    };
  }, [currentLocation, locationType, parentLocation, _locationContent]);

  // ── SEO content — reads from Supabase SEO columns with graceful fallbacks ──
  const seoData = useMemo(() => {
    if (!currentLocation) return null;
    const sb = supabaseRow || {};
    const locName = currentLocation.name || '';

    return {
      title:       sb.seo_title || `${locName} | Luxury Wedding Directory`,
      description: sb.seo_description || currentLocation.description || "",
      keywords:    sb.seo_keywords || (currentLocation.focusKeywords || []).join(", "),
      canonical:   sb.seo_canonical_url || null,
      robotsIndex: sb.seo_robots_index !== false,
      robotsFollow: sb.seo_robots_follow !== false,
      ogTitle:     sb.og_title || sb.seo_title || locName,
      ogDescription: sb.og_description || sb.seo_description || currentLocation.description || "",
      ogImage:     sb.og_image || _locationContent?.heroImage || "",
      twitterTitle: sb.twitter_title || sb.og_title || sb.seo_title || locName,
      twitterDescription: sb.twitter_description || sb.og_description || sb.seo_description || "",
      twitterImage: sb.twitter_image || sb.og_image || _locationContent?.heroImage || "",
      schemaType:  sb.schema_type || "Place",
      schemaJson:  sb.schema_json || null,
      noIndex:     noIndex || sb.seo_robots_index === false,
    };
  }, [currentLocation, _locationContent, noIndex, supabaseRow]);

  // ── Inject SEO meta tags into <head> ──────────────────────────────────────
  useEffect(() => {
    if (!seoData || hideNav) return; // skip in admin preview
    document.title = seoData.title;

    const setMeta = (name, content) => {
      if (!content) return;
      let el = document.querySelector(`meta[name="${name}"]`) || document.querySelector(`meta[property="${name}"]`);
      if (!el) { el = document.createElement('meta'); el.setAttribute(name.startsWith('og:') || name.startsWith('twitter:') ? 'property' : 'name', name); document.head.appendChild(el); }
      el.setAttribute('content', content);
    };

    setMeta('description', seoData.description);
    setMeta('keywords', seoData.keywords);
    setMeta('robots', `${seoData.robotsIndex ? 'index' : 'noindex'}, ${seoData.robotsFollow ? 'follow' : 'nofollow'}`);
    setMeta('og:title', seoData.ogTitle);
    setMeta('og:description', seoData.ogDescription);
    setMeta('og:image', seoData.ogImage);
    setMeta('og:type', 'website');
    setMeta('twitter:card', 'summary_large_image');
    setMeta('twitter:title', seoData.twitterTitle);
    setMeta('twitter:description', seoData.twitterDescription);
    setMeta('twitter:image', seoData.twitterImage);

    // Canonical link
    if (seoData.canonical) {
      let link = document.querySelector('link[rel="canonical"]');
      if (!link) { link = document.createElement('link'); link.rel = 'canonical'; document.head.appendChild(link); }
      link.href = seoData.canonical;
    }

    // Schema.org JSON-LD
    const schemaObj = seoData.schemaJson || {
      "@context": "https://schema.org",
      "@type": seoData.schemaType,
      "name": seoData.title,
      "description": seoData.description,
      "image": seoData.ogImage || undefined,
    };
    let script = document.querySelector('script[data-lwd-schema]');
    if (!script) { script = document.createElement('script'); script.type = 'application/ld+json'; script.setAttribute('data-lwd-schema', 'true'); document.head.appendChild(script); }
    script.textContent = typeof schemaObj === 'string' ? schemaObj : JSON.stringify(schemaObj);

    return () => {
      // Cleanup on unmount
      document.querySelector('script[data-lwd-schema]')?.remove();
    };
  }, [seoData, hideNav]);

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

        {/* ═══ NAVIGATION ═══════════════════════════════════════════════════ */}
        {!hideNav && (
          <HomeNav
            hasHero={true}
            darkMode={darkMode}
            onToggleDark={() => setDarkMode((d) => !d)}
            onNavigateStandard={() => onBack()}
            onNavigateAbout={() => onBack()}
          />
        )}

        {/* Draft Mode Indicator — shown when location is in draft status */}
        {draftIndicator}

        {/* Hero Section + Breadcrumb overlay at bottom */}
        <div style={{ position: "relative" }}>
          {heroData && (
            <Hero
              count={locationVenues.length || null}
              regionCount={_regions.filter(r => r.countrySlug === currentLocation?.slug).length || null}
              stats={
                Array.isArray(_locationContent?.heroStats) && _locationContent.heroStats.length > 0
                  ? _locationContent.heroStats
                  : null
              }
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

          {/* Breadcrumb bar — overlaid at the bottom edge of the hero */}
          <nav
            aria-label="Breadcrumb"
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 10,
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(10px)",
              padding: "10px 80px 15px",
              borderTop: "none",
            }}
          >
            <ol style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: "rgba(255,255,255,0.6)",
              letterSpacing: "0.5px",
              listStyle: "none",
              padding: 0,
              margin: 0,
              fontFamily: NU,
            }}>
              <li>
                <button
                  onClick={onBack}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.6)",
                    letterSpacing: "0.5px", padding: 0,
                    transition: "color 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                >
                  Home
                </button>
              </li>
              {parentLocation && (
                <>
                  <li aria-hidden="true" style={{ opacity: 0.4 }}>›</li>
                  <li>
                    <button
                      onClick={() => onViewCountry?.(parentLocation.slug)}
                      style={{
                        background: "none", border: "none", cursor: "pointer",
                        fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.6)",
                        letterSpacing: "0.5px", padding: 0,
                        transition: "color 0.2s",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
                      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.6)")}
                    >
                      {parentLocation.name}
                    </button>
                  </li>
                </>
              )}
              <li aria-hidden="true" style={{ opacity: 0.4 }}>›</li>
              <li>
                <span style={{ color: "rgba(201,168,76,0.9)", fontWeight: 600 }} aria-current="page">
                  {currentLocation?.name || locationSlug}
                </span>
              </li>
            </ol>
          </nav>
        </div>


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

        {/* ═══ AI COMMAND BAR + FILTER BAR ════════ */}
        <div ref={filterBarRef} style={{
          position:   "relative",
          zIndex:     800,
          marginTop:  0,
        }}>
          <AICommandBar
            countrySlug={currentLocation.slug}
            countryName={countryName}
            regionSlug={null}
            regionName={null}
            entityType="listing"
            availableRegions={_regions.filter(r => r.countrySlug === currentLocation.slug).map(r => ({ slug: r.slug, name: r.name }))}
            filters={filters}
            onFiltersChange={setFilters}
            defaultFilters={DEFAULT_FILTERS}
          />
          <CountrySearchBar
            filters={filters}
            onFiltersChange={setFilters}
            viewMode={viewMode}
            onViewMode={setViewMode}
            sortMode={sortMode}
            onSortChange={setSortMode}
            total={locationVenues.length}
            regions={_regions.filter(r => r.countrySlug === currentLocation.slug).map(r => ({ slug: r.slug, name: r.name }))}
            countryFilter={countryName}
            mapContent={
              viewMode === "map" ? (
                <MapSection
                  venues={mapVenues}
                  vendors={[]}
                  headerLabel={`Wedding Professionals in ${currentLocation.name}`}
                  mapTitle={`◎ ${currentLocation.name} Wedding Directory`}
                  countryFilter={countryName}
                  onMarkerClick={(slug) => onViewVenue(slug)}
                  onClose={() => setViewMode("grid")}
                />
              ) : null
            }
          />
          <InfoStrip
            regionNames={
              (Array.isArray(_locationContent?.infoRegions) && _locationContent.infoRegions.length > 0)
                ? _locationContent.infoRegions
                : _regions.filter(r => r.countrySlug === currentLocation.slug).map(r => r.name)
            }
            vibes={_locationContent?.infoVibes}
            services={_locationContent?.infoServices}
          />
        </div>

        {/* ═══ ABOUT SECTION ════════════════════════════════════════════════ */}
        {(_locationContent?.aboutContent || _locationContent?.seoContent || currentLocation?.evergreenContent) && (
          <section
            aria-label={`About weddings in ${currentLocation?.name || "this location"}`}
            className="lwd-region-intro"
            style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, padding: "72px 48px" }}
          >
            <div style={{ maxWidth: 800, margin: "0 auto", textAlign: "center" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20 }}>
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
                  {_locationContent?.aboutTitle || `About`}
                </span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              <p style={{ fontFamily: NU, fontSize: 15, color: C.grey, lineHeight: 1.9, fontWeight: 300 }}>
                {(_locationContent?.aboutContent || _locationContent?.seoContent || currentLocation?.evergreenContent || "").replace(/<[^>]*>/g, "")}
              </p>
            </div>
          </section>
        )}

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

        {/* ═══ FIND YOUR TEAM — Category Shortcuts ═════════════════════════════ */}
        <section
          aria-label="Browse by category"
          className="lwd-region-categories"
          style={{ background: C.black, padding: "72px 48px", borderBottom: `1px solid ${C.border}` }}
        >
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 48 }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
                <div style={{ width: 28, height: 1, background: C.gold }} />
                <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>Find Your Team</span>
                <div style={{ width: 28, height: 1, background: C.gold }} />
              </div>
              <h2 style={{ fontFamily: GD, fontSize: "clamp(26px, 3vw, 36px)", fontWeight: 400, color: C.off, lineHeight: 1.2, margin: 0 }}>
                {currentLocation?.name}{" "}
                <span style={{ fontStyle: "italic", color: C.gold }}>Wedding Vendors</span>
              </h2>
            </div>
            <CategoryCarousel
              categories={VENDOR_CATEGORIES}
              C={C}
              onSelect={(slug) => onViewCategory({ category: slug, countrySlug: currentLocation?.slug })}
            />
          </div>
        </section>

        {/* ═══ SIGNATURE VENUES — matching RegionPage card row pattern ═══════ */}
        {locationVenues.length > 0 && viewMode !== "map" && (
          <section
            aria-label={`Wedding professionals in ${currentLocation.name}`}
            className="lwd-region-section"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "24px 48px 32px",
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(26px, 3vw, 36px)",
                  fontWeight: 400,
                  color: C.off,
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                {_locationContent?.featuredVenuesTitle || "Signature"}{" "}
                <span style={{ fontStyle: "italic", color: C.gold }}>Listings</span>
              </h2>
              <p style={{
                fontFamily: NU, fontSize: 14, color: C.grey,
                lineHeight: 1.75, maxWidth: 680, fontWeight: 300, margin: "12px 0 0",
              }}>
                The finest wedding professionals across {currentLocation.name}. Each one curated by our editorial team and trusted by real couples.
              </p>
            </div>

            <div ref={grid1Ref}>
              {viewMode === "grid" ? (
                <SliderNav
                  key={locationVenues[0]?.id || "empty"}
                  className="lwd-region-venue-grid"
                  cardWidth={360}
                  gap={isMobile ? 12 : 16}
                >
                  {locationVenues.slice(0, 4).map((v, i) => (
                    <div
                      key={v.id}
                      className="lwd-region-venue-card"
                      style={{
                        flex: "0 0 360px",
                        scrollSnapAlign: "start",
                        ...revealStyle(grid1In, i),
                      }}
                    >
                      <LuxuryVenueCard
                        v={v}
                        isMobile={isMobile}
                        onView={() => onViewVenue(v.slug || v.id)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    </div>
                  ))}
                </SliderNav>
              ) : (
                <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                  {locationVenues.slice(0, 4).map((v, i) => (
                    <HCard
                      key={v.id}
                      v={v}
                      onView={() => onViewVenue(v.slug || v.id)}
                      onQuickView={setQvItem}
                      onSave={() => {}}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ═══ ALL VENUES — full grid/list below signature row ═════════════════ */}
        {locationVenues.length > 4 && viewMode !== "map" && (
          <section
            aria-label={`More listings in ${currentLocation.name}`}
            className="lwd-region-section"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "24px 48px 32px",
            }}
          >
            <div style={{ marginBottom: 24 }}>
              <h2
                style={{
                  fontFamily: GD,
                  fontSize: "clamp(22px, 2.5vw, 30px)",
                  fontWeight: 400,
                  color: C.off,
                  lineHeight: 1.2,
                  margin: 0,
                }}
              >
                More Wedding{" "}
                <span style={{ fontStyle: "italic", color: C.gold }}>Professionals</span>
              </h2>
              <p style={{
                fontFamily: NU, fontSize: 14, color: C.grey,
                lineHeight: 1.75, maxWidth: 680, fontWeight: 300, margin: "12px 0 0",
              }}>
                Venues, photographers, planners, florists and stylists across {currentLocation.name}. Each one trusted by our editorial team and verified by real couples.
              </p>
            </div>

            {viewMode === "grid" ? (
              <SliderNav
                className="lwd-region-venue-grid"
                cardWidth={360}
                gap={isMobile ? 12 : 16}
              >
                {locationVenues.slice(4, visibleCount).filter(venue => venue?.imgs?.length > 0).map((v, i) => (
                  <div
                    key={v.id}
                    className="lwd-region-venue-card"
                    style={{
                      flex: "0 0 360px",
                      scrollSnapAlign: "start",
                    }}
                  >
                    <LuxuryVenueCard
                      v={v}
                      isMobile={isMobile}
                      onView={() => onViewVenue(v.slug || v.id)}
                      quickViewItem={qvItem}
                      setQuickViewItem={setQvItem}
                    />
                  </div>
                ))}
              </SliderNav>
            ) : (
              <div style={{ maxWidth: 1280, margin: "0 auto" }}>
                {locationVenues.slice(4, visibleCount).filter(venue => venue?.imgs?.length > 0).map((v) => (
                  <HCard
                    key={v.id}
                    v={v}
                    onView={() => onViewVenue(v.slug || v.id)}
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
          </section>
        )}

        {/* ═══ EDITORIAL SECTION ═══════════════════════════════════════════════ */}
        {currentLocation?.editorial && (
          <EditorialSection editorial={currentLocation.editorial} locationName={currentLocation?.name} C={C} />
        )}

        {/* ═══ FEATURED SLIDER — LWD Signature Collection ═══════════════════ */}
        {/* Admin controls which listings appear via featuredVenueIds in location content.
            Falls back to first 4 listings when no featured IDs are set. */}
        {locationVenues.length > 0 && (() => {
          const fIds = _locationContent?.signatureCollectionIds || featuredVenueIds;
          const sliderVenues = fIds?.length
            ? fIds.map(id => locationVenues.find(v => v.id === id)).filter(Boolean)
            : locationVenues.slice(0, 4);
          return sliderVenues.length > 0 ? (
          <FeaturedSlider
            venues={sliderVenues.map(v => ({
              ...v,
              city:     v.city || "",
              region:   v.region || "",
              country:  currentLocation?.name || v.country || "",
              capacity: v.capacity || v.guest_count || 200,
              rating:   v.rating ?? v.avg_rating ?? 5,
              reviews:  v.reviews ?? v.review_count ?? 0,
              tag:      v.tag || v.badge || "",
              desc:     (v.desc || v.description || v.tagline || "").replace(/<[^>]*>/g, "").substring(0, 200),
              imgs:     (v.imgs?.length ? v.imgs : [v.image || v.hero_image || "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80"])
                .map(img => typeof img === "string" ? img : (img?.src || img?.url || "")),
            }))}
            onViewVenue={(v) => onViewVenue(v.slug || v.id)}
          />
          ) : null;
        })()}

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

        {/* ═══ BROWSE BY REGION — footer area ═════════════════════════════════ */}
        <DirectoryBrands
          onViewRegion={onViewRegion}
          onViewCategory={onViewCategory}
          showInternational={false}
          showUK={currentLocation?.slug !== "italy" && currentLocation?.slug !== "usa"}
          showItaly={currentLocation?.slug === "italy"}
          showUSA={currentLocation?.slug === "usa"}
        />

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
