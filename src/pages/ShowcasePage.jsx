// ─── ShowcasePage.jsx ─────────────────────────────────────────────────────────
// Dynamic showcase template, /showcase/:slug
// Loads from venue_showcases table, enriches with linked listings record.
// Renders sections based on the sections JSONB array stored in the DB.
// Falls back to VenueShowcase media-grid if no showcase record found.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { fetchShowcaseBySlug }  from '../services/showcaseService';
import { fetchListingBySlug }   from '../services/listings';
import { useChat }              from '../chat/ChatContext';
import HomeNav                  from '../components/nav/HomeNav';
import { buildCardImgs }        from '../utils/mediaMappers';
import ShowcaseRenderer         from './ShowcaseRenderer';
import { setListingContext, clearListingContext } from '../lib/tracker';

// ── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        '#0a0a08',
  surface:   '#111110',
  border:    '#2a2a26',
  border2:   '#3a3a36',
  gold:      '#C9A84C',
  goldDim:   'rgba(201,168,76,0.12)',
  text:      '#f5f2ec',
  textMid:   '#c8c4bc',
  textLight: '#9c9890',
  navBg:     'rgba(10,10,8,0.92)',
};
const FD = 'var(--font-heading-primary)';
const FB = 'var(--font-body)';

// ── Helpers ───────────────────────────────────────────────────────────────────
function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setMobile(e.matches);
    mql.addEventListener('change', fn);
    return () => mql.removeEventListener('change', fn);
  }, [bp]);
  return mobile;
}

function getImages(mediaItems = []) {
  return (mediaItems || [])
    .filter(i => (i.type === 'image' || !i.type) && (i.visibility || 'public') === 'public' && !(i.file instanceof File) && (i.url || i.src))
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    })
    .map(i => ({ id: i.id || i.url, src: i.url || i.src, alt: i.alt_text || i.title || '' }));
}

