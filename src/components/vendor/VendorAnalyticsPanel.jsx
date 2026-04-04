// ─── src/components/vendor/VendorAnalyticsPanel.jsx ─────────────────────────
// Vendor intelligence panel — all 9 features + interpretation layer.
// Gated behind vendor.analytics_enabled (admin-toggled paid feature).
//
// Priority layers built here:
//  1. Interpretation + benchmark (contextual headline above KPIs)
//  2. Live interest — emotional centrepiece, redesigned
//  3. Source breakdown — count + %
//  4. Trend chart — metric selector (Views / Shortlists / Enquiries)
//  5. Skeleton loading + immediate state clear on range change
//  6. Micro polish — "Mar 6" dates, compare peer links, "Updated X ago"
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.12)";
const GOLD_BORDER = "rgba(201,168,76,0.3)";

// Luxury wedding category benchmarks (used for interpretation layer)
const BENCH = {
  conversionPct: 4.0,  // view → enquiry %
  shortlistRate: 8.0,  // shortlists / views %
  viewsPer7d:   25,    // typical views per 7-day window
};

// ── Formatting helpers ────────────────────────────────────────────────────────

function fmtNum(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function fmtDay(isoStr) {
  // "2026-03-06" → "Mar 6"
  const d = new Date(isoStr + "T12:00:00Z");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function fmtRefreshed(date) {
  if (!date) return null;
  const secs = Math.round((Date.now() - date) / 1000);
  if (secs < 10)   return "Updated just now";
  if (secs < 60)   return `Updated ${secs}s ago`;
  if (secs < 3600) return `Updated ${Math.round(secs / 60)}m ago`;
  return null;
}

function deltaColor(v) {
  if (v > 0) return "#4ade80";
  if (v < 0) return "#f87171";
  return "#888";
}

function deltaLabel(curr, prev) {
  if (prev == null || prev === 0 || curr == null) return null;
  const pct = ((curr - prev) / prev) * 100;
  return { pct: Math.abs(pct).toFixed(0), sign: pct >= 0 ? "↑" : "↓", positive: pct >= 0 };
}

// ── Source classification ─────────────────────────────────────────────────────

function classifySource(row) {
  const src = (row.utm_source || "").toLowerCase();
  const ref = (row.referrer  || "").toLowerCase();
  if (src === "google"    || ref.includes("google"))    return "Google";
  if (src === "instagram" || ref.includes("instagram")) return "Instagram";
  if (src === "facebook"  || ref.includes("facebook"))  return "Facebook";
  if (src === "pinterest" || ref.includes("pinterest")) return "Pinterest";
  if (src === "tiktok"    || ref.includes("tiktok"))    return "TikTok";
  if (src === "twitter"   || ref.includes("twitter"))   return "Twitter";
  if (ref.includes("luxuryweddingdirectory") || ref.includes("localhost")) return "Internal";
  if (ref) return "Other";
  return "Direct";
}

const SOURCE_ICONS = {
  Google: "G", Instagram: "◎", Facebook: "f", Pinterest: "P",
  TikTok: "♩", Twitter: "𝕏", Direct: "→", Internal: "↺", Other: "◇",
};

// ── Interpretation engine ─────────────────────────────────────────────────────

function buildInterpretation(stats, prevStats) {
  if (!stats) return null;
  const { views = 0, shortlists = 0, enquirySubmitted = 0, viewToEnquiry = 0 } = stats;
  const prevViews = prevStats?.views ?? 0;

  if (views === 0) {
    return {
      headline:  "Your analytics are live",
      subline:   "Data will appear as couples visit your listing.",
      sentiment: "neutral",
      benchmark: null,
    };
  }

  const viewsDelta    = prevViews > 0 ? ((views - prevViews) / prevViews) * 100 : null;
  const shortlistRate = (shortlists / views) * 100;
  const convRate      = viewToEnquiry;

  let headline, subline, sentiment;

  if (viewsDelta !== null && viewsDelta >= 50 && convRate >= BENCH.conversionPct) {
    headline  = "Strong performance this period";
    subline   = `Views are up ${Math.round(viewsDelta)}%, with ${enquirySubmitted} enqu${enquirySubmitted === 1 ? "iry" : "iries"} received — momentum is building.`;
    sentiment = "positive";
  } else if (viewsDelta !== null && viewsDelta >= 20) {
    headline  = "Growing momentum";
    subline   = `Profile views are up ${Math.round(viewsDelta)}%${shortlists > 0 ? ` — ${shortlists} couple${shortlists > 1 ? "s" : ""} saved your listing` : ""}.`;
    sentiment = "positive";
  } else if (convRate >= BENCH.conversionPct * 1.5) {
    headline  = "High-quality interest";
    subline   = `Your ${convRate.toFixed(1)}% conversion rate is above average — couples who find you are taking action.`;
    sentiment = "positive";
  } else if (shortlistRate >= BENCH.shortlistRate) {
    headline  = "Strong shortlist engagement";
    subline   = `${shortlistRate.toFixed(0)}% of visitors saved your listing — a high-intent audience.`;
    sentiment = "positive";
  } else if (viewsDelta !== null && viewsDelta <= -20) {
    headline  = "Views dipped this period";
    subline   = `Down ${Math.abs(Math.round(viewsDelta))}% vs prior period. Refreshing your listing images or headline may help.`;
    sentiment = "warning";
  } else if (views >= 10 && enquirySubmitted === 0) {
    headline  = "Good visibility, low conversion";
    subline   = `${views} views so far but no enquiries yet — simplifying your enquiry form could improve results.`;
    sentiment = "warning";
  } else {
    headline  = "Steady performance";
    subline   = `${views} view${views === 1 ? "" : "s"} and ${shortlists} save${shortlists === 1 ? "" : "s"} this period${enquirySubmitted > 0 ? `, with ${enquirySubmitted} enqu${enquirySubmitted === 1 ? "iry" : "iries"} received` : ""}.`;
    sentiment = "neutral";
  }

  let benchmark = null;
  if (convRate >= BENCH.conversionPct * 1.3) {
    benchmark = { text: "Above average conversion for your category", positive: true };
  } else if (convRate >= BENCH.conversionPct * 0.7) {
    benchmark = { text: "In line with similar venues", positive: null };
  } else if (convRate > 0) {
    benchmark = { text: "Below average conversion — small improvements could make a significant difference", positive: false };
  }

  return { headline, subline, sentiment, benchmark };
}

// ── Compare peer URL helper ───────────────────────────────────────────────────

function peerUrl(slug, type) {
  if (!slug) return null;
  if (type === "venue")   return `/venues/${slug}`;
  if (type === "vendor")  return `/vendor/${slug}`;
  if (type === "planner") return `/planners/${slug}`;
  return null;
}

// ── Sparkline ─────────────────────────────────────────────────────────────────

function Sparkline({ data = [], color = GOLD, height = 64 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w   = 100 / data.length;
  const pts = data
    .map((v, i) => {
      const x = i * w + w / 2;
      const y = height - (v / max) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 100 ${height}`} preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${pts} 100,${height}`} fill="url(#spark-grad)" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// ── StatKPI ───────────────────────────────────────────────────────────────────

function StatKPI({ label, value, prevValue, unit = "", color,
  loading, isMobile, cardBg, border, textPrimary, textMuted }) {
  const dl = (!loading && prevValue != null && value != null) ? deltaLabel(value, prevValue) : null;

  return (
    <div style={{ background: cardBg, border: `1px solid ${border}`,
      borderRadius: "var(--lwd-radius-card)",
      padding: isMobile ? "14px 16px" : "20px 22px",
      display: "flex", flexDirection: "column", gap: 6 }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
        textTransform: "uppercase", color: textMuted }}>
        {label}
      </div>
      <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
        {loading ? (
          <div style={{ width: 52, height: 32, borderRadius: 4,
            background: "rgba(128,128,128,0.1)", animation: "shimmer 1.4s ease infinite" }} />
        ) : (
          <div style={{ fontFamily: GD, fontSize: isMobile ? 24 : 30, fontWeight: 700,
            color: color || textPrimary, lineHeight: 1 }}>
            {fmtNum(value)}
          </div>
        )}
        {!loading && unit && (
          <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginBottom: 3 }}>{unit}</div>
        )}
      </div>
      {dl ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: deltaColor(dl.positive ? 1 : -1),
          display: "flex", alignItems: "center", gap: 3 }}>
          <span>{dl.sign} {dl.pct}%</span>
          <span style={{ color: textMuted, fontWeight: 300 }}>vs prior period</span>
        </div>
      ) : (!loading && prevValue != null && value === prevValue && prevValue > 0) ? (
        <div style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>Stable</div>
      ) : null}
    </div>
  );
}

