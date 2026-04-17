// ─── src/pages/PublicationsReaderPage.jsx ────────────────────────────────────
// Full-screen flipbook reader — Tier 1 Premium Reader
// Route: /publications/[slug]
//
// Features: zoom+pan, TOC panel, bookmarks, share, URL sync,
//           reader mode (dark/sepia), cinematic intro, reading progress bar,
//           enhanced page counter, keyboard shortcuts, pinch-to-zoom

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchIssueBySlug } from '../services/magazineIssuesService';
import { fetchPages }       from '../services/magazinePageService';
import { trackIssueView, trackPageTurn, trackDownload } from '../services/publicationsAnalyticsService';
import { supabase }         from '../lib/supabaseClient';
import SocialExportModal    from '../components/publications/SocialExportModal';
import IssueSearchPanel     from '../components/publications/IssueSearchPanel';
import TextModePanel        from '../components/publications/TextModePanel';
import EmailGate            from './PublicationsReader/EmailGate';

// ── Email gate config (Phase 3: lead capture) ────────────────────────────────
const GATE_PAGE_TRIGGER     = 3;      // open gate when user reaches page 3
const GATE_TIME_FALLBACK_MS = 25000;  // or after 25s of reading, whichever first
const GATE_STORAGE_KEY      = 'lwd_pub_gate_unlocked';

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD      = '#C9A84C';
const GD        = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU        = "var(--font-body, 'Jost', sans-serif)";
const MUTED     = 'rgba(255,255,255,0.38)';
const CTRL_BG   = 'rgba(0,0,0,0.55)';
const CTRL_HOV  = 'rgba(201,168,76,0.18)';

// Reader theme system — dark (lights off) vs light (lights on)
const READER_THEMES = {
  dark: {
    bg:       '#080706',
    pageBg:   '#0F0D0A',
    ctrlBg:   'rgba(0,0,0,0.6)',
    ctrlText: 'rgba(255,255,255,0.72)',
    ctrlBdr:  'rgba(255,255,255,0.1)',
    muted:    'rgba(255,255,255,0.38)',
    topGrad:  'linear-gradient(to bottom, rgba(8,7,6,0.96) 0%, rgba(8,7,6,0) 100%)',
    btnHov:   'rgba(201,168,76,0.18)',
    text:     '#ffffff',
    shadow:   '0 8px 48px rgba(0,0,0,0.6)',
    pageShad: '0 8px 48px rgba(0,0,0,0.6)',
  },
  light: {
    bg:       '#EAE5DC',
    pageBg:   '#FFFFFF',
    ctrlBg:   'rgba(255,255,255,0.88)',
    ctrlText: 'rgba(24,18,10,0.72)',
    ctrlBdr:  'rgba(24,18,10,0.12)',
    muted:    'rgba(24,18,10,0.45)',
    topGrad:  'linear-gradient(to bottom, rgba(234,229,220,0.97) 0%, rgba(234,229,220,0) 100%)',
    btnHov:   'rgba(201,168,76,0.15)',
    text:     '#18120A',
    shadow:   '0 4px 28px rgba(0,0,0,0.12)',
    pageShad: '0 8px 40px rgba(0,0,0,0.14)',
  },
};

// ── Bookmark helpers ──────────────────────────────────────────────────────────
function loadBookmarks(issueId) {
  try {
    const raw = localStorage.getItem(`lwd_bm_${issueId}`);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}
function saveBookmarks(issueId, bms) {
  try { localStorage.setItem(`lwd_bm_${issueId}`, JSON.stringify(bms)); } catch {}
}
function toggleBookmark(issueId, pageNum, current) {
  const updated = current.includes(pageNum)
    ? current.filter(n => n !== pageNum)
    : [...current, pageNum];
  saveBookmarks(issueId, updated);
  return updated;
}

// ── Touch distance helper ─────────────────────────────────────────────────────
function getTouchDist(t0, t1) {
  const dx = t0.clientX - t1.clientX;
  const dy = t0.clientY - t1.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Loading spinner ───────────────────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', background: '#080706', gap: 20,
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
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', height: '100vh', background: '#080706',
      gap: 16, padding: 24, textAlign: 'center',
    }}>
      <span style={{ fontSize: 36, opacity: 0.25 }}>◈</span>
      <p style={{ fontFamily: NU, fontSize: 14, color: MUTED, maxWidth: 320 }}>{message}</p>
      <button
        onClick={onBack}
        style={{
          fontFamily: NU, fontSize: 11, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', color: GOLD, background: 'none',
          border: `1px solid ${GOLD}`, padding: '9px 20px', borderRadius: 1,
          cursor: 'pointer', marginTop: 8,
        }}
      >
        Back to Publications
      </button>
    </div>
  );
}

// ── Cinematic intro overlay ───────────────────────────────────────────────────
function IntroOverlay({ issue, onDismiss }) {
  const [fading, setFading] = useState(false);
  const coverUrl = issue.cover_image_url || issue.cover_url || null;

  const dismiss = useCallback(() => {
    if (fading) return;
    setFading(true);
    setTimeout(() => onDismiss(), 500);
  }, [fading, onDismiss]);

  useEffect(() => {
    const onKey = () => dismiss();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dismiss]);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: '#030201',
      display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      opacity: fading ? 0 : 1,
      transition: 'opacity 0.5s ease',
    }}>
      {/* Blurred backdrop */}
      {coverUrl && (
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${coverUrl})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          filter: 'blur(40px) brightness(0.25)',
        }} />
      )}
      {/* Foreground */}
      <div style={{
        position: 'relative', display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: 24,
      }}>
        {coverUrl && (
          <img
            src={coverUrl}
            alt={issue.title}
            style={{
              maxHeight: '65vh',
              maxWidth: 'min(85vw, 380px)',
              objectFit: 'contain',
              boxShadow: '0 24px 80px rgba(0,0,0,0.8)',
              animation: 'introReveal 0.9s ease forwards',
            }}
          />
        )}
        <style>{`
          @keyframes introReveal {
            from { opacity: 0; transform: scale(1.04); }
            to   { opacity: 1; transform: scale(1); }
          }
        `}</style>
        <div style={{
          fontFamily: NU, fontSize: 9, color: GOLD,
          letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 20,
          textAlign: 'center',
        }}>
          {[issue.issue_number && `Issue ${issue.issue_number}`, issue.season, issue.year]
            .filter(Boolean).join(' · ')}
        </div>
        <div style={{
          fontFamily: GD, fontStyle: 'italic', fontSize: 28,
          color: '#F0EBE0', textAlign: 'center', maxWidth: 340,
          padding: '0 16px',
        }}>
          {issue.title || 'Untitled Issue'}
        </div>
        <button
          onClick={dismiss}
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 600,
            letterSpacing: '0.14em', textTransform: 'uppercase',
            color: GOLD, background: 'transparent',
            border: `1px solid ${GOLD}`,
            padding: '11px 32px', borderRadius: 1, cursor: 'pointer',
            marginTop: 8,
            transition: 'background 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.12)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          Open Issue →
        </button>
      </div>
    </div>
  );
}

// ── Reading progress bar ──────────────────────────────────────────────────────
function ProgressBar({ currentPage, totalPages }) {
  const pct = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      zIndex: 200, height: 3, background: 'rgba(255,255,255,0.06)',
    }}>
      <div style={{
        height: '100%',
        width: `${pct}%`,
        background: GOLD,
        transition: 'width 0.3s ease',
      }} />
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ message, visible }) {
  return (
    <div style={{
      position: 'fixed', top: 60, left: '50%', transform: 'translateX(-50%)',
      zIndex: 300,
      background: 'rgba(201,168,76,0.15)',
      border: '1px solid rgba(201,168,76,0.4)',
      color: GOLD,
      padding: '8px 20px', borderRadius: 20,
      fontFamily: NU, fontSize: 11,
      letterSpacing: '0.06em',
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.3s ease',
      pointerEvents: 'none',
      whiteSpace: 'nowrap',
    }}>
      {message}
    </div>
  );
}

