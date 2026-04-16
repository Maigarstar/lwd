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

/**
 * Upload a single page image blob to storage.
 * @param {string} issueId
 * @param {number} renderVersion
 * @param {number} pageNumber
 * @param {Blob} imageBlob
 * @returns {{ publicUrl: string|null, storagePath: string|null, error: Error|null }}
 */
export async function uploadPageImage(issueId, renderVersion, pageNumber, imageBlob) {
  try {
    const path = pagePath(issueId, renderVersion, pageNumber);

    const { error: uploadErr } = await supabase.storage
      .from(PAGES_BUCKET)
      .upload(path, imageBlob, {
        upsert:       true,
        cacheControl: '31536000',
        contentType:  'image/jpeg',
      });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from(PAGES_BUCKET)
      .getPublicUrl(path);

    return { publicUrl, storagePath: path, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

/**
 * Upload a thumbnail blob to storage.
 */
export async function uploadThumbImage(issueId, renderVersion, pageNumber, thumbBlob) {
  try {
    const path = thumbPath(issueId, renderVersion, pageNumber);

    const { error: uploadErr } = await supabase.storage
      .from(THUMBS_BUCKET)
      .upload(path, thumbBlob, {
        upsert:       true,
        cacheControl: '31536000',
        contentType:  'image/jpeg',
      });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from(THUMBS_BUCKET)
      .getPublicUrl(path);

    return { publicUrl, storagePath: path, error: null };
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
