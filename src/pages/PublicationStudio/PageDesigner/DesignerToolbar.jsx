import { useState, useEffect, useRef } from 'react';
import { GOLD, BORDER, MUTED, NU } from './designerConstants';
import { PAGE_SIZES } from './designerConstants';

const ZOOM_PRESETS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2];

// ── Relative time formatter ──────────────────────────────────────────────────
function formatSavedAgo(date) {
  if (!date) return null;
  const secs = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (secs < 10)   return 'just now';
  if (secs < 60)   return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60)   return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)    return `${hrs}h ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function useSavedAgo(date) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!date) return;
    const id = setInterval(() => tick(t => t + 1), 30000);
    return () => clearInterval(id);
  }, [date]);
  return formatSavedAgo(date);
}

// ── Shared style helpers ─────────────────────────────────────────────────────
const popoverLabelStyle = {
  display: 'block',
  fontFamily: NU,
  fontSize: 10,
  color: 'rgba(255,255,255,0.5)',
  marginBottom: 3,
  marginTop: 10,
};
const popoverInputStyle = {
  width: '100%',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 3,
  color: '#fff',
  fontFamily: NU,
  fontSize: 11,
  padding: '5px 8px',
  outline: 'none',
};
const popoverSelectStyle = { ...popoverInputStyle, cursor: 'pointer' };

// ── Sub-components ───────────────────────────────────────────────────────────
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
        lineHeight: 1,
      }}
    >
      {children}
    </button>
  );
}

function Sep() {
  return <div style={{ width: 1, height: 20, background: 'rgba(255,255,255,0.1)', flexShrink: 0 }} />;
}

// Dropdown chevron button that opens a popover panel
function DropBtn({ label, active, children, align = 'left', minWidth = 220 }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', flexShrink: 0 }}>
      <button
        onClick={() => setOpen(v => !v)}
        style={{
          background: open || active ? 'rgba(201,169,110,0.12)' : 'none',
          border: `1px solid ${open || active ? 'rgba(201,169,110,0.3)' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 3,
          color: open || active ? GOLD : 'rgba(255,255,255,0.6)',
          fontFamily: NU, fontSize: 11,
          padding: '4px 9px',
          cursor: 'pointer',
          transition: 'all 0.12s',
          whiteSpace: 'nowrap',
          display: 'flex', alignItems: 'center', gap: 4,
          lineHeight: 1,
        }}
      >
        {label}
        <span style={{ fontSize: 7, opacity: 0.6, lineHeight: 1 }}>▾</span>
      </button>
      {open && (
        <div
          onClick={e => e.stopPropagation()}
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            zIndex: 400,
            background: '#1E1B16',
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            padding: '8px 0',
            minWidth,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
        >
          {/* Inject close function via context trick — pass setOpen via render prop */}
          {typeof children === 'function' ? children(() => setOpen(false)) : children}
        </div>
      )}
    </div>
  );
}

// Menu row inside a dropdown
function MenuItem({ icon, label, active, onClick, hint, disabled }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 8,
        width: '100%', padding: '7px 14px',
        background: hov && !disabled ? 'rgba(255,255,255,0.05)' : 'none',
        border: 'none', cursor: disabled ? 'default' : 'pointer',
        textAlign: 'left',
      }}
    >
      <span style={{ width: 16, textAlign: 'center', fontSize: 11, color: active ? GOLD : 'rgba(255,255,255,0.45)', flexShrink: 0 }}>
        {icon}
      </span>
      <span style={{ flex: 1 }}>
        <span style={{ fontFamily: NU, fontSize: 11, color: disabled ? 'rgba(255,255,255,0.2)' : active ? GOLD : '#fff', fontWeight: active ? 700 : 400, letterSpacing: '0.02em' }}>
          {label}
        </span>
        {hint && (
          <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, letterSpacing: '0.04em', marginLeft: 6, opacity: 0.7 }}>
            {hint}
          </span>
        )}
      </span>
      {active && <span style={{ fontSize: 10, color: GOLD }}>✓</span>}
    </button>
  );
}

function MenuDivider() {
  return <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />;
}

