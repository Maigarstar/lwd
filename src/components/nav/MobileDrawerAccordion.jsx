// ─── src/components/nav/MobileDrawerAccordion.jsx ──────────────────────────────
// Mobile-optimized accordion drawer that preserves navigation hierarchy
// Replaces flattened list with expandable sections for mega menus

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import { useTheme } from "../../theme/ThemeContext";

const NU = "var(--font-body)";
const GD = "var(--font-heading-primary)";

// Map nav_action to handler functions
function resolveHandler(item, handlers) {
  const { nav_action, url, open_new_tab } = item;
  if (nav_action === "about")              return () => handlers.onNavigateAbout?.();
  if (nav_action === "planning")           return () => handlers.onNavigateStandard?.();
  if (nav_action === "aura-discovery")     return () => { window.location.href = "/discovery/aura"; };
  if (nav_action === "browse")             return () => { window.location.href = "/venue"; };
  if (nav_action === "real-weddings")      return () => { window.location.href = "/real-weddings"; };
  if (nav_action === "magazine")           return () => { window.location.href = "/magazine"; };
  if (nav_action === "join")               return () => { window.location.href = "/join"; };
  if (nav_action === "list-your-business") return () => { window.location.href = "/list-your-business"; };
  if (nav_action === "contact")            return () => { window.location.href = "/contact"; };
  if (nav_action === "artistry-awards")    return () => { window.location.href = "/artistry-awards"; };
  if (url) return () => { open_new_tab ? window.open(url, "_blank", "noreferrer") : window.location.href = url; };
  return null;
}

