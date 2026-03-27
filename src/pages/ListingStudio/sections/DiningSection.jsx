/**
 * DiningSection, Listing Studio editor for dining & drinks
 *
 * Fields:
 *   Dining Style · Chef Name · In-house Catering · External Catering Allowed
 *   Menu Styles (multi-checkbox) · Dietary Options (multi-checkbox)
 *   Drinks Options (multi-checkbox) · Dining Description (TipTap)
 *   Menu Highlight Images (file upload, max 4, popup only, not main gallery)
 *
 * formData keys:
 *   dining_style · dining_chef_name · dining_in_house · dining_external
 *   dining_menu_styles[] · dining_dietary[] · dining_drinks[]
 *   dining_description · dining_menu_images[]
 */

import { useState, useEffect } from 'react';
import RichTextEditor from '../components/RichTextEditor';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import { LUXURY_TONE_SYSTEM, buildDiningDescriptionPrompt } from '../../../lib/aiPrompts';

const MAX_MENU_IMAGES = 5;

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

// ── Multi-checkbox group ──────────────────────────────────────────────────────
const CheckboxGroup = ({ options, selected = [], onChange, label }) => {
  const toggle = (opt) => {
    const next = selected.includes(opt)
      ? selected.filter(s => s !== opt)
      : [...selected, opt];
    onChange(next);
  };

  return (
    <div>
      <label style={labelStyle}>{label}</label>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {options.map(opt => {
          const active = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggle(opt)}
              style={{
                padding: '6px 14px',
                fontSize: 12,
                border: `1px solid ${active ? '#C9A84C' : '#ddd4c8'}`,
                borderRadius: 20,
                backgroundColor: active ? 'rgba(201,168,76,0.1)' : '#faf9f7',
                color: active ? '#9a6f0a' : '#555',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                fontFamily: 'inherit',
                transition: 'all 0.12s',
              }}
            >
              {active && <span style={{ marginRight: 4 }}>✓</span>}
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// ── Menu highlight image manager (max 4) ──────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);

const MenuImageManager = ({ images = [], onChange }) => {
  const [objUrls, setObjUrls] = useState({});

  useEffect(() => {
    const urls = {};
    images.forEach(img => {
      if (img.file instanceof File) urls[img.id] = URL.createObjectURL(img.file);
    });
    setObjUrls(prev => {
      Object.values(prev).forEach(u => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
      return urls;
    });
    return () => Object.values(urls).forEach(u => { if (u?.startsWith('blob:')) URL.revokeObjectURL(u); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images.map(i => i.id).join('|')]);

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_MENU_IMAGES - images.length;
    const toAdd = files.slice(0, remaining).map((file, idx) => ({
      id: genId(),
      file,
      url: '',
      title: '',
      sort_order: images.length + idx,
    }));
    onChange([...images, ...toAdd]);
    e.target.value = '';
  };

  const remove = (id) => onChange(images.filter(i => i.id !== id));
  const updateTitle = (id, title) => onChange(images.map(i => i.id === id ? { ...i, title } : i));

  const getSrc = (img) => img.file instanceof File ? objUrls[img.id] : (img.url || '');

  return (
    <div>
      {images.length < MAX_MENU_IMAGES && (
        <label style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          padding: '9px 18px', backgroundColor: '#f5f3ef',
          border: '1px solid #ddd4c8', borderRadius: 3,
          fontSize: 12, fontWeight: 600, color: '#555',
          cursor: 'pointer', marginBottom: images.length > 0 ? 12 : 0,
        }}>
          🍽 {images.length === 0 ? 'Upload Menu Images' : `+ Add More (${MAX_MENU_IMAGES - images.length} remaining)`}
          <input
            type="file" multiple accept="image/jpeg,image/png,image/webp"
            onChange={handleFiles} style={{ display: 'none' }}
          />
        </label>
      )}

      {images.length >= MAX_MENU_IMAGES && (
        <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 600, marginBottom: 10 }}>
          Maximum {MAX_MENU_IMAGES} menu images reached
        </p>
      )}

      {/* Image list with title fields */}
      {images.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {images.map((img, idx) => {
            const src = getSrc(img);
            return (
              <div key={img.id} style={{
                display: 'flex', gap: 12, alignItems: 'flex-start',
                padding: 10, backgroundColor: '#faf9f7',
                border: '1px solid #e5ddd0', borderRadius: 3,
              }}>
                {/* Thumbnail */}
                <div style={{ flexShrink: 0, width: 72, height: 54, borderRadius: 2, overflow: 'hidden', backgroundColor: '#f0ebe3' }}>
                  {src && <img src={src} alt={`Menu ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />}
                </div>

                {/* Title input */}
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={img.title || ''}
                    onChange={e => updateTitle(img.id, e.target.value)}
                    placeholder={`Menu image ${idx + 1} caption (e.g. Starter: Truffle Risotto)`}
                    style={{ ...inputStyle, marginBottom: 0, fontSize: 12 }}
                  />
                </div>

                {/* Remove */}
                <button
                  type="button"
                  onClick={() => remove(img.id)}
                  style={{
                    flexShrink: 0, width: 26, height: 26,
                    border: '1px solid #e5ddd0', borderRadius: '50%',
                    backgroundColor: '#fff', color: '#999',
                    fontSize: 14, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// ── Option constants ──────────────────────────────────────────────────────────
const MENU_STYLE_OPTIONS = ['Plated Dinner', 'Tasting Menu', 'Family Style', 'Buffet', 'Custom'];
const DIETARY_OPTIONS    = ['Vegetarian', 'Vegan', 'Halal', 'Kosher', 'Gluten Free', 'Dairy Free'];
const DRINKS_OPTIONS     = ['Open Bar', 'Wine Pairing', 'Signature Cocktails', 'Beer & Spirits', 'Non-Alcoholic', 'Soft Drinks Only'];

// ── Main section ──────────────────────────────────────────────────────────────
const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

const DiningSection = ({ formData, onChange }) => {
  const menu_images = formData?.dining_menu_images || [];
  const [showDiningAI, setShowDiningAI] = useState(false);

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px' }}>
          Dining
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Food is one of the top three decisions couples make. The more detail here, the better. Empty sections are hidden on the listing.
        </p>
      </div>

      {/* Dining Style + Chef */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div>
          <label style={labelStyle}>Dining Style</label>
          <input
            type="text"
            value={formData?.dining_style || ''}
            onChange={e => onChange('dining_style', e.target.value)}
            placeholder="e.g. Michelin-inspired Tuscan farm-to-table"
            style={inputStyle}
          />
        </div>
        <div>
          <label style={labelStyle}>Chef Name <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: '#aaa' }}>(optional)</span></label>
          <input
            type="text"
            value={formData?.dining_chef_name || ''}
            onChange={e => onChange('dining_chef_name', e.target.value)}
            placeholder="e.g. Marco Ricci"
            style={inputStyle}
          />
        </div>
      </div>

      {/* Catering toggles */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <YesNoToggle
          label="In-house Catering"
          value={!!formData?.dining_in_house}
          onChange={v => onChange('dining_in_house', v)}
        />
        <YesNoToggle
          label="External Catering Allowed"
          value={!!formData?.dining_external}
          onChange={v => onChange('dining_external', v)}
        />
      </div>

      {/* Menu Styles */}
      <div style={{ marginBottom: 20 }}>
        <CheckboxGroup
          label="Menu Style"
          options={MENU_STYLE_OPTIONS}
          selected={formData?.dining_menu_styles || []}
          onChange={v => onChange('dining_menu_styles', v)}
        />
      </div>

      {/* Dietary */}
      <div style={{ marginBottom: 20 }}>
        <CheckboxGroup
          label="Dietary Options"
          options={DIETARY_OPTIONS}
          selected={formData?.dining_dietary || []}
          onChange={v => onChange('dining_dietary', v)}
        />
      </div>

      {/* Drinks */}
      <div style={{ marginBottom: 24 }}>
        <CheckboxGroup
          label="Drinks & Bar"
          options={DRINKS_OPTIONS}
          selected={formData?.dining_drinks || []}
          onChange={v => onChange('dining_drinks', v)}
        />
      </div>

      {/* Dining Description */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Dining Description</label>
          <button type="button" onClick={() => setShowDiningAI(v => !v)} style={aiLinkStyle}>
            ✦ Generate with AI
          </button>
        </div>
        {showDiningAI && (
          <div style={{ marginBottom: 10 }}>
            <AIContentGenerator
              feature="dining_description"
              systemPrompt={LUXURY_TONE_SYSTEM}
              userPrompt={buildDiningDescriptionPrompt(formData?.venue_name || formData?.name || '', formData)}
              venueId={formData?.id}
              onInsert={(text) => { onChange('dining_description', text); setShowDiningAI(false); }}
              label="Generate Dining Description"
            />
          </div>
        )}
        <RichTextEditor
          value={formData?.dining_description || ''}
          onChange={html => onChange('dining_description', html)}
          placeholder="Describe the dining experience, cuisine philosophy, local sourcing, seasonal menus, wine list, sommelier, private dining options…"
          minHeight={200}
        />
        <p style={hintStyle}>Supports rich text. This is the editorial description shown on the listing.</p>
      </div>

      {/* Menu Highlight Images */}
      <div>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
          <label style={labelStyle}>Menu Highlights</label>
          <span style={{ fontSize: 10, color: '#aaa' }}>{menu_images.length} / {MAX_MENU_IMAGES} · popup only, not main gallery</span>
        </div>
        <MenuImageManager
          images={menu_images}
          onChange={imgs => onChange('dining_menu_images', imgs)}
        />
        <p style={hintStyle}>
          These images open in a lightbox inside the Dining section only. They do not appear in the main gallery.
          Add a caption for each image (e.g. "Starter: Truffle Risotto").
        </p>
      </div>

    </section>
  );
};

export default DiningSection;
