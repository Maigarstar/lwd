// ─── src/pages/ShowcaseRenderer.jsx ──────────────────────────────────────────
// Renders a showcase composition from structured sections JSON.
// Used by:
//   - Public showcase page (/showcase/:slug) — reads published_sections
//   - Showcase Studio right panel (preview) — reads sections (draft)
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

const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';

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
// Appears after the hero scrolls out of view.
// Auto-generated from eligible section types; labels use eyebrow if set.
function SectionNav({ sections }) {
  const [visible,  setVisible]  = useState(false);
  const [activeId, setActiveId] = useState(null);

  const navItems = sections
    .filter(s => NAV_ELIGIBLE.has(s.type))
    .map(s => ({
      id:    s.id,
      label: s.content?.eyebrow || TYPE_LABEL[s.type] || s.type,
    }));

  // Observe hero leaving viewport → show/hide SectionNav
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

  // IntersectionObserver to track which section is in view
  useEffect(() => {
    if (!navItems.length) return;
    const els = navItems
      .map(item => document.getElementById(`sec-${item.id}`))
      .filter(Boolean);
    if (!els.length) return;
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id.replace('sec-', ''));
          }
        });
      },
      // Section is "active" when it occupies the upper-centre of the viewport
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
    // offset accounts for HomeNav (64) + SectionNav (44)
    const y = el.getBoundingClientRect().top + window.scrollY - 108;
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return (
    <div
      role="navigation"
      aria-label="Showcase sections"
      style={{
        position:      'fixed',
        top:           64,
        left:          0,
        right:         0,
        zIndex:        690,
        height:        44,
        background:    'rgba(10,10,8,0.94)',
        backdropFilter:'blur(14px)',
        borderBottom:  '1px solid rgba(201,168,76,0.14)',
        display:       'flex',
        alignItems:    'center',
        justifyContent:'center',
        overflowX:     'auto',
        // Fade + slide in when hero leaves viewport
        opacity:       visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
        transform:     visible ? 'translateY(0)' : 'translateY(-6px)',
        transition:    'opacity 0.35s ease, transform 0.35s ease',
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
              borderBottom:  isActive ? `2px solid ${GOLD}` : '2px solid transparent',
              cursor:        'pointer',
              padding:       '0 22px',
              height:        44,
              fontFamily:    NU,
              fontSize:      10,
              letterSpacing: '0.17em',
              textTransform: 'uppercase',
              fontWeight:    600,
              color:         isActive ? GOLD : 'rgba(245,240,232,0.48)',
              whiteSpace:    'nowrap',
              flexShrink:    0,
              transition:    'color 0.2s ease, border-color 0.2s ease',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = 'rgba(245,240,232,0.82)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = 'rgba(245,240,232,0.48)'; }}
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

// ── Section renderers ─────────────────────────────────────────────────────────

function HeroSection({ content, layout, showcaseHero, listingFirstImage }) {
  const image   = resolveImage(content.image, showcaseHero, listingFirstImage);
  const opacity = content.overlay_opacity ?? 0.45;

  return (
    <div style={{ position: 'relative', height: '92vh', minHeight: 520, overflow: 'hidden', background: '#0a0a08' }}>
      {image && (
        <img
          src={image}
          alt={content.title || ''}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
      <div style={{
        position: 'absolute', inset: 0,
        background: `linear-gradient(to top, rgba(0,0,0,${opacity + 0.3}) 0%, rgba(0,0,0,${opacity}) 50%, rgba(0,0,0,${opacity - 0.2}) 100%)`,
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(32px, 5vw, 80px)',
      }}>
        <p style={{
          fontFamily: NU, fontSize: 10, letterSpacing: '0.22em',
          textTransform: 'uppercase', color: GOLD,
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
            color: 'rgba(245,240,232,0.75)',
            margin: 0, maxWidth: 600, lineHeight: 1.65,
          }}>
            {content.tagline}
          </p>
        )}
      </div>
    </div>
  );
}

function IntroSection({ content, layout }) {
  return (
    <TwoColumnEditorialCard data={{
      variant:  'centered',
      eyebrow:  content.eyebrow,
      title:    content.headline,
      body:     content.body ? [content.body] : [],
      accentBg: layout?.accentBg || '#0f0e0c',
      theme:    'dark',
    }} />
  );
}

function FeatureSection({ content, layout, showcaseHero, listingFirstImage }) {
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  return (
    <FeatureCard data={{
      variant:  layout?.variant || 'image-left',
      image,
      category: content.eyebrow,
      title:    content.headline,
      excerpt:  content.body,
      accentBg: layout?.accentBg || '#1a1209',
      theme:    'dark',
    }} />
  );
}

function StatsSection({ content, layout }) {
  return (
    <VenueStatsCard data={{
      variant:  layout?.variant || 'strip',
      eyebrow:  content.eyebrow,
      stats:    (content.items || []).map(i => ({
        value:    i.value,
        label:    i.label,
        sublabel: i.sublabel || i.sub || '',
      })),
      accentBg: layout?.accentBg || '#1a1209',
      theme:    'dark',
    }} />
  );
}

function QuoteSection({ content, layout }) {
  return (
    <QuoteCard data={{
      variant:         layout?.variant || 'centered',
      quote:           content.text,
      attribution:     content.attribution,
      attributionRole: content.attributionRole,
      image:           content.image || null,
      accentBg:        layout?.accentBg || '#1a1209',
      theme:           'dark',
    }} />
  );
}

function MosaicSection({ content, layout }) {
  const images = (content.images || []).filter(i => i.url).map(i => i.url);
  if (images.length < 2) {
    return (
      <div style={{ background: '#111', padding: '60px 40px', textAlign: 'center' }}>
        <p style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
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
      theme:   'dark',
    }} />
  );
}

function GallerySection({ content }) {
  const items = (content.images || [])
    .filter(i => i.url)
    .map(i => ({ image: i.url, title: i.caption || '' }));
  if (!items.length) return null;
  return (
    <div style={{ padding: '40px 0' }}>
      {content.title && (
        <p style={{
          fontFamily: NU, fontSize: 10, letterSpacing: '0.18em',
          textTransform: 'uppercase', color: GOLD, fontWeight: 600,
          textAlign: 'center', margin: '0 0 24px',
        }}>
          {content.title}
        </p>
      )}
      <CarouselRow items={items} />
    </div>
  );
}

function EditorialFeatureSection({ content, layout, showcaseHero, listingFirstImage, eyebrowOverride }) {
  const image = resolveImage(content.image, showcaseHero, listingFirstImage);
  return (
    <FeatureCard data={{
      variant:  layout?.variant || 'image-left',
      image,
      category: content.eyebrow || eyebrowOverride || '',
      title:    content.headline,
      excerpt:  content.body,
      accentBg: layout?.accentBg || '#1a1209',
      theme:    'dark',
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

function CtaSection({ content, venueName }) {
  return (
    <VenueEnquireCard data={{
      headline:    content.headline || 'Begin Your Story',
      subline:     content.subline  || '',
      background:  content.background || null,
      venueName:   content.venueName || venueName || '',
      accentColor: GOLD,
    }} />
  );
}

function RelatedSection({ content }) {
  if (!content.items || content.items.length === 0) return null;
  return (
    <div style={{ padding: '60px 40px', background: '#0f0e0c', textAlign: 'center' }}>
      <p style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 600, margin: '0 0 32px' }}>
        {content.title || 'You may also love'}
      </p>
      <p style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.3)', margin: 0 }}>
        Related venues will appear here once linked.
      </p>
    </div>
  );
}

// ── Section preview fallback (studio only) ────────────────────────────────────
function SectionPlaceholder({ section }) {
  const reg = SECTION_REGISTRY[section.type] || {};
  return (
    <div style={{
      padding: '48px 40px', background: '#111110',
      border: '1px dashed rgba(201,168,76,0.2)',
      textAlign: 'center',
    }}>
      <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 600, marginBottom: 8 }}>
        {reg.label || section.type}
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: 'rgba(255,255,255,0.3)' }}>
        {reg.previewFallback || 'Add content to preview this section'}
      </div>
    </div>
  );
}

