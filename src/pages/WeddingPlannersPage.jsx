// ─── src/pages/WeddingPlannersPage.jsx ────────────────────────────────────────
// Dedicated template for wedding planners — person-focused, editorial feel.
// Fundamentally different from RegionCategoryPage (venue/space-focused).

import { useState, useMemo, useEffect } from "react";
import { useTheme } from "../theme/ThemeContext";
import { getDefaultMode } from "../theme/tokens";
import { NAV_H } from "../theme/tokens";
import { VENDORS, PLANNER_SERVICE_TIERS } from "../data/vendors";
import { VENDOR_CATEGORIES } from "../data/geo.js";
import PlannerCard from "../components/cards/PlannerCard";
import PlannerFilterBar from "../components/filters/PlannerFilterBar";
import FeaturedPlannersCarousel from "../components/sections/FeaturedPlannersCarousel";
import PlannerMapPanel from "../components/maps/PlannerMapPanel";
import EditorialWeddingsShowcase from "../components/sections/EditorialWeddingsShowcase";
import SiteFooter from "../components/sections/SiteFooter";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

// ── Hero image ───────────────────────────────────────────────────────────────
const HERO_IMG = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80";

// ── Trust cards for editorial intro ──────────────────────────────────────────
const TRUST_POINTS = [
  { icon: "✦", title: "Personally Vetted", desc: "Every planner reviewed by our editorial team" },
  { icon: "◈", title: "No Paid Placements", desc: "Rankings based on quality, not ad spend" },
  { icon: "✓", title: "Verified Reviews", desc: "Authentic feedback from real couples" },
];

// ── Region display name helper ───────────────────────────────────────────────
function regionDisplay(slug) {
  const map = {
    tuscany: "Tuscany", "amalfi-coast": "Amalfi Coast", "lake-como": "Lake Como",
    sicily: "Sicily", venice: "Venice", umbria: "Umbria", rome: "Rome",
    puglia: "Puglia", milan: "Milan", "italian-riviera": "Italian Riviera",
  };
  return map[slug] || slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Italy";
}

function countryDisplay(slug) {
  const map = { italy: "Italy", france: "France", uk: "United Kingdom", usa: "United States" };
  return map[slug] || slug?.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "";
}

// ── Sort logic ───────────────────────────────────────────────────────────────
function sortPlanners(list, sortId) {
  const sorted = [...list];
  switch (sortId) {
    case "rating":     return sorted.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "price-low":  return sorted.sort((a, b) => parsePrice(a.priceFrom) - parsePrice(b.priceFrom));
    case "price-high": return sorted.sort((a, b) => parsePrice(b.priceFrom) - parsePrice(a.priceFrom));
    case "reviews":    return sorted.sort((a, b) => (b.reviews || 0) - (a.reviews || 0));
    default:           return sorted.sort((a, b) => (b.lwdScore || 0) - (a.lwdScore || 0)); // recommended
  }
}

function parsePrice(str) {
  if (!str) return 0;
  const n = parseFloat(str.replace(/[^0-9.]/g, ""));
  return isNaN(n) ? 0 : n;
}

