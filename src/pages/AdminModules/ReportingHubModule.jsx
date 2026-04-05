// ─── src/pages/AdminModules/ReportingHubModule.jsx ────────────────────────────
// Admin intelligence centre for vendor monthly reports:
//  - Platform-wide report send stats (sent / opened / outcome responded)
//  - Per-vendor report history table (last 12 months)
//  - Manual report trigger for any vendor
//  - Churn health score (based on email engagement)
//  - Industry trends (aggregate page_events across platform)
//  - Seasonality context map
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminVendorIntelligenceView from "./AdminVendorIntelligenceView";
import VendorSearchPicker from "./VendorSearchPicker";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";
const GOLD_DIM    = "rgba(201,168,76,0.10)";
const GOLD_BORDER = "rgba(201,168,76,0.28)";

// ── Seasonality data ──────────────────────────────────────────────────────────

const WEDDING_SEASONALITY = {
  GB: {
    1:  { phase: "Quiet",   label: "Post-Christmas quiet. Engagement season starting.",   color: "#6b7280" },
    2:  { phase: "Rising",  label: "Valentine's engagements. Discovery season begins.",   color: "#3b82f6" },
    3:  { phase: "Rising",  label: "Peak discovery. Couples actively shortlisting.",      color: "#3b82f6" },
    4:  { phase: "Peak",    label: "Peak booking season. High enquiry volume.",           color: "#22c55e" },
    5:  { phase: "Peak",    label: "Peak booking season. Contracts being signed.",        color: "#22c55e" },
    6:  { phase: "Peak",    label: "Peak — summer weddings happening + autumn bookings.", color: "#22c55e" },
    7:  { phase: "Busy",    label: "High execution. Autumn/winter bookings opening.",     color: "#C9A84C" },
    8:  { phase: "Busy",    label: "Summer peak executing. Early next-year interest.",    color: "#C9A84C" },
    9:  { phase: "Rising",  label: "Post-summer reflection. Planning next season.",       color: "#3b82f6" },
    10: { phase: "Rising",  label: "Autumn planning. Second engagement spike.",           color: "#3b82f6" },
    11: { phase: "Quiet",   label: "Budget planning. Positioning for January.",           color: "#6b7280" },
    12: { phase: "Rising",  label: "Christmas engagements imminent. Prepare now.",        color: "#3b82f6" },
  },
  IT: {
    1:  { phase: "Quiet",   label: "Off-season. Northern Europe couples researching.",    color: "#6b7280" },
    2:  { phase: "Rising",  label: "Early enquiries for summer slots.",                   color: "#3b82f6" },
    3:  { phase: "Rising",  label: "Serious enquiry season begins.",                      color: "#3b82f6" },
    4:  { phase: "Peak",    label: "Peak booking. Summer slots filling fast.",            color: "#22c55e" },
    5:  { phase: "Peak",    label: "Peak season. High demand across regions.",            color: "#22c55e" },
    6:  { phase: "Peak",    label: "Peak execution + forward bookings.",                  color: "#22c55e" },
    7:  { phase: "Busy",    label: "High execution. Next year enquiries starting.",       color: "#C9A84C" },
    8:  { phase: "Busy",    label: "August weddings. Post-summer bookings.",              color: "#C9A84C" },
    9:  { phase: "Peak",    label: "Second peak. Autumn wedding season.",                 color: "#22c55e" },
    10: { phase: "Rising",  label: "Autumn weddings + early next-year bookings.",        color: "#3b82f6" },
    11: { phase: "Quiet",   label: "Off-season begins.",                                 color: "#6b7280" },
    12: { phase: "Quiet",   label: "Off-season. Plan for spring.",                       color: "#6b7280" },
  },
  AE: {
    1:  { phase: "Peak",    label: "Peak season. Ideal climate for weddings.",            color: "#22c55e" },
    2:  { phase: "Peak",    label: "Peak. High demand across UAE venues.",                color: "#22c55e" },
    3:  { phase: "Rising",  label: "Late season. Bookings closing.",                      color: "#3b82f6" },
    4:  { phase: "Quiet",   label: "Heat season begins. Reduced demand.",                color: "#6b7280" },
    5:  { phase: "Quiet",   label: "Off-season.",                                        color: "#6b7280" },
    6:  { phase: "Quiet",   label: "Off-season.",                                        color: "#6b7280" },
    7:  { phase: "Quiet",   label: "Off-season. Peak heat.",                             color: "#6b7280" },
    8:  { phase: "Quiet",   label: "Off-season. Peak heat.",                             color: "#6b7280" },
    9:  { phase: "Rising",  label: "Season approaching. Forward bookings opening.",      color: "#3b82f6" },
    10: { phase: "Rising",  label: "Season begins. Enquiry volume rising.",              color: "#3b82f6" },
    11: { phase: "Peak",    label: "Peak season starting.",                              color: "#22c55e" },
    12: { phase: "Peak",    label: "Peak season.",                                       color: "#22c55e" },
  },
};

