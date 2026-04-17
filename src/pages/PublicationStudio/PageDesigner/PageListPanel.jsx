import { useState, useRef } from 'react';
import { GOLD, BORDER, NU } from './designerConstants';

// ── Helpers ───────────────────────────────────────────────────────────────────
function getPageLabel(i, total) {
  if (i === 0) return 'Cover';
  if (i === total - 1 && total % 2 === 0) return 'Back';
  return `P${i + 1}`;
}

// ── Main component ────────────────────────────────────────────────────────────
export default function PageListPanel({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onReorderPage,
}) {
  // Drag state
  const [dragFrom, setDragFrom] = useState(null);
  const [dropTarget, setDropTarget] = useState(null); // page index we're hovering

  // Context menu
  const [contextMenu, setContextMenu] = useState(null); // { index, x, y }

  const stripRef = useRef(null);

  // ── Drag handlers ──────────────────────────────────────────────────────────
  function handleDragStart(e, i) {
    setDragFrom(i);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', String(i));
    // Compact ghost: draw page number on a small canvas
    try {
      const ghost = document.createElement('canvas');
      ghost.width = 56; ghost.height = 80;
      const ctx = ghost.getContext('2d');
      ctx.fillStyle = '#2A2520';
      ctx.fillRect(0, 0, 56, 80);
      ctx.strokeStyle = GOLD;
      ctx.lineWidth = 1.5;
      ctx.strokeRect(0, 0, 56, 80);
      ctx.fillStyle = 'rgba(201,169,110,0.7)';
      ctx.font = '700 14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`P${i + 1}`, 28, 40);
      e.dataTransfer.setDragImage(ghost, 28, 40);
    } catch { /* noop — fallback to browser default ghost */ }
  }

  function handleDragOver(e, i) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropTarget(i);
  }

  function handleDrop(e, i) {
    e.preventDefault();
    if (dragFrom !== null && dragFrom !== i) {
      onReorderPage?.(dragFrom, i);
    }
    setDragFrom(null);
    setDropTarget(null);
  }

  function handleDragEnd() {
    setDragFrom(null);
    setDropTarget(null);
  }

  // ── Context menu ───────────────────────────────────────────────────────────
  function handleContextMenu(e, i) {
    e.preventDefault();
    // Clamp to viewport so menu never gets cut off at right/bottom edges
    const menuW = 180;
    const menuH = 200;
    const x = Math.min(e.clientX, window.innerWidth  - menuW - 8);
    const y = Math.min(e.clientY, window.innerHeight - menuH - 8);
    setContextMenu({ index: i, x, y });
  }

  function closeContext() {
    setContextMenu(null);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div
      ref={stripRef}
      style={{
        height: 136,
        flexShrink: 0,
        background: '#0E0C0A',
        borderTop: `1px solid rgba(255,255,255,0.07)`,
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '0 20px',
        gap: 0,
        position: 'relative',
        userSelect: 'none',
        // Thin gold accent at very top
        boxShadow: `inset 0 1px 0 rgba(201,169,110,0.12)`,
      }}
      onClick={closeContext}
    >
      {pages.map((page, i) => {
        const isActive   = currentPageIndex === i;
        const isDragging = dragFrom === i;
        const isDropZone = dropTarget === i && dragFrom !== null && dragFrom !== i;

        const showBarBefore = isDropZone && dragFrom > i;
        const showBarAfter  = isDropZone && dragFrom < i;

        const label        = getPageLabel(i, pages.length);
        // Template name — truncated, shown below thumbnail
        const templateName = page?.templateName
          ? page.templateName.replace(/^(the |a )/i, '').slice(0, 18)
          : null;

        // Slot status colour
        const slot = page?.slot;
        const dotColor = !slot?.tier ? null :
          (slot.status === 'paid' || slot.status === 'published') ? '#34d399' :
          slot.status === 'offered' ? GOLD :
          'rgba(255,255,255,0.28)';

        return (
          <div
            key={page.id || i}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {/* Drop indicator — BEFORE */}
            <div style={{
              width: showBarBefore ? 3 : 0,
              height: 96,
              background: GOLD,
              borderRadius: 2,
              marginRight: showBarBefore ? 6 : 0,
              flexShrink: 0,
              boxShadow: showBarBefore ? `0 0 10px ${GOLD}` : 'none',
              transition: 'width 0.1s, margin 0.1s',
            }} />

            {/* Page tile */}
            <div
              draggable
              onClick={() => { closeContext(); onSelectPage(i); }}
              onContextMenu={e => handleContextMenu(e, i)}
              onDragStart={e => handleDragStart(e, i)}
              onDragOver={e => handleDragOver(e, i)}
              onDrop={e => handleDrop(e, i)}
              onDragEnd={handleDragEnd}
              title={page?.templateName || label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 5,
                cursor: isDragging ? 'grabbing' : 'pointer',
                padding: '0 6px',
                flexShrink: 0,
                opacity: isDragging ? 0.3 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {/* ── Thumbnail frame ── */}
              <div style={{
                position: 'relative',
                // Active: gold ring + glow; hover-zone: subtle gold ring
                borderRadius: 3,
                boxShadow: isActive
                  ? `0 0 0 2px ${GOLD}, 0 4px 20px rgba(201,169,110,0.35)`
                  : isDropZone && !isDragging
                  ? `0 0 0 1.5px rgba(201,169,110,0.5)`
                  : '0 2px 8px rgba(0,0,0,0.5)',
                transition: 'box-shadow 0.15s',
              }}>
                <div style={{
                  width: 64,
                  height: 91,        // A4 ratio 1.4142
                  borderRadius: 3,
                  overflow: 'hidden',
                  position: 'relative',
                  background: page?.thumbnailDataUrl
                    ? 'transparent'
                    : 'linear-gradient(160deg, #2A2520 0%, #1A1612 100%)',
                }}>
                  {/* Thumbnail image */}
                  {page?.thumbnailDataUrl
                    ? <img
                        src={page.thumbnailDataUrl}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                      />
                    : (
                      // Empty-state: elegant page number + subtle grid
                      <>
                        <div style={{
                          position: 'absolute', inset: 0,
                          backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 11px, rgba(255,255,255,0.025) 11px, rgba(255,255,255,0.025) 12px), repeating-linear-gradient(90deg, transparent, transparent 11px, rgba(255,255,255,0.025) 11px, rgba(255,255,255,0.025) 12px)`,
                        }} />
                        <div style={{
                          position: 'absolute', inset: 0,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexDirection: 'column', gap: 2,
                        }}>
                          <div style={{
                            fontFamily: `'Cormorant Garamond', Georgia, serif`,
                            fontSize: 20, fontStyle: 'italic', fontWeight: 400,
                            color: 'rgba(201,169,110,0.4)',
                            lineHeight: 1,
                          }}>
                            {i + 1}
                          </div>
                          <div style={{
                            width: 16, height: 1,
                            background: 'rgba(201,169,110,0.2)',
                          }} />
                        </div>
                      </>
                    )
                  }

                  {/* Bottom gradient + label overlay on thumbnail */}
                  {page?.thumbnailDataUrl && (
                    <div style={{
                      position: 'absolute', bottom: 0, left: 0, right: 0,
                      height: 28,
                      background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 100%)',
                      display: 'flex', alignItems: 'flex-end',
                      padding: '0 4px 3px',
                    }}>
                      <span style={{
                        fontFamily: `'Jost', sans-serif`,
                        fontSize: 6.5, fontWeight: 700,
                        letterSpacing: '0.12em',
                        textTransform: 'uppercase',
                        color: isActive ? GOLD : 'rgba(255,255,255,0.55)',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}>
                        {label}
                      </span>
                    </div>
                  )}

                  {/* Slot status dot */}
                  {dotColor && (
                    <div style={{
                      position: 'absolute', top: 4, right: 4,
                      width: 6, height: 6, borderRadius: '50%',
                      background: dotColor,
                      boxShadow: `0 0 4px ${dotColor}`,
                    }} />
                  )}
                </div>
              </div>

              {/* Below-thumbnail: page label (no thumbnail) OR template name */}
              <span style={{
                fontSize: 7.5,
                fontFamily: `'Jost', sans-serif`,
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: isActive ? GOLD : 'rgba(255,255,255,0.28)',
                maxWidth: 72,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                textAlign: 'center',
                transition: 'color 0.15s',
              }}>
                {page?.thumbnailDataUrl ? (templateName || label) : label}
              </span>
            </div>

            {/* Drop indicator — AFTER */}
            <div style={{
              width: showBarAfter ? 3 : 0,
              height: 96,
              background: GOLD,
              borderRadius: 2,
              marginLeft: showBarAfter ? 6 : 0,
              flexShrink: 0,
              boxShadow: showBarAfter ? `0 0 10px ${GOLD}` : 'none',
              transition: 'width 0.1s, margin 0.1s',
            }} />
          </div>
        );
      })}

      {/* ── Add page button ──────────────────────────────────────────────── */}
      <button
        onClick={e => { e.stopPropagation(); onAddPage?.(); }}
        style={{
          flexShrink: 0,
          width: 64,
          height: 91,
          marginLeft: 14,
          background: 'rgba(255,255,255,0.025)',
          border: '1px dashed rgba(201,169,110,0.2)',
          borderRadius: 3,
          color: 'rgba(201,169,110,0.3)',
          fontSize: 20,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.15s, color 0.15s, background 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,110,0.55)';
          e.currentTarget.style.color = GOLD;
          e.currentTarget.style.background = 'rgba(201,169,110,0.06)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,110,0.2)';
          e.currentTarget.style.color = 'rgba(201,169,110,0.3)';
          e.currentTarget.style.background = 'rgba(255,255,255,0.025)';
        }}
        title="Add page"
      >
        +
      </button>

      {/* ── Context menu ─────────────────────────────────────────────────── */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y - 10,
            left: contextMenu.x,
            zIndex: 1000,
            background: '#1E1B17',
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            padding: '4px 0',
            minWidth: 170,
            boxShadow: '0 8px 32px rgba(0,0,0,0.6)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {[
            {
              label: '⧉  Duplicate',
              action: () => { onDuplicatePage?.(contextMenu.index); closeContext(); },
            },
            {
              label: '←  Move Left',
              action: () => { onReorderPage?.(contextMenu.index, contextMenu.index - 1); closeContext(); },
              disabled: contextMenu.index === 0,
            },
            {
              label: '→  Move Right',
              action: () => { onReorderPage?.(contextMenu.index, contextMenu.index + 1); closeContext(); },
              disabled: contextMenu.index >= pages.length - 1,
            },
            null, // divider
            {
              label: 'Delete',
              action: () => { onDeletePage?.(contextMenu.index); closeContext(); },
              danger: true,
              disabled: pages.length <= 1,
            },
          ].map((item, idx) => {
            if (!item) {
              return <div key={`div-${idx}`} style={{ height: 1, background: BORDER, margin: '4px 0' }} />;
            }
            return (
              <button
                key={item.label}
                onClick={item.action}
                disabled={item.disabled}
                style={{
                  display: 'block',
                  width: '100%',
                  padding: '7px 14px',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  color: item.danger
                    ? '#f87171'
                    : item.disabled
                      ? 'rgba(255,255,255,0.2)'
                      : 'rgba(255,255,255,0.78)',
                  fontFamily: NU,
                  fontSize: 12,
                  cursor: item.disabled ? 'default' : 'pointer',
                  letterSpacing: '0.01em',
                }}
                onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.07)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
