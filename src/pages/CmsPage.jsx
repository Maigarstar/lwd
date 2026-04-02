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
import { getDarkPalette, getLightPalette } from '../theme/tokens';
import HomeNav from '../components/nav/HomeNav';
import { fetchPage, fetchPageDraft } from '../services/cmsService';

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

// ── Content prose styles (theme-aware) ───────────────────────────────────────
function getProseStyles(isDark) {
  const heading  = isDark ? '#f5f0e8'                : '#111111';
  const body     = isDark ? 'rgba(245,240,232,0.65)' : 'rgba(17,17,17,0.65)';
  const bodyEm   = isDark ? 'rgba(245,240,232,0.8)'  : 'rgba(17,17,17,0.8)';
  const bodyBq   = isDark ? 'rgba(245,240,232,0.5)'  : 'rgba(17,17,17,0.5)';
  const strong   = isDark ? '#f5f0e8'                : '#111111';
  const cbText   = isDark ? 'rgba(245,240,232,0.6)'  : 'rgba(17,17,17,0.6)';
  const cbStrong = isDark ? 'rgba(245,240,232,0.85)' : 'rgba(17,17,17,0.85)';
  const h2Border = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';
  const hrBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)';
  const cbBg     = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)';
  const cbBorder = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)';

  return `
  /* Hide duplicate h1 — title already shown in hero */
  .cms-public-content > h1:first-child { display: none; }
  .cms-public-content h1 {
    font-family: var(--font-heading-primary);
    font-size: clamp(20px, 2vw, 26px);
    font-weight: 600;
    color: ${heading};
    margin: 56px 0 16px;
    letter-spacing: -0.01em;
    line-height: 1.25;
  }
  .cms-public-content h2 {
    font-family: var(--font-heading-primary);
    font-size: clamp(17px, 1.6vw, 21px);
    font-weight: 600;
    color: ${heading};
    margin: 56px 0 14px;
    letter-spacing: -0.01em;
    line-height: 1.3;
    padding-top: 8px;
    border-top: 1px solid ${h2Border};
  }
  .cms-public-content h3 {
    font-family: var(--font-heading-primary);
    font-size: 15px;
    font-weight: 600;
    color: #C9A84C;
    margin: 36px 0 10px;
    letter-spacing: 0.01em;
  }
  .cms-public-content p {
    font-family: var(--font-body);
    font-size: 15px;
    color: ${body};
    line-height: 1.9;
    margin: 0 0 18px;
  }
  .cms-public-content a {
    color: #C9A84C;
    text-decoration: none;
    border-bottom: 1px solid rgba(201,168,76,0.35);
    transition: border-color 0.2s, color 0.2s;
  }
  .cms-public-content a:hover { color: #dbb96a; border-color: #dbb96a; }
  .cms-public-content ul, .cms-public-content ol {
    font-family: var(--font-body);
    padding-left: 22px;
    margin: 0 0 22px;
  }
  .cms-public-content li {
    font-size: 15px;
    color: ${body};
    line-height: 1.8;
    margin-bottom: 8px;
  }
  .cms-public-content hr {
    border: none;
    border-top: 1px solid ${hrBorder};
    margin: 48px 0;
  }
  .cms-public-content strong { color: ${strong}; font-weight: 600; }
  .cms-public-content em { font-style: italic; color: ${bodyEm}; }
  .cms-public-content blockquote {
    border-left: 2px solid #C9A84C;
    margin: 28px 0;
    padding: 12px 24px;
    color: ${bodyBq};
    font-style: italic;
    font-family: var(--font-body);
    font-size: 14px;
    line-height: 1.85;
  }
  .cms-public-content .lwd-contact-block {
    background: ${cbBg};
    border: 1px solid ${cbBorder};
    border-left: 2px solid rgba(201,168,76,0.4);
    border-radius: 6px;
    padding: 22px 26px;
    margin: 24px 0 28px;
  }
  .cms-public-content .lwd-contact-block p { margin: 0 0 6px; font-size: 14px; color: ${cbText}; }
  .cms-public-content .lwd-contact-block p:last-child { margin: 0; }
  .cms-public-content .lwd-contact-block strong { color: ${cbStrong}; }
  .cms-anchor-nav {
    display: flex; gap: 10px; flex-wrap: wrap;
    margin: 0 0 40px; padding: 18px 22px;
    background: rgba(201,168,76,0.05);
    border: 1px solid rgba(201,168,76,0.15);
    border-radius: 6px;
  }
  .cms-anchor-nav a {
    font-family: var(--font-body); font-size: 11px; font-weight: 600;
    letter-spacing: 0.08em; text-transform: uppercase;
    color: rgba(201,168,76,0.8) !important; border-bottom: none !important;
    padding: 5px 12px; background: rgba(201,168,76,0.08);
    border-radius: 3px; transition: background 0.2s, color 0.2s; text-decoration: none;
  }
  .cms-anchor-nav a:hover {
    background: rgba(201,168,76,0.15) !important;
    color: #C9A84C !important; border-bottom: none !important;
  }
`;
}

