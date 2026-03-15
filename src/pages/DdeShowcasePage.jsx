// ─── DdeShowcasePage.jsx ──────────────────────────────────────────────────────
// Showcase page, Domaine des Etangs, Auberge Collection
// Massignac · Charente · France
// Route: /showcase/domaine-des-etangs
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
import SiteFooter             from '../components/sections/SiteFooter';
import { useBreakpoint }      from '../hooks/useWindowWidth';
import { fetchVenueContent }  from '../services/venueContentService';

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
  forest: '#1c2318',
};

// ── Image helper, all images live in public/Domaine-des-Etangs-Auberge-Collection/
const I = (filename) => `/Domaine-des-Etangs-Auberge-Collection/${filename}`;

// ── Venue data ─────────────────────────────────────────────────────────────────
const DDE_VENUE = {
  name:     'Domaine des Etangs',
  heroSummary: 'Where art, nature and French country elegance converge',
  logo:     null,
  location: {
    town:    'Massignac',
    region:  'Charente',
    country: 'France',
    address: 'Le Bourg, 16310 Massignac, Charente, France',
  },
  priceFrom: '€15,000',

  heroImage: I('DDE_Exterior_Drone_2025_DJI_0745-HDR.jpg'),
  heroStats: [
    { value: '13th C',  label: 'Origins' },
    { value: '2,500',   label: 'Private Acres' },
    { value: '200',     label: 'Max Guests' },
    { value: '★ 1',     label: 'Michelin Star' },
  ],

  galleryImages: [
    { src: I('Ceremony Domainedesetangs-1.jpg'),           alt: 'Outdoor ceremony at Domaine des Etangs' },
    { src: I('DDE_Castle_Exteriors_2023_33.jpg'),          alt: 'The château façade at Domaine des Etangs' },
    { src: I('Wedding long table.jpg'),                    alt: 'Long wedding reception table' },
    { src: I('Castle courtyard.jpg'),                      alt: 'Castle courtyard garden' },
    { src: I('Signature-Suite-Venus-6.jpg'),               alt: 'Signature Vénus Suite' },
  ],
  totalPhotoCount: 55,
  videos: [],   // populated via Listing Studio media_items

  keyStats: [
    { value: '13th C',  label: 'Origins',       sub: 'Charente, France'  },
    { value: '29',      label: 'Rooms',          sub: 'inc. 6 cottages'   },
    { value: '200',     label: 'Max. Capacity',  sub: 'outdoor events'    },
    { value: '8+',      label: 'Event Spaces',   sub: 'each distinct'     },
    { value: '2,500',   label: 'Private Acres',  sub: 'lakes & forests'   },
    { value: '★ 1',     label: 'Michelin Star',  sub: 'Restaurant Dyades' },
  ],

  overview: {
    headline:          '2,500 Acres of Art, Lakes & French Country Elegance',
    intro:             'A 13th-century château set within 1,000 hectares of private forests, lakes, meadows, and sculpture-dotted parkland, one of the most extraordinary estate wedding venues in France.',
    storyEyebrow:      'The Domaine des Etangs Story',
    storyHeadline:     'From Medieval Fortification to Living Art Estate',
    storyImage:        I('DDE_Exteriors_Drone_2023_24.jpg'),
    storyBody:         'Founded as a fortified residence by the Dukes of Aquitaine in the 13th century, Domaine des Etangs has evolved across seven hundred years, from aristocratic stronghold to wheat farm, from neglected ruin to one of France\'s most celebrated private estates. The current neo-Gothic château was shaped in 1860 by the influence of architect Eugène Viollet-le-Duc. After a transformative restoration under Garance Primat, who closed the property entirely in 2013 to reimagine it as a living work of art, the Domaine reopened in 2015 as a five-star hotel. Today it is managed by Auberge Collection, and celebrated as Travel + Leisure\'s No. 2 hotel in France.',
  },

  spaces: {
    laLaiterieImage:   I('DDE_Events__Decoration-Setups_2023_Credit Manu Heslop (6).jpg'),
    octaveImage:       I('DDE_Events__Decoration-Setups_2023_33.jpg'),
    dragonBarnImage:   I('Dragon farm cottage (3).jpg'),
    gardensImage:      I('Castle gardens.jpg'),
    courtyardImage:    I('Castle courtyard.jpg'),
    ceremonyImage:     I('Ceremony Domainedesetangs-7a.jpg'),
    weddingTableImage: I('Honor table.jpg'),
    decorImage:        I('DDE_Events__Decoration-Setups_2023_Credit Manu Heslop (13).jpg'),
  },

  dining: {
    hero:     I('DDE_Dine_Dyades_YC-2019-Terrasse-Dyades-19.jpg'),
    food1:    I('DDE_Events__Decoration-Setups_2023_40.jpg'),
    garden:   I('DDE_Exteriors_Vegetable garden_lin-25.jpg'),
  },

  rooms: {
    venus:     I('Signature-Suite-Venus-6.jpg'),
    soleil:    I('Prestige Suite Soleil (4).jpg'),
    saturne:   I('Prestige room Saturne (6) (1).jpg'),
    lounge:    I('Salon Famille.jpg'),
    pegase:    I('Pegase-farm-cottage.jpg'),
    cottages:  I('Cottages-Pegase-Cassiopee.jpg'),
    dragon:    I('Dragon farm cottage (3).jpg'),
    longere:   I('DDE_Longere_Exteriors_2023.jpg'),
    pool:      I('Indoor-pool-Yorrick.jpg'),
  },

  art: {
    installation: I('DDE_Art_Rondinone_Sun.jpg'),
    exterior:     I('DDE_Castle_Exteriors_2023_39 (1).jpg'),
    nature:       I('DDE_Exteriors_Nature_2022_sol-37.jpg'),
  },

  weddings: {
    hero:       I('Wedding-Credit Chloe Fayollas-260.jpg'),
    ceremony1:  I('Ceremony Domainedesetangs-5a.jpg'),
    ceremony2:  I('Ceremony.jpg'),
    reception1: I('DDE_Events_Birthday_Rose_CreditYannFalempin_2025_36.jpg'),
    reception2: I('DDE_Events_Birthday_Rose_CreditYannFalempin_2025_38.jpg'),
    detail1:    I('wedding-Credit Chloe Fayollas-713.jpg'),
    detail2:    I('wedding-Credit Chloe Fayollas-716.jpg'),
    detail3:    I('wedding-Credit Chloe Fayollas-720.jpg'),
    setup:      I('DDE_Events__Decoration-Setups_2023_21.jpg'),
  },

  // ── Dynamic section intro text (fallback to hardcoded defaults if missing)
  sectionIntros: {
    overview: 'A 13th-century château set within 1,000 hectares of private forests, lakes, meadows, and sculpture-dotted parkland, one of the most extraordinary estate wedding venues in France.',
    spaces: 'From an intimate lakeside chapel to a 200 m² stone barn, each space at Domaine des Etangs carries centuries of character, and a contemporary soul.',
    dining: "Chef Matthieu Pasgrimaud builds every menu around the Domaine's own organic kitchen garden, inventive, terroir-driven, and rooted in the seasons of Charente.",
    rooms: "Each of the 29 rooms and cottages at Domaine des Etangs echoes the estate's character, stone fireplaces, hand-woven textiles, and views onto the lakes and gardens.",
    art: 'A rotating programme of contemporary sculpture and site-specific installations transforms the estate into an open-air gallery.',
    weddings: 'Every wedding at Domaine des Etangs is designed to feel entirely unique, shaped by your story, your guests, and the landscape itself.',
  },

  // ── Dynamic section visibility (control which sections are shown)
  sectionVisibility: {
    overview: true,
    spaces: true,
    dining: true,
    rooms: true,
    art: true,
    weddings: true,
  },

  // ── Approval & content freshness (internal metadata)
  factChecked: false,
  approved: false,
  lastReviewedAt: null,
  lastUpdatedAt: null,
  refreshStatus: 'current',
  refreshNotes: '',
};

