-- Add missing columns for social profile fields that are used in Listing Studio
-- weddings_hosted: integer displayed as "X+" on listing cards and profile
-- member_since:    year (text) displayed as "LWD Partner since YYYY"

ALTER TABLE listings ADD COLUMN IF NOT EXISTS weddings_hosted INTEGER;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS member_since TEXT;
