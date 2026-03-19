import { useState, useRef, useCallback, useEffect } from 'react';
import { sendEmail, fetchNewsletterSubscribers } from '../../services/emailSendService';

const GOLD      = '#8f7420';
const GOLD_DIM  = 'rgba(143,116,32,0.09)';
const GOLD_BDR  = 'rgba(143,116,32,0.30)';

// ── Block catalogue ───────────────────────────────────────────────────────────
const BLOCK_DEFS = [
  { type:'header',  label:'Header',    icon:'▤', cat:'Structure', desc:'Logo + top bar' },
  { type:'hero',    label:'Hero',      icon:'▨', cat:'Media',     desc:'Full-width banner' },
  { type:'heading', label:'Heading',   icon:'T',  cat:'Content',   desc:'Section title' },
  { type:'text',    label:'Text',      icon:'≡',  cat:'Content',   desc:'Body paragraph' },
  { type:'image',   label:'Image',     icon:'⊞',  cat:'Media',     desc:'Image + caption' },
  { type:'button',  label:'Button',    icon:'⊡',  cat:'Content',   desc:'Call to action' },
  { type:'columns', label:'2 Columns', icon:'⊟',  cat:'Layout',    desc:'Side by side' },
  { type:'divider', label:'Divider',   icon:'─',  cat:'Layout',    desc:'Horizontal rule' },
  { type:'spacer',  label:'Spacer',    icon:'↕',  cat:'Layout',    desc:'Vertical gap' },
  { type:'social',  label:'Social',    icon:'◎',  cat:'Structure', desc:'Social icons' },
  { type:'footer',  label:'Footer',    icon:'▥',  cat:'Structure', desc:'Footer + unsub' },
];
const CATS = ['Content','Media','Layout','Structure'];

let _uid = Date.now();
const nextId = () => `b${++_uid}`;

function defaultProps(type) {
  switch (type) {
    case 'header':  return { logoUrl:'', logoText:'LWD', background:'#ffffff', textColor:'#171717' };
    case 'hero':    return { imageUrl:'', headline:'Your Headline Here', subtext:'A compelling subtitle for your audience.', ctaLabel:'Learn More', ctaUrl:'#', showCta:true, background:'#1a1a1a', textColor:'#ffffff', textAlign:'center', minHeight:280 };
    case 'heading': return { text:'Section Heading', align:'left', color:'#171717', serif:true, fontSize:26 };
    case 'text':    return { content:'Your paragraph text goes here. Keep it concise and engaging — 2 to 4 sentences works best for email.', align:'left', color:'#444444', fontSize:15, lineHeight:1.8 };
    case 'image':   return { url:'', alt:'', caption:'', borderRadius:0 };
    case 'button':  return { label:'Get Started', url:'#', background:'#8f7420', color:'#ffffff', align:'center', borderRadius:2, paddingH:32, paddingV:13, fontSize:12 };
    case 'columns': return { leftHead:'First Feature', leftText:'Describe your first highlight here.', rightHead:'Second Feature', rightText:'Describe your second highlight here.', leftImg:'', rightImg:'', background:'#ffffff' };
    case 'divider': return { color:'#e0d9cc', thickness:1, marginTop:20, marginBottom:20 };
    case 'spacer':  return { height:40 };
    case 'social':  return { instagram:'', facebook:'', pinterest:'', twitter:'', color:'#8f7420', align:'center' };
    case 'footer':  return { companyName:'Luxury Wedding Directory', address:'London, United Kingdom', unsubscribeUrl:'#', background:'#f8f4ef', textColor:'#999999', fontSize:11 };
    default:        return {};
  }
}

function makeBlock(type) {
  return { id: nextId(), type, props: { ...defaultProps(type) } };
}

// ── Starter templates ─────────────────────────────────────────────────────────
const STARTERS = [
  { name:'Blank',        emoji:'○', desc:'Start from scratch',             factory:() => [] },
  { name:'Announcement', emoji:'◉', desc:'Product or news launch',         factory:() => ['header','hero','heading','text','button','footer'].map(makeBlock) },
  { name:'Newsletter',   emoji:'✉', desc:'Multi-section editorial email',   factory:() => ['header','heading','text','divider','columns','divider','button','social','footer'].map(makeBlock) },
  { name:'Showcase',     emoji:'▨', desc:'Venue or supplier spotlight',     factory:() => ['header','hero','heading','text','image','text','button','footer'].map(makeBlock) },
  { name:'Invite',       emoji:'✦', desc:'Event or launch invitation',      factory:() => ['hero','heading','text','divider','columns','button','social','footer'].map(makeBlock) },
];

