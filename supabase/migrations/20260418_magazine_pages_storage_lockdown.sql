-- ════════════════════════════════════════════════════════════════════════════
-- LWD Magazine Pages — Storage Lockdown
-- 20260418_magazine_pages_storage_lockdown.sql
--
-- During debugging we added an anon INSERT policy on magazine-pages so the
-- browser console test script could upload directly. This must be removed.
--
-- Correct access model:
--   • SELECT (read) — public, anyone (images render in reader + admin)
--   • INSERT/UPDATE/DELETE — ONLY via upload-magazine-page edge function
--     (uses service_role → bypasses RLS, so no explicit INSERT policy needed)
--   • Anon direct write — BLOCKED
-- ════════════════════════════════════════════════════════════════════════════

-- Drop any anon/open INSERT policies that were added during debugging
DROP POLICY IF EXISTS "magazine_pages_anon_insert"  ON storage.objects;
DROP POLICY IF EXISTS "magazine_pages_insert"        ON storage.objects;
DROP POLICY IF EXISTS "pages_anon_insert"            ON storage.objects;
DROP POLICY IF EXISTS "allow_all_insert_magazine_pages" ON storage.objects;

-- Drop any anon UPDATE/DELETE policies
DROP POLICY IF EXISTS "magazine_pages_anon_update"  ON storage.objects;
DROP POLICY IF EXISTS "magazine_pages_anon_delete"  ON storage.objects;
DROP POLICY IF EXISTS "magazine_pages_update"        ON storage.objects;
DROP POLICY IF EXISTS "magazine_pages_delete"        ON storage.objects;

-- Ensure public SELECT exists (images must render without auth)
DROP POLICY IF EXISTS "magazine_pages_public_read"  ON storage.objects;
CREATE POLICY "magazine_pages_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'magazine-pages');

-- No INSERT policy needed — upload-magazine-page edge function uses
-- service_role which bypasses RLS entirely. Any direct anon/authenticated
-- INSERT will be denied (no policy = denied when RLS is enabled).
