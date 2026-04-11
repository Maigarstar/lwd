#!/usr/bin/env node
/**
 * CRITICAL ANALYSIS: What does "Romantic" actually mean?
 *
 * Filter says: 20 venues (includes all with "Romantic" OR "Garden")
 * Aura says: 13 venues (only those with "Romantic" style)
 *
 * Which is actually correct for a luxury platform?
 */

import { VENUES } from "./src/data/italyVenues.js";
import { normalizeStyle, matchesStyleFilter, STYLE_MAP } from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║     SEMANTIC ANALYSIS: What is \"Romantic\" Actually?          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Get the mapping
const filterValues = normalizeStyle("Romantic & Whimsical");
console.log(`Filter Definition: "Romantic & Whimsical" → ${JSON.stringify(filterValues)}`);
console.log();

// Get all 20 results from filter
const filterResults = VENUES.filter((v) => matchesStyleFilter(v, filterValues)).sort(
  (a, b) => a.id - b.id
);

console.log(`Total results: ${filterResults.length} venues\n`);

console.log("BREAKDOWN: Why each venue was included\n");
console.log("═══════════════════════════════════════════════════════════════\n");

let trueRomantic = [];
let adjacentGarden = [];
let weak = [];

filterResults.forEach((v) => {
  const matched = v.styles.filter((s) => filterValues.includes(s));
  const hasRomantic = v.styles.includes("Romantic");
  const hasGarden = v.styles.includes("Garden");

  console.log(`id:${v.id} ${v.name.padEnd(35)} | Region: ${v.region}`);
  console.log(`  Venue styles: ${JSON.stringify(v.styles)}`);
  console.log(`  Matched by: ${JSON.stringify(matched)}`);

  // Categorize
  if (hasRomantic && hasGarden) {
    console.log(`  → TRUE ROMANTIC + Garden (premium romantic)\n`);
    trueRomantic.push(v);
  } else if (hasRomantic && !hasGarden) {
    console.log(`  → TRUE ROMANTIC (pure romantic aesthetic)\n`);
    trueRomantic.push(v);
  } else if (!hasRomantic && hasGarden) {
    console.log(`  → ADJACENT: Garden only (no romantic style tag)\n`);
    adjacentGarden.push(v);
  } else {
    console.log(`  → WEAK: Neither Romantic nor Garden\n`);
    weak.push(v);
  }
});

console.log("═══════════════════════════════════════════════════════════════\n");
console.log("CLASSIFICATION SUMMARY\n");
console.log(`True Romantic (has "Romantic" style): ${trueRomantic.length} venues`);
trueRomantic.forEach((v) => {
  console.log(`  - id:${v.id} ${v.name}`);
});

console.log(`\nAdjacent (only "Garden", no "Romantic"): ${adjacentGarden.length} venues`);
adjacentGarden.forEach((v) => {
  console.log(`  - id:${v.id} ${v.name}`);
});

if (weak.length > 0) {
  console.log(`\nWeak (neither): ${weak.length} venues`);
  weak.forEach((v) => {
    console.log(`  - id:${v.id} ${v.name}`);
  });
}

console.log(`\n\n═══════════════════════════════════════════════════════════════\n`);
console.log("AURA COMPARISON\n");

// What Aura would return (strict: only Romantic style)
const auraValues = ["Romantic"];
const auraResults = VENUES.filter((v) => {
  return v.styles && v.styles.some((s) => auraValues.includes(s));
}).sort((a, b) => a.id - b.id);

console.log(`Aura (strict "Romantic" only): ${auraResults.length} venues`);
auraResults.forEach((v) => {
  console.log(`  - id:${v.id} ${v.name}`);
});

console.log(`\n\n═══════════════════════════════════════════════════════════════\n`);
console.log("DECISION MATRIX\n");

console.log("OPTION A: Strict Taxonomy (Romantic = only \"Romantic\" style)");
console.log(`  Filter returns: 13 venues (true Romantic only)`);
console.log(`  Aura returns: 13 venues`);
console.log(`  Parity: ✓ YES`);
console.log(`  Precision: HIGH`);
console.log(`  Volume: 13 results`);
console.log(`  Trust: User searching 'romantic' gets genuine romantic venues`);
console.log(`  Brand: Luxury platform values accuracy > abundance`);
console.log();

console.log("OPTION B: Broad Grouping (Romantic = \"Romantic\" + \"Garden\")");
console.log(`  Filter returns: 20 venues`);
console.log(`  Aura would need to return: 20 venues`);
console.log(`  Parity: ✓ YES`);
console.log(`  Precision: MEDIUM`);
console.log(`  Volume: 20 results`);
console.log(`  Trust: User gets some unrelated garden venues`);
console.log(`  Brand: Maximizes results but weakens relevance`);
console.log();

console.log("═══════════════════════════════════════════════════════════════\n");
console.log("RECOMMENDATION FOR LUXURY PLATFORM\n");
console.log("Option A (Strict Taxonomy)\n");
console.log("Why:");
console.log("  • Luxury users expect precision, not abundance");
console.log("  • 'Romantic' should mean genuinely romantic venues");
console.log("  • Garden is a separate aesthetic category");
console.log("  • A luxury platform's reputation depends on trust");
console.log("  • 13 perfect results > 20 with false positives");
console.log();

console.log("Action:");
console.log("  1. Keep Aura strict (13 results)");
console.log("  2. Tighten Filter to match Aura");
console.log("  3. Remove 'Garden' from 'Romantic & Whimsical' category");
console.log("  4. Move 'Garden' venues to 'Festival & Outdoor' when selected");
console.log();

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║              ANALYSIS COMPLETE - AWAITING DECISION            ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
