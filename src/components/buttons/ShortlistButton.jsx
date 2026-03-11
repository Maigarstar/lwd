// ─── src/components/buttons/ShortlistButton.jsx ─────────────────────────────
// Heart/Shortlist button for adding/removing vendors and venues from favorites

import { useState } from "react";
import { useTheme } from "../../theme/ThemeContext";

export default function ShortlistButton({
  item = {},
  isShortlisted = false,
  onToggle = () => {},
  variant = "icon", // 'icon' or 'text'
  size = "medium", // 'small', 'medium', 'large'
  disabled = false,
  loading = false,
  showLabel = true,
  strokeColor = null, // override default stroke color when not shortlisted
}) {
  const C = useTheme();
  const [hovered, setHovered] = useState(false);

  // Determine sizing
  const iconSizeMap = {
    small: "16px",
    medium: "20px",
    large: "24px",
  };

  const iconSize = iconSizeMap[size] || "20px";

  // Icon variant (heart)
  if (variant === "icon") {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggle(item.id, !isShortlisted);
        }}
        disabled={disabled || loading}
        style={{
          background: "none",
          border: "none",
          padding: "8px",
          cursor: disabled ? "not-allowed" : "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 200ms ease",
          transform: hovered && !disabled ? "scale(1.1)" : "scale(1)",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        title={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
        aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
      >
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 24 24"
          fill={isShortlisted ? "currentColor" : "none"}
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            color: isShortlisted ? C.gold : (strokeColor || C.grey),
            transition: "color 200ms ease, fill 200ms ease",
          }}
        >
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
        </svg>
      </button>
    );
  }

  // Text variant (button with label)
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle(item.id, !isShortlisted);
      }}
      disabled={disabled || loading}
      style={{
        background: isShortlisted ? C.gold : "transparent",
        color: isShortlisted ? "#0a0906" : C.gold,
        border: `1px solid ${isShortlisted ? C.gold : "rgba(201,168,76,0.4)"}`,
        borderRadius: "var(--lwd-radius-input, 6px)",
        padding: "10px 20px",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.1em",
        textTransform: "uppercase",
        cursor: disabled ? "not-allowed" : "pointer",
        fontFamily: "var(--font-body, sans-serif)",
        transition: "all 0.25s ease",
        opacity: disabled || loading ? 0.6 : 1,
        display: "flex",
        alignItems: "center",
        gap: "6px",
        whiteSpace: "nowrap",
      }}
      onMouseEnter={(e) => {
        if (!disabled && !loading) {
          e.currentTarget.style.background = C.gold;
          e.currentTarget.style.color = "#0a0906";
          e.currentTarget.style.borderColor = C.gold;
        }
      }}
      onMouseLeave={(e) => {
        if (!isShortlisted) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = C.gold;
          e.currentTarget.style.borderColor = "rgba(201,168,76,0.4)";
        }
      }}
      aria-label={isShortlisted ? "Remove from shortlist" : "Add to shortlist"}
    >
      <span style={{ fontSize: "14px" }}>{isShortlisted ? "♥" : "♡"}</span>
      {showLabel && (isShortlisted ? "Saved" : "Save")}
      {loading && <span style={{ marginLeft: "4px" }}>...</span>}
    </button>
  );
}
