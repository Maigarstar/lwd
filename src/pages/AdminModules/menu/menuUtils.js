// menu/menuUtils.js
// Shared constants, helpers, and design tokens for the Menu Builder.
// ─────────────────────────────────────────────────────────────────────────────

// ── Font constants ─────────────────────────────────────────────────────────
export const SANS  = "'Nunito', sans-serif";
export const SERIF = "'Cormorant Garamond', Georgia, serif";
export const MONO  = "'JetBrains Mono', 'Fira Mono', monospace";

// ── Colour tokens ──────────────────────────────────────────────────────────
export const DEFAULT_C = {
  gold:    "#c9a84c",
  dark:    "#0d0d0d",
  white:   "#f5efe4",
  off:     "#d4c8b0",
  grey:    "#8a7d6a",
  grey2:   "#5a5045",
  card:    "#1a1510",
  border:  "#2a2218",
  bg:      "#0b0906",
};

// ── Max nesting depth ───────────────────────────────────────────────────────
export const MAX_DEPTH = 2;

// ── Nav item types ──────────────────────────────────────────────────────────
export const TYPE_OPTIONS = [
  { value: "link",      label: "Standard Link", desc: "Regular nav link" },
  { value: "dropdown",  label: "Dropdown",       desc: "Has child items with a panel" },
  { value: "mega_menu", label: "Mega Menu",       desc: "Full featured rich panel" },
  { value: "cta",       label: "CTA Button",     desc: "Styled button pinned right" },
];

export const TYPE_BADGE_DEF = {
  link:      { label: "Link",     bg: "#111",    border: "#2a2a2a", color: "#8a7d6a" },
  dropdown:  { label: "Dropdown", bg: "#0a1628", border: "#1a3a5c", color: "#60a5fa" },
  mega_menu: { label: "Mega",     bg: "#160d28", border: "#3a1a5c", color: "#a78bfa" },
  cta:       { label: "CTA",      bg: "#1a1200", border: "#4a3800", color: "#c9a84c" },
};

// ── CTA styles ─────────────────────────────────────────────────────────────
export const CTA_STYLES = [
  { value: "gold",    label: "Gold Fill" },
  { value: "outline", label: "Gold Outline" },
  { value: "dark",    label: "Dark Fill" },
];

// ── Panel animations ───────────────────────────────────────────────────────
export const ANIMATIONS = [
  { value: "slide-down",  label: "Slide Down" },
  { value: "fade",        label: "Fade" },
  { value: "scale-in",    label: "Scale In" },
  { value: "soft-reveal", label: "Soft Reveal" },
  { value: "slide-up",    label: "Slide Up" },
  { value: "none",        label: "No Animation" },
];

// ── Panel layout types ─────────────────────────────────────────────────────
export const LAYOUT_TYPES = [
  { value: "grid",           label: "Link Grid" },
  { value: "2-col",          label: "2 Columns" },
  { value: "3-col",          label: "3 Columns" },
  { value: "4-col",          label: "4 Columns" },
  { value: "featured-right", label: "Featured Card Right" },
  { value: "featured-left",  label: "Featured Card Left" },
  { value: "editorial",      label: "Editorial Block" },
];

// ── Shadow options ─────────────────────────────────────────────────────────
export const SHADOW_OPTIONS = [
  { value: "none",   label: "None" },
  { value: "soft",   label: "Soft" },
  { value: "medium", label: "Medium" },
  { value: "strong", label: "Strong" },
  { value: "luxury", label: "Luxury" },
];

export const SHADOW_MAP = {
  none:   "none",
  soft:   "0 4px 20px rgba(0,0,0,0.07)",
  medium: "0 8px 32px rgba(0,0,0,0.12)",
  strong: "0 16px 48px rgba(0,0,0,0.22)",
  luxury: "0 20px 60px rgba(0,0,0,0.28)",
};

