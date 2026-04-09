// ─── src/theme/ThemeContext.jsx ───────────────────────────────────────────────
// Single source of truth for dark/light mode across the entire app.
// Persists user preference in localStorage so it survives navigation + refresh.

import { createContext, useContext, useState, useMemo, useCallback } from "react";
import { getDarkPalette, getLightPalette, getDefaultMode, setUserMode } from "./tokens";

const ThemeCtx = createContext(null);

export { ThemeCtx };

export function ThemeProvider({ children }) {
  const [darkMode, setDarkMode] = useState(() => getDefaultMode() === "dark");

  const toggleDark = useCallback(() => {
    setDarkMode((prev) => {
      const next = !prev;
      setUserMode(next ? "dark" : "light");
      return next;
    });
  }, []);

  // Spread palette into context so `const C = useTheme()` still works
  // C.gold, C.white etc. plus C.darkMode, C.toggleDark, C.setDarkMode
  const value = useMemo(() => {
    const palette = darkMode ? getDarkPalette() : getLightPalette();
    return { ...palette, darkMode, setDarkMode, toggleDark };
  }, [darkMode, toggleDark]);

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

/** Drop-in hook — returns palette + { darkMode, setDarkMode, toggleDark } */
export const useTheme = () => useContext(ThemeCtx) || {};