// ── LockedState ────────────────────────────────────────────────────────────────

function LockedState({ C }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center",
      justifyContent: "center", padding: "80px 32px", textAlign: "center", gap: 20 }}>
      <div style={{ width: 64, height: 64, borderRadius: "50%", background: GOLD_DIM,
        border: `1px solid ${GOLD_BORDER}`, display: "flex", alignItems: "center",
        justifyContent: "center", fontSize: 28, marginBottom: 8 }}>
        ◎
      </div>
      <div>
        <div style={{ fontFamily: GD, fontSize: 22, color: C.white, fontWeight: 500, marginBottom: 8 }}>
          Analytics & Intelligence
        </div>
        <div style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.7, maxWidth: 380 }}>
          See exactly who is viewing your listing, where they&rsquo;re coming from,
          and how you compare — available on Featured and Elite plans.
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 10, alignItems: "flex-start",
        background: C.card, border: `1px solid ${C.border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "20px 24px",
        maxWidth: 360, width: "100%" }}>
        {[
          "Profile views with week-on-week delta",
          "Live interest — couples viewing right now",
          "Source breakdown (Google, Instagram, Direct)",
          "Compare intelligence — who you're shortlisted against",
          "30-day trend chart",
        ].map((f, i) => (
          <div key={i} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
            <span style={{ color: C.grey, fontSize: 12, marginTop: 1 }}>◇</span>
            <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.5 }}>{f}</span>
          </div>
        ))}
      </div>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4 }}>
        Contact your account manager to upgrade
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function VendorAnalyticsPanel({ vendor, C, isMobile }) {
  const analyticsEnabled = vendor?.analytics_enabled === true;

  // ── State ──────────────────────────────────────────────────────────────────
  const [range,       setRange]       = useState("7d");
  const [customFrom,  setCustomFrom]  = useState("");
  const [customTo,    setCustomTo]    = useState("");

  const [stats,       setStats]       = useState(null);
  const [prevStats,   setPrevStats]   = useState(null);
  const [liveCount,   setLiveCount]   = useState(0);
  const [sources,     setSources]     = useState([]);
  const [compareList, setCompareList] = useState([]);

  // Trend chart — all three daily series loaded at once
  const [dailyViews,      setDailyViews]      = useState([]);
  const [dailyShortlists, setDailyShortlists] = useState([]);
  const [dailyEnquiries,  setDailyEnquiries]  = useState([]);
  const [trendMetric,     setTrendMetric]     = useState("views");

  const [loading,       setLoading]       = useState(true);
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [tick,          setTick]          = useState(0); // drives "Updated X ago" re-render
  const [notifications, setNotifications] = useState([]);

  const notifIdRef  = useRef(0);
  const realtimeRef = useRef(null);

  // ── Theme ──────────────────────────────────────────────────────────────────
  const isLight    = C.bg === "#F2EFE9" || C.bg?.startsWith("#F");
  const cardBg     = isLight ? "#FFFFFF" : C.card;
  const border     = isLight ? "rgba(0,0,0,0.08)" : C.border;
  const textPrimary = isLight ? "#1a1a1a" : C.white;
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : C.grey;

  // ── Date range helpers ─────────────────────────────────────────────────────
  const getRangeISO = useCallback(() => {
    const now = Date.now();
    if (range === "7d")  return { from: new Date(now - 7  * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "30d") return { from: new Date(now - 30 * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "custom" && customFrom && customTo)
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo + "T23:59:59").toISOString() };
    return { from: new Date(now - 7 * 86400_000).toISOString(), to: new Date(now).toISOString() };
  }, [range, customFrom, customTo]);

  const getPrevRangeISO = useCallback(() => {
    const { from, to } = getRangeISO();
    const span = new Date(to) - new Date(from);
    return { from: new Date(new Date(from) - span).toISOString(), to: from };
  }, [getRangeISO]);

  // ── Fill a 30-day bucket map ───────────────────────────────────────────────
  function fillDailyMap(data, dayKey = "day", countKey = "count") {
    const map = {};
    for (let i = 29; i >= 0; i--) {
      map[new Date(Date.now() - i * 86400_000).toISOString().slice(0, 10)] = 0;
    }
    for (const r of (data || [])) {
      const key = (r[dayKey] || "").slice(0, 10);
      if (key in map) map[key] = Number(r[countKey]) || 0;
    }
    return Object.entries(map).map(([label, count]) => ({ label, count }));
  }

  // ── Load functions ─────────────────────────────────────────────────────────

  async function loadStats(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_stats", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error) return;
      const d = data || {};
      setStats({
        views:             d.views              || 0,
        uniqueSessions:    d.unique_sessions    || 0,
        shortlists:        d.shortlists         || 0,
        compares:          d.compares           || 0,
        enquiryStarted:    d.enquiry_started    || 0,
        enquirySubmitted:  d.enquiry_submitted  || 0,
        outbound:          d.outbound           || 0,
        viewToEnquiry:     parseFloat(d.view_to_enquiry    || 0),
        enquiryCompletion: parseFloat(d.enquiry_completion || 0),
      });
    } catch { /* silent */ }
  }

  async function loadPrevStats(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_stats", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error) return;
      const d = data || {};
      setPrevStats({
        views:             d.views              || 0,
        uniqueSessions:    d.unique_sessions    || 0,
        shortlists:        d.shortlists         || 0,
        compares:          d.compares           || 0,
        enquiryStarted:    d.enquiry_started    || 0,
        enquirySubmitted:  d.enquiry_submitted  || 0,
        outbound:          d.outbound           || 0,
        viewToEnquiry:     parseFloat(d.view_to_enquiry    || 0),
        enquiryCompletion: parseFloat(d.enquiry_completion || 0),
      });
    } catch { /* silent */ }
  }

  async function loadLiveCount() {
    try {
      const { data, error } = await supabase.rpc("get_listing_live_count", { p_listing_id: vendor.id });
      if (!error) setLiveCount(Number(data) || 0);
    } catch { /* silent */ }
  }

  async function loadSources(from, to) {
    try {
      const { data, error } = await supabase.rpc("get_listing_sources", {
        p_listing_id: vendor.id, p_from: from, p_to: to,
      });
      if (error || !data?.length) { setSources([]); return; }
      const counts = {};
      for (const row of data) {
        const src = classifySource({ utm_source: row.utm_source, referrer: row.referrer });
        counts[src] = (counts[src] || 0) + 1;
      }
      const total  = data.length;
      const sorted = Object.entries(counts)
        .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setSources(sorted);
    } catch { setSources([]); }
  }

  async function loadCompareList() {
    try {
      const { data, error } = await supabase.rpc("get_listing_compare_peers", { p_listing_id: vendor.id });
      if (error || !data?.length) { setCompareList([]); return; }
      setCompareList(data.map(r => ({ slug: r.listing_slug, type: r.entity_type, count: Number(r.sessions) })));
    } catch { setCompareList([]); }
  }

  async function loadDailyViews() {
    try {
      const { data, error } = await supabase.rpc("get_listing_daily_views", { p_listing_id: vendor.id });
      if (error) { setDailyViews([]); return; }
      setDailyViews(fillDailyMap(data, "day", "views"));
    } catch { setDailyViews([]); }
  }

  async function loadDailyShortlists() {
    try {
      const { data, error } = await supabase.rpc("get_listing_daily_events", {
        p_listing_id: vendor.id, p_event_type: "shortlist_add",
      });
      if (error) { setDailyShortlists([]); return; }
      setDailyShortlists(fillDailyMap(data, "day", "count"));
    } catch { setDailyShortlists([]); }
  }

  async function loadDailyEnquiries() {
    try {
      const { data, error } = await supabase.rpc("get_listing_daily_events", {
        p_listing_id: vendor.id, p_event_type: "enquiry_submitted",
      });
      if (error) { setDailyEnquiries([]); return; }
      setDailyEnquiries(fillDailyMap(data, "day", "count"));
    } catch { setDailyEnquiries([]); }
  }

  // ── loadAll — clears state immediately, then fetches ───────────────────────
  const loadAll = useCallback(async () => {
    if (!vendor?.id || !analyticsEnabled) { setLoading(false); return; }

    // Clear stale data immediately so range switches don't flash old numbers
    setStats(null);
    setPrevStats(null);
    setSources([]);
    setLoading(true);

    const { from, to }           = getRangeISO();
    const { from: pFrom, to: pTo } = getPrevRangeISO();

    await Promise.allSettled([
      loadStats(from, to),
      loadPrevStats(pFrom, pTo),
      loadLiveCount(),
      loadSources(from, to),
      loadCompareList(),
      loadDailyViews(),
      loadDailyShortlists(),
      loadDailyEnquiries(),
    ]);

    setLoading(false);
    setLastRefreshed(new Date());
  }, [vendor?.id, analyticsEnabled, getRangeISO, getPrevRangeISO]);

  // ── Realtime: live count polling + shortlist/compare notifications ─────────
  useEffect(() => {
    if (!vendor?.id || !analyticsEnabled) return;

    loadLiveCount();
    const liveTimer = setInterval(() => {
      loadLiveCount();
      setTick(n => n + 1); // re-render "Updated X ago"
    }, 30_000);

    const channel = supabase
      .channel(`vendor-analytics-${vendor.id}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "page_events",
        filter: `listing_id=eq.${vendor.id}`,
      }, (payload) => {
        const type = payload.new?.event_type;
        if (type === "shortlist_add" || type === "compare_add") {
          const id = ++notifIdRef.current;
          setNotifications(prev => [{ id, type, at: new Date() }, ...prev.slice(0, 4)]);
          setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 6000);
          loadLiveCount();
        }
        if (type === "page_view") {
          setLiveCount(c => c + 1);
          setTimeout(loadLiveCount, 5000);
        }
      })
      .subscribe();

    realtimeRef.current = channel;
    return () => { clearInterval(liveTimer); supabase.removeChannel(channel); };
  }, [vendor?.id, analyticsEnabled]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Guard ──────────────────────────────────────────────────────────────────
  if (!analyticsEnabled) return <LockedState C={C} />;

  // ── Computed values ────────────────────────────────────────────────────────
  const cs   = stats    || {};
  const prev = prevStats || {};

  const interpretation = buildInterpretation(stats, prevStats);

  const trendData =
    trendMetric === "shortlists" ? dailyShortlists :
    trendMetric === "enquiries"  ? dailyEnquiries  :
    dailyViews;

  const rangeLabel =
    range === "7d"  ? "Last 7 days" :
    range === "30d" ? "Last 30 days" :
    range === "custom" && customFrom ? `${customFrom} → ${customTo || "today"}` :
    "Last 7 days";

  const refreshLabel = fmtRefreshed(lastRefreshed);

  // Shared props for StatKPI
  const kpi = { loading, isMobile, cardBg, border, textPrimary, textMuted };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px",
            textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
            Performance Analytics
          </div>
          <h2 style={{ fontFamily: GD, fontSize: isMobile ? 22 : 28,
            color: textPrimary, fontWeight: 600, margin: 0 }}>
            Your Numbers
          </h2>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 4, flexWrap: "wrap" }}>
            <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>{rangeLabel}</span>
            {refreshLabel && (
              <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, opacity: 0.6 }}>
                · {refreshLabel}
              </span>
            )}
          </div>
        </div>

        {/* Range selector */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["7d", "30d", "custom"].map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: "0.5px",
              padding: "5px 12px", borderRadius: "var(--lwd-radius-input)",
              border: `1px solid ${range === r ? GOLD : border}`,
              background: range === r ? GOLD_DIM : "transparent",
              color: range === r ? GOLD : textMuted,
              cursor: "pointer", transition: "all 0.15s",
            }}>
              {r === "7d" ? "7 days" : r === "30d" ? "30 days" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date inputs */}
      {range === "custom" && (
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end", flexWrap: "wrap" }}>
          {[["From", customFrom, setCustomFrom], ["To", customTo, setCustomTo]].map(([lbl, val, set]) => (
            <div key={lbl} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <label style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                letterSpacing: "1.5px", textTransform: "uppercase" }}>{lbl}</label>
              <input type="date" value={val} onChange={e => set(e.target.value)} style={{
                fontFamily: NU, fontSize: 13, padding: "7px 12px",
                border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                background: cardBg, color: textPrimary, outline: "none",
              }} />
            </div>
          ))}
          {customFrom && customTo && (
            <button onClick={loadAll} style={{
              fontFamily: NU, fontSize: 12, fontWeight: 700, padding: "8px 18px",
              background: GOLD, color: "#000", border: "none",
              borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
            }}>Apply</button>
          )}
        </div>
      )}

      {/* ── Live notifications ───────────────────────────────────────────── */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map(n => (
            <div key={n.id} style={{
              display: "flex", alignItems: "center", gap: 10,
              padding: "10px 16px", background: GOLD_DIM,
              border: `1px solid ${GOLD_BORDER}`,
              borderRadius: "var(--lwd-radius-card)", animation: "fadeIn 0.3s ease",
            }}>
              <span style={{ fontSize: 14 }}>{n.type === "shortlist_add" ? "♡" : "⊞"}</span>
              <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                {n.type === "shortlist_add"
                  ? "A couple just saved your listing to their shortlist"
                  : "A couple added your listing to a comparison"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginLeft: "auto" }}>
                Just now
              </span>
            </div>
          ))}
        </div>
      )}

      {/* ── Live interest — emotional centrepiece ────────────────────────── */}
      <div style={{
        background: liveCount > 0 ? (isLight ? "#fdfcf8" : "rgba(201,168,76,0.05)") : cardBg,
        border: `1px solid ${liveCount > 0 ? "rgba(201,168,76,0.5)" : border}`,
        borderRadius: "var(--lwd-radius-card)",
        padding: isMobile ? "20px" : "24px 28px",
        display: "flex", alignItems: "center", gap: 20,
        boxShadow: liveCount > 0 ? `0 0 0 1px rgba(201,168,76,0.1), 0 8px 32px rgba(201,168,76,0.08)` : "none",
        transition: "all 0.5s ease",
      }}>
        {/* Pulse dot */}
        <div style={{ flexShrink: 0 }}>
          <div style={{
            width: liveCount > 0 ? 12 : 8,
            height: liveCount > 0 ? 12 : 8,
            borderRadius: "50%",
            background: liveCount > 0 ? "#4ade80" : "rgba(128,128,128,0.3)",
            animation: liveCount > 0 ? "livePulse 1.6s ease infinite" : "breathe 3s ease infinite",
            transition: "all 0.4s ease",
          }} />
        </div>

        <div style={{ flex: 1 }}>
          {liveCount > 0 ? (
            <>
              <div style={{ fontFamily: GD, fontSize: isMobile ? 20 : 26,
                color: textPrimary, fontWeight: 600, lineHeight: 1.2 }}>
                {liveCount === 1
                  ? "1 couple viewing your listing right now"
                  : `${liveCount} couples viewing your listing right now`}
              </div>
              <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginTop: 4 }}>
                Updated every 30 seconds · last 5 minutes of activity
              </div>
            </>
          ) : (
            <>
              <div style={{ fontFamily: GD, fontSize: isMobile ? 17 : 20,
                fontStyle: "italic", color: textMuted, lineHeight: 1.3 }}>
                Waiting for the next couple to discover your venue…
              </div>
              <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, opacity: 0.6, marginTop: 4 }}>
                Updated every 30 seconds · last 5 minutes of activity
              </div>
            </>
          )}
        </div>

        {liveCount > 0 && (
          <div style={{ fontFamily: GD, fontSize: isMobile ? 42 : 52,
            fontWeight: 700, color: GOLD, lineHeight: 1, flexShrink: 0,
            filter: "drop-shadow(0 0 12px rgba(201,168,76,0.3))" }}>
            {liveCount}
          </div>
        )}
      </div>

      {/* ── Interpretation block ─────────────────────────────────────────── */}
      {interpretation && !loading && (
        <div style={{
          borderLeft: `3px solid ${
            interpretation.sentiment === "positive" ? GOLD :
            interpretation.sentiment === "warning"  ? "#f59e0b" :
            "rgba(128,128,128,0.3)"
          }`,
          paddingLeft: 18,
          paddingTop: 2,
          paddingBottom: 2,
        }}>
          <div style={{ fontFamily: GD, fontSize: isMobile ? 16 : 18,
            color: textPrimary, fontWeight: 600, marginBottom: 4 }}>
            {interpretation.headline}
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: textMuted,
            lineHeight: 1.6, marginBottom: interpretation.benchmark ? 10 : 0 }}>
            {interpretation.subline}
          </div>
          {interpretation.benchmark && (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              padding: "3px 10px", borderRadius: 20,
              background: interpretation.benchmark.positive === true  ? "rgba(74,222,128,0.1)" :
                          interpretation.benchmark.positive === false ? "rgba(248,113,113,0.1)" :
                          GOLD_DIM,
              border: `1px solid ${
                interpretation.benchmark.positive === true  ? "rgba(74,222,128,0.25)" :
                interpretation.benchmark.positive === false ? "rgba(248,113,113,0.25)" :
                GOLD_BORDER
              }`,
            }}>
              <span style={{ fontSize: 9 }}>
                {interpretation.benchmark.positive === true  ? "▲" :
                 interpretation.benchmark.positive === false ? "▼" : "◆"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11,
                color: interpretation.benchmark.positive === true  ? "#4ade80" :
                       interpretation.benchmark.positive === false ? "#f87171" :
                       GOLD }}>
                {interpretation.benchmark.text}
              </span>
            </div>
          )}
        </div>
      )}

      {/* ── Primary KPI grid ─────────────────────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(5, 1fr)", gap: 12 }}>
        <StatKPI label="Profile Views"   value={cs.views}            prevValue={prev.views}            {...kpi} />
        <StatKPI label="Unique Visitors" value={cs.uniqueSessions}   prevValue={prev.uniqueSessions}   {...kpi} />
        <StatKPI label="Shortlisted"     value={cs.shortlists}       prevValue={prev.shortlists}       color={GOLD} {...kpi} />
        <StatKPI label="Enquiries"       value={cs.enquirySubmitted} prevValue={prev.enquirySubmitted} color="#4ade80" {...kpi} />
        <StatKPI label="Conversion"      value={cs.viewToEnquiry}    prevValue={prev.viewToEnquiry}    unit="%" {...kpi}
          style={{ gridColumn: isMobile ? "1 / -1" : undefined }} />
      </div>

      {/* ── Trend chart + Source breakdown ───────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>

        {/* Trend chart with metric selector */}
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
          <div style={{ display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 16, gap: 12, flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
                textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
                30-day trend
              </div>
              <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary }}>
                {trendMetric === "views"      ? "Profile Views" :
                 trendMetric === "shortlists" ? "Shortlists"    : "Enquiries"}
              </div>
            </div>
            {/* Metric selector */}
            <div style={{ display: "flex", gap: 3 }}>
              {[
                { key: "views",      label: "Views" },
                { key: "shortlists", label: "Saves" },
                { key: "enquiries",  label: "Enquiries" },
              ].map(({ key, label }) => (
                <button key={key} onClick={() => setTrendMetric(key)} style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: "0.3px",
                  padding: "3px 9px", borderRadius: "var(--lwd-radius-input)",
                  border: `1px solid ${trendMetric === key ? GOLD : border}`,
                  background: trendMetric === key ? GOLD_DIM : "transparent",
                  color: trendMetric === key ? GOLD : textMuted,
                  cursor: "pointer", transition: "all 0.12s",
                }}>
                  {label}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div style={{ height: 64, borderRadius: 4,
              background: "rgba(128,128,128,0.08)", animation: "shimmer 1.4s ease infinite" }} />
          ) : trendData.length > 0 && trendData.some(d => d.count > 0) ? (
            <>
              <Sparkline data={trendData.map(d => d.count)} color={GOLD} height={64} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                  {trendData[0]?.label ? fmtDay(trendData[0].label) : ""}
                </span>
                <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>Today</span>
              </div>
            </>
          ) : (
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                No data for this metric yet
              </span>
            </div>
          )}
        </div>

        {/* Source breakdown — count + % */}
        <div style={{ background: cardBg, border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
            textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
            Traffic origins
          </div>
          <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
            color: textPrimary, marginBottom: 16 }}>
            Where Couples Find You
          </div>

          {loading ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {[80, 55, 35, 20].map((w, i) => (
                <div key={i} style={{ height: 14, width: `${w}%`, borderRadius: 4,
                  background: "rgba(128,128,128,0.08)", animation: "shimmer 1.4s ease infinite" }} />
              ))}
            </div>
          ) : sources.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sources.map(s => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "center", marginBottom: 5 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: textMuted,
                        width: 14, textAlign: "center" }}>
                        {SOURCE_ICONS[s.label] || "◇"}
                      </span>
                      <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                        {s.label}
                      </span>
                    </div>
                    {/* count + % */}
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>
                        {s.count} visit{s.count === 1 ? "" : "s"}
                      </span>
                      <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700,
                        color: textPrimary, minWidth: 32, textAlign: "right" }}>
                        {s.pct}%
                      </span>
                    </div>
                  </div>
                  <div style={{ height: 3, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)",
                    borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ width: `${s.pct}%`, height: "100%",
                      background: `linear-gradient(90deg, ${GOLD}, ${GOLD}99)`,
                      borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                Source data will appear once views are tracked
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Secondary KPI grid ───────────────────────────────────────────── */}
      <div style={{ display: "grid",
        gridTemplateColumns: isMobile ? "repeat(2, 1fr)" : "repeat(4, 1fr)", gap: 12 }}>
        <StatKPI label="Compared"               value={cs.compares}           prevValue={prev.compares}           {...kpi} />
        <StatKPI label="Enquiry Started"         value={cs.enquiryStarted}     prevValue={prev.enquiryStarted}     {...kpi} />
        <StatKPI label="Enquiry Completion"      value={cs.enquiryCompletion}  prevValue={prev.enquiryCompletion}  unit="%" {...kpi} />
        <StatKPI label="Website Clicks"          value={cs.outbound}           prevValue={prev.outbound}           {...kpi} />
      </div>

      {/* ── Compare intelligence ─────────────────────────────────────────── */}
      <div style={{ background: cardBg, border: `1px solid ${border}`,
        borderRadius: "var(--lwd-radius-card)", padding: "20px 22px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px",
          textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
          Compare intelligence · last 30 days
        </div>
        <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700,
          color: textPrimary, marginBottom: 4 }}>
          Who Couples Compare You Against
        </div>
        <div style={{ fontFamily: NU, fontSize: 12, color: textMuted,
          marginBottom: 16, lineHeight: 1.5 }}>
          Listings that appear in the same comparison sessions as yours.
          No other directory surfaces this.
        </div>

        {loading ? (
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
            {[1, 2, 3, 4].map(i => (
              <div key={i} style={{ height: 52, borderRadius: "var(--lwd-radius-input)",
                background: "rgba(128,128,128,0.06)", animation: "shimmer 1.4s ease infinite" }} />
            ))}
          </div>
        ) : compareList.length > 0 ? (
          <div style={{ display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
            {compareList.map((item, i) => {
              const url = peerUrl(item.slug, item.type);
              const WrapEl = url ? "a" : "div";
              return (
                <WrapEl key={item.slug || i} href={url || undefined}
                  target={url ? "_blank" : undefined}
                  rel={url ? "noopener noreferrer" : undefined}
                  style={{
                    display: "flex", alignItems: "center",
                    justifyContent: "space-between", padding: "12px 16px",
                    background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                    border: `1px solid ${border}`,
                    borderRadius: "var(--lwd-radius-input)",
                    textDecoration: "none", cursor: url ? "pointer" : "default",
                    transition: "background 0.15s, border-color 0.15s",
                    ...(url ? { ":hover": { background: GOLD_DIM } } : {}),
                  }}
                  onMouseEnter={url ? e => {
                    e.currentTarget.style.background = GOLD_DIM;
                    e.currentTarget.style.borderColor = GOLD_BORDER;
                  } : undefined}
                  onMouseLeave={url ? e => {
                    e.currentTarget.style.background = isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)";
                    e.currentTarget.style.borderColor = border;
                  } : undefined}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <span style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                      width: 18, textAlign: "right" }}>
                      {i + 1}.
                    </span>
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 13,
                        color: url ? GOLD : textPrimary, fontWeight: 600 }}>
                        {item.slug
                          ? item.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                          : "Unknown listing"}
                      </div>
                      {item.type && (
                        <div style={{ fontFamily: NU, fontSize: 10, color: textMuted,
                          textTransform: "capitalize", marginTop: 1 }}>
                          {item.type}{url ? " ↗" : ""}
                        </div>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                    <span style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: GOLD }}>
                      {item.count}
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                      {item.count === 1 ? "session" : "sessions"}
                    </span>
                  </div>
                </WrapEl>
              );
            })}
          </div>
        ) : (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <span style={{ fontFamily: NU, fontSize: 13, color: textMuted }}>
              No comparison data yet. Once couples start comparing listings,
              you'll see who they measure you against.
            </span>
          </div>
        )}
      </div>

      {/* ── CSS ──────────────────────────────────────────────────────────── */}
      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.5); }
          70%  { box-shadow: 0 0 0 10px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes breathe {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(1.15); }
        }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.75; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
