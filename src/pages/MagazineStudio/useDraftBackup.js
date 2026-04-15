// ─────────────────────────────────────────────────────────────────────────────
// useDraftBackup — Phase 3.1 local crash recovery for Magazine Studio articles
//
// What this does:
//   - Continuously writes a JSON snapshot of the current editor formData into
//     IndexedDB (debounced) while the article is dirty
//   - Flushes immediately on tab hide / beforeunload / pagehide so nothing
//     is lost to a hard close or crash
//   - Exposes peek/clear helpers so ArticleEditor can detect a backup on mount
//     and present an EXPLICIT Restore / Discard choice to the user
//
// What this deliberately does NOT do:
//   - Never auto-restores silently. The user must choose.
//   - Never touches the database. This is a client-only safety net.
//   - Never overrides a saved article that is newer than the backup.
//
// Key scheme:
//   - Existing articles:  'article:<id>'
//   - Brand-new drafts:   'new:<sessionStorage-pinned-uuid>'
//     The UUID is pinned in sessionStorage under NEW_DRAFT_SESSION_KEY so a
//     tab refresh on an unsaved new article still finds its own backup. Once
//     the article receives a real id from the server, the caller graduates
//     the backup to the article-keyed slot and clears the session temp key.
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef } from 'react';

const DB_NAME    = 'lwd-magazine-drafts';
const DB_VERSION = 1;
const STORE_NAME = 'drafts';
const NEW_DRAFT_SESSION_KEY = 'lwd-magazine-new-draft-id';

// ── Internal IndexedDB helpers ──────────────────────────────────────────────

let dbPromise = null;

function openDB() {
  if (typeof indexedDB === 'undefined') {
    return Promise.reject(new Error('IndexedDB not available'));
  }
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'draftKey' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error || new Error('IndexedDB open failed'));
  });
  // If the open itself fails, don't cache a rejected promise forever.
  dbPromise.catch(() => { dbPromise = null; });
  return dbPromise;
}

function runTx(mode, fn) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, mode);
    const store = tx.objectStore(STORE_NAME);
    let result;
    try {
      result = fn(store);
    } catch (err) {
      reject(err);
      return;
    }
    tx.oncomplete = () => resolve(result && result.result !== undefined ? result.result : result);
    tx.onerror    = () => reject(tx.error || new Error('IndexedDB transaction failed'));
    tx.onabort    = () => reject(tx.error || new Error('IndexedDB transaction aborted'));
  }));
}

// ── Public API ──────────────────────────────────────────────────────────────

/**
 * Persist a formData snapshot under draftKey. Safe to call frequently; the
 * hook below debounces. Swallows errors (best-effort safety net — we never
 * want a backup failure to crash the editor).
 */
export async function writeDraftBackup(draftKey, formData) {
  if (!draftKey || !formData) return;
  let snapshot;
  try {
    // structuredClone if available → cheap deep clone without JSON round-trip;
    // fall back to JSON for older runtimes. Either way we isolate the editor
    // state from IndexedDB's own structured-clone pass.
    snapshot = typeof structuredClone === 'function'
      ? structuredClone(formData)
      : JSON.parse(JSON.stringify(formData));
  } catch {
    try { snapshot = JSON.parse(JSON.stringify(formData)); } catch { return; }
  }
  const record = {
    draftKey,
    timestamp: Date.now(),
    formData: snapshot,
  };
  try {
    await runTx('readwrite', store => store.put(record));
  } catch (err) {
    // Non-fatal — this is a safety net, not the source of truth.
    console.warn('[useDraftBackup] write failed:', err);
  }
}

/**
 * Read the backup for draftKey, or null if none / on error.
 * Never throws — caller treats "no backup" and "read failed" identically.
 */
export async function peekDraftBackup(draftKey) {
  if (!draftKey) return null;
  try {
    const record = await runTx('readonly', store => {
      const req = store.get(draftKey);
      return new Promise((resolve, reject) => {
        req.onsuccess = () => resolve(req.result || null);
        req.onerror   = () => reject(req.error);
      });
    });
    return record || null;
  } catch (err) {
    console.warn('[useDraftBackup] peek failed:', err);
    return null;
  }
}

