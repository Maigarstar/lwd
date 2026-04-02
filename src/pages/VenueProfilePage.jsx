// ─── VenueProfilePage.jsx ─────────────────────────────────────────────────────
// Full venue profile template, ready to be driven by DB data.
// Demo: Grand Tirolia, Kitzbühel, Austria.
//
// TEMPLATE USAGE:
//   Replace the VENUE object at the bottom of this file with DB-fetched data.
//   All section components are driven purely by that data object.
//
// Route:  /venues/grand-tirolia  (add more slugs in main.jsx + pathToState)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useRef } from 'react';
import { fetchVenueContent } from '../services/venueContentService';
import { fetchUpcomingEventsForVenue, fetchPastEventsForVenue, formatEventDate, formatEventTime } from '../services/eventService';

import ParallaxBannerCard      from '../components/cards/editorial/ParallaxBannerCard';
import FeatureCard             from '../components/cards/editorial/FeatureCard';
import ImageOverlayCard        from '../components/cards/editorial/ImageOverlayCard';
import QuoteCard               from '../components/cards/editorial/QuoteCard';
import VenueStatsCard          from '../components/cards/editorial/VenueStatsCard';
import AmenitiesCard           from '../components/cards/editorial/AmenitiesCard';
import TwoColumnEditorialCard  from '../components/cards/editorial/TwoColumnEditorialCard';
import MosaicCard              from '../components/cards/editorial/MosaicCard';
import { CarouselRow }         from '../components/cards/editorial/CarouselCard';
import PhotoGalleryGrid        from '../components/cards/editorial/PhotoGalleryGrid';
import VenueEnquireCard        from '../components/cards/editorial/VenueEnquireCard';
import { useBreakpoint }       from '../hooks/useWindowWidth';

// ── Design tokens ────────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';

// ── Photo map, Grand Tirolia ─────────────────────────────────────────────────
const GT = {
  // Exterior / Aerial
  heroAerial:        '/grand-tirolia/20250820_GTK_DJI_0382-HDR.jpg',
  winterAerial:      '/grand-tirolia/GT_Winter_Exterior_2026.jpg',
  nightExterior:     '/grand-tirolia/GT-Aussenansicht-Winter-097.jpg',
  summerAerial:      '/grand-tirolia/20250819_GTK_DJI_0314.jpg',
  // Spa / Pool
  spaPool:           '/grand-tirolia/GT_Lobby_2023.jpg',
  // Terrace
  champagneTerrace:  '/grand-tirolia/GT-Eichenheim-Terrasse-012.jpg',
  // Ballroom / Events
  atrium:            '/grand-tirolia/Atrium_2024.jpg',
  galaWide1:         '/grand-tirolia/GTK-Gala_A7_00720-min.jpg',
  galaWide2:         '/grand-tirolia/GTK-Gala_A7_00729.jpg',
  galaDetail:        '/grand-tirolia/GTK-Gala_A7_00735.jpg',
  galaDance:         '/grand-tirolia/GTK-Gala_DSC00538.jpg',
  // Dining
  restaurant:        '/grand-tirolia/20250821_GTK_A7_08271.jpg',
  gasthaus:          '/grand-tirolia/GT_Mai23_Gasthaus_239_web.jpg',
  cocktails:         '/grand-tirolia/20250819_GTK_A9_01073.jpg',
  cooperBar:         '/grand-tirolia/Grand_Tirolia_Cooper_Bar.jpg',
  jazzclub:          '/grand-tirolia/GT_Jazzclub_high_169.jpg',
  food1:             '/grand-tirolia/GT_Juli_2023_Restaurant_Food_17.jpg',
  food2:             '/grand-tirolia/GT_Juli_2023_Restaurant_Food_3.jpg',
  food3:             '/grand-tirolia/GrandTirolia_Juni2024_199.jpg',
  food4:             '/grand-tirolia/GrandTirolia_Juni2024_200.jpg',
  food5:             '/grand-tirolia/GrandTirolia_Juni2024_204.jpg',
  // Accommodation
  deluxeRoom:        '/grand-tirolia/GT_Mai23_Zimmer_096_high.jpg',
  deluxeTerrace:     '/grand-tirolia/GrandTirolia_DeluxeZimmer_Balkon_Terrasse.jpg',
  // Golf
  golfIndianSummer:  '/grand-tirolia/GolfEichenheim_IndianSummer.jpg',
  heartGolf:         '/grand-tirolia/Herz_Golfplatz.jpg',
  // Logo
  logo:              '/grand-tirolia/GT_Logo_Positiv_RGB.jpg',
};

// ── Minimal shared colours ───────────────────────────────────────────────────
const C = {
  cream:  '#faf9f6',
  dark:   '#0f0f0d',
  text:   '#1a1a18',
  muted:  '#6b6560',
  border: '#e4e0d8',
  gold:   GOLD,
};

