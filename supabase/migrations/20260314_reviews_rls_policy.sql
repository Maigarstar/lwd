-- Reviews table RLS policies
-- Allow public review submissions + approved review reads
-- Admin moderation via Supabase dashboard/admin API

BEGIN;

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow anonymous users to INSERT new reviews (pending moderation)
CREATE POLICY "Allow public review submission"
  ON reviews
  FOR INSERT
  WITH CHECK (true);

-- Policy 2: Allow anyone to SELECT only approved reviews
CREATE POLICY "Allow public read approved reviews"
  ON reviews
  FOR SELECT
  USING (moderation_status = 'approved');

-- Policy 3: Allow authenticated admins to UPDATE/DELETE (will need auth context)
-- For now, disable this to avoid blocking legitimate updates
-- Admin updates will be handled via backend/Supabase admin API

COMMIT;
