// ─── src/components/sections/GlobalSearchBar.jsx ─────────────────────────────
// Global navigational search bar for the home page.
// Warm-stone editorial design, matches CountrySearchBar system.
// Navigational only, sends users to country pages, not in-place filtering.
import { useState, useCallback, useRef, useEffect } from "react";
import { track } from "../../utils/track";

// ── Curated luxury destinations, key markets only ───────────────────────────
// Scarcity builds prestige. Show established luxury wedding markets.
const CURATED_DESTINATIONS = [
  { group: "Europe", items: [
    "United Kingdom", "Italy", "France", "Spain", "Greece",
    "Switzerland", "Portugal",
  ]},
  { group: "Americas", items: [
    "USA", "Canada", "Mexico", "The Caribbean", "Costa Rica",
  ]},
  { group: "Asia & Indian Ocean", items: [
    "Thailand", "Indonesia", "India", "Sri Lanka", "Japan", "Maldives", "Seychelles",
  ]},
  { group: "Middle East", items: [
    "United Arab Emirates", "Oman", "Qatar",
  ]},
  { group: "Africa", items: [
    "South Africa", "Morocco", "Kenya", "Tanzania",
  ]},
  { group: "Oceania", items: [
    "Australia", "New Zealand", "Fiji", "French Polynesia",
  ]},
];

const NU = "var(--font-body)";

// ── Filter options ───────────────────────────────────────────────────────────
const STYLES = [
  "All Styles", "Classic & Traditional", "Contemporary & Modern",
  "Rustic & Country", "Bohemian & Free-Spirit", "Glamorous & Grand",
  "Intimate & Elopement", "Destination", "Festival & Outdoor",
  "Alternative & Creative", "Luxury & Opulent", "Romantic & Whimsical",
  "Minimalist & Chic", "Black Tie & Formal",
];

const VENDOR_CATEGORIES = [
  "All Categories", "Top Wedding Planners", "Hair & Makeup",
  "Best Photographers", "Best Videographers", "Bridal Dresses",
  "Guest Attire", "Wedding Flowers", "Styling & Decor",
  "Wedding Cakes", "Wedding Accessories", "Stationery & Invitations",
  "Health & Beauty", "Celebrants", "Event Production",
  "Wedding Caterers", "Entertainment", "Gift Registry", "Luxury Transport",
];

const CAPACITIES = [
  "Any Capacity", "Up to 50", "50–100", "100–200", "200–500", "500+",
];

const BUDGETS = [
  "All Budgets", "£1,000–£5,000", "£5,000–£10,000",
  "£10,000–£25,000", "£25,000–£50,000",
  "£50,000–£100,000", "£100,000+",
];

