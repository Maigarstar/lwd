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
import {
  fetchEventSummary,
  fetchSearchQueries,
  fetchEnquiryFunnel,
  fetchShortlistTop,
  fetchCompareTop,
} from '../../services/adminUserEventsService';

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

// ── Search Intelligence panel ─────────────────────────────────────────────────

function SearchIntelligencePanel({ days, C }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchSearchQueries(days, 20).then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [days]);

  if (loading) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '32px', textAlign: 'center' }}>
        <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading search data…</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '32px', textAlign: 'center' }}>
        <div style={{ fontFamily: GD, fontSize: 15, color: C.off, marginBottom: 6 }}>No search data yet</div>
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Deploy the edge function and run the migration to start tracking searches.</div>
      </div>
    );
  }

  const maxCount = data.topQueries?.[0]?.count || 1;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

      {/* Summary KPIs */}
      <div style={{ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard label="Total Searches" value={fmt(data.totalSearches)} sub={`Last ${days}d`} accent={C.gold} C={C} />
        <KpiCard label="Zero-Result Searches" value={fmt(data.zeroResultCount)} sub={`${data.zeroResultRate ?? 0}% of searches`} accent="#f59e0b" C={C} />
        <KpiCard label="Unique Queries" value={fmt(data.topQueries?.length)} sub="tracked" accent={C.grey} C={C} />
        <KpiCard label="Search→Zero Rate" value={`${data.zeroResultRate ?? 0}%`} sub="demand you don't serve yet" accent={data.zeroResultRate > 20 ? '#ef4444' : C.gold} C={C} />
      </div>

      {/* Top queries */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>Top Search Queries</div>
        </div>
        {(!data.topQueries || data.topQueries.length === 0) && (
          <div style={{ padding: '24px', fontFamily: NU, fontSize: 12, color: C.grey }}>No queries yet.</div>
        )}
        {data.topQueries?.map((q, i) => (
          <div key={q.query} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
            <span style={{ fontFamily: GD, fontSize: 13, color: C.grey2, minWidth: 20 }}>{i + 1}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                {q.query || '(blank — filter only)'}
              </div>
              <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(q.count / maxCount) * 100}%`, background: C.gold, borderRadius: 2 }} />
              </div>
            </div>
            <span style={{ fontFamily: NU, fontSize: 11, color: C.grey, flexShrink: 0 }}>{q.count}×</span>
          </div>
        ))}
      </div>

      {/* Zero-result queries — demand gap */}
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#f59e0b', fontWeight: 600 }}>
            Demand Gaps · Zero-Result Queries
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>
            What people want that you don't have yet
          </div>
        </div>
        {(!data.topZeroResults || data.topZeroResults.length === 0) && (
          <div style={{ padding: '24px', fontFamily: NU, fontSize: 12, color: C.grey }}>No zero-result searches yet — that's a good sign.</div>
        )}
        {data.topZeroResults?.map((q, i) => (
          <div key={q.query} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>
                {q.query || '(blank)'}
              </span>
            </div>
            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: '#f59e0b', flexShrink: 0 }}>{q.count}×</span>
          </div>
        ))}
      </div>

    </div>
  );
}

// ── Enquiry Funnel panel ──────────────────────────────────────────────────────

function EnquiryFunnelPanel({ days, C }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchEnquiryFunnel(days, 10).then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [days]);

  if (loading) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '32px', textAlign: 'center' }}>
        <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading funnel data…</span>
      </div>
    );
  }

  const platform = data?.platform;
  const entities = data?.topEntities || [];
  const maxStarts = entities[0]?.starts || 1;

  return (
    <div>
      {/* Platform funnel KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
        <KpiCard label="Enquiries Started" value={platform ? fmt(platform.starts) : '—'} sub={`Last ${days}d`} accent={C.gold} C={C} />
        <KpiCard label="Enquiries Submitted" value={platform ? fmt(platform.submits) : '—'} sub={`Last ${days}d`} accent="#22c55e" C={C} />
        <KpiCard
          label="Conversion Rate"
          value={platform?.conversionRate != null ? `${platform.conversionRate}%` : '—'}
          sub="started → submitted"
          accent={platform?.conversionRate >= 50 ? '#22c55e' : platform?.conversionRate >= 25 ? C.gold : '#ef4444'}
          C={C}
        />
      </div>

      {/* Funnel visualisation */}
      {platform && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '20px', marginBottom: 16 }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 14 }}>
            Conversion Funnel
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, height: 80 }}>
            {/* Starts bar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: GD, fontSize: 18, color: C.gold }}>{fmt(platform.starts)}</div>
              <div style={{ width: '100%', height: 40, background: `${C.gold}30`, borderRadius: 3, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: '100%', background: C.gold, borderRadius: 3 }} />
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textAlign: 'center' }}>Started</div>
            </div>
            {/* Arrow */}
            <div style={{ fontFamily: NU, fontSize: 18, color: C.grey2, paddingBottom: 20 }}>→</div>
            {/* Submits bar */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: GD, fontSize: 18, color: '#22c55e' }}>{fmt(platform.submits)}</div>
              <div style={{ width: '100%', height: 40, background: '#22c55e20', borderRadius: 3, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: platform.starts ? `${(platform.submits / platform.starts) * 100}%` : '0%', background: '#22c55e', borderRadius: 3, transition: 'height 0.6s ease' }} />
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textAlign: 'center' }}>Submitted</div>
            </div>
            {/* Drop off */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ fontFamily: GD, fontSize: 18, color: '#ef4444' }}>{fmt((platform.starts || 0) - (platform.submits || 0))}</div>
              <div style={{ width: '100%', height: 40, background: '#ef444420', borderRadius: 3, display: 'flex', alignItems: 'flex-end' }}>
                <div style={{ width: '100%', height: platform.starts ? `${((platform.starts - platform.submits) / platform.starts) * 100}%` : '0%', background: '#ef4444', borderRadius: 3, transition: 'height 0.6s ease' }} />
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textAlign: 'center' }}>Dropped</div>
            </div>
          </div>
        </div>
      )}

      {/* Per-entity funnel */}
      {entities.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>Per Venue / Vendor Funnel</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px', gap: 12, padding: '8px 20px', borderBottom: `1px solid ${C.border}` }}>
            {['Entity', 'Started', 'Submitted', 'Rate'].map(h => (
              <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase', color: C.grey2, fontWeight: 600 }}>{h}</span>
            ))}
          </div>
          {entities.map(e => (
            <div key={e.entityId} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 60px 70px', gap: 12, padding: '12px 20px', borderBottom: `1px solid ${C.border}`, alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{e.name || e.entityId?.slice(0, 12) + '…'}</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, textTransform: 'capitalize' }}>{e.entityType}</div>
                <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(e.starts / maxStarts) * 100}%`, background: C.gold, borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontFamily: GD, fontSize: 16, color: C.off }}>{e.starts}</span>
              <span style={{ fontFamily: GD, fontSize: 16, color: '#22c55e' }}>{e.submits}</span>
              <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: e.conversionRate >= 50 ? '#22c55e' : e.conversionRate >= 25 ? C.gold : C.grey }}>
                {e.conversionRate != null ? `${e.conversionRate}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      )}

      {!data && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '32px', textAlign: 'center' }}>
          <div style={{ fontFamily: GD, fontSize: 15, color: C.off, marginBottom: 6 }}>No enquiry data yet</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Enquiry tracking will appear here once users start submitting forms.</div>
        </div>
      )}
    </div>
  );
}

// ── Shortlist Intelligence panel ──────────────────────────────────────────────

function ShortlistPanel({ days, C }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchShortlistTop(days, 10).then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [days]);

  const leaderboard = data?.leaderboard || [];
  const maxAdds = leaderboard[0]?.adds || 1;

  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>Most Shortlisted</div>
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>Consideration signal — who couples are seriously evaluating</div>
      </div>

      {loading && <div style={{ padding: '24px', textAlign: 'center', fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>}

      {!loading && leaderboard.length === 0 && (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <div style={{ fontFamily: GD, fontSize: 15, color: C.off, marginBottom: 6 }}>No shortlist data yet</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Shortlist actions will appear here once users start saving venues.</div>
        </div>
      )}

      {!loading && leaderboard.map((entry, i) => (
        <div key={entry.entityId} style={{
          display: 'grid', gridTemplateColumns: '28px 1fr 50px 50px 50px',
          alignItems: 'center', gap: 12, padding: '12px 20px',
          borderBottom: `1px solid ${C.border}`,
        }}>
          <span style={{ fontFamily: GD, fontSize: i < 3 ? 15 : 12, color: i === 0 ? C.gold : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : C.grey2 }}>
            {i + 1}
          </span>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: NU, fontSize: 12, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {entry.name || entry.entityId?.slice(0, 12) + '…'}
            </div>
            <div style={{ height: 3, background: C.border, borderRadius: 2, marginTop: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(entry.adds / maxAdds) * 100}%`, background: C.gold, borderRadius: 2 }} />
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: GD, fontSize: 16, color: '#22c55e' }}>{entry.adds}</div>
            <div style={{ fontFamily: NU, fontSize: 9, color: C.grey }}>added</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: GD, fontSize: 16, color: '#ef4444' }}>{entry.removes}</div>
            <div style={{ fontFamily: NU, fontSize: 9, color: C.grey }}>removed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: GD, fontSize: 16, color: C.gold }}>{Math.max(0, entry.net)}</div>
            <div style={{ fontFamily: NU, fontSize: 9, color: C.grey }}>net</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Compare Intelligence panel ────────────────────────────────────────────────

