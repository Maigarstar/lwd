-- Add soft delete columns to reviews table
-- This allows us to keep records for audit purposes while hiding deleted reviews from public view

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create index for soft delete queries (filtering WHERE deleted_at IS NULL)
CREATE INDEX IF NOT EXISTS reviews_deleted_at_idx ON reviews(deleted_at);

-- Update view or queries to exclude soft-deleted reviews by default
-- The service layer (adminReviewService.js) now filters with: .is('deleted_at', null)
