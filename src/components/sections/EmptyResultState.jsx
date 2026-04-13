import { useState, useEffect } from "react";

/**
 * ─── EmptyResultState.jsx ───────────────────────────────────────────────
 * Elegant UX for categories with 0-3 results.
 *
 * PRINCIPLE: Luxury platforms guide, not block.
 * - Never say "No results found"
 * - Always offer alternatives
 * - Reframe scarcity as exclusivity
 * - Provide actionable suggestions
 * ────────────────────────────────────────────────────────────────────────
 */

const GD = "var(--font-heading-primary)"; // Garamond/serif
const NU = "var(--font-body)"; // Neutral

function SelectivelyCuratedOverlay({ resultCount }) {
  const [phase, setPhase] = useState("in"); // "in" → "hold" → "out" → "gone"

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("hold"), 50);   // let paint settle, then full opacity
    const t2 = setTimeout(() => setPhase("out"), 2600);  // start melt
    const t3 = setTimeout(() => setPhase("gone"), 4000); // remove from DOM
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  if (phase === "gone") return null;

  const text = resultCount === 1
    ? "A rare find — one exceptional venue matches your search"
    : `${resultCount} exceptional venues, selectively curated`;

  const opacity = phase === "in" ? 0 : phase === "out" ? 0 : 1;
  const translateY = phase === "in" ? -6 : phase === "out" ? 10 : 0;
  const blur = phase === "out" ? 4 : 0;

  return (
    <div style={{ position: "relative", height: 72, margin: "40px 0 0" }}>
    <div
      style={{
        position: "absolute",
        top: 0,
        left: "50%",
        transform: `translateX(-50%) translateY(${translateY}px)`,
        zIndex: 120,
        pointerEvents: "none",
        opacity,
        filter: `blur(${blur}px)`,
        transition: phase === "in"
          ? "opacity 0.6s ease, transform 0.6s ease"
          : "opacity 1.4s ease, transform 1.4s ease, filter 1.4s ease",
        whiteSpace: "nowrap",
      }}
    >
      {/* pill */}
      <div style={{
        background: "rgba(10,8,6,0.88)",
        border: "1px solid rgba(201,168,76,0.4)",
        borderRadius: 40,
        padding: "10px 24px",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}>
        <span style={{
          fontFamily: GD,
          fontSize: 13,
          fontWeight: 500,
          fontStyle: "italic",
          color: "#C9A84C",
          letterSpacing: "0.02em",
        }}>
          ✦ Selectively Curated
        </span>
        <span style={{
          width: 1,
          height: 12,
          background: "rgba(201,168,76,0.3)",
          display: "inline-block",
        }} />
        <span style={{
          fontFamily: NU,
          fontSize: 12,
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "0.01em",
        }}>
          {text}
        </span>
      </div>
    </div>
    </div>
  );
}

