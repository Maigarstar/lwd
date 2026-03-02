// ─── src/components/sections/EditorialBanner.jsx ─────────────────────────────
import { useState } from "react";

export default function EditorialBanner() {
  const [hovConsult, setHovConsult] = useState(false);

  return (
    <section
      aria-label="Editorial banner"
      style={{
        position: "relative",
        height: 480,
        overflow: "hidden",
        background: "#020201",
      }}
    >
      <img
        src="https://images.unsplash.com/photo-1516483638261-f4dbaf036963?auto=format&fit=crop&w=1920&q=80"
        alt="Romantic Italian wedding setting"
        loading="lazy"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.3,
          transform: "scale(1.03)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(135deg,rgba(2,2,1,0.88) 0%,rgba(2,2,1,0.65) 50%,rgba(2,2,1,0.82) 100%)",
        }}
      />

      {/* Content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          padding: "0 40px",
          zIndex: 2,
        }}
      >
        <div
          aria-hidden="true"
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.18)" }} />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "5px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
            }}
          >
            Exclusively Curated
          </span>
          <div style={{ width: 60, height: 1, background: "rgba(255,255,255,0.18)" }} />
        </div>

        <h2
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: "clamp(32px,4vw,54px)",
            fontWeight: 300,
            color: "#ffffff",
            lineHeight: 1.15,
            marginBottom: 16,
            maxWidth: 760,
            letterSpacing: "-0.5px",
          }}
        >
          Italy — where every moment becomes a memory
          <br />
          <em style={{ fontStyle: "italic", color: "#C9A84C" }}>
            worth keeping forever.
          </em>
        </h2>

        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.5)",
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            lineHeight: 1.7,
            maxWidth: 520,
            marginBottom: 32,
          }}
        >
          Every venue in our Italian collection has been personally visited and approved by
          our editorial team. Only the exceptional makes the list.
        </p>

        <div style={{ display: "flex", gap: 12 }}>
          <button
            style={{
              background: "linear-gradient(135deg,#C9A84C,#e8c97a)",
              border: "none",
              borderRadius: "var(--lwd-radius-image)",
              color: "#0f0d0a",
              padding: "12px 32px",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            Start Planning
          </button>
          <button
            onMouseEnter={() => setHovConsult(true)}
            onMouseLeave={() => setHovConsult(false)}
            style={{
              background: "none",
              border: `1px solid ${hovConsult ? "#C9A84C" : "rgba(255,255,255,0.25)"}`,
              borderRadius: "var(--lwd-radius-image)",
              color: hovConsult ? "#C9A84C" : "rgba(255,255,255,0.7)",
              padding: "12px 28px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: "inherit",
              transition: "all 0.25s",
            }}
          >
            Talk to a Consultant
          </button>
        </div>
      </div>
    </section>
  );
}
