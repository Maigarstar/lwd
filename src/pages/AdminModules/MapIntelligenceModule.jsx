// ─── src/pages/AdminModules/MapIntelligenceModule.jsx ─────────────────────────
// Map Intelligence — turns MASTERMap viewport behaviour into admin insights.
//
// Four tabs:
//   Overview     — KPIs: map opens, pin clicks, regions explored, geocode health
//   Hot Zones    — Most explored regions ranked by viewport count + demand signal
//   Demand Gaps  — Regions with high exploration but low listing supply
//   Geocode Health — Venues missing coordinates, grouped by country
//
// Data sources:
//   page_events WHERE event_type IN ('map_toggle','map_viewport','pin_click','map_geocode_miss')
//   listings    — supply per country / category
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD        = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.09)";
const GOLD_BORDER = "rgba(201,168,76,0.22)";
const GREEN       = "#4ade80";
const AMBER       = "#fbbf24";
const RED         = "#f87171";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

const BG   = "#0a0806";
const BG2  = "#0f0d0a";
const BG3  = "#141210";
const BORD = "rgba(255,255,255,0.07)";

const TABS = [
  { key: "overview", label: "Overview",        icon: "⬡" },
  { key: "hotzones", label: "Hot Zones",        icon: "◎" },
  { key: "gaps",     label: "Demand Gaps",      icon: "◈" },
  { key: "geocode",  label: "Geocode Health",   icon: "⊕" },
];

const RANGES = [
  { key: "7d",  label: "7 Days",  days: 7  },
  { key: "30d", label: "30 Days", days: 30 },
  { key: "90d", label: "90 Days", days: 90 },
];

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function countryLabel(slug) {
  const map = {
    italy: "Italy", uk: "United Kingdom", england: "England",
    france: "France", spain: "Spain", greece: "Greece",
    portugal: "Portugal", germany: "Germany", ireland: "Ireland",
    usa: "United States",
  };
  return map[slug] || (slug ? slug.charAt(0).toUpperCase() + slug.slice(1) : "Unknown");
}

function pct(a, b) {
  if (!b) return "—";
  return Math.round((a / b) * 100) + "%";
}

