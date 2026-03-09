/**
 * ExclusiveUseSection — Listing Studio editor for the Exclusive Use block
 *
 * Fields managed:
 *   exclusive_use_enabled    — boolean section toggle (default false → hidden on listing)
 *   exclusive_use_title      — section heading text
 *   exclusive_use_subtitle   — intro line beneath heading
 *   exclusive_use_price      — headline price string (e.g. "From £28,000")
 *   exclusive_use_subline    — price sub-line (e.g. "Minimum 2 nights · Sleeps 40 guests")
 *   exclusive_use_description— body paragraph (plain text, ~3 sentences)
 *   exclusive_use_cta_text   — CTA button label
 *   exclusive_use_includes   — string[] max 7, fully editable + reorderable
 *
 * Frontend visibility rule:
 *   Show block only when exclusive_use_enabled === true AND at least one
 *   of price/description/includes is populated.
 */

import { useState } from 'react';

const MAX_INCLUDES = 7;

// ── Shared primitives ──────────────────────────────────────────────────────────
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

// ── Section-level enable/disable toggle ───────────────────────────────────────
const SectionToggle = ({ enabled, onChange }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: enabled ? 'rgba(201,168,76,0.06)' : '#f9f8f6',
    border: `1px solid ${enabled ? 'rgba(201,168,76,0.4)' : '#ddd4c8'}`,
    borderRadius: 3,
    marginBottom: 20,
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>
        Section visibility
      </div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
        {enabled
          ? 'Exclusive Use block is visible on the listing'
          : 'Exclusive Use block is hidden — enable to show it'}
      </div>
    </div>
    <button
      type="button"
      onClick={() => onChange(!enabled)}
      style={{
        flexShrink: 0,
        padding: '7px 20px',
        fontSize: 12, fontWeight: 700,
        border: 'none', borderRadius: 3,
        backgroundColor: enabled ? '#C9A84C' : '#e5e0d8',
        color: enabled ? '#fff' : '#666',
        cursor: 'pointer', fontFamily: 'inherit',
        transition: 'background-color 0.15s',
      }}
    >
      {enabled ? 'Enabled' : 'Disabled'}
    </button>
  </div>
);

