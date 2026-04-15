/**
 * SpacesSection, Listing Studio editor for Venue Spaces
 *
 * Up to 5 event spaces per venue. Each space has:
 *   name · type · description · capacities (ceremony/reception/dining/standing)
 *   indoor/outdoor · covered/uncovered · accessible (yes/no)
 *   optional image · floor plan upload · sort order
 *
 * formData key: spaces[] (array of space objects)
 */

import { useState, useEffect } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import {
  LUXURY_TONE_SYSTEM,
  buildCeremonyDescriptionPrompt,
  SPACES_LOOKUP_SYSTEM,
  buildSpacesLookupPrompt,
} from '../../../lib/aiPrompts';

const MAX_SPACES = 5;
const SHOWCASE_INTRO_MAX = 300;

// Tolerant JSON extractor — strips markdown fences and falls back to first {...}
// block. Mirrors the helper used in DiningSection / RoomsSection / etc.
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

const toIntOrNull = (v) => {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
};
const toBoolOrNull = (v) => (v === true || v === false ? v : null);

// ── Shared primitives ─────────────────────────────────────────────────────────
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

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6'%3E%3Cpath d='M0 0l5 6 5-6z' fill='%23999'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 10px center',
  paddingRight: 28,
};

// ── Yes/No/N/A toggle for indoor, covered, accessible ─────────────────────────
const TriToggle = ({ label, value, onChange, options = [{ v: true, l: 'Yes' }, { v: false, l: 'No' }] }) => (
  <div>
    <label style={labelStyle}>{label}</label>
    <div style={{ display: 'flex', gap: 0, borderRadius: 3, overflow: 'hidden', border: '1px solid #ddd4c8', width: 'fit-content' }}>
      {options.map(({ v, l }) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          style={{
            padding: '7px 16px', fontSize: 12, fontWeight: 600, border: 'none',
            backgroundColor: value === v ? '#C9A84C' : '#faf9f7',
            color: value === v ? '#fff' : '#555',
            cursor: 'pointer', fontFamily: 'inherit',
            transition: 'background-color 0.15s',
          }}
        >{l}</button>
      ))}
    </div>
  </div>
);

// ── ID generator ──────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);

// ── Image/file upload pair (single image or floor plan) ───────────────────────
const FileUploadField = ({ label, value, onChange, hint, accept = 'image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif', emoji = '📷' }) => {
  const [objUrl, setObjUrl] = useState(null);

  useEffect(() => {
    if (value?.file instanceof File) {
      const u = URL.createObjectURL(value.file);
      setObjUrl(u);
      return () => URL.revokeObjectURL(u);
    } else {
      setObjUrl(null);
    }
  }, [value?.file]);

  const src = value?.file instanceof File ? objUrl : (value?.url || null);

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (f) onChange({ file: f, url: '' });
    e.target.value = '';
  };

  const clear = () => onChange(null);

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      {!src ? (
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', backgroundColor: '#f5f3ef',
          border: '1px solid #ddd4c8', borderRadius: 3,
          fontSize: 12, fontWeight: 600, color: '#555', cursor: 'pointer',
        }}>
          {emoji} Upload {label}
          <input type="file" accept={accept} onChange={handleFile} style={{ display: 'none' }} />
        </label>
      ) : (
        <div style={{ position: 'relative', display: 'inline-block' }}>
          <img src={src} alt={label} style={{ height: 80, maxWidth: 200, objectFit: 'cover', borderRadius: 2, display: 'block', border: '1px solid #ddd4c8' }} />
          <button
            type="button"
            onClick={clear}
            style={{
              position: 'absolute', top: 4, right: 4,
              width: 20, height: 20, border: 'none', borderRadius: '50%',
              backgroundColor: 'rgba(0,0,0,0.55)', color: '#fff',
              fontSize: 12, cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </div>
      )}
      {hint && <p style={hintStyle}>{hint}</p>}
    </div>
  );
};

