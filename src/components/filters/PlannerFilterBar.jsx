// ─── src/components/filters/PlannerFilterBar.jsx ──────────────────────────────
// Lightweight filter bar for wedding planners.
// [Service Tier ▾] [Region ▾] [Sort ▾]  {n} planners  [Grid / List]
// Warm stone palette, sticky, backdrop-blur.
// Location-only + tier + sort, no capacity/style/price.

import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { PLANNER_SERVICE_TIERS } from "../../data/vendors";
import { NAV_H } from "../../theme/tokens";

const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

const SORT_OPTIONS = [
  { id: "recommended", label: "Recommended" },
  { id: "rating",      label: "Highest Rated" },
  { id: "price-low",   label: "Price: Low to High" },
  { id: "price-high",  label: "Price: High to Low" },
  { id: "reviews",     label: "Most Reviews" },
];

// ── Dark mode detection ──────────────────────────────────────────────────────
function isDark(C) {
  return (C.dark || "").charAt(1) < "5";
}

function cl(C) {
  const d = isDark(C);
  return {
    text:       d ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.4)",
    textActive: d ? "#fff" : "#0a0a0a",
    border:     d ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.12)",
    borderOpen: d ? "rgba(201,168,76,0.5)"   : "rgba(122,95,16,0.5)",
    chevron:    d ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.3)",
    chevronOn:  d ? "rgba(201,168,76,0.8)"   : C.gold,
    panelBg:    d ? "#0f0d0a" : "#ffffff",
    panelBdr:   d ? "rgba(201,168,76,0.2)"   : "rgba(0,0,0,0.1)",
    panelSh:    d ? "0 16px 48px rgba(0,0,0,0.5)" : "0 16px 48px rgba(0,0,0,0.12)",
    optText:    d ? "rgba(255,255,255,0.55)" : "rgba(0,0,0,0.55)",
    optHov:     d ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
    optActive:  d ? "rgba(201,168,76,0.12)" : "rgba(122,95,16,0.08)",
    countText:  d ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.35)",
    countGold:  d ? "rgba(201,168,76,0.6)"   : C.gold,
    toggleBdr:  d ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.1)",
    toggleIdle: d ? "rgba(255,255,255,0.3)"  : "rgba(0,0,0,0.3)",
    toggleHov:  d ? "rgba(201,168,76,0.7)"   : C.gold,
    barBg:      d ? "rgba(13,11,9,0.92)"     : "rgba(245,241,234,0.95)",
  };
}

// ── Close on outside click + Escape ──────────────────────────────────────────
function useClose(ref, open, setOpen) {
  useEffect(() => {
    if (!open) return;
    const down = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const key  = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", down);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("mousedown", down); document.removeEventListener("keydown", key); };
  }, [ref, open, setOpen]);
}

