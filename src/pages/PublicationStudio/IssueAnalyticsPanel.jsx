// ─── IssueAnalyticsPanel.jsx ─────────────────────────────────────────────────
// Full-screen overlay showing read analytics for a published issue.
// Stats, page heatmap, vendor reach, trend chart, audience breakdown, export report.

import { useState, useEffect, useMemo } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './PageDesigner/designerConstants';
import { supabase } from '../../lib/supabaseClient';

function normaliseSlug(str) {
  return (str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function copyToClipboard(text) {
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
}

function StatCard({ label, value, sub }) {
  return (
    <div style={{
      flex: 1, minWidth: 140,
      background: 'rgba(201,168,76,0.06)',
      border: `1px solid rgba(201,168,76,0.18)`,
      borderRadius: 6, padding: '16px 18px',
    }}>
      <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontFamily: GD, fontSize: 28, fontStyle: 'italic', color: GOLD, lineHeight: 1 }}>
        {value}
      </div>
      {sub && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>
          {sub}
        </div>
      )}
    </div>
  );
}

function msToReadable(ms) {
  if (!ms || ms <= 0) return '—';
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return rem > 0 ? `${m}m ${rem}s` : `${m}m`;
}

export default function IssueAnalyticsPanel({ issueId, issueName, issueSlug, pages, onClose }) {
  const [loading,    setLoading]    = useState(true);
  const [sessions,   setSessions]   = useState([]);   // unique session_ids
  const [pageViews,  setPageViews]  = useState([]);   // { page_number, count }
  const [avgDuration, setAvgDuration] = useState(null); // ms
  const [allEvents,  setAllEvents]  = useState([]);   // raw events for trend + audience
  const [copiedSlug, setCopiedSlug] = useState(null); // vendor slug that was just copied

  useEffect(() => {
    if (!issueId) return;
    (async () => {
      setLoading(true);

      // 1. All read events for this issue (include device/browser/referrer for Feature 11)
      const { data: events } = await supabase
        .from('magazine_read_events')
        .select('session_id, event_type, page_number, duration_ms, created_at, device, browser, referrer')
        .eq('issue_id', issueId);

      if (!events) { setLoading(false); return; }

      setAllEvents(events);

      // Unique sessions
      const uniqueSids = [...new Set(events.map(e => e.session_id))];
      setSessions(uniqueSids);

      // Page view counts
      const pvEvents = events.filter(e => e.event_type === 'page_view' && e.page_number != null);
      const pvMap = {};
      pvEvents.forEach(e => { pvMap[e.page_number] = (pvMap[e.page_number] || 0) + 1; });
      const pvArray = Object.entries(pvMap)
        .map(([page_number, count]) => ({ page_number: parseInt(page_number), count }))
        .sort((a, b) => a.page_number - b.page_number);
      setPageViews(pvArray);

      // Avg session duration from issue_open + issue_close pairs
      const openEvents  = events.filter(e => e.event_type === 'issue_open');
      const closeEvents = events.filter(e => e.event_type === 'issue_close' && e.duration_ms);
      const durations = closeEvents.map(e => e.duration_ms).filter(Boolean);
      if (durations.length > 0) {
        const avg = Math.round(durations.reduce((s, d) => s + d, 0) / durations.length);
        setAvgDuration(avg);
      }

      setLoading(false);
    })();
  }, [issueId]);

  const totalPageViews = pageViews.reduce((s, p) => s + p.count, 0);
  const maxPageViews   = Math.max(...pageViews.map(p => p.count), 1);

  // Pages with slots (for gold highlight + vendor reach)
  const slottedPages = useMemo(() => {
    return (pages || []).filter(p => p.slot?.tier && p.slot?.vendor_name);
  }, [pages]);

  // Vendor reach: join page views with slot info
  const vendorReach = useMemo(() => {
    const uniqueSessions = sessions.length;
    return slottedPages.map(p => {
      const pv = pageViews.find(pv => pv.page_number === (p.pageNumber ?? p.page_number ?? p.order));
      const views = pv?.count ?? 0;
      const pct   = uniqueSessions > 0 ? Math.round((views / uniqueSessions) * 100) : 0;
      return {
        vendorName:  p.slot.vendor_name,
        pageNumber:  p.pageNumber ?? p.page_number ?? p.order,
        views,
        pct,
      };
    });
  }, [slottedPages, pageViews, sessions]);

  // ── Feature 10: 14-day reads trend ─────────────────────────────────────────
  const trendData = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10)); // YYYY-MM-DD
    }
    const openEvents = allEvents.filter(e => e.event_type === 'issue_open');
    const countByDay = {};
    openEvents.forEach(e => {
      const day = (e.created_at || '').slice(0, 10);
      if (day) countByDay[day] = (countByDay[day] || 0) + 1;
    });
    return days.map(day => ({ day, count: countByDay[day] || 0 }));
  }, [allEvents]);

  const maxTrendCount = useMemo(() => Math.max(...trendData.map(d => d.count), 1), [trendData]);

  // ── Feature 11: Audience device/browser/referrer breakdown ─────────────────
  const audienceData = useMemo(() => {
    const deviceMap = {};
    const browserMap = {};
    const referrerMap = {};

    // Use only issue_open events per session (1 per session)
    const sessionSeen = new Set();
    allEvents
      .filter(e => e.event_type === 'issue_open')
      .forEach(e => {
        if (sessionSeen.has(e.session_id)) return;
        sessionSeen.add(e.session_id);
        const dev = e.device || 'unknown';
        const br  = e.browser || 'unknown';
        const ref = e.referrer || 'direct';
        deviceMap[dev]  = (deviceMap[dev]  || 0) + 1;
        browserMap[br]  = (browserMap[br]  || 0) + 1;
        // Normalise referrer: strip query string, keep hostname
        let refLabel = 'direct';
        try {
          if (ref && ref !== 'direct' && ref.startsWith('http')) {
            refLabel = new URL(ref).hostname.replace(/^www\./, '');
          } else {
            refLabel = ref || 'direct';
          }
        } catch (_) { refLabel = ref || 'direct'; }
        referrerMap[refLabel] = (referrerMap[refLabel] || 0) + 1;
      });

    const total = sessionSeen.size || 1;
    const toArr = (map) => Object.entries(map)
      .map(([label, count]) => ({ label, count, pct: Math.round((count / total) * 100) }))
      .sort((a, b) => b.count - a.count);

    return {
      devices: toArr(deviceMap),
      browsers: toArr(browserMap),
      referrers: toArr(referrerMap).slice(0, 5),
    };
  }, [allEvents]);

  function handleExport() {
    const lines = [
      `Issue Analytics Report — ${issueName || 'Issue'}`,
      `Generated: ${new Date().toLocaleString('en-GB')}`,
      '',
      `Total Reads (unique sessions): ${sessions.length}`,
      `Total Page Views: ${totalPageViews}`,
      `Average Read Time: ${msToReadable(avgDuration)}`,
      '',
      'Page Views by Page:',
      ...pageViews.map(p => `  Page ${p.page_number}: ${p.count} views`),
      '',
      'Vendor Reach:',
      ...vendorReach.map(v => `  ${v.vendorName} (Page ${v.pageNumber}): ${v.views} views (${v.pct}% of readers)`),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `analytics-${(issueName || 'issue').toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 250,
        background: 'rgba(0,0,0,0.82)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#141210',
          border: `1px solid ${BORDER}`,
          borderRadius: 8,
          width: 'min(900px, 96vw)',
          maxHeight: '92vh',
          display: 'flex', flexDirection: 'column',
          boxShadow: '0 24px 80px rgba(0,0,0,0.9)',
          overflow: 'hidden',
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{
          padding: '18px 24px 16px',
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2 }}>
              ◆ Issue Analytics
            </div>
            <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: '#fff' }}>
              {issueName || 'Untitled Issue'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button
              onClick={handleExport}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '6px 14px', borderRadius: 3, cursor: 'pointer',
                background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.3)`,
                color: GOLD, transition: 'all 0.15s',
              }}
            >
              ↓ Export Report
            </button>
            <button
              onClick={onClose}
              style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 6 }}
            >
              ✕
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NU, fontSize: 12, color: MUTED }}>
            Loading analytics…
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>

            {/* ── Stats strip ── */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 32 }}>
              <StatCard
                label="Total Reads"
                value={String(sessions.length)}
                sub="unique sessions"
              />
              <StatCard
                label="Unique Visitors"
                value={String(sessions.length)}
                sub="by session ID"
              />
              <StatCard
                label="Total Page Views"
                value={String(totalPageViews)}
                sub={`across ${pageViews.length} pages`}
              />
              <StatCard
                label="Avg Read Time"
                value={msToReadable(avgDuration)}
                sub="per session"
              />
            </div>

            {/* ── Page Heatmap ── */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                ◈ Page View Heatmap
              </div>
              {pageViews.length === 0 ? (
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>No page view data yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {pageViews.map(pv => {
                    const isSlotted = slottedPages.some(p =>
                      (p.pageNumber ?? p.page_number ?? p.order) === pv.page_number
                    );
                    const barPct = (pv.count / maxPageViews) * 100;
                    const slotInfo = isSlotted
                      ? slottedPages.find(p => (p.pageNumber ?? p.page_number ?? p.order) === pv.page_number)
                      : null;

                    return (
                      <div key={pv.page_number} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {/* Page label */}
                        <div style={{
                          fontFamily: NU, fontSize: 10, color: isSlotted ? GOLD : MUTED,
                          width: 52, flexShrink: 0, fontWeight: isSlotted ? 700 : 400,
                        }}>
                          P{pv.page_number}
                          {isSlotted && <span style={{ marginLeft: 4, fontSize: 8 }}>✦</span>}
                        </div>
                        {/* Bar */}
                        <div style={{ flex: 1, height: 18, background: 'rgba(255,255,255,0.05)', borderRadius: 2, overflow: 'hidden', position: 'relative' }}>
                          <div style={{
                            width: `${barPct}%`,
                            height: '100%',
                            background: isSlotted
                              ? 'linear-gradient(90deg, rgba(201,168,76,0.7), rgba(201,168,76,0.4))'
                              : 'linear-gradient(90deg, rgba(96,165,250,0.5), rgba(96,165,250,0.2))',
                            borderRadius: 2,
                            transition: 'width 0.4s ease',
                          }} />
                        </div>
                        {/* Count */}
                        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, width: 40, textAlign: 'right', flexShrink: 0 }}>
                          {pv.count}
                        </div>
                        {/* Vendor name for slotted pages */}
                        {slotInfo && (
                          <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(201,168,76,0.6)', width: 120, flexShrink: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {slotInfo.slot.vendor_name}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Legend */}
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 8, background: 'rgba(201,168,76,0.6)', borderRadius: 1 }} />
                  <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Vendor placement page</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 12, height: 8, background: 'rgba(96,165,250,0.4)', borderRadius: 1 }} />
                  <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Editorial page</span>
                </div>
              </div>
            </div>

            {/* ── Vendor Reach ── */}
            {vendorReach.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                  ✦ Vendor Reach
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vendorReach.map((v, i) => {
                    const vSlug = normaliseSlug(v.vendorName);
                    const reportUrl = issueSlug
                      ? `https://luxuryweddingdirectory.com/magazine/reach/${issueSlug}/${vSlug}`
                      : null;
                    const justCopied = copiedSlug === vSlug;
                    return (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '10px 14px', borderRadius: 4,
                        background: 'rgba(201,168,76,0.04)', border: `1px solid rgba(201,168,76,0.15)`,
                      }}>
                        <div>
                          <div style={{ fontFamily: GD, fontSize: 14, fontStyle: 'italic', color: '#fff', marginBottom: 2 }}>
                            {v.vendorName}
                          </div>
                          <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Page {v.pageNumber}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: GOLD, lineHeight: 1 }}>
                              {v.views}
                            </div>
                            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 2 }}>
                              {v.pct}% of readers
                            </div>
                          </div>
                          {reportUrl && (
                            <button
                              onClick={() => {
                                copyToClipboard(reportUrl);
                                setCopiedSlug(vSlug);
                                setTimeout(() => setCopiedSlug(null), 2000);
                              }}
                              title={`Copy shareable report link for ${v.vendorName}`}
                              style={{
                                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                                padding: '5px 10px', borderRadius: 3, cursor: 'pointer',
                                background: justCopied ? 'rgba(201,168,76,0.2)' : 'rgba(201,168,76,0.08)',
                                border: `1px solid rgba(201,168,76,0.3)`,
                                color: GOLD, whiteSpace: 'nowrap', transition: 'all 0.15s',
                              }}
                            >
                              {justCopied ? '✓ Copied' : 'Share Report ↗'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Feature 10: Reads-per-day Trend ── */}
            <div style={{ marginBottom: 32 }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                ◈ Reads Per Day — Last 14 Days
              </div>
              {trendData.every(d => d.count === 0) ? (
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED }}>No reads in the last 14 days.</div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 80 }}>
                  {trendData.map(d => {
                    const barH = Math.max(2, (d.count / maxTrendCount) * 72);
                    const label = d.day.slice(5); // MM-DD
                    return (
                      <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }} title={`${d.day}: ${d.count} reads`}>
                        <div style={{ fontFamily: NU, fontSize: 8, color: d.count > 0 ? GOLD : MUTED }}>
                          {d.count > 0 ? d.count : ''}
                        </div>
                        <div style={{
                          width: '100%', height: barH,
                          background: d.count > 0
                            ? 'linear-gradient(to top, rgba(201,168,76,0.8), rgba(201,168,76,0.35))'
                            : 'rgba(255,255,255,0.06)',
                          borderRadius: '2px 2px 0 0',
                          transition: 'height 0.3s ease',
                        }} />
                        <div style={{ fontFamily: NU, fontSize: 7, color: MUTED, writingMode: 'vertical-rl', transform: 'rotate(180deg)', height: 20, overflow: 'hidden' }}>
                          {label}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Feature 11: Audience Breakdown ── */}
            {sessions.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                  ◎ Audience
                </div>
                <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                  {/* Device split */}
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Device</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {audienceData.devices.map(d => (
                        <div key={d.label} style={{
                          fontFamily: NU, fontSize: 10, padding: '4px 10px', borderRadius: 20,
                          background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff',
                        }}>
                          {d.label} <span style={{ color: GOLD }}>{d.pct}%</span>
                        </div>
                      ))}
                      {audienceData.devices.length === 0 && <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>No data</span>}
                    </div>
                  </div>
                  {/* Browser split */}
                  <div style={{ flex: '1 1 180px' }}>
                    <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Browser</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {audienceData.browsers.map(d => (
                        <div key={d.label} style={{
                          fontFamily: NU, fontSize: 10, padding: '4px 10px', borderRadius: 20,
                          background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`, color: '#fff',
                        }}>
                          {d.label} <span style={{ color: GOLD }}>{d.pct}%</span>
                        </div>
                      ))}
                      {audienceData.browsers.length === 0 && <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>No data</span>}
                    </div>
                  </div>
                  {/* Top referrers */}
                  <div style={{ flex: '1 1 200px' }}>
                    <div style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Top Referrers</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      {audienceData.referrers.map(d => (
                        <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 12, background: 'rgba(255,255,255,0.04)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ width: `${d.pct}%`, height: '100%', background: 'rgba(201,168,76,0.45)', borderRadius: 2 }} />
                          </div>
                          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, width: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{d.label}</span>
                          <span style={{ fontFamily: NU, fontSize: 9, color: GOLD, width: 28, textAlign: 'right' }}>{d.pct}%</span>
                        </div>
                      ))}
                      {audienceData.referrers.length === 0 && <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>No data</span>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {sessions.length === 0 && (
              <div style={{
                padding: '32px 24px', textAlign: 'center',
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER}`, borderRadius: 6,
              }}>
                <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: MUTED, marginBottom: 8 }}>
                  No reads recorded yet.
                </div>
                <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, lineHeight: 1.6 }}>
                  Analytics will appear here once readers start opening this issue. Make sure the issue is published and accessible.
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
