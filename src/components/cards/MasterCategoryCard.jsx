// ─── src/components/cards/MasterCategoryCard.jsx ───────────────────────────────
// Master category card component — single source of truth for all icon+label cards
// Used across the site for vendor categories, wedding services, and related sections.
// Props: { category, colors, onClick, isEmpty, showSoonBadge }
import { useState } from "react";

// ── Locked master card dimensions (source of truth) ──────────────────────────
// All category cards site-wide MUST use these exact dimensions.
// Do NOT resize cards to fit layouts. Update layouts to fit the card size.
export const MASTER_CARD_SPEC = {
  width: 200,
  height: 131,
  padding: "28px 12px",
  borderRadius: "var(--lwd-radius-card)",
  gap: 12,
};

// ── Luxury SVG icons for category cards ──────────────────────────────────────
export const LUXURY_ICONS = {
  "wedding-venues": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" />
      <path d="M5 21V7l7-4 7 4v14" />
      <path d="M9 21v-6h6v6" />
      <path d="M10 10h.01M14 10h.01" />
    </svg>
  ),
  "wedding-planners": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  "photographers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  ),
  "florists": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c0 0 0-3 0-6" />
      <path d="M9 18c-2 0-4-1.5-4-4 0-2 2-3.5 4-3.5.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5c2 0 4 1.5 4 3.5 0 2.5-2 4-4 4" />
      <path d="M12 8c0-2 1-4 3-5" />
      <path d="M12 8c0-2-1-4-3-5" />
    </svg>
  ),
  "caterers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8h1a4 4 0 010 8h-1" />
      <path d="M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8z" />
      <line x1="6" y1="1" x2="6" y2="4" />
      <line x1="10" y1="1" x2="10" y2="4" />
      <line x1="14" y1="1" x2="14" y2="4" />
    </svg>
  ),
  "hair-makeup": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="5" />
      <path d="M12 13v8" />
      <path d="M9 18h6" />
      <path d="M15 5c1-2 3-3 4-2" />
    </svg>
  ),
  "entertainment": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  ),
  "videographers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  ),
  "wedding-cakes": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 18h16v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
      <path d="M6 14h12v4H6z" />
      <path d="M8 10h8v4H8z" />
      <path d="M12 3v3" />
      <circle cx="12" cy="2" r="1" />
    </svg>
  ),
  "stationery": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  "bridal-wear": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C9 2 7 5 7 8c0 2 1 3 2 4l-3 10h12l-3-10c1-1 2-2 2-4 0-3-2-6-5-6z" />
      <path d="M9 22h6" />
    </svg>
  ),
  "jewellers": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="14" r="6" />
      <path d="M12 8V2" />
      <path d="M8 10l-3-5" />
      <path d="M16 10l3-5" />
    </svg>
  ),
  "transport": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 17h14v-5H5v5z" />
      <path d="M2 12h20" />
      <path d="M5 12V7c0-1.7 1.3-3 3-3h8c1.7 0 3 1.3 3 3v5" />
      <circle cx="7" cy="17" r="2" />
      <circle cx="17" cy="17" r="2" />
    </svg>
  ),
  "event-design": (color) => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

// ── Font tokens ──────────────────────────────────────────────────────────────
const BODY_FONT = "var(--font-body)";

/**
 * MasterCategoryCard — Single source of truth for category icon+label cards
 *
 * ⚠️  LOCKED DIMENSIONS — DO NOT MODIFY SIZE
 * All instances MUST render at 200px × 131px with 28px 12px padding.
 * Layouts must adapt to fit this card size.
 *
 * Used across the site for:
 * - Vendor categories (wedding venues, planners, photographers, etc.)
 * - Category shortcuts in carousels and grids
 * - Region/location category navigation
 *
 * Props:
 *   category: { slug, label, icon? } — category data
 *   colors: { dark, card, border2, gold, goldDim, off, grey } — theme colors
 *   onClick: () => void — click handler
 *   isEmpty: boolean — shows as inactive/dimmed with "Soon" badge
 *   showSoonBadge: boolean — override to force "Soon" badge visibility
 */
export default function MasterCategoryCard({
  category,
  colors,
  onClick,
  isEmpty = false,
  showSoonBadge = isEmpty,
}) {
  const [hov, setHov] = useState(false);
  const C = colors;
  const iconColor = hov ? C.gold : (C.grey || "#888");
  const renderIcon = LUXURY_ICONS[category.slug];

  // Use locked master dimensions — do not override
  const { width, height, padding, borderRadius, gap } = MASTER_CARD_SPEC;

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        position: "relative",
        width: `${width}px`,
        height: `${height}px`,
        background: hov ? C.card : C.dark,
        border: `1px solid ${hov ? C.gold : C.border2}`,
        opacity: isEmpty ? 0.65 : 1,
        borderRadius,
        padding,
        textAlign: "center",
        cursor: "pointer",
        transition: "all 0.25s",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap,
        flexShrink: 0,
      }}
    >
      {/* Icon circle */}
      <span
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 48,
          height: 48,
          borderRadius: "50%",
          background: hov ? (C.goldDim || "rgba(201,168,76,0.08)") : "transparent",
          border: `1px solid ${hov ? C.gold : (C.border2 || "rgba(255,255,255,0.08)")}`,
          transition: "all 0.3s ease",
          flexShrink: 0,
        }}
        aria-hidden="true"
      >
        {renderIcon ? renderIcon(iconColor) : <span style={{ fontSize: 22, opacity: 0.6 }}>{category.icon}</span>}
      </span>

      {/* Label */}
      <span
        style={{
          fontFamily: BODY_FONT,
          fontSize: 9,
          fontWeight: 600,
          letterSpacing: "1px",
          textTransform: "uppercase",
          color: hov ? C.gold : C.off,
          transition: "color 0.2s",
          lineHeight: 1.4,
          wordBreak: "break-word",
          textAlign: "center",
        }}
      >
        {category.label}
      </span>

      {/* Soon badge */}
      {showSoonBadge && (
        <span
          style={{
            position: "absolute",
            top: 8,
            right: 8,
            fontSize: 7,
            fontFamily: BODY_FONT,
            fontWeight: 700,
            letterSpacing: "1px",
            textTransform: "uppercase",
            color: C.gold || "#C9A84C",
            background: "rgba(201,168,76,0.1)",
            border: "1px solid rgba(201,168,76,0.25)",
            borderRadius: 4,
            padding: "2px 5px",
            lineHeight: 1.4,
          }}
        >
          Soon
        </span>
      )}
    </button>
  );
}
