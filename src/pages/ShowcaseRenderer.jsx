// ─── src/pages/ShowcaseRenderer.jsx ──────────────────────────────────────────
// Renders a showcase composition from structured sections JSON.
// Used by:
//   - Public showcase page (/showcase/:slug) — reads published_sections
//   - Showcase Studio right panel (preview) — reads sections (draft)
//
// Theme system:
//   showcase.theme (DB jsonb column) overrides the default dark palette.
//   Shape: { mode:'light'|'dark', bg, bg2, bg3, accent, navBg, navText,
//             navActive, navBorder, heroOverlayOpacity }
//   Anything omitted falls back to the palette defaults below.
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
import { CarouselRow }               from '../components/cards/editorial/CarouselCard';
import { SECTION_REGISTRY }          from '../services/showcaseRegistry';
import HomeNav                       from '../components/nav/HomeNav';

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
const NAV_ELIGIBLE = new Set(['intro', 'feature', 'mosaic', 'gallery', 'dining', 'spaces', 'wellness', 'weddings']);
const TYPE_LABEL   = {
  intro:    'Overview',
  feature:  'Highlights',
  mosaic:   'Gallery',
  gallery:  'Gallery',
  dining:   'Dining',
  spaces:   'Spaces',
  wellness: 'Wellness & Spa',
  weddings: 'Weddings',
};

