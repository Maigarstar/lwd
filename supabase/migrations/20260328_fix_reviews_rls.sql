-- Fix reviews RLS: anon can currently read ALL reviews (pending included)
-- This repair ensures only approved + public reviews are visible to anon

BEGIN;

-- Ensure RLS is enabled
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Drop the old permissive SELECT policy (if it exists but isn't working)
DROP POLICY IF EXISTS "Allow public read approved reviews" ON reviews;

-- Recreate with stricter check: must be approved + public + not deleted
CREATE POLICY "Allow public read approved reviews"
  ON reviews
  FOR SELECT
  USING (
    moderation_status = 'approved'
    AND is_public = TRUE
    AND deleted_at IS NULL
  );

-- Ensure INSERT policy exists (public can submit reviews)
DROP POLICY IF EXISTS "Allow public review submission" ON reviews;
CREATE POLICY "Allow public review submission"
  ON reviews
  FOR INSERT
  WITH CHECK (true);

COMMIT;
