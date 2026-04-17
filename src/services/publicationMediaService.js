// ─── publicationMediaService.js ───────────────────────────────────────────────
// Upload and retrieve user media assets for the Publication Studio.
//
// Storage layout (magazine-pages bucket):
//   {issueId}/assets/{timestamp}-{sanitisedFilename}
//
// Cross-issue reuse: recently-uploaded URLs are stored in localStorage under
// LWD_MEDIA_RECENT so the image picker shows them across sessions/issues.

import { supabase }                 from '../lib/supabaseClient';
import { uploadViaEdgeFunction }    from './magazinePageService';

const BUCKET     = 'magazine-pages';
const RECENT_KEY = 'lwd_studio_media_recent';
const MAX_RECENT = 80;

// ── Helpers ───────────────────────────────────────────────────────────────────
function sanitiseFilename(name) {
  return name.replace(/[^A-Za-z0-9._-]/g, '_').replace(/_+/g, '_').slice(0, 80);
}

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

// ── Upload ────────────────────────────────────────────────────────────────────
/**
 * Upload a file to {issueId}/assets/{timestamp}-{filename} in magazine-pages.
 * Returns { publicUrl, storagePath, error }.
 */
export async function uploadAsset(issueId, file) {
  const safe = sanitiseFilename(file.name);
  const path = `${issueId || 'studio'}/assets/${Date.now()}-${safe}`;

  let result;
  try {
    result = await uploadViaEdgeFunction({ bucket: BUCKET, path, blob: file, contentType: file.type || 'image/jpeg' });
  } catch (e) {
    return { error: e.message || 'Upload failed' };
  }
  if (!result?.publicUrl) return { error: 'No public URL returned' };

  const publicUrl = result.publicUrl;
  // Track in localStorage for cross-issue reuse
  addToRecent({
    url:        publicUrl,
    name:       file.name,
    issueId:    issueId || 'studio',
    uploadedAt: Date.now(),
  });

  return { publicUrl, storagePath: path };
}

// ── List ──────────────────────────────────────────────────────────────────────
/**
 * List all asset files uploaded for a given issue.
 * Returns array of { url, name, uploadedAt }.
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
 * Merge cross-issue recent assets (localStorage) with current-issue assets
 * from Supabase storage. De-duplicates by URL. Current issue shown first.
 */
export async function listAllAssets(issueId) {
  const [issueAssets, recent] = await Promise.all([
    listIssueAssets(issueId),
    Promise.resolve(getRecentAssets()),
  ]);
  // Merge: issue-specific first, then recent from other issues
  const seen = new Set(issueAssets.map(a => a.url));
  const others = recent
    .filter(r => !seen.has(r.url) && r.issueId !== issueId)
    .map(r => ({ ...r, fromOtherIssue: true }));
  return [...issueAssets, ...others];
}
