// menu/MenuTreePanel.jsx
// Tree view for nav items with inline actions. Highlights the selected item.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  SANS, SERIF, MONO,
  TYPE_BADGE_DEF, TYPE_OPTIONS, PRESETS, MAX_DEPTH,
} from "./menuUtils.js";

// ── Type Badge ─────────────────────────────────────────────────────────────
function TypeBadge({ type, visible }) {
  if (!visible) {
    return (
      <span style={{
        fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
        textTransform: "uppercase", background: "#2a1010", border: "1px solid #4a2020",
        borderRadius: 4, padding: "2px 7px", color: "#f87171",
      }}>Hidden</span>
    );
  }
  const b = TYPE_BADGE_DEF[type] || TYPE_BADGE_DEF.link;
  return (
    <span style={{
      fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
      textTransform: "uppercase", background: b.bg, border: `1px solid ${b.border}`,
      borderRadius: 4, padding: "2px 7px", color: b.color,
    }}>{b.label}</span>
  );
}

// ── Tree Node ──────────────────────────────────────────────────────────────
function TreeNode({
  item, siblings, depth,
  onEdit, onAddChild, onDelete, onToggleVisible, onMove,
  C, deleting, moving, selectedItemId,
}) {
  const G = C?.gold || "#c9a84c";
  const hasChildren = item.children?.length > 0;
  const [expanded, setExpanded] = useState(true);
  const [dragOver, setDragOver] = useState(false);
  const [dragOverPos, setDragOverPos] = useState(null); // "above" | "below" | null
  const idx = siblings.findIndex(s => s.id === item.id);
  const isSelected = selectedItemId === item.id;

  const handleDragStart = (e) => {
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", JSON.stringify({ itemId: item.id, siblings }));
    e.currentTarget.style.opacity = "0.5";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    setDragOver(true);
    // Determine if dropping above or below
    const rect = e.currentTarget.getBoundingClientRect();
    const midpoint = rect.top + rect.height / 2;
    setDragOverPos(e.clientY < midpoint ? "above" : "below");
  };

  const handleDragLeave = (e) => {
    if (e.currentTarget.contains(e.relatedTarget)) return;
    setDragOver(false);
    setDragOverPos(null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    try {
      const data = JSON.parse(e.dataTransfer.getData("text/plain"));
      if (data.itemId === item.id) {
        setDragOver(false);
        setDragOverPos(null);
        return; // Can't drop on itself
      }
      // Reorder based on drop position
      const dropIdx = dragOverPos === "above" ? idx : idx + 1;
      if (data.siblings === siblings) {
        // Same level reordering
        const dragItem = siblings.find(s => s.id === data.itemId);
        if (dragItem) {
          const dragIdx = siblings.indexOf(dragItem);
          if (dragIdx !== dropIdx && dragIdx !== dropIdx - 1) {
            onMove(dragItem, siblings, dragIdx < dropIdx ? "down" : "up");
          }
        }
      }
    } catch (e) {
      console.error("Drop failed:", e);
    }
    setDragOver(false);
    setDragOverPos(null);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = "1";
    setDragOver(false);
    setDragOverPos(null);
  };

  const qBtn = (label, onClick, opts = {}) => (
    <button
      onClick={onClick}
      disabled={opts.disabled}
      title={opts.title || label}
      style={{
        background: "none",
        border: `1px solid ${opts.danger ? "transparent" : (C?.border || "#2a2218")}`,
        borderRadius: 5, padding: "3px 10px",
        fontFamily: SANS, fontSize: 10, fontWeight: 600, letterSpacing: "0.04em",
        textTransform: "uppercase", cursor: opts.disabled ? "not-allowed" : "pointer",
        color: opts.danger ? "#f87171" : (C?.grey || "#8a7d6a"),
        opacity: opts.disabled ? 0.4 : 1, transition: "all 0.15s", whiteSpace: "nowrap",
      }}
      onMouseEnter={e => {
        if (opts.disabled) return;
        if (opts.danger) { e.currentTarget.style.borderColor = "#f87171"; e.currentTarget.style.background = "#f8717122"; }
        else { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = opts.danger ? "transparent" : (C?.border || "#2a2218");
        e.currentTarget.style.background = "none";
        e.currentTarget.style.color = opts.danger ? "#f87171" : (C?.grey || "#8a7d6a");
      }}
    >{label}</button>
  );

  return (
    <div>
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          padding: `7px 14px 7px ${14 + depth * 22}px`,
          borderTop: depth === 0 ? `1px solid ${C?.border || "#2a2218"}` : "none",
          background: dragOver
            ? G + "22"
            : isSelected
              ? G + "14"
              : moving === item.id
                ? G + "10"
                : depth > 0
                  ? ((C?.bg || "#0b0906") + "0e")
                  : "transparent",
          borderLeft: dragOver
            ? `3px solid ${G}`
            : isSelected
              ? `3px solid ${G}`
              : "3px solid transparent",
          borderTop: dragOverPos === "above" ? `2px solid ${G}` : "none",
          borderBottom: dragOverPos === "below" ? `2px solid ${G}` : "none",
          opacity: item.visible ? 1 : 0.5,
          transition: "background 0.2s, border-color 0.2s",
          cursor: "grab",
          userSelect: "none",
        }}
        onClick={() => onEdit(item)}
      >
        {/* Expand toggle */}
        <button
          onClick={e => { e.stopPropagation(); setExpanded(v => !v); }}
          style={{
            background: "none", border: "none",
            cursor: hasChildren ? "pointer" : "default",
            color: hasChildren ? G : "transparent",
            fontSize: 10, padding: "2px 4px", lineHeight: 1, width: 16, flexShrink: 0,
            transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s",
          }}
        >{hasChildren ? "▶" : ""}</button>

        {depth > 0 && (
          <span style={{ color: C?.border || "#2a2218", fontSize: 12, marginRight: 2, flexShrink: 0 }}>
            └
          </span>
        )}

        {/* Reorder arrows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
          <button
            onClick={e => { e.stopPropagation(); onMove(item, siblings, "up"); }}
            disabled={idx === 0 || !!moving}
            style={{
              background: "none", border: "none",
              cursor: idx === 0 ? "default" : "pointer",
              color: idx === 0 ? (C?.grey2 || "#5a5045") : (C?.grey || "#8a7d6a"),
              fontSize: 9, padding: 1,
            }}
          >▲</button>
          <button
            onClick={e => { e.stopPropagation(); onMove(item, siblings, "down"); }}
            disabled={idx === siblings.length - 1 || !!moving}
            style={{
              background: "none", border: "none",
              cursor: idx === siblings.length - 1 ? "default" : "pointer",
              color: idx === siblings.length - 1 ? (C?.grey2 || "#5a5045") : (C?.grey || "#8a7d6a"),
              fontSize: 9, padding: 1,
            }}
          >▼</button>
        </div>

        {/* Label + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{
              fontFamily: SANS, fontSize: 12,
              fontWeight: isSelected ? 600 : (depth === 0 ? 500 : 400),
              color: isSelected ? (C?.white || "#f5efe4") : (C?.off || "#d4c8b0"),
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              maxWidth: "140px",
            }}>
              {item.label}
            </span>
            <TypeBadge type={item.type || "link"} visible={item.visible} />
          </div>
          {(item.slug || item.url || item.nav_action || (item.link_type && item.link_type !== "manual")) && (
            <div style={{
              fontFamily: MONO, fontSize: 9, color: C?.grey || "#8a7d6a", marginTop: 1,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>
              {item.link_type && item.link_type !== "manual" && item.link_type !== "spa_action"
                ? `[${item.link_type}] ${item.link_record_slug || ""}`
                : item.nav_action
                  ? `action:${item.nav_action}`
                  : item.url || (item.slug ? `/${item.slug}` : "")
              }
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div
          style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}
          onClick={e => e.stopPropagation()}
        >
          {depth < MAX_DEPTH && (item.type === "dropdown" || item.type === "mega_menu") &&
            qBtn("+ Child", () => onAddChild(item.id))
          }
          {qBtn(item.visible ? "Hide" : "Show", () => onToggleVisible(item))}
          {qBtn(
            deleting === item.id ? "..." : "Remove",
            () => onDelete(item),
            { danger: true, disabled: deleting === item.id || hasChildren },
          )}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ borderLeft: `1px solid ${C?.border || "#2a2218"}33`, marginLeft: 14 + depth * 22 + 38 }}>
          {item.children.map(child => (
            <TreeNode
              key={child.id}
              item={child} siblings={item.children} depth={depth + 1}
              onEdit={onEdit} onAddChild={onAddChild}
              onDelete={onDelete} onToggleVisible={onToggleVisible} onMove={onMove}
              C={C} deleting={deleting} moving={moving} selectedItemId={selectedItemId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Menu Tree Panel ────────────────────────────────────────────────────────
export default function MenuTreePanel({
  tree, loading, C,
  onEdit, onAddChild, onDelete, onToggleVisible, onMove,
  deleting, moving, selectedItemId,
}) {
  const G = C?.gold || "#c9a84c";

  return (
    <div>
      {/* Tree container */}
      <div style={{
        background: C?.card || "#1a1510",
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 10, overflow: "hidden",
      }}>
        {loading ? (
          <div style={{ padding: 48, textAlign: "center", fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a" }}>
            Loading...
          </div>
        ) : tree.length === 0 ? (
          <div style={{ padding: 48, textAlign: "center" }}>
            <div style={{ fontFamily: SERIF, fontSize: 20, color: C?.off || "#d4c8b0", marginBottom: 10 }}>
              No nav items yet
            </div>
            <div style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a" }}>
              Click "+ Add Item" to start building your navigation.
            </div>
          </div>
        ) : (
          <div>
            {/* Column headers */}
            <div style={{
              display: "flex", justifyContent: "space-between",
              padding: "10px 16px 10px 76px",
              background: (C?.bg || "#0b0906") + "80",
              borderBottom: `1px solid ${C?.border || "#2a2218"}`,
            }}>
              <span style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a",
              }}>Label / Path</span>
              <span style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a",
              }}>Actions</span>
            </div>

            {tree.map(item => (
              <TreeNode
                key={item.id}
                item={item} siblings={tree} depth={0}
                onEdit={onEdit} onAddChild={onAddChild}
                onDelete={onDelete} onToggleVisible={onToggleVisible} onMove={onMove}
                C={C} deleting={deleting} moving={moving} selectedItemId={selectedItemId}
              />
            ))}
          </div>
        )}
      </div>

      {/* Type legend */}
      <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        <span style={{
          fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
          textTransform: "uppercase", color: C?.grey || "#8a7d6a",
        }}>Types:</span>
        {Object.entries(TYPE_BADGE_DEF).map(([key, b]) => (
          <span key={key} style={{
            fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", background: b.bg, border: `1px solid ${b.border}`,
            borderRadius: 4, padding: "2px 7px", color: b.color,
          }}>{b.label}</span>
        ))}
        <span style={{
          fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          textTransform: "uppercase", background: "#2a1010", border: "1px solid #4a2020",
          borderRadius: 4, padding: "2px 7px", color: "#f87171",
        }}>Hidden</span>
      </div>

      {/* Info note */}
      <div style={{
        marginTop: 10, padding: "12px 16px",
        background: G + "0d", border: `1px solid ${G}28`,
        borderRadius: 8, fontFamily: SANS, fontSize: 11,
        color: C?.grey || "#8a7d6a", lineHeight: 1.7,
      }}>
        Click any row to open its editor. Dropdown and Mega Menu items have a full Design tab. Max 2 levels deep.
      </div>
    </div>
  );
}
