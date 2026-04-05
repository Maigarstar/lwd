-- ============================================================================
-- Reviews: Admin Add Review support
-- Adds review_date, added_by_admin, extends verification_source
-- ============================================================================

BEGIN;

-- review_date: when the client actually gave the review (distinct from created_at)
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS review_date DATE;

-- added_by_admin: audit flag for manually uploaded reviews
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS added_by_admin BOOLEAN NOT NULL DEFAULT FALSE;

-- Extend verification_source to include offline/manual channels
ALTER TABLE reviews DROP CONSTRAINT IF EXISTS reviews_verification_source_check;
ALTER TABLE reviews ADD CONSTRAINT reviews_verification_source_check
  CHECK (verification_source IN (
    'enquiry',
    'booking',
    'manual',
    'manual_verified',
    'email_verified',
    'whatsapp_verified',
    'imported_testimonial'
  ));

-- Index for review_date (used for chronological sorting on listing pages)
CREATE INDEX IF NOT EXISTS reviews_review_date_idx ON reviews(review_date DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS reviews_added_by_admin_idx ON reviews(added_by_admin) WHERE added_by_admin = TRUE;

COMMIT;
