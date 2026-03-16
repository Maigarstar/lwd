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
  sendSequenceStep,
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
import {
  computeEngagement,
  engagementDotColor,
  ENGAGEMENT_STATUS_CONFIG,
  fmtLastContact,
  fmtDaysInPipeline,
} from '../../services/engagementService';
import { ThemeCtx } from '../../theme/ThemeContext';
import ProspectPanel from './SalesPipelinePanel';
import UrlToLeadModal from '../../components/crm/UrlToLeadModal';
import DashboardView from './SalesPipelineDashboard';
import CampaignBuilderDrawer from './SalesPipelineCampaignDrawer';
import DiscoveryModal from './SalesPipelineDiscoveryModal';

// ── Constants ─────────────────────────────────────────────────────────────────

const VENUE_TYPES  = ['Venue', 'Vendor', 'Planner', 'Brand', 'Editorial'];
const SOURCES      = ['Referral', 'LinkedIn', 'Google', 'Directory', 'Event', 'Other'];
const PACKAGES     = ['Standard', 'Premium', 'Elite'];
const COUNTRIES    = ['United Kingdom', 'Ireland', 'France', 'Italy', 'Spain', 'USA', 'Other'];

// ── Styles ────────────────────────────────────────────────────────────────────

// Module-level S used by sub-components (light mode defaults).
// SalesPipelineModule overrides this with a themed version via makeS(C, G).
const LIGHT_C = { black: '#fafaf8', card: '#fff', dark: '#fafaf8', white: '#171717', grey: '#888', grey2: '#aaa', border: '#ede8de', gold: '#8f7420' };
const LIGHT_G = '#8f7420';
// Module-level alias so standalone component functions (ProspectPanel, etc.)
// can reference G without it being in scope of SalesPipelineModule closure.
// SalesPipelineModule re-assigns this via its own const G = C?.gold || LIGHT_G.
let G = LIGHT_G;

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

// Module-level fallback (light mode) - overridden inside SalesPipelineModule
let S = makeS(LIGHT_C, LIGHT_G);

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

// OutreachModal and NoteModal have been moved into SalesPipelinePanel.jsx

// ── Lost Reason Modal ─────────────────────────────────────────────────────────

