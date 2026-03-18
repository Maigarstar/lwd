-- 20260318_nav_config.sql
-- Global navigation configuration table - one row per site context.
-- Stores header appearance, sticky behaviour, and mobile settings.
-- Safe to rerun: CREATE IF NOT EXISTS + ON CONFLICT DO NOTHING.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nav_config (
  id                   text    PRIMARY KEY DEFAULT 'homepage',

  -- Header appearance
  header_height        integer NOT NULL DEFAULT 72,
  header_transparent   boolean NOT NULL DEFAULT false,
  header_bg_color      text    NOT NULL DEFAULT '#0b0906',
  header_bg_opacity    numeric NOT NULL DEFAULT 1.0,
  header_shadow        boolean NOT NULL DEFAULT false,
  header_border_bottom boolean NOT NULL DEFAULT false,
  header_border_color  text    NOT NULL DEFAULT '#2a2218',
  header_logo_size     integer NOT NULL DEFAULT 36,
  header_pad_x         integer NOT NULL DEFAULT 32,

  -- Sticky overrides
  header_sticky        boolean NOT NULL DEFAULT true,
  header_sticky_height integer NOT NULL DEFAULT 60,
  sticky_bg_color      text    NOT NULL DEFAULT '#0b0906',
  sticky_bg_opacity    numeric NOT NULL DEFAULT 0.96,
  sticky_shadow        boolean NOT NULL DEFAULT true,
  sticky_logo_size     integer NOT NULL DEFAULT 30,

  -- Mobile
  mobile_header_height integer NOT NULL DEFAULT 60,
  mobile_logo_size     integer NOT NULL DEFAULT 28,
  mobile_logo_position text    NOT NULL DEFAULT 'left',
  mobile_menu_style    text    NOT NULL DEFAULT 'slide',

  updated_at           timestamptz NOT NULL DEFAULT now()
);

-- Seed the default homepage row
INSERT INTO nav_config (id) VALUES ('homepage') ON CONFLICT DO NOTHING;

-- RLS: disabled to match project pattern (admin reads via anon client)
ALTER TABLE nav_config DISABLE ROW LEVEL SECURITY;
