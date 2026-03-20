// ─── src/pages/ListingProfilePage.jsx ─────────────────────────────────────────
// Data-driven venue listing profile for /wedding-venues/[slug]
//
// Architecture note:
//   /venue              → VenueProfile.jsx   (bespoke Villa Rosanova showcase)
//   /wedding-venues/[slug] → THIS FILE       (DB-driven template for all listings)
//
//   All sections hide when no data is available. No static fallback copy.
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect } from 'react';
import { fetchListingBySlug } from '../services/listings';
import { buildCardImgs } from '../utils/mediaMappers';
import VenueEnquireCard from '../components/cards/editorial/VenueEnquireCard';
import PhotoGalleryGrid from '../components/cards/editorial/PhotoGalleryGrid';
import { useBreakpoint } from '../hooks/useWindowWidth';
import { fetchUpcomingEventsForVenue, formatEventDate, formatEventTime } from '../services/eventService';
import EventDrawer from '../components/EventDrawer';

// ── Design tokens ──────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';

const C = {
  cream:  '#faf9f6',
  dark:   '#0f0f0d',
  text:   '#1a1a18',
  muted:  '#6b6560',
  border: '#e4e0d8',
  card:   '#f4f1eb',
  gold:   GOLD,
};

function fmtPrice(amount, currency = '€') {
  if (!amount) return null;
  const n = parseFloat(amount);
  if (isNaN(n)) return String(amount);
  return `${currency}${n.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

// ─── LoadingState ─────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ width: 40, height: 40, border: `2px solid ${C.border}`, borderTopColor: GOLD, borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 20px' }} />
        <p style={{ fontFamily: NU, fontSize: 13, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Loading</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  );
}

// ─── NotFoundState ─────────────────────────────────────────────────────────
function NotFoundState({ onBack }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.cream, padding: '0 24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 400 }}>
        <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 16px' }}>404</p>
        <h1 style={{ fontFamily: GD, fontSize: 36, fontWeight: 400, color: C.text, margin: '0 0 16px', lineHeight: 1.2 }}>Venue Not Found</h1>
        <p style={{ fontFamily: NU, fontSize: 15, color: C.muted, margin: '0 0 32px', lineHeight: 1.7 }}>This venue listing doesn't exist or may have been removed.</p>
        <button onClick={onBack} style={{ background: 'none', border: `1px solid ${C.border}`, color: C.text, fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '12px 28px', borderRadius: 4, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
        >← Back to Directory</button>
      </div>
    </div>
  );
}

// ─── HeroSection ─────────────────────────────────────────────────────────
function HeroSection({ name, tagline, city, region, country, heroImage, priceFrom, priceCurrency, capacityMax, verified }) {
  const { isMobile } = useBreakpoint();
  const locationStr = [city, region, country].filter(Boolean).join(', ');
  const stats = [
    priceFrom   && { value: fmtPrice(priceFrom, priceCurrency), label: 'From' },
    capacityMax && { value: capacityMax, label: 'Max Guests' },
  ].filter(Boolean);

  return (
    <section style={{ position: 'relative', width: '100%', height: '100vh', minHeight: 560, background: C.dark }}>
      {heroImage && (
        <div style={{ position: 'absolute', inset: 0, backgroundImage: `url(${heroImage})`, backgroundSize: 'cover', backgroundPosition: 'center 40%' }} />
      )}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.05) 45%, rgba(0,0,0,0.75) 100%)' }} />
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '0 24px 40px' : '0 64px 56px' }}>
        {locationStr && (
          <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', margin: '0 0 12px' }}>
            {locationStr}
          </p>
        )}
        <h1 style={{ fontFamily: GD, fontSize: isMobile ? 40 : 72, fontWeight: 400, color: '#fff', margin: '0 0 12px', lineHeight: 1.05, textShadow: '0 2px 24px rgba(0,0,0,0.35)' }}>
          {name}
        </h1>
        {tagline && (
          <p style={{ fontFamily: NU, fontSize: isMobile ? 15 : 18, color: 'rgba(255,255,255,0.72)', margin: '0 0 28px', maxWidth: 560, lineHeight: 1.65 }}>
            {tagline}
          </p>
        )}
        {stats.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: isMobile ? 20 : 36, alignItems: 'center' }}>
            {stats.map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontFamily: GD, fontSize: isMobile ? 22 : 28, color: '#fff', lineHeight: 1 }}>{s.value}</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{s.label}</span>
              </div>
            ))}
            {verified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6.5" stroke={GOLD}/><path d="M4 7l2 2 4-4" stroke={GOLD} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                <span style={{ fontFamily: NU, fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Verified</span>
              </div>
            )}
          </div>
        )}
      </div>
      <div style={{ position: 'absolute', bottom: isMobile ? 40 : 52, right: isMobile ? 20 : 64, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 1, height: 36, background: 'rgba(255,255,255,0.35)' }} />
        <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.12em', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', writingMode: 'vertical-lr' }}>Scroll</span>
      </div>
    </section>
  );
}

// ─── BreadcrumbBar ─────────────────────────────────────────────────────────
function BreadcrumbBar({ name, country, onBack }) {
  const crumbs = [
    { label: 'Home', onClick: onBack },
    { label: 'Wedding Venues' },
    country && { label: country },
    { label: name, current: true },
  ].filter(Boolean);
  return (
    <div style={{ background: C.cream, borderBottom: `1px solid ${C.border}`, padding: '0 32px', height: 40, display: 'flex', alignItems: 'center', gap: 6 }}>
      {crumbs.map((crumb, i) => (
        <span key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          {i > 0 && <span style={{ fontFamily: NU, fontSize: 10, color: C.muted, userSelect: 'none' }}>›</span>}
          {crumb.current ? (
            <span style={{ fontFamily: NU, fontSize: 11, color: C.text, fontWeight: 600, letterSpacing: '0.02em' }}>{crumb.label}</span>
          ) : (
            <button onClick={crumb.onClick} disabled={!crumb.onClick} style={{ fontFamily: NU, fontSize: 11, color: C.muted, background: 'none', border: 'none', cursor: crumb.onClick ? 'pointer' : 'default', padding: 0, fontWeight: 400, letterSpacing: '0.02em', transition: 'color 0.2s' }}
              onMouseEnter={e => crumb.onClick && (e.currentTarget.style.color = C.text)}
              onMouseLeave={e => crumb.onClick && (e.currentTarget.style.color = C.muted)}
            >{crumb.label}</button>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── StickyNav ─────────────────────────────────────────────────────────────
function StickyNav({ name, sections, activeSection, onScrollTo }) {
  const { isMobile } = useBreakpoint();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const fn = () => setVisible(window.scrollY > window.innerHeight * 0.65);
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, []);
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 900, background: 'rgba(250,249,246,0.97)', backdropFilter: 'blur(12px)', borderBottom: `1px solid ${C.border}`, boxShadow: '0 2px 16px rgba(0,0,0,0.05)', transform: visible ? 'translateY(0)' : 'translateY(-100%)', transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)', display: 'flex', alignItems: 'center', height: 56, padding: isMobile ? '0 16px' : '0 32px' }}>
      <span style={{ fontFamily: GD, fontSize: 15, color: C.text, letterSpacing: '0.01em', flexShrink: 0, marginRight: 'auto' }}>{name}</span>
      {!isMobile && (
        <nav style={{ display: 'flex', gap: 4 }}>
          {sections.map(s => (
            <button key={s.id} onClick={() => onScrollTo(s.id)} style={{ background: 'none', border: 'none', fontFamily: NU, fontSize: 13, fontWeight: activeSection === s.id ? 700 : 500, color: activeSection === s.id ? C.text : C.muted, cursor: 'pointer', padding: '6px 12px', borderRadius: 4, borderBottom: activeSection === s.id ? `2px solid ${GOLD}` : '2px solid transparent', transition: 'color 0.2s' }}>
              {s.label}
            </button>
          ))}
        </nav>
      )}
      <button onClick={() => onScrollTo('enquire')} style={{ marginLeft: isMobile ? 'auto' : 20, background: GOLD, border: 'none', color: '#0f0f0d', fontFamily: NU, fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: isMobile ? '8px 16px' : '9px 20px', borderRadius: 4, cursor: 'pointer', transition: 'opacity 0.2s', flexShrink: 0 }}
        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
      >Enquire</button>
    </div>
  );
}

// ─── Section wrapper ────────────────────────────────────────────────────────
function Sec({ id, bg = C.cream, children, tight }) {
  const { isMobile } = useBreakpoint();
  const pad = tight ? (isMobile ? '48px 24px' : '64px 64px') : (isMobile ? '64px 24px' : '96px 64px');
  return (
    <section id={id} style={{ background: bg, padding: pad }}>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>{children}</div>
    </section>
  );
}

// ─── Section header ─────────────────────────────────────────────────────────
function SH({ eyebrow, title, subtitle, center }) {
  const { isMobile } = useBreakpoint();
  return (
    <div style={{ maxWidth: 720, margin: center ? `0 auto ${isMobile ? 36 : 52}px` : `0 0 ${isMobile ? 36 : 48}px`, textAlign: center ? 'center' : 'left' }}>
      {eyebrow && <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: GOLD, textTransform: 'uppercase', margin: '0 0 12px' }}>{eyebrow}</p>}
      <h2 style={{ fontFamily: GD, fontSize: isMobile ? 26 : 36, fontWeight: 400, color: C.text, margin: `0 0 ${subtitle ? 16 : 0}px`, lineHeight: 1.15 }}>{title}</h2>
      {subtitle && <p style={{ fontFamily: NU, fontSize: isMobile ? 15 : 16, color: C.muted, margin: 0, lineHeight: 1.75, maxWidth: 600, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }}>{subtitle}</p>}
      <div style={{ width: 36, height: 1, background: GOLD, marginTop: 20, marginLeft: center ? 'auto' : 0, marginRight: center ? 'auto' : 0 }} />
    </div>
  );
}

// ─── OverviewSection ────────────────────────────────────────────────────────
function OverviewSection({ description, styles, amenities, venueType, nearestAirport, travelTime, builtYear, propertySize, propertySizeUnit }) {
  const { isMobile } = useBreakpoint();
  const facts = [
    venueType      && { label: 'Venue Type',      value: venueType },
    nearestAirport && { label: 'Nearest Airport', value: nearestAirport },
    travelTime     && { label: 'Travel Time',      value: travelTime },
    builtYear      && { label: 'Built',            value: builtYear },
    propertySize   && { label: 'Property Size',    value: `${propertySize} ${propertySizeUnit || 'acres'}` },
  ].filter(Boolean);

  return (
    <Sec id="overview">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 380px', gap: isMobile ? 40 : 72, alignItems: 'start' }}>
        <div>
          <SH eyebrow="About" title="The Venue" />
          {description && (
            <div style={{ fontFamily: NU, fontSize: isMobile ? 15 : 16, color: C.muted, lineHeight: 1.8 }} dangerouslySetInnerHTML={{ __html: description }} />
          )}
          {styles.length > 0 && (
            <div style={{ marginTop: 32 }}>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 12px' }}>Styles</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {styles.map((s, i) => <span key={i} style={{ fontFamily: NU, fontSize: 12, color: C.text, border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 20 }}>{s}</span>)}
              </div>
            </div>
          )}
        </div>
        <div>
          {facts.length > 0 && (
            <div style={{ background: C.card, borderRadius: 6, padding: isMobile ? '24px' : '32px', marginBottom: 32 }}>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 20px' }}>Quick Facts</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {facts.map((f, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: i < facts.length - 1 ? `1px solid ${C.border}` : 'none', paddingBottom: i < facts.length - 1 ? 14 : 0 }}>
                    <span style={{ fontFamily: NU, fontSize: 12, color: C.muted, letterSpacing: '0.04em' }}>{f.label}</span>
                    <span style={{ fontFamily: NU, fontSize: 13, color: C.text, fontWeight: 500, textAlign: 'right', maxWidth: '55%' }}>{f.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {amenities.length > 0 && (
            <div>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 14px' }}>Includes</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {amenities.slice(0, 10).map((a, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: GOLD, flexShrink: 0 }} />
                    <span style={{ fontFamily: NU, fontSize: 14, color: C.muted }}>{a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sec>
  );
}

// ─── SpacesSection ─────────────────────────────────────────────────────────
function SpacesSection({ spaces }) {
  const { isMobile } = useBreakpoint();
  if (!spaces || spaces.length === 0) return null;
  return (
    <Sec id="spaces" bg="#f0ede5">
      <SH eyebrow="Spaces" title="Venue Spaces" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : spaces.length === 1 ? '1fr' : spaces.length === 2 ? '1fr 1fr' : 'repeat(3, 1fr)', gap: 24 }}>
        {spaces.map((sp, i) => (
          <div key={i} style={{ background: C.cream, borderRadius: 4, overflow: 'hidden', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
            {sp.image && (
              <div style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden' }}>
                <img src={sp.image} alt={sp.name || ''} loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            )}
            <div style={{ padding: '20px 24px' }}>
              {sp.name && <h3 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: C.text, margin: '0 0 8px' }}>{sp.name}</h3>}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: sp.description ? 12 : 0 }}>
                {sp.capacity && <span style={{ fontFamily: NU, fontSize: 12, color: C.muted }}>Up to <strong style={{ color: C.text }}>{sp.capacity}</strong> guests</span>}
              </div>
              {sp.description && <p style={{ fontFamily: NU, fontSize: 14, color: C.muted, margin: 0, lineHeight: 1.7 }}>{sp.description}</p>}
            </div>
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ─── AccommodationSection ───────────────────────────────────────────────────
function AccommodationSection({ roomsTotal, roomsSuites, roomsMaxGuests, roomsExclusiveUse, roomsMinStay, roomsDescription, roomsImages }) {
  const { isMobile } = useBreakpoint();
  const facts = [
    roomsTotal     && { label: 'Total Rooms',  value: roomsTotal },
    roomsSuites    && { label: 'Suites',        value: roomsSuites },
    roomsMaxGuests && { label: 'Max Guests',    value: roomsMaxGuests },
    roomsExclusiveUse && { label: 'Exclusive Use', value: 'Available' },
    roomsMinStay   && { label: 'Minimum Stay',  value: `${roomsMinStay} nights` },
  ].filter(Boolean);
  const imgs = Array.isArray(roomsImages) ? roomsImages.filter(Boolean) : [];
  return (
    <Sec id="accommodation">
      <SH eyebrow="Stay" title="Accommodation" />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: isMobile ? 32 : 64, alignItems: 'start' }}>
        <div>
          {roomsDescription && <p style={{ fontFamily: NU, fontSize: isMobile ? 15 : 16, color: C.muted, lineHeight: 1.8, margin: '0 0 32px' }}>{roomsDescription}</p>}
          {imgs.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: imgs.length === 1 ? '1fr' : '1fr 1fr', gap: 8 }}>
              {imgs.slice(0, 4).map((src, i) => (
                <div key={i} style={{ position: 'relative', paddingTop: '66%', overflow: 'hidden', borderRadius: 4 }}>
                  <img src={typeof src === 'string' ? src : src.url || src.src} alt="" loading="lazy" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              ))}
            </div>
          )}
        </div>
        {facts.length > 0 && (
          <div style={{ background: C.card, borderRadius: 6, padding: isMobile ? '24px' : '32px', position: 'sticky', top: 80 }}>
            <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 20px' }}>At a Glance</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {facts.map((f, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', borderBottom: i < facts.length - 1 ? `1px solid ${C.border}` : 'none', paddingBottom: i < facts.length - 1 ? 14 : 0 }}>
                  <span style={{ fontFamily: NU, fontSize: 12, color: C.muted }}>{f.label}</span>
                  <span style={{ fontFamily: NU, fontSize: 13, color: C.text, fontWeight: 500 }}>{f.value}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Sec>
  );
}

// ─── DiningSection ──────────────────────────────────────────────────────────
function DiningSection({ diningStyle, diningChefName, diningInHouse, diningExternal, diningMenuStyles, diningDietary, diningDescription }) {
  const { isMobile } = useBreakpoint();
  const tags = [...(Array.isArray(diningMenuStyles) ? diningMenuStyles : []), ...(Array.isArray(diningDietary) ? diningDietary : [])].filter(Boolean);
  return (
    <Sec id="dining" bg="#f0ede5">
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: isMobile ? 32 : 64, alignItems: 'start' }}>
        <div>
          <SH eyebrow="Food & Drink" title="Dining Experience" />
          {diningDescription && <p style={{ fontFamily: NU, fontSize: isMobile ? 15 : 16, color: C.muted, lineHeight: 1.8, margin: 0 }}>{diningDescription}</p>}
        </div>
        <div style={{ paddingTop: isMobile ? 0 : 20 }}>
          {diningChefName && <div style={{ marginBottom: 24 }}><p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 6px' }}>Head Chef</p><p style={{ fontFamily: GD, fontSize: 20, color: C.text, margin: 0 }}>{diningChefName}</p></div>}
          {diningStyle && <div style={{ marginBottom: 24 }}><p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 6px' }}>Style</p><p style={{ fontFamily: NU, fontSize: 14, color: C.muted, margin: 0 }}>{diningStyle}</p></div>}
          {(diningInHouse || diningExternal) && (
            <div style={{ marginBottom: 24 }}>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 10px' }}>Catering</p>
              <div style={{ display: 'flex', gap: 12 }}>
                {diningInHouse && <span style={{ fontFamily: NU, fontSize: 13, color: C.text, border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 20 }}>In-house</span>}
                {diningExternal && <span style={{ fontFamily: NU, fontSize: 13, color: C.text, border: `1px solid ${C.border}`, padding: '5px 12px', borderRadius: 20 }}>External allowed</span>}
              </div>
            </div>
          )}
          {tags.length > 0 && (
            <div>
              <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: C.text, textTransform: 'uppercase', margin: '0 0 12px' }}>Menus & Dietary</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {tags.map((t, i) => <span key={i} style={{ fontFamily: NU, fontSize: 12, color: C.muted, border: `1px solid ${C.border}`, padding: '4px 10px', borderRadius: 16 }}>{t}</span>)}
              </div>
            </div>
          )}
        </div>
      </div>
    </Sec>
  );
}

// ─── GallerySection ──────────────────────────────────────────────────────────
function GallerySection({ images, name }) {
  if (!images || images.length === 0) return null;
  const galleryImgs = images.slice(0, 9).map(img => ({
    src: typeof img === 'string' ? img : img.src || img.url || '',
    alt: typeof img === 'object' ? (img.alt || img.alt_text || name || '') : (name || ''),
  }));
  return (
    <Sec id="gallery" tight>
      <SH eyebrow="Gallery" title="Photography" center />
      <PhotoGalleryGrid data={{ images: galleryImgs, totalCount: images.length, venueName: name }} />
    </Sec>
  );
}

// ─── FaqSection ──────────────────────────────────────────────────────────────
function FaqSection({ faqCategories, faqTitle, faqSubtitle }) {
  const [open, setOpen] = useState(null);
  const { isMobile } = useBreakpoint();
  const items = (faqCategories || []).flatMap(cat => (cat.items || []).map(item => ({ ...item, _cat: cat.label || '' })));
  if (!items.length) return null;
  return (
    <Sec id="faq">
      <SH eyebrow="FAQ" title={faqTitle || 'Frequently Asked Questions'} subtitle={faqSubtitle} center />
      <div style={{ maxWidth: 780, margin: '0 auto' }}>
        {items.map((item, i) => (
          <div key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
            <button onClick={() => setOpen(open === i ? null : i)} style={{ width: '100%', textAlign: 'left', background: 'none', border: 'none', padding: isMobile ? '18px 0' : '22px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', gap: 16 }}>
              <span style={{ fontFamily: GD, fontSize: isMobile ? 17 : 19, color: C.text, fontWeight: 400, lineHeight: 1.3 }}>{item.question}</span>
              <span style={{ fontFamily: NU, fontSize: 18, color: GOLD, flexShrink: 0, transform: open === i ? 'rotate(45deg)' : 'none', transition: 'transform 0.25s' }}>+</span>
            </button>
            {open === i && (
              <div style={{ paddingBottom: 20 }}>
                <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 15, color: C.muted, margin: 0, lineHeight: 1.8 }}>{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </Sec>
  );
}

// ─── EventsSection ───────────────────────────────────────────────────────────
function EventsSection({ events, name, onEventClick }) {
  const { isMobile } = useBreakpoint();
  if (!events?.length) return null;
  return (
    <Sec id="events" style={{ background: '#0f0f0d' }}>
      <SH eyebrow="Open Days & Events" title="Join Us in Person"
        subtitle={`Experience ${name} first-hand. Register for an upcoming open day, private tour, or virtual showcase.`}
        center light />
      <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
        {events.map(ev => {
          const dateStr = formatEventDate(ev.startDate);
          const timeStr = ev.startTime ? formatEventTime(ev.startTime) : null;
          return (
            <div
              key={ev.id}
              onClick={() => onEventClick(ev)}
              style={{ cursor: 'pointer', background: '#1a1a18', border: '1px solid #2a2a28', borderRadius: 4, overflow: 'hidden', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = '#2a2a28'}
            >
              {ev.coverImageUrl && (
                <div style={{ height: 160, overflow: 'hidden' }}>
                  <img src={ev.coverImageUrl} alt={ev.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
              <div style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                    {ev.eventType?.replace(/_/g, ' ') || 'Event'}
                  </div>
                  {ev.isVirtual && <div style={{ fontFamily: NU, fontSize: 9, color: '#60a5fa', letterSpacing: '0.1em', textTransform: 'uppercase' }}>Virtual</div>}
                </div>
                <div style={{ fontFamily: GD, fontSize: 18, color: '#f0ece4', fontWeight: 400, marginBottom: 6, lineHeight: 1.3 }}>{ev.title}</div>
                {ev.subtitle && <div style={{ fontFamily: NU, fontSize: 12, color: '#888', marginBottom: 10, lineHeight: 1.5 }}>{ev.subtitle}</div>}
                <div style={{ fontFamily: NU, fontSize: 11, color: '#666', marginTop: 12 }}>{dateStr}{timeStr ? ` · ${timeStr}` : ''}</div>
                {ev.locationName && !ev.isVirtual && <div style={{ fontFamily: NU, fontSize: 11, color: '#555', marginTop: 3 }}>{ev.locationName}</div>}
                <div style={{ marginTop: 16, display: 'inline-block', fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', borderBottom: `1px solid ${GOLD}` }}>
                  {ev.bookingMode === 'external' ? 'Book Now →' : 'Register →'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </Sec>
  );
}

// ─── ListingProfilePage ───────────────────────────────────────────────────────
export default function ListingProfilePage({ slug, onBack }) {
  const [listing, setListing]   = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [activeSection, setActiveSection] = useState('overview');
  const [venueEvents, setVenueEvents] = useState([]);
  const [drawerEvent, setDrawerEvent] = useState(null);

  // Fetch listing
  useEffect(() => {
    let ignore = false;
    async function load() {
      if (!slug) { setLoading(false); setNotFound(true); return; }
      setLoading(true); setNotFound(false);
      try {
        const data = await fetchListingBySlug(slug);
        if (ignore) return;
        if (!data) setNotFound(true); else setListing(data);
      } catch { if (!ignore) setNotFound(true); }
      finally   { if (!ignore) setLoading(false); }
    }
    load();
    return () => { ignore = true; };
  }, [slug]);

  // Fetch events for this listing (venue_id = listing.id)
  useEffect(() => {
    if (!listing?.id) return;
    fetchUpcomingEventsForVenue(listing.id, 6).then(evts => setVenueEvents(evts || []));
  }, [listing?.id]);

  // Scroll to top
  useEffect(() => { window.scrollTo({ top: 0, behavior: 'instant' }); }, [slug]);

  // Scroll spy, MUST be before early returns (Rules of Hooks)
  useEffect(() => {
    if (!listing) return;
    const mediaItems = listing.media_items || [];
    const images = buildCardImgs(mediaItems).map(i => i.src).filter(Boolean);
    const spaces = Array.isArray(listing.spaces) && listing.spaces.length > 0;
    const hasRooms  = listing.rooms_total || listing.rooms_suites || listing.rooms_description;
    const hasDining = listing.dining_style || listing.dining_description || listing.dining_chef_name;
    const hasFaq    = listing.faq_enabled && Array.isArray(listing.faq_categories) && listing.faq_categories.length > 0;
    const ids = ['overview', spaces ? 'spaces' : null, hasRooms ? 'accommodation' : null, hasDining ? 'dining' : null, images.length > 0 ? 'gallery' : null, hasFaq ? 'faq' : null, venueEvents.length > 0 ? 'events' : null, 'enquire'].filter(Boolean);
    const fn = () => {
      for (let i = ids.length - 1; i >= 0; i--) {
        const el = document.getElementById(ids[i]);
        if (el && window.scrollY >= el.offsetTop - 100) { setActiveSection(ids[i]); return; }
      }
    };
    window.addEventListener('scroll', fn, { passive: true });
    return () => window.removeEventListener('scroll', fn);
  }, [listing]);

  // ── Early returns (after ALL hooks) ─────────────────────────────────────
  if (loading)  return <LoadingState />;
  if (notFound) return <NotFoundState onBack={onBack} />;

  // ── Map DB fields ────────────────────────────────────────────────────────
  const name         = listing.name || '';
  const tagline      = listing.short_description || listing.card_summary || '';
  const description  = listing.description || '';
  const city         = listing.city || '';
  const region       = listing.region || '';
  const country      = listing.country || '';
  const priceFrom    = listing.price_from;
  const currency     = listing.price_currency || '€';
  const capacityMax  = listing.capacity_max;
  const venueType    = listing.venue_type || '';
  const styles       = Array.isArray(listing.styles) ? listing.styles : [];
  const amenities    = Array.isArray(listing.amenities) ? listing.amenities : [];
  const verified     = !!listing.verified || !!listing.is_verified;

  const mediaItems   = listing.media_items || [];
  const cardImgs     = buildCardImgs(mediaItems);
  const images       = cardImgs.map(i => ({ src: i.src, alt: i.alt || name })).filter(i => i.src);
  const heroImageSet = listing.hero_image_set;
  const heroImage    = listing.hero_image || (Array.isArray(heroImageSet) ? heroImageSet[0] : null) || images[0]?.src || null;

  const spaces       = Array.isArray(listing.spaces) && listing.spaces.length > 0 ? listing.spaces : null;
  const hasRooms     = !!(listing.rooms_total || listing.rooms_suites || listing.rooms_description);
  const hasDining    = !!(listing.dining_style || listing.dining_description || listing.dining_chef_name);
  const faqCategories = listing.faq_enabled && Array.isArray(listing.faq_categories) && listing.faq_categories.length > 0 ? listing.faq_categories : null;

  const navSections = [
    { id: 'overview',       label: 'Overview' },
    spaces        ? { id: 'spaces',        label: 'Spaces' }        : null,
    hasRooms      ? { id: 'accommodation', label: 'Accommodation' } : null,
    hasDining     ? { id: 'dining',        label: 'Dining' }        : null,
    images.length > 0 ? { id: 'gallery',  label: 'Gallery' }       : null,
    faqCategories ? { id: 'faq',          label: 'FAQ' }            : null,
    venueEvents.length > 0 ? { id: 'events', label: 'Events' }     : null,
    { id: 'enquire', label: 'Enquire' },
  ].filter(Boolean);

  const scrollTo = (id) => { const el = document.getElementById(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  return (
    <div style={{ background: C.cream, minHeight: '100vh' }}>
      <HeroSection name={name} tagline={tagline} city={city} region={region} country={country} heroImage={heroImage} priceFrom={priceFrom} priceCurrency={currency} capacityMax={capacityMax} verified={verified} />
      <BreadcrumbBar name={name} country={country} onBack={onBack} />
      <StickyNav name={name} sections={navSections} activeSection={activeSection} onScrollTo={scrollTo} />
      <OverviewSection description={description} styles={styles} amenities={amenities} venueType={venueType} nearestAirport={listing.nearest_airport || ''} travelTime={listing.travel_time || ''} builtYear={listing.built_year || ''} propertySize={listing.property_size || ''} propertySizeUnit={listing.property_size_unit || ''} />
      {spaces    && <SpacesSection spaces={spaces} />}
      {hasRooms  && <AccommodationSection roomsTotal={listing.rooms_total} roomsSuites={listing.rooms_suites} roomsMaxGuests={listing.rooms_max_guests} roomsExclusiveUse={listing.rooms_exclusive_use} roomsMinStay={listing.rooms_min_stay} roomsDescription={listing.rooms_description} roomsImages={listing.rooms_images} />}
      {hasDining && <DiningSection diningStyle={listing.dining_style} diningChefName={listing.dining_chef_name} diningInHouse={listing.dining_in_house} diningExternal={listing.dining_external} diningMenuStyles={listing.dining_menu_styles} diningDietary={listing.dining_dietary} diningDescription={listing.dining_description} />}
      {images.length > 0 && <GallerySection images={images} name={name} />}
      {faqCategories && <FaqSection faqCategories={faqCategories} faqTitle={listing.faq_title} faqSubtitle={listing.faq_subtitle} />}
      {venueEvents.length > 0 && <EventsSection events={venueEvents} name={name} onEventClick={setDrawerEvent} />}
      <VenueEnquireCard data={{ background: heroImage, headline: `Plan Your Wedding at ${name}`, subline: 'Our team will respond within 24 hours to discuss your vision.', venueName: name }} />
      <EventDrawer event={drawerEvent} onClose={() => setDrawerEvent(null)} />
    </div>
  );
}
