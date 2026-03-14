// ─── src/components/sections/FeaturedSlider.jsx ──────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { GoldBadge } from "../ui/Badges";
import Stars from "../ui/Stars";

export default function FeaturedSlider({ venues }) {
  const [idx, setIdx]               = useState(0);
  const [transitioning, setTrans]   = useState(false);
  const [parallaxY, setParallaxY]   = useState(0);

  // Refs hold the live values so the interval never captures stale state
  const idxRef      = useRef(0);
  const transRef    = useRef(false);
  const timerRef    = useRef(null);
  const transTimer  = useRef(null);
  const sectionRef  = useRef(null);

  // Subtle parallax, image drifts at 15 % of scroll speed
  useEffect(() => {
    const onScroll = () => {
      const el = sectionRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      if (rect.bottom > 0 && rect.top < vh) {
        const progress = (vh - rect.top) / (vh + rect.height);
        setParallaxY((progress - 0.5) * rect.height * 0.15);
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goTo = useCallback((i) => {
    if (transRef.current) return;
    transRef.current = true;
    setTrans(true);
    transTimer.current = setTimeout(() => {
      idxRef.current = i;
      setIdx(i);
      transRef.current = false;
      setTrans(false);
    }, 400);
  }, []);

  // Auto-advance, reads from refs, so never stale
  useEffect(() => {
    timerRef.current = setInterval(() => {
      goTo((idxRef.current + 1) % venues.length);
    }, 5500);
    return () => {
      clearInterval(timerRef.current);
      clearTimeout(transTimer.current);
    };
  }, [goTo, venues.length]);

  const cur = venues[idx];

  return (
    <section
      ref={sectionRef}
      aria-label="Featured venues slider"
      style={{ position: "relative", height: 620, overflow: "hidden", background: "#020201" }}
    >
      {/* Gold shimmer border */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          zIndex: 10,
          background: "linear-gradient(90deg,#C9A84C,#e8c97a,#C9A84C)",
          backgroundSize: "200%",
          animation: "shimmer 3s linear infinite",
        }}
      />

      {/* Slide images, parallax layer */}
      {venues.map((v, i) => (
        <div
          key={v.id}
          aria-hidden={i !== idx}
          style={{
            position: "absolute",
            inset: "-8% 0",
            opacity: i === idx ? (transitioning ? 0 : 1) : 0,
            transition: "opacity 0.8s ease",
            transform: `translateY(${parallaxY}px)`,
            willChange: "transform",
          }}
        >
          <img
            src={v.imgs[0]}
            alt={`${v.name} in ${v.region}`}
            loading="lazy"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: i === idx ? "scale(1.03)" : "scale(1)",
              transition: "transform 6s ease",
            }}
          />
        </div>
      ))}

      {/* Gradient overlays */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background:
            "linear-gradient(to right,rgba(4,3,2,0.85) 0%,rgba(4,3,2,0.5) 55%,rgba(4,3,2,0.15) 100%)",
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          background: "linear-gradient(180deg,transparent 40%,rgba(4,3,2,0.6) 100%)",
        }}
      />

      {/* Section heading */}
      <div
        className="lwd-slider-label"
        style={{
          position: "absolute",
          top: 40,
          left: 80,
          zIndex: 5,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.18)" }} />
          <span
            style={{
              fontSize: 9,
              letterSpacing: "4px",
              textTransform: "uppercase",
              color: "rgba(255,255,255,0.45)",
              fontFamily: "var(--font-body)",
              fontWeight: 600,
            }}
          >
            ✦ LWD Signature Collection
          </span>
        </div>
        <h2
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: "clamp(24px, 2.5vw, 38px)",
            color: "#ffffff",
            fontWeight: 400,
            lineHeight: 1.1,
            marginBottom: 10,
          }}
        >
          The LWD{" "}
          <span style={{ fontStyle: "italic", color: "#C9A84C" }}>
            Signature Collection
          </span>
        </h2>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 12,
            color: "rgba(255,255,255,0.5)",
            lineHeight: 1.7,
            maxWidth: 440,
            fontWeight: 300,
            marginBottom: 8,
          }}
        >
          Reserved for venues that define the LWD standard.
        </p>
        <p
          style={{
            fontFamily: "var(--font-body)",
            fontSize: 10,
            letterSpacing: "2px",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.35)",
            fontWeight: 500,
          }}
        >
          Limited placements · By invitation
        </p>
      </div>

      {/* Content */}
      <div
        aria-live="polite"
        aria-atomic="true"
        aria-label={`Showing ${cur.name}, ${cur.region}`}
        className="lwd-slider-content"
        style={{
          position: "absolute",
          bottom: 72,
          left: 80,
          right: "40%",
          zIndex: 5,
          opacity: transitioning ? 0 : 1,
          transform: transitioning ? "translateY(12px)" : "translateY(0)",
          transition: "all 0.4s ease",
        }}
      >
        {cur.tag && (
          <div style={{ marginBottom: 16 }}>
            <GoldBadge text={cur.tag} />
          </div>
        )}
        <h2
          style={{
            fontFamily: "var(--font-heading-primary)",
            fontSize: "clamp(36px,4.5vw,58px)",
            fontWeight: 400,
            fontStyle: "italic",
            color: "#ffffff",
            lineHeight: 1.05,
            marginBottom: 12,
            letterSpacing: "-0.5px",
          }}
        >
          {cur.name}
        </h2>
        <div
          style={{
            fontSize: 13,
            color: "rgba(255,255,255,0.6)",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: "var(--font-body)",
          }}
        >
          <span aria-hidden="true" style={{ color: "rgba(201,168,76,0.8)", fontSize: 10 }}>
            ◆
          </span>
          {cur.city}, {cur.region} · {cur.country || "Italy"}
          <span aria-hidden="true" style={{ color: "rgba(255,255,255,0.25)" }}>·</span>
          Up to {cur.capacity} guests
        </div>
        <p
          style={{
            fontSize: 14,
            color: "rgba(255,255,255,0.65)",
            lineHeight: 1.75,
            fontFamily: "var(--font-body)",
            fontWeight: 300,
            marginBottom: 28,
            maxWidth: 500,
          }}
        >
          {cur.desc}
        </p>
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <button
            style={{
              background:    "linear-gradient(135deg,#C9A84C,#e8c97a)",
              border:        "none",
              borderRadius:   "var(--lwd-radius-card)",
              color:         "#0f0d0a",
              padding:       "12px 28px",
              fontSize:       11,
              fontWeight:     800,
              letterSpacing: "2px",
              textTransform: "uppercase",
              cursor:        "pointer",
              fontFamily:    "inherit",
              transition:    "opacity 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            View Venue →
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 8 }}>
            <Stars r={cur.rating} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.55)" }}>
              {cur.rating} ({cur.reviews} reviews)
            </span>
          </div>
        </div>
      </div>

      {/* Prev / Next arrows */}
      {[
        { dir: -1, side: "left",  label: "‹", ariaLabel: "Previous venue" },
        { dir:  1, side: "right", label: "›", ariaLabel: "Next venue" },
      ].map((a) => (
        <button
          key={a.side}
          aria-label={a.ariaLabel}
          onClick={() => goTo((idx + a.dir + venues.length) % venues.length)}
          style={{
            position: "absolute",
            [a.side]: 28,
            top: "50%",
            transform: "translateY(-50%)",
            zIndex: 6,
            width: 46,
            height: 46,
            borderRadius: "50%",
            background: "rgba(255,255,255,0.08)",
            border: "1px solid rgba(255,255,255,0.18)",
            color: "rgba(255,255,255,0.8)",
            cursor: "pointer",
            fontSize: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s",
            fontFamily: "inherit",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(201,168,76,0.25)";
            e.currentTarget.style.borderColor = "#C9A84C";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.08)";
            e.currentTarget.style.borderColor = "rgba(255,255,255,0.18)";
          }}
        >
          {a.label}
        </button>
      ))}

      {/* Progress dots */}
      <div
        role="tablist"
        aria-label="Slide navigation"
        className="lwd-slider-dots"
        style={{
          position: "absolute",
          bottom: 28,
          left: 80,
          zIndex: 6,
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}
      >
        {venues.map((_, i) => (
          <button
            key={i}
            role="tab"
            aria-selected={i === idx}
            aria-label={`Go to slide ${i + 1}`}
            onClick={() => goTo(i)}
            style={{
              height:       2,
              width:         i === idx ? 28 : 10,
              borderRadius:  "var(--lwd-radius-input)",
              background:    i === idx ? "#C9A84C" : "rgba(255,255,255,0.3)",
              border:       "none",
              cursor:       "pointer",
              padding:       0,
              transition:   "all 0.4s ease",
            }}
          />
        ))}
        <span
          aria-live="polite"
          style={{
            fontSize: 10,
            color: "rgba(255,255,255,0.35)",
            marginLeft: 8,
            fontFamily: "var(--font-body)",
            letterSpacing: "1px",
          }}
        >
          {String(idx + 1).padStart(2, "0")} / {String(venues.length).padStart(2, "0")}
        </span>
      </div>
    </section>
  );
}
