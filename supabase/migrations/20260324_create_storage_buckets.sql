-- ═══════════════════════════════════════════════════════════════════════════
-- Create Storage Buckets for Media Uploads
-- ═══════════════════════════════════════════════════════════════════════════

-- Create listing-media bucket (for venue images, location images, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('listing-media', 'listing-media', true)
ON CONFLICT (id) DO NOTHING;

-- Create brand-assets bucket (for logo, branding, etc.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-assets', 'brand-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Create showcase-media bucket (for showcase/venue profile images)
INSERT INTO storage.buckets (id, name, public)
VALUES ('showcase-media', 'showcase-media', true)
ON CONFLICT (id) DO NOTHING;

-- ─── listing-media bucket RLS policies ─────────────────────────────────────
-- Allow anyone to READ (public access)
CREATE POLICY "Public Access - listing-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-media');

-- Allow authenticated users to UPLOAD
CREATE POLICY "Authenticated Upload - listing-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'listing-media' AND auth.role() = 'authenticated');

-- Allow authenticated users to UPDATE their own uploads
CREATE POLICY "Authenticated Update - listing-media"
ON storage.objects FOR UPDATE
WITH CHECK (bucket_id = 'listing-media' AND auth.role() = 'authenticated');

-- ─── brand-assets bucket RLS policies ──────────────────────────────────────
-- Allow anyone to READ (public access)
CREATE POLICY "Public Access - brand-assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'brand-assets');

-- Allow authenticated users to UPLOAD
CREATE POLICY "Authenticated Upload - brand-assets"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'brand-assets' AND auth.role() = 'authenticated');

-- ─── showcase-media bucket RLS policies ────────────────────────────────────
-- Allow anyone to READ (public access)
CREATE POLICY "Public Access - showcase-media"
ON storage.objects FOR SELECT
USING (bucket_id = 'showcase-media');

-- Allow authenticated users to UPLOAD
CREATE POLICY "Authenticated Upload - showcase-media"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'showcase-media' AND auth.role() = 'authenticated');
