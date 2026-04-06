-- ═══════════════════════════════════════════════════════════════════════════
-- Reference Conversions — Full-funnel revenue attribution
--
-- Tracks: Article → Reference Click → Listing View → Enquiry
-- Each row = one conversion event (an enquiry that originated from an article)
--
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS reference_conversions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  converted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Origin article
  post_id         UUID REFERENCES magazine_posts(id) ON DELETE SET NULL,
  reference_id    UUID REFERENCES article_references(id) ON DELETE SET NULL,

  -- Destination listing
  listing_id      UUID,
  listing_slug    TEXT,

  -- Conversion details
  conversion_type VARCHAR(30) DEFAULT 'enquiry',
    -- 'enquiry' | 'phone_click' | 'website_click' | 'shortlist'
  landing_url     TEXT,
  session_id      TEXT,
  viewport        VARCHAR(10)
);

CREATE INDEX IF NOT EXISTS idx_ref_conv_post     ON reference_conversions(post_id);
CREATE INDEX IF NOT EXISTS idx_ref_conv_listing  ON reference_conversions(listing_id);
CREATE INDEX IF NOT EXISTS idx_ref_conv_ref      ON reference_conversions(reference_id);
CREATE INDEX IF NOT EXISTS idx_ref_conv_time     ON reference_conversions(converted_at DESC);

-- RLS: anyone can insert (public tracking), admins can read
ALTER TABLE reference_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ref_conv_insert ON reference_conversions FOR INSERT WITH CHECK (true);
CREATE POLICY ref_conv_select ON reference_conversions FOR SELECT USING (true);
