// ─── src/components/sections/NewsletterBand.jsx ─────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function NewsletterBand() {
  const C = useTheme();
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);

  const submit = () => {
    if (!email) return;
    track("newsletter_submit", { email });
    setDone(true);
  };

  return (
    <section
      aria-label="Newsletter signup"
      className="home-newsletter"
      style={{
        position: "relative",
        background: "#0a0806",
        padding: "100px 40px",
        textAlign: "center",
        overflow: "hidden",
      }}
    >
      {/* Background image */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "url('https://images.unsplash.com/photo-1602088113235-229c19758e9f?auto=format&fit=crop&w=1920&q=60')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(1px)",
        }}
      />
      {/* Dark overlay */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(10,8,6,0.82) 0%, rgba(10,8,6,0.72) 50%, rgba(10,8,6,0.82) 100%)",
        }}
      />
      {/* Gold radial glow */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(201,168,76,0.06) 0%, transparent 70%)",
        }}
      />

      <div style={{ position: "relative", maxWidth: 580, margin: "0 auto" }}>
        {/* Label */}
        <div
          style={{
            fontFamily: NU,
            fontSize: 10,
            letterSpacing: "3px",
            textTransform: "uppercase",
            color: "#C9A84C",
            marginBottom: 16,
            fontWeight: 600,
          }}
        >
          Join 52,000+ Couples
        </div>

        {/* Headline */}
        <h2
          className="home-newsletter-headline"
          style={{
            fontFamily: GD,
            fontSize: "clamp(28px, 4vw, 52px)",
            color: "#f5f0e8",
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: 12,
          }}
        >
          Get Weekly Vendor Spotlights
          <span style={{ display: "block", fontStyle: "italic", color: "#C9A84C" }}>
            & Real Wedding Stories
          </span>
        </h2>

        {/* Subline */}
        <p
          style={{
            color: "#999",
            fontSize: 15,
            fontFamily: NU,
            fontWeight: 300,
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          Join couples discovering hidden luxury venues, exclusive wedding
          inspiration, and curated vendor spotlights every week, trusted by
          52,000+ couples planning across Europe and beyond.
        </p>

        {/* Email input */}
        {done ? (
          <div
            style={{
              color: "#C9A84C",
              fontFamily: GD,
              fontSize: 20,
              fontStyle: "italic",
            }}
          >
            ✦ Welcome to the community, we'll be in touch!
          </div>
        ) : (
          <div className="home-newsletter-form" style={{ display: "flex", maxWidth: 440, margin: "0 auto" }}>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submit()}
              placeholder="your@email.com"
              aria-label="Email address"
              style={{
                flex: 1,
                background: "#1a1a1a",
                borderTop: "1px solid #3a3a3a",
                borderBottom: "1px solid #3a3a3a",
                borderLeft: "1px solid #3a3a3a",
                borderRight: "none",
                borderRadius: "4px 0 0 4px",
                color: "#f5f0e8",
                padding: "15px 18px",
                fontSize: 14,
                outline: "none",
                fontFamily: NU,
              }}
            />
            <button
              onClick={submit}
              style={{
                background: "#C9A84C",
                border: "none",
                borderRadius: "0 3px 3px 0",
                color: "#111",
                padding: "15px 28px",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "2px",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: NU,
                whiteSpace: "nowrap",
                transition: "background 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "#d4b85c")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "#C9A84C")}
            >
              Subscribe
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
