// src/compare/GlobalCompare.jsx
// Global compare strip + modal — persists across all pages.
// Listens to lwd:compare-bar events and reads/writes lwd_compare_list in sessionStorage.
// Components extracted verbatim from VenueProfile.jsx.

import { useState, useEffect, useRef } from "react";
import { useChat }        from "../chat/ChatContext";
import { fetchListingById } from "../services/listings";
import { createLead }      from "../services/leadEngineService";
import { trackCompareRemove, trackCompareView, trackComparePair } from "../services/userEventService";

// ─── Storage ──────────────────────────────────────────────────────────────────
const COMPARE_KEY = 'lwd_compare_list';
export function loadCompareList() {
  try { return JSON.parse(sessionStorage.getItem(COMPARE_KEY)) || []; }
  catch { return []; }
}
export function saveCompareList(list) {
  try { sessionStorage.setItem(COMPARE_KEY, JSON.stringify(list)); }
  catch {}
}

// ─── Design tokens ────────────────────────────────────────────────────────────
const DARK = {
  bg:         "#0f0f0d",
  bgAlt:      "#141412",
  surface:    "#1a1a18",
  border:     "#2e2e2a",
  border2:    "#3c3c38",
  gold:       "#b8a05a",
  goldLight:  "rgba(184,160,90,0.1)",
  goldBorder: "rgba(184,160,90,0.25)",
  green:      "#8fa08c",
  greenLight: "rgba(143,160,140,0.1)",
  text:       "#f5f2ec",
  textMid:    "#c8c4bc",
  textLight:  "#9c9890",
  textMuted:  "#6b6860",
  navBg:      "rgba(15,15,13,0.94)",
  shadow:     "0 2px 16px rgba(0,0,0,0.4)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.5)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.6)",
};
const FB   = "var(--font-body)";
const FD   = "var(--font-heading-primary)";
const GOLD = '#C9A84C';

const COUNTRY_FLAG = {
  'Italy': '🇮🇹', 'Austria': '🇦🇹', 'France': '🇫🇷', 'Spain': '🇪🇸',
  'Portugal': '🇵🇹', 'Greece': '🇬🇷', 'United Kingdom': '🇬🇧', 'UK': '🇬🇧',
  'USA': '🇺🇸', 'United States': '🇺🇸', 'Mexico': '🇲🇽', 'Brazil': '🇧🇷',
  'Maldives': '🇲🇻', 'Thailand': '🇹🇭', 'Indonesia': '🇮🇩', 'Bali': '🇮🇩',
  'Sri Lanka': '🇱🇰', 'Japan': '🇯🇵', 'Morocco': '🇲🇦', 'Kenya': '🇰🇪',
  'South Africa': '🇿🇦', 'Australia': '🇦🇺', 'Cambodia': '🇰🇭',
  'Croatia': '🇭🇷', 'Montenegro': '🇲🇪', 'Switzerland': '🇨🇭', 'Germany': '🇩🇪',
};

const VENUE_TYPE_LABELS = {
  venue:       'Venue',
  villa:       'Villa',
  castle:      'Castle',
  hotel:       'Hotel',
  manor:       'Manor House',
  chateau:     'Château',
  barn:        'Barn',
  garden:      'Garden',
  beach:       'Beach',
  vineyard:    'Vineyard',
  estate:      'Estate',
  palazzo:     'Palazzo',
  resort:      'Resort',
  farmhouse:   'Farmhouse',
  penthouse:   'Penthouse',
  lodge:       'Lodge',
  yacht:       'Yacht',
  island:      'Private Island',
  rooftop:     'Rooftop',
  loft:        'Loft',
  gallery:     'Gallery',
  spa:         'Spa & Retreat',
};

const CAL_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const CAL_DAYS   = ['Mo','Tu','We','Th','Fr','Sa','Su'];
const BASE_MSG   = "We are currently exploring venues for our wedding and would love to learn more about your availability, pricing, and options.";

function buildMessage(date, guests) {
  const d = date?.trim();
  const g = guests?.trim();
  if (!d && !g) return BASE_MSG;
  const datePart  = d ? ` on ${d}` : '';
  const guestPart = g ? ` for around ${g} guests` : '';
  return `We are currently exploring venues for our wedding${datePart}${guestPart} and would love to learn more about your availability, pricing, and options.`;
}

