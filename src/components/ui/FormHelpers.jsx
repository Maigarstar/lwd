// ─── src/components/ui/FormHelpers.jsx ────────────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

export function MField({ label, children }) {
  const C = useTheme();
  return (
    <div style={{ marginBottom: 16 }}>
      <label
        style={{
          fontSize: 10,
          letterSpacing: "2px",
          textTransform: "uppercase",
          color: C.grey,
          display: "block",
          marginBottom: 6,
        }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export function Btn({ children, onClick, gold }) {
  const C = useTheme();
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        background: gold ? C.gold : "transparent",
        color: gold ? C.black : C.white,
        border: gold ? "none" : `1px solid ${C.border2}`,
        borderRadius: "var(--lwd-radius-input)",
        padding: 14,
        fontSize: 12,
        fontWeight: 800,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        cursor: "pointer",
        fontFamily: "inherit",
        transition: "background 0.2s",
      }}
      onMouseEnter={(e) => {
        if (gold) e.currentTarget.style.background = C.gold2;
      }}
      onMouseLeave={(e) => {
        if (gold) e.currentTarget.style.background = C.gold;
      }}
    >
      {children}
    </button>
  );
}
