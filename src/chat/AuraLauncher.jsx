// ─── src/chat/AuraLauncher.jsx ────────────────────────────────────────────────
import { useState } from "react";
import { useChat } from "./ChatContext";

export default function AuraLauncher() {
  const { openMiniBar, messages } = useChat();
  const [hov, setHov] = useState(false);
  const auraCount = messages.filter((m) => m.from === "aura").length;

  return (
    <button
      onClick={openMiniBar}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      aria-label="Open Aura chat assistant"
      style={{
        position:    "fixed",
        bottom:      28,
        right:       28,
        zIndex:      900,
        display:     "flex",
        alignItems:  "center",
        gap:         10,
        padding:     "12px 22px 12px 16px",
        borderRadius: 100,
        background:  hov ? "#b8922a" : "#C9A84C",
        border:      "none",
        cursor:      "pointer",
        boxShadow:   "0 6px 28px rgba(201,168,76,0.4)",
        transition:  "all 0.25s",
        transform:   hov ? "translateY(-2px)" : "translateY(0)",
      }}
    >
      {/* Avatar */}
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

      {/* Notification dot (visible once there is an Aura message) */}
      {auraCount > 0 && (
        <span
          aria-hidden="true"
          style={{
            position:    "absolute",
            top:         -4,
            right:       -4,
            width:       14,
            height:      14,
            borderRadius: "50%",
            background:  "#fff",
            border:      "2px solid #C9A84C",
          }}
        />
      )}
    </button>
  );
}
