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

// Map style — CARTO Dark Matter (free, no API key)
// Override with VITE_MAP_STYLE_URL for MapTiler / Stadia in production
const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ||
  "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

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

// ── Alert tier metadata ──────────────────────────────────────────────────────

const TIER_META = {
  warm:     { label: "Warm Lead",     color: AMBER,  dot: AMBER,  rank: 1 },
  hot:      { label: "Hot Lead",      color: ORANGE, dot: ORANGE, rank: 2 },
  priority: { label: "Priority",      color: RED,    dot: RED,    rank: 3 },
};

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

// ── Pulsing marker element ────────────────────────────────────────────────────
// tier: null | 'warm' | 'hot' | 'priority'

function makePulseEl(isActive, tier) {
  const tierColor  = tier ? TIER_META[tier].color : null;
  const baseColor  = tierColor || (isActive ? GOLD : "rgba(201,168,76,0.3)");
  const borderClr  = tierColor
    ? `${tierColor}99`
    : isActive ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.2)";
  const size       = tier === "priority" ? 18 : tier === "hot" ? 16 : isActive ? 14 : 8;
  const glowColor  = tierColor || "rgba(201,168,76,0.6)";
  const speed      = tier === "priority" ? "1s" : "1.8s";
  const animate    = tier || isActive;

  const el = document.createElement("div");
  el.style.cssText = [
    `width:${size}px`,
    `height:${size}px`,
    "border-radius:50%",
    `background:${baseColor}`,
    `border:2px solid ${borderClr}`,
    animate
      ? `box-shadow:0 0 0 0 ${glowColor}80,0 0 ${tier ? 24 : 16}px ${glowColor}90`
      : "box-shadow:none",
    "cursor:pointer",
    animate ? `animation:lwd-pulse ${speed} infinite` : "animation:none",
    "transition:all 0.3s",
    "position:relative",
  ].join(";");

  // Extra ring for priority
  if (tier === "priority") {
    const ring = document.createElement("div");
    ring.style.cssText = [
      "position:absolute", "inset:-4px", "border-radius:50%",
      `border:1px solid ${RED}50`,
      "animation:lwd-pulse 0.8s infinite",
    ].join(";");
    el.appendChild(ring);
  }

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

  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef({});
  const alertTiersRef   = useRef({});  // sessionId → last known tier
  const audioCtxRef     = useRef(null);
  const knownSessionIds = useRef(new Set()); // for new-visitor detection

  // ── Theme ──────────────────────────────────────────────────────────────────
  const NU     = "var(--font-body,'Nunito Sans',sans-serif)";
  const GD     = "var(--font-heading-primary,'Cormorant Garamond',Georgia,serif)";
  const white  = C?.white  || "#f5f1eb";
  const grey   = C?.grey   || "rgba(245,241,235,0.45)";
  const grey2  = C?.grey2  || "rgba(245,241,235,0.28)";
  const card   = C?.card   || "rgba(255,255,255,0.04)";
  const border = C?.border || "rgba(255,255,255,0.08)";
  const bg     = C?.dark   || "#0c0a08";

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

  useEffect(() => {
    loadSessions();
    loadEvents();
  }, [loadSessions, loadEvents]);

  // ── Polling ───────────────────────────────────────────────────────────────

  useEffect(() => {
    const id = setInterval(loadSessions, REFRESH_MS);
    return () => clearInterval(id);
  }, [loadSessions]);

  // ── Supabase Realtime ─────────────────────────────────────────────────────

  useEffect(() => {
    const ch = supabase
      .channel("live-tracking-admin")
      .on("postgres_changes",
        { event: "*", schema: "public", table: "live_sessions" },
        () => loadSessions()
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
  }, [loadSessions]);

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
      style:     MAP_STYLE,
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

  // ── Map markers (tier-aware) ──────────────────────────────────────────────

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const now    = Date.now();
    const active = new Set(sessions.map(s => s.session_id));

    // Remove stale
    Object.keys(markersRef.current).forEach(id => {
      if (!active.has(id)) {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    // Add / refresh
    sessions.forEach(s => {
      const lat = s.latitude;
      const lng = s.longitude;
      if (!lat || !lng) return;

      const isActive = (now - new Date(s.last_seen_at)) < ACTIVE_MS;
      const tier     = getAlertTier(s, events);

      if (markersRef.current[s.session_id]) {
        // Marker exists — update position only (re-creating would reset animation)
        markersRef.current[s.session_id].setLngLat([lng, lat]);
        return;
      }

      const el = makePulseEl(isActive, tier);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelected(s);
      });

      markersRef.current[s.session_id] = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .addTo(map);
    });
  }, [sessions, events, mapReady, tick]);

  // ── Computed stats ────────────────────────────────────────────────────────

  const now       = Date.now();
  const activeNow = sessions.filter(s => (now - new Date(s.last_seen_at)) < ACTIVE_MS);
  const last30    = sessions;

  const hotSessions = sessions.filter(s => !!getAlertTier(s, events));
  const displaySessions = showHotOnly ? hotSessions : last30;

  const todayStart = new Date(); todayStart.setHours(0,0,0,0);
  const todayEvts  = events.filter(e => new Date(e.created_at) >= todayStart);
  const todaySess  = new Set(todayEvts.map(e => e.session_id)).size;
  const todayEnqs  = todayEvts.filter(e =>
    e.event_type === "enquiry_started" || e.event_type === "enquiry_submitted"
  ).length;

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

  // Intent signals (last hour)
  const intentEvts = events.filter(e => INTENT_TYPES.includes(e.event_type));

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
      `}</style>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 1, background: border, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
        {[
          { label: "Online Now",      value: activeNow.length,                      accent: activeNow.length > 0 },
          { label: "Last 30 Min",     value: last30.length },
          { label: "Today Sessions",  value: todaySess },
          { label: "Today Enquiries", value: todayEnqs,                             accent: todayEnqs > 0 },
          { label: "High Intent",     value: hotCount, accent: hotCount > 0,
            accentColor: hotCount > 0 ? (hotCount > 3 ? RED : ORANGE) : null },
          { label: "Top Page",        value: topPage ? shortPath(topPage) : "—",   small: true },
          { label: "Top Country",     value: topCountry,                            small: true },
        ].map(k => (
          <div key={k.label} style={{ background: card, padding: "16px 18px" }}>
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

      {/* ── Main: map + sessions ─────────────────────────────────────────── */}
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 320px", minHeight: 0, overflow: "hidden" }}>

        {/* Map */}
        <div style={{ position: "relative", background: "#080a0b" }}>
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />

          {/* Map overlay — live badge */}
          <div style={{
            position: "absolute", top: 12, left: 12,
            display: "flex", alignItems: "center", gap: 7,
            background: "rgba(10,8,6,0.75)", backdropFilter: "blur(6px)",
            border: `1px solid rgba(201,168,76,0.2)`,
            borderRadius: 4, padding: "5px 12px", pointerEvents: "none",
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: GOLD, boxShadow: `0 0 6px ${GOLD}`, animation: "lwd-pulse 2s infinite" }} />
            <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: GOLD }}>
              Live · {activeNow.length} active
            </span>
          </div>

          {/* Map legend — tier colours */}
          <div style={{
            position: "absolute", top: 12, right: 60,
            display: "flex", gap: 10, alignItems: "center",
            background: "rgba(10,8,6,0.75)", backdropFilter: "blur(6px)",
            border: `1px solid ${border}`, borderRadius: 4, padding: "5px 12px",
            pointerEvents: "none",
          }}>
            {[
              { label: "Active",   color: GOLD   },
              { label: "Warm",     color: AMBER  },
              { label: "Hot",      color: ORANGE },
              { label: "Priority", color: RED    },
            ].map(l => (
              <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: l.color, boxShadow: `0 0 6px ${l.color}` }} />
                <span style={{ fontFamily: NU, fontSize: 9, color: grey2, letterSpacing: "0.5px" }}>{l.label}</span>
              </div>
            ))}
          </div>

          {/* Sound toggle — minimal luxury */}
          <button
            onClick={toggleSound}
            title={soundOn ? "Audio on — click to silence" : "Audio off — click to enable"}
            style={{
              position: "absolute", bottom: 12, right: 12,
              display: "flex", alignItems: "center", gap: 7,
              background: "rgba(10,8,6,0.80)", backdropFilter: "blur(8px)",
              border: `1px solid ${soundOn ? "rgba(201,168,76,0.30)" : "rgba(255,255,255,0.06)"}`,
              borderRadius: 4, padding: "5px 12px", cursor: "pointer",
              transition: "all 0.25s",
            }}
          >
            {/* Indicator dot */}
            <span style={{
              width: 5, height: 5, borderRadius: "50%", flexShrink: 0,
              background: soundOn ? GOLD : "rgba(255,255,255,0.18)",
              boxShadow: soundOn ? `0 0 6px ${GOLD}` : "none",
              transition: "all 0.25s",
            }} />
            <span style={{
              fontFamily: NU, fontSize: 10, fontWeight: 600,
              letterSpacing: "1px", textTransform: "uppercase",
              color: soundOn ? GOLD : grey2,
              transition: "color 0.25s",
            }}>
              Audio
            </span>
          </button>

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

          {/* Panel header + filter toggle */}
          <div style={{ padding: "10px 14px", borderBottom: `1px solid ${border}`, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
              <span style={{ fontFamily: GD, fontSize: 15, fontWeight: 500, color: white }}>Sessions</span>
              <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>{last30.length} in 30m</span>
            </div>

            {/* Hot-only toggle */}
            <div style={{ display: "flex", borderRadius: 6, overflow: "hidden", border: `1px solid ${border}` }}>
              {[
                { key: false, label: "All" },
                { key: true,  label: `Hot ${hotCount > 0 ? `(${hotCount})` : ""}` },
              ].map(opt => (
                <button
                  key={String(opt.key)}
                  onClick={() => setShowHotOnly(opt.key)}
                  style={{
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: "0.5px", padding: "3px 10px", cursor: "pointer",
                    border: "none", transition: "all 0.15s",
                    background: showHotOnly === opt.key
                      ? (opt.key ? `${ORANGE}25` : "rgba(201,168,76,0.12)")
                      : "transparent",
                    color: showHotOnly === opt.key
                      ? (opt.key ? ORANGE : GOLD)
                      : grey2,
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {displaySessions.length === 0 ? (
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
            ) : displaySessions.map(s => {
              const isActive = (now - new Date(s.last_seen_at)) < ACTIVE_MS;
              const isSel    = selected?.session_id === s.session_id;
              const tier     = getAlertTier(s, events);
              const tm       = tier ? TIER_META[tier] : null;

              return (
                <div
                  key={s.session_id}
                  onClick={() => setSelected(isSel ? null : s)}
                  style={{
                    padding: "11px 14px",
                    borderBottom: `1px solid ${border}`,
                    borderLeft: isSel
                      ? `2px solid ${tm?.color || GOLD}`
                      : tier ? `2px solid ${tm.color}60` : "2px solid transparent",
                    background: isSel
                      ? `${tm?.color || GOLD}0a`
                      : tier ? `${tm.color}05` : "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  {/* Row 1: Country + Live/time badge */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
                      <span style={{ fontSize: 14, flexShrink: 0 }}>{flag(s.country_code)}</span>
                      <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: white, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {s.city || s.country_name || s.country_code || "Unknown"}
                      </span>
                      {s.region && s.city && (
                        <span style={{ fontFamily: NU, fontSize: 10, color: grey2, flexShrink: 0 }}>{s.region}</span>
                      )}
                    </div>
                    <span style={{
                      flexShrink: 0, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.6px",
                      color: isActive ? GOLD : grey2,
                      background: isActive ? "rgba(201,168,76,0.12)" : "transparent",
                      borderRadius: 8, padding: "2px 8px", marginLeft: 8,
                    }}>
                      {isActive ? "● LIVE" : timeAgo(s.last_seen_at)}
                    </span>
                  </div>

                  {/* Row 2: Current page */}
                  <div style={{ fontFamily: NU, fontSize: 11, color: grey, marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {shortPath(s.current_path)}
                  </div>

                  {/* Row 3: Intent badge (if any) + meta */}
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {/* Tier / intent badge — prominent if exists */}
                      {tm ? (
                        <span style={{
                          fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.7px",
                          color: tm.color, background: `${tm.color}22`,
                          borderRadius: 4, padding: "2px 7px",
                          border: `1px solid ${tm.color}45`,
                          textTransform: "uppercase",
                        }}>
                          {tm.label}
                        </span>
                      ) : s.intent_count > 0 ? (
                        <span style={{
                          fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "0.6px",
                          color: AMBER, background: `${AMBER}15`,
                          borderRadius: 4, padding: "2px 7px",
                          border: `1px solid ${AMBER}30`,
                          textTransform: "uppercase",
                        }}>
                          {s.intent_count} Signal{s.intent_count !== 1 ? "s" : ""}
                        </span>
                      ) : null}
                    </div>

                    {/* Row 4: Time active + pages + device */}
                    <div style={{ display: "flex", gap: 6, fontFamily: NU, fontSize: 10, color: grey2, alignItems: "center" }}>
                      <span style={{ color: grey }}>{duration(s.first_seen_at)}</span>
                      <span>·</span>
                      <span>{s.page_count} pg</span>
                      <span>·</span>
                      <span>{s.device_type || "—"}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Bottom row ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 1, background: border, borderTop: `1px solid ${border}`, flexShrink: 0 }}>

        {/* Top pages */}
        <div style={{ background: card, padding: "14px 18px", maxHeight: 200, overflow: "hidden" }}>
          <div style={S.sectionTitle}>Top Pages</div>
          {topPages.length === 0
            ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>Active pages will surface<br/>as visitors navigate the site</div>
            : topPages.map(([path, count]) => (
              <div key={path} style={S.row}>
                <div style={S.rowLabel}>{shortPath(path)}</div>
                <div style={S.rowVal}>{count}</div>
              </div>
            ))}
        </div>

        {/* Top countries */}
        <div style={{ background: card, padding: "14px 18px", maxHeight: 200, overflow: "hidden" }}>
          <div style={S.sectionTitle}>Top Countries</div>
          {topCountries.length === 0
            ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>Visitor origin will appear<br/>as sessions arrive</div>
            : topCountries.map(([cc, count]) => (
              <div key={cc} style={S.row}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, marginRight: 8, overflow: "hidden" }}>
                  <span style={{ fontSize: 15, flexShrink: 0 }}>{flag(cc)}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{cc}</span>
                </div>
                <div style={S.rowVal}>{count}</div>
              </div>
            ))}
        </div>

        {/* Intent signals */}
        <div style={{ background: card, padding: "14px 18px", maxHeight: 200, overflow: "hidden" }}>
          <div style={S.sectionTitle}>Intent Signals</div>
          {intentEvts.length === 0
            ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2, lineHeight: 1.6 }}>Signals surface when visitors<br/>shortlist, compare, or enquire</div>
            : intentEvts.slice(0, 7).map((e, i) => {
              const meta = INTENT_META[e.event_type] || { label: e.event_type, color: grey };
              return (
                <div key={e.id || i} style={S.row}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, marginRight: 8, overflow: "hidden" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: meta.color, flexShrink: 0 }} />
                    <span style={{ fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{meta.label}</span>
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: grey2, flexShrink: 0 }}>{timeAgo(e.created_at)}</div>
                </div>
              );
            })}
        </div>
      </div>

      {/* ── Session detail drawer ────────────────────────────────────────── */}
      {selected && (() => {
        const tier = getAlertTier(selected, events);
        const tm   = tier ? TIER_META[tier] : null;
        return (
          <div style={{
            position: "fixed", top: 0, right: 0, bottom: 0, width: 360,
            background: "#0c0a08", borderLeft: `1px solid ${border}`,
            zIndex: 200, display: "flex", flexDirection: "column",
            boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
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
