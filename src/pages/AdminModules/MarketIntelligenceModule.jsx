// ─── src/pages/AdminModules/MarketIntelligenceModule.jsx ─────────────────────
// MBA / Doctorate-grade market intelligence centre.
//
// Every tab answers four questions:
//   1. What is happening now          → KPI strip + ranked table
//   2. What has changed               → prior-period delta + momentum
//   3. What it means                  → interpretation block (auto-generated prose)
//   4. What to do next                → action recommendation panel
//
// Signal confidence is declared on every metric:
//   ● Strong   — high volume, reliable field, structured data
//   ● Medium   — directional, some coverage gaps, use with context
//   ◌ Low      — inferred, low volume, early-stage — treat as provisional
//
// Tabs:
//   Overview   — 60-second executive summary across all dimensions
//   Destination Demand
//   Audience Origins
//   Supply & Demand Gaps
//   Lead Intelligence
//   Trends & Pipeline
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
const INDIGO      = "#818cf8";
const GD          = "var(--font-heading-primary)";
const NU          = "var(--font-body)";

const TABS = [
  { key: "overview",      label: "Overview",           icon: "⬡" },
  { key: "destinations",  label: "Destination Demand", icon: "◎" },
  { key: "audience",      label: "Audience Origins",   icon: "⊕" },
  { key: "gaps",          label: "Supply & Demand",     icon: "◈" },
  { key: "leads",         label: "Lead Intelligence",  icon: "✦" },
  { key: "trends",        label: "Trends & Pipeline",  icon: "↗" },
];

const RANGES = [
  { key: "7d",  label: "7 Days",    days: 7   },
  { key: "30d", label: "30 Days",   days: 30  },
  { key: "90d", label: "90 Days",   days: 90  },
  { key: "12m", label: "12 Months", days: 365 },
];

// ── Utilities ─────────────────────────────────────────────────────────────────
function flag(code) {
  if (!code || code.length !== 2) return "🌍";
  try {
    return code.toUpperCase().split("").map(c =>
      String.fromCodePoint(c.charCodeAt(0) + 127397)).join("");
  } catch { return "🌍"; }
}

function fmtNum(n) {
  if (n == null) return "—";
  const v = Number(n);
  if (isNaN(v)) return "—";
  if (v >= 1_000_000) return (v / 1_000_000).toFixed(1) + "M";
  if (v >= 10_000)    return (v / 1_000).toFixed(0) + "k";
  if (v >= 1_000)     return (v / 1_000).toFixed(1) + "k";
  return String(Math.round(v));
}

function fmtPct(n, dec = 1) {
  if (n == null) return "—";
  return Number(n).toFixed(dec) + "%";
}

function delta(current, prev) {
  const c = Number(current || 0);
  const p = Number(prev || 0);
  if (p === 0 && c > 0) return { pct: null, dir: "up", label: "New" };
  if (p === 0) return null;
  const pct = ((c - p) / p) * 100;
  if (Math.abs(pct) < 1) return null;
  return { pct: Math.abs(pct).toFixed(0), dir: pct > 0 ? "up" : "down" };
}

function exportCSV(filename, rows, cols) {
  if (!rows?.length) return;
  const header = cols.map(c => `"${c.label}"`).join(",");
  const body = rows.map(r =>
    cols.map(c => {
      const v = c.fn ? c.fn(r) : (r[c.key] ?? "");
      return `"${String(v).replace(/"/g, '""')}"`;
    }).join(",")
  ).join("\n");
  const blob = new Blob([header + "\n" + body], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

// ── Base UI components ────────────────────────────────────────────────────────
function SignalBadge({ level }) {
  const map = {
    strong:  { color: GREEN,  dot: "●", label: "Strong signal"  },
    medium:  { color: AMBER,  dot: "●", label: "Directional"    },
    low:     { color: "rgba(255,255,255,0.25)", dot: "◌", label: "Low volume" },
  };
  const s = map[level] || map.low;
  return (
    <span title={s.label} style={{
      fontFamily: NU, fontSize: 9, color: s.color,
      marginLeft: 5, cursor: "default",
    }}>
      {s.dot}
    </span>
  );
}

function DeltaBadge({ current, prev }) {
  const d = delta(current, prev);
  if (!d) return <span style={{ color: "rgba(255,255,255,0.20)", fontSize: 10 }}>—</span>;
  const isUp = d.dir === "up";
  if (d.label) return (
    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700,
      color: GREEN, background: "rgba(74,222,128,0.10)",
      border: "1px solid rgba(74,222,128,0.22)",
      borderRadius: 20, padding: "2px 7px" }}>New</span>
  );
  return (
    <span style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700,
      color: isUp ? GREEN : RED,
      background: isUp ? "rgba(74,222,128,0.10)" : "rgba(248,113,113,0.10)",
      border: `1px solid ${isUp ? "rgba(74,222,128,0.22)" : "rgba(248,113,113,0.22)"}`,
      borderRadius: 20, padding: "2px 7px",
    }}>
      {isUp ? "↑" : "↓"} {d.pct}%
    </span>
  );
}

function BarMeter({ value, max, color = GOLD, height = 4 }) {
  const pct = max > 0 ? Math.min((Number(value) / Number(max)) * 100, 100) : 0;
  return (
    <div style={{ width: "100%", height, borderRadius: 2,
      background: "rgba(255,255,255,0.06)" }}>
      <div style={{ height: "100%", width: `${pct}%`, borderRadius: 2,
        background: color, transition: "width 0.4s ease" }} />
    </div>
  );
}

function OpportunityBadge({ tier }) {
  const map = {
    High:      { bg: "rgba(74,222,128,0.12)",  border: "rgba(74,222,128,0.28)",  color: GREEN },
    Medium:    { bg: "rgba(251,191,36,0.10)",  border: "rgba(251,191,36,0.28)",  color: AMBER },
    Low:       { bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.10)", color: "rgba(255,255,255,0.35)" },
    Saturated: { bg: "rgba(129,140,248,0.10)", border: "rgba(129,140,248,0.25)", color: INDIGO },
  };
  const s = map[tier] || map.Low;
  return (
    <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.8px", textTransform: "uppercase",
      color: s.color, background: s.bg, border: `1px solid ${s.border}`,
      borderRadius: 20, padding: "2px 8px" }}>
      {tier}
    </span>
  );
}

function SectionLabel({ children, action, onAction }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
      marginBottom: 14 }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
        textTransform: "uppercase", color: GOLD }}>
        ✦ {children}
      </div>
      {action && (
        <button onClick={onAction} style={{
          fontFamily: NU, fontSize: 10, color: "rgba(255,255,255,0.40)",
          background: "none", border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 20, padding: "3px 10px", cursor: "pointer",
        }}>
          {action}
        </button>
      )}
    </div>
  );
}

// Auto-generated interpretation block
function InterpretationBlock({ sentences, confidence = "medium" }) {
  if (!sentences?.length) return null;
  return (
    <div style={{
      margin: "24px 0",
      background: GOLD_DIM, border: `1px solid ${GOLD_BORDER}`,
      borderRadius: 10, padding: "16px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
          textTransform: "uppercase", color: GOLD }}>Interpretation</span>
        <SignalBadge level={confidence} />
      </div>
      {sentences.map((s, i) => (
        <p key={i} style={{
          fontFamily: NU, fontSize: 13, color: "#F5F0E8",
          lineHeight: 1.7, margin: i < sentences.length - 1 ? "0 0 10px" : 0,
        }}>
          {s}
        </p>
      ))}
    </div>
  );
}

