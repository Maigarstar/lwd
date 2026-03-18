// footer/FooterCanvas.jsx
// Live footer design canvas — renders all four sections in real time.
// Sections: Iconic Venues strip | Main footer (brand + columns) | Newsletter | Bottom bar
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import {
  SANS, SERIF,
  AUTO_BLOCK_PLACEHOLDERS,
  DEFAULT_FOOTER_CONFIG,
  ICONIC_STRIP_COL, BRAND_COL, BOTTOM_BAR_COL,
} from "./footerUtils.js";

// ── Toolbar pill button ───────────────────────────────────────────────────
function PillBtn({ label, active, onClick, C }) {
  const G = C?.gold || "#c9a84c";
  return (
    <button
      onClick={onClick}
      style={{
        background: active ? G + "20" : "transparent",
        border: "none", borderRadius: 6,
        color: active ? G : C?.grey || "#8a7d6a",
        fontFamily: SANS, fontSize: 11, fontWeight: active ? 700 : 400,
        padding: "4px 10px", cursor: "pointer",
        transition: "all 120ms",
        letterSpacing: "0.04em",
      }}
    >{label}</button>
  );
}

// ── Toolbar zone separator ─────────────────────────────────────────────────
function Sep({ C }) {
  return (
    <div style={{
      width: 1, height: 16,
      background: C?.border || "#2a2218",
      margin: "0 4px",
      flexShrink: 0,
    }} />
  );
}

// ── Social icon (SVG inline, minimal) ─────────────────────────────────────
function SocialIcon({ platform, color }) {
  const style = { width: 24, height: 24, display: "block" };
  if (platform === "instagram") return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="17" cy="7" r="1" fill={color} stroke="none" />
    </svg>
  );
  if (platform === "pinterest") return (
    <svg viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.03-2.83.19-.77 1.27-5.39 1.27-5.39s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.21-2.47 3.21-5.39 0-2.23-1.51-3.79-3.66-3.79-2.49 0-3.96 1.87-3.96 3.8 0 .75.29 1.56.65 2 .07.09.08.17.06.26-.07.27-.21.87-.24.99-.04.16-.13.19-.3.12-1.12-.52-1.82-2.17-1.82-3.49 0-2.84 2.06-5.44 5.94-5.44 3.12 0 5.54 2.22 5.54 5.19 0 3.1-1.95 5.59-4.66 5.59-.91 0-1.77-.47-2.06-1.03l-.56 2.09c-.2.78-.75 1.75-1.12 2.34.84.26 1.74.4 2.67.4 5.52 0 10-4.48 10-10S17.52 2 12 2z"/>
    </svg>
  );
  if (platform === "tiktok") return (
    <svg viewBox="0 0 24 24" fill={color} style={style}>
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.34 6.34 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34v-7a8.27 8.27 0 0 0 4.84 1.55V6.41a4.85 4.85 0 0 1-1.07-.28z"/>
    </svg>
  );
  return null;
}

