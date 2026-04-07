// MagazineSectionsEditor.jsx
// Editorial Sections Management — manage curated sections within magazine categories
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

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

// ── Sections Editor ────────────────────────────────────────────────────────
export default function MagazineSectionsEditor({ navItems, C }) {
  const G = C?.gold || "#c9a84c";

  // ── State ─────────────────────────────────────────────────────────────
  const [sections, setSections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedNavId, setSelectedNavId] = useState(null);
  const [selectedSectionId, setSelectedSectionId] = useState(null);
  const [editingSection, setEditingSection] = useState(null);
  const [toast, setToast] = useState(null);

  // ── Load sections ──────────────────────────────────────────────────────
  async function loadSections() {
    try {
      const { data, error } = await supabase
        .from("mag_sections")
        .select("*")
        .order("position", { ascending: true });

      if (error) throw error;
      setSections(data || []);
    } catch (err) {
      setToast({ msg: "Load failed: " + err.message, type: "error" });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadSections(); }, []);

  // ── Get sections for selected nav item ──────────────────────────────
  const sectionsForNav = selectedNavId
    ? sections.filter(s => s.mag_nav_item_id === selectedNavId)
    : [];

  // ── Save section ───────────────────────────────────────────────────────
  async function saveSection(form) {
    if (!selectedNavId) {
      setToast({ msg: "Select a category first", type: "error" });
      return;
    }

    try {
      if (editingSection) {
        const { error } = await supabase
          .from("mag_sections")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", editingSection.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("mag_sections")
          .insert([{
            ...form,
            mag_nav_item_id: selectedNavId,
            position: sectionsForNav.length,
          }]);
        if (error) throw error;
      }

      await loadSections();
      setEditingSection(null);
      setSelectedSectionId(null);
      setToast({ msg: "Saved", type: "success" });
    } catch (err) {
      setToast({ msg: "Save failed: " + err.message, type: "error" });
    }
  }

  // ── Delete section ────────────────────────────────────────────────────
  async function deleteSection(id) {
    try {
      const { error } = await supabase
        .from("mag_sections")
        .delete()
        .eq("id", id);
      if (error) throw error;
      await loadSections();
      setSelectedSectionId(null);
      setEditingSection(null);
      setToast({ msg: "Deleted", type: "success" });
    } catch (err) {
      setToast({ msg: "Delete failed: " + err.message, type: "error" });
    }
  }

  // ── Section editor form ────────────────────────────────────────────────
  function SectionForm() {
    const section = editingSection;
    const [form, setForm] = useState(section || {
      title: "",
      slug: "",
      description: "",
      hero_title: "",
      hero_subtitle: "",
      display_style: "grid",
      show_on_nav: true,
    });

    const displayStyles = [
      { value: "grid", label: "Grid (3-column card layout)" },
      { value: "editorial", label: "Editorial (text-first layout)" },
      { value: "mixed", label: "Mixed (image + text combination)" },
      { value: "featured", label: "Featured (hero image dominant)" },
    ];

    return (
      <div style={{
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 8, padding: 24, marginTop: 16, background: C?.card || "#1a1510",
      }}>
        <h3 style={{ fontFamily: SERIF, fontSize: 18, color: C?.white || "#f5efe4", marginBottom: 20 }}>
          {section ? "Edit Section" : "New Section"}
        </h3>

        <div style={{ display: "grid", gap: 16 }}>
          {/* Title */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Section Title
            </label>
            <input
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
              placeholder="Italy Destination Weddings"
            />
          </div>

          {/* Slug */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              URL Slug
            </label>
            <input
              value={form.slug}
              onChange={e => setForm({ ...form, slug: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
              placeholder="italy-destination-weddings"
            />
          </div>

          {/* Description */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Description
            </label>
            <textarea
              value={form.description || ""}
              onChange={e => setForm({ ...form, description: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4, minHeight: 80,
              }}
              placeholder="Long-form description of this editorial section..."
            />
          </div>

          {/* Hero Title */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Hero Title (shown on section page)
            </label>
            <input
              value={form.hero_title || ""}
              onChange={e => setForm({ ...form, hero_title: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
              placeholder="Plan Your Italian Wedding"
            />
          </div>

          {/* Hero Subtitle */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Hero Subtitle
            </label>
            <input
              value={form.hero_subtitle || ""}
              onChange={e => setForm({ ...form, hero_subtitle: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
              placeholder="Discover Tuscany's most romantic venues"
            />
          </div>

          {/* Display Style */}
          <div>
            <label style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", display: "block", marginBottom: 8 }}>
              Display Style
            </label>
            <select
              value={form.display_style}
              onChange={e => setForm({ ...form, display_style: e.target.value })}
              style={{
                width: "100%", fontFamily: SANS, fontSize: 13, padding: "10px 12px",
                background: C?.bg || "#0b0906", border: `1px solid ${C?.border || "#2a2218"}`,
                color: C?.white || "#f5efe4", borderRadius: 4,
              }}
            >
              {displayStyles.map(style => (
                <option key={style.value} value={style.value}>
                  {style.label}
                </option>
              ))}
            </select>
          </div>

          {/* Show on nav toggle */}
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <input
              type="checkbox"
              checked={form.show_on_nav}
              onChange={e => setForm({ ...form, show_on_nav: e.target.checked })}
              style={{ width: 18, height: 18, cursor: "pointer" }}
            />
            <label style={{ fontFamily: SANS, fontSize: 13, color: C?.white || "#f5efe4", cursor: "pointer" }}>
              Show this section in navigation
            </label>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 8, marginTop: 24, justifyContent: "flex-end" }}>
          {section && (
            <button
              onClick={() => deleteSection(section.id)}
              style={{
                background: "#f87171", border: "none", borderRadius: 6, color: "#fff",
                padding: "9px 18px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
                letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
              }}
            >Delete</button>
          )}
          <button
            onClick={() => { setEditingSection(null); setSelectedSectionId(null); }}
            style={{
              background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
              borderRadius: 6, color: C?.grey || "#8a7d6a",
              padding: "9px 20px", fontFamily: SANS, fontSize: 12, fontWeight: 600,
              letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
            }}
          >Cancel</button>
          <button
            onClick={() => saveSection(form)}
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
    <div>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      <p style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", marginBottom: 20, lineHeight: 1.6 }}>
        Create editorial sections within each category. Each section can have its own hero content, featured post, and display style.
      </p>

      {loading ? (
        <div style={{ textAlign: "center", padding: 40, color: C?.grey || "#8a7d6a" }}>Loading...</div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
          {/* Left: Category selector */}
          <div>
            <h4 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>
              SELECT CATEGORY
            </h4>
            <div style={{ display: "grid", gap: 6 }}>
              {navItems.map(nav => (
                <button
                  key={nav.id}
                  onClick={() => {
                    setSelectedNavId(nav.id);
                    setSelectedSectionId(null);
                    setEditingSection(null);
                  }}
                  style={{
                    padding: 12, textAlign: "left", border: `1px solid ${selectedNavId === nav.id ? G : (C?.border || "#2a2218")}`,
                    background: selectedNavId === nav.id ? `${G}20` : (C?.card || "#1a1510"),
                    borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                    fontFamily: SANS, fontSize: 13, fontWeight: selectedNavId === nav.id ? 700 : 400,
                    color: selectedNavId === nav.id ? G : (C?.white || "#f5efe4"),
                  }}
                >
                  {nav.label}
                </button>
              ))}
            </div>
          </div>

          {/* Right: Sections list & editor */}
          <div>
            {selectedNavId ? (
              <div>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h4 style={{ fontFamily: SANS, fontSize: 12, fontWeight: 700, color: G, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                    SECTIONS FOR THIS CATEGORY
                  </h4>
                  <button
                    onClick={() => setEditingSection({})}
                    style={{
                      background: G, border: "none", borderRadius: 4, color: "#0a0906",
                      padding: "6px 12px", fontFamily: SANS, fontSize: 11, fontWeight: 700,
                      letterSpacing: "0.06em", textTransform: "uppercase", cursor: "pointer",
                    }}
                  >+ Add Section</button>
                </div>

                {/* Sections list */}
                <div style={{ display: "grid", gap: 6, marginBottom: 16 }}>
                  {sectionsForNav.length === 0 ? (
                    <div style={{ padding: 16, textAlign: "center", color: C?.grey || "#8a7d6a", fontFamily: SANS, fontSize: 12 }}>
                      No sections yet. Create one!
                    </div>
                  ) : (
                    sectionsForNav.map(section => (
                      <button
                        key={section.id}
                        onClick={() => {
                          setSelectedSectionId(section.id);
                          setEditingSection(section);
                        }}
                        style={{
                          padding: 12, textAlign: "left", border: `1px solid ${selectedSectionId === section.id ? G : (C?.border || "#2a2218")}`,
                          background: selectedSectionId === section.id ? `${G}20` : (C?.card || "#1a1510"),
                          borderRadius: 6, cursor: "pointer", transition: "all 0.15s",
                          fontFamily: SANS, fontSize: 13, fontWeight: selectedSectionId === section.id ? 700 : 400,
                          color: selectedSectionId === section.id ? G : (C?.white || "#f5efe4"),
                        }}
                      >
                        <div style={{ marginBottom: 4 }}>{section.title}</div>
                        <div style={{ fontSize: 11, opacity: 0.6 }}>
                          {section.display_style} · {section.show_on_nav ? "visible" : "hidden"}
                        </div>
                      </button>
                    ))
                  )}
                </div>

                {/* Editor */}
                {editingSection && <SectionForm />}
              </div>
            ) : (
              <div style={{
                padding: 24, textAlign: "center", color: C?.grey || "#8a7d6a",
                fontFamily: SANS, fontSize: 13,
              }}>
                Select a category on the left to manage its sections
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
