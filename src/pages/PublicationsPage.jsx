// ─── src/pages/PublicationsPage.jsx ──────────────────────────────────────────
// Public luxury magazine landing page.
// Route: /publications
// Cinematic hero with latest cover + premium issue grid.

import { useState, useEffect, useRef } from 'react';
import { fetchIssues } from '../services/magazineIssuesService';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Jost', sans-serif)";
const BG   = '#080706';

// ── Helpers ───────────────────────────────────────────────────────────────────
function seasonLabel(issue) {
  const parts = [];
  if (issue.season) parts.push(issue.season);
  if (issue.year)   parts.push(issue.year);
  return parts.join(' ');
}

function issueLabel(issue) {
  const parts = [];
  if (issue.issue_number) parts.push(`Issue ${String(issue.issue_number).padStart(2, '0')}`);
  const sl = seasonLabel(issue);
  if (sl) parts.push(sl);
  return parts.join(' · ');
}

// ── Scroll-down chevron ───────────────────────────────────────────────────────
function ScrollChevron({ targetId }) {
  return (
    <button
      onClick={() => {
        const el = document.getElementById(targetId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }}
      style={{
        position:   'absolute',
        bottom:     32,
        left:       '50%',
        transform:  'translateX(-50%)',
        background: 'none',
        border:     'none',
        cursor:     'pointer',
        padding:    8,
        display:    'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap:        4,
        animation:  'lwdChevronBounce 2s ease-in-out infinite',
      }}
      aria-label="Scroll to all issues"
    >
      <svg width="20" height="12" viewBox="0 0 20 12" fill="none">
        <path d="M1 1L10 10L19 1" stroke="rgba(201,168,76,0.6)" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
      <style>{`
        @keyframes lwdChevronBounce {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
          50%       { transform: translateX(-50%) translateY(6px); opacity: 1; }
        }
      `}</style>
    </button>
  );
}

// ── Back link ─────────────────────────────────────────────────────────────────
function BackLink({ onBack }) {
  return (
    <button
      onClick={() => {
        if (onBack) onBack();
        else window.history.back();
      }}
      style={{
        position:      'fixed',
        top:           24,
        left:          24,
        zIndex:        100,
        background:    'none',
        border:        'none',
        cursor:        'pointer',
        display:       'flex',
        alignItems:    'center',
        gap:           8,
        fontFamily:    NU,
        fontSize:      11,
        fontWeight:    500,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color:         'rgba(255,255,255,0.7)',
        padding:       '6px 0',
        transition:    'color 0.2s',
      }}
      onMouseEnter={e => e.currentTarget.style.color = GOLD}
      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
    >
      ← <span>LWD</span>
    </button>
  );
}

// ── Hero section ──────────────────────────────────────────────────────────────
function Hero({ featured, onRead, isMobile }) {
  const hasImage = !!(featured && featured.cover_image);
  const label    = featured ? issueLabel(featured) : '';

  // Noise SVG pattern for when there is no cover image
  const noiseBg = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E")`;

  return (
    <div style={{
      position:   'relative',
      height:     '100vh',
      minHeight:  600,
      background: BG,
      overflow:   'hidden',
      display:    'flex',
      alignItems: 'center',
    }}>
      {/* Background cover image (right side) */}
      {hasImage ? (
        <>
          <img
            src={featured.cover_image}
            alt={featured.title || 'Latest issue'}
            style={{
              position:   'absolute',
              inset:      0,
              width:      '100%',
              height:     '100%',
              objectFit:  'cover',
              objectPosition: 'right center',
              opacity:    isMobile ? 0.18 : 1,
            }}
          />
          <div style={{
            position:   'absolute',
            inset:      0,
            background: isMobile
              ? `linear-gradient(to bottom, rgba(8,7,6,0.95) 0%, rgba(8,7,6,0.85) 100%)`
              : `linear-gradient(to right, rgba(8,7,6,0.97) 45%, rgba(8,7,6,0.3) 100%)`,
          }} />
        </>
      ) : (
        <div style={{
          position:   'absolute',
          inset:      0,
          backgroundImage: noiseBg,
          backgroundRepeat: 'repeat',
        }} />
      )}

      {/* Left-side content */}
      <div style={{
        position:  'relative',
        zIndex:    2,
        maxWidth:  isMobile ? '100%' : 600,
        padding:   isMobile ? '100px 24px 80px' : '0 0 0 clamp(40px, 7vw, 120px)',
      }}>
        {/* Eyebrow */}
        <div style={{
          fontFamily:    NU,
          fontSize:      9,
          fontWeight:    600,
          color:         GOLD,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          marginBottom:  16,
        }}>
          ✦&nbsp;&nbsp;The Magazine
        </div>

        {/* Issue label */}
        {label && (
          <div style={{
            fontFamily:    NU,
            fontSize:      11,
            color:         'rgba(255,255,255,0.45)',
            letterSpacing: '0.08em',
            marginBottom:  20,
          }}>
            {label}
          </div>
        )}

        {/* Title */}
        <h1 style={{
          fontFamily:    GD,
          fontSize:      'clamp(52px, 7vw, 88px)',
          fontWeight:    300,
          fontStyle:     'italic',
          color:         '#fff',
          margin:        '0 0 24px',
          letterSpacing: '0.02em',
          lineHeight:    1.05,
        }}>
          {featured ? (featured.title || 'The Magazine') : 'The Magazine'}
        </h1>

        {/* Excerpt */}
        {featured && featured.excerpt && (
          <p style={{
            fontFamily:    NU,
            fontSize:      15,
            color:         'rgba(255,255,255,0.6)',
            maxWidth:      480,
            lineHeight:    1.65,
            margin:        '0 0 36px',
            display:       '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow:      'hidden',
          }}>
            {featured.excerpt}
          </p>
        )}

        {!featured && (
          <p style={{
            fontFamily:    NU,
            fontSize:      15,
            color:         'rgba(255,255,255,0.6)',
            maxWidth:      480,
            lineHeight:    1.65,
            margin:        '0 0 36px',
          }}>
            Immersive editorial — curated for couples planning exceptional celebrations.
          </p>
        )}

        {/* CTA row */}
        <div style={{
          display:    'flex',
          alignItems: 'center',
          gap:        28,
          flexWrap:   'wrap',
        }}>
          {featured && onRead && (
            <button
              onClick={() => onRead(featured.slug)}
              style={{
                background:    GOLD,
                color:         '#080706',
                fontFamily:    NU,
                fontSize:      12,
                fontWeight:    600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding:       '14px 32px',
                border:        'none',
                cursor:        'pointer',
                transition:    'opacity 0.2s, transform 0.2s',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '0.88'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'none'; }}
            >
              Read Now →
            </button>
          )}

          <button
            onClick={() => {
              const el = document.getElementById('all-issues');
              if (el) el.scrollIntoView({ behavior: 'smooth' });
            }}
            style={{
              background:    'none',
              border:        'none',
              cursor:        'pointer',
              fontFamily:    NU,
              fontSize:      12,
              color:         'rgba(255,255,255,0.5)',
              letterSpacing: '0.08em',
              padding:       0,
              transition:    'color 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'rgba(255,255,255,0.9)'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
          >
            ↓ All Issues
          </button>
        </div>
      </div>

      {/* Scroll chevron */}
      <ScrollChevron targetId="all-issues" />
    </div>
  );
}

// ── Skeleton card ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{
        position:       'relative',
        paddingBottom:  '141.4%',
        background:     '#1a1612',
        animation:      'lwdSkeletonPulse 1.6s ease-in-out infinite',
      }} />
      <div style={{ padding: '14px 0 0' }}>
        <div style={{
          height:     10,
          width:      '50%',
          background: '#1a1612',
          marginBottom: 10,
          animation:  'lwdSkeletonPulse 1.6s ease-in-out infinite',
        }} />
        <div style={{
          height:     18,
          width:      '80%',
          background: '#1a1612',
          animation:  'lwdSkeletonPulse 1.6s ease-in-out infinite 0.2s',
        }} />
      </div>
      <style>{`
        @keyframes lwdSkeletonPulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.7; }
        }
      `}</style>
    </div>
  );
}

