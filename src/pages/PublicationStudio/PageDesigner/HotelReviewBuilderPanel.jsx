// ── HotelReviewBuilderPanel.jsx ───────────────────────────────────────────────
// The LWD Hotel Review builder panel.
// Collects hotel details, section config, and editorial notes, then
// generates a structured AI page plan and calls onBuild() to render pages.
// Phase 2: saves review record to magazine_hotel_reviews, image uploads,
// Fill From Listing search.

import { useState, useRef } from 'react';
import { GOLD, BORDER, MUTED, NU, GD } from './designerConstants';
import { generateHotelReview, fetchHotelFromUrl } from '../../../services/taigenicWriterService';

// ── Constants ─────────────────────────────────────────────────────────────────
const REVIEW_TYPES = [
  { value: 'editorial',  label: 'Editorial',  desc: 'LWD written & produced' },
  { value: 'sponsored',  label: 'Sponsored',  desc: 'Paid partnership' },
  { value: 'self_serve', label: 'Self-Serve', desc: 'Hotel provides content' },
];

const SECTION_CONFIG = [
  { key: 'arrival',  label: 'Arrival'  },
  { key: 'rooms',    label: 'Rooms'    },
  { key: 'dining',   label: 'Dining'   },
  { key: 'spa',      label: 'Spa'      },
  { key: 'bar',      label: 'Bar'      },
  { key: 'pool',     label: 'Pool'     },
  { key: 'wedding',  label: 'Weddings' },
  { key: 'location', label: 'Location' },
];

const IMAGE_CATEGORIES = [
  { key: 'exterior', label: 'Exterior' },
  { key: 'rooms',    label: 'Rooms'    },
  { key: 'dining',   label: 'Dining'   },
  { key: 'spa',      label: 'Spa'      },
  { key: 'details',  label: 'Details'  },
  { key: 'wedding',  label: 'Wedding'  },
];

