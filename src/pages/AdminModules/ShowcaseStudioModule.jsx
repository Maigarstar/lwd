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
import { generateShowcaseWithAi } from '../../services/showcaseAiService';
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
  saveShowcaseDraft,
  publishShowcase,
  duplicateShowcase,
  createShowcase,
  updateShowcase,
  fetchTemplates,
  cloneTemplate,
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
function SectionEditor({ section, onChange, C, showcase }) {
  if (!section) return null;

  const reg     = SECTION_REGISTRY[section.type];
  const content = section.content || {};
  const layout  = section.layout  || {};

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
      {/* Section type badge */}
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 18 }}>
        {reg?.icon || '◈'} {reg?.label || section.type}
      </div>

      {/* ── Hero ── */}
      {section.type === 'hero' && (
        <>
          <Field label="Title" fieldKey="title" />
          <Field label="Eyebrow" fieldKey="eyebrow" placeholder="e.g. 150 Piccadilly · Mayfair · London" />
          <Field label="Tagline" fieldKey="tagline" type="textarea" rows={3} />
          <ImgField label="Hero Image" fieldKey="image" />
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

      {/* ── Layout: accent background ── */}
      {['intro','feature','quote','stats','highlight-band','dining','spaces','wellness','weddings','pricing','verified'].includes(section.type) && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <label style={lbl(C)}>Panel Background</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            {['#0f0e0c','#1a1209','#131c14','#0d1a1f','#1a1616','#faf9f6','#FDFBF7'].map(col => (
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
            <input
              type="text"
              value={layout.accentBg || ''}
              onChange={e => setLayout('accentBg', e.target.value)}
              placeholder="#1a1209"
              style={{ ...inp(C), width: 90, fontSize: 11, padding: '5px 8px' }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ShowcaseMeta — right panel when no section selected
// ─────────────────────────────────────────────────────────────────────────────
function ShowcaseMeta({ showcase, onChange, C }) {
  function set(key, value) {
    onChange({ ...showcase, [key]: value });
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
          onChange={e => set('slug', e.target.value)}
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
      <div style={{ marginTop: 8, padding: '12px 14px', background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4 }}>
        <div style={{ fontFamily: NU, fontSize: 10, color: C.grey2, lineHeight: 1.7 }}>
          Click any section in the canvas to edit its content. Drag sections in the left rail to reorder them.
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
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '36px 32px', maxWidth: 640, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 }}>
              {dbTemplates.map(tmpl => (
                <button
                  key={tmpl.id}
                  onClick={() => onSelectDb(tmpl)}
                  style={{
                    background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
                    padding: '14px 16px', textAlign: 'left', cursor: 'pointer',
                  }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
                  onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
                >
                  {tmpl.heroImage && (
                    <div style={{ height: 64, background: '#000', borderRadius: 3, marginBottom: 10, overflow: 'hidden' }}>
                      <img src={tmpl.heroImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    </div>
                  )}
                  <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.off, marginBottom: 3 }}>{tmpl.label}</div>
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 20 }}>
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
function MagicAiPanel({ onGenerate, onClose, C }) {
  const [venueInfo, setVenueInfo] = useState('');
  const [mode,      setMode]      = useState('template');
  const [loading,   setLoading]   = useState(false);
  const [error,     setError]     = useState(null);

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
            onChange={e => { setVenueInfo(e.target.value); setError(null); }}
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
export default function ShowcaseStudioModule({ C, showcaseId, onBack }) {
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
  const [showAi,       setShowAi]       = useState(false);

  const saveTimer = useRef(null);

  // Toast helper
  function notify(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }

  // Load showcase + DB templates on mount
  useEffect(() => {
    fetchTemplates().then(setDbTemplates).catch(() => {});

    if (!showcaseId) {
      setShowcase({ title: '', slug: '', status: 'draft', hero_image_url: '', location: '', excerpt: '' });
      setShowTemplate(true);
      return;
    }
    fetchShowcases().then(showcases => {
      const found = showcases.find(s => s.id === showcaseId);
      if (found) {
        setShowcase({
          id:            found.id,
          title:         found.name || found.title || '',
          slug:          found.slug || '',
          status:        found.status || 'draft',
          hero_image_url: found.heroImage || found.hero_image_url || '',
          location:      found.location || '',
          excerpt:       found.excerpt  || '',
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
        title:         showcase.title,
        slug:          showcase.slug,
        hero_image_url: showcase.hero_image_url,
        location:      showcase.location,
        excerpt:       showcase.excerpt,
      }).catch(e => console.warn('[ShowcaseStudio] auto-save:', e.message));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [sections, showcase, dirty]);

  const selectedSection = sections.find(s => s.id === selectedId) || null;

  // ── Section mutations ───────────────────────────────────────────────────────
  function handleSectionChange(updated) {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
    setDirty(true);
  }

  function handleAddSection(type) {
    const s = createSection(type);
    setSections(prev => [...prev, s]);
    setSelectedId(s.id);
    setDirty(true);
  }

  function handleRemoveSection(id) {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
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
  }

  // ── Save / publish ──────────────────────────────────────────────────────────
  async function handleSaveDraft() {
    setSaving(true);
    try {
      let id = showcase?.id;
      if (!id) {
        const created = await createShowcase({
          name:      showcase.title || 'Untitled Showcase',
          slug:      showcase.slug  || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          location:  showcase.location || '',
          excerpt:   showcase.excerpt  || '',
          sections:  [],
          status:    'draft',
        });
        id = created.id;
        setShowcase(prev => ({ ...prev, id }));
      } else {
        await saveShowcaseDraft(id, {
          sections,
          title:          showcase.title,
          slug:           showcase.slug,
          hero_image_url: showcase.hero_image_url,
          location:       showcase.location,
          excerpt:        showcase.excerpt,
        });
      }
      setDirty(false);
      notify('Draft saved');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    setPublishing(true);
    try {
      let id = showcase?.id;
      if (!id) {
        const created = await createShowcase({
          name:      showcase.title || 'Untitled Showcase',
          slug:      showcase.slug  || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          sections:  [],
          status:    'draft',
        });
        id = created.id;
        setShowcase(prev => ({ ...prev, id }));
      }
      await publishShowcase(id, sections);
      setShowcase(prev => ({ ...prev, status: 'live' }));
      setDirty(false);
      notify('Published successfully');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  function handleDiscard() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onBack?.();
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
    notify('Showcase generated ✓');
  }

  // ── Derived state ───────────────────────────────────────────────────────────
  const venueName = showcase?.title || 'Untitled Showcase';
  const isLive    = showcase?.status === 'live' || showcase?.status === 'published';

  // ── Styles ──────────────────────────────────────────────────────────────────
  const btnSolid   = { fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '7px 16px', background: C.off, color: C.white, border: 'none', borderRadius: 3, cursor: 'pointer' };
  const btnOutline = { ...btnSolid, background: 'none', color: C.off, border: `1px solid ${C.border}` };
  const btnGold    = { ...btnSolid, background: GOLD, color: '#0a0906' };
  const btnLink    = { fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: 'none', cursor: 'pointer', padding: '0 6px' };
  const btnLinkOn  = { ...btnLink, color: C.off, textDecoration: 'underline' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, overflow: 'hidden' }}>

      {/* ── Toolbar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        background: C.sidebar,
        borderBottom: `1px solid ${C.border}`,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 8, zIndex: 20,
      }}>
        {/* Left */}
        <button onClick={() => setShowAi(true)} style={btnSolid}>✦ Magic AI</button>
        <button style={{ ...btnOutline, opacity: 0.4, cursor: 'default' }} disabled>Fill with AI</button>
        <div style={{ flex: 1 }} />
        {/* View published page */}
        {showcase?.slug && (
          <button
            onClick={() => window.open(`/showcase/${showcase.slug}`, '_blank')}
            style={{ ...btnOutline, display: 'flex', alignItems: 'center', gap: 4 }}
            title="View published showcase"
          >
            View ↗
          </button>
        )}
        {/* Right */}
        <button onClick={handleDiscard} style={btnOutline}>Discard</button>
        <button onClick={handleSaveDraft} disabled={saving} style={btnSolid}>
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button onClick={handlePublish} disabled={publishing} style={btnGold}>
          {publishing ? 'Publishing…' : isLive ? 'Re-publish' : 'Publish'}
        </button>
        <div style={{ width: 1, height: 20, background: C.border, margin: '0 4px' }} />
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
              <SectionEditor section={selectedSection} onChange={handleSectionChange} C={C} showcase={showcase} />
            ) : (
              <ShowcaseMeta showcase={showcase} onChange={setShowcase} C={C} />
            )}
          </div>
        )}
      </div>

      {/* ── Modals ── */}
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
