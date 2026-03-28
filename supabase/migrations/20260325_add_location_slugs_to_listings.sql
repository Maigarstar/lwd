-- Add missing location slug columns to listings table
-- These are used for proper geographic filtering and hierarchy

BEGIN;

-- Add slug columns for location hierarchy
ALTER TABLE listings ADD COLUMN IF NOT EXISTS country_slug TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS region_slug TEXT;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS city_slug TEXT;

-- Create indexes for common filtering patterns
CREATE INDEX IF NOT EXISTS idx_listings_country_slug ON listings(country_slug) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_listings_region_slug ON listings(region_slug) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_listings_city_slug ON listings(city_slug) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_listings_country_region ON listings(country_slug, region_slug) WHERE status = 'published';

COMMIT;
