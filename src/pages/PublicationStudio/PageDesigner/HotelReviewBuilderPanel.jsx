// ── HotelReviewBuilderPanel.jsx ───────────────────────────────────────────────
// The LWD Hotel Review builder panel.
// Collects hotel details, section config, and editorial notes, then
// generates a structured AI page plan and calls onBuild() to render pages.

import { useState } from 'react';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';
import { generateHotelReview } from '../../../services/taigenicWriterService';
import RatingBar from './RatingBar';

// ── Constants ─────────────────────────────────────────────────────────────────
const REVIEW_TYPES = [
  { value: 'editorial', label: 'Editorial',  desc: 'LWD written & produced' },
  { value: 'sponsored', label: 'Sponsored',  desc: 'Paid partnership' },
  { value: 'self_serve', label: 'Self-Serve', desc: 'Hotel provides content' },
];

const SECTION_CONFIG = [
  { key: 'arrival',  label: 'Arrival',    icon: '⊕' },
  { key: 'rooms',    label: 'Rooms',      icon: '⊕' },
  { key: 'dining',   label: 'Dining',     icon: '⊕' },
  { key: 'spa',      label: 'Spa',        icon: '⊕' },
  { key: 'bar',      label: 'Bar',        icon: '⊕' },
  { key: 'pool',     label: 'Pool',       icon: '⊕' },
  { key: 'wedding',  label: 'Weddings',   icon: '⊕' },
  { key: 'location', label: 'Location',   icon: '⊕' },
];

const TONE_OPTIONS = ['Luxury Editorial', 'Warm & Personal', 'Sharp & Discerning', 'Travel Narrative', 'Classic Hotel Writing'];
const PRICE_OPTIONS = ['£', '££', '£££', '££££'];

// ── Sub-components ─────────────────────────────────────────────────────────────
function Label({ children, hint }) {
  return (
    <div style={{ marginBottom: 5 }}>
      <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: MUTED }}>
        {children}
      </span>
      {hint && (
        <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.25)', marginLeft: 6 }}>
          {hint}
        </span>
      )}
    </div>
  );
}

