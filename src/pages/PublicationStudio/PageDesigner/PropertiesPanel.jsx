import { useState, useEffect, useCallback } from 'react';
import { Gradient, Shadow, filters as fabricFilters } from 'fabric';
import { GOLD, DARK, CARD, BORDER, MUTED, GD, NU } from './designerConstants';
import { FONT_CATALOG, loadGoogleFont } from '../templates/fontCatalog';

const SECTION = {
  fontFamily: NU,
  fontSize: 9,
  fontWeight: 700,
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
  color: GOLD,
  padding: '14px 16px 6px',
};

const INPUT_STYLE = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 3,
  color: '#fff',
  fontFamily: NU,
  fontSize: 12,
  padding: '5px 8px',
  outline: 'none',
};

const LABEL_STYLE = {
  fontFamily: NU,
  fontSize: 10,
  color: MUTED,
  marginBottom: 4,
  display: 'block',
};

function PropField({ label, children }) {
  return (
    <div style={{ padding: '4px 16px 8px' }}>
      <span style={LABEL_STYLE}>{label}</span>
      {children}
    </div>
  );
}

function IconBtn({ children, active, onClick, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active ? 'rgba(201,169,110,0.2)' : hov ? 'rgba(255,255,255,0.06)' : 'none',
        border: `1px solid ${active ? 'rgba(201,169,110,0.4)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 3,
        color: active ? GOLD : 'rgba(255,255,255,0.6)',
        fontFamily: NU,
        fontSize: 12,
        padding: '4px 8px',
        cursor: 'pointer',
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function NumInput({ value, onChange, min, max, step = 1, style = {} }) {
  return (
    <input
      type="number"
      value={value ?? ''}
      min={min}
      max={max}
      step={step}
      onChange={e => onChange(Number(e.target.value))}
      style={{ ...INPUT_STYLE, ...style }}
    />
  );
}

function Slider({ value, onChange, min = 0, max = 100, step = 1 }) {
  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value ?? min}
      onChange={e => onChange(Number(e.target.value))}
      style={{ width: '100%', accentColor: GOLD }}
    />
  );
}

function ColorInput({ value, onChange, label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <input
        type="color"
        value={value || '#000000'}
        onChange={e => onChange(e.target.value)}
        style={{ width: 32, height: 28, border: 'none', padding: 0, background: 'none', cursor: 'pointer', borderRadius: 3 }}
      />
      <input
        type="text"
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="#000000"
        style={{ ...INPUT_STYLE, flex: 1 }}
      />
    </div>
  );
}

function Hr() {
  return <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', margin: '6px 0' }} />;
}

// ── Paragraph Style Presets (Feature H) ───────────────────────────────────────
const PARA_STYLES = [
  {
    id: 'h1',
    label: 'H1',
    props: { fontFamily: 'Bodoni Moda', fontSize: 48, fontWeight: '700', fontStyle: 'normal', fill: '#18120A', charSpacing: 0, textTransform: 'none' },
  },
  {
    id: 'h2',
    label: 'H2',
    props: { fontFamily: 'Bodoni Moda', fontSize: 32, fontWeight: '400', fontStyle: 'normal', fill: '#18120A', charSpacing: 0, textTransform: 'none' },
  },
  {
    id: 'kicker',
    label: 'Kicker',
    props: { fontFamily: 'Jost', fontSize: 10, fontWeight: '700', fontStyle: 'normal', fill: '#C9A96E', charSpacing: 280, textTransform: 'uppercase' },
  },
  {
    id: 'body',
    label: 'Body',
    props: { fontFamily: 'Cormorant Garamond', fontSize: 16, fontWeight: '400', fontStyle: 'italic', fill: '#18120A', charSpacing: 0, textTransform: 'none' },
  },
  {
    id: 'caption',
    label: 'Caption',
    props: { fontFamily: 'Jost', fontSize: 10, fontWeight: '400', fontStyle: 'normal', fill: 'rgba(24,18,10,0.55)', charSpacing: 80, textTransform: 'none' },
  },
  {
    id: 'pullquote',
    label: 'Pull Quote',
    props: { fontFamily: 'Cormorant Garamond', fontSize: 24, fontWeight: '400', fontStyle: 'italic', fill: '#C9A96E', charSpacing: 0, textTransform: 'none' },
  },
];

function styleMatchesPreset(obj, preset) {
  const p = preset.props;
  return (
    obj.fontFamily === p.fontFamily &&
    obj.fontSize === p.fontSize &&
    String(obj.fontWeight) === String(p.fontWeight) &&
    obj.fontStyle === p.fontStyle &&
    obj.fill === p.fill
  );
}

// ── Image filter definitions (Feature F) ──────────────────────────────────────
const IMAGE_FILTERS = [
  { id: 'none',    label: 'None' },
  { id: 'bw',      label: 'B&W' },
  { id: 'sepia',   label: 'Sepia' },
  { id: 'vintage', label: 'Vintage' },
  { id: 'bright',  label: 'Bright' },
  { id: 'dark',    label: 'Dark' },
];

function applyImageFilter(obj, filterId, canvas) {
  if (!obj || !canvas) return;
  if (filterId === 'none') {
    obj.filters = [];
  } else if (filterId === 'bw') {
    obj.filters = [new fabricFilters.Grayscale()];
  } else if (filterId === 'sepia') {
    obj.filters = [new fabricFilters.Sepia()];
  } else if (filterId === 'vintage') {
    obj.filters = [
      new fabricFilters.Sepia(),
      new fabricFilters.Brightness({ brightness: 0.1 }),
      new fabricFilters.Contrast({ contrast: 0.1 }),
    ];
  } else if (filterId === 'bright') {
    obj.filters = [new fabricFilters.Brightness({ brightness: 0.2 })];
  } else if (filterId === 'dark') {
    obj.filters = [new fabricFilters.Brightness({ brightness: -0.2 })];
  }
  obj.applyFilters();
  canvas.renderAll();
}

function getActiveFilterId(obj) {
  if (!obj || !obj.filters || obj.filters.length === 0) return 'none';
  const f = obj.filters;
  if (f.length === 1 && f[0].type === 'Grayscale') return 'bw';
  if (f.length === 1 && f[0].type === 'Sepia') return 'sepia';
  if (f.length >= 2 && f[0].type === 'Sepia') return 'vintage';
  if (f.length === 1 && f[0].type === 'Brightness') {
    return f[0].brightness > 0 ? 'bright' : 'dark';
  }
  return 'none';
}

// ── Alignment helpers (Feature A) ─────────────────────────────────────────────
function alignObjects(objs, mode, canvas) {
  if (!objs || objs.length < 2 || !canvas) return;

  const effectiveLeft  = obj => obj.left ?? 0;
  const effectiveTop   = obj => obj.top  ?? 0;
  const effectiveRight = obj => effectiveLeft(obj) + (obj.width ?? 0) * (obj.scaleX ?? 1);
  const effectiveBot   = obj => effectiveTop(obj)  + (obj.height ?? 0) * (obj.scaleY ?? 1);

  if (mode === 'align-left') {
    const minLeft = Math.min(...objs.map(effectiveLeft));
    objs.forEach(o => o.set('left', minLeft));
  } else if (mode === 'align-hcenter') {
    const minLeft = Math.min(...objs.map(effectiveLeft));
    const maxRight = Math.max(...objs.map(effectiveRight));
    const centre = (minLeft + maxRight) / 2;
    objs.forEach(o => o.set('left', centre - (o.width ?? 0) * (o.scaleX ?? 1) / 2));
  } else if (mode === 'align-right') {
    const maxRight = Math.max(...objs.map(effectiveRight));
    objs.forEach(o => o.set('left', maxRight - (o.width ?? 0) * (o.scaleX ?? 1)));
  } else if (mode === 'align-top') {
    const minTop = Math.min(...objs.map(effectiveTop));
    objs.forEach(o => o.set('top', minTop));
  } else if (mode === 'align-vcenter') {
    const minTop = Math.min(...objs.map(effectiveTop));
    const maxBot = Math.max(...objs.map(effectiveBot));
    const centre = (minTop + maxBot) / 2;
    objs.forEach(o => o.set('top', centre - (o.height ?? 0) * (o.scaleY ?? 1) / 2));
  } else if (mode === 'align-bottom') {
    const maxBot = Math.max(...objs.map(effectiveBot));
    objs.forEach(o => o.set('top', maxBot - (o.height ?? 0) * (o.scaleY ?? 1)));
  } else if (mode === 'distribute-h') {
    const sorted = [...objs].sort((a, b) => effectiveLeft(a) - effectiveLeft(b));
    const leftmost = effectiveLeft(sorted[0]);
    const rightmost = effectiveRight(sorted[sorted.length - 1]);
    const totalObjW = sorted.reduce((sum, o) => sum + (o.width ?? 0) * (o.scaleX ?? 1), 0);
    const gap = (rightmost - leftmost - totalObjW) / (sorted.length - 1);
    let cursor = leftmost;
    sorted.forEach(o => {
      o.set('left', cursor);
      cursor += (o.width ?? 0) * (o.scaleX ?? 1) + gap;
    });
  } else if (mode === 'distribute-v') {
    const sorted = [...objs].sort((a, b) => effectiveTop(a) - effectiveTop(b));
    const topmost = effectiveTop(sorted[0]);
    const botmost = effectiveBot(sorted[sorted.length - 1]);
    const totalObjH = sorted.reduce((sum, o) => sum + (o.height ?? 0) * (o.scaleY ?? 1), 0);
    const gap = (botmost - topmost - totalObjH) / (sorted.length - 1);
    let cursor = topmost;
    sorted.forEach(o => {
      o.set('top', cursor);
      cursor += (o.height ?? 0) * (o.scaleY ?? 1) + gap;
    });
  }

  objs.forEach(o => o.setCoords?.());
  canvas.renderAll();
}

// ── Gradient helpers (Feature B) ──────────────────────────────────────────────
function buildGradient(obj, color1, color2, direction) {
  const w = (obj.width ?? 100) * (obj.scaleX ?? 1);
  const h = (obj.height ?? 100) * (obj.scaleY ?? 1);
  let coords;
  if (direction === 'horizontal') {
    coords = { x1: 0, y1: 0, x2: w, y2: 0 };
  } else if (direction === 'vertical') {
    coords = { x1: 0, y1: 0, x2: 0, y2: h };
  } else {
    // diagonal
    coords = { x1: 0, y1: 0, x2: w, y2: h };
  }
  return new Gradient({
    type: 'linear',
    coords,
    colorStops: [
      { offset: 0, color: color1 },
      { offset: 1, color: color2 },
    ],
    gradientUnits: 'pixels',
  });
}

function isGradientFill(fill) {
  return fill && typeof fill === 'object' && fill.type === 'linear';
}

export default function PropertiesPanel({ selectedObject, selectedObjects, canvas, onUpdate, onGroup, onUngroup }) {
  const [aiImproveLoading, setAiImproveLoading] = useState(false);
  const [aiRewriteLoading, setAiRewriteLoading] = useState(false);
  const [lockRatio, setLockRatio] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Feature B: gradient state
  const [gradientEnabled, setGradientEnabled] = useState(false);
  const [gradientColor1, setGradientColor1] = useState('#C9A96E');
  const [gradientColor2, setGradientColor2] = useState('#1A1814');
  const [gradientDir, setGradientDir] = useState('horizontal');

  // Feature C: shadow state
  const [shadowEnabled, setShadowEnabled] = useState(false);
  const [shadowColor, setShadowColor] = useState('rgba(0,0,0,0.4)');
  const [shadowBlur, setShadowBlur] = useState(10);
  const [shadowOffsetX, setShadowOffsetX] = useState(4);
  const [shadowOffsetY, setShadowOffsetY] = useState(4);

  const obj = selectedObject;
  const type = obj?.type || '';
  const isText = type === 'textbox' || type === 'i-text';
  const isImage = type === 'image' || type === 'f-image';
  const isRect = type === 'rect';
  const isCircle = type === 'circle';
  const isShape = isRect || isCircle || type === 'line';
  const isGroup = type === 'group';

  // Multi-select
  const multiObjs = selectedObjects && selectedObjects.length >= 2 ? selectedObjects : null;

  const set = useCallback((props) => {
    if (!obj || !canvas) return;
    obj.set(props);
    canvas.renderAll();
    onUpdate?.();
  }, [obj, canvas, onUpdate]);

  // Sync shadow state from object
  useEffect(() => {
    if (!obj) return;
    if (obj.shadow) {
      setShadowEnabled(true);
      setShadowColor(obj.shadow.color || 'rgba(0,0,0,0.4)');
      setShadowBlur(obj.shadow.blur ?? 10);
      setShadowOffsetX(obj.shadow.offsetX ?? 4);
      setShadowOffsetY(obj.shadow.offsetY ?? 4);
    } else {
      setShadowEnabled(false);
    }
    // Sync gradient state from object
    if (isShape && isGradientFill(obj.fill)) {
      setGradientEnabled(true);
      const stops = obj.fill.colorStops || [];
      if (stops[0]) setGradientColor1(stops[0].color || '#C9A96E');
      if (stops[1]) setGradientColor2(stops[1].color || '#1A1814');
      // detect direction from coords
      const c = obj.fill.coords || {};
      if (c.y2 > 0 && c.x2 === 0) setGradientDir('vertical');
      else if (c.x2 > 0 && c.y2 > 0) setGradientDir('diagonal');
      else setGradientDir('horizontal');
    } else {
      setGradientEnabled(false);
    }
  }, [obj, isShape]);

  function applyShadow(enabled, color, blur, ox, oy) {
    if (!obj || !canvas) return;
    if (enabled) {
      obj.set('shadow', new Shadow({ color, blur, offsetX: ox, offsetY: oy }));
    } else {
      obj.set('shadow', null);
    }
    canvas.renderAll();
    onUpdate?.();
  }

  function applyGradient(enabled, c1, c2, dir) {
    if (!obj || !canvas) return;
    if (enabled) {
      obj.set('fill', buildGradient(obj, c1, c2, dir));
    } else {
      obj.set('fill', c1);
    }
    canvas.renderAll();
    onUpdate?.();
  }

  async function handleAIImprove() {
    if (!obj || !isText) return;
    const text = obj.text;
    if (!text?.trim()) return;
    setAiImproveLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          feature: 'designer_improve',
          systemPrompt: 'You are a luxury wedding magazine copy editor. Fix grammar, spelling and flow. Keep the same tone and length. Return only the improved text.',
          userPrompt: text,
        }),
      });
      const data = await res.json();
      if (data.text) { set({ text: data.text }); }
    } finally {
      setAiImproveLoading(false);
    }
  }

  async function handleAIRewrite() {
    if (!obj || !isText) return;
    const text = obj.text;
    if (!text?.trim()) return;
    setAiRewriteLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          feature: 'designer_rewrite',
          systemPrompt: 'You are a luxury wedding magazine editor. Rewrite the following text in an elevated, editorial luxury tone. Keep roughly the same length. Return only the rewritten text.',
          userPrompt: text,
        }),
      });
      const data = await res.json();
      if (data.text) { set({ text: data.text }); }
    } finally {
      setAiRewriteLoading(false);
    }
  }

  function handleDelete() {
    if (!obj || !canvas) return;
    canvas.remove(obj);
    canvas.renderAll();
    onUpdate?.();
    setShowDeleteConfirm(false);
  }

  function handleDuplicate() {
    if (!obj || !canvas) return;
    obj.clone().then(clone => {
      clone.set({ left: (obj.left || 0) + 20, top: (obj.top || 0) + 20 });
      canvas.add(clone);
      canvas.setActiveObject(clone);
      canvas.renderAll();
      onUpdate?.();
    });
  }

  // Feature A: alignment handler
  function handleAlign(mode) {
    if (!canvas) return;
    const objs = canvas.getActiveObjects?.() || (multiObjs ? multiObjs : (obj ? [obj] : []));
    if (objs.length < 2) return;
    alignObjects(objs, mode, canvas);
    onUpdate?.();
  }

  // Show nothing when nothing selected AND no multi-select
  if (!obj && !multiObjs) {
    return (
      <div style={{
        width: 280,
        flexShrink: 0,
        background: '#1A1712',
        borderLeft: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: MUTED,
        fontFamily: NU,
        fontSize: 11,
        padding: 20,
        textAlign: 'center',
      }}>
        Select an element to edit its properties
      </div>
    );
  }

  return (
    <div style={{
      width: 280,
      flexShrink: 0,
      background: '#1A1712',
      borderLeft: `1px solid ${BORDER}`,
      overflowY: 'auto',
      overflowX: 'hidden',
    }}>

      {/* ── FEATURE A: Multi-select Alignment & Distribution ────────────────────── */}
      {multiObjs && (
        <>
          <div style={SECTION}>Align &amp; Distribute</div>
          <div style={{ padding: '4px 16px 8px' }}>
            <span style={LABEL_STYLE}>Align</span>
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              <IconBtn onClick={() => handleAlign('align-left')} title="Align left edges">⬤|</IconBtn>
              <IconBtn onClick={() => handleAlign('align-hcenter')} title="Align horizontal centres">|⬤|</IconBtn>
              <IconBtn onClick={() => handleAlign('align-right')} title="Align right edges">|⬤</IconBtn>
              <IconBtn onClick={() => handleAlign('align-top')} title="Align top edges">⬤—</IconBtn>
              <IconBtn onClick={() => handleAlign('align-vcenter')} title="Align vertical centres">—⬤—</IconBtn>
              <IconBtn onClick={() => handleAlign('align-bottom')} title="Align bottom edges">—⬤</IconBtn>
            </div>
          </div>
          <div style={{ padding: '4px 16px 12px' }}>
            <span style={LABEL_STYLE}>Distribute</span>
            <div style={{ display: 'flex', gap: 4 }}>
              <IconBtn onClick={() => handleAlign('distribute-h')} title="Distribute horizontal spacing">↔ H</IconBtn>
              <IconBtn onClick={() => handleAlign('distribute-v')} title="Distribute vertical spacing">↕ V</IconBtn>
            </div>
          </div>
          {onGroup && (
            <div style={{ padding: '4px 16px 12px' }}>
              <span style={LABEL_STYLE}>Group</span>
              <button
                onClick={onGroup}
                style={{
                  background: 'rgba(201,169,110,0.1)',
                  border: '1px solid rgba(201,169,110,0.3)',
                  borderRadius: 3, color: GOLD,
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '6px 14px', cursor: 'pointer',
                }}
              >
                ⊞ Group Selection
              </button>
            </div>
          )}
          <Hr />
        </>
      )}

      {/* If only multi-select and no single object, stop here (no per-object props) */}
      {multiObjs && !obj && (
        <div style={{ padding: '12px 16px', fontFamily: NU, fontSize: 11, color: MUTED }}>
          {multiObjs.length} objects selected
        </div>
      )}

      {obj && (
        <>
          {/* ── FEATURE H: Paragraph Styles (text only) ──────────────────────────── */}
          {isText && (
            <>
              <div style={SECTION}>Paragraph Style</div>
              <div style={{ padding: '4px 16px 10px', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {PARA_STYLES.map(ps => {
                  const isActive = styleMatchesPreset(obj, ps);
                  return (
                    <button
                      key={ps.id}
                      onClick={() => {
                        loadGoogleFont(ps.props.fontFamily);
                        set(ps.props);
                      }}
                      title={ps.label}
                      style={{
                        background: isActive ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.05)',
                        border: `1px solid ${isActive ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.1)'}`,
                        borderRadius: 3,
                        color: isActive ? GOLD : 'rgba(255,255,255,0.65)',
                        fontFamily: NU,
                        fontSize: 10,
                        fontWeight: 700,
                        padding: '4px 8px',
                        cursor: 'pointer',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {ps.label}
                    </button>
                  );
                })}
              </div>
              <Hr />
            </>
          )}

          {/* Text properties */}
          {isText && (
            <>
              <div style={SECTION}>Typography</div>

              <PropField label="Font Family">
                <select
                  value={obj.fontFamily || 'Cormorant Garamond'}
                  onChange={e => {
                    loadGoogleFont(e.target.value);
                    set({ fontFamily: e.target.value });
                  }}
                  style={{ ...INPUT_STYLE }}
                >
                  {FONT_CATALOG.map(f => (
                    <option key={f.family} value={f.family}>{f.family}</option>
                  ))}
                </select>
              </PropField>

              <PropField label="Font Size">
                <NumInput
                  value={obj.fontSize}
                  onChange={v => set({ fontSize: v })}
                  min={6} max={400}
                />
              </PropField>

              <PropField label="Weight">
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {['300', '400', '500', '600', '700'].map(w => (
                    <IconBtn
                      key={w}
                      active={String(obj.fontWeight) === w}
                      onClick={() => set({ fontWeight: w })}
                    >
                      {w}
                    </IconBtn>
                  ))}
                </div>
              </PropField>

              <PropField label="Style">
                <div style={{ display: 'flex', gap: 6 }}>
                  <IconBtn active={obj.fontStyle === 'italic'} onClick={() => set({ fontStyle: obj.fontStyle === 'italic' ? 'normal' : 'italic' })} title="Italic">
                    <em>I</em>
                  </IconBtn>
                  <IconBtn active={obj.underline} onClick={() => set({ underline: !obj.underline })} title="Underline">
                    <u>U</u>
                  </IconBtn>
                </div>
              </PropField>

              <PropField label="Text Colour">
                <ColorInput value={obj.fill} onChange={v => set({ fill: v })} />
              </PropField>

              <PropField label="Background">
                <ColorInput value={obj.backgroundColor} onChange={v => set({ backgroundColor: v })} />
              </PropField>

              <PropField label="Alignment">
                <div style={{ display: 'flex', gap: 4 }}>
                  {['left', 'center', 'right', 'justify'].map(a => (
                    <IconBtn key={a} active={obj.textAlign === a} onClick={() => set({ textAlign: a })} title={a}>
                      {a === 'left' ? '≡' : a === 'center' ? '≡' : a === 'right' ? '≡' : '≡'}
                      <span style={{ fontSize: 9, display: 'block', lineHeight: 1 }}>
                        {a === 'left' ? 'L' : a === 'center' ? 'C' : a === 'right' ? 'R' : 'J'}
                      </span>
                    </IconBtn>
                  ))}
                </div>
              </PropField>

              <PropField label={`Line Height: ${(obj.lineHeight || 1.3).toFixed(1)}`}>
                <Slider
                  value={(obj.lineHeight || 1.3) * 10}
                  onChange={v => set({ lineHeight: v / 10 })}
                  min={8} max={25} step={1}
                />
              </PropField>

              <PropField label={`Letter Spacing: ${obj.charSpacing || 0}`}>
                <Slider
                  value={obj.charSpacing || 0}
                  onChange={v => set({ charSpacing: v })}
                  min={0} max={300} step={5}
                />
              </PropField>

              <PropField label={`Opacity: ${Math.round((obj.opacity || 1) * 100)}%`}>
                <Slider
                  value={Math.round((obj.opacity || 1) * 100)}
                  onChange={v => set({ opacity: v / 100 })}
                  min={0} max={100}
                />
              </PropField>

              <Hr />

              <div style={{ padding: '4px 16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                <button
                  onClick={handleAIImprove}
                  disabled={aiImproveLoading}
                  style={{
                    background: 'rgba(201,169,110,0.1)',
                    border: `1px solid rgba(201,169,110,0.3)`,
                    borderRadius: 3, color: GOLD,
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '7px 0', cursor: 'pointer',
                    opacity: aiImproveLoading ? 0.5 : 1,
                  }}
                >
                  {aiImproveLoading ? 'Improving...' : '✦ AI Improve'}
                </button>
                <button
                  onClick={handleAIRewrite}
                  disabled={aiRewriteLoading}
                  style={{
                    background: 'rgba(201,169,110,0.06)',
                    border: `1px solid rgba(201,169,110,0.2)`,
                    borderRadius: 3, color: GOLD,
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '7px 0', cursor: 'pointer',
                    opacity: aiRewriteLoading ? 0.5 : 1,
                  }}
                >
                  {aiRewriteLoading ? 'Rewriting...' : '✦ AI Rewrite'}
                </button>
              </div>
            </>
          )}

          {/* ── FEATURE F: Image Filters ─────────────────────────────────────────── */}
          {isImage && (
            <>
              <div style={SECTION}>Image</div>

              <PropField label={`Opacity: ${Math.round((obj.opacity || 1) * 100)}%`}>
                <Slider
                  value={Math.round((obj.opacity || 1) * 100)}
                  onChange={v => set({ opacity: v / 100 })}
                  min={0} max={100}
                />
              </PropField>

              <PropField label="Flip">
                <div style={{ display: 'flex', gap: 6 }}>
                  <IconBtn active={obj.flipX} onClick={() => set({ flipX: !obj.flipX })} title="Flip Horizontal">
                    Flip H
                  </IconBtn>
                  <IconBtn active={obj.flipY} onClick={() => set({ flipY: !obj.flipY })} title="Flip Vertical">
                    Flip V
                  </IconBtn>
                </div>
              </PropField>

              <PropField label="Layer">
                <div style={{ display: 'flex', gap: 6 }}>
                  <IconBtn onClick={() => { canvas?.bringObjectForward(obj); onUpdate?.(); }} title="Bring Forward">
                    ↑ Forward
                  </IconBtn>
                  <IconBtn onClick={() => { canvas?.sendObjectBackwards(obj); onUpdate?.(); }} title="Send Back">
                    ↓ Back
                  </IconBtn>
                </div>
              </PropField>

              <div style={{ padding: '4px 16px 8px' }}>
                <span style={LABEL_STYLE}>Filter</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {IMAGE_FILTERS.map(f => {
                    const active = getActiveFilterId(obj) === f.id;
                    return (
                      <button
                        key={f.id}
                        onClick={() => { applyImageFilter(obj, f.id, canvas); onUpdate?.(); }}
                        style={{
                          background: active ? 'rgba(201,169,110,0.2)' : 'rgba(255,255,255,0.05)',
                          border: `1px solid ${active ? 'rgba(201,169,110,0.5)' : 'rgba(255,255,255,0.1)'}`,
                          borderRadius: 3,
                          color: active ? GOLD : 'rgba(255,255,255,0.65)',
                          fontFamily: NU, fontSize: 10, fontWeight: 700,
                          padding: '4px 8px', cursor: 'pointer',
                          letterSpacing: '0.04em',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {f.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Hr />
            </>
          )}

          {/* Shape properties */}
          {isShape && (
            <>
              <div style={SECTION}>Shape</div>

              {/* ── FEATURE B: Gradient Toggle ─────────────────────────────────────── */}
              <PropField label="Fill Colour">
                <ColorInput
                  value={gradientEnabled ? gradientColor1 : (typeof obj.fill === 'string' ? obj.fill : '#C9A96E')}
                  onChange={v => {
                    if (gradientEnabled) {
                      setGradientColor1(v);
                      applyGradient(true, v, gradientColor2, gradientDir);
                    } else {
                      set({ fill: v });
                    }
                  }}
                />
              </PropField>

              <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  id="gradientToggle"
                  checked={gradientEnabled}
                  onChange={e => {
                    const en = e.target.checked;
                    setGradientEnabled(en);
                    const solidColor = typeof obj.fill === 'string' ? obj.fill : '#C9A96E';
                    if (!en) {
                      // revert to solid
                      obj.set('fill', gradientColor1 || solidColor);
                      canvas.renderAll();
                      onUpdate?.();
                    } else {
                      applyGradient(true, gradientColor1, gradientColor2, gradientDir);
                    }
                  }}
                  style={{ accentColor: GOLD, width: 14, height: 14 }}
                />
                <label htmlFor="gradientToggle" style={{ fontFamily: NU, fontSize: 11, color: MUTED, cursor: 'pointer' }}>
                  Gradient fill
                </label>
              </div>

              {gradientEnabled && (
                <>
                  <PropField label="Gradient end colour">
                    <ColorInput
                      value={gradientColor2}
                      onChange={v => {
                        setGradientColor2(v);
                        applyGradient(true, gradientColor1, v, gradientDir);
                      }}
                    />
                  </PropField>
                  <div style={{ padding: '4px 16px 8px' }}>
                    <span style={LABEL_STYLE}>Direction</span>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {[['horizontal', '→ H'], ['vertical', '↓ V'], ['diagonal', '↘ D']].map(([d, label]) => (
                        <IconBtn
                          key={d}
                          active={gradientDir === d}
                          onClick={() => {
                            setGradientDir(d);
                            applyGradient(true, gradientColor1, gradientColor2, d);
                          }}
                        >
                          {label}
                        </IconBtn>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <PropField label="Stroke Colour">
                <ColorInput
                  value={obj.stroke}
                  onChange={v => set({ stroke: v })}
                />
              </PropField>

              <PropField label="Stroke Width">
                <NumInput
                  value={obj.strokeWidth || 0}
                  onChange={v => set({ strokeWidth: v })}
                  min={0} max={50}
                />
              </PropField>

              {isRect && (
                <PropField label="Border Radius">
                  <NumInput
                    value={obj.rx || 0}
                    onChange={v => set({ rx: v, ry: v })}
                    min={0} max={200}
                  />
                </PropField>
              )}

              <PropField label={`Opacity: ${Math.round((obj.opacity || 1) * 100)}%`}>
                <Slider
                  value={Math.round((obj.opacity || 1) * 100)}
                  onChange={v => set({ opacity: v / 100 })}
                  min={0} max={100}
                />
              </PropField>

              <Hr />
            </>
          )}

          {/* ── FEATURE C: Drop Shadow ─────────────────────────────────────────────── */}
          <div style={SECTION}>Shadow</div>
          <div style={{ padding: '4px 16px 8px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              id="shadowToggle"
              checked={shadowEnabled}
              onChange={e => {
                const en = e.target.checked;
                setShadowEnabled(en);
                applyShadow(en, shadowColor, shadowBlur, shadowOffsetX, shadowOffsetY);
              }}
              style={{ accentColor: GOLD, width: 14, height: 14 }}
            />
            <label htmlFor="shadowToggle" style={{ fontFamily: NU, fontSize: 11, color: MUTED, cursor: 'pointer' }}>
              Enable shadow
            </label>
          </div>
          {shadowEnabled && (
            <>
              <PropField label="Shadow Colour">
                <ColorInput
                  value={shadowColor}
                  onChange={v => {
                    setShadowColor(v);
                    applyShadow(true, v, shadowBlur, shadowOffsetX, shadowOffsetY);
                  }}
                />
              </PropField>
              <PropField label={`Blur: ${shadowBlur}`}>
                <Slider
                  value={shadowBlur}
                  onChange={v => {
                    setShadowBlur(v);
                    applyShadow(true, shadowColor, v, shadowOffsetX, shadowOffsetY);
                  }}
                  min={0} max={40}
                />
              </PropField>
              <div style={{ padding: '4px 16px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div>
                  <span style={LABEL_STYLE}>Offset X</span>
                  <NumInput
                    value={shadowOffsetX}
                    onChange={v => {
                      setShadowOffsetX(v);
                      applyShadow(true, shadowColor, shadowBlur, v, shadowOffsetY);
                    }}
                    min={-20} max={20}
                  />
                </div>
                <div>
                  <span style={LABEL_STYLE}>Offset Y</span>
                  <NumInput
                    value={shadowOffsetY}
                    onChange={v => {
                      setShadowOffsetY(v);
                      applyShadow(true, shadowColor, shadowBlur, shadowOffsetX, v);
                    }}
                    min={-20} max={20}
                  />
                </div>
              </div>
            </>
          )}
          <Hr />

          {/* Common: position, size, rotation */}
          <div style={SECTION}>Transform</div>

          <div style={{ padding: '4px 16px 8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div>
              <span style={LABEL_STYLE}>X</span>
              <NumInput
                value={Math.round(obj.left || 0)}
                onChange={v => set({ left: v })}
                step={1}
              />
            </div>
            <div>
              <span style={LABEL_STYLE}>Y</span>
              <NumInput
                value={Math.round(obj.top || 0)}
                onChange={v => set({ top: v })}
                step={1}
              />
            </div>
            <div>
              <span style={LABEL_STYLE}>W</span>
              <NumInput
                value={Math.round((obj.width || 0) * (obj.scaleX || 1))}
                onChange={v => {
                  const newScaleX = v / (obj.width || 1);
                  if (lockRatio) {
                    set({ scaleX: newScaleX, scaleY: newScaleX });
                  } else {
                    set({ scaleX: newScaleX });
                  }
                }}
                min={1} step={1}
              />
            </div>
            <div>
              <span style={LABEL_STYLE}>H</span>
              <NumInput
                value={Math.round((obj.height || 0) * (obj.scaleY || 1))}
                onChange={v => {
                  const newScaleY = v / (obj.height || 1);
                  if (lockRatio) {
                    set({ scaleX: newScaleY, scaleY: newScaleY });
                  } else {
                    set({ scaleY: newScaleY });
                  }
                }}
                min={1} step={1}
              />
            </div>
          </div>

          <PropField label="Rotation (°)">
            <NumInput
              value={Math.round(obj.angle || 0)}
              onChange={v => set({ angle: v })}
              min={-360} max={360}
            />
          </PropField>

          <PropField label="">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="checkbox"
                id="lockRatio"
                checked={lockRatio}
                onChange={e => setLockRatio(e.target.checked)}
                style={{ accentColor: GOLD, width: 14, height: 14 }}
              />
              <label htmlFor="lockRatio" style={{ fontFamily: NU, fontSize: 11, color: MUTED, cursor: 'pointer' }}>
                Lock proportions
              </label>
            </div>
          </PropField>

          <Hr />

          {/* Feature D: Ungroup if a group is selected */}
          {isGroup && onUngroup && (
            <>
              <div style={SECTION}>Group</div>
              <div style={{ padding: '4px 16px 12px' }}>
                <button
                  onClick={onUngroup}
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3, color: 'rgba(255,255,255,0.7)',
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    padding: '6px 14px', cursor: 'pointer',
                  }}
                >
                  ⊟ Ungroup
                </button>
              </div>
              <Hr />
            </>
          )}

          {/* Layer */}
          <div style={SECTION}>Layer</div>
          <div style={{ padding: '4px 16px 10px', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <IconBtn onClick={() => { canvas?.bringObjectToFront(obj); onUpdate?.(); }} title="Bring to Front">
              ↑↑ Front
            </IconBtn>
            <IconBtn onClick={() => { canvas?.bringObjectForward(obj); onUpdate?.(); }} title="Bring Forward">
              ↑ Forward
            </IconBtn>
            <IconBtn onClick={() => { canvas?.sendObjectBackwards(obj); onUpdate?.(); }} title="Send Backward">
              ↓ Back
            </IconBtn>
            <IconBtn onClick={() => { canvas?.sendObjectToBack(obj); onUpdate?.(); }} title="Send to Back">
              ↓↓ Bottom
            </IconBtn>
          </div>

          <Hr />

          {/* Actions */}
          <div style={{ padding: '4px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <button
              onClick={handleDuplicate}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 3, color: 'rgba(255,255,255,0.7)',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.06em', textTransform: 'uppercase',
                padding: '7px 0', cursor: 'pointer',
              }}
            >
              ⊞ Duplicate
            </button>

            {!showDeleteConfirm ? (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                style={{
                  background: 'rgba(248,113,113,0.08)',
                  border: '1px solid rgba(248,113,113,0.25)',
                  borderRadius: 3, color: '#f87171',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  padding: '7px 0', cursor: 'pointer',
                }}
              >
                ✕ Delete
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={handleDelete}
                  style={{
                    flex: 1,
                    background: '#f87171',
                    border: 'none',
                    borderRadius: 3, color: '#fff',
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    padding: '7px 0', cursor: 'pointer',
                  }}
                >
                  Confirm Delete
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  style={{
                    flex: 1,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 3, color: MUTED,
                    fontFamily: NU, fontSize: 10, fontWeight: 700,
                    padding: '7px 0', cursor: 'pointer',
                  }}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
