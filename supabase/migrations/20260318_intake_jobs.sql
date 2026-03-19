-- ─────────────────────────────────────────────────────────────────────────────
-- Listing Intake Studio: intake_jobs table
-- Purpose: Tracks each admin intake session — document, images, video URLs,
--          AI extraction output, copy mode choice, and assignment to a listing.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS intake_jobs (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Lifecycle
  status            TEXT        NOT NULL DEFAULT 'new',
  -- Values: 'new' | 'processing' | 'review' | 'approved' | 'pushed'

  listing_type      TEXT        NOT NULL DEFAULT 'venue',

  -- Source materials
  document_url      TEXT,
  document_name     TEXT,
  document_type     TEXT,       -- 'docx' | 'pdf' | 'txt'
  raw_text          TEXT,
  image_urls        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  video_urls        JSONB       NOT NULL DEFAULT '[]'::jsonb,
  website_url       TEXT,
  pasted_text       TEXT,

  -- AI extraction output
  extracted_json    JSONB,
  extraction_meta   JSONB,      -- { sources_used, extraction_confidence, missing_fields }

  -- Copy mode chosen in review screen
  copy_mode         TEXT,       -- 'original' | 'rewrite'

  -- Assignment
  listing_id        UUID        REFERENCES listings(id) ON DELETE SET NULL,
  vendor_account_id UUID,

  -- Internal notes
  notes             TEXT,

  -- Timestamps
  pushed_at         TIMESTAMPTZ,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Admin-only: disable RLS (matches project pattern for internal admin tables)
ALTER TABLE intake_jobs DISABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on every row change
CREATE TRIGGER intake_jobs_updated_at
  BEFORE UPDATE ON intake_jobs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS intake_jobs_status_idx      ON intake_jobs (status);
CREATE INDEX IF NOT EXISTS intake_jobs_created_at_idx  ON intake_jobs (created_at DESC);
CREATE INDEX IF NOT EXISTS intake_jobs_listing_id_idx  ON intake_jobs (listing_id);
