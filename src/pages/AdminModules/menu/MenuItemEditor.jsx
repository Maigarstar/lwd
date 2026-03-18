// menu/MenuItemEditor.jsx
// Inline item edit panel (no modal). Shows when an item is selected.
// Syncs every keystroke to the canvas via onFormChange.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useRef } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  SANS, SERIF, MONO,
  TYPE_OPTIONS, TYPE_BADGE_DEF, CTA_STYLES,
  ANIMATIONS, LAYOUT_TYPES, SHADOW_OPTIONS, ALIGN_OPTIONS,
  PRESETS, NAV_ACTION_OPTIONS,
  LINK_TYPE_OPTIONS, INTERNAL_PAGES,
  PANEL_WIDTH_OPTIONS,
  blankForm, itemToForm, toSlug, buildLinkUrl,
} from "./menuUtils.js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Placeholder when nothing is selected ─────────────────────────────────
function EmptyState({ onAddNew, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <div style={{
      padding: "32px 24px", textAlign: "center",
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10, marginTop: 16,
    }}>
      <div style={{ fontFamily: SERIF, fontSize: 18, color: C?.off || "#d4c8b0", marginBottom: 8 }}>
        Select an item to edit
      </div>
      <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", marginBottom: 20, lineHeight: 1.6 }}>
        Click any row in the tree above, or click a nav item in the canvas.
      </div>
      <button onClick={onAddNew} style={{
        background: G, border: "none", borderRadius: 7,
        color: "#0a0906", padding: "10px 22px",
        fontFamily: SANS, fontSize: 11, fontWeight: 700,
        letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer",
      }}>
        + Add New Item
      </button>
    </div>
  );
}