// ─── SectionHeader ────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, light = false, center = false }) {
  const { isMobile } = useBreakpoint();
  const textColor = light ? '#f5f2ec' : C.text;
  const mutedColor = light ? 'rgba(245,242,236,0.55)' : C.muted;
  return (
    <div
      style={{
        maxWidth: 840,
        margin: center ? '0 auto 52px' : `0 0 ${isMobile ? 36 : 52}px`,
        textAlign: center ? 'center' : 'left',
      }}
    >
      {eyebrow && (
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', color: GOLD,
          textTransform: 'uppercase', marginBottom: 12, margin: '0 0 12px',
        }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{
        fontFamily: GD, fontSize: isMobile ? 28 : 40,
        fontWeight: 400, color: textColor,
        margin: '0 0 16px', lineHeight: 1.15,
      }}>
        {title}
      </h2>
      {subtitle && (
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 15 : 17,
          color: mutedColor, margin: 0, lineHeight: 1.75,
          maxWidth: 640,
          marginLeft: center ? 'auto' : 0,
          marginRight: center ? 'auto' : 0,
        }}>
          {subtitle}
        </p>
      )}
      <div style={{
        width: 40, height: 1, background: GOLD,
        marginTop: 24,
        marginLeft: center ? 'auto' : 0,
        marginRight: center ? 'auto' : 0,
      }} />
    </div>
  );
}

// ─── ApprovedBadge ────────────────────────────────────────────────────────────
function ApprovedBadge({ onDarkBg = false }) {
  const bgColor = onDarkBg ? 'rgba(201, 168, 76, 0.15)' : 'rgba(201, 168, 76, 0.08)';
  const borderColor = onDarkBg ? 'rgba(201, 168, 76, 0.4)' : 'rgba(201, 168, 76, 0.2)';
  const textColor = onDarkBg ? '#f5f2ec' : GOLD;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '6px 12px',
        background: bgColor,
        border: `1px solid ${borderColor}`,
        borderRadius: 4,
        fontSize: 12,
        fontFamily: NU,
        color: textColor,
        fontWeight: 500,
        letterSpacing: '0.05em',
        textTransform: 'uppercase',
      }}
    >
      <span>✓</span>
      <span>Approved</span>
    </div>
  );
}

// ─── Utility: Format date to "Month Year" ────────────────────────────────────
function formatMonthYear(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
}

// ─── StickyVenueNav ───────────────────────────────────────────────────────────
function StickyVenueNav({ venue, activeSection, onScrollTo }) {
  const { isMobile } = useBreakpoint();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.7);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const NAV_ITEMS = [
    { id: 'overview',  label: 'Overview' },
    { id: 'spaces',    label: 'Spaces' },
    { id: 'dining',    label: 'Dining' },
    { id: 'rooms',     label: 'Rooms' },
    { id: 'golf',      label: 'Golf' },
    { id: 'weddings',  label: 'Weddings' },
    { id: 'events',    label: 'Events' },
  ];

  // Filter NAV_ITEMS based on section visibility
  const visibleNavItems = NAV_ITEMS.filter(
    item => venue.sectionVisibility?.[item.id] !== false
  );

  return (
    <div
      style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900,
        background: 'rgba(250,249,246,0.97)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
        display: 'flex', alignItems: 'center',
        height: 56,
        padding: isMobile ? '0 16px' : '0 32px',
        gap: isMobile ? 0 : 0,
      }}
    >
      {/* Logo + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 'auto' }}>
        <img src={venue.logo} alt={venue.name} style={{ height: 28, width: 'auto', objectFit: 'contain' }} />
        {!isMobile && (
          <span style={{ fontFamily: GD, fontSize: 15, color: C.text, letterSpacing: '0.01em' }}>
            {venue.name}
          </span>
        )}
      </div>

      {/* Section pills, desktop only */}
      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4 }}>
          {visibleNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => onScrollTo(item.id)}
              style={{
                background: 'none', border: 'none',
                fontFamily: NU, fontSize: 13, fontWeight: activeSection === item.id ? 700 : 500,
                color: activeSection === item.id ? C.text : C.muted,
                cursor: 'pointer', padding: '6px 12px', borderRadius: 4,
                transition: 'color 0.2s',
                borderBottom: activeSection === item.id ? `2px solid ${GOLD}` : '2px solid transparent',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}

      {/* Enquire CTA */}
      <button
        onClick={() => onScrollTo('enquire')}
        style={{
          marginLeft: isMobile ? 'auto' : 20,
          background: GOLD, border: 'none',
          color: '#fff', fontFamily: NU, fontSize: 12,
          fontWeight: 700, letterSpacing: '0.08em',
          textTransform: 'uppercase',
          padding: isMobile ? '8px 16px' : '9px 20px',
          borderRadius: 4, cursor: 'pointer',
          transition: 'opacity 0.2s',
          flexShrink: 0,
        }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >
        Enquire
      </button>
    </div>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────────
function HeroSection({ venue }) {
  const { isMobile } = useBreakpoint();

  return (
    <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 600, background: '#0a0d0a' }}>
      {/* Full-bleed background */}
      <div
        style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${venue.heroImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center 40%',
        }}
      />

      {/* Gradient overlay, bottom heavy */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.08) 50%, rgba(0,0,0,0.72) 100%)',
      }} />

      {/* Content, bottom aligned */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '0 24px 40px' : '0 64px 52px',
      }}>
        {/* Eyebrow */}
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.18em', color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase', marginBottom: 12, margin: '0 0 12px',
        }}>
          {venue.location.region} · {venue.location.country}
        </p>

        {/* Venue name */}
        <h1 style={{
          fontFamily: GD,
          fontSize: isMobile ? 40 : 72,
          fontWeight: 400, color: '#ffffff',
          margin: '0 0 12px', lineHeight: 1.05,
          textShadow: '0 2px 24px rgba(0,0,0,0.4)',
        }}>
          {venue.name}
        </h1>

        {/* Tagline */}
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 15 : 18,
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 32px', maxWidth: 560, lineHeight: 1.6,
        }}>
          {venue.heroSummary || "Europe's most celebrated Alpine wedding estate, where the mountains are not a backdrop, they are part of the ceremony."}
        </p>

        {/* ── Approval & Last Updated Display ────────────────────────────── */}
        {venue.approved && (
          <div style={{ marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <ApprovedBadge onDarkBg={true} />
            {venue.lastUpdatedAt && (
              <p style={{
                fontFamily: NU, fontSize: 12,
                color: 'rgba(255,255,255,0.5)',
                margin: 0,
                letterSpacing: '0.02em',
              }}>
                Last updated: {formatMonthYear(venue.lastUpdatedAt)}
              </p>
            )}
          </div>
        )}

        {/* Quick stats row */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: isMobile ? 16 : 32,
          alignItems: 'center',
        }}>
          {venue.heroStats.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{
                fontFamily: GD, fontSize: isMobile ? 20 : 24,
                color: '#fff', lineHeight: 1,
              }}>{s.value}</span>
              <span style={{
                fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.6)',
                textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3,
              }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{
        position: 'absolute', bottom: isMobile ? 40 : 48, right: isMobile ? 24 : 64,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.4)' }} />
        <span style={{
          fontFamily: NU, fontSize: 10, letterSpacing: '0.12em',
          color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase',
          writingMode: 'vertical-lr',
        }}>
          Scroll
        </span>
      </div>
    </section>
  );
}

