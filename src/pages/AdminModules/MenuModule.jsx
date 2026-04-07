// MenuModule.jsx
// Navigation Design Studio — orchestrator.
// Manages all state, data fetching, and wires together the split-panel UI.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";

import { SANS, SERIF, buildTree, DEFAULT_NAV_CONFIG } from "./menu/menuUtils.js";
import MenuTreePanel   from "./menu/MenuTreePanel.jsx";
import MenuItemEditor  from "./menu/MenuItemEditor.jsx";
import MenuNavConfig   from "./menu/MenuNavConfig.jsx";
import MenuCanvas      from "./menu/MenuCanvas.jsx";
import MenuBranding    from "./menu/MenuBranding.jsx";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

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
          Confirm Delete
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 22, color: C?.white || "#f5efe4", marginBottom: 10 }}>
          Remove "{item.label}"?
        </div>
        <div style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", lineHeight: 1.7, marginBottom: 28 }}>
          This will permanently remove the nav item from your site. This action cannot be undone.
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
          }}>Delete</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Module ────────────────────────────────────────────────────────────
export default function MenuModule({ C }) {
  const G = C?.gold || "#c9a84c";

  // ── Tree section selector ─────────────────────────────────────────────
  const SECTIONS = [
    { key: "directory", label: "Directory" },
    { key: "magazine", label: "Magazine" },
    // Future: { key: "shop", label: "Shop" },
  ];
  const [activeSection, setActiveSection] = useState("directory");

  // ── Nav items state ─────────────────────────────────────────────────────
  const [allItems, setAllItems]     = useState([]);
  const [tree, setTree]             = useState([]);
  const [loading, setLoading]       = useState(true);

  // ── Selection & editing state ───────────────────────────────────────────
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [editingItem, setEditingItem]       = useState(null);   // full item obj or null (new)
  const [editingParentId, setEditingParentId] = useState(null); // uuid when adding child

  const [draftForm, setDraftForm]     = useState(null); // live draft from editor (for canvas)

  // ── UI state ────────────────────────────────────────────────────────────
  const [leftTab, setLeftTab]         = useState("items"); // "items" | "config" | "branding"
  const [toast, setToast]             = useState(null);
  const [deleting, setDeleting]       = useState(null);   // item.id being deleted
  const [moving, setMoving]           = useState(null);   // item.id being reordered
  const [confirmDelete, setConfirmDelete] = useState(null);

  // ── Nav config state ────────────────────────────────────────────────────
  const [navConfig, setNavConfig]     = useState(DEFAULT_NAV_CONFIG);
  const [configSaving, setConfigSaving] = useState(false);

  // ── Refs ────────────────────────────────────────────────────────────────
  const leftPanelRef = useRef(null);
  const editorRef    = useRef(null);

  // ── Load nav items (filtered by active section) ──────────────────────────
  async function load() {
    const { data, error } = await supabase
      .from("nav_items")
      .select("*")
      .eq("section", activeSection)
      .order("position", { ascending: true });
    if (error) {
      setToast({ msg: "Failed to load: " + error.message, type: "error" });
    } else {
      const flat = data || [];
      setAllItems(flat);
      setTree(buildTree(flat));
    }
    setLoading(false);
  }

  // ── Load nav config ──────────────────────────────────────────────────────
  async function loadNavConfig() {
    const { data } = await supabase
      .from("nav_config")
      .select("*")
      .eq("id", "homepage")
      .maybeSingle();
    if (data) setNavConfig({ ...DEFAULT_NAV_CONFIG, ...data });
  }

  useEffect(() => { load(); loadNavConfig(); }, [activeSection]);

  // ── Select item (from tree or canvas click) ──────────────────────────────
  function handleSelectItem(item) {
    const fullItem = allItems.find(i => i.id === item.id) || item;
    setSelectedItemId(fullItem.id);
    setEditingItem(fullItem);
    setEditingParentId(null);
    setDraftForm(null);
    // Scroll left panel to editor
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  // ── Open new item form ───────────────────────────────────────────────────
  function handleAddNew(parentId = null) {
    setSelectedItemId(null);
    setEditingItem(null);
    setEditingParentId(parentId);
    setDraftForm(null);
    setTimeout(() => {
      editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  // ── Close editor ─────────────────────────────────────────────────────────
  function handleCloseEditor() {
    setSelectedItemId(null);
    setEditingItem(null);
    setEditingParentId(null);
    setDraftForm(null);
  }

  // ── Save nav item ─────────────────────────────────────────────────────────
  async function handleSave(form) {
    try {
      if (editingItem) {
        // Update — keep panel open, reload data in place
        const { error } = await supabase
          .from("nav_items")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingItem.id);
        if (error) throw error;
        const { data } = await supabase.from("nav_items").select("*").eq("section", activeSection).order("position", { ascending: true });
        const flat = data || [];
        setAllItems(flat);
        setTree(buildTree(flat));
        const fresh = flat.find(i => i.id === editingItem.id);
        if (fresh) setEditingItem(fresh);
      } else {
        // Insert new — close panel, toast (tag with current section)
        const siblings = allItems.filter(i => (i.parent_id ?? null) === (form.parent_id ?? null));
        const nextPos  = siblings.length > 0 ? Math.max(...siblings.map(i => i.position)) + 1 : 1;
        const { error } = await supabase.from("nav_items").insert([{ ...form, position: nextPos, section: activeSection }]);
        if (error) throw error;
        handleCloseEditor();
        await load();
        setToast({ msg: "Nav item added", type: "success" });
      }
    } catch (e) {
      setToast({ msg: "Error: " + e.message, type: "error" });
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  function handleDelete(item) {
    if (item.children?.length > 0) {
      setToast({ msg: "Remove child items first", type: "error" }); return;
    }
    setConfirmDelete(item);
  }

  async function confirmDeleteExecute() {
    const item = confirmDelete;
    setConfirmDelete(null);
    setDeleting(item.id);
    try {
      const { error } = await supabase.from("nav_items").delete().eq("id", item.id);
      if (error) throw error;
      if (selectedItemId === item.id) handleCloseEditor();
      setToast({ msg: `"${item.label}" removed`, type: "success" });
      await load();
    } catch (e) {
      setToast({ msg: "Delete failed: " + e.message, type: "error" });
    } finally { setDeleting(null); }
  }

  // ── Toggle visibility ────────────────────────────────────────────────────
  async function handleToggleVisible(item) {
    try {
      const { error } = await supabase
        .from("nav_items")
        .update({ visible: !item.visible, updated_at: new Date().toISOString() })
        .eq("id", item.id);
      if (error) throw error;
      await load();
    } catch (e) { setToast({ msg: "Update failed: " + e.message, type: "error" }); }
  }

  // ── Reorder ───────────────────────────────────────────────────────────────
  async function handleMove(item, siblings, direction) {
    const idx = siblings.findIndex(s => s.id === item.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;
    const swap = siblings[swapIdx];
    setMoving(item.id);
    try {
      await Promise.all([
        supabase.from("nav_items").update({ position: swap.position }).eq("id", item.id),
        supabase.from("nav_items").update({ position: item.position }).eq("id", swap.id),
      ]);
      await load();
    } catch (e) {
      setToast({ msg: "Reorder failed: " + e.message, type: "error" });
    } finally { setMoving(null); }
  }

  // ── Save nav config ───────────────────────────────────────────────────────
  async function handleSaveNavConfig() {
    setConfigSaving(true);
    try {
      const { error } = await supabase
        .from("nav_config")
        .upsert({ ...navConfig, id: "homepage", updated_at: new Date().toISOString() });
      if (error) throw error;
      setToast({ msg: "Nav config saved", type: "success" });
    } catch (e) {
      setToast({ msg: "Config save failed: " + e.message, type: "error" });
    } finally { setConfigSaving(false); }
  }

  // ── Determine if editor is open ───────────────────────────────────────────
  const editorOpen = editingItem !== null || editingParentId !== null;

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", margin: 0, lineHeight: 1.6 }}>
          Build your navigation tree. Changes reflect instantly in the canvas.
        </p>
        <button
          onClick={() => handleAddNew(null)}
          style={{
            background: G, border: "none", borderRadius: 8, color: "#0a0906",
            padding: "11px 22px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
          }}
        >+ Add Item</button>
      </div>

      {/* ── Studio split layout ── */}
      <div style={{
        display: "flex",
        gap: 24, alignItems: "start",
        flexWrap: window.innerWidth < 1400 ? "wrap" : "nowrap",
      }}>

        {/* ── LEFT: tabs + tree + editor ── */}
        <div ref={leftPanelRef} style={{
          display: "flex", flexDirection: "column", gap: 0,
          width: window.innerWidth < 1400 ? "100%" : 750,
          flexShrink: window.innerWidth < 1400 ? 1 : 0,
          minWidth: 0,
        }}>

          {/* ── Section selector (Directory / Magazine / Shop) ── */}
          <div style={{
            display: "flex", gap: 8, marginBottom: 12, alignItems: "center",
          }}>
            <span style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em",
              textTransform: "uppercase", color: C?.grey || "#8a7d6a",
            }}>Tree:</span>
            {SECTIONS.map(s => (
              <button key={s.key} onClick={() => { setActiveSection(s.key); handleCloseEditor(); }} style={{
                background: activeSection === s.key ? (C?.bg || "#0b0906") : "transparent",
                border: `1px solid ${activeSection === s.key ? G : (C?.border || "#2a2218")}`,
                borderRadius: 20, padding: "5px 16px", cursor: "pointer",
                fontFamily: SERIF, fontSize: 13, fontStyle: "italic",
                color: activeSection === s.key ? G : (C?.grey || "#8a7d6a"),
                transition: "all 0.2s",
              }}>{s.label}</button>
            ))}
          </div>

          {/* Tab switcher */}
          <div style={{
            display: "flex", gap: 2, marginBottom: 16,
            background: C?.bg || "#0b0906",
            border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 8, padding: 4,
          }}>
            {[["items", "Items"], ["config", "Nav Config"], ["branding", "Branding"]].map(([key, label]) => (
              <button key={key} onClick={() => setLeftTab(key)} style={{
                flex: 1, background: leftTab === key ? G : "transparent",
                border: `1px solid ${leftTab === key ? G : "transparent"}`,
                borderRadius: 6, padding: "8px 14px", cursor: "pointer",
                fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: leftTab === key ? "#0a0906" : (C?.grey || "#8a7d6a"),
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>

          {/* Items tab */}
          {leftTab === "items" && (
            <>
              <MenuTreePanel
                tree={tree}
                loading={loading}
                C={C}
                selectedItemId={selectedItemId}
                deleting={deleting}
                moving={moving}
                onEdit={handleSelectItem}
                onAddChild={pid => handleAddNew(pid)}
                onDelete={handleDelete}
                onToggleVisible={handleToggleVisible}
                onMove={handleMove}
              />

              {/* Editor anchor */}
              <div ref={editorRef}>
                {editorOpen ? (
                  <MenuItemEditor
                    key={editingItem?.id || "new-" + editingParentId}
                    item={editingItem}
                    parentId={editingParentId}
                    allItems={allItems}
                    onSave={handleSave}
                    onClose={handleCloseEditor}
                    onFormChange={setDraftForm}
                    onAddNew={() => handleAddNew(null)}
                    C={C}
                  />
                ) : (
                  <MenuItemEditor
                    item={null}
                    parentId={undefined}
                    allItems={allItems}
                    onSave={handleSave}
                    onClose={null}
                    onFormChange={setDraftForm}
                    onAddNew={() => handleAddNew(null)}
                    C={C}
                  />
                )}
              </div>
            </>
          )}

          {/* Nav Config tab */}
          {leftTab === "config" && (
            <MenuNavConfig
              config={navConfig}
              onConfigChange={setNavConfig}
              onSave={handleSaveNavConfig}
              saving={configSaving}
              C={C}
            />
          )}

          {/* Branding tab */}
          {leftTab === "branding" && (
            <MenuBranding C={C} />
          )}

          {/* Magazine categories now managed as nav_items in the Items tab */}
        </div>

        {/* ── RIGHT: sticky live canvas ── */}
        <div style={{
          flex: 1, minWidth: 0,
          position: "sticky", top: 24,
          maxHeight: "calc(100vh - 140px)",
          overflowY: "auto",
        }}>
          <MenuCanvas
            items={allItems}
            C={C}
            selectedItemId={selectedItemId}
            draftForm={draftForm}
            navConfig={navConfig}
            onItemClick={handleSelectItem}
          />
        </div>

      </div>
    </div>
  );
}
