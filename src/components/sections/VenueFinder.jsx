// ─── src/components/sections/VenueFinder.jsx ──────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";
import { LOCATIONS as GROUPED_LOCATIONS } from "../../data/globalVendors";

const NU = "var(--font-body)";

const CAPACITIES = [
  "Any Capacity", "Up to 50", "50–100", "100–200", "200–500", "500+",
];

const VENUE_TYPES = [
  "All Types", "Luxury Venue", "Country House", "Castle & Stately Home",
  "Barn & Farmhouse", "Hotel", "Vineyard", "Beach", "Garden",
  "Historic", "Modern", "Marquee", "Rooftop", "Private Estate",
  "Villa", "Exclusive Hire", "Members' Club", "Quirky & Unique",
  "Overseas Venue", "Holiday Villa & Stay",
];

const FEATURES = [
  "All Features", "Outdoor Ceremony", "Accommodation",
  "Exclusive Use", "Waterfront", "Mountain Views",
  "Spa & Wellness", "Private Chef", "Helipad",
];

const STYLES = [
  "Any Style", "Classic & Traditional", "Contemporary & Modern",
  "Rustic & Country", "Bohemian & Free-Spirit", "Glamorous & Grand",
  "Intimate & Elopement", "Destination", "Festival & Outdoor",
  "Alternative & Creative", "Luxury & Opulent", "Romantic & Whimsical",
  "Minimalist & Chic", "Black Tie & Formal",
];

// ── Shared hook: close on outside click + Escape ─────────────────────────
function useDropClose(ref, open, setOpen) {
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [ref, open, setOpen]);
}

