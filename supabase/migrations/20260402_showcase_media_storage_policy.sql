-- ── showcase-media storage policies ──────────────────────────────────────────
-- Allow admin/anon users to upload and manage files in showcase-media bucket.
-- Matches the pattern used for listing-media.
-- ─────────────────────────────────────────────────────────────────────────────

-- Allow anyone to upload (insert) files into showcase-media
create policy "Allow public uploads to showcase-media"
  on storage.objects for insert
  to anon, authenticated
  with check (bucket_id = 'showcase-media');

-- Allow anyone to update (upsert) files in showcase-media
create policy "Allow public updates to showcase-media"
  on storage.objects for update
  to anon, authenticated
  using (bucket_id = 'showcase-media');

-- Allow anyone to delete files from showcase-media
create policy "Allow public deletes from showcase-media"
  on storage.objects for delete
  to anon, authenticated
  using (bucket_id = 'showcase-media');

-- Allow public reads (bucket is already public, but belt-and-suspenders)
create policy "Allow public reads from showcase-media"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'showcase-media');
