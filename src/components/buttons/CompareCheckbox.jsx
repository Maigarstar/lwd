// ─── src/components/buttons/CompareCheckbox.jsx ─────────────────────────────
// Checkbox for comparing venues

import { useState } from "react";

export default function CompareCheckbox({
  item = {},
  isCompared = false,
  onToggle = () => {},
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(item.id, !isCompared);
      }}
      style={{
        background: isCompared ? "#ffffff" : "rgba(255,255,255,0.15)",
        border: `1px solid ${isCompared ? "#ffffff" : "rgba(255,255,255,0.6)"}`,
        width: "20px",
        height: "20px",
        padding: "0",
        borderRadius: "4px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "all 200ms ease",
        transform: hovered ? "scale(1.1)" : "scale(1)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={isCompared ? "Remove from compare" : "Add to compare"}
      aria-label={isCompared ? "Remove from compare" : "Add to compare"}
    >
      <span style={{ color: isCompared ? "#0f0d0a" : "rgba(255,255,255,0.7)", fontSize: "12px", fontWeight: 700, lineHeight: 1 }}>
        C
      </span>
    </button>
  );
}
