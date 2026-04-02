// ─── src/components/seo/VisibilityDetailPanel.jsx ────────────────────────────
// Slide-out detail panel for a domain group in the Visibility Intelligence tab.
// Shows full audit breakdown, enquiry experience, AI summary, AI presence,
// audit history, Tier 2 locked placeholders, and action buttons.

import { useState, useEffect, useRef } from 'react';
import AuditScoreRing from './AuditScoreRing';
import {
  scoreLabel, scoreColor,
  getIssuesWithImpact, getPassedSignals, getIssueSeverityCounts,
  scoreEnquiryExperience, computeOpportunityScore, computeTrend,
  generateIntelligenceSummary, checkAiVisibility, generateAuditEmail,
} from '../../services/websiteAuditService';
import { fetchSearchConsoleData, fetchAnalyticsData } from '../../services/googleConnectionService';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';
const G  = '#c9a84c';

// ── Small helpers ─────────────────────────────────────────────────────────────

function relativeTime(iso) {
  if (!iso) return '--';
  const diff  = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 2)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7)  return `${days}d ago`;
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: '2-digit' });
}

function SeverityDot({ sev }) {
  const col = sev === 'critical' ? '#ef4444' : sev === 'important' ? '#f97316' : '#6b7280';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: col, flexShrink: 0, marginTop: 2 }} />;
}

function SectionTitle({ children, C }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: C.grey2, marginBottom: 12 }}>
      {children}
    </div>
  );
}

function IssueRow({ issue, C }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      onClick={() => setOpen(o => !o)}
      style={{ cursor: 'pointer', padding: '10px 0', borderBottom: `1px solid ${C.border}` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <SeverityDot sev={issue.severity} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: NU, fontSize: 12, color: '#f5f2ec' }}>{issue.label}</div>
          {open && issue.impact && (
            <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', marginTop: 6, lineHeight: 1.6 }}>
              {issue.impact}
            </div>
          )}
        </div>
        <span style={{ color: '#6b7280', fontSize: 11, flexShrink: 0 }}>{open ? '▲' : '▼'}</span>
      </div>
    </div>
  );
}

function PassedRow({ item, C }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
      <span style={{ color: '#22c55e', fontSize: 12, flexShrink: 0 }}>✓</span>
      <span style={{ fontFamily: NU, fontSize: 11, color: '#6b7280' }}>{item.label}</span>
    </div>
  );
}

function LockedSection({ title, integration, C }) {
  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
      <div>
        <div style={{ fontFamily: NU, fontSize: 12, color: '#f5f2ec', marginBottom: 2 }}>{title}</div>
        <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280' }}>Requires {integration}</div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 14 }}>🔒</span>
        <a
          href="#connections"
          onClick={e => { e.preventDefault(); window.dispatchEvent(new CustomEvent('lwd-nav', { detail: { tab: 'seo', seoTab: 'connections' } })); }}
          style={{ fontFamily: NU, fontSize: 11, color: G, textDecoration: 'none', whiteSpace: 'nowrap' }}
        >
          Connect
        </a>
      </div>
    </div>
  );
}

