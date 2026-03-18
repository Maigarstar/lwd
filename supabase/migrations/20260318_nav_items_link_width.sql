-- 20260318_nav_items_link_width.sql
-- Adds dynamic link type and panel width mode to nav_items.
-- Safe to rerun: uses ADD COLUMN IF NOT EXISTS throughout.
-- ─────────────────────────────────────────────────────────────────────────────

-- Dynamic link type
-- Values: 'manual' | 'spa_action' | 'internal' | 'category' |
--         'mag_category' | 'country' | 'parent_only'
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS link_type        text NOT NULL DEFAULT 'manual';

-- Slug/identifier for the linked record (when link_type != 'manual' or 'spa_action')
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS link_record_slug text;

-- Panel width mode
-- Values: 'full' | 'container' | 'content' | 'custom'
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_width_mode  text    NOT NULL DEFAULT 'full';

-- Custom panel width in px (only used when panel_width_mode = 'custom')
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_custom_width integer;
