-- ─────────────────────────────────────────────────────────────────────────────
-- publication_media
--
-- WordPress-style media library for the Publication Studio.
-- Every image uploaded via the image picker is recorded here so it can be
-- reused across pages, issues, and sessions without re-uploading.
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS publication_media (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id     text,                              -- nullable — some uploads are studio-wide
  url          text        NOT NULL,
  storage_path text        NOT NULL,
  filename     text,
  content_type text,
  file_size    integer,
  created_at   timestamptz NOT NULL DEFAULT now()
);

-- Fast listing: newest first, filter by issue
CREATE INDEX IF NOT EXISTS publication_media_created_at_idx ON publication_media (created_at DESC);
CREATE INDEX IF NOT EXISTS publication_media_issue_id_idx   ON publication_media (issue_id);

-- Deduplicate by storage path (re-uploads of same file hit same row)
CREATE UNIQUE INDEX IF NOT EXISTS publication_media_path_uidx ON publication_media (storage_path);

ALTER TABLE publication_media ENABLE ROW LEVEL SECURITY;

-- Authenticated admins can read/write everything (studio is admin-only)
CREATE POLICY "pm_all" ON publication_media
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
