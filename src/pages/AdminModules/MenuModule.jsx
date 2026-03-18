// MenuModule.jsx
// Navigation Design Builder — tree structure, type system, design presets, live preview.

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const SANS  = "'Inter', system-ui, sans-serif";
const SERIF = "'Cormorant Garamond', Georgia, serif";
const MONO  = "'JetBrains Mono', 'Fira Mono', monospace";

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_OPTIONS = [
  { value: "link",      label: "Standard Link", desc: "Regular nav link" },
  { value: "dropdown",  label: "Dropdown",       desc: "Has child items with a panel" },
  { value: "mega_menu", label: "Mega Menu",       desc: "Full featured rich panel" },
  { value: "cta",       label: "CTA Button",     desc: "Styled button pinned right" },
];

const NAV_ACTION_OPTIONS = [
  { value: "",                label: "None (use URL or slug)" },
  { value: "browse",          label: "Browse Venues" },
  { value: "aura-discovery",  label: "Aura Discovery" },
  { value: "real-weddings",   label: "Real Weddings" },
  { value: "planning",        label: "Planning / LWD Standard" },
  { value: "about",           label: "About" },
  { value: "magazine",        label: "Magazine" },
  { value: "join",            label: "Join" },
  { value: "contact",         label: "Contact" },
  { value: "artistry-awards", label: "Artistry Awards" },
];

const CTA_STYLES = [
  { value: "gold",    label: "Gold Fill" },
  { value: "outline", label: "Gold Outline" },
  { value: "dark",    label: "Dark Fill" },
];

const ANIMATIONS = [
  { value: "slide-down",   label: "Slide Down" },
  { value: "fade",         label: "Fade" },
  { value: "scale-in",     label: "Scale In" },
  { value: "soft-reveal",  label: "Soft Reveal" },
  { value: "slide-up",     label: "Slide Up" },
  { value: "none",         label: "No Animation" },
];

const LAYOUT_TYPES = [
  { value: "grid",            label: "Link Grid" },
  { value: "2-col",           label: "2 Columns" },
  { value: "3-col",           label: "3 Columns" },
  { value: "4-col",           label: "4 Columns" },
  { value: "featured-right",  label: "Featured Card Right" },
  { value: "featured-left",   label: "Featured Card Left" },
  { value: "editorial",       label: "Editorial Block" },
];

const SHADOW_OPTIONS = [
  { value: "none",   label: "None" },
  { value: "soft",   label: "Soft" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
  { value: "luxury", label: "Luxury" },
];

const ALIGN_OPTIONS = [
  { value: "left",    label: "Left" },
  { value: "center",  label: "Center" },
  { value: "right",   label: "Right" },
  { value: "stretch", label: "Full Width" },
];

// Design presets — each defines all panel styling in one click
const PRESETS = {
  "classic-luxury": {
    label: "Classic Luxury",
    desc: "Dark cream, gold accents",
    swatch: ["#1a1510", "#c9a84c"],
    values: {
      animation: "slide-down", panel_bg: "#1a1510", panel_text_color: "#f5efe4",
      panel_accent_color: "#c9a84c", panel_hover_color: "#c9a84c",
      panel_border_color: "#2a2218", panel_shadow: "luxury",
      panel_radius: 8, panel_padding: 28, panel_full_width: false,
      panel_align: "left", layout_type: "2-col", show_descriptions: true,
    },
  },
  "minimal-dark": {
    label: "Minimal Dark",
    desc: "Near-black, clean lines",
    swatch: ["#0a0a0a", "#ffffff"],
    values: {
      animation: "fade", panel_bg: "#0d0d0d", panel_text_color: "#ffffff",
      panel_accent_color: "#c9a84c", panel_hover_color: "#c9a84c",
      panel_border_color: "#1f1f1f", panel_shadow: "soft",
      panel_radius: 4, panel_padding: 24, panel_full_width: false,
      panel_align: "left", layout_type: "3-col", show_descriptions: false,
    },
  },
  "editorial-light": {
    label: "Editorial Light",
    desc: "Cream background, dark text",
    swatch: ["#f6f1e8", "#171717"],
    values: {
      animation: "soft-reveal", panel_bg: "#f6f1e8", panel_text_color: "#171717",
      panel_accent_color: "#8f7420", panel_hover_color: "#8f7420",
      panel_border_color: "#e0d8c8", panel_shadow: "medium",
      panel_radius: 0, panel_padding: 32, panel_full_width: true,
      panel_align: "stretch", layout_type: "featured-right", show_descriptions: true,
    },
  },
  "premium-gold": {
    label: "Premium Gold",
    desc: "Deep black, full gold",
    swatch: ["#080602", "#c9a84c"],
    values: {
      animation: "scale-in", panel_bg: "#080602", panel_text_color: "#c9a84c",
      panel_accent_color: "#e8c96a", panel_hover_color: "#e8c96a",
      panel_border_color: "#c9a84c33", panel_shadow: "strong",
      panel_radius: 12, panel_padding: 36, panel_full_width: false,
      panel_align: "center", layout_type: "grid", show_descriptions: false,
    },
  },
  "full-width-showcase": {
    label: "Full Width Showcase",
    desc: "Wide editorial with featured image",
    swatch: ["#111009", "#f5efe4"],
    values: {
      animation: "slide-down", panel_bg: "#111009", panel_text_color: "#f5efe4",
      panel_accent_color: "#c9a84c", panel_hover_color: "#c9a84c",
      panel_border_color: "#2a2218", panel_shadow: "luxury",
      panel_radius: 0, panel_padding: 40, panel_full_width: true,
      panel_align: "stretch", layout_type: "editorial", show_descriptions: true,
    },
  },
};

const TYPE_BADGE_DEF = {
  link:      { label: "Link",     bg: "#111", border: "#2a2a2a", color: "#8a7d6a" },
  dropdown:  { label: "Dropdown", bg: "#0a1628", border: "#1a3a5c", color: "#60a5fa" },
  mega_menu: { label: "Mega",     bg: "#160d28", border: "#3a1a5c", color: "#a78bfa" },
  cta:       { label: "CTA",      bg: "#1a1200", border: "#4a3800", color: "#c9a84c" },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toSlug(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function buildTree(flat) {
  const map = {};
  flat.forEach(item => { map[item.id] = { ...item, children: [] }; });
  const roots = [];
  flat.forEach(item => {
    if (item.parent_id && map[item.parent_id]) {
      map[item.parent_id].children.push(map[item.id]);
    } else {
      roots.push(map[item.id]);
    }
  });
  const sort = nodes => {
    nodes.sort((a, b) => a.position - b.position);
    nodes.forEach(n => sort(n.children));
  };
  sort(roots);
  return roots;
}

function blankForm() {
  return {
    label: "", slug: "", url: "", nav_action: "",
    type: "link", open_new_tab: false, visible: true,
    is_cta: false, cta_style: "gold",
    mega_menu_enabled: false, mega_menu_title: "", mega_menu_layout: "columns",
    featured_image: "", featured_title: "", featured_text: "", featured_link: "",
    mobile_hidden: false,
    mega_menu_source: "manual", mega_menu_source_slug: "",
    menu_preset: "classic-luxury", animation: "slide-down",
    panel_bg: "#1a1510", panel_text_color: "#f5efe4",
    panel_accent_color: "#c9a84c", panel_hover_color: "#c9a84c",
    panel_border_color: "#2a2218", panel_shadow: "luxury",
    panel_radius: 8, panel_padding: 28,
    panel_max_width: null, panel_full_width: false, panel_align: "left",
    layout_columns: 2, layout_type: "2-col",
    show_descriptions: true, show_icons: false, show_thumbnails: false,
    has_cta_in_panel: false, panel_cta_label: "", panel_cta_link: "",
  };
}

function itemToForm(item) {
  return {
    label:            item.label || "",
    slug:             item.slug || "",
    url:              item.url || "",
    nav_action:       item.nav_action || "",
    type:             item.type || "link",
    open_new_tab:     !!item.open_new_tab,
    visible:          item.visible !== false,
    is_cta:           !!item.is_cta,
    cta_style:        item.cta_style || "gold",
    mega_menu_enabled:!!item.mega_menu_enabled,
    mega_menu_title:  item.mega_menu_title || "",
    mega_menu_layout: item.mega_menu_layout || "columns",
    featured_image:   item.featured_image || "",
    featured_title:   item.featured_title || "",
    featured_text:    item.featured_text || "",
    featured_link:    item.featured_link || "",
    mobile_hidden:        !!item.mobile_hidden,
    mega_menu_source:     item.mega_menu_source || "manual",
    mega_menu_source_slug:item.mega_menu_source_slug || "",
    menu_preset:          item.menu_preset || "classic-luxury",
    animation:        item.animation || "slide-down",
    panel_bg:         item.panel_bg || "#1a1510",
    panel_text_color: item.panel_text_color || "#f5efe4",
    panel_accent_color:  item.panel_accent_color || "#c9a84c",
    panel_hover_color:   item.panel_hover_color || "#c9a84c",
    panel_border_color:  item.panel_border_color || "#2a2218",
    panel_shadow:     item.panel_shadow || "luxury",
    panel_radius:     item.panel_radius ?? 8,
    panel_padding:    item.panel_padding ?? 28,
    panel_max_width:  item.panel_max_width || null,
    panel_full_width: !!item.panel_full_width,
    panel_align:      item.panel_align || "left",
    layout_columns:   item.layout_columns ?? 2,
    layout_type:      item.layout_type || "2-col",
    show_descriptions:item.show_descriptions !== false,
    show_icons:       !!item.show_icons,
    show_thumbnails:  !!item.show_thumbnails,
    has_cta_in_panel: !!item.has_cta_in_panel,
    panel_cta_label:  item.panel_cta_label || "",
    panel_cta_link:   item.panel_cta_link || "",
  };
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function Toast({ msg, type, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3000); return () => clearTimeout(t); }, [onDone]);
  const G = "#c9a84c";
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

// ─── Type Badge ───────────────────────────────────────────────────────────────

function TypeBadge({ type, visible }) {
  if (!visible) {
    return <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: "#2a1010", border: "1px solid #4a2020", borderRadius: 4, padding: "2px 7px", color: "#f87171" }}>Hidden</span>;
  }
  const b = TYPE_BADGE_DEF[type] || TYPE_BADGE_DEF.link;
  return (
    <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: b.bg, border: `1px solid ${b.border}`, borderRadius: 4, padding: "2px 7px", color: b.color }}>{b.label}</span>
  );
}

