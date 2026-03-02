// ─── src/chat/ChatWidget.jsx ──────────────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { useChat } from "./ChatContext";

// ── Design tokens (widget is always dark regardless of page theme) ─────────────
const G = {
  gold:     "#C9A84C",
  gold2:    "#e8c97a",
  goldDim:  "rgba(201,168,76,0.12)",
  bg:       "#0f0f0f",
  bgHead:   "#0d0c0a",
  card:     "#141414",
  border:   "#1e1e1e",
  border2:  "#2a2a2a",
  white:    "#ffffff",
  grey:     "#888888",
  grey2:    "#555555",
  green:    "#22c55e",
};

// Keyframes injected once — keeps ChatWidget self-contained (no external CSS needed)
const KEYFRAMES = `
  @keyframes lwd-dot-pulse {
    0%,80%,100% { opacity:0.35; transform:scale(0.75); }
    40%         { opacity:1;    transform:scale(1);    }
  }
  @keyframes lwd-status-pulse {
    0%,100% { opacity:1; }
    50%     { opacity:0.45; }
  }
`;

// ── Helpers ───────────────────────────────────────────────────────────────────
function useIsMobile() {
  const [mobile, setMobile] = useState(() =>
    typeof window !== "undefined" ? window.innerWidth < 640 : false
  );
  useEffect(() => {
    const fn = () => setMobile(window.innerWidth < 640);
    window.addEventListener("resize", fn, { passive: true });
    return () => window.removeEventListener("resize", fn);
  }, []);
  return mobile;
}

