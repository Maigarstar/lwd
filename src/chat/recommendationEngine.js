// ─── src/chat/recommendationEngine.js ─────────────────────────────────────────
import { VENUES } from "../data/italyVenues";
import { VENDORS } from "../data/vendors";
import { rankByCuratedIndex } from "../engine/index.js";
import { isEditorialCurationEnabled } from "../services/platformSettingsService";

// ── Intent maps ───────────────────────────────────────────────────────────────
const REGION_MAP = {
  "tuscany":    "Tuscany",
  "tuscan":     "Tuscany",
  "florence":   "Tuscany",
  "siena":      "Tuscany",
  "chianti":    "Tuscany",
  "amalfi":     "Campania",
  "campania":   "Campania",
  "positano":   "Campania",
  "ravello":    "Campania",
  "naples":     "Campania",
  "lake como":  "Lombardy",
  "bellagio":   "Lombardy",
  "milan":      "Lombardy",
  "lombardy":   "Lombardy",
  "como":       "Lombardy",
  "sicily":     "Sicily",
  "taormina":   "Sicily",
  "palermo":    "Sicily",
  "venice":     "Veneto",
  "veneto":     "Veneto",
  "rome":       "Lazio",
  "lazio":      "Lazio",
  "puglia":     "Puglia",
  "apulia":     "Puglia",
};

const VENDOR_KW = {
  planner:      ["planner", "planning", "coordinator", "coordinate", "organise", "organize", "full service", "event management"],
  photographer: ["photographer", "photography", "photo", "photos", "shoot", "pictures", "videographer", "video", "film"],
  florist:      ["florist", "flowers", "floral", "blooms", "bouquet", "arrangement", "botanicals"],
  caterer:      ["caterer", "catering", "food", "menu", "chef", "cuisine", "dining", "canapés"],
  musician:     ["musician", "music", "band", "quartet", "string", "dj", "entertainment", "orchestra"],
  celebrant:    ["celebrant", "officiant", "ceremony leader", "vows", "bilingual", "officiate"],
};

const STYLE_KW = {
  Romantic:  ["romantic", "romance", "intimate", "love"],
  Rustic:    ["rustic", "barn", "country", "farm"],
  Modern:    ["modern", "contemporary", "minimal"],
  Historic:  ["historic", "castle", "palazzo"],
  Garden:    ["garden", "outdoor", "floral", "bloom"],
  Coastal:   ["coastal", "beach", "sea", "cliff", "ocean"],
};

const CAP_MAP = {
  small: 50, tiny: 30, intimate: 40, micro: 20,
  medium: 100, mid: 100,
  large: 200, big: 200, grand: 250,
};

const CAP_REGEX = /\b(\d+)\s*(?:guests?|people|persons?|pax)\b/i;

// ── Editorial Boost Calculation ───────────────────────────────────────────────
/**
 * Calculates editorial boost multiplier based on:
 * 1. editorial_approved (30pt boost)
 * 2. editorial_fact_checked (20pt boost)
 * 3. contentQualityScore (0-40pt based on quality)
 * 4. editorial_last_reviewed_at recency (0-10pt for freshness)
 * Returns a multiplier: 1.0 (no boost) to 1.5 (maximum boost for platinum approved venues)
 */
function calculateEditorialBoost(venue) {
  let boostPoints = 0;
  const maxPoints = 100;

  // Priority 1: editorial_enabled check (venues with editorial_enabled=false get no boost)
  if (venue.editorial_enabled === false) {
    return 1.0;
  }

  // Priority 2: editorial_approved status (30pt)
  if (venue.editorial_approved === true) {
    boostPoints += 30;
  }

  // Priority 3: editorial_fact_checked status (20pt)
  if (venue.editorial_fact_checked === true) {
    boostPoints += 20;
  }

  // Priority 4: contentQualityScore (0-40pt)
  // Map score 0-100 to 0-40 points
  const qualityScore = venue.contentQualityScore || 0;
  const qualityPoints = (qualityScore / 100) * 40;
  boostPoints += qualityPoints;

  // Priority 5: Freshness - recency of editorial review (0-10pt)
  if (venue.editorial_last_reviewed_at) {
    const reviewDate = new Date(venue.editorial_last_reviewed_at);
    const now = new Date();
    const daysSinceReview = (now - reviewDate) / (1000 * 60 * 60 * 24);

    // 0-90 days: full 10 points
    // 91-180 days: 5 points
    // 180+ days: 0 points
    if (daysSinceReview <= 90) {
      boostPoints += 10;
    } else if (daysSinceReview <= 180) {
      boostPoints += 5;
    }
  }

  // Convert points (0-100) to multiplier (1.0-1.5)
  // 0 points = 1.0x multiplier (no boost)
  // 100 points = 1.5x multiplier (maximum boost)
  const multiplier = 1.0 + (boostPoints / maxPoints) * 0.5;
  return Math.min(multiplier, 1.5);
}

