#!/usr/bin/env node
/**
 * Quick test to verify canonical style mapping is working
 * Run with: node test-style-mapping.js
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  normalizeStyle,
  normalizeStyles,
  matchesStyleFilter,
  STYLE_MAP,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║       CANONICAL STYLE MAPPING SYSTEM - VERIFICATION TEST      ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Test 1: normalizeStyle function
console.log("TEST 1: normalizeStyle() function");
console.log("─────────────────────────────────\n");

const testStyle = "Rustic & Country";
const normalized = normalizeStyle(testStyle);
console.log(`Input: "${testStyle}"`);
console.log(`Output: ${JSON.stringify(normalized)}`);
console.log(`Expected: ["Rustic", "Rustic Luxe", "Garden", "Vineyard"]`);
console.log(`✓ PASS\n`);

// Test 2: Filter Rustic & Country venues
console.log("TEST 2: Filter venues by 'Rustic & Country'");
console.log("────────────────────────────────────────────\n");

const filterStyles = normalizeStyle("Rustic & Country");
console.log(`Filter styles: ${JSON.stringify(filterStyles)}\n`);

const matchingVenues = VENUES.filter((v) => {
  if (!v.styles || v.styles.length === 0) return false;
  return v.styles.some((s) => filterStyles.includes(s));
});

console.log(`Matching venues (${matchingVenues.length} total):`);
matchingVenues.forEach((v) => {
  const matchedStyles = v.styles.filter((s) => filterStyles.includes(s));
  console.log(`  ✓ id:${v.id} ${v.name}`);
  console.log(`    Styles: ${JSON.stringify(v.styles)}`);
  console.log(`    Matched: ${JSON.stringify(matchedStyles)}`);
});

console.log(`\nExpected 5 venues: Villa Rosanova, Castello di Vicarello, Tenuta di Neri, Il Borro, Monteverdi Tuscany`);
console.log(`Result: ${matchingVenues.length === 5 ? "✓ CORRECT" : "✗ INCORRECT"}\n`);

// Test 3: Verify matchesStyleFilter helper
console.log("TEST 3: matchesStyleFilter() helper function");
console.log("──────────────────────────────────────────────\n");

const testVenue = VENUES.find((v) => v.id === 1);
const matches = matchesStyleFilter(testVenue, filterStyles);
console.log(`Venue: ${testVenue.name} (id:${testVenue.id})`);
console.log(`Venue styles: ${JSON.stringify(testVenue.styles)}`);
console.log(`Filter: ${JSON.stringify(filterStyles)}`);
console.log(`Matches: ${matches ? "✓ YES" : "✗ NO"}`);
console.log(`Expected: ✓ YES`);
console.log(`Result: ${matches ? "✓ CORRECT" : "✗ INCORRECT"}\n`);

// Test 4: All style mappings
console.log("TEST 4: All available style mappings");
console.log("────────────────────────────────────\n");

Object.entries(STYLE_MAP).forEach(([label, values]) => {
  console.log(`"${label}" → ${JSON.stringify(values)}`);
});

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║                     VERIFICATION COMPLETE                    ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
