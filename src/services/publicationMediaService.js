// ─── publicationMediaService.js ───────────────────────────────────────────────
// WordPress-style media library for the Publication Studio.
//
// Architecture:
//   1. Every upload writes a row to `publication_media` in Supabase (primary).
//   2. The image picker reads ALL rows from that table — not just the current
//      issue — so any previously uploaded image is immediately reusable without
//      re-uploading.
//   3. localStorage acts as a fast first-paint cache and graceful fallback when
//      the DB is unreachable.
//
// Storage layout (magazine-pages bucket):
//   {issueId}/assets/{timestamp}-{sanitisedFilename}

import { supabase }              from '../lib/supabaseClient';
import { uploadViaEdgeFunction } from './magazinePageService';

const BUCKET     = 'magazine-pages';
const RECENT_KEY = 'lwd_studio_media_recent';
const MAX_RECENT = 120;

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitiseFilename(name) {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 80);
}

// magazine-pages bucket only accepts image/jpeg and image/png.
// Convert any other format (webp, avif, gif, bmp…) to jpeg via canvas
// so uploads never hit a 415 MIME rejection.
function normaliseImageFile(file) {
  const ALLOWED = ['image/jpeg', 'image/png'];
  if (ALLOWED.includes(file.type)) return Promise.resolve(file);

  return new Promise((resolve, reject) => {
    // Bug #21: canvas.toBlob may never fire in privacy-restricted browsers —
    // add a 15 s hard timeout so the upload doesn't hang forever.
    const timeout = setTimeout(() => reject(new Error('Image conversion timed out')), 15_000);

    const img = new Image();
    const blobUrl = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.naturalWidth;
      canvas.height = img.naturalHeight;
      canvas.getContext('2d').drawImage(img, 0, 0);
      URL.revokeObjectURL(blobUrl);
      canvas.toBlob(
        blob => {
          clearTimeout(timeout);
          if (!blob) { reject(new Error('Image conversion failed')); return; }
          const name = file.name.replace(/\.[^.]+$/, '.jpg');
          resolve(new File([blob], name, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        0.92,
      );
    };
    img.onerror = () => {
      clearTimeout(timeout);
      URL.revokeObjectURL(blobUrl);
      reject(new Error('Could not read image file'));
    };
    img.src = blobUrl;
  });
}

// ── localStorage cache (first-paint + offline fallback) ───────────────────────
export function getRecentAssets() {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch { return []; }
}

function addToRecent(item) {
  try {
    const prev    = getRecentAssets();
    const deduped = [item, ...prev.filter(r => r.url !== item.url)].slice(0, MAX_RECENT);
    localStorage.setItem(RECENT_KEY, JSON.stringify(deduped));
  } catch { /* storage full — ignore */ }
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function dbInsertMedia({ issueId, url, storagePath, filename, contentType, fileSize }) {
  const { error } = await supabase
    .from('publication_media')
    .upsert(
      {
        issue_id:     issueId || null,
        url,
        storage_path: storagePath,
        filename:     filename || storagePath.split('/').pop(),
        content_type: contentType || 'image/jpeg',
        file_size:    fileSize || null,
      },
      { onConflict: 'storage_path', ignoreDuplicates: false }
    );
  return error;
}

/**
 * Load all media from the DB (global — all issues).
 * Returns null on error so caller can fall back to localStorage.
 */
async function dbListAllMedia() {
  const { data, error } = await supabase
    .from('publication_media')
    .select('id, url, filename, issue_id, created_at, content_type, file_size')
    .order('created_at', { ascending: false })
    .limit(300);
  if (error || !data) return null;
  return data;
}

// ── Upload ────────────────────────────────────────────────────────────────────
/**
 * Upload a file to {issueId}/assets/{timestamp}-{filename} in magazine-pages.
 * Records the upload in the `publication_media` DB table so it appears in
 * the media library for ALL future issues without re-uploading.
 *
 * Returns { publicUrl, storagePath, error }.
 */
export async function uploadAsset(issueId, file, { onProgress } = {}) {
  // Normalise to jpeg/png before upload — bucket rejects webp, avif, gif etc.
  let normalised;
  try {
    normalised = await normaliseImageFile(file);
  } catch (e) {
    return { error: e.message || 'Image conversion failed' };
  }

  const safe = sanitiseFilename(normalised.name);
  const path = `${issueId || 'studio'}/assets/${Date.now()}-${safe}`;

  onProgress?.(20);

  let result;
  try {
    result = await uploadViaEdgeFunction({ bucket: BUCKET, path, blob: normalised, contentType: normalised.type });
  } catch (e) {
    return { error: e.message || 'Upload failed' };
  }
  if (!result?.publicUrl) return { error: 'No public URL returned' };

  onProgress?.(85);

  const publicUrl = result.publicUrl;

  // ── Persist to DB (primary) ──────────────────────────────────────────────
  const dbError = await dbInsertMedia({
    issueId,
    url:         publicUrl,
    storagePath: path,
    filename:    file.name,
    contentType: normalised.type,
    fileSize:    normalised.size,
  });

  // ── Always save to localStorage (fast first-paint cache) ────────────────
  addToRecent({
    url:        publicUrl,
    name:       file.name,
    issueId:    issueId || 'studio',
    uploadedAt: Date.now(),
  });

  if (dbError) {
    console.warn('[media] DB insert failed, localStorage-only:', dbError.message);
  }

  onProgress?.(100);

  return { publicUrl, storagePath: path };
}

// ── List ──────────────────────────────────────────────────────────────────────
/**
 * Return all media library assets, newest first.
 * Primary source: `publication_media` DB table.
 * Fallback: Supabase Storage listing + localStorage cache.
 *
 * Each item: { url, name, issueId, uploadedAt, fromOtherIssue }
 * `fromOtherIssue` is true when the image was uploaded under a different issue.
 */
export async function listAllAssets(issueId) {
  // ── 1. Try DB (global, persistent, cross-device) ─────────────────────────
  // Bug #9: treat null as "DB unavailable" and [] as "DB available but empty"
  // — only fall back to Storage/localStorage when DB is actually unreachable.
  const dbRows = await dbListAllMedia();
  if (dbRows !== null) {
    // DB responded (even if empty) — use it as the authoritative source
    return (dbRows || []).map(r => ({
      url:            r.url,
      name:           r.filename || r.url.split('/').pop(),
      issueId:        r.issue_id,
      uploadedAt:     r.created_at,
      contentType:    r.content_type,
      fromOtherIssue: r.issue_id !== issueId,
    }));
  }

  // ── 2. Fallback: Storage listing + localStorage (DB unavailable) ──────────
  // Bug #10: wrap in try-catch so a Storage outage doesn't crash the picker
  try {
    const [issueAssets, recent] = await Promise.all([
      listIssueAssets(issueId),
      Promise.resolve(getRecentAssets()),
    ]);
    const seen   = new Set(issueAssets.map(a => a.url));
    const others = recent
      .filter(r => !seen.has(r.url) && r.issueId !== issueId)
      .map(r => ({ ...r, fromOtherIssue: true }));
    return [...issueAssets, ...others];
  } catch (e) {
    console.warn('[media] Storage fallback failed, using localStorage only:', e.message);
    return getRecentAssets();
  }
}

/**
 * List all asset files uploaded for a given issue (from Supabase Storage).
 * Used as fallback when `publication_media` table is unavailable.
 */
export async function listIssueAssets(issueId) {
  if (!issueId) return [];
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .list(`${issueId}/assets`, {
        limit:  200,
        sortBy: { column: 'created_at', order: 'desc' },
      });
    if (error || !data) return [];
    return data
      .filter(f => f.name && /\.(jpg|jpeg|png|webp)$/i.test(f.name))
      .map(f => {
        const filePath = `${issueId}/assets/${f.name}`;
        const { data: { publicUrl } } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
        return { url: publicUrl, name: f.name, uploadedAt: f.created_at, issueId };
      });
  } catch { return []; }
}

/**
 * Delete a media asset from both the DB and Supabase Storage.
 * Returns { error } or {} on success.
 */
export async function deleteAsset(url, storagePath) {
  // Bug #16: validate at least one identifier is provided
  if (!url && !storagePath) return { error: 'Must provide url or storagePath to delete' };
  const errors = [];

  if (storagePath) {
    const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
    if (error) errors.push(error.message);
  }

  const { error: dbErr } = await supabase
    .from('publication_media')
    .delete()
    .eq('url', url);
  if (dbErr) errors.push(dbErr.message);

  // Remove from localStorage cache too
  try {
    const prev = getRecentAssets();
    const next = prev.filter(r => r.url !== url);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  } catch { /* ignore */ }

  return errors.length ? { error: errors.join('; ') } : {};
}
