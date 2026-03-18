-- 6-column footer layout migration
-- New column convention:
--   0  = Iconic strip
--   1  = Brand (locked)
--   2  = Couples
--   3  = Vendors
--   4  = Destinations
--   5  = Our Brands (new)
--   6  = Company (moved from 4)
--   99 = Bottom bar (moved from 5)
-- ──────────────────────────────────────────────────────────────────────────────

-- 1. Move bottom bar links: 5 → 99 first (avoids conflict)
UPDATE footer_items SET column_id = 99 WHERE column_id = 5;

-- 2. Move Company column: 4 → 6
UPDATE footer_items SET column_id = 6 WHERE column_id = 4;

-- 3. Update the layout to 6 columns
UPDATE footer_config SET layout_columns = 6 WHERE id = 'homepage';

-- 4. Columns 4 (Destinations) and 5 (Our Brands) are now empty.
--    Re-run footer_seed.sql to populate them, or add blocks via the Brand Footer panel.
