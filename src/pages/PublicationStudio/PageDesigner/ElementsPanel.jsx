import { useState, useRef } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, GD, NU } from './designerConstants';
import { TEMPLATES } from '../templates/definitions';

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

// ── Layers panel components ───────────────────────────────────────────────────

function LayerRow({ layer, typeIcon, isDragging, onDragStart, onDragEnd, onDragOver, onSelect, onToggleVisibility, onToggleLock }) {
  const [hov, setHov] = useState(false);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onClick={onSelect}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '7px 8px 7px 10px',
        borderBottom: `1px solid rgba(255,255,255,0.04)`,
        background: layer.selected
          ? 'rgba(201,169,110,0.12)'
          : hov ? 'rgba(255,255,255,0.04)' : 'transparent',
        borderLeft: `2px solid ${layer.selected ? GOLD : 'transparent'}`,
        cursor: 'pointer',
        opacity: isDragging ? 0.4 : 1,
        transition: 'background 0.1s, opacity 0.1s',
        userSelect: 'none',
      }}
    >
      {/* Drag handle */}
      <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, flexShrink: 0, cursor: 'grab' }}>⠿</span>

      {/* Type icon */}
      <span style={{
        fontFamily: layer.type === 'textbox' || layer.type === 'text' ? "'Cormorant Garamond',serif" : NU,
        fontSize: 11,
        color: layer.selected ? GOLD : 'rgba(255,255,255,0.5)',
        flexShrink: 0,
        width: 16,
        textAlign: 'center',
      }}>
        {typeIcon}
      </span>

      {/* Label */}
      <span style={{
        flex: 1,
        fontFamily: NU,
        fontSize: 11,
        color: layer.visible
          ? (layer.selected ? '#fff' : 'rgba(255,255,255,0.7)')
          : 'rgba(255,255,255,0.25)',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        fontStyle: layer.type === 'textbox' ? 'italic' : 'normal',
      }}>
        {layer.label}
      </span>

      {/* Visibility toggle */}
      <button
        onClick={onToggleVisibility}
        title={layer.visible ? 'Hide layer' : 'Show layer'}
        style={{
          background: 'none', border: 'none',
          color: layer.visible ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)',
          cursor: 'pointer', padding: '0 2px', fontSize: 12, lineHeight: 1,
          flexShrink: 0,
          opacity: hov || layer.selected ? 1 : 0,
          transition: 'opacity 0.12s',
        }}
      >
        {layer.visible ? '👁' : '🚫'}
      </button>

      {/* Lock toggle */}
      <button
        onClick={onToggleLock}
        title={layer.locked ? 'Unlock layer' : 'Lock layer'}
        style={{
          background: 'none', border: 'none',
          color: layer.locked ? GOLD : 'rgba(255,255,255,0.4)',
          cursor: 'pointer', padding: '0 2px', fontSize: 11, lineHeight: 1,
          flexShrink: 0,
          opacity: hov || layer.locked || layer.selected ? 1 : 0,
          transition: 'opacity 0.12s',
        }}
      >
        {layer.locked ? '🔒' : '🔓'}
      </button>
    </div>
  );
}

function LayersPanel({ layers, onSelectLayer, onToggleLayerVisibility, onToggleLayerLock, onReorderLayer }) {
  const [dragId, setDragId] = useState(null);

  if (!layers || layers.length === 0) {
    return (
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '32px 16px', gap: 8,
      }}>
        <div style={{ fontSize: 24, opacity: 0.2 }}>⊟</div>
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center', lineHeight: 1.5 }}>
          No layers yet.<br />Add elements to the canvas.
        </div>
      </div>
    );
  }

  const typeIcon = (type, customType) => {
    if (customType === 'pagenumber') return '№';
    if (type === 'textbox' || type === 'text' || type === 'itext') return 'T';
    if (type === 'image') return '⬜';
    if (type === 'rect') return '▭';
    if (type === 'circle') return '○';
    if (type === 'line') return '—';
    return '◻';
  };

  return (
    <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      {layers.map((layer) => (
        <LayerRow
          key={layer.id}
          layer={layer}
          typeIcon={typeIcon(layer.type, layer.customType)}
          isDragging={dragId === layer.id}
          onDragStart={() => setDragId(layer.id)}
          onDragEnd={() => setDragId(null)}
          onDragOver={(e) => {
            e.preventDefault();
            if (dragId && dragId !== layer.id) {
              onReorderLayer?.(dragId, layer.id);
            }
          }}
          onSelect={() => onSelectLayer?.(layer.id)}
          onToggleVisibility={(e) => { e.stopPropagation(); onToggleLayerVisibility?.(layer.id); }}
          onToggleLock={(e) => { e.stopPropagation(); onToggleLayerLock?.(layer.id); }}
        />
      ))}
    </div>
  );
}

