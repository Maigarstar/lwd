// ─── src/components/sections/LatestSplit.jsx ─────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

const AREAS = ["one", "two", "three", "four", "five"];

export default function LatestSplit({ venues }) {
  const C = useTheme();
  const [hovImg, setHovImg] = useState(null);
  const [hovCta, setHovCta] = useState(false);

  return (
    <section
      aria-label="Latest venues and editorial overview"
      className="lwd-latestsplit"
      style={{
        maxWidth: 1280,
        margin: "0 auto",
        padding: "80px 48px",
        display: "grid",
        gridTemplateColumns: "55% 45%",
        gap: 64,
        alignItems: "center",
      }}
    >
      {/* LEFT — magazine image grid */}
      <div
        className="lwd-latestsplit-imgrid"
        style={{
          display: "grid",
          gridTemplateAreas: '"one two" "one three" "four five"',
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr 1fr",
          gap: 6,
          height: 560,
        }}
        aria-label="Latest five venues"
      >
        {venues.slice(0, 5).map((v, i) => (
          <div
            key={v.id}
            role="img"
            aria-label={`${v.name}, ${v.region}`}
            style={{
              gridArea: AREAS[i],
              overflow: "hidden",
              position: "relative",
              background: "#0a0806",
              cursor: "pointer",
            }}
            onMouseEnter={() => setHovImg(i)}
            onMouseLeave={() => setHovImg(null)}
          >
            <img
              src={v.imgs[0]}
              alt={`${v.name} in ${v.region}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: hovImg === i ? "scale(1.07)" : "scale(1)",
                transition: "transform 0.65s ease",
              }}
            />
            {/* Overlay gradient */}
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg,transparent 50%,rgba(4,3,2,0.75) 100%)",
                opacity: hovImg === i ? 1 : 0.6,
                transition: "opacity 0.3s",
              }}
            />
            {/* Label */}
            <div
              style={{ position: "absolute", bottom: 10, left: 12, right: 8 }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: "rgba(255,255,255,0.55)",
                  letterSpacing: "0.5px",
                  fontFamily: "var(--font-body)",
                  marginBottom: 2,
                }}
              >
                {v.region}
              </div>
              <div
                style={{
                  fontSize: i === 0 ? 14 : 12,
                  color: "#fff",
                  fontFamily: "var(--font-heading-primary)",
                  fontWeight: 500,
                  lineHeight: 1.2,
                }}
              >
                {v.name}
              </div>
            </div>
            {/* "Latest" badge on first */}
            {i === 0 && (
              <div
                style={{ position: "absolute", top: 10, left: 10 }}
                aria-label="Latest"
              >
                <span
                  style={{
                    fontSize: 8,
                    letterSpacing: "2px",
                    textTransform: "uppercase",
                    color: "#0f0d0a",
                    background: "#C9A84C",
                    padding: "3px 8px",
                    fontWeight: 700,
                  }}
                >
                  Latest
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* RIGHT — SEO editorial text */}
      <div style={{ padding: "0 8px" }}>
        {/* Ornament */}
        <div
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}
          aria-hidden="true"
        >
          <div style={{ width: 32, height: 1, background: "rgba(255,255,255,0.18)" }} />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              fontWeight: 700,
              fontFamily: "var(--font-body)",
            }}
          >
            Why Italy
          </span>
        </div>

        <h2
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: "clamp(30px,3vw,42px)",
            fontWeight: 400,
            color: C.white,
            lineHeight: 1.15,
            marginBottom: 24,
            letterSpacing: "-0.3px",
          }}
        >
          The Art of the
          <br />
          <em style={{ fontStyle: "italic" }}>Italian Wedding</em>
        </h2>

        <div
          aria-hidden="true"
          style={{ width: 48, height: 1, background: "rgba(255,255,255,0.08)", marginBottom: 28 }}
        />

        <p
          style={{
            fontSize: 14,
            color: C.grey,
            lineHeight: 1.85,
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            marginBottom: 20,
          }}
        >
          Italy has long been regarded as the world's most romantic wedding destination — a
          country where centuries of art, architecture and culinary mastery converge to
          create celebrations of extraordinary distinction.
        </p>
        <p
          style={{
            fontSize: 14,
            color: C.grey,
            lineHeight: 1.85,
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            marginBottom: 32,
          }}
        >
          From the sun-drenched terraces of Tuscany to the sapphire shores of Lake Como,
          each region offers a distinct character and depth of beauty unmatched anywhere on
          earth. Our curated collection represents only the finest estates, villas, palazzi
          and masserie — each personally visited by our editorial team.
        </p>

        {/* Key facts */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 16,
            marginBottom: 36,
          }}
        >
          {[
            { icon: "🏰", text: "Historic villa estates" },
            { icon: "🍇", text: "Private vineyard settings" },
            { icon: "🌅", text: "Coastal & clifftop venues" },
            { icon: "✨", text: "Michelin-star catering" },
          ].map((f, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "12px 16px",
                background: C.dark,
                border: `1px solid ${C.border}`,
                borderRadius: "var(--lwd-radius-input)",
              }}
            >
              <span style={{ fontSize: 16 }} aria-hidden="true">{f.icon}</span>
              <span
                style={{
                  fontSize: 12,
                  color: C.white,
                  fontFamily: "var(--font-body)",
                }}
              >
                {f.text}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          onMouseEnter={() => setHovCta(true)}
          onMouseLeave={() => setHovCta(false)}
          style={{
            background: hovCta ? C.gold : "none",
            border: `1px solid ${C.gold}`,
            borderRadius: "var(--lwd-radius-image)",
            color: hovCta ? "#fff" : C.gold,
            padding: "12px 28px",
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: "2px",
            textTransform: "uppercase",
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "all 0.25s",
          }}
        >
          Browse All Italian Venues →
        </button>
      </div>
    </section>
  );
}