// Action recommendation panel
function ActionPanel({ items }) {
  if (!items?.length) return null;
  return (
    <div style={{
      margin: "0 0 32px",
      background: "rgba(74,222,128,0.05)",
      border: "1px solid rgba(74,222,128,0.15)",
      borderRadius: 10, padding: "16px 20px",
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.5px",
        textTransform: "uppercase", color: GREEN, marginBottom: 12 }}>
        ↑ What This Suggests
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {items.map((item, i) => (
          <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
            <span style={{ color: GREEN, fontSize: 14, lineHeight: 1.4, flexShrink: 0 }}>→</span>
            <span style={{ fontFamily: NU, fontSize: 12,
              color: "#F5F0E8", lineHeight: 1.6 }}>
              {item}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Data gap warning
function DataGapWarning({ gaps }) {
  if (!gaps?.length) return null;
  return (
    <div style={{
      marginBottom: 20,
      background: "rgba(251,191,36,0.06)",
      border: "1px solid rgba(251,191,36,0.18)",
      borderRadius: 8, padding: "10px 16px",
      display: "flex", gap: 10, alignItems: "flex-start",
    }}>
      <span style={{ color: AMBER, fontSize: 13, flexShrink: 0 }}>⚠</span>
      <div>
        <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700,
          color: AMBER, marginBottom: 3 }}>Data quality notes</div>
        {gaps.map((g, i) => (
          <div key={i} style={{ fontFamily: NU, fontSize: 11,
            color: "rgba(255,255,255,0.40)", lineHeight: 1.6 }}>
            {g}
          </div>
        ))}
      </div>
    </div>
  );
}

function KPICard({ label, value, sub, delta: d, signal, color = GOLD, wide }) {
  return (
    <div style={{
      background: "#1a1714", border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 10, padding: "16px 18px",
      gridColumn: wide ? "span 2" : undefined,
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "1.2px",
        textTransform: "uppercase", color: "rgba(255,255,255,0.40)",
        marginBottom: 8, display: "flex", alignItems: "center", gap: 4 }}>
        {label}{signal && <SignalBadge level={signal} />}
      </div>
      <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 600,
        fontStyle: "italic", color: color || GOLD, lineHeight: 1.1, marginBottom: 4 }}>
        {value ?? "—"}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 10,
          color: "rgba(255,255,255,0.40)", lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
      {d != null && (
        <div style={{ marginTop: 6 }}>
          <DeltaBadge current={d.current} prev={d.prev} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ message = "No data for this period" }) {
  return (
    <div style={{ padding: "56px 24px", textAlign: "center",
      fontFamily: GD, fontSize: 16, fontStyle: "italic",
      color: "rgba(255,255,255,0.25)" }}>
      {message}
    </div>
  );
}

function LoadingShimmer({ rows = 8, cols = 6 }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <tr key={i}>
          {Array.from({ length: cols }).map((_, j) => (
            <td key={j} style={{ padding: "10px 12px" }}>
              <div style={{ height: 11, width: j === 0 ? 120 : 56,
                background: "rgba(255,255,255,0.05)", borderRadius: 3,
                animation: "shimmer 1.4s ease infinite" }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

function TH({ children, right, center }) {
  return (
    <th style={{ fontFamily: NU, fontSize: 9, fontWeight: 700,
      letterSpacing: "1.2px", textTransform: "uppercase",
      color: "rgba(255,255,255,0.40)", padding: "8px 12px",
      textAlign: right ? "right" : center ? "center" : "left",
      whiteSpace: "nowrap",
      borderBottom: "1px solid rgba(255,255,255,0.08)",
      background: "rgba(0,0,0,0.15)" }}>
      {children}
    </th>
  );
}

function TD({ children, right, center, bold, gold, muted, small, danger, success }) {
  return (
    <td style={{ fontFamily: NU,
      fontSize: small ? 10 : 12,
      fontWeight: bold ? 700 : 400,
      color: gold ? GOLD : danger ? RED : success ? GREEN : muted
        ? "rgba(255,255,255,0.25)" : "#F5F0E8",
      padding: "10px 12px",
      textAlign: right ? "right" : center ? "center" : "left",
      borderBottom: "1px solid rgba(255,255,255,0.04)",
      whiteSpace: "nowrap" }}>
      {children}
    </td>
  );
}

// ── Interpretation engine ────────────────────────────────────────────────────
function interpretDestinations(rows) {
  if (!rows?.length) return { sentences: [], actions: [], confidence: "low" };
  const top = rows[0];
  const rising = rows.filter(r => Number(r.momentum_pct) > 15).sort((a,b) => b.momentum_pct - a.momentum_pct);
  const underConverting = rows.filter(r => Number(r.page_views) > 50 && Number(r.intent_rate) < 1.5);
  const strongConverting = rows.filter(r => Number(r.intent_rate) >= 5);

  const sentences = [];
  sentences.push(
    `${top.country} is the dominant destination this period with ${fmtNum(top.page_views)} pageviews and a demand score of ${Number(top.demand_score).toFixed(0)} — ` +
    (Number(top.momentum_pct) > 5
      ? `momentum is accelerating at +${Number(top.momentum_pct).toFixed(0)}% versus the prior period.`
      : Number(top.momentum_pct) < -5
      ? `though momentum has cooled ${Math.abs(Number(top.momentum_pct)).toFixed(0)}% versus the prior period.`
      : "momentum is stable period-on-period.")
  );
  if (rising.length > 0) {
    sentences.push(
      `${rising.slice(0,3).map(r => r.country).join(", ")} ${rising.length === 1 ? "is" : "are"} accelerating fastest — ` +
      `${rising[0].country} is up ${Number(rising[0].momentum_pct).toFixed(0)}% in views. ` +
      `These markets warrant immediate attention for content and vendor recruitment.`
    );
  }
  if (underConverting.length > 0) {
    sentences.push(
      `${underConverting.map(r => r.country).join(", ")} ${underConverting.length === 1 ? "is" : "are"} drawing views but under-converting — ` +
      `intent rates below 1.5% suggest browsing without commitment. ` +
      `Investigate listing quality, pricing signals, and gallery depth in these destinations.`
    );
  }
  if (strongConverting.length > 0) {
    sentences.push(
      `${strongConverting.map(r => r.country).join(", ")} ${strongConverting.length === 1 ? "is showing" : "are showing"} above-average enquiry intent (${Number(strongConverting[0].intent_rate).toFixed(1)}% rate). ` +
      `These destinations are converting attention into action — strong commercial signals.`
    );
  }

  const actions = [];
  if (rising.length > 0) actions.push(`Prioritise ${rising[0].country} in the next content cycle and vendor outreach sprint.`);
  if (underConverting.length > 0) actions.push(`Audit listing quality for ${underConverting[0].country} — weak intent rate suggests friction in the decision journey.`);
  if (strongConverting.length > 0) actions.push(`Use ${strongConverting[0].country} conversion data as benchmark in vendor sales conversations.`);

  return { sentences, actions, confidence: rows.length > 5 ? "strong" : "medium" };
}

function interpretAudience(origins, xborder) {
  if (!origins?.length) return { sentences: [], actions: [], confidence: "low" };
  const top = origins[0];
  const highIntent = [...origins].sort((a,b) => Number(b.avg_intent_depth) - Number(a.avg_intent_depth))[0];
  const topCross = xborder?.filter(r => r.cross_border).slice(0, 3) || [];

  const sentences = [];
  sentences.push(
    `${top.country_name || top.country_code} is the largest source market with ${fmtNum(top.sessions)} sessions — ` +
    `averaging ${top.avg_page_depth} pages per visit and ${top.avg_intent_depth} intent events per session.`
  );
  if (highIntent.country_code !== top.country_code) {
    sentences.push(
      `${highIntent.country_name || highIntent.country_code} drives the highest engagement depth at ${highIntent.avg_intent_depth} intent events per session, ` +
      `suggesting a more considered, purchase-ready audience despite lower volume.`
    );
  }
  if (topCross.length > 0) {
    sentences.push(
      `The strongest cross-border flow is ${topCross[0].visitor_country} → ${topCross[0].destination_country} ` +
      `(${fmtNum(topCross[0].page_views)} views). ` +
      `${topCross.length > 1 ? `${topCross[1].visitor_country} → ${topCross[1].destination_country} also shows significant interest. ` : ""}` +
      `International demand is a core platform differentiator worth amplifying in marketing.`
    );
  }

  const actions = [];
  if (highIntent.avg_intent_depth > 1.5 && highIntent.country_code !== top.country_code) {
    actions.push(`${highIntent.country_name || highIntent.country_code} is high-intent but lower volume — target with paid or editorial to scale this audience.`);
  }
  if (topCross.length > 0) {
    actions.push(`Feature the ${topCross[0].visitor_country} → ${topCross[0].destination_country} demand signal in vendor sales decks to demonstrate international reach.`);
  }

  return { sentences, actions, confidence: origins.length > 3 ? "strong" : "medium" };
}

function interpretGaps(gaps) {
  if (!gaps?.length) return { sentences: [], actions: [], confidence: "low" };
  const high = gaps.filter(g => g.opportunity_tier === "High");
  const medium = gaps.filter(g => g.opportunity_tier === "Medium");
  const saturated = gaps.filter(g => g.opportunity_tier === "Saturated");

  const sentences = [];
  if (high.length > 0) {
    sentences.push(
      `${high.map(g => g.country).join(", ")} ${high.length === 1 ? "shows" : "show"} demand-to-supply ratios above threshold — ` +
      `couples are searching for listings that do not yet exist on the platform. ` +
      `Each represents a commercial acquisition opportunity where competition for vendor sign-ups is low.`
    );
  }
  if (medium.length > 0) {
    sentences.push(
      `${medium.slice(0,3).map(g => g.country).join(", ")} ${medium.length === 1 ? "falls" : "fall"} in the medium-opportunity tier. ` +
      `Demand per listing is healthy but not critical — monitoring these markets for acceleration is advisable.`
    );
  }
  if (saturated.length > 0) {
    sentences.push(
      `${saturated.map(g => g.country).join(", ")} ${saturated.length === 1 ? "is" : "are"} well-served relative to demand. ` +
      `New listings in these markets should be assessed on quality and differentiation, not volume alone.`
    );
  }

  const actions = [];
  if (high.length > 0) actions.push(`Launch targeted vendor recruitment campaign in ${high.map(g => g.country).join(", ")} — demand exists, supply does not.`);
  if (high.length > 0) actions.push(`Brief the sales team: ${high[0].country} is the strongest short-term acquisition market based on demand data.`);

  return { sentences, actions, confidence: "strong" };
}

function interpretLeads(geoLeads, pipeline) {
  if (!geoLeads?.length) return { sentences: [], actions: [], confidence: "low" };
  const total = geoLeads.reduce((s, r) => s + Number(r.lead_count || 0), 0);
  const top = geoLeads[0];
  const highValue = geoLeads.filter(r => Number(r.avg_score) >= 60);
  const highConversion = geoLeads.filter(r => Number(r.conversion_rate) > 10);
  const peakMonths = pipeline?.reduce((acc, r) => {
    const key = r.wedding_month;
    if (key) acc[key] = (acc[key] || 0) + Number(r.lead_count || 0);
    return acc;
  }, {});
  const topMonth = peakMonths ? Object.entries(peakMonths).sort((a,b) => b[1]-a[1])[0] : null;

  const sentences = [];
  sentences.push(
    `${fmtNum(total)} leads captured in this period. ` +
    `${top.location} accounts for the highest demand at ${fmtNum(top.lead_count)} leads ` +
    (top.avg_score >= 60 ? `with an above-average quality score of ${top.avg_score}.` : `(score: ${top.avg_score}).`)
  );
  if (highValue.length > 0) {
    sentences.push(
      `High-value lead clusters (score ≥ 60) are concentrated in ${highValue.slice(0,3).map(r => r.location).join(", ")}. ` +
      `These represent the most commercially significant pipeline segments.`
    );
  }
  if (highConversion.length > 0) {
    sentences.push(
      `${highConversion.map(r => r.location).join(", ")} ${highConversion.length === 1 ? "is showing" : "are showing"} conversion rates above 10% — ` +
      `these destinations have strong lead-to-booking momentum worth protecting.`
    );
  }
  if (topMonth) {
    sentences.push(
      `Wedding date clustering peaks in ${topMonth[0]} — suggesting couples are planning ${topMonth[0].toLowerCase()} ceremonies. ` +
      `Enquiry lead times in this category are typically 12–18 months, so current activity likely reflects ceremonies 1–2 years ahead.`
    );
  }

  const actions = [];
  if (highValue.length > 0) actions.push(`Ensure vendors in ${highValue[0].location} are on Featured or Showcase tier — high-value leads deserve premium placement.`);
  if (highConversion.length > 0) actions.push(`Use ${highConversion[0].location} conversion data in vendor case studies and renewal conversations.`);

  return { sentences, actions, confidence: total > 20 ? "strong" : total > 5 ? "medium" : "low" };
}


// ── Overview Tab ──────────────────────────────────────────────────────────────
function OverviewTab({ from, to, rangeLabel }) {
  const [summary, setSummary] = useState(null);
  const [loading, setLoad]    = useState(true);

  useEffect(() => {
    setLoad(true);
    supabase.rpc("get_market_intelligence_summary", { p_from: from, p_to: to })
      .then(({ data }) => { setSummary(data?.[0] || null); setLoad(false); })
      .catch(() => setLoad(false));
  }, [from, to]);

  const s = summary;

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <div style={{ fontFamily: GD, fontSize: 18, fontStyle: "italic",
          color: "#F5F0E8", marginBottom: 6 }}>
          Intelligence Summary — {rangeLabel}
        </div>
        <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.40)",
          margin: 0, lineHeight: 1.6 }}>
          Platform-wide market signals across demand, audience, supply, and lead pipeline.
          Read in 60 seconds.
        </p>
      </div>

      {/* Headline KPIs */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
        gap: 12, marginBottom: 28 }}>
        <KPICard label="Top destination"
          value={loading ? "…" : s?.top_destination || "—"}
          sub={s ? `${fmtNum(s.top_destination_views)} views · ${fmtNum(s.top_destination_intents)} intents` : ""}
          signal="strong" color={GOLD} />
        <KPICard label="Fastest growing"
          value={loading ? "…" : s?.fastest_growing_dest || "Stable"}
          sub={s?.fastest_growing_pct ? `+${Number(s.fastest_growing_pct).toFixed(0)}% vs prior period` : ""}
          signal="medium" color={GREEN} />
        <KPICard label="Top source market"
          value={loading ? "…" : s?.top_source_country || "—"}
          sub={s ? `${fmtNum(s.top_source_sessions)} sessions` : ""}
          signal="strong" />
        <KPICard label="Cross-border demand"
          value={loading ? "…" : fmtPct(s?.cross_border_pct)}
          sub="Sessions viewing a foreign destination"
          signal="medium" />
        <KPICard label="Supply gap opportunity"
          value={loading ? "…" : s?.highest_gap_destination || "—"}
          sub={s?.high_opportunity_count ? `${s.high_opportunity_count} high-opportunity markets` : ""}
          signal="strong" color={AMBER} />
        <KPICard label="Platform intent rate"
          value={loading ? "…" : fmtPct(s?.platform_intent_rate, 2)}
          sub="Views that resulted in a shortlist or enquiry"
          signal="strong" color={Number(s?.platform_intent_rate) >= 3 ? GREEN : undefined} />
        <KPICard label="Leads this period"
          value={loading ? "…" : fmtNum(s?.total_leads)}
          sub={s ? `${fmtNum(s.booked_leads)} booked · avg score ${s.avg_lead_score}` : ""}
          signal="strong" />
        <KPICard label="Active destinations"
          value={loading ? "…" : fmtNum(s?.total_destinations_active)}
          sub="Countries with at least one pageview"
          signal="strong" />
      </div>

      {/* Narrative summary */}
      {!loading && s && (
        <div style={{ background: "#1a1714",
          border: "1px solid rgba(255,255,255,0.08)",
          borderRadius: 10, padding: "22px 24px", marginBottom: 24 }}>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "2px",
            textTransform: "uppercase", color: GOLD, marginBottom: 14 }}>
            ✦ Executive Narrative
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              s.top_destination && `Demand is concentrated in ${s.top_destination}, which led platform engagement across the period.${s.fastest_growing_dest && s.fastest_growing_dest !== s.top_destination ? ` ${s.fastest_growing_dest} is the fastest-growing market at +${Number(s.fastest_growing_pct || 0).toFixed(0)}% momentum.` : ""}`,
              s.top_source_country && `The largest visitor origin is ${s.top_source_country}. ${Number(s.cross_border_pct || 0) > 20 ? `Notably, ${fmtPct(s.cross_border_pct)} of sessions are cross-border — couples browsing destinations outside their home country. This is a significant international demand signal.` : ""}`,
              s.highest_gap_destination && `The most underserved market is ${s.highest_gap_destination} — high demand relative to current listing supply creates a clear vendor recruitment opportunity.`,
              s.total_leads > 0 && `Lead pipeline shows ${fmtNum(s.total_leads)} enquiries this period with an average quality score of ${s.avg_lead_score}/100 and ${fmtNum(s.booked_leads)} conversions to booking.`,
              s.platform_intent_rate > 0 && `Platform intent rate stands at ${fmtPct(s.platform_intent_rate, 2)} — ${Number(s.platform_intent_rate) >= 3 ? "above the 3% benchmark, suggesting strong audience quality." : "room to improve through better listing quality, pricing signals, and gallery depth."}`,
            ].filter(Boolean).map((text, i) => (
              <p key={i} style={{ fontFamily: NU, fontSize: 13,
                color: "rgba(245,240,232,0.78)", lineHeight: 1.7, margin: 0 }}>
                {text}
              </p>
            ))}
          </div>
        </div>
      )}

      {/* Data quality surface */}
      <DataGapWarning gaps={[
        "Listing country/region fields may be inconsistent across older records — destination data is most reliable for listings created after 2025.",
        "Cross-border demand requires session geo data from Cloudflare. Sessions served without Cloudflare headers fall back to client-side geo, which has ~5–10% lower accuracy.",
        "Trend claims become authoritative after 90+ days of data. Early period comparisons should be treated as directional.",
        "Lead location fields (event_location, location_preference) rely on user input — some leads may be uncategorised or inconsistently formatted.",
      ]} />
    </div>
  );
}


