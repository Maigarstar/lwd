import { useCompare } from "../../compare/CompareContext";
import { useTheme } from "../../theme/ThemeContext";

const GOLD = "#C9A84C";

export default function CompareBar({ onCompare }) {
  const { compareItems, clearCompare } = useCompare();
  const C = useTheme();

  if (compareItems.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderTop: `1px solid ${C.border}`,
        padding: "12px 24px",
        boxShadow: "0 -4px 20px rgba(0,0,0,0.15)",
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1 }}>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", color: GOLD, letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
          Compare {compareItems.length}
        </div>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", overflowX: "auto" }}>
          {compareItems.map((item) => (
            <div
              key={item.id}
              style={{
                fontSize: "11px",
                color: C.grey,
                padding: "4px 8px",
                background: "rgba(201,168,76,0.1)",
                borderRadius: "4px",
                whiteSpace: "nowrap",
              }}
            >
              {item.name}
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
        <button
          onClick={clearCompare}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "10px",
            fontWeight: 700,
            textTransform: "uppercase",
            color: C.grey,
            background: "none",
            border: "none",
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          Clear
        </button>

        <button
          onClick={onCompare}
          style={{
            fontFamily: "var(--font-body)",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#0f0d0a",
            background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
            border: "none",
            borderRadius: "4px",
            padding: "8px 16px",
            cursor: "pointer",
            transition: "opacity 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          Compare
        </button>
      </div>
    </div>
  );
}