// ── TOC Panel ────────────────────────────────────────────────────────────────
function TOCPanel({ open, onClose, pages, currentPage, onJump, bookmarks, onToggleBookmark, T }) {
  const listRef  = useRef(null);
  const activeRef = useRef(null);

  // Auto-scroll to current page
  useEffect(() => {
    if (open && activeRef.current && listRef.current) {
      activeRef.current.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
  }, [open, currentPage]);

  return (
    <>
      {/* Backdrop */}
      {open && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 190,
            background: 'rgba(0,0,0,0.4)',
          }}
        />
      )}
      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, left: 0, bottom: 0,
        width: 280, zIndex: 195,
        background: T.ctrlBg,
        backdropFilter: 'blur(12px)',
        borderRight: `1px solid ${T.ctrlBdr}`,
        display: 'flex', flexDirection: 'column',
        transform: open ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.28s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '18px 16px 14px',
          borderBottom: `1px solid ${T.ctrlBdr}`,
          flexShrink: 0,
        }}>
          <span style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase',
          }}>
            Contents
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none', border: 'none', color: T.muted,
              cursor: 'pointer', fontSize: 16, lineHeight: 1, padding: 4,
            }}
          >
            ✕
          </button>
        </div>
        {/* List */}
        <div ref={listRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
          {pages.map(p => {
            const isCurrent = p.page_number === currentPage;
            const isBookmarked = bookmarks.includes(p.page_number);
            const thumbSrc = p.thumbnail_url || p.image_url || null;
            return (
              <div
                key={p.page_number}
                ref={isCurrent ? activeRef : null}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '6px 12px 6px 0',
                  borderLeft: isCurrent ? `3px solid ${GOLD}` : '3px solid transparent',
                  paddingLeft: isCurrent ? 13 : 16,
                  cursor: 'pointer',
                  background: isCurrent ? 'rgba(201,168,76,0.06)' : 'transparent',
                  transition: 'background 0.15s',
                }}
                onClick={() => { onJump(p.page_number); onClose(); }}
                onMouseEnter={e => { if (!isCurrent) e.currentTarget.style.background = T.btnHov; }}
                onMouseLeave={e => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
              >
                {/* Thumbnail */}
                <div style={{
                  width: 48, height: 68, flexShrink: 0,
                  background: T.pageBg, borderRadius: 1, overflow: 'hidden',
                  border: `1px solid ${isCurrent ? 'rgba(201,168,76,0.4)' : T.ctrlBdr}`,
                }}>
                  {thumbSrc
                    ? <img src={thumbSrc} alt={`p${p.page_number}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    : <div style={{
                        width: '100%', height: '100%', display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: NU, fontSize: 9, color: T.muted,
                      }}>{p.page_number}</div>
                  }
                </div>
                {/* Page number */}
                <span style={{
                  fontFamily: NU, fontSize: 10,
                  color: isCurrent ? T.text : T.muted,
                  flex: 1,
                  letterSpacing: '0.04em',
                }}>
                  Page {p.page_number}
                </span>
                {/* Bookmark toggle */}
                <button
                  onClick={e => { e.stopPropagation(); onToggleBookmark(p.page_number); }}
                  title={isBookmarked ? 'Remove bookmark' : 'Bookmark this page'}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: isBookmarked ? GOLD : T.muted,
                    fontSize: 13, padding: '4px 8px', flexShrink: 0,
                    transition: 'color 0.15s',
                  }}
                >
                  {isBookmarked ? '✦' : '◇'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ── Top bar ───────────────────────────────────────────────────────────────────
function TopBar({
  issue, onBack, onDownload,
  showTOC, onToggleTOC,
  bookmarked, onToggleBookmark,
  onShare,
  onExport,
  onSearch,
  onTextMode,
  readerMode, onToggleMode,
  T,
}) {
  const btnStyle = {
    background:    T.ctrlBg,
    border:        `1px solid ${T.ctrlBdr}`,
    borderRadius:  2,
    padding:       '6px 12px',
    color:         T.ctrlText,
    fontFamily:    NU,
    fontSize:      9,
    fontWeight:    600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor:        'pointer',
    flexShrink:    0,
    transition:    'all 0.15s',
    display:       'flex',
    alignItems:    'center',
    gap:           5,
    whiteSpace:    'nowrap',
  };

  return (
    <div style={{
      position:   'fixed',
      top:        3, // below 3px progress bar
      left:       0,
      right:      0,
      zIndex:     100,
      height:     52,
      background: T.topGrad,
      display:    'flex',
      alignItems: 'center',
      padding:    '0 20px',
      gap:        10,
    }}>
      {/* Back */}
      <button
        onClick={onBack}
        title="Back to publications"
        style={{
          ...btnStyle,
          width: 36, height: 36, padding: 0,
          justifyContent: 'center',
          borderRadius: '50%',
          fontSize: 16,
        }}
      >
        ←
      </button>

      {/* Issue info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: NU, fontSize: 9, fontWeight: 600, color: GOLD,
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 2,
        }}>
          {[issue.issue_number && `Issue ${issue.issue_number}`, issue.season, issue.year]
            .filter(Boolean).join(' · ')}
        </div>
        <div style={{
          fontFamily: GD, fontSize: 16, fontWeight: 400, color: T.text,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {issue.title || 'Untitled Issue'}
        </div>
      </div>

      {/* TOC toggle */}
      <button
        onClick={onToggleTOC}
        style={{
          ...btnStyle,
          color: showTOC ? GOLD : T.ctrlText,
          border: showTOC ? `1px solid rgba(201,168,76,0.45)` : `1px solid ${T.ctrlBdr}`,
        }}
      >
        ☰ Contents
      </button>

      {/* Bookmark current page */}
      <button
        onClick={onToggleBookmark}
        style={{
          ...btnStyle,
          color: bookmarked ? GOLD : T.ctrlText,
          border: bookmarked ? `1px solid rgba(201,168,76,0.45)` : `1px solid ${T.ctrlBdr}`,
        }}
        title={bookmarked ? 'Remove bookmark' : 'Bookmark this page'}
      >
        {bookmarked ? '✦ Saved' : '◇ Save'}
      </button>

      {/* Share (desktop) */}
      <button
        onClick={onShare}
        style={{ ...btnStyle, display: 'none' }}
        className="pub-reader-share"
        title="Copy share link"
      >
        ↗ Share
      </button>

      {/* Export for social (desktop) */}
      <button
        onClick={onExport}
        style={{ ...btnStyle, display: 'none' }}
        className="pub-reader-export"
        title="Export page for social media"
      >
        ⬇ Export
      </button>

      {/* Search (desktop) */}
      <button
        onClick={onSearch}
        style={{ ...btnStyle, display: 'none' }}
        className="pub-reader-search"
        title="Search issue (press /)"
      >
        🔍 Search
      </button>

      {/* Text / Accessibility mode (desktop) */}
      <button
        onClick={onTextMode}
        style={{ ...btnStyle, display: 'none' }}
        className="pub-reader-textmode"
        title="Accessibility text mode (press A)"
      >
        Aa Text
      </button>

      {/* Reader mode toggle (desktop) */}
      <button
        onClick={onToggleMode}
        style={{ ...btnStyle, display: 'none' }}
        className="pub-reader-mode"
        title="Toggle reader mode"
      >
        {readerMode === 'dark' ? '☀ Lights On' : '☾ Lights Off'}
      </button>

      {/* LWD brand (desktop) */}
      <div
        style={{
          fontFamily: GD, fontSize: 14, fontWeight: 400, fontStyle: 'italic',
          color: GOLD, letterSpacing: '0.04em', flexShrink: 0, display: 'none',
        }}
        className="pub-reader-brand"
      >
        LWD
      </div>

      {/* PDF download (desktop) */}
      {issue.pdf_url && onDownload && (
        <button
          onClick={onDownload}
          title="Download PDF"
          style={{ ...btnStyle, display: 'none' }}
          className="pub-reader-dl"
        >
          ↓ PDF
        </button>
      )}

      <style>{`
        @media (min-width: 640px) {
          .pub-reader-brand    { display: block !important; }
          .pub-reader-dl       { display: flex !important; }
          .pub-reader-share    { display: flex !important; }
          .pub-reader-export   { display: flex !important; }
          .pub-reader-search   { display: flex !important; }
          .pub-reader-textmode { display: flex !important; }
          .pub-reader-mode     { display: flex !important; }
        }
      `}</style>
    </div>
  );
}

// ── Hotspot overlay item ──────────────────────────────────────────────────────
function HotspotOverlay({ hotspot, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={hotspot.label}
      style={{
        position:   'absolute',
        left:       hotspot.x + '%',
        top:        hotspot.y + '%',
        width:      hotspot.w + '%',
        height:     hotspot.h + '%',
        border:     `2px solid ${hovered ? '#C9A84C' : 'rgba(201,168,76,0.35)'}`,
        background: hovered ? 'rgba(201,168,76,0.12)' : 'rgba(201,168,76,0.04)',
        cursor:     'pointer',
        transition: 'all 0.15s',
        borderRadius: 2,
        display:    'flex',
        alignItems: 'flex-end',
        justifyContent: 'flex-start',
        padding:    4,
        boxSizing:  'border-box',
      }}
    >
      {hovered && (
        <span style={{
          fontFamily: NU,
          fontSize: 9, fontWeight: 600, color: '#C9A84C',
          background: 'rgba(0,0,0,0.8)', padding: '3px 7px',
          borderRadius: 2, letterSpacing: '0.08em', textTransform: 'uppercase',
          maxWidth: '90%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          pointerEvents: 'none',
        }}>
          ✦ {hotspot.label}
        </span>
      )}
    </div>
  );
}

// ── Page video overlay ────────────────────────────────────────────────────────
function PageVideoOverlay({ page }) {
  const [playing, setPlaying] = useState(false);
  const url = page?.video_url;
  if (!url) return null;

  const isYT    = url.includes('youtube.com') || url.includes('youtu.be');
  const isVimeo = url.includes('vimeo.com');

  if (!playing) {
    return (
      <button
        onClick={() => setPlaying(true)}
        style={{
          position: 'absolute', bottom: 16, right: 16, zIndex: 60,
          background: 'rgba(0,0,0,0.7)', border: `1px solid ${GOLD}`,
          borderRadius: 2, color: GOLD, padding: '7px 14px',
          fontFamily: NU, fontSize: 9, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          cursor: 'pointer',
        }}
      >
        ▶ Watch Video
      </button>
    );
  }

  // Build embed URL
  let embedUrl = url;
  if (isYT) {
    const id = url.match(/(?:v=|youtu\.be\/)([^&?]+)/)?.[1];
    embedUrl = `https://www.youtube.com/embed/${id}?autoplay=1&muted=1`;
  } else if (isVimeo) {
    const id = url.match(/vimeo\.com\/(\d+)/)?.[1];
    embedUrl = `https://player.vimeo.com/video/${id}?autoplay=1&muted=1`;
  }

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 60,
      background: 'rgba(0,0,0,0.9)', display: 'flex', flexDirection: 'column',
    }}>
      <button
        onClick={() => setPlaying(false)}
        style={{
          position: 'absolute', top: 8, right: 8, zIndex: 61,
          background: 'none', border: 'none', color: 'white',
          fontSize: 20, cursor: 'pointer', padding: 8,
        }}
      >
        ✕
      </button>
      {(isYT || isVimeo) ? (
        <iframe
          src={embedUrl}
          style={{ flex: 1, border: 'none' }}
          allow="autoplay; fullscreen"
          title="Page video"
        />
      ) : (
        <video
          src={url}
          autoPlay
          muted={page.video_muted !== false}
          controls
          style={{ flex: 1, objectFit: 'contain' }}
        />
      )}
    </div>
  );
}

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
        ? `${flipDir === 'next' ? 'pageFlipForward' : 'pageFlipBackward'} 0.6s cubic-bezier(0.645,0.045,0.355,1.000) forwards`
        : 'none',
      willChange: isFlipping ? 'transform' : 'auto',
    }}>
      {children}
      <style>{`
        @keyframes pageFlipForward {
          0%   { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
          40%  { transform: rotateY(-70deg); box-shadow: 0 16px 80px rgba(0,0,0,0.5); }
          50%  { transform: rotateY(-90deg); box-shadow: 0 20px 100px rgba(0,0,0,0.6); }
          60%  { transform: rotateY(-70deg); box-shadow: 0 16px 80px rgba(0,0,0,0.4); }
          100% { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
        }
        @keyframes pageFlipBackward {
          0%   { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
          40%  { transform: rotateY(70deg);  box-shadow: 0 16px 80px rgba(0,0,0,0.5); }
          50%  { transform: rotateY(90deg);  box-shadow: 0 20px 100px rgba(0,0,0,0.6); }
          60%  { transform: rotateY(70deg);  box-shadow: 0 16px 80px rgba(0,0,0,0.4); }
          100% { transform: rotateY(0deg);   box-shadow: 0 8px 48px rgba(0,0,0,0.0); }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes pageFlipForward  { 0%, 100% { transform: none; } }
          @keyframes pageFlipBackward { 0%, 100% { transform: none; } }
        }
      `}</style>
    </div>
  );
}

