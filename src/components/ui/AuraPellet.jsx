// ─── src/components/ui/AuraPellet.jsx ────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { useTheme } from "../../theme/ThemeContext";

const INIT_MESSAGES = [
  {
    from: "aura",
    text: "Hello! I'm Aura, your personal wedding planner assistant. I can help you find the perfect Italian venue, understand pricing, or answer any questions. How can I help?",
  },
];

const QUICK_REPLIES = [
  "Best venues in Tuscany",
  "Compare Lake Como & Amalfi",
  "What's included in hire fees?",
  "Book a consultation",
];

const AUTO_REPLIES = {
  "best venues in tuscany": "Tuscany is spectacular for weddings. Our top picks include Villa Rosanova in San Casciano for its private vineyard chapel, Castello di Vicarello for an intimate medieval estate, and Tenuta di Neri near Montalcino for a stunning Brunello wine estate. Shall I share more details on any of these?",
  "compare lake como & amalfi": "Both are extraordinary — it really comes down to scale and style. Lake Como offers grand classical villas like Villa d'Este (up to 200 guests) with serene alpine reflections. The Amalfi Coast — particularly Ravello — is more intimate and dramatic, perched above the sea. Amalfi tends to suit smaller, more theatrical celebrations (50–100 guests).",
  "what's included in hire fees?": "Venue hire typically covers exclusive use of the estate, ceremony spaces, reception terraces, and guest accommodation. Catering, florals, music and legal paperwork are usually separate. Most of our featured estates include a dedicated venue coordinator. I can send you a detailed breakdown — would that help?",
  "book a consultation": "Wonderful! Our consultants specialise in Italian wedding planning and have personal relationships with every venue on our list. I'll connect you with a specialist. Could I take your name and preferred contact method?",
};

