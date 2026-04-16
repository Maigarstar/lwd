// ─── src/pages/PublicationsPage.jsx ──────────────────────────────────────────
// Public listing of all published magazine issues.
// Route: /publications
// Displays a luxury grid of cover cards — each links to the reader.

import { useState, useEffect } from 'react';
import HomeNav from '../components/nav/HomeNav';
import { fetchIssues } from '../services/magazineIssuesService';

const GOLD   = '#C9A84C';
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU     = "var(--font-body, 'Jost', sans-serif)";
const BG     = '#0A0908';
const CARD   = '#14120F';
const BORDER = 'rgba(201,168,76,0.18)';
const MUTED  = 'rgba(255,255,255,0.42)';

// ── Season label ──────────────────────────────────────────────────────────────
function seasonLabel(issue) {
  const parts = [];
  if (issue.season) parts.push(issue.season);
  if (issue.year)   parts.push(issue.year);
  return parts.join(' ');
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      padding:        '120px 24px',
      textAlign:      'center',
    }}>
      <div style={{ fontSize: 48, marginBottom: 24, opacity: 0.3 }}>◈</div>
      <h2 style={{
        fontFamily: GD,
        fontSize:   28,
        fontWeight: 400,
        color:      '#fff',
        margin:     '0 0 12px',
        letterSpacing: '0.04em',
      }}>
        No Issues Published Yet
      </h2>
      <p style={{
        fontFamily: NU,
        fontSize:   15,
        color:      MUTED,
        maxWidth:   340,
        lineHeight: 1.6,
      }}>
        The latest edition of Luxury Wedding Directory magazine will appear here when published.
      </p>
    </div>
  );
}

// ── Issue card ────────────────────────────────────────────────────────────────
function IssueCard({ issue, onRead }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onRead(issue.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor:         'pointer',
        background:     CARD,
        border:         `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : BORDER}`,
        borderRadius:   2,
        overflow:       'hidden',
        transition:     'border-color 0.2s, transform 0.25s',
        transform:      hovered ? 'translateY(-4px)' : 'none',
        display:        'flex',
        flexDirection:  'column',
      }}
    >
      {/* Cover image */}
      <div style={{
        position:       'relative',
        paddingBottom:  '141.4%', // A4 ratio
        background:     '#1A1612',
        flexShrink:     0,
      }}>
        {issue.cover_image ? (
          <img
            src={issue.cover_image}
            alt={issue.title || 'Magazine cover'}
            style={{
              position:   'absolute',
              inset:      0,
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              transition: 'transform 0.4s ease',
              transform:  hovered ? 'scale(1.03)' : 'scale(1)',
            }}
          />
        ) : (
          <div style={{
            position:       'absolute',
            inset:          0,
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            flexDirection:  'column',
            gap:            12,
          }}>
            <span style={{ fontSize: 36, opacity: 0.2 }}>◈</span>
            <span style={{
              fontFamily:  NU,
              fontSize:    10,
              color:       MUTED,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              No Cover
            </span>
          </div>
        )}

        {/* Issue number badge */}
        {issue.issue_number && (
          <div style={{
            position:    'absolute',
            top:         12,
            left:        12,
            background:  GOLD,
            color:       '#000',
            fontFamily:  NU,
            fontSize:    9,
            fontWeight:  700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding:     '4px 8px',
            borderRadius: 1,
          }}>
            Issue {issue.issue_number}
          </div>
        )}
      </div>

      {/* Card footer */}
      <div style={{ padding: '16px 16px 18px' }}>
        {/* Season / year */}
        {seasonLabel(issue) && (
          <div style={{
            fontFamily:    NU,
            fontSize:      10,
            fontWeight:    600,
            color:         GOLD,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            marginBottom:  6,
          }}>
            {seasonLabel(issue)}
          </div>
        )}

        {/* Title */}
        <h3 style={{
          fontFamily:  GD,
          fontSize:    18,
          fontWeight:  400,
          color:       '#fff',
          margin:      '0 0 8px',
          letterSpacing: '0.02em',
          lineHeight:  1.3,
          // Two-line clamp
          display:           '-webkit-box',
          WebkitLineClamp:   2,
          WebkitBoxOrient:   'vertical',
          overflow:          'hidden',
        }}>
          {issue.title || 'Untitled Issue'}
        </h3>

        {/* Meta */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        12,
          marginTop:  'auto',
        }}>
          {issue.page_count > 0 && (
            <span style={{
              fontFamily: NU,
              fontSize:   11,
              color:      MUTED,
            }}>
              {issue.page_count} pages
            </span>
          )}
          <span style={{
            fontFamily:    NU,
            fontSize:      10,
            fontWeight:    600,
            color:         GOLD,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginLeft:    'auto',
            opacity:       hovered ? 1 : 0.7,
            transition:    'opacity 0.2s',
          }}>
            Read →
          </span>
        </div>
      </div>
    </div>
  );
}

// ── Hero header ───────────────────────────────────────────────────────────────
function Hero() {
  return (
    <div style={{
      padding:    '80px 0 60px',
      textAlign:  'center',
      borderBottom: `1px solid ${BORDER}`,
      marginBottom: 56,
    }}>
      {/* Eyebrow */}
      <div style={{
        fontFamily:    NU,
        fontSize:      10,
        fontWeight:    600,
        color:         GOLD,
        letterSpacing: '0.18em',
        textTransform: 'uppercase',
        marginBottom:  20,
      }}>
        ✦ &nbsp;Luxury Wedding Directory
      </div>

      <h1 style={{
        fontFamily:  GD,
        fontSize:    'clamp(40px, 6vw, 72px)',
        fontWeight:  300,
        fontStyle:   'italic',
        color:       '#fff',
        margin:      '0 0 20px',
        letterSpacing: '0.02em',
        lineHeight:  1.1,
      }}>
        The Magazine
      </h1>

      <p style={{
        fontFamily: NU,
        fontSize:   15,
        color:      MUTED,
        maxWidth:   440,
        margin:     '0 auto',
        lineHeight: 1.6,
      }}>
        Immersive editorial — curated for couples planning exceptional celebrations.
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicationsPage({ onRead, footerNav }) {
  const [issues, setIssues]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchIssues().then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) { setError('Failed to load issues.'); setLoading(false); return; }
      // Only show published issues on the public page
      setIssues((data || []).filter(i => i.status === 'published'));
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleRead = (slug) => {
    if (onRead) onRead(slug);
  };

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#fff' }}>
      {/* Nav */}
      <HomeNav footerNav={footerNav} darkMode />

      <div style={{
        maxWidth:  1200,
        margin:    '0 auto',
        padding:   '0 24px',
      }}>
        <Hero />

        {/* Loading */}
        {loading && (
          <div style={{
            display:        'flex',
            justifyContent: 'center',
            padding:        '80px 0',
          }}>
            <div style={{
              fontFamily: NU,
              fontSize:   12,
              color:      MUTED,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
            }}>
              Loading…
            </div>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div style={{
            textAlign:  'center',
            padding:    '80px 0',
            fontFamily: NU,
            fontSize:   14,
            color:      'rgba(255,80,80,0.8)',
          }}>
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && issues.length === 0 && <EmptyState />}

        {/* Grid */}
        {!loading && !error && issues.length > 0 && (
          <div style={{
            display:             'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
            gap:                 32,
            paddingBottom:       80,
          }}>
            {issues.map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onRead={handleRead}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
