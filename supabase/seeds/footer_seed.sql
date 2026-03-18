-- Brand Footer seed — content from live site reference
-- Run AFTER the footer_items + footer_config migrations (including 20260318_footer_5col_layout.sql).
-- Safe to re-run: uses ON CONFLICT DO UPDATE on config, TRUNCATE+INSERT on items.
--
-- Column ID convention:
--   0  = Iconic Venues strip
--   1  = Brand Block (locked, config-driven)
--   2  = Couples
--   3  = Vendors
--   4  = Destinations / Collections
--   5  = Our Brands
--   6  = Company
--   99 = Bottom bar utility links
-- ────────────────────────────────────────────────────────────────────────────────

-- ── 1. Footer config ──────────────────────────────────────────────────────────
INSERT INTO footer_config (
  id, layout_columns, layout_type,
  pad_x, pad_y,
  bg_color, bg_opacity, text_color, accent_color,
  border_top, border_color,
  show_logo, logo_size, show_tagline, tagline_text, show_social,
  social_instagram, social_pinterest, social_tiktok,
  show_newsletter, newsletter_heading, newsletter_subtext, newsletter_btn_label,
  show_bottom_bar, bottom_bar_bg, bottom_bar_text, copyright_text,
  strip_label, visibility_mode
) VALUES (
  'homepage', 6, 'columns',
  64, 72,
  '#0b0906', 1.0, '#d4c8b0', '#c9a84c',
  true, '#2a2218',
  true, 28, true, 'The world''s most trusted luxury wedding directory. Connecting discerning couples with exceptional venues and professionals across 62 countries.', true,
  '', '', '',
  true, 'The LWD Edit', 'Monthly inspiration for modern luxury couples', 'Subscribe',
  true, '#080604', '#5a5045', '2026 LuxuryWeddingDirectory.com · Est. 2006 · All rights reserved',
  'Iconic Venues', 'all'
) ON CONFLICT (id) DO UPDATE SET
  layout_columns       = EXCLUDED.layout_columns,
  pad_x                = EXCLUDED.pad_x,
  pad_y                = EXCLUDED.pad_y,
  bg_color             = EXCLUDED.bg_color,
  text_color           = EXCLUDED.text_color,
  accent_color         = EXCLUDED.accent_color,
  border_top           = EXCLUDED.border_top,
  border_color         = EXCLUDED.border_color,
  show_logo            = EXCLUDED.show_logo,
  tagline_text         = EXCLUDED.tagline_text,
  show_newsletter      = EXCLUDED.show_newsletter,
  newsletter_heading   = EXCLUDED.newsletter_heading,
  newsletter_subtext   = EXCLUDED.newsletter_subtext,
  show_bottom_bar      = EXCLUDED.show_bottom_bar,
  copyright_text       = EXCLUDED.copyright_text,
  strip_label          = EXCLUDED.strip_label,
  visibility_mode      = EXCLUDED.visibility_mode,
  updated_at           = now();

-- ── 2. Clear existing items before seeding ────────────────────────────────────
TRUNCATE footer_items;

-- ── 3. Iconic Venues strip (column_id = 0) ────────────────────────────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, iconic_venues) VALUES (
  'Iconic Venues Strip',
  'iconic_venues',
  0,
  1,
  true,
  '[
    {"name": "The Peninsula Hotels", "url": ""},
    {"name": "Raffles",              "url": ""},
    {"name": "One and Only",         "url": ""},
    {"name": "Auberge Resorts",      "url": ""},
    {"name": "The Dorchester",       "url": ""},
    {"name": "Waldorf Astoria",      "url": ""},
    {"name": "Conrad",               "url": ""},
    {"name": "Park Hyatt",           "url": ""},
    {"name": "Banyan Tree",          "url": ""},
    {"name": "Jumeirah",             "url": ""}
  ]'::jsonb
);