// ── Warm stone palette ───────────────────────────────────────────────────────
const STONE = "#F6F3EE";
const STONE_DEEP = "#EBE6DC";
const CL = {
  barBg:       STONE,
  text:        "rgba(50,40,25,0.58)",
  textActive:  "#7A6230",
  textStrong:  "rgba(50,40,25,0.85)",
  border:      "rgba(180,165,140,0.25)",
  borderOpen:  "rgba(201,168,76,0.45)",
  gold:        "#C9A84C",
  goldDim:     "rgba(140,110,50,0.55)",
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
          ? "1px solid rgba(201,168,76,0.42)"
          : `1px solid rgba(150,138,115,${hovered ? "0.42" : "0.35"})`,
        borderRadius: 3,
        boxShadow: active
          ? "0 1px 4px rgba(180,155,80,0.10)"
          : hovered
            ? "0 1px 4px rgba(0,0,0,0.05)"
            : "0 1px 2px rgba(0,0,0,0.03)",
        color: active ? "#6B5525" : hovered ? "rgba(45,36,20,0.82)" : "rgba(45,36,20,0.68)",
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
// LuxPanel, warm-stone editorial panel wrapper
// ═════════════════════════════════════════════════════════════════════════════
function LuxPanel({ label, children }) {
  return (
    <div style={{ padding: "36px 48px 40px" }}>
      <div style={{ marginBottom: 26, display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 24, height: 1, background: "rgba(160,135,65,0.40)" }} />
        <span style={{
          fontFamily: NU, fontSize: 9, letterSpacing: "0.28em",
          textTransform: "uppercase", color: "rgba(80,65,30,0.65)", fontWeight: 500,
        }}>{label}</span>
      </div>
      {children}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GroupHeader, continent header inside the destination panel
// ═════════════════════════════════════════════════════════════════════════════
function GroupHeader({ label, first }) {
  return (
    <div style={{ marginTop: first ? 24 : 40, marginBottom: 18 }}>
      {/* Gold divider line above heading */}
      <div style={{
        width: "100%", height: 1, marginBottom: 16,
        background: first
          ? "transparent"
          : "linear-gradient(90deg, rgba(180,155,80,0.22) 0%, rgba(180,155,80,0.08) 55%, transparent 100%)",
      }} />
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 20, height: 1, background: "rgba(160,135,65,0.30)" }} />
        <span style={{
          fontFamily: NU, fontSize: 8.5, letterSpacing: "0.35em",
          textTransform: "uppercase", color: "rgba(80,65,30,0.50)", fontWeight: 400,
        }}>{label}</span>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
// GlobalSearchBar, the navigational search bar
// ═════════════════════════════════════════════════════════════════════════════
export default function GlobalSearchBar({
  onNavigateItaly,
  onNavigateUSA,
  onNavigateCategory,
}) {
  const [mode, setMode] = useState("venues");
  const [openMenu, setOpenMenu] = useState(null);
  const [hov, setHov] = useState(null);
  const barRef = useRef(null);

  // Venue mode state
  const [destination, setDestination] = useState("Worldwide");
  const [style, setStyle] = useState("All Styles");
  const [capacity, setCapacity] = useState("Any Capacity");
  const [budget, setBudget] = useState("All Budgets");

  // Vendor mode state
  const [vendorDestination, setVendorDestination] = useState("Worldwide");
  const [vendorCategory, setVendorCategory] = useState("All Categories");
  const [vendorBudget, setVendorBudget] = useState("All Budgets");

  // Close on outside click + Escape
  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e) => { if (barRef.current && !barRef.current.contains(e.target)) setOpenMenu(null); };
    const onKey = (e) => { if (e.key === "Escape") setOpenMenu(null); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [openMenu]);

  useEffect(() => { setHov(null); }, [openMenu]);

  const toggle = (key) => setOpenMenu((prev) => prev === key ? null : key);

  // ── Trigger button ──
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
          border: `1px solid ${isOpen ? CL.borderOpen : "rgba(150,138,115,0.35)"}`,
          borderRadius: 3,
          boxShadow: isOpen ? "0 1px 4px rgba(180,155,80,0.08)" : "0 1px 2px rgba(0,0,0,0.03)",
          color: active ? CL.textActive : isOpen ? CL.textStrong : "rgba(45,36,20,0.68)",
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

  // ── Active filter detection ──
  const venueActive = destination !== "Worldwide" || style !== "All Styles" || capacity !== "Any Capacity" || budget !== "All Budgets";
  const vendorActive = vendorDestination !== "Worldwide" || vendorCategory !== "All Categories" || vendorBudget !== "All Budgets";
  const hasActiveFilters = mode === "venues" ? venueActive : vendorActive;

  // ── Clear handler ──
  const handleClear = useCallback(() => {
    if (mode === "venues") {
      setDestination("Worldwide");
      setStyle("All Styles");
      setCapacity("Any Capacity");
      setBudget("All Budgets");
    } else {
      setVendorDestination("Worldwide");
      setVendorCategory("All Categories");
      setVendorBudget("All Budgets");
    }
    setOpenMenu(null);
  }, [mode]);

  // ── Search handler, navigational ──
  const handleSearch = useCallback(() => {
    const dest = mode === "venues" ? destination : vendorDestination;

    track("global_search", {
      mode,
      destination: dest,
      ...(mode === "venues"
        ? { style, capacity, budget }
        : { category: vendorCategory, budget: vendorBudget }),
    });

    setOpenMenu(null);

    if (dest === "Italy") {
      onNavigateItaly?.();
    } else if (dest === "USA") {
      onNavigateUSA?.();
    } else {
      onNavigateCategory?.(dest !== "Worldwide" ? { searchQuery: dest } : undefined);
    }
  }, [mode, destination, vendorDestination, style, capacity, budget, vendorCategory, vendorBudget, onNavigateItaly, onNavigateUSA, onNavigateCategory]);

  // ═══ Panel renderers ═══════════════════════════════════════════════════════

  const renderDestinationPanel = (activeDest, onSelectDest) => (
    <LuxPanel label="Select Destination">
      {/* Worldwide, elevated master selection, own row */}
      <div style={{
        marginBottom: 10,
        paddingBottom: 12,
      }}>
        <button
          role="option"
          aria-selected={activeDest === "Worldwide"}
          onClick={() => { onSelectDest("Worldwide"); setOpenMenu(null); }}
          onMouseEnter={() => setHov("dest-worldwide")}
          style={{
            background: activeDest === "Worldwide"
              ? "rgba(201,168,76,0.14)"
              : hov === "dest-worldwide"
                ? "rgba(201,168,76,0.06)"
                : "rgba(201,168,76,0.03)",
            border: activeDest === "Worldwide"
              ? "1px solid rgba(201,168,76,0.52)"
              : `1px solid rgba(201,168,76,${hov === "dest-worldwide" ? "0.35" : "0.24"})`,
            borderRadius: 3,
            boxShadow: activeDest === "Worldwide"
              ? "0 1px 6px rgba(180,155,80,0.12)"
              : "0 1px 3px rgba(180,155,80,0.04)",
            color: activeDest === "Worldwide" ? "#6B5525" : "rgba(80,65,30,0.70)",
            padding: "9px 28px",
            fontSize: 11,
            fontFamily: NU,
            fontWeight: activeDest === "Worldwide" ? 600 : 500,
            cursor: "pointer",
            transition: "all 0.22s",
            letterSpacing: "0.06em",
          }}
        >
          <span style={{ fontSize: 8, marginRight: 8, color: "#C9A84C", opacity: activeDest === "Worldwide" ? 1 : 0.5 }}>◇</span>
          Worldwide
        </button>
      </div>

      {/* Curated country groups */}
      {CURATED_DESTINATIONS.map((group, gi) => (
        <div key={group.group}>
          <GroupHeader label={group.group} first={gi === 0} />
          <div style={{
            display: "grid",
            gridTemplateColumns: group.items.length > 6 ? "repeat(5, 1fr)" : group.items.length > 3 ? "repeat(4, 1fr)" : "repeat(3, 1fr)",
            gap: "12px 14px",
          }}>
            {group.items.map((country) => (
              <MegaPill
                key={country}
                label={country}
                active={activeDest === country}
                onSelect={() => { onSelectDest(country); setOpenMenu(null); }}
                onHover={() => setHov(`dest-${country}`)}
                hovered={hov === `dest-${country}`}
              />
            ))}
          </div>
        </div>
      ))}
    </LuxPanel>
  );

  const renderOptionsPanel = (title, options, activeVal, onSelect) => (
    <LuxPanel label={title}>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
        {options.map((opt, i) => (
          <MegaPill
            key={opt}
            label={opt}
            active={activeVal === opt}
            isFirst={i === 0}
            onSelect={() => { onSelect(opt); setOpenMenu(null); }}
            onHover={() => setHov(`${title}-${opt}`)}
            hovered={hov === `${title}-${opt}`}
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
            onHover={() => setHov(`vcat-${cat}`)}
            hovered={hov === `vcat-${cat}`}
          />
        ))}
      </div>
    </LuxPanel>
  );

  // ═══ Render ════════════════════════════════════════════════════════════════
  return (
    <section
      ref={barRef}
      role="search"
      aria-label={mode === "venues" ? "Find wedding venues worldwide" : "Find wedding vendors worldwide"}
      style={{
        background: STONE,
        borderTop: `1px solid ${CL.divider}`,
        borderBottom: `1px solid ${CL.divider}`,
      }}
    >
      {/* ── Trigger row ── */}
      <div style={{
        maxWidth: 1280, margin: "0 auto", padding: "0 48px",
        display: "flex", alignItems: "center", gap: 12, height: 60,
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
                color: mode === m ? "#fff" : "rgba(45,36,20,0.68)", fontSize: 9, fontWeight: 700,
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
            <TriggerBtn menuKey="destination" label={destination} active={destination !== "Worldwide"} />
            <TriggerBtn menuKey="style" label={style} active={style !== "All Styles"} />
            <TriggerBtn menuKey="capacity" label={capacity} active={capacity !== "Any Capacity"} />
            <TriggerBtn menuKey="budget" label={budget} active={budget !== "All Budgets"} />
          </>
        )}

        {/* ═══ VENDOR TRIGGERS ════════════════════════════════════════════ */}
        {mode === "vendors" && (
          <>
            <TriggerBtn menuKey="v-destination" label={vendorDestination} active={vendorDestination !== "Worldwide"} />
            <TriggerBtn menuKey="v-category" label={vendorCategory} active={vendorCategory !== "All Categories"} />
            <TriggerBtn menuKey="v-budget" label={vendorBudget} active={vendorBudget !== "All Budgets"} />
          </>
        )}

        {/* Search button */}
        <button
          onClick={handleSearch}
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
          <button onClick={handleClear} aria-label="Clear all filters"
            style={{
              background: "none", border: "none", color: CL.goldDim, fontSize: 9,
              cursor: "pointer", fontFamily: NU, letterSpacing: "1px", textTransform: "uppercase",
              padding: "4px 6px", transition: "color 0.2s", whiteSpace: "nowrap", flexShrink: 0,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = CL.gold; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = CL.goldDim; }}
          >✕ Clear</button>
        )}
      </div>

      {/* ═══ MEGA MENU PANEL ═══════════════════════════════════════════════ */}
      {openMenu && (
        <div style={{
          borderTop: `1px solid ${CL.divider}`,
          background: STONE_DEEP,
          animation: "gsb-mega-slide 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)",
          overflow: "hidden",
        }}>
          <style>{`@keyframes gsb-mega-slide { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }`}</style>
          <div style={{ maxWidth: 1280, margin: "0 auto" }}>
            {/* Venue panels */}
            {openMenu === "destination" && renderDestinationPanel(destination, setDestination)}
            {openMenu === "style" && renderOptionsPanel("Style", STYLES, style, setStyle)}
            {openMenu === "capacity" && renderOptionsPanel("Capacity", CAPACITIES, capacity, setCapacity)}
            {openMenu === "budget" && renderOptionsPanel("Budget", BUDGETS, budget, setBudget)}

            {/* Vendor panels */}
            {openMenu === "v-destination" && renderDestinationPanel(vendorDestination, setVendorDestination)}
            {openMenu === "v-category" && renderVendorCategoryPanel()}
            {openMenu === "v-budget" && renderOptionsPanel("Budget", BUDGETS, vendorBudget, setVendorBudget)}
          </div>
        </div>
      )}
    </section>
  );
}
