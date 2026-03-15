// ═══════════════════════════════════════════════════════════════════════════
// PartnerEnquiryForm — Internal sales lead capture
// For venues and vendors wanting to get listed or partner with LWD
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { createLead } from '../../services/leadEngineService';

const S = {
  wrap: {
    background: '#f6f1e8',
    border: '1px solid rgba(168,132,38,0.25)',
    borderRadius: 2,
    padding: '36px',
    fontFamily: "'Inter', sans-serif",
    color: '#171717',
    maxWidth: 520,
    width: '100%',
    boxSizing: 'border-box',
  },
  heading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 24,
    fontWeight: 600,
    color: '#171717',
    margin: '0 0 4px',
    letterSpacing: '0.01em',
  },
  subtitle: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: '#888',
    margin: '0 0 28px',
    letterSpacing: '0.02em',
  },
  label: {
    display: 'block',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: '#555',
    marginBottom: 6,
  },
  input: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(23,23,23,0.25)',
    padding: '7px 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: '#171717',
    outline: 'none',
    transition: 'border-color 180ms',
    boxSizing: 'border-box',
  },
  row: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: 20,
  },
  field: {
    marginBottom: 24,
  },
  select: {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: '1px solid rgba(23,23,23,0.25)',
    padding: '7px 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: '#171717',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%238f7420' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 2px center',
    paddingRight: 20,
  },
  pillGroup: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  pill: (active) => ({
    padding: '6px 14px',
    borderRadius: 20,
    border: `1px solid ${active ? '#8f7420' : 'rgba(23,23,23,0.2)'}`,
    background: active ? '#8f7420' : 'transparent',
    color: active ? '#fff' : '#555',
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    cursor: 'pointer',
    transition: 'all 150ms',
    userSelect: 'none',
  }),
  submitBtn: (enabled) => ({
    width: '100%',
    padding: '13px 0',
    background: enabled ? '#8f7420' : 'rgba(143,116,32,0.35)',
    color: '#fff',
    border: 'none',
    borderRadius: 2,
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    cursor: enabled ? 'pointer' : 'not-allowed',
    transition: 'opacity 180ms',
    marginTop: 8,
  }),
  privacy: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    color: '#aaa',
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 1.5,
  },
  error: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 12,
    color: '#c0392b',
    marginTop: 10,
    borderLeft: '2px solid #c0392b',
    paddingLeft: 10,
  },
  successWrap: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '32px 20px',
    textAlign: 'center',
    gap: 12,
  },
  successIcon: {
    width: 48,
    height: 48,
    borderRadius: '50%',
    background: 'rgba(143,116,32,0.12)',
    color: '#8f7420',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 22,
    fontWeight: 700,
  },
  successHeading: {
    fontFamily: "'Cormorant Garamond', Georgia, serif",
    fontSize: 22,
    fontWeight: 600,
    color: '#171717',
    margin: 0,
  },
  successText: {
    fontFamily: "'Inter', sans-serif",
    fontSize: 13,
    color: '#666',
    margin: 0,
    lineHeight: 1.6,
    maxWidth: 340,
  },
  resetBtn: {
    marginTop: 8,
    background: 'transparent',
    border: '1px solid rgba(143,116,32,0.4)',
    color: '#8f7420',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 600,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    padding: '8px 20px',
    borderRadius: 2,
    cursor: 'pointer',
  },
};

const INTEREST_OPTIONS = [
  'Venue Listing',
  'Vendor Listing',
  'Featured Placement',
  'Advertising',
  'Editorial Feature',
  'Partnership',
];

const BUSINESS_TYPES = [
  { value: '', label: 'Select type' },
  { value: 'venue', label: 'Venue' },
  { value: 'photographer', label: 'Photographer' },
  { value: 'florist', label: 'Florist' },
  { value: 'caterer', label: 'Caterer' },
  { value: 'planner', label: 'Wedding Planner' },
  { value: 'musician', label: 'Musician / Entertainment' },
  { value: 'hair_makeup', label: 'Hair and Makeup' },
  { value: 'cake', label: 'Cake Designer' },
  { value: 'stationery', label: 'Stationery' },
  { value: 'jewellery', label: 'Jewellery' },
  { value: 'transport', label: 'Transport' },
  { value: 'other', label: 'Other' },
];

