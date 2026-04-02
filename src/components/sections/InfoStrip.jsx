// ─── src/components/sections/InfoStrip.jsx ───────────────────────────────────
// Interactive chip strip — Regions, Signature Vibe, Elite Services.
// Chips are live filter triggers that sync bidirectionally with CountrySearchBar.
// Supports elegant expand / collapse with smooth animation.
import { useState, useRef, useCallback, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";

const NU = "var(--font-body)";

// ── Vibe chip label → STYLES value (must match CountrySearchBar STYLES array) ─
const VIBE_TO_STYLE = {
  "Rustic Luxe":            "Rustic & Country",
  "Romantic Destination":   "Romantic & Whimsical",
  "Black Tie Elegance":     "Black Tie & Formal",
  "Garden Party":           "Festival & Outdoor",
  "Intimate & Elopement":   "Intimate & Elopement",
  "Glamorous & Grand":      "Glamorous & Grand",
  "Contemporary & Modern":  "Contemporary & Modern",
  "Classic & Traditional":  "Classic & Traditional",
  "Minimalist & Chic":      "Minimalist & Chic",
  "Luxury & Opulent":       "Luxury & Opulent",
  "Bohemian & Free-Spirit": "Bohemian & Free-Spirit",
  "Alternative & Creative": "Alternative & Creative",
  "Destination":            "Destination",
};

const DEFAULT_VIBES = [
  "Rustic Luxe",
  "Romantic Destination",
  "Black Tie Elegance",
  "Garden Party",
  "Intimate & Elopement",
];

const DEFAULT_SERVICES = [
  "Exclusive Estate Hire",
  "Dedicated Concierge",
  "Michelin-Star Dining",
  "Private Ceremonies",
  "Luxury Transport",
];

// ─── Single Chip ──────────────────────────────────────────────────────────────
function Chip({ label, active, onClick }) {
  const C = useTheme();

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      style={{
        display:        "inline-flex",
        alignItems:     "center",
        gap:            active ? 6 : 0,
        padding:        "9px 14px",
        minHeight:      40,
        fontSize:       12,
        fontFamily:     NU,
        fontWeight:     active ? 600 : 400,
        whiteSpace:     "nowrap",
        lineHeight:     1,
        color:          active ? C.dark  : C.white,
        background:     active ? C.gold  : C.card,
        border:         `1px solid ${chipBorder(C, active)}`,
        borderRadius:   "var(--lwd-radius-input)",
        cursor:         "pointer",
        transition:     "all 0.18s",
        transform:      active ? "scale(1.02)" : "scale(1)",
        boxShadow:      active ? `0 0 0 1px ${C.gold}` : "none",
        outline:        "none",
      }}
      onMouseEnter={e => {
        if (!active) {
          e.currentTarget.style.borderColor = C.gold;
          e.currentTarget.style.color       = C.gold;
        }
      }}
      onMouseLeave={e => {
        if (!active) {
          e.currentTarget.style.borderColor = chipBorder(C, false);
          e.currentTarget.style.color       = C.white;
        }
      }}
      onFocus={e  => { e.currentTarget.style.outline = `2px solid ${C.gold}`; e.currentTarget.style.outlineOffset = "2px"; }}
      onBlur={e   => { e.currentTarget.style.outline = "none"; }}
    >
      {label}
      {active && <span style={{ fontSize: 8, opacity: 0.75, lineHeight: 1 }}>✕</span>}
    </button>
  );
}

