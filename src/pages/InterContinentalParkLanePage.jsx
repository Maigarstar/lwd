// ─── InterContinentalParkLanePage.jsx ────────────────────────────────────────
// Showcase page — InterContinental London Park Lane
// One Hamilton Place · Hyde Park Corner · London W1J 7QY
// Route: /showcase/intercontinental-london-park-lane
// Layout: mirrors RitzLondonShowcasePage.jsx exactly — Luxury London Hotel Template
// Brand: InterContinental Hotels & Resorts (IHG) — midnight navy + champagne gold
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { fetchVenueIntelligence } from '../services/venueIntelligenceService';
import { supabase } from '../lib/supabaseClient';

import FeatureCard            from '../components/cards/editorial/FeatureCard';
import QuoteCard              from '../components/cards/editorial/QuoteCard';
import VenueStatsCard         from '../components/cards/editorial/VenueStatsCard';
import TwoColumnEditorialCard from '../components/cards/editorial/TwoColumnEditorialCard';
import MosaicCard             from '../components/cards/editorial/MosaicCard';
import { CarouselRow }        from '../components/cards/editorial/CarouselCard';
import VenueEnquireCard       from '../components/cards/editorial/VenueEnquireCard';
import MediaBlock             from '../components/profile/MediaBlock';
import { ThemeCtx, LIGHT }   from '../components/profile/ProfileDesignSystem';
import { ShowcaseAtAGlance, ShowcasePricing, ShowcaseVerified } from '../components/showcase';
import HomeNav                from '../components/nav/HomeNav';
import { useBreakpoint }      from '../hooks/useWindowWidth';

// ── Brand design tokens — InterContinental London Park Lane ───────────────────
// Midnight navy + champagne gold — distinctly IC, not Ritz
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C4A05A';   // IC Park Lane champagne gold

const C = {
  cream:    '#F9F7F2',
  ivory:    '#F1EDE5',
  white:    '#ffffff',
  dark:     '#0A1120',
  text:     '#1C2030',
  muted:    '#63687A',
  border:   '#E5DFD3',
  gold:     GOLD,
  navy:     '#0C1628',   // IC midnight navy — cooler, deeper than The Ritz
  navyDark: '#070E1C',   // deep contrast for dining/dark sections
};

// ── Local image helper — /public/InterContinental-Istanbul/ ──────────────────
const IMG = (n) => `/InterContinental-Istanbul/${n}.jpg`;

