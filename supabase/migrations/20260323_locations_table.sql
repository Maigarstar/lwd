-- Create locations table for storing location content and curation data
-- Extends DIRECTORY_COUNTRIES, DIRECTORY_REGIONS, DIRECTORY_CITIES with editable content

CREATE TABLE IF NOT EXISTS public.locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_key TEXT NOT NULL UNIQUE, -- format: "country:italy", "region:italy:tuscany", "city:italy:tuscany:siena"
  location_type TEXT NOT NULL, -- "country" | "region" | "city"
  country_slug TEXT NOT NULL,
  region_slug TEXT,
  city_slug TEXT,

  -- Hero section
  hero_image TEXT,
  hero_video TEXT,
  hero_title TEXT,
  hero_subtitle TEXT,
  cta_text TEXT DEFAULT 'Explore Venues',
  cta_link TEXT,

  -- Featured curation
  featured_venues_title TEXT DEFAULT 'Signature Venues',
  featured_venues JSON DEFAULT '[]'::json, -- array of venue IDs
  featured_vendors_title TEXT DEFAULT 'Top Wedding Planners',
  featured_vendors JSON DEFAULT '[]'::json, -- array of vendor IDs

  -- Geography / Map config
  map_lat FLOAT,
  map_lng FLOAT,
  map_zoom INT DEFAULT 8,

  -- Discovery config
  discovery_filters JSON DEFAULT '{
    "showCapacityFilter": true,
    "showStyleFilter": true,
    "showPriceFilter": true,
    "defaultSort": "recommended"
  }'::json,

  -- Publishing
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Metadata
  metadata JSON DEFAULT '{}'::json
);

-- Create index for quick lookups by location_key
CREATE INDEX IF NOT EXISTS idx_locations_key ON public.locations(location_key);
CREATE INDEX IF NOT EXISTS idx_locations_type ON public.locations(location_type);
CREATE INDEX IF NOT EXISTS idx_locations_country ON public.locations(country_slug);
CREATE INDEX IF NOT EXISTS idx_locations_region ON public.locations(region_slug);

-- Enable RLS
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Public read for published locations
CREATE POLICY "Published locations are readable by everyone" ON public.locations
  FOR SELECT USING (published = TRUE);

-- Authenticated users can read all locations
CREATE POLICY "Authenticated users can read all locations" ON public.locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Admin can manage locations (testing: allow anon for dev, production: require service_role or auth)
CREATE POLICY "Admin can manage locations" ON public.locations
  FOR ALL USING (true); -- Allow all for testing - TODO: restrict to auth users in production

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_locations ON public.locations;
CREATE TRIGGER set_updated_at_locations
  BEFORE UPDATE ON public.locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();
