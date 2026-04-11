/**
 * ─── MatchReasoning.jsx ───────────────────────────────────────────────────
 * MATCH TRANSPARENCY BADGE
 *
 * Shows why a listing matched the current filter.
 * Builds trust by making selection logic explicit and visible.
 *
 * Example:
 * "Matches: Romantic style"
 * "Matches: Romantic + Coastal setting"
 * "Matches: Romantic, capacity 120+, garden setting"
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * Determine which criteria matched this listing
 * @param {Object} listing - The venue/vendor object
 * @param {Array} matchedStyles - The styles that matched the filter
 * @param {Object} otherFilters - Other active filters (capacity, region, etc.)
 * @returns {Array} - Array of matched criteria strings
 */
export function getMatchReasons(listing, matchedStyles = [], otherFilters = {}) {
  const reasons = [];

  // Primary reason: matched style
  if (matchedStyles && matchedStyles.length > 0) {
    const styleDisplay = matchedStyles.length === 1
      ? matchedStyles[0]
      : `${matchedStyles[0]} aesthetic`;
    reasons.push(styleDisplay);
  }

  // Secondary reasons: other matching criteria
  if (otherFilters && typeof otherFilters === 'object') {
    // Capacity match
    if (otherFilters.guestCount && listing.capacity >= otherFilters.guestCount) {
      reasons.push(`capacity ${listing.capacity}+`);
    }

    // Location match
    if (otherFilters.location && (listing.city === otherFilters.location || listing.region === otherFilters.location)) {
      reasons.push(`${listing.city || listing.region}`);
    }

    // Setting match
    if (listing.styles && listing.styles.length > 0) {
      const settingStyles = ['Garden', 'Vineyard', 'Coastal', 'Lakeside'];
      const settings = listing.styles.filter(s => settingStyles.includes(s));
      if (settings.length > 0 && otherFilters.setting) {
        reasons.push(`${settings[0]} setting`);
      }
    }
  }

  return reasons;
}

/**
 * MatchReasoning Badge Component
 * @param {Object} listing - The venue/vendor
 * @param {Array} matchedStyles - Styles that matched
 * @param {Object} otherFilters - Other active filters
 * @param {boolean} darkMode - Dark mode enabled
 */
export default function MatchReasoning({
  listing,
  matchedStyles = [],
  otherFilters = {},
  darkMode = false,
}) {
  const reasons = getMatchReasons(listing, matchedStyles, otherFilters);

  if (reasons.length === 0) return null;

  const C = darkMode ? {
    bg: "rgba(201,168,76,0.08)",
    text: "#C9A84C",
    border: "rgba(201,168,76,0.2)",
  } : {
    bg: "rgba(201,168,76,0.08)",
    text: "#A67C3A",
    border: "rgba(201,168,76,0.2)",
  };

  const reasonText = reasons
    .slice(0, 3) // Show max 3 reasons
    .join(", ");

  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        fontSize: 11,
        fontFamily: "var(--font-body)",
        fontWeight: 500,
        color: C.text,
        background: C.bg,
        border: `1px solid ${C.border}`,
        borderRadius: "var(--lwd-radius-input, 6px)",
        padding: "5px 10px",
        textTransform: "uppercase",
        letterSpacing: "0.3px",
        opacity: 0.85,
      }}
      title={`This venue matches: ${reasonText}`}
    >
      <span style={{ opacity: 0.7 }}>✓</span>
      <span>Matches: {reasonText}</span>
      {reasons.length > 3 && <span style={{ opacity: 0.6 }}>+{reasons.length - 3}</span>}
    </div>
  );
}
