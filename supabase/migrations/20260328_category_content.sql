-- ═══════════════════════════════════════════════════════════════════════════
-- Category Content table
-- Stores editorial content, hero, SEO, and AI data for category pages
-- Mirrors the locations table pattern
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.category_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Key & type
  category_key TEXT NOT NULL UNIQUE,       -- "parent:photographers" or "sub:photographers:documentary"
  category_type TEXT NOT NULL,             -- "parent" | "sub"
  parent_slug TEXT NOT NULL,               -- e.g. "photographers"
  sub_slug TEXT,                           -- e.g. "documentary" (null for parent)

  -- Hero section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image TEXT,
  hero_video TEXT,
  cta_text TEXT DEFAULT 'Browse Vendors',
  cta_link TEXT,

  -- Featured curation
  featured_vendors_title TEXT DEFAULT 'Featured Vendors',
  featured_vendors JSON DEFAULT '[]'::json,
  featured_venues_title TEXT DEFAULT 'Signature Venues',
  featured_venues JSON DEFAULT '[]'::json,

  -- Schema.org
  schema_type TEXT DEFAULT 'Service',      -- e.g. ProfessionalService, Florist, EventVenue
  schema_json JSON,

  -- Publishing
  published BOOLEAN DEFAULT FALSE,
  published_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

  -- Metadata (editorial blocks, section toggles, FAQs, motto, vibes, etc.)
  metadata JSON DEFAULT '{}'::json,

  -- SEO — Core
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  seo_canonical_url TEXT,
  seo_robots_index BOOLEAN DEFAULT TRUE,
  seo_robots_follow BOOLEAN DEFAULT TRUE,

  -- SEO — Open Graph
  og_title TEXT,
  og_description TEXT,
  og_image TEXT,

  -- SEO — Twitter Card
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image TEXT,

  -- SEO — AI / Discovery
  seo_primary_keyword TEXT,
  seo_secondary_keywords TEXT,
  last_seo_updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_category_content_key ON public.category_content(category_key);
CREATE INDEX IF NOT EXISTS idx_category_content_type ON public.category_content(category_type);
CREATE INDEX IF NOT EXISTS idx_category_content_parent ON public.category_content(parent_slug);
CREATE INDEX IF NOT EXISTS idx_category_content_published ON public.category_content(published);

-- Enable RLS
ALTER TABLE public.category_content ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Published categories readable by everyone" ON public.category_content
  FOR SELECT USING (published = TRUE);

CREATE POLICY "Authenticated users can read all categories" ON public.category_content
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Admin can manage categories" ON public.category_content
  FOR ALL USING (true);

-- Updated_at trigger (reuses the function from locations migration)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'category_content_updated_at'
  ) THEN
    CREATE TRIGGER category_content_updated_at
      BEFORE UPDATE ON public.category_content
      FOR EACH ROW
      EXECUTE FUNCTION public.set_updated_at();
  END IF;
END $$;
