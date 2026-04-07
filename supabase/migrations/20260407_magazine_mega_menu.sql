-- Magazine as a simple link in directory nav
-- ─────────────────────────────────────────────────────────────────────────────

UPDATE nav_items
SET
  section = 'directory',
  type = 'link',
  url = '/magazine',
  mega_menu_source = NULL,
  mega_menu_source_slug = NULL,
  has_cta_in_panel = false,
  position = 6
WHERE id = 'a0000001-0000-0000-0000-000000000006';
