// ─── src/pages/AdminModules/AdminVendorIntelligenceView.jsx ──────────────────
// Crown jewel admin overlay — pull up ANY vendor and see everything.
// Props: vendorId, vendorName, onClose, C
// 5 tabs: Vendor View · Deep Data · Benchmarks · Report History · Admin Controls
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";
import VendorAnalyticsPanel from "../../components/vendor/VendorAnalyticsPanel";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";

// ── Helpers ────────────────────────────────────────────────────────────────

function flag(code) {
  if (!code || code.length < 2) return "";
  try {
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => c.charCodeAt(0) + 127397));
  } catch { return ""; }
}

function fmtTs(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-GB", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return "—"; }
}

function fmtDate(ts) {
  if (!ts) return "—";
  try {
    return new Date(ts).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function fmt(n) {
  if (n == null) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtPct(val) {
  if (val == null) return "—";
  return `${Number(val).toFixed(1)}%`;
}

function fmtCcy(n) {
  if (!n) return "—";
  if (n >= 1000) return `£${(n / 1000).toFixed(0)}k`;
  return `£${n}`;
}

// Event type badge colour map
const EVENT_COLOURS = {
  page_view:          "#3b82f6",
  shortlist_add:      "#a855f7",
  compare_add:        "#f59e0b",
  enquiry_started:    "#22c55e",
  enquiry_submitted:  "#16a34a",
  profile_link_click: "#ec4899",
  outbound_click:     "#f97316",
  video_play:         "#0ea5e9",
};

function EventBadge({ type }) {
  const color = EVENT_COLOURS[type] || "#6b7280";
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
      color, background: color + "22", padding: "2px 8px", borderRadius: 100,
      whiteSpace: "nowrap",
    }}>
      {type?.replace(/_/g, " ") || "—"}
    </span>
  );
}

// ── Tab bar ────────────────────────────────────────────────────────────────

function TabBar({ tabs, active, onChange, C }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 0 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "12px 22px", cursor: "pointer",
            background: "transparent", border: "none",
            borderBottom: `2px solid ${active === tab.key ? GOLD : "transparent"}`,
            color: active === tab.key ? GOLD : C.grey,
            transition: "color 0.15s, border-color 0.15s",
          }}
        >{tab.label}</button>
      ))}
    </div>
  );
}

// ── Tab 1: Vendor View ─────────────────────────────────────────────────────

function VendorViewTab({ vendorId, vendorName, vendorData, C }) {
  return (
    <div>
      {/* Admin-only info bar */}
      <div style={{
        border: `1px solid ${GOLD_BORDER}`,
        borderLeft: `4px solid ${GOLD}`,
        background: GOLD_DIM,
        borderRadius: 6,
        padding: "10px 16px",
        marginBottom: 24,
        display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16,
      }}>
        <span style={{ fontFamily: NU, fontSize: 11, color: GOLD, fontWeight: 700 }}>⚑ Admin View</span>
        <span style={{ fontFamily: NU, fontSize: 11, color: C.off }}>{vendorName}</span>
        <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
          analytics_enabled: <span style={{ color: vendorData?.analytics_enabled ? "#22c55e" : "#ef4444" }}>
            {vendorData?.analytics_enabled ? "ON" : "OFF"}
          </span>
        </span>
        <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
          report_frequency: <span style={{ color: C.off }}>{vendorData?.report_frequency || "monthly"}</span>
        </span>
        <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>
          ROI settings: <span style={{ color: C.off }}>{vendorData?.roi_settings_set_at ? "personalised" : "default"}</span>
        </span>
      </div>

      <VendorAnalyticsPanel
        vendor={{
          id: vendorId,
          name: vendorName,
          analytics_enabled: true,
          email: vendorData?.email,
          isAdminPreview: true,
        }}
        C={C}
        isMobile={false}
      />
    </div>
  );
}

// ── Tab 2: Deep Data ───────────────────────────────────────────────────────