const TONE_OPTIONS = [
  'Luxury Editorial', 'Warm & Personal', 'Sharp & Discerning',
  'Travel Narrative', 'Classic Hotel Writing',
];
const PRICE_OPTIONS = ['£', '££', '£££', '££££'];
const STORAGE_BUCKET = 'listing-media';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmt(ts) {
  if (!ts) return '';
  return new Date(ts).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Sub-components ────────────────────────────────────────────────────────────
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

function Field({ label, hint, children }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <Label hint={hint}>{label}</Label>
      {children}
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
  const [builtCount,     setBuiltCount]     = useState(0);
  const [buildProgress,  setBuildProgress]  = useState(0);
  const [error,          setError]          = useState('');
  const [savedReviewId,  setSavedReviewId]  = useState(null);

  // URL fetch + brand state
  const [hotelUrl,       setHotelUrl]       = useState('');
  const [fetchingUrl,    setFetchingUrl]    = useState(false);
  const [fetchError,     setFetchError]     = useState('');
  const [brandColors,    setBrandColors]    = useState(null); // { primary, accent, bg, text }

  // Fill From Listing state
  const [listingQuery,   setListingQuery]   = useState('');
  const [listingResults, setListingResults] = useState([]);
  const [listingLoading, setListingLoading] = useState(false);
  const listingTimer = useRef(null);

  // Image upload state — array of { url, category, isHero, storageKey }
  const [images,         setImages]         = useState([]);
  const [uploadingImg,   setUploadingImg]   = useState(false);
  const [imgError,       setImgError]       = useState('');
  const fileRef = useRef(null);
  const [pendingCategory, setPendingCategory] = useState('exterior');

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
    sourceListingId: null,
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

  const mappedPages = ['rooms', 'dining'].filter(k => form.sections[k]).length;
  const totalPages = 2 + mappedPages + 1; // cover + arrival + mapped body + verdict

  // ── Fill From Listing ────────────────────────────────────────────────────────
  async function searchListings(q) {
    setListingQuery(q);
    setListingResults([]);
    clearTimeout(listingTimer.current);
    if (!q.trim()) return;
    setListingLoading(true);
    listingTimer.current = setTimeout(async () => {
      try {
        const { supabase } = await import('../../../lib/supabaseClient');
        const { data } = await supabase
          .from('listings')
          .select('id, name, city, country, star_rating, short_description, media_items')
          .ilike('name', `%${q.trim()}%`)
          .limit(6);
        setListingResults(data || []);
      } catch { /* silent */ }
      setListingLoading(false);
    }, 280);
  }

  function applyListing(listing) {
    // Pull hero image from listing media
    let heroUrl = '';
    try {
      const items = Array.isArray(listing.media_items)
        ? listing.media_items : JSON.parse(listing.media_items || '[]');
      const feat = items.find(m => m.is_featured && m.type === 'image');
      heroUrl = feat?.url || items.find(m => m.type === 'image')?.url || '';
    } catch { /* ignore */ }

    setForm(prev => ({
      ...prev,
      hotelName:       listing.name || prev.hotelName,
      location:        [listing.city, listing.country].filter(Boolean).join(', ') || prev.location,
      starRating:      listing.star_rating || prev.starRating,
      reviewText:      listing.short_description || prev.reviewText,
      sourceListingId: listing.id,
    }));

    if (heroUrl) {
      setImages(prev => {
        const alreadyHero = prev.some(i => i.isHero);
        return alreadyHero ? prev : [{ url: heroUrl, category: 'exterior', isHero: true, storageKey: '' }, ...prev];
      });
    }

    setListingQuery(listing.name);
    setListingResults([]);
  }

  // ── Fetch from URL ────────────────────────────────────────────────────────────
  async function handleFetchUrl() {
    if (!hotelUrl.trim() && !form.hotelName.trim()) {
      setFetchError('Enter a hotel URL or name first');
      return;
    }
    setFetchingUrl(true);
    setFetchError('');
    try {
      const info = await fetchHotelFromUrl({
        url:       hotelUrl.trim(),
        hotelName: form.hotelName.trim(),
      });

      // Pre-fill form fields from fetched data
      setForm(prev => ({
        ...prev,
        hotelName:  info.hotel_name  || prev.hotelName,
        location:   info.location    || prev.location,
        starRating: info.star_rating || prev.starRating,
        priceRange: info.price_range || prev.priceRange,
        reviewText: info.description || prev.reviewText,
        bestFor:    info.best_for    || prev.bestFor,
      }));

      // Store brand colors — passed to generateHotelReview → layout renderers
      if (info.brand_colors?.primary) {
        setBrandColors(info.brand_colors);
      }
    } catch (err) {
      setFetchError(err.message || 'Could not fetch hotel info');
    } finally {
      setFetchingUrl(false);
    }
  }

  // ── Image upload ─────────────────────────────────────────────────────────────
  async function handleImageFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImg(true);
    setImgError('');
    try {
      const { supabase } = await import('../../../lib/supabaseClient');
      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const path = `hotel-reviews/${uid}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { upsert: true, contentType: file.type || 'image/jpeg', cacheControl: '31536000' });
      if (upErr) throw upErr;

      const { data: { publicUrl } } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      const isFirstHero = images.length === 0;
      setImages(prev => [...prev, { url: publicUrl, category: pendingCategory, isHero: isFirstHero, storageKey: path }]);
    } catch (err) {
      setImgError(err.message || 'Upload failed');
    } finally {
      setUploadingImg(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function toggleHero(idx) {
    setImages(prev => prev.map((img, i) => ({ ...img, isHero: i === idx })));
  }

  function removeImage(idx) {
    setImages(prev => prev.filter((_, i) => i !== idx));
  }

  function updateImageCategory(idx, cat) {
    setImages(prev => prev.map((img, i) => i === idx ? { ...img, category: cat } : img));
  }

  // ── Generate + Save ──────────────────────────────────────────────────────────
  async function handleGenerate() {
    if (!form.hotelName.trim()) { setError('Please enter the hotel name'); return; }
    setError('');
    setStep('generating');
    setBuildProgress(0);

    try {
      const { supabase } = await import('../../../lib/supabaseClient');

      // 1. Save review record to Supabase first
      const reviewPayload = {
        hotel_name:        form.hotelName.trim(),
        location:          form.location.trim() || null,
        star_rating:       form.starRating,
        price_range:       form.priceRange,
        review_type:       form.reviewType,
        headline:          form.headline.trim() || null,
        standfirst:        form.standfirst.trim() || null,
        review_text:       form.reviewText.trim() || null,
        verdict:           form.verdict.trim() || null,
        best_for:          form.bestFor.split(',').map(s => s.trim()).filter(Boolean),
        sections_config:   form.sections,
        images:            images,
        source_listing_id: form.sourceListingId || null,
        status:            'draft',
      };

      const { data: reviewRow, error: dbErr } = await supabase
        .from('magazine_hotel_reviews')
        .insert(reviewPayload)
        .select('id')
        .single();

      if (dbErr) {
        console.warn('[HotelReview] DB save failed (non-fatal):', dbErr.message);
        // Non-fatal — continue with build even if DB save fails
      } else {
        setSavedReviewId(reviewRow?.id);
      }

      // 2. Generate AI page structure
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
        brandColors, // from fetchHotelFromUrl — null means use LWD defaults
      });

      // 3. Build pages on canvas
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
    setSavedReviewId(null);
    setImages([]);
    setListingQuery('');
    setListingResults([]);
    setHotelUrl('');
    setFetchError('');
    setBrandColors(null);
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
          width: 620, maxHeight: '92vh',
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
          @keyframes hrIn { from { transform:scale(0.96);opacity:0 } to { transform:scale(1);opacity:1 } }
          @keyframes hrPulse { 0%,100%{opacity:0.4} 50%{opacity:1} }
          .hr-sec-btn { transition: all 0.1s !important; }
          .hr-sec-btn:hover { border-color: rgba(201,168,76,0.4) !important; }
          .hr-listing-row:hover { background: rgba(255,255,255,0.06) !important; }
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
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0, marginTop: 2, flexShrink: 0 }}>✕</button>
        </div>

        {/* ── SUCCESS STATE ── */}
        {step === 'success' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 32, textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>✦</div>
            <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: '#34d399', marginBottom: 8 }}>
              Review built — {builtCount} pages added
            </div>
            <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, lineHeight: 1.7, marginBottom: 6 }}>
              Your hotel review pages are ready in the canvas.
            </div>
            {savedReviewId && (
              <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(201,168,76,0.6)', marginBottom: 20 }}>
                Review saved · ID {savedReviewId.slice(0, 8)}…
              </div>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={handleReset} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.35)`, borderRadius: 3, color: GOLD, padding: '9px 20px', cursor: 'pointer' }}>
                ✦ New Review
              </button>
              <button onClick={onClose} style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', background: 'none', border: `1px solid ${BORDER}`, borderRadius: 3, color: MUTED, padding: '9px 20px', cursor: 'pointer' }}>
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
              Saving review · Generating editorial copy for {form.hotelName || 'your hotel'}
              {buildProgress > 0 && <><br />Building page {buildProgress} of {totalPages}…</>}
            </div>
            <div style={{ width: 200, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{
                height: '100%', background: GOLD, borderRadius: 2,
                width: buildProgress > 0 ? `${(buildProgress / totalPages) * 100}%` : '20%',
                transition: 'width 0.4s ease',
                animation: buildProgress === 0 ? 'hrPulse 1.5s ease infinite' : 'none',
              }} />
            </div>
          </div>
        )}

        {/* ── FORM STATE ── */}
        {(step === 'form' || step === 'error') && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 22px 0' }}>

            {/* Error banner */}
            {error && (
              <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 3, padding: '9px 12px', marginBottom: 16, fontFamily: NU, fontSize: 10, color: '#fca5a5', lineHeight: 1.5 }}>
                ⚠ {error}
              </div>
            )}

            {/* ── FETCH FROM WEBSITE ── */}
            <SectionDivider label="Fetch from Website" />
            <div style={{ marginBottom: 16 }}>
              <Label hint="AI reads the hotel's identity + brand palette">Hotel URL</Label>
              <div style={{ display: 'flex', gap: 6 }}>
                <input
                  type="text"
                  value={hotelUrl}
                  onChange={e => setHotelUrl(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                  placeholder="https://hotelname.com"
                  style={{
                    flex: 1, boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                    borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11,
                    padding: '7px 10px', outline: 'none',
                  }}
                />
                <button
                  onClick={handleFetchUrl}
                  disabled={fetchingUrl}
                  style={{
                    flexShrink: 0, padding: '7px 14px',
                    background: fetchingUrl ? `rgba(201,168,76,0.12)` : `rgba(201,168,76,0.15)`,
                    border: `1px solid rgba(201,168,76,0.35)`,
                    borderRadius: 3, cursor: fetchingUrl ? 'default' : 'pointer',
                    fontFamily: NU, fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: GOLD, whiteSpace: 'nowrap',
                  }}
                >
                  {fetchingUrl ? 'Fetching…' : '✦ Fetch'}
                </button>
              </div>
              {fetchError && (
                <div style={{ fontFamily: NU, fontSize: 9, color: '#fca5a5', marginTop: 4 }}>
                  ⚠ {fetchError}
                </div>
              )}
              {/* Brand palette preview */}
              {brandColors && (
                <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Brand palette:</span>
                  {[brandColors.primary, brandColors.accent, brandColors.bg, brandColors.text]
                    .filter(Boolean).map((c, i) => (
                      <div
                        key={i}
                        title={c}
                        style={{
                          width: 18, height: 18, borderRadius: 3,
                          background: c, border: `1px solid rgba(255,255,255,0.15)`,
                          flexShrink: 0,
                        }}
                      />
                    ))}
                  <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(201,168,76,0.7)' }}>
                    ✓ Applied to layout
                  </span>
                  <button
                    onClick={() => setBrandColors(null)}
                    style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontFamily: NU, fontSize: 9, padding: 0, marginLeft: 4 }}
                  >
                    ✕
                  </button>
                </div>
              )}
            </div>

            {/* ── FILL FROM LISTING ── */}
            <SectionDivider label="Fill From Listing" />
            <div style={{ marginBottom: 16 }}>
              <Label hint="Search the directory to pre-fill hotel details">Import from Directory</Label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={listingQuery}
                  onChange={e => searchListings(e.target.value)}
                  placeholder="Search by hotel name…"
                  style={{
                    width: '100%', boxSizing: 'border-box',
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER}`,
                    borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11,
                    padding: '7px 10px', outline: 'none',
                  }}
                />
                {listingLoading && (
                  <div style={{ position: 'absolute', right: 10, top: 9, fontFamily: NU, fontSize: 9, color: MUTED }}>
                    Searching…
                  </div>
                )}
              </div>
              {listingResults.length > 0 && (
                <div style={{ border: `1px solid ${BORDER}`, borderRadius: 3, marginTop: 4, overflow: 'hidden' }}>
                  {listingResults.map(l => (
                    <button
                      key={l.id}
                      className="hr-listing-row"
                      onClick={() => applyListing(l)}
                      style={{
                        display: 'block', width: '100%', textAlign: 'left',
                        background: 'rgba(255,255,255,0.03)',
                        border: 'none', borderBottom: `1px solid ${BORDER}`,
                        padding: '9px 12px', cursor: 'pointer',
                      }}
                    >
                      <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: '#F0EBE0', marginBottom: 2 }}>
                        {l.name}
                      </div>
                      <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
                        {[l.city, l.country].filter(Boolean).join(', ')}
                        {l.star_rating ? ` · ${l.star_rating}★` : ''}
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {form.sourceListingId && (
                <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(201,168,76,0.7)', marginTop: 4 }}>
                  ✓ Linked to directory listing
                </div>
              )}
            </div>

            {/* ── HOTEL IDENTITY ── */}
            <SectionDivider label="Hotel Identity" />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field label={<>Hotel Name <span style={{ color: '#f87171' }}>*</span></>}>
                <Input value={form.hotelName} onChange={v => set('hotelName', v)} placeholder="e.g. Claridge's" />
              </Field>
              <Field label="Location">
                <Input value={form.location} onChange={v => set('location', v)} placeholder="e.g. Mayfair, London" />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
              <Field label="Star Rating">
                <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => set('starRating', n)} style={{
                      width: 32, height: 32,
                      background: form.starRating >= n ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.starRating >= n ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      borderRadius: 3, cursor: 'pointer', fontFamily: NU, fontSize: 11,
                      color: form.starRating >= n ? GOLD : MUTED,
                    }}>✦</button>
                  ))}
                </div>
              </Field>
              <Field label="Price Range">
                <div style={{ display: 'flex', gap: 4, paddingTop: 2 }}>
                  {PRICE_OPTIONS.map(p => (
                    <button key={p} onClick={() => set('priceRange', p)} style={{
                      flex: 1, height: 32,
                      background: form.priceRange === p ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${form.priceRange === p ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      borderRadius: 3, cursor: 'pointer', fontFamily: NU, fontSize: 9, fontWeight: 700,
                      color: form.priceRange === p ? GOLD : MUTED,
                    }}>{p}</button>
                  ))}
                </div>
              </Field>
              <Field label="Review Type">
                <Select
                  value={form.reviewType}
                  onChange={v => set('reviewType', v)}
                  options={REVIEW_TYPES.map(r => ({ value: r.value, label: r.label }))}
                />
              </Field>
            </div>

            <Field label="Writing Tone">
              <Select value={form.tone} onChange={v => set('tone', v)} options={TONE_OPTIONS} />
            </Field>

            {/* ── EDITORIAL CONTENT ── */}
            <SectionDivider label="Editorial Content" />

            <Field label="Headline / Title">
              <Input value={form.headline} onChange={v => set('headline', v)} placeholder="e.g. An Art Deco Dream in Mayfair" />
            </Field>

            <Field label="Standfirst" hint="Tagline under headline">
              <Input value={form.standfirst} onChange={v => set('standfirst', v)} placeholder="e.g. The grande dame of London hotels, restored to quiet magnificence" />
            </Field>

            <Field label="Review Notes / Brief" hint="Paste press release, notes, or brief">
              <Input value={form.reviewText} onChange={v => set('reviewText', v)} placeholder="Add any background notes, key highlights, specific details or paste in a press release…" multiline rows={5} />
            </Field>

            <Field label="Verdict" hint="Your editorial conclusion">
              <Input value={form.verdict} onChange={v => set('verdict', v)} placeholder="e.g. Claridge's doesn't just have history — it is history…" multiline rows={3} />
            </Field>

            <Field label="Best For" hint="Comma separated">
              <Input value={form.bestFor} onChange={v => set('bestFor', v)} placeholder="Honeymoons, Anniversaries, Business Stays, Long Weekends" />
            </Field>

            {/* ── IMAGES ── */}
            <SectionDivider label="Images" />

            {/* Category selector + upload button */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 10, alignItems: 'center' }}>
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', flex: 1 }}>
                {IMAGE_CATEGORIES.map(c => (
                  <button
                    key={c.key}
                    onClick={() => setPendingCategory(c.key)}
                    style={{
                      fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
                      textTransform: 'uppercase',
                      background: pendingCategory === c.key ? 'rgba(201,168,76,0.18)' : 'rgba(255,255,255,0.04)',
                      border: `1px solid ${pendingCategory === c.key ? 'rgba(201,168,76,0.5)' : BORDER}`,
                      borderRadius: 2, padding: '4px 8px', cursor: 'pointer',
                      color: pendingCategory === c.key ? GOLD : MUTED,
                    }}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingImg}
                style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
                  textTransform: 'uppercase', whiteSpace: 'nowrap', flexShrink: 0,
                  background: uploadingImg ? 'rgba(201,168,76,0.08)' : 'rgba(201,168,76,0.12)',
                  border: `1px solid rgba(201,168,76,0.4)`, borderRadius: 3,
                  color: GOLD, padding: '6px 12px', cursor: uploadingImg ? 'default' : 'pointer',
                }}
              >
                {uploadingImg ? '↑ Uploading…' : '↑ Upload Image'}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={handleImageFile} style={{ display: 'none' }} />
            </div>

            {imgError && (
              <div style={{ fontFamily: NU, fontSize: 9, color: '#f87171', marginBottom: 8 }}>
                ⚠ {imgError}
              </div>
            )}

            {/* Image grid */}
            {images.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 }}>
                {images.map((img, idx) => (
                  <div key={idx} style={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: `1px solid ${img.isHero ? GOLD : BORDER}` }}>
                    <img src={img.url} alt="" style={{ width: '100%', height: 80, objectFit: 'cover', display: 'block' }} onError={e => { e.target.style.opacity = 0.3; }} />
                    {/* Category tag */}
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(10,9,8,0.75)', padding: '3px 6px' }}>
                      <select
                        value={img.category}
                        onChange={e => updateImageCategory(idx, e.target.value)}
                        style={{ width: '100%', background: 'none', border: 'none', color: img.isHero ? GOLD : 'rgba(255,255,255,0.7)', fontFamily: NU, fontSize: 8, cursor: 'pointer', outline: 'none' }}
                      >
                        {IMAGE_CATEGORIES.map(c => (
                          <option key={c.key} value={c.key} style={{ background: '#1a1814' }}>{c.label}</option>
                        ))}
                      </select>
                    </div>
                    {/* Hero toggle */}
                    <button
                      onClick={() => toggleHero(idx)}
                      title={img.isHero ? 'Hero image' : 'Set as hero'}
                      style={{
                        position: 'absolute', top: 4, left: 4,
                        background: img.isHero ? GOLD : 'rgba(10,9,8,0.65)',
                        border: 'none', borderRadius: 2,
                        color: img.isHero ? '#1a1814' : 'rgba(255,255,255,0.6)',
                        fontSize: 9, fontFamily: NU, fontWeight: 700,
                        padding: '2px 5px', cursor: 'pointer', lineHeight: 1,
                      }}
                    >
                      {img.isHero ? 'HERO' : 'hero'}
                    </button>
                    {/* Remove */}
                    <button
                      onClick={() => removeImage(idx)}
                      style={{
                        position: 'absolute', top: 4, right: 4,
                        background: 'rgba(10,9,8,0.65)', border: 'none',
                        color: '#fff', borderRadius: 2, width: 18, height: 18,
                        fontSize: 10, cursor: 'pointer', lineHeight: 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >✕</button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.2)', marginBottom: 16, fontStyle: 'italic' }}>
                No images uploaded yet — pages will use editorial stock photography
              </div>
            )}

            {/* ── SECTIONS CONFIG ── */}
            <SectionDivider label="Review Sections" />
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 10, lineHeight: 1.5 }}>
              Cover, Arrival, and Verdict are always included.
            </div>

            {/* Always-on */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
              {['Cover', 'Arrival', 'Verdict'].map(s => (
                <div key={s} style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                  background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,0.4)`,
                  borderRadius: 2, padding: '5px 10px', color: GOLD, userSelect: 'none',
                }}>
                  {s} ✓
                </div>
              ))}
            </div>

            {/* Toggleable */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
              {SECTION_CONFIG.map(s => {
                const on = !!form.sections[s.key];
                return (
                  <button key={s.key} className="hr-sec-btn" onClick={() => setSection(s.key, !on)} style={{
                    fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                    background: on ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? 'rgba(201,168,76,0.5)' : BORDER}`,
                    borderRadius: 2, padding: '5px 10px',
                    color: on ? GOLD : MUTED, cursor: 'pointer',
                  }}>
                    {on ? '✓ ' : '+ '}{s.label}
                  </button>
                );
              })}
            </div>

            {/* Page count */}
            <div style={{
              background: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.2)`,
              borderRadius: 3, padding: '8px 14px', marginBottom: 20,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Estimated pages</span>
              <span style={{ fontFamily: GD, fontSize: 14, fontStyle: 'italic', color: GOLD }}>{totalPages} pages</span>
            </div>

          </div>
        )}

        {/* ── Footer / Generate button ── */}
        {(step === 'form' || step === 'error') && (
          <div style={{
            padding: '14px 22px 18px', borderTop: `1px solid ${BORDER}`,
            flexShrink: 0, display: 'flex', gap: 8, justifyContent: 'flex-end',
          }}>
            <button onClick={onClose} style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              background: 'none', border: `1px solid ${BORDER}`, borderRadius: 3,
              color: MUTED, padding: '9px 18px', cursor: 'pointer',
            }}>
              Cancel
            </button>
            <button
              onClick={handleGenerate}
              disabled={!form.hotelName.trim()}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                background: form.hotelName.trim() ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${form.hotelName.trim() ? 'rgba(201,168,76,0.5)' : BORDER}`,
                borderRadius: 3, color: form.hotelName.trim() ? GOLD : MUTED,
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
