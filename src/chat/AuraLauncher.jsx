// ─── src/chat/AuraLauncher.jsx ────────────────────────────────────────────────
// Desktop: full pill, expands after scroll
// Mobile: compact icon button, tap to open as bottom sheet
import { useState, useEffect } from "react";
import { useChat } from "./ChatContext";

const SCROLL_THRESHOLD = 180;

export default function AuraLauncher() {
  const { openMiniBar } = useChat();
  const [hov,            setHov]          = useState(false);
  const [expanded,       setExpanded]     = useState(false);
  const [compareBarUp,   setCompareBarUp] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Desktop: expand label on scroll
  useEffect(() => {
    const onScroll = () => setExpanded(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Compare bar lift
  useEffect(() => {
    const handler = (e) => setCompareBarUp(!!e.detail?.active);
    window.addEventListener("lwd:compare-bar", handler);
    return () => window.removeEventListener("lwd:compare-bar", handler);
  }, []);

  // Mobile: compact icon button (always visible, always small)
  if (isMobile) {
    return (
      <button
        onClick={openMiniBar}
        aria-label="Open Aura chat assistant"
        style={{
          position:       "fixed",
          bottom:         compareBarUp ? 100 : 24,
          right:          16,
          zIndex:         800,
          width:          44,
          height:         44,
          borderRadius:   "50%",
          background:     "#C9A84C",
          border:         "none",
          cursor:         "pointer",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       20,
          boxShadow:      "0 4px 16px rgba(201,168,76,0.35)",
          transition:     "bottom 0.3s cubic-bezier(0.25,0.46,0.45,0.94), transform 0.2s ease",
          transform:      "scale(1)",
          opacity:        1,
          pointerEvents:  "auto",
        }}
      >
        ✦
      </button>
    );
  }

  // Desktop: full pill, hidden above fold
  return (
    <button
      onClick={openMiniBar}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label="Open Aura chat assistant"
      style={{
        position:       "fixed",
        bottom:         compareBarUp ? 120 : 30,
        right:          28,
        zIndex:         900,
        transition:     "bottom 0.3s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.4s ease, background 0.2s ease, transform 0.2s ease, padding 0.5s cubic-bezier(0.25,0.46,0.45,0.94), gap 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s ease",
        display:        "flex",
        alignItems:     "center",
        gap:            10,
        padding:        "12px 22px",
        borderRadius:   100,
        background:     hov ? "#b8922a" : "#C9A84C",
        border:         "none",
        cursor:         "pointer",
        boxShadow:      "0 6px 28px rgba(201,168,76,0.4)",
        opacity:        expanded ? 1 : 0,
        pointerEvents:  expanded ? "auto" : "none",
        transform:      hov ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Label */}
      <span
        style={{
          fontFamily:    "var(--font-body)",
          fontWeight:    600,
          fontSize:      13,
          color:         "#0f0d0a",
          letterSpacing: "0.4px",
          whiteSpace:    "nowrap",
        }}
      >
        Chat with Aura?
      </span>
    </button>
  );
}
