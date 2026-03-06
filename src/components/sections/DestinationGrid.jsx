// ─── src/components/sections/DestinationGrid.jsx ─────────────────────────────
import { useRef } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { DESTINATIONS } from "../../data/destinations";
import { track } from "../../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function DestinationGrid({ onDestinationClick }) {
  const C = useTheme();
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section
      aria-label="Explore destinations"
      className="home-dest-section"
      style={{
        position: "relative",
        background: C.card,
        padding: "100px 60px 100px",
        overflow: "hidden",
        borderTop: `1px solid ${C.border}`,
      }}
    >
      {/* Header row */}
      <div
        className="home-dest-header"
        style={{
          marginBottom: 48,
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
            }}
          >
            <div
              style={{
                width: 28,
                height: 1,
                background: "rgba(201,168,76,0.5)",
              }}
            />
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
              Wedding Hotspots
            </span>
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(28px, 3vw, 48px)",
              color: C.off,
              fontWeight: 400,
              lineHeight: 1.1,
            }}
          >
            The World's Most Beautiful{" "}
            <span style={{ fontStyle: "italic", color: C.gold }}>
              Wedding Venues
            </span>
          </h2>
          <p
            className="home-dest-sub"
            style={{
              fontFamily: NU,
              fontSize: 14,
              color: C.grey,
              lineHeight: 1.7,
              maxWidth: 560,
              marginTop: 14,
              fontWeight: 300,
            }}
          >
            From coastal escapes to castle retreats, explore iconic venues that
            define elegance, romance, and grandeur by destination. Discover
            trend-led destinations where style meets celebration — curated for
            the modern couple with an eye for elegance.
          </p>
        </div>

        {/* Scroll arrows */}
        <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
          <button
            onClick={() => scroll(-1)}
            aria-label="Scroll left"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--lwd-radius-image)",
              border: `1px solid ${C.border}`,
              background: "transparent",
              color: C.off,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.gold;
              e.currentTarget.style.color = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.off;
            }}
          >
            ‹
          </button>
          <button
            onClick={() => scroll(1)}
            aria-label="Scroll right"
            style={{
              width: 40,
              height: 40,
              borderRadius: "var(--lwd-radius-image)",
              border: `1px solid ${C.gold}`,
              background: C.gold,
              color: C.black,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 18,
              transition: "all 0.2s",
            }}
          >
            ›
          </button>
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={scrollRef}
        className="home-dest-scroll"
        style={{
          display: "flex",
          gap: 20,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          paddingBottom: 8,
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        <style>{`
          .dest-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        {DESTINATIONS.map((d) => (
          <div
            key={d.name}
            role="button"
            tabIndex={0}
            aria-label={`Explore ${d.name} — ${d.venues} venues`}
            onClick={() => {
              track("destination_click", { destination: d.name });
              onDestinationClick?.(d);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                track("destination_click", { destination: d.name });
                onDestinationClick?.(d);
              }
            }}
            className="home-dest-card"
            style={{
              flexShrink: 0,
              width: 220,
              scrollSnapAlign: "start",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const im = e.currentTarget.querySelector("img");
              if (im) im.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              const im = e.currentTarget.querySelector("img");
              if (im) im.style.transform = "scale(1)";
            }}
          >
            {/* Portrait image */}
            <div
              className="home-dest-card-img"
              style={{
                width: "100%",
                height: 300,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <img
                src={d.img}
                alt={d.name}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s ease",
                }}
              />
            </div>

            {/* Label */}
            <div
              style={{
                fontFamily: NU,
                fontSize: 15,
                color: C.off,
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              {d.name}
            </div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 12,
                color: C.grey,
                letterSpacing: "0.06em",
                marginBottom: 2,
              }}
            >
              {d.country}
            </div>
            <div
              style={{
                fontFamily: NU,
                fontSize: 11,
                color: C.gold,
                letterSpacing: "0.08em",
                fontWeight: 600,
                opacity: 0.7,
              }}
            >
              {d.venues} Venues →
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