function demandSignal(viewports, listings) {
  if (!viewports) return { label: "No data", color: "rgba(255,255,255,0.25)" };
  const ratio = listings > 0 ? viewports / listings : viewports;
  if (ratio > 50)  return { label: "Very High",    color: RED };
  if (ratio > 20)  return { label: "High",          color: AMBER };
  if (ratio > 8)   return { label: "Medium",        color: GREEN };
  return               { label: "Low",            color: "rgba(255,255,255,0.35)" };
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function Skeleton({ w = "100%", h = 16, r = 4 }) {
  return (
    <div style={{
      width: w, height: h, borderRadius: r,
      background: "rgba(255,255,255,0.06)",
      animation: "lwd-shimmer 1.6s ease-in-out infinite",
    }} />
  );
}

// ── KPI card ──────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, color, loading }) {
  return (
    <div style={{
      background: BG2, border: `1px solid ${GOLD_BORDER}`,
      borderRadius: 8, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 6,
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em",
        textTransform: "uppercase", color: "rgba(255,255,255,0.38)" }}>
        {label}
      </div>
      {loading
        ? <Skeleton h={32} w={80} />
        : <div style={{ fontFamily: GD, fontSize: 32, fontWeight: 400,
            color: color || "rgba(255,255,255,0.88)", lineHeight: 1 }}>
            {value ?? "—"}
          </div>
      }
      {sub && !loading && (
        <div style={{ fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.38)" }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Ranked row ────────────────────────────────────────────────────────────────
function RankedRow({ rank, country, count, sub, badge, barMax, loading }) {
  const w = barMax > 0 ? Math.round((count / barMax) * 100) : 0;
  return (
    <div style={{
      display: "grid", gridTemplateColumns: "28px 1fr auto",
      gap: 12, alignItems: "center",
      padding: "12px 0", borderBottom: `1px solid ${BORD}`,
    }}>
      <div style={{ fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.28)",
        textAlign: "right" }}>
        {rank}
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <span style={{ fontFamily: NU, fontSize: 13, color: "rgba(255,255,255,0.82)", fontWeight: 500 }}>
            {loading ? <Skeleton w={120} h={13} /> : countryLabel(country)}
          </span>
          {badge && !loading && (
            <span style={{
              fontFamily: NU, fontSize: 9, letterSpacing: "0.18em",
              textTransform: "uppercase", padding: "2px 7px",
              borderRadius: 3, border: `1px solid ${badge.color}40`,
              background: `${badge.color}12`, color: badge.color,
            }}>
              {badge.label}
            </span>
          )}
        </div>
        <div style={{
          height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)",
          overflow: "hidden",
        }}>
          <div style={{
            height: "100%", width: `${w}%`,
            background: `linear-gradient(to right, ${GOLD}, rgba(201,168,76,0.6))`,
            borderRadius: 2, transition: "width 0.4s ease",
          }} />
        </div>
        {sub && !loading && (
          <div style={{ fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {sub}
          </div>
        )}
      </div>
      <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 600,
        color: GOLD, textAlign: "right" }}>
        {loading ? <Skeleton w={40} h={15} /> : count?.toLocaleString()}
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════════════════
export default function MapIntelligenceModule({ C, darkMode }) {
  const [tab,   setTab]   = useState("overview");
  const [range, setRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  // Raw data
  const [mapToggles,     setMapToggles]     = useState([]);
  const [viewports,      setViewports]      = useState([]);
  const [pinClicks,      setPinClicks]      = useState([]);
  const [geocodeMisses,  setGeocodeMisses]  = useState([]);
  const [listingSupply,  setListingSupply]  = useState({});

  const since = daysAgo(RANGES.find(r => r.key === range)?.days || 30);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [toggleRes, vpRes, pinRes, geoRes, supplyRes] = await Promise.all([
        // Map opens
        supabase.from("page_events")
          .select("created_at, metadata")
          .eq("event_type", "map_toggle")
          .gte("created_at", since),

        // Viewport explorations
        supabase.from("page_events")
          .select("created_at, metadata")
          .eq("event_type", "map_viewport")
          .gte("created_at", since),

        // Pin clicks
        supabase.from("page_events")
          .select("created_at, metadata")
          .eq("event_type", "pin_click")
          .gte("created_at", since),

        // Geocode misses
        supabase.from("page_events")
          .select("created_at, metadata")
          .eq("event_type", "map_geocode_miss")
          .gte("created_at", since),

        // Listing supply per country
        supabase.from("listings")
          .select("country")
          .not("country", "is", null),
      ]);

      setMapToggles(toggleRes.data || []);
      setViewports(vpRes.data || []);
      setPinClicks(pinRes.data || []);
      setGeocodeMisses(geoRes.data || []);

      // Aggregate supply: { italy: 42, uk: 18, ... }
      const supply = {};
      (supplyRes.data || []).forEach(r => {
        const c = (r.country || "").toLowerCase();
        supply[c] = (supply[c] || 0) + 1;
      });
      setListingSupply(supply);
    } catch (e) {
      console.error("MapIntelligenceModule load error:", e);
    } finally {
      setLoading(false);
    }
  }, [since]);

  useEffect(() => { load(); }, [load]);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const mapOpens = mapToggles.filter(e => e.metadata?.map_on === true).length;
  const mapCloses = mapToggles.filter(e => e.metadata?.map_on === false).length;
  const totalPinClicks = pinClicks.length;
  const totalViewports = viewports.length;

  // Viewport counts by country
  const viewportsByCountry = {};
  viewports.forEach(e => {
    const c = (e.metadata?.country || "unknown").toLowerCase();
    viewportsByCountry[c] = (viewportsByCountry[c] || 0) + 1;
  });

  // Pin click counts by country (from path — approximate)
  const pinsByCountry = {};
  pinClicks.forEach(e => {
    // Use path to infer country: /italy/... → italy
    const parts = (e.path || "").split("/").filter(Boolean);
    const c = parts[0] || "unknown";
    pinsByCountry[c] = (pinsByCountry[c] || 0) + 1;
  });

  // Geocode miss counts by country
  const missesByCountry = {};
  geocodeMisses.forEach(e => {
    const c = (e.metadata?.country || "unknown").toLowerCase();
    missesByCountry[c] = (missesByCountry[c] || 0) + 1;
  });

  const uniqueRegions = Object.keys(viewportsByCountry).length;
  const totalMisses   = geocodeMisses.length;

  // Ranked hot zones
  const hotZones = Object.entries(viewportsByCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([country, count]) => ({
      country,
      viewports: count,
      listings: listingSupply[country] || 0,
      pinClicks: pinsByCountry[country] || 0,
      signal: demandSignal(count, listingSupply[country] || 0),
    }));

  const barMax = hotZones[0]?.viewports || 1;

  // Demand gaps: explored but under-listed (ratio > threshold)
  const demandGaps = hotZones
    .filter(z => z.listings < 10 || (z.viewports / Math.max(z.listings, 1)) > 15)
    .sort((a, b) => (b.viewports / Math.max(b.listings, 1)) - (a.viewports / Math.max(a.listings, 1)));

  const gapBarMax = demandGaps[0]?.viewports || 1;

  // Geocode health by country
  const geocodeHealth = Object.entries(missesByCountry)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const missBarMax = geocodeHealth[0]?.[1] || 1;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ background: BG, minHeight: "100vh", padding: 0 }}>

      {/* Header */}
      <div style={{
        padding: "32px 40px 0",
        borderBottom: `1px solid ${BORD}`,
        background: BG,
      }}>
        <div style={{ display: "flex", alignItems: "flex-start",
          justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <div style={{ width: 24, height: 1, background: GOLD }} />
              <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.32em",
                textTransform: "uppercase", color: GOLD }}>
                Intelligence
              </span>
            </div>
            <h1 style={{ fontFamily: GD, fontSize: 26, fontWeight: 400,
              color: "rgba(255,255,255,0.88)", margin: 0, lineHeight: 1.2 }}>
              Map Intelligence
            </h1>
            <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.38)",
              margin: "6px 0 0" }}>
              Viewport behaviour, hot zones, demand gaps, and geocode coverage
            </p>
          </div>

          {/* Time range selector */}
          <div style={{ display: "flex", gap: 4, alignItems: "center",
            background: BG3, border: `1px solid ${BORD}`, borderRadius: 8, padding: 4 }}>
            {RANGES.map(r => (
              <button key={r.key} onClick={() => setRange(r.key)} style={{
                fontFamily: NU, fontSize: 10, fontWeight: 600,
                letterSpacing: "0.1em", textTransform: "uppercase",
                padding: "6px 14px", borderRadius: 6, border: "none", cursor: "pointer",
                background: range === r.key ? GOLD_DIM : "transparent",
                color: range === r.key ? GOLD : "rgba(255,255,255,0.38)",
                outline: range === r.key ? `1px solid ${GOLD_BORDER}` : "none",
                transition: "all 0.15s",
              }}>
                {r.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              fontFamily: NU, fontSize: 10, fontWeight: 600,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "10px 20px", border: "none", background: "transparent",
              cursor: "pointer",
              color: tab === t.key ? GOLD : "rgba(255,255,255,0.35)",
              borderBottom: tab === t.key ? `2px solid ${GOLD}` : "2px solid transparent",
              transition: "all 0.15s",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: "32px 40px" }}>

        {/* ── OVERVIEW ───────────────────────────────────────────────────── */}
        {tab === "overview" && (
          <div>
            {/* KPI strip */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 32 }}>
              <KPI label="Map Opens" value={mapOpens.toLocaleString()}
                sub={`${mapCloses} closes · ${pct(mapOpens, mapOpens + mapCloses)} open rate`}
                color={GOLD} loading={loading} />
              <KPI label="Pin Clicks" value={totalPinClicks.toLocaleString()}
                sub={totalViewports > 0 ? `${pct(totalPinClicks, totalViewports)} click-through on viewport` : undefined}
                color={GREEN} loading={loading} />
              <KPI label="Regions Explored" value={uniqueRegions.toLocaleString()}
                sub="distinct countries with viewport activity"
                loading={loading} />
              <KPI label="Geocode Misses" value={totalMisses.toLocaleString()}
                sub="venues with no coordinates found"
                color={totalMisses > 10 ? RED : totalMisses > 3 ? AMBER : undefined}
                loading={loading} />
            </div>

            {/* Top regions + top pins side by side */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
              {/* Most explored regions */}
              <div style={{ background: BG2, border: `1px solid ${BORD}`, borderRadius: 8, padding: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em",
                  textTransform: "uppercase", color: GOLD, marginBottom: 20 }}>
                  Most Explored Regions
                </div>
                {loading
                  ? [1,2,3,4,5].map(i => <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${BORD}` }}><Skeleton h={14} /></div>)
                  : hotZones.slice(0, 5).length > 0
                    ? hotZones.slice(0, 5).map((z, i) => (
                        <RankedRow key={z.country} rank={i + 1} country={z.country}
                          count={z.viewports} barMax={barMax}
                          badge={z.signal}
                          sub={`${z.listings} listings · ${z.pinClicks} pin clicks`} />
                      ))
                    : <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.28)", padding: "20px 0" }}>
                        No viewport data yet for this period.
                      </div>
                }
              </div>

              {/* Top pin-click venues */}
              <div style={{ background: BG2, border: `1px solid ${BORD}`, borderRadius: 8, padding: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em",
                  textTransform: "uppercase", color: GOLD, marginBottom: 20 }}>
                  Most Clicked Pins
                </div>
                {loading
                  ? [1,2,3,4,5].map(i => <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${BORD}` }}><Skeleton h={14} /></div>)
                  : (() => {
                      const byVenue = {};
                      pinClicks.forEach(e => {
                        const name = e.metadata?.venue_name || e.metadata?.venue_slug || "Unknown";
                        const slug = e.metadata?.venue_slug || "";
                        byVenue[slug] = { name, count: (byVenue[slug]?.count || 0) + 1 };
                      });
                      const sorted = Object.values(byVenue).sort((a, b) => b.count - a.count).slice(0, 5);
                      const max = sorted[0]?.count || 1;
                      return sorted.length > 0
                        ? sorted.map((v, i) => (
                            <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${BORD}` }}>
                              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                                <span style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.75)", fontWeight: 500 }}>
                                  {v.name}
                                </span>
                                <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: GOLD }}>
                                  {v.count}
                                </span>
                              </div>
                              <div style={{ height: 3, borderRadius: 2, background: "rgba(255,255,255,0.06)" }}>
                                <div style={{ height: "100%", width: `${Math.round((v.count / max) * 100)}%`,
                                  background: GOLD, borderRadius: 2, transition: "width 0.4s" }} />
                              </div>
                            </div>
                          ))
                        : <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.28)", padding: "20px 0" }}>
                            No pin clicks yet for this period.
                          </div>;
                    })()
                }
              </div>
            </div>
          </div>
        )}

        {/* ── HOT ZONES ──────────────────────────────────────────────────── */}
        {tab === "hotzones" && (
          <div>
            <div style={{ marginBottom: 20, padding: "14px 20px",
              background: `${GOLD}0a`, border: `1px solid ${GOLD_BORDER}`,
              borderLeft: `3px solid ${GOLD}`, borderRadius: "0 6px 6px 0" }}>
              <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.62)",
                margin: 0, lineHeight: 1.6 }}>
                Regions ranked by map viewport activity — how often users explored that area.
                Demand signal compares exploration volume to listing supply.
                <strong style={{ color: GOLD }}> High or Very High with low supply = sales opportunity.</strong>
              </p>
            </div>

            <div style={{ background: BG2, border: `1px solid ${BORD}`, borderRadius: 8, overflow: "hidden" }}>
              <div style={{ display: "grid",
                gridTemplateColumns: "28px 1fr 100px 100px 100px 120px",
                gap: 12, padding: "10px 24px",
                borderBottom: `1px solid ${BORD}`,
                background: BG3 }}>
                {["#", "Region", "Viewports", "Pin Clicks", "Listings", "Demand Signal"].map(h => (
                  <div key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.22em",
                    textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                    {h}
                  </div>
                ))}
              </div>

              {loading
                ? [1,2,3,4,5,6].map(i => (
                    <div key={i} style={{ display: "grid",
                      gridTemplateColumns: "28px 1fr 100px 100px 100px 120px",
                      gap: 12, padding: "14px 24px", borderBottom: `1px solid ${BORD}` }}>
                      {[1,2,3,4,5,6].map(j => <Skeleton key={j} h={13} />)}
                    </div>
                  ))
                : hotZones.length > 0
                  ? hotZones.map((z, i) => (
                      <div key={z.country} style={{ display: "grid",
                        gridTemplateColumns: "28px 1fr 100px 100px 100px 120px",
                        gap: 12, padding: "14px 24px", borderBottom: `1px solid ${BORD}`,
                        background: i % 2 === 0 ? "transparent" : `rgba(255,255,255,0.015)`,
                      }}>
                        <div style={{ fontFamily: NU, fontSize: 11,
                          color: "rgba(255,255,255,0.25)", alignSelf: "center" }}>
                          {i + 1}
                        </div>
                        <div>
                          <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 500,
                            color: "rgba(255,255,255,0.82)", marginBottom: 6 }}>
                            {countryLabel(z.country)}
                          </div>
                          <div style={{ height: 3, borderRadius: 2,
                            background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                            <div style={{ height: "100%",
                              width: `${Math.round((z.viewports / barMax) * 100)}%`,
                              background: `linear-gradient(to right, ${GOLD}, rgba(201,168,76,0.5))`,
                              borderRadius: 2, transition: "width 0.4s" }} />
                          </div>
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 14, fontWeight: 600,
                          color: GOLD, alignSelf: "center" }}>
                          {z.viewports.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 13,
                          color: "rgba(255,255,255,0.65)", alignSelf: "center" }}>
                          {z.pinClicks.toLocaleString()}
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 13,
                          color: z.listings < 5 ? RED : "rgba(255,255,255,0.65)", alignSelf: "center" }}>
                          {z.listings.toLocaleString()}
                        </div>
                        <div style={{ alignSelf: "center" }}>
                          <span style={{
                            fontFamily: NU, fontSize: 9, letterSpacing: "0.16em",
                            textTransform: "uppercase", padding: "3px 8px",
                            borderRadius: 4, border: `1px solid ${z.signal.color}40`,
                            background: `${z.signal.color}12`, color: z.signal.color,
                          }}>
                            {z.signal.label}
                          </span>
                        </div>
                      </div>
                    ))
                  : <div style={{ padding: "40px 24px", textAlign: "center",
                      fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.28)" }}>
                      No viewport data for this period. Turn on the map and start exploring.
                    </div>
              }
            </div>
          </div>
        )}

        {/* ── DEMAND GAPS ────────────────────────────────────────────────── */}
        {tab === "gaps" && (
          <div>
            <div style={{ marginBottom: 20, padding: "14px 20px",
              background: `${RED}0a`, border: `1px solid ${RED}30`,
              borderLeft: `3px solid ${RED}`, borderRadius: "0 6px 6px 0" }}>
              <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.62)",
                margin: 0, lineHeight: 1.6 }}>
                Regions where users are actively exploring but listing supply is thin.
                These are <strong style={{ color: RED }}>hidden demand zones</strong> —
                areas with buyer intent and no inventory to capture it.
                Each one is a direct outreach opportunity.
              </p>
            </div>

            {loading
              ? <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {[1,2,3,4].map(i => <Skeleton key={i} h={72} r={8} />)}
                </div>
              : demandGaps.length > 0
                ? demandGaps.map((z, i) => {
                    const ratio = z.listings > 0
                      ? Math.round(z.viewports / z.listings)
                      : z.viewports;
                    return (
                      <div key={z.country} style={{
                        background: BG2, border: `1px solid ${BORD}`,
                        borderRadius: 8, padding: "20px 24px", marginBottom: 12,
                        display: "grid", gridTemplateColumns: "1fr auto auto",
                        gap: 24, alignItems: "center",
                      }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                            <span style={{ fontFamily: GD, fontSize: 18, fontWeight: 400,
                              color: "rgba(255,255,255,0.88)" }}>
                              {countryLabel(z.country)}
                            </span>
                            <span style={{
                              fontFamily: NU, fontSize: 9, letterSpacing: "0.18em",
                              textTransform: "uppercase", padding: "2px 8px",
                              borderRadius: 3, border: `1px solid ${z.signal.color}40`,
                              background: `${z.signal.color}12`, color: z.signal.color,
                            }}>
                              {z.signal.label} Demand
                            </span>
                          </div>
                          <div style={{ fontFamily: NU, fontSize: 11,
                            color: "rgba(255,255,255,0.38)", lineHeight: 1.6 }}>
                            {z.viewports} viewport {z.viewports === 1 ? "session" : "sessions"} ·{" "}
                            {z.listings} listing{z.listings !== 1 ? "s" : ""} ·{" "}
                            <strong style={{ color: RED }}>{ratio}× exploration-to-supply ratio</strong>
                          </div>
                          <div style={{ height: 3, borderRadius: 2, marginTop: 10,
                            background: "rgba(255,255,255,0.06)", overflow: "hidden", maxWidth: 320 }}>
                            <div style={{ height: "100%",
                              width: `${Math.round((z.viewports / gapBarMax) * 100)}%`,
                              background: `linear-gradient(to right, ${RED}, ${AMBER})`,
                              borderRadius: 2 }} />
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 400, color: GOLD }}>
                            {z.viewports.toLocaleString()}
                          </div>
                          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                            Viewports
                          </div>
                        </div>
                        <div style={{ textAlign: "center" }}>
                          <div style={{ fontFamily: GD, fontSize: 28, fontWeight: 400,
                            color: z.listings < 5 ? RED : "rgba(255,255,255,0.65)" }}>
                            {z.listings.toLocaleString()}
                          </div>
                          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.2em",
                            textTransform: "uppercase", color: "rgba(255,255,255,0.3)" }}>
                            Listings
                          </div>
                        </div>
                      </div>
                    );
                  })
                : <div style={{ padding: "60px 24px", textAlign: "center",
                    background: BG2, border: `1px solid ${BORD}`, borderRadius: 8,
                    fontFamily: NU, fontSize: 13, color: "rgba(255,255,255,0.28)" }}>
                    No significant demand gaps detected for this period.
                  </div>
            }
          </div>
        )}

        {/* ── GEOCODE HEALTH ─────────────────────────────────────────────── */}
        {tab === "geocode" && (
          <div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 28 }}>
              <KPI label="Total Misses" value={totalMisses.toLocaleString()}
                sub="venues with no coordinates found"
                color={totalMisses > 10 ? RED : totalMisses > 3 ? AMBER : GREEN}
                loading={loading} />
              <KPI label="Countries Affected" value={Object.keys(missesByCountry).length.toLocaleString()}
                sub="distinct countries with geocode failures" loading={loading} />
              <KPI label="Miss Rate" value={viewports.length > 0 ? pct(totalMisses, viewports.length) : "—"}
                sub="of map viewport events had at least one miss" loading={loading} />
            </div>

            <div style={{ background: BG2, border: `1px solid ${BORD}`, borderRadius: 8, padding: 24 }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.28em",
                textTransform: "uppercase", color: GOLD, marginBottom: 20 }}>
                Misses by Country — Venues to Manually Geocode
              </div>

              {loading
                ? [1,2,3,4].map(i => <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${BORD}` }}><Skeleton h={14} /></div>)
                : geocodeHealth.length > 0
                  ? geocodeHealth.map(([country, count], i) => (
                      <RankedRow key={country} rank={i + 1} country={country}
                        count={count} barMax={missBarMax}
                        badge={{ label: count > 10 ? "Urgent" : count > 4 ? "Review" : "Monitor",
                          color: count > 10 ? RED : count > 4 ? AMBER : "rgba(255,255,255,0.35)" }}
                        sub="venues missing lat/lng — invisible on map" />
                    ))
                  : <div style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.28)",
                      padding: "30px 0" }}>
                      No geocode misses recorded in this period. All venues are on the map.
                    </div>
              }

              {geocodeHealth.length > 0 && !loading && (
                <div style={{ marginTop: 24, padding: "14px 18px",
                  background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                  borderRadius: 6 }}>
                  <p style={{ fontFamily: NU, fontSize: 11, color: "rgba(255,255,255,0.55)",
                    margin: 0, lineHeight: 1.6 }}>
                    <strong style={{ color: GOLD }}>Action:</strong>{" "}
                    Open the Listing Editor for each affected venue and add a manual lat/lng.
                    Venues without coordinates are invisible to every user who opens the map.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>

      <style>{`
        @keyframes lwd-shimmer {
          0%,100% { opacity: 0.5; }
          50%      { opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
