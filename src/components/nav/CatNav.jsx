// ─── src/components/nav/CatNav.jsx ───────────────────────────────────────────
import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

export default function CatNav({ onBack, scrolled, darkMode: darkModeProp, onToggleDark: onToggleDarkProp, crumbs }) {
  const C = useTheme();
  const darkMode = darkModeProp ?? C.darkMode ?? false;
  const onToggleDark = onToggleDarkProp || C.toggleDark;

  // State-driven hover, no direct DOM style mutations
  const [hovBack, setHovBack]       = useState(false);
  const [hovHome, setHovHome]       = useState(false);
  const [hovToggle, setHovToggle]   = useState(false);

  const ghostBorder = scrolled ? C.border2 : "rgba(255,255,255,0.25)";
  const ghostColor  = scrolled ? C.grey    : "rgba(255,255,255,0.7)";

  return (
    <nav
      aria-label="Category navigation"
      className="lwd-catnav"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 900,
        padding: scrolled ? "12px 48px" : "18px 48px",
        background: scrolled
          ? darkMode
            ? "rgba(8,8,8,0.97)"
            : "rgba(250,248,245,0.97)"
          : "transparent",
        backdropFilter: scrolled ? "blur(20px)" : "none",
        borderBottom: scrolled ? `1px solid ${C.border}` : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        transition: "all 0.35s ease",
      }}
    >
      {/* Left: back + breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: 20, minWidth: 0, flex: 1 }}>
        <button
          onClick={onBack}
          aria-label="Go back"
          onMouseEnter={() => setHovBack(true)}
          onMouseLeave={() => setHovBack(false)}
          style={{
            background:   "none",
            border:       `1px solid ${hovBack ? C.gold : ghostBorder}`,
            borderRadius:  "var(--lwd-radius-input)",
            color:         hovBack ? C.gold : ghostColor,
            padding:      "7px 14px",
            fontSize:      11,
            letterSpacing: "1px",
            textTransform: "uppercase",
            cursor:       "pointer",
            fontFamily:   "inherit",
            transition:   "all 0.2s",
          }}
        >
          ← Back
        </button>

        <nav aria-label="Breadcrumb" className="lwd-catnav-breadcrumb">
          <ol
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 11,
              color: scrolled ? C.grey : "rgba(255,255,255,0.5)",
              letterSpacing: "0.5px",
              listStyle: "none",
              padding: 0,
              margin: 0,
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
              whiteSpace: "nowrap",
            }}
          >
            <li>
              <button
                onClick={onBack}
                onMouseEnter={() => setHovHome(true)}
                onMouseLeave={() => setHovHome(false)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  fontSize: 11,
                  color: hovHome ? C.gold : (scrolled ? C.grey : "rgba(255,255,255,0.5)"),
                  transition: "color 0.2s",
                  letterSpacing: "0.5px",
                }}
              >
                Home
              </button>
            </li>
            {crumbs
              ? crumbs.map((c, i) => (
                  <li key={i} style={{ display: "flex", alignItems: "center", gap: 8, minWidth: 0 }}>
                    <span aria-hidden="true" style={{ opacity: 0.4, flexShrink: 0 }}>›</span>
                    {c.onClick
                      ? <button onClick={c.onClick} style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 11, color: scrolled ? C.grey : "rgba(255,255,255,0.5)", letterSpacing: "0.5px", padding: 0, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.label}</button>
                      : <span style={{ color: scrolled ? C.gold : "rgba(201,168,76,0.9)", fontWeight: 600, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} aria-current="page">{c.label}</span>
                    }
                  </li>
                ))
              : <>
                  <li aria-hidden="true" style={{ opacity: 0.4 }}>›</li>
                  <li>Venues</li>
                  <li aria-hidden="true" style={{ opacity: 0.4 }}>›</li>
                  <li>
                    <span style={{ color: scrolled ? C.gold : "rgba(201,168,76,0.9)", fontWeight: 600 }} aria-current="page">Italy</span>
                  </li>
                </>
            }
          </ol>
        </nav>
      </div>

      {/* Centre: logo */}
      <button
        onClick={onBack}
        aria-label="Luxury Wedding Directory home"
        className="lwd-catnav-logo"
        style={{
          background: "none",
          border: "none",
          cursor: "pointer",
          fontFamily: "var(--font-heading-primary)",
          fontSize: 18,
          fontWeight: 600,
          color: scrolled ? C.white : "#ffffff",
          letterSpacing: 0.5,
        }}
      >
        Luxury{" "}
        <span style={{ color: C.gold }}>Wedding</span>{" "}
        Directory
      </button>

      {/* Right: actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <button
          onClick={onToggleDark}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          title="Toggle theme"
          onMouseEnter={() => setHovToggle(true)}
          onMouseLeave={() => setHovToggle(false)}
          style={{
            background:    "none",
            border:        `1px solid ${hovToggle ? C.gold : C.border2}`,
            borderRadius:   "var(--lwd-radius-input)",
            color:          hovToggle ? C.gold : C.grey,
            width:          34,
            height:         34,
            cursor:        "pointer",
            fontSize:       14,
            transition:    "all 0.2s",
            display:       "flex",
            alignItems:    "center",
            justifyContent: "center",
            flexShrink:     0,
          }}
        >
          {darkMode ? "☀" : "☽"}
        </button>

        <button
          className="lwd-btn-list-venue"
          style={{
            background:    `linear-gradient(135deg,${C.gold},${C.gold2})`,
            border:        "none",
            borderRadius:   "var(--lwd-radius-input)",
            color:         "#fff",
            padding:       "9px 20px",
            fontSize:       11,
            fontWeight:     700,
            letterSpacing: "1.5px",
            textTransform: "uppercase",
            cursor:        "pointer",
            fontFamily:    "inherit",
          }}
        >
          List Your Venue
        </button>
      </div>
    </nav>
  );
}
