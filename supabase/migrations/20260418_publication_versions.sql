-- ─────────────────────────────────────────────────────────────────────────────
-- publication_versions
--
-- WordPress-style revision history for the Publication Studio.
-- Every manual save and auto-save creates a snapshot of the entire issue's
-- pages array. Users can browse history and restore any previous version.
--
-- Retention: last 50 versions per issue (enforced in application layer).
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS publication_versions (
  id             uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id       uuid        NOT NULL,
  version_number integer     NOT NULL,          -- 1, 2, 3… per issue
  pages_snapshot jsonb       NOT NULL,          -- full pages array (canvasJSON for each page)
  page_count     integer     NOT NULL DEFAULT 0,
  label          text        NOT NULL DEFAULT 'Save', -- 'Auto-save' | 'Manual save' | user label
  created_at     timestamptz NOT NULL DEFAULT now()
);

-- Fast listing: newest first per issue
CREATE INDEX IF NOT EXISTS publication_versions_issue_idx
  ON publication_versions (issue_id, version_number DESC);

-- Unique version numbers per issue
CREATE UNIQUE INDEX IF NOT EXISTS publication_versions_issue_version_uidx
  ON publication_versions (issue_id, version_number);

ALTER TABLE publication_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pv_all" ON publication_versions
  FOR ALL
  USING  (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- ── Helper: next version number for an issue ──────────────────────────────────
CREATE OR REPLACE FUNCTION next_publication_version(p_issue_id uuid)
RETURNS integer
LANGUAGE sql STABLE AS $$
  SELECT COALESCE(MAX(version_number), 0) + 1
  FROM   publication_versions
  WHERE  issue_id = p_issue_id;
$$;