// ── Block canvas preview ──────────────────────────────────────────────────────
function BlockPreview({ block }) {
  const p = block.props;
  const pad = { padding:'20px 32px', fontFamily:'var(--font-body)' };

  switch (block.type) {
    case 'header':
      return (
        <div style={{ background:p.background, padding:'14px 32px', display:'flex', alignItems:'center', borderBottom:'1px solid #e8e1d6' }}>
          {p.logoUrl
            ? <img src={p.logoUrl} alt="logo" style={{ height:32, objectFit:'contain' }} />
            : <span style={{ fontFamily:'var(--font-heading)', fontSize:17, fontWeight:700, color:p.textColor, letterSpacing:'0.05em' }}>{p.logoText}</span>
          }
        </div>
      );

    case 'hero': {
      const bg = p.imageUrl
        ? `linear-gradient(rgba(0,0,0,0.45),rgba(0,0,0,0.45)), url(${p.imageUrl}) center/cover no-repeat`
        : p.background;
      return (
        <div style={{ minHeight:p.minHeight, background:bg, display:'flex', flexDirection:'column', alignItems:p.textAlign==='center'?'center':p.textAlign==='right'?'flex-end':'flex-start', justifyContent:'center', padding:'40px 48px', textAlign:p.textAlign }}>
          <h1 style={{ fontFamily:'var(--font-heading)', fontSize:34, fontWeight:700, color:p.textColor, margin:'0 0 10px', lineHeight:1.2, maxWidth:480 }}>{p.headline}</h1>
          {p.subtext && <p style={{ fontFamily:'var(--font-body)', fontSize:15, color:p.textColor, opacity:0.85, margin:'0 0 22px', maxWidth:380 }}>{p.subtext}</p>}
          {p.showCta && <a href="#" style={{ display:'inline-block', background:GOLD, color:'#fff', padding:'11px 26px', fontSize:11, fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', textDecoration:'none', borderRadius:2 }}>{p.ctaLabel}</a>}
        </div>
      );
    }

    case 'heading':
      return (
        <div style={{ ...pad, textAlign:p.align }}>
          <div style={{ fontFamily:p.serif?'var(--font-heading)':'var(--font-body)', fontSize:p.fontSize, fontWeight:700, color:p.color, lineHeight:1.2 }}>{p.text}</div>
        </div>
      );

    case 'text':
      return (
        <div style={{ ...pad, textAlign:p.align }}>
          <p style={{ fontFamily:'var(--font-body)', fontSize:p.fontSize, color:p.color, lineHeight:p.lineHeight, margin:0 }}>{p.content}</p>
        </div>
      );

    case 'image':
      return (
        <div style={{ ...pad, textAlign:'center', padding:'12px 32px' }}>
          {p.url
            ? <img src={p.url} alt={p.alt} style={{ width:'100%', borderRadius:p.borderRadius, display:'block' }} />
            : <div style={{ width:'100%', height:160, background:'#f0ece6', border:'1.5px dashed #cfc5b4', borderRadius:p.borderRadius, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:6 }}>
                <span style={{ fontSize:24, opacity:0.35 }}>▨</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#bbb' }}>Add image URL in properties</span>
              </div>
          }
          {p.caption && <p style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#999', marginTop:7, fontStyle:'italic' }}>{p.caption}</p>}
        </div>
      );

    case 'button':
      return (
        <div style={{ ...pad, textAlign:p.align }}>
          <span style={{ display:'inline-block', background:p.background, color:p.color, padding:`${p.paddingV}px ${p.paddingH}px`, fontSize:p.fontSize, fontFamily:'var(--font-body)', fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:p.borderRadius, cursor:'default' }}>{p.label}</span>
        </div>
      );

    case 'columns':
      return (
        <div style={{ background:p.background, padding:'20px 32px' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>
            {['left','right'].map(side => (
              <div key={side}>
                {p[`${side}Img`]
                  ? <img src={p[`${side}Img`]} style={{ width:'100%', borderRadius:2, marginBottom:10, display:'block' }} alt="" />
                  : <div style={{ width:'100%', height:110, background:'#f0ece6', border:'1.5px dashed #cfc5b4', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:10 }}>
                      <span style={{ fontSize:18, opacity:0.35 }}>▨</span>
                    </div>
                }
                <div style={{ fontFamily:'var(--font-heading)', fontSize:15, fontWeight:700, color:'#171717', marginBottom:5 }}>{p[`${side}Head`]}</div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#555', lineHeight:1.6, margin:0 }}>{p[`${side}Text`]}</p>
              </div>
            ))}
          </div>
        </div>
      );

    case 'divider':
      return (
        <div style={{ padding:`${p.marginTop}px 32px ${p.marginBottom}px` }}>
          <hr style={{ border:'none', borderTop:`${p.thickness}px solid ${p.color}`, margin:0 }} />
        </div>
      );

    case 'spacer':
      return (
        <div style={{ height:p.height, background:'transparent', position:'relative' }}>
          <div style={{ position:'absolute', inset:0, display:'flex', alignItems:'center', justifyContent:'center', borderTop:'1px dashed #e0d9cc', borderBottom:'1px dashed #e0d9cc', opacity:0.5 }}>
            <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#bbb' }}>{p.height}px spacer</span>
          </div>
        </div>
      );

    case 'social': {
      const icons = [
        { key:'instagram', lbl:'IG' },
        { key:'facebook',  lbl:'FB' },
        { key:'pinterest', lbl:'PI' },
        { key:'twitter',   lbl:'TW' },
      ];
      const active = icons.filter(i => p[i.key]);
      const show   = active.length > 0 ? active : icons.slice(0,3);
      return (
        <div style={{ ...pad, textAlign:p.align }}>
          <div style={{ fontSize:10, fontFamily:'var(--font-body)', color:'#aaa', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:10 }}>Follow Us</div>
          <div style={{ display:'flex', justifyContent:p.align==='center'?'center':'flex-start', gap:10 }}>
            {show.map(ic => (
              <div key={ic.key} style={{ width:34, height:34, borderRadius:'50%', border:`1.5px solid ${p.color}`, display:'flex', alignItems:'center', justifyContent:'center', fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.color }}>{ic.lbl}</div>
            ))}
          </div>
        </div>
      );
    }

    case 'footer':
      return (
        <div style={{ background:p.background, padding:'22px 32px', textAlign:'center' }}>
          <p style={{ fontFamily:'var(--font-body)', fontSize:p.fontSize, color:p.textColor, lineHeight:1.7, margin:'0 0 6px' }}>{p.companyName} &bull; {p.address}</p>
          <p style={{ fontFamily:'var(--font-body)', fontSize:p.fontSize, color:p.textColor, margin:0 }}>
            <a href="#" style={{ color:p.textColor, textDecoration:'underline' }}>Unsubscribe</a>
            {' '}&bull;{' '}
            <a href="#" style={{ color:p.textColor, textDecoration:'underline' }}>Privacy Policy</a>
          </p>
        </div>
      );

    default:
      return <div style={{ ...pad, color:'#aaa' }}>Unknown block: {block.type}</div>;
  }
}

// ── Properties panel ──────────────────────────────────────────────────────────
function PropRow({ label, children }) {
  return (
    <div style={{ marginBottom:16 }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>{label}</div>
      {children}
    </div>
  );
}

function PInput({ value, onChange, type='text', min, max, placeholder, rows }) {
  const base = { width:'100%', background:'transparent', border:'none', borderBottom:'1px solid rgba(143,116,32,0.25)', padding:'4px 0 5px', fontFamily:'var(--font-body)', fontSize:13, color:'inherit', outline:'none', boxSizing:'border-box' };
  if (type==='color') return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <input type="color" value={value} onChange={e=>onChange(e.target.value)} style={{ width:28, height:28, border:'none', background:'none', cursor:'pointer', padding:0 }} />
      <input type="text" value={value} onChange={e=>onChange(e.target.value)} style={{ ...base, flex:1 }} />
    </div>
  );
  if (rows) return <textarea value={value} onChange={e=>onChange(e.target.value)} rows={rows} placeholder={placeholder} style={{ ...base, resize:'vertical', borderBottom:'none', border:'1px solid rgba(143,116,32,0.2)', padding:'6px 8px', borderRadius:2 }} />;
  return <input type={type} value={value} onChange={e=>onChange(type==='number'?Number(e.target.value):e.target.value)} min={min} max={max} placeholder={placeholder} style={base} />;
}

// Image input: URL field + upload button side by side
function PImageInput({ value, onChange, placeholder = 'https://...' }) {
  const fileRef = useRef(null);
  const base = { flex:1, background:'transparent', border:'none', borderBottom:'1px solid rgba(143,116,32,0.25)', padding:'4px 0 5px', fontFamily:'var(--font-body)', fontSize:13, color:'inherit', outline:'none', minWidth:0 };

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onChange(ev.target.result);
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom: value ? 8 : 0 }}>
        <input type="text" value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} style={base} />
        <button onClick={()=>fileRef.current?.click()}
          style={{ flexShrink:0, padding:'3px 10px', background:GOLD_DIM, border:`1px solid ${GOLD_BDR}`, borderRadius:2, fontFamily:'var(--font-body)', fontSize:10, fontWeight:600, color:GOLD, cursor:'pointer', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
          Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFile} />
      </div>
      {value && (
        <div style={{ position:'relative', marginTop:4 }}>
          <img src={value} alt="preview" style={{ width:'100%', maxHeight:100, objectFit:'cover', borderRadius:2, display:'block', border:'1px solid rgba(143,116,32,0.2)' }} />
          <button onClick={()=>onChange('')}
            style={{ position:'absolute', top:4, right:4, width:18, height:18, background:'rgba(0,0,0,0.6)', border:'none', borderRadius:'50%', color:'#fff', fontSize:9, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
}

function PSelect({ value, onChange, options }) {
  return (
    <select value={value} onChange={e=>onChange(e.target.value)} style={{ width:'100%', background:'transparent', border:'none', borderBottom:'1px solid rgba(143,116,32,0.25)', padding:'4px 0 5px', fontFamily:'var(--font-body)', fontSize:13, color:'inherit', outline:'none', appearance:'none', cursor:'pointer' }}>
      {options.map(o => <option key={o.value??o} value={o.value??o}>{o.label??o}</option>)}
    </select>
  );
}

function PToggle({ value, onChange, label }) {
  return (
    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer' }}>
      <div onClick={()=>onChange(!value)} style={{ width:34, height:18, borderRadius:9, background:value?GOLD:'#d0c9be', position:'relative', flexShrink:0, transition:'background 0.2s' }}>
        <div style={{ position:'absolute', top:2, left:value?16:2, width:14, height:14, borderRadius:'50%', background:'#fff', transition:'left 0.2s' }} />
      </div>
      <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#666' }}>{label}</span>
    </label>
  );
}

function PropertiesPanel({ block, onChange, C }) {
  if (!block) return (
    <div style={{ padding:'40px 20px', textAlign:'center' }}>
      <div style={{ fontSize:32, opacity:0.2, marginBottom:12 }}>←</div>
      <p style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, lineHeight:1.6 }}>Click any block on the canvas to edit its properties here</p>
    </div>
  );

  const p  = block.props;
  const s  = (k,v) => onChange({ ...p, [k]:v });
  const meta = BLOCK_DEFS.find(d=>d.type===block.type)||{};

  return (
    <div style={{ padding:'16px 18px', color:C.white }}>
      <div style={{ fontFamily:'var(--font-heading)', fontSize:16, fontWeight:700, color:C.white, marginBottom:4 }}>{meta.label}</div>
      <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginBottom:20 }}>{meta.desc}</div>

      {/* HEADER */}
      {block.type==='header' && <>
        <PropRow label="Logo URL"><PImageInput value={p.logoUrl} onChange={v=>s('logoUrl',v)} /></PropRow>
        <PropRow label="Logo Text (fallback)"><PInput value={p.logoText} onChange={v=>s('logoText',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background} onChange={v=>s('background',v)} /></PropRow>
        <PropRow label="Text Color"><PInput type="color" value={p.textColor} onChange={v=>s('textColor',v)} /></PropRow>
      </>}

      {/* HERO */}
      {block.type==='hero' && <>
        <PropRow label="Image URL"><PImageInput value={p.imageUrl} onChange={v=>s('imageUrl',v)} /></PropRow>
        <PropRow label="Headline"><PInput value={p.headline} onChange={v=>s('headline',v)} /></PropRow>
        <PropRow label="Subtext"><PInput value={p.subtext} onChange={v=>s('subtext',v)} rows={2} /></PropRow>
        <PropRow label="Background Color"><PInput type="color" value={p.background} onChange={v=>s('background',v)} /></PropRow>
        <PropRow label="Text Color"><PInput type="color" value={p.textColor} onChange={v=>s('textColor',v)} /></PropRow>
        <PropRow label="Text Align"><PSelect value={p.textAlign} onChange={v=>s('textAlign',v)} options={['left','center','right']} /></PropRow>
        <PropRow label="Min Height (px)"><PInput type="number" value={p.minHeight} onChange={v=>s('minHeight',v)} min={120} max={600} /></PropRow>
        <PropRow label="CTA Button"><PToggle value={p.showCta} onChange={v=>s('showCta',v)} label="Show CTA button" /></PropRow>
        {p.showCta && <>
          <PropRow label="Button Label"><PInput value={p.ctaLabel} onChange={v=>s('ctaLabel',v)} /></PropRow>
          <PropRow label="Button URL"><PInput value={p.ctaUrl} onChange={v=>s('ctaUrl',v)} /></PropRow>
        </>}
      </>}

      {/* HEADING */}
      {block.type==='heading' && <>
        <PropRow label="Text"><PInput value={p.text} onChange={v=>s('text',v)} /></PropRow>
        <PropRow label="Font Size (px)"><PInput type="number" value={p.fontSize} onChange={v=>s('fontSize',v)} min={12} max={60} /></PropRow>
        <PropRow label="Color"><PInput type="color" value={p.color} onChange={v=>s('color',v)} /></PropRow>
        <PropRow label="Align"><PSelect value={p.align} onChange={v=>s('align',v)} options={['left','center','right']} /></PropRow>
        <PropRow label="Font"><PToggle value={p.serif} onChange={v=>s('serif',v)} label="Use serif (Cormorant)" /></PropRow>
      </>}

      {/* TEXT */}
      {block.type==='text' && <>
        <PropRow label="Content"><PInput value={p.content} onChange={v=>s('content',v)} rows={5} /></PropRow>
        <PropRow label="Font Size (px)"><PInput type="number" value={p.fontSize} onChange={v=>s('fontSize',v)} min={11} max={24} /></PropRow>
        <PropRow label="Color"><PInput type="color" value={p.color} onChange={v=>s('color',v)} /></PropRow>
        <PropRow label="Align"><PSelect value={p.align} onChange={v=>s('align',v)} options={['left','center','right']} /></PropRow>
        <PropRow label="Line Height"><PInput type="number" value={p.lineHeight} onChange={v=>s('lineHeight',v)} min={1} max={3} /></PropRow>
      </>}

      {/* IMAGE */}
      {block.type==='image' && <>
        <PropRow label="Image URL"><PImageInput value={p.url} onChange={v=>s('url',v)} /></PropRow>
        <PropRow label="Alt Text"><PInput value={p.alt} onChange={v=>s('alt',v)} /></PropRow>
        <PropRow label="Caption"><PInput value={p.caption} onChange={v=>s('caption',v)} /></PropRow>
        <PropRow label="Border Radius (px)"><PInput type="number" value={p.borderRadius} onChange={v=>s('borderRadius',v)} min={0} max={20} /></PropRow>
      </>}

      {/* BUTTON */}
      {block.type==='button' && <>
        <PropRow label="Label"><PInput value={p.label} onChange={v=>s('label',v)} /></PropRow>
        <PropRow label="URL"><PInput value={p.url} onChange={v=>s('url',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background} onChange={v=>s('background',v)} /></PropRow>
        <PropRow label="Text Color"><PInput type="color" value={p.color} onChange={v=>s('color',v)} /></PropRow>
        <PropRow label="Align"><PSelect value={p.align} onChange={v=>s('align',v)} options={['left','center','right']} /></PropRow>
        <PropRow label="Padding H (px)"><PInput type="number" value={p.paddingH} onChange={v=>s('paddingH',v)} min={8} max={80} /></PropRow>
        <PropRow label="Padding V (px)"><PInput type="number" value={p.paddingV} onChange={v=>s('paddingV',v)} min={4} max={40} /></PropRow>
        <PropRow label="Border Radius (px)"><PInput type="number" value={p.borderRadius} onChange={v=>s('borderRadius',v)} min={0} max={20} /></PropRow>
        <PropRow label="Font Size (px)"><PInput type="number" value={p.fontSize} onChange={v=>s('fontSize',v)} min={9} max={20} /></PropRow>
      </>}

      {/* COLUMNS */}
      {block.type==='columns' && <>
        <PropRow label="Background"><PInput type="color" value={p.background} onChange={v=>s('background',v)} /></PropRow>
        <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:GOLD, letterSpacing:'0.08em', textTransform:'uppercase', margin:'12px 0 8px' }}>Left Column</div>
        <PropRow label="Image URL"><PImageInput value={p.leftImg} onChange={v=>s('leftImg',v)} /></PropRow>
        <PropRow label="Heading"><PInput value={p.leftHead} onChange={v=>s('leftHead',v)} /></PropRow>
        <PropRow label="Text"><PInput value={p.leftText} onChange={v=>s('leftText',v)} rows={3} /></PropRow>
        <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, color:GOLD, letterSpacing:'0.08em', textTransform:'uppercase', margin:'12px 0 8px' }}>Right Column</div>
        <PropRow label="Image URL"><PImageInput value={p.rightImg} onChange={v=>s('rightImg',v)} /></PropRow>
        <PropRow label="Heading"><PInput value={p.rightHead} onChange={v=>s('rightHead',v)} /></PropRow>
        <PropRow label="Text"><PInput value={p.rightText} onChange={v=>s('rightText',v)} rows={3} /></PropRow>
      </>}

      {/* DIVIDER */}
      {block.type==='divider' && <>
        <PropRow label="Color"><PInput type="color" value={p.color} onChange={v=>s('color',v)} /></PropRow>
        <PropRow label="Thickness (px)"><PInput type="number" value={p.thickness} onChange={v=>s('thickness',v)} min={1} max={8} /></PropRow>
        <PropRow label="Margin Top (px)"><PInput type="number" value={p.marginTop} onChange={v=>s('marginTop',v)} min={0} max={80} /></PropRow>
        <PropRow label="Margin Bottom (px)"><PInput type="number" value={p.marginBottom} onChange={v=>s('marginBottom',v)} min={0} max={80} /></PropRow>
      </>}

      {/* SPACER */}
      {block.type==='spacer' && <>
        <PropRow label="Height (px)"><PInput type="number" value={p.height} onChange={v=>s('height',v)} min={8} max={200} /></PropRow>
      </>}

      {/* SOCIAL */}
      {block.type==='social' && <>
        <PropRow label="Icon Color"><PInput type="color" value={p.color} onChange={v=>s('color',v)} /></PropRow>
        <PropRow label="Align"><PSelect value={p.align} onChange={v=>s('align',v)} options={['left','center','right']} /></PropRow>
        <PropRow label="Instagram URL"><PInput value={p.instagram} onChange={v=>s('instagram',v)} placeholder="https://instagram.com/..." /></PropRow>
        <PropRow label="Facebook URL"><PInput value={p.facebook} onChange={v=>s('facebook',v)} placeholder="https://facebook.com/..." /></PropRow>
        <PropRow label="Pinterest URL"><PInput value={p.pinterest} onChange={v=>s('pinterest',v)} placeholder="https://pinterest.com/..." /></PropRow>
        <PropRow label="Twitter/X URL"><PInput value={p.twitter} onChange={v=>s('twitter',v)} placeholder="https://x.com/..." /></PropRow>
      </>}

      {/* FOOTER */}
      {block.type==='footer' && <>
        <PropRow label="Company Name"><PInput value={p.companyName} onChange={v=>s('companyName',v)} /></PropRow>
        <PropRow label="Address"><PInput value={p.address} onChange={v=>s('address',v)} /></PropRow>
        <PropRow label="Unsubscribe URL"><PInput value={p.unsubscribeUrl} onChange={v=>s('unsubscribeUrl',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background} onChange={v=>s('background',v)} /></PropRow>
        <PropRow label="Text Color"><PInput type="color" value={p.textColor} onChange={v=>s('textColor',v)} /></PropRow>
        <PropRow label="Font Size (px)"><PInput type="number" value={p.fontSize} onChange={v=>s('fontSize',v)} min={9} max={14} /></PropRow>
      </>}
    </div>
  );
}

// ── HTML export ───────────────────────────────────────────────────────────────
function generateHTML(blocks, subject) {
  const blockHtml = blocks.map(b => {
    const p = b.props;
    switch (b.type) {
      case 'header':
        return `<tr><td style="background:${p.background};padding:14px 32px;border-bottom:1px solid #e8e1d6;">
          ${p.logoUrl ? `<img src="${p.logoUrl}" alt="logo" style="height:32px;" />` : `<span style="font-family:Georgia,serif;font-size:17px;font-weight:700;color:${p.textColor};">${p.logoText}</span>`}
        </td></tr>`;
      case 'hero': {
        const bgcss = p.imageUrl
          ? `background-image:url(${p.imageUrl});background-size:cover;background-position:center;background-color:${p.background};`
          : `background-color:${p.background};`;
        return `<tr><td style="${bgcss}min-height:${p.minHeight}px;padding:40px 48px;text-align:${p.textAlign};">
          <h1 style="font-family:Georgia,serif;font-size:34px;font-weight:700;color:${p.textColor};margin:0 0 10px;line-height:1.2;">${p.headline}</h1>
          ${p.subtext ? `<p style="font-family:Arial,sans-serif;font-size:15px;color:${p.textColor};opacity:0.85;margin:0 0 22px;">${p.subtext}</p>` : ''}
          ${p.showCta ? `<a href="${p.ctaUrl}" style="display:inline-block;background:#8f7420;color:#ffffff;padding:11px 26px;font-family:Arial,sans-serif;font-size:11px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:2px;">${p.ctaLabel}</a>` : ''}
        </td></tr>`;
      }
      case 'heading':
        return `<tr><td style="padding:20px 32px;text-align:${p.align};"><div style="font-family:${p.serif?'Georgia,serif':'Arial,sans-serif'};font-size:${p.fontSize}px;font-weight:700;color:${p.color};line-height:1.2;">${p.text}</div></td></tr>`;
      case 'text':
        return `<tr><td style="padding:20px 32px;text-align:${p.align};"><p style="font-family:Arial,sans-serif;font-size:${p.fontSize}px;color:${p.color};line-height:${p.lineHeight};margin:0;">${p.content}</p></td></tr>`;
      case 'image':
        return `<tr><td style="padding:12px 32px;text-align:center;">${p.url ? `<img src="${p.url}" alt="${p.alt}" style="width:100%;display:block;border-radius:${p.borderRadius}px;" />` : ''} ${p.caption ? `<p style="font-family:Arial,sans-serif;font-size:11px;color:#999;margin-top:7px;font-style:italic;">${p.caption}</p>` : ''}</td></tr>`;
      case 'button':
        return `<tr><td style="padding:20px 32px;text-align:${p.align};"><a href="${p.url}" style="display:inline-block;background:${p.background};color:${p.color};padding:${p.paddingV}px ${p.paddingH}px;font-family:Arial,sans-serif;font-size:${p.fontSize}px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:${p.borderRadius}px;">${p.label}</a></td></tr>`;
      case 'divider':
        return `<tr><td style="padding:${p.marginTop}px 32px ${p.marginBottom}px;"><hr style="border:none;border-top:${p.thickness}px solid ${p.color};margin:0;" /></td></tr>`;
      case 'spacer':
        return `<tr><td style="height:${p.height}px;line-height:${p.height}px;">&nbsp;</td></tr>`;
      case 'footer':
        return `<tr><td style="background:${p.background};padding:22px 32px;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:${p.fontSize}px;color:${p.textColor};line-height:1.7;margin:0 0 6px;">${p.companyName} &bull; ${p.address}</p>
          <p style="font-family:Arial,sans-serif;font-size:${p.fontSize}px;color:${p.textColor};margin:0;"><a href="${p.unsubscribeUrl}" style="color:${p.textColor};">Unsubscribe</a></p>
        </td></tr>`;
      default: return '';
    }
  }).join('\n');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject || 'Email'}</title>
</head>
<body style="margin:0;padding:0;background:#f0ece6;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0ece6;">
    <tr><td align="center" style="padding:24px 0;">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;width:600px;max-width:100%;">
        ${blockHtml}
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Template picker modal ─────────────────────────────────────────────────────
function TemplatePicker({ onSelect, C }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, padding:'40px 36px', width:580, maxWidth:'92vw' }}>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:24, fontWeight:700, color:C.white, margin:'0 0 4px' }}>Start a new email</h2>
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey, margin:'0 0 28px' }}>Choose a starting point or begin with a blank canvas</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
          {STARTERS.map(t => (
            <button key={t.name} onClick={() => onSelect(t.factory())}
              style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:4, padding:'18px 10px 14px', cursor:'pointer', textAlign:'center', transition:'border-color 0.15s' }}
              onMouseEnter={e=>e.currentTarget.style.borderColor=GOLD}
              onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
              <div style={{ fontSize:22, marginBottom:8 }}>{t.emoji}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:C.white, marginBottom:4 }}>{t.name}</div>
              <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, lineHeight:1.4 }}>{t.desc}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Toast notification ────────────────────────────────────────────────────────
