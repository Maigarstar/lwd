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

import { useState, useEffect, useRef } from 'react';
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

// ── Video URL parser (used by hero + bento + rooms) ──────────────────────────
function parseVideoUrl(url) {
  if (!url) return null;
  const yt = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (yt) return { type: 'youtube', id: yt[1] };
  const vm = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vm) return { type: 'vimeo', id: vm[1] };
  if (/\.(mp4|webm|mov|ogg|m4v|avi|mkv)(\?|$)/i.test(url)) return { type: 'direct', url };
  return null;
}

// ── Section renderers ─────────────────────────────────────────────────────────

function HeroSection({ content, layout, showcaseHero, listingFirstImage, palette }) {
  const P     = palette;
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  const op    = content.overlay_opacity ?? P.heroOverlayOpacity;
  const { isMobile } = useBreakpoint();
  const [videoFailed, setVideoFailed] = useState(false);

  const focalPoint = content.focal_point || (isMobile ? 'center 30%' : 'center center');
  const vid = parseVideoUrl(content.videoUrl);
  const showVideo = vid && !videoFailed;

  // YouTube embed: scale up iframe to fill, keep image behind as fallback
  const ytEmbed = vid?.type === 'youtube'
    ? `https://www.youtube.com/embed/${vid.id}?autoplay=1&mute=1&loop=1&playlist=${vid.id}&controls=0&rel=0&playsinline=1&enablejsapi=0`
    : null;
  const vmEmbed = vid?.type === 'vimeo'
    ? `https://player.vimeo.com/video/${vid.id}?autoplay=1&muted=1&loop=1&background=1`
    : null;

  return (
    <div style={{
      position: 'relative',
      height: isMobile ? '100svh' : '85vh', minHeight: isMobile ? 600 : 480,
      overflow: 'hidden',
      background: '#0a0a08',
    }}>
      {/* Fallback image — always rendered behind video */}
      {image && (
        <img
          src={image}
          alt={content.title || ''}
          loading="eager"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: focalPoint,
            // fade image out when video is active and not failed
            opacity: showVideo && (vid?.type === 'youtube' || vid?.type === 'vimeo') ? 0.3 : 1,
            transition: 'opacity 1s ease',
          }}
        />
      )}
      {/* Video layer */}
      {showVideo && (ytEmbed || vmEmbed) && (
        <iframe
          key={vid.id}
          src={ytEmbed || vmEmbed}
          allow="autoplay; fullscreen"
          style={{
            position: 'absolute',
            // Scale iframe up to cover 16:9 into any aspect ratio
            top: '50%', left: '50%',
            width: 'max(100%, 177.78vh)',  // 16/9 * 100vh
            height: 'max(100%, 56.25vw)', // 9/16 * 100vw
            transform: 'translate(-50%, -50%)',
            border: 'none', pointerEvents: 'none',
          }}
          title="Hero video"
        />
      )}
      {showVideo && vid?.type === 'direct' && (
        <video
          key={vid.url}
          src={vid.url}
          autoPlay muted loop playsInline
          onError={() => setVideoFailed(true)}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: isMobile
          ? `linear-gradient(to top, rgba(0,0,0,${op + 0.55}) 0%, rgba(0,0,0,${op + 0.10}) 55%, rgba(0,0,0,${Math.max(0, op - 0.25)}) 100%)`
          : `linear-gradient(to top, rgba(0,0,0,${op + 0.30}) 0%, rgba(0,0,0,${op}) 50%, rgba(0,0,0,${op - 0.20}) 100%)`,
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
    const bg        = layout?.accentBg || P.bg2;
    const bgLc      = bg.toLowerCase();
    const isLight   = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd');
    const textCol   = layout?.textColor || (isLight ? '#1C1410' : '#f5f0e8');
    const mutCol    = layout?.textColor ? `${layout.textColor}99` : (isLight ? 'rgba(28,20,16,0.6)' : 'rgba(245,240,232,0.65)');
    const goldCol   = P.accent;
    const alignVal  = layout?.align || 'left';
    const isCtr     = alignVal === 'center';
    const isRgt     = alignVal === 'right';
    const txtAlign  = isCtr ? 'center' : isRgt ? 'right' : 'left';
    const innerMarg = isCtr ? '0 auto' : isRgt ? '0 0 0 auto' : '0';
    const divMarg   = isCtr ? '20px auto 28px' : isRgt ? '20px 0 28px auto' : '20px 0 28px';
    return (
      <div style={{ background: bg, padding: 'clamp(48px, 7vw, 96px) clamp(24px, 6vw, 120px)', textAlign: txtAlign }}>
        <div style={{ maxWidth: 860, margin: innerMarg }}>
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
          <div style={{ width: 40, height: 1, background: goldCol, margin: divMarg }} />
          {content.body && (
            <p style={{
              fontFamily: NU, fontSize: 16, lineHeight: 1.85,
              color: mutCol, margin: 0, maxWidth: 680,
              marginLeft: isCtr ? 'auto' : isRgt ? 'auto' : 0,
              marginRight: isCtr ? 'auto' : 0,
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
  const textCol = layout?.textColor || (isLight ? '#1C1410' : '#f5f0e8');
  const mutCol  = layout?.textColor ? `${layout.textColor}99` : (isLight ? 'rgba(28,20,16,0.6)' : 'rgba(245,240,232,0.65)');
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
  const alignVal  = layout?.align || 'left';
  const isCenter  = alignVal === 'center';
  const isRight   = alignVal === 'right';
  const isLarge   = layout?.size === 'large';

  const bgLc      = bg.toLowerCase();
  const bgIsLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd');
  const textCol   = layout?.textColor || (bgIsLight ? '#1C1410' : '#f5f0e8');
  const mutCol    = layout?.textColor ? `${layout.textColor}99` : (bgIsLight ? 'rgba(28,20,16,0.58)' : 'rgba(245,240,232,0.62)');
  const goldCol   = P.accent;
  const textAlign = isCenter ? 'center' : isRight ? 'right' : 'left';
  const divMargin = isCenter ? '28px auto' : isRight ? '28px 0 28px auto' : '28px 0';
  const innerMargin = isCenter ? '0 auto' : isRight ? '0 0 0 auto' : '0';

  return (
    <div style={{
      background: bg,
      padding: `clamp(72px, 10vw, 140px) clamp(32px, 8vw, 160px)`,
      textAlign,
    }}>
      <div style={{
        maxWidth: isLarge ? 900 : 760,
        margin: innerMargin,
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
            margin: divMargin,
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
            marginLeft: isCenter ? 'auto' : isRight ? 'auto' : 0,
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
    const bg        = layout?.accentBg || P.bg2;
    const bgLc      = bg.toLowerCase();
    const isLight   = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#d');
    const textCol   = layout?.textColor || (isLight ? '#1C1410' : '#f5f0e8');
    const mutCol    = layout?.textColor ? `${layout.textColor}99` : (isLight ? 'rgba(28,20,16,0.55)' : 'rgba(245,240,232,0.55)');
    const brdCol    = isLight ? 'rgba(28,20,16,0.1)' : 'rgba(245,240,232,0.1)';
    const goldCol   = P.accent;
    const alignVal  = layout?.align || 'left';
    const isCenter  = alignVal === 'center';
    const isRight   = alignVal === 'right';
    const textAlign = isCenter ? 'center' : isRight ? 'right' : 'left';
    const innerMarg = isCenter ? '0 auto' : isRight ? '0 0 0 auto' : '0';
    return (
      <div style={{ background: bg, padding: 'clamp(48px, 6vw, 80px) clamp(24px, 6vw, 120px)', textAlign }}>
        <div style={{ maxWidth: 720, margin: innerMarg }}>
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
  const alignVal  = layout?.align || 'left';
  const isCenter  = alignVal === 'center';
  const isRight   = alignVal === 'right';
  const textAlign = isCenter ? 'center' : isRight ? 'right' : 'left';
  const innerMarg = isCenter ? '0 auto' : isRight ? '0 0 0 auto' : '0';
  return (
    <div style={{ background: P.bg }}>
      {(content.title || content.body) && (
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '32px 24px 20px' : '64px 64px 40px', textAlign }}>
          {content.title && (
            <h2 style={{ fontFamily: GD, fontSize: 'clamp(22px,3vw,42px)', fontWeight: 400, color: P.text, margin: '0 0 12px', letterSpacing: '-0.02em' }}>
              {content.title}
            </h2>
          )}
          {content.body && (
            <p style={{ fontFamily: NU, fontSize: 15, color: P.muted, margin: `0 ${isRight ? 0 : 'auto'} 0 ${isCenter ? 'auto' : 0}`, lineHeight: 1.7, maxWidth: 640 }}>
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
    <div style={{ background: '#f2f0ea' }}>
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
function FilmsSection({ content, layout, palette }) {
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
    ? `https://player.vimeo.com/video/${active.vimeoId}?title=0&byline=0&portrait=0`
    : null;
  const isDirect = !!(active.directUrl);
  const bg      = layout?.accentBg || P.bg;
  const bgIsLt  = bg.startsWith('#f') || bg.startsWith('#e') || bg.startsWith('#d') || bg === '#ffffff';
  const textCol = layout?.textColor || (bgIsLt ? '#1a1209' : P.text);

  return (
    <div style={{ background: bg, padding: isMobile ? '40px 0 56px' : '64px 0 80px' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '0 20px' : '0 clamp(24px, 5vw, 64px)' }}>
        {content.eyebrow && (
          <p style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: P.accent, margin: '0 0 28px' }}>
            {content.eyebrow}
          </p>
        )}
        {/* Player */}
        <div style={{ position: 'relative', width: '100%', paddingBottom: '56.25%', background: '#000', borderRadius: 2, overflow: 'hidden' }}>
          {isDirect ? (
            <video
              key={active.directUrl}
              src={active.directUrl}
              controls
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'contain', background: '#000' }}
            />
          ) : embedUrl ? (
            <iframe
              key={embedUrl}
              src={embedUrl}
              title={active.title || 'Film'}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
              allowFullScreen
              style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 'none' }}
            />
          ) : (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>No video</span>
            </div>
          )}
        </div>
        {/* Title */}
        {active.title && (
          <p style={{ fontFamily: GD, fontSize: isMobile ? 17 : 20, color: textCol, margin: '20px 0 4px', letterSpacing: '-0.01em' }}>
            {active.title}
          </p>
        )}
        {/* Thumbnail playlist */}
        {videos.length > 1 && (
          <div style={{ display: 'flex', gap: 10, marginTop: 20, overflowX: 'auto', paddingBottom: 4 }}>
            {videos.map((v, i) => {
              const thumb = v.thumb || (v.youtubeId ? `https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg` : '');
              return (
                <button key={v.id || i} onClick={() => setActiveIdx(i)} style={{
                  flexShrink: 0, width: isMobile ? 100 : 130, height: isMobile ? 56 : 73,
                  padding: 0, border: 'none', cursor: 'pointer',
                  opacity: i === activeIdx ? 1 : 0.5,
                  outline: i === activeIdx ? `2px solid ${P.accent}` : 'none',
                  outlineOffset: 2,
                  borderRadius: 3, overflow: 'hidden', background: '#111',
                  transition: 'opacity 0.2s ease',
                }}>
                  {thumb ? (
                    <img src={thumb} alt={v.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                  )}
                </button>
              );
            })}
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
  const alignVal  = layout?.align || 'left';
  const isCenter  = alignVal === 'center';
  const isRight   = alignVal === 'right';
  const textAlign = isCenter ? 'center' : isRight ? 'right' : 'left';
  const goldDividerMargin = isCenter ? '0 auto 36px' : isRight ? '0 0 36px auto' : '0 0 36px';

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
        <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldCol, margin: '0 0 14px', textAlign }}>
          {content.eyebrow || 'Pricing & What to Expect'}
        </p>
        <h2 style={{ fontFamily: GD, fontSize: 'clamp(26px, 3.5vw, 42px)', color: textCol, margin: '0 0 8px', fontWeight: 400, lineHeight: 1.15, textAlign }}>
          {content.headline || 'Understanding the Investment'}
        </h2>
        <div style={{ width: 40, height: 1, background: goldCol, margin: goldDividerMargin }} />

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
  const P         = palette;
  const bgFinal   = layout?.accentBg || (P.mode === 'light' ? '#ffffff' : '#1a1410');
  // Derive readable colours from the actual panel background, not just palette mode
  const bgLc      = bgFinal.toLowerCase();
  const bgIsLight = bgLc === '#ffffff' || bgLc.startsWith('#ff') || bgLc.startsWith('#fa') ||
    bgLc.startsWith('#fd') || bgLc.startsWith('#fe') || bgLc.startsWith('#f5') ||
    bgLc.startsWith('#f2') || bgLc.startsWith('#f0') || bgLc.startsWith('#ee') ||
    bgLc.startsWith('#e') || bgLc.startsWith('#d');
  const textColAuto = bgIsLight ? '#1a1209' : '#f5f0e8';
  const mutColAuto  = bgIsLight ? 'rgba(26,18,9,0.55)' : 'rgba(245,240,232,0.5)';
  const textCol   = layout?.textColor || textColAuto;
  const mutCol    = layout?.textColor ? `${layout.textColor}99` : mutColAuto;
  const goldCol   = P.accent;
  const borderCol = bgIsLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const variant   = layout?.variant || 'left';
  const isCenter  = variant === 'center';
  const isRight   = variant === 'right';
  const alignTxt  = isCenter ? 'center' : isRight ? 'right' : 'left';
  const innerStyle = isCenter
    ? { maxWidth: 920, marginLeft: 'auto', marginRight: 'auto' }
    : isRight
    ? { maxWidth: 920, marginLeft: 'auto' }
    : { maxWidth: 920 };

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
      <div style={innerStyle}>
        {/* Eyebrow */}
        <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: goldCol, margin: '0 0 10px', textAlign: alignTxt }}>
          {content.eyebrow || 'At a Glance'}
        </p>
        <div style={{ width: 32, height: 1, background: goldCol, marginBottom: content.headline ? 24 : 36, marginLeft: isCenter ? 'auto' : isRight ? 'auto' : 0, marginRight: isCenter ? 'auto' : 0 }} />

        {content.headline && (
          <h2 style={{ fontFamily: GD, fontSize: 'clamp(24px, 3vw, 38px)', fontWeight: 400, color: textCol, margin: '0 0 36px', lineHeight: 1.1, textAlign: alignTxt }}>
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
          <div style={{ marginTop: 28, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: isCenter ? 'center' : isRight ? 'flex-end' : 'flex-start' }}>
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

// ── Shared icon helpers ───────────────────────────────────────────────────────
function PersonIcon({ size = 20, col = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="7" r="4"/>
      <path d="M4 21v-1a8 8 0 0116 0v1"/>
    </svg>
  );
}

function ExpandIcon({ size = 16, col = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15,3 21,3 21,9"/><polyline points="9,21 3,21 3,15"/>
      <line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/>
    </svg>
  );
}

const NEARBY_ICON = ({ type = 'city', size = 38, col = 'currentColor' }) => {
  const icons = {
    // Front-facing metro/subway car — matches reference quality
    train: <>
      <rect x="5" y="3" width="14" height="16" rx="3"/>
      <rect x="7" y="6" width="4" height="4.5" rx="1.2"/>
      <rect x="13" y="6" width="4" height="4.5" rx="1.2"/>
      <line x1="5" y1="14" x2="19" y2="14"/>
      <circle cx="9.5" cy="17" r="1.4" fill={col} stroke="none"/>
      <circle cx="14.5" cy="17" r="1.4" fill={col} stroke="none"/>
      <line x1="2" y1="22" x2="22" y2="22"/>
      <line x1="5" y1="22" x2="8" y2="19"/>
      <line x1="19" y1="22" x2="16" y2="19"/>
    </>,
    // 3 refined sinusoidal wave lines
    water: <>
      <path d="M2 8c1.2-2 2.8-2 4.5 0s3.3 2 4.5 0 3.3-2 4.5 0 3.3 2 4.5 0"/>
      <path d="M2 13c1.2-2 2.8-2 4.5 0s3.3 2 4.5 0 3.3-2 4.5 0 3.3 2 4.5 0"/>
      <path d="M2 18c1.2-2 2.8-2 4.5 0s3.3 2 4.5 0 3.3-2 4.5 0 3.3 2 4.5 0"/>
    </>,
    // Municipal building: flag + 6 windows + arched door
    city: <>
      <line x1="12" y1="1" x2="12" y2="5"/>
      <path d="M12 1l5.5 2-5.5 2z" strokeLinejoin="miter"/>
      <rect x="3" y="5" width="18" height="16" rx="0.5"/>
      <rect x="5.5" y="8" width="3" height="3" rx="0.4"/>
      <rect x="10.5" y="8" width="3" height="3" rx="0.4"/>
      <rect x="15.5" y="8" width="3" height="3" rx="0.4"/>
      <rect x="5.5" y="13" width="3" height="3" rx="0.4"/>
      <rect x="15.5" y="13" width="3" height="3" rx="0.4"/>
      <path d="M10.5 21v-4a1.5 1.5 0 013 0v4"/>
    </>,
    // Airplane silhouette
    airport: <>
      <path d="M21 15.5L13.5 9l1-7L12 3l-3.5 6.5L3 11l1 2 5.5-.5-.5 4.5L7 18l.5 2 4.5-1.5 4.5 4.5L18 23l1-6.5 3-1z"/>
    </>,
    // Sun over waves
    beach: <>
      <circle cx="12" cy="7" r="3"/>
      <line x1="12" y1="1" x2="12" y2="3"/>
      <line x1="12" y1="11" x2="12" y2="13"/>
      <line x1="6" y1="7" x2="4" y2="7"/>
      <line x1="18" y1="7" x2="20" y2="7"/>
      <line x1="7.8" y1="2.8" x2="6.4" y2="1.4"/>
      <line x1="16.2" y1="2.8" x2="17.6" y2="1.4"/>
      <path d="M2 17c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/>
      <path d="M2 21c1.5-2 3-2 4.5 0s3 2 4.5 0 3-2 4.5 0 3 2 4.5 0"/>
    </>,
    // Tree with trunk
    park: <>
      <path d="M12 2L7.5 9H11L7 16h5v5h0M12 2l4.5 7H13L17 16h-5v5"/>
    </>,
    // Fork and knife
    restaurant: <>
      <line x1="8" y1="2" x2="8" y2="10"/>
      <path d="M5 2v5a3 3 0 006 0V2"/>
      <line x1="8" y1="15" x2="8" y2="22"/>
      <line x1="19" y1="2" x2="19" y2="22"/>
      <path d="M16 2c0 0 0 5 3 6.5"/>
    </>,
    // Shopping bag
    shopping: <>
      <path d="M6 2L3 7v13a2 2 0 002 2h14a2 2 0 002-2V7L18 2z"/>
      <line x1="3" y1="7" x2="21" y2="7"/>
      <path d="M16 11a4 4 0 01-8 0"/>
    </>,
    // Greek columns / museum
    museum: <>
      <rect x="2" y="19" width="20" height="2"/>
      <line x1="3" y1="11" x2="3" y2="19"/>
      <line x1="7.5" y1="11" x2="7.5" y2="19"/>
      <line x1="12" y1="11" x2="12" y2="19"/>
      <line x1="16.5" y1="11" x2="16.5" y2="19"/>
      <line x1="21" y1="11" x2="21" y2="19"/>
      <polygon points="12,3 2,11 22,11"/>
      <rect x="2" y="9" width="20" height="2"/>
    </>,
    // Golf pin + flag
    golf: <>
      <line x1="12" y1="2" x2="12" y2="20"/>
      <path d="M12 2l7 3.5-7 3.5z"/>
      <ellipse cx="12" cy="21" rx="5" ry="1.5"/>
    </>,
    // Lotus / spa flower
    spa: <>
      <path d="M12 22c0-6 3-10 3-10s4 1 4 6c-2 2-5 4-7 4z"/>
      <path d="M12 22c0-6-3-10-3-10s-4 1-4 6c2 2 5 4 7 4z"/>
      <path d="M12 22c0-6 0-10 0-10s4-2 6 2c0 3-2 6-6 8z"/>
      <path d="M12 22c0-6 0-10 0-10s-4-2-6 2c0 3 2 6 6 8z"/>
      <path d="M12 12c0-4 0-8 0-10"/>
    </>,
    // Castle turrets
    castle: <>
      <rect x="2" y="8" width="4" height="13"/>
      <rect x="18" y="8" width="4" height="13"/>
      <rect x="8" y="12" width="8" height="9"/>
      <path d="M2 8V5h1v2h1V5h1v3M18 8V5h1v2h1V5h1v3M8 12V9h1v2h1.5V9h1v2h1.5V9h1v3"/>
      <line x1="2" y1="21" x2="22" y2="21"/>
      <line x1="6" y1="21" x2="6" y2="12"/>
      <line x1="18" y1="21" x2="18" y2="12"/>
    </>,
    // Anchor
    marina: <>
      <circle cx="12" cy="5" r="2.5"/>
      <line x1="12" y1="7.5" x2="12" y2="20"/>
      <line x1="7" y1="11" x2="17" y2="11"/>
      <path d="M6 20c1-1 2.5-2 6-2s5 1 6 2"/>
      <path d="M7 20c0 1.5 2 2 5 2s5-.5 5-2"/>
    </>,
    // Business person with suit and tie — matches reference
    business: <>
      <circle cx="12" cy="7" r="3.5"/>
      <path d="M6 22c0-4.5 2-8 6-9"/>
      <path d="M18 22c0-4.5-2-8-6-9"/>
      <path d="M12 13l-2.5 5"/>
      <path d="M12 13l2.5 5"/>
      <path d="M11.5 13.5l.5 4 .5-4"/>
    </>,
    // Pine trees
    forest: <>
      <path d="M12 2L8.5 8H11L7.5 14H11L9 19h6l-2-5h3.5L13 8H15.5z"/>
      <line x1="12" y1="19" x2="12" y2="22"/>
    </>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={1.3} strokeLinecap="round" strokeLinejoin="round">
      {icons[type] || icons.city}
    </svg>
  );
};

const AMENITY_ICON = ({ type = 'bed', size = 22, col = 'currentColor' }) => {
  const icons = {
    // Bed — elegant headboard with legs
    bed: <>
      <path d="M3 18V12a2 2 0 012-2h14a2 2 0 012 2v6"/>
      <path d="M3 15h18"/>
      <path d="M7 10V8a1 1 0 011-1h8a1 1 0 011 1v2"/>
      <line x1="3" y1="18" x2="3" y2="21"/>
      <line x1="21" y1="18" x2="21" y2="21"/>
    </>,
    // Bath — freestanding clawfoot silhouette
    bath: <>
      <path d="M4 12h16v3a5 5 0 01-5 5H9a5 5 0 01-5-5v-3z"/>
      <path d="M4 12V8a3 3 0 013-3 3 3 0 013 3v4"/>
      <line x1="7" y1="20" x2="6" y2="22"/>
      <line x1="17" y1="20" x2="18" y2="22"/>
    </>,
    // Shower — rainfall head with cascading drops
    shower: <>
      <path d="M4 4h6a6 6 0 016 6"/>
      <line x1="16" y1="10" x2="16" y2="14"/>
      <circle cx="10" cy="18" r="0.8" fill={col} stroke="none"/>
      <circle cx="14" cy="16" r="0.8" fill={col} stroke="none"/>
      <circle cx="18" cy="18" r="0.8" fill={col} stroke="none"/>
      <circle cx="12" cy="20" r="0.8" fill={col} stroke="none"/>
      <circle cx="16" cy="21" r="0.8" fill={col} stroke="none"/>
    </>,
    // Sofa — refined chaise with armrests
    sofa: <>
      <path d="M4 13v-2a1 1 0 011-1h14a1 1 0 011 1v2"/>
      <path d="M2 13h20v4a1 1 0 01-1 1H3a1 1 0 01-1-1v-4z"/>
      <line x1="4" y1="18" x2="4" y2="21"/>
      <line x1="20" y1="18" x2="20" y2="21"/>
      <path d="M2 15h2M20 15h2"/>
    </>,
    // Desk — writing desk with lamp
    desk: <>
      <rect x="3" y="13" width="18" height="3" rx="0.5"/>
      <line x1="5" y1="16" x2="4" y2="21"/>
      <line x1="19" y1="16" x2="20" y2="21"/>
      <path d="M12 13V8"/>
      <path d="M9 8h6"/>
      <path d="M9 5a3 3 0 006 0"/>
    </>,
    // Table — dining table with two chairs
    table: <>
      <rect x="4" y="9" width="16" height="3" rx="0.5"/>
      <line x1="12" y1="12" x2="12" y2="19"/>
      <line x1="8" y1="19" x2="16" y2="19"/>
      <line x1="7" y1="7" x2="7" y2="9"/>
      <line x1="17" y1="7" x2="17" y2="9"/>
    </>,
    // TV — flat screen with stand
    tv: <>
      <rect x="2" y="3" width="20" height="14" rx="1.5"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
      <line x1="12" y1="17" x2="12" y2="21"/>
      <circle cx="19" cy="10" r="0.8" fill={col} stroke="none"/>
    </>,
    // Wardrobe — double-door armoire
    wardrobe: <>
      <rect x="3" y="2" width="18" height="20" rx="1"/>
      <line x1="12" y1="2" x2="12" y2="22"/>
      <path d="M9 12h1.5M13.5 12H15"/>
      <line x1="3" y1="7" x2="21" y2="7"/>
    </>,
    // Safe — in-room safe with keypad
    safe: <>
      <rect x="3" y="5" width="18" height="15" rx="1.5"/>
      <circle cx="12" cy="12" r="3.5"/>
      <circle cx="12" cy="12" r="1" fill={col} stroke="none"/>
      <line x1="12" y1="8.5" x2="12" y2="10"/>
      <line x1="12" y1="14" x2="12" y2="15.5"/>
      <line x1="8.5" y1="12" x2="10" y2="12"/>
      <line x1="14" y1="12" x2="15.5" y2="12"/>
    </>,
    // AC — climate control unit
    ac: <>
      <rect x="2" y="5" width="20" height="9" rx="2"/>
      <line x1="6" y1="14" x2="5" y2="19"/>
      <line x1="12" y1="14" x2="12" y2="19"/>
      <line x1="18" y1="14" x2="19" y2="19"/>
      <line x1="7" y1="9" x2="17" y2="9"/>
      <line x1="7" y1="12" x2="13" y2="12"/>
    </>,
    // Balcony — terrace with railing
    balcony: <>
      <line x1="3" y1="20" x2="21" y2="20"/>
      <line x1="3" y1="13" x2="21" y2="13"/>
      <line x1="6" y1="13" x2="6" y2="20"/>
      <line x1="10" y1="13" x2="10" y2="20"/>
      <line x1="14" y1="13" x2="14" y2="20"/>
      <line x1="18" y1="13" x2="18" y2="20"/>
      <path d="M3 13V8a4 4 0 014-4h10a4 4 0 014 4v5"/>
    </>,
    // Kitchen — range with hood
    kitchen: <>
      <rect x="3" y="10" width="18" height="11" rx="1"/>
      <line x1="3" y1="14" x2="21" y2="14"/>
      <path d="M5 7h14v3H5z"/>
      <path d="M7 5h10v2H7z"/>
      <circle cx="8" cy="17" r="1.5"/>
      <circle cx="16" cy="17" r="1.5"/>
    </>,
    // Minibar — chilled drinks cabinet
    minibar: <>
      <rect x="5" y="3" width="14" height="19" rx="1.5"/>
      <line x1="5" y1="10" x2="19" y2="10"/>
      <line x1="12" y1="3" x2="12" y2="22"/>
      <circle cx="9" cy="6.5" r="0.8" fill={col} stroke="none"/>
      <circle cx="15" cy="6.5" r="0.8" fill={col} stroke="none"/>
    </>,
    // Coffee — espresso machine
    coffee: <>
      <path d="M6 8h12v9a3 3 0 01-3 3H9a3 3 0 01-3-3V8z"/>
      <path d="M18 11h1.5a2 2 0 010 4H18"/>
      <line x1="9" y1="21" x2="15" y2="21"/>
      <path d="M6 8V5h12v3"/>
      <circle cx="12" cy="13" r="1.5"/>
    </>,
  };
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={col} strokeWidth={1.15} strokeLinecap="round" strokeLinejoin="round">
      {icons[type] || icons.bed}
    </svg>
  );
};

// ── NearbySection ─────────────────────────────────────────────────────────────
function NearbySection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P       = palette;
  const GOLD    = P?.navActive || P?.accent || '#C4A05A';
  const bgPanel = layout?.accentBg || (P.mode === 'light' ? '#faf9f6' : '#141210');
  const bgLc    = bgPanel.toLowerCase();
  const bgIsLt  = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd') || bgPanel === '#ffffff';
  const textCol = layout?.textColor || (bgIsLt ? '#1a1209' : '#f5f0e8');
  const mutCol  = bgIsLt ? 'rgba(26,18,9,0.55)' : 'rgba(245,240,232,0.55)';
  const iconCol = bgIsLt ? 'rgba(26,18,9,0.45)' : 'rgba(245,240,232,0.45)';
  const items   = (content.items || []).slice(0, 6);

  return (
    <div style={{ background: bgPanel, padding: isMobile ? '64px 24px' : '88px 48px', textAlign: 'center' }}>
      <div style={{ maxWidth: 820, margin: '0 auto' }}>
        {content.eyebrow && (
          <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 18px' }}>
            {content.eyebrow}
          </p>
        )}
        {content.headline && (
          <h2 style={{ fontFamily: GD, fontSize: isMobile ? 'clamp(28px,7vw,44px)' : 'clamp(32px,4vw,52px)', fontWeight: 400, color: textCol, margin: '0 0 24px', lineHeight: 1.1, letterSpacing: '-0.02em' }}>
            {content.headline}
          </h2>
        )}
        {content.body && (
          <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: mutCol, maxWidth: 640, margin: '0 auto', marginBottom: items.length ? 56 : 0 }}>
            {content.body}
          </p>
        )}
        {items.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: isMobile ? '32px 28px' : '0 56px', marginTop: !content.body ? 48 : 0 }}>
            {items.map((item, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, minWidth: isMobile ? 100 : 120 }}>
                <NEARBY_ICON type={item.icon || 'city'} size={40} col={iconCol} />
                <div>
                  <p style={{ fontFamily: NU, fontSize: 13, fontWeight: 600, color: textCol, margin: 0, lineHeight: 1.3 }}>{item.label}</p>
                  {item.distance && (
                    <p style={{ fontFamily: NU, fontSize: 12, color: mutCol, margin: '3px 0 0' }}>{item.distance}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── RoomsSection ──────────────────────────────────────────────────────────────
function RoomCard({ room, index, bgPanel, bgIsLt, textCol, mutCol, GOLD, isMobile }) {
  const images     = (room.images || []).filter(img => img.url);
  const videoUrl   = room.videoUrl || '';
  const isOdd      = index % 2 !== 0;
  const imgLeft    = isMobile ? false : isOdd;
  const amenities  = (room.amenities || []).slice(0, 12);
  const btnBg      = bgIsLt ? '#1a1209' : '#f5f0e8';
  const btnTxt     = bgIsLt ? '#f5f0e8' : '#1a1209';
  const borderCol  = bgIsLt ? 'rgba(26,18,9,0.10)' : 'rgba(245,240,232,0.10)';

  // Auto-fade slideshow state
  const hasVideo = !!videoUrl;
  const [activeIdx, setActiveIdx]   = useState(0);
  const [showVideo,  setShowVideo]  = useState(hasVideo && images.length === 0);
  const [muted,      setMuted]      = useState(true);

  // Auto-switch to video when URL is added and no images are present
  useEffect(() => {
    if (videoUrl && images.length === 0) setShowVideo(true);
  }, [videoUrl, images.length]);

  useEffect(() => {
    if (images.length <= 1 || showVideo) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % images.length), 4000);
    return () => clearInterval(t);
  }, [images.length, showVideo]);

  const ImagePanel = (
    <div style={{ position: 'relative', flex: '0 0 50%', minHeight: isMobile ? 300 : 560, overflow: 'hidden', background: bgIsLt ? '#d4cbbf' : '#1e1b17' }}>
      {/* Video layer — supports YouTube, Vimeo, and direct mp4/webm */}
      {showVideo && videoUrl ? (() => {
        const vid = parseBentoVideoUrl(videoUrl);
        if (vid?.type === 'youtube' || vid?.type === 'vimeo') {
          const embedUrl = vid.type === 'youtube'
            ? `https://www.youtube.com/embed/${vid.id}?autoplay=1&mute=${muted?1:0}&loop=1&playlist=${vid.id}&controls=0&rel=0`
            : `https://player.vimeo.com/video/${vid.id}?autoplay=1&muted=${muted?1:0}&loop=1&background=1`;
          return (
            <iframe
              key={`${vid.id}-${muted}`}
              src={embedUrl}
              allow="autoplay; fullscreen"
              style={{ position: 'absolute', inset: '-2px', width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 'none' }}
            />
          );
        }
        return (
          <video src={videoUrl} autoPlay loop muted={muted} playsInline
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
          />
        );
      })() : images.length > 0 ? (
        <>
          {images.map((img, i) => (
            <img
              key={i}
              src={img.url}
              alt={img.alt || room.name || ''}
              style={{
                position: 'absolute', inset: 0, width: '100%', height: '100%',
                objectFit: 'cover', display: 'block',
                opacity: i === activeIdx ? 1 : 0,
                transition: 'opacity 1.2s ease',
              }}
            />
          ))}
          {/* Dot indicators */}
          {images.length > 1 && (
            <div style={{ position: 'absolute', bottom: 18, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 6, zIndex: 2 }}>
              {images.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setActiveIdx(i)}
                  style={{ width: i === activeIdx ? 18 : 6, height: 6, borderRadius: 3, background: i === activeIdx ? '#fff' : 'rgba(255,255,255,0.45)', border: 'none', padding: 0, cursor: 'pointer', transition: 'all 0.35s ease' }}
                />
              ))}
            </div>
          )}
        </>
      ) : (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontFamily: NU, fontSize: 11, color: bgIsLt ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.12)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Room Image</span>
        </div>
      )}
      {/* Video toggle pill */}
      {videoUrl && images.length > 0 && (
        <button
          onClick={() => setShowVideo(v => !v)}
          style={{
            position: 'absolute', top: 16, right: 16, zIndex: 3,
            background: showVideo ? 'rgba(255,255,255,0.95)' : 'rgba(0,0,0,0.5)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: 20, padding: '5px 12px',
            fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: showVideo ? '#1a1209' : '#fff', cursor: 'pointer',
          }}>
          {showVideo ? '⬛ Photos' : '▶ Video'}
        </button>
      )}
      {/* Sound toggle — clean SVG button, bottom-left, only when video is playing */}
      {videoUrl && showVideo && (
        <button
          onClick={() => setMuted(m => !m)}
          title={muted ? 'Unmute' : 'Mute'}
          style={{
            position: 'absolute', bottom: 16, left: 16, zIndex: 3,
            width: 32, height: 32, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)',
            border: '1px solid rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', padding: 0,
          }}>
          {muted ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
              <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            </svg>
          )}
        </button>
      )}
    </div>
  );

  // Pad toward image edge less than outer edge so content feels anchored to the divide
  const innerPad = isMobile ? '24px' : '52px';
  const outerPad = isMobile ? '28px' : '80px';
  const textPad  = isMobile
    ? `40px ${innerPad} 40px ${outerPad}`
    : imgLeft
      ? `64px ${outerPad} 64px ${innerPad}`   // image left → text right → less left pad
      : `64px ${innerPad} 64px ${outerPad}`;  // image right → text left → less right pad

  const TextPanel = (
    <div style={{ flex: '0 0 50%', padding: textPad, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {room.tagline && (
        <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 14px' }}>
          {room.tagline}
        </p>
      )}
      {room.name && (
        <h3 style={{ fontFamily: GD, fontSize: isMobile ? 'clamp(24px,6vw,38px)' : 'clamp(28px,2.8vw,44px)', fontWeight: 400, color: textCol, margin: '0 0 20px', lineHeight: 1.05, letterSpacing: '-0.025em' }}>
          {room.name}
        </h3>
      )}
      {(room.capacity || room.size) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24, paddingBottom: 24, borderBottom: `1px solid ${borderCol}` }}>
          {room.capacity && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <div style={{ display: 'flex', gap: 1 }}>
                {Array.from({ length: Math.min(Number(room.capacity) || 1, 5) }).map((_, i) => (
                  <PersonIcon key={i} size={14} col={mutCol} />
                ))}
              </div>
              <span style={{ fontFamily: NU, fontSize: 11, color: mutCol }}>up to <strong style={{ color: textCol }}>{room.capacity}</strong></span>
            </div>
          )}
          {room.size && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <ExpandIcon size={13} col={mutCol} />
              <span style={{ fontFamily: NU, fontSize: 11, color: mutCol }}><strong style={{ color: textCol }}>{room.size}</strong> m²</span>
            </div>
          )}
        </div>
      )}
      {room.body && (
        <p style={{ fontFamily: NU, fontSize: isMobile ? 13 : 14, lineHeight: 1.85, color: mutCol, margin: '0 0 32px', maxWidth: 400 }}>
          {room.body}
        </p>
      )}
      {amenities.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px 24px', marginBottom: 36, maxWidth: 380 }}>
          {amenities.map((am, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <AMENITY_ICON type={am.icon || 'bed'} size={20} col={mutCol} />
              <span style={{ fontFamily: NU, fontSize: 11, color: mutCol, lineHeight: 1.3, letterSpacing: '0.02em' }}>{am.label}</span>
            </div>
          ))}
        </div>
      )}
      {room.ctaLabel && (
        <div>
          <a
            href={room.ctaUrl || '#'}
            style={{ display: 'inline-block', padding: '13px 32px', background: 'transparent', color: textCol, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', textDecoration: 'none', border: `1px solid ${borderCol}`, transition: 'all 0.2s' }}>
            {room.ctaLabel}
          </a>
        </div>
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: isMobile ? 'column' : 'row', borderTop: index > 0 ? `1px solid ${borderCol}` : 'none', minHeight: isMobile ? 'auto' : 560 }}>
      {imgLeft ? <>{ImagePanel}{TextPanel}</> : <>{TextPanel}{ImagePanel}</>}
    </div>
  );
}

function RoomsSection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P       = palette;
  const GOLD    = P?.navActive || P?.accent || '#C4A05A';
  const bgPanel = layout?.accentBg || (P.mode === 'light' ? '#faf9f6' : '#141210');
  const bgLc    = bgPanel.toLowerCase();
  const bgIsLt  = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd') || bgPanel === '#ffffff';
  const textCol = layout?.textColor || (bgIsLt ? '#1a1209' : '#f5f0e8');
  const mutCol  = bgIsLt ? 'rgba(26,18,9,0.55)' : 'rgba(245,240,232,0.55)';
  const rooms   = content.rooms || [];

  if (!rooms.length) return null;

  return (
    <div style={{ background: bgPanel }}>
      {(content.eyebrow || content.headline || content.paragraph) && (
        <div style={{ textAlign: 'center', padding: isMobile ? '56px 24px 40px' : '72px 48px 48px' }}>
          {content.eyebrow && (
            <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 16px' }}>
              {content.eyebrow}
            </p>
          )}
          {content.headline && (
            <h2 style={{ fontFamily: GD, fontSize: isMobile ? 'clamp(26px,6vw,42px)' : 'clamp(30px,3.5vw,48px)', fontWeight: 400, color: textCol, margin: content.paragraph ? '0 0 24px' : 0, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
              {content.headline}
            </h2>
          )}
          {content.paragraph && (
            <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: mutCol, margin: '0 auto', maxWidth: 600 }}>
              {content.paragraph}
            </p>
          )}
        </div>
      )}
      {rooms.map((room, i) => (
        <RoomCard key={i} room={room} index={i} bgPanel={bgPanel} bgIsLt={bgIsLt} textCol={textCol} mutCol={mutCol} GOLD={GOLD} isMobile={isMobile} />
      ))}
    </div>
  );
}

