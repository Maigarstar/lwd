// ─── src/components/sections/CategoryFooter.jsx ──────────────────────────────
// Always dark regardless of theme — luxury black footer
import { useState } from "react";

const LINKS = {
  Explore: ["Tuscany Venues", "Lake Como Venues", "Venice Venues", "Amalfi Coast", "Puglia"],
  Services: ["Wedding Planning", "Venue Sourcing", "Vendor Directory", "Legal Guidance", "Travel & Stays"],
  Company:  ["About Us", "Editorial Standards", "List Your Venue", "Press", "Careers"],
};

export default function CategoryFooter({ onBack }) {
  const [hovLink, setHovLink] = useState(null);
  const [hovBack, setHovBack] = useState(false);

  return (
    <footer
      aria-label="Site footer"
      style={{
        background: "#080808",
        borderTop: "1px solid #1e1e1e",
      }}
    >
      {/* Main footer grid */}
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "72px 48px 48px",
          display: "grid",
          gridTemplateColumns: "2fr 1fr 1fr 1fr",
          gap: 48,
        }}
      >
        {/* Brand column */}
        <div>
          <div
            style={{
              fontFamily: "var(--font-heading-primary)",
              fontSize: 22,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            Luxury{" "}
            <span style={{ color: "#C9A84C" }}>Wedding</span>{" "}
            Directory
          </div>
          <div
            style={{
              fontSize: 9,
              letterSpacing: "3px",
              textTransform: "uppercase",
              color: "#555555",
              marginBottom: 24,
              fontFamily: "var(--font-body)",
            }}
          >
            Venues · Italy Edition
          </div>

          {/* Gold divider */}
          <div
            aria-hidden="true"
            style={{
              width: 40,
              height: 1,
              background: "linear-gradient(90deg,#C9A84C,transparent)",
              marginBottom: 20,
            }}
          />

          <p
            style={{
              fontSize: 13,
              color: "#555555",
              lineHeight: 1.8,
              fontFamily: "var(--font-body)",
              fontWeight: 300,
              maxWidth: 280,
              marginBottom: 28,
            }}
          >
            The world's most discerning collection of Italian wedding venues — every property
            personally verified by our editorial team.
          </p>

          {/* Social / contact */}
          <div style={{ display: "flex", gap: 10, marginBottom: 28 }}>
            {["IG", "FB", "PI", "YT"].map((s) => (
              <button
                key={s}
                aria-label={s}
                style={{
                  width: 34,
                  height: 34,
                  background: "none",
                  border: "1px solid #1e1e1e",
                  color: "#555555",
                  cursor: "pointer",
                  fontSize: 10,
                  fontFamily: "var(--font-body)",
                  fontWeight: 700,
                  letterSpacing: "0.5px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "#C9A84C";
                  e.currentTarget.style.color = "#C9A84C";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "#1e1e1e";
                  e.currentTarget.style.color = "#555555";
                }}
              >
                {s}
              </button>
            ))}
          </div>

          <button
            onClick={onBack}
            onMouseEnter={() => setHovBack(true)}
            onMouseLeave={() => setHovBack(false)}
            style={{
              background: hovBack
                ? "linear-gradient(135deg,#C9A84C,#9b7a1a)"
                : "none",
              border: `1px solid ${hovBack ? "#C9A84C" : "#2a2a2a"}`,
              borderRadius: "var(--lwd-radius-card)",
              color: hovBack ? "#0f0d0a" : "#888888",
              padding: "10px 22px",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.25s",
            }}
          >
            ← Back to Home
          </button>
        </div>

        {/* Link columns */}
        {Object.entries(LINKS).map(([heading, items]) => (
          <div key={heading}>
            <div
              style={{
                fontSize: 9,
                letterSpacing: "3px",
                textTransform: "uppercase",
                color: "#C9A84C",
                fontWeight: 700,
                marginBottom: 20,
                fontFamily: "var(--font-body)",
              }}
            >
              {heading}
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
              {items.map((item) => {
                const key = `${heading}-${item}`;
                return (
                  <li key={item} style={{ marginBottom: 11 }}>
                    <button
                      onMouseEnter={() => setHovLink(key)}
                      onMouseLeave={() => setHovLink(null)}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontFamily: "var(--font-body)",
                        fontSize: 13,
                        color: hovLink === key ? "#C9A84C" : "#555555",
                        transition: "color 0.2s",
                        padding: 0,
                        textAlign: "left",
                        letterSpacing: "0.2px",
                      }}
                    >
                      {item}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          borderTop: "1px solid #141414",
          padding: "20px 48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            fontSize: 11,
            color: "#333333",
            fontFamily: "var(--font-body)",
            letterSpacing: "0.3px",
          }}
        >
          © {new Date().getFullYear()} Luxury Wedding Directory · Italy ·{" "}
          <span style={{ color: "#C9A84C" }}>142</span> Curated Venues
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {["Privacy Policy", "Terms of Use", "Cookie Settings"].map((l) => (
            <button
              key={l}
              style={{
                background: "none",
                border: "none",
                color: "#333333",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: "inherit",
                letterSpacing: "0.3px",
                transition: "color 0.2s",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#C9A84C")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#333333")}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
