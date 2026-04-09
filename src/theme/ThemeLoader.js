// ─── src/theme/ThemeLoader.js ──────────────────────────────────────────────────
// Bridge layer: reads the saved theme from localStorage (written by the admin
// Style Editor) and applies CSS custom properties to document.documentElement
// so that every page, public and admin, picks up customisations automatically.
//
// Called once at app boot (main.jsx), before any React render.
// ──────────────────────────────────────────────────────────────────────────────

import { DARK_C, LIGHT_C } from "./tokens";

// ── Default fonts (must mirror AdminDashboard defaults) ─────────────────────
const DEFAULT_FONTS = {
  heading: "Gilda Display",
  body: "Nunito",
  headingSize: 32,
  headingWeight: 400,
  bodySize: 15,
  bodyWeight: 400,
  googleUrl:
    "https://fonts.googleapis.com/css2?family=Gilda+Display&family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=Nunito:wght@300;400;600;700;800&display=swap",
};

const DEFAULT_SITE_SETTINGS = {
  defaultMode: "dark",
  adminDefaultMode: "light",
  lightOnly: false,
  borderRadiusCard: 6,
  borderRadiusImage: 6,
  borderRadiusInput: 4,
};

// ── Read saved theme from localStorage ──────────────────────────────────────
function _load() {
  try {
    return JSON.parse(localStorage.getItem("lwd_theme_overrides")) ?? null;
  } catch {
    return null;
  }
}

// ── Public API ──────────────────────────────────────────────────────────────

/** Returns "dark" | "light", respects lightOnly lock. */
export function getDefaultMode() {
  const saved = _load();
  if (saved?.site?.lightOnly) return "light";
  return saved?.site?.defaultMode || DEFAULT_SITE_SETTINGS.defaultMode;
}

/** Returns true if the site is locked to light mode only. */
export function isLightOnly() {
  const saved = _load();
  return saved?.site?.lightOnly || false;
}

/** Returns the saved custom fonts or defaults. */
export function getSavedFonts() {
  const saved = _load();
  return {
    heading: saved?.fonts?.heading || DEFAULT_FONTS.heading,
    body: saved?.fonts?.body || DEFAULT_FONTS.body,
    googleUrl: saved?.fonts?.googleUrl || DEFAULT_FONTS.googleUrl,
  };
}

/** Returns custom dark palette merged onto defaults, or null if no overrides. */
export function getSavedDarkPalette() {
  const saved = _load();
  if (!saved?.dark) return DARK_C;
  return { ...DARK_C, ...saved.dark };
}

/** Returns custom light palette merged onto defaults, or null if no overrides. */
export function getSavedLightPalette() {
  const saved = _load();
  if (!saved?.light) return LIGHT_C;
  return { ...LIGHT_C, ...saved.light };
}

/**
 * Applies CSS custom properties to document.documentElement.
 * Called once at boot. Sets:
 *   --font-heading-primary, --font-heading-secondary, --font-body, --font-ui
 *   --lwd-heading-size, --lwd-heading-weight, --lwd-body-size, --lwd-body-weight
 *   --lwd-radius-card, --lwd-radius-input
 *   --lwd-<token> for every colour token in both dark and light palettes
 *   data-lwd-mode, data-lwd-light-only attributes
 *
 * Also injects a <link> for Google Fonts if a custom URL is set.
 */
