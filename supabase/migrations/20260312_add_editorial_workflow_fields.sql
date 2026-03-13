-- ============================================================
-- Add Editorial Workflow Fields to Magazine Posts
-- 20260312_add_editorial_workflow_fields.sql
--
-- Adds editors_choice and scheduled_date to support the
-- editorial publish workflow in Magazine Studio.
-- ============================================================

-- Add editors_choice boolean column
ALTER TABLE magazine_posts
ADD COLUMN IF NOT EXISTS editors_choice BOOLEAN DEFAULT false;

-- Add scheduled_date for scheduled publishing
ALTER TABLE magazine_posts
ADD COLUMN IF NOT EXISTS scheduled_date TIMESTAMPTZ;

-- Partial indexes for common queries
CREATE INDEX IF NOT EXISTS magazine_posts_editors_choice_idx
ON magazine_posts(editors_choice) WHERE editors_choice = true;

CREATE INDEX IF NOT EXISTS magazine_posts_scheduled_idx
ON magazine_posts(scheduled_date) WHERE scheduled_date IS NOT NULL;

-- Documentation
COMMENT ON COLUMN magazine_posts.editors_choice IS
'Boolean flag for Editor''s Choice articles. Displayed as a badge.';

COMMENT ON COLUMN magazine_posts.scheduled_date IS
'Optional future publish date. When set, article auto-publishes at this time.';
