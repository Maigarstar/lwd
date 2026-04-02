// menu/MenuCanvas.jsx
// Live design canvas with Desktop/Mobile view, header state simulation,
// Edit/Live mode toggle, and full real-time preview of nav items.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  SANS, SERIF, MONO,
  PAGE_THEMES, PRESETS, ANIMATIONS, LAYOUT_TYPES, SHADOW_MAP,
  getLiveUrl,
} from "./menuUtils.js";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// ── Panel renderer (shared for desktop + mobile) ──────────────────────────
function NavPanel({ item, subcatCache, G, SERIF_F = SERIF }) {
  if (!item || (item.type !== "dropdown" && item.type !== "mega_menu")) return null;

  const bg     = item.panel_bg           || "#1a1510";
  const txt    = item.panel_text_color   || "#f5efe4";
  const accent = item.panel_accent_color || "#c9a84c";
  const border = item.panel_border_color || "#2a2218";
  const r      = item.panel_radius       ?? 0;
  const pad    = item.panel_padding      ?? 40;
  const shadow = SHADOW_MAP[item.panel_shadow] || SHADOW_MAP.luxury;

  // Width resolution
  const widthMode = item.panel_width_mode || (item.panel_full_width ? "full" : "container");
  const widthStyle = widthMode === "full"
    ? { width: "100%" }
    : widthMode === "content"
      ? { maxWidth: 960, margin: "0 auto" }
      : widthMode === "custom" && item.panel_custom_width
        ? { maxWidth: item.panel_custom_width, margin: "0 auto" }
        : { maxWidth: 1200, margin: "0 auto" };

  const cached    = subcatCache[item.mega_menu_source_slug] || { subcats: [], post: null };
  const isReal    = cached.subcats.length > 0;
  const subcats   = isReal ? cached.subcats : [
    { name: "Style & Trends",        short_description: "Inspiration and editorial" },
    { name: "Venues & Destinations", short_description: "Where to celebrate" },
    { name: "Planning Essentials",   short_description: "Checklists and timelines" },
    { name: "Fashion & Beauty",      short_description: "Bridal looks and styling" },
  ];
  const post       = cached.post;
  const showDesc   = item.show_descriptions !== false;
  const hasFeatured = !!(post || item.layout_type === "featured-right" || item.layout_type === "editorial");

  // Manual children (if source = manual, items from parent_id)
  const manualChildren = item._children || [];
  const displayItems = item.mega_menu_source === "magazine_category" ? subcats : manualChildren;

  return (
    <div style={{
      position: "absolute", top: "100%", left: 0, right: 0, zIndex: 20,
      background: bg, borderTop: `1px solid ${border}`,
      borderBottom: `1px solid ${border}`, boxShadow: shadow,
    }}>
      <div style={{ ...widthStyle, padding: `${pad}px ${Math.min(pad, 48)}px` }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: hasFeatured ? "1fr 260px" : "1fr",
          gap: 48, alignItems: "start",
        }}>
          {/* Left: subcategories */}
          <div>
            <div style={{
              fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.14em",
              textTransform: "uppercase", color: accent, marginBottom: 20,
              display: "flex", alignItems: "center", gap: 10,
            }}>
              <span style={{ display: "inline-block", width: 20, height: 1, background: accent }} />
              {item.label}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "0 48px" }}>
              {displayItems.slice(0, 8).map((cat, i) => (
                <div key={i} style={{ padding: "12px 0", borderBottom: `1px solid ${border}` }}>
                  <div style={{ fontFamily: SANS, fontSize: 13, fontWeight: 500, color: txt, marginBottom: showDesc ? 4 : 0 }}>
                    {cat.name || cat.label}
                  </div>
                  {showDesc && (cat.short_description || cat.description) && (
                    <div style={{ fontFamily: SANS, fontSize: 11, color: txt + "75", lineHeight: 1.4 }}>
                      {cat.short_description || cat.description}
                    </div>
                  )}
                </div>
              ))}
              {!isReal && item.mega_menu_source === "magazine_category" && (
                <div style={{ gridColumn: "1/-1", padding: "8px 0", fontFamily: SANS, fontSize: 11, color: accent + "80", fontStyle: "italic" }}>
                  Mock data - assign a Magazine Category source to see real subcategories
                </div>
              )}
            </div>
            {item.has_cta_in_panel && (
              <div style={{ marginTop: 24 }}>
                <span style={{
                  display: "inline-flex", alignItems: "center", gap: 8,
                  fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.1em",
                  textTransform: "uppercase", color: accent,
                  border: `1px solid ${accent}`, borderRadius: r / 2 || 3, padding: "9px 20px",
                }}>
                  {item.panel_cta_label || `Explore all ${item.label}`} <span>→</span>
                </span>
              </div>
            )}
          </div>

          {/* Right: featured article */}
          {hasFeatured && (
            <div>
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: accent, marginBottom: 14 }}>
                Latest Story
              </div>
              {post?.featured_image ? (
                <img src={post.featured_image} alt={post.title || ""}
                  style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: r / 2 || 2, display: "block", marginBottom: 12 }} />
              ) : (
                <div style={{ width: "100%", height: 140, background: accent + "18", borderRadius: r / 2 || 2, marginBottom: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontFamily: SANS, fontSize: 11, color: accent + "80" }}>Article image</span>
                </div>
              )}
              <div style={{ fontFamily: SERIF_F, fontSize: 17, color: txt, lineHeight: 1.35, marginBottom: 6 }}>
                {post?.title || "Article headline appears here"}
              </div>
              {post?.read_time && (
                <div style={{ fontFamily: SANS, fontSize: 11, color: txt + "70" }}>{post.read_time} min read</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Mobile canvas ─────────────────────────────────────────────────────────
function MobileCanvas({ items, navConfig, C, theme, canvasMode, selectedItemId, onItemClick }) {
  const G  = C?.gold || "#c9a84c";
  const [drawerOpen, setDrawerOpen] = useState(false);

  const height = navConfig?.mobile_header_height || 60;
  const logoSize = navConfig?.mobile_logo_size || 28;
  const logoPos  = navConfig?.mobile_logo_position || "left";
  const menuStyle = navConfig?.mobile_menu_style || "slide";

  const rootItems = items.filter(i => i.visible && !i.parent_id);
  const regular   = rootItems.filter(i => i.type !== "cta");
  const ctas      = rootItems.filter(i => i.type === "cta");

  return (
    <div style={{
      width: 375, margin: "0 auto", position: "relative",
      border: `1px solid ${C?.border || "#2a2218"}`,
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
    }}>
      {/* Browser chrome */}
      <div style={{ background: "#161616", padding: "8px 12px", display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 5 }}>
          {["#f87171", "#fbbf24", "#4ade80"].map((c, i) => (
            <div key={i} style={{ width: 8, height: 8, borderRadius: "50%", background: c }} />
          ))}
        </div>
        <div style={{ flex: 1, background: "#222", borderRadius: 4, padding: "3px 10px", fontFamily: MONO, fontSize: 9, color: "#6a6a6a", textAlign: "center" }}>
          luxuryweddingdirectory.com
        </div>
      </div>

      {/* Mobile header */}
      <div style={{
        height, background: navConfig?.header_bg_color || "#0b0906",
        display: "flex", alignItems: "center", justifyContent: logoPos === "center" ? "center" : "space-between",
        padding: "0 16px", position: "relative", borderBottom: `1px solid #2a2218`,
      }}>
        {logoPos === "center" && (
          <button onClick={() => setDrawerOpen(o => !o)} style={{
            position: "absolute", left: 16,
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: "#f5efe4", fontSize: 16,
          }}>☰</button>
        )}
        <span style={{ fontFamily: SERIF, fontSize: logoSize * 0.6, color: "#f5efe4", fontWeight: 600 }}>
          LWD
        </span>
        {logoPos !== "center" && (
          <button onClick={() => setDrawerOpen(o => !o)} style={{
            background: "none", border: "none", cursor: "pointer", padding: 4,
            color: "#f5efe4", fontSize: 16,
          }}>☰</button>
        )}
      </div>

      {/* Drawer / overlay */}
      {drawerOpen && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex: 50,
          background: menuStyle === "fullscreen" ? "#0b0906" : "transparent",
          display: "flex",
        }}>
          {menuStyle !== "fullscreen" && (
            <div onClick={() => setDrawerOpen(false)} style={{ flex: 1, background: "rgba(0,0,0,0.6)" }} />
          )}
          <div style={{
            width: menuStyle === "fullscreen" ? "100%" : 280,
            background: "#0b0906",
            height: "100%", overflowY: "auto",
            padding: 24, display: "flex", flexDirection: "column", gap: 4,
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontFamily: SERIF, fontSize: 18, color: "#f5efe4", fontWeight: 600 }}>LWD</span>
              <button onClick={() => setDrawerOpen(false)} style={{ background: "none", border: "none", color: "#8a7d6a", cursor: "pointer", fontSize: 18 }}>×</button>
            </div>
            {regular.map(item => {
              const isSelected = selectedItemId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => { if (canvasMode === "edit") { onItemClick?.(item); setDrawerOpen(false); } else window.open(getLiveUrl(item), "_blank"); }}
                  style={{
                    padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                    background: isSelected ? G + "14" : "transparent",
                    borderLeft: isSelected ? `3px solid ${G}` : "3px solid transparent",
                    fontFamily: SANS, fontSize: 14, color: isSelected ? G : "#f5efe4",
                    fontWeight: isSelected ? 600 : 400,
                    transition: "all 0.15s",
                  }}
                >
                  {item.label}
                </div>
              );
            })}
            {ctas.length > 0 && (
              <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                {ctas.map(item => (
                  <span key={item.id} style={{
                    fontFamily: SANS, fontSize: 12, fontWeight: 700, letterSpacing: "0.08em",
                    textTransform: "uppercase", padding: "12px 20px", borderRadius: 6,
                    background: item.cta_style === "outline" ? "transparent" : item.cta_style === "dark" ? "#0a0906" : G,
                    border: `1px solid ${item.cta_style === "dark" ? "#333" : G}`,
                    color: item.cta_style === "gold" ? "#0a0906" : G, textAlign: "center",
                  }}>{item.label}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hero placeholder */}
      <div style={{
        background: theme.bg, height: 280,
        display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
        gap: 12, padding: "0 24px", position: "relative", overflow: "hidden",
      }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.03, backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 48px)", pointerEvents: "none" }} />
        <div style={{ fontFamily: SANS, fontSize: 8, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.heroText }}>
          Luxury Wedding Directory
        </div>
        <div style={{ fontFamily: SERIF, fontSize: 28, fontWeight: 400, color: theme.text, lineHeight: 1.2, textAlign: "center" }}>
          Your Perfect<br />Wedding Venue
        </div>
        <div style={{ fontFamily: SANS, fontSize: 11, color: theme.sub, letterSpacing: "0.04em", textAlign: "center" }}>
          Discover the world's finest venues
        </div>
        <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 24px", borderRadius: 6, background: G, color: "#0a0906" }}>
          Browse Venues
        </span>
      </div>
    </div>
  );
}

// ── Main canvas component ─────────────────────────────────────────────────
export default function MenuCanvas({
  items, C, selectedItemId, draftForm, navConfig,
  onItemClick,
}) {
  const G = C?.gold || "#c9a84c";
  const [activeItemId, setActiveItemId]   = useState(null);
  const [pageTheme, setPageTheme]         = useState("dark");
  const [canvasMode, setCanvasMode]       = useState("edit");
  const [viewMode, setViewMode]           = useState("desktop");   // "desktop" | "mobile"
  const [headerState, setHeaderState]     = useState("default");   // "default" | "transparent" | "sticky"
  const [subcatCache, setSubcatCache]     = useState({});

  // Merge live draft onto the editing item
  const effectiveItems = items.map(item =>
    (item.id === selectedItemId && draftForm)
      ? { ...item, ...draftForm }
      : item
  );

  // Attach manual children to each parent for panel rendering
  const effectiveWithChildren = effectiveItems.map(item => ({
    ...item,
    _children: effectiveItems.filter(c => c.parent_id === item.id && c.visible),
  }));

  const rootItems = effectiveWithChildren.filter(i => i.visible && !i.parent_id);
  const regular   = rootItems.filter(i => i.type !== "cta");
  const ctas      = rootItems.filter(i => i.type === "cta");

  const resolvedActiveId = activeItemId || (selectedItemId && !activeItemId ? selectedItemId : null);
  const activeItem       = resolvedActiveId ? rootItems.find(i => i.id === resolvedActiveId) : null;
  const isPanel          = !!(activeItem && (activeItem.type === "dropdown" || activeItem.type === "mega_menu"));

  const theme = PAGE_THEMES[pageTheme];

  async function fetchSubcats(item) {
    const slug = item.mega_menu_source_slug;
    if (!slug || item.mega_menu_source !== "magazine_category") return;
    if (subcatCache[slug]) return;
    const [catsRes, postsRes] = await Promise.all([
      supabase.from("magazine_categories").select("id, slug, name, short_description, description").eq("parent_category_slug", slug).order("name", { ascending: true }),
      supabase.from("magazine_posts").select("id, title, slug, featured_image, read_time").eq("category_slug", slug).eq("status", "published").order("published_at", { ascending: false }).limit(1),
    ]);
    setSubcatCache(prev => ({ ...prev, [slug]: { subcats: catsRes.data || [], post: postsRes.data?.[0] || null } }));
  }

  const handleItemHover = item => {
    setActiveItemId(item.id);
    if (item.type === "mega_menu") fetchSubcats(item);
  };

  // ── Header appearance based on headerState + navConfig ─────────────────
  const headerHeight = headerState === "sticky"
    ? (navConfig?.header_sticky_height || 60)
    : (navConfig?.header_height || 64);

  const headerBg = headerState === "transparent"
    ? "transparent"
    : headerState === "sticky"
      ? (navConfig?.sticky_bg_color || "#0b0906")
      : (navConfig?.header_bg_color || "#0b0906");

  const headerOpacity = headerState === "transparent" ? 0
    : headerState === "sticky"
      ? (navConfig?.sticky_bg_opacity ?? 0.96)
      : (navConfig?.header_bg_opacity ?? 1);

  const headerShadow = headerState === "sticky" && navConfig?.sticky_shadow
    ? "0 4px 24px rgba(0,0,0,0.4)"
    : headerState !== "sticky" && navConfig?.header_shadow
      ? "0 2px 12px rgba(0,0,0,0.2)"
      : "none";

  const logoSize = headerState === "sticky"
    ? (navConfig?.sticky_logo_size || 30)
    : (navConfig?.header_logo_size || 36);

  const padX = navConfig?.header_pad_x || 40;

  const navTextColor = headerState === "transparent"
    ? "rgba(255,255,255,0.9)"
    : "rgba(255,255,255,0.82)";

  return (
    <div style={{ width: "100%" }}>
      {/* ── Toolbar ── */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 6, gap: 6,
        background: C?.bg || "#0b0906",
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 9, padding: "5px 8px",
      }}>

        {/* Left group: view | header state | mode */}
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>

          {/* Desktop / Mobile */}
          <div style={{ display: "flex", gap: 1 }}>
            {[["desktop", "⬜", "Desktop"], ["mobile", "📱", "Mobile"]].map(([val, icon, label]) => (
              <button key={val} onClick={() => setViewMode(val)} style={{
                background: viewMode === val ? G + "1e" : "transparent",
                border: `1px solid ${viewMode === val ? G + "55" : "transparent"}`,
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                textTransform: "uppercase", color: viewMode === val ? G : (C?.grey || "#8a7d6a"),
                transition: "all 0.15s", whiteSpace: "nowrap",
              }}>{icon} {label}</button>
            ))}
          </div>

          {/* Zone divider */}
          <div style={{ width: 1, height: 16, background: C?.border || "#2a2218", margin: "0 4px", flexShrink: 0 }} />

          {/* Header state — only desktop */}
          {viewMode === "desktop" ? (
            <div style={{ display: "flex", gap: 1 }}>
              {[["default", "Default"], ["transparent", "Glass"], ["sticky", "Sticky"]].map(([val, label]) => (
                <button key={val} onClick={() => setHeaderState(val)} style={{
                  background: headerState === val ? G + "18" : "transparent",
                  border: `1px solid ${headerState === val ? G + "55" : "transparent"}`,
                  borderRadius: 6, padding: "4px 9px", cursor: "pointer",
                  fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
                  textTransform: "uppercase", color: headerState === val ? G : (C?.grey || "#8a7d6a"),
                  transition: "all 0.15s",
                }}>{label}</button>
              ))}
            </div>
          ) : (
            <div style={{ display: "flex", gap: 1 }}>
              <button disabled style={{
                background: "transparent", border: "1px solid transparent",
                borderRadius: 6, padding: "4px 9px",
                fontFamily: SANS, fontSize: 9, color: C?.grey2 || "#5a5045",
                letterSpacing: "0.06em", textTransform: "uppercase",
              }}>Mobile view</button>
            </div>
          )}

          {/* Zone divider */}
          <div style={{ width: 1, height: 16, background: C?.border || "#2a2218", margin: "0 4px", flexShrink: 0 }} />

          {/* Edit / Live */}
          <div style={{ display: "flex", gap: 1 }}>
            {[["edit", "Edit"], ["live", "Live"]].map(([val, label]) => (
              <button key={val} onClick={() => setCanvasMode(val)} style={{
                background: canvasMode === val ? (val === "live" ? "#1a3a1a" : G) : "transparent",
                border: canvasMode === val
                  ? `1px solid ${val === "live" ? "#4ade80" : G}`
                  : "1px solid transparent",
                borderRadius: 6, padding: "4px 10px", cursor: "pointer",
                fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: canvasMode === val ? (val === "live" ? "#4ade80" : "#0a0906") : (C?.grey || "#8a7d6a"),
                transition: "all 0.15s",
              }}>{label}</button>
            ))}
          </div>
        </div>

        {/* Right group: theme + live link */}
        <div style={{ display: "flex", gap: 2, alignItems: "center" }}>
          {/* Zone divider */}
          <div style={{ width: 1, height: 16, background: C?.border || "#2a2218", margin: "0 4px", flexShrink: 0 }} />
          {[["dark", "Dark"], ["light", "Light"], ["editorial", "Edt"]].map(([val, label]) => (
            <button key={val} onClick={() => setPageTheme(val)} style={{
              background: pageTheme === val ? G + "18" : "transparent",
              border: `1px solid ${pageTheme === val ? G + "55" : "transparent"}`,
              borderRadius: 6, padding: "4px 8px", cursor: "pointer",
              fontFamily: SANS, fontSize: 9, fontWeight: 600, letterSpacing: "0.05em",
              textTransform: "uppercase", color: pageTheme === val ? G : (C?.grey2 || "#5a5045"),
              transition: "all 0.15s",
            }}>{label}</button>
          ))}
          <a href="http://localhost:5176/" target="_blank" rel="noreferrer"
            style={{
              fontFamily: SANS, fontSize: 11, fontWeight: 700,
              color: C?.grey2 || "#5a5045", textDecoration: "none",
              border: `1px solid transparent`, borderRadius: 6, padding: "4px 6px",
              transition: "all 0.15s", lineHeight: 1,
            }}
            onMouseEnter={e => { e.currentTarget.style.color = G; }}
            onMouseLeave={e => { e.currentTarget.style.color = C?.grey2 || "#5a5045"; }}
          >↗</a>
        </div>
      </div>

      {/* ── Context row ── */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5, minHeight: 18 }}>
        {canvasMode === "edit" && selectedItemId ? (() => {
          const editingItem = effectiveItems.find(i => i.id === selectedItemId);
          return editingItem ? (
            <div style={{
              display: "inline-flex", alignItems: "center", gap: 6,
              background: G + "12", border: `1px solid ${G}30`,
              borderRadius: 5, padding: "2px 8px 2px 6px",
            }}>
              <span style={{ fontFamily: SANS, fontSize: 9, color: G, opacity: 0.7 }}>✎</span>
              <span style={{ fontFamily: SANS, fontSize: 9, color: G, fontWeight: 700, letterSpacing: "0.04em" }}>
                {editingItem.label}
              </span>
            </div>
          ) : null;
        })() : (
          <div style={{ fontFamily: SANS, fontSize: 9, letterSpacing: "0.04em", color: C?.grey || "#8a7d6a", opacity: 0.6, display: "flex", alignItems: "center", gap: 4 }}>
            {canvasMode === "edit"
              ? <><span>✎</span> Click any item to select</>
              : <><span style={{ color: "#4ade80", fontSize: 8 }}>●</span> Live - links open in new tab</>
            }
          </div>
        )}
      </div>

      {/* ── Mobile view ── */}
      {viewMode === "mobile" && (
        <MobileCanvas
          items={effectiveWithChildren}
          navConfig={navConfig}
          C={C}
          theme={theme}
          canvasMode={canvasMode}
          selectedItemId={selectedItemId}
          onItemClick={onItemClick}
        />
      )}

      {/* ── Desktop view ── */}
      {viewMode === "desktop" && (
        <div style={{
          width: "100%",
          border: `1px solid ${C?.border || "#2a2218"}`,
          borderRadius: 10, boxShadow: "0 12px 48px rgba(0,0,0,0.6)",
          overflow: "visible", position: "relative",
        }}>
          {/* Browser chrome */}
          <div style={{
            background: "#161616", padding: "10px 16px",
            borderRadius: "12px 12px 0 0",
            display: "flex", alignItems: "center", gap: 8,
            borderBottom: `1px solid ${canvasMode === "live" ? "#4ade8030" : "#2a2a2a"}`,
            transition: "border-color 0.2s",
          }}>
            <div style={{ display: "flex", gap: 6 }}>
              {["#f87171", "#fbbf24", "#4ade80"].map((c, i) => (
                <div key={i} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
              ))}
            </div>
            <div style={{ flex: 1, margin: "0 16px", background: "#222", borderRadius: 6, padding: "5px 14px", fontFamily: MONO, fontSize: 11, color: "#6a6a6a", textAlign: "center" }}>
              luxuryweddingdirectory.com
            </div>
            <div style={{
              fontFamily: SANS, fontSize: 8, fontWeight: 700, letterSpacing: "0.1em",
              textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
              background: canvasMode === "live" ? "#4ade8022" : G + "18",
              border: `1px solid ${canvasMode === "live" ? "#4ade8055" : G + "40"}`,
              color: canvasMode === "live" ? "#4ade80" : G, transition: "all 0.2s",
            }}>
              {canvasMode === "live" ? "Live" : "Edit"}
            </div>
          </div>

          {/* Viewport */}
          <div>
            {/* Nav bar */}
            <div
              style={{
                height: headerHeight, position: "relative", zIndex: 10,
                background: headerState === "transparent"
                  ? "transparent"
                  : headerBg,
                opacity: headerState === "transparent" ? 1 : 1, // opacity on wrapper would affect children
                borderBottom: navConfig?.header_border_bottom
                  ? `1px solid ${navConfig.header_border_color || "#2a2218"}`
                  : headerState === "sticky"
                    ? "none"
                    : "1px solid #2a2218",
                boxShadow: headerShadow,
                transition: "height 0.2s, box-shadow 0.2s",
              }}
              onMouseLeave={() => setActiveItemId(null)}
            >
              {/* Background layer for opacity control */}
              {headerState !== "transparent" && (
                <div style={{
                  position: "absolute", inset: 0, zIndex: 0,
                  background: headerBg,
                  opacity: headerOpacity,
                }} />
              )}

              {/* Nav content */}
              <div style={{
                position: "relative", zIndex: 1,
                height: "100%", display: "flex", alignItems: "center",
                justifyContent: "space-between", padding: `0 ${padX}px`,
              }}>
                {/* Logo */}
                <div style={{
                  fontFamily: SERIF, fontSize: logoSize * 0.55,
                  color: "#f5efe4", fontWeight: 600, letterSpacing: "0.04em", flexShrink: 0,
                  transition: "font-size 0.2s",
                }}>
                  LWD
                </div>

                {/* Nav links */}
                <div style={{ display: "flex", alignItems: "center", gap: 28, flex: 1, justifyContent: "center" }}>
                  {regular.length === 0 && (
                    <span style={{ fontFamily: SANS, fontSize: 12, color: "#5a5045", fontStyle: "italic" }}>
                      No visible items - add items above
                    </span>
                  )}
                  {regular.map(item => {
                    const isActive   = resolvedActiveId === item.id;
                    const isEditing  = canvasMode === "edit" && selectedItemId === item.id;
                    const isDropdown = item.type === "dropdown" || item.type === "mega_menu";
                    const itemAccent = (item.panel_accent_color && isDropdown) ? item.panel_accent_color : G;
                    const labelFont  = item.label_font === "serif" ? SERIF : item.label_font === "mono" ? MONO : SANS;
                    const labelColor = item.label_color || navTextColor;

                    const handleClick = canvasMode === "edit"
                      ? () => onItemClick?.(item)
                      : () => window.open(getLiveUrl(item), "_blank");

                    return (
                      <div key={item.id} style={{
                        position: "relative", cursor: "pointer",
                        padding: "4px 8px", borderRadius: 5,
                        background: canvasMode === "edit" && isEditing
                          ? G + "28"
                          : isActive ? (canvasMode === "live" ? "rgba(255,255,255,0.06)" : G + "0c") : "transparent",
                        outline: canvasMode === "edit" && isEditing ? `1.5px solid ${G}80` : "none",
                        outlineOffset: canvasMode === "edit" && isEditing ? "2px" : "0",
                        transition: "background 0.15s, outline 0.15s",
                      }}
                        onMouseEnter={() => handleItemHover(item)}
                        onClick={handleClick}
                        title={canvasMode === "edit" ? `Edit: ${item.label}` : `Open: ${item.label}`}
                      >
                        <span style={{
                          fontFamily: labelFont, fontSize: 12, letterSpacing: "0.04em",
                          color: isActive ? itemAccent : (canvasMode === "edit" && isEditing ? G : labelColor),
                          fontWeight: isEditing || isActive ? 600 : 400,
                          display: "flex", alignItems: "center", gap: 4,
                          transition: "color 0.15s", userSelect: "none",
                        }}>
                          {item.label}
                          {isDropdown && (
                            <span style={{
                              fontSize: 7, opacity: 0.7,
                              transform: isActive ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "transform 0.2s", display: "inline-block",
                            }}>▼</span>
                          )}
                        </span>
                        {isActive && (
                          <div style={{ position: "absolute", bottom: -4, left: 0, right: 0, height: 1.5, background: itemAccent }} />
                        )}
                        {canvasMode === "edit" && isEditing && !isActive && (
                          <div style={{ position: "absolute", top: 2, right: 2, width: 5, height: 5, borderRadius: "50%", background: G }} />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* CTA buttons */}
                {ctas.length > 0 && (
                  <div style={{ display: "flex", gap: 10, flexShrink: 0 }}>
                    {ctas.map(item => {
                      const isEditing = canvasMode === "edit" && selectedItemId === item.id;
                      const handleCtaClick = canvasMode === "edit"
                        ? () => onItemClick?.(item)
                        : () => window.open(getLiveUrl(item), "_blank");
                      return (
                        <span key={item.id}
                          onClick={handleCtaClick}
                          title={canvasMode === "edit" ? `Edit: ${item.label}` : `Open: ${item.label}`}
                          style={{
                            fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em",
                            textTransform: "uppercase", padding: "7px 18px", borderRadius: 6, cursor: "pointer",
                            background: item.cta_style === "outline" ? "transparent" : item.cta_style === "dark" ? "#0a0906" : G,
                            border: `1.5px solid ${canvasMode === "edit" && isEditing ? "#fff" : item.cta_style === "dark" ? "#2a2a2a" : G}`,
                            color: item.cta_style === "gold" ? "#0a0906" : G,
                            userSelect: "none",
                            outline: canvasMode === "edit" && isEditing ? `2px solid ${G}80` : "none",
                            outlineOffset: 2,
                          }}
                        >{item.label}</span>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dropdown / mega menu panel */}
              {isPanel && activeItem && (
                <NavPanel item={activeItem} subcatCache={subcatCache} G={G} />
              )}
            </div>

            {/* Hero placeholder */}
            <div style={{
              background: headerState === "transparent"
                ? "linear-gradient(180deg, #1a0d06 0%, " + theme.bg + " 100%)"
                : theme.bg,
              height: 220, borderRadius: "0 0 10px 10px",
              position: "relative", overflow: "hidden",
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 14,
            }}>
              <div style={{ position: "absolute", inset: 0, pointerEvents: "none", opacity: 0.035, backgroundImage: "repeating-linear-gradient(0deg,#fff,#fff 1px,transparent 1px,transparent 56px),repeating-linear-gradient(90deg,#fff,#fff 1px,transparent 1px,transparent 56px)" }} />
              <div style={{ fontFamily: SANS, fontSize: 9, fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: theme.heroText }}>
                Luxury Wedding Directory
              </div>
              <div style={{ fontFamily: SERIF, fontSize: 46, fontWeight: 400, color: theme.text, lineHeight: 1.1, textAlign: "center", maxWidth: 560 }}>
                Your Perfect Wedding Venue
              </div>
              <div style={{ fontFamily: SANS, fontSize: 14, color: theme.sub, letterSpacing: "0.04em" }}>
                Discover the world's finest wedding venues and suppliers
              </div>
              <div style={{ marginTop: 4, display: "flex", gap: 12 }}>
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 28px", borderRadius: 6, background: G, color: "#0a0906", userSelect: "none" }}>Browse Venues</span>
                <span style={{ fontFamily: SANS, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", padding: "10px 28px", borderRadius: 6, background: "transparent", border: `1px solid ${theme.text}25`, color: theme.text + "aa", userSelect: "none" }}>Take the Quiz</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active panel info strip */}
      {activeItem && isPanel && viewMode === "desktop" && (
        <div style={{
          marginTop: 12, padding: "10px 18px",
          background: (activeItem.panel_bg || "#1a1510") + "55",
          border: `1px solid ${activeItem.panel_accent_color || G}30`,
          borderRadius: 8, display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center",
        }}>
          <span style={{ fontFamily: SANS, fontSize: 10, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: activeItem.panel_accent_color || G }}>
            {activeItem.label}
          </span>
          {[
            ["Preset",    PRESETS[activeItem.menu_preset]?.label || activeItem.menu_preset],
            ["Animation", ANIMATIONS.find(a => a.value === activeItem.animation)?.label || activeItem.animation],
            ["Layout",    LAYOUT_TYPES.find(l => l.value === activeItem.layout_type)?.label || activeItem.layout_type],
            ["Width",     activeItem.panel_width_mode || "full"],
          ].map(([k, v]) => v ? (
            <span key={k} style={{ fontFamily: SANS, fontSize: 11, color: C?.grey || "#8a7d6a" }}>
              <span style={{ color: C?.off || "#d4c8b0", marginRight: 4 }}>{k}:</span>{v}
            </span>
          ) : null)}
        </div>
      )}
    </div>
  );
}
