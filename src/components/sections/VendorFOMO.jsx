// ─── src/components/sections/VendorFOMO.jsx ─────────────────────────────────
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

const STATS = [
  { val: "52,000+", label: "Couples Monthly" },
  { val: "47", label: "Leads / Top Listing" },
  { val: "12%", label: "Avg Conversion" },
  { val: "62", label: "Countries" },
];

const PILLARS = [
  {
    icon: "💌",
    title: "Direct Enquiries",
    body: "Every lead lands straight in your inbox with full couple details — name, date, budget, vision.",
  },
  {
    icon: "🌍",
    title: "20-Year SEO Authority",
    body: "Instant Google visibility that independent sites take years to earn. Page-one rankings from day one.",
  },
  {
    icon: "✦",
    title: "Aura AI Profile",
    body: "Our AI writes and optimises your listing copy automatically — couples find you through natural-language search.",
  },
  {
    icon: "⭐",
    title: "LWD Verified Badge",
    body: "The mark of trust that discerning couples look for first. Every listing personally vetted by our team.",
  },
];

export default function VendorFOMO({ onPartner }) {
  const C = useTheme();

  return (
    <section
      aria-label="Partner with LWD"
      style={{
        position: "relative",
        background: C.card,
        borderTop: `1px solid ${C.border}`,
        padding: "110px 60px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          maxWidth: 960,
          margin: "0 auto",
          textAlign: "center",
          position: "relative",
        }}
      >
        {/* Label */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 14,
            marginBottom: 20,
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
            For Wedding Professionals
          </span>
          <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
        </div>

        {/* Headline */}
        <h2
          style={{
            fontFamily: GD,
            fontSize: "clamp(32px, 4vw, 56px)",
            color: C.off,
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: 20,
          }}
        >
          Grow your business with
          <br />
          <span style={{ fontStyle: "italic", color: C.gold }}>
            the world's most trusted directory
          </span>
        </h2>

        <p
          style={{
            color: C.grey,
            fontSize: 16,
            lineHeight: 1.9,
            marginBottom: 48,
            maxWidth: 640,
            marginLeft: "auto",
            marginRight: "auto",
            fontFamily: GD,
            fontStyle: "italic",
          }}
        >
          Join thousands of luxury wedding professionals reaching couples who
          have already decided to spend. Our 20-year domain authority puts your
          listing in front of the right audience, every time.
        </p>

        {/* Stats strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: C.border,
            borderRadius: "var(--lwd-radius-card)",
            overflow: "hidden",
            marginBottom: 48,
          }}
        >
          {STATS.map((s) => (
            <div
              key={s.label}
              style={{ padding: "24px 16px", background: C.card, textAlign: "center" }}
            >
              <div
                style={{
                  fontFamily: GD,
                  fontSize: 28,
                  color: C.gold,
                  fontWeight: 400,
                  lineHeight: 1,
                  marginBottom: 6,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 10,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: C.grey,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Four pillars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 1,
            background: C.border,
            borderRadius: "var(--lwd-radius-card)",
            overflow: "hidden",
            marginBottom: 36,
          }}
        >
          {PILLARS.map(({ icon, title, body }) => (
            <div
              key={title}
              style={{ padding: "36px 24px", background: C.card, textAlign: "center" }}
            >
              <div style={{ fontSize: 24, marginBottom: 14 }}>{icon}</div>
              <div
                style={{
                  fontFamily: GD,
                  fontSize: 15,
                  color: C.off,
                  marginBottom: 10,
                  lineHeight: 1.3,
                }}
              >
                {title}
              </div>
              <div
                style={{
                  fontFamily: NU,
                  fontSize: 13,
                  color: C.grey,
                  lineHeight: 1.7,
                }}
              >
                {body}
              </div>
            </div>
          ))}
        </div>

        {/* Scarcity line */}
        <p
          style={{
            fontSize: 12,
            color: C.grey,
            fontFamily: NU,
            letterSpacing: "0.08em",
            marginBottom: 36,
          }}
        >
          Limited premium placements available per destination
        </p>

        {/* CTA */}
        <button
          onClick={() => {
            track("vendor_cta_click");
            onPartner?.();
          }}
          style={{
            background: "transparent",
            color: C.gold,
            border: `1px solid rgba(201,168,76,0.4)`,
            borderRadius: "var(--lwd-radius-input)",
            padding: "16px 48px",
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: NU,
            transition: "all 0.25s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = C.gold;
            e.currentTarget.style.color = "#0a0906";
            e.currentTarget.style.borderColor = C.gold;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
            e.currentTarget.style.color = C.gold;
            e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
          }}
        >
          ✦ Partner with LWD
        </button>
      </div>
    </section>
  );
}
