// ─── src/chat/SaveChatModal.jsx ────────────────────────────────────────────────
import { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const GOLD = "#C9A84C";

export default function SaveChatModal({ onClose }) {
  const [email,   setEmail]   = useState("");
  const [saved,   setSaved]   = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  // Graceful close — glide out then unmount
  const handleClose = () => {
    setClosing(true);
    setVisible(false);
    setTimeout(onClose, 600);
  };

  // ESC close
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") handleClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, []);

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!email.trim() || !email.includes("@")) return;
    setSaved(true);
  };

  const modal = (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               1300,
          background:           "rgba(0,0,0,0.65)",
          backdropFilter:       "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity:              visible ? 1 : 0,
          transition:           closing
            ? "opacity 0.55s cubic-bezier(0.4, 0, 0.2, 1)"
            : "opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Save chat"
        onClick={(e) => e.stopPropagation()}
        style={{
          position:      "fixed",
          top:           "50%",
          left:          "50%",
          transform:     visible
            ? "translate(-50%,-50%) translateY(0) scale(1)"
            : closing
              ? "translate(-50%,-50%) translateY(40px) scale(0.96)"
              : "translate(-50%,-50%) translateY(-20px) scale(0.97)",
          opacity:       visible ? 1 : 0,
          transition:    closing
            ? "transform 0.55s cubic-bezier(0.4, 0, 1, 1), opacity 0.5s cubic-bezier(0.4, 0, 1, 1)"
            : "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          zIndex:        1301,
          width:         "min(92vw, 400px)",
          background:    "#13110e",
          border:        "1px solid rgba(201,168,76,0.22)",
          boxShadow:     "0 24px 60px rgba(0,0,0,0.72)",
          padding:       "36px 32px 28px",
          textAlign:     "center",
          borderRadius:  "var(--lwd-radius-card)",
        }}
      >
        {/* Gold icon */}
        <div
          style={{
            width:          48,
            height:         48,
            borderRadius:   "50%",
            background:     "rgba(201,168,76,0.1)",
            border:         "1px solid rgba(201,168,76,0.3)",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
            fontSize:       20,
            color:          GOLD,
            margin:         "0 auto 20px",
          }}
        >
          ✦
        </div>

        {!saved ? (
          <>
            <div
              style={{
                fontFamily:   "var(--font-heading-primary)",
                fontSize:     22,
                fontWeight:   500,
                color:        "#f5f0e8",
                marginBottom: 10,
                lineHeight:   1.2,
              }}
            >
              Save your conversation
            </div>
            <p
              style={{
                fontFamily:   "var(--font-body)",
                fontSize:     13,
                color:        "rgba(245,240,232,0.45)",
                lineHeight:   1.65,
                marginBottom: 22,
                fontWeight:   300,
              }}
            >
              Create a free account to save chat history, build your
              shortlist, and get personalised recommendations.
            </p>

            {/* Email input */}
            <form onSubmit={handleSubmit} style={{ marginBottom: 12 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoFocus
                style={{
                  width:        "100%",
                  padding:      "11px 14px",
                  background:   "rgba(255,255,255,0.05)",
                  border:       "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "var(--lwd-radius-input)",
                  fontFamily:   "var(--font-body)",
                  fontSize:     13,
                  color:        "#f5f0e8",
                  outline:      "none",
                  caretColor:   GOLD,
                  boxSizing:    "border-box",
                  marginBottom: 14,
                  transition:   "border-color 0.2s",
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.45)"; }}
                onBlur={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.2)"; }}
              />

              <button
                type="submit"
                disabled={!email.trim() || !email.includes("@")}
                style={{
                  width:         "100%",
                  padding:       "12px 0",
                  background:    email.includes("@")
                    ? "linear-gradient(135deg,#C9A84C,#e8c97a)"
                    : "rgba(201,168,76,0.15)",
                  border:        "none",
                  color:         email.includes("@") ? "#0f0d0a" : "rgba(201,168,76,0.35)",
                  fontFamily:    "var(--font-body)",
                  fontSize:      11,
                  fontWeight:    700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  cursor:        email.includes("@") ? "pointer" : "default",
                  borderRadius:  "var(--lwd-radius-input)",
                  transition:    "all 0.2s",
                }}
              >
                Register to Save
              </button>
            </form>

            <button
              onClick={handleClose}
              style={{
                width:         "100%",
                padding:       "10px 0",
                background:    "none",
                border:        "1px solid rgba(255,255,255,0.1)",
                color:         "rgba(255,255,255,0.35)",
                fontFamily:    "var(--font-body)",
                fontSize:      11,
                cursor:        "pointer",
                borderRadius:  "var(--lwd-radius-input)",
                transition:    "all 0.2s",
              }}
            >
              Maybe later
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                fontFamily:   "var(--font-heading-primary)",
                fontSize:     22,
                fontWeight:   500,
                color:        "#22c55e",
                marginBottom: 10,
              }}
            >
              ✓ You're registered
            </div>
            <p
              style={{
                fontFamily:   "var(--font-body)",
                fontSize:     13,
                color:        "rgba(245,240,232,0.45)",
                lineHeight:   1.65,
                marginBottom: 24,
                fontWeight:   300,
              }}
            >
              Your chat has been saved. You'll receive a confirmation
              email shortly.
            </p>
            <button
              onClick={handleClose}
              style={{
                width:         "100%",
                padding:       "12px 0",
                background:    "linear-gradient(135deg,#C9A84C,#e8c97a)",
                border:        "none",
                color:         "#0f0d0a",
                fontFamily:    "var(--font-body)",
                fontSize:      11,
                fontWeight:    700,
                letterSpacing: "1.5px",
                textTransform: "uppercase",
                cursor:        "pointer",
                borderRadius:  "var(--lwd-radius-input)",
              }}
            >
              Done
            </button>
          </>
        )}
      </div>
    </>
  );

  return createPortal(modal, document.body);
}
