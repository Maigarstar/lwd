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

// ── Mobile tabs config ─────────────────────────────────────────────────────────
const TABS = [
  { label: "Context", iconName: "grid" },
  { label: "Chat",    iconName: "messageCircle" },
  { label: "Results", iconName: "sparkle" },
];

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
    centerBg:       "#212121",
    auraBubbleBg:   "rgba(255,255,255,0.07)",
    auraBubbleText: "rgba(255,255,255,0.88)",
    userBubbleBg:   "#C9A84C",
    userBubbleText: "#0D0B09",
    inputBg:        "rgba(255,255,255,0.06)",
    inputBorder:    "rgba(255,255,255,0.12)",
    inputText:      "rgba(255,255,255,0.9)",
    inputPlaceholder:"rgba(255,255,255,0.3)",
    hintText:       "rgba(255,255,255,0.28)",
    scrollTrack:    "#2A2A2A",
    dividerLine:    "rgba(255,255,255,0.07)",
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
  const { closeFull, recommendations } = useChat();

  const [mobileTab,      setMobileTab]      = useState(1);
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

  // ESC → minimise
  useEffect(() => {
    const fn = (e) => { if (e.key === "Escape") closeFull(); };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [closeFull]);

  const handleHome   = () => { closeFull(); onHome?.(); };
  const handleVenues = () => { closeFull(); onVenues?.(); };
  const handleBack   = () => { closeFull(); onBack?.(); };

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Aura — Wedding Planning", text: "Discover luxury wedding venues in Italy", url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  };

  return (
    <>
      {/* ── Injected CSS ──────────────────────────────────────────────────── */}
      <style>{`
        .aws-left  { transition: width 0.25s ease; }
        .aws-right { transition: width 0.25s ease; }

        @media (max-width: 900px) {
          .aws-left  { width: 100% !important; }
          .aws-right { width: 100% !important; }
          .aws-collapse-btn  { display: none !important; }
          .aws-topbar-nav    { display: none !important; }
          .aws-mobile-tabs   { display: flex !important; }
          .aws-body > :nth-child(1) {
            display: ${mobileTab === 0 ? "flex" : "none"} !important;
            flex-direction: column; flex: 1;
          }
          .aws-body > :nth-child(2) {
            display: ${mobileTab === 1 ? "flex" : "none"} !important;
            flex-direction: column; flex: 1;
          }
          .aws-body > :nth-child(3) {
            display: ${mobileTab === 2 ? "flex" : "none"} !important;
            flex-direction: column; flex: 1;
          }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aura — wedding planning workspace"
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
          {/* Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(201,168,76,0.1)",
                border: "1px solid rgba(201,168,76,0.32)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, color: GOLD, flexShrink: 0,
              }}
            ><Icon name="sparkleMini" size={16} color={GOLD} /></div>
            <div>
              <div style={{ fontFamily: "var(--font-heading-primary)", fontSize: 18, fontWeight: 500, color: "#fff", letterSpacing: "0.4px", lineHeight: 1, marginBottom: 2 }}>
                Aura
              </div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,0.38)", letterSpacing: "1.2px", textTransform: "uppercase" }}>
                Wedding Planning Assistant
              </div>
            </div>
          </div>

          {/* Centre nav — hidden on mobile */}
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
            {/* Dark / light toggle — icon only, matches site-wide style */}
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
              <Icon name="link" size={13} /> Share
            </button>

            {/* Minimise */}
            <CtrlBtn icon={<Icon name="minimize" size={13} />} label="Minimise" onClick={closeFull} />

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
          {/* ── Left sidebar ──────────────────────────────────────────────── */}
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

          {/* ── Centre chat ───────────────────────────────────────────────── */}
          <div
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

          {/* ── Right sidebar ─────────────────────────────────────────────── */}
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

        {/* ══ MOBILE TAB BAR ═════════════════════════════════════════════════ */}
        <div
          className="aws-mobile-tabs"
          style={{
            display:   "none",
            flexShrink: 0,
            height:     56,
            background: T.tabBarBg,
            borderTop: `1px solid ${T.tabBarBorder}`,
            transition:"background 0.3s ease",
          }}
        >
          {TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setMobileTab(i)}
              style={{
                flex:          1,
                background:   "none",
                border:       "none",
                borderTop:    `2px solid ${mobileTab === i ? GOLD : "transparent"}`,
                color:         mobileTab === i ? GOLD : (darkMode ? "rgba(255,255,255,0.38)" : "rgba(26,23,20,0.38)"),
                fontFamily:   "var(--font-body)",
                fontSize:      10,
                letterSpacing: "0.5px",
                cursor:       "pointer",
                display:      "flex",
                flexDirection: "column",
                alignItems:   "center",
                justifyContent: "center",
                gap:            2,
                transition:   "all 0.2s",
                position:     "relative",
                paddingBottom:  2,
              }}
            >
              <Icon name={t.iconName} size={16} />
              <span>{t.label}</span>
              {i === 2 && resultCount > 0 && (
                <span style={{
                  position: "absolute", top: 8, left: "50%", transform: "translateX(6px)",
                  background: GOLD, color: "#0D0B09", width: 16, height: 16,
                  borderRadius: "50%", fontSize: 8, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {resultCount > 9 ? "9+" : resultCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ══ FOOTER ═════════════════════════════════════════════════════════ */}
        <div style={{ flexShrink: 0, background: DEEP, borderTop: "1px solid rgba(201,168,76,0.1)", padding: "7px 24px 8px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", fontFamily: "var(--font-body)" }}>
              <Icon name="alertTriangle" size={10} style={{ marginRight: 3, opacity: 0.6 }} /> Aura can make mistakes — always verify details directly with venues &amp; vendors.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-body)" }}>
              <span>Powered by <span style={{ color: GOLD, opacity: 0.75 }}>Taigenic.ai</span></span>
              <FooterLink label="Privacy" />
              <FooterLink label="Terms" />
              <FooterLink label="Cookies" />
            </div>
          </div>
          <div style={{ marginTop: 3, fontSize: 9, color: "rgba(255,255,255,0.15)", fontFamily: "var(--font-body)" }}>
            © Luxury Wedding Directory — Part of 5 Star Weddings Ltd. 2006–2026. All rights reserved.
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
      onClick={onClick}
      style={{ background: "none", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 3, color: "rgba(255,255,255,0.42)", fontFamily: "var(--font-body)", fontSize: 11, cursor: "pointer", padding: "5px 13px", display: "flex", alignItems: "center", gap: 5, transition: "all 0.2s" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.26)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.12)"; e.currentTarget.style.color = "rgba(255,255,255,0.42)"; }}
    >{icon}{label}</button>
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
  return (
    <>
      <span style={{ opacity: 0.3 }}>·</span>
      <button style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", fontFamily: "inherit", padding: 0, opacity: 0.65, transition: "opacity 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.65")}
      >{label}</button>
    </>
  );
}
