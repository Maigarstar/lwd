/**
 * CateringCardsSection — Listing Studio editor for the Catering & Dining cards block
 *
 * Fields managed:
 *   catering_enabled  — boolean section toggle
 *   catering_cards    — array (max 3) of:
 *     { id, icon, title, description, subtext, sortOrder }
 *
 * Frontend visibility rule:
 *   Show block only when catering_enabled === true AND at least one card
 *   has title or description content.
 *
 * Icon options correspond to ICON_PATHS keys in VenueProfile.jsx.
 */

import { useState } from 'react';

const MAX_CARDS = 3;

// ── Available icons for card icon selector ────────────────────────────────────
const ICON_OPTIONS = [
  { value: 'dining',   label: '🍽  In-house / Dining' },
  { value: 'cooking',  label: '🥘  Cooking / Catering' },
  { value: 'wine',     label: '🍷  Wine / Sommelier' },
  { value: 'truffle',  label: '🍄  Truffle / Speciality' },
  { value: 'spa',      label: '🌿  Spa / Wellness' },
  { value: 'nature',   label: '🌱  Garden / Nature' },
  { value: 'tour',     label: '📍  Experience / Tour' },
  { value: 'check',    label: '✓   General / Included' },
];

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
          ? 'Catering & Dining cards are visible on the listing'
          : 'Catering & Dining cards are hidden — enable to show them'}
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

// ── Single card editor (collapsible) ─────────────────────────────────────────
function CardEditor({ card, index, total, onUpdate, onRemove, onMove }) {
  const [open, setOpen] = useState(index === 0); // first card open by default

  const set = (key, val) => onUpdate(index, { ...card, [key]: val });

  return (
    <div style={{
      border: '1px solid #ddd4c8',
      borderRadius: 3,
      marginBottom: 10,
      backgroundColor: '#fff',
      overflow: 'hidden',
    }}>
      {/* ── Card header / collapse toggle ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        backgroundColor: open ? '#faf9f7' : '#fff',
        borderBottom: open ? '1px solid #e8e2da' : 'none',
        cursor: 'pointer',
      }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ fontSize: 11, color: '#bbb', width: 16, textAlign: 'center', flexShrink: 0 }}>
          {index + 1}
        </span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: card.title ? '#1a1a1a' : '#aaa' }}>
          {card.title || `Card ${index + 1} — untitled`}
        </span>

        {/* Reorder */}
        <button type="button" onClick={e => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
          style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>
          ↑
        </button>
        <button type="button" onClick={e => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1}
          style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>
          ↓
        </button>

        {/* Remove */}
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove(index); }}
          style={{
            border: '1px solid #e5ddd0', borderRadius: '50%',
            width: 20, height: 20, background: '#fff', color: '#aaa',
            fontSize: 12, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}
        >×</button>

        {/* Collapse indicator */}
        <span style={{ fontSize: 11, color: '#bbb', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* ── Card fields ── */}
      {open && (
        <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Icon selector */}
          <div>
            <label style={labelStyle}>Icon</label>
            <select
              value={card.icon || 'dining'}
              onChange={e => set('icon', e.target.value)}
              style={{ ...inputStyle }}
            >
              {ICON_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>

          {/* Title */}
          <div>
            <label style={labelStyle}>Card Title</label>
            <input
              type="text"
              value={card.title || ''}
              onChange={e => set('title', e.target.value)}
              placeholder="e.g. In-house catering"
              style={inputStyle}
              maxLength={60}
            />
            <p style={hintStyle}>Short, descriptive title for this service</p>
          </div>

          {/* Description */}
          <div>
            <label style={labelStyle}>Description</label>
            <textarea
              value={card.description || ''}
              onChange={e => set('description', e.target.value)}
              placeholder="e.g. Our culinary team sources produce from the estate and surrounding farms."
              style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
              maxLength={300}
            />
            <p style={hintStyle}>2–3 sentences. Shown below the card title.</p>
          </div>

          {/* Subtext (optional) */}
          <div>
            <label style={labelStyle}>Sub-text <span style={{ fontWeight: 400, color: '#aaa', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
            <input
              type="text"
              value={card.subtext || ''}
              onChange={e => set('subtext', e.target.value)}
              placeholder="e.g. Corkage fee £18 per bottle"
              style={inputStyle}
              maxLength={100}
            />
            <p style={hintStyle}>Small note displayed below the description in muted text</p>
          </div>

        </div>
      )}
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
const CateringCardsSection = ({ formData, onChange }) => {
  const enabled = formData?.catering_enabled ?? false;
  const cards   = formData?.catering_cards   ?? [];

  const set = (key, val) => onChange(key, val);

  // ── Card list helpers ──────────────────────────────────────────────────────
  const updateCard = (idx, updated) => {
    const next = [...cards];
    next[idx] = { ...updated, sortOrder: idx };
    set('catering_cards', next);
  };

  const removeCard = (idx) => {
    set('catering_cards', cards.filter((_, i) => i !== idx).map((c, i) => ({ ...c, sortOrder: i })));
  };

  const moveCard = (idx, dir) => {
    const next = [...cards];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set('catering_cards', next.map((c, i) => ({ ...c, sortOrder: i })));
  };

  const addCard = () => {
    if (cards.length >= MAX_CARDS) return;
    set('catering_cards', [
      ...cards,
      {
        id: `card-${Date.now()}`,
        icon: 'dining',
        title: '',
        description: '',
        subtext: '',
        sortOrder: cards.length,
      },
    ]);
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px' }}>
          Dining Services / Catering Features
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Up to 3 feature cards (e.g. In-house catering, External caterers, Sommelier service).
          Each card has an icon, title, and description. Toggle visibility without deleting content.
        </p>
      </div>

      {/* Enable/Disable toggle */}
      <SectionToggle
        enabled={enabled}
        onChange={v => set('catering_enabled', v)}
      />

      {/* Card editors — always visible so content can be prepared in advance */}
      <div style={{ opacity: enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>

        {/* Cards counter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Cards ({cards.length} / {MAX_CARDS})
          </span>
        </div>

        {/* Card list */}
        {cards.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            {cards.map((card, i) => (
              <CardEditor
                key={card.id || i}
                card={card}
                index={i}
                total={cards.length}
                onUpdate={updateCard}
                onRemove={removeCard}
                onMove={moveCard}
              />
            ))}
          </div>
        )}

        {/* Add card button */}
        {cards.length < MAX_CARDS ? (
          <button
            type="button"
            onClick={addCard}
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
            + Add Card
          </button>
        ) : (
          <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, margin: 0 }}>
            Maximum {MAX_CARDS} cards reached
          </p>
        )}

      </div>
    </section>
  );
};

export default CateringCardsSection;
