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

// ─── Single file upload ───────────────────────────────────────────────────

/**
 * Upload one File to Supabase Storage.
 * Returns the permanent public URL on success.
 * Throws on network or storage error.
 *
 * @param {File}   file   , the File object from the input / drop event
 * @param {string} mediaId, the item's id (nanoid), used as the filename
 */
export async function uploadMediaFile(file, mediaId) {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const ext    = ['jpg','jpeg','png','webp','gif','mp4','webm','mov'].includes(rawExt)
    ? rawExt
    : (file.type.startsWith('video') ? 'mp4' : 'jpg');

  const path = `${mediaId}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl:  '31536000',   // 1 year, images don't change at a given path
      upsert:        true,         // overwrite if the same media_id is re-uploaded
      contentType:   file.type || 'image/jpeg',
    });

  if (uploadError) {
    throw new Error(`Storage upload failed for "${file.name}": ${uploadError.message}`);
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
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
      urlMap[item.id] = await uploadMediaFile(item.file, item.id);
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
