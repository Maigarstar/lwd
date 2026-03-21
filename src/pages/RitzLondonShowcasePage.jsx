// ─── RitzLondonShowcasePage.jsx ──────────────────────────────────────────────
// Showcase page — The Ritz London
// 150 Piccadilly · Mayfair · London · Est. 1906
// Route: /showcase/the-ritz-london
// Layout: mirrors SixSensesShowcasePage.jsx exactly
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

import FeatureCard            from '../components/cards/editorial/FeatureCard';
import QuoteCard              from '../components/cards/editorial/QuoteCard';
import VenueStatsCard         from '../components/cards/editorial/VenueStatsCard';
import TwoColumnEditorialCard from '../components/cards/editorial/TwoColumnEditorialCard';
import MosaicCard             from '../components/cards/editorial/MosaicCard';
import { CarouselRow }        from '../components/cards/editorial/CarouselCard';
import VenueEnquireCard       from '../components/cards/editorial/VenueEnquireCard';
import HomeNav                from '../components/nav/HomeNav';
import { useBreakpoint }      from '../hooks/useWindowWidth';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C4A35A';      // Ritz warm gold

const C = {
  cream:  '#faf9f6',
  ivory:  '#f5f0e8',
  white:  '#ffffff',
  dark:   '#0f0e0c',
  text:   '#1a1410',
  muted:  '#6b6258',
  border: '#e8e2d8',
  gold:   GOLD,
  navy:   '#1C1828',         // Ritz deep navy — replaces Six Senses jungle/ocean
  navyDark: '#130f1e',       // deeper navy for contrast sections
};

// ── Image helpers ─────────────────────────────────────────────────────────────
// Images from the LWD 5-star directory listing for The Ritz London
const S5 = (id) => `https://5starweddingdirectory.com/custom/domain_1/image_files/${id}`;
// Images from The Ritz London's own website
const TR = (path) => `https://www.theritzlondon.com/content/uploads/${path}`;