// ── BentoGridSection — 4-col grid: image | text | video cells ────────────────
function parseBentoVideoUrl(url) {
  if (!url) return null;
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return { type: 'youtube', id: ytMatch[1], thumb: `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg`, embed: `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0&loop=1&playlist=${ytMatch[1]}` };
  // Vimeo
  const vmMatch = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  if (vmMatch) return { type: 'vimeo', id: vmMatch[1], thumb: '', embed: `https://player.vimeo.com/video/${vmMatch[1]}?autoplay=1&loop=1` };
  // Direct video file
  if (/\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)) return { type: 'direct', url };
  return null;
}

// ── BentoImageCell — fade slideshow (up to 4 images) ─────────────────────────
function BentoImageCell({ cell, HEIGHT, bgLight, NU }) {
  // Support both cell.images[] (new) and cell.url (legacy)
  const images = (cell.images?.length ? cell.images : (cell.url ? [{ url: cell.url, alt: cell.alt || '' }] : [])).filter(img => img.url);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    const t = setInterval(() => setActiveIdx(i => (i + 1) % images.length), 3500);
    return () => clearInterval(t);
  }, [images.length]);

  if (!images.length) {
    return (
      <div style={{ width: '100%', height: HEIGHT, background: bgLight ? '#c8bfb0' : '#2a2520', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: NU, fontSize: 11, color: bgLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)' }}>Image</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: HEIGHT, overflow: 'hidden' }}>
      {images.map((img, i) => (
        <img
          key={i}
          src={img.url}
          alt={img.alt || ''}
          loading="lazy"
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            objectFit: 'cover', display: 'block',
            opacity: i === activeIdx ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
        />
      ))}
    </div>
  );
}

function BentoVideoCell({ cell, HEIGHT, bgLight, NU }) {
  const parsed = parseBentoVideoUrl(cell.videoUrl || cell.url || '');

  if (!parsed) {
    return (
      <div style={{ width: '100%', height: HEIGHT, background: bgLight ? '#c8bfb0' : '#1a1410', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontFamily: NU, fontSize: 11, color: bgLight ? 'rgba(0,0,0,0.25)' : 'rgba(255,255,255,0.2)' }}>Video URL</span>
      </div>
    );
  }

  if (parsed.type === 'direct') {
    return (
      <video
        src={parsed.url}
        style={{ width: '100%', height: HEIGHT, objectFit: 'cover', display: 'block' }}
        autoPlay muted loop playsInline
      />
    );
  }

  // YouTube / Vimeo — autoplay in background/silent mode
  const embedUrl = parsed.type === 'youtube'
    ? `https://www.youtube.com/embed/${parsed.id}?autoplay=1&mute=1&loop=1&playlist=${parsed.id}&controls=0&rel=0&playsinline=1`
    : `https://player.vimeo.com/video/${parsed.id}?autoplay=1&muted=1&loop=1&background=1`;

  return (
    <div style={{ position: 'relative', width: '100%', height: HEIGHT, overflow: 'hidden' }}>
      <iframe
        src={embedUrl}
        allow="autoplay; fullscreen"
        style={{ position: 'absolute', inset: '-2px', width: 'calc(100% + 4px)', height: 'calc(100% + 4px)', border: 'none' }}
        title={cell.title || 'Video'}
      />
      {cell.title && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 18px', background: 'linear-gradient(transparent, rgba(0,0,0,0.65))', pointerEvents: 'none' }}>
          <p style={{ margin: 0, fontFamily: NU, fontSize: 12, color: '#f5f0e8', lineHeight: 1.4 }}>{cell.title}</p>
        </div>
      )}
    </div>
  );
}

