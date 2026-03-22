// ─── VenueEnquireCard ────────────────────────────────────────────────────────
// Full-width venue enquiry section, background image + centred form.
// data: {
//   background: string        // image URL
//   headline: string
//   subline: string
//   venueName: string
//   accentColor: string       // defaults to gold
// }
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

const GOLD = '#C9A84C';
const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';

function Field({ label, type = 'text', name, half, value, onChange, as }) {
  const { isMobile } = useBreakpoint();
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.18)',
    borderRadius: 4,
    padding: type === 'textarea' ? '14px 16px' : '13px 16px',
    fontFamily: NU, fontSize: 14, color: '#f5f2ec',
    outline: 'none',
    transition: 'border-color 0.2s',
    resize: 'none',
  };
  return (
    <div style={{ flex: half && !isMobile ? '0 0 calc(50% - 8px)' : '0 0 100%' }}>
      <label style={{ display: 'block', fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.55)', marginBottom: 6, textTransform: 'uppercase' }}>
        {label}
      </label>
      {as === 'textarea' ? (
        <textarea
          name={name} rows={4} value={value} onChange={onChange}
          style={base}
        />
      ) : (
        <>
          {type === 'date' && (
            <style>{`
              input[type="date"]::-webkit-calendar-picker-indicator {
                filter: sepia(1) saturate(1.5) hue-rotate(6deg) brightness(0.69);
                cursor: pointer;
                opacity: 0.85;
              }
              input[type="date"]::-webkit-calendar-picker-indicator:hover {
                opacity: 1;
              }
            `}</style>
          )}
          <input
            type={type} name={name} value={value} onChange={onChange}
            style={base}
          />
        </>
      )}
    </div>
  );
}

export default function VenueEnquireCard({ data = {} }) {
  const {
    background,
    headline    = 'Begin Planning Your Wedding',
    subline     = 'Our wedding team will respond within 24 hours.',
    venueName   = '',
    accentColor = GOLD,
  } = data;

  const { isMobile } = useBreakpoint();

  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    date: '', guests: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Template: wire to actual endpoint / Supabase
    setSubmitted(true);
  };

  return (
    <section
      id="enquire"
      style={{
        position: 'relative',
        width: '100%',
        background: '#0f1410',
        overflow: 'hidden',
      }}
    >
      {/* Background image */}
      {background && (
        <>
          <div
            style={{
              position: 'absolute', inset: 0,
              backgroundImage: `url(${background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              opacity: 0.22,
            }}
          />
          {/* Bottom fade */}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, #0f1410 100%)' }} />
        </>
      )}

      <div
        style={{
          position: 'relative', zIndex: 2,
          maxWidth: 800,
          margin: '0 auto',
          padding: isMobile ? '72px 24px 80px' : '96px 40px 104px',
        }}
      >
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 40 : 56 }}>
          <p style={{
            fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.16em',
            color: accentColor, textTransform: 'uppercase', marginBottom: 16,
          }}>
            {venueName ? `${venueName} · ` : ''}Enquire
          </p>
          <h2 style={{
            fontFamily: GD, fontSize: isMobile ? 32 : 44,
            fontWeight: 400, color: '#f5f2ec', margin: '0 0 16px',
            lineHeight: 1.15,
          }}>
            {headline}
          </h2>
          <p style={{
            fontFamily: NU, fontSize: 16, color: 'rgba(245,242,236,0.6)',
            margin: 0, lineHeight: 1.7,
          }}>
            {subline}
          </p>
        </div>

        {/* Form */}
        {!submitted ? (
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
              <Field label="First Name"    name="firstName" half value={form.firstName} onChange={handleChange} />
              <Field label="Last Name"     name="lastName"  half value={form.lastName}  onChange={handleChange} />
              <Field label="Email Address" name="email" type="email" half value={form.email} onChange={handleChange} />
              <Field label="Phone"         name="phone" type="tel"  half value={form.phone} onChange={handleChange} />
              <Field label="Wedding Date"  name="date"  type="date" half value={form.date}  onChange={handleChange} />
              <Field label="Guest Count"   name="guests" half value={form.guests} onChange={handleChange} />
              <Field label="Tell us about your vision" name="message" as="textarea" value={form.message} onChange={handleChange} />
            </div>

            {/* Privacy note */}
            <p style={{
              fontFamily: NU, fontSize: 12, color: 'rgba(245,242,236,0.35)',
              marginTop: 16, marginBottom: 0, lineHeight: 1.6,
            }}>
              Your enquiry is kept strictly private. We will never share your information.
            </p>

            {/* Submit */}
            <div style={{ marginTop: 32, display: 'flex', justifyContent: 'center' }}>
              <button
                type="submit"
                style={{
                  background: accentColor,
                  border: 'none',
                  color: '#0f1410',
                  fontFamily: NU, fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  padding: '16px 48px', borderRadius: 4,
                  cursor: 'pointer',
                  transition: 'opacity 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                onMouseLeave={e => e.currentTarget.style.opacity = '1'}
              >
                Send Enquiry
              </button>
            </div>
          </form>
        ) : (
          /* Thank you state */
          <div style={{ textAlign: 'center', padding: '48px 0' }}>
            <div style={{
              width: 56, height: 56, borderRadius: '50%',
              background: `${accentColor}20`,
              border: `1px solid ${accentColor}50`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 24px',
              fontSize: 24,
            }}>
              ✓
            </div>
            <h3 style={{ fontFamily: GD, fontSize: 28, color: '#f5f2ec', fontWeight: 400, margin: '0 0 12px' }}>
              Enquiry Received
            </h3>
            <p style={{ fontFamily: NU, fontSize: 15, color: 'rgba(245,242,236,0.6)', margin: 0 }}>
              Our wedding team will be in touch within 24 hours.
            </p>
          </div>
        )}
      </div>
    </section>
  );
}
