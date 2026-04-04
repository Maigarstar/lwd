// ─── src/pages/AdminModules/VendorSearchPicker.jsx ────────────────────────────
// Reusable "find any vendor" typeahead for admin views.
// Props: C, onSelect, placeholder
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";

function flag(code) {
  if (!code || code.length < 2) return "";
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
  } catch { return ""; }
}

export default function VendorSearchPicker({ C, onSelect, placeholder = "Search vendors…" }) {
  const [query, setQuery]       = useState("");
  const [results, setResults]   = useState([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);
  const containerRef            = useRef(null);
  const timerRef                = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Debounced search
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    const q = query.trim();
    if (!q) {
      setResults([]);
      setOpen(false);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const { data } = await supabase
          .from("vendors")
          .select("id, name, email, analytics_enabled")
          .ilike("name", `%${q}%`)
          .limit(10);
        setResults(data || []);
        setOpen(true);
      } catch (e) {
        console.warn("[VendorSearchPicker] search error:", e);
        setResults([]);
      }
      setLoading(false);
    }, 300);

    return () => clearTimeout(timerRef.current);
  }, [query]);

  function handleSelect(vendor) {
    setSelected(vendor);
    setQuery(vendor.name);
    setOpen(false);
    onSelect?.(vendor);
  }

  function handleClear() {
    setSelected(null);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-flex", alignItems: "center", gap: 8 }}>
      <div style={{ position: "relative" }}>
        <input
          value={query}
          onChange={e => { setQuery(e.target.value); setSelected(null); }}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          style={{
            background: (C?.dark || "#111"),
            border: `1px solid ${open ? GOLD_BORDER : (C?.border || "#2a2a2a")}`,
            borderRadius: 6,
            padding: "9px 36px 9px 14px",
            color: C?.white || "#fff",
            fontSize: 13,
            outline: "none",
            width: 280,
            fontFamily: NU,
            transition: "border-color 0.15s",
          }}
        />
        {/* Loading / clear icon */}
        <span style={{
          position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
          color: C?.grey || "#666", fontSize: 14, lineHeight: 1, cursor: selected ? "pointer" : "default",
          pointerEvents: selected ? "auto" : "none",
        }} onClick={selected ? handleClear : undefined}>
          {loading ? "…" : selected ? "×" : "◈"}
        </span>
      </div>

      {/* Dropdown */}
      {open && results.length > 0 && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 6px)",
          left: 0,
          width: 320,
          background: C?.card || "#1a1814",
          border: `1px solid ${C?.border || "#2a2a2a"}`,
          borderRadius: 8,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          zIndex: 9999,
          overflow: "hidden",
        }}>
          {results.map((vendor, i) => (
            <div
              key={vendor.id}
              onClick={() => handleSelect(vendor)}
              style={{
                display: "flex", alignItems: "center", gap: 12,
                padding: "10px 14px",
                borderBottom: i < results.length - 1 ? `1px solid ${C?.border || "#2a2a2a"}` : "none",
                cursor: "pointer",
                transition: "background 0.12s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = GOLD_DIM; }}
              onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}
            >
              {/* Name + type */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NU, fontSize: 13, color: C?.off || "#f5f3ef", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {vendor.name}
                </div>
                {vendor.email && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: C?.grey || "#888", marginTop: 1 }}>
                    {vendor.email}
                  </div>
                )}
              </div>
              {/* Analytics status dot */}
              <span
                title={vendor.analytics_enabled ? "Analytics enabled" : "Analytics disabled"}
                style={{
                  width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
                  background: vendor.analytics_enabled ? "#22c55e" : (C?.grey || "#666"),
                }}
              />
            </div>
          ))}
        </div>
      )}

      {open && results.length === 0 && !loading && query.trim() && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", left: 0, width: 280,
          background: C?.card || "#1a1814",
          border: `1px solid ${C?.border || "#2a2a2a"}`,
          borderRadius: 8, padding: "14px 16px",
          fontFamily: NU, fontSize: 12, color: C?.grey || "#888",
          zIndex: 9999,
        }}>
          No vendors found for "{query}"
        </div>
      )}
    </div>
  );
}