// ── Section: Hero ─────────────────────────────────────────────────────────────
function HeroSection({ showcase, listing, onEnquire, isMobile }) {
  const heroImg = showcase?.heroImage || listing?.heroImage || (listing?.imgs?.[0]) || '';
  const title   = showcase?.name || listing?.name || '';
  const location = showcase?.location || (listing?.city && listing?.country ? `${listing.city}, ${listing.country}` : '') || '';
  const excerpt  = showcase?.excerpt || listing?.short_description || '';

  return (
    <div style={{ position: 'relative', height: isMobile ? '80vh' : '100vh', overflow: 'hidden', background: '#0a0a08' }}>
      {heroImg && (
        <img
          src={heroImg} alt={title}
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', opacity: 0.65 }}
        />
      )}
      {/* Gradient overlay */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,10,8,0.92) 0%, rgba(10,10,8,0.25) 50%, rgba(10,10,8,0.1) 100%)' }} />
      {/* Content */}
      <div style={{ position: 'absolute', bottom: isMobile ? 40 : 80, left: isMobile ? 24 : 64, right: isMobile ? 24 : 64 }}>
        {location && (
          <p style={{ fontFamily: FB, fontSize: 12, color: C.gold, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 12 }}>{location}</p>
        )}
        <h1 style={{ fontFamily: FD, fontSize: isMobile ? 36 : 72, fontWeight: 400, color: C.text, lineHeight: 1.05, marginBottom: excerpt ? 18 : 28, letterSpacing: '-0.5px' }}>
          {title}
        </h1>
        {excerpt && (
          <p style={{ fontFamily: FB, fontSize: isMobile ? 14 : 17, color: C.textMid, lineHeight: 1.65, maxWidth: 560, marginBottom: 28 }}>{excerpt}</p>
        )}
        <button
          onClick={onEnquire}
          style={{
            background: C.gold, border: 'none', color: '#0a0a08',
            fontFamily: FB, fontSize: 12, fontWeight: 800,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '14px 28px', cursor: 'pointer',
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          Begin Your Enquiry →
        </button>
      </div>
    </div>
  );
}

// ── Section: Stats strip ──────────────────────────────────────────────────────
function StatsSection({ stats = [], isMobile }) {
  if (!stats || stats.length === 0) return null;
  return (
    <div style={{ background: C.surface, borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`, padding: isMobile ? '0 16px' : '0 64px' }}>
      <div style={{ display: 'flex', overflowX: 'auto', gap: 0 }}>
        {stats.filter(s => s.value && s.label).map((s, i, arr) => (
          <div key={i} style={{
            flex: '0 0 auto', padding: isMobile ? '20px 20px' : '24px 36px',
            borderRight: i < arr.length - 1 ? `1px solid ${C.border}` : 'none',
            textAlign: 'center', minWidth: isMobile ? 100 : 130,
          }}>
            <div style={{ fontFamily: FD, fontSize: isMobile ? 22 : 28, color: C.gold, lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontFamily: FB, fontSize: 10, color: C.textLight, marginTop: 5, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Section: Overview ─────────────────────────────────────────────────────────
function OverviewSection({ listing, isMobile }) {
  const desc = listing?.description || listing?.short_description || listing?.card_summary || null;
  if (!desc) return null;
  return (
    <div style={{ padding: isMobile ? '56px 24px' : '80px 64px', maxWidth: 760, margin: '0 auto' }}>
      <p style={{ fontFamily: FB, fontSize: 10, color: C.gold, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 16 }}>About</p>
      <p style={{ fontFamily: FD, fontSize: isMobile ? 22 : 30, color: C.text, lineHeight: 1.4, fontWeight: 400 }}>{desc}</p>
    </div>
  );
}

// ── Section: Gallery ──────────────────────────────────────────────────────────
function GallerySection({ listing, isMobile }) {
  const images = getImages(listing?.media_items || []);
  if (!images.length) return null;

  const [lightIdx, setLightIdx] = useState(null);

  return (
    <div style={{ padding: isMobile ? '0 0 48px' : '0 0 80px' }}>
      <div style={{ padding: isMobile ? '0 24px 28px' : '0 64px 36px' }}>
        <p style={{ fontFamily: FB, fontSize: 10, color: C.gold, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Gallery</p>
        <div style={{ width: 40, height: 1, background: C.gold }} />
      </div>

      {/* Masonry-style grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)',
        gap: 3,
        padding: isMobile ? '0 3px' : '0 3px',
      }}>
        {images.slice(0, 12).map((img, i) => (
          <div
            key={img.id || i}
            onClick={() => setLightIdx(i)}
            style={{
              aspectRatio: i === 0 ? '16/9' : i % 5 === 0 ? '4/5' : '4/3',
              gridColumn: i === 0 ? (isMobile ? 'span 2' : 'span 2') : 'span 1',
              overflow: 'hidden', cursor: 'pointer', position: 'relative',
              background: '#111',
            }}
          >
            <img
              src={img.src} alt={img.alt}
              style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.5s ease', display: 'block' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.04)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            />
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightIdx !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setLightIdx(null)}
        >
          <img src={images[lightIdx]?.src} alt="" style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }} onClick={e => e.stopPropagation()} />
          <button onClick={() => setLightIdx(null)} style={{ position: 'absolute', top: 20, right: 24, background: 'none', border: 'none', color: '#fff', fontSize: 28, cursor: 'pointer', lineHeight: 1 }}>✕</button>
          {lightIdx > 0 && <button onClick={e => { e.stopPropagation(); setLightIdx(i => i - 1); }} style={{ position: 'absolute', left: 20, background: 'none', border: `1px solid rgba(255,255,255,0.2)`, color: '#fff', width: 44, height: 44, cursor: 'pointer', fontSize: 20 }}>←</button>}
          {lightIdx < images.length - 1 && <button onClick={e => { e.stopPropagation(); setLightIdx(i => i + 1); }} style={{ position: 'absolute', right: 20, background: 'none', border: `1px solid rgba(255,255,255,0.2)`, color: '#fff', width: 44, height: 44, cursor: 'pointer', fontSize: 20 }}>→</button>}
          <div style={{ position: 'absolute', bottom: 20, fontFamily: FB, fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{lightIdx + 1} / {images.length}</div>
        </div>
      )}
    </div>
  );
}

// ── Section: Sections header label ────────────────────────────────────────────
function SectionLabel({ label }) {
  return (
    <div style={{ padding: '64px 64px 0' }}>
      <p style={{ fontFamily: FB, fontSize: 10, color: C.gold, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>{label}</p>
      <div style={{ width: 40, height: 1, background: C.gold }} />
    </div>
  );
}

// ── Section: Enquire CTA ──────────────────────────────────────────────────────
function EnquireSection({ showcase, listing, onEnquire, isMobile }) {
  const title = showcase?.name || listing?.name || '';
  return (
    <div style={{
      background: C.surface, borderTop: `1px solid ${C.border}`,
      padding: isMobile ? '56px 24px' : '80px 64px',
      textAlign: 'center',
    }}>
      <p style={{ fontFamily: FB, fontSize: 10, color: C.gold, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 20 }}>Enquire</p>
      <h2 style={{ fontFamily: FD, fontSize: isMobile ? 28 : 44, color: C.text, fontWeight: 400, marginBottom: 16 }}>Plan your wedding at {title}</h2>
      <p style={{ fontFamily: FB, fontSize: 14, color: C.textLight, lineHeight: 1.65, maxWidth: 480, margin: '0 auto 32px' }}>
        Our team will be in touch within 24 hours to discuss availability, exclusive packages, and everything your day deserves.
      </p>
      <button
        onClick={onEnquire}
        style={{
          background: C.gold, border: 'none', color: '#0a0a08',
          fontFamily: FB, fontSize: 12, fontWeight: 800,
          letterSpacing: '0.12em', textTransform: 'uppercase',
          padding: '16px 40px', cursor: 'pointer', transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Begin Your Enquiry →
      </button>
      {listing?.price_from && (
        <p style={{ fontFamily: FB, fontSize: 13, color: C.textLight, marginTop: 16 }}>From {listing.price_from}</p>
      )}
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────────
function LoadingSkeleton() {
  return (
    <div style={{ height: '100vh', background: C.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ fontFamily: FB, fontSize: 13, color: C.textLight, letterSpacing: '0.08em' }}>Loading…</p>
    </div>
  );
}

// ── Not found ─────────────────────────────────────────────────────────────────
function NotFound({ slug, onBack }) {
  return (
    <div style={{ height: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <p style={{ fontFamily: FD, fontSize: 28, color: C.text }}>Showcase not found</p>
      <p style={{ fontFamily: FB, fontSize: 13, color: C.textLight }}>No showcase found for <code style={{ color: C.gold }}>{slug}</code></p>
      <button onClick={onBack} style={{ background: 'none', border: `1px solid ${C.border2}`, color: C.textLight, fontFamily: FB, fontSize: 12, padding: '10px 20px', cursor: 'pointer' }}>← Go back</button>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
// Build venue context string from showcase sections for Aura
function buildVenueInfo(sc, lst) {
  const parts = [];
  if (sc?.name || sc?.title)  parts.push(`Venue: ${sc.name || sc.title}`);
  if (sc?.location)            parts.push(`Location: ${sc.location}`);
  if (sc?.excerpt)             parts.push(`About: ${sc.excerpt}`);
  const sections = sc?.published_sections || sc?.sections || [];
  if (Array.isArray(sections)) {
    for (const s of sections) {
      const c = s?.content || {};
      if (s.type === 'hero'    && c.tagline)    parts.push(`Tagline: ${c.tagline}`);
      if (s.type === 'intro'   && c.body)       parts.push(`Description: ${c.body}`);
      if (s.type === 'stats'   && c.items?.length) parts.push(`Key stats: ${c.items.map(i => `${i.value} ${i.label}`).join(', ')}`);
      if (s.type === 'verified') {
        if (c.ceremony_capacity) parts.push(`Ceremony capacity: ${c.ceremony_capacity}`);
        if (c.bedrooms)          parts.push(`Bedrooms: ${c.bedrooms}`);
        if (c.location_summary)  parts.push(`Location detail: ${c.location_summary}`);
        if (c.style)             parts.push(`Style: ${c.style}`);
        if (c.best_for)          parts.push(`Best for: ${c.best_for}`);
      }
      if (s.type === 'pricing' && c.price_from) parts.push(`Venue hire from: ${c.price_from}`);
      if (s.type === 'weddings' && c.body)      parts.push(`Weddings: ${c.body.slice(0, 200)}`);
    }
  }
  if (lst?.description) parts.push(`Full description: ${lst.description.slice(0, 300)}`);
  return parts.join('\n');
}

export default function ShowcasePage({ slug, darkMode, onToggleDark, onBack, onGoDestination, onNavigateStandard, onNavigateAbout }) {
  const isMobile = useIsMobile();
  const [showcase, setShowcase]   = useState(null);
  const [listing, setListing]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [enquireOpen, setEnquireOpen] = useState(false);
  const { setChatContext } = useChat();

  useEffect(() => {
    if (!slug) { setNotFound(true); setLoading(false); return; }
    let ignore = false;

    async function load() {
      setLoading(true);
      try {
        // 1. Load showcase record
        const sc = await fetchShowcaseBySlug(slug);

        if (ignore) return;

        if (sc) {
          setShowcase(sc);
          // 2. Optionally enrich with linked listing (non-fatal — listing may not exist)
          const linkedSlug = sc.listing_id || sc.listingId || null;
          let lst = null;
          try {
            lst = await fetchListingBySlug(linkedSlug || slug);
            if (!ignore && lst) setListing(lst);
          } catch (_) {
            // No listing found — that's fine, showcase renders without it
          }
          // 3. Feed venue data into Aura so it can answer questions about this venue
          if (!ignore) {
            setChatContext({
              page:      'showcase',
              country:   sc.location?.split(',').pop()?.trim() || null,
              region:    sc.location?.split(',')[0]?.trim()    || null,
              venueInfo: buildVenueInfo(sc, lst),
            });
          }
        } else {
          // No showcase record, try listing directly as fallback
          const lst = await fetchListingBySlug(slug);
          if (!ignore) {
            if (lst) {
              // Build a minimal showcase shell from listing data
              setShowcase({
                name: lst.name, slug, location: [lst.city, lst.country].filter(Boolean).join(', '),
                excerpt: lst.short_description || '',
                heroImage: lst.imgs?.[0] || '',
                stats: [
                  lst.price_from         ? { value: lst.price_from,             label: 'From' }        : null,
                  lst.capacity_max        ? { value: `Up to ${lst.capacity_max}`, label: 'Guests' }     : null,
                  lst.rooms_total         ? { value: String(lst.rooms_total),     label: 'Rooms' }       : null,
                ].filter(Boolean),
                sections: ['Hero', 'Gallery', 'Overview', 'Enquire'],
              });
              setListing(lst);
            } else {
              setNotFound(true);
            }
          }
        }
      } catch (err) {
        console.error('[ShowcasePage] load error:', err);
        if (!ignore) setNotFound(true);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => { ignore = true; };
  }, [slug]);

  // Tag tracker events with listing context once data is loaded
  useEffect(() => {
    if (!listing) return;
    setListingContext(listing.id || null, slug, 'venue');
    return () => clearListingContext();
  }, [listing, slug]);

  if (loading)  return <LoadingSkeleton />;
  if (notFound) return <NotFound slug={slug} onBack={onBack} />;

  // ── Dynamic renderer: use published_sections if populated ──────────────────
  const publishedSections = showcase?.published_sections;
  if (Array.isArray(publishedSections) && publishedSections.length > 0) {
    const listingFirstImage = listing?.imgs?.[0] || null;
    return (
      <ShowcaseRenderer
        sections={publishedSections}
        showcase={showcase}
        listing={listing}
        listingFirstImage={listingFirstImage}
        isPreview={false}
        darkMode={darkMode}
        onToggleDark={onToggleDark}
        onNavigateStandard={onNavigateStandard}
        onGoDestination={onGoDestination}
        onBack={onBack}
      />
    );
  }

  // ── Legacy fallback: card-shape sections list ───────────────────────────────
  // Normalise raw DB row into legacy card shape for the fallback renderer
  const showcaseLegacy = showcase?._legacy ? showcase : {
    ...showcase,
    name:      showcase?.title      || showcase?.name      || '',
    heroImage: showcase?.hero_image_url || showcase?.heroImage || '',
    stats:     showcase?.key_stats  || showcase?.stats      || [],
    sections:  showcase?.sections   || ['Hero', 'Gallery', 'Overview', 'Enquire'],
    _legacy:   true,
  };

  const sections = showcaseLegacy.sections || ['Hero', 'Gallery', 'Overview', 'Enquire'];

  const renderSection = (sec) => {
    switch (sec) {
      case 'Hero':
        return <HeroSection key="hero" showcase={showcaseLegacy} listing={listing} onEnquire={() => setEnquireOpen(true)} isMobile={isMobile} />;
      case 'Stats':
        return <StatsSection key="stats" stats={showcaseLegacy?.stats} isMobile={isMobile} />;
      case 'Overview':
        return <OverviewSection key="overview" listing={listing} isMobile={isMobile} />;
      case 'Gallery':
        return listing ? <GallerySection key="gallery" listing={listing} isMobile={isMobile} /> : null;
      case 'Enquire':
        return <EnquireSection key="enquire" showcase={showcaseLegacy} listing={listing} onEnquire={() => setEnquireOpen(true)} isMobile={isMobile} />;
      default:
        // Generic placeholder for sections not yet fully implemented
        return (
          <div key={sec} style={{ padding: isMobile ? '48px 24px' : '64px 64px', borderTop: `1px solid ${C.border}` }}>
            <SectionLabel label={sec} />
          </div>
        );
    }
  };

  // Always inject Stats after Hero if key_stats exist and Stats not in sections list
  const sectionsToRender = [...sections];
  if (showcaseLegacy?.stats?.length > 0 && !sectionsToRender.includes('Stats')) {
    const heroIdx = sectionsToRender.indexOf('Hero');
    if (heroIdx >= 0) sectionsToRender.splice(heroIdx + 1, 0, 'Stats');
  }

  return (
    <div style={{ background: C.bg, minHeight: '100vh', color: C.text }}>
      {/* Nav */}
      <HomeNav
        onNavigateStandard={onNavigateStandard}
        onNavigateAbout={onNavigateAbout}
        hasHero={false}
      />

      {/* Sections */}
      {sectionsToRender.map(sec => renderSection(sec))}

    </div>
  );
}
