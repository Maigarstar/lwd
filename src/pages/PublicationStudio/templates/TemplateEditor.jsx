// ─── TemplateEditor.jsx ──────────────────────────────────────────────────────
// Full-screen editor for a single template.
// Left panel: live TemplateCanvas preview with ruler/grid/zoom toolbar.
// Right panel: scrollable form for all template fields + typography overrides.

import { useState, useRef, useCallback, useEffect } from 'react';
import TemplateCanvas from './TemplateCanvas';
import { renderToJpeg } from './renderToJpeg';
import {
  uploadPageImage,
  upsertPage,
  fetchPages,
} from '../../../services/magazinePageService';
import { FONT_CATALOG, FONT_CATEGORIES, loadGoogleFont } from './fontCatalog';

// ── Design tokens ─────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const BG     = '#0A0908';
const SURF   = '#141210';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.4)';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const INPUT  = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3, color: '#fff',
  fontFamily: NU, fontSize: 13,
  padding: '8px 10px', outline: 'none',
};

// ── AI personas (duplicated for self-containment) ─────────────────────────────
const PERSONAS = [
  { id: 'luxury-editorial', label: 'Luxury Editorial', emoji: '✦', sys: 'You are a senior editor at a prestigious luxury wedding magazine in the style of Vogue and Condé Nast Bride. Write with sophistication, elegance, and aspiration. Use elevated vocabulary, evocative imagery, and a tone that feels exclusive yet warmly inviting. Every sentence should feel considered.' },
  { id: 'romantic-dreamy',  label: 'Romantic',         emoji: '◇', sys: 'You are a romantic editorial writer for a high-end bridal magazine. Write with warmth, poetry, and emotional depth. Evoke the feeling of love, beauty, and the magic of weddings. Use lyrical, gentle, and evocative language.' },
  { id: 'modern-bold',      label: 'Modern & Bold',    emoji: '◈', sys: "You are a bold, modern magazine editor in the style of Harper's Bazaar. Write with confidence, directness, and contemporary energy. Be stylish and authoritative — strong, current, and impactful without being cold." },
  { id: 'minimal-refined',  label: 'Minimal',          emoji: '—', sys: 'You write in the Net-a-Porter / Bottega Veneta editorial style — spare, precise, and quietly confident. Never over-explain. Every word is deliberate. Restrained luxury. Say more with less.' },
  { id: 'cinematic',        label: 'Cinematic',        emoji: '▣', sys: 'You are a cinematic storyteller writing for a luxury publication. Write with visual, atmospheric language that paints vivid scenes. Think light, texture, movement, and emotion.' },
];

// ── Primitive UI ──────────────────────────────────────────────────────────────
function Btn({ children, onClick, gold, disabled, small }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        fontFamily: NU, fontSize: small ? 9 : 10, fontWeight: 700,
        letterSpacing: '0.07em', textTransform: 'uppercase',
        border: 'none', borderRadius: 3,
        padding: small ? '5px 10px' : '8px 16px',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.45 : 1, transition: 'all 0.15s',
        background: gold
          ? (hov ? '#b8954d' : GOLD)
          : (hov ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.06)'),
        color: gold ? '#1a1806' : 'rgba(255,255,255,0.7)',
      }}
    >{children}</button>
  );
}

function Lbl({ children, required }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 5 }}>
      {children}
      {required && <span style={{ color: 'rgba(201,168,76,0.7)', marginLeft: 4 }}>*</span>}
    </div>
  );
}

