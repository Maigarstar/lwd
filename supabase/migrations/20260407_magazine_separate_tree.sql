-- Magazine Separate Navigation Tree
-- Date: 2026-04-07
-- Purpose: Create completely independent magazine navigation system
-- This allows Magazine (and future Shop, etc.) to have their own tree structure
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Magazine Navigation Items (top-level categories)
CREATE TABLE IF NOT EXISTS mag_nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  position integer DEFAULT 0,
  visible boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  parent_id uuid REFERENCES mag_nav_items(id) ON DELETE SET NULL,
  icon text,
  color text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 2. Magazine Sections (editorial control layer)
CREATE TABLE IF NOT EXISTS mag_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  mag_nav_item_id uuid NOT NULL REFERENCES mag_nav_items(id) ON DELETE CASCADE,
  hero_title text,
  hero_subtitle text,
  featured_post_id uuid,
  display_style text DEFAULT 'grid',
  show_on_nav boolean DEFAULT true,
  position integer DEFAULT 0,
  color_override text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 3. Magazine Post to Section Mapping
CREATE TABLE IF NOT EXISTS mag_post_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL,
  section_id uuid NOT NULL REFERENCES mag_sections(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  position integer DEFAULT 0,
  created_at timestamp DEFAULT now(),
  UNIQUE(post_id, section_id)
);

-- 4. Magazine Configuration
CREATE TABLE IF NOT EXISTS mag_config (
  id text PRIMARY KEY DEFAULT 'magazine',
  show_nav boolean DEFAULT true,
  nav_layout text DEFAULT 'horizontal',
  nav_scroll_mobile boolean DEFAULT true,
  featured_section_id uuid REFERENCES mag_sections(id) ON DELETE SET NULL,
  theme_light boolean DEFAULT false,
  newsletter_url text,
  social_instagram text,
  social_twitter text,
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_mag_nav_items_position ON mag_nav_items(position);
CREATE INDEX IF NOT EXISTS idx_mag_nav_items_visible ON mag_nav_items(visible);
CREATE INDEX IF NOT EXISTS idx_mag_sections_nav_item ON mag_sections(mag_nav_item_id);
CREATE INDEX IF NOT EXISTS idx_mag_sections_position ON mag_sections(position);
CREATE INDEX IF NOT EXISTS idx_mag_post_sections_post ON mag_post_sections(post_id);
CREATE INDEX IF NOT EXISTS idx_mag_post_sections_section ON mag_post_sections(section_id);

-- Sample Magazine Navigation Categories
INSERT INTO mag_nav_items (label, slug, position, visible) VALUES
  ('All Stories', 'all', 0, true),
  ('Destinations', 'destinations', 1, true),
  ('Venues', 'venues', 2, true),
  ('Fashion & Beauty', 'fashion-beauty', 3, true),
  ('Real Weddings', 'real-weddings', 4, true),
  ('Planning', 'planning', 5, true),
  ('Honeymoons', 'honeymoons', 6, true),
  ('Trends', 'trends', 7, true),
  ('News', 'news', 8, true),
  ('Travel', 'travel', 9, true),
  ('Home & Living', 'home-living', 10, true)
ON CONFLICT DO NOTHING;

-- Initialize Magazine Config
INSERT INTO mag_config (id) VALUES ('magazine')
ON CONFLICT DO NOTHING;
