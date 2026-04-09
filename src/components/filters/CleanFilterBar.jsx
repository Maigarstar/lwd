// CleanFilterBar — Minimal, elegant filter system
// Shows: Category, Country, Region, Sort dropdowns + Clear link

import { useState, useRef, useEffect } from "react";

function CleanFilterBar({
  filters = {},
  onFiltersChange = () => {},
  regions = [],
  sortMode = "recommended",
  onSortChange = () => {},
  resultCount = 0,
  C = {},
}) {
  const G = C.gold || "#c9a84c";
  const [openDropdown, setOpenDropdown] = useState(null);
  const dropdownRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const hasFilters = filters.region && filters.region !== "all";
  const activeFiltersCount = [
    filters.region && filters.region !== "all" ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const handleClearFilters = () => {
    onFiltersChange({ region: "all", style: null, capacity: null, price: null });
    setOpenDropdown(null);
  };

  const DropdownButton = ({ label, value, onChange, options, isActive }) => (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpenDropdown(openDropdown === label ? null : label)}
        style={{
          background: "none",
          border: `1px solid ${openDropdown === label ? `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.3)` : "rgba(255,255,255,0.15)"}`,
          borderRadius: 4,
          padding: "10px 16px",
          color: C.white || "#fff",
          fontSize: 13,
          fontWeight: 500,
          fontFamily: "'Nunito', sans-serif",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all 0.2s",
          minWidth: 160,
        }}
        onMouseEnter={(e) => {
          if (openDropdown !== label) {
            e.currentTarget.style.borderColor = `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.15)`;
          }
        }}
        onMouseLeave={(e) => {
          if (openDropdown !== label) {
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
          }
        }}
      >
        <span>{value || label}</span>
        <span style={{ fontSize: 8, opacity: 0.6 }}>▾</span>
      </button>

      {openDropdown === label && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            marginTop: 4,
            background: C.card || "#1a1510",
            border: `1px solid rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.2)`,
            borderRadius: 4,
            minWidth: 200,
            zIndex: 100,
            boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
          }}
        >
          {options.map((opt, idx) => (
            <button
              key={idx}
              onClick={() => {
                onChange(opt.value);
                setOpenDropdown(null);
              }}
              style={{
                width: "100%",
                padding: "10px 16px",
                background: opt.value === value ? `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.1)` : "transparent",
                border: "none",
                color: opt.value === value ? G : (C.grey || "#8a7d6a"),
                fontSize: 13,
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.15s",
                fontFamily: "'Nunito', sans-serif",
                borderLeft: opt.value === value ? `3px solid ${G}` : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.05)`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = opt.value === value ? `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.1)` : "transparent";
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div
      ref={dropdownRef}
      style={{
        background: C.black || "#0a0a0a",
        borderTop: `1px solid rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.1)`,
        borderBottom: `1px solid rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.1)`,
        padding: "20px 48px",
        maxWidth: 1280,
        margin: "0 auto",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 32, justifyContent: "space-between" }}>
        {/* Left: Filters */}
        <div style={{ display: "flex", gap: 16, alignItems: "center", flex: 1, flexWrap: "wrap" }}>
          {/* Category (static for now) */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.6)`, display: "block", marginBottom: 6 }}>
              Category
            </label>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.white }}>Wedding Venues</div>
          </div>

          {/* Region */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.6)`, display: "block", marginBottom: 6 }}>
              Region
            </label>
            <DropdownButton
              label="Region"
              value={regions.find(r => r.slug === filters.region)?.name || "All Regions"}
              onChange={(val) => onFiltersChange({ ...filters, region: val })}
              options={regions.map(r => ({ label: r.name, value: r.slug }))}
            />
          </div>

          {/* Sort */}
          <div>
            <label style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.6)`, display: "block", marginBottom: 6 }}>
              Sort
            </label>
            <DropdownButton
              label="Sort"
              value={sortMode === "recommended" ? "Recommended" : sortMode === "newest" ? "Newest" : "Recommended"}
              onChange={onSortChange}
              options={[
                { label: "Recommended", value: "recommended" },
                { label: "Newest", value: "newest" },
                { label: "Most Popular", value: "popular" },
              ]}
            />
          </div>
        </div>

        {/* Right: Status & Clear */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, whiteSpace: "nowrap" }}>
          <div style={{ fontSize: 12, color: `rgba(${G === "#c9a84c" ? "201,168,76" : "0,0,0"}, 0.7)` }}>
            {resultCount} result{resultCount !== 1 ? "s" : ""}
          </div>

          {hasFilters && (
            <button
              onClick={handleClearFilters}
              style={{
                background: "none",
                border: "none",
                color: G,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "underline",
                fontFamily: "'Nunito', sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.8")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CleanFilterBar;
