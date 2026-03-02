// ─── src/components/ui/Badges.jsx ────────────────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

export function GoldBadge({ text }) {
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "1.8px",
        textTransform: "uppercase",
        color: "#0f0d0a",
        background: "#C9A84C",
        padding: "3px 9px",
        borderRadius: "var(--lwd-radius-input)",
        whiteSpace: "nowrap",
      }}
    >
      {text}
    </span>
  );
}

export function VerifiedBadge() {
  const C = useTheme();
  return (
    <span
      style={{
        fontSize: 9,
        fontWeight: 700,
        letterSpacing: "1.5px",
        textTransform: "uppercase",
        color: C.green,
        background: "rgba(34,197,94,0.1)",
        border: `1px solid rgba(34,197,94,0.25)`,
        padding: "3px 8px",
        borderRadius: "var(--lwd-radius-input)",
        whiteSpace: "nowrap",
        display: "flex",
        alignItems: "center",
        gap: 4,
      }}
    >
      <span aria-hidden="true">✓</span> Verified
    </span>
  );
}
