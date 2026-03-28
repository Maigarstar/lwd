// ─── src/components/enquiry/LuxeEnquiryModal.jsx ─────────────────────────────
// Universal dark luxe enquiry modal — hero image, gold accents, calendar picker.
// Used site-wide for venues, vendors, and planners.
// Extracted from CompareEnquiryForm in VenueProfile.jsx.

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { createLead } from '../../services/leadEngineService';

const FD = 'var(--font-heading-primary)';
const FB = 'var(--font-body)';

// ─── Calendar constants ──────────────────────────────────────────────────────
const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];

// ─── Mini Calendar ───────────────────────────────────────────────────────────
function MiniCalendar({ anchorRect, selected, onChange, onClose }) {
  const initMonth = () => {
    const base = selected || new Date();
    return new Date(base.getFullYear(), base.getMonth(), 1);
  };
  const [month, setMonth] = useState(initMonth);

  useEffect(() => {
    const handler = (e) => { if (!e.target.closest('[data-lwdcal]')) onClose(); };
    const t = setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => { clearTimeout(t); document.removeEventListener('mousedown', handler); };
  }, [onClose]);

  const prevMonth = (e) => { e.stopPropagation(); setMonth(m => new Date(m.getFullYear(), m.getMonth() - 1, 1)); };
  const nextMonth = (e) => { e.stopPropagation(); setMonth(m => new Date(m.getFullYear(), m.getMonth() + 1, 1)); };

  const today    = new Date();
  const firstDow = (month.getDay() + 6) % 7;
  const daysInMo = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells    = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];

  const isSel   = (d) => d && selected && selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && d === selected.getDate();
  const isToday = (d) => d && today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && d === today.getDate();

  const pick = (d) => { if (!d) return; onChange(new Date(month.getFullYear(), month.getMonth(), d)); onClose(); };

  const viewH = window.innerHeight;
  const calH  = 280;
  const top   = anchorRect.bottom + 6 + calH > viewH ? anchorRect.top - calH - 6 : anchorRect.bottom + 6;
  const left  = Math.min(anchorRect.left, window.innerWidth - 268);

  const navBtn = { background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 6px', transition: 'color 0.15s' };

  return (
    <div data-lwdcal="" onClick={e => e.stopPropagation()} style={{
      position: 'fixed', top, left, zIndex: 9999, width: 256,
      background: '#0d0d0b', border: '1px solid rgba(184,160,90,0.28)', borderRadius: 10,
      padding: '14px 14px 16px', boxShadow: '0 28px 70px rgba(0,0,0,0.85)', animation: 'lwd-modal-in 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button style={navBtn} onClick={prevMonth} onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>‹</button>
        <span style={{ fontFamily: FB, fontSize: 12, color: '#fff', fontWeight: 600, letterSpacing: '0.04em' }}>{CAL_MONTHS[month.getMonth()]} {month.getFullYear()}</span>
        <button style={navBtn} onClick={nextMonth} onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {CAL_DAYS.map(d => <div key={d} style={{ fontFamily: FB, fontSize: 9, color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '2px 0', letterSpacing: '0.06em' }}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, i) => (
          <button key={i} onClick={() => pick(d)} disabled={!d} style={{
            height: 30, borderRadius: 6, border: 'none',
            background: isSel(d) ? '#C9A84C' : isToday(d) ? 'rgba(201,168,76,0.14)' : 'transparent',
            outline: isToday(d) && !isSel(d) ? '1px solid rgba(201,168,76,0.32)' : 'none',
            color: isSel(d) ? '#0f0d0a' : d ? 'rgba(255,255,255,0.78)' : 'transparent',
            fontFamily: FB, fontSize: 12, fontWeight: isSel(d) ? 700 : 400,
            cursor: d ? 'pointer' : 'default', transition: 'background 0.12s, color 0.12s',
          }}
            onMouseEnter={e => { if (d && !isSel(d)) e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; }}
            onMouseLeave={e => { if (d && !isSel(d)) e.currentTarget.style.background = isToday(d) ? 'rgba(201,168,76,0.14)' : 'transparent'; }}
          >{d || ''}</button>
        ))}
      </div>
    </div>
  );
}

// ─── Message builder ─────────────────────────────────────────────────────────
const BASE_MSG_VENUE  = "We are currently exploring venues for our wedding and would love to learn more about your availability, pricing, and options.";
const BASE_MSG_VENDOR = "We are currently exploring services for our wedding and would love to learn more about your availability, pricing, and packages.";

function buildMessage(date, guests, isVenue = true) {
  const d = date?.trim();
  const g = guests?.trim();
  const base = isVenue ? 'venues' : 'services';
  const suffix = isVenue ? 'availability, pricing, and options' : 'availability, pricing, and packages';
  if (!d && !g) return isVenue ? BASE_MSG_VENUE : BASE_MSG_VENDOR;
  const datePart  = d ? ` on ${d}` : '';
  const guestPart = g ? ` for around ${g} guests` : '';
  return `We are currently exploring ${base} for our wedding${datePart}${guestPart} and would love to learn more about your ${suffix}.`;
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function LuxeEnquiryModal({
  venue,                       // listing object (venue, vendor, or planner)
  onClose,
  entityType = 'venue',        // 'venue' | 'vendor' | 'planner'
  openMiniBar = null,          // optional Aura chat opener
  sessionId = null,            // optional Aura session ID
}) {
  const isVenue = entityType === 'venue';
  const entityLabel = isVenue ? 'Venue' : entityType === 'planner' ? 'Planner' : 'Vendor';

  const [form, setForm]             = useState({ name1: '', name2: '', email: '', phone: '', date: '', guests: '', message: isVenue ? BASE_MSG_VENUE : BASE_MSG_VENDOR });
  const [sent, setSent]             = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [msgEdited, setMsgEdited]   = useState(false);
  const [calOpen, setCalOpen]       = useState(false);
  const [calAnchor, setCalAnchor]   = useState(null);
  const [selDate, setSelDate]       = useState(null);
  const dateFieldRef = useRef(null);
  const textareaRef  = useRef(null);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Escape key
  useEffect(() => {
    const esc = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', esc);
    return () => document.removeEventListener('keydown', esc);
  }, [onClose]);

  // Place cursor at end of prefilled message
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
  }, []);

  // Rebuild message when date/guests change
  const { date, guests } = form;
  useEffect(() => {
    if (msgEdited) return;
    setForm(f => ({ ...f, message: buildMessage(date, guests, isVenue) }));
  }, [date, guests, msgEdited, isVenue]);

  const openCal = () => {
    if (dateFieldRef.current) setCalAnchor(dateFieldRef.current.getBoundingClientRect());
    setCalOpen(true);
  };
  const pickDate = (d) => {
    setSelDate(d);
    const label = `${d.getDate()} ${CAL_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    setForm(f => ({ ...f, date: label }));
    setCalOpen(false);
  };
  const clearDate = (e) => {
    e.stopPropagation();
    setSelDate(null);
    setForm(f => ({ ...f, date: '' }));
  };

  // Resolve hero image — handle both string URLs and objects
  const firstImg = venue?.imgs?.[0];
  const heroSrc = (typeof firstImg === 'string' ? firstImg : firstImg?.src) || venue?.heroImage || venue?.cardImage || venue?.gallery?.[0]?.src || venue?.gallery?.[0] || venue?.image || null;
  const loc = [venue?.city, venue?.region, venue?.country].filter(Boolean).join(', ');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = !!(form.name1 && form.email) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const result = await createLead({
        leadSource:   isVenue ? 'venue_page' : 'vendor_page',
        leadChannel:  'form',
        leadType:     isVenue ? 'venue_enquiry' : 'vendor_enquiry',
        listingId:    String(venue.id),
        venueId:      isVenue ? String(venue.id) : undefined,
        vendorId:     !isVenue ? String(venue.id) : (venue.vendorId ? String(venue.vendorId) : undefined),
        firstName:    form.name1.trim() || undefined,
        lastName:     form.name2.trim() || undefined,
        fullName:     [form.name1.trim(), form.name2.trim()].filter(Boolean).join(' & ') || undefined,
        email:        form.email.trim(),
        phone:        form.phone.trim() || undefined,
        weddingDate:  form.date.trim() || undefined,
        guestCount:   form.guests.trim() || undefined,
        message:      form.message.trim(),
        auraSessionId: sessionId || undefined,
        intentSummary: `${entityLabel} enquiry for ${venue.name}`,
        requirementsJson: { source: 'luxe_enquiry_modal', listing_name: venue.name, entity_type: entityType },
        tagsJson:     [`${entityType}_enquiry`],
        consentDataProcessing: true,
      });
      if (!result.success) {
        console.error('[LuxeEnquiryModal] createLead failed:', result.error);
        throw new Error(`DB error: ${result.error?.message || result.error?.code || JSON.stringify(result.error)}`);
      }
      setSent(true);
    } catch (err) {
      console.error('[LuxeEnquiryModal] submit failed:', err?.message, err);
      setSubmitError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Design tokens ─────────────────────────────────────────────────────────
  const GOLD      = '#C9A84C';
  const GOLD_DIM  = 'rgba(201,168,76,0.55)';

  const inputBase = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--lwd-radius-input)',
    color: 'rgba(255,255,255,0.92)',
    fontFamily: FB, fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
  };
  const FOCUS_SHADOW = '0 0 0 3px rgba(201,168,76,0.16), inset 0 1px 0 rgba(255,255,255,0.03)';
  const focusStyle = (e) => {
    e.currentTarget.style.borderColor = 'rgba(201,168,76,0.52)';
    e.currentTarget.style.background  = 'rgba(255,255,255,0.06)';
    e.currentTarget.style.boxShadow   = FOCUS_SHADOW;
  };
  const blurStyle = (e) => {
    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
    e.currentTarget.style.background  = 'rgba(255,255,255,0.04)';
    e.currentTarget.style.boxShadow   = 'none';
  };

  const mkLabel = (text) => (
    <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginBottom: 7 }}>
      {text}
    </div>
  );
  const mkField = (k, label, type = 'text') => (
    <div>
      {mkLabel(label)}
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
    </div>
  );

  // ── Layout styles ──────────────────────────────────────────────────────────
  const overlayStyle = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'clamp(8px, 3vw, 24px)',
    backdropFilter: 'blur(6px)',
  };
  const panelStyle = {
    background: 'linear-gradient(170deg, #111009 0%, #0c0c0a 50%, #0f0d08 100%)',
    border: '1px solid rgba(201,168,76,0.32)',
    borderRadius: 'clamp(10px, 2vw, 16px)',
    width: '100%', maxWidth: 500,
    maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
    boxShadow: [
      'inset 0 1px 0 rgba(255,255,255,0.06)',
      '0 0 0 1px rgba(201,168,76,0.08)',
      '0 0 28px 4px rgba(201,168,76,0.10)',
      '0 0 80px 24px rgba(201,168,76,0.05)',
      '0 0 160px 60px rgba(201,168,76,0.025)',
      '0 60px 160px rgba(0,0,0,0.97)',
    ].join(', '),
    animation: 'lwd-modal-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  // ── Confirmation screen ───────────────────────────────────────────────────
  if (sent) return createPortal(
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={{ ...panelStyle, maxWidth: 460 }}>
        {heroSrc && (
          <div style={{ position: 'relative', height: 120, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <img src={heroSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,12,10,1) 0%, rgba(0,0,0,0.1) 100%)' }} />
          </div>
        )}
        <div style={{ padding: heroSrc ? '0 44px 52px' : '60px 44px 52px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%',
            background: `linear-gradient(135deg, ${GOLD} 0%, #a87d2a 100%)`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, color: '#0f0d0a', fontWeight: 700,
            margin: heroSrc ? '-32px auto 28px' : '0 auto 28px',
            position: 'relative', zIndex: 1,
            boxShadow: `0 0 0 6px rgba(12,12,10,1), 0 0 0 10px rgba(201,168,76,0.14), 0 0 40px rgba(201,168,76,0.4)`,
          }}>✦</div>
          <div style={{ fontFamily: FD, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 400, marginBottom: 14, opacity: 0.85 }}>
            One step closer
          </div>
          <div style={{ fontFamily: FD, fontSize: 28, color: '#fff', marginBottom: 16, lineHeight: 1.25, letterSpacing: '0.01em' }}>
            Your enquiry is on its way
          </div>
          <div style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.85, marginBottom: 36, maxWidth: 320, margin: '0 auto 36px' }}>
            You've taken a beautiful first step.<br />
            The team at <span style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{venue.name}</span> will reach out personally to discuss your wedding.
          </div>
          <button onClick={onClose} style={{
            padding: '15px 52px',
            background: `linear-gradient(135deg, #d4a93e 0%, ${GOLD} 45%, #b8882a 100%)`,
            border: 'none', borderRadius: 'var(--lwd-radius-input)',
            color: '#0a0800', fontFamily: FB, fontSize: 12, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
            boxShadow: `0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)`,
            transition: 'transform 0.18s, box-shadow 0.18s',
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 14px 36px rgba(201,168,76,0.52), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          >Done</button>
        </div>
      </div>
    </div>,
    document.body
  );

  // ── Form ──────────────────────────────────────────────────────────────────
  return createPortal(
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={panelStyle}>

        {/* ── Hero banner ── */}
        <div style={{ position: 'relative', height: 150, overflow: 'hidden', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
          {heroSrc
            ? <img src={heroSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a14 0%, #252518 100%)' }} />
          }
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 22, right: 52 }}>
            <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 5, opacity: 0.9 }}>
              {entityLabel} Enquiry
            </div>
            <div style={{ fontFamily: FD, fontSize: 21, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}>{venue.name}</div>
            {loc && <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>{loc}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >×</button>
        </div>

        {/* Gold accent bar */}
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD} 0%, rgba(184,160,90,0.6) 60%, rgba(184,160,90,0.05) 100%)` }} />

        {/* ── Form body ── */}
        <div style={{ padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 28px) 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, opacity: 0.8, marginBottom: 7 }}>
              Begin your enquiry
            </div>
            <div style={{ fontFamily: FD, fontSize: 20, color: '#fff', lineHeight: 1.2, letterSpacing: '0.01em', marginBottom: 8 }}>
              Tell us about your wedding
            </div>
            <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em', lineHeight: 1.5 }}>
              Your enquiry will be sent directly to {isVenue ? 'this venue' : venue.name || 'this vendor'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {mkField('name1', 'Your name *')}
            {mkField('name2', "Partner's name")}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {mkField('email', 'Email *', 'email')}
            {mkField('phone', 'Phone', 'tel')}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {/* Date picker */}
            <div>
              {mkLabel('Wedding date')}
              <div ref={dateFieldRef} onClick={openCal} style={{
                ...inputBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', userSelect: 'none',
                borderColor: calOpen ? 'rgba(201,168,76,0.52)' : 'rgba(255,255,255,0.1)',
                background: calOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)',
                boxShadow: calOpen ? FOCUS_SHADOW : 'none',
              }}>
                <span style={{ color: form.date ? '#fff' : 'rgba(255,255,255,0.32)', fontSize: 13 }}>
                  {form.date || 'Select a date'}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {form.date && (
                    <span onClick={clearDate} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15, lineHeight: 1, cursor: 'pointer', padding: '0 2px' }}
                      onMouseEnter={e => e.currentTarget.style.color = '#fff'}
                      onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}
                    >×</span>
                  )}
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: GOLD, opacity: 0.65, flexShrink: 0 }}>
                    <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
            </div>
            {mkField('guests', 'Estimated guests')}
          </div>

          {calOpen && calAnchor && (
            <MiniCalendar anchorRect={calAnchor} selected={selDate} onChange={pickDate} onClose={() => setCalOpen(false)} />
          )}

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontFamily: FB, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Your message</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>

          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
              {mkLabel('Message')}
              <span style={{ fontFamily: FB, fontSize: 9, color: 'rgba(255,255,255,0.24)', letterSpacing: '0.02em', fontStyle: 'italic' }}>
                Add any details to personalise
              </span>
            </div>
            <textarea
              ref={textareaRef}
              value={form.message}
              onChange={e => { setMsgEdited(true); set('message', e.target.value); }}
              onFocus={e => { focusStyle(e); if (!msgEdited) { const len = e.target.value.length; e.target.setSelectionRange(len, len); } }}
              onBlur={blurStyle}
              rows={4}
              style={{ ...inputBase, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }}
            />
          </div>
        </div>

        {/* ── Sticky CTA ── */}
        <div style={{
          position: 'sticky', bottom: 0,
          background: 'linear-gradient(to bottom, transparent 0%, #0c0c0a 28%)',
          padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', gap: 11,
        }}>
          <button disabled={!canSubmit} onClick={handleSubmit} style={{
            padding: '16px 24px', width: '100%',
            background: canSubmit ? `linear-gradient(135deg, #d4a93e 0%, ${GOLD} 45%, #b8882a 100%)` : 'rgba(201,168,76,0.12)',
            border: canSubmit ? 'none' : '1px solid rgba(201,168,76,0.18)',
            borderRadius: 'var(--lwd-radius-input)',
            color: canSubmit ? '#0a0800' : 'rgba(255,255,255,0.25)',
            fontFamily: FB, fontSize: 13, fontWeight: 800,
            letterSpacing: '0.1em', textTransform: 'uppercase',
            cursor: canSubmit ? 'pointer' : 'default',
            boxShadow: canSubmit ? '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none',
            transition: 'all 0.18s', position: 'relative',
          }}
            onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 14px 36px rgba(201,168,76,0.52), inset 0 1px 0 rgba(255,255,255,0.18)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = canSubmit ? '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none'; }}
          >
            {submitting ? 'Sending…' : 'Send Enquiry →'}
          </button>
          {submitError && (
            <div style={{ fontFamily: FB, fontSize: 11, color: '#e57373', textAlign: 'center', lineHeight: 1.5 }}>{submitError}</div>
          )}
          <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.65, letterSpacing: '0.01em' }}>
            Your details are shared only with {isVenue ? 'this venue' : venue.name || 'this vendor'} and handled in confidence.
          </div>

          {/* Aura link */}
          {openMiniBar && (
            <div style={{ textAlign: 'center', marginTop: 10 }}>
              <button type="button" onClick={openMiniBar} style={{
                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                fontFamily: FB, fontSize: 11, letterSpacing: '0.03em',
                color: 'rgba(201,168,76,0.55)', transition: 'color 0.18s',
              }}
                onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(201,168,76,0.55)'}
              >
                ✦ Have questions before sending? Chat with Aura
              </button>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