// ── Issue card ────────────────────────────────────────────────────────────────
function IssueCard({ issue, onRead, isLatest }) {
  const [hovered, setHovered] = useState(false);
  const sl = seasonLabel(issue);

  return (
    <div
      onClick={() => onRead && onRead(issue.slug)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        cursor:        'pointer',
        display:       'flex',
        flexDirection: 'column',
        transition:    'transform 0.3s ease',
        transform:     hovered ? 'translateY(-6px)' : 'none',
      }}
    >
      {/* Cover wrapper — A4 ratio */}
      <div style={{
        position:      'relative',
        paddingBottom: '141.4%',
        background:    '#1a1612',
        border:        `1px solid ${hovered ? 'rgba(201,168,76,0.5)' : 'rgba(201,168,76,0.1)'}`,
        transition:    'border-color 0.25s',
        overflow:      'hidden',
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
              transform:  hovered ? 'scale(1.04)' : 'scale(1)',
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
            gap:            10,
          }}>
            <span style={{ fontSize: 32, opacity: 0.15, color: GOLD }}>◈</span>
          </div>
        )}

        {/* Latest badge */}
        {isLatest && (
          <div style={{
            position:      'absolute',
            top:           12,
            left:          12,
            background:    GOLD,
            color:         '#080706',
            fontFamily:    NU,
            fontSize:      8,
            fontWeight:    700,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding:       '4px 8px',
          }}>
            ✦ Latest
          </div>
        )}

        {/* Premium badge */}
        {issue.access_level === 'premium' && (
          <div style={{
            position:      'absolute',
            top:           12,
            right:         12,
            background:    'rgba(8,7,6,0.85)',
            border:        `1px solid ${GOLD}`,
            color:         GOLD,
            fontFamily:    NU,
            fontSize:      8,
            fontWeight:    600,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            padding:       '4px 8px',
          }}>
            ✦ Premium
          </div>
        )}
      </div>

      {/* Info strip */}
      <div style={{ padding: '14px 0 0' }}>
        {/* Issue number + season row */}
        <div style={{
          display:       'flex',
          alignItems:    'center',
          gap:           8,
          marginBottom:  8,
        }}>
          {issue.issue_number && (
            <span style={{
              background:    GOLD,
              color:         '#080706',
              fontFamily:    NU,
              fontSize:      8,
              fontWeight:    700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding:       '3px 7px',
            }}>
              Issue {issue.issue_number}
            </span>
          )}
          {sl && (
            <span style={{
              fontFamily:    NU,
              fontSize:      9,
              fontWeight:    600,
              color:         GOLD,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
            }}>
              {sl}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 style={{
          fontFamily:        GD,
          fontSize:          17,
          fontWeight:        400,
          fontStyle:         'italic',
          color:             '#fff',
          margin:            '0 0 10px',
          letterSpacing:     '0.02em',
          lineHeight:        1.3,
          display:           '-webkit-box',
          WebkitLineClamp:   2,
          WebkitBoxOrient:   'vertical',
          overflow:          'hidden',
        }}>
          {issue.title || 'Untitled Issue'}
        </h3>

        {/* Read label — fades in on hover */}
        <div style={{
          fontFamily:    NU,
          fontSize:      10,
          fontWeight:    600,
          color:         GOLD,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          opacity:       hovered ? 1 : 0,
          transition:    'opacity 0.2s',
        }}>
          Read →
        </div>
      </div>
    </div>
  );
}

