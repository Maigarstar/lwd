// src/components/cards/VenueListItemCard.jsx
// Compact horizontal card for the venue list+map view.
// Image left (~180px) · content right · highlight on hover or map pin active.

import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import Stars from "../ui/Stars";

const GOLD = "#C9A84C";
const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";

export default function VenueListItemCard({ v, onView, isHighlighted }) {
  const C   = useTheme();
  const [hov, setHov] = useState(false);

  const imgSrc = typeof v.imgs?.[0] === "string" ? v.imgs[0] : v.imgs?.[0]?.src || v.imgs?.[0]?.url || "";
  const active = hov || isHighlighted;

  const price = v.priceFrom || v.price || null;
  const guests = v.capacity || v.maxGuests || null;
  const style  = v.styles?.[0] || v.style || null;

  return (
    <article
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      onClick={() => onView?.(v)}
      style={{
        display:        "flex",
        flexDirection:  "row",
        alignItems:     "stretch",
        background:     active ? "rgba(201,168,76,0.04)" : C.card,
        border:         `1px solid ${active ? "rgba(201,168,76,0.3)" : C.border}`,
        borderRadius:   "var(--lwd-radius-card)",
        overflow:       "hidden",
        cursor:         "pointer",
        transition:     "all 0.25s ease",
        boxShadow:      active ? "0 4px 20px rgba(0,0,0,0.2)" : "none",
        flexShrink:     0,
      }}
    >
      {/* Image */}
      <div style={{
        width:      180,
        minWidth:   180,
        position:   "relative",
        overflow:   "hidden",
        background: "#0a0806",
        flexShrink: 0,
      }}>
        {imgSrc && (
          <img
            src={imgSrc}
            alt={v.name}
            loading="lazy"
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              transform: active ? "scale(1.05)" : "scale(1)",
              transition: "transform 0.7s ease",
              display: "block",
            }}
          />
        )}
        {/* Featured badge */}
        {(v.featured || v.tag) && (
          <div style={{ position: "absolute", top: 8, left: 8 }}>
            <span style={{
              fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "1px",
              textTransform: "uppercase", color: "#0f0d0a",
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              borderRadius: 20, padding: "3px 8px",
            }}>{v.featured ? "Editor's Pick" : v.tag}</span>
          </div>
        )}
        {/* Verified badge */}
        {v.verified && (
          <div style={{ position: "absolute", bottom: 8, right: 8 }}>
            <span style={{
              fontFamily: NU, fontSize: 7, fontWeight: 600, letterSpacing: "0.5px",
              color: "#22c55e", background: "rgba(0,0,0,0.7)", borderRadius: 20,
              padding: "2px 7px", display: "flex", alignItems: "center", gap: 3,
            }}>✓ Verified</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div style={{
        flex:           1,
        padding:        "14px 16px",
        display:        "flex",
        flexDirection:  "column",
        justifyContent: "space-between",
        minWidth:       0,
      }}>
        {/* Top: name + location */}
        <div>
          <div style={{
            fontFamily: GD, fontSize: 15, fontStyle: "italic", fontWeight: 500,
            color: C.white, lineHeight: 1.2, marginBottom: 3,
            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          }}>
            {v.name}
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, color: C.grey, marginBottom: 8 }}>
            {v.city}{v.region ? `, ${v.region}` : ""}
          </div>

          {/* Style pill + rating */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", marginBottom: 6 }}>
            {style && (
              <span style={{
                fontFamily: NU, fontSize: 7, fontWeight: 700, letterSpacing: "1px",
                textTransform: "uppercase", color: GOLD,
                background: "rgba(201,168,76,0.12)", border: "1px solid rgba(201,168,76,0.25)",
                borderRadius: 20, padding: "2px 7px", flexShrink: 0,
              }}>{style}</span>
            )}
            {v.rating > 0 && (
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <Stars rating={v.rating} size={9} color={GOLD} />
                <span style={{ fontFamily: NU, fontSize: 9, color: C.grey }}>
                  {v.rating.toFixed(1)} ({v.reviews || v.reviewCount || 0})
                </span>
              </div>
            )}
          </div>

          {/* Capacity */}
          {guests && (
            <div style={{ fontFamily: NU, fontSize: 9, color: C.grey, marginBottom: 4 }}>
              ✦ Up to {guests} guests
            </div>
          )}
        </div>

        {/* Bottom: price + actions */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          {price && (
            <div>
              <span style={{ fontFamily: NU, fontSize: 8, color: C.grey, textTransform: "uppercase", letterSpacing: "0.5px" }}>From </span>
              <span style={{ fontFamily: GD, fontSize: 14, color: C.white, fontStyle: "italic" }}>{price}</span>
            </div>
          )}
          <div style={{ display: "flex", gap: 6, marginLeft: "auto" }}>
            <button
              onClick={(e) => { e.stopPropagation(); onView?.(v); }}
              style={{
                fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: "1px",
                textTransform: "uppercase", color: "#0f0d0a",
                background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
                border: "none", borderRadius: 4, padding: "5px 10px",
                cursor: "pointer",
              }}
            >
              Profile
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
