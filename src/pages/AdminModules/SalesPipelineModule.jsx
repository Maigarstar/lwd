/**
 * SalesPipelineModule.jsx
 * Full sales pipeline CRM with dynamic pipelines, DnD kanban,
 * outreach engine, auto follow-ups, closed won automation, lead scoring,
 * AI assistance, and reply detection.
 */

import React, { useState, useEffect, useCallback, useContext } from 'react';
import {
  fetchProspects,
  createProspect,
  updateProspect,
  deleteProspect,
  fetchOutreachHistory,
  logOutreachEmail,
  markReplied,
  fetchSalesStats,
  fetchFollowUpsDue,
  findDuplicateProspects,
} from '../../services/salesPipelineService';
import {
  fetchPipelines,
  fetchStages,
  fetchTemplates,
  fetchStageTemplate,
  fireClosedWonActions,
  runAutoFollowUps,
  mergeTags,
} from '../../services/pipelineBuilderService';
import {
  calculateLeadScore,
  scoreColor,
  scoreLabel,
  batchRefreshScores,
} from '../../services/leadScoringService';
import {
  generateFollowUpEmail,
  generateProposalEmail,
  generateNextStepAdvice,
  generateColdEmail,
} from '../../services/salesPipelineAiService';
import { sendEmail } from '../../services/emailSendService';
import {
  assignProspectPipeline,
  fetchAssignmentRules,
  fetchAssignmentSettings,
} from '../../services/pipelineAssignmentService';
import {
  calculateDealHealth,
  calculateCloseProbability,
  dealHealthColor,
  dealHealthBgColor,
  dealHealthLabel,
  generateNextAction,
  getPipelineIntelligence,
} from '../../services/dealIntelligenceService';
import {
  fetchCampaigns,
  createCampaign,
  updateCampaign,
  deleteCampaign,
  filterProspectsForCampaign,
  sendCampaign,
  fetchCampaignStats,
} from '../../services/campaignService';
import {
  discoverByKeywords,
  discoverFromUrl,
  importDiscoveredProspects,
} from '../../services/prospectDiscoveryService';
import {
  fetchOnboardingTask,
  createOnboardingTask,
  toggleOnboardingItem,
  getOnboardingProgress,
} from '../../services/onboardingService';
import {
  fetchEmailAnalytics,
} from '../../services/emailAnalyticsService';
import { ThemeCtx } from '../../theme/ThemeContext';

// ── Constants ─────────────────────────────────────────────────────────────────

const VENUE_TYPES  = ['Venue', 'Vendor', 'Planner', 'Brand', 'Editorial'];
const SOURCES      = ['Referral', 'LinkedIn', 'Google', 'Directory', 'Event', 'Other'];
const PACKAGES     = ['Standard', 'Premium', 'Elite'];
const COUNTRIES    = ['United Kingdom', 'Ireland', 'France', 'Italy', 'Spain', 'USA', 'Other'];

// ── Styles ────────────────────────────────────────────────────────────────────

