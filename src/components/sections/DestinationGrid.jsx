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
        padding: "100px 60px",
        overflow: "hidden",
      }}
    >
      {/* Watermark */}
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 80,
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "var(--font-heading-primary)",
          fontSize: "clamp(120px, 12vw, 180px)",
          fontWeight: 400,
          fontStyle: "italic",
          color: "rgba(201,168,76,0.06)",
          whiteSpace: "normal",
          width: "100%",
          textAlign: "center",
          pointerEvents: "none",
          userSelect: "none",
          letterSpacing: "-2px",
          lineHeight: 1,
          zIndex: 0,
        }}
      >
        Destinations
      </span>
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
            The{" "}
            <span style={{ fontStyle: "italic", color: C.gold }}>
              Destinations
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
            From coastal escapes to grand countryside settings, explore the
            destinations defining the modern wedding. Each chosen for its
            beauty, atmosphere, and sense of occasion.
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
          paddingRight: 60,
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
            aria-label={`Explore ${d.name}, ${d.venues} venues`}
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
              width: 260,
              scrollSnapAlign: "start",
              cursor: "pointer",
              transition: "transform 0.4s ease, box-shadow 0.4s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-6px)";
              e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.25)";
              const im = e.currentTarget.querySelector("img");
              if (im) im.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              const im = e.currentTarget.querySelector("img");
              if (im) im.style.transform = "scale(1)";
            }}
          >
            {/* Portrait image */}
            <div
              className="home-dest-card-img"
              style={{
                width: "100%",
                height: 340,
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
