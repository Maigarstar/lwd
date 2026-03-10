/**
 * ExperiencesSection — Listing Studio editor for On the Estate + Nearby Experiences
 *
 * Two parallel repeatable lists, each with its own enable/disable toggle:
 *
 *   estate_enabled      — boolean toggle for "On the Estate" list
 *   estate_items        — array of experience items (icon, title, status, note, sortOrder)
 *   nearby_enabled      — boolean toggle for "Nearby Experiences" list
 *   nearby_items        — array of experience items (icon, title, status, note, sortOrder)
 *
 * Each item:
 *   { id, icon, title, status ('included'|'private'|'optional'|''), note, sortOrder }
 *
 * Frontend visibility rule:
 *   Show each list only when enabled === true AND items exist with content.
 */

import { useState } from 'react';

// ── Available icons ───────────────────────────────────────────────────────────
const ICON_OPTIONS = [
  { value: 'wine',       label: '🍷  Wine / Sommelier' },
  { value: 'spa',        label: '🌿  Spa / Wellness' },
  { value: 'pool',       label: '🏊  Pool / Water' },
  { value: 'dining',     label: '🍽  Dining' },
  { value: 'cooking',    label: '🥘  Cooking' },
  { value: 'truffle',    label: '🍄  Truffle / Foraging' },
  { value: 'nature',     label: '🌱  Nature / Garden' },
  { value: 'vineyard',   label: '🌾  Vineyard / Estate' },
  { value: 'tour',       label: '📍  Tour / Experience' },
  { value: 'car',        label: '🚗  Car / Transfer' },
  { value: 'golf',       label: '⛳  Golf' },
  { value: 'beach',      label: '🏖  Beach' },
  { value: 'boat',       label: '⛵  Boat' },
  { value: 'hiking',     label: '🥾  Hiking' },
  { value: 'museum',     label: '🏛  Museum / Culture' },
  { value: 'helicopter', label: '🚁  Helicopter' },
  { value: 'wellness',   label: '💆  Wellness' },
  { value: 'check',      label: '✓   General / Included' },
];

const STATUS_OPTIONS = [
  { value: '',         label: '— None' },
  { value: 'included', label: '✦ Included' },
  { value: 'private',  label: '🔒 Private' },
  { value: 'optional', label: '+ Optional' },
];

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em',
  color: '#1a1a1a', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '8px 10px', fontSize: 13,
  border: '1px solid #ddd4c8', borderRadius: 3,
  fontFamily: 'inherit', color: '#333', boxSizing: 'border-box',
  backgroundColor: '#fff',
};
const hintStyle = { fontSize: 10, color: '#aaa', margin: '3px 0 0' };

// ── Section toggle ─────────────────────────────────────────────────────────────
const SectionToggle = ({ enabled, onChange, label, hint }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: enabled ? 'rgba(201,168,76,0.06)' : '#f9f8f6',
    border: `1px solid ${enabled ? 'rgba(201,168,76,0.4)' : '#ddd4c8'}`,
    borderRadius: 3, marginBottom: 14,
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{hint(enabled)}</div>
    </div>
    <button type="button" onClick={() => onChange(!enabled)} style={{
      flexShrink: 0, padding: '6px 16px', fontSize: 12, fontWeight: 700,
      border: 'none', borderRadius: 3,
      backgroundColor: enabled ? '#C9A84C' : '#e5e0d8',
      color: enabled ? '#fff' : '#666',
      cursor: 'pointer', fontFamily: 'inherit',
    }}>
      {enabled ? 'Enabled' : 'Disabled'}
    </button>
  </div>
);

