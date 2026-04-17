// src/pages/PublicationStudio/EditorialCalendarPanel.jsx
// Full-screen editorial calendar showing all magazine issues on a timeline.

import { useState, useEffect, useMemo } from 'react';
import { fetchIssues } from '../../services/magazineIssuesService';

const GOLD   = '#C9A96E';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const BG     = '#0C0B09';
const SURF   = '#141210';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.45)';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

const STATUS_COLORS = {
  published: GOLD,
  draft:     'rgba(255,255,255,0.4)',
  archived:  'rgba(255,255,255,0.2)',
};

function getIssueDate(issue) {
  const raw = issue.scheduled_publish_at || issue.published_at || issue.created_at;
  if (!raw) return null;
  return new Date(raw);
}

function fmtShort(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function fmtFull(d) {
  if (!d) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// Returns a 6-row × 7-col matrix for a given year/month (0-indexed month)
function buildCalendarGrid(year, month) {
  const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  // Adjust so week starts on Monday (0=Mon)
  const startOffset = (firstDay === 0 ? 6 : firstDay - 1);

  const cells = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function EditorialCalendarPanel({ onSelectIssue, onClose }) {
  const [issues,  setIssues]  = useState([]);
  const [loading, setLoading] = useState(true);
  const [year,    setYear]    = useState(new Date().getFullYear());
  const [month,   setMonth]   = useState(new Date().getMonth()); // 0-indexed

  useEffect(() => {
    setLoading(true);
    fetchIssues().then(({ data }) => {
      setIssues(data || []);
      setLoading(false);
    });
  }, []);

  // Map issues to their date (year, month, day)
  const issuesByDate = useMemo(() => {
    const map = {}; // key: 'YYYY-MM-DD'
    issues.forEach(issue => {
      const d = getIssueDate(issue);
      if (!d) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!map[key]) map[key] = [];
      map[key].push(issue);
    });
    return map;
  }, [issues]);

  const calGrid = useMemo(() => buildCalendarGrid(year, month), [year, month]);

  const today = new Date();
  const isToday = (d) => d && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();

  function getDateKey(d) {
    return d ? `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}` : null;
  }

  // Upcoming: next 6 issues by date (future or past, ordered)
  const upcoming = useMemo(() => {
    return [...issues]
      .filter(i => getIssueDate(i))
      .sort((a, b) => getIssueDate(a) - getIssueDate(b))
      .slice(0, 6);
  }, [issues]);

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 400,
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: NU,
    }}>
      {/* Header */}
      <div style={{
        height: 56,
        flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        background: SURF,
        gap: 16,
      }}>
        <span style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, fontStyle: 'italic', color: '#fff' }}>
          ✦ Editorial Calendar
        </span>
        <div style={{ flex: 1 }} />
        <button
          onClick={onClose}
          style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}
        >
          ✕
        </button>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Calendar area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Month/Year nav */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
            <button onClick={() => setYear(y => y - 1)}
              style={navBtnStyle}>← {year - 1}</button>
            <button onClick={prevMonth} style={navBtnStyle}>‹</button>
            <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, fontStyle: 'italic', color: '#fff', minWidth: 180, textAlign: 'center' }}>
              {MONTHS[month]} {year}
            </div>
            <button onClick={nextMonth} style={navBtnStyle}>›</button>
            <button onClick={() => setYear(y => y + 1)}
              style={navBtnStyle}>{year + 1} →</button>
          </div>

          {loading ? (
            <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, textAlign: 'center', padding: 40 }}>Loading…</div>
          ) : (
            <div style={{ border: `1px solid ${BORDER}`, borderRadius: 6, overflow: 'hidden' }}>
              {/* Day headers */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', background: SURF }}>
                {DAY_LABELS.map(d => (
                  <div key={d} style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                    textTransform: 'uppercase', color: MUTED, textAlign: 'center',
                    padding: '8px 4px', borderBottom: `1px solid ${BORDER}`,
                  }}>
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar rows */}
              {calGrid.map((row, ri) => (
                <div key={ri} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)' }}>
                  {row.map((day, di) => {
                    const key = getDateKey(day);
                    const dayIssues = key ? (issuesByDate[key] || []) : [];
                    return (
                      <div key={di} style={{
                        minHeight: 72,
                        borderRight: di < 6 ? `1px solid ${BORDER}` : 'none',
                        borderBottom: ri < calGrid.length - 1 ? `1px solid ${BORDER}` : 'none',
                        padding: '6px 6px 4px',
                        background: isToday(day) ? 'rgba(201,168,76,0.05)' : 'transparent',
                        position: 'relative',
                      }}>
                        {day && (
                          <>
                            <div style={{
                              fontFamily: NU, fontSize: 11,
                              color: isToday(day) ? GOLD : 'rgba(255,255,255,0.35)',
                              fontWeight: isToday(day) ? 700 : 400,
                              marginBottom: 4,
                            }}>
                              {day}
                            </div>
                            {dayIssues.map(issue => (
                              <button
                                key={issue.id}
                                onClick={() => onSelectIssue(issue.id)}
                                title={issue.title || 'Untitled'}
                                style={{
                                  display: 'block',
                                  width: '100%',
                                  marginBottom: 2,
                                  padding: '2px 5px',
                                  borderRadius: 2,
                                  border: 'none',
                                  background: `${STATUS_COLORS[issue.status] || MUTED}22`,
                                  color: STATUS_COLORS[issue.status] || MUTED,
                                  fontFamily: NU,
                                  fontSize: 9,
                                  fontWeight: 600,
                                  letterSpacing: '0.02em',
                                  cursor: 'pointer',
                                  textAlign: 'left',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                  transition: 'opacity 0.12s',
                                }}
                              >
                                {issue.title || 'Untitled'}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right panel: Upcoming list */}
        <div style={{
          width: 260,
          flexShrink: 0,
          borderLeft: `1px solid ${BORDER}`,
          background: SURF,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          <div style={{ padding: '18px 16px 10px', borderBottom: `1px solid ${BORDER}` }}>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD }}>
              Upcoming Issues
            </div>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '10px 0' }}>
            {upcoming.length === 0 && !loading && (
              <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, padding: '20px 16px', textAlign: 'center' }}>
                No issues scheduled.
              </div>
            )}
            {upcoming.map(issue => {
              const d = getIssueDate(issue);
              return (
                <button
                  key={issue.id}
                  onClick={() => onSelectIssue(issue.id)}
                  style={{
                    display: 'block',
                    width: '100%',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    borderBottom: `1px solid ${BORDER}`,
                    padding: '10px 16px',
                    cursor: 'pointer',
                    transition: 'background 0.12s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                  <div style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                    textTransform: 'uppercase',
                    color: STATUS_COLORS[issue.status] || MUTED,
                    marginBottom: 3,
                  }}>
                    {issue.status} · {d ? fmtShort(d) : 'No date'}
                  </div>
                  <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>
                    {issue.title || 'Untitled'}
                  </div>
                  {d && (
                    <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 2 }}>
                      {fmtFull(d)}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Schedule New Issue button */}
          <div style={{ padding: '12px 16px', borderTop: `1px solid ${BORDER}` }}>
            <button
              onClick={() => onSelectIssue(null)}
              style={{
                width: '100%',
                fontFamily: NU,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                background: `${GOLD}14`,
                border: `1px solid ${GOLD}`,
                color: GOLD,
                padding: '9px 16px',
                borderRadius: 3,
                cursor: 'pointer',
              }}
            >
              + Schedule New Issue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const navBtnStyle = {
  fontFamily: "var(--font-body, 'Nunito Sans', sans-serif)",
  fontSize: 10,
  fontWeight: 600,
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
  color: 'rgba(255,255,255,0.6)',
  padding: '5px 12px',
  cursor: 'pointer',
};
