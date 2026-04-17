// ── SpreadPreviewModal.jsx ────────────────────────────────────────────────────
// Clean read-only spread preview — renders pages as static images, no Fabric
// editing handles, realistic book spine, gutter safe-zone overlay, keyboard nav.
//
// Spread pairing matches getSpreadIndices() in PageDesigner.jsx:
//   Spread 0: cover alone (centred, no left page)
//   Spread 1: pages 2–3  (leftIndex=1, rightIndex=2)
//   Spread 2: pages 4–5  …
//
// Rendering: offscreen Fabric canvas → full-resolution JPEG data URL → <img>
// scaled by CSS. Both pages are rendered in parallel for speed.

import { useState, useEffect, useCallback, useRef } from 'react';

const GOLD  = '#C9A84C';
const NU    = "'Jost', sans-serif";
const GD    = "'Cormorant Garamond', Georgia, serif";
const SPINE = 14; // px — book spine width

// ── Spread list ───────────────────────────────────────────────────────────────
// Returns array of { leftIndex, rightIndex } for every spread in the issue.
function buildSpreads(totalPages) {
  if (totalPages === 0) return [];
  const out = [{ leftIndex: null, rightIndex: 0 }]; // cover — always alone
  for (let i = 1; i < totalPages; i += 2) {
    out.push({
      leftIndex:  i,
      rightIndex: i + 1 < totalPages ? i + 1 : null,
    });
  }
  return out;
}

// ── Offscreen page renderer ───────────────────────────────────────────────────
// Renders a page's canvasJSON into a JPEG data URL using an offscreen Fabric
// instance. Returns null for blank pages (no JSON). Never throws.
async function renderPage(canvasJSON, dims) {
  try {
    const { Canvas: FC, FabricObject } = await import('fabric');
    // Ensure origin matches the rest of the studio
    FabricObject.ownDefaults.originX = 'left';
    FabricObject.ownDefaults.originY = 'top';

    const el  = document.createElement('canvas');
    el.width  = dims.w;
    el.height = dims.h;

    const fc = new FC(el, {
      width:                dims.w,
      height:               dims.h,
      enableRetinaScaling:  false,
      renderOnAddRemove:    false,
    });
    fc.backgroundColor = '#ffffff';

    if (canvasJSON) {
      await fc.loadFromJSON(canvasJSON);
      fc.renderAll();
    } else {
      fc.renderAll();
    }

    // Give Fabric a tick to finish async image loading
    await new Promise(r => setTimeout(r, 60));
    fc.renderAll();

    const dataUrl = el.toDataURL('image/jpeg', 0.93);
    fc.dispose();
    return dataUrl;
  } catch (err) {
    console.warn('[SpreadPreview] render failed:', err);
    return null;
  }
}

// ── Nav button ────────────────────────────────────────────────────────────────
function NavBtn({ onClick, disabled, children, title }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        background:  disabled ? 'transparent' : 'rgba(255,255,255,0.06)',
        border:      `1px solid ${disabled ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.18)'}`,
        color:       disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
        fontFamily:  NU,
        fontSize:    18,
        lineHeight:  1,
        width:       36,
        height:      36,
        borderRadius: 4,
        cursor:      disabled ? 'default' : 'pointer',
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
        transition:  'background 0.15s, color 0.15s',
        flexShrink:  0,
      }}
    >
      {children}
    </button>
  );
}

