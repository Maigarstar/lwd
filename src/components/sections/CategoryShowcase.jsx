// ─── src/components/sections/CategoryShowcase.jsx ────────────────────────────
// Dark category showcase — single featured square card.
// ─────────────────────────────────────────────────────────────────────────────

import { track } from "../../utils/track";

const GD   = "var(--font-heading-primary)";
const NU   = "var(--font-body)";
const GOLD = "#C9A84C";

const FEATURED = {
  id:    "planners",
  label: "Wedding Planners",
  img:   "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=2000&q=80",
};

export default function CategoryShowcase({ locationName, onSelect } = {}) {
  const click = () => {
    track("category_showcase_click", { category: FEATURED.id });
    onSelect?.(FEATURED.id);
  };

  return (
    <section
      aria-label="Browse by category"
      style={{ background: "#0f0d0a", padding: "100px 60px 110px" }}
    >
      <style>{`
        .cs-card:hover .cs-img  { transform: scale(1.04); }
        .cs-card:hover .cs-ring { opacity: 1 !important; }
        .cs-card:hover .cs-label { letter-spacing: 0.04em; }
      `}</style>

      {/* Header */}
      <div style={{
        maxWidth: 1320, margin: "0 auto 48px",
        display: "flex", alignItems: "flex-end",
        justifyContent: "space-between", flexWrap: "wrap", gap: 20,
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 28, height: 1, background: `${GOLD}66` }} />
            <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>
              Find Your Team
            </span>
          </div>
          <h2 style={{
            fontFamily: GD,
            fontSize: "clamp(26px, 2.8vw, 44px)",
            color: "#f0ece4", fontWeight: 400, lineHeight: 1.1, margin: 0,
          }}>
            {locationName
              ? <>The finest vendors{" "}<span style={{ fontStyle: "italic", color: GOLD }}>in {locationName}</span></>
              : <>Browse by{" "}<span style={{ fontStyle: "italic", color: GOLD }}>Category</span></>
            }
          </h2>
        </div>
        <p style={{
          fontFamily: NU, fontSize: 13, color: "rgba(240,236,228,0.45)",
          lineHeight: 1.7, maxWidth: 340, margin: 0, fontWeight: 300,
        }}>
          Every luxury wedding needs an exceptional team. Discover hand-verified professionals curated to our standard.
        </p>
      </div>

      {/* Single featured card — 253px × 354px portrait */}
      <div
        className="cs-card"
        role="button"
        tabIndex={0}
        aria-label={`Browse ${FEATURED.label}`}
        onClick={click}
        onKeyDown={(e) => e.key === "Enter" && click()}
        style={{
          width: 253,
          margin: "0 auto",
          position: "relative",
          paddingBottom: "140%",
          overflow: "hidden",
          cursor: "pointer",
          background: "#111",
        }}
      >
        <img
          className="cs-img"
          src={FEATURED.img}
          alt={FEATURED.label}
          loading="lazy"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "cover",
            transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 30%, rgba(0,0,0,0.78) 100%)",
          pointerEvents: "none",
        }} />
        <div className="cs-ring" style={{
          position: "absolute", inset: 0,
          border: `1.5px solid ${GOLD}99`,
          opacity: 0,
          transition: "opacity 0.3s ease",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: 0, left: 0, right: 0,
          padding: "24px 28px 22px",
        }}>
          <div className="cs-label" style={{
            fontFamily: GD,
            fontSize: "clamp(18px, 1.8vw, 28px)",
            fontWeight: 400,
            color: "#f0ece4",
            lineHeight: 1.1,
            transition: "letter-spacing 0.3s ease",
          }}>
            {FEATURED.label}
          </div>
          <div style={{
            marginTop: 8,
            width: 20,
            height: 1,
            background: `${GOLD}bb`,
          }} />
        </div>
      </div>
    </section>
  );
}
