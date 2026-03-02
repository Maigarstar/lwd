// ─── src/chat/WorkspaceCenter.jsx ─────────────────────────────────────────────
import { useState, useRef, useEffect, useCallback } from "react";
import { useChat } from "./ChatContext";
import Icon from "./Icons";

const GOLD = "#C9A84C";

// ── Theme token factory ────────────────────────────────────────────────────────
function getT(dark) {
  if (dark) return {
    centerBg:       "#212121",
    auraBubbleBg:   "rgba(255,255,255,0.07)",
    auraBubbleText: "rgba(255,255,255,0.88)",
    userBubbleBg:   "#C9A84C",
    userBubbleText: "#0D0B09",
    inputBg:        "rgba(255,255,255,0.06)",
    inputBorder:    "rgba(255,255,255,0.12)",
    inputText:      "rgba(255,255,255,0.9)",
    inputPlaceholder:"rgba(255,255,255,0.3)",
    hintText:       "rgba(255,255,255,0.28)",
    thumbActiveBg:  "rgba(201,168,76,0.15)",
    thumbActiveBorder:"rgba(201,168,76,0.4)",
    thumbHovBg:     "rgba(255,255,255,0.07)",
    thumbHovBorder: "rgba(255,255,255,0.2)",
    dividerLine:    "rgba(255,255,255,0.07)",
    scrollTrack:    "#2A2A2A",
    imgPreviewBg:   "rgba(255,255,255,0.06)",
    imgPreviewBorder:"rgba(255,255,255,0.12)",
  };
  return {
    centerBg:       "#FFFFFF",
    auraBubbleBg:   "#F5F0E8",
    auraBubbleText: "#1A1714",
    userBubbleBg:   "#1A1714",
    userBubbleText: "#FFFFFF",
    inputBg:        "#F8F6F2",
    inputBorder:    "#E5E0D8",
    inputText:      "#1A1714",
    inputPlaceholder:"rgba(26,23,20,0.35)",
    hintText:       "rgba(26,23,20,0.32)",
    thumbActiveBg:  "rgba(201,168,76,0.12)",
    thumbActiveBorder:"rgba(201,168,76,0.35)",
    thumbHovBg:     "rgba(0,0,0,0.05)",
    thumbHovBorder: "#D8D3CA",
    dividerLine:    "#EDEBE7",
    scrollTrack:    "#F0EDE8",
    imgPreviewBg:   "#F0ECE6",
    imgPreviewBorder:"#DDD8D0",
  };
}

