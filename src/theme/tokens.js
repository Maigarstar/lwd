// ─── src/theme/tokens.js ─────────────────────────────────────────────────────

/** Compact (scrolled) nav height in px, sticky filter bar sits at this offset */
export const NAV_H = 56;

export const DARK_C = {
  black:   "#080808",
  dark:    "#0f0f0f",
  card:    "#141414",
  border:  "#1e1e1e",
  border2: "#2a2a2a",
  gold:    "#C9A84C",
  gold2:   "#e8c97a",
  goldDim: "rgba(201,168,76,0.15)",
  white:   "#ffffff",
  off:     "#f5f0e8",
  grey:    "#888888",
  grey2:   "#555555",
  green:   "#22c55e",
  blue:    "#60a5fa",
  rose:    "#f43f5e",
};

export const LIGHT_C = {
  black:   "#fbf7f4",
  dark:    "#f3ede6",
  card:    "#ffffff",
  border:  "#ddd4c8",
  border2: "#c5bbb0",
  gold:    "#7a5f10",
  gold2:   "#9a7a0a",
  goldDim: "rgba(122,95,16,0.14)",
  white:   "#0a0a0a",
  off:     "#111111",
  grey:    "#2a2a2a",
  grey2:   "#505050",
  green:   "#15803d",
  blue:    "#1d4ed8",
  rose:    "#be123c",
};

// ── Bridge: resolve saved theme overrides from localStorage ─────────────────
// These return the LIVE palette (defaults merged with any admin customisations).
// Pages should use these instead of raw DARK_C / LIGHT_C for rendering.
function _loadOverrides() {
  try { return JSON.parse(localStorage.getItem("lwd_theme_overrides")) ?? null; } catch { return null; }
}

/** Dark palette with any admin customisations applied */
export function getDarkPalette() {
  const saved = _loadOverrides();
  return saved?.dark ? { ...DARK_C, ...saved.dark } : DARK_C;
}

/** Light palette with any admin customisations applied */
export function getLightPalette() {
  const saved = _loadOverrides();
  return saved?.light ? { ...LIGHT_C, ...saved.light } : LIGHT_C;
}

/** Saved default mode: "dark" | "light", respects lightOnly lock */
export function getDefaultMode() {
  const saved = _loadOverrides();
  if (saved?.site?.lightOnly) return "light";
  return saved?.site?.defaultMode || "light";
}

/** Returns true if the site is locked to light mode only */
export function isLightOnly() {
  const saved = _loadOverrides();
  return saved?.site?.lightOnly || false;
}
