// ═══════════════════════════════════════════════════════════════════════════
// ListingsPage — Editorial-First Premium Master Browse Gateway
// Route: /listings
// Redesigned as: Discovery-first editorial gateway, not search-first directory dump
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useMemo, useCallback } from "react";
import { ThemeCtx } from "../theme/ThemeContext";
import { getDarkPalette, getLightPalette, getDefaultMode } from "../theme/tokens";
import { VENDOR_CATEGORIES, COUNTRIES } from "../data/geo.js";
import { VENUES } from "../data/italyVenues";
import { VENDORS } from "../data/vendors.js";
import { fetchListings } from "../services/listings";
import HomeNav from "../components/nav/HomeNav";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import PlannerCard from "../components/cards/PlannerCard";
import QuickViewModal from "../components/modals/QuickViewModal";
import "../category.css";

// ── Design tokens ────────────────────────────────────────────────────────────
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const PURPLE = "#A78BFA";
const GREEN = "#6BA3A3";

// ── Curated collections metadata ─────────────────────────────────────────────
const COLLECTIONS = [
  {
    id: "editors-picks",
    title: "Editor's Picks",
    subtitle: "Personally recommended this season",
    icon: "✦",
    color: GOLD,
    filter: l => l.featured || l.lwdScore > 8.5,
    limit: 3,
  },
  {
    id: "trending-now",
    title: "Trending Now",
    subtitle: "Featured in recent articles",
    icon: "⬆",
    color: PURPLE,
    filter: l => l.featured && (l.reviewCount || 0) > 5,
    limit: 3,
  },
  {
    id: "award-winners",
    title: "Award Winners",
    subtitle: "Recognized for excellence",
    icon: "★",
    color: GREEN,
    filter: l => l.tag === "Award Winner" || l.verified,
    limit: 3,
  },
];

// ── Sort helpers ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: "recommended", label: "Recommended" },
  { key: "rating", label: "Highest Rated" },
  { key: "newest", label: "Newest" },
  { key: "price-low", label: "Price: Low → High" },
  { key: "price-high", label: "Price: High → Low" },
];

function sortListings(items, mode) {
  const arr = [...items];
  switch (mode) {
    case "rating":
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "newest":
      return arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    case "price-low":
      return arr.sort((a, b) => (parsePriceNum(a.priceFrom) || 99999) - (parsePriceNum(b.priceFrom) || 99999));
    case "price-high":
      return arr.sort((a, b) => (parsePriceNum(b.priceFrom) || 0) - (parsePriceNum(a.priceFrom) || 0));
    default: // recommended: showcase/featured first, then by rating
      return arr.sort((a, b) => {
        const aScore = (a.tier === "showcase" ? 3 : a.tier === "featured" ? 2 : 1) + ((a.rating || 0) / 10);
        const bScore = (b.tier === "showcase" ? 3 : b.tier === "featured" ? 2 : 1) + ((b.rating || 0) / 10);
        return bScore - aScore;
      });
  }
}