// ── Section header ────────────────────────────────────────────────────────────
function SectionHeader({ title }) {
  return (
    <div style={{
      display:    'flex',
      alignItems: 'center',
      gap:        24,
      marginBottom: 48,
    }}>
      <h2 style={{
        fontFamily:    GD,
        fontSize:      36,
        fontWeight:    300,
        fontStyle:     'italic',
        color:         '#fff',
        margin:        0,
        letterSpacing: '0.02em',
        whiteSpace:    'nowrap',
      }}>
        {title}
      </h2>
      <div style={{
        flex:       1,
        height:     1,
        background: 'rgba(201,168,76,0.25)',
      }} />
    </div>
  );
}

// ── Footer strip ──────────────────────────────────────────────────────────────
function FooterStrip() {
  return (
    <div style={{
      background:  BG,
      height:      60,
      display:     'flex',
      alignItems:  'center',
      justifyContent: 'space-between',
      padding:     '0 32px',
      borderTop:   '1px solid rgba(201,168,76,0.1)',
    }}>
      <span style={{
        fontFamily:    NU,
        fontSize:      11,
        color:         'rgba(255,255,255,0.35)',
        letterSpacing: '0.06em',
      }}>
        Luxury Wedding Directory · The Magazine
      </span>
      <span style={{
        fontFamily:    NU,
        fontSize:      11,
        color:         'rgba(255,255,255,0.25)',
      }}>
        © 2026
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicationsPage({ onRead, onBack, footerNav }) {
  const [issues, setIssues]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    setIsMobile(mq.matches);
    const handler = e => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchIssues().then(({ data, error: err }) => {
      if (cancelled) return;
      if (err) {
        setError('Failed to load issues.');
        setLoading(false);
        return;
      }
      const published = (data || [])
        .filter(i => i.status === 'published')
        .sort((a, b) => {
          // Sort by issue_number desc, fallback to created_at desc
          const na = a.issue_number ?? 0;
          const nb = b.issue_number ?? 0;
          if (nb !== na) return nb - na;
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        });
      setIssues(published);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  const handleRead = (slug) => {
    if (onRead) onRead(slug);
  };

  const featured = issues[0] || null;

  return (
    <div style={{ background: BG, minHeight: '100vh', color: '#fff', fontFamily: NU }}>
      {/* Fixed back link */}
      <BackLink onBack={onBack} />

      {/* Cinematic hero */}
      <Hero
        featured={loading ? null : featured}
        onRead={handleRead}
        isMobile={isMobile}
      />

      {/* All Issues section */}
      <section id="all-issues" style={{ padding: '80px 0 40px' }}>
        <div style={{
          maxWidth: 1280,
          margin:   '0 auto',
          padding:  isMobile ? '0 20px' : '0 32px',
        }}>
          <SectionHeader title="All Issues" />

          {/* Loading skeletons */}
          {loading && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '160px' : '220px'}, 1fr))`,
              gap:                 28,
            }}>
              {[1, 2, 3, 4].map(n => <SkeletonCard key={n} />)}
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div style={{
              textAlign:  'center',
              padding:    '60px 0',
              fontFamily: NU,
              fontSize:   14,
              color:      'rgba(255,100,100,0.75)',
            }}>
              {error}
            </div>
          )}

          {/* Empty */}
          {!loading && !error && issues.length === 0 && (
            <div style={{
              display:        'flex',
              flexDirection:  'column',
              alignItems:     'center',
              justifyContent: 'center',
              padding:        '80px 24px',
              textAlign:      'center',
            }}>
              <div style={{ fontSize: 40, marginBottom: 20, opacity: 0.2, color: GOLD }}>◈</div>
              <h2 style={{
                fontFamily: GD,
                fontSize:   26,
                fontWeight: 300,
                fontStyle:  'italic',
                color:      '#fff',
                margin:     '0 0 12px',
              }}>
                No Issues Published Yet
              </h2>
              <p style={{
                fontFamily: NU,
                fontSize:   14,
                color:      'rgba(255,255,255,0.4)',
                maxWidth:   340,
                lineHeight: 1.6,
              }}>
                The latest edition of Luxury Wedding Directory magazine will appear here when published.
              </p>
            </div>
          )}

          {/* Grid */}
          {!loading && !error && issues.length > 0 && (
            <div style={{
              display:             'grid',
              gridTemplateColumns: `repeat(auto-fill, minmax(${isMobile ? '160px' : '220px'}, 1fr))`,
              gap:                 28,
              paddingBottom:       40,
            }}>
              {issues.map((issue, idx) => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  onRead={handleRead}
                  isLatest={idx === 0}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Footer strip */}
      <FooterStrip />
    </div>
  );
}
