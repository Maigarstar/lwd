-- 20260407_fix_magazine_position.sql
-- Move Magazine to position after About (lower in the menu)
-- ─────────────────────────────────────────────────────────────────────────────

-- Swap positions: About and Magazine should be in the correct order
-- Original order: Home(0), Destinations(1), Aura(2), RealWed(3), Planning(4), About(5), Magazine(6)

-- Get the current IDs and positions
-- Magazine ID: a0000001-0000-0000-0000-000000000006
-- About ID: we need to find this

-- Find About and Magazine positions
SELECT id, label, position FROM nav_items
WHERE label IN ('About', 'Magazine') AND parent_id IS NULL;

-- Once we have the IDs, swap their positions:
-- UPDATE nav_items SET position = 6 WHERE label = 'Magazine' AND parent_id IS NULL;
-- UPDATE nav_items SET position = 5 WHERE label = 'About' AND parent_id IS NULL;