// ── Main editor component ──────────────────────────────────────────────────
export default function MenuItemEditor({
  item,           // null = new item
  parentId,       // uuid if adding child, else null
  allItems,       // flat list to check for siblings/parent
  onSave,
  onClose,
  onFormChange,
  onAddNew,
  C,
}) {
  const G = C?.gold || "#c9a84c";
  const [form, setForm] = useState(item ? itemToForm(item) : blankForm());
  const [slugManual, setSlugManual] = useState(!!(item?.slug));
  const [tab, setTab] = useState("structure");
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved]   = useState(false);

  // Dynamic linking state
  const [autoLabel, setAutoLabel]             = useState(false);
  const [venueCategories, setVenueCategories] = useState([]);
  const [countries, setCountries]             = useState([]);
  const [magCategories, setMagCategories]     = useState([]);
  const [recordSearch, setRecordSearch]       = useState("");

  // Magazine preview (canvas already shows this via effectiveItems, but keep for future ref)
  const [previewSubcats, setPreviewSubcats] = useState([]);
  const [previewPost, setPreviewPost]       = useState(null);

  // ── Reset form when item selection changes ─────────────────────────────
  useEffect(() => {
    const newForm = item ? itemToForm(item) : blankForm();
    setForm(newForm);
    setSlugManual(!!(item?.slug));
    setTab("structure");
    setAdvanced(false);
    setSaved(false);
    setAutoLabel(false);
    setRecordSearch("");
  }, [item?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync every form change to canvas ──────────────────────────────────
  useEffect(() => {
    if (onFormChange) onFormChange(form);
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Load magazine categories ───────────────────────────────────────────
  useEffect(() => {
    supabase
      .from("magazine_categories")
      .select("id, slug, name")
      .is("parent_category_slug", null)
      .order("name", { ascending: true })
      .then(({ data }) => setMagCategories(data || []));
  }, []);

  // ── Load dynamic records based on link_type ─────────────────────────────
  useEffect(() => {
    const lt = form.link_type;
    if (lt === "category") {
      supabase.from("listings").select("category").not("category", "is", null)
        .then(({ data }) => {
          const unique = [...new Set((data || []).map(r => r.category))].filter(Boolean).sort();
          setVenueCategories(unique);
        });
    } else if (lt === "country") {
      supabase.from("listings").select("country").not("country", "is", null)
        .then(({ data }) => {
          const unique = [...new Set((data || []).map(r => r.country))].filter(Boolean).sort();
          setCountries(unique);
        });
    }
  }, [form.link_type]);

  // ── Load magazine preview subcats ────────────────────────────────────
  useEffect(() => {
    const slug = form.mega_menu_source_slug;
    if (form.mega_menu_source !== "magazine_category" || !slug) {
      setPreviewSubcats([]); setPreviewPost(null); return;
    }
    Promise.all([
      supabase.from("magazine_categories").select("id, slug, name, description, short_description").eq("parent_category_slug", slug).order("name", { ascending: true }),
      supabase.from("magazine_posts").select("id, title, slug, featured_image, read_time").eq("category_slug", slug).eq("status", "published").order("published_at", { ascending: false }).limit(1),
    ]).then(([cats, posts]) => {
      setPreviewSubcats(cats.data || []);
      setPreviewPost(posts.data?.[0] || null);
    });
  }, [form.mega_menu_source, form.mega_menu_source_slug]);

  // ── Form helpers ──────────────────────────────────────────────────────
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLabelChange = val => {
    set("label", val);
    if (!slugManual) set("slug", toSlug(val));
  };

  const handleTypeChange = val => {
    setForm(f => ({
      ...f,
      type: val,
      is_cta: val === "cta",
      mega_menu_enabled: val === "mega_menu",
    }));
    if (val === "dropdown" || val === "mega_menu") setTab("design");
  };

  const applyPreset = key => {
    const preset = PRESETS[key];
    if (!preset) return;
    setForm(f => ({ ...f, menu_preset: key, ...preset.values }));
  };

  // ── Link type change ───────────────────────────────────────────────────
  const handleLinkTypeChange = val => {
    setAutoLabel(true);
    setRecordSearch("");
    setForm(f => ({
      ...f,
      link_type: val,
      link_record_slug: "",
      url: val === "parent_only" ? "" : f.url,
      nav_action: val === "parent_only" || val !== "spa_action" ? "" : f.nav_action,
    }));
  };

  // ── Record selected from dynamic list ─────────────────────────────────
  const handleRecordSelect = (slug, displayName) => {
    const url = buildLinkUrl(form.link_type, slug);
    setForm(f => ({
      ...f,
      link_record_slug: slug,
      url,
      label: autoLabel ? displayName : f.label,
      slug:  autoLabel ? toSlug(displayName) : f.slug,
    }));
  };

  // ── Save ──────────────────────────────────────────────────────────────
  async function handleSave() {
    if (!form.label.trim()) return;
    setSaving(true); setSaved(false);
    await onSave({ ...form, parent_id: parentId ?? item?.parent_id ?? null });
    setSaving(false);
    if (item) { setSaved(true); setTimeout(() => setSaved(false), 2200); }
  }

  // ── Style tokens ──────────────────────────────────────────────────────
  const inp = {
    width: "100%", boxSizing: "border-box",
    background: C?.dark || "#0d0d0d",
    border: `1px solid ${C?.border || "#2a2218"}`,
    borderRadius: 6, color: C?.white || "#f5efe4",
    fontFamily: SANS, fontSize: 13, padding: "9px 12px", outline: "none",
  };
  const lbl = {
    fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
    textTransform: "uppercase", color: C?.grey || "#8a7d6a", marginBottom: 5, display: "block",
  };
  const hint = { fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", marginTop: 4, lineHeight: 1.5 };
  const row2 = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 };
  const isPanel = form.type === "dropdown" || form.type === "mega_menu";

  // ── If no item selected AND no new item being added, show placeholder ──
  if (!item && !parentId && !onAddNew) return null;
  if (!item && parentId === undefined && onAddNew) {
    return <EmptyState onAddNew={onAddNew} C={C} />;
  }

  const itemLabel = item?.label || (parentId ? "New Child Item" : "New Nav Item");
  const itemTypeDef = TYPE_BADGE_DEF[item?.type || form.type] || TYPE_BADGE_DEF.link;

  // ── Searchable record list for dynamic linking ─────────────────────────
  function renderRecordPicker(records, displayFn = x => x) {
    const filtered = records.filter(r =>
      displayFn(r).toLowerCase().includes(recordSearch.toLowerCase())
    );
    return (
      <div>
        <input
          value={recordSearch}
          onChange={e => setRecordSearch(e.target.value)}
          placeholder="Search..."
          style={{ ...inp, marginBottom: 8 }}
        />
        <div style={{ maxHeight: 180, overflowY: "auto", display: "flex", flexDirection: "column", gap: 4 }}>
          {filtered.length === 0 && (
            <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", padding: "8px 0" }}>
              No results
            </div>
          )}
          {filtered.map((r, i) => {
            const name  = displayFn(r);
            const slug  = typeof r === "string" ? r : (r.slug || r);
            const isSelected = form.link_record_slug === slug;
            return (
              <button key={i} onClick={() => handleRecordSelect(slug, name)} style={{
                textAlign: "left", padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                background: isSelected ? G + "18" : "transparent",
                border: `1px solid ${isSelected ? G : (C?.border || "#2a2218")}`,
                fontFamily: SANS, fontSize: 12, fontWeight: isSelected ? 600 : 400,
                color: isSelected ? G : (C?.off || "#d4c8b0"),
                display: "flex", justifyContent: "space-between", alignItems: "center",
                transition: "all 0.15s",
              }}>
                {name}
                {isSelected && <span style={{ fontSize: 10 }}>✓</span>}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderTop: `2px solid ${G}`,
      borderRadius: 10, padding: 24,
      marginTop: 16,
    }}>

      {/* Editor header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div>
            <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: G, opacity: 0.7, marginBottom: 3 }}>
              {item ? "Editing" : parentId ? "New Child" : "New Item"}
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 18, color: C?.white || "#f5efe4", fontWeight: 500, lineHeight: 1.2 }}>
              {form.label || itemLabel}
            </div>
          </div>
          {item && (
            <span style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase",
              background: itemTypeDef.bg, border: `1px solid ${itemTypeDef.border}`,
              borderRadius: 4, padding: "2px 7px", color: itemTypeDef.color,
              flexShrink: 0, marginTop: 14,
            }}>{itemTypeDef.label}</span>
          )}
        </div>
        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: "none", color: C?.grey || "#8a7d6a",
            cursor: "pointer", fontSize: 18, lineHeight: 1, padding: 4,
          }}>×</button>
        )}
      </div>

      {/* Tabs — only for panel types */}
      {isPanel && (
        <div style={{ display: "flex", gap: 4, marginBottom: 24, borderBottom: `1px solid ${C?.border || "#2a2218"}` }}>
          {[["structure", "Structure"], ["design", "Design"]].map(([key, label]) => (
            <button key={key} onClick={() => setTab(key)} style={{
              background: "none", border: "none",
              borderBottom: `2px solid ${tab === key ? G : "transparent"}`,
              fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: tab === key ? G : (C?.grey || "#8a7d6a"),
              padding: "8px 16px 10px", cursor: "pointer", transition: "all 0.15s",
            }}>{label}</button>
          ))}
        </div>
      )}

      {/* ── STRUCTURE TAB ── */}
      {tab === "structure" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

          {/* Type selector */}
          <div>
            <label style={lbl}>Type *</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {TYPE_OPTIONS.map(opt => {
                const active = form.type === opt.value;
                const b = TYPE_BADGE_DEF[opt.value];
                return (
                  <button key={opt.value} onClick={() => handleTypeChange(opt.value)} style={{
                    background: active ? (b?.bg || "#1a1510") : "transparent",
                    border: `1px solid ${active ? (b?.border || G) : (C?.border || "#2a2218")}`,
                    borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: active ? (b?.color || G) : (C?.grey || "#8a7d6a"), letterSpacing: "0.04em" }}>
                      {opt.label}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a", marginTop: 2 }}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Label + Slug */}
          <div style={row2}>
            <div>
              <label style={lbl}>Label *</label>
              <input
                value={form.label}
                onChange={e => handleLabelChange(e.target.value)}
                placeholder="e.g. Browse Venues"
                style={{
                  ...inp,
                  ...(autoLabel && form.link_record_slug
                    ? { borderColor: G + "80", background: G + "0a" }
                    : {}),
                }}
              />
              {autoLabel && form.link_record_slug && (
                <div style={{ marginTop: 4, display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ ...hint, color: G, margin: 0 }}>Auto from record</span>
                  <button onClick={() => setAutoLabel(false)} style={{
                    background: "none", border: "none", cursor: "pointer",
                    fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a",
                    padding: 0, textDecoration: "underline",
                  }}>Custom</button>
                </div>
              )}
            </div>
            <div>
              <label style={lbl}>Slug (auto)</label>
              <div style={{ display: "flex", gap: 6 }}>
                <input
                  value={form.slug}
                  onChange={e => { setSlugManual(true); set("slug", e.target.value); }}
                  placeholder="browse-venues"
                  style={{ ...inp, flex: 1, fontFamily: MONO, fontSize: 12 }}
                />
                {slugManual && (
                  <button
                    onClick={() => { setSlugManual(false); set("slug", toSlug(form.label)); }}
                    title="Reset to auto"
                    style={{
                      background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
                      borderRadius: 6, color: C?.grey || "#8a7d6a", padding: "0 8px",
                      cursor: "pointer", fontSize: 12,
                    }}
                  >↺</button>
                )}
              </div>
              <div style={hint}>Used as /{form.slug || "slug"}</div>
            </div>
          </div>

          {/* ── Link Type System ── */}
          <div>
            <label style={lbl}>Link Type</label>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 14 }}>
              {LINK_TYPE_OPTIONS.map(opt => {
                // parent_only only valid for dropdown/mega_menu
                if (opt.value === "parent_only" && form.type === "link") return null;
                const active = form.link_type === opt.value;
                return (
                  <button key={opt.value} onClick={() => handleLinkTypeChange(opt.value)} style={{
                    textAlign: "left", padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                    background: active ? G + "14" : "transparent",
                    border: `1px solid ${active ? G : (C?.border || "#2a2218")}`,
                    transition: "all 0.15s",
                  }}>
                    <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: active ? 700 : 500, color: active ? G : (C?.off || "#d4c8b0"), letterSpacing: "0.02em" }}>
                      {opt.label}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 9, color: C?.grey || "#8a7d6a", marginTop: 2 }}>
                      {opt.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Auto-label toggle when a dynamic type is selected */}
            {["category", "mag_category", "country", "internal"].includes(form.link_type) && (
              <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS, fontSize: 12, color: C?.off || "#d4c8b0", marginBottom: 12 }}>
                <input
                  type="checkbox"
                  checked={autoLabel}
                  onChange={e => setAutoLabel(e.target.checked)}
                  style={{ accentColor: G }}
                />
                Auto-fill label from selected record
              </label>
            )}

            {/* Record pickers by link_type */}
            {form.link_type === "manual" && (
              <div>
                <label style={lbl}>URL</label>
                <input value={form.url} onChange={e => set("url", e.target.value)} placeholder="/venue or https://..." style={inp} />
                <div style={hint}>Leave blank to use the slug above.</div>
              </div>
            )}

            {form.link_type === "spa_action" && (
              <div>
                <label style={lbl}>SPA Action</label>
                <select value={form.nav_action} onChange={e => set("nav_action", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {NAV_ACTION_OPTIONS.map(o => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            )}

            {form.link_type === "internal" && (
              <div>
                <label style={lbl}>Internal Page</label>
                {renderRecordPicker(INTERNAL_PAGES, p => p.label)}
                {form.url && (
                  <div style={{ ...hint, marginTop: 8 }}>URL: <span style={{ fontFamily: MONO, fontSize: 10 }}>{form.url}</span></div>
                )}
              </div>
            )}

            {form.link_type === "category" && (
              <div>
                <label style={lbl}>Venue Category</label>
                {venueCategories.length === 0
                  ? <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a" }}>Loading categories...</div>
                  : renderRecordPicker(venueCategories)
                }
                {form.url && (
                  <div style={{ ...hint, marginTop: 8 }}>URL: <span style={{ fontFamily: MONO, fontSize: 10 }}>{form.url}</span></div>
                )}
              </div>
            )}

            {form.link_type === "country" && (
              <div>
                <label style={lbl}>Country / Destination</label>
                {countries.length === 0
                  ? <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a" }}>Loading countries...</div>
                  : renderRecordPicker(countries)
                }
                {form.url && (
                  <div style={{ ...hint, marginTop: 8 }}>URL: <span style={{ fontFamily: MONO, fontSize: 10 }}>{form.url}</span></div>
                )}
              </div>
            )}

            {form.link_type === "mag_category" && (
              <div>
                <label style={lbl}>Magazine Category</label>
                {magCategories.length === 0
                  ? <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a" }}>Loading...</div>
                  : renderRecordPicker(magCategories, c => c.name)
                }
                {form.url && (
                  <div style={{ ...hint, marginTop: 8 }}>URL: <span style={{ fontFamily: MONO, fontSize: 10 }}>{form.url}</span></div>
                )}
              </div>
            )}

            {form.link_type === "parent_only" && (
              <div style={{
                padding: "12px 16px",
                background: G + "0a", border: `1px solid ${G}28`,
                borderRadius: 7,
                fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", lineHeight: 1.6,
              }}>
                This item opens its children only. Add child items in the tree using "+ Child".
              </div>
            )}
          </div>

          {/* CTA style */}
          {form.type === "cta" && (
            <div>
              <label style={lbl}>CTA Style</label>
              <div style={{ display: "flex", gap: 8 }}>
                {CTA_STYLES.map(o => (
                  <button key={o.value} onClick={() => set("cta_style", o.value)} style={{
                    background: form.cta_style === o.value ? G + "22" : "transparent",
                    border: `1px solid ${form.cta_style === o.value ? G : (C?.border || "#2a2218")}`,
                    borderRadius: 6, padding: "7px 16px", cursor: "pointer",
                    fontFamily: SANS, fontSize: 11, fontWeight: 600,
                    color: form.cta_style === o.value ? G : (C?.grey || "#8a7d6a"),
                  }}>{o.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Toggles */}
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
            {[["visible", "Visible in nav"], ["open_new_tab", "New tab"], ["mobile_hidden", "Hide on mobile"]].map(([k, labelText]) => (
              <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0" }}>
                <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ accentColor: G }} />
                {labelText}
              </label>
            ))}
          </div>

          {/* Panel width (for dropdown/mega) */}
          {isPanel && (
            <div>
              <label style={lbl}>Panel Width</label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 10 }}>
                {PANEL_WIDTH_OPTIONS.map(opt => {
                  const active = (form.panel_width_mode || "full") === opt.value;
                  return (
                    <button key={opt.value} onClick={() => set("panel_width_mode", opt.value)} style={{
                      textAlign: "left", padding: "9px 12px", borderRadius: 7, cursor: "pointer",
                      background: active ? G + "14" : "transparent",
                      border: `1px solid ${active ? G : (C?.border || "#2a2218")}`,
                      transition: "all 0.15s",
                    }}>
                      <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: active ? 700 : 500, color: active ? G : (C?.off || "#d4c8b0") }}>
                        {opt.label}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 9, color: C?.grey || "#8a7d6a", marginTop: 1 }}>
                        {opt.desc}
                      </div>
                    </button>
                  );
                })}
              </div>
              {form.panel_width_mode === "custom" && (
                <div>
                  <label style={lbl}>Custom width (px)</label>
                  <input
                    type="number" min={200} max={1800}
                    value={form.panel_custom_width || 900}
                    onChange={e => set("panel_custom_width", Number(e.target.value))}
                    style={{ ...inp, width: "140px" }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Label font + colour */}
          <div style={row2}>
            <div>
              <label style={lbl}>Label Font</label>
              <select value={form.label_font || "sans"} onChange={e => set("label_font", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                <option value="sans">Sans-serif (Nunito)</option>
                <option value="serif">Serif (Cormorant)</option>
                <option value="mono">Monospace</option>
              </select>
            </div>
            <div>
              <label style={lbl}>Label Colour</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color" value={form.label_color || "#f5efe4"}
                  onChange={e => set("label_color", e.target.value)}
                  style={{ width: 36, height: 36, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 2 }}
                />
                <input
                  value={form.label_color || ""}
                  onChange={e => set("label_color", e.target.value)}
                  placeholder="Default (theme)"
                  style={{ ...inp, flex: 1, fontFamily: MONO, fontSize: 11 }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── DESIGN TAB ── */}
      {tab === "design" && isPanel && (
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>

          {/* Content Source */}
          <div>
            <label style={lbl}>Content Source</label>
            <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
              {[["manual", "Manual (child nav items)"], ["magazine_category", "Magazine Category"]].map(([val, labelText]) => (
                <button key={val} onClick={() => set("mega_menu_source", val)} style={{
                  flex: 1, background: form.mega_menu_source === val ? G + "18" : "transparent",
                  border: `1px solid ${form.mega_menu_source === val ? G : (C?.border || "#2a2218")}`,
                  borderRadius: 7, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                  fontFamily: SANS, fontSize: 12, fontWeight: 600,
                  color: form.mega_menu_source === val ? G : (C?.grey || "#8a7d6a"),
                  transition: "all 0.15s",
                }}>{labelText}</button>
              ))}
            </div>

            {form.mega_menu_source === "magazine_category" && (
              <div>
                <label style={lbl}>Magazine Category</label>
                {magCategories.length === 0 ? (
                  <div style={{ fontFamily: SANS, fontSize: 12, color: C?.grey || "#8a7d6a", padding: "10px 0" }}>Loading categories...</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
                    {magCategories.map(cat => {
                      const selected = form.mega_menu_source_slug === cat.slug;
                      return (
                        <button key={cat.id} onClick={() => set("mega_menu_source_slug", cat.slug)} style={{
                          background: selected ? G + "18" : "transparent",
                          border: `1px solid ${selected ? G : (C?.border || "#2a2218")}`,
                          borderRadius: 7, padding: "9px 14px", cursor: "pointer",
                          textAlign: "left", transition: "all 0.15s",
                          display: "flex", alignItems: "center", justifyContent: "space-between",
                        }}>
                          <span style={{ fontFamily: SANS, fontSize: 12, fontWeight: selected ? 600 : 400, color: selected ? G : (C?.off || "#d4c8b0") }}>
                            {cat.name}
                          </span>
                          {selected && <span style={{ fontSize: 11, color: G }}>✓</span>}
                        </button>
                      );
                    })}
                  </div>
                )}
                <div style={hint}>Subcategories and the latest article load automatically.</div>
              </div>
            )}
          </div>

          {/* Preset cards */}
          <div>
            <label style={lbl}>Style Preset</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 8 }}>
              {Object.entries(PRESETS).map(([key, preset]) => {
                const active = form.menu_preset === key;
                return (
                  <button key={key} onClick={() => applyPreset(key)} style={{
                    background: active ? (preset.swatch[0] + "dd") : "transparent",
                    border: `1.5px solid ${active ? G : (C?.border || "#2a2218")}`,
                    borderRadius: 8, padding: "10px 8px", cursor: "pointer", textAlign: "center",
                    transition: "all 0.15s",
                  }}>
                    <div style={{ display: "flex", gap: 3, justifyContent: "center", marginBottom: 8 }}>
                      {preset.swatch.map((c, i) => (
                        <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
                      ))}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: active ? G : (C?.off || "#d4c8b0"), letterSpacing: "0.04em", lineHeight: 1.3 }}>
                      {preset.label}
                    </div>
                    <div style={{ fontFamily: SANS, fontSize: 9, color: C?.grey || "#8a7d6a", marginTop: 3, lineHeight: 1.3 }}>
                      {preset.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Animation */}
          <div>
            <label style={lbl}>Open Animation</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {ANIMATIONS.map(a => (
                <button key={a.value} onClick={() => set("animation", a.value)} style={{
                  background: form.animation === a.value ? G + "22" : "transparent",
                  border: `1px solid ${form.animation === a.value ? G : (C?.border || "#2a2218")}`,
                  borderRadius: 6, padding: "6px 14px", cursor: "pointer",
                  fontFamily: SANS, fontSize: 11, fontWeight: 600,
                  color: form.animation === a.value ? G : (C?.grey || "#8a7d6a"),
                }}>{a.label}</button>
              ))}
            </div>
          </div>

          {/* Layout */}
          <div>
            <label style={lbl}>Layout</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {LAYOUT_TYPES.map(lt => (
                <button key={lt.value} onClick={() => set("layout_type", lt.value)} style={{
                  background: form.layout_type === lt.value ? "#160d28" : "transparent",
                  border: `1px solid ${form.layout_type === lt.value ? "#a78bfa" : (C?.border || "#2a2218")}`,
                  borderRadius: 6, padding: "6px 14px", cursor: "pointer",
                  fontFamily: SANS, fontSize: 11, fontWeight: 600,
                  color: form.layout_type === lt.value ? "#a78bfa" : (C?.grey || "#8a7d6a"),
                }}>{lt.label}</button>
              ))}
            </div>
          </div>

          {/* Content display toggles */}
          <div>
            <label style={lbl}>Content Display</label>
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
              {[["show_descriptions", "Show descriptions"], ["show_icons", "Show icons"], ["show_thumbnails", "Show thumbnails"], ["has_cta_in_panel", "CTA in panel"]].map(([k, labelText]) => (
                <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0" }}>
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} style={{ accentColor: G }} />
                  {labelText}
                </label>
              ))}
            </div>
          </div>

          {/* Panel CTA */}
          {form.has_cta_in_panel && (
            <div style={row2}>
              <div>
                <label style={lbl}>Panel CTA Label</label>
                <input value={form.panel_cta_label} onChange={e => set("panel_cta_label", e.target.value)} placeholder="View All Venues" style={inp} />
              </div>
              <div>
                <label style={lbl}>Panel CTA Link</label>
                <input value={form.panel_cta_link} onChange={e => set("panel_cta_link", e.target.value)} placeholder="/venue" style={inp} />
              </div>
            </div>
          )}

          {/* Featured card */}
          {(form.layout_type === "featured-right" || form.layout_type === "featured-left" || form.layout_type === "editorial") && (
            <div style={{ background: "#160d2844", border: "1px solid #3a1a5c55", borderRadius: 8, padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "#a78bfa" }}>Featured Card</div>
              <input value={form.featured_title} onChange={e => set("featured_title", e.target.value)} placeholder="Featured title" style={inp} />
              <input value={form.featured_text}  onChange={e => set("featured_text", e.target.value)}  placeholder="Short description" style={inp} />
              <div style={row2}>
                <input value={form.featured_image} onChange={e => set("featured_image", e.target.value)} placeholder="Image URL" style={inp} />
                <input value={form.featured_link}  onChange={e => set("featured_link", e.target.value)}  placeholder="/link" style={inp} />
              </div>
            </div>
          )}

          {/* Advanced styling */}
          <button onClick={() => setAdvanced(a => !a)} style={{
            background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, padding: "8px 16px", cursor: "pointer",
            fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            textTransform: "uppercase", color: C?.grey || "#8a7d6a",
            display: "flex", alignItems: "center", gap: 8, alignSelf: "flex-start",
          }}>
            {advanced ? "▲" : "▼"} Advanced Styling
          </button>

          {advanced && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16, background: (C?.bg || "#0b0906") + "60", borderRadius: 8, padding: 16, border: `1px solid ${C?.border || "#2a2218"}` }}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[
                  ["panel_bg", "Background"],
                  ["panel_text_color", "Text Color"],
                  ["panel_accent_color", "Accent"],
                  ["panel_hover_color", "Hover Color"],
                  ["panel_border_color", "Border Color"],
                ].map(([k, labelText]) => (
                  <div key={k}>
                    <label style={lbl}>{labelText}</label>
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <input type="color" value={form[k] || "#000000"} onChange={e => set(k, e.target.value)}
                        style={{ width: 36, height: 32, border: "none", borderRadius: 4, cursor: "pointer", background: "none", padding: 2 }} />
                      <input value={form[k] || ""} onChange={e => set(k, e.target.value)}
                        style={{ ...inp, flex: 1, fontFamily: MONO, fontSize: 11 }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 12 }}>
                <div>
                  <label style={lbl}>Shadow</label>
                  <select value={form.panel_shadow} onChange={e => set("panel_shadow", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {SHADOW_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Align</label>
                  <select value={form.panel_align} onChange={e => set("panel_align", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {ALIGN_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={lbl}>Border Radius</label>
                  <input type="number" min={0} max={32} value={form.panel_radius} onChange={e => set("panel_radius", Number(e.target.value))} style={inp} />
                </div>
                <div>
                  <label style={lbl}>Padding</label>
                  <input type="number" min={8} max={80} value={form.panel_padding} onChange={e => set("panel_padding", Number(e.target.value))} style={inp} />
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer actions */}
      <div style={{ display: "flex", gap: 12, marginTop: 24, alignItems: "center", paddingTop: 20, borderTop: `1px solid ${C?.border || "#2a2218"}` }}>
        <a
          href="http://localhost:5176/"
          target="_blank" rel="noreferrer"
          style={{
            fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", color: C?.grey || "#8a7d6a", textDecoration: "none",
            display: "flex", alignItems: "center", gap: 4, opacity: 0.7, transition: "opacity 0.15s",
          }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
        >View Live ↗</a>

        <div style={{ flex: 1 }} />

        {onClose && (
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, color: C?.grey || "#8a7d6a", padding: "9px 18px",
            fontFamily: SANS, fontSize: 11, fontWeight: 600, letterSpacing: "0.06em",
            cursor: "pointer", textTransform: "uppercase",
          }}>Cancel</button>
        )}

        <button
          onClick={handleSave}
          disabled={saving || !form.label.trim()}
          style={{
            background: saved ? "#1a3a1a" : G,
            border: saved ? `1px solid #4ade8088` : "none",
            borderRadius: 6,
            color: saved ? "#4ade80" : "#0a0906",
            padding: "9px 22px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.06em", textTransform: "uppercase",
            cursor: saving || saved ? "default" : !form.label.trim() ? "not-allowed" : "pointer",
            opacity: !form.label.trim() && !saving ? 0.5 : 1,
            transition: "background 0.2s, color 0.2s, border-color 0.2s",
          }}
        >
          {saving ? "Saving..." : saved ? "Saved ✓" : item ? "Save Changes" : "Add Item"}
        </button>
      </div>
    </div>
  );
}