// ── Main canvas component ──────────────────────────────────────────────────
export default function FooterCanvas({
  items,             // all footer_items from DB
  footerConfig,      // footer_config row
  selectedItemId,    // currently selected block id
  draftForm,         // live draft from editor
  onSelectItem,      // (item) => void
  C,
}) {
  const [viewMode, setViewMode]   = useState("desktop"); // "desktop" | "mobile"
  const [pageTheme, setPageTheme] = useState("dark");    // "dark" | "light" | "editorial"
  const [hoveredItemId, setHoveredItemId] = useState(null);
  const [marqueePaused, setMarqueePaused] = useState(false);

  const cfg = footerConfig || DEFAULT_FOOTER_CONFIG;
  const G = cfg.accent_color || "#c9a84c";

  // ── effectiveItems: merge live draft onto selected item ────────────────
  const effectiveItems = (items || []).map(item =>
    item.id === selectedItemId && draftForm
      ? { ...item, ...draftForm }
      : item
  );

  // Group by column_id
  const grouped = {};
  effectiveItems.forEach(item => {
    const col = item.column_id ?? 2;
    if (!grouped[col]) grouped[col] = [];
    grouped[col].push(item);
  });
  Object.values(grouped).forEach(arr => arr.sort((a, b) => a.position - b.position));

  const iconicItems    = (grouped[ICONIC_STRIP_COL] || []).filter(i => i.visible);
  const bottomBarItems = (grouped[BOTTOM_BAR_COL] || []).filter(i => i.visible);

  // ── Page themes for the outer canvas wrapper ───────────────────────────
  const PAGE_THEMES = {
    dark:      { bg: "#080602",  text: "#f5efe4" },
    light:     { bg: "#f6f1e8",  text: "#171717" },
    editorial: { bg: "#111009",  text: "#f5efe4" },
  };
  const theme = PAGE_THEMES[pageTheme];

  // ── Footer bg with opacity ────────────────────────────────────────────
  const footerBg = cfg.bg_color || "#0b0906";

  // ── Canvas width ──────────────────────────────────────────────────────
  const isMobile = viewMode === "mobile";
  const canvasWidth = isMobile ? 390 : "100%";

  const numCols = cfg.layout_columns || 6;
  const colIds = Array.from({ length: numCols - 1 }, (_, i) => i + 2);

  function isSelected(item) { return item.id === selectedItemId; }
  function selectOutline(item) {
    return isSelected(item)
      ? { outline: `1.5px solid ${G}80`, outlineOffset: 2, cursor: "pointer" }
      : { cursor: "pointer" };
  }

  // ── Render a single column item ───────────────────────────────────────
  function renderItem(item) {
    const textColor = cfg.text_color || "#d4c8b0";
    const accentColor = G;
    const sel = isSelected(item);

    if (!item.visible) return null;

    switch (item.block_type) {
      case "heading":
        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            style={{
              fontFamily: SANS, fontSize: 9, fontWeight: 600,
              letterSpacing: "0.14em", textTransform: "uppercase",
              color: accentColor, opacity: 0.8, marginBottom: 12,
              ...selectOutline(item),
            }}
          >
            {item.content || item.label || "Heading"}
          </div>
        );

      case "text":
        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            style={{
              fontFamily: SANS, fontSize: 12,
              color: textColor, opacity: 0.7,
              lineHeight: 1.6, marginBottom: 8,
              ...selectOutline(item),
            }}
          >
            {item.content || item.label || "Text block"}
          </div>
        );

      case "category_list":
      case "country_list":
      case "mag_list":
        return (
          <div key={item.id} onClick={() => onSelectItem(item)} style={selectOutline(item)}>
            {(AUTO_BLOCK_PLACEHOLDERS[item.block_type] || []).map((name, i) => (
              <div key={i} style={{
                fontFamily: SANS, fontSize: 12, color: textColor,
                opacity: 0.72, padding: "2px 0", lineHeight: 1.7,
              }}>{name}</div>
            ))}
          </div>
        );

      case "link":
      default: {
        const hovered = hoveredItemId === item.id;
        return (
          <div
            key={item.id}
            onClick={() => onSelectItem(item)}
            onMouseEnter={() => setHoveredItemId(item.id)}
            onMouseLeave={() => setHoveredItemId(null)}
            style={{
              fontFamily: SANS, fontSize: 12,
              color: hovered ? accentColor : textColor,
              padding: "3px 0", lineHeight: 1.85,
              opacity: item.visible ? (hovered ? 1 : 0.78) : 0.35,
              textDecoration: hovered ? "underline" : "none",
              textDecorationColor: accentColor + "60",
              transition: "color 180ms, opacity 180ms",
              ...selectOutline(item),
            }}
          >
            {item.label || "Link"}
          </div>
        );
      }
    }
  }

  // ── Editorial tagline above Iconic strip ─────────────────────────────
  function renderEditorialTagline() {
    const textColor = cfg.text_color || "#d4c8b0";
    return (
      <div style={{
        width: "100%",
        textAlign: "center",
        padding: isMobile ? "28px 20px 28px" : "44px 0 32px",
        background: footerBg,
        boxSizing: "border-box",
      }}>
        <p style={{
          fontFamily: "'Gilda Display', 'Cormorant Garamond', Georgia, serif",
          fontSize: isMobile ? 17 : 22,
          fontWeight: 400,
          fontStyle: "italic",
          color: textColor,
          opacity: 0.55,
          letterSpacing: "0.02em",
          lineHeight: 1.5,
          margin: 0,
        }}>
          The world's finest venues and vendors, carefully selected
        </p>
      </div>
    );
  }

  // ── Iconic Venues strip — seamless marquee ────────────────────────────
  function renderIconicStrip() {
    const iconicBlock = iconicItems.find(i => i.block_type === "iconic_venues");

    // Derive names: manual entries (name/url objects) or fallback placeholders
    let names;
    if (iconicBlock) {
      const entries = iconicBlock.iconic_venues || [];
      names = entries.length > 0
        ? entries.map(e => e.name).filter(Boolean)
        : ["Villa d'Este", "Borgo Egnazia", "Belmond", "Il Borro", "Palazzo Versace", "Aman Venice"];
    } else {
      names = ["Villa d'Este", "Borgo Egnazia", "Belmond", "Il Borro", "Palazzo Versace", "Aman Venice"];
    }

    // Repeat enough times to fill any viewport seamlessly (min 3x)
    const reps = Math.max(3, Math.ceil(18 / names.length));
    const repeated = Array.from({ length: reps }, () => names).flat();

    // Duration: ~7s per venue, minimum 40s for a slow luxurious feel
    const duration = Math.max(40, names.length * 7);

    const isStripSelected = iconicBlock ? isSelected(iconicBlock) : false;
    const textColor = cfg.text_color || "#d4c8b0";

    return (
      <div
        onClick={iconicBlock ? () => onSelectItem(iconicBlock) : undefined}
        onMouseEnter={() => setMarqueePaused(true)}
        onMouseLeave={() => setMarqueePaused(false)}
        style={{
          padding: "18px 0 16px",
          borderBottom: `1px solid ${cfg.border_color || "#2a2218"}`,
          cursor: iconicBlock ? "pointer" : "default",
          ...(isStripSelected ? { outline: `1.5px solid ${G}80`, outlineOffset: -2 } : {}),
        }}
      >
        {/* Keyframe injection */}
        <style>{`
          @keyframes lwd-marquee {
            from { transform: translateX(0); }
            to   { transform: translateX(-${Math.round(100 / reps)}%); }
          }
        `}</style>

        {/* Label with flanking gold rules */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "center",
          gap: 16, marginBottom: 16,
        }}>
          <div style={{ height: 1, width: 56, background: G, opacity: 0.45 }} />
          <span style={{
            fontFamily: SANS, fontSize: 8, fontWeight: 300,
            letterSpacing: "0.26em", textTransform: "uppercase",
            color: G, whiteSpace: "nowrap", opacity: 0.85,
          }}>{cfg.strip_label || "Iconic Venues"}</span>
          <div style={{ height: 1, width: 56, background: G, opacity: 0.45 }} />
        </div>

        {/* Marquee container with fade edges */}
        <div style={{
          overflow: "hidden",
          maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
          WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            width: "max-content",
            animation: `lwd-marquee ${duration}s linear infinite`,
            animationPlayState: marqueePaused ? "paused" : "running",
          }}>
            {repeated.map((name, i) => (
              <span key={i} style={{ display: "flex", alignItems: "center", flexShrink: 0 }}>
                <span style={{
                  fontFamily: SANS,
                  fontSize: 11,
                  fontWeight: 500,
                  color: textColor,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  whiteSpace: "nowrap",
                }}>{name}</span>
                <span style={{
                  color: G,
                  margin: "0 40px",
                  opacity: 0.5,
                  fontSize: 8,
                  flexShrink: 0,
                }}>·</span>
              </span>
            ))}
          </div>
        </div>

        {/* Placeholder hint when no block added */}
        {!iconicBlock && (
          <div style={{
            textAlign: "center", marginTop: 10,
            fontFamily: SANS, fontSize: 10, color: "#3a3530", fontStyle: "italic",
          }}>
            Add a curated selection of iconic venues to highlight your world
          </div>
        )}
      </div>
    );
  }

  // ── Brand block (column 1) ─────────────────────────────────────────────
  function renderBrandBlock() {
    const textColor = cfg.text_color || "#d4c8b0";
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {cfg.show_logo && (
          <div style={{
            fontFamily: SERIF, fontSize: cfg.logo_size || 32,
            color: G, letterSpacing: "0.04em", lineHeight: 1,
          }}>
            LWD
          </div>
        )}
        {cfg.show_tagline && (
          <div style={{
            fontFamily: SANS, fontSize: 11,
            color: textColor, opacity: 0.65, lineHeight: 1.6,
            maxWidth: 168,
          }}>
            {cfg.tagline_text || "The world's finest wedding directory"}
          </div>
        )}
        {cfg.show_social && (
          <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
            {cfg.social_instagram && (
              <a href={cfg.social_instagram} style={{ opacity: 0.7 }}>
                <SocialIcon platform="instagram" color={textColor} />
              </a>
            )}
            {cfg.social_pinterest && (
              <a href={cfg.social_pinterest} style={{ opacity: 0.7 }}>
                <SocialIcon platform="pinterest" color={textColor} />
              </a>
            )}
            {cfg.social_tiktok && (
              <a href={cfg.social_tiktok} style={{ opacity: 0.7 }}>
                <SocialIcon platform="tiktok" color={textColor} />
              </a>
            )}
            {/* Placeholder icons if none configured */}
            {!cfg.social_instagram && !cfg.social_pinterest && !cfg.social_tiktok && (
              <div style={{ display: "flex", gap: 6 }}>
                {["IG", "PT", "TK"].map(p => (
                  <div key={p} style={{
                    width: 42, height: 42, borderRadius: "50%",
                    border: `1px solid ${cfg.border_color || "#2a2218"}`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontFamily: SANS, fontSize: 9, color: textColor, opacity: 0.4,
                  }}>{p}</div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Fallback editorial content per nav column (shown when DB column is empty) ──
  const COLUMN_FALLBACKS = [
    { heading: "COUPLES",      links: ["Browse Venues", "Find Photographers", "Wedding Planners", "Real Weddings", "The Magazine", "Planning Checklist"] },
    { heading: "VENDORS",      links: ["List Your Business", "Advertise", "Pricing Plans", "Success Stories", "Vendor Dashboard"] },
    { heading: "DESTINATIONS", links: ["Lake Como", "Amalfi Coast", "French Riviera", "Tuscany", "Mykonos", "Dubai", "All Destinations"] },
    { heading: "OUR BRANDS",   links: ["LWD Magazine", "Artistry Awards", "The LWD Standard", "Getting Married"] },
    { heading: "COMPANY",      links: ["About Us", "Editorial Standards", "Press & Media", "Contact", "Privacy Policy"] },
  ];

  // ── Main footer grid ───────────────────────────────────────────────────
  function renderMainFooter() {
    const padX = cfg.pad_x || 48;
    const padY = cfg.pad_y || 64;
    const textColor = cfg.text_color || "#d4c8b0";

    const gridCols = isMobile
      ? "1fr"
      : `repeat(${numCols}, 1fr)`;

    return (
      <div style={{
        padding: isMobile ? `${padY * 0.6}px 20px` : `${Math.round(padY * 0.65)}px ${padX}px ${padY}px`,
        background: footerBg,
      }}>
        <div style={{
          display: "grid",
          gridTemplateColumns: gridCols,
          gap: isMobile ? 24 : 32,
          alignItems: "start",
        }}>
          {/* Column 1: Brand block (locked) */}
          <div>{renderBrandBlock()}</div>

          {/* Columns 2-N */}
          {colIds.map((colId, idx) => {
            const colItems = grouped[colId] || [];
            const fallback = COLUMN_FALLBACKS[idx];
            return (
              <div key={colId} style={{ display: "flex", flexDirection: "column" }}>
                {colItems.length > 0
                  ? colItems.map(item => renderItem(item))
                  : fallback && (
                    <div style={{ opacity: 0.28 }}>
                      <div style={{
                        fontFamily: SANS, fontSize: 9, fontWeight: 600,
                        letterSpacing: "0.14em", textTransform: "uppercase",
                        color: G, marginBottom: 12,
                      }}>{fallback.heading}</div>
                      {fallback.links.map((lbl, i) => (
                        <div key={i} style={{
                          fontFamily: SANS, fontSize: 12,
                          color: textColor, padding: "3px 0", lineHeight: 1.85,
                        }}>{lbl}</div>
                      ))}
                    </div>
                  )
                }
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Newsletter strip ───────────────────────────────────────────────────
  function renderNewsletter() {
    if (!cfg.show_newsletter) return null;
    const padX = cfg.pad_x || 48;
    const textColor = cfg.text_color || "#d4c8b0";

    return (
      <div style={{
        padding: isMobile ? "28px 20px" : `28px ${padX}px`,
        borderTop: `1px solid ${cfg.border_color || "#2a2218"}`,
        background: footerBg,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 16 : 32,
      }}>
        {/* Left: editorial copy */}
        <div>
          <div style={{
            fontFamily: SANS, fontSize: 9, fontWeight: 700,
            letterSpacing: "0.12em", textTransform: "uppercase",
            color: G, marginBottom: 6, opacity: 1,
          }}>The editorial</div>
          <div style={{
            fontFamily: SERIF, fontSize: isMobile ? 18 : 22,
            color: textColor, marginBottom: 4,
          }}>
            {cfg.newsletter_heading || "The LWD Edit"}
          </div>
          <div style={{
            fontFamily: SANS, fontSize: 12,
            color: textColor, opacity: 0.85, lineHeight: 1.5,
          }}>
            {cfg.newsletter_subtext || "Monthly inspiration for modern luxury couples"}
          </div>
        </div>

        {/* Right: input + button mock */}
        <div style={{
          display: "flex", gap: 0,
          flexShrink: 0,
          width: isMobile ? "100%" : 340,
        }}>
          <input
            readOnly
            placeholder="Your email address"
            style={{
              flex: 1, background: "transparent",
              borderTop: `1px solid ${cfg.accent_color || "#c9a84c"}80`,
              borderBottom: `1px solid ${cfg.accent_color || "#c9a84c"}80`,
              borderLeft: `1px solid ${cfg.accent_color || "#c9a84c"}80`,
              borderRight: "none",
              borderRadius: "4px 0 0 4px",
              color: textColor, fontFamily: SANS, fontSize: 12,
              padding: "10px 14px", outline: "none",
              opacity: 0.9,
            }}
          />
          <button style={{
            background: G, border: "none",
            borderRadius: "0 4px 4px 0",
            color: "#0a0906", fontFamily: SANS, fontSize: 11,
            fontWeight: 700, letterSpacing: "0.08em",
            textTransform: "uppercase", padding: "10px 18px",
            cursor: "default", flexShrink: 0,
          }}>
            {cfg.newsletter_btn_label || "Subscribe"}
          </button>
        </div>
      </div>
    );
  }

  // ── Bottom bar ─────────────────────────────────────────────────────────
  function renderBottomBar() {
    if (!cfg.show_bottom_bar) return null;
    const textColor = cfg.bottom_bar_text || "#5a5045";
    const padX = cfg.pad_x || 48;

    const bbLinks = bottomBarItems.filter(i => i.visible);

    return (
      <div style={{
        background: cfg.bottom_bar_bg || "#080604",
        padding: isMobile ? "14px 20px" : `14px ${padX}px`,
        display: "flex",
        flexDirection: isMobile ? "column" : "row",
        alignItems: isMobile ? "flex-start" : "center",
        justifyContent: "space-between",
        gap: isMobile ? 8 : 0,
      }}>
        <div style={{ fontFamily: SANS, fontSize: 11, color: textColor }}>
          &copy; {cfg.copyright_text || "2025 Luxury Wedding Directory"}
        </div>
        <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
          {bbLinks.length > 0
            ? bbLinks.map(item => (
                <span
                  key={item.id}
                  onClick={() => onSelectItem(item)}
                  style={{
                    fontFamily: SANS, fontSize: 11, color: textColor,
                    cursor: "pointer",
                    ...selectOutline(item),
                  }}
                >{item.label}</span>
              ))
            : ["Privacy", "Terms", "Cookies"].map(lbl => (
                <span key={lbl} style={{ fontFamily: SANS, fontSize: 11, color: textColor, opacity: 0.5 }}>
                  {lbl}
                </span>
              ))
          }
        </div>
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div style={{ width: "100%" }}>

      {/* Toolbar */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        marginBottom: 6, gap: 6,
        background: C?.bg || "#0b0906",
        border: `1px solid ${C?.border || "#2a2218"}`,
        borderRadius: 9, padding: "5px 8px",
        width: "100%", boxSizing: "border-box",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PillBtn label="Desktop" active={viewMode === "desktop"} onClick={() => setViewMode("desktop")} C={C} />
          <PillBtn label="Mobile"  active={viewMode === "mobile"}  onClick={() => setViewMode("mobile")}  C={C} />
        </div>

        <Sep C={C} />

        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
          <PillBtn label="Dark"      active={pageTheme === "dark"}      onClick={() => setPageTheme("dark")}      C={C} />
          <PillBtn label="Light"     active={pageTheme === "light"}     onClick={() => setPageTheme("light")}     C={C} />
          <PillBtn label="Editorial" active={pageTheme === "editorial"} onClick={() => setPageTheme("editorial")} C={C} />
        </div>
      </div>

      {/* Canvas frame */}
      <div style={{
        background: theme.bg,
        borderRadius: 10,
        overflow: "hidden",
        border: `1px solid ${C?.border || "#2a2218"}`,
        width: "100%",
        boxSizing: "border-box",
      }}>
        {/* Footer sections */}
        <div style={{
          width: isMobile ? canvasWidth : "100%",
          margin: isMobile ? "0 auto" : undefined,
          background: footerBg,
          borderTop: cfg.border_top ? `1px solid ${cfg.border_color || "#2a2218"}` : "none",
        }}>
          {/* 0. Editorial tagline — own full-width container, reads as introduction */}
          {renderEditorialTagline()}

          {/* Separator: visually closes the tagline block before the strip begins */}
          <div style={{
            borderTop: `1px solid ${cfg.border_color || "#2a2218"}`,
            margin: "0",
          }} />

          {/* 1. Iconic Venues strip — separate block below */}
          <div style={{ padding: isMobile ? 0 : `0 ${cfg.pad_x || 48}px` }}>
            {renderIconicStrip()}
          </div>

          {/* 2. Main footer columns */}
          {renderMainFooter()}

          {/* 3. Newsletter */}
          {renderNewsletter()}

          {/* 4. Bottom bar */}
          {renderBottomBar()}
        </div>
      </div>

      {/* Selection hint */}
      <div style={{
        marginTop: 6,
        fontFamily: SANS, fontSize: 10,
        color: C?.grey2 || "#5a5045", textAlign: "center",
      }}>
        Click any footer section to select and edit it
      </div>
    </div>
  );
}
