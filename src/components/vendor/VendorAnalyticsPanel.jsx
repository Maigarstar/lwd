// ─── src/components/vendor/VendorAnalyticsPanel.jsx ─────────────────────────
// Full vendor analytics panel — all 9 intelligence features.
// Gated behind vendor.analytics_enabled (admin toggles per vendor).
//
// Features:
//  1. KPI stats (views, unique visitors, shortlists, enquiries, conversion)
//  2. Week-on-week delta (% vs prior period)
//  3. Live interest widget ("X couples viewing right now")
//  4. Source breakdown (Google, Instagram, Direct, etc.)
//  5. Compare intelligence (which listings this one is compared against)
//  6. Real-time notifications (shortlist/compare events while on the page)
//  7. Custom date range picker
//  8. Historical trend chart (daily views sparkline)
//  9. All queries use listing_id = vendor.id against vendor_stats_* views
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_DIM = "rgba(201,168,76,0.12)";

// ── Tiny helpers ─────────────────────────────────────────────────────────────

function fmtNum(n) {
  if (n == null) return "—";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(/\.0$/, "") + "k";
  return String(n);
}

function fmtPct(n) {
  if (n == null) return "—";
  return parseFloat(n).toFixed(1) + "%";
}

function deltaColor(v) {
  if (v > 0) return "#4ade80";
  if (v < 0) return "#f87171";
  return "#888";
}

function deltaLabel(curr, prev) {
  if (prev == null || prev === 0 || curr == null) return null;
  const pct = ((curr - prev) / prev) * 100;
  const sign = pct >= 0 ? "↑" : "↓";
  return { pct: Math.abs(pct).toFixed(0), sign, positive: pct >= 0 };
}

// Classify a referrer / utm_source into a display bucket
function classifySource(row) {
  const src = (row.utm_source || "").toLowerCase();
  const ref = (row.referrer || "").toLowerCase();

  if (src === "google"    || ref.includes("google"))    return "Google";
  if (src === "instagram" || ref.includes("instagram")) return "Instagram";
  if (src === "facebook"  || ref.includes("facebook"))  return "Facebook";
  if (src === "pinterest" || ref.includes("pinterest")) return "Pinterest";
  if (src === "tiktok"    || ref.includes("tiktok"))    return "TikTok";
  if (src === "twitter"   || ref.includes("twitter"))   return "Twitter";
  if (ref.includes("luxuryweddingdirectory") || ref.includes("localhost")) return "Internal";
  if (ref)                                               return "Other";
  return "Direct";
}

const SOURCE_ICONS = {
  Google:    "G",
  Instagram: "◎",
  Facebook:  "f",
  Pinterest: "P",
  TikTok:    "♩",
  Twitter:   "𝕏",
  Direct:    "→",
  Internal:  "↺",
  Other:     "◇",
};

// ── Sparkline chart ──────────────────────────────────────────────────────────

