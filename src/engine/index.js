// ─── src/engine/index.js ──────────────────────────────────────────────────────
// Barrel re-export for the LWD scoring engine + query helpers.

export { computeCuratedIndex, FACTOR_LABELS, hydrateScores } from "./curatedIndex.js";

export {
  filterByAirportProximity,
  filterByExperienceKinds,
  filterByCatering,
  filterByResponseTime,
  rankByCuratedIndex,
  searchIndexVenue,
} from "./queryEngine.js";

export {
  EXPERIENCE_KINDS,
  EXPERIENCE_KIND_SET,
  EXPERIENCE_KIND_LABELS,
  DINING_STYLES,
  DINING_STYLE_LABELS,
  DIETARY_OPTIONS,
  DIETARY_OPTION_LABELS,
} from "./types.js";
