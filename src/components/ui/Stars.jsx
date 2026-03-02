// ─── src/components/ui/Stars.jsx ─────────────────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

export default function Stars({ r }) {
  const C = useTheme();
  return (
    <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg
          key={i}
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill={i <= Math.round(r) ? C.gold : C.border2}
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ))}
    </div>
  );
}
