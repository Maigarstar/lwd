-- ── Magazine Storage Bucket ──────────────────────────────────────────────────
-- Creates the 'magazine' public bucket and sets RLS policies.
-- Run once in Supabase SQL Editor.
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Create the bucket (public so images render without signed URLs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'magazine',
  'magazine',
  true,
  10485760,  -- 10 MB max per file
  ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public             = true,
  file_size_limit    = 10485760,
  allowed_mime_types = ARRAY['image/jpeg','image/jpg','image/png','image/webp','image/gif'];

-- 2. Public SELECT — anyone can read (images must render on the public site)
DROP POLICY IF EXISTS "magazine_public_read"   ON storage.objects;
CREATE POLICY "magazine_public_read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'magazine');

-- 3. Authenticated INSERT — any logged-in user can upload
DROP POLICY IF EXISTS "magazine_auth_insert"   ON storage.objects;
CREATE POLICY "magazine_auth_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'magazine' AND auth.role() = 'authenticated');

-- 4. Authenticated UPDATE (for metadata edits)
DROP POLICY IF EXISTS "magazine_auth_update"   ON storage.objects;
CREATE POLICY "magazine_auth_update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'magazine' AND auth.role() = 'authenticated');

-- 5. Authenticated DELETE
DROP POLICY IF EXISTS "magazine_auth_delete"   ON storage.objects;
CREATE POLICY "magazine_auth_delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'magazine' AND auth.role() = 'authenticated');
