// ─── src/components/crm/UrlToLeadModal.jsx ───────────────────────────────────
// URL to Lead Engine.
// Paste any website URL -> SEO audit -> AI contact extraction -> review -> CRM prospect.
//
// Props:
//   onClose()                 - close the modal
//   onSaved(prospect, audit)  - called after prospect is created
//   C                         - theme colour tokens

import { useState } from 'react';
import {
  runAudit,
  extractContactFromUrl,
  generateAuditEmail,
  getTopIssues,
  scoreLabel,
  scoreColor,
} from '../../services/websiteAuditService';
import {
  createProspect,
  findDuplicateProspects,
  logOutreachEmail,
  updateProspect,
} from '../../services/salesPipelineService';
import { calculateLeadScore } from '../../services/leadScoringService';
import { sendEmail } from '../../services/emailSendService';
import AuditScoreRing from '../seo/AuditScoreRing';

const G  = '#c9a84c';
const GD = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU = "var(--font-body, Inter, sans-serif)";

// ── Confidence badge ──────────────────────────────────────────────────────────
function ConfBadge({ level }) {
  const map = {
    found:     { bg: 'rgba(16,185,129,0.12)',  color: '#10b981', label: 'Found'     },
    inferred:  { bg: 'rgba(245,158,11,0.12)',  color: '#f59e0b', label: 'Inferred'  },
    not_found: { bg: 'rgba(156,163,175,0.1)',  color: '#9ca3af', label: 'Not found' },
  };
  const s = map[level] || map.not_found;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 6px', borderRadius: 3, background: s.bg, color: s.color, fontFamily: NU, marginLeft: 6 }}>
      {s.label}
    </span>
  );
}

// ── Issue icon ────────────────────────────────────────────────────────────────
function IssueIcon({ severity }) {
  return (
    <span style={{ color: severity === 'critical' ? '#ef4444' : '#f97316', fontSize: 12, marginRight: 6 }}>
      {severity === 'critical' ? '●' : '◆'}
    </span>
  );
}

