// FooterModule.jsx
// Footer Design Studio — orchestrator.
// Manages all state, data fetching, and wires together the split-panel UI.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabaseClient";

import {
  SANS, SERIF,
  DEFAULT_FOOTER_CONFIG, blankFooterItem, itemToFooterForm,
  ICONIC_STRIP_COL,
} from "./footer/footerUtils.js";
import FooterColumnPanel  from "./footer/FooterColumnPanel.jsx";
import FooterBlockEditor  from "./footer/FooterBlockEditor.jsx";
import FooterConfig       from "./footer/FooterConfig.jsx";
import FooterCanvas       from "./footer/FooterCanvas.jsx";

// ── Toast ──────────────────────────────────────────────────────────────────
function Toast({ msg, type, onDone }) {
  const G = "#c9a84c";
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: 28, right: 28, zIndex: 9999,
      background: type === "error" ? "#2a1010" : "#0e1a0e",
      border: `1px solid ${type === "error" ? "#f87171" : G}`,
      borderLeft: `3px solid ${type === "error" ? "#f87171" : G}`,
      color: type === "error" ? "#f87171" : "#4ade80",
      padding: "12px 20px", borderRadius: 8,
      fontFamily: SANS, fontSize: 13, boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}>{msg}</div>
  );
}

// ── Delete Confirmation Dialog ─────────────────────────────────────────────
function DeleteDialog({ item, onConfirm, onCancel, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9000,
      background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)",
      display: "flex", alignItems: "center", justifyContent: "center",
    }} onClick={onCancel}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C?.card || "#1a1510",
        border: "1px solid #4a2020", borderTop: "2px solid #f87171",
        borderRadius: 12, padding: "32px 36px", maxWidth: 420, width: "90vw",
        boxShadow: "0 24px 80px rgba(0,0,0,0.7)",
      }}>
        <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#f87171", marginBottom: 10 }}>
          Confirm Remove
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 22, color: C?.white || "#f5efe4", marginBottom: 10 }}>
          Remove "{item.label || item.block_type}"?
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", lineHeight: 1.7, marginBottom: 28 }}>
          This will permanently remove this block from your footer.
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button onClick={onCancel} style={{
            background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, color: C?.grey || "#8a7d6a",
            padding: "9px 20px", fontFamily: SANS, fontSize: 12, fontWeight: 600,
            letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
          }}>Cancel</button>
          <button onClick={onConfirm} style={{
            background: "#f87171", border: "none", borderRadius: 6, color: "#fff",
            padding: "9px 24px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
          }}>Remove</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────
