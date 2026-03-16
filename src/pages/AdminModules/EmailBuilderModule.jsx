import { useState, useRef, useCallback, useEffect } from 'react';
import { sendEmail, fetchNewsletterSubscribers } from '../../services/emailSendService';
import {
  generateSubjectLines,
  rewriteBlockCopy,
  generateSpotlightSummary,
  generateNewsletterDraft,
  generateAiTemplate,
} from '../../services/emailAiService';

const GOLD      = '#8f7420';
const GOLD_DIM  = 'rgba(143,116,32,0.09)';
const GOLD_BDR  = 'rgba(143,116,32,0.30)';

// ── Block catalogue ───────────────────────────────────────────────────────────
const BLOCK_DEFS = [
  { type:'header',      label:'Header',           icon:'▤', cat:'Structure', desc:'Logo + top bar' },
  { type:'hero',        label:'Hero',             icon:'▨', cat:'Media',     desc:'Full-width banner' },
  { type:'heading',     label:'Heading',          icon:'T',  cat:'Content',   desc:'Section title' },
  { type:'text',        label:'Text',             icon:'≡',  cat:'Content',   desc:'Body paragraph' },
  { type:'image',       label:'Image',            icon:'⊞',  cat:'Media',     desc:'Image + caption' },
  { type:'button',      label:'Button',           icon:'⊡',  cat:'Content',   desc:'Call to action' },
  { type:'columns',     label:'2 Columns',        icon:'⊟',  cat:'Layout',    desc:'Side by side' },
  { type:'divider',     label:'Divider',          icon:'─',  cat:'Layout',    desc:'Horizontal rule' },
  { type:'spacer',      label:'Spacer',           icon:'↕',  cat:'Layout',    desc:'Vertical gap' },
  { type:'social',      label:'Social',           icon:'◎',  cat:'Structure', desc:'Social icons' },
  { type:'footer',      label:'Footer',           icon:'▥',  cat:'Structure', desc:'Footer + unsub' },
  // ── Platform content blocks ────────────────────────────────────────────────
  { type:'article',     label:'Magazine Article', icon:'◧',  cat:'Platform',  desc:'Pull article from magazine' },
  { type:'venue_spot',  label:'Venue Spotlight',  icon:'⌂',  cat:'Platform',  desc:'Venue from listings database' },
  { type:'vendor_spot', label:'Vendor Spotlight', icon:'◈',  cat:'Platform',  desc:'Vendor from directory' },
  { type:'latest_art',  label:'Latest Articles',  icon:'◑',  cat:'Platform',  desc:'Auto-pull 3 recent articles' },
  { type:'destination', label:'Destination',      icon:'⊙',  cat:'Platform',  desc:'Venues by region' },
];
const CATS = ['Content','Media','Layout','Structure','Platform'];

// ── AI constants ──────────────────────────────────────────────────────────────
const TONE_PRESETS = [
  { key:'luxury',   label:'Luxury Editorial',    desc:'Refined, elevated, aspirational' },
  { key:'romantic', label:'Warm & Romantic',      desc:'Heartfelt and celebratory' },
  { key:'travel',   label:'High-End Travel',      desc:'Evocative of place and atmosphere' },
  { key:'concise',  label:'Elegant & Concise',    desc:'Minimal, precise, authoritative' },
  { key:'launch',   label:'Launch Announcement',  desc:'Exciting, newsworthy, urgent' },
];

const AI_REWRITE_ACTIONS = [
  { key:'rewrite',   label:'Rewrite' },
  { key:'shorten',   label:'Shorten' },
  { key:'expand',    label:'Expand' },
  { key:'luxury',    label:'Luxury' },
  { key:'editorial', label:'Editorial' },
  { key:'concise',   label:'Concise' },
];

// Blocks that support per-block AI text rewrite
const AI_REWRITE_BLOCKS = new Set(['heading','text','hero']);
// Blocks that support AI summary/spotlight generation
const AI_SUMMARY_BLOCKS = new Set(['article','venue_spot','vendor_spot']);

// ── AI helper functions ───────────────────────────────────────────────────────
function getMainTextFromBlock(block) {
  const p = block.props;
  switch(block.type) {
    case 'heading': return p.text || '';
    case 'text':    return p.content || '';
    case 'hero':    return [p.headline, p.subtext].filter(Boolean).join('\n');
    default:        return '';
  }
}

function applyAiTextToBlock(block, aiText) {
  const p = block.props;
  switch(block.type) {
    case 'heading': return { ...p, text: aiText };
    case 'text':    return { ...p, content: aiText };
    case 'hero': {
      const lines = aiText.split(/\n+/).map(l => l.trim()).filter(Boolean);
      return { ...p, headline: lines[0] || p.headline, subtext: lines.slice(1).join(' ') || p.subtext };
    }
    default: return p;
  }
}

function getBlockContextString(block) {
  const p = block.props;
  if (block.type === 'article')     return `Article titled "${p.headline}" - ${p.excerpt}`;
  if (block.type === 'venue_spot')  return `Venue named "${p.venueName}" - ${p.summary}`;
  if (block.type === 'vendor_spot') return `Vendor named "${p.vendorName}" - ${p.description}`;
  return '';
}

function getDestinationFromBlocks(blocks) {
  const d = blocks.find(b => b.type === 'destination');
  return d?.props?.destination || '';
}

let _uid = Date.now();
const nextId = () => `b${++_uid}`;

