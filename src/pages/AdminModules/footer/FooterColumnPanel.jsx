// footer/FooterColumnPanel.jsx
// Left panel: lists footer blocks grouped by section.
// Sections: Iconic Venues strip | Brand (locked) | Columns 2-N | Bottom Bar Links
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  SANS, SERIF,
  BLOCK_BADGE_DEF, blankFooterItem,
  ICONIC_STRIP_COL, BRAND_COL, BOTTOM_BAR_COL,
} from "./footerUtils.js";

// ── Padlock SVG icon ──────────────────────────────────────────────────────
function PadlockIcon({ locked, color }) {
  return locked ? (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <rect x="1" y="5" width="9" height="8" rx="1.5" stroke={color} strokeWidth="1.5"/>
      <path d="M3.5 5V3.5a2 2 0 014 0V5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="5.5" cy="9" r="1" fill={color}/>
    </svg>
  ) : (
    <svg width="11" height="13" viewBox="0 0 11 13" fill="none">
      <rect x="1" y="5" width="9" height="8" rx="1.5" stroke={color} strokeWidth="1.5" opacity="0.4"/>
      <path d="M3.5 5V3.5a2 2 0 014 0" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
    </svg>
  );
}

// ── Block badge pill ──────────────────────────────────────────────────────
function Badge({ type }) {
  const def = BLOCK_BADGE_DEF[type] || BLOCK_BADGE_DEF.link;
  return (
    <span style={{
      fontFamily: SANS, fontSize: 9, fontWeight: 700,
      letterSpacing: "0.08em", textTransform: "uppercase",
      color: def.color, background: def.bg,
      border: `1px solid ${def.border}`,
      borderRadius: 4, padding: "2px 6px",
      flexShrink: 0,
    }}>{def.label}</span>
  );
}

// ── Single block row ──────────────────────────────────────────────────────
function BlockRow({ item, isSelected, onSelect, onMoveUp, onMoveDown, onToggleVisible, onRemove, onRequestRemove, isFirst, isLast, confirmingRemove, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, isLocked, onToggleLock, isGrouped, C }) {
  const G = C?.gold || "#c9a84c";
  const label = item.label || (item.content ? item.content.slice(0, 28) : null) || item.block_type;

  return (
    <div style={{ display: "flex", flexDirection: "column" }}>
      {/* Drop-target indicator above */}
      {dragOver === "above" && (
        <div style={{ height: 2, background: G, margin: "0 14px", borderRadius: 1, opacity: 0.8 }} />
      )}
      <div
        draggable
        onDragStart={e => { e.dataTransfer.effectAllowed = "move"; onDragStart(item); }}
        onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onDragOver(item, e); }}
        onDrop={e => { e.preventDefault(); onDrop(item); }}
        onDragEnd={onDragEnd}
        onClick={() => !confirmingRemove && onSelect(item)}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "7px 14px",
          background: isGrouped
            ? G + "08"
            : isSelected ? G + "12" : "transparent",
          borderLeft: isSelected
            ? `2px solid ${G}`
            : isGrouped ? `2px solid ${G}30` : "2px solid transparent",
          cursor: confirmingRemove ? "default" : "pointer",
          transition: "background 120ms",
          opacity: dragOver === "self" ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (!isSelected && !confirmingRemove) e.currentTarget.style.background = "#ffffff08"; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? G + "12" : "transparent"; }}
      >
        {/* Drag handle — 6-dot gripper */}
        <span
          title="Drag to reorder"
          onMouseDown={e => e.currentTarget.parentElement.style.cursor = "grabbing"}
          onMouseUp={e => e.currentTarget.parentElement.style.cursor = "pointer"}
          style={{
            cursor: "grab", flexShrink: 0, display: "flex", gap: "3px",
            alignItems: "center", padding: "0 4px 0 0", userSelect: "none",
          }}
        >
          {[0, 1].map(col => (
            <div key={col} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
              {[0, 1, 2].map(row => (
                <div key={row} style={{
                  width: 3, height: 3, borderRadius: "50%",
                  background: "#5a5045",
                }} />
              ))}
            </div>
          ))}
        </span>

        <Badge type={item.block_type} />

        <span style={{
          fontFamily: SANS, fontSize: 12, color: C?.off || "#d4c8b0",
          flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
          opacity: item.visible ? 1 : 0.45,
        }}>{label}</span>

        {/* Toggle visible */}
        <button
          onClick={e => { e.stopPropagation(); onToggleVisible(item); }}
          title={item.visible ? "Hide" : "Show"}
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: item.visible ? C?.grey2 || "#5a5045" : "#3a3530",
            fontSize: 12, padding: "2px 4px", lineHeight: 1, flexShrink: 0,
          }}
        >{item.visible ? "◉" : "○"}</button>

        {/* Lock group — heading blocks only */}
        {item.block_type === "heading" && onToggleLock && (
          <button
            onClick={e => { e.stopPropagation(); onToggleLock(item); }}
            title={isLocked ? "Locked: drag heading moves whole group" : "Unlocked: click to lock group"}
            style={{
              background: "none", border: "none", cursor: "pointer",
              padding: "2px 4px", lineHeight: 1, flexShrink: 0,
              opacity: isLocked ? 1 : 0.35,
              transition: "opacity 150ms",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = 1}
            onMouseLeave={e => e.currentTarget.style.opacity = isLocked ? 1 : 0.35}
          >
            <PadlockIcon locked={isLocked} color={isLocked ? G : (C?.grey || "#8a7d6a")} />
          </button>
        )}

        {/* Delete — opens inline confirm */}
        <button
          onClick={e => { e.stopPropagation(); onRequestRemove(item); }}
          title="Delete block"
          style={{
            background: "none", border: "none", cursor: "pointer",
            color: confirmingRemove ? "#f87171" : "#5a3030",
            fontSize: 13, padding: "2px 4px", lineHeight: 1, flexShrink: 0,
            transition: "color 120ms",
          }}
          onMouseEnter={e => e.currentTarget.style.color = "#f87171"}
          onMouseLeave={e => e.currentTarget.style.color = confirmingRemove ? "#f87171" : "#5a3030"}
        >✕</button>
      </div>

      {/* Drop-target indicator below (last item) */}
      {dragOver === "below" && (
        <div style={{ height: 2, background: G, margin: "0 14px", borderRadius: 1, opacity: 0.8 }} />
      )}

      {/* Inline delete confirmation */}
      {confirmingRemove && (
        <div style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: "6px 14px 8px",
          background: "#1a0a0a",
          borderLeft: "2px solid #7f1d1d",
          borderBottom: `1px solid ${C?.border || "#2a2218"}`,
        }}>
          <span style={{ fontFamily: SANS, fontSize: 11, color: "#f87171", flex: 1 }}>
            Delete "{label}"? This cannot be undone.
          </span>
          <button
            onClick={e => { e.stopPropagation(); onRemove(item); }}
            style={{
              background: "#7f1d1d", border: "none", borderRadius: 4,
              color: "#fca5a5", fontFamily: SANS, fontSize: 10, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "4px 10px", cursor: "pointer", transition: "background 120ms",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "#991b1b"}
            onMouseLeave={e => e.currentTarget.style.background = "#7f1d1d"}
          >Delete</button>
          <button
            onClick={e => { e.stopPropagation(); onRequestRemove(null); }}
            style={{
              background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
              borderRadius: 4, color: C?.grey || "#8a7d6a",
              fontFamily: SANS, fontSize: 10, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase",
              padding: "4px 10px", cursor: "pointer",
            }}
          >Cancel</button>
        </div>
      )}
    </div>
  );
}

