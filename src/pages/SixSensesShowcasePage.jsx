// ─── SixSensesShowcasePage.jsx ────────────────────────────────────────────────
// Showcase page, Six Senses Krabey Island
// Koh Krabey Island · Preah Sihanouk Province · Cambodia
// Route: /showcase/six-senses-krabey-island
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';

import FeatureCard            from '../components/cards/editorial/FeatureCard';
import ImageOverlayCard       from '../components/cards/editorial/ImageOverlayCard';
import QuoteCard              from '../components/cards/editorial/QuoteCard';
import VenueStatsCard         from '../components/cards/editorial/VenueStatsCard';
import TwoColumnEditorialCard from '../components/cards/editorial/TwoColumnEditorialCard';
import MosaicCard             from '../components/cards/editorial/MosaicCard';
import { CarouselRow }        from '../components/cards/editorial/CarouselCard';
import MediaBlock             from '../components/profile/MediaBlock';
import { ThemeCtx, LIGHT }   from '../components/profile/ProfileDesignSystem';
import VenueEnquireCard       from '../components/cards/editorial/VenueEnquireCard';
import HomeNav                from '../components/nav/HomeNav';
import { useBreakpoint }      from '../hooks/useWindowWidth';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';
const C = {
  cream:  '#faf9f6',
  dark:   '#0f0f0d',
  text:   '#1a1a18',
  muted:  '#6b6560',
  border: '#e4e0d8',
  gold:   GOLD,
  ivory:  '#f5f2ec',
  ocean:  '#0d1a1f',    // deep teal-dark for ocean/wellness sections
  jungle: '#131c14',    // deep jungle green
};

const C_DARK = {
  cream:  '#0a0a08',
  dark:   '#f5f0e8',
  text:   '#f5f0e8',
  muted:  'rgba(245,240,232,0.52)',
  border: 'rgba(255,255,255,0.1)',
  gold:   GOLD,
  ivory:  '#0f0e0c',
  ocean:  '#0d1a1f',
  jungle: '#131c14',
};

// ── Image helper, all images live in public/Six-Senses-Krabey-Island/
const I = (filename) => `/Six-Senses-Krabey-Island/${filename}`;

