-- ── Magazine Monetization — Tier 4 ───────────────────────────────────────────
-- Adds paywall settings to magazine_issues and creates the
-- magazine_ad_placements table for per-issue advertising management.

-- ── 1. Extend magazine_issues ─────────────────────────────────────────────────

ALTER TABLE magazine_issues
  ADD COLUMN IF NOT EXISTS paywall_enabled        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS free_page_count        int         NOT NULL DEFAULT 3,
  ADD COLUMN IF NOT EXISTS advertiser_revenue_target numeric(10,2) DEFAULT NULL;

-- ── 2. Ad placements table ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS magazine_ad_placements (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id          uuid        NOT NULL REFERENCES magazine_issues(id) ON DELETE CASCADE,
  page_number       int         NOT NULL,
  ad_type           text        NOT NULL DEFAULT 'full-page'
                                  CHECK (ad_type IN ('full-page','half-page','advertorial')),
  advertiser_name   text        NOT NULL DEFAULT '',
  advertiser_logo   text,                        -- public URL
  campaign_name     text,
  campaign_url      text,                        -- click-through URL
  is_active         boolean     NOT NULL DEFAULT true,
  rate_card_gbp     numeric(10,2),               -- agreed fee in GBP
  impressions       int         NOT NULL DEFAULT 0,
  clicks            int         NOT NULL DEFAULT 0,
  notes             text,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE magazine_ad_placements DISABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS magazine_ad_placements_unique_idx
  ON magazine_ad_placements(issue_id, page_number);

CREATE INDEX IF NOT EXISTS magazine_ad_placements_issue_idx
  ON magazine_ad_placements(issue_id);

CREATE INDEX IF NOT EXISTS magazine_ad_placements_active_idx
  ON magazine_ad_placements(is_active) WHERE is_active = true;

-- Reuse the existing update_updated_at_column() trigger function
CREATE TRIGGER magazine_ad_placements_updated_at
  BEFORE UPDATE ON magazine_ad_placements
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ── 3. Analytics helper function ──────────────────────────────────────────────

-- Safely increments impressions or clicks from the reader side.
-- Called via supabase.rpc('increment_ad_stat', { p_placement_id, p_field }).
CREATE OR REPLACE FUNCTION increment_ad_stat(p_placement_id uuid, p_field text)
RETURNS void LANGUAGE plpgsql AS $$
BEGIN
  IF p_field = 'impressions' THEN
    UPDATE magazine_ad_placements
       SET impressions = impressions + 1
     WHERE id = p_placement_id;
  ELSIF p_field = 'clicks' THEN
    UPDATE magazine_ad_placements
       SET clicks = clicks + 1
     WHERE id = p_placement_id;
  END IF;
END;
$$;