// ── Main renderer ─────────────────────────────────────────────────────────────
export default function ShowcaseRenderer({
  sections = [],
  showcase = {},              // { hero_image_url, title }
  listingFirstImage = null,
  isPreview = false,          // true when used inside studio
  onNavigateStandard = null,  // passed to HomeNav
  onBack = null,              // reserved for future back button
}) {
  const heroUrl = showcase.hero_image_url || null;

  function renderSection(section) {
    const { type, content = {}, layout = {} } = section;
    const shared = { showcaseHero: heroUrl, listingFirstImage };

    // In preview mode, show placeholder if section has no required content
    const hasMinContent = content.title || content.headline || content.text || content.url || content.image || (content.items && content.items.length > 0) || (content.images && content.images.some(i => i.url));
    if (isPreview && !hasMinContent && type !== 'cta' && type !== 'related') {
      return <SectionPlaceholder key={section.id} section={section} />;
    }

    // ── Resolve the inner section component ──────────────────────────────────
    let inner;
    switch (type) {
      case 'hero':
        inner = <HeroSection content={content} layout={layout} {...shared} />;
        break;
      case 'stats':
        inner = <StatsSection content={content} layout={layout} />;
        break;
      case 'intro':
        inner = <IntroSection content={content} layout={layout} />;
        break;
      case 'feature':
        inner = <FeatureSection content={content} layout={layout} {...shared} />;
        break;
      case 'quote':
        inner = <QuoteSection content={content} layout={layout} />;
        break;
      case 'mosaic':
        inner = <MosaicSection content={content} layout={layout} />;
        break;
      case 'gallery':
        inner = <GallerySection content={content} />;
        break;
      case 'dining':
      case 'spaces':
      case 'wellness':
      case 'weddings':
        inner = <EditorialFeatureSection content={content} layout={layout} {...shared} eyebrowOverride={content.eyebrow} />;
        break;
      case 'image-full':
        inner = <FullImageSection content={content} />;
        break;
      case 'cta':
        inner = <CtaSection content={content} venueName={showcase.title} />;
        break;
      case 'related':
        inner = <RelatedSection content={content} />;
        break;
      default:
        inner = isPreview ? <SectionPlaceholder section={section} /> : null;
    }

    if (!inner) return null;

    // ── Wrap with anchor ID so SectionNav + smooth-scroll works ─────────────
    // scroll-margin-top offsets HomeNav (64px) + SectionNav (44px) = 108px
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
    <div style={{ background: '#0a0a08', color: '#f5f0e8', minHeight: '100vh' }}>

      {/* ── Public chrome: main nav + section sub-nav ── */}
      {!isPreview && (
        <>
          <HomeNav
            hasHero
            onNavigateStandard={onNavigateStandard}
          />
          <SectionNav sections={sections} />
        </>
      )}

      {sections.map((section) => renderSection(section))}
    </div>
  );
}
