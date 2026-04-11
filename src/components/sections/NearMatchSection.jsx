/**
 * ─── NearMatchSection.jsx ──────────────────────────────────────────────────
 * NEAR MATCH SUGGESTIONS
 *
 * When strict filter results are low, intelligently suggest near matches.
 *
 * Example:
 * Primary results: Romantic venues (strict match)
 * Near matches: "You may also like..."
 *   - Garden venues (secondary aesthetic similar to Romantic setting)
 *   - Intimate venues (similar vibe)
 *
 * KEY: Keeps them visually separated and clearly secondary.
 * Maintains strict taxonomy while offering helpful alternatives.
 * ────────────────────────────────────────────────────────────────────────── */

import { useMemo } from "react";
import LuxuryVenueCard from "../cards/LuxuryVenueCard";

const GD = "var(--font-heading-primary)";
const NU = "var(--font-body)";

/**
 * Find near matches (venues similar to filter but not exact match)
 * @param {Array} allListings - All available listings
 * @param {Array} matchedStyles - Styles that matched the filter
 * @param {Array} primaryResults - Already matched results
 * @returns {Array} - Array of near-match venues
 */
function findNearMatches(allListings, matchedStyles, primaryResults, maxSuggestions = 3) {
  if (!allListings || !matchedStyles || matchedStyles.length === 0) return [];

  const primaryIds = new Set(primaryResults.map((v) => v.id));
  const nearMatches = [];

  // Secondary aesthetic styles that pair well with primary styles
  const semanticPairings = {
    Romantic: ["Garden", "Intimate"], // Romantic pairs with garden settings
    Contemporary: ["Art Deco"], // Contemporary pairs with Art Deco
    Rustic: ["Vineyard"], // Rustic pairs with vineyard
    Classic: ["Historic"], // Classic pairs with historic
  };

  const primaryStyle = matchedStyles[0];
  const secondaryStyles = semanticPairings[primaryStyle] || [];

  // Find venues with secondary aesthetic that weren't in primary results
  allListings.forEach((venue) => {
    if (primaryIds.has(venue.id)) return; // Skip already matched

    // Check if venue has one of the secondary styles that pair with primary
    const hasSecondaryPairing = venue.styles && venue.styles.some((s) => secondaryStyles.includes(s));

    if (hasSecondaryPairing) {
      nearMatches.push({
        venue,
        reason: `Features ${venue.styles.find((s) => secondaryStyles.includes(s))} aesthetic`,
      });
    }
  });

  return nearMatches.slice(0, maxSuggestions);
}

export default function NearMatchSection({
  allListings = [],
  matchedStyles = [],
  primaryResults = [],
  onView = () => {},
  darkMode = false,
  categoryLabel = "Venues",
}) {
  const nearMatches = useMemo(
    () => findNearMatches(allListings, matchedStyles, primaryResults),
    [allListings, matchedStyles, primaryResults]
  );

  if (nearMatches.length === 0) return null;

  const C = darkMode ? {
    bg: "#1a1714",
    text: "#E4D9C3",
    divider: "rgba(201,168,76,0.15)",
    accentBorder: "rgba(201,168,76,0.25)",
  } : {
    bg: "#f2f0ea",
    text: "#2C2420",
    divider: "rgba(201,168,76,0.1)",
    accentBorder: "rgba(201,168,76,0.2)",
  };

  return (
    <div
      style={{
        marginTop: 48,
        paddingTop: 32,
        borderTop: `2px dashed ${C.divider}`,
      }}
    >
      {/* Section Header */}
      <div style={{ marginBottom: 24, textAlign: "center" }}>
        <h3 style={{
          fontFamily: GD,
          fontSize: 18,
          fontWeight: 400,
          color: C.text,
          opacity: 0.85,
          margin: 0,
          marginBottom: 6,
        }}>
          You may also like
        </h3>
        <p style={{
          fontFamily: NU,
          fontSize: 12,
          color: C.text,
          opacity: 0.6,
          margin: 0,
          letterSpacing: "0.5px",
        }}>
          {nearMatches.length} {nearMatches.length === 1 ? "option" : "options"} with similar aesthetics
        </p>
      </div>

      {/* Near Match Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: 16,
          opacity: 0.85,
        }}
      >
        {nearMatches.map((item) => (
          <div
            key={item.venue.id}
            style={{
              position: "relative",
              opacity: 0.75,
              transition: "opacity 0.2s",
            }}
            onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
            onMouseLeave={(e) => e.currentTarget.style.opacity = "0.75"}
          >
            {/* Visual indicator that this is a near match */}
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                height: 1,
                background: `linear-gradient(90deg, ${C.accentBorder} 0%, transparent 100%)`,
                zIndex: 10,
              }}
            />

            <LuxuryVenueCard
              v={item.venue}
              onView={() => onView(item.venue.id || item.venue.slug)}
              matchedStyles={[]} // No strict match badge for near matches
            />

            {/* Reason badge for near match */}
            <div
              style={{
                position: "absolute",
                top: 12,
                right: 12,
                background: "rgba(201,168,76,0.12)",
                border: `1px solid rgba(201,168,76,0.25)`,
                borderRadius: "var(--lwd-radius-input)",
                padding: "4px 10px",
                fontSize: 10,
                fontFamily: NU,
                fontWeight: 500,
                color: "#C9A84C",
                zIndex: 20,
                whiteSpace: "nowrap",
                backdropFilter: "blur(4px)",
              }}
            >
              Similar
            </div>
          </div>
        ))}
      </div>

      {/* Helpful note */}
      <div
        style={{
          marginTop: 24,
          padding: "12px 16px",
          background: `rgba(201,168,76,0.05)`,
          border: `1px solid ${C.divider}`,
          borderRadius: "var(--lwd-radius-input)",
          textAlign: "center",
        }}
      >
        <p style={{
          fontFamily: NU,
          fontSize: 11,
          color: C.text,
          opacity: 0.6,
          margin: 0,
          lineHeight: 1.5,
        }}>
          These options share similar aesthetics but differ in one key aspect.
          Explore them if you'd like to expand beyond strict {categoryLabel.toLowerCase()} filters.
        </p>
      </div>
    </div>
  );
}
