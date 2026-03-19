// ─── src/components/nav/HomeNav.jsx ──────────────────────────────────────────
import { useState, useEffect, useRef, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";
import { useTheme } from "../../theme/ThemeContext";
import MegaMenuPanel from "./MegaMenuPanel";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

// Maps nav_action values to handler functions passed as props
function resolveHandler(item, handlers) {
  const { nav_action, url, slug, open_new_tab } = item;
  if (nav_action === "about")          return () => handlers.onNavigateAbout?.();
  if (nav_action === "planning")       return () => handlers.onNavigateStandard?.();
  if (nav_action === "aura-discovery") return () => { window.location.href = "/discovery/aura"; };
  if (nav_action === "browse")         return () => { window.location.href = "/venue"; };
  if (nav_action === "real-weddings")  return () => { window.location.href = "/real-weddings"; };
  if (nav_action === "magazine")       return () => { window.location.href = "/magazine"; };
  if (nav_action === "join")           return () => { window.location.href = "/join"; };
  if (nav_action === "contact")        return () => { window.location.href = "/contact"; };
  if (nav_action === "artistry-awards")return () => { window.location.href = "/artistry-awards"; };
  if (url) return () => { open_new_tab ? window.open(url, "_blank", "noreferrer") : window.location.href = url; };
  if (slug) return () => { window.location.href = `/${slug}`; };
  return null;
}

// Fallback links used if Supabase is unavailable
const FALLBACK_LINKS = [
  { id: "f1", label: "Browse",         nav_action: "browse",         visible: true },
  { id: "f2", label: "Aura Discovery", nav_action: "aura-discovery", visible: true },
  { id: "f3", label: "Real Weddings",  nav_action: "real-weddings",  visible: true },
  { id: "f4", label: "Planning",       nav_action: "planning",       visible: true },
  { id: "f5", label: "About",          nav_action: "about",          visible: true },
  { id: "f6", label: "Magazine",       nav_action: "magazine",       visible: true },
];

export default function HomeNav({ onToggleDark, darkMode, onVendorLogin, onNavigateStandard, onNavigateAbout, hasHero = true }) {
  const C = useTheme();
  const [scrolled,    setScrolled]   = useState(false);
  const [drawerOpen,  setDrawerOpen] = useState(false);
  const [navItems,    setNavItems]   = useState(FALLBACK_LINKS);
  const [openPanel,   setOpenPanel]  = useState(null); // nav item id | null
  const navRef    = useRef(null);
  const closeTimer = useRef(null);

  // ── Two-state logic ──────────────────────────────────────────────────────────
  // transparent = on a hero page AND not yet scrolled past threshold
  // solid       = scrolled, OR no hero on this page
  const isTransparent = hasHero && !scrolled;

  // Colours derived from state — never white-on-white
  // Solid state respects darkMode so it works on both light + dark pages
  const solidBg     = darkMode ? "rgba(11,9,6,0.97)"           : "rgba(255,255,255,0.97)";
  const solidBrand  = darkMode ? "#f5f0e8"                     : "#1e1e1e";
  const solidLink   = darkMode ? "rgba(255,255,255,0.75)"      : "#3a3a3a";
  const solidIcon   = darkMode ? "rgba(255,255,255,0.5)"       : "#3a3a3a";
  const solidBorder = darkMode ? "rgba(255,255,255,0.08)"      : "rgba(0,0,0,0.15)";
  const solidEdge   = darkMode ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)";
  const solidShadow = darkMode ? "none"                        : "0 2px 20px rgba(0,0,0,0.06)";

  const navBg       = isTransparent ? "transparent" : solidBg;
  const navBorder   = isTransparent ? "none"        : solidEdge;
  const navShadow   = isTransparent ? "none"        : solidShadow;
  const brandColor  = isTransparent ? "#f5f0e8"     : solidBrand;
  const linkColor   = isTransparent ? "rgba(255,255,255,0.82)" : solidLink;
  const iconColor   = isTransparent ? "rgba(255,255,255,0.6)"  : solidIcon;
  const iconBorder  = isTransparent ? "rgba(255,255,255,0.25)" : solidBorder;

  const openMegaMenu = useCallback(id => {
    clearTimeout(closeTimer.current);
    setOpenPanel(id);
  }, []);

  const startClose = useCallback(() => {
    closeTimer.current = setTimeout(() => setOpenPanel(null), 120);
  }, []);

  const cancelClose = useCallback(() => {
    clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", handler, { passive: true });
    // Initialise immediately (page may already be scrolled on mount)
    handler();
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  // Load nav items from Supabase, fall back to static list on error
  useEffect(() => {
    supabase
      .from("nav_items")
      .select("id, label, url, slug, nav_action, open_new_tab, visible, position, type, is_cta, cta_style, animation, panel_bg, panel_text_color, panel_accent_color, panel_hover_color, panel_border_color, panel_shadow, panel_radius, panel_padding, panel_full_width, panel_align, layout_type, show_descriptions, has_cta_in_panel, panel_cta_label, panel_cta_link, featured_title, featured_text, featured_image, featured_link, menu_preset")
      .is("parent_id", null)
      .eq("visible", true)
      .order("position", { ascending: true })
      .then(({ data, error }) => {
        if (!error && data && data.length > 0) setNavItems(data);
      });
  }, []);

  const handlers = { onNavigateAbout, onNavigateStandard, onVendorLogin };

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Main navigation"
        className="home-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 700,
          padding: isTransparent ? "20px 40px" : "12px 40px",
          background: navBg,
          backdropFilter: isTransparent ? "none" : "blur(20px)",
          borderBottom: navBorder,
          boxShadow: navShadow,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "background 0.3s ease, padding 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
        }}
      >
        {/* Brand */}
        <div
          className="home-nav-brand"
          style={{
            fontFamily: GD,
            fontSize: 20,
            fontWeight: 600,
            color: brandColor,
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "color 0.3s ease",
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Luxury <span style={{ color: C.gold }}>Wedding</span> Directory
        </div>

        {/* Right side, desktop */}
        <div className="home-nav-right-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {navItems.filter(i => i.type !== "cta").map((item) => {
            const FONT_MAP = { serif: GD, mono: "'JetBrains Mono','Fira Mono',monospace", sans: NU };
            const labelFont = FONT_MAP[item.label_font] || NU;
            const itemColor = item.label_color || linkColor;
            const labelColor = itemColor;
            const handler   = resolveHandler(item, handlers);
            const isMega    = item.type === "mega_menu" || item.type === "dropdown";
            const navH      = navRef.current ? navRef.current.getBoundingClientRect().bottom : 64;

            if (isMega) {
              return (
                <div
                  key={item.id}
                  style={{ position: "relative" }}
                  onMouseEnter={() => openMegaMenu(item.id)}
                  onMouseLeave={startClose}
                >
                  <button
                    className="home-nav-links"
                    onClick={handler || undefined}
                    style={{
                      background: "none", border: "none",
                      cursor: "pointer", fontSize: 13, fontWeight: 400,
                      color: openPanel === item.id ? C.gold : linkColor,
                      fontFamily: labelFont, letterSpacing: "0.3px", transition: "color 0.2s",
                      display: "flex", alignItems: "center", gap: 4,
                    }}
                  >
                    {item.label}
                    <span style={{ fontSize: 9, opacity: 0.6, transition: "transform 0.2s", transform: openPanel === item.id ? "rotate(180deg)" : "rotate(0deg)" }}>▾</span>
                  </button>
                  {openPanel === item.id && (
                    <MegaMenuPanel
                      item={item}
                      navHeight={navH}
                      onMouseEnter={cancelClose}
                      onMouseLeave={startClose}
                    />
                  )}
                </div>
              );
            }

            return (
              <button
                key={item.id}
                className="home-nav-links"
                onClick={handler || undefined}
                style={{
                  background: "none", border: "none",
                  cursor: handler ? "pointer" : "default",
                  fontSize: 13, fontWeight: 400, color: linkColor,
                  fontFamily: labelFont, letterSpacing: "0.3px", transition: "color 0.2s",
                }}
                onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={e => (e.currentTarget.style.color = linkColor)}
              >
                {item.label}
              </button>
            );
          })}
          {/* CTA items — pinned right, styled button */}
          {navItems.filter(i => i.type === "cta").map((item) => {
            const handler = resolveHandler(item, handlers);
            const isOutline = item.cta_style === "outline";
            const isDark = item.cta_style === "dark";
            return (
              <button
                key={item.id}
                onClick={handler || undefined}
                style={{
                  background: isDark ? "#0a0906" : isOutline ? "transparent" : C.gold,
                  color: isDark ? C.gold : isOutline ? C.gold : "#0a0906",
                  border: `1px solid ${isDark ? "#333" : C.gold}`,
                  borderRadius: "var(--lwd-radius-input)",
                  padding: "8px 20px", fontSize: 10, fontWeight: 700,
                  letterSpacing: "1.5px", textTransform: "uppercase",
                  cursor: "pointer", fontFamily: NU, transition: "all 0.25s ease",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = C.gold; e.currentTarget.style.color = "#0a0906"; }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isDark ? "#0a0906" : isOutline ? "transparent" : C.gold;
                  e.currentTarget.style.color = isDark ? C.gold : isOutline ? C.gold : "#0a0906";
                }}
              >{item.label}</button>
            );
          })}

          <div className="home-nav-divider" style={{ width: 1, height: 18, background: C.border2 }} />

          {/* Dark mode toggle */}
          <button
            className="home-nav-dark-toggle"
            onClick={onToggleDark}
            title={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            aria-label={darkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}
            style={{
              background: "none",
              border: `1px solid ${iconBorder}`,
              borderRadius: "var(--lwd-radius-input)",
              color: iconColor,
              width: 36,
              height: 36,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.3s ease",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.gold;
              e.currentTarget.style.color = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = iconBorder;
              e.currentTarget.style.color = iconColor;
            }}
          >
            {darkMode ? "☀" : "☽"}
          </button>
        </div>

        {/* Hamburger, mobile only */}
        <button
          className="home-nav-hamburger"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open menu"
          style={{
            display: "none",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            flexDirection: "column",
            gap: 5,
          }}
        >
          <span style={{ width: 22, height: 1.5, background: "#f5f0e8", borderRadius: 1, display: "block" }} />
          <span style={{ width: 16, height: 1.5, background: "#C9A84C", borderRadius: 1, display: "block", marginLeft: "auto" }} />
          <span style={{ width: 22, height: 1.5, background: "#f5f0e8", borderRadius: 1, display: "block" }} />
        </button>
      </nav>

      {/* ── Mobile Side Drawer ── */}
      {/* Backdrop */}
      <div
        className="home-nav-drawer-backdrop"
        onClick={() => setDrawerOpen(false)}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 800,
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(4px)",
          opacity: drawerOpen ? 1 : 0,
          pointerEvents: drawerOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
      />
      {/* Drawer panel */}
      <div
        className="home-nav-drawer"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          zIndex: 801,
          width: 300,
          maxWidth: "85vw",
          background: darkMode ? "rgba(12,11,8,0.98)" : "rgba(8,7,5,0.98)",
          backdropFilter: "blur(24px)",
          transform: drawerOpen ? "translateX(0)" : "translateX(100%)",
          transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
          display: "flex",
          flexDirection: "column",
          padding: "0 0 40px",
          overflowY: "auto",
        }}
      >
        {/* Drawer header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 24px", borderBottom: "1px solid rgba(201,168,76,0.15)" }}>
          <span style={{ fontFamily: GD, fontSize: 16, color: "#f5f0e8", fontWeight: 600 }}>
            Menu
          </span>
          <button
            onClick={() => setDrawerOpen(false)}
            aria-label="Close menu"
            style={{
              background: "none",
              border: "none",
              color: "rgba(245,240,232,0.5)",
              fontSize: 22,
              cursor: "pointer",
              padding: 4,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Nav links */}
        <div style={{ padding: "16px 0" }}>
          {navItems.map((item) => {
            const handler = resolveHandler(item, handlers);
            return (
            <button
              key={item.id}
              onClick={() => { setDrawerOpen(false); handler?.(); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: handler ? "pointer" : "default",
                padding: "14px 28px",
                fontSize: 15,
                fontWeight: 400,
                color: "rgba(245,240,232,0.7)",
                fontFamily: NU,
                letterSpacing: "0.3px",
                transition: "color 0.2s, background 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = C.gold; e.currentTarget.style.background = "rgba(201,168,76,0.06)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "rgba(245,240,232,0.7)"; e.currentTarget.style.background = "transparent"; }}
            >
              {item.label}
            </button>
          );})}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(201,168,76,0.12)", margin: "0 24px" }} />

        {/* Dark mode toggle */}
        <div style={{ padding: "20px 24px" }}>
          <button
            onClick={() => { onToggleDark?.(); }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(245,240,232,0.5)",
              fontFamily: NU,
              fontSize: 13,
              padding: 0,
            }}
          >
            <span style={{ fontSize: 16 }}>{darkMode ? "☀" : "☽"}</span>
            <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
          </button>
        </div>
      </div>
    </>
  );
}
