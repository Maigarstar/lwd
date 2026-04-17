// ─── MagazineVendorAnalyticsPage.jsx ─────────────────────────────────────────
// Token-protected analytics dashboard for magazine ad vendors.
// URL: /magazine/vendor-analytics/<base64token>
// Token format (before base64): <issue_id>:<page_number>:<vendor_email>
//
// Data comes from get_vendor_analytics() SECURITY DEFINER RPC which validates
// the token server-side and returns aggregated read events for that page.

import { useState, useEffect } from 'react';

// ── Design tokens ─────────────────────────────────────────────────────────────
const BG    = '#0c0a07';
const CARD  = '#13110d';
const GOLD  = '#c9a96e';
const GOLD2 = '#e8c87a';
const MUTED = '#8a7a62';
const TEXT  = '#e8e0d0';
const BORD  = '#2a2318';
const GD    = '"Cormorant Garamond", Georgia, serif';
const NU    = '"Neue Haas Grotesk", "Helvetica Neue", Arial, sans-serif';

// ── Tier display labels ───────────────────────────────────────────────────────
const TIER_LABELS = {
  standard:  'Standard Page Feature',
  featured:  'Featured Placement',
  showcase:  'Showcase Spread',
};

// ── SVG bar chart (no dependency) ─────────────────────────────────────────────
function Sparkbar({ data, width = 280, height = 56 }) {
  if (!data?.length) return null;
  const maxV = Math.max(...data.map(d => d.views), 1);
  const barW = Math.max(4, Math.floor((width - (data.length - 1) * 2) / data.length));
  const gap  = 2;

  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      {data.map((d, i) => {
        const barH = Math.max(2, Math.round((d.views / maxV) * (height - 12)));
        const x    = i * (barW + gap);
        const y    = height - barH;
        return (
          <g key={d.date}>
            <rect
              x={x} y={y}
              width={barW} height={barH}
              rx={1}
              fill={i === data.length - 1 ? GOLD2 : GOLD}
              opacity={0.7 + 0.3 * (d.views / maxV)}
            />
            {d.views > 0 && (
              <title>{d.date}: {d.views} view{d.views !== 1 ? 's' : ''}</title>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ label, value, sub, wide }) {
  return (
    <div style={{
      background: CARD,
      border:     `1px solid ${BORD}`,
      borderRadius: 4,
      padding:    '20px 24px',
      gridColumn: wide ? 'span 2' : 'span 1',
    }}>
      <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 36, fontStyle: 'italic', color: TEXT, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, marginTop: 6 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MagazineVendorAnalyticsPage({ token }) {
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [data,     setData]     = useState(null);

  useEffect(() => {
    if (!token) { setError('No analytics token provided.'); setLoading(false); return; }

    (async () => {
      try {
        const { supabase } = await import('../lib/supabaseClient');
        const { data: bundle, error: rpcErr } = await supabase.rpc('get_vendor_analytics', {
          p_token: token,
        });
        if (rpcErr) throw new Error(rpcErr.message);
        if (!bundle) throw new Error('Invalid or expired analytics link.');
        setData(bundle);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: GOLD, opacity: 0.7, letterSpacing: '0.05em' }}>
          Loading your analytics…
        </div>
      </div>
    );
  }

  // ── Error / invalid token ───────────────────────────────────────────────────
  if (error || !data) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 32 }}>
        <div style={{ fontFamily: GD, fontSize: 28, fontStyle: 'italic', color: GOLD }}>Luxury Wedding Directory</div>
        <div style={{ fontFamily: NU, fontSize: 13, color: MUTED, textAlign: 'center', maxWidth: 440 }}>
          {error || 'This analytics link is invalid or has expired. Please contact your account manager.'}
        </div>
      </div>
    );
  }

  const {
    total_views, unique_readers, avg_dwell_seconds, best_day_views,
    daily_trend, issue_title, page_number, slot,
  } = data;

  const tierLabel   = TIER_LABELS[slot?.tier] || slot?.tier || 'Editorial Feature';
  const vendorName  = slot?.vendor_name  || 'Your placement';
  const trendData   = daily_trend || [];
  const hasTrend    = trendData.length > 1;

  // Format dwell time
  const dwellDisplay = avg_dwell_seconds >= 60
    ? `${Math.floor(avg_dwell_seconds / 60)}m ${Math.round(avg_dwell_seconds % 60)}s`
    : `${avg_dwell_seconds}s`;

  return (
    <div style={{ minHeight: '100vh', background: BG, color: TEXT, fontFamily: NU }}>

      {/* Header */}
      <div style={{ borderBottom: `1px solid ${BORD}`, padding: '0 40px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '20px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: GOLD, letterSpacing: '0.04em' }}>
            Luxury Wedding Directory
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: MUTED }}>
            Analytics Report
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '48px 40px' }}>

        {/* Issue + placement context */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 8 }}>
            Performance Report
          </div>
          <div style={{ fontFamily: GD, fontSize: 32, fontStyle: 'italic', color: TEXT, marginBottom: 6, lineHeight: 1.15 }}>
            {vendorName}
          </div>
          <div style={{ fontFamily: NU, fontSize: 13, color: MUTED }}>
            {tierLabel} · Page {page_number}
            {issue_title && (
              <> · <span style={{ color: TEXT }}>{issue_title}</span></>
            )}
          </div>
        </div>

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <StatCard
            label="Total Page Views"
            value={Number(total_views || 0).toLocaleString()}
            sub="Times your page was viewed by readers"
          />
          <StatCard
            label="Unique Readers"
            value={Number(unique_readers || 0).toLocaleString()}
            sub="Individual sessions that reached your page"
          />
          <StatCard
            label="Avg. Dwell Time"
            value={avg_dwell_seconds > 0 ? dwellDisplay : '—'}
            sub="Average time readers spent on your page"
          />
          <StatCard
            label="Best Day"
            value={Number(best_day_views || 0).toLocaleString()}
            sub="Peak views in a single day"
          />
        </div>

        {/* Daily trend chart */}
        {hasTrend && (
          <div style={{
            background: CARD,
            border:     `1px solid ${BORD}`,
            borderRadius: 4,
            padding:    '24px 28px',
            marginBottom: 40,
          }}>
            <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, marginBottom: 16 }}>
              Daily Trend
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Sparkbar
                data={trendData}
                width={Math.max(280, trendData.length * 14)}
                height={64}
              />
            </div>
            {/* Date labels (first and last) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
              <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>{trendData[0]?.date}</div>
              <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>{trendData[trendData.length - 1]?.date}</div>
            </div>
          </div>
        )}

        {!hasTrend && total_views === 0 && (
          <div style={{
            background: CARD,
            border:     `1px solid ${BORD}`,
            borderRadius: 4,
            padding:    '32px 28px',
            marginBottom: 40,
            textAlign:  'center',
          }}>
            <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: MUTED, marginBottom: 8 }}>
              No reader data yet
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: MUTED }}>
              Analytics will appear once readers start viewing this issue.
            </div>
          </div>
        )}

        {/* Footer note */}
        <div style={{ borderTop: `1px solid ${BORD}`, paddingTop: 24, marginTop: 8 }}>
          <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
            Analytics are updated in real time. Page views are counted each time a reader reaches your page.
            Unique readers are measured by browser session. Data is retained for the lifetime of the issue.
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, color: BORD, marginTop: 12, letterSpacing: '0.05em' }}>
            LUXURY WEDDING DIRECTORY · EDITORIAL ANALYTICS
          </div>
        </div>

      </div>
    </div>
  );
}


// ── Analytics URL helper ──────────────────────────────────────────────────────
// Call this wherever you need to generate a shareable analytics link for a vendor.
// issueId: UUID, pageNumber: int, vendorEmail: string
// Returns a full URL string.
export function buildVendorAnalyticsUrl(issueId, pageNumber, vendorEmail) {
  const token = btoa([issueId, pageNumber, vendorEmail].join(':'));
  return `${window.location.origin}/magazine/vendor-analytics/${token}`;
}
