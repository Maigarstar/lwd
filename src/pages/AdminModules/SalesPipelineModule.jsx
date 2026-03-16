/**
 * SalesPipelineModule.jsx
 * B2B sales pipeline for venue and vendor outreach.
 * Kanban pipeline, prospect CRM, email outreach, dashboard metrics.
 */
import { useState, useEffect, useCallback } from 'react';
import {
  fetchProspects, createProspect, updateProspect, moveStage, deleteProspect,
  logOutreachEmail, fetchOutreachHistory, fetchSalesStats, fetchFollowUpsDue,
} from '../../services/salesPipelineService';
import { sendEmail } from '../../services/emailSendService';

const GOLD      = '#8f7420';
const GOLD_DIM  = 'rgba(143,116,32,0.09)';
const GOLD_BDR  = 'rgba(143,116,32,0.30)';

// ── Pipeline stages ───────────────────────────────────────────────────────────
const STAGES = [
  { key:'prospect',        label:'Prospect',         color:'#6b7280', emoji:'○' },
  { key:'cold_email_sent', label:'Cold Email Sent',  color:'#8b5cf6', emoji:'✉' },
  { key:'follow_up_sent',  label:'Follow Up Sent',   color:'#f59e0b', emoji:'↩' },
  { key:'conversation',    label:'Conversation',     color:'#3b82f6', emoji:'◉' },
  { key:'meeting_booked',  label:'Meeting Booked',   color:'#06b6d4', emoji:'◈' },
  { key:'proposal_sent',   label:'Proposal Sent',    color:GOLD,      emoji:'◧' },
  { key:'negotiation',     label:'Negotiation',      color:'#f97316', emoji:'⊙' },
  { key:'closed_won',      label:'Closed Won',       color:'#10b981', emoji:'✓' },
  { key:'closed_lost',     label:'Closed Lost',      color:'#ef4444', emoji:'✕' },
];
const STAGE_MAP = Object.fromEntries(STAGES.map(s => [s.key, s]));

const VENUE_TYPES = ['Venue', 'Vendor', 'Planner', 'Photographer', 'Florist', 'Caterer', 'Entertainment', 'Transport', 'Other'];
const SOURCES     = ['Manual', 'Website', 'LinkedIn', 'Referral', 'Import', 'Google', 'Instagram', 'Event', 'Other'];

// Email templates per outreach type
const EMAIL_TEMPLATES = {
  cold: {
    subject: (p) => `Join Luxury Wedding Directory - ${p.company_name}`,
    body: (p) => `Hi ${p.contact_name || 'there'},\n\nI wanted to reach out personally to introduce Luxury Wedding Directory.\n\nWe connect elite wedding venues and vendors with high-intent couples planning luxury weddings across the UK and internationally.\n\nGiven the quality of ${p.company_name}, I believe there is a strong fit for a featured partnership.\n\nWould you be open to a short conversation to explore this?\n\nBest regards,\nLuxury Wedding Directory Team`,
  },
  follow_up_1: {
    subject: (p) => `Following up - Luxury Wedding Directory`,
    body: (p) => `Hi ${p.contact_name || 'there'},\n\nI wanted to follow up on my previous message about Luxury Wedding Directory.\n\nWe are seeing strong demand from couples looking for premium ${p.venue_type?.toLowerCase() || 'venues'} like ${p.company_name}.\n\nHappy to share more about what partnership looks like - would a 15-minute call work this week?\n\nBest regards,\nLuxury Wedding Directory Team`,
  },
  follow_up_2: {
    subject: (p) => `Last message from Luxury Wedding Directory`,
    body: (p) => `Hi ${p.contact_name || 'there'},\n\nI understand things get busy - this will be my last message for now.\n\nIf ${p.company_name} is ever interested in premium visibility to qualified wedding couples, we would love to work with you.\n\nFeel free to reach out at any time at hello@luxuryweddingdirectory.co.uk.\n\nBest regards,\nLuxury Wedding Directory Team`,
  },
  proposal: {
    subject: (p) => `Partnership Proposal - ${p.company_name} x Luxury Wedding Directory`,
    body: (p) => `Hi ${p.contact_name || 'there'},\n\nThank you for taking the time to speak with us. As discussed, please find below our partnership proposal for ${p.company_name}.\n\n[PROPOSAL DETAILS]\n\nPackage: ${p.package || 'Premium Listing'}\nInvestment: ${p.proposal_value ? `£${p.proposal_value.toLocaleString()}` : 'As discussed'}\n\nThis includes:\n- Featured profile on Luxury Wedding Directory\n- Priority placement in search results\n- Magazine editorial coverage\n- Lead generation from qualified enquiries\n\nWe would love to welcome ${p.company_name} to the platform. Please let me know if you have any questions.\n\nBest regards,\nLuxury Wedding Directory Team`,
  },
};

