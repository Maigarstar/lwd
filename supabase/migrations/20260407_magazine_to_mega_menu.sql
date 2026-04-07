-- 20260407_magazine_to_mega_menu.sql
-- Restructure Magazine to use main nav_items as a mega_menu with category children
-- ─────────────────────────────────────────────────────────────────────────────

-- Add 'type' column to nav_items if it doesn't exist
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS type text DEFAULT 'link';

-- Update Magazine item to be a mega_menu type (clear URL since mega_menu uses children)
UPDATE nav_items
SET type = 'mega_menu', url = NULL
WHERE id = 'a0000001-0000-0000-0000-000000000006' AND label = 'Magazine';

-- Insert magazine category children (as children of Magazine nav item)
-- These match the static CATEGORIES from src/pages/Magazine/data/categories.js
INSERT INTO nav_items (id, label, url, nav_action, parent_id, position, visible, type) VALUES
  ('mag-cat-001', 'Destinations', '/magazine/category/destinations', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 0, true, 'link'),
  ('mag-cat-002', 'Venues', '/magazine/category/venues', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 1, true, 'link'),
  ('mag-cat-003', 'Fashion & Beauty', '/magazine/category/fashion', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 2, true, 'link'),
  ('mag-cat-004', 'Real Weddings', '/magazine/category/real-weddings', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 3, true, 'link'),
  ('mag-cat-005', 'Planning', '/magazine/category/planning', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 4, true, 'link'),
  ('mag-cat-006', 'Honeymoons', '/magazine/category/honeymoons', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 5, true, 'link'),
  ('mag-cat-007', 'Trends', '/magazine/category/trends', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 6, true, 'link'),
  ('mag-cat-008', 'News', '/magazine/category/news', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 7, true, 'link'),
  ('mag-cat-009', 'Travel', '/magazine/category/travel', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 8, true, 'link'),
  ('mag-cat-010', 'Home & Living', '/magazine/category/home-living', 'mag_category', 'a0000001-0000-0000-0000-000000000006', 9, true, 'link')
ON CONFLICT (id) DO NOTHING;