// ── Align options (panel) ──────────────────────────────────────────────────
export const ALIGN_OPTIONS = [
  { value: "left",    label: "Left" },
  { value: "center",  label: "Center" },
  { value: "right",   label: "Right" },
  { value: "stretch", label: "Full Width" },
];

// ── Panel width modes ──────────────────────────────────────────────────────
export const PANEL_WIDTH_OPTIONS = [
  { value: "full",      label: "Full Width",      desc: "Stretches edge to edge" },
  { value: "container", label: "Container",        desc: "Max 1280px centered" },
  { value: "content",   label: "Content Width",   desc: "Max 960px centered" },
  { value: "custom",    label: "Custom Width",    desc: "Set exact pixel width" },
];

// ── Dynamic link types ─────────────────────────────────────────────────────
export const LINK_TYPE_OPTIONS = [
  { value: "manual",      label: "Custom URL",            desc: "Enter any URL manually" },
  { value: "internal",    label: "Internal Page",         desc: "Pick from site pages" },
  { value: "spa_action",  label: "SPA Action",            desc: "Internal app action key" },
  { value: "category",    label: "Venue Category",        desc: "Links to a venue type filter" },
  { value: "mag_category",label: "Magazine Category",     desc: "Links to a magazine section" },
  { value: "country",     label: "Country / Destination", desc: "Links to a destination page" },
  { value: "parent_only", label: "Parent Only",           desc: "No link, opens children only" },
];

export const INTERNAL_PAGES = [
  { slug: "/",                label: "Home" },
  { slug: "/venue",           label: "Browse Venues" },
  { slug: "/real-weddings",   label: "Real Weddings" },
  { slug: "/magazine",        label: "Magazine" },
  { slug: "/about",           label: "About" },
  { slug: "/the-lwd-standard",label: "The LWD Standard" },
  { slug: "/planning",        label: "Planning Guides" },
  { slug: "/vendors",         label: "Find a Vendor" },
  { slug: "/artistry-awards", label: "Artistry Awards" },
  { slug: "/contact",         label: "Contact" },
  { slug: "/join",            label: "List Your Venue" },
  { slug: "/discovery/aura",  label: "Aura Discovery" },
];