// ── Small shared UI ───────────────────────────────────────────────────────────
function StagePill({ stage, small }) {
  const s = STAGE_MAP[stage] || STAGES[0];
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:4,
      padding: small ? '2px 7px' : '3px 9px',
      background: s.color + '18',
      border: `1px solid ${s.color}50`,
      borderRadius:20,
      fontFamily:'var(--font-body)', fontSize: small ? 9 : 10,
      fontWeight:600, color: s.color, letterSpacing:'0.06em', whiteSpace:'nowrap',
    }}>
      {s.emoji} {s.label}
    </span>
  );
}

function TypeBadge({ type }) {
  return (
    <span style={{ padding:'2px 7px', background:'rgba(255,255,255,0.06)', borderRadius:20, fontFamily:'var(--font-body)', fontSize:9, color:'#999', border:'1px solid rgba(255,255,255,0.1)' }}>
      {type}
    </span>
  );
}

function Btn({ children, onClick, gold, danger, small, disabled, style = {} }) {
  const base = {
    padding: small ? '5px 12px' : '8px 18px',
    border:'none', borderRadius:3,
    fontFamily:'var(--font-body)', fontSize: small ? 10 : 11,
    fontWeight:700, letterSpacing:'0.06em', textTransform:'uppercase',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    transition:'all 0.15s',
    ...style,
  };
  if (gold)    return <button onClick={onClick} disabled={disabled} style={{ ...base, background:GOLD, color:'#000' }}>{children}</button>;
  if (danger)  return <button onClick={onClick} disabled={disabled} style={{ ...base, background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#f87171' }}>{children}</button>;
  return <button onClick={onClick} disabled={disabled} style={{ ...base, background:'transparent', border:`1px solid rgba(255,255,255,0.15)`, color:'#bbb' }}>{children}</button>;
}

function StatCard({ label, value, sub, color = GOLD }) {
  return (
    <div style={{ background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:6, padding:'18px 20px' }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-heading)', fontSize:32, fontWeight:700, color, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#666', marginTop:5 }}>{sub}</div>}
    </div>
  );
}

