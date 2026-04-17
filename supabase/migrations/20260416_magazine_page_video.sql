-- ── magazine_issue_pages: video columns ──────────────────────────────────────
-- Add optional video embed support to each page.

ALTER TABLE magazine_issue_pages
  ADD COLUMN IF NOT EXISTS video_url      text,     -- YouTube, Vimeo, or direct MP4 URL
  ADD COLUMN IF NOT EXISTS video_autoplay boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS video_muted    boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN magazine_issue_pages.video_url      IS 'Optional video overlay for this page — YouTube/Vimeo embed or direct MP4';
COMMENT ON COLUMN magazine_issue_pages.video_autoplay IS 'Auto-play when page is viewed (muted only)';
COMMENT ON COLUMN magazine_issue_pages.video_muted    IS 'Play muted by default (required for autoplay)';
