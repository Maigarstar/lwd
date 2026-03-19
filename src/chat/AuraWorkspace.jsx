// ─── src/chat/AuraWorkspace.jsx ───────────────────────────────────────────────
import { useEffect, useState } from "react";
import { useChat }     from "./ChatContext";
import WorkspaceLeft   from "./WorkspaceLeft";
import WorkspaceCenter from "./WorkspaceCenter";
import WorkspaceRight  from "./WorkspaceRight";
import Icon            from "./Icons";

// ── Fixed shell colour tokens (top-bar + footer always dark) ──────────────────
const SHELL   = "#0D0B09";
const DEEP    = "#080605";
const GOLD    = "#C9A84C";

// ── Theme token factory ────────────────────────────────────────────────────────
function getTheme(dark) {
  if (dark) return {
    sidebarBg:      "#0D0B09",
    sidebarText:    "#FFFFFF",
    sidebarGrey:    "rgba(255,255,255,0.42)",
    sidebarDivider: "rgba(201,168,76,0.16)",
    sidebarBorder2: "rgba(255,255,255,0.1)",
    tabBarBg:       "#080605",
    tabBarBorder:   "rgba(201,168,76,0.16)",
    collapseBg:     "#0D0B09",
    centerBg:       "#1A1816",
    auraBubbleBg:   "#262220",
    auraBubbleText: "rgba(255,255,255,0.92)",
    userBubbleBg:   "#C9A84C",
    userBubbleText: "#0D0B09",
    inputBg:        "rgba(255,248,230,0.05)",
    inputBorder:    "rgba(201,168,76,0.18)",
    inputText:      "rgba(255,255,255,0.92)",
    inputPlaceholder:"rgba(255,255,255,0.35)",
    hintText:       "rgba(255,255,255,0.3)",
    scrollTrack:    "#1E1C1A",
    dividerLine:    "rgba(201,168,76,0.08)",
  };
  return {
    sidebarBg:      "#f3efeb",
    sidebarText:    "#1A1714",
    sidebarGrey:    "rgba(26,23,20,0.45)",
    sidebarDivider: "rgba(26,23,20,0.1)",
    sidebarBorder2: "rgba(26,23,20,0.15)",
    tabBarBg:       "#e8e3dc",
    tabBarBorder:   "rgba(26,23,20,0.12)",
    collapseBg:     "#f3efeb",
    centerBg:       "#F7F4F0",
    auraBubbleBg:   "#EDE8DF",
    auraBubbleText: "#1A1714",
    userBubbleBg:   "#1A1714",
    userBubbleText: "#FFFFFF",
    inputBg:        "#F8F6F2",
    inputBorder:    "#E5E0D8",
    inputText:      "#1A1714",
    inputPlaceholder:"rgba(26,23,20,0.35)",
    hintText:       "rgba(26,23,20,0.32)",
    scrollTrack:    "#F0EDE8",
    dividerLine:    "#EDEBE7",
  };
}