// ═══════════════════════════════════════════════════════════════════════════
// FinderSelect, luxury styled dropdown (replaces native <select>)
// ═══════════════════════════════════════════════════════════════════════════
function FinderSelect({ value, onChange, options, label }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(-1);
  const ref = useRef(null);
  useDropClose(ref, open, setOpen);

  const isDefault = value === options[0];

  return (
    <div ref={ref} className="home-venue-finder-select" style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width: "100%",
          background: "#ffffff",
          border: `1px solid ${open ? "#9b7a1a" : "#d4cdc4"}`,
          borderRadius: "var(--lwd-radius-card)",
          color: isDefault ? "#8a8279" : "#2a2520",
          fontSize: 13,
          fontFamily: NU,
          fontWeight: 400,
          padding: "10px 34px 10px 14px",
          cursor: "pointer",
          outline: "none",
          textAlign: "left",
          transition: "border-color 0.2s",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        <span style={{ fontSize: 7, color: open ? "#9b7a1a" : "#8a8279", transition: "transform 0.3s, color 0.3s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            minWidth: "100%",
            maxHeight: 320,
            overflowY: "auto",
            background: "rgba(12,11,8,0.82)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderTop: "1.5px solid rgba(201,168,76,0.35)",
            borderRadius: 6,
            backdropFilter: "blur(32px) saturate(1.4)",
            WebkitBackdropFilter: "blur(32px) saturate(1.4)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            zIndex: 900,
            padding: "6px 0",
            scrollbarWidth: "thin",
            scrollbarColor: "#C9A84C transparent",
          }}
        >
          {options.map((opt, i) => {
            const isActive = opt === value;
            const isHov = hov === i;
            return (
              <button
                key={opt}
                role="option"
                aria-selected={isActive}
                onClick={() => { onChange(opt); setOpen(false); }}
                onMouseEnter={() => setHov(i)}
                onMouseLeave={() => setHov(-1)}
                style={{
                  display: "block",
                  width: "100%",
                  background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                  border: "none",
                  borderLeft: isActive ? "2px solid rgba(201,168,76,0.6)" : "2px solid transparent",
                  color: isActive ? "#C9A84C" : isHov ? "rgba(245,240,232,0.9)" : "rgba(245,240,232,0.5)",
                  padding: "10px 16px 10px 14px",
                  fontSize: 12,
                  fontFamily: NU,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.2px",
                  cursor: "pointer",
                  textAlign: "left",
                  transition: "color 0.2s, transform 0.2s",
                  transform: isHov && !isActive ? "translateX(2px)" : "translateX(0)",
                  whiteSpace: "nowrap",
                }}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// LocationMegaMenu, grouped multi-column location picker
// ═══════════════════════════════════════════════════════════════════════════
function LocationMegaMenu({ value, onChange, label }) {
  const [open, setOpen] = useState(false);
  const [hov, setHov] = useState(null);
  const ref = useRef(null);
  useDropClose(ref, open, setOpen);

  const isDefault = value === "Worldwide";

  return (
    <div ref={ref} className="home-venue-finder-select home-finder-location" style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="listbox"
        style={{
          width: "100%",
          background: "#ffffff",
          border: `1px solid ${open ? "#9b7a1a" : "#d4cdc4"}`,
          borderRadius: "var(--lwd-radius-card)",
          color: isDefault ? "#8a8279" : "#2a2520",
          fontSize: 13,
          fontFamily: NU,
          fontWeight: 400,
          padding: "10px 34px 10px 14px",
          cursor: "pointer",
          outline: "none",
          textAlign: "left",
          transition: "border-color 0.2s",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 6,
        }}
      >
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{value}</span>
        <span style={{ fontSize: 7, color: open ? "#9b7a1a" : "#8a8279", transition: "transform 0.3s, color 0.3s", transform: open ? "rotate(180deg)" : "rotate(0)" }}>▾</span>
      </button>
      {open && (
        <div
          role="listbox"
          aria-label={label}
          className="home-finder-mega lwd-region-mega"
          style={{
            position: "absolute",
            top: "calc(100% + 4px)",
            left: 0,
            width: 560,
            background: "rgba(12,11,8,0.82)",
            border: "1px solid rgba(201,168,76,0.15)",
            borderTop: "1.5px solid rgba(201,168,76,0.35)",
            borderRadius: 6,
            backdropFilter: "blur(32px) saturate(1.4)",
            WebkitBackdropFilter: "blur(32px) saturate(1.4)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(201,168,76,0.12), inset 0 1px 0 rgba(255,255,255,0.04)",
            zIndex: 900,
            padding: "16px 0 12px",
            maxHeight: "70vh",
            overflowY: "auto",
            scrollbarWidth: "thin",
            scrollbarColor: "#C9A84C transparent",
          }}
        >
          {/* "Worldwide", mode pill, visually distinct from list */}
          <div style={{ padding: "0 16px 14px" }}>
            <button
              role="option"
              aria-selected={value === "Worldwide"}
              onClick={() => { onChange("Worldwide"); setOpen(false); }}
              onMouseEnter={() => setHov("all")}
              onMouseLeave={() => setHov(null)}
              style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                background: value === "Worldwide" ? "rgba(201,168,76,0.15)" : hov === "all" ? "rgba(201,168,76,0.06)" : "rgba(255,255,255,0.03)",
                border: value === "Worldwide" ? "1px solid rgba(201,168,76,0.4)" : "1px solid rgba(255,255,255,0.08)",
                color: value === "Worldwide" ? "#C9A84C" : hov === "all" ? "rgba(245,240,232,0.85)" : "rgba(245,240,232,0.5)",
                padding: "7px 18px 7px 14px", fontSize: 11, fontFamily: NU,
                fontWeight: 600, cursor: "pointer", letterSpacing: "1.2px", textTransform: "uppercase",
                textAlign: "left", transition: "all 0.2s", borderRadius: 20,
              }}
            >
              <span style={{ color: "#C9A84C", fontSize: 9, opacity: value === "Worldwide" ? 0.9 : 0.45, transition: "opacity 0.2s" }}>◇</span>
              Worldwide
            </button>
          </div>

          {GROUPED_LOCATIONS.map((group, gi) => (
            <div key={group.group}>
              {/* Gold gradient divider, uses space instead of hard line */}
              <div style={{ height: 1, background: "linear-gradient(to right, transparent, rgba(201,168,76,0.12) 20%, rgba(201,168,76,0.12) 80%, transparent)", margin: "4px 16px 14px" }} />
              <div style={{ padding: "0 16px 12px" }}>
                <div style={{ fontSize: 8, letterSpacing: "2.5px", textTransform: "uppercase", color: "rgba(201,168,76,0.45)", fontFamily: NU, fontWeight: 600, paddingLeft: 14, marginBottom: 8 }}>
                  ✦ {group.group}
                </div>
                <div style={{ display: "grid", gridTemplateColumns: group.items.length > 4 ? "1fr 1fr 1fr" : "1fr 1fr", gap: "3px 12px" }}>
                  {group.items.map((loc) => {
                    const isActive = loc.country === value;
                    const isH = hov === loc.country;
                    return (
                      <button
                        key={loc.country}
                        role="option"
                        aria-selected={isActive}
                        onClick={() => { onChange(loc.country); setOpen(false); }}
                        onMouseEnter={() => setHov(loc.country)}
                        onMouseLeave={() => setHov(null)}
                        style={{
                          display: "flex", alignItems: "center", gap: 8, width: "100%",
                          background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                          border: "none",
                          borderLeft: isActive ? "2px solid rgba(201,168,76,0.6)" : "2px solid transparent",
                          color: isActive ? "#C9A84C" : isH ? "rgba(245,240,232,0.9)" : "rgba(245,240,232,0.5)",
                          padding: "9px 14px 9px 12px", fontSize: 12, fontFamily: NU,
                          fontWeight: isActive ? 600 : 400, cursor: "pointer",
                          textAlign: "left", transition: "color 0.2s, transform 0.2s", borderRadius: 2,
                          transform: isH && !isActive ? "translateX(2px)" : "translateX(0)",
                          whiteSpace: "nowrap", letterSpacing: "0.2px",
                        }}
                      >
                        {loc.country}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
export default function VenueFinder({ onViewCategory }) {
  const C = useTheme();
  const [location, setLocation] = useState("Worldwide");
  const [capacity, setCapacity] = useState("Any Capacity");
  const [venueType, setVenueType] = useState("All Types");
  const [features, setFeatures] = useState("All Features");
  const [style, setStyle] = useState("Any Style");

  const handleSearch = () => {
    track("venue_finder_search", { location, capacity, venueType, features, style });
    if (onViewCategory) {
      onViewCategory(location !== "Worldwide" ? { searchQuery: location } : undefined);
    }
  };

  return (
    <section
      aria-label="Venue finder"
      className="home-venue-finder"
      style={{
        background: "#faf7f6",
        borderTop: "1px solid #e8e2da",
        borderBottom: "1px solid #e8e2da",
        padding: "20px 60px",
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        {/* Filter row */}
        <div className="home-venue-finder-row" style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <span
            className="home-venue-finder-label"
            style={{
              fontFamily: NU,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "#9b7a1a",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            Find Your Venue
          </span>
          <LocationMegaMenu
            value={location}
            onChange={setLocation}
            label="Location"
          />
          <FinderSelect
            value={capacity}
            onChange={setCapacity}
            options={CAPACITIES}
            label="Capacity"
          />
          <FinderSelect
            value={venueType}
            onChange={setVenueType}
            options={VENUE_TYPES}
            label="Venue type"
          />
          <FinderSelect
            value={features}
            onChange={setFeatures}
            options={FEATURES}
            label="Features"
          />
          <FinderSelect
            value={style}
            onChange={setStyle}
            options={STYLES}
            label="Wedding style"
          />
          <button
            onClick={handleSearch}
            style={{
              background: "#9b7a1a",
              border: "none",
              borderRadius: "var(--lwd-radius-input)",
              color: "#ffffff",
              padding: "10px 24px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              whiteSpace: "nowrap",
              flexShrink: 0,
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#b8941e")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#9b7a1a")}
          >
            Search
          </button>
        </div>
      </div>
    </section>
  );
}
