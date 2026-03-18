-- 20260318_nav_items.sql
-- Public website navigation menu - admin-configurable nav items.
-- Each row is one top-level nav link (or dropdown child via parent_id).
-- Safe to rerun: all CREATE statements are IF NOT EXISTS.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS nav_items (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label         text NOT NULL,
  url           text,
  nav_action    text,          -- internal SPA action key e.g. 'about', 'real-weddings'
  open_new_tab  boolean NOT NULL DEFAULT false,
  visible       boolean NOT NULL DEFAULT true,
  position      integer NOT NULL DEFAULT 0,
  parent_id     uuid REFERENCES nav_items(id) ON DELETE CASCADE,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS nav_items_position_idx ON nav_items(position);
CREATE INDEX IF NOT EXISTS nav_items_parent_id_idx ON nav_items(parent_id);

-- Auto-update updated_at
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'nav_items_updated_at') THEN
    CREATE TRIGGER nav_items_updated_at
      BEFORE UPDATE ON nav_items
      FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- RLS: disabled to match project pattern (admin reads are authenticated via admin session)
ALTER TABLE nav_items DISABLE ROW LEVEL SECURITY;

-- ── Default seed (mirrors current hardcoded HomeNav links) ──────────────────
INSERT INTO nav_items (id, label, url, nav_action, position, visible) VALUES
  ('nav00001-0000-0000-0000-000000000001', 'Browse',          '/venue',          'browse',        1, true),
  ('nav00001-0000-0000-0000-000000000002', 'Aura Discovery',  '/discovery/aura', 'aura-discovery',2, true),
  ('nav00001-0000-0000-0000-000000000003', 'Real Weddings',   '/real-weddings',  'real-weddings', 3, true),
  ('nav00001-0000-0000-0000-000000000004', 'Planning',        '/the-lwd-standard','planning',     4, true),
  ('nav00001-0000-0000-0000-000000000005', 'About',           '/about',          'about',         5, true),
  ('nav00001-0000-0000-0000-000000000006', 'Magazine',        '/magazine',       'magazine',      6, true)
ON CONFLICT (id) DO NOTHING;
