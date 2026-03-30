// ─── src/components/sections/CategoryGrid.jsx ────────────────────────────────
// New editorial-style category grid.
// Replaces CategorySlider's horizontal scroll with a proper grid.
// Names are overlaid on images (gradient), no listing counts.
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";
import { supabase } from "../../lib/supabaseClient";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// Fallback categories if database fetch fails
const FALLBACK_CATEGORIES = [
  {
    id: "planners",
    label: "Wedding Planners",
    img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "photographers",
    label: "Photographers",
    img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "venues",
    label: "Venues",
    img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "flowers",
    label: "Flowers & Floristry",
    img: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "videographers",
    label: "Videographers",
    img: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "hair-makeup",
    label: "Hair & Makeup",
    img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "styling-decor",
    label: "Styling & Décor",
    img: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "cakes",
    label: "Wedding Cakes",
    img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "bridal-dresses",
    label: "Bridal Fashion",
    img: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "entertainment",
    label: "Entertainment",
    img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=800&q=80",
  },
];

// Props:
//   locationName — optional e.g. "Italy" → heading adapts
//   onSelect     — optional (categoryId: string) => void
export default function CategoryGrid({ locationName, onSelect } = {}) {
  const C = useTheme();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollContainerRef = useRef(null);
  const [hovPrev, setHovPrev] = useState(false);
  const [hovNext, setHovNext] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const { data, error } = await supabase
          .from("categories")
          .select("id, label, image")
          .eq("active", true)
          .order("position", { ascending: true });

        if (error) throw error;

        if (data && data.length > 0) {
          // Map database fields to component field names
          setCategories(
            data.map((cat) => ({
              id: cat.id,
              label: cat.label,
              img: cat.image, // Database uses 'image', component uses 'img'
            }))
          );
        } else {
          // Fall back to hardcoded if no data
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        // Use fallback categories on error
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  const handleClick = (cat) => {
    track("category_grid_click", { category: cat.id, location: locationName || "global" });
    onSelect?.(cat.id);
  };

  const heading = locationName
    ? <>The Finest Vendors{" "}<span style={{ fontStyle: "italic", color: "#C9A84C" }}>in {locationName}</span></>
    : <>Browse by{" "}<span style={{ fontStyle: "italic", color: "#C9A84C" }}>Category</span></>;

  return (
    <section
      aria-label="Browse by category"
      style={{
        background: "#0f0d0a",
        padding: "100px 60px 110px",
      }}
    >
      <style>{`
        .cat-slider { display: flex; gap: 14px; overflow-x: auto; scroll-behavior: smooth; scrollbar-width: none; }
        .cat-slider::-webkit-scrollbar { display: none; }
        .cat-grid-card { cursor: pointer; flex-shrink: 0; }
        .cat-grid-card:hover .cat-grid-img { transform: scale(1.04); }
        .cat-grid-card:hover .cat-grid-ring { opacity: 1; }
        .cat-grid-card:hover .cat-grid-label { letter-spacing: 0.04em; }
        @media (max-width: 900px) {
          .cat-grid-section { padding: 64px 24px 72px !important; }
        }
      `}</style>

      {/* Header */}
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto 56px",
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 20,
        }}
      >
        <div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div style={{ width: 28, height: 1, background: "rgba(201,168,76,0.5)" }} />
            <span
              style={{
                fontFamily: NU,
                fontSize: 10,
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "#C9A84C",
                fontWeight: 600,
              }}
            >
              Find Your Team
            </span>
          </div>
          <h2
            style={{
              fontFamily: GD,
              fontSize: "clamp(26px, 2.8vw, 44px)",
              color: "#f0ece4",
              fontWeight: 400,
              lineHeight: 1.1,
              margin: 0,
            }}
          >
            {heading}
          </h2>
        </div>

        <p
          style={{
            fontFamily: NU,
            fontSize: 13,
            color: "rgba(240,236,228,0.5)",
            lineHeight: 1.7,
            maxWidth: 340,
            margin: 0,
            fontWeight: 300,
          }}
        >
          Every luxury wedding needs an exceptional team. Discover hand-verified professionals curated to our standard.
        </p>
      </div>

      {/* Horizontal Slider with Navigation */}
      <div style={{ maxWidth: 1320, margin: "0 auto", display: "flex", alignItems: "center", gap: 16 }}>
        {/* Left arrow */}
        <button
          aria-label="Scroll categories left"
          disabled={false}
          onClick={() => scrollContainerRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
          onMouseEnter={() => setHovPrev(true)}
          onMouseLeave={() => setHovPrev(false)}
          style={{
            background: hovPrev ? "rgba(201,168,76,0.15)" : "transparent",
            border: `1px solid ${hovPrev ? "#C9A84C" : "rgba(201,168,76,0.3)"}`,
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.25s",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hovPrev ? "#C9A84C" : "#888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Slider container */}
        <div
          ref={scrollContainerRef}
          className="cat-slider"
          style={{
            flex: 1,
            width: "100%",
          }}
        >
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="cat-grid-card"
              role="button"
              tabIndex={0}
              aria-label={`Browse ${cat.label}`}
              onClick={() => handleClick(cat)}
              onKeyDown={(e) => e.key === "Enter" && handleClick(cat)}
              style={{ position: "relative", minWidth: 200, width: 200 }}
            >
              {/* Image container — portrait 2:3 ratio for slider */}
              <div
                style={{
                  position: "relative",
                  paddingBottom: "140%",
                  borderRadius: 0,
                  overflow: "hidden",
                  background: "#1a1714",
                }}
              >
                <img
                  className="cat-grid-img"
                  src={cat.img}
                  alt={cat.label}
                  loading="lazy"
                  style={{
                    position: "absolute",
                    inset: 0,
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.7s cubic-bezier(0.4,0,0.2,1)",
                  }}
                />

                {/* Dark gradient overlay */}
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to bottom, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.7) 100%)",
                    pointerEvents: "none",
                  }}
                />

                {/* Gold ring on hover */}
                <div
                  className="cat-grid-ring"
                  style={{
                    position: "absolute",
                    inset: 0,
                    borderRadius: 0,
                    border: "1.5px solid rgba(201,168,76,0.65)",
                    opacity: 0,
                    transition: "opacity 0.3s ease",
                    pointerEvents: "none",
                  }}
                />

                {/* Category name — bottom of image */}
                <div
                  style={{
                    position: "absolute",
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: "12px 10px 10px",
                  }}
                >
                  <div
                    className="cat-grid-label"
                    style={{
                      fontFamily: NU,
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#f0ece4",
                      lineHeight: 1.2,
                      transition: "letter-spacing 0.3s ease",
                    }}
                  >
                    {cat.label}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right arrow */}
        <button
          aria-label="Scroll categories right"
          disabled={false}
          onClick={() => scrollContainerRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
          onMouseEnter={() => setHovNext(true)}
          onMouseLeave={() => setHovNext(false)}
          style={{
            background: hovNext ? "rgba(201,168,76,0.15)" : "transparent",
            border: `1px solid ${hovNext ? "#C9A84C" : "rgba(201,168,76,0.3)"}`,
            borderRadius: "50%",
            width: 36,
            height: 36,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            transition: "all 0.25s",
            flexShrink: 0,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={hovNext ? "#C9A84C" : "#888"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 6 15 12 9 18" />
          </svg>
        </button>
      </div>
    </section>
  );
}
