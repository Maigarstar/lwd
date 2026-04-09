// ═══════════════════════════════════════════════════════════════════════════
// ListingsPage — The Grand Lobby  (Harrods Structure, Cinematic Redesign)
// Route: /listings
//
// ARCHITECTURE:
// Ground Floor  — Cinematic video hero, arrival experience
// First Floor   — Category floors (full-image, cinematic cards)
// First Floor B — Destination editorial (atmospheric, not data-driven)
// Second Floor  — Curated collections (magazine-style)
// Third Floor   — Smart filters (collapsible control layer)
// Main Floor    — Full directory grid w/ tier badges
// Top Floor     — Editorial trust strip
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useTheme } from "../theme/ThemeContext";
import { VENDOR_CATEGORIES, COUNTRIES, getRegionSlugByName } from "../data/geo.js";
import { CATS, LOCATIONS } from "../data/globalVendors";
import { track } from "../utils/track";
import { VENUES } from "../data/italyVenues";
import { VENDORS } from "../data/vendors.js";
import { fetchListings, transformListingForCard } from "../services/listings";
import HomeNav from "../components/nav/HomeNav";
import LuxuryVenueCard from "../components/cards/LuxuryVenueCard";
import LuxuryVendorCard from "../components/cards/LuxuryVendorCard";
import PlannerCard from "../components/cards/PlannerCard";
import QuickViewModal from "../components/modals/QuickViewModal";
import ImmersiveSearch from "../components/search/ImmersiveSearch";
import "../category.css";

// ── Design tokens ─────────────────────────────────────────────────────────
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const PURPLE = "#A78BFA";
const GREEN = "#6BA3A3";

// ── Curated collections ───────────────────────────────────────────────────
const COLLECTIONS = [
  {
    id: "editors-picks",
    title: "Editor's Picks",
    subtitle: "Each season our editorial team selects a handful of professionals whose work moves us - venues that still the breath, planners whose eye never misses a detail.",
    accent: GOLD,
    filter: l => l.featured || l.lwdScore > 8.5,
    limit: 3,
  },
  {
    id: "trending-now",
    title: "Trending Now",
    subtitle: "Featured in recent LWD editorials and sought by couples planning weddings in the season ahead. These professionals are shaping what luxury looks like right now.",
    accent: PURPLE,
    filter: l => l.featured && (l.reviewCount || 0) > 5,
    limit: 3,
  },
  {
    id: "award-winners",
    title: "Award Winners",
    subtitle: "Recognised by their peers and celebrated by couples worldwide. A small, exacting list of professionals whose excellence speaks for itself.",
    accent: GREEN,
    filter: l => l.tag === "Award Winner" || l.verified,
    limit: 3,
  },
];

// ── Category navigation floors ────────────────────────────────────────────
// bg: rich gradient that reads well as a full-card background before real photography is added
const BROWSE_CATEGORIES = [
  {
    slug:   "wedding-venues",
    label:  "Wedding Venues",
    code:   "VEN",
    line:   "Castles, estates, and villas around the world",
    // Replace src with real photography: e.g. "/images/categories/venues.jpg"
    img:    null,
    grad:   "linear-gradient(160deg, #2b1e14 0%, #1a120b 40%, #0d0b09 100%)",
    accent: "rgba(201,168,76,0.55)",
  },
  {
    slug:   "wedding-planners",
    label:  "Wedding Planners",
    code:   "PLA",
    line:   "Architects of the most exceptional days",
    img:    null,
    grad:   "linear-gradient(160deg, #0e1a15 0%, #091310 40%, #050d0a 100%)",
    accent: "rgba(107,163,163,0.55)",
  },
  {
    slug:   "photographers",
    label:  "Photographers",
    code:   "PHO",
    line:   "Visual storytellers who make time stand still",
    img:    null,
    grad:   "linear-gradient(160deg, #0e0e1d 0%, #090914 40%, #05050d 100%)",
    accent: "rgba(167,139,250,0.55)",
  },
  {
    slug:   "florists",
    label:  "Florists",
    code:   "FLO",
    line:   "Designers who speak in flowers and light",
    img:    null,
    grad:   "linear-gradient(160deg, #1d0e12 0%, #14090c 40%, #0d0507 100%)",
    accent: "rgba(201,148,148,0.55)",
  },
  {
    slug:   "catering",
    label:  "Catering",
    code:   "CAT",
    line:   "Culinary artisans crafting unforgettable feasts",
    img:    null,
    grad:   "linear-gradient(160deg, #1a1410 0%, #120e0a 40%, #080605 100%)",
    accent: "rgba(220,150,100,0.55)",
  },
  {
    slug:   "cake-designers",
    label:  "Cake & Pastry",
    code:   "CKE",
    line:   "Edible art that crowns your celebration",
    img:    null,
    grad:   "linear-gradient(160deg, #1f1408 0%, #16100a 40%, #0d0705 100%)",
    accent: "rgba(230,180,120,0.55)",
  },
  {
    slug:   "hair-makeup",
    label:  "Hair & Makeup",
    code:   "HMU",
    line:   "Beauty professionals who enhance your radiance",
    img:    null,
    grad:   "linear-gradient(160deg, #1d0f1a 0%, #150a13 40%, #0b050a 100%)",
    accent: "rgba(220,140,180,0.55)",
  },
  {
    slug:   "music-entertainment",
    label:  "Music & DJ",
    code:   "MUS",
    line:   "Sonic architects who set the mood and energy",
    img:    null,
    grad:   "linear-gradient(160deg, #0f1a24 0%, #0a1219 40%, #05080f 100%)",
    accent: "rgba(140,190,230,0.55)",
  },
  {
    slug:   "videographers",
    label:  "Videographers",
    code:   "VID",
    line:   "Storytellers capturing your love in motion",
    img:    null,
    grad:   "linear-gradient(160deg, #1a0f18 0%, #130a12 40%, #080508 100%)",
    accent: "rgba(200,140,200,0.55)",
  },
  {
    slug:   "invitations",
    label:  "Stationery & Design",
    code:   "STA",
    line:   "Visual storytellers from invitation to keepsake",
    img:    null,
    grad:   "linear-gradient(160deg, #16140f 0%, #10080a 40%, #080504 100%)",
    accent: "rgba(180,160,140,0.55)",
  },
  {
    slug:   "rentals",
    label:  "Rentals & Decor",
    code:   "REN",
    line:   "Curators of atmosphere and elegant ambiance",
    img:    null,
    grad:   "linear-gradient(160deg, #0f1814 0%, #0a1310 40%, #05080a 100%)",
    accent: "rgba(130,170,140,0.55)",
  },
  {
    slug:   "transportation",
    label:  "Transportation",
    code:   "TRN",
    line:   "Luxury mobility for your most precious moments",
    img:    null,
    grad:   "linear-gradient(160deg, #14181f 0%, #0f1318 40%, #080a0f 100%)",
    accent: "rgba(160,180,210,0.55)",
  },
];

// ── Destination editorial cards ───────────────────────────────────────────
const BROWSE_DESTINATIONS = [
  {
    slug:  "italy",
    label: "Italy",
    code:  "IT",
    quote: "Amalfi terraces. Tuscan hillsides. The light of Lake Como at dusk.",
    grad:  "linear-gradient(160deg, #221708 0%, #17110a 50%, #0e0c07 100%)",
    line:  "rgba(201,168,76,0.4)",
  },
  {
    slug:  "france",
    label: "France",
    code:  "FR",
    quote: "Loire châteaux. Riviera light. Parisian elegance at its most intimate.",
    grad:  "linear-gradient(160deg, #10142a 0%, #0c0f1e 50%, #080b14 100%)",
    line:  "rgba(167,139,250,0.4)",
  },
  {
    slug:  "uk",
    label: "United Kingdom",
    code:  "UK",
    quote: "Scottish castles. Cotswold manors. London in all its layered beauty.",
    grad:  "linear-gradient(160deg, #101f1c 0%, #0c1714 50%, #080f0d 100%)",
    line:  "rgba(107,163,163,0.4)",
  },
  {
    slug:  "greece",
    label: "Greece",
    code:  "GR",
    quote: "Santorini clifftops. The Aegean in high summer. Light like nowhere else.",
    grad:  "linear-gradient(160deg, #141924 0%, #0f131c 50%, #0a0d14 100%)",
    line:  "rgba(168,201,168,0.4)",
  },
  {
    slug:  "spain",
    label: "Spain",
    code:  "ES",
    quote: "Andalusian estates. Mediterranean warmth. Passion in every detail.",
    grad:  "linear-gradient(160deg, #2a1810 0%, #1e1208 50%, #120a05 100%)",
    line:  "rgba(230,160,100,0.4)",
  },
  {
    slug:  "portugal",
    label: "Portugal",
    code:  "PT",
    quote: "Algarve cliffs. Douro Valley romance. Lisbon's timeless elegance.",
    grad:  "linear-gradient(160deg, #241808 0%, #1a0f05 50%, #0f0903 100%)",
    line:  "rgba(210,140,80,0.4)",
  },
  {
    slug:  "switzerland",
    label: "Switzerland",
    code:  "CH",
    quote: "Alpine peaks. Crystal lakes. Mountain majesty at every turn.",
    grad:  "linear-gradient(160deg, #0f1924 0%, #0a121a 50%, #050810 100%)",
    line:  "rgba(140,180,210,0.4)",
  },
  {
    slug:  "usa",
    label: "United States",
    code:  "US",
    quote: "California sunsets. Napa vineyards. American elegance redefined.",
    grad:  "linear-gradient(160deg, #281410 0%, #1d0f0a 50%, #120807 100%)",
    line:  "rgba(220,140,100,0.4)",
  },
  {
    slug:  "bali",
    label: "Bali & Indonesia",
    code:  "ID",
    quote: "Tropical paradise. Ancient temples. Lush gardens meeting the sea.",
    grad:  "linear-gradient(160deg, #0f1d14 0%, #0a1510 50%, #05080a 100%)",
    line:  "rgba(130,180,130,0.4)",
  },
  {
    slug:  "maldives",
    label: "Maldives",
    code:  "MV",
    quote: "Crystalline waters. Private islands. Turquoise luxury.",
    grad:  "linear-gradient(160deg, #0a1f28 0%, #071922 50%, #041019 100%)",
    line:  "rgba(100,200,220,0.4)",
  },
  {
    slug:  "japan",
    label: "Japan",
    code:  "JP",
    quote: "Cherry blossoms. Traditional gardens. Modern elegance meets heritage.",
    grad:  "linear-gradient(160deg, #22141f 0%, #17101a 50%, #0d0810 100%)",
    line:  "rgba(230,150,180,0.4)",
  },
];