export default function MobileDrawerAccordion({
  navItems,
  onClose,
  darkMode,
  onToggleDark,
  handlers
}) {
  const C = useTheme();
  const [expandedId, setExpandedId] = useState(null);
  const [nestedItems, setNestedItems] = useState({}); // Cache: { parentId: [items] }
  const [loading, setLoading] = useState({}); // Loading state per item

  // Fetch nested items for mega menus
  const expandItem = (itemId, sourceTable) => {
    if (expandedId === itemId) {
      // Collapse if already expanded
      setExpandedId(null);
      return;
    }

    // If already cached, just expand
    if (nestedItems[itemId]) {
      setExpandedId(itemId);
      return;
    }

    // Fetch nested items
    if (sourceTable) {
      setLoading(prev => ({ ...prev, [itemId]: true }));
      supabase
        .from(sourceTable)
        .select("*")
        .order("position", { ascending: true })
        .then(({ data, error }) => {
          if (data && !error) {
            setNestedItems(prev => ({ ...prev, [itemId]: data }));
            setExpandedId(itemId);
          }
          setLoading(prev => ({ ...prev, [itemId]: false }));
        });
    }
  };

  const handleNestedItemClick = (item) => {
    const handler = resolveHandler(item, handlers);
    if (handler) {
      handler();
      onClose?.();
    }
  };

  // Separate CTA items for bottom positioning
  const nonCtaItems = navItems.filter(i => i.type !== "cta");
  const ctaItems = navItems.filter(i => i.type === "cta");

  return (
    <>
      {/* ─ Main nav items section ─ */}
      <nav
        aria-label="Menu sections"
        style={{ padding: "16px 0", flex: 1, overflowY: "auto" }}
      >
        {nonCtaItems.map((item) => {
          const isMega = item.type === "mega_menu" || item.type === "dropdown";
          const isExpanded = expandedId === item.id;
          const isLoading = loading[item.id];
          const nested = nestedItems[item.id] || [];
          const handler = resolveHandler(item, handlers);

          return (
            <div key={item.id}>
              {/* ─ Top-level item ─ */}
              <button
                aria-expanded={isMega ? isExpanded : undefined}
                aria-controls={isMega ? `accordion-${item.id}` : undefined}
                aria-label={isMega ? `${item.label}, expandable menu` : item.label}
                onClick={() => {
                  if (isMega) {
                    expandItem(item.id, item.mega_menu_source);
                  } else {
                    onClose?.();
                    handler?.();
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  background: isExpanded ? "rgba(201,168,76,0.08)" : "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "16px 28px",
                  fontSize: 15,
                  fontWeight: isMega && isExpanded ? 600 : 400,
                  color: isExpanded ? C.gold : "rgba(245,240,232,0.7)",
                  fontFamily: NU,
                  letterSpacing: "0.3px",
                  transition: "all 0.25s ease",
                  minHeight: 52,
                }}
                onMouseEnter={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.color = C.gold;
                    e.currentTarget.style.background = "rgba(201,168,76,0.06)";
                  }
                }}
                onMouseLeave={e => {
                  if (!isExpanded) {
                    e.currentTarget.style.color = "rgba(245,240,232,0.7)";
                    e.currentTarget.style.background = "none";
                  }
                }}
              >
                <span>{item.label}</span>
                {isMega && (
                  <span
                    style={{
                      fontSize: 12,
                      opacity: 0.6,
                      transition: "transform 0.3s ease",
                      transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
                      display: "flex",
                      alignItems: "center",
                    }}
                  >
                    ▾
                  </span>
                )}
              </button>

              {/* ─ Nested mega menu items (accordion) ─ */}
              {isMega && isExpanded && (
                <div
                  id={`accordion-${item.id}`}
                  role="region"
                  aria-label={`${item.label} submenu`}
                  style={{
                    maxHeight: isExpanded ? "1000px" : "0px",
                    overflow: "hidden",
                    transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
                    background: "rgba(201,168,76,0.04)",
                    borderLeft: `2px solid ${C.gold}`,
                    marginLeft: "28px",
                  }}
                >
                  {isLoading ? (
                    <div
                      style={{
                        padding: "16px 28px",
                        fontSize: 12,
                        color: "rgba(245,240,232,0.4)",
                        textAlign: "center",
                      }}
                    >
                      Loading…
                    </div>
                  ) : nested.length > 0 ? (
                    nested.map(nestedItem => (
                      <button
                        key={nestedItem.id}
                        aria-label={`${item.label}: ${nestedItem.label}`}
                        onClick={() => handleNestedItemClick(nestedItem)}
                        style={{
                          display: "block",
                          width: "100%",
                          textAlign: "left",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          padding: "12px 28px",
                          paddingLeft: "40px",
                          fontSize: 13,
                          fontWeight: 400,
                          color: "rgba(245,240,232,0.5)",
                          fontFamily: NU,
                          letterSpacing: "0.3px",
                          transition: "color 0.2s, background 0.2s",
                          minHeight: 44,
                          borderLeft: "2px solid transparent",
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.color = C.gold;
                          e.currentTarget.style.background = "rgba(201,168,76,0.04)";
                          e.currentTarget.style.borderLeftColor = C.gold;
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.color = "rgba(245,240,232,0.5)";
                          e.currentTarget.style.background = "none";
                          e.currentTarget.style.borderLeftColor = "transparent";
                        }}
                      >
                        {nestedItem.label}
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: "12px 28px",
                        fontSize: 12,
                        color: "rgba(245,240,232,0.3)",
                        fontStyle: "italic",
                      }}
                    >
                      No items
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* ─ CTA items section (pinned at bottom) ─ */}
      {ctaItems.length > 0 && (
        <>
          <div style={{ height: 1, background: "rgba(201,168,76,0.12)", margin: "8px 24px" }} />
          <nav aria-label="Primary actions" style={{ padding: "12px 24px 24px" }}>
            {ctaItems.map(item => {
              const handler = resolveHandler(item, handlers);
              const isOutline = item.cta_style === "outline";
              const isDark = item.cta_style === "dark";

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onClose?.();
                    handler?.();
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "center",
                    fontFamily: NU,
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                    color: isDark ? C.gold : isOutline ? C.gold : "#0f0d0a",
                    background: isDark ? "#0a0906" : isOutline ? "transparent" : `linear-gradient(135deg, ${C.gold}, #e8c97a)`,
                    border: `1px solid ${isDark ? "#333" : C.gold}`,
                    borderRadius: 4,
                    padding: "13px 20px",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    marginBottom: item === ctaItems[ctaItems.length - 1] ? 0 : 8,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.opacity = "0.88";
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.opacity = "1";
                  }}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </>
      )}

      {/* ─ Dark mode toggle (always at bottom) ─ */}
      {!ctaItems.length && <div style={{ height: 1, background: "rgba(201,168,76,0.12)", margin: "8px 24px" }} />}
      <div style={{ padding: "20px 24px" }}>
        <button
          onClick={() => onToggleDark?.()}
          aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
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
            minHeight: 44,
            transition: "color 0.2s",
          }}
          onMouseEnter={e => (e.currentTarget.style.color = C.gold)}
          onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,240,232,0.5)")}
        >
          <span style={{ fontSize: 16 }}>{darkMode ? "☀" : "☽"}</span>
          <span>{darkMode ? "Light Mode" : "Dark Mode"}</span>
        </button>
      </div>
    </>
  );
}
