// ─── src/components/filters/CountrySearchBar.jsx ─────────────────────────────
// Unified sticky search bar for country pages.
// Light warm-stone editorial system, dark hero, light everything below.
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { CAPS, DEFAULT_FILTERS } from "../../data/italyVenues";
import { LOCATIONS as GROUPED_LOCATIONS } from "../../data/globalVendors";
import { NAV_H } from "../../theme/tokens";
import { track } from "../../utils/track";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

// ── Venue style options (matches home page VenueFinder) ──────────────────────
const STYLES = [
  "All Styles", "Classic & Traditional", "Contemporary & Modern",
  "Rustic & Country", "Bohemian & Free-Spirit", "Glamorous & Grand",
  "Intimate & Elopement", "Destination", "Festival & Outdoor",
  "Alternative & Creative", "Luxury & Opulent", "Romantic & Whimsical",
  "Minimalist & Chic", "Black Tie & Formal",
];

// ── Vendor-specific options ──────────────────────────────────────────────────
const VENDOR_CATEGORIES = [
  "All Categories", "Top Wedding Planners", "Hair & Makeup",
  "Best Photographers", "Best Videographers", "Bridal Dresses",
  "Guest Attire", "Wedding Flowers", "Styling & Decor",
  "Wedding Cakes", "Wedding Accessories", "Stationery & Invitations",
  "Health & Beauty", "Celebrants", "Event Production",
  "Wedding Caterers", "Entertainment", "Gift Registry", "Luxury Transport",
];

const BUDGETS = [
  "All Budgets", "\u00a31,000\u2013\u00a35,000", "\u00a35,000\u2013\u00a310,000",
  "\u00a310,000\u2013\u00a325,000", "\u00a325,000\u2013\u00a350,000",
  "\u00a350,000\u2013\u00a3100,000", "\u00a3100,000+",
];

const AVAILABILITY = [
  "Any Date", "Next 3 Months", "Next 6 Months", "Next 9 Months",
  "2026", "2027", "2028",
];

const SORT_OPTIONS = [
  { slug: "recommended", name: "Recommended" },
  { slug: "rating",      name: "Highest Rated" },
  { slug: "price-low",   name: "Price: Low \u2192 High" },
  { slug: "price-high",  name: "Price: High \u2192 Low" },
];

// ── Warm stone palette, no pure white, no heavy black ───────────────────────
const STONE = "#F6F3EE";          // warm stone base
const STONE_DEEP = "#EBE6DC";     // deeper stone for refinement panels
const CL = {
  barBg:       STONE,
  barBorder:   "rgba(180,165,140,0.22)",
  text:        "rgba(50,40,25,0.58)",
  textActive:  "#7A6230",
  textStrong:  "rgba(50,40,25,0.85)",
  border:      "rgba(180,165,140,0.25)",
  borderOpen:  "rgba(201,168,76,0.45)",
  gold:        "#C9A84C",
  goldDim:     "rgba(140,110,50,0.55)",
  count:       "rgba(50,40,25,0.40)",
  divider:     "rgba(180,165,140,0.14)",
};

