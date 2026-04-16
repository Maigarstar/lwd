-- Migration: 20260416_magazine_storage_anon_write
--
-- The original magazine bucket (20260405_magazine_storage_bucket.sql) requires
-- auth.role() = 'authenticated' for INSERT/UPDATE/DELETE. The admin dashboard
-- uses the anon key → all uploads return 403 and hang in the UI.
--
-- Same root cause as the magazine table 403s fixed by 20260416_magazine_rls_disable.sql.
-- Fix: replace the three restricted policies with anon-permissive equivalents.
-- Public read is unchanged.

-- ── INSERT (upload) ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_auth_insert" ON storage.objects;
CREATE POLICY "magazine_anon_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'magazine');

-- ── UPDATE (metadata) ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_auth_update" ON storage.objects;
CREATE POLICY "magazine_anon_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'magazine');

-- ── DELETE ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "magazine_auth_delete" ON storage.objects;
CREATE POLICY "magazine_anon_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'magazine');
