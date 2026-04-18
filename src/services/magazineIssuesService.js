/**
 * magazineIssuesService.js
 * CRUD + lifecycle operations for magazine_issues table.
 * Storage: magazine-pdfs / magazine-covers buckets.
 */

import { supabase } from '../lib/supabaseClient';
import { uploadViaEdgeFunction } from './magazinePageService';

const ISSUES_TABLE  = 'magazine_issues';
const PDF_BUCKET    = 'magazine-pdfs';
const COVER_BUCKET  = 'magazine-covers';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeSlug(title, issueNumber, year) {
  const base = title
    ? title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
    : `issue-${issueNumber || 'new'}`;
  const suffix = year ? `-${year}` : '';
  return `${base}${suffix}`;
}

function uploadPath(bucket, issueId, filename) {
  return `${issueId}/${filename}`;
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

/**
 * List all issues ordered by created_at desc.
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchIssues() {
  try {
    const { data, error } = await supabase
      .from(ISSUES_TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Fetch a single issue by id.
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function fetchIssueById(id) {
  try {
    const { data, error } = await supabase
      .from(ISSUES_TABLE)
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Fetch a single issue by slug.
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function fetchIssueBySlug(slug) {
  try {
    const { data, error } = await supabase
      .from(ISSUES_TABLE)
      .select('*')
      .eq('slug', slug)
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ── Create ────────────────────────────────────────────────────────────────────

/**
 * Create a new magazine issue.
 * Auto-generates slug from title + year if not provided.
 * @param {Object} fields - Partial issue fields
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function createIssue(fields = {}) {
  try {
    const slug = fields.slug || makeSlug(fields.title, fields.issue_number, fields.year);
    const payload = {
      slug,
      title:          fields.title          || '',
      issue_number:   fields.issue_number   ?? null,
      season:         fields.season         ?? null,
      year:           fields.year           ?? new Date().getFullYear(),
      intro:          fields.intro          ?? null,
      editor_note:    fields.editor_note    ?? null,
      status:         'draft',
      processing_state: 'idle',
      is_featured:    false,
      slug_locked:    false,
      render_version: 1,
      page_count:     0,
    };

    console.log('[createIssue] inserting slug:', slug, 'payload keys:', Object.keys(payload));

    // Race the DB call against a 30-second timeout.
    // Supabase free-tier projects sleep after inactivity and can take 15–20 s
    // to wake up — 12 s was too short and caused false timeouts.
    const makeDbCall = () => supabase
      .from(ISSUES_TABLE)
      .insert(payload)
      .select()
      .single();

    const withTimeout = (promise, ms) => Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(
          `Create timed out after ${ms / 1000} s — Supabase did not respond.\n\n` +
          'If your Supabase project was sleeping, wait a few seconds and try again.\n' +
          'Other causes: network issue, or duplicate slug.\n' +
          `Slug attempted: "${slug}"`
        )), ms)
      ),
    ]);

    const { data, error } = await withTimeout(makeDbCall(), 30000);
    console.log('[createIssue] result:', { data: !!data, error: error?.message });
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    console.error('[createIssue] failed:', error);
    return { data: null, error };
  }
}

// ── Update ────────────────────────────────────────────────────────────────────

/**
 * Update arbitrary fields on an issue.
 * Slug is protected — only updatable when slug_locked is false.
 * @param {string} id
 * @param {Object} fields
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function updateIssue(id, fields) {
  try {
    // Strip slug if it's a slug_locked issue (protect against accidental changes)
    const safe = { ...fields };
    delete safe.id;
    delete safe.created_at;

    const { data, error } = await supabase
      .from(ISSUES_TABLE)
      .update(safe)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Publish an issue: sets status=published, published_at=now(), slug_locked=true.
 */
export async function publishIssue(id) {
  return updateIssue(id, {
    status:      'published',
    published_at: new Date().toISOString(),
    slug_locked:  true,
  });
}

/**
 * Unpublish (revert to draft).
 */
export async function unpublishIssue(id) {
  return updateIssue(id, { status: 'draft' });
}

/**
 * Archive an issue.
 */
export async function archiveIssue(id) {
  return updateIssue(id, { status: 'archived' });
}

/**
 * Mark processing state.
 */
export async function setProcessingState(id, state, errorMsg = null) {
  const fields = { processing_state: state };
  if (state === 'ready')   fields.processed_at = new Date().toISOString();
  if (state === 'failed')  fields.processing_error = errorMsg;
  if (state === 'processing') fields.processing_error = null;
  return updateIssue(id, fields);
}

/**
 * Increment render_version (called before a reprocess).
 */
export async function bumpRenderVersion(id, currentVersion) {
  return updateIssue(id, {
    render_version:   currentVersion + 1,
    processing_state: 'idle',
    processing_error:  null,
  });
}

/**
 * Update page count (called after pages are inserted/deleted).
 */
export async function updatePageCount(id, count) {
  return updateIssue(id, { page_count: count });
}

// ── Delete ────────────────────────────────────────────────────────────────────

/**
 * Delete an issue and its storage files (PDF + cover).
 * Pages cascade-delete via FK.
 */
export async function deleteIssue(id) {
  try {
    // Delete PDF from storage (best-effort, don't fail if missing)
    await supabase.storage.from(PDF_BUCKET).remove([`${id}/original.pdf`]).catch(() => {});

    // Delete cover from storage (best-effort)
    await supabase.storage.from(COVER_BUCKET).remove([`${id}/cover.jpg`]).catch(() => {});

    const { error } = await supabase
      .from(ISSUES_TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// ── Storage ───────────────────────────────────────────────────────────────────

/**
 * Upload PDF to storage and update issue record with pdf_url + pdf_storage_path.
 * @param {string} issueId
 * @param {File} file
 * @returns {{ publicUrl: string|null, storagePath: string|null, error: Error|null }}
 */
export async function uploadIssuePdf(issueId, file) {
  try {
    const path = uploadPath(PDF_BUCKET, issueId, 'original.pdf');
    const result = await uploadViaEdgeFunction({ bucket: PDF_BUCKET, path, blob: file, contentType: 'application/pdf' });
    await updateIssue(issueId, { pdf_url: result.publicUrl, pdf_storage_path: path });
    return { publicUrl: result.publicUrl, storagePath: path, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

/**
 * Upload cover image to storage and update issue record.
 * Accepts any image file; stored as cover.jpg (coerced via content-type).
 * @param {string} issueId
 * @param {File|Blob} file
 * @returns {{ publicUrl: string|null, storagePath: string|null, error: Error|null }}
 */
export async function uploadIssueCover(issueId, file) {
  try {
    const ext  = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${issueId}/cover.${ext}`;
    const result = await uploadViaEdgeFunction({ bucket: COVER_BUCKET, path, blob: file, contentType: file.type || 'image/jpeg' });
    await updateIssue(issueId, { cover_image: result.publicUrl, cover_storage_path: path });
    return { publicUrl: result.publicUrl, storagePath: path, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

/**
 * Fetch published issues ordered by published_at desc.
 * Used by the RSS feed, sitemap, and any public discovery surface.
 * @param {number} limit - Max issues to return (default 20)
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchPublishedIssues(limit = 20) {
  try {
    const { data, error } = await supabase
      .from(ISSUES_TABLE)
      .select('id, slug, title, issue_number, season, year, cover_image, og_image_url, pdf_url, seo_description, intro, published_at')
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Upload the back cover image for a magazine issue.
 * Stores at magazine-covers/[issueId]/back-cover.[ext]
 * Updates back_cover_image + back_cover_storage_path on the issue.
 */
export async function uploadIssueBackCover(issueId, file) {
  try {
    const ext  = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${issueId}/back-cover.${ext}`;
    const result = await uploadViaEdgeFunction({ bucket: COVER_BUCKET, path, blob: file, contentType: file.type || 'image/jpeg' });
    await updateIssue(issueId, { back_cover_image: result.publicUrl, back_cover_storage_path: path });
    return { publicUrl: result.publicUrl, storagePath: path, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

// ── A/B Cover Testing ─────────────────────────────────────────────────────────

/**
 * Upload the alternate (variant B) cover image for A/B testing.
 * Stores at magazine-covers/[issueId]/alt-cover.[ext]
 * Updates alt_cover_image + alt_cover_storage_path on the issue.
 */
export async function uploadIssueAltCover(issueId, file) {
  try {
    const ext  = file.type === 'image/png' ? 'png' : 'jpg';
    const path = `${issueId}/alt-cover.${ext}`;
    const result = await uploadViaEdgeFunction({ bucket: COVER_BUCKET, path, blob: file, contentType: file.type || 'image/jpeg' });
    await updateIssue(issueId, { alt_cover_image: result.publicUrl, alt_cover_storage_path: path });
    return { publicUrl: result.publicUrl, storagePath: path, error: null };
  } catch (error) {
    return { publicUrl: null, storagePath: null, error };
  }
}

/**
 * Returns 'a' or 'b' for A/B variant assignment.
 * Consistent within a browser session per issue (stored in sessionStorage).
 * @param {string} issueId
 * @returns {'a'|'b'}
 */
export function getAbVariant(issueId) {
  const key    = `lwd_ab_${issueId}`;
  const stored = sessionStorage.getItem(key);
  if (stored === 'a' || stored === 'b') return stored;
  const variant = Math.random() < 0.5 ? 'a' : 'b';
  try { sessionStorage.setItem(key, variant); } catch {}
  return variant;
}

/**
 * Fire-and-forget: track an impression for the given variant.
 * @param {string} issueId
 * @param {'a'|'b'} variant
 */
export async function trackAbImpression(issueId, variant) {
  await supabase
    .rpc('increment_ab_stat', { p_issue_id: issueId, p_variant: variant, p_field: 'impressions' })
    .catch(() => {});
}

/**
 * Fire-and-forget: track a click (cover click / open) for the given variant.
 * @param {string} issueId
 * @param {'a'|'b'} variant
 */
export async function trackAbClick(issueId, variant) {
  await supabase
    .rpc('increment_ab_stat', { p_issue_id: issueId, p_variant: variant, p_field: 'clicks' })
    .catch(() => {});
}

// ── Render History ─────────────────────────────────────────────────────────────

/**
 * Log a render version entry when an issue is (re)processed.
 * @param {string} issueId
 * @param {number} renderVersion
 * @param {number} pageCount
 * @param {string} triggeredBy - 'pdf_upload' | 'reprocess' | 'manual'
 * @param {string|null} notes
 * @returns {{ error: Error|null }}
 */
export async function logRenderVersion(issueId, renderVersion, pageCount, triggeredBy, notes) {
  const { error } = await supabase
    .from('magazine_render_history')
    .insert({
      issue_id:       issueId,
      render_version: renderVersion,
      page_count:     pageCount,
      triggered_by:   triggeredBy || 'manual',
      notes:          notes || null,
    });
  return { error };
}

/**
 * Fetch render history for an issue, newest version first.
 * @param {string} issueId
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchRenderHistory(issueId) {
  const { data, error } = await supabase
    .from('magazine_render_history')
    .select('*')
    .eq('issue_id', issueId)
    .order('render_version', { ascending: false });
  return { data: data || [], error };
}

// ── Clone Issue ────────────────────────────────────────────────────────────────

/**
 * Clone an existing issue into a new draft.
 * Copies all fields except: status (→draft), slug (→original-copy-<base36>),
 * published_at (→null), render_version (→1), slug_locked (→false).
 * Also copies all pages from magazine_issue_pages.
 *
 * @param {string} issueId - Source issue ID
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function cloneIssue(issueId) {
  try {
    // 1. Fetch original issue
    const { data: original, error: fetchErr } = await fetchIssueById(issueId);
    if (fetchErr || !original) throw fetchErr || new Error('Issue not found');

    // 2. Build new issue payload
    const newSlug = `${original.slug}-copy-${Date.now().toString(36)}`;
    // eslint-disable-next-line no-unused-vars
    const { id: _id, created_at: _ca, updated_at: _ua, published_at: _pa, slug: _slug, slug_locked: _sl, status: _st, render_version: _rv, ...rest } = original;

    const newIssuePayload = {
      ...rest,
      title:            `${original.title || 'Untitled Issue'} (Copy)`,
      slug:             newSlug,
      status:           'draft',
      slug_locked:      false,
      render_version:   1,
      published_at:     null,
      page_count:       0,
      processing_state: 'idle',
    };

    const { data: newIssue, error: insertErr } = await supabase
      .from(ISSUES_TABLE)
      .insert(newIssuePayload)
      .select()
      .single();
    if (insertErr) throw insertErr;

    // 3. Fetch original pages
    const { data: originalPages } = await supabase
      .from('magazine_issue_pages')
      .select('*')
      .eq('issue_id', issueId)
      .order('page_number', { ascending: true });

    // 4. Insert page copies
    if (originalPages && originalPages.length > 0) {
      const pageCopies = originalPages.map(p => {
        // eslint-disable-next-line no-unused-vars
        const { id: _pid, created_at: _pca, ...pageRest } = p;
        return { ...pageRest, issue_id: newIssue.id };
      });
      await supabase.from('magazine_issue_pages').insert(pageCopies);

      // Update page_count on new issue
      await supabase.from(ISSUES_TABLE).update({ page_count: pageCopies.length }).eq('id', newIssue.id);
      newIssue.page_count = pageCopies.length;
    }

    return { data: newIssue, error: null };
  } catch (error) {
    console.error('[magazineIssuesService] cloneIssue failed:', error);
    return { data: null, error };
  }
}
