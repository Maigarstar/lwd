// ─── src/pages/CmsPage.jsx ────────────────────────────────────────────────────
// Generic public CMS page renderer — renders any cms_pages entry by page_key
// Used for: /privacy, /terms, /cookies, /reviews-policy, /support
// Follows the AboutLWD.jsx pattern exactly.
//
// Props:
//   pageKey     string   — 'privacy' | 'terms' | 'cookies' | 'reviews-policy' | 'support'
//   onBack      fn       — navigate to home
//   footerNav   object   — footer navigation callbacks
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { ThemeCtx } from '../theme/ThemeContext';
import { getDarkPalette } from '../theme/tokens';
import HomeNav from '../components/nav/HomeNav';
import { fetchPage, fetchPageDraft } from '../services/cmsService';

const C = getDarkPalette();
const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

// ── Page type meta ────────────────────────────────────────────────────────────
const PAGE_META = {
  privacy:          { eyebrow: 'Legal',   category: 'Privacy' },
  terms:            { eyebrow: 'Legal',   category: 'Terms' },
  cookies:          { eyebrow: 'Legal',   category: 'Cookies' },
  'reviews-policy': { eyebrow: 'Legal',   category: 'Reviews' },
  support:          { eyebrow: 'Support', category: 'Help Centre' },
};

// ── Content prose styles ──────────────────────────────────────────────────────
const PROSE_STYLES = `
  .cms-public-content h1 {
    font-family: var(--font-heading-primary);
    font-size: clamp(22px, 2.2vw, 28px);
    font-weight: 600;
    color: #f5f0e8;
    margin: 0 0 18px;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .cms-public-content h2 {
    font-family: var(--font-heading-primary);
    font-size: clamp(18px, 1.8vw, 22px);
    font-weight: 600;
    color: #f5f0e8;
    margin: 44px 0 14px;
    letter-spacing: -0.01em;
    line-height: 1.3;
  }
  .cms-public-content h3 {
    font-family: var(--font-heading-primary);
    font-size: 16px;
    font-weight: 600;
    color: #C9A84C;
    margin: 30px 0 10px;
    letter-spacing: 0.01em;
  }
  .cms-public-content p {
    font-family: var(--font-body);
    font-size: 15px;
    color: rgba(245,240,232,0.68);
    line-height: 1.88;
    margin: 0 0 18px;
  }
  .cms-public-content a {
    color: #C9A84C;
    text-decoration: none;
    border-bottom: 1px solid rgba(201,168,76,0.3);
    transition: border-color 0.2s;
  }
  .cms-public-content a:hover {
    border-color: #C9A84C;
  }
  .cms-public-content ul,
  .cms-public-content ol {
    font-family: var(--font-body);
    padding-left: 24px;
    margin: 0 0 18px;
  }
  .cms-public-content li {
    font-size: 15px;
    color: rgba(245,240,232,0.68);
    line-height: 1.75;
    margin-bottom: 7px;
  }
  .cms-public-content hr {
    border: none;
    border-top: 1px solid rgba(255,255,255,0.08);
    margin: 36px 0;
  }
  .cms-public-content strong {
    color: #f5f0e8;
    font-weight: 600;
  }
  .cms-public-content em {
    font-style: italic;
    color: rgba(245,240,232,0.8);
  }
  .cms-public-content blockquote {
    border-left: 3px solid #C9A84C;
    margin: 24px 0;
    padding: 10px 22px;
    color: rgba(245,240,232,0.55);
    font-style: italic;
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.8;
  }
`;

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonLine({ width = '100%', height = 14, margin = '0 0 12px' }) {
  return (
    <div style={{
      width, height, margin,
      background: 'rgba(255,255,255,0.06)',
      borderRadius: 4,
      animation: 'lwd-shimmer 1.4s ease-in-out infinite',
    }} />
  );
}

