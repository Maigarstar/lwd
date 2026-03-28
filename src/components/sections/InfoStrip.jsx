// ─── src/components/sections/InfoStrip.jsx ───────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

const DEFAULT_COLS = [
  {
    label: "Signature Vibe",
    items: [
      "Rustic Luxe",
      "Romantic Destination",
      "Black Tie Elegance",
      "Garden Party",
      "Intimate & Elopement",
    ],
  },
  {
    label: "Elite Services",
    items: [
      "Exclusive Estate Hire",
      "Dedicated Concierge",
      "Michelin-Star Dining",
      "Private Ceremonies",
      "Luxury Transport",
    ],
  },
];

export default function InfoStrip({ regionNames = [], vibes, services, cols, defaultOpen = false }) {
  const C = useTheme();
  const [hovered, setHovered] = useState(null);
  const [open, setOpen] = useState(defaultOpen);

  // Build columns dynamically
  const COLS = cols || [
    ...(regionNames.length > 0 ? [{ label: "Regions", items: regionNames }] : []),
    {
      label: "Signature Vibe",
      items: (Array.isArray(vibes) && vibes.length > 0) ? vibes : DEFAULT_COLS[0].items,
    },
    {
      label: "Elite Services",
      items: (Array.isArray(services) && services.length > 0) ? services : DEFAULT_COLS[1].items,
    },
  ];

  return (
    <div
      style={{
        background: C.dark,
        borderBottom: `1px solid ${C.border}`,
        borderTop: `1px solid ${C.border}`,
      }}
    >
      {/* Toggle bar */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          padding: "10px 48px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          color: C.off || "#1a1a1a",
          fontSize: 9,
          fontWeight: 700,
          letterSpacing: "2.5px",
          textTransform: "uppercase",
          fontFamily: "var(--font-body)",
          transition: "color 0.2s",
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
        onMouseLeave={(e) => (e.currentTarget.style.color = C.off || "#1a1a1a")}
      >
        <span style={{
          display: "inline-block",
          transform: open ? "rotate(180deg)" : "rotate(0deg)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          fontSize: 10,
        }}>
          ▼
        </span>
        {open ? "Hide Details" : "Regions · Vibes · Services"}
      </button>

      {/* Collapsible content */}
      <div
        style={{
          display: "grid",
          gridTemplateRows: open ? "1fr" : "0fr",
          transition: "grid-template-rows 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            className="lwd-infostrip-outer"
            style={{
              maxWidth: 1280,
              margin: "0 auto",
              padding: "0 48px",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              opacity: open ? 1 : 0,
              transition: "opacity 0.3s ease 0.1s",
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
                    color: C.off || "#1a1a1a",
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
                          color: isHov ? C.gold : (C.off || "#1a1a1a"),
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
      </div>
    </div>
  );
}
