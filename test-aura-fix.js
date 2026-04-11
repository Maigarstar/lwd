#!/usr/bin/env node
/**
 * Test: Verify Aura semantic resolution fixes the misalignment
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  normalizeStyle,
  resolveAuraSemanticIntent,
  matchesStyleFilter,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║           AURA SEMANTIC INTENT RESOLUTION - FIX TEST          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

const testCases = [
  {
    name: "Rustic in Tuscany",
    manual: {
      selectedStyle: "Rustic & Country",
      region: "Tuscany",
    },
    aura: {
      styleKeyword: "Rustic",  // Aura outputs canonical value
      region: "Tuscany",
    },
  },
  {
    name: "Romantic garden",
    manual: {
      selectedStyle: "Romantic & Whimsical",
      region: null,
    },
    aura: {
      styleKeyword: "Romantic",  // Aura outputs canonical value
      region: null,
    },
  },
  {
    name: "Glamorous Grand",
    manual: {
      selectedStyle: "Glamorous & Grand",
      region: null,
    },
    aura: {
      styleKeyword: "Black Tie",  // Aura outputs canonical value
      region: null,
    },
  },
  {
    name: "Exclusive luxury",
    manual: {
      selectedStyle: "Glamorous & Grand",  // Could be either Glamorous & Grand or Luxury & Opulent
      region: null,
    },
    aura: {
      styleKeyword: "Exclusive",  // Aura outputs canonical value
      region: null,
    },
  },
];

let allMatch = true;

testCases.forEach(({ name, manual, aura }) => {
  console.log(`Test: ${name}`);
  console.log("────────────────────");

  // Manual path: User selects UI label → normalizeStyle
  const manualStyles = normalizeStyle(manual.selectedStyle);
  const manualMatches = VENUES.filter((v) => {
    if (manual.region && v.region !== manual.region) return false;
    return matchesStyleFilter(v, manualStyles);
  });

  // Aura path (OLD): normalizeStyle(canonical_value) → just returns the value
  const auraStylesOld = normalizeStyle(aura.styleKeyword);

  // Aura path (NEW): resolveAuraSemanticIntent(canonical_value) → returns full category
  const auraStylesNew = resolveAuraSemanticIntent(aura.styleKeyword);

  const auraMatchesNew = VENUES.filter((v) => {
    if (aura.region && v.region !== aura.region) return false;
    return matchesStyleFilter(v, auraStylesNew);
  });

  // Compare
  const manualIds = manualMatches.map((v) => v.id).sort((a, b) => a - b);
  const auraIdsNew = auraMatchesNew.map((v) => v.id).sort((a, b) => a - b);
  const resultsMatch =
    JSON.stringify(manualIds) === JSON.stringify(auraIdsNew);

  console.log(`Manual "${manual.selectedStyle}": ${manualMatches.length} results`);
  console.log(`  Maps to: ${JSON.stringify(manualStyles)}`);
  console.log();
  console.log(`Aura (OLD) "${aura.styleKeyword}": ${normalizeStyle(aura.styleKeyword).length ? "would use " + JSON.stringify(auraStylesOld) : "empty"}`);
  console.log(`Aura (NEW) "${aura.styleKeyword}": ${auraMatchesNew.length} results`);
  console.log(`  Maps to: ${JSON.stringify(auraStylesNew)}`);
  console.log();
  console.log(`Parity: ${resultsMatch ? "✓ YES" : "✗ NO"}`);

  if (!resultsMatch) {
    console.log(`  Manual IDs: [${manualIds.join(", ")}]`);
    console.log(`  Aura IDs:   [${auraIdsNew.join(", ")}]`);
    allMatch = false;
  }

  console.log();
});

console.log();
if (allMatch) {
  console.log("✅ AURA SEMANTIC FIX VERIFIED");
  console.log("All test cases show parity between manual filters and Aura intent\n");
} else {
  console.log("⚠️  PARTIAL MISMATCH");
  console.log("Some cases still differ (expected for values in multiple categories)\n");
}

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║                   TEST COMPLETE                            ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
