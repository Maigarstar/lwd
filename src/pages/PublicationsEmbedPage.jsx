// ─── src/pages/PublicationsEmbedPage.jsx ─────────────────────────────────────
// Minimal self-contained embed reader for /publications/embed/[slug]
// No TopBar, TOC, bookmarks, search, text mode, zoom/pan, paywall, social export,
// hotspot modals, credits drawer, download, or share.
// Analytics: one trackIssueView on mount only.

import { useState, useEffect, useRef, useCallback } from 'react';
import { fetchIssueBySlug } from '../services/magazineIssuesService';
import { fetchPages }       from '../services/magazinePageService';
import { trackIssueView }   from '../services/publicationsAnalyticsService';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD = '#C9A84C';
const BG   = '#080706';
const NU   = "var(--font-body, 'Jost', sans-serif)";
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";

// ── Page flip wrapper (desktop only) ─────────────────────────────────────────
function PageFlipWrapper({ flipDir, isFlipping, children }) {
  const prefersReduced = typeof window !== 'undefined'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (prefersReduced) return <>{children}</>;

  return (
    <div style={{
      width: '100%', height: '100%',
      position: 'relative',
      transformStyle: 'preserve-3d',
      animation: isFlipping
        ? `${flipDir === 'next' ? 'embedFlipForward' : 'embedFlipBackward'} 0.6s cubic-bezier(0.645,0.045,0.355,1.000) forwards`
        : 'none',
      willChange: isFlipping ? 'transform' : 'auto',
    }}>
      {children}
      <style>{`
        @keyframes embedFlipForward {
          0%   { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
          40%  { transform: rotateY(-70deg); box-shadow: 0 16px 80px rgba(0,0,0,0.5); }
          50%  { transform: rotateY(-90deg); box-shadow: 0 20px 100px rgba(0,0,0,0.6); }
          60%  { transform: rotateY(-70deg); box-shadow: 0 16px 80px rgba(0,0,0,0.4); }
          100% { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
        }
        @keyframes embedFlipBackward {
          0%   { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
          40%  { transform: rotateY(70deg);  box-shadow: 0 16px 80px rgba(0,0,0,0.5); }
          50%  { transform: rotateY(90deg);  box-shadow: 0 20px 100px rgba(0,0,0,0.6); }
          60%  { transform: rotateY(70deg);  box-shadow: 0 16px 80px rgba(0,0,0,0.4); }
          100% { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes embedFlipForward  { 0%, 100% { transform: none; } }
          @keyframes embedFlipBackward { 0%, 100% { transform: none; } }
        }
      `}</style>
    </div>
  );
}

// ── Page image ────────────────────────────────────────────────────────────────
function EmbedPageImage({ page, isPreload }) {
  if (!page) {
    return (
      <div style={{
        flex: 1, background: '#0F0D0A',
        border: '1px solid rgba(255,255,255,0.04)',
        minHeight: '100%',
      }} />
    );
  }

  if (!page.image_url) {
    return (
      <div style={{
        flex: 1, background: '#0F0D0A',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        minHeight: '100%',
      }}>
        <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Page {page.page_number}
        </span>
      </div>
    );
  }

  return (
    <img
      src={page.image_url}
      alt={`Page ${page.page_number}`}
      loading={isPreload ? 'eager' : 'lazy'}
      style={{
        flex: 1,
        width: '100%',
        height: '100%',
        objectFit: 'contain',
        display: 'block',
      }}
    />
  );
}