// ── SPACE_TYPE options ────────────────────────────────────────────────────────
const SPACE_TYPES = [
  'Ballroom', 'Garden', 'Terrace', 'Private Dining Room', 'Poolside Area',
  'Chapel / Ceremony Space', 'Rooftop', 'Courtyard', 'Vineyard', 'Barn / Rustic Hall',
  'Beach / Waterfront', 'Library / Drawing Room', 'Gallery Space', 'Other',
];

const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

// ── Individual Space Card ─────────────────────────────────────────────────────
function SpaceCard({ space, index, total, onUpdate, onRemove, onMove, venueId, venueName }) {
  const [expanded, setExpanded] = useState(true);
  const [showDescAI, setShowDescAI] = useState(false);

  const set = (key, val) => onUpdate({ ...space, [key]: val });

  return (
    <div style={{
      border: '1px solid #ddd4c8', borderRadius: 3,
      backgroundColor: '#fff', overflow: 'hidden',
    }}>
      {/* Card header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 16px', backgroundColor: '#f5f3ef',
        borderBottom: expanded ? '1px solid #ddd4c8' : 'none',
        cursor: 'pointer',
      }} onClick={() => setExpanded(v => !v)}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 11, color: '#aaa', fontWeight: 700, width: 18 }}>{index + 1}</span>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>
            {space.name || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Unnamed Space</span>}
          </span>
          {space.type && (
            <span style={{ fontSize: 10, color: '#888', padding: '2px 8px', border: '1px solid #ddd4c8', borderRadius: 20 }}>{space.type}</span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Move up/down */}
          <button type="button" onClick={e => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
            style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 14 }}>↑</button>
          <button type="button" onClick={e => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1}
            style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 14 }}>↓</button>
          {/* Remove */}
          <button type="button" onClick={e => { e.stopPropagation(); onRemove(space.id); }}
            style={{ border: '1px solid #e5ddd0', borderRadius: '50%', width: 22, height: 22, background: '#fff', color: '#999', fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
          {/* Expand/collapse */}
          <span style={{ fontSize: 11, color: '#aaa', userSelect: 'none' }}>{expanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {expanded && (
        <div style={{ padding: 20 }}>

          {/* Row 1, Name + Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Space Name <span style={{ color: '#dc2626', fontWeight: 700 }}>*</span></label>
              <input
                type="text"
                value={space.name || ''}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. The Grand Salon"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Space Type</label>
              <select value={space.type || ''} onChange={e => set('type', e.target.value)} style={selectStyle}>
                <option value="">Select type…</option>
                {SPACE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Row 2, Short Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Short Description</label>
              <button type="button" onClick={() => setShowDescAI(v => !v)} style={aiLinkStyle}>
                ✦ Generate with AI
              </button>
            </div>
            {showDescAI && (
              <div style={{ marginBottom: 10 }}>
                <AIContentGenerator
                  feature="space_description"
                  systemPrompt={LUXURY_TONE_SYSTEM}
                  userPrompt={buildCeremonyDescriptionPrompt(space.name || venueName || '', { ...space, location: space.name })}
                  venueId={venueId}
                  onInsert={(text) => { set('description', text); setShowDescAI(false); }}
                  label="Generate Space Description"
                />
              </div>
            )}
            <textarea
              value={space.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="Describe this space, its character, setting, and what makes it special for a wedding event."
              style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }}
            />
            <p style={hintStyle}>Displayed on the listing beneath the space name. Keep it evocative and concise.</p>
          </div>

          {/* Row 3, Capacities (4-col) */}
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Capacities</label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {[
                { key: 'capacityCeremony', placeholder: 'Ceremony' },
                { key: 'capacityReception', placeholder: 'Reception' },
                { key: 'capacityDining', placeholder: 'Dining' },
                { key: 'capacityStanding', placeholder: 'Standing' },
              ].map(({ key, placeholder }) => (
                <div key={key}>
                  <div style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 4 }}>{placeholder}</div>
                  <input
                    type="number" min="0"
                    value={space[key] ?? ''}
                    onChange={e => set(key, e.target.value === '' ? null : Number(e.target.value))}
                    placeholder=" - "
                    style={{ ...inputStyle, textAlign: 'center' }}
                  />
                </div>
              ))}
            </div>
            <p style={hintStyle}>Leave blank if this space type doesn't apply. Used to drive the capacity numbers on the listing.</p>
          </div>

          {/* Row 4, Indoor / Covered / Accessible */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 16 }}>
            <TriToggle
              label="Indoor / Outdoor"
              value={space.indoor}
              onChange={v => set('indoor', v)}
              options={[{ v: true, l: 'Indoor' }, { v: false, l: 'Outdoor' }]}
            />
            <TriToggle
              label="Covered"
              value={space.covered}
              onChange={v => set('covered', v)}
              options={[{ v: true, l: 'Yes' }, { v: false, l: 'No' }]}
            />
            <TriToggle
              label="Accessible"
              value={space.accessible}
              onChange={v => set('accessible', v)}
              options={[{ v: true, l: 'Yes' }, { v: false, l: 'No' }]}
            />
          </div>

          {/* Row 5, Optional Image + Floor Plan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <FileUploadField
              label="Space Image"
              value={space.imgFile ? { file: space.imgFile } : (space.img ? { url: space.img } : null)}
              onChange={v => set('imgFile', v?.file || null)}
              hint="Optional. Shown alongside description. 4:3 ratio recommended."
              emoji="📷"
            />
            <FileUploadField
              label="Floor Plan"
              value={space.floorPlanFile ? { file: space.floorPlanFile } : (space.floorPlanUrl ? { url: space.floorPlanUrl } : null)}
              onChange={v => set('floorPlanFile', v?.file || null)}
              hint="PDF or image. Opens in a lightbox popup. Separate from main gallery."
              accept="image/jpeg,image/png,image/webp,image/avif,image/gif,image/heic,image/heif,application/pdf"
              emoji="📐"
            />
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
const SpacesSection = ({ formData, onChange }) => {
  const spaces    = formData?.spaces || [];
  const venueId   = formData?.id;
  const venueName = formData?.venue_name || formData?.name || '';
  const websiteUrl = formData?.website || formData?.website_url || '';
  const locationHint = [formData?.city, formData?.region, formData?.country]
    .filter(Boolean)
    .join(', ');
  const [showSpacesLookupAI, setShowSpacesLookupAI] = useState(false);

  const handleSpacesLookupInsert = (text) => {
    const parsed = extractJsonObject(text);
    if (!parsed) {
      alert('AI did not return valid JSON. Try again or add spaces manually.');
      return;
    }

    let appliedSpaces = 0;
    if (Array.isArray(parsed.spaces) && parsed.spaces.length > 0) {
      const newSpaces = parsed.spaces
        .slice(0, MAX_SPACES)
        .map((s, i) => {
          const type = typeof s.type === 'string' && SPACE_TYPES.includes(s.type) ? s.type : '';
          if (!s || (typeof s.name !== 'string' && !type)) return null;
          return {
            id: genId(),
            name: typeof s.name === 'string' ? s.name.trim() : '',
            type,
            description: typeof s.description === 'string' ? s.description.trim() : '',
            capacityCeremony: toIntOrNull(s.capacityCeremony),
            capacityReception: toIntOrNull(s.capacityReception),
            capacityDining: toIntOrNull(s.capacityDining),
            capacityStanding: toIntOrNull(s.capacityStanding),
            indoor: toBoolOrNull(s.indoor),
            covered: toBoolOrNull(s.covered),
            accessible: toBoolOrNull(s.accessible),
            imgFile: null,
            img: '',
            floorPlanFile: null,
            floorPlanUrl: '',
            sortOrder: i,
          };
        })
        .filter(Boolean);

      if (newSpaces.length > 0) {
        onChange('spaces', newSpaces);
        appliedSpaces = newSpaces.length;
      }
    }

    let appliedIntro = false;
    if (typeof parsed.showcase_intro === 'string' && parsed.showcase_intro.trim()) {
      const intros = { ...(formData?.section_intros || {}) };
      intros.spaces = parsed.showcase_intro.trim().slice(0, SHOWCASE_INTRO_MAX);
      onChange('section_intros', intros);
      appliedIntro = true;
    }

    if (appliedSpaces === 0 && !appliedIntro) {
      alert('AI returned JSON but no recognised spaces. Try again or add spaces manually.');
      return;
    }
    setShowSpacesLookupAI(false);
  };

  const addSpace = () => {
    if (spaces.length >= MAX_SPACES) return;
    const newSpace = {
      id: genId(),
      name: '',
      type: '',
      description: '',
      capacityCeremony: null,
      capacityReception: null,
      capacityDining: null,
      capacityStanding: null,
      indoor: null,
      covered: null,
      accessible: null,
      imgFile: null,
      img: '',
      floorPlanFile: null,
      floorPlanUrl: '',
      sortOrder: spaces.length,
    };
    onChange('spaces', [...spaces, newSpace]);
  };

  const updateSpace = (updated) => {
    onChange('spaces', spaces.map(s => s.id === updated.id ? updated : s));
  };

  const removeSpace = (id) => {
    onChange('spaces', spaces.filter(s => s.id !== id));
  };

  const moveSpace = (index, direction) => {
    const next = [...spaces];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange('spaces', next.map((s, i) => ({ ...s, sortOrder: i })));
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: 0 }}>
            Venue Spaces
          </h3>
          <button type="button" onClick={() => setShowSpacesLookupAI(v => !v)} style={aiLinkStyle}>
            ✦ Find spaces with AI
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Add up to {MAX_SPACES} individual event spaces. Each space has its own capacities, attributes and floor plan. Empty = section hidden on listing.
        </p>
        {showSpacesLookupAI && (
          <div style={{ marginTop: 12 }}>
            <AIContentGenerator
              feature="spaces_lookup"
              systemPrompt={SPACES_LOOKUP_SYSTEM}
              userPrompt={buildSpacesLookupPrompt(venueName, websiteUrl, locationHint)}
              venueId={venueId}
              onInsert={handleSpacesLookupInsert}
              label="Find Venue Spaces"
            />
            <p style={hintStyle}>
              AI will research the venue's event spaces (ballroom, garden, terrace, etc.) and pre-fill the cards below. Existing spaces will be replaced — review and edit before saving.
            </p>
          </div>
        )}
      </div>

      {/* Space cards */}
      {spaces.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
          {spaces.map((space, i) => (
            <SpaceCard
              key={space.id}
              space={space}
              index={i}
              total={spaces.length}
              onUpdate={updateSpace}
              onRemove={removeSpace}
              onMove={moveSpace}
              venueId={venueId}
              venueName={venueName}
            />
          ))}
        </div>
      )}

      {/* Add Space button */}
      {spaces.length < MAX_SPACES ? (
        <button
          type="button"
          onClick={addSpace}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '10px 20px',
            border: '1px dashed #C9A84C',
            borderRadius: 3,
            backgroundColor: 'rgba(201,168,76,0.04)',
            color: '#9a6f0a', fontSize: 12, fontWeight: 700,
            cursor: 'pointer', fontFamily: 'inherit',
            width: '100%', justifyContent: 'center',
          }}
        >
          + Add Space {spaces.length > 0 && `(${spaces.length} / ${MAX_SPACES})`}
        </button>
      ) : (
        <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, margin: 0 }}>
          Maximum {MAX_SPACES} spaces reached
        </p>
      )}

    </section>
  );
};

export default SpacesSection;