// ── Venue data ─────────────────────────────────────────────────────────────────
const RITZ_VENUE = {
  name:     'The Ritz London',
  brand:    '150 Piccadilly · Est. 1906',
  tagline:  'Since 1906, the pinnacle of London luxury — where impeccable service, legendary afternoon tea and two Michelin stars define the art of the extraordinary.',
  location: {
    town:    '150 Piccadilly',
    region:  'Mayfair',
    country: 'London',
    address: '150 Piccadilly, London W1J 9BR',
  },
  priceFrom: 'POA',

  heroImage: S5('sitemgr_photo_21069.jpg'),  // main listing image — Long Gallery

  heroStats: [
    { value: '136',      label: 'Rooms & Suites' },
    { value: 'Since 1906', label: 'Est. Piccadilly' },
    { value: '★★',       label: 'Michelin Stars' },
    { value: 'Royal',    label: 'Warrant' },
  ],

  galleryImages: [
    { src: S5('sitemgr_photo_21069.jpg'),  alt: 'The Long Gallery at The Ritz London' },
    { src: S5('sitemgr_photo_21068.jpg'),  alt: 'Grand staircase at The Ritz London' },
    { src: S5('sitemgr_photo_21059.jpg'),  alt: 'The Ritz London — interior' },
    { src: S5('sitemgr_photo_21070.jpg'),  alt: 'The Ritz London — suite' },
    { src: S5('sitemgr_photo_21071.jpg'),  alt: 'The Ritz London — detail' },
    { src: S5('sitemgr_photo_9418.jpg'),   alt: 'The Ritz London — gallery' },
    { src: S5('sitemgr_photo_9420.jpg'),   alt: 'The Ritz London — rooms' },
    { src: S5('sitemgr_photo_9421.jpg'),   alt: 'The Ritz London — dining' },
    { src: S5('sitemgr_photo_9422.jpg'),   alt: 'The Ritz London — celebration' },
    { src: S5('sitemgr_photo_9423.jpg'),   alt: 'The Ritz London — wedding' },
    { src: S5('sitemgr_photo_9424.jpg'),   alt: 'The Ritz London — ceremony' },
    { src: S5('sitemgr_photo_9425.jpg'),   alt: 'The Ritz London — reception' },
    { src: S5('sitemgr_photo_9426.jpg'),   alt: 'The Ritz London — floral' },
    { src: S5('sitemgr_photo_9427.jpg'),   alt: 'The Ritz London — terrace' },
    { src: S5('sitemgr_photo_999.jpg'),    alt: 'The Ritz London — exterior' },
    { src: S5('sitemgr_photo_6651.jpg'),   alt: 'The Ritz London — Palm Court' },
    { src: S5('sitemgr_photo_7662.jpg'),   alt: 'The Ritz London — afternoon tea' },
    { src: S5('sitemgr_photo_1282.jpg'),   alt: 'The Ritz London — ballroom' },
    { src: S5('sitemgr_photo_13861.jpg'),  alt: 'The Ritz London — detail' },
    { src: S5('sitemgr_photo_14891.jpg'),  alt: 'The Ritz London — garden' },
    { src: TR('2025/01/Deluxe-King.avif'), alt: 'Deluxe King room at The Ritz London' },
    { src: TR('2023/03/The-Ritz-Restaurant-medium-res.avif'), alt: 'The Ritz Restaurant' },
  ],

  keyStats: [
    { value: '136',      label: 'Rooms & Suites',  sub: 'Including seven grand suites'    },
    { value: '1906',     label: 'Established',      sub: '118 years of tradition'          },
    { value: '★★',      label: 'Michelin Stars',   sub: 'The Ritz Restaurant'             },
    { value: 'Royal',    label: 'Warrant',          sub: 'By Royal appointment'            },
    { value: 'No.1',     label: 'Piccadilly',       sub: "London's finest address"         },
    { value: '∞',        label: 'White Glove',      sub: 'Personal butler service'         },
  ],

  overview: {
    headline:      "London's Most Celebrated Address",
    intro:         "Designed by Charles Mewès and Arthur Davis and opened by César Ritz on 24th May 1906, The Ritz London stands as one of the world's most legendary hotels — a living monument to the art of living well, where Louis XVI interiors, gilded colonnades, and sweeping views across Green Park remain as breathtaking today as the night it opened.",
    storyEyebrow:  'The Ritz Story',
    storyHeadline: 'A Standard of Extraordinary',
    storyImage:    S5('sitemgr_photo_21068.jpg'),
    storyBody:     'Holding the Royal Warrant by appointment to HRH The Prince of Wales, The Ritz London is not merely a hotel — it is a place where every guest is treated as royalty, every occasion elevated, and every detail a matter of honour. From the moment you step through the doors on Piccadilly, time slows. The Long Gallery stretches before you, dressed in hand-painted silk, antique marble, and gilded mirrors; the scent of fresh florals drifts from the Palm Court; and the white-gloved staff of four generations greet you by name. This is the hotel that invented the standard by which all others are measured.',
  },

  rooms: {
    suiteHero:    TR('2025/01/Deluxe-King.avif'),
    suiteFeature: S5('sitemgr_photo_21070.jpg'),
    grandSuite:   S5('sitemgr_photo_21071.jpg'),
    corridor:     S5('sitemgr_photo_21069.jpg'),
    detail1:      S5('sitemgr_photo_9418.jpg'),
    detail2:      S5('sitemgr_photo_9420.jpg'),
    detail3:      S5('sitemgr_photo_9421.jpg'),
    exterior:     S5('sitemgr_photo_999.jpg'),
  },

  dining: {
    restaurant: TR('2023/03/The-Ritz-Restaurant-medium-res.avif'),
    palmCourt:  S5('sitemgr_photo_6651.jpg'),
    afternoon:  S5('sitemgr_photo_7662.jpg'),
    rivoli:     S5('sitemgr_photo_21059.jpg'),
  },

  weddings: {
    hero:       S5('sitemgr_photo_9422.jpg'),
    ceremony:   S5('sitemgr_photo_9423.jpg'),
    reception:  S5('sitemgr_photo_9424.jpg'),
    couple:     S5('sitemgr_photo_9425.jpg'),
    detail1:    S5('sitemgr_photo_9426.jpg'),
    detail2:    S5('sitemgr_photo_9427.jpg'),
    setup:      S5('sitemgr_photo_1282.jpg'),
    floral:     S5('sitemgr_photo_13861.jpg'),
    enquireImg: S5('sitemgr_photo_14891.jpg'),
  },

  sectionIntros: {
    overview:  "The Ritz London is one of the world's most celebrated hotels, a landmark of extraordinary refinement at 150 Piccadilly where impeccable service, award-winning dining, and timeless Louis XVI interiors have defined the gold standard of luxury hospitality since 1906.",
    rooms:     '136 rooms and suites, each a sanctuary of extraordinary refinement, dressed in silk damask and antique gold, with hand-painted ceilings, exquisite antiques, marble bathrooms of palatial proportions, and a personal butler in attendance at all times.',
    dining:    "Two Michelin stars, a world-famous afternoon tea, and the legendary Rivoli Bar — dining at The Ritz is as much a part of London's cultural life as the changing of the guard or a walk through Green Park.",
    wellness:  "A world of sublime indulgence — from the iconic Palm Court afternoon tea to the Rivoli Bar's gilded sanctuary, every moment at The Ritz is crafted to refresh and delight the senses.",
    weddings:  "Every wedding at The Ritz is a masterpiece of discretion, elegance, and impeccable taste — created by London's most celebrated wedding team, in London's most celebrated hotel.",
  },

  contact: {
    phone: '+44 20 7493 8181',
    email: 'weddings@theritzlondon.com',
    website: 'https://www.theritzlondon.com',
  },
};

