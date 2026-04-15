/**
 * ExclusiveUseSection, Listing Studio editor for the Exclusive Use block
 *
 * Fields managed:
 *   exclusive_use_enabled   , boolean section toggle (default false → hidden on listing)
 *   exclusive_use_title     , section heading text
 *   exclusive_use_subtitle  , intro line beneath heading
 *   exclusive_use_price     , headline price string (e.g. "From £28,000")
 *   exclusive_use_subline   , price sub-line (e.g. "Minimum 2 nights · Sleeps 40 guests")
 *   exclusive_use_description -  body paragraph (plain text, ~3 sentences)
 *   exclusive_use_cta_text  , CTA button label
 *   exclusive_use_includes  , string[] max 7, fully editable + reorderable
 *
 * Frontend visibility rule:
 *   Show block only when exclusive_use_enabled === true AND at least one
 *   of price/description/includes is populated.
 */

import { useState } from 'react';
import AIContentGenerator from '../../../components/AIAssistant/AIContentGenerator';
import {
  LUXURY_TONE_SYSTEM,
  buildExclusiveUsePrompt,
  EXCLUSIVE_USE_LOOKUP_SYSTEM,
  buildExclusiveUseLookupPrompt,
} from '../../../lib/aiPrompts';

// Tolerant JSON extractor — strips markdown fences and falls back to first {...}
// block. Mirrors the helper used in the other lookup sections.
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

const aiLinkStyle = {
  fontSize: 11, color: '#C9A84C', background: 'none', border: 'none',
  cursor: 'pointer', fontFamily: 'inherit', padding: 0,
};

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
          : 'Exclusive Use block is hidden, enable to show it'}
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
  const [showDescAI, setShowDescAI] = useState(false);
  const [showLookupAI, setShowLookupAI] = useState(false);

  const set = (key, val) => onChange(key, val);

  // ── Full Exclusive Use lookup ──────────────────────────────────────────────
  const venueId      = formData?.id;
  const venueName    = formData?.venue_name || formData?.name || '';
  const websiteUrl   = formData?.website || formData?.website_url || '';
  const locationHint = [formData?.city, formData?.region, formData?.country]
    .filter(Boolean)
    .join(', ');

  const handleLookupInsert = (text) => {
    const parsed = extractJsonObject(text);
    if (!parsed || typeof parsed !== 'object') {
      alert('AI did not return valid JSON. Try again or fill in the fields manually.');
      return;
    }

    const cleanStr = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    let appliedAny = false;

    const title    = cleanStr(parsed.title,    40);
    const subtitle = cleanStr(parsed.subtitle, 120);
    const price    = cleanStr(parsed.price,    60);
    const subline  = cleanStr(parsed.subline,  120);
    const desc     = cleanStr(parsed.description, 360);
    const cta      = cleanStr(parsed.cta_text, 40);

    if (title)    { set('exclusive_use_title',       title);    appliedAny = true; }
    if (subtitle) { set('exclusive_use_subtitle',    subtitle); appliedAny = true; }
    if (price)    { set('exclusive_use_price',       price);    appliedAny = true; }
    if (subline)  { set('exclusive_use_subline',     subline);  appliedAny = true; }
    if (desc)     { set('exclusive_use_description', desc);     appliedAny = true; }
    if (cta)      { set('exclusive_use_cta_text',    cta);      appliedAny = true; }

    if (Array.isArray(parsed.includes)) {
      const newIncludes = parsed.includes
        .map(it => cleanStr(it, 80))
        .filter(Boolean)
        .slice(0, MAX_INCLUDES);
      if (newIncludes.length > 0) {
        set('exclusive_use_includes', newIncludes);
        appliedAny = true;
      }
    }

    if (!appliedAny) {
      alert('AI returned a valid response but no usable exclusive-use info. The venue may not offer full-estate hire.');
      return;
    }

    // Auto-enable so the user immediately sees it on the listing
    if (!enabled) set('exclusive_use_enabled', true);
    setShowLookupAI(false);
  };

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
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 4 }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: 0 }}>
            Exclusive Use
          </h3>
          <button type="button" onClick={() => setShowLookupAI(v => !v)} style={aiLinkStyle}>
            ✦ Find exclusive use with AI
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Full-estate hire block with price, description, and what's included list.
          Toggle visibility without deleting content.
        </p>
        {showLookupAI && (
          <div style={{ marginTop: 12 }}>
            <AIContentGenerator
              feature="exclusive_use_lookup"
              systemPrompt={EXCLUSIVE_USE_LOOKUP_SYSTEM}
              userPrompt={buildExclusiveUseLookupPrompt(venueName, websiteUrl, locationHint)}
              venueId={venueId}
              onInsert={handleLookupInsert}
              label="Find Exclusive Use Info"
            />
            <p style={hintStyle}>
              AI will research the venue's full-estate buyout offering and fill the title, price, subline, description, CTA and What's Included list. Review every field before saving — never publish unverified prices or capacity numbers.
            </p>
          </div>
        )}
      </div>

      {/* Enable/Disable toggle */}
      <SectionToggle
        enabled={enabled}
        onChange={v => set('exclusive_use_enabled', v)}
      />

      {/* Fields, shown even when disabled so content can be prepared in advance */}
      <div style={{ opacity: enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>

        {/* Row 1, Title + Subtitle */}
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
              placeholder="Hire the entire estate, just your guests, your celebration, your way"
              style={inputStyle}
            />
          </div>
        </div>

        {/* Row 2, Price + Subline */}
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

        {/* Row 3, Body description */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Body Description</label>
            <button type="button" onClick={() => setShowDescAI(v => !v)} style={aiLinkStyle}>
              ✦ Generate with AI
            </button>
          </div>
          {showDescAI && (
            <div style={{ marginBottom: 10 }}>
              <AIContentGenerator
                feature="exclusive_use_description"
                systemPrompt={LUXURY_TONE_SYSTEM}
                userPrompt={buildExclusiveUsePrompt(
                  formData?.venue_name || formData?.name || '',
                  { location: [formData?.city, formData?.region, formData?.country].filter(Boolean).join(', '),
                    price: formData?.exclusive_use_price,
                    totalRooms: formData?.total_rooms,
                    capacity: formData?.capacity }
                )}
                venueId={formData?.id}
                onInsert={(text) => { onChange('exclusive_use_description', text); setShowDescAI(false); }}
                label="Generate Description"
              />
            </div>
          )}
          <textarea
            value={formData?.exclusive_use_description || ''}
            onChange={e => set('exclusive_use_description', e.target.value)}
            placeholder="When you book exclusive use, the estate is entirely yours. No other guests. No other events. Just your family and friends in one of the world's most extraordinary settings."
            style={{ ...inputStyle, minHeight: 88, resize: 'vertical' }}
          />
          <p style={hintStyle}>2–3 sentences. Displayed alongside the price on the listing.</p>
        </div>

        {/* Row 4, CTA text */}
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

        {/* Row 5, Includes list */}
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
