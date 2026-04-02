-- Extend reviews table with columns referenced in service code but missing from base migration
-- Run after 20260314_create_reviews.sql

BEGIN;

-- ─── Extended columns ─────────────────────────────────────────────────────────

ALTER TABLE reviews
  -- review_date: when the reviewer experienced the service (vs created_at = when they wrote the review)
  ADD COLUMN IF NOT EXISTS review_date         DATE,
  -- reviewer_role: who is writing (couple, guest, planner, vendor, corporate, other)
  ADD COLUMN IF NOT EXISTS reviewer_role       TEXT
    CHECK (reviewer_role IN ('couple','guest','planner','vendor','corporate','other')),
  -- is_verified_booking: auto-set when email matches a confirmed enquiry for this entity
  ADD COLUMN IF NOT EXISTS is_verified_booking BOOLEAN NOT NULL DEFAULT FALSE,
  -- verification_source: how verification was established
  ADD COLUMN IF NOT EXISTS verification_source TEXT
    CHECK (verification_source IN ('booking','enquiry','manual','manual_verified')),
  -- added_by_admin: distinguishes admin-created from organic/vendor-invited reviews
  ADD COLUMN IF NOT EXISTS added_by_admin      BOOLEAN NOT NULL DEFAULT FALSE,
  -- is_featured: editorial flag — shown prominently on listing page
  ADD COLUMN IF NOT EXISTS is_featured         BOOLEAN NOT NULL DEFAULT FALSE,
  -- featured_quote: pull-quote from the review for display in feature cards
  ADD COLUMN IF NOT EXISTS featured_quote      TEXT,
  -- is_public: visibility toggle independent of moderation_status (admin can hide without rejecting)
  ADD COLUMN IF NOT EXISTS is_public           BOOLEAN NOT NULL DEFAULT TRUE,
  -- reply_count: denormalised count of owner replies (kept in sync by trigger on review_messages)
  ADD COLUMN IF NOT EXISTS reply_count         INTEGER NOT NULL DEFAULT 0;

-- ─── Extend moderation_status to include workflow states ──────────────────────
-- Drop and recreate the constraint to add awaiting_reply and replied
ALTER TABLE reviews
  DROP CONSTRAINT IF EXISTS reviews_moderation_status_check;

ALTER TABLE reviews
  ADD CONSTRAINT reviews_moderation_status_check
    CHECK (moderation_status IN ('pending','approved','rejected','awaiting_reply','replied'));

-- ─── Index: review_date for sorting (newest experience first) ─────────────────
CREATE INDEX IF NOT EXISTS reviews_review_date_idx
  ON reviews (review_date DESC NULLS LAST);

-- ─── Index: verified bookings ─────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS reviews_verified_booking_idx
  ON reviews (is_verified_booking) WHERE is_verified_booking = TRUE;

-- ─── review_messages table ────────────────────────────────────────────────────
-- Owner replies and admin notes on reviews — referenced by adminReviewService.js
CREATE TABLE IF NOT EXISTS review_messages (
  id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id        UUID NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
  sender_type      TEXT NOT NULL CHECK (sender_type IN ('owner','reviewer','admin')),
  sender_user_id   UUID,
  sender_name      TEXT,
  message_body     TEXT NOT NULL,
  is_internal_note BOOLEAN NOT NULL DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS review_messages_review_idx
  ON review_messages (review_id, created_at ASC);

-- ─── RLS: review_messages ─────────────────────────────────────────────────────
ALTER TABLE review_messages ENABLE ROW LEVEL SECURITY;

-- Public can read non-internal messages on approved reviews
DROP POLICY IF EXISTS "Public read owner replies on approved reviews" ON review_messages;
CREATE POLICY "Public read owner replies on approved reviews"
  ON review_messages FOR SELECT
  USING (
    is_internal_note = FALSE
    AND EXISTS (
      SELECT 1 FROM reviews r
      WHERE r.id = review_messages.review_id
        AND r.moderation_status IN ('approved','awaiting_reply','replied')
        AND r.is_public = TRUE
    )
  );

-- Service-role (admin, vendor) can insert messages
DROP POLICY IF EXISTS "Service role insert review messages" ON review_messages;
CREATE POLICY "Service role insert review messages"
  ON review_messages FOR INSERT
  WITH CHECK (TRUE);

COMMIT;