// ── Prospect Form Modal ───────────────────────────────────────────────────────
function ProspectModal({ prospect, onSave, onClose, C }) {
  const blank = { company_name:'', contact_name:'', email:'', phone:'', country:'', venue_type:'Venue', source:'Manual', pipeline_stage:'prospect', notes:'', proposal_value:'', package:'', next_follow_up_at:'' };
  const [form, setForm] = useState(prospect ? { ...blank, ...prospect } : blank);
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');
  const s = (k,v) => setForm(f => ({ ...f, [k]:v }));

  const handleSave = async () => {
    if (!form.company_name.trim()) { setError('Company name is required'); return; }
    setSaving(true); setError('');
    try {
      let saved;
      if (prospect?.id) {
        saved = await updateProspect(prospect.id, form);
      } else {
        saved = await createProspect(form);
      }
      onSave(saved);
    } catch (err) {
      setError(err.message || 'Failed to save prospect');
    } finally { setSaving(false); }
  };

  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, padding:'8px 11px', fontFamily:'var(--font-body)', fontSize:13, color:'#eee', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:5 };
  const selectStyle = { ...inputStyle, appearance:'none', cursor:'pointer' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#1a1a1a', border:`1px solid ${GOLD_BDR}`, borderRadius:6, width:620, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:18, color:'#fff', fontWeight:700 }}>
            {prospect?.id ? `Edit - ${prospect.company_name}` : 'Add New Prospect'}
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>

        <div style={{ padding:'22px 24px', overflowY:'auto', flex:1 }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>Company Name *</label>
              <input value={form.company_name} onChange={e=>s('company_name',e.target.value)} style={inputStyle} autoFocus />
            </div>
            <div>
              <label style={labelStyle}>Contact Name</label>
              <input value={form.contact_name} onChange={e=>s('contact_name',e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>Email</label>
              <input type="email" value={form.email} onChange={e=>s('email',e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Phone</label>
              <input value={form.phone} onChange={e=>s('phone',e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>Country</label>
              <input value={form.country} onChange={e=>s('country',e.target.value)} placeholder="UK, Italy..." style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={form.venue_type} onChange={e=>s('venue_type',e.target.value)} style={selectStyle}>
                {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Source</label>
              <select value={form.source} onChange={e=>s('source',e.target.value)} style={selectStyle}>
                {SOURCES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>Pipeline Stage</label>
              <select value={form.pipeline_stage} onChange={e=>s('pipeline_stage',e.target.value)} style={selectStyle}>
                {STAGES.map(st => <option key={st.key} value={st.key}>{st.label}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Next Follow Up</label>
              <input type="date" value={form.next_follow_up_at ? form.next_follow_up_at.substring(0,10) : ''} onChange={e=>s('next_follow_up_at', e.target.value ? new Date(e.target.value).toISOString() : '')} style={inputStyle} />
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>Proposal Value (£)</label>
              <input type="number" value={form.proposal_value||''} onChange={e=>s('proposal_value',e.target.value)} placeholder="0.00" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Package</label>
              <input value={form.package||''} onChange={e=>s('package',e.target.value)} placeholder="Premium, Standard..." style={inputStyle} />
            </div>
          </div>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Notes</label>
            <textarea value={form.notes||''} onChange={e=>s('notes',e.target.value)} rows={3} style={{ ...inputStyle, resize:'vertical' }} />
          </div>
          {error && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#f87171', marginBottom:12 }}>{error}</div>}
        </div>

        <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn gold onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : (prospect?.id ? 'Save Changes' : 'Add Prospect')}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Outreach Email Modal ──────────────────────────────────────────────────────
function OutreachModal({ prospect, emailType, fromEmail, fromName, onSent, onClose, C }) {
  const tpl = EMAIL_TEMPLATES[emailType] || EMAIL_TEMPLATES.cold;
  const [subject, setSubject] = useState(tpl.subject(prospect));
  const [body,    setBody]    = useState(tpl.body(prospect));
  const [sending, setSending] = useState(false);
  const [error,   setError]   = useState('');

  const typeLabels = { cold:'Cold Email', follow_up_1:'Follow Up 1', follow_up_2:'Follow Up 2', follow_up_3:'Final Follow Up', proposal:'Proposal Email', acknowledgement:'Acknowledgement', meeting_confirmation:'Meeting Confirmation' };

  const handleSend = async () => {
    if (!prospect.email) { setError('This prospect has no email address'); return; }
    if (!fromEmail) { setError('Set your from-email in Email Builder settings first'); return; }
    setSending(true); setError('');
    try {
      await sendEmail({
        subject,
        fromName: fromName || 'Luxury Wedding Directory',
        fromEmail,
        html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#333;line-height:1.7;max-width:560px;">${body.replace(/\n/g,'<br/>')}</div>`,
        recipients: [{ email: prospect.email, name: prospect.contact_name || prospect.company_name }],
        type: 'outreach',
      });
      await logOutreachEmail({ prospectId: prospect.id, emailType, subject, body });
      // Auto-advance stage if cold email is being sent
      const nextStage = emailType === 'cold' ? 'cold_email_sent' : emailType === 'proposal' ? 'proposal_sent' : emailType.startsWith('follow_up') ? 'follow_up_sent' : null;
      if (nextStage && prospect.pipeline_stage !== nextStage) {
        await moveStage(prospect.id, nextStage);
      }
      onSent(nextStage);
    } catch (err) {
      setError(err.message || 'Failed to send email');
    } finally { setSending(false); }
  };

  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, padding:'8px 11px', fontFamily:'var(--font-body)', fontSize:13, color:'#eee', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#1a1a1a', border:`1px solid ${GOLD_BDR}`, borderRadius:6, width:600, maxHeight:'88vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:17, color:'#fff', fontWeight:700 }}>{typeLabels[emailType] || 'Send Email'}</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#888', marginTop:2 }}>To: {prospect.contact_name || prospect.company_name} &lt;{prospect.email || 'no email set'}&gt;</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>

        <div style={{ padding:'18px 24px', overflowY:'auto', flex:1 }}>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Subject</label>
            <input value={subject} onChange={e=>setSubject(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ marginBottom:14 }}>
            <label style={labelStyle}>Message</label>
            <textarea value={body} onChange={e=>setBody(e.target.value)} rows={12} style={{ ...inputStyle, resize:'vertical', lineHeight:1.7 }} />
          </div>
          {error && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#f87171', marginBottom:10 }}>{error}</div>}
          {!fromEmail && (
            <div style={{ padding:'10px 14px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.25)', borderRadius:4, fontFamily:'var(--font-body)', fontSize:12, color:'#f59e0b' }}>
              No from-email set. Configure it in Email Builder to send.
            </div>
          )}
        </div>

        <div style={{ padding:'14px 24px', borderTop:'1px solid rgba(255,255,255,0.08)', display:'flex', gap:10, justifyContent:'flex-end', flexShrink:0 }}>
          <Btn onClick={onClose}>Cancel</Btn>
          <Btn gold onClick={handleSend} disabled={sending || !prospect.email}>{sending ? 'Sending...' : `Send ${typeLabels[emailType] || 'Email'}`}</Btn>
        </div>
      </div>
    </div>
  );
}

// ── Prospect detail side panel ────────────────────────────────────────────────
function ProspectPanel({ prospect, onEdit, onSendEmail, onMoveStage, onRefresh, onClose, C }) {
  const [history, setHistory]   = useState([]);
  const [showMove, setShowMove] = useState(false);

  useEffect(() => {
    if (prospect?.id) {
      fetchOutreachHistory(prospect.id).then(setHistory).catch(() => {});
    }
  }, [prospect?.id]);

  if (!prospect) return null;
  const stage = STAGE_MAP[prospect.pipeline_stage] || STAGES[0];

  const row = (label, value) => value ? (
    <div style={{ display:'flex', gap:8, padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
      <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#666', width:100, flexShrink:0 }}>{label}</span>
      <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#ddd', flex:1, wordBreak:'break-word' }}>{value}</span>
    </div>
  ) : null;

  return (
    <div style={{ width:320, flexShrink:0, borderLeft:'1px solid rgba(255,255,255,0.08)', background:'#151515', display:'flex', flexDirection:'column', overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
        <div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:700, color:'#eee' }}>{prospect.company_name}</div>
          {prospect.contact_name && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#888', marginTop:2 }}>{prospect.contact_name}</div>}
          <div style={{ marginTop:7 }}><StagePill stage={prospect.pipeline_stage} /></div>
        </div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:16, cursor:'pointer', lineHeight:1 }}>x</button>
      </div>

      {/* Actions */}
      <div style={{ padding:'10px 16px', borderBottom:'1px solid rgba(255,255,255,0.06)', display:'flex', flexWrap:'wrap', gap:6 }}>
        <button onClick={onEdit}
          style={{ padding:'5px 11px', background:'transparent', border:`1px solid ${GOLD_BDR}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:GOLD, cursor:'pointer' }}>
          Edit
        </button>
        <button onClick={() => onSendEmail('cold')}
          style={{ padding:'5px 11px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, color:'#bbb', cursor:'pointer' }}>
          Cold Email
        </button>
        <button onClick={() => onSendEmail('follow_up_1')}
          style={{ padding:'5px 11px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, color:'#bbb', cursor:'pointer' }}>
          Follow Up
        </button>
        <button onClick={() => onSendEmail('proposal')}
          style={{ padding:'5px 11px', background:'transparent', border:'1px solid rgba(255,255,255,0.12)', borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, color:'#bbb', cursor:'pointer' }}>
          Proposal
        </button>
        <div style={{ position:'relative', width:'100%' }}>
          <button onClick={() => setShowMove(m => !m)}
            style={{ width:'100%', padding:'5px 0', background:GOLD_DIM, border:`1px solid ${GOLD_BDR}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:GOLD, cursor:'pointer', textAlign:'center' }}>
            Move Stage
          </button>
          {showMove && (
            <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:100, background:'#1e1e1e', border:`1px solid ${GOLD_BDR}`, borderRadius:4, boxShadow:'0 8px 24px rgba(0,0,0,0.5)', marginTop:2 }}>
              {STAGES.map(st => (
                <button key={st.key} onClick={() => { onMoveStage(st.key); setShowMove(false); }}
                  style={{ width:'100%', padding:'8px 12px', background: st.key === prospect.pipeline_stage ? GOLD_DIM : 'transparent', border:'none', textAlign:'left', fontFamily:'var(--font-body)', fontSize:11, color: st.key === prospect.pipeline_stage ? GOLD : '#bbb', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)' }}
                  onMouseEnter={e => { if (st.key !== prospect.pipeline_stage) e.currentTarget.style.background='rgba(255,255,255,0.04)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = st.key === prospect.pipeline_stage ? GOLD_DIM : 'transparent'; }}>
                  {st.emoji} {st.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Details */}
      <div style={{ padding:'10px 16px', flex:1, overflowY:'auto' }}>
        {row('Email', prospect.email)}
        {row('Phone', prospect.phone)}
        {row('Country', prospect.country)}
        {row('Type', prospect.venue_type)}
        {row('Source', prospect.source)}
        {row('Package', prospect.package)}
        {prospect.proposal_value && row('Proposal', `£${Number(prospect.proposal_value).toLocaleString()}`)}
        {prospect.next_follow_up_at && row('Next Follow Up', new Date(prospect.next_follow_up_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' }))}
        {prospect.last_contacted_at && row('Last Contact', new Date(prospect.last_contacted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' }))}

        {prospect.notes && (
          <div style={{ marginTop:12, padding:'10px 12px', background:'rgba(255,255,255,0.03)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:4 }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'#666', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>Notes</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#aaa', lineHeight:1.6 }}>{prospect.notes}</div>
          </div>
        )}

        {/* Activity log */}
        {history.length > 0 && (
          <div style={{ marginTop:14 }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'#666', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Email History</div>
            {history.map(h => (
              <div key={h.id} style={{ padding:'8px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
                <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:2 }}>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#bbb', fontWeight:600 }}>{h.email_type?.replace(/_/g,' ')}</span>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#555' }}>{new Date(h.sent_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })}</span>
                </div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#666', whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{h.subject}</div>
                {h.status === 'replied' && <span style={{ fontFamily:'var(--font-body)', fontSize:9, color:'#10b981', fontWeight:600 }}>REPLIED</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Kanban board ──────────────────────────────────────────────────────────────
function KanbanBoard({ prospects, onCardClick, onMoveCard, onSendEmail }) {
  const grouped = {};
  STAGES.forEach(s => { grouped[s.key] = []; });
  prospects.forEach(p => {
    const k = p.pipeline_stage;
    if (grouped[k]) grouped[k].push(p);
    else grouped['prospect'].push(p);
  });

  return (
    <div style={{ flex:1, overflowX:'auto', overflowY:'hidden', display:'flex', gap:0, padding:'16px 20px', minHeight:0 }}>
      {STAGES.map(stage => (
        <div key={stage.key} style={{ flexShrink:0, width:220, marginRight:12, display:'flex', flexDirection:'column' }}>
          {/* Column header */}
          <div style={{ padding:'8px 12px', background:'rgba(255,255,255,0.04)', borderRadius:'4px 4px 0 0', border:'1px solid rgba(255,255,255,0.07)', borderBottom:'none', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ display:'flex', alignItems:'center', gap:7 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:stage.color, flexShrink:0 }} />
              <span style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#bbb', letterSpacing:'0.06em', textTransform:'uppercase' }}>{stage.label}</span>
            </div>
            <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#555', background:'rgba(255,255,255,0.08)', padding:'1px 6px', borderRadius:10 }}>{grouped[stage.key].length}</span>
          </div>
          {/* Cards */}
          <div style={{ flex:1, overflowY:'auto', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderTop:'none', borderRadius:'0 0 4px 4px', padding:'6px', minHeight:80 }}>
            {grouped[stage.key].map(p => (
              <ProspectCard key={p.id} prospect={p} stageColor={stage.color}
                onClick={() => onCardClick(p)}
                onSendEmail={(type) => onSendEmail(p, type)}
                onMoveStage={(st) => onMoveCard(p.id, st)}
              />
            ))}
            {grouped[stage.key].length === 0 && (
              <div style={{ padding:'18px 8px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:10, color:'#444' }}>Empty</div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function ProspectCard({ prospect, stageColor, onClick, onSendEmail, onMoveStage }) {
  const [hovered, setHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const lastContact = prospect.last_contacted_at
    ? new Date(prospect.last_contacted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short' })
    : null;
  const isOverdue = prospect.next_follow_up_at && new Date(prospect.next_follow_up_at) < new Date();

  return (
    <div
      style={{ background: hovered ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.03)', border:`1px solid ${hovered ? 'rgba(255,255,255,0.14)' : 'rgba(255,255,255,0.07)'}`, borderLeft:`3px solid ${stageColor}`, borderRadius:4, padding:'9px 10px', marginBottom:6, cursor:'pointer', position:'relative', transition:'all 0.12s' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setShowMenu(false); }}
      onClick={onClick}>

      <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, color:'#eee', marginBottom:3, lineHeight:1.2 }}>{prospect.company_name}</div>
      {prospect.contact_name && <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#888', marginBottom:5 }}>{prospect.contact_name}</div>}

      <div style={{ display:'flex', alignItems:'center', gap:5, flexWrap:'wrap' }}>
        <TypeBadge type={prospect.venue_type || 'Venue'} />
        {prospect.country && <span style={{ fontFamily:'var(--font-body)', fontSize:9, color:'#666' }}>{prospect.country}</span>}
      </div>

      {(lastContact || isOverdue) && (
        <div style={{ marginTop:5, display:'flex', alignItems:'center', gap:8 }}>
          {lastContact && <span style={{ fontFamily:'var(--font-body)', fontSize:9, color:'#555' }}>Last: {lastContact}</span>}
          {isOverdue && <span style={{ fontFamily:'var(--font-body)', fontSize:9, color:'#f59e0b', fontWeight:700 }}>Follow up due</span>}
        </div>
      )}

      {/* Quick actions on hover */}
      {hovered && (
        <div style={{ position:'absolute', top:6, right:6, display:'flex', gap:3 }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => onSendEmail('cold')} title="Send email"
            style={{ width:20, height:20, background:GOLD, border:'none', borderRadius:2, fontSize:9, color:'#000', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>✉</button>
          <div style={{ position:'relative' }}>
            <button onClick={() => setShowMenu(m => !m)} title="Move stage"
              style={{ width:20, height:20, background:'rgba(255,255,255,0.12)', border:'none', borderRadius:2, fontSize:9, color:'#bbb', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>→</button>
            {showMenu && (
              <div style={{ position:'absolute', top:'100%', right:0, zIndex:200, background:'#1e1e1e', border:`1px solid ${GOLD_BDR}`, borderRadius:4, boxShadow:'0 8px 24px rgba(0,0,0,0.6)', marginTop:2, width:160 }}>
                {STAGES.map(st => (
                  <button key={st.key} onClick={() => { onMoveStage(st.key); setShowMenu(false); }}
                    style={{ width:'100%', padding:'7px 10px', background:'transparent', border:'none', borderBottom:'1px solid rgba(255,255,255,0.04)', textAlign:'left', fontFamily:'var(--font-body)', fontSize:10, color: st.key === prospect.pipeline_stage ? GOLD : '#bbb', cursor:'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                    {st.emoji} {st.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── List view ─────────────────────────────────────────────────────────────────
function ListView({ prospects, onEdit, onSelect, onSendEmail }) {
  const [sortKey, setSortKey] = useState('updated_at');
  const [sortDir, setSortDir] = useState('desc');

  const sorted = [...prospects].sort((a, b) => {
    const va = a[sortKey] || '';
    const vb = b[sortKey] || '';
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
  });

  const SortTh = ({ k, label }) => (
    <th onClick={() => { if (sortKey === k) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortKey(k); setSortDir('asc'); } }}
      style={{ padding:'8px 12px', fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color: sortKey === k ? GOLD : '#666', letterSpacing:'0.1em', textTransform:'uppercase', cursor:'pointer', whiteSpace:'nowrap', background:'rgba(255,255,255,0.03)', textAlign:'left' }}>
      {label} {sortKey === k ? (sortDir === 'asc' ? '↑' : '↓') : ''}
    </th>
  );

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'16px 20px' }}>
      <table style={{ width:'100%', borderCollapse:'collapse' }}>
        <thead>
          <tr style={{ borderBottom:'1px solid rgba(255,255,255,0.08)' }}>
            <SortTh k="company_name" label="Company" />
            <SortTh k="contact_name" label="Contact" />
            <SortTh k="venue_type"   label="Type" />
            <SortTh k="pipeline_stage" label="Stage" />
            <SortTh k="last_contacted_at" label="Last Contact" />
            <SortTh k="next_follow_up_at" label="Follow Up" />
            <th style={{ padding:'8px 12px', background:'rgba(255,255,255,0.03)', fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'#666', letterSpacing:'0.1em', textTransform:'uppercase' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(p => {
            const isOverdue = p.next_follow_up_at && new Date(p.next_follow_up_at) < new Date();
            const stage = STAGE_MAP[p.pipeline_stage];
            return (
              <tr key={p.id} style={{ borderBottom:'1px solid rgba(255,255,255,0.04)', cursor:'pointer' }}
                onClick={() => onSelect(p)}
                onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,0.03)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <td style={{ padding:'10px 12px' }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'#eee' }}>{p.company_name}</div>
                  {p.country && <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#666' }}>{p.country}</div>}
                </td>
                <td style={{ padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:12, color:'#aaa' }}>{p.contact_name}</td>
                <td style={{ padding:'10px 12px' }}><TypeBadge type={p.venue_type || '-'} /></td>
                <td style={{ padding:'10px 12px' }}><StagePill stage={p.pipeline_stage} small /></td>
                <td style={{ padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:11, color:'#666' }}>
                  {p.last_contacted_at ? new Date(p.last_contacted_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '-'}
                </td>
                <td style={{ padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:11, color: isOverdue ? '#f59e0b' : '#666', fontWeight: isOverdue ? 700 : 400 }}>
                  {p.next_follow_up_at ? new Date(p.next_follow_up_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'}) : '-'}
                  {isOverdue && ' !'}
                </td>
                <td style={{ padding:'10px 12px' }} onClick={e => e.stopPropagation()}>
                  <div style={{ display:'flex', gap:5 }}>
                    <button onClick={() => onEdit(p)} style={{ padding:'3px 9px', background:'transparent', border:`1px solid ${GOLD_BDR}`, borderRadius:2, fontFamily:'var(--font-body)', fontSize:9, color:GOLD, cursor:'pointer' }}>Edit</button>
                    <button onClick={() => onSendEmail(p,'cold')} style={{ padding:'3px 9px', background:'transparent', border:'1px solid rgba(255,255,255,0.1)', borderRadius:2, fontFamily:'var(--font-body)', fontSize:9, color:'#bbb', cursor:'pointer' }}>Email</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div style={{ padding:'48px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:13, color:'#555' }}>No prospects found</div>
      )}
    </div>
  );
}

// ── Dashboard view ────────────────────────────────────────────────────────────
function DashboardView({ stats, prospects }) {
  if (!stats) return <div style={{ padding:40, textAlign:'center', fontFamily:'var(--font-body)', color:'#555' }}>Loading stats...</div>;

  const totalActive = prospects.filter(p => !['closed_won','closed_lost'].includes(p.pipeline_stage)).length;

  return (
    <div style={{ flex:1, overflowY:'auto', padding:'20px' }}>
      {/* KPI grid */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
        <StatCard label="Total Prospects" value={stats.totalProspects} sub={`${stats.activeProspects} active`} />
        <StatCard label="Emails This Month" value={stats.emailsThisMonth} />
        <StatCard label="Reply Rate" value={`${stats.replyRate}%`} sub="of all emails sent" color="#3b82f6" />
        <StatCard label="Meetings Booked" value={stats.meetingsBooked} color="#06b6d4" />
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:28 }}>
        <StatCard label="Proposals Sent" value={stats.proposalsSent} color={GOLD} />
        <StatCard label="Closed Won" value={stats.closedWon} color="#10b981" />
        <StatCard label="Close Rate" value={`${stats.closeRate}%`} sub="won vs lost" color="#10b981" />
        <StatCard label="In Pipeline" value={totalActive} sub="active prospects" color="#f59e0b" />
      </div>

      {/* Stage distribution */}
      <div style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:6, padding:'18px 20px', marginBottom:20 }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Pipeline Distribution</div>
        {STAGES.map(st => {
          const count = stats.stageCounts?.[st.key] || 0;
          const pct = stats.totalProspects > 0 ? (count / stats.totalProspects * 100) : 0;
          return (
            <div key={st.key} style={{ marginBottom:10 }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:3 }}>
                <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#aaa' }}>{st.emoji} {st.label}</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#666' }}>{count}</span>
              </div>
              <div style={{ height:5, background:'rgba(255,255,255,0.05)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${pct}%`, background:st.color, borderRadius:3, transition:'width 0.4s' }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Follow-ups due */}
      {prospects.filter(p => p.next_follow_up_at && new Date(p.next_follow_up_at) < new Date()).length > 0 && (
        <div style={{ background:'rgba(245,158,11,0.06)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:6, padding:'14px 16px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#f59e0b', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>
            Follow-ups Overdue ({prospects.filter(p => p.next_follow_up_at && new Date(p.next_follow_up_at) < new Date()).length})
          </div>
          {prospects.filter(p => p.next_follow_up_at && new Date(p.next_follow_up_at) < new Date()).slice(0,5).map(p => (
            <div key={p.id} style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'6px 0', borderBottom:'1px solid rgba(255,255,255,0.04)' }}>
              <div>
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#ddd', fontWeight:600 }}>{p.company_name}</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#888', marginLeft:8 }}>{p.contact_name}</span>
              </div>
              <StagePill stage={p.pipeline_stage} small />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────
export default function SalesPipelineModule({ C }) {
  const [view,            setView]            = useState('kanban');
  const [prospects,       setProspects]       = useState([]);
  const [stats,           setStats]           = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [search,          setSearch]          = useState('');
  const [stageFilter,     setStageFilter]     = useState('all');

  // Modals + panels
  const [editingProspect, setEditingProspect] = useState(null);
  const [activeProspect,  setActiveProspect]  = useState(null);
  const [outreach,        setOutreach]        = useState(null); // { prospect, type }

  // From email (read from localStorage - same as EmailBuilder)
  const fromEmail = typeof localStorage !== 'undefined' ? localStorage.getItem('ldw_email_from_email') || '' : '';
  const fromName  = typeof localStorage !== 'undefined' ? localStorage.getItem('ldw_email_from_name')  || 'Luxury Wedding Directory' : 'Luxury Wedding Directory';

  // ── Load data ──────────────────────────────────────────────────────────────
  const loadProspects = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProspects({});
      setProspects(data);
    } catch (err) {
      console.error('Sales: load failed', err);
    } finally { setLoading(false); }
  }, []);

  const loadStats = useCallback(async () => {
    try {
      const s = await fetchSalesStats();
      setStats(s);
    } catch { /* stats non-critical */ }
  }, []);

  useEffect(() => {
    loadProspects();
    loadStats();
  }, []);

  // ── Filtered prospects ─────────────────────────────────────────────────────
  const filtered = prospects.filter(p => {
    const matchStage = stageFilter === 'all' || p.pipeline_stage === stageFilter;
    const q = search.toLowerCase();
    const matchSearch = !q || (p.company_name?.toLowerCase().includes(q) || p.contact_name?.toLowerCase().includes(q) || p.email?.toLowerCase().includes(q));
    return matchStage && matchSearch;
  });

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleProspectSaved = (saved) => {
    setProspects(prev => {
      const idx = prev.findIndex(p => p.id === saved.id);
      if (idx >= 0) { const n = [...prev]; n[idx] = saved; return n; }
      return [saved, ...prev];
    });
    if (activeProspect?.id === saved.id) setActiveProspect(saved);
    setEditingProspect(null);
    loadStats();
  };

  const handleMoveStage = async (prospectId, newStage) => {
    try {
      const updated = await moveStage(prospectId, newStage);
      setProspects(prev => prev.map(p => p.id === prospectId ? { ...p, ...updated } : p));
      if (activeProspect?.id === prospectId) setActiveProspect(a => ({ ...a, ...updated }));
      loadStats();
    } catch (err) { console.error(err); }
  };

  const handleOutreachSent = (newStage) => {
    if (outreach?.prospect && newStage) {
      setProspects(prev => prev.map(p => p.id === outreach.prospect.id ? { ...p, pipeline_stage: newStage, last_contacted_at: new Date().toISOString() } : p));
      if (activeProspect?.id === outreach.prospect.id) setActiveProspect(a => ({ ...a, pipeline_stage: newStage }));
    }
    setOutreach(null);
    loadStats();
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this prospect permanently?')) return;
    try {
      await deleteProspect(id);
      setProspects(prev => prev.filter(p => p.id !== id));
      if (activeProspect?.id === id) setActiveProspect(null);
      loadStats();
    } catch (err) { console.error(err); }
  };

  const topBarStyle = { height:48, flexShrink:0, background: C?.card || '#1a1a1a', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', padding:'0 20px', gap:12 };
  const btnStyle = (active) => ({ padding:'5px 14px', background: active ? GOLD_DIM : 'transparent', border:`1px solid ${active ? GOLD : 'rgba(255,255,255,0.12)'}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight: active ? 700 : 400, color: active ? GOLD : '#aaa', cursor:'pointer' });

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, background: C?.bg || '#111' }}>

      {/* Modals */}
      {editingProspect !== null && (
        <ProspectModal
          prospect={editingProspect?.id ? editingProspect : null}
          onSave={handleProspectSaved}
          onClose={() => setEditingProspect(null)}
          C={C}
        />
      )}

      {outreach && (
        <OutreachModal
          prospect={outreach.prospect}
          emailType={outreach.type}
          fromEmail={fromEmail}
          fromName={fromName}
          onSent={handleOutreachSent}
          onClose={() => setOutreach(null)}
          C={C}
        />
      )}

      {/* Top bar */}
      <div style={topBarStyle}>
        <div style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700, color:'#fff', flexShrink:0 }}>Sales Pipeline</div>

        {/* View toggle */}
        <div style={{ display:'flex', background:'rgba(255,255,255,0.05)', borderRadius:3, border:'1px solid rgba(255,255,255,0.1)', overflow:'hidden', flexShrink:0 }}>
          {[{k:'kanban',l:'Kanban'},{k:'list',l:'List'},{k:'dashboard',l:'Dashboard'}].map(v => (
            <button key={v.k} onClick={() => setView(v.k)}
              style={{ padding:'4px 12px', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, background: view===v.k ? GOLD_DIM : 'transparent', color: view===v.k ? GOLD : '#888', border:'none', borderRight: v.k!=='dashboard' ? '1px solid rgba(255,255,255,0.08)' : 'none', cursor:'pointer' }}>
              {v.l}
            </button>
          ))}
        </div>

        {/* Search */}
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prospects..."
          style={{ flex:1, background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, padding:'5px 11px', fontFamily:'var(--font-body)', fontSize:12, color:'#ddd', outline:'none', minWidth:0 }}
        />

        {/* Stage filter */}
        <select value={stageFilter} onChange={e => setStageFilter(e.target.value)}
          style={{ padding:'5px 10px', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.1)', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:'#aaa', outline:'none', appearance:'none', cursor:'pointer' }}>
          <option value="all">All Stages</option>
          {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>

        {/* Follow-ups due badge */}
        {prospects.filter(p => p.next_follow_up_at && new Date(p.next_follow_up_at) < new Date()).length > 0 && (
          <div style={{ padding:'4px 10px', background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#f59e0b', flexShrink:0 }}>
            {prospects.filter(p => p.next_follow_up_at && new Date(p.next_follow_up_at) < new Date()).length} follow-ups due
          </div>
        )}

        <div style={{ marginLeft:'auto', display:'flex', gap:8 }}>
          <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#555', lineHeight:'28px', flexShrink:0 }}>{filtered.length} prospects</span>
          <button onClick={() => setEditingProspect({})}
            style={{ padding:'6px 16px', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', cursor:'pointer', letterSpacing:'0.06em', flexShrink:0 }}>
            + Add Prospect
          </button>
        </div>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontSize:13, color:'#555' }}>Loading pipeline...</div>
      ) : (
        <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>

          {/* Main content area */}
          <div style={{ flex:1, display:'flex', flexDirection:'column', minHeight:0, overflow:'hidden' }}>
            {view === 'kanban' && (
              <KanbanBoard
                prospects={filtered}
                onCardClick={setActiveProspect}
                onMoveCard={handleMoveStage}
                onSendEmail={(p, type) => setOutreach({ prospect: p, type })}
              />
            )}
            {view === 'list' && (
              <ListView
                prospects={filtered}
                onEdit={setEditingProspect}
                onSelect={setActiveProspect}
                onSendEmail={(p, type) => setOutreach({ prospect: p, type })}
              />
            )}
            {view === 'dashboard' && (
              <DashboardView stats={stats} prospects={prospects} />
            )}
          </div>

          {/* Prospect detail side panel */}
          {activeProspect && (
            <ProspectPanel
              prospect={activeProspect}
              onEdit={() => setEditingProspect(activeProspect)}
              onSendEmail={(type) => setOutreach({ prospect: activeProspect, type })}
              onMoveStage={(stage) => handleMoveStage(activeProspect.id, stage)}
              onRefresh={loadProspects}
              onClose={() => setActiveProspect(null)}
              C={C}
            />
          )}
        </div>
      )}
    </div>
  );
}
