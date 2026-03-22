// ─── src/pages/ShowcaseRenderer.jsx ──────────────────────────────────────────
// Renders a showcase composition from structured sections JSON.
// Used by:
//   - Public showcase page (/showcase/:slug) — reads published_sections
//   - Showcase Studio right panel (preview) — reads sections (draft)
//
// VARIANT SYSTEM (locked pattern — extend here, never in page components)
//   Every visual difference is driven by: type + content + layout
//   No per-venue conditional logic. No if (slug === 'ritz') blocks.
//   If the Ritz showcase can be rebuilt from sections JSON alone, the system works.
//
// Theme system:
//   showcase.theme (DB jsonb column) overrides the default dark palette.
//   Shape: { mode:'light'|'dark', bg, bg2, bg3, accent, navBg, navText,
//             navActive, navBorder, heroOverlayOpacity }
//
// Media fallback hierarchy (auto-resolved per section):
//   1. section.content.image
//   2. showcase.hero_image_url
//   3. listingFirstImage (passed as prop)
//   4. null
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect }       from 'react';
import FeatureCard                   from '../components/cards/editorial/FeatureCard';
import QuoteCard                     from '../components/cards/editorial/QuoteCard';
import VenueStatsCard                from '../components/cards/editorial/VenueStatsCard';
import MosaicCard                    from '../components/cards/editorial/MosaicCard';
import TwoColumnEditorialCard        from '../components/cards/editorial/TwoColumnEditorialCard';
import VenueEnquireCard              from '../components/cards/editorial/VenueEnquireCard';
import { ShowcaseFaq }               from '../components/showcase';
import { SECTION_REGISTRY }          from '../services/showcaseRegistry';
import HomeNav                       from '../components/nav/HomeNav';
import MediaBlock                    from '../components/profile/MediaBlock';
import VideoGallery                  from '../components/profile/VideoGallery';
import { ThemeCtx, LIGHT }           from '../components/profile/ProfileDesignSystem';
import { useBreakpoint }             from '../hooks/useWindowWidth';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

// ── Default palettes ──────────────────────────────────────────────────────────
const DARK_PALETTE = {
  mode:               'dark',
  bg:                 '#0a0a08',
  bg2:                '#0f0e0c',
  bg3:                '#1a1209',
  accent:             '#C9A84C',
  text:               '#f5f0e8',
  muted:              'rgba(245,240,232,0.72)',
  label:              '#C9A84C',
  navBg:              'rgba(10,10,8,0.94)',
  navBorder:          'rgba(201,168,76,0.14)',
  navText:            'rgba(245,240,232,0.48)',
  navActive:          '#C9A84C',
  heroOverlayOpacity: 0.45,
};

const LIGHT_DEFAULTS = {
  mode:               'light',
  bg:                 '#FDFBF7',
  bg2:                '#F5F0E8',
  bg3:                '#EDE8DC',
  accent:             '#B8962E',
  text:               '#1C1410',
  muted:              'rgba(28,20,16,0.55)',
  label:              '#B8962E',
  navBg:              'rgba(253,251,247,0.97)',
  navBorder:          'rgba(184,150,46,0.18)',
  navText:            'rgba(28,20,16,0.45)',
  navActive:          '#B8962E',
  heroOverlayOpacity: 0.38,
};

function buildPalette(themeJson) {
  if (!themeJson || themeJson.mode !== 'light') return DARK_PALETTE;
  return { ...LIGHT_DEFAULTS, ...themeJson };
}

// ── Section types that appear in the sticky sub-nav ───────────────────────────
const NAV_ELIGIBLE = new Set([
  'intro', 'feature', 'mosaic', 'gallery', 'dining',
  'spaces', 'wellness', 'weddings', 'highlight-band', 'films', 'faq',
]);
const TYPE_LABEL = {
  intro:            'Overview',
  feature:          'Highlights',
  mosaic:           'Gallery',
  gallery:          'Gallery',
  films:            'Films',
  dining:           'Dining',
  spaces:           'Spaces',
  wellness:         'Wellness & Spa',
  weddings:         'Weddings',
  'highlight-band': 'Our Story',
  faq:              'FAQs',
};

