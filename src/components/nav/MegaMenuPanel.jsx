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

export default function MegaMenuPanel({ id, item, navHeight, onMouseEnter, onMouseLeave }) {
  const [subcategories, setSubcategories] = useState([]);
  const [featuredPost,  setFeaturedPost]  = useState(null);
  const [ready,         setReady]         = useState(false);

  const sourceSlug = item.mega_menu_source_slug;
  const hasChildren = item.children && item.children.length > 0;
  const isManual   = item.mega_menu_source === "manual" || !sourceSlug || hasChildren;

  useEffect(() => {
    // If manually populated with nav items children, just set ready
    if (hasChildren || item.mega_menu_source === "manual") {
      setReady(true);
      return;
    }

    // Otherwise fetch from magazine categories
    if (!sourceSlug) {
      setReady(true);
      return;
    }

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
  }, [sourceSlug, hasChildren, item.mega_menu_source]);

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

  // Use either fetched featured post or nav items
  const hasFeatured = !!featuredPost;
  const shadow      = SHADOW_MAP[item.panel_shadow] || SHADOW_MAP.luxury;

  const ctaLabel = item.panel_cta_label || `Explore all ${item.label}`;
  const ctaHref  = item.panel_cta_link  || (sourceSlug ? `/magazine/category/${sourceSlug}` : "#");

  // For manual mega menus, use nav items children
  const menuItems = isManual && item.children ? item.children : subcategories;

  return (
    <div
      id={id}
      role="menu"
      style={{
        position:   "fixed",
        top:        navHeight,
        left:       0,
        right:      0,
        zIndex:     698,
        background: "#faf8f5",
        borderTop:  "1px solid rgba(224, 216, 200, 0.6)",
        borderBottom: "1px solid rgba(224, 216, 200, 0.4)",
        boxShadow:  "0 12px 32px rgba(0, 0, 0, 0.06)",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div style={{
        maxWidth: item.panel_full_width ? "100%" : (item.panel_max_width || 1200),
        margin:   "0 auto",
        padding:  `56px clamp(40px, 8vw, 60px)`,
        display:  "grid",
        gridTemplateColumns: window.innerWidth < 1024
          ? "1fr"
          : (hasFeatured || menuItems.length > 0 ? "1fr 280px" : "1fr"),
        gap: window.innerWidth < 1024 ? 32 : 48,
        alignItems: "start",
      }}>

        {/* ── Left: category heading + subcategory grid ── */}
        <section aria-label={`${item.label} categories`}>
          {/* Section heading */}
          <h2 style={{
            fontFamily: SANS, fontSize: 11, fontWeight: 600,
            letterSpacing: "0.15em", textTransform: "uppercase",
            color: accent, marginBottom: 32,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{ display: "inline-block", width: 24, height: 1, background: accent }} />
            {item.label}
          </h2>

          {/* Subcategory grid */}
          {menuItems.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "0 56px",
            }}>
              {menuItems.map(cat => (
                <NavItemLink
                  key={cat.id}
                  item={cat}
                  accent={accent}
                  textColor={textColor}
                  borderColor={borderColor}
                  showDesc={showDesc}
                  isManual={isManual}
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
        </section>

        {/* ── Right: featured article (refined, minimal) ── */}
        {hasFeatured && (
          <aside aria-label="Featured article" style={{ animation: "subtle-fade-slide 0.4s ease-out 100ms both" }}>
            <a
              href={`/magazine/${featuredPost.slug}`}
              style={{
                textDecoration: "none",
                display: "block",
                padding: "32px",
                background: `linear-gradient(135deg, rgba(11, 9, 6, 0.02), rgba(201, 168, 76, 0.04))`,
                border: "1px solid rgba(201, 168, 76, 0.15)",
                borderRadius: "8px",
                position: "sticky",
                top: "20px",
              }}
              aria-label={`Featured: ${featuredPost.title}`}
            >
              <div style={{
                fontFamily: SANS, fontSize: 10, fontWeight: 700,
                letterSpacing: "0.15em", textTransform: "uppercase",
                color: accent, marginBottom: 20,
                display: "flex", alignItems: "center", gap: 8,
              }}>
                <span>✦</span>
                FEATURED IN MAGAZINE
              </div>

              <div style={{
                fontFamily: SERIF, fontSize: 18, fontWeight: 500,
                letterSpacing: "0.2px",
                color: "#0b0906", lineHeight: 1.35, marginBottom: 14,
              }}>
                {featuredPost.title}
              </div>

              {featuredPost.excerpt && (
                <div style={{
                  fontFamily: SANS, fontSize: 13, fontWeight: 400,
                  lineHeight: 1.6,
                  color: "#5a5045", marginBottom: 16,
                }}>
                  {featuredPost.excerpt.substring(0, 100)}...
                </div>
              )}

              {featuredPost.read_time && (
                <div style={{ fontFamily: SANS, fontSize: 12, color: "#8a7d6a", marginBottom: 16 }}>
                  ⏱️ {featuredPost.read_time} min read
                </div>
              )}

              <div style={{
                fontFamily: SANS, fontSize: 12, fontWeight: 600,
                letterSpacing: "0.8px", color: accent,
                textDecoration: "none",
                transition: "all 0.2s ease",
                display: "inline-block",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.color = "#e8c96a";
                e.currentTarget.style.textDecoration = "underline";
              }}
              onMouseLeave={e => {
                e.currentTarget.style.color = accent;
                e.currentTarget.style.textDecoration = "none";
              }}>
                READ MORE →
              </div>
            </a>
            <style>{`
              @keyframes subtle-fade-slide {
                from {
                  opacity: 0;
                  transform: translateY(8px);
                }
                to {
                  opacity: 1;
                  transform: translateY(0);
                }
              }
            `}</style>
          </aside>
        )}
      </div>
    </div>
  );
}

// ── Nav item / Category link row ──────────────────────────────────────────────

function NavItemLink({ item, accent, textColor, borderColor, showDesc, isManual }) {
  const [hovered, setHovered] = useState(false);

  // Build href based on item type
  let href = "#";
  if (isManual) {
    // Nav item: use slug or url
    href = item.url || (item.slug ? `/${item.slug}` : "#");
  } else {
    // Magazine category
    href = `/magazine/category/${item.slug}`;
  }

  // Get display name and description
  const name = item.label || item.name;
  const description = item.description || item.short_description;

  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "16px 0",
        borderBottom: `1px solid rgba(224, 216, 200, 0.3)`,
        textDecoration: "none",
        transition: "all 0.2s cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        fontFamily: SERIF,
        fontSize: 15, fontWeight: 500,
        letterSpacing: "0.3px",
        color: hovered ? accent : "#0b0906",
        marginBottom: showDesc && description ? 6 : 0,
        transition: "color 0.2s ease",
      }}>
        {name}
      </div>
      {showDesc && description && (
        <div style={{
          fontFamily: SANS,
          fontSize: 12,
          fontWeight: 400,
          color: "#8a7d6a",
          lineHeight: 1.5,
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
        }}>
          {description}
        </div>
      )}
    </a>
  );
}
