-- nav_homepage.sql
-- Full homepage navigation seed for Luxury Wedding Directory.
-- Clears existing items and inserts a real structured menu.
-- Safe to rerun: DELETE then INSERT with fixed UUIDs.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Wipe existing items (children first to respect FK)
DELETE FROM nav_items WHERE parent_id IS NOT NULL;
DELETE FROM nav_items;

-- 2. Root nav items ────────────────────────────────────────────────────────────
INSERT INTO nav_items (
  id, label, slug, url, nav_action, type, position, visible,
  is_cta, cta_style, mega_menu_enabled, menu_preset, animation,
  panel_bg, panel_text_color, panel_accent_color, panel_hover_color,
  panel_border_color, panel_shadow, panel_radius, panel_padding,
  panel_full_width, panel_align, layout_type, show_descriptions,
  has_cta_in_panel, panel_cta_label, panel_cta_link,
  featured_title, featured_text, featured_link
) VALUES

-- Home (simple link — position 0, always first)
(
  'b0000001-0000-0000-0000-000000000000',
  'Home', '', '/', null, 'link', 0, true,
  false, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
),

-- Browse Venues (mega menu — full width, 3-col, venue types)
(
  'b0000001-0000-0000-0000-000000000001',
  'Browse Venues', 'venue', '/venue', 'browse', 'mega_menu', 1, true,
  false, 'gold', true, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 32,
  true, 'left', '3-col', true,
  true, 'View All Venues', '/venue',
  'Find Your Perfect Venue',
  'Over 500 handpicked luxury wedding venues across the UK and Europe.',
  '/venue'
),

-- Aura Discovery (link)
(
  'b0000001-0000-0000-0000-000000000002',
  'Aura Discovery', 'discovery/aura', '/discovery/aura', 'aura-discovery', 'link', 2, true,
  false, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
),

-- Real Weddings (link)
(
  'b0000001-0000-0000-0000-000000000003',
  'Real Weddings', 'real-weddings', '/real-weddings', 'real-weddings', 'link', 3, true,
  false, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
),

-- Planning (dropdown — 2-col, key guides)
(
  'b0000001-0000-0000-0000-000000000004',
  'Planning', 'the-lwd-standard', '/the-lwd-standard', 'planning', 'dropdown', 4, true,
  false, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
),

-- Magazine (link)
(
  'b0000001-0000-0000-0000-000000000005',
  'Magazine', 'magazine', '/magazine', 'magazine', 'link', 5, true,
  false, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
),

-- About (link)
(
  'b0000001-0000-0000-0000-000000000006',
  'About', 'about', '/about', 'about', 'link', 6, true,
  false, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
),

-- List Your Venue (CTA — gold fill button, pinned right)
(
  'b0000001-0000-0000-0000-000000000007',
  'List Your Venue', 'join', '/join', 'join', 'cta', 7, true,
  true, 'gold', false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true, false, '', '', '', '', ''
);


-- 3. Browse Venues — mega menu children (venue types) ─────────────────────────
INSERT INTO nav_items (
  id, label, slug, url, type, position, visible, parent_id,
  is_cta, mega_menu_enabled, menu_preset, animation,
  panel_bg, panel_text_color, panel_accent_color, panel_hover_color,
  panel_border_color, panel_shadow, panel_radius, panel_padding,
  panel_full_width, panel_align, layout_type, show_descriptions
) VALUES

(
  'b0000002-0000-0000-0000-000000000001',
  'Country Houses & Estates', 'country-house-wedding-venues', '/venue?type=country-house',
  'link', 1, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000002',
  'Castles & Historic Properties', 'castle-wedding-venues', '/venue?type=castle',
  'link', 2, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000003',
  'Barn & Rural Venues', 'barn-wedding-venues', '/venue?type=barn',
  'link', 3, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000004',
  'Garden & Outdoor Venues', 'garden-wedding-venues', '/venue?type=garden',
  'link', 4, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000005',
  'City & Boutique Hotels', 'hotel-wedding-venues', '/venue?type=hotel',
  'link', 5, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000006',
  'Exclusive Use Properties', 'exclusive-use-venues', '/venue?type=exclusive-use',
  'link', 6, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000007',
  'Vineyard & Winery Venues', 'vineyard-wedding-venues', '/venue?type=vineyard',
  'link', 7, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000008',
  'Coastal & Waterfront Venues', 'coastal-wedding-venues', '/venue?type=coastal',
  'link', 8, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000002-0000-0000-0000-000000000009',
  'Destination Weddings', 'destination-wedding-venues', '/venue?type=destination',
  'link', 9, true, 'b0000001-0000-0000-0000-000000000001',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
);


-- 4. Planning — dropdown children ─────────────────────────────────────────────
INSERT INTO nav_items (
  id, label, slug, url, nav_action, type, position, visible, parent_id,
  is_cta, mega_menu_enabled, menu_preset, animation,
  panel_bg, panel_text_color, panel_accent_color, panel_hover_color,
  panel_border_color, panel_shadow, panel_radius, panel_padding,
  panel_full_width, panel_align, layout_type, show_descriptions
) VALUES

(
  'b0000003-0000-0000-0000-000000000001',
  'The LWD Standard', 'the-lwd-standard', '/the-lwd-standard', 'planning',
  'link', 1, true, 'b0000001-0000-0000-0000-000000000004',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000003-0000-0000-0000-000000000002',
  'Planning Guides', 'planning-guides', '/planning', null,
  'link', 2, true, 'b0000001-0000-0000-0000-000000000004',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000003-0000-0000-0000-000000000003',
  'Find a Vendor', 'vendors', '/vendors', null,
  'link', 3, true, 'b0000001-0000-0000-0000-000000000004',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000003-0000-0000-0000-000000000004',
  'Artistry Awards', 'artistry-awards', '/artistry-awards', 'artistry-awards',
  'link', 4, true, 'b0000001-0000-0000-0000-000000000004',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
),
(
  'b0000003-0000-0000-0000-000000000005',
  'Contact', 'contact', '/contact', 'contact',
  'link', 5, true, 'b0000001-0000-0000-0000-000000000004',
  false, false, 'classic-luxury', 'slide-down',
  '#1a1510', '#f5efe4', '#c9a84c', '#c9a84c', '#2a2218', 'luxury', 8, 28,
  false, 'left', '2-col', true
);