export default function EmptyResultState({
  resultCount = 0,
  categoryLabel = "Wedding Venues",
  categoryDescription = null,
  alternatives = [], // Array of { category, count, slug }
  onSelectAlternative = () => {},
  onSaveSearch = () => {},
  darkMode = false,
}) {
  const [showSubscribe, setShowSubscribe] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeMessage, setSubscribeMessage] = useState("");

  const C = darkMode ? {
    bg: "#1a1714",
    text: "#E4D9C3",
    border: "rgba(201,168,76,0.2)",
    accent: "#C9A84C",
    accentLight: "rgba(201,168,76,0.1)",
  } : {
    bg: "#f2f0ea",
    text: "#2C2420",
    border: "rgba(201,168,76,0.2)",
    accent: "#C9A84C",
    accentLight: "rgba(201,168,76,0.08)",
  };

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!subscribeEmail) return;

    setSubscribeMessage("✓ Thanks! We'll notify you when new venues are added.");
    setTimeout(() => {
      setShowSubscribe(false);
      setSubscribeEmail("");
      setSubscribeMessage("");
    }, 2000);
  };

  if (resultCount > 0 && resultCount <= 3) {
    return <SelectivelyCuratedOverlay resultCount={resultCount} />;
  }

  // Zero result state
  return (
    <div style={{
      background: C.accentLight,
      border: `1px solid ${C.border}`,
      borderRadius: "var(--lwd-radius-card, 8px)",
      padding: "48px 40px",
      textAlign: "center",
      maxWidth: 640,
      margin: "40px auto",
    }}>
      <h3 style={{
        fontFamily: GD,
        fontSize: 22,
        fontWeight: 500,
        color: C.text,
        marginBottom: 8,
      }}>
        This aesthetic isn't available now
      </h3>

      <p style={{
        fontFamily: NU,
        fontSize: 14,
        color: C.text,
        opacity: 0.75,
        marginBottom: 28,
        lineHeight: 1.6,
      }}>
        {categoryLabel} venues matching your exact criteria aren't currently available.
        This reflects our curatorial standards—we'd rather have none than compromise.
      </p>

      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 16,
        marginBottom: 28,
      }}>
        <div style={{
          background: "rgba(201,168,76,0.05)",
          border: `1px solid ${C.border}`,
          borderRadius: "var(--lwd-radius-input)",
          padding: 16,
          textAlign: "left",
        }}>
          <p style={{
            fontFamily: NU,
            fontSize: 12,
            color: C.text,
            opacity: 0.6,
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            marginBottom: 8,
          }}>
            Try one of these
          </p>
          <ul style={{
            fontFamily: NU,
            fontSize: 13,
            color: C.text,
            opacity: 0.8,
            lineHeight: 1.8,
            marginLeft: 0,
            paddingLeft: 16,
          }}>
            <li>Remove region filter to see more options</li>
            <li>Adjust your guest count or budget range</li>
            <li>Explore similar aesthetic categories below</li>
          </ul>
        </div>

        {alternatives.length > 0 && (
          <div>
            <p style={{
              fontFamily: NU,
              fontSize: 12,
              color: C.text,
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 12,
            }}>
              Similar Categories
            </p>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: 10,
            }}>
              {alternatives.map((alt) => (
                <button
                  key={alt.slug}
                  onClick={() => onSelectAlternative(alt.slug)}
                  style={{
                    fontFamily: NU,
                    fontSize: 13,
                    fontWeight: 500,
                    background: "transparent",
                    border: `1px solid ${C.accent}`,
                    borderRadius: "var(--lwd-radius-input)",
                    padding: "10px 14px",
                    color: C.accent,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = C.accent;
                    e.target.style.color = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = "transparent";
                    e.target.style.color = C.accent;
                  }}
                >
                  {alt.category}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {!showSubscribe ? (
        <button
          onClick={() => setShowSubscribe(true)}
          style={{
            fontFamily: NU,
            fontSize: 12,
            fontWeight: 600,
            background: "transparent",
            border: `1px solid ${C.accent}`,
            borderRadius: "var(--lwd-radius-input)",
            padding: "10px 20px",
            color: C.accent,
            cursor: "pointer",
            textTransform: "uppercase",
            letterSpacing: "0.5px",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.target.style.background = C.accent;
            e.target.style.color = C.bg;
          }}
          onMouseLeave={(e) => {
            e.target.style.background = "transparent";
            e.target.style.color = C.accent;
          }}
        >
          Get Notified When New Venues Added
        </button>
      ) : (
        <form onSubmit={handleSubscribe} style={{
          display: "flex",
          gap: 10,
          maxWidth: 400,
          margin: "0 auto",
        }}>
          <input
            type="email"
            placeholder="your@email.com"
            value={subscribeEmail}
            onChange={(e) => setSubscribeEmail(e.target.value)}
            style={{
              flex: 1,
              fontFamily: NU,
              fontSize: 13,
              background: "transparent",
              border: `1px solid ${C.border}`,
              borderRadius: "var(--lwd-radius-input)",
              padding: "8px 12px",
              color: C.text,
            }}
            required
          />
          <button
            type="submit"
            style={{
              fontFamily: NU,
              fontSize: 12,
              fontWeight: 600,
              background: C.accent,
              border: "none",
              borderRadius: "var(--lwd-radius-input)",
              padding: "8px 16px",
              color: C.bg,
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => e.target.style.opacity = "0.85"}
            onMouseLeave={(e) => e.target.style.opacity = "1"}
          >
            Notify
          </button>
        </form>
      )}

      {subscribeMessage && (
        <p style={{
          fontFamily: NU,
          fontSize: 12,
          color: C.accent,
          marginTop: 12,
          fontWeight: 500,
        }}>
          {subscribeMessage}
        </p>
      )}
    </div>
  );
}
