// ─── src/chat/AuraImmersiveWorkspace.jsx ──────────────────────────────────────
// AuraWorkspace variant locked to dark/immersive mode.
// Rendered inside ImmersiveSearch (zIndex 10001) — no light toggle, no nav links.
// onClose → returns to the ImmersiveSearch overlay.
import { useEffect, useState, useCallback } from "react";
import { useChat }     from "./ChatContext";
import WorkspaceLeft   from "./WorkspaceLeft";
import WorkspaceCenter from "./WorkspaceCenter";
import WorkspaceRight  from "./WorkspaceRight";
import Icon            from "./Icons";

// ── Shell colours (immersive — deeper than standard AuraWorkspace) ─────────────
const SHELL = "#0a0906";
const GOLD  = "#C9A84C";

// ── Dark-only theme tokens ─────────────────────────────────────────────────────
const T = {
  sidebarBg:       "#0a0906",
  sidebarText:     "#FFFFFF",
  sidebarGrey:     "rgba(255,255,255,0.42)",
  sidebarDivider:  "rgba(201,168,76,0.14)",
  sidebarBorder2:  "rgba(255,255,255,0.08)",
  tabBarBg:        "#060504",
  tabBarBorder:    "rgba(201,168,76,0.14)",
  collapseBg:      "#0a0906",
  centerBg:        "#161310",
  auraBubbleBg:    "#221f1c",
  auraBubbleText:  "rgba(255,255,255,0.92)",
  userBubbleBg:    "#C9A84C",
  userBubbleText:  "#0a0906",
  inputBg:         "rgba(255,248,230,0.04)",
  inputBorder:     "rgba(201,168,76,0.16)",
  inputText:       "rgba(255,255,255,0.92)",
  inputPlaceholder:"rgba(255,255,255,0.32)",
  hintText:        "rgba(255,255,255,0.28)",
  scrollTrack:     "#1a1714",
  dividerLine:     "rgba(201,168,76,0.07)",
};