// ── Format date ───────────────────────────────────────────────────────────────
function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CmsPage({ pageKey, onBack, footerNav }) {
  const [page, setPage]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  // Check if ?preview=1 is in URL
  const isPreview = typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('preview') === '1';

  useEffect(() => {
    setLoading(true);
    setError(null);

    const fetcher = isPreview ? fetchPageDraft : fetchPage;

    fetcher(pageKey)
      .then(data => {
        setPage(data);
        setLoading(false);
      })
      .catch(() => {
        setError('Page not found or not yet published.');
        setLoading(false);
      });
  }, [pageKey, isPreview]);

  const meta = PAGE_META[pageKey] || { eyebrow: 'Info', category: '' };
  const pageTitle = page?.seo_title || page?.title || 'Luxury Wedding Directory';
  const pageDesc  = page?.meta_description || '';

  return (
    <HelmetProvider>
      <ThemeCtx.Provider value={C}>
        <Helmet>
          <title>{pageTitle} — Luxury Wedding Directory</title>
          {pageDesc && <meta name="description" content={pageDesc} />}
          <meta name="robots" content={isPreview ? 'noindex' : 'index,follow'} />
        </Helmet>

        <style>{`
          ${PROSE_STYLES}
          @keyframes lwd-shimmer {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1; }
          }
        `}</style>

        <div style={{ background: C.black, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

          <HomeNav
            darkMode={true}
            onToggleDark={() => {}}
            onVendorLogin={onBack}
            onNavigateStandard={footerNav?.onNavigateStandard}
            onNavigateAbout={footerNav?.onNavigateAbout}
            onNavigateContact={footerNav?.onNavigateContact}
            hasHero={false}
          />

          <main style={{ flex: 1 }}>

            {/* ── Preview banner ── */}
            {isPreview && (
              <div style={{
                background: 'rgba(201,168,76,0.12)',
                borderBottom: '1px solid rgba(201,168,76,0.3)',
                padding: '10px 40px',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}>
                <span style={{
                  fontSize: 10, fontFamily: NU, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: '#C9A84C',
                }}>
                  ⬡ Preview — Draft
                </span>
                <span style={{ fontSize: 12, fontFamily: NU, color: 'rgba(201,168,76,0.6)' }}>
                  This page is not yet published. You are viewing a draft preview.
                </span>
              </div>
            )}

            {/* ── Hero section ── */}
            <section style={{
              background: C.black,
              padding: 'clamp(100px, 12vw, 148px) clamp(24px, 5vw, 60px) clamp(60px, 7vw, 88px)',
            }}>
              <div style={{ maxWidth: 860, margin: '0 auto' }}>

                {loading ? (
                  <>
                    <SkeletonLine width={100} height={10} margin="0 0 16px" />
                    <SkeletonLine width="60%" height={32} margin="0 0 18px" />
                    <SkeletonLine width={180} height={12} margin="0" />
                  </>
                ) : error ? null : (
                  <>
                    {/* Eyebrow */}
                    <div style={{
                      fontFamily: NU,
                      fontSize: 10,
                      letterSpacing: '0.26em',
                      textTransform: 'uppercase',
                      color: C.gold,
                      marginBottom: 14,
                    }}>
                      {meta.eyebrow}
                    </div>

                    {/* Title */}
                    <h1 style={{
                      fontFamily: GD,
                      fontSize: 'clamp(26px, 3vw, 40px)',
                      fontWeight: 600,
                      color: C.off,
                      margin: '0 0 16px',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                    }}>
                      {page.title}
                    </h1>

                    {/* Last updated */}
                    {page.last_updated && (
                      <div style={{
                        fontFamily: NU,
                        fontSize: 12,
                        color: 'rgba(255,255,255,0.3)',
                        letterSpacing: '0.03em',
                        marginBottom: 24,
                      }}>
                        Last updated: {formatDate(page.last_updated)}
                      </div>
                    )}

                    {/* Gold divider */}
                    <div aria-hidden style={{
                      width: 48,
                      height: 1,
                      background: `linear-gradient(90deg, ${C.gold}, transparent)`,
                    }} />
                  </>
                )}
              </div>
            </section>

            {/* ── Content section ── */}
            <section style={{
              background: C.card,
              borderTop: '1px solid rgba(255,255,255,0.05)',
              padding: 'clamp(48px, 6vw, 88px) clamp(24px, 5vw, 60px)',
              flex: 1,
            }}>
              <div style={{ maxWidth: 860, margin: '0 auto' }}>

                {loading && (
                  <>
                    <SkeletonLine height={12} margin="0 0 10px" />
                    <SkeletonLine width="90%" height={12} margin="0 0 10px" />
                    <SkeletonLine width="80%" height={12} margin="0 0 28px" />
                    <SkeletonLine width={140} height={16} margin="0 0 14px" />
                    <SkeletonLine height={12} margin="0 0 10px" />
                    <SkeletonLine width="85%" height={12} margin="0 0 10px" />
                    <SkeletonLine width="75%" height={12} margin="0 0 28px" />
                    <SkeletonLine width={140} height={16} margin="0 0 14px" />
                    <SkeletonLine height={12} margin="0 0 10px" />
                    <SkeletonLine width="92%" height={12} margin="0 0 10px" />
                  </>
                )}

                {error && (
                  <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <div style={{ fontFamily: GD, fontSize: 20, color: C.off, marginBottom: 12 }}>
                      Page not available
                    </div>
                    <p style={{ fontFamily: NU, fontSize: 14, color: 'rgba(255,255,255,0.38)', marginBottom: 28 }}>
                      {error}
                    </p>
                    <button
                      type="button"
                      onClick={onBack}
                      style={{
                        padding: '10px 24px',
                        background: 'rgba(201,168,76,0.12)',
                        border: '1px solid rgba(201,168,76,0.3)',
                        borderRadius: 6,
                        color: C.gold,
                        fontSize: 12,
                        fontFamily: NU,
                        fontWeight: 600,
                        cursor: 'pointer',
                        letterSpacing: '0.06em',
                      }}
                    >
                      ← Return to Home
                    </button>
                  </div>
                )}

                {!loading && !error && page && (
                  <div
                    className="cms-public-content"
                    dangerouslySetInnerHTML={{ __html: page.content_html }}
                  />
                )}
              </div>
            </section>
          </main>

        </div>
      </ThemeCtx.Provider>
    </HelmetProvider>
  );
}
