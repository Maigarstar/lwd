// ─── publicationVersionService.js ────────────────────────────────────────────
// WordPress-style revision history for the Publication Studio.
//
// Every save (manual or auto) calls createVersion() which snapshots the full
// pages array into `publication_versions`. Users can list all versions and
// restore any of them.
//
// Retention: 50 versions per issue (oldest pruned automatically on write).
// ─────────────────────────────────────────────────────────────────────────────

import { supabase } from '../lib/supabaseClient';

const TABLE        = 'publication_versions';
const MAX_VERSIONS = 50;

// Simple UUID v4 check — prevents sending malformed ids to the DB
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function isUUID(v) { return typeof v === 'string' && UUID_RE.test(v); }

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
  // Bug #7: validate issueId is a proper UUID before hitting the DB
  if (!isUUID(issueId)) {
    console.warn('[versions] Invalid issueId — skipping snapshot:', issueId);
    return { version: null, error: 'Invalid issueId' };
  }
  if (!pages?.length) return { version: null, error: 'No pages to snapshot' };

  // Bug #14: ensure canvasJSON is a plain object, not a Fabric canvas instance
  const snapshot = pages.map((p, i) => {
    let cj = p.canvasJSON ?? null;
    if (cj && typeof cj.toJSON === 'function') {
      // Fabric Canvas accidentally passed in — serialize it now
      cj = cj.toJSON(['id', 'name', 'custom', 'customType', 'isImagePlaceholder',
                      'isPlaceholderMarker', '_role', 'ctaUrl', 'ctaStyle']);
    }
    return {
      page_number: p.page_number ?? i + 1,
      canvasJSON:  cj,
      slot:        p.slot ?? null,
    };
  });

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
  if (!isUUID(issueId)) return { versions: [], error: null };

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
  // Bug #18: find the actual version_number threshold, then delete below it
  // (avoids magic range number)
  const { data: oldest } = await supabase
    .from(TABLE)
    .select('version_number')
    .eq('issue_id', issueId)
    .order('version_number', { ascending: false })
    .range(MAX_VERSIONS - 1, MAX_VERSIONS - 1) // the last item we KEEP
    .single();

  if (!oldest) return; // fewer than MAX_VERSIONS exist — nothing to prune

  await supabase
    .from(TABLE)
    .delete()
    .eq('issue_id', issueId)
    .lt('version_number', oldest.version_number); // delete everything older
}

// ── Label update ──────────────────────────────────────────────────────────────

/**
 * Let the user rename a version (e.g. "Client approved" / "Before rebrand").
 * Returns { error } or { error: null } on success.
 */
export async function renameVersion(versionId, label) {
  if (!label?.trim()) return { error: 'Label cannot be empty' };
  const { error } = await supabase
    .from(TABLE)
    .update({ label: label.trim() })
    .eq('id', versionId);
  return { error: error?.message ?? null };
}