// ── Inline field ─────────────────────────────────────────────────────────────
function Field({ label, value, conf, onChange, type = 'text', as }) {
  const style = {
    width: '100%', boxSizing: 'border-box',
    padding: '7px 10px',
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 5,
    color: '#e5e7eb',
    fontFamily: NU,
    fontSize: 13,
    marginTop: 3,
    resize: as === 'textarea' ? 'vertical' : undefined,
    minHeight: as === 'textarea' ? 70 : undefined,
  };
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', fontFamily: NU, fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
        {label}
        <ConfBadge level={conf || 'not_found'} />
      </div>
      {as === 'textarea' ? (
        <textarea style={style} value={value} onChange={e => onChange(e.target.value)} rows={3} />
      ) : (
        <input style={style} type={type} value={value} onChange={e => onChange(e.target.value)} />
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function UrlToLeadModal({ onClose, onSaved, C }) {
  const [step,         setStep]         = useState('input');   // input | loading | review | saved
  const [url,          setUrl]          = useState('');
  const [status,       setStatus]       = useState('');
  const [audit,        setAudit]        = useState(null);
  const [contact,      setContact]      = useState(null);
  const [dupeWarning,  setDupeWarning]  = useState(null);     // null | prospect row
  const [saving,       setSaving]       = useState(false);
  const [savedProspect,setSavedProspect]= useState(null);
  const [savedAudit,   setSavedAudit]   = useState(null);

  // Editable form fields (populated from contact extraction)
  const [form, setForm] = useState({
    company_name: '', contact_name: '', email: '', phone: '',
    location: '', business_type: 'Venue', notes: '',
  });
  const [conf, setConf] = useState({
    company_name: 'not_found', contact_name: 'not_found',
    email: 'not_found', phone: 'not_found', location: 'not_found',
  });

  // Email send state
  const [emailDraft,   setEmailDraft]   = useState(null);
  const [showEmail,    setShowEmail]    = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent,    setEmailSent]    = useState(false);

  // ── Analyse ─────────────────────────────────────────────────────────────────
  async function handleAnalyse() {
    let target = url.trim();
    if (!target) return;
    if (!/^https?:\/\//i.test(target)) target = 'https://' + target;

    setStep('loading');
    setStatus('Scanning website...');

    try {
      // Step 1: Audit (no prospect yet, don't log activity)
      const auditRow = await runAudit(target, { logActivity: false });
      setAudit(auditRow);
      setStatus('Extracting contact details...');

      // Step 2: AI contact extraction using findings as context
      const extracted = await extractContactFromUrl(target, auditRow.findings || {});
      setContact(extracted);

      // Populate editable form
      setForm({
        company_name:  extracted.company_name  || '',
        contact_name:  extracted.contact_name  || '',
        email:         extracted.email         || '',
        phone:         extracted.phone         || '',
        location:      extracted.location      || '',
        business_type: extracted.business_type || 'Venue',
        notes:         extracted.notes         || '',
      });
      setConf(extracted.confidence || {});

      // Step 3: Dedup check
      setStatus('Checking for duplicates...');
      const dupe = await findDuplicateProspects({
        email:   extracted.email   || '',
        website: target,
      });
      if (dupe) setDupeWarning(dupe);

      setStep('review');
    } catch (err) {
      console.error('URL analyse failed:', err);
      setStatus('Error: ' + (err.message || 'Analysis failed. Check the URL and try again.'));
      setStep('input');
    }
  }

  // ── Save as Prospect ─────────────────────────────────────────────────────────
  async function handleSave(mode = 'create') {
    if (!audit) return;
    setSaving(true);
    try {
      const topIssues = getTopIssues(audit.findings || {}, 1);
      const autoNote = [
        'Created from website URL audit.',
        `SEO score: ${audit.score}/100 (${scoreLabel(audit.score)}).`,
        topIssues.length ? `Top issue: ${topIssues[0].label}.` : '',
        form.notes || '',
      ].filter(Boolean).join('\n');

      let prospect;

      if (mode === 'update' && dupeWarning) {
        // Attach audit to the existing prospect instead of creating new
        prospect = dupeWarning;
      } else {
        // Create new prospect
        prospect = await createProspect({
          company_name:  form.company_name  || audit.url,
          contact_name:  form.contact_name  || '',
          email:         form.email         || '',
          phone:         form.phone         || '',
          website:       audit.url,
          country:       form.location      || '',
          venue_type:    form.business_type || 'Venue',
          source:        'URL Audit',
          notes:         autoNote,
        });

        // Seed lead score immediately
        try {
          const ls = calculateLeadScore(prospect, []);
          if (ls != null) await updateProspect(prospect.id, { lead_score: ls });
        } catch { /* non-fatal */ }
      }

      // Link audit to the prospect (run again with prospectId so it's logged)
      const linkedAudit = await runAudit(audit.url, {
        prospectId:  prospect.id,
        logActivity: true,
      });

      setSavedProspect(prospect);
      setSavedAudit(linkedAudit);
      setStep('saved');
      if (onSaved) onSaved(prospect, linkedAudit);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setSaving(false);
    }
  }

  // ── Generate audit email ──────────────────────────────────────────────────
  async function handleGenerateEmail() {
    if (!savedAudit || !savedProspect) return;
    try {
      const draft = await generateAuditEmail(savedAudit, savedProspect);
      setEmailDraft(draft);
      setShowEmail(true);
    } catch (err) {
      console.error('Email gen failed:', err);
    }
  }

  // ── Send email ───────────────────────────────────────────────────────────
  async function handleSendEmail() {
    if (!emailDraft || !savedProspect) return;
    setEmailSending(true);
    try {
      const fromEmail = localStorage.getItem('emailFromAddress') || '';
      const fromName  = localStorage.getItem('emailFromName')    || 'Luxury Wedding Directory';

      const emailRow = await logOutreachEmail({
        prospectId: savedProspect.id,
        emailType:  'cold',
        subject:    emailDraft.subject,
        body:       emailDraft.body,
      });

      if (savedProspect.email && fromEmail) {
        const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
        const pixel = `<img src="${SUPABASE_URL}/functions/v1/track-email-open?id=${emailRow.id}" width="1" height="1" style="display:none;border:0" alt="" />`;
        const htmlBody = `<div style="font-family:Inter,sans-serif;font-size:15px;line-height:1.7;color:#222">${emailDraft.body.replace(/\n/g, '<br/>')}</div>${pixel}`;
        await sendEmail({
          recipients: [{ email: savedProspect.email, name: savedProspect.contact_name || savedProspect.company_name }],
          html:       htmlBody,
          subject:    emailDraft.subject,
          fromEmail,
          fromName,
          type:       'campaign',
        });
      }
      setEmailSent(true);
      setShowEmail(false);
    } catch (err) {
      console.error('Send failed:', err);
    } finally {
      setEmailSending(false);
    }
  }

  // ── Navigate to CRM ──────────────────────────────────────────────────────
  function goToCrm() {
    window.dispatchEvent(new CustomEvent('lwd-nav', { detail: { section: 'pipeline' } }));
    onClose();
  }

  // ── Styles ────────────────────────────────────────────────────────────────
  const overlay = {
    position: 'fixed', inset: 0, zIndex: 9999,
    background: 'rgba(0,0,0,0.72)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 20,
  };
  const modal = {
    background: C?.bg2 || '#1a1a1a',
    border: `1px solid ${C?.border || 'rgba(255,255,255,0.1)'}`,
    borderRadius: 10,
    width: '100%',
    maxWidth: step === 'review' ? 860 : 520,
    maxHeight: '90vh',
    overflow: 'auto',
    padding: 32,
    position: 'relative',
  };
  const goldBtn = {
    padding: '9px 20px', background: G, color: '#fff',
    border: 'none', borderRadius: 5, fontFamily: NU, fontSize: 13,
    fontWeight: 600, cursor: 'pointer',
  };
  const outlineBtn = {
    padding: '9px 20px', background: 'transparent',
    border: `1px solid ${C?.border2 || 'rgba(255,255,255,0.2)'}`,
    color: C?.grey || '#9ca3af', borderRadius: 5, fontFamily: NU, fontSize: 13, cursor: 'pointer',
  };
  const input = {
    width: '100%', boxSizing: 'border-box', padding: '10px 14px',
    background: 'rgba(255,255,255,0.05)',
    border: `1px solid ${C?.border || 'rgba(255,255,255,0.1)'}`,
    borderRadius: 6, color: '#e5e7eb', fontFamily: NU, fontSize: 14,
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && step !== 'loading' && onClose()}>
      <div style={modal}>
        {/* Close button */}
        {step !== 'loading' && (
          <button onClick={onClose} style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', color: C?.grey || '#9ca3af', fontSize: 18, cursor: 'pointer', lineHeight: 1 }}>x</button>
        )}

        {/* ── Step 1: Input ── */}
        {step === 'input' && (
          <div>
            <div style={{ fontFamily: GD, fontSize: 24, fontWeight: 400, color: C?.off || '#e5e7eb', marginBottom: 6 }}>Add Website URL</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: C?.grey || '#9ca3af', marginBottom: 28, lineHeight: 1.6 }}>
              Paste any venue or vendor website. The system will run a full SEO audit and extract contact details for your CRM.
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontFamily: NU, fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6 }}>Website URL</label>
              <input
                style={input}
                type="url"
                placeholder="https://www.examplevenue.com"
                value={url}
                onChange={e => setUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAnalyse()}
                autoFocus
              />
            </div>
            {status && <div style={{ fontFamily: NU, fontSize: 12, color: '#ef4444', marginBottom: 12 }}>{status}</div>}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              <button style={outlineBtn} onClick={onClose}>Cancel</button>
              <button style={{ ...goldBtn, opacity: !url.trim() ? 0.5 : 1 }} disabled={!url.trim()} onClick={handleAnalyse}>
                Analyse Website
              </button>
            </div>
          </div>
        )}

        {/* ── Step 2: Loading ── */}
        {step === 'loading' && (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontFamily: GD, fontSize: 22, color: C?.off || '#e5e7eb', marginBottom: 12 }}>Analysing...</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: G, marginBottom: 32 }}>{status}</div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
              {['Scan', 'Audit', 'Extract'].map((s, i) => (
                <div key={s} style={{ padding: '5px 14px', borderRadius: 20, background: 'rgba(201,168,76,0.12)', border: `1px solid rgba(201,168,76,${status.includes('contact') && i < 3 ? '0.6' : status.includes('signal') && i < 2 ? '0.6' : i < 1 ? '0.6' : '0.2'})`, fontFamily: NU, fontSize: 11, color: G }}>
                  {s}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Review ── */}
        {step === 'review' && audit && (
          <div>
            <div style={{ fontFamily: GD, fontSize: 22, fontWeight: 400, color: C?.off || '#e5e7eb', marginBottom: 20 }}>Review Before Saving</div>

            {/* Dupe warning */}
            {dupeWarning && (
              <div style={{ background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', borderRadius: 6, padding: '12px 16px', marginBottom: 20 }}>
                <div style={{ fontFamily: NU, fontSize: 13, color: '#f59e0b', fontWeight: 600, marginBottom: 4 }}>Duplicate found</div>
                <div style={{ fontFamily: NU, fontSize: 12, color: '#fbbf24' }}>
                  <strong>{dupeWarning.company_name}</strong> already exists in CRM (matched by {dupeWarning.email ? 'email' : 'website'}).
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  <button style={{ ...outlineBtn, fontSize: 11, padding: '5px 12px', borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b' }} onClick={() => handleSave('update')}>Update Existing</button>
                  <button style={{ ...outlineBtn, fontSize: 11, padding: '5px 12px' }} onClick={() => { setDupeWarning(null); }}>Save Anyway</button>
                  <button style={{ ...outlineBtn, fontSize: 11, padding: '5px 12px' }} onClick={onClose}>Cancel</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.1fr', gap: 28 }}>
              {/* Left: SEO Report */}
              <div>
                <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>SEO Report</div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                  <AuditScoreRing score={audit.score} size={90} strokeWidth={8} />
                  <div>
                    <div style={{ fontFamily: GD, fontSize: 28, color: scoreColor(audit.score), fontWeight: 600, lineHeight: 1 }}>{audit.score}</div>
                    <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{scoreLabel(audit.score)}</div>
                    <div style={{ fontFamily: NU, fontSize: 10, color: '#6b7280', marginTop: 6, maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={audit.url}>{(audit.url || '').replace(/^https?:\/\//, '')}</div>
                  </div>
                </div>

                <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 10 }}>Top Issues</div>
                {getTopIssues(audit.findings || {}, 3).length === 0 ? (
                  <div style={{ fontFamily: NU, fontSize: 12, color: '#10b981' }}>No critical issues found</div>
                ) : (
                  getTopIssues(audit.findings || {}, 3).map(issue => (
                    <div key={issue.signal} style={{ display: 'flex', alignItems: 'flex-start', marginBottom: 8 }}>
                      <IssueIcon severity={issue.severity} />
                      <span style={{ fontFamily: NU, fontSize: 12, color: C?.grey || '#9ca3af', lineHeight: 1.4 }}>{issue.label}</span>
                    </div>
                  ))
                )}
              </div>

              {/* Right: Contact details */}
              <div>
                <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9ca3af', marginBottom: 16 }}>Extracted Contact Details</div>

                <Field label="Company Name"  value={form.company_name}  conf={conf.company_name}  onChange={v => setForm(f => ({ ...f, company_name: v }))} />
                <Field label="Contact Name"  value={form.contact_name}  conf={conf.contact_name}  onChange={v => setForm(f => ({ ...f, contact_name: v }))} />
                <Field label="Email"         value={form.email}         conf={conf.email}         onChange={v => setForm(f => ({ ...f, email: v }))}         type="email" />
                <Field label="Phone"         value={form.phone}         conf={conf.phone}         onChange={v => setForm(f => ({ ...f, phone: v }))} />
                <Field label="Location"      value={form.location}      conf={conf.location}      onChange={v => setForm(f => ({ ...f, location: v }))} />

                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>Business Type</div>
                  <select
                    style={{ ...input, padding: '7px 10px', fontSize: 13 }}
                    value={form.business_type}
                    onChange={e => setForm(f => ({ ...f, business_type: e.target.value }))}
                  >
                    {['Venue','Photographer','Florist','Caterer','Planner','Musician','Hair and Makeup','Cake Designer','Stationery','Jewellery','Transport','Vendor'].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                <Field label="Notes" value={form.notes} conf="not_found" onChange={v => setForm(f => ({ ...f, notes: v }))} as="textarea" />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 24, borderTop: `1px solid ${C?.border || 'rgba(255,255,255,0.08)'}`, paddingTop: 20 }}>
              <button style={outlineBtn} onClick={onClose}>Review Later</button>
              {!dupeWarning && (
                <button style={{ ...goldBtn, opacity: saving ? 0.6 : 1 }} onClick={() => handleSave('create')} disabled={saving}>
                  {saving ? 'Saving...' : 'Save as Prospect'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4: Saved ── */}
        {step === 'saved' && savedProspect && (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
            <div style={{ fontFamily: GD, fontSize: 24, color: '#10b981', marginBottom: 6 }}>Prospect Created</div>
            <div style={{ fontFamily: NU, fontSize: 13, color: C?.grey || '#9ca3af', marginBottom: 8 }}>
              <strong style={{ color: C?.off || '#e5e7eb' }}>{savedProspect.company_name}</strong> has been added to your CRM.
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: '#6b7280', marginBottom: 28 }}>
              SEO score: {savedAudit?.score ?? audit?.score}/100 ({scoreLabel(savedAudit?.score ?? audit?.score)}) - source: URL Audit
            </div>

            {emailSent ? (
              <div style={{ fontFamily: NU, fontSize: 13, color: '#10b981', marginBottom: 20 }}>Audit email sent successfully.</div>
            ) : showEmail && emailDraft ? (
              <div style={{ textAlign: 'left', background: 'rgba(255,255,255,0.03)', border: `1px solid ${C?.border || 'rgba(255,255,255,0.1)'}`, borderRadius: 8, padding: 20, marginBottom: 20 }}>
                <div style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Audit Email</div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Subject</div>
                  <input style={{ ...input, fontSize: 13, padding: '7px 10px' }} value={emailDraft.subject} onChange={e => setEmailDraft(d => ({ ...d, subject: e.target.value }))} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#9ca3af', marginBottom: 4 }}>Body</div>
                  <textarea style={{ ...input, fontSize: 13, padding: '7px 10px', minHeight: 180, resize: 'vertical' }} value={emailDraft.body} onChange={e => setEmailDraft(d => ({ ...d, body: e.target.value }))} />
                </div>
                {!savedProspect.email && (
                  <div style={{ fontFamily: NU, fontSize: 11, color: '#dc2626', background: '#fee2e2', padding: '6px 10px', borderRadius: 4, marginBottom: 12 }}>No email on file - email will be logged but not sent.</div>
                )}
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button style={outlineBtn} onClick={() => setShowEmail(false)}>Back</button>
                  <button style={{ ...goldBtn, opacity: emailSending ? 0.6 : 1 }} onClick={handleSendEmail} disabled={emailSending}>
                    {emailSending ? 'Sending...' : 'Send Email'}
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
                <button style={goldBtn} onClick={handleGenerateEmail}>Generate Audit Email</button>
                <button style={outlineBtn} onClick={goToCrm}>View in CRM</button>
                <button style={outlineBtn} onClick={onClose}>Done</button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
