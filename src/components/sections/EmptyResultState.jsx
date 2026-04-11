import { useState } from "react";

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
    // Low result state (1-3 results) — show positive framing
    const positioningText = resultCount === 1
      ? "A rare find, one standout venue that matches your criteria"
      : `${resultCount} exceptional venues selected for this aesthetic`;

    return (
      <div style={{
        background: C.accentLight,
        border: `1px solid ${C.border}`,
        borderRadius: "var(--lwd-radius-card, 8px)",
        padding: "48px 40px",
        textAlign: "center",
        maxWidth: 720,
        margin: "40px auto",
      }}>
        <h3 style={{
          fontFamily: GD,
          fontSize: 20,
          fontWeight: 500,
          color: C.accent,
          marginBottom: 12,
        }}>
          ✦ Selectively Curated
        </h3>
        <p style={{
          fontFamily: NU,
          fontSize: 14,
          color: C.text,
          opacity: 0.85,
          marginBottom: 20,
          lineHeight: 1.6,
        }}>
          {positioningText}
        </p>

        {alternatives.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <p style={{
              fontFamily: NU,
              fontSize: 12,
              color: C.text,
              opacity: 0.6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
              marginBottom: 16,
            }}>
              Or explore similar categories
            </p>
            <div style={{
              display: "flex",
              gap: 12,
              flexWrap: "wrap",
              justifyContent: "center",
            }}>
              {alternatives.slice(0, 3).map((alt) => (
                <button
                  key={alt.slug}
                  onClick={() => onSelectAlternative(alt.slug)}
                  style={{
                    fontFamily: NU,
                    fontSize: 13,
                    fontWeight: 500,
                    background: C.accentLight,
                    border: `1px solid ${C.accent}`,
                    borderRadius: "var(--lwd-radius-input)",
                    padding: "8px 18px",
                    color: C.accent,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.background = C.accent;
                    e.target.style.color = C.bg;
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.background = C.accentLight;
                    e.target.style.color = C.accent;
                  }}
                >
                  {alt.category} ({alt.count})
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
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
