import { useState, useEffect, createContext, useContext } from "react";

// ─── RESPONSIVE HOOK ─────────────────────────────────────────────────────────
export function useIsMobile(bp = 768) {
  const [mobile, setMobile] = useState(() => window.innerWidth <= bp);
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${bp}px)`);
    const fn = (e) => setMobile(e.matches);
    mql.addEventListener("change", fn);
    return () => mql.removeEventListener("change", fn);
  }, [bp]);
  return mobile;
}

// ─── COLOR PALETTES ──────────────────────────────────────────────────────────
export const LIGHT = {
  bg:         "#ffffff",
  bgAlt:      "#f7f7f5",
  surface:    "#ffffff",
  border:     "#ebebeb",
  border2:    "#d8d8d8",
  gold:       "#9d873e",
  goldLight:  "rgba(157,135,62,0.07)",
  goldBorder: "rgba(157,135,62,0.2)",
  green:      "#748172",
  greenLight: "rgba(116,129,114,0.07)",
  text:       "#1a1a18",
  textMid:    "#4a4844",
  textLight:  "#6b6560",
  textMuted:  "#9c9690",
  navBg:      "rgba(255,255,255,0.96)",
  shadow:     "0 2px 16px rgba(0,0,0,0.05)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.08)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.1)",
};

export const DARK = {
  bg:         "#0f0f0d",
  bgAlt:      "#141412",
  surface:    "#1a1a18",
  border:     "#2e2e2a",
  border2:    "#3c3c38",
  gold:       "#b8a05a",
  goldLight:  "rgba(184,160,90,0.1)",
  goldBorder: "rgba(184,160,90,0.25)",
  green:      "#8fa08c",
  greenLight: "rgba(143,160,140,0.1)",
  text:       "#f5f2ec",
  textMid:    "#c8c4bc",
  textLight:  "#9c9890",
  textMuted:  "#6b6860",
  navBg:      "rgba(15,15,13,0.94)",
  shadow:     "0 2px 16px rgba(0,0,0,0.4)",
  shadowMd:   "0 8px 40px rgba(0,0,0,0.5)",
  shadowLg:   "0 24px 64px rgba(0,0,0,0.6)",
};

// ─── THEME CONTEXT ───────────────────────────────────────────────────────────
export const ThemeCtx = createContext(LIGHT);
export const useTheme = () => useContext(ThemeCtx);

// ─── FONT STACKS ─────────────────────────────────────────────────────────────
export const FD = "var(--font-heading-primary)"; // display
export const FB = "var(--font-body)";            // body

// ─── ICON MAP ────────────────────────────────────────────────────────────────
export const ICON_PATHS = Object.freeze({
  pin:    "M12 2a7 7 0 00-7 7c0 5.25 7 13 7 13s7-7.75 7-13a7 7 0 00-7-7zM12 12a3 3 0 110-6 3 3 0 010 6z",
  phone:  "M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6A19.79 19.79 0 012.12 4.18 2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z",
  zap:    "M13 2L3 14h9l-1 8 10-12h-9l1-8z",
});

// ─── ICON COMPONENT ──────────────────────────────────────────────────────────
export function Icon({ name, size = 18, color, style: extraStyle }) {
  const C = useTheme();
  const d = ICON_PATHS[name];
  if (!d) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color || C.textMid}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: "inline-block", verticalAlign: "middle", ...extraStyle }}
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

// ─── STARS COMPONENT ─────────────────────────────────────────────────────────
export function Stars({ rating, size = 13 }) {
  const C = useTheme();
  return (
    <span style={{ display: "inline-flex", gap: 1 }}>
      {[1,2,3,4,5].map(i => (
        <span key={i} style={{ fontSize: size, color: i <= Math.floor(rating) ? C.gold : i - 0.5 <= rating ? C.gold : C.border2 }}>★</span>
      ))}
    </span>
  );
}

// ─── SECTION HEADING ─────────────────────────────────────────────────────────
export function SectionHeading({ title, subtitle }) {
  const C = useTheme();
  return (
    <div style={{ marginBottom: 36 }}>
      <h2 style={{ fontFamily: FD, fontSize: 32, fontWeight: 400, color: C.text, letterSpacing: "-0.3px", lineHeight: 1.15, marginBottom: 10 }}>{title}</h2>
      <div style={{ width: 48, height: 2, backgroundImage: `linear-gradient(90deg, ${C.gold}, ${C.green})` }} />
      {subtitle && <p style={{ fontFamily: FB, fontSize: 15, color: C.textLight, marginTop: 12, lineHeight: 1.6 }}>{subtitle}</p>}
    </div>
  );
}

// ─── GLOBAL STYLES ───────────────────────────────────────────────────────────
export function GlobalStyles() {
  return (
    <style>{`
      *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
      html { scroll-behavior: smooth; }
      body { font-family: ${FB}; -webkit-font-smoothing: antialiased; }
      ::-webkit-scrollbar { width: 6px; }
      ::-webkit-scrollbar-track { background: transparent; }
      ::-webkit-scrollbar-thumb { background: rgba(157,135,62,0.3); border-radius: 3px; }
      @keyframes fadeUp      { from { opacity:0; transform:translateY(20px); } to { opacity:1; transform:translateY(0); } }
      @keyframes fadeIn      { from { opacity:0; } to { opacity:1; } }
      @keyframes shimmer     { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
      @keyframes slideUp     { from { transform:translateY(100%); opacity:0; } to { transform:translateY(0); opacity:1; } }
      @keyframes kenBurns    { 0%{transform:scale(1)} 100%{transform:scale(1.06)} }
      @keyframes chatModalIn { from { opacity:0; transform:translate(-50%,-50%) scale(0.93); } to { opacity:1; transform:translate(-50%,-50%) scale(1); } }
      @keyframes dotPulse    { 0%,80%,100% { transform:scale(0); opacity:0.4; } 40% { transform:scale(1); opacity:1; } }
      .lwd-thumb-strip::-webkit-scrollbar { display:none; }
      .lwd-img-zoom { transition: transform 0.7s ease; }
      .lwd-img-zoom:hover { transform: scale(1.04); }
      *:hover > .lwd-tag-overlay { opacity: 1 !important; }
      .lwd-fade-up { animation: fadeUp 0.6s ease both; }
      @media (max-width: 900px) { .lwd-sidebar { display: none !important; } .lwd-mobile-bar { display: flex !important; } }
      @media (min-width: 901px) { .lwd-mobile-bar { display: none !important; } }
    `}</style>
  );
}
