// MegaMenuPanel.jsx
// Renders the dropdown panel for mega_menu type nav items.
// When source = 'magazine_category', fetches subcategories + latest article live from Supabase.
// Panel styling comes entirely from the nav item's design settings.

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";

const SERIF = "'Cormorant Garamond', Georgia, serif";
const SANS  = "'Inter', system-ui, sans-serif";

const SHADOW_MAP = {
  none:   "none",
  soft:   "0 4px 20px rgba(0,0,0,0.07)",
  medium: "0 8px 32px rgba(0,0,0,0.12)",
  strong: "0 16px 48px rgba(0,0,0,0.22)",
  luxury: "0 20px 60px rgba(0,0,0,0.28)",
};

export default function MegaMenuPanel({ item, navHeight, onMouseEnter, onMouseLeave }) {
  const [subcategories, setSubcategories] = useState([]);
  const [featuredPost,  setFeaturedPost]  = useState(null);
  const [ready,         setReady]         = useState(false);

  const sourceSlug = item.mega_menu_source_slug;
  const isManual   = item.mega_menu_source === "manual" || !sourceSlug;

  useEffect(() => {
    if (isManual) { setReady(true); return; }

    Promise.all([
      // Child categories of the selected magazine category
      supabase
        .from("magazine_categories")
        .select("id, slug, name, description, short_description, hero_image")
        .eq("parent_category_slug", sourceSlug)
        .order("name", { ascending: true }),

      // Latest published article in this category
      supabase
        .from("magazine_posts")
        .select("id, title, slug, excerpt, featured_image, read_time, category_slug, published_at")
        .eq("category_slug", sourceSlug)
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(1),
    ]).then(([catsRes, postsRes]) => {
      setSubcategories(catsRes.data || []);
      setFeaturedPost(postsRes.data?.[0] || null);
      setReady(true);
    });
  }, [sourceSlug, isManual]);

  // Don't flash an empty panel while fetching
  if (!ready) return null;

  // Design values from nav item
  const bg          = item.panel_bg           || "#ffffff";
  const textColor   = item.panel_text_color   || "#171717";
  const accent      = item.panel_accent_color || "#8f7420";
  const borderColor = item.panel_border_color || "#e0d8c8";
  const radius      = item.panel_radius       ?? 0;
  const padding     = item.panel_padding      ?? 40;
  const showDesc    = item.show_descriptions  !== false;
  const hasFeatured = !!featuredPost;
  const shadow      = SHADOW_MAP[item.panel_shadow] || SHADOW_MAP.luxury;

  const ctaLabel = item.panel_cta_label || `Explore all ${item.label}`;
  const ctaHref  = item.panel_cta_link  || (sourceSlug ? `/magazine/category/${sourceSlug}` : "#");

  return (
    <div
      style={{
        position:   "fixed",
        top:        navHeight,
        left:       0,
        right:      0,
        zIndex:     698,
        background: bg,
        borderTop:  `1px solid ${borderColor}`,
        borderBottom:`1px solid ${borderColor}`,
        boxShadow:  shadow,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{
        maxWidth: item.panel_full_width ? "100%" : (item.panel_max_width || 1200),
        margin:   "0 auto",
        padding:  `${padding}px 40px`,
        display:  "grid",
        gridTemplateColumns: hasFeatured ? "1fr 300px" : "1fr",
        gap: 56,
        alignItems: "start",
      }}>

        {/* ── Left: category heading + subcategory grid ── */}
        <div>
          {/* Section heading */}
          <div style={{
            fontFamily: SANS, fontSize: 10, fontWeight: 700,
            letterSpacing: "0.14em", textTransform: "uppercase",
            color: accent, marginBottom: 24,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ display: "inline-block", width: 24, height: 1, background: accent }} />
            {item.label}
          </div>

          {/* Subcategory grid */}
          {subcategories.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0 56px",
            }}>
              {subcategories.map(cat => (
                <SubcategoryLink
                  key={cat.id}
                  cat={cat}
                  accent={accent}
                  textColor={textColor}
                  borderColor={borderColor}
                  showDesc={showDesc}
                />
              ))}
            </div>
          ) : isManual ? (
            <div style={{ fontFamily: SANS, fontSize: 13, color: textColor + "60" }}>
              Add child nav items to populate this menu.
            </div>
          ) : (
            <div style={{ fontFamily: SANS, fontSize: 13, color: textColor + "60" }}>
              No subcategories found for this category.
            </div>
          )}

          {/* CTA */}
          {item.has_cta_in_panel && (
            <div style={{ marginTop: 32 }}>
              <a
                href={ctaHref}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  fontFamily: SANS, fontSize: 10, fontWeight: 700,
                  letterSpacing: "0.1em", textTransform: "uppercase",
                  color: accent, textDecoration: "none",
                  border: `1px solid ${accent}`,
                  borderRadius: radius || 4,
                  padding: "10px 22px",
                  transition: "all 0.2s",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = accent; e.currentTarget.style.color = "#fff"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = accent; }}
              >
                {ctaLabel} <span>→</span>
              </a>
            </div>
          )}
        </div>

        {/* ── Right: featured article ── */}
        {hasFeatured && (
          <a
            href={`/magazine/${featuredPost.slug}`}
            style={{ textDecoration: "none", display: "block" }}
          >
            <div style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 700,
              letterSpacing: "0.12em", textTransform: "uppercase",
              color: accent, marginBottom: 16,
            }}>
              Latest Story
            </div>

            {featuredPost.featured_image && (
              <div style={{
                width: "100%", paddingBottom: "62%",
                position: "relative",
                background: "#e8e4dc",
                borderRadius: radius / 2 || 2,
                overflow: "hidden",
                marginBottom: 16,
              }}>
                <img
                  src={featuredPost.featured_image}
                  alt={featuredPost.title}
                  style={{
                    position: "absolute", inset: 0,
                    width: "100%", height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.4s ease",
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = "scale(1.03)"; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = "scale(1)"; }}
                />
              </div>
            )}

            <div style={{
              fontFamily: SERIF, fontSize: 19, fontWeight: 500,
              color: textColor, lineHeight: 1.35, marginBottom: 8,
            }}>
              {featuredPost.title}
            </div>

            {featuredPost.read_time && (
              <div style={{ fontFamily: SANS, fontSize: 11, color: textColor + "70" }}>
                {featuredPost.read_time} min read
              </div>
            )}
          </a>
        )}
      </div>
    </div>
  );
}

// ── Subcategory link row ──────────────────────────────────────────────────────

function SubcategoryLink({ cat, accent, textColor, borderColor, showDesc }) {
  const [hovered, setHovered] = useState(false);

  return (
    <a
      href={`/magazine/category/${cat.slug}`}
      style={{
        display: "block",
        padding: "14px 0",
        borderBottom: `1px solid ${borderColor}`,
        textDecoration: "none",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        fontFamily: "'Inter', system-ui, sans-serif",
        fontSize: 13, fontWeight: 500,
        color: hovered ? accent : textColor,
        marginBottom: showDesc ? 4 : 0,
        transition: "color 0.15s",
      }}>
        {cat.name}
      </div>
      {showDesc && (cat.short_description || cat.description) && (
        <div style={{
          fontFamily: "'Inter', system-ui, sans-serif",
          fontSize: 11, color: textColor + "75",
          lineHeight: 1.45,
        }}>
          {cat.short_description || cat.description}
        </div>
      )}
    </a>
  );
}