function DeepDataTab({ vendorId, C }) {
  const [events, setEvents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [countries, setCountries] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const from90 = new Date(Date.now() - 90 * 86400_000).toISOString();
    const to     = new Date().toISOString();

    try {
      const [eventsRes, sessionsRes, countriesRes] = await Promise.all([
        supabase
          .from("page_events")
          .select("event_type, created_at, session_id, listing_slug, entity_type")
          .eq("listing_id", vendorId)
          .order("created_at", { ascending: false })
          .limit(50),
        supabase
          .from("live_sessions")
          .select("session_id, country_code, country_name, device_type, browser, last_seen_at, page_count, utm_source, referrer")
          .eq("current_listing_id", vendorId)
          .order("last_seen_at", { ascending: false })
          .limit(20),
        supabase.rpc("get_listing_countries", {
          p_listing_id: vendorId,
          p_from: from90,
          p_to: to,
        }),
      ]);

      setEvents(eventsRes.data || []);
      setSessions(sessionsRes.data || []);
      setCountries(countriesRes.data || []);
    } catch (e) {
      console.warn("[AdminVendorIntelligence] DeepData load error:", e);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { load(); }, [load]);

  const totalCountrySessions = countries.reduce((s, r) => s + (r.sessions || 0), 0);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: NU, fontSize: 13, color: C.grey }}>Loading deep data…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>

      {/* Recent Events Log */}
      <div>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 12 }}>
          Recent Events (last 50)
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 160px 1fr 130px", gap: 12, padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
            {["Timestamp", "Event Type", "Slug", "Session"].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {events.length === 0 && (
            <div style={{ padding: "24px 16px", fontFamily: NU, fontSize: 12, color: C.grey }}>No events recorded yet.</div>
          )}
          {events.map((ev, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "160px 160px 1fr 130px",
              gap: 12, padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
              alignItems: "center",
            }}>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmtTs(ev.created_at)}</span>
              <EventBadge type={ev.event_type} />
              <span style={{ fontFamily: NU, fontSize: 11, color: C.off, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ev.listing_slug || "—"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ev.session_id ? ev.session_id.slice(0, 16) + "…" : "—"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Sessions */}
      <div>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 12 }}>
          Sessions Currently Viewing (or recently)
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: "160px 120px 80px 80px 60px 100px", gap: 12, padding: "8px 16px", borderBottom: `1px solid ${C.border}` }}>
            {["Last Seen", "Country", "Device", "Browser", "Pages", "Source"].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {sessions.length === 0 && (
            <div style={{ padding: "24px 16px", fontFamily: NU, fontSize: 12, color: C.grey }}>No active sessions.</div>
          )}
          {sessions.map((s, i) => (
            <div key={i} style={{
              display: "grid", gridTemplateColumns: "160px 120px 80px 80px 60px 100px",
              gap: 12, padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
              alignItems: "center",
            }}>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmtTs(s.last_seen_at)}</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.off }}>
                {flag(s.country_code)} {s.country_name || s.country_code || "—"}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, textTransform: "capitalize" }}>{s.device_type || "—"}</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{s.browser || "—"}</span>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: 600 }}>{s.page_count || "—"}</span>
              <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {s.utm_source || s.referrer || "direct"}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Full Country Breakdown */}
      <div>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 12 }}>
          Country Breakdown (90 days — all countries)
        </div>
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
          {countries.length === 0 && (
            <div style={{ padding: "24px 16px", fontFamily: NU, fontSize: 12, color: C.grey }}>No country data yet.</div>
          )}
          {countries.map((row, i) => {
            const pct = totalCountrySessions ? Math.round((row.sessions / totalCountrySessions) * 100) : 0;
            return (
              <div key={i} style={{
                display: "grid", gridTemplateColumns: "40px 1fr 60px 140px",
                gap: 12, padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
                alignItems: "center",
              }}>
                <span style={{ fontSize: 20 }}>{flag(row.country_code)}</span>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{row.country_name || row.country_code || "—"}</span>
                <span style={{ fontFamily: GD, fontSize: 16, color: C.off }}>{row.sessions}</span>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, marginBottom: 3 }}>{pct}%</div>
                  <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${pct}%`, background: GOLD, borderRadius: 2, transition: "width 0.6s ease" }} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Tab 3: Benchmarks ──────────────────────────────────────────────────────

function BenchmarksTab({ vendorId, C }) {
  const [vendorStats, setVendorStats] = useState(null);
  const [platformAvg, setPlatformAvg] = useState(null);
  const [rank, setRank]               = useState(null);
  const [loading, setLoading]         = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const from30 = new Date(Date.now() - 30 * 86400_000).toISOString();
    const to     = new Date().toISOString();
    const currentMonthStr = new Date().toISOString().slice(0, 7);

    try {
      const [statsRes, platformRes] = await Promise.all([
        supabase.rpc("get_listing_stats", {
          p_listing_id: vendorId,
          p_from: from30,
          p_to:   to,
        }),
        supabase
          .from("vendor_monthly_snapshots")
          .select("vendor_id, views, shortlists, enquiry_submitted, touch_points, view_to_enquiry, media_value_low, media_value_high")
          .gte("month", new Date(Date.now() - 90 * 86400_000).toISOString().slice(0, 7))
          .limit(500),
      ]);

      const myStats = statsRes.data || {};
      setVendorStats(myStats);

      const snaps = platformRes.data || [];
      if (snaps.length > 0) {
        const avg = (key) => {
          const vals = snaps.map(r => r[key]).filter(v => v != null);
          return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
        };

        const platformAverages = {
          views:             avg("views"),
          shortlists:        avg("shortlists"),
          enquiries:         avg("enquiry_submitted"),
          touch_points:      avg("touch_points"),
          view_to_enquiry:   avg("view_to_enquiry"),
          media_value_low:   avg("media_value_low"),
          media_value_high:  avg("media_value_high"),
        };
        setPlatformAvg(platformAverages);

        // Rank by enquiries
        const sorted = [...snaps].sort((a, b) => (b.enquiry_submitted || 0) - (a.enquiry_submitted || 0));
        const rankIdx = sorted.findIndex(r => r.vendor_id === vendorId);
        setRank({ rank: rankIdx + 1, total: sorted.length });
      }
    } catch (e) {
      console.warn("[AdminVendorIntelligence] Benchmarks load error:", e);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: NU, fontSize: 13, color: C.grey }}>Loading benchmarks…</div>;
  }

  const vs = vendorStats || {};
  const pa = platformAvg || {};

  function diff(myVal, avgVal) {
    if (!avgVal || !myVal) return { pct: null, up: null };
    const pct = Math.round(((myVal - avgVal) / avgVal) * 100);
    return { pct, up: pct >= 0 };
  }

  function DiffBadge({ myVal, avgVal }) {
    const { pct, up } = diff(myVal, avgVal);
    if (pct == null) return <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>—</span>;
    const within = Math.abs(pct) <= 10;
    const color = within ? GOLD : up ? "#22c55e" : "#ef4444";
    return (
      <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color }}>
        {up ? "↑" : "↓"} {Math.abs(pct)}%
      </span>
    );
  }

  const metrics = [
    { label: "Profile Views",    my: vs.views,          avg: pa.views,            fmt: fmt },
    { label: "Shortlists",       my: vs.shortlists,     avg: pa.shortlists,       fmt: fmt },
    { label: "Enquiries",        my: vs.enquiries,       avg: pa.enquiries,        fmt: fmt },
    { label: "Conversion %",     my: vs.view_to_enquiry,avg: pa.view_to_enquiry,  fmt: fmtPct },
    { label: "Touch Points",     my: vs.touch_points,    avg: pa.touch_points,     fmt: fmt },
    { label: "Media Value (low)", my: vs.media_value_low, avg: pa.media_value_low, fmt: fmtCcy },
    { label: "Media Value (high)", my: vs.media_value_high, avg: pa.media_value_high, fmt: fmtCcy },
  ];

  // Percentiles
  function percentile(myVal, avgVal) {
    if (!myVal || !avgVal) return null;
    const ratio = myVal / avgVal;
    if (ratio >= 1.5)  return "Top 25%";
    if (ratio >= 1.0)  return "Top 50%";
    if (ratio >= 0.7)  return "Top 60%";
    return "Bottom 40%";
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Rank & percentile strip */}
      {rank && (
        <div style={{
          display: "flex", gap: 24, flexWrap: "wrap",
          background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px 20px",
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grey2, marginBottom: 4 }}>Category Rank</div>
            <div style={{ fontFamily: GD, fontSize: 22, color: GOLD }}>#{rank.rank}</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>of {rank.total} vendors by enquiries</div>
          </div>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grey2, marginBottom: 4 }}>Percentile (Views)</div>
            <div style={{ fontFamily: GD, fontSize: 22, color: C.off }}>{percentile(vs.views, pa.views) || "—"}</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>vs platform avg</div>
          </div>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grey2, marginBottom: 4 }}>Percentile (Conv.)</div>
            <div style={{ fontFamily: GD, fontSize: 22, color: C.off }}>{percentile(vs.view_to_enquiry, pa.view_to_enquiry) || "—"}</div>
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>vs platform avg</div>
          </div>
        </div>
      )}

      {/* Comparison table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 110px 110px 100px", gap: 12, padding: "8px 20px", borderBottom: `1px solid ${C.border}` }}>
          {["Metric", "This Vendor", "Platform Avg", "vs Avg"].map(h => (
            <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {metrics.map(m => (
          <div key={m.label} style={{
            display: "grid", gridTemplateColumns: "1fr 110px 110px 100px",
            gap: 12, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center",
          }}>
            <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{m.label}</span>
            <span style={{ fontFamily: GD, fontSize: 18, color: C.off }}>{m.fmt(m.my)}</span>
            <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{m.fmt(Math.round(m.avg))}</span>
            <DiffBadge myVal={m.my} avgVal={m.avg} />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Report History ──────────────────────────────────────────────────

function ReportHistoryTab({ vendorId, C }) {
  const [history, setHistory]     = useState([]);
  const [outcomes, setOutcomes]   = useState([]);
  const [roi, setRoi]             = useState(null);
  const [loading, setLoading]     = useState(true);
  const [triggering, setTriggering] = useState(false);
  const [toast, setToast]         = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [histRes, outcomesRes, roiRes] = await Promise.all([
        supabase.rpc("get_vendor_report_history", { p_vendor_id: vendorId, p_months: 13 }),
        supabase
          .from("vendor_enquiry_outcomes")
          .select("*")
          .eq("vendor_id", vendorId)
          .order("responded_at", { ascending: false })
          .limit(20),
        supabase.rpc("get_vendor_roi_settings", { p_vendor_id: vendorId }),
      ]);
      setHistory(histRes.data || []);
      setOutcomes(outcomesRes.data || []);
      setRoi(roiRes.data || null);
    } catch (e) {
      console.warn("[AdminVendorIntelligence] ReportHistory load error:", e);
    }
    setLoading(false);
  }, [vendorId]);

  useEffect(() => { load(); }, [load]);

  async function handleTrigger() {
    setTriggering(true);
    try {
      const res = await supabase.functions.invoke("generate-monthly-reports", {
        body: { vendor_id: vendorId, force: true },
      });
      setToast({ ok: true, msg: "Report triggered successfully." });
    } catch (e) {
      setToast({ ok: false, msg: "Failed to trigger report." });
    }
    setTriggering(false);
    setTimeout(() => setToast(null), 4000);
  }

  const currentMonth = new Date().toISOString().slice(0, 7);

  if (loading) {
    return <div style={{ padding: 40, textAlign: "center", fontFamily: NU, fontSize: 13, color: C.grey }}>Loading report history…</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: "10px 16px", borderRadius: 6, fontSize: 12,
          background: toast.ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
          color: toast.ok ? "#22c55e" : "#ef4444",
          fontFamily: NU,
        }}>{toast.msg}</div>
      )}

      {/* 13-month table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>
            13-Month Report History
          </div>
          <button
            onClick={handleTrigger}
            disabled={triggering}
            style={{
              background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
              borderRadius: 5, padding: "6px 14px",
              color: GOLD, fontSize: 10, fontWeight: 700,
              cursor: triggering ? "not-allowed" : "pointer",
              opacity: triggering ? 0.5 : 1,
              fontFamily: NU, letterSpacing: "0.04em",
            }}
          >
            {triggering ? "Sending…" : "Manually Trigger Report"}
          </button>
        </div>
        <div style={{ overflowX: "auto" }}>
          <div style={{ minWidth: 900 }}>
            <div style={{ display: "grid", gridTemplateColumns: "90px 70px 70px 70px 80px 90px 90px 90px 80px 100px", gap: 8, padding: "8px 20px", borderBottom: `1px solid ${C.border}` }}>
              {["Month", "Views", "SLists", "Enq.", "Touch Pts", "Media Low", "Media High", "Est Rev", "Email", "Outcome"].map(h => (
                <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {history.length === 0 && (
              <div style={{ padding: "24px 20px", fontFamily: NU, fontSize: 12, color: C.grey }}>No report history yet.</div>
            )}
            {history.map((row, i) => {
              const isCurrent = row.month === currentMonth;
              return (
                <div key={i} style={{
                  display: "grid", gridTemplateColumns: "90px 70px 70px 70px 80px 90px 90px 90px 80px 100px",
                  gap: 8, padding: "11px 20px", borderBottom: `1px solid ${C.border}`,
                  alignItems: "center",
                  background: isCurrent ? `${GOLD}0a` : "transparent",
                }}>
                  <span style={{ fontFamily: NU, fontSize: 11, color: isCurrent ? GOLD : C.off, fontWeight: isCurrent ? 700 : 400 }}>
                    {row.month || "—"}
                    {isCurrent && <span style={{ marginLeft: 4, fontSize: 8, opacity: 0.8 }}>(now)</span>}
                  </span>
                  <span style={{ fontFamily: GD, fontSize: 15, color: C.off }}>{fmt(row.views)}</span>
                  <span style={{ fontFamily: GD, fontSize: 15, color: C.off }}>{fmt(row.shortlists)}</span>
                  <span style={{ fontFamily: GD, fontSize: 15, color: row.enquiries > 0 ? "#22c55e" : C.grey }}>{fmt(row.enquiries)}</span>
                  <span style={{ fontFamily: GD, fontSize: 15, color: C.off }}>{fmt(row.touch_points)}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmtCcy(row.media_value_low)}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmtCcy(row.media_value_high)}</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmtCcy(row.est_revenue_high)}</span>
                  <span style={{ fontSize: 10, color: row.email_sent ? "#22c55e" : C.grey2 }}>
                    {row.email_sent ? "Sent" : "—"}
                    {row.email_opened && <span style={{ color: "#16a34a" }}> · opened</span>}
                  </span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: row.outcome_responded ? "#22c55e" : C.grey2 }}>
                    {row.outcome_responded ? "Responded" : "—"}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ROI Settings */}
      {roi && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "16px 20px" }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 12 }}>
            ROI Settings
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Avg Booking Value</div>
              <div style={{ fontFamily: GD, fontSize: 20, color: C.off }}>£{roi.avg_booking_value?.toLocaleString() || "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Est Close Rate</div>
              <div style={{ fontFamily: GD, fontSize: 20, color: C.off }}>{roi.est_close_rate != null ? `${roi.est_close_rate}%` : "—"}</div>
            </div>
            <div>
              <div style={{ fontFamily: NU, fontSize: 9, color: C.grey2, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 4 }}>Last Set</div>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{fmtDate(roi.roi_settings_set_at)}</div>
            </div>
          </div>
        </div>
      )}

      {/* Enquiry outcomes */}
      {outcomes.length > 0 && (
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 12 }}>
            Enquiry Outcomes
          </div>
          <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: "hidden" }}>
            {outcomes.map((o, i) => (
              <div key={i} style={{
                display: "flex", gap: 16, padding: "10px 16px", borderBottom: `1px solid ${C.border}`,
                alignItems: "center", flexWrap: "wrap",
              }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmtDate(o.responded_at)}</span>
                <span style={{
                  fontSize: 9, fontWeight: 700, letterSpacing: "0.05em", textTransform: "uppercase",
                  color: o.converted ? "#22c55e" : "#f97316",
                  background: (o.converted ? "#22c55e" : "#f97316") + "22",
                  padding: "2px 8px", borderRadius: 100,
                }}>
                  {o.converted ? "Converted" : "Not converted"}
                </span>
                {o.notes && <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, fontStyle: "italic" }}>{o.notes}</span>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Tab 5: Admin Controls ──────────────────────────────────────────────────

function AdminControlsTab({ vendorId, vendorName, vendorData, onVendorDataChange, C }) {
  const G = GOLD;
  const [form, setForm]       = useState({
    analytics_enabled:  vendorData?.analytics_enabled ?? false,
    report_frequency:   vendorData?.report_frequency || "monthly",
    avg_booking_value:  "",
    est_close_rate:     "",
  });
  const [roiData, setRoiData]           = useState(null);
  const [saving, setSaving]             = useState(false);
  const [savingRoi, setSavingRoi]       = useState(false);
  const [triggering, setTriggering]     = useState(false);
  const [clearing, setClearing]         = useState(false);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [toast, setToast]               = useState(null);
  const [snapCount, setSnapCount]       = useState(null);
  const [firstSnap, setFirstSnap]       = useState(null);

  function showToast(ok, msg) {
    setToast({ ok, msg });
    setTimeout(() => setToast(null), 4000);
  }

  useEffect(() => {
    if (!vendorId) return;
    // Load ROI settings and snapshot stats
    Promise.all([
      supabase.rpc("get_vendor_roi_settings", { p_vendor_id: vendorId }),
      supabase
        .from("vendor_monthly_snapshots")
        .select("month", { count: "exact" })
        .eq("vendor_id", vendorId)
        .order("month", { ascending: true })
        .limit(1),
    ]).then(([roiRes, snapRes]) => {
      const roi = roiRes.data;
      setRoiData(roi);
      if (roi) {
        setForm(prev => ({
          ...prev,
          avg_booking_value: roi.avg_booking_value ?? "",
          est_close_rate:    roi.est_close_rate    ?? "",
        }));
      }
      setSnapCount(snapRes.count || 0);
      if (snapRes.data?.[0]) setFirstSnap(snapRes.data[0].month);
    });
  }, [vendorId]);

  async function handleSaveSettings() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from("vendors")
        .update({
          analytics_enabled: form.analytics_enabled,
          report_frequency:  form.report_frequency,
        })
        .eq("id", vendorId);
      if (error) throw error;
      onVendorDataChange?.({ analytics_enabled: form.analytics_enabled, report_frequency: form.report_frequency });
      showToast(true, "Settings saved.");
    } catch (e) {
      showToast(false, "Failed to save settings.");
    }
    setSaving(false);
  }

  async function handleSaveRoi() {
    setSavingRoi(true);
    try {
      const { error } = await supabase.rpc("save_vendor_roi_settings", {
        p_vendor_id:        vendorId,
        p_avg_booking_value: Number(form.avg_booking_value) || null,
        p_est_close_rate:   Number(form.est_close_rate)    || null,
      });
      if (error) throw error;
      showToast(true, "ROI settings saved.");
    } catch (e) {
      showToast(false, "Failed to save ROI settings.");
    }
    setSavingRoi(false);
  }

  async function handleTriggerReport() {
    setTriggering(true);
    try {
      await supabase.functions.invoke("generate-monthly-reports", {
        body: { vendor_id: vendorId, force: true },
      });
      showToast(true, "Report triggered successfully.");
    } catch (e) {
      showToast(false, "Failed to trigger report.");
    }
    setTriggering(false);
  }

  async function handleClearSendRecord() {
    if (!clearConfirm) { setClearConfirm(true); return; }
    setClearing(true);
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const { error } = await supabase
        .from("vendor_report_sends")
        .delete()
        .eq("vendor_id", vendorId)
        .eq("report_month", currentMonth);
      if (error) throw error;
      showToast(true, "Send record cleared — report can be resent this month.");
    } catch (e) {
      showToast(false, "Failed to clear send record.");
    }
    setClearing(false);
    setClearConfirm(false);
  }

  const inputStyle = {
    background: C.dark, border: `1px solid ${C.border}`,
    borderRadius: 5, padding: "8px 12px",
    color: C.white, fontSize: 13, outline: "none",
    fontFamily: NU, width: "100%", boxSizing: "border-box",
  };

  const sectionStyle = {
    background: C.card, border: `1px solid ${C.border}`, borderRadius: 8,
    padding: "20px 24px",
  };

  const labelStyle = { fontFamily: NU, fontSize: 10, letterSpacing: "0.14em", textTransform: "uppercase", color: C.grey2, marginBottom: 6, display: "block" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 680 }}>

      {/* Toast */}
      {toast && (
        <div style={{
          padding: "10px 16px", borderRadius: 6, fontSize: 12,
          background: toast.ok ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
          border: `1px solid ${toast.ok ? "#22c55e" : "#ef4444"}`,
          color: toast.ok ? "#22c55e" : "#ef4444",
          fontFamily: NU,
        }}>{toast.msg}</div>
      )}

      {/* Analytics settings */}
      <div style={sectionStyle}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: G, fontWeight: 600, marginBottom: 16 }}>
          Analytics Settings
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontFamily: NU, fontSize: 13, color: C.off }}>Analytics Enabled</div>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>Vendor can view their performance dashboard</div>
            </div>
            <button
              onClick={() => setForm(prev => ({ ...prev, analytics_enabled: !prev.analytics_enabled }))}
              style={{
                width: 48, height: 26, borderRadius: 13,
                background: form.analytics_enabled ? G : C.border,
                border: "none", cursor: "pointer", position: "relative",
                transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 3, left: form.analytics_enabled ? 25 : 3,
                width: 20, height: 20, borderRadius: "50%",
                background: C.white, transition: "left 0.2s",
              }} />
            </button>
          </div>

          <div>
            <label style={labelStyle}>Report Frequency</label>
            <select
              value={form.report_frequency}
              onChange={e => setForm(prev => ({ ...prev, report_frequency: e.target.value }))}
              style={{ ...inputStyle, width: "auto", minWidth: 180 }}
            >
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            style={{
              background: G, border: "none", borderRadius: 5, padding: "9px 20px",
              color: "#1a1714", fontSize: 12, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer",
              fontFamily: NU, opacity: saving ? 0.6 : 1, alignSelf: "flex-start",
            }}
          >
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>

      {/* ROI Override */}
      <div style={sectionStyle}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: G, fontWeight: 600, marginBottom: 16 }}>
          ROI Override (on behalf of vendor)
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Avg Booking Value (£)</label>
            <input
              type="number"
              value={form.avg_booking_value}
              onChange={e => setForm(prev => ({ ...prev, avg_booking_value: e.target.value }))}
              placeholder="e.g. 8500"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Est Close Rate (%)</label>
            <input
              type="number"
              min="0" max="100"
              value={form.est_close_rate}
              onChange={e => setForm(prev => ({ ...prev, est_close_rate: e.target.value }))}
              placeholder="e.g. 15"
              style={inputStyle}
            />
          </div>
        </div>
        <button
          onClick={handleSaveRoi}
          disabled={savingRoi}
          style={{
            background: G, border: "none", borderRadius: 5, padding: "9px 20px",
            color: "#1a1714", fontSize: 12, fontWeight: 700, cursor: savingRoi ? "not-allowed" : "pointer",
            fontFamily: NU, opacity: savingRoi ? 0.6 : 1,
          }}
        >
          {savingRoi ? "Saving…" : "Save ROI Settings"}
        </button>
      </div>

      {/* Manual actions */}
      <div style={sectionStyle}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: G, fontWeight: 600, marginBottom: 16 }}>
          Manual Actions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleTriggerReport}
              disabled={triggering}
              style={{
                background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                borderRadius: 5, padding: "8px 16px",
                color: G, fontSize: 11, fontWeight: 700, cursor: triggering ? "not-allowed" : "pointer",
                fontFamily: NU, letterSpacing: "0.04em", opacity: triggering ? 0.5 : 1,
              }}
            >
              {triggering ? "Sending…" : "Send Monthly Report Now"}
            </button>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>Forces report generation for this vendor</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <button
              onClick={handleClearSendRecord}
              disabled={clearing}
              style={{
                background: clearConfirm ? "rgba(239,68,68,0.12)" : "transparent",
                border: `1px solid ${clearConfirm ? "#ef4444" : "rgba(239,68,68,0.35)"}`,
                borderRadius: 5, padding: "8px 16px",
                color: "#ef4444", fontSize: 11, fontWeight: 700, cursor: clearing ? "not-allowed" : "pointer",
                fontFamily: NU, letterSpacing: "0.04em", opacity: clearing ? 0.5 : 1,
              }}
            >
              {clearConfirm ? "Confirm — Clear Send Record" : "Clear Report Send Record"}
            </button>
            {clearConfirm && (
              <button
                onClick={() => setClearConfirm(false)}
                style={{ background: "none", border: "none", color: C.grey, fontSize: 11, cursor: "pointer", fontFamily: NU }}
              >
                Cancel
              </button>
            )}
            {!clearConfirm && <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>Allows report to be resent for current month</span>}
          </div>
        </div>
      </div>

      {/* Vendor info read-only */}
      <div style={sectionStyle}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: G, fontWeight: 600, marginBottom: 16 }}>
          Vendor Info
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, minWidth: 120 }}>Vendor ID</span>
            <code style={{ fontFamily: "monospace", fontSize: 11, color: C.off, background: C.dark, padding: "2px 8px", borderRadius: 4 }}>
              {vendorId}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(vendorId)}
              style={{ background: "none", border: "none", color: C.grey, fontSize: 10, cursor: "pointer", fontFamily: NU }}
            >
              copy
            </button>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, minWidth: 120 }}>Analytics Status</span>
            <span style={{ fontFamily: NU, fontSize: 11, color: vendorData?.analytics_enabled ? "#22c55e" : "#ef4444" }}>
              {vendorData?.analytics_enabled ? "Enabled" : "Disabled"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, minWidth: 120 }}>ROI Settings Set</span>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
              {roiData?.roi_settings_set_at ? fmtDate(roiData.roi_settings_set_at) : "Not set"}
            </span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, minWidth: 120 }}>Months Tracked</span>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{snapCount ?? "—"}</span>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, minWidth: 120 }}>First Snapshot</span>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{firstSnap || "—"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────────

const TABS = [
  { key: "view",     label: "Vendor View" },
  { key: "deep",     label: "Deep Data" },
  { key: "bench",    label: "Benchmarks" },
  { key: "history",  label: "Report History" },
  { key: "controls", label: "Admin Controls" },
];

export default function AdminVendorIntelligenceView({ vendorId, vendorName, onClose, C }) {
  const [activeTab, setActiveTab]     = useState("view");
  const [vendorData, setVendorData]   = useState(null);
  const [lastSeen, setLastSeen]       = useState(null);
  const [loadingVendor, setLoadingVendor] = useState(true);

  // Load vendor metadata + last active
  useEffect(() => {
    if (!vendorId) return;
    let cancelled = false;

    Promise.all([
      supabase
        .from("vendors")
        .select("id, name, email, analytics_enabled")
        .eq("id", vendorId)
        .single(),
      supabase
        .from("live_sessions")
        .select("last_seen_at")
        .eq("current_listing_id", vendorId)
        .order("last_seen_at", { ascending: false })
        .limit(1)
        .single(),
    ]).then(([vendorRes, sessionRes]) => {
      if (cancelled) return;
      setVendorData(vendorRes.data || null);
      setLastSeen(sessionRes.data?.last_seen_at || null);
      setLoadingVendor(false);
    });

    return () => { cancelled = true; };
  }, [vendorId]);

  // Escape key closes
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function handleVendorDataChange(updates) {
    setVendorData(prev => prev ? { ...prev, ...updates } : prev);
  }

  function openDashboardPreview() {
    sessionStorage.setItem("lwd_admin_preview", JSON.stringify({
      type: "vendor", id: vendorId, name: vendorName, analytics_enabled: true,
    }));
    window.open("/vendor/dashboard", "_blank");
  }

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: C.bg || "#0e0d0b",
      display: "flex", flexDirection: "column",
      overflow: "hidden",
    }}>
      {/* Header bar */}
      <div style={{
        flexShrink: 0,
        display: "flex", alignItems: "center", gap: 16,
        padding: "14px 28px",
        borderBottom: `1px solid ${C.border}`,
        background: C.card,
        flexWrap: "wrap",
      }}>
        {/* Back button */}
        <button
          onClick={onClose}
          style={{
            background: "none", border: `1px solid ${C.border}`,
            borderRadius: 5, padding: "7px 14px",
            color: C.grey, fontSize: 12, cursor: "pointer",
            fontFamily: NU, display: "flex", alignItems: "center", gap: 6,
          }}
        >
          ← Back
        </button>

        {/* Vendor name */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: GD, fontSize: 20, color: C.off, fontWeight: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {vendorName || "Vendor Intelligence"}
          </div>
          {lastSeen && (
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 2 }}>
              Last active: {fmtTs(lastSeen)}
            </div>
          )}
        </div>

        {/* Email badge */}
        {!loadingVendor && vendorData?.email && (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
              {vendorData.email}
            </span>
          </div>
        )}

        {/* Analytics toggle */}
        {!loadingVendor && vendorData != null && (
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>Analytics</span>
            <button
              onClick={async () => {
                const newVal = !vendorData.analytics_enabled;
                await supabase.from("vendors").update({ analytics_enabled: newVal }).eq("id", vendorId);
                handleVendorDataChange({ analytics_enabled: newVal });
              }}
              style={{
                width: 40, height: 22, borderRadius: 11,
                background: vendorData?.analytics_enabled ? GOLD : C.border,
                border: "none", cursor: "pointer", position: "relative", flexShrink: 0,
                transition: "background 0.2s",
              }}
            >
              <span style={{
                position: "absolute", top: 2, left: vendorData?.analytics_enabled ? 20 : 2,
                width: 18, height: 18, borderRadius: "50%",
                background: C.white, transition: "left 0.2s",
              }} />
            </button>
          </div>
        )}

        {/* Open vendor dashboard button */}
        <button
          onClick={openDashboardPreview}
          style={{
            background: "none", border: `1px solid ${GOLD_BORDER}`,
            borderRadius: 5, padding: "7px 14px",
            color: GOLD, fontSize: 11, cursor: "pointer",
            fontFamily: NU, fontWeight: 600, whiteSpace: "nowrap",
          }}
        >
          Open vendor dashboard →
        </button>

        {/* Close X */}
        <button
          onClick={onClose}
          style={{
            background: "none", border: "none",
            color: C.grey, fontSize: 22, cursor: "pointer",
            lineHeight: 1, padding: "4px 8px",
          }}
        >
          ×
        </button>
      </div>

      {/* Tab bar */}
      <div style={{ flexShrink: 0, background: C.card, paddingLeft: 28 }}>
        <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} C={C} />
      </div>

      {/* Content (scrollable) */}
      <div style={{ flex: 1, overflowY: "auto", padding: "28px 28px 60px" }}>
        {activeTab === "view" && (
          <VendorViewTab vendorId={vendorId} vendorName={vendorName} vendorData={vendorData} C={C} />
        )}
        {activeTab === "deep" && <DeepDataTab vendorId={vendorId} C={C} />}
        {activeTab === "bench" && <BenchmarksTab vendorId={vendorId} C={C} />}
        {activeTab === "history" && <ReportHistoryTab vendorId={vendorId} C={C} />}
        {activeTab === "controls" && (
          <AdminControlsTab
            vendorId={vendorId}
            vendorName={vendorName}
            vendorData={vendorData}
            onVendorDataChange={handleVendorDataChange}
            C={C}
          />
        )}
      </div>
    </div>
  );
}
