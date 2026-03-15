import { useState, useRef } from 'react';
import { createLead } from '../../services/leadEngineService';

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 5 }, (_, i) => CURRENT_YEAR + i);
const GUEST_OPTIONS = ['Under 60', '60-90', '90-120', '120+'];

// ─── Styles ──────────────────────────────────────────────────────────────────

const S = {
  container: {
    background: '#f6f1e8',
    border: '1px solid rgba(168, 132, 38, 0.25)',
    borderRadius: '2px',
    padding: '36px',
    fontFamily: 'Inter, sans-serif',
    color: '#171717',
    maxWidth: '100%',
    boxSizing: 'border-box',
  },
  heading: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '24px',
    fontWeight: '400',
    lineHeight: '1.2',
    marginBottom: '4px',
    color: '#171717',
    margin: '0 0 4px 0',
  },
  subtitle: {
    fontSize: '14px',
    color: '#7a7a7a',
    marginBottom: '28px',
    fontWeight: '400',
  },
  group: { marginBottom: '24px' },
  label: {
    display: 'block',
    fontFamily: 'Inter, sans-serif',
    fontSize: '12px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    marginBottom: '8px',
    color: '#171717',
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #171717',
    padding: '10px 0',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#171717',
    outline: 'none',
    transition: 'border-color 180ms ease',
    boxSizing: 'border-box',
  },
  textarea: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #171717',
    padding: '10px 0',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#171717',
    outline: 'none',
    transition: 'border-color 180ms ease',
    resize: 'none',
    minHeight: '60px',
    boxSizing: 'border-box',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  checkboxInput: { cursor: 'pointer', accentColor: '#8f7420' },
  checkboxLabel: { fontSize: '14px', fontWeight: '400', cursor: 'pointer' },
  pillGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
  },
  pill: {
    padding: '10px 12px',
    border: '1px solid #8f7420',
    background: 'transparent',
    color: '#171717',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 180ms ease',
    borderRadius: '2px',
  },
  pillActive: {
    backgroundColor: '#8f7420',
    color: '#ffffff',
    borderColor: '#8f7420',
  },
  submit: {
    width: '100%',
    padding: '14px 24px',
    background: '#8f7420',
    color: '#ffffff',
    border: 'none',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.08em',
    cursor: 'pointer',
    transition: 'opacity 180ms ease',
    marginTop: '28px',
    borderRadius: '2px',
  },
  submitDisabled: { opacity: 0.5, cursor: 'not-allowed' },
  privacy: {
    fontSize: '11px',
    color: '#7a7a7a',
    marginTop: '16px',
    fontWeight: '400',
    lineHeight: '1.5',
  },
  error: {
    color: '#d32f2f',
    fontSize: '13px',
    marginBottom: '16px',
    marginTop: '-8px',
  },
  successWrap: { textAlign: 'center', padding: '48px 24px' },
  successIcon: { fontSize: '48px', marginBottom: '16px', color: '#8f7420' },
  successHeading: {
    fontFamily: 'Cormorant Garamond, serif',
    fontSize: '28px',
    fontWeight: '400',
    marginBottom: '12px',
    color: '#171717',
  },
  successText: { fontSize: '14px', color: '#7a7a7a', marginBottom: '24px' },
  resetBtn: {
    background: 'transparent',
    border: '1px solid #8f7420',
    color: '#8f7420',
    padding: '10px 20px',
    fontFamily: 'Inter, sans-serif',
    fontSize: '13px',
    fontWeight: '500',
    cursor: 'pointer',
    borderRadius: '2px',
  },
  select: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid #171717',
    padding: '10px 0',
    fontFamily: 'Inter, sans-serif',
    fontSize: '14px',
    color: '#171717',
    outline: 'none',
    transition: 'border-color 180ms ease',
    boxSizing: 'border-box',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='%238f7420' d='M1 1l5 5 5-5'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 0 center',
    paddingRight: '20px',
  },
};

const focusGold = (e) => { e.target.style.borderBottomColor = '#8f7420'; };
const focusReset = (e) => { e.target.style.borderBottomColor = '#171717'; };

// ─── Component ───────────────────────────────────────────────────────────────