// ── Page image slot ───────────────────────────────────────────────────────────
// Renders one side of the spread (left or right). Shows a loading skeleton
// while the page renders. `isCoverBlank` = left side of cover spread.
function PageSlot({ dataUrl, loading, isCoverBlank, pageNumber, dims, showGutter, gutterSide }) {
  const GUTTER_PCT = `${((5 / (dims.mmW || 210)) * 100).toFixed(2)}%`; // 5mm in %

  if (isCoverBlank) {
    // Dark void to the left of the cover — looks like the back of the previous page
    return (
      <div style={{
        aspectRatio: `${dims.w} / ${dims.h}`,
        height:      '100%',
        background:  'linear-gradient(to right, #0A0908 0%, #1A1714 100%)',
        flexShrink:  0,
        display:     'flex',
        alignItems:  'center',
        justifyContent: 'center',
      }}>
        <span style={{
          fontFamily:    NU,
          fontSize:      9,
          color:         'rgba(255,255,255,0.1)',
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          userSelect:    'none',
        }}>
          Back cover
        </span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height: '100%', flexShrink: 0, aspectRatio: `${dims.w} / ${dims.h}` }}>
      {loading ? (
        // Loading skeleton — pulsing gold shimmer
        <div style={{
          width: '100%', height: '100%',
          background: 'linear-gradient(90deg, #1a1814 0%, #2a2520 50%, #1a1814 100%)',
          backgroundSize: '200% 100%',
          animation: 'spreadShimmer 1.4s ease infinite',
        }} />
      ) : dataUrl ? (
        <img
          src={dataUrl}
          alt={`Page ${pageNumber}`}
          draggable={false}
          style={{
            width:    '100%',
            height:   '100%',
            objectFit: 'fill',
            display:  'block',
            userSelect: 'none',
          }}
        />
      ) : (
        // Blank page — white placeholder
        <div style={{ width: '100%', height: '100%', background: '#fff' }} />
      )}

      {/* Gutter safe-zone overlay (5mm from inner edge) */}
      {showGutter && !loading && (
        <div style={{
          position:  'absolute',
          top:       0,
          bottom:    0,
          [gutterSide]: 0,
          width:     GUTTER_PCT,
          background: 'rgba(220, 60, 60, 0.07)',
          borderRight: gutterSide === 'right' ? '1px dashed rgba(220,60,60,0.4)' : 'none',
          borderLeft:  gutterSide === 'left'  ? '1px dashed rgba(220,60,60,0.4)' : 'none',
          pointerEvents: 'none',
        }}>
          {/* Label on the gutter overlay */}
          <span style={{
            position:  'absolute',
            top:       '50%',
            [gutterSide === 'right' ? 'right' : 'left']: 3,
            transform: 'translateY(-50%) rotate(-90deg)',
            fontFamily: NU,
            fontSize:  7,
            fontWeight: 700,
            color:     'rgba(220,60,60,0.55)',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            userSelect: 'none',
            pointerEvents: 'none',
          }}>
            5mm safe
          </span>
        </div>
      )}

      {/* Page number label */}
      {pageNumber != null && !loading && (
        <div style={{
          position:  'absolute',
          bottom:    8,
          [gutterSide === 'right' ? 'left' : 'right']: 10,
          fontFamily: NU,
          fontSize:  9,
          color:     'rgba(0,0,0,0.35)',
          letterSpacing: '0.1em',
          userSelect: 'none',
          pointerEvents: 'none',
          mixBlendMode: 'multiply',
        }}>
          {pageNumber}
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export default function SpreadPreviewModal({ pages, dims, startPageIndex, onClose }) {
  const spreads    = buildSpreads(pages.length);
  const totalSpreads = spreads.length;

  // Which spread is being viewed (0-based)
  const [spreadIdx, setSpreadIdx]   = useState(() => {
    const idx = spreads.findIndex(
      s => s.leftIndex === startPageIndex || s.rightIndex === startPageIndex
    );
    return idx >= 0 ? idx : 0;
  });

  // Rendered image state
  const [leftUrl,  setLeftUrl]    = useState(null);
  const [rightUrl, setRightUrl]   = useState(null);
  const [rendering, setRendering] = useState(false);

  // UI state
  const [showGutter, setShowGutter] = useState(true);

  const cancelRef = useRef(false);

  // ── Render both pages whenever spreadIdx changes ──────────────────────────
  useEffect(() => {
    cancelRef.current = false;
    setRendering(true);
    setLeftUrl(null);
    setRightUrl(null);

    const { leftIndex, rightIndex } = spreads[spreadIdx] || {};

    const leftJson  = leftIndex  != null ? (pages[leftIndex]?.canvasJSON  ?? null) : null;
    const rightJson = rightIndex != null ? (pages[rightIndex]?.canvasJSON ?? null) : null;

    const leftTask  = leftIndex  != null ? renderPage(leftJson,  dims) : Promise.resolve(null);
    const rightTask = rightIndex != null ? renderPage(rightJson, dims) : Promise.resolve(null);

    Promise.all([leftTask, rightTask]).then(([l, r]) => {
      if (cancelRef.current) return;
      setLeftUrl(l);
      setRightUrl(r);
      setRendering(false);
    });

    return () => { cancelRef.current = true; };
  }, [spreadIdx]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Keyboard navigation ───────────────────────────────────────────────────
  const goNext = useCallback(() => setSpreadIdx(i => Math.min(i + 1, totalSpreads - 1)), [totalSpreads]);
  const goPrev = useCallback(() => setSpreadIdx(i => Math.max(i - 1, 0)), []);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape')      onClose();
      if (e.key === 'ArrowRight')  goNext();
      if (e.key === 'ArrowLeft')   goPrev();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose, goNext, goPrev]);

  const { leftIndex, rightIndex } = spreads[spreadIdx] || {};
  const isCover   = spreadIdx === 0;
  const leftPage  = leftIndex  != null ? pages[leftIndex]  : null;
  const rightPage = rightIndex != null ? pages[rightIndex] : null;

  // Spread label for header
  const spreadLabel = isCover
    ? 'Cover'
    : leftPage && rightPage
      ? `Pages ${leftIndex + 1} – ${rightIndex + 1}`
      : leftPage
        ? `Page ${leftIndex + 1}`
        : `Page ${rightIndex + 1}`;

  return (
    <div
      style={{
        position:  'fixed',
        inset:     0,
        zIndex:    9999,
        background: 'rgba(6,5,4,0.98)',
        display:   'flex',
        flexDirection: 'column',
        userSelect: 'none',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <style>{`
        @keyframes spreadShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spreadFadeIn {
          from { opacity: 0; transform: scale(0.985); }
          to   { opacity: 1; transform: scale(1); }
        }
      `}</style>

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height:     52,
        padding:    '0 20px',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
        gap:        12,
      }}>
        {/* Left: nav + label */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <NavBtn onClick={goPrev} disabled={spreadIdx === 0} title="Previous spread (←)">‹</NavBtn>
          <NavBtn onClick={goNext} disabled={spreadIdx >= totalSpreads - 1} title="Next spread (→)">›</NavBtn>

          <div style={{
            fontFamily:    GD,
            fontSize:      15,
            fontStyle:     'italic',
            color:         'rgba(255,255,255,0.7)',
            letterSpacing: '0.01em',
            marginLeft:    4,
          }}>
            {spreadLabel}
          </div>
          <div style={{
            fontFamily:    NU,
            fontSize:      10,
            color:         'rgba(255,255,255,0.25)',
            letterSpacing: '0.08em',
          }}>
            Spread {spreadIdx + 1} of {totalSpreads}
          </div>
        </div>

        {/* Right: gutter toggle + close */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <button
            onClick={() => setShowGutter(v => !v)}
            style={{
              background:   showGutter ? 'rgba(220,60,60,0.12)' : 'rgba(255,255,255,0.05)',
              border:       `1px solid ${showGutter ? 'rgba(220,60,60,0.35)' : 'rgba(255,255,255,0.12)'}`,
              color:        showGutter ? 'rgba(220,80,80,0.9)' : 'rgba(255,255,255,0.4)',
              fontFamily:   NU,
              fontSize:     10,
              fontWeight:   700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding:      '6px 12px',
              borderRadius: 3,
              cursor:       'pointer',
            }}
          >
            {showGutter ? '◉ Gutter guide' : '◎ Gutter guide'}
          </button>

          <button
            onClick={onClose}
            style={{
              background:   'rgba(255,255,255,0.05)',
              border:       '1px solid rgba(255,255,255,0.12)',
              color:        'rgba(255,255,255,0.55)',
              fontFamily:   NU,
              fontSize:     10,
              fontWeight:   700,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
              padding:      '6px 14px',
              borderRadius: 3,
              cursor:       'pointer',
            }}
          >
            ✕ Close
          </button>
        </div>
      </div>

      {/* ── Spread canvas area ────────────────────────────────────────────── */}
      <div style={{
        flex:    1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        overflow: 'hidden',
        minHeight: 0,
      }}>
        {isCover ? (
          // ── Cover: centred single page ─────────────────────────────────────
          <div style={{
            height:    'calc(100vh - 172px)',
            aspectRatio: `${dims.w} / ${dims.h}`,
            boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.5)',
            animation: rendering ? 'none' : 'spreadFadeIn 0.3s ease',
          }}>
            <PageSlot
              dataUrl={rightUrl}
              loading={rendering}
              isCoverBlank={false}
              pageNumber={1}
              dims={dims}
              showGutter={false}
              gutterSide="right"
            />
          </div>
        ) : (
          // ── Double-page spread ─────────────────────────────────────────────
          <div style={{
            display:  'flex',
            height:   'calc(100vh - 172px)',
            boxShadow: '0 32px 80px rgba(0,0,0,0.75), 0 8px 24px rgba(0,0,0,0.5)',
            animation: rendering ? 'none' : 'spreadFadeIn 0.3s ease',
          }}>
            {/* Left page */}
            <PageSlot
              dataUrl={leftUrl}
              loading={rendering}
              isCoverBlank={false}
              pageNumber={leftIndex != null ? leftIndex + 1 : null}
              dims={dims}
              showGutter={showGutter}
              gutterSide="right"
            />

            {/* Book spine */}
            <div style={{
              width:     SPINE,
              flexShrink: 0,
              background: [
                'linear-gradient(to right,',
                '  rgba(0,0,0,0.7) 0%,',
                '  rgba(0,0,0,0.2) 30%,',
                '  rgba(255,255,255,0.04) 50%,',
                '  rgba(0,0,0,0.2) 70%,',
                '  rgba(0,0,0,0.7) 100%)',
              ].join(''),
              boxShadow: 'inset 3px 0 6px rgba(0,0,0,0.5), inset -3px 0 6px rgba(0,0,0,0.5)',
            }} />

            {/* Right page */}
            <PageSlot
              dataUrl={rightUrl}
              loading={rendering}
              isCoverBlank={rightIndex == null}
              pageNumber={rightIndex != null ? rightIndex + 1 : null}
              dims={dims}
              showGutter={showGutter}
              gutterSide="left"
            />
          </div>
        )}
      </div>

      {/* ── Bottom hint bar ───────────────────────────────────────────────── */}
      <div style={{
        height:     36,
        display:    'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap:        24,
        flexShrink: 0,
        borderTop:  '1px solid rgba(255,255,255,0.05)',
      }}>
        {[
          ['←  →', 'Navigate spreads'],
          ['Esc',  'Close preview'],
        ].map(([key, label]) => (
          <span key={key} style={{
            fontFamily:    NU,
            fontSize:      9,
            color:         'rgba(255,255,255,0.2)',
            letterSpacing: '0.08em',
          }}>
            <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 6 }}>{key}</span>
            {label}
          </span>
        ))}

        {showGutter && (
          <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(220,60,60,0.45)', letterSpacing: '0.08em' }}>
            ◈ Red zone = 5mm gutter — keep important content outside
          </span>
        )}
      </div>
    </div>
  );
}
