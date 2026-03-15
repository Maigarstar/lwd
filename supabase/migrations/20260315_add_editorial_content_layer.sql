-- Phase 3: Editorial Content Layer
-- Adds editorial metadata, approval workflow, and content quality scoring to listings table

ALTER TABLE listings ADD COLUMN IF NOT EXISTS hero_summary TEXT DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS section_intros JSONB DEFAULT '{}'::jsonb;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editorial_approved BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editorial_fact_checked BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editorial_last_reviewed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS refresh_notes TEXT DEFAULT NULL;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS content_quality_score INTEGER DEFAULT 0
  CHECK (content_quality_score >= 0 AND content_quality_score <= 100);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS editorial_last_reviewed_by UUID
  REFERENCES auth.users(id) ON DELETE SET NULL;

-- Performance indexes for common queries
CREATE INDEX IF NOT EXISTS listings_editorial_approved_idx ON listings(editorial_approved)
  WHERE editorial_approved = true;
CREATE INDEX IF NOT EXISTS listings_editorial_fact_checked_idx ON listings(editorial_fact_checked)
  WHERE editorial_fact_checked = true;
CREATE INDEX IF NOT EXISTS listings_content_quality_score_idx ON listings(content_quality_score DESC);
CREATE INDEX IF NOT EXISTS listings_editorial_last_reviewed_at_idx ON listings(editorial_last_reviewed_at DESC);

-- Comment on columns for documentation
COMMENT ON COLUMN listings.hero_summary IS 'Luxury hero description distinct from hero_tagline, used in showcase pages';
COMMENT ON COLUMN listings.section_intros IS 'JSONB object with intro text for sections: {overview, spaces, dining, rooms, art, weddings}';
COMMENT ON COLUMN listings.editorial_approved IS 'Editorial approval status, controls display of approval badge on public pages';
COMMENT ON COLUMN listings.editorial_fact_checked IS 'Fact-checking flag, part of approval workflow';
COMMENT ON COLUMN listings.editorial_last_reviewed_at IS 'ISO timestamp when content was last manually reviewed for accuracy';
COMMENT ON COLUMN listings.refresh_notes IS 'Internal admin notes about content freshness or what may need rechecking';
COMMENT ON COLUMN listings.content_quality_score IS 'Computed 0-100 score based on editorial completeness and approval status';
COMMENT ON COLUMN listings.editorial_last_reviewed_by IS 'User ID of editor who last reviewed/approved content';
