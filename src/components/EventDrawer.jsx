// ─── EventDrawer.jsx ──────────────────────────────────────────────────────────
// Slide-out panel from the right showing event details + booking form.
// Usage:
//   <EventDrawer event={eventObj} onClose={() => setEvent(null)} />
//   event = null → drawer is closed (hidden + no render cost)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useEffect, useCallback } from 'react';
import { formatEventDate, formatEventTime } from '../services/eventService';
import { submitEventBooking } from '../services/eventBookingService';
import { trackEvent } from '../services/userEventService';

const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';

const P = {
  bg:      '#faf8f5',
  card:    '#ffffff',
  border:  '#e8e0d4',
  text:    '#1a1a18',
  sub:     '#5a5045',
  muted:   '#9a8e80',
  inputBg: '#f5f0e8',
};

// ── Mini booking form ─────────────────────────────────────────────────────────
function BookingForm({ event, onSuccess }) {
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    guestCount: 1, message: '', consentMarketing: false, consentDataProcessing: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: P.inputBg, border: `1px solid ${P.border}`,
    borderRadius: 3, padding: '10px 13px',
    fontFamily: NU, fontSize: 13, color: P.text, outline: 'none',
    transition: 'border-color 0.15s',
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.firstName || !form.lastName || !form.email) {
      setError('Please fill in your name and email address.');
      return;
    }
    setSubmitting(true); setError(null);
    try {
      const result = await submitEventBooking(form, event);
      if (result.success) {
        trackEvent({ eventType: 'event_registration', entityType: 'event', entityId: event.id, metadata: { guestCount: form.guestCount, eventTitle: event.title, slug: event.slug } });
        onSuccess(result);
      }
      else { setError(result.error?.message || 'Booking failed. Please try again.'); setSubmitting(false); }
    } catch { setError('Something went wrong. Please try again.'); setSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.muted, marginBottom: 5 }}>First Name *</div>
          <input style={inp} value={form.firstName} placeholder="Sofia"
            onChange={e => set('firstName', e.target.value)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.muted, marginBottom: 5 }}>Last Name *</div>
          <input style={inp} value={form.lastName} placeholder="Ricci"
            onChange={e => set('lastName', e.target.value)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
      </div>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.muted, marginBottom: 5 }}>Email Address *</div>
        <input style={inp} type="email" value={form.email} placeholder="sofia@example.com"
          onChange={e => set('email', e.target.value)}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = P.border} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.muted, marginBottom: 5 }}>Phone</div>
          <input style={inp} type="tel" value={form.phone} placeholder="+44 7700 900000"
            onChange={e => set('phone', e.target.value)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.muted, marginBottom: 5 }}>Guests</div>
          <input style={inp} type="number" min={1} max={event.capacity || 20} value={form.guestCount}
            onChange={e => set('guestCount', parseInt(e.target.value) || 1)}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
      </div>
      <div style={{ marginBottom: 16 }}>
        <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase', color: P.muted, marginBottom: 5 }}>Message (optional)</div>
        <textarea style={{ ...inp, resize: 'vertical', minHeight: 72, lineHeight: 1.6 }}
          value={form.message} placeholder="Any questions or dietary requirements?"
          onChange={e => set('message', e.target.value)}
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = P.border} />
      </div>
      {error && <p style={{ fontFamily: NU, fontSize: 12, color: '#ef4444', margin: '0 0 12px' }}>{error}</p>}
      <button
        type="submit" disabled={submitting}
        style={{
          width: '100%', padding: '13px 0',
          background: submitting ? '#ccc' : '#1a1a18', color: '#fff',
          border: 'none', borderRadius: 3, cursor: submitting ? 'not-allowed' : 'pointer',
          fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
          transition: 'background 0.15s',
        }}
      >
        {submitting ? 'Submitting…' : event.isFree === false ? 'Reserve My Place' : 'Register My Place'}
      </button>
      <p style={{ fontFamily: NU, fontSize: 11, color: P.muted, textAlign: 'center', margin: '10px 0 0', lineHeight: 1.5 }}>
        You will receive a confirmation email shortly after registering.
      </p>
    </form>
  );
}

