// ─── src/pages/GettingMarriedDashboard.jsx ─────────────────────────────────
// Couples dashboard for wedding planning with shortlist preview, enquiries, and account

import { useState, useEffect } from "react";
import { useTheme, ThemeCtx } from "../theme/ThemeContext";
import { useShortlist } from "../shortlist/ShortlistContext";
import { getDarkPalette, getLightPalette } from "../theme/tokens";
import { GLOBAL_VENDORS } from "../data/globalVendors";
import ShortlistButton from "../components/buttons/ShortlistButton";
import FooterForCouples from "../components/sections/FooterForCouples";
import { track } from "../utils/track";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

export default function GettingMarriedDashboard({ onBack }) {
  const { items: shortlistItems, toggleItem, isShortlisted } = useShortlist();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [currentTheme, setCurrentTheme] = useState(
    document.documentElement.getAttribute("data-lwd-mode") || "light"
  );

  // Track theme changes
  useEffect(() => {
    const handleThemeChange = () => {
      const mode = document.documentElement.getAttribute("data-lwd-mode") || "light";
      setCurrentTheme(mode);
    };

    // Listen for data-lwd-mode attribute changes
    const observer = new MutationObserver(handleThemeChange);
    observer.observe(document.documentElement, { attributes: true });

    return () => observer.disconnect();
  }, []);

  // Handle window resize to track mobile breakpoint
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Select the appropriate color palette based on current theme
  const C = currentTheme === "dark" ? getDarkPalette() : getLightPalette();

  // Get shortlist items with vendor data
  const shortlistWithData = shortlistItems.slice(0, 3).map((item) => {
    const vendor = GLOBAL_VENDORS.find((v) => v.id === item.item_id);
    return { ...item, vendorData: vendor };
  });

  // Navigation tabs component
  const DTab = ({ id, label, icon }) => (
    <button
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        width: "100%",
        background: "none",
        borderTop: 0,
        borderRight: 0,
        borderBottom: 0,
        borderLeft: `2px solid transparent`,
        color: C.grey,
        padding: sidebarOpen ? "12px 20px" : "12px 14px",
        fontSize: 13,
        fontWeight: 400,
        cursor: "pointer",
        fontFamily: NU,
        textAlign: "left",
        transition: "all 0.2s",
        justifyContent: sidebarOpen ? "flex-start" : "center",
      }}
    >
      {icon} {sidebarOpen && label}
    </button>
  );

  return (
    <ThemeCtx.Provider value={C}>
      <div style={{ height: "100vh", background: C.black, display: "flex", flexDirection: "column" }}>
        {/* ─── HEADER ─── */}
        <div
          style={{
            background: C.dark,
            borderBottom: `1px solid ${C.border}`,
            padding: isMobile ? "10px 16px" : "14px 28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 10 : 16 }}>
            {isMobile && <button onClick={() => setSidebarOpen(s => !s)} style={{ background: "none", border: `1px solid ${C.border2}`, borderRadius: "var(--lwd-radius-input)", color: C.gold, padding: "7px 10px", fontSize: 16, cursor: "pointer", fontFamily: NU }}>&#9776;</button>}
            <button
              onClick={onBack}
              style={{
                background: "none",
                border: `1px solid ${C.border2}`,
                borderRadius: "var(--lwd-radius-input)",
                color: C.grey,
                padding: "7px 14px",
                fontSize: 11,
                cursor: "pointer",
                fontFamily: NU,
                letterSpacing: "1px",
                textTransform: "uppercase",
              }}
            >
              {isMobile ? "\u2190" : "\u2190 Back to Site"}
            </button>
            {!isMobile && (
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontFamily: GD, fontSize: 18, color: C.white, fontWeight: 600 }}>
                Luxury Wedding Directory <span style={{ color: C.gold }}>·</span> Plan Your Wedding
              </div>
              {!isMobile && <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                <span style={{ fontFamily: NU, fontSize: 8, letterSpacing: "1.5px", textTransform: "uppercase", color: C.gold, fontWeight: 600 }}>✧ Powered by Taigenic.ai</span>
                <span style={{ fontFamily: NU, fontSize: 8, color: C.grey2, fontWeight: 300 }}>· Part of 5 Star Weddings Ltd.</span>
              </div>}
            </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: isMobile ? 8 : 12 }}>
            <button
              onClick={() => {
                const root = document.documentElement;
                const currentMode = root.getAttribute("data-lwd-mode") || "light";
                const newMode = currentMode === "dark" ? "light" : "dark";
                root.setAttribute("data-lwd-mode", newMode);
                localStorage.setItem("lwd_user_theme", newMode);
                setTimeout(() => { window.location.reload(); }, 50);
              }}
              style={{
                background: currentTheme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
                border: `1px solid ${C.border2}`,
                borderRadius: "var(--lwd-radius-input)",
                color: C.gold,
                width: 32,
                height: 32,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                fontSize: 14,
                transition: "all 0.25s ease",
              }}
              title={currentTheme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {currentTheme === "dark" ? "\u2600" : "\u263E"}
            </button>
            {!isMobile && <span style={{ fontFamily: NU, fontSize: 12, color: C.grey }}>Planning your wedding</span>}
            <div
              style={{
                width: 32,
                height: 32,
                background: C.goldDim,
                border: "1px solid rgba(201,168,76,0.3)",
                borderRadius: "var(--lwd-radius-image)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                color: C.gold,
                fontFamily: GD,
              }}
            >
              ♡
            </div>
          </div>
        </div>

      <div style={{ display: "flex", flex: 1, alignItems: "stretch", overflow: "auto" }}>
        {/* Mobile overlay */}
        {isMobile && sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 7999 }} />}

        {/* Sidebar */}
        <div style={{
          ...(isMobile ? {
            position: "fixed", top: 0, left: 0, bottom: 0, width: 280, zIndex: 8000,
            transform: sidebarOpen ? "translateX(0)" : "translateX(-100%)",
            transition: "transform 0.3s cubic-bezier(0.16,1,0.3,1)",
          } : {
            width: sidebarOpen ? 280 : 70,
            flexShrink: 0,
            transition: "width 0.3s cubic-bezier(0.16,1,0.3,1)",
            display: "flex",
            flexDirection: "column",
          }),
          background: C.dark, borderRight: `1px solid ${C.border}`, paddingTop: 24,
          boxShadow: "2px 0 8px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}>
          {/* Close button on mobile only */}
          {isMobile && <button onClick={() => setSidebarOpen(false)} style={{ position: "absolute", top: 12, right: 12, background: "none", border: "none", color: C.grey, fontSize: 18, cursor: "pointer", zIndex: 10 }}>✕</button>}

          {/* Collapse button on desktop */}
          {!isMobile && (
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                position: "absolute",
                top: 24,
                right: 8,
                background: "none",
                border: "none",
                color: C.grey,
                fontSize: 18,
                cursor: "pointer",
                padding: "4px 8px",
                transition: "color 0.2s",
              }}
              onMouseEnter={e => e.target.style.color = C.gold}
              onMouseLeave={e => e.target.style.color = C.grey}
            >
              ›
            </button>
          )}

          <div style={{ padding: sidebarOpen ? "0 20px 20px" : "0 12px 20px", borderBottom: `1px solid ${C.border}`, minWidth: 0 }}>
            {sidebarOpen && (
              <>
                <div style={{ fontFamily: GD, fontSize: 11, color: C.grey, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 4 }}>
                  Your Planning
                </div>
                <div style={{ fontFamily: NU, fontSize: 14, color: C.white, fontWeight: 600 }}>Couples Dashboard</div>
              </>
            )}
          </div>

          <div style={{ paddingTop: 8 }}>
            <DTab id="shortlist" icon="♥" label={`My Shortlist (${shortlistItems.length})`} />
            <DTab id="enquiries" icon="✉" label="Enquiries" />
            <DTab id="account" icon="⚙" label="Account" />
          </div>

          {sidebarOpen && (
            <div
              style={{
                margin: "24px 16px 0",
                padding: 16,
                background: "rgba(201,168,76,0.06)",
                border: "1px solid rgba(201,168,76,0.15)",
                borderRadius: "var(--lwd-radius-card)",
              }}
            >
              <div style={{ fontFamily: NU, fontSize: 11, color: C.gold, fontWeight: 700, marginBottom: 4 }}>{"\u2726"} PLANNING GUIDE</div>
              <div style={{ fontFamily: NU, fontSize: 12, color: C.grey, lineHeight: 1.6 }}>Build your perfect day {"\u00b7"} Save vendors {"\u00b7"} Send enquiries</div>
              <div style={{ fontFamily: NU, fontSize: 11, color: C.grey2, marginTop: 8 }}>Start your journey today</div>
            </div>
          )}
        </div>

        {/* ─── MAIN CONTENT ─── */}
        <div
          style={{
            flex: 1,
            padding: isMobile ? 16 : 32,
            overflowY: "auto",
            marginLeft: !isMobile && !sidebarOpen ? "auto" : 0,
            marginRight: !isMobile && !sidebarOpen ? "auto" : 0,
            maxWidth: !isMobile && !sidebarOpen ? "900px" : "100%",
          }}
        >
        {/* Page Header with Theme Toggle */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 48,
          }}
        >
          <div>
            <h2
              style={{
                fontFamily: GD,
                fontSize: "clamp(28px, 4vw, 48px)",
                color: C.off,
                fontWeight: 400,
                margin: 0,
                marginBottom: 8,
              }}
            >
              Your Wedding Planning
            </h2>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
                fontWeight: 300,
              }}
            >
              Everything you need to plan your luxury celebration
            </p>
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={() => {
              track("theme_toggle");
              const root = document.documentElement;
              const currentMode = root.getAttribute("data-lwd-mode") || "light";
              const newMode = currentMode === "dark" ? "light" : "dark";

              // Update the theme attribute
              root.setAttribute("data-lwd-mode", newMode);

              // Save user preference to localStorage
              localStorage.setItem("lwd_user_theme", newMode);

              // Small delay to allow state to update, then reload
              setTimeout(() => {
                window.location.reload();
              }, 50);
            }}
            style={{
              background: "transparent",
              border: `1px solid ${C.border}`,
              color: C.grey,
              borderRadius: "var(--lwd-radius-input)",
              padding: "10px 16px",
              cursor: "pointer",
              fontFamily: NU,
              fontSize: 14,
              fontWeight: 600,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = C.gold;
              e.currentTarget.style.borderColor = C.gold;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = C.grey;
              e.currentTarget.style.borderColor = C.border;
            }}
          >
            <span style={{ fontSize: 16 }}>☽</span>
          </button>
        </div>

        {/* Shortlist Preview Section */}
        <section style={{ marginBottom: 80 }}>
          <div style={{ marginBottom: 32 }}>
            <h2
              style={{
                fontFamily: GD,
                fontSize: 28,
                color: C.off,
                margin: 0,
                marginBottom: 8,
                fontWeight: 400,
              }}
            >
              ♥ My Shortlist
            </h2>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              {shortlistItems.length === 0
                ? "Start saving your favorite venues and vendors to build your perfect wedding story."
                : `${shortlistItems.length} saved ${shortlistItems.length === 1 ? "item" : "items"} — view all in your full shortlist`}
            </p>
          </div>

          {shortlistItems.length === 0 ? (
            <div
              style={{
                background: C.card,
                borderRadius: 12,
                border: `1px solid ${C.border}`,
                padding: 60,
                textAlign: "center",
              }}
            >
              <p style={{ fontSize: 48, margin: 0 }}>♡</p>
              <h3
                style={{
                  fontFamily: GD,
                  fontSize: 20,
                  color: C.off,
                  margin: "16px 0 8px 0",
                  fontWeight: 400,
                }}
              >
                Your Shortlist is Empty
              </h3>
              <p
                style={{
                  fontFamily: NU,
                  fontSize: 14,
                  color: C.grey,
                  margin: 0,
                }}
              >
                Browse our curated collection of luxury venues and vendors
              </p>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: 24,
              }}
            >
              {shortlistWithData.map((item) =>
                item.vendorData ? (
                  <ShortlistPreviewCard
                    key={item.id}
                    vendor={item.vendorData}
                    theme={C}
                    isShortlisted={isShortlisted(item.item_id)}
                    onToggle={(id) => {
                      track("shortlist_remove_from_dashboard", { itemId: id });
                      toggleItem({ id });
                    }}
                  />
                ) : null
              )}
            </div>
          )}

          {shortlistItems.length > 0 && (
            <div style={{ marginTop: 24, textAlign: "center" }}>
              <button
                onClick={() => (window.location.href = "/shortlist")}
                style={{
                  background: "transparent",
                  color: C.gold,
                  border: `1px solid ${C.gold}`,
                  borderRadius: "var(--lwd-radius-input)",
                  padding: "12px 32px",
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: NU,
                  transition: "all 0.2s",
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
                View All {shortlistItems.length} Saved Items
              </button>
            </div>
          )}
        </section>

        {/* Enquiries Section */}
        <section style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.off,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            ✉ Recent Enquiries
          </h2>

          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              Enquiries Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              Track all your vendor enquiries and responses in one place. Messages from venues and vendors will appear here.
            </p>
          </div>
        </section>

        {/* Account & Preferences Section */}
        <section style={{ marginBottom: 80 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.off,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            ⚙ Account & Preferences
          </h2>

          <div
            style={{
              background: C.card,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 40,
              textAlign: "center",
            }}
          >
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "0 0 8px 0",
                fontWeight: 400,
              }}
            >
              Settings Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              Manage your profile, notification preferences, and privacy settings
            </p>
          </div>
        </section>

        {/* Wedding Planning Tools Section */}
        <section style={{ marginBottom: 40 }}>
          <h2
            style={{
              fontFamily: GD,
              fontSize: 28,
              color: C.off,
              margin: 0,
              marginBottom: 32,
              fontWeight: 400,
            }}
          >
            📋 Wedding Planning Tools
          </h2>

          <div
            style={{
              background: `linear-gradient(135deg, ${C.card} 0%, rgba(201,168,76,0.05) 100%)`,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: 60,
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 48, margin: 0 }}>🎊</p>
            <h3
              style={{
                fontFamily: GD,
                fontSize: 20,
                color: C.off,
                margin: "16px 0 8px 0",
                fontWeight: 400,
              }}
            >
              Comprehensive Planning Tools Coming Soon
            </h3>
            <p
              style={{
                fontFamily: NU,
                fontSize: 14,
                color: C.grey,
                margin: 0,
              }}
            >
              Timeline, budgets, guest lists, and more — arriving soon to make wedding planning effortless
            </p>
          </div>
        </section>

        {/* Logout Button */}
        <div style={{ textAlign: "center", paddingTop: 40, borderTop: `1px solid ${C.border}` }}>
          <button
            onClick={() => {
              track("dashboard_logout");
              onBack?.();
            }}
            style={{
              background: "transparent",
              color: C.grey,
              border: `1px solid ${C.border}`,
              borderRadius: "var(--lwd-radius-input)",
              padding: "12px 32px",
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              fontFamily: NU,
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = C.rose;
              e.currentTarget.style.color = C.rose;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = C.border;
              e.currentTarget.style.color = C.grey;
            }}
          >
            Log Out
          </button>
        </div>

      </div>
      </div>
    </div>

    {/* Footer */}
    <FooterForCouples />
    </ThemeCtx.Provider>
  );
}

