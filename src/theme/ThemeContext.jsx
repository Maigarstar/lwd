// ─── src/theme/ThemeContext.jsx ───────────────────────────────────────────────
import { createContext, useContext } from "react";
import { LIGHT_C } from "./tokens";

export const ThemeCtx = createContext(LIGHT_C);

/** Drop-in hook — returns current colour palette */
export const useTheme = () => useContext(ThemeCtx);
