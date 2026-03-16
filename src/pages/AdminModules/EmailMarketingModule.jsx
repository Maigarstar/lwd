// ═══════════════════════════════════════════════════════════════════════════
// EmailMarketingModule — Marketing engine for Luxury Wedding Directory
// Tabs: Campaigns | Compose | Lists | Analytics
// Separate from CRM/Sales - this is the Marketing Hub
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback, useMemo } from 'react';

const GOLD     = '#c9a84c';
const GOLD_DIM = 'rgba(201,168,76,0.1)';

// ── Campaign status config ─────────────────────────────────────────────────
const CAMPAIGN_STATUS = {
  draft:     { label: 'Draft',     color: '#888',    bg: 'rgba(136,136,136,0.1)' },
  scheduled: { label: 'Scheduled', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  sent:      { label: 'Sent',      color: '#10b981', bg: 'rgba(16,185,129,0.1)'  },
  paused:    { label: 'Paused',    color: '#ef4444', bg: 'rgba(239,68,68,0.1)'   },
};

// ── Segment definitions ────────────────────────────────────────────────────
const SEGMENTS = [
  { key: 'all',              label: 'All Contacts',         desc: 'Every contact in your CRM' },
  { key: 'new',              label: 'New Leads',            desc: 'Status: New - not yet contacted' },
  { key: 'qualified',        label: 'Qualified Leads',      desc: 'Status: Qualified or Proposal' },
  { key: 'partner_enquiry',  label: 'Partner Enquiries',    desc: 'Venues and vendors from enquiry form' },
  { key: 'venue_enquiry',    label: 'Venue Enquiries',      desc: 'Couples from venue pages' },
  { key: 'converted',        label: 'Converted (Clients)',  desc: 'Status: Converted - paying clients' },
];

// ── Email templates ────────────────────────────────────────────────────────
const TEMPLATES = [
  {
    id: 'welcome',
    name: 'Welcome - New Partner',
    subject: 'Welcome to Luxury Wedding Directory',
    preview: 'Thank you for your interest in listing with us...',
    category: 'onboarding',
    body: `Hi {{first_name}},\n\nThank you for reaching out to Luxury Wedding Directory.\n\nWe'd love to learn more about your business and explore how we can showcase you to thousands of couples planning luxury weddings.\n\nOur team will be in touch shortly to discuss next steps.\n\nWarm regards,\nThe LWD Team`,
  },
  {
    id: 'follow_up',
    name: 'Follow-Up - No Response',
    subject: 'Following up on your enquiry',
    preview: "Just checking in on your interest in listing...",
    category: 'follow_up',
    body: `Hi {{first_name}},\n\nI wanted to follow up on your recent enquiry about listing your business with Luxury Wedding Directory.\n\nWe have a few listing options that would be a great fit for {{business_name}} - I'd love to walk you through them.\n\nWould you be available for a quick 15-minute call this week?\n\nBest,\nThe LWD Team`,
  },
  {
    id: 'proposal',
    name: 'Listing Proposal',
    subject: 'Your personalised listing proposal',
    preview: 'Here is your personalised proposal for featuring...',
    category: 'sales',
    body: `Hi {{first_name}},\n\nAs promised, here is your personalised proposal for featuring {{business_name}} on Luxury Wedding Directory.\n\nWe recommend our Featured Placement package which includes:\n- Premium listing placement\n- Professional editorial feature\n- Social media promotion\n- Quarterly performance reports\n\nI'd love to discuss this further. Please reply to this email or book a call using the link below.\n\nBest regards,\nThe LWD Team`,
  },
  {
    id: 'newsletter',
    name: 'Monthly Newsletter',
    subject: 'Luxury Wedding Directory - Monthly Update',
    preview: 'Latest news and updates from the directory...',
    category: 'newsletter',
    body: `Hi {{first_name}},\n\nHere is your monthly update from Luxury Wedding Directory.\n\n[FEATURED VENUES THIS MONTH]\n[INDUSTRY NEWS]\n[UPCOMING EVENTS]\n\nThank you for being part of our community.\n\nWarm regards,\nThe LWD Team`,
  },
  {
    id: 'win_back',
    name: 'Win Back - Lost Lead',
    subject: "We haven't forgotten about you",
    preview: "We'd love to give it another shot...",
    category: 'reengagement',
    body: `Hi {{first_name}},\n\nWe noticed we haven't connected in a while and wanted to reach out.\n\nWe've made significant improvements to our platform recently and would love to show you how Luxury Wedding Directory can help grow your business.\n\nWould you be open to a brief conversation?\n\nBest,\nThe LWD Team`,
  },
];

const CATEGORY_COLORS = {
  onboarding:   { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
  follow_up:    { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  sales:        { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
  newsletter:   { color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
  reengagement: { color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
};

// ── Mock campaign data (replace with Supabase when email_campaigns table exists) ──
const MOCK_CAMPAIGNS = [
  { id:'c1', name:'Partner Welcome Series', subject:'Welcome to Luxury Wedding Directory', segment:'partner_enquiry', template:'welcome', status:'sent', sentAt:'2026-03-10T10:00:00Z', recipients:24, opens:18, clicks:9, unsubscribes:0 },
  { id:'c2', name:'Q1 Follow-Up Push',       subject:'Following up on your enquiry',       segment:'new',           template:'follow_up', status:'sent', sentAt:'2026-03-05T09:00:00Z', recipients:31, opens:22, clicks:11, unsubscribes:1 },
  { id:'c3', name:'March Newsletter',        subject:'Luxury Wedding Directory - March',    segment:'all',           template:'newsletter', status:'sent', sentAt:'2026-03-01T08:00:00Z', recipients:87, opens:54, clicks:27, unsubscribes:2 },
  { id:'c4', name:'Win-Back Campaign',        subject:"We haven't forgotten about you",    segment:'qualified',     template:'win_back', status:'draft', sentAt:null, recipients:0, opens:0, clicks:0, unsubscribes:0 },
  { id:'c5', name:'April Newsletter',        subject:'Luxury Wedding Directory - April',    segment:'all',           template:'newsletter', status:'scheduled', scheduledAt:'2026-04-01T08:00:00Z', recipients:0, opens:0, clicks:0, unsubscribes:0 },
];

// ── Status badge ────────────────────────────────────────────────────────────
function CampaignBadge({ status }) {
  const cfg = CAMPAIGN_STATUS[status] || CAMPAIGN_STATUS.draft;
  return <span style={{ fontSize:10,fontWeight:600,letterSpacing:'0.08em',textTransform:'uppercase',color:cfg.color,background:cfg.bg,border:`1px solid ${cfg.color}40`,borderRadius:10,padding:'2px 8px',fontFamily:'var(--font-body)',whiteSpace:'nowrap' }}>{cfg.label}</span>;
}

// ── Metric pill ─────────────────────────────────────────────────────────────
function MetricPill({ label, value, color }) {
  return (
    <div style={{ textAlign:'center' }}>
      <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color: color||GOLD }}>{value}</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#888', letterSpacing:'0.06em', textTransform:'uppercase' }}>{label}</div>
    </div>
  );
}

// ── Tab bar ─────────────────────────────────────────────────────────────────
// ── Newsletter tab ──────────────────────────────────────────────────────────
const MOCK_SUBSCRIBERS = [
  { id:'s1', email:'sophie.hartley@test.com',   name:'Sophie Hartley',   source:'Venue Page',    status:'active',      subscribedAt:'2026-03-15T10:00:00Z' },
  { id:'s2', email:'james.carter@example.com',  name:'James Carter',     source:'Homepage',      status:'active',      subscribedAt:'2026-03-12T09:00:00Z' },
  { id:'s3', email:'alice.morgan@gmail.com',    name:'Alice Morgan',     source:'Blog Post',     status:'active',      subscribedAt:'2026-03-10T14:30:00Z' },
  { id:'s4', email:'tom.walsh@hotmail.com',     name:'Tom Walsh',        source:'Venue Page',    status:'unsubscribed', subscribedAt:'2026-03-05T11:00:00Z' },
  { id:'s5', email:'priya.sharma@outlook.com',  name:'Priya Sharma',     source:'Social Media',  status:'active',      subscribedAt:'2026-03-01T08:00:00Z' },
  { id:'s6', email:'charlotte.b@icloud.com',    name:'Charlotte Brown',  source:'Homepage',      status:'active',      subscribedAt:'2026-02-28T16:00:00Z' },
];

const MOCK_EDITIONS = [
  { id:'e1', subject:'The Spring Edit: Venues Opening for 2027', sentAt:'2026-03-01T08:00:00Z', subscribers:312, opens:198, clicks:94 },
  { id:'e2', subject:'10 Venues You Need to See Right Now',      sentAt:'2026-02-01T08:00:00Z', subscribers:298, opens:172, clicks:81 },
  { id:'e3', subject:'Real Wedding: Tuscany in Late Summer',     sentAt:'2026-01-05T08:00:00Z', subscribers:284, opens:160, clicks:72 },
];

function NewsletterTab({ C, onCompose }) {
  const [view, setView] = useState('overview'); // overview | subscribers
  const [search, setSearch] = useState('');
  const [subscribers, setSubscribers] = useState(MOCK_SUBSCRIBERS);

  const activeCount = subscribers.filter(s=>s.status==='active').length;
  const unsubCount  = subscribers.filter(s=>s.status==='unsubscribed').length;
  const growthRate  = '+12%'; // mock

  const filtered = subscribers.filter(s => {
    const q = search.toLowerCase();
    return !q || s.email.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
  });

  const Card = ({ label, value, sub, color }) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'18px 20px' }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:6 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-heading)', fontSize:26, fontWeight:700, color:color||GOLD, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:5 }}>{sub}</div>}
    </div>
  );

  const tabBtn = (key, label) => (
    <button key={key} onClick={()=>setView(key)} style={{
      padding:'7px 16px', border:`1px solid ${view===key?GOLD:C.border}`, borderRadius:3,
      background: view===key?GOLD_DIM:'transparent',
      fontFamily:'var(--font-body)', fontSize:11, fontWeight:view===key?600:400,
      color: view===key?GOLD:C.grey, cursor:'pointer',
    }}>{label}</button>
  );

  return (
    <div>
      <div style={{ display:'flex', gap:8, marginBottom:24, alignItems:'center' }}>
        {tabBtn('overview', 'Overview')}
        {tabBtn('subscribers', `Subscribers (${activeCount})`)}
        <button onClick={onCompose} style={{ marginLeft:'auto', padding:'7px 16px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
          + New Edition
        </button>
      </div>

      {view === 'overview' && (
        <div>
          {/* Stats */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14, marginBottom:24 }}>
            <Card label="Active Subscribers" value={activeCount} sub="Opted-in readers" />
            <Card label="Growth (30 days)" value={growthRate} sub="vs previous month" color="#10b981" />
            <Card label="Avg Open Rate" value="63%" sub="Industry avg: 25%" color="#10b981" />
            <Card label="Unsubscribed" value={unsubCount} sub="All time" color={unsubCount>0?'#f59e0b':C.grey} />
          </div>

          {/* Past editions */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px', marginBottom:20 }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase' }}>Past Editions</div>
              <button onClick={onCompose} style={{ padding:'5px 12px', background:'transparent', border:`1px solid ${GOLD}`, color:GOLD, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, cursor:'pointer' }}>+ New Edition</button>
            </div>
            {MOCK_EDITIONS.map(e => {
              const or = Math.round((e.opens/e.subscribers)*100);
              const cr = Math.round((e.clicks/e.subscribers)*100);
              return (
                <div key={e.id} style={{ display:'flex', alignItems:'center', gap:16, padding:'12px 0', borderBottom:`1px solid ${C.border}` }}>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:C.white, marginBottom:2 }}>{e.subject}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>
                      Sent {new Date(e.sentAt).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'})} - {e.subscribers} subscribers
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:20, flexShrink:0 }}>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:or>=40?'#10b981':GOLD }}>{or}%</div>
                      <div style={{ fontFamily:'var(--font-body)', fontSize:9, color:C.grey, textTransform:'uppercase', letterSpacing:'0.06em' }}>Opens</div>
                    </div>
                    <div style={{ textAlign:'center' }}>
                      <div style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:cr>=10?'#10b981':GOLD }}>{cr}%</div>
                      <div style={{ fontFamily:'var(--font-body)', fontSize:9, color:C.grey, textTransform:'uppercase', letterSpacing:'0.06em' }}>Clicks</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Signup sources */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:14 }}>Signup Sources</div>
            {[['Venue Page','38%'],['Homepage','26%'],['Blog Post','18%'],['Social Media','12%'],['Other','6%']].map(([src,pct])=>(
              <div key={src} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.white, flex:1 }}>{src}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:GOLD, width:36, textAlign:'right' }}>{pct}</div>
                <div style={{ width:80, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:pct, background:GOLD, borderRadius:2 }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {view === 'subscribers' && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16, alignItems:'center' }}>
            <div style={{ position:'relative', flex:'1 1 220px' }}>
              <span style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:C.grey, fontSize:13 }}>⊛</span>
              <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search subscribers..."
                style={{ width:'100%', boxSizing:'border-box', padding:'8px 10px 8px 28px', background:C.card, border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:13, color:C.white, outline:'none' }} />
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{activeCount} active</div>
          </div>

          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, overflow:'hidden' }}>
            <table style={{ width:'100%', borderCollapse:'collapse' }}>
              <thead style={{ background:C.border }}>
                <tr>
                  {['Name','Email','Source','Status','Subscribed'].map(h=>(
                    <th key={h} style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'left', padding:'9px 14px' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:C.white }}>{s.name}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{s.email}</td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{s.source}</td>
                    <td style={{ padding:'10px 14px' }}>
                      <span style={{ fontSize:10, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', color:s.status==='active'?'#10b981':'#888', background:s.status==='active'?'rgba(16,185,129,0.1)':'rgba(136,136,136,0.1)', border:`1px solid ${s.status==='active'?'#10b98140':'#88888840'}`, borderRadius:10, padding:'2px 8px', fontFamily:'var(--font-body)' }}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ padding:'10px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>
                      {new Date(s.subscribedAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function EMTabBar({ tab, setTab, C }) {
  const tabs = [
    { key:'campaigns',   label:'Campaigns',   icon:'◉' },
    { key:'newsletter',  label:'Newsletter',  icon:'✉' },
    { key:'compose',     label:'Compose',     icon:'✎' },
    { key:'lists',       label:'Lists',       icon:'⊞' },
    { key:'analytics',   label:'Analytics',   icon:'◈' },
  ];
  return (
    <div style={{ display:'flex', gap:0, borderBottom:`1px solid ${C.border}`, marginBottom:28 }}>
      {tabs.map(t => (
        <button key={t.key} onClick={() => setTab(t.key)} style={{
          padding:'10px 20px', border:'none', cursor:'pointer', background:'transparent',
          borderBottom: tab===t.key ? `2px solid ${GOLD}` : '2px solid transparent',
          fontFamily:'var(--font-body)', fontSize:12, fontWeight: tab===t.key ? 600 : 400,
          color: tab===t.key ? GOLD : C.grey, letterSpacing:'0.04em', transition:'all 0.15s', marginBottom:-1,
        }}>
          <span style={{ marginRight:6, fontSize:10 }}>{t.icon}</span>
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ── Campaigns tab ───────────────────────────────────────────────────────────
function CampaignsTab({ campaigns, C, onCompose, onEdit }) {
  const [statusFilter, setStatusFilter] = useState('all');

  const filtered = statusFilter==='all' ? campaigns : campaigns.filter(c=>c.status===statusFilter);

  const inS = { padding:'7px 12px', background:C.card, border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.white, cursor:'pointer', outline:'none' };

  return (
    <div>
      <div style={{ display:'flex', gap:10, marginBottom:20, alignItems:'center' }}>
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)} style={inS}>
          <option value="all">All Campaigns</option>
          {Object.entries(CAMPAIGN_STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <div style={{ marginLeft:'auto', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{filtered.length} campaigns</div>
        <button onClick={onCompose} style={{ padding:'8px 18px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
          + New Campaign
        </button>
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {filtered.map(c => {
          const openRate  = c.recipients > 0 ? Math.round((c.opens/c.recipients)*100) : 0;
          const clickRate = c.recipients > 0 ? Math.round((c.clicks/c.recipients)*100) : 0;
          const seg = SEGMENTS.find(s=>s.key===c.segment);
          return (
            <div key={c.id} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'18px 20px', cursor:'pointer' }}
              onClick={()=>onEdit(c)}
              onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD+'60'}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, color:C.white, marginBottom:3 }}>{c.name}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, marginBottom:6 }}>{c.subject}</div>
                  <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
                    <CampaignBadge status={c.status} />
                    {seg && <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, background:C.border, borderRadius:8, padding:'1px 8px' }}>{seg.label}</span>}
                    {c.sentAt && <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>Sent {new Date(c.sentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>}
                    {c.scheduledAt && !c.sentAt && <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:CAMPAIGN_STATUS.scheduled.color }}>Scheduled: {new Date(c.scheduledAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}</span>}
                  </div>
                </div>

                {c.status==='sent' && c.recipients > 0 && (
                  <div style={{ display:'flex', gap:24, alignItems:'center', marginLeft:20, flexShrink:0 }}>
                    <MetricPill label="Sent" value={c.recipients} />
                    <MetricPill label="Open Rate" value={`${openRate}%`} color={openRate>=40?'#10b981':openRate>=20?GOLD:'#ef4444'} />
                    <MetricPill label="Click Rate" value={`${clickRate}%`} color={clickRate>=10?'#10b981':clickRate>=5?GOLD:'#ef4444'} />
                    {c.unsubscribes > 0 && <MetricPill label="Unsubs" value={c.unsubscribes} color="#ef4444" />}
                  </div>
                )}

                {c.status==='draft' && (
                  <button onClick={e=>{e.stopPropagation();onEdit(c);}} style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${GOLD}`, color:GOLD, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, cursor:'pointer' }}>
                    Edit Draft
                  </button>
                )}
              </div>

              {c.status==='sent' && c.recipients > 0 && (
                <div style={{ marginTop:12, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${openRate}%`, background:GOLD, borderRadius:2, transition:'width 0.4s' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Compose tab ─────────────────────────────────────────────────────────────
function ComposeTab({ leads, C, onCampaignSaved }) {
  const [step, setStep] = useState(1); // 1=setup, 2=content, 3=review
  const [form, setForm] = useState({
    name: '', subject: '', segment: 'all', template: '',
    body: '', scheduleDate: '', scheduleTime: '',
  });
  const [preview, setPreview] = useState(null);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const recipientCount = useMemo(() => {
    if (form.segment==='all') return leads.length;
    if (form.segment==='new') return leads.filter(l=>!l.status||l.status==='new').length;
    if (form.segment==='qualified') return leads.filter(l=>l.status==='qualified'||l.status==='proposal').length;
    if (form.segment==='partner_enquiry') return leads.filter(l=>l.lead_source==='Partner Enquiry Form').length;
    if (form.segment==='venue_enquiry') return leads.filter(l=>l.lead_source?.toLowerCase().includes('venue')).length;
    if (form.segment==='converted') return leads.filter(l=>l.status==='converted').length;
    return 0;
  }, [leads, form.segment]);

  const loadTemplate = (templateId) => {
    const t = TEMPLATES.find(t=>t.id===templateId);
    if (t) {
      set('template', templateId);
      set('subject',  t.subject);
      set('body',     t.body);
    }
  };

  const inS = { width:'100%', boxSizing:'border-box', padding:'9px 10px', fontFamily:'var(--font-body)', fontSize:13, color:C.white, background:C.card, border:`1px solid ${C.border}`, borderRadius:3, outline:'none' };
  const labS = { display:'block', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:5 };

  const Steps = () => (
    <div style={{ display:'flex', gap:0, marginBottom:28, borderBottom:`1px solid ${C.border}` }}>
      {[{n:1,l:'Setup'},{n:2,l:'Content'},{n:3,l:'Review'}].map(s=>(
        <button key={s.n} onClick={()=>setStep(s.n)} style={{
          padding:'10px 20px', border:'none', cursor:'pointer', background:'transparent',
          borderBottom: step===s.n?`2px solid ${GOLD}`:'2px solid transparent',
          fontFamily:'var(--font-body)', fontSize:12, fontWeight:step===s.n?600:400,
          color:step===s.n?GOLD:C.grey, marginBottom:-1,
        }}>
          <span style={{ display:'inline-flex',alignItems:'center',justifyContent:'center',width:18,height:18,borderRadius:'50%',background:step===s.n?GOLD:C.border,color:step===s.n?'#000':C.grey,fontSize:10,fontWeight:700,marginRight:8 }}>{s.n}</span>
          {s.l}
        </button>
      ))}
    </div>
  );

  return (
    <div style={{ maxWidth:760 }}>
      <Steps />

      {/* Step 1: Setup */}
      {step===1 && (
        <div>
          <div style={{ marginBottom:18 }}>
            <label style={labS}>Campaign Name *</label>
            <input value={form.name} onChange={e=>set('name',e.target.value)} placeholder="e.g. Q2 Partner Follow-Up" style={inS} />
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={labS}>Subject Line *</label>
            <input value={form.subject} onChange={e=>set('subject',e.target.value)} placeholder="Email subject..." style={inS} />
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:form.subject.length>60?'#ef4444':C.grey, marginTop:4, textAlign:'right' }}>
              {form.subject.length}/60 chars {form.subject.length>60&&'(too long - aim for under 60)'}
            </div>
          </div>
          <div style={{ marginBottom:18 }}>
            <label style={labS}>Audience Segment *</label>
            <select value={form.segment} onChange={e=>set('segment',e.target.value)} style={{ ...inS, cursor:'pointer' }}>
              {SEGMENTS.map(s=><option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
            {form.segment && (
              <div style={{ marginTop:8, padding:'10px 12px', background:GOLD_DIM, border:`1px solid ${GOLD}30`, borderRadius:3 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:GOLD }}>
                  {SEGMENTS.find(s=>s.key===form.segment)?.desc}
                </div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:GOLD, marginTop:4 }}>
                  {recipientCount} recipients
                </div>
              </div>
            )}
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labS}>Schedule (optional)</label>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <input type="date" value={form.scheduleDate} onChange={e=>set('scheduleDate',e.target.value)} style={inS} />
              <input type="time" value={form.scheduleTime} onChange={e=>set('scheduleTime',e.target.value)} style={inS} />
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:5 }}>Leave blank to save as draft</div>
          </div>
          <button onClick={()=>setStep(2)} disabled={!form.name.trim()||!form.subject.trim()}
            style={{ padding:'10px 28px', background:(form.name.trim()&&form.subject.trim())?GOLD:'rgba(201,168,76,0.3)', color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
            Next: Content
          </button>
        </div>
      )}

      {/* Step 2: Content */}
      {step===2 && (
        <div>
          <div style={{ marginBottom:18 }}>
            <label style={labS}>Start from a template</label>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(200px, 1fr))', gap:10 }}>
              {TEMPLATES.map(t => {
                const catCfg = CATEGORY_COLORS[t.category] || {};
                const isActive = form.template === t.id;
                return (
                  <div key={t.id} onClick={()=>loadTemplate(t.id)}
                    style={{ padding:'12px 14px', background:C.card, border:`1px solid ${isActive?GOLD:C.border}`, borderRadius:4, cursor:'pointer', transition:'border-color 0.15s' }}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD+'60'}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=isActive?GOLD:C.border}>
                    <div style={{ fontSize:11, color:catCfg.color||GOLD, background:catCfg.bg||GOLD_DIM, borderRadius:8, padding:'1px 8px', display:'inline-block', fontFamily:'var(--font-body)', fontWeight:600, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:6 }}>
                      {t.category.replace(/_/g,' ')}
                    </div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:C.white, marginBottom:3 }}>{t.name}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>{t.preview}</div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={labS}>Email Body *</label>
            <textarea value={form.body} onChange={e=>set('body',e.target.value)} rows={14}
              placeholder="Write your email... Use {{first_name}}, {{business_name}} for personalisation."
              style={{ ...inS, resize:'vertical', lineHeight:1.7, fontFamily:'monospace', fontSize:12 }} />
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:5 }}>
              Personalisation tokens: <code style={{color:GOLD}}>{'{{first_name}}'}</code> <code style={{color:GOLD}}>{'{{business_name}}'}</code>
            </div>
          </div>

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={()=>setStep(1)} style={{ padding:'10px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>Back</button>
            <button onClick={()=>setStep(3)} disabled={!form.body.trim()}
              style={{ padding:'10px 28px', background:form.body.trim()?GOLD:'rgba(201,168,76,0.3)', color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:'pointer' }}>
              Next: Review
            </button>
          </div>
        </div>
      )}

      {/* Step 3: Review */}
      {step===3 && (
        <div>
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 24px', marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:16 }}>Campaign Summary</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
              {[
                {label:'Name',       val:form.name},
                {label:'Subject',    val:form.subject},
                {label:'Audience',   val:`${SEGMENTS.find(s=>s.key===form.segment)?.label} (${recipientCount} contacts)`},
                {label:'Schedule',   val:form.scheduleDate?`${form.scheduleDate} at ${form.scheduleTime||'08:00'}`:'Send as draft'},
                {label:'Template',   val:TEMPLATES.find(t=>t.id===form.template)?.name||'Custom'},
              ].map(r=>(
                <div key={r.label}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:C.grey, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>{r.label}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.white }}>{r.val}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Email preview */}
          <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 24px', marginBottom:20 }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Email Preview</div>
            <div style={{ background:'#fff', border:'1px solid #e5e7eb', borderRadius:4, padding:'24px', fontFamily:"'Georgia', serif" }}>
              <div style={{ borderBottom:'2px solid #c9a84c', paddingBottom:12, marginBottom:16 }}>
                <div style={{ fontSize:10, color:'#888', fontFamily:'Arial,sans-serif', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:6 }}>From: Luxury Wedding Directory</div>
                <div style={{ fontSize:13, color:'#333', fontFamily:'Arial,sans-serif' }}>Subject: {form.subject}</div>
              </div>
              <pre style={{ fontFamily:"'Georgia', Georgia, serif", fontSize:14, color:'#171717', lineHeight:1.8, margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>
                {form.body.replace('{{first_name}}','[First Name]').replace('{{business_name}}','[Business]')}
              </pre>
              <div style={{ marginTop:24, paddingTop:16, borderTop:'1px solid #e5e7eb', fontSize:11, color:'#888', fontFamily:'Arial,sans-serif', lineHeight:1.8 }}>
                Luxury Wedding Directory | london@luxuryweddingdirectory.com<br/>
                <a href="#" style={{ color:'#c9a84c' }}>Unsubscribe</a> - You received this because you opted in to updates.
              </div>
            </div>
          </div>

          <div style={{ display:'flex', gap:10, alignItems:'center' }}>
            <button onClick={()=>setStep(2)} style={{ padding:'10px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>Back</button>
            <button onClick={()=>{ onCampaignSaved({...form, status:'draft'}); setForm({name:'',subject:'',segment:'all',template:'',body:'',scheduleDate:'',scheduleTime:''}); setStep(1); }}
              style={{ padding:'10px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>
              Save as Draft
            </button>
            <button onClick={()=>{ onCampaignSaved({...form, status:form.scheduleDate?'scheduled':'draft'}); setForm({name:'',subject:'',segment:'all',template:'',body:'',scheduleDate:'',scheduleTime:''}); setStep(1); }}
              style={{ padding:'10px 28px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:'pointer', letterSpacing:'0.06em' }}>
              {form.scheduleDate ? 'Schedule Campaign' : 'Save Campaign'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Lists tab ───────────────────────────────────────────────────────────────
function ListsTab({ leads, C }) {
  const segments = SEGMENTS.map(seg => {
    let filtered = leads;
    if (seg.key==='new')             filtered = leads.filter(l=>!l.status||l.status==='new');
    if (seg.key==='qualified')       filtered = leads.filter(l=>l.status==='qualified'||l.status==='proposal');
    if (seg.key==='partner_enquiry') filtered = leads.filter(l=>l.lead_source==='Partner Enquiry Form');
    if (seg.key==='venue_enquiry')   filtered = leads.filter(l=>l.lead_source?.toLowerCase().includes('venue'));
    if (seg.key==='converted')       filtered = leads.filter(l=>l.status==='converted');
    return { ...seg, count: filtered.length, contacts: filtered };
  });

  const [expanded, setExpanded] = useState(null);

  return (
    <div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey, marginBottom:20 }}>
        Audience segments are built automatically from your CRM contacts. Every contact in your database is automatically assigned to the relevant segments based on their status and source.
      </div>

      <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
        {segments.map(seg => (
          <div key={seg.key} style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', gap:16, padding:'16px 20px', cursor:'pointer' }}
              onClick={()=>setExpanded(expanded===seg.key?null:seg.key)}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:14, fontWeight:600, color:C.white, marginBottom:2 }}>{seg.label}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{seg.desc}</div>
              </div>
              <div style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:700, color:GOLD, flexShrink:0 }}>{seg.count}</div>
              <span style={{ color:C.grey, fontSize:12 }}>{expanded===seg.key?'▲':'▼'}</span>
            </div>

            {expanded===seg.key && seg.contacts.length > 0 && (
              <div style={{ borderTop:`1px solid ${C.border}` }}>
                <table style={{ width:'100%', borderCollapse:'collapse' }}>
                  <thead style={{ background:C.border }}>
                    <tr>
                      {['Name','Email','Status','Added'].map(h=>(
                        <th key={h} style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'left', padding:'8px 14px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {seg.contacts.slice(0,10).map(l=>(
                      <tr key={l.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.white }}>{l.first_name} {l.last_name}</td>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{l.email}</td>
                        <td style={{ padding:'9px 14px' }}>
                          <span style={{ fontSize:10, fontWeight:600, color:'#888', background:C.border, borderRadius:8, padding:'1px 7px', fontFamily:'var(--font-body)', textTransform:'uppercase', letterSpacing:'0.06em' }}>{l.status||'new'}</span>
                        </td>
                        <td style={{ padding:'9px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>{new Date(l.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'2-digit'})}</td>
                      </tr>
                    ))}
                    {seg.contacts.length > 10 && (
                      <tr><td colSpan={4} style={{ padding:'10px 14px', fontFamily:'var(--font-body)', fontSize:12, color:C.grey, textAlign:'center' }}>+{seg.contacts.length-10} more contacts</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Analytics tab ───────────────────────────────────────────────────────────
function AnalyticsTab({ campaigns, C }) {
  const sentCampaigns = campaigns.filter(c=>c.status==='sent'&&c.recipients>0);
  const totalSent     = sentCampaigns.reduce((s,c)=>s+c.recipients,0);
  const totalOpens    = sentCampaigns.reduce((s,c)=>s+c.opens,0);
  const totalClicks   = sentCampaigns.reduce((s,c)=>s+c.clicks,0);
  const totalUnsubs   = sentCampaigns.reduce((s,c)=>s+c.unsubscribes,0);
  const avgOpenRate   = totalSent > 0 ? Math.round((totalOpens/totalSent)*100) : 0;
  const avgClickRate  = totalSent > 0 ? Math.round((totalClicks/totalSent)*100) : 0;

  // Industry benchmarks
  const benchmarks = { openRate: 25, clickRate: 3 };

  const Card = ({label, value, sub, color, benchmark, benchmarkLabel}) => (
    <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:8 }}>{label}</div>
      <div style={{ fontFamily:'var(--font-heading)', fontSize:30, fontWeight:700, color:color||GOLD, lineHeight:1 }}>{value}</div>
      {sub && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:5 }}>{sub}</div>}
      {benchmark !== undefined && (
        <div style={{ marginTop:8, fontFamily:'var(--font-body)', fontSize:11, color: parseInt(value) >= benchmark ? '#10b981' : '#ef4444' }}>
          {parseInt(value) >= benchmark ? '↑ Above' : '↓ Below'} industry avg ({benchmark}%)
        </div>
      )}
    </div>
  );

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:16, marginBottom:28 }}>
        <Card label="Total Sent" value={totalSent} sub={`${sentCampaigns.length} campaigns`} />
        <Card label="Avg Open Rate" value={`${avgOpenRate}%`} sub={`${totalOpens} total opens`} benchmark={benchmarks.openRate} benchmarkLabel="industry avg" />
        <Card label="Avg Click Rate" value={`${avgClickRate}%`} sub={`${totalClicks} total clicks`} benchmark={benchmarks.clickRate} />
        <Card label="Unsubscribes" value={totalUnsubs} sub={`${totalSent>0?((totalUnsubs/totalSent)*100).toFixed(2):0}% of sent`} color={totalUnsubs>0?'#ef4444':C.grey} />
      </div>

      {/* Per-campaign breakdown */}
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'20px 22px' }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.white, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:16 }}>Campaign Performance</div>
        {sentCampaigns.length === 0 ? (
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>No sent campaigns yet.</p>
        ) : (
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead>
              <tr>
                {['Campaign','Sent','Opens','Open Rate','Clicks','Click Rate','Date'].map(h=>(
                  <th key={h} style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', textAlign:'left', padding:'0 12px 10px 0', borderBottom:`1px solid ${C.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sentCampaigns.map(c => {
                const or = Math.round((c.opens/c.recipients)*100);
                const cr = Math.round((c.clicks/c.recipients)*100);
                return (
                  <tr key={c.id} style={{ borderBottom:`1px solid ${C.border}` }}>
                    <td style={{ padding:'11px 12px 11px 0', fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color:C.white }}>{c.name}</td>
                    <td style={{ padding:'11px 12px 11px 0', fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>{c.recipients}</td>
                    <td style={{ padding:'11px 12px 11px 0', fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>{c.opens}</td>
                    <td style={{ padding:'11px 12px 11px 0' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <span style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:or>=benchmarks.openRate?'#10b981':GOLD }}>{or}%</span>
                        <div style={{ width:60, height:4, background:C.border, borderRadius:2, overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${or}%`, background:or>=benchmarks.openRate?'#10b981':GOLD, borderRadius:2 }} />
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'11px 12px 11px 0', fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>{c.clicks}</td>
                    <td style={{ padding:'11px 12px 11px 0' }}>
                      <span style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:600, color:cr>=benchmarks.clickRate?'#10b981':GOLD }}>{cr}%</span>
                    </td>
                    <td style={{ padding:'11px 0', fontFamily:'var(--font-body)', fontSize:12, color:C.grey }}>
                      {new Date(c.sentAt).toLocaleDateString('en-GB',{day:'numeric',month:'short'})}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Benchmark note */}
      <div style={{ marginTop:20, padding:'12px 16px', background:GOLD_DIM, border:`1px solid ${GOLD}30`, borderRadius:4, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, lineHeight:1.6 }}>
        Industry benchmarks: Open rate ~25% (good: 40%+), Click rate ~3% (good: 10%+), Unsubscribe rate below 0.5%. Luxury/B2B niches typically outperform these averages.
      </div>
    </div>
  );
}

// ── Main EmailMarketingModule ────────────────────────────────────────────────
export default function EmailMarketingModule({ C, defaultTab, onNavigate }) {
  const [tab, setTab]             = useState(defaultTab || 'campaigns');
  const [leads, setLeads]         = useState([]);
  const [campaigns, setCampaigns] = useState(MOCK_CAMPAIGNS);
  const [loading, setLoading]     = useState(true);
  const [editCampaign, setEditCampaign] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data } = await supabase.from('leads').select('id,first_name,last_name,email,phone,lead_source,lead_type,status,requirements_json,created_at').order('created_at',{ascending:false});
        setLeads(data||[]);
      } catch { setLeads([]); }
      finally { setLoading(false); }
    })();
  }, []);

  const handleCampaignSaved = (campaign) => {
    const newCampaign = { ...campaign, id: `c${Date.now()}`, sentAt:null, recipients:0, opens:0, clicks:0, unsubscribes:0 };
    setCampaigns(prev => [newCampaign, ...prev]);
    setTab('campaigns');
  };

  if (loading) return (
    <div style={{ padding:'64px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:14, color:C.grey }}>
      Loading email marketing data...
    </div>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:4 }}>
        <div>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:700, color:C.white, margin:0 }}>Email Marketing</h1>
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey, margin:'2px 0 0' }}>
            Campaigns, templates and audience management
          </p>
        </div>
        <div style={{ display:'flex', gap:10, alignItems:'center' }}>
          <div style={{ padding:'6px 14px', background:GOLD_DIM, border:`1px solid ${GOLD}30`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:GOLD }}>
            {leads.length} contacts in CRM
          </div>
          {onNavigate && (
            <button onClick={()=>onNavigate('email-builder')} style={{ padding:'7px 14px', background:'transparent', border:`1px solid ${GOLD}50`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.06em', color:GOLD, cursor:'pointer' }}>
              Visual Builder ✎
            </button>
          )}
          <button onClick={()=>setTab('compose')} style={{ padding:'7px 16px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', cursor:'pointer' }}>
            + New Campaign
          </button>
        </div>
      </div>

      <EMTabBar tab={tab} setTab={setTab} C={C} />

      {tab==='campaigns'  && <CampaignsTab  campaigns={campaigns} C={C} onCompose={()=>setTab('compose')} onEdit={c=>{setEditCampaign(c);setTab('compose');}} />}
      {tab==='newsletter' && <NewsletterTab C={C} onCompose={()=>setTab('compose')} />}
      {tab==='compose'    && <ComposeTab    leads={leads} C={C} onCampaignSaved={handleCampaignSaved} />}
      {tab==='lists'      && <ListsTab      leads={leads} C={C} />}
      {tab==='analytics'  && <AnalyticsTab  campaigns={campaigns} C={C} />}
    </div>
  );
}
