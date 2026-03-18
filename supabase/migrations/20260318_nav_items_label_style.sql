-- 20260318_nav_items_label_style.sql
-- Adds per-item label font and colour overrides to nav_items.
-- Safe to rerun: uses ADD COLUMN IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

-- "sans" | "serif" | "mono"  (maps to Nunito / Cormorant Garamond / JetBrains Mono)
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS label_font  text NOT NULL DEFAULT 'sans';

-- Optional hex override; empty string means inherit from theme
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS label_color text NOT NULL DEFAULT '';