function makeS(C, G) {
  const isDark = C.card === '#141414';
  return {
    wrap:        { display: 'flex', flexDirection: 'column', height: '100%', background: C.black, fontFamily: 'Inter, sans-serif' },
    topBar:      { display: 'flex', alignItems: 'center', gap: 12, padding: '14px 24px', background: C.card, borderBottom: `1px solid ${C.border}`, flexShrink: 0, flexWrap: 'wrap' },
    heading:     { fontSize: 18, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: C.white, marginRight: 4 },
    pipeSelect:  { padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, background: C.dark, color: C.white, outline: 'none', maxWidth: 220 },
    searchBox:   { padding: '7px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, width: 200, outline: 'none', background: C.dark, color: C.white },
    viewBtns:    { display: 'flex', border: `1px solid ${C.border}`, borderRadius: 6, overflow: 'hidden' },
    viewBtn:     (active) => ({ padding: '7px 14px', background: active ? G : 'transparent', color: active ? '#fff' : C.grey, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 500 }),
    goldBtn:     { padding: '7px 18px', background: G, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    outlineBtn:  { padding: '7px 18px', background: 'transparent', color: G, border: `1px solid ${G}`, borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer' },
    badge:       (color) => ({ display: 'inline-block', padding: '2px 9px', borderRadius: 100, background: color + '22', color: color, fontSize: 10, fontWeight: 600 }),
    fuBadge:     { background: '#fee2e2', color: '#dc2626', borderRadius: 100, padding: '2px 8px', fontSize: 11, fontWeight: 600 },
    scorePill:   (color) => ({ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 26, height: 18, borderRadius: 9, background: color + '22', color: color, fontSize: 10, fontWeight: 700, padding: '0 5px', letterSpacing: '0.02em' }),
    aiSection:   { borderTop: `1px solid ${C.border}`, paddingTop: 14, marginTop: 8 },
    aiBtn:       { padding: '6px 12px', background: isDark ? 'rgba(168,132,38,0.12)' : 'rgba(143,116,32,0.08)', color: G, border: `1px solid rgba(143,116,32,0.3)`, borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 },
    aiResult:    { background: isDark ? '#1a1a0e' : '#fffdf8', border: `1px solid rgba(143,116,32,0.2)`, borderRadius: 6, padding: '10px 12px', fontSize: 13, lineHeight: 1.7, color: C.white, marginTop: 10, whiteSpace: 'pre-wrap' },
    replyBtn:    { padding: '3px 9px', background: '#dcfce7', color: '#166534', border: '1px solid #bbf7d0', borderRadius: 4, fontSize: 10, fontWeight: 600, cursor: 'pointer', flexShrink: 0 },

    // Kanban
    kanban:      { display: 'flex', gap: 0, overflowX: 'auto', flex: 1, padding: '16px 0', alignItems: 'flex-start' },
    col:         (isOver) => ({ minWidth: 220, maxWidth: 220, flexShrink: 0, background: isOver ? (isDark ? 'rgba(168,132,38,0.1)' : 'rgba(143,116,32,0.07)') : C.dark, borderRadius: 8, margin: '0 6px', transition: 'background 0.15s', display: 'flex', flexDirection: 'column', maxHeight: 'calc(100vh - 180px)', border: isOver ? `1px dashed ${G}` : `1px solid ${C.border}` }),
    colHead:     { padding: '10px 12px 8px', display: 'flex', alignItems: 'center', gap: 6 },
    colDot:      (color) => ({ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0 }),
    colName:     { fontSize: 12, fontWeight: 600, color: C.grey, flex: 1, textTransform: 'uppercase', letterSpacing: '0.05em' },
    colCount:    { fontSize: 11, color: C.grey2, background: C.card, borderRadius: 100, padding: '1px 7px' },
    colBody:     { flex: 1, overflowY: 'auto', padding: '0 8px 8px' },
    card:        (isDragging) => ({ background: C.card, borderRadius: 7, padding: '11px 12px', marginBottom: 8, border: `1px solid ${C.border}`, cursor: 'grab', opacity: isDragging ? 0.35 : 1, boxShadow: isDragging ? 'none' : '0 1px 3px rgba(0,0,0,0.06)', transition: 'opacity 0.12s', userSelect: 'none' }),
    cardCompany: { fontSize: 13, fontWeight: 600, color: C.white, marginBottom: 3 },
    cardContact: { fontSize: 11, color: C.grey, marginBottom: 6 },
    cardFooter:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 },
    iconBtn:     { padding: '3px 8px', background: 'transparent', border: `1px solid ${C.border}`, borderRadius: 4, fontSize: 11, cursor: 'pointer', color: C.grey },
    addCardBtn:  { margin: '0 8px 8px', padding: '7px 0', background: 'transparent', border: `1px dashed rgba(143,116,32,0.35)`, borderRadius: 6, color: G, fontSize: 12, cursor: 'pointer', width: 'calc(100% - 16px)' },
    overdueTag:  { fontSize: 10, color: '#dc2626', background: '#fee2e2', padding: '1px 6px', borderRadius: 100 },
    valueBadge:  { fontSize: 10, color: '#22c55e', background: '#dcfce7', padding: '1px 6px', borderRadius: 100 },

    // List
    tableWrap:   { flex: 1, overflowY: 'auto' },
    table:       { width: '100%', borderCollapse: 'collapse', background: C.card },
    th:          { padding: '10px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: C.grey, textAlign: 'left', borderBottom: `2px solid ${C.border}`, textTransform: 'uppercase', background: C.dark, cursor: 'pointer', whiteSpace: 'nowrap' },
    td:          { padding: '10px 14px', fontSize: 13, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', color: C.white },

    // Panel
    panel:       { width: 340, borderLeft: `1px solid ${C.border}`, background: C.card, display: 'flex', flexDirection: 'column', flexShrink: 0, overflowY: 'auto' },
    panelHead:   { padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 8 },
    panelTitle:  { flex: 1, fontSize: 15, fontWeight: 600, color: C.white, fontFamily: 'Cormorant Garamond, Georgia, serif' },
    panelClose:  { background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: C.grey, padding: '0 4px' },
    panelBody:   { padding: '14px 18px', flex: 1, overflowY: 'auto' },
    fieldLabel:  { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: C.grey, textTransform: 'uppercase', marginBottom: 3 },
    fieldValue:  { fontSize: 13, color: C.white, marginBottom: 12 },
    stageSelect: { padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, width: '100%', outline: 'none', marginBottom: 12, background: C.dark, color: C.white },
    histItem:    { fontSize: 12, color: C.grey, padding: '8px 0', borderBottom: `1px solid ${C.border}`, lineHeight: 1.5 },
    histTime:    { fontSize: 10, color: C.grey2, marginTop: 2 },

    // Dashboard
    dash:        { padding: 24, overflowY: 'auto', flex: 1 },
    kpiGrid:     { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 },
    kpiCard:     { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '16px 18px' },
    kpiVal:      { fontSize: 28, fontWeight: 700, color: C.white, fontFamily: 'Cormorant Garamond, Georgia, serif' },
    kpiLabel:    { fontSize: 11, color: C.grey, marginTop: 3, letterSpacing: '0.05em' },

    // Modal
    overlay:     { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' },
    modal:       { background: C.card, borderRadius: 10, padding: 28, width: '90vw', maxWidth: 600, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', border: `1px solid ${C.border}` },
    modalHead:   { fontSize: 18, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: C.white, marginBottom: 20 },
    formRow:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 },
    formCol:     { display: 'flex', flexDirection: 'column', gap: 5 },
    formLabel:   { fontSize: 11, fontWeight: 600, letterSpacing: '0.08em', color: C.grey, textTransform: 'uppercase' },
    formInput:   { padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.white, outline: 'none', background: C.dark },
    formSelect:  { padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.white, background: C.dark, outline: 'none' },
    formTextarea:{ padding: '9px 12px', border: `1px solid ${C.border}`, borderRadius: 6, fontSize: 13, color: C.white, outline: 'none', background: C.dark, minHeight: 80, resize: 'vertical', fontFamily: 'Inter, sans-serif' },

    // Campaigns view
    campTable:   { width: '100%', borderCollapse: 'collapse', background: C.card },
    campTh:      { padding: '10px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.07em', color: C.grey, textAlign: 'left', borderBottom: `2px solid ${C.border}`, background: C.dark, textTransform: 'uppercase' },
    campTd:      { padding: '10px 14px', fontSize: 13, borderBottom: `1px solid ${C.border}`, verticalAlign: 'middle', color: C.white },
    // Analytics
    analyticsKpi: { background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '14px 16px', flex: 1, minWidth: 120 },
    analyticsKpiVal: { fontSize: 24, fontWeight: 700, color: C.white, fontFamily: 'Cormorant Garamond, Georgia, serif' },
    analyticsKpiLabel: { fontSize: 11, color: C.grey, marginTop: 2, letterSpacing: '0.05em' },
    analyticsNote: { fontSize: 11, color: C.grey2, fontStyle: 'italic', marginBottom: 12 },
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}
function isOverdue(iso) { return iso && new Date(iso) < new Date(); }
function formatValue(v) { if (!v) return null; return `${Number(v).toLocaleString()}`; }

function exportProspectsCSV(prospects) {
  const headers = ['Company', 'Contact', 'Email', 'Phone', 'Website', 'Stage', 'Type', 'Source', 'Status', 'Lead Score', 'Deal Value', 'Contract', 'Last Contacted', 'Next Follow-up', 'Notes'];
  const rows = prospects.map(p => [
    p.company_name || '',
    p.contact_name || '',
    p.email || '',
    p.phone || '',
    p.website || '',
    p.pipeline_stage || '',
    p.venue_type || '',
    p.source || '',
    p.status || '',
    p.lead_score ?? '',
    p.deal_value ? `${p.deal_currency || 'GBP'} ${p.deal_value}` : '',
    p.contract_status || 'none',
    p.last_contacted_at ? new Date(p.last_contacted_at).toLocaleDateString('en-GB') : '',
    p.next_follow_up_at ? new Date(p.next_follow_up_at).toLocaleDateString('en-GB') : '',
    (p.notes || '').replace(/\n/g, ' '),
  ]);
  const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `prospects-${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ScorePill({ score }) {
  if (score == null) return null;
  const color = scoreColor(score);
  return <span style={S.scorePill(color)} title={`Lead score: ${score}/100 (${scoreLabel(score)})`}>{score}</span>;
}

function DealHealthBadge({ health }) {
  if (!health) return null;
  const color = dealHealthColor(health.status);
  const bg    = dealHealthBgColor(health.status);
  return (
    <span title={health.reasons?.join(' | ')} style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 100,
      background: bg, color, fontSize: 10, fontWeight: 700,
      letterSpacing: '0.04em', whiteSpace: 'nowrap',
    }}>
      <span style={{ fontSize: 8 }}>&#9679;</span>
      {health.label}
    </span>
  );
}

function CloseProbRing({ prob }) {
  if (prob == null) return null;
  const r     = 18;
  const circ  = 2 * Math.PI * r;
  const fill  = (prob / 100) * circ;
  const color = prob >= 65 ? '#22c55e' : prob >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
      <svg width={44} height={44} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={22} cy={22} r={r} fill="none" stroke="#f3f0ea" strokeWidth={4} />
        <circle cx={22} cy={22} r={r} fill="none" stroke={color} strokeWidth={4}
          strokeDasharray={`${fill} ${circ - fill}`} strokeLinecap="round" />
        <text x={22} y={22} textAnchor="middle" dominantBaseline="central"
          style={{ fontSize: 10, fontWeight: 700, fill: color, transform: 'rotate(90deg)', transformOrigin: '22px 22px', fontFamily: 'Inter, sans-serif' }}>
          {prob}%
        </text>
      </svg>
      <div style={{ fontSize: 9, color: '#aaa', textAlign: 'center', lineHeight: 1.2 }}>Close<br/>Prob.</div>
    </div>
  );
}

// ── Prospect Modal ────────────────────────────────────────────────────────────

function ProspectModal({ prospect, pipelines, stages, defaultStage, assignRules, assignSettings, onSave, onClose }) {
  const init = prospect || {
    company_name: '', contact_name: '', email: '', phone: '', website: '',
    country: 'United Kingdom', venue_type: 'Venue', source: 'LinkedIn',
    package: 'Standard', notes: '', proposal_value: '', next_follow_up_at: '',
    pipeline_id: defaultStage?.pipeline_id || '',
    stage_id: defaultStage?.id || '',
    deal_value: '', deal_currency: 'GBP',
  };
  const [form, setForm]         = useState(init);
  const [saving, setSaving]     = useState(false);
  const [assignInfo, setAssignInfo] = useState(null); // { pipeline_id, method, confidence }
  const [dupWarning, setDupWarning] = useState([]);
  function f(k, v) { setForm(p => ({ ...p, [k]: v })); }
  async function checkDupes(email, website) {
    if (!email && !website) return;
    const dupes = await findDuplicateProspects({ email, website }).catch(() => []);
    const filtered = prospect ? dupes.filter(d => d.id !== prospect.id) : dupes;
    setDupWarning(filtered);
  }
  const pipelineStages = stages.filter(s => s.pipeline_id === (assignInfo?.pipeline_id || form.pipeline_id));

  async function save() {
    if (!form.company_name.trim()) return;
    setSaving(true);
    try {
      let resolvedPipelineId = form.pipeline_id;
      let resolvedStageId    = form.stage_id;
      let assignment         = null;

      // Auto-assign only on create and only if user left pipeline blank
      if (!form.id && !form.pipeline_id) {
        assignment = await assignProspectPipeline(form, {
          rules:     assignRules,
          settings:  assignSettings,
          pipelines,
        });
        resolvedPipelineId = assignment.pipeline_id;
        // Default to position=0 stage of the assigned pipeline
        const firstStage = stages
          .filter(s => s.pipeline_id === resolvedPipelineId)
          .sort((a, b) => a.position - b.position)[0];
        resolvedStageId = firstStage?.id || null;
      }

      const selectedStage = stages.find(s => s.id === (resolvedStageId || form.stage_id));
      const payload = {
        ...form,
        pipeline_id:       resolvedPipelineId || null,
        stage_id:          resolvedStageId || null,
        pipeline_stage:    selectedStage?.name || 'Prospect',
        proposal_value:    form.proposal_value ? parseFloat(form.proposal_value) : null,
        next_follow_up_at: form.next_follow_up_at || null,
      };
      const saved = form.id ? await updateProspect(form.id, payload) : await createProspect(payload);
      onSave(saved, assignment);
    } finally { setSaving(false); }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.modalHead}>{prospect?.id ? 'Edit Prospect' : 'Add Prospect'}</div>
        <div style={S.formRow}>
          <div style={S.formCol}><div style={S.formLabel}>Company / Venue Name *</div><input style={S.formInput} value={form.company_name} onChange={e => f('company_name', e.target.value)} autoFocus /></div>
          <div style={S.formCol}><div style={S.formLabel}>Contact Name</div><input style={S.formInput} value={form.contact_name || ''} onChange={e => f('contact_name', e.target.value)} /></div>
        </div>
        <div style={S.formRow}>
          <div style={S.formCol}><div style={S.formLabel}>Email</div><input style={S.formInput} type="email" value={form.email || ''} onChange={e => f('email', e.target.value)} onBlur={() => checkDupes(form.email, form.website)} /></div>
          <div style={S.formCol}><div style={S.formLabel}>Phone</div><input style={S.formInput} value={form.phone || ''} onChange={e => f('phone', e.target.value)} /></div>
        </div>
        <div style={S.formRow}>
          <div style={S.formCol}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 }}>
              <div style={S.formLabel}>Pipeline</div>
              {!form.id && !form.pipeline_id && (
                <span style={{ fontSize: 10, color: '#8f7420', fontStyle: 'italic' }}>auto-assigned on save</span>
              )}
            </div>
            <select style={S.formSelect} value={form.pipeline_id || ''} onChange={e => { f('pipeline_id', e.target.value); f('stage_id', ''); }}>
              <option value="">Auto-assign</option>
              {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div style={S.formCol}><div style={S.formLabel}>Stage</div>
            <select style={S.formSelect} value={form.stage_id || ''} onChange={e => f('stage_id', e.target.value)}>
              <option value="">{!form.pipeline_id ? 'Auto (first stage)' : 'Select stage'}</option>
              {pipelineStages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <div style={S.formRow}>
          <div style={S.formCol}><div style={S.formLabel}>Type</div>
            <select style={S.formSelect} value={form.venue_type} onChange={e => f('venue_type', e.target.value)}>{VENUE_TYPES.map(t => <option key={t}>{t}</option>)}</select>
          </div>
          <div style={S.formCol}><div style={S.formLabel}>Source</div>
            <select style={S.formSelect} value={form.source} onChange={e => f('source', e.target.value)}>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
          </div>
        </div>
        <div style={S.formRow}>
          <div style={S.formCol}><div style={S.formLabel}>Package</div>
            <select style={S.formSelect} value={form.package} onChange={e => f('package', e.target.value)}>{PACKAGES.map(p => <option key={p}>{p}</option>)}</select>
          </div>
          <div style={S.formCol}><div style={S.formLabel}>Proposal Value (GBP)</div><input style={S.formInput} type="number" value={form.proposal_value || ''} onChange={e => f('proposal_value', e.target.value)} placeholder="0" /></div>
        </div>
        <div style={S.formRow}>
          <div style={S.formCol}>
            <label style={S.formLabel}>Deal Value</label>
            <input style={S.formInput} type="number" placeholder="e.g. 2500" value={form.deal_value || ''} onChange={e => f('deal_value', e.target.value)} />
          </div>
          <div style={S.formCol}>
            <label style={S.formLabel}>Currency</label>
            <select style={S.formSelect} value={form.deal_currency || 'GBP'} onChange={e => f('deal_currency', e.target.value)}>
              <option value="GBP">GBP</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom: 14 }}><div style={S.formLabel}>Next Follow-Up Date</div><input style={{ ...S.formInput, marginTop: 4 }} type="date" value={form.next_follow_up_at ? form.next_follow_up_at.slice(0, 10) : ''} onChange={e => f('next_follow_up_at', e.target.value)} /></div>
        <div style={{ marginBottom: 20 }}><div style={S.formLabel}>Notes</div><textarea style={{ ...S.formTextarea, marginTop: 4, width: '100%', boxSizing: 'border-box' }} value={form.notes || ''} onChange={e => f('notes', e.target.value)} placeholder="Internal notes..." /></div>
        {dupWarning.length > 0 && (
          <div style={{ background: '#fef9ec', border: '1px solid #f59e0b', borderRadius: 6, padding: '10px 14px', marginBottom: 14, fontSize: 12 }}>
            <strong style={{ color: '#92400e' }}>Possible duplicate detected:</strong>{' '}
            {dupWarning.map(d => d.company_name).join(', ')} already in pipeline. Check before saving.
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={S.outlineBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.goldBtn, opacity: saving ? 0.6 : 1 }} onClick={save} disabled={saving || !form.company_name.trim()}>{saving ? 'Saving...' : prospect?.id ? 'Save Changes' : 'Add Prospect'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Outreach Modal ────────────────────────────────────────────────────────────

function OutreachModal({ prospect, templates, prefilled, onSent, onClose }) {
  const [subject, setSubject] = useState(prefilled?.subject || '');
  const [body, setBody]       = useState(prefilled?.body || '');
  const [sending, setSending] = useState(false);
  const [tplId, setTplId]     = useState('');

  // Apply pre-filled AI content on mount
  useEffect(() => {
    if (prefilled?.subject) setSubject(prefilled.subject);
    if (prefilled?.body)    setBody(prefilled.body);
  }, []);

  useEffect(() => {
    if (!tplId) return;
    const tpl = templates.find(t => t.id === tplId);
    if (!tpl) return;
    setSubject(mergeTags(tpl.subject, prospect));
    setBody(mergeTags(tpl.body, prospect));
  }, [tplId]);

  useEffect(() => {
    if (!prospect?.stage_id) return;
    fetchStageTemplate(prospect.stage_id).then(tpl => {
      if (tpl) { setTplId(tpl.id); setSubject(mergeTags(tpl.subject, prospect)); setBody(mergeTags(tpl.body, prospect)); }
    }).catch(() => {});
  }, []);

  async function send() {
    if (!subject || !body) return;
    setSending(true);
    try {
      const fromEmail = localStorage.getItem('emailFromAddress') || '';
      const fromName  = localStorage.getItem('emailFromName') || 'Luxury Wedding Directory';
      if (prospect.email) {
        await sendEmail({ to: prospect.email, toName: prospect.contact_name, subject, text: body, fromEmail, fromName });
      }
      const tpl = templates.find(t => t.id === tplId);
      await logOutreachEmail({ prospectId: prospect.id, emailType: tpl?.email_type || 'custom', subject, body });
      onSent({ subject, body });
    } finally { setSending(false); }
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={S.modal}>
        <div style={S.modalHead}>Send Email to {prospect.company_name}</div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.formLabel}>Template</div>
          <select style={{ ...S.formSelect, marginTop: 4 }} value={tplId} onChange={e => setTplId(e.target.value)}>
            <option value="">Select template or write from scratch</option>
            {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={S.formLabel}>Subject</div>
          <input style={{ ...S.formInput, marginTop: 4, width: '100%', boxSizing: 'border-box' }} value={subject} onChange={e => setSubject(e.target.value)} />
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={S.formLabel}>Body</div>
          <textarea style={{ ...S.formTextarea, marginTop: 4, minHeight: 280, width: '100%', boxSizing: 'border-box' }} value={body} onChange={e => setBody(e.target.value)} />
        </div>
        {!prospect.email && <div style={{ fontSize: 12, color: '#dc2626', marginBottom: 12, background: '#fee2e2', padding: '8px 12px', borderRadius: 6 }}>No email on file. Email will be logged only.</div>}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <button style={S.outlineBtn} onClick={onClose}>Cancel</button>
          <button style={{ ...S.goldBtn, opacity: sending ? 0.6 : 1 }} onClick={send} disabled={sending || !subject || !body}>{sending ? 'Sending...' : 'Send Email'}</button>
        </div>
      </div>
    </div>
  );
}

// ── Prospect Panel ────────────────────────────────────────────────────────────

function ProspectPanel({ prospect, stages, templates, onEdit, onStageChange, onClose, onProspectUpdated }) {
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [showEmail,    setShowEmail]    = useState(false);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiResult,     setAiResult]     = useState(null);
  const [prefilledEmail, setPrefilledEmail] = useState(null);
  const [localScore,   setLocalScore]   = useState(prospect.lead_score ?? null);
  const [dealHealth,   setDealHealth]   = useState(null);
  const [closeProb,    setCloseProb]    = useState(null);
  const [onboardingTask, setOnboardingTask] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [contractStatus, setContractStatus] = useState(prospect.contract_status || 'none');

  async function updateContract(status) {
    const updates = { contract_status: status };
    if (status === 'sent') updates.contract_sent_at = new Date().toISOString();
    if (status === 'signed') updates.contract_signed_at = new Date().toISOString();
    await updateProspect(prospect.id, updates);
    setContractStatus(status);
    onProspectUpdated?.({ ...prospect, ...updates });
  }

  useEffect(() => {
    setHistLoading(true);
    fetchOutreachHistory(prospect.id)
      .then(h => {
        setHistory(h);
        const fresh = calculateLeadScore(prospect, h);
        setLocalScore(fresh);
        // Compute deal health + close probability
        const currentStage = stages.find(s => s.id === prospect.stage_id) || null;
        setDealHealth(calculateDealHealth({ ...prospect, lead_score: fresh }, h, currentStage));
        setCloseProb(calculateCloseProbability({ ...prospect, lead_score: fresh }, h, currentStage));
      })
      .finally(() => setHistLoading(false));
  }, [prospect.id]);

  useEffect(() => {
    const currentStage = stages.find(s => s.id === prospect.stage_id);
    if (!currentStage?.is_won && prospect.status !== 'converted') return;
    setOnboardingLoading(true);
    fetchOnboardingTask(prospect.id)
      .then(async task => {
        if (!task) {
          // Create on first open after Closed Won
          const created = await createOnboardingTask(prospect.id).catch(() => null);
          setOnboardingTask(created);
        } else {
          setOnboardingTask(task);
        }
      })
      .catch(() => {})
      .finally(() => setOnboardingLoading(false));
  }, [prospect.id, prospect.status]);

  async function handleToggleOnboarding(itemId) {
    if (!onboardingTask) return;
    try {
      const { task, onboardingComplete } = await toggleOnboardingItem(onboardingTask.id, itemId);
      setOnboardingTask(task);
      if (onboardingComplete) {
        // Refresh history to show the completion note
        fetchOutreachHistory(prospect.id).then(setHistory);
      }
    } catch (e) { console.error(e); }
  }

  function handleEmailSent(data) {
    const entry = { subject: data.subject, body: data.body, sent_at: new Date().toISOString(), status: 'sent', email_type: 'custom' };
    setHistory(h => [entry, ...h]);
    setShowEmail(false);
    setPrefilledEmail(null);
    setAiResult(null);
  }

  async function handleMarkReplied(emailId, idx) {
    try {
      await markReplied(emailId);
      setHistory(h => h.map((e, i) => i === idx ? { ...e, status: 'replied', replied_at: new Date().toISOString() } : e));
      // Move to Conversation stage and clear follow-up
      const convStage = stages.find(s =>
        s.pipeline_id === prospect.pipeline_id &&
        s.name.toLowerCase().includes('conversation')
      );
      if (convStage) await onStageChange(prospect, convStage);
      await updateProspect(prospect.id, { next_follow_up_at: null });
      onProspectUpdated?.({ ...prospect, next_follow_up_at: null });
      const fresh = calculateLeadScore(prospect, history.map((e, i) => i === idx ? { ...e, status: 'replied' } : e));
      setLocalScore(fresh);
    } catch (e) { console.error(e); }
  }

  async function handleAiAction(type) {
    setAiLoading(true);
    setAiResult(null);
    try {
      const currentStage = stages.find(s => s.id === prospect.stage_id);
      if (type === 'follow_up') {
        const result = await generateFollowUpEmail({ prospect, history, stageName: currentStage?.name });
        setPrefilledEmail(result);
        setShowEmail(true);
      } else if (type === 'proposal') {
        const result = await generateProposalEmail({ prospect, history });
        setPrefilledEmail(result);
        setShowEmail(true);
      } else if (type === 'cold') {
        const result = await generateColdEmail({ prospect });
        setPrefilledEmail(result);
        setShowEmail(true);
      } else if (type === 'next_step') {
        const text = await generateNextStepAdvice({ prospect, stage: currentStage, history });
        setAiResult({ type: 'next_step', text });
      } else if (type === 'next_action') {
        const text = await generateNextAction({ prospect, stage: currentStage, history });
        setAiResult({ type: 'next_action', text });
      }
    } catch (e) {
      setAiResult({ type: 'error', text: e.message || 'AI generation failed.' });
    } finally {
      setAiLoading(false);
    }
  }

  const scoreVal = localScore ?? prospect.lead_score;
  const scoreC   = scoreVal != null ? scoreColor(scoreVal) : '#aaa';

  return (
    <div style={S.panel}>
      <div style={S.panelHead}>
        <div style={S.panelTitle}>{prospect.company_name}</div>
        <button style={S.goldBtn} onClick={onEdit}>Edit</button>
        <button
          style={{ ...S.iconBtn, color: prospect.status === 'archived' ? '#22c55e' : '#dc2626', fontSize: 11, marginLeft: 'auto' }}
          onClick={async () => {
            const newStatus = prospect.status === 'archived' ? 'active' : 'archived';
            await updateProspect(prospect.id, { status: newStatus });
            onProspectUpdated?.({ ...prospect, status: newStatus });
            onClose();
          }}
        >
          {prospect.status === 'archived' ? 'Unarchive' : 'Archive'}
        </button>
        <button style={S.panelClose} onClick={onClose}>x</button>
      </div>
      <div style={S.panelBody}>

        {/* Deal Intelligence row: health + score + close probability */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14, alignItems: 'stretch', flexWrap: 'wrap' }}>
          {dealHealth && (
            <div style={{
              flex: 1, minWidth: 120, padding: '10px 12px', borderRadius: 8,
              background: dealHealthBgColor(dealHealth.status),
              border: `1px solid ${dealHealthColor(dealHealth.status)}30`,
              display: 'flex', flexDirection: 'column', gap: 4,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: dealHealthColor(dealHealth.status), flexShrink: 0 }} />
                <span style={{ fontSize: 12, fontWeight: 700, color: dealHealthColor(dealHealth.status) }}>{dealHealth.label}</span>
              </div>
              <div style={{ fontSize: 10, color: '#888', lineHeight: 1.4 }}>{dealHealth.reasons?.[0] || 'Deal health'}</div>
            </div>
          )}
          {scoreVal != null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: scoreC + '12', borderRadius: 8, border: `1px solid ${scoreC}30` }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: scoreC + '22', border: `2px solid ${scoreC}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: scoreC }}>{scoreVal}</div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: scoreC }}>{scoreLabel(scoreVal)}</div>
                <div style={{ fontSize: 10, color: '#888' }}>Lead score</div>
              </div>
            </div>
          )}
          {closeProb != null && <CloseProbRing prob={closeProb} />}
        </div>

        {/* Stage selector */}
        <div style={S.fieldLabel}>Stage</div>
        <select style={S.stageSelect} value={prospect.stage_id || ''} onChange={e => onStageChange(prospect, stages.find(s => s.id === e.target.value))}>
          <option value="">No stage</option>
          {stages.filter(s => s.pipeline_id === prospect.pipeline_id).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        {/* Contract tracking */}
        <div style={{ marginBottom: 16 }}>
          <div style={S.fieldLabel}>Contract</div>
          <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap' }}>
            {(['none','sent','signed','declined']).map(cs => {
              const colors = { none: '#aaa', sent: '#f59e0b', signed: '#22c55e', declined: '#ef4444' };
              const active = contractStatus === cs;
              return (
                <button key={cs} onClick={() => updateContract(cs)} style={{
                  padding: '5px 12px', borderRadius: 20, fontSize: 11, fontWeight: 600,
                  cursor: 'pointer', border: `1px solid ${active ? colors[cs] : '#ddd'}`,
                  background: active ? colors[cs] + '22' : 'transparent',
                  color: active ? colors[cs] : '#888',
                  transition: 'all 0.15s',
                }}>
                  {cs.charAt(0).toUpperCase() + cs.slice(1)}
                </button>
              );
            })}
          </div>
          {prospect.contract_sent_at && <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>Sent: {fmtDate(prospect.contract_sent_at)}</div>}
          {prospect.contract_signed_at && <div style={{ fontSize: 10, color: '#22c55e', marginTop: 2 }}>Signed: {fmtDate(prospect.contract_signed_at)}</div>}
        </div>

        {/* Email button */}
        <button style={{ ...S.goldBtn, marginBottom: 14, fontSize: 12, padding: '6px 14px' }} onClick={() => { setPrefilledEmail(null); setShowEmail(true); }}>Send Email</button>

        {/* Details */}
        {prospect.contact_name && <><div style={S.fieldLabel}>Contact</div><div style={S.fieldValue}>{prospect.contact_name}</div></>}
        {prospect.email && <><div style={S.fieldLabel}>Email</div><div style={S.fieldValue}><a href={`mailto:${prospect.email}`} style={{ color: G }}>{prospect.email}</a></div></>}
        {prospect.phone && <><div style={S.fieldLabel}>Phone</div><div style={S.fieldValue}>{prospect.phone}</div></>}
        {prospect.website && <><div style={S.fieldLabel}>Website</div><div style={S.fieldValue}><a href={prospect.website} target="_blank" rel="noreferrer" style={{ color: G }}>{prospect.website}</a></div></>}
        <div style={S.fieldLabel}>Source / Package</div><div style={S.fieldValue}>{prospect.source || '--'} / {prospect.package || '--'}</div>
        {prospect.proposal_value && <><div style={S.fieldLabel}>Proposal Value</div><div style={{ ...S.fieldValue, color: '#22c55e', fontWeight: 600 }}>GBP {formatValue(prospect.proposal_value)}</div></>}
        {prospect.next_follow_up_at && <><div style={S.fieldLabel}>Next Follow-Up</div><div style={{ ...S.fieldValue, color: isOverdue(prospect.next_follow_up_at) ? '#dc2626' : '#333' }}>{fmtDate(prospect.next_follow_up_at)}{isOverdue(prospect.next_follow_up_at) ? ' (Overdue)' : ''}</div></>}
        {prospect.notes && <><div style={S.fieldLabel}>Notes</div><div style={{ ...S.fieldValue, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{prospect.notes}</div></>}
        <div style={S.fieldLabel}>Added</div><div style={S.fieldValue}>{fmtDate(prospect.created_at)}</div>

        {/* ── AI Assistant ── */}
        <div style={S.aiSection}>
          <div style={{ ...S.fieldLabel, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: G }}>✦</span> AI Assistant
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <button style={S.aiBtn} onClick={() => handleAiAction('cold')} disabled={aiLoading}>
              {aiLoading ? '...' : '✦'} Cold Email
            </button>
            <button style={S.aiBtn} onClick={() => handleAiAction('follow_up')} disabled={aiLoading}>
              {aiLoading ? '...' : '✦'} Follow-Up
            </button>
            <button style={S.aiBtn} onClick={() => handleAiAction('proposal')} disabled={aiLoading}>
              {aiLoading ? '...' : '✦'} Proposal
            </button>
            <button style={{ ...S.aiBtn, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }} onClick={() => handleAiAction('next_step')} disabled={aiLoading}>
              {aiLoading ? '...' : '?'} Next Step
            </button>
            <button style={{ ...S.aiBtn, background: 'rgba(249,115,22,0.08)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', width: '100%', justifyContent: 'center' }} onClick={() => handleAiAction('next_action')} disabled={aiLoading}>
              {aiLoading ? '...' : '&#9654;'} AI Next Action
            </button>
          </div>
          {aiLoading && <div style={{ fontSize: 12, color: '#8f7420', padding: '8px 0' }}>Generating with AI...</div>}
          {aiResult?.type === 'next_step' && (
            <div style={S.aiResult}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#3b82f6', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Next Step Advice</div>
              {aiResult.text}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ ...S.iconBtn, fontSize: 11 }} onClick={() => setAiResult(null)}>Dismiss</button>
              </div>
            </div>
          )}
          {aiResult?.type === 'next_action' && (
            <div style={{ ...S.aiResult, borderLeft: '3px solid #f97316', background: 'rgba(249,115,22,0.04)' }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: '#f97316', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI Next Action</div>
              {aiResult.text}
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'flex-end' }}>
                <button style={{ ...S.iconBtn, fontSize: 11 }} onClick={() => setAiResult(null)}>Dismiss</button>
              </div>
            </div>
          )}
          {aiResult?.type === 'error' && (
            <div style={{ ...S.aiResult, background: '#fff5f5', border: '1px solid #fca5a5', color: '#dc2626' }}>{aiResult.text}</div>
          )}
        </div>

        {/* ── Activity ── */}
        <div style={{ borderTop: '1px solid #f3f0ea', paddingTop: 14, marginTop: 14 }}>
          <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Activity ({history.length})</div>
          {histLoading ? <div style={{ fontSize: 12, color: '#aaa' }}>Loading...</div>
            : history.length === 0 ? <div style={{ fontSize: 12, color: '#aaa' }}>No activity yet.</div>
            : history.map((h, i) => (
              <div key={h.id || i} style={{ ...S.histItem, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.subject}</div>
                  <div style={S.histTime}>
                    {fmtDate(h.sent_at)}
                    {' - '}
                    <span style={{ color: h.status === 'replied' ? '#22c55e' : h.status === 'bounced' ? '#dc2626' : '#888', fontWeight: h.status === 'replied' ? 600 : 400 }}>
                      {h.status}
                    </span>
                  </div>
                </div>
                {h.status === 'sent' && h.id && (
                  <button style={S.replyBtn} onClick={() => handleMarkReplied(h.id, i)} title="Mark this email as replied - stops follow-up sequence and moves to Conversation">
                    Replied
                  </button>
                )}
              </div>
            ))}
        </div>

        {/* Onboarding Checklist - shown for Closed Won prospects */}
        {(stages.find(s => s.id === prospect.stage_id)?.is_won || prospect.status === 'converted') && (
          <div style={{ borderTop: '1px solid #f3f0ea', paddingTop: 14, marginTop: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <div style={{ ...S.fieldLabel, margin: 0 }}>Onboarding Checklist</div>
              {onboardingTask && (() => {
                const prog = getOnboardingProgress(onboardingTask.checklist_items);
                return (
                  <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 600, color: onboardingTask.status === 'complete' ? '#22c55e' : '#f59e0b' }}>
                    {prog.completed}/{prog.total}
                  </span>
                );
              })()}
            </div>
            {onboardingTask && (() => {
              const prog = getOnboardingProgress(onboardingTask.checklist_items);
              return (
                <>
                  <div style={{ height: 5, background: '#f3f0ea', borderRadius: 100, marginBottom: 12 }}>
                    <div style={{ height: '100%', background: onboardingTask.status === 'complete' ? '#22c55e' : G, borderRadius: 100, width: `${prog.percentage}%`, transition: 'width 0.4s' }} />
                  </div>
                  {onboardingTask.checklist_items.map(item => (
                    <div key={item.id} onClick={() => handleToggleOnboarding(item.id)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f9f9f7', cursor: 'pointer' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${item.completed ? '#22c55e' : '#ccc'}`, background: item.completed ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                        {item.completed && <span style={{ color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1 }}>&#10003;</span>}
                      </div>
                      <span style={{ fontSize: 12, color: item.completed ? '#aaa' : '#333', textDecoration: item.completed ? 'line-through' : 'none', flex: 1 }}>{item.label}</span>
                    </div>
                  ))}
                  {onboardingTask.status === 'complete' && (
                    <div style={{ marginTop: 12, padding: '10px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 7, fontSize: 12, color: '#166534', fontWeight: 600 }}>
                      &#10003; Onboarding complete. Consider publishing the listing if not yet live.
                    </div>
                  )}
                </>
              );
            })()}
            {onboardingLoading && <div style={{ fontSize: 12, color: '#aaa' }}>Loading checklist...</div>}
          </div>
        )}
      </div>

      {showEmail && (
        <OutreachModal
          prospect={prospect}
          templates={templates.filter(t => t.pipeline_id === prospect.pipeline_id)}
          prefilled={prefilledEmail}
          onSent={handleEmailSent}
          onClose={() => { setShowEmail(false); setPrefilledEmail(null); }}
        />
      )}
    </div>
  );
}

// ── Kanban Board ──────────────────────────────────────────────────────────────

function KanbanBoard({ prospects, stages, onMoveToStage, onOpenPanel, onAddProspect }) {
  const [draggingId, setDraggingId] = useState(null);
  const [dragOverId, setDragOverId] = useState(null);

  function handleDragStart(e, pId) {
    setDraggingId(pId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', pId);
  }
  function handleDragEnd() { setDraggingId(null); setDragOverId(null); }
  function handleDragOver(e, stageId) { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; setDragOverId(stageId); }
  function handleDragLeave(e) { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverId(null); }
  function handleDrop(e, stage) {
    e.preventDefault();
    const pId = e.dataTransfer.getData('text/plain') || draggingId;
    setDraggingId(null); setDragOverId(null);
    if (pId) onMoveToStage(pId, stage);
  }

  return (
    <div style={S.kanban}>
      {stages.map(stage => {
        const cards = prospects.filter(p => p.stage_id === stage.id);
        const isOver = dragOverId === stage.id;
        return (
          <div key={stage.id} style={S.col(isOver)}
            onDragOver={e => handleDragOver(e, stage.id)}
            onDragLeave={handleDragLeave}
            onDrop={e => handleDrop(e, stage)}
          >
            <div style={S.colHead}>
              <div style={S.colDot(stage.color)} />
              <div style={S.colName}>{stage.name}</div>
              <div style={S.colCount}>{cards.length}</div>
            </div>
            <div style={S.colBody}>
              {cards.map(p => {
                const overdue = isOverdue(p.next_follow_up_at) && !stage.is_won && !stage.is_lost;
                const health  = calculateDealHealth(p, [], stage);
                return (
                  <div key={p.id} draggable style={S.card(draggingId === p.id)}
                    onDragStart={e => handleDragStart(e, p.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => onOpenPanel(p)}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 4, marginBottom: 3 }}>
                      <div style={S.cardCompany}>{p.company_name}</div>
                      <ScorePill score={p.lead_score} />
                    </div>
                    {p.contact_name && <div style={S.cardContact}>{p.contact_name}</div>}
                    <div style={{ marginBottom: 4 }}>
                      <DealHealthBadge health={health} />
                    </div>
                    <div style={S.cardFooter}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {overdue && <span style={S.overdueTag}>Overdue</span>}
                        {p.proposal_value && <span style={S.valueBadge}>GBP {formatValue(p.proposal_value)}</span>}
                        {p.deal_value && (
                          <span style={S.valueBadge}>{p.deal_currency || 'GBP'} {Number(p.deal_value).toLocaleString()}</span>
                        )}
                      </div>
                      <button style={S.iconBtn} onClick={e => { e.stopPropagation(); onOpenPanel(p); }}>Open</button>
                    </div>
                  </div>
                );
              })}
            </div>
            <button style={S.addCardBtn} onClick={() => onAddProspect(stage)}>+ Add</button>
          </div>
        );
      })}
    </div>
  );
}

// ── List View ─────────────────────────────────────────────────────────────────

function ListView({ prospects, stages, S, onOpenPanel, onBulkUpdate, sortKey, sortDir, onSort }) {
  const [selected, setSelected] = React.useState(new Set());
  const [bulkStatus, setBulkStatus] = React.useState('');
  const [bulkApplying, setBulkApplying] = React.useState(false);
  const allChecked = selected.size === prospects.length && prospects.length > 0;
  function toggleAll() {
    if (allChecked) setSelected(new Set());
    else setSelected(new Set(prospects.map(p => p.id)));
  }
  function toggle(id) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }
  async function applyBulk() {
    if (!bulkStatus || selected.size === 0) return;
    setBulkApplying(true);
    try {
      await onBulkUpdate(Array.from(selected), { status: bulkStatus });
      setSelected(new Set());
      setBulkStatus('');
    } finally { setBulkApplying(false); }
  }
  function col(key, label) {
    return <th style={S.th} onClick={() => onSort(key)}>{label} {sortKey === key ? (sortDir === 'asc' ? '\u25b2' : '\u25bc') : ''}</th>;
  }
  return (
    <div style={S.tableWrap}>
      {selected.size > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: '#fffdf8', borderBottom: '1px solid #ede8de', flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{selected.size} selected</span>
          <select style={{ padding: '6px 10px', border: '1px solid #ddd', borderRadius: 5, fontSize: 12 }} value={bulkStatus} onChange={e => setBulkStatus(e.target.value)}>
            <option value="">Change status...</option>
            <option value="active">Active</option>
            <option value="converted">Converted</option>
            <option value="lost">Lost</option>
            <option value="archived">Archived</option>
          </select>
          <button style={{ padding: '6px 14px', background: '#8f7420', color: '#fff', border: 'none', borderRadius: 5, fontSize: 12, cursor: 'pointer', opacity: bulkApplying || !bulkStatus ? 0.6 : 1 }} onClick={applyBulk} disabled={!bulkStatus || bulkApplying}>{bulkApplying ? 'Applying...' : 'Apply'}</button>
          <button style={{ padding: '6px 10px', background: 'transparent', border: '1px solid #ddd', borderRadius: 5, fontSize: 12, cursor: 'pointer' }} onClick={() => setSelected(new Set())}>Clear</button>
        </div>
      )}
      <table style={S.table}>
        <thead><tr>
          <th style={{ ...S.th, width: 36 }}><input type="checkbox" checked={allChecked} onChange={toggleAll} /></th>
          {col('lead_score','Score')}
          {col('company_name','Company')}
          {col('contact_name','Contact')}
          <th style={S.th}>Stage</th>
          <th style={S.th}>Type</th>
          {col('deal_value','Value')}
          <th style={S.th}>Contract</th>
          {col('next_follow_up_at','Follow-Up')}
          {col('last_contacted_at','Last Contact')}
        </tr></thead>
        <tbody>
          {prospects.map(p => {
            const stage = stages.find(s => s.id === p.stage_id);
            const overdue = isOverdue(p.next_follow_up_at) && !stage?.is_won && !stage?.is_lost;
            const contractColors = { none: '#aaa', sent: '#f59e0b', signed: '#22c55e', declined: '#ef4444' };
            return (
              <tr key={p.id} style={{ background: selected.has(p.id) ? 'rgba(143,116,32,0.07)' : (overdue ? '#fff8f6' : undefined), cursor: 'pointer' }}>
                <td style={S.td} onClick={e => e.stopPropagation()}><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggle(p.id)} /></td>
                <td style={S.td} onClick={() => onOpenPanel(p)}><ScorePill score={p.lead_score} /></td>
                <td style={S.td} onClick={() => onOpenPanel(p)}><strong>{p.company_name}</strong></td>
                <td style={S.td} onClick={() => onOpenPanel(p)}>{p.contact_name || '--'}</td>
                <td style={S.td} onClick={() => onOpenPanel(p)}>{stage ? <span style={S.badge(stage.color)}>{stage.name}</span> : '--'}</td>
                <td style={S.td} onClick={() => onOpenPanel(p)}>{p.venue_type || '--'}</td>
                <td style={S.td} onClick={() => onOpenPanel(p)}>{p.deal_value ? `${p.deal_currency || 'GBP'} ${Number(p.deal_value).toLocaleString()}` : '--'}</td>
                <td style={S.td} onClick={() => onOpenPanel(p)}><span style={{ fontSize: 11, color: contractColors[p.contract_status] || '#aaa', fontWeight: 600 }}>{(p.contract_status || 'none').charAt(0).toUpperCase() + (p.contract_status || 'none').slice(1)}</span></td>
                <td style={{ ...S.td, color: overdue ? '#dc2626' : undefined }} onClick={() => onOpenPanel(p)}>{fmtDate(p.next_follow_up_at)}{overdue ? ' !' : ''}</td>
                <td style={S.td} onClick={() => onOpenPanel(p)}>{fmtDate(p.last_contacted_at)}</td>
              </tr>
            );
          })}
          {prospects.length === 0 && <tr><td colSpan={10} style={{ ...S.td, textAlign: 'center', color: '#aaa', padding: '32px 0' }}>No prospects found.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

// ── Dashboard View ────────────────────────────────────────────────────────────

function DashboardView({ stats, stages, overdueFU, onRunFollowUps, followUpRunning, onRecalcScores, scoresRefreshing, intelligence, analytics, allProspects }) {
  const maxCount = Math.max(...stages.map(s => stats.stageCounts?.[s.name] || 0), 1);

  const sourceBreakdown = React.useMemo(() => {
    if (!allProspects?.length) return [];
    const counts = {};
    allProspects.forEach(p => {
      const s = p.source || 'Unknown';
      if (!counts[s]) counts[s] = { source: s, total: 0, converted: 0, active: 0 };
      counts[s].total++;
      if (p.status === 'converted') counts[s].converted++;
      if (p.status === 'active') counts[s].active++;
    });
    return Object.values(counts).sort((a, b) => b.total - a.total);
  }, [allProspects]);
  const kpis = [
    { label: 'Total Prospects',   value: stats.totalProspects   || 0 },
    { label: 'Active',            value: stats.activeProspects  || 0 },
    { label: 'Emails This Month', value: stats.emailsThisMonth  || 0 },
    { label: 'Reply Rate',        value: `${stats.replyRate     || 0}%` },
    { label: 'Meetings Booked',   value: stats.meetingsBooked   || 0 },
    { label: 'Proposals Sent',    value: stats.proposalsSent    || 0 },
    { label: 'Closed Won',        value: stats.closedWon        || 0 },
    { label: 'Close Rate',        value: `${stats.closeRate     || 0}%` },
  ];

  return (
    <div style={S.dash}>
      {overdueFU.length > 0 && (
        <div style={{ background: '#fffdf8', border: '1px solid rgba(143,116,32,0.3)', borderRadius: 8, padding: '14px 18px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <span style={S.fuBadge}>{overdueFU.length} Follow-ups Due</span>
          <span style={{ fontSize: 13, color: '#555', flex: 1 }}>{overdueFU.map(p => p.company_name).slice(0, 3).join(', ')}{overdueFU.length > 3 ? ` +${overdueFU.length - 3} more` : ''}</span>
          <button style={{ ...S.goldBtn, opacity: followUpRunning ? 0.6 : 1 }} onClick={onRunFollowUps} disabled={followUpRunning}>{followUpRunning ? 'Sending...' : 'Send Follow-Ups Now'}</button>
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
        <button style={S.outlineBtn} onClick={onRunFollowUps} disabled={!!followUpRunning}>
          {followUpRunning ? 'Running...' : 'Run Follow-ups Now'}
        </button>
      </div>

      <div style={S.kpiGrid}>
        {kpis.map(k => (
          <div key={k.label} style={S.kpiCard}>
            <div style={S.kpiVal}>{k.value}</div>
            <div style={S.kpiLabel}>{k.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button
          style={{ ...S.outlineBtn, fontSize: 12, padding: '6px 14px', display: 'flex', alignItems: 'center', gap: 5, opacity: scoresRefreshing ? 0.6 : 1 }}
          onClick={onRecalcScores}
          disabled={scoresRefreshing}
        >
          {scoresRefreshing ? 'Recalculating...' : '&#8635; Recalculate Lead Scores'}
        </button>
      </div>

      {/* Pipeline Intelligence */}
      {intelligence && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: 20 }}>

          {/* Deals at risk */}
          <div style={{ background: '#fff', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#92400e' }}>Deals at Risk</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#fef3c7', color: '#92400e', borderRadius: 100, padding: '1px 8px', fontWeight: 700 }}>{intelligence.dealsAtRisk.length}</span>
            </div>
            {intelligence.dealsAtRisk.length === 0
              ? <div style={{ fontSize: 12, color: '#aaa' }}>No deals at risk.</div>
              : intelligence.dealsAtRisk.slice(0, 4).map(p => (
                  <div key={p.id} style={{ fontSize: 12, color: '#555', padding: '5px 0', borderBottom: '1px solid #fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{p.company_name}</span>
                    {p.proposal_value ? <span style={{ color: '#f59e0b', fontSize: 11 }}>GBP {formatValue(p.proposal_value)}</span> : null}
                  </div>
                ))
            }
          </div>

          {/* High probability deals */}
          <div style={{ background: '#fff', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: '#166534' }}>High Probability</div>
              <span style={{ marginLeft: 'auto', fontSize: 11, background: '#dcfce7', color: '#166534', borderRadius: 100, padding: '1px 8px', fontWeight: 700 }}>{intelligence.highProbDeals.length}</span>
            </div>
            {intelligence.highProbDeals.length === 0
              ? <div style={{ fontSize: 12, color: '#aaa' }}>No high probability deals yet.</div>
              : intelligence.highProbDeals.slice(0, 4).map(p => (
                  <div key={p.id} style={{ fontSize: 12, color: '#555', padding: '5px 0', borderBottom: '1px solid #dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 500 }}>{p.company_name}</span>
                    {p.proposal_value ? <span style={{ color: '#22c55e', fontSize: 11, fontWeight: 600 }}>GBP {formatValue(p.proposal_value)}</span> : null}
                  </div>
                ))
            }
          </div>

          {/* Revenue potential + pipeline metrics */}
          <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>Revenue Intelligence</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Weighted Revenue Potential</div>
                <div style={{ fontSize: 22, fontWeight: 700, color: '#171717', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>
                  GBP {intelligence.revenuePotential.toLocaleString()}
                </div>
              </div>
              <div>
                <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Total Pipeline Value</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>GBP {intelligence.totalPipelineValue.toLocaleString()}</div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Avg Time in Pipeline</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{intelligence.avgDaysInPipeline} days</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#aaa', letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 2 }}>Won This Month</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#22c55e' }}>{intelligence.wonThisMonth}</div>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Email Analytics */}
      {analytics && (
        <div style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>Email Analytics</div>
            <div style={{ fontSize: 11, color: '#aaa', fontStyle: 'italic' }}>{analytics.openRateNote}</div>
          </div>

          {/* KPI row */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            {[
              { label: 'Emails Sent',     value: analytics.totalSent },
              { label: 'Open Rate',       value: `${analytics.openRate}%`,        note: 'approx' },
              { label: 'Reply Rate',      value: `${analytics.replyRate}%` },
              { label: 'Open to Reply',   value: `${analytics.openToReplyRate}%` },
              { label: 'Avg Reply Time',  value: analytics.avgReplyHours > 0 ? `${analytics.avgReplyHours}h` : '--' },
            ].map(k => (
              <div key={k.label} style={S.analyticsKpi}>
                <div style={S.analyticsKpiVal}>{k.value}{k.note ? <span style={{ fontSize: 11, color: '#aaa', fontWeight: 400, marginLeft: 4 }}>{k.note}</span> : null}</div>
                <div style={S.analyticsKpiLabel}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Subject line table */}
          {analytics.subjectLines.length > 0 && (
            <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12 }}>Subject Line Performance</div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead><tr>
                  {['Subject', 'Sent', 'Opens', 'Open %', 'Replies', 'Reply %'].map(h => (
                    <th key={h} style={{ textAlign: h === 'Subject' ? 'left' : 'center', padding: '5px 8px', color: '#aaa', fontWeight: 600, fontSize: 10, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #f3f0ea' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {analytics.subjectLines.map((s, i) => (
                    <tr key={s.subject} style={{ background: i === 0 && s.openRate >= 40 ? `${G}08` : 'transparent' }}>
                      <td style={{ padding: '6px 8px', borderLeft: i === 0 && s.openRate >= 40 ? `3px solid ${G}` : '3px solid transparent', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#333' }} title={s.subject}>{s.subject}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{s.sent}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{s.opens}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: s.openRate >= 40 ? '#22c55e' : s.openRate >= 20 ? '#f59e0b' : '#aaa' }}>{s.openRate}%</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', color: '#666' }}>{s.replies}</td>
                      <td style={{ padding: '6px 8px', textAlign: 'center', fontWeight: 600, color: s.replyRate >= 20 ? '#22c55e' : s.replyRate >= 10 ? '#f59e0b' : '#aaa' }}>{s.replyRate}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Send time heatmap */}
          {analytics.sendTimePatterns && (
            <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12 }}>Best Send Times (by Reply Rate)</div>
              <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                {analytics.sendTimePatterns.map(b => {
                  const intensity = Math.min(1, b.replyRate / 30);
                  const bg = b.sent > 0 ? `rgba(143,116,32,${0.1 + intensity * 0.7})` : '#f3f0ea';
                  const textC = intensity > 0.5 ? '#fff' : '#666';
                  return (
                    <div key={b.hour} title={`${b.label}: ${b.sent} sent, ${b.replyRate}% reply rate`} style={{ flex: '1 1 calc(8.33% - 3px)', minWidth: 36, height: 40, background: bg, borderRadius: 4, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'default' }}>
                      <div style={{ fontSize: 9, color: textC, fontWeight: 600, lineHeight: 1 }}>{b.label}</div>
                      {b.sent > 0 && <div style={{ fontSize: 9, color: textC, opacity: 0.8, marginTop: 1 }}>{b.replyRate}%</div>}
                    </div>
                  );
                })}
              </div>
              <div style={{ fontSize: 10, color: '#aaa', marginTop: 8 }}>Darker = higher reply rate. Hover for details.</div>
            </div>
          )}

          {sourceBreakdown.length > 0 && (
            <div style={{ background: S.kpiCard.background, border: S.kpiCard.border, borderRadius: 8, padding: '18px 20px', marginTop: 20 }}>
              <div style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', color: '#888', marginBottom: 14 }}>Source Breakdown</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {sourceBreakdown.map(({ source, total, converted, active }) => {
                  const convRate = total > 0 ? Math.round((converted / total) * 100) : 0;
                  const barW = `${Math.round((total / (sourceBreakdown[0]?.total || 1)) * 100)}%`;
                  return (
                    <div key={source} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 60px 60px', gap: 10, alignItems: 'center' }}>
                      <div style={{ fontSize: 12, fontWeight: 500, color: '#555', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{source}</div>
                      <div style={{ height: 8, background: '#f3f0ea', borderRadius: 4, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: barW, background: '#8f7420', borderRadius: 4, transition: 'width 0.4s' }} />
                      </div>
                      <div style={{ fontSize: 11, color: '#888', textAlign: 'right' }}>{total} total</div>
                      <div style={{ fontSize: 11, color: convRate > 30 ? '#22c55e' : '#888', textAlign: 'right', fontWeight: convRate > 30 ? 700 : 400 }}>{convRate}% conv.</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '18px 20px', marginBottom: 20 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 16 }}>Stage Distribution</div>
        {stages.map(stage => {
          const count = stats.stageCounts?.[stage.name] || 0;
          const pct   = Math.round((count / maxCount) * 100);
          return (
            <div key={stage.id} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
              <div style={{ width: 10, height: 10, borderRadius: '50%', background: stage.color, flexShrink: 0 }} />
              <div style={{ width: 150, fontSize: 12, color: '#555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stage.name}</div>
              <div style={{ flex: 1, background: '#f3f0ea', borderRadius: 100, height: 8 }}>
                <div style={{ width: `${pct}%`, height: '100%', background: stage.color, borderRadius: 100, transition: 'width 0.5s' }} />
              </div>
              <div style={{ width: 28, fontSize: 12, color: '#888', textAlign: 'right' }}>{count}</div>
            </div>
          );
        })}
      </div>

      {overdueFU.length > 0 && (
        <div style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 8, padding: '18px 20px' }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', marginBottom: 12 }}>Overdue Follow-Ups</div>
          {overdueFU.map(p => (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f0ea' }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{p.company_name}</div>
                <div style={{ fontSize: 11, color: '#aaa' }}>Due: {fmtDate(p.next_follow_up_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Campaign Builder Drawer ───────────────────────────────────────────────────

function CampaignBuilderDrawer({ prospects, pipelines, stages, templates, assignRules, assignSettings, onSaved, onClose }) {
  const [step, setStep] = useState(1); // 1=Filters 2=Audience 3=Compose 4=Confirm
  const [campaignName, setCampaignName] = useState('');
  const [filters, setFilters] = useState({ pipeline_id: '', stage_ids: [], venue_types: [], min_score: 0, statuses: ['active'] });
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [aiPersonalise, setAiPersonalise] = useState(false);
  const [sending, setSending] = useState(false);
  const [sendProgress, setSendProgress] = useState(0);
  const [sendTotal, setSendTotal] = useState(0);
  const [confirmed, setConfirmed] = useState(false); // double-click protection

  const VENUE_TYPES_OPTS = ['Venue', 'Vendor', 'Planner', 'Photographer', 'Florist', 'Caterer'];
  const STATUS_OPTS      = ['active', 'converted', 'lost', 'paused'];

  const audience = filterProspectsForCampaign(prospects, {
    pipeline_id:  filters.pipeline_id  || undefined,
    stage_ids:    filters.stage_ids.length  ? filters.stage_ids  : undefined,
    venue_types:  filters.venue_types.length ? filters.venue_types : undefined,
    min_score:    filters.min_score > 0 ? filters.min_score : undefined,
    statuses:     filters.statuses.length ? filters.statuses : ['active'],
  });

  function toggleArr(arr, val) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  async function handleSend() {
    if (confirmed || sending || audience.length === 0 || !subject || !body) return;
    setConfirmed(true); // prevent double-click
    setSending(true);
    setSendTotal(audience.length);
    try {
      const fromEmail = localStorage.getItem('emailFromAddress') || '';
      const fromName  = localStorage.getItem('emailFromName') || 'Luxury Wedding Directory';
      const campaign  = await createCampaign({
        name:                 campaignName || `Campaign ${new Date().toLocaleDateString('en-GB')}`,
        filters,
        subject,
        body,
        personalisation_mode: aiPersonalise ? 'ai_assisted' : 'template',
        from_email:           fromEmail,
        from_name:            fromName,
        total_recipients:     audience.length,
      });
      await sendCampaign({
        campaign,
        prospects: audience,
        fromEmail,
        fromName,
        templates,
        personaliseWithAI: aiPersonalise,
        onProgress: (sent) => setSendProgress(sent),
      });
      onSaved();
    } catch (e) {
      console.error('Campaign send failed:', e);
    } finally {
      setSending(false);
    }
  }

  const stepLabels = ['Filters', 'Audience', 'Compose', 'Confirm'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 2000, display: 'flex', justifyContent: 'flex-end' }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ width: 440, background: '#fff', height: '100%', overflowY: 'auto', boxShadow: '-4px 0 20px rgba(0,0,0,0.12)', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 16, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#171717' }}>New Campaign</div>
          <button style={S.panelClose} onClick={onClose}>x</button>
        </div>

        {/* Step pills */}
        <div style={{ display: 'flex', padding: '12px 20px', gap: 6, borderBottom: '1px solid #f0ece4' }}>
          {stepLabels.map((label, i) => (
            <div key={label} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '5px 0', borderRadius: 4, background: step === i + 1 ? G : step > i + 1 ? G + '22' : '#f3f0ea', color: step === i + 1 ? '#fff' : step > i + 1 ? G : '#aaa', cursor: step > i + 1 ? 'pointer' : 'default' }} onClick={() => { if (step > i + 1) setStep(i + 1); }}>{label}</div>
          ))}
        </div>

        {/* Step body */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>

          {step === 1 && (
            <div>
              <div style={S.formLabel}>Campaign Name</div>
              <input style={{ ...S.formInput, width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 18 }} value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. March Venue Outreach" />

              <div style={S.formLabel}>Pipeline</div>
              <select style={{ ...S.formSelect, width: '100%', marginTop: 4, marginBottom: 18 }} value={filters.pipeline_id} onChange={e => setFilters(f => ({ ...f, pipeline_id: e.target.value, stage_ids: [] }))}>
                <option value="">All pipelines</option>
                {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <div style={S.formLabel}>Stages</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 18 }}>
                {stages.filter(s => !filters.pipeline_id || s.pipeline_id === filters.pipeline_id).map(s => {
                  const active = filters.stage_ids.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => setFilters(f => ({ ...f, stage_ids: toggleArr(f.stage_ids, s.id) }))} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, border: `1px solid ${active ? s.color : '#ddd'}`, background: active ? s.color + '22' : 'transparent', color: active ? s.color : '#666', cursor: 'pointer' }}>{s.name}</button>
                  );
                })}
                {stages.filter(s => !filters.pipeline_id || s.pipeline_id === filters.pipeline_id).length === 0 && <div style={{ fontSize: 12, color: '#aaa' }}>Select a pipeline first</div>}
              </div>

              <div style={S.formLabel}>Venue Type</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6, marginBottom: 18 }}>
                {VENUE_TYPES_OPTS.map(vt => {
                  const active = filters.venue_types.includes(vt);
                  return (
                    <button key={vt} type="button" onClick={() => setFilters(f => ({ ...f, venue_types: toggleArr(f.venue_types, vt) }))} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, border: `1px solid ${active ? G : '#ddd'}`, background: active ? G + '22' : 'transparent', color: active ? G : '#666', cursor: 'pointer' }}>{vt}</button>
                  );
                })}
              </div>

              <div style={S.formLabel}>Min Lead Score: {filters.min_score}</div>
              <input type="range" min={0} max={100} step={5} value={filters.min_score} onChange={e => setFilters(f => ({ ...f, min_score: Number(e.target.value) }))} style={{ width: '100%', marginTop: 6, marginBottom: 18, accentColor: G }} />

              <div style={S.formLabel}>Status</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {STATUS_OPTS.map(st => {
                  const active = filters.statuses.includes(st);
                  return (
                    <button key={st} type="button" onClick={() => setFilters(f => ({ ...f, statuses: toggleArr(f.statuses, st) }))} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, border: `1px solid ${active ? G : '#ddd'}`, background: active ? G + '22' : 'transparent', color: active ? G : '#666', cursor: 'pointer', textTransform: 'capitalize' }}>{st}</button>
                  );
                })}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <div style={{ marginBottom: 14, padding: '12px 16px', background: audience.length > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${audience.length > 0 ? '#bbf7d0' : '#fca5a5'}` }}>
                <div style={{ fontSize: 18, fontWeight: 700, color: audience.length > 0 ? '#166534' : '#dc2626', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{audience.length} recipient{audience.length !== 1 ? 's' : ''}</div>
                <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>Matching your filter criteria with a valid email address</div>
              </div>
              {audience.length === 0 && <div style={{ fontSize: 12, color: '#aaa', textAlign: 'center', padding: '20px 0' }}>No prospects match these filters. Adjust filters in Step 1.</div>}
              <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                {audience.map(p => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f3f0ea', gap: 10 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: G, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.company_name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{p.email}</div>
                    </div>
                    <ScorePill score={p.lead_score} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <div style={S.formLabel}>Subject Line</div>
              <input style={{ ...S.formInput, width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 18 }} value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Partnership opportunity with Luxury Wedding Directory" />

              <div style={S.formLabel}>Email Body</div>
              <textarea style={{ ...S.formTextarea, width: '100%', boxSizing: 'border-box', marginTop: 4, minHeight: 220, marginBottom: 18 }} value={body} onChange={e => setBody(e.target.value)} placeholder="Write your email body here. Use {{company_name}}, {{contact_name}} for personalisation." />

              <div style={{ background: '#fffdf8', border: `1px solid ${G}30`, borderRadius: 8, padding: '12px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={aiPersonalise} onChange={e => setAiPersonalise(e.target.checked)} style={{ marginTop: 2, accentColor: G }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>AI Personalise each email</div>
                    <div style={{ fontSize: 11, color: '#888', marginTop: 2 }}>AI rewrites the body for each prospect based on their profile. Adds approx. 3 seconds per recipient.</div>
                  </div>
                </label>
              </div>

              <div style={{ marginTop: 14, padding: '10px 12px', background: '#f8f8f8', borderRadius: 6, fontSize: 11, color: '#aaa' }}>
                An unsubscribe footer will be automatically appended to every email.
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ background: '#f9f9f7', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px', marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#555', marginBottom: 12 }}>Send Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Campaign</span><span style={{ fontWeight: 600 }}>{campaignName || 'Untitled'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Recipients</span><span style={{ fontWeight: 600, color: '#166534' }}>{audience.length}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Subject</span><span style={{ fontWeight: 500, maxWidth: 200, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{subject}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Personalisation</span><span style={{ color: aiPersonalise ? G : '#888' }}>{aiPersonalise ? 'AI assisted' : 'Template'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>From</span><span>{localStorage.getItem('emailFromAddress') || 'Not configured'}</span></div>
                </div>
              </div>

              {sending && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Sending {sendProgress} of {sendTotal}...</div>
                  <div style={{ height: 6, background: '#f3f0ea', borderRadius: 100 }}>
                    <div style={{ height: '100%', background: G, borderRadius: 100, width: `${sendTotal > 0 ? (sendProgress / sendTotal) * 100 : 0}%`, transition: 'width 0.3s' }} />
                  </div>
                </div>
              )}

              <div style={{ fontSize: 11, color: '#dc2626', background: '#fee2e2', borderRadius: 6, padding: '10px 12px', marginBottom: 16 }}>
                Once sent, this campaign cannot be sent again. Each prospect will receive exactly one email.
              </div>

              <button
                style={{ ...S.goldBtn, width: '100%', padding: '13px 0', fontSize: 13, opacity: (sending || confirmed || audience.length === 0 || !subject || !body) ? 0.5 : 1 }}
                onClick={handleSend}
                disabled={sending || confirmed || audience.length === 0 || !subject || !body}
              >
                {sending ? `Sending (${sendProgress}/${sendTotal})...` : `Send Campaign to ${audience.length} Recipient${audience.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between' }}>
          <button style={S.outlineBtn} onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>{step === 1 ? 'Cancel' : 'Back'}</button>
          {step < 4
            ? <button style={S.goldBtn} onClick={() => setStep(s => s + 1)} disabled={step === 3 && (!subject || !body)}>Next</button>
            : null
          }
        </div>
      </div>
    </div>
  );
}

// ── Discovery Modal ───────────────────────────────────────────────────────────

function DiscoveryModal({ pipelines, allStages, assignRules, assignSettings, onImported, onClose }) {
  const [tab,           setTab]           = useState('keyword'); // 'keyword' | 'url'
  const [query,         setQuery]         = useState('');
  const [location,      setLocation]      = useState('United Kingdom');
  const [venueType,     setVenueType]     = useState('Venue');
  const [count,         setCount]         = useState(8);
  const [url,           setUrl]           = useState('');
  const [results,       setResults]       = useState([]);
  const [selected,      setSelected]      = useState(new Set());
  const [urlDraft,      setUrlDraft]      = useState(null);
  const [loading,       setLoading]       = useState(false);
  const [importing,     setImporting]     = useState(false);
  const [error,         setError]         = useState(null);

  const TYPES = ['Venue', 'Photographer', 'Florist', 'Caterer', 'Planner', 'Musician', 'Hair and Makeup', 'Cake Designer', 'Transport', 'Vendor'];

  async function handleDiscover() {
    if (!query.trim() || !location.trim()) return;
    setLoading(true); setError(null); setResults([]); setSelected(new Set());
    try {
      const res = await discoverByKeywords({ query, location, venueType, count });
      setResults(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleExtract() {
    if (!url.trim()) return;
    setLoading(true); setError(null); setUrlDraft(null);
    try {
      const res = await discoverFromUrl(url);
      setUrlDraft(res);
    } catch (e) { setError(e.message); }
    finally { setLoading(false); }
  }

  async function handleImportKeyword() {
    const toImport = results.filter(r => selected.has(r.company_name));
    if (!toImport.length) return;
    setImporting(true);
    try {
      const created = await importDiscoveredProspects(toImport, { pipelines, rules: assignRules, settings: assignSettings, allStages });
      onImported(created);
    } catch (e) { setError(e.message); }
    finally { setImporting(false); }
  }

  async function handleImportUrl() {
    if (!urlDraft) return;
    setImporting(true);
    try {
      const created = await importDiscoveredProspects([urlDraft], { pipelines, rules: assignRules, settings: assignSettings, allStages });
      onImported(created);
    } catch (e) { setError(e.message); }
    finally { setImporting(false); }
  }

  function toggleSelect(name) {
    setSelected(s => {
      const ns = new Set(s);
      ns.has(name) ? ns.delete(name) : ns.add(name);
      return ns;
    });
  }

  return (
    <div style={S.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ ...S.modal, maxWidth: 640, width: '95vw' }}>
        <div style={S.modalHead}>Prospect Discovery Engine</div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #f0ece4', marginBottom: 20 }}>
          {[['keyword', 'Keyword Search'], ['url', 'URL Extract']].map(([key, label]) => (
            <button key={key} onClick={() => { setTab(key); setError(null); setResults([]); setUrlDraft(null); }} style={{ padding: '8px 18px', background: 'none', border: 'none', borderBottom: tab === key ? `2px solid ${G}` : '2px solid transparent', color: tab === key ? G : '#888', fontSize: 13, fontWeight: tab === key ? 600 : 400, cursor: 'pointer' }}>{label}</button>
          ))}
        </div>

        {tab === 'keyword' && (
          <div>
            <div style={S.formRow}>
              <div style={S.formCol}>
                <div style={S.formLabel}>Search Query</div>
                <input style={{ ...S.formInput, marginTop: 4 }} value={query} onChange={e => setQuery(e.target.value)} placeholder="e.g. luxury barn venues" onKeyDown={e => e.key === 'Enter' && handleDiscover()} />
              </div>
              <div style={S.formCol}>
                <div style={S.formLabel}>Location</div>
                <input style={{ ...S.formInput, marginTop: 4 }} value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. Cotswolds, UK" />
              </div>
            </div>
            <div style={S.formRow}>
              <div style={S.formCol}>
                <div style={S.formLabel}>Business Type</div>
                <select style={{ ...S.formSelect, marginTop: 4 }} value={venueType} onChange={e => setVenueType(e.target.value)}>
                  {TYPES.map(t => <option key={t}>{t}</option>)}
                </select>
              </div>
              <div style={S.formCol}>
                <div style={S.formLabel}>Count</div>
                <select style={{ ...S.formSelect, marginTop: 4 }} value={count} onChange={e => setCount(Number(e.target.value))}>
                  {[5, 8, 10, 15].map(n => <option key={n} value={n}>{n} suggestions</option>)}
                </select>
              </div>
            </div>
            <button style={{ ...S.goldBtn, marginBottom: 20, opacity: loading ? 0.6 : 1 }} onClick={handleDiscover} disabled={loading || !query || !location}>{loading ? 'Discovering...' : 'Discover Prospects'}</button>

            {results.length > 0 && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#555' }}>{results.length} suggestions</div>
                  <button style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }} onClick={() => setSelected(selected.size === results.length ? new Set() : new Set(results.map(r => r.company_name)))}>{selected.size === results.length ? 'Deselect all' : 'Select all'}</button>
                </div>
                {results.map(r => (
                  <div key={r.company_name} onClick={() => toggleSelect(r.company_name)} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 12px', borderRadius: 7, marginBottom: 8, background: selected.has(r.company_name) ? G + '08' : '#fafaf8', border: `1px solid ${selected.has(r.company_name) ? G + '40' : '#ede8de'}`, cursor: 'pointer' }}>
                    <input type="checkbox" checked={selected.has(r.company_name)} onChange={() => {}} style={{ marginTop: 3, accentColor: G }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#171717' }}>{r.company_name}</div>
                      {r.website && <div style={{ fontSize: 11, color: G }}>{r.website}</div>}
                      {r.notes && <div style={{ fontSize: 12, color: '#666', marginTop: 3, lineHeight: 1.5 }}>{r.notes}</div>}
                    </div>
                    <span style={{ fontSize: 10, color: '#888', background: '#f3f0ea', padding: '2px 8px', borderRadius: 100, whiteSpace: 'nowrap' }}>{r.venue_type}</span>
                  </div>
                ))}
                <button style={{ ...S.goldBtn, width: '100%', marginTop: 10, opacity: selected.size === 0 || importing ? 0.6 : 1 }} onClick={handleImportKeyword} disabled={selected.size === 0 || importing}>{importing ? 'Importing...' : `Import ${selected.size} Selected Prospect${selected.size !== 1 ? 's' : ''}`}</button>
              </div>
            )}
          </div>
        )}

        {tab === 'url' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={S.formLabel}>Website URL</div>
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <input style={{ ...S.formInput, flex: 1 }} value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.venuename.co.uk" onKeyDown={e => e.key === 'Enter' && handleExtract()} />
                <button style={{ ...S.goldBtn, opacity: loading ? 0.6 : 1, whiteSpace: 'nowrap' }} onClick={handleExtract} disabled={loading || !url}>{loading ? 'Extracting...' : 'Extract Details'}</button>
              </div>
            </div>

            {urlDraft && (
              <div>
                <div style={{ marginBottom: 14 }}>
                  {[['company_name', 'Company Name'], ['contact_name', 'Contact Name'], ['email', 'Email'], ['venue_type', 'Type'], ['website', 'Website'], ['country', 'Country']].map(([k, label]) => (
                    <div key={k} style={S.formRow}>
                      <div style={S.formCol}>
                        <div style={S.formLabel}>{label}</div>
                        <input style={{ ...S.formInput, marginTop: 4 }} value={urlDraft[k] || ''} onChange={e => setUrlDraft(d => ({ ...d, [k]: e.target.value }))} />
                      </div>
                    </div>
                  ))}
                  <div style={S.formLabel}>Notes</div>
                  <textarea style={{ ...S.formTextarea, width: '100%', boxSizing: 'border-box', marginTop: 4 }} value={urlDraft.notes || ''} onChange={e => setUrlDraft(d => ({ ...d, notes: e.target.value }))} rows={3} />
                </div>
                <button style={{ ...S.goldBtn, width: '100%', opacity: importing ? 0.6 : 1 }} onClick={handleImportUrl} disabled={importing || !urlDraft.company_name}>{importing ? 'Saving...' : 'Save as Prospect'}</button>
              </div>
            )}
          </div>
        )}

        {error && <div style={{ marginTop: 14, fontSize: 12, color: '#dc2626', background: '#fee2e2', padding: '8px 12px', borderRadius: 6 }}>{error}</div>}

        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'flex-end' }}>
          <button style={S.outlineBtn} onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}

// ── Campaigns View ────────────────────────────────────────────────────────────

function CampaignsView({ campaigns, onNewCampaign, onRefresh }) {
  const [statsCache, setStatsCache] = useState({});
  useEffect(() => {
    campaigns.filter(c => c.status === 'sent').forEach(async c => {
      try {
        const s = await fetchCampaignStats(c.id);
        setStatsCache(prev => ({ ...prev, [c.id]: s }));
      } catch {}
    });
  }, [campaigns.length]);

  const STATUS_COLOR = { draft: '#aaa', sending: '#f59e0b', sent: '#22c55e', paused: '#f97316' };

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 24px' }}>
      <div style={{ padding: '16px 24px 12px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#555' }}>Outreach Campaigns</div>
        <div style={{ flex: 1 }} />
        <button style={S.goldBtn} onClick={onNewCampaign}>+ New Campaign</button>
      </div>
      <div style={{ padding: '0 24px' }}>
        {campaigns.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#aaa' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>&#9993;</div>
            <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6 }}>No campaigns yet</div>
            <div style={{ fontSize: 12 }}>Create your first campaign to send personalised outreach to a filtered group of prospects.</div>
          </div>
        ) : (
          <table style={S.campTable}>
            <thead><tr>
              <th style={S.campTh}>Campaign</th>
              <th style={S.campTh}>Status</th>
              <th style={S.campTh}>Recipients</th>
              <th style={S.campTh}>Opens</th>
              <th style={S.campTh}>Replies</th>
              <th style={S.campTh}>Sent</th>
            </tr></thead>
            <tbody>
              {campaigns.map(c => {
                const stats = statsCache[c.id];
                const statusColor = STATUS_COLOR[c.status] || '#aaa';
                return (
                  <tr key={c.id}>
                    <td style={S.campTd}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{c.name}</div>
                      <div style={{ fontSize: 11, color: '#aaa', marginTop: 2 }}>{c.personalisation_mode === 'ai_assisted' ? 'AI Personalised' : 'Template'}</div>
                    </td>
                    <td style={S.campTd}><span style={{ ...S.badge(statusColor), textTransform: 'capitalize' }}>{c.status}</span></td>
                    <td style={S.campTd}>{c.sent_count} / {c.total_recipients}</td>
                    <td style={S.campTd}>{stats ? `${stats.opens} (${stats.openRate}%)` : (c.status === 'sent' ? '--' : '--')}</td>
                    <td style={S.campTd}>{stats ? `${stats.replies} (${stats.replyRate}%)` : (c.status === 'sent' ? '--' : '--')}</td>
                    <td style={S.campTd}>{c.sent_at ? new Date(c.sent_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '--'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SalesPipelineModule() {
  const { C } = useContext(ThemeCtx);
  const G = C?.gold || '#8f7420';
  const S = makeS(C || {
    black: '#fafaf8', card: '#fff', dark: '#fafaf8', white: '#171717',
    grey: '#888', grey2: '#aaa', border: '#ede8de', gold: '#8f7420',
  }, G);

  const [pipelines,     setPipelines]     = useState([]);
  const [allStages,     setAllStages]     = useState([]);
  const [allTemplates,  setAllTemplates]  = useState([]);
  const [prospects,     setProspects]     = useState([]);
  const [overdueFU,     setOverdueFU]     = useState([]);
  const [stats,         setStats]         = useState({});
  const [selectedPipeline, setSelectedPipeline] = useState('');
  const [view,          setView]          = useState('kanban');
  const [search,        setSearch]        = useState('');
  const [openPanel,     setOpenPanel]     = useState(null);
  const [editModal,     setEditModal]     = useState(null);
  const [defaultStage,  setDefaultStage]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [sortKey,       setSortKey]       = useState('company_name');
  const [sortDir,       setSortDir]       = useState('asc');
  const [fuRunning,     setFuRunning]     = useState(false);
  const [scoresRefreshing, setScoresRefreshing] = useState(false);
  const [toast,         setToast]         = useState(null);
  const [assignRules,   setAssignRules]   = useState([]);
  const [assignSettings,setAssignSettings] = useState({ ai_fallback_enabled: true, fallback_pipeline_id: null });
  const [pipelineIntel, setPipelineIntel] = useState(null);
  const [campaigns,     setCampaigns]     = useState([]);
  const [showCampaignBuilder, setShowCampaignBuilder] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);
  const [emailAnalytics, setEmailAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const currentStages    = allStages.filter(s => s.pipeline_id === selectedPipeline);
  const currentTemplates = allTemplates.filter(t => t.pipeline_id === selectedPipeline);

  const filtered = prospects
    .filter(p => showArchived ? p.status === 'archived' : p.status !== 'archived')
    .filter(p => {
      if (selectedPipeline && p.pipeline_id !== selectedPipeline) return false;
      if (search) {
        const q = search.toLowerCase();
        return (p.company_name || '').toLowerCase().includes(q)
          || (p.contact_name || '').toLowerCase().includes(q)
          || (p.email || '').toLowerCase().includes(q);
      }
      return true;
    })
    .sort((a, b) => {
      const av = a[sortKey] || '', bv = b[sortKey] || '';
      return sortDir === 'asc' ? String(av).localeCompare(String(bv)) : String(bv).localeCompare(String(av));
    });

  useEffect(() => {
    (async () => {
      try {
        const [pipeList, pList, fu, s, rules, aSettings] = await Promise.all([
          fetchPipelines(), fetchProspects(), fetchFollowUpsDue(), fetchSalesStats(),
          fetchAssignmentRules(), fetchAssignmentSettings(),
        ]);
        setAssignRules(rules);
        setAssignSettings(aSettings);
        setPipelines(pipeList);
        // Seed lead scores client-side for any prospects with score = 0 or null
        const scoredList = pList.map(p => ({
          ...p,
          lead_score: (p.lead_score != null && p.lead_score > 0) ? p.lead_score : calculateLeadScore(p, []),
        }));
        setProspects(scoredList);
        setOverdueFU(fu);
        setStats(s);
        if (pipeList.length) {
          const def = pipeList.find(p => p.is_default) || pipeList[0];
          setSelectedPipeline(def.id);
          const [stages, templates] = await Promise.all([
            Promise.all(pipeList.map(p => fetchStages(p.id).catch(() => []))).then(r => r.flat()),
            Promise.all(pipeList.map(p => fetchTemplates(p.id).catch(() => []))).then(r => r.flat()),
          ]);
          setAllStages(stages);
          setAllTemplates(templates);

          // Compute pipeline intelligence with health + prob maps
          const healthMap = {};
          const probMap   = {};
          for (const p of scoredList) {
            const st = stages.find(s => s.id === p.stage_id) || null;
            const h  = calculateDealHealth(p, [], st);
            healthMap[p.id] = h;
            probMap[p.id]   = calculateCloseProbability(p, [], st);
          }
          setPipelineIntel(getPipelineIntelligence(scoredList, stages, healthMap, probMap));
        }
        // Load campaigns in parallel
        fetchCampaigns().then(setCampaigns).catch(() => {});
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
    })();
  }, []);

  useEffect(() => {
    if (view !== 'dashboard') return;
    // Refresh analytics every time the Dashboard view is opened
    setAnalyticsLoading(true);
    fetchEmailAnalytics({}).then(a => {
      setEmailAnalytics(a);
    }).catch(() => {}).finally(() => setAnalyticsLoading(false));
  }, [view]);

  async function handleMoveToStage(prospectId, stage) {
    if (!stage) return;
    const prospect = prospects.find(p => p.id === prospectId);
    if (!prospect) return;

    // Optimistic
    setProspects(list => list.map(p => p.id === prospectId ? { ...p, stage_id: stage.id, pipeline_stage: stage.name, pipeline_id: stage.pipeline_id } : p));
    if (openPanel?.id === prospectId) setOpenPanel(prev => ({ ...prev, stage_id: stage.id, pipeline_stage: stage.name }));

    const nextFU = stage.auto_follow_up_days
      ? new Date(Date.now() + stage.auto_follow_up_days * 86400000).toISOString()
      : null;

    try {
      await updateProspect(prospectId, {
        stage_id: stage.id,
        pipeline_stage: stage.name,
        pipeline_id: stage.pipeline_id,
        next_follow_up_at: nextFU,
      });

      if (stage.is_won) {
        await updateProspect(prospectId, { status: 'converted' });
        const actions = Array.isArray(stage.closed_won_actions) ? stage.closed_won_actions : [];
        const result = await fireClosedWonActions({ ...prospect, pipeline_id: stage.pipeline_id, stage_id: stage.id }, actions);
        notify(`Closed Won - ${[result.welcomeSent && 'welcome email sent', result.newsletterAdded && 'added to newsletter', result.activated && 'profile activated', result.taskCreated && 'task created'].filter(Boolean).join(', ') || 'deal recorded'}.`);
        setStats(prev => ({ ...prev, closedWon: (prev.closedWon || 0) + 1 }));
      }
      if (stage.is_lost) await updateProspect(prospectId, { status: 'lost' });
    } catch (e) { console.error('Move failed:', e); }
  }

  function handleAddProspect(stage = null) { setDefaultStage(stage); setEditModal(false); }

  function handleProspectSaved(saved, assignment) {
    // Seed lead score immediately on create
    const withScore = {
      ...saved,
      lead_score: saved.lead_score > 0 ? saved.lead_score : calculateLeadScore(saved, []),
    };
    setProspects(list => {
      const idx = list.findIndex(p => p.id === withScore.id);
      return idx >= 0 ? list.map(p => p.id === withScore.id ? withScore : p) : [withScore, ...list];
    });
    setEditModal(null);
    setDefaultStage(null);
    if (openPanel?.id === withScore.id) setOpenPanel(withScore);
    // Show auto-assign toast for new prospects
    if (assignment) {
      const pipeName = pipelines.find(p => p.id === assignment.pipeline_id)?.name || 'pipeline';
      const via = assignment.method === 'rule' ? 'matched rule' : assignment.method === 'ai' ? 'AI classification' : 'default fallback';
      notify(`Auto-assigned to ${pipeName} via ${via}.`);
    }
  }

  async function handleRunFollowUps() {
    setFuRunning(true);
    try {
      const fromEmail = localStorage.getItem('emailFromAddress') || '';
      const fromName  = localStorage.getItem('emailFromName') || 'Luxury Wedding Directory';
      const result = await runAutoFollowUps({ fromEmail, fromName });
      notify(`${result.sent} follow-up email${result.sent !== 1 ? 's' : ''} sent.`);
      setOverdueFU(await fetchFollowUpsDue());
    } catch (e) { notify('Follow-up run failed: ' + e.message); }
    finally { setFuRunning(false); }
  }

  async function handleRecalcScores() {
    setScoresRefreshing(true);
    try {
      const count = await batchRefreshScores();
      // Reload prospects with fresh scores
      const fresh = await fetchProspects();
      setProspects(fresh);
      notify(`Lead scores updated for ${count} prospects.`);
    } catch (e) { notify('Score update failed: ' + e.message); }
    finally { setScoresRefreshing(false); }
  }

  function handleSort(key) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  async function handleBulkUpdate(ids, updates) {
    await Promise.all(ids.map(id => updateProspect(id, updates)));
    const fresh = await fetchProspects();
    setProspects(fresh);
    notify(`Updated ${ids.length} prospects`);
  }

  function notify(msg) { setToast(msg); setTimeout(() => setToast(null), 5500); }

  if (loading) return <div style={{ padding: 40, color: '#888', textAlign: 'center' }}>Loading pipeline...</div>;

  return (
    <div style={S.wrap}>
      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, background: '#171717', color: '#fff', padding: '12px 20px', borderRadius: 8, fontSize: 13, zIndex: 3000, maxWidth: 380, lineHeight: 1.6, boxShadow: '0 4px 20px rgba(0,0,0,0.3)' }}>
          {toast}
        </div>
      )}

      {/* Top bar */}
      <div style={S.topBar}>
        <div style={S.heading}>Sales Pipeline</div>
        <select style={S.pipeSelect} value={selectedPipeline} onChange={e => setSelectedPipeline(e.target.value)}>
          {pipelines.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input style={S.searchBox} placeholder="Search prospects..." value={search} onChange={e => setSearch(e.target.value)} />
        <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: S.fieldLabel?.color || '#888', cursor: 'pointer', whiteSpace: 'nowrap' }}>
          <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
          Show Archived
        </label>
        {overdueFU.length > 0 && view !== 'dashboard' && (
          <span style={{ ...S.fuBadge, cursor: 'pointer' }} onClick={() => setView('dashboard')}>{overdueFU.length} due</span>
        )}
        <div style={{ flex: 1 }} />
        <div style={S.viewBtns}>
          <button style={S.viewBtn(view === 'kanban')}    onClick={() => setView('kanban')}>Kanban</button>
          <button style={S.viewBtn(view === 'list')}      onClick={() => setView('list')}>List</button>
          <button style={S.viewBtn(view === 'dashboard')} onClick={() => setView('dashboard')}>Dashboard</button>
          <button style={S.viewBtn(view === 'campaigns')} onClick={() => setView('campaigns')}>Campaigns</button>
        </div>
        <button style={{ ...S.outlineBtn, fontSize: 12, padding: '7px 14px' }} onClick={() => setShowDiscovery(true)}>&#9740; Discover</button>
        <button style={{ ...S.outlineBtn, fontSize: 12, padding: '7px 14px' }} onClick={() => exportProspectsCSV(filtered)}>&#8595; Export CSV</button>
        <button style={S.goldBtn} onClick={() => handleAddProspect()}>+ Add Prospect</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'kanban' && (
            <KanbanBoard
              prospects={filtered}
              stages={currentStages}
              onMoveToStage={handleMoveToStage}
              onOpenPanel={p => setOpenPanel(p)}
              onAddProspect={stage => handleAddProspect(stage)}
            />
          )}
          {view === 'list' && (
            <ListView
              prospects={filtered}
              stages={allStages}
              S={S}
              onOpenPanel={p => setOpenPanel(p)}
              onBulkUpdate={handleBulkUpdate}
              sortKey={sortKey}
              sortDir={sortDir}
              onSort={handleSort}
            />
          )}
          {view === 'dashboard' && (
            <DashboardView
              stats={stats}
              stages={currentStages}
              overdueFU={overdueFU}
              onRunFollowUps={handleRunFollowUps}
              followUpRunning={fuRunning}
              onRecalcScores={handleRecalcScores}
              scoresRefreshing={scoresRefreshing}
              intelligence={pipelineIntel}
              analytics={analyticsLoading ? null : emailAnalytics}
              allProspects={prospects}
            />
          )}
          {view === 'campaigns' && (
            <CampaignsView
              campaigns={campaigns}
              onNewCampaign={() => setShowCampaignBuilder(true)}
              onRefresh={() => fetchCampaigns().then(setCampaigns).catch(() => {})}
            />
          )}
        </div>

        {openPanel && (
          <ProspectPanel
            prospect={openPanel}
            stages={allStages}
            templates={allTemplates}
            onEdit={() => setEditModal(openPanel)}
            onStageChange={async (p, stage) => { if (stage) await handleMoveToStage(p.id, stage); }}
            onClose={() => setOpenPanel(null)}
            onProspectUpdated={updated => {
              setProspects(list => list.map(p => p.id === updated.id ? { ...p, ...updated } : p));
              setOpenPanel(prev => ({ ...prev, ...updated }));
            }}
          />
        )}
      </div>

      {editModal !== null && (
        <ProspectModal
          prospect={editModal || null}
          pipelines={pipelines}
          stages={allStages}
          defaultStage={defaultStage}
          assignRules={assignRules}
          assignSettings={assignSettings}
          onSave={handleProspectSaved}
          onClose={() => { setEditModal(null); setDefaultStage(null); }}
        />
      )}

      {showCampaignBuilder && (
        <CampaignBuilderDrawer
          prospects={prospects}
          pipelines={pipelines}
          stages={allStages}
          templates={allTemplates}
          assignRules={assignRules}
          assignSettings={assignSettings}
          onSaved={() => {
            setShowCampaignBuilder(false);
            fetchCampaigns().then(setCampaigns).catch(() => {});
            notify('Campaign sent successfully.');
          }}
          onClose={() => setShowCampaignBuilder(false)}
        />
      )}

      {showDiscovery && (
        <DiscoveryModal
          pipelines={pipelines}
          allStages={allStages}
          assignRules={assignRules}
          assignSettings={assignSettings}
          onImported={created => {
            setProspects(list => [...created, ...list]);
            setShowDiscovery(false);
            notify(`${created.length} prospect${created.length !== 1 ? 's' : ''} added from Discovery Engine.`);
          }}
          onClose={() => setShowDiscovery(false)}
        />
      )}
    </div>
  );
}
