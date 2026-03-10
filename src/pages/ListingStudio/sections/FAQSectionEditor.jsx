/**
 * FAQSectionEditor — Listing Studio editor for the FAQ section
 *
 * Fields managed:
 *   faq_enabled          — boolean section toggle
 *   faq_title            — section heading (default "FAQs")
 *   faq_subtitle         — subtitle line below heading
 *   faq_cta_enabled      — boolean CTA block toggle
 *   faq_cta_headline     — CTA headline
 *   faq_cta_subtext      — CTA sub-text
 *   faq_cta_button_text  — CTA button label
 *   faq_categories       — array (max 4) of:
 *     { id, icon, category, questions: [{id, q, a, sortOrder}], sortOrder }
 *
 * Frontend visibility rule:
 *   Show section only when faq_enabled === true AND at least one category with questions exists.
 */

import { useState } from 'react';

const MAX_CATEGORIES = 4;

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

// ── Section toggle ─────────────────────────────────────────────────────────────
const SectionToggle = ({ enabled, onChange, label, hint }) => (
  <div style={{
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: enabled ? 'rgba(201,168,76,0.06)' : '#f9f8f6',
    border: `1px solid ${enabled ? 'rgba(201,168,76,0.4)' : '#ddd4c8'}`,
    borderRadius: 3, marginBottom: 16,
  }}>
    <div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#1a1a1a' }}>{label}</div>
      <div style={{ fontSize: 11, color: '#999', marginTop: 2 }}>{hint(enabled)}</div>
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

// ── Question item editor ───────────────────────────────────────────────────────
function QuestionItem({ question, index, total, onUpdate, onRemove, onMove }) {
  const [open, setOpen] = useState(index === 0);
  const set = (key, val) => onUpdate(index, { ...question, [key]: val });

  return (
    <div style={{ border: '1px solid #e8e2da', borderRadius: 3, marginBottom: 6, backgroundColor: '#fff', overflow: 'hidden' }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', cursor: 'pointer', backgroundColor: open ? '#faf9f7' : '#fff', borderBottom: open ? '1px solid #e8e2da' : 'none' }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ flex: 1, fontSize: 12, color: question.q ? '#1a1a1a' : '#aaa', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {question.q || 'Untitled question'}
        </span>
        <button type="button" onClick={e => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
          style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 12, padding: '0 2px' }}>↑</button>
        <button type="button" onClick={e => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1}
          style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 12, padding: '0 2px' }}>↓</button>
        <button type="button" onClick={e => { e.stopPropagation(); onRemove(index); }}
          style={{ border: '1px solid #e5ddd0', borderRadius: '50%', width: 18, height: 18, background: '#fff', color: '#aaa', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        <span style={{ fontSize: 10, color: '#bbb' }}>{open ? '▲' : '▼'}</span>
      </div>
      {open && (
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div>
            <label style={labelStyle}>Question</label>
            <input type="text" value={question.q || ''} onChange={e => set('q', e.target.value)}
              placeholder="e.g. Is Villa Rosanova available for exclusive use?" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Answer</label>
            <textarea value={question.a || ''} onChange={e => set('a', e.target.value)}
              placeholder="Detailed answer..." style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Category editor (collapsible) ─────────────────────────────────────────────
function CategoryEditor({ cat, index, total, onUpdate, onRemove, onMove }) {
  const [open, setOpen] = useState(index === 0);

  const updateQuestion = (qIdx, updated) => {
    const next = [...(cat.questions || [])];
    next[qIdx] = { ...updated, sortOrder: qIdx };
    onUpdate(index, { ...cat, questions: next });
  };
  const removeQuestion = (qIdx) => {
    onUpdate(index, { ...cat, questions: (cat.questions || []).filter((_, i) => i !== qIdx).map((q, i) => ({ ...q, sortOrder: i })) });
  };
  const moveQuestion = (qIdx, dir) => {
    const next = [...(cat.questions || [])];
    const target = qIdx + dir;
    if (target < 0 || target >= next.length) return;
    [next[qIdx], next[target]] = [next[target], next[qIdx]];
    onUpdate(index, { ...cat, questions: next.map((q, i) => ({ ...q, sortOrder: i })) });
  };
  const addQuestion = () => {
    onUpdate(index, { ...cat, questions: [...(cat.questions || []), { id: `q-${Date.now()}`, q: '', a: '', sortOrder: (cat.questions || []).length }] });
  };

  return (
    <div style={{ border: '1px solid #ddd4c8', borderRadius: 3, marginBottom: 10, overflow: 'hidden', backgroundColor: '#fff' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', cursor: 'pointer', backgroundColor: open ? '#faf9f7' : '#fff', borderBottom: open ? '1px solid #e8e2da' : 'none' }}
        onClick={() => setOpen(o => !o)}>
        <span style={{ fontSize: 11, color: '#bbb', width: 16, textAlign: 'center' }}>{index + 1}</span>
        <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: cat.category ? '#1a1a1a' : '#aaa' }}>
          {cat.category || `Category ${index + 1}`}
          {cat.questions?.length > 0 && <span style={{ fontWeight: 400, color: '#aaa', marginLeft: 6 }}>({cat.questions.length} Q)</span>}
        </span>
        <button type="button" onClick={e => { e.stopPropagation(); onMove(index, -1); }} disabled={index === 0}
          style={{ border: 'none', background: 'none', cursor: index === 0 ? 'default' : 'pointer', opacity: index === 0 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>↑</button>
        <button type="button" onClick={e => { e.stopPropagation(); onMove(index, 1); }} disabled={index === total - 1}
          style={{ border: 'none', background: 'none', cursor: index === total - 1 ? 'default' : 'pointer', opacity: index === total - 1 ? 0.3 : 1, fontSize: 13, padding: '0 2px' }}>↓</button>
        <button type="button" onClick={e => { e.stopPropagation(); onRemove(index); }}
          style={{ border: '1px solid #e5ddd0', borderRadius: '50%', width: 20, height: 20, background: '#fff', color: '#aaa', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
        <span style={{ fontSize: 11, color: '#bbb', marginLeft: 4 }}>{open ? '▲' : '▼'}</span>
      </div>

      {/* Fields */}
      {open && (
        <div style={{ padding: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={labelStyle}>Category Name</label>
              <input type="text" value={cat.category || ''} onChange={e => onUpdate(index, { ...cat, category: e.target.value })}
                placeholder="e.g. The Venue" style={inputStyle} maxLength={40} />
            </div>
            <div>
              <label style={labelStyle}>Icon</label>
              <input type="text" value={cat.icon || ''} onChange={e => onUpdate(index, { ...cat, icon: e.target.value })}
                placeholder="I" style={inputStyle} maxLength={4} />
              <p style={hintStyle}>Roman numeral (I, II, III, IV)</p>
            </div>
          </div>

          {/* Questions */}
          <div style={{ marginBottom: 10 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
              Questions ({(cat.questions || []).length})
            </p>
            {(cat.questions || []).map((q, qIdx) => (
              <QuestionItem key={q.id || qIdx} question={q} index={qIdx} total={(cat.questions || []).length}
                onUpdate={updateQuestion} onRemove={removeQuestion} onMove={moveQuestion} />
            ))}
            <button type="button" onClick={addQuestion} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
              border: '1px dashed #C9A84C', borderRadius: 3,
              backgroundColor: 'rgba(201,168,76,0.04)', color: '#9a6f0a',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Add Question
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main editor ────────────────────────────────────────────────────────────────
const FAQSectionEditor = ({ formData, onChange }) => {
  const enabled     = formData?.faq_enabled     ?? false;
  const ctaEnabled  = formData?.faq_cta_enabled ?? true;
  const categories  = formData?.faq_categories  ?? [];

  const set = (key, val) => onChange(key, val);

  // ── Category list helpers ──────────────────────────────────────────────────
  const updateCat = (idx, updated) => {
    const next = [...categories];
    next[idx] = { ...updated, sortOrder: idx };
    set('faq_categories', next);
  };
  const removeCat = (idx) => {
    set('faq_categories', categories.filter((_, i) => i !== idx).map((c, i) => ({ ...c, sortOrder: i })));
  };
  const moveCat = (idx, dir) => {
    const next = [...categories];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    set('faq_categories', next.map((c, i) => ({ ...c, sortOrder: i })));
  };
  const addCat = () => {
    if (categories.length >= MAX_CATEGORIES) return;
    set('faq_categories', [...categories, { id: `cat-${Date.now()}`, icon: '', category: '', questions: [], sortOrder: categories.length }]);
  };

  return (
    <section style={{ marginBottom: 16, padding: 20, borderRadius: 8, border: '1px solid rgba(229,221,208,0.4)', boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)' }}>

      {/* Header */}
      <div style={{ marginBottom: 20 }}>
        <h3 style={{ fontSize: 13, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px' }}>
          FAQ Section
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Up to 4 categories of questions with accordion-style answers. Toggle visibility without losing content.
        </p>
      </div>

      {/* Section toggle */}
      <SectionToggle enabled={enabled} onChange={v => set('faq_enabled', v)} label="Section visibility"
        hint={on => on ? 'FAQ section is visible on the listing' : 'FAQ section is hidden — enable to show it'} />

      <div style={{ opacity: enabled ? 1 : 0.55, transition: 'opacity 0.2s' }}>

        {/* Section title + subtitle */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          <div>
            <label style={labelStyle}>Section Title</label>
            <input type="text" value={formData?.faq_title || ''} onChange={e => set('faq_title', e.target.value)}
              placeholder="Your Guide to Villa Rosanova" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Subtitle</label>
            <input type="text" value={formData?.faq_subtitle || ''} onChange={e => set('faq_subtitle', e.target.value)}
              placeholder="Curated answers to every question..." style={inputStyle} />
          </div>
        </div>

        {/* Categories */}
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            Categories ({categories.length} / {MAX_CATEGORIES})
          </p>
          {categories.map((cat, i) => (
            <CategoryEditor key={cat.id || i} cat={cat} index={i} total={categories.length}
              onUpdate={updateCat} onRemove={removeCat} onMove={moveCat} />
          ))}
          {categories.length < MAX_CATEGORIES ? (
            <button type="button" onClick={addCat} style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px',
              border: '1px dashed #C9A84C', borderRadius: 3,
              backgroundColor: 'rgba(201,168,76,0.04)', color: '#9a6f0a',
              fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            }}>
              + Add Category
            </button>
          ) : (
            <p style={{ fontSize: 11, color: '#C9A84C', fontWeight: 700, margin: 0 }}>Maximum {MAX_CATEGORIES} categories reached</p>
          )}
        </div>

        {/* CTA block */}
        <div style={{ paddingTop: 20, borderTop: '1px solid #e8e2da' }}>
          <p style={{ fontSize: 11, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>
            CTA Block — "Still have a question?"
          </p>
          <SectionToggle enabled={ctaEnabled} onChange={v => set('faq_cta_enabled', v)} label="CTA block visibility"
            hint={on => on ? 'CTA shown below FAQ section' : 'CTA block hidden'} />
          <div style={{ opacity: ctaEnabled ? 1 : 0.55, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={labelStyle}>CTA Headline</label>
                <input type="text" value={formData?.faq_cta_headline || ''} onChange={e => set('faq_cta_headline', e.target.value)}
                  placeholder="Still have a question?" style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>CTA Button Text</label>
                <input type="text" value={formData?.faq_cta_button_text || ''} onChange={e => set('faq_cta_button_text', e.target.value)}
                  placeholder="Ask a question" style={inputStyle} />
              </div>
            </div>
            <div>
              <label style={labelStyle}>CTA Sub-text</label>
              <input type="text" value={formData?.faq_cta_subtext || ''} onChange={e => set('faq_cta_subtext', e.target.value)}
                placeholder="Our team responds within 2 hours — we'd love to help." style={inputStyle} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FAQSectionEditor;
