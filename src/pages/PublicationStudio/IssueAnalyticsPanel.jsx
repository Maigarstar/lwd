// ─── IssueAnalyticsPanel.jsx ─────────────────────────────────────────────────
// Full-screen overlay showing read analytics for a published issue.
// Stats, page heatmap, vendor reach, export report.

import { useState, useEffect, useMemo } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, NU, GD } from './PageDesigner/designerConstants';
import { supabase } from '../../lib/supabaseClient';

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

export default function IssueAnalyticsPanel({ issueId, issueName, pages, onClose }) {
  const [loading,    setLoading]    = useState(true);
  const [sessions,   setSessions]   = useState([]);   // unique session_ids
  const [pageViews,  setPageViews]  = useState([]);   // { page_number, count }
  const [avgDuration, setAvgDuration] = useState(null); // ms

  useEffect(() => {
    if (!issueId) return;
    (async () => {
      setLoading(true);

      // 1. All read events for this issue
      const { data: events } = await supabase
        .from('magazine_read_events')
        .select('session_id, event_type, page_number, duration_ms, created_at')
        .eq('issue_id', issueId);

      if (!events) { setLoading(false); return; }

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
              <div style={{ marginBottom: 24 }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>
                  ✦ Vendor Reach
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vendorReach.map((v, i) => (
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
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: GOLD, lineHeight: 1 }}>
                          {v.views}
                        </div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 2 }}>
                          {v.pct}% of readers
                        </div>
                      </div>
                    </div>
                  ))}
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
