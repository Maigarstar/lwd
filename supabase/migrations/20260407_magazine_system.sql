-- Magazine Navigation System
-- Three-layer architecture: nav items → sections → post mappings
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Magazine Navigation Items (top-level categories)
-- Example: ALL, DESTINATIONS, VENUES, FASHION & BEAUTY, REAL WEDDINGS, etc.
CREATE TABLE IF NOT EXISTS mag_nav_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL, -- "DESTINATIONS", "FASHION & BEAUTY", etc.
  slug text NOT NULL UNIQUE, -- "destinations", "fashion-beauty"
  description text, -- Optional short description
  position integer DEFAULT 0, -- Sort order
  visible boolean DEFAULT true, -- Show/hide on frontend
  is_featured boolean DEFAULT false, -- Highlight this category
  parent_id uuid REFERENCES mag_nav_items(id) ON DELETE SET NULL, -- For dropdowns/hierarchy
  icon text, -- Optional icon reference
  color text, -- Optional accent color override
  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 2. Magazine Sections (editorial control layer)
-- Each nav category can have one or more sections with curated content
-- Example: DESTINATIONS nav item → sections for "Italy", "France", "Greece"
CREATE TABLE IF NOT EXISTS mag_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL, -- "Italy Destination Wedding Guide"
  slug text NOT NULL UNIQUE, -- "italy-destination-weddings"
  description text, -- Long-form description
  mag_nav_item_id uuid NOT NULL REFERENCES mag_nav_items(id) ON DELETE CASCADE, -- Which nav category

  -- Editorial metadata
  hero_title text, -- Large headline for section page
  hero_subtitle text, -- Subheading
  featured_post_id uuid, -- Can reference magazine_posts if they exist

  -- Display behavior
  display_style text DEFAULT 'grid', -- 'grid' | 'editorial' | 'mixed' | 'featured'

  -- Layout control
  show_on_nav boolean DEFAULT true, -- Show in navigation
  position integer DEFAULT 0, -- Sort order within nav item
  color_override text, -- Optional override for this section

  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- 3. Magazine Post to Section Mapping (flexible many-to-many)
-- Allows posts to belong to multiple sections with primary/secondary relationships
CREATE TABLE IF NOT EXISTS mag_post_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL, -- References magazine_posts.id (or future posts table)
  section_id uuid NOT NULL REFERENCES mag_sections(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false, -- Primary section for this post
  position integer DEFAULT 0, -- Sort order within section

  created_at timestamp DEFAULT now(),
  UNIQUE(post_id, section_id) -- Prevent duplicates
);

-- Magazine Navigation Configuration
-- Stores global magazine UI settings
CREATE TABLE IF NOT EXISTS mag_config (
  id text PRIMARY KEY DEFAULT 'magazine',
  -- Top navigation settings
  show_nav boolean DEFAULT true,
  nav_layout text DEFAULT 'horizontal', -- 'horizontal' | 'vertical'
  nav_scroll_mobile boolean DEFAULT true,

  -- Featured section
  featured_section_id uuid REFERENCES mag_sections(id) ON DELETE SET NULL,

  -- Theme
  theme_light boolean DEFAULT false, -- Light or dark theme

  -- Social
  newsletter_url text,
  social_instagram text,
  social_twitter text,

  created_at timestamp DEFAULT now(),
  updated_at timestamp DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_mag_nav_items_position ON mag_nav_items(position);
CREATE INDEX idx_mag_nav_items_visible ON mag_nav_items(visible);
CREATE INDEX idx_mag_sections_nav_item ON mag_sections(mag_nav_item_id);
CREATE INDEX idx_mag_sections_position ON mag_sections(position);
CREATE INDEX idx_mag_post_sections_post ON mag_post_sections(post_id);
CREATE INDEX idx_mag_post_sections_section ON mag_post_sections(section_id);
CREATE INDEX idx_mag_post_sections_primary ON mag_post_sections(is_primary);

-- Sample data for magazine navigation
-- This creates the editorial hierarchy described in the spec
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

-- Initial magazine config
INSERT INTO mag_config (id) VALUES ('magazine')
ON CONFLICT DO NOTHING;