function LostReasonModal({ prospect, onSave, onSkip }) {
  const [reason, setReason] = useState('');
  const [notes,  setNotes]  = useState('');
  const reasons = ['Price', 'Timing', 'Competitor', 'No Response', 'Not a Fit', 'Other'];

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 4000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 460, maxWidth: '94vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#171717', marginBottom: 4 }}>Why was this deal lost?</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 18 }}>{prospect?.company_name} - capturing this improves your win rate over time.</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
          {reasons.map(r => (
            <button key={r} onClick={() => setReason(r)} style={{
              padding: '7px 16px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              border: `1px solid ${reason === r ? '#dc2626' : '#e5e7eb'}`,
              background: reason === r ? '#fef2f2' : '#fafafa',
              color: reason === r ? '#dc2626' : '#555',
              transition: 'all 0.12s',
            }}>{r}</button>
          ))}
        </div>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Additional context (optional)"
          style={{ width: '100%', height: 72, border: '1px solid #ddd', borderRadius: 6, padding: '8px 12px', fontSize: 13, resize: 'none', boxSizing: 'border-box', fontFamily: 'Inter, sans-serif' }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onSkip} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#888' }}>Skip</button>
          <button onClick={() => onSave(reason, notes)} disabled={!reason} style={{ padding: '8px 18px', background: '#dc2626', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, cursor: 'pointer', opacity: !reason ? 0.5 : 1, fontWeight: 600 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

// ProspectPanel has been moved to SalesPipelinePanel.jsx

// ── Kanban Board ──────────────────────────────────────────────────────────────

function KanbanBoard({ prospects, stages, S, onMoveToStage, onOpenPanel, onAddProspect }) {
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
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                        {overdue && <span style={S.overdueTag}>Overdue</span>}
                        {p.proposal_value && <span style={S.valueBadge}>GBP {formatValue(p.proposal_value)}</span>}
                        {p.deal_value && (
                          <span style={S.valueBadge}>{p.deal_currency || 'GBP'} {Number(p.deal_value).toLocaleString()}</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div
                          title={p.last_contacted_at ? `Last contact: ${fmtLastContact(p.last_contacted_at)}` : 'Never contacted'}
                          style={{ width: 8, height: 8, borderRadius: '50%', background: engagementDotColor(p), flexShrink: 0, cursor: 'default' }}
                        />
                        <button style={S.iconBtn} onClick={e => { e.stopPropagation(); onOpenPanel(p); }}>Open</button>
                      </div>
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

// DashboardView, CampaignBuilderDrawer, DiscoveryModal have been extracted
// to SalesPipelineDashboard.jsx, SalesPipelineCampaignDrawer.jsx,
// and SalesPipelineDiscoveryModal.jsx respectively.
// They receive S, G, C as props from SalesPipelineModule at render time.

// ── Campaign Launch Modal ──────────────────────────────────────────────────────

function CampaignLaunchModal({ campaign, allProspects, onClose, onDone }) {
  const stepIndex = campaign.step_sent || 0;

  function parseArr(val) { try { return (typeof val === 'string' ? JSON.parse(val) : val) || []; } catch { return []; } }
  function parseObj(val) { try { return (typeof val === 'string' ? JSON.parse(val) : val) || {}; } catch { return {}; } }

  const steps    = parseArr(campaign.sequence_steps);
  const step     = steps[stepIndex] || {};
  const audience = filterProspectsForCampaign(allProspects, parseObj(campaign.filters));

  const [launching, setLaunching] = useState(false);
  const [progress,  setProgress]  = useState({ sent: 0, total: 0 });
  const [done,      setDone]      = useState(false);

  async function handleLaunch() {
    if (launching || done || audience.length === 0) return;
    setLaunching(true);
    setProgress({ sent: 0, total: audience.length });
    const fromEmail = localStorage.getItem('emailFromAddress') || '';
    const fromName  = localStorage.getItem('emailFromName')  || 'Luxury Wedding Directory';
    try {
      await sendSequenceStep({
        campaign,
        stepIndex,
        allProspects,
        fromEmail,
        fromName,
        onProgress: (sent) => setProgress(p => ({ ...p, sent })),
      });
      setDone(true);
      setTimeout(() => onDone(), 2200);
    } catch (e) {
      console.error('Launch failed:', e);
      setLaunching(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.48)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={e => { if (e.target === e.currentTarget && !launching) onClose(); }}>
      <div style={{ width: 460, background: '#fff', borderRadius: 12, boxShadow: '0 24px 64px rgba(0,0,0,0.22)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '20px 24px 15px', borderBottom: '1px solid #f0ece4', display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1, fontSize: 17, fontWeight: 600, fontFamily: 'Cormorant Garamond, Georgia, serif', color: '#171717' }}>{campaign.name}</div>
          {!launching && !done && <button style={{ background: 'none', border: 'none', fontSize: 20, color: '#bbb', cursor: 'pointer', padding: '0 4px', lineHeight: 1 }} onClick={onClose}>&#215;</button>}
        </div>

        <div style={{ padding: '20px 24px' }}>

          {/* Step badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, padding: '11px 14px', background: '#fffdf5', border: `1px solid ${G}30`, borderRadius: 8 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: G, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{stepIndex + 1}</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#333' }}>{step.label || `Step ${stepIndex + 1}`} of {steps.length}</div>
              <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>
                {stepIndex === 0 ? 'Initial outreach email' : `Sends ${step.delay_days || 0} day${(step.delay_days || 0) !== 1 ? 's' : ''} after Step ${stepIndex}`}
              </div>
            </div>
          </div>

          {/* Subject preview */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Subject</div>
            <div style={{ fontSize: 13, color: '#333', padding: '9px 12px', background: '#f9f9f7', borderRadius: 6, border: '1px solid #ede8de' }}>{step.subject || '(no subject set)'}</div>
          </div>

          {/* Audience pill */}
          <div style={{ marginBottom: 18, padding: '10px 14px', background: audience.length > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 8, border: `1px solid ${audience.length > 0 ? '#bbf7d0' : '#fca5a5'}` }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: audience.length > 0 ? '#166534' : '#dc2626' }}>{audience.length} prospect{audience.length !== 1 ? 's' : ''}</div>
            <div style={{ fontSize: 11, color: '#888', marginTop: 1 }}>will receive this email</div>
          </div>

          {/* Progress bar */}
          {launching && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>
                {done ? `Sent ${progress.sent} email${progress.sent !== 1 ? 's' : ''}` : `Sending ${progress.sent} of ${progress.total}...`}
              </div>
              <div style={{ height: 6, background: '#f3f0ea', borderRadius: 100 }}>
                <div style={{ height: '100%', background: done ? '#16a34a' : G, borderRadius: 100, width: `${progress.total > 0 ? (progress.sent / progress.total) * 100 : 0}%`, transition: 'width 0.3s' }} />
              </div>
            </div>
          )}

          {done ? (
            <div style={{ textAlign: 'center', padding: '8px 0 4px' }}>
              <div style={{ fontSize: 22, marginBottom: 6 }}>&#9989;</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#166534', marginBottom: 4 }}>Step {stepIndex + 1} sent</div>
              <div style={{ fontSize: 12, color: '#888' }}>{stepIndex + 1 < steps.length ? `Return to Campaigns to launch Step ${stepIndex + 2} when ready.` : 'All sequence steps complete!'}</div>
            </div>
          ) : (
            <button
              style={{ width: '100%', padding: '13px 0', borderRadius: 8, background: (launching || audience.length === 0) ? '#ccc' : G, color: '#fff', border: 'none', cursor: (launching || audience.length === 0) ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 600 }}
              onClick={handleLaunch}
              disabled={launching || audience.length === 0}
            >
              {launching ? 'Sending...' : `Send Step ${stepIndex + 1} to ${audience.length} Prospect${audience.length !== 1 ? 's' : ''}`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Campaigns View ─────────────────────────────────────────────────────────────

function CampaignsView({ campaigns, prospects, pipelines, onNewCampaign, onRefresh }) {
  const [statsCache,   setStatsCache]   = useState({});
  const [launching,    setLaunching]    = useState(null);  // campaign object
  const [deleteTarget, setDeleteTarget] = useState(null);  // campaign id

  useEffect(() => {
    campaigns.forEach(async c => {
      if (c.status !== 'sent' && c.sent_count === 0) return;
      try {
        const s = await fetchCampaignStats(c.id);
        setStatsCache(prev => ({ ...prev, [c.id]: s }));
      } catch {}
    });
  }, [campaigns.length]);

  function parseArr(val) { try { return (typeof val === 'string' ? JSON.parse(val) : val) || []; } catch { return []; } }
  function parseObj(val) { try { return (typeof val === 'string' ? JSON.parse(val) : val) || {}; } catch { return {}; } }

  const STATUS_COLOR  = { draft: '#6b7280', sending: '#d97706', sent: '#16a34a', paused: '#ea580c' };
  const STATUS_LABEL  = { draft: 'Draft',   sending: 'Sending', sent: 'Complete', paused: 'Paused' };

  async function handleDeleteConfirm() {
    if (!deleteTarget) return;
    try { await deleteCampaign(deleteTarget); onRefresh(); } catch (e) { console.error(e); }
    setDeleteTarget(null);
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '0 0 32px' }}>

      {/* Header */}
      <div style={{ padding: '16px 24px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #f0ece4' }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#333', fontFamily: 'Cormorant Garamond, Georgia, serif' }}>Outreach Campaigns</div>
        <div style={{ fontSize: 12, color: '#aaa', marginTop: 1 }}>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</div>
        <div style={{ flex: 1 }} />
        <button style={S.goldBtn} onClick={onNewCampaign}>+ New Campaign</button>
      </div>

      {campaigns.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '72px 0', color: '#aaa' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>\u2709</div>
          <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 6, color: '#666' }}>No campaigns yet</div>
          <div style={{ fontSize: 12, maxWidth: 320, margin: '0 auto', lineHeight: 1.7 }}>Create your first campaign to send personalised outreach to a filtered group of prospects.</div>
        </div>
      ) : (
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {campaigns.map(campaign => {
            const steps    = parseArr(campaign.sequence_steps);
            const settings = parseObj(campaign.settings);
            const filters  = parseObj(campaign.filters);
            const stats    = statsCache[campaign.id];
            const stepSent = campaign.step_sent || 0;
            const allDone  = steps.length > 0 && stepSent >= steps.length;
            const canLaunch = (campaign.status === 'draft' || campaign.status === 'paused') && !allDone;
            const audience  = filterProspectsForCampaign(prospects, filters);
            const pipe      = pipelines.find(p => p.id === filters.pipeline_id);
            const statusClr = STATUS_COLOR[campaign.status] || '#aaa';

            return (
              <div key={campaign.id} style={{ background: '#fff', border: '1px solid #ede8de', borderRadius: 10, overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>

                {/* Top row: name + status + delete */}
                <div style={{ padding: '14px 18px 12px', borderBottom: '1px solid #f3f0ea', display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: '#171717', marginBottom: 3 }}>{campaign.name}</div>
                    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center' }}>
                      {pipe && <span style={{ fontSize: 11, color: '#888' }}>{pipe.name}</span>}
                      {pipe && (filters.country || filters.keywords?.length) && <span style={{ color: '#ddd', fontSize: 11 }}>&#183;</span>}
                      {filters.country && <span style={{ fontSize: 11, color: '#888' }}>{filters.country}</span>}
                      {filters.country && filters.keywords?.length > 0 && <span style={{ color: '#ddd', fontSize: 11 }}>&#183;</span>}
                      {filters.keywords?.length > 0 && <span style={{ fontSize: 11, color: '#888' }}>{filters.keywords.slice(0, 3).join(', ')}{filters.keywords.length > 3 ? '+' + (filters.keywords.length - 3) + ' more' : ''}</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', padding: '3px 8px', borderRadius: 4, background: statusClr + '18', color: statusClr }}>
                      {STATUS_LABEL[campaign.status] || campaign.status}
                    </span>
                    <button style={{ background: 'none', border: 'none', color: '#d1d5db', cursor: 'pointer', fontSize: 17, padding: '0 2px', lineHeight: 1 }} onClick={() => setDeleteTarget(campaign.id)} title="Delete campaign">&#215;</button>
                  </div>
                </div>

                {/* Sequence timeline */}
                {steps.length > 0 && (
                  <div style={{ padding: '12px 18px 10px', borderBottom: '1px solid #f3f0ea', overflowX: 'auto' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'flex-start', gap: 0 }}>
                      {steps.map((st, idx) => {
                        const isSent    = idx < stepSent;
                        const isCurrent = idx === stepSent && !allDone;
                        const circleColor  = (isSent || isCurrent) ? G : '#d1d5db';
                        const circleBg     = isSent ? G : 'transparent';
                        const circleTextCl = isSent ? '#fff' : isCurrent ? G : '#9ca3af';
                        const labelColor   = isSent ? '#16a34a' : isCurrent ? G : '#9ca3af';
                        return (
                          <React.Fragment key={idx}>
                            {idx > 0 && (
                              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 2px', paddingTop: 4 }}>
                                <div style={{ height: 2, width: 36, background: idx <= stepSent ? G : '#e5e7eb', borderRadius: 1, marginTop: 11 }} />
                                <div style={{ fontSize: 9, color: '#aaa', marginTop: 3, textAlign: 'center', letterSpacing: '0.02em' }}>{st.delay_days}d</div>
                              </div>
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                              <div style={{ width: 28, height: 28, borderRadius: '50%', border: `2px solid ${circleColor}`, background: circleBg, color: circleTextCl, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>
                                {isSent ? '\u2713' : idx + 1}
                              </div>
                              <div style={{ fontSize: 10, color: labelColor, fontWeight: isCurrent ? 600 : 400, maxWidth: 60, textAlign: 'center', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {st.label || `Step ${idx + 1}`}
                              </div>
                            </div>
                          </React.Fragment>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Footer: settings chips + stats + action */}
                <div style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', alignItems: 'center', flex: 1 }}>
                    {settings.ai_personalisation && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: G + '18', color: G, border: `1px solid ${G}30` }}>AI On</span>
                    )}
                    {settings.stop_on_reply !== false && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#f3f0ea', color: '#888' }}>Stop Reply</span>
                    )}
                    {settings.max_per_send && (
                      <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 7px', borderRadius: 100, background: '#f3f0ea', color: '#888' }}>Max {settings.max_per_send}</span>
                    )}
                    {stats ? (
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>
                        Opens: {stats.opens} ({stats.openRate}%)&nbsp;&nbsp;Replies: {stats.replies} ({stats.replyRate}%)
                      </span>
                    ) : (campaign.sent_count > 0 && (
                      <span style={{ fontSize: 11, color: '#888', marginLeft: 4 }}>{campaign.sent_count} sent</span>
                    ))}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                    <span style={{ fontSize: 11, color: '#aaa' }}>{audience.length} prospect{audience.length !== 1 ? 's' : ''}</span>
                    {canLaunch && (
                      <button
                        style={{ padding: '6px 14px', borderRadius: 6, background: G, color: '#fff', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}
                        onClick={() => setLaunching(campaign)}
                      >
                        Launch Step {stepSent + 1} \u2192
                      </button>
                    )}
                    {campaign.status === 'sending' && (
                      <span style={{ fontSize: 11, color: '#d97706', fontWeight: 600 }}>Sending...</span>
                    )}
                    {allDone && (
                      <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 600 }}>\u2713 All {steps.length} step{steps.length !== 1 ? 's' : ''} sent</span>
                    )}
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Launch Modal */}
      {launching && (
        <CampaignLaunchModal
          campaign={launching}
          allProspects={prospects}
          onClose={() => setLaunching(null)}
          onDone={() => { setLaunching(null); onRefresh(); }}
        />
      )}

      {/* Delete confirmation */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.38)', zIndex: 3000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 10, padding: '24px 28px', width: 340, boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 8, color: '#333' }}>Delete campaign?</div>
            <div style={{ fontSize: 13, color: '#888', marginBottom: 20, lineHeight: 1.6 }}>This will permanently remove the campaign record. Outreach emails already sent will not be affected.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button style={{ flex: 1, padding: '9px 0', borderRadius: 6, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13 }} onClick={handleDeleteConfirm}>Delete</button>
              <button style={{ flex: 1, padding: '9px 0', borderRadius: 6, background: '#f3f0ea', color: '#555', border: 'none', cursor: 'pointer', fontSize: 13 }} onClick={() => setDeleteTarget(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function SalesPipelineModule() {
  const C = useContext(ThemeCtx);
  // Update module-level G + S so all standalone sub-components see themed values
  G = C?.gold || LIGHT_G;
  S = makeS(C || LIGHT_C, G);

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
  const [showUrlModal,  setShowUrlModal]  = useState(false);
  const [defaultStage,  setDefaultStage]  = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [sortKey,       setSortKey]       = useState('company_name');
  const [sortDir,       setSortDir]       = useState('asc');
  const [fuRunning,         setFuRunning]         = useState(false);
  const [scoresRefreshing,  setScoresRefreshing]  = useState(false);
  const [toast,             setToast]             = useState(null);
  const [lostReasonQueue,   setLostReasonQueue]   = useState(null); // { prospect, stage }
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
      if (stage.is_lost) {
        // Show lost reason modal before marking status lost
        setLostReasonQueue({ prospect, stage });
        // Status will be applied after user completes/skips modal
      }
    } catch (e) { console.error('Move failed:', e); }
  }

  async function applyLostReason(reason, notes) {
    if (!lostReasonQueue) return;
    const { prospect } = lostReasonQueue;
    setLostReasonQueue(null);
    const updates = {
      status:    'lost',
      lost_at:   new Date().toISOString(),
      lost_reason: reason || null,
      lost_notes:  notes  || null,
    };
    await updateProspect(prospect.id, updates).catch(e => console.error('Lost reason save failed:', e));
    setProspects(prev => prev.map(p => p.id === prospect.id ? { ...p, ...updates } : p));
    if (openPanel?.id === prospect.id) setOpenPanel(prev => ({ ...prev, ...updates }));
    notify(`Marked as lost${reason ? ` - ${reason}` : ''}.`);
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
        <button style={{ ...S.outlineBtn, fontSize: 12, padding: '7px 14px', borderColor: 'rgba(201,168,76,0.5)', color: '#c9a84c' }} onClick={() => setShowUrlModal(true)}>+ Add by URL</button>
        <button style={S.goldBtn} onClick={() => handleAddProspect()}>+ Add Prospect</button>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {view === 'kanban' && (
            <KanbanBoard
              prospects={filtered}
              stages={currentStages}
              S={S}
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
              S={S} G={G} C={C}
            />
          )}
          {view === 'campaigns' && (
            <CampaignsView
              campaigns={campaigns}
              prospects={prospects}
              pipelines={pipelines}
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
            S={S} G={G} C={C}
          />
        )}
      </div>

      {lostReasonQueue && (
        <LostReasonModal
          prospect={lostReasonQueue.prospect}
          onSave={applyLostReason}
          onSkip={() => applyLostReason(null, null)}
        />
      )}

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
            notify('Campaign saved as draft. Launch it from the Campaigns tab when ready.');
          }}
          onClose={() => setShowCampaignBuilder(false)}
          S={S} G={G} C={C}
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
          S={S} G={G} C={C}
        />
      )}

      {showUrlModal && (
        <UrlToLeadModal
          C={C}
          onClose={() => setShowUrlModal(false)}
          onSaved={(prospect) => {
            setProspects(list => [prospect, ...list]);
            setShowUrlModal(false);
            notify(`${prospect.company_name} added from URL audit.`);
          }}
        />
      )}
    </div>
  );
}
