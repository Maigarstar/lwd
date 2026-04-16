// ─── src/pages/PublicationsReaderPage.jsx ────────────────────────────────────
// Full-screen flipbook reader for a single published magazine issue.
// Route: /publications/[slug]
//
// Layout:
//   Desktop: double-page spread (left + right pages side-by-side)
//   Mobile:  single page, full-width
//
// Navigation: chevron buttons, keyboard ←/→ arrows, touch swipe

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchIssueBySlug } from '../services/magazineIssuesService';
import { fetchPages }       from '../services/magazinePageService';
import { trackIssueView, trackPageTurn, trackDownload } from '../services/publicationsAnalyticsService';

const GOLD      = '#C9A84C';
const GD        = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU        = "var(--font-body, 'Jost', sans-serif)";
const BG        = '#080706';
const MUTED     = 'rgba(255,255,255,0.38)';
const CTRL_BG   = 'rgba(0,0,0,0.55)';
const CTRL_HOV  = 'rgba(201,168,76,0.18)';

// ── Loading spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100vh',
      background:     BG,
      gap:            20,
    }}>
      <div style={{ fontSize: 32, opacity: 0.3, animation: 'spin 2s linear infinite' }}>◈</div>
      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      <span style={{ fontFamily: NU, fontSize: 11, color: MUTED, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
        Loading issue…
      </span>
    </div>
  );
}