export default function FooterModule({ C }) {
  const G = C?.gold || "#c9a84c";

  // ── Items state ──────────────────────────────────────────────────────────
  const [allItems, setAllItems]   = useState([]);
  const [loading, setLoading]     = useState(true);

  // ── Config state ─────────────────────────────────────────────────────────
  const [footerConfig, setFooterConfig]       = useState(DEFAULT_FOOTER_CONFIG);
  const [configSaving, setConfigSaving]       = useState(false);

  // ── Selection & editing state ─────────────────────────────────────────────
  const [selectedItemId, setSelectedItemId]   = useState(null);
  const [editingItem, setEditingItem]         = useState(null);
  const [draftForm, setDraftForm]             = useState(null);

  // ── UI state ─────────────────────────────────────────────────────────────
  const [leftTab, setLeftTab]     = useState("blocks");  // "blocks" | "config"
  const [toast, setToast]         = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [moving, setMoving]       = useState(null);

  const editorRef = useRef(null);

  // ── Load footer items ─────────────────────────────────────────────────────
  async function load() {
    const { data, error } = await supabase
      .from("footer_items")
      .select("*")
      .order("column_id", { ascending: true })
      .order("position", { ascending: true });
    if (error) {
      setToast({ msg: "Failed to load items: " + error.message, type: "error" });
    } else {
      setAllItems(data || []);
    }
    setLoading(false);
  }

  // ── Load footer config ────────────────────────────────────────────────────
  async function loadConfig() {
    const { data } = await supabase
      .from("footer_config")
      .select("*")
      .eq("id", "homepage")
      .maybeSingle();
    if (data) setFooterConfig({ ...DEFAULT_FOOTER_CONFIG, ...data });
  }

  useEffect(() => { load(); loadConfig(); }, []);

  // ── Select item from panel or canvas ─────────────────────────────────────
  function handleSelectItem(item) {
    const fullItem = allItems.find(i => i.id === item.id) || item;
    setSelectedItemId(fullItem.id);
    setEditingItem(fullItem);
    setDraftForm(null);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  // ── Close editor ──────────────────────────────────────────────────────────
  function handleCloseEditor() {
    setSelectedItemId(null);
    setEditingItem(null);
    setDraftForm(null);
  }

  // ── Add new block in a given column ──────────────────────────────────────
  async function handleAdd(columnId) {
    const colItems = allItems.filter(i => i.column_id === columnId);
    const nextPos  = colItems.length > 0 ? Math.max(...colItems.map(i => i.position)) + 1 : 1;
    const blank    = { ...blankFooterItem(columnId), position: nextPos };
    try {
      const { data, error } = await supabase
        .from("footer_items")
        .insert([blank])
        .select()
        .single();
      if (error) throw error;
      await load();
      // Select the new item
      setSelectedItemId(data.id);
      setEditingItem(data);
      setDraftForm(null);
      setTimeout(() => {
        editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 80);
    } catch (e) {
      setToast({ msg: "Add failed: " + e.message, type: "error" });
    }
  }

  // ── Save block ────────────────────────────────────────────────────────────
  async function handleSave(form) {
    if (!editingItem) return;
    try {
      const { error } = await supabase
        .from("footer_items")
        .update({ ...form, updated_at: new Date().toISOString() })
        .eq("id", editingItem.id);
      if (error) throw error;
      await load();
      const fresh = allItems.find(i => i.id === editingItem.id);
      if (fresh) setEditingItem({ ...fresh, ...form });
      setToast({ msg: "Block saved", type: "success" });
    } catch (e) {
      setToast({ msg: "Save failed: " + e.message, type: "error" });
    }
  }

  // ── Toggle visibility ─────────────────────────────────────────────────────
  async function handleToggleVisible(item) {
    try {
      await supabase
        .from("footer_items")
        .update({ visible: !item.visible, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      await load();
    } catch (e) {
      setToast({ msg: "Update failed: " + e.message, type: "error" });
    }
  }

  // ── Remove block ──────────────────────────────────────────────────────────
  function handleRemove(item) {
    setConfirmDelete(item);
  }

  async function confirmDeleteExecute() {
    const item = confirmDelete;
    setConfirmDelete(null);
    try {
      const { error } = await supabase.from("footer_items").delete().eq("id", item.id);
      if (error) throw error;
      if (selectedItemId === item.id) handleCloseEditor();
      setToast({ msg: "Block removed", type: "success" });
      await load();
    } catch (e) {
      setToast({ msg: "Remove failed: " + e.message, type: "error" });
    }
  }

  // ── Reorder (swap positions) ──────────────────────────────────────────────
  async function handleMoveUp(item) {
    const siblings = allItems
      .filter(i => i.column_id === item.column_id)
      .sort((a, b) => a.position - b.position);
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx <= 0) return;
    const swap = siblings[idx - 1];
    setMoving(item.id);
    try {
      await Promise.all([
        supabase.from("footer_items").update({ position: swap.position }).eq("id", item.id),
        supabase.from("footer_items").update({ position: item.position }).eq("id", swap.id),
      ]);
      await load();
    } catch (e) {
      setToast({ msg: "Reorder failed: " + e.message, type: "error" });
    } finally { setMoving(null); }
  }

  async function handleMoveDown(item) {
    const siblings = allItems
      .filter(i => i.column_id === item.column_id)
      .sort((a, b) => a.position - b.position);
    const idx = siblings.findIndex(s => s.id === item.id);
    if (idx < 0 || idx >= siblings.length - 1) return;
    const swap = siblings[idx + 1];
    setMoving(item.id);
    try {
      await Promise.all([
        supabase.from("footer_items").update({ position: swap.position }).eq("id", item.id),
        supabase.from("footer_items").update({ position: item.position }).eq("id", swap.id),
      ]);
      await load();
    } catch (e) {
      setToast({ msg: "Reorder failed: " + e.message, type: "error" });
    } finally { setMoving(null); }
  }

  // ── Drag-and-drop reorder ────────────────────────────────────────────────
  async function handleReorder(draggedItem, targetItem) {
    if (!draggedItem || !targetItem || draggedItem.id === targetItem.id) return;
    if (draggedItem.column_id !== targetItem.column_id) return;
    const siblings = allItems
      .filter(i => i.column_id === draggedItem.column_id)
      .sort((a, b) => a.position - b.position);
    const withoutDragged = siblings.filter(i => i.id !== draggedItem.id);
    const targetIdx = withoutDragged.findIndex(i => i.id === targetItem.id);
    withoutDragged.splice(targetIdx, 0, draggedItem);
    setMoving(draggedItem.id);
    try {
      await Promise.all(
        withoutDragged.map((item, idx) =>
          supabase.from("footer_items").update({ position: idx + 1 }).eq("id", item.id)
        )
      );
      await load();
    } catch (e) {
      setToast({ msg: "Reorder failed: " + e.message, type: "error" });
    } finally { setMoving(null); }
  }

  // ── Reorder a locked group (heading + items beneath) ────────────────────
  async function handleReorderGroup(groupItems, targetItem) {
    if (!groupItems?.length || !targetItem) return;
    const colId = groupItems[0].column_id;
    const siblings = allItems.filter(i => i.column_id === colId).sort((a, b) => a.position - b.position);
    const groupIds = new Set(groupItems.map(i => i.id));
    const withoutGroup = siblings.filter(i => !groupIds.has(i.id));
    const targetIdx = withoutGroup.findIndex(i => i.id === targetItem.id);
    const insertAt = targetIdx < 0 ? withoutGroup.length : targetIdx;
    const reordered = [
      ...withoutGroup.slice(0, insertAt),
      ...groupItems,
      ...withoutGroup.slice(insertAt),
    ];
    setMoving(groupItems[0].id);
    try {
      await Promise.all(
        reordered.map((item, idx) =>
          supabase.from("footer_items").update({ position: idx + 1 }).eq("id", item.id)
        )
      );
      await load();
    } catch (e) {
      setToast({ msg: "Group reorder failed: " + e.message, type: "error" });
    } finally { setMoving(null); }
  }

  // ── Swap entire columns (drag section header to reorder) ─────────────────
  async function handleReorderColumn(fromColId, toColId) {
    if (fromColId === toColId) return;
    const fromItems = allItems.filter(i => i.column_id === fromColId);
    const toItems   = allItems.filter(i => i.column_id === toColId);
    try {
      await Promise.all([
        ...fromItems.map(i => supabase.from("footer_items").update({ column_id: toColId }).eq("id", i.id)),
        ...toItems.map(i =>   supabase.from("footer_items").update({ column_id: fromColId }).eq("id", i.id)),
      ]);
      await load();
    } catch (e) {
      setToast({ msg: "Column reorder failed: " + e.message, type: "error" });
    }
  }

  // ── Save footer config ────────────────────────────────────────────────────
  async function handleSaveConfig() {
    setConfigSaving(true);
    try {
      const { error } = await supabase
        .from("footer_config")
        .upsert({ ...footerConfig, id: "homepage", updated_at: new Date().toISOString() });
      if (error) throw error;
      setToast({ msg: "Footer config saved", type: "success" });
    } catch (e) {
      setToast({ msg: "Config save failed: " + e.message, type: "error" });
    } finally { setConfigSaving(false); }
  }

  // ── Left tab styles ───────────────────────────────────────────────────────
  function tabStyle(tab) {
    const active = leftTab === tab;
    return {
      fontFamily: SANS, fontSize: 11, fontWeight: active ? 700 : 400,
      letterSpacing: "0.06em", textTransform: "uppercase",
      color: active ? G : C?.grey || "#8a7d6a",
      background: "none", border: "none",
      borderBottom: active ? `2px solid ${G}` : "2px solid transparent",
      padding: "8px 4px", cursor: "pointer",
      transition: "all 120ms",
    };
  }

  return (
    <div style={{ padding: "0 0 80px" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}
      {confirmDelete && (
        <DeleteDialog
          item={confirmDelete}
          onConfirm={confirmDeleteExecute}
          onCancel={() => setConfirmDelete(null)}
          C={C}
        />
      )}

      {/* ── Page header ── */}
      <div style={{ marginBottom: 24 }}>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", margin: 0, lineHeight: 1.6 }}>
          Control how your brand is presented at the base of every page. Manage your Iconic Venues strip, navigation structure, newsletter, and design system. Changes reflect instantly in the canvas.
        </p>
      </div>

      {/* ── Studio split layout ── */}
      <div style={{ display: "flex", gap: 24, alignItems: "start" }}>

        {/* ── LEFT PANEL (540px fixed) ── */}
        <div style={{
          display: "flex", flexDirection: "column", gap: 0,
          width: 540, flexShrink: 0,
        }}>

          {/* Left tab bar */}
          <div style={{
            display: "flex", gap: 16,
            borderBottom: `1px solid ${C?.border || "#2a2218"}`,
            marginBottom: 14,
          }}>
            <button style={tabStyle("blocks")} onClick={() => setLeftTab("blocks")}>Blocks</button>
            <button style={tabStyle("config")} onClick={() => setLeftTab("config")}>Config</button>
          </div>

          {/* Blocks tab */}
          {leftTab === "blocks" && (
            <>
              <FooterColumnPanel
                items={allItems}
                footerConfig={footerConfig}
                selectedItemId={selectedItemId}
                onSelect={handleSelectItem}
                onAdd={handleAdd}
                onMoveUp={handleMoveUp}
                onMoveDown={handleMoveDown}
                onReorder={handleReorder}
                onReorderGroup={handleReorderGroup}
                onReorderColumn={handleReorderColumn}
                onToggleVisible={handleToggleVisible}
                onRemove={handleRemove}
                C={C}
              />

              {/* Block editor (below column panel) */}
              <div ref={editorRef} style={{ marginTop: 16 }}>
                <FooterBlockEditor
                  item={editingItem}
                  onSave={handleSave}
                  onClose={handleCloseEditor}
                  onFormChange={setDraftForm}
                  C={C}
                />
              </div>
            </>
          )}

          {/* Config tab */}
          {leftTab === "config" && (
            <FooterConfig
              footerConfig={footerConfig}
              onConfigChange={setFooterConfig}
              onSave={handleSaveConfig}
              saving={configSaving}
              C={C}
            />
          )}
        </div>

        {/* ── RIGHT PANEL (flex, canvas) ── */}
        <div style={{
          flex: 1, minWidth: 0,
          position: "sticky", top: 24,
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
        }}>
          {loading ? (
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              height: 300, fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a",
            }}>Loading footer...</div>
          ) : (
            <FooterCanvas
              items={allItems}
              footerConfig={footerConfig}
              selectedItemId={selectedItemId}
              draftForm={draftForm}
              onSelectItem={handleSelectItem}
              C={C}
            />
          )}
        </div>
      </div>
    </div>
  );
}
