// ═══════════════════════════════════════════════════════════════════════════
// LiveStatsModule — Real-time visitor intelligence dashboard
// Admin only. Dark mode standard. Uses MapLibre GL + Supabase Realtime.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { supabase } from "../../lib/supabaseClient";

// ── Constants ────────────────────────────────────────────────────────────────

const GOLD        = "#C9A84C";
const ACTIVE_MS   = 90_000;        // 90 seconds = "active now"
const RECENT_MS   = 30 * 60_000;   // 30 minutes = shown on map + list
const REFRESH_MS  = 30_000;        // poll interval (supplements Realtime)
const TICK_MS     = 10_000;        // re-render interval for live timers

// Map style — swap VITE_MAP_STYLE_URL for MapTiler/Stadia in production
const MAP_STYLE =
  import.meta.env.VITE_MAP_STYLE_URL ||
  "https://demotiles.maplibre.org/style.json";

const INTENT_META = {
  shortlist_add:       { label: "Shortlisted venue",   color: "#f59e0b" },
  compare_add:         { label: "Added to compare",    color: "#8b5cf6" },
  enquiry_started:     { label: "Opened enquiry",      color: "#06b6d4" },
  enquiry_submitted:   { label: "Submitted enquiry",   color: "#10b981" },
  outbound_click:      { label: "Clicked outbound",    color: "#f87171" },
  aura_query:          { label: "Asked Aura",          color: GOLD      },
};

const INTENT_TYPES = Object.keys(INTENT_META);

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

function makePulseEl(active) {
  const el = document.createElement("div");
  el.style.cssText = [
    `width:${active ? 14 : 8}px`,
    `height:${active ? 14 : 8}px`,
    "border-radius:50%",
    `background:${active ? GOLD : "rgba(201,168,76,0.3)"}`,
    `border:2px solid ${active ? "rgba(201,168,76,0.7)" : "rgba(201,168,76,0.2)"}`,
    `box-shadow:${active
      ? "0 0 0 0 rgba(201,168,76,0.6),0 0 16px rgba(201,168,76,0.7)"
      : "none"}`,
    "cursor:pointer",
    `animation:${active ? "lwd-pulse 2s infinite" : "none"}`,
  ].join(";");
  return el;
}

// ── Main component ────────────────────────────────────────────────────────────

