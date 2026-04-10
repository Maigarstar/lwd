// src/components/maps/ViewStateManager.js
// Persists { viewMode, mapOn } to localStorage so user preference survives
// page navigation, filter changes, and browser reload.
// Read before initial render — no layout flash.

const KEY = "lwd_map_pref";

const DEFAULTS = { viewMode: "grid", mapOn: false };

export function getInitialViewState() {
  try {
    const raw = typeof localStorage !== "undefined" && localStorage.getItem(KEY);
    if (raw) {
      const s = JSON.parse(raw);
      return {
        viewMode: s.viewMode === "list" ? "list" : "grid",
        mapOn: s.mapOn === true,
      };
    }
  } catch {}
  return { ...DEFAULTS };
}

export function saveViewState(viewMode, mapOn) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ viewMode, mapOn }));
  } catch {}
}
