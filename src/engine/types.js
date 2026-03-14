// ─── src/engine/types.js ──────────────────────────────────────────────────────
// Canonical enums, label maps, and JSDoc type definitions for the LWD platform.
// Runtime exports (arrays, Sets, label objects) plus documentation-only typedefs.
// No React dependencies. No imports from src/data.

// ── Experience Kind ─────────────────────────────────────────────────────────
export const EXPERIENCE_KINDS = Object.freeze([
  "vineyard", "wine", "truffle", "cooking", "dining", "spa", "pool", "golf",
  "boat", "beach", "mountain", "museum", "culture", "tour", "helicopter",
  "airport", "car", "wellness", "nature", "hiking", "safari", "ski", "island", "rail",
]);
export const EXPERIENCE_KIND_SET = new Set(EXPERIENCE_KINDS);

export const EXPERIENCE_KIND_LABELS = Object.freeze({
  vineyard: "Vineyard", wine: "Wine", truffle: "Truffle", cooking: "Cooking",
  dining: "Dining", spa: "Spa", pool: "Pool", golf: "Golf", boat: "Boat",
  beach: "Beach", mountain: "Mountain", museum: "Museum", culture: "Culture",
  tour: "Tour", helicopter: "Helicopter", airport: "Airport", car: "Car",
  wellness: "Wellness", nature: "Nature", hiking: "Hiking", safari: "Safari",
  ski: "Ski", island: "Island", rail: "Rail",
});

// ── Dining Style ────────────────────────────────────────────────────────────
export const DINING_STYLES = Object.freeze([
  "fine_dining", "banquet", "family_style", "food_stations", "late_night_snacks",
]);
export const DINING_STYLE_LABELS = Object.freeze({
  fine_dining: "Fine dining", banquet: "Banquet", family_style: "Family style",
  food_stations: "Food stations", late_night_snacks: "Late-night snacks",
});

// ── Dietary Option ──────────────────────────────────────────────────────────
export const DIETARY_OPTIONS = Object.freeze([
  "vegan", "vegetarian", "halal", "kosher", "gluten_free",
]);
export const DIETARY_OPTION_LABELS = Object.freeze({
  vegan: "Vegan", vegetarian: "Vegetarian", halal: "Halal",
  kosher: "Kosher", gluten_free: "Gluten-free",
});

// ── JSDoc Type Definitions ──────────────────────────────────────────────────

/**
 * @typedef {"vineyard"|"wine"|"truffle"|"cooking"|"dining"|"spa"|"pool"|"golf"|"boat"|"beach"|"mountain"|"museum"|"culture"|"tour"|"helicopter"|"airport"|"car"|"wellness"|"nature"|"hiking"|"safari"|"ski"|"island"|"rail"} ExperienceKind
 */

/**
 * @typedef {Object} ExperienceItem
 * @property {string} id
 * @property {string} label
 * @property {"estate"|"nearby"} category
 * @property {ExperienceKind} kind
 * @property {number} [distanceMinutes]
 * @property {boolean} [isPrivate]
 * @property {boolean} [isIncluded]
 * @property {string} [season]
 */

/**
 * @typedef {Object} ContactAddress
 * @property {string} line1
 * @property {string} city
 * @property {string} region
 * @property {string} postcode
 * @property {string} country
 * @property {number} [latitude]
 * @property {number} [longitude]
 */

/**
 * @typedef {Object} ResponseMetrics
 * @property {number} averageResponseHours
 * @property {number} responseRatePercent, 0–100
 * @property {boolean} sameDayTypical
 */

/**
 * @typedef {Object} ContactModel
 * @property {ContactAddress} address
 * @property {string} [phone]
 * @property {string} [email]
 * @property {string} [website]
 * @property {ResponseMetrics} [responseMetrics]
 */

/**
 * @typedef {Object} AirportEntry
 * @property {string} code, IATA code
 * @property {string} name
 * @property {number} driveTimeMinutes
 * @property {number} [distanceKm]
 */

/**
 * @typedef {Object} AccessModel
 * @property {boolean} helicopterTransferAvailable
 * @property {number} [helicopterTransferMinutesFromAirport]
 * @property {AirportEntry[]} airports
 */

/**
 * @typedef {Object} CateringModel
 * @property {boolean|{available:boolean}} inHouse
 * @property {boolean} externalCaterersAllowed
 * @property {number} [corkageFeePerBottle]
 * @property {boolean|{available:boolean, wineCellarLabelsCount?:number}} [sommelierService]
 * @property {string[]} styles
 * @property {string[]} dietary
 */

/**
 * @typedef {Object} CuratedIndexBreakdown
 * @property {number|null} presentation, 0–10, null if excluded
 * @property {number|null} experienceDepth, 0–10, null if excluded
 * @property {number|null} responsiveness, 0–10, null if excluded
 * @property {number|null} cateringQuality, 0–10, null if excluded
 * @property {number|null} completeness, 0–10, null if excluded
 */

/**
 * @typedef {Object} CuratedIndexResult
 * @property {number} lwdScore10, 0–10, one decimal
 * @property {number} lwdScore100, 0–100 integer (UI compat)
 * @property {"low"|"medium"|"high"} confidence
 * @property {CuratedIndexBreakdown} breakdown
 * @property {Object<string,number>} weights, effective weights used
 */
