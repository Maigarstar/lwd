// ─── src/shortlist/ShortlistContext.jsx ───────────────────────────────────────
import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from "react";

// ── Helpers ──────────────────────────────────────────────────────────────────
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch { return fallback; }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}
function getSessionId() {
  let id = sessionStorage.getItem("lwd_session_id");
  if (!id) {
    id = `s_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    sessionStorage.setItem("lwd_session_id", id);
  }
  return id;
}

// ── Context ──────────────────────────────────────────────────────────────────
const ShortlistCtx = createContext(null);

export function useShortlist() {
  const ctx = useContext(ShortlistCtx);
  if (!ctx) throw new Error("useShortlist must be inside ShortlistProvider");
  return ctx;
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function ShortlistProvider({ children }) {
  const sessionId = useRef(getSessionId());
  const [items,  setItems]  = useState(() => load("lwd_shortlist",        []));
  const [events, setEvents] = useState(() => load("lwd_shortlist_events", []));

  // Persist
  useEffect(() => { save("lwd_shortlist",        items);  }, [items]);
  useEffect(() => { save("lwd_shortlist_events", events); }, [events]);

  const emitEvent = useCallback((type, itemId, itemType) => {
    const ev = {
      type, itemId, itemType,
      sessionId: sessionId.current,
      timestamp: Date.now(),
    };
    setEvents((prev) => [...prev.slice(-199), ev]); // keep last 200
  }, []);

  const isShortlisted = useCallback((id) => items.some((x) => x.id === id), [items]);

  const addItem = useCallback((item) => {
    if (!item?.id) return;
    setItems((prev) => prev.some((x) => x.id === item.id) ? prev : [...prev, item]);
    emitEvent("shortlist_add", item.id, item.type ?? "venue");
  }, [emitEvent]);

  const removeItem = useCallback((id) => {
    setItems((prev) => {
      const found = prev.find((x) => x.id === id);
      if (!found) return prev;
      emitEvent("shortlist_remove", id, found.type ?? "venue");
      return prev.filter((x) => x.id !== id);
    });
  }, [emitEvent]);

  const toggleItem = useCallback((item) => {
    if (!item?.id) return;
    isShortlisted(item.id) ? removeItem(item.id) : addItem(item);
  }, [isShortlisted, addItem, removeItem]);

  const clearShortlist = useCallback(() => setItems([]), []);

  return (
    <ShortlistCtx.Provider
      value={{ items, events, isShortlisted, addItem, removeItem, toggleItem, clearShortlist }}
    >
      {children}
    </ShortlistCtx.Provider>
  );
}
