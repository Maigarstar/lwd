// ─── src/engine/queryEngine.js ────────────────────────────────────────────────
// Filter, sort, and search helpers for the LWD platform.
// Pure functions — no React dependencies, no imports from src/data.

import { hydrateScores } from "./curatedIndex.js";
import {
  EXPERIENCE_KIND_LABELS,
  DINING_STYLE_LABELS,
  DIETARY_OPTION_LABELS,
} from "./types.js";

// ── Helper: parse flat "response" string into hours (shared with curatedIndex) ──
function parseResponseString(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.toLowerCase().trim();

  if (s === "same day" || s === "same-day") return 1;

  const minMatch = s.match(/<?\.?\s*(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10) / 60;

  const hrMatch = s.match(/<?\.?\s*(\d+)\s*h(?:ou)?rs?/i);
  if (hrMatch) return parseInt(hrMatch[1], 10);

  const bareMatch = s.match(/^<?\.?\s*(\d+)\s*$/);
  if (bareMatch) return parseInt(bareMatch[1], 10);

  return null;
}

// ── filterByAirportProximity ─────────────────────────────────────────────────
/**
 * Returns venues where any airport has driveTimeMinutes <= maxMinutes.
 * @param {Object[]} venues
 * @param {number} maxMinutes
 * @returns {Object[]}
 */
export function filterByAirportProximity(venues, maxMinutes) {
  return venues.filter((v) => {
    const airports = v.access?.airports;
    if (!airports || airports.length === 0) return false;
    return airports.some((a) => a.driveTimeMinutes <= maxMinutes);
  });
}

// ── filterByExperienceKinds ──────────────────────────────────────────────────
/**
 * Returns venues where experiences contains at least one matching kind.
 * @param {Object[]} venues
 * @param {string[]} kinds — array of ExperienceKind values
 * @returns {Object[]}
 */
export function filterByExperienceKinds(venues, kinds) {
  const kindSet = new Set(kinds);
  return venues.filter((v) => {
    const experiences = v.experiences || [];
    return experiences.some((e) => kindSet.has(e.kind));
  });
}

// ── filterByCatering ─────────────────────────────────────────────────────────
/**
 * Returns venues matching all provided catering criteria (AND logic).
 * Omitted criteria are ignored.
 * @param {Object[]} venues
 * @param {{ inHouse?: boolean, externalAllowed?: boolean, dietaryOptions?: string[], diningStyles?: string[] }} criteria
 * @returns {Object[]}
 */
export function filterByCatering(venues, criteria) {
  const { inHouse, externalAllowed, dietaryOptions, diningStyles } = criteria;
  return venues.filter((v) => {
    const cat = v.catering;
    if (!cat) return false;

    if (inHouse != null) {
      const hasInHouse = cat.inHouse === true || cat.inHouse?.available === true;
      if (hasInHouse !== inHouse) return false;
    }

    if (externalAllowed != null) {
      if (cat.externalCaterersAllowed !== externalAllowed) return false;
    }

    if (dietaryOptions && dietaryOptions.length > 0) {
      const venueOptions = new Set(cat.dietary || []);
      if (!dietaryOptions.every((d) => venueOptions.has(d))) return false;
    }

    if (diningStyles && diningStyles.length > 0) {
      const venueStyles = new Set(cat.styles || []);
      if (!diningStyles.every((s) => venueStyles.has(s))) return false;
    }

    return true;
  });
}

// ── filterByResponseTime ─────────────────────────────────────────────────────
/**
 * Returns venues with average response time <= maxHours.
 * Checks contact.responseMetrics.averageResponseHours or parses flat response string.
 * @param {Object[]} venues
 * @param {number} maxHours
 * @returns {Object[]}
 */
export function filterByResponseTime(venues, maxHours) {
  return venues.filter((v) => {
    const hours = v.contact?.responseMetrics?.averageResponseHours
                  ?? parseResponseString(v.response)
                  ?? null;
    if (hours == null) return false;
    return hours <= maxHours;
  });
}

// ── rankByCuratedIndex ───────────────────────────────────────────────────────
/**
 * Hydrates scores, applies editorial boost if present, then returns a new array sorted by item.lwdScore descending.
 * Checks for _editorialBoost flag (set by recommendation engine for editorial prioritization).
 * @param {Object[]} venues
 * @returns {Object[]}
 */
export function rankByCuratedIndex(venues) {
  hydrateScores(venues);

  // Apply editorial boost if present (from Aura prioritization)
  for (const venue of venues) {
    if (venue._editorialBoost && typeof venue._editorialBoost === 'number') {
      venue.lwdScore = (venue.lwdScore || 0) * venue._editorialBoost;
    }
  }

  return [...venues].sort((a, b) => (b.lwdScore || 0) - (a.lwdScore || 0));
}

// ── searchIndexVenue ─────────────────────────────────────────────────────────
/**
 * Flattens all structured data into a single lowercase searchable string.
 * Includes label maps so searches match human phrasing (e.g. "Fine dining").
 * @param {Object} venue
 * @returns {string}
 */
export function searchIndexVenue(venue) {
  const parts = [];

  // Basic fields
  if (venue.name)        parts.push(venue.name);
  if (venue.city)        parts.push(venue.city);
  if (venue.region)      parts.push(venue.region);
  if (venue.country)     parts.push(venue.country);
  if (venue.desc)        parts.push(venue.desc);
  if (venue.description) parts.push(venue.description);
  if (venue.tag)         parts.push(venue.tag);
  if (venue.category)    parts.push(venue.category);

  // Styles
  if (venue.styles)      parts.push(...venue.styles);

  // Tags
  if (venue.tags)        parts.push(...venue.tags);

  // Capacity + pricing
  if (venue.capacity)    parts.push(String(venue.capacity));
  if (venue.priceLabel)  parts.push(venue.priceLabel);
  if (venue.priceFrom)   parts.push(venue.priceFrom);

  // Experiences — both raw kind values and human labels
  if (venue.experiences) {
    for (const exp of venue.experiences) {
      if (exp.label)  parts.push(exp.label);
      if (exp.kind) {
        parts.push(exp.kind);
        const label = EXPERIENCE_KIND_LABELS[exp.kind];
        if (label) parts.push(label);
      }
    }
  }

  // Catering — raw values and human labels
  if (venue.catering) {
    const cat = venue.catering;
    if (cat.styles) {
      for (const s of cat.styles) {
        parts.push(s);
        const label = DINING_STYLE_LABELS[s];
        if (label) parts.push(label);
      }
    }
    if (cat.dietary) {
      for (const d of cat.dietary) {
        parts.push(d);
        const label = DIETARY_OPTION_LABELS[d];
        if (label) parts.push(label);
      }
    }
  }

  // Airports — names and IATA codes
  if (venue.access?.airports) {
    for (const ap of venue.access.airports) {
      if (ap.name) parts.push(ap.name);
      if (ap.code) parts.push(ap.code);
    }
  }

  // Spaces — names and capacities
  if (venue.spaces) {
    for (const sp of venue.spaces) {
      if (sp.name) parts.push(sp.name);
      if (sp.capacity) parts.push(String(sp.capacity));
    }
  }

  // Includes
  if (venue.includes) parts.push(...venue.includes);

  // Specialties (vendors)
  if (venue.specialties) parts.push(...venue.specialties);

  return parts.join(" ").toLowerCase();
}
