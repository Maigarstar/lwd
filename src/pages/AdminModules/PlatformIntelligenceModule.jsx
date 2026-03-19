// ─── src/pages/AdminModules/PlatformIntelligenceModule.jsx ───────────────────
// Platform Intelligence — outbound click analytics hub.
// Holistic (platform overview) → granular (per-venue breakdown).
//
// Sections:
//   Row 1 — Summary KPI cards (total, website, social, other)
//   Row 2 — Trend sparkline (30d timeline) + Link Type distribution donut
//   Row 3 — Venue Leaderboard
//   Row 4 — High-Intent Signals (top 3 venues, last 7d)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  fetchClickSummary,
  fetchClickLeaderboard,
  fetchClickTimeline,
  fetchVenueClicks,
} from '../../services/adminOutboundClicksService';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function pct(part, total) {
  if (!total) return '0%';
  return `${Math.round((part / total) * 100)}%`;
}

const LINK_TYPE_LABELS = {
  website:   'Website',
  instagram: 'Instagram',
  facebook:  'Facebook',
  tiktok:    'TikTok',
  pinterest: 'Pinterest',
  twitter:   'X / Twitter',
  youtube:   'YouTube',
  linkedin:  'LinkedIn',
  whatsapp:  'WhatsApp',
  email:     'Email',
  brochure:  'Brochure',
  other:     'Other',
};

const LINK_TYPE_COLOURS = {
  website:   '#b8a05a',
  instagram: '#e1306c',
  facebook:  '#1877f2',
  tiktok:    '#69c9d0',
  pinterest: '#e60023',
  twitter:   '#1da1f2',
  youtube:   '#ff0000',
  linkedin:  '#0a66c2',
  whatsapp:  '#25d366',
  email:     '#94a3b8',
  brochure:  '#a78bfa',
  other:     '#64748b',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function KpiCard({ label, value, sub, accent, C }) {
  return (
    <div style={{
      background: C.card, border: `1px solid ${C.border}`,
      borderRadius: 6, padding: '22px 20px',
      borderTop: `3px solid ${accent || C.gold}`,
    }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 30, color: C.off, fontWeight: 400, marginBottom: 4 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>{sub}</div>
      )}
    </div>
  );
}

function Sparkline({ timeline, C }) {
  if (!timeline || timeline.length === 0) return null;
  const maxVal = Math.max(...timeline.map(d => d.count), 1);
  const W = 100;
  const H = 48;
  const pts = timeline.map((d, i) => {
    const x = (i / (timeline.length - 1)) * W;
    const y = H - (d.count / maxVal) * (H - 6);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
      <polyline
        points={pts}
        fill="none"
        stroke={C.gold}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <polyline
        points={`0,${H} ${pts} ${W},${H}`}
        fill={`${C.gold}18`}
        stroke="none"
      />
    </svg>
  );
}

function TrendCard({ timeline, total, days, C }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 20px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>
          Click Trend
        </div>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>Last {days}d</div>
      </div>
      <div style={{ fontFamily: GD, fontSize: 22, color: C.off, marginBottom: 12 }}>{fmt(total)} outbound</div>
      <Sparkline timeline={timeline} C={C} />
      {timeline && timeline.length > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>{timeline[0]?.date}</span>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>{timeline[timeline.length - 1]?.date}</span>
        </div>
      )}
    </div>
  );
}

