// ─── src/components/filters/FilterBar.jsx ────────────────────────────────────
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { REGIONS, STYLES, CAPS, PRICES, DEFAULT_FILTERS } from "../../data/italyVenues";
import { NAV_H } from "../../theme/tokens";

const VIEW_MODES = [
  { id: "list", icon: "≡", title: "List view" },
  { id: "grid", icon: "⊞", title: "Grid view" },
  { id: "map",  icon: "◎", title: "Map view" },
];

// ── Detect dark mode from palette ────────────────────────────────────────────
function isDark(C) {
  // Dark palette has dark="#0f0f0f", light has dark="#f3ede6"
  return (C.dark || "").charAt(1) < "5";
}

// ── Shared hook: close on outside click + Escape ─────────────────────────────
function useDropdownClose(ref, open, setOpen) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey  = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, open, setOpen]);
}

// ── Theme-aware color helpers ────────────────────────────────────────────────
function colors(C) {
  const dark = isDark(C);
  return {
    // Trigger text
    textDefault:    dark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
    textActive:     C.white,
    // Borders
    borderIdle:     dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    borderOpen:     dark ? "rgba(201,168,76,0.5)"   : "rgba(122,95,16,0.5)",
    // Chevron
    chevronIdle:    dark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
    chevronOpen:    dark ? "rgba(201,168,76,0.8)"   : C.gold,
    // Panel
    panelBg:        dark ? "#0f0d0a" : "#ffffff",
    panelBorder:    dark ? "rgba(201,168,76,0.2)"   : "rgba(0,0,0,0.1)",
    panelShadow:    dark
      ? "0 16px 48px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.08)"
      : "0 16px 48px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)",
    // Option items
    optText:        dark ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
    optTextHov:     dark ? "rgba(255,255,255,0.85)" : "rgba(0,0,0,0.85)",
    optTextActive:  C.gold,
    optActiveBg:    dark ? "rgba(201,168,76,0.12)" : "rgba(122,95,16,0.08)",
    optHovBg:       dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    optBorderActive:dark ? "rgba(201,168,76,0.7)"  : C.gold,
    // View toggles
    toggleBorder:   dark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    toggleDivider:  dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    toggleIdle:     dark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.3)",
    toggleHov:      dark ? "rgba(201,168,76,0.7)"   : C.gold,
    // Venue count
    countText:      dark ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.35)",
    countGold:      dark ? "rgba(201,168,76,0.6)"   : C.gold,
    // Filter label
    filterLabel:    dark ? "rgba(201,168,76,0.5)"   : C.gold,
    // Clear button
    clearIdle:      dark ? "rgba(201,168,76,0.6)"   : C.gold,
    clearHov:       dark ? "#C9A84C"                : C.gold2 || "#9a7a0a",
    // Mega menu group headers
    groupPrimary:   dark ? "rgba(201,168,76,0.45)"  : C.gold,
    groupSecondary: dark ? "rgba(255,255,255,0.2)"  : "rgba(0,0,0,0.3)",
    // Count badge in mega menu
    countBadge:     dark ? "rgba(255,255,255,0.2)"  : "rgba(0,0,0,0.25)",
    // Dividers inside panels
    divider:        dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
    dividerFaint:   dark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
  };
}

