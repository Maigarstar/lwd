-- 20260318_nav_items_design_columns.sql
-- Adds all design-system, mega-menu, and panel columns to nav_items.
-- Safe to rerun: uses ADD COLUMN IF NOT EXISTS throughout.
-- ─────────────────────────────────────────────────────────────────────────────

-- Item type + basic flags
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS type            text    NOT NULL DEFAULT 'link';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS slug            text;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS is_cta          boolean NOT NULL DEFAULT false;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS cta_style       text    NOT NULL DEFAULT 'gold';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS mobile_hidden   boolean NOT NULL DEFAULT false;

-- Mega-menu / dropdown content source
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS mega_menu_enabled      boolean NOT NULL DEFAULT false;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS mega_menu_title        text;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS mega_menu_layout       text    NOT NULL DEFAULT 'columns';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS mega_menu_source       text    NOT NULL DEFAULT 'manual';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS mega_menu_source_slug  text;

-- Featured / editorial card inside the panel
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS featured_image  text;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS featured_title  text;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS featured_text   text;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS featured_link   text;

-- Design preset key
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS menu_preset     text    NOT NULL DEFAULT 'classic-luxury';

-- Panel animation
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS animation       text    NOT NULL DEFAULT 'slide-down';

-- Panel visual styling
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_bg            text    NOT NULL DEFAULT '#1a1510';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_text_color    text    NOT NULL DEFAULT '#f5efe4';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_accent_color  text    NOT NULL DEFAULT '#c9a84c';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_hover_color   text    NOT NULL DEFAULT '#c9a84c';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_border_color  text    NOT NULL DEFAULT '#2a2218';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_shadow        text    NOT NULL DEFAULT 'luxury';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_radius        integer NOT NULL DEFAULT 8;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_padding       integer NOT NULL DEFAULT 28;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_max_width     integer;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_full_width    boolean NOT NULL DEFAULT false;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_align         text    NOT NULL DEFAULT 'left';

-- Panel layout
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS layout_columns      integer NOT NULL DEFAULT 2;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS layout_type         text    NOT NULL DEFAULT '2-col';
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS show_descriptions   boolean NOT NULL DEFAULT true;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS show_icons          boolean NOT NULL DEFAULT false;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS show_thumbnails     boolean NOT NULL DEFAULT false;

-- Panel CTA block
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS has_cta_in_panel    boolean NOT NULL DEFAULT false;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_cta_label     text;
ALTER TABLE nav_items ADD COLUMN IF NOT EXISTS panel_cta_link      text;
