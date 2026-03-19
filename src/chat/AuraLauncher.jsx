// ─── src/chat/AuraLauncher.jsx ────────────────────────────────────────────────
// Collapsed icon at top of page → expands into full pill on scroll,
// matching the Claude mobile FAB expansion pattern.
import { useState, useEffect } from "react";
import { useChat } from "./ChatContext";

const SCROLL_THRESHOLD = 180; // px before the label slides in

export default function AuraLauncher() {
  const { openMiniBar, messages } = useChat();
  const [hov,            setHov]          = useState(false);
  const [expanded,       setExpanded]     = useState(false);
  const [compareBarUp,   setCompareBarUp] = useState(false);

  const auraCount = messages.filter((m) => m.from === "aura").length;

  // Expand label once the user has scrolled past the hero
  useEffect(() => {
    const onScroll = () => setExpanded(window.scrollY > SCROLL_THRESHOLD);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Shift up when the compare bar is visible on venue profiles
  useEffect(() => {
    const handler = (e) => setCompareBarUp(!!e.detail?.active);
    window.addEventListener("lwd:compare-bar", handler);
    return () => window.removeEventListener("lwd:compare-bar", handler);
  }, []);

  return (
    <button
      onClick={openMiniBar}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label="Open Aura chat assistant"
      style={{
        position:       "fixed",
        bottom:         compareBarUp ? 92 : 28,
        right:          28,
        zIndex:         900,
        transition:     "bottom 0.3s cubic-bezier(0.25,0.46,0.45,0.94), background 0.2s ease, transform 0.2s ease, padding 0.5s cubic-bezier(0.25,0.46,0.45,0.94), gap 0.5s cubic-bezier(0.25,0.46,0.45,0.94), box-shadow 0.2s ease",
        display:        "flex",
        alignItems:     "center",
        gap:            expanded ? 10 : 0,
        // Collapsed: tight circle. Expanded: full pill.
        padding:        expanded ? "12px 22px 12px 16px" : "12px 16px",
        borderRadius:   100,
        background:     hov ? "#b8922a" : "#C9A84C",
        border:         "none",
        cursor:         "pointer",
        boxShadow:      "0 6px 28px rgba(201,168,76,0.4)",
        // Smooth glide — bottom handled in style above (includes compare-bar shift)
        transform:      hov ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Avatar / icon */}
      <span
        style={{
          width:          30,
          height:         30,
          borderRadius:   "50%",
          background:     "rgba(255,255,255,0.18)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          fontSize:       14,
          flexShrink:     0,
          color:          "#0f0d0a",
        }}
      >
        ✦
      </span>

      {/* Label — slides in on scroll using max-width + opacity */}
      <span
        aria-hidden={!expanded}
        style={{
          fontFamily:    "var(--font-body)",
          fontWeight:    600,
          fontSize:      13,
          color:         "#0f0d0a",
          letterSpacing: "0.4px",
          whiteSpace:    "nowrap",
          overflow:      "hidden",
          // Smooth glide in/out — label trails slightly behind the pill expanding
          maxWidth:      expanded ? 160 : 0,
          opacity:       expanded ? 1   : 0,
          transition:    "max-width 0.5s cubic-bezier(0.25,0.46,0.45,0.94), opacity 0.35s ease",
        }}
      >
        Chat with Aura?
      </span>

      {/* Notification dot */}
      {auraCount > 0 && (
        <span
          aria-hidden="true"
          style={{
            position:     "absolute",
            top:          -4,
            right:        -4,
            width:        14,
            height:       14,
            borderRadius: "50%",
            background:   "#fff",
            border:       "2px solid #C9A84C",
          }}
        />
      )}
    </button>
  );
}