// ── SectionHeader (identical to Six Senses pattern) ────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, light = false, center = false }) {
  const { isMobile } = useBreakpoint();
  const textColor  = light ? '#f5f0e8' : C.text;
  const mutedColor = light ? 'rgba(245,240,232,0.55)' : C.muted;
  return (
    <div style={{
      maxWidth: 840,
      margin: center ? '0 auto 52px' : `0 0 ${isMobile ? 36 : 52}px`,
      textAlign: center ? 'center' : 'left',
    }}>
      {eyebrow && (
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', color: GOLD,
          textTransform: 'uppercase', margin: '0 0 12px',
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

// ── Section wrapper ────────────────────────────────────────────────────────────
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

// ── BreadcrumbBar ──────────────────────────────────────────────────────────────
function BreadcrumbBar({ onBack, onGoDestination }) {
  return (
    <div style={{
      background: C.cream,
      borderBottom: `1px solid ${C.border}`,
      padding: '0 32px',
      height: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      position: 'relative',
      zIndex: 10,
    }}>
      {[
        { label: '← Back to listing', onClick: onBack },
        { label: 'Destinations',      onClick: () => onGoDestination?.('') },
        { label: 'United Kingdom',    onClick: () => onGoDestination?.('united-kingdom') },
        { label: 'The Ritz London',   current: true },
      ].map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && (
            <span style={{ fontFamily: NU, fontSize: 10, color: C.muted, userSelect: 'none' }}>›</span>
          )}
          {crumb.current ? (
            <span style={{ fontFamily: NU, fontSize: 11, color: C.text, fontWeight: 600, letterSpacing: '0.02em' }}>
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={crumb.onClick}
              style={{
                fontFamily: NU, fontSize: 11, color: C.muted,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontWeight: 400, letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => (e.currentTarget.style.color = C.muted)}
            >
              {crumb.label}
            </button>
          )}
        </span>
      ))}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <a
          href="/wedding-venues/the-ritz-london"
          style={{
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: GOLD, textDecoration: 'none',
            border: `1px solid ${GOLD}`,
            padding: '3px 10px', borderRadius: 3,
            transition: 'opacity 0.2s',
          }}
          onMouseEnter={e => (e.currentTarget.style.opacity = '0.7')}
          onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
        >
          View Listing ↗
        </a>
      </div>
    </div>
  );
}

// ── StickyVenueNav ─────────────────────────────────────────────────────────────
const RITZ_NAV = [
  { id: 'overview', label: 'Overview'         },
  { id: 'rooms',    label: 'Rooms & Suites'   },
  { id: 'dining',   label: 'Dining'           },
  { id: 'weddings', label: 'Weddings'         },
];

function StickyVenueNav({ activeSection, onScrollTo, onVisibilityChange }) {
  const { isMobile } = useBreakpoint();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const next = window.scrollY > window.innerHeight * 0.7;
      setVisible(next);
      onVisibilityChange?.(next);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []); // eslint-disable-line

  return (
    <div style={{
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
    }}>
      {/* Name + brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 'auto' }}>
        <span style={{ fontFamily: GD, fontSize: 15, color: C.text, letterSpacing: '0.01em' }}>
          The Ritz London
        </span>
        {!isMobile && (
          <span style={{ fontFamily: NU, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            150 Piccadilly
          </span>
        )}
      </div>

      {/* Section tabs — desktop only */}
      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4 }}>
          {RITZ_NAV.map(item => (
            <button
              key={item.id}
              onClick={() => onScrollTo(item.id)}
              style={{
                background: 'none', border: 'none',
                fontFamily: NU, fontSize: 13,
                fontWeight: activeSection === item.id ? 700 : 500,
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
          marginLeft: isMobile ? 'auto' : 24,
          background: GOLD, color: '#0a0906',
          border: 'none', borderRadius: 4,
          padding: isMobile ? '8px 16px' : '9px 24px',
          fontFamily: NU, fontSize: 11,
          fontWeight: 700, letterSpacing: '0.1em',
          textTransform: 'uppercase', cursor: 'pointer',
          transition: 'opacity 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
        onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
      >
        Enquire
      </button>

      {!isMobile && (
        <a
          href="/wedding-venues/the-ritz-london"
          style={{
            marginLeft: 8,
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: C.muted, textDecoration: 'none',
            padding: '9px 14px', borderRadius: 4,
            border: `1px solid ${C.border}`,
            transition: 'color 0.2s, border-color 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = C.text; e.currentTarget.style.borderColor = C.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = C.muted; e.currentTarget.style.borderColor = C.border; }}
        >
          Listing ↗
        </a>
      )}
    </div>
  );
}

// ── HeroSection ────────────────────────────────────────────────────────────────
function HeroSection({ venue }) {
  const { isMobile } = useBreakpoint();
  return (
    <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 600, background: C.navy }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${venue.heroImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.68) 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '0 24px 40px' : '0 64px 52px',
      }}>
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.18em', color: 'rgba(255,255,255,0.72)',
          textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          Mayfair · London · Est. 1906
        </p>
        <h1 style={{
          fontFamily: GD, fontSize: isMobile ? 38 : 76,
          fontWeight: 400, color: '#ffffff',
          margin: '0 0 8px', lineHeight: 1.0,
          textShadow: '0 2px 32px rgba(0,0,0,0.40)',
        }}>
          The Ritz London
        </h1>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 13 : 15,
          color: 'rgba(255,255,255,0.55)',
          margin: '0 0 4px', fontStyle: 'italic',
          letterSpacing: '0.04em',
        }}>
          150 Piccadilly · Mayfair · London
        </p>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 15 : 18,
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 32px', maxWidth: 580, lineHeight: 1.6,
        }}>
          {venue.tagline}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 16 : 36, alignItems: 'center' }}>
          {venue.heroStats.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: GD, fontSize: isMobile ? 20 : 26, color: '#fff', lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3 }}>{s.label}</span>
            </div>
          ))}
        </div>
      </div>
      {/* Scroll indicator */}
      <div style={{
        position: 'absolute', bottom: isMobile ? 40 : 48, right: isMobile ? 24 : 64,
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
      }}>
        <div style={{ width: 1, height: 40, background: 'rgba(255,255,255,0.35)' }} />
        <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', writingMode: 'vertical-lr' }}>
          Scroll
        </span>
      </div>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function RitzLondonShowcasePage({ onBack, onGoDestination, onNavigateStandard, onNavigateAbout }) {
  const { isMobile } = useBreakpoint();
  const [activeSection, setActiveSection] = useState('overview');
  const [stickyVisible, setStickyVisible] = useState(false);
  const venue = RITZ_VENUE;

  // Section scroll spy
  useEffect(() => {
    const sections = ['overview', 'rooms', 'dining', 'weddings', 'enquire'];
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
    <div style={{ background: C.cream, fontFamily: NU, paddingTop: 64 }}>

      {/* ── Site nav — slides away when StickyVenueNav takes over ─────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 699,
        transform: stickyVisible ? 'translateY(-110%)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <HomeNav
          darkMode={false}
          onToggleDark={() => {}}
          onVendorLogin={null}
          onNavigateStandard={onNavigateStandard}
          onNavigateAbout={onNavigateAbout}
          hasHero={false}
        />
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <BreadcrumbBar onBack={onBack} onGoDestination={onGoDestination} />

      {/* ── Sticky venue nav ─────────────────────────────────────────────── */}
      <StickyVenueNav
        activeSection={activeSection}
        onScrollTo={scrollTo}
        onVisibilityChange={setStickyVisible}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection venue={venue} />

      {/* ── Gallery strip ─────────────────────────────────────────────── */}
      <div style={{ background: C.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '28px 64px' }}>
          {/* 2+2 photo grid, first 4 images */}
          <div style={{ marginBottom: 24 }}>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 22 : 30, color: C.text, margin: '0 0 4px', fontWeight: 400 }}>
              Gallery
            </p>
            <div style={{ width: 40, height: 1, background: GOLD, marginBottom: 16 }} />
            <p style={{ fontFamily: NU, fontSize: 13, color: C.muted, margin: '0 0 20px' }}>
              {venue.galleryImages.length} photographs
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
            {/* Large left image */}
            <div style={{ position: 'relative', height: isMobile ? 260 : 560, overflow: 'hidden' }}>
              <img
                src={venue.galleryImages[0]?.src}
                alt={venue.galleryImages[0]?.alt || 'The Ritz London'}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            {/* Right column: 2 stacked */}
            <div style={{ display: 'grid', gridTemplateRows: '1fr 1fr', gap: 4, height: isMobile ? 'auto' : 560 }}>
              <div style={{ position: 'relative', height: isMobile ? 180 : 'auto', overflow: 'hidden' }}>
                <img
                  src={venue.galleryImages[1]?.src}
                  alt={venue.galleryImages[1]?.alt || 'The Ritz London'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
              </div>
              <div style={{ position: 'relative', height: isMobile ? 180 : 'auto', overflow: 'hidden' }}>
                <img
                  src={venue.galleryImages[2]?.src}
                  alt={venue.galleryImages[2]?.alt || 'The Ritz London'}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                />
                {/* +N overlay */}
                {venue.galleryImages.length > 3 && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(10,8,6,0.52)',
                    display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer',
                  }}>
                    <span style={{ fontFamily: GD, fontSize: 36, color: '#fff', lineHeight: 1 }}>
                      +{venue.galleryImages.length - 3}
                    </span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.7)', letterSpacing: '0.12em', textTransform: 'uppercase', marginTop: 8 }}>
                      View All Photos
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — OVERVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="overview" bg={C.cream}>
        <SectionHeader
          eyebrow="Mayfair · London · Est. 1906"
          title={venue.overview.headline}
          subtitle={venue.sectionIntros?.overview || venue.overview.intro}
        />
        <VenueStatsCard data={{
          variant:  'strip',
          accentBg: '#ffffff',
          theme:    'light',
          stats:    venue.keyStats,
        }} />
        <div style={{ marginTop: 40 }}>
          <TwoColumnEditorialCard data={{
            variant:  'image-left',
            accentBg: C.cream,
            theme:    'light',
            image:    venue.overview.storyImage,
            eyebrow:  venue.overview.storyEyebrow,
            title:    venue.overview.storyHeadline,
            body:     venue.overview.storyBody,
            cta:      { label: 'Explore the Rooms →', href: '#rooms' },
          }} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — ROOMS & SUITES
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="rooms" bg={C.white}>
        <SectionHeader
          eyebrow="Accommodation"
          title="136 Rooms. Versailles in the Heart of London."
          subtitle={venue.sectionIntros?.rooms}
        />

        {/* Deluxe Rooms feature */}
        <div style={{ marginBottom: 4 }}>
          <FeatureCard data={{
            image:    venue.rooms.suiteHero,
            variant:  'image-left',
            accentBg: C.navy,
            theme:    'dark',
            category: 'Deluxe Rooms · Personal Butler Included',
            title:    'Rooms of Extraordinary Refinement',
            excerpt:  'Inspired by the Palace of Versailles, every room at The Ritz is dressed in silk damask and antique gold, with hand-painted ceilings, exquisite period antiques, and marble bathrooms of palatial proportion. Each room overlooks either Green Park or Piccadilly — and every guest is attended by a personal butler, day and night.',
          }} />
        </div>

        {/* Grand Suites feature */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image:    venue.rooms.suiteFeature,
            variant:  'image-right',
            accentBg: C.navyDark,
            theme:    'dark',
            category: 'Suites & Grand Suites · Up to 7 rooms',
            title:    'The William & Mary Suite',
            excerpt:  'The grand suites at The Ritz — among them the William & Mary Suite, The Piccadilly Suite, and The Library Suite — are among the most celebrated in the world. Spanning multiple interconnecting rooms, each has its own identity, its own story, and its own dedicated butler team. They have hosted royalty, heads of state, and icons of culture for over a century.',
          }} />
        </div>

        {/* Long Gallery full-width image with caption */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 300 : 440, overflow: 'hidden' }}>
          <img
            src={venue.rooms.corridor}
            alt="The Long Gallery at The Ritz London"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '20px 24px' : '28px 52px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 100%)',
          }}>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 20 : 28, color: '#fff', margin: 0, fontWeight: 400, fontStyle: 'italic' }}>
              "The Long Gallery — the most beautiful corridor in the world."
            </p>
          </div>
        </div>

        {/* Rooms mosaic grid */}
        <div style={{ marginTop: 4 }}>
          <MosaicCard data={{
            theme:    'light',
            accentBg: C.ivory,
            images:   [
              venue.rooms.grandSuite,
              venue.rooms.detail1,
              venue.rooms.detail2,
              venue.rooms.detail3,
            ],
            title:   'Every Room a Private World',
            excerpt: 'Hand-embroidered fabrics, original oil paintings, antique French furniture, bespoke Ritz floral arrangements, and a butler who knows your preferences before you arrive — the details that define every room.',
          }} />
        </div>

        {/* Rooms carousel */}
        <div style={{ marginTop: 56 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 20px' }}>
            Room Categories
          </p>
          <CarouselRow items={[
            { image: venue.rooms.suiteHero,    title: 'Deluxe King Room',         category: 'Park or Piccadilly view · Butler',    theme: 'dark' },
            { image: venue.rooms.suiteFeature, title: 'Junior Suite',             category: 'Separate sitting room · Butler',       theme: 'dark' },
            { image: venue.rooms.grandSuite,   title: 'The Piccadilly Suite',     category: 'Corner suite · Double aspect',         theme: 'dark' },
            { image: venue.rooms.detail1,      title: 'The Library Suite',        category: 'Private library · Green Park views',   theme: 'dark' },
            { image: venue.rooms.detail2,      title: 'William & Mary Suite',     category: 'The grandest suite · 7 rooms',         theme: 'dark' },
          ]} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — DINING
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="dining" bg={C.navy} pad={isMobile ? '64px 24px' : '96px 64px'}>
        <SectionHeader
          eyebrow="Dining · Two Michelin Stars · The Palm Court · The Rivoli Bar"
          title="A Kitchen That Defines London"
          subtitle={venue.sectionIntros?.dining}
          light
        />

        {/* Ritz Restaurant two-col editorial */}
        <TwoColumnEditorialCard data={{
          variant:  'image-right',
          accentBg: '#1a1525',
          theme:    'dark',
          image:    venue.dining.restaurant,
          eyebrow:  'The Ritz Restaurant · Two Michelin Stars · John Williams MBE',
          title:    'The Most Beautiful Dining Room in the World',
          body:     'Named Restaurant of the Year by the National Restaurant Awards 2025, The Ritz Restaurant is an unrivalled statement of grandeur: towering marble columns, crystal chandeliers, and floor-to-ceiling windows that look out across the gardens of Green Park. Executive Chef John Williams MBE sources the finest seasonal British produce — Lake District lamb, Cornish lobster, Hereford beef — to create menus that celebrate the very best of what Britain grows, catches, and rears. The signature Arts de la Table menu, five- and seven-course tasting menus, and the legendary Live at The Ritz dinner with dancing on Friday and Saturday evenings each represent a complete occasion.',
          cta:      { label: 'Explore dining ↗', href: venue.contact.website },
        }} />

        {/* César Ritz quote */}
        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: C.navyDark,
            theme:    'dark',
            quote:    'The Ritz is not merely a hotel. It is a standard — perhaps the finest standard in the world.',
            attribution:     'César Ritz',
            attributionRole: 'Founder, 1906',
          }} />
        </div>

        {/* Palm Court full-bleed image */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 280 : 400, overflow: 'hidden', borderRadius: 2 }}>
          <img
            src={venue.dining.palmCourt}
            alt="The Palm Court at The Ritz London"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            padding: isMobile ? '20px 24px' : '28px 48px',
            background: 'linear-gradient(to top, rgba(10,8,20,0.82) 0%, transparent 60%)',
          }}>
            <div>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 6px' }}>
                The Palm Court · Afternoon Tea · Since 1906
              </p>
              <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.85)', margin: 0, maxWidth: 540, lineHeight: 1.6 }}>
                For 119 years, The Palm Court has defined the art of British afternoon tea — finger sandwiches, handmade pastries, warm scones with clotted cream, and the world's finest teas, beneath a painted ceiling of extraordinary beauty.
              </p>
            </div>
          </div>
        </div>

        {/* Dining highlights grid */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 24 }}>
          {[
            { label: 'The Ritz Restaurant',  desc: 'Two Michelin stars. Executive Chef John Williams MBE. Seasonal British tasting menus. Live music dinner with dancing Fri–Sat.' },
            { label: 'The Palm Court',       desc: "The world's most celebrated afternoon tea since 1906. Painted ceiling, gilded palms, Champagne service. Advance booking essential." },
            { label: 'The Rivoli Bar',       desc: 'A golden jewellery box of a cocktail bar. Seasonal cocktail lists, rare spirits, and private-label Champagne. The chicest room in London.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '24px 28px',
              background: 'rgba(255,255,255,0.05)',
              border: `1px solid rgba(255,255,255,0.08)`,
              borderTop: `2px solid ${GOLD}`,
              borderRadius: 4,
            }}>
              <p style={{ fontFamily: NU, fontWeight: 700, fontSize: 13, color: 'rgba(245,240,232,0.9)', letterSpacing: '0.04em', margin: '0 0 10px', textTransform: 'uppercase' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: NU, fontSize: 14, color: 'rgba(245,240,232,0.52)', margin: 0, lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4 — WEDDINGS & OCCASIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="weddings" bg={C.cream}>
        <SectionHeader
          eyebrow="Weddings & Private Celebrations"
          title="London's Most Celebrated Wedding Address"
          subtitle={venue.sectionIntros?.weddings}
        />

        {/* Hero wedding image */}
        <div style={{ position: 'relative', width: '100%', height: isMobile ? 340 : 520, overflow: 'hidden', marginBottom: 4 }}>
          <img
            src={venue.weddings.hero}
            alt="Wedding at The Ritz London"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(20,14,10,0.55) 100%)' }} />
        </div>

        {/* Wedding editorial */}
        <div style={{ marginTop: 48 }}>
          <TwoColumnEditorialCard data={{
            variant:  'image-right',
            accentBg: C.ivory,
            theme:    'light',
            image:    venue.weddings.reception,
            eyebrow:  'The William Kent Room · Private Dining & Celebrations',
            title:    'An Occasion Unlike Any Other',
            body:     "The William Kent Room at The Ritz is one of London's most exquisite private dining and celebration spaces — an intimate salon of gilded panelling and silk-draped walls that seats up to 80 guests for a wedding breakfast, overlooking the private gardens of Green Park. The Ritz's celebrated team of event planners, florists, and culinary artists work in complete discretion to create the day you have imagined, from a bespoke menu crafted by John Williams MBE to floral arrangements of extraordinary beauty. Every detail is considered; every moment remembered for a lifetime.",
          }} />
        </div>

        {/* Three-col wedding image grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 4, marginTop: 40, marginBottom: 4 }}>
          {[venue.weddings.ceremony, venue.weddings.couple, venue.weddings.setup].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 220 : 300, overflow: 'hidden' }}>
              <img src={src} alt="Wedding at The Ritz London" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* Wedding highlights */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>
          {[
            { label: 'The William Kent Room',      desc: "London's finest private dining and celebration space — gilded, intimate, and overlooking Green Park. Up to 80 guests." },
            { label: 'Bespoke Menus by John Williams MBE', desc: 'Every wedding menu is composed personally by the Executive Chef — a unique seasonal tasting menu crafted around your vision.' },
            { label: 'Dedicated Wedding Concierge', desc: 'A dedicated Ritz wedding planner manages every detail from venue dressing and florals to transportation and guest suites.' },
            { label: 'Royal Warrant Excellence',   desc: 'The only hotel in London to hold the Royal Warrant — a standard of service that has been refined over four generations and 118 years.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 2, background: GOLD, flexShrink: 0, marginTop: 3, height: 'auto', alignSelf: 'stretch' }} />
              <div>
                <p style={{ fontFamily: NU, fontWeight: 700, fontSize: 13, color: C.text, letterSpacing: '0.02em', margin: '0 0 6px' }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Wedding image strip */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 4, marginTop: 48 }}>
          {[venue.weddings.detail1, venue.weddings.detail2, venue.weddings.floral, venue.weddings.ceremony].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 160 : 220, overflow: 'hidden' }}>
              <img src={src} alt="Wedding detail at The Ritz London" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div style={{ marginTop: 64 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 32px' }}>
            Weddings at The Ritz — Frequently Asked Questions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '28px 48px' }}>
            {[
              {
                q: 'What is the maximum capacity for a wedding at The Ritz?',
                a: 'The William Kent Room accommodates up to 80 guests for a seated wedding breakfast. For larger celebrations, The Ritz can arrange exclusive use of multiple rooms and spaces throughout the hotel.',
              },
              {
                q: 'Is exclusive use of The Ritz available?',
                a: "Yes. The Ritz London offers exclusive use arrangements for private celebrations, allowing guests to experience the hotel's extraordinary spaces, dining, and service in complete privacy.",
              },
              {
                q: 'Who plans the menu for a Ritz wedding?',
                a: 'Every wedding menu is composed personally by Executive Chef John Williams MBE, in close consultation with the couple. The Ritz does not use standard banqueting menus — every occasion is unique.',
              },
              {
                q: 'How far in advance should we enquire?',
                a: 'Given the extraordinary demand for The Ritz as a wedding venue, we recommend enquiring at least 12–18 months in advance of your preferred date. Exclusive weekend dates are particularly sought-after.',
              },
              {
                q: 'Can guests stay at The Ritz on the night of the wedding?',
                a: "Yes. The wedding team will arrange accommodation for the couple and guests across the hotel's 136 rooms and suites, all attended by personal butlers throughout your stay.",
              },
              {
                q: 'What ceremony formats does The Ritz offer?',
                a: 'The Ritz holds a civil marriage licence and can host legal civil ceremonies on-site. Religious blessings and symbolic ceremonies are also available. The wedding concierge will advise on all arrangements.',
              },
            ].map((faq, i) => (
              <div key={i} style={{ borderTop: `1px solid ${C.border}`, paddingTop: 20 }}>
                <p style={{ fontFamily: NU, fontSize: 14, fontWeight: 700, color: C.text, margin: '0 0 8px', lineHeight: 1.5 }}>
                  {faq.q}
                </p>
                <p style={{ fontFamily: NU, fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.7 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          ENQUIRE
      ═══════════════════════════════════════════════════════════════════ */}
      <section id="enquire">
        <VenueEnquireCard data={{
          venue: {
            name:      venue.name,
            tagline:   venue.tagline,
            location:  `${venue.location.town}, ${venue.location.region}, ${venue.location.country}`,
            priceFrom: venue.priceFrom,
            image:     venue.weddings.enquireImg,
          },
          contact: {
            phone: venue.contact.phone,
            email: venue.contact.email,
          },
        }} />
      </section>

    </div>
  );
}
