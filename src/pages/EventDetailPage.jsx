// ─── EventDetailPage.jsx ──────────────────────────────────────────────────────
// Public-facing event detail page.
// Route: /events/:slug
//
// Features:
//  - Full-width hero with cover image + date/time overlay
//  - Event details (type, location/virtual, capacity, organiser)
//  - Rich description
//  - Booking form (internal bookingMode) or external link
//  - Add-to-calendar (Google Calendar + .ics download)
//  - YouTube Live embed for virtual events
//  - Booking confirmation toast
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import {
  fetchEventBySlug,
  formatEventDate,
  formatEventTime,
  googleCalendarUrl,
  buildIcsBlob,
} from '../services/eventService';
import { submitEventBooking } from '../services/eventBookingService';
import { useBreakpoint } from '../hooks/useWindowWidth';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#c9a84c';
const BG   = '#0e0c0a';
const CARD = '#1a1710';
const BORDER = '#2a2520';

// ── Helpers ───────────────────────────────────────────────────────────────────

function Label({ children }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.2em',
      textTransform: 'uppercase', marginBottom: 6,
    }}>{children}</div>
  );
}

function DetailRow({ icon, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
      <span style={{ color: GOLD, fontSize: 16, flexShrink: 0, lineHeight: '22px' }}>{icon}</span>
      <span style={{ fontFamily: NU, fontSize: 14, color: '#c8bfa8', lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingForm({ event, onSuccess }) {
  const { isMobile } = useBreakpoint();
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    guestCount: 1, message: '',
    consentMarketing: false, consentDataProcessing: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

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

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: '#0e0c0a', border: `1px solid ${BORDER}`,
    borderRadius: 2, padding: '10px 14px',
    fontFamily: NU, fontSize: 14, color: '#e8e0d0',
    outline: 'none', transition: 'border-color 0.2s',
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 12, marginBottom: 12,
      }}>
        <div>
          <Label>First Name *</Label>
          <input
            style={inputStyle}
            value={form.firstName}
            onChange={e => set('firstName', e.target.value)}
            placeholder="Sofia"
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
        </div>
        <div>
          <Label>Last Name *</Label>
          <input
            style={inputStyle}
            value={form.lastName}
            onChange={e => set('lastName', e.target.value)}
            placeholder="Ricci"
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Label>Email Address *</Label>
        <input
          type="email"
          style={inputStyle}
          value={form.email}
          onChange={e => set('email', e.target.value)}
          placeholder="sofia@example.com"
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 12, marginBottom: 12,
      }}>
        <div>
          <Label>Phone (optional)</Label>
          <input
            type="tel"
            style={inputStyle}
            value={form.phone}
            onChange={e => set('phone', e.target.value)}
            placeholder="+44 7700 000000"
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = BORDER}
          />
        </div>
        <div>
          <Label>Number of Guests</Label>
          <select
            style={{ ...inputStyle, cursor: 'pointer' }}
            value={form.guestCount}
            onChange={e => set('guestCount', parseInt(e.target.value))}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = BORDER}
          >
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Label>Message (optional)</Label>
        <textarea
          style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={form.message}
          onChange={e => set('message', e.target.value)}
          placeholder="Any special requirements or questions…"
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = BORDER}
        />
      </div>

      {/* Consent checkboxes */}
      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'consentMarketing', label: 'I\'d like to receive updates about future events and news from this venue.' },
          { key: 'consentDataProcessing', label: 'I consent to my data being processed to manage this booking. *', required: true },
        ].map(c => (
          <label key={c.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={form[c.key]}
              onChange={e => set(c.key, e.target.checked)}
              style={{ marginTop: 3, accentColor: GOLD, flexShrink: 0 }}
            />
            <span style={{ fontFamily: NU, fontSize: 12, color: '#8a8070', lineHeight: 1.6 }}>{c.label}</span>
          </label>
        ))}
      </div>

      {error && (
        <div style={{ fontFamily: NU, fontSize: 13, color: '#f87171', marginBottom: 16, padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 2 }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', padding: '14px 24px',
          background: submitting ? '#555' : GOLD,
          color: '#0e0c0a', border: 'none', borderRadius: 2,
          fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
          textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer',
          transition: 'background 0.2s, opacity 0.2s',
          opacity: submitting ? 0.7 : 1,
        }}
      >
        {submitting ? 'Registering…' : 'Confirm Registration'}
      </button>

      <p style={{ fontFamily: NU, fontSize: 11, color: '#5a5045', textAlign: 'center', margin: '14px 0 0', lineHeight: 1.7 }}>
        Registration is free. A confirmation email will be sent to you within minutes.
      </p>
    </form>
  );
}

