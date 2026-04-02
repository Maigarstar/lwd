// ─── src/pages/AdminModules/ShowcaseStudioModule.jsx ─────────────────────────
// Showcase Studio — 3-panel builder for dynamic showcase pages.
//
// Layout (split mode):
//   Left rail  (260px): Section list + DnD reorder + add/duplicate/delete
//   Centre (flex:1):    Interactive ShowcaseRenderer canvas (click to select)
//   Right panel (360px): SectionEditor for selected section; meta when none
//
// Toolbar: [Magic AI] [Fill with AI] left · [Discard][Save Draft][Publish] | [Editor][Split][Preview] right
//
// Follows the locked Studio Builder pattern.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import ShowcaseRenderer from '../ShowcaseRenderer';
import { generateShowcaseWithAi, generateSectionWithAi } from '../../services/showcaseAiService';
import { supabase } from '../../lib/supabaseClient';
import {
  SECTION_REGISTRY,
  SECTION_TYPE_ORDER,
  SHOWCASE_TEMPLATES,
  createSection,
  validateShowcase,
  getTemplateSections,
} from '../../services/showcaseRegistry';
import {
  fetchShowcases,
  fetchShowcaseById,
  saveShowcaseDraft,
  publishShowcase,
  duplicateShowcase,
  createShowcase,
  updateShowcase,
  fetchTemplates,
  cloneTemplate,
  saveShowcaseAsTemplate,
} from '../../services/showcaseService';

const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';

// ── Shared input / label styles ───────────────────────────────────────────────
const inp = (C) => ({
  width: '100%', boxSizing: 'border-box',
  background: C.bg, border: `1px solid ${C.border}`,
  borderRadius: 3, padding: '8px 12px',
  fontFamily: NU, fontSize: 13, color: C.off,
  outline: 'none',
});

const lbl = (C) => ({
  display: 'block', fontFamily: NU, fontSize: 10,
  letterSpacing: '0.12em', textTransform: 'uppercase',
  color: C.grey2, marginBottom: 5,
});

// ─────────────────────────────────────────────────────────────────────────────
// ImageUploadField — URL input + file upload button + thumbnail preview
// ─────────────────────────────────────────────────────────────────────────────
function ImageUploadField({ label: fieldLabel, value, onChange, C, uploadPath }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const fileRef = useRef(null);

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const ext  = file.name.split('.').pop();
      const path = `${uploadPath || 'showcases'}/${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('showcase-media')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('showcase-media').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl(C)}>{fieldLabel}</label>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... or upload →"
          style={{ ...inp(C), flex: 1 }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          title="Upload image"
          style={{
            flexShrink: 0, padding: '7px 11px',
            background: uploading ? `${GOLD}55` : `${GOLD}22`,
            border: `1px solid ${GOLD}55`,
            borderRadius: 3, cursor: uploading ? 'default' : 'pointer',
            fontFamily: 'inherit', fontSize: 11, color: GOLD, whiteSpace: 'nowrap',
          }}
        >
          {uploading ? '…' : '↑ Upload'}
        </button>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {error && (
        <div style={{ marginTop: 4, fontFamily: 'inherit', fontSize: 10, color: '#f87171' }}>{error}</div>
      )}
      {value && (
        <div style={{ marginTop: 6, position: 'relative', display: 'inline-block' }}>
          <img
            src={value}
            alt=""
            style={{ width: '100%', maxHeight: 90, objectFit: 'cover', borderRadius: 3, display: 'block' }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <button
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 4, right: 4,
              background: 'rgba(0,0,0,0.6)', border: 'none',
              color: '#fff', borderRadius: 2, width: 18, height: 18,
              fontSize: 10, cursor: 'pointer', lineHeight: 1, padding: 0,
            }}
          >✕</button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// GalleryEditor — gallery section with per-row upload + bulk multi-upload
// ─────────────────────────────────────────────────────────────────────────────
function GalleryEditor({ content, setContent, setLayout, section, showcase, C }) {
  const [bulkUploading, setBulkUploading] = useState(false);
  const [bulkError,     setBulkError]     = useState(null);
  const [rowUploading,  setRowUploading]  = useState({});
  const bulkRef = useRef(null);

  const uploadPath = `showcases/${showcase?.slug || showcase?.id || 'new'}/${section.id}`;

  async function uploadFile(file) {
    const ext  = file.name.split('.').pop();
    const path = `${uploadPath}/${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
    const { error } = await supabase.storage
      .from('showcase-media')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) throw error;
    const { data } = supabase.storage.from('showcase-media').getPublicUrl(path);
    return data.publicUrl;
  }

  async function handleBulk(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setBulkUploading(true);
    setBulkError(null);
    try {
      const urls = await Promise.all(files.map(uploadFile));
      const newImgs = urls.map(url => ({ url, caption: '' }));
      setContent('images', [...(content.images || []), ...newImgs]);
    } catch (err) {
      setBulkError(err.message || 'Upload failed');
    } finally {
      setBulkUploading(false);
      if (bulkRef.current) bulkRef.current.value = '';
    }
  }

  async function handleRowUpload(idx, file) {
    setRowUploading(r => ({ ...r, [idx]: true }));
    try {
      const url = await uploadFile(file);
      const next = [...(content.images || [])];
      next[idx] = { ...next[idx], url };
      setContent('images', next);
    } catch (err) {
      setBulkError(err.message || 'Upload failed');
    } finally {
      setRowUploading(r => ({ ...r, [idx]: false }));
    }
  }

  return (
    <>
      {/* Title */}
      <div style={{ marginBottom: 12 }}>
        <label style={lbl(C)}>Title</label>
        <input
          value={content.title || ''}
          onChange={e => setContent('title', e.target.value)}
          style={{ ...inp(C), width: '100%' }}
        />
      </div>

      {/* Variant */}
      <div style={{ marginBottom: 12 }}>
        <label style={lbl(C)}>Variant</label>
        <select
          value={section.layout?.variant || 'carousel'}
          onChange={e => setLayout('variant', e.target.value)}
          style={{ ...inp(C), width: '100%' }}
        >
          {[{ value: 'carousel', label: 'Carousel' }, { value: 'grid', label: 'Grid' }, { value: 'mixed', label: 'Mixed' }].map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Images */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={{ ...lbl(C), marginBottom: 0 }}>Images</label>
          {/* Bulk upload */}
          <button
            onClick={() => bulkRef.current?.click()}
            disabled={bulkUploading}
            style={{
              fontFamily: NU, fontSize: 10, letterSpacing: '0.08em',
              color: GOLD, background: `${GOLD}18`, border: `1px solid ${GOLD}55`,
              borderRadius: 3, padding: '4px 10px', cursor: bulkUploading ? 'default' : 'pointer',
              opacity: bulkUploading ? 0.6 : 1,
            }}
          >
            {bulkUploading ? '…uploading' : '↑ Upload Multiple'}
          </button>
          <input
            ref={bulkRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleBulk}
            style={{ display: 'none' }}
          />
        </div>

        {bulkError && (
          <div style={{ fontSize: 10, color: '#f87171', marginBottom: 6 }}>{bulkError}</div>
        )}

        {(content.images || []).map((img, idx) => {
          return (
            <div key={idx} style={{ marginBottom: 8, background: `${C.border}33`, borderRadius: 4, padding: '8px 8px 6px' }}>
              {/* URL row */}
              <div style={{ display: 'flex', gap: 5, alignItems: 'center', marginBottom: 5 }}>
                <input
                  placeholder="Image URL"
                  value={img.url || ''}
                  onChange={e => {
                    const n = [...(content.images || [])];
                    n[idx] = { ...n[idx], url: e.target.value };
                    setContent('images', n);
                  }}
                  style={{ ...inp(C), fontSize: 11, flex: 1 }}
                />
                {/* Per-row upload */}
                <button
                  onClick={() => {
                    const el = document.getElementById(`gallery-row-upload-${section.id}-${idx}`);
                    el?.click();
                  }}
                  disabled={!!rowUploading[idx]}
                  style={{
                    flexShrink: 0, padding: '5px 9px',
                    background: rowUploading[idx] ? `${GOLD}33` : `${GOLD}22`,
                    border: `1px solid ${GOLD}55`, borderRadius: 3,
                    fontFamily: 'inherit', fontSize: 11, color: GOLD,
                    cursor: rowUploading[idx] ? 'default' : 'pointer', whiteSpace: 'nowrap',
                  }}
                >
                  {rowUploading[idx] ? '…' : '↑'}
                </button>
                <input
                  id={`gallery-row-upload-${section.id}-${idx}`}
                  type="file"
                  accept="image/*"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleRowUpload(idx, f); e.target.value = ''; }}
                  style={{ display: 'none' }}
                />
                {/* Thumbnail */}
                {img.url && (
                  <img
                    src={img.url}
                    alt=""
                    style={{ width: 32, height: 32, objectFit: 'cover', borderRadius: 3, flexShrink: 0, border: `1px solid ${C.border}` }}
                  />
                )}
                {/* Remove */}
                <button
                  onClick={() => setContent('images', (content.images || []).filter((_, i) => i !== idx))}
                  style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 13, flexShrink: 0 }}
                >✕</button>
              </div>
              {/* Caption row */}
              <input
                placeholder="Caption (optional)"
                value={img.caption || ''}
                onChange={e => {
                  const n = [...(content.images || [])];
                  n[idx] = { ...n[idx], caption: e.target.value };
                  setContent('images', n);
                }}
                style={{ ...inp(C), fontSize: 11, width: '100%' }}
              />
            </div>
          );
        })}

        <button
          onClick={() => setContent('images', [...(content.images || []), { url: '', caption: '' }])}
          style={{ fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 3, padding: '5px 12px', cursor: 'pointer', marginTop: 2 }}
        >
          + Add Image
        </button>
      </div>
    </>
  );
}

// SectionEditor — right panel content editor for a selected section
// ─────────────────────────────────────────────────────────────────────────────
// Build venue context string from showcase meta + sections array
function buildAutoVenueInfo(showcase, sections) {
  if (!showcase && !(sections?.length)) return '';
  const parts = [];
  const name = showcase?.name || showcase?.title || '';
  if (name)                parts.push(`Venue: ${name}`);
  if (showcase?.location)  parts.push(`Location: ${showcase.location}`);
  if (showcase?.excerpt)   parts.push(`About: ${showcase.excerpt}`);
  // Mine content from current working sections
  const secs = sections || showcase?.sections || [];
  for (const s of secs) {
    const c = s?.content || {};
    if (s.type === 'hero'   && c.tagline)     parts.push(`Tagline: ${c.tagline}`);
    if (s.type === 'intro'  && c.body)        parts.push(`Description: ${c.body}`);
    if (s.type === 'stats'  && c.items?.length) {
      parts.push(`Key stats: ${c.items.map(i => `${i.value} ${i.label}`).join(', ')}`);
    }
    if (s.type === 'verified') {
      if (c.ceremony_capacity) parts.push(`Ceremony capacity: ${c.ceremony_capacity}`);
      if (c.bedrooms)          parts.push(`Bedrooms: ${c.bedrooms}`);
      if (c.location_summary)  parts.push(`Location detail: ${c.location_summary}`);
      if (c.style)             parts.push(`Style: ${c.style}`);
    }
    if (s.type === 'pricing' && c.price_from) parts.push(`Venue hire from: ${c.price_from}`);
    if (s.type === 'nearby'  && c.items?.length) {
      parts.push(`Nearby: ${c.items.map(i => `${i.label} (${i.distance})`).join(', ')}`);
    }
  }
  return parts.join('\n');
}

// Video upload field
function detectVideoType(url) {
  if (!url) return null;
  if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts\//.test(url)) return 'youtube';
  if (/vimeo\.com\//.test(url)) return 'vimeo';
  if (/\.(mp4|webm|mov|ogg)(\?|$)/i.test(url)) return 'direct';
  return null;
}
function getYtId(url) {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return m?.[1] || null;
}

function VideoUploadField({ value, onChange, C, uploadPath }) {
  const [uploading, setUploading] = useState(false);
  const [error,     setError]     = useState(null);
  const fileRef = useRef(null);
  const vtype = detectVideoType(value);
  const ytId  = vtype === 'youtube' ? getYtId(value) : null;

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const ext  = file.name.split('.').pop();
      const path = `${uploadPath || 'showcases/video'}/${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('showcase-media').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('showcase-media').getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input type="text" value={value || ''} onChange={e => onChange(e.target.value)}
          placeholder="YouTube URL, Vimeo URL, or upload mp4/webm →"
          style={{ ...inp(C), flex: 1 }} />
        <button onClick={() => fileRef.current?.click()} disabled={uploading}
          style={{ flexShrink: 0, padding: '7px 11px', background: uploading ? `${GOLD}55` : `${GOLD}22`, border: `1px solid ${GOLD}55`, borderRadius: 3, cursor: uploading ? 'default' : 'pointer', fontFamily: 'inherit', fontSize: 11, color: GOLD, whiteSpace: 'nowrap' }}>
          {uploading ? '…' : '↑ File'}
        </button>
        <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={handleFile} style={{ display: 'none' }} />
      </div>
      {error && <div style={{ marginTop: 4, fontSize: 10, color: '#f87171' }}>{error}</div>}
      {value && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          {vtype === 'youtube' && ytId ? (
            <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="YouTube thumbnail"
              style={{ height: 56, width: 100, objectFit: 'cover', borderRadius: 3 }} />
          ) : vtype === 'vimeo' ? (
            <div style={{ height: 56, width: 100, borderRadius: 3, background: '#1ab7ea22', border: `1px solid #1ab7ea44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: '#1ab7ea' }}>VIMEO</span>
            </div>
          ) : (
            <video src={value} style={{ height: 56, width: 100, objectFit: 'cover', borderRadius: 3, background: '#111' }} muted />
          )}
          <div>
            <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey2, marginBottom: 4 }}>
              {vtype === 'youtube' ? 'YouTube' : vtype === 'vimeo' ? 'Vimeo' : 'Direct video'} ✓
            </div>
            <button onClick={() => onChange('')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 10, padding: 0, fontFamily: NU }}>Remove</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Geocode query builder — strips address noise, extracts city/country ─────────
