/**
 * storageUpload.js
 *
 * Uploads media File objects from Listing Studio to Supabase Storage
 * (bucket: listing-media) and returns permanent public URLs.
 *
 * Call uploadPendingFiles() before every listing save to ensure all
 * File objects in hero_images[] and media_items[] are persisted.
 *
 * Storage path: listing-media/{media_id}.{ext}
 *  , media_id is already a nanoid/UUID unique to each item
 *  , upsert: true so re-saving the same item overwrites cleanly
 *  , 1-year cache header (images are immutable by media_id)
 */

import { supabase } from '../lib/supabaseClient';

const BUCKET = 'listing-media';
const THUMBNAIL_WIDTH = 400;
const THUMBNAIL_HEIGHT = 300;
const THUMBNAIL_QUALITY = 0.8;

// Hard timeouts so a stalled storage call or wedged FileReader can never
// spin the save button forever. Tuned for a 5MB image upload over a slow
// connection plus generous slack for Supabase's CDN edge.
const UPLOAD_TIMEOUT_MS    = 30000; // 30s per file → original
const THUMB_UPLOAD_TIMEOUT = 15000; // 15s per file → thumbnail
const THUMB_GEN_TIMEOUT_MS = 10000; // 10s for canvas thumbnail generation

// Race a promise against a timeout. The label is surfaced in the error
// message so we can tell which step hung.
function withTimeout(promise, ms, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () => reject(new Error(`${label} timed out after ${Math.round(ms / 1000)}s`)),
      ms
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// ─── Thumbnail generation ─────────────────────────────────────────────────

/**
 * Generate a thumbnail from an image file using Canvas API
 * @param {File} file - Image file to create thumbnail from
 * @param {number} maxWidth - Max width for thumbnail (default 400)
 * @param {number} maxHeight - Max height for thumbnail (default 300)
 * @param {number} quality - JPEG quality 0-1 (default 0.8)
 * @returns {Promise<Blob>} Thumbnail blob
 */
async function generateThumbnail(file, maxWidth = THUMBNAIL_WIDTH, maxHeight = THUMBNAIL_HEIGHT, quality = THUMBNAIL_QUALITY) {
  console.log('[generateThumbnail] Creating thumbnail:', { fileName: file.name, maxWidth, maxHeight });

  // Yield to the event loop so the spinner can paint before we hit the
  // (synchronous-ish) FileReader + Image decode pipeline on big files.
  await new Promise(r => setTimeout(r, 0));

  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event) => {
      const img = new Image();

      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          // Calculate dimensions while maintaining aspect ratio
          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (!ctx) throw new Error('Failed to get canvas context');

          ctx.drawImage(img, 0, 0, width, height);

          canvas.toBlob(
            (blob) => {
              if (!blob) throw new Error('Failed to create blob from canvas');
              console.log('[generateThumbnail] Thumbnail created:', { size: blob.size, type: blob.type });
              resolve(blob);
            },
            'image/jpeg',
            quality
          );
        } catch (err) {
          console.error('[generateThumbnail] Canvas error:', err);
          reject(err);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = event.target.result;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

// ─── Single file upload ───────────────────────────────────────────────────

/**
 * Upload one File to Supabase Storage (with automatic thumbnail generation).
 * Returns an object with both original and thumbnail URLs on success.
 * For non-image files (videos), only uploads original file.
 * Throws on network or storage error.
 *
 * @param {File}   file   , the File object from the input / drop event
 * @param {string} mediaId, the item's id (nanoid), used as the filename
 * @returns {Promise<string|{url: string, thumbnailUrl: string}>} Public URL(s)
 */
export async function uploadMediaFile(file, mediaId) {
  console.log('[uploadMediaFile] Starting upload:', { fileName: file.name, fileSize: file.size, fileType: file.type, mediaId });

  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg','jpeg','png','webp','gif','avif'].includes(rawExt) || file.type.startsWith('image/');
  const ext = ['jpg','jpeg','png','webp','gif','avif','mp4','webm','mov'].includes(rawExt)
    ? rawExt
    : (file.type.startsWith('video') ? 'mp4' : 'jpg');

  const path = `${mediaId}.${ext}`;
  const thumbPath = isImage ? `${mediaId}_thumb.jpg` : null;

  console.log('[uploadMediaFile] Upload paths:', { path, thumbPath, isImage });

  try {
    // Upload original file — wrapped in a hard timeout so a stalled
    // network or wedged Supabase storage call never freezes the save UI.
    const uploadPromise = supabase.storage
      .from(BUCKET)
      .upload(path, file, {
        cacheControl:  '31536000',   // 1 year, images don't change at a given path
        upsert:        true,         // overwrite if the same media_id is re-uploaded
        contentType:   file.type || 'image/jpeg',
      });

    const { error: uploadError, data: uploadData } = await withTimeout(
      uploadPromise,
      UPLOAD_TIMEOUT_MS,
      `Upload of "${file.name}"`,
    );

    console.log('[uploadMediaFile] Upload response:', { uploadError, uploadData });

    if (uploadError) {
      console.error('[uploadMediaFile] Upload error details:', uploadError);
      throw new Error(`Storage upload failed for "${file.name}": ${uploadError.message}`);
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);
    const publicUrl = urlData.publicUrl;
    console.log('[uploadMediaFile] Original URL:', publicUrl);

    // Generate and upload thumbnail for images
    let thumbnailUrl = null;
    if (isImage && thumbPath) {
      try {
        console.log('[uploadMediaFile] Generating thumbnail...');
        const thumbBlob = await withTimeout(
          generateThumbnail(file),
          THUMB_GEN_TIMEOUT_MS,
          `Thumbnail generation for "${file.name}"`,
        );

        const thumbUploadPromise = supabase.storage
          .from(BUCKET)
          .upload(thumbPath, thumbBlob, {
            cacheControl: '31536000',
            upsert: true,
            contentType: 'image/jpeg',
          });

        const { error: thumbError } = await withTimeout(
          thumbUploadPromise,
          THUMB_UPLOAD_TIMEOUT,
          `Thumbnail upload for "${file.name}"`,
        );

        if (thumbError) {
          console.warn('[uploadMediaFile] Thumbnail upload failed (non-fatal):', thumbError);
        } else {
          const { data: thumbUrlData } = supabase.storage.from(BUCKET).getPublicUrl(thumbPath);
          thumbnailUrl = thumbUrlData.publicUrl;
          console.log('[uploadMediaFile] Thumbnail URL:', thumbnailUrl);
        }
      } catch (err) {
        console.warn('[uploadMediaFile] Thumbnail generation/upload failed (non-fatal):', err);
        // Non-fatal: continue even if thumbnail fails
      }
    }

    console.log('[uploadMediaFile] Upload complete');

    // Return both URLs for images, just original for videos
    if (thumbnailUrl) {
      return { url: publicUrl, thumbnailUrl };
    }
    return publicUrl;

  } catch (err) {
    console.error('[uploadMediaFile] Exception:', err);
    throw err;
  }
}

// ─── Batch upload ─────────────────────────────────────────────────────────

/**
 * Upload all pending File objects in an items array.
 * Returns a new array where every File-backed item now has url = storageUrl.
 * Items that already have a URL (already uploaded) are untouched.
 * Items that fail to upload are left as-is (url stays ''); the save continues.
 *
 * @param {Array}    items      , hero_images[] or media_items[] from formData
 * @param {Function} onProgress , optional callback (string message)
 * @returns {{ items: Array, uploaded: number, failed: number }}
 */
export async function uploadPendingFiles(items = [], onProgress) {
  const pending = items.filter(item => item.file instanceof File);

  if (pending.length === 0) {
    return { items, uploaded: 0, failed: 0 };
  }

  const urlMap  = {};
  let   failed  = 0;

  for (let i = 0; i < pending.length; i++) {
    const item = pending[i];
    onProgress?.(`Uploading image ${i + 1} of ${pending.length}…`);

    try {
      const result = await uploadMediaFile(item.file, item.id);
      urlMap[item.id] = typeof result === 'string' ? result : result.url;
      console.log(`[storage] ✓ Uploaded ${item.file.name} → ${urlMap[item.id]}`);
    } catch (err) {
      console.error(`[storage] ✗ Failed to upload ${item.file.name}:`, err.message);
      failed++;
      // Non-fatal: continue uploading other files
    }
  }

  const uploaded = pending.length - failed;

  // Return new array with File-backed items replaced by storage URLs
  const updatedItems = items.map(item => {
    if (!urlMap[item.id]) return item;          // not uploaded, keep as-is
    const { file: _drop, ...rest } = item;      // strip File object
    return { ...rest, url: urlMap[item.id] };   // replace with permanent URL
  });

  return { items: updatedItems, uploaded, failed };
}