// ═════════════════════════════════════════════════════════════════════════════
// MegaPill, warm-stone editorial pill
// ═════════════════════════════════════════════════════════════════════════════
function MegaPill({ label, active, isFirst, onSelect, onHover, hovered }) {
  return (
    <button
      role="option"
      aria-selected={active}
      onClick={onSelect}
      onMouseEnter={onHover}
      style={{
        background: active
          ? "rgba(201,168,76,0.10)"
          : hovered
            ? "rgba(255,252,245,0.55)"
            : "transparent",
        border: active
          ? "1px solid rgba(201,168,76,0.38)"
          : `1px solid rgba(160,148,125,${hovered ? "0.38" : "0.28"})`,
        borderRadius: 3,
        boxShadow: active
          ? "0 1px 4px rgba(180,155,80,0.10)"
          : hovered
            ? "0 1px 4px rgba(0,0,0,0.05)"
            : "0 1px 2px rgba(0,0,0,0.03)",
        color: active ? "#7A6230" : hovered ? "rgba(50,40,25,0.72)" : "rgba(50,40,25,0.52)",
        padding: isFirst ? "8px 16px" : "7px 14px",
        fontSize: 11,
        fontFamily: NU,
        fontWeight: active ? 600 : 400,
        cursor: "pointer",
        textAlign: "left",
        transition: "all 0.22s",
        whiteSpace: "nowrap",
        lineHeight: 1.3,
      }}
    >
      {isFirst && (
        <span style={{ fontSize: 7, marginRight: 6, color: active ? "#C9A84C" : "rgba(160,140,90,0.35)" }}>
          ◇
        </span>
      )}
      {label}
    </button>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LuxPanel, warm-stone editorial panel
// ═════════════════════════════════════════════════════════════════════════════
function LuxPanel({ label, children }) {
  return (
    <div style={{ padding: "32px 40px 32px 36px" }}>
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div style={{ width: 24, height: 1, background: "rgba(180,155,80,0.35)" }} />
        <span
          style={{
            fontFamily: NU,
            fontSize: 9,
            letterSpacing: "0.25em",
            textTransform: "uppercase",
            color: "rgba(100,80,40,0.60)",
            fontWeight: 600,
          }}
        >
          {label}
        </span>
      </div>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// CountrySearchBar, the unified sticky bar with luxury mega menus
// ═════════════════════════════════════════════════════════════════════════════
export default function CountrySearchBar({
  filters, onFiltersChange, viewMode, onViewMode, sortMode, onSortChange, total, regions,
  onVendorSearch, countryFilter, mapContent,
}) {
  const C = useTheme();

  const [mode, setMode] = useState("venues");
  const [openMenu, setOpenMenu] = useState(null);
  const [hov, setHov] = useState(null);
  const barRef = useRef(null);

  // Map slide animation, mount on open, keep mounted during close animation
  const [mapMounted, setMapMounted] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    if (viewMode === "map") {
      setMapMounted(true);
      // Delay open state by a frame so the grid transition can animate from 0fr
      requestAnimationFrame(() => requestAnimationFrame(() => setMapOpen(true)));
    } else {
      setMapOpen(false);
      const timer = setTimeout(() => setMapMounted(false), 420);
      return () => clearTimeout(timer);
    }
  }, [viewMode]);

  // Vendor-specific local state
  const [vendorLocation, setVendorLocation] = useState("all");
  const [vendorCategory, setVendorCategory] = useState("All Categories");
  const [vendorBudget, setVendorBudget]     = useState("All Budgets");
  const [vendorAvail, setVendorAvail]       = useState("Any Date");

  // Close on outside click + Escape
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openMenu]);

  // Reset hover when menu changes
  useEffect(() => { setHov(null); }, [openMenu]);

  const hasActiveFilters = filters &&
    (filters.region   !== DEFAULT_FILTERS.region   ||
     filters.style    !== DEFAULT_FILTERS.style    ||
     filters.capacity !== DEFAULT_FILTERS.capacity ||
     filters.price    !== DEFAULT_FILTERS.price);

  const handleVenueChange = useCallback(
    (key, val) => { onFiltersChange?.({ ...filters, [key]: val }); setOpenMenu(null); },
    [filters, onFiltersChange]
  );

  const handleVenueClear = useCallback(
    () => { onFiltersChange?.(DEFAULT_FILTERS); setOpenMenu(null); },
    [onFiltersChange]
  );

  const handleVendorSearch = () => {
    track("vendor_finder_search", { location: vendorLocation, category: vendorCategory, budget: vendorBudget, availability: vendorAvail });
    setOpenMenu(null);
    onVendorSearch?.({
      location: vendorLocation,
      category: vendorCategory,
      budget: vendorBudget,
      availability: vendorAvail,
    });
  };

  const regionOpts = (regions || []).map((r) => typeof r === "object" ? r : { slug: r, name: r });

  // Country-scoped cities for vendor location
  const countryEntry = countryFilter
    ? GROUPED_LOCATIONS.flatMap((g) => g.items).find((l) => l.country === countryFilter)
    : null;
  const cities = countryEntry ? countryEntry.cities : [];

  // Toggle a menu, clicking the same trigger closes it
  const toggle = (key) => setOpenMenu((prev) => prev === key ? null : key);

  // ── Trigger button factory ──
  const TriggerBtn = ({ menuKey, label, active }) => {
    const isOpen = openMenu === menuKey;
    return (
      <button
        type="button"
        onClick={() => toggle(menuKey)}
        aria-expanded={isOpen}
        aria-label={label}
        style={{
          background: isOpen ? "rgba(201,168,76,0.06)" : "transparent",
          border: `1px solid ${isOpen ? CL.borderOpen : "rgba(160,148,125,0.28)"}`,
          borderRadius: 3,
          boxShadow: isOpen ? "0 1px 4px rgba(180,155,80,0.08)" : "0 1px 2px rgba(0,0,0,0.03)",
          color: active ? CL.textActive : isOpen ? CL.textStrong : CL.text,
          fontSize: 11,
          fontFamily: NU,
          fontWeight: active ? 600 : 400,
          padding: "7px 26px 7px 10px",
          cursor: "pointer",
          outline: "none",
          textAlign: "left",
          transition: "all 0.2s",
          whiteSpace: "nowrap",
          position: "relative",
          flexShrink: 0,
        }}
      >
        {label}
        <span style={{
          position: "absolute", right: 8, top: "50%",
          transform: `translateY(-50%) ${isOpen ? "rotate(180deg)" : "rotate(0)"}`,
          fontSize: 7, color: isOpen ? CL.gold : "rgba(50,40,25,0.35)", transition: "transform 0.3s, color 0.3s",
        }}>▾</span>
      </button>
    );
  };

  // ── Display labels ──
  const regionLabel = useMemo(() => {
    if (!filters) return "All Regions";
    const r = regionOpts.find((o) => o.slug === filters.region);
    return r ? r.name : "All Regions";
  }, [filters, regionOpts]);
  const styleLabel = filters?.style || STYLES[0];
  const capLabel = filters?.capacity || CAPS[0];
  const priceLabel = filters?.price || BUDGETS[0];
  const sortLabel = useMemo(() => {
    const s = SORT_OPTIONS.find((o) => o.slug === sortMode);
    return s ? s.name : "Recommended";
  }, [sortMode]);

  const vendorLocLabel = useMemo(() => {
    if (!vendorLocation || vendorLocation === "all") return "All Regions";
    const r = regionOpts.find((o) => o.slug === vendorLocation);
    return r ? r.name : vendorLocation;
  }, [vendorLocation, regionOpts]);

  // ═══════════════════════════════════════════════════════════════════════════
  // Mega menu panel content renderers, warm-stone editorial panels
  // ═══════════════════════════════════════════════════════════════════════════

  const renderRegionPanel = () => (
    <LuxPanel label="Select Region">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {regionOpts.map((r, i) => (
          <MegaPill
            key={r.slug}
            label={r.name}
            active={filters.region === r.slug}
            isFirst={i === 0}
            onSelect={() => handleVenueChange("region", r.slug)}
            onHover={() => setHov(r.slug)}
            hovered={hov === r.slug}
          />
        ))}
      </div>
    </LuxPanel>
  );

  const renderOptionsPanel = (title, options, activeVal, onSelect) => (
    <LuxPanel label={title}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {options.map((opt, i) => {
          const slug = typeof opt === "object" ? opt.slug : opt;
          const name = typeof opt === "object" ? opt.name : opt;
          return (
            <MegaPill
              key={slug}
              label={name}
              active={activeVal === slug}
              isFirst={i === 0}
              onSelect={() => onSelect(slug)}
              onHover={() => setHov(slug)}
              hovered={hov === slug}
            />
          );
        })}
      </div>
    </LuxPanel>
  );

  const renderVendorLocationPanel = () => (
    <LuxPanel label="Select Region">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
        {regionOpts.map((r, i) => (
          <MegaPill
            key={r.slug}
            label={r.name}
            active={vendorLocation === r.slug}
            isFirst={i === 0}
            onSelect={() => { setVendorLocation(r.slug); setOpenMenu(null); }}
            onHover={() => setHov(`vloc-${r.slug}`)}
            hovered={hov === `vloc-${r.slug}`}
          />
        ))}
      </div>
    </LuxPanel>
  );

  const renderVendorCategoryPanel = () => (
    <LuxPanel label="Category">
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        {VENDOR_CATEGORIES.map((cat, i) => (
          <MegaPill
            key={cat}
            label={cat}
            active={vendorCategory === cat}
            isFirst={i === 0}
            onSelect={() => { setVendorCategory(cat); setOpenMenu(null); }}
            onHover={() => setHov(`cat-${cat}`)}
            hovered={hov === `cat-${cat}`}
          />
        ))}
      </div>
    </LuxPanel>
  );

  // ═══ Render ════════════════════════════════════════════════════════════════
  return (
    <div
      ref={barRef}
      role="search"
      aria-label={mode === "venues" ? "Venue search" : "Vendor search"}
      style={{
        background:   STONE,
        borderTop:    `1px solid ${CL.divider}`,
        borderBottom: `1px solid ${CL.divider}`,
        position:     "sticky",
        top:          NAV_H,
        zIndex:       800,
        boxShadow:    "0 2px 16px rgba(0,0,0,0.035)",
      }}
    >
      {/* ── Trigger row ── */}
      <div className="lwd-country-search-row" style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 48px",
        display: "flex", alignItems: "center", gap: 12, height: 60,
        overflowX: "auto", WebkitOverflowScrolling: "touch",
      }}>
        {/* Mode toggle */}
        <div role="tablist" aria-label="Search mode" style={{
          display: "flex", background: "rgba(180,165,140,0.05)", borderRadius: 3,
          border: "1px solid rgba(160,148,125,0.28)", overflow: "hidden", flexShrink: 0,
        }}>
          {["venues", "vendors"].map((m) => (
            <button key={m} role="tab" aria-selected={mode === m}
              onClick={() => { setMode(m); setOpenMenu(null); }}
              style={{
                background: mode === m ? CL.gold : "transparent", border: "none",
                color: mode === m ? "#fff" : CL.text, fontSize: 9, fontWeight: 700,
                letterSpacing: "1.5px", textTransform: "uppercase", padding: "6px 14px",
                cursor: "pointer", fontFamily: NU, transition: "all 0.2s",
              }}
            >{m === "venues" ? "Venues" : "Vendors"}</button>
          ))}
        </div>

        <div style={{ width: 1, height: 24, background: CL.border, flexShrink: 0 }} />

        {/* ═══ VENUE TRIGGERS ═══════════════════════════════════════════════ */}
        {mode === "venues" && (
          <>
            {regionOpts.length > 0 && (
              <TriggerBtn menuKey="region" label={regionLabel} active={filters.region !== DEFAULT_FILTERS.region} />
            )}
            <TriggerBtn menuKey="style" label={styleLabel} active={filters.style !== DEFAULT_FILTERS.style} />
            <TriggerBtn menuKey="capacity" label={capLabel} active={filters.capacity !== DEFAULT_FILTERS.capacity} />
            <TriggerBtn menuKey="price" label={priceLabel} active={filters.price !== DEFAULT_FILTERS.price} />
            <TriggerBtn menuKey="sort" label={sortLabel} active={sortMode !== "recommended"} />

            {/* Search button */}
            <button
              onClick={() => setOpenMenu(null)}
              style={{
                background: CL.gold, border: "none", borderRadius: 3, color: "#fff",
                padding: "7px 18px", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px",
                textTransform: "uppercase", cursor: "pointer", fontFamily: NU,
                whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b8941e")}
              onMouseLeave={(e) => (e.currentTarget.style.background = CL.gold)}
            >Search</button>

            {hasActiveFilters && (
              <button onClick={handleVenueClear} aria-label="Clear all filters"
                style={{
                  background: "none", border: "none", color: CL.goldDim, fontSize: 9,
                  cursor: "pointer", fontFamily: NU, letterSpacing: "1px", textTransform: "uppercase",
                  padding: "4px 6px", transition: "color 0.2s", whiteSpace: "nowrap", flexShrink: 0,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.color = CL.gold; }}
                onMouseLeave={(e) => { e.currentTarget.style.color = CL.goldDim; }}
              >✕ Clear</button>
            )}
          </>
        )}

        {/* ═══ VENDOR TRIGGERS ══════════════════════════════════════════════ */}
        {mode === "vendors" && (
          <>
            <TriggerBtn menuKey="v-location" label={vendorLocLabel} active={vendorLocation && vendorLocation !== "all"} />
            <TriggerBtn menuKey="v-category" label={vendorCategory} active={vendorCategory !== "All Categories"} />
            <TriggerBtn menuKey="v-budget" label={vendorBudget} active={vendorBudget !== "All Budgets"} />
            <TriggerBtn menuKey="v-avail" label={vendorAvail} active={vendorAvail !== "Any Date"} />

            <button onClick={handleVendorSearch}
              style={{
                background: CL.gold, border: "none", borderRadius: 3, color: "#fff",
                padding: "7px 18px", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px",
                textTransform: "uppercase", cursor: "pointer", fontFamily: NU,
                whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#b8941e")}
              onMouseLeave={(e) => (e.currentTarget.style.background = CL.gold)}
            >Search</button>
          </>
        )}

        {/* ═══ SHARED: count + view mode controls (always visible) ═══════ */}
        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 10, color: CL.count, whiteSpace: "nowrap", fontFamily: NU }}>
          <span style={{ color: CL.goldDim, fontWeight: 600 }}>{total}</span> {mode === "vendors" ? "vendors" : "venues"}
        </span>

        <div role="group" aria-label="View mode" style={{ display: "flex", border: "1px solid rgba(160,148,125,0.28)", borderRadius: 3, overflow: "hidden" }}>
          {[
            { id: "list", icon: "\u2261", title: "List view" },
            { id: "grid", icon: "\u229e", title: "Grid view" },
          ].map((v) => (
            <button key={v.id} onClick={() => onViewMode?.(v.id)} title={v.title} aria-pressed={viewMode === v.id}
              style={{
                width: 30, height: 30, background: viewMode === v.id ? CL.gold : "transparent",
                border: "none", borderRight: "1px solid rgba(160,148,125,0.28)",
                color: viewMode === v.id ? "#fff" : CL.text, cursor: "pointer",
                fontSize: 13, transition: "all 0.25s",
              }}
            >{v.icon}</button>
          ))}
          <button onClick={() => onViewMode?.(viewMode === "map" ? "list" : "map")} title="Map view" aria-pressed={viewMode === "map"}
            style={{
              display: "flex", alignItems: "center", gap: 4,
              background: viewMode === "map" ? CL.gold : "transparent",
              border: "none", color: viewMode === "map" ? "#fff" : CL.text,
              cursor: "pointer", fontSize: 9, fontWeight: 700, fontFamily: NU,
              letterSpacing: "1px", textTransform: "uppercase", padding: "0 12px",
              height: 30, transition: "all 0.25s", whiteSpace: "nowrap",
            }}
          ><span style={{ fontSize: 13 }}>{"\u25ce"}</span> Map View</button>
        </div>
      </div>

      {/* ═══ MEGA MENU PANEL, warm stone refinement ══════════════════════ */}
      {openMenu && (
        <div className="lwd-country-mega-panel" style={{
          borderTop: `1px solid ${CL.divider}`,
          borderBottom: `1px solid ${CL.divider}`,
          background: STONE_DEEP,
          boxShadow: "0 12px 40px rgba(0,0,0,0.045)",
          animation: "lwd-mega-slide 0.22s ease",
          overflow: "hidden",
        }}>
          <style>{`@keyframes lwd-mega-slide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {/* ── Venue mega menus ── */}
            {openMenu === "region"   && renderRegionPanel()}
            {openMenu === "style"    && renderOptionsPanel("Style", STYLES, filters.style, (v) => handleVenueChange("style", v))}
            {openMenu === "capacity" && renderOptionsPanel("Capacity", CAPS, filters.capacity, (v) => handleVenueChange("capacity", v))}
            {openMenu === "price"    && renderOptionsPanel("Budget", BUDGETS, filters.price, (v) => handleVenueChange("price", v))}
            {openMenu === "sort"     && renderOptionsPanel("Sort By", SORT_OPTIONS, sortMode, (v) => { onSortChange?.(v); setOpenMenu(null); })}

            {/* ── Vendor mega menus ── */}
            {openMenu === "v-location" && renderVendorLocationPanel()}
            {openMenu === "v-category" && renderVendorCategoryPanel()}
            {openMenu === "v-budget"   && renderOptionsPanel("Budget", BUDGETS, vendorBudget, (v) => { setVendorBudget(v); setOpenMenu(null); })}
            {openMenu === "v-avail"    && renderOptionsPanel("Availability", AVAILABILITY, vendorAvail, (v) => { setVendorAvail(v); setOpenMenu(null); })}
          </div>
        </div>
      )}

      {/* ═══ MAP PANEL, slides down/up attached to bar ══════════════════ */}
      {mapMounted && mapContent && (
        <div style={{
          display: "grid",
          gridTemplateRows: mapOpen ? "1fr" : "0fr",
          opacity: mapOpen ? 1 : 0,
          transition: "grid-template-rows 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.35s ease",
        }}>
          <div style={{ overflow: "hidden", minHeight: 0 }}>
            <div style={{
              borderTop: `1px solid ${CL.divider}`,
              background: STONE_DEEP,
            }}>
              {mapContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
