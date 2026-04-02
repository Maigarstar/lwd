// footer/footerUtils.js
// Shared constants, helpers, and defaults for the Footer Builder.
// Imports shared tokens from menuUtils to keep nav + footer consistent.
// ─────────────────────────────────────────────────────────────────────────────

// Re-export shared design tokens from menuUtils (single source of truth)
export { SANS, SERIF, MONO, LINK_TYPE_OPTIONS, buildLinkUrl, INTERNAL_PAGES } from "../menu/menuUtils.js";

// ── Footer block types ─────────────────────────────────────────────────────
// 'social' is NOT a block type — social links live in Footer Config (Brand Block section).
export const BLOCK_TYPE_OPTIONS = [
  { value: "link",          label: "Link",             desc: "Single nav link" },
  { value: "heading",       label: "Column Heading",   desc: "Section title, not clickable" },
  { value: "text",          label: "Text",             desc: "Free text or tagline" },
  { value: "category_list", label: "Venue Categories", desc: "Auto-populated from DB" },
  { value: "country_list",  label: "Destinations",     desc: "Auto-populated from DB" },
  { value: "mag_list",      label: "Magazine Sections",desc: "Auto-populated from DB" },
  { value: "iconic_venues", label: "Iconic Venues",    desc: "Curated venue strip" },
];

// ── Block type badge colours ───────────────────────────────────────────────
export const BLOCK_BADGE_DEF = {
  link:          { label: "Link",     bg: "#111",    border: "#2a2a2a", color: "#8a7d6a" },
  heading:       { label: "Heading",  bg: "#0a1628", border: "#1a3a5c", color: "#60a5fa" },
  text:          { label: "Text",     bg: "#111",    border: "#2a2a2a", color: "#8a7d6a" },
  category_list: { label: "Auto",     bg: "#0a2218", border: "#1a5c3a", color: "#4ade80" },
  country_list:  { label: "Auto",     bg: "#0a2218", border: "#1a5c3a", color: "#4ade80" },
  mag_list:      { label: "Auto",     bg: "#0a2218", border: "#1a5c3a", color: "#4ade80" },
  iconic_venues: { label: "Venues",   bg: "#1a1200", border: "#4a3800", color: "#c9a84c" },
};

// ── Layout options ─────────────────────────────────────────────────────────
export const LAYOUT_OPTIONS = [
  { value: "columns",   label: "Columns",   desc: "Standard multi-column layout" },
  { value: "editorial", label: "Editorial", desc: "Wide with featured brand block" },
  { value: "minimal",   label: "Minimal",   desc: "Single row, lean" },
];

// ── Column ID convention ───────────────────────────────────────────────────
// 0  = Iconic Venues strip
// 1  = Brand block (locked, config-driven)
// 2-5 = Nav columns (user-managed): Couples | Vendors | Destinations | Company
// 99 = Bottom bar utility links (moved from 5 to avoid nav column conflict)
export const ICONIC_STRIP_COL = 0;
export const BRAND_COL        = 1;
export const BOTTOM_BAR_COL   = 99;

// ── Default footer_config row ──────────────────────────────────────────────
export const DEFAULT_FOOTER_CONFIG = {
  id:                  "homepage",
  layout_columns:      6,
  layout_type:         "columns",
  pad_x:               48,
  pad_y:               64,
  bg_color:            "#0b0906",
  bg_opacity:          1.0,
  text_color:          "#d4c8b0",
  accent_color:        "#c9a84c",
  border_top:          true,
  border_color:        "#2a2218",
  show_logo:           true,
  logo_type:           "text",
  logo_text:           "Luxury Wedding Directory",
  logo_url:            "",
  logo_size:           32,
  brand_est_text:      "Est. 2006 · Worldwide",
  brand_office_text:   "Worldwide · London Headquarters",
  show_tagline:        true,
  tagline_text:        "The world's finest wedding directory",
  show_social:         true,
  social_instagram:    "",
  social_pinterest:    "",
  social_tiktok:       "",
  show_iconic_strip:      true,
  show_editorial_tagline: true,
  strip_pad_y:            20,
  show_newsletter:        true,
  newsletter_bg:          "#000000",
  newsletter_border_color:"#2d2d2d",
  newsletter_pad_y:       20,
  newsletter_label:       "The Editorial",
  newsletter_heading:     "The LWD Edit",
  newsletter_subtext:     "Monthly inspiration for modern luxury couples",
  newsletter_btn_label:   "Subscribe",
  strip_label:         "Iconic Venues",
  show_bottom_bar:     true,
  bottom_bar_bg:       "#080604",
  bottom_bar_text:     "#5a5045",
  copyright_text:      "2025 Luxury Wedding Directory",
  show_taigenic:       true,
  taigenic_label:      "Powered by Taigenic.AI",
  taigenic_tagline:    "AI systems for luxury brands",
  taigenic_url:        "/taigenic",
  taigenic_symbol:     "✦",
  visibility_mode:     "all",
};

// ── Blank new footer item ──────────────────────────────────────────────────
export function blankFooterItem(columnId = 2) {
  return {
    label:           "",
    url:             "",
    link_type:       "manual",
    link_record_slug:"",
    column_id:       columnId,
    position:        999,
    block_type:      columnId === ICONIC_STRIP_COL ? "iconic_venues" : "link",
    content:         "",
    iconic_venues:   [],
    visible:         true,
    open_new_tab:    false,
  };
}

// ── Map a DB footer_item row to the edit form shape ────────────────────────
export function itemToFooterForm(item) {
  return {
    label:           item.label || "",
    url:             item.url || "",
    link_type:       item.link_type || "manual",
    link_record_slug:item.link_record_slug || "",
    column_id:       item.column_id ?? 2,
    position:        item.position ?? 1,
    block_type:      item.block_type || "link",
    content:         item.content || "",
    iconic_venues:   item.iconic_venues || [],
    visible:         item.visible !== false,
    open_new_tab:    !!item.open_new_tab,
  };
}

// ── Placeholder names for auto-populated blocks (canvas only) ─────────────
export const AUTO_BLOCK_PLACEHOLDERS = {
  category_list: ["Garden & Estate", "Chateau", "Coastal Villa", "Mountain Lodge", "Urban Ballroom"],
  country_list:  ["Italy", "France", "Spain", "Greece", "Portugal"],
  mag_list:      ["Style & Trends", "Planning Guides", "Real Weddings", "Fashion & Beauty"],
};
