// ─── src/components/sections/CategorySlider.jsx ───────────────────────────────
import { useRef } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

const CATEGORIES = [
  {
    id: "planners",
    label: "Top Wedding Planners",
    count: 860,
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "hair-makeup",
    label: "Hair & Makeup",
    count: 620,
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "photographers",
    label: "Best Photographers",
    count: 1120,
    img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "videographers",
    label: "Best Videographers",
    count: 480,
    img: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "bridal-dresses",
    label: "Bridal Dresses",
    count: 940,
    img: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "guest-attire",
    label: "Guest Attire",
    count: 310,
    img: "https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "flowers",
    label: "Wedding Flowers",
    count: 740,
    img: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "styling-decor",
    label: "Styling & Decor",
    count: 560,
    img: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "cakes",
    label: "Wedding Cakes",
    count: 520,
    img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "accessories",
    label: "Wedding Accessories",
    count: 380,
    img: "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "stationery",
    label: "Stationery & Invitations",
    count: 290,
    img: "https://images.unsplash.com/photo-1607344645866-009c320b63e0?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "health-beauty",
    label: "Health & Beauty",
    count: 410,
    img: "https://images.unsplash.com/photo-1560750588-73207b1ef5b8?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "celebrants",
    label: "Celebrants",
    count: 240,
    img: "https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "event-production",
    label: "Event Production",
    count: 350,
    img: "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "caterers",
    label: "Wedding Caterers",
    count: 680,
    img: "https://images.unsplash.com/photo-1555244162-803834f70033?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    count: 390,
    img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "gift-registry",
    label: "Gift Registry",
    count: 180,
    img: "https://images.unsplash.com/photo-1513885535751-8b9238bd345a?auto=format&fit=crop&w=600&q=80",
  },
  {
    id: "luxury-transport",
    label: "Luxury Transport",
    count: 260,
    img: "https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=600&q=80",
  },
];

export default function CategorySlider() {
  const C = useTheme();
  const scrollRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 320, behavior: "smooth" });
  };

  return (
    <section
      aria-label="Browse by category"
      className="home-cat-section"
      style={{
        position: "relative",
        background: C.card,
        padding: "100px 60px",
        overflow: "hidden",
      }}
    >
      {/* Header row */}
      <div
        className="home-cat-header"
        style={{
          maxWidth: 1320,
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
                background: `rgba(201,168,76,0.5)`,
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
              Luxe Listings
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
            The World's Finest{" "}
            <span style={{ fontStyle: "italic", color: C.gold }}>
              Wedding Vendors
            </span>
          </h2>
          <p
            className="home-cat-sub"
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
            Connect with top-tier planners and luxury wedding experts —
            ranked by the LWD Curated Index for quality, reliability, and style.
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
        className="cat-scroll home-cat-scroll"
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
          .cat-scroll::-webkit-scrollbar { display: none; }
        `}</style>
        {CATEGORIES.map((cat) => (
          <div
            key={cat.id}
            role="button"
            tabIndex={0}
            aria-label={`Browse ${cat.label} — ${cat.count} listings`}
            onClick={() => track("category_click", { category: cat.id })}
            onKeyDown={(e) => {
              if (e.key === "Enter") track("category_click", { category: cat.id });
            }}
            className="home-cat-card"
            style={{
              flexShrink: 0,
              width: 220,
              scrollSnapAlign: "start",
              cursor: "pointer",
            }}
            onMouseEnter={(e) => {
              const im = e.currentTarget.querySelector("img");
              if (im) im.style.transform = "scale(1.05)";
              const overlay = e.currentTarget.querySelector("[data-overlay]");
              if (overlay) overlay.style.opacity = "1";
            }}
            onMouseLeave={(e) => {
              const im = e.currentTarget.querySelector("img");
              if (im) im.style.transform = "scale(1)";
              const overlay = e.currentTarget.querySelector("[data-overlay]");
              if (overlay) overlay.style.opacity = "0";
            }}
          >
            {/* Portrait image */}
            <div
              className="home-cat-card-img"
              style={{
                width: "100%",
                height: 300,
                borderRadius: 8,
                overflow: "hidden",
                marginBottom: 14,
                position: "relative",
              }}
            >
              <img
                src={cat.img}
                alt={cat.label}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transition: "transform 0.6s ease",
                }}
              />
              {/* Hover gold border overlay */}
              <div
                data-overlay=""
                style={{
                  position: "absolute",
                  inset: 0,
                  borderRadius: 8,
                  border: "2px solid rgba(201,168,76,0.6)",
                  opacity: 0,
                  transition: "opacity 0.3s ease",
                  pointerEvents: "none",
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
              {cat.label}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
