// ═══════════════════════════════════════════════════════════════════════════
// LiveStatsModule — Real-time visitor intelligence dashboard
// Admin only. Dark mode standard. Uses MapLibre GL + Supabase Realtime.
// Includes high-intent alert system: warm / hot / priority tiers.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "../../lib/supabaseClient";

// ── Audio synthesis (Web Audio API — no file dependency) ─────────────────────
// Luxury design principle: warm triangle/sine mix, low-mid frequencies,
// long natural decay — resonant bowl register, not notification bells.

function getAudioCtx(ref) {
  if (!ref.current) {
    try { ref.current = new (window.AudioContext || window.webkitAudioContext)(); }
    catch { return null; }
  }
  if (ref.current.state === "suspended") ref.current.resume();
  return ref.current;
}

// Single warm resonant note — crystal bowl / cello register
// Used for: visitor arrival + sound-on confirmation
function playVisitorSound(ctxRef) {
  const ctx = getAudioCtx(ctxRef);
  if (!ctx) return;
  const t = ctx.currentTime;

  // Primary tone — warm triangle wave, E4 register
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.connect(gain); gain.connect(ctx.destination);
  osc.type = "triangle";
  osc.frequency.setValueAtTime(330, t);
  gain.gain.setValueAtTime(0, t);
  gain.gain.linearRampToValueAtTime(0.055, t + 0.008); // near-instant attack
  gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4); // long natural decay
  osc.start(t); osc.stop(t + 1.5);

  // Octave harmonic — adds body without harshness
  const osc2  = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.connect(gain2); gain2.connect(ctx.destination);
  osc2.type = "sine";
  osc2.frequency.setValueAtTime(660, t);
  gain2.gain.setValueAtTime(0, t);
  gain2.gain.linearRampToValueAtTime(0.018, t + 0.008);
  gain2.gain.exponentialRampToValueAtTime(0.001, t + 0.9);
  osc2.start(t); osc2.stop(t + 1.0);
}

// Alert tones — harmonically resolved, warm, no sharp attack
// warm: gentle ascending two-note interval
// hot: three-note ascending phrase, slightly more present
// priority: two resonant notes with pause — unmistakable but still refined
function playAlertSound(ctxRef, tier) {
  const ctx = getAudioCtx(ctxRef);
  if (!ctx) return;
  const t = ctx.currentTime;

  const sequences = {
    warm:     [{ f: 277, v: 0.04 }, { f: 330, v: 0.05 }],           // C#4 → E4
    hot:      [{ f: 277, v: 0.05 }, { f: 330, v: 0.06 }, { f: 415, v: 0.07 }], // C#→E→G#4
    priority: [{ f: 330, v: 0.08 }, { f: 415, v: 0.10 }, null, { f: 330, v: 0.07 }, { f: 415, v: 0.09 }],
  };

  const seq = sequences[tier] || sequences.warm;
  let offset = 0;

  seq.forEach(note => {
    if (!note) { offset += 0.18; return; } // brief silence for priority
    const start = t + offset;
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = "triangle";
    osc.frequency.setValueAtTime(note.f, start);
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(note.v, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.65);
    osc.start(start); osc.stop(start + 0.7);
    offset += 0.28;
  });
}

// ── Constants ────────────────────────────────────────────────────────────────

const GOLD    = "#C9A84C";
const AMBER   = "#f59e0b";
const ORANGE  = "#f97316";
const RED     = "#ef4444";

const ACTIVE_MS   = 90_000;        // 90 seconds  = "active now"
const RECENT_MS   = 30 * 60_000;   // 30 minutes  = shown on map + list
const REFRESH_MS  = 30_000;        // poll interval (supplements Realtime)
const TICK_MS     = 10_000;        // re-render interval for live timers
const ALERT_TTL   = 60_000;        // dismiss alert toast after 60s

// ── Map style presets ─────────────────────────────────────────────────────────
// All free, no API key required. CARTO tiles via CDN.
// VITE_MAP_STYLE_URL env var overrides entirely (for MapTiler / Stadia premium).

