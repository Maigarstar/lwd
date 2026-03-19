// ─── EventDetailPage.jsx ──────────────────────────────────────────────────────
// Public-facing event detail page.
// Route: /events/:slug
//
// Features:
//  - Full site nav (HomeNav) with dark/light toggle
//  - Full-width hero with cover image + date/time overlay
//  - Event details (type, location/virtual, capacity)
//  - Rich description, gallery thumbnails
//  - Booking form (internal) or external link
//  - Add-to-calendar (Google + .ics)
//  - YouTube Live embed for virtual events
//  - Booking confirmation with calendar links
//  - Global SiteFooter
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
import HomeNav from '../components/nav/HomeNav';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#c9a84c';

// ── Palette factory — dark / light ────────────────────────────────────────────
function getPalette(isLight) {
  return isLight ? {
    bg:       '#faf8f5',
    card:     '#ffffff',
    border:   '#e8e0d4',
    border2:  '#d4c8b8',
    text:     '#1a1a18',
    textSub:  '#5a5045',
    textMuted:'#9a8e80',
    inputBg:  '#f5f0e8',
    iframeBg: '#f0ebe2',
  } : {
    bg:       '#0e0c0a',
    card:     '#1a1710',
    border:   '#2a2520',
    border2:  '#3a3028',
    text:     '#c8bfa8',
    textSub:  '#8a8070',
    textMuted:'#5a5045',
    inputBg:  '#0e0c0a',
    iframeBg: '#111',
  };
}

// ── Sub-components that receive palette (P) ────────────────────────────────────

function Label({ children, P }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.2em',
      textTransform: 'uppercase', marginBottom: 6,
    }}>{children}</div>
  );
}

function DetailRow({ icon, children, P }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', marginBottom: 12 }}>
      <span style={{ color: GOLD, fontSize: 16, flexShrink: 0, lineHeight: '22px' }}>{icon}</span>
      <span style={{ fontFamily: NU, fontSize: 14, color: P.text, lineHeight: 1.6 }}>{children}</span>
    </div>
  );
}

