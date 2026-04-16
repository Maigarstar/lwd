import { useState } from 'react';
import { GOLD, DARK, CARD, BORDER, MUTED, NU } from './designerConstants';
import { PAGE_SIZES } from './designerConstants';

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

export default function DesignerToolbar({
  issue,
  pages,
  currentPageIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  showGrid,
  onToggleGrid,
  showRuler,
  onToggleRuler,
  onSave,
  saving,
  onExportDigital,
  exportingDigital,
  onExportPrint,
  exportingPrint,
  pageSize,
  onPageSizeChange,
}) {
  const [printConfirm, setPrintConfirm] = useState(false);

  const zoomPct = Math.round(zoom * 100);

  function decreaseZoom() {
    const idx = ZOOM_PRESETS.findIndex(z => z >= zoom);
    const prev = idx > 0 ? ZOOM_PRESETS[idx - 1] : ZOOM_PRESETS[0];
    onZoomChange(prev);
  }

  function increaseZoom() {
    const idx = ZOOM_PRESETS.findIndex(z => z > zoom);
    const next = idx >= 0 ? ZOOM_PRESETS[idx] : ZOOM_PRESETS[ZOOM_PRESETS.length - 1];
    onZoomChange(next);
  }

  return (
    <div style={{
      height: 48,
      flexShrink: 0,
      background: '#141210',
      borderBottom: `1px solid ${BORDER}`,
      display: 'flex',
      alignItems: 'center',
      padding: '0 16px',
      gap: 8,
      zIndex: 10,
    }}>
      {/* Left: issue title */}
      <div style={{
        fontFamily: NU,
        fontSize: 11,
        color: MUTED,
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        maxWidth: 180,
        flexShrink: 0,
      }}>
        {issue?.title || 'Untitled Issue'}
      </div>

      <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />

      {/* Center controls */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>

        {/* Undo / Redo */}
        <ToolBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">←</ToolBtn>
        <ToolBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">→</ToolBtn>

        <Sep />

        {/* Grid toggle */}
        <ToolBtn onClick={onToggleGrid} active={showGrid} title="Toggle grid">⊞ Grid</ToolBtn>

        {/* Ruler toggle */}
        <ToolBtn onClick={onToggleRuler} active={showRuler} title="Toggle ruler">⊟ Ruler</ToolBtn>

        <Sep />

        {/* Zoom */}
        <ToolBtn onClick={decreaseZoom} title="Zoom out">−</ToolBtn>
        <select
          value={zoomPct}
          onChange={e => onZoomChange(Number(e.target.value) / 100)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, color: '#fff',
            fontFamily: NU, fontSize: 11,
            padding: '3px 6px', outline: 'none', cursor: 'pointer',
            width: 70,
          }}
        >
          {ZOOM_PRESETS.map(z => (
            <option key={z} value={Math.round(z * 100)}>
              {Math.round(z * 100)}%
            </option>
          ))}
        </select>
        <ToolBtn onClick={increaseZoom} title="Zoom in">+</ToolBtn>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(e.target.value)}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, color: '#fff',
            fontFamily: NU, fontSize: 11,
            padding: '3px 6px', outline: 'none', cursor: 'pointer',
          }}
        >
          {Object.entries(PAGE_SIZES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>

        <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />

        {/* Save */}
        <button
          onClick={onSave}
          disabled={saving}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, color: saving ? GOLD : 'rgba(255,255,255,0.75)',
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '5px 12px', cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : '💾 Save'}
        </button>

        {/* Publish digital */}
        <button
          onClick={onExportDigital}
          disabled={exportingDigital}
          style={{
            background: exportingDigital ? 'rgba(201,169,110,0.2)' : 'rgba(201,169,110,0.12)',
            border: `1px solid ${exportingDigital ? 'rgba(201,169,110,0.3)' : 'rgba(201,169,110,0.35)'}`,
            borderRadius: 3, color: GOLD,
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '5px 12px', cursor: exportingDigital ? 'default' : 'pointer',
          }}
        >
          {exportingDigital ? 'Publishing…' : '▶ Publish Digital'}
        </button>

        {/* Print PDF */}
        <button
          onClick={() => setPrintConfirm(true)}
          disabled={exportingPrint}
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: 3, color: 'rgba(255,255,255,0.7)',
            fontFamily: NU, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.06em', textTransform: 'uppercase',
            padding: '5px 12px', cursor: exportingPrint ? 'default' : 'pointer',
          }}
        >
          {exportingPrint ? 'Exporting…' : '🖨 Export Print'}
        </button>
      </div>

      {/* Print confirm modal */}
      {printConfirm && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
          onClick={() => setPrintConfirm(false)}
        >
          <div
            style={{
              background: '#2A2520',
              border: `1px solid ${BORDER}`,
              borderRadius: 6,
              padding: 28,
              maxWidth: 400,
              width: '90%',
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ fontFamily: NU, fontSize: 13, fontWeight: 700, color: '#fff', marginBottom: 12 }}>
              ⚠ Print Export
            </div>
            <div style={{ fontFamily: NU, fontSize: 12, color: MUTED, lineHeight: 1.6, marginBottom: 20 }}>
              This will generate a high-resolution PDF with 3mm bleed and crop marks.
              Rendering may take 30–60 seconds for long issues.
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setPrintConfirm(false)}
                style={{
                  flex: 1,
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 3, color: MUTED,
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  padding: '8px 0', cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => { setPrintConfirm(false); onExportPrint?.(); }}
                style={{
                  flex: 1,
                  background: GOLD,
                  border: 'none',
                  borderRadius: 3, color: '#1a1208',
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  padding: '8px 0', cursor: 'pointer',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                }}
              >
                Export PDF →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ToolBtn({ children, onClick, disabled, active, title }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: active ? 'rgba(201,169,110,0.15)' : hov && !disabled ? 'rgba(255,255,255,0.06)' : 'none',
        border: `1px solid ${active ? 'rgba(201,169,110,0.35)' : 'rgba(255,255,255,0.08)'}`,
        borderRadius: 3,
        color: active ? GOLD : disabled ? 'rgba(255,255,255,0.2)' : hov ? '#fff' : 'rgba(255,255,255,0.6)',
        fontFamily: NU, fontSize: 11,
        padding: '4px 8px',
        cursor: disabled ? 'default' : 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)' }} />;
}
