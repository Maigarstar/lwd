-- ============================================================
-- Phase 1: SEO columns for public.locations
-- Part of the SEO migration into LocationsModule.
-- Adds core SEO, Open Graph, Twitter Card, Schema.org,
-- AI/discovery, and audit fields to the existing locations table.
-- ============================================================

-- Core SEO
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_title TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_description TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_keywords TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_canonical_url TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_robots_index BOOLEAN DEFAULT TRUE;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_robots_follow BOOLEAN DEFAULT TRUE;

-- Open Graph
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Twitter Card
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS twitter_title TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS twitter_description TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS twitter_image TEXT;

-- Schema.org
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS schema_type TEXT DEFAULT 'Place';
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS schema_json JSON;

-- AI / Discovery
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_primary_keyword TEXT;
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS seo_secondary_keywords TEXT;

-- Audit
ALTER TABLE public.locations ADD COLUMN IF NOT EXISTS last_seo_updated_at TIMESTAMPTZ;

-- Index for duplicate canonical URL detection
CREATE INDEX IF NOT EXISTS idx_locations_seo_canonical_url
  ON public.locations (seo_canonical_url)
  WHERE seo_canonical_url IS NOT NULL;
