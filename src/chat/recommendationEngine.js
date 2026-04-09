// ─── src/chat/recommendationEngine.js ─────────────────────────────────────────
import { VENUES } from "../data/italyVenues";
import { VENDORS } from "../data/vendors";
import { rankByCuratedIndex } from "../engine/index.js";
import { getArticleRecommendationsForIntent } from "../services/recommendationEngine";
import { transformListingForCard } from "../services/listings";

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
  if (!messages || messages.length === 0) {
    return { items: rankByCuratedIndex([...VENUES]).slice(0, 4), summary: "Popular venues in Italy", intent: {} };
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
    venueResults = rankByCuratedIndex(VENUES.filter((v) => {
      if (effectiveRegion && v.region !== effectiveRegion) return false;
      if (style && !v.styles.includes(style)) return false;
      if (maxCapacity && v.capacity > maxCapacity * 1.5) return false;
      return true;
    })).slice(0, limit);

    // fallback: drop region constraint
    if (venueResults.length === 0) {
      venueResults = rankByCuratedIndex(VENUES.filter((v) => {
        if (style && !v.styles.includes(style)) return false;
        if (maxCapacity && v.capacity > maxCapacity * 1.5) return false;
        return true;
      })).slice(0, limit);
    }

    // final fallback
    if (venueResults.length === 0) venueResults = rankByCuratedIndex([...VENUES]).slice(0, limit);
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

  // ── Master pipeline: normalise all items through shared transform ──
  return { items: items.map(transformListingForCard), summary, intent };
}

/**
 * Load article recommendations asynchronously based on chat intent.
 * Called separately from getRecommendations to avoid blocking sync rendering.
 *
 * @async
 * @param {Array} messages — chat messages
 * @returns {Promise} { articles: [], error: null }
 */
export async function loadArticleRecommendations(messages) {
  try {
    if (!messages || messages.length < 2) {
      return { articles: [], error: null };
    }

    const intent = extractIntent(messages);
    const { region, vendorCategory, style } = intent;

    // Build article search intent from chat context
    const articleIntent = {};

    // Map vendor categories to article topics
    const VENDOR_TO_ARTICLE = {
      photographer: "photography",
      planner: "planning",
      florist: "style",
      caterer: "style",
      musician: "style",
      celebrant: "style",
    };

    // Map regions to destination articles
    const REGION_TO_SLUG = {
      "Tuscany": "tuscany",
      "Campania": "amalfi-coast",
      "Lombardy": "lake-como",
      "Sicily": "sicily",
      "Veneto": "venice",
      "Lazio": "rome",
      "Puglia": "puglia",
    };

    if (vendorCategory && VENDOR_TO_ARTICLE[vendorCategory]) {
      articleIntent.articleCategory = VENDOR_TO_ARTICLE[vendorCategory];
    } else if (style) {
      articleIntent.articleCategory = "style";
    } else if (region && REGION_TO_SLUG[region]) {
      articleIntent.articleCategory = "destinations";
      articleIntent.tags = [REGION_TO_SLUG[region]];
    }

    // Only fetch articles if we detected a relevant intent
    if (!articleIntent.articleCategory) {
      return { articles: [], error: null };
    }

    articleIntent.maxResults = 3;
    const { articles, error } = await getArticleRecommendationsForIntent(articleIntent);

    return { articles, error };
  } catch (err) {
    console.error('[chat/recommendationEngine] loadArticleRecommendations:', err);
    return { articles: [], error: err };
  }
}