// ── Font Picker ───────────────────────────────────────────────────────────────
function FontPicker({ value, onChange }) {
  const grouped = FONT_CATEGORIES.reduce((acc, cat) => {
    acc[cat] = FONT_CATALOG.filter(f => f.category === cat);
    return acc;
  }, {});

  const handleChange = (e) => {
    const family = e.target.value;
    if (family) loadGoogleFont(family);
    onChange(family);
  };

  // Load current font on mount
  useEffect(() => {
    if (value) loadGoogleFont(value);
  }, [value]);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <select
        value={value || ''}
        onChange={handleChange}
        style={{ ...INPUT, flex: 1, cursor: 'pointer', fontSize: 12 }}
      >
        <option value="" style={{ background: '#1a1a18' }}>— inherit —</option>
        {FONT_CATEGORIES.map(cat => (
          <optgroup key={cat} label={cat} style={{ background: '#1a1a18' }}>
            {(grouped[cat] || []).map(font => (
              <option key={font.family} value={font.family} style={{ background: '#1a1a18' }}>
                {font.family}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
      {value && (
        <div style={{
          fontFamily: `'${value}', serif`,
          fontSize: 18,
          color: 'rgba(255,255,255,0.75)',
          minWidth: 28,
          textAlign: 'center',
          flexShrink: 0,
        }}>
          Aa
        </div>
      )}
    </div>
  );
}

// ── Typography Overrides Panel ────────────────────────────────────────────────
const LETTER_SPACING_OPTIONS = [
  { value: '',        label: '— none —' },
  { value: '-0.03em', label: 'Tight' },
  { value: '0',       label: 'Normal' },
  { value: '0.06em',  label: 'Wide' },
  { value: '0.12em',  label: 'Very Wide' },
  { value: '0.2em',   label: 'Ultra Wide' },
];

const FONT_WEIGHT_OPTIONS = [300, 400, 500, 600, 700];

function TypographyPanel({ fieldId, value, onChange }) {
  const [open, setOpen] = useState(false);
  const v = value || {};

  const update = (key, val) => {
    onChange({ ...v, [key]: val || undefined });
  };

  return (
    <div style={{ marginTop: 6 }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontFamily: NU, fontSize: 9, color: MUTED, padding: 0,
          letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: 4,
        }}
      >
        <span style={{ fontSize: 8 }}>{open ? '▾' : '▸'}</span>
        Typography overrides (optional)
      </button>

      {open && (
        <div style={{ marginTop: 8, padding: '12px', background: 'rgba(255,255,255,0.03)', border: `1px solid ${BORDER}`, borderRadius: 3 }}>
          {/* Font Family */}
          <div style={{ marginBottom: 10 }}>
            <Lbl>Font Family</Lbl>
            <FontPicker
              value={v.fontFamily || ''}
              onChange={val => update('fontFamily', val)}
            />
          </div>

          {/* Row: weight + size + italic */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <Lbl>Weight</Lbl>
              <select
                value={v.fontWeight || ''}
                onChange={e => update('fontWeight', e.target.value ? Number(e.target.value) : undefined)}
                style={{ ...INPUT, cursor: 'pointer', fontSize: 12 }}
              >
                <option value="" style={{ background: '#1a1a18' }}>— inherit —</option>
                {FONT_WEIGHT_OPTIONS.map(w => (
                  <option key={w} value={w} style={{ background: '#1a1a18' }}>{w}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <Lbl>Size (pt)</Lbl>
              <input
                type="number"
                min={6} max={120}
                value={v.fontSize || ''}
                onChange={e => update('fontSize', e.target.value ? Number(e.target.value) : undefined)}
                placeholder="inherit"
                style={{ ...INPUT, fontSize: 12 }}
              />
            </div>
            <div style={{ flexShrink: 0, paddingTop: 18 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontFamily: NU, fontSize: 10, color: MUTED }}>
                <input
                  type="checkbox"
                  checked={v.fontStyle === 'italic'}
                  onChange={e => update('fontStyle', e.target.checked ? 'italic' : undefined)}
                  style={{ accentColor: GOLD }}
                />
                Italic
              </label>
            </div>
          </div>

          {/* Row: colour + letter spacing */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <div style={{ flex: 1 }}>
              <Lbl>Colour</Lbl>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <input
                  type="color"
                  value={v.color || '#ffffff'}
                  onChange={e => update('color', e.target.value)}
                  style={{ width: 32, height: 28, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
                />
                <input
                  type="text"
                  value={v.color || ''}
                  onChange={e => update('color', e.target.value)}
                  placeholder="inherit"
                  style={{ ...INPUT, fontSize: 11 }}
                />
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <Lbl>Letter Spacing</Lbl>
              <select
                value={v.letterSpacing || ''}
                onChange={e => update('letterSpacing', e.target.value || undefined)}
                style={{ ...INPUT, cursor: 'pointer', fontSize: 12 }}
              >
                {LETTER_SPACING_OPTIONS.map(o => (
                  <option key={o.value} value={o.value} style={{ background: '#1a1a18' }}>{o.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Reset */}
          {Object.keys(v).filter(k => v[k] !== undefined).length > 0 && (
            <button
              onClick={() => onChange({})}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: NU, fontSize: 8, color: 'rgba(248,113,113,0.6)', padding: 0, marginTop: 6, letterSpacing: '0.06em' }}
            >
              ✕ Reset overrides
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── AI Generate button + suggestion bar ───────────────────────────────────────
function AiGenerateBar({ fieldLabel, templateName, issueData, personaId, onAccept }) {
  const [loading, setLoading]     = useState(false);
  const [suggestion, setSuggestion] = useState(null);
  const [err, setErr]             = useState('');

  const persona = PERSONAS.find(p => p.id === personaId) || PERSONAS[0];

  const handleGenerate = async () => {
    setLoading(true); setErr(''); setSuggestion(null);
    try {
      const { callAiGenerate } = await import('../../../lib/aiGenerate');
      const userPrompt = `Write ${fieldLabel} for a luxury wedding magazine page titled "${templateName}". Issue: ${issueData?.title || ''}, ${issueData?.season || ''} ${issueData?.year || ''}. Keep it concise and editorial. Return only the text, nothing else.`;
      const data = await callAiGenerate({
        feature:      `template_generate_${fieldLabel.toLowerCase().replace(/\s+/g, '_')}`,
        systemPrompt: persona.sys,
        userPrompt,
      });
      if (data?.text?.trim()) setSuggestion(data.text.trim());
      else setErr('No content returned.');
    } catch (e) {
      setErr(e.message || 'AI unavailable');
    }
    setLoading(false);
  };

  return (
    <div style={{ marginTop: 4 }}>
      <button
        onClick={handleGenerate}
        disabled={loading}
        style={{
          fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
          background: loading ? 'rgba(201,168,76,0.1)' : 'none',
          border: `1px solid ${loading ? GOLD : 'rgba(201,168,76,0.35)'}`,
          borderRadius: 2, padding: '3px 8px',
          color: loading ? GOLD : 'rgba(201,168,76,0.65)',
          cursor: loading ? 'default' : 'pointer', transition: 'all 0.15s',
        }}
      >
        {loading ? '⟳ Generating…' : '✧ Generate'}
      </button>

      {err && (
        <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 4 }}>{err}</div>
      )}

      {suggestion && (
        <div style={{ marginTop: 8, background: 'rgba(201,168,76,0.06)', border: '1px solid rgba(201,168,76,0.22)', borderRadius: 4, padding: '10px 12px' }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 6 }}>✦ Suggestion</div>
          <div style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55, marginBottom: 10, whiteSpace: 'pre-wrap' }}>{suggestion}</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn small gold onClick={() => { onAccept(suggestion); setSuggestion(null); }}>Accept</Btn>
            <Btn small onClick={() => setSuggestion(null)}>Dismiss</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field renderers ───────────────────────────────────────────────────────────
function TextField({ field, value, onChange, templateName, issueData, personaId, typographyValue, onTypographyChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl required={field.required}>{field.label}</Lbl>
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        maxLength={field.maxLength}
        style={INPUT}
      />
      {field.maxLength && (
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginTop: 3 }}>
          {(value || '').length} / {field.maxLength}
        </div>
      )}
      {field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 3 }}>{field.hint}</div>
      )}
      <AiGenerateBar fieldLabel={field.label} templateName={templateName} issueData={issueData} personaId={personaId} onAccept={onChange} />
      <TypographyPanel fieldId={field.id} value={typographyValue} onChange={onTypographyChange} />
    </div>
  );
}

function TextareaField({ field, value, onChange, templateName, issueData, personaId, typographyValue, onTypographyChange }) {
  const rows = field.rows || 4;
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl required={field.required}>{field.label}</Lbl>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || ''}
        rows={rows}
        style={{ ...INPUT, resize: 'vertical' }}
      />
      {field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 3 }}>{field.hint}</div>
      )}
      <AiGenerateBar fieldLabel={field.label} templateName={templateName} issueData={issueData} personaId={personaId} onAccept={onChange} />
      <TypographyPanel fieldId={field.id} value={typographyValue} onChange={onTypographyChange} />
    </div>
  );
}

function ImageField({ field, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl required={field.required}>{field.label}</Lbl>
      <input
        type="url"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={field.placeholder || 'Paste image URL or path'}
        style={INPUT}
      />
      {value && (
        <img
          src={value}
          alt=""
          style={{ marginTop: 8, width: '100%', maxHeight: 120, objectFit: 'cover', borderRadius: 3, display: 'block' }}
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}
      {field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>{field.hint}</div>
      )}
      {!field.hint && (
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4 }}>
          Paste a URL from your Media Library or any image URL
        </div>
      )}
    </div>
  );
}

function SelectField({ field, value, onChange }) {
  // Support both string options arrays (legacy) and object options
  const options = (field.options || []).map(opt =>
    typeof opt === 'string' ? { value: opt, label: opt } : opt
  );
  const currentValue = value || field.default || (options[0]?.value || '');

  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl>{field.label}</Lbl>
      <select
        value={currentValue}
        onChange={e => onChange(e.target.value)}
        style={{ ...INPUT, cursor: 'pointer' }}
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value} style={{ background: '#1a1a18' }}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}

function ColorField({ field, value, onChange }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <Lbl>{field.label}</Lbl>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="color"
          value={value || field.default || '#C9A96E'}
          onChange={e => onChange(e.target.value)}
          style={{ width: 36, height: 32, border: 'none', background: 'none', cursor: 'pointer', padding: 0 }}
        />
        <input
          type="text"
          value={value || field.default || ''}
          onChange={e => onChange(e.target.value)}
          placeholder={field.default || '#C9A96E'}
          style={{ ...INPUT, flex: 1 }}
        />
      </div>
    </div>
  );
}

// ── Compact persona pills for editor header ───────────────────────────────────
function PersonaPills({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
      {PERSONAS.map(p => {
        const active = value === p.id;
        return (
          <button
            key={p.id}
            onClick={() => onChange(p.id)}
            title={p.label}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 600,
              letterSpacing: '0.05em',
              padding: '4px 9px', borderRadius: 2,
              border: `1px solid ${active ? GOLD : 'rgba(255,255,255,0.1)'}`,
              background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
              color: active ? GOLD : MUTED,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {p.emoji} {p.label}
          </button>
        );
      })}
    </div>
  );
}

// ── Ruler components ──────────────────────────────────────────────────────────
function HorizontalRuler({ width, zoom, pageSizeMm = 210 }) {
  const mmToPx = (width / pageSizeMm);
  const tickPx = mmToPx * 10; // 10mm per tick
  const tickCount = Math.ceil(pageSizeMm / 10) + 1;

  return (
    <div style={{
      height: 20,
      width,
      background: '#2A2520',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      borderBottom: '1px solid rgba(255,255,255,0.08)',
    }}>
      {Array.from({ length: tickCount }, (_, i) => {
        const x = i * tickPx;
        const isMajor = i % 5 === 0; // every 50mm
        return (
          <div key={i} style={{ position: 'absolute', left: x, top: 0 }}>
            <div style={{
              position: 'absolute',
              left: 0,
              top: isMajor ? 4 : 10,
              width: 1,
              height: isMajor ? 12 : 6,
              background: 'rgba(255,255,255,0.35)',
            }} />
            {isMajor && i > 0 && (
              <div style={{
                position: 'absolute',
                left: 2,
                top: 4,
                fontSize: 7,
                fontFamily: "'Jost', sans-serif",
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                lineHeight: 1,
              }}>
                {i * 10}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function VerticalRuler({ height, zoom, pageSizeMm = 297 }) {
  const mmToPx = (height / pageSizeMm);
  const tickPx = mmToPx * 10;
  const tickCount = Math.ceil(pageSizeMm / 10) + 1;

  return (
    <div style={{
      width: 20,
      height,
      background: '#2A2520',
      position: 'relative',
      overflow: 'hidden',
      flexShrink: 0,
      borderRight: '1px solid rgba(255,255,255,0.08)',
    }}>
      {Array.from({ length: tickCount }, (_, i) => {
        const y = i * tickPx;
        const isMajor = i % 5 === 0;
        return (
          <div key={i} style={{ position: 'absolute', top: y, left: 0 }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: isMajor ? 4 : 10,
              height: 1,
              width: isMajor ? 12 : 6,
              background: 'rgba(255,255,255,0.35)',
            }} />
            {isMajor && i > 0 && (
              <div style={{
                position: 'absolute',
                top: 2,
                left: 2,
                fontSize: 7,
                fontFamily: "'Jost', sans-serif",
                color: 'rgba(255,255,255,0.35)',
                letterSpacing: '0.04em',
                whiteSpace: 'nowrap',
                lineHeight: 1,
                writingMode: 'vertical-rl',
                textOrientation: 'mixed',
                transform: 'rotate(180deg)',
              }}>
                {i * 10}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Grid overlay ──────────────────────────────────────────────────────────────
function GridOverlay({ width, height }) {
  const cellMm = 10; // 10mm grid (≈ 1cm)
  const mmToPxW = width / 210;
  const mmToPxH = height / 297;
  const cellW = mmToPxW * cellMm;
  const cellH = mmToPxH * cellMm;

  const cols = Math.ceil(width / cellW);
  const rows = Math.ceil(height / cellH);

  const lines = [];

  // Vertical lines
  for (let i = 0; i <= cols; i++) {
    const x = i * cellW;
    const isMajor = i % 5 === 0;
    lines.push(
      <line key={`v${i}`} x1={x} y1={0} x2={x} y2={height}
        stroke={isMajor ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.07)'}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
  }

  // Horizontal lines
  for (let i = 0; i <= rows; i++) {
    const y = i * cellH;
    const isMajor = i % 5 === 0;
    lines.push(
      <line key={`h${i}`} x1={0} y1={y} x2={width} y2={y}
        stroke={isMajor ? 'rgba(201,168,76,0.15)' : 'rgba(201,168,76,0.07)'}
        strokeWidth={isMajor ? 1 : 0.5}
      />
    );
  }

  return (
    <svg
      style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}
      width={width}
      height={height}
    >
      {lines}
    </svg>
  );
}

// ── Canvas Toolbar ────────────────────────────────────────────────────────────
const ZOOM_PRESETS = [0.5, 0.75, 1.0, 1.25, 1.5, 2.0];
const ZOOM_LABELS  = ['50%', '75%', '100%', '125%', '150%', '200%'];

function CanvasToolbar({ showRuler, onRuler, showGrid, onGrid, zoom, onZoom }) {
  const btnStyle = (active) => ({
    fontFamily: NU, fontSize: 9, fontWeight: 600, letterSpacing: '0.06em',
    padding: '4px 10px', borderRadius: 2,
    border: `1px solid ${active ? GOLD : BORDER}`,
    background: active ? 'rgba(201,168,76,0.12)' : 'rgba(255,255,255,0.03)',
    color: active ? GOLD : MUTED,
    cursor: 'pointer', transition: 'all 0.12s',
  });

  const decZoom = () => {
    const i = ZOOM_PRESETS.indexOf(zoom);
    if (i > 0) onZoom(ZOOM_PRESETS[i - 1]);
  };
  const incZoom = () => {
    const i = ZOOM_PRESETS.indexOf(zoom);
    if (i < ZOOM_PRESETS.length - 1) onZoom(ZOOM_PRESETS[i + 1]);
  };

  return (
    <div style={{
      height: 34,
      flexShrink: 0,
      borderBottom: `1px solid ${BORDER}`,
      background: '#0D0C0A',
      display: 'flex',
      alignItems: 'center',
      padding: '0 14px',
      gap: 8,
    }}>
      <button style={btnStyle(showRuler)} onClick={onRuler}>
        📐 Ruler {showRuler ? '●' : '○'}
      </button>
      <button style={btnStyle(showGrid)} onClick={onGrid}>
        ⊞ Grid {showGrid ? '●' : '○'}
      </button>
      <div style={{ width: 1, height: 16, background: BORDER, margin: '0 4px' }} />
      {/* Zoom dropdown */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, letterSpacing: '0.06em' }}>Zoom:</span>
        <select
          value={zoom}
          onChange={e => onZoom(Number(e.target.value))}
          style={{
            fontFamily: NU, fontSize: 9, background: 'rgba(255,255,255,0.05)',
            border: `1px solid ${BORDER}`, borderRadius: 2, color: '#fff',
            padding: '2px 4px', cursor: 'pointer', outline: 'none',
          }}
        >
          {ZOOM_PRESETS.map((z, i) => (
            <option key={z} value={z} style={{ background: '#1a1a18' }}>{ZOOM_LABELS[i]}</option>
          ))}
        </select>
      </div>
      <button
        onClick={decZoom}
        disabled={zoom <= ZOOM_PRESETS[0]}
        style={{ ...btnStyle(false), padding: '3px 8px', opacity: zoom <= ZOOM_PRESETS[0] ? 0.3 : 1 }}
        title="Zoom out"
      >🔍−</button>
      <button
        onClick={incZoom}
        disabled={zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1]}
        style={{ ...btnStyle(false), padding: '3px 8px', opacity: zoom >= ZOOM_PRESETS[ZOOM_PRESETS.length - 1] ? 0.3 : 1 }}
        title="Zoom in"
      >🔍+</button>
    </div>
  );
}

// ── Main TemplateEditor ───────────────────────────────────────────────────────

export default function TemplateEditor({ template, issueData, persona: initialPersona, onAdd, onClose }) {
  // Initialise field values from defaults
  const defaultValues = {};
  (template.fields || []).forEach(f => {
    if (f.default !== undefined) defaultValues[f.id] = f.default;
  });

  const [fieldValues,  setFieldValues]  = useState(defaultValues);
  const [fieldStyles,  setFieldStyles]  = useState({});
  const [rendering,    setRendering]    = useState(false);
  const [renderError,  setRenderError]  = useState('');
  const [personaId,    setPersonaId]    = useState(initialPersona || 'luxury-editorial');

  // Canvas toolbar state
  const [showRuler,  setShowRuler]  = useState(false);
  const [showGrid,   setShowGrid]   = useState(false);
  const [canvasZoom, setCanvasZoom] = useState(1.0);

  const canvasRef = useRef(null);

  const setField = useCallback((id, val) => {
    setFieldValues(prev => ({ ...prev, [id]: val }));
  }, []);

  const setFieldStyle = useCallback((id, val) => {
    setFieldStyles(prev => ({ ...prev, [id]: val }));
  }, []);

  // Check if required fields are filled
  const canAdd = (template.fields || [])
    .filter(f => f.required)
    .every(f => fieldValues[f.id] !== undefined && fieldValues[f.id] !== '');

  const handleAdd = async () => {
    if (!canvasRef.current || !issueData?.id) return;
    setRendering(true);
    setRenderError('');
    try {
      // Capture canvas
      const blob = await renderToJpeg(canvasRef.current, { scale: 3 });

      // Get next page number
      const { data: existingPages } = await fetchPages(issueData.id);
      const maxPage = existingPages?.length
        ? Math.max(...existingPages.map(p => p.page_number))
        : 0;
      const nextPage = maxPage + 1;

      // Upload image
      const renderVersion = issueData.render_version || 1;
      const { publicUrl, storagePath, error: uploadErr } = await uploadPageImage(
        issueData.id, renderVersion, nextPage, blob
      );
      if (uploadErr) throw uploadErr;

      // Upsert page record
      const { data: newPage, error: upsertErr } = await upsertPage({
        issue_id:      issueData.id,
        page_number:   nextPage,
        image_url:     publicUrl,
        storage_path:  storagePath,
        source_type:   'template',
        template_data: { templateId: template.id, fields: fieldValues, fieldStyles },
      });
      if (upsertErr) throw upsertErr;

      onAdd(newPage);
    } catch (e) {
      console.error('[TemplateEditor] handleAdd error:', e);
      setRenderError(e.message || 'Render failed. Please try again.');
    }
    setRendering(false);
  };

  // Preview width: fill left panel minus ruler and padding
  const [previewWidth, setPreviewWidth] = useState(340);
  const previewPanelRef = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!previewPanelRef.current) return;
    const observer = new ResizeObserver(entries => {
      const w = entries[0]?.contentRect?.width;
      if (w) {
        const rulerSpace = showRuler ? 20 : 0;
        setPreviewWidth(Math.floor(w - 48 - rulerSpace));
      }
    });
    observer.observe(previewPanelRef.current);
    return () => observer.disconnect();
  }, [showRuler]);

  // Page size mm for rulers
  const pageSizeW = 210; // A4 width mm
  const pageSizeH = 297; // A4 height mm

  // Canvas height for ruler
  const ratio = 1.4142;
  const canvasH = Math.round(previewWidth * ratio);

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 910,
      background: BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: NU,
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 56, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 20px', gap: 14,
        background: SURF,
      }}>
        {/* Back */}
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            color: MUTED, cursor: 'pointer', fontFamily: NU,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.07em',
            textTransform: 'uppercase', padding: '5px 12px', borderRadius: 3,
          }}
        >
          ← Back
        </button>

        {/* Template name */}
        <div style={{ fontFamily: GD, fontSize: 17, fontStyle: 'italic', color: '#fff' }}>
          {template.name}
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, padding: '3px 8px', border: `1px solid ${BORDER}`, borderRadius: 10 }}>
          {template.category}
        </div>

        {/* Persona pills */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, marginLeft: 8, overflow: 'hidden' }}>
          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, flexShrink: 0 }}>AI Voice:</span>
          <PersonaPills value={personaId} onChange={setPersonaId} />
        </div>

        {/* Add to Issue button */}
        {renderError && (
          <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', maxWidth: 200, textAlign: 'right' }}>
            {renderError}
          </div>
        )}
        <Btn gold onClick={handleAdd} disabled={rendering || !canAdd}>
          {rendering ? '⟳ Rendering…' : '↑ Add to Issue'}
        </Btn>
      </div>

      {/* ── Body: left preview | right form ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

        {/* ── Left 58%: canvas toolbar + live preview ── */}
        <div
          ref={previewPanelRef}
          style={{
            width: '58%', flexShrink: 0,
            borderRight: `1px solid ${BORDER}`,
            background: '#0a0908',
            display: 'flex', flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Canvas Toolbar */}
          <CanvasToolbar
            showRuler={showRuler}
            onRuler={() => setShowRuler(r => !r)}
            showGrid={showGrid}
            onGrid={() => setShowGrid(g => !g)}
            zoom={canvasZoom}
            onZoom={setCanvasZoom}
          />

          {/* Scrollable canvas area */}
          <div
            ref={scrollRef}
            style={{
              flex: 1,
              overflow: 'auto',
              display: 'flex',
              alignItems: canvasZoom <= 1 ? 'center' : 'flex-start',
              justifyContent: canvasZoom <= 1 ? 'center' : 'flex-start',
              padding: '24px',
            }}
          >
            {/* Ruler + canvas wrapper */}
            <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column' }}>
              {/* Top horizontal ruler */}
              {showRuler && (
                <div style={{ display: 'flex', marginLeft: 20 }}>
                  <HorizontalRuler width={previewWidth} zoom={canvasZoom} pageSizeMm={pageSizeW} />
                </div>
              )}

              <div style={{ display: 'flex' }}>
                {/* Left vertical ruler */}
                {showRuler && (
                  <VerticalRuler height={canvasH} zoom={canvasZoom} pageSizeMm={pageSizeH} />
                )}

                {/* Canvas: apply zoom via transform */}
                <div
                  style={{
                    transform: `scale(${canvasZoom})`,
                    transformOrigin: 'top left',
                    flexShrink: 0,
                    // Account for transformed size so scroll container knows actual dimensions
                    width: previewWidth * canvasZoom,
                    height: canvasH * canvasZoom,
                    // The canvas itself is un-scaled inside
                    position: 'relative',
                  }}
                >
                  <div
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      transformOrigin: 'top left',
                      transform: canvasZoom !== 1 ? `scale(${1 / canvasZoom}) scale(${canvasZoom})` : undefined,
                    }}
                  >
                    <div
                      ref={canvasRef}
                      style={{
                        boxShadow: '0 16px 64px rgba(0,0,0,0.7)',
                        flexShrink: 0,
                        pointerEvents: 'none',
                        userSelect: 'none',
                        position: 'relative',
                      }}
                    >
                      <TemplateCanvas
                        templateId={template.id}
                        fields={fieldValues}
                        pageSize={issueData?.page_size || 'A4'}
                        width={previewWidth}
                        fieldStyles={fieldStyles}
                      />
                      {/* Grid overlay — only in editor, not capture */}
                      {showGrid && (
                        <GridOverlay width={previewWidth} height={canvasH} />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Template description below */}
          <div style={{ padding: '0 24px 14px', fontFamily: NU, fontSize: 10, color: MUTED, textAlign: 'center' }}>
            {template.description}
          </div>
        </div>

        {/* ── Right 42%: form ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>

          {/* Section heading */}
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 18 }}>
            ✦ Template Fields
          </div>

          {!canAdd && (
            <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(251,191,36,0.8)', background: 'rgba(251,191,36,0.06)', border: '1px solid rgba(251,191,36,0.18)', borderRadius: 3, padding: '8px 12px', marginBottom: 16 }}>
              Fill all required fields (*) before adding to the issue.
            </div>
          )}

          {/* Fields */}
          {(template.fields || []).map(field => {
            const val    = fieldValues[field.id];
            const change = (v) => setField(field.id, v);
            const typoVal    = fieldStyles[field.id];
            const typoChange = (v) => setFieldStyle(field.id, v);

            switch (field.type) {
              case 'image':
                return <ImageField key={field.id} field={field} value={val} onChange={change} />;
              case 'textarea':
                return <TextareaField key={field.id} field={field} value={val} onChange={change} templateName={template.name} issueData={issueData} personaId={personaId} typographyValue={typoVal} onTypographyChange={typoChange} />;
              case 'select':
                return <SelectField key={field.id} field={field} value={val} onChange={change} />;
              case 'color':
                return <ColorField key={field.id} field={field} value={val} onChange={change} />;
              case 'text':
              default:
                return <TextField key={field.id} field={field} value={val} onChange={change} templateName={template.name} issueData={issueData} personaId={personaId} typographyValue={typoVal} onTypographyChange={typoChange} />;
            }
          })}

          {/* Bottom: Add to Issue */}
          <div style={{ marginTop: 24, paddingTop: 20, borderTop: `1px solid ${BORDER}` }}>
            <Btn gold onClick={handleAdd} disabled={rendering || !canAdd}>
              {rendering ? '⟳ Rendering…' : '↑ Add to Issue'}
            </Btn>
            {renderError && (
              <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 8 }}>{renderError}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
