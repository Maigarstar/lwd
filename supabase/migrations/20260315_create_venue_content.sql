-- Create venue_content table for managing section intros and visibility
-- Stores dynamic content, section visibility toggles, and approval metadata

CREATE TABLE IF NOT EXISTS venue_content (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  venue_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- Dynamic section intros (one per section)
  section_intros JSONB NOT NULL DEFAULT '{
    "overview": null,
    "spaces": null,
    "dining": null,
    "rooms": null,
    "art": null,
    "golf": null,
    "weddings": null
  }',

  -- Section visibility toggles (true = show, false = hide)
  section_visibility JSONB NOT NULL DEFAULT '{
    "overview": true,
    "spaces": true,
    "dining": true,
    "rooms": true,
    "art": true,
    "golf": true,
    "weddings": true
  }',

  -- Content approval metadata
  fact_checked BOOLEAN NOT NULL DEFAULT false,
  approved BOOLEAN NOT NULL DEFAULT false,
  last_reviewed_at TIMESTAMPTZ,

  -- Content quality scoring (0-100)
  -- Score factors: sections with intros, fact_checked status, approved status
  content_score INT DEFAULT 0,

  -- Editorial ownership tracking
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(venue_id)
);

-- Index for fast lookups by venue_id
CREATE INDEX IF NOT EXISTS venue_content_venue_id_idx ON venue_content(venue_id);

-- Index for filtering by approval status
CREATE INDEX IF NOT EXISTS venue_content_approved_idx ON venue_content(approved);

-- Index for sorting by content quality score (useful for Aura rankings)
CREATE INDEX IF NOT EXISTS venue_content_score_idx ON venue_content(content_score DESC);

-- Trigger to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_venue_content_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS venue_content_updated_at_trigger ON venue_content;
CREATE TRIGGER venue_content_updated_at_trigger
BEFORE UPDATE ON venue_content
FOR EACH ROW
EXECUTE FUNCTION update_venue_content_updated_at();

-- RLS (Row Level Security) disabled for MVP
-- Hardening planned for production deployment