// ─── Panel Preview ────────────────────────────────────────────────────────────

const MOCK_SUBCATS = [
  { name: "Category One",   description: "Brief supporting text" },
  { name: "Category Two",   description: "Brief supporting text" },
  { name: "Category Three", description: "Brief supporting text" },
  { name: "Category Four",  description: "Brief supporting text" },
];

function PanelPreview({ form, realSubcats = [], realPost = null }) {
  const bg     = form.panel_bg           || "#1a1510";
  const txt    = form.panel_text_color   || "#f5efe4";
  const accent = form.panel_accent_color || "#c9a84c";
  const border = form.panel_border_color || "#2a2218";
  const r      = form.panel_radius       ?? 8;

  const hasReal      = realSubcats.length > 0;
  const subcats      = hasReal ? realSubcats : MOCK_SUBCATS;
  const hasFeatured  = form.layout_type === "featured-right" || form.layout_type === "featured-left" || form.layout_type === "editorial";
  const featuredPost = realPost || null;
  const showDesc     = form.show_descriptions !== false;

  const SHADOW = {
    none: "none", soft: "0 4px 16px rgba(0,0,0,0.12)",
    medium: "0 8px 32px rgba(0,0,0,0.2)", strong: "0 12px 48px rgba(0,0,0,0.4)",
    luxury: "0 20px 60px rgba(0,0,0,0.6)",
  };

  return (
    <div style={{ borderRadius: r, overflow: "hidden", boxShadow: SHADOW[form.panel_shadow] || SHADOW.luxury, marginTop: 8 }}>

      {/* ── Simulated nav bar strip ── */}
      <div style={{
        background: "#0b0906", padding: "10px 20px",
        display: "flex", alignItems: "center", gap: 20,
        borderBottom: `1px solid #2a2218`,
      }}>
        <span style={{ fontFamily: SERIF, fontSize: 13, color: "#f5efe4", fontWeight: 600, marginRight: 8 }}>LWD</span>
        {["Browse", "Venues", form.label || "Menu Item"].map((l, i) => (
          <span key={i} style={{
            fontFamily: SANS, fontSize: 11,
            color: i === 2 ? accent : "rgba(255,255,255,0.38)",
            fontWeight: i === 2 ? 700 : 400,
            letterSpacing: "0.02em",
            display: "flex", alignItems: "center", gap: 3,
          }}>
            {l}{i === 2 && <span style={{ fontSize: 8, opacity: 0.7 }}>▴</span>}
          </span>
        ))}
      </div>

      {/* ── Panel body ── */}
      <div style={{
        background: bg, padding: "20px 20px 16px",
        display: "grid",
        gridTemplateColumns: hasFeatured && (featuredPost || !hasReal) ? "1fr 160px" : "1fr",
        gap: 20,
      }}>
        {/* Left: label + subcategories */}
        <div>
          <div style={{
            fontFamily: SANS, fontSize: 8, fontWeight: 700, letterSpacing: "0.14em",
            textTransform: "uppercase", color: accent, marginBottom: 12,
            display: "flex", alignItems: "center", gap: 8,
          }}>
            <span style={{ display: "inline-block", width: 16, height: 1, background: accent }} />
            {form.label || "Section"}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 24px" }}>
            {subcats.slice(0, 6).map((cat, i) => (
              <div key={i} style={{ padding: "7px 0", borderBottom: `1px solid ${border}` }}>
                <div style={{ fontFamily: SANS, fontSize: 11, fontWeight: 500, color: txt, marginBottom: showDesc ? 2 : 0 }}>
                  {cat.name}
                </div>
                {showDesc && (cat.short_description || cat.description) && (
                  <div style={{ fontFamily: SANS, fontSize: 9, color: txt + "70", lineHeight: 1.4 }}>
                    {cat.short_description || cat.description}
                  </div>
                )}
              </div>
            ))}
            {!hasReal && (
              <div style={{ gridColumn: "1/-1", padding: "6px 0", fontFamily: SANS, fontSize: 9, color: accent + "80", fontStyle: "italic" }}>
                Placeholder - real subcategories will appear after saving
              </div>
            )}
          </div>
          {form.has_cta_in_panel && (
            <div style={{ marginTop: 12 }}>
              <span style={{
                fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                textTransform: "uppercase", color: accent, border: `1px solid ${accent}`,
                borderRadius: r / 2 || 3, padding: "5px 12px",
              }}>{form.panel_cta_label || `Explore all ${form.label || "items"}`} →</span>
            </div>
          )}
        </div>

        {/* Right: featured article */}
        {hasFeatured && (
          <div>
            <div style={{ fontFamily: SANS, fontSize: 8, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: 8 }}>
              Latest Story
            </div>
            {featuredPost?.featured_image ? (
              <img src={featuredPost.featured_image} alt=""
                style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: r / 2 || 2, display: "block", marginBottom: 8 }} />
            ) : (
              <div style={{ width: "100%", height: 80, background: accent + "20", borderRadius: r / 2 || 2, marginBottom: 8, display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: SANS, fontSize: 9, color: accent + "80" }}>{hasReal ? "No published articles yet" : "Article image"}</span>
              </div>
            )}
            <div style={{ fontFamily: SERIF, fontSize: 12, color: txt, lineHeight: 1.3 }}>
              {featuredPost?.title || (hasReal ? "No published articles in this category" : "Article headline appears here")}
            </div>
            {featuredPost?.read_time && (
              <div style={{ fontFamily: SANS, fontSize: 9, color: txt + "70", marginTop: 4 }}>{featuredPost.read_time} min read</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Item Modal ───────────────────────────────────────────────────────────────

function ItemModal({ item, parentId, onSave, onClose, onFormChange, C }) {
  const G = C?.gold || "#c9a84c";
  const [form, setForm] = useState(item ? itemToForm(item) : blankForm());
  const [slugManual, setSlugManual] = useState(!!(item?.slug));
  const [tab, setTab] = useState("structure"); // structure | design
  const [advanced, setAdvanced] = useState(false);
  const [saving, setSaving] = useState(false);
  const [magCategories,  setMagCategories]  = useState([]);
  const [previewSubcats, setPreviewSubcats] = useState([]);
  const [previewPost,    setPreviewPost]    = useState(null);

  // Sync every form change to parent canvas (live draft preview)
  useEffect(() => {
    if (onFormChange) onFormChange(form);
  }, [form]); // eslint-disable-line react-hooks/exhaustive-deps

  // Load top-level magazine categories for source selector
  useEffect(() => {
    supabase
      .from("magazine_categories")
      .select("id, slug, name")
      .is("parent_category_slug", null)
      .order("name", { ascending: true })
      .then(({ data }) => setMagCategories(data || []));
  }, []);

  // Fetch real subcats + article when magazine category source is selected
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

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleLabelChange = val => {
    set("label", val);
    if (!slugManual) set("slug", toSlug(val));
  };

  const handleTypeChange = val => {
    setForm(f => ({
      ...f, type: val,
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

  async function handleSave() {
    if (!form.label.trim()) return;
    setSaving(true);
    await onSave({ ...form, parent_id: parentId ?? item?.parent_id ?? null });
    setSaving(false);
  }

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

  return (
    <div style={{
      width: "100%",
      background: C?.card || "#1a1510",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderTop: `2px solid ${G}`,
      borderRadius: 12, padding: 28,
      boxShadow: "0 8px 40px rgba(0,0,0,0.5)",
      marginBottom: 20,
    }}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 22, color: C?.white || "#f5efe4", fontWeight: 500 }}>
              {item ? "Edit Nav Item" : parentId ? "Add Child Item" : "Add Nav Item"}
            </div>
            {parentId && !item && (
              <div style={{ fontFamily: SANS, fontSize: 12, color: G, marginTop: 4, opacity: 0.8 }}>Nesting under parent</div>
            )}
          </div>
          <button onClick={onClose} style={{ background: "none", border: "none", color: C?.grey || "#8a7d6a", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 4 }}>×</button>
        </div>

        {/* Tabs (only for panel types) */}
        {isPanel && (
          <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: `1px solid ${C?.border || "#2a2218"}`, paddingBottom: 0 }}>
            {[["structure", "Structure"], ["design", "Design"]].map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                background: "none", border: "none", borderBottom: `2px solid ${tab === key ? G : "transparent"}`,
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
            {/* Type */}
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
                      borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left", transition: "all 0.15s",
                    }}>
                      <div style={{ fontFamily: SANS, fontSize: 12, fontWeight: 600, color: active ? (b?.color || G) : (C?.grey || "#8a7d6a"), letterSpacing: "0.04em" }}>{opt.label}</div>
                      <div style={{ fontFamily: SANS, fontSize: 10, color: C?.grey || "#8a7d6a", marginTop: 2 }}>{opt.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Label + Slug */}
            <div style={row2}>
              <div>
                <label style={lbl}>Label *</label>
                <input value={form.label} onChange={e => handleLabelChange(e.target.value)} placeholder="e.g. Browse Venues" style={inp} />
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
                    <button onClick={() => { setSlugManual(false); set("slug", toSlug(form.label)); }}
                      title="Reset to auto" style={{ background: "none", border: `1px solid ${C?.border || "#2a2218"}`, borderRadius: 6, color: C?.grey || "#8a7d6a", padding: "0 8px", cursor: "pointer", fontSize: 12 }}>
                      ↺
                    </button>
                  )}
                </div>
                <div style={hint}>Used as /{form.slug || "slug"}</div>
              </div>
            </div>

            {/* URL + Nav Action — hidden for mega menus sourced from magazine categories */}
            {!(form.type === "mega_menu" && form.mega_menu_source === "magazine_category") && (
              <div style={row2}>
                <div>
                  <label style={lbl}>URL override</label>
                  <input value={form.url} onChange={e => set("url", e.target.value)} placeholder="/venue or https://..." style={inp} />
                  <div style={hint}>Overrides slug. Leave blank to use slug.</div>
                </div>
                <div>
                  <label style={lbl}>Nav Action (SPA)</label>
                  <select value={form.nav_action} onChange={e => set("nav_action", e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                    {NAV_ACTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
            )}

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
                  <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} />
                  {labelText}
                </label>
              ))}
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
                  <div style={hint}>
                    Subcategories and the latest published article load automatically. Preview updates below.
                  </div>
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
                      borderRadius: 8, padding: "10px 8px", cursor: "pointer",
                      textAlign: "center", transition: "all 0.15s",
                    }}>
                      {/* Swatch */}
                      <div style={{ display: "flex", gap: 3, justifyContent: "center", marginBottom: 8 }}>
                        {preset.swatch.map((c, i) => (
                          <div key={i} style={{ width: 14, height: 14, borderRadius: "50%", background: c, border: "1px solid rgba(255,255,255,0.1)" }} />
                        ))}
                      </div>
                      <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, color: active ? G : (C?.off || "#d4c8b0"), letterSpacing: "0.04em", lineHeight: 1.3 }}>{preset.label}</div>
                      <div style={{ fontFamily: SANS, fontSize: 9, color: C?.grey || "#8a7d6a", marginTop: 3, lineHeight: 1.3 }}>{preset.desc}</div>
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

            {/* Content options */}
            <div>
              <label style={lbl}>Content Display</label>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap" }}>
                {[["show_descriptions", "Show descriptions"], ["show_icons", "Show icons"], ["show_thumbnails", "Show thumbnails"], ["has_cta_in_panel", "CTA in panel"]].map(([k, labelText]) => (
                  <label key={k} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0" }}>
                    <input type="checkbox" checked={form[k]} onChange={e => set(k, e.target.checked)} />
                    {labelText}
                  </label>
                ))}
              </div>
            </div>

            {/* Panel CTA label/link */}
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
                <input value={form.featured_text} onChange={e => set("featured_text", e.target.value)} placeholder="Short description" style={inp} />
                <div style={row2}>
                  <input value={form.featured_image} onChange={e => set("featured_image", e.target.value)} placeholder="Image URL" style={inp} />
                  <input value={form.featured_link} onChange={e => set("featured_link", e.target.value)} placeholder="/link" style={inp} />
                </div>
              </div>
            )}

            {/* Advanced toggle */}
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

                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0" }}>
                    <input type="checkbox" checked={form.panel_full_width} onChange={e => set("panel_full_width", e.target.checked)} />
                    Full width panel
                  </label>
                  {!form.panel_full_width && (
                    <div style={{ flex: 1 }}>
                      <input type="number" min={200} max={1400} value={form.panel_max_width || 800}
                        onChange={e => set("panel_max_width", Number(e.target.value))} placeholder="Max width px" style={inp} />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Live preview */}
            <div>
              <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G, marginBottom: 4 }}>Live Preview</div>
              <PanelPreview form={form} realSubcats={previewSubcats} realPost={previewPost} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ display: "flex", gap: 12, marginTop: 28, alignItems: "center" }}>
          {/* View live link */}
          <a
            href="http://localhost:5176/"
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", color: C?.grey || "#8a7d6a", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 4, padding: "6px 0",
              opacity: 0.7, transition: "opacity 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = "1"}
            onMouseLeave={e => e.currentTarget.style.opacity = "0.7"}
          >
            View Live ↗
          </a>
          <div style={{ flex: 1 }} />
          <button onClick={onClose} style={{
            background: "none", border: `1px solid ${C?.border || "#2a2218"}`,
            borderRadius: 6, color: C?.grey || "#8a7d6a", padding: "9px 20px",
            fontFamily: SANS, fontSize: 12, fontWeight: 600, letterSpacing: "0.06em",
            cursor: "pointer", textTransform: "uppercase",
          }}>Cancel</button>
          <button onClick={handleSave} disabled={saving || !form.label.trim()} style={{
            background: G, border: "none", borderRadius: 6, color: "#0a0906",
            padding: "9px 24px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.06em", cursor: saving ? "not-allowed" : "pointer",
            textTransform: "uppercase", opacity: saving || !form.label.trim() ? 0.5 : 1,
          }}>
            {saving ? "Saving..." : item ? "Save Changes" : "Add Item"}
          </button>
        </div>
    </div>
  );
}

