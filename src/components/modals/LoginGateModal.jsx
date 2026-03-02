// ─── src/components/modals/LoginGateModal.jsx ─────────────────────────────────
import { useState, useEffect } from "react";

export default function LoginGateModal({ onClose }) {
  const [joined,  setJoined]  = useState(false);
  const [visible, setVisible] = useState(false);

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  // ESC close
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position:             "fixed",
          inset:                0,
          zIndex:               1300,
          background:           "rgba(0,0,0,0.65)",
          backdropFilter:       "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          opacity:              visible ? 1 : 0,
          transition:           "opacity 0.2s ease",
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Sign in required"
        onClick={(e) => e.stopPropagation()}
        style={{
          position:      "fixed",
          top:           "50%",
          left:          "50%",
          transform:     visible
            ? "translate(-50%,-50%) scale(1)"
            : "translate(-50%,-50%) scale(0.94)",
          opacity:       visible ? 1 : 0,
          transition:    "transform 0.25s ease, opacity 0.25s ease",
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
            color:          "#C9A84C",
            margin:         "0 auto 20px",
          }}
        >
          ✦
        </div>

        {!joined ? (
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
              Sign in to chat
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
              Direct messaging with venues and vendors is available to registered
              members. Join our waitlist to be first in line when accounts launch.
            </p>

            <button
              onClick={() => setJoined(true)}
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
                marginBottom:  12,
                transition:    "opacity 0.2s",
              }}
            >
              Join the Waitlist
            </button>

            <button
              onClick={onClose}
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
              ✓ You're on the list
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
              We'll notify you as soon as member accounts are available.
              Thank you for your interest.
            </p>
            <button
              onClick={onClose}
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
}