function defaultProps(type) {
  switch (type) {
    case 'header':  return { logoUrl:'', logoText:'LWD', background:'#ffffff', textColor:'#171717' };
    case 'hero':    return { imageUrl:'', headline:'Your Headline Here', subtext:'A compelling subtitle for your audience.', ctaLabel:'Learn More', ctaUrl:'#', showCta:true, background:'#1a1a1a', textColor:'#ffffff', textAlign:'center', minHeight:280 };
    case 'heading': return { text:'Section Heading', align:'left', color:'#171717', serif:true, fontSize:26 };
    case 'text':    return { content:'Your paragraph text goes here. Keep it concise and engaging - 2 to 4 sentences works best for email.', align:'left', color:'#444444', fontSize:15, lineHeight:1.8 };
    case 'image':   return { url:'', alt:'', caption:'', borderRadius:0 };
    case 'button':  return { label:'Get Started', url:'#', background:'#8f7420', color:'#ffffff', align:'center', borderRadius:2, paddingH:32, paddingV:13, fontSize:12 };
    case 'columns': return { leftHead:'First Feature', leftText:'Describe your first highlight here.', rightHead:'Second Feature', rightText:'Describe your second highlight here.', leftImg:'', rightImg:'', background:'#ffffff' };
    case 'divider': return { color:'#e0d9cc', thickness:1, marginTop:20, marginBottom:20 };
    case 'spacer':  return { height:40 };
    case 'social':  return { instagram:'', facebook:'', pinterest:'', twitter:'', color:'#8f7420', align:'center' };
    case 'footer':      return { companyName:'Luxury Wedding Directory', address:'London, United Kingdom', unsubscribeUrl:'https://luxuryweddingdirectory.co.uk/unsubscribe?email={{email}}', background:'#f8f4ef', textColor:'#999999', fontSize:11 };
    // ── Platform content defaults ──────────────────────────────────────────────
    case 'article':     return { articleId:'', headline:'Article Headline', excerpt:'A short, compelling excerpt that draws the reader in and makes them want to read more.', imageUrl:'', category:'', articleUrl:'https://luxuryweddingdirectory.co.uk/magazine', ctaLabel:'Read Article', background:'#ffffff', accentColor:'#8f7420' };
    case 'venue_spot':  return { listingId:'', venueName:'Venue Name', summary:'A beautiful venue with exceptional service and stunning surroundings, perfect for your special day.', imageUrl:'', venueUrl:'https://luxuryweddingdirectory.co.uk', ctaLabel:'View Venue', background:'#ffffff', accentColor:'#8f7420' };
    case 'vendor_spot': return { vendorId:'', vendorName:'Vendor Name', description:'Specialist services tailored for luxury weddings, with years of experience and an impeccable portfolio.', imageUrl:'', vendorUrl:'https://luxuryweddingdirectory.co.uk', ctaLabel:'View Profile', background:'#ffffff', accentColor:'#8f7420' };
    case 'latest_art':  return { limit:3, background:'#f6f1e8', accentColor:'#8f7420', ctaLabel:'Read More', _items:[] };
    case 'destination': return { destination:'', limit:3, background:'#f6f1e8', accentColor:'#8f7420', ctaLabel:'View Venue', _items:[] };
    default:            return {};
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

    // ── Platform content previews ────────────────────────────────────────────
    case 'article':
      return (
        <div style={{ background: p.background || '#fff', padding:'20px 32px' }}>
          {p.imageUrl
            ? <img src={p.imageUrl} alt="" style={{ width:'100%', maxHeight:200, objectFit:'cover', borderRadius:2, display:'block', marginBottom:12 }} />
            : <div style={{ width:'100%', height:130, background:'#f0ece6', border:'1.5px dashed #cfc5b4', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:16, opacity:0.3 }}>◧</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#bbb' }}>Pick an article to load image</span>
              </div>
          }
          {p.category && <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.accentColor||GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:6 }}>{p.category}</div>}
          <div style={{ fontFamily:'var(--font-heading)', fontSize:19, fontWeight:700, color:'#171717', lineHeight:1.25, marginBottom:8 }}>{p.headline}</div>
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#555', lineHeight:1.65, margin:'0 0 14px' }}>{p.excerpt}</p>
          <span style={{ display:'inline-block', background:p.accentColor||GOLD, color:'#fff', padding:'8px 20px', fontSize:10, fontFamily:'var(--font-body)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:2 }}>{p.ctaLabel}</span>
        </div>
      );

    case 'venue_spot':
      return (
        <div style={{ background: p.background || '#fff', padding:'20px 32px' }}>
          {p.imageUrl
            ? <img src={p.imageUrl} alt="" style={{ width:'100%', maxHeight:220, objectFit:'cover', borderRadius:2, display:'block', marginBottom:12 }} />
            : <div style={{ width:'100%', height:140, background:'#f0ece6', border:'1.5px dashed #cfc5b4', borderRadius:2, display:'flex', alignItems:'center', justifyContent:'center', marginBottom:12, flexDirection:'column', gap:4 }}>
                <span style={{ fontSize:18, opacity:0.3 }}>⌂</span>
                <span style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#bbb' }}>Pick a venue to load image</span>
              </div>
          }
          <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.accentColor||GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:5 }}>Venue Spotlight</div>
          <div style={{ fontFamily:'var(--font-heading)', fontSize:20, fontWeight:700, color:'#171717', lineHeight:1.2, marginBottom:8 }}>{p.venueName}</div>
          <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#555', lineHeight:1.65, margin:'0 0 14px' }}>{p.summary}</p>
          <span style={{ display:'inline-block', background:p.accentColor||GOLD, color:'#fff', padding:'8px 20px', fontSize:10, fontFamily:'var(--font-body)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:2 }}>{p.ctaLabel}</span>
        </div>
      );

    case 'vendor_spot':
      return (
        <div style={{ background: p.background || '#fff', padding:'20px 32px', display:'flex', gap:20, alignItems:'flex-start' }}>
          <div style={{ flexShrink:0, width:100 }}>
            {p.imageUrl
              ? <img src={p.imageUrl} alt="" style={{ width:100, height:100, objectFit:'cover', borderRadius:4, display:'block' }} />
              : <div style={{ width:100, height:100, background:'#f0ece6', border:'1.5px dashed #cfc5b4', borderRadius:4, display:'flex', alignItems:'center', justifyContent:'center', flexDirection:'column', gap:4 }}>
                  <span style={{ fontSize:16, opacity:0.3 }}>◈</span>
                </div>
            }
          </div>
          <div style={{ flex:1 }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.accentColor||GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Vendor Spotlight</div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color:'#171717', marginBottom:6 }}>{p.vendorName}</div>
            <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#555', lineHeight:1.6, margin:'0 0 12px' }}>{p.description}</p>
            <span style={{ display:'inline-block', background:p.accentColor||GOLD, color:'#fff', padding:'6px 16px', fontSize:10, fontFamily:'var(--font-body)', fontWeight:700, letterSpacing:'0.08em', textTransform:'uppercase', borderRadius:2 }}>{p.ctaLabel}</span>
          </div>
        </div>
      );

    case 'latest_art': {
      const arts = p._items || [];
      return (
        <div style={{ background: p.background || '#f6f1e8', padding:'20px 32px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.accentColor||GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:12 }}>Latest from the Magazine</div>
          {arts.length === 0 ? (
            <div style={{ padding:'24px', background:'rgba(143,116,32,0.05)', border:'1.5px dashed rgba(143,116,32,0.25)', borderRadius:4, textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#999', lineHeight:1.6 }}>Click "Load Articles" in the properties panel to pull the latest magazine content</div>
            </div>
          ) : (
            arts.slice(0, p.limit || 3).map((art, i) => (
              <div key={i} style={{ display:'flex', gap:14, paddingBottom:14, marginBottom:14, borderBottom: i < arts.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none' }}>
                {art.imageUrl && <img src={art.imageUrl} alt="" style={{ width:72, height:56, objectFit:'cover', borderRadius:2, flexShrink:0 }} />}
                <div style={{ flex:1 }}>
                  {art.category && <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.accentColor||GOLD, letterSpacing:'0.08em', textTransform:'uppercase', marginBottom:3 }}>{art.category}</div>}
                  <div style={{ fontFamily:'var(--font-heading)', fontSize:14, fontWeight:700, color:'#171717', lineHeight:1.3, marginBottom:4 }}>{art.title}</div>
                  <a href="#" style={{ fontFamily:'var(--font-body)', fontSize:11, color:p.accentColor||GOLD, textDecoration:'none', fontWeight:600 }}>{p.ctaLabel} →</a>
                </div>
              </div>
            ))
          )}
        </div>
      );
    }

    case 'destination': {
      const venues = p._items || [];
      return (
        <div style={{ background: p.background || '#f6f1e8', padding:'20px 32px' }}>
          <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:p.accentColor||GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:4 }}>Destination Discovery</div>
          {p.destination && <div style={{ fontFamily:'var(--font-heading)', fontSize:18, fontWeight:700, color:'#171717', marginBottom:12 }}>{p.destination}</div>}
          {venues.length === 0 ? (
            <div style={{ padding:'24px', background:'rgba(143,116,32,0.05)', border:'1.5px dashed rgba(143,116,32,0.25)', borderRadius:4, textAlign:'center' }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#999', lineHeight:1.6 }}>Enter a destination and click "Load Venues" in the properties panel</div>
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {venues.slice(0, p.limit || 3).map((v, i) => (
                <div key={i} style={{ background:'#fff', borderRadius:3, overflow:'hidden', border:'1px solid rgba(0,0,0,0.07)' }}>
                  {v.imageUrl
                    ? <img src={v.imageUrl} alt="" style={{ width:'100%', height:80, objectFit:'cover', display:'block' }} />
                    : <div style={{ width:'100%', height:80, background:'#ece6dc', display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:16, opacity:0.3 }}>⌂</span></div>
                  }
                  <div style={{ padding:'8px 10px' }}>
                    <div style={{ fontFamily:'var(--font-heading)', fontSize:12, fontWeight:700, color:'#171717', lineHeight:1.2, marginBottom:4 }}>{v.name}</div>
                    <a href="#" style={{ fontFamily:'var(--font-body)', fontSize:10, color:p.accentColor||GOLD, textDecoration:'none', fontWeight:600 }}>{p.ctaLabel} →</a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }

    default:
      return <div style={{ ...pad, color:'#aaa' }}>Unknown block: {block.type}</div>;
  }
}

// ── Properties panel ──────────────────────────────────────────────────────────

// Reusable AI actions strip for text-type blocks
function AiActionsBar({ actions, loading, onAction }) {
  return (
    <div style={{ background:'rgba(143,116,32,0.07)', border:`1px solid rgba(143,116,32,0.2)`, borderRadius:4, padding:'10px 12px', marginBottom:16 }}>
      <div style={{ fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>
        {loading ? '✦ Writing with AI...' : '✦ AI Assist'}
      </div>
      <div style={{ display:'flex', flexWrap:'wrap', gap:5 }}>
        {actions.map(a => (
          <button key={a.key} onClick={() => onAction(a.key)} disabled={loading}
            style={{ padding:'4px 10px', background: loading ? 'transparent' : 'rgba(143,116,32,0.1)', border:`1px solid rgba(143,116,32,0.3)`, borderRadius:20, fontFamily:'var(--font-body)', fontSize:10, color: loading ? '#666' : GOLD, cursor: loading ? 'not-allowed' : 'pointer', transition:'all 0.12s' }}
            onMouseEnter={e => { if (!loading) e.currentTarget.style.background=GOLD; if (!loading) e.currentTarget.style.color='#000'; }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(143,116,32,0.1)'; e.currentTarget.style.color=loading?'#666':GOLD; }}>
            {a.label}
          </button>
        ))}
      </div>
    </div>
  );
}

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

function PropertiesPanel({ block, onChange, C, onPickContent, onLoadLatestArticles, onLoadDestinationVenues, onAiAction, onAiSummary, aiBlockLoading }) {
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
        <AiActionsBar actions={[{key:'rewrite',label:'Rewrite'},{key:'luxury',label:'Luxury'},{key:'concise',label:'Concise'}]} loading={aiBlockLoading} onAction={onAiAction} />
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
        <AiActionsBar actions={[{key:'rewrite',label:'Rewrite'},{key:'luxury',label:'Luxury'},{key:'editorial',label:'Editorial'},{key:'concise',label:'Concise'}]} loading={aiBlockLoading} onAction={onAiAction} />
        <PropRow label="Text"><PInput value={p.text} onChange={v=>s('text',v)} /></PropRow>
        <PropRow label="Font Size (px)"><PInput type="number" value={p.fontSize} onChange={v=>s('fontSize',v)} min={12} max={60} /></PropRow>
        <PropRow label="Color"><PInput type="color" value={p.color} onChange={v=>s('color',v)} /></PropRow>
        <PropRow label="Align"><PSelect value={p.align} onChange={v=>s('align',v)} options={['left','center','right']} /></PropRow>
        <PropRow label="Font"><PToggle value={p.serif} onChange={v=>s('serif',v)} label="Use serif (Cormorant)" /></PropRow>
      </>}

      {/* TEXT */}
      {block.type==='text' && <>
        <AiActionsBar actions={AI_REWRITE_ACTIONS} loading={aiBlockLoading} onAction={onAiAction} />
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

      {/* ── PLATFORM CONTENT BLOCKS ── */}

      {/* ARTICLE */}
      {block.type==='article' && <>
        {p.headline && (
          <button onClick={() => onAiSummary && onAiSummary('article')} disabled={aiBlockLoading}
            style={{ width:'100%', padding:'8px 0', background:'transparent', border:`1px solid ${GOLD}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:GOLD, letterSpacing:'0.07em', textTransform:'uppercase', cursor: aiBlockLoading ? 'not-allowed' : 'pointer', marginBottom:10, opacity: aiBlockLoading ? 0.5 : 1 }}>
            {aiBlockLoading ? '✦ Writing...' : '✦ Generate AI Summary + CTA'}
          </button>
        )}
        <button onClick={() => onPickContent && onPickContent('article')}
          style={{ width:'100%', padding:'9px 0', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', marginBottom:18 }}>
          Pick from Magazine
        </button>
        {p.articleId && <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:GOLD, marginBottom:14, wordBreak:'break-all' }}>Linked: {p.articleId}</div>}
        <PropRow label="Headline"><PInput value={p.headline} onChange={v=>s('headline',v)} /></PropRow>
        <PropRow label="Excerpt"><PInput value={p.excerpt} onChange={v=>s('excerpt',v)} rows={3} /></PropRow>
        <PropRow label="Category Tag"><PInput value={p.category||''} onChange={v=>s('category',v)} placeholder="e.g. Real Weddings" /></PropRow>
        <PropRow label="Image URL"><PImageInput value={p.imageUrl} onChange={v=>s('imageUrl',v)} /></PropRow>
        <PropRow label="Article URL"><PInput value={p.articleUrl} onChange={v=>s('articleUrl',v)} /></PropRow>
        <PropRow label="Button Label"><PInput value={p.ctaLabel} onChange={v=>s('ctaLabel',v)} /></PropRow>
        <PropRow label="Accent Color"><PInput type="color" value={p.accentColor||GOLD} onChange={v=>s('accentColor',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background||'#ffffff'} onChange={v=>s('background',v)} /></PropRow>
      </>}

      {/* VENUE SPOTLIGHT */}
      {block.type==='venue_spot' && <>
        {p.venueName && (
          <button onClick={() => onAiSummary && onAiSummary('venue_spot')} disabled={aiBlockLoading}
            style={{ width:'100%', padding:'8px 0', background:'transparent', border:`1px solid ${GOLD}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:GOLD, letterSpacing:'0.07em', textTransform:'uppercase', cursor: aiBlockLoading ? 'not-allowed' : 'pointer', marginBottom:10, opacity: aiBlockLoading ? 0.5 : 1 }}>
            {aiBlockLoading ? '✦ Writing...' : '✦ Generate Spotlight Copy'}
          </button>
        )}
        <button onClick={() => onPickContent && onPickContent('venue_spot')}
          style={{ width:'100%', padding:'9px 0', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', marginBottom:18 }}>
          Pick from Listings
        </button>
        {p.listingId && <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:GOLD, marginBottom:14, wordBreak:'break-all' }}>Linked: {p.listingId}</div>}
        <PropRow label="Venue Name"><PInput value={p.venueName} onChange={v=>s('venueName',v)} /></PropRow>
        <PropRow label="Summary"><PInput value={p.summary} onChange={v=>s('summary',v)} rows={3} /></PropRow>
        <PropRow label="Image URL"><PImageInput value={p.imageUrl} onChange={v=>s('imageUrl',v)} /></PropRow>
        <PropRow label="Venue URL"><PInput value={p.venueUrl} onChange={v=>s('venueUrl',v)} /></PropRow>
        <PropRow label="Button Label"><PInput value={p.ctaLabel} onChange={v=>s('ctaLabel',v)} /></PropRow>
        <PropRow label="Accent Color"><PInput type="color" value={p.accentColor||GOLD} onChange={v=>s('accentColor',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background||'#ffffff'} onChange={v=>s('background',v)} /></PropRow>
      </>}

      {/* VENDOR SPOTLIGHT */}
      {block.type==='vendor_spot' && <>
        {p.vendorName && (
          <button onClick={() => onAiSummary && onAiSummary('vendor_spot')} disabled={aiBlockLoading}
            style={{ width:'100%', padding:'8px 0', background:'transparent', border:`1px solid ${GOLD}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:GOLD, letterSpacing:'0.07em', textTransform:'uppercase', cursor: aiBlockLoading ? 'not-allowed' : 'pointer', marginBottom:10, opacity: aiBlockLoading ? 0.5 : 1 }}>
            {aiBlockLoading ? '✦ Writing...' : '✦ Generate Vendor Description'}
          </button>
        )}
        <button onClick={() => onPickContent && onPickContent('vendor_spot')}
          style={{ width:'100%', padding:'9px 0', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', marginBottom:18 }}>
          Pick from Vendors
        </button>
        {p.vendorId && <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:GOLD, marginBottom:14, wordBreak:'break-all' }}>Linked: {p.vendorId}</div>}
        <PropRow label="Vendor Name"><PInput value={p.vendorName} onChange={v=>s('vendorName',v)} /></PropRow>
        <PropRow label="Description"><PInput value={p.description} onChange={v=>s('description',v)} rows={3} /></PropRow>
        <PropRow label="Image URL"><PImageInput value={p.imageUrl} onChange={v=>s('imageUrl',v)} /></PropRow>
        <PropRow label="Vendor URL"><PInput value={p.vendorUrl} onChange={v=>s('vendorUrl',v)} /></PropRow>
        <PropRow label="Button Label"><PInput value={p.ctaLabel} onChange={v=>s('ctaLabel',v)} /></PropRow>
        <PropRow label="Accent Color"><PInput type="color" value={p.accentColor||GOLD} onChange={v=>s('accentColor',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background||'#ffffff'} onChange={v=>s('background',v)} /></PropRow>
      </>}

      {/* LATEST ARTICLES */}
      {block.type==='latest_art' && <>
        <PropRow label="Max Articles">
          <PSelect value={String(p.limit||3)} onChange={v=>s('limit',Number(v))} options={['1','2','3','4','5']} />
        </PropRow>
        <PropRow label="Button Label"><PInput value={p.ctaLabel} onChange={v=>s('ctaLabel',v)} /></PropRow>
        <PropRow label="Accent Color"><PInput type="color" value={p.accentColor||GOLD} onChange={v=>s('accentColor',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background||'#f6f1e8'} onChange={v=>s('background',v)} /></PropRow>
        <button onClick={() => onLoadLatestArticles && onLoadLatestArticles()}
          style={{ width:'100%', padding:'9px 0', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', marginTop:8 }}>
          Load Articles
        </button>
        {(p._items||[]).length > 0 && (
          <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#10b981', marginTop:8 }}>
            {p._items.length} article{p._items.length !== 1 ? 's' : ''} loaded
          </div>
        )}
      </>}

      {/* DESTINATION */}
      {block.type==='destination' && <>
        <PropRow label="Destination / Region"><PInput value={p.destination||''} onChange={v=>s('destination',v)} placeholder="e.g. Lake Como, Tuscany..." /></PropRow>
        <PropRow label="Max Venues">
          <PSelect value={String(p.limit||3)} onChange={v=>s('limit',Number(v))} options={['1','2','3']} />
        </PropRow>
        <PropRow label="Button Label"><PInput value={p.ctaLabel} onChange={v=>s('ctaLabel',v)} /></PropRow>
        <PropRow label="Accent Color"><PInput type="color" value={p.accentColor||GOLD} onChange={v=>s('accentColor',v)} /></PropRow>
        <PropRow label="Background"><PInput type="color" value={p.background||'#f6f1e8'} onChange={v=>s('background',v)} /></PropRow>
        <button onClick={() => onLoadDestinationVenues && onLoadDestinationVenues()}
          style={{ width:'100%', padding:'9px 0', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', letterSpacing:'0.07em', textTransform:'uppercase', cursor:'pointer', marginTop:8 }}>
          Load Venues
        </button>
        {(p._items||[]).length > 0 && (
          <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:'#10b981', marginTop:8 }}>
            {p._items.length} venue{p._items.length !== 1 ? 's' : ''} loaded for "{p.destination}"
          </div>
        )}
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
          ${p.logoUrl ? `<img src="${p.logoUrl}" alt="logo" style="height:32px;max-width:100%;display:block;" />` : `<span style="font-family:Georgia,serif;font-size:17px;font-weight:700;color:${p.textColor};">${p.logoText}</span>`}
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
        return `<tr><td style="padding:12px 32px;text-align:center;">${p.url ? `<img src="${p.url}" alt="${p.alt||''}" style="width:100%;max-width:100%;display:block;border-radius:${p.borderRadius}px;" />` : ''} ${p.caption ? `<p style="font-family:Arial,sans-serif;font-size:11px;color:#999;margin-top:7px;font-style:italic;">${p.caption}</p>` : ''}</td></tr>`;
      case 'button':
        return `<tr><td style="padding:20px 32px;text-align:${p.align};"><a href="${p.url}" style="display:inline-block;background:${p.background};color:${p.color};padding:${p.paddingV}px ${p.paddingH}px;font-family:Arial,sans-serif;font-size:${p.fontSize}px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:${p.borderRadius}px;">${p.label}</a></td></tr>`;
      case 'columns':
        return `<tr><td style="background:${p.background};padding:20px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td width="48%" style="vertical-align:top;padding-right:12px;">
                ${p.leftImg ? `<img src="${p.leftImg}" alt="" style="width:100%;max-width:100%;display:block;border-radius:2px;margin-bottom:10px;" />` : ''}
                <div style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:#171717;margin-bottom:6px;">${p.leftHead}</div>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.6;margin:0;">${p.leftText}</p>
              </td>
              <td width="4%"></td>
              <td width="48%" style="vertical-align:top;padding-left:12px;">
                ${p.rightImg ? `<img src="${p.rightImg}" alt="" style="width:100%;max-width:100%;display:block;border-radius:2px;margin-bottom:10px;" />` : ''}
                <div style="font-family:Georgia,serif;font-size:15px;font-weight:700;color:#171717;margin-bottom:6px;">${p.rightHead}</div>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.6;margin:0;">${p.rightText}</p>
              </td>
            </tr>
          </table>
        </td></tr>`;
      case 'social': {
        const socLinks = [
          { key:'instagram', lbl:'IG' },
          { key:'facebook',  lbl:'FB' },
          { key:'pinterest', lbl:'PI' },
          { key:'twitter',   lbl:'TW' },
        ];
        const activeSoc = socLinks.filter(l => p[l.key]);
        const showSoc   = activeSoc.length > 0 ? activeSoc : socLinks.slice(0,3);
        const items = showSoc.map(l =>
          `<a href="${p[l.key] || '#'}" style="display:inline-block;width:32px;height:32px;border-radius:50%;border:1.5px solid ${p.color};text-align:center;line-height:30px;font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${p.color};text-decoration:none;margin:0 4px;">${l.lbl}</a>`
        ).join('');
        return `<tr><td style="padding:20px 32px;text-align:${p.align};">
          <p style="font-family:Arial,sans-serif;font-size:10px;color:#aaaaaa;letter-spacing:0.1em;text-transform:uppercase;margin:0 0 10px;">Follow Us</p>
          ${items}
        </td></tr>`;
      }
      case 'divider':
        return `<tr><td style="padding:${p.marginTop}px 32px ${p.marginBottom}px;"><hr style="border:none;border-top:${p.thickness}px solid ${p.color};margin:0;" /></td></tr>`;
      case 'spacer':
        return `<tr><td style="height:${p.height}px;line-height:${p.height}px;">&nbsp;</td></tr>`;
      case 'footer':
        return `<tr><td style="background:${p.background};padding:22px 32px;text-align:center;">
          <p style="font-family:Arial,sans-serif;font-size:${p.fontSize}px;color:${p.textColor};line-height:1.7;margin:0 0 6px;">${p.companyName} &bull; ${p.address}</p>
          <p style="font-family:Arial,sans-serif;font-size:${p.fontSize}px;color:${p.textColor};margin:0;">
            <a href="${p.unsubscribeUrl}" style="color:${p.textColor};text-decoration:underline;">Unsubscribe</a>
            &nbsp;&bull;&nbsp;
            <a href="#" style="color:${p.textColor};text-decoration:underline;">Privacy Policy</a>
          </p>
        </td></tr>`;
      // ── Platform content HTML export ────────────────────────────────────────
      case 'article': {
        const accent = p.accentColor || '#8f7420';
        return `<tr><td style="background:${p.background||'#ffffff'};padding:24px 32px;">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="" style="width:100%;max-width:100%;display:block;border-radius:2px;margin-bottom:14px;max-height:220px;object-fit:cover;" />` : ''}
          ${p.category ? `<p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${accent};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 8px;">${p.category}</p>` : ''}
          <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#171717;line-height:1.25;margin:0 0 10px;">${p.headline}</h2>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.7;margin:0 0 16px;">${p.excerpt}</p>
          <a href="${p.articleUrl||'#'}" style="display:inline-block;background:${accent};color:#ffffff;padding:9px 22px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:2px;">${p.ctaLabel||'Read Article'}</a>
        </td></tr>`;
      }
      case 'venue_spot': {
        const accent = p.accentColor || '#8f7420';
        return `<tr><td style="background:${p.background||'#ffffff'};padding:24px 32px;">
          ${p.imageUrl ? `<img src="${p.imageUrl}" alt="" style="width:100%;max-width:100%;display:block;border-radius:2px;margin-bottom:14px;max-height:240px;object-fit:cover;" />` : ''}
          <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${accent};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 6px;">Venue Spotlight</p>
          <h2 style="font-family:Georgia,serif;font-size:22px;font-weight:700;color:#171717;line-height:1.2;margin:0 0 10px;">${p.venueName}</h2>
          <p style="font-family:Arial,sans-serif;font-size:14px;color:#555555;line-height:1.7;margin:0 0 16px;">${p.summary}</p>
          <a href="${p.venueUrl||'#'}" style="display:inline-block;background:${accent};color:#ffffff;padding:9px 22px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:2px;">${p.ctaLabel||'View Venue'}</a>
        </td></tr>`;
      }
      case 'vendor_spot': {
        const accent = p.accentColor || '#8f7420';
        return `<tr><td style="background:${p.background||'#ffffff'};padding:24px 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${p.imageUrl ? `<td width="110" style="vertical-align:top;padding-right:18px;"><img src="${p.imageUrl}" alt="" style="width:100px;height:100px;object-fit:cover;border-radius:4px;display:block;" /></td>` : ''}
              <td style="vertical-align:top;">
                <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${accent};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 5px;">Vendor Spotlight</p>
                <h3 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#171717;margin:0 0 8px;">${p.vendorName}</h3>
                <p style="font-family:Arial,sans-serif;font-size:13px;color:#555555;line-height:1.65;margin:0 0 12px;">${p.description}</p>
                <a href="${p.vendorUrl||'#'}" style="display:inline-block;background:${accent};color:#ffffff;padding:8px 18px;font-family:Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;border-radius:2px;">${p.ctaLabel||'View Profile'}</a>
              </td>
            </tr>
          </table>
        </td></tr>`;
      }
      case 'latest_art': {
        const accent = p.accentColor || '#8f7420';
        const arts   = (p._items || []).slice(0, p.limit || 3);
        if (arts.length === 0) return `<tr><td style="padding:20px 32px;background:${p.background||'#f6f1e8'};"><p style="font-family:Arial,sans-serif;font-size:12px;color:#999;text-align:center;">[Latest articles will appear here - click Load Articles in the builder]</p></td></tr>`;
        const rows = arts.map(art => `
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:14px;border-bottom:1px solid rgba(0,0,0,0.08);padding-bottom:14px;">
            <tr>
              ${art.imageUrl ? `<td width="80" style="vertical-align:top;padding-right:14px;"><img src="${art.imageUrl}" alt="" style="width:72px;height:56px;object-fit:cover;border-radius:2px;display:block;" /></td>` : ''}
              <td style="vertical-align:middle;">
                ${art.category ? `<p style="font-family:Arial,sans-serif;font-size:8px;font-weight:700;color:${accent};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">${art.category}</p>` : ''}
                <p style="font-family:Georgia,serif;font-size:14px;font-weight:700;color:#171717;line-height:1.3;margin:0 0 6px;">${art.title}</p>
                <a href="${art.url||'#'}" style="font-family:Arial,sans-serif;font-size:11px;color:${accent};text-decoration:none;font-weight:600;">${p.ctaLabel||'Read More'} &rarr;</a>
              </td>
            </tr>
          </table>`).join('');
        return `<tr><td style="background:${p.background||'#f6f1e8'};padding:22px 32px;">
          <p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${accent};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 14px;">Latest from the Magazine</p>
          ${rows}
        </td></tr>`;
      }
      case 'destination': {
        const accent = p.accentColor || '#8f7420';
        const venues = (p._items || []).slice(0, p.limit || 3);
        if (venues.length === 0) return `<tr><td style="padding:20px 32px;background:${p.background||'#f6f1e8'};"><p style="font-family:Arial,sans-serif;font-size:12px;color:#999;text-align:center;">[Destination venues will appear here - click Load Venues in the builder]</p></td></tr>`;
        const colW = venues.length === 1 ? '100%' : venues.length === 2 ? '48%' : '30%';
        const cells = venues.map(v => `
          <td width="${colW}" style="vertical-align:top;padding:0 6px;">
            ${v.imageUrl ? `<img src="${v.imageUrl}" alt="" style="width:100%;display:block;border-radius:2px;margin-bottom:8px;height:90px;object-fit:cover;" />` : ''}
            <p style="font-family:Georgia,serif;font-size:13px;font-weight:700;color:#171717;margin:0 0 6px;">${v.name}</p>
            <a href="${v.url||'#'}" style="font-family:Arial,sans-serif;font-size:10px;color:${accent};text-decoration:none;font-weight:600;">${p.ctaLabel||'View Venue'} &rarr;</a>
          </td>`).join('<td width="2%"></td>');
        return `<tr><td style="background:${p.background||'#f6f1e8'};padding:22px 32px;">
          ${p.destination ? `<p style="font-family:Arial,sans-serif;font-size:9px;font-weight:700;color:${accent};letter-spacing:0.1em;text-transform:uppercase;margin:0 0 4px;">Destination Discovery</p><h3 style="font-family:Georgia,serif;font-size:20px;font-weight:700;color:#171717;margin:0 0 14px;">${p.destination}</h3>` : ''}
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cells}</tr></table>
        </td></tr>`;
      }
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

// ── AI Subject Lines Panel ────────────────────────────────────────────────────
function AiSubjectPanel({ data, loading, onApply, onApplyPreview, onClose, onRegenerate }) {
  return (
    <div style={{ position:'absolute', top:'100%', left:0, right:0, zIndex:500, background:'#1a1a1a', border:`1px solid ${GOLD_BDR}`, borderRadius:4, boxShadow:'0 8px 32px rgba(0,0,0,0.4)', marginTop:4, maxWidth:560 }}>
      <div style={{ padding:'14px 16px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase' }}>AI Subject Lines</div>
        <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:14, cursor:'pointer', lineHeight:1 }}>x</button>
      </div>
      {loading ? (
        <div style={{ padding:'28px 16px', textAlign:'center', fontFamily:'var(--font-body)', fontSize:12, color:'#888' }}>
          <div style={{ fontSize:18, marginBottom:8 }}>✦</div>
          Generating subject lines...
        </div>
      ) : data ? (
        <div style={{ padding:'12px 0', maxHeight:340, overflowY:'auto' }}>
          {data.subjects?.length > 0 && (
            <>
              <div style={{ padding:'0 16px 8px', fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase' }}>Subject Lines</div>
              {data.subjects.map((s, i) => (
                <div key={i}
                  style={{ padding:'8px 16px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(143,116,32,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#eee', flex:1 }}>{s}</span>
                  <button onClick={() => onApply(s)}
                    style={{ padding:'3px 12px', background:GOLD, border:'none', borderRadius:2, fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#000', cursor:'pointer', flexShrink:0 }}>
                    Use
                  </button>
                </div>
              ))}
            </>
          )}
          {data.previews?.length > 0 && (
            <>
              <div style={{ padding:'12px 16px 8px', fontFamily:'var(--font-body)', fontSize:9, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase' }}>Preview Text</div>
              {data.previews.map((p, i) => (
                <div key={i}
                  style={{ padding:'8px 16px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:12 }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(143,116,32,0.08)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <span style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#bbb', flex:1, fontStyle:'italic' }}>{p}</span>
                  <button onClick={() => onApplyPreview(p)}
                    style={{ padding:'3px 12px', background:'transparent', border:`1px solid ${GOLD_BDR}`, borderRadius:2, fontFamily:'var(--font-body)', fontSize:10, color:GOLD, cursor:'pointer', flexShrink:0 }}>
                    Use
                  </button>
                </div>
              ))}
            </>
          )}
          <div style={{ padding:'10px 16px 4px', textAlign:'center' }}>
            <button onClick={onRegenerate}
              style={{ padding:'5px 16px', background:'transparent', border:`1px solid ${GOLD_BDR}`, borderRadius:2, fontFamily:'var(--font-body)', fontSize:11, color:GOLD, cursor:'pointer' }}>
              Generate Again
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

// ── AI Compose Modal ──────────────────────────────────────────────────────────
function AiComposeModal({ blocks, tone, C, onApply, onClose }) {
  const [loading, setLoading] = useState(false);
  const [draft, setDraft]     = useState(null);
  const [error, setError]     = useState('');
  const [topic, setTopic]     = useState('');

  const handleGenerate = async () => {
    setLoading(true); setError('');
    try {
      const result = await generateNewsletterDraft({ blocks, topic: topic.trim() || undefined, tone });
      setDraft(result);
    } catch (err) {
      setError(err.message || 'AI unavailable');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#1a1a1a', border:`1px solid ${GOLD_BDR}`, borderRadius:6, width:580, maxHeight:'80vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:18, color:'#fff', fontWeight:700 }}>AI Newsletter Composer</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#888', marginTop:2 }}>Generate intro, transitions and closing copy</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>

        <div style={{ padding:'20px 24px', overflowY:'auto', flex:1 }}>
          {!draft ? (
            <>
              <div style={{ marginBottom:16 }}>
                <label style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 }}>Newsletter theme (optional)</label>
                <input value={topic} onChange={e=>setTopic(e.target.value)}
                  placeholder="e.g. Italian destination weddings, Spring inspiration..."
                  style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:`1px solid ${GOLD_BDR}`, borderRadius:3, padding:'8px 12px', fontFamily:'var(--font-body)', fontSize:13, color:'#fff', outline:'none', boxSizing:'border-box' }} />
              </div>
              <div style={{ background:'rgba(143,116,32,0.05)', border:`1px solid ${GOLD_BDR}`, borderRadius:4, padding:'12px 14px', marginBottom:20 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:GOLD, fontWeight:600, marginBottom:6 }}>AI will read {blocks.length} block{blocks.length !== 1 ? 's' : ''} and write:</div>
                <ul style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#999', margin:0, paddingLeft:16, lineHeight:1.8 }}>
                  <li>Opening intro paragraph (2-3 sentences)</li>
                  <li>Closing CTA paragraph (2 sentences)</li>
                  <li>Content based on your platform blocks</li>
                </ul>
              </div>
              {error && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#f87171', marginBottom:14 }}>{error}</div>}
              <button onClick={handleGenerate} disabled={loading}
                style={{ width:'100%', padding:'11px 0', background: loading ? '#333' : GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, color: loading ? '#888' : '#000', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:'0.07em', textTransform:'uppercase' }}>
                {loading ? 'Writing with AI...' : 'Generate Draft'}
              </button>
            </>
          ) : (
            <>
              <div style={{ marginBottom:20 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Opening Paragraph</div>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:4, padding:'12px 14px', fontFamily:'var(--font-body)', fontSize:13, color:'#ddd', lineHeight:1.7 }}>
                  {draft.intro}
                </div>
              </div>
              <div style={{ marginBottom:24 }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:GOLD, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:8 }}>Closing CTA</div>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:4, padding:'12px 14px', fontFamily:'var(--font-body)', fontSize:13, color:'#ddd', lineHeight:1.7 }}>
                  {draft.closing}
                </div>
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button onClick={() => onApply(draft)}
                  style={{ flex:1, padding:'10px 0', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, color:'#000', cursor:'pointer' }}>
                  Insert into Email
                </button>
                <button onClick={() => { setDraft(null); setError(''); }}
                  style={{ padding:'10px 20px', background:'transparent', border:`1px solid ${GOLD_BDR}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:GOLD, cursor:'pointer' }}>
                  Try Again
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── AI Template Modal ─────────────────────────────────────────────────────────
function AiTemplateModal({ tone, C, onApply, onClose }) {
  const [topic,       setTopic]       = useState('');
  const [audience,    setAudience]    = useState('luxury couples');
  const [destination, setDestination] = useState('');
  const [sections,    setSections]    = useState(3);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState('');

  const handleGenerate = async () => {
    if (!topic.trim()) { setError('Please enter a topic or goal'); return; }
    setLoading(true); setError('');
    try {
      const result = await generateAiTemplate({ topic: topic.trim(), audience, destination, sections, tone });
      onApply(result);
    } catch (err) {
      setError(err.message || 'AI unavailable');
    } finally { setLoading(false); }
  };

  const inputStyle = { width:'100%', background:'rgba(255,255,255,0.05)', border:`1px solid ${GOLD_BDR}`, borderRadius:3, padding:'8px 12px', fontFamily:'var(--font-body)', fontSize:13, color:'#fff', outline:'none', boxSizing:'border-box' };
  const labelStyle = { fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:'#888', letterSpacing:'0.1em', textTransform:'uppercase', display:'block', marginBottom:6 };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:9500, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#1a1a1a', border:`1px solid ${GOLD_BDR}`, borderRadius:6, width:520, overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:18, color:'#fff', fontWeight:700 }}>Create with AI</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#888', marginTop:2 }}>AI builds your first draft layout</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>

        <div style={{ padding:'22px 24px' }}>
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Newsletter goal or topic *</label>
            <input value={topic} onChange={e=>setTopic(e.target.value)} placeholder="e.g. Showcase Lake Como venues, Spring wedding inspiration..."
              style={inputStyle} autoFocus />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:16 }}>
            <div>
              <label style={labelStyle}>Audience</label>
              <select value={audience} onChange={e=>setAudience(e.target.value)}
                style={{ ...inputStyle, appearance:'none', cursor:'pointer' }}>
                <option value="luxury couples">Luxury couples</option>
                <option value="engaged couples planning weddings">Engaged couples</option>
                <option value="destination wedding planners">Destination planners</option>
                <option value="wedding industry professionals">Industry professionals</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Number of sections</label>
              <select value={sections} onChange={e=>setSections(Number(e.target.value))}
                style={{ ...inputStyle, appearance:'none', cursor:'pointer' }}>
                {[2,3,4,5].map(n => <option key={n} value={n}>{n} sections</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom:20 }}>
            <label style={labelStyle}>Destination (optional)</label>
            <input value={destination} onChange={e=>setDestination(e.target.value)} placeholder="e.g. Italy, Lake Como, Tuscany..."
              style={inputStyle} />
          </div>
          {error && <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#f87171', marginBottom:14 }}>{error}</div>}
          <div style={{ display:'flex', gap:10 }}>
            <button onClick={handleGenerate} disabled={loading}
              style={{ flex:1, padding:'11px 0', background: loading ? '#333' : GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, color: loading ? '#888' : '#000', cursor: loading ? 'not-allowed' : 'pointer', letterSpacing:'0.07em', textTransform:'uppercase' }}>
              {loading ? 'Building layout...' : 'Generate Layout'}
            </button>
            <button onClick={onClose}
              style={{ padding:'11px 20px', background:'transparent', border:`1px solid rgba(255,255,255,0.12)`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:'#888', cursor:'pointer' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Content Picker Modal (Magazine / Venues / Vendors) ─────────────────────────
const PICKER_SOURCES = {
  article:    { label:'Magazine Articles', table:'magazine_articles',  cols:'id,title,slug,excerpt,featured_image,category,published_at', nameField:'title',   imgField:'featured_image', urlBase:'https://luxuryweddingdirectory.co.uk/magazine' },
  venue_spot: { label:'Venue Listings',    table:'listings',          cols:'id,name,slug,description,hero_image_url,location',           nameField:'name',    imgField:'hero_image_url',  urlBase:'https://luxuryweddingdirectory.co.uk/venues' },
  vendor_spot:{ label:'Vendors',           table:'listings',          cols:'id,name,slug,description,hero_image_url,location',           nameField:'name',    imgField:'hero_image_url',  urlBase:'https://luxuryweddingdirectory.co.uk/vendors', extraFilter:[{col:'type',val:'vendor'}] },
};

function ContentPickerModal({ type, C, onPick, onClose }) {
  const src = PICKER_SOURCES[type] || PICKER_SOURCES['article'];
  const [items,  setItems]  = useState([]);
  const [search, setSearch] = useState('');
  const [loading,setLoading]= useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { supabase } = await import('../../lib/supabaseClient');
        let q = supabase.from(src.table).select(src.cols).limit(80).order('created_at', { ascending:false });
        if (src.extraFilter) src.extraFilter.forEach(f => { q = q.eq(f.col, f.val); });
        const { data } = await q;
        setItems(data || []);
      } catch { setItems([]); }
      setLoading(false);
    })();
  }, [src.table]);

  const filtered = items.filter(it => {
    const name = it[src.nameField] || '';
    return name.toLowerCase().includes(search.toLowerCase());
  });

  const handlePick = (item) => {
    const name  = item[src.nameField] || '';
    const img   = item[src.imgField]  || '';
    const slug  = item.slug || item.id;
    const url   = `${src.urlBase}/${slug}`;
    // Map fields to block props by type
    if (type === 'article') {
      onPick({ articleId:item.id, headline:name, excerpt:item.excerpt||'', imageUrl:img, category:item.category||'', articleUrl:url });
    } else if (type === 'venue_spot') {
      onPick({ listingId:item.id, venueName:name, summary:item.description||'', imageUrl:img, venueUrl:url });
    } else if (type === 'vendor_spot') {
      onPick({ vendorId:item.id, vendorName:name, description:item.description||'', imageUrl:img, vendorUrl:url });
    }
    onClose();
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', backdropFilter:'blur(4px)', zIndex:9000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:'#1a1a1a', border:`1px solid ${GOLD_BDR}`, borderRadius:6, width:560, maxHeight:'75vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ padding:'18px 24px', borderBottom:'1px solid rgba(255,255,255,0.08)', display:'flex', alignItems:'center', justifyContent:'space-between', flexShrink:0 }}>
          <div>
            <div style={{ fontFamily:'var(--font-heading)', fontSize:18, color:'#fff', fontWeight:700 }}>Pick {src.label}</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#888', marginTop:2 }}>Select an item to auto-populate the block</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:'#888', fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>

        {/* Search */}
        <div style={{ padding:'12px 24px', borderBottom:'1px solid rgba(255,255,255,0.06)', flexShrink:0 }}>
          <input
            autoFocus
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${src.label.toLowerCase()}...`}
            style={{ width:'100%', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(143,116,32,0.3)', borderRadius:3, padding:'7px 12px', fontFamily:'var(--font-body)', fontSize:13, color:'#fff', outline:'none', boxSizing:'border-box' }}
          />
        </div>

        {/* List */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {loading ? (
            <div style={{ padding:32, textAlign:'center', fontFamily:'var(--font-body)', fontSize:12, color:'#888' }}>Loading...</div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:32, textAlign:'center', fontFamily:'var(--font-body)', fontSize:12, color:'#888' }}>
              {items.length === 0 ? `No ${src.label.toLowerCase()} found in database` : 'No results for that search'}
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'12px 24px', cursor:'pointer', borderBottom:'1px solid rgba(255,255,255,0.04)', transition:'background 0.12s' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(143,116,32,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
                onClick={() => handlePick(item)}>
                {/* Thumb */}
                <div style={{ width:52, height:40, flexShrink:0, borderRadius:2, overflow:'hidden', background:'#2a2a2a', display:'flex', alignItems:'center', justifyContent:'center' }}>
                  {item[src.imgField]
                    ? <img src={item[src.imgField]} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : <span style={{ fontSize:14, opacity:0.3 }}>▨</span>
                  }
                </div>
                {/* Info */}
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:'#eee', fontWeight:600, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{item[src.nameField]}</div>
                  {item.location && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:'#888', marginTop:2 }}>{item.location}</div>}
                  {item.category && <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:GOLD, marginTop:2 }}>{item.category}</div>}
                </div>
                <span style={{ fontFamily:'var(--font-body)', fontSize:11, color:GOLD, fontWeight:600, flexShrink:0 }}>Select</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// ── Template picker modal ─────────────────────────────────────────────────────
function TemplatePicker({ onSelect, onCreateWithAI, onClose, C }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, padding:'40px 36px', width:640, maxWidth:'92vw', position:'relative' }}
        onClick={e => e.stopPropagation()}>
        <button onClick={onClose} style={{ position:'absolute', top:14, right:16, background:'transparent', border:'none', color:C.grey, fontSize:18, cursor:'pointer', lineHeight:1, padding:0 }}>✕</button>
        <h2 style={{ fontFamily:'var(--font-heading)', fontSize:24, fontWeight:700, color:C.white, margin:'0 0 4px' }}>Start a new email</h2>
        <p style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.grey, margin:'0 0 28px' }}>Choose a starting point or begin with a blank canvas</p>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:12 }}>
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
          {/* Create with AI */}
          <button onClick={onCreateWithAI}
            style={{ background:`rgba(143,116,32,0.12)`, border:`1px solid ${GOLD}`, borderRadius:4, padding:'18px 10px 14px', cursor:'pointer', textAlign:'center', transition:'all 0.15s' }}
            onMouseEnter={e=>{ e.currentTarget.style.background=GOLD; e.currentTarget.style.color='#000'; }}
            onMouseLeave={e=>{ e.currentTarget.style.background='rgba(143,116,32,0.12)'; e.currentTarget.style.color=''; }}>
            <div style={{ fontSize:22, marginBottom:8 }}>✦</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, color:GOLD, marginBottom:4 }}>Create with AI</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:GOLD, lineHeight:1.4, opacity:0.8 }}>AI builds your first draft</div>
          </button>
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
const FROM_EMAIL_KEY = 'ldw_email_from_email';
const FROM_NAME_KEY  = 'ldw_email_from_name';

function SendModal({ subject: initialSubject, html, builderMode, C, onClose }) {
  const [fromName,      setFromName]      = useState(() => localStorage.getItem(FROM_NAME_KEY)  || 'Luxury Wedding Directory');
  const [fromEmail,     setFromEmail]     = useState(() => localStorage.getItem(FROM_EMAIL_KEY) || '');
  const [subjectEdit,   setSubjectEdit]   = useState(initialSubject || '');
  const [recipientMode, setRecipientMode] = useState('all_crm');
  const [manualEmails,  setManualEmails]  = useState('');
  const [leads,         setLeads]         = useState([]);
  const [subscribers,   setSubscribers]   = useState([]);
  const [sending,       setSending]       = useState(false);
  const [result,        setResult]        = useState(null);
  const [confirming,    setConfirming]    = useState(false);

  // Persist from name/email to localStorage as user types
  const handleFromName  = v => { setFromName(v);  localStorage.setItem(FROM_NAME_KEY,  v); };
  const handleFromEmail = v => { setFromEmail(v); localStorage.setItem(FROM_EMAIL_KEY, v); };

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

  const handleConfirmClick = () => {
    if (!subjectEdit.trim()) { alert('Please enter a subject line'); return; }
    if (!fromEmail.trim() || !fromEmail.includes('@')) { alert('Please enter a valid from email (must be from your Resend-verified domain)'); return; }
    if (recipients.length === 0) { alert('No recipients - select a list or enter emails manually'); return; }
    setConfirming(true);
  };

  const handleSend = async () => {
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
      <div style={{ background:C.card, border:`1px solid ${C.border}`, borderRadius:6, width:520, maxWidth:'92vw', maxHeight:'88vh', overflowY:'auto', color:C.white }}>

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
                    {result.errors.length} batches had delivery issues - check Resend dashboard
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
                <input value={fromName} onChange={e=>handleFromName(e.target.value)} style={inputStyle} />
              </div>
              <div>
                <label style={labelStyle}>From email</label>
                <input value={fromEmail} onChange={e=>handleFromEmail(e.target.value)} style={inputStyle} placeholder="hello@yourdomain.com" />
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
                  : 'No recipients - select a list above or enter emails manually'}
              </span>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={onClose}
                style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>
                Cancel
              </button>
              <button onClick={handleConfirmClick}
                disabled={recipients.length === 0}
                style={{ padding:'9px 28px', background: recipients.length === 0 ? '#444' : GOLD, color: recipients.length === 0 ? '#888' : '#000', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, letterSpacing:'0.06em', cursor: recipients.length === 0 ? 'not-allowed' : 'pointer', transition:'background 0.15s' }}>
                Review and Send
              </button>
            </div>
          </div>
        )}

        {/* ── Confirmation screen ── */}
        {confirming && !result && (
          <div style={{ padding:'28px 24px' }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:C.grey, letterSpacing:'0.1em', textTransform:'uppercase', marginBottom:18 }}>Confirm send</div>

            {[
              { label:'Subject',    value: subjectEdit },
              { label:'From',       value: `${fromName} <${fromEmail}>` },
              { label:'Type',       value: builderMode === 'newsletter' ? 'Newsletter' : 'Campaign' },
              { label:'Recipients', value: `${recipients.length} ${recipientMode === 'manual' ? 'manual' : 'from ' + MODES.find(m=>m.key===recipientMode)?.label}` },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${C.border||'rgba(255,255,255,0.05)'}` }}>
                <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, width:90, flexShrink:0 }}>{row.label}</div>
                <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.white, flex:1, wordBreak:'break-all' }}>{row.value}</div>
              </div>
            ))}

            <div style={{ margin:'18px 0', padding:'12px 14px', background:'rgba(239,68,68,0.08)', border:'1px solid rgba(239,68,68,0.25)', borderRadius:3 }}>
              <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:'#f87171', lineHeight:1.6 }}>
                This action cannot be undone. Emails will be delivered immediately to all {recipients.length} recipient{recipients.length > 1 ? 's' : ''}.
              </div>
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <button onClick={() => setConfirming(false)}
                style={{ padding:'9px 20px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, color:C.grey, cursor:'pointer' }}>
                Back
              </button>
              <button onClick={handleSend} disabled={sending}
                style={{ padding:'9px 28px', background: sending ? '#444' : '#ef4444', color: sending ? '#888' : '#fff', border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:12, fontWeight:700, letterSpacing:'0.06em', cursor: sending ? 'not-allowed' : 'pointer' }}>
                {sending ? 'Sending...' : `Confirm - Send to ${recipients.length}`}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main module ───────────────────────────────────────────────────────────────
// ── Drafts helpers (localStorage) ─────────────────────────────────────────────
const DRAFTS_KEY = 'ldw_email_drafts';
function loadDrafts() {
  try { return JSON.parse(localStorage.getItem(DRAFTS_KEY) || '[]'); } catch { return []; }
}
function saveDraftsToStorage(drafts) {
  localStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

// ── Drafts Modal ───────────────────────────────────────────────────────────────
function DraftsModal({ C, onLoad, onClose }) {
  const [drafts, setDrafts] = useState(loadDrafts);

  const handleDelete = (id) => {
    const next = drafts.filter(d => d.id !== id);
    saveDraftsToStorage(next);
    setDrafts(next);
  };

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.72)', zIndex:9999, display:'flex', alignItems:'center', justifyContent:'center' }}
      onClick={onClose}>
      <div style={{ background:C.card||'#1a1a1a', border:`1px solid ${C.border||GOLD_BDR}`, borderRadius:6, width:560, maxHeight:'70vh', display:'flex', flexDirection:'column', overflow:'hidden' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'18px 24px', borderBottom:`1px solid ${C.border||'rgba(255,255,255,0.08)'}` }}>
          <div>
            <div style={{ fontFamily:'var(--font-display)', fontSize:20, color:C.white||'#fff' }}>Saved Drafts</div>
            <div style={{ fontFamily:'var(--font-body)', fontSize:12, color:C.grey, marginTop:2 }}>{drafts.length} draft{drafts.length !== 1 ? 's' : ''} saved locally</div>
          </div>
          <button onClick={onClose} style={{ background:'transparent', border:'none', color:C.grey, fontSize:20, cursor:'pointer', lineHeight:1 }}>x</button>
        </div>

        {/* List */}
        <div style={{ overflowY:'auto', flex:1 }}>
          {drafts.length === 0 ? (
            <div style={{ padding:40, textAlign:'center', fontFamily:'var(--font-body)', fontSize:13, color:C.grey }}>
              No drafts saved yet. Use "Save Draft" in the toolbar to save your work.
            </div>
          ) : (
            drafts.map(d => (
              <div key={d.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 24px', borderBottom:`1px solid ${C.border||'rgba(255,255,255,0.05)'}`, cursor:'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background='rgba(143,116,32,0.07)'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                <div style={{ flex:1 }} onClick={() => onLoad(d)}>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:13, color:C.white||'#eee', fontWeight:600 }}>{d.subject || '(No subject)'}</div>
                  <div style={{ fontFamily:'var(--font-body)', fontSize:11, color:C.grey, marginTop:3 }}>
                    {d.builderMode === 'newsletter' ? 'Newsletter' : 'Email'} - {d.blocks.length} block{d.blocks.length !== 1 ? 's' : ''}
                    <span style={{ marginLeft:8 }}>{new Date(d.savedAt).toLocaleString()}</span>
                  </div>
                </div>
                <button onClick={() => onLoad(d)}
                  style={{ padding:'5px 14px', background:GOLD, border:'none', borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color:'#000', cursor:'pointer', flexShrink:0 }}>
                  Load
                </button>
                <button onClick={() => handleDelete(d.id)}
                  style={{ padding:'5px 10px', background:'transparent', border:`1px solid ${C.border||'rgba(255,255,255,0.12)'}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer', flexShrink:0 }}>
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

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
  const [showDrafts,     setShowDrafts]     = useState(false);
  const [contentPicker,  setContentPicker]  = useState(null); // { blockId, type }
  // AI state
  const [tone,           setTone]           = useState('luxury');
  const [showAiSubjects, setShowAiSubjects] = useState(false);
  const [aiSubjectData,  setAiSubjectData]  = useState(null);
  const [aiSubjectLoading, setAiSubjectLoading] = useState(false);
  const [previewText,    setPreviewText]    = useState('');
  const [aiBlockLoading, setAiBlockLoading] = useState(false);
  const [showAiCompose,  setShowAiCompose]  = useState(false);
  const [showAiTemplate, setShowAiTemplate] = useState(false);

  const showToast = msg => setToast(msg);

  const handleSaveDraft = () => {
    if (blocks.length === 0) { showToast('Add at least one block before saving'); return; }
    const drafts = loadDrafts();
    const draft = { id: `d${Date.now()}`, subject, blocks, builderMode, savedAt: new Date().toISOString() };
    saveDraftsToStorage([draft, ...drafts]);
    showToast('Draft saved');
  };

  const handleLoadDraft = (draft) => {
    setBlocks(draft.blocks);
    setSubject(draft.subject || '');
    setBuilderMode(draft.builderMode || 'email');
    setSelectedId(null);
    setShowDrafts(false);
    showToast('Draft loaded');
  };

  // ── Platform content picker callbacks ─────────────────────────────────────
  const handlePickContent = (type) => {
    if (!selectedId) return;
    setContentPicker({ blockId: selectedId, type });
  };

  const handleContentPicked = (pickedProps) => {
    if (!contentPicker) return;
    updateBlock(contentPicker.blockId, { ...blocks.find(b => b.id === contentPicker.blockId)?.props, ...pickedProps });
    setContentPicker(null);
    showToast('Content linked');
  };

  const handleLoadLatestArticles = async () => {
    if (!selectedId) return;
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data } = await supabase
        .from('magazine_articles')
        .select('id,title,slug,excerpt,featured_image,category,published_at')
        .order('published_at', { ascending:false })
        .limit(5);
      const items = (data || []).map(a => ({
        title: a.title, category: a.category||'', imageUrl: a.featured_image||'',
        url: `https://luxuryweddingdirectory.co.uk/magazine/${a.slug||a.id}`,
      }));
      const block = blocks.find(b => b.id === selectedId);
      if (block) updateBlock(selectedId, { ...block.props, _items: items });
      showToast(`${items.length} article${items.length !== 1 ? 's' : ''} loaded`);
    } catch (err) {
      showToast('Could not load articles - check Supabase connection');
    }
  };

  const handleLoadDestinationVenues = async () => {
    if (!selectedId) return;
    const block = blocks.find(b => b.id === selectedId);
    if (!block) return;
    const dest = block.props.destination || '';
    if (!dest.trim()) { showToast('Enter a destination first'); return; }
    try {
      const { supabase } = await import('../../lib/supabaseClient');
      const { data } = await supabase
        .from('listings')
        .select('id,name,slug,hero_image_url,location')
        .ilike('location', `%${dest}%`)
        .limit(block.props.limit || 3);
      const items = (data || []).map(v => ({
        name: v.name, imageUrl: v.hero_image_url||'',
        url: `https://luxuryweddingdirectory.co.uk/venues/${v.slug||v.id}`,
      }));
      updateBlock(selectedId, { ...block.props, _items: items });
      showToast(`${items.length} venue${items.length !== 1 ? 's' : ''} loaded`);
    } catch (err) {
      showToast('Could not load venues - check Supabase connection');
    }
  };

  // ── AI handlers ───────────────────────────────────────────────────────────
  const handleAiSubjects = async () => {
    setAiSubjectLoading(true);
    setShowAiSubjects(true);
    try {
      const result = await generateSubjectLines({ newsletterType: builderMode, tone, blocks, destination: getDestinationFromBlocks(blocks) });
      setAiSubjectData(result);
    } catch (err) {
      showToast(err.message || 'AI unavailable - configure a provider in Admin > AI Settings');
      setShowAiSubjects(false);
    } finally { setAiSubjectLoading(false); }
  };

  const handleAiBlockAction = async (action) => {
    if (!selectedId) return;
    const block = blocks.find(b => b.id === selectedId);
    if (!block) return;
    const text = getMainTextFromBlock(block);
    if (!text.trim()) { showToast('Add some text first before using AI'); return; }
    setAiBlockLoading(true);
    try {
      const result = await rewriteBlockCopy({ text, action, tone, context: getBlockContextString(block) });
      updateBlock(selectedId, applyAiTextToBlock(block, result.trim()));
      showToast('AI applied');
    } catch (err) {
      showToast(err.message || 'AI unavailable');
    } finally { setAiBlockLoading(false); }
  };

  const handleAiSummary = async (blockType) => {
    if (!selectedId) return;
    const block = blocks.find(b => b.id === selectedId);
    if (!block) return;
    const p = block.props;
    setAiBlockLoading(true);
    try {
      let params;
      if (blockType === 'article')     params = { type:'article', name: p.headline||'', description: p.excerpt||'', category: p.category||'', tone };
      else if (blockType === 'venue_spot') params = { type:'venue', name: p.venueName||'', description: p.summary||'', location:'', tone };
      else                             params = { type:'vendor', name: p.vendorName||'', description: p.description||'', tone };
      const result = await generateSpotlightSummary(params);
      if (blockType === 'article')     updateBlock(selectedId, { ...p, excerpt: result.summary || p.excerpt, ctaLabel: result.cta || p.ctaLabel });
      else if (blockType === 'venue_spot') updateBlock(selectedId, { ...p, summary: result.summary || p.summary, ctaLabel: result.cta || p.ctaLabel });
      else                             updateBlock(selectedId, { ...p, description: result.summary || p.description, ctaLabel: result.cta || p.ctaLabel });
      showToast('AI summary applied');
    } catch (err) {
      showToast(err.message || 'AI unavailable');
    } finally { setAiBlockLoading(false); }
  };

  const handleAiComposeApply = (draft) => {
    // Insert intro as a new text block at the start (after header if present)
    if (draft.intro) {
      const introBlock = makeBlock('text');
      introBlock.props = { ...introBlock.props, content: draft.intro };
      const headerIdx = blocks.findIndex(b => b.type === 'header');
      const insertAt = headerIdx >= 0 ? headerIdx + 1 : 0;
      setBlocks(prev => {
        const next = [...prev];
        next.splice(insertAt, 0, introBlock);
        return next;
      });
    }
    // Insert closing as a text block before footer
    if (draft.closing) {
      const closingBlock = makeBlock('text');
      closingBlock.props = { ...closingBlock.props, content: draft.closing };
      setBlocks(prev => {
        const footerIdx = prev.findIndex(b => b.type === 'footer');
        const insertAt = footerIdx >= 0 ? footerIdx : prev.length;
        const next = [...prev];
        next.splice(insertAt, 0, closingBlock);
        return next;
      });
    }
    setShowAiCompose(false);
    showToast('AI draft inserted');
  };

  const handleAiTemplateApply = (result) => {
    // Build blocks from AI-suggested blockTypes
    const newBlocks = (result.blockTypes || []).map(type => {
      const b = makeBlock(type);
      if (type === 'heading' && result.heading) b.props = { ...b.props, text: result.heading };
      return b;
    });
    // Insert intro copy into first text block
    if (result.intro) {
      const textIdx = newBlocks.findIndex(b => b.type === 'text');
      if (textIdx >= 0) newBlocks[textIdx].props = { ...newBlocks[textIdx].props, content: result.intro };
    }
    setBlocks(newBlocks);
    setShowAiTemplate(false);
    setShowPicker(false);
    showToast('AI template created');
  };

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
    <div style={{ display:'flex', flexDirection:'column', height:'100%', minHeight:0, background:C.black||'#fafaf8' }}>

      {showPicker && (
        <TemplatePicker
          C={C}
          onSelect={factory => { setBlocks(factory); setShowPicker(false); }}
          onCreateWithAI={() => { setShowAiTemplate(true); }}
          onClose={() => setShowPicker(false)}
        />
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

      {showDrafts && (
        <DraftsModal
          C={C}
          onLoad={handleLoadDraft}
          onClose={() => setShowDrafts(false)}
        />
      )}

      {contentPicker && (
        <ContentPickerModal
          type={contentPicker.type}
          C={C}
          onPick={handleContentPicked}
          onClose={() => setContentPicker(null)}
        />
      )}

      {showAiCompose && (
        <AiComposeModal
          blocks={blocks}
          tone={tone}
          C={C}
          onApply={handleAiComposeApply}
          onClose={() => setShowAiCompose(false)}
        />
      )}

      {showAiTemplate && (
        <AiTemplateModal
          tone={tone}
          C={C}
          onApply={handleAiTemplateApply}
          onClose={() => setShowAiTemplate(false)}
        />
      )}

      {toast && <Toast msg={toast} onDone={() => setToast(null)} />}

      {/* ── Top bar ── */}
      <div style={{ height:52, flexShrink:0, background:C.card, borderBottom:`1px solid ${C.border}`, display:'flex', alignItems:'center', padding:'0 18px', gap:14 }}>

        {/* Mode toggle */}
        <div style={{ display:'flex', background:C.dark||'#f5f0e8', borderRadius:3, border:`1px solid ${C.border}`, overflow:'hidden', flexShrink:0 }}>
          {['email','newsletter'].map(m => (
            <button key={m} onClick={()=>setBuilderMode(m)}
              style={{ padding:'5px 14px', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, letterSpacing:'0.06em', textTransform:'capitalize', background:builderMode===m?GOLD:'transparent', color:builderMode===m?'#000':C.grey, border:'none', cursor:'pointer', transition:'all 0.15s' }}>
              {m==='email'?'Email':'Newsletter'}
            </button>
          ))}
        </div>

        {/* Subject line + AI button */}
        <div style={{ flex:1, position:'relative', display:'flex', alignItems:'center', gap:6, minWidth:0 }}>
          <input
            value={subject}
            onChange={e => setSubject(e.target.value)}
            placeholder={builderMode==='newsletter' ? 'Newsletter edition name...' : 'Email subject line...'}
            style={{ flex:1, background:'transparent', border:'none', borderBottom:`1px solid ${C.border}`, fontFamily:'var(--font-body)', fontSize:13, color:C.white, padding:'3px 0', outline:'none', minWidth:0 }}
          />
          <button onClick={handleAiSubjects} title="Generate subject lines with AI"
            style={{ flexShrink:0, padding:'3px 10px', background: showAiSubjects ? GOLD : 'transparent', border:`1px solid ${showAiSubjects ? GOLD : GOLD_BDR}`, borderRadius:2, fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color: showAiSubjects ? '#000' : GOLD, cursor:'pointer', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>
            ✦ AI
          </button>
          {(showAiSubjects || aiSubjectData) && (
            <AiSubjectPanel
              data={aiSubjectData}
              loading={aiSubjectLoading}
              onApply={v => { setSubject(v); setShowAiSubjects(false); setAiSubjectData(null); }}
              onApplyPreview={v => { setPreviewText(v); showToast('Preview text saved'); setShowAiSubjects(false); setAiSubjectData(null); }}
              onClose={() => { setShowAiSubjects(false); setAiSubjectData(null); }}
              onRegenerate={handleAiSubjects}
            />
          )}
        </div>

        {/* Preview toggle */}
        <div style={{ display:'flex', background:C.dark||'#f5f0e8', borderRadius:3, border:`1px solid ${C.border}`, overflow:'hidden', flexShrink:0 }}>
          {[{k:'desktop',l:'⊡ Desktop'},{k:'mobile',l:'▧ Mobile'}].map(t => (
            <button key={t.k} onClick={() => setPreviewMode(t.k)}
              style={{ padding:'5px 12px', fontFamily:'var(--font-body)', fontSize:11, fontWeight:600, background:previewMode===t.k?GOLD_DIM:'transparent', color:previewMode===t.k?GOLD:C.grey, border:'none', borderRight:t.k==='desktop'?`1px solid ${C.border}`:'none', cursor:'pointer' }}>
              {t.l}
            </button>
          ))}
        </div>

        {/* Tone dropdown */}
        <select value={tone} onChange={e=>setTone(e.target.value)}
          title="AI tone preset"
          style={{ padding:'5px 8px', background:C.dark||'#f5f0e8', border:`1px solid ${GOLD_BDR}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:10, color:GOLD, cursor:'pointer', outline:'none', appearance:'none', flexShrink:0, maxWidth:120 }}>
          {TONE_PRESETS.map(t => <option key={t.key} value={t.key}>{t.label}</option>)}
        </select>

        {/* AI Draft */}
        <button onClick={() => setShowAiCompose(true)} disabled={blocks.length === 0}
          style={{ padding:'6px 14px', background: blocks.length > 0 ? 'rgba(143,116,32,0.15)' : 'transparent', border:`1px solid ${blocks.length > 0 ? GOLD : C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, fontWeight:700, color: blocks.length > 0 ? GOLD : C.grey, cursor: blocks.length > 0 ? 'pointer' : 'not-allowed', flexShrink:0 }}>
          ✦ AI Draft
        </button>

        {/* Actions */}
        <button onClick={() => setShowPicker(true)}
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
          Templates
        </button>
        <button onClick={handleCopyHTML}
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
          Copy HTML
        </button>
        <button onClick={handleSaveDraft}
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer' }}>
          Save Draft
        </button>
        <button onClick={() => setShowDrafts(true)}
          style={{ padding:'6px 14px', background:'transparent', border:`1px solid ${C.border}`, borderRadius:3, fontFamily:'var(--font-body)', fontSize:11, color:C.grey, cursor:'pointer', position:'relative' }}>
          Edit / Load {loadDrafts().length > 0 && <span style={{ marginLeft:4, background:GOLD, color:'#000', borderRadius:10, padding:'1px 6px', fontSize:10, fontWeight:700 }}>{loadDrafts().length}</span>}
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

        {/* LEFT - block palette */}
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
                  <span style={{ width:26, height:26, borderRadius:3, background:C.dark||'#f5f0e8', border:`1px solid ${C.border}`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, color:GOLD, flexShrink:0 }}>{def.icon}</span>
                  <div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:12, fontWeight:600, color:C.white }}>{def.label}</div>
                    <div style={{ fontFamily:'var(--font-body)', fontSize:10, color:C.grey }}>{def.desc}</div>
                  </div>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* CENTER - canvas */}
        <div style={{ flex:1, overflowY:'auto', background:C.dark||'#e8e3db', display:'flex', flexDirection:'column', alignItems:'center', padding:'28px 20px' }}
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
                style={{ padding:'5px 13px', background:C.card||'rgba(255,255,255,0.7)', border:`1px solid ${C.border||'#ccc'}`, borderRadius:20, fontFamily:'var(--font-body)', fontSize:11, color:C.grey||'#555', cursor:'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor=GOLD; e.currentTarget.style.color=GOLD; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor=C.border||'#ccc'; e.currentTarget.style.color=C.grey||'#555'; }}>
                + {BLOCK_DEFS.find(d=>d.type===type)?.label}
              </button>
            ))}
          </div>
        </div>

        {/* RIGHT - properties panel */}
        <div style={{ width:264, flexShrink:0, borderLeft:`1px solid ${C.border}`, background:C.card, overflowY:'auto' }}>
          <div style={{ padding:'13px 18px 10px', borderBottom:`1px solid ${C.border}` }}>
            <div style={{ fontFamily:'var(--font-body)', fontSize:10, fontWeight:700, color:C.grey, letterSpacing:'0.12em', textTransform:'uppercase' }}>Properties</div>
          </div>
          <PropertiesPanel
            block={selectedBlock}
            onChange={newProps => selectedBlock && updateBlock(selectedBlock.id, newProps)}
            C={C}
            onPickContent={handlePickContent}
            onLoadLatestArticles={handleLoadLatestArticles}
            onLoadDestinationVenues={handleLoadDestinationVenues}
            onAiAction={handleAiBlockAction}
            onAiSummary={handleAiSummary}
            aiBlockLoading={aiBlockLoading}
          />
        </div>

      </div>
    </div>
  );
}
