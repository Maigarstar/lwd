// ─── EventReviewPage.jsx ─────────────────────────────────────────────────────
// Pre-filled review form for event attendees.
// Route: /review?token=UUID
// The token is the review_token UUID on event_bookings.
// Submits a review against the VENUE (entity_type: 'venue') tagged with event_id.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabaseClient';

// ── Typography constants (matches EventDetailPage palette) ──────────────────
const GD  = '"Cormorant Garamond", Georgia, serif';
const NU  = '"Nunito Sans", system-ui, sans-serif';
const GOLD = '#c9a96e';

const P = {
  bg:        '#0e0c0a',
  surface:   '#141210',
  border:    'rgba(255,255,255,0.08)',
  text:      '#f5f0e8',
  textSub:   'rgba(245,240,232,0.65)',
  textMuted: 'rgba(245,240,232,0.38)',
  inputBg:   'rgba(255,255,255,0.04)',
};

// ── Star Rating Component ────────────────────────────────────────────────────
function StarRating({ value, onChange, size = 28, readonly = false }) {
  const [hover, setHover] = useState(0);
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readonly && onChange(n)}
          onMouseEnter={() => !readonly && setHover(n)}
          onMouseLeave={() => !readonly && setHover(0)}
          style={{
            fontSize: size,
            cursor: readonly ? 'default' : 'pointer',
            color: (hover || value) >= n ? GOLD : 'rgba(255,255,255,0.18)',
            transition: 'color 0.12s',
            lineHeight: 1,
            userSelect: 'none',
          }}>
          ★
        </span>
      ))}
    </div>
  );
}

// ── Sub-rating row ───────────────────────────────────────────────────────────
function SubRatingRow({ label, value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0', borderBottom: `1px solid ${P.border}` }}>
      <span style={{ fontFamily: NU, fontSize: 13, color: P.textSub }}>{label}</span>
      <StarRating value={value} onChange={onChange} size={20} />
    </div>
  );
}

// ── Fetch booking by token ───────────────────────────────────────────────────
async function fetchBookingByToken(token) {
  if (!isSupabaseAvailable() || !token) return null;
  const { data, error } = await supabase
    .from('event_bookings')
    .select(`
      id, first_name, last_name, email, event_id, venue_id, booking_ref,
      events ( id, title, start_date, slug, location_name, venue_id,
        listings ( id, name, slug, hero_image_url, card_image_url, city, country )
      )
    `)
    .eq('review_token', token)
    .single();
  if (error) {
    console.warn('[EventReviewPage] fetchBookingByToken:', error.message);
    return null;
  }
  return data;
}

