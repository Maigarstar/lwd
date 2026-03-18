-- Footer items: blocks that populate the footer columns, iconic strip, and bottom bar.
-- column_id convention:
--   0 = Iconic Venues strip
--   1 = Brand block (locked slot, controlled via footer_config)
--   2-4 = Nav columns (user-managed)
--   5 = Bottom bar utility links (Privacy, Terms, Cookies, etc.)

CREATE TABLE IF NOT EXISTS footer_items (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label            text NOT NULL DEFAULT '',
  url              text,
  link_type        text NOT NULL DEFAULT 'manual',
  link_record_slug text,
  column_id        integer NOT NULL DEFAULT 2,
  position         integer NOT NULL DEFAULT 1,
  block_type       text NOT NULL DEFAULT 'link',
  content          text,        -- for heading / text blocks
  iconic_venues    jsonb,       -- for iconic_venues block: [{name, url}] editorial entries
  visible          boolean NOT NULL DEFAULT true,
  open_new_tab     boolean NOT NULL DEFAULT false,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS footer_items_col_pos_idx ON footer_items (column_id, position);

ALTER TABLE footer_items DISABLE ROW LEVEL SECURITY;
