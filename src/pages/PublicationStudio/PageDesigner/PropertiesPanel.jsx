import { useState, useEffect, useCallback } from 'react';
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

export default function PropertiesPanel({ selectedObject, canvas, onUpdate }) {
  const [aiImproveLoading, setAiImproveLoading] = useState(false);
  const [aiRewriteLoading, setAiRewriteLoading] = useState(false);
  const [lockRatio, setLockRatio] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const obj = selectedObject;
  const type = obj?.type || '';
  const isText = type === 'textbox' || type === 'i-text';
  const isImage = type === 'image' || type === 'f-image';
  const isRect = type === 'rect';
  const isCircle = type === 'circle';
  const isShape = isRect || isCircle || type === 'line';

  const set = useCallback((props) => {
    if (!obj || !canvas) return;
    obj.set(props);
    canvas.renderAll();
    onUpdate?.();
  }, [obj, canvas, onUpdate]);

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

  if (!obj) {
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

      {/* Image properties */}
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

          <Hr />
        </>
      )}

      {/* Shape properties */}
      {isShape && (
        <>
          <div style={SECTION}>Shape</div>

          <PropField label="Fill Colour">
            <ColorInput
              value={obj.fill}
              onChange={v => set({ fill: v })}
            />
          </PropField>

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
                const ratio = (obj.height || 1) / (obj.width || 1);
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
    </div>
  );
}
