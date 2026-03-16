/**
 * SalesPipelineCampaignDrawer.jsx
 * Campaign builder slide-out drawer, extracted from SalesPipelineModule.jsx.
 *
 * IMPORTANT: S and G are passed as props so this component picks up the
 * themed values that SalesPipelineModule sets before rendering.
 */

import React, { useState } from 'react';
import {
  createCampaign,
  filterProspectsForCampaign,
  sendCampaign,
} from '../../services/campaignService';
import {
  calculateLeadScore,
  scoreColor,
  scoreLabel,
} from '../../services/leadScoringService';

// ── Small display helper ──────────────────────────────────────────────────────

function ScorePill({ score, S }) {
  if (score == null) return null;
  const color = scoreColor(score);
  return <span style={S.scorePill(color)} title={`Lead score: ${score}/100 (${scoreLabel(score)})`}>{score}</span>;
}

// ── CampaignBuilderDrawer ─────────────────────────────────────────────────────

export default function CampaignBuilderDrawer({ prospects, pipelines, stages, templates, assignRules, assignSettings, onSaved, onClose, S, G, C }) {
  const resolvedG = G || '#8f7420';

  const [step, setStep] = useState(1); // 1=Filters 2=Audience 3=Compose 4=Confirm
  const [campaignName, setCampaignName] = useState('');
  const [filters, setFilters] = useState({ pipeline_id: '', stage_ids: [], venue_types: [], min_score: 0, statuses: ['active'] });
  const [subject, setSubject] = useState('');
  const [body, setBody]       = useState('');
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
    setConfirmed(true);
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
            <div key={label} style={{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: 600, letterSpacing: '0.07em', textTransform: 'uppercase', padding: '5px 0', borderRadius: 4, background: step === i + 1 ? resolvedG : step > i + 1 ? resolvedG + '22' : '#f3f0ea', color: step === i + 1 ? '#fff' : step > i + 1 ? resolvedG : '#aaa', cursor: step > i + 1 ? 'pointer' : 'default' }} onClick={() => { if (step > i + 1) setStep(i + 1); }}>{label}</div>
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
                    <button key={vt} type="button" onClick={() => setFilters(f => ({ ...f, venue_types: toggleArr(f.venue_types, vt) }))} style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, border: `1px solid ${active ? resolvedG : '#ddd'}`, background: active ? resolvedG + '22' : 'transparent', color: active ? resolvedG : '#666', cursor: 'pointer' }}>{vt}</button>
                  );
                })}
              </div>

              <div style={S.formLabel}>Min Lead Score: {filters.min_score}</div>
              <input type="range" min={0} max={100} step={5} value={filters.min_score} onChange={e => setFilters(f => ({ ...f, min_score: Number(e.target.value) }))} style={{ width: '100%', marginTop: 6, marginBottom: 18, accentColor: resolvedG }} />

              <div style={S.formLabel}>Status</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6 }}>
                {STATUS_OPTS.map(st => {
                  const active = filters.statuses.includes(st);
                  return (
                    <button key={st} type="button" onClick={() => setFilters(f => ({ ...f, statuses: toggleArr(f.statuses, st) }))} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, border: `1px solid ${active ? resolvedG : '#ddd'}`, background: active ? resolvedG + '22' : 'transparent', color: active ? resolvedG : '#666', cursor: 'pointer', textTransform: 'capitalize' }}>{st}</button>
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
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: resolvedG, flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.company_name}</div>
                      <div style={{ fontSize: 11, color: '#aaa' }}>{p.email}</div>
                    </div>
                    <ScorePill score={p.lead_score} S={S} />
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

              <div style={{ background: '#fffdf8', border: `1px solid ${resolvedG}30`, borderRadius: 8, padding: '12px 14px' }}>
                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer' }}>
                  <input type="checkbox" checked={aiPersonalise} onChange={e => setAiPersonalise(e.target.checked)} style={{ marginTop: 2, accentColor: resolvedG }} />
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
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>Personalisation</span><span style={{ color: aiPersonalise ? resolvedG : '#888' }}>{aiPersonalise ? 'AI assisted' : 'Template'}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#888' }}>From</span><span>{localStorage.getItem('emailFromAddress') || 'Not configured'}</span></div>
                </div>
              </div>

              {sending && (
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Sending {sendProgress} of {sendTotal}...</div>
                  <div style={{ height: 6, background: '#f3f0ea', borderRadius: 100 }}>
                    <div style={{ height: '100%', background: resolvedG, borderRadius: 100, width: `${sendTotal > 0 ? (sendProgress / sendTotal) * 100 : 0}%`, transition: 'width 0.3s' }} />
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