// ── Venue data ─────────────────────────────────────────────────────────────────
const IC_VENUE = {
  name:     'InterContinental London Park Lane',
  brand:    'One Hamilton Place · Hyde Park Corner',
  tagline:  "At Hyde Park Corner, where Mayfair meets the Royal parks — 447 rooms, London's grandest ballroom, and a Michelin-starred Italian at the heart of the capital's most storied address.",
  location: {
    town:    'One Hamilton Place',
    region:  'Hyde Park Corner',
    country: 'London',
    address: 'One Hamilton Place, Hyde Park Corner, London W1J 7QY',
  },
  priceFrom: 'POA',

  // Hero — hotel exterior / Hyde Park Corner elevation
  heroImage: IMG(1),

  heroStats: [
    { value: '447',       label: 'Rooms & Suites'  },
    { value: '5',         label: 'Event Spaces'     },
    { value: '800',       label: 'Ballroom Guests'  },
    { value: 'Michelin',  label: 'Starred Dining'   },
  ],

  galleryImages: [
    { src: IMG(1),  alt: 'InterContinental London Park Lane — Hyde Park Corner elevation' },
    { src: IMG(2),  alt: 'The Ballroom — InterContinental London Park Lane' },
    { src: IMG(3),  alt: 'The Ballroom set for a gala dinner' },
    { src: IMG(4),  alt: 'Theo Randall at The InterContinental' },
    { src: IMG(5),  alt: 'Park Suite living room — Hyde Park view' },
    { src: IMG(6),  alt: 'Hamilton Suite — master bedroom' },
    { src: IMG(7),  alt: 'Deluxe King room' },
    { src: IMG(8),  alt: 'Club InterContinental Lounge' },
    { src: IMG(9),  alt: 'Hyde Park Terrace — seasonal outdoor celebrations' },
    { src: IMG(10), alt: 'Burlington Suite — private dining and celebrations' },
    { src: IMG(11), alt: 'Mountbatten Room — intimate ceremony' },
    { src: IMG(12), alt: 'Wedding reception — The Ballroom' },
    { src: IMG(13), alt: 'Ballroom table setting — wedding breakfast' },
    { src: IMG(14), alt: 'Wedding florals — IC Park Lane' },
    { src: IMG(15), alt: 'Spa InterContinental' },
    { src: IMG(16), alt: 'The Bar — InterContinental London Park Lane' },
    { src: IMG(17), alt: 'Chez Marie — brasserie and terrace' },
    { src: IMG(18), alt: 'Hotel lobby — arrival experience' },
    { src: IMG(19), alt: 'Hyde Park views from InterContinental Park Lane' },
    { src: IMG(20), alt: 'Suite — Hyde Park panorama' },
  ],

  keyStats: [
    { value: '447',      label: 'Rooms & Suites',    sub: 'Including suites with Hyde Park views' },
    { value: '5',        label: 'Event Spaces',       sub: 'Ballroom to intimate suites'          },
    { value: '800',      label: 'Ballroom Capacity',  sub: 'Largest private hotel ballroom'       },
    { value: '★',       label: 'Michelin Star',       sub: 'Theo Randall at The InterContinental' },
    { value: 'Hyde Park',label: 'Corner',             sub: "London's most storied address"        },
    { value: '24hr',     label: 'Concierge',          sub: 'Club InterContinental included'       },
  ],

  overview: {
    headline:      "Where Hyde Park Meets Mayfair",
    intro:         "At One Hamilton Place, InterContinental London Park Lane occupies a position of unrivalled significance — commanding Hyde Park Corner, the ceremonial gateway between London's royal parks and the great houses of Mayfair, with views that sweep west across Hyde Park and south toward Belgravia.",
    storyEyebrow:  'The IC Park Lane Story',
    storyHeadline: 'A City Address Without Equal',
    storyImage:    IMG(1),
    storyBody:     "To stay at InterContinental London Park Lane is to occupy one of the capital's most storied corners — One Hamilton Place, where the arc of Mayfair meets the green expanse of Hyde Park and the ceremonial sweep of Constitution Hill. From your room, the Wellington Arch frames the view; at night, the lights of Knightsbridge illuminate the horizon. The hotel's 447 rooms and suites, Michelin-starred Italian at Theo Randall, London's grandest private ballroom, and the personal attention of Club InterContinental — each speaks of an establishment that understands London as intimately as it understands luxury.",
  },

  rooms: {
    heroRoom:       IMG(7),
    suiteHero:      IMG(5),
    hamiltonSuite:  IMG(6),
    clubLounge:     IMG(8),
    roomDetail1:    IMG(19),
    roomDetail2:    IMG(20),
    roomDetail3:    IMG(18),
    parkView:       IMG(19),
  },

  dining: {
    theoRandall:    IMG(4),
    theoDetail:     IMG(4),
    chezMarie:      IMG(17),
    theBar:         IMG(16),
    terrace:        IMG(9),
  },

  weddings: {
    ballroomHero:   IMG(2),
    ballroomDinner: IMG(3),
    burlington:     IMG(10),
    mountbatten:    IMG(11),
    terrace:        IMG(9),
    couple:         IMG(12),
    tableDetail:    IMG(13),
    floralDetail:   IMG(14),
    enquireImg:     IMG(1),
  },

  sectionIntros: {
    overview:  "InterContinental London Park Lane stands at Hyde Park Corner — one of the capital's most symbolic addresses — where 447 rooms and suites, celebrated dining at the Michelin-starred Theo Randall, and London's most magnificent private ballroom define a hotel of authentic grandeur and contemporary refinement.",
    rooms:     "447 rooms and suites, from Deluxe King rooms with park and city aspects to the sweeping Hamilton Suite on the upper floors — each designed for the discerning traveller who expects Hyde Park views, Club InterContinental privileges, and a level of personal attention that distinguishes the truly exceptional.",
    dining:    "Theo Randall at The InterContinental — the Michelin-starred Italian that has defined the restaurant since 2006 — alongside Chez Marie brasserie, The Bar, and the seasonal Hyde Park Terrace: four distinct moods for every occasion at the most celebrated table in Mayfair.",
    wellness:  "Spa InterContinental and a state-of-the-art fitness centre offer a private sanctuary for guests — a world apart from the energy of Hyde Park Corner, where treatments, heated pool, and stillness restore at the heart of the capital.",
    weddings:  "London's grandest hotel ballroom — 800 guests, five event spaces, a dedicated wedding team, and a Michelin-starred kitchen — at One Hamilton Place, the most significant address in the capital for celebrations of extraordinary scale and ambition.",
  },

  contact: {
    phone:   '+44 20 7409 3131',
    email:   'weddings.london@ihg.com',
    website: 'https://parklane.intercontinental.com',
  },
};