// ── Page image ────────────────────────────────────────────────────────────────
function PageImage({ page, side, pageBg, onHotspotClick, isPreview }) {
  const [loaded, setLoaded] = useState(false);
  if (!page) {
    return <div style={{ flex: 1, background: pageBg, border: '1px solid rgba(255,255,255,0.04)' }} />;
  }

  // Page was designed in PageDesigner but not yet published via "▶ Publish Digital"
  const hasCanvas = page.template_data?.canvasJSON;
  const hasImage  = !!page.image_url;
  if (!hasImage) {
    // In preview mode: show the page number but explain images need a publish run
    // In live mode: this shouldn't happen (status gate blocks non-published issues)
    return (
      <div style={{
        flex: 1, position: 'relative', background: pageBg,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 12,
      }}>
        <span style={{ fontSize: 28, opacity: 0.2 }}>◈</span>
        <div style={{
          fontFamily: "'Jost',sans-serif", fontSize: 10,
          color: 'rgba(255,255,255,0.3)', textAlign: 'center',
          letterSpacing: '0.1em', textTransform: 'uppercase', lineHeight: 1.6,
          maxWidth: 200,
        }}>
          Page {page.page_number}<br />
          {isPreview
            ? <span style={{ color: '#C9A84C', opacity: 0.8 }}>Not yet rendered —<br />click ▶ Publish Digital<br />in the studio</span>
            : <span style={{ color: '#C9A84C', opacity: 0.7 }}>Image rendering…</span>
          }
        </div>
      </div>
    );
  }

  const hotspots = page?.link_targets || [];
  return (
    <div style={{ flex: 1, position: 'relative', background: pageBg, overflow: 'hidden' }}>
      {!loaded && (
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{ fontSize: 20, opacity: 0.15 }}>◈</span>
        </div>
      )}
      <img
        src={page.image_url}
        alt={`Page ${page.page_number}`}
        onLoad={() => setLoaded(true)}
        draggable={false}
        style={{
          width: '100%', height: '100%', objectFit: 'contain',
          display: 'block',
          opacity: loaded ? 1 : 0, transition: 'opacity 0.25s',
          userSelect: 'none', pointerEvents: 'none',
        }}
      />
      {/* Hotspot overlay — only shown when image is loaded */}
      {loaded && hotspots.map(hs => (
        <HotspotOverlay
          key={hs.id}
          hotspot={hs}
          onClick={() => onHotspotClick?.(hs)}
        />
      ))}
      {/* Video overlay */}
      <PageVideoOverlay page={page} />
    </div>
  );
}

// ── Nav button ────────────────────────────────────────────────────────────────
function NavButton({ direction, onClick, disabled, T }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute', top: '50%', transform: 'translateY(-50%)',
        [direction === 'prev' ? 'left' : 'right']: 16,
        zIndex: 50,
        width: 48, height: 48, borderRadius: '50%',
        background: hovered ? T.btnHov : T.ctrlBg,
        border: `1px solid ${hovered ? 'rgba(201,168,76,0.45)' : T.ctrlBdr}`,
        color: disabled ? (T.muted) : (hovered ? GOLD : T.ctrlText),
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled ? 'default' : 'pointer',
        fontSize: 20, transition: 'all 0.15s', userSelect: 'none',
      }}
    >
      {direction === 'prev' ? '‹' : '›'}
    </button>
  );
}

// ── Page counter ──────────────────────────────────────────────────────────────
function PageCounter({ currentPage, totalPages, isDouble, bookmarks, T }) {
  const end = isDouble ? Math.min(currentPage + 1, totalPages) : currentPage;
  const pct = totalPages > 0 ? Math.round((currentPage / totalPages) * 100) : 0;
  const isBookmarked = bookmarks.includes(currentPage);

  return (
    <div style={{
      position: 'fixed', bottom: 20, left: '50%', transform: 'translateX(-50%)',
      zIndex: 100,
      background: T.ctrlBg,
      border: `1px solid ${T.ctrlBdr}`,
      borderRadius: 20,
      padding: '6px 18px',
      display: 'flex', alignItems: 'center', gap: 8,
    }}>
      {isBookmarked && (
        <span style={{ color: GOLD, fontSize: 10, marginRight: 2 }}>✦</span>
      )}
      <span style={{ fontFamily: NU, fontSize: 11, color: T.ctrlText, letterSpacing: '0.04em' }}>
        Page {isDouble && end > currentPage ? `${currentPage} – ${end}` : currentPage}
      </span>
      <span style={{ color: T.muted, fontSize: 10 }}>/</span>
      <span style={{ fontFamily: NU, fontSize: 11, color: T.muted, letterSpacing: '0.04em' }}>
        {totalPages}
      </span>
      <span style={{ color: T.muted, fontSize: 10 }}>·</span>
      <span style={{ fontFamily: NU, fontSize: 11, color: T.muted, letterSpacing: '0.04em' }}>
        {pct}%
      </span>
    </div>
  );
}

