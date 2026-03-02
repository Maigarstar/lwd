// ─── src/components/sections/StatStrip.jsx ────────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

const STATS = [
  { value: "10,247+", label: "Luxury Venues" },
  { value: "3,200+",  label: "Verified Vendors" },
  { value: "62",      label: "Countries" },
  { value: "100%",    label: "Personally Verified" },
];

export default function StatStrip() {
  const C = useTheme();

  return (
    <section
      aria-label="Platform statistics"
      style={{
        background: C.dark,
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
        padding: "42px 60px",
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 1,
        }}
      >
        {STATS.map((s, i) => (
          <div
            key={s.label}
            style={{
              textAlign: "center",
              padding: "0 20px",
              borderLeft: i > 0 ? `1px solid ${C.border}` : "none",
            }}
          >
            <div
              style={{
                fontFamily: GD,
                fontSize: "clamp(28px, 3vw, 42px)",
                fontWeight: 400,
                color: C.gold,
                lineHeight: 1,
                marginBottom: 6,
              }}
            >
              {s.value}
            </div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: C.grey,
                fontWeight: 600,
              }}
            >
              {s.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
