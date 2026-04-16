-- 20260416_magazine_scheduled_publish
-- Adds scheduled publishing + page size/layout settings to magazine_issues.

ALTER TABLE magazine_issues
  ADD COLUMN IF NOT EXISTS scheduled_publish_at  timestamptz,
  ADD COLUMN IF NOT EXISTS page_size             text DEFAULT 'A4'
    CHECK (page_size IN ('A4','A5','US_LETTER','SQUARE','TABLOID')),
  ADD COLUMN IF NOT EXISTS spread_layout         text DEFAULT 'double'
    CHECK (spread_layout IN ('double','single'));

COMMENT ON COLUMN magazine_issues.scheduled_publish_at IS 'When set, cron job publishes the issue automatically at this UTC time';
COMMENT ON COLUMN magazine_issues.page_size            IS 'Physical page size: A4 (210×297mm), A5 (148×210mm), US_LETTER, SQUARE, TABLOID';
COMMENT ON COLUMN magazine_issues.spread_layout        IS 'double = two-page spread in reader; single = one page at a time';

-- Index for the scheduler query
CREATE INDEX IF NOT EXISTS magazine_issues_scheduled_idx
  ON magazine_issues(scheduled_publish_at)
  WHERE scheduled_publish_at IS NOT NULL AND status = 'draft';
