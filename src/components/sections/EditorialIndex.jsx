// ─── src/components/sections/EditorialIndex.jsx ──────────────────────────────
// Reusable editorial strip index — cream background, numbered rows, luxury feel.
// Each row = index number + label + hover image reveal.
// On hover: strip goes dark, text inverts, image slides in from right.
//
// Use for: region lists on country pages, planning guides, magazine indexes,
//          vendor list view, services on vendor profiles.
//
// Props:
//   items        — array of { id, label, img } (falls back to CATEGORIES)
//   locationName — optional string, adapts heading
//   title        — optional heading override
//   eyebrow      — optional eyebrow text (default "The Directory")
//   onSelect     — (id: string) => void
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";
import { track } from "../../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";
const GOLD = "#C9A84C";

const CATEGORIES = [
  { id: "planners",      label: "Wedding Planners",     img: "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=400&q=80" },
  { id: "photographers", label: "Photographers",         img: "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?auto=format&fit=crop&w=400&q=80" },
  { id: "flowers",       label: "Flowers & Floristry",   img: "https://images.unsplash.com/photo-1487530811176-3780de880c2d?auto=format&fit=crop&w=400&q=80" },
  { id: "videographers", label: "Videographers",          img: "https://images.unsplash.com/photo-1532712938310-34cb3982ef74?auto=format&fit=crop&w=400&q=80" },
  { id: "venues",        label: "Venues",                 img: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=400&q=80" },
  { id: "hair-makeup",   label: "Hair & Makeup",          img: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=400&q=80" },
  { id: "styling-decor", label: "Styling & Décor",        img: "https://images.unsplash.com/photo-1478146059778-26028b07395a?auto=format&fit=crop&w=400&q=80" },
  { id: "bridal-dresses",label: "Bridal Fashion",         img: "https://images.unsplash.com/photo-1594552072238-b8a33785b261?auto=format&fit=crop&w=400&q=80" },
  { id: "cakes",         label: "Wedding Cakes",          img: "https://images.unsplash.com/photo-1535254973040-607b474cb50d?auto=format&fit=crop&w=400&q=80" },
  { id: "entertainment", label: "Entertainment",          img: "https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?auto=format&fit=crop&w=400&q=80" },
];

function Strip({ cat, index, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`Browse ${cat.label}`}
      onClick={() => { track("category_editorial_click", { category: cat.id }); onSelect?.(cat.id); }}
      onKeyDown={(e) => e.key === "Enter" && onSelect?.(cat.id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 60px",
        height: 88,
        borderBottom: `1px solid ${hovered ? "transparent" : "rgba(26,20,14,0.1)"}`,
        background: hovered ? "#1a140e" : "transparent",
        cursor: "pointer",
        transition: "background 0.3s ease, border-color 0.3s ease",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Index number */}
      <span style={{
        fontFamily: NU,
        fontSize: 11,
        letterSpacing: "0.12em",
        color: hovered ? `${GOLD}99` : "rgba(26,20,14,0.25)",
        fontWeight: 600,
        minWidth: 36,
        transition: "color 0.3s ease",
        userSelect: "none",
      }}>
        {String(index + 1).padStart(2, "0")}
      </span>

      {/* Gold divider dot */}
      <div style={{
        width: 3,
        height: 3,
        borderRadius: "50%",
        background: hovered ? GOLD : "rgba(26,20,14,0.2)",
        marginRight: 28,
        flexShrink: 0,
        transition: "background 0.3s ease",
      }} />

      {/* Category name */}
      <span style={{
        fontFamily: GD,
        fontSize: "clamp(22px, 2.4vw, 36px)",
        fontWeight: 400,
        color: hovered ? "#f0ece4" : "#1a140e",
        letterSpacing: hovered ? "0.01em" : "0",
        transition: "color 0.3s ease, letter-spacing 0.4s ease",
        flex: 1,
        lineHeight: 1,
      }}>
        {cat.label}
      </span>

      {/* Arrow — appears on hover */}
      <span style={{
        fontFamily: NU,
        fontSize: 13,
        color: GOLD,
        opacity: hovered ? 1 : 0,
        transform: hovered ? "translateX(0)" : "translateX(-12px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
        marginRight: 24,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        fontWeight: 600,
      }}>
        Explore →
      </span>

      {/* Image — slides in from right on hover */}
      <div style={{
        width: hovered ? 120 : 0,
        height: 68,
        overflow: "hidden",
        borderRadius: 2,
        flexShrink: 0,
        transition: "width 0.4s cubic-bezier(0.4,0,0.2,1)",
      }}>
        <img
          src={cat.img}
          alt={cat.label}
          loading="lazy"
          style={{
            width: 120,
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      </div>
    </div>
  );
}

export default function EditorialIndex({ items, locationName, title, eyebrow, onSelect } = {}) {
  const list = items?.length ? items : CATEGORIES;
  return (
    <section
      aria-label="Browse by category"
      style={{
        background: "#F5F1EA",
        paddingBottom: 80,
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .cat-ed-strip { padding: 0 20px !important; height: 72px !important; }
          .cat-ed-num { display: none !important; }
          .cat-ed-dot { margin-right: 16px !important; }
        }
      `}</style>

      {/* Header */}
      <div style={{
        padding: "80px 60px 48px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        borderBottom: "1px solid rgba(26,20,14,0.12)",
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ width: 28, height: 1, background: `${GOLD}88` }} />
            <span style={{
              fontFamily: NU, fontSize: 10, letterSpacing: "0.28em",
              textTransform: "uppercase", color: GOLD, fontWeight: 600,
            }}>
              {eyebrow || "The Directory"}
            </span>
          </div>
          <h2 style={{
            fontFamily: GD,
            fontSize: "clamp(30px, 3.2vw, 52px)",
            color: "#1a140e",
            fontWeight: 400,
            lineHeight: 1.0,
            margin: 0,
          }}>
            {title
              ? title
              : locationName
                ? <>Find your team{" "}<em style={{ color: GOLD }}>in {locationName}</em></>
                : <>Find your{" "}<em style={{ color: GOLD }}>wedding team</em></>
            }
          </h2>
        </div>

        <p style={{
          fontFamily: NU, fontSize: 13,
          color: "rgba(26,20,14,0.5)",
          lineHeight: 1.8, maxWidth: 280,
          margin: 0, fontWeight: 300, textAlign: "right",
        }}>
          Every category. Every expert. Hand-verified to the LWD standard.
        </p>
      </div>

      {/* Strips */}
      <div>
        {list.map((cat, i) => (
          <Strip key={cat.id} cat={cat} index={i} onSelect={onSelect} />
        ))}
      </div>
    </section>
  );
}
