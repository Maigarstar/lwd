#!/usr/bin/env node
/**
 * Comprehensive test for all style filters
 * Ensures canonical mapping works across all categories
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  normalizeStyle,
  matchesStyleFilter,
  STYLE_MAP,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║    COMPREHENSIVE STYLE FILTER TESTING - ALL CATEGORIES        ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

let totalTests = 0;
let passedTests = 0;

Object.entries(STYLE_MAP).forEach(([label, _]) => {
  const normalized = normalizeStyle(label);
  const matching = VENUES.filter((v) => matchesStyleFilter(v, normalized));

  totalTests++;

  // Verify that venues matching this filter actually have the mapped styles
  const allMatching = matching.every((v) =>
    v.styles.some((s) => normalized.includes(s))
  );

  if (allMatching && matching.length > 0) {
    passedTests++;
    console.log(`✓ "${label}"`);
    console.log(`  Maps to: ${JSON.stringify(normalized)}`);
    console.log(`  Matches: ${matching.length} venues\n`);
  } else {
    console.log(`✗ "${label}" - FAILED`);
    console.log(`  Maps to: ${JSON.stringify(normalized)}`);
    console.log(`  Matches: ${matching.length} venues`);
    console.log(`  Issue: Venues without matching styles found\n`);
  }
});

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log(`║ Results: ${passedTests}/${totalTests} style filters passed`);
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Focus test: Rustic & Country in Tuscany
console.log("FOCUS TEST: 'Rustic & Country' in Tuscany Region");
console.log("─────────────────────────────────────────────\n");

const tuscanyVenues = VENUES.filter((v) => v.region === "Tuscany");
const rusticFilter = normalizeStyle("Rustic & Country");
const rusticTuscany = tuscanyVenues.filter((v) =>
  matchesStyleFilter(v, rusticFilter)
);

console.log(`Region: Tuscany (${tuscanyVenues.length} total venues)`);
console.log(`Filter: "Rustic & Country" → ${JSON.stringify(rusticFilter)}`);
console.log(`Results: ${rusticTuscany.length} venues\n`);

rusticTuscany.forEach((v) => {
  const matched = v.styles.filter((s) => rusticFilter.includes(s));
  console.log(`id:${v.id} ${v.name}`);
  console.log(`  Styles: ${JSON.stringify(v.styles)}`);
  console.log(`  Matched: ${JSON.stringify(matched)}`);
});

console.log(`\nExpected: 5 venues with Rustic or Rustic Luxe`);
console.log(`Actual: ${rusticTuscany.length} venues`);
console.log(`Status: ${rusticTuscany.length === 5 ? "✓ PASS" : "✗ FAIL"}\n`);
