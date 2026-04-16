CREATE TABLE IF NOT EXISTS magazine_page_comments (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id    uuid        NOT NULL REFERENCES magazine_issues(id) ON DELETE CASCADE,
  page_number int         NOT NULL,
  author_name text        NOT NULL DEFAULT 'Admin',
  content     text        NOT NULL,
  resolved    boolean     NOT NULL DEFAULT false,
  parent_id   uuid        REFERENCES magazine_page_comments(id) ON DELETE CASCADE,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE magazine_page_comments DISABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS magazine_page_comments_issue_idx ON magazine_page_comments(issue_id, page_number);
CREATE INDEX IF NOT EXISTS magazine_page_comments_parent_idx ON magazine_page_comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE TRIGGER magazine_page_comments_updated_at
  BEFORE UPDATE ON magazine_page_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
