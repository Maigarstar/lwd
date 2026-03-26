// ─── src/services/aiSearchService.js ─────────────────────────────────────────
// Calls the parse-venue-query edge function to convert a natural language
// query into structured filter dimensions.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from "../lib/supabaseClient";

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

  return {
    region:   data.region   || null,
    style:    data.style    || null,
    capacity: data.capacity || null,
    price:    data.price    || null,
    services: data.services || null,
    summary:  data.summary  || "",
  };
}
