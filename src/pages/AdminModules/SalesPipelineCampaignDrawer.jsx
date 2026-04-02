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
  const [filters, setFilters] = useState({ pipeline_id: '', stage_ids: [], venue_types: [], min_score: 0, statuses: ['active'], country: '', keywords: [] });
  const [keywordInput, setKeywordInput] = useState('');
  const [sequenceSteps, setSequenceSteps] = useState([{ step: 1, delay_days: 0, label: 'Step 1', subject: '', body: '' }]);
  const [aiPersonalise, setAiPersonalise] = useState(false);
  const [stopOnReply, setStopOnReply] = useState(true);
  const [maxPerSend, setMaxPerSend] = useState('');
  const [saving, setSaving] = useState(false);

  const VENUE_TYPES_OPTS = ['Venue', 'Vendor', 'Planner', 'Photographer', 'Florist', 'Caterer'];
  const STATUS_OPTS      = ['active', 'converted', 'lost', 'paused'];

  const audience = filterProspectsForCampaign(prospects, {
    pipeline_id:  filters.pipeline_id  || undefined,
    stage_ids:    filters.stage_ids.length   ? filters.stage_ids   : undefined,
    venue_types:  filters.venue_types.length ? filters.venue_types : undefined,
    min_score:    filters.min_score > 0 ? filters.min_score : undefined,
    statuses:     filters.statuses.length ? filters.statuses : ['active'],
    country:      filters.country || undefined,
    keywords:     filters.keywords.length ? filters.keywords : undefined,
  });

  function toggleArr(arr, val) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  async function handleSave() {
    if (saving || !sequenceSteps[0]?.subject || !sequenceSteps[0]?.body) return;
    setSaving(true);
    try {
      await createCampaign({
        name:     campaignName || `Campaign ${new Date().toLocaleDateString('en-GB')}`,
        filters: {
          pipeline_id:  filters.pipeline_id  || undefined,
          stage_ids:    filters.stage_ids.length   ? filters.stage_ids   : undefined,
          venue_types:  filters.venue_types.length ? filters.venue_types : undefined,
          min_score:    filters.min_score > 0 ? filters.min_score : undefined,
          statuses:     filters.statuses.length ? filters.statuses : ['active'],
          country:      filters.country || undefined,
          keywords:     filters.keywords.length ? filters.keywords : undefined,
        },
        subject:          sequenceSteps[0].subject,
        body:             sequenceSteps[0].body,
        sequence_steps:   sequenceSteps.map((s, i) => ({ ...s, step: i + 1, label: s.label || `Step ${i + 1}` })),
        settings: {
          ai_personalisation: aiPersonalise,
          stop_on_reply:      stopOnReply,
          max_per_send:       maxPerSend ? Number(maxPerSend) : null,
        },
        personalisation_mode: aiPersonalise ? 'ai_assisted' : 'template',
        total_recipients:     audience.length,
      });
      onSaved();
    } catch (e) {
      console.error('Campaign save failed:', e);
    } finally {
      setSaving(false);
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
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 6, marginBottom: 18 }}>
                {STATUS_OPTS.map(st => {
                  const active = filters.statuses.includes(st);
                  return (
                    <button key={st} type="button" onClick={() => setFilters(f => ({ ...f, statuses: toggleArr(f.statuses, st) }))} style={{ padding: '4px 12px', borderRadius: 100, fontSize: 11, border: `1px solid ${active ? resolvedG : '#ddd'}`, background: active ? resolvedG + '22' : 'transparent', color: active ? resolvedG : '#666', cursor: 'pointer', textTransform: 'capitalize' }}>{st}</button>
                  );
                })}
              </div>

              <div style={S.formLabel}>Country <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></div>
              <input
                style={{ ...S.formInput, width: '100%', boxSizing: 'border-box', marginTop: 4, marginBottom: 18 }}
                value={filters.country}
                onChange={e => setFilters(f => ({ ...f, country: e.target.value }))}
                placeholder="e.g. France, United Kingdom, Italy"
              />

              <div style={S.formLabel}>Keywords <span style={{ color: '#aaa', fontWeight: 400 }}>(optional)</span></div>
              <div style={{ display: 'flex', gap: 6, marginTop: 4, marginBottom: filters.keywords.length ? 8 : 0 }}>
                <input
                  style={{ ...S.formInput, flex: 1 }}
                  value={keywordInput}
                  onChange={e => setKeywordInput(e.target.value)}
                  onKeyDown={e => {
                    if ((e.key === 'Enter' || e.key === ',') && keywordInput.trim()) {
                      e.preventDefault();
                      setFilters(f => ({ ...f, keywords: [...f.keywords, keywordInput.trim()] }));
                      setKeywordInput('');
                    }
                  }}
                  placeholder="Type keyword then press Enter"
                />
              </div>
              {filters.keywords.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {filters.keywords.map(kw => (
                    <span key={kw} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px 3px 10px', borderRadius: 100, fontSize: 11, background: resolvedG + '15', color: resolvedG, border: `1px solid ${resolvedG}30`, cursor: 'pointer' }} onClick={() => setFilters(f => ({ ...f, keywords: f.keywords.filter(k => k !== kw) }))}>
                      {kw} <span style={{ fontSize: 13, lineHeight: 1 }}>&#215;</span>
                    </span>
                  ))}
                </div>
              )}
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
              {/* Sequence steps */}
              <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 10, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Email Sequence</div>

              {sequenceSteps.map((stepItem, idx) => (
                <div key={idx} style={{ background: '#f9f9f7', border: '1px solid #ede8de', borderRadius: 8, padding: '12px 14px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <div style={{ width: 24, height: 24, borderRadius: '50%', background: resolvedG, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 }}>{idx + 1}</div>
                    <input
                      style={{ ...S.formInput, flex: 1, fontSize: 12, fontWeight: 600, padding: '4px 8px' }}
                      value={stepItem.label || `Step ${idx + 1}`}
                      onChange={e => setSequenceSteps(ss => ss.map((s, i) => i === idx ? { ...s, label: e.target.value } : s))}
                      placeholder={`Step ${idx + 1} label`}
                    />
                    {idx > 0 && (
                      <button type="button" onClick={() => setSequenceSteps(ss => ss.filter((_, i) => i !== idx))} style={{ background: 'none', border: 'none', color: '#bbb', cursor: 'pointer', fontSize: 18, padding: 0, lineHeight: 1 }}>&#215;</button>
                    )}
                  </div>

                  {idx > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                      <div style={{ fontSize: 11, color: '#888', flexShrink: 0 }}>Send after</div>
                      <input
                        type="number" min={1} max={60}
                        style={{ ...S.formInput, width: 60, textAlign: 'center', padding: '4px 6px', fontSize: 13 }}
                        value={stepItem.delay_days}
                        onChange={e => setSequenceSteps(ss => ss.map((s, i) => i === idx ? { ...s, delay_days: Number(e.target.value) } : s))}
                      />
                      <div style={{ fontSize: 11, color: '#888' }}>days from previous step</div>
                    </div>
                  )}

                  <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Subject</div>
                  <input
                    style={{ ...S.formInput, width: '100%', boxSizing: 'border-box', marginBottom: 10 }}
                    value={stepItem.subject}
                    onChange={e => setSequenceSteps(ss => ss.map((s, i) => i === idx ? { ...s, subject: e.target.value } : s))}
                    placeholder="Subject line"
                  />

                  <div style={{ fontSize: 11, color: '#888', marginBottom: 3 }}>Body</div>
                  <textarea
                    style={{ ...S.formTextarea, width: '100%', boxSizing: 'border-box', minHeight: idx === 0 ? 160 : 120 }}
                    value={stepItem.body}
                    onChange={e => setSequenceSteps(ss => ss.map((s, i) => i === idx ? { ...s, body: e.target.value } : s))}
                    placeholder={`Email body for Step ${idx + 1}. Use {{company_name}}, {{contact_name}}.`}
                  />
                </div>
              ))}

              {sequenceSteps.length < 5 && (
                <button type="button" style={{ ...S.outlineBtn, width: '100%', marginBottom: 16, fontSize: 12 }} onClick={() => setSequenceSteps(ss => [...ss, { step: ss.length + 1, delay_days: 4, label: `Step ${ss.length + 1}`, subject: '', body: '' }])}>
                  + Add follow-up step
                </button>
              )}

              {/* Settings */}
              <div style={{ borderTop: '1px solid #ede8de', paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Settings</div>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={aiPersonalise} onChange={e => setAiPersonalise(e.target.checked)} style={{ marginTop: 2, accentColor: resolvedG }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>AI Personalise Step 1</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>AI rewrites Step 1 per prospect. Adds ~3s per recipient.</div>
                  </div>
                </label>

                <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 12, cursor: 'pointer' }}>
                  <input type="checkbox" checked={stopOnReply} onChange={e => setStopOnReply(e.target.checked)} style={{ marginTop: 2, accentColor: resolvedG }} />
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>Stop on reply</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Skip prospects who replied to any previous step.</div>
                  </div>
                </label>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: '#333' }}>Max per step send</div>
                    <div style={{ fontSize: 11, color: '#aaa', marginTop: 1 }}>Limit emails per step (leave blank for no limit).</div>
                  </div>
                  <input
                    type="number" min={1} max={500}
                    style={{ ...S.formInput, width: 72, textAlign: 'center' }}
                    value={maxPerSend}
                    onChange={e => setMaxPerSend(e.target.value)}
                    placeholder="--"
                  />
                </div>
              </div>

              <div style={{ padding: '9px 12px', background: '#f8f8f8', borderRadius: 6, fontSize: 11, color: '#aaa' }}>
                An unsubscribe footer is automatically appended to every email.
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <div style={{ background: '#f9f9f7', border: '1px solid #ede8de', borderRadius: 8, padding: '16px 18px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: '#555', marginBottom: 12, letterSpacing: '0.04em', textTransform: 'uppercase' }}>Campaign Summary</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9, fontSize: 13 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Name</span>
                    <span style={{ fontWeight: 600 }}>{campaignName || 'Untitled'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Audience</span>
                    <span style={{ fontWeight: 600, color: audience.length > 0 ? '#166534' : '#dc2626' }}>{audience.length} prospect{audience.length !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Steps</span>
                    <span>{sequenceSteps.length} email{sequenceSteps.length !== 1 ? 's' : ''} in sequence</span>
                  </div>
                  {filters.country && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Country</span>
                      <span>{filters.country}</span>
                    </div>
                  )}
                  {filters.keywords?.length > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                      <span style={{ color: '#888', flexShrink: 0 }}>Keywords</span>
                      <span style={{ textAlign: 'right', color: '#555' }}>{filters.keywords.join(', ')}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>AI Personalise</span>
                    <span style={{ color: aiPersonalise ? resolvedG : '#888' }}>{aiPersonalise ? 'Step 1 only' : 'Off'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>Stop on reply</span>
                    <span>{stopOnReply ? 'Yes' : 'No'}</span>
                  </div>
                  {maxPerSend && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#888' }}>Max per send</span>
                      <span>{maxPerSend}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#888' }}>From</span>
                    <span style={{ fontSize: 12 }}>{localStorage.getItem('emailFromAddress') || 'Not configured'}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '10px 13px', background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 6, fontSize: 12, color: '#1d4ed8', marginBottom: 16, lineHeight: 1.6 }}>
                Campaign will be saved as <strong>draft</strong>. Go to the Campaigns tab and click <strong>Launch Step 1</strong> when you're ready to send.
              </div>

              <button
                style={{ ...S.goldBtn, width: '100%', padding: '13px 0', fontSize: 13, opacity: (saving || !sequenceSteps[0]?.subject || !sequenceSteps[0]?.body) ? 0.5 : 1 }}
                onClick={handleSave}
                disabled={saving || !sequenceSteps[0]?.subject || !sequenceSteps[0]?.body}
              >
                {saving ? 'Saving...' : 'Save Campaign as Draft'}
              </button>
            </div>
          )}
        </div>

        {/* Footer nav */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid #f0ece4', display: 'flex', justifyContent: 'space-between' }}>
          <button style={S.outlineBtn} onClick={step === 1 ? onClose : () => setStep(s => s - 1)}>{step === 1 ? 'Cancel' : 'Back'}</button>
          {step < 4
            ? <button style={S.goldBtn} onClick={() => setStep(s => s + 1)} disabled={step === 3 && (!sequenceSteps[0]?.subject || !sequenceSteps[0]?.body)}>Next</button>
            : null
          }
        </div>
      </div>
    </div>
  );
}