const BOOKING_WINDOW = {
  venue:        { min: 12, max: 24, label: "12–24 months in advance" },
  photographer: { min: 6,  max: 18, label: "6–18 months in advance"  },
  planner:      { min: 12, max: 18, label: "12–18 months in advance" },
  florist:      { min: 3,  max: 12, label: "3–12 months in advance"  },
  default:      { min: 9,  max: 18, label: "9–18 months in advance"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null || n === undefined) return "—";
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtDate(d) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  } catch { return "—"; }
}

function fmtPct(part, total) {
  if (!total) return "0%";
  return `${Math.round((part / total) * 100)}%`;
}

function startOfCurrentMonth() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
}

function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function getReportHealth(sends) {
  if (!sends?.length) return { label: "No reports", color: "#6b7280" };
  const last3 = sends.slice(0, 3);
  const openedAny = last3.some(s => s.opened_at);
  const openedLast = sends[0]?.opened_at;
  if (openedLast) return { label: "Healthy", color: "#22c55e" };
  if (!openedAny) return { label: "Silent",  color: "#ef4444" };
  return { label: "At Risk", color: "#f97316" };
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent, C }) {
  return (
    <div style={{
      background: C.card,
      border: `1px solid ${C.border}`,
      borderRadius: 6,
      padding: "22px 20px",
      borderTop: `3px solid ${accent || GOLD}`,
    }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: C.grey, fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 32, color: C.off, fontWeight: 400, marginBottom: 4 }}>
        {value}
      </div>
      {sub && <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>{sub}</div>}
    </div>
  );
}

