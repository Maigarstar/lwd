// ─── src/components/sections/PlannerRealWeddings.jsx ──────────────────────────
// Max 6 real wedding cards in auto-fit grid.
// Each card: image top, italic serif title, optional location, "Read story ›" link.
// Returns null if no weddings. Used in WeddingPlannersPage spotlight + profile pages.

import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const GOLD = "#C9A84C";

function WeddingCard({ wedding }) {
  const C = useTheme();
  const [hov, setHov] = useState(false);

  return (
    <a
      href={wedding.blogUrl}
      target="_blank"
      rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:        "block",
        textDecoration: "none",
        borderRadius:   "var(--lwd-radius-card)",
        overflow:       "hidden",
        background:     C.card,
        border:         `1px solid ${hov ? C.goldDim : C.border}`,
        transition:     "all 0.4s ease",
        transform:      hov ? "translateY(-2px)" : "translateY(0)",
        boxShadow:      hov ? "0 8px 28px rgba(0,0,0,0.1)" : "none",
      }}
    >
      {/* Image */}
      <div
        style={{
          height:     180,
          overflow:   "hidden",
          background: "#0a0806",
        }}
      >
        <img
          src={wedding.imageUrl}
          alt={wedding.title}
          loading="lazy"
          style={{
            width:      "100%",
            height:     "100%",
            objectFit:  "cover",
            transform:  hov ? "scale(1.04)" : "scale(1)",
            transition: "transform 0.7s ease",
          }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: "14px 16px 16px" }}>
        {/* Title — italic serif */}
        <div
          style={{
            fontFamily: GD,
            fontSize:   15,
            fontWeight: 500,
            fontStyle:  "italic",
            color:      C.white,
            lineHeight: 1.3,
            marginBottom: wedding.location ? 4 : 8,
          }}
        >
          {wedding.title}
        </div>

        {/* Location */}
        {wedding.location && (
          <div
            style={{
              fontFamily:   NU,
              fontSize:     11,
              color:        C.grey,
              marginBottom: 8,
            }}
          >
            {wedding.location}
          </div>
        )}

        {/* Read story link */}
        <span
          style={{
            fontFamily:    NU,
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color:         hov ? GOLD : C.grey,
            transition:    "color 0.2s",
          }}
        >
          Read story ›
        </span>
      </div>
    </a>
  );
}

export default function PlannerRealWeddings({ weddings, title }) {
  if (!weddings?.length) return null;
  const C = useTheme();

  // Max 6
  const items = weddings.slice(0, 6);

  return (
    <div>
      {title && (
        <div
          style={{
            fontFamily:    NU,
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color:         C.gold,
            opacity:       0.7,
            marginBottom:  16,
          }}
        >
          {title}
        </div>
      )}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
          gap:                 20,
        }}
      >
        {items.map((w, i) => (
          <WeddingCard key={w.blogUrl || i} wedding={w} />
        ))}
      </div>
    </div>
  );
}
