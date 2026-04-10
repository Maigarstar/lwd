// ─── src/components/filters/CountrySearchBar.jsx ─────────────────────────────
// Unified sticky search bar for country pages.
// Light warm-stone editorial system — dark hero, light everything below.
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

// ── Warm stone palette — no pure white, no heavy black ───────────────────────
const STONE = "#F6F3EE";          // warm stone base
const STONE_DEEP = "#EBE6DC";     // deeper stone for refinement panels

function buildPalette(dark) {
  if (dark) return {
    barBg:      "#0f0d0a",
    panelBg:    "#0a0806",
    text:       "rgba(255,255,255,0.45)",
    textActive: "#C9A84C",
    textStrong: "rgba(255,255,255,0.85)",
    border:     "rgba(255,255,255,0.10)",
    borderOpen: "rgba(201,168,76,0.45)",
    gold:       "#C9A84C",
    goldDim:    "rgba(201,168,76,0.55)",
    count:      "rgba(255,255,255,0.30)",
    divider:    "rgba(255,255,255,0.06)",
    activeTab:  "#C9A84C",
    searchBtn:  "#C9A84C",
    searchHov:  "#b8941e",
    viewActive: "#C9A84C",
  };
  return {
    barBg:      STONE,
    panelBg:    STONE_DEEP,
    text:       "rgba(50,40,25,0.58)",
    textActive: "#7A6230",
    textStrong: "rgba(50,40,25,0.85)",
    border:     "rgba(180,165,140,0.25)",
    borderOpen: "rgba(201,168,76,0.45)",
    gold:       "#C9A84C",
    goldDim:    "rgba(140,110,50,0.55)",
    count:      "rgba(50,40,25,0.40)",
    divider:    "rgba(180,165,140,0.14)",
    activeTab:  "#1a1a1a",
    searchBtn:  "#1a1a1a",
    searchHov:  "#333",
    viewActive: "#1a1a1a",
  };
}

// ═════════════════════════════════════════════════════════════════════════════
// MegaPill — warm-stone editorial pill
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
// LuxPanel — warm-stone editorial panel
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
// CountrySearchBar — the unified sticky bar with luxury mega menus
// ═════════════════════════════════════════════════════════════════════════════
export default function CountrySearchBar({
  filters, onFiltersChange, viewMode, onViewMode, sortMode, onSortChange, total, regions,
  onVendorSearch, countryFilter,
  mapOn, onToggleMap,
  mode: modeProp, onModeChange,
}) {
  const C = useTheme();
  const dark = C.black === "#080808";
  const CL = buildPalette(dark);

  // mode is controlled by parent when modeProp is provided, otherwise local
  const [modeLocal, setModeLocal] = useState("venues");
  const mode    = modeProp !== undefined ? modeProp : modeLocal;
  const setMode = (m) => { setModeLocal(m); onModeChange?.(m); };
  const [openMenu, setOpenMenu] = useState(null);
  const [hov, setHov] = useState(null);
  const barRef = useRef(null);

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

  // Toggle a menu — clicking the same trigger closes it
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
  // Mega menu panel content renderers — warm-stone editorial panels
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
        background:   CL.barBg,
        borderBottom: `1px solid ${CL.divider}`,
        position:     "sticky",
        top:          NAV_H,
        zIndex:       800,
        boxShadow:    "none",
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
                background: mode === m ? CL.activeTab : "transparent", border: "none",
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
                background: CL.searchBtn, border: "none", borderRadius: 3, color: "#fff",
                padding: "7px 18px", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px",
                textTransform: "uppercase", cursor: "pointer", fontFamily: NU,
                whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = CL.searchHov)}
              onMouseLeave={(e) => (e.currentTarget.style.background = CL.searchBtn)}
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
                background: CL.searchBtn, border: "none", borderRadius: 3, color: "#fff",
                padding: "7px 18px", fontSize: 9, fontWeight: 800, letterSpacing: "1.5px",
                textTransform: "uppercase", cursor: "pointer", fontFamily: NU,
                whiteSpace: "nowrap", flexShrink: 0, transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = CL.searchHov)}
              onMouseLeave={(e) => (e.currentTarget.style.background = CL.searchBtn)}
            >Search</button>
          </>
        )}

        {/* ═══ SHARED: count + view mode controls (always visible) ═══════ */}
        <div style={{ flex: 1 }} />

        <span style={{ fontSize: 10, color: CL.count, whiteSpace: "nowrap", fontFamily: NU }}>
          <span style={{ color: CL.goldDim, fontWeight: 600 }}>{total}</span> {mode === "vendors" ? "vendors" : "venues"}
        </span>

        {/* Grid / List / Map view switcher */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button onClick={() => onViewMode?.("grid")} title="Grid view" aria-pressed={viewMode === "grid"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: viewMode === "grid" ? CL.viewActive : "transparent",
              border: "1px solid rgba(160,148,125,0.28)", borderRadius: "3px 0 0 3px",
              color: viewMode === "grid" ? "#fff" : CL.text,
              cursor: "pointer", width: 30, height: 30, padding: 0,
              transition: "all 0.25s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="1" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="1" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/><rect x="9" y="9" width="6" height="6" rx="1" stroke="currentColor" strokeWidth="1.5"/></svg>
          </button>
          <button onClick={() => onViewMode?.("list")} title="List view" aria-pressed={viewMode === "list"}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              background: viewMode === "list" ? CL.viewActive : "transparent",
              border: "1px solid rgba(160,148,125,0.28)", borderLeft: "none", borderRadius: "0 3px 3px 0",
              color: viewMode === "list" ? "#fff" : CL.text,
              cursor: "pointer", width: 30, height: 30, padding: 0,
              transition: "all 0.25s",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="1" y="2" width="14" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="6.75" width="14" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.2"/><rect x="1" y="11.5" width="14" height="2.5" rx="1" stroke="currentColor" strokeWidth="1.2"/></svg>
          </button>
          {onToggleMap && (
            <button
              onClick={onToggleMap}
              title={mapOn ? "Hide explore view" : "Explore on map"}
              aria-pressed={mapOn}
              style={{
                display: "flex", alignItems: "center", justifyContent: "center", gap: 4,
                background: mapOn ? "#080808" : "#080808",
                border: `1px solid ${mapOn ? "rgba(201,168,76,0.75)" : "rgba(201,168,76,0.30)"}`,
                borderLeft: "none", borderRadius: "0 3px 3px 0",
                color: mapOn ? "rgba(201,168,76,1)" : "rgba(201,168,76,0.60)",
                cursor: "pointer", height: 30, padding: "0 9px",
                transition: "all 0.25s", fontFamily: NU, fontSize: 9,
                fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase",
                whiteSpace: "nowrap",
              }}
            >
              <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" transform="scale(0.7) translate(1,1)"/>
                <line x1="3" y1="6" x2="3" y2="13" transform="scale(0.7) translate(1,1)"/>
                <line x1="9" y1="3" x2="9" y2="10" transform="scale(0.7) translate(1,1)"/>
              </svg>
              Explore
            </button>
          )}
        </div>
      </div>

      {/* ═══ MEGA MENU PANEL — warm stone refinement ══════════════════════ */}
      {openMenu && (
        <div className="lwd-country-mega-panel" style={{
          borderTop: `1px solid ${CL.divider}`,
          borderBottom: `1px solid ${CL.divider}`,
          background: CL.panelBg,
          boxShadow: dark ? "0 12px 40px rgba(0,0,0,0.3)" : "0 12px 40px rgba(0,0,0,0.045)",
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
    </div>
  );
}
