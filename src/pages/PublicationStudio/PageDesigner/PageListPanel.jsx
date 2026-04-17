import { useState, useRef } from 'react';
import { GOLD, BORDER, MUTED, NU } from './designerConstants';

// ── Build page groups: cover, spreads, back cover ────────────────────────────
function buildPageGroups(pages) {
  if (pages.length === 0) return [];
  const groups = [];

  // Cover (page index 0)
  groups.push({ type: 'cover', key: 'cover', indices: [0] });

  // Spreads (pairs starting from index 1)
  let i = 1;
  while (i < pages.length) {
    if (i + 1 < pages.length) {
      groups.push({ type: 'spread', key: `spread-${i}`, indices: [i, i + 1] });
      i += 2;
    } else {
      // Odd last page = back cover
      groups.push({ type: 'backcover', key: 'backcover', indices: [i] });
      i++;
    }
  }

  return groups;
}

// ── Single page tile (cover / back cover) ────────────────────────────────────
function SinglePageTile({ page, index, isActive, label, onSelectPage, onContextMenu }) {
  return (
    <div
      onClick={() => onSelectPage(index)}
      onContextMenu={e => onContextMenu(e, index)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        gap: 4,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <div style={{
        width: 56,
        height: 80,
        background: '#2A2520',
        border: `1.5px solid ${isActive ? GOLD : '#3A3530'}`,
        borderRadius: 2,
        overflow: 'hidden',
        boxShadow: isActive ? `0 0 0 1px ${GOLD}` : 'none',
        backgroundImage: page?.thumbnailDataUrl ? `url(${page.thumbnailDataUrl})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: page?.thumbnailDataUrl ? 'block' : 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.15)',
        fontFamily: NU,
        fontSize: 10,
      }}>
        {!page?.thumbnailDataUrl && (index + 1)}
      </div>
      <span style={{
        fontSize: 8,
        fontFamily: `'Jost', ${NU}, sans-serif`,
        fontWeight: 700,
        letterSpacing: '0.1em',
        color: isActive ? GOLD : 'rgba(255,255,255,0.35)',
        textTransform: 'uppercase',
      }}>{label}</span>
    </div>
  );
}

// ── Spread tile (two pages side by side) ─────────────────────────────────────
function SpreadTile({ leftPage, rightPage, leftIdx, rightIdx, currentPageIndex, spreadNum, onSelectPage, onContextMenu }) {
  const isActive = currentPageIndex === leftIdx || currentPageIndex === rightIdx;
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        cursor: 'pointer',
        gap: 4,
        flexShrink: 0,
        userSelect: 'none',
      }}
    >
      <div style={{ display: 'flex', gap: 1 }}>
        {/* Left page thumbnail */}
        <div
          onClick={() => onSelectPage(leftIdx)}
          onContextMenu={e => onContextMenu(e, leftIdx)}
          style={{
            width: 50,
            height: 70,
            background: '#2A2520',
            border: `1.5px solid ${currentPageIndex === leftIdx ? GOLD : (isActive ? 'rgba(201,169,110,0.3)' : '#3A3530')}`,
            borderRadius: '2px 0 0 2px',
            overflow: 'hidden',
            backgroundImage: leftPage?.thumbnailDataUrl ? `url(${leftPage.thumbnailDataUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: leftPage?.thumbnailDataUrl ? 'block' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.15)',
            fontFamily: NU,
            fontSize: 9,
          }}
        >
          {!leftPage?.thumbnailDataUrl && (leftIdx + 1)}
        </div>
        {/* Right page thumbnail */}
        <div
          onClick={() => onSelectPage(rightIdx)}
          onContextMenu={e => onContextMenu(e, rightIdx)}
          style={{
            width: 50,
            height: 70,
            background: '#2A2520',
            border: `1.5px solid ${currentPageIndex === rightIdx ? GOLD : (isActive ? 'rgba(201,169,110,0.3)' : '#3A3530')}`,
            borderRadius: '0 2px 2px 0',
            overflow: 'hidden',
            backgroundImage: rightPage?.thumbnailDataUrl ? `url(${rightPage.thumbnailDataUrl})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: rightPage?.thumbnailDataUrl ? 'block' : 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.15)',
            fontFamily: NU,
            fontSize: 9,
          }}
        >
          {!rightPage?.thumbnailDataUrl && (rightIdx + 1)}
        </div>
      </div>
      <span style={{
        fontSize: 8,
        fontFamily: `'Jost', ${NU}, sans-serif`,
        fontWeight: 600,
        letterSpacing: '0.08em',
        color: isActive ? GOLD : 'rgba(255,255,255,0.3)',
        textTransform: 'uppercase',
      }}>Spread {spreadNum}</span>
    </div>
  );
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
  const [contextMenu, setContextMenu] = useState(null); // { index, x, y }
  const stripRef = useRef(null);

  function handleContextMenu(e, i) {
    e.preventDefault();
    setContextMenu({ index: i, x: e.clientX, y: e.clientY });
  }

  function closeContext() {
    setContextMenu(null);
  }

  const groups = buildPageGroups(pages);

  // Spread number counter (for labelling)
  let spreadCounter = 0;

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
        gap: 12,
        padding: '0 16px',
        position: 'relative',
      }}
      onClick={closeContext}
      ref={stripRef}
    >
      {groups.map((group) => {
        if (group.type === 'cover') {
          const idx = group.indices[0];
          const page = pages[idx];
          return (
            <SinglePageTile
              key={group.key}
              page={page}
              index={idx}
              isActive={currentPageIndex === idx}
              label="Cover"
              onSelectPage={onSelectPage}
              onContextMenu={handleContextMenu}
            />
          );
        }

        if (group.type === 'backcover') {
          const idx = group.indices[0];
          const page = pages[idx];
          return (
            <SinglePageTile
              key={group.key}
              page={page}
              index={idx}
              isActive={currentPageIndex === idx}
              label="Back"
              onSelectPage={onSelectPage}
              onContextMenu={handleContextMenu}
            />
          );
        }

        // Spread
        spreadCounter += 1;
        const [leftIdx, rightIdx] = group.indices;
        const leftPage  = pages[leftIdx];
        const rightPage = pages[rightIdx];
        return (
          <SpreadTile
            key={group.key}
            leftPage={leftPage}
            rightPage={rightPage}
            leftIdx={leftIdx}
            rightIdx={rightIdx}
            currentPageIndex={currentPageIndex}
            spreadNum={spreadCounter}
            onSelectPage={onSelectPage}
            onContextMenu={handleContextMenu}
          />
        );
      })}

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
            { label: 'Move Left',  action: () => { if (contextMenu.index > 0) onReorderPage?.(contextMenu.index, contextMenu.index - 1); closeContext(); }, disabled: contextMenu.index === 0 },
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
