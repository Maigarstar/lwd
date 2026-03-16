-- venue_showcases: Dynamic showcase/profile pages for venues and planners.
-- Created manually in Supabase SQL editor (Session 25, 2026-03-14).
-- This migration documents and re-creates the table idempotently.

CREATE TABLE IF NOT EXISTS venue_showcases (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type            TEXT NOT NULL DEFAULT 'venue' CHECK (type IN ('venue', 'planner')),
  title           TEXT NOT NULL,
  slug            TEXT NOT NULL UNIQUE,
  location        TEXT,
  excerpt         TEXT,
  hero_image_url  TEXT,
  logo_url        TEXT,
  preview_url     TEXT,
  listing_id      UUID REFERENCES listings(id) ON DELETE SET NULL,
  status          TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'live')),
  sections        JSONB NOT NULL DEFAULT '[]',
  key_stats       JSONB NOT NULL DEFAULT '[]',
  sort_order      INTEGER NOT NULL DEFAULT 0,
  published_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS venue_showcases_type_idx       ON venue_showcases (type);
CREATE INDEX IF NOT EXISTS venue_showcases_status_idx     ON venue_showcases (status);
CREATE INDEX IF NOT EXISTS venue_showcases_sort_order_idx ON venue_showcases (sort_order);

-- RLS disabled: admin-only writes via service role key.
-- Hardening to row-level policies is planned for a future phase.
ALTER TABLE venue_showcases DISABLE ROW LEVEL SECURITY;

-- updated_at auto-trigger (reuse existing helper if available)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'set_venue_showcases_updated_at'
  ) THEN
    CREATE TRIGGER set_venue_showcases_updated_at
      BEFORE UPDATE ON venue_showcases
      FOR EACH ROW EXECUTE FUNCTION moddatetime(updated_at);
  END IF;
EXCEPTION WHEN others THEN
  -- moddatetime extension may not be installed; skip trigger silently
  NULL;
END$$;
