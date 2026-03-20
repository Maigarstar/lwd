// ─── EventDetailPage.jsx ──────────────────────────────────────────────────────
// Public-facing event detail page.
// Route: /events/:slug
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import {
  fetchEventBySlug,
  formatEventDate,
  formatEventTime,
  googleCalendarUrl,
  buildIcsBlob,
} from '../services/eventService';
import { submitEventBooking } from '../services/eventBookingService';
import { fetchApprovedReviews } from '../services/reviewService';
import { fetchListingById } from '../services/listings';
import { THEMES } from '../services/reviewThemeService';
import { useBreakpoint } from '../hooks/useWindowWidth';
import HomeNav from '../components/nav/HomeNav';

// ── Tokens ────────────────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#c9a84c';
const FORM_W = 400; // px — fixed booking form width

// ── Palette factory ───────────────────────────────────────────────────────────
function getPalette(isLight) {
  return isLight ? {
    bg:        '#faf8f5',
    card:      '#ffffff',
    border:    '#e8e0d4',
    border2:   '#d4c8b8',
    text:      '#1a1a18',
    textSub:   '#5a5045',
    textMuted: '#9a8e80',
    inputBg:   '#f5f0e8',
    iframeBg:  '#f0ebe2',
    sectionBg: '#f2ede6',
  } : {
    bg:        '#0e0c0a',
    card:      '#1a1710',
    border:    '#2a2520',
    border2:   '#3a3028',
    text:      '#c8bfa8',
    textSub:   '#8a8070',
    textMuted: '#5a5045',
    inputBg:   '#0e0c0a',
    iframeBg:  '#111',
    sectionBg: '#130f0c',
  };
}

// ── Label ─────────────────────────────────────────────────────────────────────
function Label({ children }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 10, color: GOLD,
      letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 8,
    }}>{children}</div>
  );
}