export default function PartnerEnquiryForm({ onSuccess }) {
  const [form, setForm] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    website: '',
    interests: [],
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const toggleInterest = (opt) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(opt)
        ? f.interests.filter(i => i !== opt)
        : [...f.interests, opt],
    }));
  };

  const focusGold = (e) => { e.target.style.borderBottomColor = '#8f7420'; };
  const blurGrey  = (e) => { e.target.style.borderBottomColor = 'rgba(23,23,23,0.25)'; };

  const canSubmit = form.businessName.trim() && form.contactName.trim() &&
    form.email.trim() && form.interests.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const result = await createLead({
        leadSource:  'Partner Enquiry Form',
        leadChannel: 'form',
        leadType:    'partner_enquiry',
        firstName:   form.contactName.split(' ')[0] || form.contactName,
        lastName:    form.contactName.split(' ').slice(1).join(' ') || '',
        email:       form.email,
        phone:       form.phone || undefined,
        message:     [
          `Business: ${form.businessName}`,
          form.businessType ? `Type: ${form.businessType}` : '',
          form.website ? `Website: ${form.website}` : '',
          `Interests: ${form.interests.join(', ')}`,
          form.message ? `\nMessage: ${form.message}` : '',
        ].filter(Boolean).join('\n'),
        requirementsJson: {
          businessName: form.businessName,
          businessType: form.businessType,
          website:      form.website,
          interests:    form.interests,
        },
        tagsJson: ['partner', ...form.interests.map(i => i.toLowerCase().replace(/\s+/g, '-'))],
        consentDataProcessing: true,
      });

      if (result.success) {
        setSubmitted(true);
        onSuccess?.(result);
      } else {
        setError('Failed to send enquiry. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setError(null);
    setForm({ businessName: '', contactName: '', email: '', phone: '', businessType: '', website: '', interests: [], message: '' });
  };

  if (submitted) {
    return (
      <div style={S.wrap}>
        <div style={S.successWrap}>
          <div style={S.successIcon}>&#10003;</div>
          <h3 style={S.successHeading}>Enquiry Received</h3>
          <p style={S.successText}>
            Thank you for your interest in partnering with Luxury Wedding Directory. Our team will be in touch shortly.
          </p>
          <button style={S.resetBtn} onClick={handleReset}>Send Another Enquiry</button>
        </div>
      </div>
    );
  }

  return (
    <div style={S.wrap}>
      <h2 style={S.heading}>Partner Enquiry</h2>
      <p style={S.subtitle}>Get listed or partner with Luxury Wedding Directory</p>

      <form onSubmit={handleSubmit} noValidate>

        {/* Business name */}
        <div style={S.field}>
          <label style={S.label}>Business Name</label>
          <input
            name="businessName"
            value={form.businessName}
            onChange={e => set('businessName', e.target.value)}
            placeholder="e.g. Chateau Belmont"
            style={S.input}
            onFocus={focusGold} onBlur={blurGrey}
          />
        </div>

        {/* Contact name + business type side by side */}
        <div style={S.row}>
          <div style={S.field}>
            <label style={S.label}>Contact Name</label>
            <input
              name="contactName"
              value={form.contactName}
              onChange={e => set('contactName', e.target.value)}
              placeholder="Full name"
              style={S.input}
              onFocus={focusGold} onBlur={blurGrey}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Business Type</label>
            <select
              name="businessType"
              value={form.businessType}
              onChange={e => set('businessType', e.target.value)}
              style={S.select}
              onFocus={focusGold} onBlur={blurGrey}
            >
              {BUSINESS_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Email + Phone side by side */}
        <div style={S.row}>
          <div style={S.field}>
            <label style={S.label}>Email</label>
            <input
              name="email"
              type="email"
              value={form.email}
              onChange={e => set('email', e.target.value)}
              placeholder="hello@venue.com"
              style={S.input}
              onFocus={focusGold} onBlur={blurGrey}
            />
          </div>
          <div style={S.field}>
            <label style={S.label}>Phone (optional)</label>
            <input
              name="phone"
              type="tel"
              value={form.phone}
              onChange={e => set('phone', e.target.value)}
              placeholder="+44 7700 000000"
              style={S.input}
              onFocus={focusGold} onBlur={blurGrey}
            />
          </div>
        </div>

        {/* Website */}
        <div style={S.field}>
          <label style={S.label}>Website (optional)</label>
          <input
            name="website"
            type="url"
            value={form.website}
            onChange={e => set('website', e.target.value)}
            placeholder="https://www.yourvenue.com"
            style={S.input}
            onFocus={focusGold} onBlur={blurGrey}
          />
        </div>

        {/* Interests */}
        <div style={{ marginBottom: 24 }}>
          <label style={S.label}>I am interested in</label>
          <div style={S.pillGroup}>
            {INTEREST_OPTIONS.map(opt => (
              <button
                key={opt}
                type="button"
                onClick={() => toggleInterest(opt)}
                style={S.pill(form.interests.includes(opt))}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {/* Message */}
        <div style={S.field}>
          <label style={S.label}>Message (optional)</label>
          <textarea
            name="message"
            value={form.message}
            onChange={e => set('message', e.target.value)}
            rows={3}
            placeholder="Tell us a bit about your business and what you're looking for..."
            style={{
              ...S.input,
              borderBottom: 'none',
              border: '1px solid rgba(23,23,23,0.2)',
              padding: '10px 12px',
              resize: 'vertical',
              lineHeight: 1.6,
              borderRadius: 2,
            }}
            onFocus={e => e.target.style.borderColor = '#8f7420'}
            onBlur={e => e.target.style.borderColor = 'rgba(23,23,23,0.2)'}
          />
        </div>

        {error && <div style={S.error}>{error}</div>}

        <button
          type="submit"
          disabled={!canSubmit || submitting}
          style={S.submitBtn(canSubmit && !submitting)}
        >
          {submitting ? 'Sending...' : 'Send Enquiry'}
        </button>

        <p style={S.privacy}>
          Your details are handled in accordance with our privacy policy and will only be used to respond to your enquiry.
        </p>
      </form>
    </div>
  );
}