// ── Confirmation State ─────────────────────────────────────────────────────────
function BookingConfirmed({ booking, event }) {
  const handleDownloadIcs = () => {
    const blob = buildIcsBlob(event);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${event.slug || 'event'}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      {/* Checkmark */}
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', fontSize: 24,
      }}>✓</div>

      <div style={{ fontFamily: GD, fontSize: 22, color: '#f0ece4', fontWeight: 400, marginBottom: 8 }}>
        You're registered
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: '#8a8070', marginBottom: 24, lineHeight: 1.7 }}>
        A confirmation has been sent to your email.<br />
        Booking reference: <strong style={{ color: GOLD }}>{booking.bookingRef}</strong>
      </div>

      {/* Add to Calendar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a
          href={googleCalendarUrl(event)}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'block', padding: '12px 20px',
            background: 'rgba(201,168,76,0.1)', border: `1px solid rgba(201,168,76,0.3)`,
            borderRadius: 2, fontFamily: NU, fontSize: 12, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            textDecoration: 'none', cursor: 'pointer',
            transition: 'background 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
        >
          📅 Add to Google Calendar
        </a>
        <button
          onClick={handleDownloadIcs}
          style={{
            display: 'block', width: '100%', padding: '12px 20px',
            background: 'transparent', border: `1px solid ${BORDER}`,
            borderRadius: 2, fontFamily: NU, fontSize: 12, color: '#8a8070',
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'border-color 0.2s, color 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = BORDER; e.currentTarget.style.color = '#8a8070'; }}
        >
          ⬇ Download .ics File
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EventDetailPage({ slug, onBack }) {
  const { isMobile } = useBreakpoint();
  const [event, setEvent]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [notFound, setNotFound]   = useState(false);
  const [booking, setBooking]     = useState(null); // confirmed booking result

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setBooking(null);
    fetchEventBySlug(slug).then(ev => {
      if (cancelled) return;
      if (!ev) { setNotFound(true); }
      else { setEvent(ev); }
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setNotFound(true); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [slug]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: NU, fontSize: 13, color: '#5a5045', letterSpacing: '0.2em' }}>Loading event…</div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div style={{ minHeight: '100vh', background: BG, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ fontFamily: GD, fontSize: 28, color: '#c8bfa8' }}>Event not found</div>
        <button
          onClick={onBack}
          style={{ fontFamily: NU, fontSize: 13, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}
        >
          ← Return home
        </button>
      </div>
    );
  }

  const dateStr = formatEventDate(event.startDate);
  const timeStr = event.startTime ? formatEventTime(event.startTime) : null;
  const endDateStr = event.endDate && event.endDate !== event.startDate ? formatEventDate(event.endDate) : null;
  const endTimeStr = event.endTime ? formatEventTime(event.endTime) : null;

  const isYoutubeLive = event.virtualPlatform === 'youtube_live' || event.streamUrl?.includes('youtube');
  const youtubeEmbedUrl = event.streamUrl ? event.streamUrl
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
    : null;

  // Layout: 2-col on desktop, single col on mobile
  const CONTENT_MAX = 880;
  const LEFT_W  = '58%';
  const RIGHT_W = '38%';

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: NU, color: '#c8bfa8' }}>

      {/* ── Back link ── */}
      <div style={{ padding: isMobile ? '16px 20px' : '20px 40px', borderBottom: `1px solid ${BORDER}` }}>
        <button
          onClick={onBack}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            fontFamily: NU, fontSize: 12, color: '#5a5045',
            letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: 6,
          }}
          onMouseEnter={e => e.currentTarget.style.color = GOLD}
          onMouseLeave={e => e.currentTarget.style.color = '#5a5045'}
        >
          ← Back
        </button>
      </div>

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: isMobile ? 320 : 480, overflow: 'hidden', background: '#111' }}>
        {event.coverImageUrl ? (
          <img
            src={event.coverImageUrl}
            alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1710 0%, #111 100%)' }} />
        )}
        {/* Overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(14,12,10,0.9) 0%, rgba(14,12,10,0.3) 50%, transparent 100%)',
        }} />
        {/* Hero content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: isMobile ? '24px 20px' : '40px 60px',
        }}>
          <div style={{
            fontFamily: NU, fontSize: 10, color: GOLD,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            {event.eventType?.replace(/_/g, ' ') || 'Event'}
            {event.isVirtual && ' · Virtual'}
          </div>
          <h1 style={{
            fontFamily: GD, fontSize: isMobile ? 28 : 42,
            color: '#f5f0e8', fontWeight: 400, margin: '0 0 8px', lineHeight: 1.15,
          }}>
            {event.title}
          </h1>
          {event.subtitle && (
            <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 16, color: '#a09080', margin: 0 }}>
              {event.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        maxWidth: CONTENT_MAX, margin: '0 auto',
        padding: isMobile ? '32px 20px' : '48px 40px',
        display: isMobile ? 'block' : 'flex',
        gap: 48, alignItems: 'flex-start',
      }}>

        {/* ── Left: details + description + virtual ── */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>

          {/* Quick detail strip */}
          <div style={{
            background: CARD, border: `1px solid ${BORDER}`, borderRadius: 4,
            padding: '20px 24px', marginBottom: 32,
          }}>
            {dateStr && (
              <DetailRow icon="📅">
                {dateStr}{timeStr ? ` at ${timeStr}` : ''}
                {endDateStr ? ` → ${endDateStr}${endTimeStr ? ` at ${endTimeStr}` : ''}` : (endTimeStr ? ` → ${endTimeStr}` : '')}
              </DetailRow>
            )}
            {event.isVirtual ? (
              <DetailRow icon="🌐">
                Virtual event
                {event.virtualPlatform && ` · ${event.virtualPlatform.replace(/_/g, ' ')}`}
              </DetailRow>
            ) : event.locationName ? (
              <DetailRow icon="📍">
                {event.locationName}
                {event.locationAddress && `, ${event.locationAddress}`}
              </DetailRow>
            ) : null}
            {event.capacity && (
              <DetailRow icon="👥">
                {event.capacity} places available
                {event.waitlistEnabled && ' · Waitlist available if full'}
              </DetailRow>
            )}
          </div>

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: 40 }}>
              <Label>About This Event</Label>
              <div style={{
                fontFamily: GD, fontSize: 18, color: '#c8bfa8', lineHeight: 1.8,
                whiteSpace: 'pre-wrap',
              }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Gallery thumbnails */}
          {event.galleryUrls?.length > 0 && (
            <div style={{ marginBottom: 40 }}>
              <Label>Gallery</Label>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
                gap: 6,
              }}>
                {event.galleryUrls.slice(0, 6).map((url, i) => (
                  <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 2, background: '#111' }}>
                    <img src={url} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube / Virtual stream embed */}
          {event.isVirtual && youtubeEmbedUrl && (
            <div style={{ marginBottom: 40 }}>
              <Label>Live Stream</Label>
              <div style={{
                position: 'relative', paddingBottom: '56.25%', height: 0,
                overflow: 'hidden', borderRadius: 4, background: '#111',
                border: `1px solid ${BORDER}`,
              }}>
                <iframe
                  src={youtubeEmbedUrl}
                  title={event.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{
                    position: 'absolute', top: 0, left: 0,
                    width: '100%', height: '100%', border: 'none',
                  }}
                />
              </div>
              {event.streamUrl && (
                <a href={event.streamUrl} target="_blank" rel="noopener noreferrer"
                  style={{ fontFamily: NU, fontSize: 12, color: GOLD, display: 'inline-block', marginTop: 10, letterSpacing: '0.05em' }}>
                  Open in YouTube →
                </a>
              )}
            </div>
          )}

          {/* Replay link */}
          {event.replayUrl && (
            <div style={{ marginBottom: 40, padding: '16px 20px', background: CARD, border: `1px solid ${BORDER}`, borderRadius: 4 }}>
              <Label>Event Recording</Label>
              <a href={event.replayUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: NU, fontSize: 14, color: GOLD, letterSpacing: '0.05em' }}>
                Watch replay →
              </a>
            </div>
          )}

          {/* External booking button */}
          {event.bookingMode === 'external' && event.externalBookingUrl && (
            <a
              href={event.externalBookingUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'block', padding: '16px 24px', background: GOLD,
                color: '#0e0c0a', borderRadius: 2, textDecoration: 'none',
                fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
                textTransform: 'uppercase', textAlign: 'center', marginBottom: 32,
              }}
            >
              Book Now (External) →
            </a>
          )}
        </div>

        {/* ── Right: booking form / confirmation ── */}
        {(event.bookingMode === 'internal' || event.bookingMode === 'enquiry_only') && (
          <div style={{
            width: isMobile ? '100%' : RIGHT_W,
            flexShrink: 0,
            marginTop: isMobile ? 32 : 0,
            position: !isMobile ? 'sticky' : undefined,
            top: !isMobile ? 24 : undefined,
          }}>
            <div style={{
              background: CARD, border: `1px solid ${BORDER}`, borderRadius: 4,
              padding: '28px 24px',
            }}>
              {booking ? (
                <BookingConfirmed booking={booking} event={event} />
              ) : (
                <>
                  <Label>{event.bookingMode === 'enquiry_only' ? 'Enquire' : 'Register Your Place'}</Label>
                  <div style={{ fontFamily: GD, fontSize: 18, color: '#f0ece4', marginBottom: 20, lineHeight: 1.3 }}>
                    {event.title}
                  </div>
                  {dateStr && (
                    <div style={{ fontFamily: NU, fontSize: 12, color: '#6a6050', marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${BORDER}` }}>
                      {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                    </div>
                  )}
                  <BookingForm
                    event={event}
                    onSuccess={(result) => setBooking(result)}
                  />
                </>
              )}
            </div>

            {/* Tags */}
            {event.tagsJson?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {event.tagsJson.map(tag => (
                  <span key={tag} style={{
                    fontFamily: NU, fontSize: 10, color: '#5a5045',
                    border: '1px solid #2a2520', borderRadius: 2,
                    padding: '3px 8px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Footer strip ── */}
      <div style={{
        borderTop: `1px solid ${BORDER}`,
        padding: isMobile ? '20px' : '24px 40px',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontFamily: NU, fontSize: 11, color: '#3a3530', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Luxury Wedding Directory · luxuryweddingdirectory.com
        </span>
      </div>
    </div>
  );
}
