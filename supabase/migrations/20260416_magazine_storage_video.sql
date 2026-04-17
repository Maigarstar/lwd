-- Migration: 20260416_magazine_storage_video
--
-- The magazine bucket currently only allows image MIME types.
-- Publication Studio needs video uploads (mp4, webm, quicktime).
-- Also increases the per-file limit to 200 MB to handle video.

UPDATE storage.buckets
SET
  file_size_limit    = 209715200,   -- 200 MB (up from 10 MB)
  allowed_mime_types = ARRAY[
    'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif',
    'video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo'
  ]
WHERE id = 'magazine';