function buildGeoQueries(title, location) {
  // location may be "Adria Palace, Erzsébet tér 7–8 · Budapest · Hungary"
  // We want to extract just "Budapest, Hungary" for geocoding
  let cityCountry = (location || '').trim();
  if (cityCountry) {
    // Split on middle-dot separator (·) — last 2 segments are city + country
    const dotParts = cityCountry.split('·').map(s => s.trim()).filter(Boolean);
    if (dotParts.length >= 2) {
      cityCountry = dotParts.slice(-2).join(', ');
    } else {
      // Fall back to comma split — last 2 segments
      const commaParts = dotParts[0].split(',').map(s => s.trim()).filter(Boolean);
      cityCountry = commaParts.slice(-Math.min(2, commaParts.length)).join(', ');
    }
  }
  const queries = [];
  if (title && cityCountry) queries.push(`${title}, ${cityCountry}`);
  if (title)                 queries.push(title);
  if (cityCountry)           queries.push(cityCountry);
  return queries;
}

// ── NearbyMapField — fully automatic geocode from venue name + location ────────
function NearbyMapField({ content, setContent, C, showcase }) {
  const [status, setStatus] = useState('idle'); // idle | loading | ok | error
  const [found,  setFound]  = useState('');

  const hasCoords = !!(content.lat && content.lng);

  async function geocode() {
    const queries = buildGeoQueries(showcase?.title, showcase?.location);
    if (!queries.length) { setStatus('error'); setFound('No venue name or location set on this showcase'); return; }
    setStatus('loading');
    try {
      for (const q of queries) {
        const res  = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(q)}`, { headers: { 'Accept-Language': 'en' } });
        const data = await res.json();
        if (data?.[0]) {
          setContent('lat', data[0].lat);
          setContent('lng', data[0].lon);
          const label = data[0].display_name;
          setFound(label.slice(0, 72) + (label.length > 72 ? '…' : ''));
          setStatus('ok');
          return;
        }
      }
      setStatus('error'); setFound(`Could not locate "${queries[0]}" — enter coordinates manually`);
    } catch { setStatus('error'); setFound('Network error — try again'); }
  }

  // Auto-run on mount if coords are missing
  useEffect(() => { if (!hasCoords) geocode(); }, []);

  return (
    <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 6, border: `1px solid ${C.border}`, background: C.cardBg || `${C.border}18` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 16, lineHeight: 1 }}>⌖</span>
        <div style={{ flex: 1, fontFamily: NU, fontSize: 11 }}>
          {status === 'loading' && <span style={{ color: C.grey2 }}>Locating <strong>{showcase?.title}</strong>…</span>}
          {status === 'ok'      && <span style={{ color: '#22c55e' }}>✓ {found}</span>}
          {status === 'error'   && <span style={{ color: '#f87171' }}>{found}</span>}
          {status === 'idle' && hasCoords && <span style={{ color: '#22c55e' }}>✓ Location set ({parseFloat(content.lat).toFixed(4)}, {parseFloat(content.lng).toFixed(4)})</span>}
          {status === 'idle' && !hasCoords && <span style={{ color: C.grey2 }}>Waiting…</span>}
        </div>
        <button onClick={geocode} disabled={status === 'loading'}
          style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '4px 10px', background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, color: C.grey2, cursor: status === 'loading' ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
          {status === 'loading' ? '…' : '↺ Retry'}
        </button>
      </div>
      {hasCoords && (
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 6 }}>
          {parseFloat(content.lat).toFixed(5)}, {parseFloat(content.lng).toFixed(5)}
          <button onClick={() => { setContent('lat', ''); setContent('lng', ''); setStatus('idle'); setFound(''); }}
            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 10, marginLeft: 8, padding: 0 }}>clear</button>
        </div>
      )}
    </div>
  );
}

// ── HeroVideoField — YouTube / Vimeo / upload for hero background ─────────────
function HeroVideoField({ content, setContent, C }) {
  const [mode,      setMode]      = useState(null); // null | 'youtube' | 'vimeo' | 'upload'
  const [urlInput,  setUrlInput]  = useState('');
  const [uploading, setUploading] = useState(false);
  const [err,       setErr]       = useState('');
  const fileRef = useRef(null);
  const current = content.videoUrl || '';

  function ytId(url) {
    return url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)?.[1] || null;
  }
  function vmId(url) {
    return url.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || null;
  }

  const previewYt = mode === 'youtube' ? ytId(urlInput) : null;
  const previewVm = mode === 'vimeo'   ? vmId(urlInput) : null;

  function apply(url) { setContent('videoUrl', url); setMode(null); setUrlInput(''); setErr(''); }

  async function handleUpload(e) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true); setErr('');
    try {
      const ext  = file.name.split('.').pop();
      const path = `showcases/hero-video/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('showcase-media').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      apply(supabase.storage.from('showcase-media').getPublicUrl(path).data.publicUrl);
    } catch (e2) { setErr(e2.message || 'Upload failed'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  const tabBtn = (active) => ({
    fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '5px 12px', borderRadius: 3, cursor: 'pointer',
    background: active ? GOLD : 'none', color: active ? '#0a0906' : C.grey2,
    border: `1px solid ${active ? GOLD : C.border}`,
  });

  // Detect current type
  const curYt = current ? ytId(current) : null;
  const curVm = current ? vmId(current) : null;
  const curType = curYt ? 'youtube' : curVm ? 'vimeo' : current ? 'direct' : null;

  return (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl(C)}>Background Video <span style={{ fontWeight: 400, opacity: 0.6 }}>(optional — plays silently behind hero)</span></label>

      {/* Current video indicator */}
      {current && !mode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', background: C.cardBg || `${C.border}20`, border: `1px solid ${C.border}`, borderRadius: 5, marginBottom: 8 }}>
          {curYt && <img src={`https://img.youtube.com/vi/${curYt}/mqdefault.jpg`} style={{ width: 60, height: 34, objectFit: 'cover', borderRadius: 3 }} alt="" />}
          {curVm && <div style={{ width: 60, height: 34, borderRadius: 3, background: '#1ab7ea22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: '#1ab7ea' }}>VIMEO</span></div>}
          {curType === 'direct' && <div style={{ width: 60, height: 34, borderRadius: 3, background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>}
          <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: curYt ? '#f00' : curVm ? '#1ab7ea' : C.grey2, flex: 1 }}>
            {curYt ? 'YouTube' : curVm ? 'Vimeo' : 'Uploaded'} Video ✓
          </span>
          <button onClick={() => setContent('videoUrl', '')} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: '0 2px' }}>✕ Remove</button>
        </div>
      )}

      {/* Add / change panel */}
      {mode ? (
        <div style={{ padding: 12, background: `${GOLD}0a`, border: `1px solid ${GOLD}33`, borderRadius: 6 }}>
          <div style={{ display: 'flex', gap: 5, marginBottom: 12 }}>
            <button style={tabBtn(mode === 'youtube')} onClick={() => setMode('youtube')}>▶ YouTube</button>
            <button style={tabBtn(mode === 'vimeo')}   onClick={() => setMode('vimeo')}>◈ Vimeo</button>
            <button style={tabBtn(mode === 'upload')}  onClick={() => setMode('upload')}>↑ Upload</button>
          </div>

          {(mode === 'youtube' || mode === 'vimeo') && (
            <>
              <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setErr(''); }} autoFocus
                placeholder={mode === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://vimeo.com/123456789'}
                style={{ ...inp(C), marginBottom: 8 }} />
              {err && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginBottom: 6 }}>{err}</div>}
              {previewYt && <div style={{ marginBottom: 8 }}><img src={`https://img.youtube.com/vi/${previewYt}/hqdefault.jpg`} style={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 3 }} alt="" /></div>}
              {previewVm && <div style={{ marginBottom: 8, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', color: '#1ab7ea' }}>◈ Vimeo ID {previewVm} ✓</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => {
                  const id = mode === 'youtube' ? ytId(urlInput) : vmId(urlInput);
                  if (!id) { setErr(`Paste a valid ${mode === 'youtube' ? 'YouTube' : 'Vimeo'} URL`); return; }
                  apply(urlInput);
                }} style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', background: GOLD, color: '#0a0906', border: 'none', borderRadius: 3, cursor: 'pointer' }}>
                  Set Video
                </button>
                <button onClick={() => { setMode(null); setUrlInput(''); setErr(''); }} style={{ fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          )}

          {mode === 'upload' && (
            <>
              {err && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginBottom: 6 }}>{err}</div>}
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '6px 14px', background: uploading ? `${GOLD}66` : GOLD, color: '#0a0906', border: 'none', borderRadius: 3, cursor: uploading ? 'default' : 'pointer' }}>
                  {uploading ? 'Uploading…' : '↑ Choose Video'}
                </button>
                <button onClick={() => { setMode(null); setErr(''); }} style={{ fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '6px 12px', cursor: 'pointer' }}>Cancel</button>
              </div>
              <div style={{ marginTop: 6, fontFamily: NU, fontSize: 10, color: C.grey2 }}>mp4 · webm · mov · m4v — keep under 50MB for fast load</div>
              <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/x-m4v,video/*" onChange={handleUpload} style={{ display: 'none' }} />
            </>
          )}
        </div>
      ) : (
        <button onClick={() => setMode(current ? 'youtube' : 'youtube')}
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: current ? C.grey2 : GOLD, background: current ? 'none' : `${GOLD}10`, border: `1px dashed ${current ? C.border : GOLD + '55'}`, borderRadius: 5, padding: '8px 14px', cursor: 'pointer', width: '100%', justifyContent: 'center' }}>
          {current ? '↻ Change Video' : '▶ Add Background Video'}
        </button>
      )}
    </div>
  );
}

// ── FilmsEditor — YouTube video gallery builder ────────────────────────────────
function FilmsEditor({ content, setContent, C }) {
  const [addMode,    setAddMode]    = useState(null); // null | 'youtube' | 'upload'
  const [urlInput,   setUrlInput]   = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [uploading,  setUploading]  = useState(false);
  const [err,        setErr]        = useState('');
  const fileRef = useRef(null);

  const videos = content.videos || [];

  function extractYtId(url) {
    const m = url.match(/(?:youtube\.com\/(?:watch\?v=|shorts\/|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m?.[1] || null;
  }
  const previewId = extractYtId(urlInput);

  function resetAdd() { setAddMode(null); setUrlInput(''); setTitleInput(''); setErr(''); }

  function handleAddYoutube() {
    const ytId = extractYtId(urlInput);
    if (!ytId) { setErr('Paste a valid YouTube URL'); return; }
    setContent('videos', [...videos, {
      id: `v-${Date.now()}`, youtubeId: ytId,
      title: titleInput.trim(),
      thumb: `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`,
    }]);
    resetAdd();
  }

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setErr('');
    try {
      const ext  = file.name.split('.').pop();
      const path = `showcases/films/${Date.now()}-${Math.random().toString(36).slice(2,6)}.${ext}`;
      const { error: upErr } = await supabase.storage.from('showcase-media').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data } = supabase.storage.from('showcase-media').getPublicUrl(path);
      setContent('videos', [...videos, {
        id: `v-${Date.now()}`, directUrl: data.publicUrl,
        title: titleInput.trim() || file.name.replace(/\.[^.]+$/, ''),
        thumb: '',
      }]);
      resetAdd();
    } catch (err2) {
      setErr(err2.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  function handleRemove(idx) { setContent('videos', videos.filter((_, i) => i !== idx)); }

  function handleMove(idx, dir) {
    const next = [...videos]; const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    setContent('videos', next);
  }

  const btnTab = (active) => ({
    fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
    padding: '6px 14px', borderRadius: 3, cursor: 'pointer',
    background: active ? GOLD : 'none',
    color: active ? '#0a0906' : C.grey2,
    border: `1px solid ${active ? GOLD : C.border}`,
  });

  return (
    <div>
      {/* Section label */}
      <div style={{ marginBottom: 16 }}>
        <label style={lbl(C)}>Section Label</label>
        <input value={content.eyebrow || ''} onChange={e => setContent('eyebrow', e.target.value)}
          placeholder="e.g. Wedding Films · Property Tours" style={inp(C)} />
      </div>

      {/* Video list */}
      {videos.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          {videos.map((v, idx) => (
            <div key={v.id || idx} style={{
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '10px 12px', marginBottom: 8,
              background: C.cardBg || `${C.border}20`,
              border: `1px solid ${C.border}`, borderRadius: 6,
            }}>
              {/* Thumbnail / type badge */}
              {v.youtubeId ? (
                <img src={`https://img.youtube.com/vi/${v.youtubeId}/mqdefault.jpg`} alt={v.title}
                  style={{ width: 72, height: 40, objectFit: 'cover', borderRadius: 3, flexShrink: 0 }} />
              ) : (
                <div style={{ width: 72, height: 40, borderRadius: 3, flexShrink: 0, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="1.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                </div>
              )}
              {/* Editable title */}
              <input value={v.title || ''} onChange={e => {
                const n = [...videos]; n[idx] = { ...n[idx], title: e.target.value }; setContent('videos', n);
              }} placeholder="Film title…" style={{ ...inp(C), flex: 1, fontSize: 12 }} />
              {/* Type badge */}
              <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', flexShrink: 0, color: v.youtubeId ? '#f00' : v.vimeoId ? '#1ab7ea' : C.grey2 }}>
                {v.youtubeId ? 'YT' : v.vimeoId ? 'VM' : 'MP4'}
              </span>
              {/* Up/Down */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
                <button onClick={() => handleMove(idx, -1)} disabled={idx === 0}
                  style={{ background: 'none', border: 'none', color: idx === 0 ? C.border : C.grey2, cursor: idx === 0 ? 'default' : 'pointer', fontSize: 10, padding: '1px 4px', lineHeight: 1 }}>▲</button>
                <button onClick={() => handleMove(idx, 1)} disabled={idx === videos.length - 1}
                  style={{ background: 'none', border: 'none', color: idx === videos.length - 1 ? C.border : C.grey2, cursor: idx === videos.length - 1 ? 'default' : 'pointer', fontSize: 10, padding: '1px 4px', lineHeight: 1 }}>▼</button>
              </div>
              <button onClick={() => handleRemove(idx)}
                style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14, flexShrink: 0, padding: '0 2px' }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Add panel */}
      {addMode ? (
        <div style={{ padding: 14, background: `${GOLD}0a`, border: `1px solid ${GOLD}33`, borderRadius: 6 }}>
          {/* Tab switcher */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 14 }}>
            <button style={btnTab(addMode === 'youtube')} onClick={() => setAddMode('youtube')}>▶ YouTube</button>
            <button style={btnTab(addMode === 'vimeo')}   onClick={() => setAddMode('vimeo')}>◈ Vimeo</button>
            <button style={btnTab(addMode === 'upload')}  onClick={() => setAddMode('upload')}>↑ Upload</button>
          </div>

          {addMode === 'youtube' && (
            <>
              <div style={{ marginBottom: 10 }}>
                <label style={lbl(C)}>YouTube URL</label>
                <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setErr(''); }} autoFocus
                  placeholder="https://www.youtube.com/watch?v=..." style={inp(C)} />
                {err && <div style={{ marginTop: 4, fontFamily: NU, fontSize: 10, color: '#f87171' }}>{err}</div>}
              </div>
              {previewId && (
                <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 10 }}>
                  <img src={`https://img.youtube.com/vi/${previewId}/hqdefault.jpg`} alt="preview"
                    style={{ width: 96, height: 54, objectFit: 'cover', borderRadius: 3 }} />
                  <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f00' }}>▶ YouTube ✓</span>
                </div>
              )}
              <div style={{ marginBottom: 12 }}>
                <label style={lbl(C)}>Film Title</label>
                <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
                  placeholder="e.g. Sarah & James — Lake Como Wedding Film" style={inp(C)} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleAddYoutube} style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', background: GOLD, color: '#0a0906', border: 'none', borderRadius: 3, cursor: 'pointer' }}>Add Film</button>
                <button onClick={resetAdd} style={{ fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '7px 14px', cursor: 'pointer' }}>Cancel</button>
              </div>
            </>
          )}

          {addMode === 'vimeo' && (() => {
            const vmId = urlInput.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || null;
            function handleAddVimeo() {
              if (!vmId) { setErr('Paste a valid Vimeo URL'); return; }
              setContent('videos', [...videos, { id: `v-${Date.now()}`, vimeoId: vmId, title: titleInput.trim(), thumb: '' }]);
              resetAdd();
            }
            return (
              <>
                <div style={{ marginBottom: 10 }}>
                  <label style={lbl(C)}>Vimeo URL</label>
                  <input value={urlInput} onChange={e => { setUrlInput(e.target.value); setErr(''); }} autoFocus
                    placeholder="https://vimeo.com/123456789" style={inp(C)} />
                  {err && <div style={{ marginTop: 4, fontFamily: NU, fontSize: 10, color: '#f87171' }}>{err}</div>}
                  {vmId && <div style={{ marginTop: 6, fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#1ab7ea' }}>◈ Vimeo ID {vmId} ✓</div>}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <label style={lbl(C)}>Film Title</label>
                  <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
                    placeholder="e.g. The Ritz London — Estate Film" style={inp(C)} />
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handleAddVimeo} style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', background: GOLD, color: '#0a0906', border: 'none', borderRadius: 3, cursor: 'pointer' }}>Add Film</button>
                  <button onClick={resetAdd} style={{ fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '7px 14px', cursor: 'pointer' }}>Cancel</button>
                </div>
              </>
            );
          })()}

          {addMode === 'upload' && (
            <>
              <div style={{ marginBottom: 12 }}>
                <label style={lbl(C)}>Film Title</label>
                <input value={titleInput} onChange={e => setTitleInput(e.target.value)}
                  placeholder="e.g. Estate Overview Film" style={inp(C)} />
              </div>
              {err && <div style={{ marginBottom: 8, fontFamily: NU, fontSize: 10, color: '#f87171' }}>{err}</div>}
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => fileRef.current?.click()} disabled={uploading}
                  style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', background: uploading ? `${GOLD}66` : GOLD, color: '#0a0906', border: 'none', borderRadius: 3, cursor: uploading ? 'default' : 'pointer' }}>
                  {uploading ? 'Uploading…' : '↑ Choose Video File'}
                </button>
                <button onClick={resetAdd} style={{ fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '7px 14px', cursor: 'pointer' }}>Cancel</button>
              </div>
              <div style={{ marginTop: 6, fontFamily: NU, fontSize: 10, color: C.grey2 }}>Accepts .mp4 · .webm · .mov · .avi · .mkv · .m4v</div>
              <input ref={fileRef} type="file" accept="video/mp4,video/webm,video/quicktime,video/avi,video/x-matroska,video/x-m4v,video/*" onChange={handleUpload} style={{ display: 'none' }} />
            </>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setAddMode('youtube')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: GOLD, background: `${GOLD}10`, border: `1px dashed ${GOLD}55`, borderRadius: 6, padding: '10px 8px', cursor: 'pointer' }}>
            ▶ YouTube
          </button>
          <button onClick={() => setAddMode('vimeo')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#1ab7ea', background: '#1ab7ea10', border: '1px dashed #1ab7ea55', borderRadius: 6, padding: '10px 8px', cursor: 'pointer' }}>
            ◈ Vimeo
          </button>
          <button onClick={() => setAddMode('upload')}
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.grey2, background: 'none', border: `1px dashed ${C.border}`, borderRadius: 6, padding: '10px 8px', cursor: 'pointer' }}>
            ↑ Upload
          </button>
        </div>
      )}

      {videos.length === 0 && !addMode && (
        <p style={{ fontFamily: NU, fontSize: 11, color: C.grey2, textAlign: 'center', marginTop: 12, lineHeight: 1.6 }}>
          No films yet — add a YouTube link or upload a video file.
        </p>
      )}
    </div>
  );
}

