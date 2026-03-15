-- Add hero_tagline column to listings
-- Displayed under the venue name in the listing page hero section
-- Editable in Listing Studio > Basic Details

ALTER TABLE listings
  ADD COLUMN IF NOT EXISTS hero_tagline text DEFAULT '';