// ── Includes list item ────────────────────────────────────────────────────────
function IncludesItem({ item, index, total, onUpdate, onRemove, onMove }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '6px 10px',
      border: '1px solid #ddd4c8',
      borderRadius: 3,
      backgroundColor: '#fff',
    }}>
      {/* Drag handle / sort number */}
      <span style={{ fontSize: 11, color: '#bbb', width: 16, textAlign: 'center', flexShrink: 0 }}>
        {index + 1}
      </span>

      {/* Editable text */}
      <input
        type="text"
        value={item}
        onChange={e => onUpdate(index, e.target.value)}
        placeholder="e.g. All 24 rooms & 6 suites"
        style={{ ...inputStyle, flex: 1, padding: '6px 10px', border: 'none', backgroundColor: 'transparent' }}
      />

      {/* Move up/down */}
      <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}
        style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>
        ↑
      </button>
      <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1}
        style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>
        ↓
      </button>

      {/* Remove */}
      <button
        type="button"
        onClick={() => onRemove(index)}
        style={{
          border: '1px solid #e5ddd0', borderRadius: '50%',
          width: 20, height: 20, background: '#fff', color: '#aaa',
          fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >×</button>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
const ExclusiveUseSection = ({ formData, onChange }) => {
  const enabled  = formData?.exclusive_use_enabled ?? false;
  const includes = formData?.exclusive_use_includes ?? [];

  const set = (key, val) => onChange(key, val);

  // ── Includes list helpers ──────────────────────────────────────────────────
  const updateItem = (idx, val) => {
    const next = [...includes];
    next[idx] = val;
    set('exclusive_use_includes', next);
  };

  const removeItem = (idx) => {
    set('exclusive_use_includes', includes.filter((_, i) => i !== idx));
  };

  const moveItem = (idx, dir) => {
    const next = [...includes];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set('exclusive_use_includes', next);
  };

  const addItem = () => {
    if (includes.length >= MAX_INCLUDES) return;
    set('exclusive_use_includes', [...includes, '']);
  };

  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5ddd0' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px' }}>
          Exclusive Use
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Full-estate hire block with price, description, and what's included list.
          Toggle visibility without deleting content.
        </p>
      </div>

      {/* Enable/Disable toggle */}
      <SectionToggle
        enabled={enabled}
        onChange={v => set('exclusive_use_enabled', v)}
      />

      {/* Fields — shown even when disabled so content can be prepared in advance */}
      <div style={{ opacity: enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>

        {/* Row 1 — Title + Subtitle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Section Title</label>
            <input
              type="text"
              value={formData?.exclusive_use_title || ''}
              onChange={e => set('exclusive_use_title', e.target.value)}
              placeholder="Exclusive Use"
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Subtitle / Intro Line</label>
            <input
              type="text"
              value={formData?.exclusive_use_subtitle || ''}
              onChange={e => set('exclusive_use_subtitle', e.target.value)}
              placeholder="Hire the entire estate — just your guests, your celebration, your way"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Row 2 — Price + Subline */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 16, marginBottom: 16 }}>
          <div>
            <label style={labelStyle}>Headline Price</label>
            <input
              type="text"
              value={formData?.exclusive_use_price || ''}
              onChange={e => set('exclusive_use_price', e.target.value)}
              placeholder="From £28,000"
              style={inputStyle}
            />
            <p style={hintStyle}>Displayed in large gold type</p>
          </div>
          <div>
            <label style={labelStyle}>Price Sub-line</label>
            <input
              type="text"
              value={formData?.exclusive_use_subline || ''}
              onChange={e => set('exclusive_use_subline', e.target.value)}
              placeholder="Minimum 2 nights · Sleeps 40 guests"
              style={inputStyle}
            />
            <p style={hintStyle}>Appears below the headline price</p>
          </div>
        </div>

        {/* Row 3 — Body description */}
        <div style={{ marginBottom: 16 }}>
          <label style={labelStyle}>Body Description</label>
          <textarea
            value={formData?.exclusive_use_description || ''}
            onChange={e => set('exclusive_use_description', e.target.value)}
            placeholder="When you book exclusive use, the estate is entirely yours. No other guests. No other events. Just your family and friends in one of the world's most extraordinary settings."
            style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }}
          />
          <p style={hintStyle}>2–3 sentences. Displayed alongside the price on the listing.</p>
        </div>

        {/* Row 4 — CTA text */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>CTA Button Text</label>
          <input
            type="text"
            value={formData?.exclusive_use_cta_text || ''}
            onChange={e => set('exclusive_use_cta_text', e.target.value)}
            placeholder="Enquire About Exclusive Use"
            style={{ ...inputStyle, maxWidth: 380 }}
          />
          <p style={hintStyle}>Button opens the venue enquiry form. Arrow (→) is added automatically.</p>
        </div>

        {/* Row 5 — Includes list */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <label style={{ ...labelStyle, margin: 0 }}>
              What's Included List
              <span style={{ fontWeight: 400, color: '#aaa', textTransform: 'none', letterSpacing: 0, marginLeft: 8 }}>
                ({includes.length} / {MAX_INCLUDES})
              </span>
            </label>
          </div>
          <p style={{ ...hintStyle, marginBottom: 10 }}>
            Up to 7 items. Shown on the right side of the block with gold tick marks. Drag ↑↓ to reorder.
          </p>

          {includes.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 10 }}>
              {includes.map((item, i) => (
                <IncludesItem
                  key={i}
                  item={item}
                  index={i}
                  total={includes.length}
                  onUpdate={updateItem}
                  onRemove={removeItem}
                  onMove={moveItem}
                />
              ))}
            </div>
          )}

          {includes.length < MAX_INCLUDES ? (
            <button
              type="button"
              onClick={addItem}
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 16px',
                border: '1px dashed #C9A84C',
                borderRadius: 3,
                backgroundColor: 'rgba(201,168,76,0.04)',
                color: '#9a6f0a', fontSize: 11, fontWeight: 700,
                cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              + Add Item
            </button>
          ) : (
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, margin: 0 }}>
              Maximum {MAX_INCLUDES} items reached
            </p>
          )}
        </div>

      </div>
    </section>
  );
};

export default ExclusiveUseSection;