function TypingDots() {
  return (
    <div
      style={{
        display:    "flex",
        gap:        5,
        padding:    "10px 14px",
        background: "rgba(201,168,76,0.06)",
        border:     `1px solid rgba(201,168,76,0.1)`,
        borderRadius: "2px 12px 12px 12px",
        width:      "fit-content",
      }}
      aria-label="Aura is typing"
      role="status"
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            width:             7,
            height:            7,
            borderRadius:      "50%",
            background:        G.gold,
            display:           "inline-block",
            animation:         "lwd-dot-pulse 1.4s ease-in-out infinite",
            animationDelay:    `${i * 0.18}s`,
          }}
        />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { messages, isOpen, isTyping, sendMessage, closeChat, toggleChat } =
    useChat();

  const [input,    setInput]    = useState("");
  const [mounted,  setMounted]  = useState(isOpen);  // controls DOM presence
  const [visible,  setVisible]  = useState(false);   // controls CSS transition
  const [hovClose, setHovClose] = useState(false);
  const [hovSend,  setHovSend]  = useState(false);
  const [hovPill,  setHovPill]  = useState(false);

  const isMobile  = useIsMobile();
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);
  const panelRef  = useRef(null);
  const exitTimer = useRef(null);

  // ── Panel mount / unmount with enter + exit animation ──────────────────────
  useEffect(() => {
    clearTimeout(exitTimer.current);
    if (isOpen) {
      setMounted(true);
      // Double rAF: let the browser paint the initial (invisible) state first
      const r1 = requestAnimationFrame(() => {
        const r2 = requestAnimationFrame(() => setVisible(true));
        return () => cancelAnimationFrame(r2);
      });
      return () => cancelAnimationFrame(r1);
    } else {
      setVisible(false);
      exitTimer.current = setTimeout(() => setMounted(false), 380);
      return () => clearTimeout(exitTimer.current);
    }
  }, [isOpen]);

  // ── Cleanup on unmount ─────────────────────────────────────────────────────
  useEffect(() => () => clearTimeout(exitTimer.current), []);

  // ── Scroll to bottom on new messages ──────────────────────────────────────
  useEffect(() => {
    if (isOpen) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  // ── Focus input when panel opens ──────────────────────────────────────────
  useEffect(() => {
    if (isOpen && mounted) {
      const t = setTimeout(() => inputRef.current?.focus(), 380);
      return () => clearTimeout(t);
    }
  }, [isOpen, mounted]);

  // ── ESC to close ──────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e) => { if (e.key === "Escape") closeChat(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [isOpen, closeChat]);

  // ── Focus trap ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen || !panelRef.current) return;

    const getFocusable = () =>
      Array.from(
        panelRef.current.querySelectorAll(
          'button:not([disabled]), input, textarea, [tabindex]:not([tabindex="-1"])'
        )
      );

    const trap = (e) => {
      if (e.key !== "Tab") return;
      const els   = getFocusable();
      const first = els[0];
      const last  = els[els.length - 1];
      if (!first) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", trap);
    return () => document.removeEventListener("keydown", trap);
  }, [isOpen, mounted]);

  // ── Send handler ──────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  }, [input, sendMessage]);

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const canSend = input.trim().length > 0;

  // ── Panel position / animation styles ─────────────────────────────────────
  const panelStyle = isMobile
    ? {
        // Bottom sheet
        position:   "fixed",
        left:       0,
        right:      0,
        bottom:     0,
        top:        "auto",
        height:     "80dvh",
        borderRadius: "14px 14px 0 0",
        transform:  visible ? "translateY(0)" : "translateY(100%)",
        opacity:    visible ? 1 : 0,
        transition: "transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease",
      }
    : {
        // Centered floating panel
        position:   "fixed",
        top:        "50%",
        left:       "50%",
        width:      440,
        maxWidth:   "calc(100vw - 48px)",
        height:     580,
        borderRadius: "var(--lwd-radius-card)",
        transform:  visible
          ? "translate(-50%,-50%) scale(1)"
          : "translate(-50%,-48%) scale(0.96)",
        opacity:    visible ? 1 : 0,
        transition: "transform 0.38s cubic-bezier(0.4,0,0.2,1), opacity 0.38s ease",
      };

  return (
    <>
      {/* ── Self-contained keyframes ── */}
      <style>{KEYFRAMES}</style>

      {/* ── Mobile backdrop ── */}
      {mounted && isMobile && (
        <div
          aria-hidden="true"
          onClick={closeChat}
          style={{
            position:   "fixed",
            inset:      0,
            zIndex:     1199,
            background: "rgba(0,0,0,0.55)",
            opacity:    visible ? 1 : 0,
            transition: "opacity 0.38s ease",
          }}
        />
      )}

      {/* ── Floating panel ── */}
      {mounted && (
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label="Aura wedding concierge"
          style={{
            ...panelStyle,
            zIndex:         1200,
            background:     G.bg,
            border:         `1px solid ${G.border}`,
            boxShadow:      "0 32px 96px rgba(0,0,0,0.65), 0 0 0 1px rgba(201,168,76,0.07)",
            display:        "flex",
            flexDirection:  "column",
            overflow:       "hidden",
          }}
        >
          {/* ── Header ── */}
          <div
            style={{
              padding:        "14px 18px",
              background:     `linear-gradient(135deg, ${G.bgHead}, #1a1710)`,
              borderBottom:   `1px solid ${G.border}`,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              flexShrink:     0,
            }}
          >
            {/* Identity */}
            <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
              {/* Avatar + live dot */}
              <div style={{ position: "relative", flexShrink: 0 }}>
                <div
                  aria-hidden="true"
                  style={{
                    width:          38,
                    height:         38,
                    borderRadius:   "50%",
                    background:     `linear-gradient(135deg, ${G.gold}, ${G.gold2})`,
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    fontSize:       15,
                    color:          "#0f0d0a",
                  }}
                >
                  ✦
                </div>
                {/* Status dot */}
                <div
                  aria-hidden="true"
                  style={{
                    position:     "absolute",
                    bottom:       1,
                    right:        1,
                    width:        10,
                    height:       10,
                    borderRadius: "50%",
                    background:   G.green,
                    border:       `2px solid ${G.bgHead}`,
                    animation:    "lwd-status-pulse 2.4s ease-in-out infinite",
                  }}
                />
              </div>

              {/* Name + label */}
              <div>
                <div
                  style={{
                    fontSize:    14,
                    fontWeight:  600,
                    color:       G.white,
                    fontFamily:  "var(--font-heading-primary)",
                    letterSpacing: 0.4,
                    lineHeight:  1.2,
                  }}
                >
                  Aura
                </div>
                <div
                  style={{
                    fontSize:      9,
                    letterSpacing: "2.5px",
                    textTransform: "uppercase",
                    color:         G.gold,
                    fontFamily:    "var(--font-body)",
                    lineHeight:    1,
                  }}
                >
                  Wedding AI
                </div>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={closeChat}
              aria-label="Close chat panel"
              onMouseEnter={() => setHovClose(true)}
              onMouseLeave={() => setHovClose(false)}
              style={{
                background:     "none",
                border:         `1px solid ${hovClose ? G.gold : G.border2}`,
                color:          hovClose ? G.gold : G.grey,
                cursor:         "pointer",
                fontSize:       20,
                width:          34,
                height:         34,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                transition:     "all 0.2s",
                lineHeight:     1,
                flexShrink:     0,
              }}
            >
              ×
            </button>
          </div>

          {/* ── Messages ── */}
          <div
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
            style={{ flex: 1, overflowY: "auto", padding: "18px 16px 10px" }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  marginBottom:  12,
                  display:       "flex",
                  justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth:     "82%",
                    padding:      "10px 14px",
                    fontSize:     13,
                    lineHeight:   1.68,
                    fontFamily:   "var(--font-body)",
                    fontWeight:   300,
                    borderRadius: m.from === "user"
                      ? "12px 2px 12px 12px"
                      : "2px 12px 12px 12px",
                    background: m.from === "user"
                      ? `linear-gradient(135deg, ${G.gold}, #b8940e)`
                      : "rgba(201,168,76,0.06)",
                    border: m.from === "user"
                      ? "none"
                      : `1px solid rgba(201,168,76,0.1)`,
                    color: m.from === "user"
                      ? "#0f0d0a"
                      : "rgba(255,255,255,0.82)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {isTyping && (
              <div
                style={{
                  display:        "flex",
                  justifyContent: "flex-start",
                  marginBottom:   12,
                }}
              >
                <TypingDots />
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* ── Input row ── */}
          <div
            style={{
              padding:      "10px 14px",
              paddingBottom: isMobile
                ? "calc(12px + env(safe-area-inset-bottom))"
                : 14,
              borderTop:    `1px solid ${G.border}`,
              display:      "flex",
              gap:          8,
              alignItems:   "center",
              flexShrink:   0,
              background:   G.bg,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about venues or planning..."
              aria-label="Type your message to Aura"
              style={{
                flex:        1,
                background:  "rgba(255,255,255,0.04)",
                border:      "1px solid rgba(201,168,76,0.2)",
                color:       G.white,
                padding:     "9px 12px",
                fontSize:    13,
                fontFamily:  "var(--font-body)",
                fontWeight:  300,
                outline:     "none",
                borderRadius: "var(--lwd-radius-input)",
                transition:  "border-color 0.2s",
                minWidth:    0,
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")
              }
            />

            <button
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              onMouseEnter={() => setHovSend(true)}
              onMouseLeave={() => setHovSend(false)}
              style={{
                width:          38,
                height:         38,
                flexShrink:     0,
                background:     canSend
                  ? hovSend
                    ? `linear-gradient(135deg, ${G.gold2}, ${G.gold})`
                    : `linear-gradient(135deg, ${G.gold}, #b8940e)`
                  : "rgba(201,168,76,0.1)",
                border:         "none",
                color:          canSend ? "#0f0d0a" : G.grey2,
                cursor:         canSend ? "pointer" : "default",
                fontSize:       16,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                borderRadius:   "var(--lwd-radius-input)",
                transition:     "all 0.2s",
              }}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* ── Collapsed pill ── */}
      <button
        onClick={toggleChat}
        aria-label={isOpen ? "Close Aura assistant" : "Open Aura wedding assistant"}
        aria-expanded={isOpen}
        onMouseEnter={() => setHovPill(true)}
        onMouseLeave={() => setHovPill(false)}
        style={{
          position:     "fixed",
          bottom:       28,
          right:        28,
          zIndex:       1201,
          display:      "flex",
          alignItems:   "center",
          gap:          10,
          padding:      "0 20px 0 9px",
          height:       52,
          borderRadius: 28,
          border:       "none",
          cursor:       "pointer",
          fontFamily:   "var(--font-body)",
          background:   hovPill
            ? `linear-gradient(135deg, ${G.gold2}, ${G.gold})`
            : `linear-gradient(135deg, ${G.gold}, #9b7a1a)`,
          boxShadow: hovPill
            ? "0 8px 32px rgba(201,168,76,0.45), 0 0 0 1px rgba(201,168,76,0.3)"
            : "0 4px 20px rgba(201,168,76,0.25), 0 0 0 1px rgba(201,168,76,0.15)",
          // Show pill only when panel is closed
          opacity:       isOpen ? 0 : 1,
          pointerEvents: isOpen ? "none" : "auto",
          transform:     isOpen
            ? "scale(0.82) translateY(6px)"
            : "scale(1)    translateY(0)",
          transition:
            "opacity 0.32s ease, transform 0.32s cubic-bezier(0.4,0,0.2,1), background 0.25s ease, box-shadow 0.25s ease",
        }}
      >
        {/* Icon */}
        <div
          aria-hidden="true"
          style={{
            width:          36,
            height:         36,
            borderRadius:   "50%",
            background:     "rgba(15,13,10,0.18)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       15,
            color:          "#0f0d0a",
            flexShrink:     0,
          }}
        >
          ✦
        </div>

        {/* Label */}
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontSize:      12,
              fontWeight:    700,
              color:         "#0f0d0a",
              letterSpacing: "0.5px",
              lineHeight:    1.2,
            }}
          >
            Aura
          </div>
          <div
            style={{
              fontSize:      9,
              color:         "rgba(15,13,10,0.6)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              lineHeight:    1,
            }}
          >
            Wedding AI
          </div>
        </div>
      </button>
    </>
  );
}
