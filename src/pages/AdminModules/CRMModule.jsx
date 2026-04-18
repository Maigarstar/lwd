// ═══════════════════════════════════════════════════════════════════════════
// CRMModule — Business engine for Luxury Wedding Directory
// Tabs: Dashboard | Contacts | Pipeline | Tasks | Activity
// Features: Lead scoring, deal values, bulk actions, CSV export, tasks
// Dark/Light: uses C.white for text (not C.black which is the BG color)
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { convertLeadToManagedAccount, fetchManagedAccountByLeadId } from '../../services/socialStudioService';
import { callLeadsEdge } from '../../services/leadEngineService';
import {
  LEAD_STATUSES, STATUS_MAP, VALID_STATUS_KEYS,
  statusColor, statusBg, statusLabel,
  calcLeadScore, scoreColor,
  LEAD_PRIORITIES, LEAD_TYPES, SOURCE_LABELS,
} from '../../constants/leadStatuses';

const GOLD     = '#c9a84c';
const GOLD_DIM = 'rgba(201,168,76,0.1)';

// Build STATUS_CONFIG from shared constants for backward compat within this file
const STATUS_CONFIG = Object.fromEntries(
  LEAD_STATUSES.map(s => [s.key, { label: s.label, color: s.color, bg: s.bg, order: s.order }])
);

// ── Currency formatter ─────────────────────────────────────────────────────
function fmtGBP(v) {
  const n = parseFloat(v);
  if (!v || isNaN(n)) return null;
  return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', maximumFractionDigits: 0 }).format(n);
}

