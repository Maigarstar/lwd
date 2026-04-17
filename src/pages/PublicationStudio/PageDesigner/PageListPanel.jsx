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
        height: 112,
        flexShrink: 0,
        background: '#141210',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        padding: '0 16px',
        gap: 0,
        position: 'relative',
        userSelect: 'none',
      }}
      onClick={closeContext}
    >
      {pages.map((page, i) => {
        const isActive  = currentPageIndex === i;
        const isDragging = dragFrom === i;

        // Drop indicator: gold bar before this tile when it's the drop target
        // — before if we're moving right (dragFrom < i)
        // — after  if we're moving left  (dragFrom > i)
        const showBarBefore = dropTarget === i && dragFrom !== null && dragFrom !== i && dragFrom > i;
        const showBarAfter  = dropTarget === i && dragFrom !== null && dragFrom !== i && dragFrom < i;

        const label = getPageLabel(i, pages.length);

        return (
          <div
            key={page.id || i}
            style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}
          >
            {/* Drop indicator — BEFORE this tile */}
            <div style={{
              width: showBarBefore ? 3 : 0,
              height: 80,
              background: GOLD,
              borderRadius: 2,
              marginRight: showBarBefore ? 5 : 0,
              flexShrink: 0,
              boxShadow: showBarBefore ? `0 0 8px ${GOLD}` : 'none',
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
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: isDragging ? 'grabbing' : 'grab',
                padding: '0 7px',
                flexShrink: 0,
                opacity: isDragging ? 0.35 : 1,
                transition: 'opacity 0.15s',
              }}
            >
              {/* Thumbnail */}
              <div style={{
                width: 56,
                height: 80,
                background: '#2A2520',
                border: `1.5px solid ${isActive ? GOLD : (dropTarget === i && !isDragging ? 'rgba(201,169,110,0.45)' : '#3A3530')}`,
                borderRadius: 2,
                overflow: 'hidden',
                boxShadow: isActive ? `0 0 0 1px ${GOLD}` : 'none',
                backgroundImage: page?.thumbnailDataUrl ? `url(${page.thumbnailDataUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                display: page?.thumbnailDataUrl ? 'block' : 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'rgba(255,255,255,0.18)',
                fontFamily: NU,
                fontSize: 10,
                transition: 'border-color 0.12s',
                position: 'relative',
              }}>
                {!page?.thumbnailDataUrl && (i + 1)}
                {/* Slot status dot */}
                {(() => {
                  const slot = page?.slot;
                  if (!slot?.tier) return null;
                  const s = slot.status;
                  const dotColor =
                    s === 'paid' || s === 'published' ? '#34d399' :
                    s === 'offered' ? GOLD :
                    'rgba(255,255,255,0.35)';
                  return (
                    <div style={{
                      position: 'absolute',
                      bottom: 4,
                      left: 4,
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: dotColor,
                      boxShadow: `0 0 4px ${dotColor}`,
                    }} />
                  );
                })()}
              </div>

              {/* Label */}
              <span style={{
                fontSize: 8,
                fontFamily: `'Jost', ${NU}, sans-serif`,
                fontWeight: 700,
                letterSpacing: '0.1em',
                color: isActive ? GOLD : 'rgba(255,255,255,0.35)',
                textTransform: 'uppercase',
              }}>
                {label}
              </span>
            </div>

            {/* Drop indicator — AFTER this tile */}
            <div style={{
              width: showBarAfter ? 3 : 0,
              height: 80,
              background: GOLD,
              borderRadius: 2,
              marginLeft: showBarAfter ? 5 : 0,
              flexShrink: 0,
              boxShadow: showBarAfter ? `0 0 8px ${GOLD}` : 'none',
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
          width: 60,
          height: 80,
          marginLeft: 12,
          background: 'rgba(255,255,255,0.04)',
          border: '1px dashed rgba(255,255,255,0.15)',
          borderRadius: 3,
          color: 'rgba(255,255,255,0.3)',
          fontSize: 22,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'border-color 0.15s, color 0.15s',
        }}
        onMouseEnter={e => {
          e.currentTarget.style.borderColor = 'rgba(201,169,110,0.4)';
          e.currentTarget.style.color = GOLD;
        }}
        onMouseLeave={e => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)';
          e.currentTarget.style.color = 'rgba(255,255,255,0.3)';
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