-- ── 4. Couples column (column_id = 2) — editorial, 6 guided links ─────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, link_type, url) VALUES
  ('COUPLES',            'heading', 2, 1, true, 'manual', ''),
  ('Browse Venues',      'link',    2, 2, true, 'manual', '/venues'),
  ('Find Photographers', 'link',    2, 3, true, 'manual', '/vendors/photographers'),
  ('Wedding Planners',   'link',    2, 4, true, 'manual', '/vendors/wedding-planners'),
  ('Real Weddings',      'link',    2, 5, true, 'manual', '/real-weddings'),
  ('The Magazine',       'link',    2, 6, true, 'manual', '/magazine'),
  ('Planning Checklist', 'link',    2, 7, true, 'manual', '/planning-checklist');

-- ── 5. Vendors column (column_id = 3) — with proof link ───────────────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, link_type, url) VALUES
  ('VENDORS',            'heading', 3, 1, true, 'manual', ''),
  ('List Your Business', 'link',    3, 2, true, 'manual', '/list-your-business'),
  ('Advertise',          'link',    3, 3, true, 'manual', '/advertise'),
  ('Pricing Plans',      'link',    3, 4, true, 'manual', '/pricing'),
  ('Success Stories',    'link',    3, 5, true, 'manual', '/success-stories'),
  ('Vendor Dashboard',   'link',    3, 6, true, 'manual', '/vendor-dashboard'),
  ('Vendor Blog',        'link',    3, 7, true, 'manual', '/vendor-blog');

-- ── 6. Destinations column (column_id = 4) — curated locations ────────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, link_type, url) VALUES
  ('DESTINATIONS',   'heading', 4, 1, true, 'manual', ''),
  ('Lake Como',      'link',    4, 2, true, 'manual', '/destinations/lake-como'),
  ('Amalfi Coast',   'link',    4, 3, true, 'manual', '/destinations/amalfi-coast'),
  ('French Riviera', 'link',    4, 4, true, 'manual', '/destinations/french-riviera'),
  ('Tuscany',        'link',    4, 5, true, 'manual', '/destinations/tuscany'),
  ('Mykonos',        'link',    4, 6, true, 'manual', '/destinations/mykonos'),
  ('Dubai',          'link',    4, 7, true, 'manual', '/destinations/dubai'),
  ('All Destinations','link',   4, 8, true, 'manual', '/destinations');

-- ── 7. Our Brands column (column_id = 5) ─────────────────────────────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, link_type, url) VALUES
  ('OUR BRANDS',        'heading', 5, 1, true, 'manual', ''),
  ('LWD Magazine',      'link',    5, 2, true, 'manual', '/magazine'),
  ('Artistry Awards',   'link',    5, 3, true, 'manual', '/artistry-awards'),
  ('The LWD Standard',  'link',    5, 4, true, 'manual', '/the-lwd-standard'),
  ('Getting Married',   'link',    5, 5, true, 'manual', '/getting-married'),
  ('Real Weddings',     'link',    5, 6, true, 'manual', '/real-weddings'),
  ('LWD Awards',        'link',    5, 7, true, 'manual', '/lwd-awards');

-- ── 8. Company column (column_id = 6) — authority + contact ───────────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, link_type, url) VALUES
  ('COMPANY',             'heading', 6, 1, true, 'manual', ''),
  ('About Us',            'link',    6, 2, true, 'manual', '/about'),
  ('Editorial Standards', 'link',    6, 3, true, 'manual', '/editorial-standards'),
  ('Press & Media',       'link',    6, 4, true, 'manual', '/press'),
  ('Careers',             'link',    6, 5, true, 'manual', '/careers'),
  ('Contact',             'link',    6, 6, true, 'manual', '/contact'),
  ('Privacy Policy',      'link',    6, 7, true, 'manual', '/privacy-policy');

-- ── 9. Bottom bar links (column_id = 99) ──────────────────────────────────────
INSERT INTO footer_items (label, block_type, column_id, position, visible, link_type, url) VALUES
  ('Privacy', 'link', 99, 1, true, 'manual', '/privacy'),
  ('Terms',   'link', 99, 2, true, 'manual', '/terms'),
  ('Cookies', 'link', 99, 3, true, 'manual', '/cookies'),
  ('Sitemap', 'link', 99, 4, true, 'manual', '/sitemap'),
  ('Admin',   'link', 99, 5, true, 'manual', '/admin');