// ── AI/Intelligence Data Layer ────────────────────────────────────────────────
const IC_AI_DATA = {
  ceremony_capacity:         200,
  dining_capacity:           600,
  reception_capacity:        800,
  bedrooms:                  447,
  exclusive_use:             true,
  exclusive_use_notes:       'Hotel buyout available by arrangement for exclusive private celebrations. Includes all 447 rooms and suites, The Ballroom, Burlington Suite, and all dining venues.',
  currency:                  'GBP',
  venue_hire_from:           null,
  typical_wedding_spend_min: 3000000,
  typical_wedding_spend_max: 10000000,
  minimum_spend:             null,
  price_per_head_from:       null,
  pricing_notes:             "InterContinental London Park Lane's weddings are priced individually — the investment is shaped by the number of guests, event spaces selected, menus, overnight accommodation, and the bespoke elements crafted with the dedicated wedding planning team. All proposals follow a personalised consultation. Enquire directly for a tailored quotation.",
  pricing_includes:          ['Venue hire', 'White-glove service', 'Dedicated wedding coordinator', 'Table linen & silverware', 'Menu tasting for two', 'Event planning consultation'],
  pricing_excludes:          ['Floral design & styling', 'Entertainment & music', 'Photography & videography', 'Guest accommodation (quoted separately)', 'Transport', 'Wedding cake', 'Stationery & favours'],
  catering_type:             'in_house_only',
  outdoor_ceremony:          true,
  on_site_accommodation:     true,
  verified_at:               '2026-03-21T00:00:00Z',
  last_confirmed_source:     'lwd_team',
  verification_notes:        'Capacity figures from InterContinental London Park Lane published materials and LWD editorial research. Wedding spend ranges are indicative based on industry benchmarks for five-star London hotel weddings.',
};