// ── Error screen ──────────────────────────────────────────────────────────────
function ErrorScreen({ message, onBack }) {
  return (
    <div style={{
      display:        'flex',
      flexDirection:  'column',
      alignItems:     'center',
      justifyContent: 'center',
      height:         '100vh',
      background:     BG,
      gap:            16,
      padding:        24,
      textAlign:      'center',
    }}>
      <span style={{ fontSize: 36, opacity: 0.25 }}>◈</span>
      <p style={{ fontFamily: NU, fontSize: 14, color: MUTED, maxWidth: 320 }}>{message}</p>
      <button
        onClick={onBack}
        style={{
          fontFamily:    NU,
          fontSize:      11,
          fontWeight:    600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color:         GOLD,
          background:    'none',
          border:        `1px solid ${GOLD}`,
          padding:       '9px 20px',
          borderRadius:  1,
          cursor:        'pointer',
          marginTop:     8,
        }}
      >
        Back to Publications
      </button>
    </div>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({ issue, onBack, onDownload }) {
  const [dlHover, setDlHover] = useState(false);
  return (
    <div style={{
      position:       'fixed',
      top:            0,
      left:           0,
      right:          0,
      zIndex:         100,
      height:         52,
      background:     'linear-gradient(to bottom, rgba(8,7,6,0.96) 0%, rgba(8,7,6,0) 100%)',
      display:        'flex',
      alignItems:     'center',
      padding:        '0 20px',
      gap:            16,
    }}>
      {/* Back button */}
      <button
        onClick={onBack}
        title="Back to publications"
        style={{
          background:    CTRL_BG,
          border:        '1px solid rgba(255,255,255,0.1)',
          borderRadius:  2,
          color:         'rgba(255,255,255,0.7)',
          width:         36,
          height:        36,
          display:       'flex',
          alignItems:    'center',
          justifyContent:'center',
          cursor:        'pointer',
          flexShrink:    0,
          fontSize:      16,
          transition:    'background 0.15s',
        }}
      >
        ←
      </button>

      {/* Issue info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily:    NU,
          fontSize:      9,
          fontWeight:    600,
          color:         GOLD,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom:  2,
        }}>
          {[issue.issue_number && `Issue ${issue.issue_number}`, issue.season, issue.year]
            .filter(Boolean).join(' · ')}
        </div>
        <div style={{
          fontFamily:  GD,
          fontSize:    16,
          fontWeight:  400,
          color:       '#fff',
          whiteSpace:  'nowrap',
          overflow:    'hidden',
          textOverflow:'ellipsis',
        }}>
          {issue.title || 'Untitled Issue'}
        </div>
      </div>

      {/* LWD logotype */}
      <div style={{
        fontFamily:    GD,
        fontSize:      14,
        fontWeight:    400,
        fontStyle:     'italic',
        color:         GOLD,
        letterSpacing: '0.04em',
        flexShrink:    0,
        display:       'none',
      }}
        className="pub-reader-brand"
      >
        LWD
      </div>

      {/* PDF download button (only if issue has a PDF) */}
      {issue.pdf_url && onDownload && (
        <button
          onClick={onDownload}
          onMouseEnter={() => setDlHover(true)}
          onMouseLeave={() => setDlHover(false)}
          title="Download PDF"
          style={{
            background:    dlHover ? 'rgba(201,168,76,0.15)' : CTRL_BG,
            border:        `1px solid ${dlHover ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius:  2,
            color:         dlHover ? GOLD : 'rgba(255,255,255,0.6)',
            fontFamily:    NU,
            fontSize:      9,
            fontWeight:    600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            padding:       '7px 14px',
            cursor:        'pointer',
            flexShrink:    0,
            transition:    'all 0.15s',
            display:       'none',
          }}
          className="pub-reader-dl"
        >
          ↓ PDF
        </button>
      )}

      <style>{`
        @media (min-width: 640px) {
          .pub-reader-brand { display: block !important; }
          .pub-reader-dl    { display: block !important; }
        }
      `}</style>
    </div>
  );
}

// ── Page image ────────────────────────────────────────────────────────────────
function PageImage({ page, side }) {
  const [loaded, setLoaded] = useState(false);

  if (!page) {
    // Blank page (e.g. even spread when there's no matching partner)
    return (
      <div style={{
        flex:       1,
        background: '#0F0D0A',
        border:     side === 'left'
          ? '1px solid rgba(255,255,255,0.04)'
          : '1px solid rgba(255,255,255,0.04)',
      }} />
    );
  }

  return (
    <div style={{
      flex:       1,
      position:   'relative',
      background: '#0F0D0A',
      overflow:   'hidden',
    }}>
      {!loaded && (
        <div style={{
          position:       'absolute',
          inset:          0,
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <span style={{ fontSize: 20, opacity: 0.15 }}>◈</span>
        </div>
      )}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        onLoad={() => setLoaded(true)}
        style={{
          width:      '100%',
          height:     '100%',
          objectFit:  'contain',
          display:    'block',
          opacity:    loaded ? 1 : 0,
          transition: 'opacity 0.25s',
        }}
      />
    </div>
  );
}

// ── Nav button ────────────────────────────────────────────────────────────────
function NavButton({ direction, onClick, disabled }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position:       'absolute',
        top:            '50%',
        transform:      'translateY(-50%)',
        [direction === 'prev' ? 'left' : 'right']: 16,
        zIndex:         50,
        width:          48,
        height:         48,
        borderRadius:   '50%',
        background:     hovered ? CTRL_HOV : CTRL_BG,
        border:         `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : 'rgba(255,255,255,0.1)'}`,
        color:          disabled ? 'rgba(255,255,255,0.15)' : (hovered ? GOLD : 'rgba(255,255,255,0.7)'),
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         disabled ? 'default' : 'pointer',
        fontSize:       20,
        transition:     'all 0.15s',
        userSelect:     'none',
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ── Page counter ──────────────────────────────────────────────────────────────
function PageCounter({ currentPage, totalPages, isDouble, onJump }) {
  const end = isDouble ? Math.min(currentPage + 1, totalPages) : currentPage;
  const label = isDouble && end > currentPage
    ? `${currentPage} – ${end}`
    : `${currentPage}`;

  return (
    <div style={{
      position:       'fixed',
      bottom:         20,
      left:           '50%',
      transform:      'translateX(-50%)',
      zIndex:         100,
      background:     CTRL_BG,
      border:         '1px solid rgba(255,255,255,0.1)',
      borderRadius:   20,
      padding:        '6px 18px',
      display:        'flex',
      alignItems:     'center',
      gap:            8,
    }}>
      <span style={{
        fontFamily: NU,
        fontSize:   11,
        color:      'rgba(255,255,255,0.7)',
        letterSpacing: '0.04em',
      }}>
        {label}
      </span>
      <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10 }}>/</span>
      <span style={{
        fontFamily: NU,
        fontSize:   11,
        color:      MUTED,
        letterSpacing: '0.04em',
      }}>
        {totalPages}
      </span>
    </div>
  );
}

// ── Thumbnail strip ───────────────────────────────────────────────────────────
function ThumbnailStrip({ pages, currentPage, onJump, isDesktop }) {
  const [open, setOpen] = useState(false);

  if (!isDesktop) return null;

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position:    'fixed',
          bottom:      20,
          right:       20,
          zIndex:      110,
          background:  CTRL_BG,
          border:      '1px solid rgba(255,255,255,0.1)',
          borderRadius: 2,
          color:       open ? GOLD : 'rgba(255,255,255,0.6)',
          fontFamily:  NU,
          fontSize:    9,
          fontWeight:  600,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          padding:     '7px 14px',
          cursor:      'pointer',
          transition:  'color 0.15s',
        }}
      >
        {open ? '✕ Close' : '⊞ Pages'}
      </button>

      {/* Strip */}
      {open && (
        <div style={{
          position:   'fixed',
          bottom:     60,
          left:       0,
          right:      0,
          zIndex:     105,
          background: 'rgba(8,7,6,0.96)',
          borderTop:  '1px solid rgba(255,255,255,0.08)',
          padding:    '12px 20px',
          display:    'flex',
          gap:        8,
          overflowX:  'auto',
        }}>
          {pages.map(p => (
            <button
              key={p.page_number}
              onClick={() => { onJump(p.page_number); setOpen(false); }}
              title={`Page ${p.page_number}`}
              style={{
                flexShrink:  0,
                width:       52,
                height:      74, // A4 ≈ 1.414
                background:  '#1A1612',
                border:      `1px solid ${p.page_number === currentPage ? GOLD : 'rgba(255,255,255,0.08)'}`,
                borderRadius: 1,
                overflow:    'hidden',
                cursor:      'pointer',
                padding:     0,
                position:    'relative',
              }}
            >
              {p.thumbnail_url ? (
                <img
                  src={p.thumbnail_url}
                  alt={`p${p.page_number}`}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <div style={{
                  width:      '100%',
                  height:     '100%',
                  display:    'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: NU,
                  fontSize:   9,
                  color:      MUTED,
                }}>
                  {p.page_number}
                </div>
              )}
              {/* Page number label */}
              <div style={{
                position:  'absolute',
                bottom:    0,
                left:      0,
                right:     0,
                background:'rgba(0,0,0,0.7)',
                textAlign: 'center',
                fontFamily: NU,
                fontSize:  8,
                color:     'rgba(255,255,255,0.6)',
                padding:   '2px 0',
              }}>
                {p.page_number}
              </div>
            </button>
          ))}
        </div>
      )}
    </>
  );
}

// ── Main reader component ─────────────────────────────────────────────────────
export default function PublicationsReaderPage({ slug, onBack }) {
  const [issue,   setIssue]   = useState(null);
  const [pages,   setPages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  // currentPage is 1-based; refers to the left page of a spread on desktop
  const [currentPage, setCurrentPage] = useState(1);
  const [isDesktop,   setIsDesktop]   = useState(() => window.innerWidth >= 900);

  // Touch tracking refs
  const touchStartX  = useRef(null);
  const touchStartY  = useRef(null);
  // Analytics: track when current page was entered (for dwell time)
  const pageEnteredAt = useRef(null);
  const prevPageRef   = useRef(null);

  // ── Responsive ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Load data ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;

    setLoading(true);
    setError(null);
    setCurrentPage(1);

    (async () => {
      const { data: issueData, error: issErr } = await fetchIssueBySlug(slug);
      if (cancelled) return;
      if (issErr || !issueData) {
        setError('Issue not found. It may have been unpublished.');
        setLoading(false);
        return;
      }
      setIssue(issueData);

      const { data: pagesData } = await fetchPages(issueData.id);
      if (cancelled) return;
      setPages(pagesData || []);
      setLoading(false);

      // Track issue view (fire-and-forget)
      trackIssueView(
        issueData.id,
        window.innerWidth >= 900 ? 'spread' : 'single',
      );
      pageEnteredAt.current = Date.now();
      prevPageRef.current   = 1;
    })();

    return () => { cancelled = true; };
  }, [slug]);

  // ── Navigation helpers ──────────────────────────────────────────────────────
  const totalPages = pages.length;

  /**
   * On desktop, step is 2 (spread); on mobile, step is 1.
   * Page 1 is always shown alone.
   */
  const step = isDesktop ? 2 : 1;

  const canPrev = currentPage > 1;
  const canNext = currentPage + (isDesktop ? 1 : 0) < totalPages;

  // Analytics helper: fire page_turn + dwell when navigating
  const firePageTurn = useCallback((newPage) => {
    if (!issue) return;
    const now      = Date.now();
    const dwell    = pageEnteredAt.current ? now - pageEnteredAt.current : 0;
    const prev     = prevPageRef.current;
    const mode     = isDesktop ? 'spread' : 'single';
    trackPageTurn(issue.id, newPage, mode, dwell, prev);
    pageEnteredAt.current = now;
    prevPageRef.current   = newPage;
  }, [issue, isDesktop]);

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    setCurrentPage(p => {
      const next = Math.max(1, p - step);
      firePageTurn(next);
      return next;
    });
  }, [canPrev, step, firePageTurn]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    setCurrentPage(p => {
      const next = Math.min(totalPages, p + step);
      firePageTurn(next);
      return next;
    });
  }, [canNext, step, totalPages, firePageTurn]);

  const goToPage = useCallback((n) => {
    const clamped = Math.max(1, Math.min(totalPages, n));
    firePageTurn(clamped);
    setCurrentPage(clamped);
  }, [totalPages, firePageTurn]);

  // ── Keyboard navigation ─────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'Escape')     onBack?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onBack]);

  // ── Touch/swipe ─────────────────────────────────────────────────────────────
  const onTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  };

  const onTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    // Only count horizontal swipes (dx > dy threshold)
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext(); // swipe left → next
    else        goPrev(); // swipe right → prev
  };

  // ── PDF download ───────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!issue?.pdf_url) return;
    trackDownload(issue.id);
    // Open PDF in new tab (browser will offer download or inline view)
    window.open(issue.pdf_url, '_blank', 'noreferrer');
  }, [issue]);

  // ── Derive current pages to display ────────────────────────────────────────
  // Pages array is ordered by page_number (1-based)
  const pageByNum = (n) => pages.find(p => p.page_number === n) || null;

  const leftPage  = isDesktop && currentPage > 1 ? pageByNum(currentPage)     : null;
  const rightPage = isDesktop
    ? (currentPage === 1 ? pageByNum(1) : pageByNum(currentPage + 1))
    : pageByNum(currentPage);

  // ── Renders ─────────────────────────────────────────────────────────────────
  if (loading) return <Spinner />;
  if (error)   return <ErrorScreen message={error} onBack={onBack} />;
  if (!issue)  return <ErrorScreen message="Issue not found." onBack={onBack} />;
  if (pages.length === 0) {
    return (
      <ErrorScreen
        message="This issue has no pages yet. Check back soon."
        onBack={onBack}
      />
    );
  }

  return (
    <div
      style={{
        position:   'fixed',
        inset:      0,
        background: BG,
        display:    'flex',
        flexDirection: 'column',
        overflow:   'hidden',
        userSelect: 'none',
      }}
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <TopBar issue={issue} onBack={onBack} onDownload={issue.pdf_url ? handleDownload : null} />

      {/* Main viewer area */}
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        isDesktop ? '60px 80px 60px' : '56px 0 48px',
        position:       'relative',
        overflow:       'hidden',
      }}>
        {/* Spread container */}
        <div style={{
          display:        'flex',
          height:         '100%',
          maxHeight:      '100%',
          width:          isDesktop ? (currentPage === 1 ? '50%' : '100%') : '100%',
          maxWidth:       isDesktop ? 1400 : 700,
          gap:            isDesktop && currentPage > 1 ? 2 : 0,
          boxShadow:      '0 8px 48px rgba(0,0,0,0.6)',
          background:     '#0F0D0A',
        }}>
          {/* Desktop: left page (not shown on page 1 — the cover is alone) */}
          {isDesktop && currentPage > 1 && (
            <PageImage page={leftPage} side="left" />
          )}

          {/* Right page (or single page on mobile) */}
          <PageImage page={rightPage} side="right" />
        </div>

        {/* Navigation buttons */}
        <NavButton direction="prev" onClick={goPrev} disabled={!canPrev} />
        <NavButton direction="next" onClick={goNext} disabled={!canNext} />
      </div>

      {/* Page counter */}
      <PageCounter
        currentPage={currentPage}
        totalPages={totalPages}
        isDouble={isDesktop && currentPage > 1}
      />

      {/* Thumbnail strip (desktop only) */}
      <ThumbnailStrip
        pages={pages}
        currentPage={currentPage}
        onJump={goToPage}
        isDesktop={isDesktop}
      />
    </div>
  );
}