// ─── CompareStat ──────────────────────────────────────────────────────────────
function CompareStat({ label, value, accent, C }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '14px 0', borderBottom: `1px solid rgba(255,255,255,0.07)`,
    }}>
      <span style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontWeight: 600 }}>
        {label}
      </span>
      <span style={{ fontFamily: FB, fontSize: 13, color: accent || 'rgba(255,255,255,0.82)', fontWeight: 500, textAlign: 'right', maxWidth: '60%' }}>
        {value || <span style={{ color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
      </span>
    </div>
  );
}

// ─── MiniCalendar ─────────────────────────────────────────────────────────────
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

  const today     = new Date();
  const firstDow  = (month.getDay() + 6) % 7;
  const daysInMo  = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells     = [...Array(firstDow).fill(null), ...Array.from({ length: daysInMo }, (_, i) => i + 1)];

  const isSel   = (d) => d && selected && selected.getFullYear() === month.getFullYear() && selected.getMonth() === month.getMonth() && d === selected.getDate();
  const isToday = (d) => d && today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth() && d === today.getDate();

  const pick = (d) => {
    if (!d) return;
    onChange(new Date(month.getFullYear(), month.getMonth(), d));
    onClose();
  };

  const viewH = window.innerHeight;
  const calH  = 280;
  const top   = anchorRect.bottom + 6 + calH > viewH ? anchorRect.top - calH - 6 : anchorRect.bottom + 6;
  const left  = Math.min(anchorRect.left, window.innerWidth - 268);

  const navBtn = {
    background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)',
    fontSize: 18, cursor: 'pointer', lineHeight: 1, padding: '2px 6px', transition: 'color 0.15s',
  };

  return (
    <div data-lwdcal="" onClick={e => e.stopPropagation()} style={{
      position: 'fixed', top, left, zIndex: 9999,
      width: 256, background: '#0d0d0b',
      border: '1px solid rgba(184,160,90,0.28)', borderRadius: 10,
      padding: '14px 14px 16px', boxShadow: '0 28px 70px rgba(0,0,0,0.85)',
      animation: 'lwd-modal-in 0.15s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <button style={navBtn} onClick={prevMonth}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >‹</button>
        <span style={{ fontFamily: FB, fontSize: 12, color: '#fff', fontWeight: 600, letterSpacing: '0.04em' }}>
          {CAL_MONTHS[month.getMonth()]} {month.getFullYear()}
        </span>
        <button style={navBtn} onClick={nextMonth}
          onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.5)'}
        >›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', marginBottom: 4 }}>
        {CAL_DAYS.map(d => (
          <div key={d} style={{ fontFamily: FB, fontSize: 9, color: 'rgba(255,255,255,0.28)', textAlign: 'center', padding: '2px 0', letterSpacing: '0.06em' }}>{d}</div>
        ))}
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

// ─── CompareEnquiryForm ───────────────────────────────────────────────────────
function CompareEnquiryForm({ venue, onClose }) {
  const { openMiniBar, sessionId } = useChat();
  const [form,       setForm]       = useState({ name1: '', name2: '', email: '', phone: '', date: '', guests: '', message: BASE_MSG });
  const [sent,       setSent]       = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError,setSubmitError]= useState(null);
  const [msgEdited,  setMsgEdited]  = useState(false);
  const [calOpen,    setCalOpen]    = useState(false);
  const [calAnchor,  setCalAnchor]  = useState(null);
  const [selDate,    setSelDate]    = useState(null);
  const dateFieldRef = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    const len = ta.value.length;
    ta.setSelectionRange(len, len);
  }, []);

  const { date, guests } = form;
  useEffect(() => {
    if (msgEdited) return;
    setForm(f => ({ ...f, message: buildMessage(date, guests) }));
  }, [date, guests, msgEdited]);

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

  const firstImg = venue?.imgs?.[0];
  const heroSrc  = (typeof firstImg === 'string' ? firstImg : firstImg?.src) || venue?.heroImage || venue?.cardImage || venue?.gallery?.[0]?.src || venue?.gallery?.[0] || null;
  const loc      = [venue?.city, venue?.country].filter(Boolean).join(', ');
  const set      = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const canSubmit = !!(form.name1 && form.email) && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true); setSubmitError(null);
    try {
      const result = await createLead({
        leadSource: 'Compare Enquiry', leadChannel: 'compare_modal', leadType: 'venue_enquiry',
        listingId: String(venue.id), venueId: String(venue.id),
        firstName: form.name1.trim() || undefined,
        lastName:  form.name2.trim() || undefined,
        fullName:  [form.name1.trim(), form.name2.trim()].filter(Boolean).join(' & ') || undefined,
        email:     form.email.trim(),
        phone:     form.phone.trim() || undefined,
        weddingDate: form.date.trim() || undefined,
        guestCount:  form.guests.trim() || undefined,
        message:     form.message.trim(),
        auraSessionId: sessionId || undefined,
        intentSummary: `Venue enquiry from Compare modal for ${venue.name}`,
        requirementsJson: { source: 'compare_modal', venue_name: venue.name },
        tagsJson: ['compare_enquiry'],
        consentDataProcessing: true,
      });
      if (!result.success) throw new Error(`DB error: ${result.error?.message || result.error?.code || JSON.stringify(result.error)}`);
      setSent(true);
    } catch (err) {
      setSubmitError('Something went wrong. Please try again or contact us directly.');
    } finally {
      setSubmitting(false);
    }
  };

  const inputBase = {
    width: '100%', padding: '12px 16px',
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 'var(--lwd-radius-input)', color: 'rgba(255,255,255,0.92)',
    fontFamily: FB, fontSize: 13, outline: 'none', boxSizing: 'border-box',
    transition: 'border-color 0.18s, background 0.18s, box-shadow 0.18s',
  };
  const FOCUS_SHADOW = `0 0 0 3px rgba(201,168,76,0.16), inset 0 1px 0 rgba(255,255,255,0.03)`;
  const focusStyle = (e) => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.52)'; e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.boxShadow = FOCUS_SHADOW; };
  const blurStyle  = (e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';  e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.boxShadow = 'none'; };

  const mkLabel = (text) => (
    <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', fontWeight: 700, marginBottom: 7 }}>{text}</div>
  );
  const mkField = (k, label, type = 'text') => (
    <div>
      {mkLabel(label)}
      <input type={type} value={form[k]} onChange={e => set(k, e.target.value)} onFocus={focusStyle} onBlur={blurStyle} style={inputBase} />
    </div>
  );

  const overlayStyle = { position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'clamp(8px, 3vw, 24px)', backdropFilter: 'blur(6px)' };
  const panelStyle = {
    background: 'linear-gradient(170deg, #111009 0%, #0c0c0a 50%, #0f0d08 100%)',
    border: '1px solid rgba(201,168,76,0.32)', borderRadius: 'clamp(10px, 2vw, 16px)',
    width: '100%', maxWidth: 500, maxHeight: 'calc(100dvh - 32px)', overflowY: 'auto',
    boxShadow: [`inset 0 1px 0 rgba(255,255,255,0.06)`, `0 0 0 1px rgba(201,168,76,0.08)`, `0 0 28px 4px rgba(201,168,76,0.10)`, `0 0 80px 24px rgba(201,168,76,0.05)`, `0 0 160px 60px rgba(201,168,76,0.025)`, `0 60px 160px rgba(0,0,0,0.97)`].join(', '),
    animation: 'lwd-modal-in 0.28s cubic-bezier(0.22, 1, 0.36, 1)',
  };

  if (sent) return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={{ ...panelStyle, maxWidth: 460 }}>
        {heroSrc && (
          <div style={{ position: 'relative', height: 120, overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <img src={heroSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.6)' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(12,12,10,1) 0%, rgba(0,0,0,0.1) 100%)' }} />
          </div>
        )}
        <div style={{ padding: heroSrc ? '0 44px 52px' : '60px 44px 52px', textAlign: 'center' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: `linear-gradient(135deg, ${GOLD} 0%, #a87d2a 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, color: '#0f0d0a', fontWeight: 700, margin: heroSrc ? '-32px auto 28px' : '0 auto 28px', position: 'relative', zIndex: 1, boxShadow: `0 0 0 6px rgba(12,12,10,1), 0 0 0 10px rgba(201,168,76,0.14), 0 0 40px rgba(201,168,76,0.4)` }}>✦</div>
          <div style={{ fontFamily: FD, fontSize: 11, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 400, marginBottom: 14, opacity: 0.85 }}>One step closer</div>
          <div style={{ fontFamily: FD, fontSize: 28, color: '#fff', marginBottom: 16, lineHeight: 1.25, letterSpacing: '0.01em' }}>Your enquiry is on its way</div>
          <div style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.48)', lineHeight: 1.85, marginBottom: 36, maxWidth: 320, margin: '0 auto 36px' }}>
            You've taken a beautiful first step.<br />The team at <span style={{ color: 'rgba(255,255,255,0.78)', fontWeight: 500 }}>{venue.name}</span> will reach out personally to discuss your wedding.
          </div>
          <button onClick={onClose} style={{ padding: '15px 52px', background: `linear-gradient(135deg, #d4a93e 0%, ${GOLD} 45%, #b8882a 100%)`, border: 'none', borderRadius: 'var(--lwd-radius-input)', color: '#0a0800', fontFamily: FB, fontSize: 12, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer', boxShadow: `0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)`, transition: 'transform 0.18s, box-shadow 0.18s' }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 14px 36px rgba(201,168,76,0.52), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)';  e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)'; }}
          >Back to comparison</button>
          <div style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 16, lineHeight: 1.7, letterSpacing: '0.01em' }}>You can continue exploring or send another enquiry</div>
        </div>
      </div>
    </div>
  );

  return (
    <div onClick={onClose} style={overlayStyle}>
      <div onClick={e => e.stopPropagation()} style={panelStyle}>
        <div style={{ position: 'relative', height: 150, overflow: 'hidden', borderRadius: '16px 16px 0 0', flexShrink: 0 }}>
          {heroSrc ? <img src={heroSrc} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a14 0%, #252518 100%)' }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.3) 55%, rgba(0,0,0,0.1) 100%)' }} />
          <div style={{ position: 'absolute', bottom: 16, left: 22, right: 52 }}>
            <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 5, opacity: 0.9 }}>Venue Enquiry</div>
            <div style={{ fontFamily: FD, fontSize: 21, color: '#fff', lineHeight: 1.2, marginBottom: 3 }}>{venue.name}</div>
            {loc && <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.5)', letterSpacing: '0.02em' }}>{loc}</div>}
          </div>
          <button onClick={onClose} aria-label="Close" style={{ position: 'absolute', top: 10, right: 10, width: 28, height: 28, borderRadius: '50%', background: 'rgba(0,0,0,0.45)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.5)', fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.7)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.45)'; e.currentTarget.style.color = 'rgba(255,255,255,0.5)'; }}
          >×</button>
        </div>
        <div style={{ height: 3, background: `linear-gradient(90deg, ${GOLD} 0%, rgba(184,160,90,0.6) 60%, rgba(184,160,90,0.05) 100%)` }} />
        <div style={{ padding: 'clamp(16px, 4vw, 28px) clamp(16px, 5vw, 28px) 8px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, opacity: 0.8, marginBottom: 7 }}>Begin your enquiry</div>
            <div style={{ fontFamily: FD, fontSize: 20, color: '#fff', lineHeight: 1.2, letterSpacing: '0.01em', marginBottom: 8 }}>Tell us about your wedding</div>
            <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.35)', letterSpacing: '0.01em', lineHeight: 1.5 }}>Your enquiry will be sent directly to this venue</div>
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
            <div>
              {mkLabel('Wedding date')}
              <div ref={dateFieldRef} onClick={openCal} style={{ ...inputBase, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none', borderColor: calOpen ? 'rgba(201,168,76,0.52)' : 'rgba(255,255,255,0.1)', background: calOpen ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.04)', boxShadow: calOpen ? FOCUS_SHADOW : 'none' }}>
                <span style={{ color: form.date ? '#fff' : 'rgba(255,255,255,0.32)', fontSize: 13 }}>{form.date || 'Select a date'}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {form.date && (<span onClick={clearDate} style={{ color: 'rgba(255,255,255,0.3)', fontSize: 15, lineHeight: 1, cursor: 'pointer', padding: '0 2px' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.3)'}>×</span>)}
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none" style={{ color: GOLD, opacity: 0.65, flexShrink: 0 }}>
                    <rect x="1" y="3" width="14" height="12" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M5 1v4M11 1v4M1 7h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </span>
              </div>
            </div>
            {mkField('guests', 'Estimated guests')}
          </div>
          {calOpen && calAnchor && (<MiniCalendar anchorRect={calAnchor} selected={selDate} onChange={pickDate} onClose={() => setCalOpen(false)} />)}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '4px 0' }}>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
            <span style={{ fontFamily: FB, fontSize: 8, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap' }}>Your message</span>
            <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.07)' }} />
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 7 }}>
              {mkLabel('Message')}
              <span style={{ fontFamily: FB, fontSize: 9, color: 'rgba(255,255,255,0.24)', letterSpacing: '0.02em', fontStyle: 'italic' }}>Add any details to personalise</span>
            </div>
            <textarea ref={textareaRef} value={form.message} onChange={e => { setMsgEdited(true); set('message', e.target.value); }} onFocus={e => { focusStyle(e); if (!msgEdited) { const len = e.target.value.length; e.target.setSelectionRange(len, len); } }} onBlur={blurStyle} rows={4} style={{ ...inputBase, resize: 'vertical', lineHeight: 1.7, fontSize: 13 }} />
          </div>
        </div>
        <div style={{ position: 'sticky', bottom: 0, background: 'linear-gradient(to bottom, transparent 0%, #0c0c0a 28%)', padding: '28px 28px 20px', display: 'flex', flexDirection: 'column', gap: 11 }}>
          <button disabled={!canSubmit} onClick={handleSubmit} style={{ padding: '16px 24px', width: '100%', background: canSubmit ? `linear-gradient(135deg, #d4a93e 0%, ${GOLD} 45%, #b8882a 100%)` : 'rgba(201,168,76,0.12)', border: canSubmit ? 'none' : `1px solid rgba(201,168,76,0.18)`, borderRadius: 'var(--lwd-radius-input)', color: canSubmit ? '#0a0800' : 'rgba(255,255,255,0.25)', fontFamily: FB, fontSize: 13, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', cursor: canSubmit ? 'pointer' : 'default', boxShadow: canSubmit ? `0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)` : 'none', transition: 'all 0.18s', position: 'relative' }}
            onMouseEnter={e => { if (canSubmit) { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 2px 0 rgba(0,0,0,0.2), 0 14px 36px rgba(201,168,76,0.52), inset 0 1px 0 rgba(255,255,255,0.18)'; } }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = canSubmit ? '0 2px 0 rgba(0,0,0,0.2), 0 6px 28px rgba(201,168,76,0.38), inset 0 1px 0 rgba(255,255,255,0.18)' : 'none'; }}
          >{submitting ? 'Sending…' : 'Send Enquiry →'}</button>
          {submitError && <div style={{ fontFamily: FB, fontSize: 11, color: '#e57373', textAlign: 'center', lineHeight: 1.5 }}>{submitError}</div>}
          <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.55)', textAlign: 'center', lineHeight: 1.65, letterSpacing: '0.01em' }}>Your details are shared only with this venue and handled in confidence.</div>
          <div style={{ textAlign: 'center', marginTop: 10 }}>
            <button type="button" onClick={openMiniBar} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', fontFamily: FB, fontSize: 11, letterSpacing: '0.03em', color: 'rgba(201,168,76,0.55)', transition: 'color 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.color = '#C9A84C'; }}
              onMouseLeave={e => { e.currentTarget.style.color = 'rgba(201,168,76,0.55)'; }}
            >✦ Have questions before sending? Chat with Aura</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CompareVenueColumn ───────────────────────────────────────────────────────
function CompareVenueColumn({ venue, isLast, highlight, C, onClose, onEnquire }) {
  const [hovered,    setHovered]    = useState(false);
  const [activeIdx,  setActiveIdx]  = useState(0);
  const [arrowHover, setArrowHover] = useState(null);

  const galleryImgs = (() => {
    if (Array.isArray(venue?.imgs) && venue.imgs.length > 0) {
      return venue.imgs.map(i => ({ src: i.src || i.url, alt: i.alt_text || venue.name })).filter(i => i.src).slice(0, 20);
    }
    if (Array.isArray(venue?.heroImages) && venue.heroImages.length > 0) {
      return venue.heroImages.filter(h => h?.url).map(h => ({ src: h.url, alt: venue.name }));
    }
    const single = venue?.heroImage || venue?.cardImage || null;
    return single ? [{ src: single, alt: venue?.name || '' }] : [];
  })();

  const totalImgs  = galleryImgs.length;
  const goPrev = (e) => { e.stopPropagation(); setActiveIdx(i => (i - 1 + totalImgs) % totalImgs); };
  const goNext = (e) => { e.stopPropagation(); setActiveIdx(i => (i + 1) % totalImgs); };

  const locationParts = [venue?.city, venue?.region, venue?.country].filter(Boolean);
  const location  = locationParts.join(', ');
  const flag      = COUNTRY_FLAG[venue?.country] || '';
  const price     = venue?.priceFrom ? `${venue.priceCurrency || '€'}${Number(venue.priceFrom).toLocaleString()}` : null;
  const capacity  = venue?.capacity ? `Up to ${Number(venue.capacity).toLocaleString()} guests` : null;
  const type      = VENUE_TYPE_LABELS[venue?.listingType?.toLowerCase?.()] || (venue?.listingType ? venue.listingType.charAt(0).toUpperCase() + venue.listingType.slice(1) : null);
  const rating    = venue?.rating ? Number(venue.rating).toFixed(1) : null;
  const reviews   = venue?.reviewCount ?? venue?.reviews ?? null;
  const exclusiveUse = venue?.exclusiveUseEnabled ?? venue?.exclusiveUse?.enabled ?? null;
  const slug      = venue?.slug || null;
  const profileUrl = slug ? `/venues/${slug}` : null;

  if (!venue || (!venue.name && !galleryImgs[0])) {
    return (
      <div style={{ borderRight: isLast ? 'none' : `1px solid rgba(184,160,90,0.12)`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 500 }}>
        <div style={{ fontFamily: FB, fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>Unable to load</div>
      </div>
    );
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} style={{ borderRight: isLast ? 'none' : `1px solid rgba(184,160,90,0.12)`, display: 'flex', flexDirection: 'column', position: 'relative', background: hovered ? '#111110' : '#0f0f0d', transform: hovered ? 'translateY(-2px)' : 'translateY(0)', transition: 'transform 0.22s cubic-bezier(0.25,0.46,0.45,0.94), background 0.2s ease', boxShadow: hovered ? '0 12px 40px rgba(0,0,0,0.5)' : 'none', zIndex: hovered ? 2 : 1 }}>
      {highlight && (
        <div style={{ position: 'absolute', top: 16, left: 16, zIndex: 4, background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(10px)', border: `1px solid ${C.gold}`, padding: '3px 10px', borderRadius: 2, fontFamily: FB, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.gold }}>{highlight}</div>
      )}
      <div style={{ position: 'relative', height: 340, flexShrink: 0, overflow: 'hidden', background: '#1a1a18' }}>
        {galleryImgs.map((img, i) => (
          <img key={i} src={img.src} alt={img.alt} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: i === activeIdx ? 1 : 0, transition: 'opacity 0.38s ease', pointerEvents: 'none' }} />
        ))}
        {galleryImgs.length === 0 && (
          <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #1a1a18 0%, #2a2a24 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontFamily: FD, fontSize: 32, color: 'rgba(184,160,90,0.2)' }}>✦</span>
          </div>
        )}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.86) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)', zIndex: 1 }} />
        {totalImgs > 1 && (
          <>
            <button onClick={goPrev} onMouseEnter={() => setArrowHover('prev')} onMouseLeave={() => setArrowHover(null)} aria-label="Previous photo" style={{ position: 'absolute', left: 10, top: '50%', transform: `translateY(-50%) ${arrowHover === 'prev' ? 'scale(1.1)' : 'scale(1)'}`, zIndex: 3, width: 32, height: 32, borderRadius: '50%', background: arrowHover === 'prev' ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.48)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 14, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease, background 0.15s, transform 0.15s', backdropFilter: 'blur(8px)' }}>‹</button>
            <button onClick={goNext} onMouseEnter={() => setArrowHover('next')} onMouseLeave={() => setArrowHover(null)} aria-label="Next photo" style={{ position: 'absolute', right: 10, top: '50%', transform: `translateY(-50%) ${arrowHover === 'next' ? 'scale(1.1)' : 'scale(1)'}`, zIndex: 3, width: 32, height: 32, borderRadius: '50%', background: arrowHover === 'next' ? 'rgba(0,0,0,0.72)' : 'rgba(0,0,0,0.48)', border: '1px solid rgba(255,255,255,0.18)', color: '#fff', fontSize: 14, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: hovered ? 1 : 0, transition: 'opacity 0.2s ease, background 0.15s, transform 0.15s', backdropFilter: 'blur(8px)' }}>›</button>
          </>
        )}
        {totalImgs > 1 && (
          <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 3, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.12)', padding: '3px 9px', borderRadius: 20, fontFamily: FB, fontSize: 10, fontWeight: 600, color: 'rgba(255,255,255,0.75)', letterSpacing: '0.04em' }}>{activeIdx + 1} / {totalImgs}</div>
        )}
        {totalImgs > 1 && totalImgs <= 12 && (
          <div style={{ position: 'absolute', bottom: 92, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 5, zIndex: 3 }}>
            {galleryImgs.map((_, i) => (
              <button key={i} onClick={(e) => { e.stopPropagation(); setActiveIdx(i); }} aria-label={`Photo ${i + 1}`} style={{ width: i === activeIdx ? 18 : 5, height: 5, borderRadius: 3, background: i === activeIdx ? C.gold : 'rgba(255,255,255,0.35)', border: 'none', cursor: 'pointer', padding: 0, transition: 'width 0.3s ease, background 0.2s ease' }} />
            ))}
          </div>
        )}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '24px 24px 20px', zIndex: 2 }}>
          {rating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 7 }}>
              <span style={{ color: C.gold, fontSize: 10 }}>★</span>
              <span style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.9)', fontWeight: 700 }}>{rating}</span>
              {reviews > 0 && <span style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.45)' }}>· {reviews} review{reviews !== 1 ? 's' : ''}</span>}
            </div>
          )}
          <div style={{ fontFamily: FD, fontSize: 22, color: '#fff', fontWeight: 400, lineHeight: 1.2, marginBottom: 5 }}>{venue.name}</div>
          {location && <div style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.52)', letterSpacing: '0.02em' }}>{flag && <span style={{ marginRight: 5 }}>{flag}</span>}{location}</div>}
        </div>
      </div>
      <div style={{ padding: '20px 24px 16px', flex: 1, background: 'transparent' }}>
        <div style={{ padding: '16px 0 14px', borderBottom: `1px solid rgba(255,255,255,0.07)`, marginBottom: 2 }}>
          <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.38)', fontWeight: 600, marginBottom: 6 }}>Starting From</div>
          <div style={{ fontFamily: FD, fontSize: 28, color: C.gold, fontWeight: 400, letterSpacing: '0.01em', lineHeight: 1 }}>{price || <span style={{ fontFamily: FB, fontSize: 13, color: 'rgba(255,255,255,0.22)', fontStyle: 'italic', fontWeight: 400 }}>Price on request</span>}</div>
        </div>
        <CompareStat label="Capacity" value={capacity} C={C} />
        <CompareStat label="Venue Type" value={type} C={C} />
        <CompareStat label="Exclusive Use" value={exclusiveUse === true ? <span style={{ color: '#6fcf67', fontWeight: 700 }}>✓ Available</span> : exclusiveUse === false ? <span style={{ color: 'rgba(255,255,255,0.28)' }}><span style={{ marginRight: 5, fontSize: 11 }}>×</span>Not offered</span> : null} C={C} />
      </div>
      <div style={{ padding: '20px 24px 30px', display: 'flex', flexDirection: 'column', gap: 10, background: 'transparent' }}>
        <button onClick={() => onEnquire && onEnquire(venue)} style={{ display: 'block', width: '100%', textAlign: 'center', padding: '13px 16px', background: C.gold, border: 'none', borderRadius: 'var(--lwd-radius-input)', color: '#0f0d0a', fontFamily: FB, fontSize: 12, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', transition: 'background 0.15s, transform 0.15s, box-shadow 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#b8922a'; e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(201,168,76,0.35)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
        >Send Enquiry →</button>
        {profileUrl && (
          <a href={profileUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block', textAlign: 'center', padding: '11px 16px', background: 'transparent', border: `1px solid rgba(255,255,255,0.14)`, borderRadius: 'var(--lwd-radius-input)', color: 'rgba(255,255,255,0.45)', fontFamily: FB, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', textDecoration: 'none', cursor: 'pointer', transition: 'border-color 0.15s, color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.32)'; e.currentTarget.style.color = 'rgba(255,255,255,0.72)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)'; e.currentTarget.style.color = 'rgba(255,255,255,0.45)'; }}
          >View Full Profile</a>
        )}
      </div>
    </div>
  );
}

