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
        background: "linear-gradient(to bottom, rgba(20,16,12,0.55), rgba(12,10,8,0.85))",
        backdropFilter: "blur(10px) saturate(115%)",
        WebkitBackdropFilter: "blur(10px) saturate(115%)",
        borderTop:  "1px solid rgba(255, 255, 255, 0.08)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.04)",
        boxShadow:  "inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 10px 40px rgba(0, 0, 0, 0.35)",
        animation: "glassElevatorEntry 0.25s cubic-bezier(0.22, 1, 0.36, 1) both",
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <style>{`
        @keyframes glassElevatorEntry {
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
      <div style={{
        maxWidth: item.panel_full_width ? "100%" : (item.panel_max_width || 1280),
        margin:   "0 auto",
        padding:  "56px 64px",
        display:  "grid",
        gridTemplateColumns: window.innerWidth < 1024
          ? "1fr"
          : (hasFeatured ? "1fr 300px" : "1fr"),
        columnGap: window.innerWidth < 1024 ? 32 : 68,
        rowGap: window.innerWidth < 1024 ? 32 : 56,
        alignItems: "start",
      }}>

        {/* ── Left: category heading + subcategory grid ── */}
        <section aria-label={`${item.label} categories`} style={{ paddingTop: 6 }}>
          {/* Section heading */}
          <h2 style={{
            fontFamily: SANS, fontSize: 12, fontWeight: 600,
            letterSpacing: "2px", textTransform: "uppercase",
            color: "rgba(201, 168, 76, 0.9)", marginBottom: 32,
            display: "flex", alignItems: "center", gap: 12,
          }}>
            <span style={{
              display: "inline-block", width: 24, height: 1,
              background: "linear-gradient(90deg, #c9a84c, transparent)",
            }} />
            {item.label}
          </h2>
          <style>{`
            h2:hover {
              text-shadow: 0 0 10px rgba(201, 168, 76, 0.25);
              transition: text-shadow 0.3s ease;
            }
          `}</style>

          {/* Subcategory grid */}
          {menuItems.length > 0 ? (
            <div style={{
              display: "grid",
              gridTemplateColumns: window.innerWidth < 768
                ? "1fr"
                : window.innerWidth < 1024
                  ? "repeat(2, 1fr)"
                  : "repeat(5, 1fr)",
              gap: window.innerWidth < 1024 ? "24px 32px" : "20px 24px",
            }}>
              {menuItems.map((cat, idx) => (
                <NavItemLink
                  key={cat.id}
                  item={cat}
                  accent={accent}
                  textColor={textColor}
                  borderColor={borderColor}
                  showDesc={showDesc}
                  isManual={isManual}
                  isFirst={idx === 0}
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
            <div style={{ marginTop: 48 }}>
              <a
                href={ctaHref}
                style={{
                  display: "inline-flex", alignItems: "center", gap: 10,
                  fontFamily: SANS, fontSize: 10, fontWeight: 700,
                  letterSpacing: "1.2px", textTransform: "uppercase",
                  color: "#c9a84c", textDecoration: "none",
                  border: "1px solid rgba(201, 168, 76, 0.6)",
                  borderRadius: radius || 4,
                  padding: "10px 22px",
                  transition: "all 0.22s ease",
                  background: "rgba(201, 168, 76, 0.06)",
                  backdropFilter: "blur(2px)",
                  WebkitBackdropFilter: "blur(2px)",
                  cursor: "pointer",
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = "rgba(201, 168, 76, 0.12)";
                  e.currentTarget.style.border = "1px solid rgba(201, 168, 76, 0.8)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = "rgba(201, 168, 76, 0.05)";
                  e.currentTarget.style.border = "1px solid rgba(201, 168, 76, 0.6)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                {ctaLabel}
                <span style={{
                  marginLeft: 6, opacity: 0.7,
                  transition: "all 0.2s ease",
                  display: "inline-block",
                }} className="cta-arrow">→</span>
              </a>
            </div>
          )}
        </section>

        {/* ── Right: featured article ── */}
        {hasFeatured && (
          <aside aria-label="Featured article" style={{ paddingLeft: 8 }}>
            <a
              href={`/magazine/${featuredPost.slug}`}
              style={{ textDecoration: "none", display: "block" }}
              aria-label={`Featured: ${featuredPost.title}`}
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
          </aside>
        )}
      </div>
    </div>
  );
}

// ── Nav item / Category link row ──────────────────────────────────────────────

function NavItemLink({ item, accent, textColor, borderColor, showDesc, isManual, isFirst }) {
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

  const itemIndex = Math.floor(Math.random() * 100); // For stagger effect

  return (
    <a
      href={href}
      style={{
        display: "block",
        padding: "14px 0 14px 4px",
        borderBottom: "1px solid",
        borderImage: "linear-gradient(to right, rgba(255, 255, 255, 0.03), rgba(255, 255, 255, 0.01)) 1",
        textDecoration: "none",
        cursor: "pointer",
        transition: "transform 0.2s ease, color 0.2s ease",
        transform: hovered ? "translateX(4px)" : "translateX(0)",
        background: hovered ? "rgba(255, 255, 255, 0.02)" : "transparent",
        animation: `fadeInUp 0.4s ease-out ${itemIndex * 20}ms both`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div style={{
        fontFamily: "'Gilda Display', 'Cormorant Garamond', Georgia, serif",
        fontSize: window.innerWidth < 1024 ? 18 : 15, fontWeight: 400,
        letterSpacing: isFirst ? "0.3px" : "0.2px",
        color: hovered ? "#ffffff" : (isFirst ? "#ffffff" : "rgba(255, 255, 255, 0.92)"),
        marginBottom: showDesc && description ? 3 : 0,
        transition: "color 0.2s ease, text-shadow 0.2s ease",
        textShadow: isFirst && !hovered ? "0 0 6px rgba(255, 255, 255, 0.12)" : "none",
      }}>
        {name}
      </div>
      {showDesc && description && (
        <div style={{
          fontFamily: SANS,
          fontSize: 12, color: "rgba(255, 255, 255, 0.65)",
          lineHeight: 1.5,
        }}>
          {description}
        </div>
      )}
      <style>{`
        @keyframes fadeInUp {
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
    </a>
  );
}
