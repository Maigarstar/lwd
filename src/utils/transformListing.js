// src/utils/transformListing.js
// ─────────────────────────────────────────────────────────────────────────────
// Platform-standard listing transformer.
// Takes a raw DB row (Supabase) or static data entry and returns a normalised
// card-ready object. All pages must use this — no page-specific transform logic.
//
// Output shape:
// {
//   id, name, slug,
//   region, regionSlug, countrySlug, city, citySlug,
//   imgs[],
//   desc,
//   priceFrom,      ← formatted display string e.g. "£12,000"
//   priceFromRaw,   ← raw number for filtering/sorting, null if unknown
//   capacity,       ← number or null
//   rating,         ← number or null
//   reviews,        ← number or null
//   verified,       ← boolean
//   featured,       ← boolean
//   lwdScore,       ← number or null
//   tag,            ← string badge or null
//   styles[],       ← array of style strings
//   includes[],     ← array of inclusion/amenity strings
//   showcaseUrl,    ← string or null
//   lat, lng,       ← numbers or null
//   online,         ← boolean
//   type,           ← "venue" | "vendor" | "planner"
//   category,       ← category slug e.g. "wedding-venues" | "photographers"
//   createdAt,      ← timestamp or null
// }
// ─────────────────────────────────────────────────────────────────────────────

// ── Currency formatter ────────────────────────────────────────────────────────
function formatPrice(raw, currency = "GBP") {
  if (!raw) return "";
  if (typeof raw === "string" && (raw.includes("£") || raw.includes("€") || raw.includes("$"))) return raw;
  const num = parseInt(raw, 10);
  if (isNaN(num)) return String(raw);
  const sym = currency === "EUR" ? "€" : currency === "USD" ? "$" : "£";
  return `${sym}${num.toLocaleString("en-GB")}`;
}

// ── Image array normaliser ────────────────────────────────────────────────────
function normaliseImgs(l) {
  if (Array.isArray(l.imgs) && l.imgs.length > 0) {
    return l.imgs
      .map((img) => (typeof img === "string" ? img : img?.src || img?.url || ""))
      .filter(Boolean);
  }
  if (l.heroImage) return [l.heroImage];
  if (l.image)     return [l.image];
  if (l.img)       return [l.img];
  return [];
}

// ── Main transformer ──────────────────────────────────────────────────────────
export function transformListing(l, overrides = {}) {
  const currency = l.priceCurrency || "GBP";
  const priceRaw = l.priceFrom != null ? parseInt(l.priceFrom, 10) : null;

  return {
    // Identity
    id:          l.id          ?? null,
    name:        l.cardTitle   || l.name        || "",
    slug:        l.slug        || "",

    // Location
    region:      l.region      || "",
    regionSlug:  l.regionSlug  || l.region_slug || "",
    countrySlug: l.countrySlug || l.country_slug || "",
    city:        l.city        || "",
    citySlug:    l.citySlug    || l.city_slug   || "",

    // Media
    imgs:        normaliseImgs(l),

    // Description
    desc:        l.cardSummary || l.shortDescription || l.desc || "",

    // Pricing
    priceFrom:   formatPrice(l.priceFrom, currency),
    priceFromRaw: isNaN(priceRaw) ? null : priceRaw,

    // Specs
    capacity:    l.capacityMax  ?? l.capacityMin ?? l.capacity ?? null,

    // Editorial
    rating:      l.rating       ?? null,
    reviews:     l.reviewCount  ?? l.reviews     ?? null,
    verified:    l.isVerified   ?? l.verified    ?? false,
    featured:    l.isFeatured   ?? l.featured    ?? false,
    lwdScore:    l.lwdScore     ?? null,
    tag:         l.cardBadge    || l.tag          || null,

    // Taxonomy
    styles:      Array.isArray(l.styles)    ? l.styles    : [],
    includes:    Array.isArray(l.amenities) ? l.amenities :
                 Array.isArray(l.includes)  ? l.includes  : [],

    // Showcase
    showcaseUrl: l.showcaseEnabled && l.slug ? `/showcase/${l.slug}` : null,

    // Geo
    lat:         l.lat          ?? null,
    lng:         l.lng          ?? null,

    // Meta
    online:      l.online       ?? true,
    type:        l.type         || "venue",
    category:    l.category     || l.categorySlug || "wedding-venues",
    createdAt:   l.createdAt    ?? l.created_at ?? null,

    // Allow page-specific fields to be merged in without custom transforms
    ...overrides,
  };
}

// ── Batch transform ───────────────────────────────────────────────────────────
export function transformListings(rows = [], overrides = {}) {
  return rows.map((l) => transformListing(l, overrides));
}

// ── Deduplicate by name (DB first, static second) ────────────────────────────
// Used when merging DB listings with static data fallback.
export function mergeListings(dbRows, staticRows) {
  const dbNames = new Set(dbRows.map((v) => v.name?.toLowerCase()).filter(Boolean));
  const uniqueStatic = staticRows.filter((v) => !dbNames.has((v.name || "").toLowerCase()));
  return [...dbRows, ...uniqueStatic];
}
