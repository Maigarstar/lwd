/**
 * SalesPipelinePanel.jsx
 * Prospect detail side panel, extracted from SalesPipelineModule.jsx.
 *
 * IMPORTANT: S and G are passed as props so this component picks up the
 * themed values that SalesPipelineModule sets before rendering.
 */

import React, { useState, useEffect } from 'react';
import {
  fetchOutreachHistory,
  logOutreachEmail,
  markReplied,
  updateProspect,
} from '../../services/salesPipelineService';
import {
  fetchStageTemplate,
  mergeTags,
} from '../../services/pipelineBuilderService';
import {
  calculateLeadScore,
  scoreColor,
  scoreLabel,
} from '../../services/leadScoringService';
import {
  generateFollowUpEmail,
  generateProposalEmail,
  generateNextStepAdvice,
  generateColdEmail,
} from '../../services/salesPipelineAiService';
import { generateNextAction } from '../../services/dealIntelligenceService';
import { sendEmail } from '../../services/emailSendService';
import {
  calculateDealHealth,
  calculateCloseProbability,
  dealHealthColor,
  dealHealthBgColor,
  generateNextAction as dealNextAction,
} from '../../services/dealIntelligenceService';
import {
  fetchOnboardingTask,
  createOnboardingTask,
  toggleOnboardingItem,
  getOnboardingProgress,
} from '../../services/onboardingService';
import {
  computeEngagement,
  ENGAGEMENT_STATUS_CONFIG,
  fmtLastContact,
  fmtDaysInPipeline,
} from '../../services/engagementService';
import {
  runAudit,
  fetchLatestAudit,
  generateAuditEmail,
  getTopIssues,
  scoreLabel as auditScoreLabel,
  scoreColor as auditScoreColor,
} from '../../services/websiteAuditService';
import { getLinkedLeadForProspect } from '../../services/leadProspectBridgeService';
import AuditScoreRing from '../../components/seo/AuditScoreRing';

// ── Helpers (duplicated from module to keep this file self-contained) ─────────

const LIGHT_G = '#8f7420';

function fmtDate(iso) {
  if (!iso) return '--';
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}
function isOverdue(iso) { return iso && new Date(iso) < new Date(); }
function formatValue(v) { if (!v) return null; return `${Number(v).toLocaleString()}`; }

// ── Small display helpers ─────────────────────────────────────────────────────

