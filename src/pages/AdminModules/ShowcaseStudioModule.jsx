// ─── src/pages/AdminModules/ShowcaseStudioModule.jsx ─────────────────────────
// Showcase Studio — admin builder for dynamic showcase pages.
// Follows the locked Studio Builder pattern.
//
// Toolbar: [Duplicate] [AI Fill] left · [Discard] [Save Draft] [Publish] | Split/Editor/Preview right
// Left panel: section manager + content editor
// Right panel: live preview (ShowcaseRenderer, isPreview=true)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import ShowcaseRenderer from '../ShowcaseRenderer';
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
} from '../../services/showcaseService';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';
const GOLD = '#C9A84C';

// ── Shared style helpers ──────────────────────────────────────────────────────
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

// ── Section content editor ────────────────────────────────────────────────────
function SectionEditor({ section, onChange, C }) {
  if (!section) return (
    <div style={{ padding: '40px 32px', textAlign: 'center' }}>
      <p style={{ fontFamily: NU, fontSize: 13, color: C.grey2 }}>
        Select a section to edit its content.
      </p>
    </div>
  );

  const reg = SECTION_REGISTRY[section.type];
  const content = section.content || {};
  const layout  = section.layout  || {};

  function setContent(key, value) {
    onChange({ ...section, content: { ...content, [key]: value } });
  }
  function setLayout(key, value) {
    onChange({ ...section, layout: { ...layout, [key]: value } });
  }

  const Field = ({ label: fieldLabel, fieldKey, type = 'text', rows }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl(C)}>{fieldLabel}</label>
      {type === 'textarea' ? (
        <textarea
          value={content[fieldKey] || ''}
          onChange={e => setContent(fieldKey, e.target.value)}
          rows={rows || 4}
          style={{ ...inp(C), resize: 'vertical' }}
        />
      ) : (
        <input
          type="text"
          value={content[fieldKey] || ''}
          onChange={e => setContent(fieldKey, e.target.value)}
          style={inp(C)}
        />
      )}
    </div>
  );

  const LayoutSelect = ({ label: fieldLabel, fieldKey, options }) => (
    <div style={{ marginBottom: 16 }}>
      <label style={lbl(C)}>{fieldLabel}</label>
      <select
        value={layout[fieldKey] || options[0].value}
        onChange={e => setLayout(fieldKey, e.target.value)}
        style={{ ...inp(C), cursor: 'pointer' }}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* Section type label */}
      <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.18em', textTransform: 'uppercase', color: GOLD, fontWeight: 700, marginBottom: 20 }}>
        {reg?.label || section.type}
      </div>

      {/* Per-type editors */}
      {section.type === 'hero' && (
        <>
          <Field label="Title" fieldKey="title" />
          <Field label="Tagline" fieldKey="tagline" />
          <Field label="Hero Image URL" fieldKey="image" />
          <div style={{ marginBottom: 16 }}>
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

      {section.type === 'stats' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <LayoutSelect label="Variant" fieldKey="variant" options={[{ value: 'strip', label: 'Strip' }, { value: 'over-image', label: 'Over Image' }]} />
          <div style={{ marginBottom: 12 }}>
            <label style={lbl(C)}>Stats (max 6)</label>
            {(content.items || []).map((item, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, marginBottom: 8 }}>
                <input placeholder="Value" value={item.value || ''} onChange={e => { const next = [...content.items]; next[idx] = {...next[idx], value: e.target.value}; setContent('items', next); }} style={{ ...inp(C), fontSize: 12 }} />
                <input placeholder="Label" value={item.label || ''} onChange={e => { const next = [...content.items]; next[idx] = {...next[idx], label: e.target.value}; setContent('items', next); }} style={{ ...inp(C), fontSize: 12 }} />
                <input placeholder="Sublabel" value={item.sublabel || ''} onChange={e => { const next = [...content.items]; next[idx] = {...next[idx], sublabel: e.target.value}; setContent('items', next); }} style={{ ...inp(C), fontSize: 12 }} />
              </div>
            ))}
            {(content.items || []).length < 6 && (
              <button onClick={() => setContent('items', [...(content.items || []), { value: '', label: '', sublabel: '' }])} style={{ fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 3, padding: '5px 12px', cursor: 'pointer' }}>
                + Add Stat
              </button>
            )}
          </div>
        </>
      )}

      {section.type === 'intro' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={5} />
        </>
      )}

      {section.type === 'feature' && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={4} />
          <Field label="Image URL" fieldKey="image" />
          <LayoutSelect label="Layout" fieldKey="variant" options={[{ value: 'image-left', label: 'Image Left' }, { value: 'image-right', label: 'Image Right' }]} />
        </>
      )}

      {section.type === 'quote' && (
        <>
          <Field label="Quote Text" fieldKey="text" type="textarea" rows={3} />
          <Field label="Attribution" fieldKey="attribution" />
          <Field label="Role / Title" fieldKey="attributionRole" />
          <LayoutSelect label="Variant" fieldKey="variant" options={[{ value: 'centered', label: 'Centred' }, { value: 'with-portrait', label: 'With Portrait' }]} />
          {layout.variant === 'with-portrait' && <Field label="Portrait Image URL" fieldKey="image" />}
        </>
      )}

      {section.type === 'mosaic' && (
        <>
          <Field label="Title" fieldKey="title" />
          <Field label="Body" fieldKey="body" type="textarea" rows={3} />
          <div style={{ marginBottom: 12 }}>
            <label style={lbl(C)}>Images (2–4)</label>
            {(content.images || []).map((img, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 6, marginBottom: 6 }}>
                <input placeholder={`Image ${idx + 1} URL`} value={img.url || ''} onChange={e => { const next = [...content.images]; next[idx] = {...next[idx], url: e.target.value}; setContent('images', next); }} style={{ ...inp(C), fontSize: 12 }} />
                <input placeholder="Alt" value={img.alt || ''} onChange={e => { const next = [...content.images]; next[idx] = {...next[idx], alt: e.target.value}; setContent('images', next); }} style={{ ...inp(C), fontSize: 12, width: 80 }} />
              </div>
            ))}
          </div>
        </>
      )}

      {section.type === 'gallery' && (
        <>
          <Field label="Title" fieldKey="title" />
          <div style={{ marginBottom: 12 }}>
            <label style={lbl(C)}>Images</label>
            {(content.images || []).map((img, idx) => (
              <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 6 }}>
                <input placeholder="Image URL" value={img.url || ''} onChange={e => { const next = [...content.images]; next[idx] = {...next[idx], url: e.target.value}; setContent('images', next); }} style={{ ...inp(C), fontSize: 12 }} />
                <input placeholder="Caption" value={img.caption || ''} onChange={e => { const next = [...content.images]; next[idx] = {...next[idx], caption: e.target.value}; setContent('images', next); }} style={{ ...inp(C), fontSize: 12 }} />
              </div>
            ))}
            <button onClick={() => setContent('images', [...(content.images || []), { url: '', caption: '' }])} style={{ fontFamily: NU, fontSize: 11, color: GOLD, background: 'none', border: `1px solid ${GOLD}44`, borderRadius: 3, padding: '5px 12px', cursor: 'pointer', marginTop: 4 }}>
              + Add Image
            </button>
          </div>
        </>
      )}

      {['dining', 'spaces', 'wellness', 'weddings'].includes(section.type) && (
        <>
          <Field label="Eyebrow" fieldKey="eyebrow" />
          <Field label="Headline" fieldKey="headline" />
          <Field label="Body" fieldKey="body" type="textarea" rows={4} />
          <Field label="Image URL" fieldKey="image" />
          <LayoutSelect label="Layout" fieldKey="variant" options={[{ value: 'image-left', label: 'Image Left' }, { value: 'image-right', label: 'Image Right' }]} />
        </>
      )}

      {section.type === 'image-full' && (
        <>
          <Field label="Image URL" fieldKey="url" />
          <Field label="Alt Text" fieldKey="alt" />
          <Field label="Caption" fieldKey="caption" />
          <div style={{ marginBottom: 16 }}>
            <label style={lbl(C)}>Height</label>
            <select value={content.height || '60vh'} onChange={e => setContent('height', e.target.value)} style={{ ...inp(C), cursor: 'pointer' }}>
              {['40vh','50vh','60vh','70vh','80vh','90vh'].map(h => <option key={h} value={h}>{h}</option>)}
            </select>
          </div>
        </>
      )}

      {section.type === 'cta' && (
        <>
          <Field label="Headline" fieldKey="headline" />
          <Field label="Subline" fieldKey="subline" />
          <Field label="Background Image URL" fieldKey="background" />
          <Field label="Venue Name Override" fieldKey="venueName" />
        </>
      )}

      {section.type === 'related' && (
        <>
          <Field label="Section Title" fieldKey="title" />
          <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, lineHeight: 1.7 }}>
            Related venues are linked by listing ID. Enter comma-separated listing IDs below (max 3).
          </div>
          <div style={{ marginTop: 8 }}>
            <input
              type="text"
              value={(content.items || []).join(', ')}
              onChange={e => setContent('items', e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
              placeholder="listing-id-1, listing-id-2"
              style={inp(C)}
            />
          </div>
        </>
      )}

      {/* Layout: accent background colour (for most section types) */}
      {['intro','feature','quote','stats','dining','spaces','wellness','weddings'].includes(section.type) && (
        <div style={{ marginTop: 20, paddingTop: 16, borderTop: `1px solid ${C.border}` }}>
          <label style={lbl(C)}>Panel Background</label>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['#0f0e0c','#1a1209','#131c14','#0d1a1f','#1a1616','#f5f0e8'].map(col => (
              <button
                key={col}
                onClick={() => setLayout('accentBg', col)}
                style={{
                  width: 28, height: 28, borderRadius: 3,
                  background: col,
                  border: layout.accentBg === col ? `2px solid ${GOLD}` : `1px solid ${C.border}`,
                  cursor: 'pointer',
                }}
              />
            ))}
            <input
              type="text"
              value={layout.accentBg || ''}
              onChange={e => setLayout('accentBg', e.target.value)}
              placeholder="#1a1209"
              style={{ ...inp(C), width: 90, fontSize: 11 }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ── Template picker modal ──────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onBlank, C }) {
  return (
    <div
      onClick={onBlank}
      style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '36px 32px', maxWidth: 600, width: '100%' }}>
        <div style={{ fontFamily: GD, fontSize: 22, color: C.off, fontWeight: 400, marginBottom: 8 }}>
          Start with a template
        </div>
        <p style={{ fontFamily: NU, fontSize: 13, color: C.grey, marginBottom: 28, lineHeight: 1.7 }}>
          Choose a structural starting point. All content will be pre-filled with editorial placeholder copy — ready to customise.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 20 }}>
          {Object.values(SHOWCASE_TEMPLATES).map(tmpl => (
            <button key={tmpl.key} onClick={() => onSelect(tmpl.key)} style={{
              background: C.bg, border: `1px solid ${C.border}`, borderRadius: 6,
              padding: '16px 18px', textAlign: 'left', cursor: 'pointer',
              transition: 'border-color 0.15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
            onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
            >
              <div style={{ fontSize: 22, marginBottom: 8 }}>{tmpl.icon}</div>
              <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: C.off, marginBottom: 4 }}>{tmpl.label}</div>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, lineHeight: 1.6 }}>{tmpl.description}</div>
            </button>
          ))}
        </div>
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

