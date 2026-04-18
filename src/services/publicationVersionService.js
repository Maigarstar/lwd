// ─── publicationVersionService.js ────────────────────────────────────────────
// WordPress-style revision history for the Publication Studio.
//
// Every save (manual or auto) calls createVersion() which snapshots the full
// pages array into `publication_versions`. Users can list all versions and
// restore any of them — the live pages in `magazine_pages` are then overwritten
// with the snapshot's canvasJSON values.
//
// Retention: 50 versions per issue (oldest pruned automatically on write).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabaseClient';

const TABLE       = 'publication_versions';
const MAX_VERSIONS = 50;

// ── Write ─────────────────────────────────────────────────────────────────────

/**
 * Snapshot the current pages state as a new version.
 *
 * @param {string}  issueId  - UUID of the magazine issue
 * @param {Array}   pages    - live pages array (each has .canvasJSON, .page_number etc.)
 * @param {string}  label    - 'Manual save' | 'Auto-save' | custom user string
 * @returns {{ version: object|null, error: string|null }}
 */
export async function createVersion(issueId, pages, label = 'Save') {
  if (!issueId || !pages?.length) return { version: null, error: 'Missing issueId or pages' };

  // Build a compact snapshot — only what we need to restore
  const snapshot = pages.map((p, i) => ({
    page_number: p.page_number ?? i + 1,
    canvasJSON:  p.canvasJSON  ?? null,
    slot:        p.slot        ?? null,
  }));

  // Get the next version number for this issue
  const { data: nextData, error: numErr } = await supabase
    .rpc('next_publication_version', { p_issue_id: issueId });
  if (numErr) {
    console.warn('[versions] Could not get next version number:', numErr.message);
    return { version: null, error: numErr.message };
  }

  const versionNumber = nextData ?? 1;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({
      issue_id:        issueId,
      version_number:  versionNumber,
      pages_snapshot:  snapshot,
      page_count:      pages.length,
      label,
    })
    .select('id, issue_id, version_number, page_count, label, created_at')
    .single();

  if (error) {
    console.warn('[versions] Insert failed:', error.message);
    return { version: null, error: error.message };
  }

  // Prune old versions beyond the retention limit (fire-and-forget)
  pruneOldVersions(issueId).catch(() => {});

  return { version: data, error: null };
}

// ── Read ──────────────────────────────────────────────────────────────────────

/**
 * List all versions for an issue, newest first.
 * Does NOT include pages_snapshot (heavy) — call getVersion() for that.
 *
 * @returns {{ versions: Array, error: string|null }}
 */
export async function listVersions(issueId) {
  if (!issueId) return { versions: [], error: null };

  const { data, error } = await supabase
    .from(TABLE)
    .select('id, version_number, page_count, label, created_at')
    .eq('issue_id', issueId)
    .order('version_number', { ascending: false })
    .limit(MAX_VERSIONS);

  if (error) return { versions: [], error: error.message };
  return { versions: data || [], error: null };
}

/**
 * Fetch a single version including its full pages snapshot.
 *
 * @returns {{ version: object|null, error: string|null }}
 */
export async function getVersion(versionId) {
  const { data, error } = await supabase
    .from(TABLE)
    .select('id, version_number, page_count, label, created_at, pages_snapshot')
    .eq('id', versionId)
    .single();

  if (error) return { version: null, error: error.message };
  return { version: data, error: null };
}

// ── Prune ─────────────────────────────────────────────────────────────────────

async function pruneOldVersions(issueId) {
  // Find IDs of versions beyond the limit
  const { data } = await supabase
    .from(TABLE)
    .select('id')
    .eq('issue_id', issueId)
    .order('version_number', { ascending: false })
    .range(MAX_VERSIONS, 9999); // everything after position MAX_VERSIONS

  if (!data?.length) return;

  const ids = data.map(r => r.id);
  await supabase.from(TABLE).delete().in('id', ids);
}

// ── Label update ──────────────────────────────────────────────────────────────

/**
 * Let the user rename a version (e.g. "Client approved" / "Before rebrand").
 */
export async function renameVersion(versionId, label) {
  const { error } = await supabase
    .from(TABLE)
    .update({ label })
    .eq('id', versionId);
  return { error: error?.message ?? null };
}
