-- Reviews table: shared moderated review system for venues, planners, vendors
-- Phase 1: moderation first, admin approval required, published_at on first approval only

BEGIN;

-- ─── Reviews table ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type       TEXT NOT NULL CHECK (entity_type IN ('venue', 'planner', 'vendor')),
  entity_id         UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,

  -- Reviewer identity
  reviewer_name     TEXT NOT NULL,
  reviewer_email    TEXT NOT NULL,
  reviewer_location TEXT,

  -- Event context
  event_type        TEXT,
  event_date        DATE,

  -- Ratings: overall 1-5, sub-ratings stored as JSONB per entity type
  overall_rating    NUMERIC(2,1) NOT NULL CHECK (overall_rating >= 1 AND overall_rating <= 5),
  sub_ratings       JSONB NOT NULL DEFAULT '{}',

  -- Content
  review_title      TEXT NOT NULL,
  review_text       TEXT NOT NULL,

  -- Trust & moderation layer
  is_verified       BOOLEAN NOT NULL DEFAULT FALSE,
  moderation_status TEXT NOT NULL DEFAULT 'pending'
                    CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  admin_notes       TEXT,

  -- Timestamps
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  published_at      TIMESTAMPTZ  -- set on first approval only
);

-- ─── Indexes ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS reviews_entity_idx
  ON reviews (entity_type, entity_id);

CREATE INDEX IF NOT EXISTS reviews_status_idx
  ON reviews (moderation_status);

CREATE INDEX IF NOT EXISTS reviews_published_at_idx
  ON reviews (published_at DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS reviews_created_at_idx
  ON reviews (created_at DESC);

CREATE INDEX IF NOT EXISTS reviews_email_entity_idx
  ON reviews (reviewer_email, entity_type, entity_id);

-- ─── Trigger: update updated_at on row change ─────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ─── Trigger: set published_at on first approval only ─────────────────────────
CREATE OR REPLACE FUNCTION set_review_published_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only set published_at if transitioning TO approved for the first time
  IF NEW.moderation_status = 'approved'
     AND OLD.moderation_status != 'approved'
     AND NEW.published_at IS NULL THEN
    NEW.published_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER reviews_published_at_trigger
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION set_review_published_at();

-- ─── Trigger: sync listing rating & review count ──────────────────────────────
-- Recalculates average rating and count from approved reviews whenever any review changes
CREATE OR REPLACE FUNCTION sync_listing_rating()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_id UUID;
  v_avg_rating NUMERIC;
  v_count INTEGER;
BEGIN
  v_entity_id := COALESCE(NEW.entity_id, OLD.entity_id);

  -- Calculate new average and count from approved reviews only
  SELECT
    ROUND(AVG(overall_rating)::numeric, 1),
    COUNT(*)
  INTO v_avg_rating, v_count
  FROM reviews
  WHERE entity_id = v_entity_id
    AND moderation_status = 'approved';

  -- Update listings: set rating to null if no approved reviews, else set average
  UPDATE listings SET
    rating = CASE WHEN v_count = 0 THEN NULL ELSE v_avg_rating END,
    review_count = v_count
  WHERE id = v_entity_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_rating_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_listing_rating();

COMMIT;