// ── Booking Form ──────────────────────────────────────────────────────────────
function BookingForm({ event, onSuccess, P }) {
  const { isMobile } = useBreakpoint();
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

  const inputStyle = {
    width: '100%', boxSizing: 'border-box',
    background: P.inputBg, border: `1px solid ${P.border}`,
    borderRadius: 2, padding: '10px 14px',
    fontFamily: NU, fontSize: 14, color: P.text,
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
          <Label P={P}>First Name *</Label>
          <input style={inputStyle} value={form.firstName}
            onChange={e => set('firstName', e.target.value)} placeholder="Sofia"
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <Label P={P}>Last Name *</Label>
          <input style={inputStyle} value={form.lastName}
            onChange={e => set('lastName', e.target.value)} placeholder="Ricci"
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
      </div>

      <div style={{ marginBottom: 12 }}>
        <Label P={P}>Email Address *</Label>
        <input type="email" style={inputStyle} value={form.email}
          onChange={e => set('email', e.target.value)} placeholder="sofia@example.com"
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = P.border} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        gap: 12, marginBottom: 12,
      }}>
        <div>
          <Label P={P}>Phone (optional)</Label>
          <input type="tel" style={inputStyle} value={form.phone}
            onChange={e => set('phone', e.target.value)} placeholder="+44 7700 000000"
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border} />
        </div>
        <div>
          <Label P={P}>Number of Guests</Label>
          <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.guestCount}
            onChange={e => set('guestCount', parseInt(e.target.value))}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = P.border}>
            {[1,2,3,4,5,6,7,8,9,10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'guest' : 'guests'}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Label P={P}>Message (optional)</Label>
        <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
          value={form.message} onChange={e => set('message', e.target.value)}
          placeholder="Any special requirements or questions…"
          onFocus={e => e.target.style.borderColor = GOLD}
          onBlur={e => e.target.style.borderColor = P.border} />
      </div>

      <div style={{ marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[
          { key: 'consentMarketing',     label: "I'd like to receive updates about future events and news from this venue." },
          { key: 'consentDataProcessing', label: "I consent to my data being processed to manage this booking. *" },
        ].map(c => (
          <label key={c.key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={form[c.key]} onChange={e => set(c.key, e.target.checked)}
              style={{ marginTop: 3, accentColor: GOLD, flexShrink: 0 }} />
            <span style={{ fontFamily: NU, fontSize: 12, color: P.textSub, lineHeight: 1.6 }}>{c.label}</span>
          </label>
        ))}
      </div>

      {error && (
        <div style={{ fontFamily: NU, fontSize: 13, color: '#f87171', marginBottom: 16,
          padding: '10px 14px', background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', borderRadius: 2 }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={submitting} style={{
        width: '100%', padding: '14px 24px',
        background: submitting ? P.border2 : GOLD,
        color: '#0e0c0a', border: 'none', borderRadius: 2,
        fontFamily: NU, fontSize: 13, fontWeight: 600, letterSpacing: '0.1em',
        textTransform: 'uppercase', cursor: submitting ? 'not-allowed' : 'pointer',
        transition: 'background 0.2s', opacity: submitting ? 0.7 : 1,
      }}>
        {submitting ? 'Registering…' : 'Confirm Registration'}
      </button>

      <p style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, textAlign: 'center', margin: '14px 0 0', lineHeight: 1.7 }}>
        Registration is free. A confirmation email will be sent to you within minutes.
      </p>
    </form>
  );
}

// ── Booking Confirmed ─────────────────────────────────────────────────────────
function BookingConfirmed({ booking, event, P }) {
  const handleDownloadIcs = () => {
    const blob = buildIcsBlob(event);
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${event.slug || 'event'}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ textAlign: 'center', padding: '32px 0' }}>
      <div style={{
        width: 56, height: 56, borderRadius: '50%',
        background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 24px', fontSize: 24, color: '#4ade80',
      }}>✓</div>

      <div style={{ fontFamily: GD, fontSize: 22, color: P.text, fontWeight: 400, marginBottom: 8 }}>
        You're registered
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: P.textSub, marginBottom: 24, lineHeight: 1.7 }}>
        A confirmation has been sent to your email.<br />
        Booking reference: <strong style={{ color: GOLD }}>{booking.bookingRef}</strong>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <a href={googleCalendarUrl(event)} target="_blank" rel="noopener noreferrer"
          style={{
            display: 'block', padding: '12px 20px',
            background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
            borderRadius: 2, fontFamily: NU, fontSize: 12, color: GOLD,
            letterSpacing: '0.1em', textTransform: 'uppercase', textDecoration: 'none',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.18)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}>
          📅 Add to Google Calendar
        </a>
        <button onClick={handleDownloadIcs} style={{
          display: 'block', width: '100%', padding: '12px 20px',
          background: 'transparent', border: `1px solid ${P.border}`,
          borderRadius: 2, fontFamily: NU, fontSize: 12, color: P.textSub,
          letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
        }}
          onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = P.border; e.currentTarget.style.color = P.textSub; }}>
          ⬇ Download .ics File
        </button>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────