function Input({ value, onChange, placeholder, multiline, rows = 4 }) {
  const base = {
    width: '100%', boxSizing: 'border-box',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${BORDER}`,
    borderRadius: 3,
    color: '#fff',
    fontFamily: NU, fontSize: 11,
    padding: '7px 10px',
    outline: 'none',
    resize: 'vertical',
  };
  if (multiline) return <textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={rows} style={{ ...base, lineHeight: 1.55 }} />;
  return <input type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={{ ...base, lineHeight: 1 }} />;
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.05)',
        border: `1px solid ${BORDER}`,
        borderRadius: 3, color: '#fff',
        fontFamily: NU, fontSize: 11,
        padding: '7px 10px', cursor: 'pointer',
        outline: 'none',
      }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o} style={{ background: '#1a1814' }}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

function SectionDivider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '20px 0 14px' }}>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: GOLD, whiteSpace: 'nowrap' }}>
        {label}
      </span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function HotelReviewBuilderPanel({ onBuild, onClose }) {
  const [step, setStep] = useState('form'); // 'form' | 'generating' | 'success' | 'error'
  const [builtCount, setBuiltCount] = useState(0);
  const [buildProgress, setBuildProgress] = useState(0);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    hotelName:   '',
    location:    '',
    starRating:  5,
    priceRange:  '££££',
    reviewType:  'editorial',
    tone:        'Luxury Editorial',
    headline:    '',
    standfirst:  '',
    reviewText:  '',
    verdict:     '',
    bestFor:     '',
    sections: {
      arrival: true, rooms: true, dining: true,
      spa: false, bar: false, pool: false,
      wedding: true, location: false,
    },
  });

  const set = (field, value) => setForm(prev => ({ ...prev, [field]: value }));
  const setSection = (key, val) => setForm(prev => ({
    ...prev, sections: { ...prev.sections, [key]: val },
  }));

  // Count active pages: cover + arrival (always) + active body sections (rooms/dining) + verdict (always)
  const bodyPages = ['rooms', 'dining', 'spa', 'bar', 'pool', 'wedding', 'location']
    .filter(k => form.sections[k]).length;
  // We only map rooms + dining to distinct templates; others fold into arrival/verdict
  const mappedPages = ['rooms', 'dining'].filter(k => form.sections[k]).length;
  const totalPages = 2 + mappedPages + 1; // cover + arrival + mapped body + verdict

  async function handleGenerate() {
    if (!form.hotelName.trim()) { setError('Please enter the hotel name'); return; }
    setError('');
    setStep('generating');
    setBuildProgress(0);

    try {
      const structure = await generateHotelReview({
        hotelName:   form.hotelName.trim(),
        location:    form.location.trim(),
        starRating:  form.starRating,
        priceRange:  form.priceRange,
        reviewType:  form.reviewType,
        tone:        form.tone,
        headline:    form.headline.trim(),
        standfirst:  form.standfirst.trim(),
        reviewText:  form.reviewText.trim(),
        verdict:     form.verdict.trim(),
        sections:    form.sections,
        bestFor:     form.bestFor.split(',').map(s => s.trim()).filter(Boolean),
      });

      await onBuild(structure, (n) => setBuildProgress(n));
      setBuiltCount(structure.length);
      setStep('success');
    } catch (e) {
      setError(e.message || 'Generation failed. Check AI Settings.');
      setStep('error');
    }
  }

  function handleReset() {
    setStep('form');
    setError('');
    setBuildProgress(0);
    setBuiltCount(0);
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 900,
        background: 'rgba(0,0,0,0.68)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: 600, maxHeight: '92vh',
          background: '#141210',
          border: `1px solid ${BORDER}`,
          borderRadius: 6,
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'hrIn 0.2s ease',
        }}
        onClick={e => e.stopPropagation()}
      >
        <style>{`
          @keyframes hrIn { from { transform: scale(0.96); opacity:0 } to { transform: scale(1); opacity:1 } }
          .hr-input:focus { border-color: rgba(201,168,76,0.5) !important; }
          .hr-section-toggle { transition: all 0.1s; }
          .hr-section-toggle:hover { border-color: rgba(201,168,76,0.4) !important; }
        `}</style>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 22px 14px',
          borderBottom: `1px solid ${BORDER}`,
          flexShrink: 0,
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        }}>
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 5 }}>
              ✦ THE LWD HOTEL REVIEW
            </div>
            <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: '#F0EBE0', fontWeight: 400, lineHeight: 1.2 }}>
              Build a Signature Review
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 4, lineHeight: 1.4 }}>
              AI generates {totalPages} editorial pages from your brief
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0, marginTop: 2, flexShrink: 0 }}
          >
            ✕
          </button>
        </div>

        {/* ── SUCCESS STATE ── */}
        {step === 'success' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>✦</div>
            <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: '#34d399', marginBottom: 8 }}>
              Review built — {builtCount} pages added
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.7, marginBottom: 24 }}>
              Your hotel review pages are ready in the canvas.<br />
              Close this panel to continue editing.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleReset}
                style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.35)`,
                  borderRadius: 3, color: GOLD, padding: '9px 20px', cursor: 'pointer',
                }}
              >
                ✦ New Review
              </button>
              <button
                onClick={onClose}
                style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  background: 'none', border: `1px solid ${BORDER}`,
                  borderRadius: 3, color: MUTED, padding: '9px 20px', cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ── GENERATING STATE ── */}
        {step === 'generating' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: '#F0EBE0', marginBottom: 12 }}>
              Writing the review…
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 24, lineHeight: 1.6 }}>
              Generating editorial copy for {form.hotelName || 'your hotel'}<br />
              {buildProgress > 0 && `Building page ${buildProgress} of ${totalPages}…`}
            </div>
            {/* Progress bar */}
            <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%',
                background: GOLD,
                borderRadius: 2,
                width: buildProgress > 0 ? `${(buildProgress / totalPages) * 100}%` : '25%',
                transition: 'width 0.4s ease',
                animation: buildProgress === 0 ? 'hrPulse 1.5s ease infinite' : 'none',
              }} />
            </div>
            <style>{`@keyframes hrPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }`}</style>
          </div>
        )}

        {/* ── FORM STATE ── */}
        {(step === 'form' || step === 'error') && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 0' }}>

            {/* Error banner */}
            {error && (
              <div style={{
                background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
                borderRadius: 3, padding: '9px 12px', marginBottom: 16,
                fontFamily: NU, fontSize: 10, color: '#fca5a5', lineHeight: 1.5,
              }}>
                ⚠ {error}
              </div>
            )}

            {/* ── HOTEL IDENTITY ── */}
            <SectionDivider label="Hotel Identity" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <Label>Hotel Name <span style={{ color: '#f87171' }}>*</span></Label>
                <Input value={form.hotelName} onChange={v => set('hotelName', v)} placeholder="e.g. Claridge's" />
              </div>
              <div>
                <Label>Location</Label>
                <Input value={form.location} onChange={v => set('location', v)} placeholder="e.g. Mayfair, London" />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <div>
                <Label>Star Rating</Label>
                <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button
                      key={n}
                      onClick={() => set('starRating', n)}
                      style={{
                        width: 32, height: 32,
                        background: form.starRating >= n ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.starRating >= n ? 'rgba(201,168,76,0.5)' : BORDER}`,
                        borderRadius: 3, cursor: 'pointer',
                        fontFamily: NU, fontSize: 11,
                        color: form.starRating >= n ? GOLD : MUTED,
                      }}
                    >
                      ✦
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Price Range</Label>
                <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
                  {PRICE_OPTIONS.map(p => (
                    <button
                      key={p}
                      onClick={() => set('priceRange', p)}
                      style={{
                        flex: 1, height: 32,
                        background: form.priceRange === p ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                        border: `1px solid ${form.priceRange === p ? 'rgba(201,168,76,0.5)' : BORDER}`,
                        borderRadius: 3, cursor: 'pointer',
                        fontFamily: NU, fontSize: 9, fontWeight: 700,
                        color: form.priceRange === p ? GOLD : MUTED,
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Review Type</Label>
                <Select
                  value={form.reviewType}
                  onChange={v => set('reviewType', v)}
                  options={REVIEW_TYPES.map(r => ({ value: r.value, label: r.label }))}
                />
              </div>
            </div>

            <div style={{ marginBottom: 12 }}>
              <Label>Writing Tone</Label>
              <Select value={form.tone} onChange={v => set('tone', v)} options={TONE_OPTIONS} />
            </div>

            {/* ── EDITORIAL CONTENT ── */}
            <SectionDivider label="Editorial Content" />

            <div style={{ marginBottom: 12 }}>
              <Label>Headline / Title</Label>
              <Input value={form.headline} onChange={v => set('headline', v)} placeholder="e.g. An Art Deco Dream in Mayfair" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <Label hint="Tagline under headline">Standfirst</Label>
              <Input value={form.standfirst} onChange={v => set('standfirst', v)} placeholder="e.g. The grande dame of London hotels, restored to quiet magnificence" />
            </div>

            <div style={{ marginBottom: 12 }}>
              <Label hint="Paste press release, notes, or brief — AI builds from this">Review Notes / Brief</Label>
              <Input value={form.reviewText} onChange={v => set('reviewText', v)} placeholder="Add any background notes, key highlights, specific details or paste in a press release…" multiline rows={5} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <Label hint="Your editorial conclusion">Verdict</Label>
              <Input value={form.verdict} onChange={v => set('verdict', v)} placeholder="e.g. Claridge's doesn't just have history — it is history…" multiline rows={3} />
            </div>

            <div style={{ marginBottom: 12 }}>
              <Label hint="Comma separated">Best For</Label>
              <Input value={form.bestFor} onChange={v => set('bestFor', v)} placeholder="Honeymoons, Anniversaries, Business Stays, Long Weekends" />
            </div>

            {/* ── SECTIONS CONFIG ── */}
            <SectionDivider label="Review Sections" />
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
              Cover, Arrival, and Verdict are always included. Toggle additional sections below.
            </div>

            {/* Always-on chips */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {['Cover', 'Arrival', 'Verdict'].map(s => (
                <div key={s} style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: 'rgba(201,168,76,0.12)',
                  border: `1px solid rgba(201,168,76,0.4)`,
                  borderRadius: 2, padding: '5px 10px',
                  color: GOLD, userSelect: 'none',
                }}>
                  {s} ✓
                </div>
              ))}
            </div>

            {/* Toggleable sections */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {SECTION_CONFIG.map(s => {
                const on = !!form.sections[s.key];
                return (
                  <button
                    key={s.key}
                    className="hr-section-toggle"
                    onClick={() => setSection(s.key, !on)}
                    style={{
                      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: on ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${on ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      borderRadius: 2, padding: '5px 10px',
                      color: on ? GOLD : MUTED,
                      cursor: 'pointer',
                      transition: 'all 0.1s',
                    }}
                  >
                    {on ? '✓ ' : '+ '}{s.label}
                  </button>
                );
              })}
            </div>

            {/* Page count indicator */}
            <div style={{
              background: 'rgba(201,168,76,0.06)',
              border: `1px solid rgba(201,168,76,0.2)`,
              borderRadius: 3, padding: '8px 12px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
                Estimated pages
              </span>
              <span style={{ fontFamily: GD, fontSize: 14, fontStyle: 'italic', color: GOLD }}>
                {totalPages} pages
              </span>
            </div>

          </div>
        )}

        {/* ── Footer / Generate button ── */}
        {(step === 'form' || step === 'error') && (
          <div style={{
            padding: '14px 22px 18px',
            borderTop: `1px solid ${BORDER}`,
            flexShrink: 0,
            display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>
            <button
              onClick={onClose}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: 'none', border: `1px solid ${BORDER}`,
                borderRadius: 3, color: MUTED, padding: '9px 18px', cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!form.hotelName.trim()}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                textTransform: 'uppercase',
                background: form.hotelName.trim() ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.hotelName.trim() ? 'rgba(201,168,76,0.5)' : BORDER}`,
                borderRadius: 3,
                color: form.hotelName.trim() ? GOLD : MUTED,
                padding: '9px 22px', cursor: form.hotelName.trim() ? 'pointer' : 'default',
                transition: 'all 0.12s',
              }}
            >
              ✦ Generate Review ({totalPages} Pages)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
