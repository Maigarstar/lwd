-- Add card_settings JSONB column to store per-card-type configuration
-- (media type, YouTube/Vimeo URLs, video URLs, images, title, description,
-- CTA, badges) for Venue Card / Vendor Card / GCard in Listing Studio.
ALTER TABLE listings ADD COLUMN IF NOT EXISTS card_settings JSONB DEFAULT '{}'::jsonb;
