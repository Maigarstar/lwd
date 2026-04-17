// ─── src/pages/PublicationStudio/HeatmapPanel.jsx ────────────────────────────
// Page Engagement Heatmap — shows which pages readers dwell on longest.
// Reads from magazine_analytics (event_type='dwell') via fetchPageHeatmap.

import { useState, useEffect } from 'react';
import { fetchPageHeatmap } from '../../services/publicationsAnalyticsService';

const GOLD   = '#C9A84C';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const MUTED  = 'rgba(255,255,255,0.38)';
const BORDER = 'rgba(255,255,255,0.08)';
const SURF   = 'rgba(255,255,255,0.03)';

function fmt_ms(ms) {
  if (!ms) return '0s';
  if (ms < 1000) return `${ms}ms`;
  const s = (ms / 1000).toFixed(1);
  return `${s}s`;
}

function StatTile({ label, value, sub }) {
  return (
    <div style={{
      background:  SURF,
      border:      `1px solid ${BORDER}`,
      borderRadius: 6,
      padding:     '14px 18px',
      flex:        1,
      minWidth:    110,
    }}>
      <div style={{
        fontFamily:    NU,
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color:         GOLD,
        marginBottom:  8,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily:  GD,
        fontSize:    28,
        fontWeight:  300,
        color:       '#fff',
        lineHeight:  1,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 5 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

export default function HeatmapPanel({ issue, pages }) {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    if (!issue?.id) return;
    setLoading(true);
    setError(null);
    fetchPageHeatmap(issue.id).then(({ data: rows, error: err }) => {
      if (err) { setError('Failed to load heatmap data.'); }
      else     { setData(rows || []); }
      setLoading(false);
    });
  }, [issue?.id]);

  if (loading) {
    return (
      <div style={{ padding: '40px 32px', fontFamily: NU, fontSize: 12, color: MUTED, textAlign: 'center' }}>
        Loading heatmap…
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '32px 32px', fontFamily: NU, fontSize: 12, color: '#f87171' }}>
        {error}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div style={{ padding: '60px 32px', textAlign: 'center' }}>
        <div style={{ fontSize: 32, opacity: 0.15, marginBottom: 14 }}>◈</div>
        <div style={{ fontFamily: NU, fontSize: 13, color: MUTED }}>
          No analytics data yet.
        </div>
        <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.2)', marginTop: 6, lineHeight: 1.6 }}>
          Share the issue to start collecting engagement data.
        </div>
      </div>
    );
  }

  const topPage   = data[0];
  const maxDwell  = topPage?.avg_dwell_ms || 1;
  const totalViews = data.reduce((s, r) => s + r.views, 0);
  const avgOverall = data.length
    ? Math.round(data.reduce((s, r) => s + r.avg_dwell_ms, 0) / data.length)
    : 0;

  return (
    <div style={{ padding: '24px 32px', maxWidth: 800 }}>

      {/* Title */}
      <div style={{
        fontFamily:    NU,
        fontSize:      9,
        fontWeight:    700,
        letterSpacing: '0.14em',
        textTransform: 'uppercase',
        color:         GOLD,
        marginBottom:  18,
      }}>
        Page Engagement Heatmap
      </div>

      {/* Stat tiles */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28, flexWrap: 'wrap' }}>
        <StatTile
          label="Top Page"
          value={`Pg ${topPage.page_number}`}
          sub={`${fmt_ms(topPage.avg_dwell_ms)} avg dwell`}
        />
        <StatTile
          label="Avg Dwell Time"
          value={fmt_ms(avgOverall)}
          sub="across all pages"
        />
        <StatTile
          label="Total Page Views"
          value={totalViews}
          sub={`${data.length} pages tracked`}
        />
      </div>

      {/* Bar chart */}
      <div>
        <div style={{
          fontFamily:    NU,
          fontSize:      9,
          fontWeight:    700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         MUTED,
          marginBottom:  12,
        }}>
          Dwell time by page (sorted by engagement)
        </div>

        {data.map(row => {
          const pct  = maxDwell > 0 ? (row.avg_dwell_ms / maxDwell) * 100 : 0;
          // Color interpolation: low → faded gold, high → bright gold
          const barBg = `linear-gradient(to right, rgba(201,168,76,${0.25 + (pct / 100) * 0.75}), rgba(201,168,76,${0.15 + (pct / 100) * 0.85}))`;

          return (
            <div
              key={row.page_number}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}
            >
              {/* Page label */}
              <span style={{
                fontFamily: NU, fontSize: 10, color: MUTED,
                width: 36, textAlign: 'right', flexShrink: 0,
              }}>
                Pg {row.page_number}
              </span>

              {/* Bar */}
              <div style={{
                flex: 1, height: 18,
                background: 'rgba(255,255,255,0.05)',
                borderRadius: 2, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: barBg,
                  borderRadius: 2,
                  transition: 'width 0.4s ease',
                  minWidth: pct > 0 ? 4 : 0,
                }} />
              </div>

              {/* Stats */}
              <span style={{
                fontFamily:  NU, fontSize: 10, color: MUTED,
                width: 60, flexShrink: 0, textAlign: 'right',
                whiteSpace: 'nowrap',
              }}>
                {fmt_ms(row.avg_dwell_ms)} avg
              </span>
              <span style={{
                fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.2)',
                width: 44, flexShrink: 0, textAlign: 'right',
                whiteSpace: 'nowrap',
              }}>
                {row.views}v
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
