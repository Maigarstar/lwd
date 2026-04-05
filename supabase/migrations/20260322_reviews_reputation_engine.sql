-- ============================================================================
-- Reviews Reputation Engine — Phase 1 Schema Extension
-- Extends reviews table, creates review_messages, extends listings
-- ============================================================================

BEGIN;

-- ─── 1. EXTEND reviews TABLE ─────────────────────────────────────────────────

-- Reviewer context
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reviewer_role TEXT
  CHECK (reviewer_role IN ('couple', 'guest', 'planner', 'vendor', 'corporate', 'other'));

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS guest_count INTEGER;

-- Verification layer
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_verified_booking BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS verification_source TEXT
  CHECK (verification_source IN ('enquiry', 'booking', 'manual'));

-- Public & editorial
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_public BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS is_featured BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS featured_quote TEXT; -- extracted quote for editorial use

-- Reply tracking
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS reply_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS first_reply_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS last_message_at TIMESTAMPTZ;

-- Extend moderation_status to support conversation states
-- Drop old constraint first, re-add with new values
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_moderation_status_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_moderation_status_check
  CHECK (moderation_status IN ('pending', 'approved', 'rejected', 'awaiting_reply', 'replied'));

-- ─── 2. CREATE review_messages TABLE ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS review_messages (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id       UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,

  -- Sender context
  sender_type     TEXT NOT NULL
                  CHECK (sender_type IN ('reviewer', 'owner', 'admin')),
  sender_user_id  UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_name     TEXT, -- display name for admin use (not exposed publicly)

  -- Content
  message_body    TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE, -- admin-only notes (not visible to reviewer/owner)

  -- Timestamps
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for review_messages
CREATE INDEX IF NOT EXISTS review_messages_review_id_idx ON review_messages(review_id);
CREATE INDEX IF NOT EXISTS review_messages_sender_type_idx ON review_messages(sender_type);
CREATE INDEX IF NOT EXISTS review_messages_created_at_idx ON review_messages(created_at DESC);

-- ─── 3. EXTEND listings TABLE ────────────────────────────────────────────────

-- Reputation fields (reputation_score replaces raw rating for ranking)
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reputation_score NUMERIC(3,1);
ALTER TABLE listings ADD COLUMN IF NOT EXISTS reply_rate NUMERIC(5,2) DEFAULT 0;  -- % 0.00–100.00
ALTER TABLE listings ADD COLUMN IF NOT EXISTS avg_reply_hours NUMERIC(8,2);

-- ─── 4. TRIGGER: update reply_count + first_reply_at on review_messages ──────
-- Edge cases handled:
--   • Only OWNER non-internal messages increment reply_count
--   • Admin notes and reviewer messages update last_message_at only
--   • reply_count is append-only here — it is not decremented on message delete
--     (delete is an admin action; reply_count is used as a signal not a precise count)
--   • Status flips awaiting_reply → replied on first owner reply only
--   • If review is rejected, reply_count still updates (admin may re-approve later)

CREATE OR REPLACE FUNCTION update_review_reply_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Only count owner replies (not admin notes or reviewer messages)
  IF NEW.sender_type = 'owner' AND NEW.is_internal_note = FALSE THEN
    UPDATE reviews SET
      reply_count      = reply_count + 1,
      first_reply_at   = CASE WHEN first_reply_at IS NULL THEN NOW() ELSE first_reply_at END,
      last_message_at  = NOW(),
      -- Auto-advance status from awaiting_reply → replied on first owner message
      moderation_status = CASE
        WHEN moderation_status = 'awaiting_reply' THEN 'replied'
        ELSE moderation_status
      END
    WHERE id = NEW.review_id;
  ELSE
    -- Admin notes and reviewer messages: update last_message_at only
    UPDATE reviews SET
      last_message_at = NOW()
    WHERE id = NEW.review_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS review_messages_reply_stats ON review_messages;
CREATE TRIGGER review_messages_reply_stats
  AFTER INSERT ON review_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_review_reply_stats();

-- ─── 5. TRIGGER: update listing reputation_score on review changes ─────────
-- Fires on: INSERT, UPDATE (any column), DELETE on reviews
-- Trigger covers all aggregate update scenarios:
--   • Approve: moderation_status → 'approved' — review enters calculation
--   • Reject: moderation_status → 'rejected' — review leaves calculation
--   • Unpublish (is_public → false): v1 decision — reputation score is NOT
--     filtered by is_public. A temporarily hidden review still counts toward
--     reputation. Rationale: reputation reflects moderated quality, not
--     current visibility. is_public only controls front-end display.
--   • Soft delete (deleted_at → NOW()): deleted_at IS NULL filter excludes it
--     from all calculations on the next trigger fire.
--   • Hard delete (DELETE): uses OLD.entity_id, recalculates without the row.
--   • Reply stats update (reply_count incremented): the UPDATE on reviews fires
--     this trigger again, recalculating reply_rate with the new count.
-- v1 formula — see adminReviewService.js for full formula documentation.

CREATE OR REPLACE FUNCTION sync_listing_reputation()
RETURNS TRIGGER AS $$
DECLARE
  v_entity_id       UUID;
  v_avg_rating      NUMERIC;
  v_review_count    INTEGER;
  v_recent_count    INTEGER;
  v_verified_count  INTEGER;
  v_replied_count   INTEGER;
  v_reputation      NUMERIC;
  v_reply_rate      NUMERIC;
  v_avg_reply_hrs   NUMERIC;
BEGIN
  -- For DELETE, NEW is NULL — use OLD. For INSERT/UPDATE, use NEW.
  v_entity_id := COALESCE(NEW.entity_id, OLD.entity_id);

  -- Pull stats from approved, non-deleted reviews (regardless of is_public — v1 decision)
  SELECT
    ROUND(AVG(overall_rating)::numeric, 2),
    COUNT(*),
    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '6 months'),
    COUNT(*) FILTER (WHERE is_verified_booking = TRUE),
    COUNT(*) FILTER (WHERE reply_count > 0),
    AVG(
      CASE WHEN first_reply_at IS NOT NULL
        THEN EXTRACT(EPOCH FROM (first_reply_at - created_at)) / 3600
        ELSE NULL
      END
    )
  INTO
    v_avg_rating,
    v_review_count,
    v_recent_count,
    v_verified_count,
    v_replied_count,
    v_avg_reply_hrs
  FROM reviews
  WHERE entity_id = v_entity_id
    AND moderation_status IN ('approved', 'awaiting_reply', 'replied')
    AND deleted_at IS NULL;

  -- Reply rate = % of qualifying reviews with at least one owner reply
  v_reply_rate := CASE
    WHEN v_review_count > 0 THEN ROUND((v_replied_count::numeric / v_review_count) * 100, 2)
    ELSE 0
  END;

  -- Reputation score v1 (0–5 scale):
  -- 50% avg_rating | 20% recency ratio | 20% verified ratio | 10% reply rate factor
  IF v_review_count > 0 THEN
    v_reputation := ROUND((
      (COALESCE(v_avg_rating, 0) * 0.50)
      + ((LEAST(COALESCE(v_recent_count, 0)::numeric / GREATEST(v_review_count, 1), 1) * 5) * 0.20)
      + ((LEAST(COALESCE(v_verified_count, 0)::numeric / GREATEST(v_review_count, 1), 1) * 5) * 0.20)
      + ((LEAST(v_reply_rate / 100, 1) * 5) * 0.10)
    )::numeric, 1);
  ELSE
    v_reputation := NULL;
  END IF;

  -- Update listings
  UPDATE listings SET
    rating           = CASE WHEN v_review_count = 0 THEN NULL ELSE ROUND(v_avg_rating, 1) END,
    review_count     = v_review_count,
    reputation_score = v_reputation,
    reply_rate       = v_reply_rate,
    avg_reply_hours  = ROUND(COALESCE(v_avg_reply_hrs, NULL)::numeric, 1)
  WHERE id = v_entity_id;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Replace old sync trigger (was only updating rating + review_count)
DROP TRIGGER IF EXISTS sync_rating_on_review_change ON reviews;
CREATE TRIGGER sync_reputation_on_review_change
  AFTER INSERT OR UPDATE OR DELETE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION sync_listing_reputation();

-- ─── 6. INDEXES ───────────────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS reviews_reviewer_role_idx ON reviews(reviewer_role);
CREATE INDEX IF NOT EXISTS reviews_is_verified_booking_idx ON reviews(is_verified_booking) WHERE is_verified_booking = TRUE;
CREATE INDEX IF NOT EXISTS reviews_is_public_idx ON reviews(is_public) WHERE is_public = TRUE;
CREATE INDEX IF NOT EXISTS reviews_is_featured_idx ON reviews(is_featured) WHERE is_featured = TRUE;
CREATE INDEX IF NOT EXISTS reviews_last_message_at_idx ON reviews(last_message_at DESC NULLS LAST);

COMMIT;
