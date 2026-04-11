#!/usr/bin/env node
import { VENUES } from "./src/data/italyVenues.js";
import { normalizeStyle, resolveAuraSemanticIntent, matchesStyleFilter } from "./src/constants/styleMap.js";

console.log("FINAL CHECK: All 13 Categories\n");

const categories = [
  "Classic & Traditional",
  "Contemporary & Modern",
  "Rustic & Country",
  "Bohemian & Free-Spirit",
  "Glamorous & Grand",
  "Intimate & Elopement",
  "Destination",
  "Festival & Outdoor",
  "Alternative & Creative",
  "Luxury & Opulent",
  "Romantic & Whimsical",
  "Minimalist & Chic",
  "Black Tie & Formal",
];

let allPerfect = true;

categories.forEach((cat) => {
  const filterMapping = normalizeStyle(cat);
  const filterResults = VENUES.filter((v) => matchesStyleFilter(v, filterMapping));
  
  const firstValue = filterMapping[0];
  const auraMapping = resolveAuraSemanticIntent(firstValue);
  const auraResults = VENUES.filter((v) => matchesStyleFilter(v, auraMapping));
  
  const filterIds = filterResults.map(v => v.id).sort((a,b) => a-b);
  const auraIds = auraResults.map(v => v.id).sort((a,b) => a-b);
  const match = JSON.stringify(filterIds) === JSON.stringify(auraIds);
  
  if (!match) {
    allPerfect = false;
    console.log(`✗ "${cat}"`);
    console.log(`  Filter: ${filterResults.length}, Aura: ${auraResults.length}`);
  } else {
    console.log(`✓ "${cat}" (${filterResults.length})`);
  }
});

console.log(`\nResult: ${allPerfect ? "✅ ALL PERFECT PARITY" : "⚠️ Some violations remain"}`);