export default function EventDetailPage({ slug, onBack, footerNav }) {
  const { isMobile } = useBreakpoint();

  const [event, setEvent]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [booking, setBooking]   = useState(null);
  const [isLight, setIsLight]   = useState(false); // dark by default — matches the luxury brand

  const P = getPalette(isLight);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);
    setBooking(null);
    fetchEventBySlug(slug).then(ev => {
      if (cancelled) return;
      if (!ev) setNotFound(true);
      else setEvent(ev);
      setLoading(false);
    }).catch(() => {
      if (!cancelled) { setNotFound(true); setLoading(false); }
    });
    return () => { cancelled = true; };
  }, [slug]);

  const dateStr    = event ? formatEventDate(event.startDate) : '';
  const timeStr    = event?.startTime ? formatEventTime(event.startTime) : null;
  const endDateStr = event?.endDate && event.endDate !== event.startDate ? formatEventDate(event.endDate) : null;
  const endTimeStr = event?.endTime ? formatEventTime(event.endTime) : null;

  const youtubeEmbedUrl = event?.streamUrl ? event.streamUrl
    .replace('watch?v=', 'embed/')
    .replace('youtu.be/', 'www.youtube.com/embed/')
    : null;

  // ── Loading / Not found states ────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <HomeNav darkMode={!isLight} onToggleDark={() => setIsLight(l => !l)} hasHero={false} />
        <div style={{ fontFamily: NU, fontSize: 13, color: P.textMuted, letterSpacing: '0.2em' }}>Loading event…</div>
      </div>
    );
  }

  if (notFound || !event) {
    return (
      <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <HomeNav darkMode={!isLight} onToggleDark={() => setIsLight(l => !l)} hasHero={false} />
        <div style={{ fontFamily: GD, fontSize: 28, color: P.text }}>Event not found</div>
        <button onClick={onBack}
          style={{ fontFamily: NU, fontSize: 13, color: GOLD, background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '0.1em' }}>
          ← Return home
        </button>
      </div>
    );
  }

  const CONTENT_MAX = 880;
  const RIGHT_W = '38%';
  const hasHero = !!event.coverImageUrl;

  return (
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: NU, color: P.text, transition: 'background 0.3s, color 0.3s' }}>

      {/* ── Global nav ── */}
      <HomeNav
        darkMode={!isLight}
        onToggleDark={() => setIsLight(l => !l)}
        hasHero={hasHero}
        onNavigateAbout={footerNav?.onNavigateAbout || (() => window.location.href = '/about')}
        onNavigateStandard={footerNav?.onNavigateStandard || (() => window.location.href = '/the-lwd-standard')}
      />

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: isMobile ? 340 : 500, overflow: 'hidden', background: '#111' }}>
        {hasHero ? (
          <img src={event.coverImageUrl} alt={event.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', background: isLight ? '#e8e0d0' : 'linear-gradient(135deg, #1a1710 0%, #111 100%)' }} />
        )}
        {/* Dark gradient overlay — always present for readability */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,8,6,0.92) 0%, rgba(10,8,6,0.35) 55%, transparent 100%)',
        }} />
        {/* Hero text */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: isMobile ? '28px 20px' : '44px 60px',
        }}>
          <div style={{
            fontFamily: NU, fontSize: 10, color: GOLD,
            letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10,
          }}>
            {event.eventType?.replace(/_/g, ' ') || 'Event'}
            {event.isVirtual && ' · Virtual'}
          </div>
          <h1 style={{
            fontFamily: GD, fontSize: isMobile ? 30 : 46,
            color: '#f5f0e8', fontWeight: 400, margin: '0 0 10px', lineHeight: 1.12,
          }}>
            {event.title}
          </h1>
          {event.subtitle && (
            <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 17, color: 'rgba(245,240,232,0.7)', margin: 0, maxWidth: 600 }}>
              {event.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        maxWidth: CONTENT_MAX, margin: '0 auto',
        padding: isMobile ? '32px 20px' : '52px 40px',
        display: isMobile ? 'block' : 'flex',
        gap: 52, alignItems: 'flex-start',
      }}>

        {/* ── Left: details + description + virtual ── */}
        <div style={{ flex: '1 1 auto', minWidth: 0 }}>

          {/* Detail strip */}
          <div style={{
            background: P.card, border: `1px solid ${P.border}`, borderRadius: 4,
            padding: '20px 24px', marginBottom: 36,
            transition: 'background 0.3s, border-color 0.3s',
          }}>
            {dateStr && (
              <DetailRow P={P} icon="📅">
                {dateStr}{timeStr ? ` at ${timeStr}` : ''}
                {endDateStr ? ` → ${endDateStr}${endTimeStr ? ` at ${endTimeStr}` : ''}` : (endTimeStr ? ` → ${endTimeStr}` : '')}
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

          {/* Description */}
          {event.description && (
            <div style={{ marginBottom: 44 }}>
              <Label P={P}>About This Event</Label>
              <div style={{
                fontFamily: GD, fontSize: 18, color: P.text, lineHeight: 1.85,
                whiteSpace: 'pre-wrap', transition: 'color 0.3s',
              }}>
                {event.description}
              </div>
            </div>
          )}

          {/* Gallery */}
          {event.galleryUrls?.length > 0 && (
            <div style={{ marginBottom: 44 }}>
              <Label P={P}>Gallery</Label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: 6 }}>
                {event.galleryUrls.slice(0, 6).map((url, i) => (
                  <div key={i} style={{ aspectRatio: '1', overflow: 'hidden', borderRadius: 2, background: P.iframeBg }}>
                    <img src={url} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* YouTube / Virtual stream embed */}
          {event.isVirtual && youtubeEmbedUrl && (
            <div style={{ marginBottom: 44 }}>
              <Label P={P}>Live Stream</Label>
              <div style={{
                position: 'relative', paddingBottom: '56.25%', height: 0,
                overflow: 'hidden', borderRadius: 4, background: P.iframeBg,
                border: `1px solid ${P.border}`,
              }}>
                <iframe
                  src={youtubeEmbedUrl}
                  title={event.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
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

          {/* Replay */}
          {event.replayUrl && (
            <div style={{ marginBottom: 44, padding: '16px 20px', background: P.card, border: `1px solid ${P.border}`, borderRadius: 4 }}>
              <Label P={P}>Event Recording</Label>
              <a href={event.replayUrl} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: NU, fontSize: 14, color: GOLD, letterSpacing: '0.05em' }}>
                Watch replay →
              </a>
            </div>
          )}

          {/* External booking CTA */}
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
        </div>

        {/* ── Right: sticky booking form / confirmation ── */}
        {(event.bookingMode === 'internal' || event.bookingMode === 'enquiry_only') && (
          <div style={{
            width: isMobile ? '100%' : RIGHT_W, flexShrink: 0,
            marginTop: isMobile ? 32 : 0,
            position: !isMobile ? 'sticky' : undefined,
            top: !isMobile ? 32 : undefined,
          }}>
            <div style={{
              background: P.card, border: `1px solid ${P.border}`, borderRadius: 4,
              padding: '28px 24px', transition: 'background 0.3s, border-color 0.3s',
            }}>
              {booking ? (
                <BookingConfirmed booking={booking} event={event} P={P} />
              ) : (
                <>
                  <Label P={P}>{event.bookingMode === 'enquiry_only' ? 'Enquire' : 'Register Your Place'}</Label>
                  <div style={{ fontFamily: GD, fontSize: 18, color: P.text, marginBottom: 20, lineHeight: 1.3, transition: 'color 0.3s' }}>
                    {event.title}
                  </div>
                  {dateStr && (
                    <div style={{ fontFamily: NU, fontSize: 12, color: P.textMuted, marginBottom: 20, paddingBottom: 20, borderBottom: `1px solid ${P.border}` }}>
                      {dateStr}{timeStr ? ` · ${timeStr}` : ''}
                    </div>
                  )}
                  <BookingForm event={event} onSuccess={result => setBooking(result)} P={P} />
                </>
              )}
            </div>

            {/* Tags */}
            {event.tagsJson?.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 16 }}>
                {event.tagsJson.map(tag => (
                  <span key={tag} style={{
                    fontFamily: NU, fontSize: 10, color: P.textMuted,
                    border: `1px solid ${P.border}`, borderRadius: 2,
                    padding: '3px 8px', letterSpacing: '0.08em', textTransform: 'uppercase',
                  }}>{tag}</span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* SiteFooter rendered globally from main.jsx — no local footer strip */}
    </div>
  );
}
