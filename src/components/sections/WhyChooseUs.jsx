// ─── src/components/sections/WhyChooseUs.jsx ─────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

const PILLARS = [
  {
    icon: "✓",
    title: "Every Venue Personally Verified",
    body: "We visit, we vet, we vouch. Every venue and vendor meets our standard before they appear on LWD.",
  },
  {
    icon: "✦",
    title: "AI-Powered Smart Discovery",
    body: "Aura, our AI concierge, understands your style, budget and vision, and finds matches in seconds.",
  },
  {
    icon: "♡",
    title: "Free for Couples, Always",
    body: "Browse, shortlist and enquire without limits. No hidden fees, no paywalls, no catch.",
  },
  {
    icon: "◈",
    title: "20 Years of Expertise",
    body: "Since 2006, we've helped thousands of couples discover extraordinary venues across 62 countries.",
  },
];

export default function WhyChooseUs() {
  const C = useTheme();

  return (
    <section
      aria-label="Why couples choose us"
      style={{
        position: "relative",
        background: C.card,
        padding: "110px 60px",
        overflow: "hidden",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative" }}>
        {/* Heading */}
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
            <span
              style={{
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: C.gold,
                fontWeight: 600,
              }}
            >
              For Couples
            </span>
            <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(32px, 3.5vw, 52px)",
              color: C.off,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            Plan with{" "}
            <span style={{ fontStyle: "italic", color: C.gold }}>confidence</span>
          </h2>
        </div>

        {/* Pillars grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: C.border,
            borderRadius: "var(--lwd-radius-card)",
            overflow: "hidden",
          }}
        >
          {PILLARS.map((p) => (
            <div
              key={p.title}
              style={{
                padding: "40px 28px",
                background: C.card,
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  margin: "0 auto 18px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 20,
                  color: C.gold,
                  background: "rgba(201,168,76,0.08)",
                  border: "1px solid rgba(201,168,76,0.2)",
                  borderRadius: "var(--lwd-radius-card)",
                }}
              >
                {p.icon}
              </div>
              <div
                style={{
                  fontFamily: GD,
                  fontSize: 16,
                  color: C.off,
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {p.title}
              </div>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.grey,
                  lineHeight: 1.7,
                }}
              >
                {p.body}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