function DistributionCard({ byLinkType, total, C }) {
  if (!byLinkType || !total) return null;

  const sorted = Object.entries(byLinkType)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 20px', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 16 }}>
        Link Type Distribution
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {sorted.map(([type, count]) => {
          const barPct = total ? (count / total) * 100 : 0;
          const colour = LINK_TYPE_COLOURS[type] || LINK_TYPE_COLOURS.other;
          return (
            <div key={type}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.off }}>{LINK_TYPE_LABELS[type] || type}</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{count} · {pct(count, total)}</span>
              </div>
              <div style={{ height: 4, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${barPct}%`, background: colour, borderRadius: 2, transition: 'width 0.6s ease' }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LeaderboardRow({ rank, entry, selected, onSelect, C }) {
  const isTop = rank <= 3;
  const rankColour = rank === 1 ? C.gold : rank === 2 ? '#94a3b8' : rank === 3 ? '#cd7f32' : C.grey2;
  return (
    <div
      onClick={() => onSelect(entry)}
      style={{
        display: 'grid', gridTemplateColumns: '32px 1fr auto auto',
        alignItems: 'center', gap: 12,
        padding: '12px 16px',
        borderBottom: `1px solid ${C.border}`,
        cursor: 'pointer',
        background: selected ? `${C.gold}08` : 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={e => { if (!selected) e.currentTarget.style.background = `${C.border}`; }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.background = 'transparent'; }}
    >
      {/* Rank */}
      <span style={{ fontFamily: GD, fontSize: isTop ? 16 : 13, color: rankColour, fontWeight: 400, textAlign: 'center' }}>
        {rank}
      </span>
      {/* Name */}
      <div>
        <div style={{ fontFamily: NU, fontSize: 13, color: C.off, fontWeight: 400 }}>
          {entry.name || entry.entityId?.slice(0, 8) + '…' || '—'}
        </div>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: 'capitalize' }}>
          {entry.entityType}
        </div>
      </div>
      {/* Count */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: GD, fontSize: 20, color: C.gold, fontWeight: 400 }}>{fmt(entry.count)}</div>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>clicks</div>
      </div>
      {/* Expand arrow */}
      <div style={{ color: selected ? C.gold : C.grey, fontSize: 12, transition: 'transform 0.2s', transform: selected ? 'rotate(90deg)' : 'none' }}>
        ›
      </div>
    </div>
  );
}

function VenueIntelPanel({ entry, days, C }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchVenueClicks(entry.entityId, days).then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [entry.entityId, days]);

  if (loading) {
    return (
      <div style={{ padding: '20px 16px 20px 48px', background: `${C.gold}05`, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>Loading breakdown…</div>
      </div>
    );
  }

  if (!data) return null;

  const byType = data.byLinkType || {};
  const sorted = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  const peak = data.timeline ? data.timeline.reduce((m, d) => d.count > m.count ? d : m, { count: 0 }) : null;

  return (
    <div style={{
      padding: '20px 20px 20px 48px',
      background: `${C.gold}05`,
      borderBottom: `1px solid ${C.border}`,
      borderLeft: `3px solid ${C.gold}`,
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Link type breakdown */}
        <div>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 10 }}>
            By Link Type
          </div>
          {sorted.length === 0 && (
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>No breakdown available</div>
          )}
          {sorted.map(([type, count]) => (
            <div key={type} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.off }}>
                <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: LINK_TYPE_COLOURS[type] || C.grey, marginRight: 6 }} />
                {LINK_TYPE_LABELS[type] || type}
              </span>
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Mini timeline */}
        <div>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 10 }}>
            Daily Activity ({days}d)
          </div>
          <Sparkline timeline={data.timeline} C={C} />
          {peak && peak.count > 0 && (
            <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 6 }}>
              Peak: {peak.date} — {peak.count} clicks
            </div>
          )}
          {data.total != null && (
            <div style={{ fontFamily: GD, fontSize: 18, color: C.off, marginTop: 8 }}>
              {fmt(data.total)} <span style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>total</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LeaderboardCard({ days, C }) {
  const [entityType, setEntityType] = useState('venue');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setSelected(null);
    const res = await fetchClickLeaderboard({ days, entityType, limit: 10 });
    setData(res);
    setLoading(false);
  }, [days, entityType]);

  useEffect(() => { load(); }, [load]);

  const handleSelect = (entry) => {
    setSelected(prev => prev?.entityId === entry.entityId ? null : entry);
  };

  const leaderboard = data?.leaderboard || [];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>
          Top Venues by Outbound Clicks
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['venue', 'vendor', 'all'].map(t => (
            <button
              key={t}
              onClick={() => setEntityType(t)}
              style={{
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'capitalize',
                padding: '4px 10px', borderRadius: 3, cursor: 'pointer',
                border: `1px solid ${entityType === t ? C.gold : C.border}`,
                background: entityType === t ? `${C.gold}18` : 'transparent',
                color: entityType === t ? C.gold : C.grey,
                transition: 'all 0.15s',
              }}
            >{t}</button>
          ))}
        </div>
      </div>

      {/* Column headers */}
      <div style={{ display: 'grid', gridTemplateColumns: '32px 1fr auto auto', gap: 12, padding: '8px 16px', borderBottom: `1px solid ${C.border}` }}>
        {['#', 'Venue', 'Clicks', ''].map(h => (
          <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey2, fontWeight: 600 }}>{h}</span>
        ))}
      </div>

      {/* Rows */}
      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', fontFamily: NU, fontSize: 12, color: C.grey }}>
          Loading leaderboard…
        </div>
      )}
      {!loading && leaderboard.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontFamily: GD, fontSize: 15, color: C.off, marginBottom: 6 }}>No click data yet</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Outbound clicks will appear here once venues receive traffic.</div>
        </div>
      )}
      {!loading && leaderboard.map((entry, i) => (
        <div key={entry.entityId}>
          <LeaderboardRow
            rank={i + 1}
            entry={entry}
            selected={selected?.entityId === entry.entityId}
            onSelect={handleSelect}
            C={C}
          />
          {selected?.entityId === entry.entityId && (
            <VenueIntelPanel entry={entry} days={days} C={C} />
          )}
        </div>
      ))}
    </div>
  );
}

function HighIntentSignals({ C }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchClickLeaderboard({ days: 7, entityType: 'venue', limit: 3 }).then(res => {
      if (!cancelled) { setData(res); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, []);

  const leaders = data?.leaderboard || [];

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 16 }}>
        High-Intent Signals · Last 7 Days
      </div>
      {loading && <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>}
      {!loading && leaders.length === 0 && (
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>No signals detected yet.</div>
      )}
      {!loading && leaders.map((entry, i) => {
        const topType = entry.linkTypes ? Object.entries(entry.linkTypes).sort((a, b) => b[1] - a[1])[0] : null;
        const signalColour = i === 0 ? C.gold : i === 1 ? C.grey : C.grey2;
        return (
          <div key={entry.entityId} style={{
            display: 'flex', alignItems: 'center', gap: 14,
            padding: '12px 0', borderBottom: `1px solid ${C.border}`,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%',
              background: `${signalColour}20`,
              border: `1px solid ${signalColour}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: GD, fontSize: 14, color: signalColour, flexShrink: 0,
            }}>
              {i + 1}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: NU, fontSize: 13, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.name || 'Unknown Venue'}
              </div>
              {topType && (
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginTop: 2 }}>
                  Primary: {LINK_TYPE_LABELS[topType[0]] || topType[0]} · {topType[1]} clicks
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: GD, fontSize: 20, color: C.gold }}>{fmt(entry.count)}</div>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>clicks</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Days filter pill ──────────────────────────────────────────────────────────

