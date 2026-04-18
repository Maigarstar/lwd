// ════════════════════════════════════════════════════════════════════════════
// FloatingTextToolbar
// ════════════════════════════════════════════════════════════════════════════
//
// Appears as a fixed-position pill above the selected Fabric textbox.
// Provides instant access to the most common text formatting actions so the
// user never has to look away from the canvas to the Properties panel.
//
// Props:
//   selectedObject  — Fabric Textbox | null
//   getActiveCanvas — () => FabricCanvas — needed to call requestRenderAll()
//   zoom            — current designer zoom (used to compute screen position)
//   dims            — { w, h } page dimensions in px
//   onUpdate        — callback fired after a property change (triggers pushUndo)
//   activeSpreadSide — 'left' | 'right' (to pick the right canvas el for coords)
//   fabricRef        — ref to right/single canvas
//   fabricRefLeft    — ref to left spread canvas
// ════════════════════════════════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { GOLD, DARK, BORDER, MUTED, NU } from './designerConstants';

const BG       = '#1E1B17';
const BTN_H    = '#2A2520';
const RADIUS   = 6;
const TOOLBAR_H = 38;

// Common fonts exposed in the quick-access dropdown
const QUICK_FONTS = [
  'Cormorant Garamond',
  'Jost',
  'Playfair Display',
  'EB Garamond',
  'Libre Baskerville',
  'Montserrat',
  'Lato',
  'Bodoni Moda',
];