// ── Section header ─────────────────────────────────────────────────────────
function SectionHeader({ label, onAdd, addLabel, locked, draggable: isDraggable, colDragOver, onColDragStart, onColDragOver, onColDrop, onColDragEnd, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div
      draggable={!!isDraggable}
      onDragStart={isDraggable ? e => { e.dataTransfer.effectAllowed = "move"; onColDragStart?.(); } : undefined}
      onDragOver={isDraggable ? e => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; onColDragOver?.(); } : undefined}
      onDrop={isDraggable ? e => { e.preventDefault(); onColDrop?.(); } : undefined}
      onDragEnd={isDraggable ? onColDragEnd : undefined}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "8px 14px 6px",
        borderBottom: `1px solid ${C?.border || "#2a2218"}`,
        borderTop: colDragOver ? `2px solid ${G}` : "2px solid transparent",
        cursor: isDraggable ? "grab" : "default",
        transition: "border-color 100ms",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        {/* Column drag handle — only for draggable nav sections */}
        {isDraggable && (
          <span style={{ display: "flex", gap: "3px", alignItems: "center", flexShrink: 0, opacity: 0.5 }}>
            {[0, 1].map(col => (
              <div key={col} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                {[0, 1, 2].map(row => (
                  <div key={row} style={{ width: 3, height: 3, borderRadius: "50%", background: C?.grey || "#8a7d6a" }} />
                ))}
              </div>
            ))}
          </span>
        )}
        <span style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 700,
          letterSpacing: "0.1em", textTransform: "uppercase",
          color: colDragOver ? G : C?.grey || "#8a7d6a",
          transition: "color 100ms",
        }}>{label}</span>
      </div>

      {locked && (
        <span style={{
          fontFamily: SANS, fontSize: 9, color: "#5a5045",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>Config</span>
      )}

      {!locked && onAdd && (
        <button
          onClick={e => { e.stopPropagation(); onAdd(); }}
          style={{
            background: "none", border: `1px solid ${G}30`,
            borderRadius: 5, color: G, fontFamily: SANS, fontSize: 10,
            fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase",
            padding: "3px 8px", cursor: "pointer",
            transition: "border-color 120ms, background 120ms",
          }}
          onMouseEnter={e => { e.currentTarget.style.background = G + "12"; e.currentTarget.style.borderColor = G + "60"; }}
          onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.borderColor = G + "30"; }}
        >+ {addLabel || "Add Block"}</button>
      )}
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────
function EmptySlot({ msg, hint, C }) {
  return (
    <div style={{ padding: "10px 14px 12px" }}>
      <div style={{ fontFamily: SANS, fontSize: 11, color: "#5a5045", fontStyle: "italic" }}>{msg}</div>
      {hint && (
        <div style={{ fontFamily: SANS, fontSize: 10, color: "#3a3530", marginTop: 3, lineHeight: 1.5 }}>{hint}</div>
      )}
    </div>
  );
}