// ── Destination Demand Tab ────────────────────────────────────────────────────
function DestinationsTab({ from, to }) {
  const [rows, setRows]   = useState([]);
  const [cat,  setCat]    = useState([]);
  const [load, setLoad]   = useState(true);

  useEffect(() => {
    setLoad(true);
    Promise.all([
      supabase.rpc("get_destination_demand", { p_from: from, p_to: to, p_limit: 25 }),
      supabase.rpc("get_category_demand_by_destination", { p_from: from, p_to: to }),
    ]).then(([d, c]) => {
      setRows(d.data || []);
      setCat(c.data || []);
      setLoad(false);
    }).catch(() => setLoad(false));
  }, [from, to]);

  const maxScore = Math.max(...rows.map(r => Number(r.demand_score || 0)), 1);
  const { sentences, actions, confidence } = interpretDestinations(rows);

  // Category matrix
  const catMatrix = {};
  cat.forEach(r => {
    if (!catMatrix[r.country]) catMatrix[r.country] = {};
    catMatrix[r.country][r.listing_type] = Number(r.page_views || 0);
  });

  const COLS = [
    { label: "Destination",   key: "country" },
    { label: "Pageviews",     key: "page_views" },
    { label: "Sessions",      key: "unique_sessions" },
    { label: "Shortlists",    key: "shortlists" },
    { label: "Enquiries",     key: "enquiries" },
    { label: "Intent Rate",   fn: r => fmtPct(r.intent_rate) },
    { label: "Demand Score",  fn: r => Number(r.demand_score).toFixed(0) },
    { label: "Momentum",      fn: r => r.momentum_pct ? `${Number(r.momentum_pct) > 0 ? "+" : ""}${Number(r.momentum_pct).toFixed(0)}%` : "—" },
    { label: "Listings",      key: "listing_count" },
  ];

  return (
    <div>
      <InterpretationBlock sentences={sentences} confidence={confidence} />
      <ActionPanel items={actions} />

      <SectionLabel
        action="Export CSV"
        onAction={() => exportCSV("destination-demand.csv", rows, COLS)}>
        Destination Demand Ranking
      </SectionLabel>

      <div style={{ overflowX: "auto", marginBottom: 36 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>#</TH>
              <TH>Destination<SignalBadge level="strong" /></TH>
              <TH right>Pageviews</TH>
              <TH right>Sessions</TH>
              <TH right>Shortlists<SignalBadge level="strong" /></TH>
              <TH right>Enquiries<SignalBadge level="strong" /></TH>
              <TH right>Intent Rate<SignalBadge level="strong" /></TH>
              <TH right>Demand Score</TH>
              <TH right>vs Prior</TH>
              <TH right>Listings</TH>
            </tr>
          </thead>
          <tbody>
            {load && <LoadingShimmer rows={10} cols={10} />}
            {!load && rows.length === 0 && (
              <tr><td colSpan={10}>
                <EmptyState message="No destination data yet — events populate as couples browse listings" />
              </td></tr>
            )}
            {!load && rows.map((r, i) => (
              <tr key={r.country + i} style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
              }}>
                <TD muted small>{i + 1}</TD>
                <TD bold>
                  <span style={{ marginRight: 7, fontSize: 16 }}>
                    {flag(r.country?.slice(0,2))}
                  </span>
                  {r.country}
                </TD>
                <TD right>{fmtNum(r.page_views)}</TD>
                <TD right muted small>{fmtNum(r.unique_sessions)}</TD>
                <TD right>{fmtNum(r.shortlists)}</TD>
                <TD right gold={Number(r.enquiries) > 0}>{fmtNum(r.enquiries)}</TD>
                <TD right small gold={Number(r.intent_rate) >= 5}
                  danger={Number(r.page_views) > 50 && Number(r.intent_rate) < 1}>
                  {fmtPct(r.intent_rate)}
                </TD>
                <TD right>
                  <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 80 }}>
                    <span style={{ color: GOLD, fontWeight: 700 }}>
                      {Number(r.demand_score).toFixed(0)}
                    </span>
                    <BarMeter value={Number(r.demand_score)} max={maxScore} />
                  </div>
                </TD>
                <TD right>
                  <DeltaBadge current={r.page_views} prev={r.prev_views} />
                </TD>
                <TD right muted small>{fmtNum(r.listing_count)}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Category matrix */}
      {!load && rows.length > 0 && (
        <>
          <SectionLabel>Category Split by Destination</SectionLabel>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Destination</TH>
                  <TH right>Venues</TH>
                  <TH right>Vendors</TH>
                  <TH right>Planners</TH>
                  <TH right>Category Leader</TH>
                </tr>
              </thead>
              <tbody>
                {rows.slice(0, 15).map((r, i) => {
                  const m = catMatrix[r.country] || {};
                  const cats = [
                    { k: "venue",   v: m.venue   || 0 },
                    { k: "vendor",  v: m.vendor  || 0 },
                    { k: "planner", v: m.planner || 0 },
                  ];
                  const dominant = cats.reduce((a, b) => a.v > b.v ? a : b);
                  return (
                    <tr key={r.country} style={{
                      background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
                    }}>
                      <TD bold>
                        <span style={{ marginRight: 7 }}>{flag(r.country?.slice(0,2))}</span>
                        {r.country}
                      </TD>
                      <TD right>{fmtNum(m.venue || 0)}</TD>
                      <TD right>{fmtNum(m.vendor || 0)}</TD>
                      <TD right>{fmtNum(m.planner || 0)}</TD>
                      <TD right>
                        <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 600,
                          color: GOLD, letterSpacing: "0.5px", textTransform: "capitalize" }}>
                          {dominant.v > 0 ? dominant.k + "s" : "—"}
                        </span>
                      </TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


// ── Audience Origins Tab ──────────────────────────────────────────────────────
function AudienceTab({ from, to }) {
  const [origins, setOrigins] = useState([]);
  const [xborder, setXBorder] = useState([]);
  const [sources, setSources] = useState([]);
  const [load,    setLoad]    = useState(true);

  useEffect(() => {
    setLoad(true);
    Promise.all([
      supabase.rpc("get_audience_origins",       { p_from: from, p_to: to, p_limit: 20 }),
      supabase.rpc("get_cross_border_demand",     { p_from: from, p_to: to, p_limit: 40 }),
      supabase.rpc("get_traffic_source_analysis", { p_from: from, p_to: to }),
    ]).then(([o, x, s]) => {
      setOrigins(o.data || []);
      setXBorder(x.data || []);
      setSources(s.data || []);
      setLoad(false);
    }).catch(() => setLoad(false));
  }, [from, to]);

  const maxSessions = Math.max(...origins.map(r => Number(r.sessions || 0)), 1);
  const crossBorderOnly = xborder.filter(r => r.cross_border).slice(0, 20);
  const { sentences, actions, confidence } = interpretAudience(origins, crossBorderOnly);

  const ORIGIN_COLS = [
    { label: "Country Code",   key: "country_code" },
    { label: "Country",        key: "country_name" },
    { label: "Sessions",       key: "sessions" },
    { label: "Avg Pages",      key: "avg_page_depth" },
    { label: "Avg Intents",    key: "avg_intent_depth" },
    { label: "Mobile %",       fn: r => fmtPct(r.mobile_pct) },
    { label: "Bounce %",       fn: r => fmtPct(r.bounce_pct) },
    { label: "High Intent %",  fn: r => fmtPct(r.high_intent_pct) },
  ];

  return (
    <div>
      <InterpretationBlock sentences={sentences} confidence={confidence} />
      <ActionPanel items={actions} />
      <DataGapWarning gaps={[
        "Country detection relies on Cloudflare headers where available, falling back to ipapi.co. ~5–10% of sessions may have imprecise or missing country data.",
        "Sessions without a listing_id interaction cannot contribute to cross-border flow analysis.",
      ]} />

      <SectionLabel
        action="Export CSV"
        onAction={() => exportCSV("audience-origins.csv", origins, ORIGIN_COLS)}>
        Visitor Origin Countries<SignalBadge level="strong" />
      </SectionLabel>

      <div style={{ overflowX: "auto", marginBottom: 36 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>#</TH>
              <TH>Origin Country</TH>
              <TH right>Sessions</TH>
              <TH right>Avg Pages</TH>
              <TH right>Avg Intents<SignalBadge level="medium" /></TH>
              <TH right>Mobile %</TH>
              <TH right>Bounce %</TH>
              <TH right>High Intent %<SignalBadge level="medium" /></TH>
              <TH right>Top Browser</TH>
            </tr>
          </thead>
          <tbody>
            {load && <LoadingShimmer rows={8} cols={9} />}
            {!load && origins.length === 0 && (
              <tr><td colSpan={9}><EmptyState /></td></tr>
            )}
            {!load && origins.map((r, i) => (
              <tr key={r.country_code + i} style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
              }}>
                <TD muted small>{i + 1}</TD>
                <TD bold>
                  <span style={{ marginRight: 7, fontSize: 16 }}>{flag(r.country_code)}</span>
                  {r.country_name || r.country_code}
                </TD>
                <TD right>
                  <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 80 }}>
                    <span>{fmtNum(r.sessions)}</span>
                    <BarMeter value={Number(r.sessions)} max={maxSessions} />
                  </div>
                </TD>
                <TD right small>{r.avg_page_depth}</TD>
                <TD right small gold={Number(r.avg_intent_depth) >= 1.5}>{r.avg_intent_depth}</TD>
                <TD right small>{fmtPct(r.mobile_pct)}</TD>
                <TD right small danger={Number(r.bounce_pct) > 65}
                  muted={Number(r.bounce_pct) <= 65}>{fmtPct(r.bounce_pct)}</TD>
                <TD right small gold={Number(r.high_intent_pct) >= 20}>{fmtPct(r.high_intent_pct)}</TD>
                <TD right muted small>{r.top_browser || "—"}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Cross-border flows */}
      {crossBorderOnly.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <SectionLabel
            action="Export CSV"
            onAction={() => exportCSV("cross-border-demand.csv", crossBorderOnly, [
              { label: "From",        key: "visitor_country" },
              { label: "To",          key: "destination_country" },
              { label: "Pageviews",   key: "page_views" },
              { label: "Sessions",    key: "unique_sessions" },
              { label: "Intents",     key: "intent_events" },
            ])}>
            Cross-Border Demand Flows<SignalBadge level="medium" />
          </SectionLabel>
          <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.40)",
            marginBottom: 16, marginTop: -8 }}>
            Couples from one country actively browsing listings in another — your international demand signal.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Browsing From</TH>
                  <TH>Interested In</TH>
                  <TH right>Pageviews</TH>
                  <TH right>Sessions</TH>
                  <TH right>Intent Events</TH>
                  <TH right>Intent Rate</TH>
                </tr>
              </thead>
              <tbody>
                {crossBorderOnly.map((r, i) => (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
                  }}>
                    <TD bold>
                      <span style={{ marginRight: 6, fontSize: 14 }}>{flag(r.visitor_country)}</span>
                      {r.visitor_country}
                    </TD>
                    <TD>
                      <span style={{ marginRight: 6, fontSize: 14 }}>{flag(r.destination_country?.slice(0,2))}</span>
                      {r.destination_country}
                    </TD>
                    <TD right>{fmtNum(r.page_views)}</TD>
                    <TD right muted small>{fmtNum(r.unique_sessions)}</TD>
                    <TD right gold={Number(r.intent_events) > 0}>{fmtNum(r.intent_events)}</TD>
                    <TD right small>
                      {Number(r.page_views) > 0
                        ? fmtPct(Number(r.intent_events) / Number(r.page_views) * 100)
                        : "—"}
                    </TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Traffic sources */}
      {!load && sources.length > 0 && (
        <>
          <SectionLabel
            action="Export CSV"
            onAction={() => exportCSV("traffic-sources.csv", sources, [
              { label: "Source",      key: "source" },
              { label: "Medium",      key: "medium" },
              { label: "Sessions",    key: "sessions" },
              { label: "Avg Pages",   key: "avg_pages" },
              { label: "Avg Intents", key: "avg_intents" },
              { label: "Intent Rate", fn: r => fmtPct(r.intent_rate) },
            ])}>
            Traffic Sources<SignalBadge level="medium" />
          </SectionLabel>
          <DataGapWarning gaps={[
            "Source attribution is only available for sessions with UTM parameters or referrer data. Direct traffic (no UTM, no referrer) may be under-attributed.",
          ]} />
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Source</TH><TH>Medium</TH>
                  <TH right>Sessions</TH><TH right>Avg Pages</TH>
                  <TH right>Avg Intents</TH><TH right>Mobile %</TH>
                  <TH right>Intent Rate</TH><TH right>High Intent %</TH>
                </tr>
              </thead>
              <tbody>
                {sources.map((r, i) => (
                  <tr key={i} style={{ background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent" }}>
                    <TD bold>{r.source}</TD>
                    <TD muted small>{r.medium}</TD>
                    <TD right>{fmtNum(r.sessions)}</TD>
                    <TD right small>{r.avg_pages}</TD>
                    <TD right small>{r.avg_intents}</TD>
                    <TD right small>{fmtPct(r.mobile_pct)}</TD>
                    <TD right gold={Number(r.intent_rate) >= 20}>{fmtPct(r.intent_rate)}</TD>
                    <TD right gold={Number(r.high_intent_pct) >= 10}>{fmtPct(r.high_intent_pct)}</TD>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


// ── Supply & Demand Tab ───────────────────────────────────────────────────────
function GapsTab({ from, to }) {
  const [gaps, setGaps] = useState([]);
  const [load, setLoad] = useState(true);

  useEffect(() => {
    setLoad(true);
    supabase.rpc("get_supply_demand_gap", { p_from: from, p_to: to })
      .then(({ data }) => { setGaps(data || []); setLoad(false); })
      .catch(() => setLoad(false));
  }, [from, to]);

  const maxGap = Math.max(...gaps.map(r => Number(r.gap_score || 0)), 1);
  const { sentences, actions, confidence } = interpretGaps(gaps);
  const tierCounts = { High: 0, Medium: 0, Low: 0, Saturated: 0 };
  gaps.forEach(g => { if (tierCounts[g.opportunity_tier] !== undefined) tierCounts[g.opportunity_tier]++; });

  const COLS = [
    { label: "Country",             key: "country" },
    { label: "Pageviews",           key: "page_views" },
    { label: "Intent Events",       key: "intent_events" },
    { label: "Listings",            key: "listing_count" },
    { label: "Demand per Listing",  fn: r => Number(r.demand_per_listing).toFixed(1) },
    { label: "Intent per Listing",  fn: r => Number(r.intent_per_listing).toFixed(2) },
    { label: "Gap Score",           fn: r => Number(r.gap_score).toFixed(1) },
    { label: "Opportunity Tier",    key: "opportunity_tier" },
  ];

  return (
    <div>
      <InterpretationBlock sentences={sentences} confidence={confidence} />
      <ActionPanel items={actions} />

      {/* Tier summary */}
      <div style={{ display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 24 }}>
        {[
          { tier: "High",      color: GREEN,  note: "Recruit now" },
          { tier: "Medium",    color: AMBER,  note: "Monitor closely" },
          { tier: "Low",       color: "rgba(255,255,255,0.35)", note: "Stable" },
          { tier: "Saturated", color: INDIGO, note: "Quality focus" },
        ].map(({ tier, color, note }) => (
          <div key={tier} style={{ background: "#1a1714",
            border: "1px solid rgba(255,255,255,0.07)",
            borderRadius: 10, padding: "14px 16px" }}>
            <div style={{ fontFamily: NU, fontSize: 22, fontWeight: 700, color }}>
              {tierCounts[tier]}
            </div>
            <div style={{ fontFamily: NU, fontSize: 10,
              color: "rgba(255,255,255,0.40)", marginTop: 3 }}>
              {tier} opportunity
            </div>
            <div style={{ fontFamily: NU, fontSize: 9,
              color: "rgba(255,255,255,0.22)", marginTop: 2 }}>
              {note}
            </div>
          </div>
        ))}
      </div>

      <SectionLabel
        action="Export CSV"
        onAction={() => exportCSV("supply-demand-gaps.csv", gaps, COLS)}>
        Supply vs Demand by Destination<SignalBadge level="strong" />
      </SectionLabel>
      <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.40)",
        marginBottom: 16, marginTop: -8 }}>
        Gap score = demand engagement per listing. High = demand outpacing supply. Low = market is served.
      </p>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <TH>Destination</TH>
              <TH right>Pageviews</TH>
              <TH right>Intent Events</TH>
              <TH right>Listings</TH>
              <TH right>Demand / Listing</TH>
              <TH right>Intent / Listing</TH>
              <TH right>Gap Score</TH>
              <TH center>Opportunity</TH>
            </tr>
          </thead>
          <tbody>
            {load && <LoadingShimmer rows={10} cols={8} />}
            {!load && gaps.length === 0 && (
              <tr><td colSpan={8}><EmptyState /></td></tr>
            )}
            {!load && gaps.map((r, i) => (
              <tr key={r.country + i} style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
              }}>
                <TD bold>
                  <span style={{ marginRight: 7 }}>{flag(r.country?.slice(0,2))}</span>
                  {r.country}
                </TD>
                <TD right>{fmtNum(r.page_views)}</TD>
                <TD right gold={Number(r.intent_events) > 0}>{fmtNum(r.intent_events)}</TD>
                <TD right muted small>{fmtNum(r.listing_count)}</TD>
                <TD right>
                  <div style={{ display:"flex", flexDirection:"column", gap:4, minWidth:80 }}>
                    <span style={{ fontWeight:700 }}>{Number(r.demand_per_listing).toFixed(1)}</span>
                    <BarMeter value={Number(r.gap_score)} max={maxGap} />
                  </div>
                </TD>
                <TD right small>{Number(r.intent_per_listing).toFixed(2)}</TD>
                <TD right bold gold>{Number(r.gap_score).toFixed(1)}</TD>
                <TD center><OpportunityBadge tier={r.opportunity_tier} /></TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// ── Lead Intelligence Tab ─────────────────────────────────────────────────────
function LeadsTab({ from, to }) {
  const [geoLeads, setGeo]  = useState([]);
  const [pipeline, setPipe] = useState([]);
  const [load,     setLoad] = useState(true);

  useEffect(() => {
    setLoad(true);
    Promise.all([
      supabase.rpc("get_lead_geo_analysis",    { p_from: from, p_to: to }),
      supabase.rpc("get_wedding_date_pipeline"),
    ]).then(([g, p]) => {
      setGeo(g.data || []);
      setPipe(p.data || []);
      setLoad(false);
    }).catch(() => setLoad(false));
  }, [from, to]);

  const maxLeads = Math.max(...geoLeads.map(r => Number(r.lead_count || 0)), 1);
  const total    = geoLeads.reduce((s, r) => s + Number(r.lead_count || 0), 0);
  const { sentences, actions, confidence } = interpretLeads(geoLeads, pipeline);

  // Budget distribution
  const budgetMap = {};
  geoLeads.forEach(r => {
    if (r.top_budget_band) budgetMap[r.top_budget_band] = (budgetMap[r.top_budget_band] || 0) + Number(r.lead_count || 0);
  });
  const budgetEntries = Object.entries(budgetMap).sort((a,b) => b[1] - a[1]);
  const maxBudget = budgetEntries[0]?.[1] || 1;

  // Heatmap
  const years = [...new Set(pipeline.map(r => r.wedding_year))].sort();
  const MONTHS = ["January","February","March","April","May","June",
    "July","August","September","October","November","December"];
  const pMap = {};
  pipeline.forEach(r => { pMap[`${r.wedding_year}__${r.wedding_month}`] = r; });
  const maxPipe = Math.max(...pipeline.map(r => Number(r.lead_count || 0)), 1);

  const GEO_COLS = [
    { label: "Location",         key: "location" },
    { label: "Leads",            key: "lead_count" },
    { label: "Avg Score",        key: "avg_score" },
    { label: "High Value",       key: "high_value_count" },
    { label: "Booked",           key: "booked_count" },
    { label: "Conversion %",     fn: r => fmtPct(r.conversion_rate) },
    { label: "Top Budget Band",  key: "top_budget_band" },
    { label: "Top Guest Count",  key: "top_guest_band" },
  ];

  return (
    <div>
      <InterpretationBlock sentences={sentences} confidence={confidence} />
      <ActionPanel items={actions} />
      <DataGapWarning gaps={[
        "Location fields rely on user-entered data in lead forms. Some leads may carry 'Not Specified' or informal region names.",
        "Booking conversion rate is based on leads that reached 'booked' status — early-stage leads that later convert are retrospectively counted.",
      ]} />

      {/* KPIs */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(160px, 1fr))",
        gap:12, marginBottom:24 }}>
        <KPICard label="Total Leads"   value={fmtNum(total)} signal="strong" />
        <KPICard label="Avg Lead Score"
          value={geoLeads.length
            ? (geoLeads.reduce((s,r) => s + Number(r.avg_score || 0), 0) / geoLeads.length).toFixed(0) + "/100"
            : "—"}
          signal="strong"
          color={(() => {
            const avg = geoLeads.reduce((s,r) => s + Number(r.avg_score || 0), 0) / (geoLeads.length || 1);
            return avg >= 60 ? GREEN : avg >= 40 ? AMBER : undefined;
          })()} />
        <KPICard label="Total Bookings"
          value={fmtNum(geoLeads.reduce((s,r) => s + Number(r.booked_count || 0), 0))}
          signal="strong" color={GREEN} />
        <KPICard label="Destinations Requested"
          value={geoLeads.filter(r => r.location !== "Not Specified").length}
          sub="Distinct wedding locations named"
          signal="medium" />
      </div>

      <SectionLabel
        action="Export CSV"
        onAction={() => exportCSV("lead-geo.csv", geoLeads, GEO_COLS)}>
        Lead Demand by Destination Preference<SignalBadge level="strong" />
      </SectionLabel>

      <div style={{ overflowX:"auto", marginBottom:36 }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr>
              <TH>Requested Destination</TH>
              <TH right>Leads</TH>
              <TH right>Avg Score</TH>
              <TH right>High Value ≥60</TH>
              <TH right>Booked</TH>
              <TH right>Conversion</TH>
              <TH right>Top Budget</TH>
              <TH right>Top Guests</TH>
            </tr>
          </thead>
          <tbody>
            {load && <LoadingShimmer rows={8} cols={8} />}
            {!load && geoLeads.length === 0 && (
              <tr><td colSpan={8}><EmptyState message="No lead location data yet" /></td></tr>
            )}
            {!load && geoLeads.map((r, i) => (
              <tr key={r.location + i} style={{
                background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
              }}>
                <TD bold>{r.location}</TD>
                <TD right>
                  <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:70 }}>
                    <span>{fmtNum(r.lead_count)}</span>
                    <BarMeter value={Number(r.lead_count)} max={maxLeads} />
                  </div>
                </TD>
                <TD right gold={Number(r.avg_score) >= 60}>{r.avg_score}</TD>
                <TD right small muted={Number(r.high_value_count) === 0}>{fmtNum(r.high_value_count)}</TD>
                <TD right gold={Number(r.booked_count) > 0}>{fmtNum(r.booked_count)}</TD>
                <TD right small gold={Number(r.conversion_rate) > 10}>{fmtPct(r.conversion_rate)}</TD>
                <TD right small muted>{r.top_budget_band || "—"}</TD>
                <TD right small muted>{r.top_guest_band || "—"}</TD>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Wedding Date Pipeline Heatmap */}
      {pipeline.length > 0 && (
        <div style={{ marginBottom: 36 }}>
          <SectionLabel>Wedding Date Pipeline — Heatmap<SignalBadge level="strong" /></SectionLabel>
          <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.40)",
            marginBottom: 16, marginTop: -8 }}>
            Gold intensity = lead concentration. Reading tip: current enquiries typically reflect weddings 12–18 months ahead.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ fontFamily: NU, fontSize: 9, fontWeight: 700,
                    letterSpacing: "1px", textTransform: "uppercase",
                    color: "rgba(255,255,255,0.30)", padding: "6px 12px",
                    borderBottom: "1px solid rgba(255,255,255,0.07)", textAlign: "left" }}>Month</th>
                  {years.map(y => (
                    <th key={y} style={{ fontFamily: GD, fontSize: 13, fontWeight: 500,
                      fontStyle: "italic", color: GOLD,
                      padding: "6px 18px", textAlign: "center",
                      borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                      {y}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {MONTHS.map(month => (
                  <tr key={month}>
                    <td style={{ fontFamily: NU, fontSize: 11,
                      color: "rgba(255,255,255,0.50)",
                      padding: "4px 12px", whiteSpace: "nowrap",
                      borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      {month}
                    </td>
                    {years.map(year => {
                      const cell = pMap[`${year}__${month}`];
                      const cnt  = cell ? Number(cell.lead_count) : 0;
                      const intensity = cnt / maxPipe;
                      return (
                        <td key={year} style={{ padding: "3px 8px", textAlign: "center" }}>
                          <div title={cnt > 0 ? `${cnt} leads` : ""} style={{
                            width: 44, height: 30, borderRadius: 5, margin: "0 auto",
                            background: cnt > 0
                              ? `rgba(201,168,76,${0.12 + intensity * 0.80})`
                              : "rgba(255,255,255,0.03)",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            fontFamily: NU, fontSize: 10,
                            fontWeight: cnt > 0 ? 700 : 400,
                            color: cnt > 0 ? (intensity > 0.55 ? "#1a1714" : GOLD) : "rgba(255,255,255,0.12)",
                          }}>
                            {cnt > 0 ? cnt : ""}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Budget distribution */}
      {budgetEntries.length > 0 && (
        <div>
          <SectionLabel>Budget Band Distribution<SignalBadge level="medium" /></SectionLabel>
          <div style={{ display:"flex", flexDirection:"column", gap:8, maxWidth:520 }}>
            {budgetEntries.slice(0, 8).map(([band, count]) => (
              <div key={band} style={{ display:"flex", alignItems:"center", gap:12 }}>
                <div style={{ fontFamily:NU, fontSize:11,
                  color:"rgba(255,255,255,0.65)", width:160, flexShrink:0 }}>
                  {band}
                </div>
                <div style={{ flex:1 }}>
                  <BarMeter value={count} max={maxBudget} height={6} />
                </div>
                <div style={{ fontFamily:NU, fontSize:11, fontWeight:700,
                  color:GOLD, width:48, textAlign:"right" }}>
                  {fmtPct(count / total * 100, 0)}
                </div>
                <div style={{ fontFamily:NU, fontSize:10, color:"rgba(255,255,255,0.30)",
                  width:32, textAlign:"right" }}>
                  {count}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


// ── Trends & Pipeline Tab ─────────────────────────────────────────────────────
function TrendsTab({ from, to }) {
  const [monthly, setMonthly] = useState([]);
  const [appGeo,  setAppGeo]  = useState([]);
  const [load,    setLoad]    = useState(true);

  useEffect(() => {
    setLoad(true);
    Promise.all([
      supabase.rpc("get_destination_monthly_trend", { p_months_back: 12, p_top_n: 8 }),
      supabase.rpc("get_application_pipeline_geo",  { p_from: from, p_to: to }),
    ]).then(([t, a]) => {
      setMonthly(t.data || []);
      setAppGeo(a.data || []);
      setLoad(false);
    }).catch(() => setLoad(false));
  }, [from, to]);

  const trendCountries = [...new Set(monthly.map(r => r.country))];
  const trendMonths    = [...new Set(monthly.map(r => r.month_start))].sort();
  const trendMap = {};
  monthly.forEach(r => {
    if (!trendMap[r.country]) trendMap[r.country] = {};
    trendMap[r.country][r.month_start] = Number(r.page_views || 0);
  });
  const countryMax = {};
  trendCountries.forEach(c => {
    countryMax[c] = Math.max(...Object.values(trendMap[c] || {}), 1);
  });

  // App pipeline
  const appByCountry = {};
  appGeo.forEach(r => {
    const c = r.country;
    if (!appByCountry[c]) appByCountry[c] = { total: 0, approved: 0, new_count: 0, cats: {} };
    appByCountry[c].total    += Number(r.total || 0);
    appByCountry[c].approved += Number(r.approved || 0);
    appByCountry[c].new_count += Number(r.new_count || 0);
    appByCountry[c].cats[r.category] = Number(r.total || 0);
  });
  const appRows = Object.entries(appByCountry).sort((a, b) => b[1].total - a[1].total);
  const maxApp  = Math.max(...appRows.map(([, r]) => r.total), 1);

  function fmtMon(m) {
    if (!m) return "";
    return new Date(m).toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
  }

  return (
    <div>
      <DataGapWarning gaps={[
        "Monthly trend data becomes statistically meaningful after 3+ months of accumulation. Treat single-month spikes as provisional until confirmed by subsequent periods.",
        "Application pipeline geography relies on self-reported country fields in listing_applications.",
      ]} />

      {/* Monthly trend sparkbars */}
      <SectionLabel>12-Month Destination Demand Trend<SignalBadge level="medium" /></SectionLabel>
      <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.40)",
        marginBottom: 20, marginTop: -8 }}>
        Top 8 destinations by total traffic. Bar height = relative monthly pageviews within each row.
      </p>
      {load && <div style={{ height: 200, background: "rgba(255,255,255,0.03)",
        borderRadius: 10, animation: "shimmer 1.4s ease infinite" }} />}
      {!load && trendCountries.length === 0 && (
        <EmptyState message="Trend data builds over time as couples browse — check back in 30 days" />
      )}
      {!load && trendCountries.length > 0 && (
        <div style={{ overflowX: "auto", marginBottom: 36 }}>
          <table style={{ borderCollapse: "collapse", width: "100%" }}>
            <thead>
              <tr>
                <th style={{ fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: "1px", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.30)", padding: "6px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)", textAlign: "left",
                  width: 140 }}>
                  Destination
                </th>
                {trendMonths.map(m => (
                  <th key={m} style={{ fontFamily: NU, fontSize: 9, fontWeight: 600,
                    color: "rgba(255,255,255,0.28)", padding: "6px 4px",
                    textAlign: "center", whiteSpace: "nowrap",
                    borderBottom: "1px solid rgba(255,255,255,0.07)", minWidth: 36 }}>
                    {fmtMon(m)}
                  </th>
                ))}
                <th style={{ fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: "1px", textTransform: "uppercase",
                  color: "rgba(255,255,255,0.30)", padding: "6px 12px",
                  borderBottom: "1px solid rgba(255,255,255,0.07)",
                  textAlign: "right", whiteSpace: "nowrap" }}>
                  12m Total
                </th>
              </tr>
            </thead>
            <tbody>
              {trendCountries.map((country, ci) => {
                const data  = trendMap[country] || {};
                const total = Object.values(data).reduce((s, v) => s + v, 0);
                const max   = countryMax[country];
                return (
                  <tr key={country} style={{
                    background: ci % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
                  }}>
                    <td style={{ fontFamily: NU, fontSize: 12, fontWeight: 600,
                      color: "#F5F0E8", padding: "8px 12px", whiteSpace: "nowrap" }}>
                      <span style={{ marginRight: 8 }}>{flag(country?.slice(0,2))}</span>
                      {country}
                    </td>
                    {trendMonths.map(m => {
                      const v = data[m] || 0;
                      const h = max > 0 ? Math.max(Math.round((v / max) * 30), v > 0 ? 3 : 0) : 0;
                      return (
                        <td key={m} style={{ padding: "4px", textAlign: "center", verticalAlign: "bottom" }}>
                          <div style={{ display:"flex", flexDirection:"column",
                            alignItems:"center", justifyContent:"flex-end", height:34 }}>
                            {v > 0 ? (
                              <div title={String(v)} style={{
                                width: 22, height: h,
                                background: GOLD,
                                borderRadius: "2px 2px 0 0",
                                opacity: 0.65 + (v / max) * 0.35,
                              }} />
                            ) : (
                              <div style={{ width: 22, height: 2,
                                background: "rgba(255,255,255,0.06)", borderRadius: 1 }} />
                            )}
                          </div>
                        </td>
                      );
                    })}
                    <td style={{ fontFamily: NU, fontSize: 12, fontWeight: 700,
                      color: GOLD, padding: "8px 12px", textAlign: "right" }}>
                      {fmtNum(total)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Application pipeline */}
      {appRows.length > 0 && (
        <>
          <SectionLabel
            action="Export CSV"
            onAction={() => exportCSV("application-pipeline.csv", appRows.map(([c, r]) => ({
              country: c, total: r.total, approved: r.approved, pending: r.new_count,
              conversion: r.total > 0 ? (r.approved/r.total*100).toFixed(1)+"%" : "0%",
              categories: Object.entries(r.cats).map(([k,v]) => `${v} ${k}`).join(", "),
            })), [
              { label: "Country",    key: "country" },
              { label: "Total",      key: "total" },
              { label: "Approved",   key: "approved" },
              { label: "Pending",    key: "pending" },
              { label: "Conversion", key: "conversion" },
              { label: "Categories", key: "categories" },
            ])}>
            Vendor Application Pipeline<SignalBadge level="strong" />
          </SectionLabel>
          <p style={{ fontFamily: NU, fontSize: 12, color: "rgba(255,255,255,0.40)",
            marginBottom: 16, marginTop: -8 }}>
            Supply pipeline intelligence — where businesses are applying to join the platform.
          </p>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <TH>Country</TH>
                  <TH right>Applications</TH>
                  <TH right>Pending</TH>
                  <TH right>Approved</TH>
                  <TH right>Conversion</TH>
                  <TH>Category Breakdown</TH>
                </tr>
              </thead>
              <tbody>
                {appRows.map(([country, r], i) => {
                  const convPct = r.total > 0 ? (r.approved / r.total * 100).toFixed(1) : "0.0";
                  const cats = Object.entries(r.cats)
                    .sort((a,b) => b[1]-a[1])
                    .map(([c, n]) => `${n} ${c}`).join(" · ");
                  return (
                    <tr key={country} style={{
                      background: i % 2 === 0 ? "rgba(255,255,255,0.012)" : "transparent",
                    }}>
                      <TD bold>
                        <span style={{ marginRight: 8 }}>{flag(country?.slice(0,2))}</span>
                        {country}
                      </TD>
                      <TD right>
                        <div style={{ display:"flex", flexDirection:"column", gap:3, minWidth:80 }}>
                          <span style={{ fontWeight:700 }}>{r.total}</span>
                          <BarMeter value={r.total} max={maxApp} />
                        </div>
                      </TD>
                      <TD right muted small>{r.new_count}</TD>
                      <TD right gold={r.approved > 0}>{r.approved}</TD>
                      <TD right small gold={Number(convPct) > 50}>{convPct}%</TD>
                      <TD muted small>{cats || "—"}</TD>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}


// ── Main Module ───────────────────────────────────────────────────────────────
// This module is always dark — it is a data intelligence tool, not a themed UI panel.
const MI_BG     = "#100e0c";
const MI_BORDER = "rgba(255,255,255,0.08)";
const MI_TEXT   = "#F5F0E8";

export default function MarketIntelligenceModule({ C }) {
  const [tab,    setTab]    = useState("overview");
  const [range,  setRange]  = useState("30d");
  const [stamp,  setStamp]  = useState(Date.now());

  const days  = RANGES.find(r => r.key === range)?.days || 30;
  const from  = new Date(Date.now() - days * 86_400_000).toISOString();
  const to    = new Date().toISOString();
  const label = RANGES.find(r => r.key === range)?.label || "30 Days";

  const tabKey = `${tab}__${range}__${stamp}`;

  return (
    <div style={{ minHeight: "100%", background: MI_BG, color: MI_TEXT, fontFamily: NU }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${MI_BORDER}`,
        padding: "24px 28px 20px",
        display: "flex", alignItems: "flex-start",
        justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: "3px",
            textTransform: "uppercase", color: GOLD, marginBottom: 6 }}>
            ✦ Intelligence Centre
          </div>
          <h2 style={{ fontFamily: GD, fontSize: 22, fontWeight: 600,
            fontStyle: "italic", color: MI_TEXT, margin: "0 0 4px" }}>
            Market Intelligence
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12,
            color: "rgba(255,255,255,0.35)", margin: 0 }}>
            Destination demand · audience origins · supply gaps · lead intelligence · trend analysis
          </p>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          {RANGES.map(r => (
            <button key={r.key} onClick={() => setRange(r.key)} style={{
              fontFamily: NU, fontSize: 11, fontWeight: 600,
              padding: "5px 13px",
              border: `1px solid ${range === r.key ? GOLD : MI_BORDER}`,
              background: range === r.key ? GOLD_DIM : "transparent",
              color: range === r.key ? GOLD : "rgba(255,255,255,0.40)",
              borderRadius: 30, cursor: "pointer", transition: "all 0.15s",
            }}>
              {r.label}
            </button>
          ))}
          <button onClick={() => setStamp(Date.now())} style={{
            fontFamily: NU, fontSize: 11,
            padding: "5px 14px",
            border: `1px solid ${MI_BORDER}`, background: "transparent",
            color: "rgba(255,255,255,0.40)", borderRadius: 30, cursor: "pointer",
          }}>
            ↻ Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:0, borderBottom:`1px solid ${MI_BORDER}`,
        overflowX:"auto", scrollbarWidth:"none" }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            padding: "12px 20px",
            border: "none",
            borderBottom: `2px solid ${tab === t.key ? GOLD : "transparent"}`,
            background: "transparent",
            color: tab === t.key ? GOLD : "rgba(255,255,255,0.40)",
            cursor: "pointer", transition: "all 0.15s",
            whiteSpace: "nowrap",
            display: "flex", alignItems: "center", gap: 6,
          }}>
            <span style={{ fontSize: 12 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: "28px" }} key={tabKey}>
        {tab === "overview"      && <OverviewTab      from={from} to={to} rangeLabel={label} />}
        {tab === "destinations"  && <DestinationsTab  from={from} to={to} />}
        {tab === "audience"      && <AudienceTab      from={from} to={to} />}
        {tab === "gaps"          && <GapsTab          from={from} to={to} />}
        {tab === "leads"         && <LeadsTab         from={from} to={to} />}
        {tab === "trends"        && <TrendsTab        from={from} to={to} />}
      </div>

    </div>
  );
}
