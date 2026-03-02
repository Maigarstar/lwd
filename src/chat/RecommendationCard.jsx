// ─── src/chat/RecommendationCard.jsx ─────────────────────────────────────────
import { useState } from "react";
import { useShortlist } from "../shortlist/ShortlistContext";
import Icon, { StarRating } from "./Icons";
import CuratedIndexBadge from "../components/ui/CuratedIndexBadge";

const GOLD = "#C9A84C";

function getT(dark) {
  if (dark) return {
    cardBg:      "rgba(255,255,255,0.02)",
    cardHovBg:   "rgba(255,255,255,0.04)",
    border:      "rgba(255,255,255,0.07)",
    borderHov:   "rgba(201,168,76,0.28)",
    nameColor:   "#f5f0e8",
    locColor:    "rgba(245,240,232,0.38)",
    ratingColor: "rgba(245,240,232,0.45)",
    capColor:    "rgba(245,240,232,0.32)",
    divider:     "rgba(255,255,255,0.06)",
    qvColor:     "rgba(245,240,232,0.45)",
    qvBg:        "rgba(255,255,255,0.04)",
    qvBorder:    "rgba(255,255,255,0.1)",
    tagColor:    "rgba(201,168,76,0.65)",
    tagBorder:   "rgba(201,168,76,0.18)",
  };
  return {
    cardBg:      "#FFFFFF",
    cardHovBg:   "#FDFCFA",
    border:      "rgba(26,23,20,0.1)",
    borderHov:   "rgba(201,168,76,0.4)",
    nameColor:   "#1A1714",
    locColor:    "rgba(26,23,20,0.45)",
    ratingColor: "rgba(26,23,20,0.5)",
    capColor:    "rgba(26,23,20,0.4)",
    divider:     "rgba(26,23,20,0.08)",
    qvColor:     "rgba(26,23,20,0.5)",
    qvBg:        "rgba(26,23,20,0.04)",
    qvBorder:    "rgba(26,23,20,0.12)",
    tagColor:    "#8B7432",
    tagBorder:   "rgba(201,168,76,0.3)",
  };
}