// ── Skeleton loader ───────────────────────────────────────────────────────────
function SkeletonLine({ width = '100%', height = 14, margin = '0 0 12px', isDark = true }) {
  return (
    <div style={{
      width, height, margin,
      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
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
export default function CmsPage({ pageKey, onBack, footerNav, darkMode = true }) {
  const C  = darkMode ? getDarkPalette() : getLightPalette();
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
          <title>{pageTitle}{' \u2014 '}Luxury Wedding Directory</title>
          {pageDesc && <meta name="description" content={pageDesc} />}
          {isPreview
            ? <meta name="robots" content="noindex,nofollow" />
            : page && <meta name="robots" content={`${page.noindex ? 'noindex' : 'index'},${page.nofollow ? 'nofollow' : 'follow'}`} />
          }
        </Helmet>

        <style>{`
          ${getProseStyles(darkMode)}
          @keyframes lwd-shimmer {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1; }
          }
        `}</style>

        <div style={{ background: C.black, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

          <HomeNav
            darkMode={darkMode}
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
              <div style={{ maxWidth: 740, margin: '0 auto' }}>

                {loading ? (
                  <>
                    <SkeletonLine isDark={darkMode} width={100} height={10} margin="0 0 16px" />
                    <SkeletonLine isDark={darkMode} width="60%" height={32} margin="0 0 18px" />
                    <SkeletonLine isDark={darkMode} width={180} height={12} margin="0" />
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
              borderTop: `1px solid ${darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.06)'}`,
              padding: 'clamp(48px, 6vw, 88px) clamp(24px, 5vw, 60px)',
              flex: 1,
            }}>
              <div style={{ maxWidth: 740, margin: '0 auto' }}>

                {loading && (
                  <>
                    <SkeletonLine isDark={darkMode} height={12} margin="0 0 10px" />
                    <SkeletonLine isDark={darkMode} width="90%" height={12} margin="0 0 10px" />
                    <SkeletonLine isDark={darkMode} width="80%" height={12} margin="0 0 28px" />
                    <SkeletonLine isDark={darkMode} width={140} height={16} margin="0 0 14px" />
                    <SkeletonLine isDark={darkMode} height={12} margin="0 0 10px" />
                    <SkeletonLine isDark={darkMode} width="85%" height={12} margin="0 0 10px" />
                    <SkeletonLine isDark={darkMode} width="75%" height={12} margin="0 0 28px" />
                    <SkeletonLine isDark={darkMode} width={140} height={16} margin="0 0 14px" />
                    <SkeletonLine isDark={darkMode} height={12} margin="0 0 10px" />
                    <SkeletonLine isDark={darkMode} width="92%" height={12} margin="0 0 10px" />
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
