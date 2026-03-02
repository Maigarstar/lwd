// ─── src/chat/ImagePopup.jsx ──────────────────────────────────────────────────
import { useEffect, useRef } from "react";

export default function ImagePopup({ item, onClose }) {
  const innerRef = useRef(null);

  // ESC to close
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose]);

  // Trap focus
  useEffect(() => { innerRef.current?.focus(); }, []);

  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`${item.name} — full view`}
      onClick={onClose}
      style={{
        position:       "fixed",
        inset:          0,
        zIndex:         1500,
        background:     "rgba(0,0,0,0.88)",
        backdropFilter: "blur(14px)",
        WebkitBackdropFilter: "blur(14px)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        padding:        24,
      }}
    >
      <div
        ref={innerRef}
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
        style={{
          position:     "relative",
          maxWidth:     860,
          width:        "100%",
          borderRadius: 16,
          overflow:     "hidden",
          background:   "#0f0d0a",
          boxShadow:    "0 32px 80px rgba(0,0,0,0.75)",
          outline:      "none",
        }}
      >
        {/* Image */}
        <div style={{ position: "relative", height: 460 }}>
          <img
            src={item.imgs?.[0] ?? ""}
            alt={item.name}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          {/* Bottom gradient */}
          <div
            aria-hidden="true"
            style={{
              position:   "absolute",
              bottom:     0,
              left:       0,
              right:      0,
              height:     220,
              background: "linear-gradient(0deg,rgba(15,13,10,1) 0%,rgba(15,13,10,0) 100%)",
            }}
          />
        </div>

        {/* Details */}
        <div style={{ padding: "22px 28px 28px" }}>
          {/* Name */}
          <div
            style={{
              fontFamily:   "var(--font-heading-primary)",
              fontSize:     28,
              fontWeight:   500,
              color:        "#f5f0e8",
              marginBottom: 5,
            }}
          >
            {item.name}
          </div>

          {/* Location + vendor badge */}
          <div
            style={{
              fontFamily:   "var(--font-body)",
              fontSize:     13,
              color:        "rgba(245,240,232,0.45)",
              marginBottom: 18,
              display:      "flex",
              alignItems:   "center",
              gap:          10,
            }}
          >
            <span>{item.city}, {item.region}</span>
            {item.type === "vendor" && (
              <span
                style={{
                  padding:       "2px 8px",
                  borderRadius:  4,
                  background:    "rgba(201,168,76,0.15)",
                  color:         "#C9A84C",
                  fontSize:      9,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  fontWeight:    600,
                }}
              >
                {item.category}
              </span>
            )}
          </div>

          {/* Desc */}
          {item.desc && (
            <div
              style={{
                fontFamily:   "var(--font-body)",
                fontSize:     13,
                lineHeight:   1.65,
                color:        "rgba(245,240,232,0.6)",
                marginBottom: 22,
                maxWidth:     600,
              }}
            >
              {item.desc}
            </div>
          )}

          {/* Stats row */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 32, flexWrap: "wrap" }}
          >
            {item.priceFrom && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(245,240,232,0.3)", marginBottom: 4 }}>From</div>
                <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 22, color: "#C9A84C", fontWeight: 600 }}>
                  {item.priceFrom}
                </div>
              </div>
            )}
            {item.capacity && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(245,240,232,0.3)", marginBottom: 4 }}>Capacity</div>
                <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 22, color: "#f5f0e8", fontWeight: 500 }}>
                  {item.capacity} guests
                </div>
              </div>
            )}
            {item.rating && (
              <div>
                <div style={{ fontSize: 9, letterSpacing: "1.5px", textTransform: "uppercase", color: "rgba(245,240,232,0.3)", marginBottom: 4 }}>Rating</div>
                <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 22, color: "#f5f0e8", fontWeight: 500 }}>
                  ★ {item.rating} <span style={{ fontSize: 13, color: "rgba(245,240,232,0.35)" }}>({item.reviews})</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          style={{
            position:       "absolute",
            top:            14,
            right:          14,
            width:          34,
            height:         34,
            borderRadius:   "50%",
            background:     "rgba(0,0,0,0.55)",
            border:         "1px solid rgba(255,255,255,0.15)",
            color:          "#f5f0e8",
            fontSize:       16,
            cursor:         "pointer",
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