function TabBar({ tabs, active, onChange, C }) {
  return (
    <div style={{ display: "flex", gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
      {tabs.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "10px 20px", cursor: "pointer",
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

function HealthBadge({ label, color }) {
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, letterSpacing: "0.05em",
      textTransform: "uppercase", color,
      background: color + "22", padding: "2px 8px", borderRadius: 100,
    }}>
      {label}
    </span>
  );
}

// ── Tab 1: Overview ───────────────────────────────────────────────────────────

function OverviewTab({ C }) {
  const [stats, setStats] = useState({ sent: 0, opened: 0, responded: 0, converted: 0 });
  const [recentSends, setRecentSends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    const startOfMonth = startOfCurrentMonth();

    try {
      const [sentRes, openedRes, respondedRes, convertedRes, recentRes] = await Promise.all([
        supabase.from("vendor_report_sends").select("*", { count: "exact", head: true }).gte("sent_at", daysAgo(90)),
        supabase.from("vendor_report_sends").select("*", { count: "exact", head: true }).not("opened_at", "is", null).gte("sent_at", daysAgo(90)),
        supabase.from("vendor_report_sends").select("*", { count: "exact", head: true }).eq("outcome_responded", true).gte("sent_at", daysAgo(90)),
        supabase.from("vendor_enquiry_outcomes").select("*", { count: "exact", head: true }).eq("converted", true).gte("responded_at", daysAgo(90)),
        supabase.from("vendor_report_sends").select("*, vendors(name, email)").order("sent_at", { ascending: false }).limit(10),
      ]);

      setStats({
        sent:      sentRes.count      || 0,
        opened:    openedRes.count    || 0,
        responded: respondedRes.count || 0,
        converted: convertedRes.count || 0,
      });
      setRecentSends(recentRes.data || []);
    } catch (e) {
      console.warn("[ReportingHub] Overview load error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleResend(send) {
    setSending(send.id);
    try {
      await supabase.functions.invoke("generate-monthly-reports", {
        body: { vendor_id: send.vendor_id, force: true },
      });
      load();
    } catch (e) {
      console.warn("[ReportingHub] Resend error:", e);
    }
    setSending(null);
  }

  const { sent, opened, responded, converted } = stats;
  const openRate = sent ? Math.round((opened / sent) * 100) : 0;
  const responseRate = sent ? Math.round((responded / sent) * 100) : 0;

  return (
    <div>
      {/* KPI cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 28 }}>
        <StatCard label="Reports Sent" value={loading ? "…" : fmt(sent)} sub="Last 90 days" accent={GOLD} C={C} />
        <StatCard label="Open Rate" value={loading ? "…" : `${openRate}%`} sub={`${opened} of ${sent} opened`} accent="#22c55e" C={C} />
        <StatCard label="Outcome Responses" value={loading ? "…" : `${responseRate}%`} sub={`${responded} vendors responded`} accent="#3b82f6" C={C} />
        <StatCard label="Conversions Confirmed" value={loading ? "…" : fmt(converted)} sub="Yes responses last 90 days" accent="#a78bfa" C={C} />
      </div>

      {/* Recent sends table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>
            Recent Report Sends
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 90px 140px 140px 80px 80px", gap: 12, padding: "8px 20px", borderBottom: `1px solid ${C.border}` }}>
          {["Vendor", "Month", "Sent At", "Opened At", "Responded", ""].map(h => (
            <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
          ))}
        </div>
        {loading && (
          <div style={{ padding: "32px", textAlign: "center", fontFamily: NU, fontSize: 12, color: C.grey }}>Loading...</div>
        )}
        {!loading && recentSends.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontFamily: GD, fontSize: 16, color: C.off, marginBottom: 8 }}>No reports sent yet</div>
            <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Reports will appear here once the generate-monthly-reports function has been run.</div>
          </div>
        )}
        {!loading && recentSends.map(send => (
          <div key={send.id} style={{ display: "grid", gridTemplateColumns: "1fr 90px 140px 140px 80px 80px", gap: 12, padding: "12px 20px", borderBottom: `1px solid ${C.border}`, alignItems: "center" }}>
            <div style={{ fontFamily: NU, fontSize: 12, color: C.off, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {send.vendors?.name || send.email_address || send.vendor_id?.slice(0, 14) + "…" || "—"}
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
              {send.month ? new Date(send.month).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
              {fmtDate(send.sent_at)}
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: send.opened_at ? "#22c55e" : C.grey2 }}>
              {send.opened_at ? fmtDate(send.opened_at) : "—"}
            </div>
            <div style={{ textAlign: "center" }}>
              {send.outcome_responded
                ? <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                : <span style={{ color: C.grey2, fontSize: 14 }}>—</span>}
            </div>
            <div>
              <button
                onClick={() => handleResend(send)}
                disabled={sending === send.id}
                style={{
                  background: "none", border: `1px solid ${GOLD_BORDER}`,
                  borderRadius: 4, padding: "4px 10px",
                  color: GOLD, fontSize: 10, fontWeight: 600,
                  cursor: sending === send.id ? "not-allowed" : "pointer",
                  opacity: sending === send.id ? 0.5 : 1,
                  fontFamily: NU, letterSpacing: "0.04em",
                }}
              >
                {sending === send.id ? "..." : "Resend"}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: Vendor Reports ─────────────────────────────────────────────────────

function VendorReportsTab({ C, onVendorSelect }) {
  const [vendors, setVendors] = useState([]);
  const [sends, setSends] = useState({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState(null);
  const [history, setHistory] = useState({});
  const [historyLoading, setHistoryLoading] = useState({});
  const [triggering, setTriggering] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id, name, email, analytics_enabled")
        .order("name");

      const { data: sendData } = await supabase
        .from("vendor_report_sends")
        .select("*")
        .order("sent_at", { ascending: false });

      const sendsByVendor = {};
      (sendData || []).forEach(s => {
        if (!sendsByVendor[s.vendor_id]) sendsByVendor[s.vendor_id] = [];
        sendsByVendor[s.vendor_id].push(s);
      });

      setVendors(vendorData || []);
      setSends(sendsByVendor);
    } catch (e) {
      console.warn("[ReportingHub] VendorReports load error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function loadHistory(vendorId) {
    if (history[vendorId]) return;
    setHistoryLoading(prev => ({ ...prev, [vendorId]: true }));
    try {
      const { data } = await supabase.rpc("get_vendor_report_history", { p_vendor_id: vendorId });
      setHistory(prev => ({ ...prev, [vendorId]: data || [] }));
    } catch (e) {
      console.warn("[ReportingHub] History load error:", e);
      setHistory(prev => ({ ...prev, [vendorId]: [] }));
    }
    setHistoryLoading(prev => ({ ...prev, [vendorId]: false }));
  }

  async function triggerReport(vendorId) {
    setTriggering(vendorId);
    try {
      await supabase.functions.invoke("generate-monthly-reports", {
        body: { vendor_id: vendorId, force: true },
      });
      load();
    } catch (e) {
      console.warn("[ReportingHub] Trigger error:", e);
    }
    setTriggering(null);
  }

  function toggleExpand(vendorId) {
    if (expanded === vendorId) {
      setExpanded(null);
    } else {
      setExpanded(vendorId);
      loadHistory(vendorId);
    }
  }

  const filtered = vendors.filter(v =>
    !search.trim() || v.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Search — native filter + VendorSearchPicker for any-vendor access */}
      <div style={{ marginBottom: 20, display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Filter loaded vendors..."
          style={{
            background: C.dark, border: `1px solid ${C.border}`,
            borderRadius: 6, padding: "9px 14px",
            color: C.white, fontSize: 13, outline: "none",
            width: 240, fontFamily: NU,
          }}
        />
        <VendorSearchPicker
          C={C}
          placeholder="Pull up any vendor →"
          onSelect={v => onVendorSelect?.(v.id, v.name)}
        />
      </div>

      {/* Vendor table */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 130px 130px 90px 90px 100px", gap: 12, padding: "8px 20px", borderBottom: `1px solid ${C.border}` }}>
          {["Vendor", "Last Sent", "Last Opened", "Responded", "Health", ""].map(h => (
            <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {loading && <div style={{ padding: "32px", textAlign: "center", fontFamily: NU, fontSize: 12, color: C.grey }}>Loading vendors...</div>}

        {!loading && filtered.length === 0 && (
          <div style={{ padding: "40px", textAlign: "center" }}>
            <div style={{ fontFamily: GD, fontSize: 16, color: C.off, marginBottom: 8 }}>No vendors found</div>
            <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>No vendor records in the database yet.</div>
          </div>
        )}

        {!loading && filtered.map(vendor => {
          const vendorSends = sends[vendor.id] || [];
          const lastSend = vendorSends[0];
          const health = getReportHealth(vendorSends);
          const isExpanded = expanded === vendor.id;

          return (
            <div key={vendor.id}>
              <div
                style={{
                  display: "grid", gridTemplateColumns: "1fr 130px 130px 90px 90px 100px",
                  gap: 12, padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
                  alignItems: "center", cursor: "pointer",
                  background: isExpanded ? GOLD_DIM : "transparent",
                  transition: "background 0.15s",
                }}
                onClick={() => toggleExpand(vendor.id)}
              >
                <div>
                  <div style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 500 }}>{vendor.name}</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: "capitalize", marginTop: 2 }}>
                    {vendor.email || "—"}
                  </div>
                </div>
                <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
                  {lastSend ? fmtDate(lastSend.sent_at) : "Never"}
                </div>
                <div style={{ fontFamily: NU, fontSize: 11, color: lastSend?.opened_at ? "#22c55e" : C.grey2 }}>
                  {lastSend?.opened_at ? fmtDate(lastSend.opened_at) : "Never opened"}
                </div>
                <div style={{ textAlign: "center" }}>
                  {lastSend?.outcome_responded
                    ? <span style={{ color: "#22c55e", fontSize: 14 }}>✓</span>
                    : <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>Pending</span>}
                </div>
                <div><HealthBadge label={health.label} color={health.color} /></div>
                <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 5 }}>
                  <button
                    onClick={() => triggerReport(vendor.id)}
                    disabled={triggering === vendor.id}
                    style={{
                      background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                      borderRadius: 4, padding: "5px 10px",
                      color: GOLD, fontSize: 10, fontWeight: 700,
                      cursor: triggering === vendor.id ? "not-allowed" : "pointer",
                      opacity: triggering === vendor.id ? 0.5 : 1,
                      fontFamily: NU, letterSpacing: "0.04em",
                    }}
                  >
                    {triggering === vendor.id ? "Sending…" : "Send now"}
                  </button>
                  <button
                    onClick={() => onVendorSelect?.(vendor.id, vendor.name)}
                    style={{
                      background: "transparent", border: `1px solid ${C.border}`,
                      borderRadius: 4, padding: "4px 8px",
                      color: C.grey, fontSize: 9, fontWeight: 700,
                      cursor: "pointer", fontFamily: NU, letterSpacing: "0.04em",
                    }}
                  >
                    Intelligence
                  </button>
                </div>
              </div>

              {/* Expanded history drawer */}
              {isExpanded && (
                <div style={{ padding: "16px 20px 20px", background: GOLD_DIM, borderBottom: `1px solid ${C.border}`, borderLeft: `3px solid ${GOLD}` }}>
                  <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", color: GOLD, fontWeight: 700, marginBottom: 12 }}>
                    Report History — Last 12 Months
                  </div>

                  {historyLoading[vendor.id] && (
                    <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading history…</div>
                  )}

                  {!historyLoading[vendor.id] && history[vendor.id] && (
                    <div style={{ overflowX: "auto" }}>
                      <div style={{ display: "grid", gridTemplateColumns: "80px 60px 60px 60px 80px 80px 80px 60px 60px 60px", gap: 8, marginBottom: 6, minWidth: 700 }}>
                        {["Month", "Views", "SLists", "Enquiries", "Touch Pts", "Media Val", "Est Rev", "Sent", "Opened", "Outcome"].map(h => (
                          <span key={h} style={{ fontFamily: NU, fontSize: 8, letterSpacing: "0.12em", textTransform: "uppercase", color: C.grey2, fontWeight: 700 }}>{h}</span>
                        ))}
                      </div>
                      {(history[vendor.id] || []).length === 0 && (
                        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey2, fontStyle: "italic" }}>No report history available.</div>
                      )}
                      {(history[vendor.id] || []).map((row, i) => (
                        <div key={i} style={{ display: "grid", gridTemplateColumns: "80px 60px 60px 60px 80px 80px 80px 60px 60px 60px", gap: 8, padding: "8px 0", borderBottom: `1px solid ${C.border}55`, minWidth: 700 }}>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.off }}>{row.month ? new Date(row.month).toLocaleDateString("en-GB", { month: "short", year: "numeric" }) : "—"}</span>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmt(row.views)}</span>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmt(row.shortlists)}</span>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmt(row.enquiry_submitted ?? row.enquiries)}</span>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{fmt(row.touch_points)}</span>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{row.media_value_low ? `£${row.media_value_low}–£${row.media_value_high}` : "—"}</span>
                          <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{(row.est_revenue_high ?? row.est_revenue) ? `£${fmt(row.est_revenue_high ?? row.est_revenue)}` : "—"}</span>
                          <span style={{ fontSize: 12, color: row.email_sent ? "#22c55e" : C.grey2, textAlign: "center" }}>{row.email_sent ? "✓" : "—"}</span>
                          <span style={{ fontSize: 12, color: row.email_opened ? "#22c55e" : C.grey2, textAlign: "center" }}>{row.email_opened ? "✓" : "—"}</span>
                          <span style={{ fontSize: 12, color: row.outcome_responded ? "#22c55e" : C.grey2, textAlign: "center" }}>{row.outcome_responded ? "✓" : "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tab 3: Industry Trends ────────────────────────────────────────────────────

function IndustryTrendsTab({ C }) {
  const [loading, setLoading] = useState(true);
  const [funnel, setFunnel] = useState({});
  const [categoryData, setCategoryData] = useState([]);
  const [countryData, setCountryData] = useState([]);
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const thirtyDaysAgo = daysAgo(30);

    Promise.all([
      supabase.from("page_events").select("event_type").gte("created_at", thirtyDaysAgo)
        .in("event_type", ["page_view", "shortlist_add", "compare_add", "enquiry_started", "enquiry_submitted"]),
      supabase.from("page_events").select("entity_type").eq("event_type", "shortlist_add").gte("created_at", thirtyDaysAgo),
      supabase.from("page_events").select("country_code").not("country_code", "is", null).gte("created_at", thirtyDaysAgo),
    ]).then(([funnelRes, catRes, countryRes]) => {
      if (cancelled) return;

      // Process funnel
      const counts = {};
      (funnelRes.data || []).forEach(e => {
        counts[e.event_type] = (counts[e.event_type] || 0) + 1;
      });
      setFunnel(counts);

      // Process category
      const catCounts = {};
      (catRes.data || []).forEach(e => {
        if (e.entity_type) catCounts[e.entity_type] = (catCounts[e.entity_type] || 0) + 1;
      });
      const catArr = Object.entries(catCounts)
        .map(([type, count]) => ({ type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setCategoryData(catArr);

      // Process country
      const countryCounts = {};
      (countryRes.data || []).forEach(e => {
        if (e.country_code) countryCounts[e.country_code] = (countryCounts[e.country_code] || 0) + 1;
      });
      const countryArr = Object.entries(countryCounts)
        .map(([code, count]) => ({ code, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8);
      setCountryData(countryArr);

      setLoading(false);
    }).catch(e => {
      console.warn("[ReportingHub] Trends load error:", e);
      if (!cancelled) setLoading(false);
    });

    return () => { cancelled = true; };
  }, []);

  // Booking window insight
  const targetMonthMin = new Date();
  targetMonthMin.setMonth(targetMonthMin.getMonth() + BOOKING_WINDOW.venue.min);
  const targetMonthMax = new Date();
  targetMonthMax.setMonth(targetMonthMax.getMonth() + BOOKING_WINDOW.venue.max);
  const targetRange = `${targetMonthMin.toLocaleDateString("en-GB", { month: "long", year: "numeric" })} – ${targetMonthMax.toLocaleDateString("en-GB", { month: "long", year: "numeric" })}`;

  const funnelSteps = [
    { key: "page_view",         label: "Page Views",  color: "#60a5fa" },
    { key: "shortlist_add",     label: "Shortlisted", color: GOLD },
    { key: "compare_add",       label: "Compared",    color: "#a78bfa" },
    { key: "enquiry_started",   label: "Enq. Started",color: "#f59e0b" },
    { key: "enquiry_submitted", label: "Submitted",   color: "#22c55e" },
  ];
  const maxFunnel = funnelSteps.reduce((m, s) => Math.max(m, funnel[s.key] || 0), 1);
  const maxCat = categoryData[0]?.count || 1;
  const maxCountry = countryData[0]?.count || 1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

      {/* Booking window insight */}
      <div style={{ background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`, borderRadius: 8, padding: "16px 20px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 700, marginBottom: 6 }}>
          Booking Window Intelligence
        </div>
        <div style={{ fontFamily: GD, fontSize: 14, color: C.off }}>
          Couples enquiring <strong>right now</strong> are typically booking for <strong>{targetRange}</strong>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, marginTop: 14 }}>
          {Object.entries(BOOKING_WINDOW).filter(([k]) => k !== "default").map(([type, window]) => (
            <div key={type} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: "10px 14px" }}>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: "capitalize", marginBottom: 3 }}>{type}</div>
              <div style={{ fontFamily: GD, fontSize: 14, color: C.off }}>{window.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Platform funnel */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 18 }}>
          Platform Funnel — Last 30 Days
        </div>
        {loading ? (
          <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>
        ) : (
          <div style={{ display: "flex", alignItems: "flex-end", gap: 0 }}>
            {funnelSteps.map((step, i) => {
              const val = funnel[step.key] || 0;
              const prev = i > 0 ? (funnel[funnelSteps[i - 1].key] || 0) : val;
              const dropRate = i > 0 && prev > 0 ? Math.round(((prev - val) / prev) * 100) : null;
              const barH = maxFunnel > 0 ? Math.max(8, Math.round((val / maxFunnel) * 80)) : 8;
              return (
                <div key={step.key} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                  {i > 0 && dropRate !== null && dropRate > 0 && (
                    <div style={{ fontFamily: NU, fontSize: 9, color: "#ef4444", marginBottom: 2 }}>−{dropRate}%</div>
                  )}
                  {i > 0 && (!dropRate || dropRate === 0) && <div style={{ marginBottom: 2, height: 15 }} />}
                  <div style={{ fontFamily: GD, fontSize: 20, color: step.color, marginBottom: 6 }}>{fmt(val)}</div>
                  <div style={{ width: "80%", height: `${barH}px`, background: step.color + "30", borderRadius: 3, overflow: "hidden", marginBottom: 6 }}>
                    <div style={{ width: "100%", height: "100%", background: step.color, borderRadius: 3 }} />
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 9, color: C.grey, textAlign: "center" }}>{step.label}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        {/* Top categories by shortlist */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>
              Top Categories by Shortlist
            </div>
          </div>
          {loading ? (
            <div style={{ padding: "24px", fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>
          ) : categoryData.length === 0 ? (
            <div style={{ padding: "24px", fontFamily: NU, fontSize: 12, color: C.grey2, fontStyle: "italic" }}>No shortlist data yet.</div>
          ) : categoryData.map((cat, i) => (
            <div key={cat.type} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.off, textTransform: "capitalize" }}>{cat.type || "unknown"}</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{cat.count}</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(cat.count / maxCat) * 100}%`, background: GOLD, borderRadius: 2, transition: "width 0.6s" }} />
              </div>
            </div>
          ))}
        </div>

        {/* Country of origin */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "#60a5fa", fontWeight: 600 }}>
              Country of Origin — Enquiring Couples
            </div>
          </div>
          {loading ? (
            <div style={{ padding: "24px", fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>
          ) : countryData.length === 0 ? (
            <div style={{ padding: "24px", fontFamily: NU, fontSize: 12, color: C.grey2, fontStyle: "italic" }}>No country data yet.</div>
          ) : countryData.map(country => (
            <div key={country.code} style={{ padding: "12px 20px", borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{country.code}</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{country.count}</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${(country.count / maxCountry) * 100}%`, background: "#60a5fa", borderRadius: 2, transition: "width 0.6s" }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Seasonality map */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: "20px 24px" }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: GOLD, fontWeight: 600, marginBottom: 20 }}>
          Wedding Seasonality Context
        </div>
        {["GB", "IT", "AE"].map(country => (
          <div key={country} style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: C.off, marginBottom: 10, letterSpacing: "0.05em" }}>
              {country === "GB" ? "United Kingdom" : country === "IT" ? "Italy" : "UAE"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(12, 1fr)", gap: 4 }}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(month => {
                const info = WEDDING_SEASONALITY[country]?.[month];
                const isCurrentMonth = month === currentMonth;
                return (
                  <div
                    key={month}
                    title={info?.label}
                    style={{
                      background: info?.color ? info.color + "22" : C.border,
                      border: `1px solid ${isCurrentMonth ? GOLD : (info?.color || C.border)}`,
                      borderRadius: 4,
                      padding: "8px 4px",
                      textAlign: "center",
                      outline: isCurrentMonth ? `2px solid ${GOLD}` : "none",
                      outlineOffset: 1,
                    }}
                  >
                    <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: C.grey2, marginBottom: 4 }}>
                      {["J","F","M","A","M","J","J","A","S","O","N","D"][month - 1]}
                    </div>
                    <div style={{ fontFamily: NU, fontSize: 7, color: info?.color || C.grey2, fontWeight: 700, letterSpacing: "0.02em" }}>
                      {info?.phase || "—"}
                    </div>
                  </div>
                );
              })}
            </div>
            {/* Current month context */}
            {WEDDING_SEASONALITY[country]?.[currentMonth] && (
              <div style={{ marginTop: 8, fontFamily: NU, fontSize: 11, color: C.grey, fontStyle: "italic" }}>
                <span style={{ color: GOLD, fontWeight: 600 }}>Now: </span>
                {WEDDING_SEASONALITY[country][currentMonth].label}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Tab 4: Health Scores ──────────────────────────────────────────────────────

function HealthScoresTab({ C, onVendorSelect }) {
  const [vendors, setVendors] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(true);
  const [flagging, setFlagging] = useState(null);
  const [triggering, setTriggering] = useState(null);
  const [sortKey, setSortKey] = useState("score");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data: vendorData } = await supabase
        .from("vendors")
        .select("id, name, email, analytics_enabled")
        .order("name");

      const { data: sendData } = await supabase
        .from("vendor_report_sends")
        .select("vendor_id, sent_at, opened_at, outcome_responded")
        .order("sent_at", { ascending: false });

      const { data: snapshotData } = await supabase
        .from("vendor_monthly_snapshots")
        .select("vendor_id, views")
        .gte("month", new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 7));

      const sendsByVendor = {};
      (sendData || []).forEach(s => {
        if (!sendsByVendor[s.vendor_id]) sendsByVendor[s.vendor_id] = [];
        sendsByVendor[s.vendor_id].push(s);
      });

      const viewsByVendor = {};
      (snapshotData || []).forEach(s => {
        viewsByVendor[s.vendor_id] = (viewsByVendor[s.vendor_id] || 0) + (s.views || 0);
      });

      const computedScores = {};
      (vendorData || []).forEach(v => {
        let score = 0;
        const vendorSends = sendsByVendor[v.id] || [];
        const lastSend = vendorSends[0];

        if (lastSend?.opened_at) score += 30;
        if (lastSend?.outcome_responded) score += 20;
        if (v.roi_settings && Object.keys(v.roi_settings || {}).length > 0) score += 20;
        if (v.analytics_enabled) score += 10;
        if ((viewsByVendor[v.id] || 0) > 0) score += 20;

        const health = getReportHealth(vendorSends);
        computedScores[v.id] = {
          score,
          health,
          sends: vendorSends,
          views: viewsByVendor[v.id] || 0,
        };
      });

      setVendors(vendorData || []);
      setScores(computedScores);
    } catch (e) {
      console.warn("[ReportingHub] HealthScores load error:", e);
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function flagAtRisk(vendor) {
    setFlagging(vendor.id);
    try {
      await supabase
        .from("managed_accounts")
        .update({ service_status: "at-risk" })
        .eq("vendor_id", vendor.id);
    } catch (e) {
      console.warn("[ReportingHub] Flag at-risk error:", e);
    }
    setFlagging(null);
  }

  async function triggerReport(vendorId) {
    setTriggering(vendorId);
    try {
      await supabase.functions.invoke("generate-monthly-reports", {
        body: { vendor_id: vendorId, force: true },
      });
      load();
    } catch (e) {
      console.warn("[ReportingHub] Trigger error:", e);
    }
    setTriggering(null);
  }

  const sorted = [...vendors].sort((a, b) => {
    const sa = scores[a.id]?.score || 0;
    const sb = scores[b.id]?.score || 0;
    return sb - sa;
  });

  return (
    <div>
      {/* Summary strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginBottom: 24 }}>
        <StatCard
          label="Healthy Vendors"
          value={loading ? "…" : String(vendors.filter(v => (scores[v.id]?.score || 0) >= 60).length)}
          sub="Score ≥ 60"
          accent="#22c55e"
          C={C}
        />
        <StatCard
          label="At Risk"
          value={loading ? "…" : String(vendors.filter(v => { const s = scores[v.id]?.score || 0; return s >= 20 && s < 40; }).length)}
          sub="Score 20–39"
          accent="#f97316"
          C={C}
        />
        <StatCard
          label="Silent"
          value={loading ? "…" : String(vendors.filter(v => (scores[v.id]?.score || 0) < 20).length)}
          sub="Score < 20"
          accent="#ef4444"
          C={C}
        />
      </div>

      {/* Vendor list */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, overflow: "hidden" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 80px 80px 60px 100px 80px 160px", gap: 12, padding: "8px 20px", borderBottom: `1px solid ${C.border}` }}>
          {["Vendor", "Score", "Views", "Health", "Last Report", "Opened", "Actions"].map(h => (
            <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: "0.15em", textTransform: "uppercase", color: C.grey2, fontWeight: 600 }}>{h}</span>
          ))}
        </div>

        {loading && <div style={{ padding: "32px", textAlign: "center", fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>}

        {!loading && sorted.map(vendor => {
          const data = scores[vendor.id] || { score: 0, health: { label: "No reports", color: "#6b7280" }, sends: [], views: 0 };
          const lastSend = data.sends[0];
          const scoreColor = data.score >= 60 ? "#22c55e" : data.score >= 40 ? GOLD : data.score >= 20 ? "#f97316" : "#ef4444";
          const rowBg = data.score < 20 ? "rgba(239,68,68,0.04)" : data.score < 40 ? "rgba(249,115,22,0.04)" : "transparent";

          return (
            <div
              key={vendor.id}
              style={{
                display: "grid", gridTemplateColumns: "1fr 80px 80px 60px 100px 80px 160px",
                gap: 12, padding: "14px 20px", borderBottom: `1px solid ${C.border}`,
                alignItems: "center", background: rowBg,
              }}
            >
              <div>
                <div style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 500 }}>{vendor.name}</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: "capitalize", marginTop: 1 }}>
                  {vendor.email || "—"}
                </div>
              </div>
              <div>
                <div style={{ fontFamily: GD, fontSize: 22, color: scoreColor }}>{data.score}</div>
                <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: "hidden", marginTop: 3 }}>
                  <div style={{ height: "100%", width: `${data.score}%`, background: scoreColor, borderRadius: 2, transition: "width 0.6s" }} />
                </div>
              </div>
              <div style={{ fontFamily: GD, fontSize: 18, color: C.grey }}>{fmt(data.views)}</div>
              <div><HealthBadge label={data.health.label} color={data.health.color} /></div>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{lastSend ? fmtDate(lastSend.sent_at) : "Never"}</div>
              <div style={{ fontFamily: NU, fontSize: 11, color: lastSend?.opened_at ? "#22c55e" : C.grey2 }}>
                {lastSend?.opened_at ? fmtDate(lastSend.opened_at) : "—"}
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  onClick={() => triggerReport(vendor.id)}
                  disabled={triggering === vendor.id}
                  style={{
                    background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
                    borderRadius: 4, padding: "4px 8px",
                    color: GOLD, fontSize: 9, fontWeight: 700,
                    cursor: triggering === vendor.id ? "not-allowed" : "pointer",
                    opacity: triggering === vendor.id ? 0.5 : 1,
                    fontFamily: NU, letterSpacing: "0.04em",
                  }}
                >
                  {triggering === vendor.id ? "…" : "Send"}
                </button>
                <button
                  onClick={() => onVendorSelect?.(vendor.id, vendor.name)}
                  style={{
                    background: "transparent", border: `1px solid ${C.border}`,
                    borderRadius: 4, padding: "4px 8px",
                    color: C.grey, fontSize: 9, fontWeight: 700,
                    cursor: "pointer", fontFamily: NU, letterSpacing: "0.04em",
                  }}
                >
                  Intelligence
                </button>
                {data.score < 40 && (
                  <button
                    onClick={() => flagAtRisk(vendor)}
                    disabled={flagging === vendor.id}
                    style={{
                      background: "rgba(249,115,22,0.1)", border: "1px solid rgba(249,115,22,0.3)",
                      borderRadius: 4, padding: "4px 8px",
                      color: "#f97316", fontSize: 9, fontWeight: 700,
                      cursor: flagging === vendor.id ? "not-allowed" : "pointer",
                      opacity: flagging === vendor.id ? 0.5 : 1,
                      fontFamily: NU, letterSpacing: "0.04em",
                    }}
                  >
                    {flagging === vendor.id ? "…" : "Flag"}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

const TABS = [
  { key: "overview",   label: "Overview" },
  { key: "vendors",    label: "Vendor Reports" },
  { key: "trends",     label: "Industry Trends" },
  { key: "health",     label: "Health Scores" },
];

export default function ReportingHubModule({ C }) {
  const [activeTab, setActiveTab]         = useState("overview");
  const [selectedVendor, setSelectedVendor] = useState(null); // { id, name }

  return (
    <div style={{ width: "100%", padding: "28px 40px" }}>
      {/* Page header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "3px",
          textTransform: "uppercase", color: C.gold, marginBottom: 6 }}>
          ✦ Intelligence Centre
        </div>
        <h2 style={{ fontFamily: GD, fontSize: 22, color: C.off, margin: 0, fontWeight: 400 }}>
          Reporting Hub
        </h2>
        <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: "4px 0 0" }}>
          Vendor report intelligence — sends, engagement, health scores, industry trends
        </p>
      </div>

      <TabBar tabs={TABS} active={activeTab} onChange={setActiveTab} C={C} />

      {activeTab === "overview" && <OverviewTab C={C} />}
      {activeTab === "vendors"  && (
        <VendorReportsTab
          C={C}
          onVendorSelect={(id, name) => setSelectedVendor({ id, name })}
        />
      )}
      {activeTab === "trends"   && <IndustryTrendsTab C={C} />}
      {activeTab === "health"   && (
        <HealthScoresTab
          C={C}
          onVendorSelect={(id, name) => setSelectedVendor({ id, name })}
        />
      )}

      {/* Intelligence overlay */}
      {selectedVendor && (
        <AdminVendorIntelligenceView
          vendorId={selectedVendor.id}
          vendorName={selectedVendor.name}
          onClose={() => setSelectedVendor(null)}
          C={C}
        />
      )}
    </div>
  );
}
