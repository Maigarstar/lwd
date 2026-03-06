-- ═══════════════════════════════════════════════════════════════════════════════
-- Homepage Content Management Table
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS homepage_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Status & Timestamps
  status TEXT CHECK (status IN ('draft', 'published')) DEFAULT 'draft',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  published_at TIMESTAMP WITH TIME ZONE,
  published_by UUID REFERENCES auth.users(id),

  -- ── Hero Section
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_cta_text TEXT,
  hero_cta_link TEXT,
  hero_image_url TEXT,

  -- ── Destination Strip
  destination_heading TEXT,
  destination_subtitle TEXT,
  destination_ids TEXT[], -- array of destination slugs

  -- ── Featured Venues Section
  venues_heading TEXT,
  venues_subtitle TEXT,
  venues_ids INTEGER[], -- array of venue IDs

  -- ── Signature Section (Featured Collection)
  signature_heading TEXT,
  signature_subtitle TEXT,
  signature_venue_ids INTEGER[], -- array of venue IDs

  -- ── Vendor Section
  vendor_heading TEXT,
  vendor_subtitle TEXT,
  vendor_ids INTEGER[], -- array of vendor IDs

  -- ── Newsletter Block
  newsletter_heading TEXT,
  newsletter_subtitle TEXT,
  newsletter_button_text TEXT
);

-- ───── Indexes
CREATE INDEX IF NOT EXISTS idx_homepage_status ON homepage_content(status);
CREATE INDEX IF NOT EXISTS idx_homepage_published ON homepage_content(published_at DESC);

-- ───── RLS: Admin Only Access
ALTER TABLE homepage_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY admin_only_view ON homepage_content
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY admin_only_insert ON homepage_content
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY admin_only_update ON homepage_content
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ───── Trigger: Auto update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_homepage_content_updated_at
  BEFORE UPDATE ON homepage_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
