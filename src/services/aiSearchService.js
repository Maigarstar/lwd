// ─── src/services/aiSearchService.js ─────────────────────────────────────────
// Calls the parse-venue-query edge function to convert a natural language
// query into structured filter dimensions.
//
// Two-phase search:
//   Phase 1 — clientParse()    instant keyword match, < 1ms
//   Phase 2 — parseVenueQuery() AI edge function, 1–3s, refines Phase 1
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "../lib/supabaseClient";

// ── In-memory query cache (session-scoped) ────────────────────────────────────
const _queryCache = {};

// ── Client-side fast parser ───────────────────────────────────────────────────
// Runs instantly on submit — results appear before the AI call returns.
const _STYLE_KW = {
  "Romantic":    ["romantic", "intimate", "love", "dreamy"],
  "Historic":    ["historic", "castle", "palazzo", "manor", "heritage", "ancient", "medieval"],
  "Rustic Luxe": ["rustic", "barn", "countryside", "farmhouse", "vineyard", "winery"],
  "Coastal":     ["coastal", "beach", "sea", "ocean", "lake", "waterfront", "island"],
  "Contemporary":["modern", "contemporary", "minimalist", "sleek"],
  "Intimate":    ["small", "micro", "elopement", "just us", "private"],
};

const _CAP_PATTERNS = [
  { re: /(\d+)\s*(?:\+)?\s*(?:guests?|people|persons?|pax)/i },
  { re: /up\s+to\s+(\d+)/i },
  { re: /for\s+(\d+)/i },
];

function _capacityBand(n) {
  if (n <= 50)  return "Up to 50";
  if (n <= 100) return "51–100";
  if (n <= 150) return "101–150";
  if (n <= 200) return "151–200";
  return "200+";
}

const _PRICE_KW = {
  "££££": ["ultra luxury", "no budget", "money no object", "most exclusive", "elite"],
  "£££":  ["luxury", "premium", "high-end", "exclusive", "fine dining", "5 star"],
  "££":   ["mid-range", "moderate", "reasonable", "mid range"],
  "£":    ["budget", "affordable", "cheap", "economical", "low cost"],
};

/**
 * Instant client-side keyword parse. Returns null if nothing found.
 * Shape matches parseVenueQuery response so applyParsed() works with both.
 */
export function clientParse(query, availableRegions = []) {
  const q = query.toLowerCase();
  const result = { region: null, style: null, capacity: null, price: null, services: null, summary: "" };

  // Region — match against available regions (name or slug)
  for (const r of availableRegions) {
    const name = (r.name || "").toLowerCase();
    const slug = (r.slug || "").toLowerCase();
    if (name && q.includes(name)) { result.region = r.slug; break; }
    if (slug && q.includes(slug)) { result.region = r.slug; break; }
  }

  // Style
  for (const [style, kws] of Object.entries(_STYLE_KW)) {
    if (kws.some((k) => q.includes(k))) { result.style = style; break; }
  }

  // Capacity
  for (const { re } of _CAP_PATTERNS) {
    const m = q.match(re);
    if (m) { result.capacity = _capacityBand(parseInt(m[1], 10)); break; }
  }

  // Price
  for (const [tier, kws] of Object.entries(_PRICE_KW)) {
    if (kws.some((k) => q.includes(k))) { result.price = tier; break; }
  }

  const hasResult = result.region || result.style || result.capacity || result.price;
  if (!hasResult) return null;

  // Quick summary
  const parts = [];
  if (result.style)    parts.push(result.style.toLowerCase());
  if (result.capacity) parts.push(`${result.capacity} guests`);
  if (result.price)    parts.push(result.price);
  result.summary = parts.length > 0 ? `Showing ${parts.join(", ")}` : "";

  return result;
}

/**
 * Parse a natural language venue search query into structured filters.
 *
 * @param {object} params
 * @param {string} params.query            — e.g. "romantic château Loire Valley 80 guests"
 * @param {string} params.countrySlug      — e.g. "france"
 * @param {string} params.countryName      — e.g. "France"
 * @param {string} [params.regionSlug]     — e.g. "london" — scopes search to a region
 * @param {string} [params.regionName]     — e.g. "London"
 * @param {string} [params.categorySlug]   — e.g. "wedding-venues" — scopes to category
 * @param {string} [params.entityType]     — e.g. "venue" | "vendor"
 * @param {Array}  params.availableRegions — [{name, slug}] for the current context (districts/sub-regions)
 *
 * @returns {Promise<{
 *   region:   string|null,
 *   style:    string|null,
 *   capacity: string|null,
 *   price:    string|null,
 *   services: string|null,
 *   summary:  string,
 * }>}
 */
export async function parseVenueQuery({ query, countrySlug, countryName, regionSlug, regionName, categorySlug, entityType, availableRegions = [] }) {
  if (!query || query.trim().length < 3) {
    throw new Error("Query too short");
  }

  // Check in-memory cache (session-scoped, keyed by query + context)
  const cacheKey = `${query.trim()}|${countrySlug}|${regionSlug || ""}|${categorySlug || ""}`;
  if (_queryCache[cacheKey]) return _queryCache[cacheKey];

  const { data, error } = await supabase.functions.invoke("parse-venue-query", {
    body: {
      query:            query.trim(),
      countrySlug,
      countryName,
      regionSlug:       regionSlug || null,
      regionName:       regionName || null,
      categorySlug:     categorySlug || null,
      entityType:       entityType || null,
      availableRegions,
    },
  });

  if (error) throw new Error(error.message || "AI search failed");

  if (data?.status === "not_configured") {
    throw new Error("not_configured");
  }

  if (data?.status === "parse_failed" || data?.status === "error") {
    throw new Error(data.error || "AI search failed");
  }

  const result = {
    region:   data.region   || null,
    style:    data.style    || null,
    capacity: data.capacity || null,
    price:    data.price    || null,
    services: data.services || null,
    summary:  data.summary  || "",
  };

  _queryCache[cacheKey] = result;
  return result;
}
