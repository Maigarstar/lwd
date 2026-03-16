/**
 * PipelineBuilderModule.jsx
 * Build and manage custom sales pipelines.
 * Under Admin > Sales > Pipeline Builder.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  fetchPipelines,
  createPipeline,
  updatePipeline,
  deletePipeline,
  fetchStages,
  createStage,
  updateStage,
  deleteStage,
  reorderStages,
  fetchTemplates,
  createTemplate,
  updateTemplate,
  deleteTemplate,
} from '../../services/pipelineBuilderService';

// ── Shared constants ──────────────────────────────────────────────────────────

const STAGE_COLORS = [
  { hex: '#94a3b8', label: 'Slate'  },
  { hex: '#f59e0b', label: 'Amber'  },
  { hex: '#f97316', label: 'Orange' },
  { hex: '#ef4444', label: 'Red'    },
  { hex: '#8b5cf6', label: 'Purple' },
  { hex: '#3b82f6', label: 'Blue'   },
  { hex: '#06b6d4', label: 'Cyan'   },
  { hex: '#22c55e', label: 'Green'  },
  { hex: '#ec4899', label: 'Pink'   },
  { hex: '#8f7420', label: 'Gold'   },
];

const PARTNER_TYPES = [
  { value: 'venue',   label: 'Venue Partnerships'  },
  { value: 'vendor',  label: 'Vendor Partnerships' },
  { value: 'planner', label: 'Planner Partnerships'},
  { value: 'custom',  label: 'Custom Pipeline'     },
];

const EMAIL_TYPES = [
  { value: 'cold',       label: 'Cold Outreach'  },
  { value: 'follow_up_1',label: 'Follow Up 1'    },
  { value: 'follow_up_2',label: 'Follow Up 2'    },
  { value: 'proposal',   label: 'Proposal'       },
  { value: 'welcome',    label: 'Welcome Email'  },
  { value: 'custom',     label: 'Custom'         },
];

const MERGE_TAGS = ['{{contact_name}}', '{{company_name}}', '{{sender_name}}', '{{proposal_value}}'];

const CLOSED_WON_ACTION_LABELS = {
  activate_profile:      'Activate vendor profile',
  send_welcome_email:    'Send welcome email',
  add_to_newsletter:     'Add to newsletter list',
  create_onboarding_task:'Create onboarding task',
};

// ── Styles ────────────────────────────────────────────────────────────────────

const S = {
  wrap:       { display: 'flex', height: '100%', gap: 0, fontFamily: 'Inter, sans-serif', background: '#fafaf8' },
  sidebar:    { width: 260, borderRight: '1px solid #e8e0d0', background: '#fff', display: 'flex', flexDirection: 'column', flexShrink: 0 },
  sideHead:   { padding: '20px 18px 12px', borderBottom: '1px solid #f0ece4', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#8f7420', textTransform: 'uppercase' },
  pipeList:   { flex: 1, overflowY: 'auto', padding: '8px 0' },
  pipeItem:   (active) => ({ padding: '10px 18px', cursor: 'pointer', background: active ? 'rgba(143,116,32,0.08)' : 'transparent', borderLeft: active ? '3px solid #8f7420' : '3px solid transparent', fontSize: 13, fontWeight: active ? 600 : 400, color: active ? '#8f7420' : '#333', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s' }),
  pipeDot:    (color) => ({ width: 9, height: 9, borderRadius: '50%', background: color || '#8f7420', flexShrink: 0 }),
  newBtn:     { margin: '12px 16px', padding: '9px 0', border: '1px dashed rgba(143,116,32,0.4)', borderRadius: 6, background: 'transparent', color: '#8f7420', fontSize: 13, fontWeight: 500, cursor: 'pointer', width: 'calc(100% - 32px)', textAlign: 'center', transition: 'all 0.15s' },
  main:       { flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  empty:      { flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#999', gap: 10 },
  emptyIcon:  { fontSize: 40, opacity: 0.3 },
  topBar:     { padding: '20px 28px 16px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 12, background: '#fff' },
  pName:      { flex: 1, fontSize: 18, fontWeight: 600, color: '#171717', fontFamily: 'Cormorant Garamond, Georgia, serif' },
  tabBar:     { display: 'flex', gap: 0, borderBottom: '1px solid #f0ece4', background: '#fff', padding: '0 28px' },
  tab:        (active) => ({ padding: '12px 20px', fontSize: 13, fontWeight: 500, cursor: 'pointer', borderBottom: active ? '2px solid #8f7420' : '2px solid transparent', color: active ? '#8f7420' : '#888', transition: 'all 0.15s', background: 'none', border: 'none', borderBottom: active ? '2px solid #8f7420' : '2px solid transparent' }),
  body:       { padding: 28, display: 'flex', flexDirection: 'column', gap: 24 },
  card:       { background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: 20 },
  row:        { display: 'flex', gap: 16, alignItems: 'flex-start' },
  col:        { flex: 1, display: 'flex', flexDirection: 'column', gap: 6 },
  label:      { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: '#888', textTransform: 'uppercase' },
  input:      { padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#171717', outline: 'none', background: '#fafaf8', width: '100%', boxSizing: 'border-box' },
  textarea:   { padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#171717', outline: 'none', background: '#fafaf8', width: '100%', boxSizing: 'border-box', minHeight: 80, resize: 'vertical', fontFamily: 'Inter, sans-serif' },
  select:     { padding: '9px 12px', border: '1px solid #ddd', borderRadius: 6, fontSize: 13, color: '#171717', background: '#fafaf8', width: '100%', outline: 'none' },
  goldBtn:    { padding: '9px 20px', background: '#8f7420', color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'opacity 0.15s' },
  outlineBtn: { padding: '9px 20px', background: 'transparent', color: '#8f7420', border: '1px solid #8f7420', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', transition: 'all 0.15s' },
  dangerBtn:  { padding: '7px 14px', background: 'transparent', color: '#dc2626', border: '1px solid #dc2626', borderRadius: 6, fontSize: 12, cursor: 'pointer' },
  smallBtn:   { padding: '5px 12px', background: 'transparent', border: '1px solid #ddd', borderRadius: 5, fontSize: 12, cursor: 'pointer', color: '#555' },
  stageRow:   { display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: '#fafaf8', border: '1px solid #ede8de', borderRadius: 7, marginBottom: 8 },
  dragHandle: { color: '#bbb', cursor: 'grab', fontSize: 16, flexShrink: 0, userSelect: 'none' },
  colorDot:   (color) => ({ width: 20, height: 20, borderRadius: '50%', background: color, border: '2px solid #fff', cursor: 'pointer', flexShrink: 0, boxShadow: '0 0 0 1px #ddd' }),
  colorSwatch:(color, active) => ({ width: 22, height: 22, borderRadius: '50%', background: color, cursor: 'pointer', boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px ${color}` : 'none', flexShrink: 0 }),
  colorPicker:{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '8px 0' },
  tplCard:    { background: '#fafaf8', border: '1px solid #ede8de', borderRadius: 7, padding: '14px 16px', marginBottom: 8 },
  tplTitle:   { fontSize: 13, fontWeight: 600, color: '#333', marginBottom: 4 },
  tplSub:     { fontSize: 11, color: '#888' },
  badge:      (color) => ({ display: 'inline-block', padding: '2px 8px', borderRadius: 100, background: color + '22', color: color, fontSize: 11, fontWeight: 600 }),
  checkRow:   { display: 'flex', alignItems: 'center', gap: 8, fontSize: 13 },
  overlay:    { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  modal:      { background: '#fff', borderRadius: 10, padding: 28, width: '90vw', maxWidth: 640, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.2)' },
  modalHead:  { fontSize: 17, fontWeight: 600, color: '#171717', fontFamily: 'Cormorant Garamond, Georgia, serif', marginBottom: 20 },
};

// ── Sub-components ────────────────────────────────────────────────────────────

function ColorPicker({ value, onChange }) {
  return (
    <div style={S.colorPicker}>
      {STAGE_COLORS.map(c => (
        <div
          key={c.hex}
          style={S.colorSwatch(c.hex, value === c.hex)}
          title={c.label}
          onClick={() => onChange(c.hex)}
        />
      ))}
    </div>
  );
}

function StageRowItem({ stage, stages, templates, onUpdate, onDelete, onMoveUp, onMoveDown, isFirst, isLast }) {
  const [showColors, setShowColors] = useState(false);

  function field(key, val) { onUpdate(stage.id, { [key]: val }); }

  return (
    <div style={S.stageRow}>
      <div style={S.dragHandle} title="Drag to reorder">&#9776;</div>

      {/* Color dot / picker toggle */}
      <div style={{ position: 'relative' }}>
        <div style={S.colorDot(stage.color)} onClick={() => setShowColors(v => !v)} title="Change colour" />
        {showColors && (
          <div style={{ position: 'absolute', top: 28, left: 0, background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: '10px 12px', zIndex: 100, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}>
            <ColorPicker value={stage.color} onChange={c => { field('color', c); setShowColors(false); }} />
          </div>
        )}
      </div>

      {/* Name */}
      <input
        style={{ ...S.input, flex: 1, padding: '6px 10px' }}
        value={stage.name}
        onChange={e => field('name', e.target.value)}
        placeholder="Stage name"
      />

      {/* Auto follow-up days */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>FU in</span>
        <input
          style={{ ...S.input, width: 48, padding: '6px 8px', textAlign: 'center' }}
          type="number"
          min="0"
          value={stage.auto_follow_up_days || ''}
          onChange={e => field('auto_follow_up_days', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="--"
          title="Auto follow-up after N days (leave blank for none)"
        />
        <span style={{ fontSize: 11, color: '#888' }}>days</span>
      </div>

      {/* Template */}
      <select
        style={{ ...S.select, width: 160, padding: '6px 8px' }}
        value={stage.email_template_id || ''}
        onChange={e => field('email_template_id', e.target.value || null)}
        title="Email template for this stage"
      >
        <option value="">No template</option>
        {templates.map(t => (
          <option key={t.id} value={t.id}>{t.name}</option>
        ))}
      </select>

      {/* Won / Lost toggles */}
      <label style={{ ...S.checkRow, gap: 4, flexShrink: 0, fontSize: 11, color: '#22c55e', cursor: 'pointer' }}>
        <input type="checkbox" checked={stage.is_won} onChange={e => field('is_won', e.target.checked)} />
        Won
      </label>
      <label style={{ ...S.checkRow, gap: 4, flexShrink: 0, fontSize: 11, color: '#ef4444', cursor: 'pointer' }}>
        <input type="checkbox" checked={stage.is_lost} onChange={e => field('is_lost', e.target.checked)} />
        Lost
      </label>

      {/* Reorder arrows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, flexShrink: 0 }}>
        <button style={{ ...S.smallBtn, padding: '2px 8px', opacity: isFirst ? 0.3 : 1 }} onClick={onMoveUp} disabled={isFirst}>▲</button>
        <button style={{ ...S.smallBtn, padding: '2px 8px', opacity: isLast ? 0.3 : 1 }} onClick={onMoveDown} disabled={isLast}>▼</button>
      </div>

      {/* Delete */}
      <button style={{ ...S.smallBtn, color: '#dc2626', borderColor: '#dc2626', flexShrink: 0 }} onClick={() => onDelete(stage.id)}>✕</button>
    </div>
  );
}

function TemplateModal({ template, pipelineId, stages, onSave, onClose }) {
  const init = template || { pipeline_id: pipelineId, stage_id: '', name: '', email_type: 'cold', subject: '', body: '' };
  const [form, setForm] = useState(init);
  const [saving, setSaving] = useState(false);

  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name || !form.subject || !form.body) return;
    setSaving(true);
    try {
      const saved = form.id
        ? await updateTemplate(form.id, form)
        : await createTemplate({ ...form, pipeline_id: pipelineId });
      onSave(saved);
    } finally {
      setSaving(false);
    }
  }

  function insertTag(tag) {
    const ta = document.getElementById('tpl-body');
    if (!ta) { f('body', form.body + tag); return; }
    const start = ta.selectionStart;
    const end   = ta.selectionEnd;
    f('body', form.body.slice(0, start) + tag + form.body.slice(end));
    setTimeout(() => { ta.selectionStart = ta.selectionEnd = start + tag.length; ta.focus(); }, 0);
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.modalHead}>{form.id ? 'Edit Template' : 'New Email Template'}</div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.row}>
            <div style={S.col}>
              <div style={S.label}>Template name</div>
              <input style={S.input} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Venue Cold Outreach" />
            </div>
            <div style={S.col}>
              <div style={S.label}>Type</div>
              <select style={S.select} value={form.email_type} onChange={e => f('email_type', e.target.value)}>
                {EMAIL_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div style={S.col}>
            <div style={S.label}>Attach to stage (optional)</div>
            <select style={S.select} value={form.stage_id || ''} onChange={e => f('stage_id', e.target.value || null)}>
              <option value="">Not attached to a stage</option>
              {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>

          <div style={S.col}>
            <div style={S.label}>Subject</div>
            <input style={S.input} value={form.subject} onChange={e => f('subject', e.target.value)} placeholder="e.g. Partnership enquiry - {{company_name}}" />
          </div>

          <div style={S.col}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <div style={S.label}>Body</div>
              <div style={{ display: 'flex', gap: 4 }}>
                {MERGE_TAGS.map(t => (
                  <button key={t} style={{ ...S.smallBtn, fontSize: 10, padding: '3px 7px', color: '#8f7420', borderColor: 'rgba(143,116,32,0.4)' }} onClick={() => insertTag(t)}>{t}</button>
                ))}
              </div>
            </div>
            <textarea
              id="tpl-body"
              style={{ ...S.textarea, minHeight: 220 }}
              value={form.body}
              onChange={e => f('body', e.target.value)}
              placeholder="Write your email here. Use merge tags above to personalise."
            />
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button style={S.outlineBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.goldBtn, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving}>
            {saving ? 'Saving...' : 'Save Template'}
          </button>
        </div>
      </div>
    </div>
  );
}

function NewPipelineModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name: '', partner_type: 'custom', description: '', color: '#8f7420' });
  const [saving, setSaving] = useState(false);
  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try { onSave(await createPipeline(form)); }
    finally { setSaving(false); }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modal, maxWidth: 440 }}>
        <div style={S.modalHead}>Create New Pipeline</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={S.col}>
            <div style={S.label}>Pipeline name</div>
            <input style={S.input} value={form.name} onChange={e => f('name', e.target.value)} placeholder="e.g. Luxury Brand Partnerships" autoFocus />
          </div>
          <div style={S.col}>
            <div style={S.label}>Type</div>
            <select style={S.select} value={form.partner_type} onChange={e => f('partner_type', e.target.value)}>
              {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div style={S.col}>
            <div style={S.label}>Description (optional)</div>
            <input style={S.input} value={form.description} onChange={e => f('description', e.target.value)} placeholder="What is this pipeline for?" />
          </div>
          <div style={S.col}>
            <div style={S.label}>Colour</div>
            <ColorPicker value={form.color} onChange={c => f('color', c)} />
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
          <button style={S.outlineBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.goldBtn, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving || !form.name.trim()}>
            {saving ? 'Creating...' : 'Create Pipeline'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function PipelineBuilderModule() {
  const [pipelines,       setPipelines]       = useState([]);
  const [selectedId,      setSelectedId]      = useState(null);
  const [stages,          setStages]          = useState([]);
  const [templates,       setTemplates]       = useState([]);
  const [activeTab,       setActiveTab]       = useState('stages');
  const [loading,         setLoading]         = useState(true);
  const [saving,          setSaving]          = useState(false);
  const [editTemplate,    setEditTemplate]    = useState(null); // null | false | template object
  const [showNewPipeline, setShowNewPipeline] = useState(false);
  const [confirmDelete,   setConfirmDelete]   = useState(null); // pipeline id to delete
  const [pipelineForm,    setPipelineForm]    = useState({});

  const selected = pipelines.find(p => p.id === selectedId) || null;

  // Load pipelines
  useEffect(() => {
    (async () => {
      try {
        const list = await fetchPipelines();
        setPipelines(list);
        if (list.length) setSelectedId(list[0].id);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Load stages + templates when pipeline selected
  useEffect(() => {
    if (!selectedId) return;
    setStages([]);
    setTemplates([]);
    Promise.all([fetchStages(selectedId), fetchTemplates(selectedId)])
      .then(([s, t]) => { setStages(s); setTemplates(t); })
      .catch(console.error);
    const p = pipelines.find(x => x.id === selectedId);
    if (p) setPipelineForm({ name: p.name, partner_type: p.partner_type, description: p.description || '', color: p.color });
  }, [selectedId]);

  // Save pipeline settings (debounced on blur)
  async function savePipelineSettings() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const updated = await updatePipeline(selectedId, pipelineForm);
      setPipelines(list => list.map(p => p.id === selectedId ? updated : p));
    } finally {
      setSaving(false);
    }
  }

  // Stage operations
  async function addStage() {
    const pos = stages.length;
    const newStage = await createStage({
      pipeline_id: selectedId,
      name: 'New Stage',
      color: '#94a3b8',
      position: pos,
      is_won: false,
      is_lost: false,
      auto_follow_up_days: null,
    });
    setStages(s => [...s, newStage]);
  }

  async function handleStageUpdate(id, fields) {
    setStages(s => s.map(x => x.id === id ? { ...x, ...fields } : x));
    try { await updateStage(id, fields); } catch (e) { console.error(e); }
  }

  async function handleStageDelete(id) {
    if (!window.confirm('Delete this stage? Prospects in this stage will not be deleted.')) return;
    await deleteStage(id);
    setStages(s => s.filter(x => x.id !== id));
  }

  function moveStage(idx, dir) {
    const newStages = [...stages];
    const swap = idx + dir;
    if (swap < 0 || swap >= newStages.length) return;
    [newStages[idx], newStages[swap]] = [newStages[swap], newStages[idx]];
    newStages.forEach((s, i) => s.position = i);
    setStages(newStages);
    reorderStages(newStages.map(s => s.id)).catch(console.error);
  }

  // Template operations
  function handleTemplateSaved(saved) {
    setTemplates(list => {
      const idx = list.findIndex(t => t.id === saved.id);
      return idx >= 0 ? list.map(t => t.id === saved.id ? saved : t) : [...list, saved];
    });
    setEditTemplate(null);
  }

  async function handleTemplateDelete(id) {
    if (!window.confirm('Delete this template?')) return;
    await deleteTemplate(id);
    setTemplates(list => list.filter(t => t.id !== id));
  }

  // Pipeline operations
  async function handleNewPipelineSaved(pipeline) {
    setPipelines(list => [...list, pipeline]);
    setSelectedId(pipeline.id);
    setShowNewPipeline(false);
  }

  async function handleDeletePipeline() {
    if (!confirmDelete) return;
    await deletePipeline(confirmDelete);
    const remaining = pipelines.filter(p => p.id !== confirmDelete);
    setPipelines(remaining);
    setSelectedId(remaining.length ? remaining[0].id : null);
    setConfirmDelete(null);
  }

  if (loading) return <div style={{ padding: 40, color: '#888', textAlign: 'center' }}>Loading pipelines...</div>;

  return (
    <div style={S.wrap}>
      {/* ── Sidebar ── */}
      <div style={S.sidebar}>
        <div style={S.sideHead}>Pipelines</div>
        <div style={S.pipeList}>
          {pipelines.map(p => (
            <div key={p.id} style={S.pipeItem(p.id === selectedId)} onClick={() => setSelectedId(p.id)}>
              <div style={S.pipeDot(p.color)} />
              <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</span>
              <span style={{ fontSize: 10, color: '#aaa' }}>{p.partner_type}</span>
            </div>
          ))}
        </div>
        <button style={S.newBtn} onClick={() => setShowNewPipeline(true)}>+ New Pipeline</button>
      </div>

      {/* ── Main ── */}
      <div style={S.main}>
        {!selected ? (
          <div style={S.empty}>
            <div style={S.emptyIcon}>◆</div>
            <div>Select a pipeline or create a new one</div>
          </div>
        ) : (
          <>
            {/* Top bar */}
            <div style={S.topBar}>
              <div style={S.pName}>{selected.name}</div>
              <span style={S.badge(selected.color)}>{selected.partner_type}</span>
              {!selected.is_default && (
                <button style={S.dangerBtn} onClick={() => setConfirmDelete(selected.id)}>Delete Pipeline</button>
              )}
            </div>

            {/* Pipeline settings card */}
            <div style={{ padding: '16px 28px 0' }}>
              <div style={S.card}>
                <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 14, color: '#555' }}>Pipeline Settings</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <div style={{ ...S.col, minWidth: 180 }}>
                    <div style={S.label}>Name</div>
                    <input
                      style={S.input}
                      value={pipelineForm.name || ''}
                      onChange={e => setPipelineForm(f => ({ ...f, name: e.target.value }))}
                      onBlur={savePipelineSettings}
                    />
                  </div>
                  <div style={{ ...S.col, minWidth: 160 }}>
                    <div style={S.label}>Type</div>
                    <select
                      style={S.select}
                      value={pipelineForm.partner_type || 'custom'}
                      onChange={e => setPipelineForm(f => ({ ...f, partner_type: e.target.value }))}
                      onBlur={savePipelineSettings}
                    >
                      {PARTNER_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                  </div>
                  <div style={{ ...S.col, flex: 2, minWidth: 200 }}>
                    <div style={S.label}>Description</div>
                    <input
                      style={S.input}
                      value={pipelineForm.description || ''}
                      onChange={e => setPipelineForm(f => ({ ...f, description: e.target.value }))}
                      onBlur={savePipelineSettings}
                      placeholder="Optional description"
                    />
                  </div>
                  <div style={S.col}>
                    <div style={S.label}>Colour</div>
                    <ColorPicker value={pipelineForm.color || '#8f7420'} onChange={c => { setPipelineForm(f => ({ ...f, color: c })); }} />
                  </div>
                </div>
                {saving && <div style={{ fontSize: 11, color: '#8f7420', marginTop: 8 }}>Saving...</div>}
              </div>
            </div>

            {/* Tab bar */}
            <div style={S.tabBar}>
              <button style={S.tab(activeTab === 'stages')}    onClick={() => setActiveTab('stages')}>
                Stages ({stages.length})
              </button>
              <button style={S.tab(activeTab === 'templates')} onClick={() => setActiveTab('templates')}>
                Email Templates ({templates.length})
              </button>
              <button style={S.tab(activeTab === 'automation')} onClick={() => setActiveTab('automation')}>
                Automation
              </button>
            </div>

            {/* Tab body */}
            <div style={S.body}>

              {/* ── STAGES ── */}
              {activeTab === 'stages' && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
                    Configure stages, colours, auto follow-up delays, and attached email templates.
                    <br />Drag to reorder. Stages with <span style={{ color: '#22c55e', fontWeight: 600 }}>Won</span> checked will fire Closed Won automation.
                  </div>

                  {stages.map((stage, idx) => (
                    <StageRowItem
                      key={stage.id}
                      stage={stage}
                      stages={stages}
                      templates={templates}
                      onUpdate={handleStageUpdate}
                      onDelete={handleStageDelete}
                      onMoveUp={() => moveStage(idx, -1)}
                      onMoveDown={() => moveStage(idx, 1)}
                      isFirst={idx === 0}
                      isLast={idx === stages.length - 1}
                    />
                  ))}

                  <button
                    style={{ ...S.outlineBtn, marginTop: 4, width: '100%' }}
                    onClick={addStage}
                  >
                    + Add Stage
                  </button>
                </div>
              )}

              {/* ── TEMPLATES ── */}
              {activeTab === 'templates' && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
                    Create editable email templates for each stage. Use merge tags to personalise at send time.
                  </div>

                  {templates.map(t => {
                    const attachedStage = stages.find(s => s.id === t.stage_id);
                    return (
                      <div key={t.id} style={S.tplCard}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                            <div style={S.tplTitle}>{t.name}</div>
                            <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap' }}>
                              <span style={S.badge('#8f7420')}>{EMAIL_TYPES.find(x => x.value === t.email_type)?.label || t.email_type}</span>
                              {attachedStage && (
                                <span style={{ ...S.badge(attachedStage.color), display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: attachedStage.color, display: 'inline-block' }} />
                                  {attachedStage.name}
                                </span>
                              )}
                            </div>
                            <div style={{ fontSize: 12, color: '#888', marginTop: 6 }}>
                              <strong>Subject:</strong> {t.subject}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button style={S.smallBtn} onClick={() => setEditTemplate(t)}>Edit</button>
                            <button style={{ ...S.smallBtn, color: '#dc2626', borderColor: '#dc2626' }} onClick={() => handleTemplateDelete(t.id)}>Delete</button>
                          </div>
                        </div>
                      </div>
                    );
                  })}

                  <button
                    style={{ ...S.outlineBtn, width: '100%', marginTop: 4 }}
                    onClick={() => setEditTemplate(false)}
                  >
                    + New Template
                  </button>
                </div>
              )}

              {/* ── AUTOMATION ── */}
              {activeTab === 'automation' && (
                <div>
                  <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>
                    Automation rules fire when a prospect moves to a stage with <strong>Won</strong> checked.
                  </div>
                  {stages.filter(s => s.is_won).map(stage => (
                    <div key={stage.id} style={S.card}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                        <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color }} />
                        <div style={{ fontWeight: 600, fontSize: 14, color: '#171717' }}>
                          When moved to: {stage.name}
                        </div>
                      </div>
                      {['activate_profile','send_welcome_email','add_to_newsletter','create_onboarding_task'].map(action => {
                        const isActive = (stage.closed_won_actions || []).includes(action);
                        return (
                          <label key={action} style={{ ...S.checkRow, marginBottom: 10, cursor: 'pointer' }}>
                            <input
                              type="checkbox"
                              checked={isActive}
                              onChange={async e => {
                                const current = stage.closed_won_actions || [];
                                const next = e.target.checked
                                  ? [...current, action]
                                  : current.filter(a => a !== action);
                                await handleStageUpdate(stage.id, { closed_won_actions: next });
                              }}
                            />
                            <span style={{ fontSize: 13, color: '#333' }}>{CLOSED_WON_ACTION_LABELS[action]}</span>
                          </label>
                        );
                      })}
                      {stages.filter(s => s.auto_follow_up_days).length > 0 && (
                        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid #f0ece4', fontSize: 12, color: '#888' }}>
                          Auto follow-up delays are configured per stage in the Stages tab.
                        </div>
                      )}
                    </div>
                  ))}
                  {stages.filter(s => s.is_won).length === 0 && (
                    <div style={{ color: '#aaa', fontSize: 13 }}>
                      No Won stages configured yet. Mark a stage as Won in the Stages tab to set automation actions.
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ── Modals ── */}
      {showNewPipeline && (
        <NewPipelineModal onSave={handleNewPipelineSaved} onClose={() => setShowNewPipeline(false)} />
      )}

      {editTemplate !== null && (
        <TemplateModal
          template={editTemplate || null}
          pipelineId={selectedId}
          stages={stages}
          onSave={handleTemplateSaved}
          onClose={() => setEditTemplate(null)}
        />
      )}

      {confirmDelete && (
        <div style={S.overlay} onClick={e => e.target === e.currentTarget && setConfirmDelete(null)}>
          <div style={{ ...S.modal, maxWidth: 380 }}>
            <div style={S.modalHead}>Delete Pipeline?</div>
            <p style={{ fontSize: 14, color: '#555', lineHeight: 1.7 }}>
              This will permanently delete the pipeline and all its stages and templates.
              Prospects in this pipeline will not be deleted but will lose their stage assignment.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 20 }}>
              <button style={S.outlineBtn} onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button style={{ ...S.goldBtn, background: '#dc2626' }} onClick={handleDeletePipeline}>Yes, Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