function TypingDots() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "12px 16px",
        background: "rgba(201,168,76,0.06)",
        borderRadius: "2px 12px 12px 2px",
        width: "fit-content",
      }}
    >
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "#C9A84C",
            display: "inline-block",
            animation: "dotPulse 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function AuraPellet() {
  const C = useTheme();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(INIT_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [pelletHov, setPelletHov] = useState(false);
  const [sendHov, setSendHov] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const typingTimerRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typing, open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Cleanup on unmount
  useEffect(() => () => clearTimeout(typingTimerRef.current), []);

  const sendMessage = useCallback(
    (text) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      setInput("");
      setMessages((m) => [...m, { from: "user", text: trimmed }]);
      setTyping(true);

      const key = trimmed.toLowerCase();
      const reply =
        AUTO_REPLIES[key] ||
        "That's a great question. Our Italy specialists can give you the most accurate answer. Would you like me to arrange a callback, or is there anything else I can help with right now?";

      typingTimerRef.current = setTimeout(() => {
        setTyping(false);
        setMessages((m) => [...m, { from: "aura", text: reply }]);
      }, 1600);
    },
    []
  );

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* ── Chat modal ── */}
      {open && (
        <div
          role="dialog"
          aria-label="Aura wedding assistant chat"
          aria-modal="true"
          style={{
            position: "fixed",
            bottom: 92,
            right: 28,
            width: 360,
            maxHeight: 540,
            background: "#0f0f0f",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 4,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            zIndex: 1100,
            boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.1)",
            animation: "chatModalIn 0.28s ease both",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "14px 18px",
              background: "linear-gradient(135deg,#0d0c0a,#1a1710)",
              borderBottom: "1px solid rgba(201,168,76,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexShrink: 0,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: "50%",
                  background: "linear-gradient(135deg,#C9A84C,#e8c97a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              >
                ✦
              </div>
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "#fff",
                    fontFamily: "var(--font-heading-primary)",
                    letterSpacing: 0.3,
                  }}
                >
                  Aura
                </div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#C9A84C",
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Wedding AI · Italy
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close chat"
              style={{
                background: "none",
                border: "none",
                color: "rgba(255,255,255,0.4)",
                cursor: "pointer",
                fontSize: 18,
                lineHeight: 1,
                padding: 4,
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
            >
              ×
            </button>
          </div>

          {/* Messages */}
          <div
            style={{ flex: 1, overflowY: "auto", padding: "16px 16px 8px" }}
            role="log"
            aria-live="polite"
            aria-label="Chat messages"
          >
            {messages.map((m, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: m.from === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "82%",
                    padding: "10px 14px",
                    fontSize: 12.5,
                    lineHeight: 1.65,
                    fontFamily: "var(--font-body)",
                    fontWeight: 300,
                    borderRadius:
                      m.from === "user" ? "12px 2px 12px 12px" : "2px 12px 12px 12px",
                    background:
                      m.from === "user"
                        ? "linear-gradient(135deg,#C9A84C,#b8940e)"
                        : "rgba(201,168,76,0.06)",
                    border:
                      m.from === "user"
                        ? "none"
                        : "1px solid rgba(201,168,76,0.1)",
                    color: m.from === "user" ? "#0f0d0a" : "rgba(255,255,255,0.82)",
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}

            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <TypingDots />
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Quick replies */}
          {messages.length <= 2 && !typing && (
            <div
              style={{
                padding: "0 12px 10px",
                display: "flex",
                flexWrap: "wrap",
                gap: 6,
              }}
            >
              {QUICK_REPLIES.map((r) => (
                <button
                  key={r}
                  onClick={() => sendMessage(r)}
                  style={{
                    background: "none",
                    border: "1px solid rgba(201,168,76,0.25)",
                    color: "rgba(201,168,76,0.8)",
                    padding: "5px 10px",
                    fontSize: 10.5,
                    fontFamily: "var(--font-body)",
                    cursor: "pointer",
                    borderRadius: 2,
                    transition: "all 0.2s",
                    letterSpacing: "0.3px",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(201,168,76,0.12)";
                    e.currentTarget.style.borderColor = "#C9A84C";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "none";
                    e.currentTarget.style.borderColor = "rgba(201,168,76,0.25)";
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div
            style={{
              padding: "10px 14px 14px",
              borderTop: "1px solid rgba(201,168,76,0.1)",
              display: "flex",
              gap: 8,
              alignItems: "flex-end",
              flexShrink: 0,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask about Italian venues…"
              aria-label="Type your message"
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(201,168,76,0.2)",
                color: "#fff",
                padding: "9px 12px",
                fontSize: 12,
                fontFamily: "var(--font-body)",
                outline: "none",
                resize: "none",
                borderRadius: 2,
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.55)")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)")}
            />
            <button
              onClick={() => sendMessage(input)}
              aria-label="Send message"
              style={{
                width: 36,
                height: 36,
                background: sendHov
                  ? "linear-gradient(135deg,#e8c97a,#C9A84C)"
                  : "linear-gradient(135deg,#C9A84C,#b8940e)",
                border: "none",
                color: "#0f0d0a",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: 2,
                transition: "all 0.2s",
                flexShrink: 0,
              }}
              onMouseEnter={() => setSendHov(true)}
              onMouseLeave={() => setSendHov(false)}
            >
              →
            </button>
          </div>
        </div>
      )}

      {/* ── Floating pellet button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close Aura assistant" : "Open Aura wedding assistant"}
        aria-expanded={open}
        style={{
          position: "fixed",
          bottom: 28,
          right: 28,
          zIndex: 1100,
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: open ? "0 18px 0 8px" : "0 18px 0 8px",
          height: 52,
          background: pelletHov
            ? "linear-gradient(135deg,#e8c97a,#C9A84C)"
            : "linear-gradient(135deg,#C9A84C,#9b7a1a)",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-body)",
          boxShadow: pelletHov
            ? "0 8px 32px rgba(201,168,76,0.45), 0 0 0 1px rgba(201,168,76,0.3)"
            : "0 4px 24px rgba(201,168,76,0.25), 0 0 0 1px rgba(201,168,76,0.15)",
          transition: "all 0.3s ease",
          borderRadius: 28,
          animation: open ? "none" : "barGlow 3s ease-in-out infinite",
        }}
        onMouseEnter={() => setPelletHov(true)}
        onMouseLeave={() => setPelletHov(false)}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: "50%",
            background: "rgba(15,13,10,0.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 15,
            color: "#0f0d0a",
            flexShrink: 0,
          }}
          aria-hidden="true"
        >
          {open ? "×" : "✦"}
        </div>
        <div style={{ textAlign: "left" }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#0f0d0a",
              letterSpacing: "0.5px",
              lineHeight: 1.2,
            }}
          >
            Aura
          </div>
          <div
            style={{
              fontSize: 9,
              color: "rgba(15,13,10,0.65)",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              lineHeight: 1,
            }}
          >
            Wedding AI
          </div>
        </div>
      </button>
    </>
  );
}
