// MagazineNavModule.jsx
// Editorial Navigation System — orchestrator
// Manages magazine categories, sections, and editorial hierarchy
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import MagazineSectionsEditor from "./MagazineSectionsEditor.jsx";
import MagazinePostMappingEditor from "./MagazinePostMappingEditor.jsx";

const SANS = "'Inter', 'Helvetica Neue', sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";

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

// ── Main Module ────────────────────────────────────────────────────────────
export default function MagazineNavModule({ C }) {
  const G = C?.gold || "#c9a84c";

  // ── State ───────────────────────────────────────────────────────────────
  const [navItems, setNavItems] = useState([]);
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── Selection & editing ────────────────────────────────────────────────
  const [selectedNavId, setSelectedNavId] = useState(null);
  const [editingNav, setEditingNav] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [editingSection, setEditingSection] = useState(null);

  // ── UI state ───────────────────────────────────────────────────────────
  const [tab, setTab] = useState("nav"); // "nav" | "sections"
  const [toast, setToast] = useState(null);
  const [reordering, setReordering] = useState(false);

  // ── Load data ────────────────────────────────────────────────────────────
  async function loadData() {
    try {
      console.log("🔄 Loading magazine data...");
      const [navRes, sectionsRes] = await Promise.all([
        supabase
          .from("mag_nav_items")
          .select("*")
          .order("position", { ascending: true }),
        supabase
          .from("mag_sections")
          .select("*")
          .order("position", { ascending: true }),
      ]);

      if (navRes.error) throw navRes.error;
      if (sectionsRes.error) throw sectionsRes.error;

      console.log("✅ Loaded nav items:", navRes.data?.length);
      console.log("✅ Loaded sections:", sectionsRes.data?.length);

      setNavItems(navRes.data || []);
      setSections(sectionsRes.data || []);
      setLoading(false);
    } catch (err) {
      console.error("❌ Load error:", err);
      setToast({ msg: "Load failed: " + err.message, type: "error" });
      setLoading(false);
    }
  }

  useEffect(() => {
    console.log("🚀 MagazineNavModule mounted, loading data...");
    loadData();
  }, []);

  // ── Save nav item ───────────────────────────────────────────────────────
  async function saveNavItem(form) {
    try {
      if (editingNav) {
        const { error } = await supabase
          .from("mag_nav_items")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingNav.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mag_nav_items")
          .insert([{ ...form, position: navItems.length }]);
        if (error) throw error;
      }
      await loadData();
      setEditingNav(null);
      setSelectedNavId(null);
      setToast({ msg: "Saved", type: "success" });
    } catch (err) {
      setToast({ msg: "Save failed: " + err.message, type: "error" });
    }
  }

  // ── Delete nav item ────────────────────────────────────────────────────
  async function deleteNavItem(id) {
    try {
      const { error } = await supabase
        .from("mag_nav_items")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadData();
      setSelectedNavId(null);
      setEditingNav(null);
      setToast({ msg: "Deleted", type: "success" });
    } catch (err) {
      setToast({ msg: "Delete failed: " + err.message, type: "error" });
    }
  }

  // ── Reorder nav items ──────────────────────────────────────────────────
  async function reorderNav(items) {
    setReordering(true);
    try {
      await Promise.all(
        items.map((item, idx) =>
          supabase
            .from("mag_nav_items")
            .update({ position: idx })
            .eq("id", item.id)
        )
      );
      setNavItems(items);
      setToast({ msg: "Reordered", type: "success" });
    } catch (err) {
      setToast({ msg: "Reorder failed: " + err.message, type: "error" });
    } finally {
      setReordering(false);
    }
  }

  // ── Nav item editor ────────────────────────────────────────────────────
  function NavItemEditor() {
    const item = editingNav;
    const [form, setForm] = useState(item || { label: "", slug: "", visible: true });

    return (
      <div style={{
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 8, padding: 24, marginTop: 16, background: C?.card || "#1a1510",
      }}>
        <h3 style={{ fontFamily: SERIF, fontSize: 18, color: C?.white || "#f5efe4", marginBottom: 20 }}>
          {item ? "Edit Category" : "New Category"}
        </h3>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Label */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Label
            </label>
            <input
              value={form.label}
              onChange={e => setForm({ ...form, label: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
              placeholder="DESTINATIONS"
            />
          </div>

          {/* Slug */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Slug
            </label>
            <input
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
              placeholder="destinations"
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Description (optional)
            </label>
            <textarea
              value={form.description || ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4, minHeight: 80,
              }}
              placeholder="Optional description"
            />
          </div>

          {/* Visible toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              checked={form.visible}
              onChange={e => setForm({ ...form, visible: e.target.checked })}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <label style={{ fontFamily: SANS, fontSize: 13, color: C?.white || "#f5efe4", cursor: "pointer" }}>
              Show on navigation
            </label>
          </div>

          {/* Featured toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={e => setForm({ ...form, is_featured: e.target.checked })}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <label style={{ fontFamily: SANS, fontSize: 13, color: G, cursor: "pointer" }}>
              Featured category (highlight in UI)
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
          {item && (
            <button
              onClick={() => deleteNavItem(item.id)}
              style={{
                background: "#f87171", border: "none", borderRadius: 6, color: "#fff",
                padding: "9px 18px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
              }}
            >Delete</button>
          )}
          <button
            onClick={() => { setEditingNav(null); setSelectedNavId(null); }}
            style={{
              background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
              borderRadius: 6, color: C?.grey || "#8a7d6a",
              padding: "9px 20px", fontFamily: SANS, fontSize: 12, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={() => saveNavItem(form)}
            style={{
              background: G, border: "none", borderRadius: 6, color: "#0a0906",
              padding: "9px 24px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
            }}
          >Save</button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "0 0 80px" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <p style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", margin: 0, lineHeight: 1.6 }}>
          Manage magazine navigation structure and editorial sections.
        </p>
        {tab === "nav" && (
          <button
            onClick={() => setEditingNav({})}
            style={{
              background: G, border: "none", borderRadius: 8, color: "#0a0906",
              padding: "11px 22px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
              letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
            }}
          >+ Add Category</button>
        )}
      </div>

      {/* Tab switcher */}
      <div style={{
        display: "flex", gap: 2, marginBottom: 24,
        background: C?.bg || "#0b0906",
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 8, padding: 4, width: "fit-content",
      }}>
        {[["nav", "Navigation"], ["sections", "Sections"], ["mapping", "Post Mapping"]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} style={{
            background: tab === key ? G : "transparent",
            border: `1px solid ${tab === key ? G : "transparent"}`,
            borderRadius: 6, padding: "8px 14px", cursor: "pointer",
            fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: tab === key ? "#0a0906" : (C?.grey || "#8a7d6a"),
            transition: "all 0.15s",
          }}>{label}</button>
        ))}
      </div>

      {/* Navigation tab */}
      {tab === "nav" && (
        <div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 40, color: C?.grey || "#8a7d6a" }}>Loading...</div>
          ) : (
            <>
              {/* List */}
              <div style={{
                display: "grid", gap: 8, marginBottom: 24,
              }}>
                {navItems.map((item, idx) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: 16, background: C?.card || "#1a1510",
                      border: `1px solid ${C?.border || "#2a2218"}`,
                      borderRadius: 6, cursor: "pointer",
                      transition: "all 0.15s",
                    }}
                    onClick={() => {
                      setSelectedNavId(item.id);
                      setEditingNav(item);
                    }}
                  >
                    {/* Drag handle */}
                    <div style={{
                      display: "flex", gap: 2, flexDirection: "column",
                      opacity: 0.4, cursor: "grab",
                    }}>
                      <span style={{ fontSize: 10, color: C?.white || "#f5efe4" }}>⋮⋮</span>
                    </div>

                    {/* Content */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{
                        fontFamily: SANS, fontWeight: 700, fontSize: 13,
                        color: selectedNavId === item.id ? G : (C?.white || "#f5efe4"),
                      }}>
                        {item.label}
                      </div>
                      <div style={{
                        fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a",
                        marginTop: 2,
                      }}>
                        {item.slug}
                      </div>
                    </div>

                    {/* Status badges */}
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      {!item.visible && (
                        <span style={{
                          fontFamily: SANS, fontSize: 9, fontWeight: 700,
                          color: "#f87171", textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>Hidden</span>
                      )}
                      {item.is_featured && (
                        <span style={{
                          fontFamily: SANS, fontSize: 9, fontWeight: 700,
                          color: G, textTransform: "uppercase", letterSpacing: "0.06em",
                        }}>Featured</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Editor */}
              {editingNav && <NavItemEditor />}
            </>
          )}
        </div>
      )}

      {/* Sections tab */}
      {tab === "sections" && (
        <MagazineSectionsEditor navItems={navItems} C={C} />
      )}

      {/* Post Mapping tab */}
      {tab === "mapping" && (
        <MagazinePostMappingEditor C={C} />
      )}
    </div>
  );
}