// ── Sticky section sub-nav ────────────────────────────────────────────────────
function SectionNav({ sections, palette, showcase, onBack, onVisibleChange }) {
  const { isMobile } = useBreakpoint();
  const [visible,  setVisible]  = useState(false);

  const setVisibleWithCallback = (v) => {
    setVisible(v);
    onVisibleChange?.(v);
  };
  const [activeId, setActiveId] = useState(null);

  const GOLD = palette?.navActive || palette?.accent || '#C4A05A';
  const venueName = showcase?.title || showcase?.name || '';

  const navItems = sections
    .filter(s => NAV_ELIGIBLE.has(s.type))
    // Always use clean TYPE_LABEL — never pull raw eyebrow/title into the nav bar
    .map(s => ({ id: s.id, label: TYPE_LABEL[s.type] || s.type }))
    // De-duplicate identical labels by appending a number (1, 2…)
    .map((item, idx, arr) => {
      const sameLabel = arr.filter(x => x.label === item.label);
      if (sameLabel.length <= 1) return item;
      const nth = sameLabel.indexOf(item) + 1;
      return { ...item, label: `${item.label} ${nth}` };
    });

  useEffect(() => {
    function check() {
      setVisibleWithCallback(window.scrollY > window.innerHeight * 0.7);
    }
    check();
    window.addEventListener('scroll', check, { passive: true });
    return () => window.removeEventListener('scroll', check);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!navItems.length) return;
    const els = navItems
      .map(item => document.getElementById(`sec-${item.id}`))
      .filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActiveId(entry.target.id.replace('sec-', ''));
        });
      },
      { rootMargin: '-15% 0px -65% 0px', threshold: 0 }
    );
    els.forEach(el => obs.observe(el));
    return () => obs.disconnect();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections]);

  if (!navItems.length) return null;

  const scrollTo = (id) => {
    const el = document.getElementById(`sec-${id}`);
    if (!el) return;
    const y = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div
      role="navigation"
      aria-label="Showcase sections"
      style={{
        position:       'fixed',
        top:            0,
        left:           0,
        right:          0,
        zIndex:         900,
        height:         56,
        background:     'rgba(249,247,242,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom:   '1px solid rgba(0,0,0,0.08)',
        boxShadow:      '0 2px 20px rgba(0,0,0,0.06)',
        display:        'flex',
        alignItems:     'center',
        padding:        isMobile ? '0 16px' : '0 32px',
        gap:            0,
        pointerEvents:  visible ? 'auto' : 'none',
        transform:      visible ? 'translateY(0)' : 'translateY(-100%)',
        transition:     'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {/* Venue name — left */}
      {venueName && !isMobile && (
        <span style={{
          fontFamily: GD, fontSize: 15, fontWeight: 400,
          color: '#1a1a1a', whiteSpace: 'nowrap', flexShrink: 0,
          marginRight: 32, letterSpacing: '-0.01em',
        }}>
          {venueName}
        </span>
      )}

      {/* Divider */}
      {venueName && navItems.length > 0 && !isMobile && (
        <div style={{ width: 1, height: 20, background: 'rgba(0,0,0,0.12)', flexShrink: 0, marginRight: 8 }} />
      )}

      {/* Section links — scrollable centre */}
      <div style={{ display: 'flex', alignItems: 'center', overflowX: 'auto', flex: 1, scrollbarWidth: 'none' }}>
        {navItems.map(item => {
          const isActive = activeId === item.id;
          return (
            <button
              key={item.id}
              onClick={() => scrollTo(item.id)}
              style={{
                background:    'none',
                border:        'none',
                borderBottom:  isActive ? `2px solid ${GOLD}` : '2px solid transparent',
                cursor:        'pointer',
                padding:       isMobile ? '0 12px' : '0 18px',
                height:        48,
                fontFamily:    NU,
                fontSize:      11,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                fontWeight:    isActive ? 700 : 500,
                color:         isActive ? '#1a1a1a' : 'rgba(28,20,16,0.5)',
                whiteSpace:    'nowrap',
                flexShrink:    0,
                transition:    'color 0.2s ease, border-color 0.2s ease',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = '#1a1a1a'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(28,20,16,0.5)'; }}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* ENQUIRE button — right */}
      <button
        onClick={onBack}
        style={{
          flexShrink: 0, marginLeft: 16,
          background: GOLD, border: 'none',
          borderRadius: 2, cursor: 'pointer',
          padding: isMobile ? '7px 12px' : '8px 20px',
          fontFamily: NU, fontSize: isMobile ? 10 : 11, fontWeight: 700,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          color: '#ffffff', transition: 'background 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = '#b8924a'}
        onMouseLeave={e => e.currentTarget.style.background = GOLD}
      >
        Enquire
      </button>
    </div>
  );
}

// ── Media fallback resolver ───────────────────────────────────────────────────
function resolveImage(sectionImage, showcaseHero, listingFirstImage) {
  return sectionImage || showcaseHero || listingFirstImage || null;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function HeroSection({ content, layout, showcaseHero, listingFirstImage, palette }) {
  const P     = palette;
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  const op    = content.overlay_opacity ?? P.heroOverlayOpacity;

  return (
    <div style={{
      position: 'relative',
      height: '85vh', minHeight: 480,
      overflow: 'hidden',
      background: '#0a0a08',
    }}>
      {image && (
        <img
          src={image}
          alt={content.title || ''}
          loading="eager"
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, rgba(0,0,0,${op + 0.30}) 0%, rgba(0,0,0,${op}) 50%, rgba(0,0,0,${op - 0.20}) 100%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(20px, 3vw, 48px) clamp(32px, 5vw, 80px) clamp(24px, 3vw, 40px)',
      }}>
        {(content.eyebrow) && (
          <p style={{
            fontFamily: NU, fontSize: 10, letterSpacing: '0.22em',
            textTransform: 'uppercase', color: P.label,
            margin: '0 0 16px', fontWeight: 600,
          }}>
            {content.eyebrow}
          </p>
        )}
        <h1 style={{
          fontFamily: GD,
          fontSize: 'clamp(36px, 6vw, 88px)',
          fontWeight: 400, color: '#f5f0e8',
          margin: '0 0 12px', lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>
          {content.title || 'Venue Name'}
        </h1>
        {content.address && (
          <p style={{
            fontFamily: NU,
            fontSize: 'clamp(13px, 1.2vw, 16px)',
            fontStyle: 'italic',
            color: 'rgba(245,240,232,0.65)',
            margin: '0 0 14px',
          }}>
            {content.address}
          </p>
        )}
        {content.tagline && (
          <p style={{
            fontFamily: NU,
            fontSize: 'clamp(15px, 1.5vw, 20px)',
            color: 'rgba(245,240,232,0.80)',
            margin: 0, maxWidth: 620, lineHeight: 1.7,
          }}>
            {content.tagline}
          </p>
        )}
        {/* Stats bar — shown when content.stats array provided */}
        {content.stats && content.stats.length > 0 && (
          <div style={{
            display: 'flex', gap: 0, marginTop: 20,
            borderTop: '1px solid rgba(245,240,232,0.18)',
            paddingTop: 16, flexWrap: 'wrap',
          }}>
            {content.stats.map((stat, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'baseline', gap: 8,
                paddingRight: 32, marginBottom: 8,
                borderRight: i < content.stats.length - 1 ? '1px solid rgba(245,240,232,0.18)' : 'none',
                marginRight: i < content.stats.length - 1 ? 32 : 0,
              }}>
                <span style={{
                  fontFamily: GD,
                  fontSize: 'clamp(22px, 3vw, 40px)',
                  fontWeight: 400, color: '#f5f0e8',
                  lineHeight: 1, letterSpacing: '-0.01em',
                }}>
                  {stat.value}
                </span>
                <span style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: 'rgba(245,240,232,0.55)',
                }}>
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── IntroSection — 3 variants ─────────────────────────────────────────────────
function IntroSection({ content, layout, palette }) {
  const P       = palette;
  const variant = layout?.variant || 'centered';

  // centered: full-width dark/light block, text centred — uses TwoColumnEditorialCard
  if (variant === 'centered') {
    return (
      <TwoColumnEditorialCard data={{
        variant:  'centered',
        eyebrow:  content.eyebrow,
        title:    content.headline,
        body:     content.body ? [content.body] : [],
        accentBg: layout?.accentBg || P.bg,
        theme:    P.mode,
      }} />
    );
  }

  // left-aligned: editorial newspaper feel — heading + body left-aligned
  if (variant === 'left-aligned') {
    const bg      = layout?.accentBg || P.bg2;
    const bgLc    = bg.toLowerCase();
    const isLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd');
    const textCol = isLight ? '#1C1410' : '#f5f0e8';
    const mutCol  = isLight ? 'rgba(28,20,16,0.6)' : 'rgba(245,240,232,0.65)';
    const goldCol = P.accent;
    return (
      <div style={{ background: bg, padding: 'clamp(48px, 7vw, 96px) clamp(24px, 6vw, 120px)' }}>
        <div style={{ maxWidth: 860 }}>
          {content.eyebrow && (
            <p style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: goldCol, margin: '0 0 20px',
            }}>
              {content.eyebrow}
            </p>
          )}
          <h2 style={{
            fontFamily: GD,
            fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 400, color: textCol,
            margin: '0 0 6px', lineHeight: 1.1,
          }}>
            {content.headline}
          </h2>
          <div style={{ width: 40, height: 1, background: goldCol, margin: '20px 0 28px' }} />
          {content.body && (
            <p style={{
              fontFamily: NU, fontSize: 16, lineHeight: 1.85,
              color: mutCol, margin: 0, maxWidth: 680,
            }}>
              {content.body}
            </p>
          )}
        </div>
      </div>
    );
  }

  // narrow: constrained width, intimate feel — cream background
  const bg      = layout?.accentBg || (P.mode === 'light' ? '#faf9f6' : P.bg2);
  const bgLc    = bg.toLowerCase();
  const isLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd');
  const textCol = isLight ? '#1C1410' : '#f5f0e8';
  const mutCol  = isLight ? 'rgba(28,20,16,0.6)' : 'rgba(245,240,232,0.65)';
  const goldCol = P.accent;
  return (
    <div style={{ background: bg, padding: 'clamp(56px, 8vw, 104px) clamp(24px, 6vw, 80px)', display: 'flex', justifyContent: 'center' }}>
      <div style={{ maxWidth: 640, width: '100%' }}>
        {content.eyebrow && (
          <p style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: goldCol, margin: '0 0 20px',
          }}>
            {content.eyebrow}
          </p>
        )}
        <h2 style={{
          fontFamily: GD,
          fontSize: 'clamp(24px, 3vw, 40px)',
          fontWeight: 400, color: textCol,
          margin: '0 0 6px', lineHeight: 1.15,
        }}>
          {content.headline}
        </h2>
        <div style={{ width: 32, height: 1, background: goldCol, margin: '18px 0 24px' }} />
        {content.body && (
          <p style={{
            fontFamily: NU, fontSize: 15, lineHeight: 1.85,
            color: mutCol, margin: 0,
          }}>
            {content.body}
          </p>
        )}
      </div>
    </div>
  );
}

// ── FeatureSection — 4 variants ───────────────────────────────────────────────
function FeatureSection({ content, layout, showcaseHero, listingFirstImage, palette }) {
  const P       = palette;
  const image   = resolveImage(content.image, showcaseHero, listingFirstImage);
  const variant = layout?.variant || 'image-left';

  // dark-block: full-width storytelling, optional image below
  if (variant === 'dark-block') {
    const bg      = layout?.accentBg || P.bg2;
    const bgLc    = bg.toLowerCase();
    const isLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d');
    const textCol = isLight ? '#1C1410' : '#f5f0e8';
    const mutCol  = isLight ? 'rgba(28,20,16,0.6)' : 'rgba(245,240,232,0.65)';
    const goldCol = P.accent;
    return (
      <div style={{ background: bg, padding: 'clamp(56px, 8vw, 104px) clamp(24px, 6vw, 120px)' }}>
        <div style={{ maxWidth: 860 }}>
          {content.eyebrow && (
            <p style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: goldCol, margin: '0 0 20px',
            }}>
              {content.eyebrow}
            </p>
          )}
          <h2 style={{
            fontFamily: GD, fontSize: 'clamp(28px, 4vw, 52px)',
            fontWeight: 400, color: textCol, margin: '0 0 6px', lineHeight: 1.1,
          }}>
            {content.headline}
          </h2>
          <div style={{ width: 40, height: 1, background: goldCol, margin: '20px 0 28px' }} />
          {content.body && (
            <p style={{
              fontFamily: NU, fontSize: 15, lineHeight: 1.85,
              color: mutCol, margin: 0, maxWidth: 680,
            }}>
              {content.body}
            </p>
          )}
        </div>
        {image && (
          <div style={{ marginTop: 48, overflow: 'hidden' }}>
            <img
              src={image} alt={content.headline || ''}
              style={{ width: '100%', aspectRatio: '16/7', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
      </div>
    );
  }

  // image-left, image-right, centered — use FeatureCard
  return (
    <FeatureCard data={{
      variant:  variant,
      image,
      category: content.eyebrow,
      title:    content.headline,
      excerpt:  content.body,
      accentBg: layout?.accentBg || P.bg2,
      theme:    P.mode,
    }} />
  );
}

// ── HighlightBandSection — new type ──────────────────────────────────────────
function HighlightBandSection({ content, layout, palette }) {
  const P         = palette;
  const isDark    = layout?.theme !== 'light';
  const bg        = layout?.accentBg || (isDark ? '#0a0a08' : '#faf9f6');
  const isCenter  = (layout?.align || 'center') === 'center';
  const isLarge   = layout?.size === 'large';

  const bgLc      = bg.toLowerCase();
  const bgIsLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd');
  const textCol   = bgIsLight ? '#1C1410' : '#f5f0e8';
  const mutCol    = bgIsLight ? 'rgba(28,20,16,0.58)' : 'rgba(245,240,232,0.62)';
  const goldCol   = P.accent;

  return (
    <div style={{
      background: bg,
      padding: `clamp(72px, 10vw, 140px) clamp(32px, 8vw, 160px)`,
      textAlign: isCenter ? 'center' : 'left',
    }}>
      <div style={{
        maxWidth: isLarge ? 900 : 760,
        margin: isCenter ? '0 auto' : '0',
      }}>
        {content.eyebrow && (
          <p style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.2em', textTransform: 'uppercase',
            color: goldCol, margin: '0 0 24px',
          }}>
            {content.eyebrow}
          </p>
        )}
        <h2 style={{
          fontFamily: GD,
          fontSize: isLarge
            ? 'clamp(32px, 5vw, 72px)'
            : 'clamp(26px, 3.5vw, 52px)',
          fontWeight: 400,
          color: textCol,
          margin: 0,
          lineHeight: 1.1,
          letterSpacing: '-0.01em',
        }}>
          {content.headline}
        </h2>
        {content.divider !== false && (
          <div style={{
            width: 48, height: 1, background: goldCol,
            margin: isCenter ? '28px auto' : '28px 0',
          }} />
        )}
        {content.body && (
          <p style={{
            fontFamily: NU,
            fontSize: 'clamp(14px, 1.2vw, 18px)',
            lineHeight: 1.85,
            color: mutCol,
            margin: content.divider !== false ? 0 : '28px 0 0',
            maxWidth: isCenter ? 680 : 600,
            marginLeft: isCenter ? 'auto' : 0,
            marginRight: isCenter ? 'auto' : 0,
          }}>
            {content.body}
          </p>
        )}
      </div>
    </div>
  );
}

// ── StatsSection — 2 variants ─────────────────────────────────────────────────
function StatsSection({ content, layout, palette }) {
  const P       = palette;
  const variant = layout?.variant || 'strip';

  if (variant === 'table') {
    const bg      = layout?.accentBg || P.bg2;
    const bgLc    = bg.toLowerCase();
    const isLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d');
    const textCol = isLight ? '#1C1410' : '#f5f0e8';
    const mutCol  = isLight ? 'rgba(28,20,16,0.55)' : 'rgba(245,240,232,0.55)';
    const brdCol  = isLight ? 'rgba(28,20,16,0.1)' : 'rgba(245,240,232,0.1)';
    const goldCol = P.accent;
    return (
      <div style={{ background: bg, padding: 'clamp(48px, 6vw, 80px) clamp(24px, 6vw, 120px)' }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {content.eyebrow && (
            <p style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              color: goldCol, margin: '0 0 32px',
            }}>
              {content.eyebrow}
            </p>
          )}
          {(content.items || []).map((item, i) => (
            <div key={i} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              flexWrap: 'wrap', gap: '4px 16px',
              padding: '16px 0',
              borderBottom: `1px solid ${brdCol}`,
            }}>
              <span style={{
                fontFamily: NU, fontSize: 12, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', color: mutCol,
              }}>
                {item.label}
              </span>
              <span style={{ fontFamily: GD, fontSize: 22, color: textCol, fontWeight: 400 }}>
                {item.value}
                {item.sublabel && (
                  <span style={{ fontFamily: NU, fontSize: 11, color: mutCol, marginLeft: 8, fontWeight: 400 }}>
                    {item.sublabel}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // strip (default) — existing VenueStatsCard
  return (
    <VenueStatsCard data={{
      variant:  'strip',
      eyebrow:  content.eyebrow,
      stats:    (content.items || []).map(i => ({
        value:    i.value,
        label:    i.label,
        sublabel: i.sublabel || i.sub || '',
      })),
      accentBg: layout?.accentBg || P.bg3,
      theme:    P.mode,
    }} />
  );
}

function QuoteSection({ content, layout, palette }) {
  const P = palette;
  return (
    <QuoteCard data={{
      variant:         layout?.variant || 'centered',
      quote:           content.text,
      attribution:     content.attribution,
      attributionRole: content.attributionRole,
      image:           content.image || null,
      accentBg:        layout?.accentBg || P.bg2,
      theme:           P.mode,
    }} />
  );
}

// ── MosaicSection — 3 layout patterns ────────────────────────────────────────
function MosaicSection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P       = palette;
  const images  = (content.images || []).filter(i => i.url).map(i => i.url);
  const pattern = layout?.pattern || 'grid';

  if (images.length < 2) {
    return (
      <div style={{ background: P.bg2, padding: isMobile ? '40px 24px' : '60px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: NU, fontSize: 13, color: P.muted }}>
          Mosaic — add at least 2 images to preview
        </p>
      </div>
    );
  }

  // asymmetrical: 1 large portrait left + 2 stacked right
  // on mobile: vertical stack of all 3 images
  if (pattern === 'asymmetrical') {
    if (isMobile) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, lineHeight: 0 }}>
          {images.slice(0, 3).map((url, i) => (
            <div key={i} style={{ overflow: 'hidden', aspectRatio: i === 0 ? '4/3' : '3/2' }}>
              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      );
    }
    return (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, lineHeight: 0 }}>
        <div style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
          <img src={images[0]} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {images.slice(1, 3).map((url, i) => (
            <div key={i} style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
              <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  // stacked: 4 tall images — 2-col on mobile
  if (pattern === 'stacked') {
    const cols = isMobile ? 2 : Math.min(images.length, 4);
    return (
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 4, lineHeight: 0 }}>
        {images.slice(0, 4).map((url, i) => (
          <div key={i} style={{ overflow: 'hidden', aspectRatio: '2/3' }}>
            <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        ))}
      </div>
    );
  }

  // grid (default) — 2-col on mobile, 4-col on desktop
  return (
    <div style={{ background: P.bg }}>
      {(content.title || content.body) && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '32px 24px 20px' : '64px 64px 40px' }}>
          {content.title && (
            <h2 style={{ fontFamily: GD, fontSize: 'clamp(22px,3vw,42px)', fontWeight: 400, color: P.text, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              {content.title}
            </h2>
          )}
          {content.body && (
            <p style={{ fontFamily: NU, fontSize: 15, color: P.muted, margin: 0, lineHeight: 1.7, maxWidth: 640 }}>
              {content.body}
            </p>
          )}
        </div>
      )}
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : 'repeat(4, 1fr)', gap: 4, lineHeight: 0 }}>
        {images.slice(0, 4).map((url, i) => (
          <div key={i} style={{ overflow: 'hidden', aspectRatio: '3/4' }}>
            <img src={url} alt="" loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s ease' }}
              onMouseEnter={e => !isMobile && (e.currentTarget.style.transform = 'scale(1.04)')}
              onMouseLeave={e => !isMobile && (e.currentTarget.style.transform = 'scale(1)')}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── ShowcaseLightbox — minimal fullscreen lightbox ────────────────────────────
function ShowcaseLightbox({ images, idx, onClose, onPrev, onNext }) {
  if (idx === null || idx === undefined || !images[idx]) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(0,0,0,0.95)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <button onClick={e => { e.stopPropagation(); onPrev(); }} style={{
        position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: 48, height: 48, cursor: 'pointer', color: '#fff', fontSize: 22, lineHeight: 1,
      }}>‹</button>
      <img
        src={images[idx].url} alt={images[idx].caption || ''}
        onClick={e => e.stopPropagation()}
        style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: 2 }}
      />
      <button onClick={e => { e.stopPropagation(); onNext(); }} style={{
        position: 'absolute', right: 24, top: '50%', transform: 'translateY(-50%)',
        background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%',
        width: 48, height: 48, cursor: 'pointer', color: '#fff', fontSize: 22, lineHeight: 1,
      }}>›</button>
      <button onClick={onClose} style={{
        position: 'absolute', top: 20, right: 24,
        background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1,
      }}>×</button>
      <div style={{
        position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
        fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em',
      }}>{idx + 1} / {images.length}</div>
    </div>
  );
}

// ── GallerySection — uses MediaBlock (same as IC Park Lane / Ritz) ────────────
function GallerySection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P      = palette;
  const images = (content.images || []).filter(i => i.url);
  if (!images.length) return null;

  // Map to MediaBlock / ImageGallery format: { id, src, alt }
  const galleryItems = images.map((item, i) => ({
    id:  `showcase-img-${i}`,
    src: item.url,
    alt: item.caption || '',
  }));

  return (
    <div style={{ background: '#ffffff' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px 48px' : '28px 64px 80px' }}>
        {content.title && (
          <p style={{
            fontFamily: NU, fontSize: 10, letterSpacing: '0.18em',
            textTransform: 'uppercase', color: P.accent, fontWeight: 600,
            margin: '0 0 24px',
          }}>
            {content.title}
          </p>
        )}
        {/* ThemeCtx.Provider supplies LIGHT theme so ImageGallery renders correctly */}
        <ThemeCtx.Provider value={LIGHT}>
          <MediaBlock videos={[]} gallery={galleryItems} />
        </ThemeCtx.Provider>
      </div>
    </div>
  );
}

// ── FilmsSection — inline YouTube/Vimeo player ───────────────────────────────
function FilmsSection({ content, palette }) {
  const { isMobile } = useBreakpoint();
  const P      = palette;
  const videos = content.videos || [];
  const [activeIdx, setActiveIdx] = useState(0);
  if (!videos.length) return null;

  const active = videos[activeIdx] || videos[0];
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const embedUrl = active.youtubeId
    ? `https://www.youtube-nocookie.com/embed/${active.youtubeId}?rel=0&modestbranding=1&iv_load_policy=3&playsinline=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`
    : active.vimeoId
    ? `https://player.vimeo.com/video/${active.vimeoId}`
    : null;

  return (
    <div style={{ background: P.bg, padding: isMobile ? '40px 0 56px' : '64px 0 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 clamp(24px, 5vw, 64px)' }}>
        {content.eyebrow && (
          <p style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: P.accent, margin: '0 0 28px',
          }}>
            {content.eyebrow}
          </p>
        )}
        {embedUrl && (
          <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000', borderRadius: 2, overflow: 'hidden' }}>
            <iframe
              src={embedUrl}
              title={active.title || 'Film'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          </div>
        )}
        {active.title && (
          <p style={{ fontFamily: GD, fontSize: 18, color: P.text, margin: '20px 0 4px' }}>
            {active.title}
          </p>
        )}
        {videos.length > 1 && (
          <div style={{ display: 'flex', gap: 12, marginTop: 20, overflowX: 'auto' }}>
            {videos.map((v, i) => (
              <button key={v.id || i} onClick={() => setActiveIdx(i)} style={{
                flexShrink: 0, width: isMobile ? 112 : 140, height: isMobile ? 63 : 80, padding: 0, border: 'none',
                cursor: 'pointer', opacity: i === activeIdx ? 1 : 0.6,
                outline: i === activeIdx ? `2px solid ${P.accent}` : 'none',
                borderRadius: 2, overflow: 'hidden', background: '#000',
              }}>
                <img src={v.thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function EditorialFeatureSection({ content, layout, showcaseHero, listingFirstImage, palette }) {
  const P     = palette;
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  return (
    <FeatureCard data={{
      variant:  layout?.variant || 'image-left',
      image,
      category: content.eyebrow || '',
      title:    content.headline,
      excerpt:  content.body,
      accentBg: layout?.accentBg || P.bg2,
      theme:    P.mode,
    }} />
  );
}

function FullImageSection({ content }) {
  if (!content.url) return null;
  return (
    <div style={{ position: 'relative', height: content.height || '60vh', overflow: 'hidden' }}>
      <img
        src={content.url}
        alt={content.alt || ''}
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
      />
      {content.caption && (
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.6)',
          letterSpacing: '0.05em', textAlign: 'center',
        }}>
          {content.caption}
        </div>
      )}
    </div>
  );
}

function CtaSection({ content, venueName, palette }) {
  const P = palette;
  return (
    <VenueEnquireCard data={{
      headline:    content.headline || 'Begin Your Story',
      subline:     content.subline  || '',
      background:  content.background || null,
      venueName:   content.venueName || venueName || '',
      // Always use LWD standard gold for the enquiry form — never the venue brand accent
      theme:       P.mode,
    }} />
  );
}

function RelatedSection({ content, palette }) {
  const P = palette;
  return (
    <div style={{ padding: '60px 40px', background: P.bg2, textAlign: 'center' }}>
      <p style={{
        fontFamily: NU, fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: P.accent, fontWeight: 600, margin: '0 0 32px',
      }}>
        {content.title || 'You may also love'}
      </p>
      <p style={{ fontFamily: NU, fontSize: 13, color: P.muted, margin: 0 }}>
        Related venues will appear here once linked.
      </p>
    </div>
  );
}

// ── PricingSection — editorial list design matching ShowcasePricing ───────────
function PricingSection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P         = palette;
  const lightMode = P.mode === 'light';
  const bg        = layout?.accentBg || (lightMode ? '#faf9f6' : '#130f1e');
  const textCol   = lightMode ? '#1a1209' : '#f5f0e8';
  const mutCol    = lightMode ? 'rgba(26,18,9,0.6)' : 'rgba(245,240,232,0.55)';
  const goldCol   = P.accent;
  const borderCol = lightMode ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const divider   = lightMode ? 'rgba(26,18,9,0.12)' : 'rgba(245,240,232,0.12)';

  // Support both content.includes/excludes (XO legacy) and content.pricing_includes/excludes
  const includes = content.pricing_includes || content.includes || [];
  const excludes = content.pricing_excludes || content.excludes || [];

  // Headline price figures — support both pre-formatted strings and pence integers
  function fmtPence(pence, cur = 'GBP') {
    if (!pence && pence !== 0) return null;
    if (typeof pence === 'string') return pence; // already formatted
    const amount = Math.round(pence / 100);
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: cur, maximumFractionDigits: 0 }).format(amount);
  }
  const cur = content.currency || 'GBP';
  const priceFigures = [
    content.venue_hire_from    && { label: 'Venue Hire From', value: fmtPence(content.venue_hire_from, cur),    sub: 'starting point' },
    content.minimum_spend      && { label: 'Minimum Spend',   value: fmtPence(content.minimum_spend, cur),      sub: 'required investment' },
    content.price_per_head_from && { label: 'Per Head From',  value: fmtPence(content.price_per_head_from, cur), sub: 'per guest' },
    // Legacy pre-formatted fields
    (!content.venue_hire_from && !content.minimum_spend && content.price_from) && { label: content.price_context || 'From', value: content.price_from, sub: null },
  ].filter(Boolean);

  const hasSpendRange = content.typical_min || content.typical_max;
  const venueName = content.venue_name || 'This venue';

  return (
    <div style={{ background: bg, padding: isMobile ? '48px 20px 56px' : 'clamp(56px, 8vw, 104px) clamp(24px, 6vw, 120px)' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Eyebrow + heading */}
        <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldCol, margin: '0 0 14px' }}>
          {content.eyebrow || 'Pricing & What to Expect'}
        </p>
        <h2 style={{ fontFamily: GD, fontSize: 'clamp(26px, 3.5vw, 42px)', color: textCol, margin: '0 0 8px', fontWeight: 400, lineHeight: 1.15 }}>
          {content.headline || 'Understanding the Investment'}
        </h2>
        <div style={{ width: 40, height: 1, background: goldCol, margin: '0 0 36px' }} />

        {/* Spend range summary */}
        {hasSpendRange && (
          <p style={{ fontFamily: NU, fontSize: 15, lineHeight: 1.8, color: textCol, margin: '0 0 28px', fontStyle: 'italic' }}>
            Weddings at {venueName} typically represent a total investment of {[content.typical_min, content.typical_max].filter(Boolean).join(' to ')}, depending on guest count, season, and the level of bespoke elements chosen.
          </p>
        )}

        {/* Intro body */}
        {content.body && (
          <p style={{ fontFamily: NU, fontSize: 14, lineHeight: 1.8, color: mutCol, margin: '0 0 40px' }}>
            {content.body}
          </p>
        )}

        {/* ── Headline price figures ── */}
        {priceFigures.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? `repeat(${Math.min(priceFigures.length, 2)}, 1fr)` : `repeat(${priceFigures.length}, 1fr)`,
            gap: 0,
            borderTop: `1px solid ${borderCol}`,
            borderBottom: `1px solid ${borderCol}`,
            paddingTop: 28,
            paddingBottom: 28,
            marginBottom: 48,
          }}>
            {priceFigures.map((fig, i) => (
              <div key={i} style={{
                paddingRight: i < priceFigures.length - 1 ? 28 : 0,
                paddingLeft:  i > 0 ? 28 : 0,
                borderRight:  i < priceFigures.length - 1 ? `1px solid ${divider}` : 'none',
              }}>
                <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: goldCol, marginBottom: 10 }}>
                  {fig.label}
                </div>
                <div style={{ fontFamily: GD, fontSize: 'clamp(32px, 4vw, 52px)', color: textCol, lineHeight: 1, marginBottom: 6, fontWeight: 400 }}>
                  {fig.value}
                </div>
                {fig.sub && (
                  <div style={{ fontFamily: NU, fontSize: 11, color: mutCol, letterSpacing: '0.04em' }}>
                    {fig.sub}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ── Includes / Excludes — two editorial columns with divider ── */}
        {(includes.length > 0 || excludes.length > 0) && (
          <div style={{ display: isMobile ? 'block' : 'grid', gridTemplateColumns: includes.length > 0 && excludes.length > 0 ? '1fr 1px 1fr' : '1fr', gap: isMobile ? 0 : '0 40px', paddingTop: 4 }}>

            {/* Column 1: Typically Includes */}
            {includes.length > 0 && (
              <div>
                <p style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: goldCol, margin: '0 0 8px' }}>
                  Typically Includes
                </p>
                <div>
                  {includes.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 0' }}>
                      <span style={{ fontFamily: NU, fontSize: 13, color: goldCol, flexShrink: 0, marginTop: 1, lineHeight: 1 }}>—</span>
                      <span style={{ fontFamily: NU, fontSize: 14, color: textCol, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Vertical divider — desktop only */}
            {!isMobile && includes.length > 0 && excludes.length > 0 && (
              <div style={{ background: divider, width: 1 }} />
            )}

            {/* Column 2: Additional Costs */}
            {excludes.length > 0 && (
              <div style={{ marginTop: isMobile && includes.length > 0 ? 32 : 0 }}>
                <p style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: mutCol, margin: '0 0 8px' }}>
                  Additional Costs
                </p>
                <div>
                  {excludes.map((item, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '9px 0' }}>
                      <span style={{ fontFamily: NU, fontSize: 13, color: mutCol, flexShrink: 0, marginTop: 1, lineHeight: 1, opacity: 0.6 }}>○</span>
                      <span style={{ fontFamily: NU, fontSize: 14, color: mutCol, lineHeight: 1.5 }}>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Guidance note */}
        {content.guidance && (
          <div style={{ borderTop: `1px solid ${divider}`, paddingTop: 24, marginTop: 32 }}>
            <p style={{ fontFamily: NU, fontSize: 14, color: mutCol, lineHeight: 1.85, fontStyle: 'italic', margin: 0 }}>
              {content.guidance}
            </p>
          </div>
        )}

        {/* Disclosure */}
        <p style={{ fontFamily: NU, fontSize: 11, color: mutCol, margin: '32px 0 0', letterSpacing: '0.02em', borderTop: `1px solid ${borderCol}`, paddingTop: 20 }}>
          All pricing is indicative. Final investment varies by date, guest count, menu, and bespoke requirements. Contact the venue directly for a tailored proposal.
        </p>
      </div>
    </div>
  );
}

// ── VerifiedSection (At a Glance) — stat-first premium design ────────────────
function VerifiedSection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P       = palette;
  const bg      = layout?.accentBg || (P.mode === 'light' ? '#ffffff' : '#1a1410');
  const bgLc    = bg.toLowerCase();
  const isLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d') || bgLc.startsWith('#1a') ? false
    : (bgLc.startsWith('#ff') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd') || bgLc.startsWith('#fe') || bg === '#ffffff' || bg === '#faf9f6' || bg === '#fdfbf7');
  // Simpler: use palette mode
  const lightMode = P.mode === 'light';
  const textCol   = lightMode ? '#1a1209' : '#f5f0e8';
  const mutCol    = lightMode ? 'rgba(26,18,9,0.55)' : 'rgba(245,240,232,0.5)';
  const goldCol   = P.accent;
  const borderCol = lightMode ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const bgFinal   = layout?.accentBg || (lightMode ? '#ffffff' : '#1a1410');

  // ── Secondary detail rows ───────────────────────────────────────────────────
  const CATERING_LABELS = { in_house_only: 'In-house only', approved_list: 'Approved caterers', open: 'Open to external' };
  const details = [
    ['Ceremony',         content.ceremony_capacity],
    ['Dining',           content.dining_capacity ? `${content.dining_capacity} guests` : null],
    ['Reception',        content.reception_capacity ? `${content.reception_capacity} guests` : null],
    ['Bedrooms',         content.bedrooms],
    ['Exclusive Use',    content.exclusive_use],
    ['Catering',         CATERING_LABELS[content.catering] || content.catering],
    ['Outdoor Ceremony', content.outdoor_ceremony === true ? 'Available' : content.outdoor_ceremony === false ? 'Indoor only' : content.outdoor_ceremony],
    ['Accommodation',    content.accommodation === true ? 'On-site' : content.accommodation === false ? 'Off-site only' : content.accommodation],
    ['Location',         content.location_summary],
    ['Style',            content.style],
    ['Best For',         content.best_for],
    ['Venue Hire From',  content.venue_hire_from],
    ['Typical Spend',    content.typical_spend_min && content.typical_spend_max
      ? `${content.typical_spend_min} – ${content.typical_spend_max}`
      : (content.typical_spend_min || content.typical_spend_max)],
  ].filter(([, val]) => val != null && val !== '');

  // Pad to even count for clean 2-col grid
  const paddedDetails = details.length % 2 === 1 ? [...details, [null, null]] : details;

  if (details.length === 0) return null;

  return (
    <div style={{ background: bgFinal, padding: isMobile ? '48px 20px 56px' : 'clamp(56px, 8vw, 104px) clamp(24px, 6vw, 120px)' }}>
      <div style={{ maxWidth: 920 }}>
        {/* Eyebrow */}
        <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldCol, margin: '0 0 10px' }}>
          {content.eyebrow || 'At a Glance'}
        </p>
        <div style={{ width: 32, height: 1, background: goldCol, marginBottom: content.headline ? 24 : 36 }} />

        {content.headline && (
          <h2 style={{ fontFamily: GD, fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 400, color: textCol, margin: '0 0 36px', lineHeight: 1.1 }}>
            {content.headline}
          </h2>
        )}

        {/* ── Details — 2-col label/value grid (1-col on mobile) ── */}
        {(isMobile ? details : paddedDetails).length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 0 }}>
            {(isMobile ? details : paddedDetails).map(([label, val], i) => {
              const isLeft = isMobile ? true : i % 2 === 0;
              const totalRows = (isMobile ? details : paddedDetails).length;
              const isLastRow = isMobile ? i === totalRows - 1 : i >= totalRows - 2;
              return (
                <div key={i} style={{
                  display: 'flex', alignItems: 'flex-start', gap: isMobile ? 16 : 20,
                  padding: '13px 0',
                  paddingRight: (!isMobile && isLeft) ? 40 : 0,
                  paddingLeft:  (!isMobile && !isLeft) ? 40 : 0,
                  borderRight:  (!isMobile && isLeft) ? `1px solid ${borderCol}` : 'none',
                  borderBottom: !isLastRow ? `1px solid ${borderCol}` : 'none',
                  opacity: label ? 1 : 0,
                }}>
                  {label && <>
                    <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: mutCol, flexShrink: 0, width: isMobile ? 104 : 120, paddingTop: 1 }}>
                      {label}
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 13, color: textCol, lineHeight: 1.55, flex: 1 }}>
                      {val}
                    </span>
                  </>}
                </div>
              );
            })}
          </div>
        )}

        {content.verified_date && (
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: goldCol }}>✓ Verified {content.verified_date}</span>
            {content.verification_notes && (
              <span style={{ fontFamily: NU, fontSize: 10, color: mutCol }}>· {content.verification_notes}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── FaqSection — accordion with JSON-LD schema ───────────────────────────────
function FaqSection({ content, layout, palette }) {
  const P  = palette;
  const bg = layout?.accentBg || (P.mode === 'light' ? '#faf9f6' : '#0f0e0c');
  return (
    <ShowcaseFaq
      faqs={content.faqs || []}
      eyebrow={content.eyebrow || 'Frequently Asked Questions'}
      headline={content.headline || null}
      accentColor={P.accent}
      theme={P.mode}
      bg={bg}
    />
  );
}

// ── Section preview fallback (studio only) ────────────────────────────────────
function SectionPlaceholder({ section, palette }) {
  const P   = palette;
  const reg = SECTION_REGISTRY[section.type] || {};
  return (
    <div style={{
      padding: 'clamp(32px, 5vw, 48px) clamp(20px, 5vw, 40px)', background: P.bg2,
      border: `1px dashed ${P.accent}33`,
      textAlign: 'center',
    }}>
      <div style={{
        fontFamily: NU, fontSize: 10, letterSpacing: '0.18em',
        textTransform: 'uppercase', color: P.accent, fontWeight: 600, marginBottom: 8,
      }}>
        {reg.label || section.type}
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: P.muted }}>
        {reg.previewFallback || 'Add content to preview this section'}
      </div>
    </div>
  );
}

// ── Breadcrumb bar (matches SixSensesShowcasePage pattern) ───────────────────
function BreadcrumbBar({ showcase, listing, onBack, onGoDestination, palette, darkMode }) {
  const { isMobile } = useBreakpoint();
  const P         = palette;
  const bg        = darkMode ? 'rgba(18,16,12,0.97)' : 'rgba(249,247,242,0.97)';
  const border    = darkMode ? '1px solid rgba(255,255,255,0.07)' : '1px solid rgba(0,0,0,0.08)';
  const textCol   = darkMode ? '#f5f0e8' : '#1a1a1a';
  const mutedCol  = darkMode ? 'rgba(245,240,232,0.45)' : 'rgba(28,20,16,0.5)';
  const accentCol = P.accent;

  // Build location crumb: prefer listing.city/country, fallback to last part of location string
  const city    = listing?.city    || (typeof showcase?.location === 'object' ? showcase.location?.city    : null) || '';
  const country = listing?.country || (typeof showcase?.location === 'object' ? showcase.location?.country : null) || '';
  // If no structured data, try to extract city from location string (e.g. "150 Piccadilly, Mayfair, London W1J")
  const locationStr = typeof showcase?.location === 'string' ? showcase.location : '';
  const locationParts = locationStr.split(',').map(s => s.trim()).filter(Boolean);
  const inferredCity = city || (locationParts.length >= 2 ? locationParts[locationParts.length - 2].replace(/\s+\w+\d.*/, '').trim() : '');
  // Capitalise country: "uk" → "UK", "england" → "England"
  const formatCountry = (c) => c.length <= 3 ? c.toUpperCase() : c.charAt(0).toUpperCase() + c.slice(1);
  const inferredCountry = country ? formatCountry(country) : '';
  const locationLabel = [inferredCity, inferredCountry].filter(Boolean).join(', ');

  const venueName = showcase?.title || showcase?.name || listing?.name || '';
  const venueSlug = showcase?.slug  || listing?.slug  || '';

  return (
    <div style={{
      background: bg,
      borderBottom: `1px solid ${border}`,
      padding: isMobile ? '0 16px' : '0 32px',
      height: 40,
      overflowX: 'hidden',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      position: 'relative',
      zIndex: 10,
    }}>
      {/* Back to listing */}
      <button
        onClick={onBack}
        style={{
          fontFamily: NU, fontSize: 11, color: mutedCol,
          background: 'none', border: 'none', cursor: 'pointer',
          padding: 0, fontWeight: 400, letterSpacing: '0.02em',
          transition: 'color 0.2s', flexShrink: 0,
        }}
        onMouseEnter={e => (e.currentTarget.style.color = textCol)}
        onMouseLeave={e => (e.currentTarget.style.color = mutedCol)}
      >
        ← Back
      </button>
      <span style={{ fontFamily: NU, fontSize: 10, color: mutedCol, userSelect: 'none' }}>›</span>
      {/* Destinations — hidden on mobile */}
      {!isMobile && (
        <button
          onClick={() => onGoDestination?.('')}
          style={{
            fontFamily: NU, fontSize: 11, color: mutedCol,
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 0, fontWeight: 400, letterSpacing: '0.02em',
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.color = textCol)}
          onMouseLeave={e => (e.currentTarget.style.color = mutedCol)}
        >
          Destinations
        </button>
      )}
      {locationLabel && locationLabel !== 'Destinations' && !isMobile && (
        <>
          <span style={{ fontFamily: NU, fontSize: 10, color: mutedCol, userSelect: 'none' }}>›</span>
          <button
            onClick={() => onGoDestination?.(country?.toLowerCase().replace(/\s+/g, '-'))}
            style={{
              fontFamily: NU, fontSize: 11, color: mutedCol,
              background: 'none', border: 'none', cursor: 'pointer',
              padding: 0, fontWeight: 400, letterSpacing: '0.02em',
              transition: 'color 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.color = textCol)}
            onMouseLeave={e => (e.currentTarget.style.color = mutedCol)}
          >
            {locationLabel}
          </button>
        </>
      )}
      {!isMobile && <span style={{ fontFamily: NU, fontSize: 10, color: mutedCol, userSelect: 'none' }}>›</span>}
      <span style={{
        fontFamily: NU, fontSize: 11, color: textCol, fontWeight: 600, letterSpacing: '0.02em',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: isMobile ? '40vw' : 'none',
      }}>
        {venueName}
      </span>

      {/* VIEW LISTING — far right */}
      {venueSlug && (
        <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
          <button
            onClick={onBack}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.12em', textTransform: 'uppercase',
              color: accentCol, background: 'none', border: `1px solid ${accentCol}`,
              padding: '4px 12px', cursor: 'pointer',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = accentCol; e.currentTarget.style.color = darkMode ? '#0a0a08' : '#fff'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = accentCol; }}
          >
            VIEW LISTING ↗
          </button>
        </div>
      )}
    </div>
  );
}

// ── Interactive canvas wrapper (studio click-to-select) ───────────────────────
function SelectableWrapper({ section, selected, onSelect, palette, children }) {
  const [hovered, setHovered] = useState(false);
  const P      = palette || DARK_PALETTE;
  const accent = P.accent || '#C9A84C';
  const chipBg = selected ? accent : `${accent}cc`;

  return (
    <div
      style={{
        position:      'relative',
        outline:       selected  ? `2px solid ${accent}`
                       : hovered ? `2px dashed ${accent}55`
                                 : '2px solid transparent',
        outlineOffset: -2,
        cursor:        'pointer',
        transition:    'outline 0.12s ease',
      }}
      onClick={() => onSelect(section.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {(selected || hovered) && (
        <div style={{
          position:      'absolute',
          top:            8,
          right:          8,
          zIndex:         200,
          background:     chipBg,
          color:          '#0a0a08',
          fontFamily:     'var(--font-body)',
          fontSize:       9,
          fontWeight:     700,
          letterSpacing:  '0.14em',
          textTransform:  'uppercase',
          padding:        '3px 8px',
          borderRadius:   2,
          pointerEvents:  'none',
          userSelect:     'none',
        }}>
          {selected ? 'Editing' : 'Click to edit'}
        </div>
      )}
      {children}
    </div>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function ShowcaseRenderer({
  sections = [],
  showcase = {},
  listing = null,
  listingFirstImage = null,
  isPreview = false,
  interactive = false,
  selectedId = null,
  onSelectSection = null,
  darkMode = false,
  onToggleDark = null,
  onNavigateStandard = null,
  onGoDestination = null,
  onBack = null,
}) {
  const heroUrl = showcase.hero_image_url || null;
  // Palette logic:
  //   Studio preview → always use the showcase's authored theme
  //   Public page    → dark/light toggle picks the base palette,
  //                    but showcase.theme can inject brand accent + bg overrides
  const palette = (() => {
    if (isPreview) return buildPalette(showcase.theme);
    const base = darkMode ? DARK_PALETTE : LIGHT_DEFAULTS;
    // theme can be a JSON string (TEXT column) or a parsed object (JSONB)
    let t = showcase.theme;
    if (typeof t === 'string') { try { t = JSON.parse(t); } catch (_) { t = null; } }
    if (!t || !t.accent) return base;
    const accent = darkMode ? (t.darkAccent || t.accent) : t.accent;
    return {
      ...base,
      accent,
      label:     accent,
      navActive: accent,
      ...(t.bg  && !darkMode && { bg:  t.bg  }),
      ...(t.bg2 && !darkMode && { bg2: t.bg2 }),
      ...(t.bg3 && !darkMode && { bg3: t.bg3 }),
    };
  })();
  const [sectionNavVisible, setSectionNavVisible] = useState(false);

  function renderSection(section) {
    const { type, content = {}, layout = {} } = section;
    const shared = { showcaseHero: heroUrl, listingFirstImage, palette };

    const hasMinContent = content.title || content.headline || content.text
      || content.url || content.image
      || (content.items  && content.items.length  > 0)
      || (content.images && content.images.some(i => i.url));

    if (isPreview && !hasMinContent && type !== 'cta' && type !== 'related') {
      return <SectionPlaceholder key={section.id} section={section} palette={palette} />;
    }

    let inner;
    switch (type) {
      case 'hero':
        inner = <HeroSection content={content} layout={layout} {...shared} />;
        break;
      case 'stats':
        inner = <StatsSection content={content} layout={layout} palette={palette} />;
        break;
      case 'intro':
        inner = <IntroSection content={content} layout={layout} palette={palette} />;
        break;
      case 'highlight-band':
        inner = <HighlightBandSection content={content} layout={layout} palette={palette} />;
        break;
      case 'feature':
        inner = <FeatureSection content={content} layout={layout} {...shared} />;
        break;
      case 'quote':
        inner = <QuoteSection content={content} layout={layout} palette={palette} />;
        break;
      case 'mosaic':
        inner = <MosaicSection content={content} layout={layout} palette={palette} />;
        break;
      case 'gallery':
        inner = <GallerySection content={content} layout={layout} palette={palette} />;
        break;
      case 'films':
        inner = <FilmsSection content={content} palette={palette} />;
        break;
      case 'dining':
      case 'spaces':
      case 'wellness':
      case 'weddings':
        inner = <EditorialFeatureSection content={content} layout={layout} {...shared} />;
        break;
      case 'pricing':
        inner = <PricingSection content={content} layout={layout} palette={palette} />;
        break;
      case 'verified':
        inner = <VerifiedSection content={content} layout={layout} palette={palette} />;
        break;
      case 'faq':
        inner = <FaqSection content={content} layout={layout} palette={palette} />;
        break;
      case 'image-full':
        inner = <FullImageSection content={content} />;
        break;
      case 'cta':
        inner = <CtaSection content={content} venueName={showcase.title} palette={palette} />;
        break;
      case 'related':
        inner = content.items?.length
          ? <RelatedSection content={content} palette={palette} />
          : null;
        break;
      default:
        inner = isPreview
          ? <SectionPlaceholder section={section} palette={palette} />
          : null;
    }

    if (!inner) return null;

    const sectionContent = (
      <div
        id={`sec-${section.id}`}
        data-showcase-section={type}
        style={{ scrollMarginTop: (isPreview || interactive) ? 0 : 108 }}
      >
        {inner}
      </div>
    );

    if (interactive && onSelectSection) {
      return (
        <SelectableWrapper
          key={section.id}
          section={section}
          selected={section.id === selectedId}
          onSelect={onSelectSection}
          palette={palette}
        >
          {sectionContent}
        </SelectableWrapper>
      );
    }

    return <div key={section.id}>{sectionContent}</div>;
  }

  return (
    <div style={{ background: palette.bg, color: palette.text, minHeight: '100vh' }}>
      {!isPreview && (
        <>
          {/* White header block — HomeNav (fixed) + BreadcrumbBar (in flow).
              White background prevents dark palette.bg bleeding through the gap. */}
          <div style={{ background: darkMode ? 'rgba(11,9,6,0.97)' : '#ffffff' }}>
            {/* HomeNav — slides UP when SectionNav slides DOWN (IC Park Lane pattern) */}
            <div style={{
              position: 'fixed', top: 0, left: 0, right: 0, zIndex: 699,
              transform:  sectionNavVisible ? 'translateY(-110%)' : 'translateY(0)',
              transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
            }}>
              <HomeNav hasHero={false} darkMode={darkMode} onToggleDark={onToggleDark} onNavigateStandard={onNavigateStandard} />
            </div>
            {/* Spacer that matches HomeNav height so BreadcrumbBar sits flush below it */}
            <div style={{ height: 61 }} />
            {/* BreadcrumbBar — in document flow, flush below HomeNav */}
            <BreadcrumbBar
              showcase={showcase}
              listing={listing}
              onBack={onBack}
              onGoDestination={onGoDestination}
              palette={palette}
              darkMode={darkMode}
            />
          </div>
          <SectionNav
            sections={sections}
            palette={palette}
            showcase={showcase}
            onBack={onBack}
            onVisibleChange={setSectionNavVisible}
          />
        </>
      )}
      {sections.map(section => renderSection(section))}
    </div>
  );
}
