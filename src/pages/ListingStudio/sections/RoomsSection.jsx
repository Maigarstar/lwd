/**
 * RoomsSection, Listing Studio editor for accommodation / rooms
 *
 * Fields:
 *   Accommodation Type · Total Rooms · Total Suites · Max Overnight Guests
 *   Exclusive Use (toggle) · Min Night Stay · Room Description (TipTap)
 *   Room Images (file upload, max 6)
 *
 * formData keys:
 *   rooms_accommodation_type · rooms_total · rooms_suites · rooms_max_guests
 *   rooms_exclusive_use · rooms_min_stay · rooms_description · rooms_images[]
 */

import { useState, useEffect } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import {
  LUXURY_TONE_SYSTEM,
  buildRoomsDescriptionPrompt,
  ROOMS_LOOKUP_SYSTEM,
  buildRoomsLookupPrompt,
} from '../../../lib/aiPrompts';

const MAX_ROOM_IMAGES = 6;
const SHOWCASE_INTRO_MAX = 300;

const ACCOMMODATION_TYPES = [
  'Historic Villa',
  'Boutique Hotel',
  'Castle',
  'Resort',
  'Manor House',
  'Country Estate',
];

// Tolerant JSON extractor — strips markdown fences and falls back to first {...}
// block. Mirrors the helpers in CommercialDetailsSection / LocationSection so silent
// JSON.parse failures can't hide a malformed AI response.
function extractJsonObject(text) {
  if (typeof text !== 'string' || !text.trim()) return null;
  let cleaned = text.trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/\s*```$/, '');
  try { return JSON.parse(cleaned); } catch { /* fall through */ }
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try { return JSON.parse(match[0]); } catch { return null; }
}

// ── Shared primitives ────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#1a1a1a',
  marginBottom: 6,
};

const inputStyle = {
  width: '100%',
  padding: '9px 12px',
  fontSize: 13,
  border: '1px solid #ddd4c8',
  borderRadius: 3,
  fontFamily: 'inherit',
  color: '#333',
  boxSizing: 'border-box',
  backgroundColor: '#fff',
};

const hintStyle = { fontSize: 10, color: '#aaa', margin: '4px 0 0' };

// ── Accommodation Type selector ────────────────────────────────────────────────
const AccommodationTypeSelector = ({ value, onChange, label }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
      {ACCOMMODATION_TYPES.map(type => (
        <button
          key={type}
          type="button"
          onClick={() => onChange(type)}
          style={{
            padding: '8px 16px',
            fontSize: 12,
            fontWeight: 600,
            border: `1px solid ${value === type ? '#C9A84C' : '#ddd4c8'}`,
            backgroundColor: value === type ? '#C9A84C' : '#faf9f7',
            color: value === type ? '#fff' : '#555',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'all 0.15s',
            borderRadius: 3,
          }}
        >
          {type}
        </button>
      ))}
    </div>
  </div>
);

// ── Yes/No toggle ─────────────────────────────────────────────────────────────
const YesNoToggle = ({ value, onChange, label }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: 'flex', gap: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #ddd4c8', width: 'fit-content' }}>
      {[true, false].map(v => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          style={{
            padding: '8px 20px',
            fontSize: 12, fontWeight: 600,
            border: 'none',
            backgroundColor: value === v ? (v ? '#C9A84C' : '#888') : '#faf9f7',
            color: value === v ? '#fff' : '#555',
            cursor: 'pointer',
            fontFamily: 'inherit',
            transition: 'background-color 0.15s',
          }}
        >
          {v ? 'Yes' : 'No'}
        </button>
      ))}
    </div>
  </div>
);

// ── Room image manager ────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);

const RoomImageManager = ({ images = [], onChange }) => {
  const [objUrls, setObjUrls] = useState({});

  // Build object URLs for preview
  useEffect(() => {
    const urls = {};
    images.forEach(img => {
      if (img.file instanceof File) urls[img.id] = URL.createObjectURL(img.file);
    });
    setObjUrls(prev => {
      Object.values(prev).forEach(u => { if (!urls[u?.split('blob:')[0]] && u?.startsWith('blob:')) URL.revokeObjectURL(u); });
      return urls;
    });
    return () => Object.values(urls).forEach(u => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.map(i => i.id).join('|')]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_ROOM_IMAGES - images.length;
    const toAdd = files.slice(0, remaining).map((file, idx) => ({
      id: genId(),
      file,
      url: '',
      sort_order: images.length + idx,
    }));
    onChange([...images, ...toAdd]);
    e.target.value = '';
  };

  const remove = (id) => onChange(images.filter(i => i.id !== id));

  const getSrc = (img) => img.file instanceof File ? objUrls[img.id] : (img.url || '');

  return (
    <div>
      {/* Upload button */}
      {images.length < MAX_ROOM_IMAGES && (
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', backgroundColor: '#f5f3ef',
          border: '1px solid #ddd4c8', borderRadius: 3,
          fontSize: 12, fontWeight: 600, color: '#555',
          cursor: 'pointer', marginBottom: images.length > 0 ? 12 : 0,
        }}>
          📷 {images.length === 0 ? 'Upload Room Images' : `+ Add More (${MAX_ROOM_IMAGES - images.length} remaining)`}
          <input
            type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif"
            onChange={handleFiles} style={{ display: 'none' }}
          />
        </label>
      )}

      {images.length >= MAX_ROOM_IMAGES && (
        <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, marginBottom: 10 }}>
          Maximum {MAX_ROOM_IMAGES} room images reached
        </p>
      )}

      {/* Image grid */}
      {images.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {images.map((img, idx) => {
            const src = getSrc(img);
            return (
              <div key={img.id} style={{ position: 'relative' }}>
                {src ? (
                  <img
                    src={src} alt={`Room ${idx + 1}`}
                    style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', borderRadius: 2, display: 'block' }}
                  />
                ) : (
                  <div style={{ aspectRatio: '4/3', backgroundColor: '#f0ebe3', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#bbb' }}>No preview</span>
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  style={{
                    position: 'absolute', top: 4, right: 4,
                    width: 20, height: 20, border: 'none', borderRadius: '50%',
                    backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff',
                    fontSize: 12, cursor: 'pointer', display: 'flex',
                    alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                  }}
                >
                  ×
                </button>
                {idx === 0 && (
                  <span style={{
                    position: 'absolute', bottom: 4, left: 4,
                    padding: '2px 6px', backgroundColor: 'rgba(201,168,76,0.85)',
                    fontSize: 9, fontWeight: 700, color: '#fff', borderRadius: 2, letterSpacing: '0.05em',
                  }}>FEATURED</span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Main section ──────────────────────────────────────────────────────────────
const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

const RoomsSection = ({ formData, onChange }) => {
  const rooms_images = formData?.rooms_images || [];
  const [showRoomsAI, setShowRoomsAI] = useState(false);
  const [showRoomsLookupAI, setShowRoomsLookupAI] = useState(false);

  // Build a location hint from whatever the form already has — gives the model
  // context to disambiguate same-named venues across countries.
  const locationHint = [
    formData?.city,
    formData?.region,
    formData?.country,
  ].filter(Boolean).join(', ');

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: 0 }}>
            Rooms & Accommodation
          </h3>
          <button
            type="button"
            onClick={() => setShowRoomsLookupAI(v => !v)}
            style={aiLinkStyle}
          >
            {showRoomsLookupAI ? '✦ Hide AI lookup' : '✦ Find rooms with AI'}
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Couples look for overnight accommodation first. Fill in what's available, empty sections are hidden on the listing.
        </p>
      </div>

      {showRoomsLookupAI && (
        <div style={{ marginBottom: 20 }}>
          <AIContentGenerator
            feature="rooms_lookup"
            systemPrompt={ROOMS_LOOKUP_SYSTEM}
            userPrompt={buildRoomsLookupPrompt(
              formData?.venue_name || formData?.name || '',
              formData?.website || formData?.website_url || formData?.url || '',
              locationHint
            )}
            venueId={formData?.id}
            onInsert={(text) => {
              const data = extractJsonObject(text);
              if (!data) {
                // eslint-disable-next-line no-alert
                alert(
                  'Could not parse rooms data from AI response. The model returned ' +
                  'something that is not valid JSON. Try clicking Generate again ' +
                  'or fill the rooms manually.\n\nResponse was:\n\n' +
                  String(text).slice(0, 400)
                );
                return;
              }
              const fieldsApplied = [];

              // accommodation_type — must match one of the allowed buttons
              if (
                data.accommodation_type &&
                typeof data.accommodation_type === 'string' &&
                ACCOMMODATION_TYPES.includes(data.accommodation_type.trim())
              ) {
                onChange('rooms_accommodation_type', data.accommodation_type.trim());
                fieldsApplied.push('accommodation_type');
              }

              // Numeric fields — normalise to integer strings (the inputs are
              // type="number" but the form stores strings).
              const numericFields = [
                ['rooms_total',      'rooms_total'],
                ['rooms_suites',     'rooms_suites'],
                ['rooms_max_guests', 'rooms_max_guests'],
                ['rooms_min_stay',   'rooms_min_stay'],
              ];
              numericFields.forEach(([jsonKey, formKey]) => {
                const raw = data[jsonKey];
                if (raw !== undefined && raw !== null && raw !== '' && Number(raw) > 0) {
                  onChange(formKey, String(Math.round(Number(raw))));
                  fieldsApplied.push(jsonKey);
                }
              });

              // exclusive_use — only flip to true if the model is confident; we
              // don't overwrite an existing true with a missing/false answer.
              if (data.exclusive_use === true) {
                onChange('rooms_exclusive_use', true);
                fieldsApplied.push('exclusive_use');
              }

              // showcase_intro — feeds the Editorial Content > Accommodation
              // section intro on the showcase page. Stored in section_intros.rooms.
              if (
                data.showcase_intro &&
                typeof data.showcase_intro === 'string' &&
                data.showcase_intro.trim()
              ) {
                const intro = data.showcase_intro.trim().slice(0, SHOWCASE_INTRO_MAX);
                const existingIntros = formData?.section_intros || {};
                onChange('section_intros', { ...existingIntros, rooms: intro });
                fieldsApplied.push('showcase_intro');
              }

              if (fieldsApplied.length === 0) {
                // eslint-disable-next-line no-alert
                alert(
                  'AI returned a JSON response but every field was empty — the ' +
                  'model could not confidently identify accommodation for this venue. ' +
                  'Many wedding venues do not publish room counts, so this is common. ' +
                  'Try giving it a website URL, or fill the rooms manually.'
                );
                return;
              }
              setShowRoomsLookupAI(false);
            }}
            label="Find Rooms"
          />
        </div>
      )}

      {/* Accommodation Type */}
      <div style={{ marginBottom: 20 }}>
        <AccommodationTypeSelector
          label="Accommodation Type"
          value={formData?.rooms_accommodation_type || ''}
          onChange={v => onChange('rooms_accommodation_type', v)}
        />
      </div>

      {/* Numeric fields, 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Total Rooms</label>
          <input
            type="number" min="0"
            value={formData?.rooms_total || ''}
            onChange={e => onChange('rooms_total', e.target.value)}
            placeholder="e.g. 18"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Total Suites</label>
          <input
            type="number" min="0"
            value={formData?.rooms_suites || ''}
            onChange={e => onChange('rooms_suites', e.target.value)}
            placeholder="e.g. 6"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Max Overnight Guests</label>
          <input
            type="number" min="0"
            value={formData?.rooms_max_guests || ''}
            onChange={e => onChange('rooms_max_guests', e.target.value)}
            placeholder="e.g. 40"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Min Night Stay</label>
          <input
            type="number" min="1"
            value={formData?.rooms_min_stay || ''}
            onChange={e => onChange('rooms_min_stay', e.target.value)}
            placeholder="e.g. 2 nights"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Exclusive Use */}
      <div style={{ marginBottom: 24 }}>
        <YesNoToggle
          label="Exclusive Use Available"
          value={!!formData?.rooms_exclusive_use}
          onChange={v => onChange('rooms_exclusive_use', v)}
        />
      </div>

      {/* Room Description, TipTap */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Room Description</label>
          <button type="button" onClick={() => setShowRoomsAI(v => !v)} style={aiLinkStyle}>
            ✦ Generate with AI
          </button>
        </div>
        {showRoomsAI && (
          <div style={{ marginBottom: 10 }}>
            <AIContentGenerator
              feature="rooms_description"
              systemPrompt={LUXURY_TONE_SYSTEM}
              userPrompt={buildRoomsDescriptionPrompt(formData?.venue_name || formData?.name || '', formData)}
              venueId={formData?.id}
              onInsert={(text) => { onChange('rooms_description', text); setShowRoomsAI(false); }}
              label="Generate Room Description"
            />
          </div>
        )}
        <RichTextEditor
          value={formData?.rooms_description || ''}
          onChange={html => onChange('rooms_description', html)}
          placeholder="Describe the rooms, suites and accommodation style. What makes staying here special for a wedding weekend?"
          minHeight={160}
        />
        <p style={hintStyle}>Supports rich text. Empty = hidden on listing.</p>
      </div>

      {/* Room Images */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={labelStyle}>Room Images</label>
          <span style={{ fontSize: 10, color: '#aaa' }}>{rooms_images.length} / {MAX_ROOM_IMAGES}</span>
        </div>
        <RoomImageManager
          images={rooms_images}
          onChange={imgs => onChange('rooms_images', imgs)}
        />
        <p style={hintStyle}>First image is featured. Aspect ratio 4:3. Max 5 MB each.</p>
      </div>

    </section>
  );
};

export default RoomsSection;