// ── Arrow button ──────────────────────────────────────────────────────────────
function ArrowBtn({ direction, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        position: 'absolute',
        top: '50%',
        [direction === 'prev' ? 'left' : 'right']: 12,
        transform: 'translateY(-50%)',
        zIndex: 50,
        width: 40,
        height: 40,
        borderRadius: '50%',
        background: disabled ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.55)',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.18)'}`,
        color: disabled ? 'rgba(255,255,255,0.2)' : '#fff',
        fontSize: 16,
        cursor: disabled ? 'default' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'background 0.15s',
      }}
      aria-label={direction === 'prev' ? 'Previous page' : 'Next page'}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PublicationsEmbedPage({ slug }) {
  const [issue,    setIssue]    = useState(null);
  const [pages,    setPages]    = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  const [currentPage,   setCurrentPage]   = useState(1);
  const [displayedPage, setDisplayedPage] = useState(1);
  const [flipDir,       setFlipDir]       = useState(null);
  const [isFlipping,    setIsFlipping]    = useState(false);
  const flipLockRef = useRef(false);

  const [isDesktop, setIsDesktop] = useState(() => window.innerWidth >= 768);

  // Read URL params
  const sp           = new URLSearchParams(window.location.search);
  const startPage    = parseInt(sp.get('page') || '1', 10);
  const controlsMode = sp.get('controls') || 'full';

  // Responsive
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Load data
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true); setError(null);

    (async () => {
      const { data: issueData, error: issErr } = await fetchIssueBySlug(slug);
      if (cancelled) return;
      if (issErr || !issueData) {
        setError('Issue not found.');
        setLoading(false);
        return;
      }
      setIssue(issueData);

      const { data: pagesData } = await fetchPages(issueData.id);
      if (cancelled) return;
      const allPages = pagesData || [];
      setPages(allPages);

      // Analytics — one fire only
      trackIssueView(issueData.id, 'embed');

      // Set start page
      const total = allPages.length;
      const initPage = !isNaN(startPage) && startPage >= 1 ? Math.min(startPage, total) : 1;
      setCurrentPage(initPage);
      setDisplayedPage(initPage);
      setLoading(false);
    })();

    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Sync displayedPage for non-animated navigation
  useEffect(() => {
    if (!isFlipping) {
      setDisplayedPage(currentPage);
    }
  }, [currentPage, isFlipping]);

  const totalPages = pages.length;
  const canPrev    = currentPage > 1;
  const canNext    = currentPage < totalPages;

  const pageByNum = (n) => pages.find(p => p.page_number === n) || null;

  const PAGE_RATIOS = { A4: 1.414, A5: 1.414, US_LETTER: 1.294, SQUARE: 1.0, TABLOID: 1.545 };
  const pageAspect = PAGE_RATIOS[issue?.page_size || 'A4'] || 1.414;

  const forceSpread    = issue?.spread_layout !== 'single';
  const useDoubleSpread = isDesktop && forceSpread;

  const leftPage  = useDoubleSpread && displayedPage > 1 ? pageByNum(displayedPage)     : null;
  const rightPage = useDoubleSpread
    ? (displayedPage === 1 ? pageByNum(1) : pageByNum(displayedPage + 1))
    : pageByNum(displayedPage);
  const isDoubleSpread = useDoubleSpread && displayedPage > 1;

  // Navigation
  const goPrev = useCallback(() => {
    if (!canPrev) return;
    if (flipLockRef.current || isFlipping) return;
    const newPage = Math.max(1, currentPage - (useDoubleSpread ? 2 : 1));

    if (!isDesktop) {
      setCurrentPage(newPage);
      return;
    }

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setCurrentPage(newPage); return; }

    setFlipDir('prev');
    setIsFlipping(true);
    flipLockRef.current = true;
    setTimeout(() => {
      setDisplayedPage(newPage);
      setCurrentPage(newPage);
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDir(null);
        flipLockRef.current = false;
      }, 300);
    }, 300);
  }, [canPrev, currentPage, useDoubleSpread, isFlipping, isDesktop]);

  const goNext = useCallback(() => {
    if (!canNext) return;
    if (flipLockRef.current || isFlipping) return;
    const newPage = Math.min(totalPages, currentPage + (useDoubleSpread ? 2 : 1));

    if (!isDesktop) {
      setCurrentPage(newPage);
      return;
    }

    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { setCurrentPage(newPage); return; }

    setFlipDir('next');
    setIsFlipping(true);
    flipLockRef.current = true;
    setTimeout(() => {
      setDisplayedPage(newPage);
      setCurrentPage(newPage);
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDir(null);
        flipLockRef.current = false;
      }, 300);
    }, 300);
  }, [canNext, currentPage, useDoubleSpread, totalPages, isFlipping, isDesktop]);

  // Preload adjacent pages
  useEffect(() => {
    if (!pages.length) return;
    const preload = (n) => {
      const p = pageByNum(n);
      if (p?.image_url) {
        const img = new Image();
        img.src = p.image_url;
      }
    };
    preload(currentPage);
    preload(currentPage + 1);
    preload(currentPage + 2);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pages]);

  if (loading) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.2em', textTransform: 'uppercase' }}>
          Loading…
        </div>
      </div>
    );
  }

  if (error || !issue) {
    return (
      <div style={{
        position: 'fixed', inset: 0,
        background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.4)', textAlign: 'center' }}>
          {error || 'Issue not found.'}
        </div>
      </div>
    );
  }

  // Spread dimensions
  const spreadWidth = useDoubleSpread
    ? (displayedPage === 1 ? '50%' : '100%')
    : 'auto';
  const spreadMaxWidth = useDoubleSpread
    ? 1400
    : `calc(100vh * ${1 / pageAspect})`;

  // Mobile fade transition
  const mobileTransitionStyle = !isDesktop ? {
    animation: 'embedFadeIn 0.2s ease forwards',
  } : {};

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: BG,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
    }}>
      <style>{`
        @keyframes embedFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Page display — fills viewport above branding bar */}
      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden',
        paddingBottom: 36, // space for branding bar
        perspective: '1200px',
      }}>
        {/* Spread */}
        <div style={{
          display: 'flex',
          height: '100%',
          maxHeight: '100%',
          width: spreadWidth,
          maxWidth: spreadMaxWidth,
          gap: isDoubleSpread ? 2 : 0,
          background: '#0F0D0A',
          ...mobileTransitionStyle,
        }}
          key={!isDesktop ? currentPage : undefined}
        >
          {isDesktop ? (
            <PageFlipWrapper flipDir={flipDir} isFlipping={isFlipping}>
              {useDoubleSpread && displayedPage > 1 && (
                <EmbedPageImage
                  page={leftPage}
                  isPreload={displayedPage <= currentPage + 2}
                />
              )}
              <EmbedPageImage
                page={rightPage}
                isPreload={true}
              />
            </PageFlipWrapper>
          ) : (
            <>
              {useDoubleSpread && displayedPage > 1 && (
                <EmbedPageImage page={leftPage} isPreload={false} />
              )}
              <EmbedPageImage page={rightPage} isPreload={true} />
            </>
          )}
        </div>

        {/* Prev / Next arrows — hidden when controls=none */}
        {controlsMode !== 'none' && (
          <>
            <ArrowBtn direction="prev" onClick={goPrev} disabled={!canPrev} />
            <ArrowBtn direction="next" onClick={goNext} disabled={!canNext} />
          </>
        )}

        {/* Page counter — shown in full and minimal modes */}
        {controlsMode !== 'none' && (
          <div style={{
            position: 'absolute',
            bottom: 44,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 50,
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.12em',
            color: 'rgba(255,255,255,0.45)',
            background: 'rgba(0,0,0,0.5)',
            padding: '4px 10px',
            borderRadius: 20,
            whiteSpace: 'nowrap',
            userSelect: 'none',
          }}>
            {currentPage} / {totalPages}
          </div>
        )}
      </div>

      {/* LWD branding bar */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: 36,
        zIndex: 60,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.7) 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        borderTop: '1px solid rgba(255,255,255,0.06)',
      }}>
        <span style={{
          fontFamily: GD,
          fontSize: 11,
          color: 'rgba(255,255,255,0.5)',
          letterSpacing: '0.08em',
          userSelect: 'none',
        }}>
          LWD · Luxury Wedding Directory
        </span>
        <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10 }}>|</span>
        <a
          href={`/publications/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 600,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: GOLD,
            textDecoration: 'none',
            opacity: 0.85,
          }}
        >
          View Full Issue →
        </a>
      </div>
    </div>
  );
}
