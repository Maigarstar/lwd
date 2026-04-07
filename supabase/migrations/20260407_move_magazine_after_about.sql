-- 20260407_move_magazine_after_about.sql
-- Move Magazine to position AFTER About (lower in the menu navigation)
-- ─────────────────────────────────────────────────────────────────────────────

-- Current order (wrong):
--   Planning (position 4)
--   Magazine (position 5)
--   About (position 6)
--   List Your Venue (position 7)

-- Desired order (correct):
--   Planning (position 4)
--   About (position 5)
--   Magazine (position 6)
--   List Your Venue (position 7)

-- Get the Magazine and About items
-- Magazine ID: a0000001-0000-0000-0000-000000000006
-- Magazine should be repositioned AFTER About

-- First, find their current positions and IDs
SELECT id, label, type, position FROM nav_items
WHERE label IN ('Magazine', 'About') AND parent_id IS NULL
ORDER BY position;

-- Update positions:
-- Magazine: 5 → 6
-- About: 6 → 5

UPDATE nav_items SET position = 6 WHERE label = 'Magazine' AND parent_id IS NULL;
UPDATE nav_items SET position = 5 WHERE label = 'About' AND parent_id IS NULL;