// ── Sticky section sub-nav ────────────────────────────────────────────────────
function SectionNav({ sections, palette }) {
  const P = palette || DARK_PALETTE;
  const [visible,  setVisible]  = useState(false);
  const [activeId, setActiveId] = useState(null);

  const navItems = sections
    .filter(s => NAV_ELIGIBLE.has(s.type))
    .map(s => ({
      id:    s.id,
      label: s.content?.eyebrow || TYPE_LABEL[s.type] || s.type,
    }));

  useEffect(() => {
    const hero = document.querySelector('[data-showcase-section="hero"]');
    if (!hero) { setVisible(true); return; }
    const obs = new IntersectionObserver(
      ([entry]) => setVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    obs.observe(hero);
    return () => obs.disconnect();
  }, [sections]);

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
    const y = el.getBoundingClientRect().top + window.scrollY - 108;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div
      role="navigation"
      aria-label="Showcase sections"
      style={{
        position:       'fixed',
        top:            64,
        left:           0,
        right:          0,
        zIndex:         690,
        height:         44,
        background:     P.navBg,
        backdropFilter: 'blur(14px)',
        borderBottom:   `1px solid ${P.navBorder}`,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        overflowX:      'auto',
        opacity:        visible ? 1 : 0,
        pointerEvents:  visible ? 'auto' : 'none',
        transform:      visible ? 'translateY(0)' : 'translateY(-6px)',
        transition:     'opacity 0.35s ease, transform 0.35s ease',
      }}
    >
      {navItems.map(item => {
        const isActive = activeId === item.id;
        return (
          <button
            key={item.id}
            onClick={() => scrollTo(item.id)}
            style={{
              background:    'none',
              border:        'none',
              borderBottom:  isActive ? `2px solid ${P.navActive}` : '2px solid transparent',
              cursor:        'pointer',
              padding:       '0 22px',
              height:        44,
              fontFamily:    NU,
              fontSize:      10,
              letterSpacing: '0.17em',
              textTransform: 'uppercase',
              fontWeight:    600,
              color:         isActive ? P.navActive : P.navText,
              whiteSpace:    'nowrap',
              flexShrink:    0,
              transition:    'color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => {
              if (!isActive) e.currentTarget.style.color = P.mode === 'light'
                ? 'rgba(28,20,16,0.82)'
                : 'rgba(245,240,232,0.82)';
            }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = P.navText; }}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Media fallback resolver ───────────────────────────────────────────────────
function resolveImage(sectionImage, showcaseHero, listingFirstImage) {
  return sectionImage || showcaseHero || listingFirstImage || null;
}

// ── Section renderers — each receives `palette` for theme-aware colours ───────

function HeroSection({ content, layout, showcaseHero, listingFirstImage, palette }) {
  const P     = palette;
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  const op    = content.overlay_opacity ?? P.heroOverlayOpacity;

  return (
    <div style={{
      position: 'relative',
      height: '92vh', minHeight: 520,
      overflow: 'hidden',
      background: '#0a0a08',
    }}>
      {image && (
        <img
          src={image}
          alt={content.title || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, rgba(0,0,0,${op + 0.30}) 0%, rgba(0,0,0,${op}) 50%, rgba(0,0,0,${op - 0.20}) 100%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(32px, 5vw, 80px)',
      }}>
        <p style={{
          fontFamily: NU, fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: P.label,
          margin: '0 0 16px', fontWeight: 600,
        }}>
          Luxury Wedding Directory
        </p>
        <h1 style={{
          fontFamily: GD,
          fontSize: 'clamp(36px, 6vw, 88px)',
          fontWeight: 400, color: '#f5f0e8',
          margin: '0 0 16px', lineHeight: 1.05, letterSpacing: '-0.01em',
        }}>
          {content.title || 'Venue Name'}
        </h1>
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
      </div>
    </div>
  );
}

function IntroSection({ content, layout, palette }) {
  const P = palette;
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

function FeatureSection({ content, layout, showcaseHero, listingFirstImage, palette }) {
  const P     = palette;
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  return (
    <FeatureCard data={{
      variant:  layout?.variant || 'image-left',
      image,
      category: content.eyebrow,
      title:    content.headline,
      excerpt:  content.body,
      accentBg: layout?.accentBg || P.bg2,
      theme:    P.mode,
    }} />
  );
}

function StatsSection({ content, layout, palette }) {
  const P = palette;
  return (
    <VenueStatsCard data={{
      variant:  layout?.variant || 'strip',
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

function MosaicSection({ content, layout, palette }) {
  const P      = palette;
  const images = (content.images || []).filter(i => i.url).map(i => i.url);
  if (images.length < 2) {
    return (
      <div style={{ background: P.bg2, padding: '60px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: NU, fontSize: 13, color: P.muted }}>
          Mosaic — add at least 2 images to preview
        </p>
      </div>
    );
  }
  return (
    <MosaicCard data={{
      variant: layout?.variant || 'default',
      title:   content.title,
      excerpt: content.body,
      images:  images.slice(0, 4),
      theme:   P.mode,
    }} />
  );
}

function GallerySection({ content, palette }) {
  const P     = palette;
  const items = (content.images || [])
    .filter(i => i.url)
    .map(i => ({ image: i.url, title: i.caption || '' }));
  if (!items.length) return null;
  return (
    <div style={{ padding: '60px 0', background: P.bg }}>
      {content.title && (
        <p style={{
          fontFamily: NU, fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: P.accent, fontWeight: 600,
          textAlign: 'center', margin: '0 0 32px',
        }}>
          {content.title}
        </p>
      )}
      <CarouselRow items={items} />
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
      accentColor: P.accent,
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

// ── Section preview fallback (studio only) ────────────────────────────────────
function SectionPlaceholder({ section, palette }) {
  const P   = palette;
  const reg = SECTION_REGISTRY[section.type] || {};
  return (
    <div style={{
      padding: '48px 40px', background: P.bg2,
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

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function ShowcaseRenderer({
  sections = [],
  showcase = {},              // { hero_image_url, title, theme }
  listingFirstImage = null,
  isPreview = false,
  onNavigateStandard = null,
  onBack = null,
}) {
  const heroUrl = showcase.hero_image_url || null;
  const palette = buildPalette(showcase.theme);

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
        inner = <GallerySection content={content} palette={palette} />;
        break;
      case 'dining':
      case 'spaces':
      case 'wellness':
      case 'weddings':
        inner = <EditorialFeatureSection content={content} layout={layout} {...shared} />;
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

    return (
      <div
        key={section.id}
        id={`sec-${section.id}`}
        data-showcase-section={type}
        style={{ scrollMarginTop: isPreview ? 0 : 108 }}
      >
        {inner}
      </div>
    );
  }

  return (
    <div style={{ background: palette.bg, color: palette.text, minHeight: '100vh' }}>

      {!isPreview && (
        <>
          <HomeNav hasHero onNavigateStandard={onNavigateStandard} />
          <SectionNav sections={sections} palette={palette} />
        </>
      )}

      {sections.map(section => renderSection(section))}
    </div>
  );
}