// ── Main panel ─────────────────────────────────────────────────────────────
export default function FooterColumnPanel({
  items,
  footerConfig,
  selectedItemId,
  onSelect,
  onAdd,          // (columnId) => void
  onMoveUp,
  onMoveDown,
  onReorder,
  onReorderGroup,
  onReorderColumn,
  onToggleVisible,
  onRemove,
  C,
}) {
  const G = C?.gold || "#c9a84c";
  const numCols = footerConfig?.layout_columns || 6;
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [dragItemId, setDragItemId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);
  const [dragColId, setDragColId] = useState(null);
  const [dragOverColId, setDragOverColId] = useState(null);
  const [lockedGroups, setLockedGroups] = useState(new Set()); // Set of heading item IDs

  function toggleLock(headingItem) {
    setLockedGroups(prev => {
      const next = new Set(prev);
      if (next.has(headingItem.id)) next.delete(headingItem.id);
      else next.add(headingItem.id);
      return next;
    });
  }

  // Returns all items in a locked group (heading + items below until next heading)
  function getGroupItems(headingItem, colItems) {
    const sorted = [...colItems].sort((a, b) => a.position - b.position);
    const idx = sorted.findIndex(i => i.id === headingItem.id);
    if (idx < 0) return [headingItem];
    const group = [headingItem];
    for (let i = idx + 1; i < sorted.length; i++) {
      if (sorted[i].block_type === "heading") break;
      group.push(sorted[i]);
    }
    return group;
  }

  // Group items by column_id
  const grouped = {};
  (items || []).forEach(item => {
    const col = item.column_id ?? 2;
    if (!grouped[col]) grouped[col] = [];
    grouped[col].push(item);
  });

  // Sort within each group by position
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.position - b.position));

  const dragItem = dragItemId ? (items || []).find(i => i.id === dragItemId) : null;
  const dragIsLockedHeading = dragItem && dragItem.block_type === "heading" && lockedGroups.has(dragItem.id);

  function renderBlockList(colId, blockList) {
    if (!blockList || blockList.length === 0) return null;

    // Find which items belong to a locked group
    const groupedItemIds = new Set();
    const lockedHeadingIds = new Set();
    blockList.forEach(item => {
      if (item.block_type === "heading" && lockedGroups.has(item.id)) {
        lockedHeadingIds.add(item.id);
        getGroupItems(item, blockList).forEach(gi => groupedItemIds.add(gi.id));
      }
    });

    return blockList.map((item, idx) => {
      const isDragSelf = dragItemId === item.id;
      // When a locked heading is being dragged, dim all items in that group
      const isInDragGroup = dragIsLockedHeading &&
        getGroupItems(dragItem, blockList).some(gi => gi.id === item.id);

      const dragOver = dragOverItemId === item.id && dragItemId && !isDragSelf ? "above" : null;

      return (
        <BlockRow
          key={item.id || idx}
          item={item}
          isSelected={item.id === selectedItemId}
          onSelect={onSelect}
          onMoveUp={onMoveUp}
          onMoveDown={onMoveDown}
          onToggleVisible={onToggleVisible}
          onRemove={(it) => { onRemove(it); setConfirmRemoveId(null); }}
          onRequestRemove={(it) => setConfirmRemoveId(it ? it.id : null)}
          confirmingRemove={item.id === confirmRemoveId}
          isFirst={idx === 0}
          isLast={idx === blockList.length - 1}
          isLocked={item.block_type === "heading" && lockedGroups.has(item.id)}
          isGrouped={!lockedHeadingIds.has(item.id) && groupedItemIds.has(item.id)}
          onToggleLock={toggleLock}
          dragOver={isDragSelf || isInDragGroup ? "self" : dragOver}
          onDragStart={(it) => setDragItemId(it.id)}
          onDragOver={(it) => setDragOverItemId(it.id)}
          onDrop={(targetItem) => {
            if (dragItem) {
              if (dragIsLockedHeading && onReorderGroup) {
                const group = getGroupItems(dragItem, blockList);
                onReorderGroup(group, targetItem);
              } else if (onReorder) {
                onReorder(dragItem, targetItem);
              }
            }
            setDragItemId(null);
            setDragOverItemId(null);
          }}
          onDragEnd={() => { setDragItemId(null); setDragOverItemId(null); }}
          C={C}
        />
      );
    });
  }

  // Curated section names — editorial framing, not technical column numbers
  const SECTION_META = {
    2: { label: "Couples",      hint: "Venues, vendors, planning tools for couples" },
    3: { label: "Vendors",      hint: "List your business, advertise, vendor resources" },
    4: { label: "Destinations", hint: "Key locations, regions, curated venue collections" },
    5: { label: "Our Brands",   hint: "Sister brands, collections, and brand partnerships" },
    6: { label: "Company",      hint: "About, editorial standards, press, careers" },
  };

  return (
    <div style={{
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10,
      overflow: "hidden",
      fontFamily: SANS,
    }}>

      {/* ── Iconic Venues ─────────────────────────────────────────────── */}
      <SectionHeader
        label="Iconic Venues"
        onAdd={() => onAdd(ICONIC_STRIP_COL)}
        addLabel="Add Strip"
        C={C}
      />
      {renderBlockList(ICONIC_STRIP_COL, grouped[ICONIC_STRIP_COL])}
      {(!grouped[ICONIC_STRIP_COL] || grouped[ICONIC_STRIP_COL].length === 0) && (
        <EmptySlot
          msg="No strip added yet"
          hint="Highlight your most iconic venues across the platform"
          C={C}
        />
      )}

      {/* ── Brand Presence (locked) ───────────────────────────────────── */}
      <SectionHeader label="Brand Presence" locked C={C} />
      <div style={{
        padding: "8px 14px 10px",
        fontFamily: SANS, fontSize: 11,
        color: C?.grey || "#8a7d6a",
        lineHeight: 1.6,
        borderBottom: `1px solid ${C?.border || "#2a2218"}`,
      }}>
        Your logo, tagline, and social presence.
        <br />
        <span style={{ color: "#5a5045" }}>Configure in the Config tab.</span>
      </div>

      {/* ── Nav Columns 2-N (draggable to reorder entire columns) ───── */}
      {Array.from({ length: numCols - 1 }, (_, i) => {
        const colId = i + 2;
        const meta = SECTION_META[colId] || { label: `Column ${colId}`, hint: "Add blocks to this column" };
        const colItems = grouped[colId] || [];
        return (
          <div
            key={colId}
            onDragOver={dragColId && dragColId !== colId ? e => { e.preventDefault(); setDragOverColId(colId); } : undefined}
            onDrop={dragColId && dragColId !== colId ? e => {
              e.preventDefault();
              if (onReorderColumn && dragColId !== colId) onReorderColumn(dragColId, colId);
              setDragColId(null);
              setDragOverColId(null);
            } : undefined}
          >
            <SectionHeader
              label={meta.label}
              onAdd={() => onAdd(colId)}
              draggable
              colDragOver={dragOverColId === colId && dragColId !== colId}
              onColDragStart={() => setDragColId(colId)}
              onColDragOver={() => setDragOverColId(colId)}
              onColDrop={() => {
                if (onReorderColumn && dragColId && dragColId !== colId) onReorderColumn(dragColId, colId);
                setDragColId(null);
                setDragOverColId(null);
              }}
              onColDragEnd={() => { setDragColId(null); setDragOverColId(null); }}
              C={C}
            />
            {renderBlockList(colId, colItems)}
            {colItems.length === 0 && (
              <EmptySlot msg="No blocks yet" hint={meta.hint} C={C} />
            )}
          </div>
        );
      })}

      {/* ── Legal & System ────────────────────────────────────────────── */}
      <SectionHeader
        label="Legal & System"
        onAdd={() => onAdd(BOTTOM_BAR_COL)}
        addLabel="Add Link"
        C={C}
      />
      {renderBlockList(BOTTOM_BAR_COL, grouped[BOTTOM_BAR_COL])}
      {(!grouped[BOTTOM_BAR_COL] || grouped[BOTTOM_BAR_COL].length === 0) && (
        <EmptySlot msg="No links yet" hint="Privacy, Terms, Cookies — utility links for the bottom bar" C={C} />
      )}

    </div>
  );
}