// ── CSV export ─────────────────────────────────────────────────────────────
function exportCSV(leads) {
  const headers = ['Name','Email','Phone','Source','Type','Status','Score','Business','Interests','Deal Value','Created'];
  const rows = leads.map(l => {
    const req = l.requirements_json || {};
    return [
      `${l.first_name||''} ${l.last_name||''}`.trim(),
      l.email||'', l.phone||'',
      SOURCE_LABELS[l.lead_source] || l.lead_source || '',
      l.lead_type||'', l.status||'new', calcLeadScore(l),
      req.businessName||'', (req.interests||[]).join('; '),
      req.dealValue||'',
      new Date(l.created_at).toLocaleDateString('en-GB'),
    ];
  });
  const csv = [headers,...rows].map(r => r.map(v=>`"${String(v).replace(/"/g,'""')}"`).join(',')).join('\n');
  const url = URL.createObjectURL(new Blob([csv],{type:'text/csv'}));
  const a = document.createElement('a');
  a.href=url; a.download=`crm-${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Task helpers ───────────────────────────────────────────────────────────
function parseTask(msg) {
  try {
    const obj = JSON.parse(msg.body);
    return { ...msg, text: obj.text||msg.body, dueDate: obj.dueDate||null, completed: !!obj.completed, completedAt: obj.completedAt||null };
  } catch { return { ...msg, text: msg.body, dueDate: null, completed: false, completedAt: null }; }
}
function isOverdue(task) {
  if (task.completed || !task.dueDate) return false;
  return new Date(task.dueDate) < new Date();
}

// ── Shared mini-components ─────────────────────────────────────────────────
function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.new;
  return <span style={{ fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:cfg.color,background:cfg.bg,border:`1px solid ${cfg.color}40`,borderRadius:10,padding:'2px 8px',fontFamily:'var(--font-body)',whiteSpace:'nowrap' }}>{cfg.label}</span>;
}
function ScoreBadge({ score }) {
  const c = scoreColor(score);
  return <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:34,height:20,borderRadius:10,fontSize:10,fontWeight:700,fontFamily:'var(--font-body)',color:c,background:`${c}15`,border:`1px solid ${c}40` }}>{score}</span>;
}

// ── Tab bar ────────────────────────────────────────────────────────────────
function CRMTabBar({ tab, setTab, C, overdueTasks }) {
  const tabs = [
    { key:'dashboard', label:'Dashboard', icon:'◈' },
    { key:'contacts',  label:'Contacts',  icon:'⊞' },
    { key:'pipeline',  label:'Pipeline',  icon:'◆' },
    { key:'tasks',     label:'Tasks',     icon:'✓', badge: overdueTasks },
    { key:'activity',  label:'Activity',  icon:'◉' },
  ];
  return (
    <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:28 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{
          position:'relative', padding:'10px 20px', border:'none', cursor:'pointer',
          background:'transparent',
          borderBottom: tab===t.key ? `2px solid ${GOLD}` : '2px solid transparent',
          fontFamily:'var(--font-body)', fontSize:12, fontWeight: tab===t.key ? 600 : 400,
          color: tab===t.key ? GOLD : C.grey, letterSpacing:'0.04em', transition:'all 0.15s', marginBottom:-1,
        }}>
          <span style={{ marginRight:6, fontSize:10 }}>{t.icon}</span>
          {t.label}
          {t.badge > 0 && (
            <span style={{ position:'absolute',top:6,right:4,width:16,height:16,borderRadius:'50%',background:'#ef4444',color:'#fff',fontSize:9,fontWeight:700,fontFamily:'var(--font-body)',display:'flex',alignItems:'center',justifyContent:'center' }}>
              {t.badge > 9 ? '9+' : t.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

// ── Dashboard tab ──────────────────────────────────────────────────────────
function DashboardTab({ leads, notes, tasks, C, onSelectContact }) {
  const total     = leads.length;
  const booked   = leads.filter(l=>l.status==='booked').length;
  const newLeads  = leads.filter(l=>!l.status||l.status==='new').length;
  const qualified = leads.filter(l=>l.status==='qualified').length;
  const convRate  = total ? Math.round((booked/total)*100) : 0;

  // Pipeline value = sum of dealValue in requirements_json
  const pipelineValue = leads.reduce((sum,l) => {
    const v = parseFloat(l.requirements_json?.dealValue);
    return sum + (isNaN(v) ? 0 : v);
  }, 0);

  // Weighted forecast = dealValue × stage probability
  const STAGE_PROB = { new:0.05, qualified:0.15, engaged:0.30, proposal_sent:0.50, booked:1.0, lost:0, spam:0 };
  const weightedForecast = leads.reduce((sum,l) => {
    const v = parseFloat(l.requirements_json?.dealValue);
    if (!v || isNaN(v)) return sum;
    return sum + v * (STAGE_PROB[l.status||'new'] ?? 0.05);
  }, 0);

  // Score band breakdown
  const scoreBands = useMemo(() => ({
    hot:  leads.filter(l => (l.score ?? calcLeadScore(l)) >= 70).length,
    warm: leads.filter(l => { const s = l.score ?? calcLeadScore(l); return s >= 40 && s < 70; }).length,
    cold: leads.filter(l => (l.score ?? calcLeadScore(l)) < 40).length,
  }), [leads]);

  // Source conversion (booked/total per source)
  const sourceConversion = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const src = SOURCE_LABELS[l.lead_source] || l.lead_source || 'Direct';
      if (!map[src]) map[src] = { total:0, booked:0 };
      map[src].total++;
      if (l.status === 'booked') map[src].booked++;
    });
    return Object.entries(map)
      .map(([src, d]) => ({ src, ...d, rate: d.total ? Math.round((d.booked/d.total)*100) : 0 }))
      .sort((a,b) => b.booked - a.booked || b.total - a.total)
      .slice(0,5);
  }, [leads]);

  // Monthly trend (last 6 months)
  const monthlyData = useMemo(() => {
    const months = [];
    for (let i=5; i>=0; i--) {
      const d = new Date(); d.setMonth(d.getMonth()-i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label = d.toLocaleDateString('en-GB',{month:'short'});
      months.push({ key, label, count: leads.filter(l => l.created_at?.startsWith(key)).length });
    }
    return months;
  }, [leads]);
  const maxMonth = Math.max(...monthlyData.map(m=>m.count), 1);

  // Source breakdown
  const sourceBreakdown = useMemo(() => {
    const map = {};
    leads.forEach(l => {
      const src = SOURCE_LABELS[l.lead_source] || l.lead_source || 'Direct';
      map[src] = (map[src]||0)+1;
    });
    return Object.entries(map).sort((a,b)=>b[1]-a[1]).slice(0,5);
  }, [leads]);

  const byStatus = Object.keys(STATUS_CONFIG).map(s => ({
    ...STATUS_CONFIG[s], key:s,
    count: leads.filter(l=>(l.status||'new')===s).length,
  }));

  const recentLeads = [...leads].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  const recentNotes = [...notes].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,5);
  const overdueTasks = tasks.filter(t=>isOverdue(t)).length;

  const Card = ({ label, value, sub, color }) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-heading)', fontSize:28, fontWeight:700, color:color||C.white, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:6 }}>{sub}</div>}
    </div>
  );

  return (
    <div>
      {/* 5 stat cards */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:14, marginBottom:24 }}>
        <Card label="Total Contacts" value={total} sub="All time" />
        <Card label="New Leads" value={newLeads} sub="Awaiting contact" color={STATUS_CONFIG.new.color} />
        <Card label="Qualified" value={qualified} sub="In pipeline" color={STATUS_CONFIG.qualified.color} />
        <Card label="Booked" value={`${convRate}%`} sub={`${booked} booked`} color={STATUS_CONFIG.booked.color} />
        <Card
          label="Pipeline Value"
          value={pipelineValue > 0 ? fmtGBP(pipelineValue) : '-'}
          sub={weightedForecast > 0 ? `${fmtGBP(weightedForecast)} weighted` : 'Active deals'}
          color={GOLD}
        />
      </div>

      {overdueTasks > 0 && (
        <div style={{ background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:4, padding:'10px 16px', marginBottom:20, fontFamily:'var(--font-body)', fontSize:13, color:'#ef4444', display:'flex', alignItems:'center', gap:8 }}>
          <span style={{ fontSize:16 }}>⚠</span>
          {overdueTasks} overdue task{overdueTasks>1?'s':''} - check the Tasks tab
        </div>
      )}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:20, marginBottom:24 }}>
        {/* Pipeline status bars */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Pipeline Status</div>
          {byStatus.map(s => (
            <div key={s.key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ width:7,height:7,borderRadius:'50%',background:s.color,flexShrink:0 }} />
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, flex:1 }}>{s.label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:C.white, width:20, textAlign:'right' }}>{s.count}</div>
              <div style={{ width:60, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${total?(s.count/total)*100:0}%`, background:s.color, borderRadius:2, transition:'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Monthly trend */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>New Leads (6 months)</div>
          <div style={{ display:'flex', alignItems:'flex-end', gap:6, height:80 }}>
            {monthlyData.map(m => (
              <div key={m.key} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:'100%', background:GOLD, borderRadius:'2px 2px 0 0', height:`${(m.count/maxMonth)*70}px`, minHeight: m.count>0?4:2, opacity: m.count>0?1:0.2, transition:'height 0.3s' }} />
                <div style={{ fontFamily:'var(--font-body)', fontSize:9, color:C.grey, letterSpacing:'0.06em' }}>{m.label}</div>
                {m.count > 0 && <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:GOLD }}>{m.count}</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Source conversion */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Source Conversion</div>
          {sourceConversion.length === 0 ? (
            <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>No data yet.</p>
          ) : sourceConversion.map(({ src, total: t, booked: b, rate }) => (
            <div key={src} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{src}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, width:36, textAlign:'right' }}>{b}/{t}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color: rate>=20?'#16a34a':rate>=10?GOLD:C.grey, width:32, textAlign:'right' }}>{rate}%</div>
              <div style={{ width:50, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${rate}%`, background: rate>=20?'#16a34a':rate>=10?GOLD:'#6b7280', borderRadius:2, transition:'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Score bands row */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, marginBottom:24 }}>
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Lead Quality Bands</div>
          {[
            { label:'Hot', count:scoreBands.hot,  color:'#16a34a', desc:'Score 70+' },
            { label:'Warm', count:scoreBands.warm, color:GOLD,      desc:'Score 40–69' },
            { label:'Cold', count:scoreBands.cold, color:'#6b7280', desc:'Score < 40' },
          ].map(({ label, count, color, desc }) => (
            <div key={label} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:12 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:color, flexShrink:0 }} />
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, flex:1 }}>{label}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey }}>{desc}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:14, fontWeight:700, color, width:28, textAlign:'right' }}>{count}</div>
              <div style={{ width:60, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${total ? (count/total)*100 : 0}%`, background:color, borderRadius:2, transition:'width 0.4s' }} />
              </div>
            </div>
          ))}
        </div>

        {/* Weighted forecast breakdown */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>Weighted Pipeline Forecast</div>
          <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, marginBottom:14 }}>Deal value × stage probability</div>
          {[
            { key:'qualified',    prob:'15%' },
            { key:'engaged',      prob:'30%' },
            { key:'proposal_sent',prob:'50%' },
            { key:'booked',       prob:'100%' },
          ].map(({ key, prob }) => {
            const stageLeds = leads.filter(l => l.status === key);
            const stageVal = stageLeds.reduce((s,l) => {
              const v = parseFloat(l.requirements_json?.dealValue);
              return s + (isNaN(v)?0:v);
            }, 0);
            const weighted = stageVal * parseFloat(prob) / 100;
            return stageVal > 0 ? (
              <div key={key} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:STATUS_CONFIG[key]?.color,flexShrink:0 }} />
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.white, flex:1 }}>{STATUS_CONFIG[key]?.label}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey }}>{prob}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:GOLD }}>{fmtGBP(weighted)||'-'}</div>
              </div>
            ) : null;
          })}
          {weightedForecast > 0 ? (
            <div style={{ marginTop:12, paddingTop:10, borderTop:`1px solid ${C.border}`, display:'flex', justifyContent:'space-between' }}>
              <span style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.grey, textTransform:'uppercase', letterSpacing:'0.06em' }}>Total forecast</span>
              <span style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color:GOLD }}>{fmtGBP(weightedForecast)}</span>
            </div>
          ) : (
            <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, marginTop:8 }}>Add deal values to leads to see forecast.</p>
          )}
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
        {/* Recent notes */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Recent Notes</div>
          {recentNotes.length===0 ? (
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>No notes yet.</p>
          ) : recentNotes.map(n => {
            const lead = leads.find(l=>l.id===n.lead_id);
            return (
              <div key={n.id} style={{ display:'flex', gap:10, marginBottom:12, cursor:lead?'pointer':'default' }}
                onClick={() => lead && onSelectContact(lead)}>
                <div style={{ width:6,height:6,borderRadius:'50%',background:GOLD,flexShrink:0,marginTop:5 }} />
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{n.body}</div>
                  {lead && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:1 }}>{lead.first_name} {lead.last_name}</div>}
                </div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, flexShrink:0 }}>
                  {new Date(n.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent contacts */}
        <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Recent Contacts</div>
          {recentLeads.map(l => (
            <div key={l.id} onClick={() => onSelectContact(l)}
              style={{ display:'flex', alignItems:'center', gap:12, padding:'9px 0', borderBottom:`1px solid ${C.border}`, cursor:'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background=GOLD_DIM}
              onMouseLeave={e => e.currentTarget.style.background='transparent'}>
              <div style={{ width:30,height:30,borderRadius:'50%',background:GOLD_DIM,border:`1px solid ${GOLD}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:'var(--font-heading)',fontSize:12,fontWeight:600,color:GOLD }}>
                {(l.first_name||'?')[0].toUpperCase()}
              </div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:C.white, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{l.first_name} {l.last_name}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>{SOURCE_LABELS[l.lead_source]||l.lead_source||'Direct'}</div>
              </div>
              <StatusBadge status={l.status||'new'} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Contacts tab ───────────────────────────────────────────────────────────
function ContactsTab({ leads, C, onSelectContact, onStatusChange, onCreateLead }) {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatus]       = useState('all');
  const [typeFilter, setType]           = useState('all');
  const [priorityFilter, setPriority]   = useState('all');
  const [sortBy, setSortBy]             = useState('created_at');
  const [sortDir, setSortDir]           = useState('desc');
  const [page, setPage]                 = useState(0);
  const [selected, setSelected]         = useState(new Set());
  const [bulkStatus, setBulkStatus]     = useState('');
  const [bulkApplying, setBulkApply]    = useState(false);
  const [bulkReason, setBulkReason]     = useState('');
  const [showBulkReason, setShowBulkReason] = useState(false);
  const PER_PAGE = 20;

  const BULK_LOSS_REASONS = ['Price', 'Timing', 'Went elsewhere', 'No response', 'Not qualified', 'Changed plans', 'Other'];
  const BULK_SPAM_REASONS = ['Fake contact', 'Duplicate entry', 'Competitor', 'Test submission', 'Wrong number', 'Other'];

  const filtered = useMemo(() => {
    return leads.filter(l => {
      const q = search.toLowerCase();
      const matchSearch   = !q || `${l.first_name} ${l.last_name} ${l.email} ${l.phone||''} ${l.lead_source||''} ${l.requirements_json?.businessName||''}`.toLowerCase().includes(q);
      const matchStatus   = statusFilter==='all' || (l.status||'new')===statusFilter;
      const matchType     = typeFilter==='all' || l.lead_type===typeFilter;
      const matchPriority = priorityFilter==='all' || (l.priority||'normal')===priorityFilter;
      return matchSearch && matchStatus && matchType && matchPriority;
    }).sort((a,b) => {
      let av=a[sortBy], bv=b[sortBy];
      if (sortBy==='name') { av=`${a.first_name} ${a.last_name}`; bv=`${b.first_name} ${b.last_name}`; }
      if (sortBy==='score') { av=a.score??calcLeadScore(a); bv=b.score??calcLeadScore(b); }
      if (typeof av==='string') av=av.toLowerCase();
      if (typeof bv==='string') bv=bv.toLowerCase();
      return sortDir==='asc' ? (av>bv?1:-1) : (av<bv?1:-1);
    });
  }, [leads, search, statusFilter, typeFilter, priorityFilter, sortBy, sortDir]);

  const paged = filtered.slice(page*PER_PAGE, (page+1)*PER_PAGE);
  const totalPages = Math.ceil(filtered.length/PER_PAGE);
  const types = [...new Set(leads.map(l=>l.lead_type).filter(Boolean))];

  const toggleSort = (col) => {
    if (sortBy===col) setSortDir(d=>d==='asc'?'desc':'asc');
    else { setSortBy(col); setSortDir('desc'); }
    setPage(0);
  };
  const SortIcon = ({col}) => sortBy===col ? <span style={{marginLeft:4,color:GOLD}}>{sortDir==='asc'?'↑':'↓'}</span> : <span style={{marginLeft:4,color:C.grey,opacity:0.3}}>↕</span>;

  const toggleSelect = (id) => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; });
  const toggleAll    = () => setSelected(s => s.size===paged.length ? new Set() : new Set(paged.map(l=>l.id)));

  const handleBulkApply = () => {
    if (!bulkStatus || !selected.size) return;
    if (bulkStatus === 'lost' || bulkStatus === 'spam') {
      setShowBulkReason(true);
      setBulkReason('');
    } else {
      executeBulkStatus(bulkStatus, undefined);
    }
  };

  const executeBulkStatus = async (status, reason) => {
    setBulkApply(true);
    try {
      for (const id of selected) { await onStatusChange(id, status, reason || undefined); }
    } catch (e) {
      console.error('[CRM] Bulk status update failed:', e.message);
    } finally {
      setBulkApply(false);
      setSelected(new Set());
      setBulkStatus('');
      setShowBulkReason(false);
      setBulkReason('');
    }
  };

  const inS = { padding:'8px 10px', background:C.card, border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.white, cursor:'pointer', outline:'none' };

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center', flexWrap:'wrap' }}>
        <div style={{ position:'relative', flex:'1 1 200px' }}>
          <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:C.grey, fontSize:13 }}>⊛</span>
          <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}}
            placeholder="Search contacts..."
            style={{ ...inS, width:'100%', boxSizing:'border-box', paddingLeft:28 }} />
        </div>
        <select value={statusFilter} onChange={e=>{setStatus(e.target.value);setPage(0);}} style={inS}>
          <option value="all">All Statuses</option>
          {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select value={priorityFilter} onChange={e=>{setPriority(e.target.value);setPage(0);}} style={inS}>
          <option value="all">All Priorities</option>
          {LEAD_PRIORITIES.map(p=><option key={p.key} value={p.key}>{p.label}</option>)}
        </select>
        {types.length > 0 && (
          <select value={typeFilter} onChange={e=>{setType(e.target.value);setPage(0);}} style={inS}>
            <option value="all">All Types</option>
            {types.map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        )}
        <button onClick={()=>exportCSV(filtered)} style={{ ...inS, color:C.grey, cursor:'pointer' }}>
          ↓ Export CSV
        </button>
        <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{filtered.length} contacts</div>
        <button onClick={onCreateLead} style={{ padding:'8px 16px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
          + New Contact
        </button>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div style={{ marginBottom:14 }}>
          <div style={{ display:'flex', gap:10, alignItems:'center', padding:'10px 14px', background:GOLD_DIM, border:`1px solid ${GOLD}40`, borderRadius: showBulkReason ? '4px 4px 0 0' : 4 }}>
            <span style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:GOLD }}>{selected.size} selected</span>
            <select value={bulkStatus} onChange={e=>{setBulkStatus(e.target.value);setShowBulkReason(false);setBulkReason('');}} style={{ ...inS, marginLeft:8 }}>
              <option value="">Set status...</option>
              {Object.entries(STATUS_CONFIG).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
            </select>
            <button onClick={handleBulkApply} disabled={!bulkStatus||bulkApplying}
              style={{ padding:'7px 16px', background:bulkStatus?GOLD:'rgba(201,168,76,0.3)', color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, cursor:bulkStatus?'pointer':'not-allowed' }}>
              {bulkApplying ? 'Applying...' : (bulkStatus==='lost'||bulkStatus==='spam') ? 'Next →' : 'Apply'}
            </button>
            <button onClick={()=>{setSelected(new Set());setShowBulkReason(false);setBulkReason('');}} style={{ padding:'7px 12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
              Clear
            </button>
          </div>

          {/* Inline reason prompt for lost / spam bulk actions */}
          {showBulkReason && (
            <div style={{ padding:'12px 14px', background: bulkStatus==='lost' ? 'rgba(239,68,68,0.06)' : C.card, border:`1px solid ${bulkStatus==='lost'?'rgba(239,68,68,0.25)':C.border}`, borderTop:'none', borderRadius:'0 0 4px 4px' }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color: bulkStatus==='lost'?'#ef4444':C.grey, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>
                {bulkStatus==='lost' ? 'Loss Reason' : 'Spam Reason'} — applying to {selected.size} contact{selected.size>1?'s':''}
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                {(bulkStatus==='lost' ? BULK_LOSS_REASONS : BULK_SPAM_REASONS).map(r => (
                  <button key={r} onClick={()=>setBulkReason(r)} style={{
                    padding:'3px 9px', borderRadius:10, cursor:'pointer', transition:'all 0.1s',
                    fontFamily:'var(--font-body)', fontSize:10, fontWeight:600,
                    background: bulkReason===r ? (bulkStatus==='lost'?'#ef4444':'#9ca3af') : 'transparent',
                    color: bulkReason===r ? '#fff' : (bulkStatus==='lost'?'#ef4444':C.grey),
                    border: `1px solid ${bulkStatus==='lost'?'rgba(239,68,68,0.4)':C.border}`,
                  }}>{r}</button>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <button onClick={()=>executeBulkStatus(bulkStatus, bulkReason||undefined)} disabled={bulkApplying}
                  style={{ padding:'7px 20px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, background: bulkStatus==='lost'?'#ef4444':'#9ca3af', color:'#fff', border:'none' }}>
                  {bulkApplying ? 'Applying...' : `Confirm — ${bulkStatus==='lost'?'Mark Lost':'Mark Spam'}`}
                </button>
                <button onClick={()=>{setShowBulkReason(false);setBulkReason('');}} style={{ padding:'7px 14px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, background:'transparent', color:C.grey, border:`1px solid ${C.border}` }}>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Table */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, overflow:'hidden' }}>
        <table style={{ width:'100%', borderCollapse:'collapse' }}>
          <thead style={{ background:C.border }}>
            <tr>
              <th style={{ padding:'10px 12px', width:36 }}>
                <input type="checkbox" checked={paged.length>0&&selected.size===paged.length} onChange={toggleAll}
                  style={{ cursor:'pointer', accentColor:GOLD }} />
              </th>
              {[
                {key:'name',       label:'Name'},
                {key:'email',      label:'Email'},
                {key:'lead_source',label:'Source'},
                {key:'lead_type',  label:'Type'},
                {key:'score',      label:'Score'},
                {key:'status',     label:'Status'},
                {key:'created_at', label:'Added'},
              ].map(col => (
                <th key={col.key} onClick={()=>toggleSort(col.key)}
                  style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'left', padding:'10px 12px', cursor:'pointer', userSelect:'none', whiteSpace:'nowrap' }}>
                  {col.label}<SortIcon col={col.key} />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length===0 ? (
              <tr><td colSpan={8} style={{ padding:'48px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>No contacts found.</td></tr>
            ) : paged.map(l => {
              const score = l.score ?? calcLeadScore(l);
              const band = score >= 70 ? { label:'Hot', color:'#16a34a' } : score >= 40 ? { label:'Warm', color:GOLD } : { label:'Cold', color:'#6b7280' };
              const isSelected = selected.has(l.id);
              return (
                <tr key={l.id}
                  style={{ borderBottom:`1px solid ${C.border}`, background: isSelected?GOLD_DIM:'transparent', cursor:'pointer' }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background=GOLD_DIM; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background='transparent'; }}>
                  <td style={{ padding:'10px 12px' }} onClick={e=>e.stopPropagation()}>
                    <input type="checkbox" checked={isSelected} onChange={()=>toggleSelect(l.id)}
                      style={{ cursor:'pointer', accentColor:GOLD }} />
                  </td>
                  <td style={{ padding:'10px 12px' }} onClick={()=>onSelectContact(l)}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:26,height:26,borderRadius:'50%',background:GOLD_DIM,border:`1px solid ${GOLD}40`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontFamily:'var(--font-heading)',fontSize:11,fontWeight:600,color:GOLD }}>
                        {(l.first_name||'?')[0].toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:C.white }}>{l.first_name} {l.last_name}</div>
                        {l.requirements_json?.businessName && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:GOLD }}>{l.requirements_json.businessName}</div>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }} onClick={()=>onSelectContact(l)}>{l.email}</td>
                  <td style={{ padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }} onClick={()=>onSelectContact(l)}>
                    {SOURCE_LABELS[l.lead_source]||l.lead_source||'-'}
                  </td>
                  <td style={{ padding:'10px 12px' }} onClick={()=>onSelectContact(l)}>
                    <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, background:C.border, borderRadius:8, padding:'2px 8px' }}>
                      {(l.lead_type||'general').replace(/_/g,' ')}
                    </span>
                  </td>
                  <td style={{ padding:'10px 12px' }} onClick={()=>onSelectContact(l)}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <ScoreBadge score={score} />
                      <span style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:band.color, letterSpacing:'0.06em', textTransform:'uppercase' }}>{band.label}</span>
                    </div>
                  </td>
                  <td style={{ padding:'10px 12px' }} onClick={()=>onSelectContact(l)}>
                    <StatusBadge status={l.status||'new'} />
                  </td>
                  <td style={{ padding:'10px 12px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }} onClick={()=>onSelectContact(l)}>
                    {new Date(l.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:14 }}>
          <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>Page {page+1} of {totalPages}</span>
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={()=>setPage(p=>Math.max(0,p-1))} disabled={page===0}
              style={{ padding:'6px 14px', background:C.card, border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.white, cursor:page===0?'not-allowed':'pointer', opacity:page===0?0.4:1 }}>Prev</button>
            <button onClick={()=>setPage(p=>Math.min(totalPages-1,p+1))} disabled={page>=totalPages-1}
              style={{ padding:'6px 14px', background:C.card, border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.white, cursor:page>=totalPages-1?'not-allowed':'pointer', opacity:page>=totalPages-1?0.4:1 }}>Next</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Pipeline tab ───────────────────────────────────────────────────────────
// Logical next steps for each pipeline status — drives quick-action buttons on kanban cards
const NEXT_STATUS_MAP = {
  new:           ['qualified', 'lost'],
  qualified:     ['engaged', 'lost'],
  engaged:       ['proposal_sent', 'lost'],
  proposal_sent: ['booked', 'lost'],
  booked:        [],
  lost:          ['qualified'],
  spam:          [],
};

function PipelineTab({ leads, C, onSelectContact, onStatusChange }) {
  const columns = Object.entries(STATUS_CONFIG);
  const [pendingLostId, setPendingLostId] = useState(null);
  const [pendingLostReason, setPendingLostReason] = useState('');
  const PIPELINE_LOSS_REASONS = ['Price', 'Timing', 'Went elsewhere', 'No response', 'Not qualified', 'Changed plans', 'Other'];

  const handleQuickAction = (e, leadId, targetStatus) => {
    e.stopPropagation();
    if (targetStatus === 'lost') {
      setPendingLostId(leadId);
      setPendingLostReason('');
    } else {
      onStatusChange(leadId, targetStatus);
    }
  };

  return (
    <div>
      {/* Column value totals strip */}
      <div style={{ display:'flex', gap:14, marginBottom:14, overflowX:'auto' }}>
        {columns.map(([statusKey, cfg]) => {
          const cards = leads.filter(l=>(l.status||'new')===statusKey);
          const total = cards.reduce((s,l)=>{const v=parseFloat(l.requirements_json?.dealValue);return s+(isNaN(v)?0:v);},0);
          return (
            <div key={statusKey} style={{ flex:'0 0 210px', minWidth:210, background:C.card, border:`1px solid ${C.border}`, borderTop:`3px solid ${cfg.color}`, borderRadius:4, padding:'10px 14px' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, marginBottom:4 }}>
                <span style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase' }}>{cfg.label}</span>
                <span style={{ marginLeft:'auto', fontFamily:'var(--font-body)', fontSize:11, color:C.grey, background:C.border, borderRadius:8, padding:'1px 7px' }}>{cards.length}</span>
              </div>
              {total > 0 && (
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:GOLD }}>{fmtGBP(total)}</div>
              )}
            </div>
          );
        })}
      </div>

      {/* Kanban cards */}
      <div style={{ display:'flex', gap:14, overflowX:'auto', paddingBottom:8 }}>
        {columns.map(([statusKey, cfg]) => {
          const cards = leads.filter(l=>(l.status||'new')===statusKey);
          return (
            <div key={statusKey} style={{ flex:'0 0 210px', minWidth:210 }}>
              <div style={{ display:'flex', flexDirection:'column', gap:10, minHeight:80 }}>
                {cards.map(l => {
                  const score = calcLeadScore(l);
                  const dealVal = fmtGBP(l.requirements_json?.dealValue);
                  return (
                    <div key={l.id} onClick={()=>onSelectContact(l)}
                      style={{ background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${cfg.color}`, borderRadius:4, padding:'12px 14px', cursor:'pointer', transition:'transform 0.12s, box-shadow 0.12s' }}
                      onMouseEnter={e=>{e.currentTarget.style.transform='translateY(-1px)';e.currentTarget.style.boxShadow='0 4px 12px rgba(0,0,0,0.12)';}}
                      onMouseLeave={e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow='none';}}>
                      <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:C.white, marginBottom:2 }}>
                        {l.first_name} {l.last_name}
                      </div>
                      {l.requirements_json?.businessName && (
                        <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:GOLD, marginBottom:3 }}>{l.requirements_json.businessName}</div>
                      )}
                      <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginBottom:8 }}>{l.email}</div>
                      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8 }}>
                        <ScoreBadge score={score} />
                        {dealVal && <span style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:GOLD }}>{dealVal}</span>}
                      </div>
                      <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                        {(NEXT_STATUS_MAP[statusKey] || []).map(s => (
                          <button key={s} onClick={e=>handleQuickAction(e, l.id, s)}
                            style={{ fontSize:9, padding:'2px 7px', borderRadius:8, cursor:'pointer', border:`1px solid ${STATUS_CONFIG[s].color}50`, color:STATUS_CONFIG[s].color, background:'transparent', fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:'0.06em', textTransform:'uppercase' }}>
                            {STATUS_CONFIG[s].label}
                          </button>
                        ))}
                      </div>
                      {/* Inline loss reason prompt */}
                      {pendingLostId === l.id && (
                        <div onClick={e=>e.stopPropagation()} style={{ marginTop:8, padding:'10px 12px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:4 }}>
                          <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'#ef4444', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:7 }}>Loss Reason</div>
                          <div style={{ display:'flex', gap:4, flexWrap:'wrap', marginBottom:7 }}>
                            {PIPELINE_LOSS_REASONS.map(r => (
                              <button key={r} onClick={()=>setPendingLostReason(r)} style={{
                                padding:'2px 7px', borderRadius:8, cursor:'pointer',
                                fontFamily:'var(--font-body)', fontSize:9, fontWeight:600,
                                background: pendingLostReason===r ? '#ef4444' : 'transparent',
                                color: pendingLostReason===r ? '#fff' : '#ef4444',
                                border:'1px solid rgba(239,68,68,0.4)',
                              }}>{r}</button>
                            ))}
                          </div>
                          <div style={{ display:'flex', gap:5 }}>
                            <button onClick={()=>{
                              onStatusChange(l.id,'lost',pendingLostReason||undefined);
                              setPendingLostId(null); setPendingLostReason('');
                            }} style={{ flex:1, padding:'4px 0', borderRadius:3, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, background:'#ef4444', color:'#fff', border:'none' }}>
                              Confirm Lost
                            </button>
                            <button onClick={()=>{setPendingLostId(null);setPendingLostReason('');}} style={{ padding:'4px 8px', borderRadius:3, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:9, fontWeight:600, background:'transparent', color:C.grey, border:`1px solid ${C.border}` }}>
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {cards.length===0 && (
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, padding:'20px 8px', textAlign:'center', border:`1px dashed ${C.border}`, borderRadius:4 }}>Empty</div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Tasks tab ─────────────────────────────────────────────────────────────
function TasksTab({ tasks, leads, C, onCompleteTask, onCreateTask, onDeleteTask }) {
  const [filter, setFilter]  = useState('all'); // all | pending | overdue | done
  const [showCreate, setShowCreate] = useState(false);

  const enriched = tasks.map(t => ({ ...t, lead: leads.find(l=>l.id===t.lead_id) }));

  const filtered = enriched.filter(t => {
    if (filter==='pending') return !t.completed;
    if (filter==='overdue') return isOverdue(t);
    if (filter==='done')    return t.completed;
    return true;
  }).sort((a,b) => {
    if (a.completed && !b.completed) return 1;
    if (!a.completed && b.completed) return -1;
    if (a.dueDate && b.dueDate) return new Date(a.dueDate)-new Date(b.dueDate);
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return new Date(b.created_at)-new Date(a.created_at);
  });

  const btnStyle = (active) => ({
    padding:'6px 14px', border:`1px solid ${active?GOLD:C.border}`, borderRadius:3,
    background: active?GOLD_DIM:'transparent',
    fontFamily:'var(--font-body)', fontSize:11, fontWeight: active?600:400,
    color: active?GOLD:C.grey, cursor:'pointer',
  });

  const overdueCount = enriched.filter(t=>isOverdue(t)).length;

  return (
    <div>
      {/* Toolbar */}
      <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:20, flexWrap:'wrap' }}>
        <div style={{ display:'flex', gap:6 }}>
          {[
            {key:'all',     label:`All (${enriched.length})`},
            {key:'pending', label:`Pending (${enriched.filter(t=>!t.completed).length})`},
            {key:'overdue', label:`Overdue (${overdueCount})`, warn:overdueCount>0},
            {key:'done',    label:`Done (${enriched.filter(t=>t.completed).length})`},
          ].map(f => (
            <button key={f.key} onClick={()=>setFilter(f.key)} style={{
              ...btnStyle(filter===f.key),
              color: filter===f.key ? GOLD : (f.warn ? '#ef4444' : C.grey),
              borderColor: filter===f.key ? GOLD : (f.warn ? '#ef4444' : C.border),
            }}>{f.label}</button>
          ))}
        </div>
        <button onClick={()=>setShowCreate(true)} style={{ marginLeft:'auto', padding:'7px 16px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
          + New Task
        </button>
      </div>

      {/* Task list */}
      {filtered.length===0 ? (
        <div style={{ padding:'48px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:14, color:C.grey, background:C.card, border:`1px solid ${C.border}`, borderRadius:4 }}>
          {filter==='overdue' ? 'No overdue tasks. ' : filter==='done' ? 'No completed tasks yet.' : 'No tasks yet. Create one above.'}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
          {filtered.map(t => {
            const overdue = isOverdue(t);
            return (
              <div key={t.id} style={{ background:C.card, border:`1px solid ${overdue?'rgba(239,68,68,0.4)':C.border}`, borderLeft:`3px solid ${t.completed?C.border:overdue?'#ef4444':GOLD}`, borderRadius:4, padding:'12px 16px', display:'flex', alignItems:'flex-start', gap:12 }}>
                {/* Checkbox */}
                <button onClick={()=>onCompleteTask(t)} style={{ width:20,height:20,borderRadius:4,border:`2px solid ${t.completed?STATUS_CONFIG.booked.color:C.border}`,background:t.completed?STATUS_CONFIG.booked.color:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:1 }}>
                  {t.completed && <span style={{ color:'#fff',fontSize:11,fontWeight:700 }}>✓</span>}
                </button>

                {/* Content */}
                <div style={{ flex:1 }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:t.completed?C.grey:C.white, textDecoration:t.completed?'line-through':'none', marginBottom:4 }}>
                    {t.text}
                  </div>
                  <div style={{ display:'flex', gap:12, alignItems:'center', flexWrap:'wrap' }}>
                    {t.lead && (
                      <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:GOLD }}>
                        {t.lead.first_name} {t.lead.last_name}
                        {t.lead.requirements_json?.businessName && ` - ${t.lead.requirements_json.businessName}`}
                      </span>
                    )}
                    {t.dueDate && (
                      <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:overdue?'#ef4444':C.grey, fontWeight:overdue?600:400 }}>
                        {overdue?'OVERDUE - ':''}{new Date(t.dueDate).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
                      </span>
                    )}
                    {t.completed && t.completedAt && (
                      <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:STATUS_CONFIG.booked.color }}>
                        Completed {new Date(t.completedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                      </span>
                    )}
                  </div>
                </div>

                {/* Delete */}
                <button onClick={()=>onDeleteTask(t)} style={{ background:'none',border:'none',cursor:'pointer',color:C.grey,fontSize:14,padding:'2px 4px',flexShrink:0 }}
                  onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                  onMouseLeave={e=>e.currentTarget.style.color=C.grey}>✕</button>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && <CreateTaskModal leads={leads} C={C} onClose={()=>setShowCreate(false)} onCreate={onCreateTask} />}
    </div>
  );
}

// ── Create task modal ──────────────────────────────────────────────────────
function CreateTaskModal({ leads, C, onClose, onCreate }) {
  const [text, setText]         = useState('');
  const [dueDate, setDueDate]   = useState('');
  const [leadId, setLeadId]     = useState('');
  const [saving, setSaving]     = useState(false);

  const handleCreate = async () => {
    if (!text.trim()) return;
    setSaving(true);
    await onCreate({ text: text.trim(), dueDate: dueDate||null, leadId: leadId||null });
    setSaving(false);
    onClose();
  };

  const inS = { width:'100%', boxSizing:'border-box', padding:'9px 10px', fontFamily:'var(--font-body)', fontSize:13, color:C.white, background:C.card, border:`1px solid ${C.border}`, borderRadius:3, outline:'none', marginTop:4 };
  const labS = { fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase' };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:300, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:'28px', width:440, maxWidth:'94vw', boxShadow:'0 20px 60px rgba(0,0,0,0.25)' }}>
        <h3 style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:600, color:C.white, margin:'0 0 22px' }}>New Task</h3>
        <div style={{ marginBottom:14 }}>
          <label style={labS}>Task *</label>
          <input value={text} onChange={e=>setText(e.target.value)} placeholder="e.g. Follow up call" style={inS} autoFocus />
        </div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div>
            <label style={labS}>Due Date</label>
            <input type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} style={inS} />
          </div>
          <div>
            <label style={labS}>Contact (optional)</label>
            <select value={leadId} onChange={e=>setLeadId(e.target.value)} style={{ ...inS, cursor:'pointer' }}>
              <option value="">No contact</option>
              {leads.slice(0,50).map(l=><option key={l.id} value={l.id}>{l.first_name} {l.last_name} - {l.email}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end', marginTop:8 }}>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleCreate} disabled={!text.trim()||saving}
            style={{ padding:'9px 24px', background:text.trim()?GOLD:'rgba(201,168,76,0.3)', color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:text.trim()?'pointer':'not-allowed' }}>
            {saving?'Creating...':'Create Task'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Activity tab ───────────────────────────────────────────────────────────
function ActivityTab({ leads, notes, leadEvents, C, onSelectContact }) {
  const [typeFilter, setTypeFilter] = useState('all');

  const EVENT_META = {
    status_changed:    { color: '#8b5cf6', label: 'Status changed' },
    lead_created:      { color: STATUS_CONFIG.new.color, label: 'Created' },
    status_migration:  { color: '#9ca3af', label: 'Migration' },
    partner_notified:  { color: '#f59e0b', label: 'Partner notified' },
    internal_notified: { color: '#06b6d4', label: 'Internal notified' },
    lead_scored:       { color: GOLD, label: 'Scored' },
  };

  const allEvents = useMemo(() => {
    const noteEvs = notes.map(n => ({
      type: 'note', date: n.created_at, id: `note-${n.id}`,
      data: n, lead: leads.find(l => l.id === n.lead_id),
    }));
    const createdEvs = leads.map(l => ({
      type: 'created', date: l.created_at, id: `lead-${l.id}`,
      data: l, lead: l,
    }));
    const dbEvs = leadEvents.map(e => ({
      type: e.event_type, date: e.created_at, id: `ev-${e.id}`,
      data: e, lead: leads.find(l => l.id === e.lead_id),
    }));
    const combined = [...noteEvs, ...createdEvs, ...dbEvs];
    combined.sort((a, b) => new Date(b.date) - new Date(a.date));
    return combined;
  }, [notes, leads, leadEvents]);

  const filtered = useMemo(() => {
    if (typeFilter === 'notes')   return allEvents.filter(e => e.type === 'note');
    if (typeFilter === 'status')  return allEvents.filter(e => e.type === 'status_changed');
    if (typeFilter === 'created') return allEvents.filter(e => e.type === 'created');
    return allEvents;
  }, [allEvents, typeFilter]);

  const grouped = filtered.reduce((acc, ev) => {
    const dateKey = new Date(ev.date).toLocaleDateString('en-GB', { weekday:'long', day:'numeric', month:'long', year:'numeric' });
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(ev);
    return acc;
  }, {});

  const tabBtn = (active) => ({
    padding:'6px 12px', border:`1px solid ${active?GOLD:C.border}`, borderRadius:3,
    background: active ? GOLD_DIM : 'transparent',
    fontFamily:'var(--font-body)', fontSize:11, fontWeight: active ? 600 : 400,
    color: active ? GOLD : C.grey, cursor:'pointer',
  });

  const dotColor = (ev) => {
    if (ev.type === 'note') return GOLD;
    if (ev.type === 'created') return STATUS_CONFIG.new.color;
    if (ev.type === 'status_changed') {
      const s = ev.data?.event_data?.new_status;
      return STATUS_CONFIG[s]?.color || '#8b5cf6';
    }
    return EVENT_META[ev.type]?.color || C.grey;
  };

  return (
    <div style={{ maxWidth:720 }}>
      {/* Filter tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {[{k:'all',l:`All (${allEvents.length})`},{k:'status',l:'Status Changes'},{k:'notes',l:'Notes'},{k:'created',l:'New Contacts'}].map(f=>(
          <button key={f.k} onClick={()=>setTypeFilter(f.k)} style={tabBtn(typeFilter===f.k)}>{f.l}</button>
        ))}
      </div>

      {Object.keys(grouped).length === 0 ? (
        <div style={{ padding:'48px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:14, color:C.grey }}>No activity yet.</div>
      ) : Object.entries(grouped).map(([date, items]) => (
        <div key={date} style={{ marginBottom:28 }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12, paddingBottom:6, borderBottom:`1px solid ${C.border}` }}>
            {date}
          </div>
          {items.map((ev) => {
            const dc = dotColor(ev);
            return (
              <div key={ev.id} style={{ display:'flex', gap:14, marginBottom:14 }}>
                <div style={{ flexShrink:0, display:'flex', flexDirection:'column', alignItems:'center' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:dc, marginTop:4, flexShrink:0 }} />
                  <div style={{ width:1, flex:1, background:C.border, marginTop:4 }} />
                </div>
                <div style={{ flex:1, paddingBottom:10 }}>
                  <div style={{ display:'flex', alignItems:'baseline', gap:8, marginBottom:5, flexWrap:'wrap' }}>
                    {ev.lead && (
                      <button onClick={() => onSelectContact(ev.lead)}
                        style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:GOLD, background:'none', border:'none', cursor:'pointer', padding:0 }}>
                        {ev.lead.first_name} {ev.lead.last_name}
                      </button>
                    )}
                    <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey }}>
                      {new Date(ev.date).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit'})}
                    </span>
                    {/* Event type badge */}
                    {ev.type === 'created' && <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:STATUS_CONFIG.new.color, background:STATUS_CONFIG.new.bg, borderRadius:8, padding:'1px 8px', fontWeight:600 }}>New contact</span>}
                    {ev.type === 'note'    && <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:GOLD, background:GOLD_DIM, borderRadius:8, padding:'1px 8px', fontWeight:600 }}>Note</span>}
                    {ev.type === 'status_changed' && (() => {
                      const s = ev.data?.event_data?.new_status;
                      const cfg = STATUS_CONFIG[s];
                      return cfg ? <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:cfg.color, background:cfg.bg, borderRadius:8, padding:'1px 8px', fontWeight:600 }}>{cfg.label}</span> : null;
                    })()}
                    {!['note','created','status_changed'].includes(ev.type) && (
                      <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, background:`${dc}18`, borderRadius:8, padding:'1px 8px', fontWeight:600 }}>
                        {EVENT_META[ev.type]?.label || ev.type.replace(/_/g,' ')}
                      </span>
                    )}
                  </div>
                  {/* Event body */}
                  {ev.type === 'note' && (
                    <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.white, lineHeight:1.55, background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${GOLD}`, borderRadius:3, padding:'10px 14px' }}>
                      {ev.data.body}
                    </div>
                  )}
                  {ev.type === 'created' && (
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${STATUS_CONFIG.new.color}`, borderRadius:3, padding:'8px 14px' }}>
                      {SOURCE_LABELS[ev.lead?.lead_source] || ev.lead?.lead_source || 'Direct'} — {ev.lead?.email}
                    </div>
                  )}
                  {ev.type === 'status_changed' && (() => {
                    const d = ev.data?.event_data || {};
                    const s = d.new_status;
                    const cfg = STATUS_CONFIG[s];
                    return (
                      <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, background:C.card, border:`1px solid ${C.border}`, borderLeft:`3px solid ${cfg?.color||'#8b5cf6'}`, borderRadius:3, padding:'8px 14px' }}>
                        → <strong style={{ color: cfg?.color }}>{cfg?.label || s}</strong>
                        {d.score != null && <span style={{ marginLeft:12, color:C.grey }}>Score: {d.score}</span>}
                        {d.loss_reason && <span style={{ marginLeft:12, color:'#ef4444' }}>Reason: {d.loss_reason}</span>}
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

// ── Contact detail panel ───────────────────────────────────────────────────
function ContactPanel({ lead, C, onClose, onStatusChange, notes, tasks, onAddNote, onAddTask, onCompleteTask, noteText, setNoteText, noteSubmitting, onDealValueChange, onConvert, leadEvents }) {
  const req  = lead.requirements_json || {};
  const score = calcLeadScore(lead);
  const [dealInput, setDealInput] = useState(req.dealValue||'');
  const [activeSection, setSection] = useState('overview');
  const [taskText, setTaskText]   = useState('');
  const [taskDue, setTaskDue]     = useState('');
  const [converting, setConverting] = useState(false);
  const [convertState, setConvertState] = useState(null); // null | 'success' | 'duplicate'
  const [showLossPrompt, setShowLossPrompt] = useState(false);
  const [lossReason, setLossReason] = useState('');
  const [showSpamPrompt, setShowSpamPrompt] = useState(false);
  const [spamReason, setSpamReason] = useState('');

  const LOSS_REASONS = ['Price', 'Timing', 'Went elsewhere', 'No response', 'Not qualified', 'Changed plans', 'Other'];
  const SPAM_REASONS = ['Fake contact', 'Duplicate entry', 'Competitor', 'Test submission', 'Wrong number', 'Other'];

  const handleStatusClick = (s) => {
    if (s === 'lost') { setShowLossPrompt(true); setShowSpamPrompt(false); return; }
    if (s === 'spam') { setShowSpamPrompt(true); setShowLossPrompt(false); return; }
    setShowLossPrompt(false); setLossReason('');
    setShowSpamPrompt(false); setSpamReason('');
    onStatusChange(lead.id, s);
  };

  const confirmLost = () => {
    onStatusChange(lead.id, 'lost', lossReason || undefined);
    setShowLossPrompt(false);
    setLossReason('');
  };

  const confirmSpam = () => {
    onStatusChange(lead.id, 'spam', spamReason || undefined);
    setShowSpamPrompt(false);
    setSpamReason('');
  };

  const contactTasks = tasks.filter(t=>t.lead_id===lead.id);

  const inS = { width:'100%', boxSizing:'border-box', padding:'7px 10px', fontFamily:'var(--font-body)', fontSize:12, color:C.white, background:C.card, border:`1px solid ${C.border}`, borderRadius:3, outline:'none' };

  return (
    <div style={{ position:'fixed',top:0,right:0,width:460,height:'100vh',background:C.card,borderLeft:`1px solid ${C.border}`,boxShadow:'-8px 0 32px rgba(0,0,0,0.15)',display:'flex',flexDirection:'column',zIndex:200,overflow:'hidden' }}>
      {/* Header */}
      <div style={{ padding:'20px 22px 14px', borderBottom:`1px solid ${C.border}`, background:C.card }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ width:40,height:40,borderRadius:'50%',background:GOLD_DIM,border:`2px solid ${GOLD}40`,display:'flex',alignItems:'center',justifyContent:'center',fontFamily:'var(--font-heading)',fontSize:16,fontWeight:700,color:GOLD,flexShrink:0 }}>
              {(lead.first_name||'?')[0].toUpperCase()}
            </div>
            <div>
              <h3 style={{ fontFamily:'var(--font-heading)', fontSize:17, fontWeight:600, color:C.white, margin:'0 0 1px' }}>
                {lead.first_name} {lead.last_name}
              </h3>
              {req.businessName && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:GOLD, marginBottom:1 }}>{req.businessName}</div>}
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>{lead.email}</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <ScoreBadge score={score} />
            <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',color:C.grey,fontSize:18,padding:4 }}>✕</button>
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display:'flex', gap:8, marginTop:12, flexWrap:'wrap' }}>
          <a href={`mailto:${lead.email}`} style={{ padding:'5px 12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, textDecoration:'none', cursor:'pointer' }}>
            ✉ Email
          </a>
          {lead.phone && (
            <a href={`tel:${lead.phone}`} style={{ padding:'5px 12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, textDecoration:'none', cursor:'pointer' }}>
              ☎ Call
            </a>
          )}
          {req.website && (
            <a href={req.website} target="_blank" rel="noreferrer" style={{ padding:'5px 12px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, textDecoration:'none', cursor:'pointer' }}>
              ↗ Website
            </a>
          )}
          {onConvert && lead.status === 'booked' && convertState !== 'success' && (
            <button
              onClick={async () => {
                if (converting) return;
                setConverting(true);
                const result = await onConvert(lead);
                setConverting(false);
                setConvertState(result);
              }}
              disabled={converting}
              style={{
                padding:'5px 12px',
                background: convertState === 'duplicate' ? 'transparent' : GOLD,
                border: convertState === 'duplicate' ? `1px solid ${GOLD}` : 'none',
                borderRadius:3, fontFamily:'var(--font-body)', fontSize:11,
                fontWeight:600, color: convertState === 'duplicate' ? GOLD : '#000',
                cursor: converting ? 'not-allowed' : 'pointer', letterSpacing:'0.04em',
              }}
            >
              {converting ? 'Converting...' : convertState === 'duplicate' ? '↗ View Managed Account' : '◈ Convert to Managed Account'}
            </button>
          )}
          {convertState === 'success' && (
            <span style={{ padding:'5px 12px', background:'rgba(16,185,129,0.12)', border:'1px solid rgba(16,185,129,0.3)', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:'#10b981' }}>
              ✓ Managed Account created
            </span>
          )}
        </div>

        {/* Section tabs */}
        <div style={{ display:'flex', gap:0, marginTop:12, borderBottom:`1px solid ${C.border}` }}>
          {['overview','notes','history','tasks'].map(s=>(
            <button key={s} onClick={()=>setSection(s)} style={{
              padding:'6px 14px', border:'none', cursor:'pointer', background:'transparent',
              borderBottom: activeSection===s?`2px solid ${GOLD}`:'2px solid transparent',
              fontFamily:'var(--font-body)', fontSize:11, fontWeight:activeSection===s?600:400,
              color: activeSection===s?GOLD:C.grey, textTransform:'capitalize', marginBottom:-1,
            }}>{s}{s==='tasks'&&contactTasks.length>0?` (${contactTasks.length})`:''}</button>
          ))}
        </div>
      </div>

      <div style={{ flex:1, overflowY:'auto', padding:'16px 22px' }}>

        {/* OVERVIEW section */}
        {activeSection==='overview' && (
          <>
            {/* Status row */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.grey, marginBottom:7 }}>Status</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {Object.entries(STATUS_CONFIG).map(([s,cfg])=>(
                  <button key={s} onClick={()=>handleStatusClick(s)} style={{
                    padding:'4px 11px', borderRadius:12, cursor:'pointer', transition:'all 0.12s',
                    fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase',
                    background:(lead.status||'new')===s?cfg.color:'transparent',
                    color:(lead.status||'new')===s?'#fff':cfg.color,
                    border:`1px solid ${cfg.color}`,
                  }}>{cfg.label}</button>
                ))}
              </div>

              {/* Loss reason prompt */}
              {showLossPrompt && (
                <div style={{ marginTop:10, padding:'12px 14px', background:'rgba(239,68,68,0.06)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:4 }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#ef4444', letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Loss Reason</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:8 }}>
                    {LOSS_REASONS.map(r => (
                      <button key={r} onClick={()=>setLossReason(r)} style={{
                        padding:'3px 9px', borderRadius:10, cursor:'pointer', transition:'all 0.1s',
                        fontFamily:'var(--font-body)', fontSize:10, fontWeight:600,
                        background: lossReason===r ? '#ef4444' : 'transparent',
                        color: lossReason===r ? '#fff' : '#ef4444',
                        border:'1px solid rgba(239,68,68,0.4)',
                      }}>{r}</button>
                    ))}
                  </div>
                  <input
                    placeholder="Optional note..."
                    value={lossReason && !LOSS_REASONS.includes(lossReason) ? lossReason : ''}
                    onChange={e => setLossReason(e.target.value)}
                    style={{ ...inS, fontSize:11, marginBottom:8, color:C.white }}
                  />
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={confirmLost} style={{
                      flex:1, padding:'6px 0', borderRadius:3, cursor:'pointer',
                      fontFamily:'var(--font-body)', fontSize:11, fontWeight:600,
                      background:'#ef4444', color:'#fff', border:'none',
                    }}>Confirm Lost</button>
                    <button onClick={()=>{setShowLossPrompt(false);setLossReason('');}} style={{
                      padding:'6px 12px', borderRadius:3, cursor:'pointer',
                      fontFamily:'var(--font-body)', fontSize:11, fontWeight:600,
                      background:'transparent', color:C.grey, border:`1px solid ${C.border}`,
                    }}>Cancel</button>
                  </div>
                </div>
              )}

              {/* Spam reason prompt */}
              {showSpamPrompt && (
                <div style={{ marginTop:10, padding:'12px 14px', background:'rgba(156,163,175,0.06)', border:`1px solid ${C.border}`, borderRadius:4 }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>Spam Reason (optional)</div>
                  <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginBottom:10 }}>
                    {SPAM_REASONS.map(r => (
                      <button key={r} onClick={()=>setSpamReason(r)} style={{
                        padding:'3px 9px', borderRadius:10, cursor:'pointer', transition:'all 0.1s',
                        fontFamily:'var(--font-body)', fontSize:10, fontWeight:600,
                        background: spamReason===r ? '#9ca3af' : 'transparent',
                        color: spamReason===r ? '#fff' : C.grey,
                        border:`1px solid ${C.border}`,
                      }}>{r}</button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <button onClick={confirmSpam} style={{
                      flex:1, padding:'6px 0', borderRadius:3, cursor:'pointer',
                      fontFamily:'var(--font-body)', fontSize:11, fontWeight:600,
                      background:'#9ca3af', color:'#fff', border:'none',
                    }}>Mark as Spam</button>
                    <button onClick={()=>{setShowSpamPrompt(false);setSpamReason('');}} style={{
                      padding:'6px 12px', borderRadius:3, cursor:'pointer',
                      fontFamily:'var(--font-body)', fontSize:11, fontWeight:600,
                      background:'transparent', color:C.grey, border:`1px solid ${C.border}`,
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>

            {/* Deal value */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.grey, marginBottom:6 }}>Deal Value (GBP)</div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input value={dealInput} onChange={e=>setDealInput(e.target.value)} placeholder="e.g. 2500"
                  style={{ ...inS, flex:1 }} type="number" min="0" />
                <button onClick={()=>onDealValueChange(lead.id, dealInput)}
                  style={{ padding:'7px 14px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                  Save
                </button>
              </div>
            </div>

            {/* Details */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'12px 14px', marginBottom:14 }}>
              {[
                {label:'Phone',    val:lead.phone},
                {label:'Source',   val:SOURCE_LABELS[lead.lead_source]||lead.lead_source},
                {label:'Type',     val:lead.lead_type?.replace(/_/g,' ')},
                {label:'Website',  val:req.website},
                {label:'Business Type', val:req.businessType},
                {label:'Channel',  val:lead.lead_channel},
                {label:'Loss Reason', val:lead.status==='lost' ? lead.loss_reason : null, accent:'#ef4444'},
                {label:'Spam Reason', val:lead.status==='spam' ? lead.spam_reason : null, accent:C.grey},
              ].filter(r=>r.val).map(r=>(
                <div key={r.label} style={{ display:'flex', gap:10, marginBottom:7, alignItems:'baseline' }}>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, width:90, flexShrink:0, textTransform:'uppercase', letterSpacing:'0.06em' }}>{r.label}</span>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:r.accent||C.white, wordBreak:'break-all', fontWeight:r.accent?600:400 }}>{r.val}</span>
                </div>
              ))}
            </div>

            {/* Interests */}
            {req.interests?.length > 0 && (
              <div style={{ marginBottom:14 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.grey, marginBottom:7 }}>Interests</div>
                <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                  {req.interests.map(i=>(
                    <span key={i} style={{ fontSize:11, color:GOLD, background:GOLD_DIM, border:`1px solid ${GOLD}30`, borderRadius:10, padding:'3px 10px', fontFamily:'var(--font-body)' }}>{i}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            {lead.message && (
              <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'12px 14px' }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', color:C.grey, marginBottom:6 }}>Message</div>
                <pre style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, margin:0, whiteSpace:'pre-wrap', lineHeight:1.6 }}>{lead.message}</pre>
              </div>
            )}
          </>
        )}

        {/* NOTES section */}
        {activeSection==='notes' && (
          <div>
            {notes.length===0 ? (
              <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, marginBottom:16 }}>No notes yet.</p>
            ) : (
              <div style={{ marginBottom:16 }}>
                {notes.map(n=>(
                  <div key={n.id} style={{ borderLeft:`2px solid ${GOLD}`, paddingLeft:12, marginBottom:14 }}>
                    <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.white, margin:'0 0 3px', lineHeight:1.55 }}>{n.body}</p>
                    <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>
                      {new Date(n.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'})}
                    </span>
                  </div>
                ))}
              </div>
            )}
            <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} placeholder="Add a note..." rows={3}
              style={{ ...inS, width:'100%', resize:'vertical', lineHeight:1.6 }} />
            <button onClick={onAddNote} disabled={!noteText.trim()||noteSubmitting}
              style={{ marginTop:8, padding:'8px 20px', background:noteText.trim()?GOLD:'rgba(201,168,76,0.2)', color:noteText.trim()?'#000':C.grey, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', cursor:noteText.trim()?'pointer':'not-allowed', textTransform:'uppercase' }}>
              {noteSubmitting?'Saving...':'Add Note'}
            </button>
          </div>
        )}

        {/* HISTORY section */}
        {activeSection==='history' && (() => {
          const contactEvents = (leadEvents || [])
            .filter(e => e.lead_id === lead.id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          const evtDot = (type) => {
            if (type === 'status_changed') return '#c9a84c';
            if (type === 'note_added')     return '#06b6d4';
            if (type === 'created')        return '#16a34a';
            return C.grey;
          };
          const evtLabel = (e) => {
            const d = e.event_data || {};
            if (e.event_type === 'status_changed') {
              const st = d.new_status || '';
              const cfg = STATUS_CONFIG[st];
              return (
                <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, lineHeight:1.5 }}>
                  Status →{' '}
                  <span style={{ padding:'1px 8px', borderRadius:8, fontSize:11, fontWeight:600, background:cfg?.bg||C.border, color:cfg?.color||C.grey }}>
                    {cfg?.label || st}
                  </span>
                  {d.score != null && <span style={{ marginLeft:6, fontSize:11, color:C.grey }}>Score: {d.score}</span>}
                  {d.loss_reason && <span style={{ marginLeft:6, fontSize:11, color:'#ef4444' }}>({d.loss_reason})</span>}
                </span>
              );
            }
            return <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white }}>{e.event_label || e.event_type}</span>;
          };
          return (
            <div>
              {contactEvents.length === 0 ? (
                <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>No activity recorded yet.</p>
              ) : contactEvents.map(e => (
                <div key={e.id} style={{ display:'flex', gap:10, paddingBottom:14, marginBottom:14, borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ flexShrink:0, marginTop:4 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:evtDot(e.event_type) }} />
                  </div>
                  <div style={{ flex:1 }}>
                    {evtLabel(e)}
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:2 }}>
                      {new Date(e.created_at).toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          );
        })()}

        {/* TASKS section */}
        {activeSection==='tasks' && (
          <div>
            {/* Quick create */}
            <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'12px 14px', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:C.grey, marginBottom:8, textTransform:'uppercase', letterSpacing:'0.06em' }}>Quick Add Task</div>
              <input value={taskText} onChange={e=>setTaskText(e.target.value)} placeholder="Task description..."
                style={{ ...inS, marginBottom:8 }} onKeyDown={async e=>{
                  if (e.key==='Enter'&&taskText.trim()){
                    await onAddTask({text:taskText.trim(),dueDate:taskDue||null,leadId:lead.id});
                    setTaskText(''); setTaskDue('');
                  }
                }} />
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <input type="date" value={taskDue} onChange={e=>setTaskDue(e.target.value)} style={{ ...inS, flex:1 }} />
                <button onClick={async()=>{
                  if(!taskText.trim())return;
                  await onAddTask({text:taskText.trim(),dueDate:taskDue||null,leadId:lead.id});
                  setTaskText(''); setTaskDue('');
                }} style={{ padding:'7px 14px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, cursor:'pointer', flexShrink:0 }}>Add</button>
              </div>
            </div>

            {contactTasks.length===0 ? (
              <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>No tasks for this contact.</p>
            ) : contactTasks.sort((a,b)=>a.completed-b.completed).map(t => {
              const overdue = isOverdue(t);
              return (
                <div key={t.id} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'10px 0', borderBottom:`1px solid ${C.border}` }}>
                  <button onClick={()=>onCompleteTask(t)} style={{ width:18,height:18,borderRadius:3,border:`2px solid ${t.completed?STATUS_CONFIG.booked.color:C.border}`,background:t.completed?STATUS_CONFIG.booked.color:'transparent',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,marginTop:2 }}>
                    {t.completed && <span style={{ color:'#fff',fontSize:10 }}>✓</span>}
                  </button>
                  <div style={{ flex:1 }}>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:t.completed?C.grey:C.white, textDecoration:t.completed?'line-through':'none' }}>{t.text}</div>
                    {t.dueDate && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:overdue?'#ef4444':C.grey, marginTop:2 }}>Due: {new Date(t.dueDate).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ── New contact modal ──────────────────────────────────────────────────────
function NewContactModal({ C, onClose, onSave, onOpenExisting, existingLeads }) {
  const [form, setForm]     = useState({ firstName:'', lastName:'', email:'', phone:'', leadType:'manual', leadSource:'Admin CRM', notes:'' });
  const [saving, setSaving] = useState(false);
  const [duplicate, setDup] = useState(null); // null | { id, name, status }
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const checkEmail = (email) => {
    if (!email.includes('@')) { setDup(null); return; }
    const match = (existingLeads || []).find(l => l.email?.toLowerCase() === email.trim().toLowerCase());
    setDup(match ? { id: match.id, name: `${match.first_name||''} ${match.last_name||''}`.trim() || match.email, status: match.status } : null);
  };

  const handleSave = async () => {
    if (!form.firstName.trim()||!form.email.trim()) return;
    setSaving(true);
    try {
      const { createLead } = await import('../../services/leadEngineService');
      await createLead({ firstName:form.firstName, lastName:form.lastName, email:form.email, phone:form.phone||undefined, leadType:form.leadType, leadSource:form.leadSource, leadChannel:'manual', message:form.notes||undefined, consentDataProcessing:true });
      onSave();
    } catch(err) { /* save failed */ }
    finally { setSaving(false); }
  };

  const inS = { width:'100%', boxSizing:'border-box', padding:'9px 10px', fontFamily:'var(--font-body)', fontSize:13, color:C.white, background:C.card, border:`1px solid ${C.border}`, borderRadius:3, outline:'none', marginTop:4 };
  const labS = { fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase' };

  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.55)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center' }}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:'32px', width:480, maxWidth:'94vw', boxShadow:'0 20px 60px rgba(0,0,0,0.3)' }}>
        <h3 style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:600, color:C.white, margin:'0 0 24px' }}>New Contact</h3>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div><label style={labS}>First Name *</label><input value={form.firstName} onChange={e=>set('firstName',e.target.value)} style={inS} /></div>
          <div><label style={labS}>Last Name</label><input value={form.lastName} onChange={e=>set('lastName',e.target.value)} style={inS} /></div>
        </div>
        <div style={{ marginBottom: duplicate ? 8 : 14 }}>
          <label style={labS}>Email *</label>
          <input type="email" value={form.email}
            onChange={e=>{ set('email',e.target.value); setDup(null); }}
            onBlur={e=>checkEmail(e.target.value)}
            style={{ ...inS, borderColor: duplicate ? '#f59e0b' : undefined }} />
        </div>
        {duplicate && (
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', background:'rgba(245,158,11,0.08)', border:'1px solid rgba(245,158,11,0.3)', borderRadius:4, marginBottom:14 }}>
            <span style={{ fontSize:16 }}>⚠</span>
            <div style={{ flex:1 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'#f59e0b' }}>Contact already exists</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>{duplicate.name} · {STATUS_CONFIG[duplicate.status]?.label || duplicate.status}</div>
            </div>
            <button onClick={()=>{ onOpenExisting?.(duplicate.id); onClose(); }}
              style={{ padding:'5px 12px', background:'transparent', border:'1px solid #f59e0b', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:'#f59e0b', cursor:'pointer', flexShrink:0 }}>
              Open existing
            </button>
          </div>
        )}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14, marginBottom:14 }}>
          <div><label style={labS}>Phone</label><input value={form.phone} onChange={e=>set('phone',e.target.value)} style={inS} /></div>
          <div>
            <label style={labS}>Lead Type</label>
            <select value={form.leadType} onChange={e=>set('leadType',e.target.value)} style={{ ...inS, cursor:'pointer' }}>
              <option value="manual">Manual</option>
              <option value="partner_enquiry">Partner Enquiry</option>
              <option value="venue_enquiry">Venue Enquiry</option>
              <option value="couple_enquiry">Couple Enquiry</option>
            </select>
          </div>
        </div>
        <div style={{ marginBottom:20 }}>
          <label style={labS}>Notes</label>
          <textarea value={form.notes} onChange={e=>set('notes',e.target.value)} rows={3} style={{ ...inS, resize:'vertical', lineHeight:1.6 }} />
        </div>
        <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>Cancel</button>
          <button onClick={handleSave} disabled={!form.firstName.trim()||!form.email.trim()||saving}
            style={{ padding:'9px 24px', background:(form.firstName.trim()&&form.email.trim())?GOLD:'rgba(201,168,76,0.3)', color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            {saving ? 'Saving...' : duplicate ? 'Create anyway' : 'Create Contact'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main CRMModule ─────────────────────────────────────────────────────────
export default function CRMModule({ C }) {
  const [tab, setTab]                       = useState('dashboard');
  const [leads, setLeads]                   = useState([]);
  const [notes, setNotes]                   = useState([]);
  const [tasks, setTasks]                   = useState([]);
  const [leadEvents, setLeadEvents]         = useState([]);
  const [loading, setLoading]               = useState(true);
  const [lastFetched, setLastFetched]       = useState(null);
  const [selectedLead, setSelectedLead]     = useState(null);
  const [panelNotes, setPanelNotes]         = useState([]);
  const [noteText, setNoteText]             = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [showNewContact, setShowNewContact] = useState(false);
  const [newLeadsAvailable, setNewLeads]   = useState(false);
  const [panelEvents, setPanelEvents]      = useState([]);
  const leadsCountRef                      = useRef(0);

  const loadData = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      // Fetch leads via edge function (service_role — bypasses RLS)
      const [leadsResult, { data: msgsData }, { data: eventsData }] = await Promise.all([
        callLeadsEdge('list', { filters: { limit: 500, offset: 0 } }),
        import('../../lib/supabaseClient').then(({ supabase }) =>
          supabase.from('lead_messages').select('*').order('created_at', { ascending: false })
        ),
        import('../../lib/supabaseClient').then(({ supabase }) =>
          supabase.from('lead_events').select('*').order('created_at', { ascending: false }).limit(300)
        ),
      ]);
      const freshLeads = leadsResult.data?.leads || [];
      if (silent && freshLeads.length > leadsCountRef.current) {
        setNewLeads(true); // show indicator — don't replace state mid-session
      } else {
        setLeads(freshLeads);
        leadsCountRef.current = freshLeads.length;
        const msgs = msgsData || [];
        setNotes(msgs.filter(m => m.message_type === 'internal_note'));
        setTasks(msgs.filter(m => m.message_type === 'task').map(parseTask));
        setLeadEvents(eventsData || []);
        if (!silent) setLastFetched(new Date());
      }
    } catch (err) { console.error('[CRM] loadData failed:', err); }
    finally { if (!silent) setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  // 30-second polling — pauses when tab is hidden
  useEffect(() => {
    const poll = () => { if (!document.hidden) loadData(true); };
    const id = setInterval(poll, 30000);
    return () => clearInterval(id);
  }, [loadData]);

  const applyNewLeads = () => { setNewLeads(false); loadData(); };

  const loadPanelNotes = async (leadId) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data } = await supabase.from('lead_messages').select('id,body,created_at')
        .eq('lead_id', leadId).eq('message_type', 'internal_note').order('created_at', { ascending: true });
      setPanelNotes(data || []);
    } catch {}
  };

  const loadPanelEvents = async (leadId) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data } = await supabase.from('lead_events').select('*')
        .eq('lead_id', leadId).order('created_at', { ascending: false }).limit(100);
      setPanelEvents(data || []);
    } catch {}
  };

  const handleSelectContact = (lead) => {
    setSelectedLead(lead);
    setPanelNotes([]);
    setPanelEvents([]);
    loadPanelNotes(lead.id);
    loadPanelEvents(lead.id);
  };

  const handleStatusChange = async (leadId, newStatus, lossReason) => {
    try {
      // Route through edge function — bypasses RLS, handles score recompute + event logging server-side
      const result = await callLeadsEdge('update', {
        leadId,
        status: newStatus,
        ...(lossReason ? { lossReason } : {}),
      });

      if (!result.success) {
        console.error('[CRM] status change edge error:', result.error);
        return;
      }

      // Optimistic update from server-returned lead data
      const updated = result.data?.lead || {};
      setLeads(prev => prev.map(l => l.id===leadId ? { ...l, ...updated } : l));
      if (selectedLead?.id===leadId) setSelectedLead(prev => ({ ...prev, ...updated }));
    } catch (e) { console.error('[CRM] status change failed:', e); }
  };

  // Returns 'success' | 'duplicate' | 'error'
  const handleConvertToManaged = async (lead) => {
    try {
      const existing = await fetchManagedAccountByLeadId(lead.id);
      if (existing) {
        // Duplicate - account already exists, navigate to it
        window.dispatchEvent(new CustomEvent('lwd-nav', { detail: { tab: 'managed-accounts' } }));
        return 'duplicate';
      }
      const created = await convertLeadToManagedAccount(lead);
      if (!created) return 'error';
      // Mark CRM lead as booked if not already
      if (lead.status !== 'booked') {
        await handleStatusChange(lead.id, 'booked');
      }
      return 'success';
    } catch (err) {
      console.error('[CRM] handleConvertToManaged error:', err);
      return 'error';
    }
  };

  const handleDealValueChange = async (leadId, value) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const lead = leads.find(l=>l.id===leadId);
      const req  = { ...(lead?.requirements_json||{}), dealValue: value };
      await supabase.from('leads').update({ requirements_json: req }).eq('id', leadId);
      setLeads(prev => prev.map(l => l.id===leadId ? {...l, requirements_json:req} : l));
      if (selectedLead?.id===leadId) setSelectedLead(prev => ({...prev, requirements_json:req}));
    } catch (err) { /* deal value update failed */ }
  };

  const handleAddNote = async () => {
    if (!noteText.trim() || !selectedLead) return;
    setNoteSubmitting(true);
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data, error } = await supabase.from('lead_messages')
        .insert({ lead_id:selectedLead.id, message_type:'internal_note', body:noteText.trim() })
        .select('id,body,created_at').single();
      if (!error && data) {
        setPanelNotes(prev => [...prev, data]);
        setNotes(prev => [data, ...prev]);
        setNoteText('');
      }
    } catch {}
    finally { setNoteSubmitting(false); }
  };

  const handleCreateTask = async ({ text, dueDate, leadId }) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const body = JSON.stringify({ text, dueDate: dueDate||null, completed: false, completedAt: null });
      const { data } = await supabase.from('lead_messages')
        .insert({ lead_id: leadId, message_type: 'task', body })
        .select('id,lead_id,body,created_at').single();
      if (data) setTasks(prev => [...prev, parseTask(data)]);
    } catch (err) { /* task create failed */ }
  };

  const handleCompleteTask = async (task) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const newCompleted = !task.completed;
      const body = JSON.stringify({ text: task.text, dueDate: task.dueDate, completed: newCompleted, completedAt: newCompleted ? new Date().toISOString() : null });
      await supabase.from('lead_messages').update({ body }).eq('id', task.id);
      setTasks(prev => prev.map(t => t.id===task.id ? {...t, completed:newCompleted, completedAt:newCompleted?new Date().toISOString():null} : t));
    } catch (err) { /* task complete failed */ }
  };

  const handleDeleteTask = async (task) => {
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      await supabase.from('lead_messages').delete().eq('id', task.id);
      setTasks(prev => prev.filter(t => t.id !== task.id));
    } catch (err) { /* task delete failed */ }
  };

  const overdueTasks = tasks.filter(t => isOverdue(t)).length;

  if (loading) return (
    <div style={{ padding:'64px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:14, color:C.grey }}>
      Loading CRM data...
    </div>
  );

  return (
    <div style={{ position:'relative' }}>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:700, color:C.white, margin:0 }}>CRM</h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey, margin:'2px 0 0' }}>
            Contacts, pipeline and activity across all lead sources
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          {lastFetched && (
            <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'rgba(245,241,235,0.28)', letterSpacing:'0.3px', whiteSpace:'nowrap' }}>
              Updated {lastFetched.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' })}
              {' · '}
              {lastFetched.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })}
            </span>
          )}
          <button onClick={loadData} style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
            Refresh
          </button>
          <button onClick={() => setShowNewContact(true)} style={{ padding:'7px 16px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
            + New Contact
          </button>
        </div>
      </div>

      {newLeadsAvailable && (
        <div onClick={applyNewLeads} style={{ display:'flex', alignItems:'center', gap:8, padding:'8px 14px', background:`${GOLD}18`, border:`1px solid ${GOLD}50`, borderRadius:4, marginBottom:10, cursor:'pointer', fontFamily:'var(--font-body)', fontSize:12, color:GOLD, fontWeight:600 }}>
          <span style={{ fontSize:14 }}>↻</span> New leads available — click to refresh
          <span style={{ marginLeft:'auto', opacity:0.6, fontSize:11, fontWeight:400 }}>or wait for next auto-refresh</span>
        </div>
      )}

      <CRMTabBar tab={tab} setTab={setTab} C={C} overdueTasks={overdueTasks} />

      {tab==='dashboard' && <DashboardTab leads={leads} notes={notes} tasks={tasks} C={C} onSelectContact={handleSelectContact} />}
      {tab==='contacts'  && <ContactsTab  leads={leads} C={C} onSelectContact={handleSelectContact} onStatusChange={handleStatusChange} onCreateLead={()=>setShowNewContact(true)} />}
      {tab==='pipeline'  && <PipelineTab  leads={leads} C={C} onSelectContact={handleSelectContact} onStatusChange={handleStatusChange} />}
      {tab==='tasks'     && <TasksTab     tasks={tasks} leads={leads} C={C} onCompleteTask={handleCompleteTask} onCreateTask={handleCreateTask} onDeleteTask={handleDeleteTask} />}
      {tab==='activity'  && <ActivityTab  leads={leads} notes={notes} leadEvents={leadEvents} C={C} onSelectContact={handleSelectContact} />}

      {selectedLead && (
        <ContactPanel
          lead={selectedLead} C={C}
          onClose={() => setSelectedLead(null)}
          onStatusChange={handleStatusChange}
          onDealValueChange={handleDealValueChange}
          onConvert={handleConvertToManaged}
          notes={panelNotes}
          tasks={tasks}
          leadEvents={panelEvents}
          onAddNote={handleAddNote}
          onAddTask={handleCreateTask}
          onCompleteTask={handleCompleteTask}
          noteText={noteText}
          setNoteText={setNoteText}
          noteSubmitting={noteSubmitting}
        />
      )}

      {showNewContact && (
        <NewContactModal C={C}
          onClose={()=>setShowNewContact(false)}
          onSave={()=>{setShowNewContact(false);loadData();}}
          existingLeads={leads}
          onOpenExisting={(id)=>{
            const lead = leads.find(l=>l.id===id);
            if (lead) handleSelectContact(lead);
          }}
        />
      )}
    </div>
  );
}
