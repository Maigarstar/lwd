// ─── useStudioCollaboration.js ───────────────────────────────────────────────
// Real-time multi-user collaboration for the Publication Studio.
// Uses Supabase Realtime (broadcast + presence) — no extra infrastructure.
//
// Features:
//   • Presence — who's online, which page they're editing
//   • Live cursors — other users' mouse positions on the canvas
//   • Page sync — when a collaborator saves a page you're not editing, it updates
//   • Conflict flag — when a collaborator saves the page you ARE editing
//
// Strategy: Last-write-wins per page. No CRDT — simple and reliable for a
// single-brand publishing tool where true simultaneous editing is rare.
//
// Usage:
//   const { collaborators, selfId, broadcastCursor, broadcastPageUpdate,
//           collaboratorsOnPage, collabConflict, clearConflict }
//     = useStudioCollaboration({ issueId, currentPageIndex, onRemotePageUpdate });
// ─────────────────────────────────────────────────────────────────────────────

import { useEffect, useRef, useCallback, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

// ── Deterministic colour per user ─────────────────────────────────────────────
const COLLAB_COLORS = [
  '#C9A96E', // gold
  '#34d399', // emerald
  '#60a5fa', // blue
  '#f87171', // red
  '#a78bfa', // violet
  '#fb923c', // orange
  '#38bdf8', // sky
  '#f472b6', // pink
];

function hashColor(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = ((h << 5) + h) ^ str.charCodeAt(i);
  return COLLAB_COLORS[Math.abs(h) % COLLAB_COLORS.length];
}

function initials(name) {
  if (!name) return '?';
  return name.split(/\s+/).map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useStudioCollaboration({
  issueId,
  currentPageIndex,
  onRemotePageUpdate, // (pageIndex, canvasJSON, thumbnailDataUrl) => void
  enabled = true,
}) {
  const [selfId, setSelfId]             = useState(null);
  const [collaborators, setCollaborators] = useState([]); // other users
  const [collabConflict, setCollabConflict] = useState(null); // { pageIndex, fromName }

  const channelRef        = useRef(null);
  const cursorThrottle    = useRef(0);
  const currentPageRef    = useRef(currentPageIndex);
  const selfIdRef         = useRef(null);

  // Keep currentPageRef in sync for closures inside channel callbacks
  useEffect(() => { currentPageRef.current = currentPageIndex; }, [currentPageIndex]);

  // ── 1. Resolve self identity ─────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !issueId) return;
    supabase.auth.getUser().then(({ data }) => {
      const user = data?.user;
      const id   = user?.id || `anon-${Math.random().toString(36).slice(2, 10)}`;
      const name = user?.user_metadata?.full_name
        || user?.email?.split('@')[0]
        || `Editor`;
      const color = hashColor(id);
      const self  = { id, name, color, initials: initials(name) };
      setSelfId(self);
      selfIdRef.current = self;
    });
  }, [enabled, issueId]);

  // ── 2. Subscribe to channel ──────────────────────────────────────────────────
  useEffect(() => {
    if (!enabled || !issueId || !selfId) return;

    const channel = supabase.channel(`pub-studio:${issueId}`, {
      config: { presence: { key: selfId.id } },
    });

    // ── Presence sync: rebuild collaborators list ──────────────────────────
    const syncPresence = () => {
      const state = channel.presenceState();
      const others = Object.values(state)
        .flat()
        .filter(p => p.userId !== selfId.id)
        .map(p => ({
          userId:    p.userId,
          name:      p.name,
          color:     p.color,
          initials:  initials(p.name),
          pageIndex: p.pageIndex ?? 0,
          cursor:    null, // populated by cursor broadcasts
        }));
      setCollaborators(others);
    };

    channel.on('presence', { event: 'sync' }, syncPresence);
    channel.on('presence', { event: 'join' }, syncPresence);
    channel.on('presence', { event: 'leave' }, syncPresence);

    // ── Cursor broadcast ────────────────────────────────────────────────────
    channel.on('broadcast', { event: 'cursor' }, ({ payload }) => {
      if (payload.userId === selfId.id) return;
      setCollaborators(prev => prev.map(c =>
        c.userId === payload.userId
          ? { ...c, cursor: { x: payload.x, y: payload.y }, pageIndex: payload.pageIndex }
          : c
      ));
    });

    // ── Remote page update ──────────────────────────────────────────────────
    channel.on('broadcast', { event: 'page_update' }, ({ payload }) => {
      if (payload.userId === selfId.id) return;
      const isMyPage = payload.pageIndex === currentPageRef.current;
      if (isMyPage) {
        // Don't silently overwrite — warn the user, but store the remote version
        // so they can choose to apply it
        setCollabConflict({
          pageIndex:        payload.pageIndex,
          fromName:         payload.name,
          canvasJSON:       payload.canvasJSON,
          thumbnailDataUrl: payload.thumbnailDataUrl ?? null,
        });
      } else {
        onRemotePageUpdate?.(payload.pageIndex, payload.canvasJSON, payload.thumbnailDataUrl);
      }
    });

    // ── Subscribe + track presence ──────────────────────────────────────────
    channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await channel.track({
          userId:    selfId.id,
          name:      selfId.name,
          color:     selfId.color,
          pageIndex: currentPageRef.current,
        });
      }
    });

    channelRef.current = channel;

    return () => {
      channel.untrack();
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [enabled, issueId, selfId]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── 3. Re-track when page changes ─────────────────────────────────────────
  useEffect(() => {
    if (!channelRef.current || !selfId) return;
    channelRef.current.track({
      userId:    selfId.id,
      name:      selfId.name,
      color:     selfId.color,
      pageIndex: currentPageIndex,
    }).catch(() => {}); // noop — channel may not be ready yet
  }, [currentPageIndex, selfId]);

  // ── 4. Broadcast cursor ───────────────────────────────────────────────────
  const broadcastCursor = useCallback((x, y) => {
    if (!channelRef.current || !selfIdRef.current) return;
    const now = Date.now();
    if (now - cursorThrottle.current < 80) return; // ~12 fps
    cursorThrottle.current = now;
    channelRef.current.send({
      type: 'broadcast', event: 'cursor',
      payload: {
        userId:    selfIdRef.current.id,
        x, y,
        pageIndex: currentPageRef.current,
      },
    }).catch(() => {});
  }, []);

  // ── 5. Broadcast page update ──────────────────────────────────────────────
  const broadcastPageUpdate = useCallback((pageIndex, canvasJSON, thumbnailDataUrl) => {
    if (!channelRef.current || !selfIdRef.current) return;
    channelRef.current.send({
      type: 'broadcast', event: 'page_update',
      payload: {
        userId:          selfIdRef.current.id,
        name:            selfIdRef.current.name,
        pageIndex,
        canvasJSON,
        thumbnailDataUrl,
      },
    }).catch(() => {});
  }, []);

  const clearConflict = useCallback(() => setCollabConflict(null), []);

  return {
    selfId,
    collaborators,
    collaboratorsOnPage: collaborators.filter(c => c.pageIndex === currentPageIndex),
    collabConflict,
    clearConflict,
    broadcastCursor,
    broadcastPageUpdate,
  };
}