// ── Add section picker ────────────────────────────────────────────────────────
function SectionPicker({ onAdd, onClose, C }) {
  return (
    <div
      onClick={onClose}
      style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
    }}>
      <div
        onClick={e => e.stopPropagation()}
        style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '32px', maxWidth: 520, width: '100%', maxHeight: '80vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div style={{ fontFamily: GD, fontSize: 20, color: C.off, fontWeight: 400 }}>Add Section</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: C.grey, fontSize: 18, cursor: 'pointer' }}>✕</button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {SECTION_TYPE_ORDER.map(type => {
            const reg = SECTION_REGISTRY[type];
            return (
              <button key={type} onClick={() => { onAdd(type); onClose(); }} style={{
                background: C.bg, border: `1px solid ${C.border}`, borderRadius: 4,
                padding: '12px 14px', textAlign: 'left', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 10,
                transition: 'border-color 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.borderColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderColor = C.border}
              >
                <span style={{ fontSize: 16, color: GOLD, flexShrink: 0 }}>{reg.icon}</span>
                <span style={{ fontFamily: NU, fontSize: 12, color: C.off }}>{reg.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main ShowcaseStudioModule ──────────────────────────────────────────────────
export default function ShowcaseStudioModule({ C, showcaseId, onBack }) {
  const [viewMode,      setViewMode]      = useState('split');   // split | editor | preview
  const [showcase,      setShowcase]      = useState(null);
  const [sections,      setSections]      = useState([]);
  const [selectedId,    setSelectedId]    = useState(null);
  const [saving,        setSaving]        = useState(false);
  const [publishing,    setPublishing]    = useState(false);
  const [dirty,         setDirty]         = useState(false);
  const [showPicker,    setShowPicker]    = useState(false);
  const [showTemplate,  setShowTemplate]  = useState(false);
  const [toast,         setToast]         = useState(null);

  const saveTimer = useRef(null);

  // Show toast notification
  function notify(message, type = 'success') {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }

  // Load showcase on mount
  useEffect(() => {
    if (!showcaseId) {
      // New showcase — show template picker
      setShowcase({ title: 'Untitled Showcase', slug: '', status: 'draft', hero_image_url: '' });
      setShowTemplate(true);
      return;
    }
    fetchShowcases().then(showcases => {
      const found = showcases.find(s => s.id === showcaseId);
      if (found) {
        setShowcase(found);
        setSections(Array.isArray(found.sections) ? found.sections : []);
      }
    });
  }, [showcaseId]);

  // Auto-save draft on section changes (debounced 1.5s)
  useEffect(() => {
    if (!showcase?.id || !dirty) return;
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveShowcaseDraft(showcase.id, { sections })
        .catch(e => console.warn('[ShowcaseStudio] auto-save:', e.message));
    }, 1500);
    return () => clearTimeout(saveTimer.current);
  }, [sections, dirty, showcase?.id]);

  const selectedSection = sections.find(s => s.id === selectedId) || null;

  function handleSectionChange(updated) {
    setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
    setDirty(true);
  }

  function handleAddSection(type) {
    const newSection = createSection(type);
    setSections(prev => [...prev, newSection]);
    setSelectedId(newSection.id);
    setDirty(true);
  }

  function handleRemoveSection(id) {
    setSections(prev => prev.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
    setDirty(true);
  }

  function handleMoveSection(id, direction) {
    setSections(prev => {
      const idx = prev.findIndex(s => s.id === id);
      if (idx === -1) return prev;
      const next = [...prev];
      const swap = direction === 'up' ? idx - 1 : idx + 1;
      if (swap < 0 || swap >= next.length) return prev;
      [next[idx], next[swap]] = [next[swap], next[idx]];
      return next;
    });
    setDirty(true);
  }

  function handleApplyTemplate(key) {
    const tmplSections = getTemplateSections(key);
    setSections(tmplSections);
    setSelectedId(tmplSections[0]?.id || null);
    setShowcase(prev => ({ ...prev, template_key: key }));
    setShowTemplate(false);
    setDirty(true);
  }

  async function handleSaveDraft() {
    setSaving(true);
    try {
      // Create showcase if it doesn't have an ID yet
      let showcaseId = showcase?.id;
      if (!showcaseId) {
        const created = await createShowcase({
          name: showcase.title || 'Untitled Showcase',
          slug: showcase.slug || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          sections: [],
        });
        showcaseId = created.id;
        setShowcase(prev => ({ ...prev, id: created.id }));
      }

      await saveShowcaseDraft(showcaseId, { sections, title: showcase.title, slug: showcase.slug, hero_image_url: showcase.hero_image_url });
      setDirty(false);
      notify('Draft saved');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      // Create showcase if it doesn't have an ID yet
      let showcaseId = showcase?.id;
      if (!showcaseId) {
        const created = await createShowcase({
          name: showcase.title || 'Untitled Showcase',
          slug: showcase.slug || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          sections: sections,
          status: 'draft',
        });
        showcaseId = created.id;
        setShowcase(prev => ({ ...prev, id: created.id }));
      } else {
        // Update existing showcase
        await updateShowcase(showcaseId, {
          name: showcase.title,
          slug: showcase.slug,
          heroImage: showcase.hero_image_url,
          sections: sections,
          status: 'draft',
        });
      }
      setDirty(false);
      notify('Showcase saved');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    const { hasErrors } = validateShowcase(sections);
    if (hasErrors) { notify('Please fix validation errors before publishing', 'error'); return; }
    setPublishing(true);
    try {
      // Create showcase if it doesn't have an ID yet
      let showcaseId = showcase?.id;
      if (!showcaseId) {
        const created = await createShowcase({
          name: showcase.title || 'Untitled Showcase',
          slug: showcase.slug || `showcase-${Date.now()}`,
          heroImage: showcase.hero_image_url || '',
          sections: [],
        });
        showcaseId = created.id;
        setShowcase(prev => ({ ...prev, id: created.id }));
      }

      await publishShowcase(showcaseId, sections);
      setDirty(false);
      notify('Published successfully');
    } catch (e) {
      notify(e.message, 'error');
    } finally {
      setPublishing(false);
    }
  }

  async function handleDuplicate() {
    if (!showcase?.id) return;
    try {
      const copy = await duplicateShowcase(showcase.id);
      notify(`Duplicated as "${copy.name || copy.title}"`);
    } catch (e) {
      notify(e.message, 'error');
    }
  }

  function handleDiscard() {
    if (dirty && !window.confirm('Discard unsaved changes?')) return;
    onBack?.();
  }

  // ── Toolbar ────────────────────────────────────────────────────────────────
  const toolbarStyle = {
    height: 52,
    background: C.sidebar,
    borderBottom: `1px solid ${C.border}`,
    display: 'flex', alignItems: 'center',
    padding: '0 20px', gap: 10,
    flexShrink: 0, zIndex: 10,
  };

  const btnSolid = { fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '7px 16px', background: C.off, color: '#ffffff', border: 'none', borderRadius: 3, cursor: 'pointer' };
  const btnOutline = { ...btnSolid, background: 'none', color: C.off, border: `1px solid ${C.border}` };
  const btnGold = { ...btnSolid, background: GOLD, color: '#0a0906' };
  const btnLink = { fontFamily: NU, fontSize: 11, color: C.grey2, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px', textDecoration: 'none' };
  const btnLinkActive = { ...btnLink, color: C.off, textDecoration: 'underline' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: C.bg, overflow: 'hidden' }}>

      {/* Toolbar */}
      <div style={toolbarStyle}>
        {/* Left */}
        <button onClick={handleDuplicate} style={btnOutline}>Duplicate</button>
        <button style={btnOutline}>AI Fill ✦</button>
        <button onClick={() => setShowTemplate(true)} style={btnOutline}>Choose Template</button>
        <div style={{ flex: 1 }} />
        {/* Right */}
        <button onClick={handleDiscard} style={btnOutline}>Discard</button>
        <button onClick={handleSave} disabled={saving} style={btnOutline}>
          {saving ? 'Saving…' : 'Save'}
        </button>
        <button onClick={handleSaveDraft} disabled={saving} style={btnSolid}>
          {saving ? 'Saving…' : 'Save Draft'}
        </button>
        <button onClick={handlePublish} disabled={publishing} style={btnGold}>
          {publishing ? 'Publishing…' : 'Publish'}
        </button>
        <div style={{ width: 1, height: 20, background: C.border, margin: '0 6px' }} />
        {['split','editor','preview'].map(m => (
          <button key={m} onClick={() => setViewMode(m)} style={viewMode === m ? btnLinkActive : btnLink}>
            {m.charAt(0).toUpperCase() + m.slice(1)}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* Left panel — section manager + editor */}
        {viewMode !== 'preview' && (
          <div style={{
            width: viewMode === 'editor' ? '100%' : 340,
            flexShrink: 0,
            background: C.sidebar,
            borderRight: `1px solid ${C.border}`,
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}>
            {/* Showcase meta header */}
            <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}` }}>
              <input
                value={showcase?.title || ''}
                onChange={e => setShowcase(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Showcase title"
                style={{ ...inp(C), fontFamily: GD, fontSize: 18, fontWeight: 400, border: 'none', background: 'none', padding: '0', marginBottom: 6 }}
              />
              <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Slug:</span>
                <input
                  value={showcase?.slug || ''}
                  onChange={e => setShowcase(prev => ({ ...prev, slug: e.target.value }))}
                  placeholder="your-showcase-slug"
                  style={{ ...inp(C), fontSize: 11, padding: '2px 6px', flex: 1 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 6 }}>
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey2, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Hero:</span>
                <input
                  value={showcase?.hero_image_url || ''}
                  onChange={e => setShowcase(prev => ({ ...prev, hero_image_url: e.target.value }))}
                  placeholder="Hero image URL"
                  style={{ ...inp(C), fontSize: 11, padding: '2px 6px', flex: 1 }}
                />
              </div>
            </div>

            {/* Section list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <div style={{ padding: '12px 16px 0' }}>
                <div style={{ fontFamily: NU, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.grey2, fontWeight: 700, marginBottom: 8 }}>
                  Sections ({sections.length})
                </div>
                {sections.map((s, idx) => {
                  const reg = SECTION_REGISTRY[s.type];
                  const isSelected = selectedId === s.id;
                  return (
                    <div
                      key={s.id}
                      onClick={() => setSelectedId(isSelected ? null : s.id)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 10px', marginBottom: 2,
                        background: isSelected ? `${GOLD}18` : 'transparent',
                        border: `1px solid ${isSelected ? GOLD + '44' : 'transparent'}`,
                        borderRadius: 4, cursor: 'pointer',
                      }}
                    >
                      <span style={{ color: GOLD, fontSize: 12, flexShrink: 0 }}>{reg?.icon || '◈'}</span>
                      <span style={{ fontFamily: NU, fontSize: 12, color: C.off, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {reg?.label || s.type}
                        {(s.content?.title || s.content?.headline || s.content?.text) && (
                          <span style={{ color: C.grey2, marginLeft: 6, fontSize: 10 }}>
                            — {(s.content?.title || s.content?.headline || s.content?.text || '').slice(0, 22)}
                          </span>
                        )}
                      </span>
                      <div style={{ display: 'flex', gap: 2 }} onClick={e => e.stopPropagation()}>
                        <button onClick={() => handleMoveSection(s.id, 'up')} disabled={idx === 0} style={{ background: 'none', border: 'none', color: C.grey2, cursor: 'pointer', fontSize: 11, padding: '1px 4px' }}>↑</button>
                        <button onClick={() => handleMoveSection(s.id, 'down')} disabled={idx === sections.length - 1} style={{ background: 'none', border: 'none', color: C.grey2, cursor: 'pointer', fontSize: 11, padding: '1px 4px' }}>↓</button>
                        <button onClick={() => handleRemoveSection(s.id)} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 11, padding: '1px 4px' }}>✕</button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add section button */}
              <div style={{ padding: '12px 16px 20px' }}>
                <button onClick={() => setShowPicker(true)} style={{
                  width: '100%', padding: '10px', background: 'none',
                  border: `1px dashed ${GOLD}44`, borderRadius: 4,
                  fontFamily: NU, fontSize: 11, color: GOLD, cursor: 'pointer',
                  letterSpacing: '0.08em',
                }}>
                  + Add Section
                </button>
              </div>

              {/* Section content editor */}
              {selectedSection && (
                <div style={{ borderTop: `1px solid ${C.border}` }}>
                  <SectionEditor section={selectedSection} onChange={handleSectionChange} C={C} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Right panel — live preview */}
        {viewMode !== 'editor' && (
          <div style={{ flex: 1, overflowY: 'auto', background: '#0a0a08' }}>
            {sections.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                <div style={{ fontFamily: GD, fontSize: 26, color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>Live preview will appear here</div>
                <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>Add sections to begin →</div>
              </div>
            ) : (
              <ShowcaseRenderer
                sections={sections}
                showcase={showcase || {}}
                isPreview={true}
              />
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      {showTemplate && (
        <TemplatePicker
          onSelect={handleApplyTemplate}
          onBlank={() => setShowTemplate(false)}
          C={C}
        />
      )}
      {showPicker && (
        <SectionPicker
          onAdd={handleAddSection}
          onClose={() => setShowPicker(false)}
          C={C}
        />
      )}

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 300,
          background: toast.type === 'error' ? '#ef4444' : toast.type === 'info' ? '#3b82f6' : '#22c55e',
          color: '#fff', padding: '10px 18px', borderRadius: 4,
          fontFamily: NU, fontSize: 12, fontWeight: 600,
          boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.message}
        </div>
      )}

      {/* Dirty indicator */}
      {dirty && (
        <div style={{
          position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
          background: C.card, border: `1px solid ${C.border}`,
          padding: '6px 16px', borderRadius: 20,
          fontFamily: NU, fontSize: 10, color: C.grey2,
          letterSpacing: '0.08em', pointerEvents: 'none',
        }}>
          Unsaved changes · auto-saving…
        </div>
      )}
    </div>
  );
}