// ── DetailRow ─────────────────────────────────────────────────────────────────
function DetailRow({ icon, children, P }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 14 }}>
      <span style={{ color: GOLD, fontSize: 16, flexShrink: 0, lineHeight: '22px' }}>{icon}</span>
      <span style={{ fontFamily: NU, fontSize: 14, color: P.text, lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ── Gallery helpers ───────────────────────────────────────────────────────────
function ytId(url) {
  if (!url) return null;
  const m = url.match(/(?:v=|youtu\.be\/)([^&?/]+)/);
  return m ? m[1] : null;
}
function vimeoId(url) {
  if (!url) return null;
  const m = url.match(/vimeo\.com\/(\d+)/);
  return m ? m[1] : null;
}
function videoEmbedUrl(url) {
  const yt = ytId(url);
  if (yt) return `https://www.youtube.com/embed/${yt}?autoplay=1&rel=0`;
  const vi = vimeoId(url);
  if (vi) return `https://player.vimeo.com/video/${vi}?autoplay=1`;
  return null; // direct file — use <video>
}
function videoThumb(url) {
  const yt = ytId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;
  return null;
}

// ── Gallery lightbox ──────────────────────────────────────────────────────────
// urls      — image URLs (max 6)
// videoUrl  — optional single video (YouTube / Vimeo / direct file)
// Layout: video on its own full-width row; images in separate 3-col grid below
function Gallery({ urls, videoUrl, P }) {
  const images = (urls || []).slice(0, 6);
  // Unified items list for lightbox navigation: video first, then images
  const items = [
    ...(videoUrl ? [{ type: 'video', src: videoUrl }] : []),
    ...images.map(u => ({ type: 'image', src: u })),
  ];

  const [open, setOpen] = useState(null); // index into items[] | null

  const prev = useCallback(() => setOpen(i => (i > 0 ? i - 1 : items.length - 1)), [items.length]);
  const next = useCallback(() => setOpen(i => (i < items.length - 1 ? i + 1 : 0)), [items.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e) => {
      if (e.key === 'Escape')     setOpen(null);
      if (e.key === 'ArrowLeft')  prev();
      if (e.key === 'ArrowRight') next();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, prev, next]);

  if (!items.length) return null;

  const activeItem = open !== null ? items[open] : null;
  const embedUrl   = activeItem?.type === 'video' ? videoEmbedUrl(activeItem.src) : null;

  return (
    <>
      {/* ── Video block ── */}
      {videoUrl && (() => {
        const thumb = videoThumb(videoUrl);
        return (
          <div style={{ marginBottom: 44 }}>
            <Label>Video</Label>
            <div
              onClick={() => setOpen(0)}
              style={{
                position: 'relative', width: '100%', aspectRatio: '16/9',
                overflow: 'hidden', borderRadius: 4, cursor: 'pointer',
                background: P.iframeBg, border: `1px solid ${P.border}`,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
            >
              {thumb && (
                <img src={thumb} alt="Video"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              <div style={{
                position: 'absolute', inset: 0,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: thumb ? 'rgba(0,0,0,0.35)' : P.iframeBg,
              }}>
                <div style={{
                  width: 64, height: 64, borderRadius: '50%',
                  background: 'rgba(201,168,76,0.92)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                }}>
                  <span style={{ color: '#000', fontSize: 26, marginLeft: 4 }}>▶</span>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Divider between video and gallery ── */}
      {videoUrl && images.length > 0 && (
        <div style={{ borderTop: `1px solid ${P.border}`, marginBottom: 44 }} />
      )}

      {/* ── Image gallery block ── */}
      {images.length > 0 && (
        <div style={{ marginBottom: 44 }}>
          <Label>Gallery</Label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {images.map((src, i) => {
              const itemIdx = videoUrl ? i + 1 : i;
              return (
                <div
                  key={i}
                  onClick={() => setOpen(itemIdx)}
                  style={{
                    aspectRatio: '4/3', overflow: 'hidden', borderRadius: 3,
                    background: P.iframeBg, cursor: 'zoom-in',
                    border: `1px solid ${P.border}`,
                    transition: 'border-color 0.2s, transform 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.transform = 'scale(1.01)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.transform = 'scale(1)'; }}
                >
                  <img src={src} alt={`Gallery ${i + 1}`}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                </div>
              );
            })}
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, marginTop: 8, letterSpacing: '0.05em' }}>
            Click to enlarge
          </div>
        </div>
      )}

      {/* ── Lightbox overlay ── */}
      {activeItem && (
        <div
          onClick={() => setOpen(null)}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(0,0,0,0.95)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* Close */}
          <button onClick={() => setOpen(null)} style={{
            position: 'absolute', top: 20, right: 24, background: 'none',
            border: `1px solid rgba(255,255,255,0.2)`, borderRadius: '50%',
            width: 40, height: 40, color: '#fff', fontSize: 18, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: NU,
          }}>✕</button>

          {/* Counter */}
          <div style={{
            position: 'absolute', top: 22, left: '50%', transform: 'translateX(-50%)',
            fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em',
          }}>
            {open + 1} / {items.length}
          </div>

          {/* Prev */}
          {items.length > 1 && (
            <button onClick={e => { e.stopPropagation(); prev(); }} style={{
              position: 'absolute', left: 20, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
              width: 48, height: 48, color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>‹</button>
          )}

          {/* Content */}
          {activeItem.type === 'image' ? (
            <img
              src={activeItem.src}
              alt={`Gallery ${open + 1}`}
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 'calc(100vw - 120px)', maxHeight: 'calc(100vh - 100px)',
                objectFit: 'contain', borderRadius: 4,
                boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            />
          ) : embedUrl ? (
            <div onClick={e => e.stopPropagation()} style={{
              width: 'min(900px, calc(100vw - 120px))',
              aspectRatio: '16/9', borderRadius: 4, overflow: 'hidden',
              boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
            }}>
              <iframe
                src={embedUrl}
                allow="autoplay; fullscreen; picture-in-picture"
                allowFullScreen
                style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
              />
            </div>
          ) : (
            <video
              src={activeItem.src}
              controls autoPlay
              onClick={e => e.stopPropagation()}
              style={{
                maxWidth: 'calc(100vw - 120px)', maxHeight: 'calc(100vh - 100px)',
                borderRadius: 4, boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
              }}
            />
          )}

          {/* Next */}
          {items.length > 1 && (
            <button onClick={e => { e.stopPropagation(); next(); }} style={{
              position: 'absolute', right: 20, background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.15)', borderRadius: '50%',
              width: 48, height: 48, color: '#fff', fontSize: 20, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>›</button>
          )}
        </div>
      )}
    </>
  );
}

// ── Map embed (Google Maps, no API key) ───────────────────────────────────────
function EventMap({ event, P }) {
  if (event.isVirtual) return null;
  const addr = event.locationAddress || event.locationName;
  if (!addr) return null;

  const src = `https://www.google.com/maps?q=${encodeURIComponent(addr)}&output=embed&z=15`;

  return (
    <div style={{ marginBottom: 44 }}>
      <Label>Location</Label>
      <div style={{
        borderRadius: 4, overflow: 'hidden',
        border: `1px solid ${P.border}`,
        background: P.iframeBg,
      }}>
        <iframe
          title="Event location"
          src={src}
          width="100%"
          height="280"
          style={{ display: 'block', border: 'none', filter: P.bg === '#faf8f5' ? 'none' : 'invert(90%) hue-rotate(180deg)' }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allowFullScreen
        />
      </div>
      <div style={{ fontFamily: NU, fontSize: 12, color: P.textSub, marginTop: 8, display: 'flex', gap: 6, alignItems: 'center' }}>
        <span>📍</span>
        <span>{event.locationName}{event.locationAddress && ` · ${event.locationAddress}`}</span>
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`}
          target="_blank" rel="noopener noreferrer"
          style={{ color: GOLD, textDecoration: 'none', marginLeft: 8, letterSpacing: '0.05em' }}
        >
          Open in Maps →
        </a>
      </div>
    </div>
  );
}

// ── Getting There & Practical Details ────────────────────────────────────────
function GettingThere({ event, P }) {
  const {
    nearestAirport, travelTime, nearestTrainStation, trainTravelTime,
    transportNotes, parkingInfo, guestLogistics, directionsLink,
    locationAddress, locationName,
  } = event;

  const hasAny = nearestAirport || nearestTrainStation || transportNotes || parkingInfo || guestLogistics;
  if (!hasAny) return null;

  const fallbackMapsUrl = locationAddress || locationName
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(locationAddress || locationName)}`
    : null;
  const mapsUrl = directionsLink || fallbackMapsUrl;

  const Row = ({ icon, children }) => (
    <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start', padding: '9px 0', borderBottom: `1px solid ${P.border}` }}>
      <span style={{ color: GOLD, fontSize: 13, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <span style={{ fontFamily: NU, fontSize: 13, color: P.textMid, lineHeight: 1.6 }}>{children}</span>
    </div>
  );

  return (
    <div style={{ marginBottom: 44 }}>
      <Label>Getting There & Practical Details</Label>

      <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 4, padding: '4px 20px 8px', overflow: 'hidden' }}>

        {/* Air */}
        {nearestAirport && (
          <Row icon="✈">
            <span style={{ color: P.text, fontWeight: 600 }}>Nearest airport:</span>{' '}
            {nearestAirport}{travelTime ? `, ${travelTime}` : ''}
          </Row>
        )}

        {/* Train */}
        {nearestTrainStation && (
          <Row icon="🚆">
            <span style={{ color: P.text, fontWeight: 600 }}>Nearest station:</span>{' '}
            {nearestTrainStation}{trainTravelTime ? `, ${trainTravelTime}` : ''}
          </Row>
        )}

        {/* Transfers */}
        {transportNotes && (
          <Row icon="🚗">{transportNotes}</Row>
        )}

        {/* Parking */}
        {parkingInfo && (
          <Row icon="P">{parkingInfo}</Row>
        )}

        {/* Guest logistics */}
        {guestLogistics && (
          <Row icon="🏨">{guestLogistics}</Row>
        )}

      </div>

      {/* Get directions CTA */}
      {mapsUrl && (
        <a
          href={mapsUrl} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14,
            fontFamily: NU, fontSize: 12, color: GOLD, textDecoration: 'none',
            letterSpacing: '0.08em', fontWeight: 600,
          }}
        >
          Get directions →
        </a>
      )}
    </div>
  );
}

// ── Helpers shared with reviews ───────────────────────────────────────────────
function mapReview(r) {
  const name = r.reviewer_name || 'Anonymous';
  const initials = name.split(' ').map(w => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase() || '?';
  return {
    id:       r.id,
    names:    name,
    location: r.reviewer_location || null,
    date:     r.event_date
      ? new Date(r.event_date).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
      : r.published_at
        ? new Date(r.published_at).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })
        : null,
    rating:   Number(r.overall_rating) || 5,
    title:    r.review_title || null,
    text:     r.review_text || '',
    verified: !!r.is_verified,
    themes:   r.themes || [],
    avatar:   initials,
  };
}

// ── Venue Reviews Strip (mirrors VenueReviewsPage card style) ─────────────────
function VenueReviewsStrip({ venueId, venueName: venueNameProp, P }) {
  const [reviews,   setReviews]   = useState([]);
  const [venueSlug, setVenueSlug] = useState(null);
  const [venueName, setVenueName] = useState(venueNameProp || null);
  const [loading,   setLoading]   = useState(true);

  useEffect(() => {
    if (!venueId) { setLoading(false); return; }
    Promise.all([
      fetchApprovedReviews('venue', venueId),
      fetchListingById(venueId),
    ]).then(([raw, listing]) => {
      setReviews((raw || []).map(mapReview).slice(0, 3));
      setVenueSlug(listing?.slug || null);
      if (!venueNameProp) setVenueName(listing?.name || null);
    }).catch(e => console.warn('[VenueReviewsStrip]', e))
      .finally(() => setLoading(false));
  }, [venueId]);

  if (loading || reviews.length === 0) return null;

  const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1);
  const RG = '#c9a84c'; // review gold

  return (
    <div style={{ marginBottom: 44 }}>
      <Label>Venue Reviews</Label>

      {/* "Hosted at X, rated Y by couples" intro line */}
      {venueName && (
        <div style={{
          fontFamily: NU, fontSize: 12, color: P.textMuted,
          marginBottom: 20, letterSpacing: '0.02em',
        }}>
          Hosted at{' '}
          <span style={{ color: P.text, fontWeight: 600 }}>{venueName}</span>
          {', rated '}
          <span style={{ color: RG, fontWeight: 700 }}>{avgRating}</span>
          {' by couples'}
        </div>
      )}

      {/* Summary bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
        paddingBottom: 18, borderBottom: `1px solid ${P.border}`,
      }}>
        <div style={{ fontFamily: GD, fontSize: 40, color: RG, lineHeight: 1 }}>{avgRating}</div>
        <div>
          <div style={{ display: 'flex', gap: 3, marginBottom: 4 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 14, color: s <= Math.round(Number(avgRating)) ? RG : P.border, lineHeight: 1 }}>★</span>
            ))}
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, letterSpacing: '0.05em' }}>
            {reviews.length} review{reviews.length !== 1 ? 's' : ''} · from the venue profile
          </div>
        </div>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
        {reviews.map((r, idx) => (
          <ReviewCardStrip key={r.id} r={r} P={P} idx={idx} GOLD={RG} />
        ))}
      </div>

      {/* Read all → */}
      {venueSlug && (
        <a
          href={`/venues/${venueSlug}/reviews`}
          target="_blank" rel="noopener noreferrer"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 20,
            fontFamily: NU, fontSize: 12, color: RG, textDecoration: 'none',
            letterSpacing: '0.08em', fontWeight: 600,
          }}
        >
          Read all venue reviews →
        </a>
      )}
    </div>
  );
}

function ReviewCardStrip({ r, P, idx, GOLD }) {
  const [expanded, setExpanded] = useState(false);
  const LONG = r.text.length > 320;

  return (
    <div style={{
      padding: '24px 28px',
      background: P.card,
      border: `1px solid ${P.border}`,
      borderLeft: `4px solid ${GOLD}`,
      borderRadius: idx === 0 ? '4px 4px 0 0' : idx === -1 ? '0 0 4px 4px' : 0,
    }}>
      {/* Quote + title row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
        <span style={{
          fontFamily: GD, fontSize: 44, color: GOLD,
          lineHeight: 0.6, opacity: 0.4, flexShrink: 0, userSelect: 'none', marginTop: 8,
        }}>"</span>
        <div>
          {r.title && (
            <div style={{ fontFamily: GD, fontSize: 15, color: P.text, lineHeight: 1.35, marginBottom: 5 }}>
              {r.title}
            </div>
          )}
          {/* Stars */}
          <span style={{ display: 'inline-flex', gap: 2 }}>
            {[1,2,3,4,5].map(s => (
              <span key={s} style={{ fontSize: 11, color: s <= Math.round(r.rating) ? GOLD : P.border, lineHeight: 1 }}>★</span>
            ))}
          </span>
        </div>
      </div>

      {/* Body */}
      <p style={{
        fontFamily: NU, fontSize: 13, color: P.textSub, lineHeight: 1.8, margin: '0 0 0',
        ...(!expanded && LONG ? { display: '-webkit-box', WebkitLineClamp: 5, WebkitBoxOrient: 'vertical', overflow: 'hidden' } : {}),
      }}>{r.text}</p>

      {LONG && (
        <button onClick={() => setExpanded(e => !e)} style={{
          marginTop: 6, fontFamily: NU, fontSize: 11, color: GOLD,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
          fontWeight: 700, letterSpacing: '0.05em',
        }}>{expanded ? 'Show less ↑' : 'Read full review ↓'}</button>
      )}

      {/* Theme tags */}
      {r.themes && r.themes.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 14 }}>
          {r.themes.map(t => (
            <span key={t} style={{
              fontFamily: NU, fontSize: 9, color: GOLD, fontWeight: 700,
              padding: '2px 8px', border: `1px solid ${GOLD}40`,
              background: `${GOLD}10`, letterSpacing: '0.1em', textTransform: 'uppercase', borderRadius: 2,
            }}>{THEMES[t]?.label || t}</span>
          ))}
        </div>
      )}

      {/* Reviewer row */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, marginTop: 18,
        paddingTop: 14, borderTop: `1px solid ${P.border}`, flexWrap: 'wrap',
      }}>
        <div style={{
          width: 36, height: 36, background: `${GOLD}14`, border: `1px solid ${GOLD}40`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: GD, fontSize: 13, color: GOLD, flexShrink: 0, borderRadius: 2,
        }}>{r.avatar}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: GD, fontSize: 13, color: P.text, marginBottom: 2 }}>{r.names}</div>
          <div style={{ fontFamily: NU, fontSize: 10, color: P.textMuted }}>
            {[r.location, r.date].filter(Boolean).join(' · ')}
          </div>
        </div>
        {r.verified && (
          <span style={{
            fontFamily: NU, fontSize: 9, color: '#5fa87a', fontWeight: 700,
            padding: '2px 8px', border: '1px solid #5fa87a60', letterSpacing: '0.1em', borderRadius: 2,
          }}>✓ Verified</span>
        )}
      </div>
    </div>
  );
}

// ── Event Ended Panel — shown in the booking sidebar when the event is past ───
function EventEndedPanel({ event, venue, P }) {
  const venueSlug = venue?.slug || null;
  const venueName = venue?.name || null;

  return (
    <div style={{ textAlign: 'center', padding: '12px 0 4px' }}>
      {/* Icon */}
      <div style={{
        width: 48, height: 48, borderRadius: '50%',
        background: `${GOLD}14`, border: `1px solid ${GOLD}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 18px', fontSize: 20,
      }}>◈</div>

      <div style={{ fontFamily: GD, fontSize: 18, color: P.text, fontWeight: 400, marginBottom: 8, lineHeight: 1.3 }}>
        This event has ended
      </div>
      <div style={{ fontFamily: NU, fontSize: 12, color: P.textMuted, marginBottom: 28, lineHeight: 1.7 }}>
        {event.title} took place on {event.startDate
          ? new Date(event.startDate + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
          : 'a previous date'}.
        {venueName && ` Hosted by ${venueName}.`}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {/* View upcoming events */}
        {venueSlug ? (
          <a
            href={`/venues/${venueSlug}`}
            style={{
              display: 'block', padding: '13px 20px',
              background: GOLD, borderRadius: 2, textDecoration: 'none',
              fontFamily: NU, fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0e0c0a',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            View Upcoming Events →
          </a>
        ) : (
          <a
            href="/"
            style={{
              display: 'block', padding: '13px 20px',
              background: GOLD, borderRadius: 2, textDecoration: 'none',
              fontFamily: NU, fontSize: 12, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', color: '#0e0c0a',
            }}
          >
            View All Events →
          </a>
        )}

        {/* Send enquiry */}
        {venueSlug && (
          <a
            href={`/venues/${venueSlug}#enquire`}
            style={{
              display: 'block', padding: '12px 20px',
              background: 'transparent', border: `1px solid ${P.border}`, borderRadius: 2,
              fontFamily: NU, fontSize: 12, color: P.textSub,
              letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.textSub; }}
          >
            Send an Enquiry
          </a>
        )}
      </div>
    </div>
  );
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingForm({ event, onSuccess, P }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    guestCount: 1, message: '',
    consentMarketing: false, consentDataProcessing: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Please fill in your name and email address.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitEventBooking(form, event);
      if (result.success) {
        onSuccess(result);
      } else {
        setError(result.error?.message || 'Booking failed. Please try again.');
        setSubmitting(false);
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
      setSubmitting(false);
    }
  };

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: P.inputBg, border: `1px solid ${P.border}`,
    borderRadius: 2, padding: '10px 14px',
    fontFamily: NU, fontSize: 14, color: P.text,
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* First + Last — side by side (plenty of room at 400px) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <Label>First Name *</Label>
          <input style={inp} value={form.firstName} placeholder="Sofia"
            onChange={e => set('firstName', e.target.value)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <Label>Last Name *</Label>
          <input style={inp} value={form.lastName} placeholder="Ricci"
            onChange={e => set('lastName', e.target.value)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <Label>Email Address *</Label>
        <input type="email" style={inp} value={form.email} placeholder="sofia@example.com"
          onChange={e => set('email', e.target.value)}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = P.border} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <Label>Phone (optional)</Label>
          <input type="tel" style={inp} value={form.phone} placeholder="+44 7700 000000"
            onChange={e => set('phone', e.target.value)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <Label>Guests</Label>
          <select style={{ ...inp, cursor: 'pointer' }} value={form.guestCount}
            onChange={e => set('guestCount', parseInt(e.target.value))}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 18 }}>
        <Label>Message (optional)</Label>
        <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }}
          value={form.message} placeholder="Any special requirements…"
          onChange={e => set('message', e.target.value)}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = P.border} />
      </div>

      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'consentMarketing',      label: "Keep me updated about future events from this venue." },
          { key: 'consentDataProcessing', label: "I consent to my data being processed for this booking. *" },
        ].map(c => (
          <label key={c.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={form[c.key]} onChange={e => set(c.key, e.target.checked)}
              style={{ marginTop: 3, accentColor: GOLD, flexShrink: 0 }} />
            <span style={{ fontFamily: NU, fontSize: 12, color: P.textSub, lineHeight: 1.6 }}>{c.label}</span>
          </label>
        ))}
      </div>

      {error && (
        <div style={{ fontFamily: NU, fontSize: 13, color: '#f87171', marginBottom: 14,
          padding: '10px 14px', background: 'rgba(248,113,113,0.08)',
          border: '1px solid rgba(248,113,113,0.2)', borderRadius: 2 }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} style={{
        width: '100%', padding: '14px 24px',
        background: submitting ? P.border2 : GOLD,
        color: '#0e0c0a', border: 'none', borderRadius: 2,
        fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer',
        opacity: submitting ? 0.7 : 1, transition: 'background 0.2s',
      }}>
        {submitting
          ? (event.isFree === false ? 'Reserving…' : 'Registering…')
          : (event.isFree === false ? 'Reserve Your Place' : 'Confirm Registration')}
      </button>

      <p style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, textAlign: 'center', margin: '12px 0 0', lineHeight: 1.7 }}>
        {event.isFree === false
          ? 'Payment is handled directly by the venue. They will contact you to complete your booking.'
          : 'Free to attend. Confirmation email sent within minutes.'}
      </p>
    </form>
  );
}

