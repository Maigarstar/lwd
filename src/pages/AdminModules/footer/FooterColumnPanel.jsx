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
function BlockRow({ item, isSelected, onSelect, onMoveUp, onMoveDown, onToggleVisible, onRemove, onRequestRemove, isFirst, isLast, confirmingRemove, dragOver, onDragStart, onDragOver, onDrop, onDragEnd, C }) {
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
          background: isSelected ? G + "12" : "transparent",
          borderLeft: isSelected ? `2px solid ${G}` : "2px solid transparent",
          cursor: confirmingRemove ? "default" : "pointer",
          transition: "background 120ms",
          opacity: dragOver === "self" ? 0.4 : 1,
        }}
        onMouseEnter={e => { if (!isSelected && !confirmingRemove) e.currentTarget.style.background = "#ffffff08"; }}
        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = isSelected ? G + "12" : "transparent"; }}
      >
        {/* Drag handle */}
        <span
          title="Drag to reorder"
          style={{
            color: "#3a3530", fontSize: 12, cursor: "grab", flexShrink: 0,
            lineHeight: 1, paddingRight: 2, userSelect: "none",
          }}
        >⠿</span>

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
function SectionHeader({ label, onAdd, addLabel, locked, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "8px 14px 6px",
      borderBottom: `1px solid ${C?.border || "#2a2218"}`,
    }}>
      <span style={{
        fontFamily: SANS, fontSize: 10, fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase",
        color: C?.grey || "#8a7d6a",
      }}>{label}</span>

      {locked && (
        <span style={{
          fontFamily: SANS, fontSize: 9, color: "#5a5045",
          letterSpacing: "0.06em", textTransform: "uppercase",
        }}>Config</span>
      )}

      {!locked && onAdd && (
        <button
          onClick={onAdd}
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
  onToggleVisible,
  onRemove,
  C,
}) {
  const G = C?.gold || "#c9a84c";
  const numCols = footerConfig?.layout_columns || 6;
  const [confirmRemoveId, setConfirmRemoveId] = useState(null);
  const [dragItemId, setDragItemId] = useState(null);
  const [dragOverItemId, setDragOverItemId] = useState(null);

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

  function renderBlockList(colId, blockList) {
    if (!blockList || blockList.length === 0) return null;
    return blockList.map((item, idx) => {
      // Determine drag-over indicator position
      let dragOver = null;
      if (dragOverItemId === item.id && dragItemId && dragItemId !== item.id) {
        dragOver = "above";
      }
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
          dragOver={dragItemId === item.id ? "self" : dragOver}
          onDragStart={(it) => setDragItemId(it.id)}
          onDragOver={(it) => setDragOverItemId(it.id)}
          onDrop={(targetItem) => {
            if (dragItem && onReorder) onReorder(dragItem, targetItem);
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

      {/* ── Nav Columns 2-N ───────────────────────────────────────────── */}
      {Array.from({ length: numCols - 1 }, (_, i) => {
        const colId = i + 2;
        const meta = SECTION_META[colId] || { label: `Column ${colId}`, hint: "Add blocks to this column" };
        const colItems = grouped[colId] || [];
        return (
          <div key={colId}>
            <SectionHeader
              label={meta.label}
              onAdd={() => onAdd(colId)}
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