export default function LiveStatsModule({ C }) {
  const [sessions,  setSessions]  = useState([]);
  const [events,    setEvents]    = useState([]);
  const [selected,  setSelected]  = useState(null);
  const [tick,      setTick]      = useState(0);
  const [mapReady,  setMapReady]  = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const mapContainerRef = useRef(null);
  const mapRef          = useRef(null);
  const markersRef      = useRef({});

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

  // ── Map markers ──────────────────────────────────────────────────────────

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
      if (!s.lat || !s.lng) return;
      const isActive = (now - new Date(s.last_seen_at)) < ACTIVE_MS;

      if (markersRef.current[s.session_id]) {
        markersRef.current[s.session_id].setLngLat([s.lng, s.lat]);
        return;
      }

      const el = makePulseEl(isActive);
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        setSelected(s);
      });

      markersRef.current[s.session_id] = new maplibregl.Marker({ element: el })
        .setLngLat([s.lng, s.lat])
        .addTo(map);
    });
  }, [sessions, mapReady, tick]);

  // ── Computed stats ────────────────────────────────────────────────────────

  const now        = Date.now();
  const activeNow  = sessions.filter(s => (now - new Date(s.last_seen_at)) < ACTIVE_MS);
  const last30     = sessions;   // already filtered to 30 min on load

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
  const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

  // Top countries
  const ccCounts = {};
  last30.forEach(s => {
    if (s.country_code) ccCounts[s.country_code] = (ccCounts[s.country_code] || 0) + 1;
  });
  const topCountries = Object.entries(ccCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

  // Intent signals (last hour)
  const intentEvts = events.filter(e => INTENT_TYPES.includes(e.event_type));

  // Top live page + country for KPI
  const topPage    = topPages[0]?.[0] || null;
  const topCountry = topCountries[0] ? `${flag(topCountries[0][0])} ${topCountries[0][0]}` : "—";

  // ── Styles ────────────────────────────────────────────────────────────────

  const S = {
    kpiVal:   { fontFamily: GD, fontSize: 26, fontWeight: 500, lineHeight: 1, color: white, marginBottom: 4 },
    kpiLabel: { fontFamily: NU, fontSize: 9,  fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", color: grey2 },
    sectionTitle: { fontFamily: GD, fontSize: 13, fontStyle: "italic", color: white, marginBottom: 10 },
    row: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 },
    rowLabel: { fontFamily: NU, fontSize: 11, color: grey, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, marginRight: 8 },
    rowVal: { fontFamily: NU, fontSize: 11, fontWeight: 700, color: GOLD, flexShrink: 0 },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div style={{ fontFamily: NU, color: white, height: "100%", display: "flex", flexDirection: "column", overflow: "hidden", background: bg }}>

      {/* Pulse animation */}
      <style>{`
        @keyframes lwd-pulse {
          0%   { box-shadow: 0 0 0 0 rgba(201,168,76,0.6), 0 0 16px rgba(201,168,76,0.7); }
          70%  { box-shadow: 0 0 0 10px rgba(201,168,76,0), 0 0 16px rgba(201,168,76,0.7); }
          100% { box-shadow: 0 0 0 0 rgba(201,168,76,0),   0 0 16px rgba(201,168,76,0.7); }
        }
        .maplibregl-ctrl-group { background: rgba(20,17,14,0.9) !important; border: 1px solid rgba(201,168,76,0.2) !important; }
        .maplibregl-ctrl-group button { background: transparent !important; }
        .maplibregl-ctrl-group button:hover { background: rgba(201,168,76,0.08) !important; }
        .maplibregl-ctrl-group .maplibregl-ctrl-icon { filter: invert(1) sepia(1) saturate(2) hue-rotate(10deg); }
        .maplibregl-ctrl-attrib { display: none !important; }
        .maplibregl-ctrl-logo { display: none !important; }
      `}</style>

      {/* ── KPI strip ───────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(6,1fr)", gap: 1, background: border, borderBottom: `1px solid ${border}`, flexShrink: 0 }}>
        {[
          { label: "Online Now",     value: activeNow.length,                       accent: true },
          { label: "Last 30 Min",    value: last30.length },
          { label: "Today Sessions", value: todaySess },
          { label: "Today Enquiries",value: todayEnqs,                              accent: todayEnqs > 0 },
          { label: "Top Page",       value: topPage ? shortPath(topPage) : "—",    small: true },
          { label: "Top Country",    value: topCountry,                             small: true },
        ].map(k => (
          <div key={k.label} style={{ background: card, padding: "16px 18px" }}>
            <div style={{ ...S.kpiVal, fontSize: k.small ? 14 : 26, color: k.accent ? GOLD : white }}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

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
          <div style={{ padding: "12px 16px 10px", borderBottom: `1px solid ${border}`, flexShrink: 0, display: "flex", alignItems: "baseline", gap: 8 }}>
            <span style={{ fontFamily: GD, fontSize: 15, fontWeight: 500, color: white }}>Active Sessions</span>
            <span style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>{last30.length} in 30m</span>
          </div>

          <div style={{ flex: 1, overflowY: "auto" }}>
            {last30.length === 0 ? (
              <div style={{ padding: 32, textAlign: "center", color: grey2, fontSize: 12 }}>
                Waiting for visitors…
              </div>
            ) : last30.map(s => {
              const isActive = (now - new Date(s.last_seen_at)) < ACTIVE_MS;
              const isSel    = selected?.session_id === s.session_id;
              return (
                <div
                  key={s.session_id}
                  onClick={() => setSelected(isSel ? null : s)}
                  style={{
                    padding: "10px 16px",
                    borderBottom: `1px solid ${border}`,
                    borderLeft: isSel ? `2px solid ${GOLD}` : "2px solid transparent",
                    background: isSel ? "rgba(201,168,76,0.05)" : "transparent",
                    cursor: "pointer", transition: "all 0.15s",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 3 }}>
                    <span style={{ fontSize: 13 }}>
                      {flag(s.country_code)}{" "}
                      <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: white }}>
                        {s.city || s.country_code || "Unknown"}
                      </span>
                    </span>
                    <span style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: "0.6px",
                      color: isActive ? GOLD : grey2,
                      background: isActive ? "rgba(201,168,76,0.1)" : "transparent",
                      borderRadius: 8, padding: "2px 7px",
                    }}>
                      {isActive ? "● LIVE" : timeAgo(s.last_seen_at)}
                    </span>
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: grey, marginBottom: 3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {shortPath(s.current_path)}
                  </div>
                  <div style={{ display: "flex", gap: 8, fontFamily: NU, fontSize: 10, color: grey2 }}>
                    <span>{s.device_type || "—"}</span>
                    <span>·</span>
                    <span>{s.page_count} pg</span>
                    <span>·</span>
                    <span>{duration(s.started_at)}</span>
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
            ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2 }}>No data yet</div>
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
            ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2 }}>No data yet</div>
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
            ? <div style={{ fontFamily: NU, fontSize: 11, color: grey2 }}>No signals yet</div>
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
      {selected && (
        <div style={{
          position: "fixed", top: 0, right: 0, bottom: 0, width: 360,
          background: "#0c0a08", borderLeft: `1px solid ${border}`,
          zIndex: 200, display: "flex", flexDirection: "column",
          boxShadow: "-8px 0 40px rgba(0,0,0,0.5)",
        }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${border}`, display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div>
              <span style={{ fontFamily: GD, fontSize: 16, fontWeight: 500, color: white }}>Session Detail</span>
              {(now - new Date(selected.last_seen_at)) < ACTIVE_MS && (
                <span style={{ marginLeft: 10, fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: "0.8px", textTransform: "uppercase" }}>● Live</span>
              )}
            </div>
            <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", cursor: "pointer", color: grey, fontSize: 18, lineHeight: 1 }}>✕</button>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
            {[
              ["Location",      [selected.city, selected.region, selected.country_code].filter(Boolean).join(", ") || "Unknown"],
              ["Country",       selected.country || selected.country_code || "—"],
              ["Current Page",  shortPath(selected.current_path)],
              ["Previous Page", selected.previous_path ? shortPath(selected.previous_path) : "—"],
              ["Entry Page",    selected.entry_path ? shortPath(selected.entry_path) : "—"],
              ["Source",        selected.referrer || "Direct"],
              ["UTM Source",    selected.utm_source || "—"],
              ["Device",        selected.device_type || "—"],
              ["Browser",       selected.browser || "—"],
              ["OS",            selected.os || "—"],
              ["Pages Viewed",  selected.page_count],
              ["Events",        selected.event_count],
              ["Duration",      duration(selected.started_at)],
              ["Last Seen",     timeAgo(selected.last_seen_at)],
              ["Started",       new Date(selected.started_at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })],
            ].map(([label, value]) => value && value !== "—" ? (
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
                .slice(0, 10)
                .map((e, i) => (
                  <div key={e.id || i} style={{ display: "flex", gap: 10, marginBottom: 8, alignItems: "flex-start" }}>
                    <span style={{ width: 6, height: 6, borderRadius: "50%", background: INTENT_META[e.event_type]?.color || border, marginTop: 4, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: NU, fontSize: 11, color: grey }}>{shortPath(e.path)}</div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: grey2 }}>
                        {INTENT_META[e.event_type]?.label || e.event_type} · {timeAgo(e.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
