// ─── src/components/sections/PartnerMarquee.jsx ─────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

const NU = "var(--font-body)";

const PARTNERS = [
  "Four Seasons",
  "The Ritz",
  "Claridge's",
  "Brown's Hotel",
  "Mandarin Oriental",
  "Aman Resorts",
  "Rosewood",
  "The Savoy",
  "Belmond",
  "One&Only",
  "The Dorchester",
  "Raffles",
];

export default function PartnerMarquee() {
  const C = useTheme();

  // Double the list for seamless loop
  const items = [...PARTNERS, ...PARTNERS];

  return (
    <section
      aria-label="Featured in"
      style={{
        background: "#0a0a0a",
        borderTop: "1px solid #1a1a1a",
        borderBottom: "1px solid #1a1a1a",
        padding: "28px 0",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Label */}
      <div
        className="home-marquee-label"
        style={{
          textAlign: "center",
          marginBottom: 18,
          fontFamily: NU,
          fontSize: 9,
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "#666666",
          fontWeight: 600,
        }}
      >
        Our Venue Partners
      </div>

      {/* Marquee container */}
      <div style={{ position: "relative" }}>
        {/* Fade edges */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            left: 0,
            width: 100,
            background: "linear-gradient(to right, #0a0a0a, transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: 0,
            bottom: 0,
            right: 0,
            width: 100,
            background: "linear-gradient(to left, #0a0a0a, transparent)",
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Scrolling track */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 0,
            width: "max-content",
            animation: "marqueeScroll 50s linear infinite",
          }}
        >
          {items.map((name, i) => (
            <div
              key={`${name}-${i}`}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 0,
                flexShrink: 0,
              }}
            >
              <span
                style={{
                  fontFamily: NU,
                  fontSize: 13,
                  fontWeight: 400,
                  letterSpacing: "0.1em",
                  color: "#888888",
                  opacity: 0.7,
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                  padding: "0 24px",
                }}
              >
                {name}
              </span>
              <span
                style={{
                  color: C.gold,
                  fontSize: 8,
                  opacity: 0.4,
                  flexShrink: 0,
                }}
              >
                ✦
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Keyframes injected via style tag */}
      <style>{`
        @keyframes marqueeScroll {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </section>
  );
}
