// ─── src/shortlist/ShortlistContext.jsx ───────────────────────────────────────
import {
  createContext, useContext, useState, useCallback, useEffect, useRef,
} from "react";
import { getUserShortlist, addToShortlist, removeFromShortlist, subscribeToShortlist } from "../services/shortlistService";

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
function getDeviceId() {
  let id = localStorage.getItem("lwd_device_id");
  if (!id) {
    id = `d_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
    localStorage.setItem("lwd_device_id", id);
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
  const deviceId = useRef(getDeviceId());
  const unsubscribeRef = useRef(null);

  // Local state - keeps localStorage for offline/fallback
  const [items, setItems] = useState(() => load("lwd_shortlist", []));
  const [events, setEvents] = useState(() => load("lwd_shortlist_events", []));
  const [isLoading, setIsLoading] = useState(true);
  const [supabaseAvailable, setSupabaseAvailable] = useState(false);

  // Persist to localStorage
  useEffect(() => { save("lwd_shortlist", items); }, [items]);
  useEffect(() => { save("lwd_shortlist_events", events); }, [events]);

  // Load from Supabase on mount
  useEffect(() => {
    const loadFromSupabase = async () => {
      try {
        const { data, error } = await getUserShortlist(deviceId.current, false);
        if (!error && data && Array.isArray(data)) {
          setSupabaseAvailable(true);
          // Transform Supabase data to local format
          const transformed = data.map((row) => ({
            id: row.item_id,
            name: row.item_name,
            image: row.item_image,
            category: row.item_category,
            price: row.item_price,
            type: row.item_type || "vendor",
          }));
          setItems(transformed);
        } else {
          // Supabase not available, use localStorage
          setSupabaseAvailable(false);
        }
      } catch (err) {
        console.warn("Supabase shortlist load failed, using localStorage:", err);
        setSupabaseAvailable(false);
      } finally {
        setIsLoading(false);
      }
    };

    loadFromSupabase();
  }, []);

  // Subscribe to real-time updates from Supabase
  useEffect(() => {
    if (!supabaseAvailable) return;

    const unsubscribe = subscribeToShortlist(deviceId.current, false, (updatedList) => {
      if (Array.isArray(updatedList)) {
        const transformed = updatedList.map((row) => ({
          id: row.item_id,
          name: row.item_name,
          image: row.item_image,
          category: row.item_category,
          price: row.item_price,
          type: row.item_type || "vendor",
        }));
        setItems(transformed);
      }
    });

    unsubscribeRef.current = unsubscribe;

    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, [supabaseAvailable]);

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

    // Don't add if already there
    if (items.some((x) => x.id === item.id)) return;

    // Update local state immediately (optimistic)
    setItems((prev) => [...prev, item]);
    emitEvent("shortlist_add", item.id, item.type ?? "vendor");

    // Sync to Supabase if available
    if (supabaseAvailable) {
      addToShortlist(item.id, item, deviceId.current, false)
        .catch((err) => {
          console.error("Failed to save shortlist to Supabase:", err);
          // Keep local change even if Supabase fails
        });
    }
  }, [items, supabaseAvailable, emitEvent]);

  const removeItem = useCallback((id) => {
    const found = items.find((x) => x.id === id);
    if (!found) return;

    // Update local state immediately (optimistic)
    setItems((prev) => prev.filter((x) => x.id !== id));
    emitEvent("shortlist_remove", id, found.type ?? "venue");

    // Sync to Supabase if available
    if (supabaseAvailable) {
      removeFromShortlist(id, deviceId.current, false)
        .catch((err) => {
          console.error("Failed to remove from Supabase shortlist:", err);
          // Keep local change even if Supabase fails
        });
    }
  }, [items, supabaseAvailable, emitEvent]);

  const toggleItem = useCallback((item) => {
    if (!item?.id) return;
    isShortlisted(item.id) ? removeItem(item.id) : addItem(item);
  }, [isShortlisted, addItem, removeItem]);

  const clearShortlist = useCallback(() => setItems([]), []);

  return (
    <ShortlistCtx.Provider
      value={{
        items,
        events,
        isShortlisted,
        addItem,
        removeItem,
        toggleItem,
        clearShortlist,
        isLoading,
        supabaseAvailable,
        deviceId: deviceId.current,
      }}
    >
      {children}
    </ShortlistCtx.Provider>
  );
}