// ─── FullBleedSection wrapper ─────────────────────────────────────────────────
function Section({ id, bg = C.cream, children, pad }) {
  const { isMobile } = useBreakpoint();
  const defaultPad = isMobile ? '64px 24px' : '96px 64px';
  return (
    <section id={id} style={{ background: bg, padding: pad || defaultPad }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {children}
      </div>
    </section>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function VenueProfilePage({ venue: venueProp, onBack }) {
  const { isMobile } = useBreakpoint();
  const [activeSection, setActiveSection] = useState('overview');
  const [venueContent, setVenueContent] = useState(null);
  const [venueEvents, setVenueEvents]     = useState([]);
  const [pastEvents,  setPastEvents]      = useState([]);
  const basevenue = venueProp || GT_VENUE;

  // Merge static venue with dynamic content
  const venue = venueContent
    ? {
        ...basevenue,
        heroSummary: venueContent.heroSummary || basevenue.heroSummary,
        sectionIntros: { ...basevenue.sectionIntros, ...venueContent.sectionIntros },
        sectionVisibility: { ...basevenue.sectionVisibility, ...venueContent.sectionVisibility },
        factChecked: venueContent.factChecked,
        approved: venueContent.approved,
        lastReviewedAt: venueContent.lastReviewedAt,
      }
    : basevenue;

  // Fetch venue content from database on mount
  useEffect(() => {
    const loadVenueContent = async () => {
      try {
        // Use listingId from venue data if available
        const venueId = basevenue.listingId || basevenue.id;
        if (venueId) {
          const content = await fetchVenueContent(venueId);
          if (content && !content._offline) {
            setVenueContent(content);
          }
        }
      } catch (err) {
        console.error('Failed to load venue content:', err);
        // Gracefully fall back to static data
      }
    };
    loadVenueContent();
  }, [basevenue]);

  // Fetch upcoming + past events for this venue
  useEffect(() => {
    const venueId = basevenue.listingId || basevenue.id;
    if (!venueId) return;
    fetchUpcomingEventsForVenue(venueId, 6).then(evts => {
      if (evts?.length) setVenueEvents(evts);
    }).catch(() => {});
    fetchPastEventsForVenue(venueId, 6).then(evts => {
      if (evts?.length) setPastEvents(evts);
    }).catch(() => {});
  }, [basevenue.listingId, basevenue.id]);

  // ── Section scroll spy ────────────────────────────────────────────────────
  useEffect(() => {
    const sections = ['overview', 'spaces', 'dining', 'rooms', 'golf', 'weddings', 'events', 'enquire'];
    const onScroll = () => {
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && window.scrollY >= el.offsetTop - 100) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ background: C.cream, fontFamily: NU }}>

      {/* ── Sticky nav ──────────────────────────────────────────────────── */}
      <StickyVenueNav venue={venue} activeSection={activeSection} onScrollTo={scrollTo} />

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <HeroSection venue={venue} />

      {/* ── Gallery grid (below hero) ────────────────────────────────────── */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '28px 64px' }}>
          <PhotoGalleryGrid data={{
            images: venue.galleryImages,
            totalCount: venue.totalPhotoCount,
          }} />
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1, OVERVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.overview !== false && (
      <Section id="overview" bg={C.cream}>
        <SectionHeader
          eyebrow={`${venue.location.town} · ${venue.location.country}`}
          title={venue.overview.headline}
          subtitle={venue.sectionIntros?.overview || venue.overview.intro}
        />
        <VenueStatsCard data={{
          variant: 'strip',
          accentBg: '#ffffff',
          theme: 'light',
          stats: venue.keyStats,
        }} />
        <div style={{ marginTop: 40 }}>
          <TwoColumnEditorialCard data={{
            variant: 'default',
            accentBg: C.cream,
            theme: 'light',
            eyebrow: 'The Grand Tirolia Story',
            title: venue.overview.secondaryHeadline,
            body: venue.overview.body,
            cta: { label: 'Explore the Estate →', href: '#spaces' },
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2, WEDDING SPACES
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.spaces !== false && (
      <Section id="spaces" bg="#fff">
        <SectionHeader
          eyebrow="Event Spaces"
          title="Five Spaces. One Seamless Vision."
          subtitle={venue.sectionIntros?.spaces || "From intimate ceremonies for twenty to grand receptions for four hundred and fifty, every space at Grand Tirolia has been designed with weddings in mind."}
        />

        {/* Grand Atrium */}
        <div style={{ marginBottom: 4 }}>
          <ImageOverlayCard data={{
            image: venue.spaces.atrium.image,
            theme: 'dark',
            category: 'Event Spaces · Up to 450 guests',
            title: venue.spaces.atrium.name,
            excerpt: venue.spaces.atrium.description,
            variant: 'floating-box',
          }} />
        </div>

        {/* Ballroom Feature */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image: venue.spaces.ballroom.image,
            variant: 'image-left',
            accentBg: '#1a1a18',
            theme: 'dark',
            category: 'The Grand Ballroom · 280 guests',
            title: venue.spaces.ballroom.name,
            excerpt: venue.spaces.ballroom.description,
          }} />
        </div>

        {/* Wedding dance full-bleed photo */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 320 : 440, overflow: 'hidden' }}>
          <img
            src={venue.spaces.weddingDance}
            alt="Wedding reception at Grand Tirolia"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 30%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '20px 24px' : '28px 48px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
          }}>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 22 : 28, color: '#fff', margin: 0, fontWeight: 400, fontStyle: 'italic' }}>
              "Every detail of your wedding day, executed without compromise."
            </p>
          </div>
        </div>

        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: '#1a1a18',
            theme: 'dark',
            quote: 'Five distinct event spaces. Zero compromises. Your wedding, exactly as you envisioned it.',
            attribution: 'Grand Tirolia Wedding Team',
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3, DINING
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.dining !== false && (
      <Section id="dining" bg={C.cream}>
        <SectionHeader
          eyebrow="Culinary"
          title="Five Dining Concepts. One Alpine Philosophy."
          subtitle={venue.sectionIntros?.dining || "From Restaurant Tirolia to The Golden jazz bar, every dining space at Grand Tirolia has been conceived to complement the occasion, including yours."}
        />

        <TwoColumnEditorialCard data={{
          variant: 'with-pullstat',
          accentBg: '#ffffff',
          theme: 'light',
          eyebrow: 'Dining & Catering',
          title: venue.dining.headline,
          body: venue.dining.intro,
          pullStat: { value: '5', label: 'dining concepts' },
          cta: { label: 'View dining →', href: '#enquire' },
        }} />

        {/* Gasthaus */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image: venue.dining.gasthaus.image,
            variant: 'image-left',
            accentBg: '#f5f2ec',
            theme: 'light',
            category: 'Fine Dining',
            title: venue.dining.gasthaus.name,
            excerpt: venue.dining.gasthaus.description,
          }} />
        </div>

        {/* Cooper Bar */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image: venue.dining.cooperBar.image,
            variant: 'image-right',
            accentBg: '#1a1a18',
            theme: 'dark',
            category: 'Signature Bar',
            title: venue.dining.cooperBar.name,
            excerpt: venue.dining.cooperBar.description,
          }} />
        </div>

        {/* Jazzclub */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image: venue.dining.jazzclub.image,
            variant: 'image-left',
            accentBg: '#2a2420',
            theme: 'dark',
            category: 'Late Night',
            title: venue.dining.jazzclub.name,
            excerpt: venue.dining.jazzclub.description,
          }} />
        </div>

        {/* Food Mosaic */}
        <div style={{ marginTop: 4 }}>
          <MosaicCard data={{
            images: venue.dining.foodMosaic,
            theme: 'light',
            title: 'Cuisine by Season',
            excerpt: 'Every dish on the wedding menu is crafted using Austrian mountain produce and reflects the season in which you celebrate.',
            height: isMobile ? 300 : 440,
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4, ACCOMMODATION
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.rooms !== false && (
      <Section id="rooms" bg="#fff">
        <SectionHeader
          eyebrow="Accommodation"
          title="98 Rooms with Views You Will Not Forget"
          subtitle={venue.sectionIntros?.rooms || "Every room at Grand Tirolia opens to the mountains. Wood-clad walls, Alpine textiles, and private balconies overlooking Kitzbühel, for you and every one of your guests."}
        />

        <TwoColumnEditorialCard data={{
          variant: 'default',
          accentBg: '#ffffff',
          theme: 'light',
          eyebrow: 'Accommodation',
          title: venue.accommodation.headline,
          body: venue.accommodation.body,
        }} />

        {/* Rooms carousel */}
        <div style={{ marginTop: 40 }}>
          <CarouselRow
            items={venue.accommodation.roomCards}
            accentBg="#ffffff"
            theme="light"
            label="Rooms & Suites"
            cardWidth={280}
          />
        </div>

        {/* Room stats */}
        <div style={{ marginTop: 40 }}>
          <VenueStatsCard data={{
            variant: 'strip',
            accentBg: C.cream,
            theme: 'light',
            stats: venue.accommodation.stats,
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5, SPA & WELLNESS
      ═══════════════════════════════════════════════════════════════════ */}
      <ParallaxBannerCard data={{
        image: venue.spa.heroImage,
        variant: 'bottom-text',
        overlay: 'medium',
        eyebrow: 'Spa & Wellness',
        title: venue.spa.headline,
        subtitle: venue.spa.subline,
        height: isMobile ? '55vh' : '68vh',
      }} />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6, GOLF
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.golf !== false && (
      <Section id="golf" bg={C.cream}>
        <SectionHeader
          eyebrow="Golf Eichenheim"
          title="Eighteen Holes Against the Wilder Kaiser"
          subtitle={venue.sectionIntros?.golf || "The championship course at Eichenheim is consistently rated among Austria's finest. When your guests are not celebrating, they are playing."}
        />

        <TwoColumnEditorialCard data={{
          variant: 'with-pullstat',
          accentBg: '#ffffff',
          theme: 'light',
          eyebrow: 'Golf Eichenheim · Kitzbühel',
          title: venue.golf.headline,
          body: venue.golf.body,
          pullStat: { value: '18', label: 'championship holes' },
          cta: { label: 'Golf & activities →', href: '#enquire' },
        }} />

        <div style={{ marginTop: 40 }}>
          <ParallaxBannerCard data={{
            image: venue.golf.courseImage,
            variant: 'centered',
            overlay: 'light',
            eyebrow: 'Golf Eichenheim',
            title: 'The Most Scenic Fairways in the Alps',
            height: isMobile ? '50vh' : '64vh',
          }} />
        </div>

        {/* Champagne terrace */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image: venue.golf.terraceImage,
            variant: 'image-right',
            accentBg: '#ffffff',
            theme: 'light',
            category: 'Eichenheim Terrace',
            title: 'Apres-round, Alpine style.',
            excerpt: 'Laurent-Perrier champagne, mountain panoramas, and a terrace that turns a round of golf into an event in itself. Available for private hire as part of your wedding weekend package.',
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 7, YOUR WEDDING DAY
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.weddings !== false && (
      <Section id="weddings" bg="#1a1a18">
        <SectionHeader
          eyebrow="Weddings at Grand Tirolia"
          title="There Is No Wedding Here That Looks Like Any Other."
          subtitle={venue.sectionIntros?.weddings || "Every wedding at Grand Tirolia begins with a conversation. Your story, your guests, your vision, translated into an experience that is entirely your own."}
          light
        />

        <ImageOverlayCard data={{
          image: venue.weddings.danceImage,
          theme: 'dark',
          category: 'Your Wedding Day',
          title: 'The moment everything comes together.',
          excerpt: 'Your band is playing. The dance floor is full. And every one of the four hundred and fifty people you love most is in the same room.',
        }} />

        <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
          <FeatureCard data={{
            image: venue.weddings.tableImage,
            variant: 'image-left',
            accentBg: '#2a2420',
            theme: 'dark',
            category: 'Table Settings',
            title: 'Every table tells a story.',
            excerpt: 'Our in-house floral and styling team works with each couple to create a table design that is entirely unique. From wildflower centrepieces to hand-painted menus, every detail is considered.',
          }} />
          <div style={{ background: '#111', overflow: 'hidden' }}>
            <img
              src={venue.weddings.heartImage}
              alt="Love sculpture on the Eichenheim golf course"
              style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: 300, display: 'block' }}
            />
          </div>
        </div>

        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: '#0f0f0d',
            theme: 'dark',
            quote: '"We have hosted over three hundred weddings. Not one has looked the same."',
            attribution: 'Alexandra Hinterholzer',
            attributionRole: 'Wedding Director, Grand Tirolia',
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          AMENITIES
      ═══════════════════════════════════════════════════════════════════ */}
      <Section bg={C.cream}>
        <SectionHeader
          eyebrow="Everything Included"
          title="Every Amenity. Every Occasion."
          subtitle="Grand Tirolia is a complete ecosystem, from helipad arrivals to post-wedding ski days. Every amenity your wedding guests could need is already here."
        />
        <AmenitiesCard data={{
          accentBg: '#ffffff',
          theme: 'light',
          cols: 6,
          amenities: venue.amenities,
        }} />
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION — UPCOMING EVENTS
      ═══════════════════════════════════════════════════════════════════ */}
      {venueEvents.length > 0 && venue.sectionVisibility?.events !== false && (
      <Section id="events" bg="#111">
        <SectionHeader
          eyebrow="Open Days & Events"
          title="Join Us in Person"
          subtitle={`Experience ${venue.name} first-hand. Register for an upcoming open day, private tour, or virtual showcase.`}
          light
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {venueEvents.map(ev => {
            const dateStr = formatEventDate(ev.startDate);
            const timeStr = ev.startTime ? formatEventTime(ev.startTime) : null;
            return (
              <a
                key={ev.id}
                href={`/events/${ev.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: 4,
                  overflow: 'hidden', transition: 'border-color 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                  onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a28'}
                >
                  {ev.coverImageUrl && (
                    <div style={{ height: 160, overflow: 'hidden' }}>
                      <img src={ev.coverImageUrl} alt={ev.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                  )}
                  <div style={{ padding: '18px 20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{
                        fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                      }}>
                        {ev.eventType?.replace(/_/g, ' ') || 'Event'}
                      </div>
                      {ev.isVirtual && (
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Virtual</div>
                      )}
                    </div>
                    <div style={{ fontFamily: GD, fontSize: 18, color: '#f0ece4', fontWeight: 400, marginBottom: 6, lineHeight: 1.3 }}>
                      {ev.title}
                    </div>
                    {ev.subtitle && (
                      <div style={{ fontFamily: NU, fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>{ev.subtitle}</div>
                    )}
                    <div style={{ fontFamily: NU, fontSize: 11, color: '#666', marginTop: 12 }}>
                      {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                    </div>
                    {ev.locationName && !ev.isVirtual && (
                      <div style={{ fontFamily: NU, fontSize: 11, color: '#555', marginTop: 3 }}>{ev.locationName}</div>
                    )}
                    <div style={{
                      marginTop: 16, display: 'inline-block',
                      fontFamily: NU, fontSize: 11, color: GOLD, letterSpacing: '0.1em',
                      textTransform: 'uppercase', borderBottom: `1px solid ${GOLD}`, paddingBottom: 1,
                    }}>
                      Register →
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          PAST EVENTS
      ═══════════════════════════════════════════════════════════════════ */}
      {pastEvents.length > 0 && (
      <Section id="past-events" bg="#0c0c0a">
        <SectionHeader
          eyebrow="Recent Events"
          title={`Past Events at ${venue.name}`}
          subtitle="A record of events hosted at this venue. View event details or send an enquiry for future availability."
          light
        />
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 16,
        }}>
          {pastEvents.map(ev => {
            const dateStr = formatEventDate(ev.startDate);
            return (
              <a
                key={ev.id}
                href={`/events/${ev.slug}`}
                style={{ textDecoration: 'none', display: 'block' }}
              >
                <div style={{
                  background: '#141412', border: '1px solid #222220', borderRadius: 4,
                  overflow: 'hidden', transition: 'border-color 0.2s', opacity: 0.85,
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = '#444'; e.currentTarget.style.opacity = '1'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = '#222220'; e.currentTarget.style.opacity = '0.85'; }}
                >
                  {ev.coverImageUrl && (
                    <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                      <img src={ev.coverImageUrl} alt={ev.title}
                        style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'grayscale(30%)' }} />
                      {/* Past overlay */}
                      <div style={{
                        position: 'absolute', top: 10, right: 10,
                        fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700,
                        letterSpacing: '0.12em', textTransform: 'uppercase',
                        color: 'rgba(255,255,255,0.6)', background: 'rgba(0,0,0,0.55)',
                        padding: '3px 8px', borderRadius: 2,
                        border: '1px solid rgba(255,255,255,0.15)',
                      }}>Completed</div>
                    </div>
                  )}
                  {!ev.coverImageUrl && (
                    <div style={{ height: 56, background: '#1a1a18', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                      <span style={{ fontFamily: 'var(--font-body)', fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>Completed</span>
                    </div>
                  )}
                  <div style={{ padding: '16px 20px' }}>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>
                      {ev.eventType?.replace(/_/g, ' ') || 'Event'}
                    </div>
                    <div style={{ fontFamily: 'var(--font-heading-primary)', fontSize: 17, color: 'rgba(240,236,228,0.75)', fontWeight: 400, marginBottom: 6, lineHeight: 1.3 }}>
                      {ev.title}
                    </div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginTop: 10 }}>
                      {dateStr}
                      {ev.bookingCount > 0 && (
                        <span style={{ marginLeft: 8, color: 'rgba(201,168,76,0.5)' }}>
                          · {ev.bookingCount} attended
                        </span>
                      )}
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{
                        fontFamily: 'var(--font-body)', fontSize: 10, color: 'rgba(255,255,255,0.35)',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        borderBottom: '1px solid rgba(255,255,255,0.15)', paddingBottom: 1,
                      }}>
                        View Event →
                      </div>
                      {/* Gallery hint — only if event has images */}
                      {ev.galleryUrls?.length > 0 && (
                        <div style={{
                          fontFamily: 'var(--font-body)', fontSize: 10,
                          color: `rgba(201,168,76,0.5)`,
                          letterSpacing: '0.08em', textTransform: 'uppercase',
                          display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                          <span style={{ fontSize: 11 }}>◻</span> View highlights
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          ENQUIRE
      ═══════════════════════════════════════════════════════════════════ */}
      <VenueEnquireCard data={{
        background: venue.enquire.background,
        headline: `Begin Planning Your Wedding at ${venue.name}`,
        subline: `Our dedicated wedding team at ${venue.location.town} will respond within 24 hours.`,
        venueName: venue.name,
        accentColor: GOLD,
      }} />

    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// VENUE DATA, Grand Tirolia
// TEMPLATE: Replace this object with your DB fetch / CMS data.
// ═══════════════════════════════════════════════════════════════════════════════
export const GT_VENUE = {
  // Identity
  name:     'Grand Tirolia',
  slug:     'grand-tirolia',
  logo:     GT.logo,
  location: {
    town:    'Kitzbühel',
    region:  'Tyrol',
    country: 'Austria',
    flag:    '🇦🇹',
  },
  heroSummary: "Europe's most celebrated Alpine wedding estate, where the mountains are not a backdrop, they are part of the ceremony.",

  // Hero
  heroImage: GT.heroAerial,
  heroStats: [
    { value: '1895', label: 'Est.' },
    { value: '450',  label: 'Max guests' },
    { value: '5',    label: 'Event spaces' },
    { value: '18 holes', label: 'Golf' },
  ],

  // Gallery grid (5 images)
  galleryImages: [
    { src: GT.galaWide1,       alt: 'Grand Ballroom at Grand Tirolia, Kitzbühel' },
    { src: GT.nightExterior,   alt: 'Grand Tirolia at dusk, Kitzbühel' },
    { src: GT.spaPool,         alt: 'Outdoor spa pool with mountain views' },
    { src: GT.deluxeRoom,      alt: 'Deluxe Alpine room with balcony' },
    { src: GT.golfIndianSummer, alt: 'Eichenheim golf course in autumn' },
  ],
  totalPhotoCount: 22,

  // Overview section
  overview: {
    headline:          'Where the Alps Define Everything',
    intro:             'Perched above Kitzbühel at an elevation of 800 metres, Grand Tirolia has been the benchmark for Alpine luxury since 1895. With five dedicated wedding spaces, a two-Michelin-starred kitchen, and an 18-hole championship golf course, it offers something no other estate in Europe can replicate, a complete world unto itself.',
    secondaryHeadline: 'One hundred and thirty years of alpine hospitality.',
    body: [
      'Grand Tirolia began as a hunting lodge for a Tyrolean aristocrat who understood that the most important thing a host can do is make their guests feel that no detail was left to chance. That philosophy has informed every renovation, every appointment, and every hire since.',
      'Today, the estate comprises 98 rooms and suites, five event spaces, five dining concepts, a championship golf course, and a spa that regularly tops the European wellness rankings. But the soul of the place is unchanged: a genuine commitment to making every guest feel, above all else, extraordinary.',
    ],
  },

  // Key stats strip
  keyStats: [
    { value: '1895',     label: 'Founded',          sublabel: 'Est. Kitzbühel' },
    { value: '98',       label: 'Rooms & Suites',    sublabel: 'inc. 12 suites' },
    { value: '450',      label: 'Max. Capacity',     sublabel: 'Grand Atrium' },
    { value: '5',        label: 'Event Spaces',      sublabel: 'ceremony to gala' },
    { value: '3,000 m²', label: 'Spa & Wellness',    sublabel: 'Grand Alps Spa' },
    { value: '800m',     label: 'Altitude',          sublabel: 'above sea level' },
  ],

  // Wedding spaces
  spaces: {
    atrium: {
      name:        'The Grand Atrium',
      image:        GT.atrium,
      description:  'The centrepiece of Grand Tirolia, a fully customisable event hall with a curved 18-metre LED wall, integrated state-of-the-art sound, and a stage built for performances of any scale. Up to 450 guests for a seated dinner.',
      stats: [
        { value: '450', label: 'Seated capacity' },
        { value: '18m',  label: 'LED installation' },
      ],
    },
    ballroom: {
      name:        'The Grand Ballroom',
      image:        GT.galaWide2,
      description:  'The Ballroom seats 280 guests beneath original Tyrolean plasterwork and cascading crystal chandeliers. Ghost chairs, bespoke linen, and candlelit tables, the room transforms entirely to match your vision. Perfect for black-tie receptions, dinner dances, and intimate civil ceremonies.',
      stats: [
        { value: '280', label: 'Seated capacity' },
        { value: 'C & D', label: 'Ceremony & Dinner' },
      ],
    },
    weddingDance: GT.galaDance,
  },

  // Dining
  dining: {
    headline: 'Alpine gastronomy at its most refined.',
    intro:    "Grand Tirolia's culinary team brings together five distinct dining concepts, from the precision of Restaurant Tirolia to the informal warmth of Gasthaus Eichenheim and the late-night energy of The Golden. Every wedding menu is designed exclusively for your day.",
    gasthaus: {
      name:        'Gasthaus Eichenheim',
      image:        GT.gasthaus,
      description:  'Rustic Alpine interiors, long communal tables, and a menu rooted in Tyrolean farmhouse cooking elevated to something memorable. Gasthaus Eichenheim is where your guests gather the morning after the reception, for schnapps, for eggs, for stories.',
    },
    cooperBar: {
      name:        'The Cooper Bar',
      image:        GT.cooperBar,
      description:  "Stone walls, arched brass mirrors, green leather banquettes, the Cooper Bar is Grand Tirolia's most unexpected room. Signature cocktails, natural wines, and the best whisky list in Kitzbühel. Available for private hire as part of your wedding evening.",
    },
    jazzclub: {
      name:        'The Golden',
      image:        GT.jazzclub,
      description:  'Tufted velvet sofas. Shelves of rare single malts. A curved bar hand-finished in Austrian pine, The Golden is Grand Tirolia\'s jazz club and cocktail bar. Live acts every weekend, and available for an intimate late-night wedding reception.',
    },
    foodMosaic: [GT.food1, GT.food2, GT.food3, GT.food4],
  },

  // Accommodation
  accommodation: {
    headline: 'The mountains, from your private balcony.',
    body:     'From the 52 m² Deluxe Alpine Room to the 320 m² Grand Tirolia Suite with its private sauna and fireplace, every one of our 98 rooms has been designed to put the landscape first. Wood-panelled walls, hand-woven Alpine textiles, and private balconies overlooking the Kitzbüheler Horn mean your guests wake up already in the Alps.',
    roomCards: [
      { image: GT.deluxeRoom,    title: 'Deluxe Alpine Room',     brand: '52 m² · Alpine view · Balcony with loungers' },
      { image: GT.deluxeTerrace, title: 'Junior Suite',           brand: '64 m² · Separate living area · Balcony' },
      { image: GT.nightExterior, title: 'Superior Suite',         brand: '76–88 m² · Panoramic mountain terrace' },
      { image: GT.winterAerial,  title: 'Grand Tirolia Suite',    brand: '320 m² · Private sauna · Fireplace · Loggia' },
    ],
    stats: [
      { value: '98',   label: 'Total Rooms',     sublabel: '& suites' },
      { value: '12',   label: 'Suites',          sublabel: 'with living room' },
      { value: '100%', label: 'Mountain Views',  sublabel: 'all rooms' },
      { value: '800m', label: 'Altitude',        sublabel: 'above Kitzbühel' },
    ],
  },

  // Spa
  spa: {
    heroImage:  GT.spaPool,
    headline:   'Steam Rising. Mountains Surrounding.',
    subline:    'The Grand Alps Spa spans over 3,000 m² of wellness, thermal pools, saunas, and relaxation suites overlooking the Alps. One of the few places where a wedding morning feels truly unhurried.',
  },

  // Golf
  golf: {
    headline:    'Where weddings and fairways share the same view.',
    body:        'Golf Eichenheim was first laid out in the shadow of the Wilder Kaiser in 1965 and has been refined every decade since. Eighteen holes. Uninterrupted mountain panoramas. An optional addition to any wedding weekend package, for guests who prefer their morning with a five-iron.',
    courseImage:  GT.golfIndianSummer,
    terraceImage: GT.champagneTerrace,
  },

  // Weddings
  weddings: {
    danceImage: GT.galaDance,
    tableImage: GT.galaDetail,
    heartImage: GT.heartGolf,
  },

  // Amenities
  amenities: [
    { icon: 'ballroom',   label: 'Grand Atrium',       sublabel: '450 guests' },
    { icon: 'spa',        label: 'Grand Alps Spa',     sublabel: '3,000 m² wellness' },
    { icon: 'golf',       label: 'Golf Eichenheim',    sublabel: '18 holes' },
    { icon: 'ski',        label: 'Ski-in / Ski-out',   sublabel: 'direct access' },
    { icon: 'pool',       label: 'Outdoor Pool',       sublabel: 'heated, year-round' },
    { icon: 'restaurant', label: 'Fine Dining',         sublabel: 'Restaurant Tirolia' },
    { icon: 'bar',        label: 'Cooper Bar',         sublabel: 'signature cocktails' },
    { icon: 'music',      label: 'The Golden',         sublabel: 'jazz bar · live acts' },
    { icon: 'suite',      label: '98 Rooms',           sublabel: 'inc. 12 suites' },
    { icon: 'mountain',   label: 'Alpine Views',       sublabel: 'all rooms' },
    { icon: 'helipad',    label: 'Helipad',            sublabel: 'private arrivals' },
    { icon: 'terrace',    label: 'Eichenheim Terrace', sublabel: 'private hire' },
    { icon: 'gym',        label: 'Fitness Centre',     sublabel: '24-hour access' },
    { icon: 'tennis',     label: 'Tennis Courts',      sublabel: '3 courts' },
    { icon: 'cinema',     label: 'Kino Tirolia',       sublabel: 'private cinema' },
    { icon: 'wine',       label: 'Wine Cellar',        sublabel: 'private tastings' },
    { icon: 'yoga',       label: 'Wellness Classes',   sublabel: 'daily schedule' },
    { icon: 'lake',       label: 'Black See Lake',     sublabel: '15 min transfer' },
  ],

  // Dynamic section intro text (fallback to hardcoded defaults if missing)
  sectionIntros: {
    overview: 'Perched above Kitzbühel at an elevation of 800 metres, Grand Tirolia has been the benchmark for Alpine luxury since 1895. With five dedicated wedding spaces, a two-Michelin-starred kitchen, and an 18-hole championship golf course, it offers something no other estate in Europe can replicate, a complete world unto itself.',
    spaces: 'From the Grand Atrium with its 18-metre LED wall to intimate ceremony lawns overlooking the Kitzbüheler Horn, each of Grand Tirolia\'s five event spaces is purpose-built for moments that demand perfection.',
    dining: "Grand Tirolia's culinary team brings together five distinct dining concepts, from the precision of Restaurant Tirolia to the informal warmth of Gasthaus Eichenheim and the late-night energy of The Golden. Every wedding menu is designed exclusively for your day.",
    rooms: 'From the 52 m² Deluxe Alpine Room to the 320 m² Grand Tirolia Suite with its private sauna and fireplace, every one of our 98 rooms has been designed to put the landscape first. Wood-panelled walls, hand-woven Alpine textiles, and private balconies overlooking the Kitzbüheler Horn mean your guests wake up already in the Alps.',
    golf: 'Golf Eichenheim was first laid out in the shadow of the Wilder Kaiser in 1965 and has been refined every decade since. Eighteen holes. Uninterrupted mountain panoramas. An optional addition to any wedding weekend package, for guests who prefer their morning with a five-iron.',
    weddings: 'Five event spaces. Two Michelin stars. An 18-hole championship golf course. 450-guest capacity. Grand Tirolia is not a venue that needs to compromise on any front, because it doesn\'t have to. Your wedding, at elevation, surrounded by mountains that have watched Alpine celebrations for centuries.',
  },

  // Dynamic section visibility (control which sections are shown)
  sectionVisibility: {
    overview: true,
    spaces: true,
    dining: true,
    rooms: true,
    golf: true,
    weddings: true,
  },

  // Approval & content freshness (internal metadata)
  factChecked: false,
  approved: false,
  lastReviewedAt: null,
  lastUpdatedAt: null,
  refreshStatus: 'current',
  refreshNotes: '',

  // Enquire
  enquire: {
    background: GT.heartGolf,
  },
};
