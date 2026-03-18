-- Footer global config: single row per site (id = 'homepage').
-- Controls design tokens, brand block, newsletter, and bottom bar appearance.

CREATE TABLE IF NOT EXISTS footer_config (
  id                   text PRIMARY KEY DEFAULT 'homepage',

  -- Layout
  layout_columns       integer NOT NULL DEFAULT 4,
  layout_type          text    NOT NULL DEFAULT 'columns',
  pad_x                integer NOT NULL DEFAULT 48,
  pad_y                integer NOT NULL DEFAULT 64,

  -- Design
  bg_color             text    NOT NULL DEFAULT '#0b0906',
  bg_opacity           numeric NOT NULL DEFAULT 1.0,
  text_color           text    NOT NULL DEFAULT '#d4c8b0',
  accent_color         text    NOT NULL DEFAULT '#c9a84c',
  border_top           boolean NOT NULL DEFAULT true,
  border_color         text    NOT NULL DEFAULT '#2a2218',

  -- Brand block (column 1, always left, locked slot)
  show_logo            boolean NOT NULL DEFAULT true,
  logo_size            integer NOT NULL DEFAULT 32,
  show_tagline         boolean NOT NULL DEFAULT true,
  tagline_text         text    NOT NULL DEFAULT 'The world''s finest wedding directory',
  show_social          boolean NOT NULL DEFAULT true,
  social_instagram     text    NOT NULL DEFAULT '',
  social_pinterest     text    NOT NULL DEFAULT '',
  social_tiktok        text    NOT NULL DEFAULT '',

  -- Newsletter section
  show_newsletter      boolean NOT NULL DEFAULT true,
  newsletter_heading   text    NOT NULL DEFAULT 'The LWD Edit',
  newsletter_subtext   text    NOT NULL DEFAULT 'Monthly inspiration for modern luxury couples',
  newsletter_btn_label text    NOT NULL DEFAULT 'Subscribe',

  -- Bottom bar
  show_bottom_bar      boolean NOT NULL DEFAULT true,
  bottom_bar_bg        text    NOT NULL DEFAULT '#080604',
  bottom_bar_text      text    NOT NULL DEFAULT '#5a5045',
  copyright_text       text    NOT NULL DEFAULT '2025 Luxury Wedding Directory',

  updated_at           timestamptz NOT NULL DEFAULT now()
);

INSERT INTO footer_config (id) VALUES ('homepage') ON CONFLICT DO NOTHING;

ALTER TABLE footer_config DISABLE ROW LEVEL SECURITY;
