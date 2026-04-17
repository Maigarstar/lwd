CREATE TABLE IF NOT EXISTS magazine_render_history (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id        uuid        NOT NULL REFERENCES magazine_issues(id) ON DELETE CASCADE,
  render_version  int         NOT NULL,
  page_count      int         NOT NULL DEFAULT 0,
  triggered_by    text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE magazine_render_history DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS magazine_render_history_issue_idx ON magazine_render_history(issue_id, render_version DESC);