// Navigation link component
function NavLink({ label, icon, count, color: C }) {
  return (
    <button
      style={{
        background: "transparent",
        color: "#ffffff",
        border: "none",
        borderRadius: "var(--lwd-radius-input)",
        padding: "12px 16px",
        fontFamily: NU,
        fontSize: 14,
        fontWeight: 600,
        textAlign: "left",
        cursor: "pointer",
        transition: "all 0.2s",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = `rgba(201,168,76,0.1)`;
        e.currentTarget.style.color = C.gold;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
        e.currentTarget.style.color = "#ffffff";
      }}
    >
      <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <span>{icon}</span>
        {label}
      </span>
      {count !== undefined && count > 0 && (
        <span
          style={{
            background: C.gold,
            color: "#0a0906",
            padding: "2px 8px",
            borderRadius: 12,
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

// Shortlist preview card component
function ShortlistPreviewCard({ vendor, theme: C, isShortlisted, onToggle }) {
  const images = vendor.imgs || [];
  const mainImage = images[0];

  return (
    <div
      style={{
        background: C.card,
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${C.border}`,
        transition: "all 0.3s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = C.gold;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = C.border;
      }}
    >
      {mainImage && (
        <div
          style={{
            width: "100%",
            height: 200,
            backgroundImage: `url(${mainImage})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
          }}
        >
          <button
            onClick={() => onToggle(vendor.id)}
            style={{
              position: "absolute",
              top: 12,
              right: 12,
              width: 36,
              height: 36,
              borderRadius: "50%",
              background: "rgba(0, 0, 0, 0.6)",
              border: "none",
              color: C.gold,
              fontSize: 18,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.9)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(0, 0, 0, 0.6)";
            }}
          >
            ✕
          </button>
        </div>
      )}

      <div style={{ padding: 16 }}>
        <h3
          style={{
            fontFamily: GD,
            fontSize: 16,
            color: C.off,
            margin: "0 0 6px 0",
            fontWeight: 400,
          }}
        >
          {vendor.name}
        </h3>

        <p
          style={{
            fontFamily: NU,
            fontSize: 11,
            color: C.grey,
            margin: "0 0 10px 0",
          }}
        >
          {vendor.city}, {vendor.country}
        </p>

        {vendor.price && (
          <p
            style={{
              fontFamily: NU,
              fontSize: 12,
              color: C.gold,
              fontWeight: 600,
              margin: 0,
            }}
          >
            From {vendor.price}
          </p>
        )}
      </div>
    </div>
  );
}