// ── Main component ─────────────────────────────────────────────────────────────
export default function AuraImmersiveWorkspace({ onClose, initialQuery }) {
  const { activeContext, recommendations, sendMessage } = useChat();

  const [mobileDrawer,   setMobileDrawer]   = useState(null);
  const [leftCollapsed,  setLeftCollapsed]  = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [visible,        setVisible]        = useState(false);
  const [shareToast,     setShareToast]     = useState(false);

  const resultCount = recommendations?.items?.length ?? 0;

  // Entrance animation
  useEffect(() => {
    requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
  }, []);

  // Send initial query if passed from ImmersiveSearch
  useEffect(() => {
    if (initialQuery?.trim()) {
      setTimeout(() => sendMessage(initialQuery.trim()), 400);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ESC → close (back to immersive overlay)
  useEffect(() => {
    const fn = (e) => {
      if (e.key === "Escape") {
        if (mobileDrawer) setMobileDrawer(null);
        else onClose?.();
      }
    };
    document.addEventListener("keydown", fn);
    return () => document.removeEventListener("keydown", fn);
  }, [onClose, mobileDrawer]);

  const handleShare = useCallback(() => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: "Aura — Wedding Concierge", text: "Discover luxury wedding venues with Aura", url }).catch(() => {});
    } else {
      navigator.clipboard?.writeText(url).catch(() => {});
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2200);
    }
  }, []);

  const openLeft    = () => setMobileDrawer("left");
  const openRight   = () => setMobileDrawer("right");
  const closeDrawer = () => setMobileDrawer(null);

  return (
    <>
      {/* ── Injected CSS (aiw- prefix — no collision with aws-) ─────────────── */}
      <style>{`
        @keyframes aiw-bg-drift {
          0%   { transform: translate(0%,   0%)   scale(1.12); }
          33%  { transform: translate(-2%,  1.5%) scale(1.12); }
          66%  { transform: translate(1.5%, -1%)  scale(1.12); }
          100% { transform: translate(0%,   0%)   scale(1.12); }
        }

        .aiw-left  { transition: width 0.25s ease; }
        .aiw-right { transition: width 0.25s ease; }

        @media (max-width: 900px) {
          .aiw-left, .aiw-right        { display: none !important; }
          .aiw-collapse-btn            { display: none !important; }
          .aiw-topbar-nav              { display: none !important; }
          .aiw-body > .aiw-center-panel {
            display: flex !important;
            flex-direction: column;
            flex: 1;
          }
          .aiw-topbar          { height: 48px !important; padding: 0 12px !important; }
          .aiw-topbar-subtitle { display: none !important; }
          .aiw-topbar-identity-icon { width: 28px !important; height: 28px !important; }
          .aiw-topbar-title    { font-size: 16px !important; }
          .aiw-btn-label       { display: none !important; }
          .aiw-ctrl-btn        { padding: 5px 8px !important; }
          .aiw-footer          { display: none !important; }
          .aiw-mobile-only     { display: flex !important; }
        }
      `}</style>

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Aura — immersive wedding concierge"
        style={{
          position:      "fixed",
          inset:          0,
          zIndex:         10001,
          display:       "flex",
          flexDirection: "column",
          background:     SHELL,
          fontFamily:    "var(--font-body)",
          opacity:        visible ? 1 : 0,
          transform:      visible ? "translateY(0)" : "translateY(14px)",
          transition:    "opacity 0.35s ease, transform 0.4s cubic-bezier(0.16,1,0.3,1)",
          overflow:      "hidden",
        }}
      >

        {/* ── Cinematic ambient glow layer ───────────────────────────────────── */}
        <div aria-hidden="true" style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none", zIndex: 0 }}>
          <div style={{
            position:   "absolute",
            inset:      "-12%",
            background: [
              "radial-gradient(ellipse 72% 58% at 20% 30%, rgba(62,36,6,0.55) 0%, transparent 62%)",
              "radial-gradient(ellipse 58% 48% at 82% 28%, rgba(52,30,5,0.42) 0%, transparent 56%)",
              "radial-gradient(ellipse 50% 42% at 85% 72%, rgba(42,24,4,0.38) 0%, transparent 58%)",
              "radial-gradient(ellipse 40% 35% at 50% 52%, rgba(22,13,3,0.22) 0%, transparent 54%)",
            ].join(", "),
            animation: "aiw-bg-drift 28s ease-in-out infinite",
          }} />
        </div>

        {/* ══ TOP BAR ══════════════════════════════════════════════════════════ */}
        <div
          className="aiw-topbar"
          style={{
            display:        "flex",
            alignItems:     "center",
            justifyContent: "space-between",
            padding:        "0 20px",
            height:          60,
            flexShrink:      0,
            background:     "rgba(10,9,6,0.85)",
            backdropFilter: "blur(16px)",
            borderBottom:   "1px solid rgba(201,168,76,0.14)",
            position:       "relative",
            zIndex:          2,
          }}
        >
          {/* Left: hamburger (mobile) + Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Hamburger — mobile only */}
            <button
              className="aiw-mobile-only"
              onClick={openLeft}
              title="Open menu"
              aria-label="Open sidebar"
              style={{
                display:        "none",
                background:    "none",
                border:        "none",
                color:         "rgba(255,255,255,0.6)",
                cursor:        "pointer",
                padding:        4,
                alignItems:    "center",
                justifyContent: "center",
                flexShrink:     0,
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <line x1="3" y1="8" x2="21" y2="8" />
                <line x1="3" y1="16" x2="21" y2="16" />
              </svg>
            </button>

            <div
              className="aiw-topbar-identity-icon"
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.28)",
                display: "flex", alignItems: "center", justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon name="sparkleMini" size={16} color={GOLD} />
            </div>

            <div>
              <div
                className="aiw-topbar-title"
                style={{
                  fontFamily: "var(--font-heading-primary)",
                  fontSize: 18, fontWeight: 500,
                  color: "#fff", letterSpacing: "0.4px",
                  lineHeight: 1, marginBottom: 2,
                }}
              >
                Chat with Aura
              </div>
              <div
                className="aiw-topbar-subtitle"
                style={{
                  fontSize: 9,
                  color: "rgba(255,255,255,0.32)",
                  letterSpacing: "1.2px",
                  textTransform: "uppercase",
                }}
              >
                Immersive Concierge
              </div>
            </div>
          </div>

          {/* Controls right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
            {/* Results — mobile only */}
            <button
              className="aiw-mobile-only"
              onClick={openRight}
              title="Results"
              aria-label="Open results"
              style={{
                display:        "none",
                background:    "none",
                border:        "1px solid rgba(255,255,255,0.1)",
                borderRadius:   3,
                color:         "rgba(255,255,255,0.5)",
                cursor:        "pointer",
                width:          36,
                height:         36,
                alignItems:    "center",
                justifyContent: "center",
                flexShrink:     0,
                transition:    "all 0.2s",
                position:      "relative",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.5)"; }}
            >
              <Icon name="sparkle" size={15} />
              {resultCount > 0 && (
                <span style={{
                  position: "absolute", top: -4, right: -4,
                  background: GOLD, color: SHELL,
                  width: 16, height: 16, borderRadius: "50%",
                  fontSize: 8, fontWeight: 800,
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}>
                  {resultCount > 9 ? "9+" : resultCount}
                </span>
              )}
            </button>

            {/* Share */}
            <AIWCtrlBtn
              icon={<Icon name="link" size={13} />}
              label="Share"
              onClick={handleShare}
            />

            {/* ← Back to search */}
            <button
              onClick={() => onClose?.()}
              style={{
                background:   "none",
                border:      "1px solid rgba(201,168,76,0.22)",
                borderRadius: 3,
                color:        "rgba(201,168,76,0.7)",
                fontFamily:  "var(--font-body)",
                fontSize:     11,
                cursor:      "pointer",
                padding:     "5px 14px",
                display:     "flex",
                alignItems:  "center",
                gap:          5,
                transition:  "all 0.2s",
                letterSpacing: "0.3px",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.color = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(201,168,76,0.22)"; e.currentTarget.style.color = "rgba(201,168,76,0.7)"; }}
            >
              ← Back to search
            </button>

            {/* Share toast */}
            {shareToast && (
              <div style={{
                position:   "absolute",
                top:         46,
                right:        0,
                background:  "#1A1714",
                border:     "1px solid rgba(201,168,76,0.3)",
                borderRadius: 3,
                color:        GOLD,
                fontFamily:  "var(--font-body)",
                fontSize:     11,
                padding:     "7px 14px",
                whiteSpace:  "nowrap",
                boxShadow:   "0 4px 16px rgba(0,0,0,0.4)",
                zIndex:       20,
              }}>
                ✓ Link copied to clipboard
              </div>
            )}
          </div>
        </div>

        {/* ══ BODY ═════════════════════════════════════════════════════════════ */}
        <div
          className="aiw-body"
          style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0, position: "relative", zIndex: 1 }}
        >
          {/* Left sidebar */}
          <div
            className="aiw-left"
            style={{
              width:         leftCollapsed ? 52 : 280,
              background:    T.sidebarBg,
              borderRight:  `1px solid ${T.sidebarDivider}`,
              display:      "flex",
              flexDirection: "column",
              overflow:     "hidden",
              position:     "relative",
              flexShrink:    0,
            }}
          >
            <WorkspaceLeft collapsed={leftCollapsed} onBack={() => onClose?.()} darkMode={true} />
            <AIWCollapseBtn side="left" collapsed={leftCollapsed} onClick={() => setLeftCollapsed((v) => !v)} posStyle={{ right: -13 }} />
          </div>

          {/* Centre chat */}
          <div
            className="aiw-center-panel"
            style={{
              flex:          1,
              minWidth:      0,
              background:    T.centerBg,
              display:      "flex",
              flexDirection: "column",
              position:     "relative",
              boxShadow:    "-6px 0 48px rgba(0,0,0,0.35), 6px 0 48px rgba(0,0,0,0.35)",
            }}
          >
            <WorkspaceCenter darkMode={true} />
          </div>

          {/* Right sidebar */}
          <div
            className="aiw-right"
            style={{
              width:         rightCollapsed ? 52 : 320,
              background:    T.sidebarBg,
              borderLeft:   `1px solid ${T.sidebarDivider}`,
              display:      "flex",
              flexDirection: "column",
              overflow:     "hidden",
              position:     "relative",
              flexShrink:    0,
            }}
          >
            <WorkspaceRight collapsed={rightCollapsed} darkMode={true} />
            <AIWCollapseBtn side="right" collapsed={rightCollapsed} onClick={() => setRightCollapsed((v) => !v)} posStyle={{ left: -13 }} />
          </div>
        </div>

        {/* ══ MOBILE DRAWER OVERLAY ═══════════════════════════════════════════ */}
        {/* Backdrop */}
        <div
          onClick={closeDrawer}
          style={{
            position:      "fixed",
            inset:          0,
            background:    "rgba(0,0,0,0.6)",
            zIndex:         10100,
            opacity:        mobileDrawer ? 1 : 0,
            pointerEvents:  mobileDrawer ? "auto" : "none",
            transition:    "opacity 0.25s ease",
          }}
        />

        {/* Left drawer */}
        <div style={{
          position:      "fixed",
          top:            0,
          left:           0,
          bottom:         0,
          width:          280,
          maxWidth:      "80vw",
          background:     T.sidebarBg,
          zIndex:         10101,
          display:       "flex",
          flexDirection: "column",
          boxShadow:     mobileDrawer === "left" ? "4px 0 32px rgba(0,0,0,0.6)" : "none",
          transform:      mobileDrawer === "left" ? "translateX(0)" : "translateX(-100%)",
          transition:    "transform 0.28s ease",
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 12px",
            borderBottom: `1px solid ${T.sidebarDivider}`,
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: "50%",
                background: "rgba(201,168,76,0.08)",
                border: "1px solid rgba(201,168,76,0.28)",
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
              style={{ background: "none", border: "none", color: T.sidebarGrey, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <WorkspaceLeft collapsed={false} onBack={() => onClose?.()} darkMode={true} />
          </div>
        </div>

        {/* Right drawer */}
        <div style={{
          position:      "fixed",
          top:            0,
          right:          0,
          bottom:         0,
          width:          310,
          maxWidth:      "85vw",
          background:     T.sidebarBg,
          zIndex:         10101,
          display:       "flex",
          flexDirection: "column",
          boxShadow:     mobileDrawer === "right" ? "-4px 0 32px rgba(0,0,0,0.6)" : "none",
          transform:      mobileDrawer === "right" ? "translateX(0)" : "translateX(100%)",
          transition:    "transform 0.28s ease",
        }}>
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
              style={{ background: "none", border: "none", color: T.sidebarGrey, cursor: "pointer", padding: 4, display: "flex", alignItems: "center" }}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
          <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <WorkspaceRight collapsed={false} darkMode={true} />
          </div>
        </div>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
        <div
          className="aiw-footer"
          style={{
            flexShrink:  0,
            background:  "rgba(255,255,255,0.02)",
            borderTop:   "1px solid rgba(255,255,255,0.05)",
            padding:     "7px 24px 8px",
            position:    "relative",
            zIndex:       2,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.24)", fontFamily: "var(--font-body)" }}>
              <Icon name="alertTriangle" size={10} style={{ marginRight: 3, opacity: 0.5 }} />
              Aura can make mistakes. Always verify details directly with venues &amp; vendors.
            </span>
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 10, color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-body)" }}>
              <span>
                Powered by{" "}
                <span
                  role="link"
                  tabIndex={0}
                  onClick={() => { window.history.pushState({}, "", "/taigenic"); window.dispatchEvent(new PopStateEvent("popstate")); }}
                  onKeyDown={e => e.key === "Enter" && (window.history.pushState({}, "", "/taigenic"), window.dispatchEvent(new PopStateEvent("popstate")))}
                  style={{ color: GOLD, opacity: 0.7, cursor: "pointer", textDecoration: "underline", textDecorationColor: "rgba(201,168,76,0.3)" }}
                >
                  Taigenic.ai
                </span>
              </span>
              <AIWFooterLink label="Privacy" />
              <AIWFooterLink label="Terms" />
              <AIWFooterLink label="Cookies" />
            </div>
          </div>
          <div style={{ marginTop: 3, fontSize: 9, color: "rgba(255,255,255,0.1)", fontFamily: "var(--font-body)" }}>
            © Luxury Wedding Directory, Part of 5 Star Weddings Ltd. 2006–2026. All rights reserved.
          </div>
        </div>

      </div>
    </>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function AIWCtrlBtn({ label, icon, onClick }) {
  return (
    <button
      className="aiw-ctrl-btn"
      onClick={onClick}
      style={{
        background:  "none",
        border:     "1px solid rgba(255,255,255,0.1)",
        borderRadius: 3,
        color:       "rgba(255,255,255,0.4)",
        fontFamily:  "var(--font-body)",
        fontSize:     11,
        cursor:      "pointer",
        padding:     "5px 13px",
        display:     "flex",
        alignItems:  "center",
        gap:          5,
        transition:  "all 0.2s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.24)"; e.currentTarget.style.color = "#fff"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; e.currentTarget.style.color = "rgba(255,255,255,0.4)"; }}
    >
      {icon}<span className="aiw-btn-label">{label}</span>
    </button>
  );
}

function AIWCollapseBtn({ side, collapsed, onClick, posStyle }) {
  return (
    <button
      className="aiw-collapse-btn"
      onClick={onClick}
      aria-label={collapsed ? `Expand ${side} panel` : `Collapse ${side} panel`}
      style={{
        position: "absolute", top: "50%", transform: "translateY(-50%)",
        width: 24, height: 24, borderRadius: "50%",
        background: "#0a0906",
        border: "2px solid rgba(201,168,76,0.3)",
        cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 10, transition: "all 0.25s", ...posStyle,
        boxShadow: "0 2px 10px rgba(0,0,0,0.5)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "#C9A84C";
        e.currentTarget.querySelector(".aiw-collapse-dot").style.background = "#C9A84C";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(201,168,76,0.3)";
        e.currentTarget.querySelector(".aiw-collapse-dot").style.background = "rgba(201,168,76,0.55)";
      }}
    >
      <span
        className="aiw-collapse-dot"
        style={{ width: 6, height: 6, borderRadius: "50%", background: "rgba(201,168,76,0.55)", transition: "background 0.25s" }}
      />
    </button>
  );
}

function AIWFooterLink({ label }) {
  const handleClick = () => {
    if (label === "Cookies") window.dispatchEvent(new Event("lwd:show-cookies"));
  };
  return (
    <>
      <span style={{ opacity: 0.25 }}>·</span>
      <button
        onClick={handleClick}
        style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", fontSize: "inherit", fontFamily: "inherit", padding: 0, opacity: 0.55, transition: "opacity 0.15s" }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.55")}
      >{label}</button>
    </>
  );
}