// ── Extract intent from last N user messages ──────────────────────────────────
export function extractIntent(messages) {
  const userMsgs = messages
    .filter((m) => m.from === "user")
    .slice(-6)
    .map((m) => m.text.toLowerCase())
    .join(" ");

  // region
  let region = null;
  for (const [kw, reg] of Object.entries(REGION_MAP)) {
    if (userMsgs.includes(kw)) { region = reg; break; }
  }

  // vendor category (highest scoring wins)
  let vendorCategory = null;
  let vendorScore    = 0;
  for (const [cat, kws] of Object.entries(VENDOR_KW)) {
    const score = kws.filter((k) => userMsgs.includes(k)).length;
    if (score > vendorScore) { vendorScore = score; vendorCategory = cat; }
  }

  // style
  let style = null;
  for (const [s, kws] of Object.entries(STYLE_KW)) {
    if (kws.some((k) => userMsgs.includes(k))) { style = s; break; }
  }

  // capacity
  let maxCapacity = null;
  const capMatch = userMsgs.match(CAP_REGEX);
  if (capMatch) {
    maxCapacity = parseInt(capMatch[1], 10);
  } else {
    for (const [word, cap] of Object.entries(CAP_MAP)) {
      if (userMsgs.includes(word)) { maxCapacity = cap; break; }
    }
  }

  // result type
  const hasVenueKw  = /\b(venue|villa|castle|palazzo|estate|location|place|property)\b/i.test(userMsgs);
  const hasVendorKw = vendorScore > 0;
  let resultType = "venue";
  if (hasVendorKw && !hasVenueKw) resultType = "vendor";
  else if (hasVendorKw && hasVenueKw) resultType = "mixed";

  return { region, vendorCategory, style, maxCapacity, resultType };
}

// ── Build curated recommendation list ────────────────────────────────────────
export function getRecommendations(messages, activeContext) {
  const editorialEnabled = isEditorialCurationEnabled();

  if (!messages || messages.length === 0) {
    let defaultVenues;

    if (editorialEnabled) {
      // Apply editorial boost when feature is enabled
      VENUES.forEach((venue) => {
        const boost = calculateEditorialBoost(venue);
        if (boost > 1.0) {
          venue._editorialBoost = boost;
        }
      });
      defaultVenues = rankByCuratedIndex([...VENUES]).slice(0, 4);
      // Mark top recommendations with aura_recommended flag (system-driven)
      defaultVenues.forEach((v, idx) => {
        if (idx < 3) v.aura_recommended = true;
      });
    } else {
      // Use standard ranking without editorial boost
      defaultVenues = rankByCuratedIndex([...VENUES]).slice(0, 4);
    }

    return { items: defaultVenues, summary: "Popular venues in Italy", intent: {} };
  }

  const intent = extractIntent(messages);
  const { region, vendorCategory, style, maxCapacity, resultType } = intent;

  // active context region as fallback
  const effectiveRegion = region || (activeContext?.region ?? null);

  let venueResults  = [];
  let vendorResults = [];

  // ── Venues ──
  if (resultType === "venue" || resultType === "mixed") {
    const limit = resultType === "mixed" ? 3 : 6;
    const editorialEnabled = isEditorialCurationEnabled();

    // Filter venues by criteria
    let filteredVenues = VENUES.filter((v) => {
      if (effectiveRegion && v.region !== effectiveRegion) return false;
      if (style && !v.styles.includes(style)) return false;
      if (maxCapacity && v.capacity > maxCapacity * 1.5) return false;
      return true;
    });

    // If no results, try dropping region constraint
    if (filteredVenues.length === 0) {
      filteredVenues = VENUES.filter((v) => {
        if (style && !v.styles.includes(style)) return false;
        if (maxCapacity && v.capacity > maxCapacity * 1.5) return false;
        return true;
      });
    }

    // Final fallback: use all venues
    if (filteredVenues.length === 0) filteredVenues = [...VENUES];

    // Apply editorial boost to scores (only if global toggle enabled)
    if (editorialEnabled) {
      filteredVenues.forEach((venue) => {
        const boost = calculateEditorialBoost(venue);
        if (boost > 1.0) {
          // Apply boost to lwdScore (computed by rankByCuratedIndex)
          venue._editorialBoost = boost;
        }
      });
    }

    // Rank and sort
    venueResults = rankByCuratedIndex(filteredVenues).slice(0, limit);

    // Mark top recommendations with aura_recommended flag (system-driven, only if editorial enabled)
    if (editorialEnabled) {
      venueResults.forEach((v, idx) => {
        if (idx < 3) v.aura_recommended = true;
      });
    }
  }

  // ── Vendors ──
  if (resultType === "vendor" || resultType === "mixed") {
    const limit = resultType === "mixed" ? 3 : 6;
    vendorResults = rankByCuratedIndex(VENDORS.filter((v) => {
      if (vendorCategory && v.category !== vendorCategory) return false;
      if (effectiveRegion && v.region !== effectiveRegion) return false;
      return true;
    })).slice(0, limit);

    // fallback: drop region constraint
    if (vendorResults.length === 0 && vendorCategory) {
      vendorResults = rankByCuratedIndex(VENDORS.filter((v) => v.category === vendorCategory)).slice(0, limit);
    }
    if (vendorResults.length === 0) vendorResults = rankByCuratedIndex([...VENDORS]).slice(0, limit);
  }

  const items = [...venueResults, ...vendorResults];

  // ── Summary line ──
  let summary = "Curated for your search";
  if (vendorCategory && resultType !== "venue") {
    summary = `Top ${vendorCategory}s${effectiveRegion ? ` in ${effectiveRegion}` : " in Italy"}`;
  } else if (effectiveRegion) {
    summary = `Venues in ${effectiveRegion}`;
  } else if (style) {
    summary = `${style} wedding venues`;
  } else if (maxCapacity) {
    summary = `Venues for up to ${maxCapacity} guests`;
  }

  return { items, summary, intent };
}
