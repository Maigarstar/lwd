// ─── src/components/ui/Pill.jsx ──────────────────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

export default function Pill({ text }) {
  const C = useTheme();
  return (
    <span
      style={{
        fontSize: 10,
        color: C.grey,
        background: "rgba(128,128,128,0.07)",
        border: `1px solid rgba(128,128,128,0.13)`,
        padding: "3px 10px",
        borderRadius: 20,
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}
