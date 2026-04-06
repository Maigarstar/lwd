-- ═══════════════════════════════════════════════════════════════════════════
-- Reference System — Phase 4: Content → Commerce Bridge
--
-- 1. reference_clicks   — tracks clicks on references inside articles
-- 2. article_references — stores structured references (metadata, not just URLs)
-- 3. reference_tiers    — contextual reference levels (mentioned → sponsored)
--
-- Run in Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Article References (structured metadata per reference) ────────────────
CREATE TABLE IF NOT EXISTS article_references (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Which article contains this reference
  post_id       UUID NOT NULL REFERENCES magazine_posts(id) ON DELETE CASCADE,

  -- What is being referenced
  entity_type   VARCHAR(20) NOT NULL,
    -- 'listing' | 'showcase' | 'article' | 'location'
  entity_id     UUID,                       -- FK to entity (optional — some may be URL-only)
  entity_slug   TEXT,                        -- for URL construction
  entity_label  TEXT NOT NULL,               -- display name at time of reference
  entity_url    TEXT,                        -- resolved internal URL

  -- Context
  block_id      UUID,                        -- which content block contains the reference
  anchor_text   TEXT,                        -- the highlighted text that was linked
  position      INTEGER DEFAULT 0,           -- ordinal position in article

  -- Commercial tier
  reference_tier VARCHAR(20) DEFAULT 'linked',
    -- 'mentioned' | 'linked' | 'featured' | 'sponsored'

  -- Entity snapshot at time of reference (denormalised for speed)
  entity_image  TEXT,                        -- thumbnail
  entity_subtitle TEXT,                      -- location, category, etc.
  entity_tier   VARCHAR(20),                 -- listing tier at time of reference

  -- Tracking aggregates (updated by cron or on-demand)
  click_count   INTEGER DEFAULT 0,
  last_clicked  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_article_refs_post     ON article_references(post_id);
CREATE INDEX IF NOT EXISTS idx_article_refs_entity   ON article_references(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_article_refs_tier     ON article_references(reference_tier);

-- ── 2. Reference Clicks (event log) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reference_clicks (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clicked_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What was clicked
  reference_id  UUID REFERENCES article_references(id) ON DELETE CASCADE,
  post_id       UUID REFERENCES magazine_posts(id) ON DELETE SET NULL,
  entity_type   VARCHAR(20) NOT NULL,
  entity_id     UUID,
  entity_slug   TEXT,

  -- Attribution
  source_url    TEXT,                        -- the article URL where click happened
  session_id    TEXT,                        -- anonymous session tracking

  -- Context
  position_in_article INTEGER,              -- where in the article the click was
  viewport      VARCHAR(10)                 -- 'desktop' | 'tablet' | 'mobile'
);

CREATE INDEX IF NOT EXISTS idx_ref_clicks_ref        ON reference_clicks(reference_id);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_entity     ON reference_clicks(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_post       ON reference_clicks(post_id);
CREATE INDEX IF NOT EXISTS idx_ref_clicks_time       ON reference_clicks(clicked_at DESC);

-- ── 3. Bi-directional: add "featured_in" view for listings ──────────────────
-- This view lets any listing see which articles reference it
CREATE OR REPLACE VIEW listing_editorial_features AS
SELECT
  ar.entity_id AS listing_id,
  ar.entity_type,
  ar.post_id,
  mp.title AS article_title,
  mp.slug AS article_slug,
  mp.cover_image AS article_image,
  mp.category_label,
  mp.published_at,
  ar.reference_tier,
  ar.anchor_text,
  ar.click_count
FROM article_references ar
JOIN magazine_posts mp ON mp.id = ar.post_id AND mp.published = true
WHERE ar.entity_type IN ('listing', 'showcase')
ORDER BY mp.published_at DESC;

-- ── RLS ──────────────────────────────────────────────────────────────────────
ALTER TABLE article_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE reference_clicks ENABLE ROW LEVEL SECURITY;

-- article_references: anyone can read (public articles), insert/update for editors
CREATE POLICY article_refs_select ON article_references FOR SELECT USING (true);
CREATE POLICY article_refs_insert ON article_references FOR INSERT WITH CHECK (true);
CREATE POLICY article_refs_update ON article_references FOR UPDATE USING (true);
CREATE POLICY article_refs_delete ON article_references FOR DELETE USING (true);

-- reference_clicks: anyone can insert (public tracking), admins can read
CREATE POLICY ref_clicks_insert ON reference_clicks FOR INSERT WITH CHECK (true);
CREATE POLICY ref_clicks_select ON reference_clicks FOR SELECT USING (true);

-- ── Helper: increment click count on article_references ─────────────────────
CREATE OR REPLACE FUNCTION increment_reference_click()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE article_references
  SET click_count = click_count + 1,
      last_clicked = NOW()
  WHERE id = NEW.reference_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_ref_click
  AFTER INSERT ON reference_clicks
  FOR EACH ROW
  WHEN (NEW.reference_id IS NOT NULL)
  EXECUTE FUNCTION increment_reference_click();
