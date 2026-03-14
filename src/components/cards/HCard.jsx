// ─── src/components/cards/HCard.jsx ──────────────────────────────────────────
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";
import Pill from "../ui/Pill";
import { GoldBadge, VerifiedBadge } from "../ui/Badges";
import CuratedIndexBadge from "../ui/CuratedIndexBadge";
import LoginGateModal from "../modals/LoginGateModal";

export default function HCard({ v, saved, onSave, onView, onQuickView }) {
  const C = useTheme();
  const [imgIdx, setImgIdx]     = useState(0);
  const [hov, setHov]           = useState(false);
  const [hovView, setHovView]   = useState(false);
  const [hovQV, setHovQV]       = useState(false);
  const [hovChat, setHovChat]   = useState(false);
  const [loginGate, setLoginGate] = useState(false);
  const timerRef                = useRef(null);

  const handleEnter = () => {
    setHov(true);
    timerRef.current = setInterval(
      () => setImgIdx((i) => (i + 1) % v.imgs.length),
      1400
    );
  };

  const handleLeave = () => {
    setHov(false);
    clearInterval(timerRef.current);
    setImgIdx(0);
  };

  // Cleanup on unmount
  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <>
      <article
        aria-label={v.name}
        className="lwd-hcard"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        style={{
          display:    "flex",
          background: C.card,
          border:     `1px solid ${hov ? C.goldDim : C.border}`,
          borderLeft: `3px solid ${hov ? C.gold : C.border}`,
          borderRadius: "var(--lwd-radius-card)",
          marginBottom: 12,
          overflow:   "hidden",
          transition: "all 0.3s ease",
          boxShadow:  hov ? "0 12px 40px rgba(0,0,0,0.12)" : "none",
        }}
      >
        {/* ── Image panel, 40% flex, max 500px ── */}
        <div
          className="lwd-hcard-image"
          style={{
            flex:       "0 0 40%",
            maxWidth:   500,
            position:   "relative",
            overflow:   "hidden",
            background: "#0a0806",
          }}
        >
          {v.imgs.map((src, i) => (
            <img
              key={i}
              src={src}
              alt={i === 0 ? `${v.name} main photo` : `${v.name} photo ${i + 1}`}
              loading="lazy"
              style={{
                position: "absolute",
                inset: 0,
                width:   "100%",
                height:  "100%",
                objectFit: "cover",
                opacity: i === imgIdx ? 1 : 0,
                transform: i === imgIdx && hov ? "scale(1.06)" : "scale(1)",
                transition: "opacity 0.6s ease, transform 4s ease",
              }}
            />
          ))}

          {/* Dark edge gradient */}
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(90deg,transparent 60%,rgba(0,0,0,0.4) 100%)",
            }}
          />

          {/* Featured shimmer */}
          {v.featured && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 2,
                background: "linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
                backgroundSize: "200%",
                animation: "shimmer 3s linear infinite",
              }}
            />
          )}

          {/* Save button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSave(v.id); }}
            aria-label={saved ? `Remove ${v.name} from saved` : `Save ${v.name}`}
            aria-pressed={saved}
            style={{
              position:   "absolute",
              top:        10,
              right:      10,
              width:      32,
              height:     32,
              borderRadius: "50%",
              background: saved ? "rgba(201,168,76,0.9)" : "rgba(0,0,0,0.45)",
              border:     "none",
              color:      saved ? "#0f0d0a" : "rgba(255,255,255,0.8)",
              cursor:     "pointer",
              fontSize:   14,
              display:    "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
          >
            ♡
          </button>

          {/* Image indicator dots */}
          {v.imgs.length > 1 && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                bottom: 8,
                left: 0,
                right: 0,
                display: "flex",
                justifyContent: "center",
                gap: 4,
              }}
            >
              {v.imgs.map((_, i) => (
                <div
                  key={i}
                  style={{
                    width:      i === imgIdx ? 16 : 4,
                    height:     2,
                    background: i === imgIdx ? "#C9A84C" : "rgba(255,255,255,0.4)",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Content ── */}
        <div
          className="lwd-hcard-content"
          style={{
            flex: 1,
            padding: "22px 28px",
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Badges row (tag + verified + featured + online status) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 12,
              flexWrap: "wrap",
            }}
          >
            {v.tag && <GoldBadge text={v.tag} />}
            {v.verified && <VerifiedBadge />}
            {v.lwdScore && <CuratedIndexBadge score={v.lwdScore} />}
            {v.featured && (
              <span
                style={{
                  fontSize: 9,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  color: C.gold,
                  fontFamily: "var(--font-body)",
                  fontWeight: 600,
                }}
              >
                ✦ Featured
              </span>
            )}

            {/* Online indicator, pushed right */}
            <div
              style={{
                display:    "flex",
                alignItems: "center",
                gap:        5,
                marginLeft: "auto",
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width:        6,
                  height:       6,
                  borderRadius: "50%",
                  background:   v.online ? "#22c55e" : "#4b5563",
                  boxShadow:    v.online ? "0 0 0 2px rgba(34,197,94,0.22)" : "none",
                  animation:    v.online ? "lwd-status-pulse 2s ease-in-out infinite" : "none",
                  flexShrink:   0,
                }}
              />
              <span
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      9,
                  color:         v.online ? "#22c55e" : "rgba(255,255,255,0.25)",
                  letterSpacing: "0.4px",
                }}
              >
                {v.online ? "Online" : "Offline"}
              </span>
            </div>
          </div>

          {/* Name */}
          {v.showcaseUrl && (
            <a href={v.showcaseUrl} onClick={(e) => e.stopPropagation()} style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              marginBottom: 14, marginTop: -4,
              padding: "3px 9px", borderRadius: 20,
              background: "rgba(255,255,255,0.12)", backdropFilter: "blur(6px)",
              border: "1px solid rgba(255,255,255,0.25)",
              textDecoration: "none",
            }}>
              <span style={{ color: "#fff", fontSize: 7, lineHeight: 1 }}>✦</span>
              <span style={{ fontFamily: "var(--font-body)", fontSize: 8, fontWeight: 700, letterSpacing: "1.2px", textTransform: "uppercase", color: "#fff" }}>A Showcase Property</span>
            </a>
          )}
          <h3
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 26,
              fontWeight: 500,
              color: C.white,
              lineHeight: 1.1,
              marginBottom: 6,
              letterSpacing: "-0.3px",
            }}
          >
            {v.name}
          </h3>

          {/* Location */}
          <div
            style={{
              fontSize: 12,
              color: C.grey,
              marginBottom: 10,
              display: "flex",
              alignItems: "center",
              gap: 6,
              fontFamily: "var(--font-body)",
            }}
          >
            <span aria-hidden="true" style={{ color: C.gold, fontSize: 10 }}>◆</span>
            {v.city}, {v.region} · Italy
          </div>

          {/* Stars + reviews */}
          <div
            style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}
            aria-label={`Rating: ${v.rating} out of 5, ${v.reviews} reviews`}
          >
            <Stars r={v.rating} />
            <span style={{ fontSize: 12, color: C.gold, fontWeight: 700 }}>{v.rating}</span>
            <span style={{ fontSize: 11, color: C.grey }}>({v.reviews} reviews)</span>
          </div>

          {/* Description */}
          <p
            style={{
              fontSize: 13,
              color: C.grey,
              lineHeight: 1.75,
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              marginBottom: 14,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {v.desc}
          </p>

          {/* Style pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
            {v.styles.map((s) => (
              <Pill key={s} text={s} />
            ))}
          </div>

          {/* Inclusions */}
          <div
            style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}
            aria-label="Key inclusions"
          >
            {v.includes.slice(0, 3).map((inc, i) => (
              <span
                key={i}
                style={{
                  fontSize: 11,
                  color: C.grey2,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "var(--font-body)",
                }}
              >
                <span aria-hidden="true" style={{ color: C.green, fontSize: 10 }}>✓</span>
                {inc}
              </span>
            ))}
          </div>

          {/* Footer: capacity + price + CTAs */}
          <div
            style={{
              marginTop: "auto",
              paddingTop: 14,
              borderTop: `1px solid ${C.border}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {/* Stats */}
            <div style={{ display: "flex", gap: 20 }}>
              <div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: C.grey,
                    marginBottom: 2,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  Capacity
                </div>
                <div style={{ fontSize: 13, color: C.white, fontWeight: 600 }}>
                  Up to {v.capacity}
                </div>
              </div>
              <div>
                <div
                  style={{
                    fontSize: 9,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: C.grey,
                    marginBottom: 2,
                    fontFamily: "var(--font-body)",
                  }}
                >
                  From
                </div>
                <div
                  style={{
                    fontSize: 14,
                    color: C.gold,
                    fontFamily: "var(--font-heading-primary)",
                    fontWeight: 500,
                  }}
                >
                  {v.priceFrom}
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="lwd-hcard-btns" style={{ display: "flex", gap: 8 }}>
              {/* View Venue, primary */}
              <button
                onClick={() => onView(v)}
                onMouseEnter={() => setHovView(true)}
                onMouseLeave={() => setHovView(false)}
                style={{
                  background:    `linear-gradient(135deg,${C.gold},${C.gold2})`,
                  border:        "none",
                  borderRadius:   "var(--lwd-radius-input)",
                  color:         "#fff",
                  padding:       "10px 20px",
                  fontSize:       11,
                  fontWeight:     700,
                  letterSpacing: "1.5px",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  opacity:        hovView ? 0.88 : 1,
                  transition:    "opacity 0.2s",
                }}
              >
                View Venue
              </button>

              {/* Quick View, secondary */}
              <button
                onClick={() => onQuickView?.(v)}
                onMouseEnter={() => setHovQV(true)}
                onMouseLeave={() => setHovQV(false)}
                style={{
                  background:    hovQV ? "rgba(201,168,76,0.08)" : "none",
                  border:        `1px solid ${hovQV ? C.gold : C.border2}`,
                  borderRadius:   "var(--lwd-radius-input)",
                  color:          hovQV ? C.gold : C.grey,
                  padding:       "10px 16px",
                  fontSize:       11,
                  fontWeight:     600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  transition:    "all 0.2s",
                }}
              >
                Quick View
              </button>

              {/* Chat, online-aware */}
              <button
                onClick={() => setLoginGate(true)}
                onMouseEnter={() => setHovChat(true)}
                onMouseLeave={() => setHovChat(false)}
                style={{
                  background: v.online
                    ? hovChat
                      ? "rgba(34,197,94,0.15)"
                      : "rgba(34,197,94,0.08)"
                    : "none",
                  border:        v.online
                    ? `1px solid ${hovChat ? "#22c55e" : "rgba(34,197,94,0.35)"}`
                    : `1px solid ${C.border2}`,
                  borderRadius:   "var(--lwd-radius-input)",
                  color:          v.online ? "#22c55e" : C.grey,
                  padding:       "10px 16px",
                  fontSize:       11,
                  fontWeight:     600,
                  letterSpacing: "1px",
                  textTransform: "uppercase",
                  cursor:        "pointer",
                  fontFamily:    "inherit",
                  transition:    "all 0.2s",
                  display:    "flex",
                  alignItems: "center",
                  gap:        5,
                }}
                aria-label={v.online ? "Chat with venue" : "Send a message"}
              >
                {v.online && (
                  <span
                    aria-hidden="true"
                    style={{
                      width:        5,
                      height:       5,
                      borderRadius: "50%",
                      background:   "#22c55e",
                      animation:    "lwd-status-pulse 2s ease-in-out infinite",
                      flexShrink:   0,
                    }}
                  />
                )}
                {v.online ? "Chat" : "Message"}
              </button>
            </div>
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
