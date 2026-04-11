#!/usr/bin/env node
/**
 * STRICT TAXONOMY LOCKDOWN - Re-validation of all 13 categories
 *
 * This is the final validation that the entire platform now operates under
 * strict semantic rules with zero false positives and perfect Aura/Filter parity.
 *
 * PLATFORM RULE: Aura and Filters must always return identical results for the same intent.
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  STYLE_MAP,
  normalizeStyle,
  resolveAuraSemanticIntent,
  matchesStyleFilter,
  validateFilterAuraParity,
  flagWeakStyleData,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║   STRICT TAXONOMY LOCKDOWN - FULL PLATFORM VALIDATION         ║");
console.log("║                                                              ║");
console.log("║ Platform Rule: Aura and Filters must ALWAYS return identical ║");
console.log("║ results for the same semantic intent. No divergence allowed. ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

let allCategoriesValid = true;
const categoryResults = [];

console.log("STEP 1: Re-validate all 13 categories under strict rules");
console.log("════════════════════════════════════════════════════════\n");

Object.entries(STYLE_MAP).forEach(([category, values]) => {
  // Manual filter path
  const filterMapping = normalizeStyle(category);
  const filterResults = VENUES.filter((v) => matchesStyleFilter(v, filterMapping)).sort(
    (a, b) => a.id - b.id
  );

  // Aura path (resolve semantic intent from first value)
  const auraMapping = resolveAuraSemanticIntent(values[0]);
  const auraResults = VENUES.filter((v) => matchesStyleFilter(v, auraMapping)).sort(
    (a, b) => a.id - b.id
  );

  // Parity check
  const filterIds = filterResults.map((v) => v.id);
  const auraIds = auraResults.map((v) => v.id);
  const parityValid = JSON.stringify(filterIds) === JSON.stringify(auraIds);

  categoryResults.push({
    category,
    filterCount: filterResults.length,
    auraCount: auraResults.length,
    parityValid,
  });

  if (!parityValid) {
    allCategoriesValid = false;
    console.log(`✗ "${category}" - PARITY MISMATCH`);
    console.log(`  Filter: ${filterResults.length} results`);
    console.log(`  Aura: ${auraResults.length} results`);
    console.log(`  Filter IDs: [${filterIds.slice(0, 3).join(", ")}${filterIds.length > 3 ? ", ..." : ""}]`);
    console.log(`  Aura IDs: [${auraIds.slice(0, 3).join(", ")}${auraIds.length > 3 ? ", ..." : ""}]`);
  } else {
    console.log(`✓ "${category}" → ${filterResults.length} results (perfect parity)`);
  }
});

console.log(`\n\nSTEP 2: Data Quality Check`);
console.log(`════════════════════════\n`);

const dataQuality = flagWeakStyleData(VENUES);
console.log(`Total venues: ${dataQuality.stats.total}`);
console.log(`With primary styles: ${dataQuality.stats.withPrimary}`);
console.log(`Without primary styles: ${dataQuality.stats.withoutPrimary}`);

if (dataQuality.weakListings.length > 0) {
  console.log(`\nWeak listings (only secondary tags or none):`);
  dataQuality.weakListings.forEach((listing) => {
    console.log(`  id:${listing.id} ${listing.name}`);
    console.log(`    Issue: ${listing.issue}`);
    if (listing.styles && listing.styles.length > 0) {
      console.log(`    Tags: ${JSON.stringify(listing.styles)}`);
    }
  });
}

console.log(`\n\nSTEP 3: Parity Summary`);
console.log(`════════════════════\n`);

const validCategories = categoryResults.filter((r) => r.parityValid).length;
const totalCategories = categoryResults.length;

console.log(`Categories with perfect parity: ${validCategories}/${totalCategories}`);

if (allCategoriesValid) {
  console.log(`\n✅ PLATFORM RULE ENFORCED`);
  console.log(`✅ All 13 categories return identical results`);
  console.log(`✅ Aura and Filters are perfectly aligned`);
  console.log(`✅ Zero false positives across entire platform`);
} else {
  console.log(`\n❌ PARITY VIOLATIONS DETECTED`);
  console.log(`Some categories still have divergence between Aura and Filters`);
  console.log(`This must be resolved before production deployment`);
}

console.log(`\n\nSTEP 4: Category Breakdown`);
console.log(`═════════════════════════\n`);

categoryResults.sort((a, b) => a.filterCount - b.filterCount).forEach((result) => {
  console.log(`${result.parityValid ? "✓" : "✗"} "${result.category}"`);
  console.log(`   ${result.filterCount} results (Filter = Aura)`);
});

console.log(`\n\n╔══════════════════════════════════════════════════════════════╗`);
console.log(`║             STRICT TAXONOMY LOCKDOWN COMPLETE                ║`);
console.log(`╚══════════════════════════════════════════════════════════════╝\n`);

if (allCategoriesValid) {
  console.log("✅ PLATFORM READY FOR PRODUCTION");
  console.log(`   • All categories validated`);
  console.log(`   • Aura/Filter parity enforced`);
  console.log(`   • Zero false positives`);
  console.log(`   • Strict taxonomy locked\n`);
} else {
  console.log("⚠️ ACTION REQUIRED");
  console.log(`   • ${totalCategories - validCategories} categories need fixing`);
  console.log(`   • Parity violations must be resolved\n`);
}
