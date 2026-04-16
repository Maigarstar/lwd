-- ── magazine_brand_kit ────────────────────────────────────────────────────────
-- Single-row brand kit for the publication studio.
-- Stores colors, fonts, logos, default palette, and custom reader domain.

CREATE TABLE IF NOT EXISTS magazine_brand_kit (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name            text        NOT NULL DEFAULT 'Default Brand Kit',
  -- Colors
  primary_color   text        DEFAULT '#C9A96E',  -- gold
  secondary_color text        DEFAULT '#18120A',  -- dark
  accent_color    text        DEFAULT '#E8E3D8',  -- cream
  -- Fonts
  heading_font    text        DEFAULT 'Cormorant Garamond',
  body_font       text        DEFAULT 'Jost',
  -- Logo
  logo_url        text,
  logo_dark_url   text,       -- inverted version for dark backgrounds
  -- Cover template defaults
  default_palette text        DEFAULT 'obsidian',
  -- Custom reader domain
  custom_domain   text,
  -- Timestamps
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

COMMENT ON COLUMN magazine_brand_kit.custom_domain IS 'Custom reader domain e.g. magazine.yourbrand.com';

ALTER TABLE magazine_brand_kit DISABLE ROW LEVEL SECURITY;

INSERT INTO magazine_brand_kit (name) VALUES ('LWD Default') ON CONFLICT DO NOTHING;

CREATE TRIGGER magazine_brand_kit_updated_at
  BEFORE UPDATE ON magazine_brand_kit
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