// ── Venue data ─────────────────────────────────────────────────────────────────
const SSKRABEY_VENUE = {
  name:     'Six Senses Krabey Island',
  tagline:  'A private island sanctuary where the Gulf of Thailand meets barefoot luxury',
  logo:     null,
  location: {
    town:    'Koh Krabey Island',
    region:  'Preah Sihanouk Province',
    country: 'Cambodia',
    address: 'Koh Krabey Island, Preah Sihanouk Province, Cambodia',
  },
  priceFrom: 'POA',

  heroImage: I('DJI_20240519072805_0089_D-Enhanced-NR.jpg'),
  heroStats: [
    { value: '40',        label: 'Private Villas' },
    { value: '100',       label: 'Max Guests' },
    { value: 'Private',   label: 'Island' },
    { value: '5 km',      label: 'From Mainland' },
  ],

  galleryImages: [
    // Aerial & island
    { src: I('Krabey_Island_aerial_view-4500x3006-8fa955b.jpg'),                alt: 'Aerial view of Six Senses Krabey Island' },
    { src: I('Aerial_view_of_Krabey_Island_[8360-A4].jpg'),                      alt: 'Aerial view of the island' },
    { src: I('DJI_20240519113528_0120_D-Enhanced-NR.jpg'),                        alt: 'Drone shot over Krabey Island' },
    { src: I('Aerial_view_of_the_main_pool_[8363-A4].jpg'),                      alt: 'Aerial view of the main pool' },
    { src: I('Aerial_view_of_the_Khmer_House_[8366-A4].jpg'),                    alt: 'Aerial view of the Khmer House' },
    // Villas
    { src: I('Ocean_Pool_Villa_Suite_sunset_[7382-A4].jpg'),                     alt: 'Ocean Pool Villa Suite at sunset' },
    { src: I('Ocean_Pool_Villa_Suite2_[7375-A4].jpg'),                           alt: 'Ocean Pool Villa Suite' },
    { src: I('Private_Sundeck_of_Ocean_Pool_Villa_[8354-A4].jpg'),               alt: 'Private sundeck of the Ocean Pool Villa' },
    { src: I('Ocean_Pool_Villa_Suite_bedroom-7952x5304-364164d.jpg'),            alt: 'Ocean Pool Villa Suite bedroom' },
    { src: I('The Beach Retreat-7952x5304-364164d.jpg'),                         alt: 'The Beach Retreat villa' },
    { src: I('Copy of The Beach Retreat Aerial View 2-4500x2999-07588e5.jpg'),   alt: 'Beach Retreat aerial view' },
    { src: I('Outdoor_bathtub_at_The_Beach_Retreat_[8277-A4].jpg'),              alt: 'Outdoor bathtub at The Beach Retreat' },
    { src: I('Hideaway Pool Villa Suite-4500x3000-4cf3e1a.jpg'),                 alt: 'Hideaway Pool Villa Suite' },
    { src: I('Oceanfront_Two-bedroom_Pool_Villa-7952x5304-364164d.jpg'),         alt: 'Oceanfront Two-bedroom Pool Villa' },
    // Pool & beach
    { src: I('Main_pool_[8371-A4].jpg'),                                          alt: 'Main pool at Six Senses Krabey Island' },
    { src: I('krabey-island-cambodia_Main_beach-4500x3000-4cf3e1a.jpg'),         alt: 'Main beach at Krabey Island' },
    { src: I('Boardwalk_sunset_[7383-A4].jpg'),                                   alt: 'Boardwalk at sunset' },
    { src: I('Boardwalk1_[8316-A4].jpg'),                                          alt: 'Resort boardwalk' },
    // Dining
    { src: I('Romantic_boardwalk_dinner_[8279-A4].jpg'),                         alt: 'Private boardwalk dinner' },
    { src: I('Romantic_boardwalk_dinner_[8340-A4].jpg'),                          alt: 'Romantic boardwalk dinner at night' },
    { src: I('AHA_Restaurant-Terrace_[8335-A4].jpg'),                             alt: 'AHA Restaurant terrace' },
    { src: I('Tree_Restaurant_[8255-A4].jpg'),                                    alt: 'Tree Restaurant' },
    { src: I('Sunset_Bar1_[8254-A4].jpg'),                                        alt: 'Sunset Bar' },
    // Wellness & spa
    { src: I('Yoga_on_the_Rocks_[8357-A4].jpg'),                                  alt: 'Yoga on the rocks' },
    { src: I('Yoga_rooftop_pavilion1_[8347-A4].jpg'),                             alt: 'Yoga rooftop pavilion' },
    { src: I('SixSensesKrabeyIslandSpa.jpg'),                                     alt: 'Six Senses Spa' },
    { src: I('Six_Senses_Spa_Treatment_Room_[8252-A4].jpg'),                      alt: 'Six Senses Spa treatment room' },
    { src: I('Bamboo Massage.jpg'),                                                alt: 'Bamboo massage treatment' },
    { src: I('Hydrotherapy_pool2_[8319-A4].jpg'),                                 alt: 'Hydrotherapy pool' },
    // Activities
    { src: I('Snorkeling_[8305-A4].jpg'),                                         alt: 'Snorkelling off Krabey Island' },
    { src: I('Surf_ski1_[8306-A4].jpg'),                                          alt: 'Water sports on the ocean' },
    { src: I('Khmer_cooking_class_[8365-A4].jpg'),                                alt: 'Khmer cooking class' },
    { src: I('Beach_picnic_at_Koh_Ta_Kiev_with_models_[8299-A4].jpg'),           alt: 'Private beach picnic' },
    // Architecture & arrival
    { src: I('Lobby_[8422-A4].jpg'),                                              alt: 'Resort lobby' },
    { src: I('Arrival_pavilion_[8367-A4].jpg'),                                   alt: 'Arrival pavilion' },
    { src: I('Banyan_tree_[8315-A4].jpg'),                                        alt: 'Banyan tree on the estate' },
    // Weddings
    { src: I('6Z6A9594.jpg'),                                                     alt: 'Wedding at Six Senses Krabey Island' },
    { src: I('6Z6A9599-Enhanced-NR.jpg'),                                         alt: 'Wedding ceremony' },
    { src: I('A17I2625.jpg'),                                                     alt: 'Wedding celebration' },
    { src: I('A17I2745.jpg'),                                                     alt: 'Wedding reception' },
  ],
  totalPhotoCount: 40,
  videos: [],

  keyStats: [
    { value: '40',      label: 'Private Villas',   sub: 'overwater & beachfront'   },
    { value: '100',     label: 'Max Guests',        sub: 'for celebrations'         },
    { value: '100%',    label: 'Private Island',    sub: 'exclusively yours'        },
    { value: '5 km',    label: 'From Mainland',     sub: 'Preah Sihanouk'           },
    { value: '★',       label: 'Six Senses Spa',    sub: 'world-class wellness'     },
    { value: '∞',       label: 'Ocean Views',       sub: 'Gulf of Thailand'         },
  ],

  overview: {
    headline:      'A Private Island Sanctuary in the Gulf of Thailand',
    intro:         'Six Senses Krabey Island is Cambodia\'s most intimate resort, 40 overwater and beachfront villas set across a pristine private island, united by extraordinary wellness, farm-to-table dining, and an exceptional weddings programme.',
    storyEyebrow:  'The Island Story',
    storyHeadline: 'An Island Transformed by Six Senses',
    storyImage:    I('Aerial_view_of_the_Khmer_House_[8313-A4].jpg'),
    storyBody:     'Koh Krabey Island sits in the warm waters of the Gulf of Thailand, just 5 kilometres from the shores of Preah Sihanouk Province. Once an untouched stretch of jungle and beach, the island was reimagined by Six Senses Hotels & Resorts as a place where nature and barefoot luxury could coexist. Today, the resort stands as one of Southeast Asia\'s most compelling luxury destinations, an escape where thatched-roof villas reach out over the water, jungle trails wind through untouched forest, and the rhythm of island life sets the pace for every day. For weddings and celebrations, the island can be taken over completely, making it one of the most exclusive and unique wedding venues in Asia.',
  },

  villas: {
    overwaterHero:  I('Ocean_Pool_Villa_Suite2_[7375-A4].jpg'),
    beachfrontHero: I('The Beach Retreat-7952x5304-364164d.jpg'),
    interior:       I('Ocean_Pool_Villa_Suite_bedroom-7952x5304-364164d.jpg'),
    terrace:        I('Private_Sundeck_of_Ocean_Pool_Villa_[8354-A4].jpg'),
    pool:           I('Hideaway Pool Villa Suite-4500x3000-4cf3e1a.jpg'),
    sunset:         I('Ocean_Pool_Villa_Suite_sunset-7980x5346-9fb6307.jpg'),
    twoBedroom:     I('Oceanfront_Two-bedroom_Pool_Villa-7952x5304-364164d.jpg'),
    boardwalk:      I('Boardwalk_sunset_[7383-A4].jpg'),
  },

  dining: {
    hero:    I('AHA_Restaurant_[8343-A4].jpg'),
    beach:   I('Romantic_boardwalk_dinner_[8340-A4].jpg'),
    kitchen: I('Tree_restaurant-open_kitchen_[8295-A4].jpg'),
    garden:  I('Khmer_cooking_class_[8365-A4].jpg'),
  },

  wellness: {
    spa:       I('SixSensesKrabeyIslandSpa.jpg'),
    yoga:      I('Yoga_on_the_Rocks_[8357-A4].jpg'),
    treatment: I('Six_Senses_Spa_Treatment_Room_[8252-A4].jpg'),
    pool:      I('Hydrotherapy_pool2_[8319-A4].jpg'),
    alchemy:   I('Alchemy_Bar_[8314-A4].jpg'),
    nature:    I('Nature_s_walk_[8322-A4].jpg'),
  },

  weddings: {
    hero:       I('6Z6A9594.jpg'),
    ceremony:   I('6Z6A9599-Enhanced-NR.jpg'),
    beach:      I('Beach_picnic_at_Koh_Ta_Kiev_with_models_[8299-A4].jpg'),
    reception:  I('Romantic_boardwalk_dinner_with_host_[8293-A4].jpg'),
    couple:     I('6Z6A9711.jpg'),
    detail1:    I('6Z6A9724.jpg'),
    detail2:    I('6Z6A9740.jpg'),
    setup:      I('A17I2625.jpg'),
    enquireImg: I('Romantic_boardwalk_dinner_[8279-A4].jpg'),
  },

  sectionIntros: {
    overview:  'Six Senses Krabey Island is Cambodia\'s most intimate resort, 40 overwater and beachfront villas set across a pristine private island, united by extraordinary wellness, farm-to-table dining, and an exceptional weddings programme.',
    villas:    '40 overwater and beachfront villas, each with private pool, open-air bathroom, and unobstructed views across the Gulf of Thailand, designed to blur the boundary between inside and ocean.',
    dining:    'Chef-driven, produce-led menus rooted in Cambodian flavour, from barefoot beach dinners to candlelit tables in the jungle, every meal is shaped by the island around it.',
    wellness:  'The Six Senses Spa Krabey Island is built on the philosophy of longevity, combining ancient Cambodian healing traditions with cutting-edge biohacking and personalised wellness programmes.',
    weddings:  'Every wedding at Six Senses Krabey Island is an island to yourself, a completely private backdrop of ocean, jungle, and sky, shaped entirely by you.',
  },

  contact: {
    phone: '+855 69 944 888',
    email: 'reservations-krabey@sixsenses.com',
    website: 'https://www.sixsenses.com/en/hotels/krabey-island',
  },

  factChecked: false,
  approved: false,
  lastReviewedAt: null,
  lastUpdatedAt: null,
  refreshStatus: 'current',
  refreshNotes: '',
};

