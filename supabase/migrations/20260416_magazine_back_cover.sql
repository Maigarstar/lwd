-- 20260416_magazine_back_cover
-- Adds back cover image fields to magazine_issues.

ALTER TABLE magazine_issues
  ADD COLUMN IF NOT EXISTS back_cover_image         text,
  ADD COLUMN IF NOT EXISTS back_cover_storage_path  text;

COMMENT ON COLUMN magazine_issues.back_cover_image        IS 'Public URL of the back cover image';
COMMENT ON COLUMN magazine_issues.back_cover_storage_path IS 'Storage path: magazine-covers/[id]/back-cover.[ext]';
