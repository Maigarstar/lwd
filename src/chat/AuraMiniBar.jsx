// ─── src/chat/AuraMiniBar.jsx ─────────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "./ChatContext";
import Icon from "./Icons";

const KEYFRAMES = `
  @keyframes aura-float-in {
    from {
      opacity:   0;
      transform: translate(-50%, calc(-50% + 18px)) scale(0.95);
    }
    to {
      opacity:   1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  @keyframes aura-fade-bg {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
`;

export default function AuraMiniBar() {
  const { messages, isTyping, sendMessage, openWorkspace, closeChat } = useChat();
  const [input, setInput]         = useState("");
  const [listening, setListening] = useState(false);
  const threadRef  = useRef(null);
  const inputRef   = useRef(null);

  // Last 4 messages for the compact thread (slightly more now it's centered)
  const thread = messages.slice(-4);

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

  const handleVoice = useCallback(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR || listening) return;
    const rec = new SR();
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.onstart  = () => setListening(true);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + t : t));
    };
    rec.onend   = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  }, [listening]);

  const hasSR = typeof window !== "undefined" &&
    !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  return (
    <>
      <style>{KEYFRAMES}</style>

      {/* ── Soft backdrop — click outside to dismiss ── */}
      <div
        onClick={closeChat}
        style={{
          position:       "fixed",
          inset:          0,
          zIndex:         899,
          background:     "rgba(10,9,7,0.22)",
          backdropFilter: "blur(3px)",
          WebkitBackdropFilter: "blur(3px)",
          animation:      "aura-fade-bg 0.35s ease both",
        }}
      />

      {/* ── Chat panel — centered on screen ── */}
      <div
        role="dialog"
        aria-label="Aura mini chat"
        style={{
          position:   "fixed",
          top:        "50%",
          left:       "50%",
          zIndex:     900,
          width:      680,
          maxWidth:   "calc(100vw - 32px)",
          borderRadius: 20,
          overflow:   "hidden",
          background: "#1E1C19",
          border:     "1px solid rgba(201,168,76,0.22)",
          boxShadow:  "0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(201,168,76,0.07), 0 0 40px rgba(201,168,76,0.05)",
          animation:  "aura-float-in 0.42s cubic-bezier(0.22,1,0.36,1) both",
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "14px 18px 13px",
            borderBottom:   "1px solid rgba(201,168,76,0.12)",
          }}
        >
          {/* Left: avatar + name + status */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width:          32,
                height:         32,
                borderRadius:   "50%",
                background:     "rgba(201,168,76,0.12)",
                border:         "1px solid rgba(201,168,76,0.32)",
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                fontSize:       14,
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
                  marginBottom:  4,
                }}
              >
                Chat with Aura
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <span
                  style={{
                    width:        6,
                    height:       6,
                    borderRadius: "50%",
                    background:   "#22c55e",
                    display:      "inline-block",
                  }}
                />
                <span
                  style={{
                    fontFamily:    "var(--font-body)",
                    fontSize:      10,
                    color:         "rgba(245,240,232,0.4)",
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
              onMouseEnter={e => e.currentTarget.style.background = "rgba(201,168,76,0.2)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(201,168,76,0.1)"}
            >
              Full chat ↗
            </button>
            <button
              onClick={closeChat}
              aria-label="Close chat"
              style={{
                width:          30,
                height:         30,
                borderRadius:   "50%",
                background:     "rgba(255,255,255,0.06)",
                border:         "none",
                color:          "rgba(245,240,232,0.45)",
                cursor:         "pointer",
                fontSize:       17,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                transition:     "background 0.2s, color 0.2s",
              }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "#f5f0e8"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; e.currentTarget.style.color = "rgba(245,240,232,0.45)"; }}
            >
              ×
            </button>
          </div>
        </div>

        {/* ── Compact thread ── */}
        <div
          ref={threadRef}
          style={{
            height:        140,
            overflowY:     "auto",
            padding:       "12px 18px",
            display:       "flex",
            flexDirection: "column",
            gap:           7,
            background:    "#FFFDF9",
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
                  padding:      "7px 12px",
                  borderRadius: m.from === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                  background:   m.from === "user" ? "#C9A84C" : "#F0ECE4",
                  fontFamily:   "var(--font-body)",
                  fontSize:     12.5,
                  lineHeight:   1.5,
                  color:        m.from === "user" ? "#0f0d0a" : "#3a3530",
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
                    width:        6,
                    height:       6,
                    borderRadius: "50%",
                    background:   "rgba(201,168,76,0.5)",
                    display:      "inline-block",
                    animation:    `lwd-dot-pulse 1.4s ease ${i * 0.2}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Input row ── */}
        <div
          style={{
            padding:    "10px 14px 16px",
            borderTop:  "1px solid rgba(0,0,0,0.06)",
            background: "#FFFDF9",
          }}
        >
          <div
            style={{
              display:      "flex",
              gap:          6,
              alignItems:   "center",
              background:   "#F5F2ED",
              border:       "1px solid rgba(201,168,76,0.15)",
              borderRadius: 12,
              padding:      "6px 8px",
            }}
          >
            {/* Mic button */}
            {hasSR && (
              <button
                onClick={handleVoice}
                aria-label={listening ? "Listening…" : "Voice input"}
                title={listening ? "Listening…" : "Voice input"}
                style={{
                  width:          32,
                  height:         32,
                  flexShrink:     0,
                  borderRadius:   8,
                  background:     listening ? "rgba(201,168,76,0.15)" : "rgba(0,0,0,0.04)",
                  border:         "none",
                  color:          listening ? "#C9A84C" : "#8a857e",
                  cursor:         "pointer",
                  display:        "flex",
                  alignItems:     "center",
                  justifyContent: "center",
                  transition:     "all 0.2s",
                  animation:      listening ? "lwd-dot-pulse 1.4s ease infinite" : "none",
                }}
                onMouseEnter={(e) => { if (!listening) e.currentTarget.style.color = "#C9A84C"; }}
                onMouseLeave={(e) => { if (!listening) e.currentTarget.style.color = "#8a857e"; }}
              >
                <Icon name="mic" size={15} />
              </button>
            )}

            {/* Text input */}
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Guest count, style, budget…"
              style={{
                flex:       1,
                background: "none",
                border:     "none",
                padding:    "6px 4px",
                fontFamily: "var(--font-body)",
                fontSize:   13,
                color:      "#1a1816",
                outline:    "none",
                caretColor: "#C9A84C",
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!input.trim()}
              aria-label="Send message"
              style={{
                width:          32,
                height:         32,
                flexShrink:     0,
                borderRadius:   8,
                background:     input.trim() ? "#C9A84C" : "rgba(201,168,76,0.12)",
                border:         "none",
                color:          input.trim() ? "#0f0d0a" : "rgba(201,168,76,0.35)",
                cursor:         input.trim() ? "pointer" : "default",
                fontSize:       14,
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
      </div>
    </>
  );
}