// ── SectionHeader ──────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, light = false, center = false, P = C }) {
  const { isMobile } = useBreakpoint();
  const textColor  = light ? '#f5f2ec' : P.text;
  const mutedColor = light ? 'rgba(245,242,236,0.55)' : P.muted;
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
function Section({ id, bg = '#faf9f6', children, pad }) {
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
function BreadcrumbBar({ venue, onBack, onGoDestination, P = C }) {
  const country     = venue?.location?.country || '';
  const countrySlug = country.toLowerCase().replace(/\s+/g, '-');
  const venueName   = venue?.name || '';

  const crumbs = [
    { label: '← Back to listing', onClick: onBack },
    { label: 'Destinations',       onClick: () => onGoDestination?.('') },
    { label: country,              onClick: () => onGoDestination?.(countrySlug) },
    { label: venueName,            current: true },
  ];

  return (
    <div style={{
      background: P.cream,
      borderBottom: `1px solid ${P.border}`,
      padding: '0 32px',
      height: 40,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      position: 'relative',
      zIndex: 10,
    }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && (
            <span style={{ fontFamily: NU, fontSize: 10, color: P.muted, userSelect: 'none' }}>›</span>
          )}
          {crumb.current ? (
            <span style={{ fontFamily: NU, fontSize: 11, color: P.text, fontWeight: 600, letterSpacing: '0.02em' }}>
              {crumb.label}
            </span>
          ) : (
            <button
              onClick={crumb.onClick}
              style={{
                fontFamily: NU, fontSize: 11, color: P.muted,
                background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontWeight: 400, letterSpacing: '0.02em',
                transition: 'color 0.2s',
              }}
              onMouseEnter={e => (e.currentTarget.style.color = P.text)}
              onMouseLeave={e => (e.currentTarget.style.color = P.muted)}
            >
              {crumb.label}
            </button>
          )}
        </span>
      ))}

      {/* View Listing link, far right */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <a
          href="/wedding-venues/six-senses-krabey-island"
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
const SSKRABEY_NAV = [
  { id: 'overview', label: 'Overview'  },
  { id: 'villas',   label: 'Villas'    },
  { id: 'dining',   label: 'Dining'    },
  { id: 'wellness', label: 'Wellness'  },
  { id: 'weddings', label: 'Weddings'  },
];

function StickyVenueNav({ venue, activeSection, onScrollTo, onVisibilityChange, P = C }) {
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
      background: P === C_DARK ? 'rgba(10,10,8,0.97)' : 'rgba(249,247,242,0.97)',
      backdropFilter: 'blur(12px)',
      borderBottom: `1px solid ${P.border}`,
      boxShadow: '0 2px 20px rgba(0,0,0,0.06)',
      transform: visible ? 'translateY(0)' : 'translateY(-100%)',
      transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      display: 'flex', alignItems: 'center',
      height: 56,
      padding: isMobile ? '0 16px' : '0 32px',
    }}>
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 'auto' }}>
        <span style={{ fontFamily: GD, fontSize: 15, color: P.text, letterSpacing: '0.01em' }}>
          {venue.name}
        </span>
        {!isMobile && (
          <span style={{ fontFamily: NU, fontSize: 11, color: P.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Six Senses Hotels & Resorts
          </span>
        )}
      </div>

      {/* Section pills, desktop */}
      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4 }}>
          {SSKRABEY_NAV.map(item => (
            <button
              key={item.id}
              onClick={() => onScrollTo(item.id)}
              style={{
                background: 'none', border: 'none',
                fontFamily: NU, fontSize: 13,
                fontWeight: activeSection === item.id ? 700 : 500,
                color: activeSection === item.id ? P.text : P.muted,
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
          href="/wedding-venues/six-senses-krabey-island"
          style={{
            marginLeft: 8,
            fontFamily: NU, fontSize: 11, fontWeight: 600,
            letterSpacing: '0.08em', textTransform: 'uppercase',
            color: P.muted, textDecoration: 'none',
            padding: '9px 14px', borderRadius: 4,
            border: `1px solid ${P.border}`,
            transition: 'color 0.2s, border-color 0.2s',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = P.text; e.currentTarget.style.borderColor = P.text; }}
          onMouseLeave={e => { e.currentTarget.style.color = P.muted; e.currentTarget.style.borderColor = P.border; }}
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
    <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 600, background: C.ocean }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${venue.heroImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 55%',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.08) 0%, rgba(0,0,0,0.04) 40%, rgba(0,0,0,0.72) 100%)',
      }} />
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: isMobile ? '0 24px 40px' : '0 64px 52px',
      }}>
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.18em', color: 'rgba(255,255,255,0.75)',
          textTransform: 'uppercase', margin: '0 0 12px',
        }}>
          {venue.location.region} · {venue.location.country}
        </p>
        <h1 style={{
          fontFamily: GD, fontSize: isMobile ? 38 : 72,
          fontWeight: 400, color: '#ffffff',
          margin: '0 0 8px', lineHeight: 1.0,
          textShadow: '0 2px 32px rgba(0,0,0,0.45)',
        }}>
          {venue.name}
        </h1>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 13 : 15,
          color: 'rgba(255,255,255,0.6)',
          margin: '0 0 4px', fontStyle: 'italic',
          letterSpacing: '0.04em',
        }}>
          Six Senses Hotels & Resorts
        </p>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 15 : 18,
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 32px', maxWidth: 560, lineHeight: 1.6,
        }}>
          {venue.tagline}
        </p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 16 : 32, alignItems: 'center' }}>
          {venue.heroStats.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontFamily: GD, fontSize: isMobile ? 20 : 26, color: '#fff', lineHeight: 1 }}>{s.value}</span>
              <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.6)', textTransform: 'uppercase', letterSpacing: '0.08em', lineHeight: 1.3 }}>{s.label}</span>
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
        <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', writingMode: 'vertical-lr' }}>
          Scroll
        </span>
      </div>
    </section>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function SixSensesShowcasePage({ onBack, onGoDestination, onNavigateStandard, onNavigateAbout, darkMode = false, onToggleDark }) {
  const { isMobile } = useBreakpoint();
  const [activeSection, setActiveSection] = useState('overview');
  const [stickyVisible, setStickyVisible] = useState(false);
  const venue = SSKRABEY_VENUE;
  const P = darkMode ? C_DARK : C;

  // Section scroll spy
  useEffect(() => {
    const sections = ['overview', 'villas', 'dining', 'wellness', 'weddings', 'enquire'];
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

  // Scroll to section
  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div style={{ background: P.cream, color: P.text, fontFamily: NU, paddingTop: 64 }}>

      {/* ── Site nav, slides out when StickyVenueNav takes over ─────────── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 699,
        transform: stickyVisible ? 'translateY(-110%)' : 'translateY(0)',
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        <HomeNav
          darkMode={darkMode}
          onToggleDark={onToggleDark}
          onVendorLogin={null}
          onNavigateStandard={onNavigateStandard}
          onNavigateAbout={onNavigateAbout}
          hasHero={false}
        />
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <BreadcrumbBar venue={venue} onBack={onBack} onGoDestination={onGoDestination} P={P} />

      {/* ── Sticky venue nav ─────────────────────────────────────────────── */}
      <StickyVenueNav
        venue={venue}
        activeSection={activeSection}
        onScrollTo={scrollTo}
        onVisibilityChange={setStickyVisible}
        P={P}
      />

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <HeroSection venue={venue} />

      {/* ── Gallery + Video block ─────────────────────────────────────────── */}
      <div style={{ background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '24px 16px' : '28px 64px' }}>
          <ThemeCtx.Provider value={LIGHT}>
            <MediaBlock
              videos={venue.videos || []}
              gallery={(venue.galleryImages || []).map((img, i) => ({
                id:    img.id  || `sskrabey-img-${i}`,
                src:   img.src || '',
                alt:   img.alt || img.title || '',
                title: img.title || '',
              }))}
            />
          </ThemeCtx.Provider>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 1, OVERVIEW
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="overview" bg={P.cream}>
        <SectionHeader
          eyebrow={`${venue.location.region} · ${venue.location.country}`}
          title={venue.overview.headline}
          subtitle={venue.sectionIntros?.overview || venue.overview.intro}
          P={P}
        />
        <VenueStatsCard data={{
          variant:  'strip',
          accentBg: '#ffffff',
          theme:    darkMode ? 'dark' : 'light',
          stats:    venue.keyStats,
        }} />
        <div style={{ marginTop: 40 }}>
          <TwoColumnEditorialCard data={{
            variant:  'image-left',
            accentBg: P.cream,
            theme:    darkMode ? 'dark' : 'light',
            image:    venue.overview.storyImage,
            eyebrow:  venue.overview.storyEyebrow,
            title:    venue.overview.storyHeadline,
            body:     venue.overview.storyBody,
            cta:      { label: 'Discover the Island →', href: '#villas' },
          }} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2, VILLAS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="villas" bg={P.white || '#ffffff'}>
        <SectionHeader
          eyebrow="Accommodation"
          title="40 Villas. Ocean, Beach & Jungle."
          subtitle={venue.sectionIntros?.villas || "40 overwater and beachfront villas, each with private pool, open-air bathroom, and unobstructed views across the Gulf of Thailand, designed to blur the boundary between inside and ocean."}
          P={P}
        />

        {/* Overwater villa feature */}
        <div style={{ marginBottom: 4 }}>
          <FeatureCard data={{
            image:    venue.villas.overwaterHero,
            variant:  'image-left',
            accentBg: C.ocean,
            theme:    'dark',
            category: 'Overwater Villas · Up to 2 guests',
            title:    'Suspended Over the Gulf',
            excerpt:  'Six Senses Krabey Island\'s overwater villas extend out from the island on stilts, with glass-floored living areas, private infinity plunge pools, and direct ladder access to the sea below. Fall asleep to the sound of the tide and wake to the sunrise over the Gulf of Thailand.',
          }} />
        </div>

        {/* Beachfront villa feature */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image:    venue.villas.beachfrontHero,
            variant:  'image-right',
            accentBg: '#1a1a14',
            theme:    'dark',
            category: 'Beachfront Pool Villas · Up to 4 guests',
            title:    'Private Beach at Your Door',
            excerpt:  'The beachfront pool villas sit directly on the sand, each with a generous private pool, thatched-roof living pavilion, and stepped garden leading to the shore. Among the most sought-after for honeymooners and private buyouts.',
          }} />
        </div>

        {/* Wide villa image */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 300 : 420, overflow: 'hidden' }}>
          <img
            src={venue.villas.terrace}
            alt="Villa terrace at Six Senses Krabey Island"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '20px 24px' : '28px 52px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 100%)',
          }}>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 22 : 30, color: '#fff', margin: 0, fontWeight: 400, fontStyle: 'italic' }}>
              "Where the horizon dissolves into the Gulf of Thailand."
            </p>
          </div>
        </div>

        {/* Villa features mosaic */}
        <div style={{ marginTop: 4 }}>
          <MosaicCard data={{
            theme:    darkMode ? 'dark' : 'light',
            accentBg: P.ivory,
            images:   [
              venue.villas.interior,
              venue.villas.pool,
              venue.villas.sunset,
              venue.villas.boardwalk,
            ],
            title:   'Every Villa a Private Sanctuary',
            excerpt: 'Handcrafted teak furniture, open-air bathrooms with jungle canopy views, private infinity pools, and curated Six Senses amenities, every detail considered, nothing left to chance.',
          }} />
        </div>

        {/* Villas carousel */}
        <div style={{ marginTop: 56 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 20px' }}>
            Villa Categories
          </p>
          <CarouselRow items={[
            { image: venue.villas.overwaterHero,  title: 'Ocean Pool Villa Suite',   category: 'Plunge pool · Ocean views',   theme: 'dark' },
            { image: venue.villas.beachfrontHero, title: 'The Beach Retreat',        category: 'Private pool · Beach access', theme: 'dark' },
            { image: venue.villas.pool,           title: 'Hideaway Pool Villa',      category: 'Private pool · Garden',       theme: 'dark' },
            { image: venue.villas.twoBedroom,     title: 'Two-Bedroom Pool Villa',   category: 'Families & groups',           theme: 'dark' },
            { image: venue.villas.sunset,         title: 'Sunset Villa',             category: 'West-facing · Sunset views',  theme: 'dark' },
          ]} />
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3, DINING
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="dining" bg={C.jungle} pad={isMobile ? '64px 24px' : '96px 64px'}>
        <SectionHeader
          eyebrow="Dining · Farm to Table · Ocean to Plate"
          title="A Kitchen Rooted in Cambodia"
          subtitle={venue.sectionIntros?.dining || "Chef-driven, produce-led menus rooted in Cambodian flavour, from barefoot beach dinners to candlelit tables in the jungle, every meal is shaped by the island around it."}
          light
          P={P}
        />

        <TwoColumnEditorialCard data={{
          variant:  'image-right',
          accentBg: '#131c14',
          theme:    'dark',
          image:    venue.dining.hero,
          eyebrow:  'The Restaurant · Farm-to-Table Philosophy',
          title:    'The Island Table',
          body:     'Six Senses Krabey Island\'s culinary philosophy is built on the same principles as every Six Senses property, organic where possible, local always, and deeply respectful of the flavours of place. Chefs work with the resort\'s own organic garden, local Cambodian fishermen, and regional small-scale producers to create menus that change with the tides and the seasons. From sunrise breakfasts on your villa terrace to multi-course candlelit dinners on the beach, every meal is a celebration of the island\'s extraordinary natural larder.',
          cta:      { label: 'Explore dining ↗', href: venue.contact.website },
        }} />

        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: '#0d1a1f',
            theme:    'dark',
            quote:    'The best luxury is knowing exactly where your food came from and the story behind every ingredient on your plate.',
            attribution:     'Six Senses Krabey Island',
            attributionRole: 'Culinary Philosophy',
          }} />
        </div>

        {/* Dining beach full-bleed */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 280 : 380, overflow: 'hidden', borderRadius: 2 }}>
          <img
            src={venue.dining.beach}
            alt="Beach dining at Six Senses Krabey Island"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 50%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            padding: isMobile ? '20px 24px' : '28px 48px',
            background: 'linear-gradient(to top, rgba(5,12,10,0.78) 0%, transparent 60%)',
          }}>
            <div>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 6px' }}>
                Private Beach Dinners · Island Garden
              </p>
              <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.85)', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
                Dine with your feet in the sand, under the stars, with the sound of the Gulf of Thailand and a menu composed just for you.
              </p>
            </div>
          </div>
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4, WELLNESS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="wellness" bg={P.cream}>
        <SectionHeader
          eyebrow="Six Senses Spa · Longevity · Wellbeing"
          title="The World's Most Immersive Wellness Experience"
          subtitle={venue.sectionIntros?.wellness || "The Six Senses Spa Krabey Island is built on the philosophy of longevity, combining ancient Cambodian healing traditions with cutting-edge biohacking and personalised wellness programmes."}
          P={P}
        />

        {/* Spa feature */}
        <div style={{ marginBottom: 4 }}>
          <ImageOverlayCard data={{
            image:    venue.wellness.spa,
            theme:    'dark',
            category: 'Six Senses Spa · Krabey Island',
            title:    'Healing at the Edge of the Ocean',
            excerpt:  'Set within open-sided jungle pavilions, the Six Senses Spa on Krabey Island offers a comprehensive menu of traditional Cambodian treatments, Ayurvedic therapies, advanced biohacking, and personalised longevity programmes, guided by Six Senses\' world-renowned wellness experts.',
            variant:  'floating-box',
          }} />
        </div>

        {/* Wellness carousel */}
        <div style={{ marginTop: 32 }}>
          <CarouselRow items={[
            { image: venue.wellness.spa,       title: 'Six Senses Spa',        category: 'Full treatment menu',         theme: 'dark' },
            { image: venue.wellness.yoga,      title: 'Yoga & Meditation',     category: 'Daily classes · All levels',  theme: 'dark' },
            { image: venue.wellness.treatment, title: 'Longevity Programme',   category: 'Personalised & immersive',    theme: 'dark' },
            { image: venue.wellness.pool,      title: 'Hydrotherapy Pool',     category: 'Thermal & cold therapy',      theme: 'dark' },
            { image: venue.wellness.alchemy,   title: 'Alchemy Bar',           category: 'Natural remedies & tonics',   theme: 'dark' },
            { image: venue.wellness.nature,    title: "Nature's Walk",         category: 'Guided island trails',        theme: 'dark' },
          ]} />
        </div>

        <div style={{ marginTop: 40 }}>
          <TwoColumnEditorialCard data={{
            variant:  'image-left',
            accentBg: P.ivory,
            theme:    darkMode ? 'dark' : 'light',
            image:    venue.wellness.yoga,
            eyebrow:  'Wellness Philosophy',
            title:    'Ancient Wisdom, Modern Science',
            body:     'Six Senses Krabey Island\'s wellness programme draws on Cambodia\'s rich tradition of herbal medicine and holistic healing, layered with the science-backed longevity protocols that have made Six Senses Spas celebrated worldwide. Guests may choose a single treatment or a fully immersive multi-day programme, designed by Six Senses wellness experts around their specific health and longevity goals. Water sports, sunrise beach yoga, forest meditation, and ocean kayaking complete the offering.',
          }} />
        </div>

        {/* Wellness highlights */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 24 }}>
          {[
            { label: 'Six Senses Spa',            desc: 'Full menu of traditional Cambodian treatments, Ayurvedic therapies, and advanced longevity protocols.' },
            { label: 'Yoga & Meditation',          desc: 'Daily morning and sunset yoga in open-sided jungle pavilions, suitable for beginners and experienced practitioners.' },
            { label: 'Water Sports & Ocean',       desc: 'Snorkelling, kayaking, paddleboarding, and diving from the island\'s private beach and overwater jetty.' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '24px 28px',
              background: '#fff',
              border: `1px solid ${P.border}`,
              borderTop: `2px solid ${GOLD}`,
              borderRadius: 4,
            }}>
              <p style={{ fontFamily: NU, fontWeight: 700, fontSize: 13, color: P.text, letterSpacing: '0.04em', margin: '0 0 10px', textTransform: 'uppercase' }}>
                {item.label}
              </p>
              <p style={{ fontFamily: NU, fontSize: 14, color: P.muted, margin: 0, lineHeight: 1.7 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5, WEDDINGS
      ═══════════════════════════════════════════════════════════════════ */}
      <Section id="weddings" bg={C.ocean} pad={isMobile ? '64px 24px' : '96px 64px'}>
        <SectionHeader
          eyebrow="Weddings & Celebrations"
          title="An Entire Island, Exclusively Yours"
          subtitle={venue.sectionIntros?.weddings || "Every wedding at Six Senses Krabey Island is an island to yourself, a completely private backdrop of ocean, jungle, and sky, shaped entirely by you."}
          light
          P={P}
        />

        {/* Hero wedding image */}
        <div style={{ position: 'relative', width: '100%', height: isMobile ? 340 : 520, overflow: 'hidden', marginBottom: 4 }}>
          <img
            src={venue.weddings.hero}
            alt="Wedding at Six Senses Krabey Island"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(8,20,25,0.65) 100%)' }} />
        </div>

        {/* Wedding grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 4, marginBottom: 4 }}>
          {[venue.weddings.ceremony, venue.weddings.reception, venue.weddings.couple].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 220 : 300, overflow: 'hidden' }}>
              <img src={src} alt="Wedding at Six Senses Krabey Island" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* Wedding highlights */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>
          {[
            { icon: '🏝️', label: 'Full Island Exclusivity',       desc: 'The entire island is yours, all 40 villas, every beach, the spa, and every dining experience.' },
            { icon: '🌊', label: 'Ceremony Locations',             desc: 'Beachfront, overwater, jungle clearing, or clifftop, the island offers more ceremony backdrops than most countries.' },
            { icon: '🌿', label: 'Six Senses Wedding Team',        desc: 'A dedicated Six Senses wedding concierge plans every detail, from traditional Cambodian blessings to barefoot beach receptions.' },
            { icon: '✨', label: 'Completely Bespoke',             desc: 'No standard packages. Every wedding is designed from scratch, food, flowers, lighting, ceremony, music, all tailored to your story.' },
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: 16 }}>
              <span style={{ fontSize: 22, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <div>
                <p style={{ fontFamily: NU, fontWeight: 700, fontSize: 13, color: 'rgba(245,242,236,0.9)', letterSpacing: '0.02em', margin: '0 0 6px' }}>
                  {item.label}
                </p>
                <p style={{ fontFamily: NU, fontSize: 14, color: 'rgba(245,242,236,0.55)', margin: 0, lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Wedding image strip */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : '1fr 1fr 1fr 1fr', gap: 4, marginTop: 48 }}>
          {[venue.weddings.detail1, venue.weddings.detail2, venue.weddings.setup, venue.weddings.beach].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 160 : 220, overflow: 'hidden' }}>
              <img src={src} alt="Wedding detail at Six Senses Krabey Island" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div style={{ marginTop: 64 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 32px' }}>
            Weddings, Frequently Asked Questions
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '28px 48px' }}>
            {[
              {
                q: 'Can we have exclusive use of the whole island?',
                a: 'Yes. Six Senses Krabey Island can be taken on a full buyout basis, giving you exclusive access to all 40 villas, every beach, the spa, and all dining areas. The island accommodates up to 100 guests for celebrations.',
              },
              {
                q: 'What ceremony styles are available?',
                a: 'Symbolic beachfront ceremonies, traditional Cambodian Buddhist blessings, overwater ceremonies, jungle clearings, and cliff-top sunset settings. Your wedding concierge will help you choose the location that best matches your vision.',
              },
              {
                q: 'How far in advance should we book?',
                a: 'Given the limited availability and high demand for island buyouts, we recommend contacting the Six Senses wedding team at least 12–18 months before your preferred date.',
              },
              {
                q: 'What is the minimum guest count for a wedding?',
                a: 'Six Senses Krabey Island welcomes intimate weddings from 2 guests to full island buyouts of up to 100 guests. There is no minimum, and the island is just as magical for an elopement as for a grand celebration.',
              },
              {
                q: 'Does Six Senses Krabey Island handle all logistics?',
                a: 'Yes. The dedicated Six Senses events team manages all logistics, accommodation, transfers, catering, décor, ceremony setup, legal documentation, entertainment, and every last detail in between.',
              },
              {
                q: 'How do guests travel to the island?',
                a: 'Guests fly into Sihanoukville International Airport and then transfer by speedboat to the island, approximately 20 minutes from the mainland pier. The resort arranges all transfers.',
              },
            ].map((faq, i) => (
              <div key={i} style={{ borderTop: `1px solid rgba(245,242,236,0.12)`, paddingTop: 20 }}>
                <p style={{ fontFamily: NU, fontSize: 14, fontWeight: 700, color: 'rgba(245,242,236,0.9)', margin: '0 0 8px', lineHeight: 1.5 }}>
                  {faq.q}
                </p>
                <p style={{ fontFamily: NU, fontSize: 14, color: 'rgba(245,242,236,0.5)', margin: 0, lineHeight: 1.7 }}>
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
