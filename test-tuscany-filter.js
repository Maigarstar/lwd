#!/usr/bin/env node
/**
 * Test: Filter Rustic & Country in Tuscany region only
 * This matches the original test scenario from the implementation notes
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  normalizeStyle,
  matchesStyleFilter,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║    CANONICAL STYLE MAPPING - TUSCANY REGION TEST              ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Step 1: Filter to Tuscany region only
const tuscanyVenues = VENUES.filter((v) => v.region === "Tuscany");
console.log(`Step 1: Filter region = "Tuscany"`);
console.log(`Result: ${tuscanyVenues.length} venues\n`);

tuscanyVenues.forEach((v) => {
  console.log(`  id:${v.id} ${v.name}`);
  console.log(`    Styles: ${JSON.stringify(v.styles)}`);
});

// Step 2: Apply Rustic & Country filter
console.log(`\nStep 2: Apply style filter "Rustic & Country"`);
const filterStyles = normalizeStyle("Rustic & Country");
console.log(`Normalized to: ${JSON.stringify(filterStyles)}\n`);

const filteredVenues = tuscanyVenues.filter((v) =>
  matchesStyleFilter(v, filterStyles)
);

console.log(`Result: ${filteredVenues.length} venues\n`);

filteredVenues.forEach((v) => {
  const matched = v.styles.filter((s) => filterStyles.includes(s));
  console.log(`  ✓ id:${v.id} ${v.name}`);
  console.log(`    Styles: ${JSON.stringify(v.styles)}`);
  console.log(`    Matched: ${JSON.stringify(matched)}`);
});

console.log(`\nExpected: 5 venues`);
console.log(`Actual: ${filteredVenues.length} venues`);
console.log(`Status: ${filteredVenues.length === 5 ? "✓ PASS" : "✗ FAIL"}\n`);

// Expected venue list
const expectedIds = [1, 6, 8, 13, 17];
const actualIds = filteredVenues.map((v) => v.id).sort((a, b) => a - b);
console.log(`Expected IDs: [${expectedIds.join(", ")}]`);
console.log(`Actual IDs:   [${actualIds.join(", ")}]`);
console.log(`Match: ${JSON.stringify(expectedIds) === JSON.stringify(actualIds) ? "✓ YES" : "✗ NO"}\n`);
