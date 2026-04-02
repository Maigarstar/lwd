// ═══════════════════════════════════════════════════════════════════════════
// PartnerEnquiryForm — Internal sales lead capture
// For venues and vendors wanting to get listed or partner with LWD
// Supports dark/light mode via `dark` prop
// ═══════════════════════════════════════════════════════════════════════════

import { useState } from 'react';
import { createLead } from '../../services/leadEngineService';
import { createPartnerEnquiryProspect } from '../../services/enquiryToProspectService';

const GOLD     = '#c9a84c';
const GOLD_DIM = 'rgba(201,168,76,0.14)';

// ── Theme tokens ─────────────────────────────────────────────────────────────
function T(dark) {
  return dark ? {
    bg:          '#111',
    border:      'rgba(201,168,76,0.18)',
    heading:     '#ffffff',
    subtitle:    'rgba(255,255,255,0.4)',
    label:       'rgba(255,255,255,0.45)',
    input:       '#ffffff',
    inputBorder: 'rgba(255,255,255,0.15)',
    selectBg:    '#111',
    textaBg:     'rgba(255,255,255,0.04)',
    textaBorder: 'rgba(255,255,255,0.12)',
    pillBorder:  'rgba(255,255,255,0.18)',
    pillColor:   'rgba(255,255,255,0.65)',
    pillActiveTxt: '#000',
    privacy:     'rgba(255,255,255,0.28)',
    errorColor:  '#f87171',
    successHeading: '#ffffff',
    successText: 'rgba(255,255,255,0.55)',
  } : {
    bg:          '#f6f1e8',
    border:      'rgba(168,132,38,0.25)',
    heading:     '#171717',
    subtitle:    '#888',
    label:       '#555',
    input:       '#171717',
    inputBorder: 'rgba(23,23,23,0.25)',
    selectBg:    'transparent',
    textaBg:     'transparent',
    textaBorder: 'rgba(23,23,23,0.2)',
    pillBorder:  'rgba(23,23,23,0.2)',
    pillColor:   '#555',
    pillActiveTxt: '#fff',
    privacy:     '#aaa',
    errorColor:  '#c0392b',
    successHeading: '#171717',
    successText: '#666',
  };
}

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

