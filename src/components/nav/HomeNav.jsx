// ─── src/components/nav/HomeNav.jsx ──────────────────────────────────────────
import { useState, useEffect } from "react";
import { useTheme } from "../../theme/ThemeContext";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function HomeNav({ onToggleDark, darkMode, onVendorLogin, onNavigateStandard, onNavigateAbout }) {
  const C = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  // Lock body scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = drawerOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [drawerOpen]);

  const navLinks = ["Browse", "Aura Discovery", "Real Weddings", "Planning", "About", "Blog"];

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="home-nav"
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 700,
          padding: scrolled ? "12px 40px" : "20px 40px",
          background: scrolled
            ? darkMode
              ? "rgba(8,8,8,0.97)"
              : "rgba(255,255,255,0.97)"
            : "transparent",
          backdropFilter: scrolled ? "blur(20px)" : "none",
          borderBottom: scrolled ? `1px solid ${C.border}` : "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          transition: "all 0.4s ease",
        }}
      >
        {/* Brand */}
        <div
          className="home-nav-brand"
          style={{
            fontFamily: GD,
            fontSize: 20,
            fontWeight: 600,
            color: scrolled && !darkMode ? C.white : "#f5f0e8",
            letterSpacing: 0.5,
            cursor: "pointer",
            transition: "color 0.4s ease",
          }}
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        >
          Luxury <span style={{ color: C.gold }}>Wedding</span> Directory
        </div>

        {/* Right side, desktop */}
        <div className="home-nav-right-desktop" style={{ display: "flex", gap: 28, alignItems: "center" }}>
          {navLinks.map((t) => {
            const linkColor =
              scrolled && !darkMode ? C.grey : "rgba(255,255,255,0.6)";
            return (
              <button
                key={t}
                className="home-nav-links"
                onClick={() => { if (t === "Aura Discovery") window.location.href = "/discovery/aura"; if (t === "Planning") onNavigateStandard?.(); if (t === "About") onNavigateAbout?.(); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 400,
                  color: linkColor,
                  fontFamily: NU,
                  letterSpacing: "0.3px",
                  transition: "color 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.color = C.gold)}
                onMouseLeave={(e) => (e.currentTarget.style.color = linkColor)}
              >
                {t}
              </button>
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
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              color: C.grey,
              width: 36,
              height: 36,
              fontSize: 15,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.gold;
              e.currentTarget.style.color = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border2;
              e.currentTarget.style.color = C.grey;
            }}
          >
            {darkMode ? "☀" : "☽"}
          </button>

          {/* Vendor Login */}
          <button
            className="home-nav-vendor-login"
            onClick={onVendorLogin}
            style={{
              background: "none",
              border: `1px solid ${C.border2}`,
              borderRadius: "var(--lwd-radius-input)",
              color: C.grey,
              padding: "8px 16px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.gold;
              e.currentTarget.style.color = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border2;
              e.currentTarget.style.color = C.grey;
            }}
          >
            Vendor Login
          </button>

          {/* List Your Business */}
          <button
            onClick={() => onVendorLogin?.()}
            className="home-nav-list-biz"
            style={{
              background: "transparent",
              color: C.gold,
              border: `1px solid ${C.gold}`,
              borderRadius: "var(--lwd-radius-input)",
              padding: "8px 20px",
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: "1.8px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              transition: "all 0.3s ease",
              position: "relative",
              overflow: "hidden",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.gold;
              e.currentTarget.style.color = "#0a0906";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = C.gold;
            }}
          >
            List Your Business
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
          {navLinks.map((t) => (
            <button
              key={t}
              onClick={() => { setDrawerOpen(false); if (t === "Aura Discovery") window.location.href = "/discovery/aura"; if (t === "Planning") onNavigateStandard?.(); if (t === "About") onNavigateAbout?.(); }}
              style={{
                display: "block",
                width: "100%",
                textAlign: "left",
                background: "none",
                border: "none",
                cursor: "pointer",
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
              {t}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: "rgba(201,168,76,0.12)", margin: "0 24px" }} />

        {/* Actions */}
        <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          {/* Vendor Login */}
          <button
            onClick={() => { setDrawerOpen(false); onVendorLogin?.(); }}
            style={{
              background: "none",
              border: "1px solid rgba(201,168,76,0.3)",
              borderRadius: "var(--lwd-radius-card)",
              color: "rgba(245,240,232,0.7)",
              padding: "12px 20px",
              fontSize: 12,
              fontWeight: 600,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              transition: "all 0.2s",
              textAlign: "center",
            }}
          >
            Vendor Login
          </button>

          {/* List Your Business */}
          <button
            onClick={() => { setDrawerOpen(false); onVendorLogin?.(); }}
            style={{
              background: C.gold,
              color: "#0a0906",
              border: "none",
              borderRadius: "var(--lwd-radius-card)",
              padding: "13px 20px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "1.2px",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              transition: "all 0.2s",
              textAlign: "center",
            }}
          >
            List Your Business
          </button>
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
