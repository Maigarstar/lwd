-- Add is_template column to venue_showcases
-- Required by: saveShowcaseAsTemplate, fetchTemplates, cloneTemplate

ALTER TABLE venue_showcases
  ADD COLUMN IF NOT EXISTS is_template boolean NOT NULL DEFAULT false;

-- Index for fast template lookups
CREATE INDEX IF NOT EXISTS idx_venue_showcases_is_template
  ON venue_showcases (is_template)
  WHERE is_template = true;
