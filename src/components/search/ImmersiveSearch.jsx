// ─── src/components/search/ImmersiveSearch.jsx ────────────────────────────────
// Full-screen immersive search overlay.
// Two-step guided flow: location → category → navigate to results.
// Reuses existing routing callbacks and geo/listing data — no new backend.
import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { COUNTRIES as GEO_COUNTRIES, VENDOR_CATEGORIES, getRegionSlugByName } from "../../data/geo";
import { LOCATIONS as STATIC_LOCATIONS } from "../../data/globalVendors";
import AuraImmersiveWorkspace from "../../chat/AuraImmersiveWorkspace";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const BG   = "#0a0906";
const CARD = "#0f0e0b";
const CARD_H = "#161410";
const WHITE  = "#f5f0e8";
const MUTED  = "rgba(245,240,232,0.60)";
const GOLD   = "#C9A84C";
const GOLD_D = "rgba(201,168,76,0.28)";

// ── Category icons (dark-stroke for overlay) ──────────────────────────────────
const CAT_ICONS = {
  "wedding-venues":   (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 21v-6h6v6"/></svg>,
  "wedding-planners": (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>,
  "photographers":    (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>,
  "videographers":    (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>,
  "florists":         (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22c0 0 0-3 0-6"/><path d="M9 18c-2 0-4-1.5-4-4 0-2 2-3.5 4-3.5.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5c2 0 4 1.5 4 3.5 0 2.5-2 4-4 4"/><path d="M12 8c0-2 1-4 3-5"/><path d="M12 8c0-2-1-4-3-5"/></svg>,
  "caterers":         (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8h1a4 4 0 010 8h-1"/><path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z"/><line x1="6" y1="1" x2="6" y2="4"/><line x1="10" y1="1" x2="10" y2="4"/><line x1="14" y1="1" x2="14" y2="4"/></svg>,
  "wedding-cakes":    (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z"/><path d="M6 14h12v4H6z"/><path d="M8 10h8v4H8z"/><path d="M12 3v3"/><circle cx="12" cy="2" r="1"/></svg>,
  "hair-makeup":      (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="5"/><path d="M12 13v8"/><path d="M9 18h6"/></svg>,
  "entertainment":    (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>,
  "stationery":       (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
  "bridal-wear":      (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2C9 2 7 5 7 8c0 2 1 3 2 4l-3 10h12l-3-10c1-1 2-2 2-4 0-3-2-6-5-6z"/><path d="M9 22h6"/></svg>,
  "jewellers":        (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="14" r="6"/><path d="M12 8V2"/><path d="M8 10l-3-5"/><path d="M16 10l3-5"/></svg>,
  "transport":        (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 17h14v-5H5v5z"/><path d="M2 12h20"/><path d="M5 12V7c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>,
  "event-design":     (c) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
};

const CATS_PER_ROW = 7;

// ── Editorial curation ────────────────────────────────────────────────────────
// These slugs reference GEO_COUNTRIES — not hardcoded data, just which
// destinations appear as featured tiles.
const FEATURED_SLUGS = [
  "italy", "france", "greece", "spain", "england",
  "portugal", "croatia", "scotland", "usa",
];

// ── Destination tile images ────────────────────────────────────────────────────
const TILE_IMAGES = {
  "italy":    "https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=800&q=80",
  "france":   "https://images.unsplash.com/photo-1499856871958-5b9627545d1a?auto=format&fit=crop&w=800&q=80",
  "greece":   "https://images.unsplash.com/photo-1533105079780-92b9be482077?auto=format&fit=crop&w=800&q=80",
  "spain":    "https://images.unsplash.com/photo-1543785734-4b6e564642f8?auto=format&fit=crop&w=800&q=80",
  "england":  "https://images.unsplash.com/photo-1529655683826-aba9b3e77383?auto=format&fit=crop&w=800&q=80",
  "portugal": "https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=800&q=80",
  "croatia":  "https://images.unsplash.com/photo-1555990793-da11153b2473?auto=format&fit=crop&w=800&q=80",
  "scotland": "https://images.unsplash.com/photo-1506377585622-bedcbb027afc?auto=format&fit=crop&w=800&q=80",
  "usa":      "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80",
};

const CATEGORIES = [
  {
    id: "venues", label: "Venues", slug: "wedding-venues",
    tagline: "The spaces that define the day",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "planners", label: "Planners", slug: "wedding-planners",
    tagline: "Vision, craft, and calm authority",
    img: "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "photographers", label: "Photographers", slug: "photographers",
    tagline: "Light, feeling, and memory",
    img: "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "videographers", label: "Videographers", slug: "videographers",
    tagline: "Motion, music, and emotion",
    img: "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "florists", label: "Florists", slug: "florists",
    tagline: "Bloom, colour, and scent",
    img: "https://images.unsplash.com/photo-1487530811015-780e12b74c63?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "caterers", label: "Caterers", slug: "caterers",
    tagline: "Cuisine that becomes memory",
    img: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "cakes", label: "Wedding Cakes", slug: "wedding-cakes",
    tagline: "The centrepiece of sweetness",
    img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=900&q=80",
  },
  {
    id: "hair-makeup", label: "Hair & Makeup", slug: "hair-makeup",
    tagline: "Confidence for your moment",
    img: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=900&q=80",
  },
];

// ── Category-specific refinement options ──────────────────────────────────────
const REFINEMENT_CONFIG = {
  "venues": [
    { label: "Style",   key: "style",   options: ["Romantic","Historic","Rustic Luxe","Coastal","Vineyard","Intimate","Modern"] },
    { label: "Guests",  key: "guests",  options: ["Just us","Up to 50","50–100","100–200","200+"] },
    { label: "Setting", key: "setting", options: ["Indoor","Outdoor","Both"] },
    { label: "Budget",  key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
  "planners": [
    { label: "Service",  key: "style",   options: ["Full Planning","Partial Planning","Day-of Coordination","Destination Wedding"] },
    { label: "Style",    key: "setting", options: ["Luxury","Intimate","Modern","Cultural","Outdoor"] },
    { label: "Guests",   key: "guests",  options: ["Up to 50","50–100","100–200","200+"] },
    { label: "Budget",   key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
  "photographers": [
    { label: "Style",    key: "style",   options: ["Documentary","Fine Art","Editorial","Romantic","Dark & Moody","Bright & Airy"] },
    { label: "Coverage", key: "guests",  options: ["Ceremony Only","Half Day","Full Day","Multi-Day"] },
    { label: "Format",   key: "setting", options: ["Photos Only","Film Only","Photos + Film"] },
    { label: "Budget",   key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
  "videographers": [
    { label: "Style",    key: "style",   options: ["Cinematic","Documentary","Short Film","Drone Focus","Editorial"] },
    { label: "Coverage", key: "guests",  options: ["Ceremony Only","Half Day","Full Day","Multi-Day"] },
    { label: "Delivery", key: "setting", options: ["Highlight Reel","Feature Film","Social Reels","All Formats"] },
    { label: "Budget",   key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
  "florists": [
    { label: "Style",  key: "style",   options: ["Garden & Wild","Opulent","Minimalist","Tropical","Classic White","Boho"] },
    { label: "Scope",  key: "setting", options: ["Bridal Bouquet","Ceremony","Reception","Full Venue"] },
    { label: "Season", key: "guests",  options: ["Spring","Summer","Autumn","Winter","Any Season"] },
    { label: "Budget", key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
  "caterers": [
    { label: "Style",    key: "style",   options: ["Plated","Buffet","Family Style","Cocktail","BBQ"] },
    { label: "Dietary",  key: "setting", options: ["Standard","Vegetarian","Vegan","Mixed","Kosher / Halal"] },
    { label: "Guests",   key: "guests",  options: ["Up to 50","50–100","100–200","200+"] },
    { label: "Budget",   key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
  "wedding-cakes": [
    { label: "Style",     key: "style",   options: ["Classic Tiered","Naked","Floral","Sculpted","Modern","Minimalist"] },
    { label: "Flavour",   key: "setting", options: ["Traditional","Chocolate","Lemon","Floral","Fruit","Surprise Me"] },
    { label: "Servings",  key: "guests",  options: ["Up to 50","50–100","100–200","200+"] },
    { label: "Dietary",   key: "budget",  options: ["Standard","Gluten-Free","Vegan","Mixed"] },
  ],
  "hair-makeup": [
    { label: "Look",     key: "style",   options: ["Natural","Glamorous","Editorial","Vintage","Dewy","Bold Lip"] },
    { label: "Service",  key: "setting", options: ["Bride Only","Bridal Party","Both","Plus Trial"] },
    { label: "On the Day", key: "guests", options: ["Morning Only","Full Day","Touch-ups Included"] },
    { label: "Budget",   key: "budget",  options: ["Flexible","Mid-range £££","Luxury ££££"] },
  ],
};

// ── Suggestion builder ────────────────────────────────────────────────────────
function buildSuggestions(q, liveCountries) {
  if (!q) return [];
  const out = [];
  const seen = new Set();

  const push = (label, countrySlug, regionSlug) => {
    if (!seen.has(label)) { seen.add(label); out.push({ label, countrySlug, regionSlug }); }
  };

  // Live countries first
  liveCountries?.forEach((c) => {
    if (c.label.toLowerCase().includes(q)) push(c.label, c.slug, null);
  });

  // Regions/cities from static geo data
  STATIC_LOCATIONS.forEach((group) => {
    group.items?.forEach((loc) => {
      const cSlug = GEO_COUNTRIES.find((c) => c.name === loc.country)?.slug || null;
      loc.cities?.forEach((city) => {
        if (city.toLowerCase().includes(q)) {
          const rSlug = getRegionSlugByName(city);
          push(`${city}, ${loc.country}`, cSlug, rSlug !== "all" ? rSlug : null);
        }
      });
      if (loc.country.toLowerCase().includes(q) && cSlug) {
        push(loc.country, cSlug, null);
      }
    });
  });

  return out.slice(0, 8);
}

// ═════════════════════════════════════════════════════════════════════════════
export default function ImmersiveSearch({
  isOpen,
  onClose,
  onViewRegionCategory,
  onViewRegion,
  onViewCategory,
}) {
  const [mounted,       setMounted]       = useState(false); // controls CSS opacity
  const [step,          setStep]          = useState(0);     // 0 = location, 1 = category
  const [stepIn,        setStepIn]        = useState(true);  // step transition visibility
  const [location,      setLocation]      = useState(null);  // { label, countrySlug, regionSlug }
  const [query,         setQuery]         = useState("");
  const [suggestions,   setSuggestions]   = useState([]);
  const [liveCountries, setLiveCountries] = useState(null);
  const [hovTile,       setHovTile]       = useState(null);
  const [hovCat,        setHovCat]        = useState(null);
  const [suggOpen,      setSuggOpen]      = useState(false);
  const [inputFocused,  setInputFocused]  = useState(false);
  const [exitingCat,    setExitingCat]    = useState(null);
  const [auraMode,      setAuraMode]      = useState(false);
  const [auraQuery,     setAuraQuery]     = useState("");
  const [auraFocused,   setAuraFocused]   = useState(false);
  const [auraChatOpen,  setAuraChatOpen]  = useState(false);
  const [auraChatQuery, setAuraChatQuery] = useState("");

  // Step 2 — refinement
  const [pendingCat,    setPendingCat]    = useState(null); // category chosen in step 1
  const [refStyle,      setRefStyle]      = useState(null);
  const [refGuests,     setRefGuests]     = useState(null);
  const [refSetting,    setRefSetting]    = useState(null);
  const [refBudget,     setRefBudget]     = useState(null);
  const [transitioning, setTransitioning] = useState(false);
  const auraInputRef = useRef(null);
  const inputRef = useRef(null);

  // Featured destination tiles from geo data
  const featuredTiles = FEATURED_SLUGS
    .map((s) => GEO_COUNTRIES.find((c) => c.slug === s))
    .filter(Boolean);

  // ── Open / close lifecycle ────────────────────────────────────────────────
  useEffect(() => {
    if (isOpen) {
      setStep(0);
      setStepIn(true);
      setLocation(null);
      setQuery("");
      setSuggestions([]);
      setAuraMode(false);
      setAuraQuery("");
      setPendingCat(null);
      setRefStyle(null);
      setRefGuests(null);
      setRefSetting(null);
      setRefBudget(null);
      const t = setTimeout(() => setMounted(true), 16);
      return () => clearTimeout(t);
    } else {
      setMounted(false);
    }
  }, [isOpen]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [isOpen]);

  // Auto-focus input when on location step
  useEffect(() => {
    if (isOpen && mounted && step === 0 && !auraMode) {
      const t = setTimeout(() => inputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted, step, auraMode]);

  // Auto-focus Aura input when aura mode activates
  useEffect(() => {
    if (auraMode) {
      const t = setTimeout(() => auraInputRef.current?.focus(), 320);
      return () => clearTimeout(t);
    }
  }, [auraMode]);


  // ESC to close
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") handleClose(); };
    if (isOpen) window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen]); // eslint-disable-line

  // ── Live locations from Supabase ─────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !supabase || liveCountries) return;
    supabase
      .from("listings")
      .select("country, country_slug")
      .eq("status", "published")
      .then(({ data }) => {
        if (!data?.length) return;
        const seen = new Set();
        const out  = [];
        const cap  = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");
        data.forEach((r) => {
          const key = (r.country_slug || r.country || "").toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            out.push({ label: cap(r.country || r.country_slug), slug: r.country_slug || key });
          }
        });
        setLiveCountries(out.sort((a, b) => a.label.localeCompare(b.label)));
      })
      .catch(() => {}); // silent — falls back to STATIC_LOCATIONS
  }, [isOpen]); // eslint-disable-line

  // ── Suggestion matching ───────────────────────────────────────────────────
  useEffect(() => {
    const q = query.toLowerCase().trim();
    const results = buildSuggestions(q, liveCountries);
    setSuggestions(results);
    setSuggOpen(results.length > 0 && q.length > 0);
  }, [query, liveCountries]);

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setMounted(false);
    setTimeout(() => {
      onClose?.();
      setStep(0);
      setLocation(null);
      setQuery("");
    }, 460);
  }, [onClose]);

  const goToCategory = useCallback((loc) => {
    setLocation(loc || null);
    // Step-out animation then switch
    setStepIn(false);
    setTimeout(() => {
      setStep(1);
      setStepIn(true);
    }, 320);
  }, []);

  const goBackToLocation = useCallback(() => {
    setStepIn(false);
    setTimeout(() => {
      setStep(0);
      setStepIn(true);
      setLocation(null);
      setQuery("");
    }, 320);
  }, []);

  const openAuraMode = useCallback(() => {
    setStepIn(false);
    setTimeout(() => { setAuraMode(true); setStepIn(true); }, 320);
  }, []);

  const handleAuraSubmit = useCallback(() => {
    if (!auraQuery.trim()) return;
    const q = auraQuery.trim();
    setAuraChatQuery(q);
    setAuraChatOpen(true);
  }, [auraQuery]);

  const handleAuraChatClose = useCallback(() => {
    setAuraChatOpen(false);
    setAuraChatQuery("");
    // Return to the aura describe step
    setAuraMode(true);
    setMounted(true);
  }, []);

  const handleTileSelect    = (tile) => goToCategory({ label: tile.name, countrySlug: tile.slug, regionSlug: null });
  const handleSkipLocation  = ()     => goToCategory(null);
  const handleSuggSelect    = (sug)  => { setQuery(""); setSuggOpen(false); goToCategory(sug); };

  const handleIconCatSelect = useCallback((vc) => {
    const countrySlug = location?.countrySlug || null;
    const regionSlug  = location?.regionSlug  || null;
    handleClose();
    setTimeout(() => {
      if (countrySlug && regionSlug) {
        onViewRegionCategory?.(countrySlug, regionSlug, vc.slug);
      } else if (countrySlug) {
        onViewRegionCategory?.(countrySlug, null, vc.slug);
      } else {
        onViewCategory?.({ category: vc.slug });
      }
    }, 500);
  }, [location, handleClose, onViewRegionCategory, onViewCategory]);

  const handleCategorySelect = useCallback((cat) => {
    // Phase 1: card lifts + others fade
    setExitingCat(cat.id);
    // Phase 2: transition to step 2
    setTimeout(() => {
      setPendingCat(cat);
      setExitingCat(null);
      setStepIn(false);
      setTimeout(() => { setStep(2); setStepIn(true); }, 320);
    }, 420);
  }, []);

  const handleStep2Navigate = useCallback(() => {
    if (!pendingCat) return;
    const catSlug     = pendingCat.slug;
    const countrySlug = location?.countrySlug || null;
    const regionSlug  = location?.regionSlug  || null;

    // Store refinements so the results page can pre-apply them
    const refinement = {
      style:   refStyle   || null,
      guests:  refGuests  || null,
      setting: refSetting || null,
      budget:  refBudget  || null,
    };
    if (Object.values(refinement).some(Boolean)) {
      sessionStorage.setItem("lwd:immersive-refinement", JSON.stringify(refinement));
    } else {
      sessionStorage.removeItem("lwd:immersive-refinement");
    }

    // ── Transition frame: hold for 6000ms then melt away (outer opacity fade = 0.45s)
    setTransitioning(true);
    setTimeout(() => {
      setMounted(false); // triggers the 0.45s ease fade on the whole overlay
      setTimeout(() => {
        setTransitioning(false);
        onClose?.();
        setStep(0);
        setLocation(null);
        setQuery("");
        setPendingCat(null);
        setRefStyle(null); setRefGuests(null); setRefSetting(null); setRefBudget(null);
        if (countrySlug && regionSlug && catSlug) {
          onViewRegionCategory?.(countrySlug, regionSlug, catSlug);
        } else if (countrySlug && catSlug) {
          onViewRegionCategory?.(countrySlug, null, catSlug);
        } else {
          onViewCategory?.();
        }
      }, 500); // wait for the 0.45s fade to finish
    }, 6000);
  }, [pendingCat, location, refStyle, refGuests, refSetting, refBudget, onClose, onViewRegionCategory, onViewCategory]);

  // ── Don't mount at all when closed ───────────────────────────────────────
  if (!isOpen) return null;

  // ── Shared step transition style ─────────────────────────────────────────
  const stepTransition = {
    opacity:       stepIn ? 1 : 0,
    transform:     stepIn ? "translateY(0)" : "translateY(28px)",
    transition:    "opacity 0.4s ease, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)",
    flex:          1,
    display:       "flex",
    flexDirection: "column",
    padding:       "0 clamp(24px, 5vw, 72px) 72px",
    maxWidth:      1100,
    width:         "100%",
    margin:        "0 auto",
    boxSizing:     "border-box",
    position:      "relative",
    zIndex:        1,
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Immersive search"
      style={{
        position:      "fixed",
        inset:         0,
        zIndex:        10000,
        background:    BG,
        display:       "flex",
        flexDirection: "column",
        overflowY:     "auto",
        opacity:       mounted ? 1 : 0,
        transition:    "opacity 0.45s ease",
      }}
    >
      {/* ── Cinematic background motion ──────────────────────────────────── */}
      <style>{`
        @keyframes lwd-bg-drift {
          0%   { transform: translate(0%,    0%)    scale(1.12); }
          33%  { transform: translate(-2%,   1.5%)  scale(1.12); }
          66%  { transform: translate(1.5%,  -1%)   scale(1.12); }
          100% { transform: translate(0%,    0%)    scale(1.12); }
        }
        @keyframes lwd-curating-in {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes lwd-curating-pulse {
          0%, 100% { opacity: 0.45; transform: scale(0.88); }
          50%      { opacity: 1;    transform: scale(1.12); }
        }
      `}</style>

      {/* ── Aura transition frame ─────────────────────────────────────────── */}
      {transitioning && (
        <div style={{
          position:       "absolute",
          inset:          0,
          zIndex:         20,
          background:     BG,
          display:        "flex",
          flexDirection:  "column",
          alignItems:     "center",
          justifyContent: "center",
          gap:            0,
          animation:      "lwd-curating-in 0.35s cubic-bezier(0.16,1,0.3,1) both",
        }}>
          <span style={{
            display:   "block",
            color:     GOLD,
            fontSize:  22,
            animation: "lwd-curating-pulse 1.4s ease-in-out infinite",
            marginBottom: 28,
          }}>✦</span>
          <h2 style={{
            fontFamily:    GD,
            fontWeight:    300,
            fontSize:      "clamp(26px, 3.5vw, 44px)",
            color:         WHITE,
            margin:        0,
            letterSpacing: "-0.02em",
            textAlign:     "center",
            lineHeight:    1.1,
          }}>
            Aura is curating your results
          </h2>
          <p style={{
            fontFamily:    NU,
            fontSize:      12,
            color:         MUTED,
            margin:        "16px 0 0",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            textAlign:     "center",
          }}>
            Finding {pendingCat?.label?.toLowerCase() || "results"} aligned with your vision
          </p>
        </div>
      )}
      <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
        <div style={{
          position:   "absolute",
          inset:      "-12%",
          background: [
            "radial-gradient(ellipse 72% 58% at 20% 30%, rgba(62,36,6,0.72) 0%, transparent 62%)",
            "radial-gradient(ellipse 58% 48% at 82% 28%, rgba(52,30,5,0.55) 0%, transparent 56%)",
            "radial-gradient(ellipse 50% 42% at 85% 72%, rgba(42,24,4,0.5)  0%, transparent 58%)",
            "radial-gradient(ellipse 40% 35% at 50% 52%, rgba(22,13,3,0.3)  0%, transparent 54%)",
          ].join(", "),
          animation:  "lwd-bg-drift 22s ease-in-out infinite",
        }} />
      </div>

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <div style={{
        display:         "flex",
        alignItems:      "center",
        justifyContent:  "space-between",
        padding:         "28px clamp(24px, 5vw, 72px)",
        flexShrink:      0,
        position:        "relative",
        zIndex:          1,
      }}>
        {step === 1 ? (
          <button
            onClick={goBackToLocation}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(245,240,232,0.38)", fontFamily: NU, fontSize: 11,
              letterSpacing: "0.14em", textTransform: "uppercase",
              display: "flex", alignItems: "center",
              gap: 10, padding: "6px 0", transition: "color 0.25s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.38)")}
          >
            <span style={{ fontSize: 13, letterSpacing: 0, opacity: 0.7 }}>←</span>
            {location?.label ?? "Back"}
          </button>
        ) : (
          <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.2em", color: "rgba(245,240,232,0.18)", textTransform: "uppercase" }}>
            Luxury Wedding Directory
          </span>
        )}

        <button
          onClick={handleClose}
          aria-label="Close immersive search"
          style={{
            background: "none",
            border: "1px solid rgba(245,240,232,0.1)",
            borderRadius: 2,
            cursor: "pointer",
            color: "rgba(245,240,232,0.38)",
            fontSize: 18,
            lineHeight: 1,
            padding: "7px 12px",
            letterSpacing: "0.04em",
            fontFamily: NU,
            transition: "color 0.25s ease, border-color 0.25s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = WHITE; e.currentTarget.style.borderColor = "rgba(245,240,232,0.28)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.38)"; e.currentTarget.style.borderColor = "rgba(245,240,232,0.1)"; }}
        >
          ×
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 0 — LOCATION
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 0 && !auraMode && (
        <div style={stepTransition}>

          {/* Heading */}
          <div style={{ marginBottom: 52 }}>
            <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.22em", color: GOLD, textTransform: "uppercase", margin: "0 0 18px" }}>
              Step 1 of 3
            </p>
            <h1 style={{
              fontFamily: GD, fontWeight: 400, margin: 0, color: WHITE,
              fontSize: "clamp(40px, 6.5vw, 82px)",
              lineHeight: 1.04, letterSpacing: "-0.025em",
            }}>
              Where are you<br />dreaming of?
            </h1>
            <p style={{ fontFamily: NU, fontSize: 15, color: MUTED, margin: "18px 0 0" }}>
              Choose a destination or type below
            </p>
          </div>

          {/* Featured destination tiles */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 44 }}>
            {featuredTiles.map((tile) => {
              const hov = hovTile === tile.slug;
              const img = TILE_IMAGES[tile.slug];
              return (
                <button
                  key={tile.slug}
                  onClick={() => handleTileSelect(tile)}
                  onMouseEnter={() => setHovTile(tile.slug)}
                  onMouseLeave={() => setHovTile(null)}
                  style={{
                    position:     "relative",
                    overflow:     "hidden",
                    background:   CARD,
                    border:       `1px solid ${hov ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.06)"}`,
                    borderRadius: 2,
                    padding:      "16px 26px",
                    cursor:       "pointer",
                    transition:   "border-color 0.35s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1), box-shadow 0.35s ease",
                    transform:    hov ? "translateY(-4px) scale(1.02)" : "translateY(0) scale(1)",
                    boxShadow:    hov ? "0 12px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(201,168,76,0.12)" : "none",
                    display:      "flex",
                    alignItems:   "center",
                    gap:          10,
                  }}
                >
                  {/* Image layer */}
                  {img && (
                    <div style={{
                      position:           "absolute",
                      inset:              0,
                      backgroundImage:    `url(${img})`,
                      backgroundSize:     "cover",
                      backgroundPosition: "center",
                      opacity:            hov ? 1 : 0,
                      transform:          hov ? "scale(1)" : "scale(1.08)",
                      transition:         "opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)",
                    }} />
                  )}
                  {/* Overlay */}
                  <div style={{
                    position:   "absolute",
                    inset:      0,
                    background: hov
                      ? "linear-gradient(135deg, rgba(0,0,0,0.68) 0%, rgba(0,0,0,0.52) 100%)"
                      : "linear-gradient(135deg, rgba(10,9,6,0.95) 0%, rgba(10,9,6,0.88) 100%)",
                    transition: "background 0.4s ease",
                  }} />
                  {/* Content */}
                  <span style={{ position: "relative", zIndex: 1, fontFamily: GD, fontSize: 20, color: WHITE, fontWeight: 400, letterSpacing: "0.01em" }}>
                    {tile.name}
                  </span>
                  <span style={{ position: "relative", zIndex: 1, color: hov ? GOLD : "rgba(201,168,76,0.3)", fontSize: 14, transition: "color 0.25s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)", transform: hov ? "translateX(3px)" : "none", display: "inline-block" }}>→</span>
                </button>
              );
            })}
          </div>

          {/* Search input + suggestions */}
          <div style={{ position: "relative", maxWidth: 520, marginBottom: 28 }}>
            <div style={{
              display:      "flex",
              alignItems:   "center",
              background:   CARD,
              border:       `1px solid ${inputFocused ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 2,
              boxShadow:    inputFocused
                ? "0 0 0 3px rgba(201,168,76,0.07), 0 8px 32px rgba(0,0,0,0.45)"
                : "0 2px 16px rgba(0,0,0,0.3)",
              transition:   "border-color 0.3s ease, box-shadow 0.35s ease",
            }}>
              <span style={{ paddingLeft: 20, color: inputFocused ? GOLD : MUTED, fontSize: 15, flexShrink: 0, transition: "color 0.3s ease" }}>⌕</span>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => setInputFocused(true)}
                onBlur={() => setInputFocused(false)}
                placeholder="Type a country or city…"
                style={{
                  flex:          1,
                  background:    "none",
                  border:        "none",
                  outline:       "none",
                  padding:       "18px 20px",
                  color:         WHITE,
                  fontFamily:    NU,
                  fontSize:      16,
                  letterSpacing: "0.015em",
                  caretColor:    GOLD,
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && suggestions.length > 0) handleSuggSelect(suggestions[0]);
                }}
              />
              {query && (
                <button
                  onClick={() => { setQuery(""); setSuggOpen(false); inputRef.current?.focus(); }}
                  style={{ background: "none", border: "none", cursor: "pointer", color: MUTED, padding: "0 16px", fontSize: 18, lineHeight: 1 }}
                >×</button>
              )}
            </div>

            {/* Dropdown suggestions */}
            {suggOpen && (
              <div style={{
                position:   "absolute",
                top:        "calc(100% + 4px)",
                left:       0, right:   0,
                background: "#161410",
                border:     `1px solid ${GOLD_D}`,
                borderRadius: 2,
                overflow:   "hidden",
                zIndex:     100,
                boxShadow:  "0 16px 48px rgba(0,0,0,0.6)",
              }}>
                {suggestions.map((s, i) => (
                  <button
                    key={i}
                    onMouseDown={() => handleSuggSelect(s)}
                    style={{
                      display:       "block",
                      width:         "100%",
                      textAlign:     "left",
                      background:    "none",
                      border:        "none",
                      borderBottom:  i < suggestions.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      padding:       "13px 20px",
                      color:         WHITE,
                      fontFamily:    NU,
                      fontSize:      14,
                      cursor:        "pointer",
                      letterSpacing: "0.01em",
                      transition:    "background 0.15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = CARD_H)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Skip */}
          <button
            onClick={handleSkipLocation}
            style={{
              background:      "none",
              border:          "none",
              cursor:          "pointer",
              color:           MUTED,
              fontFamily:      NU,
              fontSize:        13,
              letterSpacing:   "0.06em",
              padding:         0,
              textDecoration:  "underline",
              textDecorationColor: "rgba(245,240,232,0.18)",
              transition:      "color 0.2s",
              alignSelf:       "flex-start",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = MUTED)}
          >
            Explore all destinations →
          </button>

          {/* Ask Aura — Step 1 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 28 }}>
            <div style={{ width: 20, height: 1, background: "rgba(245,240,232,0.1)" }} />
            <span style={{ fontFamily: NU, fontSize: 12, color: "rgba(245,240,232,0.28)", letterSpacing: "0.04em" }}>or</span>
            <div style={{ width: 20, height: 1, background: "rgba(245,240,232,0.1)" }} />
            <button
              onClick={openAuraMode}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: 0,
                fontFamily: NU, fontSize: 12, letterSpacing: "0.08em",
                color: "rgba(201,168,76,0.5)", transition: "color 0.25s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(201,168,76,0.5)")}
            >
              Not sure? Ask Aura →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 1 — CATEGORY
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 1 && !auraMode && (
        <div style={stepTransition}>

          {/* Heading */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.22em", color: GOLD, textTransform: "uppercase", margin: "0 0 18px" }}>
              Step 2 of 3
            </p>
            <h1 style={{
              fontFamily: GD, fontWeight: 400, margin: 0, color: WHITE,
              fontSize: "clamp(40px, 6.5vw, 82px)",
              lineHeight: 1.04, letterSpacing: "-0.025em",
            }}>
              What are you<br />planning?
            </h1>
          </div>

          {/* Grid header row — location label right-aligned */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", maxWidth: 920, marginBottom: 10 }}>
            {location ? (
              <p style={{ fontFamily: NU, fontSize: 11, color: GOLD, margin: 0, letterSpacing: "0.12em", textTransform: "uppercase" }}>
                ✦ {location.label}
              </p>
            ) : (
              <p style={{ fontFamily: NU, fontSize: 11, color: MUTED, margin: 0, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                All destinations
              </p>
            )}
          </div>

          {/* Category cards */}
          <div style={{
            display:             "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap:                 12,
            maxWidth:            920,
          }}>
            {CATEGORIES.map((cat) => {
              const hov      = hovCat === cat.id;
              const isExiting = exitingCat === cat.id;
              const otherExiting = exitingCat && exitingCat !== cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategorySelect(cat)}
                  onMouseEnter={() => !exitingCat && setHovCat(cat.id)}
                  onMouseLeave={() => !exitingCat && setHovCat(null)}
                  style={{
                    position:     "relative",
                    overflow:     "hidden",
                    background:   CARD,
                    border:       `1px solid ${isExiting ? "rgba(201,168,76,0.6)" : hov ? "rgba(201,168,76,0.45)" : "rgba(255,255,255,0.07)"}`,
                    borderRadius: 2,
                    padding:      "36px 28px",
                    cursor:       exitingCat ? "default" : "pointer",
                    textAlign:    "left",
                    transition:   isExiting
                      ? "transform 0.42s cubic-bezier(0.16,1,0.3,1), box-shadow 0.42s ease, opacity 0.3s ease"
                      : "border-color 0.4s ease, transform 0.45s cubic-bezier(0.16,1,0.3,1), box-shadow 0.4s ease, opacity 0.3s ease",
                    transform:    isExiting
                      ? "translateY(-10px) scale(1.04)"
                      : otherExiting ? "scale(0.97)"
                      : hov ? "translateY(-6px) scale(1.015)"
                      : "translateY(0) scale(1)",
                    opacity:      otherExiting ? 0.35 : 1,
                    boxShadow:    isExiting
                      ? "0 40px 100px rgba(0,0,0,0.85), 0 0 0 1px rgba(201,168,76,0.25)"
                      : hov ? "0 28px 72px rgba(0,0,0,0.7), 0 0 0 1px rgba(201,168,76,0.15)"
                      : "inset 0 1px 0 rgba(255,255,255,0.03)",
                    minHeight:    180,
                  }}
                >
                  {/* Immersive image layer */}
                  <div style={{
                    position:           "absolute",
                    inset:              0,
                    backgroundImage:    `url(${cat.img})`,
                    backgroundSize:     "cover",
                    backgroundPosition: "center",
                    opacity:            (hov || isExiting) ? 1 : 0,
                    transform:          (hov || isExiting) ? "scale(1)" : "scale(1.06)",
                    transition:         "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)",
                  }} />
                  {/* Dark gradient overlay */}
                  <div style={{
                    position:   "absolute",
                    inset:      0,
                    background: isExiting
                      ? "linear-gradient(160deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.42) 100%)"
                      : hov
                      ? "linear-gradient(160deg, rgba(0,0,0,0.74) 0%, rgba(0,0,0,0.62) 100%)"
                      : "linear-gradient(160deg, rgba(10,9,6,0.96) 0%, rgba(10,9,6,0.9) 100%)",
                    transition: "background 0.45s ease",
                  }} />
                  {/* Content — sits above image layers */}
                  <div style={{ position: "relative", zIndex: 1 }}>
                    <div style={{ fontFamily: GD, fontSize: "clamp(26px, 2.8vw, 34px)", color: WHITE, fontWeight: 400, marginBottom: 12, lineHeight: 1.1, letterSpacing: "-0.01em" }}>
                      {cat.label}
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 13, color: hov ? "rgba(245,240,232,0.75)" : MUTED, letterSpacing: "0.02em", lineHeight: 1.5, transition: "color 0.3s ease" }}>
                      {cat.tagline}
                    </div>
                    <div style={{
                      marginTop:     22,
                      display:       "inline-flex",
                      alignItems:    "center",
                      gap:           6,
                      color:         hov ? GOLD : "rgba(201,168,76,0.35)",
                      fontFamily:    NU,
                      fontSize:      11,
                      letterSpacing: "0.12em",
                      textTransform: "uppercase",
                      transition:    "color 0.35s ease, transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s ease",
                      transform:     hov ? "translateX(6px)" : "translateX(0)",
                      opacity:       hov ? 1 : 0.6,
                    }}>
                      <span style={{ fontSize: 16, lineHeight: 1 }}>→</span>
                      {hov && <span>Explore</span>}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Ask Aura — Step 2 */}
          <button
            onClick={openAuraMode}
            style={{
              alignSelf:     "flex-end",
              background:    "none",
              border:        "none",
              cursor:        "pointer",
              padding:       "12px 0 0",
              fontFamily:    NU,
              fontSize:      11,
              letterSpacing: "0.1em",
              color:         "rgba(201,168,76,0.38)",
              transition:    "color 0.25s ease",
              maxWidth:      920,
              width:         "100%",
              textAlign:     "right",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(201,168,76,0.38)")}
          >
            Prefer to describe it? Ask Aura →
          </button>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          STEP 2 — REFINEMENT
      ═══════════════════════════════════════════════════════════════════ */}
      {step === 2 && !auraMode && (
        <div style={stepTransition}>

          {/* Back */}
          <button
            onClick={() => { setStepIn(false); setTimeout(() => { setStep(1); setStepIn(true); setPendingCat(null); }, 320); }}
            style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(245,240,232,0.35)", fontFamily:NU, fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", display:"flex", alignItems:"center", gap:10, padding:"0 0 40px", transition:"color 0.25s ease" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
          >
            <span style={{ fontSize:13, opacity:0.7 }}>←</span> Back
          </button>

          {/* Heading */}
          <div style={{ marginBottom: 44 }}>
            <p style={{ fontFamily:NU, fontSize:10, letterSpacing:"0.22em", color:GOLD, textTransform:"uppercase", margin:"0 0 18px" }}>
              Step 3 of 3
            </p>
            <h1 style={{ fontFamily:GD, fontWeight:400, margin:0, color:WHITE, fontSize:"clamp(36px, 5.5vw, 72px)", lineHeight:1.05, letterSpacing:"-0.025em" }}>
              Your perfect<br /><em style={{ fontStyle:"italic", color: GOLD }}>{pendingCat?.label || "wedding"}</em>
            </h1>
            <p style={{ fontFamily:NU, fontSize:15, color:"rgba(245,240,232,0.68)", margin:"16px 0 0", fontWeight:300, letterSpacing:"0.01em" }}>
              All optional — skip anything that doesn't apply.
            </p>
          </div>

          {/* Refinement rows — dynamic per category */}
          <div style={{ display:"flex", flexDirection:"column", gap:28, maxWidth:760 }}>
            {(REFINEMENT_CONFIG[pendingCat?.id] || REFINEMENT_CONFIG["venues"]).map((row) => {
              const stateMap = { style: refStyle, guests: refGuests, setting: refSetting, budget: refBudget };
              const setterMap = { style: setRefStyle, guests: setRefGuests, setting: setRefSetting, budget: setRefBudget };
              const val = stateMap[row.key];
              const set = setterMap[row.key];
              return (
              <div key={row.key} style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <span style={{ fontFamily:NU, fontSize:10, letterSpacing:"0.2em", color:"rgba(245,240,232,0.55)", textTransform:"uppercase" }}>
                  {row.label}
                </span>
                <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                  {row.options.map((opt) => {
                    const active = val === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => set(active ? null : opt)}
                        style={{
                          background:    active ? GOLD : "transparent",
                          border:        `1px solid ${active ? GOLD : "rgba(245,240,232,0.25)"}`,
                          borderRadius:  2,
                          padding:       "9px 18px",
                          color:         active ? "#0a0906" : "rgba(245,240,232,0.82)",
                          fontFamily:    NU,
                          fontSize:      13,
                          fontWeight:    active ? 600 : 400,
                          letterSpacing: "0.03em",
                          cursor:        "pointer",
                          transition:    "all 0.2s ease",
                        }}
                        onMouseEnter={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(201,168,76,0.5)"; e.currentTarget.style.color = WHITE; } }}
                        onMouseLeave={(e) => { if (!active) { e.currentTarget.style.borderColor = "rgba(245,240,232,0.25)"; e.currentTarget.style.color = "rgba(245,240,232,0.82)"; } }}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
            })}
          </div>

          {/* CTA row */}
          <div style={{ display:"flex", alignItems:"center", gap:28, marginTop:48 }}>
            <button
              onClick={handleStep2Navigate}
              style={{
                background:    GOLD,
                border:        "none",
                borderRadius:  2,
                padding:       "14px 36px",
                color:         "#0a0906",
                fontFamily:    NU,
                fontSize:      12,
                fontWeight:    700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                cursor:        "pointer",
                transition:    "opacity 0.2s ease",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
            >
              Show Results →
            </button>
            <button
              onClick={handleStep2Navigate}
              style={{ background:"none", border:"none", cursor:"pointer", color:"rgba(245,240,232,0.52)", fontFamily:NU, fontSize:12, letterSpacing:"0.1em", transition:"color 0.2s ease" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.85)")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.3)")}
            >
              Skip →
            </button>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          AURA MODE — lights-out concierge
      ═══════════════════════════════════════════════════════════════════ */}
      {auraMode && (
        <div style={{
          ...stepTransition,
          justifyContent: "center",
          alignItems:     "flex-start",
          paddingTop:     "clamp(40px, 8vh, 100px)",
        }}>
          {/* Back to steps */}
          <button
            onClick={() => { setStepIn(false); setTimeout(() => { setAuraMode(false); setStep(step); setStepIn(true); }, 320); }}
            style={{
              background: "none", border: "none", cursor: "pointer",
              color: "rgba(245,240,232,0.35)", fontFamily: NU, fontSize: 11,
              letterSpacing: "0.14em", textTransform: "uppercase",
              display: "flex", alignItems: "center", gap: 10,
              padding: "0 0 48px", transition: "color 0.25s ease",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = WHITE)}
            onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(245,240,232,0.35)")}
          >
            <span style={{ fontSize: 13, opacity: 0.7 }}>←</span> Back
          </button>

          {/* Aura wordmark */}
          <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", color: GOLD, textTransform: "uppercase", margin: "0 0 22px" }}>
            ✦ Aura
          </p>

          {/* Heading */}
          <h1 style={{
            fontFamily: GD, fontWeight: 400, margin: "0 0 14px", color: WHITE,
            fontSize: "clamp(36px, 5.5vw, 72px)",
            lineHeight: 1.06, letterSpacing: "-0.022em",
            maxWidth: 700,
          }}>
            Describe your<br />perfect wedding
          </h1>
          <p style={{ fontFamily: NU, fontSize: 14, color: MUTED, margin: "0 0 48px", letterSpacing: "0.02em" }}>
            Tell Aura what you're imagining — she'll find it.
          </p>

          {/* Luxury prompt input */}
          <div style={{ position: "relative", width: "100%", maxWidth: 680 }}>
            <textarea
              ref={auraInputRef}
              value={auraQuery}
              onChange={(e) => setAuraQuery(e.target.value)}
              onFocus={() => setAuraFocused(true)}
              onBlur={() => setAuraFocused(false)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAuraSubmit(); } }}
              placeholder="A villa in Tuscany for 80 guests in September, with a garden ceremony…"
              rows={3}
              style={{
                width:         "100%",
                boxSizing:     "border-box",
                background:    "rgba(15,14,11,0.6)",
                border:        `1px solid ${auraFocused ? "rgba(201,168,76,0.55)" : "rgba(255,255,255,0.1)"}`,
                borderRadius:  2,
                padding:       "22px 24px",
                color:         WHITE,
                fontFamily:    NU,
                fontSize:      16,
                lineHeight:    1.6,
                letterSpacing: "0.01em",
                caretColor:    GOLD,
                outline:       "none",
                resize:        "none",
                boxShadow:     auraFocused
                  ? "0 0 0 3px rgba(201,168,76,0.07), 0 8px 40px rgba(0,0,0,0.5)"
                  : "0 4px 24px rgba(0,0,0,0.35)",
                transition:    "border-color 0.3s ease, box-shadow 0.35s ease",
              }}
            />
            {/* Submit */}
            <button
              onClick={handleAuraSubmit}
              disabled={!auraQuery.trim()}
              style={{
                position:      "absolute",
                bottom:        16,
                right:         16,
                background:    auraQuery.trim() ? GOLD : "rgba(201,168,76,0.18)",
                border:        "none",
                borderRadius:  2,
                padding:       "10px 22px",
                cursor:        auraQuery.trim() ? "pointer" : "default",
                color:         auraQuery.trim() ? "#0a0906" : "rgba(201,168,76,0.4)",
                fontFamily:    NU,
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                transition:    "background 0.25s ease, color 0.25s ease",
              }}
            >
              Ask Aura →
            </button>
          </div>

          {/* Hint */}
          <p style={{ fontFamily: NU, fontSize: 11, color: "rgba(245,240,232,0.2)", margin: "16px 0 0", letterSpacing: "0.04em" }}>
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      )}


      {/* ── Subtle bottom progress line ───────────────────────────────────── */}
      <div style={{ position: "fixed", bottom: 0, left: 0, height: 2, background: GOLD_D, width: "100%", pointerEvents: "none" }}>
        <div style={{
          height:     "100%",
          background: GOLD,
          width:      step === 0 ? "50%" : "100%",
          transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
        }} />
      </div>

      {/* ── Aura Immersive Workspace (opens above this overlay) ──────────── */}
      {auraChatOpen && (
        <AuraImmersiveWorkspace
          initialQuery={auraChatQuery}
          onClose={handleAuraChatClose}
        />
      )}
    </div>
  );
}
