-- Add UPDATE and DELETE policies to reviews table
-- Required for admin moderation (approve, reject, soft delete, etc.)
-- NOTE: Current admin auth is client-side only (no Supabase auth),
-- so we allow anon UPDATE/DELETE. In production, restrict to authenticated/service role.

BEGIN;

-- Allow updates (moderation actions: approve, reject, verify, feature, soft delete)
DROP POLICY IF EXISTS "Allow review updates" ON reviews;
CREATE POLICY "Allow review updates"
  ON reviews
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow deletes (hard delete — admin only in practice)
DROP POLICY IF EXISTS "Allow review deletes" ON reviews;
CREATE POLICY "Allow review deletes"
  ON reviews
  FOR DELETE
  USING (true);

COMMIT;
