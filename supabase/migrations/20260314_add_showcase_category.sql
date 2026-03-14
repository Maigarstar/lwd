-- Add showcase_category column to listings
-- Determines what type of showcase page template to use for this listing
-- Values: 'venue' | 'planner' | 'photographer' | 'vendor' | 'florist' | 'caterer' | 'stylist' | 'entertainment' | 'hair_makeup'

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS showcase_category text DEFAULT 'venue';

-- Set existing showcase-enabled listings to 'venue' (they are all venues)
UPDATE listings
SET showcase_category = 'venue'
WHERE showcase_enabled = true AND showcase_category IS NULL;