function SectionEditor({ section, onChange, C, showcase, sections, onAiFill, aiLoading, aiVenueInfo, onSetAiVenueInfo }) {
  if (!section) return null;

  const reg     = SECTION_REGISTRY[section.type];
  const content = section.content || {};
  const layout  = section.layout  || {};
  const [showAiInput, setShowAiInput] = useState(false);
  const [localVenueInfo, setLocalVenueInfo] = useState('');
  const isLoading = aiLoading === section.id;

  function handleAiFill() {
    // Priority: 1. manually set aiVenueInfo, 2. auto-built from showcase+sections, 3. ask user
    const info = aiVenueInfo || localVenueInfo || buildAutoVenueInfo(showcase, sections);
    if (!info.trim()) { setShowAiInput(true); return; }
    // Store auto-built info so subsequent section fills reuse it
    if (!aiVenueInfo && !localVenueInfo) onSetAiVenueInfo(info);
    onAiFill(section, info);
    setShowAiInput(false);
  }

  const uploadPath = `showcases/${showcase?.slug || showcase?.id || 'new'}/${section.id}`;

  function setContent(key, value) {
    onChange({ ...section, content: { ...content, [key]: value } });
  }
  function setLayout(key, value) {
    onChange({ ...section, layout: { ...layout, [key]: value } });
  }

  const ImgField = ({ label: fieldLabel, fieldKey }) => (
    <ImageUploadField
      label={fieldLabel}
      value={content[fieldKey] || ''}
      onChange={v => setContent(fieldKey, v)}
      C={C}
      uploadPath={uploadPath}
    />
  );

  const Field = ({ label: fieldLabel, fieldKey, type = 'text', rows, placeholder }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl(C)}>{fieldLabel}</label>
      {type === 'textarea' ? (
        <textarea
          value={content[fieldKey] || ''}
          onChange={e => setContent(fieldKey, e.target.value)}
          rows={rows || 4}
          placeholder={placeholder || ''}
          style={{ ...inp(C), resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={content[fieldKey] || ''}
          onChange={e => setContent(fieldKey, e.target.value)}
          placeholder={placeholder || ''}
          style={inp(C)}
        />
      )}
    </div>
  );

  const LayoutSelect = ({ label: fieldLabel, fieldKey, options }) => (
    <div style={{ marginBottom: 14 }}>
      <label style={lbl(C)}>{fieldLabel}</label>
      <select
        value={layout[fieldKey] || options[0]?.value}
        onChange={e => setLayout(fieldKey, e.target.value)}
        style={{ ...inp(C), cursor: 'pointer' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ padding: '20px 24px 80px', overflowY: 'auto', flex: 1 }}>
      {/* Section type badge + AI button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
        <span style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 700 }}>
          {reg?.icon || '◈'} {reg?.label || section.type}
        </span>
        <button
          onClick={handleAiFill}
          disabled={isLoading}
          style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '4px 10px', background: isLoading ? 'rgba(196,160,90,0.15)' : `${GOLD}22`, color: GOLD, border: `1px solid ${GOLD}55`, borderRadius: 3, cursor: isLoading ? 'default' : 'pointer', whiteSpace: 'nowrap' }}>
          {isLoading ? '…' : '✦ Fill with AI'}
        </button>
      </div>
      {/* Inline venue info input — only shown when there's truly no context available */}
      {showAiInput && !aiVenueInfo && !buildAutoVenueInfo(showcase, sections) && (
        <div style={{ marginBottom: 18, padding: 12, background: `${GOLD}0d`, border: `1px solid ${GOLD}44`, borderRadius: 5 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: GOLD, display: 'block', marginBottom: 6 }}>Venue Context for AI</label>
          <textarea
            value={localVenueInfo}
            onChange={e => { setLocalVenueInfo(e.target.value); onSetAiVenueInfo(e.target.value); }}
            onKeyDown={e => e.stopPropagation()}
            placeholder="Paste venue name, location, capacity, key features — the more detail the better…"
            rows={4}
            style={{ ...inp(C), resize: 'vertical', marginBottom: 8, fontSize: 11 }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => { if (localVenueInfo.trim()) { onAiFill(section, localVenueInfo); setShowAiInput(false); } }} style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', padding: '5px 14px', background: GOLD, color: '#0a0906', border: 'none', borderRadius: 3, cursor: 'pointer' }}>Generate</button>
            <button onClick={() => setShowAiInput(false)} style={{ fontFamily: NU, fontSize: 10, color: C.grey, background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '5px 10px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* ── Hero ── */}
      {section.type === 'hero' && (
        <>
          <Field label="Title" fieldKey="title" />
          <Field label="Eyebrow" fieldKey="eyebrow" placeholder="e.g. 150 Piccadilly · Mayfair · London" />
          <Field label="Tagline" fieldKey="tagline" type="textarea" rows={3} />
          <ImgField label="Hero Image (fallback)" fieldKey="image" />
          {/* Hero background video */}
          <HeroVideoField content={content} setContent={setContent} C={C} />
          <div style={{ marginBottom: 14 }}>
            <label style={lbl(C)}>Overlay Opacity</label>
            <input
              type="range" min="0" max="0.9" step="0.05"
              value={content.overlay_opacity ?? 0.45}
              onChange={e => setContent('overlay_opacity', parseFloat(e.target.value))}
              style={{ width: '100%' }}
            />
            <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 4 }}>
              {((content.overlay_opacity ?? 0.45) * 100).toFixed(0)}%
            </div>
          </div>
        </>
      )}

      {/* ── Stats ── */}
      {section.type === 'stats' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <LayoutSelect label="Variant" fieldKey="variant" options={[{ value: 'strip', label: 'Strip' }, { value: 'over-image', label: 'Over Image' }]} />
          <div style={{ marginBottom: 12 }}>
            <label style={lbl(C)}>Stats (max 6)</label>
            {(content.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto', gap: 5, marginBottom: 6 }}>
                <input placeholder="Value" value={item.value || ''} onChange={e => { const n = [...content.items]; n[idx] = {...n[idx], value: e.target.value}; setContent('items', n); }} style={{ ...inp(C), fontSize: 11 }} />
                <input placeholder="Label" value={item.label || ''} onChange={e => { const n = [...content.items]; n[idx] = {...n[idx], label: e.target.value}; setContent('items', n); }} style={{ ...inp(C), fontSize: 11 }} />
                <input placeholder="Sublabel" value={item.sublabel || ''} onChange={e => { const n = [...content.items]; n[idx] = {...n[idx], sublabel: e.target.value}; setContent('items', n); }} style={{ ...inp(C), fontSize: 11 }} />
                <button onClick={() => setContent('items', content.items.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12, padding: '0 4px' }}>✕</button>
              </div>
            ))}
            {(content.items || []).length < 6 && (
              <button onClick={() => setContent('items', [...(content.items || []), { value: '', label: '', sublabel: '' }])} style={{ fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 3, padding: '5px 12px', cursor: 'pointer', marginTop: 4 }}>
                + Add Stat
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Intro ── */}
      {section.type === 'intro' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={6} />
          <LayoutSelect label="Layout" fieldKey="variant" options={[{ value: 'centered', label: 'Centred' }, { value: 'left-aligned', label: 'Left-aligned' }, { value: 'narrow', label: 'Narrow' }]} />
        </>
      )}

      {/* ── Highlight Band ── */}
      {section.type === 'highlight-band' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={4} />
        </>
      )}

      {/* ── Feature ── */}
      {section.type === 'feature' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={4} />
          <ImgField label="Image" fieldKey="image" />
          <LayoutSelect label="Layout" fieldKey="variant" options={[{ value: 'image-left', label: 'Image Left' }, { value: 'image-right', label: 'Image Right' }, { value: 'dark-block', label: 'Dark Block' }, { value: 'centered', label: 'Centred' }]} />
        </>
      )}

      {/* ── Quote ── */}
      {section.type === 'quote' && (
        <>
          <Field label="Quote Text" fieldKey="text" type="textarea" rows={3} />
          <Field label="Attribution" fieldKey="attribution" />
          <Field label="Role / Title" fieldKey="attributionRole" />
          <LayoutSelect label="Variant" fieldKey="variant" options={[{ value: 'centered', label: 'Centred' }, { value: 'with-portrait', label: 'With Portrait' }]} />
          {layout.variant === 'with-portrait' && <ImgField label="Portrait Image" fieldKey="image" />}
        </>
      )}

      {/* ── Mosaic ── */}
      {/* ── Films ── */}
      {section.type === 'films' && (
        <FilmsEditor content={content} setContent={setContent} C={C} />
      )}

      {section.type === 'mosaic' && (
        <>
          <Field label="Title" fieldKey="title" />
          <Field label="Body" fieldKey="body" type="textarea" rows={3} />
          <div style={{ marginBottom: 12 }}>
            <label style={lbl(C)}>Images (2–4)</label>
            {(content.images || []).map((img, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 5, marginBottom: 6 }}>
                <input placeholder={`Image ${idx + 1} URL`} value={img.url || ''} onChange={e => { const n = [...content.images]; n[idx] = {...n[idx], url: e.target.value}; setContent('images', n); }} style={{ ...inp(C), fontSize: 11 }} />
                <input placeholder="Alt" value={img.alt || ''} onChange={e => { const n = [...content.images]; n[idx] = {...n[idx], alt: e.target.value}; setContent('images', n); }} style={{ ...inp(C), fontSize: 11, width: 64 }} />
                <button onClick={() => setContent('images', content.images.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12 }}>✕</button>
              </div>
            ))}
            {(content.images || []).length < 4 && (
              <button onClick={() => setContent('images', [...(content.images || []), { url: '', alt: '' }])} style={{ fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 3, padding: '5px 12px', cursor: 'pointer', marginTop: 4 }}>+ Add Image</button>
            )}
          </div>
        </>
      )}

      {/* ── Bento Grid ── */}
      {section.type === 'bento-grid' && (
        <>
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, lineHeight: 1.7, marginBottom: 12 }}>
            8-cell grid (4 columns × 2 rows). Each cell is either an image or a text panel. On mobile, only the first 4 cells show (2 columns).
          </div>
          {(content.cells || []).map((cell, idx) => {
            const rowLabel = idx < 4 ? `Row 1 · Cell ${idx + 1}` : `Row 2 · Cell ${idx - 3}`;
            return (
              <div key={idx} style={{ marginBottom: 18, padding: '14px', background: C.cardBg || `${C.border}30`, borderRadius: 6, border: `1px solid ${C.border}` }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey2 }}>{rowLabel}</span>
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['image', 'text', 'video'].map(t => (
                      <button key={t}
                        onClick={() => {
                          const next = [...(content.cells || [])];
                          next[idx] = { ...next[idx], type: t };
                          setContent('cells', next);
                        }}
                        style={{ padding: '3px 9px', fontFamily: NU, fontSize: 10, fontWeight: 600,
                          background: cell.type === t ? GOLD : 'transparent',
                          color: cell.type === t ? '#fff' : C.text,
                          border: `1px solid ${cell.type === t ? GOLD : C.border}`,
                          borderRadius: 3, cursor: 'pointer', textTransform: 'capitalize' }}>
                        {t === 'image' ? '🖼' : t === 'video' ? '▶' : 'T'} {t}
                      </button>
                    ))}
                  </div>
                </div>
                {cell.type === 'image' ? (
                  <>
                    <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginBottom: 8 }}>Up to 4 images — fades between them automatically.</div>
                    {Array.from({ length: 4 }).map((_, imgIdx) => {
                      const imgs = cell.images || (cell.url ? [{ url: cell.url, alt: '' }] : []);
                      const img  = imgs[imgIdx] || { url: '', alt: '' };
                      return (
                        <ImageUploadField
                          key={imgIdx}
                          label={`Image ${imgIdx + 1}${imgIdx === 0 ? ' (required)' : ' (optional)'}`}
                          value={img.url || ''}
                          onChange={v => {
                            const next  = [...(content.cells || [])];
                            const newImgs = Array.from({ length: 4 }).map((_, j) => {
                              const existing = (next[idx].images || (next[idx].url ? [{ url: next[idx].url, alt: '' }] : []))[j] || { url: '', alt: '' };
                              return j === imgIdx ? { ...existing, url: v } : existing;
                            }).filter((img, j) => j === 0 || img.url); // keep slot 0 always, remove empty trailing
                            next[idx] = { ...next[idx], images: newImgs, url: undefined };
                            setContent('cells', next);
                          }}
                          C={C}
                          uploadPath={`${uploadPath}/cell-${idx}-img${imgIdx}`}
                        />
                      );
                    })}
                  </>
                ) : cell.type === 'video' ? (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl(C)}>Video URL</label>
                      <input value={cell.videoUrl || ''} onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],videoUrl:e.target.value}; setContent('cells',n); }} placeholder="YouTube, Vimeo, or .mp4 URL" style={inp(C)} />
                      <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 3 }}>Supports youtube.com, youtu.be, vimeo.com, or direct .mp4/.webm</div>
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl(C)}>Title (shown over thumbnail)</label>
                      <input value={cell.title || ''} onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],title:e.target.value}; setContent('cells',n); }} placeholder="Optional overlay title" style={inp(C)} />
                    </div>
                    <ImageUploadField
                      label="Custom Thumbnail (optional — YouTube auto-generates)"
                      value={cell.thumb || ''}
                      onChange={v => { const n=[...(content.cells||[])]; n[idx]={...n[idx],thumb:v}; setContent('cells',n); }}
                      C={C}
                      uploadPath={`${uploadPath}/cell-${idx}`}
                    />
                  </>
                ) : (
                  <>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl(C)}>Eyebrow (optional)</label>
                      <input value={cell.eyebrow || ''} placeholder="e.g. Exclusive Offer" onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],eyebrow:e.target.value}; setContent('cells',n); }} style={inp(C)} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl(C)}>Headline (optional)</label>
                      <input value={cell.headline || ''} placeholder="Large statement line" onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],headline:e.target.value}; setContent('cells',n); }} style={inp(C)} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl(C)}>Title</label>
                      <input value={cell.title || ''} onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],title:e.target.value}; setContent('cells',n); }} style={inp(C)} />
                    </div>
                    <div style={{ marginBottom: 8 }}>
                      <label style={lbl(C)}>Body</label>
                      <textarea value={cell.body || ''} onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],body:e.target.value}; setContent('cells',n); }} rows={3} style={{ ...inp(C), resize: 'vertical' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      <div>
                        <label style={lbl(C)}>CTA Label</label>
                        <input value={cell.cta || ''} placeholder="Discover" onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],cta:e.target.value}; setContent('cells',n); }} style={inp(C)} />
                      </div>
                      <div>
                        <label style={lbl(C)}>CTA URL</label>
                        <input value={cell.ctaUrl || ''} placeholder="/offers" onChange={e => { const n=[...(content.cells||[])]; n[idx]={...n[idx],ctaUrl:e.target.value}; setContent('cells',n); }} style={inp(C)} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      )}

      {/* ── Gallery ── */}
      {section.type === 'gallery' && (
        <GalleryEditor
          content={content}
          setContent={setContent}
          setLayout={setLayout}
          section={section}
          showcase={showcase}
          C={C}
        />
      )}

      {/* ── Dining / Spaces / Wellness / Weddings ── */}
      {['dining', 'spaces', 'wellness', 'weddings'].includes(section.type) && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={4} />
          <ImgField label="Image" fieldKey="image" />
          <LayoutSelect label="Layout" fieldKey="variant" options={[{ value: 'image-left', label: 'Image Left' }, { value: 'image-right', label: 'Image Right' }]} />
        </>
      )}

      {/* ── Pricing ── */}
      {section.type === 'pricing' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={4} />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div>
              <label style={lbl(C)}>Price From</label>
              <input value={content.price_from || ''} onChange={e => setContent('price_from', e.target.value)} placeholder="e.g. £1,500,000" style={inp(C)} />
            </div>
            <div>
              <label style={lbl(C)}>Label</label>
              <input value={content.price_context || ''} onChange={e => setContent('price_context', e.target.value)} placeholder="Venue hire from" style={inp(C)} />
            </div>
            <div>
              <label style={lbl(C)}>Typical Min</label>
              <input value={content.typical_min || ''} onChange={e => setContent('typical_min', e.target.value)} placeholder="e.g. £4,500,000" style={inp(C)} />
            </div>
            <div>
              <label style={lbl(C)}>Typical Max</label>
              <input value={content.typical_max || ''} onChange={e => setContent('typical_max', e.target.value)} placeholder="e.g. £12,000,000" style={inp(C)} />
            </div>
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl(C)}>Includes (one per line)</label>
            <textarea
              value={(content.includes || []).join('\n')}
              onChange={e => setContent('includes', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              rows={5}
              placeholder="Venue hire&#10;White glove service&#10;Personal butler"
              style={{ ...inp(C), resize: 'vertical' }}
            />
          </div>
          <div style={{ marginBottom: 14 }}>
            <label style={lbl(C)}>Excludes (one per line)</label>
            <textarea
              value={(content.excludes || []).join('\n')}
              onChange={e => setContent('excludes', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
              rows={4}
              placeholder="Floral design&#10;Photography&#10;Entertainment"
              style={{ ...inp(C), resize: 'vertical' }}
            />
          </div>
          <Field label="Guidance" fieldKey="guidance" type="textarea" rows={4} placeholder="Editorial closing paragraph on how pricing works..." />
        </>
      )}

      {/* ── Verified (At a Glance) ── */}
      {section.type === 'verified' && (
        <>
          {/* Alignment */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl(C)}>Alignment</label>
            <div style={{ display: 'flex', gap: 6 }}>
              {['left', 'center', 'right'].map(v => (
                <button key={v} onClick={() => setLayout('variant', v)}
                  style={{ flex: 1, padding: '6px 0', fontFamily: NU, fontSize: 11, fontWeight: 600,
                    background: (layout.variant || 'left') === v ? GOLD : 'transparent',
                    color: (layout.variant || 'left') === v ? '#fff' : C.text,
                    border: `1px solid ${(layout.variant || 'left') === v ? GOLD : C.border}`,
                    borderRadius: 4, cursor: 'pointer', textTransform: 'capitalize' }}>
                  {v}
                </button>
              ))}
            </div>
          </div>
          {/* Text colour */}
          <div style={{ marginBottom: 14 }}>
            <label style={lbl(C)}>Text Colour</label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              {['#1a1209','#f5f0e8','#ffffff','#2c1810','#0f0e0c'].map(col => (
                <button key={col} onClick={() => setLayout('textColor', col)}
                  style={{ width: 26, height: 26, borderRadius: 3, background: col,
                    border: layout.textColor === col ? `2px solid ${GOLD}` : `1px solid ${C.border}`,
                    cursor: 'pointer', flexShrink: 0 }} />
              ))}
              <input type="text" value={layout.textColor || ''}
                onChange={e => setLayout('textColor', e.target.value)}
                placeholder="#1a1209"
                style={{ ...inp(C), width: 90, fontSize: 11, padding: '5px 8px' }} />
            </div>
          </div>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div><label style={lbl(C)}>Venue Hire From</label><input value={content.venue_hire_from || ''} onChange={e => setContent('venue_hire_from', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Typical Min</label><input value={content.typical_spend_min || ''} onChange={e => setContent('typical_spend_min', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Typical Max</label><input value={content.typical_spend_max || ''} onChange={e => setContent('typical_spend_max', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Ceremony Capacity</label><input value={content.ceremony_capacity || ''} onChange={e => setContent('ceremony_capacity', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Dining Capacity</label><input value={content.dining_capacity || ''} onChange={e => setContent('dining_capacity', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Reception Capacity</label><input value={content.reception_capacity || ''} onChange={e => setContent('reception_capacity', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Bedrooms</label><input value={content.bedrooms || ''} onChange={e => setContent('bedrooms', e.target.value)} style={inp(C)} /></div>
            <div><label style={lbl(C)}>Outdoor Ceremony</label><input value={content.outdoor_ceremony || ''} placeholder="Yes / No / Seasonal" onChange={e => setContent('outdoor_ceremony', e.target.value)} style={inp(C)} /></div>
          </div>
          <Field label="Exclusive Use" fieldKey="exclusive_use" />
          <Field label="Catering" fieldKey="catering" />
          <Field label="Accommodation" fieldKey="accommodation" />
          <Field label="Location Summary" fieldKey="location_summary" />
          <Field label="Style" fieldKey="style" />
          <Field label="Best For" fieldKey="best_for" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
            <div><label style={lbl(C)}>Verified Date</label><input value={content.verified_date || ''} placeholder="e.g. March 2026" onChange={e => setContent('verified_date', e.target.value)} style={inp(C)} /></div>
          </div>
          <Field label="Verification Notes" fieldKey="verification_notes" type="textarea" rows={3} />
        </>
      )}

      {/* ── Image Full ── */}
      {section.type === 'image-full' && (
        <>
          <ImgField label="Image" fieldKey="url" />
          <Field label="Alt Text" fieldKey="alt" />
          <Field label="Caption" fieldKey="caption" />
          <div style={{ marginBottom: 14 }}>
            <label style={lbl(C)}>Height</label>
            <select value={content.height || '60vh'} onChange={e => setContent('height', e.target.value)} style={{ ...inp(C), cursor: 'pointer' }}>
              {['40vh','50vh','60vh','70vh','80vh','90vh'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </>
      )}

      {/* ── CTA ── */}
      {section.type === 'cta' && (
        <>
          <Field label="Headline" fieldKey="headline" />
          <Field label="Subline" fieldKey="subline" />
          <ImgField label="Background Image" fieldKey="background" />
          <Field label="Venue Name Override" fieldKey="venueName" />
        </>
      )}

      {/* ── Map ── */}
      {section.type === 'map' && (
        <>
          <Field label="Section Heading" fieldKey="headline" placeholder="Find Us" />
          {/* Auto-geocode from venue name + location — no manual address needed */}
          <NearbyMapField content={content} setContent={setContent} C={C} showcase={showcase} />
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, lineHeight: 1.7, marginBottom: 12 }}>
            Map position is set automatically from the venue name and location. Use the fields below only for fine-tuning.
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px', gap: 8, marginBottom: 14 }}>
            <div>
              <label style={lbl(C)}>Latitude override</label>
              <input type="text" value={content.lat || ''} onChange={e => setContent('lat', e.target.value)} placeholder="auto" style={inp(C)} />
            </div>
            <div>
              <label style={lbl(C)}>Longitude override</label>
              <input type="text" value={content.lng || ''} onChange={e => setContent('lng', e.target.value)} placeholder="auto" style={inp(C)} />
            </div>
            <div>
              <label style={lbl(C)}>Zoom</label>
              <input type="number" min="8" max="18" value={content.zoom || 14} onChange={e => setContent('zoom', parseInt(e.target.value))} style={inp(C)} />
            </div>
          </div>
        </>
      )}

      {/* ── Related ── */}
      {section.type === 'related' && (
        <>
          <Field label="Section Title" fieldKey="title" />
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, lineHeight: 1.7, marginBottom: 8 }}>
            Related venues are linked by listing ID. Enter comma-separated listing IDs below (max 3).
          </div>
          <input
            type="text"
            value={(content.items || []).join(', ')}
            onChange={e => setContent('items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
            placeholder="listing-id-1, listing-id-2"
            style={inp(C)}
          />
        </>
      )}

      {/* ── Nearby ── */}
      {section.type === 'nearby' && (
        <>
          <Field label="Headline" fieldKey="headline" placeholder="Ideally Located" />
          <Field label="Eyebrow" fieldKey="eyebrow" placeholder="Location" />
          <Field label="Intro Text" fieldKey="body" type="textarea" rows={3} />
          {/* Address + auto-geocode */}
          <NearbyMapField content={content} setContent={setContent} C={C} showcase={showcase} />
          <div style={{ marginBottom: 12 }}>
            <label style={lbl(C)}>Nearby Points (max 6)</label>
            {(content.items || []).map((item, idx) => (
              <div key={idx} style={{ marginBottom: 10, padding: 10, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
                  <input placeholder="Label (e.g. Train Station)" value={item.label || ''} onChange={e => { const n=[...(content.items||[])]; n[idx]={...n[idx],label:e.target.value}; setContent('items',n); }} style={{ ...inp(C), fontSize: 11 }} />
                  <input placeholder="Distance (e.g. 7 min walk)" value={item.distance || ''} onChange={e => { const n=[...(content.items||[])]; n[idx]={...n[idx],distance:e.target.value}; setContent('items',n); }} style={{ ...inp(C), fontSize: 11 }} />
                  <button onClick={() => setContent('items', (content.items||[]).filter((_,i)=>i!==idx))} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:13, padding:'0 4px' }}>✕</button>
                </div>
                <div>
                  <label style={lbl(C)}>Icon</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                    {['train','water','city','airport','beach','park','restaurant','shopping','museum','golf','spa','castle','marina','forest'].map(ic => (
                      <button key={ic} onClick={() => { const n=[...(content.items||[])]; n[idx]={...n[idx],icon:ic}; setContent('items',n); }}
                        style={{ padding:'3px 8px', fontFamily:NU, fontSize:10, background: item.icon===ic ? GOLD : 'transparent', color: item.icon===ic ? '#fff' : C.text, border:`1px solid ${item.icon===ic ? GOLD : C.border}`, borderRadius:3, cursor:'pointer', textTransform:'capitalize' }}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {(content.items||[]).length < 6 && (
              <button onClick={() => setContent('items', [...(content.items||[]), { icon:'city', label:'', distance:'' }])}
                style={{ fontFamily:NU, fontSize:11, color:GOLD, background:'none', border:`1px dashed ${GOLD}`, borderRadius:4, padding:'6px 12px', cursor:'pointer', width:'100%' }}>
                + Add Nearby Point
              </button>
            )}
          </div>
        </>
      )}

      {/* ── Rooms ── */}
      {section.type === 'rooms' && (
        <>
          <Field label="Section Eyebrow" fieldKey="eyebrow" placeholder="Accommodation" />
          <Field label="Section Headline" fieldKey="headline" placeholder="Our Rooms & Suites" />
          <Field label="Section Paragraph" fieldKey="paragraph" type="textarea" rows={3} placeholder="A short introduction to the accommodation offering..." />
          <div style={{ marginTop: 8 }}>
            {(content.rooms || []).map((room, rIdx) => (
              <div key={rIdx} style={{ marginBottom: 16, padding: '14px', background: C.cardBg || `${C.border}30`, border: `1px solid ${C.border}`, borderRadius: 6 }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom: 10 }}>
                  <span style={{ fontFamily:NU, fontSize:10, fontWeight:700, letterSpacing:'0.1em', textTransform:'uppercase', color:C.grey2 }}>Room {rIdx + 1}{room.name ? ` — ${room.name}` : ''}</span>
                  <button onClick={() => setContent('rooms', (content.rooms||[]).filter((_,i)=>i!==rIdx))} style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:12 }}>Remove</button>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                  <div><label style={lbl(C)}>Room Name</label><input value={room.name||''} onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],name:e.target.value};setContent('rooms',n);}} style={inp(C)} /></div>
                  <div><label style={lbl(C)}>Tagline</label><input value={room.tagline||''} placeholder="Short uppercase subtitle" onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],tagline:e.target.value};setContent('rooms',n);}} style={inp(C)} /></div>
                  <div><label style={lbl(C)}>Capacity (people)</label><input type="number" min="1" max="20" value={room.capacity||''} onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],capacity:e.target.value};setContent('rooms',n);}} style={inp(C)} /></div>
                  <div><label style={lbl(C)}>Size (m²)</label><input value={room.size||''} placeholder="e.g. 53" onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],size:e.target.value};setContent('rooms',n);}} style={inp(C)} /></div>
                </div>
                <div style={{ marginBottom:8 }}><label style={lbl(C)}>Description</label><textarea value={room.body||''} onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],body:e.target.value};setContent('rooms',n);}} rows={3} style={{...inp(C),resize:'vertical'}} /></div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:6, marginBottom:8 }}>
                  <div><label style={lbl(C)}>CTA Label</label><input value={room.ctaLabel||''} placeholder="To Book" onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],ctaLabel:e.target.value};setContent('rooms',n);}} style={inp(C)} /></div>
                  <div><label style={lbl(C)}>CTA URL</label><input value={room.ctaUrl||''} placeholder="/book" onChange={e=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],ctaUrl:e.target.value};setContent('rooms',n);}} style={inp(C)} /></div>
                </div>
                {/* Images */}
                <div style={{ marginBottom:8 }}>
                  <label style={lbl(C)}>Images (up to 4 — auto-fade)</label>
                  {(room.images||[]).map((img, imgIdx) => (
                    <div key={imgIdx} style={{ display:'flex', gap:5, alignItems:'flex-start', marginBottom:6 }}>
                      <div style={{ flex:1 }}>
                        <ImageUploadField
                          label={`Image ${imgIdx + 1}`}
                          value={img.url || ''}
                          onChange={v => {
                            const n=[...(content.rooms||[])];
                            const imgs=[...(n[rIdx].images||[])];
                            imgs[imgIdx]={...imgs[imgIdx],url:v};
                            n[rIdx]={...n[rIdx],images:imgs};
                            setContent('rooms',n);
                          }}
                          C={C}
                          uploadPath={`${uploadPath}/room${rIdx}-img${imgIdx}`}
                        />
                      </div>
                      <button
                        onClick={() => {
                          const n=[...(content.rooms||[])];
                          n[rIdx]={...n[rIdx],images:(n[rIdx].images||[]).filter((_,j)=>j!==imgIdx)};
                          setContent('rooms',n);
                        }}
                        style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:13, padding:'4px 2px', marginTop:20, flexShrink:0 }}>✕</button>
                    </div>
                  ))}
                  {(room.images||[]).length < 4 && (
                    <button
                      onClick={() => {
                        const n=[...(content.rooms||[])];
                        n[rIdx]={...n[rIdx],images:[...(n[rIdx].images||[]),{url:'',alt:''}]};
                        setContent('rooms',n);
                      }}
                      style={{ fontFamily:NU, fontSize:10, color:GOLD, background:'none', border:`1px dashed ${GOLD}`, borderRadius:3, padding:'4px 10px', cursor:'pointer', marginBottom:8 }}>
                      + Add Image
                    </button>
                  )}
                </div>
                {/* Video — YouTube only */}
                <div style={{ marginBottom: 8 }}>
                  <label style={lbl(C)}>YouTube Video (optional)</label>
                  <input
                    type="text"
                    value={room.videoUrl || ''}
                    onChange={e => { const n=[...(content.rooms||[])]; n[rIdx]={...n[rIdx],videoUrl:e.target.value}; setContent('rooms',n); }}
                    placeholder="https://www.youtube.com/watch?v=..."
                    style={inp(C)}
                  />
                  {(() => {
                    const ytId = room.videoUrl ? getYtId(room.videoUrl) : null;
                    if (!ytId) return null;
                    return (
                      <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <img src={`https://img.youtube.com/vi/${ytId}/mqdefault.jpg`} alt="thumbnail"
                          style={{ height: 52, width: 92, objectFit: 'cover', borderRadius: 3 }} />
                        <div>
                          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#f00', marginBottom: 4 }}>▶ YouTube ✓</div>
                          <button onClick={() => { const n=[...(content.rooms||[])]; n[rIdx]={...n[rIdx],videoUrl:''}; setContent('rooms',n); }}
                            style={{ background:'none', border:'none', color:'#f87171', cursor:'pointer', fontSize:10, padding:0, fontFamily:NU }}>Remove</button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* Amenities */}
                <div>
                  <label style={lbl(C)}>Amenities</label>
                  {(room.amenities||[]).map((am, amIdx) => (
                    <div key={amIdx} style={{ display:'grid', gridTemplateColumns:'120px 1fr auto', gap:5, marginBottom:5, alignItems:'center' }}>
                      <select value={am.icon||'bed'} onChange={e=>{const n=[...(content.rooms||[])];const ams=[...(n[rIdx].amenities||[])];ams[amIdx]={...ams[amIdx],icon:e.target.value};n[rIdx]={...n[rIdx],amenities:ams};setContent('rooms',n);}} style={{...inp(C),fontSize:11}}>
                        {['bed','bath','shower','sofa','desk','table','tv','wardrobe','safe','ac','balcony','kitchen','minibar','coffee'].map(ic=>(
                          <option key={ic} value={ic}>{ic}</option>
                        ))}
                      </select>
                      <input placeholder="Label (e.g. Bathtub)" value={am.label||''} onChange={e=>{const n=[...(content.rooms||[])];const ams=[...(n[rIdx].amenities||[])];ams[amIdx]={...ams[amIdx],label:e.target.value};n[rIdx]={...n[rIdx],amenities:ams};setContent('rooms',n);}} style={{...inp(C),fontSize:11}} />
                      <button onClick={()=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],amenities:(n[rIdx].amenities||[]).filter((_,i)=>i!==amIdx)};setContent('rooms',n);}} style={{background:'none',border:'none',color:'#f87171',cursor:'pointer',fontSize:12,padding:'0 4px'}}>✕</button>
                    </div>
                  ))}
                  <button onClick={()=>{const n=[...(content.rooms||[])];n[rIdx]={...n[rIdx],amenities:[...(n[rIdx].amenities||[]),{icon:'bed',label:''}]};setContent('rooms',n);}}
                    style={{fontFamily:NU,fontSize:10,color:GOLD,background:'none',border:`1px dashed ${GOLD}`,borderRadius:3,padding:'4px 10px',cursor:'pointer',marginTop:2}}>
                    + Add Amenity
                  </button>
                </div>
              </div>
            ))}
            <button onClick={() => setContent('rooms', [...(content.rooms||[]), { name:'', tagline:'', capacity:2, size:'', body:'', amenities:[{icon:'bed',label:''}], images:[], videoUrl:'', ctaLabel:'To Book', ctaUrl:'' }])}
              style={{ fontFamily:NU, fontSize:11, color:GOLD, background:'none', border:`1px dashed ${GOLD}`, borderRadius:4, padding:'8px 14px', cursor:'pointer', width:'100%' }}>
              + Add Room
            </button>
          </div>
        </>
      )}

      {/* ── Layout: accent background + text colour ── */}
      {['intro','feature','quote','stats','highlight-band','dining','spaces','wellness','weddings','pricing','verified','bento-grid','nearby','rooms','films','map','mosaic','gallery'].includes(section.type) && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          {/* Panel background */}
          <label style={lbl(C)}>Panel Background</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center', marginBottom: 14 }}>
            {['#0f0e0c','#1a1209','#131c14','#0d1a1f','#1a1616','#faf9f6','#FDFBF7','#ffffff'].map(col => (
              <button
                key={col}
                onClick={() => setLayout('accentBg', col)}
                style={{
                  width: 26, height: 26, borderRadius: 3,
                  background: col,
                  border: layout.accentBg === col ? `2px solid ${GOLD}` : `1px solid ${C.border}`,
                  cursor: 'pointer', flexShrink: 0,
                }}
              />
            ))}
            <button
              onClick={() => setLayout('accentBg', '')}
              title="Reset to theme default"
              style={{ width: 26, height: 26, borderRadius: 3, background: 'transparent', border: `1px dashed ${C.border}`, cursor: 'pointer', flexShrink: 0, fontSize: 12, color: C.grey2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
            <input
              type="text"
              value={layout.accentBg || ''}
              onChange={e => setLayout('accentBg', e.target.value)}
              placeholder="#1a1209"
              style={{ ...inp(C), width: 90, fontSize: 11, padding: '5px 8px' }}
            />
          </div>
          {/* Text colour */}
          <label style={lbl(C)}>Text Colour</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['#f5f0e8','#ffffff','#C9A84C','#1a1209','#1a1a1a','#555555'].map(col => (
              <button key={col} onClick={() => setLayout('textColor', col)}
                style={{ width: 26, height: 26, borderRadius: 3, background: col,
                  border: layout.textColor === col ? `2px solid ${GOLD}` : `1px solid ${C.border}`,
                  cursor: 'pointer', flexShrink: 0 }} />
            ))}
            <button
              onClick={() => setLayout('textColor', '')}
              title="Reset to theme default"
              style={{ width: 26, height: 26, borderRadius: 3, background: 'transparent', border: `1px dashed ${C.border}`, cursor: 'pointer', flexShrink: 0, fontSize: 12, color: C.grey2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>↺</button>
            <input type="text" value={layout.textColor || ''}
              onChange={e => setLayout('textColor', e.target.value)}
              placeholder="#f5f0e8"
              style={{ ...inp(C), width: 90, fontSize: 11, padding: '5px 8px' }} />
          </div>
        </div>
      )}

      {/* ── Layout: text alignment ── */}
      {['highlight-band','stats','pricing','mosaic','intro','dining','spaces','wellness','weddings'].includes(section.type) && (
        <div style={{ marginTop: 12 }}>
          <label style={lbl(C)}>Alignment</label>
          <div style={{ display: 'flex', gap: 6 }}>
            {['left', 'center', 'right'].map(v => (
              <button key={v} onClick={() => setLayout('align', v)}
                style={{ flex: 1, padding: '6px 0', fontFamily: NU, fontSize: 11, fontWeight: 600,
                  background: (layout.align || 'left') === v ? GOLD : 'transparent',
                  color: (layout.align || 'left') === v ? '#fff' : C.text,
                  border: `1px solid ${(layout.align || 'left') === v ? GOLD : C.border}`,
                  borderRadius: 4, cursor: 'pointer', textTransform: 'capitalize' }}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShowcaseMeta — right panel when no section selected
// ─────────────────────────────────────────────────────────────────────────────
function ShowcaseMeta({ showcase, onChange, C, sections, setSections }) {
  function set(key, value) {
    onChange({ ...showcase, [key]: value });
    // Auto-create a hero section if hero_image_url is set and no hero section exists
    if (key === 'hero_image_url' && value && sections && setSections) {
      const hasHeroSection = sections.some(s => s.type === 'hero');
      if (!hasHeroSection) {
        const newHeroSection = createSection('hero');
        newHeroSection.content.title = showcase?.title || 'Untitled';
        newHeroSection.content.image = value;
        setSections([newHeroSection, ...sections]);
      }
    }
  }
  return (
    <div style={{ padding: '24px 24px 80px', overflowY: 'auto', flex: 1 }}>
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 20 }}>
        Showcase Settings
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl(C)}>Venue Name</label>
        <input
          value={showcase?.title || ''}
          onChange={e => set('title', e.target.value)}
          placeholder="e.g. The Ritz London"
          style={{ ...inp(C), fontFamily: GD, fontSize: 16, fontWeight: 400 }}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl(C)}>Slug</label>
        <input
          value={showcase?.slug || ''}
          onChange={e => set('slug', e.target.value.toLowerCase())}
          placeholder="the-ritz-london"
          style={inp(C)}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl(C)}>Location</label>
        <input
          value={showcase?.location || ''}
          onChange={e => set('location', e.target.value)}
          placeholder="150 Piccadilly · Mayfair · London"
          style={inp(C)}
        />
      </div>
      <div style={{ marginBottom: 14 }}>
        <label style={lbl(C)}>Excerpt</label>
        <textarea
          value={showcase?.excerpt || ''}
          onChange={e => set('excerpt', e.target.value)}
          rows={3}
          placeholder="Short editorial description for cards and SEO..."
          style={{ ...inp(C), resize: 'vertical' }}
        />
      </div>
      <ImageUploadField
        label="Hero Image"
        value={showcase?.hero_image_url || ''}
        onChange={v => set('hero_image_url', v)}
        C={C}
        uploadPath={`showcases/${showcase?.slug || showcase?.id || 'new'}/hero`}
      />

      {/* ── Live URL ── */}
      {showcase?.slug && (
        <div style={{ marginTop: 14, padding: '10px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
          <label style={{ ...lbl(C), marginBottom: 4 }}>Live URL</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontFamily: NU, fontSize: 12, color: C.grey, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              /showcase/{showcase.slug}
            </span>
            <button
              onClick={() => window.open(`/showcase/${showcase.slug}`, '_blank')}
              style={{ background: 'none', border: `1px solid ${C.border}`, borderRadius: 3, padding: '3px 10px', fontFamily: NU, fontSize: 10, color: GOLD, cursor: 'pointer', flexShrink: 0 }}
            >
              Open ↗
            </button>
          </div>
        </div>
      )}

      {/* ── SEO ── */}
      <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
        <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
          SEO
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl(C)}>SEO Title</label>
          <input
            value={showcase?.seo_title || ''}
            onChange={e => set('seo_title', e.target.value)}
            placeholder={showcase?.title ? `${showcase.title} | Luxury Wedding Directory` : 'Page title for search engines'}
            style={inp(C)}
          />
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 3 }}>
            {(showcase?.seo_title || '').length}/60 characters
          </div>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label style={lbl(C)}>SEO Description</label>
          <textarea
            value={showcase?.seo_description || ''}
            onChange={e => set('seo_description', e.target.value)}
            rows={3}
            placeholder="Meta description shown in search results (150-160 chars ideal)"
            style={{ ...inp(C), resize: 'vertical' }}
          />
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginTop: 3 }}>
            {(showcase?.seo_description || '').length}/160 characters
          </div>
        </div>
        <ImageUploadField
          label="OG Image (Social Share)"
          value={showcase?.og_image || ''}
          onChange={v => set('og_image', v)}
          C={C}
          uploadPath={`showcases/${showcase?.slug || showcase?.id || 'new'}/og`}
        />
      </div>

      <div style={{ marginTop: 8, padding: '12px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, lineHeight: 1.7 }}>
          Click any section in the canvas to edit its content. Drag sections in the left rail to reorder them.
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SaveAsTemplateModal — collect name + emoji, then save
// ─────────────────────────────────────────────────────────────────────────────
const TEMPLATE_ICONS = ['🏛','🏰','🏝','🌿','✨','🌸','🍾','🕊','💎','🏡','🎪','⛵','🌅','🔑','🌾'];

function SaveAsTemplateModal({ showcase, sections, existingTemplates = [], onSaved, onClose, C }) {
  const [label,            setLabel]            = useState('');
  const [icon,             setIcon]             = useState('◈');
  const [saving,           setSaving]           = useState(false);
  const [error,            setError]            = useState(null);
  const [confirmOverwrite, setConfirmOverwrite] = useState(null); // {id, label} of existing match
  const labelRef = useRef(null);
  useEffect(() => { setTimeout(() => labelRef.current?.focus(), 50); }, []);

  function findExisting(name) {
    return existingTemplates.find(t => t.label.trim().toLowerCase() === name.trim().toLowerCase());
  }

  async function doSave(overwriteId = null) {
    setSaving(true);
    setError(null);
    try {
      if (overwriteId) {
        // Update existing template in-place
        await saveShowcaseDraft(overwriteId, { sections, template_key: icon, title: label.trim() });
      } else {
        await saveShowcaseAsTemplate(showcase, sections, { label: label.trim(), icon });
      }
      onSaved();
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
      setConfirmOverwrite(null);
    }
  }

  function handleSave() {
    if (!label.trim()) { setError('Please enter a template name.'); return; }
    const dupe = findExisting(label);
    if (dupe) { setConfirmOverwrite(dupe); return; }
    doSave();
  }

  return (
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div onClick={e => e.stopPropagation()} onKeyDown={e => e.stopPropagation()} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '32px 28px', maxWidth: 440, width: '100%' }}>
        <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: C.off, marginBottom: 6 }}>Save as Template</div>
        <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6, marginBottom: 24 }}>
          The current section layout will be saved as a reusable template. Content is included as editable starting copy.
        </div>

        {/* Template name */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey2, display: 'block', marginBottom: 5 }}>Template Name</label>
          <input
            ref={labelRef}
            value={label}
            onChange={e => setLabel(e.target.value)}
            onKeyDown={e => e.stopPropagation()}
            placeholder="e.g. Grand City Hotel"
            style={{ ...inp(C), fontSize: 14 }}
          />
        </div>

        {/* Icon picker */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey2, display: 'block', marginBottom: 8 }}>Icon</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {TEMPLATE_ICONS.map(em => (
              <button key={em} onClick={() => setIcon(em)}
                style={{ width: 34, height: 34, fontSize: 18, border: `1px solid ${icon === em ? GOLD : C.border}`, borderRadius: 5, background: icon === em ? `${GOLD}18` : C.bg, cursor: 'pointer' }}>
                {em}
              </button>
            ))}
            <input value={icon} onChange={e => setIcon(e.target.value)} placeholder="◈"
              style={{ ...inp(C), width: 48, fontSize: 16, textAlign: 'center' }} />
          </div>
        </div>

        {error && <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginBottom: 12 }}>{error}</div>}

        {/* Overwrite confirmation banner */}
        {confirmOverwrite && (
          <div style={{ background: '#7c2d12', border: '1px solid #f87171', borderRadius: 6, padding: '12px 14px', marginBottom: 14 }}>
            <div style={{ fontFamily: NU, fontSize: 12, color: '#fca5a5', fontWeight: 700, marginBottom: 6 }}>
              ⚠ A template named "{confirmOverwrite.label}" already exists.
            </div>
            <div style={{ fontFamily: NU, fontSize: 11, color: '#fca5a5', marginBottom: 10, lineHeight: 1.5 }}>
              Overwriting will replace its sections with the current layout. This cannot be undone.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => setConfirmOverwrite(null)} style={{ padding: '6px 12px', background: 'none', border: '1px solid #f8717166', borderRadius: 3, color: '#fca5a5', fontFamily: NU, fontSize: 11, cursor: 'pointer' }}>Cancel</button>
              <button onClick={() => doSave(confirmOverwrite.id)} disabled={saving}
                style={{ padding: '6px 14px', background: '#dc2626', border: 'none', borderRadius: 3, color: '#fff', fontFamily: NU, fontSize: 11, fontWeight: 700, cursor: saving ? 'default' : 'pointer' }}>
                {saving ? 'Overwriting…' : 'Yes, Overwrite'}
              </button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: `1px solid ${C.border}`, borderRadius: 4, cursor: 'pointer', fontFamily: NU, fontSize: 12, background: 'none', color: C.text }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !!confirmOverwrite}
            style={{ padding: '8px 20px', background: (saving || confirmOverwrite) ? `${GOLD}66` : GOLD, border: 'none', borderRadius: 4, cursor: (saving || confirmOverwrite) ? 'default' : 'pointer', fontFamily: NU, fontSize: 12, fontWeight: 700, color: '#1a1209' }}>
            {saving ? 'Saving…' : '⊟ Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TemplatePicker — modal to choose a template or start blank
// ─────────────────────────────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onSelectDb, onBlank, C, dbTemplates = [] }) {
  return (
    <div
      onClick={onBlank}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '36px 32px', maxWidth: 960, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
      >
        <div style={{ fontFamily: GD, fontSize: 22, color: C.off, fontWeight: 400, marginBottom: 8 }}>
          Start with a template
        </div>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, marginBottom: 24, lineHeight: 1.7 }}>
          Choose a master template to start fully populated — ready to customise.
        </p>

        {/* DB templates (Ritz etc.) */}
        {dbTemplates.length > 0 && (
          <>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 12 }}>
              Master Templates
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {dbTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => onSelectDb(tmpl)}
                  style={{
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: '14px 12px', textAlign: 'left', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{tmpl.icon || '◈'}</div>
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginBottom: 3, lineHeight: 1.3 }}>{tmpl.label}</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                    {tmpl.sections.length} sections
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Static registry templates */}
        {Object.values(SHOWCASE_TEMPLATES).length > 0 && (
          <>
            <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.grey2, fontWeight: 700, marginBottom: 12 }}>
              Structural Templates
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 20 }}>
              {Object.values(SHOWCASE_TEMPLATES).map(tmpl => (
                <button key={tmpl.key} onClick={() => onSelect(tmpl.key)} style={{
                  background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                  padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  <div style={{ fontSize: 20, marginBottom: 6 }}>{tmpl.icon}</div>
                  <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: C.off, marginBottom: 3 }}>{tmpl.label}</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, lineHeight: 1.5 }}>{tmpl.description}</div>
                </button>
              ))}
            </div>
          </>
        )}

        <button onClick={onBlank} style={{
          width: '100%', padding: '11px', background: 'none',
          border: `1px solid ${C.border}`, borderRadius: 4,
          fontFamily: NU, fontSize: 12, color: C.grey, cursor: 'pointer',
        }}>
          Start with blank canvas →
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SectionPicker — modal to add a new section type
// ─────────────────────────────────────────────────────────────────────────────
function SectionPicker({ onAdd, onClose, C }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 300,
        background: 'rgba(0,0,0,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '28px 28px', maxWidth: 520, width: '100%', maxHeight: '78vh', overflowY: 'auto' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: GD, fontSize: 20, color: C.off, fontWeight: 400 }}>Add Section</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.grey, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          {SECTION_TYPE_ORDER.map(type => {
            const reg = SECTION_REGISTRY[type];
            if (!reg) return null;
            return (
              <button key={type} onClick={() => { onAdd(type); onClose(); }} style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '11px 13px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 9,
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <span style={{ fontSize: 14, color: GOLD, flexShrink: 0 }}>{reg.icon}</span>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{reg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────────────────────
// MagicAiPanel — full-page AI input modal
// ─────────────────────────────────────────────────────────────────────────────
function MagicAiPanel({ onGenerate, onClose, C, initialVenueInfo = '', onVenueInfoChange }) {
  const [venueInfo, setVenueInfo] = useState(initialVenueInfo);
  const [mode,      setMode]      = useState('template');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

  function handleVenueInfoChange(v) {
    setVenueInfo(v);
    onVenueInfoChange?.(v);
  }

  async function handleGenerate() {
    if (!venueInfo.trim()) { setError('Please paste venue information above.'); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await generateShowcaseWithAi({ venueInfo, mode });
      onGenerate(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const modeBtn = (key, label, desc) => (
    <button
      onClick={() => setMode(key)}
      style={{
        flex: 1, padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
        background: mode === key ? `${GOLD}18` : C.bg,
        border: `1px solid ${mode === key ? GOLD : C.border}`,
        borderRadius: 5,
      }}
    >
      <div style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: mode === key ? GOLD : C.off, marginBottom: 4 }}>{label}</div>
      <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, lineHeight: 1.5 }}>{desc}</div>
    </button>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.92)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '36px 32px', maxWidth: 680, width: '100%', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: GD, fontSize: 24, fontWeight: 400, color: C.off, marginBottom: 4 }}>✦ Magic AI</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: C.grey, lineHeight: 1.6 }}>
              Paste any venue information — website copy, brochure text, notes, or a description.<br />
              AI will generate a complete, fully populated showcase.
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.grey2, fontSize: 20, cursor: 'pointer', padding: 0, marginLeft: 16, flexShrink: 0 }}>✕</button>
        </div>

        {/* Mode selector */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontFamily: NU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.grey2, fontWeight: 700, marginBottom: 10 }}>
            Generation Mode
          </label>
          <div style={{ display: 'flex', gap: 10 }}>
            {modeBtn('template', '◈ Template Mode', 'Clone The Ritz London structure. Best for luxury hotels and wedding venues.')}
            {modeBtn('bespoke', '✦ Bespoke Mode', 'Generate a custom structure tailored to this specific venue type.')}
          </div>
        </div>

        {/* Venue info input */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontFamily: NU, fontSize: 9, letterSpacing: '0.14em', textTransform: 'uppercase', color: C.grey2, fontWeight: 700, marginBottom: 8 }}>
            Venue Information
          </label>
          <textarea
            value={venueInfo}
            onChange={e => { handleVenueInfoChange(e.target.value); setError(null); }}
            rows={14}
            placeholder={`Paste anything here — website copy, brochure text, notes, or a description. For example:

The Savoy, London
Strand, London WC2R 0EZ

One of the world's most iconic hotels, The Savoy has been welcoming guests since 1889. With 267 rooms and suites, the hotel sits on the Victoria Embankment overlooking the Thames. The American Bar, Gordon Ramsay's Savoy Grill (1 Michelin star), and the stunning Thames Foyer are among its celebrated spaces.

Weddings: up to 300 guests. Venue hire from £250,000. Exclusive use available.
Capacity: 300 reception / 220 dining / 150 ceremony
Rooms: 267`}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: C.bg, border: `1px solid ${error ? '#f87171' : C.border}`,
              borderRadius: 5, padding: '14px 16px',
              fontFamily: NU, fontSize: 13, color: C.off,
              resize: 'vertical', outline: 'none', lineHeight: 1.7,
            }}
          />
        </div>

        {/* Error */}
        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: '#f8717118', border: '1px solid #f87171', borderRadius: 4, fontFamily: NU, fontSize: 12, color: '#f87171' }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '10px 20px', background: 'none', color: C.off, border: `1px solid ${C.border}`, borderRadius: 3, cursor: 'pointer' }}>
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={loading || !venueInfo.trim()}
            style={{
              fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
              padding: '10px 28px',
              background: loading || !venueInfo.trim() ? `${GOLD}55` : GOLD,
              color: '#0a0906', border: 'none', borderRadius: 3,
              cursor: loading || !venueInfo.trim() ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
            }}
          >
            {loading ? (
              <>
                <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #0a090644', borderTopColor: '#0a0906', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                Generating…
              </>
            ) : '✦ Generate Showcase'}
          </button>
        </div>

        {loading && (
          <div style={{ marginTop: 16, fontFamily: NU, fontSize: 11, color: C.grey2, textAlign: 'center', lineHeight: 1.7 }}>
            AI is generating your showcase sections.<br />This usually takes 10–20 seconds.
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main ShowcaseStudioModule
// ─────────────────────────────────────────────────────────────────────────────
export default function ShowcaseStudioModule({ C, showcaseId, onBack, onSaveComplete, onListRefresh }) {
  const [viewMode,     setViewMode]     = useState('split');   // split | editor | preview
  const [showcase,     setShowcase]     = useState(null);
  const [sections,     setSections]     = useState([]);
  const [selectedId,   setSelectedId]   = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [publishing,   setPublishing]   = useState(false);
  const [dirty,        setDirty]        = useState(false);
  const [showPicker,   setShowPicker]   = useState(false);
  const [showTemplate, setShowTemplate] = useState(false);
  const [toast,        setToast]        = useState(null);
  const [dbTemplates,  setDbTemplates]  = useState([]);
  const [dragIdx,      setDragIdx]      = useState(null);
  const [dropIdx,      setDropIdx]      = useState(null);
  const [showAi,           setShowAi]           = useState(false);
  const [showSaveAsTemplate, setShowSaveAsTemplate] = useState(false);
  const [aiVenueInfo,      setAiVenueInfo]      = useState('');   // shared venue context for per-section AI
  const [sectionAiLoading, setSectionAiLoading] = useState(null); // section.id currently being AI-filled

  // Auto-populate venue info for AI from showcase meta + sections when they load
  useEffect(() => {
    if (aiVenueInfo) return; // don't overwrite if user already set it
    const auto = buildAutoVenueInfo(showcase, sections);
    if (auto.trim()) setAiVenueInfo(auto);
  }, [showcase, sections]); // eslint-disable-line react-hooks/exhaustive-deps
  const [returnPath,   setReturnPath]   = useState(null);
  const [lastSavedTime, setLastSavedTime] = useState(null);
  const [saveState,    setSaveState]    = useState('clean');  // clean | dirty | saving | saved

  useEffect(() => {
    try {
      const path = sessionStorage.getItem('lwd_admin_return_path');
      if (path) { setReturnPath(path); sessionStorage.removeItem('lwd_admin_return_path'); }
    } catch {}
  }, []);

  const saveTimer = useRef(null);

  // Toast helper
  function notify(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Warn before leaving with unsaved changes
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (dirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [dirty]);

  // Load showcase + DB templates on mount
  const loadedShowcaseIdRef = useRef(null);

  useEffect(() => {
    fetchTemplates().then(setDbTemplates).catch(() => {});

    if (!showcaseId) {
      setShowcase({ title: '', slug: '', status: 'draft', hero_image_url: '', location: '', excerpt: '' });
      setShowTemplate(true);
      return;
    }
    // Skip fetch if this ID is already loaded in local state (e.g. just created via Save Draft)
    if (loadedShowcaseIdRef.current === showcaseId) return;

    fetchShowcaseById(showcaseId).then(found => {
      if (found) {
        loadedShowcaseIdRef.current = showcaseId;
        setShowcase({
          id:              found.id,
          title:           found.name || found.title || '',
          slug:            found.slug || '',
          status:          found.status || 'draft',
          hero_image_url:  found.heroImage || found.hero_image_url || '',
          location:        found.location || '',
          excerpt:         found.excerpt  || '',
          seo_title:       found.seo_title || '',
          seo_description: found.seo_description || '',
          og_image:        found.og_image || '',
        });
        setSections(Array.isArray(found.sections) ? found.sections : []);
      }
    });
  }, [showcaseId]);

  // Auto-save draft on section / showcase changes (debounced 1.5s)
  useEffect(() => {
    if (!showcase?.id || !dirty) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveShowcaseDraft(showcase.id, {
        sections,
        title:           showcase.title,
        slug:            showcase.slug,
        hero_image_url:  showcase.hero_image_url,
        location:        showcase.location,
        excerpt:         showcase.excerpt,
        seo_title:       showcase.seo_title,
        seo_description: showcase.seo_description,
        og_image:        showcase.og_image,
      }).catch(e => console.warn('[ShowcaseStudio] auto-save:', e.message));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [sections, showcase, dirty]);

  const selectedSection = sections.find(s => s.id === selectedId) || null;

  // ── Section mutations ───────────────────────────────────────────────────────
  function handleSectionChange(updated) {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
    setDirty(true);
    setSaveState('dirty');
  }

  function handleAddSection(type) {
    const s = createSection(type);
    setSections(prev => [...prev, s]);
    setSelectedId(s.id);
    setDirty(true);
    setSaveState('dirty');
  }

  function handleRemoveSection(id) {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
    setSaveState('dirty');
  }

  function handleDuplicateSection(id) {
    const idx = sections.findIndex(s => s.id === id);
    if (idx === -1) return;
    const source = sections[idx];
    const copy = { ...source, id: `${source.type}-${Date.now()}` };
    setSections(prev => {
      const next = [...prev];
      next.splice(idx + 1, 0, copy);
      return next;
    });
    setSelectedId(copy.id);
    setDirty(true);
    setSaveState('dirty');
  }

  // ── DnD handlers ────────────────────────────────────────────────────────────
  function handleDragStart(e, idx) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, idx) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropIdx(idx);
  }

  function handleDrop(e, idx) {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setDropIdx(null); return; }
    setSections(prev => {
      const next = [...prev];
      const [moved] = next.splice(dragIdx, 1);
      next.splice(idx, 0, moved);
      return next;
    });
    setDirty(true);
    setSaveState('dirty');
    setDragIdx(null);
    setDropIdx(null);
  }

  function handleDragEnd() {
    setDragIdx(null);
    setDropIdx(null);
  }

  // ── Template handlers ───────────────────────────────────────────────────────
  function handleApplyTemplate(key) {
    const tmplSections = getTemplateSections(key);
    setSections(tmplSections);
    setSelectedId(null);
    setShowcase(prev => ({ ...prev, template_key: key }));
    setShowTemplate(false);
    setDirty(true);
    setSaveState('dirty');
  }

  async function handleApplyDbTemplate(tmpl) {
    // Clone sections from DB template (already fetched sections array)
    const cloned = tmpl.sections.map(s => ({
      ...s,
      id: `${s.type}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    }));
    setSections(cloned);
    setSelectedId(null);
    setShowcase(prev => ({
      ...prev,
      hero_image_url: prev.hero_image_url || tmpl.heroImage || '',
      template_key: tmpl.key,
    }));
    setShowTemplate(false);
    setDirty(true);
    setSaveState('dirty');
  }

  // ── Save / publish ──────────────────────────────────────────────────────────
  // Save: updates content without changing status (draft stays draft, live stays live)
  async function handleSave() {
    if (!showcase?.id) {
      notify('Save a draft first', 'error');
      return;
    }
    setSaving(true);
    setSaveState('saving');
    try {
      await saveShowcaseDraft(showcase.id, {
        sections,
        title:           showcase.title,
        slug:            showcase.slug,
        hero_image_url:  showcase.hero_image_url,
        location:        showcase.location,
        excerpt:         showcase.excerpt,
        seo_title:       showcase.seo_title,
        seo_description: showcase.seo_description,
        og_image:        showcase.og_image,
      });
      setDirty(false);
      setSaveState('saved');
      setLastSavedTime(new Date());
      notify('Saved successfully');
      setTimeout(() => setSaveState('clean'), 2000);
    } catch (e) {
      notify(e.message, 'error');
      setSaveState('dirty');
    } finally {
      setSaving(false);
    }
  }

  // Save Draft: always sets status to draft (allows incomplete content)
  async function handleSaveDraft() {
    setSaving(true);
    setSaveState('saving');
    try {
      let id = showcase?.id;
      if (!id) {
        const created = await createShowcase({
          name:      showcase.title || 'Untitled Showcase',
          slug:      showcase.slug  || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          location:  showcase.location || '',
          excerpt:   showcase.excerpt  || '',
          sections:  sections,
          status:    'draft',
          seo_title:       showcase.seo_title || '',
          seo_description: showcase.seo_description || '',
          og_image:        showcase.og_image || '',
        });
        id = created.id;
        loadedShowcaseIdRef.current = id;
        setShowcase(prev => ({ ...prev, id, status: 'draft' }));
        onSaveComplete?.(id);
      } else {
        await saveShowcaseDraft(id, {
          sections,
          title:           showcase.title,
          slug:            showcase.slug,
          hero_image_url:  showcase.hero_image_url,
          location:        showcase.location,
          excerpt:         showcase.excerpt,
          status:          'draft',
          seo_title:       showcase.seo_title,
          seo_description: showcase.seo_description,
          og_image:        showcase.og_image,
        });
        setShowcase(prev => ({ ...prev, status: 'draft' }));
      }
      setDirty(false);
      setSaveState('saved');
      setLastSavedTime(new Date());
      notify('Saved as draft');
      onListRefresh?.();
      setTimeout(() => setSaveState('clean'), 2000);
    } catch (e) {
      notify(e.message, 'error');
      setSaveState('dirty');
    } finally {
      setSaving(false);
    }
  }

  // Publish: sets status to live, requires validation
  async function handlePublish() {
    setPublishing(true);
    try {
      // Validate sections before publishing
      const validation = validateShowcase(sections);
      if (validation.hasErrors) {
        const errorIds = Object.keys(validation.errors);
        const errorNames = errorIds.map(id => {
          const s = sections.find(sec => sec.id === id);
          return s ? (SECTION_REGISTRY[s.type]?.label || s.type) : id;
        });
        notify(`${errorIds.length} section(s) need attention: ${errorNames.join(', ')}`, 'error');
        // Select + scroll to first failing section
        const firstId = errorIds[0];
        setSelectedId(firstId);
        setTimeout(() => {
          const el = document.getElementById(`section-item-${firstId}`);
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 50);
        setPublishing(false);
        return;
      }

      let id = showcase?.id;
      if (!id) {
        const created = await createShowcase({
          name:      showcase.title || 'Untitled Showcase',
          slug:      showcase.slug  || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          sections:  sections,
          status:    'draft',
          seo_title:       showcase.seo_title || '',
          seo_description: showcase.seo_description || '',
          og_image:        showcase.og_image || '',
        });
        id = created.id;
        loadedShowcaseIdRef.current = id;
        setShowcase(prev => ({ ...prev, id }));
        onSaveComplete?.(id);
      }

      // Save SEO fields to draft first, then publish (copies sections → published_sections)
      await saveShowcaseDraft(id, {
        seo_title:       showcase.seo_title       || null,
        seo_description: showcase.seo_description || null,
        og_image:        showcase.og_image        || null,
        sections,
      });
      await publishShowcase(id, sections);

      setShowcase(prev => ({ ...prev, status: 'live' }));
      setDirty(false);
      setSaveState('saved');
      setLastSavedTime(new Date());
      notify('Published successfully');
      onListRefresh?.();
      setTimeout(() => setSaveState('clean'), 2000);
    } catch (e) {
      notify(e.message, 'error');
      setSaveState('dirty');
    } finally {
      setPublishing(false);
    }
  }

  function handleDiscard() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onBack?.();
  }

  async function handleSectionAiFill(section, venueInfo) {
    setSectionAiLoading(section.id);
    try {
      const { content, layout } = await generateSectionWithAi({ sectionType: section.type, venueInfo });
      handleSectionChange({ ...section, content: { ...section.content, ...content }, layout: { ...section.layout, ...layout } });
      notify(`${section.type} filled with AI ✓`);
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSectionAiLoading(null);
    }
  }

  function handleAiGenerate(result) {
    setSections(result.sections);
    if (result.meta) {
      setShowcase(prev => ({
        ...prev,
        ...(result.meta.title    && { title:          result.meta.title }),
        ...(result.meta.slug     && { slug:            result.meta.slug }),
        ...(result.meta.location && { location:        result.meta.location }),
        ...(result.meta.excerpt  && { excerpt:         result.meta.excerpt }),
      }));
    }
    setSelectedId(null);
    setShowAi(false);
    setDirty(true);
    setSaveState('dirty');
    notify('Showcase generated ✓');
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const venueName = showcase?.title || 'Untitled Showcase';
  const isLive    = showcase?.status === 'live' || showcase?.status === 'published';

  // Template label — check static registry first, then DB templates list
  const templateKey   = showcase?.template_key;
  const staticTmpl    = templateKey ? SHOWCASE_TEMPLATES[templateKey] : null;
  const dbTmpl        = templateKey ? dbTemplates.find(t => t.key === templateKey || t.id === templateKey) : null;
  const templateLabel = staticTmpl?.label || dbTmpl?.title || dbTmpl?.label || null;

  // ── Styles ──────────────────────────────────────────────────────────────────
  const btnBase = { fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '7px 16px', border: 'none', borderRadius: 3, cursor: 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: '28px' };
  const btnSolid   = { ...btnBase, background: '#1a1a1a', color: '#ffffff' };
  const btnOutline = { ...btnBase, background: 'none', color: C.off, border: `1px solid ${C.border}` };
  const btnGold    = { ...btnBase, background: GOLD, color: '#0a0906' };
  const btnLink    = { fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px', whiteSpace: 'nowrap' };
  const btnLinkOn  = { ...btnLink, color: C.off, textDecoration: 'underline' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, overflow: 'hidden' }}>

      {/* ── Return to live page strip ── */}
      {returnPath && (
        <div style={{
          height: 28, flexShrink: 0,
          background: `${GOLD}14`,
          borderBottom: `1px solid ${GOLD}28`,
          display: 'flex', alignItems: 'center',
          padding: '0 20px',
        }}>
          <button
            onClick={() => { window.location.href = returnPath; }}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 600,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              color: GOLD, background: 'none', border: 'none',
              cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 5,
            }}
          >
            ← Back to live page
          </button>
          <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2, marginLeft: 8 }}>
            {returnPath}
          </span>
        </div>
      )}

      {/* ── Toolbar (stable control centre) ── */}
      <div style={{
        height: 52, flexShrink: 0,
        background: C.sidebar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 8, zIndex: 20,
      }}>
        {/* Left: Content tools */}
        <button onClick={() => setShowAi(true)} style={btnSolid}>✦ Magic AI</button>
        <button style={{ ...btnOutline, opacity: 0.4, cursor: 'default' }} disabled>Fill with AI</button>

        {/* Status feedback (centre-left) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12, minWidth: 180, height: 20 }}>
          {saveState === 'saving' && (
            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 500, color: C.grey2 }}>Saving…</span>
          )}
          {saveState === 'saved' && (
            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: '#22c55e' }}>✓ Saved successfully</span>
          )}
          {(saveState === 'dirty' || (saveState === 'clean' && dirty)) && (
            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 500, color: GOLD }}>● Unsaved changes</span>
          )}
        </div>

        {/* Template badge — centre of toolbar */}
        {templateLabel && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 5,
            padding: '3px 10px',
            background: `${GOLD}14`,
            border: `1px solid ${GOLD}30`,
            borderRadius: 20,
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
            color: GOLD, whiteSpace: 'nowrap',
          }}
          title={`Built on the "${templateLabel}" template`}
          >
            ◈ {templateLabel}
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Right: Action buttons (stable layout, no disappearing) */}
        {/* Discard — always visible, tertiary */}
        <button
          onClick={handleDiscard}
          disabled={!dirty}
          style={{
            ...btnOutline,
            opacity: !dirty ? 0.4 : 1,
            cursor: !dirty ? 'not-allowed' : 'pointer',
          }}
          title={!dirty ? 'No unsaved changes to discard' : 'Discard changes and return'}
        >
          Discard
        </button>

        {/* Save — always visible, secondary (preserves status) */}
        <button
          onClick={handleSave}
          disabled={!dirty || saving || publishing || !showcase?.id}
          style={{
            ...btnOutline,
            opacity: (!dirty || saving || publishing || !showcase?.id) ? 0.5 : 1,
            cursor: (!dirty || saving || publishing || !showcase?.id) ? 'not-allowed' : 'pointer',
          }}
          title={!showcase?.id ? 'Save draft first' : !dirty ? 'No unsaved changes' : 'Save changes (keeps current status)'}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>

        {/* Save Draft — always visible, secondary */}
        <button
          onClick={handleSaveDraft}
          disabled={saving || publishing}
          style={{
            ...btnSolid,
            opacity: (saving || publishing) ? 0.6 : 1,
            cursor: (saving || publishing) ? 'not-allowed' : 'pointer',
          }}
          title="Save as draft (allows incomplete content)"
        >
          {saving ? 'Saving…' : 'Save Draft'}
        </button>

        {/* Unpublished changes warning */}
        {isLive && dirty && (
          <span style={{ fontFamily: 'var(--font-body)', fontSize: 11, color: '#f59e0b', fontWeight: 600, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 4 }}>
            ⚠ Re-publish to go live
          </span>
        )}

        {/* Publish — always visible, primary */}
        <button
          onClick={handlePublish}
          disabled={publishing || saving}
          style={{
            ...btnGold,
            opacity: (publishing || saving) ? 0.6 : 1,
            cursor: (publishing || saving) ? 'not-allowed' : 'pointer',
            outline: isLive && dirty ? '2px solid #f59e0b' : 'none',
          }}
          title="Publish live (requires complete content)"
        >
          {publishing ? 'Publishing…' : isLive ? 'Re-publish' : 'Publish'}
        </button>

        {/* View Live — always visible, conditionally disabled */}
        <button
          onClick={() => isLive && showcase?.slug && window.open(`/showcase/${showcase.slug}`, '_blank')}
          disabled={!isLive || !showcase?.slug}
          style={{
            ...btnOutline,
            opacity: (!isLive || !showcase?.slug) ? 0.35 : 1,
            cursor: (!isLive || !showcase?.slug) ? 'not-allowed' : 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
          title={!isLive ? 'Publish first to view live' : 'Open the live showcase'}
        >
          View Live ↗
        </button>

        {/* Save as Template */}
        <button
          onClick={() => showcase?.id && setShowSaveAsTemplate(true)}
          disabled={!showcase?.id}
          style={{
            ...btnOutline,
            opacity: !showcase?.id ? 0.35 : 1,
            cursor:  !showcase?.id ? 'not-allowed' : 'pointer',
            fontSize: 11,
          }}
          title="Save current layout as a reusable template"
        >
          ⊟ Template
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />

        {/* View modes */}
        {['editor','split','preview'].map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={viewMode === m ? btnLinkOn : btnLink}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* ── 3-panel body ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── LEFT RAIL: Section list (260px) ── */}
        {viewMode !== 'preview' && (
          <div style={{
            width: 260, flexShrink: 0,
            background: C.sidebar,
            borderRight: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Venue name + meta */}
            <div style={{ padding: '20px 20px 14px', borderBottom: `1px solid ${C.border}`, flexShrink: 0 }}>
              <div style={{
                fontFamily: GD, fontSize: 15, fontWeight: 400,
                color: C.off, lineHeight: 1.2,
                marginBottom: 5,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {venueName || 'Untitled Showcase'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                <span style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.12em', textTransform: 'uppercase',
                  color: isLive ? '#22c55e' : GOLD,
                  background: isLive ? '#22c55e18' : `${GOLD}18`,
                  padding: '2px 7px', borderRadius: 2,
                }}>
                  {isLive ? 'Live' : 'Draft'}
                </span>
                <span style={{ fontFamily: NU, fontSize: 10, color: C.grey2 }}>
                  {sections.length} section{sections.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>

            {/* Section list (DnD) */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 0' }}>
              <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey2, fontWeight: 700, padding: '6px 6px 8px' }}>
                Sections
              </div>
              {sections.map((s, idx) => {
                const reg        = SECTION_REGISTRY[s.type];
                const isSelected = selectedId === s.id;
                const isDragging = dragIdx === idx;
                const isDropTarget = dropIdx === idx && dragIdx !== idx;
                return (
                  <div
                    key={s.id}
                    id={`section-item-${s.id}`}
                    draggable
                    onDragStart={e => handleDragStart(e, idx)}
                    onDragOver={e => handleDragOver(e, idx)}
                    onDrop={e => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    onClick={() => setSelectedId(isSelected ? null : s.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 7,
                      padding: '7px 8px', marginBottom: 2,
                      background: isSelected ? `${GOLD}1a` : isDropTarget ? `${GOLD}0d` : 'transparent',
                      border: `1px solid ${isSelected ? GOLD + '55' : isDropTarget ? GOLD + '33' : 'transparent'}`,
                      borderRadius: 4, cursor: 'pointer',
                      opacity: isDragging ? 0.4 : 1,
                      transition: 'background 0.1s, border-color 0.1s',
                    }}
                  >
                    {/* Drag handle */}
                    <span style={{ color: C.grey2, fontSize: 10, cursor: 'grab', flexShrink: 0, lineHeight: 1 }}>⠿</span>
                    {/* Icon */}
                    <span style={{ color: GOLD, fontSize: 11, flexShrink: 0 }}>{reg?.icon || '◈'}</span>
                    {/* Label */}
                    <span style={{ fontFamily: NU, fontSize: 11, color: isSelected ? C.off : C.grey, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {reg?.label || s.type}
                      {(s.content?.title || s.content?.headline) && (
                        <span style={{ color: C.grey2, marginLeft: 4, fontSize: 9 }}>
                          — {(s.content.title || s.content.headline).slice(0, 14)}
                        </span>
                      )}
                    </span>
                    {/* Actions */}
                    <div
                      style={{ display: 'flex', gap: 1, flexShrink: 0 }}
                      onClick={e => e.stopPropagation()}
                    >
                      <button
                        onClick={() => handleDuplicateSection(s.id)}
                        title="Duplicate"
                        style={{ background: 'none', border: 'none', color: C.grey2, cursor: 'pointer', fontSize: 10, padding: '2px 3px', lineHeight: 1 }}
                      >⊕</button>
                      <button
                        onClick={() => handleRemoveSection(s.id)}
                        title="Delete"
                        style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 10, padding: '2px 3px', lineHeight: 1 }}
                      >✕</button>
                    </div>
                  </div>
                );
              })}

              {sections.length === 0 && (
                <div style={{ padding: '20px 8px', fontFamily: NU, fontSize: 11, color: C.grey2, textAlign: 'center', lineHeight: 1.7 }}>
                  No sections yet.<br />Add a section below.
                </div>
              )}
            </div>

            {/* Bottom actions */}
            <div style={{ padding: '10px 10px 14px', borderTop: `1px solid ${C.border}`, flexShrink: 0 }}>
              <button onClick={() => setShowPicker(true)} style={{
                width: '100%', padding: '9px',
                background: 'none',
                border: `1px dashed ${GOLD}44`,
                borderRadius: 4,
                fontFamily: NU, fontSize: 11, color: GOLD, cursor: 'pointer',
                letterSpacing: '0.08em',
              }}>
                + Add Section
              </button>
              <button onClick={() => setShowTemplate(true)} style={{
                width: '100%', marginTop: 6, padding: '7px',
                background: 'none',
                border: `1px solid ${C.border}`,
                borderRadius: 4,
                fontFamily: NU, fontSize: 10, color: C.grey2, cursor: 'pointer',
              }}>
                Choose Template
              </button>
            </div>
          </div>
        )}

        {/* ── CENTRE CANVAS: Interactive ShowcaseRenderer ── */}
        {viewMode !== 'editor' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#0a0a08', position: 'relative' }}>
            {sections.length === 0 ? (
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                justifyContent: 'center', height: '100%', gap: 12,
              }}>
                <div style={{ fontFamily: GD, fontSize: 28, color: 'rgba(255,255,255,0.14)', fontWeight: 400 }}>
                  Live preview will appear here
                </div>
                <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.1)' }}>
                  Start typing a venue name → or add sections to begin
                </div>
              </div>
            ) : (
              <ShowcaseRenderer
                sections={sections}
                showcase={showcase || {}}
                isPreview={true}
                interactive={viewMode === 'split'}
                selectedId={selectedId}
                onSelectSection={id => {
                  setSelectedId(prev => prev === id ? null : id);
                  if (viewMode === 'split') setViewMode('split');
                }}
              />
            )}
          </div>
        )}

        {/* ── RIGHT PANEL: Section editor or showcase meta ── */}
        {viewMode !== 'preview' && (
          <div style={{
            width: viewMode === 'editor' ? 480 : 360,
            flexShrink: 0,
            background: C.sidebar,
            borderLeft: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Panel header */}
            <div style={{
              padding: '14px 24px',
              borderBottom: `1px solid ${C.border}`,
              flexShrink: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey, letterSpacing: '0.05em' }}>
                {selectedSection
                  ? `Editing: ${SECTION_REGISTRY[selectedSection.type]?.label || selectedSection.type}`
                  : 'Showcase Settings'}
              </div>
              {selectedSection && (
                <button
                  onClick={() => setSelectedId(null)}
                  style={{ background: 'none', border: 'none', color: C.grey2, cursor: 'pointer', fontSize: 12, padding: 0 }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Panel content */}
            {selectedSection ? (
              <SectionEditor
                section={selectedSection}
                onChange={handleSectionChange}
                C={C}
                showcase={showcase}
                sections={sections}
                onAiFill={handleSectionAiFill}
                aiLoading={sectionAiLoading}
                aiVenueInfo={aiVenueInfo}
                onSetAiVenueInfo={setAiVenueInfo}
              />
            ) : (
              <ShowcaseMeta showcase={showcase} onChange={setShowcase} C={C} sections={sections} setSections={setSections} />
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
      {showSaveAsTemplate && (
        <SaveAsTemplateModal
          showcase={showcase}
          sections={sections}
          existingTemplates={dbTemplates}
          onSaved={() => {
            setShowSaveAsTemplate(false);
            notify('Template saved — it will appear in the template picker', 'success');
            fetchTemplates().then(t => setDbTemplates(t)).catch(() => {});
          }}
          onClose={() => setShowSaveAsTemplate(false)}
          C={C}
        />
      )}
      {showTemplate && (
        <TemplatePicker
          onSelect={handleApplyTemplate}
          onSelectDb={handleApplyDbTemplate}
          onBlank={() => setShowTemplate(false)}
          C={C}
          dbTemplates={dbTemplates}
        />
      )}
      {showPicker && (
        <SectionPicker
          onAdd={handleAddSection}
          onClose={() => setShowPicker(false)}
          C={C}
        />
      )}
      {showAi && (
        <MagicAiPanel
          onGenerate={handleAiGenerate}
          onClose={() => setShowAi(false)}
          C={C}
          initialVenueInfo={aiVenueInfo}
          onVenueInfoChange={setAiVenueInfo}
        />
      )}

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 400,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#22c55e',
          color: '#fff', padding: '10px 18px', borderRadius: 4,
          fontFamily: NU, fontSize: 12, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          pointerEvents: 'none',
        }}>
          {toast.message}
        </div>
      )}

      {/* ── Dirty indicator ── */}
      {dirty && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: C.card, border: `1px solid ${C.border}`,
          padding: '5px 14px', borderRadius: 20,
          fontFamily: NU, fontSize: 10, color: C.grey2,
          letterSpacing: '0.08em', pointerEvents: 'none', zIndex: 400,
        }}>
          Unsaved changes · auto-saving…
        </div>
      )}
    </div>
  );
}