// ── Confirmed state ───────────────────────────────────────────────────────────
function BookingConfirmed({ event }) {
  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{ fontSize: 36, marginBottom: 16 }}>✓</div>
      <h3 style={{ fontFamily: GD, fontSize: 20, fontWeight: 400, color: P.text, margin: '0 0 8px' }}>You're registered</h3>
      <p style={{ fontFamily: NU, fontSize: 13, color: P.sub, lineHeight: 1.7, margin: '0 0 20px' }}>
        Thank you for registering for <strong>{event.title}</strong>. A confirmation has been sent to your email.
      </p>
      <a
        href={`/events/${event.slug}`}
        style={{ fontFamily: NU, fontSize: 12, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${GOLD}`, paddingBottom: 2 }}
      >
        View full event page →
      </a>
    </div>
  );
}

// ── Main drawer ───────────────────────────────────────────────────────────────
export default function EventDrawer({ event, onClose }) {
  const [booking, setBooking] = useState(null);
  const [visible, setVisible] = useState(false);

  // Animate in when event is set + fire tracking
  useEffect(() => {
    if (event) {
      setBooking(null);
      trackEvent({ eventType: 'event_drawer_open', entityType: 'event', entityId: event.id, metadata: { eventTitle: event.title, slug: event.slug, surface: 'venue_profile' } });
      // Tiny delay lets the element mount before the transform kicks in
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
    }
  }, [event]);

  // Close on Escape
  const handleKey = useCallback((e) => {
    if (e.key === 'Escape') onClose();
  }, [onClose]);
  useEffect(() => {
    if (event) { document.addEventListener('keydown', handleKey); }
    return () => document.removeEventListener('keydown', handleKey);
  }, [event, handleKey]);

  // Lock body scroll while open
  useEffect(() => {
    if (event) { document.body.style.overflow = 'hidden'; }
    else { document.body.style.overflow = ''; }
    return () => { document.body.style.overflow = ''; };
  }, [event]);

  if (!event) return null;

  const dateStr = formatEventDate(event.startDate);
  const timeStr = event.startTime ? formatEventTime(event.startTime) : null;
  const endTimeStr = event.endTime ? formatEventTime(event.endTime) : null;
  const showBooking = event.bookingMode === 'internal' || event.bookingMode === 'enquiry_only' || !event.bookingMode;

  const hasPractical = event.nearestAirport || event.nearestTrainStation || event.transportNotes || event.parkingInfo || event.guestLogistics;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 1100,
          background: 'rgba(0,0,0,0.45)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.3s ease',
        }}
      />

      {/* Drawer panel */}
      <div
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 1101,
          width: 'min(520px, 100vw)',
          background: P.bg,
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.35s cubic-bezier(0.32, 0, 0.16, 1)',
          display: 'flex', flexDirection: 'column',
          boxShadow: '-8px 0 40px rgba(0,0,0,0.18)',
          overflowY: 'hidden',
        }}
      >
        {/* ── Cover image hero ── */}
        <div style={{ position: 'relative', flexShrink: 0, height: 220, background: '#1a1a18', overflow: 'hidden' }}>
          {event.coverImageUrl && (
            <img src={event.coverImageUrl} alt={event.title}
              style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.85 }} />
          )}
          {/* Gradient */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.65) 100%)' }} />

          {/* Close button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute', top: 14, right: 14,
              width: 34, height: 34, borderRadius: '50%',
              background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.2)',
              color: '#fff', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
            aria-label="Close"
          >✕</button>

          {/* View full page link */}
          <a
            href={`/events/${event.slug}`}
            style={{
              position: 'absolute', top: 14, left: 14,
              fontFamily: NU, fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)', textDecoration: 'none',
              background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.15)',
              padding: '5px 10px', borderRadius: 2, backdropFilter: 'blur(4px)',
              transition: 'color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'}
            onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.7)'}
          >
            Full page ↗
          </a>

          {/* Event type badge */}
          <div style={{ position: 'absolute', bottom: 14, left: 18 }}>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, marginBottom: 5 }}>
              {event.eventType?.replace(/_/g, ' ') || 'Event'}
              {event.isVirtual && <span style={{ marginLeft: 8, color: '#93c5fd' }}>· Virtual</span>}
            </div>
            <h2 style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: '#fff', margin: 0, lineHeight: 1.2, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {event.title}
            </h2>
            {event.subtitle && (
              <p style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.72)', margin: '5px 0 0', lineHeight: 1.5 }}>{event.subtitle}</p>
            )}
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 24px 48px' }}>

          {/* Date / time / location strip */}
          <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 4, padding: '14px 18px', marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📅</span>
              <div>
                <div style={{ fontFamily: NU, fontSize: 13, color: P.text, fontWeight: 600 }}>{dateStr}</div>
                {(timeStr || endTimeStr) && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: P.sub, marginTop: 2 }}>
                    {timeStr}{endTimeStr ? ` – ${endTimeStr}` : ''}{event.timezone ? ` · ${event.timezone}` : ''}
                  </div>
                )}
              </div>
            </div>
            {(event.locationName || event.locationAddress) && !event.isVirtual && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <span style={{ fontSize: 14, flexShrink: 0, marginTop: 1 }}>📍</span>
                <div style={{ fontFamily: NU, fontSize: 13, color: P.text }}>
                  {event.locationName}
                  {event.locationAddress && <div style={{ fontSize: 12, color: P.sub, marginTop: 2 }}>{event.locationAddress}</div>}
                </div>
              </div>
            )}
            {event.isVirtual && event.virtualPlatform && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>💻</span>
                <div style={{ fontFamily: NU, fontSize: 13, color: P.text, textTransform: 'capitalize' }}>{event.virtualPlatform?.replace(/_/g, ' ')}</div>
              </div>
            )}
            {event.capacity && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ fontSize: 14, flexShrink: 0 }}>👥</span>
                <div style={{ fontFamily: NU, fontSize: 12, color: P.sub }}>Limited to {event.capacity} guests{event.waitlistEnabled ? ' · Waitlist available' : ''}</div>
              </div>
            )}
          </div>

          {/* Map embed */}
          {!event.isVirtual && (event.locationAddress || event.locationName) && (
            <div style={{ borderRadius: 4, overflow: 'hidden', border: `1px solid ${P.border}`, marginBottom: 20 }}>
              <iframe
                title="Event location"
                width="100%" height="180"
                style={{ display: 'block', border: 'none' }}
                loading="lazy"
                src={`https://www.google.com/maps?q=${encodeURIComponent(event.locationAddress || event.locationName)}&output=embed&z=15`}
              />
            </div>
          )}

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 10, fontWeight: 600 }}>About This Event</div>
              <div style={{ fontFamily: NU, fontSize: 13, color: P.sub, lineHeight: 1.85, whiteSpace: 'pre-wrap' }}>{event.description}</div>
            </div>
          )}

          {/* Getting there */}
          {hasPractical && (
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 10, fontWeight: 600 }}>Getting There</div>
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 4, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {event.nearestAirport && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: P.sub, display: 'flex', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>✈</span>
                    <span>{event.nearestAirport}{event.travelTime ? ` · ${event.travelTime}` : ''}</span>
                  </div>
                )}
                {event.nearestTrainStation && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: P.sub, display: 'flex', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>🚂</span>
                    <span>{event.nearestTrainStation}{event.trainTravelTime ? ` · ${event.trainTravelTime}` : ''}</span>
                  </div>
                )}
                {event.transportNotes && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: P.sub, display: 'flex', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>🚗</span>
                    <span>{event.transportNotes}</span>
                  </div>
                )}
                {event.parkingInfo && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: P.sub, display: 'flex', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>🅿</span>
                    <span>{event.parkingInfo}</span>
                  </div>
                )}
                {event.guestLogistics && (
                  <div style={{ fontFamily: NU, fontSize: 12, color: P.sub, display: 'flex', gap: 8 }}>
                    <span style={{ flexShrink: 0 }}>ℹ</span>
                    <span>{event.guestLogistics}</span>
                  </div>
                )}
                {event.directionsLink && (
                  <a href={event.directionsLink} target="_blank" rel="noopener noreferrer"
                    style={{ fontFamily: NU, fontSize: 11, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', textDecoration: 'none', borderBottom: `1px solid ${GOLD}`, display: 'inline-block', marginTop: 4 }}>
                    Get directions →
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, background: P.border, margin: '4px 0 24px' }} />

          {/* Booking / Register section */}
          {booking ? (
            <BookingConfirmed event={event} />
          ) : showBooking ? (
            <div>
              <div style={{ fontFamily: NU, fontSize: 10, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 4, fontWeight: 600 }}>
                {event.bookingMode === 'enquiry_only' ? 'Enquire' : event.isFree === false ? 'Reserve Your Place' : 'Register Your Place'}
              </div>
              <p style={{ fontFamily: NU, fontSize: 12, color: P.muted, margin: '0 0 16px', lineHeight: 1.6 }}>
                {event.isFree === false
                  ? `Tickets from £${event.ticketPrice || '—'}. Complete the form and we'll be in touch to confirm your place.`
                  : 'Complimentary. Complete the form below and we\'ll confirm your place.'}
              </p>
              <BookingForm event={event} onSuccess={r => setBooking(r)} />
            </div>
          ) : event.bookingMode === 'external' && event.externalBookingUrl ? (
            <a
              href={event.externalBookingUrl} target="_blank" rel="noopener noreferrer"
              style={{
                display: 'block', width: '100%', boxSizing: 'border-box',
                padding: '14px 0', background: '#1a1a18', color: '#fff',
                textAlign: 'center', borderRadius: 3, textDecoration: 'none',
                fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.08em',
              }}
            >
              Book on External Site →
            </a>
          ) : null}
        </div>
      </div>
    </>
  );
}