// ══════════════════════════════════════════════════════════════════════════════
export default function WeddingPlannersPage({
  onBack = () => {},
  onBackHome = () => {},
  onViewCategory = () => {},
  onViewRegion = () => {},
  onViewRegionCategory = () => {},
  countrySlug = null,
  regionSlug = null,
  categorySlug = null,
  footerNav = {},
}) {
  const C = useTheme();

  // ── State ────────────────────────────────────────────────────────────────────
  const [filters, setFilters]   = useState({ tier: "All", region: "All", sort: "recommended" });
  const [viewMode,      setViewMode]      = useState("grid");
  const [scrolled,      setScrolled]      = useState(false);
  const [hoveredId,     setHoveredId]     = useState(null);
  const [activePinnedId, setActivePinnedId] = useState(null);
  const [showMap,       setShowMap]       = useState(false);

  // Scroll listener for nav
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Data ─────────────────────────────────────────────────────────────────────
  const allPlanners = useMemo(
    () => VENDORS.filter((v) => v.category === "planner"),
    [],
  );

  // Unique regions from planner data
  const regions = useMemo(
    () => [...new Set(allPlanners.map((p) => p.region))].sort(),
    [allPlanners],
  );

  // Filtered + sorted
  const filtered = useMemo(() => {
    let list = allPlanners;
    if (filters.tier && filters.tier !== "All") {
      list = list.filter((p) => p.serviceTier === filters.tier);
    }
    if (filters.region && filters.region !== "All") {
      list = list.filter((p) => p.region === filters.region);
    }
    return sortPlanners(list, filters.sort);
  }, [allPlanners, filters]);

  // Top 7 planners by lwdScore for rotating featured carousel
  const featuredPlanners = useMemo(
    () => [...allPlanners].sort((a, b) => (b.lwdScore || 0) - (a.lwdScore || 0)).slice(0, 7),
    [allPlanners],
  );

  // Aggregate real weddings from all planners with attribution
  const allRealWeddings = useMemo(
    () => allPlanners
      .flatMap((p) =>
        (p.realWeddings || []).map((w) => ({
          ...w,
          plannerName: p.name,
          plannerId:   p.id,
        }))
      )
      .slice(0, 8),
    [allPlanners],
  );

  // Sibling categories for "More in {Region}" section
  const siblingCategories = useMemo(
    () => VENDOR_CATEGORIES.filter((vc) => vc.slug !== "wedding-planners"),
    [],
  );

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const regionName  = regionSlug ? regionDisplay(regionSlug) : "Italy";
  const countryName = countrySlug ? countryDisplay(countrySlug) : "";

  return (
    <div style={{ background: C.black, minHeight: "100vh" }}>

      {/* ── 1. Hero (50vh) ──────────────────────────────────────────────────────── */}
      <section
        style={{
          position:   "relative",
          height:     "50vh",
          minHeight:  380,
          overflow:   "hidden",
          background: "#0a0806",
        }}
      >
        <img
          src={HERO_IMG}
          alt={`Wedding Planners in ${regionName}`}
          style={{
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            opacity:    0.55,
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(180deg, rgba(10,8,6,0.3) 0%, rgba(10,8,6,0.7) 100%)",
          }}
        />

        {/* Breadcrumbs */}
        <div
          style={{
            position:      "absolute",
            top:           NAV_H + 20,
            left:          isMobile ? 16 : 32,
            fontFamily:    NU,
            fontSize:      11,
            color:         "rgba(255,255,255,0.4)",
            display:       "flex",
            alignItems:    "center",
            gap:           6,
            letterSpacing: "0.3px",
          }}
        >
          <span style={{ cursor: "pointer", transition: "color 0.2s" }} onClick={onBackHome}>Home</span>
          <span style={{ opacity: 0.4 }}>›</span>
          {countryName && (
            <>
              <span style={{ cursor: "pointer" }} onClick={() => onViewRegion?.(countrySlug)}>{countryName}</span>
              <span style={{ opacity: 0.4 }}>›</span>
            </>
          )}
          {regionSlug && (
            <>
              <span style={{ cursor: "pointer" }} onClick={() => onViewRegion?.(countrySlug, regionSlug)}>{regionName}</span>
              <span style={{ opacity: 0.4 }}>›</span>
            </>
          )}
          <span style={{ color: GOLD }}>Wedding Planners</span>
        </div>

        {/* Hero text */}
        <div
          style={{
            position:      "absolute",
            bottom:        isMobile ? 24 : 48,
            left:          isMobile ? 16 : 32,
            right:         isMobile ? 16 : 32,
            maxWidth:      800,
          }}
        >
          <div
            style={{
              fontFamily:    NU,
              fontSize:      10,
              fontWeight:    600,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color:         GOLD,
              marginBottom:  12,
              display:       "flex",
              alignItems:    "center",
              gap:           10,
            }}
          >
            <span style={{ width: 28, height: 1, background: GOLD, display: "inline-block" }} />
            Wedding Planners · {regionName}
          </div>
          <h1
            style={{
              fontFamily:  GD,
              fontSize:    "clamp(32px, 5vw, 52px)",
              fontWeight:  400,
              color:       "#FFFFFF",
              lineHeight:  1.1,
              margin:      "0 0 16px",
            }}
          >
            Wedding Planners in{" "}
            <span style={{ fontStyle: "italic", color: GOLD }}>{regionName}</span>
          </h1>

          {/* Stats */}
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            {[
              { val: allPlanners.length, label: "Curated Planners" },
              { val: regions.length, label: "Regions Covered" },
              { val: "100%", label: "Personally Verified" },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 500, color: GOLD, lineHeight: 1 }}>
                  {s.val}
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: "1px", textTransform: "uppercase", marginTop: 4 }}>
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 2. Editorial Intro ──────────────────────────────────────────────────── */}
      <section
        style={{
          background: C.dark,
          padding:    isMobile ? "40px 16px" : "56px 32px",
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin:   "0 auto",
            display:  "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 360px",
            gap:      isMobile ? 28 : 48,
            alignItems: "start",
          }}
        >
          {/* Left — editorial copy */}
          <div>
            <div
              style={{
                fontFamily:    NU,
                fontSize:      10,
                fontWeight:    600,
                letterSpacing: "2.5px",
                textTransform: "uppercase",
                color:         C.gold,
                marginBottom:  12,
              }}
            >
              Why Hire a Wedding Planner
            </div>
            <h2
              style={{
                fontFamily: GD,
                fontSize:   32,
                fontWeight: 400,
                color:      C.white,
                lineHeight: 1.2,
                margin:     "0 0 20px",
              }}
            >
              The difference between a wedding and an{" "}
              <span style={{ fontStyle: "italic", color: C.gold }}>unforgettable celebration</span>
            </h2>
            <p
              style={{
                fontFamily: NU,
                fontSize:   14,
                color:      C.grey,
                lineHeight: 1.7,
                margin:     "0 0 16px",
                maxWidth:   600,
              }}
            >
              A destination wedding planner transforms logistics into magic. From navigating Italian
              legal requirements to curating the perfect vendor team, a great planner ensures every
              detail reflects your vision while you enjoy the journey.
            </p>
            <p
              style={{
                fontFamily: NU,
                fontSize:   14,
                color:      C.grey,
                lineHeight: 1.7,
                margin:     0,
                maxWidth:   600,
              }}
            >
              Every planner in our directory has been personally vetted by the LWD editorial team.
              We assess their portfolio depth, client communication, vendor relationships, and
              on-the-day execution before awarding a place in our curated index.
            </p>
          </div>

          {/* Right — trust cards */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {TRUST_POINTS.map((t) => (
              <div
                key={t.title}
                style={{
                  background:   C.card,
                  border:       `1px solid ${C.border}`,
                  borderRadius: "var(--lwd-radius-card)",
                  padding:      "16px 18px",
                  display:      "flex",
                  alignItems:   "flex-start",
                  gap:          14,
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
        </div>
      </section>

      {/* ── 3. Featured Planners ─────────────────────────────────────────────── */}
      {featuredPlanners.length > 0 && (
        <FeaturedPlannersCarousel featured={featuredPlanners} isMobile={isMobile} />
      )}

      {/* ── 3b. Real Weddings Slider ────────────────────────────────────────── */}
      {allRealWeddings.length > 0 && (
        <section style={{ background: C.dark, padding: isMobile ? "40px 16px 48px" : "56px 32px 64px" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>
            <EditorialWeddingsShowcase weddings={allRealWeddings} />
          </div>
        </section>
      )}

      {/* ── 4. Filter Bar ───────────────────────────────────────────────────────── */}
      <PlannerFilterBar
        regions={regions}
        filters={filters}
        onFilterChange={setFilters}
        viewMode={viewMode}
        onViewChange={setViewMode}
        totalCount={filtered.length}
      />

      {/* ── 5. Planner Grid / List ──────────────────────────────────────────────── */}
      <section style={{ background: C.black, padding: isMobile ? "32px 16px 48px" : "40px 32px 64px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          {/* Section title */}
          <div style={{ marginBottom: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
              <div style={{ width: 28, height: 1, background: C.gold }} />
              <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
                All Planners
              </span>
            </div>
            <h2 style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: C.white, lineHeight: 1.2, margin: "0 0 8px" }}>
              Browse Our{" "}
              <span style={{ fontStyle: "italic", color: GOLD }}>Curated Directory</span>
            </h2>
            <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.6, maxWidth: 600, margin: 0 }}>
              Every planner below has been personally reviewed by our editorial team. Filter by service tier,
              region, or sort by rating to find your perfect match.
            </p>
          </div>

          {filtered.length === 0 ? (
            <div style={{ fontFamily: NU, fontSize: 14, color: C.grey, textAlign: "center", padding: "48px 0" }}>
              No planners match your current filters. Try adjusting your selection.
            </div>
          ) : viewMode === "grid" ? (
            <div
              style={{
                display:             "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                gap:                 24,
              }}
            >
              {filtered.map((p) => (
                <PlannerCard key={p.id} v={p} mode="grid" onView={() => {}} isMobile={isMobile} />
              ))}
            </div>
          ) : (
            <>
              {/* Mobile: Show Map button */}
              {isMobile && (
                <button
                  onClick={() => setShowMap(true)}
                  style={{
                    display:       "flex",
                    alignItems:    "center",
                    gap:           8,
                    background:    "rgba(201,168,76,0.08)",
                    border:        "1px solid rgba(201,168,76,0.3)",
                    borderRadius:  "var(--lwd-radius-input)",
                    padding:       "9px 18px",
                    fontFamily:    NU,
                    fontSize:      11,
                    fontWeight:    600,
                    letterSpacing: "0.5px",
                    color:         GOLD,
                    cursor:        "pointer",
                    marginBottom:  20,
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
                    <line x1="9" y1="3" x2="9" y2="18" />
                    <line x1="15" y1="6" x2="15" y2="21" />
                  </svg>
                  Show Map
                </button>
              )}

              {/* List + sticky map layout */}
              <div style={{ display: "flex", gap: 28, alignItems: "flex-start" }}>
                {/* Left 60%: planner list */}
                <div style={{
                  flex:          isMobile ? "1" : "0 0 60%",
                  minWidth:      0,
                  display:       "flex",
                  flexDirection: "column",
                }}>
                  {filtered.map((p) => (
                    <div
                      key={p.id}
                      data-planner-id={p.id}
                      onMouseEnter={() => setHoveredId(p.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      <PlannerCard
                        v={p}
                        mode="list"
                        listMode
                        isHighlighted={hoveredId === p.id || activePinnedId === p.id}
                        onView={() => {}}
                        isMobile={isMobile}
                      />
                    </div>
                  ))}
                </div>

                {/* Right 40%: sticky map panel (desktop only) */}
                {!isMobile && (
                  <div style={{
                    flex:     "0 0 40%",
                    position: "sticky",
                    top:      80,
                    height:   "calc(100vh - 160px)",
                  }}>
                    <PlannerMapPanel
                      planners={filtered}
                      hoveredId={hoveredId}
                      activePinnedId={activePinnedId}
                      onPinHover={setHoveredId}
                      onPinLeave={() => setHoveredId(null)}
                      onPinClick={(id) => {
                        setActivePinnedId(id);
                        const el = document.querySelector(`[data-planner-id="${id}"]`);
                        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                      }}
                      C={C}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </section>

      {/* ── 6. More in {Region} — sibling category cards ────────────────────── */}
      <section
        aria-label="Related categories"
        style={{
          background:   C.dark,
          padding:      isMobile ? "48px 16px" : "72px 48px",
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{ maxWidth: 1280, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 40 }}>
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span
              style={{
                fontFamily:    NU,
                fontSize:      9,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color:         C.gold,
                fontWeight:    600,
              }}
            >
              More in {regionName}
            </span>
          </div>
          <div
            style={{
              display:                 "flex",
              overflowX:               "auto",
              flexWrap:                "nowrap",
              gap:                     12,
              paddingBottom:           8,
              scrollbarWidth:          "none",
              msOverflowStyle:         "none",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {siblingCategories.map((vc) => (
              <SiblingCategoryCard
                key={vc.slug}
                vc={vc}
                C={C}
                onClick={() => onViewRegionCategory?.(countrySlug, regionSlug, vc.slug)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── 7. Italy Regions Footer ────────────────────────────────────────────── */}
      <ItalyRegionsFooter C={C} onViewRegion={onViewRegion} countrySlug={countrySlug} isMobile={isMobile} />
      <SiteFooter {...footerNav} />

      {/* ── Mobile Map Full-Screen Overlay ──────────────────────────────────────── */}
      {showMap && isMobile && (
        <div style={{
          position:      "fixed",
          inset:         0,
          zIndex:        9999,
          background:    C.black,
          display:       "flex",
          flexDirection: "column",
        }}>
          {/* Header */}
          <div style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "14px 20px",
            borderBottom:   `1px solid ${C.border}`,
          }}>
            <span style={{
              fontFamily:    NU,
              fontSize:      10,
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color:         C.off,
            }}>
              Planner Map
            </span>
            <button
              onClick={() => setShowMap(false)}
              aria-label="Close map"
              style={{
                background: "transparent",
                border:     "none",
                color:      C.grey,
                fontSize:   20,
                lineHeight: 1,
                cursor:     "pointer",
                padding:    "4px 8px",
              }}
            >
              ✕
            </button>
          </div>
          {/* Map fills remaining height */}
          <div style={{ flex: 1, padding: 16 }}>
            <PlannerMapPanel
              planners={filtered}
              hoveredId={hoveredId}
              activePinnedId={activePinnedId}
              onPinHover={setHoveredId}
              onPinLeave={() => setHoveredId(null)}
              onPinClick={(id) => {
                setActivePinnedId(id);
                setShowMap(false);
                setTimeout(() => {
                  const el = document.querySelector(`[data-planner-id="${id}"]`);
                  if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
                }, 300);
              }}
              C={C}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Luxury SVG icons for category cards ──────────────────────────────────────
const LUXURY_ICONS = {
  "wedding-venues": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" />
    </svg>
  ),
  "photographers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" /><circle cx="12" cy="13" r="4" />
    </svg>
  ),
  "videographers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" /><rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  "florists": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c0 0 0-3 0-6" /><path d="M9 18c-2 0-4-1.5-4-4 0-2 2-3.5 4-3.5.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5c2 0 4 1.5 4 3.5 0 2.5-2 4-4 4" />
    </svg>
  ),
  "caterers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1" /><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" /><line x1="6" y1="1" x2="6" y2="4" /><line x1="10" y1="1" x2="10" y2="4" /><line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  "entertainment": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="18" cy="16" r="3" />
    </svg>
  ),
  "hair-makeup": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" /><path d="M12 13v8" /><path d="M9 18h6" />
    </svg>
  ),
  "wedding-cakes": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" /><path d="M6 14h12v4H6z" /><path d="M8 10h8v4H8z" />
    </svg>
  ),
  "stationery": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  "bridal-wear": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 7 5 7 8c0 2 1 3 2 4l-3 10h12l-3-10c1-1 2-2 2-4 0-3-2-6-5-6z" /><path d="M9 22h6" />
    </svg>
  ),
};

// ── Sibling Category Card (icon circle + label) ─────────────────────────────
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
        background:    hov ? C.card : C.dark,
        border:        `1px solid ${hov ? C.gold : C.border2}`,
        borderRadius:  "var(--lwd-radius-card)",
        padding:       "28px 20px",
        textAlign:     "center",
        cursor:        "pointer",
        transition:    "all 0.3s ease",
        display:       "flex",
        flexDirection: "column",
        alignItems:    "center",
        gap:           14,
        flexShrink:    0,
        minWidth:      160,
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          width:          48,
          height:         48,
          borderRadius:   "50%",
          background:     hov ? C.goldDim : "transparent",
          border:         `1px solid ${hov ? C.gold : C.border2}`,
          transition:     "all 0.3s ease",
        }}
      >
        {renderIcon ? renderIcon(iconColor) : (
          <span style={{ fontSize: 22, opacity: 0.6 }}>{vc.icon}</span>
        )}
      </span>
      <span
        style={{
          fontFamily:    NU,
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color:         hov ? C.gold : C.off,
          transition:    "color 0.2s",
        }}
      >
        {vc.label}
      </span>
    </button>
  );
}

// ── Italy Regions Footer ────────────────────────────────────────────────────
const ITALY_REGION_COLS = [
  { title: "Lakes & North",      regions: ["Lake Como", "Lake Garda", "Lake Maggiore", "Dolomites", "Trentino-Alto Adige"] },
  { title: "Cities & Riviera",   regions: ["Milan", "Venice", "Rome", "Italian Riviera", "Piedmont"] },
  { title: "Tuscany & Central",  regions: ["Tuscany", "Umbria", "Emilia-Romagna", "Marche", "Abruzzo"] },
  { title: "South & Islands",    regions: ["Amalfi Coast", "Puglia", "Capri", "Sicily", "Sardinia", "Calabria"] },
];

function ItalyRegionsFooter({ C, onViewRegion, countrySlug, isMobile }) {
  return (
    <section
      aria-label="Italy regions directory"
      style={{
        background: C.dark,
        borderTop:  `1px solid ${C.border}`,
        padding:    isMobile ? "48px 16px" : "80px 60px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Section heading */}
        <div style={{ textAlign: "center", marginBottom: isMobile ? 28 : 48 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 16 }}>
            <div style={{ width: 28, height: 1, background: C.gold }} />
            <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.3em", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>
              Italy
            </span>
            <div style={{ width: 28, height: 1, background: C.gold }} />
          </div>
        </div>

        {/* Region columns */}
        <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: isMobile ? 24 : 40 }}>
          {ITALY_REGION_COLS.map((col) => (
            <div key={col.title}>
              <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1.5px", textTransform: "uppercase", color: C.off, marginBottom: 16 }}>
                {col.title}
              </div>
              <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                {col.regions.map((name) => {
                  const slug = name.toLowerCase().replace(/\s+/g, "-");
                  return (
                    <li key={name}>
                      <button
                        onClick={() => onViewRegion?.(countrySlug || "italy", slug)}
                        style={{
                          background:  "none",
                          border:      "none",
                          cursor:      "pointer",
                          fontFamily:  NU,
                          fontSize:    13,
                          fontWeight:  400,
                          color:       C.grey,
                          padding:     "5px 0",
                          display:     "block",
                          width:       "100%",
                          textAlign:   "left",
                          transition:  "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = C.grey)}
                      >
                        {name}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
