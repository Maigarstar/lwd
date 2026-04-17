// ─── src/pages/AdminModules/UnifiedAnalyticsDashboard.jsx ────────────────────
// Unified analytics dashboard: readers, page turns, vendor enquiries,
// listings performance — all in one view.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const GOLD   = '#C9A84C';
const BG     = '#0C0A08';
const SURF   = '#141210';
const CARD   = '#1C1916';
const BORDER = 'rgba(255,255,255,0.07)';
const MUTED  = 'rgba(255,255,255,0.38)';
const WHITE  = '#F0EBE0';
const NU     = "'Jost', sans-serif";
const GD     = "'Cormorant Garamond', Georgia, serif";

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function fmt(n) {
  if (n == null) return '—';
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function fmtDecimal(n) {
  if (n == null || isNaN(n)) return '—';
  return n.toFixed(1);
}

// ── Shimmer (loading skeleton) ────────────────────────────────────────────────

function Shimmer({ width = '100%', height = 24, style = {} }) {
  return (
    <div style={{
      width, height,
      background: `linear-gradient(90deg, ${CARD} 25%, rgba(255,255,255,0.05) 50%, ${CARD} 75%)`,
      backgroundSize: '200% 100%',
      borderRadius: 4,
      animation: 'lwd-shimmer 1.4s ease-in-out infinite',
      ...style,
    }} />
  );
}

// ── KPI Card ─────────────────────────────────────────────────────────────────

function KpiCard({ label, value, subtitle, loading, accentColor }) {
  return (
    <div style={{
      background: CARD,
      border: `1px solid ${BORDER}`,
      borderTop: `2px solid ${accentColor || GOLD}`,
      borderRadius: 4,
      padding: '20px 24px',
      minWidth: 160,
      flex: 1,
    }}>
      <div style={{
        fontFamily: NU, fontSize: 9, color: GOLD,
        letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8,
      }}>
        {label}
      </div>
      {loading
        ? <Shimmer height={36} width={80} />
        : (
          <div style={{ fontFamily: GD, fontSize: 36, fontWeight: 300, color: WHITE, lineHeight: 1 }}>
            {value}
          </div>
        )
      }
      {subtitle && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 6 }}>
          {loading ? <Shimmer height={12} width={100} style={{ marginTop: 6 }} /> : subtitle}
        </div>
      )}
    </div>
  );
}

// ── Section heading ───────────────────────────────────────────────────────────

function SectionHeading({ label }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 9, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: GOLD, fontWeight: 600,
      marginBottom: 14,
    }}>
      {label}
    </div>
  );
}

// ── Error text ────────────────────────────────────────────────────────────────

function ErrorText({ message }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, fontStyle: 'italic', padding: '12px 0' }}>
      {message || 'Could not load data.'}
    </div>
  );
}

// ── Section 1: KPI Strip ──────────────────────────────────────────────────────