// ─── Minimal chevron toggle icon ──────────────────────────────────────────────
// Two thin lines forming a V (open) or Λ (closed) — no heavy arrow
function ChevronIcon({ open, color }) {
  return (
    <svg
      width="10"
      height="6"
      viewBox="0 0 10 6"
      fill="none"
      style={{
        transform:  open ? "rotate(0deg)" : "rotate(-180deg)",
        transition: "transform 0.28s cubic-bezier(0.4, 0, 0.2, 1)",
        display:    "block",
        flexShrink: 0,
      }}
    >
      <path
        d="M1 1L5 5L9 1"
        stroke={color}
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// InfoStrip
// Props:
//   regionNames      — string[] (legacy; used when availableRegions not passed)
//   availableRegions — {name, slug}[] (preferred; enables region→filter mapping)
//   vibes            — string[] (Signature Vibe chips; overrides defaults)
//   services         — string[] (Elite Services chips; overrides defaults)
//   cols             — full override for columns (bypasses all other data)
//   filters          — current filter object {region, style, services, ...}
//   onFiltersChange  — (newFilters) => void
//   defaultFilters   — the reset-to defaults object (for deselection)
// ═════════════════════════════════════════════════════════════════════════════
// In light mode, use border2 for stronger chip borders
function chipBorder(C, active) {
  if (active) return C.gold;
  const isDark = C.black === "#080808";
  return isDark ? C.border : C.border2;
}

export default function InfoStrip({
  regionNames      = [],
  availableRegions = [],
  vibes,
  services,
  cols,
  filters,
  onFiltersChange,
  defaultFilters,
}) {
  const C = useTheme();
  const isDarkStrip = C.black === "#080808";
  const interactive = !!(filters && onFiltersChange);
  // Toggle visibility: light mode needs higher opacity to feel interactive
  const toggleOpacity      = isDarkStrip ? 0.40 : 0.72;
  const toggleHoverOpacity = isDarkStrip ? 0.80 : 0.90;

  // ── Expand / collapse state ───────────────────────────────────────────────
  const [open, setOpen] = useState(false);
  const autoCollapseTimer = useRef(null);

  // Auto-collapse after a chip interaction — lets user see the result in context
  const scheduleAutoCollapse = useCallback(() => {
    clearTimeout(autoCollapseTimer.current);
    autoCollapseTimer.current = setTimeout(() => setOpen(false), 1400);
  }, []);

  useEffect(() => () => clearTimeout(autoCollapseTimer.current), []);

  // ── Resolve region data ───────────────────────────────────────────────────
  const regionItems = availableRegions.length > 0
    ? availableRegions
    : regionNames.map(n => ({ name: n, slug: n }));

  const vibeItems    = (Array.isArray(vibes)    && vibes.length > 0)    ? vibes    : DEFAULT_VIBES;
  const serviceItems = (Array.isArray(services) && services.length > 0) ? services : DEFAULT_SERVICES;

  // ── Derive active states ──────────────────────────────────────────────────
  const activeRegion   = filters?.region   || null;
  const activeStyle    = filters?.style    || null;
  const activeServices = filters?.services || null;

  // Any filter active?
  const hasActiveFilter =
    (activeRegion   && activeRegion   !== (defaultFilters?.region  ?? "all")) ||
    (activeStyle    && activeStyle    !== (defaultFilters?.style   ?? "All Styles")) ||
    !!activeServices;

  // ── Click handlers ────────────────────────────────────────────────────────
  const handleRegionClick = (region) => {
    if (!interactive) return;
    const next = (activeRegion === region.slug)
      ? (defaultFilters?.region ?? "all")
      : region.slug;
    onFiltersChange({ ...filters, region: next });
    scheduleAutoCollapse();
  };

  const handleVibeClick = (label) => {
    if (!interactive) return;
    const styleVal = VIBE_TO_STYLE[label] || label;
    const next = (activeStyle === styleVal)
      ? (defaultFilters?.style ?? "All Styles")
      : styleVal;
    onFiltersChange({ ...filters, style: next });
    scheduleAutoCollapse();
  };

  const handleServiceClick = (label) => {
    if (!interactive) return;
    const next = (activeServices === label) ? null : label;
    onFiltersChange({ ...filters, services: next });
    scheduleAutoCollapse();
  };

  // ── Legacy cols override ──────────────────────────────────────────────────
  if (cols) {
    return <LegacyInfoStrip cols={cols} C={C} />;
  }

  const columns = [
    ...(regionItems.length > 0 ? [{ id: "regions",  label: "Regions",        items: regionItems }] : []),
    { id: "vibe",     label: "Signature Vibe",  items: vibeItems    },
    { id: "services", label: "Elite Services",  items: serviceItems },
  ];

  return (
    <div
      style={{
        background: C.dark,
        // Only a hairline top separator — no box, no bottom border
        borderTop:  "1px solid rgba(128,128,128,0.12)",
      }}
    >
      {/* ── Toggle header — always visible ───────────────────────────────── */}
      <button
        type="button"
        onClick={(e) => {
          clearTimeout(autoCollapseTimer.current);
          setOpen(o => !o);
          e.currentTarget.blur(); // drop focus after mouse click — no lingering outline
        }}
        aria-expanded={open}
        aria-label={open ? "Hide filters" : "Show filters"}
        className="lwd-infostrip-toggle"
        style={{
          display:    "flex",
          alignItems: "center",
          width:      "100%",
          maxWidth:   1280,
          margin:     "0 auto",
          padding:    open ? "18px 48px 0" : "14px 48px",
          background: "none",
          border:     "none",
          cursor:     "pointer",
          gap:        24,
          outline:    "none",
          boxSizing:  "border-box",
        }}
      >
        {/* Column labels — with active count when a filter is set */}
        <div style={{ display: "flex", alignItems: "center", gap: 24, flex: 1, flexWrap: "wrap" }}>
          {columns.map((col, i) => {
            const isActiveCol =
              (col.id === "regions"  && activeRegion   && activeRegion   !== (defaultFilters?.region  ?? "all")) ||
              (col.id === "vibe"     && activeStyle    && activeStyle    !== (defaultFilters?.style   ?? "All Styles")) ||
              (col.id === "services" && activeServices);

            // Count active selections per column (currently max 1 each)
            const activeCount = isActiveCol ? 1 : 0;

            return (
              <span
                key={col.id}
                style={{
                  display:       "flex",
                  alignItems:    "center",
                  gap:           5,
                  fontSize:      9,
                  letterSpacing: "2.5px",
                  textTransform: "uppercase",
                  fontWeight:    700,
                  fontFamily:    NU,
                  color:         isActiveCol ? C.gold : C.grey,
                  transition:    "color 0.2s",
                  userSelect:    "none",
                  whiteSpace:    "nowrap",
                }}
              >
                {col.label}
                {/* Show "(1)" suffix when this column has an active filter */}
                {activeCount > 0 && (
                  <span style={{
                    fontSize:      8,
                    fontWeight:    500,
                    color:         C.gold,
                    letterSpacing: "0",
                  }}>
                    ({activeCount})
                  </span>
                )}
              </span>
            );
          })}
        </div>

        {/* Toggle label + chevron */}
        <span
          style={{
            display:    "flex",
            alignItems: "center",
            gap:        6,
            opacity:    toggleOpacity,
            transition: "opacity 0.2s",
            userSelect: "none",
            flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.opacity = toggleHoverOpacity; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = toggleOpacity; }}
        >
          <span style={{
            fontSize:      9,
            fontFamily:    NU,
            letterSpacing: "0.1em",
            color:         C.grey,
            textTransform: "uppercase",
          }}>
            {open ? "Hide filters" : "Show filters"}
          </span>
          <ChevronIcon open={open} color={C.grey} />
        </span>
      </button>

      {/* ── Animated chips body ──────────────────────────────────────────── */}
      <div
        style={{
          overflow:   "hidden",
          maxHeight:  open ? "600px" : "0px",
          opacity:    open ? 1 : 0,
          transition: [
            "max-height 0.30s cubic-bezier(0.4, 0, 0.2, 1)",
            "opacity 0.22s cubic-bezier(0.4, 0, 0.2, 1)",
          ].join(", "),
        }}
      >
        <div
          className="lwd-infostrip-outer"
          style={{
            maxWidth: 1280,
            margin:   "0 auto",
            padding:  "0 48px",
            // No grid — unified flow, no column separation
            display:  "flex",
            gap:      0,
          }}
        >
          {columns.map((col, i) => (
            <div
              key={col.id}
              className="lwd-infostrip-col"
              style={{
                flex:          1,
                paddingTop:    28,
                paddingBottom: 32,
                paddingRight:  i < columns.length - 1 ? 40 : 0,
                paddingLeft:   i > 0 ? 40 : 0,
              }}
            >
              {/* Chips */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {col.items.map((item, j) => {
                  let isActive = false;

                  if (col.id === "regions") {
                    const r = typeof item === "object" ? item : { name: item, slug: item };
                    isActive = interactive && activeRegion === r.slug;
                    return (
                      <Chip
                        key={j}
                        label={r.name}
                        active={isActive}
                        onClick={() => handleRegionClick(r)}
                      />
                    );
                  }
                  if (col.id === "vibe") {
                    const styleVal = VIBE_TO_STYLE[item] || item;
                    isActive = interactive && activeStyle === styleVal;
                    return (
                      <Chip
                        key={j}
                        label={item}
                        active={isActive}
                        onClick={() => handleVibeClick(item)}
                      />
                    );
                  }
                  if (col.id === "services") {
                    isActive = interactive && activeServices === item;
                    return (
                      <Chip
                        key={j}
                        label={item}
                        active={isActive}
                        onClick={() => handleServiceClick(item)}
                      />
                    );
                  }
                  return null;
                })}
              </div>

              {/* Active indicator — clear link per column */}
              {interactive && (
                (col.id === "regions"  && activeRegion   && activeRegion   !== (defaultFilters?.region  ?? "all")) ||
                (col.id === "vibe"     && activeStyle    && activeStyle    !== (defaultFilters?.style   ?? "All Styles")) ||
                (col.id === "services" && activeServices)
              ) ? (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    if (col.id === "regions")  onFiltersChange({ ...filters, region:   defaultFilters?.region  ?? "all" });
                    if (col.id === "vibe")     onFiltersChange({ ...filters, style:    defaultFilters?.style   ?? "All Styles" });
                    if (col.id === "services") onFiltersChange({ ...filters, services: null });
                  }}
                  style={{
                    marginTop:      10,
                    display:        "block",
                    background:     "none",
                    border:         "none",
                    color:          C.grey,
                    fontSize:       9,
                    cursor:         "pointer",
                    fontFamily:     NU,
                    letterSpacing:  "0.08em",
                    padding:        "2px 0",
                    textDecoration: "underline",
                    outline:        "none",
                    minHeight:      24,
                  }}
                  onFocus={e  => { e.currentTarget.style.outline = `2px solid ${C.gold}`; e.currentTarget.style.outlineOffset = "2px"; }}
                  onBlur={e   => { e.currentTarget.style.outline = "none"; }}
                  onMouseEnter={e => { e.currentTarget.style.color = C.gold; }}
                  onMouseLeave={e => { e.currentTarget.style.color = C.grey; }}
                >
                  clear
                </button>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Legacy fallback for callers passing raw `cols` ──────────────────────────
function LegacyInfoStrip({ cols, C }) {
  return (
    <div style={{ background: C.dark, borderBottom: `1px solid ${C.border}`, borderTop: `1px solid ${C.border}` }}>
      <div
        className="lwd-infostrip-outer"
        style={{ maxWidth: 1280, margin: "0 auto", padding: "0 48px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr" }}
      >
        {cols.map((col, i) => (
          <div key={i} className="lwd-infostrip-col"
            style={{ padding: "36px 0", borderRight: i < 2 ? `1px solid ${C.border}` : "none", paddingRight: i < 2 ? 48 : 0, paddingLeft: i > 0 ? 48 : 0 }}
          >
            <div style={{ fontSize: 9, letterSpacing: "3px", textTransform: "uppercase", fontWeight: 700, marginBottom: 16, fontFamily: "var(--font-body)", display: "flex", alignItems: "center", gap: 6 }}>
              <span style={{ color: C.gold, fontSize: 8 }}>✦</span>
              <span style={{ color: C.grey }}>{col.label}</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {col.items.map((item, j) => (
                <span key={j} style={{ fontSize: 12, color: C.white, background: C.card, border: `1px solid ${C.border}`, padding: "5px 12px", borderRadius: "var(--lwd-radius-input)", fontFamily: "var(--font-body)" }}>
                  {item}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
