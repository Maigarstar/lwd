// ─── src/engine/curatedIndex.js ───────────────────────────────────────────────
// Deterministic scoring engine for the LWD Curated Index.
// Pure JS — no React dependencies, no imports from src/data.
// Computes lwdScore from structured venue/vendor data using 5 weighted factors.
// Missing data excludes the factor entirely and redistributes weight.

import { EXPERIENCE_KIND_SET } from "./types.js";

// ── Base Weights (sum = 100) ─────────────────────────────────────────────────
const BASE_WEIGHTS = Object.freeze({
  presentation:    40,
  experienceDepth: 20,
  responsiveness:  15,
  cateringQuality: 15,
  completeness:    10,
});

// ── Human-readable labels for each factor ────────────────────────────────────
export const FACTOR_LABELS = Object.freeze({
  presentation:    "Presentation Quality",
  experienceDepth: "Guest Experience",
  responsiveness:  "Response Performance",
  cateringQuality: "Catering Quality",
  completeness:    "Profile Completeness",
});

// ── Helper: parse flat "response" string into hours ──────────────────────────
// "< 2 hrs" → 2, "Same Day" → 1, "Within 4 hours" → 4, "30 mins" → 0.5
function parseResponseString(str) {
  if (!str || typeof str !== "string") return null;
  const s = str.toLowerCase().trim();

  if (s === "same day" || s === "same-day") return 1;

  // Match minutes: "30 mins", "45 minutes", "< 30 mins"
  const minMatch = s.match(/<?\.?\s*(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10) / 60;

  // Match hours: "< 2 hrs", "within 4 hours", "2 hours"
  const hrMatch = s.match(/<?\.?\s*(\d+)\s*h(?:ou)?rs?/i);
  if (hrMatch) return parseInt(hrMatch[1], 10);

  // Match bare number: "2" (assume hours)
  const bareMatch = s.match(/^<?\.?\s*(\d+)\s*$/);
  if (bareMatch) return parseInt(bareMatch[1], 10);

  return null;
}

// ── Factor A: Presentation (0–10) — always available ─────────────────────────
function scorePresentation(venue) {
  const imageCount = venue.gallery?.length || venue.imgs?.length || 0;
  const videoCount = venue.videos?.length || 0;
  const descriptionLength = (venue.desc || venue.description || "").length;

  const imageScore       = Math.min(imageCount / 20, 1);
  const videoBonus       = videoCount > 0 ? 0.1 : 0;
  const descriptionScore = Math.min(descriptionLength / 1500, 1);

  const raw = (imageScore * 0.5) + (descriptionScore * 0.4) + videoBonus;
  return { score: Math.min(raw, 1) * 10, available: true };
}

// ── Factor B: Experience Depth (0–10) — excluded if no experiences[] ─────────
function scoreExperienceDepth(venue) {
  const experiences = venue.experiences || [];
  if (experiences.length === 0) return { score: 0, available: false };

  // Distinct kinds from ALL experiences — order-independent, cap at 12
  const distinctKinds = new Set(
    experiences.map((e) => e.kind).filter((k) => EXPERIENCE_KIND_SET.has(k))
  );
  const variety = Math.min(distinctKinds.size, 12) / 12;

  let bonus = 0;
  if (experiences.filter((e) => e.isIncluded).length >= 2) bonus += 0.1;
  if (
    experiences.some((e) => e.category === "estate") &&
    experiences.some((e) => e.category === "nearby")
  ) bonus += 0.1;

  return { score: Math.min(variety + bonus, 1) * 10, available: true };
}

// ── Factor C: Responsiveness (0–10) — excluded if either metric missing ──────
function scoreResponsiveness(venue) {
  const metrics     = venue.contact?.responseMetrics;
  const responseStr = venue.response; // fallback for flat data

  let ratePercent = metrics?.responseRatePercent ?? null;
  let hours       = metrics?.averageResponseHours ?? parseResponseString(responseStr) ?? null;

  // Clamp values to sane ranges
  if (ratePercent != null) ratePercent = Math.max(0, Math.min(ratePercent, 100));
  if (hours != null)       hours       = Math.max(0, Math.min(hours, 720)); // cap at 30 days

  if (ratePercent == null || hours == null) return { score: 0, available: false };

  const rateScore = ratePercent / 100;
  const timeScore = 1 - Math.min(hours / 48, 1);

  return { score: ((rateScore * 0.6) + (timeScore * 0.4)) * 10, available: true };
}

// ── Factor D: Catering Quality (0–10) — excluded if no catering object ───────
function scoreCateringQuality(venue) {
  const cat = venue.catering;
  if (!cat) return { score: 0, available: false };

  let raw = 0;
  if (cat.inHouse === true || cat.inHouse?.available === true)                      raw += 0.3;
  if (cat.externalCaterersAllowed === true)                                          raw += 0.2;
  if (cat.sommelierService === true || cat.sommelierService?.available === true)      raw += 0.2;
  if ((cat.sommelierService?.wineCellarLabelsCount || 0) > 200)                      raw += 0.1;
  if ((cat.styles?.length || 0) >= 3)                                                raw += 0.2;

  return { score: Math.min(raw, 1) * 10, available: true };
}

// ── Factor E: Completeness (0–10) — always available ─────────────────────────
function scoreCompleteness(venue) {
  const sections = [
    !!(venue.contact || venue.phone || venue.email),      // contact present
    (venue.access?.airports?.length || 0) > 0,            // access data
    (venue.experiences?.length || 0) > 0,                  // experiences
    !!venue.catering,                                      // catering data
  ];

  return { score: (sections.filter(Boolean).length / sections.length) * 10, available: true };
}

// ── Main: computeCuratedIndex(venue) ─────────────────────────────────────────
/**
 * Compute the LWD Curated Index for a venue or vendor entity.
 * @param {Object} venue — venue or vendor data object
 * @returns {CuratedIndexResult}
 */
export function computeCuratedIndex(venue) {
  // 1. Score all 5 factors
  const factors = {
    presentation:    scorePresentation(venue),
    experienceDepth: scoreExperienceDepth(venue),
    responsiveness:  scoreResponsiveness(venue),
    cateringQuality: scoreCateringQuality(venue),
    completeness:    scoreCompleteness(venue),
  };

  // 2. Redistribute excluded weights proportionally
  const sumActiveBase = Object.keys(factors).reduce((sum, key) => {
    return factors[key].available ? sum + BASE_WEIGHTS[key] : sum;
  }, 0);

  const weights = {};
  for (const key of Object.keys(BASE_WEIGHTS)) {
    weights[key] = factors[key].available
      ? (BASE_WEIGHTS[key] / sumActiveBase) * 100
      : 0;
  }

  // 3. Compute weighted total
  let totalWeighted    = 0;
  let totalEffWeight   = 0;

  for (const key of Object.keys(factors)) {
    if (!factors[key].available) continue;
    const w = weights[key];
    totalWeighted  += (factors[key].score / 10) * w;
    totalEffWeight += w;
  }

  // Guard: if no factors available (shouldn't happen — presentation + completeness always are)
  const lwdScore10  = totalEffWeight > 0
    ? Math.round((totalWeighted / totalEffWeight) * 10 * 10) / 10  // one decimal
    : 0;
  const lwdScore100 = Math.round(lwdScore10 * 10);

  // 4. Breakdown — 0–10 per factor, null if excluded
  const breakdown = {};
  for (const key of Object.keys(factors)) {
    breakdown[key] = factors[key].available
      ? Math.round(factors[key].score * 10) / 10  // one decimal, 0–10
      : null;
  }

  // 5. Confidence
  const experienceCount = venue.experiences?.length || 0;
  let confidence = "low";
  if (
    (breakdown.completeness ?? 0) >= 8 &&
    (breakdown.presentation ?? 0) >= 7 &&
    experienceCount >= 5
  ) {
    confidence = "high";
  } else if ((breakdown.completeness ?? 0) >= 6) {
    confidence = "medium";
  }

  return { lwdScore10, lwdScore100, confidence, breakdown, weights };
}

// ── hydrateScores(items) — attach _curatedIndex to every item ────────────────
/**
 * Compute and attach _curatedIndex to each item. Only overrides item.lwdScore
 * when confidence is "high" OR item.forceComputedScore is true.
 * Idempotent: skips items that already have _curatedIndex.
 * @param {Object[]} items
 */
export function hydrateScores(items) {
  for (const item of items) {
    if (item._curatedIndex) continue; // idempotent — use continue, not return

    const result = computeCuratedIndex(item);
    item._curatedIndex = result;

    // Only override item.lwdScore for high-confidence or explicitly opted-in entities
    if (result.confidence === "high" || item.forceComputedScore === true) {
      item.lwdScore = result.lwdScore100;
    }
    // Low/medium confidence: existing hardcoded lwdScore preserved
  }
}
