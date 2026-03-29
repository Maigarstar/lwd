// ─── src/components/sections/CategoryMosaic.jsx ──────────────────────────────
// Creative editorial mosaic — mixed card sizes, flush grid, no counts.
// Full-bleed layout. Names overlaid in large serif. Hover: gold wash effect.
// ─────────────────────────────────────────────────────────────────────────────

import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const GOLD = "#C9A84C";

// colSpan / rowSpan drive the mosaic layout
const CATEGORIES = [
  {
    id: "planners",
    label: "Wedding Planners",
    sub: "The architects of your day",
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80",
    col: 2, row: 2,   // large hero card — top-left
  },
  {
    id: "photographers",
    label: "Photographers",
    sub: "Moments made immortal",
    img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80",
    col: 1, row: 1,
  },
  {
    id: "flowers",
    label: "Flowers & Floristry",
    sub: "Nature's finest luxury",
    img: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=800&q=80",
    col: 1, row: 1,
  },
  {
    id: "videographers",
    label: "Videographers",
    sub: "Your story in motion",
    img: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
    col: 1, row: 1,
  },
  // row 2 fill-ins (after planners spans 2 rows)
  {
    id: "hair-makeup",
    label: "Hair & Makeup",
    sub: "The finishing touch",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
    col: 1, row: 1,
  },
  {
    id: "styling-decor",
    label: "Styling & Décor",
    sub: "Every detail considered",
    img: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=1200&q=80",
    col: 2, row: 1,  // wide card, bottom-right area
  },
  // row 3
  {
    id: "bridal-dresses",
    label: "Bridal Fashion",
    sub: "Dressed for the moment",
    img: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80",
    col: 1, row: 1,
  },
  {
    id: "venues",
    label: "Venues",
    sub: "Where legends are made",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1600&q=80",
    col: 3, row: 1,  // extra wide — full bottom row
  },
  {
    id: "cakes",
    label: "Wedding Cakes",
    sub: "Sweet perfection",
    img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80",
    col: 1, row: 1,
  },
];

function MosaicCard({ cat, onSelect }) {
  const handleClick = () => {
    track("category_mosaic_click", { category: cat.id });
    onSelect?.(cat.id);
  };

  const isLarge = cat.col >= 2 || cat.row >= 2;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Browse ${cat.label}`}
      onClick={handleClick}
      onKeyDown={(e) => e.key === "Enter" && handleClick()}
      className="mosaic-card"
      style={{
        gridColumn: `span ${cat.col}`,
        gridRow: `span ${cat.row}`,
        position: "relative",
        overflow: "hidden",
        cursor: "pointer",
        minHeight: cat.row >= 2 ? 480 : 240,
        background: "#111",
      }}
    >
      {/* Image */}
      <img
        className="mosaic-img"
        src={cat.img}
        alt={cat.label}
        loading="lazy"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          transition: "transform 0.8s cubic-bezier(0.4,0,0.2,1), filter 0.5s ease",
        }}
      />

      {/* Permanent dark gradient — bottom heavy */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "linear-gradient(to bottom, rgba(0,0,0,0) 35%, rgba(0,0,0,0.85) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Gold wash overlay — appears on hover */}
      <div
        className="mosaic-wash"
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${GOLD}22 0%, transparent 60%)`,
          opacity: 0,
          transition: "opacity 0.4s ease",
          pointerEvents: "none",
        }}
      />

      {/* Text block — bottom left */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: isLarge ? "28px 28px 24px" : "16px 16px 14px",
        }}
      >
        {/* Sub label */}
        <div
          className="mosaic-sub"
          style={{
            fontFamily: NU,
            fontSize: isLarge ? 11 : 9,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: `${GOLD}cc`,
            marginBottom: isLarge ? 8 : 5,
            opacity: 0,
            transform: "translateY(6px)",
            transition: "opacity 0.35s ease 0.05s, transform 0.35s ease 0.05s",
          }}
        >
          {cat.sub}
        </div>

        {/* Category name */}
        <div
          className="mosaic-label"
          style={{
            fontFamily: GD,
            fontSize: isLarge ? "clamp(22px, 2.2vw, 32px)" : "clamp(14px, 1.4vw, 18px)",
            fontWeight: 400,
            color: "#f0ece4",
            lineHeight: 1.1,
            transition: "transform 0.35s ease",
          }}
        >
          {cat.label}
        </div>

        {/* Gold divider line */}
        <div
          className="mosaic-line"
          style={{
            marginTop: isLarge ? 10 : 6,
            width: 0,
            height: 1,
            background: GOLD,
            transition: "width 0.4s cubic-bezier(0.4,0,0.2,1) 0.1s",
          }}
        />
      </div>
    </div>
  );
}

export default function CategoryMosaic({ locationName, onSelect } = {}) {
  return (
    <section
      aria-label="Browse by category"
      style={{ background: "#080706" }}
    >
      <style>{`
        .mosaic-card:hover .mosaic-img { transform: scale(1.04); filter: brightness(0.85); }
        .mosaic-card:hover .mosaic-wash { opacity: 1; }
        .mosaic-card:hover .mosaic-sub { opacity: 1; transform: translateY(0); }
        .mosaic-card:hover .mosaic-label { transform: translateY(-4px); }
        .mosaic-card:hover .mosaic-line { width: 32px; }
        @media (max-width: 900px) {
          .mosaic-grid { grid-template-columns: repeat(2, 1fr) !important; }
          .mosaic-card { grid-column: span 1 !important; grid-row: span 1 !important; min-height: 220px !important; }
        }
      `}</style>

      {/* Header strip */}
      <div
        style={{
          padding: "72px 60px 0",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 32,
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
            <div style={{ width: 28, height: 1, background: `${GOLD}66` }} />
            <span style={{ fontFamily: NU, fontSize: 10, letterSpacing: "0.28em", textTransform: "uppercase", color: GOLD, fontWeight: 600 }}>
              The Directory
            </span>
          </div>
          <h2 style={{ fontFamily: GD, fontSize: "clamp(28px, 3vw, 46px)", color: "#f0ece4", fontWeight: 400, lineHeight: 1.05, margin: 0 }}>
            {locationName
              ? <>Every expert{" "}<span style={{ fontStyle: "italic", color: GOLD }}>in {locationName}</span></>
              : <>Every detail.{" "}<span style={{ fontStyle: "italic", color: GOLD }}>Every expert.</span></>
            }
          </h2>
        </div>
        <p style={{ fontFamily: NU, fontSize: 13, color: "rgba(240,236,228,0.45)", lineHeight: 1.75, maxWidth: 300, margin: 0, fontWeight: 300, textAlign: "right" }}>
          A curated directory of the world's finest wedding professionals, verified to the LWD standard.
        </p>
      </div>

      {/* Mosaic grid — 2px gap for editorial seam lines */}
      <div
        className="mosaic-grid"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(5, 1fr)",
          gap: 2,
        }}
      >
        {CATEGORIES.map((cat) => (
          <MosaicCard key={cat.id} cat={cat} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