function MenuLabel({ children }) {
  return (
    <div style={{
      padding: '6px 14px 3px',
      fontFamily: NU, fontSize: 8, fontWeight: 700,
      color: GOLD, letterSpacing: '0.14em', textTransform: 'uppercase',
    }}>
      {children}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function DesignerToolbar({
  onBack,
  issue,
  pages,
  currentPageIndex,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  zoom,
  onZoomChange,
  onFitPage,
  showGrid,
  onToggleGrid,
  snapToGrid,
  onToggleSnap,
  showRuler,
  onToggleRuler,
  showBleed,
  onToggleBleed,
  lightsOff,
  onToggleLightsOff,
  spreadView,
  onToggleSpread,
  onSpreadPreview,
  onSave,
  saving,
  lastSaved,
  isDirty,
  onExportDigital,
  exportingDigital,
  publishProgress,
  onExportScreen,
  exportingScreen,
  onExportPrint,
  exportingPrint,
  pageSize,
  onPageSizeChange,
  currentDims,
  hasGuides,
  onClearGuides,
  pageNumberSettings,
  onPageNumSettingsChange,
  onApplyPageNumbers,
  onBrandKit,
  brandPrimaryColor,
  onSmartFill,
  onAIBuild,
  onVoice,
  onSlot,
  currentSlot,
  pageBg,
  onPageBgChange,
  onFillSlots,
  onArticleReflow,
}) {
  const [printConfirm, setPrintConfirm] = useState(false);
  const [showPageNumPopover, setShowPageNumPopover] = useState(false);
  const pageBgInputRef = useRef(null);
  const savedAgo = useSavedAgo(lastSaved);
  const zoomPct = Math.round(zoom * 100);

  const anyViewActive = showGrid || snapToGrid || showRuler || showBleed || lightsOff || spreadView;

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
    <>
      <div style={{
        height: 48,
        flexShrink: 0,
        background: '#0E0D0B',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        padding: '0 12px',
        gap: 6,
        zIndex: 10,
        overflow: 'visible',
      }}>

        {/* ── LEFT: Brand + nav ──────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {/* Back button */}
          {onBack && (
            <button
              onClick={onBack}
              title="Back to issues list"
              style={{
                background: 'none', border: 'none',
                color: MUTED, cursor: 'pointer',
                padding: '0 4px 0 0',
                display: 'flex', alignItems: 'center', gap: 3,
                fontFamily: NU, fontSize: 10, fontWeight: 600,
                letterSpacing: '0.04em', flexShrink: 0,
              }}
            >
              ← Issues
            </button>
          )}
          {onBack && <Sep />}

          <Sep />

          {/* Issue title */}
          <div style={{
            fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.5)',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
            maxWidth: 160, flexShrink: 0,
          }}>
            {issue?.title || 'Untitled Issue'}
          </div>
        </div>

        {/* ── CENTER: Tools ─────────────────────────────────────────────── */}
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, minWidth: 0 }}>

          {/* Undo / Redo */}
          <ToolBtn onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">⟵</ToolBtn>
          <ToolBtn onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">⟶</ToolBtn>

          <Sep />

          {/* Smart Fill — primary creation tool */}
          <button
            onClick={onSmartFill}
            title="Auto-build a page from a venue, article or showcase"
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.14)',
              borderRadius: 3, color: 'rgba(255,255,255,0.85)',
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '5px 11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 4,
              whiteSpace: 'nowrap',
            }}
          >
            ✦ Smart Fill
          </button>

          {/* AI Build */}
          <button
            onClick={onAIBuild}
            title="AI Issue Builder — generate a full magazine issue structure"
            style={{
              background: 'rgba(201,169,110,0.1)',
              border: '1px solid rgba(201,169,110,0.35)',
              borderRadius: 3, color: GOLD,
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '5px 11px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            ✦ AI Build
          </button>

          {/* Voice Training */}
          {onVoice && (
            <button
              onClick={onVoice}
              title="Train AI editorial voice — tone, rules, avoid words"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3, color: 'rgba(255,255,255,0.65)',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '5px 11px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ✎ Voice
            </button>
          )}

          {/* Brand Kit */}
          <button
            onClick={onBrandKit}
            title="Open Brand Kit"
            style={{
              background: brandPrimaryColor
                ? `rgba(${parseInt(brandPrimaryColor.slice(1,3),16)},${parseInt(brandPrimaryColor.slice(3,5),16)},${parseInt(brandPrimaryColor.slice(5,7),16)},0.12)`
                : 'rgba(201,169,110,0.07)',
              border: `1px solid ${brandPrimaryColor ? brandPrimaryColor + '55' : 'rgba(201,169,110,0.25)'}`,
              borderRadius: 3,
              color: brandPrimaryColor || GOLD,
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '5px 11px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 5,
              whiteSpace: 'nowrap',
            }}
          >
            <span style={{
              width: 9, height: 9, borderRadius: '50%',
              background: brandPrimaryColor || GOLD,
              display: 'inline-block', flexShrink: 0,
            }} />
            Brand
          </button>

          {/* Fill Slots — P9a */}
          {onFillSlots && (
            <button
              onClick={onFillSlots}
              title="Fill all image slots across every page"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3, color: 'rgba(255,255,255,0.65)',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '5px 11px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⬡ Fill Slots
            </button>
          )}

          {/* Article Reflow — P9c */}
          {onArticleReflow && (
            <button
              onClick={onArticleReflow}
              title="Import an article and reflow text into magazine pages"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3, color: 'rgba(255,255,255,0.65)',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '5px 11px', cursor: 'pointer',
                whiteSpace: 'nowrap',
              }}
            >
              ⤴ Reflow
            </button>
          )}

          {/* Page Slot */}
          <button
            onClick={onSlot}
            title="Assign a vendor page slot to this page"
            style={{
              background: currentSlot ? 'rgba(201,169,110,0.15)' : 'rgba(255,255,255,0.05)',
              border: `1px solid ${currentSlot ? 'rgba(201,169,110,0.45)' : 'rgba(255,255,255,0.12)'}`,
              borderRadius: 3,
              color: currentSlot ? GOLD : 'rgba(255,255,255,0.6)',
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '5px 11px', cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {currentSlot ? '◆ Slot ✓' : '◆ Slot'}
          </button>

          <Sep />

          {/* Zoom */}
          <ToolBtn onClick={decreaseZoom} title="Zoom out">−</ToolBtn>
          <select
            value={zoomPct}
            onChange={e => onZoomChange(Number(e.target.value) / 100)}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3, color: 'rgba(255,255,255,0.7)',
              fontFamily: NU, fontSize: 11,
              padding: '3px 4px', outline: 'none', cursor: 'pointer',
              width: 62,
            }}
          >
            {ZOOM_PRESETS.map(z => (
              <option key={z} value={Math.round(z * 100)} style={{ background: '#1A1712', color: '#fff' }}>
                {Math.round(z * 100)}%
              </option>
            ))}
          </select>
          <ToolBtn onClick={increaseZoom} title="Zoom in">+</ToolBtn>
          {onFitPage && <ToolBtn onClick={onFitPage} title="Fit page to screen">⊡</ToolBtn>}

          <Sep />

          {/* ── VIEW dropdown ───────────────────────────────────────────── */}
          <DropBtn label="View" active={anyViewActive} align="left" minWidth={230}>
            {(close) => (
              <>
                <MenuLabel>Canvas</MenuLabel>
                <MenuItem icon="⊞" label="Grid"       active={showGrid}   onClick={() => { onToggleGrid?.(); }}   />
                <MenuItem icon="⊹" label="Snap to Grid" active={snapToGrid} onClick={() => { onToggleSnap?.(); }}   hint="Ctrl+Shift+;" />
                <MenuItem icon="⊟" label="Ruler"      active={showRuler}  onClick={() => { onToggleRuler?.(); }}  />
                <MenuItem icon="⊞" label="Bleed + Safe Zone" active={showBleed} onClick={() => { onToggleBleed?.(); }} />
                <MenuItem icon="⊘" label="Clear Guides" disabled={!hasGuides} onClick={() => { onClearGuides?.(); close(); }} />

                <MenuDivider />
                <MenuLabel>View Mode</MenuLabel>
                <MenuItem icon="◎" label={lightsOff ? 'Lights On' : 'Lights Off'} active={lightsOff} onClick={() => { onToggleLightsOff?.(); }} hint="Focus mode" />
                <MenuItem icon="⊠" label="Spread View" active={spreadView} onClick={() => { onToggleSpread?.(); }} />
                <MenuItem icon="◫" label="Spread Preview" onClick={() => { onSpreadPreview?.(); close(); }} hint="Read-only render" />

                <MenuDivider />
                <MenuLabel>Page</MenuLabel>

                {/* Page size inline select */}
                {onPageSizeChange && PAGE_SIZES && (
                  <div style={{ padding: '4px 14px 6px' }}>
                    <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 4 }}>Page Size</div>
                    <select
                      value={pageSize || 'A4'}
                      onChange={e => onPageSizeChange(e.target.value)}
                      style={{ ...popoverSelectStyle, marginTop: 0 }}
                    >
                      <optgroup label="Portrait" style={{ background: '#1A1712' }}>
                        {Object.entries(PAGE_SIZES)
                          .filter(([, v]) => v.orientation === 'portrait' || v.orientation === 'square')
                          .map(([key, val]) => (
                            <option key={key} value={key} style={{ background: '#1A1712', color: '#fff' }}>
                              {val.label || key}
                            </option>
                          ))}
                      </optgroup>
                      <optgroup label="Landscape" style={{ background: '#1A1712' }}>
                        {Object.entries(PAGE_SIZES)
                          .filter(([, v]) => v.orientation === 'landscape')
                          .map(([key, val]) => (
                            <option key={key} value={key} style={{ background: '#1A1712', color: '#fff' }}>
                              {val.label || key}
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>
                )}

                {/* Page background colour */}
                {onPageBgChange && (
                  <div style={{ padding: '4px 14px 6px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>Page Background</span>
                    <button
                      title="Page background colour"
                      onClick={() => pageBgInputRef.current?.click()}
                      style={{
                        width: 20, height: 20,
                        background: pageBg || '#ffffff',
                        border: `1px solid ${BORDER}`,
                        borderRadius: 2,
                        cursor: 'pointer', padding: 0, flexShrink: 0,
                      }}
                    />
                    <input
                      ref={pageBgInputRef}
                      type="color"
                      value={pageBg || '#ffffff'}
                      onChange={e => onPageBgChange(e.target.value)}
                      style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', width: 0, height: 0 }}
                      tabIndex={-1}
                    />
                  </div>
                )}

                {/* Page numbering — opens its own sub-section */}
                {pageNumberSettings && (
                  <div style={{ padding: '4px 14px 6px' }}>
                    <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 4 }}>Page Numbering</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div>
                        <div style={{ ...popoverLabelStyle, marginTop: 0 }}>Format</div>
                        <select value={pageNumberSettings.format} onChange={e => onPageNumSettingsChange({ ...pageNumberSettings, format: e.target.value })} style={popoverSelectStyle}>
                          <option value="arabic">1, 2, 3 (Arabic)</option>
                          <option value="roman">i, ii, iii (Roman)</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ flex: 1 }}>
                          <div style={popoverLabelStyle}>Prefix</div>
                          <input value={pageNumberSettings.prefix} onChange={e => onPageNumSettingsChange({ ...pageNumberSettings, prefix: e.target.value })} placeholder="e.g. — " style={popoverInputStyle} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={popoverLabelStyle}>Suffix</div>
                          <input value={pageNumberSettings.suffix} onChange={e => onPageNumSettingsChange({ ...pageNumberSettings, suffix: e.target.value })} placeholder="e.g. —" style={popoverInputStyle} />
                        </div>
                      </div>
                      <div>
                        <div style={popoverLabelStyle}>Start from</div>
                        <input type="number" min={1} value={pageNumberSettings.startFrom} onChange={e => onPageNumSettingsChange({ ...pageNumberSettings, startFrom: parseInt(e.target.value) || 1 })} style={{ ...popoverInputStyle, width: 80 }} />
                      </div>
                      <label style={{ ...popoverLabelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                        <input type="checkbox" checked={pageNumberSettings.excludeCover} onChange={e => onPageNumSettingsChange({ ...pageNumberSettings, excludeCover: e.target.checked })} />
                        No number on cover
                      </label>
                      <label style={{ ...popoverLabelStyle, display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                        <input type="checkbox" checked={pageNumberSettings.excludeBackCover} onChange={e => onPageNumSettingsChange({ ...pageNumberSettings, excludeBackCover: e.target.checked })} />
                        No number on back cover
                      </label>
                      <button
                        onClick={() => { onApplyPageNumbers?.(); close(); }}
                        style={{
                          marginTop: 8, width: '100%',
                          background: 'rgba(201,169,110,0.15)',
                          border: '1px solid rgba(201,169,110,0.4)',
                          borderRadius: 3, color: GOLD,
                          fontFamily: NU, fontSize: 10, fontWeight: 700,
                          letterSpacing: '0.06em', textTransform: 'uppercase',
                          padding: '7px 0', cursor: 'pointer',
                        }}
                      >
                        ✦ Apply to All Pages
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </DropBtn>

          {/* ── EXPORT dropdown ─────────────────────────────────────────── */}
          <DropBtn label="Export" active={false} align="left" minWidth={200}>
            {(close) => (
              <>
                <MenuLabel>Download</MenuLabel>
                <MenuItem
                  icon="↓"
                  label="PDF (Screen)"
                  hint={exportingScreen ? 'Exporting…' : undefined}
                  disabled={exportingScreen}
                  onClick={() => { onExportScreen?.(); close(); }}
                />
                <MenuItem
                  icon="🖨"
                  label="PDF (Print-ready)"
                  hint="3mm bleed + crop marks"
                  disabled={exportingPrint}
                  onClick={() => { setPrintConfirm(true); close(); }}
                />
              </>
            )}
          </DropBtn>
        </div>

        {/* ── RIGHT: Workflow actions ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <Sep />

          {/* Save + timestamp */}
          <button
            onClick={onSave}
            disabled={saving}
            title="Save (Ctrl+S)"
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 3,
              color: saving ? GOLD : isDirty ? 'rgba(255,255,255,0.85)' : 'rgba(255,255,255,0.45)',
              fontFamily: NU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.05em', textTransform: 'uppercase',
              padding: '5px 11px', cursor: saving ? 'default' : 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {saving ? '⋯ Saving' : isDirty ? '💾 Save' : '✓ Saved'}
          </button>

          {/* Saved-ago / unsaved indicator — small, unobtrusive */}
          {savedAgo && !saving && (
            <span
              title={lastSaved ? `Last saved ${lastSaved.toLocaleString('en-GB')}` : ''}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 500,
                letterSpacing: '0.04em', textTransform: 'uppercase',
                color: isDirty ? 'rgba(201,169,110,0.6)' : 'rgba(255,255,255,0.3)',
                whiteSpace: 'nowrap', userSelect: 'none',
              }}
            >
              {isDirty ? '●' : savedAgo}
            </span>
          )}

          <Sep />

          {/* PUBLISH — primary CTA, always visible */}
          <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column' }}>
            <button
              onClick={onExportDigital}
              disabled={exportingDigital}
              title="Publish issue to the live flipbook reader"
              style={{
                background: exportingDigital ? 'rgba(201,169,110,0.25)' : `linear-gradient(135deg, rgba(201,169,110,0.22) 0%, rgba(201,169,110,0.14) 100%)`,
                border: `1px solid ${exportingDigital ? 'rgba(201,169,110,0.4)' : 'rgba(201,169,110,0.55)'}`,
                borderRadius: 3, color: GOLD,
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.07em', textTransform: 'uppercase',
                padding: '5px 14px', cursor: exportingDigital ? 'default' : 'pointer',
                minWidth: 130, whiteSpace: 'nowrap',
              }}
            >
              {exportingDigital && publishProgress
                ? `▶ ${publishProgress.current}/${publishProgress.total} Publishing…`
                : exportingDigital
                ? '▶ Publishing…'
                : (issue?.render_version ? '↻ Republish' : '▶ Publish')}
            </button>
            {exportingDigital && publishProgress && publishProgress.total > 0 && (
              <div style={{
                position: 'absolute', bottom: -4, left: 0, right: 0,
                height: 2, background: 'rgba(201,169,110,0.15)', borderRadius: 1, overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${(publishProgress.current / publishProgress.total) * 100}%`,
                  background: GOLD, borderRadius: 1, transition: 'width 0.3s ease',
                }} />
              </div>
            )}
          </div>

          {/* PREVIEW — draft reader */}
          {issue?.slug && (
            <a
              href={`/publications/${issue.slug}?preview=1`}
              target="_blank"
              rel="noopener noreferrer"
              title="Preview in flipbook reader (draft mode)"
              style={{
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 3,
                color: 'rgba(255,255,255,0.55)',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '5px 11px',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                whiteSpace: 'nowrap',
              }}
            >
              ⬡ Preview
            </a>
          )}

          {/* LIVE — green pill; only when published */}
          {issue?.render_version && issue?.slug && !exportingDigital && (
            <a
              href={`/publications/${issue.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="Open live flipbook reader"
              style={{
                background: 'rgba(52,211,153,0.1)',
                border: '1px solid rgba(52,211,153,0.45)',
                borderRadius: 3,
                color: '#34d399',
                fontFamily: NU, fontSize: 10, fontWeight: 700,
                letterSpacing: '0.05em', textTransform: 'uppercase',
                padding: '5px 11px',
                textDecoration: 'none',
                display: 'inline-flex', alignItems: 'center', gap: 4,
                whiteSpace: 'nowrap',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.18)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.65)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(52,211,153,0.1)'; e.currentTarget.style.borderColor = 'rgba(52,211,153,0.45)'; }}
            >
              ● Live ↗
            </a>
          )}
        </div>
      </div>

      {/* ── Print confirm modal ──────────────────────────────────────────────── */}
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
              background: '#2A2520', border: `1px solid ${BORDER}`,
              borderRadius: 6, padding: 28, maxWidth: 400, width: '90%',
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
                  flex: 1, background: 'rgba(255,255,255,0.06)',
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
                  flex: 1, background: GOLD, border: 'none',
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
    </>
  );
}