function OpportunityBadge({ value }) {
  const [hover, setHover] = useState(false);
  const cfg = {
    High:   { bg: 'rgba(239,68,68,0.12)',  color: '#ef4444' },
    Medium: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
    Low:    { bg: 'rgba(34,197,94,0.12)',  color: '#22c55e' },
  };
  const s = cfg[value] || cfg.Low;
  return (
    <span
      style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <span style={{ padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', background: s.bg, color: s.color, textTransform: 'uppercase', fontFamily: NU, cursor: 'help' }}>
        {value}
      </span>
      {hover && (
        <span style={{
          position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)',
          background: '#1a1916', border: '1px solid rgba(201,168,76,0.2)', borderRadius: 5,
          padding: '7px 10px', fontFamily: NU, fontSize: 10, color: '#d1d5db', lineHeight: 1.55,
          width: 210, textTransform: 'none', letterSpacing: 0, fontWeight: 400,
          zIndex: 10, boxShadow: '0 4px 16px rgba(0,0,0,0.5)', pointerEvents: 'none',
        }}>
          Commercial opportunity indicator: how much upside exists if this site's key issues are fixed. High means significant untapped potential.
        </span>
      )}
    </span>
  );
}

// ── Outreach Preview Modal ────────────────────────────────────────────────────

function OutreachPreviewModal({ preview, onClose }) {
  const [copied, setCopied] = useState(false);

  function copyAll() {
    const text = `Subject: ${preview.subject}\n\n${preview.body}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    });
  }

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, zIndex: 500, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 501, width: 'min(560px, 94vw)', maxHeight: '82vh',
        background: '#1a1916', border: '1px solid rgba(201,168,76,0.22)',
        borderRadius: 8, display: 'flex', flexDirection: 'column', overflow: 'hidden',
        boxShadow: '0 24px 72px rgba(0,0,0,0.7)',
        animation: 'opModalIn 0.2s cubic-bezier(0.22,1,0.36,1) forwards',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: G }}>
            Outreach Preview
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', padding: '2px 6px', lineHeight: 1 }}
            aria-label="Close preview"
          >
            ×
          </button>
        </div>

        {/* Subject */}
        <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', flexShrink: 0 }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 6 }}>Subject</div>
          <div style={{ fontFamily: NU, fontSize: 13, color: '#f5f2ec', fontWeight: 500, lineHeight: 1.4 }}>{preview.subject}</div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '14px 20px' }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#6b7280', marginBottom: 8 }}>Message</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: '#d1d5db', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{preview.body}</div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8, flexShrink: 0 }}>
          <button
            onClick={copyAll}
            style={{
              flex: 1, padding: '9px 0',
              background: copied ? 'rgba(34,197,94,0.1)' : G,
              border: copied ? '1px solid rgba(34,197,94,0.4)' : 'none',
              color: copied ? '#22c55e' : '#fff',
              borderRadius: 5, fontFamily: NU, fontSize: 11, fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            {copied ? 'Copied to clipboard' : 'Copy Email'}
          </button>
          <button
            onClick={onClose}
            style={{ padding: '9px 18px', background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', borderRadius: 5, fontFamily: NU, fontSize: 11, cursor: 'pointer' }}
          >
            Close
          </button>
        </div>
      </div>
    </>
  );
}

// ── Main Panel ────────────────────────────────────────────────────────────────

export default function VisibilityDetailPanel({ domainGroup, connections, onClose, onReaudit, C }) {
  const a = domainGroup.latest;

  const issues      = getIssuesWithImpact(a.findings);
  const passed      = getPassedSignals(a.findings);
  const severity    = getIssueSeverityCounts(a.findings);
  const enquiry     = scoreEnquiryExperience(a.findings);
  const opportunity = computeOpportunityScore(a.score, a.findings);
  const trend       = computeTrend(a.score, domainGroup.history);
  const sc          = scoreColor(a.score);

  const critical  = issues.filter(i => i.severity === 'critical');
  const important = issues.filter(i => i.severity === 'important');
  const minor     = issues.filter(i => i.severity === 'minor');

  const [summary, setSummary]               = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryError, setSummaryError]     = useState(null);

  const [aiPresence, setAiPresence]               = useState({
    visible:            a.ai_visible ?? null,
    note:               a.ai_visible_note ?? null,
    highIntentPresence: null,
    highIntentNote:     null,
  });
  const [aiPresenceLoading, setAiPresenceLoading] = useState(false);
  const aiAutoChecked = useRef(false);

  const [outreachLoading,  setOutreachLoading]  = useState(false);
  const [outreachPreview,  setOutreachPreview]  = useState(null);

  const [reauditRunning, setReauditRunning] = useState(false);
  const [toast, setToast]                  = useState(null);

  // Tier 2 data state
  const [scData,        setScData]        = useState(null);
  const [scLoading,     setScLoading]     = useState(false);
  const [scError,       setScError]       = useState(null);
  const [gaData,        setGaData]        = useState(null);
  const [gaLoading,     setGaLoading]     = useState(false);
  const [gaError,       setGaError]       = useState(null);

  // Auto-load intelligence summary on open
  useEffect(() => {
    let cancelled = false;
    async function load() {
      setSummaryLoading(true);
      setSummaryError(null);
      try {
        const s = await generateIntelligenceSummary(a);
        if (!cancelled) setSummary(s);
      } catch (e) {
        if (!cancelled) setSummaryError(e.message);
      } finally {
        if (!cancelled) setSummaryLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [domainGroup.domain, a.id]);

  // Auto-run AI presence check on panel open if not yet checked
  useEffect(() => {
    if (aiAutoChecked.current) return;
    if (a.ai_visible !== null && a.ai_visible !== undefined) return;
    aiAutoChecked.current = true;

    const companyName = a.findings?.og?.title || a.findings?.title?.value || domainGroup.domain;
    setAiPresenceLoading(true);
    checkAiVisibility(companyName, '', { auditId: a.id })
      .then(result => {
        setAiPresence({
          visible:            result.visible,
          note:               result.note,
          highIntentPresence: result.highIntentPresence,
          highIntentNote:     result.highIntentNote,
        });
      })
      .catch(e => {
        setToast(`AI presence check failed: ${e.message}`);
      })
      .finally(() => {
        setAiPresenceLoading(false);
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync aiPresence state when latest audit row changes
  useEffect(() => {
    setAiPresence({
      visible:            a.ai_visible ?? null,
      note:               a.ai_visible_note ?? null,
      highIntentPresence: null,
      highIntentNote:     null,
    });
    aiAutoChecked.current = false;
  }, [a.id]);

  async function handleManualAiPresenceCheck() {
    const companyName = a.findings?.og?.title || a.findings?.title?.value || domainGroup.domain;
    setAiPresenceLoading(true);
    try {
      const result = await checkAiVisibility(companyName, '', { auditId: a.id });
      setAiPresence({
        visible:            result.visible,
        note:               result.note,
        highIntentPresence: result.highIntentPresence,
        highIntentNote:     result.highIntentNote,
      });
    } catch (e) {
      setToast(`AI presence check failed: ${e.message}`);
    } finally {
      setAiPresenceLoading(false);
    }
  }

  // ── Auto-fetch Tier 2 data when connections are available ──────────────────
  useEffect(() => {
    const scConn = connections?.search_console;
    if (scConn?.status !== 'connected' || !scConn.selected_property_id) return;
    let cancelled = false;
    setScLoading(true);
    setScError(null);
    fetchSearchConsoleData(scConn.selected_property_id, { rowLimit: 10 })
      .then(d => { if (!cancelled) setScData(d); })
      .catch(e => { if (!cancelled) setScError(e.message); })
      .finally(() => { if (!cancelled) setScLoading(false); });
    return () => { cancelled = true; };
  }, [connections?.search_console?.status, connections?.search_console?.selected_property_id]);

  useEffect(() => {
    const gaConn = connections?.analytics;
    if (gaConn?.status !== 'connected' || !gaConn.selected_property_id) return;
    let cancelled = false;
    setGaLoading(true);
    setGaError(null);
    fetchAnalyticsData(gaConn.selected_property_id)
      .then(d => { if (!cancelled) setGaData(d); })
      .catch(e => { if (!cancelled) setGaError(e.message); })
      .finally(() => { if (!cancelled) setGaLoading(false); });
    return () => { cancelled = true; };
  }, [connections?.analytics?.status, connections?.analytics?.selected_property_id]);

  async function handleGenerateOutreach() {
    setOutreachLoading(true);
    try {
      const prospect = { company: a.findings?.og?.title || a.findings?.title?.value || domainGroup.domain };
      const { subject, body } = await generateAuditEmail(a, prospect);
      setOutreachPreview({ subject, body });
    } catch (e) {
      setToast(`Failed to generate outreach: ${e.message}`);
    } finally {
      setOutreachLoading(false);
    }
  }

  async function handleReauditClick() {
    setReauditRunning(true);
    try {
      await onReaudit(a);
    } finally {
      setReauditRunning(false);
    }
  }

  const enquiryColor = { Excellent: '#22c55e', Good: '#a3e635', Weak: '#f97316', Poor: '#ef4444', Unknown: '#6b7280' };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, zIndex: 400,
          background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
          animation: 'vpOverlayIn 0.22s ease forwards',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'fixed', top: 0, right: 0, bottom: 0, zIndex: 401,
        width: 'min(500px, 96vw)',
        background: '#141412',
        borderLeft: '1px solid rgba(255,255,255,0.08)',
        display: 'flex', flexDirection: 'column',
        animation: 'vpPanelIn 0.28s cubic-bezier(0.22,1,0.36,1) forwards',
        overflow: 'hidden',
      }}>

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ padding: '20px 24px 0', borderBottom: '1px solid rgba(255,255,255,0.07)', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: NU, fontSize: 13, color: '#f5f2ec', fontWeight: 500, marginBottom: 4, wordBreak: 'break-word' }}>
                {domainGroup.domain}
              </div>
              <a href={a.url} target="_blank" rel="noreferrer" style={{ fontFamily: NU, fontSize: 10, color: G, textDecoration: 'none', opacity: 0.8 }}>
                {a.url.length > 48 ? a.url.slice(0, 48) + '...' : a.url}
              </a>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 10, padding: '2px 7px', borderRadius: 4, background: a.prospect_id ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.1)', color: a.prospect_id ? '#6366f1' : '#10b981', fontWeight: 600, fontFamily: NU, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {a.prospect_id ? 'Prospect' : 'Vendor'}
                </span>
                <OpportunityBadge value={opportunity} />
                {trend.direction === 'up' && (
                  <span style={{ fontFamily: NU, fontSize: 11, color: '#22c55e', fontWeight: 600 }}>
                    ↑ {trend.label}
                  </span>
                )}
                {trend.direction === 'down' && (
                  <span style={{ fontFamily: NU, fontSize: 11, color: '#ef4444', fontWeight: 600 }}>
                    ↓ {trend.label}
                  </span>
                )}
                {trend.direction === 'stable' && (
                  <span style={{ fontFamily: NU, fontSize: 11, color: '#6b7280', fontWeight: 600 }}>
                    → Stable
                  </span>
                )}
                {trend.direction === 'none' && (
                  <span style={{ fontFamily: NU, fontSize: 10, color: '#4b5563', fontStyle: 'italic' }}>
                    First audit
                  </span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0, marginLeft: 16 }}>
              <AuditScoreRing score={a.score} size={72} strokeWidth={6} />
              <div style={{ fontFamily: NU, fontSize: 10, color: sc }}>{scoreLabel(a.score)}</div>
            </div>
          </div>

          {/* Issue summary strip */}
          <div style={{ display: 'flex', gap: 16, paddingBottom: 16, flexWrap: 'wrap' }}>
            {severity.critical > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
                <span style={{ fontFamily: NU, fontSize: 11, color: '#ef4444' }}>Critical: {severity.critical}</span>
              </div>
            )}
            {severity.important > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f97316', display: 'inline-block' }} />
                <span style={{ fontFamily: NU, fontSize: 11, color: '#f97316' }}>Important: {severity.important}</span>
              </div>
            )}
            {severity.minor > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} />
                <span style={{ fontFamily: NU, fontSize: 11, color: '#6b7280' }}>Minor: {severity.minor}</span>
              </div>
            )}
            {issues.length === 0 && (
              <span style={{ fontFamily: NU, fontSize: 11, color: '#22c55e' }}>All checks passing</span>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: 16, right: 20, background: 'transparent', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', padding: '4px 8px', lineHeight: 1 }}
            aria-label="Close panel"
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>

          {/* ── AI Intelligence Summary ──────────────────────────────────── */}
          <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <SectionTitle C={C}>Intelligence Summary</SectionTitle>
            {summaryLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #4b5563', borderTopColor: G, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: NU, fontSize: 12, fontStyle: 'italic' }}>Generating summary...</span>
              </div>
            ) : summaryError ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: '#ef4444' }}>{summaryError}</div>
            ) : summary ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['Visibility', summary.visibility], ['Conversion', summary.conversion], ['Opportunity', summary.opportunity]].map(([key, text]) => (
                  text ? (
                    <div key={key}>
                      <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: G, marginBottom: 4 }}>{key}</div>
                      <div style={{ fontFamily: NU, fontSize: 12, color: '#d1d5db', lineHeight: 1.65 }}>{text}</div>
                    </div>
                  ) : null
                ))}
              </div>
            ) : null}
          </div>

          {/* ── SEO Breakdown ────────────────────────────────────────────── */}
          <div style={{ paddingTop: 20, paddingBottom: 4, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <SectionTitle C={C}>SEO Analysis</SectionTitle>

            {issues.length === 0 ? (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: 6, padding: '14px 16px', display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <span style={{ color: '#22c55e', fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                <div>
                  <div style={{ fontFamily: NU, fontSize: 12, color: '#22c55e', fontWeight: 600, marginBottom: 3 }}>All checks passing</div>
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#6b7280', lineHeight: 1.6 }}>This site meets all technical SEO requirements. The next focus should be content quality and building external authority to continue improving visibility.</div>
                </div>
              </div>
            ) : (
              <>
                {critical.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: NU, fontSize: 10, color: '#ef4444', fontWeight: 600, marginBottom: 4 }}>CRITICAL</div>
                    {critical.map(i => <IssueRow key={i.signal} issue={i} C={C} />)}
                  </div>
                )}
                {important.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: NU, fontSize: 10, color: '#f97316', fontWeight: 600, marginBottom: 4 }}>IMPORTANT</div>
                    {important.map(i => <IssueRow key={i.signal} issue={i} C={C} />)}
                  </div>
                )}
                {minor.length > 0 && (
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280', fontWeight: 600, marginBottom: 4 }}>MINOR</div>
                    {minor.map(i => <IssueRow key={i.signal} issue={i} C={C} />)}
                  </div>
                )}
              </>
            )}

            {passed.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontFamily: NU, fontSize: 10, color: '#22c55e', fontWeight: 600, marginBottom: 4 }}>PASSING</div>
                {passed.map(p => <PassedRow key={p.signal} item={p} C={C} />)}
              </div>
            )}
          </div>

          {/* ── Enquiry Experience ───────────────────────────────────────── */}
          <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <SectionTitle C={C}>Enquiry Experience</SectionTitle>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
              <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: enquiryColor[enquiry.label] || '#6b7280' }}>
                {enquiry.score}
              </div>
              <div>
                <div style={{ fontFamily: NU, fontSize: 12, color: enquiryColor[enquiry.label] || '#6b7280', fontWeight: 600 }}>{enquiry.label}</div>
                <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280' }}>structural signals only</div>
              </div>
            </div>

            {/* AI-generated experience insight */}
            {summary?.experienceInsight && (
              <div style={{ background: 'rgba(201,168,76,0.05)', borderLeft: '2px solid rgba(201,168,76,0.35)', padding: '9px 12px', marginBottom: 14, borderRadius: '0 4px 4px 0' }}>
                <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: G, marginBottom: 4 }}>Experience Insight</div>
                <div style={{ fontFamily: NU, fontSize: 11, color: '#d1d5db', lineHeight: 1.6 }}>{summary.experienceInsight}</div>
              </div>
            )}

            {enquiry.signals.length > 0 ? (
              enquiry.signals.map((s, i) => (
                <div key={i} style={{ padding: '10px 0', borderBottom: i < enquiry.signals.length - 1 ? `1px solid ${C.border}` : 'none' }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <SeverityDot sev={s.severity} />
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 12, color: '#f5f2ec', marginBottom: 4 }}>{s.issue}</div>
                      <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>{s.impact}</div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.14)', borderRadius: 6, padding: '12px 14px', display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: '#22c55e', fontSize: 14 }}>✓</span>
                <span style={{ fontFamily: NU, fontSize: 11, color: '#6b7280', lineHeight: 1.5 }}>No major enquiry experience issues detected. This site provides a solid baseline for visitors making contact.</span>
              </div>
            )}
          </div>

          {/* ── AI Presence ──────────────────────────────────────────────── */}
          <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <SectionTitle C={C}>AI Presence</SectionTitle>
              <span style={{ fontFamily: NU, fontSize: 9, color: '#4b5563', letterSpacing: '0.04em' }}>Claude only</span>
            </div>

            {aiPresenceLoading ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #4b5563', borderTopColor: G, animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
                <span style={{ fontFamily: NU, fontSize: 12, fontStyle: 'italic' }}>Checking AI presence...</span>
              </div>
            ) : aiPresence.visible !== null && aiPresence.visible !== undefined ? (
              <div>
                {/* Known / Not known */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: aiPresence.visible ? '#22c55e' : '#6b7280', flexShrink: 0 }} />
                  <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 700, color: aiPresence.visible ? '#22c55e' : '#6b7280' }}>
                    {aiPresence.visible ? 'Brand known in AI' : 'Not known in AI'}
                  </span>
                </div>
                {aiPresence.note && (
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', lineHeight: 1.6, marginBottom: 12 }}>{aiPresence.note}</div>
                )}

                {/* High-intent presence */}
                {aiPresence.highIntentPresence !== null && (
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 5, padding: '10px 12px', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: aiPresence.highIntentPresence ? '#22c55e' : '#f97316', flexShrink: 0 }} />
                      <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: aiPresence.highIntentPresence ? '#22c55e' : '#f97316' }}>
                        {aiPresence.highIntentPresence ? 'Appears in high-intent queries' : 'Not surfaced in high-intent queries'}
                      </span>
                    </div>
                    {aiPresence.highIntentNote && (
                      <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', lineHeight: 1.6 }}>{aiPresence.highIntentNote}</div>
                    )}
                  </div>
                )}

                {/* Re-check link */}
                <button
                  onClick={handleManualAiPresenceCheck}
                  style={{ background: 'transparent', border: 'none', color: '#4b5563', fontFamily: NU, fontSize: 10, cursor: 'pointer', padding: 0, textDecoration: 'underline', textDecorationStyle: 'dotted' }}
                >
                  Re-check
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#4b5563' }}>
                <div style={{ width: 12, height: 12, borderRadius: '50%', border: '2px solid #374151', flexShrink: 0 }} />
                <span style={{ fontFamily: NU, fontSize: 12, fontStyle: 'italic' }}>Not yet checked</span>
              </div>
            )}
          </div>

          {/* ── Audit History ─────────────────────────────────────────────── */}
          <div style={{ paddingTop: 20, paddingBottom: 20, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <SectionTitle C={C}>Audit History ({domainGroup.history.length + 1} {domainGroup.history.length + 1 === 1 ? 'run' : 'runs'})</SectionTitle>

            {domainGroup.history.length === 0 ? (
              <div style={{ fontFamily: NU, fontSize: 11, color: '#4b5563', fontStyle: 'italic', lineHeight: 1.6 }}>
                This is the first audit for this domain. History will build here after subsequent re-audits.
              </div>
            ) : (
              <>
                {/* Latest */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                  <span style={{ fontFamily: NU, fontSize: 11, color: G }}>Latest</span>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                    <span style={{ fontFamily: NU, fontSize: 11, color: scoreColor(a.score), fontWeight: 600 }}>{a.score}</span>
                    <span style={{ fontFamily: NU, fontSize: 10, color: '#6b7280' }}>{relativeTime(a.created_at)}</span>
                  </div>
                </div>

                {domainGroup.history.slice(0, 5).map(h => (
                  <div key={h.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${C.border}` }}>
                    <span style={{ fontFamily: NU, fontSize: 11, color: '#6b7280' }}>{relativeTime(h.created_at)}</span>
                    <span style={{ fontFamily: NU, fontSize: 11, color: scoreColor(h.score), fontWeight: 600 }}>{h.score}</span>
                  </div>
                ))}
              </>
            )}
          </div>

          {/* ── Tier 2: Connected Data ───────────────────────────────────── */}
          <div style={{ paddingTop: 20, paddingBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <SectionTitle C={C}>Connected Data</SectionTitle>
              <span style={{ fontFamily: NU, fontSize: 9, background: 'rgba(201,168,76,0.1)', color: G, padding: '1px 6px', borderRadius: 3, letterSpacing: '0.06em', fontWeight: 700, textTransform: 'uppercase' }}>Tier 2</span>
            </div>

            {/* ── Site Intelligence: combined cross-signal block ───────────── */}
            {(() => {
              const gaConn = connections?.analytics;
              const scConn = connections?.search_console;
              const bothConnected = gaConn?.status === 'connected' && scConn?.status === 'connected';
              const dataReady = gaData && scData && !gaLoading && !scLoading;
              if (!bothConnected || !dataReady) return null;

              const gs = gaData.summary;
              const st = scData.totals;

              // ── Unified Score ──────────────────────────────────────────────
              const seoComp = Math.round((a.score / 100) * 40);
              const br = gs.bounceRate ?? 50;
              const engComp = br < 30 ? 30 : br < 45 ? 24 : br < 60 ? 16 : br < 75 ? 9 : 4;
              const ctr = parseFloat(st.ctr) || 0;
              const visComp = ctr > 5 ? 30 : ctr > 3 ? 24 : ctr > 1 ? 16 : ctr > 0.3 ? 9 : 4;
              const unifiedScore = seoComp + engComp + visComp;

              const uColor = unifiedScore >= 70 ? '#4ade80' : unifiedScore >= 45 ? '#fbbf24' : '#f87171';
              const uLabel = unifiedScore >= 70 ? 'Strong' : unifiedScore >= 45 ? 'Developing' : 'Needs Work';

              // ── Cross-signal findings ──────────────────────────────────────
              const findings = [];

              // SEO + engagement compound
              if (critical.length > 0 && br > 55) {
                findings.push({ sev: 'high', icon: '⚠', title: 'Compounding risk', detail: `${critical.length} critical SEO issue${critical.length > 1 ? 's' : ''} combined with a ${br}% bounce rate creates a compounding problem. Visitors find the site but leave before converting.` });
              }
              // Good rankings, poor engagement
              if ((st.position ?? 99) < 10 && br > 60) {
                findings.push({ sev: 'high', icon: '⚠', title: 'Rankings not converting', detail: `Average position ${st.position} in search but ${br}% bounce rate. Strong visibility is being wasted on a poor on-page experience.` });
              }
              // High impressions, low CTR
              if ((st.impressions ?? 0) > 200 && ctr < 2) {
                findings.push({ sev: 'med', icon: '◎', title: 'Click-through gap', detail: `${(st.impressions ?? 0).toLocaleString()} impressions but only ${ctr}% CTR. Title tags and meta descriptions likely need rewriting to match search intent.` });
              }
              // Near-ranking opportunities
              const nearRank = (scData.rows ?? []).filter(r => r.position >= 4 && r.position <= 10 && (r.impressions ?? 0) > 20);
              if (nearRank.length > 0) {
                findings.push({ sev: 'med', icon: '◎', title: `${nearRank.length} near-ranking keyword${nearRank.length > 1 ? 's' : ''}`, detail: `${nearRank.length} quer${nearRank.length > 1 ? 'ies' : 'y'} ranking positions 4-10 with active impressions. Targeted content updates could push these to the top 3.` });
              }
              // Enquiry experience + active traffic
              if (enquiry.score < 50 && (gs.sessions ?? 0) > 200) {
                findings.push({ sev: 'med', icon: '◎', title: 'Enquiry friction costing conversions', detail: `Enquiry experience score is ${enquiry.score}/100 on a site receiving ${(gs.sessions).toLocaleString()} sessions. Fixing contact flow could directly increase lead volume.` });
              }
              // Strong signals
              if (critical.length === 0 && br < 40 && ctr > 3) {
                findings.push({ sev: 'good', icon: '✓', title: 'Healthy site signals', detail: `No critical SEO issues, ${br}% bounce rate, and ${ctr}% CTR. Site is performing well across all three signal sources.` });
              }

              // ── Keyword opportunities ──────────────────────────────────────
              const opportunities = (scData.rows ?? [])
                .filter(r => (r.impressions ?? 0) >= 30)
                .map(r => {
                  const rowCtr = parseFloat(r.ctr ?? 0);
                  if (r.position >= 4 && r.position <= 10) return { ...r, type: 'Near Rank', typeColor: '#4ade80', action: 'Content push' };
                  if (rowCtr < 2 && (r.impressions ?? 0) > 50)  return { ...r, type: 'CTR Gap',   typeColor: '#fbbf24', action: 'Meta rewrite' };
                  return null;
                })
                .filter(Boolean)
                .slice(0, 5);

              // ── Top page signals (GA landing pages with bounce) ────────────
              const topPages = (gaData.landingPages ?? []).slice(0, 4).map(p => {
                const pageBr = p.bounceRate ?? null;
                const bColor = pageBr == null ? '#6b7280' : pageBr < 40 ? '#4ade80' : pageBr < 60 ? '#fbbf24' : '#f87171';
                return { ...p, bColor, pageBr };
              });

              return (
                <div style={{ marginBottom: 16, border: '1px solid rgba(201,168,76,0.22)', borderRadius: 8, overflow: 'hidden', background: 'rgba(201,168,76,0.03)' }}>

                  {/* Header: unified score */}
                  <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(201,168,76,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.09em', color: G }}>Site Intelligence</span>
                      <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#4ade80', background: 'rgba(74,222,128,0.1)', border: '1px solid rgba(74,222,128,0.2)', borderRadius: 3, padding: '1px 5px' }}>Live</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2 }}>Unified Score</div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 5, justifyContent: 'flex-end' }}>
                          <span style={{ fontFamily: NU, fontSize: 22, fontWeight: 700, color: uColor, lineHeight: 1 }}>{unifiedScore}</span>
                          <span style={{ fontFamily: NU, fontSize: 10, color: '#6b7280' }}>/100</span>
                          <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: uColor, background: `${uColor}18`, border: `1px solid ${uColor}30`, borderRadius: 3, padding: '1px 5px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{uLabel}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Score breakdown strip */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderBottom: '1px solid rgba(201,168,76,0.1)' }}>
                    {[
                      { label: 'SEO Health', value: seoComp, max: 40, color: scoreColor(a.score) },
                      { label: 'Engagement', value: engComp,  max: 30, color: br < 45 ? '#4ade80' : br < 65 ? '#fbbf24' : '#f87171' },
                      { label: 'Search Vis.',  value: visComp,  max: 30, color: ctr > 3 ? '#4ade80' : ctr > 1 ? '#fbbf24' : '#f87171' },
                    ].map((seg, i) => (
                      <div key={i} style={{ padding: '10px 14px', borderRight: i < 2 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5 }}>{seg.label}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${(seg.value / seg.max) * 100}%`, background: seg.color, borderRadius: 2, transition: 'width 0.5s ease' }} />
                          </div>
                          <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: seg.color, flexShrink: 0 }}>{seg.value}<span style={{ fontFamily: NU, fontSize: 9, color: '#4b5563' }}>/{seg.max}</span></span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Cross-signal findings */}
                  {findings.length > 0 && (
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ padding: '9px 16px 5px', fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>Cross-Signal Findings</div>
                      {findings.map((f, i) => (
                        <div key={i} style={{
                          display: 'flex', gap: 10, padding: '8px 16px',
                          borderTop: i > 0 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        }}>
                          <span style={{ fontSize: 11, flexShrink: 0, marginTop: 1, color: f.sev === 'high' ? '#f87171' : f.sev === 'good' ? '#4ade80' : '#fbbf24' }}>{f.icon}</span>
                          <div>
                            <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: f.sev === 'high' ? '#f87171' : f.sev === 'good' ? '#4ade80' : '#fbbf24' }}>{f.title} </span>
                            <span style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af' }}>{f.detail}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Keyword opportunities */}
                  {opportunities.length > 0 && (
                    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <div style={{ padding: '9px 16px 5px', fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>Keyword Opportunities</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 52px 56px 52px 78px', padding: '4px 16px 6px', gap: 6 }}>
                        {['Query', 'Impr.', 'Pos.', 'CTR', 'Action'].map((h, i) => (
                          <span key={i} style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4b5563', textAlign: i === 0 ? 'left' : 'right' }}>{h}</span>
                        ))}
                      </div>
                      {opportunities.map((opp, i) => (
                        <div key={i} style={{
                          display: 'grid', gridTemplateColumns: '1fr 52px 56px 52px 78px',
                          padding: '7px 16px', gap: 6, alignItems: 'center',
                          borderTop: '1px solid rgba(255,255,255,0.04)',
                        }}>
                          <span style={{ fontFamily: NU, fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opp.query}</span>
                          <span style={{ fontFamily: NU, fontSize: 10, color: '#f5f2ec', textAlign: 'right' }}>{(opp.impressions ?? 0).toLocaleString()}</span>
                          <span style={{ fontFamily: NU, fontSize: 10, color: G, textAlign: 'right', fontWeight: 600 }}>#{opp.position?.toFixed(1)}</span>
                          <span style={{ fontFamily: NU, fontSize: 10, color: '#9ca3af', textAlign: 'right' }}>{parseFloat(opp.ctr ?? 0).toFixed(1)}%</span>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, color: opp.typeColor, background: `${opp.typeColor}14`, border: `1px solid ${opp.typeColor}30`, borderRadius: 3, padding: '2px 5px', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{opp.action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Top pages signals */}
                  {topPages.length > 0 && (
                    <div>
                      <div style={{ padding: '9px 16px 5px', fontFamily: NU, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#6b7280' }}>Top Page Signals</div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 64px 70px', padding: '4px 16px 6px', gap: 6 }}>
                        {['Page', 'Sessions', 'Bounce'].map((h, i) => (
                          <span key={i} style={{ fontFamily: NU, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: '#4b5563', textAlign: i === 0 ? 'left' : 'right' }}>{h}</span>
                        ))}
                      </div>
                      {topPages.map((p, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 64px 70px', padding: '7px 16px', gap: 6, alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
                          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.page}</span>
                          <span style={{ fontFamily: NU, fontSize: 10, color: '#f5f2ec', textAlign: 'right' }}>{(p.sessions ?? 0).toLocaleString()}</span>
                          <div style={{ textAlign: 'right' }}>
                            {p.pageBr != null
                              ? <span style={{ fontFamily: NU, fontSize: 10, color: p.bColor, fontWeight: p.pageBr > 60 ? 600 : 400 }}>{p.pageBr}%</span>
                              : <span style={{ fontFamily: NU, fontSize: 10, color: '#6b7280' }}>-</span>
                            }
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Google Analytics Section */}
            {(() => {
              const gaConn = connections?.analytics;
              const isConnected = gaConn?.status === 'connected';
              if (!isConnected) return (
                <LockedSection title="Engagement & Bounce Rate" integration="Google Analytics" C={C} />
              );
              if (gaLoading) return (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '14px 16px', marginBottom: 8 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: G }}>Loading Analytics data...</div>
                </div>
              );
              if (gaError) return (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '14px 16px', marginBottom: 8 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#f5f2ec', marginBottom: 3 }}>Engagement & Bounce Rate</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: '#ef4444' }}>{gaError}</div>
                </div>
              );
              if (!gaData) return null;
              const s = gaData.summary;
              return (
                <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 6, padding: '14px 16px', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: NU, fontSize: 12, color: '#f5f2ec', fontWeight: 500 }}>Engagement & Bounce Rate</div>
                    <span style={{ fontFamily: NU, fontSize: 9, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '1px 6px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 10 }}>
                    {[
                      { label: 'Sessions',      value: s.sessions?.toLocaleString() },
                      { label: 'Bounce Rate',   value: `${s.bounceRate}%` },
                      { label: 'Avg Duration',  value: s.avgSessionFormatted },
                      { label: 'Pages/Session', value: s.pagesPerSession },
                      { label: 'New Users',     value: s.newUsers?.toLocaleString() },
                      { label: 'Total Users',   value: s.totalUsers?.toLocaleString() },
                    ].map(({ label, value }) => (
                      <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 4, padding: '8px 10px' }}>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#6b7280', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                        <div style={{ fontFamily: NU, fontSize: 13, color: '#f5f2ec', fontWeight: 600 }}>{value ?? '--'}</div>
                      </div>
                    ))}
                  </div>
                  {gaData.landingPages?.length > 0 && (
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Landing Pages</div>
                      {gaData.landingPages.slice(0, 3).map((p, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                          <div style={{ fontFamily: NU, fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '60%' }}>{p.page}</div>
                          <div style={{ fontFamily: NU, fontSize: 10, color: '#f5f2ec' }}>{p.sessions} sessions</div>
                        </div>
                      ))}
                    </div>
                  )}
                  <div style={{ fontFamily: NU, fontSize: 9, color: '#6b7280', marginTop: 8 }}>
                    {gaData.startDate} to {gaData.endDate} - {gaConn.selected_property_name}
                  </div>
                </div>
              );
            })()}

            {/* Search Console Section */}
            {(() => {
              const scConn = connections?.search_console;
              const isConnected = scConn?.status === 'connected';
              if (!isConnected) return (
                <LockedSection title="Keyword Visibility & Rankings" integration="Google Search Console" C={C} />
              );
              if (scLoading) return (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 6, padding: '14px 16px' }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: G }}>Loading Search Console data...</div>
                </div>
              );
              if (scError) return (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 6, padding: '14px 16px' }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#f5f2ec', marginBottom: 3 }}>Keyword Visibility & Rankings</div>
                  <div style={{ fontFamily: NU, fontSize: 10, color: '#ef4444' }}>{scError}</div>
                </div>
              );
              if (!scData) return null;
              const t = scData.totals;
              return (
                <div style={{ background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.12)', borderRadius: 6, padding: '14px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ fontFamily: NU, fontSize: 12, color: '#f5f2ec', fontWeight: 500 }}>Keyword Visibility & Rankings</div>
                    <span style={{ fontFamily: NU, fontSize: 9, background: 'rgba(34,197,94,0.1)', color: '#22c55e', padding: '1px 6px', borderRadius: 3, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live</span>
                  </div>
                  {t && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6, marginBottom: 10 }}>
                      {[
                        { label: 'Clicks',       value: t.clicks?.toLocaleString() },
                        { label: 'Impressions',  value: t.impressions?.toLocaleString() },
                        { label: 'Avg CTR',      value: `${t.ctr}%` },
                        { label: 'Avg Position', value: t.position },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 4, padding: '7px 8px' }}>
                          <div style={{ fontFamily: NU, fontSize: 9, color: '#6b7280', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
                          <div style={{ fontFamily: NU, fontSize: 13, color: '#f5f2ec', fontWeight: 600 }}>{value ?? '--'}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {scData.rows?.length > 0 && (
                    <div>
                      <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Top Queries</div>
                      {scData.rows.slice(0, 6).map((r, i) => (
                        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 48px 60px 48px', gap: 6, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.05)', alignItems: 'center' }}>
                          <div style={{ fontFamily: NU, fontSize: 10, color: '#9ca3af', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.query}</div>
                          <div style={{ fontFamily: NU, fontSize: 10, color: '#f5f2ec', textAlign: 'right' }}>{r.clicks}</div>
                          <div style={{ fontFamily: NU, fontSize: 10, color: '#f5f2ec', textAlign: 'right' }}>{r.impressions}</div>
                          <div style={{ fontFamily: NU, fontSize: 10, color: G, textAlign: 'right' }}>#{r.position}</div>
                        </div>
                      ))}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 48px 60px 48px', gap: 6, paddingTop: 4 }}>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Query</div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#4b5563', textAlign: 'right', textTransform: 'uppercase' }}>Clicks</div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#4b5563', textAlign: 'right', textTransform: 'uppercase' }}>Impr.</div>
                        <div style={{ fontFamily: NU, fontSize: 9, color: '#4b5563', textAlign: 'right', textTransform: 'uppercase' }}>Pos.</div>
                      </div>
                    </div>
                  )}
                  <div style={{ fontFamily: NU, fontSize: 9, color: '#6b7280', marginTop: 8 }}>
                    {scData.startDate} to {scData.endDate} - {scConn.selected_property_name || scConn.selected_property_id}
                  </div>
                </div>
              );
            })()}
          </div>

        </div>

        {/* ── Sticky Action Bar ────────────────────────────────────────────── */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '14px 24px', display: 'flex', gap: 8, flexShrink: 0, background: '#141412' }}>
          <button
            onClick={handleGenerateOutreach}
            disabled={outreachLoading}
            style={{ flex: 1, padding: '9px 0', background: G, color: '#fff', border: 'none', borderRadius: 5, fontFamily: NU, fontSize: 12, fontWeight: 600, cursor: outreachLoading ? 'not-allowed' : 'pointer', opacity: outreachLoading ? 0.6 : 1, transition: 'opacity 0.15s' }}
          >
            {outreachLoading ? 'Generating...' : 'Generate Outreach'}
          </button>
          <button
            onClick={handleReauditClick}
            disabled={reauditRunning}
            style={{ padding: '9px 16px', background: 'transparent', border: '1px solid rgba(255,255,255,0.12)', color: '#9ca3af', borderRadius: 5, fontFamily: NU, fontSize: 12, cursor: reauditRunning ? 'not-allowed' : 'pointer', opacity: reauditRunning ? 0.6 : 1, whiteSpace: 'nowrap' }}
          >
            {reauditRunning ? 'Running...' : 'Re-audit'}
          </button>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'absolute', bottom: 72, left: 16, right: 16, background: '#1a1a18', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 6, padding: '10px 14px', fontFamily: NU, fontSize: 12, color: '#f5f2ec', boxShadow: '0 4px 16px rgba(0,0,0,0.4)', zIndex: 10 }}>
            {toast}
            <button onClick={() => setToast(null)} style={{ float: 'right', background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 14 }}>×</button>
          </div>
        )}
      </div>

      {/* Outreach Preview Modal */}
      {outreachPreview && (
        <OutreachPreviewModal preview={outreachPreview} onClose={() => setOutreachPreview(null)} />
      )}

      <style>{`
        @keyframes vpOverlayIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes vpPanelIn   { from { transform: translateX(100%) } to { transform: translateX(0) } }
        @keyframes opModalIn   { from { opacity: 0; transform: translate(-50%, -48%) scale(0.97) } to { opacity: 1; transform: translate(-50%, -50%) scale(1) } }
        @keyframes spin        { to { transform: rotate(360deg) } }
      `}</style>
    </>
  );
}
