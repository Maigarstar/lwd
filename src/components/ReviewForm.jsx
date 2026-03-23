// ─── src/components/ReviewForm.jsx ────────────────────────────────────────────
// Reusable public review submission form.
// Used on /vendor/[slug]#write-a-review and anywhere a review form is needed.
//
// Props:
//   entityType  — 'vendor' | 'venue' | 'planner'
//   entityId    — listings.id (UUID)
//   entityName  — display name for the heading
//   onSuccess   — called with the submitted review row
//   onClose     — called when the user dismisses (no submission)
//
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { submitReview } from '../services/reviewService';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

const C = {
  bg:         '#faf9f7',
  surface:    '#ffffff',
  border:     '#e8e3dc',
  gold:       '#9d873e',
  goldLight:  'rgba(157,135,62,0.08)',
  goldBorder: 'rgba(157,135,62,0.25)',
  text:       '#1a1a18',
  textMid:    '#4a4844',
  textLight:  '#6b6560',
  textMuted:  '#9c9690',
  green:      '#2d6a4f',
  greenBg:    'rgba(45,106,79,0.07)',
  error:      '#c0392b',
  errorBg:    'rgba(192,57,43,0.07)',
};

// ── Sub-ratings config for vendor context ─────────────────────────────────────
const VENDOR_SUB_RATINGS = [
  { key: 'communication', label: 'Communication' },
  { key: 'professionalism', label: 'Professionalism' },
  { key: 'value', label: 'Value for money' },
  { key: 'creativity', label: 'Creativity & quality' },
];

// ── Interactive star row ───────────────────────────────────────────────────────
function StarPicker({ value, onChange, size = 28 }) {
  const [hovered, setHovered] = useState(0);
  const [clicked, setClicked] = useState(0);
  const active = hovered || value;

  function handleClick(s) {
    onChange(s);
    setClicked(s);
    setTimeout(() => setClicked(0), 300);
  }

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => handleClick(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 2, lineHeight: 1,
            fontSize: size,
            color: s <= active ? C.gold : C.border,
            transition: 'color 0.12s, transform 0.15s',
            transform: s === clicked ? 'scale(1.35)' : s <= active ? 'scale(1.1)' : 'scale(1)',
          }}
          aria-label={`${s} star${s > 1 ? 's' : ''}`}
        >★</button>
      ))}
    </div>
  );
}

// ── Small inline star picker for sub-ratings ──────────────────────────────────
function SubStars({ value, onChange }) {
  const [hovered, setHovered] = useState(0);
  const [clicked, setClicked] = useState(0);
  const active = hovered || value;

  function handleClick(s) {
    onChange(value === s ? 0 : s);
    setClicked(s);
    setTimeout(() => setClicked(0), 250);
  }

  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {[1, 2, 3, 4, 5].map(s => (
        <button
          key={s}
          type="button"
          onClick={() => handleClick(s)}
          onMouseEnter={() => setHovered(s)}
          onMouseLeave={() => setHovered(0)}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: 1, lineHeight: 1, fontSize: 16,
            color: s <= active ? C.gold : '#d8d3cc',
            transition: 'color 0.1s, transform 0.12s',
            transform: s === clicked ? 'scale(1.3)' : s <= active ? 'scale(1.05)' : 'scale(1)',
          }}
        >★</button>
      ))}
    </div>
  );
}

// ── Field wrapper ──────────────────────────────────────────────────────────────
function Field({ label, hint, required, error, children }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <label style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.textMid, letterSpacing: '0.3px' }}>
          {label}{required && <span style={{ color: C.gold, marginLeft: 3 }}>*</span>}
        </label>
        {hint && <span style={{ fontFamily: NU, fontSize: 10, color: C.textMuted }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontFamily: NU, fontSize: 11, color: C.error, marginTop: 5 }}>{error}</div>}
    </div>
  );
}

const inputStyle = (err) => ({
  width: '100%',
  padding: '10px 12px',
  fontFamily: NU,
  fontSize: 13,
  color: C.text,
  background: C.surface,
  border: `1px solid ${err ? C.error : C.border}`,
  borderRadius: 3,
  outline: 'none',
  boxSizing: 'border-box',
  transition: 'border-color 0.15s',
});

