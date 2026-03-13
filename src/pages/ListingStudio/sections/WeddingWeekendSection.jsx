/**
 * WeddingWeekendSection — Listing Studio editor for the Wedding Weekend day cards
 *
 * Fields managed:
 *   wedding_weekend_enabled  — boolean section toggle
 *   wedding_weekend_subtitle — intro subtitle line below heading
 *   wedding_weekend_days     — array (max 4) of:
 *     { id, day, title, desc, sortOrder }
 *
 * Field limits (enforced in editor + frontend truncation):
 *   day:   max 12 characters (e.g. "Thursday")
 *   title: max 28 characters (e.g. "Arrival Day")
 *   desc:  max 110 characters
 *
 * Frontend visibility rule:
 *   Show section only when wedding_weekend_enabled === true AND days.length > 0.
 */

const MAX_DAYS = 4;

// ── Shared styles ─────────────────────────────────────────────────────────────
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 600,
  textTransform: 'uppercase', letterSpacing: '0.04em',
  color: '#1a1a1a', marginBottom: 6,
};
const inputStyle = {
  width: '100%', padding: '9px 12px', fontSize: 13,
  border: '1px solid #ddd4c8', borderRadius: 3,
  fontFamily: 'inherit', color: '#333', boxSizing: 'border-box',
  backgroundColor: '#fff',
};
const hintStyle = { fontSize: 10, color: '#aaa', margin: '4px 0 0' };
const charCount = (val, max) => {
  const len = (val || '').length;
  return (
    <span style={{ fontSize: 10, color: len >= max ? '#e06c6c' : '#aaa', float: 'right', marginTop: 4 }}>
      {len} / {max}
    </span>
  );
};

// ── Section toggle ─────────────────────────────────────────────────────────────
const SectionToggle = ({ enabled, onChange }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: enabled ? 'rgba(201,168,76,0.06)' : '#f9f8f6',
    border: `1px solid ${enabled ? 'rgba(201,168,76,0.4)' : '#ddd4c8'}`,
    borderRadius: 3, marginBottom: 20,
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>Section visibility</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>
        {enabled ? 'Wedding Weekend section is visible on the listing' : 'Section is hidden — enable to show it'}
      </div>
    </div>
    <button type="button" onClick={() => onChange(!enabled)} style={{
      flexShrink: 0, padding: '7px 20px', fontSize: 12, fontWeight: 700,
      border: 'none', borderRadius: 3,
      backgroundColor: enabled ? '#C9A84C' : '#e5e0d8',
      color: enabled ? '#fff' : '#666',
      cursor: 'pointer', fontFamily: 'inherit', transition: 'background-color 0.15s',
    }}>
      {enabled ? 'Enabled' : 'Disabled'}
    </button>
  </div>
);

// ── Day card editor ───────────────────────────────────────────────────────────
function DayCardEditor({ day, index, total, onUpdate, onRemove, onMove }) {
  const set = (key, val) => onUpdate(index, { ...day, [key]: val });

  return (
    <div style={{ border: '1px solid #ddd4c8', borderRadius: 3, marginBottom: 10, backgroundColor: '#fff', overflow: 'hidden' }}>
      {/* Header bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', backgroundColor: '#faf9f7', borderBottom: '1px solid #e8e2da' }}>
        <span style={{ fontSize: 11, color: '#bbb', width: 16, textAlign: 'center', flexShrink: 0 }}>{index + 1}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: day.day ? '#1a1a1a' : '#aaa' }}>
          {day.day || `Day ${index + 1}`}
          {day.title && <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 8 }}>— {day.title}</span>}
        </span>
        <button type="button" onClick={() => onMove(index, -1)} disabled={index === 0}
          style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>↑</button>
        <button type="button" onClick={() => onMove(index, 1)} disabled={index === total - 1}
          style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>↓</button>
        <button type="button" onClick={() => onRemove(index)} style={{
          border: '1px solid #e5ddd0', borderRadius: '50%', width: 20, height: 20,
          background: '#fff', color: '#aaa', fontSize: 12, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>×</button>
      </div>

      {/* Fields */}
      <div style={{ padding: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12, marginBottom: 12 }}>
          <div>
            <label style={labelStyle}>Day Label</label>
            <input type="text" value={day.day || ''} onChange={e => set('day', e.target.value.slice(0, 12))}
              placeholder="Thursday" style={inputStyle} maxLength={12} />
            {charCount(day.day, 12)}
            <p style={hintStyle}>Max 12 characters</p>
          </div>
          <div>
            <label style={labelStyle}>Card Title</label>
            <input type="text" value={day.title || ''} onChange={e => set('title', e.target.value.slice(0, 28))}
              placeholder="Arrival Day" style={inputStyle} maxLength={28} />
            {charCount(day.title, 28)}
            <p style={hintStyle}>Max 28 characters</p>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Body Text</label>
          <textarea value={day.desc || ''} onChange={e => set('desc', e.target.value.slice(0, 110))}
            placeholder="Guests settle in. Welcome drinks on the loggia. Private vineyard tour at golden hour."
            style={{ ...inputStyle, minHeight: 60, resize: 'none' }} maxLength={110} />
          {charCount(day.desc, 110)}
          <p style={hintStyle}>Max 110 characters — keeps all cards the same height on the listing</p>
        </div>
      </div>
    </div>
  );
}