function CompareIntelPanel({ days, C }) {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchCompareTop(days, 10).then(d => {
      if (!cancelled) { setData(d); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [days]);

  if (loading) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '32px', textAlign: 'center' }}>
        <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading compare data…</span>
      </div>
    );
  }

  if (!data || (!data.mostCompared?.length && !data.topPairs?.length)) {
    return (
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '40px', textAlign: 'center' }}>
        <div style={{ fontFamily: GD, fontSize: 15, color: C.off, marginBottom: 8 }}>No compare data yet</div>
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Compare behaviour will appear here once users start comparing venues.</div>
      </div>
    );
  }

  const maxAdds   = data.mostCompared?.[0]?.adds || 1;
  const maxPairs  = data.topPairs?.[0]?.count || 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Summary KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        <KpiCard
          label="Most Compared Venue"
          value={data.mostCompared?.[0]?.name || data.mostCompared?.[0]?.venueId?.slice(0, 8) || '—'}
          sub={data.mostCompared?.[0]?.adds ? `${data.mostCompared[0].adds} compare adds` : 'no data'}
          accent={C.gold} C={C}
        />
        <KpiCard
          label="Top Pair"
          value={data.topPairs?.[0] ? `${data.topPairs[0].nameA?.split(' ')[0] || '?'} × ${data.topPairs[0].nameB?.split(' ')[0] || '?'}` : '—'}
          sub={data.topPairs?.[0]?.count ? `Compared ${data.topPairs[0].count}×` : 'no data'}
          accent="#a78bfa" C={C}
        />
        <KpiCard
          label="Unique Venues Compared"
          value={fmt(data.mostCompared?.length)}
          sub={`Last ${days}d`}
          accent="#60a5fa" C={C}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Most compared venues */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600 }}>
              Most Compared Venues
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>
              Venues added to compare bar most often
            </div>
          </div>
          {data.mostCompared?.slice(0, 8).map((v, i) => (
            <div key={v.venueId} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderBottom: `1px solid ${C.border}` }}>
              <span style={{ fontFamily: GD, fontSize: i < 3 ? 15 : 12, color: i === 0 ? C.gold : i === 1 ? '#94a3b8' : i === 2 ? '#cd7f32' : C.grey2, minWidth: 20, textAlign: 'center' }}>
                {i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NU, fontSize: 12, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>
                  {v.name || v.venueId?.slice(0, 14) + '…'}
                </div>
                <div style={{ height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${(v.adds / maxAdds) * 100}%`, background: C.gold, borderRadius: 2 }} />
                </div>
              </div>
              <span style={{ fontFamily: GD, fontSize: 18, color: C.gold, flexShrink: 0 }}>{v.adds}</span>
            </div>
          ))}
        </div>

        {/* Top compare pairs */}
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#a78bfa', fontWeight: 600 }}>
              Top Compared Pairs
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>
              Head-to-head comparisons — competitive landscape
            </div>
          </div>
          {(!data.topPairs || data.topPairs.length === 0) && (
            <div style={{ padding: '24px', fontFamily: NU, fontSize: 12, color: C.grey }}>No pair data yet.</div>
          )}
          {data.topPairs?.slice(0, 8).map((pair, i) => (
            <div key={`${pair.venueAId}-${pair.venueBId}`} style={{ padding: '12px 20px', borderBottom: `1px solid ${C.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontFamily: GD, fontSize: 12, color: C.grey2, minWidth: 20 }}>{i + 1}</span>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '42%' }}>
                    {pair.nameA || pair.venueAId?.slice(0, 8)}
                  </span>
                  <span style={{ fontFamily: NU, fontSize: 10, color: '#a78bfa', flexShrink: 0 }}>vs</span>
                  <span style={{ fontFamily: NU, fontSize: 11, color: C.off, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '42%' }}>
                    {pair.nameB || pair.venueBId?.slice(0, 8)}
                  </span>
                </div>
                <span style={{ fontFamily: GD, fontSize: 16, color: '#a78bfa', flexShrink: 0 }}>{pair.count}×</span>
              </div>
              <div style={{ marginLeft: 28, height: 3, background: C.border, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(pair.count / maxPairs) * 100}%`, background: '#a78bfa', borderRadius: 2 }} />
              </div>
            </div>
          ))}
        </div>

      </div>

      {/* Per-venue competitor table */}
      {data.venueCompetitors?.length > 0 && (
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: `1px solid ${C.border}` }}>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#60a5fa', fontWeight: 600 }}>
              Per-Venue Competitor Intelligence
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, marginTop: 4 }}>
              Which venues users compare against each property
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {data.venueCompetitors.slice(0, 6).map(v => (
              <div key={v.venueId} style={{ padding: '14px 20px', borderBottom: `1px solid ${C.border}` }}>
                <div style={{ fontFamily: NU, fontSize: 12, color: C.off, fontWeight: 600, marginBottom: 8 }}>
                  {v.venueName || v.venueId?.slice(0, 16) + '…'}
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {v.topCompetitors.map((rival, ri) => (
                    <div key={rival.rivalId} style={{
                      display: 'flex', alignItems: 'center', gap: 5,
                      padding: '3px 10px',
                      background: ri === 0 ? `${C.gold}14` : `${C.border}`,
                      border: `1px solid ${ri === 0 ? C.gold : C.border}`,
                      borderRadius: 3,
                    }}>
                      <span style={{ fontFamily: NU, fontSize: 11, color: ri === 0 ? C.gold : C.off }}>
                        {rival.name || rival.rivalId?.slice(0, 8)}
                      </span>
                      <span style={{ fontFamily: NU, fontSize: 10, color: C.grey }}>{rival.count}×</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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

// ── Event summary KPIs bar ────────────────────────────────────────────────────

function EventSummaryBar({ days, C }) {
  const [data, setData] = useState(null);

  useEffect(() => {
    let cancelled = false;
    fetchEventSummary(days).then(d => { if (!cancelled) setData(d); });
    return () => { cancelled = true; };
  }, [days]);

  const h = data?.highlights;
  const cards = [
    { label: 'Profile Views',      value: fmt(h?.profileViews),          accent: '#60a5fa' },
    { label: 'Searches',           value: fmt(h?.searches),              accent: '#a78bfa' },
    { label: 'Enquiry Starts',     value: fmt(h?.enquiryStarts),         accent: C.gold },
    { label: 'Enquiry Rate',       value: h?.enquiryConversionRate != null ? `${h.enquiryConversionRate}%` : '—', accent: h?.enquiryConversionRate >= 50 ? '#22c55e' : C.gold },
    { label: 'Shortlist Adds',     value: fmt(h?.shortlistAdds),         accent: '#22c55e' },
    { label: 'Compare Adds',       value: fmt(h?.compareAdds),           accent: '#a78bfa' },
    { label: 'Aura Queries',       value: fmt(h?.auraQueries),           accent: '#f59e0b' },
    { label: 'Returns',            value: fmt(h?.returnsAfterOutbound),  accent: '#e1306c' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: 12, marginBottom: 20 }}>
      {cards.map(card => (
        <div key={card.label} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '14px 16px', borderTop: `3px solid ${card.accent}` }}>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.grey, fontWeight: 600, marginBottom: 6 }}>{card.label}</div>
          <div style={{ fontFamily: GD, fontSize: 24, color: C.off }}>{data ? card.value : '…'}</div>
        </div>
      ))}
    </div>
  );
}

// ── Tab system ────────────────────────────────────────────────────────────────

const TABS = [
  { key: 'outbound',  label: 'Outbound Clicks' },
  { key: 'search',    label: 'Search Intelligence' },
  { key: 'enquiry',   label: 'Enquiry Funnel' },
  { key: 'shortlist', label: 'Shortlist Signals' },
  { key: 'compare',   label: 'Compare Intelligence' },
];

function TabBar({ active, onChange, C }) {
  return (
    <div style={{ display: 'flex', gap: 0, borderBottom: `1px solid ${C.border}`, marginBottom: 24 }}>
      {TABS.map(tab => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            padding: '10px 20px', cursor: 'pointer',
            background: 'transparent', border: 'none',
            borderBottom: `2px solid ${active === tab.key ? C.gold : 'transparent'}`,
            color: active === tab.key ? C.gold : C.grey,
            transition: 'color 0.15s, border-color 0.15s',
          }}
        >{tab.label}</button>
      ))}
    </div>
  );
}

// ── Outbound tab content ──────────────────────────────────────────────────────

function OutboundTab({ days, C }) {
  const [summary, setSummary] = useState(null);
  const [timeline, setTimeline] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [loadingTimeline, setLoadingTimeline] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoadingSummary(true);
    fetchClickSummary(days).then(d => { if (!cancelled) { setSummary(d); setLoadingSummary(false); } });
    return () => { cancelled = true; };
  }, [days]);

  useEffect(() => {
    let cancelled = false;
    setLoadingTimeline(true);
    fetchClickTimeline(days).then(d => { if (!cancelled) { setTimeline(d); setLoadingTimeline(false); } });
    return () => { cancelled = true; };
  }, [days]);

  const total   = summary?.total ?? null;
  const website = summary?.summary?.website ?? null;
  const social  = summary?.summary?.social  ?? null;
  const other   = summary?.summary?.other   ?? null;

  return (
    <>
      {/* KPI cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <KpiCard label="Total Outbound Clicks" value={loadingSummary ? '…' : fmt(total)} sub={`Last ${days} days`} accent={C.gold} C={C} />
        <KpiCard label="Website Clicks" value={loadingSummary ? '…' : fmt(website)} sub={total ? `${pct(website, total)} of total` : ''} accent="#b8a05a" C={C} />
        <KpiCard label="Social Clicks" value={loadingSummary ? '…' : fmt(social)} sub={total ? `${pct(social, total)} of total` : ''} accent="#e1306c" C={C} />
        <KpiCard label="Other Clicks" value={loadingSummary ? '…' : fmt(other)} sub={total ? `${pct(other, total)} of total` : ''} accent={C.grey} C={C} />
      </div>

      {/* Trend + Distribution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 16, marginBottom: 20 }}>
        {loadingTimeline
          ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading trend…</span>
            </div>
          : <TrendCard timeline={timeline?.timeline || []} total={timeline?.total ?? 0} days={days} C={C} />
        }
        {loadingSummary
          ? <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '22px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading distribution…</span>
            </div>
          : <DistributionCard byLinkType={summary?.byLinkType || {}} total={total || 0} C={C} />
        }
      </div>

      {/* Leaderboard */}
      <div style={{ marginBottom: 20 }}><LeaderboardCard days={days} C={C} /></div>

      {/* High-Intent + Entity Split */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <HighIntentSignals C={C} />
        <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 6, padding: '18px 20px' }}>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: C.gold, fontWeight: 600, marginBottom: 16 }}>By Entity Type</div>
          {loadingSummary && <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Loading…</div>}
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
          {!loadingSummary && !summary && <div style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>No data — deploy the edge function to start tracking.</div>}
        </div>
      </div>
    </>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PlatformIntelligenceModule({ C }) {
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState('outbound');

  return (
    <div style={{ maxWidth: 1100 }}>

      {/* ── Page header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h2 style={{ fontFamily: GD, fontSize: 22, color: C.off, margin: 0, fontWeight: 400 }}>
            Platform Intelligence
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.grey, margin: '4px 0 0' }}>
            Unified behaviour intelligence — discovery → consideration → action
          </p>
        </div>
        <DaysPicker days={days} onChange={setDays} C={C} />
      </div>

      {/* ── Cross-tab event summary bar ── */}
      <EventSummaryBar days={days} C={C} />

      {/* ── Tab bar ── */}
      <TabBar active={activeTab} onChange={setActiveTab} C={C} />

      {/* ── Tab content ── */}
      {activeTab === 'outbound'  && <OutboundTab days={days} C={C} />}
      {activeTab === 'search'    && <SearchIntelligencePanel days={days} C={C} />}
      {activeTab === 'enquiry'   && <EnquiryFunnelPanel days={days} C={C} />}
      {activeTab === 'shortlist' && <ShortlistPanel days={days} C={C} />}
      {activeTab === 'compare'   && <CompareIntelPanel days={days} C={C} />}

    </div>
  );
}