// ── Chevron icon ─────────────────────────────────────────────────────────────
function Chevron({ open, cl }) {
  return (
    <span
      aria-hidden="true"
      style={{
        fontSize:   8,
        color:      open ? cl.chevronOpen : cl.chevronIdle,
        transition: "transform 0.3s, color 0.3s",
        transform:  open ? "rotate(180deg)" : "rotate(0)",
        flexShrink: 0,
      }}
    >
      ▾
    </span>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// LuxSelect, custom styled dropdown for Style / Capacity / Price / Sort
// ═════════════════════════════════════════════════════════════════════════════
function LuxSelect({ value, options, label, onChange, minWidth = 120, C }) {
  const cl = colors(C);
  const [open, setOpen] = useState(false);
  const [hovIdx, setHovIdx] = useState(-1);
  const wrapRef = useRef(null);
  useDropdownClose(wrapRef, open, setOpen);

  const currentLabel = useMemo(() => {
    const match = options.find((o) => (typeof o === "object" ? o.slug : o) === value);
    if (!match) return value;
    return typeof match === "object" ? match.name : match;
  }, [options, value]);

  const isDefault = value === (typeof options[0] === "object" ? options[0].slug : options[0]);

  return (
    <div ref={wrapRef} style={{ position: "relative", minWidth }} className="lwd-filter-select">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width:          "100%",
          background:     "transparent",
          border:         "none",
          borderBottom:   `1px solid ${open ? cl.borderOpen : cl.borderIdle}`,
          borderRadius:   0,
          color:          isDefault ? cl.textDefault : cl.textActive,
          padding:        "10px 24px 10px 0",
          fontSize:       12,
          fontFamily:     "var(--font-body)",
          fontWeight:     400,
          letterSpacing:  "0.3px",
          cursor:         "pointer",
          outline:        "none",
          textAlign:      "left",
          transition:     "border-color 0.3s",
          whiteSpace:     "nowrap",
          overflow:       "hidden",
          textOverflow:   "ellipsis",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            8,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{currentLabel}</span>
        <Chevron open={open} cl={cl} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position:       "absolute",
            top:            "calc(100% + 4px)",
            left:           0,
            minWidth:       "100%",
            maxHeight:      280,
            overflowY:      "auto",
            background:     cl.panelBg,
            border:         `1px solid ${cl.panelBorder}`,
            borderRadius:   4,
            boxShadow:      cl.panelShadow,
            zIndex:         900,
            padding:        "6px 0",
            scrollbarWidth: "thin",
            scrollbarColor: `${C.gold} transparent`,
          }}
        >
          {options.map((o, i) => {
            const val = typeof o === "object" ? o.slug : o;
            const lbl = typeof o === "object" ? o.name : o;
            const isActive = val === value;
            const isHov = hovIdx === i;
            return (
              <button
                key={val}
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(val); setOpen(false); }}
                onMouseEnter={() => setHovIdx(i)}
                onMouseLeave={() => setHovIdx(-1)}
                style={{
                  display:       "block",
                  width:         "100%",
                  background:    isActive ? cl.optActiveBg : isHov ? cl.optHovBg : "transparent",
                  border:        "none",
                  borderLeft:    isActive ? `2px solid ${cl.optBorderActive}` : "2px solid transparent",
                  color:         isActive ? cl.optTextActive : isHov ? cl.optTextHov : cl.optText,
                  padding:       "9px 16px 9px 14px",
                  fontSize:      12,
                  fontFamily:    "var(--font-body)",
                  fontWeight:    isActive ? 600 : 400,
                  letterSpacing: "0.2px",
                  cursor:        "pointer",
                  textAlign:     "left",
                  transition:    "all 0.15s",
                  whiteSpace:    "nowrap",
                }}
              >
                {lbl}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// RegionMegaMenu, multi-column grouped region picker
// ═════════════════════════════════════════════════════════════════════════════
function RegionMegaMenu({ value, regions, onChange, C }) {
  const cl = colors(C);
  const [open, setOpen]   = useState(false);
  const [hovSlug, setHov] = useState(null);
  const wrapRef = useRef(null);
  useDropdownClose(wrapRef, open, setOpen);

  const { primary, secondary } = useMemo(() => {
    const p = [];
    const s = [];
    regions.forEach((r) => {
      if (r.slug === "all") return;
      if (r.priorityLevel === "primary") p.push(r);
      else s.push(r);
    });
    return { primary: p, secondary: s };
  }, [regions]);

  const currentLabel = useMemo(() => {
    if (value === "all") return "All Regions";
    const match = regions.find((r) => r.slug === value);
    return match ? match.name : value;
  }, [regions, value]);

  const isDefault = value === "all";

  const renderItem = (r) => {
    const isActive = r.slug === value;
    const isHov = hovSlug === r.slug;
    const count = r.listingCount || 0;
    return (
      <button
        key={r.slug}
        role="option"
        aria-selected={isActive}
        onClick={() => { onChange(r.slug); setOpen(false); }}
        onMouseEnter={() => setHov(r.slug)}
        onMouseLeave={() => setHov(null)}
        style={{
          display:       "flex",
          alignItems:    "center",
          justifyContent: "space-between",
          gap:           8,
          width:         "100%",
          background:    isActive ? cl.optActiveBg : isHov ? cl.optHovBg : "transparent",
          border:        "none",
          borderLeft:    isActive ? `2px solid ${cl.optBorderActive}` : "2px solid transparent",
          color:         isActive ? cl.optTextActive : isHov ? cl.optTextHov : cl.optText,
          padding:       "8px 14px 8px 12px",
          fontSize:      12,
          fontFamily:    "var(--font-body)",
          fontWeight:    isActive ? 600 : 400,
          letterSpacing: "0.15px",
          cursor:        "pointer",
          textAlign:     "left",
          transition:    "all 0.15s",
          whiteSpace:    "nowrap",
          borderRadius:  2,
        }}
      >
        <span>{r.name}</span>
        {count > 0 && (
          <span style={{ fontSize: 9, color: isActive ? cl.optTextActive : cl.countBadge, fontWeight: 400, opacity: 0.7 }}>
            {count}
          </span>
        )}
      </button>
    );
  };

  return (
    <div ref={wrapRef} style={{ position: "relative", minWidth: 140 }} className="lwd-filter-select lwd-filter-region">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Region"
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width:          "100%",
          background:     "transparent",
          border:         "none",
          borderBottom:   `1px solid ${open ? cl.borderOpen : cl.borderIdle}`,
          borderRadius:   0,
          color:          isDefault ? cl.textDefault : cl.textActive,
          padding:        "10px 24px 10px 0",
          fontSize:       12,
          fontFamily:     "var(--font-body)",
          fontWeight:     400,
          letterSpacing:  "0.3px",
          cursor:         "pointer",
          outline:        "none",
          textAlign:      "left",
          transition:     "border-color 0.3s",
          whiteSpace:     "nowrap",
          overflow:       "hidden",
          textOverflow:   "ellipsis",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          gap:            8,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{currentLabel}</span>
        <Chevron open={open} cl={cl} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Select region"
          className="lwd-region-mega"
          style={{
            position:     "absolute",
            top:          "calc(100% + 6px)",
            left:         0,
            width:        520,
            background:   cl.panelBg,
            border:       `1px solid ${cl.panelBorder}`,
            borderRadius: 6,
            boxShadow:    cl.panelShadow,
            zIndex:       900,
            padding:      "16px 0 12px",
            overflow:     "hidden",
          }}
        >
          {/* "All Regions" at top */}
          <div style={{ padding: "0 16px 10px" }}>
            <button
              role="option"
              aria-selected={value === "all"}
              onClick={() => { onChange("all"); setOpen(false); }}
              onMouseEnter={() => setHov("all")}
              onMouseLeave={() => setHov(null)}
              style={{
                display:       "flex",
                alignItems:    "center",
                gap:           8,
                width:         "100%",
                background:    value === "all" ? cl.optActiveBg : hovSlug === "all" ? cl.optHovBg : "transparent",
                border:        "none",
                borderLeft:    value === "all" ? `2px solid ${cl.optBorderActive}` : "2px solid transparent",
                color:         value === "all" ? cl.optTextActive : hovSlug === "all" ? cl.optTextHov : cl.optText,
                padding:       "8px 14px 8px 12px",
                fontSize:      12,
                fontFamily:    "var(--font-body)",
                fontWeight:    value === "all" ? 600 : 400,
                cursor:        "pointer",
                textAlign:     "left",
                transition:    "all 0.15s",
                borderRadius:  2,
              }}
            >
              <span style={{ color: C.gold, fontSize: 10, opacity: 0.6 }}>◇</span>
              All Regions
            </button>
          </div>

          <div style={{ height: 1, background: cl.divider, margin: "0 16px 12px" }} />

          {/* Popular Destinations (primary) */}
          {primary.length > 0 && (
            <div style={{ padding: "0 16px 12px" }}>
              <div
                style={{
                  fontSize:      8,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  color:         cl.groupPrimary,
                  fontFamily:    "var(--font-body)",
                  fontWeight:    600,
                  marginBottom:  8,
                  paddingLeft:   14,
                }}
              >
                ✦ Popular Destinations
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
                {primary.map(renderItem)}
              </div>
            </div>
          )}

          {/* More Regions (secondary) */}
          {secondary.length > 0 && (
            <>
              <div style={{ height: 1, background: cl.dividerFaint, margin: "0 16px 12px" }} />
              <div style={{ padding: "0 16px 4px" }}>
                <div
                  style={{
                    fontSize:      8,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color:         cl.groupSecondary,
                    fontFamily:    "var(--font-body)",
                    fontWeight:    600,
                    marginBottom:  8,
                    paddingLeft:   14,
                  }}
                >
                  More Regions
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2px 8px" }}>
                  {secondary.map(renderItem)}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Sort options ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { slug: "recommended",  name: "Recommended" },
  { slug: "rating",       name: "Highest Rated" },
  { slug: "price-low",    name: "Price: Low → High" },
  { slug: "price-high",   name: "Price: High → Low" },
];

// ═════════════════════════════════════════════════════════════════════════════
// FilterBar, main export
// ═════════════════════════════════════════════════════════════════════════════
export default function FilterBar({ filters, onChange, viewMode, onViewMode, sortMode, onSortChange, total, regions }) {
  const C = useTheme();
  const cl = colors(C);

  const regionOptions = regions || REGIONS;

  const hasActiveFilters =
    filters.region   !== DEFAULT_FILTERS.region   ||
    filters.style    !== DEFAULT_FILTERS.style    ||
    filters.capacity !== DEFAULT_FILTERS.capacity ||
    filters.price    !== DEFAULT_FILTERS.price;

  const handleChange = useCallback(
    (key, val) => onChange({ ...filters, [key]: val }),
    [filters, onChange]
  );

  const handleClear = useCallback(
    () => onChange(DEFAULT_FILTERS),
    [onChange]
  );

  return (
    <div
      role="search"
      aria-label="Venue filters"
      style={{
        background:    C.dark,
        borderTop:    "none",
        borderBottom: `1px solid ${cl.divider}`,
        position:     "sticky",
        top:           NAV_H,
        zIndex:        800,
        boxShadow:    isDark(C) ? "0 4px 20px rgba(0,0,0,0.15)" : "0 4px 20px rgba(0,0,0,0.06)",
      }}
    >
      <div
        className="lwd-filterbar-wrap"
        style={{
          maxWidth: 1280,
          margin:   "0 auto",
          padding:  "0 48px",
          display:  "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap:  16,
          height: 72,
        }}
      >
        {/* ── Left: dropdowns ── */}
        <div
          className="lwd-filterbar-inner"
          style={{ display: "flex", alignItems: "center", gap: 14, flex: 1 }}
          role="group"
          aria-label="Filter options"
        >
          <span
            style={{
              fontSize: 9,
              letterSpacing: "2.5px",
              textTransform: "uppercase",
              color: cl.filterLabel,
              marginRight: 4,
              whiteSpace: "nowrap",
              fontWeight: 600,
              fontFamily: "var(--font-body)",
            }}
            aria-hidden="true"
          >
            Filter
          </span>

          {/* Region, Mega Menu */}
          <RegionMegaMenu
            value={filters.region}
            regions={regionOptions}
            onChange={(val) => handleChange("region", val)}
            C={C}
          />

          {/* Style / Capacity / Price, LuxSelect */}
          <LuxSelect value={filters.style}    options={STYLES} label="Style"      onChange={(val) => handleChange("style", val)}    C={C} />
          <LuxSelect value={filters.capacity} options={CAPS}   label="Capacity"   onChange={(val) => handleChange("capacity", val)} C={C} />
          <LuxSelect value={filters.price}    options={PRICES} label="Price tier"  onChange={(val) => handleChange("price", val)}    C={C} />

          {hasActiveFilters && (
            <button
              onClick={handleClear}
              aria-label="Clear all filters"
              style={{
                background:    "none",
                border:        "none",
                color:         cl.clearIdle,
                fontSize:      10,
                cursor:        "pointer",
                fontFamily:    "var(--font-body)",
                letterSpacing: "1px",
                textTransform: "uppercase",
                padding:       "4px 8px",
                transition:    "color 0.2s",
                whiteSpace:    "nowrap",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = cl.clearHov; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = cl.clearIdle; }}
            >
              ✕ Clear
            </button>
          )}
        </div>

        {/* ── Right: sort + count + view toggles ── */}
        <div className="lwd-filterbar-right" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {sortMode !== undefined && (
            <LuxSelect
              value={sortMode}
              options={SORT_OPTIONS}
              label="Sort by"
              onChange={(val) => onSortChange?.(val)}
              minWidth={140}
              C={C}
            />
          )}

          <span
            style={{
              fontSize: 10,
              color: cl.countText,
              whiteSpace: "nowrap",
              letterSpacing: "0.5px",
              fontFamily: "var(--font-body)",
            }}
            aria-live="polite"
            aria-label={`${total} venues found`}
          >
            <span style={{ color: cl.countGold, fontWeight: 600 }}>{total}</span> venues
          </span>

          <div
            role="group"
            aria-label="View mode"
            style={{
              display:      "flex",
              border:       `1px solid ${cl.toggleBorder}`,
              borderRadius:  2,
              overflow:     "hidden",
            }}
          >
            {VIEW_MODES.map((v) => (
              <button
                key={v.id}
                onClick={() => onViewMode(v.id)}
                title={v.title}
                aria-label={v.title}
                aria-pressed={viewMode === v.id}
                style={{
                  width:  34,
                  height: 34,
                  background: viewMode === v.id ? `${C.gold}` : "none",
                  border: "none",
                  borderRight: `1px solid ${cl.toggleDivider}`,
                  color:  viewMode === v.id ? "#fff" : cl.toggleIdle,
                  cursor: "pointer",
                  fontSize: 14,
                  transition: "all 0.25s",
                  fontFamily: "inherit",
                }}
                onMouseEnter={(e) => {
                  if (viewMode !== v.id) e.currentTarget.style.color = cl.toggleHov;
                }}
                onMouseLeave={(e) => {
                  if (viewMode !== v.id) e.currentTarget.style.color = cl.toggleIdle;
                }}
              >
                {v.icon}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