// ── Submit review via Supabase ───────────────────────────────────────────────
async function submitEventReview({ venueId, eventId, formData }) {
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      entity_type:       'venue',
      entity_id:         venueId,
      event_id:          eventId,
      source:            'event',
      reviewer_name:     formData.reviewer_name,
      reviewer_email:    formData.reviewer_email,
      reviewer_location: formData.reviewer_location || null,
      event_type:        formData.event_type || null,
      event_date:        formData.event_date || null,
      overall_rating:    formData.overall_rating,
      sub_ratings:       formData.sub_ratings || {},
      review_title:      formData.review_title || null,
      review_text:       formData.review_text,
      moderation_status: 'pending',
      is_verified:       true,   // verified attendee — auto-verified
    })
    .select('id')
    .single();
  if (error) throw error;
  return data;
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function EventReviewPage() {
  const token = new URLSearchParams(window.location.search).get('token');

  const [step, setStep]       = useState('loading');  // loading | form | submitted | invalid
  const [booking, setBooking] = useState(null);
  const [form, setForm]       = useState({
    reviewer_name:     '',
    reviewer_email:    '',
    reviewer_location: '',
    event_type:        '',
    event_date:        '',
    overall_rating:    0,
    sub_ratings:       { venue: 0, service: 0, value: 0 },
    review_title:      '',
    review_text:       '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]           = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setSub = (k, v) => setForm(f => ({ ...f, sub_ratings: { ...f.sub_ratings, [k]: v } }));

  // ── Load booking ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!token) { setStep('invalid'); return; }
    fetchBookingByToken(token).then(b => {
      if (!b) { setStep('invalid'); return; }
      setBooking(b);
      setForm(f => ({
        ...f,
        reviewer_name:  `${b.first_name || ''} ${b.last_name || ''}`.trim(),
        reviewer_email: b.email || '',
        event_date:     b.events?.start_date || '',
        event_type:     'wedding',
      }));
      setStep('form');
    });
  }, [token]);

  // ── Handle submit ────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.overall_rating) { setError('Please select an overall rating.'); return; }
    if (!form.review_text.trim()) { setError('Please write a few words about your experience.'); return; }

    const venueId = booking.venue_id || booking.events?.venue_id || booking.events?.listings?.id;
    if (!venueId) { setError('Could not determine the venue. Please contact support.'); return; }

    setSubmitting(true);
    setError(null);
    try {
      await submitEventReview({
        venueId,
        eventId:  booking.event_id,
        formData: form,
      });
      setStep('submitted');
    } catch (err) {
      setError(err.message || 'Submission failed. Please try again.');
      setSubmitting(false);
    }
  };

  // ── Derived values ──────────────────────────────────────────────────────────
  const event   = booking?.events;
  const listing = event?.listings;

  const coverUrl = listing?.hero_image_url || listing?.card_image_url || null;

  // ── Input style ─────────────────────────────────────────────────────────────
  const inp = {
    width: '100%', boxSizing: 'border-box',
    background: P.inputBg, border: `1px solid ${P.border}`,
    borderRadius: 2, padding: '10px 14px',
    fontFamily: NU, fontSize: 14, color: P.text,
    outline: 'none', transition: 'border-color 0.2s',
  };
  const ta = { ...inp, resize: 'vertical', minHeight: 120, lineHeight: 1.7 };
  const lbl = {
    display: 'block', fontFamily: NU, fontSize: 11,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: P.textMuted, marginBottom: 6,
  };

  // ── Render: loading ──────────────────────────────────────────────────────────
  if (step === 'loading') {
    return (
      <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: NU, fontSize: 13, color: P.textMuted, letterSpacing: '0.1em' }}>Loading…</div>
      </div>
    );
  }

  // ── Render: invalid token ────────────────────────────────────────────────────
  if (step === 'invalid') {
    return (
      <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{ fontFamily: GD, fontSize: 28, color: P.text, fontWeight: 400, marginBottom: 12 }}>
            Link expired or not found
          </div>
          <p style={{ fontFamily: NU, fontSize: 14, color: P.textSub, lineHeight: 1.8 }}>
            This review link may have already been used, or it doesn't exist. If you attended an event and would like to leave a review, please contact us.
          </p>
        </div>
      </div>
    );
  }

  // ── Render: submitted ────────────────────────────────────────────────────────
  if (step === 'submitted') {
    return (
      <div style={{ minHeight: '100vh', background: P.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div style={{
            width: 60, height: 60, borderRadius: '50%',
            background: 'rgba(74,222,128,0.10)', border: '1px solid rgba(74,222,128,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 24px', fontSize: 26, color: '#4ade80',
          }}>✓</div>
          <div style={{ fontFamily: GD, fontSize: 30, color: P.text, fontWeight: 400, marginBottom: 12 }}>
            Thank you
          </div>
          <p style={{ fontFamily: NU, fontSize: 14, color: P.textSub, lineHeight: 1.8, marginBottom: 0 }}>
            Your experience has been shared. Our team will review it shortly and it will appear on the venue profile once approved.
          </p>
          <p style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 32 }}>
            Luxury Wedding Directory
          </p>
        </div>
      </div>
    );
  }

  // ── Render: form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: P.bg, color: P.text }}>
      {/* Header strip */}
      <div style={{ borderBottom: `1px solid ${P.border}`, padding: '18px 32px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontFamily: NU, fontSize: 11, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD }}>
          Luxury Wedding Directory
        </span>
      </div>

      <div style={{ maxWidth: 600, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Event context card */}
        {(listing || event) && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 16,
            background: P.surface, border: `1px solid ${P.border}`,
            borderRadius: 3, padding: '16px 20px', marginBottom: 36,
          }}>
            {coverUrl && (
              <div style={{
                width: 64, height: 48, borderRadius: 2,
                backgroundImage: `url(${coverUrl})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                flexShrink: 0,
              }} />
            )}
            <div style={{ minWidth: 0 }}>
              {listing?.name && (
                <div style={{ fontFamily: GD, fontSize: 17, color: P.text, marginBottom: 2, fontWeight: 400 }}>
                  {listing.name}
                </div>
              )}
              {event?.title && (
                <div style={{ fontFamily: NU, fontSize: 12, color: P.textSub }}>
                  {event.title}
                  {event.start_date && (
                    <span style={{ color: P.textMuted }}>
                      {' · '}
                      {new Date(event.start_date + 'T00:00:00').toLocaleDateString('en-GB', {
                        day: 'numeric', month: 'long', year: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page heading */}
        <div style={{ marginBottom: 32 }}>
          <p style={{ fontFamily: NU, fontSize: 11, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, margin: '0 0 8px' }}>
            Share Your Experience
          </p>
          <h1 style={{ fontFamily: GD, fontSize: 32, fontWeight: 400, color: P.text, margin: '0 0 12px' }}>
            How was your visit?
          </h1>
          <p style={{ fontFamily: NU, fontSize: 14, color: P.textSub, lineHeight: 1.75, margin: 0 }}>
            Your review will appear on the venue profile and help couples planning their wedding discover what makes this venue special.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Overall rating */}
          <div>
            <label style={{ ...lbl, marginBottom: 12 }}>Overall Rating <span style={{ color: '#ef4444' }}>*</span></label>
            <StarRating value={form.overall_rating} onChange={v => set('overall_rating', v)} size={34} />
            {form.overall_rating > 0 && (
              <div style={{ fontFamily: NU, fontSize: 12, color: GOLD, marginTop: 8 }}>
                {['', 'Poor', 'Below average', 'Good', 'Very good', 'Exceptional'][form.overall_rating]}
              </div>
            )}
          </div>

          {/* Sub-ratings */}
          <div style={{ background: P.surface, border: `1px solid ${P.border}`, borderRadius: 3, padding: '4px 20px 0' }}>
            <SubRatingRow label="Venue & setting"  value={form.sub_ratings.venue}   onChange={v => setSub('venue', v)}   />
            <SubRatingRow label="Service & team"   value={form.sub_ratings.service} onChange={v => setSub('service', v)} />
            <SubRatingRow label="Value for money"  value={form.sub_ratings.value}   onChange={v => setSub('value', v)}   />
          </div>

          {/* Review title */}
          <div>
            <label style={lbl}>Review title</label>
            <input
              type="text"
              value={form.review_title}
              onChange={e => set('review_title', e.target.value)}
              placeholder="Summarise your experience in a sentence"
              maxLength={120}
              style={inp}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e  => e.target.style.borderColor = P.border}
            />
          </div>

          {/* Review text */}
          <div>
            <label style={lbl}>Your experience <span style={{ color: '#ef4444' }}>*</span></label>
            <textarea
              value={form.review_text}
              onChange={e => set('review_text', e.target.value)}
              placeholder="Tell couples what stood out — the setting, the team, the atmosphere. What would you want to know before visiting?"
              style={ta}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e  => e.target.style.borderColor = P.border}
            />
          </div>

          {/* Reviewer name + location */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={lbl}>Your name</label>
              <input
                type="text"
                value={form.reviewer_name}
                onChange={e => set('reviewer_name', e.target.value)}
                placeholder="Name displayed on review"
                style={inp}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e  => e.target.style.borderColor = P.border}
              />
            </div>
            <div>
              <label style={lbl}>Location (optional)</label>
              <input
                type="text"
                value={form.reviewer_location}
                onChange={e => set('reviewer_location', e.target.value)}
                placeholder="e.g. London, UK"
                style={inp}
                onFocus={e => e.target.style.borderColor = GOLD}
                onBlur={e  => e.target.style.borderColor = P.border}
              />
            </div>
          </div>

          {/* Email (pre-filled, read-only) */}
          <div>
            <label style={lbl}>Email address</label>
            <input
              type="email"
              value={form.reviewer_email}
              onChange={e => set('reviewer_email', e.target.value)}
              placeholder="Your email (not published)"
              style={{ ...inp, opacity: form.reviewer_email ? 0.72 : 1 }}
              onFocus={e => e.target.style.borderColor = GOLD}
              onBlur={e  => e.target.style.borderColor = P.border}
            />
            <p style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, margin: '6px 0 0', lineHeight: 1.6 }}>
              Your email is never published. Used only to verify authenticity.
            </p>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 2, padding: '12px 16px',
              fontFamily: NU, fontSize: 13, color: '#f87171',
            }}>
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '14px 28px',
              background: submitting ? 'rgba(201,168,76,0.4)' : GOLD,
              border: 'none', borderRadius: 2,
              fontFamily: NU, fontSize: 12, fontWeight: 700,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: '#0e0c0a', cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'opacity 0.15s',
            }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.opacity = '0.88'; }}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
            {submitting ? 'Submitting…' : 'Submit Review'}
          </button>

          {/* Footer note */}
          <p style={{ fontFamily: NU, fontSize: 11, color: P.textMuted, textAlign: 'center', lineHeight: 1.8, margin: 0 }}>
            All reviews are moderated before publication. By submitting you confirm your experience is genuine and your own.
          </p>
        </form>
      </div>
    </div>
  );
}
