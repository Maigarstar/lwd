import { useState, useRef } from 'react';
import { GOLD, BORDER, MUTED, NU } from './designerConstants';

export default function PageListPanel({
  pages,
  currentPageIndex,
  onSelectPage,
  onAddPage,
  onDeletePage,
  onDuplicatePage,
  onReorderPage,
}) {
  const [contextMenu, setContextMenu] = useState(null); // { index, x, y }
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const stripRef = useRef(null);

  function handleContextMenu(e, i) {
    e.preventDefault();
    setContextMenu({ index: i, x: e.clientX, y: e.clientY });
  }

  function closeContext() {
    setContextMenu(null);
  }

  function handleDragStart(e, i) {
    setDragIndex(i);
    e.dataTransfer.effectAllowed = 'move';
  }

  function handleDragOver(e, i) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverIndex(i);
  }

  function handleDrop(e, i) {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== i) {
      onReorderPage?.(dragIndex, i);
    }
    setDragIndex(null);
    setDragOverIndex(null);
  }

  function handleDragEnd() {
    setDragIndex(null);
    setDragOverIndex(null);
  }

  return (
    <div
      style={{
        height: 112,
        flexShrink: 0,
        background: '#141210',
        borderTop: `1px solid ${BORDER}`,
        display: 'flex',
        alignItems: 'center',
        overflowX: 'auto',
        overflowY: 'hidden',
        gap: 8,
        padding: '0 12px',
        position: 'relative',
      }}
      onClick={closeContext}
      ref={stripRef}
    >
      {pages.map((page, i) => (
        <div
          key={page.id}
          draggable
          onDragStart={e => handleDragStart(e, i)}
          onDragOver={e => handleDragOver(e, i)}
          onDrop={e => handleDrop(e, i)}
          onDragEnd={handleDragEnd}
          onClick={() => onSelectPage(i)}
          onContextMenu={e => handleContextMenu(e, i)}
          style={{
            flexShrink: 0,
            width: 80,
            height: 90,
            position: 'relative',
            cursor: 'pointer',
            border: i === currentPageIndex
              ? `2px solid ${GOLD}`
              : dragOverIndex === i
              ? `2px solid rgba(201,169,110,0.4)`
              : '2px solid rgba(255,255,255,0.08)',
            borderRadius: 3,
            background: '#1a1712',
            overflow: 'hidden',
            transition: 'border-color 0.15s, transform 0.1s',
            transform: dragIndex === i ? 'scale(0.95)' : 'scale(1)',
            opacity: dragIndex === i ? 0.5 : 1,
          }}
        >
          {/* Thumbnail */}
          {page.thumbnailDataUrl ? (
            <img
              src={page.thumbnailDataUrl}
              alt={`Page ${page.pageNumber}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : (
            <div style={{
              width: '100%', height: '100%',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'rgba(255,255,255,0.15)',
              fontFamily: NU, fontSize: 10,
            }}>
              {i + 1}
            </div>
          )}

          {/* Page number badge */}
          <div style={{
            position: 'absolute',
            bottom: 3,
            left: 0,
            right: 0,
            textAlign: 'center',
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 700,
            color: i === currentPageIndex ? GOLD : 'rgba(255,255,255,0.4)',
            letterSpacing: '0.05em',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
            pointerEvents: 'none',
          }}>
            {page.name || `Page ${i + 1}`}
          </div>
        </div>
      ))}

      {/* Add page button */}
      <button
        onClick={e => { e.stopPropagation(); onAddPage?.(); }}
        style={{
          flexShrink: 0,
          width: 60,
          height: 80,
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

      {/* Context menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            top: contextMenu.y - 10,
            left: contextMenu.x,
            zIndex: 1000,
            background: '#2A2520',
            border: `1px solid ${BORDER}`,
            borderRadius: 4,
            padding: '4px 0',
            minWidth: 160,
            boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
          }}
          onClick={e => e.stopPropagation()}
        >
          {[
            { label: 'Duplicate', action: () => { onDuplicatePage?.(contextMenu.index); closeContext(); } },
            { label: 'Move Left', action: () => { if (contextMenu.index > 0) onReorderPage?.(contextMenu.index, contextMenu.index - 1); closeContext(); }, disabled: contextMenu.index === 0 },
            { label: 'Move Right', action: () => { if (contextMenu.index < pages.length - 1) onReorderPage?.(contextMenu.index, contextMenu.index + 1); closeContext(); }, disabled: contextMenu.index === pages.length - 1 },
            { label: 'Delete', action: () => { onDeletePage?.(contextMenu.index); closeContext(); }, danger: true, disabled: pages.length <= 1 },
          ].map(item => (
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
                color: item.danger ? '#f87171' : item.disabled ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.75)',
                fontFamily: NU,
                fontSize: 12,
                cursor: item.disabled ? 'default' : 'pointer',
              }}
              onMouseEnter={e => { if (!item.disabled) e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'none'; }}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