function Toast({ msg, onDone }) {
  setTimeout(onDone, 2200);
  return (
    <div style={{ position:'fixed', bottom:28, right:28, background:C_GOLD_TOAST, border:`1px solid ${GOLD}`, borderRadius:4, padding:'10px 18px', fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:'#fff', background:GOLD, zIndex:9999, pointerEvents:'none', boxShadow:'0 4px 20px rgba(0,0,0,0.3)' }}>
      {msg}
    </div>
  );
}
const C_GOLD_TOAST = GOLD;

// ── Send modal ────────────────────────────────────────────────────────────────
function SendModal({ subject: initialSubject, html, builderMode, C, onClose }) {
  const [fromName,      setFromName]      = useState('Luxury Wedding Directory');
  const [fromEmail,     setFromEmail]     = useState('');
  const [subjectEdit,   setSubjectEdit]   = useState(initialSubject || '');
  const [recipientMode, setRecipientMode] = useState('all_crm');
  const [manualEmails,  setManualEmails]  = useState('');
  const [leads,         setLeads]         = useState([]);
  const [subscribers,   setSubscribers]   = useState([]);
  const [sending,       setSending]       = useState(false);
  const [result,        setResult]        = useState(null);

  // Load contacts on modal open
  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        const { data } = await supabase
          .from('leads')
          .select('id,first_name,last_name,email,status')
          .not('email', 'is', null);
        setLeads(data || []);
      } catch { setLeads([]); }
    })();
    fetchNewsletterSubscribers().then(setSubscribers).catch(() => setSubscribers([]));
  }, []);

  const MODES = [
    { key:'all_crm',    label:'All CRM Contacts',      count: () => leads.filter(l=>l.email).length },
    { key:'new',        label:'New Leads',              count: () => leads.filter(l=>l.email&&(!l.status||l.status==='new')).length },
    { key:'qualified',  label:'Qualified / Proposal',   count: () => leads.filter(l=>l.email&&(l.status==='qualified'||l.status==='proposal')).length },
    { key:'converted',  label:'Converted Clients',      count: () => leads.filter(l=>l.email&&l.status==='converted').length },
    { key:'newsletter', label:'Newsletter Subscribers', count: () => subscribers.length },
    { key:'manual',     label:'Manual Entry',           count: null },
  ];

  const getRecipients = () => {
    const toRec = arr => arr.map(l => ({ email: l.email, name: `${l.first_name||''} ${l.last_name||''}`.trim() }));
    switch (recipientMode) {
      case 'all_crm':    return toRec(leads.filter(l=>l.email));
      case 'new':        return toRec(leads.filter(l=>l.email&&(!l.status||l.status==='new')));
      case 'qualified':  return toRec(leads.filter(l=>l.email&&(l.status==='qualified'||l.status==='proposal')));
      case 'converted':  return toRec(leads.filter(l=>l.email&&l.status==='converted'));
      case 'newsletter': return subscribers.map(s => ({ email: s.email, name: `${s.first_name||''} ${s.last_name||''}`.trim() }));
      case 'manual': {
        const emails = manualEmails.split(/[\n,;]+/).map(e=>e.trim()).filter(e=>e.includes('@'));
        return emails.map(e => ({ email: e, name: '' }));
      }
      default: return [];
    }
  };

  const recipients = getRecipients();

  const handleSend = async () => {
    if (!subjectEdit.trim()) { alert('Please enter a subject line'); return; }
    if (!fromEmail.trim() || !fromEmail.includes('@')) { alert('Please enter a valid from email (must be from your Resend-verified domain)'); return; }
    if (recipients.length === 0) { alert('No recipients — select a list or enter emails manually'); return; }

    setSending(true);
    try {
      const res = await sendEmail({
        subject:    subjectEdit,
        fromName,
        fromEmail,
        html,
        recipients,
        type: builderMode === 'newsletter' ? 'newsletter' : 'campaign',
      });
      setResult({ success: true, sent: res.sent, errors: res.errors });
    } catch (err) {
      setResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const inputStyle = { width:'100%', background:'transparent', border:'none', borderBottom:`1px solid rgba(143,116,32,0.3)`, padding:'5px 0 6px', fontFamily:'var(--font-body)', fontSize:13, color:'inherit', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:5 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', backdropFilter:'blur(5px)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ background:C.bg, border:`1px solid ${C.border}`, borderRadius:6, width:520, maxWidth:'92vw', maxHeight:'88vh', overflowY:'auto', color:C.white }}>

        {/* Header */}
        <div style={{ padding:'20px 24px 16px', borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'flex-start', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:C.white }}>
              Send {builderMode === 'newsletter' ? 'Newsletter' : 'Campaign'}
            </div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, marginTop:2 }}>Delivered via Resend</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.grey, fontSize:18, cursor:'pointer', lineHeight:1, padding:0 }}>✕</button>
        </div>

        {result ? (
          /* Result screen */
          <div style={{ padding:'48px 24px', textAlign:'center' }}>
            {result.success ? (
              <>
                <div style={{ fontSize:44, color:'#10b981', marginBottom:14 }}>✓</div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:22, fontWeight:700, color:C.white, marginBottom:6 }}>Sent successfully</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:14, color:C.grey, marginBottom:4 }}>
                  {result.sent} {result.sent === 1 ? 'email' : 'emails'} delivered via Resend
                </div>
                {result.errors?.length > 0 && (
                  <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#f59e0b', marginTop:8 }}>
                    {result.errors.length} batches had delivery issues — check Resend dashboard
                  </div>
                )}
                <button onClick={onClose} style={{ marginTop:28, padding:'10px 28px', background:GOLD, color:'#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, cursor:'pointer' }}>Done</button>
              </>
            ) : (
              <>
                <div style={{ fontSize:40, color:'#ef4444', marginBottom:14 }}>✕</div>
                <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:'#ef4444', marginBottom:8 }}>Send failed</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey, lineHeight:1.6, wordBreak:'break-word', maxWidth:380, margin:'0 auto' }}>{result.error}</div>
                <div style={{ marginTop:8, fontFamily:'var(--font-body)', fontSize:11, color:C.grey }}>Make sure your from email domain is verified in Resend and the Edge Function is deployed.</div>
                <button onClick={() => setResult(null)} style={{ marginTop:24, padding:'9px 22px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>Try again</button>
              </>
            )}
          </div>
        ) : (
          <div style={{ padding:'22px 24px' }}>

            {/* Subject */}
            <div style={{ marginBottom:18 }}>
              <label style={labelStyle}>Subject line</label>
              <input value={subjectEdit} onChange={e=>setSubjectEdit(e.target.value)} style={inputStyle} placeholder="Your email subject..." />
            </div>

            {/* From */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:22 }}>
              <div>
                <label style={labelStyle}>From name</label>
                <input value={fromName} onChange={e=>setFromName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>From email</label>
                <input value={fromEmail} onChange={e=>setFromEmail(e.target.value)} style={inputStyle} placeholder="hello@yourdomain.com" />
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey, marginTop:4 }}>Must be Resend-verified domain</div>
              </div>
            </div>

            {/* Recipients */}
            <div style={{ marginBottom:16 }}>
              <label style={labelStyle}>Send to</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {MODES.map(opt => (
                  <button key={opt.key} onClick={() => setRecipientMode(opt.key)}
                    style={{ padding:'10px 12px', background: recipientMode===opt.key ? GOLD_DIM : C.card, border:`1px solid ${recipientMode===opt.key ? GOLD : C.border}`, borderRadius:3, textAlign:'left', cursor:'pointer', transition:'border-color 0.15s' }}>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color: recipientMode===opt.key ? GOLD : C.white }}>{opt.label}</div>
                    {opt.count !== null && (
                      <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:2 }}>{opt.count()} contacts</div>
                    )}
                  </button>
                ))}
              </div>

              {recipientMode === 'manual' && (
                <textarea
                  value={manualEmails}
                  onChange={e => setManualEmails(e.target.value)}
                  placeholder="Paste emails separated by commas, semicolons, or new lines"
                  rows={4}
                  style={{ width:'100%', marginTop:10, background:C.card, border:`1px solid ${C.border}`, padding:'8px 10px', fontFamily:'var(--font-body)', fontSize:12, color:C.white, borderRadius:3, outline:'none', resize:'vertical', boxSizing:'border-box' }}
                />
              )}
            </div>

            {/* Recipient count summary */}
            <div style={{ padding:'11px 14px', background: recipients.length > 0 ? GOLD_DIM : C.card, border:`1px solid ${recipients.length > 0 ? GOLD+'50' : C.border}`, borderRadius:3, marginBottom:22 }}>
              <span style={{ fontFamily:'var(--font-body)', fontSize:13, fontWeight:500, color: recipients.length > 0 ? GOLD : C.grey }}>
                {recipients.length > 0
                  ? `${recipients.length} recipient${recipients.length > 1 ? 's' : ''} will receive this email`
                  : 'No recipients — select a list above or enter emails manually'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={onClose}
                style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSend}
                disabled={sending || recipients.length === 0}
                style={{ padding:'9px 28px', background: sending || recipients.length === 0 ? '#444' : GOLD, color: sending || recipients.length === 0 ? '#888' : '#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, letterSpacing:'0.06em', cursor: sending || recipients.length === 0 ? 'not-allowed' : 'pointer', transition:'background 0.15s' }}>
                {sending ? 'Sending...' : `Send to ${recipients.length}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────
export default function EmailBuilderModule({ C, mode, onBack }) {
  const [blocks,      setBlocks]      = useState([]);
  const [selectedId,  setSelectedId]  = useState(null);
  const [hoveredId,   setHoveredId]   = useState(null);
  const [subject,     setSubject]     = useState('');
  const [previewMode, setPreviewMode] = useState('desktop');
  const [showPicker,  setShowPicker]  = useState(true);
  const [toast,          setToast]          = useState(null);
  const [builderMode,    setBuilderMode]    = useState(mode || 'email');
  const [showSendModal,  setShowSendModal]  = useState(false);

  const showToast = msg => setToast(msg);

  const selectedBlock = blocks.find(b => b.id === selectedId) || null;

  const addBlock = useCallback(type => {
    const nb = makeBlock(type);
    setBlocks(prev => {
      const idx = prev.findIndex(b => b.id === selectedId);
      if (idx >= 0) {
        const next = [...prev];
        next.splice(idx + 1, 0, nb);
        return next;
      }
      return [...prev, nb];
    });
    setSelectedId(nb.id);
  }, [selectedId]);

  const moveBlock = useCallback((id, dir) => {
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === id);
      if (i < 0) return prev;
      if (dir === -1 && i === 0) return prev;
      if (dir ===  1 && i === prev.length - 1) return prev;
      const next = [...prev];
      [next[i], next[i + dir]] = [next[i + dir], next[i]];
      return next;
    });
  }, []);

  const deleteBlock = useCallback(id => {
    setBlocks(prev => prev.filter(b => b.id !== id));
    setSelectedId(sel => sel === id ? null : sel);
  }, []);

  const duplicateBlock = useCallback(id => {
    setBlocks(prev => {
      const i = prev.findIndex(b => b.id === id);
      if (i < 0) return prev;
      const clone = { ...prev[i], id: nextId(), props: { ...prev[i].props } };
      const next = [...prev];
      next.splice(i + 1, 0, clone);
      return next;
    });
  }, []);

  const updateBlock = useCallback((id, newProps) => {
    setBlocks(prev => prev.map(b => b.id === id ? { ...b, props: newProps } : b));
  }, []);

  const handleCopyHTML = () => {
    const html = generateHTML(blocks, subject);
    navigator.clipboard.writeText(html).then(() => showToast('HTML copied to clipboard'));
  };

  const canvasWidth = previewMode === 'mobile' ? 380 : 600;

  // Email builder header
  const builderTitle = builderMode === 'newsletter' ? 'Newsletter Builder' : 'Email Builder';

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, background:C.bg }}>

      {showPicker && (
        <TemplatePicker C={C} onSelect={factory => { setBlocks(factory); setShowPicker(false); }} />
      )}

      {showSendModal && (
        <SendModal
          subject={subject}
          html={generateHTML(blocks, subject)}
          builderMode={builderMode}
          C={C}
          onClose={() => setShowSendModal(false)}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* ── Top bar ── */}
      <div style={{ height:52, flexShrink:0, background:C.card, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 18px', gap:14 }}>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:C.bg, borderRadius:3, border:`1px solid ${C.border}`, overflow:'hidden', flexShrink:0 }}>
          {['email','newsletter'].map(m => (
            <button key={m} onClick={()=>setBuilderMode(m)}
              style={{ padding:'5px 14px', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'capitalize', background:builderMode===m?GOLD:'transparent', color:builderMode===m?'#000':C.grey, border:'none', cursor:'pointer', transition:'all 0.15s' }}>
              {m==='email'?'Email':'Newsletter'}
            </button>
          ))}
        </div>

        {/* Subject line */}
        <input
          value={subject}
          onChange={e => setSubject(e.target.value)}
          placeholder={builderMode==='newsletter' ? 'Newsletter edition name...' : 'Email subject line...'}
          style={{ flex:1, background:'transparent', border:'none', borderBottom:`1px solid ${C.border}`, fontFamily:'var(--font-body)', fontSize:13, color:C.white, padding:'3px 0', outline:'none', minWidth:0 }}
        />

        {/* Preview toggle */}
        <div style={{ display:'flex', background:C.bg, borderRadius:3, border:`1px solid ${C.border}`, overflow:'hidden', flexShrink:0 }}>
          {[{k:'desktop',l:'⊡ Desktop'},{k:'mobile',l:'▧ Mobile'}].map(t => (
            <button key={t.k} onClick={() => setPreviewMode(t.k)}
              style={{ padding:'5px 12px', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, background:previewMode===t.k?GOLD_DIM:'transparent', color:previewMode===t.k?GOLD:C.grey, border:'none', borderRight:t.k==='desktop'?`1px solid ${C.border}`:'none', cursor:'pointer' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Actions */}
        <button onClick={() => setShowPicker(true)}
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
          Templates
        </button>
        <button onClick={handleCopyHTML}
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
          Copy HTML
        </button>
        <button
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
          Save Draft
        </button>
        <button onClick={() => setShowSendModal(true)}
          disabled={blocks.length === 0}
          style={{ padding:'6px 20px', background: blocks.length === 0 ? '#444' : GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color: blocks.length === 0 ? '#888' : '#000', letterSpacing:'0.06em', cursor: blocks.length === 0 ? 'not-allowed' : 'pointer' }}>
          Send ▶
        </button>

        {onBack && (
          <button onClick={onBack}
            style={{ marginLeft:4, padding:'6px 12px', background:'transparent', border:'none', fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
            ← Back
          </button>
        )}
      </div>

      {/* ── Body: three columns ── */}
      <div style={{ flex:1, display:'flex', minHeight:0, overflow:'hidden' }}>

        {/* LEFT — block palette */}
        <div style={{ width:210, flexShrink:0, borderRight:`1px solid ${C.border}`, background:C.card, overflowY:'auto', padding:'14px 0' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:C.grey, letterSpacing:'0.12em', textTransform:'uppercase', padding:'0 14px 10px' }}>Add Blocks</div>

          {CATS.map(cat => (
            <div key={cat} style={{ marginBottom:4 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:GOLD, letterSpacing:'0.12em', textTransform:'uppercase', padding:'8px 14px 4px' }}>{cat}</div>
              {BLOCK_DEFS.filter(d => d.cat===cat).map(def => (
                <button key={def.type} onClick={() => addBlock(def.type)}
                  style={{ width:'100%', display:'flex', alignItems:'center', gap:10, padding:'8px 14px', background:'transparent', border:'none', cursor:'pointer', textAlign:'left', borderRadius:0, transition:'background 0.1s' }}
                  onMouseEnter={e => e.currentTarget.style.background=GOLD_DIM}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ width:26, height:26, borderRadius:3, background:C.bg, border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:GOLD, flexShrink:0 }}>{def.icon}</span>
                  <div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:C.white }}>{def.label}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey }}>{def.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* CENTER — canvas */}
        <div style={{ flex:1, overflowY:'auto', background:'#e8e3db', display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 20px' }}
          onClick={e => { if(e.target===e.currentTarget) setSelectedId(null); }}>

          <div style={{ width:canvasWidth, transition:'width 0.25s', background:'#ffffff', boxShadow:'0 2px 24px rgba(0,0,0,0.10)', marginBottom:24, minHeight:200, position:'relative' }}
            onClick={e => { if(e.target===e.currentTarget) setSelectedId(null); }}>

            {blocks.length === 0 && (
              <div style={{ padding:'60px 40px', textAlign:'center' }}>
                <div style={{ fontSize:28, opacity:0.25, marginBottom:10 }}>+</div>
                <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#bbb', lineHeight:1.6 }}>Add blocks from the left panel, or choose a template above</p>
              </div>
            )}

            {blocks.map((block, idx) => (
              <div key={block.id}
                style={{ position:'relative', outline: selectedId===block.id ? `2px solid ${GOLD}` : hoveredId===block.id ? `1px dashed ${GOLD_BDR}` : 'none', outlineOffset:-1, cursor:'pointer' }}
                onClick={e => { e.stopPropagation(); setSelectedId(block.id); }}
                onMouseEnter={() => setHoveredId(block.id)}
                onMouseLeave={() => setHoveredId(null)}>

                <BlockPreview block={block} />

                {/* Block toolbar (shown on hover or select) */}
                {(hoveredId===block.id || selectedId===block.id) && (
                  <div style={{ position:'absolute', top:4, right:4, display:'flex', gap:3, zIndex:10 }}
                    onClick={e => e.stopPropagation()}>
                    {[
                      { icon:'↑', title:'Move up',    action:()=>moveBlock(block.id,-1), disabled:idx===0 },
                      { icon:'↓', title:'Move down',  action:()=>moveBlock(block.id, 1), disabled:idx===blocks.length-1 },
                      { icon:'⊕', title:'Duplicate',  action:()=>duplicateBlock(block.id) },
                      { icon:'✕', title:'Delete',     action:()=>deleteBlock(block.id), danger:true },
                    ].map(btn => (
                      <button key={btn.icon} title={btn.title} onClick={btn.action} disabled={btn.disabled}
                        style={{ width:22, height:22, background: btn.danger ? '#ef4444' : GOLD, color:'#fff', border:'none', borderRadius:2, fontSize:10, cursor:btn.disabled?'not-allowed':'pointer', opacity:btn.disabled?0.35:1, display:'flex', alignItems:'center', justifyContent:'center', lineHeight:1 }}>
                        {btn.icon}
                      </button>
                    ))}
                  </div>
                )}

                {/* Block type label */}
                {(hoveredId===block.id || selectedId===block.id) && (
                  <div style={{ position:'absolute', top:4, left:4, background:selectedId===block.id?GOLD:'rgba(0,0,0,0.45)', color:'#fff', fontFamily:'var(--font-body)', fontSize:9, fontWeight:600, letterSpacing:'0.08em', textTransform:'uppercase', padding:'2px 6px', borderRadius:2, pointerEvents:'none' }}>
                    {BLOCK_DEFS.find(d=>d.type===block.type)?.label || block.type}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add block shortcut bar at bottom */}
          <div style={{ display:'flex', gap:8, flexWrap:'wrap', justifyContent:'center', maxWidth:canvasWidth }}>
            {['heading','text','image','button','divider','spacer'].map(type => (
              <button key={type} onClick={() => addBlock(type)}
                style={{ padding:'5px 13px', background:'rgba(255,255,255,0.7)', border:`1px solid #ccc`, borderRadius:20, fontFamily:'var(--font-body)', fontSize:11, color:'#555', cursor:'pointer', backdropFilter:'blur(4px)' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.color=GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor='#ccc'; e.currentTarget.style.color='#555'; }}>
                + {BLOCK_DEFS.find(d=>d.type===type)?.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT — properties panel */}
        <div style={{ width:264, flexShrink:0, borderLeft:`1px solid ${C.border}`, background:C.card, overflowY:'auto' }}>
          <div style={{ padding:'13px 18px 10px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:C.grey, letterSpacing:'0.12em', textTransform:'uppercase' }}>Properties</div>
          </div>
          <PropertiesPanel
            block={selectedBlock}
            onChange={newProps => selectedBlock && updateBlock(selectedBlock.id, newProps)}
            C={C}
          />
        </div>

      </div>
    </div>
  );
}
