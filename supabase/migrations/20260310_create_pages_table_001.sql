-- ═══════════════════════════════════════════════════════════════════════════
-- Create pages table for Page Studio
-- Stores complete page state including sections, custom fields, and SEO
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.pages (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  page_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content JSONB DEFAULT '[]'::jsonb, -- Full sections array with custom fields
  seo JSONB DEFAULT '{}'::jsonb, -- SEO metadata: {title, metaDescription, keywords}
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_pages_slug ON public.pages(slug);
CREATE INDEX IF NOT EXISTS idx_pages_status ON public.pages(status);
CREATE INDEX IF NOT EXISTS idx_pages_page_type ON public.pages(page_type);
CREATE INDEX IF NOT EXISTS idx_pages_updated_at ON public.pages(updated_at);

-- Enable RLS (Row Level Security)
ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated admin users to view all pages
CREATE POLICY "Allow authenticated users to view pages" ON public.pages
  FOR SELECT USING (auth.role() = 'authenticated');

-- Policy: Allow authenticated admin users to insert pages
CREATE POLICY "Allow authenticated users to create pages" ON public.pages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated admin users to update pages
CREATE POLICY "Allow authenticated users to update pages" ON public.pages
  FOR UPDATE USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy: Allow authenticated admin users to delete pages
CREATE POLICY "Allow authenticated users to delete pages" ON public.pages
  FOR DELETE USING (auth.role() = 'authenticated');

-- Insert default homepage if it doesn't exist
INSERT INTO public.pages (id, title, slug, page_type, status, content, seo)
VALUES (
  'page_home',
  'Homepage',
  '/',
  'homepage',
  'draft',
  '[
    {
      "id": "hero",
      "type": "slim_hero",
      "enabled": true,
      "order": 0,
      "heading": "",
      "subheading": "",
      "ctaText": "",
      "ctaUrl": "",
      "bgImage": "",
      "customFields": []
    },
    {
      "id": "destinations",
      "type": "destination_grid",
      "enabled": true,
      "order": 1,
      "heading": "",
      "customFields": []
    },
    {
      "id": "venues",
      "type": "venue_grid",
      "enabled": true,
      "order": 2,
      "heading": "",
      "venueIds": [],
      "customFields": []
    },
    {
      "id": "featured",
      "type": "featured_slider",
      "enabled": true,
      "order": 3,
      "heading": "",
      "venueIds": [],
      "customFields": []
    },
    {
      "id": "categories",
      "type": "category_slider",
      "enabled": true,
      "order": 4,
      "heading": "",
      "customFields": []
    },
    {
      "id": "vendors",
      "type": "vendor_preview",
      "enabled": true,
      "order": 5,
      "heading": "",
      "vendorIds": [],
      "customFields": []
    },
    {
      "id": "newsletter",
      "type": "newsletter_band",
      "enabled": true,
      "order": 6,
      "heading": "",
      "ctaText": "",
      "ctaUrl": "",
      "customFields": []
    },
    {
      "id": "directory",
      "type": "directory_brands",
      "enabled": true,
      "order": 7,
      "heading": "",
      "customFields": []
    }
  ]'::jsonb,
  '{
    "title": "",
    "metaDescription": "",
    "keywords": []
  }'::jsonb
) ON CONFLICT (id) DO NOTHING;
