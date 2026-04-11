#!/usr/bin/env node
/**
 * Test: Aura semantic understanding vs manual filters
 *
 * Critical validation:
 * If Aura outputs "rustic wedding venue" → must resolve to same canonical values
 * as manual filter selection of "Rustic & Country"
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  normalizeStyle,
  normalizeStyles,
  matchesStyleFilter,
  STYLE_TAXONOMY,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║          AURA ALIGNMENT TEST - CROSS-SYSTEM PARITY            ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

/**
 * Mock Aura parsing results
 * In production, these come from the Edge Function parse-venue-query
 */
const MOCK_AURA_PARSES = [
  {
    query: "rustic wedding venues in Tuscany",
    auraOutput: { style: "Rustic", region: "Tuscany" },
    humanExpectation: "Rustic & Country in Tuscany",
  },
  {
    query: "romantic garden wedding in Italy",
    auraOutput: { style: "Romantic", region: null },
    humanExpectation: "Romantic & Whimsical in Italy",
  },
  {
    query: "luxury exclusive venues",
    auraOutput: { style: "Exclusive", region: null },
    humanExpectation: "Could be Glamorous & Grand OR Luxury & Opulent",
  },
  {
    query: "black tie formal event space",
    auraOutput: { style: "Black Tie", region: null },
    humanExpectation: "Black Tie & Formal",
  },
  {
    query: "bohemian artistic wedding",
    auraOutput: { style: "Bohemian", region: null },
    humanExpectation: "Bohemian & Free-Spirit",
  },
];

console.log("TEST: Aura Raw Output → Normalized Values");
console.log("──────────────────────────────────────────\n");

MOCK_AURA_PARSES.forEach(({ query, auraOutput, humanExpectation }) => {
  console.log(`Query: "${query}"`);
  console.log(`Aura parsed: ${JSON.stringify(auraOutput)}`);

  // Step 1: Aura outputs a style (could be UI label or data value)
  const auraStyleOutput = auraOutput.style;

  // Step 2: Normalize it using the same function as manual filters
  const normalizedAura = normalizeStyle(auraStyleOutput);

  console.log(`Normalized: ${JSON.stringify(normalizedAura)}`);
  console.log(`Human expectation: ${humanExpectation}`);

  // Step 3: Apply to venues
  const tuscanyFilter = auraOutput.region === "Tuscany"
    ? (v) => v.region === "Tuscany"
    : () => true;

  const matches = VENUES.filter(
    (v) => tuscanyFilter(v) && matchesStyleFilter(v, normalizedAura)
  );

  console.log(`Results: ${matches.length} venues`);
  if (matches.length > 0 && matches.length <= 5) {
    matches.forEach((v) => {
      console.log(`  - id:${v.id} ${v.name}`);
    });
  }
  console.log();
});

console.log("\n");
console.log("TEST: Manual Filter vs Aura Intent");
console.log("──────────────────────────────────\n");

/**
 * Critical test case: Same intent expressed two ways should return same results
 */
const testCases = [
  {
    name: "Rustic in Tuscany",
    manual: {
      selectedStyle: "Rustic & Country",
      region: "Tuscany",
    },
    aura: {
      styleKeyword: "Rustic",
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
      styleKeyword: "Romantic",
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
      styleKeyword: "Exclusive",
      region: null,
    },
  },
];

let allMatch = true;

testCases.forEach(({ name, manual, aura }) => {
  console.log(`Test: ${name}`);
  console.log("────────────────────");

  // Manual path
  const manualStyles = normalizeStyle(manual.selectedStyle);
  const manualMatches = VENUES.filter((v) => {
    if (manual.region && v.region !== manual.region) return false;
    return matchesStyleFilter(v, manualStyles);
  });

  // Aura path
  const auraStyles = normalizeStyle(aura.styleKeyword);
  const auraMatches = VENUES.filter((v) => {
    if (aura.region && v.region !== aura.region) return false;
    return matchesStyleFilter(v, auraStyles);
  });

  // Compare
  const manualIds = manualMatches.map((v) => v.id).sort((a, b) => a - b);
  const auraIds = auraMatches.map((v) => v.id).sort((a, b) => a - b);
  const resultsMatch =
    JSON.stringify(manualIds) === JSON.stringify(auraIds);

  console.log(`Manual "${manual.selectedStyle}": ${manualMatches.length} results`);
  console.log(`Aura "${aura.styleKeyword}": ${auraMatches.length} results`);
  console.log(`IDs Match: ${resultsMatch ? "✓ YES" : "✗ NO"}`);

  if (!resultsMatch) {
    console.log(`  Manual IDs: [${manualIds.join(", ")}]`);
    console.log(`  Aura IDs:   [${auraIds.join(", ")}]`);
    allMatch = false;
  }

  console.log();
});

if (allMatch) {
  console.log(
    "✓ AURA ALIGNMENT VERIFIED: Manual filters and Aura produce identical results\n"
  );
} else {
  console.log(
    "✗ AURA MISALIGNMENT DETECTED: Results differ between manual and Aura paths\n"
  );
}

console.log("\n");
console.log("AURA SEMANTIC ALIASES");
console.log("─────────────────────\n");
console.log("When Aura outputs one of these keywords, it maps to the category:");
console.log();

Object.entries(STYLE_TAXONOMY).forEach(({ 0: category, 1: { query_aliases } }) => {
  console.log(`${category}:`);
  console.log(`  ${query_aliases.join(" / ")}`);
});

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║                   TEST COMPLETE                            ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
