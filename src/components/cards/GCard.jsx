// ─── src/components/cards/GCard.jsx ──────────────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";
import Pill from "../ui/Pill";
import { GoldBadge } from "../ui/Badges";
import CuratedIndexBadge from "../ui/CuratedIndexBadge";
import LoginGateModal from "../modals/LoginGateModal";

export default function GCard({ v, saved, onSave, onView, onQuickView }) {
  const C = useTheme();
  const [hov,       setHov]       = useState(false);
  const [hovView,   setHovView]   = useState(false);
  const [hovQV,     setHovQV]     = useState(false);
  const [hovChat,   setHovChat]   = useState(false);
  const [loginGate, setLoginGate] = useState(false);

  return (
    <>
      <article
        aria-label={v.name}
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        onClick={() => onQuickView?.(v)}
        style={{
          background:  C.card,
          border:      `1px solid ${hov ? C.goldDim : C.border}`,
          borderRadius: "var(--lwd-radius-card)",
          overflow:    "hidden",
          cursor:      "pointer",
          transition:  "all 0.5s ease",
          transform:   hov ? "translateY(-3px)" : "translateY(0)",
          boxShadow:   hov
            ? "0 12px 40px rgba(0,0,0,0.12)"
            : "none",
        }}
      >
        {/* ── Image ── */}
        <div
          style={{
            height:     295,
            position:   "relative",
            overflow:   "hidden",
            background: "#0a0806",
          }}
        >
          <img
            src={v.imgs[0]}
            alt={`${v.name} in ${v.region}`}
            loading="lazy"
            style={{
              width:      "100%",
              height:     "100%",
              objectFit:  "cover",
              transform:  hov ? "scale(1.03)" : "scale(1)",
              transition: "transform 0.8s ease",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position:   "absolute",
              inset:      0,
              background: "linear-gradient(180deg,rgba(0,0,0,0.1) 0%,rgba(0,0,0,0.55) 100%)",
            }}
          />

          {v.tag && (
            <div style={{ position: "absolute", bottom: 12, left: 12 }}>
              <GoldBadge text={v.tag} />
            </div>
          )}

          {/* Online indicator — top-left */}
          <div
            style={{
              position:   "absolute",
              top:        10,
              left:       10,
              display:    "flex",
              alignItems: "center",
              gap:        5,
              background: "rgba(0,0,0,0.45)",
              borderRadius: 20,
              padding:    "3px 8px 3px 6px",
            }}
          >
            <div
              aria-hidden="true"
              style={{
                width:        5,
                height:       5,
                borderRadius: "50%",
                background:   v.online ? "#22c55e" : "#6b7280",
                animation:    v.online ? "lwd-status-pulse 2s ease-in-out infinite" : "none",
                flexShrink:   0,
              }}
            />
            <span
              style={{
                fontFamily:    "var(--font-body)",
                fontSize:      8,
                color:         v.online ? "#22c55e" : "rgba(255,255,255,0.35)",
                letterSpacing: "0.3px",
              }}
            >
              {v.online ? "Online" : "Offline"}
            </span>
          </div>

          {/* Save button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSave(v.id); }}
            aria-label={saved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
            aria-pressed={saved}
            style={{
              position:   "absolute",
              top:        10,
              right:      10,
              width:      30,
              height:     30,
              borderRadius: "50%",
              background: saved ? "rgba(201,168,76,0.9)" : "rgba(0,0,0,0.4)",
              border:     "none",
              color:      saved ? "#0f0d0a" : "rgba(255,255,255,0.8)",
              cursor:     "pointer",
              fontSize:   13,
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>

        {/* ── Content ── */}
        <div style={{ padding: "18px 20px 20px" }}>
          {/* Name + verified */}
          <div
            style={{
              display:       "flex",
              justifyContent: "space-between",
              alignItems:    "flex-start",
              marginBottom:  6,
            }}
          >
            <div>
              <h3
                style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize:   22,
                  fontWeight: 500,
                  color:      C.white,
                  lineHeight: 1.15,
                  marginBottom: 3,
                  letterSpacing: "-0.2px",
                }}
              >
                {v.name}
              </h3>
              <div
                style={{
                  fontSize:   11,
                  color:      C.grey,
                  fontFamily: "var(--font-body)",
                }}
              >
                {v.city}, {v.region}
              </div>
            </div>
            {v.verified && (
              <span
                aria-label="Verified venue"
                style={{
                  fontSize:    8,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  color:       C.green,
                  border:      `1px solid rgba(34,197,94,0.25)`,
                  padding:     "2px 6px",
                  whiteSpace:  "nowrap",
                }}
              >
                ✓
              </span>
            )}
          </div>

          {/* LWD Index */}
          {v.lwdScore && (
            <div style={{ marginBottom: 6 }}>
              <CuratedIndexBadge score={v.lwdScore} />
            </div>
          )}

          {/* Stars */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}
            aria-label={`Rating: ${v.rating} out of 5`}
          >
            <Stars r={v.rating} />
            <span style={{ fontSize: 11, color: C.grey }}>({v.reviews})</span>
          </div>

          {/* Description */}
          {v.desc && (
            <p
              style={{
                fontFamily:      "var(--font-body)",
                fontSize:        12,
                lineHeight:      1.6,
                color:           C.grey,
                fontWeight:      300,
                marginBottom:    12,
                display:         "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow:        "hidden",
              }}
            >
              {v.desc}
            </p>
          )}

          {/* Style pills */}
          <div
            style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}
          >
            {(v.styles || v.specialties || []).slice(0, 2).map((s) => (
              <Pill key={s} text={s} />
            ))}
          </div>

          {/* ── Footer: price + capacity row ── */}
          <div
            style={{
              display:        "flex",
              justifyContent: "space-between",
              alignItems:     "center",
              paddingTop:     12,
              borderTop:      `1px solid ${C.border}`,
              marginBottom:   12,
            }}
          >
            {/* Price */}
            <div>
              <div
                style={{
                  fontSize:      9,
                  color:         C.grey,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  marginBottom:  2,
                }}
              >
                From
              </div>
              <div
                style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize:   15,
                  color:      C.gold,
                  fontWeight: 500,
                }}
              >
                {v.priceFrom}
              </div>
            </div>

            {/* Capacity (venues) or Category (vendors) */}
            {v.capacity ? (
              <div
                style={{ fontSize: 11, color: C.grey, textAlign: "right" }}
                aria-label={`Up to ${v.capacity} guests`}
              >
                <div>Up to {v.capacity}</div>
                <div
                  style={{
                    fontSize:      9,
                    letterSpacing: "1px",
                    textTransform: "uppercase",
                    marginTop:     2,
                  }}
                >
                  guests
                </div>
              </div>
            ) : v.category ? (
              <div
                style={{ fontSize: 11, color: C.grey, textAlign: "right", textTransform: "capitalize" }}
              >
                {v.category}
              </div>
            ) : null}
          </div>

          {/* ── Three-button row ── */}
          <div style={{ display: "flex", gap: 6 }}>

            {/* View Venue — gold filled primary */}
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              onMouseEnter={() => setHovView(true)}
              onMouseLeave={() => setHovView(false)}
              style={{
                flex:          1,
                background:    `linear-gradient(135deg,${C.gold},${C.gold2 ?? "#b8902a"})`,
                border:        "none",
                borderRadius:   "var(--lwd-radius-input)",
                color:         "#fff",
                padding:       "7px 0",
                fontSize:      9,
                fontWeight:    700,
                letterSpacing: "1px",
                textTransform: "uppercase",
                cursor:        "pointer",
                fontFamily:    "var(--font-body)",
                opacity:       hovView ? 0.88 : 1,
                transition:    "opacity 0.2s",
              }}
            >
              View Venue
            </button>

            {/* Quick View — ghost */}
            <button
              onClick={(e) => { e.stopPropagation(); onQuickView?.(v); }}
              onMouseEnter={() => setHovQV(true)}
              onMouseLeave={() => setHovQV(false)}
              style={{
                flex:          1,
                background:    hovQV ? `rgba(255,255,255,0.06)` : "none",
                border:        `1px solid ${C.border}`,
                borderRadius:   "var(--lwd-radius-input)",
                color:         C.grey,
                padding:       "7px 0",
                fontSize:      9,
                fontWeight:    600,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                cursor:        "pointer",
                fontFamily:    "var(--font-body)",
                transition:    "all 0.2s",
              }}
            >
              Quick View
            </button>

            {/* Chat / Message — green if online */}
            <button
              onClick={(e) => { e.stopPropagation(); setLoginGate(true); }}
              onMouseEnter={() => setHovChat(true)}
              onMouseLeave={() => setHovChat(false)}
              style={{
                flex:          1,
                background:    v.online
                  ? hovChat ? "rgba(34,197,94,0.15)" : "rgba(34,197,94,0.08)"
                  : "none",
                border:        v.online
                  ? `1px solid ${hovChat ? "#22c55e" : "rgba(34,197,94,0.3)"}`
                  : `1px solid ${C.border}`,
                borderRadius:   "var(--lwd-radius-input)",
                color:         v.online ? "#22c55e" : C.grey,
                padding:       "7px 0",
                fontSize:      9,
                fontWeight:    600,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                cursor:        "pointer",
                fontFamily:    "var(--font-body)",
                transition:    "all 0.2s",
                display:       "flex",
                alignItems:    "center",
                justifyContent: "center",
                gap:           4,
              }}
              aria-label={v.online ? "Chat with venue" : "Message venue"}
            >
              {v.online && (
                <span
                  aria-hidden="true"
                  style={{
                    width:        4,
                    height:       4,
                    borderRadius: "50%",
                    background:   "#22c55e",
                    animation:    "lwd-status-pulse 2s ease-in-out infinite",
                  }}
                />
              )}
              {v.online ? "Chat" : "Message"}
            </button>
          </div>
        </div>
      </article>

      {/* Login gate modal */}
      {loginGate && (
        <LoginGateModal onClose={() => setLoginGate(false)} />
      )}
    </>
  );
}