// ─── CompareBar ───────────────────────────────────────────────────────────────
function CompareBar({ items, onRemove, onClear, onCompare }) {
  if (!items.length) return null;
  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 850,
      background: "rgba(18,18,16,0.65)", backdropFilter: "blur(16px)", borderTop: `1px solid rgba(201,168,76,0.5)`,
      padding: "12px 32px", display: "flex", alignItems: "center", gap: 12,
      animation: "slideUp 0.3s ease",
    }}>
      <span style={{ fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.6)", letterSpacing: "0.5px", textTransform: "uppercase", flexShrink: 0 }}>Compare:</span>
      {items.map(v => (
        <div key={v.id} style={{ display: "flex", alignItems: "center", gap: 6, padding: "5px 12px", background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.2)" }}>
          <span style={{ fontFamily: FB, fontSize: 12, color: "#fff" }}>{v.name}</span>
          <button onClick={() => onRemove(v.id)} style={{ background: "none", border: "none", color: "rgba(255,255,255,0.5)", cursor: "pointer", fontSize: 14, lineHeight: 1 }}>×</button>
        </div>
      ))}
      {items.length < 3 && (
        <div style={{ padding: "5px 12px", border: "1px dashed rgba(255,255,255,0.25)", fontFamily: FB, fontSize: 12, color: "rgba(255,255,255,0.4)" }}>+ Add venue</div>
      )}
      <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
        <button onClick={onClear} style={{ padding: "6px 14px", background: "none", border: "1px solid rgba(255,255,255,0.25)", borderRadius: "var(--lwd-radius-input)", color: "rgba(255,255,255,0.6)", fontFamily: FB, fontSize: 12, cursor: "pointer" }}>Clear</button>
        <button onClick={onCompare} style={{ padding: "6px 20px", background: GOLD, border: "none", borderRadius: "var(--lwd-radius-input)", color: "#fff", fontFamily: FB, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>Compare Now →</button>
      </div>
    </div>
  );
}

// ─── CompareModal ─────────────────────────────────────────────────────────────
function CompareModal({ items, onClose }) {
  const C = DARK;
  const { openWorkspace, sendMessage, setChatContext, messages } = useChat();
  const [venues,       setVenues]       = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [enquiryVenue, setEnquiryVenue] = useState(null);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  useEffect(() => {
    const handler = e => {
      if (e.key === 'Escape') {
        if (enquiryVenue) setEnquiryVenue(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, enquiryVenue]);

  useEffect(() => {
    const handler = e => {
      const venue = venues.find(v => String(v.id) === String(e.detail?.venueId));
      if (venue) setEnquiryVenue(venue);
    };
    window.addEventListener('lwd:aura-enquire', handler);
    return () => window.removeEventListener('lwd:aura-enquire', handler);
  }, [venues]);

  useEffect(() => {
    if (!items.length) return;
    let cancelled = false;
    setLoading(true);
    Promise.all(items.map(item => fetchListingById(String(item.id)).catch(() => ({ id: item.id, name: item.name }))))
      .then(results => { if (!cancelled) { setVenues(results); setLoading(false); } });
    return () => { cancelled = true; };
  }, [items]);

  const highlights = {};
  if (venues.length >= 2) {
    const ratings = venues.map((v, i) => ({ i, val: v?.rating ? Number(v.rating) : -1 }));
    const prices  = venues.map((v, i) => ({ i, val: v?.priceFrom ? Number(v.priceFrom) : Infinity }));
    const topRated  = ratings.reduce((a, b) => b.val > a.val ? b : a);
    const bestValue = prices.reduce((a, b)  => b.val < a.val ? b : a);
    if (topRated.val  > 0)          highlights[topRated.i]  = 'Highest Rated';
    if (bestValue.val < Infinity && bestValue.i !== topRated.i) highlights[bestValue.i] = 'Most Affordable';
  }

  const count = items.length;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 960, background: 'rgba(0,0,0,0.97)', display: 'flex', flexDirection: 'column', animation: 'fadeIn 0.2s ease' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '28px 44px', borderBottom: `1px solid rgba(184,160,90,0.15)`, background: 'rgba(10,10,8,0.97)', backdropFilter: 'blur(20px)' }}>
        <div>
          <div style={{ fontFamily: FB, fontSize: 9, letterSpacing: '0.24em', textTransform: 'uppercase', color: C.gold, fontWeight: 700, marginBottom: 8 }}>Venue Comparison</div>
          <div style={{ fontFamily: FD, fontSize: 26, color: '#fff', fontWeight: 400, letterSpacing: '0.01em' }}>{count === 1 ? 'Venue in Review' : `Comparing ${count} Venues`}</div>
        </div>
        <button onClick={onClose} aria-label="Close comparison" style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.14)', color: 'rgba(255,255,255,0.7)', fontSize: 20, lineHeight: 1, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s', flexShrink: 0 }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; }}
        >×</button>
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: 'clamp(16px, 4vw, 44px)' }}>
        {loading ? (
          <div style={{ height: '100%', minHeight: 400, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
            <div style={{ fontFamily: FD, fontSize: 20, color: 'rgba(255,255,255,0.2)', letterSpacing: '0.04em' }}>Curating your comparison…</div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              {items.map((_, i) => (<div key={i} style={{ width: 5, height: 5, borderRadius: '50%', background: 'rgba(184,160,90,0.5)', animation: `dotPulse 1.4s ease-in-out ${i * 0.18}s infinite` }} />))}
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${count}, minmax(260px, 1fr))`, border: `1px solid rgba(184,160,90,0.18)`, borderRadius: 14, overflow: 'hidden', boxShadow: '0 40px 100px rgba(0,0,0,0.75)' }}>
            {venues.map((venue, i) => (
              <CompareVenueColumn key={venue?.id || i} venue={venue} isLast={i === venues.length - 1} highlight={highlights[i] || null} C={C} onClose={onClose} onEnquire={(v) => setEnquiryVenue(v)} />
            ))}
          </div>
        )}
        {!loading && (
          <div style={{ textAlign: 'center', marginTop: 28 }}>
            <span style={{ fontFamily: FB, fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>Add up to 3 venues to compare · Click outside or press Esc to close</span>
          </div>
        )}
      </div>
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(255,255,255,0.05)', padding: '13px 44px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(8,8,6,0.6)' }}>
        <button type="button" onClick={() => {
          setChatContext({ page: 'compare', country: venues[0]?.country || null, region: venues[0]?.destination || null, compareVenues: venues });
          openWorkspace();
          if (venues.length > 1) {
            const alreadySent = messages.some(m => m.from === 'user' && m.text?.startsWith("I'm comparing these venues:"));
            if (!alreadySent) {
              const venueSummaries = venues.map(v => { const parts = [v.name]; if (v.type) parts.push(v.type); if (v.destination || v.country) parts.push(v.destination || v.country); if (v.capacity) parts.push(`up to ${v.capacity} guests`); return parts.join(', '); });
              sendMessage(`I'm comparing these venues: ${venueSummaries.join(' · ')}. Can you help me understand which might be the better fit for our wedding?`);
            }
          }
        }} style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, transition: 'opacity 0.18s', opacity: 0.65 }}
          onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '0.65'; }}
        >
          <span style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: '#C9A84C', flexShrink: 0 }}>✦</span>
          <span style={{ fontFamily: FB, fontSize: 12, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.02em' }}>Not sure which to choose? <span style={{ color: '#C9A84C' }}>Ask Aura →</span></span>
        </button>
      </div>
      <div style={{ flexShrink: 0, borderTop: '1px solid rgba(184,160,90,0.1)', background: 'rgba(8,8,6,0.98)', backdropFilter: 'blur(12px)', padding: '16px 44px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 }}>
        <div>
          <div style={{ fontFamily: FD, fontSize: 14, color: 'rgba(255,255,255,0.65)', letterSpacing: '0.04em', marginBottom: 3 }}>Luxury Wedding Directory</div>
          <div style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.02em' }}>The world's finest venues and vendors, carefully selected</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 7 }}>
          <div style={{ display: 'flex', gap: 20 }}>
            {['Privacy', 'Terms', 'Cookies', 'Contact'].map(lbl => (
              <a key={lbl} href={`/${lbl.toLowerCase()}`} style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.28)', textDecoration: 'none', letterSpacing: '0.02em', transition: 'color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.color = '#C9A84C'}
                onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.28)'}
              >{lbl}</a>
            ))}
          </div>
          <div style={{ fontFamily: FB, fontSize: 10, color: 'rgba(255,255,255,0.16)', letterSpacing: '0.01em' }}>
            &copy; {new Date().getFullYear()} Luxury Wedding Directory &middot; A brand of 5 Star Weddings Ltd
          </div>
        </div>
      </div>
      {enquiryVenue && <CompareEnquiryForm venue={enquiryVenue} onClose={() => setEnquiryVenue(null)} />}
    </div>
  );
}