export default function RecommendationCard({ item, darkMode = true, onQuickView, onViewFull }) {
  const { isShortlisted, toggleItem } = useShortlist();
  const [hov, setHov] = useState(false);
  const saved    = isShortlisted(item.id);
  const isVendor = item.type === "vendor";
  const features = item.specialties || item.styles || [];
  const T = getT(darkMode);

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        borderRadius: "var(--lwd-radius-card)",
        overflow:     "hidden",
        background:   hov ? T.cardHovBg : T.cardBg,
        border:       `1px solid ${hov ? T.borderHov : T.border}`,
        boxShadow:    hov ? "0 4px 20px rgba(0,0,0,0.08)" : "0 1px 6px rgba(0,0,0,0.04)",
        transition:   "all 0.25s",
        marginBottom: 14,
      }}
    >
      {/* ── Image — clicking opens Quick View ── */}
      <div
        onClick={() => onQuickView?.(item)}
        style={{
          height:     152,
          position:   "relative",
          overflow:   "hidden",
          cursor:     "pointer",
          background: "#0a0806",
        }}
      >
        <img
          src={item.imgs?.[0] ?? ""}
          alt={item.name}
          loading="lazy"
          style={{
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            transform:  hov ? "scale(1.05)" : "scale(1)",
            transition: "transform 0.55s ease",
          }}
        />
        {/* Gradient */}
        <div
          aria-hidden="true"
          style={{
            position:   "absolute",
            inset:      0,
            background: "linear-gradient(180deg, transparent 38%, rgba(0,0,0,0.55) 100%)",
          }}
        />

        {/* Online dot — top-left */}
        <div
          style={{
            position:   "absolute",
            top:        8,
            left:       8,
            display:    "flex",
            alignItems: "center",
            gap:        4,
            background: "rgba(0,0,0,0.45)",
            borderRadius: 20,
            padding:    "2px 7px 2px 5px",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              width:        5,
              height:       5,
              borderRadius: "50%",
              background:   item.online ? "#22c55e" : "#6b7280",
              animation:    item.online ? "lwd-status-pulse 2s ease-in-out infinite" : "none",
              flexShrink:   0,
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-body)",
              fontSize:   8,
              color:      item.online ? "#22c55e" : "rgba(255,255,255,0.3)",
            }}
          >
            {item.online ? "Online" : "Offline"}
          </span>
        </div>

        {/* Tag or category badge */}
        {(item.tag || isVendor) && (
          <div
            style={{
              position:      "absolute",
              bottom:        8,
              left:          8,
              padding:       "3px 8px",
              borderRadius:  "var(--lwd-radius-input)",
              background:    "rgba(201,168,76,0.92)",
              fontSize:      9,
              fontWeight:    700,
              letterSpacing: "1px",
              textTransform: "uppercase",
              color:         "#0f0d0a",
            }}
          >
            {item.tag ?? item.category}
          </div>
        )}

        {/* Save */}
        <button
          onClick={(e) => { e.stopPropagation(); toggleItem(item); }}
          aria-label={saved ? `Remove ${item.name} from shortlist` : `Save ${item.name}`}
          aria-pressed={saved}
          style={{
            position:       "absolute",
            top:            8,
            right:          8,
            width:          28,
            height:         28,
            borderRadius:   "50%",
            background:     saved ? "rgba(201,168,76,0.92)" : "rgba(0,0,0,0.45)",
            border:         "none",
            color:          saved ? "#0f0d0a" : "rgba(255,255,255,0.8)",
            cursor:         "pointer",
            fontSize:       13,
            display:        "flex",
            alignItems:     "center",
            justifyContent: "center",
          }}
        >
          <Icon name={saved ? "heartFilled" : "heart"} size={13} />
        </button>
      </div>

      {/* ── Content ── */}
      <div style={{ padding: "11px 13px 13px" }}>
        {/* Name + verified */}
        <div
          style={{
            display:        "flex",
            alignItems:     "flex-start",
            justifyContent: "space-between",
            marginBottom:   2,
          }}
        >
          <div
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize:   16,
              fontWeight: 500,
              color:      T.nameColor,
              lineHeight: 1.2,
              flex:       1,
            }}
          >
            {item.name}
          </div>
          {item.verified && (
            <span
              aria-label="Verified"
              style={{
                display:      "flex",
                alignItems:   "center",
                fontSize:     8,
                color:        "#22c55e",
                border:       "1px solid rgba(34,197,94,0.25)",
                padding:      "2px 5px",
                borderRadius: "var(--lwd-radius-input)",
                marginLeft:   6,
                flexShrink:   0,
                whiteSpace:   "nowrap",
                alignSelf:    "flex-start",
              }}
            >
              <Icon name="checkCircle" size={9} color="#22c55e" />
            </span>
          )}
        </div>

        {/* Location */}
        <div
          style={{
            fontFamily:   "var(--font-body)",
            fontSize:     10,
            color:        T.locColor,
            marginBottom: 7,
          }}
        >
          {item.city}, {item.region}
        </div>

        {/* Rating */}
        {item.lwdScore && (
          <div style={{ marginBottom: 5 }}>
            <CuratedIndexBadge score={item.lwdScore} />
          </div>
        )}

        {item.rating && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 7 }}
          >
            <StarRating rating={item.rating} size={10} />
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize:   10,
                color:      T.ratingColor,
              }}
            >
              {item.rating} ({item.reviews})
            </span>
          </div>
        )}

        {/* Features */}
        {features.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
            {features.slice(0, 3).map((f) => (
              <span
                key={f}
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      9,
                  color:         T.tagColor,
                  border:        `1px solid ${T.tagBorder}`,
                  borderRadius:  "var(--lwd-radius-input)",
                  padding:       "2px 6px",
                  letterSpacing: "0.2px",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        )}

        {/* Footer: price + Quick View + View */}
        <div
          style={{
            display:        "flex",
            justifyContent: "space-between",
            alignItems:     "center",
            paddingTop:     8,
            borderTop:      `1px solid ${T.divider}`,
          }}
        >
          <div>
            <div
              style={{
                fontFamily:    "var(--font-heading-primary)",
                fontSize:      18,
                color:         GOLD,
                fontWeight:    600,
                letterSpacing: "0.3px",
                lineHeight:    1,
              }}
            >
              {item.priceFrom}
            </div>
            {item.capacity && (
              <div
                style={{
                  fontFamily:    "var(--font-body)",
                  fontSize:      9,
                  color:         T.capColor,
                  marginTop:     3,
                  letterSpacing: "0.3px",
                  opacity:       0.7,
                }}
              >
                Up to {item.capacity} guests
              </div>
            )}
          </div>

          {/* Two buttons: Quick View + View */}
          <div style={{ display: "flex", gap: 6 }}>
            <button
              onClick={() => onQuickView?.(item)}
              style={{
                fontFamily:    "var(--font-body)",
                fontSize:      9,
                fontWeight:    600,
                letterSpacing: "0.8px",
                textTransform: "uppercase",
                color:         T.qvColor,
                background:    T.qvBg,
                border:        `1px solid ${T.qvBorder}`,
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "5px 9px",
                cursor:        "pointer",
                transition:    "all 0.2s",
                display:       "flex",
                alignItems:    "center",
                gap:           3,
              }}
            >
              <Icon name="eye" size={10} /> Quick View
            </button>
            <button
              onClick={() => onViewFull?.(item)}
              style={{
                fontFamily:    "var(--font-body)",
                fontSize:      10,
                fontWeight:    600,
                letterSpacing: "1px",
                textTransform: "uppercase",
                color:         GOLD,
                background:    "rgba(201,168,76,0.09)",
                border:        "1px solid rgba(201,168,76,0.22)",
                borderRadius:  "var(--lwd-radius-input)",
                padding:       "5px 10px",
                cursor:        "pointer",
                display:       "flex",
                alignItems:    "center",
                gap:           3,
              }}
            >
              View <Icon name="arrowRight" size={10} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