// ── SPA action options ─────────────────────────────────────────────────────
export const NAV_ACTION_OPTIONS = [
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

// ── Design presets ─────────────────────────────────────────────────────────
export const PRESETS = {
  "classic-luxury": {
    label: "Classic Luxury", desc: "Dark cream, gold accents",
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
    label: "Minimal Dark", desc: "Near-black, clean lines",
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
    label: "Editorial Light", desc: "Cream background, dark text",
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
    label: "Premium Gold", desc: "Deep black, full gold",
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
    label: "Full Width Showcase", desc: "Wide editorial with featured image",
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

// ── Canvas page themes ─────────────────────────────────────────────────────
export const PAGE_THEMES = {
  dark:      { bg: "#080602",  text: "#f5efe4", sub: "#f5efe440", heroText: "#c9a84c" },
  light:     { bg: "#f6f1e8",  text: "#171717", sub: "#17171760", heroText: "#8f7420" },
  editorial: { bg: "#111009",  text: "#f5efe4", sub: "#f5efe450", heroText: "#c9a84c" },
};

// ── Default nav_config row ─────────────────────────────────────────────────
export const DEFAULT_NAV_CONFIG = {
  id:                   "homepage",
  header_height:        72,
  header_transparent:   false,
  header_bg_color:      "#0b0906",
  header_bg_opacity:    1.0,
  header_shadow:        false,
  header_border_bottom: false,
  header_border_color:  "#2a2218",
  header_logo_size:     36,
  header_pad_x:         32,
  header_sticky:        true,
  header_sticky_height: 60,
  sticky_bg_color:      "#0b0906",
  sticky_bg_opacity:    0.96,
  sticky_shadow:        true,
  sticky_logo_size:     30,
  mobile_header_height: 60,
  mobile_logo_size:     28,
  mobile_logo_position: "left",
  mobile_menu_style:    "slide",
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function toSlug(s) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildTree(flat) {
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

// Resolve a nav item to its full URL (for live-mode clicks)
export function getLiveUrl(item) {
  if (item.url) return item.url.startsWith("http") ? item.url : `http://localhost:5176${item.url}`;
  if (item.nav_action) return `http://localhost:5176/?action=${item.nav_action}`;
  if (item.slug) return `http://localhost:5176/${item.slug}`;
  return "http://localhost:5176/";
}

// Build the canonical URL for a dynamic link type + record slug
export function buildLinkUrl(linkType, recordSlug) {
  if (!recordSlug) return "";
  if (linkType === "category")      return `/venue?type=${recordSlug}`;
  if (linkType === "mag_category")  return `/magazine/${recordSlug}`;
  if (linkType === "country")       return `/venue?country=${encodeURIComponent(recordSlug)}`;
  if (linkType === "internal")      return recordSlug;
  return "";
}

// Blank form for new nav items
export function blankForm() {
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
    panel_width_mode: "full", panel_custom_width: null,
    layout_columns: 2, layout_type: "2-col",
    show_descriptions: true, show_icons: false, show_thumbnails: false,
    has_cta_in_panel: false, panel_cta_label: "", panel_cta_link: "",
    label_font: "sans", label_color: "",
    link_type: "manual", link_record_slug: "",
  };
}

// Map a DB nav_item row to the form shape
export function itemToForm(item) {
  return {
    label:                item.label || "",
    slug:                 item.slug || "",
    url:                  item.url || "",
    nav_action:           item.nav_action || "",
    type:                 item.type || "link",
    open_new_tab:         !!item.open_new_tab,
    visible:              item.visible !== false,
    is_cta:               !!item.is_cta,
    cta_style:            item.cta_style || "gold",
    mega_menu_enabled:    !!item.mega_menu_enabled,
    mega_menu_title:      item.mega_menu_title || "",
    mega_menu_layout:     item.mega_menu_layout || "columns",
    featured_image:       item.featured_image || "",
    featured_title:       item.featured_title || "",
    featured_text:        item.featured_text || "",
    featured_link:        item.featured_link || "",
    mobile_hidden:        !!item.mobile_hidden,
    mega_menu_source:     item.mega_menu_source || "manual",
    mega_menu_source_slug:item.mega_menu_source_slug || "",
    menu_preset:          item.menu_preset || "classic-luxury",
    animation:            item.animation || "slide-down",
    panel_bg:             item.panel_bg || "#1a1510",
    panel_text_color:     item.panel_text_color || "#f5efe4",
    panel_accent_color:   item.panel_accent_color || "#c9a84c",
    panel_hover_color:    item.panel_hover_color || "#c9a84c",
    panel_border_color:   item.panel_border_color || "#2a2218",
    panel_shadow:         item.panel_shadow || "luxury",
    panel_radius:         item.panel_radius ?? 8,
    panel_padding:        item.panel_padding ?? 28,
    panel_max_width:      item.panel_max_width || null,
    panel_full_width:     !!item.panel_full_width,
    panel_align:          item.panel_align || "left",
    panel_width_mode:     item.panel_width_mode || "full",
    panel_custom_width:   item.panel_custom_width || null,
    layout_columns:       item.layout_columns ?? 2,
    layout_type:          item.layout_type || "2-col",
    show_descriptions:    item.show_descriptions !== false,
    show_icons:           !!item.show_icons,
    show_thumbnails:      !!item.show_thumbnails,
    has_cta_in_panel:     !!item.has_cta_in_panel,
    panel_cta_label:      item.panel_cta_label || "",
    panel_cta_link:       item.panel_cta_link || "",
    label_font:           item.label_font || "sans",
    label_color:          item.label_color || "",
    link_type:            item.link_type || "manual",
    link_record_slug:     item.link_record_slug || "",
  };
}
