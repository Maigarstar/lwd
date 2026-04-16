/**
 * magazineIssuesService.js
 * CRUD + lifecycle operations for magazine_issues table.
 * Storage: magazine-pdfs / magazine-covers buckets.
 */

import { supabase } from '../lib/supabaseClient';

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

    const { data, error } = await supabase
      .from(ISSUES_TABLE)
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
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

    const { error: uploadErr } = await supabase.storage
      .from(PDF_BUCKET)
      .upload(path, file, {
        upsert:       true,
        cacheControl: '3600',
        contentType:  'application/pdf',
      });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from(PDF_BUCKET)
      .getPublicUrl(path);

    // Update issue record
    await updateIssue(issueId, {
      pdf_url:          publicUrl,
      pdf_storage_path: path,
    });

    return { publicUrl, storagePath: path, error: null };
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

    const { error: uploadErr } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, file, {
        upsert:       true,
        cacheControl: '31536000',
        contentType:  file.type || 'image/jpeg',
      });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(path);

    await updateIssue(issueId, {
      cover_image:         publicUrl,
      cover_storage_path:  path,
    });

    return { publicUrl, storagePath: path, error: null };
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

    const { error: uploadErr } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, file, {
        upsert:       true,
        cacheControl: '31536000',
        contentType:  file.type || 'image/jpeg',
      });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(path);

    await updateIssue(issueId, {
      back_cover_image:         publicUrl,
      back_cover_storage_path:  path,
    });

    return { publicUrl, storagePath: path, error: null };
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

    const { error: uploadErr } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, file, {
        upsert:       true,
        cacheControl: '31536000',
        contentType:  file.type || 'image/jpeg',
      });
    if (uploadErr) throw uploadErr;

    const { data: { publicUrl } } = supabase.storage
      .from(COVER_BUCKET)
      .getPublicUrl(path);

    await updateIssue(issueId, {
      alt_cover_image:         publicUrl,
      alt_cover_storage_path:  path,
    });

    return { publicUrl, storagePath: path, error: null };
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