export function applyThemeToDocument() {
  const saved = _load();
  const root = document.documentElement;

  // ── Fonts ──────────────────────────────────────────────────────────────────
  const fonts = {
    heading: saved?.fonts?.heading || DEFAULT_FONTS.heading,
    body: saved?.fonts?.body || DEFAULT_FONTS.body,
    headingSize: saved?.fonts?.headingSize ?? DEFAULT_FONTS.headingSize,
    headingWeight: saved?.fonts?.headingWeight ?? DEFAULT_FONTS.headingWeight,
    bodySize: saved?.fonts?.bodySize ?? DEFAULT_FONTS.bodySize,
    bodyWeight: saved?.fonts?.bodyWeight ?? DEFAULT_FONTS.bodyWeight,
    googleUrl: saved?.fonts?.googleUrl || DEFAULT_FONTS.googleUrl,
  };

  root.style.setProperty(
    "--font-heading-primary",
    `'${fonts.heading}', 'Playfair Display', Georgia, serif`
  );
  root.style.setProperty(
    "--font-heading-secondary",
    "'Playfair Display', Georgia, serif"
  );
  root.style.setProperty("--font-body", `'${fonts.body}', sans-serif`);
  root.style.setProperty("--font-ui", `'${fonts.body}', sans-serif`);

  // Font size & weight
  root.style.setProperty("--lwd-heading-size", `${fonts.headingSize}px`);
  root.style.setProperty("--lwd-heading-weight", `${fonts.headingWeight}`);
  root.style.setProperty("--lwd-body-size", `${fonts.bodySize}px`);
  root.style.setProperty("--lwd-body-weight", `${fonts.bodyWeight}`);

  // ── Border radius ──────────────────────────────────────────────────────────
  const site = saved?.site || {};
  const radiusCard = site.borderRadiusCard ?? DEFAULT_SITE_SETTINGS.borderRadiusCard;
  const radiusImage = site.borderRadiusImage ?? DEFAULT_SITE_SETTINGS.borderRadiusImage;
  const radiusInput = site.borderRadiusInput ?? DEFAULT_SITE_SETTINGS.borderRadiusInput;
  root.style.setProperty("--lwd-radius-card", `${radiusCard}px`);
  root.style.setProperty("--lwd-radius-image", `${radiusImage}px`);
  root.style.setProperty("--lwd-radius-input", `${radiusInput}px`);

  // ── Inject Google Fonts <link> if not already present ──────────────────────
  const LINK_ID = "lwd-theme-gfonts";
  let link = document.getElementById(LINK_ID);
  if (!link) {
    link = document.createElement("link");
    link.id = LINK_ID;
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = fonts.googleUrl;

  // If custom heading font differs from default, load it explicitly
  if (fonts.heading !== DEFAULT_FONTS.heading) {
    const EXTRA_ID = "lwd-theme-gfonts-extra";
    let extra = document.getElementById(EXTRA_ID);
    if (!extra) {
      extra = document.createElement("link");
      extra.id = EXTRA_ID;
      extra.rel = "stylesheet";
      document.head.appendChild(extra);
    }
    extra.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.heading)}:wght@300;400;500;600;700&display=swap`;
  }

  // If custom body font differs from default, load it explicitly
  if (fonts.body !== DEFAULT_FONTS.body) {
    const BODY_ID = "lwd-theme-gfonts-body";
    let bodyLink = document.getElementById(BODY_ID);
    if (!bodyLink) {
      bodyLink = document.createElement("link");
      bodyLink.id = BODY_ID;
      bodyLink.rel = "stylesheet";
      document.head.appendChild(bodyLink);
    }
    bodyLink.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fonts.body)}:wght@300;400;500;600;700;800&display=swap`;
  }

  // ── Colour tokens as CSS variables ─────────────────────────────────────────
  const darkPalette = saved?.dark ? { ...DARK_C, ...saved.dark } : DARK_C;
  const lightPalette = saved?.light ? { ...LIGHT_C, ...saved.light } : LIGHT_C;

  for (const [key, val] of Object.entries(darkPalette)) {
    root.style.setProperty(`--lwd-dark-${key}`, val);
  }
  for (const [key, val] of Object.entries(lightPalette)) {
    root.style.setProperty(`--lwd-light-${key}`, val);
  }

  // ── Default mode + light-only lock ─────────────────────────────────────────
  const lightOnly = site.lightOnly || false;
  // Check for user theme preference first (either key), then fall back to admin setting
  const userTheme = typeof localStorage !== "undefined"
    ? (localStorage.getItem("lwd_user_dark_mode") || localStorage.getItem("lwd_user_theme"))
    : null;
  const mode = lightOnly ? "light" : (userTheme || site.defaultMode || DEFAULT_SITE_SETTINGS.defaultMode);
  root.setAttribute("data-lwd-mode", mode);
  if (lightOnly) root.setAttribute("data-lwd-light-only", "true");
  else root.removeAttribute("data-lwd-light-only");

  // ── Override CSS ───────────────────────────────────────────────────────────
  const overrideCss = saved?.css || "";
  const STYLE_ID = "lwd-theme-override-css";
  let styleEl = document.getElementById(STYLE_ID);
  if (overrideCss) {
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = overrideCss;
  } else if (styleEl) {
    styleEl.remove();
  }
}