function BentoGridSection({ content, layout, palette }) {
  const { isMobile } = useBreakpoint();
  const P       = palette;
  const cells   = content.cells || [];
  const bgPanel = layout?.accentBg || (P.mode === 'light' ? '#f5f0e9' : '#1a1410');
  const bgLc    = bgPanel.toLowerCase();
  const bgLight = bgLc.startsWith('#f') || bgLc.startsWith('#e') || bgLc.startsWith('#fa') || bgLc.startsWith('#fd') || bgPanel === '#ffffff';
  const textCol = layout?.textColor || (bgLight ? '#1a1209' : '#f5f0e8');
  const mutCol  = bgLight ? 'rgba(26,18,9,0.65)' : 'rgba(245,240,232,0.65)';
  const ctaCol  = bgLight ? 'rgba(26,18,9,0.38)' : 'rgba(245,240,232,0.38)';
  const COLS    = isMobile ? 2 : 4;
  const HEIGHT  = isMobile ? 240 : 380;
  // Max 8 cells; on mobile show first 4
  const visibleCells = cells.slice(0, isMobile ? 4 : 8);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${COLS}, 1fr)`, gap: 1, background: bgLight ? '#d8d0c4' : '#0a0908' }}>
      {visibleCells.map((cell, i) => {
        const hasVideo = !!(cell.videoUrl || cell.url) && !!parseBentoVideoUrl(cell.videoUrl || cell.url || '');
        if (cell.type === 'video' || hasVideo) {
          return (
            <div key={i} style={{ height: HEIGHT, overflow: 'hidden', lineHeight: 0 }}>
              <BentoVideoCell cell={cell} HEIGHT={HEIGHT} bgLight={bgLight} NU={NU} />
            </div>
          );
        }

        if (cell.type === 'image') {
          return (
            <div key={i} style={{ height: HEIGHT, overflow: 'hidden', lineHeight: 0 }}>
              <BentoImageCell cell={cell} HEIGHT={HEIGHT} bgLight={bgLight} NU={NU} />
            </div>
          );
        }

        // text cell (default)
        return (
          <div key={i} style={{
            height: HEIGHT, background: bgPanel,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: isMobile ? '28px 20px' : '40px 36px', textAlign: 'center',
          }}>
            {cell.eyebrow && (
              <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: ctaCol, margin: '0 0 12px' }}>
                {cell.eyebrow}
              </p>
            )}
            {cell.headline && (
              <h2 style={{ fontFamily: GD, fontSize: isMobile ? 'clamp(18px,4.5vw,28px)' : 'clamp(22px,2.5vw,38px)', fontWeight: 400, color: textCol, margin: cell.title ? '0 0 6px' : '0 0 14px', lineHeight: 1.15, letterSpacing: '-0.01em' }}>
                {cell.headline}
              </h2>
            )}
            {cell.title && (
              <h3 style={{ fontFamily: GD, fontSize: isMobile ? 'clamp(16px,4vw,24px)' : 'clamp(20px,2.2vw,34px)', fontWeight: 400, color: textCol, margin: '0 0 14px', lineHeight: 1.2, letterSpacing: '-0.01em' }}>
                {cell.title}
              </h3>
            )}
            {cell.body && (
              <p style={{ fontFamily: NU, fontSize: isMobile ? 12 : 13, lineHeight: 1.75, color: mutCol, margin: cell.cta ? '0 0 28px' : 0, maxWidth: 260 }}>
                {cell.body}
              </p>
            )}
            {cell.cta && (
              <a href={cell.ctaUrl || '#'} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: ctaCol, textDecoration: 'none', marginTop: !cell.body ? 'auto' : 0 }}>
                {cell.cta}
              </a>
            )}
          </div>
        );
      })}
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

// ── Location Map Section ──────────────────────────────────────────────────────
const LEAFLET_CSS_URL = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
const LEAFLET_JS_URL  = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
let _leafletPromise = null;
function loadLeafletOnce() {
  if (_leafletPromise) return _leafletPromise;
  _leafletPromise = new Promise(resolve => {
    if (window.L) { resolve(window.L); return; }
    if (!document.querySelector(`link[href="${LEAFLET_CSS_URL}"]`)) {
      const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = LEAFLET_CSS_URL;
      document.head.appendChild(l);
    }
    const s = document.createElement('script'); s.src = LEAFLET_JS_URL;
    s.onload = () => resolve(window.L);
    document.head.appendChild(s);
  });
  return _leafletPromise;
}

function MapShowcaseSection({ content, layout, palette, showcaseName, showcaseLocation }) {
  const P      = palette;
  const mapEl  = useRef(null);
  const mapRef = useRef(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const address = content.address || '';
    const zoom    = parseInt(content.zoom) || 14;

    async function init(lat, lng) {
      const L = await loadLeafletOnce();
      if (cancelled || !mapEl.current) return;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }

      const map = L.map(mapEl.current, { zoomControl: true, attributionControl: true, scrollWheelZoom: false });
      mapRef.current = map;
      L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://carto.com">CARTO</a> &copy; <a href="https://osm.org/copyright">OSM</a>',
        maxZoom: 19,
      }).addTo(map);
      map.setView([lat, lng], zoom);

      const icon = L.divIcon({
        className: '',
        iconSize: [28, 38], iconAnchor: [14, 38], popupAnchor: [0, -34],
        html: `<svg viewBox="0 0 28 38" width="28" height="38" xmlns="http://www.w3.org/2000/svg">
          <path d="M14 1C7.1 1 1.5 6.6 1.5 13.5c0 4.2 2 7.9 5.1 10.3L14 37l7.4-13.2A12.4 12.4 0 0 0 26.5 13.5C26.5 6.6 20.9 1 14 1z" fill="#C9A84C" filter="drop-shadow(0 2px 3px rgba(0,0,0,0.3))"/>
          <circle cx="14" cy="13.5" r="4.5" fill="white" opacity="0.95"/>
        </svg>`,
      });
      L.marker([lat, lng], { icon }).addTo(map);
      setReady(true);
    }

    // Build progressive queries: strip address noise from location, keep city/country
    function buildQueries(title, location) {
      let cityCountry = (location || '').trim();
      if (cityCountry) {
        const dotParts = cityCountry.split('·').map(s => s.trim()).filter(Boolean);
        if (dotParts.length >= 2) {
          cityCountry = dotParts.slice(-2).join(', ');
        } else {
          const commaParts = dotParts[0].split(',').map(s => s.trim()).filter(Boolean);
          cityCountry = commaParts.slice(-Math.min(2, commaParts.length)).join(', ');
        }
      }
      const qs = [];
      if (title && cityCountry) qs.push(`${title}, ${cityCountry}`);
      if (title)                 qs.push(title);
      if (cityCountry)           qs.push(cityCountry);
      return qs;
    }

    async function tryGeocode(queries) {
      for (const q of queries) {
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'en' } });
          const data = await res.json();
          if (!cancelled && data?.[0]) { init(parseFloat(data[0].lat), parseFloat(data[0].lon)); return; }
        } catch {}
      }
    }

    if (content.lat && content.lng) {
      init(parseFloat(content.lat), parseFloat(content.lng));
    } else if (address) {
      tryGeocode([address]);
    } else {
      // Auto-geocode from showcase name + location — try progressively simpler queries
      const queries = buildQueries(showcaseName, showcaseLocation);
      if (queries.length) tryGeocode(queries);
    }

    return () => {
      cancelled = true;
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    };
  }, [content.address, content.lat, content.lng, content.zoom, showcaseName, showcaseLocation]);

  const { isMobile } = useBreakpoint();
  const bg      = layout?.accentBg || (P.mode === 'light' ? '#ffffff' : '#0d0d0b');
  const panelBg = P.mode === 'light' ? '#ffffff' : '#141210';
  const textCol = layout?.textColor || (P.mode === 'light' ? '#1a1a1a' : '#f2efe9');
  const mutCol  = P.mode === 'light' ? '#555555' : '#aaaaaa';
  const brdCol  = P.mode === 'light' ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.07)';

  // Build display address from content or showcase data
  const displayAddress = content.addressDisplay || showcaseLocation || '';

  // "Where is it?" items
  const whereItems = content.whereItems || [];

  const hasPanel = !!(displayAddress || content.checkin || content.checkout || content.what3words || whereItems.length);

  return (
    <section style={{ background: bg, padding: isMobile ? '48px 0 60px' : '72px 0 88px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: isMobile ? '0 20px' : '0 48px' }}>

        {/* Section heading — centered, serif */}
        {content.headline && (
          <h2 style={{
            fontFamily: GD, fontSize: isMobile ? 28 : 38, fontWeight: 400,
            color: textCol, textAlign: 'center', margin: '0 0 40px', letterSpacing: '-0.01em',
          }}>
            {content.headline}
          </h2>
        )}

        {/* Two-column: map + info panel */}
        <div style={{
          display: isMobile ? 'flex' : 'grid',
          flexDirection: isMobile ? 'column' : undefined,
          gridTemplateColumns: hasPanel ? '1fr 360px' : '1fr',
          gap: 0,
          minHeight: isMobile ? 'auto' : 520,
          border: `1px solid ${brdCol}`,
          overflow: 'hidden',
        }}>

          {/* ── Map ── */}
          <div style={{ position: 'relative', background: '#e8e0d4', height: isMobile ? 280 : 'auto', minHeight: isMobile ? 280 : 520 }}>
            <div ref={mapEl} style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }} />
            {!ready && (
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#e8e0d4' }}>
                <span style={{ fontFamily: NU, fontSize: 10, color: '#999', letterSpacing: '2px', textTransform: 'uppercase' }}>Loading map…</span>
              </div>
            )}
          </div>

          {/* ── Info panel ── */}
          {hasPanel && (
            <div style={{
              background: panelBg,
              borderLeft: isMobile ? 'none' : `1px solid ${brdCol}`,
              borderTop: isMobile ? `1px solid ${brdCol}` : 'none',
              padding: isMobile ? '28px 24px' : '40px 36px',
              display: 'flex', flexDirection: 'column', gap: 0,
              overflowY: 'auto',
            }}>

              {/* Hotel Address block */}
              {(displayAddress || content.checkin || content.checkout || content.what3words) && (
                <div style={{ marginBottom: whereItems.length ? 32 : 0 }}>
                  <h3 style={{ fontFamily: GD, fontSize: 24, fontWeight: 400, color: textCol, margin: '0 0 18px', letterSpacing: '-0.01em' }}>
                    {content.addressHeading || 'Hotel Address'}
                  </h3>

                  {/* Address lines */}
                  {displayAddress && (
                    <p style={{ fontFamily: NU, fontSize: 14, color: mutCol, lineHeight: 1.8, margin: '0 0 20px', whiteSpace: 'pre-line' }}>
                      {displayAddress}
                    </p>
                  )}

                  {/* Check-in / Check-out */}
                  {(content.checkin || content.checkout) && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
                      {content.checkin && (
                        <div style={{ fontFamily: NU, fontSize: 14, color: mutCol }}>
                          Check in: <strong style={{ color: textCol, marginLeft: 6 }}>{content.checkin}</strong>
                        </div>
                      )}
                      {content.checkout && (
                        <div style={{ fontFamily: NU, fontSize: 14, color: mutCol }}>
                          Check out: <strong style={{ color: textCol, marginLeft: 6 }}>{content.checkout}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* What3words */}
                  {content.what3words && (
                    <div style={{ fontFamily: NU, fontSize: 14, color: mutCol }}>
                      What3words location: <strong style={{ color: textCol, marginLeft: 4 }}>{content.what3words}</strong>
                    </div>
                  )}
                </div>
              )}

              {/* Where is it? block */}
              {whereItems.length > 0 && (
                <div>
                  {(displayAddress || content.checkin || content.checkout || content.what3words) && (
                    <div style={{ height: 1, background: brdCol, margin: '0 0 28px' }} />
                  )}
                  <h3 style={{ fontFamily: GD, fontSize: 24, fontWeight: 400, color: textCol, margin: '0 0 16px', letterSpacing: '-0.01em' }}>
                    {content.whereHeading || 'Where is it?'}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {whereItems.map((item, i) => (
                      <p key={i} style={{ fontFamily: NU, fontSize: 14, color: mutCol, margin: 0, lineHeight: 1.6 }}>
                        {item.text || item.label || ''}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
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
      || (content.images && content.images.some(i => i.url))
      || (content.cells  && content.cells.length  > 0);

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
        inner = <FilmsSection content={content} layout={layout} palette={palette} />;
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
      case 'bento-grid':
        inner = <BentoGridSection content={content} layout={layout} palette={palette} />;
        break;
      case 'nearby':
        inner = <NearbySection content={content} layout={layout} palette={palette} showcaseName={showcase?.title} showcaseLocation={showcase?.location} />;
        break;
      case 'rooms':
        inner = <RoomsSection content={content} layout={layout} palette={palette} />;
        break;
      case 'map':
        inner = <MapShowcaseSection content={content} layout={layout} palette={palette} showcaseName={showcase?.title} showcaseLocation={showcase?.location} />;
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
          {/* Header block — HomeNav (fixed) + BreadcrumbBar (in flow).
              Light background prevents dark palette.bg bleeding through the gap. */}
          <div style={{ background: darkMode ? 'rgba(11,9,6,0.97)' : '#f2f0ea' }}>
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
