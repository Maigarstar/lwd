/**
 * magazinePageService.js
 * CRUD for magazine_issue_pages table.
 * Storage: magazine-pages / magazine-thumbs buckets.
 */

import { supabase } from '../lib/supabaseClient';

const PAGES_TABLE  = 'magazine_issue_pages';
const PAGES_BUCKET = 'magazine-pages';
const THUMBS_BUCKET = 'magazine-thumbs';

// ── Path helpers ──────────────────────────────────────────────────────────────

/**
 * Returns the storage path for a full-res page image.
 * e.g. "abc-uuid/v3/page-007.jpg"
 */
export function pagePath(issueId, renderVersion, pageNumber) {
  const n = String(pageNumber).padStart(3, '0');
  return `${issueId}/v${renderVersion}/page-${n}.jpg`;
}

/**
 * Returns the storage path for a page thumbnail.
 */
export function thumbPath(issueId, renderVersion, pageNumber) {
  const n = String(pageNumber).padStart(3, '0');
  return `${issueId}/v${renderVersion}/thumb-${n}.jpg`;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * Fetch all pages for an issue, ordered by page_number.
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchPages(issueId) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .select('*')
      .eq('issue_id', issueId)
      .order('page_number', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Fetch a single page record.
 */
export async function fetchPage(issueId, pageNumber) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .select('*')
      .eq('issue_id', issueId)
      .eq('page_number', pageNumber)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ── Upsert ────────────────────────────────────────────────────────────────────

/**
 * Upsert a single page record (insert or update on conflict).
 * @param {Object} pageData - Must include issue_id, page_number
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function upsertPage(pageData) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .upsert(pageData, { onConflict: 'issue_id,page_number' })
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Batch upsert multiple page records.
 * Used after PDF processing to insert all pages at once.
 * @param {Array} pages - Array of page objects
 * @returns {{ data: Array, error: Error|null }}
 */
export async function upsertPages(pages) {
  try {
    if (!pages.length) return { data: [], error: null };
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .upsert(pages, { onConflict: 'issue_id,page_number' })
      .select();
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete all pages for an issue (and their storage files).
 * Called before reprocessing to start fresh.
 */
export async function deleteAllPages(issueId) {
  try {
    // Fetch pages to get storage paths
    const { data: pages } = await fetchPages(issueId);

    // Remove storage files (best-effort)
    if (pages.length) {
      const pagePaths  = pages.map(p => p.image_storage_path).filter(Boolean);
      const thumbPaths = pages.map(p => p.thumbnail_storage_path).filter(Boolean);
      if (pagePaths.length)  await supabase.storage.from(PAGES_BUCKET).remove(pagePaths).catch(() => {});
      if (thumbPaths.length) await supabase.storage.from(THUMBS_BUCKET).remove(thumbPaths).catch(() => {});
    }

    const { error } = await supabase
      .from(PAGES_TABLE)
      .delete()
      .eq('issue_id', issueId);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

/**
 * Delete a single page by page_number.
 */
export async function deletePage(issueId, pageNumber) {
  try {
    const { data: page } = await fetchPage(issueId, pageNumber);

    // Remove storage files (best-effort)
    if (page?.image_storage_path)     await supabase.storage.from(PAGES_BUCKET).remove([page.image_storage_path]).catch(() => {});
    if (page?.thumbnail_storage_path) await supabase.storage.from(THUMBS_BUCKET).remove([page.thumbnail_storage_path]).catch(() => {});

    const { error } = await supabase
      .from(PAGES_TABLE)
      .delete()
      .eq('issue_id', issueId)
      .eq('page_number', pageNumber);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// ── Storage Upload ─────────────────────────────────────────────────────────────
//
// All writes to magazine-* storage buckets go through the `upload-magazine-page`
// edge function. The browser NEVER calls supabase.storage.from(...).upload()
// directly — dashboard-created buckets have no INSERT policy on storage.objects,
// so direct writes 400 with "new row violates row-level security policy".
//
// The edge function:
//   1. Verifies the user's JWT (authenticated sessions only)
//   2. Validates bucket allow-list, path pattern, size, and MIME type
//   3. Uploads with service role (bypasses storage.objects RLS)
//   4. Returns the public URL
//
// See: supabase/functions/upload-magazine-page/index.ts
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Internal — POST a blob to the upload-magazine-page edge function.
 *
 * Supabase Edge Functions require TWO headers:
 *   Authorization: Bearer <user-jwt>   — identifies the caller
 *   apikey: <anon-key>                 — identifies the project (platform-level gate)
 *
 * The original raw fetch only sent Authorization, causing a platform-level 401.
 * supabase.supabaseKey exposes the anon key used when the client was created,
 * so we can add it without duplicating the env var.
 *
 * Throws on any non-2xx response (fail-fast; no silent retries).
 */
export async function uploadViaEdgeFunction({ bucket, path, blob, contentType = 'image/jpeg' }) {
  // Read session for user JWT
  const { data: sessionRes, error: sessionErr } = await supabase.auth.getSession();
  if (sessionErr) throw new Error(`Could not read auth session: ${sessionErr.message}`);
  const token = sessionRes?.session?.access_token;
  if (!token) {
    throw new Error('Not authenticated — sign in with an admin account before publishing.');
  }

  const form = new FormData();
  form.append('bucket',      bucket);
  form.append('path',        path);
  form.append('contentType', contentType);
  form.append('file',        blob, path.split('/').pop());

  // supabase.supabaseKey is the anon key passed to createClient() — same value
  // as VITE_SUPABASE_ANON_KEY without needing to re-read import.meta.env.
  const supabaseUrl  = supabase.supabaseUrl  || import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey  = supabase.supabaseKey  || import.meta.env.VITE_SUPABASE_ANON_KEY;
  const url = `${supabaseUrl}/functions/v1/upload-magazine-page`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      // ES256 user JWTs are rejected by Supabase's platform-level JWT gate.
      // Use the anon key (HS256) as the Bearer token — the platform always
      // accepts it. The user JWT is passed separately as x-user-token so the
      // edge function can log who triggered the upload.
      Authorization:  `Bearer ${supabaseKey}`,
      apikey:          supabaseKey,
      'x-user-token':  token,
      // NOTE: do NOT set Content-Type — browser sets multipart boundary for FormData.
    },
    body: form,
  });

  // Extract actual error body for clear diagnostics (not just the status code)
  let payload;
  try {
    payload = await res.json();
  } catch {
    const txt = await res.text().catch(() => '');
    throw new Error(`Edge function returned non-JSON (${res.status}): ${txt.slice(0, 300)}`);
  }

  if (!res.ok || !payload?.success) {
    throw new Error(
      `Edge upload failed (${res.status}): ${payload?.error || payload?.message || JSON.stringify(payload).slice(0, 200)}`
    );
  }

  return payload.data; // { publicUrl, storagePath, bucket, sizeBytes, uploadedBy }
}

/**
 * Upload a single page image blob to storage via the upload-magazine-page edge function.
 * @param {string} issueId
 * @param {number} renderVersion
 * @param {number} pageNumber
 * @param {Blob} imageBlob
 * @returns {{ publicUrl: string|null, storagePath: string|null, error: Error|null }}
 */
export async function uploadPageImage(issueId, renderVersion, pageNumber, imageBlob) {
  try {
    const path = pagePath(issueId, renderVersion, pageNumber);
    const data = await uploadViaEdgeFunction({
      bucket:      PAGES_BUCKET,
      path,
      blob:        imageBlob,
      contentType: 'image/jpeg',
    });
    return { publicUrl: data.publicUrl, storagePath: data.storagePath, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

/**
 * Upload a thumbnail blob to storage via the upload-magazine-page edge function.
 */
export async function uploadThumbImage(issueId, renderVersion, pageNumber, thumbBlob) {
  try {
    const path = thumbPath(issueId, renderVersion, pageNumber);
    const data = await uploadViaEdgeFunction({
      bucket:      THUMBS_BUCKET,
      path,
      blob:        thumbBlob,
      contentType: 'image/jpeg',
    });
    return { publicUrl: data.publicUrl, storagePath: data.storagePath, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

/**
 * Update page caption.
 */
export async function updatePageCaption(pageId, caption) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .update({ caption })
      .eq('id', pageId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Save hotspot link_targets for a page.
 * @param {string} pageId - UUID of magazine_issue_pages row
 * @param {Array}  hotspots - array of hotspot objects
 */
export async function updatePageHotspots(pageId, hotspots) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .update({ link_targets: hotspots })
      .eq('id', pageId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Save vendor credits for a page.
 * @param {string} pageId  - UUID of magazine_issue_pages row
 * @param {Array}  credits - array of credit objects
 */
export async function updatePageCredits(pageId, credits) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .update({ vendor_credits: credits })
      .eq('id', pageId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Save video settings for a page.
 * @param {string} pageId    - UUID of magazine_issue_pages row
 * @param {Object} videoData - { video_url, video_autoplay, video_muted }
 */
export async function updatePageVideo(pageId, videoData) {
  try {
    const { data, error } = await supabase
      .from(PAGES_TABLE)
      .update(videoData)
      .eq('id', pageId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