const MAP_STYLES = [
  { key: "dark",      label: "Dark",     url: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" },
  { key: "midnight",  label: "Midnight", url: "https://basemaps.cartocdn.com/gl/dark-matter-nolabels-gl-style/style.json" },
  { key: "voyager",   label: "Light",    url: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json" },
  { key: "positron",  label: "Minimal",  url: "https://basemaps.cartocdn.com/gl/positron-nolabels-gl-style/style.json" },
];

function getMapStyle(key) {
  if (import.meta.env.VITE_MAP_STYLE_URL) return import.meta.env.VITE_MAP_STYLE_URL;
  return MAP_STYLES.find(s => s.key === key)?.url || MAP_STYLES[0].url;
}

// ── Intent event metadata ────────────────────────────────────────────────────

const INTENT_META = {
  shortlist_add:       { label: "Shortlisted venue",   color: "#f59e0b" },
  compare_add:         { label: "Added to compare",    color: "#8b5cf6" },
  enquiry_started:     { label: "Opened enquiry",      color: "#06b6d4" },
  enquiry_submitted:   { label: "Submitted enquiry",   color: "#10b981" },
  outbound_click:      { label: "Clicked outbound",    color: "#f87171" },
  aura_query:          { label: "Asked Aura",          color: GOLD      },
};

const INTENT_TYPES = Object.keys(INTENT_META);

// ── Column definitions (table view) ─────────────────────────────────────────

const COLS = [
  { key: "location",    label: "Location",        sortCol: "location",  minW: 100, defaultW: 160 },
  { key: "localTime",   label: "Local Time",       sortCol: "last_seen", minW: 55,  defaultW: 68  },
  { key: "duration",    label: "Duration",         sortCol: "duration",  minW: 55,  defaultW: 70  },
  { key: "isp",         label: "ISP",              sortCol: null,        minW: 80,  defaultW: 130 },
  { key: "hits",        label: "Hits",             sortCol: "hits",      minW: 36,  defaultW: 50  },
  { key: "currentPage", label: "Current Page",     sortCol: null,        minW: 100, defaultW: 220 },
  { key: "source",      label: "Source",           sortCol: null,        minW: 80,  defaultW: 120 },
  { key: "device",      label: "Device / Browser", sortCol: null,        minW: 80,  defaultW: 118 },
  { key: "tier",        label: "Tier",             sortCol: "tier",      minW: 70,  defaultW: 90  },
  { key: "outcome",     label: "Outcome",          sortCol: "outcome",   minW: 80,  defaultW: 110 },
  { key: "actions",     label: "",                 sortCol: null,        minW: 70,  defaultW: 85  },
];

// ── Alert tier metadata ──────────────────────────────────────────────────────

const TIER_META = {
  warm:     { label: "Warm Lead",     color: AMBER,  dot: AMBER,  rank: 1 },
  hot:      { label: "Hot Lead",      color: ORANGE, dot: ORANGE, rank: 2 },
  priority: { label: "Priority",      color: RED,    dot: RED,    rank: 3 },
};

// ── Conversion outcome metadata ──────────────────────────────────────────────
// Tracks the visitor-side funnel: Shortlisted → Enquiring → Enquired
// Admin-side: Engaged (admin clicked Engage)

const CONVERSION_META = {
  submitted:   { label: "Enquired",    color: "#10b981", icon: "✓", rank: 4 },
  started:     { label: "Enquiring",   color: "#06b6d4", icon: "↗", rank: 3 },
  engaged:     { label: "Engaged",     color: GOLD,      icon: "⚡", rank: 2 },
  shortlisted: { label: "Shortlisted", color: "#8b5cf6", icon: "♥", rank: 1 },
};

// Returns the highest conversion stage for a session.
// engagedSet: Set of session_ids that admin has Engaged via Aura.
function getConversionStage(s, evts, engagedSet) {
  const sessionEvts = evts
    .filter(e => e.session_id === s.session_id)
    .map(e => e.event_type);
  if (sessionEvts.includes("enquiry_submitted"))                       return "submitted";
  if (sessionEvts.includes("enquiry_started"))                         return "started";
  if (engagedSet && engagedSet.has(s.session_id))                      return "engaged";
  if (sessionEvts.includes("shortlist_add") || sessionEvts.includes("compare_add")) return "shortlisted";
  return null;
}

// Thresholds for each tier (checked in descending priority order)
//   priority  → enquiry submitted  OR  4+ intent events
//   hot       → enquiry started    OR  3+ intent events
//   warm      → 2+ intent events   OR  4+ pages
function getAlertTier(s, evts) {
  const intents     = s.intent_count || 0;
  const pages       = s.page_count   || 0;
  const sessionEvts = evts
    .filter(e => e.session_id === s.session_id)
    .map(e => e.event_type);

  if (sessionEvts.includes("enquiry_submitted") || intents >= 4) return "priority";
  if (sessionEvts.includes("enquiry_started")   || intents >= 3) return "hot";
  if (intents >= 2 || pages >= 4)                                 return "warm";
  return null;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function flag(cc) {
  if (!cc || cc === "XX" || cc === "T1") return "🌐";
  try {
    return cc.toUpperCase().replace(/./g, c =>
      String.fromCodePoint(c.charCodeAt(0) + 127397));
  } catch { return "🌐"; }
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - new Date(ts)) / 1000);
  if (s < 60)   return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  return `${Math.floor(s / 3600)}h ago`;
}

function duration(started) {
  const s = Math.floor((Date.now() - new Date(started)) / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  return `${m}m ${s % 60}s`;
}

function shortPath(path) {
  if (!path || path === "/") return "Home";
  const clean = path.replace(/^\//, "").replace(/-/g, " ").replace(/\//g, " › ");
  return clean.length > 36 ? "…" + clean.slice(-32) : clean;
}

// ── Country names (frontend mirror of edge function map) ─────────────────────

const COUNTRY_NAMES_FE = {
  GB:"United Kingdom",US:"United States",IT:"Italy",FR:"France",DE:"Germany",
  ES:"Spain",PT:"Portugal",GR:"Greece",CH:"Switzerland",AT:"Austria",
  NL:"Netherlands",BE:"Belgium",SE:"Sweden",NO:"Norway",DK:"Denmark",
  FI:"Finland",IE:"Ireland",AU:"Australia",NZ:"New Zealand",CA:"Canada",
  AE:"UAE",SA:"Saudi Arabia",ZA:"South Africa",BR:"Brazil",MX:"Mexico",
  AR:"Argentina",IN:"India",SG:"Singapore",JP:"Japan",TH:"Thailand",
  MY:"Malaysia",ID:"Indonesia",PH:"Philippines",HK:"Hong Kong",CN:"China",
  TW:"Taiwan",KR:"South Korea",TR:"Turkey",PL:"Poland",CZ:"Czech Republic",
  HU:"Hungary",RO:"Romania",NG:"Nigeria",KE:"Kenya",GH:"Ghana",EG:"Egypt",
  MA:"Morocco",IL:"Israel",PK:"Pakistan",BD:"Bangladesh",VN:"Vietnam",
  RU:"Russia",UA:"Ukraine",CL:"Chile",CO:"Colombia",PE:"Peru",
};

// Returns the best human-readable location — never "Unknown"
function resolveLocation(s) {
  const country = s.country_name
    || (s.country_code ? COUNTRY_NAMES_FE[s.country_code] || s.country_code : null);
  const city   = s.city   || null;
  const region = s.region || null;
  if (city && country)    return { primary: city,    secondary: region || country, full: `${city}, ${country}` };
  if (city)               return { primary: city,    secondary: "",                full: city };
  if (region && country)  return { primary: region,  secondary: country,           full: `${region}, ${country}` };
  if (country)            return { primary: country, secondary: "",                full: country };
  if (s.country_code)     return { primary: s.country_code, secondary: "",         full: s.country_code };
  return                         { primary: "Visitor", secondary: "",              full: "Unknown location" };
}

// ── Referrer / source classification ─────────────────────────────────────────
// Returns { label, category, color } for display in the Source column.
// Priority: UTM medium → UTM source → document.referrer → Direct

function classifySource(referrer, utmSource, utmMedium, utmCampaign) {
  // Paid
  if (utmMedium && /^(cpc|ppc|paid|paidsearch|paidsocial|display|cpv|cpm)$/i.test(utmMedium)) {
    return { label: utmSource || "Paid", category: "Paid", color: "#f59e0b" };
  }
  // Email
  if (utmMedium && /^(email|newsletter|crm|mailing)$/i.test(utmMedium)) {
    return { label: utmCampaign || utmSource || "Email", category: "Email", color: "#06b6d4" };
  }
  // UTM source
  if (utmSource) {
    const src = utmSource.toLowerCase();
    if (/instagram|facebook|tiktok|pinterest|twitter|x\.com|linkedin|youtube/.test(src)) {
      return { label: utmSource, category: "Social", color: "#8b5cf6" };
    }
    if (/google|bing|yahoo|duckduckgo/.test(src)) {
      return { label: utmSource, category: "Search", color: "#10b981" };
    }
    return { label: utmSource, category: "Referral", color: "#f97316" };
  }
  // Referrer
  if (referrer) {
    try {
      const host = new URL(referrer).hostname.replace(/^www\./, "");
      if (/google\.|bing\.|yahoo\.|duckduckgo\.|baidu\./.test(host)) {
        return { label: "Google", category: "Search", color: "#10b981" };
      }
      if (/instagram\.|facebook\.|tiktok\.|pinterest\.|twitter\.|t\.co|linkedin\.|youtube\./.test(host)) {
        const name = host.split(".")[0];
        return { label: name.charAt(0).toUpperCase() + name.slice(1), category: "Social", color: "#8b5cf6" };
      }
      if (/mail\.|email\.|substack\.|mailchimp\./.test(host)) {
        return { label: "Email", category: "Email", color: "#06b6d4" };
      }
      return { label: host, category: "Referral", color: "#f97316" };
    } catch { /* fall through */ }
  }
  return { label: "Direct", category: "Direct", color: "rgba(245,241,235,0.28)" };
}

// ── Pulsing marker element ────────────────────────────────────────────────────
// tier: null | 'warm' | 'hot' | 'priority'
// convStage: null | 'shortlisted' | 'engaged' | 'started' | 'submitted'
// Conversion outcomes override tier colour: submitted (green) > started (cyan)

function makePulseEl(isActive, tier, convStage) {
  // Conversion colour takes top priority for submitted/started — these are money signals
  const convColor  = convStage === "submitted" ? "#10b981"
    : convStage === "started" ? "#06b6d4" : null;
  const tierColor  = tier ? TIER_META[tier].color : null;
  const baseColor  = convColor || tierColor || (isActive ? GOLD : "rgba(201,168,76,0.3)");
  const borderClr  = convColor
    ? `${convColor}99`
    : tierColor ? `${tierColor}99`
    : isActive ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.2)";
  // Size hierarchy: submitted > priority > started > hot > active > passive
  const size       = convStage === "submitted" ? 20
    : tier === "priority" ? 18
    : convStage === "started" ? 16
    : tier === "hot" ? 16 : isActive ? 14 : 8;
  const glowColor  = convColor || tierColor || "rgba(201,168,76,0.6)";
  const speed      = (convStage === "submitted" || tier === "priority") ? "1s" : "1.8s";
  const animate    = convStage || tier || isActive;

  const el = document.createElement("div");
  el.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:50%",
    `background:${baseColor}`,
    `border:2px solid ${borderClr}`,
    animate
      ? `box-shadow:0 0 0 0 ${glowColor}80,0 0 ${(convStage||tier) ? 24 : 16}px ${glowColor}90`
      : "box-shadow:none",
    "cursor:pointer",
    animate ? `animation:lwd-pulse ${speed} infinite` : "animation:none",
    "transition:all 0.3s",
    "position:relative",
  ].join(";");

  // Extra ring for priority or submitted enquiry
  if (tier === "priority" || convStage === "submitted") {
    const ringColor = convStage === "submitted" ? "#10b981" : RED;
    const ring = document.createElement("div");
    ring.style.cssText = [
      "position:absolute", "inset:-4px", "border-radius:50%",
      `border:1px solid ${ringColor}50`,
      "animation:lwd-pulse 0.8s infinite",
    ].join(";");
    el.appendChild(ring);
  }

  return el;
}

// ── Cluster marker element ────────────────────────────────────────────────────
// Shows a count badge for 2+ sessions at the same city.
// convStage: highest conversion stage in the cluster

function makeClusterEl(count, anyActive, tier, convStage) {
  const convColor = convStage === "submitted" ? "#10b981"
    : convStage === "started" ? "#06b6d4" : null;
  const tierColor = tier ? TIER_META[tier].color : null;
  const color     = convColor || tierColor || (anyActive ? GOLD : "rgba(201,168,76,0.45)");
  const size      = count >= 5 ? 36 : count >= 3 ? 30 : 26;
  const speed     = (convStage === "submitted" || tier === "priority") ? "1s" : "2s";

  const el = document.createElement("div");
  el.style.cssText = [
    `width:${size}px`, `height:${size}px`,
    "border-radius:50%",
    `background:${color}22`,
    `border:2px solid ${color}`,
    `box-shadow:0 0 0 0 ${color}60,0 0 18px ${color}60`,
    "cursor:pointer",
    `animation:lwd-pulse ${speed} infinite`,
    "display:flex", "align-items:center", "justify-content:center",
    "position:relative",
  ].join(";");

  const label = document.createElement("span");
  label.textContent = count;
  label.style.cssText = [
    `color:${color}`,
    "font-size:11px", "font-weight:700",
    "font-family:'Nunito Sans',sans-serif",
    "line-height:1", "pointer-events:none",
  ].join(";");
  el.appendChild(label);

  return el;
}

// ── Alert description ─────────────────────────────────────────────────────────

function alertDescription(s, evts) {
  const sessionEvts = evts.filter(e => e.session_id === s.session_id);
  const where = s.city || s.country_name || s.country_code || "Unknown location";
  const device = s.device_type || "—";
  const pages  = s.page_count  || 0;
  const intents = s.intent_count || 0;

  const hasSubmitted = sessionEvts.some(e => e.event_type === "enquiry_submitted");
  const hasStarted   = sessionEvts.some(e => e.event_type === "enquiry_started");

  if (hasSubmitted) return `${where} · submitted an enquiry · ${pages} pages · ${device}`;
  if (hasStarted)   return `${where} · opened enquiry form · ${intents} intent signals · ${device}`;
  if (intents >= 3) return `${where} · ${intents} intent events in session · ${pages} pages`;
  return `${where} · ${pages} pages viewed · ${intents} interactions · ${device}`;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LiveStatsModule({ C }) {
  const [sessions,   setSessions]   = useState([]);
  const [events,     setEvents]     = useState([]);
  const [selected,   setSelected]   = useState(null);
  const [tick,       setTick]       = useState(0);
  const [mapReady,   setMapReady]   = useState(false);
  const [lastFetch,  setLastFetch]  = useState(null);
  const [alerts,     setAlerts]     = useState([]);   // high-intent alert toasts
  const [showHotOnly,setShowHotOnly]= useState(false); // filter toggle
  const [soundOn,    setSoundOn]    = useState(() => localStorage.getItem("lwd_live_sound") === "1");

  const mapContainerRef  = useRef(null);
  const mapRef           = useRef(null);
  const markersRef       = useRef({});        // key: cluster key → MapLibre Marker
  const markerStateRef   = useRef({});        // key: cluster key → last stateKey string
  const alertTiersRef    = useRef({});        // sessionId → last known tier
  const audioCtxRef      = useRef(null);
  const knownSessionIds  = useRef(new Set());
  const flyReturnRef     = useRef(null); // timeout for return-to-world after fly-in
  const [autoFollow,     setAutoFollow]     = useState(true);
  const [activeIntelTab, setActiveIntelTab] = useState("pages"); // pages|countries|isps|signals
  const [viewMode,       setViewMode]       = useState("table"); // table | map
  const [mapStyleKey,    setMapStyleKey]    = useState(() => localStorage.getItem("lwd_map_style") || "dark");

  // ── Freeze ─────────────────────────────────────────────────────────────────
  const [frozen,       setFrozen]       = useState(false);
  const [frozenSnap,   setFrozenSnap]   = useState({ sessions: [], events: [] });
  const [pendingCount, setPendingCount] = useState(0);

  // ── Sort (table view) ──────────────────────────────────────────────────────
  const [sortCol, setSortCol] = useState("tier");   // tier|hits|duration|last_seen|location
  const [sortDir, setSortDir] = useState("desc");

  // ── Column resize + reorder state ─────────────────────────────────────────
  const [colWidths, setColWidths] = useState(() => {
    try {
      const saved    = JSON.parse(localStorage.getItem("lwd_col_widths") || "null");
      const defaults = Object.fromEntries(COLS.map(c => [c.key, c.defaultW]));
      // Merge: saved widths take priority, defaults fill any new columns
      return saved ? { ...defaults, ...saved } : defaults;
    } catch { return Object.fromEntries(COLS.map(c => [c.key, c.defaultW])); }
  });
  const [colOrder, setColOrder] = useState(() => {
    try {
      const saved  = JSON.parse(localStorage.getItem("lwd_col_order") || "null");
      const allKeys = COLS.map(c => c.key);
      if (!saved) return allKeys;
      // Keep valid saved order, then splice any new columns before "actions"
      const valid = saved.filter(k => allKeys.includes(k));
      allKeys.forEach(k => {
        if (!valid.includes(k)) {
          const ai = valid.indexOf("actions");
          valid.splice(ai >= 0 ? ai : valid.length, 0, k);
        }
      });
      return valid;
    } catch { return COLS.map(c => c.key); }
  });
  const [dragCol,     setDragCol]     = useState(null);
  const [dragOverCol, setDragOverCol] = useState(null);

  // ── Filters ────────────────────────────────────────────────────────────────
  const [filterTier,   setFilterTier]   = useState("all");
  const [filterSource, setFilterSource] = useState("all");
  const [filterDevice, setFilterDevice] = useState("all");
  const [searchQuery,  setSearchQuery]  = useState("");

  // ── Engage panel ───────────────────────────────────────────────────────────
  const [engageTarget, setEngageTarget] = useState(null);
  const [engageCopied, setEngageCopied] = useState(false);

  // ── Engaged session tracking (persisted in localStorage) ──────────────────
  const [engagedIds, setEngagedIds] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem("lwd_engaged") || "[]")); }
    catch { return new Set(); }
  });
  const markEngaged = (sessionId) => {
    setEngagedIds(prev => {
      const next = new Set(prev);
      next.add(sessionId);
      localStorage.setItem("lwd_engaged", JSON.stringify([...next]));
      return next;
    });
  };

  // ── Today's total session count (wider than 30m window) ───────────────────
  const [todayCount, setTodayCount] = useState(0);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const NU     = "var(--font-body,'Nunito Sans',sans-serif)";
  const GD     = "var(--font-heading-primary,'Cormorant Garamond',Georgia,serif)";
  const white  = C?.white  || "#f5f1eb";
  const grey   = C?.grey   || "rgba(245,241,235,0.45)";
  const grey2  = C?.grey2  || "rgba(245,241,235,0.28)";
  const card   = C?.card   || "rgba(255,255,255,0.04)";
  const border = C?.border || "rgba(255,255,255,0.08)";
  const bg     = C?.dark   || "#0c0a08";
  // Light mode detection — drives contextual overrides for hardcoded dark rgba values
  const isLight = !!(C?.white && C.white.startsWith("#") && parseInt(C.white.slice(1,3),16) < 64);
  // Theme-aware translucent shades used in place of rgba(255,255,255,...) tokens
  const surfaceDim    = isLight ? "rgba(0,0,0,0.04)"  : "rgba(255,255,255,0.04)";
  const surfaceMid    = isLight ? "rgba(0,0,0,0.05)"  : "rgba(255,255,255,0.05)";
  const surfaceLine   = isLight ? "rgba(0,0,0,0.06)"  : "rgba(255,255,255,0.06)";
  const dotEmpty      = isLight ? "rgba(0,0,0,0.15)"  : "rgba(255,255,255,0.12)";
  const dotConnector  = isLight ? "rgba(0,0,0,0.12)"  : "rgba(255,255,255,0.08)";
  const dotActive     = isLight ? "rgba(0,0,0,0.25)"  : "rgba(255,255,255,0.25)";
  const tagBg         = isLight ? "rgba(0,0,0,0.07)"  : "rgba(255,255,255,0.06)";
  const drawerBg      = isLight ? C.dark               : "#0c0a08";
  const engageBarBg   = isLight ? C.dark               : "#0e0b09";
  // Light mode row surfaces — clear visual separation without darkness
  const rowEven       = isLight ? "#FFFFFF"     : "transparent";
  const rowOdd        = isLight ? "#FAF9F6"     : "rgba(255,255,255,0.022)";
  const rowOddLeave   = isLight ? "#FAF9F6"     : "rgba(255,255,255,0.018)";
  const rowHover      = isLight ? "#FFF8E6"     : "rgba(201,168,76,0.05)";      // gold wash
  const rowSelBg      = isLight ? "#FFF8E1"     : undefined;                     // warm gold wash
  const rowBorder     = isLight ? C?.border || "#DED9CF" : border;
  // Header row bg — anchors the table in light mode
  const theadBg       = isLight ? C?.black || "#F5F4F1" : "rgba(14,11,9,0.98)";
  const theadShadow   = isLight ? "0 2px 4px rgba(0,0,0,0.08)" : "none";

  // ── Data loading ──────────────────────────────────────────────────────────

  const loadSessions = useCallback(async () => {
    const since = new Date(Date.now() - RECENT_MS).toISOString();
    const { data } = await supabase
      .from("live_sessions")
      .select("*")
      .gte("last_seen_at", since)
      .order("last_seen_at", { ascending: false })
      .limit(300);
    if (data) { setSessions(data); setLastFetch(new Date()); }
  }, []);

  const loadEvents = useCallback(async () => {
    const since = new Date(Date.now() - 60 * 60_000).toISOString(); // last hour
    const { data } = await supabase
      .from("page_events")
      .select("*")
      .neq("event_type", "heartbeat")
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(150);
    if (data) setEvents(data);
  }, []);

  const loadTodayCount = useCallback(async () => {
    const start = new Date(); start.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from("live_sessions")
      .select("*", { count: "exact", head: true })
      .gte("first_seen_at", start.toISOString());
    if (count !== null) setTodayCount(count);
  }, []);

  useEffect(() => {
    loadSessions();
    loadEvents();
    loadTodayCount();
    const id = setInterval(loadTodayCount, 5 * 60_000);
    return () => clearInterval(id);
  }, [loadSessions, loadEvents, loadTodayCount]);

  // ── Polling ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(loadSessions, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadSessions]);

  // ── Fly to session ────────────────────────────────────────────────────────
  // Smoothly flies to a visitor's location, holds, then returns to world view.

  const flyToSession = useCallback((s) => {
    const map = mapRef.current;
    if (!map || !s?.latitude || !s?.longitude) return;
    if (selected) return; // don't interrupt when drawer is open

    // Clear any pending return
    if (flyReturnRef.current) { clearTimeout(flyReturnRef.current); flyReturnRef.current = null; }

    map.flyTo({
      center:   [s.longitude, s.latitude],
      zoom:     7,
      duration: 2200,
      essential: true,
    });

    // Drift back to world view after 5s
    flyReturnRef.current = setTimeout(() => {
      if (mapRef.current) {
        mapRef.current.flyTo({
          center:   [12, 30],
          zoom:     1.6,
          duration: 2800,
        });
      }
    }, 5000);
  }, [selected]);

  // ── Supabase Realtime ─────────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel("live-tracking-admin")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        (payload) => {
          loadSessions();
          // Fly to new visitor if they have geo and autoFollow is on
          if (autoFollow && payload.eventType === "INSERT" && payload.new?.latitude) {
            flyToSession(payload.new);
          }
        }
      )
      .on("postgres_changes",
        { event: "INSERT", schema: "public", table: "page_events" },
        (payload) => {
          if (payload.new?.event_type !== "heartbeat") {
            setEvents(prev => [payload.new, ...prev].slice(0, 150));
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadSessions, autoFollow, flyToSession]);

  // ── Live timer tick ───────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), TICK_MS);
    return () => clearInterval(id);
  }, []);

  // ── Alert detection ───────────────────────────────────────────────────────
  // Fires whenever sessions or events update. Promotes sessions through tiers.

  useEffect(() => {
    if (sessions.length === 0) return;
    const newAlerts = [];

    sessions.forEach(s => {
      const tier = getAlertTier(s, events);
      if (!tier) return;
      const prevRank = TIER_META[alertTiersRef.current[s.session_id]]?.rank || 0;
      const currRank = TIER_META[tier].rank;
      if (currRank > prevRank) {
        alertTiersRef.current[s.session_id] = tier;
        newAlerts.push({
          id:   `${s.session_id}--${tier}`,
          session: s,
          tier,
          ts:   Date.now(),
        });
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 10));
    }
  }, [sessions, events]);

  // ── New-visitor arrival sound ─────────────────────────────────────────────

  useEffect(() => {
    const isFirstLoad = knownSessionIds.current.size === 0;
    sessions.forEach(s => {
      if (!knownSessionIds.current.has(s.session_id)) {
        knownSessionIds.current.add(s.session_id);
        if (!isFirstLoad && soundOn) playVisitorSound(audioCtxRef);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // ── Alert sound ───────────────────────────────────────────────────────────

  useEffect(() => {
    if (!soundOn || alerts.length === 0) return;
    // Play the highest tier of the newest alert
    const newest = alerts[0];
    if (newest && Date.now() - newest.ts < 500) {
      playAlertSound(audioCtxRef, newest.tier);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alerts]);

  // ── Sound toggle persistence ──────────────────────────────────────────────

  const toggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    localStorage.setItem("lwd_live_sound", next ? "1" : "0");
    // Warm up AudioContext on first enable (satisfies browser autoplay policy)
    if (next) getAudioCtx(audioCtxRef);
    // Play confirmation ping
    if (next) setTimeout(() => playVisitorSound(audioCtxRef), 50);
  };

  // ── Auto-dismiss alerts after TTL ─────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(() => {
      setAlerts(prev => prev.filter(a => Date.now() - a.ts < ALERT_TTL));
    }, 5_000);
    return () => clearInterval(id);
  }, []);

  // ── MapLibre init ─────────────────────────────────────────────────────────

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style:     getMapStyle(mapStyleKey),
      center:    [12, 30],
      zoom:      1.6,
      attributionControl: false,
      logoPosition: "bottom-left",
    });

    map.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right"
    );

    map.on("load", () => {
      mapRef.current = map;
      setMapReady(true);
    });

    return () => {
      Object.values(markersRef.current).forEach(m => m.remove());
      markersRef.current = {};
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // ── Map style hot-swap ────────────────────────────────────────────────────
  // When user picks a new style, swap it on the live map without unmounting.
  // Markers are cleared from ref cache so they get redrawn after 'style.load'.

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    const url = getMapStyle(mapStyleKey);
    // Clear marker cache so they get redrawn on the new style
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current    = {};
    markerStateRef.current = {};
    map.setStyle(url);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mapStyleKey]);

  // ── Map markers — clustered, tier-aware, conversion-aware ───────────────
  // Sessions within ~1km (2 decimal lat/lng) are grouped into a cluster marker.
  // Cluster key: "lat2dp,lng2dp" — single sessions use their own session_id as key.
  // markerStateRef tracks a state hash: if it changes the marker is torn down and rebuilt.

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const nowMs = Date.now();

    // Build clusters: group sessions by rounded coordinate
    const clusterMap = {}; // key → { sessions[], lat, lng }
    sessions.forEach(s => {
      if (!s.latitude || !s.longitude) return;
      const key = `${s.latitude.toFixed(2)},${s.longitude.toFixed(2)}`;
      if (!clusterMap[key]) clusterMap[key] = { sessions: [], lat: s.latitude, lng: s.longitude };
      clusterMap[key].sessions.push(s);
    });

    const activeClusterKeys = new Set(Object.keys(clusterMap));

    // Remove markers for clusters that no longer exist
    Object.keys(markersRef.current).forEach(key => {
      if (!activeClusterKeys.has(key)) {
        markersRef.current[key].remove();
        delete markersRef.current[key];
        delete markerStateRef.current[key];
      }
    });

    // Add / update cluster markers
    Object.entries(clusterMap).forEach(([key, cluster]) => {
      const { sessions: cSessions, lat, lng } = cluster;
      const count      = cSessions.length;
      const anyActive  = cSessions.some(s => (nowMs - new Date(s.last_seen_at)) < ACTIVE_MS);

      // Highest intent tier in cluster
      const topTier = cSessions.reduce((best, s) => {
        const t = getAlertTier(s, events);
        if (!t) return best;
        if (!best || TIER_META[t].rank > TIER_META[best].rank) return t;
        return best;
      }, null);

      // Highest conversion stage in cluster (submitted > started > engaged > shortlisted)
      const topConversion = cSessions.reduce((best, s) => {
        const c = getConversionStage(s, events, engagedIds);
        if (!c) return best;
        if (!best || CONVERSION_META[c].rank > CONVERSION_META[best].rank) return c;
        return best;
      }, null);

      // State key — if this changes the marker must be rebuilt with new visuals
      const stateKey = `${count}-${anyActive ? 1 : 0}-${topTier || ''}-${topConversion || ''}`;

      // If marker exists and state unchanged, just reposition
      if (markersRef.current[key]) {
        if (markerStateRef.current[key] === stateKey) {
          markersRef.current[key].setLngLat([lng, lat]);
          return;
        }
        // State changed — tear down and rebuild
        markersRef.current[key].remove();
        delete markersRef.current[key];
      }

      markerStateRef.current[key] = stateKey;

      const el = count > 1
        ? makeClusterEl(count, anyActive, topTier, topConversion)
        : makePulseEl(anyActive, topTier, topConversion);

      el.addEventListener("click", (e) => {
        e.stopPropagation();
        if (count === 1) {
          setSelected(cSessions[0]);
        } else {
          map.flyTo({ center: [lng, lat], zoom: Math.min(map.getZoom() + 3, 10), duration: 1200 });
        }
      });

      // ── Rich hover tooltip ───────────────────────────────────────────────
      el.addEventListener("mouseenter", () => {
        let html;

        if (count === 1) {
          const s   = cSessions[0];
          const loc = resolveLocation(s).full;
          const t   = topTier ? TIER_META[topTier] : null;
          const cm  = topConversion ? CONVERSION_META[topConversion] : null;
          const page    = shortPath(s.current_path);
          const device  = [s.device_type, s.browser].filter(Boolean).join(" · ") || "—";
          const dur     = duration(s.first_seen_at);
          const pgCount = s.page_count || 1;

          const tierBadge = t
            ? `<span style="color:${t.color};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;background:${t.color}20;border-radius:3px;padding:1px 6px;">${t.label}</span>`
            : "";
          const convBadge = cm
            ? `<span style="color:${cm.color};font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;background:${cm.color}20;border-radius:3px;padding:1px 6px;margin-left:4px;">${cm.icon} ${cm.label}</span>`
            : "";
          const badges = (tierBadge || convBadge)
            ? `<div style="margin-bottom:7px;">${tierBadge}${convBadge}</div>` : "";
          const ispRow = s.isp
            ? `<span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:130px;display:inline-block;">${s.isp}</span>` : "";

          html = `
            <div style="font-family:'Nunito Sans',sans-serif;font-size:11px;color:#f5f1eb;padding:2px 0;min-width:170px;max-width:220px;">
              <div style="font-weight:700;font-size:12px;margin-bottom:3px;">${loc}</div>
              <div style="opacity:0.58;font-size:10px;margin-bottom:7px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${page}</div>
              ${badges}
              <div style="display:flex;flex-wrap:wrap;gap:4px 10px;opacity:0.5;font-size:9px;letter-spacing:0.2px;">
                <span>${dur}</span>
                <span>·</span>
                <span>${pgCount} page${pgCount !== 1 ? "s" : ""}</span>
                <span>·</span>
                <span>${device}</span>
                ${ispRow ? `<span>·</span>${ispRow}` : ""}
              </div>
            </div>`;
        } else {
          // Cluster: mini-list of top 4 sessions
          const rows = cSessions.slice(0, 4).map(s => {
            const t  = getAlertTier(s, events);
            const tm = t ? TIER_META[t] : null;
            const cm = getConversionStage(s, events, engagedIds);
            const cm_meta = cm ? CONVERSION_META[cm] : null;
            const dot = cm_meta ? cm_meta.color : tm ? tm.color : GOLD;
            const loc = resolveLocation(s).primary;
            return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
              <span style="width:6px;height:6px;border-radius:50%;background:${dot};box-shadow:0 0 4px ${dot};flex-shrink:0;"></span>
              <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${loc}</span>
              ${cm_meta ? `<span style="font-size:9px;color:${cm_meta.color};margin-left:auto;flex-shrink:0;">${cm_meta.icon}</span>` : ""}
            </div>`;
          }).join("");
          const more = cSessions.length > 4
            ? `<div style="opacity:0.4;font-size:9px;margin-top:4px;">+${cSessions.length - 4} more</div>` : "";

          html = `
            <div style="font-family:'Nunito Sans',sans-serif;font-size:11px;color:#f5f1eb;padding:2px 0;min-width:150px;">
              <div style="font-weight:700;font-size:12px;margin-bottom:9px;">${count} visitors nearby</div>
              ${rows}${more}
            </div>`;
        }

        const popup = new maplibregl.Popup({
          closeButton: false, offset: [0, -12], className: "lwd-tip",
        }).setLngLat([lng, lat]).setHTML(html).addTo(map);
        el._lwdPopup = popup;
      });

      el.addEventListener("mouseleave", () => {
        el._lwdPopup?.remove();
        el._lwdPopup = null;
      });

      markersRef.current[key] = new maplibregl.Marker({ element: el, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(map);
    });
  }, [sessions, events, mapReady, tick, engagedIds]);

  // ── Freeze logic ─────────────────────────────────────────────────────────

  const freezeToggle = () => {
    if (!frozen) {
      setFrozenSnap({ sessions: [...sessions], events: [...events] });
      setFrozen(true);
      setPendingCount(0);
    } else {
      setFrozen(false);
      setPendingCount(0);
    }
  };

  // Track pending updates while frozen
  // (done via a ref to avoid stale closure in the effect)
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  useEffect(() => {
    if (frozenRef.current) {
      setPendingCount(sessions.length);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions]);

  // ── Sort toggle ───────────────────────────────────────────────────────────

  const toggleSort = (col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("desc"); }
  };

  // ── Column resize ──────────────────────────────────────────────────────────
  const startResize = useCallback((e, colKey) => {
    e.preventDefault(); e.stopPropagation();
    const startX = e.clientX;
    const startW = colWidths[colKey];
    const minW   = COLS.find(c => c.key === colKey)?.minW || 40;
    const onMove = ev => {
      const newW = Math.max(minW, startW + ev.clientX - startX);
      setColWidths(prev => {
        const next = { ...prev, [colKey]: newW };
        localStorage.setItem("lwd_col_widths", JSON.stringify(next));
        return next;
      });
    };
    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [colWidths]);

  // ── Column reorder ─────────────────────────────────────────────────────────
  const handleDragStart  = (e, colKey) => { setDragCol(colKey); e.dataTransfer.effectAllowed = "move"; };
  const handleDragOver   = (e, colKey) => { e.preventDefault(); setDragOverCol(colKey); };
  const handleDragLeave  = ()          => setDragOverCol(null);
  const handleDragEnd    = ()          => { setDragCol(null); setDragOverCol(null); };
  const handleDrop       = (e, colKey) => {
    e.preventDefault();
    if (!dragCol || dragCol === colKey) { setDragCol(null); setDragOverCol(null); return; }
    setColOrder(prev => {
      const next = [...prev];
      const fi   = next.indexOf(dragCol);
      const ti   = next.indexOf(colKey);
      next.splice(fi, 1);
      next.splice(ti, 0, dragCol);
      localStorage.setItem("lwd_col_order", JSON.stringify(next));
      return next;
    });
    setDragCol(null); setDragOverCol(null);
  };

  // ── Computed stats ────────────────────────────────────────────────────────
  // When frozen: use snapshot; when live: use fresh sessions/events

  const viewSessions = frozen ? frozenSnap.sessions : sessions;
  const viewEvents   = frozen ? frozenSnap.events   : events;

  const now       = Date.now();
  const activeNow = viewSessions.filter(s => (now - new Date(s.last_seen_at)) < ACTIVE_MS);
  const last30    = viewSessions;

  const hotSessions      = viewSessions.filter(s => !!getAlertTier(s, viewEvents));
  const urgentSessions   = viewSessions.filter(s => {
    const t = getAlertTier(s, viewEvents);
    return t === "hot" || t === "priority";
  });
  const prioritySessions = viewSessions.filter(s => getAlertTier(s, viewEvents) === "priority");
  const baseDisplay = showHotOnly ? hotSessions : last30;

  // Apply filters
  const filtersActive = filterTier !== "all" || filterSource !== "all" || filterDevice !== "all" || searchQuery !== "";
  const filteredDisplay = filtersActive ? baseDisplay.filter(s => {
    if (filterTier !== "all") {
      const t = getAlertTier(s, viewEvents);
      if (filterTier === "active" && (now - new Date(s.last_seen_at)) >= ACTIVE_MS) return false;
      if (filterTier !== "active" && t !== filterTier) return false;
    }
    if (filterDevice !== "all" && (s.device_type || "").toLowerCase() !== filterDevice) return false;
    if (filterSource !== "all") {
      const src = classifySource(s.referrer, s.utm_source, s.utm_medium, s.utm_campaign);
      if (src.category.toLowerCase() !== filterSource) return false;
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const hay = [s.city, s.country_name, s.country_code, s.isp, s.current_path, s.referrer, s.utm_source, s.browser, s.os]
        .filter(Boolean).join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  }) : baseDisplay;

  // Sort
  const displaySessions = [...filteredDisplay].sort((a, b) => {
    let av, bv;
    switch (sortCol) {
      case "tier": {
        const ta = getAlertTier(a, viewEvents);
        const tb = getAlertTier(b, viewEvents);
        av = TIER_META[ta]?.rank || 0;
        bv = TIER_META[tb]?.rank || 0;
        // Secondary sort: last_seen desc
        if (av === bv) {
          return new Date(b.last_seen_at) - new Date(a.last_seen_at);
        }
        break;
      }
      case "outcome": {
        const ca = getConversionStage(a, viewEvents, engagedIds);
        const cb = getConversionStage(b, viewEvents, engagedIds);
        av = CONVERSION_META[ca]?.rank || 0;
        bv = CONVERSION_META[cb]?.rank || 0;
        if (av === bv) {
          return new Date(b.last_seen_at) - new Date(a.last_seen_at);
        }
        break;
      }
      case "hits":
        av = a.page_count || 0;
        bv = b.page_count || 0;
        break;
      case "duration":
        // Longer duration first (desc) = smaller first_seen
        av = a.first_seen_at ? new Date(a.first_seen_at).getTime() : now;
        bv = b.first_seen_at ? new Date(b.first_seen_at).getTime() : now;
        // Invert for duration: smaller timestamp = longer duration
        return sortDir === "desc"
          ? av - bv   // oldest start = longest session
          : bv - av;
      case "last_seen":
        av = new Date(a.last_seen_at);
        bv = new Date(b.last_seen_at);
        break;
      case "location":
        av = a.country_name || a.country_code || "";
        bv = b.country_name || b.country_code || "";
        break;
      default:
        av = new Date(a.last_seen_at);
        bv = new Date(b.last_seen_at);
    }
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === "asc" ? cmp : -cmp;
  });

  const todayStart     = new Date(); todayStart.setHours(0,0,0,0);
  const todayEvts      = viewEvents.filter(e => new Date(e.created_at) >= todayStart);
  const todayStarted   = todayEvts.filter(e => e.event_type === "enquiry_started").length;
  const todaySubmitted = todayEvts.filter(e => e.event_type === "enquiry_submitted").length;

  // Conversion funnel (last 30 min sessions)
  const funnelTotal       = last30.length;
  const funnelShortlisted = last30.filter(s => getConversionStage(s, viewEvents, engagedIds) === "shortlisted").length;
  const funnelEngaged     = last30.filter(s => getConversionStage(s, viewEvents, engagedIds) === "engaged").length;
  const funnelStarted     = last30.filter(s => {
    const stg = getConversionStage(s, viewEvents, engagedIds);
    return stg === "started" || stg === "submitted";
  }).length;
  const funnelSubmitted   = last30.filter(s => getConversionStage(s, viewEvents, engagedIds) === "submitted").length;

  // ── Map panel: filter-isolated session list ───────────────────────────────
  // Never affected by table-view filters (tier/source/device/search).
  // Sorted: priority > hot > warm > active > last_seen.
  const mapPanelSessions = (showHotOnly ? hotSessions : last30)
    .slice()
    .sort((a, b) => {
      const ta = getAlertTier(a, viewEvents);
      const tb = getAlertTier(b, viewEvents);
      const ra  = TIER_META[ta]?.rank || 0;
      const rb  = TIER_META[tb]?.rank || 0;
      if (ra !== rb) return rb - ra;
      return new Date(b.last_seen_at) - new Date(a.last_seen_at);
    });

  // Sessions visible in panel but not on map (no geo)
  const noGeoCount = last30.filter(s => !s.latitude || !s.longitude).length;

  // Top pages
  const pageCounts = {};
  last30.forEach(s => {
    if (s.current_path) pageCounts[s.current_path] = (pageCounts[s.current_path] || 0) + 1;
  });
  const topPages = Object.entries(pageCounts).sort((a,b) => b[1]-a[1]).slice(0, 7);

  // Top countries
  const ccCounts = {};
  last30.forEach(s => {
    if (s.country_code) ccCounts[s.country_code] = (ccCounts[s.country_code] || 0) + 1;
  });
  const topCountries = Object.entries(ccCounts).sort((a,b) => b[1]-a[1]).slice(0, 7);

  // Top ISPs / carriers
  const ispCounts = {};
  last30.forEach(s => {
    if (s.isp) ispCounts[s.isp] = (ispCounts[s.isp] || 0) + 1;
  });
  const topISPs = Object.entries(ispCounts).sort((a,b) => b[1]-a[1]).slice(0, 10);

  // Intent signals (last hour)
  const intentEvts = viewEvents.filter(e => INTENT_TYPES.includes(e.event_type));

  // Top live page + country for KPI
  const topPage    = topPages[0]?.[0] || null;
  const topCountry = topCountries[0] ? `${flag(topCountries[0][0])} ${topCountries[0][0]}` : "—";

  // Active alerts (undismissed)
  const liveAlerts = alerts.filter(a => !a.dismissed);
  const hotCount   = hotSessions.length;

  // ── Styles ────────────────────────────────────────────────────────────────

  const S = {
    kpiVal:   { fontFamily: GD, fontSize: 26, fontWeight: 500, lineHeight: 1, color: white, marginBottom: 4 },
    kpiLabel: { fontFamily: NU, fontSize: 9,  fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: grey2 },
    sectionTitle: { fontFamily: GD, fontSize: 13, fontStyle: "italic", color: white, marginBottom: 10 },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
    rowLabel: { fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 },
    rowVal: { fontFamily: NU, fontSize: 11, fontWeight: 700, color: GOLD, flexShrink: 0 },
  };

  const dismissAlert = (id) =>
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, dismissed: true } : a));

  // ── getCellContent — renders one <td> per column key ─────────────────────
  const getCellContent = (colKey, s, { isActive, isSel, tier, tm, src, loc, journeyStr, sessionBadge, convStage, convMeta }) => {
    switch (colKey) {
      case "location":
        return (
          <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ fontSize: 13, flexShrink: 0 }}>{flag(s.country_code)}</span>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{
                  fontFamily: NU, fontSize: 12, fontWeight: 600, color: white,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {loc.primary}
                </div>
                {loc.secondary && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: grey2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{loc.secondary}</div>
                )}
              </div>
              {sessionBadge && (
                <span style={{
                  flexShrink: 0, fontFamily: NU, fontSize: 8, fontWeight: 700,
                  letterSpacing: "0.4px", textTransform: "uppercase",
                  color: sessionBadge.color, background: `${sessionBadge.color}18`,
                  border: `1px solid ${sessionBadge.color}35`,
                  borderRadius: 3, padding: "1px 5px",
                }}>{sessionBadge.label}</span>
              )}
              {isActive && (
                <span style={{
                  flexShrink: 0, width: 5, height: 5, borderRadius: "50%",
                  background: GOLD, boxShadow: `0 0 4px ${GOLD}`,
                  animation: "lwd-pulse 2s infinite",
                }} />
              )}
              {s.latitude && (
                <button
                  onClick={e => { e.stopPropagation(); setViewMode("map"); flyToSession(s); setSelected(s); }}
                  title="View on map"
                  style={{
                    flexShrink: 0, background: "none", border: "none",
                    cursor: "pointer", fontSize: 11, opacity: 0.4,
                    padding: 0, lineHeight: 1, transition: "opacity 0.15s",
                  }}
                  onMouseEnter={e => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={e => e.currentTarget.style.opacity = "0.4"}
                >
                  📍
                </button>
              )}
            </div>
          </td>
        );

      case "localTime":
        return (
          <td key={colKey} style={{ padding: "8px 12px", fontFamily: NU, fontSize: 11, color: grey, whiteSpace: "nowrap", borderRight: `1px solid ${border}` }}>
            {s.first_seen_at
              ? new Date(s.first_seen_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
              : "—"}
          </td>
        );

      case "duration":
        return (
          <td key={colKey} style={{ padding: "8px 12px", fontFamily: NU, fontSize: 11, color: grey, whiteSpace: "nowrap", borderRight: `1px solid ${border}` }}>
            {duration(s.first_seen_at)}
          </td>
        );

      case "isp":
        return (
          <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
            <div style={{
              fontFamily: NU, fontSize: 11,
              color: s.isp ? grey : grey2,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {s.isp || "—"}
            </div>
          </td>
        );

      case "hits":
        return (
          <td key={colKey} style={{ padding: "8px 12px", fontFamily: NU, fontSize: 12, fontWeight: 700, color: GOLD, textAlign: "center", borderRight: `1px solid ${border}` }}>
            {s.page_count || 1}
          </td>
        );

      case "currentPage":
        return (
          <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
            <div style={{
              fontFamily: NU, fontSize: 11, color: white,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {shortPath(s.current_path)}
            </div>
            {journeyStr ? (
              <div style={{
                fontFamily: NU, fontSize: 9, color: grey2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                marginTop: 2, letterSpacing: "0.2px",
              }}>
                {journeyStr}
              </div>
            ) : s.current_title ? (
              <div style={{
                fontFamily: NU, fontSize: 10, color: grey2,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                marginTop: 1,
              }}>
                {s.current_title}
              </div>
            ) : null}
          </td>
        );

      case "source":
        return (
          <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{
                width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                background: src.color,
              }} />
              <span style={{
                fontFamily: NU, fontSize: 11,
                color: src.category === "Direct" ? grey2 : grey,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {src.label}
              </span>
            </div>
            {src.category !== "Direct" && (
              <div style={{ fontFamily: NU, fontSize: 9, color: src.color, opacity: 0.7, letterSpacing: "0.4px", marginTop: 1 }}>
                {src.category}
              </div>
            )}
          </td>
        );

      case "device":
        return (
          <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
            <div style={{ fontFamily: NU, fontSize: 11, color: grey, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {[s.device_type, s.browser].filter(Boolean).join(" · ") || "—"}
            </div>
            {s.os && (
              <div style={{ fontFamily: NU, fontSize: 10, color: grey2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", marginTop: 1 }}>
                {s.os}
              </div>
            )}
          </td>
        );

      case "tier":
        return (
          <td key={colKey} style={{ padding: "8px 12px" }}>
            {tm ? (
              <span style={{
                display: "inline-block",
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.6px", textTransform: "uppercase",
                color: tm.color, background: `${tm.color}20`,
                border: `1px solid ${tm.color}45`,
                borderRadius: 4, padding: "2px 8px", whiteSpace: "nowrap",
              }}>
                {tm.label}
              </span>
            ) : isActive ? (
              <span style={{
                display: "inline-block",
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.6px",
                color: GOLD, background: "rgba(201,168,76,0.10)",
                border: `1px solid ${GOLD}30`,
                borderRadius: 4, padding: "2px 8px",
              }}>
                Active
              </span>
            ) : (
              <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>—</span>
            )}
          </td>
        );

      case "outcome": {
        // Show the highest conversion stage for this session, or a mini funnel
        const allStages = ["shortlisted","engaged","started","submitted"];
        const sessionEvtTypes = viewEvents
          .filter(e => e.session_id === s.session_id)
          .map(e => e.event_type);
        const stageReached = {
          shortlisted: sessionEvtTypes.includes("shortlist_add") || sessionEvtTypes.includes("compare_add"),
          engaged:     engagedIds.has(s.session_id),
          started:     sessionEvtTypes.includes("enquiry_started") || sessionEvtTypes.includes("enquiry_submitted"),
          submitted:   sessionEvtTypes.includes("enquiry_submitted"),
        };
        if (!convStage) {
          return (
            <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
              <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>—</span>
            </td>
          );
        }
        return (
          <td key={colKey} style={{ padding: "8px 12px", borderRight: `1px solid ${border}` }}>
            {/* Highest stage pill */}
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
              <span style={{
                display: "inline-flex", alignItems: "center", gap: 4,
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.5px", textTransform: "uppercase",
                color: convMeta.color, background: `${convMeta.color}18`,
                border: `1px solid ${convMeta.color}40`,
                borderRadius: 4, padding: "2px 7px", whiteSpace: "nowrap",
              }}>
                <span>{convMeta.icon}</span> {convMeta.label}
              </span>
            </div>
            {/* Mini funnel dots */}
            <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
              {allStages.map((stg, i) => {
                const meta = CONVERSION_META[stg];
                const reached = stageReached[stg];
                return (
                  <span key={stg} style={{ display: "flex", alignItems: "center", gap: 3 }}>
                    <span
                      title={meta.label}
                      style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: reached ? meta.color : dotEmpty,
                        boxShadow: reached ? `0 0 4px ${meta.color}` : "none",
                        transition: "all 0.2s",
                        display: "inline-block",
                      }}
                    />
                    {i < allStages.length - 1 && (
                      <span style={{ width: 6, height: 1, background: reached && stageReached[allStages[i+1]] ? dotActive : dotConnector, display: "inline-block" }} />
                    )}
                  </span>
                );
              })}
            </div>
          </td>
        );
      }

      case "actions":
        return (
          <td key={colKey} style={{ padding: "6px 10px" }} onClick={e => e.stopPropagation()}>
            <button
              onClick={() => setEngageTarget(s)}
              style={{
                display: "flex", alignItems: "center", gap: 4,
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: "0.5px", textTransform: "uppercase",
                color: GOLD, background: "rgba(201,168,76,0.10)",
                border: `1px solid ${GOLD}40`, borderRadius: 4,
                padding: "3px 9px", cursor: "pointer",
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.2)"; e.currentTarget.style.borderColor = `${GOLD}70`; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.10)"; e.currentTarget.style.borderColor = `${GOLD}40`; }}
            >
              ⚡ Engage
            </button>
          </td>
        );

      default:
        return <td key={colKey} />;
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: NU, color: white, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: bg }}>

      {/* Pulse animation + tier animations */}
      <style>{`
        @keyframes lwd-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.6), 0 0 16px rgba(201,168,76,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(201,168,76,0), 0 0 16px rgba(201,168,76,0.7); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0),   0 0 16px rgba(201,168,76,0.7); }
        }
        @keyframes lwd-alert-in {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes lwd-alert-bar {
          from { transform: scaleX(1); }
          to   { transform: scaleX(0); }
        }
        .lwd-alert-item { animation: lwd-alert-in 0.3s ease; }
        .maplibregl-ctrl-group { background: rgba(20,17,14,0.9) !important; border: 1px solid rgba(201,168,76,0.2) !important; }
        .maplibregl-ctrl-group button { background: transparent !important; }
        .maplibregl-ctrl-group button:hover { background: rgba(201,168,76,0.08) !important; }
        .maplibregl-ctrl-group .maplibregl-ctrl-icon { filter: invert(1) sepia(1) saturate(2) hue-rotate(10deg); }
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-logo { display: none !important; }
        .lwd-tip .maplibregl-popup-content {
          background: rgba(14,11,9,0.95) !important;
          border: 1px solid rgba(201,168,76,0.25) !important;
          border-radius: 5px !important; padding: 8px 12px !important;
          box-shadow: 0 4px 20px rgba(0,0,0,0.5) !important;
        }
        .lwd-tip .maplibregl-popup-tip { display: none !important; }
        @keyframes lwd-engage-in {
          from { opacity:0; transform:translateY(12px); }
          to   { opacity:1; transform:translateY(0); }
        }
      `}</style>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(8,1fr)", gap: 1, background: border, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
        {[
          { label: "Online Now",        value: activeNow.length,    accent: activeNow.length > 0 },
          { label: "Last 30 Min",       value: last30.length },
          { label: "Today Sessions",    value: todayCount },
          { label: "Enquiry Started",   value: todayStarted,        accent: todayStarted > 0,   accentColor: todayStarted > 0 ? "#06b6d4" : null },
          { label: "Enquiry Submitted", value: todaySubmitted,      accent: todaySubmitted > 0, accentColor: todaySubmitted > 0 ? "#10b981" : null },
          { label: "High Intent",       value: hotCount,            accent: hotCount > 0,
            accentColor: hotCount > 0 ? (hotCount > 3 ? RED : ORANGE) : null },
          { label: "Top Page",          value: topPage ? shortPath(topPage) : "—", small: true },
          { label: "Top Country",       value: topCountry,          small: true },
        ].map(k => (
          <div key={k.label} style={{
            background: card, padding: "14px 16px",
            boxShadow: isLight ? "0 1px 3px rgba(0,0,0,0.07), 0 0 0 1px rgba(0,0,0,0.04)" : "none",
            borderBottom: isLight ? `2px solid ${k.accentColor || "transparent"}` : "none",
            transition: "box-shadow 0.15s",
          }}>
            <div style={{
              ...S.kpiVal,
              fontSize: k.small ? 14 : 26,
              color: k.accentColor || (k.accent ? GOLD : white),
            }}>
              {k.value}
            </div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      {/* ── Alert strip ─────────────────────────────────────────────────── */}
      {liveAlerts.length > 0 && (
        <div style={{
          flexShrink: 0, borderBottom: `1px solid ${border}`,
          background: "rgba(239,68,68,0.03)", maxHeight: 140, overflowY: "auto",
        }}>
          {liveAlerts.map(a => {
            const tm = TIER_META[a.tier];
            return (
              <div
                key={a.id}
                className="lwd-alert-item"
                style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "8px 16px", borderBottom: `1px solid ${border}`,
                  borderLeft: `3px solid ${tm.color}`,
                  background: `${tm.color}08`,
                  position: "relative", overflow: "hidden",
                }}
              >
                {/* TTL progress bar */}
                <div style={{
                  position: "absolute", bottom: 0, left: 0, right: 0, height: 1,
                  background: tm.color, opacity: 0.3,
                  transformOrigin: "left",
                  animation: `lwd-alert-bar ${ALERT_TTL / 1000}s linear forwards`,
                }} />

                {/* Tier pill */}
                <span style={{
                  flexShrink: 0, fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: "0.8px", textTransform: "uppercase",
                  color: tm.color, background: `${tm.color}18`,
                  borderRadius: 4, padding: "2px 7px", border: `1px solid ${tm.color}40`,
                }}>
                  {tm.label}
                </span>

                {/* Description */}
                <span style={{
                  flex: 1, fontFamily: NU, fontSize: 11, color: grey,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                }}>
                  {alertDescription(a.session, events)}
                </span>

                {/* Timestamp */}
                <span style={{ flexShrink: 0, fontFamily: NU, fontSize: 10, color: grey2 }}>
                  {timeAgo(a.ts)}
                </span>

                {/* View button */}
                <button
                  onClick={() => { setSelected(a.session); dismissAlert(a.id); }}
                  style={{
                    flexShrink: 0, fontFamily: NU, fontSize: 10, fontWeight: 700,
                    color: tm.color, background: `${tm.color}15`, border: `1px solid ${tm.color}40`,
                    borderRadius: 4, padding: "2px 9px", cursor: "pointer",
                    letterSpacing: "0.5px",
                  }}
                >
                  View
                </button>

                {/* Dismiss */}
                <button
                  onClick={() => dismissAlert(a.id)}
                  style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: grey2, fontSize: 14, lineHeight: 1, padding: 0 }}
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── View toggle + Freeze ─────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 14px", borderBottom: `1px solid ${frozen ? "rgba(201,168,76,0.3)" : border}`, flexShrink: 0, background: frozen ? "rgba(201,168,76,0.03)" : "transparent", transition: "all 0.2s" }}>

        {/* Left: session count + frozen badge */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: grey2, letterSpacing: "0.3px" }}>
            {displaySessions.length} session{displaySessions.length !== 1 ? "s" : ""}
            {!frozen && activeNow.length > 0 && (
              <span style={{ color: GOLD, marginLeft: 6 }}>· {activeNow.length} active</span>
            )}
          </span>
          {frozen && pendingCount > 0 && (
            <span style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
              color: AMBER, background: `${AMBER}18`,
              border: `1px solid ${AMBER}35`,
              borderRadius: 8, padding: "1px 8px",
            }}>
              {pendingCount} new waiting
            </span>
          )}
        </div>

        {/* Right: Freeze · Map · Table */}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>

          {/* Freeze toggle */}
          <button
            onClick={freezeToggle}
            title={frozen ? "Resume live updates" : "Freeze list to inspect"}
            style={{
              display: "flex", alignItems: "center", gap: 5,
              padding: "4px 11px", cursor: "pointer",
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.5px", textTransform: "uppercase",
              border: `1px solid ${frozen ? GOLD + "60" : border}`,
              borderRadius: 4,
              background: frozen ? "rgba(201,168,76,0.14)" : "transparent",
              color: frozen ? GOLD : grey2,
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 10 }}>{frozen ? "▶" : "⏸"}</span>
            {frozen ? "Resume" : "Freeze"}
          </button>

          <span style={{ width: 1, height: 14, background: border, display: "inline-block" }} />

          {/* Map / Table */}
          {[
            { key: "map",   icon: "◈", label: "Map"   },
            { key: "table", icon: "≡", label: "Table" },
          ].map(v => (
            <button key={v.key} onClick={() => setViewMode(v.key)} style={{
              display: "flex", alignItems: "center", gap: 5, padding: "4px 11px",
              cursor: "pointer", fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.5px", textTransform: "uppercase",
              border: `1px solid ${viewMode === v.key ? GOLD + "50" : border}`,
              borderRadius: 4,
              background: viewMode === v.key ? "rgba(201,168,76,0.10)" : "transparent",
              color: viewMode === v.key ? GOLD : grey2,
              transition: "all 0.15s",
            }}>
              <span>{v.icon}</span> {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main: map + sessions ─────────────────────────────────────────── */}
      {/* Always rendered (never unmounted) so MapLibre stays attached to the DOM */}
      <div style={{ flex: 1, display: viewMode === "map" ? "grid" : "none", gridTemplateColumns: "1fr 320px", minHeight: 0, overflow: "hidden" }}>

        {/* Map */}
        <div style={{ position: "relative", background: isLight ? C.dark : "#080a0b" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

          {/* Map overlay — live badge + style picker */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", flexDirection: "column", gap: 6,
          }}>
            {/* Live badge */}
            <div style={{
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(10,8,6,0.80)", backdropFilter: "blur(6px)",
              border: `1px solid rgba(201,168,76,0.2)`,
              borderRadius: 4, padding: "5px 12px", pointerEvents: "none",
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}`, animation: "lwd-pulse 2s infinite" }} />
              <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: GOLD }}>
                Live · {activeNow.length} active
              </span>
            </div>

            {/* Style picker */}
            <div style={{
              display: "flex", gap: 2,
              background: "rgba(10,8,6,0.80)", backdropFilter: "blur(6px)",
              border: `1px solid ${border}`, borderRadius: 4, padding: "3px 4px",
              alignSelf: "flex-start",
            }}>
              {MAP_STYLES.map(style => (
                <button
                  key={style.key}
                  onClick={() => {
                    setMapStyleKey(style.key);
                    localStorage.setItem("lwd_map_style", style.key);
                  }}
                  style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700,
                    letterSpacing: "0.5px", textTransform: "uppercase",
                    padding: "3px 8px", cursor: "pointer", border: "none",
                    borderRadius: 3, transition: "all 0.15s",
                    background: mapStyleKey === style.key ? `${GOLD}25` : "transparent",
                    color: mapStyleKey === style.key ? GOLD : grey2,
                  }}
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>

          {/* Map legend — live counts per tier + conversion */}
          {(() => {
            const warmCount = last30.filter(s => getAlertTier(s, viewEvents) === "warm").length;
            const hotOnlyCount = last30.filter(s => getAlertTier(s, viewEvents) === "hot").length;
            const enquiredCount = funnelSubmitted;
            const legendItems = [
              { label: "Active",   color: GOLD,      count: activeNow.length   },
              { label: "Warm",     color: AMBER,     count: warmCount          },
              { label: "Hot",      color: ORANGE,    count: hotOnlyCount       },
              { label: "Priority", color: RED,       count: prioritySessions.length },
              ...(enquiredCount > 0 ? [{ label: "Enquired", color: "#10b981", count: enquiredCount }] : []),
            ].filter(l => l.count > 0);
            if (legendItems.length === 0) return null;
            return (
              <div style={{
                position: "absolute", top: 12, right: 60,
                display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap",
                background: "rgba(10,8,6,0.80)", backdropFilter: "blur(6px)",
                border: `1px solid ${border}`, borderRadius: 4, padding: "6px 12px",
                pointerEvents: "none", maxWidth: 340,
              }}>
                {legendItems.map(l => (
                  <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                    <span style={{ fontFamily: NU, fontSize: 9, color: grey2, letterSpacing: "0.5px" }}>{l.label}</span>
                    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: l.color }}>({l.count})</span>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Updated timestamp */}
          {lastFetch && (
            <div style={{
              position: "absolute", bottom: 12, left: 12,
              fontFamily: NU, fontSize: 9, color: grey2,
              letterSpacing: "0.3px", pointerEvents: "none",
            }}>
              Updated {lastFetch.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>

        {/* ── Active sessions panel ──────────────────────────────────────── */}
        <div style={{ borderLeft: `1px solid ${border}`, display: "flex", flexDirection: "column", overflow: "hidden", background: "rgba(12,10,8,0.6)" }}>

          {/* Panel header — count · All/Hot · Follow/Audio */}
          <div style={{ padding: "7px 10px", borderBottom: `1px solid ${border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 5 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: grey2, whiteSpace: "nowrap", flexShrink: 0 }}>{last30.length} in 30m</span>

            <div style={{ display: "flex", alignItems: "center", gap: 4, flexShrink: 0 }}>
              {/* All / Hot */}
              <div style={{ display: "flex", borderRadius: 5, overflow: "hidden", border: `1px solid ${border}` }}>
                {[
                  { key: false, label: "All" },
                  { key: true,  label: `Hot${hotCount > 0 ? ` (${hotCount})` : ""}` },
                ].map(opt => (
                  <button key={String(opt.key)} onClick={() => setShowHotOnly(opt.key)} style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "0.5px",
                    padding: "3px 9px", cursor: "pointer", border: "none", transition: "all 0.15s",
                    background: showHotOnly === opt.key ? (opt.key ? `${ORANGE}25` : "rgba(201,168,76,0.12)") : "transparent",
                    color: showHotOnly === opt.key ? (opt.key ? ORANGE : GOLD) : grey2,
                  }}>
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Follow / Audio */}
              <div style={{ display: "flex", borderRadius: 5, overflow: "hidden", border: `1px solid ${border}` }}>
                {[
                  { active: autoFollow, onClick: () => setAutoFollow(v => !v), label: "Follow" },
                  { active: soundOn,    onClick: toggleSound,                   label: "Audio"  },
                ].map((btn, i) => (
                  <button key={btn.label} onClick={btn.onClick} title={btn.label} style={{
                    display: "flex", alignItems: "center", gap: 4,
                    padding: "3px 9px", cursor: "pointer", border: "none",
                    borderLeft: i > 0 ? `1px solid ${border}` : "none",
                    background: btn.active ? "rgba(201,168,76,0.10)" : "transparent",
                    transition: "all 0.18s",
                  }}>
                    <span style={{
                      width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
                      background: btn.active ? GOLD : isLight ? "rgba(0,0,0,0.18)" : "rgba(255,255,255,0.18)",
                      boxShadow: btn.active ? `0 0 5px ${GOLD}` : "none",
                      transition: "all 0.18s",
                    }} />
                    <span style={{
                      fontFamily: NU, fontSize: 10, fontWeight: 600,
                      letterSpacing: "0.6px", textTransform: "uppercase",
                      color: btn.active ? GOLD : grey2, transition: "color 0.18s",
                    }}>{btn.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {mapPanelSessions.length === 0 ? (
              <div style={{ padding: "36px 20px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 10, opacity: 0.25 }}>
                  {showHotOnly ? "◎" : "✦"}
                </div>
                <div style={{ fontFamily: GD, fontSize: 14, fontStyle: "italic", color: grey, marginBottom: 6 }}>
                  {showHotOnly ? "No high-intent sessions yet" : "Waiting for live activity"}
                </div>
                <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6, maxWidth: 200, margin: "0 auto" }}>
                  {showHotOnly
                    ? "Sessions with 2 or more intent signals will appear here"
                    : "New sessions will surface here the moment a visitor arrives"
                  }
                </div>
              </div>
            ) : mapPanelSessions.map(s => {
              const isActive  = (now - new Date(s.last_seen_at)) < ACTIVE_MS;
              const isSel     = selected?.session_id === s.session_id;
              const tier      = getAlertTier(s, viewEvents);
              const tm        = tier ? TIER_META[tier] : null;
              const convStage = getConversionStage(s, viewEvents, engagedIds);
              const convMeta  = convStage ? CONVERSION_META[convStage] : null;
              // Left border: conversion stage takes priority over tier
              const accentColor = convMeta?.color || tm?.color;

              return (
                <div
                  key={s.session_id}
                  onClick={() => setSelected(isSel ? null : s)}
                  style={{
                    padding: "10px 12px",
                    borderBottom: `1px solid ${border}`,
                    borderLeft: isSel
                      ? `3px solid ${accentColor || GOLD}`
                      : accentColor ? `3px solid ${accentColor}60` : "3px solid transparent",
                    borderBottom: `1px solid ${rowBorder}`,
                    background: isSel
                      ? rowSelBg || `${accentColor || GOLD}0a`
                      : convStage === "submitted" ? (isLight ? "rgba(5,150,105,0.05)" : "rgba(16,185,129,0.03)")
                      : convStage === "started"   ? (isLight ? "rgba(6,182,212,0.05)" : "rgba(6,182,212,0.03)")
                      : tier ? `${tm.color}06` : "transparent",
                    boxShadow: isSel && isLight ? "inset 0 0 0 1px rgba(201,168,76,0.25)" : "none",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {/* Row 1: Location + Live badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0 }}>
                      <span style={{ fontSize: 13, flexShrink: 0 }}>{flag(s.country_code)}</span>
                      <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {resolveLocation(s).primary}
                      </span>
                      {s.region && s.city && (
                        <span style={{ fontFamily: NU, fontSize: 9, color: grey2, flexShrink: 0 }}>{s.region}</span>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.6px",
                      color: isActive ? GOLD : grey2,
                      background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
                      borderRadius: 8, padding: "2px 7px", marginLeft: 6,
                    }}>
                      {isActive ? "● LIVE" : timeAgo(s.last_seen_at)}
                    </span>
                  </div>

                  {/* Row 2: Current page */}
                  <div style={{ fontFamily: NU, fontSize: 10, color: grey, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {shortPath(s.current_path)}
                  </div>

                  {/* Row 3: Badges (tier + conversion) */}
                  <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 6, flexWrap: "wrap" }}>
                    {convMeta && (
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.6px",
                        color: convMeta.color, background: `${convMeta.color}20`,
                        borderRadius: 4, padding: "2px 7px",
                        border: `1px solid ${convMeta.color}45`,
                        textTransform: "uppercase", whiteSpace: "nowrap",
                      }}>
                        {convMeta.icon} {convMeta.label}
                      </span>
                    )}
                    {tm && (
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.7px",
                        color: tm.color, background: `${tm.color}22`,
                        borderRadius: 4, padding: "2px 7px",
                        border: `1px solid ${tm.color}45`,
                        textTransform: "uppercase", whiteSpace: "nowrap",
                      }}>
                        {tm.label}
                      </span>
                    )}
                    {!tm && !convMeta && s.intent_count > 0 && (
                      <span style={{
                        fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.6px",
                        color: AMBER, background: `${AMBER}15`,
                        borderRadius: 4, padding: "2px 7px",
                        border: `1px solid ${AMBER}30`,
                        textTransform: "uppercase",
                      }}>
                        {s.intent_count} Signal{s.intent_count !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>

                  {/* Row 4: Meta + Engage button */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
                    <div style={{ display: "flex", gap: 5, fontFamily: NU, fontSize: 10, color: grey2, alignItems: "center", flexWrap: "wrap" }}>
                      <span style={{ color: grey }}>
                        {s.first_seen_at
                          ? new Date(s.first_seen_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                          : "—"}
                      </span>
                      <span>·</span>
                      <span style={{ color: grey }}>{duration(s.first_seen_at)}</span>
                      <span>·</span>
                      <span>{s.page_count || 1}pg</span>
                      {s.device_type && <><span>·</span><span>{s.device_type}</span></>}
                    </div>
                    <button
                      onClick={e => { e.stopPropagation(); setEngageTarget(s); }}
                      style={{
                        flexShrink: 0, fontFamily: NU, fontSize: 8, fontWeight: 700,
                        letterSpacing: "0.5px", textTransform: "uppercase",
                        color: GOLD, background: "rgba(201,168,76,0.10)",
                        border: `1px solid ${GOLD}40`, borderRadius: 3,
                        padding: "2px 8px", cursor: "pointer", transition: "all 0.15s",
                        whiteSpace: "nowrap",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.20)"; }}
                      onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.10)"; }}
                    >
                      ⚡ Engage
                    </button>
                  </div>
                </div>
              );
            })}

            {/* No-geo count footer */}
            {noGeoCount > 0 && (
              <div style={{
                padding: "8px 14px",
                borderTop: `1px solid ${border}`,
                fontFamily: NU, fontSize: 9, color: grey2,
                letterSpacing: "0.3px", textAlign: "center",
              }}>
                {noGeoCount} session{noGeoCount !== 1 ? "s" : ""} without location data — not shown on map
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Table view ───────────────────────────────────────────────────── */}
      {viewMode === "table" && (
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>

          {/* 🔴 Priority Spotlight — top 3 priority sessions, visually dominant */}
          {prioritySessions.length > 0 && (
            <div style={{
              flexShrink: 0,
              background: "linear-gradient(180deg, rgba(239,68,68,0.10) 0%, rgba(239,68,68,0.04) 100%)",
              borderBottom: `1px solid ${RED}30`,
              padding: "10px 16px",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 9 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: RED, boxShadow: `0 0 6px ${RED}`, animation: "lwd-pulse 1s infinite", flexShrink: 0 }} />
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: RED }}>
                  Priority · {prioritySessions.length} session{prioritySessions.length !== 1 ? "s" : ""} need attention
                </span>
              </div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                {prioritySessions.slice(0, 3).map(s => {
                  const loc = resolveLocation(s);
                  const isActive = (now - new Date(s.last_seen_at)) < ACTIVE_MS;
                  return (
                    <div
                      key={s.session_id}
                      onClick={() => setSelected(s)}
                      style={{
                        flex: "1 1 220px", maxWidth: 300,
                        background: `${RED}08`,
                        border: `1px solid ${RED}40`,
                        borderRadius: 6, padding: "11px 14px",
                        cursor: "pointer", transition: "all 0.15s",
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = `${RED}14`; e.currentTarget.style.borderColor = `${RED}60`; }}
                      onMouseLeave={e => { e.currentTarget.style.background = `${RED}08`; e.currentTarget.style.borderColor = `${RED}40`; }}
                    >
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          <span style={{ fontSize: 15 }}>{flag(s.country_code)}</span>
                          <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: white }}>{loc.primary}</span>
                          {loc.secondary && <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>{loc.secondary}</span>}
                        </div>
                        {isActive && <span style={{ width: 5, height: 5, borderRadius: "50%", background: RED, boxShadow: `0 0 5px ${RED}`, animation: "lwd-pulse 1s infinite" }} />}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", marginBottom: 7 }}>
                        {shortPath(s.current_path)}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>
                          {s.page_count || 1} pages · {duration(s.first_seen_at)}
                        </span>
                        <button
                          onClick={e => { e.stopPropagation(); setEngageTarget(s); }}
                          style={{
                            fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                            textTransform: "uppercase", color: RED,
                            background: `${RED}15`, border: `1px solid ${RED}45`,
                            borderRadius: 4, padding: "2px 9px", cursor: "pointer",
                          }}
                        >
                          ⚡ Engage
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 🔥 High Intent spotlight strip */}
          {urgentSessions.length > 0 && (
            <div style={{
              flexShrink: 0,
              background: "rgba(239,68,68,0.05)",
              borderBottom: `1px solid rgba(239,68,68,0.2)`,
              padding: "7px 16px",
              display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap",
            }}>
              <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: RED, letterSpacing: "0.6px", textTransform: "uppercase", flexShrink: 0 }}>
                🔥 High Intent · {urgentSessions.length} now
              </span>
              {urgentSessions.slice(0, 5).map(s => {
                const tier = getAlertTier(s, viewEvents);
                const tm   = TIER_META[tier];
                const isActive = (now - new Date(s.last_seen_at)) < ACTIVE_MS;
                return (
                  <button
                    key={s.session_id}
                    onClick={() => setSelected(s)}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      padding: "3px 10px", cursor: "pointer",
                      background: `${tm.color}18`,
                      border: `1px solid ${tm.color}45`,
                      borderRadius: 4, transition: "all 0.15s",
                    }}
                  >
                    <span style={{ fontSize: 12 }}>{flag(s.country_code)}</span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: white }}>
                      {s.city || s.country_name || s.country_code || "Unknown"}
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: tm.color, letterSpacing: "0.5px", textTransform: "uppercase" }}>
                      {tm.label}
                    </span>
                    {isActive && (
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD, boxShadow: `0 0 4px ${GOLD}` }} />
                    )}
                  </button>
                );
              })}
              {urgentSessions.length > 5 && (
                <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>+{urgentSessions.length - 5} more</span>
              )}
            </div>
          )}

          {/* Filter bar */}
          <div style={{ flexShrink: 0, display: "flex", alignItems: "center", gap: 6, padding: "6px 14px", borderBottom: `1px solid ${border}`, flexWrap: "wrap", background: isLight ? "rgba(0,0,0,0.015)" : "rgba(255,255,255,0.01)" }}>

            {/* Search */}
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search location, ISP, page…"
              style={{
                flex: "1 1 160px", minWidth: 120, maxWidth: 220,
                background: surfaceMid, border: `1px solid ${border}`,
                borderRadius: 4, padding: "4px 10px",
                fontFamily: NU, fontSize: 11, color: white, outline: "none",
              }}
            />

            {/* Tier */}
            {[
              { key: "all", label: "All Tiers" },
              { key: "priority", label: "Priority", color: RED },
              { key: "hot",      label: "Hot",      color: ORANGE },
              { key: "warm",     label: "Warm",     color: AMBER },
              { key: "active",   label: "Active",   color: GOLD },
            ].map(f => (
              <button key={f.key} onClick={() => setFilterTier(f.key)} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                textTransform: "uppercase", padding: "3px 9px", cursor: "pointer",
                border: `1px solid ${filterTier === f.key ? (f.color || GOLD) + "70" : border}`,
                borderRadius: 4,
                background: filterTier === f.key ? `${f.color || GOLD}18` : "transparent",
                color: filterTier === f.key ? (f.color || GOLD) : grey2,
                transition: "all 0.12s",
              }}>{f.label}</button>
            ))}

            <span style={{ width: 1, height: 14, background: border, flexShrink: 0 }} />

            {/* Source */}
            {["all","search","social","direct","referral","paid","email"].map(f => (
              <button key={f} onClick={() => setFilterSource(f)} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                textTransform: "uppercase", padding: "3px 9px", cursor: "pointer",
                border: `1px solid ${filterSource === f ? GOLD + "50" : border}`,
                borderRadius: 4,
                background: filterSource === f ? "rgba(201,168,76,0.12)" : "transparent",
                color: filterSource === f ? GOLD : grey2,
                transition: "all 0.12s",
              }}>{f === "all" ? "All Sources" : f}</button>
            ))}

            <span style={{ width: 1, height: 14, background: border, flexShrink: 0 }} />

            {/* Device */}
            {["all","desktop","mobile","tablet"].map(f => (
              <button key={f} onClick={() => setFilterDevice(f)} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                textTransform: "uppercase", padding: "3px 9px", cursor: "pointer",
                border: `1px solid ${filterDevice === f ? GOLD + "50" : border}`,
                borderRadius: 4,
                background: filterDevice === f ? "rgba(201,168,76,0.12)" : "transparent",
                color: filterDevice === f ? GOLD : grey2,
                transition: "all 0.12s",
              }}>{f === "all" ? "All Devices" : f}</button>
            ))}

            {/* Clear all */}
            {filtersActive && (
              <button onClick={() => { setFilterTier("all"); setFilterSource("all"); setFilterDevice("all"); setSearchQuery(""); }} style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px",
                textTransform: "uppercase", padding: "3px 9px", cursor: "pointer",
                border: `1px solid rgba(239,68,68,0.4)`, borderRadius: 4,
                background: "rgba(239,68,68,0.08)", color: RED, transition: "all 0.12s",
              }}>✕ Clear</button>
            )}
            {filtersActive && (
              <span style={{ fontFamily: NU, fontSize: 10, color: grey2, marginLeft: 4 }}>
                {displaySessions.length} match{displaySessions.length !== 1 ? "es" : ""}
              </span>
            )}
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed", minWidth: 900 }}>
            <colgroup>
              {colOrder.map(key => <col key={key} style={{ width: colWidths[key] }} />)}
            </colgroup>
            <thead>
              <tr style={{ background: theadBg, borderBottom: `2px solid ${C?.border2 || border}`, position: "sticky", top: 0, zIndex: 5, boxShadow: theadShadow }}>
                {colOrder.map(colKey => {
                  const col          = COLS.find(c => c.key === colKey);
                  const isSortActive = col.sortCol && sortCol === col.sortCol;
                  const isDragOver   = dragOverCol === colKey && dragCol !== colKey;
                  return (
                    <th
                      key={colKey}
                      draggable={colKey !== "actions"}
                      onDragStart={e => handleDragStart(e, colKey)}
                      onDragOver={e  => handleDragOver(e, colKey)}
                      onDragLeave={handleDragLeave}
                      onDrop={e      => handleDrop(e, colKey)}
                      onDragEnd={handleDragEnd}
                      onClick={() => col.sortCol && toggleSort(col.sortCol)}
                      style={{
                        padding: isLight ? "10px 12px 10px 10px" : "9px 12px 9px 10px",
                        textAlign: "left", userSelect: "none",
                        fontFamily: NU, fontSize: isLight ? 10 : 9, fontWeight: 800,
                        letterSpacing: "0.7px", textTransform: "uppercase",
                        color: isSortActive ? GOLD : isLight ? (C?.grey || "#444444") : grey2,
                        cursor: col.sortCol ? "pointer" : colKey !== "actions" ? "grab" : "default",
                        borderRight: `1px solid ${C?.border2 || border}`,
                        borderLeft: isDragOver ? `2px solid ${GOLD}` : "none",
                        background: isDragOver ? "rgba(201,168,76,0.07)" : "transparent",
                        position: "relative", whiteSpace: "nowrap",
                        transition: "background 0.1s",
                        opacity: dragCol === colKey ? 0.4 : 1,
                      }}
                    >
                      {col.label}
                      {isSortActive && <span style={{ marginLeft: 4, fontSize: 8 }}>{sortDir === "desc" ? "▼" : "▲"}</span>}
                      {!isSortActive && col.sortCol && <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.25 }}>⇅</span>}
                      {/* Resize handle */}
                      {colKey !== "actions" && (
                        <div
                          onMouseDown={e => startResize(e, colKey)}
                          onClick={e => e.stopPropagation()}
                          style={{
                            position: "absolute", right: 0, top: 0, bottom: 0, width: 6,
                            cursor: "col-resize", zIndex: 2, background: "transparent",
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = `${GOLD}60`}
                          onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                        />
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {displaySessions.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{
                    padding: "50px 20px", textAlign: "center",
                    fontFamily: NU, fontSize: 12, color: grey2,
                  }}>
                    {filtersActive ? "No sessions match your filters" : "No sessions in the last 30 minutes"}
                  </td>
                </tr>
              ) : displaySessions.map((s, idx) => {
                const lastSeenMs = now - new Date(s.last_seen_at);
                const isActive   = lastSeenMs < ACTIVE_MS;           // < 90s
                const isIdle     = lastSeenMs >= ACTIVE_MS && lastSeenMs < 5 * 60_000; // 90s–5m
                const rowOpacity = isIdle ? 0.72 : lastSeenMs >= 5 * 60_000 ? 0.48 : 1;
                const isSel      = selected?.session_id === s.session_id;
                const tier       = getAlertTier(s, viewEvents);
                const tm         = tier ? TIER_META[tier] : null;
                const leftClr    = tm?.color || (isActive ? GOLD : "transparent");
                const src        = classifySource(s.referrer, s.utm_source, s.utm_medium, s.utm_campaign);
                const loc        = resolveLocation(s);

                // Journey: last 3 page_view paths for this session
                const journey = viewEvents
                  .filter(e => e.session_id === s.session_id && e.event_type === "page_view")
                  .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                  .map(e => shortPath(e.path));
                const journeyStr = journey.length > 1
                  ? (journey.length > 3 ? "… → " : "") + journey.slice(-3).join(" → ")
                  : null;

                // Conversion stage + browse signals
                const convStage    = getConversionStage(s, viewEvents, engagedIds);
                const convMeta     = convStage ? CONVERSION_META[convStage] : null;
                const isDeepBrowse = (s.page_count || 0) >= 6;
                const isReturning  = s.utm_medium?.toLowerCase() === "email"
                  || (s.referrer || "").includes("luxurywedding");
                // Conversion outcome takes priority over browse signals
                const sessionBadge = convMeta
                  ? { label: `${convMeta.icon} ${convMeta.label}`, color: convMeta.color }
                  : isReturning    ? { label: "Return",  color: "#06b6d4" }
                  : isDeepBrowse   ? { label: "Deep",    color: GOLD }
                  : null;

                return (
                  <tr
                    key={s.session_id}
                    onClick={() => setSelected(isSel ? null : s)}
                    style={{
                      borderBottom: `1px solid ${border}`,
                      borderLeft: `3px solid ${leftClr}`,
                      background: isSel
                        ? rowSelBg || `${tm?.color || GOLD}12`
                        : idx % 2 === 0 ? rowEven : rowOdd,
                      boxShadow: isSel
                        ? isLight
                          ? `inset 0 0 0 2px ${tm?.color || GOLD}60`
                          : `inset 0 0 0 1px ${tm?.color || GOLD}25`
                        : "none",
                      borderBottom: `1px solid ${rowBorder}`,
                      cursor: "pointer",
                      opacity: isSel ? 1 : rowOpacity,
                      transition: "background 0.12s, opacity 0.3s, box-shadow 0.12s",
                    }}
                    onMouseEnter={e => {
                      if (!isSel) e.currentTarget.style.background = rowHover;
                    }}
                    onMouseLeave={e => {
                      if (!isSel) e.currentTarget.style.background =
                        idx % 2 === 0 ? rowEven : rowOddLeave;
                    }}
                  >
                    {colOrder.map(colKey => getCellContent(colKey, s, { isActive, isSel, tier, tm, src, loc, journeyStr, sessionBadge, idx, convStage, convMeta }))}
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>{/* end scroll wrapper */}
        </div>
      )}

      {/* ── Intelligence panel — tabbed ──────────────────────────────────── */}
      <div style={{ borderTop: `1px solid ${border}`, flexShrink: 0, background: card }}>

        {/* Tab bar */}
        <div style={{ display: "flex", borderBottom: `1px solid ${border}` }}>
          {[
            { key: "pages",     label: "Pages",     count: topPages.length },
            { key: "countries", label: "Countries", count: topCountries.length },
            { key: "isps",      label: "ISPs",      count: topISPs.length },
            { key: "signals",   label: "Signals",   count: intentEvts.length },
            { key: "funnel",    label: "Funnel",    count: funnelSubmitted > 0 ? funnelSubmitted : null },
          ].map(tab => {
            const isActive = activeIntelTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveIntelTab(tab.key)}
                style={{
                  flex: 1, padding: "9px 8px",
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.6px", textTransform: "uppercase",
                  cursor: "pointer", border: "none", transition: "all 0.15s",
                  borderBottom: isActive ? `2px solid ${GOLD}` : "2px solid transparent",
                  background: isActive ? "rgba(201,168,76,0.06)" : "transparent",
                  color: isActive ? GOLD : grey2,
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5,
                }}
              >
                {tab.label}
                {tab.count > 0 && (
                  <span style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700,
                    color: isActive ? GOLD : grey2,
                    background: isActive ? "rgba(201,168,76,0.15)" : tagBg,
                    borderRadius: 8, padding: "0px 5px", lineHeight: "16px",
                  }}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        <div style={{ padding: "12px 18px", maxHeight: 190, overflowY: "auto" }}>

          {/* Selected session context indicator */}
          {selected && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10, paddingBottom: 8, borderBottom: `1px solid ${border}` }}>
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.6px", textTransform: "uppercase", color: GOLD }}>
                {flag(selected.country_code)} {selected.city || selected.country_name || "Session"} — selected
              </span>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: NU, fontSize: 9, color: grey2, padding: 0 }}>
                ← All sessions
              </button>
            </div>
          )}

          {/* Pages — aggregate or session journey */}
          {activeIntelTab === "pages" && (() => {
            if (selected) {
              // Show this session's page journey
              const sessionPages = viewEvents
                .filter(e => e.session_id === selected.session_id && e.event_type === "page_view")
                .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
              return sessionPages.length === 0
                ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2 }}>No page events recorded yet for this session</div>
                : sessionPages.map((e, i) => (
                  <div key={e.id || i} style={S.row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1, marginRight: 8, overflow: "hidden" }}>
                      <span style={{ fontFamily: NU, fontSize: 10, color: grey2, flexShrink: 0 }}>{i + 1}</span>
                      <span style={S.rowLabel}>{shortPath(e.path)}</span>
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: grey2, flexShrink: 0 }}>{timeAgo(e.created_at)}</div>
                  </div>
                ));
            }
            return topPages.length === 0
              ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>Active pages will surface as visitors navigate the site</div>
              : topPages.map(([path, count]) => (
                <div key={path} style={S.row}>
                  <div style={S.rowLabel}>{shortPath(path)}</div>
                  <div style={S.rowVal}>{count}</div>
                </div>
              ));
          })()}

          {/* Countries */}
          {activeIntelTab === "countries" && (
            topCountries.length === 0
              ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>Visitor origin will appear as sessions arrive</div>
              : topCountries.map(([cc, count]) => (
                <div key={cc} style={S.row}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, marginRight: 8, overflow: "hidden" }}>
                    <span style={{ fontSize: 15, flexShrink: 0 }}>{flag(cc)}</span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cc}</span>
                  </div>
                  <div style={S.rowVal}>{count}</div>
                </div>
              ))
          )}

          {/* ISPs */}
          {activeIntelTab === "isps" && (
            topISPs.length === 0
              ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>ISP and carrier data will appear once geo is resolved for sessions</div>
              : topISPs.map(([isp, count]) => (
                <div key={isp} style={S.row}>
                  <div style={S.rowLabel}>{isp}</div>
                  <div style={S.rowVal}>{count}</div>
                </div>
              ))
          )}

          {/* Signals — session or global */}
          {activeIntelTab === "signals" && (() => {
            const evtPool = selected
              ? viewEvents.filter(e => e.session_id === selected.session_id && INTENT_TYPES.includes(e.event_type))
              : intentEvts.slice(0, 12);
            return evtPool.length === 0
              ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>
                  {selected ? "No intent signals from this session yet" : "Signals surface when visitors shortlist, compare, or enquire"}
                </div>
              : evtPool.map((e, i) => {
                const meta = INTENT_META[e.event_type] || { label: e.event_type, color: grey };
                return (
                  <div key={e.id || i} style={S.row}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, marginRight: 8, overflow: "hidden" }}>
                      <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, boxShadow: `0 0 4px ${meta.color}`, flexShrink: 0 }} />
                      <span style={{ fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
                      {e.path && <span style={{ fontFamily: NU, fontSize: 10, color: grey2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>· {shortPath(e.path)}</span>}
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: grey2, flexShrink: 0 }}>{timeAgo(e.created_at)}</div>
                  </div>
                );
              });
          })()}

          {/* Funnel — conversion pipeline for last 30 min */}
          {activeIntelTab === "funnel" && (() => {
            const stagesCtx = selected
              ? null  // per-session: show their stage
              : null; // aggregate funnel

            if (selected) {
              // Per-session conversion timeline
              const stg  = getConversionStage(selected, viewEvents, engagedIds);
              const meta = stg ? CONVERSION_META[stg] : null;
              const sessionEvtTypes = viewEvents
                .filter(e => e.session_id === selected.session_id)
                .map(e => e.event_type);
              return (
                <div>
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: grey2, marginBottom: 10 }}>
                    Session Outcome
                  </div>
                  {[
                    { key: "shortlisted", reached: sessionEvtTypes.includes("shortlist_add") || sessionEvtTypes.includes("compare_add") },
                    { key: "engaged",     reached: engagedIds.has(selected.session_id) },
                    { key: "started",     reached: sessionEvtTypes.includes("enquiry_started") || sessionEvtTypes.includes("enquiry_submitted") },
                    { key: "submitted",   reached: sessionEvtTypes.includes("enquiry_submitted") },
                  ].map(({ key, reached }) => {
                    const m = CONVERSION_META[key];
                    return (
                      <div key={key} style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                        <span style={{
                          width: 20, height: 20, borderRadius: "50%",
                          background: reached ? `${m.color}25` : surfaceMid,
                          border: `1px solid ${reached ? m.color : dotEmpty}`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 10, color: reached ? m.color : grey2, flexShrink: 0,
                        }}>{reached ? m.icon : "○"}</span>
                        <span style={{ fontFamily: NU, fontSize: 11, color: reached ? white : grey2 }}>
                          {m.label}
                        </span>
                        {reached && key === stg && (
                          <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.5px", color: m.color, background: `${m.color}15`, borderRadius: 3, padding: "1px 6px", border: `1px solid ${m.color}30` }}>
                            Current
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            }

            // Aggregate funnel
            const funnelStages = [
              { key: "total",       label: "All Sessions",      count: funnelTotal,       color: grey2,      pct: 100 },
              { key: "shortlisted", label: "Shortlisted",       count: funnelShortlisted, color: "#8b5cf6",  pct: funnelTotal ? Math.round(funnelShortlisted / funnelTotal * 100) : 0 },
              { key: "engaged",     label: "Aura Engaged",      count: funnelEngaged,     color: GOLD,       pct: funnelTotal ? Math.round(funnelEngaged / funnelTotal * 100) : 0 },
              { key: "started",     label: "Enquiry Started",   count: funnelStarted,     color: "#06b6d4",  pct: funnelTotal ? Math.round(funnelStarted / funnelTotal * 100) : 0 },
              { key: "submitted",   label: "Enquiry Submitted", count: funnelSubmitted,   color: "#10b981",  pct: funnelTotal ? Math.round(funnelSubmitted / funnelTotal * 100) : 0 },
            ];

            return funnelTotal === 0
              ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>Funnel data will surface as sessions arrive</div>
              : (
                <div>
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: grey2, marginBottom: 10 }}>
                    Last 30 min · {funnelTotal} sessions
                  </div>
                  {funnelStages.map((stage, i) => (
                    <div key={stage.key} style={{ marginBottom: i === 0 ? 10 : 7 }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                          {i > 0 && (
                            <span style={{ width: 6, height: 6, borderRadius: "50%", background: stage.color, boxShadow: `0 0 4px ${stage.color}`, flexShrink: 0 }} />
                          )}
                          <span style={{ fontFamily: NU, fontSize: 11, color: i === 0 ? grey2 : grey }}>{stage.label}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: stage.count > 0 ? stage.color : grey2 }}>
                            {stage.count}
                          </span>
                          {i > 0 && (
                            <span style={{ fontFamily: NU, fontSize: 10, color: grey2, minWidth: 30, textAlign: "right" }}>
                              {stage.pct}%
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Bar */}
                      {i > 0 && (
                        <div style={{ height: 3, borderRadius: 2, background: surfaceLine, overflow: "hidden" }}>
                          <div style={{
                            height: "100%", borderRadius: 2,
                            width: `${stage.pct}%`,
                            background: stage.color,
                            boxShadow: stage.count > 0 ? `0 0 6px ${stage.color}60` : "none",
                            transition: "width 0.4s ease",
                          }} />
                        </div>
                      )}
                    </div>
                  ))}
                  {funnelSubmitted > 0 && (
                    <div style={{
                      marginTop: 14, padding: "8px 12px",
                      background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)",
                      borderRadius: 5, fontFamily: NU, fontSize: 11, color: "#10b981", lineHeight: 1.5,
                    }}>
                      ✓ {funnelSubmitted} enquir{funnelSubmitted === 1 ? "y" : "ies"} submitted today — {funnelTotal > 0 ? Math.round(funnelSubmitted / funnelTotal * 100) : 0}% session conversion rate
                    </div>
                  )}
                </div>
              );
          })()}
        </div>
      </div>

      {/* ── Engage panel ─────────────────────────────────────────────────── */}
      {engageTarget && (() => {
        const et     = engageTarget;
        const tier   = getAlertTier(et, viewEvents);
        const tm     = tier ? TIER_META[tier] : null;
        const src    = classifySource(et.referrer, et.utm_source, et.utm_medium, et.utm_campaign);
        const loc    = [et.city, et.region, et.country_name].filter(Boolean).join(", ") || et.country_code || "Unknown";
        const pages  = viewEvents.filter(e => e.session_id === et.session_id && e.event_type === "page_view")
          .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
          .map(e => shortPath(e.path));
        const journeyLine = pages.length > 0 ? pages.slice(-4).join(" → ") : shortPath(et.current_path);

        const etLoc     = resolveLocation(et);
        const deviceStr = et.device_type ? et.device_type.toLowerCase() : "unknown device";
        const browserStr = (et.browser && et.browser !== "Other" && et.browser !== "Unknown") ? ` (${et.browser})` : "";
        const pageStr   = shortPath(et.current_path);
        const tierStr   = tier ? `${tm.label.toLowerCase()} intent` : "browsing";
        const srcStr    = src.category !== "Direct" ? `Source: ${src.label} (${src.category}).` : "";
        const journeyFull = pages.length > 1 ? `Journey: ${pages.slice(-4).join(" → ")}.` : "";

        const auraPrompt = [
          `Visitor browsing from ${etLoc.full} on ${deviceStr}${browserStr}.`,
          `${et.page_count || 1} page${et.page_count !== 1 ? "s" : ""} viewed, currently on ${pageStr}.`,
          journeyFull,
          srcStr,
          `${tierStr.charAt(0).toUpperCase() + tierStr.slice(1)}.`,
        ].filter(Boolean).join(" ");

        const handleEngage = () => {
          localStorage.setItem("lwd_aura_engage", JSON.stringify({
            ts: Date.now(), prompt: auraPrompt,
            session: { city: et.city, country: et.country_name, tier, pages: et.page_count, currentPage: et.current_path },
          }));
          markEngaged(et.session_id);
          window.open("/", "_blank");
        };

        const handleCopy = () => {
          navigator.clipboard.writeText(auraPrompt).then(() => {
            setEngageCopied(true);
            setTimeout(() => setEngageCopied(false), 2000);
          });
        };

        return (
          <div style={{
            position: "fixed", bottom: 0, left: 0, right: 0,
            background: engageBarBg, borderTop: `3px solid ${GOLD}`,
            zIndex: 300, padding: "18px 24px",
            boxShadow: isLight ? "0 -6px 24px rgba(0,0,0,0.12)" : "0 -8px 40px rgba(0,0,0,0.6)",
            animation: "lwd-engage-in 0.25s ease",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 20, maxWidth: 1100 }}>

              {/* Session summary */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                  <span style={{ fontFamily: GD, fontSize: 15, fontWeight: 500, color: white }}>
                    {flag(et.country_code)} {etLoc.full}
                  </span>
                  {tm && (
                    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", color: tm.color, background: `${tm.color}20`, border: `1px solid ${tm.color}40`, borderRadius: 4, padding: "2px 7px" }}>
                      {tm.label}
                    </span>
                  )}
                  <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>
                    {et.page_count || 1} pages · {duration(et.first_seen_at)} · {et.device_type || "Unknown device"}
                  </span>
                </div>

                {/* Aura prompt preview */}
                <div style={{
                  fontFamily: NU, fontSize: 11, color: grey,
                  background: "rgba(201,168,76,0.05)",
                  border: `1px solid ${GOLD}25`,
                  borderRadius: 5, padding: "9px 14px",
                  lineHeight: 1.6,
                }}>
                  <span style={{ color: grey2, fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.6px", display: "block", marginBottom: 4 }}>Aura context</span>
                  {auraPrompt}
                </div>

                {/* Journey */}
                {pages.length > 1 && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: grey2, marginTop: 7, letterSpacing: "0.2px" }}>
                    Journey: {journeyLine}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8, flexShrink: 0 }}>
                <button
                  onClick={handleEngage}
                  style={{
                    fontFamily: NU, fontSize: 11, fontWeight: 800, letterSpacing: "0.5px",
                    color: isLight ? "#FFFFFF" : bg,
                    background: isLight
                      ? "linear-gradient(135deg, #B8962A, #8E6E12)"
                      : `linear-gradient(135deg, ${GOLD}, #a07a28)`,
                    border: isLight ? "1px solid #8E6E12" : "none",
                    borderRadius: 5, padding: "10px 22px",
                    cursor: "pointer", whiteSpace: "nowrap",
                    boxShadow: isLight ? "0 2px 8px rgba(0,0,0,0.20)" : "none",
                  }}
                >
                  ⚡ Open Aura with Context
                </button>
                <button
                  onClick={handleCopy}
                  style={{
                    fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: "0.5px",
                    color: engageCopied ? "#10b981" : GOLD,
                    background: engageCopied ? "rgba(16,185,129,0.10)" : "rgba(201,168,76,0.08)",
                    border: `1px solid ${engageCopied ? "#10b981" : GOLD}40`,
                    borderRadius: 5, padding: "9px 20px",
                    cursor: "pointer", whiteSpace: "nowrap", transition: "all 0.2s",
                  }}
                >
                  {engageCopied ? "✓ Copied" : "Copy Context"}
                </button>
                <button
                  onClick={() => setEngageTarget(null)}
                  style={{
                    fontFamily: NU, fontSize: 10, color: grey2, background: "none",
                    border: "none", cursor: "pointer", padding: "4px 0", textAlign: "center",
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Session detail drawer ────────────────────────────────────────── */}
      {selected && (() => {
        const tier = getAlertTier(selected, events);
        const tm   = tier ? TIER_META[tier] : null;
        return (
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 360,
            background: drawerBg, borderLeft: `2px solid ${C?.border2 || border}`,
            zIndex: 200, display: "flex", flexDirection: "column",
            boxShadow: isLight ? "-4px 0 24px rgba(0,0,0,0.10)" : "-8px 0 40px rgba(0,0,0,0.5)",
          }}>
            <div style={{ padding: "16px 20px", borderBottom: `1px solid ${tm?.color || border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: GD, fontSize: 16, fontWeight: 500, color: white }}>Session Detail</span>
                {(now - new Date(selected.last_seen_at)) < ACTIVE_MS && (
                  <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: "0.8px", textTransform: "uppercase" }}>● Live</span>
                )}
                {tm && (
                  <span style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.7px",
                    color: tm.color, background: `${tm.color}20`,
                    border: `1px solid ${tm.color}50`,
                    borderRadius: 4, padding: "2px 8px", textTransform: "uppercase",
                  }}>
                    {tm.label}
                  </span>
                )}
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: grey, fontSize: 18, lineHeight: 1 }}>✕</button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
              {[
                ["Location",      [selected.city, selected.region, selected.country_code].filter(Boolean).join(", ") || "Unknown"],
                ["Country",       selected.country_name || selected.country_code || "—"],
              ["ISP / Carrier", selected.isp || "—"],
                ["Current Page",  shortPath(selected.current_path)],
                ["Entry Page",    selected.entry_path ? shortPath(selected.entry_path) : "—"],
                ["Source",        selected.referrer || "Direct"],
                ["UTM Source",    selected.utm_source || "—"],
                ["Device",        selected.device_type || "—"],
                ["Browser",       selected.browser || "—"],
                ["OS",            selected.os || "—"],
                ["Pages Viewed",  selected.page_count],
                ["Intent Events", selected.intent_count || 0],
                ["Duration",      duration(selected.first_seen_at)],
                ["Last Seen",     timeAgo(selected.last_seen_at)],
                ["Started",       new Date(selected.first_seen_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
              ].map(([label, value]) => (value !== null && value !== undefined && value !== "—") ? (
                <div key={label} style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.8px", textTransform: "uppercase", color: grey2, marginBottom: 3 }}>{label}</div>
                  <div style={{ fontFamily: NU, fontSize: 13, color: white }}>{value}</div>
                </div>
              ) : null)}

              {/* Session journey — recent events */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${border}` }}>
                <div style={{ ...S.sectionTitle, marginBottom: 12 }}>Journey</div>
                {events
                  .filter(e => e.session_id === selected.session_id)
                  .slice(0, 12)
                  .map((e, i) => {
                    const meta = INTENT_META[e.event_type];
                    const isIntent = !!meta;
                    return (
                      <div key={e.id || i} style={{ display: "flex", gap: 10, marginBottom: 10, alignItems: "flex-start" }}>
                        <span style={{
                          width: isIntent ? 8 : 6, height: isIntent ? 8 : 6,
                          borderRadius: "50%",
                          background: meta?.color || border,
                          marginTop: isIntent ? 3 : 4, flexShrink: 0,
                          boxShadow: isIntent ? `0 0 6px ${meta.color}` : "none",
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontFamily: NU, fontSize: 11, color: isIntent ? white : grey }}>
                            {meta?.label || shortPath(e.path)}
                          </div>
                          <div style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>
                            {isIntent ? shortPath(e.path) + " · " : ""}{timeAgo(e.created_at)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {events.filter(e => e.session_id === selected.session_id).length === 0 && (
                  <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>
                    Journey events will appear<br/>as this session navigates
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
