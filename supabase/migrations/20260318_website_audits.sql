-- ─── supabase/migrations/20260318_website_audits.sql ─────────────────────────
-- Website audit results for both prospect outreach and vendor authority scoring.
-- A single shared engine powers both workflows via prospect_id / listing_id.

CREATE TABLE IF NOT EXISTS website_audits (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  url              TEXT NOT NULL,
  prospect_id      UUID REFERENCES prospects(id)  ON DELETE CASCADE,
  listing_id       UUID REFERENCES listings(id)   ON DELETE CASCADE,
  score            INTEGER NOT NULL DEFAULT 0,
  findings         JSONB NOT NULL DEFAULT '{}',
  ai_visible       BOOLEAN,
  ai_visible_note  TEXT,
  audit_type       TEXT NOT NULL DEFAULT 'manual',
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS website_audits_prospect_id_idx ON website_audits (prospect_id);
CREATE INDEX IF NOT EXISTS website_audits_listing_id_idx  ON website_audits (listing_id);
CREATE INDEX IF NOT EXISTS website_audits_created_at_idx  ON website_audits (created_at DESC);

-- Disable RLS: admin-only table, accessed via service role key in edge functions
ALTER TABLE website_audits DISABLE ROW LEVEL SECURITY;
