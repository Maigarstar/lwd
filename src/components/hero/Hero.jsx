// ─── src/components/hero/Hero.jsx ────────────────────────────────────────────
import { useState, useEffect } from "react";

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80";

export default function Hero({
  count,
  title,
  subtitle,
  backgroundImage,
  backgroundVideo,
  ctaText,
  ctaLink,
  eyebrow,
  C,
  onBack,
}) {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 100);
    return () => clearTimeout(t);
  }, []);

  const bg = backgroundImage || DEFAULT_IMAGE;

  // Parse title: if it contains the location name, italicise the last word
  const renderTitle = () => {
    if (!title) return <>Weddings in <em style={{ fontStyle: "italic", color: "rgba(201,168,76,0.95)" }}>Italy</em></>;
    // Split into words — italicise last word
    const words = title.trim().split(" ");
    if (words.length === 1) return <em style={{ fontStyle: "italic", color: "rgba(201,168,76,0.95)" }}>{title}</em>;
    const last = words.pop();
    return <>{words.join(" ")} <em style={{ fontStyle: "italic", color: "rgba(201,168,76,0.95)" }}>{last}</em></>;
  };

  return (
    <section
      aria-label={`${title || "Weddings"} hero`}
      style={{
        position: "relative",
        height: "72vh",
        minHeight: 580,
        overflow: "hidden",
        background: "#0a0806",
      }}
    >
      {/* Background video */}
      {backgroundVideo && (
        <video
          autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.55 }}
        >
          <source src={backgroundVideo} />
        </video>
      )}

      {/* Background image */}
      {!backgroundVideo && (
        <img
          src={bg}
          alt={title || "Luxury wedding venue"}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: 0.55,
            transform: "scale(1.04)",
            transition: "transform 8s ease",
          }}
        />
      )}

      {/* Gradient overlays */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg,rgba(4,3,2,0.45) 0%,rgba(4,3,2,0.25) 40%,rgba(4,3,2,0.75) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(90deg,rgba(4,3,2,0.6) 0%,transparent 60%)",
        }}
      />

      {/* Gold shimmer bar */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
          backgroundSize: "200% 100%",
          animation: "shimmer 3s linear infinite",
          zIndex: 2,
        }}
      />

      {/* Content */}
      <div
        className="lwd-hero-content"
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "0 80px 80px",
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(20px)",
          transition: "all 0.9s ease",
        }}
      >
        {/* Eyebrow / Category label */}
        {eyebrow !== false && (
          <div
            style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 18 }}
            aria-hidden="true"
          >
            <div style={{ width: 32, height: 1, background: "rgba(201,168,76,0.6)" }} />
            <span
              style={{
                fontSize: 10,
                letterSpacing: "4px",
                textTransform: "uppercase",
                color: "rgba(201,168,76,0.9)",
                fontFamily: "var(--font-body)",
                fontWeight: 600,
              }}
            >
              {eyebrow || "Venues · Italy"}
            </span>
          </div>
        )}

        {/* Title */}
        <h1
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: "clamp(44px,6vw,76px)",
            fontWeight: 400,
            color: "#fff",
            lineHeight: 1.05,
            letterSpacing: "-0.5px",
            marginBottom: 18,
            maxWidth: 700,
          }}
        >
          {renderTitle()}
        </h1>

        {/* Subtitle / Tagline */}
        <p
          style={{
            fontSize: 16,
            color: "rgba(255,255,255,0.6)",
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            lineHeight: 1.6,
            maxWidth: 520,
            marginBottom: 20,
          }}
        >
          {subtitle || `Discover ${count || ""} extraordinary venues, from Tuscan vineyards and Venetian palazzos to cliffside estates on the Amalfi Coast.`}
        </p>

        {/* Trust line */}
        <p
          style={{
            fontSize: 11,
            letterSpacing: "2.5px",
            textTransform: "uppercase",
            color: "rgba(201,168,76,0.7)",
            fontFamily: "var(--font-body)",
            fontWeight: 500,
            marginBottom: 36,
          }}
        >
          Each venue personally vetted · No paid placements
        </p>

        {/* Stats row */}
        <div
          className="lwd-hero-stats"
          style={{ display: "flex", gap: 32, alignItems: "center" }}
          aria-label="Key statistics"
        >
          {[
            { val: count, label: "Curated Venues" },
            { val: "9",   label: "Regions Covered" },
            { val: "100%",label: "Personally Verified" },
            { val: " - ",  label: "Limited Annual Availability" },
          ].map((s, i) => (
            <div
              key={i}
              style={{
                borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.15)" : "none",
                paddingLeft: i > 0 ? 32 : 0,
              }}
            >
              <div
                style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize: 28,
                  fontWeight: 600,
                  color: "#C9A84C",
                  lineHeight: 1,
                }}
              >
                {s.val}
              </div>
              <div
                style={{
                  fontSize: 10,
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  color: "rgba(255,255,255,0.45)",
                  marginTop: 4,
                  fontFamily: "var(--font-body)",
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        {ctaText && ctaLink && ctaLink !== "#" && (
          <div style={{ marginTop: 36 }}>
            <a
              href={ctaLink}
              style={{
                display: "inline-block",
                padding: "14px 32px",
                background: "rgba(201,168,76,0.15)",
                border: "1px solid rgba(201,168,76,0.5)",
                color: "#C9A84C",
                fontFamily: "var(--font-body)",
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "2px",
                textTransform: "uppercase",
                textDecoration: "none",
                borderRadius: 2,
              }}
            >
              {ctaText}
            </a>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div
        aria-hidden="true"
        className="lwd-hero-scroll"
        style={{
          position: "absolute",
          bottom: 24,
          right: 48,
          display: "flex",
          alignItems: "center",
          gap: 8,
          opacity: 0.5,
        }}
      >
        <span
          style={{
            fontSize: 9,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "#fff",
            fontFamily: "var(--font-body)",
          }}
        >
          Scroll
        </span>
        <div style={{ width: 1, height: 24, background: "rgba(255,255,255,0.4)" }} />
      </div>
    </section>
  );
}