// ─── GlobalCompare ────────────────────────────────────────────────────────────
// Drop this once into App — it listens to lwd:compare-bar events, reads
// sessionStorage, and renders the strip + modal on every page.
export default function GlobalCompare() {
  const [compareList, setCompareList] = useState(loadCompareList);
  const [showModal,   setShowModal]   = useState(false);

  useEffect(() => {
    const handler = () => setCompareList(loadCompareList());
    window.addEventListener('lwd:compare-bar', handler);
    return () => window.removeEventListener('lwd:compare-bar', handler);
  }, []);

  useEffect(() => {
    const handler = () => setShowModal(true);
    window.addEventListener('lwd:open-compare-modal', handler);
    return () => window.removeEventListener('lwd:open-compare-modal', handler);
  }, []);

  const removeItem = (id) => {
    const removed = compareList.find(v => v.id === id);
    const updated = compareList.filter(v => v.id !== id);
    if (removed) trackCompareRemove({ venueId: id, venueName: removed.name, compareList, sourceSurface: 'compare_bar' });
    saveCompareList(updated);
    setCompareList(updated);
    window.dispatchEvent(new CustomEvent('lwd:compare-bar', { detail: { active: updated.length > 0 } }));
  };

  const clearAll = () => {
    compareList.forEach(v => trackCompareRemove({ venueId: v.id, venueName: v.name, compareList, sourceSurface: 'compare_bar' }));
    saveCompareList([]);
    setCompareList([]);
    window.dispatchEvent(new CustomEvent('lwd:compare-bar', { detail: { active: false } }));
  };

  if (!compareList.length && !showModal) return null;

  return (
    <>
      <CompareBar
        items={compareList}
        onRemove={removeItem}
        onClear={clearAll}
        onCompare={() => {
          trackCompareView({ compareList, sourceSurface: 'compare_bar' });
          trackComparePair({ compareList, sourceSurface: 'compare_bar' });
          setShowModal(true);
        }}
      />
      {showModal && compareList.length > 0 && (
        <CompareModal
          items={compareList}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
