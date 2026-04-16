import { useState, useRef } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, GD, NU } from './designerConstants';

const SECTION_STYLE = {
  fontFamily: NU,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: GOLD,
  padding: '14px 16px 6px',
};

const ELEM_BTN = {
  width: '100%',
  background: 'none',
  border: 'none',
  borderBottom: `1px solid rgba(255,255,255,0.04)`,
  color: '#fff',
  cursor: 'pointer',
  padding: '9px 16px',
  textAlign: 'left',
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  transition: 'background 0.1s',
};

function ElemButton({ label, preview, onClick, hoverBg = 'rgba(201,169,110,0.07)' }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      style={{ ...ELEM_BTN, background: hov ? hoverBg : 'none' }}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={onClick}
    >
      {preview && <span style={{ flexShrink: 0, width: 32, textAlign: 'center' }}>{preview}</span>}
      <span style={{ fontFamily: NU, fontSize: 12, color: hov ? '#fff' : 'rgba(255,255,255,0.75)' }}>{label}</span>
    </button>
  );
}

function Divider() {
  return <div style={{ borderTop: `1px solid rgba(255,255,255,0.06)`, margin: '4px 0' }} />;
}

export default function ElementsPanel({ onAddElement, onAddImage, onAddTemplate, issue }) {
  const [aiBrief, setAiBrief] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const fileRef = useRef(null);
  const [urlOpen, setUrlOpen] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  async function handleAIWrite() {
    if (!aiBrief.trim()) return;
    setAiLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          feature: 'designer_text',
          systemPrompt: 'You are a luxury wedding magazine copywriter. Write short, elegant editorial copy. Return only the text, no quotes.',
          userPrompt: aiBrief,
        }),
      });
      const data = await res.json();
      if (data.text) onAddElement('aitext', data.text);
      setAiBrief('');
      setAiOpen(false);
    } catch (e) {
      console.error('AI Write error:', e);
    } finally {
      setAiLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => onAddImage(ev.target.result);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  function handleAddFromUrl() {
    if (!imageUrl.trim()) return;
    onAddImage(imageUrl.trim());
    setImageUrl('');
    setUrlOpen(false);
  }

  const TEMPLATES = [
    'Editorial Spread', 'Cover Page', 'Full Bleed Photo', 'Two Column Text',
    'Pull Quote Feature', 'Venue Showcase', 'Vendor Profile', 'Photo Grid 2x2',
    'Photo Grid 3x3', 'Article Opener', 'Section Divider', 'Contents Page',
    'Contact Details', 'Map Feature', 'Timeline', 'Stats Strip',
  ];

  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      background: '#1A1712',
      borderRight: `1px solid ${BORDER}`,
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Text elements */}
      <div style={SECTION_STYLE}>Text</div>
      <ElemButton
        label="Heading"
        preview={<span style={{ fontFamily: GD, fontSize: 18, color: GOLD }}>H</span>}
        onClick={() => onAddElement('heading')}
      />
      <ElemButton
        label="Body Text"
        preview={<span style={{ fontFamily: GD, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>T</span>}
        onClick={() => onAddElement('text')}
      />
      <ElemButton
        label="Subheading"
        preview={<span style={{ fontFamily: GD, fontSize: 16, color: 'rgba(255,255,255,0.7)' }}>S</span>}
        onClick={() => onAddElement('subheading')}
      />
      <ElemButton
        label="Caption"
        preview={<span style={{ fontFamily: NU, fontSize: 10, color: MUTED, letterSpacing: '0.08em' }}>CAP</span>}
        onClick={() => onAddElement('caption')}
      />
      <ElemButton
        label="Pull Quote"
        preview={<span style={{ fontFamily: GD, fontSize: 16, color: GOLD, fontStyle: 'italic' }}>"</span>}
        onClick={() => onAddElement('pullquote')}
      />

      <Divider />

      {/* Shapes */}
      <div style={SECTION_STYLE}>Shapes</div>
      <ElemButton
        label="Rectangle"
        preview={
          <svg width="22" height="14" viewBox="0 0 22 14">
            <rect x="1" y="1" width="20" height="12" fill={GOLD} rx="0" />
          </svg>
        }
        onClick={() => onAddElement('rect')}
      />
      <ElemButton
        label="Circle"
        preview={
          <svg width="18" height="18" viewBox="0 0 18 18">
            <circle cx="9" cy="9" r="8" fill={GOLD} />
          </svg>
        }
        onClick={() => onAddElement('circle')}
      />
      <ElemButton
        label="Line"
        preview={
          <svg width="22" height="4" viewBox="0 0 22 4">
            <line x1="0" y1="2" x2="22" y2="2" stroke={GOLD} strokeWidth="2" />
          </svg>
        }
        onClick={() => onAddElement('line')}
      />
      <ElemButton
        label="Divider"
        preview={
          <svg width="22" height="4" viewBox="0 0 22 4">
            <line x1="0" y1="2" x2="22" y2="2" stroke={GOLD} strokeWidth="1" />
          </svg>
        }
        onClick={() => onAddElement('divider')}
      />

      <Divider />

      {/* Image */}
      <div style={SECTION_STYLE}>Image</div>
      <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFileChange} />
      <ElemButton
        label="Upload Image"
        preview={<span style={{ fontSize: 16 }}>↑</span>}
        onClick={() => fileRef.current?.click()}
      />
      <ElemButton
        label="From URL"
        preview={<span style={{ fontSize: 14, color: MUTED }}>⊞</span>}
        onClick={() => setUrlOpen(v => !v)}
      />
      {urlOpen && (
        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)' }}>
          <input
            type="text"
            placeholder="https://..."
            value={imageUrl}
            onChange={e => setImageUrl(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAddFromUrl()}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid rgba(255,255,255,0.12)`,
              borderRadius: 3, color: '#fff',
              fontFamily: NU, fontSize: 11,
              padding: '6px 8px', outline: 'none',
            }}
          />
          <button
            onClick={handleAddFromUrl}
            style={{
              marginTop: 6, width: '100%',
              background: GOLD, border: 'none',
              borderRadius: 3, color: '#1a1208',
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '6px 0', cursor: 'pointer',
            }}
          >
            Add Image
          </button>
        </div>
      )}

      <Divider />

      {/* AI Generate */}
      <div style={SECTION_STYLE}>AI Generate</div>
      <ElemButton
        label="✦ AI Write"
        preview={<span style={{ fontSize: 14, color: GOLD }}>✦</span>}
        onClick={() => setAiOpen(v => !v)}
      />
      {aiOpen && (
        <div style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.2)' }}>
          <textarea
            placeholder="Brief: e.g. 'Romantic opening paragraph for a Tuscany villa wedding'"
            value={aiBrief}
            onChange={e => setAiBrief(e.target.value)}
            rows={3}
            style={{
              width: '100%', boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: `1px solid rgba(255,255,255,0.12)`,
              borderRadius: 3, color: '#fff',
              fontFamily: NU, fontSize: 11,
              padding: '6px 8px', outline: 'none',
              resize: 'vertical',
            }}
          />
          <button
            onClick={handleAIWrite}
            disabled={aiLoading || !aiBrief.trim()}
            style={{
              marginTop: 6, width: '100%',
              background: aiLoading ? 'rgba(201,169,110,0.4)' : GOLD,
              border: 'none', borderRadius: 3,
              color: '#1a1208', fontFamily: NU,
              fontSize: 10, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              padding: '6px 0', cursor: aiLoading ? 'default' : 'pointer',
              opacity: !aiBrief.trim() ? 0.5 : 1,
            }}
          >
            {aiLoading ? 'Writing...' : '✦ Generate Text'}
          </button>
        </div>
      )}

      <Divider />

      {/* Templates */}
      <div style={SECTION_STYLE}>Templates</div>
      {TEMPLATES.map((name, i) => (
        <ElemButton
          key={i}
          label={name}
          preview={
            <div style={{
              width: 28, height: 20,
              background: 'rgba(201,169,110,0.15)',
              border: `1px solid rgba(201,169,110,0.3)`,
              borderRadius: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span style={{ fontFamily: NU, fontSize: 7, color: GOLD }}>{i + 1}</span>
            </div>
          }
          onClick={() => onAddTemplate && onAddTemplate(i)}
        />
      ))}

      <div style={{ height: 20 }} />
    </div>
  );
}