// ─── Tree Node ────────────────────────────────────────────────────────────────

function TreeNode({ item, siblings, depth, onEdit, onAddChild, onDelete, onToggleVisible, onMove, C, deleting, moving }) {
  const G = C?.gold || "#c9a84c";
  const hasChildren = item.children?.length > 0;
  const [expanded, setExpanded] = useState(true);
  const idx = siblings.findIndex(s => s.id === item.id);
  const MAX_DEPTH = 2;

  const qBtn = (label, onClick, opts = {}) => (
    <button onClick={onClick} disabled={opts.disabled} title={opts.title || label}
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
      <div style={{
        display: "flex", alignItems: "center", gap: 10,
        padding: `10px 16px 10px ${16 + depth * 28}px`,
        borderTop: depth === 0 ? `1px solid ${C?.border || "#2a2218"}` : "none",
        background: moving === item.id ? (G + "10") : depth > 0 ? ((C?.bg || "#0b0906") + "50") : "transparent",
        opacity: item.visible ? 1 : 0.5, transition: "background 0.2s",
      }}>
        {/* Expand */}
        <button onClick={() => setExpanded(e => !e)} style={{
          background: "none", border: "none", cursor: hasChildren ? "pointer" : "default",
          color: hasChildren ? G : "transparent", fontSize: 10, padding: "2px 4px",
          lineHeight: 1, width: 16, flexShrink: 0,
          transform: expanded ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s",
        }}>{hasChildren ? "▶" : ""}</button>

        {depth > 0 && <span style={{ color: C?.border || "#2a2218", fontSize: 12, marginRight: 2, flexShrink: 0 }}>└</span>}

        {/* Reorder arrows */}
        <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
          <button onClick={() => onMove(item, siblings, "up")} disabled={idx === 0 || !!moving}
            style={{ background: "none", border: "none", cursor: idx === 0 ? "default" : "pointer", color: idx === 0 ? (C?.grey2 || "#5a5045") : (C?.grey || "#8a7d6a"), fontSize: 9, padding: 1 }}>▲</button>
          <button onClick={() => onMove(item, siblings, "down")} disabled={idx === siblings.length - 1 || !!moving}
            style={{ background: "none", border: "none", cursor: idx === siblings.length - 1 ? "default" : "pointer", color: idx === siblings.length - 1 ? (C?.grey2 || "#5a5045") : (C?.grey || "#8a7d6a"), fontSize: 9, padding: 1 }}>▼</button>
        </div>

        {/* Label + badges */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
            <span style={{ fontFamily: SANS, fontSize: 13, fontWeight: depth === 0 ? 500 : 400, color: C?.white || "#f5efe4" }}>
              {item.label}
            </span>
            <TypeBadge type={item.type || "link"} visible={item.visible} />
            {/* Design preset badge for panel types */}
            {(item.type === "dropdown" || item.type === "mega_menu") && item.menu_preset && (
              <span style={{ fontFamily: SANS, fontSize: 9, color: C?.grey || "#8a7d6a", opacity: 0.7 }}>
                {PRESETS[item.menu_preset]?.label || item.menu_preset}
              </span>
            )}
          </div>
          {(item.slug || item.url || item.nav_action) && (
            <div style={{ fontFamily: MONO, fontSize: 10, color: C?.grey || "#8a7d6a", marginTop: 2 }}>
              {item.nav_action ? `action:${item.nav_action}` : item.url || `/${item.slug}`}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div style={{ display: "flex", gap: 6, alignItems: "center", flexShrink: 0 }}>
          {qBtn("Edit", () => onEdit(item))}
          {depth < MAX_DEPTH && (item.type === "dropdown" || item.type === "mega_menu") && qBtn("+ Child", () => onAddChild(item.id))}
          {qBtn(item.visible ? "Hide" : "Show", () => onToggleVisible(item))}
          {qBtn(deleting === item.id ? "..." : "Remove", () => onDelete(item), { danger: true, disabled: deleting === item.id || hasChildren })}
        </div>
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div style={{ borderLeft: `1px solid ${C?.border || "#2a2218"}33`, marginLeft: 16 + depth * 28 + 44 }}>
          {item.children.map(child => (
            <TreeNode key={child.id} item={child} siblings={item.children} depth={depth + 1}
              onEdit={onEdit} onAddChild={onAddChild} onDelete={onDelete}
              onToggleVisible={onToggleVisible} onMove={onMove}
              C={C} deleting={deleting} moving={moving} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Preview Strip ───────────────────────────────────────────────────────

function LivePreviewStrip({ items, G, C }) {
  const visible = items.filter(i => i.visible);
  const regular = visible.filter(i => i.type !== "cta");
  const ctas = visible.filter(i => i.type === "cta");

  return (
    <div style={{
      background: C?.card || "#1a1510", border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10, padding: "14px 20px", marginBottom: 28,
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", flex: 1 }}>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: G, marginRight: 12 }}>Live Preview</span>
        {regular.map((item, idx) => (
          <span key={item.id} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {idx > 0 && <span style={{ color: C?.grey2 || "#5a5045", fontSize: 11 }}>|</span>}
            <span style={{ fontFamily: SANS, fontSize: 13, color: C?.off || "#d4c8b0" }}>
              {item.label}{(item.type === "dropdown" || item.type === "mega_menu") ? " ▾" : ""}
            </span>
          </span>
        ))}
        {visible.length === 0 && <span style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", fontStyle: "italic" }}>No visible items</span>}
      </div>
      {ctas.length > 0 && (
        <div style={{ display: "flex", gap: 8 }}>
          {ctas.map(item => (
            <span key={item.id} style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
              textTransform: "uppercase", padding: "6px 16px", borderRadius: 6,
              background: item.cta_style === "outline" ? "transparent" : item.cta_style === "dark" ? "#0a0906" : G,
              border: `1px solid ${item.cta_style === "dark" ? "#333" : G}`,
              color: item.cta_style === "gold" ? "#0a0906" : G,
            }}>{item.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Live Design Canvas ──────────────────────────────────────────────────────

function LiveDesignCanvas({ items, C, selectedItemId, draftForm }) {
  const G = C?.gold || "#c9a84c";
  const [activeItemId, setActiveItemId] = useState(null);
  const [pageTheme, setPageTheme] = useState("dark");
  const [subcatCache, setSubcatCache] = useState({});

  // Merge live draft onto the item being edited — everything else uses saved data
  const effectiveItems = items.map(item =>
    (item.id === selectedItemId && draftForm)
      ? { ...item, ...draftForm }
      : item
  );

  const rootItems = effectiveItems.filter(i => i.visible && !i.parent_id);
  const regular = rootItems.filter(i => i.type !== "cta");
  const ctas = rootItems.filter(i => i.type === "cta");
  // activeItemId = hover, selectedItemId = edit selection (shown when not hovering)
  const resolvedActiveId = activeItemId || (!activeItemId && selectedItemId ? selectedItemId : null);
  const activeItem = resolvedActiveId ? rootItems.find(i => i.id === resolvedActiveId) : null;
  const isPanel = !!(activeItem && (activeItem.type === "dropdown" || activeItem.type === "mega_menu"));

  async function fetchSubcats(item) {
    const slug = item.mega_menu_source_slug;
    if (!slug || item.mega_menu_source !== "magazine_category") return;
    if (subcatCache[slug]) return;
    const [catsRes, postsRes] = await Promise.all([
      supabase.from("magazine_categories").select("id, slug, name, short_description, description").eq("parent_category_slug", slug).order("name", { ascending: true }),
      supabase.from("magazine_posts").select("id, title, slug, featured_image, read_time").eq("category_slug", slug).eq("status", "published").order("published_at", { ascending: false }).limit(1),
    ]);
    setSubcatCache(prev => ({ ...prev, [slug]: { subcats: catsRes.data || [], post: postsRes.data?.[0] || null } }));
  }

  const handleItemHover = item => {
    setActiveItemId(item.id);
    if (item.type === "mega_menu") fetchSubcats(item);
  };

  const PAGE_THEMES = {
    dark:      { bg: "#080602",  text: "#f5efe4", sub: "#f5efe440", heroText: "#c9a84c" },
    light:     { bg: "#f6f1e8",  text: "#171717", sub: "#17171760", heroText: "#8f7420" },
    editorial: { bg: "#111009",  text: "#f5efe4", sub: "#f5efe450", heroText: "#c9a84c" },
  };
  const theme = PAGE_THEMES[pageTheme];

  const SHADOW_MAP = {
    none: "none", soft: "0 4px 20px rgba(0,0,0,0.07)",
    medium: "0 8px 32px rgba(0,0,0,0.12)", strong: "0 16px 48px rgba(0,0,0,0.22)",
    luxury: "0 20px 60px rgba(0,0,0,0.28)",
  };

  function renderPanel() {
    if (!isPanel || !activeItem) return null;
    const item = activeItem;
    const bg     = item.panel_bg           || "#1a1510";
    const txt    = item.panel_text_color   || "#f5efe4";
    const accent = item.panel_accent_color || "#c9a84c";
    const border = item.panel_border_color || "#2a2218";
    const r      = item.panel_radius       ?? 0;
    const pad    = item.panel_padding      ?? 40;
    const shadow = SHADOW_MAP[item.panel_shadow] || SHADOW_MAP.luxury;

    const cached   = subcatCache[item.mega_menu_source_slug] || { subcats: [], post: null };
    const isReal   = cached.subcats.length > 0;
    const subcats  = isReal ? cached.subcats : [
      { name: "Style & Trends",        short_description: "Inspiration and editorial" },
      { name: "Venues & Destinations", short_description: "Where to celebrate" },
      { name: "Planning Essentials",   short_description: "Checklists and timelines" },
      { name: "Fashion & Beauty",      short_description: "Bridal looks and styling" },
    ];
    const post       = cached.post;
    const showDesc   = item.show_descriptions !== false;
    const hasFeatured = post || item.layout_type === "featured-right" || item.layout_type === "editorial";

    return (
      <div style={{
        position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
        background: bg,
        borderTop:    `1px solid ${border}`,
        borderBottom: `1px solid ${border}`,
        boxShadow: shadow,
      }}>
        <div style={{
          maxWidth: item.panel_full_width ? "100%" : (item.panel_max_width || 1200),
          margin: "0 auto",
          padding: `${pad}px 40px`,
          display: "grid",
          gridTemplateColumns: hasFeatured ? "1fr 260px" : "1fr",
          gap: 48,
          alignItems: "start",
        }}>
          {/* Left: heading + subcategory grid */}
          <div>
            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: accent, marginBottom: 20,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ display: "inline-block", width: 20, height: 1, background: accent }} />
              {item.label}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 48px" }}>
              {subcats.slice(0, 8).map((cat, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: txt, marginBottom: showDesc ? 4 : 0 }}>
                    {cat.name}
                  </div>
                  {showDesc && (cat.short_description || cat.description) && (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: txt + "75", lineHeight: 1.4 }}>
                      {cat.short_description || cat.description}
                    </div>
                  )}
                </div>
              ))}
              {!isReal && (
                <div style={{ gridColumn: "1/-1", padding: "8px 0", fontFamily: SANS, fontSize: 11, color: accent + "80", fontStyle: "italic" }}>
                  Mock data - assign a Magazine Category source to see real subcategories
                </div>
              )}
            </div>
            {item.has_cta_in_panel && (
              <div style={{ marginTop: 24 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: accent,
                  border: `1px solid ${accent}`, borderRadius: r / 2 || 3, padding: "9px 20px",
                }}>
                  {item.panel_cta_label || `Explore all ${item.label}`} <span>→</span>
                </span>
              </div>
            )}
          </div>

          {/* Right: featured article */}
          {hasFeatured && (
            <div>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: 14 }}>
                Latest Story
              </div>
              {post?.featured_image ? (
                <img src={post.featured_image} alt={post.title || ""}
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: r / 2 || 2, display: "block", marginBottom: 12 }} />
              ) : (
                <div style={{ width: "100%", height: 140, background: accent + "18", borderRadius: r / 2 || 2, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: accent + "80" }}>Article image</span>
                </div>
              )}
              <div style={{ fontFamily: SERIF, fontSize: 17, color: txt, lineHeight: 1.35, marginBottom: 6 }}>
                {post?.title || "Article headline appears here"}
              </div>
              {post?.read_time && (
                <div style={{ fontFamily: SANS, fontSize: 11, color: txt + "70" }}>{post.read_time} min read</div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>

      {/* Section header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: G }}>
            Design Canvas
          </div>
          {selectedItemId && !activeItemId && (
            <div style={{ fontFamily: SANS, fontSize: 9, color: G, opacity: 0.7, letterSpacing: "0.04em" }}>
              - editing selected
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
          {[["dark", "Dark"], ["light", "Light"], ["editorial", "Edt"]].map(([val, label]) => (
            <button key={val} onClick={() => setPageTheme(val)} style={{
              background: pageTheme === val ? G + "20" : "transparent",
              border: `1px solid ${pageTheme === val ? G : (C?.border || "#2a2218")}`,
              borderRadius: 5, padding: "4px 10px", cursor: "pointer",
              fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", color: pageTheme === val ? G : (C?.grey || "#8a7d6a"),
              transition: "all 0.15s",
            }}>{label}</button>
          ))}
          <a
            href="http://localhost:5176/"
            target="_blank"
            rel="noreferrer"
            style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
              textTransform: "uppercase", color: C?.grey || "#8a7d6a", textDecoration: "none",
              display: "flex", alignItems: "center", gap: 3,
              border: `1px solid ${C?.border || "#2a2218"}`,
              borderRadius: 5, padding: "4px 10px", transition: "all 0.15s",
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = G; e.currentTarget.style.color = G; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = C?.border || "#2a2218"; e.currentTarget.style.color = C?.grey || "#8a7d6a"; }}
          >
            View Live ↗
          </a>
        </div>
      </div>

      {/* Canvas frame */}
      <div style={{
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 10,
        boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
        overflow: "visible",
        position: "relative",
      }}>

        {/* Browser chrome bar */}
        <div style={{
          background: "#161616", padding: "10px 16px",
          borderRadius: "12px 12px 0 0",
          display: "flex", alignItems: "center", gap: 8,
          borderBottom: "1px solid #2a2a2a",
        }}>
          <div style={{ display: "flex", gap: 6 }}>
            {["#f87171", "#fbbf24", "#4ade80"].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
          </div>
          <div style={{
            flex: 1, margin: "0 16px",
            background: "#222", borderRadius: 6, padding: "5px 14px",
            fontFamily: MONO, fontSize: 11, color: "#6a6a6a",
            textAlign: "center",
          }}>
            luxuryweddingdirectory.com
          </div>
        </div>

        {/* Viewport */}
        <div>

          {/* Nav bar (position: relative so panel can absolute-position from here) */}
          <div
            style={{
              background: "#0b0906", height: 64, position: "relative", zIndex: 10,
              borderBottom: "1px solid #2a2218",
            }}
            onMouseLeave={() => setActiveItemId(null)}
          >
            {/* Nav inner content */}
            <div style={{
              height: "100%", display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: "0 40px",
            }}>
              {/* Logo */}
              <div style={{ fontFamily: SERIF, fontSize: 18, color: "#f5efe4", fontWeight: 600, letterSpacing: "0.04em", flexShrink: 0 }}>
                LWD
              </div>

              {/* Regular nav items */}
              <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, justifyContent: "center" }}>
                {regular.length === 0 && (
                  <span style={{ fontFamily: SANS, fontSize: 12, color: "#5a5045", fontStyle: "italic" }}>No visible items - add items above</span>
                )}
                {regular.map(item => {
                  const isActive    = resolvedActiveId === item.id;
                  const isSelected  = selectedItemId === item.id && !activeItemId;
                  const isDropdown  = item.type === "dropdown" || item.type === "mega_menu";
                  const itemAccent  = (item.panel_accent_color && isDropdown) ? item.panel_accent_color : G;
                  return (
                    <div key={item.id} style={{
                      position: "relative", cursor: "default",
                      padding: "4px 6px", borderRadius: 4,
                      background: isSelected ? G + "14" : "transparent",
                      outline: isSelected ? `1px solid ${G}40` : "none",
                      transition: "background 0.2s",
                    }}
                      onMouseEnter={() => handleItemHover(item)}
                    >
                      <span style={{
                        fontFamily: SANS, fontSize: 12, letterSpacing: "0.04em",
                        color: isActive ? itemAccent : "rgba(255,255,255,0.82)",
                        fontWeight: isActive ? 600 : 400,
                        display: "flex", alignItems: "center", gap: 4,
                        transition: "color 0.15s",
                        userSelect: "none",
                      }}>
                        {item.label}
                        {isDropdown && (
                          <span style={{
                            fontSize: 7, opacity: 0.7,
                            transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                            transition: "transform 0.2s",
                            display: "inline-block",
                          }}>▼</span>
                        )}
                      </span>
                      {/* Active underline */}
                      {isActive && (
                        <div style={{
                          position: "absolute", bottom: -4, left: 0, right: 0,
                          height: 1, background: itemAccent,
                        }} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* CTA buttons */}
              {ctas.length > 0 && (
                <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                  {ctas.map(item => (
                    <span key={item.id} style={{
                      fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                      textTransform: "uppercase", padding: "7px 18px", borderRadius: 6, cursor: "default",
                      background: item.cta_style === "outline" ? "transparent" : item.cta_style === "dark" ? "#0a0906" : G,
                      border: `1px solid ${item.cta_style === "dark" ? "#2a2a2a" : G}`,
                      color: item.cta_style === "gold" ? "#0a0906" : G,
                      userSelect: "none",
                    }}>{item.label}</span>
                  ))}
                </div>
              )}
            </div>

            {/* Dropdown / mega menu panel */}
            {isPanel && renderPanel()}
          </div>

          {/* Hero placeholder */}
          <div style={{
            background: theme.bg, height: 220,
            borderRadius: "0 0 10px 10px",
            position: "relative", overflow: "hidden",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
          }}>
            {/* Grid lines decoration */}
            <div style={{
              position: "absolute", inset: 0, pointerEvents: "none",
              opacity: 0.035,
              backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 56px)",
            }} />
            <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.heroText }}>
              Luxury Wedding Directory
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 400, color: theme.text, lineHeight: 1.1, textAlign: "center", maxWidth: 560 }}>
              Your Perfect Wedding Venue
            </div>
            <div style={{ fontFamily: SANS, fontSize: 14, color: theme.sub, letterSpacing: "0.04em" }}>
              Discover the world's finest wedding venues and suppliers
            </div>
            <div style={{ marginTop: 4, display: "flex", gap: 12 }}>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 28px", borderRadius: 6, background: G, color: "#0a0906", userSelect: "none", cursor: "default" }}>Browse Venues</span>
              <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 28px", borderRadius: 6, background: "transparent", border: `1px solid ${theme.text}25`, color: theme.text + "aa", userSelect: "none", cursor: "default" }}>Take the Quiz</span>
            </div>
          </div>

        </div>
      </div>

      {/* Active panel info strip */}
      {activeItem && isPanel && (
        <div style={{
          marginTop: 12, padding: "10px 18px",
          background: (activeItem.panel_bg || "#1a1510") + "55",
          border: `1px solid ${activeItem.panel_accent_color || G}30`,
          borderRadius: 8,
          display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center",
        }}>
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: activeItem.panel_accent_color || G }}>
            {activeItem.label}
          </span>
          {[
            ["Preset",    PRESETS[activeItem.menu_preset]?.label || activeItem.menu_preset],
            ["Animation", ANIMATIONS.find(a => a.value === activeItem.animation)?.label || activeItem.animation],
            ["Layout",    LAYOUT_TYPES.find(l => l.value === activeItem.layout_type)?.label || activeItem.layout_type],
            ["Source",    activeItem.mega_menu_source === "magazine_category" && activeItem.mega_menu_source_slug
                            ? `Magazine: ${activeItem.mega_menu_source_slug}`
                            : "Manual"],
          ].map(([k, v]) => v ? (
            <span key={k} style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a" }}>
              <span style={{ color: C?.off || "#d4c8b0", marginRight: 4 }}>{k}:</span>{v}
            </span>
          ) : null)}
        </div>
      )}
    </div>
  );
}

// ─── Main Module ──────────────────────────────────────────────────────────────

export default function MenuModule({ C }) {
  const G = C?.gold || "#c9a84c";
  const [allItems, setAllItems] = useState([]);
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null); // { item: null|obj, parentId: null|uuid }
  const [deleting, setDeleting] = useState(null);
  const [moving, setMoving] = useState(null);
  const [selectedItemId, setSelectedItemId] = useState(null);
  const [draftForm, setDraftForm] = useState(null); // live draft from edit panel

  async function load() {
    const { data, error } = await supabase
      .from("nav_items")
      .select("*")
      .order("position", { ascending: true });
    if (error) {
      setToast({ msg: "Failed to load nav items: " + error.message, type: "error" });
    } else {
      const flat = data || [];
      setAllItems(flat);
      setTree(buildTree(flat));
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleSave(form) {
    try {
      if (modal.item) {
        const { error } = await supabase
          .from("nav_items")
          .update({ ...form, updated_at: new Date().toISOString() })
          .eq("id", modal.item.id);
        if (error) throw error;
        setToast({ msg: "Nav item updated", type: "success" });
      } else {
        const siblings = allItems.filter(i =>
          (i.parent_id ?? null) === (form.parent_id ?? null)
        );
        const nextPos = siblings.length > 0 ? Math.max(...siblings.map(i => i.position)) + 1 : 1;
        const { error } = await supabase
          .from("nav_items")
          .insert([{ ...form, position: nextPos }]);
        if (error) throw error;
        setToast({ msg: "Nav item added", type: "success" });
      }
      setModal(null);
      await load();
    } catch (e) {
      setToast({ msg: "Error: " + e.message, type: "error" });
    }
  }

  async function handleDelete(item) {
    if (item.children?.length > 0) {
      setToast({ msg: "Remove child items first", type: "error" }); return;
    }
    setDeleting(item.id);
    try {
      const { error } = await supabase.from("nav_items").delete().eq("id", item.id);
      if (error) throw error;
      setToast({ msg: `"${item.label}" removed`, type: "success" });
      await load();
    } catch (e) {
      setToast({ msg: "Delete failed: " + e.message, type: "error" });
    } finally { setDeleting(null); }
  }

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

  return (
    <div style={{ padding: "0 0 80px" }}>
      {toast && <Toast msg={toast.msg} type={toast.type} onDone={() => setToast(null)} />}

      {/* Page header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 28 }}>
        <div>
          <div style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: G, marginBottom: 6 }}>Navigation</div>
          <h1 style={{ fontFamily: SERIF, fontSize: 30, fontWeight: 500, color: C?.white || "#f5efe4", margin: 0 }}>Menu Builder</h1>
          <p style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a", margin: "8px 0 0", lineHeight: 1.6 }}>
            Build your navigation tree. Changes reflect instantly in the canvas.
          </p>
        </div>
        <button
          onClick={() => setModal({ item: null, parentId: null })}
          style={{
            background: G, border: "none", borderRadius: 8, color: "#0a0906",
            padding: "11px 22px", fontFamily: SANS, fontSize: 12, fontWeight: 700,
            letterSpacing: "0.08em", textTransform: "uppercase", cursor: "pointer", flexShrink: 0,
          }}
        >+ Add Item</button>
      </div>

      {/* ── Studio: two-column split ── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 5fr) minmax(0, 7fr)",
        gap: 28,
        alignItems: "start",
      }}>

        {/* ── LEFT: tree + controls (independently scrollable) ── */}
        <div style={{ maxHeight: "calc(100vh - 160px)", overflowY: "auto", paddingRight: 2 }}>

          {/* Inline edit panel (replaces fixed modal) */}
          {modal !== null && (
            <ItemModal
              item={modal.item}
              parentId={modal.parentId}
              onSave={handleSave}
              onClose={() => { setModal(null); setSelectedItemId(null); setDraftForm(null); }}
              onFormChange={setDraftForm}
              C={C}
            />
          )}

          {/* Tree */}
          <div style={{ background: C?.card || "#1a1510", border: `1px solid ${C?.border || "#2a2218"}`, borderRadius: 10, overflow: "hidden" }}>
            {loading ? (
              <div style={{ padding: 48, textAlign: "center", fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a" }}>Loading...</div>
            ) : tree.length === 0 ? (
              <div style={{ padding: 48, textAlign: "center" }}>
                <div style={{ fontFamily: SERIF, fontSize: 20, color: C?.off || "#d4c8b0", marginBottom: 10 }}>No nav items yet</div>
                <div style={{ fontFamily: SANS, fontSize: 13, color: C?.grey || "#8a7d6a" }}>Click "Add Item" to start.</div>
              </div>
            ) : (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 16px 10px 76px", background: (C?.bg || "#0b0906") + "80", borderBottom: `1px solid ${C?.border || "#2a2218"}` }}>
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a" }}>Label / Path</span>
                  <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: C?.grey || "#8a7d6a" }}>Actions</span>
                </div>
                {tree.map(item => (
                  <TreeNode
                    key={item.id} item={item} siblings={tree} depth={0}
                    onEdit={i => { setModal({ item: i, parentId: null }); setSelectedItemId(i.id); }}
                    onAddChild={pid => setModal({ item: null, parentId: pid })}
                    onDelete={handleDelete} onToggleVisible={handleToggleVisible}
                    onMove={handleMove} C={C} deleting={deleting} moving={moving}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Type legend */}
          <div style={{ marginTop: 14, display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
            <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: C?.grey || "#8a7d6a" }}>Types:</span>
            {Object.entries(TYPE_BADGE_DEF).map(([key, b]) => (
              <span key={key} style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: b.bg, border: `1px solid ${b.border}`, borderRadius: 4, padding: "2px 7px", color: b.color }}>{b.label}</span>
            ))}
            <span style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", background: "#2a1010", border: "1px solid #4a2020", borderRadius: 4, padding: "2px 7px", color: "#f87171" }}>Hidden</span>
          </div>

          {/* Info note */}
          <div style={{ marginTop: 12, padding: "12px 16px", background: G + "0d", border: `1px solid ${G}28`, borderRadius: 8, fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a", lineHeight: 1.7 }}>
            Dropdown and Mega Menu items have a full Design tab with presets, animation, colours, and layout. CTA items pin right as buttons. Max 2 levels deep.
          </div>
        </div>

        {/* ── RIGHT: viewport-locked live canvas ── */}
        <div style={{
          position: "sticky", top: 24,
          maxHeight: "calc(100vh - 160px)",
          overflowY: "auto",
        }}>
          <LiveDesignCanvas items={allItems} C={C} selectedItemId={selectedItemId} draftForm={draftForm} />
        </div>

      </div>
    </div>
  );
}