export default function PartnerEnquiryForm({ onSuccess, dark = false }) {
  const t = T(dark);

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

  const focusGold  = (e) => { e.target.style.borderBottomColor = GOLD; };
  const blurBorder = (e) => { e.target.style.borderBottomColor = t.inputBorder; };

  const canSubmit = form.businessName.trim() && form.contactName.trim() &&
    form.email.trim() && form.interests.length > 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      // Run both in parallel: existing lead engine + new B2B prospect pipeline
      const [result] = await Promise.all([
        createLead({
          leadSource:  'Partner Enquiry Form',
          leadChannel: 'form',
          leadType:    'partner_enquiry',
          firstName:   form.contactName.split(' ')[0] || form.contactName,
          lastName:    form.contactName.split(' ').slice(1).join(' ') || '',
          email:       form.email,
          phone:       form.phone || undefined,
          message: [
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
        }),
        // Auto-create B2B prospect and assign to correct pipeline
        createPartnerEnquiryProspect(form).catch(e =>
          console.warn('[PartnerEnquiryForm] Prospect creation failed (non-fatal):', e.message)
        ),
      ]);
      if (result.success) { setSubmitted(true); onSuccess?.(result); }
      else { setError('Failed to send enquiry. Please try again.'); }
    } catch {
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

  const wrapStyle = {
    background: t.bg,
    border: `1px solid ${t.border}`,
    borderRadius: 2,
    padding: '36px',
    fontFamily: "'Inter', sans-serif",
    color: t.input,
    maxWidth: 520,
    width: '100%',
    boxSizing: 'border-box',
    transition: 'background 0.3s, border-color 0.3s',
  };

  const inputStyle = {
    width: '100%',
    background: 'transparent',
    border: 'none',
    borderBottom: `1px solid ${t.inputBorder}`,
    padding: '7px 0',
    fontFamily: "'Inter', sans-serif",
    fontSize: 14,
    color: t.input,
    outline: 'none',
    transition: 'border-color 180ms',
    boxSizing: 'border-box',
  };

  const labelStyle = {
    display: 'block',
    fontFamily: "'Inter', sans-serif",
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
    color: t.label,
    marginBottom: 6,
  };

  if (submitted) {
    return (
      <div style={wrapStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px', textAlign: 'center', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: GOLD_DIM, color: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, fontWeight: 700 }}>
            &#10003;
          </div>
          <h3 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 22, fontWeight: 600, color: t.successHeading, margin: 0 }}>
            Enquiry Received
          </h3>
          <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 13, color: t.successText, margin: 0, lineHeight: 1.6, maxWidth: 340 }}>
            Thank you for your interest in partnering with Luxury Wedding Directory. Our team will be in touch shortly.
          </p>
          <button onClick={handleReset} style={{ marginTop: 8, background: 'transparent', border: `1px solid ${GOLD}60`, color: GOLD, fontFamily: "'Inter', sans-serif", fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 20px', borderRadius: 2, cursor: 'pointer' }}>
            Send Another Enquiry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={wrapStyle}>
      <h2 style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: 24, fontWeight: 600, color: t.heading, margin: '0 0 4px', letterSpacing: '0.01em' }}>
        Partner Enquiry
      </h2>
      <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: t.subtitle, margin: '0 0 28px', letterSpacing: '0.02em' }}>
        Get listed or partner with Luxury Wedding Directory
      </p>

      <form onSubmit={handleSubmit} noValidate>

        {/* Business Name */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Business Name</label>
          <input name="businessName" value={form.businessName} onChange={e => set('businessName', e.target.value)}
            placeholder="e.g. Chateau Belmont" style={inputStyle} onFocus={focusGold} onBlur={blurBorder} />
        </div>

        {/* Contact Name + Business Type */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Contact Name</label>
            <input name="contactName" value={form.contactName} onChange={e => set('contactName', e.target.value)}
              placeholder="Full name" style={inputStyle} onFocus={focusGold} onBlur={blurBorder} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Business Type</label>
            <select name="businessType" value={form.businessType} onChange={e => set('businessType', e.target.value)}
              style={{
                ...inputStyle, cursor: 'pointer', appearance: 'none',
                background: t.selectBg,
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6'%3E%3Cpath d='M1 1l4 4 4-4' stroke='%23c9a84c' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat', backgroundPosition: 'right 2px center', paddingRight: 20,
              }}
              onFocus={focusGold} onBlur={blurBorder}
            >
              {BUSINESS_TYPES.map(bt => <option key={bt.value} value={bt.value}>{bt.label}</option>)}
            </select>
          </div>
        </div>

        {/* Email + Phone */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Email</label>
            <input name="email" type="email" value={form.email} onChange={e => set('email', e.target.value)}
              placeholder="hello@venue.com" style={inputStyle} onFocus={focusGold} onBlur={blurBorder} />
          </div>
          <div style={{ marginBottom: 24 }}>
            <label style={labelStyle}>Phone (optional)</label>
            <input name="phone" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)}
              placeholder="+44 7700 000000" style={inputStyle} onFocus={focusGold} onBlur={blurBorder} />
          </div>
        </div>

        {/* Website */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Website (optional)</label>
          <input name="website" type="url" value={form.website} onChange={e => set('website', e.target.value)}
            placeholder="https://www.yourvenue.com" style={inputStyle} onFocus={focusGold} onBlur={blurBorder} />
        </div>

        {/* Interests */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>I am interested in</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 2 }}>
            {INTEREST_OPTIONS.map(opt => {
              const active = form.interests.includes(opt);
              return (
                <button key={opt} type="button" onClick={() => toggleInterest(opt)} style={{
                  padding: '6px 14px', borderRadius: 20,
                  border: `1px solid ${active ? GOLD : t.pillBorder}`,
                  background: active ? GOLD : 'transparent',
                  color: active ? t.pillActiveTxt : t.pillColor,
                  fontFamily: "'Inter', sans-serif", fontSize: 12,
                  cursor: 'pointer', transition: 'all 150ms', userSelect: 'none',
                }}>{opt}</button>
              );
            })}
          </div>
        </div>

        {/* Message */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Message (optional)</label>
          <textarea name="message" value={form.message} onChange={e => set('message', e.target.value)}
            rows={3} placeholder="Tell us a bit about your business and what you're looking for..."
            style={{
              ...inputStyle, borderBottom: 'none',
              border: `1px solid ${t.textaBorder}`,
              background: t.textaBg,
              padding: '10px 12px', resize: 'vertical', lineHeight: 1.6, borderRadius: 2,
            }}
            onFocus={e => e.target.style.borderColor = GOLD}
            onBlur={e => e.target.style.borderColor = t.textaBorder}
          />
        </div>

        {error && (
          <div style={{ fontFamily: "'Inter', sans-serif", fontSize: 12, color: t.errorColor, marginBottom: 12, borderLeft: `2px solid ${t.errorColor}`, paddingLeft: 10 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={!canSubmit || submitting} style={{
          width: '100%', padding: '13px 0',
          background: (canSubmit && !submitting) ? GOLD : GOLD_DIM,
          color: (canSubmit && !submitting) ? (dark ? '#000' : '#fff') : (dark ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.5)'),
          border: 'none', borderRadius: 2,
          fontFamily: "'Inter', sans-serif", fontSize: 12, fontWeight: 600,
          letterSpacing: '0.1em', textTransform: 'uppercase',
          cursor: (canSubmit && !submitting) ? 'pointer' : 'not-allowed',
          transition: 'all 180ms', marginTop: 8,
        }}>
          {submitting ? 'Sending...' : 'Send Enquiry'}
        </button>

        <p style={{ fontFamily: "'Inter', sans-serif", fontSize: 11, color: t.privacy, textAlign: 'center', marginTop: 14, lineHeight: 1.5 }}>
          Your details are handled in accordance with our privacy policy and will only be used to respond to your enquiry.
        </p>

      </form>
    </div>
  );
}