// ── Template row with thumbnail + hover preview card ─────────────────────────
// Each template shows a 32×44 thumbnail in the panel list. On hover, a
// 320×452 preview card floats to the right of the panel so the user can see
// the full template at roughly real proportions before clicking.
//
// Thumbnail source: /publication-studio/templates/{id}.jpg — generated by
// scripts/generate-template-thumbnails.mjs. If the image fails to load we
// fall back to the old numbered-box appearance so the panel stays readable
// until thumbnails are built.
function TemplateRow({ template, index, onPick }) {
  const [hov, setHov] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [thumbOk, setThumbOk] = useState(true);
  const rowRef = useRef(null);

  function handleEnter() {
    setHov(true);
    const rect = rowRef.current?.getBoundingClientRect?.();
    if (rect) setAnchor({ top: rect.top, left: rect.right + 12 });
  }
  function handleLeave() {
    setHov(false);
  }

  const thumbSrc = `/publication-studio/templates/${template.id}.jpg`;

  return (
    <>
      <button
        ref={rowRef}
        title={template.description || template.name}
        onClick={onPick}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          width: '100%',
          background: hov ? 'rgba(201,169,110,0.07)' : 'none',
          border: 'none',
          borderBottom: `1px solid rgba(255,255,255,0.04)`,
          color: '#fff',
          cursor: 'pointer',
          padding: '8px 16px',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          transition: 'background 0.1s',
        }}
      >
        {/* Thumbnail (32×44) or numbered-box fallback */}
        {thumbOk ? (
          <img
            src={thumbSrc}
            alt=""
            width={32}
            height={44}
            onError={() => setThumbOk(false)}
            style={{
              width: 32, height: 44,
              objectFit: 'cover',
              border: `1px solid rgba(201,169,110,0.45)`,
              flexShrink: 0,
              background: 'rgba(201,169,110,0.08)',
              display: 'block',
            }}
          />
        ) : (
          <div style={{
            width: 32, height: 44,
            background: 'rgba(201,169,110,0.15)',
            border: `1px solid rgba(201,169,110,0.3)`,
            borderRadius: 2,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: NU, fontSize: 9, color: GOLD }}>{index + 1}</span>
          </div>
        )}
        {/* Name + category */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.8)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {template.name}
          </div>
          <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.06em', textTransform: 'uppercase', marginTop: 1 }}>
            {template.category}
          </div>
        </div>
      </button>

      {/* Floating preview card */}
      {hov && anchor && (
        <div
          style={{
            position: 'fixed',
            top: Math.min(anchor.top, window.innerHeight - 460),
            left: anchor.left,
            width: 320,
            height: 452,
            background: '#0F0E0B',
            border: `1px solid ${GOLD}`,
            boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
            zIndex: 3000,
            pointerEvents: 'none',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {thumbOk ? (
            <img
              src={thumbSrc}
              alt={template.name}
              style={{ width: '100%', height: 404, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <div style={{
              width: '100%', height: 404,
              background: 'rgba(201,169,110,0.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: NU, color: GOLD, fontSize: 12, letterSpacing: '0.2em',
            }}>
              {template.name.toUpperCase()}
            </div>
          )}
          <div style={{ padding: '10px 14px', borderTop: `1px solid rgba(255,255,255,0.08)` }}>
            <div style={{ fontFamily: GD, fontSize: 15, color: '#F0EBE0', fontStyle: 'italic' }}>
              {template.name}
            </div>
            <div style={{ fontFamily: NU, fontSize: 9, color: GOLD, letterSpacing: '0.15em', marginTop: 2, textTransform: 'uppercase' }}>
              {template.category}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ── Main ElementsPanel export ─────────────────────────────────────────────────

export default function ElementsPanel({ onAddElement, onAddImage, onAddTemplate, issue, layers, onSelectLayer, onToggleLayerVisibility, onToggleLayerLock, onReorderLayer }) {
  const [panelTab, setPanelTab] = useState('elements');
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


  return (
    <div style={{
      width: 240,
      flexShrink: 0,
      background: '#1A1712',
      borderRight: `1px solid ${BORDER}`,
      overflowY: 'hidden',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Tab bar */}
      <div style={{
        display: 'flex',
        borderBottom: `1px solid ${BORDER}`,
        flexShrink: 0,
      }}>
        {['elements', 'layers'].map(t => (
          <button
            key={t}
            onClick={() => setPanelTab(t)}
            style={{
              flex: 1,
              background: panelTab === t ? 'rgba(201,169,110,0.08)' : 'none',
              border: 'none',
              borderBottom: `2px solid ${panelTab === t ? GOLD : 'transparent'}`,
              color: panelTab === t ? GOLD : MUTED,
              fontFamily: NU,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              padding: '10px 0',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
          >
            {t === 'elements' ? '⊞ Elements' : '⊟ Layers'}
          </button>
        ))}
      </div>

      {/* Elements tab */}
      {panelTab === 'elements' && (
        <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
          <ElemButton
            label="Page No."
            preview={<span style={{ fontFamily: NU, fontSize: 13, color: GOLD }}>№</span>}
            onClick={() => onAddElement('pagenumber')}
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
          {TEMPLATES.map((template, i) => (
            <TemplateRow
              key={template.id}
              template={template}
              index={i}
              onPick={() => onAddTemplate && onAddTemplate(i)}
            />
          ))}

          <div style={{ height: 20 }} />
        </div>
      )}

      {/* Layers tab */}
      {panelTab === 'layers' && (
        <LayersPanel
          layers={layers}
          onSelectLayer={onSelectLayer}
          onToggleLayerVisibility={onToggleLayerVisibility}
          onToggleLayerLock={onToggleLayerLock}
          onReorderLayer={onReorderLayer}
        />
      )}
    </div>
  );
}