// ── Dropdown trigger + panel ─────────────────────────────────────────────────
function Dropdown({ label, value, options, onChange, colors: c }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClose(ref, open, setOpen);

  const active = value && value !== "All";

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          fontFamily:    NU,
          fontSize:      11,
          letterSpacing: "0.3px",
          color:         active ? c.textActive : c.text,
          background:    "none",
          border:        `1px solid ${open ? c.borderOpen : c.border}`,
          borderRadius:  "var(--lwd-radius-input)",
          padding:       "7px 28px 7px 12px",
          cursor:        "pointer",
          whiteSpace:    "nowrap",
          transition:    "all 0.2s",
          position:      "relative",
        }}
      >
        {active ? value : label}
        <span
          aria-hidden="true"
          style={{
            position:   "absolute",
            right:      10,
            top:        "50%",
            transform:  open ? "translateY(-50%) rotate(180deg)" : "translateY(-50%)",
            fontSize:   8,
            color:      open ? c.chevronOn : c.chevron,
            transition: "all 0.3s",
          }}
        >
          ▾
        </span>
      </button>

      {open && (
        <div
          style={{
            position:     "absolute",
            top:          "calc(100% + 6px)",
            left:         0,
            minWidth:     180,
            background:   c.panelBg,
            border:       `1px solid ${c.panelBdr}`,
            borderRadius: "var(--lwd-radius-input)",
            boxShadow:    c.panelSh,
            padding:      "6px 0",
            zIndex:       100,
          }}
        >
          {/* "All" option */}
          <DropItem
            label="All"
            active={!value || value === "All"}
            onClick={() => { onChange("All"); setOpen(false); }}
            c={c}
          />
          {options.map((opt) => {
            const lbl = typeof opt === "string" ? opt : opt.label;
            const val = typeof opt === "string" ? opt : (opt.id || opt.label);
            return (
              <DropItem
                key={val}
                label={lbl}
                active={value === val}
                onClick={() => { onChange(val); setOpen(false); }}
                c={c}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function DropItem({ label, active, onClick, c }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:       "block",
        width:         "100%",
        textAlign:     "left",
        fontFamily:    NU,
        fontSize:      11,
        color:         active ? GOLD : c.optText,
        background:    active ? c.optActive : (hov ? c.optHov : "none"),
        border:        "none",
        padding:       "8px 14px",
        cursor:        "pointer",
        transition:    "all 0.15s",
        fontWeight:    active ? 600 : 400,
      }}
    >
      {label}
    </button>
  );
}

// ── View mode toggle ─────────────────────────────────────────────────────────
function ViewToggle({ mode, onChange, c }) {
  const modes = [
    { id: "grid", icon: "⊞", title: "Grid view" },
    { id: "list", icon: "≡", title: "List view" },
  ];
  return (
    <div
      style={{
        display:      "flex",
        border:       `1px solid ${c.toggleBdr}`,
        borderRadius: "var(--lwd-radius-input)",
        overflow:     "hidden",
      }}
    >
      {modes.map((m, i) => {
        const active = mode === m.id;
        return (
          <button
            key={m.id}
            title={m.title}
            aria-label={m.title}
            onClick={() => onChange(m.id)}
            style={{
              fontFamily:  NU,
              fontSize:    13,
              width:       32,
              height:      30,
              background:  active ? "rgba(201,168,76,0.1)" : "none",
              border:      "none",
              borderLeft:  i > 0 ? `1px solid ${c.toggleBdr}` : "none",
              color:       active ? GOLD : c.toggleIdle,
              cursor:      "pointer",
              transition:  "all 0.2s",
              display:     "flex",
              alignItems:  "center",
              justifyContent: "center",
            }}
          >
            {m.icon}
          </button>
        );
      })}
    </div>
  );
}

// ── Main Export ───────────────────────────────────────────────────────────────
export default function PlannerFilterBar({
  regions = [],
  filters,
  onFilterChange,
  viewMode = "grid",
  onViewChange,
  totalCount = 0,
}) {
  const C = useTheme();
  const c = cl(C);

  const setFilter = useCallback(
    (key, val) => onFilterChange?.({ ...filters, [key]: val }),
    [filters, onFilterChange],
  );

  return (
    <div
      style={{
        position:       "sticky",
        top:            0,
        zIndex:         50,
        background:     c.barBg,
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom:   `1px solid ${c.border}`,
        padding:        "12px 32px",
      }}
    >
      <div
        style={{
          maxWidth:       1200,
          margin:         "0 auto",
          display:        "flex",
          alignItems:     "center",
          gap:            10,
          flexWrap:       "wrap",
        }}
      >
        {/* Dropdowns */}
        <Dropdown
          label="Service Tier"
          value={filters?.tier}
          options={PLANNER_SERVICE_TIERS}
          onChange={(v) => setFilter("tier", v)}
          colors={c}
        />
        <Dropdown
          label="Region"
          value={filters?.region}
          options={regions}
          onChange={(v) => setFilter("region", v)}
          colors={c}
        />
        <Dropdown
          label="Sort"
          value={filters?.sort}
          options={SORT_OPTIONS}
          onChange={(v) => setFilter("sort", v)}
          colors={c}
        />

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Count */}
        <span
          style={{
            fontFamily:    NU,
            fontSize:      11,
            color:         c.countText,
            letterSpacing: "0.3px",
            whiteSpace:    "nowrap",
          }}
        >
          <span style={{ color: c.countGold, fontWeight: 600 }}>{totalCount}</span>{" "}
          {totalCount === 1 ? "planner" : "planners"}
        </span>

        {/* View toggle */}
        <ViewToggle mode={viewMode} onChange={onViewChange} c={c} />
      </div>
    </div>
  );
}