// ── Main component ─────────────────────────────────────────────────────────────
export default function ReviewForm({ entityType = 'vendor', entityId, entityName = 'this vendor', onSuccess, onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'success' | 'error'
  const [submitting, setSubmitting] = useState(false);
  const [serverError, setServerError] = useState(null);
  const [verified, setVerified] = useState(false);

  // Form state
  const [rating,     setRating]     = useState(0);
  const [subRatings, setSubRatings] = useState({});
  const [form, setForm] = useState({
    reviewer_name:     '',
    reviewer_email:    '',
    reviewer_location: '',
    reviewer_role:     'couple',
    review_date:       '',
    review_title:      '',
    review_text:       '',
  });
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  // ── Validation ──────────────────────────────────────────────────────────────
  function validate() {
    const e = {};
    if (!form.reviewer_name.trim())  e.reviewer_name  = 'Please enter your names';
    if (!form.reviewer_email.trim()) e.reviewer_email = 'Please enter your email address';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.reviewer_email)) e.reviewer_email = 'Please enter a valid email';
    if (rating < 1)                  e.rating         = 'Please choose an overall rating';
    if (!form.review_title.trim())   e.review_title   = 'Please add a headline';
    if (form.review_text.trim().length < 50) e.review_text = 'Please write at least 50 characters';
    return e;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    setSubmitting(true);
    setServerError(null);

    try {
      const result = await submitReview(entityType, entityId, {
        ...form,
        overall_rating: rating,
        sub_ratings: subRatings,
      });
      setVerified(result?.isVerifiedBooking || false);
      setStep('success');
      onSuccess?.(result);
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
      setStep('error');
    } finally {
      setSubmitting(false);
    }
  }

  // ── Success state ───────────────────────────────────────────────────────────
  if (step === 'success') {
    return (
      <div style={{ padding: '40px 32px 36px', textAlign: 'center' }}>
        <div style={{ fontSize: 36, marginBottom: 16, color: C.gold }}>✦</div>
        <div style={{ fontFamily: GD, fontSize: 24, color: C.text, marginBottom: 10 }}>
          Thank you for your review
        </div>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.textMid, lineHeight: 1.65, maxWidth: 380, margin: '0 auto 16px' }}>
          Your review has been submitted for editorial approval. Once verified by the LWD team it will appear on this profile.
        </p>

        {verified && (
          <div style={{ display: 'inline-block', margin: '0 auto 16px', padding: '9px 14px', background: C.greenBg, border: `1px solid rgba(45,106,79,0.2)`, borderRadius: 3, color: C.green, fontFamily: NU, fontSize: 12, fontWeight: 600 }}>
            ◈ Your booking has been verified — your review will carry a Verified Booking badge.
          </div>
        )}

        <div style={{ margin: '0 auto 24px', padding: '12px 16px', background: C.goldLight, border: `1px solid ${C.goldBorder}`, borderRadius: 3, maxWidth: 380 }}>
          <p style={{ fontFamily: NU, fontSize: 11, color: C.textMid, lineHeight: 1.55, margin: 0 }}>
            <strong style={{ color: C.gold }}>LWD Review Standards</strong> — All reviews are verified by our editorial team. Confirmed bookings receive a ◈ Verified Booking badge.
          </p>
        </div>

        <button
          onClick={onClose}
          style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '11px 28px', background: C.text, color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}
        >
          Done
        </button>
      </div>
    );
  }

  // ── Error state ─────────────────────────────────────────────────────────────
  if (step === 'error') {
    return (
      <div style={{ padding: '36px 32px', textAlign: 'center' }}>
        <div style={{ fontFamily: GD, fontSize: 20, color: C.error, marginBottom: 10 }}>
          Submission failed
        </div>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.textLight, lineHeight: 1.6, maxWidth: 360, margin: '0 auto 20px' }}>
          {serverError}
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={() => { setStep('form'); setServerError(null); }}
            style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '10px 20px', background: C.text, color: '#fff', border: 'none', borderRadius: 3, cursor: 'pointer' }}
          >
            Try again
          </button>
          <button
            onClick={onClose}
            style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', padding: '10px 20px', background: 'none', color: C.textLight, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer' }}
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ── Form ────────────────────────────────────────────────────────────────────
  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ padding: '28px 32px 32px', maxHeight: '80vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 20, borderBottom: `1px solid ${C.border}` }}>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.5px', color: C.gold, marginBottom: 6 }}>
            Write a Review
          </div>
          <div style={{ fontFamily: GD, fontSize: 22, color: C.text }}>
            Share your experience with {entityName}
          </div>
          <p style={{ fontFamily: NU, fontSize: 12, color: C.textMuted, margin: '5px 0 0', lineHeight: 1.5, fontStyle: 'italic' }}>
            Couples rely on reviews like yours to make confident decisions.
          </p>
          <p style={{ fontFamily: NU, fontSize: 11, color: C.textLight, margin: '8px 0 0', lineHeight: 1.5 }}>
            Reviews are verified by the LWD editorial team before publishing.
          </p>
        </div>

        {/* Overall rating — most prominent */}
        <div style={{ marginBottom: 24 }}>
          <Field label="Overall rating" required error={errors.rating}>
            <StarPicker value={rating} onChange={v => { setRating(v); setErrors(e => ({ ...e, rating: null })); }} />
          </Field>
        </div>

        {/* Your names */}
        <Field label="Your names" required error={errors.reviewer_name}>
          <input
            type="text"
            placeholder="e.g. Sophie & James"
            value={form.reviewer_name}
            onChange={e => { set('reviewer_name', e.target.value); setErrors(x => ({ ...x, reviewer_name: null })); }}
            style={inputStyle(errors.reviewer_name)}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = errors.reviewer_name ? C.error : C.border; }}
          />
        </Field>

        {/* Email — private */}
        <Field label="Email address" required hint="Private — not published" error={errors.reviewer_email}>
          <input
            type="email"
            placeholder="your@email.com"
            value={form.reviewer_email}
            onChange={e => { set('reviewer_email', e.target.value); setErrors(x => ({ ...x, reviewer_email: null })); }}
            style={inputStyle(errors.reviewer_email)}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = errors.reviewer_email ? C.error : C.border; }}
          />
        </Field>

        {/* Wedding / stay date — couple-friendly label */}
        <Field label="When was your wedding or stay?" hint="Optional">
          <input
            type="month"
            value={form.review_date ? form.review_date.slice(0, 7) : ''}
            max={new Date().toISOString().slice(0, 7)}
            onChange={e => set('review_date', e.target.value ? `${e.target.value}-01` : '')}
            style={inputStyle(false)}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
        </Field>

        {/* Headline */}
        <Field label="Headline" required error={errors.review_title}>
          <input
            type="text"
            placeholder="Summarise your experience in one line"
            value={form.review_title}
            onChange={e => { set('review_title', e.target.value); setErrors(x => ({ ...x, review_title: null })); }}
            style={inputStyle(errors.review_title)}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = errors.review_title ? C.error : C.border; }}
          />
        </Field>

        {/* Review body — character counter changes colour near limit */}
        <Field
          label="Your review"
          required
          hint={<span style={{ color: form.review_text.length >= 750 ? C.error : form.review_text.length >= 600 ? '#b07d2a' : C.textMuted, fontWeight: form.review_text.length >= 600 ? 600 : 400, transition: 'color 0.2s' }}>{form.review_text.length} / 800</span>}
          error={errors.review_text}
        >
          <textarea
            placeholder="Tell couples what made this vendor special — the details that would help someone else decide…"
            value={form.review_text}
            maxLength={800}
            rows={5}
            onChange={e => { set('review_text', e.target.value); setErrors(x => ({ ...x, review_text: null })); }}
            style={{ ...inputStyle(errors.review_text), resize: 'vertical', minHeight: 120 }}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = errors.review_text ? C.error : C.border; }}
          />
        </Field>

        {/* Sub-ratings — optional */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.textMid, letterSpacing: '0.3px', marginBottom: 10 }}>
            Category ratings <span style={{ fontWeight: 400, color: C.textMuted }}>(optional)</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 16px' }}>
            {VENDOR_SUB_RATINGS.map(({ key, label }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 3 }}>
                <span style={{ fontFamily: NU, fontSize: 11, color: C.textMid }}>{label}</span>
                <SubStars value={subRatings[key] || 0} onChange={v => setSubRatings(s => ({ ...s, [key]: v }))} />
              </div>
            ))}
          </div>
        </div>

        {/* Location — optional */}
        <Field label="Where are you based?" hint="Optional">
          <input
            type="text"
            placeholder="e.g. London, UK"
            value={form.reviewer_location}
            onChange={e => set('reviewer_location', e.target.value)}
            style={inputStyle(false)}
            onFocus={e => { e.target.style.borderColor = C.gold; }}
            onBlur={e => { e.target.style.borderColor = C.border; }}
          />
        </Field>

        {/* Privacy note */}
        <p style={{ fontFamily: NU, fontSize: 10, color: C.textMuted, lineHeight: 1.5, margin: '4px 0 20px' }}>
          Your email address is used only to prevent duplicate reviews and verify bookings. It is never published or shared.
        </p>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingTop: 4 }}>
          <button
            type="button"
            onClick={onClose}
            style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: C.textLight, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '10px 20px', cursor: 'pointer' }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              fontFamily: NU, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px',
              padding: '11px 28px', borderRadius: 3, border: 'none',
              background: submitting ? C.border : C.text,
              color: '#fff',
              cursor: submitting ? 'default' : 'pointer',
              transition: 'background 0.2s',
            }}
          >
            {submitting ? 'Submitting…' : 'Submit review'}
          </button>
        </div>
      </div>
    </form>
  );
}