function parsePriceNum(p) {
  if (!p) return null;
  const n = parseInt(String(p).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}

function extractRegions(listings) {
  const map = new Map();
  listings.forEach(l => {
    const slug = l.regionSlug || l.region_slug;
    const name = l.region || (slug || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (slug && !map.has(slug)) map.set(slug, name);
  });
  return Array.from(map.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function ListingsPage({
  onBack = () => {},
  onViewVenue = () => {},
  onNavigateHome,
  onToggleDark,
  darkMode: dmProp,
  onVendorLogin,
  onNavigateStandard,
  onNavigateAbout,
  footerNav = {},
}) {
  const [darkMode, setDarkMode] = useState(() => dmProp ?? getDefaultMode() === "dark");
  const C = darkMode ? getDarkPalette() : getLightPalette();

  // ── Filters ────────────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");
  const [regionFilter, setRegionFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortMode, setSortMode] = useState("recommended");
  const [showFilters, setShowFilters] = useState(false);

  // ── Data ───────────────────────────────────────────────────────────────
  const [dbListings, setDbListings] = useState([]);
  const [dbLoaded, setDbLoaded] = useState(false);
  const [qvItem, setQvItem] = useState(null);
  const [browsePageNum, setBrowsePageNum] = useState(1);
  const [isMobile, setIsMobile] = useState(false);

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // ── Fetch DB listings ──────────────────────────────────────────────────
  useEffect(() => {
    const filters = { status: "published" };
    if (categoryFilter !== "all") filters.category_slug = categoryFilter;
    if (countryFilter !== "all") filters.country_slug = countryFilter;
    if (regionFilter !== "all") filters.region_slug = regionFilter;

    fetchListings(filters)
      .then(rows => {
        setDbListings(rows || []);
        setDbLoaded(true);
      })
      .catch(() => {
        setDbListings([]);
        setDbLoaded(true);
      });
  }, [categoryFilter, countryFilter, regionFilter]);

  // Reset page when filters change
  useEffect(() => {
    setBrowsePageNum(1);
  }, [categoryFilter, countryFilter, regionFilter, searchQuery, sortMode]);

  // ── Merge DB + static data ────────────────────────────────────────────
  const allListings = useMemo(() => {
    const dbCards = dbListings.map(l => ({
      id: l.id,
      name: l.cardTitle || l.name || "",
      slug: l.slug || "",
      categorySlug: l.categorySlug || l.category_slug || "wedding-venues",
      countrySlug: l.countrySlug || l.country_slug || "",
      regionSlug: l.regionSlug || l.region_slug || "",
      region: l.region || "",
      city: l.city || "",
      country: l.country || "",
      imgs: Array.isArray(l.imgs)
        ? l.imgs.map(img => typeof img === "string" ? img : (img.src || img.url || "")).filter(Boolean)
        : l.heroImage ? [l.heroImage] : [],
      desc: l.cardSummary || l.shortDescription || l.desc || "",
      priceFrom: (() => {
        const p = l.priceFrom;
        if (!p) return "";
        if (typeof p === "string" && /[£€$]/.test(p)) return p;
        const num = parseInt(p, 10);
        if (isNaN(num)) return p;
        const sym = (l.priceCurrency || "GBP") === "EUR" ? "€" : (l.priceCurrency || "GBP") === "USD" ? "$" : "£";
        return `${sym}${num.toLocaleString("en-GB")}`;
      })(),
      capacity: l.capacityMax || l.capacityMin || l.capacity || null,
      rating: l.rating ?? null,
      reviews: l.reviewCount ?? l.reviews ?? null,
      verified: l.isVerified ?? l.verified ?? false,
      featured: l.isFeatured ?? l.featured ?? false,
      tier: l.tier || (l.featured ? "featured" : "standard"),
      lwdScore: l.lwdScore ?? null,
      tag: l.cardBadge || l.tag || null,
      styles: Array.isArray(l.styles) ? l.styles : [],
      includes: Array.isArray(l.amenities) ? l.amenities : [],
      showcaseUrl: l.showcaseEnabled && l.slug ? `/showcase/${l.slug}` : null,
      videoUrl: l.videoUrl || null,
      online: true,
      createdAt: l.createdAt || l.created_at || "",
    }));

    let staticVenues = VENUES || [];
    if (categoryFilter !== "all" && categoryFilter !== "wedding-venues") staticVenues = [];
    if (countryFilter !== "all")
      staticVenues = staticVenues.filter(v => (v.countrySlug || "").toLowerCase() === countryFilter);
    if (regionFilter !== "all")
      staticVenues = staticVenues.filter(v => (v.regionSlug || "").toLowerCase() === regionFilter);
    const svMapped = staticVenues.map(v => ({
      ...v,
      categorySlug: v.categorySlug || "wedding-venues",
      tier: v.tier || "standard",
    }));

    let staticVendors = VENDORS || [];
    if (categoryFilter !== "all") {
      staticVendors = staticVendors.filter(v => {
        const cat = (v.categorySlug || v.category || "").toLowerCase();
        return cat === categoryFilter || cat.includes(categoryFilter);
      });
    }
    if (countryFilter !== "all") staticVendors = staticVendors.filter(v => (v.countrySlug || v.country || "").toLowerCase() === countryFilter);

    const dbNames = new Set(dbCards.map(v => (v.name || "").toLowerCase()));
    const uniqueStaticVenues = svMapped.filter(v => !dbNames.has((v.name || "").toLowerCase()));
    const uniqueStaticVendors = staticVendors.filter(v => !dbNames.has((v.name || "").toLowerCase()));

    return [...dbCards, ...uniqueStaticVenues, ...uniqueStaticVendors];
  }, [dbListings, categoryFilter, countryFilter, regionFilter]);

  // ── Client-side filter + sort ──────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    let items = allListings;

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(v =>
        (v.name || "").toLowerCase().includes(q) ||
        (v.desc || "").toLowerCase().includes(q) ||
        (v.city || "").toLowerCase().includes(q) ||
        (v.region || "").toLowerCase().includes(q) ||
        (v.country || "").toLowerCase().includes(q)
      );
    }

    return sortListings(items, sortMode);
  }, [allListings, searchQuery, sortMode]);

  // ── Curated collections ────────────────────────────────────────────────
  const curatedCollections = useMemo(() => {
    return COLLECTIONS.map(coll => {
      let items = filteredSorted.filter(coll.filter);
      if (categoryFilter !== "all") {
        items = items.filter(v => (v.categorySlug || "").toLowerCase() === categoryFilter);
      }
      return {
        ...coll,
        items: items.slice(0, coll.limit),
        hasMore: items.length > coll.limit,
        totalCount: items.length,
      };
    }).filter(c => c.items.length > 0);
  }, [filteredSorted, categoryFilter]);

  // ── Browse section (all results paginated) ──────────────────────────────
  const browseItems = useMemo(() => {
    // For browse section, show everything except what's already in featured collections
    const featuredIds = new Set();
    curatedCollections.forEach(coll => {
      coll.items.forEach(item => {
        featuredIds.add(item.id || item.slug);
      });
    });

    let items = filteredSorted.filter(v => !featuredIds.has(v.id || v.slug));
    return items;
  }, [filteredSorted, curatedCollections]);

  const totalBrowsePages = Math.ceil(browseItems.length / ITEMS_PER_PAGE);
  const browsePage = Math.min(browsePageNum, Math.max(1, totalBrowsePages));
  const visibleBrowseItems = browseItems.slice((browsePage - 1) * ITEMS_PER_PAGE, browsePage * ITEMS_PER_PAGE);

  const availableRegions = useMemo(() => extractRegions(allListings), [allListings]);

  // ── Style tokens ───────────────────────────────────────────────────────
  const bg = C.black || "#0d0b09";
  const cardBg = C.dark || "#141210";
  const text = C.white || "#f5f1eb";
  const muted = "rgba(245,241,235,0.52)";
  const subtle = "rgba(245,241,235,0.3)";
  const divider = "rgba(255,255,255,0.06)";
  const goldDim = "rgba(201,168,76,0.08)";
  const goldBorder = "rgba(201,168,76,0.25)";

  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setCountryFilter("all");
    setRegionFilter("all");
    setSearchQuery("");
    setSortMode("recommended");
  }, []);

  const hasActiveFilters =
    categoryFilter !== "all" ||
    countryFilter !== "all" ||
    regionFilter !== "all" ||
    searchQuery.trim();

  // ═══════════════════════════════════════════════════════════════════════
  // Render
  // ═══════════════════════════════════════════════════════════════════════
  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: NU }}>

        {/* ── Nav ─────────────────────────────────────────────────────────── */}
        <HomeNav
          hasHero={true}
          darkMode={darkMode}
          onToggleDark={onToggleDark || (() => setDarkMode(d => !d))}
          onNavigateStandard={onNavigateStandard || onBack}
          onNavigateAbout={onNavigateAbout || onBack}
          onVendorLogin={onVendorLogin}
        />

        {/* ── Hero: Editorial positioning, not search-first ──────────────── */}
        <section style={{
          position: "relative",
          padding: "120px 24px 60px",
          textAlign: "center",
          overflow: "hidden",
          background: bg,
          borderBottom: `1px solid ${divider}`,
        }}>
          {/* Ambient glow */}
          <div style={{
            position: "absolute", top: "30%", left: "50%", transform: "translate(-50%, -50%)",
            width: 700, height: 500, borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 70%)",
            pointerEvents: "none",
          }} />

          <div style={{ position: "relative", maxWidth: 680, margin: "0 auto" }}>
            <div style={{
              fontFamily: NU, fontSize: 11, letterSpacing: "0.25em",
              textTransform: "uppercase", color: GOLD, marginBottom: 16, opacity: 0.85,
            }}>
              Premium Editorial Directory
            </div>

            <h1 style={{
              fontFamily: GD, fontSize: "clamp(36px, 6vw, 56px)", fontWeight: 400,
              fontStyle: "italic", color: text, margin: "0 0 16px", lineHeight: 1.15,
            }}>
              The Finest Wedding Professionals Worldwide
            </h1>

            <p style={{
              fontFamily: NU, fontSize: "clamp(15px, 2vw, 17px)", color: muted, margin: "0 0 8px",
              lineHeight: 1.7, maxWidth: 540, marginLeft: "auto", marginRight: "auto",
            }}>
              Discover exceptional venues, planners, and vendors personally reviewed and editorially curated.
            </p>
            <p style={{
              fontFamily: NU, fontSize: 13, color: subtle, margin: "0 0 40px",
              lineHeight: 1.6,
            }}>
              Browse by destination, explore featured collections, or search by specialty.
            </p>

            {/* Search input – secondary, not primary */}
            <div style={{ maxWidth: 480, margin: "0 auto", position: "relative" }}>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, specialty, or location..."
                style={{
                  width: "100%", padding: "13px 20px 13px 42px",
                  background: "rgba(255,255,255,0.04)",
                  border: `1px solid ${divider}`,
                  borderRadius: 40,
                  fontFamily: NU, fontSize: 13, color: text,
                  outline: "none", boxSizing: "border-box",
                  transition: "border-color 0.2s",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = goldBorder; }}
                onBlur={e => { e.currentTarget.style.borderColor = divider; }}
              />
              <span style={{
                position: "absolute", left: 16, top: "50%", transform: "translateY(-50%)",
                fontSize: 15, color: muted, pointerEvents: "none",
              }}>⌕</span>
            </div>
          </div>
        </section>

        {/* ── FEATURED COLLECTIONS: Editorial-First Discovery ───────────── */}
        {curatedCollections.length > 0 && (
          <section style={{ padding: "80px 24px", maxWidth: 1360, margin: "0 auto" }}>
            {curatedCollections.map((coll, idx) => (
              <div key={coll.id} style={{ marginBottom: idx < curatedCollections.length - 1 ? 100 : 0 }}>
                {/* Collection header */}
                <div style={{
                  marginBottom: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                  gap: 20,
                }}>
                  <div>
                    <div style={{
                      fontFamily: NU, fontSize: 11, letterSpacing: "0.2em",
                      textTransform: "uppercase", color: coll.color, marginBottom: 8, opacity: 0.75,
                      display: "flex", alignItems: "center", gap: 6,
                    }}>
                      <span style={{ fontSize: 14 }}>{coll.icon}</span>
                      {coll.title}
                    </div>
                    <p style={{
                      fontFamily: NU, fontSize: 13, color: muted, margin: 0,
                    }}>
                      {coll.subtitle}
                    </p>
                  </div>
                  {coll.hasMore && (
                    <button
                      style={{
                        fontFamily: NU, fontSize: 12, fontWeight: 600, color: coll.color,
                        background: "transparent", border: "none", cursor: "pointer",
                        textDecoration: "underline", textUnderlineOffset: 3,
                      }}
                    >
                      See all →
                    </button>
                  )}
                </div>

                {/* Collection cards */}
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: 20,
                }}>
                  {coll.items.map(v => {
                    const cat = (v.categorySlug || "").toLowerCase();
                    if (cat === "wedding-planners") {
                      return (
                        <PlannerCard
                          key={v.id || v.slug || v.name}
                          v={v}
                          onView={() => onViewVenue(v.id || v.slug)}
                        />
                      );
                    }
                    if (cat === "wedding-venues") {
                      return (
                        <LuxuryVenueCard
                          key={v.id || v.slug || v.name}
                          v={v}
                          onView={() => onViewVenue(v.id || v.slug)}
                          quickViewItem={qvItem}
                          setQuickViewItem={setQvItem}
                        />
                      );
                    }
                    return (
                      <LuxuryVendorCard
                        key={v.id || v.slug || v.name}
                        v={v}
                        onView={() => onViewVenue(v.id || v.slug)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* ── Why Browse LWD: Editorial Narrative ─────────────────────────── */}
        <section style={{
          borderTop: `1px solid ${divider}`,
          padding: "80px 24px",
          background: `rgba(255,255,255,0.01)`,
        }}>
          <div style={{ maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <h2 style={{
              fontFamily: GD, fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400,
              fontStyle: "italic", color: text, margin: "0 0 16px", lineHeight: 1.2,
            }}>
              Why Browse the Luxury Wedding Directory
            </h2>

            <p style={{
              fontFamily: NU, fontSize: 15, color: muted, lineHeight: 1.8, margin: "0 0 28px",
            }}>
              Every professional in our directory has been personally reviewed by our editorial team. We prioritize authenticity, expertise, and attention to detail—the same qualities that define exceptional weddings.
            </p>

            <div style={{
              display: "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap: 24,
              marginTop: 40,
            }}>
              {[
                { title: "Personally Curated", desc: "Each listing meets exacting editorial standards" },
                { title: "Featured Content", desc: "Magazine articles and editorial stories" },
                { title: "Verified Excellence", desc: "Reviews, ratings, and editorial recognition" },
              ].map((item, idx) => (
                <div key={idx}>
                  <div style={{
                    fontFamily: NU, fontSize: 12, fontWeight: 600, color: GOLD,
                    marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.05em",
                  }}>
                    ✦ {item.title}
                  </div>
                  <p style={{
                    fontFamily: NU, fontSize: 13, color: subtle, lineHeight: 1.6, margin: 0,
                  }}>
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Browse All: Integrated Filter Bar ──────────────────────────── */}
        {browseItems.length > 0 && (
          <section style={{
            borderTop: `1px solid ${divider}`,
            padding: "60px 24px 40px",
            maxWidth: 1360, margin: "0 auto",
          }}>
            <div style={{
              marginBottom: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 16,
            }}>
              <div>
                <h2 style={{
                  fontFamily: GD, fontSize: "clamp(24px, 3vw, 32px)", fontWeight: 400,
                  fontStyle: "italic", color: text, margin: 0,
                }}>
                  Browse All Professionals
                </h2>
                <p style={{
                  fontFamily: NU, fontSize: 13, color: muted, margin: "8px 0 0", opacity: 0.7,
                }}>
                  {browseItems.length} professional{browseItems.length !== 1 ? "s" : ""} available
                </p>
              </div>

              {/* Filter toggle button (integrated, not separate bar) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  fontFamily: NU, fontSize: 12, fontWeight: 600,
                  color: showFilters ? "#0d0b09" : muted,
                  background: showFilters ? GOLD : "rgba(255,255,255,0.04)",
                  border: showFilters ? "none" : `1px solid ${divider}`,
                  borderRadius: 24, padding: "8px 18px",
                  cursor: "pointer", transition: "all 0.2s",
                }}
              >
                {showFilters ? "✓ Filters Active" : "Filter & Sort"}
              </button>
            </div>

            {/* Collapsible filter panel */}
            {showFilters && (
              <div style={{
                background: `rgba(255,255,255,0.02)`,
                border: `1px solid ${divider}`,
                borderRadius: 12,
                padding: 24,
                marginBottom: 40,
              }}>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: 16,
                  marginBottom: 20,
                }}>
                  {/* Category */}
                  <FilterDropdown
                    label="Category"
                    value={categoryFilter}
                    onChange={setCategoryFilter}
                    options={[
                      { value: "all", label: "All Categories" },
                      ...VENDOR_CATEGORIES.map(c => ({ value: c.slug, label: c.label })),
                    ]}
                    text={text} muted={muted} divider={divider} bg={bg}
                  />

                  {/* Country */}
                  <FilterDropdown
                    label="Country"
                    value={countryFilter}
                    onChange={v => {
                      setCountryFilter(v);
                      setRegionFilter("all");
                    }}
                    options={[
                      { value: "all", label: "All Countries" },
                      ...COUNTRIES.map(c => ({ value: c.slug, label: c.name })),
                    ]}
                    text={text} muted={muted} divider={divider} bg={bg}
                  />

                  {/* Region – cascading */}
                  {countryFilter !== "all" && availableRegions.length > 0 && (
                    <FilterDropdown
                      label="Region"
                      value={regionFilter}
                      onChange={setRegionFilter}
                      options={[
                        { value: "all", label: "All Regions" },
                        ...availableRegions.map(r => ({ value: r.slug, label: r.name })),
                      ]}
                      text={text} muted={muted} divider={divider} bg={bg}
                    />
                  )}

                  {/* Sort */}
                  <FilterDropdown
                    label="Sort"
                    value={sortMode}
                    onChange={setSortMode}
                    options={SORT_OPTIONS.map(s => ({ value: s.key, label: s.label }))}
                    text={text} muted={muted} divider={divider} bg={bg}
                  />
                </div>

                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    style={{
                      fontFamily: NU, fontSize: 12, fontWeight: 600,
                      color: GOLD, background: "transparent", border: "none",
                      cursor: "pointer", textDecoration: "underline", textUnderlineOffset: 2,
                    }}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            )}

            {/* Browse grid */}
            {!dbLoaded ? (
              <div style={{
                display: "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap: 16,
              }}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      height: 360, borderRadius: 8,
                      background: `linear-gradient(135deg, ${cardBg}, rgba(201,168,76,0.03))`,
                      animation: "pulse 1.8s ease-in-out infinite",
                    }}
                  />
                ))}
              </div>
            ) : browseItems.length === 0 ? (
              /* Empty state with editorial voice */
              <div style={{
                textAlign: "center", padding: "80px 24px",
                maxWidth: 520, margin: "0 auto",
              }}>
                <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.3 }}>⌀</div>
                <h3 style={{
                  fontFamily: GD, fontSize: 26, fontWeight: 400, fontStyle: "italic",
                  color: text, margin: "0 0 12px",
                }}>
                  No professionals match your search
                </h3>
                <p style={{
                  fontFamily: NU, fontSize: 14, color: muted, lineHeight: 1.7, marginBottom: 32,
                }}>
                  Our editors carefully select each professional. Try broadening your search or explore our featured collections above.
                </p>

                <button
                  onClick={clearFilters}
                  style={{
                    fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: "0.04em",
                    color: "#0d0b09", background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                    border: "none", borderRadius: 8, padding: "12px 32px",
                    cursor: "pointer", marginBottom: 32,
                  }}
                >
                  Reset & Browse Collections
                </button>

                <div style={{ borderTop: `1px solid ${divider}`, paddingTop: 28 }}>
                  <div style={{
                    fontFamily: NU, fontSize: 10, letterSpacing: "0.2em",
                    textTransform: "uppercase", color: GOLD, marginBottom: 16, opacity: 0.7,
                  }}>
                    Or explore by destination
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center" }}>
                    {COUNTRIES.slice(0, 5).map(c => (
                      <button
                        key={c.slug}
                        onClick={() => {
                          clearFilters();
                          setCountryFilter(c.slug);
                        }}
                        style={{
                          fontFamily: NU, fontSize: 12, color: muted,
                          background: "rgba(255,255,255,0.04)",
                          border: `1px solid ${divider}`, borderRadius: 20,
                          padding: "6px 16px", cursor: "pointer",
                        }}
                      >
                        {c.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap: 16,
                  marginBottom: 48,
                }}>
                  {visibleBrowseItems.map(v => {
                    const cat = (v.categorySlug || "").toLowerCase();
                    if (cat === "wedding-planners") {
                      return (
                        <PlannerCard
                          key={v.id || v.slug || v.name}
                          v={v}
                          onView={() => onViewVenue(v.id || v.slug)}
                        />
                      );
                    }
                    if (cat === "wedding-venues") {
                      return (
                        <LuxuryVenueCard
                          key={v.id || v.slug || v.name}
                          v={v}
                          onView={() => onViewVenue(v.id || v.slug)}
                          quickViewItem={qvItem}
                          setQuickViewItem={setQvItem}
                        />
                      );
                    }
                    return (
                      <LuxuryVendorCard
                        key={v.id || v.slug || v.name}
                        v={v}
                        onView={() => onViewVenue(v.id || v.slug)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    );
                  })}
                </div>

                {/* Proper pagination */}
                {totalBrowsePages > 1 && (
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    marginTop: 48,
                  }}>
                    {browsePage > 1 && (
                      <button
                        onClick={() => setBrowsePageNum(browsePage - 1)}
                        style={{
                          fontFamily: NU, fontSize: 12, fontWeight: 600,
                          color: muted, background: "transparent", border: `1px solid ${divider}`,
                          borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = goldBorder;
                          e.currentTarget.style.color = text;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = divider;
                          e.currentTarget.style.color = muted;
                        }}
                      >
                        ← Previous
                      </button>
                    )}

                    <div style={{
                      fontFamily: NU, fontSize: 12, color: muted, minWidth: 120, textAlign: "center",
                    }}>
                      Page {browsePage} of {totalBrowsePages}
                    </div>

                    {browsePage < totalBrowsePages && (
                      <button
                        onClick={() => setBrowsePageNum(browsePage + 1)}
                        style={{
                          fontFamily: NU, fontSize: 12, fontWeight: 600,
                          color: muted, background: "transparent", border: `1px solid ${divider}`,
                          borderRadius: 6, padding: "8px 12px", cursor: "pointer",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = goldBorder;
                          e.currentTarget.style.color = text;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = divider;
                          e.currentTarget.style.color = muted;
                        }}
                      >
                        Next →
                      </button>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* ── QuickView Modal ─────────────────────────────────────────────── */}
        {qvItem && (
          <QuickViewModal
            item={qvItem}
            onClose={() => setQvItem(null)}
            onView={() => { onViewVenue(qvItem.id || qvItem.slug); setQvItem(null); }}
          />
        )}

        {/* Keyframes */}
        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.4; }
            50% { opacity: 0.7; }
          }
        `}</style>
      </div>
    </ThemeCtx.Provider>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FilterDropdown — lightweight select-style dropdown
// ═══════════════════════════════════════════════════════════════════════════

function FilterDropdown({ label, value, onChange, options, text, muted, divider, bg }) {
  return (
    <div>
      <label style={{
        fontFamily: "var(--font-body)",
        fontSize: 11,
        fontWeight: 600,
        color: muted,
        textTransform: "uppercase",
        letterSpacing: "0.05em",
        display: "block",
        marginBottom: 6,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 13,
            fontWeight: 500,
            color: text,
            background: "rgba(255,255,255,0.04)",
            border: `1px solid rgba(255,255,255,0.08)`,
            borderRadius: 8,
            padding: "10px 32px 10px 12px",
            cursor: "pointer",
            appearance: "none",
            outline: "none",
            transition: "border-color 0.2s",
            width: "100%",
            boxSizing: "border-box",
          }}
          onFocus={e => {
            e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
          }}
          onBlur={e => {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)";
          }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: bg || "#0d0b09", color: text }}>
              {opt.label}
            </option>
          ))}
        </select>
        <span style={{
          position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
          fontSize: 8, color: muted, pointerEvents: "none",
        }}>▼</span>
      </div>
    </div>
  );
}
