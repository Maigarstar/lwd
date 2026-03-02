// ─── src/chat/AuraMiniBar.jsx ─────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "./ChatContext";

export default function AuraMiniBar() {
  const { messages, isTyping, sendMessage, openWorkspace, closeChat } = useChat();
  const [input, setInput] = useState("");
  const threadRef         = useRef(null);
  const inputRef          = useRef(null);

  // Last 3 messages for the compact thread
  const thread = messages.slice(-3);

  // Auto-scroll thread
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Focus input on mount
  useEffect(() => { inputRef.current?.focus(); }, []);

  // ESC → close to pill
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") closeChat(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [closeChat]);

  const handleSend = useCallback(() => {
    if (!input.trim()) return;
    sendMessage(input);
    setInput("");
  }, [input, sendMessage]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  return (
    <div
      role="dialog"
      aria-label="Aura mini chat"
      style={{
        position:            "fixed",
        bottom:              20,
        left:                "50%",
        transform:           "translateX(-50%)",
        zIndex:              900,
        width:               660,
        maxWidth:            "calc(100vw - 32px)",
        borderRadius:        16,
        overflow:            "hidden",
        background:          "rgba(14,12,9,0.97)",
        border:              "1px solid rgba(201,168,76,0.22)",
        boxShadow:           "0 20px 60px rgba(0,0,0,0.6)",
        backdropFilter:      "blur(24px)",
        WebkitBackdropFilter:"blur(24px)",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display:        "flex",
          alignItems:     "center",
          justifyContent: "space-between",
          padding:        "12px 16px 11px",
          borderBottom:   "1px solid rgba(201,168,76,0.1)",
        }}
      >
        {/* Left: avatar + name + status */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              width:          30,
              height:         30,
              borderRadius:   "50%",
              background:     "rgba(201,168,76,0.12)",
              border:         "1px solid rgba(201,168,76,0.32)",
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
              fontSize:       13,
              color:          "#C9A84C",
              flexShrink:     0,
            }}
          >
            ✦
          </div>
          <div>
            <div
              style={{
                fontFamily:    "var(--font-body)",
                fontWeight:    600,
                fontSize:      13,
                color:         "#f5f0e8",
                letterSpacing: "0.3px",
                lineHeight:    1,
                marginBottom:  3,
              }}
            >
              Aura
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span
                style={{
                  width:        6,
                  height:       6,
                  borderRadius: "50%",
                  background:   "#22c55e",
                  display:      "inline-block",
                  animation:    "lwd-status-pulse 2s ease infinite",
                }}
              />
              <span
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      10,
                  color:         "rgba(245,240,232,0.35)",
                  letterSpacing: "0.5px",
                }}
              >
                Online
              </span>
            </div>
          </div>
        </div>

        {/* Right: full chat + close */}
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={openWorkspace}
            style={{
              fontFamily:    "var(--font-body)",
              fontSize:      11,
              fontWeight:    600,
              color:         "#C9A84C",
              background:    "rgba(201,168,76,0.1)",
              border:        "1px solid rgba(201,168,76,0.25)",
              borderRadius:  6,
              padding:       "5px 12px",
              cursor:        "pointer",
              letterSpacing: "0.4px",
              whiteSpace:    "nowrap",
              transition:    "background 0.2s",
            }}
          >
            Full chat ↗
          </button>
          <button
            onClick={closeChat}
            aria-label="Close chat"
            style={{
              width:          28,
              height:         28,
              borderRadius:   "50%",
              background:     "rgba(255,255,255,0.06)",
              border:         "none",
              color:          "rgba(245,240,232,0.45)",
              cursor:         "pointer",
              fontSize:       16,
              display:        "flex",
              alignItems:     "center",
              justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* ── Compact thread — fixed 96px ── */}
      <div
        ref={threadRef}
        style={{
          height:        96,
          overflowY:     "auto",
          padding:       "10px 16px",
          display:       "flex",
          flexDirection: "column",
          gap:           6,
        }}
      >
        {thread.map((m) => (
          <div
            key={m.id}
            style={{
              display:        "flex",
              justifyContent: m.from === "user" ? "flex-end" : "flex-start",
            }}
          >
            <div
              style={{
                maxWidth:     "80%",
                padding:      "6px 11px",
                borderRadius: m.from === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                background:   m.from === "user"
                  ? "rgba(201,168,76,0.16)"
                  : "rgba(255,255,255,0.06)",
                fontFamily:   "var(--font-body)",
                fontSize:     12,
                lineHeight:   1.45,
                color:        m.from === "user" ? "#e8c97a" : "rgba(245,240,232,0.8)",
              }}
            >
              {m.text}
            </div>
          </div>
        ))}

        {/* Typing dots */}
        {isTyping && (
          <div style={{ display: "flex", gap: 5, padding: "4px 2px" }}>
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  width:     6,
                  height:    6,
                  borderRadius: "50%",
                  background: "rgba(201,168,76,0.65)",
                  display:   "inline-block",
                  animation: `lwd-dot-pulse 1.4s ease ${i * 0.2}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Input row ── */}
      <div
        style={{
          display:    "flex",
          gap:        8,
          padding:    "10px 14px 14px",
          borderTop:  "1px solid rgba(201,168,76,0.09)",
          alignItems: "center",
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask about venues, vendors, regions…"
          style={{
            flex:         1,
            background:   "rgba(255,255,255,0.05)",
            border:       "1px solid rgba(201,168,76,0.18)",
            borderRadius: 8,
            padding:      "9px 13px",
            fontFamily:   "var(--font-body)",
            fontSize:     13,
            color:        "#f5f0e8",
            outline:      "none",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim()}
          aria-label="Send message"
          style={{
            width:          36,
            height:         36,
            flexShrink:     0,
            borderRadius:   8,
            background:     input.trim() ? "#C9A84C" : "rgba(201,168,76,0.15)",
            border:         "none",
            color:          input.trim() ? "#0f0d0a" : "rgba(201,168,76,0.35)",
            cursor:         input.trim() ? "pointer" : "default",
            fontSize:       15,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            transition:     "all 0.2s",
          }}
        >
          ↑
        </button>
      </div>
    </div>
  );
}