// ── Paywall gate overlay ──────────────────────────────────────────────────────
function PaywallGate({ issue, freePageCount, onBack, T }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: 'rgba(8,7,6,0.92)',
      backdropFilter: 'blur(18px)',
      WebkitBackdropFilter: 'blur(18px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      zIndex: 200, padding: '40px 24px',
      textAlign: 'center',
    }}>
      {/* Cover thumbnail */}
      {issue.cover_image && (
        <div style={{
          width: 120, height: 170, borderRadius: 3,
          backgroundImage: `url(${issue.cover_image})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
          marginBottom: 28, flexShrink: 0,
          opacity: 0.75,
        }} />
      )}

      {/* ✦ icon */}
      <div style={{ color: GOLD, fontSize: 22, letterSpacing: 4, marginBottom: 12 }}>✦</div>

      {/* Headline */}
      <h2 style={{
        fontFamily: GD, fontSize: 28, fontWeight: 400,
        color: '#ffffff', margin: '0 0 10px',
        letterSpacing: '0.02em', lineHeight: 1.2,
      }}>
        Continue Reading
      </h2>

      {/* Sub */}
      <p style={{
        fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.55)',
        margin: '0 0 28px', maxWidth: 380, lineHeight: 1.6,
      }}>
        You've read {freePageCount} complimentary page{freePageCount !== 1 ? 's' : ''} of{' '}
        <em style={{ color: 'rgba(255,255,255,0.75)' }}>{issue.title}</em>.{' '}
        Subscribe to unlock the full issue and every edition in our archive.
      </p>

      {/* CTA buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', maxWidth: 300 }}>
        <button
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onClick={() => window.location.href = '/subscribe'}
          style={{
            background: hovered
              ? 'linear-gradient(135deg, #D4B06A 0%, #C9A96E 100%)'
              : 'linear-gradient(135deg, #C9A96E 0%, #B8935A 100%)',
            border: 'none', borderRadius: 2, color: '#18120A',
            fontFamily: NU, fontSize: 11, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '14px 24px', cursor: 'pointer',
            transition: 'all 0.2s',
            boxShadow: hovered ? '0 4px 20px rgba(201,169,110,0.35)' : 'none',
          }}
        >
          ✦ Subscribe to Read More
        </button>

        <button
          onClick={onBack}
          style={{
            background: 'none', border: `1px solid rgba(255,255,255,0.15)`,
            borderRadius: 2, color: 'rgba(255,255,255,0.45)',
            fontFamily: NU, fontSize: 10, fontWeight: 600,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            padding: '10px 24px', cursor: 'pointer', transition: 'color 0.15s',
          }}
        >
          Back to Publications
        </button>
      </div>

      {/* Fine print */}
      <p style={{
        fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.25)',
        margin: '28px 0 0', lineHeight: 1.5, maxWidth: 320,
      }}>
        Subscribers enjoy unlimited access to all issues, plus exclusive editorial content.
      </p>
    </div>
  );
}

// ── Thumbnail strip ───────────────────────────────────────────────────────────
function ThumbnailStrip({ pages, currentPage, onJump, isDesktop, T }) {
  const [open, setOpen] = useState(false);
  if (!isDesktop) return null;
  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          position: 'fixed', bottom: 20, right: 20, zIndex: 110,
          background: T.ctrlBg, border: `1px solid ${T.ctrlBdr}`,
          borderRadius: 2, color: open ? GOLD : T.ctrlText,
          fontFamily: NU, fontSize: 9, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          padding: '7px 14px', cursor: 'pointer', transition: 'color 0.15s',
        }}
      >
        {open ? '✕ Close' : '⊞ Pages'}
      </button>
      {open && (
        <div style={{
          position: 'fixed', bottom: 60, left: 0, right: 0, zIndex: 105,
          background: T.ctrlBg, borderTop: `1px solid ${T.ctrlBdr}`,
          padding: '12px 20px', display: 'flex', gap: 8, overflowX: 'auto',
        }}>
          {pages.map(p => (
            <button
              key={p.page_number}
              onClick={() => { onJump(p.page_number); setOpen(false); }}
              title={`Page ${p.page_number}`}
              style={{
                flexShrink: 0, width: 52, height: 74, background: T.pageBg,
                border: `1px solid ${p.page_number === currentPage ? GOLD : T.ctrlBdr}`,
                borderRadius: 1, overflow: 'hidden', cursor: 'pointer',
                padding: 0, position: 'relative',
              }}
            >
              {p.thumbnail_url
                ? <img src={p.thumbnail_url} alt={`p${p.page_number}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                : <div style={{
                    width: '100%', height: '100%', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    fontFamily: NU, fontSize: 9, color: T.muted,
                  }}>{p.page_number}</div>
              }
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                background: 'rgba(0,0,0,0.7)', textAlign: 'center',
                fontFamily: NU, fontSize: 8, color: 'rgba(255,255,255,0.6)', padding: '2px 0',
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

// ── Zoom reset pill ───────────────────────────────────────────────────────────
function ZoomPill({ zoom, onReset, T }) {
  if (zoom === 1) return null;
  return (
    <button
      onClick={onReset}
      style={{
        position: 'fixed', bottom: 20, left: 20, zIndex: 110,
        background: T.ctrlBg, border: `1px solid ${T.ctrlBdr}`,
        borderRadius: 20, padding: '6px 14px',
        color: T.ctrlText, fontFamily: NU, fontSize: 10,
        fontWeight: 600, letterSpacing: '0.08em', cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s',
      }}
      onMouseEnter={e => e.currentTarget.style.background = T.btnHov}
      onMouseLeave={e => e.currentTarget.style.background = T.ctrlBg}
    >
      {Math.round(zoom * 100)}%
      <span style={{ opacity: 0.5 }}>·</span>
      <span style={{ opacity: 0.7 }}>✕ Reset</span>
    </button>
  );
}

// ── Vendor Credits button ─────────────────────────────────────────────────────
function VendorCreditsButton({ count, open, onToggle, T }) {
  return (
    <button onClick={onToggle} style={{
      position: 'fixed', bottom: 56, left: 20, zIndex: 110,
      background: open ? 'rgba(201,168,76,0.15)' : T.ctrlBg,
      border: `1px solid ${open ? 'rgba(201,168,76,0.5)' : T.ctrlBdr}`,
      borderRadius: 2, color: open ? '#C9A84C' : T.ctrlText,
      fontFamily: NU, fontSize: 9, fontWeight: 600,
      letterSpacing: '0.1em', textTransform: 'uppercase', padding: '7px 14px',
      cursor: 'pointer', transition: 'all 0.15s',
    }}>
      ◈ Credits ({count})
    </button>
  );
}

// ── Credits drawer ────────────────────────────────────────────────────────────
function CreditsDrawer({ credits, onClose, T }) {
  const drawerBg = T.ctrlBg !== 'rgba(0,0,0,0.6)' ? 'rgba(240,235,226,0.97)' : 'rgba(10,9,8,0.97)';
  return (
    <div style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 120,
      background: drawerBg, backdropFilter: 'blur(12px)',
      borderTop: `1px solid ${T.ctrlBdr}`,
      padding: '20px 24px 28px',
      animation: 'slideUp 0.25s ease',
    }}>
      <style>{`@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
        <span style={{ fontFamily: GD, fontSize: 18, color: T.text, flex: 1 }}>In This Spread</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', fontSize: 16, padding: 0 }}>✕</button>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
        {credits.map((c, i) => (
          <a
            key={i}
            href={c.profileSlug ? `/vendor/${c.profileSlug}` : (c.website || '#')}
            target={c.website ? '_blank' : undefined}
            rel="noreferrer"
            style={{
              display: 'flex', flexDirection: 'column', gap: 3,
              padding: '10px 14px', background: T.btnHov,
              border: `1px solid ${T.ctrlBdr}`, borderRadius: 3,
              textDecoration: 'none', minWidth: 140,
              transition: 'border-color 0.15s',
            }}
          >
            <span style={{ fontFamily: NU, fontSize: 8, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{c.role}</span>
            <span style={{ fontFamily: GD, fontSize: 15, color: T.text, fontStyle: 'italic' }}>{c.vendorName}</span>
            {c.category && <span style={{ fontFamily: NU, fontSize: 9, color: T.muted }}>{c.category}</span>}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── In-reader enquiry modal ───────────────────────────────────────────────────
function InReaderEnquiryModal({ hotspot, onClose }) {
  const [form,    setForm]    = useState({ name: '', email: '', message: '' });
  const [sending, setSending] = useState(false);
  const [sent,    setSent]    = useState(false);

  const handleSubmit = async () => {
    if (!form.name || !form.email) return;
    setSending(true);
    try {
      const { supabase } = await import('../lib/supabaseClient');
      await supabase.from('inquiries').insert({
        vendor_name: hotspot.vendorName,
        vendor_url:  hotspot.url,
        category:    hotspot.category,
        name:        form.name,
        email:       form.email,
        message:     form.message || `Enquiry about ${hotspot.label}`,
        source:      'publication_hotspot',
      }).catch(() => {});
      setSent(true);
    } catch {}
    setSending(false);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{ background: '#0A0908', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4, padding: 32, width: 'min(420px,90vw)', position: 'relative' }}>
        <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18 }}>✕</button>
        {sent ? (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 12 }}>✦</div>
            <div style={{ fontFamily: GD, fontSize: 22, color: '#F0EBE0', marginBottom: 8 }}>Enquiry sent</div>
            <div style={{ fontFamily: NU, fontSize: 12, color: MUTED }}>We'll be in touch shortly.</div>
            <button onClick={onClose} style={{ marginTop: 20, fontFamily: NU, fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, background: 'none', border: `1px solid ${GOLD}`, padding: '9px 24px', borderRadius: 2, cursor: 'pointer' }}>Close</button>
          </div>
        ) : (
          <>
            <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>Enquire About</div>
            <div style={{ fontFamily: GD, fontSize: 22, color: '#F0EBE0', fontStyle: 'italic', marginBottom: 4 }}>{hotspot.label}</div>
            {hotspot.vendorName && <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, marginBottom: 20 }}>{hotspot.vendorName}</div>}
            {[
              { key: 'name',  label: 'Your Name',      placeholder: 'Isabella Chen',          type: 'text'  },
              { key: 'email', label: 'Email Address',   placeholder: 'isabella@example.com',   type: 'email' },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>{f.label}</label>
                <input
                  type={f.type}
                  value={form[f.key]}
                  onChange={e => setForm(v => ({ ...v, [f.key]: e.target.value }))}
                  placeholder={f.placeholder}
                  style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 13, padding: '8px 10px', outline: 'none' }}
                />
              </div>
            ))}
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: MUTED, letterSpacing: '0.06em', textTransform: 'uppercase', display: 'block', marginBottom: 5 }}>Message (optional)</label>
              <textarea
                value={form.message}
                onChange={e => setForm(v => ({ ...v, message: e.target.value }))}
                rows={3}
                placeholder={`I'm interested in ${hotspot.label}…`}
                style={{ width: '100%', boxSizing: 'border-box', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 13, padding: '8px 10px', outline: 'none', resize: 'vertical' }}
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={sending || !form.name || !form.email}
              style={{ width: '100%', background: GOLD, border: 'none', color: '#0A0908', fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '12px', borderRadius: 2, cursor: 'pointer', opacity: (!form.name || !form.email) ? 0.5 : 1 }}
            >
              {sending ? 'Sending…' : 'Send Enquiry ✦'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main reader component ─────────────────────────────────────────────────────
export default function PublicationsReaderPage({ slug, onBack }) {
  // ?preview=1 in URL → show draft banner, skip intro, allow draft issues
  const isPreview = new URLSearchParams(window.location.search).get('preview') === '1';

  const [issue,   setIssue]   = useState(null);
  const [pages,   setPages]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [isDesktop,   setIsDesktop]   = useState(() => window.innerWidth >= 900);

  // ── Tier 1 state ─────────────────────────────────────────────────────────────
  const [zoom,           setZoom]           = useState(1);
  const [panX,           setPanX]           = useState(0);
  const [panY,           setPanY]           = useState(0);
  const [readerMode,     setReaderMode]     = useState('dark');
  const [showTOC,        setShowTOC]        = useState(false);
  const [bookmarks,      setBookmarks]      = useState([]);
  const [showIntro,      setShowIntro]      = useState(false);
  const [toastVisible,   setToastVisible]   = useState(false);
  const [showExportModal,setShowExportModal] = useState(false);
  const toastTimer = useRef(null);

  // ── Tier 2: hotspots + credits state ─────────────────────────────────────────
  const [activeHotspot, setActiveHotspot] = useState(null);
  const [creditsOpen,   setCreditsOpen]   = useState(false);

  // ── Tier 6: search + text mode state ─────────────────────────────────────────
  const [showSearch,      setShowSearch]      = useState(false);
  const [showTextMode,    setShowTextMode]     = useState(false);
  const [showSharePopover, setShowSharePopover] = useState(false);

  // ── Tier 8: page flip animation state ────────────────────────────────────────
  const [flipDir,        setFlipDir]        = useState(null);      // 'next' | 'prev' | null
  const [isFlipping,     setIsFlipping]     = useState(false);
  const [displayedPage,  setDisplayedPage]  = useState(1);         // what's currently rendered

  // Ref to prevent rapid-click during flip
  const flipLockRef = useRef(false);

  // ── Email gate (Phase 3) ─────────────────────────────────────────────────────
  const [gateUnlocked, setGateUnlocked] = useState(() => {
    try { return typeof window !== 'undefined' && localStorage.getItem(GATE_STORAGE_KEY) === '1'; }
    catch { return false; }
  });
  const [gateOpen,     setGateOpen]     = useState(false);
  const [gateReason,   setGateReason]   = useState('page_threshold'); // page_threshold | time_fallback | intent_nav | intent_rapid
  const gateTriggeredRef = useRef(false); // fires once per session until unlock/skip
  const rapidClicksRef   = useRef([]);    // timestamps of recent next-clicks for rapid-click detection

  // Drag-to-pan refs
  const dragging       = useRef(false);
  const dragStartX     = useRef(0);
  const dragStartY     = useRef(0);
  const dragPanStartX  = useRef(0);
  const dragPanStartY  = useRef(0);

  // Pinch refs
  const pinchActive   = useRef(false);
  const initialDist   = useRef(0);
  const initialZoom   = useRef(1);
  const touchStartX   = useRef(null);
  const touchStartY   = useRef(null);

  // Analytics
  const pageEnteredAt = useRef(null);
  const prevPageRef   = useRef(null);

  // Read events tracking
  const sessionId      = useRef(crypto.randomUUID());
  const mountTimeRef   = useRef(Date.now());

  // Personalised cover overlay
  const [personalisedData,     setPersonalisedData]     = useState(null);
  const [showPersonalisedCover, setShowPersonalisedCover] = useState(false);

  // Theme derivation
  const T      = READER_THEMES[readerMode] || READER_THEMES.dark;
  const BG     = T.bg;
  const PAGE_BG = T.pageBg;

  // ── Responsive ───────────────────────────────────────────────────────────────
  useEffect(() => {
    const onResize = () => setIsDesktop(window.innerWidth >= 900);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!slug) return;
    let cancelled = false;
    setLoading(true); setError(null); setCurrentPage(1);

    (async () => {
      const { data: issueData, error: issErr } = await fetchIssueBySlug(slug);
      if (cancelled) return;
      if (issErr || !issueData) {
        setError('Issue not found. It may have been unpublished.');
        setLoading(false);
        return;
      }

      // ── Status gate: only published issues are visible to public ─────────────
      const previewFlag = new URLSearchParams(window.location.search).get('preview') === '1';
      console.log('[reader] issue loaded:', {
        id:              issueData.id,
        slug:            issueData.slug,
        status:          issueData.status,
        render_version:  issueData.render_version,
        processing_state: issueData.processing_state,
        isPreview:       previewFlag,
      });
      if (!previewFlag && issueData.status !== 'published') {
        setError('This issue is not yet published.');
        setLoading(false);
        return;
      }

      setIssue(issueData);

      const { data: pagesData } = await fetchPages(issueData.id);
      if (cancelled) return;
      console.log('[reader] pages loaded:', (pagesData || []).length, (pagesData || []).map(p => ({
        n:        p.page_number,
        hasImage: !!p.image_url,
        url:      p.image_url ? p.image_url.slice(0, 80) : null,
      })));
      setPages(pagesData || []);
      setLoading(false);

      // Load bookmarks
      setBookmarks(loadBookmarks(issueData.id));

      // Cinematic intro
      const introKey = `lwd_intro_${issueData.id}`;
      if (!sessionStorage.getItem(introKey)) {
        setShowIntro(true);
      }

      // URL sync: read page param
      const sp = new URLSearchParams(window.location.search);
      const pageParam = sp.get('page');
      if (pageParam) {
        const n = parseInt(pageParam, 10);
        if (!isNaN(n) && n >= 1) {
          setCurrentPage(Math.min(n, (pagesData || []).length));
        }
      }

      trackIssueView(issueData.id, window.innerWidth >= 900 ? 'spread' : 'single');
      pageEnteredAt.current = Date.now();
      prevPageRef.current = 1;

      // Check for personalised cover
      const sp2 = new URLSearchParams(window.location.search);
      if (sp2.get('personalised') === 'true') {
        // Look up personalised issue by slug (current URL slug)
        const { data: persData } = await supabase
          .from('magazine_personalised_issues')
          .select('*')
          .eq('slug', slug)
          .maybeSingle();
        if (!cancelled && persData) {
          setPersonalisedData(persData);
          setShowPersonalisedCover(true);
        }
      }
    })();

    return () => { cancelled = true; };
  }, [slug]);

  // ── Structured data (JSON-LD) for this specific issue ────────────────────────
  useEffect(() => {
    if (!issue) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "PublicationIssue",
      "name": issue.title || "Luxury Wedding Directory Magazine",
      "url": `https://www.luxuryweddingdirectory.co.uk/publications/${issue.slug}`,
      "issueNumber": issue.issue_number?.toString(),
      "datePublished": issue.published_at,
      "image": issue.cover_image || undefined,
      "description": issue.intro || issue.excerpt || undefined,
      "isPartOf": {
        "@type": "Periodical",
        "name": "Luxury Wedding Directory Magazine",
        "url": "https://www.luxuryweddingdirectory.co.uk/publications",
        "publisher": {
          "@type": "Organization",
          "name": "Luxury Wedding Directory",
          "url": "https://www.luxuryweddingdirectory.co.uk"
        }
      },
      "pageCount": issue.page_count || undefined,
    };

    const el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "issue-schema";
    el.textContent = JSON.stringify(schema, (_, v) => v === undefined ? undefined : v);
    document.getElementById("issue-schema")?.remove();
    document.head.appendChild(el);

    return () => {
      document.getElementById("issue-schema")?.remove();
    };
  }, [issue?.id]);

  // ── Device / browser / referrer helpers (Feature 11) ────────────────────────
  const _referrer = typeof document !== 'undefined' ? (document.referrer || 'direct') : 'direct';
  const _device   = typeof window   !== 'undefined'
    ? (window.innerWidth < 768 ? 'mobile' : window.innerWidth < 1024 ? 'tablet' : 'desktop')
    : 'desktop';
  function _browser() {
    if (typeof navigator === 'undefined') return 'other';
    const ua = navigator.userAgent;
    if (ua.includes('Edg/'))    return 'edge';
    if (ua.includes('Chrome/')) return 'chrome';
    if (ua.includes('Firefox/'))return 'firefox';
    if (ua.includes('Safari/')) return 'safari';
    return 'other';
  }
  const _browserName = _browser();

  // ── Geography: detect country via ipapi.co ───────────────────────────────────
  async function getCountry() {
    try {
      const r = await fetch('https://ipapi.co/json/', { signal: AbortSignal.timeout(3000) });
      const d = await r.json(); return d.country_name || null;
    } catch { return null; }
  }

  // ── Read events: issue_open on mount, issue_close on unmount ─────────────────
  useEffect(() => {
    if (!issue?.id) return;
    const sid = sessionId.current;
    mountTimeRef.current = Date.now();
    // Fire-and-forget issue_open (with country detection)
    getCountry().then(country => {
      supabase.from('magazine_read_events').insert({
        issue_id: issue.id, session_id: sid, event_type: 'issue_open', page_number: 1,
        referrer: _referrer, device: _device, browser: _browserName,
        ...(country ? { country } : {}),
      });
    });
    return () => {
      // Fire-and-forget issue_close
      supabase.from('magazine_read_events').insert({
        issue_id: issue.id, session_id: sid, event_type: 'issue_close',
        duration_ms: Date.now() - mountTimeRef.current,
        referrer: _referrer, device: _device, browser: _browserName,
      });
    };
  }, [issue?.id]);

  // ── Read events: page_view on page change ─────────────────────────────────────
  useEffect(() => {
    if (!issue?.id || !currentPage) return;
    supabase.from('magazine_read_events').insert({
      issue_id: issue.id, session_id: sessionId.current, event_type: 'page_view', page_number: currentPage,
      referrer: _referrer, device: _device, browser: _browserName,
    });
  }, [issue?.id, currentPage]);

  // ── Document title for this issue ────────────────────────────────────────────
  useEffect(() => {
    if (!issue) return;
    const parts = [issue.title, "The Magazine", "Luxury Wedding Directory"].filter(Boolean);
    document.title = parts.join(" · ");
    return () => { document.title = "Luxury Wedding Directory"; };
  }, [issue?.title]);

  // ── Spread mode: declared here — before Helpers — because step/canNext reference it
  const forceSpreadEarly   = issue?.spread_layout !== 'single';
  const useDoubleSpread    = isDesktop && forceSpreadEarly;

  // ── Paywall gate: declared here too so goNext (below) can reference it ───────
  const paywallBlocking    = (issue?.paywall_enabled === true) && currentPage > (issue?.free_page_count ?? 3);

  // ── Email gate: intent trigger helper — declared BEFORE goNext to avoid TDZ ──
  // Called by high-intent actions (TOC open, thumbnail jump, rapid clicking).
  // No-op if gate already triggered, unlocked, or loading.
  const triggerGateByIntent = useCallback((reason) => {
    if (gateUnlocked || gateOpen || gateTriggeredRef.current) return;
    if (!issue || loading) return;
    if (isFlipping) return;
    gateTriggeredRef.current = true;
    setGateReason(reason);
    setGateOpen(true);
  }, [gateUnlocked, gateOpen, issue, loading, isFlipping]);

  // ── Helpers ──────────────────────────────────────────────────────────────────
  const totalPages = pages.length;
  const step = useDoubleSpread ? 2 : 1;
  const canPrev = currentPage > 1;
  const canNext = currentPage + (useDoubleSpread ? 1 : 0) < totalPages;

  const resetZoom = useCallback(() => {
    setZoom(1); setPanX(0); setPanY(0);
  }, []);

  const firePageTurn = useCallback((newPage) => {
    if (!issue) return;
    const now   = Date.now();
    const dwell = pageEnteredAt.current ? now - pageEnteredAt.current : 0;
    const prev  = prevPageRef.current;
    trackPageTurn(issue.id, newPage, isDesktop ? 'spread' : 'single', dwell, prev);
    pageEnteredAt.current = now;
    prevPageRef.current   = newPage;
  }, [issue, isDesktop]);

  const goToPage = useCallback((n) => {
    const clamped = Math.max(1, Math.min(totalPages, n));
    firePageTurn(clamped);
    setCurrentPage(clamped);
    resetZoom();
    // URL sync
    if (slug) {
      window.history.replaceState({}, '', `/publications/${slug}?page=${clamped}`);
    }
  }, [totalPages, firePageTurn, resetZoom, slug]);

  const goPrev = useCallback(() => {
    if (!canPrev) return;
    if (gateOpen && !gateUnlocked) return; // block nav while email gate is showing
    if (flipLockRef.current || isFlipping) return;
    if (zoom > 1) { goToPage(Math.max(1, currentPage - step)); return; }
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { goToPage(Math.max(1, currentPage - step)); return; }
    const newPage = Math.max(1, currentPage - step);
    setFlipDir('prev');
    setIsFlipping(true);
    flipLockRef.current = true;
    setTimeout(() => {
      setDisplayedPage(newPage);
      goToPage(newPage);
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDir(null);
        flipLockRef.current = false;
      }, 300);
    }, 300);
  }, [canPrev, currentPage, step, goToPage, isFlipping, zoom, gateOpen, gateUnlocked]);

  const goNext = useCallback(() => {
    if (!canNext || paywallBlocking) return;
    if (gateOpen && !gateUnlocked) return; // block nav while email gate is showing
    if (flipLockRef.current || isFlipping) return;

    // Intent trigger: 4+ next-clicks within 3 seconds = rapid skim = high intent
    if (!gateUnlocked && !gateTriggeredRef.current) {
      const now = Date.now();
      rapidClicksRef.current = [...rapidClicksRef.current, now].filter(t => now - t <= 3000);
      if (rapidClicksRef.current.length >= 4) {
        rapidClicksRef.current = [];
        triggerGateByIntent('intent_rapid');
        return;
      }
    }
    if (zoom > 1) { goToPage(Math.min(totalPages, currentPage + step)); return; }
    const prefersReduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) { goToPage(Math.min(totalPages, currentPage + step)); return; }
    const newPage = Math.min(totalPages, currentPage + step);
    setFlipDir('next');
    setIsFlipping(true);
    flipLockRef.current = true;
    setTimeout(() => {
      setDisplayedPage(newPage);
      goToPage(newPage);
      setTimeout(() => {
        setIsFlipping(false);
        setFlipDir(null);
        flipLockRef.current = false;
      }, 300);
    }, 300);
  }, [canNext, paywallBlocking, currentPage, step, totalPages, goToPage, isFlipping, zoom, gateOpen, gateUnlocked, triggerGateByIntent]);

  // ── URL sync on page change ──────────────────────────────────────────────────
  useEffect(() => {
    if (!slug || !issue) return;
    window.history.replaceState({}, '', `/publications/${slug}?page=${currentPage}`);
  }, [currentPage, slug, issue]);

  // ── Close credits drawer on page navigation ───────────────────────────────────
  useEffect(() => {
    setCreditsOpen(false);
  }, [currentPage]);

  // ── Sync displayedPage for TOC / thumbnail jumps (non-animated navigation) ───
  useEffect(() => {
    if (!isFlipping) {
      setDisplayedPage(currentPage);
    }
  }, [currentPage, isFlipping]);

  // ── Email gate: page-threshold trigger ───────────────────────────────────────
  // Opens after user reaches GATE_PAGE_TRIGGER. Never mid-flip. Fires once.
  useEffect(() => {
    if (gateUnlocked || gateOpen || gateTriggeredRef.current) return;
    if (!issue || loading) return;
    if (isFlipping) return;
    if (currentPage >= GATE_PAGE_TRIGGER) {
      gateTriggeredRef.current = true;
      setGateReason('page_threshold');
      setGateOpen(true);
    }
  }, [currentPage, isFlipping, gateUnlocked, gateOpen, issue, loading]);

  // ── Email gate: time fallback trigger ────────────────────────────────────────
  // If user lingers early in the issue without reaching page 3, open after 25s.
  useEffect(() => {
    if (gateUnlocked || gateOpen || gateTriggeredRef.current) return;
    if (!issue || loading) return;
    const t = setTimeout(() => {
      if (gateUnlocked || gateOpen || gateTriggeredRef.current) return;
      if (flipLockRef.current) return; // don't interrupt a flip
      gateTriggeredRef.current = true;
      setGateReason('time_fallback');
      setGateOpen(true);
    }, GATE_TIME_FALLBACK_MS);
    return () => clearTimeout(t);
  }, [issue, loading, gateUnlocked, gateOpen]);

  // ── Email gate handlers ──────────────────────────────────────────────────────
  const handleGateUnlock = useCallback(() => {
    try { localStorage.setItem(GATE_STORAGE_KEY, '1'); } catch { /* ignore */ }
    setGateUnlocked(true);
    setGateOpen(false);
  }, []);

  const handleGateSkip = useCallback(() => {
    // Soft close for this session only — no localStorage write.
    // Won't re-open again this session (gateTriggeredRef stays true).
    setGateOpen(false);
  }, []);

  // ── Keyboard shortcuts ───────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      // Don't intercept when typing in inputs
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft')  goPrev();
      if (e.key === 'Escape')     onBack?.();
      if (e.key === 'b' || e.key === 'B') {
        if (issue) {
          setBookmarks(bms => toggleBookmark(issue.id, currentPage, bms));
        }
      }
      if (e.key === 't' || e.key === 'T') setShowTOC(o => !o);
      if (e.key === 'z' || e.key === 'Z') resetZoom();
      if (e.key === 'm' || e.key === 'M') setReaderMode(m => m === 'dark' ? 'light' : 'dark');
      if (e.key === '/') { e.preventDefault(); setShowSearch(o => !o); }
      if (e.key === 'a' || e.key === 'A') setShowTextMode(o => !o);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goNext, goPrev, onBack, issue, currentPage, resetZoom]);

  // ── Wheel zoom ───────────────────────────────────────────────────────────────
  const onWheel = useCallback((e) => {
    e.preventDefault();
    setZoom(z => Math.max(0.75, Math.min(3.5, z + e.deltaY * -0.001)));
  }, []);

  // ── Mouse drag-to-pan ────────────────────────────────────────────────────────
  const onMouseDown = useCallback((e) => {
    if (zoom <= 1) return;
    dragging.current    = true;
    dragStartX.current  = e.clientX;
    dragStartY.current  = e.clientY;
    dragPanStartX.current = panX;
    dragPanStartY.current = panY;
    e.preventDefault();
  }, [zoom, panX, panY]);

  const onMouseMove = useCallback((e) => {
    if (!dragging.current) return;
    const dx = e.clientX - dragStartX.current;
    const dy = e.clientY - dragStartY.current;
    setPanX(dragPanStartX.current + dx);
    setPanY(dragPanStartY.current + dy);
  }, []);

  const onMouseUp = useCallback(() => { dragging.current = false; }, []);

  // ── Double-click zoom toggle ─────────────────────────────────────────────────
  const onDoubleClick = useCallback(() => {
    if (zoom !== 1) {
      resetZoom();
    } else {
      setZoom(2);
    }
  }, [zoom, resetZoom]);

  // ── Touch handlers ───────────────────────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      pinchActive.current  = true;
      initialDist.current  = getTouchDist(e.touches[0], e.touches[1]);
      initialZoom.current  = zoom;
    } else if (e.touches.length === 1) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  }, [zoom]);

  const onTouchMove = useCallback((e) => {
    if (pinchActive.current && e.touches.length === 2) {
      e.preventDefault();
      const newDist = getTouchDist(e.touches[0], e.touches[1]);
      const newZoom = Math.max(0.75, Math.min(3.5, initialZoom.current * (newDist / initialDist.current)));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && zoom > 1) {
      // pan
      const dx = e.touches[0].clientX - (touchStartX.current || e.touches[0].clientX);
      const dy = e.touches[0].clientY - (touchStartY.current || e.touches[0].clientY);
      setPanX(p => p + dx);
      setPanY(p => p + dy);
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }
  }, [zoom]);

  const onTouchEnd = useCallback((e) => {
    if (pinchActive.current) {
      pinchActive.current = false;
      return;
    }
    if (zoom > 1) return; // was panning, not swiping
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - (touchStartY.current || 0);
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) goNext();
    else        goPrev();
  }, [zoom, goNext, goPrev]);

  // ── Share ─────────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    setShowSharePopover(prev => !prev);
  }, []);

  // ── Bookmark current page ────────────────────────────────────────────────────
  const handleToggleBookmarkCurrent = useCallback(() => {
    if (!issue) return;
    setBookmarks(bms => toggleBookmark(issue.id, currentPage, bms));
  }, [issue, currentPage]);

  const handleToggleBookmarkPage = useCallback((pageNum) => {
    if (!issue) return;
    setBookmarks(bms => toggleBookmark(issue.id, pageNum, bms));
  }, [issue]);

  // ── Intro dismiss ────────────────────────────────────────────────────────────
  const handleIntroDismiss = useCallback(() => {
    if (issue) sessionStorage.setItem(`lwd_intro_${issue.id}`, '1');
    setShowIntro(false);
  }, [issue]);

  // ── PDF download ──────────────────────────────────────────────────────────────
  const handleDownload = useCallback(() => {
    if (!issue?.pdf_url) return;
    trackDownload(issue.id);
    window.open(issue.pdf_url, '_blank', 'noreferrer');
  }, [issue]);

  // ── Hotspot click handler ────────────────────────────────────────────────────
  const handleHotspotClick = useCallback((hs) => {
    // Track the click
    if (issue?.id) {
      supabase.from('magazine_read_events').insert({
        issue_id: issue.id,
        session_id: sessionId.current,
        event_type: 'hotspot_click',
        page_number: currentPage,
        referrer: hs.label || hs.url || null,
      }).catch(() => {});
    }

    if (hs.type === 'vendor' && hs.url) {
      setActiveHotspot(hs);
    } else if (hs.url) {
      window.open(hs.url, '_blank', 'noreferrer');
    }
  }, [issue?.id, currentPage]);

  // ── Paywall (moved earlier — see "before Helpers" above) ─────────────────────
  // paywallBlocking is referenced inside goNext's useCallback, so must be declared
  // before that callback to avoid a TDZ ReferenceError.
  const paywallEnabled  = issue?.paywall_enabled === true;
  const freePageCount   = issue?.free_page_count ?? 3;

  // ── Page size → aspect ratio ─────────────────────────────────────────────────
  // Used to set correct proportions when no image is loaded yet
  const PAGE_RATIOS = { A4: 1.414, A5: 1.414, US_LETTER: 1.294, SQUARE: 1.0, TABLOID: 1.545 };
  const pageAspect = PAGE_RATIOS[issue?.page_size || 'A4'] || 1.414;

  // ── Spread mode (declared earlier — see "before Helpers" above) ─────────────
  const forceSpread = forceSpreadEarly; // alias kept for readability below

  // ── Derive spread pages ──────────────────────────────────────────────────────
  // displayedPage drives what's shown inside the flip wrapper.
  // currentPage drives everything else (progress bar, counter, TOC, URL, bookmarks).
  const pageByNum      = (n) => pages.find(p => p.page_number === n) || null;
  const leftPage       = useDoubleSpread && displayedPage > 1 ? pageByNum(displayedPage)     : null;
  const rightPage      = useDoubleSpread
    ? (displayedPage === 1 ? pageByNum(1) : pageByNum(displayedPage + 1))
    : pageByNum(displayedPage);
  const isDoubleSpread = useDoubleSpread && displayedPage > 1;

  // ── Spread credits ───────────────────────────────────────────────────────────
  const spreadCredits = useMemo(() => {
    const creditPages = [leftPage, rightPage].filter(Boolean);
    return creditPages.flatMap(p => p?.vendor_credits || []);
  }, [leftPage, rightPage]);
  const spreadHasCredits = spreadCredits.length > 0;
  const spreadCreditCount = spreadCredits.length;

  // ── Render ───────────────────────────────────────────────────────────────────
  if (loading) return <Spinner />;
  if (error)   return <ErrorScreen message={error} onBack={onBack} />;
  if (!issue)  return <ErrorScreen message="Issue not found." onBack={onBack} />;
  if (pages.length === 0) {
    return <ErrorScreen message={isPreview ? "No pages published yet — publish the issue first, then preview." : "This issue has no pages yet. Check back soon."} onBack={onBack} />;
  }

  const isBookmarkedCurrent = bookmarks.includes(currentPage);

  return (
    <div
      style={{
        position: 'fixed', inset: 0,
        background: T.bg,
        display: 'flex', flexDirection: 'column',
        overflow: 'hidden', userSelect: 'none',
        transition: 'background 0.4s ease',
      }}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
    >
      {/* ── Draft preview banner ──────────────────────────────────────────── */}
      {isPreview && (
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'rgba(201,169,110,0.95)',
          color: '#1a1714',
          fontFamily: "'Jost', sans-serif",
          fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
          textTransform: 'uppercase',
          padding: '6px 16px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: 8,
        }}>
          <span>◆ Draft Preview — not visible to the public</span>
          <span style={{ opacity: 0.6, fontWeight: 400, letterSpacing: '0.04em', textTransform: 'none', fontSize: 10 }}>
            Publish to make live
          </span>
        </div>
      )}

      {/* ① Reading progress bar */}
      <ProgressBar currentPage={currentPage} totalPages={totalPages} />

      {/* Top bar */}
      <TopBar
        issue={issue}
        onBack={onBack}
        onDownload={issue.pdf_url ? handleDownload : null}
        showTOC={showTOC}
        onToggleTOC={() => {
          // Intent trigger: opening TOC before unlock = "I want to find something" = high intent
          if (!showTOC && !gateUnlocked && !gateTriggeredRef.current) {
            triggerGateByIntent('intent_nav');
            return;
          }
          setShowTOC(o => !o);
        }}
        bookmarked={isBookmarkedCurrent}
        onToggleBookmark={handleToggleBookmarkCurrent}
        onShare={handleShare}
        onExport={() => setShowExportModal(true)}
        onSearch={() => setShowSearch(o => !o)}
        onTextMode={() => setShowTextMode(o => !o)}
        readerMode={readerMode}
        onToggleMode={() => setReaderMode(m => m === 'dark' ? 'light' : 'dark')}
        T={T}
      />

      {/* ③ TOC Panel */}
      <TOCPanel
        open={showTOC}
        onClose={() => setShowTOC(false)}
        pages={pages}
        currentPage={currentPage}
        onJump={goToPage}
        bookmarks={bookmarks}
        onToggleBookmark={handleToggleBookmarkPage}
        T={T}
      />

      {/* ⑥ In-reader Search Panel */}
      {showSearch && (
        <IssueSearchPanel
          pages={pages}
          currentPage={currentPage}
          onJump={(n) => { goToPage(n); setShowSearch(false); }}
          onClose={() => setShowSearch(false)}
          T={T}
        />
      )}

      {/* ⑥ Text / Accessibility Mode */}
      {showTextMode && (
        <TextModePanel
          pages={pages}
          issue={issue}
          onClose={() => setShowTextMode(false)}
          T={T}
        />
      )}

      {/* Main viewer */}
      <div
        style={{
          flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: isDesktop ? '60px 80px 60px' : '56px 0 48px',
          position: 'relative', overflow: 'hidden',
          cursor: zoom > 1 ? (dragging.current ? 'grabbing' : 'grab') : 'default',
          perspective: '1200px',
        }}
        onWheel={onWheel}
        onMouseDown={onMouseDown}
        onDoubleClick={onDoubleClick}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {/* ② Spread wrapper with zoom + pan transform */}
        <div style={{
          display: 'flex',
          height: '100%', maxHeight: '100%',
          width: useDoubleSpread ? (displayedPage === 1 ? '50%' : '100%') : 'auto',
          maxWidth: useDoubleSpread ? 1400 : `calc(100vh * ${1 / pageAspect})`,
          gap: isDoubleSpread ? 2 : 0,
          boxShadow: T.pageShad,
          background: T.pageBg,
          transform: `scale(${zoom}) translate(${panX / zoom}px, ${panY / zoom}px)`,
          transformOrigin: 'center center',
          transition: dragging.current ? 'none' : undefined,
        }}>
          {isDesktop ? (
            <PageFlipWrapper flipDir={flipDir} isFlipping={isFlipping}>
              {useDoubleSpread && displayedPage > 1 && (
                <PageImage page={leftPage} side="left" pageBg={T.pageBg} onHotspotClick={handleHotspotClick} isPreview={isPreview} />
              )}
              <PageImage page={rightPage} side="right" pageBg={T.pageBg} onHotspotClick={handleHotspotClick} isPreview={isPreview} />
            </PageFlipWrapper>
          ) : (
            <>
              {useDoubleSpread && displayedPage > 1 && (
                <PageImage page={leftPage} side="left" pageBg={T.pageBg} onHotspotClick={handleHotspotClick} isPreview={isPreview} />
              )}
              <PageImage page={rightPage} side="right" pageBg={T.pageBg} onHotspotClick={handleHotspotClick} isPreview={isPreview} />
            </>
          )}
        </div>

        {/* Nav buttons */}
        <NavButton direction="prev" onClick={goPrev} disabled={!canPrev} T={T} />
        <NavButton direction="next" onClick={goNext} disabled={!canNext || paywallBlocking} T={T} />

        {/* Paywall gate — renders over pages when limit reached */}
        {paywallBlocking && (
          <PaywallGate
            issue={issue}
            freePageCount={freePageCount}
            onBack={onBack}
            T={T}
          />
        )}

        {/* Email gate — lead capture (Phase 3). Renders over pages, paywall takes priority. */}
        {gateOpen && !gateUnlocked && !paywallBlocking && (
          <EmailGate
            issue={issue}
            slug={slug}
            currentPage={currentPage}
            triggerReason={gateReason}
            onUnlock={handleGateUnlock}
            onSkip={handleGateSkip}
          />
        )}
      </div>

      {/* ② Zoom reset pill */}
      <ZoomPill zoom={zoom} onReset={resetZoom} T={T} />

      {/* Enhanced page counter */}
      <PageCounter
        currentPage={currentPage}
        totalPages={totalPages}
        isDouble={isDoubleSpread}
        bookmarks={bookmarks}
        T={T}
      />

      {/* Thumbnail strip (desktop, secondary) */}
      <ThumbnailStrip
        pages={pages}
        currentPage={currentPage}
        onJump={(n) => {
          // Intent trigger: jumping via thumbnails before unlock = high intent
          if (!gateUnlocked && !gateTriggeredRef.current) {
            triggerGateByIntent('intent_nav');
            return;
          }
          goToPage(n);
        }}
        isDesktop={isDesktop}
        T={T}
      />

      {/* Vendor Credits button */}
      {spreadHasCredits && (
        <VendorCreditsButton
          count={spreadCreditCount}
          open={creditsOpen}
          onToggle={() => setCreditsOpen(o => !o)}
          T={T}
        />
      )}

      {/* Credits drawer */}
      {creditsOpen && (
        <CreditsDrawer
          credits={spreadCredits}
          onClose={() => setCreditsOpen(false)}
          T={T}
        />
      )}

      {/* In-reader enquiry modal */}
      {activeHotspot && (
        <InReaderEnquiryModal
          hotspot={activeHotspot}
          onClose={() => setActiveHotspot(null)}
        />
      )}

      {/* Social export modal */}
      {showExportModal && (
        <SocialExportModal
          page={rightPage || pages[0]}
          issue={issue}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* ⑤ Share toast */}
      <Toast message="Link copied!" visible={toastVisible} />

      {/* ⑤b Share popover */}
      {showSharePopover && (() => {
        const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
        const shareTitle = issue?.title || 'Luxury Wedding Directory';
        const twUrl = `https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`;
        const waUrl = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} — ${shareUrl}`)}`;
        const piUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(shareUrl)}&description=${encodeURIComponent(shareTitle)}`;
        return (
          <>
            {/* Backdrop — click outside to close */}
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 1199 }}
              onClick={() => setShowSharePopover(false)}
            />
            <div style={{
              position: 'fixed', top: 64, right: 20, zIndex: 1200,
              background: 'rgba(14,12,9,0.97)',
              border: '1px solid rgba(201,168,76,0.25)',
              borderRadius: 10,
              padding: '18px 20px',
              minWidth: 220,
              boxShadow: '0 8px 40px rgba(0,0,0,0.7)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 4 }}>
                Share this issue
              </div>
              {/* Copy link */}
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl).then(() => {
                    setShowSharePopover(false);
                    setToastVisible(true);
                    setTimeout(() => setToastVisible(false), 2200);
                  });
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '9px 14px', cursor: 'pointer', fontFamily: NU, fontSize: 12, color: '#fff', textAlign: 'left' }}
              >
                <span style={{ fontSize: 14 }}>⎘</span> Copy link
              </button>
              {/* Twitter / X */}
              <a
                href={twUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => setShowSharePopover(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '9px 14px', textDecoration: 'none', fontFamily: NU, fontSize: 12, color: '#fff' }}
              >
                <span style={{ fontSize: 14, color: GOLD }}>𝕏</span> Share on X
              </a>
              {/* WhatsApp */}
              <a
                href={waUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => setShowSharePopover(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '9px 14px', textDecoration: 'none', fontFamily: NU, fontSize: 12, color: '#fff' }}
              >
                <span style={{ fontSize: 14, color: GOLD }}>💬</span> WhatsApp
              </a>
              {/* Pinterest */}
              <a
                href={piUrl} target="_blank" rel="noopener noreferrer"
                onClick={() => setShowSharePopover(false)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: '9px 14px', textDecoration: 'none', fontFamily: NU, fontSize: 12, color: '#fff' }}
              >
                <span style={{ fontSize: 14, color: GOLD }}>📌</span> Pinterest
              </a>
            </div>
          </>
        );
      })()}

      {/* ⑧ Cinematic intro */}
      {showIntro && (
        <IntroOverlay issue={issue} onDismiss={handleIntroDismiss} />
      )}

      {/* ⑨ Personalised cover overlay */}
      {showPersonalisedCover && personalisedData && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 600,
            background: '#080706',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexDirection: 'column', gap: 0,
            animation: 'introReveal 0.8s ease forwards',
          }}
          onClick={() => setShowPersonalisedCover(false)}
        >
          {/* Blurred backdrop */}
          {issue?.cover_image && (
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${issue.cover_image})`,
              backgroundSize: 'cover', backgroundPosition: 'center',
              filter: 'blur(40px) brightness(0.2)',
            }} />
          )}
          <div style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            alignItems: 'center', gap: 24, padding: '40px 32px',
            maxWidth: 480, textAlign: 'center',
          }}>
            {/* Gold top border */}
            <div style={{ width: 64, height: 2, background: '#C9A84C', marginBottom: 8 }} />
            {/* "For" label */}
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(201,168,76,0.7)' }}>
              A Personal Edition for
            </div>
            {/* Couple names */}
            <div style={{ fontFamily: GD, fontSize: 40, fontStyle: 'italic', fontWeight: 400, color: '#C9A84C', lineHeight: 1.2, margin: '4px 0' }}>
              {[personalisedData.partner1_name, personalisedData.partner2_name].filter(Boolean).join(' & ')}
            </div>
            {/* Wedding date */}
            {personalisedData.wedding_date && (
              <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.12em' }}>
                {new Date(personalisedData.wedding_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            )}
            {/* Venue name */}
            {personalisedData.venue_name && (
              <div style={{ fontFamily: GD, fontSize: 16, fontStyle: 'italic', color: 'rgba(255,255,255,0.5)', marginTop: -12 }}>
                {personalisedData.venue_name}
              </div>
            )}
            {/* Issue name */}
            <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
              {issue?.title || 'Luxury Wedding Directory'}
            </div>
            <div style={{ width: 64, height: 1, background: 'rgba(201,168,76,0.3)', marginTop: 4 }} />
            {/* Dismiss hint */}
            <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 8 }}>
              Tap anywhere to read
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
