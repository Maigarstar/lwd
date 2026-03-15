// ─── src/components/ui/CuratedIndexBadge.jsx ─────────────────────────────────
// LWD Index hallmark badge.
//
// Public variant (default): luxury hallmark, "LWD INDEX" only, no numeric score.
// Dashboard variant (size="large"): full numeric display for vendor portal.
//
// Aesthetic reference: Michelin Guide, Forbes Travel Guide, understated hallmark.
// Score engine remains fully operational; this is a presentation-layer decision.

import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function CuratedIndexBadge({ score, size = "default" }) {
  const C = useTheme();
  const [hovered, setHovered] = useState(false);
  if (!score && score !== 0) return null;

  const isLarge = size === "large";

  /* ── Large variant, VendorDashboard prominent numeric display ── */
  if (isLarge) {
    const display = (score / 10).toFixed(1);
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
        <div style={{
          fontFamily: NU, fontSize: 10, letterSpacing: "2.5px",
          textTransform: "uppercase", color: C.gold, fontWeight: 700,
        }}>
          ✦ LWD Curated Index
        </div>
        <div style={{
          fontFamily: GD, fontSize: 56, fontWeight: 600,
          color: C.gold, lineHeight: 1,
        }}>
          {display}
        </div>
        <div style={{ fontFamily: NU, fontSize: 11, color: C.grey }}>
          out of 10.0
        </div>
      </div>
    );
  }

  /* ── Default variant, luxury hallmark badge (no numeric score) ── */
  return (
    <span
      style={{ position: "relative", display: "inline-block" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0,
          background: "rgba(201,168,76,0.06)",
          border: "1px solid rgba(201,168,76,0.18)",
          padding: "4px 10px",
          borderRadius: "var(--lwd-radius-input)",
          whiteSpace: "nowrap",
        }}
      >
        <span
          style={{
            fontFamily: NU, fontSize: 8.5, fontWeight: 700,
            letterSpacing: "1.8px", textTransform: "uppercase",
            color: C.gold, opacity: 0.85,
          }}
        >
          LWD Index
        </span>
      </span>

      {/* Hover tooltip, no numbers, just principle */}
      {hovered && (
        <span
          style={{
            position: "absolute",
            bottom: "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: "var(--lwd-radius-input)",
            padding: "6px 12px",
            whiteSpace: "nowrap",
            fontFamily: NU,
            fontSize: 10,
            fontWeight: 400,
            color: C.grey,
            letterSpacing: "0.2px",
            pointerEvents: "none",
            zIndex: 50,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          }}
        >
          Evaluated across measurable dimensions of luxury.
        </span>
      )}
    </span>
  );
}
