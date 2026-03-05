// ─── src/components/sections/EditorialWeddingsShowcase.jsx ──────────────────────
// Horizontal slider of real weddings from multiple planners.
// "The Latest Masterpieces" — single row, scrollable with SliderNav arrows.

import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import SliderNav from "../ui/SliderNav";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

// ── Single Wedding Slider Card ──────────────────────────────────────────────
function WeddingSliderCard({ wedding }) {
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
        position:       "relative",
        width:          300,
        minWidth:       300,
        height:         320,
        overflow:       "hidden",
        borderRadius:   "var(--lwd-radius-card)",
        textDecoration: "none",
        scrollSnapAlign: "start",
        flexShrink:     0,
      }}
    >
      {/* Image */}
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

      {/* Gradient overlay */}
      <div
        aria-hidden="true"
        style={{
          position:   "absolute",
          inset:      0,
          background: hov
            ? "linear-gradient(180deg, transparent 25%, rgba(4,3,2,0.9) 100%)"
            : "linear-gradient(180deg, transparent 35%, rgba(4,3,2,0.8) 100%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* Content overlay */}
      <div
        style={{
          position: "absolute",
          bottom:   0,
          left:     0,
          right:    0,
          padding:  "18px",
        }}
      >
        <div
          style={{
            fontFamily: GD,
            fontSize:   17,
            fontWeight: 500,
            fontStyle:  "italic",
            color:      "#ffffff",
            lineHeight: 1.25,
            marginBottom: 5,
          }}
        >
          {wedding.title}
        </div>

        {wedding.location && (
          <div
            style={{
              fontFamily:   NU,
              fontSize:     11,
              color:        "rgba(255,255,255,0.5)",
              marginBottom: 6,
            }}
          >
            {wedding.location}
          </div>
        )}

        <div
          style={{
            fontFamily:    NU,
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: "0.8px",
            color:         GOLD,
            opacity:       0.85,
            marginBottom:  6,
          }}
        >
          Planned by {wedding.plannerName}
        </div>

        <div
          style={{
            fontFamily:    NU,
            fontSize:      10,
            fontWeight:    600,
            letterSpacing: "0.8px",
            textTransform: "uppercase",
            color:         hov ? GOLD : "rgba(255,255,255,0.45)",
            transition:    "color 0.2s",
          }}
        >
          Read story ›
        </div>
      </div>
    </a>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function EditorialWeddingsShowcase({ weddings = [] }) {
  const C = useTheme();
  if (!weddings.length) return null;

  return (
    <div>
      {/* Section heading */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
        <div style={{ width: 28, height: 1, background: C.gold }} />
        <span
          style={{
            fontFamily:    NU,
            fontSize:      9,
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color:         C.gold,
            fontWeight:    600,
          }}
        >
          ✦ The Latest Masterpieces
        </span>
      </div>
      <h2
        style={{
          fontFamily: GD,
          fontSize:   28,
          fontWeight: 400,
          color:      C.white,
          lineHeight: 1.2,
          margin:     "0 0 8px",
        }}
      >
        Real Weddings by Our{" "}
        <span style={{ fontStyle: "italic", color: GOLD }}>Featured Planners</span>
      </h2>
      <p
        style={{
          fontFamily:   NU,
          fontSize:     13,
          color:        C.grey,
          lineHeight:   1.6,
          marginBottom: 28,
          maxWidth:     600,
        }}
      >
        Every celebration tells a story. Browse the latest real weddings crafted
        by Italy's finest planning studios.
      </p>

      {/* Horizontal slider */}
      <SliderNav cardWidth={300} gap={16}>
        {weddings.map((w, i) => (
          <WeddingSliderCard key={`${w.title}-${i}`} wedding={w} />
        ))}
      </SliderNav>
    </div>
  );
}