// ── Booking Confirmed ─────────────────────────────────────────────────────────
function BookingConfirmed({ booking, event, P }) {
  const dl = () => {
    const blob = buildIcsBlob(event);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `${event.slug || 'event'}.ics`; a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toISOString().split('T')[0];
  const eventPast  = event.startDate && event.startDate < today;
  const reviewUrl  = booking.reviewToken ? `/review?token=${booking.reviewToken}` : null;

  return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: 22, color: '#4ade80',
      }}>✓</div>
      <div style={{ fontFamily: GD, fontSize: 21, color: P.text, fontWeight: 400, marginBottom: 8 }}>
        {event.isFree === false ? 'Your place is reserved' : "You're registered"}
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: P.textSub, marginBottom: 24, lineHeight: 1.7 }}>
        {event.isFree === false
          ? <>Your place has been reserved. The venue will contact you to complete payment.<br /></>
          : <>Confirmation sent to your email.<br /></>}
        Reference: <strong style={{ color: GOLD }}>{booking.bookingRef}</strong>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', padding: '12px 20px',
            background: 'rgba(201,168,76,0.10)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 2, fontFamily: NU, fontSize: 12, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.10)'}>
          📅 Add to Google Calendar
        </a>
        <button onClick={dl} style={{
          width: '100%', padding: '12px 20px',
          background: 'transparent', border: `1px solid ${P.border}`,
          borderRadius: 2, fontFamily: NU, fontSize: 12, color: P.textSub,
          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.textSub; }}>
          ⬇ Download .ics File
        </button>

        {/* Post-event review CTA */}
        {eventPast && reviewUrl ? (
          <a href={reviewUrl} target="_blank" rel="noopener noreferrer"
            style={{
              display: 'block', marginTop: 8, padding: '13px 20px',
              background: GOLD, border: `1px solid ${GOLD}`,
              borderRadius: 2, fontFamily: NU, fontSize: 12, color: '#0e0c0a',
              letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
              fontWeight: 600,
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.88'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            ✦ Share Your Experience
          </a>
        ) : (
          <p style={{
            fontFamily: NU, fontSize: 11, color: P.textMuted,
            textAlign: 'center', margin: '12px 0 0', lineHeight: 1.8,
            letterSpacing: '0.03em',
          }}>
            After the event, we'll invite you to share your experience.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EventDetailPage({ slug, onBack, footerNav, previewEvent = null, previewDarkMode = true }) {
  const { isMobile: _isMobile } = useBreakpoint();
  const isPreview = !!previewEvent;
  // In the builder preview panel (≈50% viewport width), force compact/mobile layout
  // so the preview fits properly — desktop layout is designed for full-width pages
  const isMobile = isPreview ? true : _isMobile;

  const [event, setEvent]       = useState(isPreview ? previewEvent : null);
  const [loading, setLoading]   = useState(!isPreview);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking]   = useState(null);
  // In preview mode, mirror the admin light/dark toggle; otherwise use internal state
  const [isLight, setIsLight]   = useState(isPreview ? !previewDarkMode : false);
  const [venue, setVenue]       = useState(null);

  // Keep light/dark in sync with admin toggle when in preview
  useEffect(() => {
    if (isPreview) setIsLight(!previewDarkMode);
  }, [isPreview, previewDarkMode]);

  const P = getPalette(isLight);

  // Keep preview event in sync with every form keystroke
  useEffect(() => {
    if (isPreview) setEvent(previewEvent);
  }, [isPreview, previewEvent]);

  // Live fetch — skipped in preview mode
  useEffect(() => {
    if (isPreview) return;
    let cancelled = false;
    setLoading(true); setNotFound(false); setBooking(null);
    fetchEventBySlug(slug).then(ev => {
      if (cancelled) return;
      if (!ev) setNotFound(true); else setEvent(ev);
      setLoading(false);
    }).catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
    return () => { cancelled = true; };
  }, [slug, isPreview]);

  // Venue fetch — skipped in preview mode
  useEffect(() => {
    if (isPreview || !event?.venueId) return;
    fetchListingById(event.venueId)
      .then(l => setVenue(l || null))
      .catch(() => {});
  }, [event?.venueId, isPreview]);

  const dateStr    = event ? formatEventDate(event.startDate) : '';
  const timeStr    = event?.startTime ? formatEventTime(event.startTime) : null;
  const endDateStr = event?.endDate && event.endDate !== event.startDate ? formatEventDate(event.endDate) : null;
  const endTimeStr = event?.endTime ? formatEventTime(event.endTime) : null;

  const youtubeEmbedUrl = event?.streamUrl ? event.streamUrl
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
    : null;

  const useVideoHero = !!(event?.videoHeroMode && event?.videoUrl);
  const hasHero = useVideoHero || !!event?.coverImageUrl;
  const showBookingPanel = event && (event.bookingMode === 'internal' || event.bookingMode === 'enquiry_only');
  const isEventPast = event ? (() => {
    const d = event.endDate || event.startDate;
    return d ? new Date(d + 'T23:59:59') < new Date() : false;
  })() : false;

  const confirmedCount = event?.bookingCount ?? 0;
  const remaining = (event?.capacity && event?.capacity > 0)
    ? Math.max(0, event.capacity - confirmedCount)
    : null;
  const capacityPct = (remaining !== null && event?.capacity)
    ? Math.min(100, Math.round((confirmedCount / event.capacity) * 100))
    : 0;
  const isLimited = remaining !== null && event?.capacity
    && remaining <= Math.max(5, Math.floor(event.capacity * 0.25));

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: P.bg }}>
        <HomeNav darkMode={!isLight} onToggleDark={() => setIsLight(l => !l)} hasHero={false} />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh',
          fontFamily: NU, fontSize: 13, color: P.textMuted, letterSpacing: '0.2em' }}>
          Loading event…
        </div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div style={{ minHeight: '100vh', background: P.bg }}>
        <HomeNav darkMode={!isLight} onToggleDark={() => setIsLight(l => !l)} hasHero={false} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
          <div style={{ fontFamily: GD, fontSize: 28, color: P.text }}>Event not found</div>
          <button onClick={onBack} style={{ fontFamily: NU, fontSize: 13, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>
            ← Return home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: P.bg, fontFamily: NU, color: P.text, transition: 'background 0.3s, color 0.3s', ...(isPreview ? {} : { minHeight: '100vh' }) }}>

      {/* ── Nav — hidden in preview mode ── */}
      {!isPreview && (
        <HomeNav
          darkMode={!isLight}
          onToggleDark={() => setIsLight(l => !l)}
          hasHero={hasHero}
          onNavigateAbout={footerNav?.onNavigateAbout || (() => { window.location.href = '/about'; })}
          onNavigateStandard={footerNav?.onNavigateStandard || (() => { window.location.href = '/the-lwd-standard'; })}
        />
      )}
      <style>{`
        .event-desc-prose p { margin: 0 0 16px; }
        .event-desc-prose h2 { font-family: var(--font-heading-primary); font-size: 22px; font-weight: 400; margin: 28px 0 12px; }
        .event-desc-prose h3 { font-family: var(--font-heading-primary); font-size: 17px; font-weight: 400; margin: 22px 0 8px; }
        .event-desc-prose ul, .event-desc-prose ol { padding-left: 22px; margin: 0 0 16px; }
        .event-desc-prose li { margin-bottom: 6px; line-height: 1.75; }
        .event-desc-prose blockquote { border-left: 3px solid #c9a84c; margin: 20px 0; padding-left: 18px; opacity: 0.8; }
        .event-desc-prose strong { color: inherit; font-weight: 700; }
        .event-desc-prose a { color: #c9a84c; text-decoration: underline; }
      `}</style>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: isPreview ? 260 : (isMobile ? 340 : 520), overflow: 'hidden', background: '#111' }}>
        {useVideoHero && ytId(event.videoUrl) ? (
          // YouTube video hero: full-bleed autoplay muted loop
          <iframe
            src={`https://www.youtube.com/embed/${ytId(event.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${ytId(event.videoUrl)}&controls=0&disablekb=1&rel=0&showinfo=0&modestbranding=1&iv_load_policy=3`}
            allow="autoplay; encrypted-media"
            style={{
              position: 'absolute',
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: '177.78vh',   // 16:9 at full height
              minWidth: '100%',
              height: '100%',
              border: 'none',
              pointerEvents: 'none',
            }}
          />
        ) : useVideoHero && event.videoUrl ? (
          // Direct video file hero
          <video
            src={event.videoUrl}
            autoPlay muted loop playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : event.coverImageUrl ? (
          <img src={event.coverImageUrl} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: isLight ? '#e8e0d0' : 'linear-gradient(135deg, #1a1710 0%, #111 100%)' }} />
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.3) 55%, transparent 100%)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isPreview ? '20px 24px' : (isMobile ? '28px 20px' : '48px 60px') }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
            {event.eventType?.replace(/_/g, ' ') || 'Event'}{event.isVirtual && ' · Virtual'}
          </div>
          <h1 style={{ fontFamily: GD, fontSize: isPreview ? 26 : (isMobile ? 30 : 48), color: '#f5f0e8', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.1 }}>
            {event.title}
          </h1>
          {event.subtitle && (
            <p style={{ fontFamily: NU, fontSize: isPreview ? 13 : (isMobile ? 14 : 17), color: 'rgba(245,240,232,0.65)', margin: 0, maxWidth: 600 }}>
              {event.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Body: wide container, left + right columns ── */}
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: isPreview ? '24px 20px' : (isMobile ? '32px 18px' : '56px 40px'),
        display: isMobile ? 'block' : 'flex',
        gap: 48, alignItems: 'flex-start',
      }}>

        {/* ───────── LEFT COLUMN ─────────────────────────────────────── */}
        <div style={{ flex: '0 0 750px', minWidth: 0, maxWidth: '100%' }}>

          {/* Detail strip */}
          <div style={{
            background: P.card, border: `1px solid ${P.border}`, borderRadius: 4,
            padding: '22px 26px', marginBottom: 40,
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            {dateStr && (
              <DetailRow P={P} icon="📅">
                {dateStr}{timeStr ? ` at ${timeStr}` : ''}
                {endDateStr ? ` — ${endDateStr}${endTimeStr ? ` at ${endTimeStr}` : ''}` : (endTimeStr ? ` — ${endTimeStr}` : '')}
              </DetailRow>
            )}
            {event.isVirtual ? (
              <DetailRow P={P} icon="🌐">
                Virtual event{event.virtualPlatform && ` · ${event.virtualPlatform.replace(/_/g, ' ')}`}
              </DetailRow>
            ) : event.locationName ? (
              <DetailRow P={P} icon="📍">
                {event.locationName}{event.locationAddress && `, ${event.locationAddress}`}
              </DetailRow>
            ) : null}
            {event.capacity && (
              <DetailRow P={P} icon="👥">
                {event.capacity} places available{event.waitlistEnabled && ' · Waitlist available if full'}
              </DetailRow>
            )}
          </div>

          {/* Hosted by Venue */}
          {venue && (
            <div style={{
              background: P.card, border: `1px solid ${P.border}`, borderRadius: 4,
              padding: '20px 26px', marginBottom: 40,
              display: 'flex', alignItems: 'center', gap: 20,
              transition: 'background 0.3s, border-color 0.3s',
            }}>
              {/* Venue thumb */}
              {(venue.coverImg || venue.imgs?.[0]) && (
                <div style={{
                  width: 56, height: 56, borderRadius: 2, overflow: 'hidden',
                  flexShrink: 0, border: `1px solid ${P.border}`,
                }}>
                  <img
                    src={venue.coverImg || (typeof venue.imgs?.[0] === 'string' ? venue.imgs[0] : venue.imgs?.[0]?.src)}
                    alt={venue.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 5 }}>
                  Hosted by
                </div>
                <div style={{ fontFamily: GD, fontSize: 17, color: P.text, lineHeight: 1.2, marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {venue.name}
                </div>
                {/* Tagline — heroTagline preferred, fall back to shortDescription truncated */}
                {(venue.heroTagline || venue.shortDescription) && (
                  <div style={{
                    fontFamily: NU, fontSize: 11, color: P.textSub,
                    lineHeight: 1.5, marginBottom: 3,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  }}>
                    {venue.heroTagline || (venue.shortDescription?.slice(0, 90) + (venue.shortDescription?.length > 90 ? '…' : ''))}
                  </div>
                )}
                {(venue.city || venue.country) && (
                  <div style={{ fontFamily: NU, fontSize: 10, color: P.textMuted, letterSpacing: '0.04em' }}>
                    📍 {[venue.city, venue.country].filter(Boolean).join(', ')}
                  </div>
                )}
              </div>
              <a
                href={`/venues/${venue.slug}`}
                style={{
                  fontFamily: NU, fontSize: 11, color: GOLD, textDecoration: 'none',
                  border: `1px solid ${GOLD}50`, borderRadius: 2,
                  padding: '7px 14px', flexShrink: 0, letterSpacing: '0.08em',
                  whiteSpace: 'nowrap', transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = `${GOLD}14`}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                View Venue →
              </a>
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: 44 }}>
              <Label>About This Event</Label>
              <div
                className="event-desc-prose"
                style={{ fontFamily: GD, fontSize: 18, color: P.text, lineHeight: 1.85 }}
                dangerouslySetInnerHTML={{ __html: event.description }}
              />
            </div>
          )}

          {/* Gallery (with lightbox) */}
          <Gallery urls={event.galleryUrls} videoUrl={event.videoUrl} P={P} />

          {/* Map */}
          <EventMap event={event} P={P} />
          <GettingThere event={event} P={P} />

          {/* Venue Reviews */}
          {!isPreview && event.venueId && <VenueReviewsStrip venueId={event.venueId} venueName={venue?.name} P={P} />}

          {/* YouTube / stream embed */}
          {event.isVirtual && youtubeEmbedUrl && (
            <div style={{ marginBottom: 44 }}>
              <Label>Live Stream</Label>
              <div style={{
                position: 'relative', paddingBottom: '56.25%', height: 0,
                overflow: 'hidden', borderRadius: 4, background: P.iframeBg, border: `1px solid ${P.border}`,
              }}>
                <iframe
                  src={youtubeEmbedUrl} title={event.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                />
              </div>
              <a href={event.streamUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: NU, fontSize: 12, color: GOLD, display: 'inline-block', marginTop: 10 }}>
                Open in YouTube →
              </a>
            </div>
          )}

          {/* Replay */}
          {event.replayUrl && (
            <div style={{ marginBottom: 44, padding: '16px 20px', background: P.card, border: `1px solid ${P.border}`, borderRadius: 4 }}>
              <Label>Event Recording</Label>
              <a href={event.replayUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: NU, fontSize: 14, color: GOLD }}>
                Watch replay →
              </a>
            </div>
          )}

          {/* External link CTA */}
          {event.bookingMode === 'external' && event.externalBookingUrl && (
            <a href={event.externalBookingUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', padding: '16px 24px', background: GOLD,
                color: '#0e0c0a', borderRadius: 2, textDecoration: 'none',
                fontFamily: NU, fontSize: 13, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase', textAlign: 'center', marginBottom: 32,
              }}>
              Book Now →
            </a>
          )}

          {/* Secondary CTA — for scrollers who haven't booked yet */}
          {showBookingPanel && !booking && !isEventPast && (
            <div style={{
              marginBottom: 40,
              padding: '32px 36px',
              background: P.sectionBg,
              border: `1px solid ${P.border}`,
              borderRadius: 4,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              gap: 24, flexWrap: 'wrap',
            }}>
              <div>
                <div style={{ fontFamily: GD, fontSize: 22, color: P.text, marginBottom: 6, fontWeight: 400 }}>
                  Ready to attend?
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: P.textMuted }}>
                  {remaining === 0
                    ? "Join the waitlist \u2014 we\u2019ll notify you of cancellations."
                    : remaining !== null
                      ? `${remaining} place${remaining !== 1 ? 's' : ''} remaining. Secure yours today.`
                      : 'Reserve your place at this exclusive event.'}
                </div>
              </div>
              <a
                href="#booking-panel"
                onClick={e => {
                  e.preventDefault();
                  const el = document.getElementById('booking-panel');
                  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  else window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                style={{
                  display: 'inline-block', padding: '14px 28px',
                  background: GOLD, color: '#0e0c0a', borderRadius: 2,
                  fontFamily: NU, fontSize: 12, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  textDecoration: 'none', flexShrink: 0,
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Book Your Place →
              </a>
            </div>
          )}

          {/* On mobile the form renders here, below content */}
          {isMobile && showBookingPanel && (
            <div style={{ marginTop: 40 }}>
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 4, padding: '28px 22px' }}>
                {isEventPast ? (
                  <EventEndedPanel event={event} venue={venue} P={P} />
                ) : booking ? <BookingConfirmed booking={booking} event={event} P={P} /> : (
                  <>
                    <Label>{event.bookingMode === 'enquiry_only' ? 'Enquire' : event.isFree === false ? 'Reserve Your Place' : 'Register Your Place'}</Label>
                    <div style={{ fontFamily: GD, fontSize: 18, color: P.text, marginBottom: 4, lineHeight: 1.3 }}>{event.title}</div>
                    {event.isFree === false && event.ticketPrice && (
                      <div style={{ fontFamily: NU, fontSize: 12, color: GOLD, marginBottom: 14 }}>
                        From {event.ticketCurrency === 'GBP' ? '£' : event.ticketCurrency === 'EUR' ? '€' : '$'}{Number(event.ticketPrice).toLocaleString()} per guest
                        {event.ticketIncludes && <span style={{ color: P.textMuted }}> · {event.ticketIncludes}</span>}
                      </div>
                    )}
                    {dateStr && (
                      <div style={{ fontFamily: NU, fontSize: 12, color: P.textMuted, marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${P.border}` }}>
                        {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                      </div>
                    )}
                    <BookingForm event={event} onSuccess={r => setBooking(r)} P={P} />
                  </>
                )}
              </div>
              {event.tagsJson?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                  {event.tagsJson.map(tag => (
                    <span key={tag} style={{ fontFamily: NU, fontSize: 10, color: P.textMuted, border: `1px solid ${P.border}`, borderRadius: 2, padding: '3px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tag}</span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────── RIGHT COLUMN — 400px fixed, sticky ───────────────── */}
        {!isMobile && showBookingPanel && (
          <div id="booking-panel" style={{
            width: FORM_W, flexShrink: 0,
            position: 'sticky', top: 32, alignSelf: 'flex-start',
          }}>
            <div style={{
              background: P.card, border: `1px solid ${P.border}`, borderRadius: 4,
              padding: '28px 26px', transition: 'background 0.3s, border-color 0.3s',
            }}>
              {isEventPast ? (
                <EventEndedPanel event={event} venue={venue} P={P} />
              ) : booking ? <BookingConfirmed booking={booking} event={event} P={P} /> : (
                <>
                  <Label>{event.bookingMode === 'enquiry_only' ? 'Enquire' : event.isFree === false ? 'Reserve Your Place' : 'Register Your Place'}</Label>
                  <div style={{ fontFamily: GD, fontSize: 20, color: P.text, marginBottom: 4, lineHeight: 1.3, transition: 'color 0.3s' }}>
                    {event.title}
                  </div>
                  {event.isFree === false && event.ticketPrice && (
                    <div style={{ fontFamily: NU, fontSize: 13, color: GOLD, marginBottom: 14, letterSpacing: '0.02em' }}>
                      From {event.ticketCurrency === 'GBP' ? '£' : event.ticketCurrency === 'EUR' ? '€' : '$'}{Number(event.ticketPrice).toLocaleString()} per guest
                      {event.ticketIncludes && <span style={{ color: P.textMuted, fontWeight: 400 }}> · {event.ticketIncludes}</span>}
                    </div>
                  )}
                  {dateStr && (
                    <div style={{ fontFamily: NU, fontSize: 12, color: P.textMuted, marginBottom: 18, paddingBottom: 18, borderBottom: `1px solid ${P.border}` }}>
                      {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                    </div>
                  )}
                  {/* Availability urgency */}
                  {remaining !== null && (
                    <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${P.border}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <span style={{
                          fontFamily: NU, fontSize: 11, fontWeight: 700,
                          color: isLimited ? '#e87070' : P.textSub,
                          letterSpacing: '0.03em',
                        }}>
                          {isLimited ? '⚡ ' : ''}{remaining === 0 ? 'Fully booked' : `${remaining} of ${event.capacity} places remaining`}
                        </span>
                        {isLimited && remaining > 0 && (
                          <span style={{ fontFamily: NU, fontSize: 9, color: '#e87070', letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 700 }}>
                            Limited
                          </span>
                        )}
                      </div>
                      <div style={{ height: 3, background: P.border, borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{
                          width: `${capacityPct}%`, height: '100%', borderRadius: 99,
                          background: isLimited ? '#e87070' : GOLD,
                          transition: 'width 1s ease',
                        }} />
                      </div>
                    </div>
                  )}
                  <BookingForm event={event} onSuccess={r => setBooking(r)} P={P} />
                </>
              )}
            </div>

            {event.tagsJson?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 14 }}>
                {event.tagsJson.map(tag => (
                  <span key={tag} style={{ fontFamily: NU, fontSize: 10, color: P.textMuted, border: `1px solid ${P.border}`, borderRadius: 2, padding: '3px 8px', letterSpacing: '0.08em', textTransform: 'uppercase' }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SiteFooter rendered globally from main.jsx */}
    </div>
  );
}