export default function WorkspaceCenter({ darkMode }) {
  const { messages, isTyping, sendMessage } = useChat();
  const T = getT(darkMode);

  const [input,    setInput]    = useState("");
  const [feedback, setFeedback] = useState({});
  const [attached, setAttached] = useState(null);  // { url, name }
  const [listening, setListening] = useState(false);

  const threadRef  = useRef(null);
  const inputRef   = useRef(null);
  const fileRef    = useRef(null);

  // Auto-scroll
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, isTyping]);

  // Auto-focus
  useEffect(() => { inputRef.current?.focus(); }, []);

  const handleSend = useCallback(() => {
    if (!input.trim() && !attached) return;
    sendMessage(input.trim() || (attached ? `[Image: ${attached.name}]` : ""));
    setInput("");
    setAttached(null);
  }, [input, attached, sendMessage]);

  const handleKey = useCallback((e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  }, [handleSend]);

  const toggleFeedback = (id, val) => {
    setFeedback((prev) => ({ ...prev, [id]: prev[id] === val ? null : val }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAttached({ url, name: file.name });
    e.target.value = "";   // reset so same file can be picked again
  };

  const handleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (listening) return;
    const rec = new SR();
    rec.lang = "en-GB";
    rec.interimResults = false;
    rec.onstart = () => setListening(true);
    rec.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setInput((prev) => (prev ? prev + " " + t : t));
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    rec.start();
  };

  const canSend = input.trim().length > 0 || !!attached;

  return (
    <>
      <style>{`
        @keyframes ws-dot-pulse {
          0%, 80%, 100% { transform: scale(0); opacity: 0.35; }
          40%            { transform: scale(1); opacity: 1;    }
        }
        .ws-thread::-webkit-scrollbar       { width: 4px; }
        .ws-thread::-webkit-scrollbar-track { background: ${T.scrollTrack}; }
        .ws-thread::-webkit-scrollbar-thumb { background: ${GOLD}; border-radius: 2px; }
      `}</style>

      <div style={{ height: "100%", display: "flex", flexDirection: "column", background: T.centerBg, transition: "background 0.3s ease" }}>

        {/* ── Thread ─────────────────────────────────────────────────────────── */}
        <div
          ref={threadRef}
          className="ws-thread"
          style={{ flex: 1, overflowY: "auto", padding: "28px 24px 16px", display: "flex", flexDirection: "column", gap: 16, justifyContent: messages.length <= 2 ? "center" : "flex-start" }}
        >
          {messages.map((m) => (
            <div
              key={m.id}
              style={{ display: "flex", flexDirection: m.from === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 8 }}
            >
              {/* Aura avatar */}
              {m.from === "aura" && (
                <div
                  aria-hidden="true"
                  style={{
                    width: 30, height: 30, borderRadius: "50%",
                    background: "rgba(201,168,76,0.1)",
                    border: "1px solid rgba(201,168,76,0.35)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 12, color: GOLD, flexShrink: 0, marginBottom: 2,
                  }}
                ><Icon name="sparkleMini" size={14} color={GOLD} /></div>
              )}

              {/* Bubble + feedback */}
              <div style={{ display: "flex", flexDirection: "column", alignItems: m.from === "user" ? "flex-end" : "flex-start", maxWidth: "72%", gap: 4 }}>
                <div
                  style={{
                    padding: "11px 16px",
                    borderRadius:  m.from === "user" ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background:    m.from === "user" ? T.userBubbleBg  : T.auraBubbleBg,
                    color:         m.from === "user" ? T.userBubbleText : T.auraBubbleText,
                    fontFamily:   "var(--font-body)",
                    fontSize:      14,
                    lineHeight:    1.6,
                    boxShadow:     m.from === "user" ? "0 1px 4px rgba(0,0,0,0.12)" : "0 1px 4px rgba(0,0,0,0.06)",
                    transition:   "background 0.3s ease, color 0.3s ease",
                  }}
                >
                  {m.text}
                </div>

                {/* Thumbs — Aura only */}
                {m.from === "aura" && (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, paddingLeft: 4 }}>
                    <ThumbBtn icon={<Icon name="thumbUp" size={12} />} active={feedback[m.id] === "up"}   label="Helpful"     onClick={() => toggleFeedback(m.id, "up")}   T={T} />
                    <ThumbBtn icon={<Icon name="thumbDown" size={12} />} active={feedback[m.id] === "down"} label="Not helpful"  onClick={() => toggleFeedback(m.id, "down")} T={T} />
                    {feedback[m.id] && (
                      <span style={{ fontSize: 10, color: GOLD, fontFamily: "var(--font-body)", marginLeft: 2, opacity: 0.8 }}>
                        Thanks for your feedback
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div style={{ display: "flex", alignItems: "flex-end", gap: 8 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.35)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: GOLD, flexShrink: 0 }}><Icon name="sparkleMini" size={14} color={GOLD} /></div>
              <div style={{ padding: "12px 16px", borderRadius: "18px 18px 18px 4px", background: T.auraBubbleBg, display: "flex", gap: 5, alignItems: "center", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 7, height: 7, borderRadius: "50%", background: GOLD, display: "inline-block", animation: `ws-dot-pulse 1.4s ease ${i * 0.2}s infinite` }} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Divider ─────────────────────────────────────────────────────────── */}
        <div style={{ height: 1, background: T.dividerLine, flexShrink: 0 }} />

        {/* ── Input area ──────────────────────────────────────────────────────── */}
        <div style={{ padding: "12px 20px 14px", background: T.centerBg, flexShrink: 0, transition: "background 0.3s ease" }}>

          {/* Image preview strip */}
          {attached && (
            <div
              style={{
                display:      "flex",
                alignItems:   "center",
                gap:           10,
                marginBottom:  10,
                background:    T.imgPreviewBg,
                border:       `1px solid ${T.imgPreviewBorder}`,
                borderRadius:  10,
                padding:      "8px 12px",
              }}
            >
              <img
                src={attached.url}
                alt="attachment preview"
                style={{ width: 48, height: 48, objectFit: "cover", borderRadius: "var(--lwd-radius-image)", flexShrink: 0 }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 11, color: T.inputText, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {attached.name}
                </div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: T.hintText }}>
                  Image attached
                </div>
              </div>
              <button
                onClick={() => setAttached(null)}
                aria-label="Remove attachment"
                style={{ background: "none", border: "none", cursor: "pointer", color: T.hintText, fontSize: 16, padding: "0 2px", lineHeight: 1, flexShrink: 0 }}
              >×</button>
            </div>
          )}

          <div
            style={{
              display:      "flex",
              gap:           8,
              alignItems:   "flex-end",
              background:    T.inputBg,
              border:       `1px solid ${T.inputBorder}`,
              borderRadius:  14,
              padding:      "10px 10px 10px 10px",
              boxShadow:    "0 1px 8px rgba(0,0,0,0.05)",
              transition:   "background 0.3s, border-color 0.3s",
            }}
          >
            {/* Hidden file input */}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />

            {/* Upload button */}
            <button
              onClick={() => fileRef.current?.click()}
              aria-label="Attach image"
              title="Attach image"
              style={{
                width:          38,
                height:         38,
                flexShrink:     0,
                borderRadius:   10,
                background:    "none",
                border:        `1px solid ${T.inputBorder}`,
                color:          T.hintText,
                cursor:        "pointer",
                fontSize:       18,
                display:       "flex",
                alignItems:    "center",
                justifyContent: "center",
                transition:    "all 0.2s",
                alignSelf:     "flex-end",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.color = T.hintText; }}
            >
              <Icon name="paperclip" size={16} />
            </button>

            {/* Voice input */}
            {(window.SpeechRecognition || window.webkitSpeechRecognition) && (
              <button
                onClick={handleVoice}
                aria-label={listening ? "Listening..." : "Voice input"}
                title={listening ? "Listening..." : "Voice input"}
                style={{
                  width:          38,
                  height:         38,
                  flexShrink:     0,
                  borderRadius:   10,
                  background:     listening ? "rgba(201,168,76,0.15)" : "none",
                  border:         `1px solid ${listening ? GOLD : T.inputBorder}`,
                  color:          listening ? GOLD : T.hintText,
                  cursor:        "pointer",
                  fontSize:       18,
                  display:       "flex",
                  alignItems:    "center",
                  justifyContent: "center",
                  transition:    "all 0.2s",
                  alignSelf:     "flex-end",
                  animation:      listening ? "ws-dot-pulse 1.4s ease infinite" : "none",
                }}
                onMouseEnter={(e) => { if (!listening) { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; } }}
                onMouseLeave={(e) => { if (!listening) { e.currentTarget.style.borderColor = T.inputBorder; e.currentTarget.style.color = T.hintText; } }}
              >
                <Icon name="mic" size={16} />
              </button>
            )}

            {/* Text input */}
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask Aura about venues, vendors, regions, budgets…"
              rows={1}
              style={{
                flex:       1,
                background: "none",
                border:     "none",
                resize:     "none",
                fontFamily: "var(--font-body)",
                fontSize:    14,
                color:       T.inputText,
                outline:    "none",
                lineHeight:  1.5,
                maxHeight:   120,
                overflowY:  "auto",
                caretColor:  GOLD,
              }}
            />

            {/* Send button */}
            <button
              onClick={handleSend}
              disabled={!canSend}
              aria-label="Send message"
              style={{
                width:          40,
                height:         40,
                flexShrink:     0,
                borderRadius:   10,
                background:     canSend ? GOLD : "rgba(201,168,76,0.15)",
                border:         "none",
                color:          canSend ? "#0f0d0a" : "rgba(201,168,76,0.4)",
                cursor:         canSend ? "pointer" : "default",
                fontSize:       18,
                display:        "flex",
                alignItems:     "center",
                justifyContent: "center",
                transition:     "all 0.2s",
                alignSelf:      "flex-end",
                fontWeight:      700,
              }}
            ><Icon name="arrowUp" size={18} strokeWidth={2.5} /></button>
          </div>

          {/* Hints */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6, flexWrap: "wrap", gap: 4 }}>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 10, color: T.hintText }}>
              Enter to send · Shift+Enter for new line
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontSize: 9, color: T.hintText, letterSpacing: "0.2px", opacity: 0.65 }}>
              Aura can make mistakes
            </span>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Thumb button ───────────────────────────────────────────────────────────────
function ThumbBtn({ icon, active, label, onClick, T }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:   active ? T.thumbActiveBg : (hov ? T.thumbHovBg : "none"),
        border:       `1px solid ${active ? T.thumbActiveBorder : (hov ? T.thumbHovBorder : "transparent")}`,
        borderRadius:  20,
        padding:      "2px 7px",
        cursor:        "pointer",
        fontSize:       12,
        lineHeight:     1,
        transition:    "all 0.15s",
        display:       "flex",
        alignItems:    "center",
      }}
    >{icon}</button>
  );
}
