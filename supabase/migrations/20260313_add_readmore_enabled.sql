-- Add readmore_enabled toggle to listings
-- Controls whether the "Read more →" expander shows on the venue profile About section
-- Default OFF so existing listings are unaffected

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS readmore_enabled boolean DEFAULT false;
