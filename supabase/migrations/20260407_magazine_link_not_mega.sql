-- 20260407_magazine_link_not_mega.sql
-- Change Magazine from mega_menu to simple link in main navigation
-- ─────────────────────────────────────────────────────────────────────────────

-- Magazine should be a simple navigation link to /magazine
-- The categories are only displayed ON the magazine page itself, not in a mega menu

UPDATE nav_items
SET
  type = 'link',
  url = '/magazine'
WHERE label = 'Magazine' AND parent_id IS NULL;

-- Verify the change
SELECT id, label, type, url FROM nav_items
WHERE label = 'Magazine' AND parent_id IS NULL;