export default function FloatingTextToolbar({
  selectedObject,
  getActiveCanvas,
  zoom,
  dims,
  onUpdate,
  activeSpreadSide,
  fabricRef,
  fabricRefLeft,
}) {
  const [pos, setPos]       = useState(null); // { x, y, w } in viewport px
  const [, forceRender]     = useState(0);    // bump to re-read obj props after set

  // ── Compute screen position of the selected object ─────────────────────────
  useEffect(() => {
    const obj = selectedObject;
    if (!obj || obj.type !== 'textbox') { setPos(null); return; }

    // Pick the canvas DOM element based on which side is active
    const fc = activeSpreadSide === 'left' && fabricRefLeft?.current
      ? fabricRefLeft.current
      : fabricRef?.current;
    const canvasEl = fc?.lowerCanvasEl;
    if (!canvasEl) { setPos(null); return; }

    const rect     = canvasEl.getBoundingClientRect();
    const objBounds = obj.getBoundingRect();
    // Canvas DOM width = dims.w * zoom (Fabric sets explicit px width/height)
    const scaleX   = rect.width  / dims.w;
    const scaleY   = rect.height / dims.h;

    const toolbarW = Math.max(340, objBounds.width * scaleX);
    let x = rect.left + objBounds.left * scaleX;
    let y = rect.top  + objBounds.top  * scaleY - TOOLBAR_H - 8;

    // Keep within viewport horizontally
    x = Math.max(8, Math.min(x, window.innerWidth - toolbarW - 8));
    // Flip below object if toolbar would go off the top
    if (y < 8) {
      y = rect.top + (objBounds.top + objBounds.height) * scaleY + 8;
    }

    setPos({ x, y, w: toolbarW });
  }, [selectedObject, zoom, dims, activeSpreadSide, fabricRef, fabricRefLeft]);

  // ── Apply a property change ─────────────────────────────────────────────────
  const set = useCallback((props) => {
    const obj = selectedObject;
    const fc  = getActiveCanvas?.();
    if (!obj || !fc) return;
    obj.set(props);
    fc.requestRenderAll();
    onUpdate?.();
    forceRender(n => n + 1); // re-read updated props
  }, [selectedObject, getActiveCanvas, onUpdate]);

  // ── Nothing to show ────────────────────────────────────────────────────────
  if (!pos || !selectedObject || selectedObject.type !== 'textbox') return null;

  const obj     = selectedObject;
  const isBold  = obj.fontWeight === 'bold' || Number(obj.fontWeight) >= 700;
  const isItal  = obj.fontStyle  === 'italic';
  const isUnder = obj.underline  === true;
  const align   = obj.textAlign  || 'left';
  const fs      = Math.round(obj.fontSize || 16);
  const color   = typeof obj.fill === 'string' ? obj.fill : '#18120A';

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div
      style={{
        position:     'fixed',
        top:          pos.y,
        left:         pos.x,
        width:        pos.w,
        height:       TOOLBAR_H,
        background:   BG,
        border:       `1px solid ${BORDER}`,
        borderRadius: RADIUS,
        display:      'flex',
        alignItems:   'center',
        gap:          2,
        padding:      '0 6px',
        zIndex:       99999,
        boxShadow:    '0 4px 20px rgba(0,0,0,0.5)',
        userSelect:   'none',
        pointerEvents: 'all',
      }}
      // Stop canvas selection from clearing when clicking toolbar
      onMouseDown={e => e.stopPropagation()}
    >
      {/* ── Font family ─────────────────────────────────────────────────── */}
      <select
        value={obj.fontFamily || 'Cormorant Garamond'}
        onChange={e => { set({ fontFamily: e.target.value }); }}
        style={{
          background:   '#252117',
          border:       `1px solid ${BORDER}`,
          borderRadius: 3,
          color:        '#F0EBE0',
          fontFamily:   obj.fontFamily || 'Cormorant Garamond',
          fontSize:     12,
          height:       26,
          padding:      '0 4px',
          outline:      'none',
          cursor:       'pointer',
          maxWidth:     140,
          flexShrink:   0,
        }}
      >
        {QUICK_FONTS.map(f => (
          <option key={f} value={f} style={{ fontFamily: f }}>{f}</option>
        ))}
      </select>

      <Divider />

      {/* ── Font size ───────────────────────────────────────────────────── */}
      <TBtn title="Decrease font size" onClick={() => set({ fontSize: Math.max(6, fs - 1) })}>−</TBtn>
      <input
        type="number"
        value={fs}
        min={6} max={400}
        onChange={e => {
          const v = parseInt(e.target.value, 10);
          if (!isNaN(v) && v >= 6 && v <= 400) set({ fontSize: v });
        }}
        style={{
          width: 38, height: 24, textAlign: 'center',
          background: '#252117', border: `1px solid ${BORDER}`,
          borderRadius: 3, color: '#F0EBE0',
          fontFamily: NU, fontSize: 11, outline: 'none',
        }}
      />
      <TBtn title="Increase font size" onClick={() => set({ fontSize: Math.min(400, fs + 1) })}>+</TBtn>

      <Divider />

      {/* ── Style toggles ───────────────────────────────────────────────── */}
      <TBtn active={isBold}  title="Bold"      onClick={() => set({ fontWeight: isBold  ? '400'    : 'bold'   })}>B</TBtn>
      <TBtn active={isItal}  title="Italic"    onClick={() => set({ fontStyle:  isItal  ? 'normal' : 'italic' })} italic>I</TBtn>
      <TBtn active={isUnder} title="Underline" onClick={() => set({ underline: !isUnder })} underline>U</TBtn>

      <Divider />

      {/* ── Alignment ───────────────────────────────────────────────────── */}
      <TBtn active={align === 'left'}    title="Align left"    onClick={() => set({ textAlign: 'left'    })}>⬤</TBtn>
      <TBtn active={align === 'center'}  title="Align centre"  onClick={() => set({ textAlign: 'center'  })}>⊙</TBtn>
      <TBtn active={align === 'right'}   title="Align right"   onClick={() => set({ textAlign: 'right'   })}>◎</TBtn>
      <TBtn active={align === 'justify'} title="Justify"       onClick={() => set({ textAlign: 'justify' })}>≡</TBtn>

      <Divider />

      {/* ── Text colour ─────────────────────────────────────────────────── */}
      <div
        title="Text colour"
        style={{
          position:     'relative',
          width:        24,
          height:       24,
          borderRadius: 3,
          overflow:     'hidden',
          flexShrink:   0,
          cursor:       'pointer',
        }}
      >
        <div style={{
          position:     'absolute',
          inset:        0,
          background:   color,
          border:       `1px solid ${BORDER}`,
          borderRadius: 3,
          pointerEvents: 'none',
        }} />
        <input
          type="color"
          value={/^#[0-9a-fA-F]{6}$/.test(color) ? color : '#18120A'}
          onChange={e => set({ fill: e.target.value })}
          style={{
            opacity: 0,
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            cursor: 'pointer',
            padding: 0,
            border: 'none',
          }}
        />
      </div>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────────────

function TBtn({ children, active, title, onClick, italic, underline }) {
  return (
    <button
      title={title}
      onClick={onClick}
      style={{
        width:        26,
        height:       26,
        flexShrink:   0,
        background:   active ? 'rgba(201,169,110,0.15)' : 'transparent',
        border:       active ? `1px solid rgba(201,169,110,0.4)` : `1px solid transparent`,
        borderRadius: 3,
        color:        active ? GOLD : 'rgba(240,235,224,0.7)',
        fontFamily:   'Georgia, serif',
        fontSize:     13,
        fontWeight:   'bold',
        fontStyle:    italic  ? 'italic'     : 'normal',
        textDecoration: underline ? 'underline' : 'none',
        cursor:       'pointer',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        transition:   'all 0.1s',
        padding:      0,
        lineHeight:   1,
      }}
    >
      {children}
    </button>
  );
}

function Divider() {
  return (
    <div style={{
      width:      1,
      height:     18,
      background: BORDER,
      margin:     '0 3px',
      flexShrink: 0,
    }} />
  );
}
