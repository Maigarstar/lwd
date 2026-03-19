-- ─────────────────────────────────────────────────────────────────────────────
-- default_nav.sql
-- Default site-wide navigation for Luxury Wedding Directory.
-- Safe to rerun: uses ON CONFLICT (id) DO UPDATE throughout.
-- Run in Supabase SQL Editor to seed / reset the main nav.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── 1. nav_config ─────────────────────────────────────────────────────────────
INSERT INTO nav_config (
  id, header_height, header_transparent, header_bg_color, header_bg_opacity,
  header_shadow, header_border_bottom, header_border_color,
  header_logo_size, header_pad_x,
  header_sticky, header_sticky_height, sticky_bg_color, sticky_bg_opacity,
  sticky_shadow, sticky_logo_size,
  mobile_header_height, mobile_logo_size, mobile_logo_position, mobile_menu_style
) VALUES (
  'homepage', 72, false, '#0b0906', 1.0,
  false, false, '#2a2218',
  36, 32,
  true, 60, '#0b0906', 0.96,
  true, 30,
  60, 28, 'left', 'slide'
)
ON CONFLICT (id) DO UPDATE SET
  header_height        = EXCLUDED.header_height,
  header_transparent   = EXCLUDED.header_transparent,
  header_bg_color      = EXCLUDED.header_bg_color,
  header_bg_opacity    = EXCLUDED.header_bg_opacity,
  header_sticky        = EXCLUDED.header_sticky,
  sticky_bg_color      = EXCLUDED.sticky_bg_color,
  sticky_bg_opacity    = EXCLUDED.sticky_bg_opacity,
  sticky_shadow        = EXCLUDED.sticky_shadow,
  updated_at           = now();

-- ── 2. Top-level nav items ────────────────────────────────────────────────────
-- Full wipe first so old rows with different IDs don't survive as duplicates.
-- Children must go before parents to respect FK constraints.
DELETE FROM nav_items WHERE parent_id IS NOT NULL;
DELETE FROM nav_items;

INSERT INTO nav_items (
  id, label, url, nav_action, slug, type, is_cta, cta_style,
  position, visible, mobile_hidden,
  mega_menu_enabled, mega_menu_layout, mega_menu_source,
  menu_preset, animation,
  panel_bg, panel_text_color, panel_accent_color, panel_hover_color,
  panel_border_color, panel_shadow, panel_radius, panel_padding,
  panel_full_width, panel_align, layout_columns, layout_type,
  show_descriptions, has_cta_in_panel, panel_cta_label, panel_cta_link
) VALUES

-- Home
(
  'a0000001-0000-0000-0000-000000000001',
  'Home', '/', '', '', 'link', false, 'gold',
  1, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
),

-- Browse Venues (dropdown with destinations)
(
  'a0000001-0000-0000-0000-000000000002',
  'Browse Venues', '/venue', 'browse', '', 'mega_menu', false, 'gold',
  2, true, false,
  true, '3-col', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  true, 'stretch', 3, '3-col',
  true, true, 'Browse All Venues →', '/venue'
),

-- Aura Discovery
(
  'a0000001-0000-0000-0000-000000000003',
  'Aura Discovery', '/discovery/aura', 'aura-discovery', '', 'link', false, 'gold',
  3, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
),

-- Real Weddings
(
  'a0000001-0000-0000-0000-000000000004',
  'Real Weddings', '/real-weddings', 'real-weddings', '', 'link', false, 'gold',
  4, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
),

-- Planning
(
  'a0000001-0000-0000-0000-000000000005',
  'Planning', '/the-lwd-standard', 'planning', '', 'link', false, 'gold',
  5, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
),

-- Magazine
(
  'a0000001-0000-0000-0000-000000000006',
  'Magazine', '/magazine', 'magazine', '', 'link', false, 'gold',
  6, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
),

-- About
(
  'a0000001-0000-0000-0000-000000000007',
  'About', '/about', 'about', '', 'link', false, 'gold',
  7, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
),

-- List Your Venue (CTA button)
(
  'a0000001-0000-0000-0000-000000000008',
  'List Your Venue', '/join', 'join', '', 'cta', true, 'gold',
  8, true, false,
  false, 'columns', 'manual',
  'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c',
  '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col',
  true, false, '', ''
)

ON CONFLICT (id) DO UPDATE SET
  label              = EXCLUDED.label,
  url                = EXCLUDED.url,
  nav_action         = EXCLUDED.nav_action,
  type               = EXCLUDED.type,
  is_cta             = EXCLUDED.is_cta,
  cta_style          = EXCLUDED.cta_style,
  position           = EXCLUDED.position,
  visible            = EXCLUDED.visible,
  mega_menu_enabled  = EXCLUDED.mega_menu_enabled,
  mega_menu_layout   = EXCLUDED.mega_menu_layout,
  panel_full_width   = EXCLUDED.panel_full_width,
  panel_align        = EXCLUDED.panel_align,
  layout_columns     = EXCLUDED.layout_columns,
  layout_type        = EXCLUDED.layout_type,
  has_cta_in_panel   = EXCLUDED.has_cta_in_panel,
  panel_cta_label    = EXCLUDED.panel_cta_label,
  panel_cta_link     = EXCLUDED.panel_cta_link,
  updated_at         = now();

-- ── 3. Browse Venues dropdown children ───────────────────────────────────────
INSERT INTO nav_items (
  id, label, url, slug, type, position, visible, parent_id,
  is_cta, cta_style, mobile_hidden,
  mega_menu_enabled, mega_menu_layout, mega_menu_source, menu_preset, animation,
  panel_bg, panel_text_color, panel_accent_color, panel_hover_color,
  panel_border_color, panel_shadow, panel_radius, panel_padding,
  panel_full_width, panel_align, layout_columns, layout_type, show_descriptions
) VALUES

('a0000002-0000-0000-0000-000000000001',
  'Italy', '/italy', 'italy', 'link', 1, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000002',
  'France', '/france', 'france', 'link', 2, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000003',
  'Greece', '/greece', 'greece', 'link', 3, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000004',
  'UK & Ireland', '/uk', 'uk', 'link', 4, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000005',
  'Spain', '/spain', 'spain', 'link', 5, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000006',
  'Portugal', '/portugal', 'portugal', 'link', 6, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000007',
  'Maldives', '/maldives', 'maldives', 'link', 7, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000008',
  'Caribbean', '/caribbean', 'caribbean', 'link', 8, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true),

('a0000002-0000-0000-0000-000000000009',
  'USA', '/usa', 'usa', 'link', 9, true,
  'a0000001-0000-0000-0000-000000000002',
  false, 'gold', false, false, 'columns', 'manual', 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', 2, '2-col', true)

ON CONFLICT (id) DO UPDATE SET
  label      = EXCLUDED.label,
  url        = EXCLUDED.url,
  position   = EXCLUDED.position,
  visible    = EXCLUDED.visible,
  updated_at = now();