// ── SectionHeader ──────────────────────────────────────────────────────────────
function SectionHeader({ eyebrow, title, subtitle, light = false, center = false }) {
  const { isMobile } = useBreakpoint();
  const textColor  = light ? '#f5f2ec' : C.text;
  const mutedColor = light ? 'rgba(245,242,236,0.55)' : C.muted;
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

// ── ApprovedBadge ──────────────────────────────────────────────────────────
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

// ── Utility: Format date to "Month Year" ────────────────────────────────────
function formatMonthYear(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('en-US', options);
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
function BreadcrumbBar({ venue, onBack, onGoDestination }) {
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
      {crumbs.map((crumb, i) => (
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

      {/* View Listing link, far right */}
      <div style={{ marginLeft: 'auto', flexShrink: 0 }}>
        <a
          href="/wedding-venues/domaine-des-etangs"
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
const DDE_NAV = [
  { id: 'overview', label: 'Overview'  },
  { id: 'spaces',   label: 'Spaces'    },
  { id: 'dining',   label: 'Dining'    },
  { id: 'rooms',    label: 'Rooms'     },
  { id: 'art',      label: 'Art'       },
  { id: 'weddings', label: 'Weddings'  },
];

function StickyVenueNav({ venue, activeSection, onScrollTo, onVisibilityChange }) {
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

  // Filter NAV_ITEMS based on section visibility
  const visibleNavItems = DDE_NAV.filter(
    item => venue.sectionVisibility?.[item.id] !== false
  );

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
      {/* Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0, marginRight: 'auto' }}>
        <span style={{ fontFamily: GD, fontSize: 15, color: C.text, letterSpacing: '0.01em' }}>
          {venue.name}
        </span>
        {!isMobile && (
          <span style={{ fontFamily: NU, fontSize: 11, color: C.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            Auberge Collection
          </span>
        )}
      </div>

      {/* Section pills, desktop */}
      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4 }}>
          {visibleNavItems.map(item => (
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

      {/* View Listing link, desktop only */}
      {!isMobile && (
        <a
          href="/wedding-venues/domaine-des-etangs"
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
    <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 600, background: C.forest }}>
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url("${venue.heroImage}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 50%',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.68) 100%)',
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
          fontFamily: GD, fontSize: isMobile ? 42 : 76,
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
          Auberge Collection
        </p>
        <p style={{
          fontFamily: NU, fontSize: isMobile ? 15 : 18,
          color: 'rgba(255,255,255,0.75)',
          margin: '0 0 32px', maxWidth: 520, lineHeight: 1.6,
        }}>
          {venue.heroSummary || 'Where art, nature and French country elegance converge'}
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
export default function DdeShowcasePage({ onBack, onGoDestination, onNavigateStandard, onNavigateAbout }) {
  const { isMobile } = useBreakpoint();
  const [activeSection, setActiveSection] = useState('overview');
  const [stickyVisible, setStickyVisible] = useState(false);
  const [venueContent, setVenueContent] = useState(null);

  // Merge static venue with dynamic content
  const venue = venueContent
    ? {
        ...DDE_VENUE,
        heroSummary: venueContent.heroSummary || DDE_VENUE.heroSummary,
        sectionIntros: { ...DDE_VENUE.sectionIntros, ...venueContent.sectionIntros },
        sectionVisibility: { ...DDE_VENUE.sectionVisibility, ...venueContent.sectionVisibility },
        factChecked: venueContent.factChecked,
        approved: venueContent.approved,
        lastReviewedAt: venueContent.lastReviewedAt,
      }
    : DDE_VENUE;

  // Fetch venue content from database on mount
  useEffect(() => {
    const loadVenueContent = async () => {
      try {
        // Assuming we have a venue_id from DDE_VENUE or from route params
        // For now, we'll use a placeholder - this would be fetched from the listing
        const content = await fetchVenueContent(DDE_VENUE.listingId);
        if (content && !content._offline) {
          setVenueContent(content);
        }
      } catch (err) {
        console.error('Failed to load venue content:', err);
        // Gracefully fall back to static data
      }
    };
    loadVenueContent();
  }, []);

  // Section scroll spy
  useEffect(() => {
    const sections = ['overview', 'spaces', 'dining', 'rooms', 'art', 'weddings', 'enquire'];
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
    <div style={{ background: C.cream, fontFamily: NU, paddingTop: 64 }}>

      {/* ── Site nav, slides out when StickyVenueNav takes over ─────────── */}
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
        />
      </div>

      {/* ── Breadcrumb ────────────────────────────────────────────────────── */}
      <BreadcrumbBar venue={venue} onBack={onBack} onGoDestination={onGoDestination} />

      {/* ── Sticky venue nav ─────────────────────────────────────────────── */}
      <StickyVenueNav
        venue={venue}
        activeSection={activeSection}
        onScrollTo={scrollTo}
        onVisibilityChange={setStickyVisible}
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
                id:    img.id  || `dde-img-${i}`,
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
      {venue.sectionVisibility?.overview !== false && (
        <Section id="overview" bg={C.cream}>
          <SectionHeader
            eyebrow={`${venue.location.town} · ${venue.location.country}`}
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
              cta:      { label: 'Explore the Estate →', href: '#spaces' },
            }} />
          </div>
        </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 2, EVENT SPACES
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.spaces !== false && (
      <Section id="spaces" bg="#ffffff">
        <SectionHeader
          eyebrow="Event Spaces"
          title="Eight Distinct Spaces. One Private Estate."
          subtitle={venue.sectionIntros?.spaces || "From an intimate lakeside chapel to a 200 m² stone barn, each space at Domaine des Etangs carries centuries of character, and a contemporary soul."}
        />

        {/* La Laiterie, the former dairy */}
        <div style={{ marginBottom: 4 }}>
          <FeatureCard data={{
            image:    venue.spaces.laLaiterieImage,
            variant:  'image-left',
            accentBg: C.forest,
            theme:    'dark',
            category: 'La Laiterie · Up to 90 guests',
            title:    'The Dairy Gallery',
            excerpt:  'A former stone dairy transformed into an elegant, blank-canvas reception hall, exposed beams, white walls, and a permanent Yves Klein artwork. Steps from both the Château and the Longère.',
          }} />
        </div>

        {/* Octave, the stone barn */}
        <div style={{ marginTop: 4 }}>
          <FeatureCard data={{
            image:    venue.spaces.octaveImage,
            variant:  'image-right',
            accentBg: '#2a2420',
            theme:    'dark',
            category: 'Octave · Up to 90 guests',
            title:    'The Stone Barn',
            excerpt:  'A 200 m² former barn where pastures, forests, and lakes converge. Thick stone walls, a Tomas Saraceno sculpture overhead, and seamless indoor-outdoor flow to a lawn edged by orchard trees and vineyard vines.',
          }} />
        </div>

        {/* Wide ceremony photo */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 300 : 420, overflow: 'hidden' }}>
          <img
            src={venue.spaces.ceremonyImage}
            alt="Outdoor ceremony at Domaine des Etangs"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: isMobile ? '20px 24px' : '28px 52px',
            background: 'linear-gradient(to top, rgba(0,0,0,0.68) 0%, transparent 100%)',
          }}>
            <p style={{ fontFamily: GD, fontSize: isMobile ? 22 : 30, color: '#fff', margin: 0, fontWeight: 400, fontStyle: 'italic' }}>
              "A place where every detail reflects the art of living."
            </p>
          </div>
        </div>

        {/* Dragon Barn + Gardens, two-up mosaic */}
        <div style={{ marginTop: 4 }}>
          <MosaicCard data={{
            theme:   'light',
            accentBg: C.ivory,
            images: [
              venue.spaces.dragonBarnImage,
              venue.spaces.gardensImage,
              venue.spaces.courtyardImage,
              venue.spaces.weddingTableImage,
            ],
            title:   'Gardens, Courtyards & Hidden Spaces',
            excerpt: 'The Dragon Barn for relaxed lunches and creative workshops; the castle courtyard for afternoon teas and intimate ceremonies; the lake-facing gardens for cocktails beneath sculpture.',
          }} />
        </div>

        {/* Spaces carousel */}
        <div style={{ marginTop: 56 }}>
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: GOLD, textTransform: 'uppercase', margin: '0 0 20px' }}>
            All Event Spaces
          </p>
          <CarouselRow items={[
            { image: venue.spaces.laLaiterieImage,  title: 'La Laiterie',        category: 'Up to 90 guests',     theme: 'dark' },
            { image: venue.spaces.octaveImage,      title: 'Octave Barn',        category: 'Up to 90 guests',     theme: 'dark' },
            { image: venue.spaces.dragonBarnImage,  title: 'Dragon Barn',        category: 'Up to 50 guests',     theme: 'dark' },
            { image: venue.spaces.gardensImage,     title: 'Castle Gardens',     category: 'Up to 90 guests',     theme: 'dark' },
            { image: venue.spaces.courtyardImage,   title: 'Castle Courtyard',   category: 'Al fresco dining',    theme: 'dark' },
            { image: venue.spaces.decorImage,       title: 'The Terrace',        category: 'Cocktail receptions', theme: 'dark' },
          ]} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 3, DINING
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.dining !== false && (
      <Section id="dining" bg={C.forest} pad={isMobile ? '64px 24px' : '96px 64px'}>
        <SectionHeader
          eyebrow="Restaurant Dyades · 1 Michelin Star"
          title="A Kitchen Shaped by the Estate"
          subtitle={venue.sectionIntros?.dining || "Chef Matthieu Pasgrimaud builds every menu around the Domaine's own organic kitchen garden, inventive, terroir-driven, and rooted in the seasons of Charente."}
          light
        />

        <TwoColumnEditorialCard data={{
          variant:  'image-right',
          accentBg: '#1c2318',
          theme:    'dark',
          image:    venue.dining.hero,
          eyebrow:  'Dyades · Est. 2015',
          title:    'One Michelin Star, One Kitchen Garden',
          body:     'Restaurant Dyades earned its first Michelin star in 2016 and has held it continuously since. Chef Matthieu Pasgrimaud, trained at La Vague d\'Or and Daniel Boulud, sources approximately 25% of ingredients directly from the estate\'s permaculture potager. Dragonfly-motif tableware, Bernardaud plates, and a curated cellar complete a dining experience unlike any other in Charente.',
          cta:      { label: 'Discover the restaurant →', href: 'https://auberge.com/domaine-des-etangs/dine/' },
        }} />

        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: '#111a0e',
            theme:    'dark',
            quote:    'I wanted to create my own mythology while respecting the past, every element of this estate, including what we eat, must tell that story.',
            attribution:     'Garance Primat',
            attributionRole: 'Owner & Creator, Domaine des Etangs',
          }} />
        </div>

        {/* Kitchen garden full-bleed */}
        <div style={{ marginTop: 4, position: 'relative', width: '100%', height: isMobile ? 280 : 380, overflow: 'hidden', borderRadius: 2 }}>
          <img
            src={venue.dining.garden}
            alt="The organic kitchen garden at Domaine des Etangs"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 60%', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', alignItems: 'flex-end',
            padding: isMobile ? '20px 24px' : '28px 48px',
            background: 'linear-gradient(to top, rgba(15,25,12,0.75) 0%, transparent 60%)',
          }}>
            <div>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 6px' }}>
                The Potager · Organic Kitchen Garden
              </p>
              <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 16, color: 'rgba(255,255,255,0.85)', margin: 0, maxWidth: 520, lineHeight: 1.6 }}>
                A working permaculture garden that feeds the Michelin-starred kitchen, rated in the Ecotables top three for eco-responsible sourcing.
              </p>
            </div>
          </div>
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 4, ROOMS & COTTAGES
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.rooms !== false && (
      <Section id="rooms" bg={C.cream}>
        <SectionHeader
          eyebrow="Accommodation"
          title="29 Rooms Across a Private Universe"
          subtitle={venue.sectionIntros?.rooms || "Château suites named for celestial bodies, seasonal Longère apartments, and six constellation-named farmhouse cottages, each a private world within the estate."}
        />

        {/* Venus suite feature */}
        <div style={{ marginBottom: 4 }}>
          <ImageOverlayCard data={{
            image:    venue.rooms.venus,
            theme:    'dark',
            category: 'Château · Signature Suite',
            title:    'Suite Vénus',
            excerpt:  'Grand sitting rooms, copper bathtub, tower views, vaulted ceilings, and a working fireplace, the preferred honeymoon suite of the estate.',
            variant:  'floating-box',
          }} />
        </div>

        {/* Rooms carousel */}
        <div style={{ marginTop: 32 }}>
          <CarouselRow items={[
            { image: venue.rooms.soleil,   title: 'Suite Soleil',         category: 'Château · Prestige Suite',  theme: 'dark' },
            { image: venue.rooms.saturne,  title: 'Room Saturne',         category: 'Château · Prestige Room',   theme: 'dark' },
            { image: venue.rooms.lounge,   title: 'Family Salon',         category: 'Private living space',      theme: 'dark' },
            { image: venue.rooms.longere,  title: 'La Longère',           category: '4 seasonal suites',         theme: 'dark' },
            { image: venue.rooms.cottages, title: 'Pégase & Cassiopée',   category: 'Métairie Cottages',         theme: 'dark' },
            { image: venue.rooms.dragon,   title: 'Dragon Cottage',       category: '5-bedroom private cottage', theme: 'dark' },
            { image: venue.rooms.pool,     title: 'Le Moulin Spa & Pool', category: '12th-century water mill',   theme: 'dark' },
          ]} />
        </div>

        <div style={{ marginTop: 40 }}>
          <TwoColumnEditorialCard data={{
            variant:  'image-right',
            accentBg: C.ivory,
            theme:    'light',
            image:    venue.rooms.cottages,
            eyebrow:  'The Métairie Cottages',
            title:    'Six Private Cottages, Six Constellations',
            body:     'The six Métairie cottages, Dragon, Pégase, Serpentaire, Cassiopée, Centaure, and Licorne, each named for a constellation and housing between one and five bedrooms. All include oversized living rooms, fully equipped kitchens, private gardens, and electric cars for exploring the estate at your own pace.',
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 5, THE ART
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.art !== false && (
      <Section id="art" bg="#fff">
        <SectionHeader
          eyebrow="A Living Art Collection"
          title="The Estate as Gallery"
          subtitle={venue.sectionIntros?.art || "Curated by Garance Primat, the collection weaves Yves Klein, Olafur Eliasson, Henri Matisse, Richard Long, and Ugo Rondinone across every corner of the estate, from the château corridors to the lakeside sculpture park."}
        />

        {/* Art installation feature */}
        <div style={{ marginBottom: 4 }}>
          <FeatureCard data={{
            image:    venue.art.installation,
            variant:  'image-left',
            accentBg: '#0e0e0b',
            theme:    'dark',
            category: 'Ugo Rondinone · "The Sun"',
            title:    'Art Embedded in the Landscape',
            excerpt:  'The contemporary art collection is not confined to gallery walls, it inhabits the estate. Richard Long\'s Stone Circle borders the lake, a Tomas Saraceno net floats above the Octave Barn lawn, and Olafur Eliasson\'s light works illuminate the château interiors.',
          }} />
        </div>

        {/* Nature / exterior pairing */}
        <div style={{ marginTop: 4, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 4 }}>
          <div style={{ position: 'relative', height: isMobile ? 260 : 380, overflow: 'hidden' }}>
            <img src={venue.art.exterior} alt="Domaine des Etangs château exterior" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
          <div style={{ position: 'relative', height: isMobile ? 260 : 380, overflow: 'hidden' }}>
            <img src={venue.art.nature} alt="Domaine des Etangs natural landscape" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          </div>
        </div>

        <div style={{ marginTop: 4 }}>
          <QuoteCard data={{
            accentBg: '#1a1a18',
            theme:    'dark',
            quote:    'The estate has a sense of harmony, art and nature existing together, neither dominating the other.',
            attribution:     'Garance Primat',
            attributionRole: 'Creator, Domaine des Etangs',
          }} />
        </div>
      </Section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          SECTION 6, WEDDINGS
      ═══════════════════════════════════════════════════════════════════ */}
      {venue.sectionVisibility?.weddings !== false && (
      <Section id="weddings" bg={C.forest} pad={isMobile ? '64px 24px' : '96px 64px'}>
        <SectionHeader
          eyebrow="Weddings & Celebrations"
          title="A Fairytale Castle for Weddings"
          subtitle={venue.sectionIntros?.weddings || "Complete privacy across 2,500 acres. Michelin-starred catering. Eight distinct spaces. No noise restrictions. The entire estate is yours."}
          light
        />

        {/* Hero wedding image */}
        <div style={{ position: 'relative', width: '100%', height: isMobile ? 340 : 520, overflow: 'hidden', marginBottom: 4 }}>
          <img
            src={venue.weddings.hero}
            alt="Wedding at Domaine des Etangs"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center 40%', display: 'block' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(10,15,8,0.6) 100%)' }} />
        </div>

        {/* Wedding grid */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr 1fr', gap: 4, marginBottom: 4 }}>
          {[venue.weddings.ceremony1, venue.weddings.reception1, venue.weddings.detail1].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 220 : 300, overflow: 'hidden' }}>
              <img src={src} alt="Wedding at Domaine des Etangs" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>

        {/* Wedding highlights */}
        <div style={{ marginTop: 48, display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 32 }}>
          {[
            { icon: '🏰', label: 'Full Estate Exclusivity',     desc: 'All 29 rooms, 6 cottages, 8 event spaces, spa and grounds, exclusively yours.' },
            { icon: '⭐', label: 'Michelin-Starred Catering',    desc: 'Every wedding menu crafted by Chef Matthieu Pasgrimaud from estate-grown organic ingredients.' },
            { icon: '🎆', label: 'No Restrictions',              desc: 'No noise curfews, fireworks permitted, complete privacy across 2,500 acres of private land.' },
            { icon: '🎨', label: 'Art & Nature as Backdrop',     desc: 'Ceremonies and receptions set against Richard Long sculptures, lakeside gardens, and century-old forest.' },
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
          {[venue.weddings.detail2, venue.weddings.detail3, venue.weddings.setup, venue.weddings.ceremony2].map((src, i) => (
            <div key={i} style={{ position: 'relative', height: isMobile ? 160 : 220, overflow: 'hidden' }}>
              <img src={src} alt="Wedding detail at Domaine des Etangs" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            </div>
          ))}
        </div>
      </Section>
      )}

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
            image:     venue.weddings.reception2,
          },
          contact: {
            phone: '+33 5 45 61 93 66',
            email: 'dde.commercial@auberge.com',
          },
        }} />
      </section>

      <SiteFooter footerNav={{}} />
    </div>
  );
}