// ── Sort helpers ──────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: "recommended", label: "Recommended" },
  { key: "rating",      label: "Highest Rated" },
  { key: "newest",      label: "Newest" },
  { key: "price-low",   label: "Price: Low → High" },
  { key: "price-high",  label: "Price: High → Low" },
];

function sortListings(items, mode) {
  const arr = [...items];
  switch (mode) {
    case "rating":
      return arr.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    case "newest":
      return arr.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    case "price-low":
      return arr.sort((a, b) => (parsePriceNum(a.priceFrom) || 99999) - (parsePriceNum(b.priceFrom) || 99999));
    case "price-high":
      return arr.sort((a, b) => (parsePriceNum(b.priceFrom) || 0) - (parsePriceNum(a.priceFrom) || 0));
    default:
      return arr.sort((a, b) => {
        const aScore = (a.tier === "showcase" ? 3 : a.tier === "featured" ? 2 : 1) + ((a.rating || 0) / 10);
        const bScore = (b.tier === "showcase" ? 3 : b.tier === "featured" ? 2 : 1) + ((b.rating || 0) / 10);
        return bScore - aScore;
      });
  }
}

function parsePriceNum(p) {
  if (!p) return null;
  const n = parseInt(String(p).replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}

function extractRegions(listings) {
  const map = new Map();
  listings.forEach(l => {
    const slug = l.regionSlug || l.region_slug;
    const name = l.region || (slug || "").replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (slug && !map.has(slug)) map.set(slug, name);
  });
  return Array.from(map.entries())
    .map(([slug, name]) => ({ slug, name }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

// ── Hero search: category id → category slug ──────────────────────────────
const CAT_ID_TO_GEO = {
  venues: "wedding-venues", planners: "wedding-planners", "hair-makeup": "hair-makeup",
  photographers: "photographers", videographers: "videographers", "bridal-dresses": "bridal-wear",
  flowers: "florists", "styling-decor": "event-design", cakes: "wedding-cakes",
  stationery: "stationery", caterers: "caterers", entertainment: "entertainment",
  "luxury-transport": "transport",
};

/* ── LocationSearchField (hero browse tab) ───────────────────────────────── */
function LocationSearchField({ value, onChange, placeholder, items, ariaLabel, onEnter, containerRef }) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(-1);
  const wrapRef  = useRef(null);
  const fieldRef = useRef(null);
  const listRef  = useRef(null);
  const q = inputText.toLowerCase().trim();
  const results = (() => {
    if (!q) return [];
    const out = [];
    items.forEach((group) => {
      group.items.forEach((loc) => {
        const cLow = loc.country.toLowerCase();
        const countryStarts   = cLow.startsWith(q);
        const countryIncludes = !countryStarts && cLow.includes(q);
        if (countryStarts || countryIncludes)
          out.push({ label: loc.country, value: loc.country, type: "country", region: group.group, rank: countryStarts ? 0 : 1 });
        loc.cities.forEach((city) => {
          const ciLow = city.toLowerCase();
          const cityStarts   = ciLow.startsWith(q);
          const cityIncludes = !cityStarts && ciLow.includes(q);
          if (cityStarts || cityIncludes)
            out.push({ label: city, value: `${city}, ${loc.country}`, type: "city", country: loc.country, region: group.group, rank: cityStarts ? 2 : 3 });
        });
      });
    });
    out.sort((a, b) => a.rank - b.rank || a.label.localeCompare(b.label));
    return out.slice(0, 8);
  })();
  const hasResults = results.length > 0;
  useEffect(() => { setHlIdx(-1); }, [q]);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && (!listRef.current || !listRef.current.contains(e.target))) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  useEffect(() => {
    if (hlIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${hlIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [hlIdx]);
  const selectItem = (item) => { onChange(item.value); setInputText(item.label); setOpen(false); };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open && q) setOpen(true); setHlIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHlIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (hlIdx >= 0 && hlIdx < results.length) selectItem(results[hlIdx]); else if (onEnter) onEnter(); }
    else if (e.key === "Escape") { setOpen(false); fieldRef.current?.blur(); }
  };
  const displayValue = open ? inputText : value && value !== "all" && value !== "Worldwide" ? value : "";
  const getMegaPos = () => {
    if (!containerRef?.current || !wrapRef.current) return { left: 0, width: "100%" };
    const c = containerRef.current.getBoundingClientRect();
    const f = wrapRef.current.getBoundingClientRect();
    return { left: c.left - f.left, width: c.width };
  };
  const megaPos = open ? getMegaPos() : { left: 0, width: "100%" };
  const highlight = (text) => {
    if (!q) return text;
    const idx = text.toLowerCase().indexOf(q);
    if (idx < 0) return text;
    return <>{text.slice(0, idx)}<span style={{ color: "#C9A84C", fontWeight: 600 }}>{text.slice(idx, idx + q.length)}</span>{text.slice(idx + q.length)}</>;
  };
  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input ref={fieldRef} value={displayValue} onChange={(e) => { setInputText(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setInputText(""); }} onKeyDown={handleKeyDown}
        placeholder={placeholder} aria-label={ariaLabel} role="combobox" aria-expanded={open && hasResults} aria-haspopup="listbox" aria-autocomplete="list"
        style={{ width: "100%", background: "none", border: "none", outline: "none", color: "#f5f0e8", fontSize: 14, fontFamily: NU, padding: "18px 0", minWidth: 0 }} />
      {open && q && (
        <div ref={listRef} role="listbox" style={{ position: "absolute", top: "calc(100% + 8px)", left: megaPos.left, width: megaPos.width,
          background: "rgba(12,11,8,0.92)", borderTop: "1.5px solid rgba(201,168,76,0.35)", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 6, backdropFilter: "blur(32px) saturate(1.4)", WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)", zIndex: 9999, padding: hasResults ? "8px 0" : "20px 24px" }}>
          {hasResults ? results.map((item, idx) => {
            const isActive = idx === hlIdx;
            return (
              <div key={`${item.value}-${idx}`} data-idx={idx} role="option" aria-selected={isActive}
                onMouseDown={(e) => e.preventDefault()} onClick={() => selectItem(item)} onMouseEnter={() => setHlIdx(idx)}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "11px 18px", cursor: "pointer",
                  fontFamily: NU, fontSize: 13, color: isActive ? "#C9A84C" : "rgba(245,240,232,0.85)",
                  background: isActive ? "rgba(201,168,76,0.08)" : "transparent",
                  borderLeft: isActive ? "2px solid rgba(201,168,76,0.6)" : "2px solid transparent", transition: "all 0.15s ease" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                  <span style={{ fontSize: 10, color: isActive ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.35)", flexShrink: 0 }}>
                    {item.type === "country" ? "◈" : "◎"}
                  </span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {highlight(item.label)}
                    {item.type === "city" && <span style={{ color: "rgba(245,240,232,0.3)", marginLeft: 8, fontSize: 11 }}>{item.country}</span>}
                  </span>
                </div>
                <span style={{ fontSize: 8, color: "rgba(201,168,76,0.22)", letterSpacing: "2.5px", textTransform: "uppercase", fontWeight: 600, flexShrink: 0 }}>
                  {item.region}
                </span>
              </div>
            );
          }) : <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(245,240,232,0.3)", textAlign: "center" }}>No destinations match "{inputText}"</div>}
        </div>
      )}
    </div>
  );
}

/* ── PredictiveField (hero browse tab) ───────────────────────────────────── */
function PredictiveField({ value, onChange, placeholder, items, ariaLabel, onEnter, containerRef }) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const [hlIdx, setHlIdx] = useState(-1);
  const wrapRef  = useRef(null);
  const fieldRef = useRef(null);
  const listRef  = useRef(null);
  const q = inputText.toLowerCase().trim();
  const filtered = items.filter((c) => !q || c.label.toLowerCase().includes(q));
  const flat = filtered.map((c) => ({ label: c.label, value: c.id, icon: c.icon }));
  useEffect(() => { setHlIdx(-1); }, [q]);
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target) && (!listRef.current || !listRef.current.contains(e.target))) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);
  useEffect(() => {
    if (hlIdx < 0 || !listRef.current) return;
    const el = listRef.current.querySelector(`[data-idx="${hlIdx}"]`);
    if (el) el.scrollIntoView({ block: "nearest" });
  }, [hlIdx]);
  const selectItem = (item) => { onChange(item.value); setInputText(item.label); setOpen(false); };
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); if (!open) { setOpen(true); return; } setHlIdx((i) => Math.min(i + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setHlIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); if (hlIdx >= 0 && hlIdx < flat.length) selectItem(flat[hlIdx]); else if (onEnter) onEnter(); }
    else if (e.key === "Escape") { setOpen(false); fieldRef.current?.blur(); }
  };
  const displayValue = open ? inputText : value && value !== "all" ? (items.find((c) => c.id === value)?.label || "") : "";
  const getMegaPos = () => {
    if (!containerRef?.current || !wrapRef.current) return { left: 0, width: "100%" };
    const c = containerRef.current.getBoundingClientRect();
    const f = wrapRef.current.getBoundingClientRect();
    return { left: c.left - f.left, width: c.width };
  };
  const megaPos = open ? getMegaPos() : { left: 0, width: "100%" };
  const catCols = flat.length <= 4 ? 1 : flat.length <= 9 ? 2 : 3;
  return (
    <div ref={wrapRef} style={{ position: "relative", flex: 1, minWidth: 0 }}>
      <input ref={fieldRef} value={displayValue} onChange={(e) => { setInputText(e.target.value); if (!open) setOpen(true); }}
        onFocus={() => { setOpen(true); setInputText(""); }} onKeyDown={handleKeyDown}
        placeholder={placeholder} aria-label={ariaLabel} role="combobox" aria-expanded={open} aria-haspopup="listbox" aria-autocomplete="list"
        style={{ width: "100%", background: "none", border: "none", outline: "none", color: "#f5f0e8", fontSize: 14, fontFamily: NU, padding: "18px 0", minWidth: 0 }} />
      {open && flat.length > 0 && (
        <div ref={listRef} role="listbox" style={{ position: "absolute", top: "calc(100% + 8px)", left: megaPos.left, width: megaPos.width,
          background: "rgba(12,11,8,0.92)", borderTop: "1.5px solid rgba(201,168,76,0.35)", border: "1px solid rgba(201,168,76,0.15)",
          borderRadius: 6, backdropFilter: "blur(32px) saturate(1.4)", WebkitBackdropFilter: "blur(32px) saturate(1.4)",
          boxShadow: "0 24px 64px rgba(0,0,0,0.5)", zIndex: 9999 }}>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${catCols}, 1fr)`, gap: 0, padding: "10px 6px" }}>
            {flat.map((item, idx) => (
              <div key={item.value} data-idx={idx} role="option" aria-selected={idx === hlIdx}
                onMouseDown={(e) => e.preventDefault()} onClick={() => selectItem(item)} onMouseEnter={() => setHlIdx(idx)}
                style={{ padding: "8px 12px", cursor: "pointer", display: "flex", alignItems: "center", gap: 8,
                  fontFamily: NU, fontSize: 12, color: idx === hlIdx ? "#C9A84C" : "rgba(245,240,232,0.85)",
                  background: idx === hlIdx ? "rgba(201,168,76,0.08)" : "transparent",
                  borderRadius: 4, transition: "background 0.12s, color 0.12s", whiteSpace: "nowrap" }}>
                <span style={{ fontSize: 13, color: "rgba(201,168,76,0.45)", width: 16, textAlign: "center", flexShrink: 0 }}>{item.icon}</span>
                {item.label}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// Component
// ═══════════════════════════════════════════════════════════════════════════

export default function ListingsPage({
  onBack = () => {},
  onViewVenue = () => {},
  onNavigateHome,
  onToggleDark,
  darkMode: dmProp,
  onVendorLogin,
  onNavigateStandard,
  onNavigateAbout,
  footerNav = {},
}) {
  const themeCtx = useTheme();
  const darkMode = themeCtx.darkMode;
  const C = themeCtx;

  // ── Filters ───────────────────────────────────────────────────────────
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [countryFilter,  setCountryFilter]  = useState("all");
  const [regionFilter,   setRegionFilter]   = useState("all");
  const [searchQuery,    setSearchQuery]    = useState("");
  const [sortMode,       setSortMode]       = useState("recommended");
  const [showFilters,    setShowFilters]    = useState(false);

  // ── Data ──────────────────────────────────────────────────────────────
  const [dbListings,   setDbListings]   = useState([]);
  const [dbLoaded,     setDbLoaded]     = useState(false);
  const [qvItem,       setQvItem]       = useState(null);
  const [browsePageNum,setBrowsePageNum]= useState(1);
  const [isMobile,     setIsMobile]     = useState(false);
  const [heroVisible,  setHeroVisible]  = useState(false);
  const [videoReady,   setVideoReady]   = useState(false);
  const [scrollY,      setScrollY]      = useState(0);
  const [soundOn,      setSoundOn]      = useState(false);
  const iframeRef = useRef(null);

  // ── Hero search ───────────────────────────────────────────────────────
  const [searchMode,    setSearchMode]    = useState("ai");
  const [heroQuery,     setHeroQuery]     = useState("");
  const [activeCat,     setActiveCat]     = useState("all");
  const [activeCountry, setActiveCountry] = useState("Worldwide");
  const [immersiveOpen, setImmersiveOpen] = useState(false);
  const heroInputRef   = useRef(null);
  const heroBarRef     = useRef(null);

  // YouTube video ID — swap to replace the hero background
  const YT_VIDEO_ID = "Rl6fV6pIEy0";

  const ITEMS_PER_PAGE = 12;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  // Fade-in on mount
  useEffect(() => {
    const t = setTimeout(() => setHeroVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Fade the dark fallback once YouTube video is likely playing (~2.5s buffer)
  useEffect(() => {
    const t = setTimeout(() => setVideoReady(true), 2500);
    return () => clearTimeout(t);
  }, []);

  // postMessage is the most reliable way to control a YouTube iframe
  // that is already in the DOM. No API init required — just enablejsapi=1 in the src.
  const ytCmd = useCallback((func, args = []) => {
    iframeRef.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "command", func, args }),
      "https://www.youtube.com"
    );
  }, []);

  const toggleSound = useCallback(() => {
    if (soundOn) {
      ytCmd("mute");
    } else {
      ytCmd("unMute");
      ytCmd("setVolume", [80]);
    }
    setSoundOn(s => !s);
  }, [soundOn, ytCmd]);

  const handleHeroAuraSearch = useCallback(() => {
    track("search_submit", { query: heroQuery, mode: "ai", source: "listings_hero" });
    setImmersiveOpen(true);
    setHeroQuery("");
  }, [heroQuery]);

  const handleHeroBrowseSearch = useCallback(() => {
    track("search_submit", { mode: "browse", cat: activeCat, country: activeCountry, source: "listings_hero" });
    const catSlug = activeCat && activeCat !== "all" ? (CAT_ID_TO_GEO[activeCat] || null) : null;
    if (catSlug) setCategoryFilter(catSlug);
    if (activeCountry && activeCountry !== "Worldwide") {
      const comma = activeCountry.lastIndexOf(", ");
      if (comma > 0) {
        const cityName    = activeCountry.slice(0, comma);
        const countryName = activeCountry.slice(comma + 2);
        const found = COUNTRIES.find(c => c.name === countryName);
        if (found) setCountryFilter(found.slug);
        const rSlug = getRegionSlugByName(cityName);
        if (rSlug && rSlug !== "all") setRegionFilter(rSlug);
        setSearchQuery(cityName);
      } else {
        const found = COUNTRIES.find(c => c.name === activeCountry);
        if (found) setCountryFilter(found.slug);
      }
    }
    scrollToBrowse();
  }, [activeCat, activeCountry]);

  // Parallax on scroll
  useEffect(() => {
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Fetch DB listings ─────────────────────────────────────────────────
  useEffect(() => {
    const filters = { status: "published" };
    if (categoryFilter !== "all") filters.category_slug = categoryFilter;
    if (countryFilter  !== "all") filters.country_slug  = countryFilter;
    if (regionFilter   !== "all") filters.region_slug   = regionFilter;

    fetchListings(filters)
      .then(rows => { setDbListings(rows || []); setDbLoaded(true); })
      .catch(() => { setDbListings([]);           setDbLoaded(true); });
  }, [categoryFilter, countryFilter, regionFilter]);

  // Reset page when filters change
  useEffect(() => { setBrowsePageNum(1); }, [categoryFilter, countryFilter, regionFilter, searchQuery, sortMode]);

  // ── Merge DB + static data ────────────────────────────────────────────
  const allListings = useMemo(() => {
    // Master pipeline: normalise all DB listings through shared transform
    const dbCards = dbListings.map(l => ({
      ...transformListingForCard(l),
      categorySlug: l.categorySlug || l.category_slug || "wedding-venues",
      tier:        l.tier || (l.featured ? "featured" : "standard"),
      videoUrl:    l.videoUrl     || null,
      createdAt:   l.createdAt   || l.created_at    || "",
    }));

    let staticVenues = VENUES || [];
    if (categoryFilter !== "all" && categoryFilter !== "wedding-venues") staticVenues = [];
    if (countryFilter !== "all")
      staticVenues = staticVenues.filter(v => (v.countrySlug || "").toLowerCase() === countryFilter);
    if (regionFilter !== "all")
      staticVenues = staticVenues.filter(v => (v.regionSlug || "").toLowerCase() === regionFilter);
    const svMapped = staticVenues.map(v => ({
      ...v,
      categorySlug: v.categorySlug || "wedding-venues",
      tier: v.tier || "standard",
    }));

    let staticVendors = VENDORS || [];
    if (categoryFilter !== "all") {
      staticVendors = staticVendors.filter(v => {
        const cat = (v.categorySlug || v.category || "").toLowerCase();
        return cat === categoryFilter || cat.includes(categoryFilter);
      });
    }
    if (countryFilter !== "all")
      staticVendors = staticVendors.filter(v => (v.countrySlug || v.country || "").toLowerCase() === countryFilter);

    const dbNames         = new Set(dbCards.map(v => (v.name || "").toLowerCase()));
    const uniqueStaticVenues  = svMapped.filter(v => !dbNames.has((v.name || "").toLowerCase()));
    const uniqueStaticVendors = staticVendors.filter(v => !dbNames.has((v.name || "").toLowerCase()));

    return [...dbCards, ...uniqueStaticVenues, ...uniqueStaticVendors];
  }, [dbListings, categoryFilter, countryFilter, regionFilter]);

  // ── Client-side filter + sort ─────────────────────────────────────────
  const filteredSorted = useMemo(() => {
    let items = allListings;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      items = items.filter(v =>
        (v.name    || "").toLowerCase().includes(q) ||
        (v.desc    || "").toLowerCase().includes(q) ||
        (v.city    || "").toLowerCase().includes(q) ||
        (v.region  || "").toLowerCase().includes(q) ||
        (v.country || "").toLowerCase().includes(q)
      );
    }
    return sortListings(items, sortMode);
  }, [allListings, searchQuery, sortMode]);

  // ── Curated collections ───────────────────────────────────────────────
  const curatedCollections = useMemo(() => {
    return COLLECTIONS.map(coll => {
      let items = filteredSorted.filter(coll.filter);
      if (categoryFilter !== "all")
        items = items.filter(v => (v.categorySlug || "").toLowerCase() === categoryFilter);
      return {
        ...coll,
        items:      items.slice(0, coll.limit),
        hasMore:    items.length > coll.limit,
        totalCount: items.length,
      };
    }).filter(c => c.items.length > 0);
  }, [filteredSorted, categoryFilter]);

  // ── Browse section ────────────────────────────────────────────────────
  const browseItems = useMemo(() => {
    const featuredIds = new Set();
    curatedCollections.forEach(coll => {
      coll.items.forEach(item => { featuredIds.add(item.id || item.slug); });
    });
    return filteredSorted.filter(v => !featuredIds.has(v.id || v.slug));
  }, [filteredSorted, curatedCollections]);

  const totalBrowsePages  = Math.ceil(browseItems.length / ITEMS_PER_PAGE);
  const browsePage        = Math.min(browsePageNum, Math.max(1, totalBrowsePages));
  const visibleBrowseItems= browseItems.slice((browsePage - 1) * ITEMS_PER_PAGE, browsePage * ITEMS_PER_PAGE);
  const availableRegions  = useMemo(() => extractRegions(allListings), [allListings]);

  // ── Palette ───────────────────────────────────────────────────────────
  const bg      = "#0d0b09";
  const cardBg  = "#141210";
  const text    = "#f5f0e8";
  const muted   = "rgba(245,240,232,0.52)";
  const subtle  = "rgba(245,240,232,0.3)";
  const divider = "rgba(255,255,255,0.06)";
  const goldBorder = "rgba(201,168,76,0.22)";

  const clearFilters = useCallback(() => {
    setCategoryFilter("all");
    setCountryFilter("all");
    setRegionFilter("all");
    setSearchQuery("");
    setSortMode("recommended");
  }, []);

  const hasActiveFilters =
    categoryFilter !== "all" || countryFilter !== "all" ||
    regionFilter   !== "all" || searchQuery.trim();

  // ── Scroll-to-section helper ──────────────────────────────────────────
  const browseRef = useRef(null);
  const scrollToBrowse = () => {
    browseRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // ═════════════════════════════════════════════════════════════════════
  // Render
  // ═════════════════════════════════════════════════════════════════════
  return (
    <div style={{ background: bg, minHeight: "100vh", color: text, fontFamily: NU, width: "100%", overflowX: "hidden" }}>

        <HomeNav
          hasHero={true}
          darkMode={darkMode}
          onToggleDark={onToggleDark || themeCtx.toggleDark}
          onNavigateStandard={onNavigateStandard || onBack}
          onNavigateAbout={onNavigateAbout || onBack}
          onVendorLogin={onVendorLogin}
        />

        {/* ══════════════════════════════════════════════════════════════
            GROUND FLOOR — Cinematic video hero
        ══════════════════════════════════════════════════════════════ */}
        <section style={{
          position:   "relative",
          height:     "100vh",
          minHeight:  680,
          overflow:   "hidden",
          display:    "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          {/* YouTube background video — scales to cover viewport, no controls */}
          <div style={{
            position:      "absolute",
            inset:         0,
            overflow:      "hidden",
            zIndex:        0,
            pointerEvents: "none",
            transform:     `translateY(${scrollY * 0.18}px)`,
            willChange:    "transform",
          }}>
            <iframe
              ref={iframeRef}
              id="lwd-hero-yt"
              title="hero-bg"
              src={`https://www.youtube.com/embed/${YT_VIDEO_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_VIDEO_ID}&controls=0&showinfo=0&rel=0&modestbranding=1&playsinline=1&iv_load_policy=3&disablekb=1&fs=0&color=white&enablejsapi=1&end=210`}
              allow="autoplay; encrypted-media"
              style={{
                position:   "absolute",
                top:        "50%",
                left:       "50%",
                // Scale iframe to always cover the container (16:9 → cover math)
                width:      "100%",
                height:     "56.25%",   // 100% × (9/16)
                minHeight:  "100%",
                minWidth:   "177.78vh",  // 100vh × (16/9)
                transform:  "translate(-50%, -50%)",
                border:     "none",
                pointerEvents: "none",
              }}
            />
          </div>

          {/* Dark base — shows while YouTube loads, fades once playing */}
          <div style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(160deg, #1a1208 0%, #0d0b09 55%, #090706 100%)",
            zIndex:     1,
            opacity:    videoReady ? 0 : 1,
            transition: "opacity 2.2s ease",
            pointerEvents: "none",
          }} />

          {/* Subtle texture grain — film quality */}
          <div style={{
            position:   "absolute",
            inset:      0,
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.035'/%3E%3C/svg%3E\")",
            backgroundSize: "180px 180px",
            zIndex:     2,
            pointerEvents: "none",
          }} />

          {/* Dark overlay — bottom weighting so text reads clearly */}
          <div style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(to bottom, rgba(13,11,9,0.42) 0%, rgba(13,11,9,0.14) 35%, rgba(13,11,9,0.36) 62%, rgba(13,11,9,0.95) 100%)",
            zIndex:     3,
          }} />

          {/* Ambient gold bloom center */}
          <div style={{
            position:   "absolute",
            top:        "38%",
            left:       "50%",
            transform:  "translate(-50%,-50%)",
            width:      800,
            height:     600,
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(201,168,76,0.04) 0%, transparent 65%)",
            zIndex:     4,
            pointerEvents: "none",
          }} />

          {/* Hero content */}
          <div style={{
            position:   "relative",
            zIndex:     5,
            textAlign:  "center",
            maxWidth:   760,
            padding:    "0 24px",
            opacity:    heroVisible ? 1 : 0,
            transform:  heroVisible ? "none" : "translateY(18px)",
            transition: "opacity 1.1s ease, transform 1.1s ease",
          }}>
            <div style={{
              fontFamily:    NU,
              fontSize:      10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color:         GOLD,
              marginBottom:  28,
              opacity:       0.75,
            }}>
              ✦ &nbsp; Luxury Wedding Directory &nbsp; ✦
            </div>

            <h1 style={{
              fontFamily:  GD,
              fontSize:    "clamp(38px, 5.5vw, 68px)",
              fontWeight:  400,
              fontStyle:   "italic",
              color:       text,
              margin:      "0 0 20px",
              lineHeight:  1.1,
              letterSpacing: "-0.01em",
              textShadow:  "0 2px 32px rgba(0,0,0,0.6)",
            }}>
              The Finest Wedding Professionals Worldwide
            </h1>

            <p style={{
              fontFamily: NU,
              fontSize:   "clamp(14px, 2vw, 17px)",
              color:      "rgba(245,240,232,0.62)",
              margin:     "0 0 44px",
              lineHeight: 1.75,
              maxWidth:   520,
              marginLeft: "auto",
              marginRight:"auto",
              textShadow: "0 1px 12px rgba(0,0,0,0.5)",
            }}>
              Explore by category, destination, or curated editorial collection.
            </p>

            {/* ── Search mode tabs ── */}
            <div style={{
              display: "flex", gap: 0, marginBottom: 10,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)",
              padding: 2, borderRadius: "var(--lwd-radius-card)",
              maxWidth: 220, margin: "0 auto 10px",
            }}>
              {[["✦", "AI Search", "ai"], ["⌕", "Browse", "standard"]].map(([icon, label, m]) => (
                <button key={m}
                  onClick={() => { setSearchMode(m); if (m === "ai") setImmersiveOpen(true); }}
                  style={{
                    flex: 1, padding: "5px 16px",
                    background: searchMode === m ? "#C9A84C" : "transparent",
                    color: searchMode === m ? "#0a0906" : "rgba(255,255,255,0.5)",
                    border: "none", borderRadius: "var(--lwd-radius-card)", cursor: "pointer",
                    fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
                    whiteSpace: "nowrap", transition: "all 0.2s",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                  }}>
                  <span>{icon}</span>{label}
                </button>
              ))}
            </div>

            {/* ── Search bar ── */}
            <div ref={heroBarRef}
              style={{
                position: "relative", width: "100%", maxWidth: isMobile ? "100%" : 720, margin: isMobile ? 0 : "0 auto",
                border: searchMode === "ai" ? "1px solid rgba(201,168,76,0.45)" : "1px solid rgba(201,168,76,0.35)",
                borderRadius: "var(--lwd-radius-card)",
                boxShadow: searchMode === "ai"
                  ? "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.25), 0 0 30px rgba(201,168,76,0.08)"
                  : "0 16px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.15)",
                display: "flex", alignItems: "stretch",
                transition: "border-color 0.4s, box-shadow 0.4s",
              }}>
              {/* Blur layer */}
              <div aria-hidden="true" style={{ position: "absolute", inset: 0, borderRadius: "var(--lwd-radius-card)", background: "rgba(10,9,6,0.40)", backdropFilter: "blur(4px)", pointerEvents: "none", zIndex: 0 }} />

              {searchMode === "ai" ? (
                <>
                  <span style={{ position: "relative", zIndex: 1, padding: "0 16px", display: "flex", alignItems: "center", color: GOLD, fontSize: 16, flexShrink: 0 }}>
                    ✦
                  </span>
                  <input
                    ref={heroInputRef}
                    value={heroQuery}
                    onChange={(e) => setHeroQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleHeroAuraSearch()}
                    placeholder="Find me a Tuscan villa for 80 guests in June..."
                    aria-label="Search with Aura AI"
                    style={{ position: "relative", zIndex: 1, flex: 1, background: "none", border: "none", outline: "none", color: "#f5f0e8", fontSize: 14, fontFamily: NU, padding: "18px 0", minWidth: 0 }}
                  />
                  <button
                    onClick={handleHeroAuraSearch}
                    aria-label="Ask Aura AI"
                    style={{ position: "relative", zIndex: 1, background: GOLD, border: "none", cursor: "pointer", padding: "18px 30px", color: "#0a0906", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: NU, flexShrink: 0, transition: "background 0.2s", borderRadius: "0 4px 4px 0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e8c97a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
                  >
                    Ask Aura
                  </button>
                </>
              ) : (
                <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "stretch", flex: 1, minWidth: 0 }}>
                  <span style={{ padding: "0 12px 0 16px", display: "flex", alignItems: "center", color: "rgba(201,168,76,0.5)", fontSize: 15, flexShrink: 0 }}>⌕</span>
                  <PredictiveField
                    value={activeCat} onChange={setActiveCat}
                    placeholder="Venues, planners, stylists..."
                    items={CATS.filter(c => c.id !== "all")}
                    ariaLabel="Search category" onEnter={handleHeroBrowseSearch} containerRef={heroBarRef}
                  />
                  <div style={{ width: 1, background: "linear-gradient(to bottom, transparent, rgba(201,168,76,0.18) 30%, rgba(201,168,76,0.18) 70%, transparent)", margin: "10px 0", flexShrink: 0 }} />
                  <span style={{ padding: "0 10px 0 14px", display: "flex", alignItems: "center", color: "rgba(201,168,76,0.3)", fontSize: 13, flexShrink: 0 }}>◎</span>
                  <LocationSearchField
                    value={activeCountry} onChange={setActiveCountry}
                    placeholder="Destination or city..."
                    items={LOCATIONS}
                    ariaLabel="Search location" onEnter={handleHeroBrowseSearch} containerRef={heroBarRef}
                  />
                  <button
                    onClick={handleHeroBrowseSearch}
                    aria-label="Search"
                    style={{ background: GOLD, border: "none", cursor: "pointer", padding: "18px 30px", color: "#0a0906", fontSize: 11, fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", fontFamily: NU, flexShrink: 0, transition: "background 0.2s", borderRadius: "0 4px 4px 0" }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = "#e8c97a")}
                    onMouseLeave={(e) => (e.currentTarget.style.background = GOLD)}
                  >
                    Search
                  </button>
                </div>
              )}
            </div>

            {/* Aura nudge */}
            <div style={{ marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)", fontFamily: NU, fontWeight: 300 }}>
              Not sure where to start?{" "}
              <span role="button" tabIndex={0}
                onClick={() => setImmersiveOpen(true)}
                onKeyDown={(e) => e.key === "Enter" && setImmersiveOpen(true)}
                style={{ color: GOLD, cursor: "pointer", fontWeight: 600, borderBottom: "1px solid rgba(201,168,76,0.3)" }}>
                Ask Aura
              </span>{" "}
              , get personalised suggestions instantly.
            </div>

            {/* Trust stats */}
            <div style={{ marginTop: 10, marginBottom: 44, fontSize: 11, color: "rgba(255,255,255,0.22)", letterSpacing: "0.14em", fontFamily: NU }}>
              300+ Curated Venues · 120+ Verified Vendors · 25 Destinations
            </div>

            {/* Scroll cue */}
            <button
              onClick={scrollToBrowse}
              style={{
                background:  "transparent",
                border:      "none",
                cursor:      "pointer",
                display:     "flex",
                flexDirection:"column",
                alignItems:  "center",
                gap:         8,
                margin:      "0 auto",
                opacity:     0.35,
                transition:  "opacity 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = "0.65"; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = "0.35"; }}
            >
              <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: text }}>
                Explore
              </span>
              <div style={{
                width:  1,
                height: 28,
                background: `linear-gradient(to bottom, ${text}, transparent)`,
              }} />
            </button>
          </div>

          {/* ── Sound toggle — bottom right of hero ── */}
          <button
            onClick={toggleSound}
            aria-label={soundOn ? "Mute video" : "Unmute video"}
            style={{
              position:       "absolute",
              bottom:         isMobile ? 24 : 40,
              right:          isMobile ? 20 : 48,
              zIndex:         10,
              display:        "flex",
              alignItems:     "center",
              gap:            10,
              background:     "rgba(13,11,9,0.52)",
              backdropFilter: "blur(14px)",
              WebkitBackdropFilter: "blur(14px)",
              border:         soundOn
                ? "1px solid rgba(201,168,76,0.35)"
                : "1px solid rgba(255,255,255,0.1)",
              borderRadius:   1,
              padding:        "9px 16px 9px 13px",
              cursor:         "pointer",
              transition:     "all 0.3s ease",
              boxShadow:      soundOn
                ? "0 0 24px rgba(201,168,76,0.12)"
                : "none",
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
              e.currentTarget.style.background  = "rgba(13,11,9,0.7)";
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = soundOn
                ? "rgba(201,168,76,0.35)"
                : "rgba(255,255,255,0.1)";
              e.currentTarget.style.background  = "rgba(13,11,9,0.52)";
            }}
          >
            {/* Animated waveform bars */}
            <div style={{
              display:    "flex",
              alignItems: "center",
              gap:        2.5,
              height:     16,
            }}>
              {[0.45, 1, 0.65, 0.85, 0.5].map((scale, i) => (
                <div
                  key={i}
                  style={{
                    width:      2,
                    height:     soundOn ? `${scale * 14}px` : "2px",
                    background: soundOn ? GOLD : "rgba(245,240,232,0.3)",
                    borderRadius: 2,
                    transition: "height 0.35s ease, background 0.35s ease",
                    animation:  soundOn
                      ? `lwd-wave 0.75s ease-in-out ${i * 0.1}s infinite alternate`
                      : "none",
                  }}
                />
              ))}
            </div>

            {/* Label */}
            <span style={{
              fontFamily:    "var(--font-body)",
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color:         soundOn ? GOLD : "rgba(245,240,232,0.4)",
              transition:    "color 0.3s ease",
            }}>
              {soundOn ? "Sound" : "Muted"}
            </span>
          </button>

          {/* ── Video credits — bottom left, stacked ── */}
          <div style={{
            position:      "absolute",
            bottom:        isMobile ? 24 : 42,
            left:          isMobile ? 20 : 48,
            zIndex:        10,
            display:       "flex",
            flexDirection: "column",
            gap:           4,
          }}>
            {[
              ["Video",   "@LebaneseWeddings"],
              ["Planner", "@lemariageqatar"],
              ["Photo",   "@ParazarMe"],
              ["Dress",   "@valentino"],
            ].map(([role, handle]) => (
              <div key={handle} style={{
                fontFamily:    "var(--font-body)",
                fontSize:      9,
                letterSpacing: "0.1em",
                color:         "rgba(245,240,232,0.22)",
                textTransform: "uppercase",
                display:       "flex",
                gap:           6,
              }}>
                <span style={{ opacity: 0.55 }}>{role}</span>
                <span>{handle}</span>
              </div>
            ))}
          </div>

        </section>

        {/* ══════════════════════════════════════════════════════════════
            FIRST FLOOR — Category floors (cinematic full-image cards)
        ══════════════════════════════════════════════════════════════ */}
        <section style={{
          padding:    isMobile ? "60px 16px" : "100px 48px",
          maxWidth:   isMobile ? "100%" : 1440,
          margin:     isMobile ? 0 : "0 auto",
          width:      "100%",
          borderBottom: `1px solid ${divider}`,
        }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily:    NU,
              fontSize:      10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color:         GOLD,
              marginBottom:  12,
              opacity:       0.65,
            }}>
              Browse by Category
            </div>
            <h2 style={{
              fontFamily: GD,
              fontSize:   "clamp(26px, 3.5vw, 40px)",
              fontWeight: 400,
              fontStyle:  "italic",
              color:      text,
              margin:     0,
              lineHeight: 1.2,
            }}>
              Choose your floor
            </h2>
          </div>

          <div style={{
            display:      "flex",
            overflowX:    "auto",
            gap:          isMobile ? 12 : 20,
            paddingBottom: 12,
            scrollBehavior: "smooth",
          }}>
            {BROWSE_CATEGORIES.map(cat => {
              const isActive = categoryFilter === cat.slug;
              return (
                <button
                  key={cat.slug}
                  onClick={() => {
                    setCategoryFilter(isActive ? "all" : cat.slug);
                    setBrowsePageNum(1);
                  }}
                  style={{
                    position:     "relative",
                    height:       isMobile ? 220 : 400,
                    minWidth:     isMobile ? 200 : 320,
                    flexShrink:   0,
                    borderRadius: 2,
                    overflow:     "hidden",
                    cursor:       "pointer",
                    border:       isActive
                      ? `1px solid ${GOLD}`
                      : "1px solid rgba(255,255,255,0.05)",
                    transition:   "all 0.4s ease",
                    background:   cat.grad,
                    textAlign:    "left",
                    transform:    "none",
                    boxShadow:    "none",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = cat.accent.replace("0.55", "0.28");
                      e.currentTarget.querySelector(".cat-overlay").style.background =
                        "linear-gradient(to top, rgba(13,11,9,0.82) 0%, rgba(13,11,9,0.18) 60%, transparent 100%)";
                    }
                    e.currentTarget.querySelector(".cat-label").style.transform = "translateY(-6px)";
                    e.currentTarget.style.transform = "translateY(-5px) scale(1.012)";
                    e.currentTarget.style.boxShadow = `0 28px 70px rgba(0,0,0,0.55), 0 0 80px ${cat.accent.replace("0.55", "0.16")}`;
                  }}
                  onMouseLeave={e => {
                    if (!isActive) {
                      e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                      e.currentTarget.querySelector(".cat-overlay").style.background =
                        "linear-gradient(to top, rgba(13,11,9,0.92) 0%, rgba(13,11,9,0.3) 55%, transparent 100%)";
                    }
                    e.currentTarget.querySelector(".cat-label").style.transform = "none";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  {/* Accent glow top-right */}
                  <div style={{
                    position:     "absolute",
                    top:          "-30%",
                    right:        "-20%",
                    width:        "70%",
                    height:       "70%",
                    borderRadius: "50%",
                    background:   `radial-gradient(ellipse, ${cat.accent} 0%, transparent 70%)`,
                    pointerEvents:"none",
                  }} />

                  {/* Optional image */}
                  {cat.img && (
                    <img
                      src={cat.img}
                      alt={cat.label}
                      style={{
                        position:   "absolute",
                        inset:      0,
                        width:      "100%",
                        height:     "100%",
                        objectFit:  "cover",
                        opacity:    0.6,
                      }}
                    />
                  )}

                  {/* Overlay gradient */}
                  <div
                    className="cat-overlay"
                    style={{
                      position:   "absolute",
                      inset:      0,
                      background: "linear-gradient(to top, rgba(13,11,9,0.92) 0%, rgba(13,11,9,0.3) 55%, transparent 100%)",
                      transition: "background 0.4s ease",
                    }}
                  />

                  {/* Grain for depth */}
                  <div style={{
                    position:   "absolute",
                    inset:      0,
                    backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
                    backgroundSize: "160px 160px",
                    pointerEvents:  "none",
                    zIndex:         1,
                  }} />

                  {/* Category code watermark — mirrors IT/FR/UK/GR on destination cards */}
                  <div style={{
                    position:      "absolute",
                    bottom:        -20,
                    right:         4,
                    fontFamily:    GD,
                    fontSize:      isMobile ? 80 : 120,
                    fontWeight:    700,
                    fontStyle:     "italic",
                    color:         text,
                    opacity:       0.055,
                    lineHeight:    1,
                    letterSpacing: "-3px",
                    pointerEvents: "none",
                    userSelect:    "none",
                    zIndex:        2,
                    transition:    "opacity 0.4s ease",
                  }}>
                    {cat.code}
                  </div>

                  {/* Active indicator */}
                  {isActive && (
                    <div style={{
                      position:   "absolute",
                      top:        16,
                      right:      16,
                      fontFamily: NU,
                      fontSize:   9,
                      fontWeight: 700,
                      letterSpacing: "0.15em",
                      textTransform: "uppercase",
                      color:      "#0d0b09",
                      background: GOLD,
                      padding:    "4px 8px",
                      borderRadius: 1,
                    }}>
                      Selected
                    </div>
                  )}

                  {/* Label at bottom */}
                  <div
                    className="cat-label"
                    style={{
                      position:   "absolute",
                      bottom:     0,
                      left:       0,
                      right:      0,
                      padding:    isMobile ? "16px 16px 20px" : "24px 28px 32px",
                      transition: "transform 0.35s ease",
                    }}
                  >
                    <div style={{
                      fontFamily:  GD,
                      fontSize:    isMobile ? 16 : 22,
                      fontWeight:  400,
                      fontStyle:   "italic",
                      color:       text,
                      marginBottom: 6,
                      lineHeight:  1.2,
                    }}>
                      {cat.label}
                    </div>
                    <div style={{
                      fontFamily: NU,
                      fontSize:   isMobile ? 10 : 12,
                      color:      muted,
                      lineHeight: 1.5,
                    }}>
                      {cat.line}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            FIRST FLOOR B — Destination editorial cards
        ══════════════════════════════════════════════════════════════ */}
        <section style={{
          padding:      isMobile ? "60px 16px" : "80px 48px",
          maxWidth:     isMobile ? "100%" : 1440,
          margin:       isMobile ? 0 : "0 auto",
          width:        "100%",
          borderBottom: `1px solid ${divider}`,
        }}>
          <div style={{ marginBottom: 48 }}>
            <div style={{
              fontFamily:    NU,
              fontSize:      10,
              letterSpacing: "0.28em",
              textTransform: "uppercase",
              color:         "rgba(167,139,250,0.7)",
              marginBottom:  12,
            }}>
              Browse by Destination
            </div>
            <h2 style={{
              fontFamily: GD,
              fontSize:   "clamp(26px, 3.5vw, 40px)",
              fontWeight: 400,
              fontStyle:  "italic",
              color:      text,
              margin:     0,
              lineHeight: 1.2,
            }}>
              Where do you wish to marry?
            </h2>
          </div>

          <div style={{
            display:      "flex",
            overflowX:    "auto",
            gap:          isMobile ? 12 : 20,
            paddingBottom: 12,
            scrollBehavior: "smooth",
          }}>
            {BROWSE_DESTINATIONS.map(dest => {
              const isActive = countryFilter === dest.slug;
              return (
                <button
                  key={dest.slug}
                  onClick={() => {
                    setCountryFilter(isActive ? "all" : dest.slug);
                    setRegionFilter("all");
                    setBrowsePageNum(1);
                  }}
                  style={{
                    position:     "relative",
                    height:       isMobile ? 200 : 340,
                    minWidth:     isMobile ? 200 : 320,
                    flexShrink:   0,
                    borderRadius: 2,
                    overflow:     "hidden",
                    cursor:       "pointer",
                    border:       isActive
                      ? `1px solid rgba(167,139,250,0.5)`
                      : "1px solid rgba(255,255,255,0.05)",
                    background:   dest.grad,
                    textAlign:    "left",
                    transition:   "all 0.4s ease",
                    transform:    "none",
                    boxShadow:    "none",
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.borderColor = dest.line.replace("0.4", "0.35");
                    e.currentTarget.style.transform = "translateY(-4px) scale(1.008)";
                    e.currentTarget.style.boxShadow = `0 24px 60px rgba(0,0,0,0.45)`;
                    e.currentTarget.querySelector(".dest-content").style.opacity = "1";
                    e.currentTarget.querySelector(".dest-code").style.opacity = "0.08";
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.borderColor = "rgba(255,255,255,0.05)";
                    e.currentTarget.style.transform = "none";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.querySelector(".dest-content").style.opacity = "1";
                    e.currentTarget.querySelector(".dest-code").style.opacity = "0.05";
                  }}
                >
                  {/* Colour line accent — fades to transparent at edges */}
                  <div style={{
                    position:   "absolute",
                    top:        0, left: 0,
                    width:      "100%",
                    height:     1,
                    background: `linear-gradient(to right, transparent 0%, ${dest.line.replace("0.4", "0.6")} 25%, ${dest.line.replace("0.4", "0.6")} 75%, transparent 100%)`,
                  }} />

                  {/* Country code watermark */}
                  <div
                    className="dest-code"
                    style={{
                      position:      "absolute",
                      bottom:        -24,
                      right:         8,
                      fontFamily:    GD,
                      fontSize:      140,
                      fontWeight:    700,
                      fontStyle:     "italic",
                      color:         text,
                      opacity:       0.05,
                      lineHeight:    1,
                      pointerEvents: "none",
                      userSelect:    "none",
                      transition:    "opacity 0.4s ease",
                      letterSpacing: "-4px",
                    }}
                  >
                    {dest.code}
                  </div>

                  {/* Content */}
                  <div
                    className="dest-content"
                    style={{
                      position:   "absolute",
                      inset:      0,
                      padding:    isMobile ? "24px 24px" : "40px 36px",
                      display:    "flex",
                      flexDirection: "column",
                      justifyContent: "flex-end",
                      opacity:    1,
                      transition: "opacity 0.3s ease",
                    }}
                  >
                    {/* Active badge */}
                    {isActive && (
                      <div style={{
                        position:  "absolute",
                        top:       16, right: 16,
                        fontFamily: NU,
                        fontSize:  9,
                        fontWeight: 700,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        color:     "#0d0b09",
                        background: PURPLE,
                        padding:   "4px 8px",
                        borderRadius: 1,
                      }}>
                        Selected
                      </div>
                    )}

                    <div style={{
                      fontFamily:  GD,
                      fontSize:    isMobile ? 20 : 26,
                      fontWeight:  400,
                      fontStyle:   "italic",
                      color:       text,
                      marginBottom: 10,
                      lineHeight:  1.15,
                    }}>
                      {dest.label}
                    </div>
                    <p style={{
                      fontFamily: NU,
                      fontSize:   isMobile ? 11 : 13,
                      color:      muted,
                      margin:     0,
                      lineHeight: 1.65,
                      fontStyle:  "italic",
                    }}>
                      {dest.quote}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active filter summary */}
          {(categoryFilter !== "all" || countryFilter !== "all") && (
            <div style={{
              marginTop:   32,
              display:     "flex",
              alignItems:  "center",
              gap:         16,
              flexWrap:    "wrap",
            }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: muted }}>
                Viewing:
              </span>
              {categoryFilter !== "all" && (
                <span style={{
                  fontFamily:  NU,
                  fontSize:    12,
                  color:       GOLD,
                  border:      `1px solid ${goldBorder}`,
                  borderRadius: 1,
                  padding:     "4px 10px",
                }}>
                  {BROWSE_CATEGORIES.find(c => c.slug === categoryFilter)?.label || categoryFilter}
                </span>
              )}
              {countryFilter !== "all" && (
                <span style={{
                  fontFamily:  NU,
                  fontSize:    12,
                  color:       PURPLE,
                  border:      "1px solid rgba(167,139,250,0.25)",
                  borderRadius: 1,
                  padding:     "4px 10px",
                }}>
                  {BROWSE_DESTINATIONS.find(d => d.slug === countryFilter)?.label || countryFilter}
                </span>
              )}
              <button
                onClick={clearFilters}
                style={{
                  fontFamily: NU, fontSize: 11, color: subtle,
                  background: "transparent", border: "none", cursor: "pointer",
                  textDecoration: "underline", textUnderlineOffset: 3,
                }}
              >
                Clear
              </button>
            </div>
          )}
        </section>

        {/* Your Curated Selection — Transition to results */}
        <section style={{
          padding:      isMobile ? "40px 16px" : "60px 48px",
          maxWidth:     isMobile ? "100%" : 1440,
          margin:       isMobile ? 0 : "0 auto",
          width:        "100%",
          textAlign:    "center",
        }}>
          <div style={{
            fontFamily:    GD,
            fontSize:      isMobile ? 18 : 24,
            fontWeight:    400,
            fontStyle:     "italic",
            color:         GOLD,
            opacity:       0.8,
            marginBottom:  8,
            letterSpacing: "0.05em",
          }}>
            ✦ Your Curated Selection
          </div>
          <div style={{
            fontFamily:    NU,
            fontSize:      12,
            color:         "rgba(201,168,76,0.6)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}>
            Scroll to explore
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECOND FLOOR — Curated Collections (magazine-style)
        ══════════════════════════════════════════════════════════════ */}
        {curatedCollections.length > 0 && (
          <section style={{
            padding:      isMobile ? "60px 16px" : "100px 48px",
            maxWidth:     isMobile ? "100%" : 1440,
            margin:       isMobile ? 0 : "0 auto",
            width:        "100%",
            borderBottom: `1px solid ${divider}`,
          }}>
            <div style={{ marginBottom: 72 }}>
              <div style={{
                fontFamily:    NU,
                fontSize:      10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color:         GREEN,
                marginBottom:  12,
                opacity:       0.7,
              }}>
                Curated by our editors
              </div>
              <h2 style={{
                fontFamily: GD,
                fontSize:   "clamp(28px, 4vw, 44px)",
                fontWeight: 400,
                fontStyle:  "italic",
                color:      text,
                margin:     "0 0 12px",
                lineHeight: 1.15,
              }}>
                Collections worth your time
              </h2>
              <p style={{
                fontFamily: NU,
                fontSize:   14,
                color:      muted,
                lineHeight: 1.75,
                maxWidth:   520,
                margin:     0,
              }}>
                Every name below has been considered carefully. Our editors do not fill lists, they build them.
              </p>
            </div>

            {curatedCollections.map((coll, idx) => (
              <div
                key={coll.id}
                style={{
                  position:      "relative",
                  marginBottom:  idx < curatedCollections.length - 1 ? (isMobile ? 60 : 120) : 0,
                  paddingBottom: idx < curatedCollections.length - 1 ? (isMobile ? 60 : 120) : 0,
                  borderBottom:  idx < curatedCollections.length - 1 ? `1px solid ${divider}` : "none",
                }}
              >
                {/* Section title watermark — same language as IT / VEN / FLO */}
                <div style={{
                  position:      "absolute",
                  top:           "-79px",
                  left:          "50%",
                  transform:     "translateX(-50%)",
                  fontFamily:    GD,
                  fontSize:      "clamp(80px, 14vw, 200px)",
                  fontWeight:    700,
                  fontStyle:     "italic",
                  color:         text,
                  opacity:       0.03,
                  whiteSpace:    "nowrap",
                  letterSpacing: "-4px",
                  lineHeight:    1,
                  pointerEvents: "none",
                  userSelect:    "none",
                  zIndex:        0,
                }}>
                  {coll.title.toUpperCase()}
                </div>

                {/* All content sits above the watermark */}
                <div style={{ position: "relative", zIndex: 1 }}>

                {/* Collection header — magazine-style */}
                <div style={{
                  display:     "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "320px 1fr",
                  gap:         isMobile ? 24 : 60,
                  marginBottom: 44,
                  alignItems:  "start",
                }}>
                  <div>
                    <div style={{
                      fontFamily:    NU,
                      fontSize:      10,
                      letterSpacing: "0.25em",
                      textTransform: "uppercase",
                      color:         coll.accent,
                      marginBottom:  10,
                      opacity:       0.8,
                    }}>
                      ✦ &nbsp;{coll.title}
                    </div>
                    <h3 style={{
                      fontFamily:  GD,
                      fontSize:    "clamp(22px, 2.5vw, 30px)",
                      fontWeight:  400,
                      fontStyle:   "italic",
                      color:       text,
                      margin:      "0 0 10px",
                      lineHeight:  1.2,
                    }}>
                      {coll.title}
                    </h3>
                    {coll.hasMore && (
                      <button
                        onClick={() => setCategoryFilter("all")}
                        style={{
                          fontFamily:    NU,
                          fontSize:      11,
                          fontWeight:    600,
                          letterSpacing: "0.04em",
                          color:         coll.accent,
                          background:    "transparent",
                          border:        "none",
                          cursor:        "pointer",
                          marginTop:     12,
                          textDecoration:"underline",
                          textUnderlineOffset: 3,
                        }}
                      >
                        View all {coll.totalCount} →
                      </button>
                    )}
                  </div>
                  <p style={{
                    fontFamily: NU,
                    fontSize:   14,
                    color:      muted,
                    lineHeight: 1.85,
                    margin:     0,
                    fontStyle:  "italic",
                    paddingTop: isMobile ? 0 : 4,
                  }}>
                    {coll.subtitle}
                  </p>
                </div>

                {/* Cards */}
                <div style={{
                  display:             "grid",
                  gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                  gap:                 isMobile ? 16 : 24,
                }}>
                  {coll.items.map(v => {
                    const cat = (v.categorySlug || "").toLowerCase();
                    const articleCount = v.tag === "Award Winner" ? 6 : v.verified ? 4 : v.featured ? 3 : null;
                    const card = cat === "wedding-planners" ? (
                      <PlannerCard
                        key={v.id || v.slug || v.name}
                        v={v}
                        onView={() => onViewVenue(v.id || v.slug)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    ) : cat === "wedding-venues" ? (
                      <LuxuryVenueCard
                        key={v.id || v.slug || v.name}
                        v={v}
                        onView={() => onViewVenue(v.id || v.slug)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    ) : (
                      <LuxuryVendorCard
                        key={v.id || v.slug || v.name}
                        v={v}
                        onView={() => onViewVenue(v.id || v.slug)}
                        quickViewItem={qvItem}
                        setQuickViewItem={setQvItem}
                      />
                    );
                    return (
                      <div key={v.id || v.slug || v.name} style={{ position: "relative" }}>
                        {card}
                        {articleCount && (
                          <div style={{
                            position:      "absolute",
                            top:           295,
                            left:          14,
                            zIndex:        10,
                            fontFamily:    "var(--font-body)",
                            fontSize:      9,
                            fontWeight:    600,
                            letterSpacing: "0.1em",
                            color:         "rgba(201,168,76,0.9)",
                            background:    "rgba(13,11,9,0.72)",
                            backdropFilter:"blur(8px)",
                            WebkitBackdropFilter: "blur(8px)",
                            border:        "1px solid rgba(201,168,76,0.2)",
                            padding:       "3px 8px",
                            borderRadius:  1,
                            pointerEvents: "none",
                          }}>
                            ✦ In {articleCount} articles
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                </div>{/* end zIndex:1 wrapper */}
              </div>
            ))}
          </section>
        )}

        {/* ══════════════════════════════════════════════════════════════
            TOP FLOOR — Editorial trust strip
        ══════════════════════════════════════════════════════════════ */}
        <section style={{
          padding:    isMobile ? "60px 16px" : "80px 48px",
          maxWidth:   isMobile ? "100%" : 1440,
          margin:     isMobile ? 0 : "0 auto",
          width:      "100%",
          borderBottom:`1px solid ${divider}`,
        }}>
          <div style={{
            display:             "grid",
            gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr 1fr",
            gap:                 isMobile ? 40 : 0,
          }}>
            {[
              {
                num:   "2,400+",
                label: "Verified professionals",
                desc:  "Every listing is personally reviewed by our editorial team before it appears in the directory.",
              },
              {
                num:   "180+",
                label: "Global destinations",
                desc:  "From Italian hillside estates to Japanese ryokan retreats. We follow exceptional weddings wherever they happen.",
              },
              {
                num:   "Editorial",
                label: "Not algorithmic",
                desc:  "We do not rank by advertising spend. Placement reflects quality, character, and editorial alignment.",
              },
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  padding:     isMobile ? "0 0 32px" : "0 52px",
                  borderLeft:  !isMobile && idx > 0 ? `1px solid ${divider}` : "none",
                }}
              >
                <div style={{
                  fontFamily:    GD,
                  fontSize:      "clamp(58px, 6.5vw, 96px)",
                  fontWeight:    400,
                  fontStyle:     "italic",
                  color:         GOLD,
                  marginBottom:  4,
                  lineHeight:    1,
                  letterSpacing: "-0.01em",
                }}>
                  {item.num}
                </div>
                <div style={{
                  width:      40,
                  height:     1,
                  background: "linear-gradient(to right, rgba(201,168,76,0.5), transparent)",
                  marginBottom: 14,
                }} />
                <div style={{
                  fontFamily:    NU,
                  fontSize:      10,
                  fontWeight:    700,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color:         text,
                  marginBottom:  14,
                  opacity:       0.65,
                }}>
                  {item.label}
                </div>
                <p style={{
                  fontFamily: NU,
                  fontSize:   14,
                  color:      subtle,
                  lineHeight: 1.8,
                  margin:     0,
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            THIRD FLOOR — Smart filters
            MAIN FLOOR — Full directory grid
        ══════════════════════════════════════════════════════════════ */}
        <section
          ref={browseRef}
          style={{
            padding:  isMobile ? "60px 16px 48px" : "80px 48px 60px",
            maxWidth: isMobile ? "100%" : 1440,
            margin:   isMobile ? 0 : "0 auto",
            width:    "100%",
          }}
        >
          {/* Section heading */}
          <div style={{
            display:       "flex",
            alignItems:    "flex-end",
            justifyContent:"space-between",
            flexWrap:      "wrap",
            gap:           16,
            marginBottom:  48,
          }}>
            <div>
              <div style={{
                fontFamily:    NU,
                fontSize:      10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color:         muted,
                marginBottom:  10,
              }}>
                Full directory
              </div>
              <h2 style={{
                fontFamily: GD,
                fontSize:   "clamp(26px, 3.5vw, 40px)",
                fontWeight: 400,
                fontStyle:  "italic",
                color:      text,
                margin:     0,
                lineHeight: 1.2,
              }}>
                The complete directory
              </h2>
              {dbLoaded && (
                <p style={{
                  fontFamily: NU,
                  fontSize:   12,
                  color:      subtle,
                  margin:     "8px 0 0",
                }}>
                  {browseItems.length.toLocaleString()} professional{browseItems.length !== 1 ? "s" : ""} available
                  {hasActiveFilters && " with current filters"}
                </p>
              )}
            </div>

            <button
              onClick={() => setShowFilters(!showFilters)}
              style={{
                fontFamily:    NU,
                fontSize:      11,
                fontWeight:    600,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color:         showFilters ? "#0d0b09" : muted,
                background:    showFilters
                  ? GOLD
                  : "rgba(255,255,255,0.04)",
                border:        showFilters
                  ? "none"
                  : `1px solid ${divider}`,
                borderRadius:  1,
                padding:       "10px 20px",
                cursor:        "pointer",
                transition:    "all 0.2s",
              }}
            >
              {showFilters ? "✓ Filtering" : "Filters & Sort"}
            </button>
          </div>

          {/* Filter panel */}
          {showFilters && (
            <div style={{
              background:   "rgba(255,255,255,0.02)",
              border:       `1px solid ${divider}`,
              borderRadius: 2,
              padding:      isMobile ? 20 : 32,
              marginBottom: 48,
            }}>
              <div style={{
                display:             "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(auto-fit, minmax(200px, 1fr))",
                gap:                 16,
                marginBottom:        hasActiveFilters ? 20 : 0,
              }}>
                <FilterDropdown
                  label="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={[
                    { value: "all", label: "All Categories" },
                    ...VENDOR_CATEGORIES.map(c => ({ value: c.slug, label: c.label })),
                  ]}
                  text={text} muted={muted} divider={divider} bg={bg}
                />

                <FilterDropdown
                  label="Country"
                  value={countryFilter}
                  onChange={v => { setCountryFilter(v); setRegionFilter("all"); }}
                  options={[
                    { value: "all", label: "All Countries" },
                    ...COUNTRIES.map(c => ({ value: c.slug, label: c.name })),
                  ]}
                  text={text} muted={muted} divider={divider} bg={bg}
                />

                {countryFilter !== "all" && availableRegions.length > 0 && (
                  <FilterDropdown
                    label="Region"
                    value={regionFilter}
                    onChange={setRegionFilter}
                    options={[
                      { value: "all", label: "All Regions" },
                      ...availableRegions.map(r => ({ value: r.slug, label: r.name })),
                    ]}
                    text={text} muted={muted} divider={divider} bg={bg}
                  />
                )}

                <FilterDropdown
                  label="Sort"
                  value={sortMode}
                  onChange={setSortMode}
                  options={SORT_OPTIONS.map(s => ({ value: s.key, label: s.label }))}
                  text={text} muted={muted} divider={divider} bg={bg}
                />
              </div>

              {hasActiveFilters && (
                <button
                  onClick={clearFilters}
                  style={{
                    fontFamily:        NU,
                    fontSize:          12,
                    color:             GOLD,
                    background:        "transparent",
                    border:            "none",
                    cursor:            "pointer",
                    textDecoration:    "underline",
                    textUnderlineOffset: 3,
                  }}
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          {/* Grid */}
          {!dbLoaded ? (
            <div style={{
              display:             "grid",
              gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
              gap:                 24,
            }}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={i}
                  style={{
                    height:       360,
                    borderRadius: 2,
                    background:   `linear-gradient(135deg, ${cardBg}, rgba(201,168,76,0.02))`,
                    animation:    "pulse 1.8s ease-in-out infinite",
                    animationDelay: `${i * 0.15}s`,
                  }}
                />
              ))}
            </div>
          ) : browseItems.length === 0 ? (
            <div style={{
              textAlign: "center",
              padding:   "80px 24px",
              maxWidth:  520,
              margin:    "0 auto",
            }}>
              <div style={{
                fontFamily:  GD,
                fontSize:    48,
                fontStyle:   "italic",
                color:       subtle,
                marginBottom: 20,
                opacity:     0.4,
              }}>
                ◇
              </div>
              <h3 style={{
                fontFamily:  GD,
                fontSize:    28,
                fontWeight:  400,
                fontStyle:   "italic",
                color:       text,
                margin:      "0 0 12px",
                lineHeight:  1.2,
              }}>
                Nothing matched your search
              </h3>
              <p style={{
                fontFamily: NU,
                fontSize:   14,
                color:      muted,
                lineHeight: 1.75,
                marginBottom: 32,
              }}>
                Try broadening your search, or explore the curated collections above.
              </p>
              <button
                onClick={clearFilters}
                style={{
                  fontFamily:    NU,
                  fontSize:      12,
                  fontWeight:    700,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  color:         "#0d0b09",
                  background:    GOLD,
                  border:        "none",
                  borderRadius:  1,
                  padding:       "12px 28px",
                  cursor:        "pointer",
                }}
              >
                Reset & Browse All
              </button>
            </div>
          ) : (
            <>
              <div style={{
                display:             "grid",
                gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
                gap:                 isMobile ? 16 : 24,
                marginBottom:        56,
              }}>
                {visibleBrowseItems.map(v => {
                  const cat = (v.categorySlug || "").toLowerCase();

                  // Tier badge overlay wrapper
                  const tierLabel = v.tier === "showcase"
                    ? "Showcase"
                    : v.tier === "featured"
                    ? "Featured"
                    : v.featured ? "Featured" : null;

                  const card = cat === "wedding-planners" ? (
                    <PlannerCard
                      key={v.id || v.slug || v.name}
                      v={v}
                      onView={() => onViewVenue(v.id || v.slug)}
                    />
                  ) : cat === "wedding-venues" ? (
                    <LuxuryVenueCard
                      key={v.id || v.slug || v.name}
                      v={v}
                      onView={() => onViewVenue(v.id || v.slug)}
                      quickViewItem={qvItem}
                      setQuickViewItem={setQvItem}
                    />
                  ) : (
                    <LuxuryVendorCard
                      key={v.id || v.slug || v.name}
                      v={v}
                      onView={() => onViewVenue(v.id || v.slug)}
                      quickViewItem={qvItem}
                      setQuickViewItem={setQvItem}
                    />
                  );

                  return (
                    <div
                      key={v.id || v.slug || v.name}
                      style={{ position: "relative", transition: "transform 0.3s ease, box-shadow 0.3s ease" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.transform = "translateY(-4px)";
                        e.currentTarget.style.boxShadow = "0 20px 48px rgba(0,0,0,0.4), 0 0 0 1px rgba(201,168,76,0.07)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.transform = "none";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    >
                      {card}
                      {/* Tier badge pinned top-left on the card wrapper */}
                      {tierLabel && (
                        <div style={{
                          position:      "absolute",
                          top:           14,
                          left:          14,
                          zIndex:        10,
                          fontFamily:    NU,
                          fontSize:      9,
                          fontWeight:    700,
                          letterSpacing: "0.15em",
                          textTransform: "uppercase",
                          color:         "#0d0b09",
                          background:    v.tier === "showcase"
                            ? "linear-gradient(90deg, #C9A84C, #e8c97a)"
                            : "rgba(201,168,76,0.85)",
                          padding:       "4px 9px",
                          borderRadius:  1,
                          pointerEvents: "none",
                        }}>
                          {tierLabel}
                        </div>
                      )}
                      {/* Editorial coverage badge */}
                      {(v.verified || v.tag) && (
                        <div style={{
                          position:      "absolute",
                          top:           175,
                          left:          14,
                          zIndex:        10,
                          fontFamily:    NU,
                          fontSize:      9,
                          fontWeight:    600,
                          letterSpacing: "0.1em",
                          color:         "rgba(201,168,76,0.9)",
                          background:    "rgba(13,11,9,0.72)",
                          backdropFilter:"blur(8px)",
                          WebkitBackdropFilter: "blur(8px)",
                          border:        "1px solid rgba(201,168,76,0.2)",
                          padding:       "3px 8px",
                          borderRadius:  1,
                          pointerEvents: "none",
                        }}>
                          ✦ In {v.tag === "Award Winner" ? 6 : v.verified ? 4 : 2} articles
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalBrowsePages > 1 && (
                <div style={{
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  gap:            16,
                }}>
                  <button
                    onClick={() => setBrowsePageNum(Math.max(1, browsePage - 1))}
                    disabled={browsePage === 1}
                    style={{
                      fontFamily:    NU,
                      fontSize:      11,
                      fontWeight:    600,
                      letterSpacing: "0.04em",
                      color:         browsePage === 1 ? subtle : muted,
                      background:    "transparent",
                      border:        `1px solid ${browsePage === 1 ? "rgba(255,255,255,0.04)" : divider}`,
                      borderRadius:  1,
                      padding:       "10px 20px",
                      cursor:        browsePage === 1 ? "default" : "pointer",
                      opacity:       browsePage === 1 ? 0.4 : 1,
                      transition:    "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      if (browsePage !== 1) { e.currentTarget.style.borderColor = goldBorder; e.currentTarget.style.color = text; }
                    }}
                    onMouseLeave={e => {
                      if (browsePage !== 1) { e.currentTarget.style.borderColor = divider; e.currentTarget.style.color = muted; }
                    }}
                  >
                    ← Previous
                  </button>

                  <div style={{
                    fontFamily: NU,
                    fontSize:   12,
                    color:      subtle,
                    minWidth:   120,
                    textAlign:  "center",
                    letterSpacing: "0.02em",
                  }}>
                    {browsePage} / {totalBrowsePages}
                  </div>

                  <button
                    onClick={() => setBrowsePageNum(Math.min(totalBrowsePages, browsePage + 1))}
                    disabled={browsePage === totalBrowsePages}
                    style={{
                      fontFamily:    NU,
                      fontSize:      11,
                      fontWeight:    600,
                      letterSpacing: "0.04em",
                      color:         browsePage === totalBrowsePages ? subtle : muted,
                      background:    "transparent",
                      border:        `1px solid ${browsePage === totalBrowsePages ? "rgba(255,255,255,0.04)" : divider}`,
                      borderRadius:  1,
                      padding:       "10px 20px",
                      cursor:        browsePage === totalBrowsePages ? "default" : "pointer",
                      opacity:       browsePage === totalBrowsePages ? 0.4 : 1,
                      transition:    "all 0.2s",
                    }}
                    onMouseEnter={e => {
                      if (browsePage !== totalBrowsePages) { e.currentTarget.style.borderColor = goldBorder; e.currentTarget.style.color = text; }
                    }}
                    onMouseLeave={e => {
                      if (browsePage !== totalBrowsePages) { e.currentTarget.style.borderColor = divider; e.currentTarget.style.color = muted; }
                    }}
                  >
                    Next →
                  </button>
                </div>
              )}
            </>
          )}
        </section>

        {/* QuickView Modal */}
        {qvItem && (
          <QuickViewModal
            item={qvItem}
            onClose={() => setQvItem(null)}
            onView={() => { onViewVenue(qvItem.id || qvItem.slug); setQvItem(null); }}
          />
        )}

        {/* Immersive Search — 3-step Aura guided flow */}
        <ImmersiveSearch
          isOpen={immersiveOpen}
          onClose={() => setImmersiveOpen(false)}
          onViewRegionCategory={(countrySlug, regionSlug, catSlug) => {
            setCountryFilter(countrySlug);
            setRegionFilter(regionSlug);
            setCategoryFilter(catSlug);
            setImmersiveOpen(false);
            scrollToBrowse();
          }}
          onViewRegion={(countrySlug, regionSlug) => {
            setCountryFilter(countrySlug);
            setRegionFilter(regionSlug);
            setImmersiveOpen(false);
            scrollToBrowse();
          }}
          onViewCategory={() => {
            setImmersiveOpen(false);
            scrollToBrowse();
          }}
        />

        <style>{`
          @keyframes pulse {
            0%, 100% { opacity: 0.35; }
            50%       { opacity: 0.6;  }
          }
          @keyframes lwd-wave {
            0%   { transform: scaleY(0.4); }
            100% { transform: scaleY(1);   }
          }
        `}</style>
      </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// FilterDropdown
// ═══════════════════════════════════════════════════════════════════════════

function FilterDropdown({ label, value, onChange, options, text, muted, divider, bg }) {
  return (
    <div>
      <label style={{
        fontFamily:    "var(--font-body)",
        fontSize:      10,
        fontWeight:    600,
        color:         muted,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        display:       "block",
        marginBottom:  8,
      }}>
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            fontFamily:  "var(--font-body)",
            fontSize:    13,
            fontWeight:  500,
            color:       text,
            background:  "rgba(255,255,255,0.04)",
            border:      "1px solid rgba(255,255,255,0.08)",
            borderRadius: 1,
            padding:     "10px 32px 10px 12px",
            cursor:      "pointer",
            appearance:  "none",
            outline:     "none",
            transition:  "border-color 0.2s",
            width:       "100%",
            boxSizing:   "border-box",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)"; }}
          onBlur={e  => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.08)"; }}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: "#141210", color: text }}>
              {opt.label}
            </option>
          ))}
        </select>
        <div style={{
          position:      "absolute",
          right:         12,
          top:           "50%",
          transform:     "translateY(-50%)",
          pointerEvents: "none",
          color:         muted,
          fontSize:      10,
        }}>
          ▾
        </div>
      </div>
    </div>
  );
}