export default function VenueEnquiryForm({
  listingId = null,
  venueId = null,
  vendorId = null,
  vendorName = '',
  vendorEmail = null,
  venueName = '',
  responseTime = null,
  sticky = true,
}) {
  const [form, setForm] = useState({
    message: `Hi${vendorName ? ' ' + vendorName : ''}, I'm interested in hosting my wedding at ${venueName || 'your venue'}. Could you please send me pricing and availability information?`,
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    eventMonth: '',
    eventYear: '',
    exactDate: false,
    guestCount: null,
    budgetRange: '',
    locationPreference: '',
  });

  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const formRef = useRef(null);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    setError(null);
  };

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    set(name, type === 'checkbox' ? checked : value);
  };

  const validate = () => {
    if (!form.firstName.trim()) return 'First name is required';
    if (!form.email.trim()) return 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return 'Please enter a valid email';
    if (!form.phone.trim()) return 'Phone is required';
    if (!form.eventMonth || !form.eventYear) return 'Event date is required';
    if (!form.guestCount) return 'Guest count is required';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) { setError(err); return; }

    setLoading(true);
    try {
      // Build normalized lead payload
      const result = await createLead({
        leadSource: 'venue_page',
        leadChannel: 'form',
        leadType: 'venue_enquiry',

        listingId: listingId || venueId || vendorId || null,
        listingType: 'venue',
        venueId: venueId || listingId || null,
        vendorId: vendorId || null,

        firstName: form.firstName,
        lastName: form.lastName,
        fullName: [form.firstName, form.lastName].filter(Boolean).join(' '),
        email: form.email,
        phone: form.phone,

        weddingMonth: form.eventMonth,
        weddingYear: form.eventYear ? Number(form.eventYear) : undefined,
        exactDateKnown: form.exactDate,
        guestCount: form.guestCount,
        budgetRange: form.budgetRange || undefined,
        locationPreference: form.locationPreference || undefined,

        message: form.message,

        consentMarketing: false,
        consentDataProcessing: true,
      });

      if (!result.success) throw result.error || new Error('Failed to create lead');

      setSubmitted(true);
    } catch (err) {
      console.error('VenueEnquiryForm: submit failed:', err);
      setError('Failed to send enquiry. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({
      message: `Hi${vendorName ? ' ' + vendorName : ''}, I'm interested in hosting my wedding at ${venueName || 'your venue'}. Could you please send me pricing and availability information?`,
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      eventMonth: '',
      eventYear: '',
      exactDate: false,
      guestCount: null,
      budgetRange: '',
      locationPreference: '',
    });
    setError(null);
  };

  const containerStyle = {
    ...S.container,
    ...(sticky ? { position: 'sticky', top: '140px', alignSelf: 'start', zIndex: 10 } : {}),
  };

  // ── Success state ──────────────────────────────────────────────────────────

  if (submitted) {
    return (
      <div style={containerStyle}>
        <div style={S.successWrap}>
          <div style={S.successIcon}>&#10003;</div>
          <h3 style={S.successHeading}>Enquiry Sent</h3>
          <p style={S.successText}>
            Thank you! We've received your enquiry and {vendorName || 'the venue'} will be in touch soon.
          </p>
          <button style={S.resetBtn} onClick={handleReset}>Send Another Enquiry</button>
        </div>
      </div>
    );
  }

  // ── Form ───────────────────────────────────────────────────────────────────

  return (
    <div style={containerStyle}>
      <h2 style={S.heading}>Request Pricing</h2>
      {responseTime && <div style={S.subtitle}>Replies in {responseTime}</div>}

      <form ref={formRef} onSubmit={handleSubmit}>
        {/* Message */}
        <div style={S.group}>
          <label style={S.label}>Your Message</label>
          <textarea name="message" value={form.message} onChange={onChange} style={S.textarea} onFocus={focusGold} onBlur={focusReset} />
        </div>

        {/* First + Last Name */}
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>First Name</label>
            <input type="text" name="firstName" value={form.firstName} onChange={onChange} style={S.input} onFocus={focusGold} onBlur={focusReset} />
          </div>
          <div style={S.group}>
            <label style={S.label}>Last Name</label>
            <input type="text" name="lastName" value={form.lastName} onChange={onChange} style={S.input} onFocus={focusGold} onBlur={focusReset} />
          </div>
        </div>

        {/* Email + Phone */}
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>Email</label>
            <input type="email" name="email" value={form.email} onChange={onChange} style={S.input} onFocus={focusGold} onBlur={focusReset} />
          </div>
          <div style={S.group}>
            <label style={S.label}>Phone</label>
            <input type="tel" name="phone" value={form.phone} onChange={onChange} style={S.input} onFocus={focusGold} onBlur={focusReset} />
          </div>
        </div>

        {/* Event Date */}
        <div style={S.row}>
          <div style={S.group}>
            <label style={S.label}>Event Month</label>
            <select name="eventMonth" value={form.eventMonth} onChange={onChange} style={S.select} onFocus={focusGold} onBlur={focusReset}>
              <option value="">Select Month</option>
              {MONTHS.map((m, i) => <option key={i} value={m}>{m}</option>)}
            </select>
          </div>
          <div style={S.group}>
            <label style={S.label}>Event Year</label>
            <select name="eventYear" value={form.eventYear} onChange={onChange} style={S.select} onFocus={focusGold} onBlur={focusReset}>
              <option value="">Select Year</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>

        {/* Exact Date Checkbox */}
        <div style={S.group}>
          <label style={S.checkbox}>
            <input type="checkbox" name="exactDate" checked={form.exactDate} onChange={onChange} style={S.checkboxInput} />
            <span style={S.checkboxLabel}>I have a confirmed date</span>
          </label>
        </div>

        {/* Guest Count */}
        <div style={S.group}>
          <label style={S.label}>Expected Guest Count</label>
          <div style={S.pillGrid}>
            {GUEST_OPTIONS.map((label) => (
              <button
                key={label}
                type="button"
                style={{ ...S.pill, ...(form.guestCount === label ? S.pillActive : {}) }}
                onClick={() => set('guestCount', form.guestCount === label ? null : label)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Optional: Budget Range */}
        <div style={S.group}>
          <label style={S.label}>Budget Range (optional)</label>
          <input type="text" name="budgetRange" value={form.budgetRange} onChange={onChange} placeholder="e.g. 20,000 to 40,000" style={S.input} onFocus={focusGold} onBlur={focusReset} />
        </div>

        {/* Error */}
        {error && <div style={S.error}>{error}</div>}

        {/* Submit */}
        <button type="submit" disabled={loading} style={{ ...S.submit, ...(loading ? S.submitDisabled : {}) }}>
          {loading ? 'Sending...' : 'Send Enquiry'}
        </button>

        {/* Privacy */}
        <div style={S.privacy}>
          By submitting, you agree to our privacy policy and terms of service.
        </div>
      </form>
    </div>
  );
}
