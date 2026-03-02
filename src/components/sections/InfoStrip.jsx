// ─── src/components/sections/InfoStrip.jsx ───────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

const COLS = [
  {
    label: "Regions",
    items: ["Tuscany", "Lake Como", "Venice", "Amalfi Coast", "Puglia", "Sicily", "Rome"],
  },
  {
    label: "Signature Vibe",
    items: [
      "Rustic Luxe",
      "Romantic Destination",
      "Black Tie Elegance",
      "Garden Party",
      "Vineyard & Estate",
    ],
  },
  {
    label: "Elite Services",
    items: [
      "Exclusive Estate Hire",
      "Private Vineyard Ceremonies",
      "Michelin-Star Dining",
      "Historic Villa Access",
      "Dedicated Concierge",
    ],
  },
];

export default function InfoStrip() {
  const C = useTheme();
  // Track hovered tag as "colIdx-itemIdx"
  const [hovered, setHovered] = useState(null);

  return (
    <div
      style={{
        background: C.dark,
        borderBottom: `1px solid ${C.border}`,
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div
        className="lwd-infostrip-outer"
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 48px",
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
        }}
      >
        {COLS.map((col, i) => (
          <div
            key={i}
            className="lwd-infostrip-col"
            style={{
              padding: "36px 0",
              borderRight: i < 2 ? `1px solid ${C.border}` : "none",
              paddingRight: i < 2 ? 48 : 0,
              paddingLeft: i > 0 ? 48 : 0,
            }}
          >
            <div
              style={{
                fontSize: 9,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.45)",
                fontWeight: 700,
                marginBottom: 16,
                fontFamily: "var(--font-body)",
              }}
              aria-label={col.label}
            >
              ✦ {col.label}
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              {col.items.map((item, j) => {
                const key = `${i}-${j}`;
                const isHov = hovered === key;
                return (
                  <span
                    key={j}
                    role="button"
                    tabIndex={0}
                    onMouseEnter={() => setHovered(key)}
                    onMouseLeave={() => setHovered(null)}
                    onKeyDown={(e) => e.key === "Enter" && setHovered(key)}
                    style={{
                      fontSize: 12,
                      color: isHov ? C.gold : C.white,
                      background: C.card,
                      border: `1px solid ${isHov ? C.gold : C.border}`,
                      padding: "5px 12px",
                      borderRadius: "var(--lwd-radius-input)",
                      fontFamily: "var(--font-body)",
                      cursor: "pointer",
                      transition: "all 0.2s",
                    }}
                  >
                    {item}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