function ScorePill({ score, S }) {
  if (score == null) return null;
  const color = scoreColor(score);
  return <span style={S.scorePill(color)} title={`Lead score: ${score}/100 (${scoreLabel(score)})`}>{score}</span>;
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

// ── Outreach Modal (inline, used only by ProspectPanel) ───────────────────────

function OutreachModal({ prospect, templates, prefilled, onSent, onClose, S, G }) {
  const [subject, setSubject] = useState(prefilled?.subject || '');
  const [body, setBody]       = useState(prefilled?.body || '');
  const [sending, setSending] = useState(false);
  const [tplId, setTplId]     = useState('');

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
      const tpl = templates.find(t => t.id === tplId);

      // Log first so we get the row id for the pixel URL
      const emailRow = await logOutreachEmail({ prospectId: prospect.id, emailType: tpl?.email_type || 'custom', subject, body });

      if (prospect.email && fromEmail) {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
        const pixelHtml = `<img src="${SUPABASE_URL}/functions/v1/track-email-open?id=${emailRow.id}" width="1" height="1" style="display:none;border:0" alt="" />`;
        const htmlBody = `<div style="font-family:Inter,sans-serif;font-size:15px;line-height:1.7;color:#222">${body.replace(/\n/g, '<br/>')}</div>${pixelHtml}`;
        await sendEmail({
          recipients: [{ email: prospect.email, name: prospect.contact_name || prospect.company_name }],
          html: htmlBody,
          subject,
          fromEmail,
          fromName,
          type: 'campaign',
        });
      }
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

// ── Note Modal (inline, used only by ProspectPanel) ───────────────────────────

function NoteModal({ prospect, onSaved, onClose }) {
  const [text, setText]     = useState('');
  const [saving, setSaving] = useState(false);

  async function save() {
    if (!text.trim()) return;
    setSaving(true);
    try {
      await logOutreachEmail({
        prospectId: prospect.id,
        emailType:  'custom',
        subject:    'Note',
        body:       text.trim(),
        direction:  'internal',
      });
      onSaved();
    } catch (e) {
      console.error('Note save failed:', e);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 3500, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#fff', borderRadius: 10, padding: 28, width: 460, maxWidth: '94vw', boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#171717', marginBottom: 4 }}>Add Note</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 16 }}>{prospect.company_name}</div>
        <textarea
          autoFocus
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="e.g. Called today, left voicemail. Agreed to follow up next Thursday."
          style={{ width: '100%', minHeight: 110, border: '1px solid #ddd', borderRadius: 6, padding: '10px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif', resize: 'vertical', boxSizing: 'border-box', lineHeight: 1.6 }}
        />
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 14 }}>
          <button onClick={onClose} style={{ padding: '8px 16px', border: '1px solid #ddd', borderRadius: 5, fontSize: 13, cursor: 'pointer', background: 'transparent', color: '#555' }}>Cancel</button>
          <button onClick={save} disabled={!text.trim() || saving} style={{ padding: '8px 18px', background: '#8f7420', color: '#fff', border: 'none', borderRadius: 5, fontSize: 13, cursor: 'pointer', opacity: !text.trim() || saving ? 0.55 : 1, fontWeight: 600 }}>
            {saving ? 'Saving...' : 'Save Note'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── ProspectPanel ─────────────────────────────────────────────────────────────

export default function ProspectPanel({ prospect, stages, templates, onEdit, onStageChange, onClose, onProspectUpdated, S, G, C }) {
  const [history,      setHistory]      = useState([]);
  const [histLoading,  setHistLoading]  = useState(true);
  const [showEmail,    setShowEmail]    = useState(false);
  const [showNote,     setShowNote]     = useState(false);
  const [aiLoading,    setAiLoading]    = useState(false);
  const [aiResult,     setAiResult]     = useState(null);
  const [prefilledEmail, setPrefilledEmail] = useState(null);
  const [localScore,   setLocalScore]   = useState(prospect.lead_score ?? null);
  const [dealHealth,   setDealHealth]   = useState(null);
  const [closeProb,    setCloseProb]    = useState(null);
  const [onboardingTask, setOnboardingTask] = useState(null);
  const [onboardingLoading, setOnboardingLoading] = useState(false);
  const [contractStatus, setContractStatus] = useState(prospect.contract_status || 'none');
  const [engagement, setEngagement] = useState(null);
  const [linkedLead, setLinkedLead] = useState(undefined); // undefined=loading, null=none
  const [audit,          setAudit]          = useState(null);
  const [auditLoading,   setAuditLoading]   = useState(false);
  const [auditEmailLoading, setAuditEmailLoading] = useState(false);

  const resolvedG = G || LIGHT_G;

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
        const currentStage = stages.find(s => s.id === prospect.stage_id) || null;
        setDealHealth(calculateDealHealth({ ...prospect, lead_score: fresh }, h, currentStage));
        setCloseProb(calculateCloseProbability({ ...prospect, lead_score: fresh }, h, currentStage));
        setEngagement(computeEngagement(prospect, h));
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

  useEffect(() => {
    setLinkedLead(undefined);
    getLinkedLeadForProspect(prospect.id).then(l => setLinkedLead(l || null)).catch(() => setLinkedLead(null));
  }, [prospect.id]);

  // Load previous audit when panel opens (if prospect has a website)
  useEffect(() => {
    if (!prospect.website) return;
    fetchLatestAudit({ prospectId: prospect.id })
      .then(row => { if (row) setAudit(row); })
      .catch(() => {});
  }, [prospect.id]);

  async function handleAuditSite() {
    if (!prospect.website) return;
    setAuditLoading(true);
    try {
      const row = await runAudit(prospect.website, { prospectId: prospect.id, logActivity: true });
      setAudit(row);
      // Refresh activity feed so the new audit entry appears
      fetchOutreachHistory(prospect.id).then(setHistory);
    } catch (e) {
      console.error('Audit failed:', e);
    } finally {
      setAuditLoading(false);
    }
  }

  async function handleGenerateAuditEmail() {
    if (!audit) return;
    setAuditEmailLoading(true);
    try {
      const result = await generateAuditEmail(audit, prospect);
      setPrefilledEmail(result);
      setShowEmail(true);
    } catch (e) {
      console.error('Audit email generation failed:', e);
    } finally {
      setAuditEmailLoading(false);
    }
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

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: audit ? 10 : 14, flexWrap: 'wrap' }}>
          <button style={{ ...S.goldBtn, fontSize: 12, padding: '6px 14px' }} onClick={() => { setPrefilledEmail(null); setShowEmail(true); }}>Send Email</button>
          <button style={{ fontSize: 12, padding: '6px 14px', border: '1px solid #ddd', borderRadius: 5, background: 'transparent', color: '#555', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }} onClick={() => setShowNote(true)}>+ Note</button>
          {prospect.website && (
            <button
              style={{ fontSize: 12, padding: '6px 14px', border: `1px solid ${resolvedG}`, borderRadius: 5, background: 'transparent', color: resolvedG, cursor: auditLoading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: auditLoading ? 0.6 : 1 }}
              onClick={handleAuditSite}
              disabled={auditLoading}
            >
              {auditLoading ? 'Auditing...' : '\u2726 Audit Site'}
            </button>
          )}
        </div>

        {/* Audit result panel */}
        {audit && !auditLoading && (() => {
          const issues = getTopIssues(audit.findings, 3);
          const auditDate = audit.created_at ? new Date(audit.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' }) : '';
          return (
            <div style={{ marginBottom: 14, padding: '14px 14px', background: 'rgba(143,116,32,0.04)', border: '1px solid rgba(143,116,32,0.18)', borderRadius: 7 }}>
              {/* Score + label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10 }}>
                <AuditScoreRing score={audit.score} size={72} strokeWidth={7} />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Website Authority</div>
                  <div style={{ fontSize: 11, color: '#555', marginBottom: 6 }}>{audit.url}</div>
                  <div style={{ fontSize: 10, color: '#aaa' }}>Audited {auditDate}</div>
                </div>
              </div>
              {/* Top issues */}
              {issues.length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  {issues.map((issue) => (
                    <div key={issue.signal} style={{ display: 'flex', alignItems: 'flex-start', gap: 6, padding: '4px 0', borderBottom: '1px solid rgba(143,116,32,0.08)' }}>
                      <span style={{ fontSize: 12, color: issue.severity === 'critical' ? '#ef4444' : '#f97316', flexShrink: 0, marginTop: 1 }}>
                        {issue.severity === 'critical' ? '\u26A0' : '\u25B2'}
                      </span>
                      <span style={{ fontSize: 12, color: '#444', lineHeight: 1.4 }}>{issue.label}</span>
                    </div>
                  ))}
                </div>
              )}
              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button
                  style={{ fontSize: 11, padding: '5px 12px', borderRadius: 4, border: `1px solid ${resolvedG}`, background: resolvedG, color: '#fff', cursor: auditEmailLoading ? 'not-allowed' : 'pointer', fontFamily: 'Inter, sans-serif', opacity: auditEmailLoading ? 0.6 : 1 }}
                  onClick={handleGenerateAuditEmail}
                  disabled={auditEmailLoading}
                >
                  {auditEmailLoading ? 'Generating...' : '\u2726 Generate Audit Email'}
                </button>
                <button
                  style={{ fontSize: 11, color: resolvedG, background: 'transparent', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif', textDecoration: 'underline' }}
                  onClick={handleAuditSite}
                  disabled={auditLoading}
                >
                  Re-audit
                </button>
              </div>
            </div>
          );
        })()}

        {/* Lost reason banner */}
        {prospect.status === 'lost' && prospect.lost_reason && (
          <div style={{ marginBottom: 14, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 6 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>Lost - {prospect.lost_reason}</div>
            {prospect.lost_notes && <div style={{ fontSize: 12, color: '#555', lineHeight: 1.5 }}>{prospect.lost_notes}</div>}
            {prospect.lost_at && <div style={{ fontSize: 10, color: '#aaa', marginTop: 4 }}>{fmtDate(prospect.lost_at)}</div>}
          </div>
        )}

        {/* Details */}
        {prospect.contact_name && <><div style={S.fieldLabel}>Contact</div><div style={S.fieldValue}>{prospect.contact_name}</div></>}
        {prospect.email && <><div style={S.fieldLabel}>Email</div><div style={S.fieldValue}><a href={`mailto:${prospect.email}`} style={{ color: resolvedG }}>{prospect.email}</a></div></>}
        {prospect.phone && <><div style={S.fieldLabel}>Phone</div><div style={S.fieldValue}>{prospect.phone}</div></>}
        {prospect.website && <><div style={S.fieldLabel}>Website</div><div style={S.fieldValue}><a href={prospect.website} target="_blank" rel="noreferrer" style={{ color: resolvedG }}>{prospect.website}</a></div></>}
        <div style={S.fieldLabel}>Source / Package</div><div style={S.fieldValue}>{prospect.source || '--'} / {prospect.package || '--'}</div>
        {prospect.proposal_value && <><div style={S.fieldLabel}>Proposal Value</div><div style={{ ...S.fieldValue, color: '#22c55e', fontWeight: 600 }}>GBP {formatValue(prospect.proposal_value)}</div></>}
        {prospect.next_follow_up_at && <><div style={S.fieldLabel}>Next Follow-Up</div><div style={{ ...S.fieldValue, color: isOverdue(prospect.next_follow_up_at) ? '#dc2626' : '#333' }}>{fmtDate(prospect.next_follow_up_at)}{isOverdue(prospect.next_follow_up_at) ? ' (Overdue)' : ''}</div></>}
        {prospect.notes && <><div style={S.fieldLabel}>Notes</div><div style={{ ...S.fieldValue, whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{prospect.notes}</div></>}
        <div style={S.fieldLabel}>Added</div><div style={S.fieldValue}>{fmtDate(prospect.created_at)}</div>

        {/* B2C Lead Link Banner */}
        {linkedLead && (
          <div style={{ margin: '14px 0', padding: '11px 14px', background: 'rgba(201,168,76,0.06)', border: `1px solid rgba(201,168,76,0.3)`, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: resolvedG, marginBottom: 3 }}>Linked B2C Lead</div>
              <div style={{ fontSize: 12, color: '#222', fontWeight: 600 }}>{linkedLead.first_name} {linkedLead.last_name}</div>
              {linkedLead.email && <div style={{ fontSize: 11, color: '#666', marginTop: 1 }}>{linkedLead.email}</div>}
              {linkedLead.status && <div style={{ fontSize: 10, color: '#888', marginTop: 1, textTransform: 'capitalize' }}>Status: {linkedLead.status}</div>}
            </div>
            <span style={{ fontSize: 10, color: resolvedG, fontWeight: 600, whiteSpace: 'nowrap', opacity: 0.7 }}>
              {linkedLead.match_method === 'manual' ? '⚭ Manual' : '⚭ Email match'}
            </span>
          </div>
        )}

        {/* Engagement Intelligence */}
        {engagement && (() => {
          const cfg = ENGAGEMENT_STATUS_CONFIG[engagement.engagementStatus] || ENGAGEMENT_STATUS_CONFIG['Active'];
          return (
            <div style={{ ...S.aiSection }}>
              <div style={{ ...S.fieldLabel, marginBottom: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>Engagement</span>
                <span style={{ padding: '2px 10px', borderRadius: 100, background: cfg.bg, color: cfg.color, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'none' }}>
                  {engagement.engagementStatus}
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 2 }}>
                {[
                  { label: 'Sent',    value: engagement.emailsSent },
                  { label: 'Opens',   value: engagement.opens },
                  { label: 'Replies', value: engagement.replies },
                ].map(({ label, value }) => (
                  <div key={label} style={{ background: 'rgba(143,116,32,0.05)', border: `1px solid rgba(143,116,32,0.12)`, borderRadius: 6, padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: LIGHT_G, fontFamily: 'Cormorant Garamond, Georgia, serif' }}>{value}</div>
                    <div style={{ fontSize: 10, color: S.fieldLabel.color, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ ...S.fieldLabel, marginBottom: 2 }}>Last Contact</div>
                  <div style={{ fontSize: 12, color: S.fieldValue.color, fontWeight: 500 }}>{fmtLastContact(engagement.lastContacted)}</div>
                </div>
                <div style={{ flex: 1, minWidth: 100 }}>
                  <div style={{ ...S.fieldLabel, marginBottom: 2 }}>In Pipeline</div>
                  <div style={{ fontSize: 12, color: S.fieldValue.color, fontWeight: 500 }}>{fmtDaysInPipeline(engagement.daysInPipeline)}</div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* AI Assistant */}
        <div style={S.aiSection}>
          <div style={{ ...S.fieldLabel, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ color: resolvedG }}>{'\u2726'}</span> AI Assistant
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}>
            <button style={S.aiBtn} onClick={() => handleAiAction('cold')} disabled={aiLoading}>
              {aiLoading ? '...' : '\u2726'} Cold Email
            </button>
            <button style={S.aiBtn} onClick={() => handleAiAction('follow_up')} disabled={aiLoading}>
              {aiLoading ? '...' : '\u2726'} Follow-Up
            </button>
            <button style={S.aiBtn} onClick={() => handleAiAction('proposal')} disabled={aiLoading}>
              {aiLoading ? '...' : '\u2726'} Proposal
            </button>
            <button style={{ ...S.aiBtn, background: 'rgba(59,130,246,0.08)', color: '#3b82f6', border: '1px solid rgba(59,130,246,0.3)' }} onClick={() => handleAiAction('next_step')} disabled={aiLoading}>
              {aiLoading ? '...' : '\u2726'} Next Step
            </button>
            <button style={{ ...S.aiBtn, background: 'rgba(249,115,22,0.08)', color: '#f97316', border: '1px solid rgba(249,115,22,0.3)', width: '100%', justifyContent: 'center' }} onClick={() => handleAiAction('next_action')} disabled={aiLoading}>
              {aiLoading ? '...' : '\u25B6'} AI Next Action
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

        {/* Activity */}
        <div style={{ borderTop: '1px solid #f3f0ea', paddingTop: 14, marginTop: 14 }}>
          <div style={{ ...S.fieldLabel, marginBottom: 8 }}>Activity ({history.length})</div>
          {histLoading ? <div style={{ fontSize: 12, color: '#aaa' }}>Loading...</div>
            : history.length === 0 ? <div style={{ fontSize: 12, color: '#aaa' }}>No activity yet.</div>
            : history.map((h, i) => {
              const isNote  = h.direction === 'internal' && h.email_type !== 'audit';
              const isAudit = h.email_type === 'audit';
              return (
                <div key={h.id || i} style={{ ...S.histItem, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, background: isNote ? '#fffbf0' : isAudit ? 'rgba(143,116,32,0.04)' : undefined, borderLeft: isNote ? '2px solid #f59e0b' : isAudit ? `2px solid ${resolvedG}` : undefined, paddingLeft: (isNote || isAudit) ? 8 : undefined }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      {isNote  && <span style={{ fontSize: 10 }}>&#9998;</span>}
                      {isAudit && <span style={{ fontSize: 10, color: resolvedG }}>&#9670;</span>}
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: (isNote || isAudit) ? '#555' : undefined, fontStyle: isNote ? 'italic' : undefined }}>
                        {(isNote || isAudit) ? h.body || h.subject : h.subject}
                      </div>
                    </div>
                    <div style={S.histTime}>
                      {fmtDate(h.sent_at)}
                      {!isNote && !isAudit && (
                        <>
                          {' - '}
                          <span style={{ color: h.status === 'replied' ? '#22c55e' : h.status === 'bounced' ? '#dc2626' : '#888', fontWeight: h.status === 'replied' ? 600 : 400 }}>
                            {h.status}
                          </span>
                        </>
                      )}
                      {isNote  && <span style={{ marginLeft: 4, color: '#f59e0b', fontWeight: 600 }}>note</span>}
                      {isAudit && <span style={{ marginLeft: 4, color: resolvedG, fontWeight: 600 }}>audit</span>}
                    </div>
                  </div>
                  {!isNote && !isAudit && h.status === 'sent' && h.id && (
                    <button style={S.replyBtn} onClick={() => handleMarkReplied(h.id, i)} title="Mark this email as replied">
                      Replied
                    </button>
                  )}
                </div>
              );
            })}
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
                    <div style={{ height: '100%', background: onboardingTask.status === 'complete' ? '#22c55e' : resolvedG, borderRadius: 100, width: `${prog.percentage}%`, transition: 'width 0.4s' }} />
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
          S={S}
          G={resolvedG}
        />
      )}

      {showNote && (
        <NoteModal
          prospect={prospect}
          onSaved={() => {
            setShowNote(false);
            fetchOutreachHistory(prospect.id).then(setHistory);
          }}
          onClose={() => setShowNote(false)}
        />
      )}
    </div>
  );
}