// ── Single experience item editor ─────────────────────────────────────────────
function ExperienceItem({ item, index, total, onUpdate, onRemove, onMove }) {
  const set = (key, val) => onUpdate(index, { ...item, [key]: val });

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '28px 90px 1fr 100px 80px 60px',
      gap: 8, alignItems: 'center',
      padding: '8px 10px',
      border: '1px solid #e8e2da',
      borderRadius: 3,
      backgroundColor: '#fff',
      marginBottom: 6,
    }}>
      {/* Sort number */}
      <span style={{ fontSize: 11, color: '#bbb', textAlign: 'center' }}>{index + 1}</span>

      {/* Icon select */}
      <select value={item.icon || 'nature'} onChange={e => set('icon', e.target.value)}
        style={{ ...inputStyle, padding: '6px 8px', fontSize: 11 }}>
        {ICON_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Title */}
      <input type="text" value={item.title || ''} onChange={e => set('title', e.target.value)}
        placeholder="e.g. Private wine cellar tasting" style={{ ...inputStyle, padding: '7px 10px' }} maxLength={60} />

      {/* Status */}
      <select value={item.status || ''} onChange={e => set('status', e.target.value)}
        style={{ ...inputStyle, padding: '6px 8px', fontSize: 11 }}>
        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Note (season etc.) */}
      <input type="text" value={item.note || ''} onChange={e => set('note', e.target.value)}
        placeholder="summer" style={{ ...inputStyle, padding: '7px 8px', fontSize: 12 }} maxLength={20} />

      {/* Reorder + remove */}
      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}
          style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 13 }}>↑</button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1}
          style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 13 }}>↓</button>
        <button type="button" onClick={() => onRemove(index)}
          style={{ border: '1px solid #e5ddd0', borderRadius: '50%', width: 18, height: 18, background: '#fff', color: '#aaa', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
      </div>
    </div>
  );
}

// ── Single experience list (estate or nearby) ─────────────────────────────────
function ExperienceList({ title, enabledKey, itemsKey, formData, onChange }) {
  const enabled = formData?.[enabledKey] ?? false;
  const items   = formData?.[itemsKey]   ?? [];

  const set = (key, val) => onChange(key, val);

  const updateItem = (idx, updated) => {
    const next = [...items]; next[idx] = { ...updated, sortOrder: idx };
    set(itemsKey, next);
  };
  const removeItem = (idx) => {
    set(itemsKey, items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, sortOrder: i })));
  };
  const moveItem = (idx, dir) => {
    const next = [...items]; const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set(itemsKey, next.map((it, i) => ({ ...it, sortOrder: i })));
  };
  const addItem = () => {
    set(itemsKey, [...items, { id: `exp-${Date.now()}`, icon: 'nature', title: '', status: '', note: '', sortOrder: items.length }]);
  };

  return (
    <div style={{ marginBottom: 32 }}>
      <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#555', margin: '0 0 12px' }}>
        {title}
      </h4>

      <SectionToggle enabled={enabled} onChange={v => set(enabledKey, v)} label="List visibility"
        hint={on => on ? `${title} list is visible on the listing` : `${title} list is hidden`} />

      <div style={{ opacity: enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>
        {/* Column headers */}
        {items.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: '28px 90px 1fr 100px 80px 60px', gap: 8, padding: '0 10px', marginBottom: 4 }}>
            <span />
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Icon</span>
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Title</span>
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Status</span>
            <span style={{ fontSize: 10, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Note</span>
            <span />
          </div>
        )}

        {items.map((item, i) => (
          <ExperienceItem key={item.id || i} item={item} index={i} total={items.length}
            onUpdate={updateItem} onRemove={removeItem} onMove={moveItem} />
        ))}

        <button type="button" onClick={addItem} style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 14px', marginTop: 6,
          border: '1px dashed #C9A84C', borderRadius: 3,
          backgroundColor: 'rgba(201,168,76,0.04)', color: '#9a6f0a',
          fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
        }}>
          + Add Item
        </button>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
const ExperiencesSection = ({ formData, onChange }) => {
  return (
    <section style={{ marginBottom: 16, padding: 20, borderRadius: 8, border: '1px solid rgba(229,221,208,0.4)', boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px' }}>
          On the Estate &amp; Nearby Experiences
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Two experience lists shown side by side. Each can be enabled/disabled independently.
          Each item supports an icon, title, status badge, and optional note.
        </p>
      </div>

      <ExperienceList
        title="On the Estate"
        enabledKey="estate_enabled"
        itemsKey="estate_items"
        formData={formData}
        onChange={onChange}
      />

      <ExperienceList
        title="Nearby Experiences"
        enabledKey="nearby_enabled"
        itemsKey="nearby_items"
        formData={formData}
        onChange={onChange}
      />

    </section>
  );
};

export default ExperiencesSection;