function Sparkline({ data = [], color = GOLD, height = 56 }) {
  if (!data.length) return null;
  const max = Math.max(...data, 1);
  const w = 100 / data.length;
  const pts = data
    .map((v, i) => {
      const x = i * w + w / 2;
      const y = height - (v / max) * (height - 6) - 3;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      style={{ width: "100%", height, display: "block" }}
    >
      {/* Area fill */}
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <polygon
        points={`0,${height} ${pts} 100,${height}`}
        fill="url(#spark-grad)"
      />
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Locked upgrade state ─────────────────────────────────────────────────────

function LockedState({ C }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 32px",
        textAlign: "center",
        gap: 20,
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: "50%",
          background: GOLD_DIM,
          border: `1px solid rgba(201,168,76,0.25)`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 28,
          marginBottom: 8,
        }}
      >
        ◎
      </div>
      <div>
        <div style={{ fontFamily: GD, fontSize: 22, color: C.white, fontWeight: 500, marginBottom: 8 }}>
          Analytics & Intelligence
        </div>
        <div style={{ fontFamily: NU, fontSize: 14, color: C.grey, lineHeight: 1.7, maxWidth: 380 }}>
          See exactly who is viewing your listing, where they&rsquo;re coming from, and how you compare — available on Featured and Elite plans.
        </div>
      </div>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 10,
          alignItems: "flex-start",
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: "var(--lwd-radius-card)",
          padding: "20px 24px",
          maxWidth: 360,
          width: "100%",
        }}
      >
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
  // Guard — analytics_enabled must be explicitly true (admin-toggled)
  const analyticsEnabled = vendor?.analytics_enabled === true;

  // ── State ────────────────────────────────────────────────────────────────────
  const [range, setRange]           = useState("7d"); // "7d" | "30d" | "custom"
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo]     = useState("");

  const [stats, setStats]           = useState(null);   // current period
  const [prevStats, setPrevStats]   = useState(null);   // previous period for delta
  const [liveCount, setLiveCount]   = useState(0);
  const [sources, setSources]       = useState([]);
  const [compareList, setCompareList] = useState([]);
  const [dailyViews, setDailyViews] = useState([]);     // [{label, count}] × 30d
  const [loading, setLoading]       = useState(true);
  const [notifications, setNotifications] = useState([]); // [{id, type, at}]
  const notifIdRef = useRef(0);
  const realtimeRef = useRef(null);

  // ── Date range helpers ───────────────────────────────────────────────────────
  const getRangeISO = useCallback(() => {
    const now = Date.now();
    if (range === "7d")  return { from: new Date(now - 7  * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "30d") return { from: new Date(now - 30 * 86400_000).toISOString(), to: new Date(now).toISOString() };
    if (range === "custom" && customFrom && customTo) {
      return { from: new Date(customFrom).toISOString(), to: new Date(customTo + "T23:59:59").toISOString() };
    }
    return { from: new Date(now - 7 * 86400_000).toISOString(), to: new Date(now).toISOString() };
  }, [range, customFrom, customTo]);

  const getPrevRangeISO = useCallback(() => {
    const { from, to } = getRangeISO();
    const span = new Date(to) - new Date(from);
    return {
      from: new Date(new Date(from) - span).toISOString(),
      to:   from,
    };
  }, [getRangeISO]);

  // ── Load all data ────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    if (!vendor?.id || !analyticsEnabled) return;
    setLoading(true);

    const { from, to }         = getRangeISO();
    const { from: pFrom, to: pTo } = getPrevRangeISO();

    await Promise.allSettled([
      loadStats(from, to),
      loadPrevStats(pFrom, pTo),
      loadLiveCount(),
      loadSources(from, to),
      loadCompareList(),
      loadDailyViews(),
    ]);

    setLoading(false);
  }, [vendor?.id, analyticsEnabled, getRangeISO, getPrevRangeISO]);

  // ── 1 + 2: Stats + previous period ──────────────────────────────────────────
  async function loadStats(from, to) {
    try {
      const { data } = await supabase
        .from("page_events")
        .select("event_type, session_id")
        .eq("listing_id", vendor.id)
        .gte("created_at", from)
        .lte("created_at", to);

      if (!data) return;
      setStats(aggregateEvents(data));
    } catch { /* silent */ }
  }

  async function loadPrevStats(from, to) {
    try {
      const { data } = await supabase
        .from("page_events")
        .select("event_type, session_id")
        .eq("listing_id", vendor.id)
        .gte("created_at", from)
        .lte("created_at", to);

      if (!data) return;
      setPrevStats(aggregateEvents(data));
    } catch { /* silent */ }
  }

  function aggregateEvents(rows) {
    const sessions = new Set();
    let views = 0, shortlists = 0, compares = 0, enquiryStarted = 0, enquirySubmitted = 0, outbound = 0;
    for (const r of rows) {
      if (r.session_id) sessions.add(r.session_id);
      if (r.event_type === "page_view")          views++;
      if (r.event_type === "shortlist_add")      shortlists++;
      if (r.event_type === "compare_add")        compares++;
      if (r.event_type === "enquiry_started")    enquiryStarted++;
      if (r.event_type === "enquiry_submitted")  enquirySubmitted++;
      if (r.event_type === "outbound_click")     outbound++;
    }
    const viewToEnquiry = views > 0 ? (enquirySubmitted / views) * 100 : 0;
    const enquiryCompletion = enquiryStarted > 0 ? (enquirySubmitted / enquiryStarted) * 100 : 0;
    return {
      views,
      uniqueSessions: sessions.size,
      shortlists,
      compares,
      enquiryStarted,
      enquirySubmitted,
      outbound,
      viewToEnquiry: parseFloat(viewToEnquiry.toFixed(1)),
      enquiryCompletion: parseFloat(enquiryCompletion.toFixed(1)),
    };
  }

  // ── 3: Live interest ─────────────────────────────────────────────────────────
  async function loadLiveCount() {
    try {
      const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
      const { count } = await supabase
        .from("live_sessions")
        .select("session_id", { count: "exact", head: true })
        .eq("current_listing_id", vendor.id)
        .gte("last_seen_at", cutoff);
      setLiveCount(count || 0);
    } catch { /* silent */ }
  }

  // ── 4: Source breakdown ──────────────────────────────────────────────────────
  async function loadSources(from, to) {
    try {
      const { data } = await supabase
        .from("page_events")
        .select("utm_source, referrer")
        .eq("listing_id", vendor.id)
        .eq("event_type", "page_view")
        .gte("created_at", from)
        .lte("created_at", to);

      if (!data?.length) { setSources([]); return; }

      const counts = {};
      for (const row of data) {
        const src = classifySource(row);
        counts[src] = (counts[src] || 0) + 1;
      }
      const total = data.length;
      const sorted = Object.entries(counts)
        .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);
      setSources(sorted);
    } catch { /* silent */ }
  }

  // ── 5: Compare intelligence ──────────────────────────────────────────────────
  async function loadCompareList() {
    try {
      // Step 1: sessions where this listing was compared
      const { data: mySess } = await supabase
        .from("page_events")
        .select("session_id")
        .eq("listing_id", vendor.id)
        .eq("event_type", "compare_add")
        .gte("created_at", new Date(Date.now() - 30 * 86400_000).toISOString());

      if (!mySess?.length) { setCompareList([]); return; }

      const sessionIds = [...new Set(mySess.map(s => s.session_id))].slice(0, 100);

      // Step 2: other listings compared in those same sessions
      const { data: others } = await supabase
        .from("page_events")
        .select("listing_id, listing_slug, entity_type")
        .in("session_id", sessionIds)
        .eq("event_type", "compare_add")
        .neq("listing_id", vendor.id);

      if (!others?.length) { setCompareList([]); return; }

      const tally = {};
      for (const r of others) {
        const key = r.listing_slug || r.listing_id;
        if (!key) continue;
        tally[key] = tally[key]
          ? { ...tally[key], count: tally[key].count + 1 }
          : { slug: r.listing_slug, id: r.listing_id, type: r.entity_type, count: 1 };
      }
      const sorted = Object.values(tally).sort((a, b) => b.count - a.count).slice(0, 8);
      setCompareList(sorted);
    } catch { /* silent */ }
  }

  // ── 8: Historical daily views ─────────────────────────────────────────────
  async function loadDailyViews() {
    try {
      const from = new Date(Date.now() - 30 * 86400_000).toISOString();
      const { data } = await supabase
        .from("page_events")
        .select("created_at")
        .eq("listing_id", vendor.id)
        .eq("event_type", "page_view")
        .gte("created_at", from);

      if (!data?.length) { setDailyViews([]); return; }

      // Build last-30-day bucket map
      const map = {};
      for (let i = 29; i >= 0; i--) {
        const d = new Date(Date.now() - i * 86400_000);
        const key = d.toISOString().slice(0, 10);
        map[key] = 0;
      }
      for (const r of data) {
        const key = r.created_at.slice(0, 10);
        if (key in map) map[key]++;
      }
      setDailyViews(Object.entries(map).map(([label, count]) => ({ label, count })));
    } catch { /* silent */ }
  }

  // ── 3 (live refresh) + 6: Realtime subscription ──────────────────────────────
  useEffect(() => {
    if (!vendor?.id || !analyticsEnabled) return;

    // Poll live count every 30s
    loadLiveCount();
    const liveTimer = setInterval(loadLiveCount, 30_000);

    // Realtime channel for shortlist/compare notifications
    const channel = supabase
      .channel(`vendor-analytics-${vendor.id}`)
      .on(
        "postgres_changes",
        {
          event:  "INSERT",
          schema: "public",
          table:  "page_events",
          filter: `listing_id=eq.${vendor.id}`,
        },
        (payload) => {
          const type = payload.new?.event_type;
          if (type === "shortlist_add" || type === "compare_add") {
            const id = ++notifIdRef.current;
            setNotifications(prev => [
              { id, type, at: new Date() },
              ...prev.slice(0, 4),
            ]);
            // Auto-dismiss after 6s
            setTimeout(() => {
              setNotifications(prev => prev.filter(n => n.id !== id));
            }, 6000);
            // Refresh live count
            loadLiveCount();
          }
          if (type === "page_view") {
            // Bump live count optimistically
            setLiveCount(c => c + 1);
            setTimeout(loadLiveCount, 5000);
          }
        }
      )
      .subscribe();

    realtimeRef.current = channel;

    return () => {
      clearInterval(liveTimer);
      supabase.removeChannel(channel);
    };
  }, [vendor?.id, analyticsEnabled]);

  // Load on mount + range change
  useEffect(() => { loadAll(); }, [loadAll]);

  // ── Render ────────────────────────────────────────────────────────────────────
  if (!analyticsEnabled) return <LockedState C={C} />;

  const isLight = C.bg === "#F2EFE9" || C.bg?.startsWith("#F");
  const cardBg  = isLight ? "#FFFFFF" : C.card;
  const border  = isLight ? "rgba(0,0,0,0.08)" : C.border;
  const textPrimary = isLight ? "#1a1a1a" : C.white;
  const textMuted   = isLight ? "rgba(28,20,16,0.5)" : C.grey;

  function StatKPI({ label, value, prevValue, unit = "", color }) {
    const dl = (prevValue != null && value != null) ? deltaLabel(value, prevValue) : null;
    return (
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)",
          padding: isMobile ? "16px" : "20px 22px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: textMuted }}>
          {label}
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
          <div style={{ fontFamily: GD, fontSize: isMobile ? 26 : 30, fontWeight: 700, color: color || textPrimary, lineHeight: 1 }}>
            {loading ? "—" : fmtNum(value)}
          </div>
          {unit && <div style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginBottom: 3 }}>{unit}</div>}
        </div>
        {dl && !loading && (
          <div style={{ fontFamily: NU, fontSize: 11, color: deltaColor(dl.positive ? 1 : -1), display: "flex", alignItems: "center", gap: 3 }}>
            <span>{dl.sign} {dl.pct}%</span>
            <span style={{ color: textMuted, fontWeight: 300 }}>vs prior period</span>
          </div>
        )}
        {!dl && !loading && prevValue != null && (
          <div style={{ fontFamily: NU, fontSize: 11, color: textMuted }}>No change</div>
        )}
      </div>
    );
  }

  const currentStats = stats || {};
  const prev = prevStats || {};

  // Date range label for header
  const { from, to } = getRangeISO();
  const rangeLabel =
    range === "7d"  ? "Last 7 days" :
    range === "30d" ? "Last 30 days" :
    range === "custom" && customFrom ? `${customFrom} → ${customTo || "today"}` :
    "Last 7 days";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* ── Header + range selector ─────────────────────────────────────── */}
      <div style={{ display: "flex", alignItems: isMobile ? "flex-start" : "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "3px", textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
            Performance Analytics
          </div>
          <h2 style={{ fontFamily: GD, fontSize: isMobile ? 22 : 28, color: textPrimary, fontWeight: 600, margin: 0 }}>
            Your Numbers
          </h2>
          <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginTop: 4 }}>{rangeLabel}</div>
        </div>

        {/* Range selector */}
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {["7d", "30d", "custom"].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              style={{
                fontFamily: NU,
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: "0.5px",
                padding: "5px 12px",
                borderRadius: "var(--lwd-radius-input)",
                border: `1px solid ${range === r ? GOLD : border}`,
                background: range === r ? GOLD_DIM : "transparent",
                color: range === r ? GOLD : textMuted,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {r === "7d" ? "7d" : r === "30d" ? "30d" : "Custom"}
            </button>
          ))}
        </div>
      </div>

      {/* Custom date range inputs */}
      {range === "custom" && (
        <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: NU, fontSize: 10, color: textMuted, letterSpacing: "1.5px", textTransform: "uppercase" }}>From</label>
            <input
              type="date"
              value={customFrom}
              onChange={e => setCustomFrom(e.target.value)}
              style={{
                fontFamily: NU, fontSize: 13, padding: "7px 12px",
                border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                background: cardBg, color: textPrimary, outline: "none",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <label style={{ fontFamily: NU, fontSize: 10, color: textMuted, letterSpacing: "1.5px", textTransform: "uppercase" }}>To</label>
            <input
              type="date"
              value={customTo}
              onChange={e => setCustomTo(e.target.value)}
              style={{
                fontFamily: NU, fontSize: 13, padding: "7px 12px",
                border: `1px solid ${border}`, borderRadius: "var(--lwd-radius-input)",
                background: cardBg, color: textPrimary, outline: "none",
              }}
            />
          </div>
          {customFrom && customTo && (
            <button
              onClick={loadAll}
              style={{
                fontFamily: NU, fontSize: 12, fontWeight: 700, padding: "8px 18px", marginTop: 18,
                background: GOLD, color: "#000", border: "none", borderRadius: "var(--lwd-radius-input)", cursor: "pointer",
              }}
            >
              Apply
            </button>
          )}
        </div>
      )}

      {/* ── Live notifications (item 6) ─────────────────────────────────── */}
      {notifications.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {notifications.map(n => (
            <div
              key={n.id}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "10px 16px",
                background: GOLD_DIM,
                border: `1px solid rgba(201,168,76,0.3)`,
                borderRadius: "var(--lwd-radius-card)",
                animation: "fadeIn 0.3s ease",
              }}
            >
              <span style={{ fontSize: 14 }}>{n.type === "shortlist_add" ? "♡" : "⊞"}</span>
              <span style={{ fontFamily: NU, fontSize: 13, color: textPrimary }}>
                {n.type === "shortlist_add"
                  ? "A couple just saved your listing to their shortlist"
                  : "A couple added your listing to a comparison"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, marginLeft: "auto" }}>Just now</span>
            </div>
          ))}
        </div>
      )}

      {/* ── Live interest widget (item 3) ───────────────────────────────── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${liveCount > 0 ? "rgba(201,168,76,0.4)" : border}`,
          borderRadius: "var(--lwd-radius-card)",
          padding: "18px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
          boxShadow: liveCount > 0 ? `0 0 0 1px rgba(201,168,76,0.12), 0 4px 20px rgba(201,168,76,0.07)` : "none",
          transition: "all 0.4s ease",
        }}
      >
        {/* Pulse dot */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div
            style={{
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: liveCount > 0 ? "#4ade80" : textMuted,
              boxShadow: liveCount > 0 ? "0 0 0 0 rgba(74,222,128,0.4)" : "none",
              animation: liveCount > 0 ? "livePulse 1.8s ease infinite" : "none",
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: GD, fontSize: isMobile ? 18 : 22, color: liveCount > 0 ? textPrimary : textMuted, fontWeight: 500 }}>
            {liveCount > 0
              ? `${liveCount} ${liveCount === 1 ? "couple" : "couples"} viewing your listing right now`
              : "No one viewing right now"}
          </div>
          <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginTop: 3 }}>
            Updated every 30 seconds · last 5 minutes of activity
          </div>
        </div>
        {liveCount > 0 && (
          <div
            style={{
              fontFamily: GD,
              fontSize: 36,
              fontWeight: 700,
              color: GOLD,
              lineHeight: 1,
              flexShrink: 0,
            }}
          >
            {liveCount}
          </div>
        )}
      </div>

      {/* ── KPI grid (item 1) ───────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(5,1fr)", gap: 12 }}>
        <StatKPI label="Profile Views"    value={currentStats.views}            prevValue={prev.views}            />
        <StatKPI label="Unique Visitors"  value={currentStats.uniqueSessions}   prevValue={prev.uniqueSessions}   />
        <StatKPI label="Shortlisted"      value={currentStats.shortlists}       prevValue={prev.shortlists}       color={GOLD} />
        <StatKPI label="Enquiries"        value={currentStats.enquirySubmitted} prevValue={prev.enquirySubmitted} color="#4ade80" />
        <StatKPI label="Conversion"       value={currentStats.viewToEnquiry}    prevValue={prev.viewToEnquiry}    unit="%" />
      </div>

      {/* ── Trend chart + Source breakdown (items 8 + 4) ───────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: 20 }}>

        {/* Trend chart */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: "var(--lwd-radius-card)",
            padding: "20px 22px",
          }}
        >
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>30-day trend</div>
          <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Profile Views</div>
          {dailyViews.length > 0 ? (
            <>
              <Sparkline data={dailyViews.map(d => d.count)} color={GOLD} height={64} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6 }}>
                <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                  {dailyViews[0]?.label?.slice(5)}
                </span>
                <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>Today</span>
              </div>
            </>
          ) : (
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                {loading ? "Loading…" : "No view data yet — check back once your profile is live"}
              </span>
            </div>
          )}
        </div>

        {/* Source breakdown */}
        <div
          style={{
            background: cardBg,
            border: `1px solid ${border}`,
            borderRadius: "var(--lwd-radius-card)",
            padding: "20px 22px",
          }}
        >
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>Traffic origins</div>
          <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 16 }}>Where Couples Find You</div>

          {sources.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {sources.map(s => (
                <div key={s.label}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: textMuted, width: 14, textAlign: "center" }}>
                        {SOURCE_ICONS[s.label] || "◇"}
                      </span>
                      <span style={{ fontFamily: NU, fontSize: 12, color: textPrimary }}>{s.label}</span>
                    </div>
                    <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: textPrimary }}>{s.pct}%</span>
                  </div>
                  <div style={{ height: 4, background: isLight ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                    <div
                      style={{
                        width: `${s.pct}%`,
                        height: "100%",
                        background: `linear-gradient(90deg, ${GOLD}, ${GOLD}aa)`,
                        borderRadius: 2,
                        transition: "width 0.6s ease",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ height: 64, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: textMuted }}>
                {loading ? "Loading…" : "Source data will appear once views are tracked"}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Secondary KPIs ──────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: isMobile ? "repeat(2,1fr)" : "repeat(4,1fr)", gap: 12 }}>
        <StatKPI label="Compared"          value={currentStats.compares}           prevValue={prev.compares}           />
        <StatKPI label="Enquiry Started"   value={currentStats.enquiryStarted}     prevValue={prev.enquiryStarted}     />
        <StatKPI label="Enquiry Completed" value={currentStats.enquiryCompletion}  prevValue={prev.enquiryCompletion}  unit="%" />
        <StatKPI label="Website Clicks"    value={currentStats.outbound}           prevValue={prev.outbound}           />
      </div>

      {/* ── Compare intelligence (item 5) ───────────────────────────────── */}
      <div
        style={{
          background: cardBg,
          border: `1px solid ${border}`,
          borderRadius: "var(--lwd-radius-card)",
          padding: "20px 22px",
        }}
      >
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: textMuted, marginBottom: 4 }}>
          Compare intelligence · last 30 days
        </div>
        <div style={{ fontFamily: NU, fontSize: 15, fontWeight: 700, color: textPrimary, marginBottom: 4 }}>
          Who Couples Compare You Against
        </div>
        <div style={{ fontFamily: NU, fontSize: 12, color: textMuted, marginBottom: 16, lineHeight: 1.5 }}>
          Listings that appear in the same comparison sessions as yours. No other directory surfaces this.
        </div>

        {compareList.length > 0 ? (
          <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "repeat(2,1fr)", gap: 10 }}>
            {compareList.map((item, i) => (
              <div
                key={item.slug || item.id || i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "10px 14px",
                  background: isLight ? "rgba(0,0,0,0.02)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${border}`,
                  borderRadius: "var(--lwd-radius-input)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontFamily: NU, fontSize: 10, color: textMuted, width: 16, textAlign: "right" }}>
                    {i + 1}.
                  </span>
                  <div>
                    <div style={{ fontFamily: NU, fontSize: 13, color: textPrimary, fontWeight: 600 }}>
                      {item.slug
                        ? item.slug.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase())
                        : "Unknown listing"}
                    </div>
                    {item.type && (
                      <div style={{ fontFamily: NU, fontSize: 10, color: textMuted, textTransform: "capitalize", marginTop: 1 }}>
                        {item.type}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                  <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: GOLD }}>{item.count}</span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: textMuted }}>
                    {item.count === 1 ? "session" : "sessions"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ padding: "20px 0", textAlign: "center" }}>
            <span style={{ fontFamily: NU, fontSize: 13, color: textMuted }}>
              {loading
                ? "Loading…"
                : "No comparison data yet. Once couples start comparing listings, you'll see who they measure you against."}
            </span>
          </div>
        )}
      </div>

      {/* ── CSS animations ──────────────────────────────────────────────── */}
      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(74,222,128,0.4); }
          70%  { box-shadow: 0 0 0 8px rgba(74,222,128,0); }
          100% { box-shadow: 0 0 0 0 rgba(74,222,128,0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
