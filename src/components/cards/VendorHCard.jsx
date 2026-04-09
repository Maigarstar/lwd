// ─── src/components/cards/VendorHCard.jsx ──────────────────────────────────────
// Horizontal vendor card for list view — shows specialties, styles (no price/capacity)
import { useState, useEffect, useRef } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";
import Pill from "../ui/Pill";
import { GoldBadge, VerifiedBadge } from "../ui/Badges";

export default function VendorHCard({ v, saved, onSave, onView, onQuickView }) {
  const C = useTheme();
  const [imgIdx, setImgIdx]     = useState(0);
  const [hov, setHov]           = useState(false);
  const [hovView, setHovView]   = useState(false);
  const [hovQV, setHovQV]       = useState(false);
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

  useEffect(() => () => clearInterval(timerRef.current), []);

  return (
    <>
      <article
        aria-label={v.name}
        className="lwd-vendor-hcard"
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
        {/* ── Image panel, 40% flex ── */}
        <div
          className="lwd-vendor-hcard-image"
          style={{
            flex:       "0 0 40%",
            maxWidth:   500,
            position:   "relative",
            overflow:   "hidden",
            background: "#0a0806",
          }}
        >
          {v.imgs?.map((imgObj, i) => (
            <img
              key={i}
              src={typeof imgObj === 'string' ? imgObj : imgObj.src}
              alt={typeof imgObj === 'string' ? `${v.name} photo` : (imgObj.alt || `${v.name} photo ${i + 1}`)}
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

          {/* Save button */}
          <button
            onClick={(e) => { e.stopPropagation(); onSave?.(v.id); }}
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
          {v.imgs && v.imgs.length > 1 && (
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
                    borderRadius: 2,
                    background: i === imgIdx ? "#C9A84C" : "rgba(255,255,255,0.3)",
                    transition: "all 0.3s",
                  }}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Content panel, 60% flex ── */}
        <div
          className="lwd-vendor-hcard-content"
          style={{
            flex:      "1 1 60%",
            padding:   "20px 24px",
            display:   "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          {/* Header: Name + Verified */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <h3
                style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize: 18,
                  fontWeight: 600,
                  color: C.off,
                  margin: 0,
                }}
              >
                {v.name}
              </h3>
              {v.verified && <VerifiedBadge />}
            </div>
            {v.category && (
              <p style={{ fontFamily: "var(--font-body)", fontSize: 12, color: C.grey, margin: 0, opacity: 0.7, textTransform: "capitalize" }}>
                {v.category}
              </p>
            )}
          </div>

          {/* Location */}
          {v.city && (
            <p style={{ fontFamily: "var(--font-body)", fontSize: 13, color: C.grey, margin: "0 0 8px", opacity: 0.8 }}>
              📍 {v.city} {v.region && `, ${v.region}`}
            </p>
          )}

          {/* Specialties/Styles */}
          {(v.specialties || v.styles) && (
            <div style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {(v.specialties || v.styles)?.slice(0, 3).map((specialty, i) => (
                  <Pill key={i} text={specialty} small />
                ))}
              </div>
            </div>
          )}

          {/* Rating */}
          {v.rating && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
              <Stars r={v.rating} size={12} />
              <span style={{ fontFamily: "var(--font-body)", fontSize: 12, color: C.grey }}>
                {v.rating} ({v.reviews || 0})
              </span>
            </div>
          )}

          {/* CTAs */}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => onView?.(v)}
              onMouseEnter={() => setHovView(true)}
              onMouseLeave={() => setHovView(false)}
              style={{
                flex: 1,
                padding: "8px 12px",
                background: hovView ? "rgba(201,168,76,0.15)" : "transparent",
                border: `1px solid ${hovView ? "#C9A84C" : C.border}`,
                borderRadius: "var(--lwd-radius-input)",
                color: hovView ? "#C9A84C" : C.grey,
                cursor: "pointer",
                fontFamily: "var(--font-body)",
                fontSize: 11,
                fontWeight: 600,
                textTransform: "uppercase",
                transition: "all 0.2s",
              }}
            >
              Profile →
            </button>
            {onQuickView && (
              <button
                onClick={() => onQuickView?.(v)}
                onMouseEnter={() => setHovQV(true)}
                onMouseLeave={() => setHovQV(false)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  background: hovQV ? "rgba(201,168,76,0.15)" : "transparent",
                  border: `1px solid ${hovQV ? "#C9A84C" : C.border}`,
                  borderRadius: "var(--lwd-radius-input)",
                  color: hovQV ? "#C9A84C" : C.grey,
                  cursor: "pointer",
                  fontFamily: "var(--font-body)",
                  fontSize: 11,
                  fontWeight: 600,
                  textTransform: "uppercase",
                  transition: "all 0.2s",
                }}
              >
                Quick View
              </button>
            )}
          </div>
        </div>
      </article>
    </>
  );
}