// ── Main component ─────────────────────────────────────────────────────────────
export default function AuraWorkspace({ onBack, onHome, onVenues, onLogin }) {
  const { closeFull, closeChat, activeContext, recommendations } = useChat();
  const isCompareMode = activeContext?.page === 'compare';

  // mobileDrawer: null | "left" | "right"
  const [mobileDrawer,   setMobileDrawer]   = useState(null);
  const [leftCollapsed,  setLeftCollapsed]  = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [visible,        setVisible]        = useState(false);
  const [darkMode,       setDarkMode]       = useState(false);
  const [shareToast,     setShareToast]     = useState(false);

  const T = getTheme(darkMode);
  const resultCount = recommendations?.items?.length ?? 0;

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  // ESC → minimise (or close drawer first)
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        if (mobileDrawer) setMobileDrawer(null);
        else closeFull();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [closeFull, mobileDrawer]);

  const handleHome   = () => { closeFull(); onHome?.(); };
  const handleVenues = () => { closeFull(); onVenues?.(); };
  const handleBack   = () => { closeFull(); onBack?.(); };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Aura, Wedding Planning", text: "Discover luxury wedding venues in Italy", url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  };

  const openLeft  = () => setMobileDrawer("left");
  const openRight = () => setMobileDrawer("right");
  const closeDrawer = () => setMobileDrawer(null);

  return (
    <>
      {/* ── Injected CSS ──────────────────────────────────────────────────── */}
      <style>{`
        .aws-left  { transition: width 0.25s ease; }
        .aws-right { transition: width 0.25s ease; }

        @media (max-width: 900px) {
          /* Desktop sidebars hidden in normal flow on mobile */
          .aws-left, .aws-right {
            display: none !important;
          }
          .aws-collapse-btn  { display: none !important; }
          .aws-topbar-nav    { display: none !important; }

          /* Chat always fills the body */
          .aws-body > .aws-center-panel {
            display: flex !important;
            flex-direction: column;
            flex: 1;
          }

          /* Compact top bar */
          .aws-topbar { height: 48px !important; padding: 0 12px !important; }
          .aws-topbar-subtitle { display: none !important; }
          .aws-topbar-identity-icon { width: 28px !important; height: 28px !important; }
          .aws-topbar-title { font-size: 16px !important; }
          /* Icon-only buttons */
          .aws-btn-label { display: none !important; }
          .aws-ctrl-btn { padding: 5px 8px !important; }
          /* Hide footer entirely on mobile */
          .aws-footer { display: none !important; }
          /* Show mobile-only elements */
          .aws-mobile-only { display: flex !important; }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aura, wedding planning workspace"
        style={{
          position:      "fixed",
          inset:          0,
          zIndex:         1000,
          display:       "flex",
          flexDirection: "column",
          background:     SHELL,
          fontFamily:    "var(--font-body)",
          opacity:        visible ? 1 : 0,
          transform:      visible ? "translateY(0)" : "translateY(12px)",
          transition:    "opacity 0.3s ease, transform 0.3s ease",
        }}
      >

        {/* ══ TOP BAR ════════════════════════════════════════════════════════ */}
        <div
          className="aws-topbar"
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "0 20px",
            height:          60,
            flexShrink:      0,
            background:      SHELL,
            borderBottom:   "1px solid rgba(201,168,76,0.16)",
          }}
        >
          {/* Left: hamburger (mobile) + Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Hamburger, mobile only */}
            <button
              className="aws-mobile-only"
              onClick={openLeft}
              title="Open menu"
              aria-label="Open sidebar"
              style={{
                display:       "none",
                background:   "none",
                border:       "none",
                color:       "rgba(255,255,255,0.6)",
                cursor:      "pointer",
                padding:      4,
                alignItems:  "center",
                justifyContent: "center",
                flexShrink:   0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="8" x2="21" y2="8" />
                <line x1="3" y1="16" x2="21" y2="16" />
              </svg>
            </button>

            <div
              className="aws-topbar-identity-icon"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.32)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: GOLD, flexShrink: 0,
              }}
            ><Icon name="sparkleMini" size={16} color={GOLD} /></div>
            <div>
              <div className="aws-topbar-title" style={{ fontFamily: "var(--font-heading-primary)", fontSize: 18, fontWeight: 500, color: "#fff", letterSpacing: "0.4px", lineHeight: 1, marginBottom: 2 }}>
                Chat with Aura
              </div>
              <div className="aws-topbar-subtitle" style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", letterSpacing: "1.2px", textTransform: "uppercase" }}>
                Wedding Concierge
              </div>
            </div>
          </div>

          {/* Centre nav, hidden on mobile */}
          <div className="aws-topbar-nav" style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TopNavBtn label="Home"   onClick={handleHome}   />
            <TopNavBtn label="Venues" onClick={handleVenues} />
            <div style={{ width: 1, height: 16, background: "rgba(255,255,255,0.1)", margin: "0 8px" }} />
            <button
              onClick={onLogin}
              style={{
                background: "rgba(201,168,76,0.1)", border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: 3,
                color: GOLD, fontFamily: "var(--font-body)", fontSize: 11, cursor: "pointer",
                padding: "6px 18px", letterSpacing: "0.5px", transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.18)"; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(201,168,76,0.1)"; e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
            >Login</button>
          </div>

          {/* Controls */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            {/* Results, mobile only */}
            <button
              className="aws-mobile-only"
              onClick={openRight}
              title="Results"
              aria-label="Open results"
              style={{
                display:       "none",
                background:   "none",
                border:      "1px solid rgba(255,255,255,0.12)",
                borderRadius: 3,
                color:       "rgba(255,255,255,0.55)",
                fontSize:     15,
                cursor:      "pointer",
                width:        36,
                height:       36,
                alignItems:  "center",
                justifyContent: "center",
                flexShrink:   0,
                transition:  "all 0.2s",
                position:    "relative",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
            >
              <Icon name="sparkle" size={15} />
              {resultCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: GOLD, color: "#0D0B09",
                  width: 16, height: 16, borderRadius: "50%",
                  fontSize: 8, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {resultCount > 9 ? "9+" : resultCount}
                </span>
              )}
            </button>

            {/* Dark / light toggle */}
            <button
              onClick={() => setDarkMode((d) => !d)}
              title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                background:   "none",
                border:      "1px solid rgba(255,255,255,0.12)",
                borderRadius: 3,
                color:       "rgba(255,255,255,0.55)",
                fontSize:     15,
                cursor:      "pointer",
                width:        36,
                height:       36,
                display:     "flex",
                alignItems:  "center",
                justifyContent: "center",
                flexShrink:   0,
                transition:  "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.style.color = "#C9A84C"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
            >
              <Icon name={darkMode ? "sun" : "moon"} size={15} />
            </button>

            {/* Share */}
            <button
              onClick={handleShare}
              title="Share"
              style={{
                background:   "none",
                border:      "1px solid rgba(255,255,255,0.12)",
                borderRadius: 3,
                color:       "rgba(255,255,255,0.55)",
                fontFamily:  "var(--font-body)",
                fontSize:     11,
                cursor:      "pointer",
                padding:     "5px 13px",
                display:     "flex",
                alignItems:  "center",
                gap:          5,
                transition:  "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.3)"; e.currentTarget.style.color = "#fff"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.55)"; }}
            >
              <Icon name="link" size={13} /> <span className="aws-btn-label">Share</span>
            </button>

            {/* Minimise / Back to comparison */}
            {isCompareMode ? (
              <button
                onClick={closeChat}
                title="Back to comparison"
                style={{
                  background:   "rgba(201,168,76,0.1)",
                  border:      "1px solid rgba(201,168,76,0.3)",
                  borderRadius: 3,
                  color:        "#C9A84C",
                  fontFamily:  "var(--font-body)",
                  fontSize:     11,
                  cursor:      "pointer",
                  padding:     "5px 13px",
                  display:     "flex",
                  alignItems:  "center",
                  gap:          5,
                  transition:  "all 0.2s",
                  whiteSpace:  "nowrap",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(201,168,76,0.18)"; e.currentTarget.style.borderColor = "#C9A84C"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(201,168,76,0.1)";  e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)"; }}
              >
                ← Back to comparison
              </button>
            ) : (
              <CtrlBtn icon={<Icon name="minimize" size={13} />} label="Minimise" onClick={closeFull} />
            )}

            {/* Share toast */}
            {shareToast && (
              <div
                style={{
                  position:   "absolute",
                  top:         46,
                  right:        0,
                  background:   "#1A1714",
                  border:      "1px solid rgba(201,168,76,0.3)",
                  borderRadius: 3,
                  color:        GOLD,
                  fontFamily:  "var(--font-body)",
                  fontSize:     11,
                  padding:     "7px 14px",
                  whiteSpace:  "nowrap",
                  boxShadow:   "0 4px 16px rgba(0,0,0,0.3)",
                  zIndex:       20,
                }}
              >
                ✓ Link copied to clipboard
              </div>
            )}
          </div>
        </div>

        {/* ══ BODY ═══════════════════════════════════════════════════════════ */}
        <div
          className="aws-body"
          style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}
        >
          {/* ── Left sidebar (desktop: inline, mobile: hidden in flow) ──── */}
          <div
            className="aws-left"
            style={{
              width:         leftCollapsed ? 52 : 280,
              background:    T.sidebarBg,
              borderRight:  `1px solid ${T.sidebarDivider}`,
              display:      "flex",
              flexDirection: "column",
              overflow:     "hidden",
              position:     "relative",
              flexShrink:    0,
              transition:   "background 0.3s ease",
            }}
          >
            <WorkspaceLeft collapsed={leftCollapsed} onBack={handleBack} darkMode={darkMode} />
            <CollapseBtn side="left" collapsed={leftCollapsed} onClick={() => setLeftCollapsed((v) => !v)} posStyle={{ right: -13 }} />
          </div>

          {/* ── Centre chat (always visible on mobile) ──────────────────── */}
          <div
            className="aws-center-panel"
            style={{
              flex:          1,
              minWidth:      0,
              background:    T.centerBg,
              display:      "flex",
              flexDirection: "column",
              position:     "relative",
              boxShadow:    "-6px 0 48px rgba(0,0,0,0.28), 6px 0 48px rgba(0,0,0,0.28)",
              transition:   "background 0.3s ease",
            }}
          >
            <WorkspaceCenter darkMode={darkMode} />
          </div>

          {/* ── Right sidebar (desktop: inline, mobile: hidden in flow) ── */}
          <div
            className="aws-right"
            style={{
              width:         rightCollapsed ? 52 : 320,
              background:    T.sidebarBg,
              borderLeft:   `1px solid ${T.sidebarDivider}`,
              display:      "flex",
              flexDirection: "column",
              overflow:     "hidden",
              position:     "relative",
              flexShrink:    0,
              transition:   "background 0.3s ease",
            }}
          >
            <WorkspaceRight collapsed={rightCollapsed} darkMode={darkMode} />
            <CollapseBtn side="right" collapsed={rightCollapsed} onClick={() => setRightCollapsed((v) => !v)} posStyle={{ left: -13 }} />
          </div>
        </div>

        {/* ══ MOBILE DRAWER OVERLAY ════════════════════════════════════════ */}
        {/* Backdrop */}
        <div
          onClick={closeDrawer}
          style={{
            position:   "fixed",
            inset:       0,
            background: "rgba(0,0,0,0.5)",
            zIndex:      1100,
            opacity:     mobileDrawer ? 1 : 0,
            pointerEvents: mobileDrawer ? "auto" : "none",
            transition: "opacity 0.25s ease",
          }}
        />

        {/* Left drawer */}
        <div
          style={{
            position:      "fixed",
            top:            0,
            left:           0,
            bottom:         0,
            width:          280,
            maxWidth:      "80vw",
            background:     T.sidebarBg,
            zIndex:         1101,
            display:       "flex",
            flexDirection: "column",
            boxShadow:     mobileDrawer === "left" ? "4px 0 24px rgba(0,0,0,0.4)" : "none",
            transform:      mobileDrawer === "left" ? "translateX(0)" : "translateX(-100%)",
            transition:    "transform 0.28s ease",
          }}
        >
          {/* Drawer header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: `1px solid ${T.sidebarDivider}`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.32)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Icon name="sparkleMini" size={14} color={GOLD} />
              </div>
              <span style={{ fontFamily: "var(--font-heading-primary)", fontSize: 15, fontWeight: 500, color: T.sidebarText }}>
                Chat with Aura
              </span>
            </div>
            <button
              onClick={closeDrawer}
              aria-label="Close sidebar"
              style={{
                background: "none", border: "none",
                color: T.sidebarGrey, cursor: "pointer",
                padding: 4, display: "flex", alignItems: "center",
              }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          {/* Drawer content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <WorkspaceLeft collapsed={false} onBack={handleBack} darkMode={darkMode} />
          </div>
        </div>

        {/* Right drawer */}
        <div
          style={{
            position:      "fixed",
            top:            0,
            right:          0,
            bottom:         0,
            width:          310,
            maxWidth:      "85vw",
            background:     T.sidebarBg,
            zIndex:         1101,
            display:       "flex",
            flexDirection: "column",
            boxShadow:     mobileDrawer === "right" ? "-4px 0 24px rgba(0,0,0,0.4)" : "none",
            transform:      mobileDrawer === "right" ? "translateX(0)" : "translateX(100%)",
            transition:    "transform 0.28s ease",
          }}
        >
          {/* Drawer header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: `1px solid ${T.sidebarDivider}`,
            flexShrink: 0,
          }}>
            <span style={{ fontFamily: "var(--font-heading-primary)", fontSize: 15, fontWeight: 500, color: T.sidebarText }}>
              Results
            </span>
            <button
              onClick={closeDrawer}
              aria-label="Close results"
              style={{
                background: "none", border: "none",
                color: T.sidebarGrey, cursor: "pointer",
                padding: 4, display: "flex", alignItems: "center",
              }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          {/* Drawer content */}
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <WorkspaceRight collapsed={false} darkMode={darkMode} />
          </div>
        </div>

        {/* ══ FOOTER ═════════════════════════════════════════════════════════ */}
        <div className="aws-footer" style={{ flexShrink: 0, background: darkMode ? "rgba(255,255,255,0.03)" : "#F5F2ED", borderTop: `1px solid ${darkMode ? "rgba(255,255,255,0.06)" : "rgba(26,23,20,0.08)"}`, padding: "7px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
            <span style={{ fontSize: 10, color: darkMode ? "rgba(255,255,255,0.28)" : "rgba(26,23,20,0.55)", fontFamily: "var(--font-body)" }}>
              <Icon name="alertTriangle" size={10} style={{ marginRight: 3, opacity: 0.6 }} /> Aura can make mistakes, always verify details directly with venues &amp; vendors.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: darkMode ? "rgba(255,255,255,0.22)" : "rgba(26,23,20,0.45)", fontFamily: "var(--font-body)" }}>
              <span>Powered by <span style={{ color: GOLD, opacity: 0.8 }}>Taigenic.ai</span></span>
              <FooterLink label="Privacy" />
              <FooterLink label="Terms" />
              <FooterLink label="Cookies" />
            </div>
          </div>
          <div className="aws-footer-copyright" style={{ marginTop: 3, fontSize: 9, color: darkMode ? "rgba(255,255,255,0.15)" : "rgba(26,23,20,0.35)", fontFamily: "var(--font-body)" }}>
            © Luxury Wedding Directory, Part of 5 Star Weddings Ltd. 2006–2026. All rights reserved.
          </div>
        </div>

      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function TopNavBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{ background: "none", border: "none", color: "rgba(255,255,255,0.48)", fontFamily: "var(--font-body)", fontSize: 12, cursor: "pointer", padding: "6px 14px", letterSpacing: "0.4px", transition: "color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#fff")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.48)")}
    >{label}</button>
  );
}

function CtrlBtn({ label, icon, onClick }) {
  return (
    <button
      className="aws-ctrl-btn"
      onClick={onClick}
      style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, color: "rgba(255,255,255,0.42)", fontFamily: "var(--font-body)", fontSize: 11, cursor: "pointer", padding: "5px 13px", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.26)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}
    >{icon}<span className="aws-btn-label">{label}</span></button>
  );
}

function CollapseBtn({ side, collapsed, onClick, posStyle }) {
  return (
    <button
      className="aws-collapse-btn"
      onClick={onClick}
      aria-label={collapsed ? `Expand ${side} panel` : `Collapse ${side} panel`}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        width: 24, height: 24, borderRadius: "50%",
        background: "#0D0B09",
        border: "2px solid rgba(201,168,76,0.35)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10, transition: "all 0.25s", ...posStyle,
        boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#C9A84C"; e.currentTarget.querySelector('.aws-collapse-dot').style.background = "#C9A84C"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.35)"; e.currentTarget.querySelector('.aws-collapse-dot').style.background = "rgba(201,168,76,0.6)"; }}
    >
      <span
        className="aws-collapse-dot"
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          background: "rgba(201,168,76,0.6)",
          transition: "background 0.25s",
        }}
      />
    </button>
  );
}

function FooterLink({ label }) {
  const handleClick = () => {
    if (label === "Cookies") window.dispatchEvent(new Event("lwd:show-cookies"));
  };
  return (
    <>
      <span style={{ opacity: 0.3 }}>·</span>
      <button
        onClick={handleClick}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", fontFamily: "inherit", padding: 0, opacity: 0.65, transition: "opacity 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
      >{label}</button>
    </>
  );
}