function DaysPicker({ days, onChange, C }) {
  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[7, 14, 30, 90].map(d => (
        <button
          key={d}
          onClick={() => onChange(d)}
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.08em',
            padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
            border: `1px solid ${days === d ? C.gold : C.border}`,
            background: days === d ? `${C.gold}18` : 'transparent',
            color: days === d ? C.gold : C.grey,
            transition: 'all 0.15s',
          }}
        >{d}d</button>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PlatformIntelligenceModule({ C }) {
  const [days, setDays] = useState(30);
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingSummary(true);
    fetchClickSummary(days).then(d => {
      if (!cancelled) { setSummary(d); setLoadingSummary(false); }
    });
    return () => { cancelled = true; };
  }, [days]);

  useEffect(() => {
    let cancelled = false;
    setLoadingTimeline(true);
    fetchClickTimeline(days).then(d => {
      if (!cancelled) { setTimeline(d); setLoadingTimeline(false); }
    });
    return () => { cancelled = true; };
  }, [days]);

  const total    = summary?.total    ?? null;
  const website  = summary?.summary?.website ?? null;
  const social   = summary?.summary?.social  ?? null;
  const other    = summary?.summary?.other   ?? null;

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 22, color: C.off, margin: 0, fontWeight: 400 }}>
            Platform Intelligence
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '4px 0 0' }}>
            Outbound click behaviour across all venues and vendors
          </p>
        </div>
        <DaysPicker days={days} onChange={setDays} C={C} />
      </div>

      {/* ── Row 1: KPI cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <KpiCard
          label="Total Outbound Clicks"
          value={loadingSummary ? '…' : fmt(total)}
          sub={`Last ${days} days`}
          accent={C.gold}
          C={C}
        />
        <KpiCard
          label="Website Clicks"
          value={loadingSummary ? '…' : fmt(website)}
          sub={total ? `${pct(website, total)} of total` : ''}
          accent="#b8a05a"
          C={C}
        />
        <KpiCard
          label="Social Clicks"
          value={loadingSummary ? '…' : fmt(social)}
          sub={total ? `${pct(social, total)} of total` : ''}
          accent="#e1306c"
          C={C}
        />
        <KpiCard
          label="Other Clicks"
          value={loadingSummary ? '…' : fmt(other)}
          sub={total ? `${pct(other, total)} of total` : ''}
          accent={C.grey}
          C={C}
        />
      </div>

      {/* ── Row 2: Trend + Distribution ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginBottom: 20 }}>
        {loadingTimeline
          ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading trend…</span>
            </div>
          : <TrendCard
              timeline={timeline?.timeline || []}
              total={timeline?.total ?? 0}
              days={days}
              C={C}
            />
        }
        {loadingSummary
          ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading distribution…</span>
            </div>
          : <DistributionCard
              byLinkType={summary?.byLinkType || {}}
              total={total || 0}
              C={C}
            />
        }
      </div>

      {/* ── Row 3: Leaderboard ── */}
      <div style={{ marginBottom: 20 }}>
        <LeaderboardCard days={days} C={C} />
      </div>

      {/* ── Row 4: High-Intent + EntityType Split ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <HighIntentSignals C={C} />

        {/* Entity type breakdown */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 16 }}>
            By Entity Type
          </div>
          {loadingSummary && (
            <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>
          )}
          {!loadingSummary && summary?.byEntityType && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.entries(summary.byEntityType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                const barPct = total ? (count / total) * 100 : 0;
                return (
                  <div key={type}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontFamily: NU, fontSize: 12, color: C.off, textTransform: 'capitalize' }}>{type}</span>
                      <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>{fmt(count)} · {pct(count, total)}</span>
                    </div>
                    <div style={{ height: 5, background: C.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${barPct}%`, background: C.gold, borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {!loadingSummary && !summary && (
            <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>No data — deploy the edge function to start tracking.</div>
          )}
        </div>
      </div>

    </div>
  );
}