/**
 * Remove the backup for draftKey. Called after a confirmed successful save
 * and after the user explicitly discards a recovered draft.
 */
export async function clearDraftBackup(draftKey) {
  if (!draftKey) return;
  try {
    await runTx('readwrite', store => store.delete(draftKey));
  } catch (err) {
    console.warn('[useDraftBackup] clear failed:', err);
  }
}

/**
 * Compute a stable draft key for an article. Existing articles are keyed by
 * id. Brand-new drafts (no real id yet) are keyed by a UUID pinned in
 * sessionStorage so a refresh on the same unsaved tab still finds its backup.
 */
export function resolveDraftKey(articleId) {
  if (articleId && !String(articleId).startsWith('new')) {
    return `article:${articleId}`;
  }
  // New-draft path: reuse one UUID for the whole browser session so a refresh
  // before the first successful save still recovers the in-progress work.
  if (typeof sessionStorage === 'undefined') {
    return `new:ephemeral-${Date.now()}`;
  }
  let sessionId = sessionStorage.getItem(NEW_DRAFT_SESSION_KEY);
  if (!sessionId) {
    sessionId = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    sessionStorage.setItem(NEW_DRAFT_SESSION_KEY, sessionId);
  }
  return `new:${sessionId}`;
}

/**
 * Called once the new article receives a real server id. Lets the next new
 * draft start with a clean session temp key instead of inheriting the one
 * that was just graduated.
 */
export function clearNewDraftSessionKey() {
  if (typeof sessionStorage === 'undefined') return;
  try { sessionStorage.removeItem(NEW_DRAFT_SESSION_KEY); } catch { /* ignore */ }
}

// ── Hook ────────────────────────────────────────────────────────────────────

/**
 * useDraftBackup — subscribe a dirty formData to IndexedDB backup.
 *
 * Writes are debounced (default 500ms) so rapid typing doesn't spam the store.
 * Additionally flushes immediately when the tab becomes hidden, is closing,
 * or is being frozen — so a crash or hard close never loses more than the
 * last keystroke.
 *
 * Does nothing while `dirty` is false: a pristine article already matches the
 * server, so there's nothing worth preserving.
 */
export function useDraftBackup({ draftKey, formData, dirty, debounceMs = 500 }) {
  // Keep the latest values in refs so the flush listeners (which mount once)
  // always see current state without being re-bound on every keystroke.
  const draftKeyRef = useRef(draftKey);
  const formDataRef = useRef(formData);
  const dirtyRef    = useRef(dirty);
  useEffect(() => { draftKeyRef.current = draftKey; }, [draftKey]);
  useEffect(() => { formDataRef.current = formData; }, [formData]);
  useEffect(() => { dirtyRef.current    = dirty;    }, [dirty]);

  // Debounced write while dirty.
  useEffect(() => {
    if (!draftKey) return;
    if (!dirty)    return;
    const handle = setTimeout(() => {
      writeDraftBackup(draftKey, formDataRef.current);
    }, debounceMs);
    return () => clearTimeout(handle);
    // Intentionally depends on formData to re-arm on every change, not just
    // on dirty toggle.
  }, [draftKey, formData, dirty, debounceMs]);

  // Flush listeners. Synchronous best-effort on hide/unload — IndexedDB is
  // async, but the put is queued before the page actually tears down.
  useEffect(() => {
    const flushNow = () => {
      if (!dirtyRef.current)   return;
      if (!draftKeyRef.current) return;
      writeDraftBackup(draftKeyRef.current, formDataRef.current);
    };
    const onVisibility = () => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        flushNow();
      }
    };
    window.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flushNow);
    window.addEventListener('beforeunload', flushNow);
    return () => {
      window.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flushNow);
      window.removeEventListener('beforeunload', flushNow);
    };
  }, []);
}