// ── SectionHeader ─────────────────────────────────────────────────────────────
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
function BreadcrumbBar({ onBack, onGoDestination, listingUrl }) {
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
        { label: '← Back to listing',               onClick: onBack },
        { label: 'Destinations',                     onClick: () => onGoDestination?.('') },
        { label: 'United Kingdom',                   onClick: () => onGoDestination?.('united-kingdom') },
        { label: 'InterContinental London Park Lane', current: true },
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
          href={listingUrl || '/wedding-venues/intercontinental-london-park-lane'}
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
const IC_NAV = [
  { id: 'overview', label: 'Overview'        },
  { id: 'rooms',    label: 'Rooms & Suites'  },
  { id: 'dining',   label: 'Dining'          },
  { id: 'weddings', label: 'Weddings'        },
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
      background: 'rgba(249,247,242,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${C.border}`,
      boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex', alignItems: 'center',
      height: 56,
      padding: isMobile ? '0 16px' : '0 32px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 'auto' }}>
        <span style={{ fontFamily: GD, fontSize: 15, color: C.text, letterSpacing: '0.01em' }}>
          InterContinental London Park Lane
        </span>
        {!isMobile && (
          <span style={{ fontFamily: NU, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Hyde Park Corner
          </span>
        )}
      </div>

      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4 }}>
          {IC_NAV.map(item => (
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
          href="/wedding-venues/intercontinental-london-park-lane"
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
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 35%, rgba(0,0,0,0.72) 100%)',
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
          Hyde Park Corner · Mayfair · London
        </p>
        <h1 style={{
          fontFamily: GD, fontSize: isMobile ? 34 : 68,
          fontWeight: 400, color: '#ffffff',
          margin: '0 0 8px', lineHeight: 1.05,
          textShadow: '0 2px 32px rgba(0,0,0,0.45)',
        }}>
          InterContinental<br />London Park Lane
        </h1>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 13 : 15,
          color: 'rgba(255,255,255,0.55)',
          margin: '0 0 4px', fontStyle: 'italic',
          letterSpacing: '0.04em',
        }}>
          One Hamilton Place · Hyde Park Corner · London W1J 7QY
        </p>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 15 : 18,
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 32px', maxWidth: 600, lineHeight: 1.6,
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
export default function InterContinentalParkLanePage({ onBack, onGoDestination, onNavigateStandard, onNavigateAbout }) {
  const { isMobile } = useBreakpoint();
  const venue = IC_VENUE;

  const [activeSection, setActiveSection] = useState('overview');
  const [stickyVisible, setStickyVisible] = useState(false);
  const [viData, setViData]               = useState(IC_AI_DATA);
  const [listingUrl, setListingUrl]       = useState('/wedding-venues/intercontinental-london-park-lane');

  useEffect(() => {
    // Fetch venue intelligence from DB if available
    fetchVenueIntelligence('intercontinental-london-park-lane').then(row => {
      if (row) setViData(row);
    });

    // Resolve listing URL via showcase DB record
    (async () => {
      try {
        const { data } = await supabase
          .from('venue_showcases')
          .select('listing_id, listings(slug)')
          .eq('slug', 'intercontinental-london-park-lane')
          .single();
        if (data?.listings?.slug) setListingUrl(`/wedding-venues/${data.listings.slug}`);
      } catch {
        // fallback already set
      }
    })();
  }, []);

  // ── Schema.org JSON-LD ──────────────────────────────────────────────────────
  useEffect(() => {
    const schema = {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'InterContinental London Park Lane — Wedding Showcase',
      description: IC_VENUE.tagline,
      url: 'https://luxuryweddingdirectory.com/showcase/intercontinental-london-park-lane',
      about: {
        '@type': 'EventVenue',
        '@id': 'https://luxuryweddingdirectory.com/showcase/intercontinental-london-park-lane#venue',
        name: 'InterContinental London Park Lane',
        description: IC_VENUE.sectionIntros.overview,
        url: 'https://parklane.intercontinental.com',
        telephone: IC_VENUE.contact.phone,
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'One Hamilton Place',
          addressLocality: 'London',
          postalCode: 'W1J 7QY',
          addressCountry: 'GB',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: 51.5031,
          longitude: -0.1527,
        },
        maximumAttendeeCapacity: viData.reception_capacity,
        amenityFeature: [
          { '@type': 'LocationFeatureSpecification', name: 'On-site accommodation',    value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Exclusive use available',  value: true },
          { '@type': 'LocationFeatureSpecification', name: 'In-house catering',        value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Outdoor ceremony space',   value: true },
          { '@type': 'LocationFeatureSpecification', name: 'Michelin-starred dining',  value: true },
        ],
      },
      publisher: {
        '@type': 'Organization',
        name: 'Luxury Wedding Directory',
        url: 'https://luxuryweddingdirectory.com',
      },
    };
    const el = document.createElement('script');
    el.type = 'application/ld+json';
    el.id   = 'schema-ic-park-lane';
    el.text = JSON.stringify(schema);
    document.head.appendChild(el);
    return () => document.getElementById('schema-ic-park-lane')?.remove();
  }, []);

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

      {/* ── Site nav ─────────────────────────────────────────────────────── */}
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

      {/* ── Breadcrumb ───────────────────────────────────────────────────── */}
      <BreadcrumbBar onBack={onBack} onGoDestination={onGoDestination} listingUrl={listingUrl} />

      {/* ── Sticky venue nav ─────────────────────────────────────────────── */}
      <StickyVenueNav
        activeSection={activeSection}
        onScrollTo={scrollTo}
        onVisibilityChange={setStickyVisible}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection venue={venue} />

      {/* ── Gallery ──────────────────────────────────────────────────────── */}
      <div style={{ background: C.white }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '28px 64px' }}>
          <ThemeCtx.Provider value={LIGHT}>
            <MediaBlock
              videos={[]}
              gallery={(venue.galleryImages || []).map((img, i) => ({
                id:    `ic-pl-img-${i}`,
                src:   img.src || '',
                alt:   img.alt || 'InterContinental London Park Lane',
                title: img.alt || '',
              }))}
            />
          </ThemeCtx.Provider>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1 — OVERVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="overview" bg={C.cream}>
        <SectionHeader
          eyebrow="Hyde Park Corner · Mayfair · London W1J"
          title={venue.overview.headline}
          subtitle={venue.sectionIntros?.overview || venue.overview.intro}
        />

        {/* Verified Details trust badge */}
        <ShowcaseVerified data={viData} accentColor={GOLD} theme="light" />

        {/* Venue stats strip */}
        <VenueStatsCard data={{
          variant:  'strip',
          accentBg: '#ffffff',
          theme:    'light',
          stats:    venue.keyStats,
        }} />

        {/* AI-readable At a Glance block */}
        <ShowcaseAtAGlance data={viData} accentColor={GOLD} theme="light" />

        {/* The IC Park Lane story */}
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

        {/* Location callout — Hyde Park Corner significance */}
        <div style={{
          marginTop: 48,
          padding: isMobile ? '32px 24px' : '40px 52px',
          background: C.ivory,
          border: `1px solid ${C.border}`,
          borderTop: `3px solid ${GOLD}`,
          borderRadius: 4,
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr',
          gap: 32,
        }}>
          {[
            { label: 'Hyde Park Corner', desc: 'The ceremonial gateway between Mayfair and the Royal parks — minutes from Buckingham Palace, Knightsbridge, and Belgravia. No London address commands this intersection.' },
            { label: 'Hyde Park & Kensington Gardens', desc: 'The hotel is framed by 350 acres of Royal parkland — morning runs through Hyde Park, weekend markets at Portobello Road, and evening walks to the Serpentine Gallery are all on the doorstep.' },
            { label: 'Mayfair, Belgravia & Knightsbridge', desc: "Three of London's most celebrated neighbourhoods — Bond Street shopping, the restaurants of Mayfair, Harrods, and the galleries of Belgravia — all within ten minutes on foot." },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontFamily: NU, fontWeight: 700, fontSize: 13, color: C.text, letterSpacing: '0.02em', margin: '0 0 8px' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: NU, fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          PRICING & WHAT TO EXPECT
      ═══════════════════════════════════════════════════════════════════ */}
      <ShowcasePricing
        data={viData}
        venueName="InterContinental London Park Lane"
        accentColor={GOLD}
        theme="light"
        bg={C.ivory}
      />

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2 — ROOMS & SUITES
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="rooms" bg={C.white}>
        <SectionHeader
          eyebrow="Accommodation"
          title="447 Rooms. Hyde Park from Every Angle."
          subtitle={venue.sectionIntros?.rooms}
        />

        {/* Deluxe rooms feature */}
        <div style={{ marginBottom: 4 }}>
          <FeatureCard data={{
            image:    venue.rooms.heroRoom,
            variant:  'image-left',
            accentBg: C.navy,
            theme:    'dark',
            category: 'Deluxe Rooms · Park & City Aspects · Club InterContinental',
            title:    'The City Below. The Park Beyond.',
            excerpt:  'From the upper floors of InterContinental London Park Lane, London arranges itself in a panorama of extraordinary scale — the copper horses of Hyde Park Corner, the Wellington Arch, the sweep of the Serpentine, the rooftops of Knightsbridge and Belgravia. Deluxe King and Twin rooms offer either park or city aspects, with Club InterContinental access granting exclusive lounge privileges: curated breakfast, afternoon drinks and canapés, and dedicated concierge service throughout your stay.',
          }} />
        </div>

        {/* Park Suites feature */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image:    venue.rooms.suiteHero,
            variant:  'image-right',
            accentBg: C.navyDark,
            theme:    'dark',
            category: 'Park Suites & Signature Suites · Separate Living',
            title:    'A Private Residence Above the Park',
            excerpt:  "The Park Suites at InterContinental London Park Lane offer a level of space and stillness that is genuinely rare in central London — separate living rooms, dedicated dressing areas, and floor-to-ceiling windows that frame Hyde Park's treeline from dawn to dusk. Designed in a palette of deep navy and warm champagne, each suite feels like a private apartment at the most prestigious address in the capital.",
          }} />
        </div>

        {/* Hamilton Suite — full width image with caption */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 300 : 440, overflow: 'hidden' }}>
          <img
            src={venue.rooms.hamiltonSuite}
            alt="Hamilton Suite — InterContinental London Park Lane"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 45%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '20px 24px' : '28px 52px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
          }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 8px' }}>
              The Hamilton Suite
            </p>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 20 : 28, color: '#fff', margin: 0, fontWeight: 400, fontStyle: 'italic' }}>
              "The most significant address in Hyde Park — above the arch, across the park."
            </p>
          </div>
        </div>

        {/* Rooms mosaic */}
        <div style={{ marginTop: 4 }}>
          <MosaicCard data={{
            theme:    'light',
            accentBg: C.ivory,
            images:   [
              venue.rooms.clubLounge,
              venue.rooms.roomDetail1,
              venue.rooms.roomDetail2,
              venue.rooms.roomDetail3,
            ],
            title:   'Club InterContinental — An Address Within an Address',
            excerpt: "Exclusive lounge access, curated breakfast, afternoon refreshments, and a dedicated concierge team — Club InterContinental transforms a stay into a membership, with the privacy and attentiveness of a private members' house at Hyde Park Corner.",
          }} />
        </div>

        {/* Room categories carousel */}
        <div style={{ marginTop: 56 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 20px' }}>
            Room Categories
          </p>
          <CarouselRow items={[
            { image: venue.rooms.heroRoom,      title: 'Deluxe King Room',        category: 'Park or city view · Club available',         theme: 'dark' },
            { image: venue.rooms.roomDetail1,   title: 'Superior Room',           category: 'Corner aspect · Higher floor options',        theme: 'dark' },
            { image: venue.rooms.suiteHero,     title: 'Park Suite',              category: 'Hyde Park view · Separate living room',       theme: 'dark' },
            { image: venue.rooms.hamiltonSuite, title: 'Hamilton Suite',          category: 'Penthouse-level · Full park panorama',        theme: 'dark' },
            { image: venue.rooms.clubLounge,    title: 'Club InterContinental',   category: 'Exclusive lounge · Curated breakfast',        theme: 'dark' },
          ]} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3 — DINING
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="dining" bg={C.navy} pad={isMobile ? '64px 24px' : '96px 64px'}>
        <SectionHeader
          eyebrow="Dining · Theo Randall · Chez Marie · The Bar"
          title="A Michelin Star at Hyde Park Corner"
          subtitle={venue.sectionIntros?.dining}
          light
        />

        {/* Theo Randall — main editorial feature */}
        <TwoColumnEditorialCard data={{
          variant:  'image-right',
          accentBg: '#0a1220',
          theme:    'dark',
          image:    venue.dining.theoRandall,
          eyebrow:  'Theo Randall at The InterContinental · Michelin Star · Chef Theo Randall',
          title:    'The Italian Table That Defines Mayfair',
          body:     "Since 2006, Theo Randall at The InterContinental has held its place as one of London's most celebrated restaurants — a warmly lit, intimate room where Michelin-starred Italian cooking meets the finest seasonal produce from across the country and beyond. Theo Randall, formerly head chef at the River Café, brings the same reverence for exceptional ingredients: hand-rolled pasta, wood-roasted meats and fish, and desserts of extraordinary simplicity. The wine list — predominantly Italian — is among the most thoughtfully curated in the capital. For private dining and celebration menus, Theo works personally with couples and event teams to create something entirely their own.",
          cta:      { label: 'Explore dining ↗', href: venue.contact.website },
        }} />

        {/* Quote */}
        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: C.navyDark,
            theme:    'dark',
            quote:    'Great cooking begins with the finest ingredients and the confidence to let them speak.',
            attribution:     'Theo Randall',
            attributionRole: 'Chef Patron, Theo Randall at The InterContinental',
          }} />
        </div>

        {/* Chez Marie / Hyde Park Terrace image */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 280 : 400, overflow: 'hidden', borderRadius: 2 }}>
          <img
            src={venue.dining.terrace}
            alt="Hyde Park Terrace — InterContinental London Park Lane"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            padding: isMobile ? '20px 24px' : '28px 48px',
            background: 'linear-gradient(to top, rgba(7,14,28,0.85) 0%, transparent 60%)',
          }}>
            <div>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 6px' }}>
                Hyde Park Terrace · Seasonal · Open Air
              </p>
              <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.85)', margin: 0, maxWidth: 540, lineHeight: 1.6 }}>
                From late spring through summer, the Hyde Park Terrace opens to the sky — al fresco cocktails and dining with the treeline of the park as backdrop, and the ceremonial sweep of Hyde Park Corner below.
              </p>
            </div>
          </div>
        </div>

        {/* Dining highlights grid */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 24 }}>
          {[
            { label: 'Theo Randall at The InterContinental', desc: 'Michelin-starred Italian by Theo Randall. Seasonal menus, hand-rolled pasta, wood-roasted dishes, and an exceptional Italian wine list. Private dining available.' },
            { label: 'Chez Marie',                           desc: 'A contemporary brasserie for all-day dining — morning pastries, seasonal lunch menus, and relaxed evening meals with a well-chosen international wine list.' },
            { label: 'The Bar',                              desc: 'A sophisticated cocktail bar for evening drinking and light bites — classic and seasonal cocktails, rare spirits, and an atmosphere that captures the quiet confidence of Hyde Park Corner.' },
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
          SECTION 4 — WEDDINGS & CELEBRATIONS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="weddings" bg={C.cream}>
        <SectionHeader
          eyebrow="Weddings & Private Celebrations"
          title="London's Most Magnificent Hotel Ballroom"
          subtitle={venue.sectionIntros?.weddings}
        />

        {/* Ballroom hero */}
        <div style={{ position: 'relative', width: '100%', height: isMobile ? 340 : 560, overflow: 'hidden', marginBottom: 4 }}>
          <img
            src={venue.weddings.ballroomHero}
            alt="The Ballroom — InterContinental London Park Lane"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(14,18,32,0.62) 100%)' }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '20px 24px' : '28px 52px',
          }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 8px' }}>
              The Ballroom · Up to 800 Guests · Civil Ceremony Licence
            </p>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 20 : 32, color: '#fff', margin: 0, fontWeight: 400, maxWidth: 600, lineHeight: 1.25 }}>
              The grandest private ballroom in London — where celebrations of extraordinary ambition find their natural home.
            </p>
          </div>
        </div>

        {/* Ballroom editorial */}
        <div style={{ marginTop: 48 }}>
          <TwoColumnEditorialCard data={{
            variant:  'image-right',
            accentBg: C.ivory,
            theme:    'light',
            image:    venue.weddings.ballroomDinner,
            eyebrow:  'The Ballroom · One Hamilton Place · 800 Guests Reception',
            title:    'An Occasion on an Extraordinary Scale',
            body:     "The Ballroom at InterContinental London Park Lane is among the most significant private event spaces in the capital — a room of genuinely grand proportions, with soaring ceilings, crystal chandeliers, and a sense of occasion that only a handful of venues in London can deliver. For a seated wedding breakfast of 600 or a standing reception of 800, The Ballroom transforms with complete flexibility: the dedicated events team work alongside your preferred floral designers, production companies, and entertainment providers to realise a celebration that is entirely personal. The in-house kitchen, led by the hotel's executive chef and informed by the standards of Theo Randall, composes seasonal menus for every scale of occasion.",
            cta:      { label: 'Enquire about The Ballroom →', href: '#enquire' },
          }} />
        </div>

        {/* Three-column image grid — Burlington, Mountbatten, Terrace */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 4, marginTop: 40, marginBottom: 4 }}>
          {[venue.weddings.burlington, venue.weddings.mountbatten, venue.weddings.terrace].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 220 : 320, overflow: 'hidden' }}>
              <img src={src} alt={['Burlington Suite', 'Mountbatten Room', 'Hyde Park Terrace'][i]} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: '16px 20px',
                background: 'linear-gradient(to top, rgba(7,14,28,0.78) 0%, transparent 100%)',
              }}>
                <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', margin: 0 }}>
                  {['Burlington Suite', 'Mountbatten Room', 'Hyde Park Terrace'][i]}
                </p>
                <p style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.7)', margin: '3px 0 0' }}>
                  {['Up to 200 for dinner', 'Intimate ceremonies — up to 120', 'Seasonal outdoor celebrations'][i]}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Wedding highlights 2×2 grid */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>
          {[
            {
              label: 'The Ballroom',
              desc: "800 standing or 600 for a gala dinner — InterContinental London Park Lane's Ballroom is the grandest private celebration space in London, with complete technical and production flexibility.",
            },
            {
              label: 'Burlington Suite & Mountbatten Room',
              desc: 'Intimate to mid-scale celebration options — the Burlington Suite for dinners of up to 200, and the Mountbatten Room for ceremonies and private receptions of up to 120 guests.',
            },
            {
              label: 'Michelin-Starred Celebration Menus',
              desc: 'Every wedding menu is developed in collaboration with the executive culinary team, informed by the standards of Theo Randall — seasonal, precise, and entirely bespoke to your occasion.',
            },
            {
              label: 'Dedicated Wedding Planning Team',
              desc: 'An experienced team manages every detail of your celebration — from initial consultation and venue dressing to transportation, floral partnerships, and guest room coordination across 447 rooms and suites.',
            },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 2, background: GOLD, flexShrink: 0, marginTop: 3, alignSelf: 'stretch' }} />
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
          {[venue.weddings.couple, venue.weddings.tableDetail, venue.weddings.floralDetail, venue.weddings.burlington].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 160 : 220, overflow: 'hidden' }}>
              <img src={src} alt="Wedding at InterContinental London Park Lane" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* Event spaces at a glance */}
        <div style={{ marginTop: 52, background: C.navy, borderRadius: 4, padding: isMobile ? '32px 24px' : '40px 52px' }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 28px' }}>
            Event Spaces — At a Glance
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(5, 1fr)', gap: isMobile ? 20 : 0 }}>
            {[
              { name: 'The Ballroom',           reception: '800', dinner: '600', ceremony: '500' },
              { name: 'Burlington Suite',       reception: '300', dinner: '200', ceremony: '160' },
              { name: 'Mountbatten Room',       reception: '150', dinner: '120', ceremony: '100' },
              { name: 'Hyde Park Suite',        reception: '100', dinner: '80',  ceremony: '60'  },
              { name: 'Hyde Park Terrace',      reception: '200', dinner: '—',   ceremony: '—'   },
            ].map((space, i) => (
              <div key={i} style={{
                padding: isMobile ? '16px 0' : '0 20px',
                borderLeft: !isMobile && i > 0 ? `1px solid rgba(255,255,255,0.08)` : 'none',
                borderTop: isMobile && i > 0 ? `1px solid rgba(255,255,255,0.08)` : 'none',
              }}>
                <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 12px' }}>
                  {space.name}
                </p>
                {[
                  { label: 'Reception',   val: space.reception },
                  { label: 'Dinner',      val: space.dinner    },
                  { label: 'Ceremony',    val: space.ceremony  },
                ].map((row, j) => (
                  <div key={j} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <span style={{ fontFamily: NU, fontSize: 12, color: 'rgba(245,240,232,0.45)' }}>{row.label}</span>
                    <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: 'rgba(245,240,232,0.85)' }}>{row.val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div style={{ marginTop: 64 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 32px' }}>
            Weddings at InterContinental London Park Lane — Frequently Asked Questions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '28px 48px' }}>
            {[
              {
                q: 'What is the largest capacity for a wedding at InterContinental London Park Lane?',
                a: 'The Ballroom accommodates up to 800 guests for a standing reception and 600 for a seated gala dinner — making it one of the largest and most impressive private hotel ballrooms in London.',
              },
              {
                q: 'Is the hotel able to host civil marriage ceremonies?',
                a: 'Yes. InterContinental London Park Lane holds a civil ceremony licence, allowing legal civil marriage ceremonies to take place on-site across multiple spaces, from The Ballroom to the more intimate Mountbatten Room.',
              },
              {
                q: 'Who creates the wedding menus?',
                a: "The hotel's executive culinary team creates bespoke celebration menus for every occasion — drawing on the same seasonal, ingredient-led approach that defines Theo Randall at The InterContinental. Every menu is personalised following consultation.",
              },
              {
                q: 'Can guests stay at the hotel on the night of the wedding?',
                a: "Yes. The wedding team will coordinate room blocks across the hotel's 447 rooms and suites for the wedding party and guests, with specially negotiated rates for the night of the celebration and surrounding dates.",
              },
              {
                q: 'How far in advance should we enquire?',
                a: 'For The Ballroom and larger celebrations, we recommend enquiring at least 12–18 months in advance, particularly for Saturday dates. Smaller spaces may have more flexibility. Contact the weddings team directly to check availability.',
              },
              {
                q: 'Is exclusive use of the hotel available?',
                a: 'Full hotel buyout is available by special arrangement for guests wishing to host an entirely private celebration across all 447 rooms, suites, and event spaces. The team will advise on availability and all associated details.',
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