function KpiStrip() {
  const [kpis, setKpis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const [
          analyticsRes,
          enquiriesRes,
          listingsRes,
          applicationsRes,
        ] = await Promise.all([
          supabase
            .from('magazine_analytics')
            .select('event_type, session_id'),
          supabase
            .from('vendor_inquiries')
            .select('id', { count: 'exact', head: true }),
          supabase
            .from('listings')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'live'),
          supabase
            .from('listing_applications')
            .select('id', { count: 'exact', head: true }),
        ]);

        if (cancelled) return;

        const analyticsRows = analyticsRes.data || [];
        const views = analyticsRows.filter(r => r.event_type === 'view');
        const pageTurns = analyticsRows.filter(r => r.event_type === 'page_turn');
        const distinctSessions = new Set(views.map(r => r.session_id)).size;
        const avgPages = distinctSessions > 0
          ? pageTurns.length / distinctSessions
          : 0;

        setKpis({
          readers: distinctSessions,
          pageTurns: pageTurns.length,
          avgPages,
          enquiries: enquiriesRes.count || 0,
          activeListings: listingsRes.count || 0,
          applications: applicationsRes.count || 0,
        });
      } catch (e) {
        if (!cancelled) setError('Failed to load KPIs.');
        console.warn('[UnifiedAnalytics] KPI load error:', e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  if (error) return <ErrorText message={error} />;

  const cards = [
    { label: 'Total Readers',     value: loading ? '…' : fmt(kpis?.readers),        subtitle: 'Distinct reading sessions',   accent: GOLD },
    { label: 'Page Turns',        value: loading ? '…' : fmt(kpis?.pageTurns),       subtitle: 'All time',                    accent: '#60a5fa' },
    { label: 'Avg Pages/Session', value: loading ? '…' : fmtDecimal(kpis?.avgPages), subtitle: 'Page turns ÷ view sessions',  accent: '#a78bfa' },
    { label: 'Total Enquiries',   value: loading ? '…' : fmt(kpis?.enquiries),       subtitle: 'All time vendor enquiries',   accent: '#22c55e' },
    { label: 'Active Listings',   value: loading ? '…' : fmt(kpis?.activeListings),  subtitle: 'Status = live',               accent: '#f59e0b' },
    { label: 'Applications',      value: loading ? '…' : fmt(kpis?.applications),    subtitle: 'All statuses',                accent: '#f97316' },
  ];

  return (
    <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }}>
      {cards.map(c => (
        <KpiCard
          key={c.label}
          label={c.label}
          value={c.value}
          subtitle={c.subtitle}
          loading={loading}
          accentColor={c.accent}
        />
      ))}
    </div>
  );
}

// ── Section 2 Left: Magazine Reader Analytics ─────────────────────────────────

function MagazineAnalyticsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('magazine_analytics')
          .select('issue_id, event_type, page_number, session_id, device_type, created_at, magazine_issues(title, slug, cover_image)')
          .order('created_at', { ascending: false })
          .limit(500);

        if (err) throw err;
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) setError('Could not load reader data.');
        console.warn('[UnifiedAnalytics] Magazine load error:', e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Aggregate by issue
  const byIssue = {};
  rows.forEach(r => {
    const id = r.issue_id;
    if (!id) return;
    if (!byIssue[id]) {
      byIssue[id] = {
        title: r.magazine_issues?.title || id,
        sessions: new Set(),
        pageTurns: 0,
        dwellMs: [],
        lastViewed: null,
      };
    }
    if (r.event_type === 'view') {
      byIssue[id].sessions.add(r.session_id);
      const ts = r.created_at;
      if (!byIssue[id].lastViewed || ts > byIssue[id].lastViewed) {
        byIssue[id].lastViewed = ts;
      }
    }
    if (r.event_type === 'page_turn') byIssue[id].pageTurns++;
    if (r.event_type === 'dwell' && r.duration_ms) byIssue[id].dwellMs.push(r.duration_ms);
  });

  const issueTable = Object.values(byIssue).map(i => ({
    ...i,
    views: i.sessions.size,
    avgDwell: i.dwellMs.length
      ? Math.round(i.dwellMs.reduce((a, b) => a + b, 0) / i.dwellMs.length / 1000)
      : null,
  })).sort((a, b) => b.views - a.views);

  // Device breakdown
  const deviceCounts = { mobile: 0, tablet: 0, desktop: 0 };
  rows.forEach(r => { if (r.device_type && deviceCounts[r.device_type] !== undefined) deviceCounts[r.device_type]++; });
  const totalDevices = Object.values(deviceCounts).reduce((a, b) => a + b, 0) || 1;
  const deviceColors = { mobile: '#60a5fa', tablet: '#a78bfa', desktop: GOLD };

  // Recent activity feed (last 10)
  const recentActivity = rows.slice(0, 10);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* By Issue table */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
          <SectionHeading label="By Issue" />
        </div>
        {loading ? (
          <div style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <Shimmer key={i} height={20} />)}
          </div>
        ) : error ? (
          <div style={{ padding: '16px 18px' }}><ErrorText message={error} /></div>
        ) : issueTable.length === 0 ? (
          <div style={{ padding: '24px 18px', fontFamily: NU, fontSize: 12, color: MUTED }}>No reader data yet.</div>
        ) : (
          <div>
            {/* Header */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 90px', gap: 10, padding: '8px 18px', borderBottom: `1px solid ${BORDER}` }}>
              {['Issue', 'Views', 'Turns', 'Avg Dwell', 'Last Read'].map(h => (
                <span key={h} style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: MUTED, fontWeight: 600 }}>{h}</span>
              ))}
            </div>
            {issueTable.map((issue, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 60px 70px 70px 90px', gap: 10, padding: '10px 18px', borderBottom: `1px solid ${BORDER}`, alignItems: 'center' }}>
                <div style={{ fontFamily: NU, fontSize: 12, color: WHITE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {issue.title}
                </div>
                <div style={{ fontFamily: GD, fontSize: 16, color: GOLD }}>{issue.views}</div>
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>{issue.pageTurns}</div>
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>
                  {issue.avgDwell != null ? `${issue.avgDwell}s` : '—'}
                </div>
                <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
                  {issue.lastViewed ? timeAgo(issue.lastViewed) : '—'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Device breakdown */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '14px 18px' }}>
        <SectionHeading label="Device Breakdown" />
        {loading ? (
          <Shimmer height={24} />
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Object.entries(deviceCounts).map(([device, count]) => {
              const pct = Math.round((count / totalDevices) * 100);
              return (
                <div key={device}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: NU, fontSize: 11, color: WHITE, textTransform: 'capitalize' }}>{device}</span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>{pct}% ({count})</span>
                  </div>
                  <div style={{ height: 6, background: BORDER, borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${pct}%`,
                      background: deviceColors[device] || GOLD,
                      borderRadius: 3, transition: 'width 0.6s',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Recent activity feed */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
          <SectionHeading label="Recent Activity" />
        </div>
        {loading ? (
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => <Shimmer key={i} height={16} />)}
          </div>
        ) : recentActivity.length === 0 ? (
          <div style={{ padding: '16px 18px', fontFamily: NU, fontSize: 12, color: MUTED }}>No activity yet.</div>
        ) : (
          recentActivity.map((r, i) => {
            const issueTitle = r.magazine_issues?.title || r.issue_id || 'an issue';
            let text = '';
            if (r.event_type === 'view') text = `Someone opened "${issueTitle}"`;
            else if (r.event_type === 'page_turn') text = `Page ${r.page_number || '?'} viewed in "${issueTitle}"`;
            else if (r.event_type === 'dwell') text = `Reader spent time on page ${r.page_number || '?'}`;
            else text = `${r.event_type} — "${issueTitle}"`;

            return (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 18px', borderBottom: i < recentActivity.length - 1 ? `1px solid ${BORDER}` : 'none',
              }}>
                <div style={{ fontFamily: NU, fontSize: 11, color: WHITE, flex: 1, paddingRight: 12 }}>{text}</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, whiteSpace: 'nowrap' }}>{timeAgo(r.created_at)}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

// ── Section 2 Right: Enquiries + Listings ─────────────────────────────────────

function EnquiriesPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('vendor_inquiries')
          .select('id, created_at, vendor_id, listings(name)')
          .order('created_at', { ascending: false })
          .limit(200);

        if (err) throw err;
        if (!cancelled) setRows(data || []);
      } catch (e) {
        if (!cancelled) setError('Could not load enquiries.');
        console.warn('[UnifiedAnalytics] Enquiries load error:', e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  // Build last 14 days bar chart data
  const today = new Date();
  const last14 = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (13 - i));
    return d.toISOString().slice(0, 10);
  });

  const countsByDay = {};
  rows.forEach(r => {
    const day = r.created_at?.slice(0, 10);
    if (day) countsByDay[day] = (countsByDay[day] || 0) + 1;
  });

  const dayBars = last14.map(day => ({ day, count: countsByDay[day] || 0 }));
  const maxDayCount = Math.max(...dayBars.map(d => d.count), 1);

  // Top 5 most enquired listings
  const listingCounts = {};
  rows.forEach(r => {
    const name = r.listings?.name || r.vendor_id || 'Unknown';
    listingCounts[name] = (listingCounts[name] || 0) + 1;
  });
  const topListings = Object.entries(listingCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
  const maxListingCount = topListings[0]?.[1] || 1;

  // Recent 8
  const recent = rows.slice(0, 8);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Enquiries by day bar chart */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '14px 18px' }}>
        <SectionHeading label="Enquiries — Last 14 Days" />
        {loading ? (
          <Shimmer height={64} />
        ) : (
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 64 }}>
            {dayBars.map(({ day, count }) => {
              const barH = maxDayCount > 0 ? Math.max(2, Math.round((count / maxDayCount) * 60)) : 2;
              const isToday = day === today.toISOString().slice(0, 10);
              return (
                <div
                  key={day}
                  title={`${day}: ${count} enquir${count === 1 ? 'y' : 'ies'}`}
                  style={{
                    flex: 1,
                    height: barH,
                    background: isToday ? GOLD : 'rgba(201,168,76,0.35)',
                    borderRadius: '2px 2px 0 0',
                    cursor: 'default',
                    transition: 'height 0.4s',
                  }}
                />
              );
            })}
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>{last14[0]?.slice(5)}</span>
          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>today</span>
        </div>
      </div>

      {/* Top 5 listings */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, padding: '14px 18px' }}>
        <SectionHeading label="Top Enquired Listings" />
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4,5].map(i => <Shimmer key={i} height={20} />)}
          </div>
        ) : topListings.length === 0 ? (
          <div style={{ fontFamily: NU, fontSize: 12, color: MUTED }}>No enquiries yet.</div>
        ) : (
          topListings.map(([name, count], i) => (
            <div key={i} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: WHITE, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '80%' }}>{name}</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: GOLD, fontWeight: 600 }}>{count}</span>
              </div>
              <div style={{ height: 4, background: BORDER, borderRadius: 2, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${(count / maxListingCount) * 100}%`, background: GOLD, borderRadius: 2, transition: 'width 0.6s' }} />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Recent enquiries feed */}
      <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px', borderBottom: `1px solid ${BORDER}` }}>
          <SectionHeading label="Recent Enquiries" />
        </div>
        {loading ? (
          <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3].map(i => <Shimmer key={i} height={16} />)}
          </div>
        ) : recent.length === 0 ? (
          <div style={{ padding: '16px 18px', fontFamily: NU, fontSize: 12, color: MUTED }}>No enquiries yet.</div>
        ) : (
          recent.map((r, i) => (
            <div key={r.id} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '9px 18px',
              borderBottom: i < recent.length - 1 ? `1px solid ${BORDER}` : 'none',
            }}>
              <div style={{ fontFamily: NU, fontSize: 11, color: WHITE }}>
                Enquiry — {r.listings?.name || 'Unknown listing'}
              </div>
              <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, whiteSpace: 'nowrap' }}>
                {timeAgo(r.created_at)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Section 3: Applications Pipeline ─────────────────────────────────────────

const PIPELINE_STATUSES = [
  { key: 'new',        label: 'New',        color: '#60a5fa' },
  { key: 'reviewing',  label: 'Reviewing',  color: '#f59e0b' },
  { key: 'contacted',  label: 'Contacted',  color: '#a78bfa' },
  { key: 'approved',   label: 'Approved',   color: '#22c55e' },
  { key: 'declined',   label: 'Declined',   color: '#ef4444' },
];

function ApplicationsPipeline() {
  const [apps, setApps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const { data, error: err } = await supabase
          .from('listing_applications')
          .select('id, status, category, created_at, business_name')
          .order('created_at', { ascending: false });

        if (err) throw err;
        if (!cancelled) setApps(data || []);
      } catch (e) {
        if (!cancelled) setError('Could not load applications.');
        console.warn('[UnifiedAnalytics] Applications load error:', e);
      }
      if (!cancelled) setLoading(false);
    }
    load();
    return () => { cancelled = true; };
  }, []);

  const byStatus = {};
  PIPELINE_STATUSES.forEach(s => { byStatus[s.key] = []; });
  apps.forEach(a => {
    const key = a.status?.toLowerCase();
    if (byStatus[key] !== undefined) byStatus[key].push(a);
    else if (byStatus['new']) byStatus['new'].push(a); // fallback unknown status → new
  });

  return (
    <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
      <div style={{ padding: '14px 18px 0', borderBottom: `1px solid ${BORDER}` }}>
        <SectionHeading label="Applications Pipeline" />
      </div>
      {error ? (
        <div style={{ padding: '16px 18px' }}><ErrorText message={error} /></div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', overflowX: 'auto' }}>
          {PIPELINE_STATUSES.map(status => {
            const list = byStatus[status.key] || [];
            return (
              <div key={status.key} style={{
                borderRight: `1px solid ${BORDER}`,
                padding: '16px 14px',
                minWidth: 120,
              }}>
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    color: status.color,
                  }}>
                    {status.label}
                  </div>
                  <div style={{
                    background: status.color + '22',
                    border: `1px solid ${status.color}55`,
                    borderRadius: 100,
                    padding: '1px 7px',
                    fontFamily: NU, fontSize: 10, fontWeight: 700, color: status.color,
                  }}>
                    {loading ? '…' : list.length}
                  </div>
                </div>

                {/* Last 3 names */}
                {loading ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {[1,2,3].map(i => <Shimmer key={i} height={14} />)}
                  </div>
                ) : list.length === 0 ? (
                  <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, fontStyle: 'italic' }}>Empty</div>
                ) : (
                  list.slice(0, 3).map((app, i) => (
                    <div key={app.id} style={{
                      fontFamily: NU, fontSize: 11, color: i === 0 ? WHITE : MUTED,
                      marginBottom: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                      {app.business_name || '(unnamed)'}
                    </div>
                  ))
                )}

                {/* Overflow hint */}
                {!loading && list.length > 3 && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 4 }}>
                    +{list.length - 3} more
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function UnifiedAnalyticsDashboard({ C }) {
  return (
    <>
      {/* Shimmer keyframe */}
      <style>{`
        @keyframes lwd-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      <div style={{
        width: '100%',
        padding: '28px 40px',
        background: BG,
        minHeight: '100vh',
        boxSizing: 'border-box',
        overflowX: 'hidden',
      }}>
        {/* Page header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '3px', textTransform: 'uppercase', color: GOLD, marginBottom: 6 }}>
            ◈ Intelligence
          </div>
          <h2 style={{ fontFamily: GD, fontSize: 26, color: WHITE, margin: 0, fontWeight: 400 }}>
            Unified Analytics
          </h2>
          <p style={{ fontFamily: NU, fontSize: 12, color: MUTED, margin: '4px 0 0' }}>
            Readers, page turns, vendor enquiries and listings performance — one view.
          </p>
        </div>

        {/* Section 1: KPI Strip */}
        <div style={{ marginBottom: 32 }}>
          <KpiStrip />
        </div>

        {/* Section 2: Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 20, marginBottom: 32 }}>
          {/* Left: Magazine Reader Analytics */}
          <div>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 600, marginBottom: 14 }}>
              Magazine Readers
            </div>
            <MagazineAnalyticsPanel />
          </div>

          {/* Right: Enquiries + Listings */}
          <div>
            <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, fontWeight: 600, marginBottom: 14 }}>
              Enquiries &amp; Listings
            </div>
            <EnquiriesPanel />
          </div>
        </div>

        {/* Section 3: Applications Pipeline */}
        <ApplicationsPipeline />
      </div>
    </>
  );
}
