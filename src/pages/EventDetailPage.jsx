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
      <div style={{ marginBottom: 44 }}>
        <Label>Gallery</Label>

        {/* ── Video row (full width, own grid) ── */}
        {videoUrl && (() => {
          const thumb = videoThumb(videoUrl);
          const videoIdx = 0; // always index 0 in items
          return (
            <div
              onClick={() => setOpen(videoIdx)}
              style={{
                position: 'relative', width: '100%', aspectRatio: '16/9',
                overflow: 'hidden', borderRadius: 4, cursor: 'pointer',
                background: P.iframeBg, border: `1px solid ${P.border}`,
                marginBottom: images.length ? 6 : 0,
                transition: 'border-color 0.2s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = P.border}
            >
              {thumb && (
                <img src={thumb} alt="Video"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              )}
              {/* Play button overlay */}
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
                  transition: 'transform 0.2s',
                }}>
                  <span style={{ color: '#000', fontSize: 26, marginLeft: 4 }}>▶</span>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── Image grid (3-col, max 6 images) ── */}
        {images.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {images.map((src, i) => {
              const itemIdx = videoUrl ? i + 1 : i; // offset by 1 if video is item[0]
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
        )}

        {items.length > 1 && (
          <div style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, marginTop: 8, letterSpacing: '0.05em' }}>
            Click to enlarge{videoUrl ? ' · ▶ play video' : ''}
          </div>
        )}
      </div>

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
        {submitting ? 'Registering…' : 'Confirm Registration'}
      </button>

      <p style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, textAlign: 'center', margin: '12px 0 0', lineHeight: 1.7 }}>
        Free. Confirmation email sent within minutes.
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

  return (
    <div style={{ textAlign: 'center', padding: '28px 0' }}>
      <div style={{
        width: 52, height: 52, borderRadius: '50%',
        background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        margin: '0 auto 20px', fontSize: 22, color: '#4ade80',
      }}>✓</div>
      <div style={{ fontFamily: GD, fontSize: 21, color: P.text, fontWeight: 400, marginBottom: 8 }}>
        You're registered
      </div>
      <div style={{ fontFamily: NU, fontSize: 13, color: P.textSub, marginBottom: 24, lineHeight: 1.7 }}>
        Confirmation sent to your email.<br />
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
  const [isLight, setIsLight]   = useState(false);

  const P = getPalette(isLight);

  useEffect(() => {
    let cancelled = false;
    setLoading(true); setNotFound(false); setBooking(null);
    fetchEventBySlug(slug).then(ev => {
      if (cancelled) return;
      if (!ev) setNotFound(true); else setEvent(ev);
      setLoading(false);
    }).catch(() => { if (!cancelled) { setNotFound(true); setLoading(false); } });
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

  const useVideoHero = !!(event?.videoHeroMode && event?.videoUrl);
  const hasHero = useVideoHero || !!event?.coverImageUrl;
  const showBookingPanel = event && (event.bookingMode === 'internal' || event.bookingMode === 'enquiry_only');

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
    <div style={{ minHeight: '100vh', background: P.bg, fontFamily: NU, color: P.text, transition: 'background 0.3s, color 0.3s' }}>

      {/* ── Nav ── */}
      <HomeNav
        darkMode={!isLight}
        onToggleDark={() => setIsLight(l => !l)}
        hasHero={hasHero}
        onNavigateAbout={footerNav?.onNavigateAbout || (() => { window.location.href = '/about'; })}
        onNavigateStandard={footerNav?.onNavigateStandard || (() => { window.location.href = '/the-lwd-standard'; })}
      />

      {/* ── Hero ── */}
      <div style={{ position: 'relative', height: isMobile ? 340 : 520, overflow: 'hidden', background: '#111' }}>
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
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: isMobile ? '28px 20px' : '48px 60px' }}>
          <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.2em', textTransform: 'uppercase', marginBottom: 10 }}>
            {event.eventType?.replace(/_/g, ' ') || 'Event'}{event.isVirtual && ' · Virtual'}
          </div>
          <h1 style={{ fontFamily: GD, fontSize: isMobile ? 30 : 48, color: '#f5f0e8', fontWeight: 400, margin: '0 0 10px', lineHeight: 1.1 }}>
            {event.title}
          </h1>
          {event.subtitle && (
            <p style={{ fontFamily: NU, fontSize: isMobile ? 14 : 17, color: 'rgba(245,240,232,0.65)', margin: 0, maxWidth: 600 }}>
              {event.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* ── Body: wide container, left + right columns ── */}
      <div style={{
        maxWidth: 1240, margin: '0 auto',
        padding: isMobile ? '32px 18px' : '56px 40px',
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

          {/* On mobile the form renders here, below content */}
          {isMobile && showBookingPanel && (
            <div style={{ marginTop: 40 }}>
              <div style={{ background: P.card, border: `1px solid ${P.border}`, borderRadius: 4, padding: '28px 22px' }}>
                {booking ? <BookingConfirmed booking={booking} event={event} P={P} /> : (
                  <>
                    <Label>{event.bookingMode === 'enquiry_only' ? 'Enquire' : 'Register Your Place'}</Label>
                    <div style={{ fontFamily: GD, fontSize: 18, color: P.text, marginBottom: 18, lineHeight: 1.3 }}>{event.title}</div>
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
          <div style={{
            width: FORM_W, flexShrink: 0,
            position: 'sticky', top: 32,
          }}>
            <div style={{
              background: P.card, border: `1px solid ${P.border}`, borderRadius: 4,
              padding: '28px 26px', transition: 'background 0.3s, border-color 0.3s',
            }}>
              {booking ? <BookingConfirmed booking={booking} event={event} P={P} /> : (
                <>
                  <Label>{event.bookingMode === 'enquiry_only' ? 'Enquire' : 'Register Your Place'}</Label>
                  <div style={{ fontFamily: GD, fontSize: 20, color: P.text, marginBottom: 18, lineHeight: 1.3, transition: 'color 0.3s' }}>
                    {event.title}
                  </div>
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

      {/* SiteFooter rendered globally from main.jsx */}
    </div>
  );
}