// ── Main section ───────────────────────────────────────────────────────────────
const WeddingWeekendSection = ({ formData, onChange }) => {
  const enabled  = formData?.wedding_weekend_enabled ?? false;
  const days     = formData?.wedding_weekend_days    ?? [];

  const set = (key, val) => onChange(key, val);

  // ── Day list helpers ─────────────────────────────────────────────────────
  const updateDay = (idx, updated) => {
    const next = [...days]; next[idx] = { ...updated, sortOrder: idx };
    set('wedding_weekend_days', next);
  };
  const removeDay = (idx) => {
    set('wedding_weekend_days', days.filter((_, i) => i !== idx).map((d, i) => ({ ...d, sortOrder: i })));
  };
  const moveDay = (idx, dir) => {
    const next = [...days]; const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set('wedding_weekend_days', next.map((d, i) => ({ ...d, sortOrder: i })));
  };
  const addDay = () => {
    if (days.length >= MAX_DAYS) return;
    set('wedding_weekend_days', [...days, { id: `day-${Date.now()}`, day: '', title: '', desc: '', sortOrder: days.length }]);
  };

  return (
    <section style={{ marginBottom: 16, padding: 20 }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px' }}>
          Your Wedding Weekend
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Up to 4 day cards shown in a responsive grid. All cards maintain a fixed height for visual consistency.
          Toggle visibility without deleting content.
        </p>
      </div>

      {/* Enable/Disable toggle */}
      <SectionToggle enabled={enabled} onChange={v => set('wedding_weekend_enabled', v)} />

      <div style={{ opacity: enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>

        {/* Subtitle */}
        <div style={{ marginBottom: 20 }}>
          <label style={labelStyle}>Section Subtitle</label>
          <input type="text" value={formData?.wedding_weekend_subtitle || ''} onChange={e => set('wedding_weekend_subtitle', e.target.value)}
            placeholder="Villa Rosanova is designed for multi-day celebrations — a full wedding weekend experience"
            style={inputStyle} />
          <p style={hintStyle}>Short intro line shown below the section heading</p>
        </div>

        {/* Day cards */}
        <div style={{ marginBottom: 12 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Day Cards ({days.length} / {MAX_DAYS})
          </p>
          {days.map((day, i) => (
            <DayCardEditor key={day.id || i} day={day} index={i} total={days.length}
              onUpdate={updateDay} onRemove={removeDay} onMove={moveDay} />
          ))}
          {days.length < MAX_DAYS ? (
            <button type="button" onClick={addDay} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              border: '1px dashed #C9A84C', borderRadius: 3,
              backgroundColor: 'rgba(201,168,76,0.04)', color: '#9a6f0a',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Add Day
            </button>
          ) : (
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, margin: 0 }}>Maximum {MAX_DAYS} days reached</p>
          )}
        </div>

      </div>
    </section>
  );
};

export default WeddingWeekendSection;
