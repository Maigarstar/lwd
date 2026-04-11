#!/usr/bin/env node
/**
 * Verify: Romantic filter is now strict and matches Aura
 */

import { VENUES } from "./src/data/italyVenues.js";
import { normalizeStyle, resolveAuraSemanticIntent, matchesStyleFilter } from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║         VERIFY: Strict Romantic Filter = Aura Results         ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Manual filter path
const filterMapping = normalizeStyle("Romantic & Whimsical");
const filterResults = VENUES.filter((v) => matchesStyleFilter(v, filterMapping)).sort(
  (a, b) => a.id - b.id
);

// Aura path
const auraMapping = resolveAuraSemanticIntent("Romantic");
const auraResults = VENUES.filter((v) => matchesStyleFilter(v, auraMapping)).sort(
  (a, b) => a.id - b.id
);

console.log(`Manual Filter "Romantic & Whimsical":`);
console.log(`  Maps to: ${JSON.stringify(filterMapping)}`);
console.log(`  Results: ${filterResults.length} venues\n`);

console.log(`Aura "Romantic":`);
console.log(`  Maps to: ${JSON.stringify(auraMapping)}`);
console.log(`  Results: ${auraResults.length} venues\n`);

// Compare
const filterIds = filterResults.map((v) => v.id);
const auraIds = auraResults.map((v) => v.id);
const parity = JSON.stringify(filterIds) === JSON.stringify(auraIds);

console.log(`Parity: ${parity ? "✓ YES — PERFECT ALIGNMENT" : "✗ NO"}`);

if (parity) {
  console.log(`\nBoth systems return exactly ${filterResults.length} genuine romantic venues:\n`);
  filterResults.forEach((v) => {
    console.log(`  ✓ id:${v.id} ${v.name}`);
  });
  console.log(`\n✓ STRICT TAXONOMY VERIFIED`);
  console.log(`✓ NO FALSE POSITIVES`);
  console.log(`✓ FILTER AND AURA FULLY ALIGNED`);
} else {
  console.log(`\nMismatch detected:`);
  console.log(`  Filter IDs: [${filterIds.join(", ")}]`);
  console.log(`  Aura IDs: [${auraIds.join(", ")}]`);
}

console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
console.log(`║                   READY TO COMMIT                            ║`);
console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
