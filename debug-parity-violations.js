#!/usr/bin/env node
/**
 * Debug the 3 parity violations
 */

import { VENUES } from "./src/data/italyVenues.js";
import { STYLE_MAP, normalizeStyle, resolveAuraSemanticIntent, matchesStyleFilter } from "./src/constants/styleMap.js";

console.log("ANALYZING PARITY VIOLATIONS\n");

// 1. Luxury & Opulent
console.log("1. LUXURY & OPULENT (Filter: 14, Aura: 16)\n");
const luxMapping = normalizeStyle("Luxury & Opulent");
const luxFilter = VENUES.filter((v) => matchesStyleFilter(v, luxMapping)).map((v) => v.id).sort((a,b) => a-b);

const luxAura = resolveAuraSemanticIntent("Historic"); // First value in category
const luxAuraVenues = VENUES.filter((v) => matchesStyleFilter(v, luxAura)).map((v) => v.id).sort((a,b) => a-b);

console.log(`Filter maps to: ${JSON.stringify(luxMapping)}`);
console.log(`Filter IDs: [${luxFilter.join(", ")}]`);
console.log(`\nAura (resolving "Historic") maps to: ${JSON.stringify(luxAura)}`);
console.log(`Aura IDs: [${luxAuraVenues.join(", ")}]`);
console.log(`\nMissing from Filter: [${luxAuraVenues.filter(id => !luxFilter.includes(id)).join(", ")}]`);

// 2. Minimalist & Chic
console.log(`\n\n2. MINIMALIST & CHIC (Filter: 0, Aura: 3)\n`);
const minMapping = normalizeStyle("Minimalist & Chic");
console.log(`Filter maps to: ${JSON.stringify(minMapping)}`);
const minResults = VENUES.filter((v) => matchesStyleFilter(v, minMapping)).map((v) => v.id);
console.log(`Filter results: ${minResults.length} venues`);

const minAura = resolveAuraSemanticIntent("Minimalist");
console.log(`Aura (resolving "Minimalist") maps to: ${JSON.stringify(minAura)}`);
const minAuraVenues = VENUES.filter((v) => matchesStyleFilter(v, minAura)).map((v) => ({ id: v.id, name: v.name, styles: v.styles }));
console.log(`Aura finds: ${minAuraVenues.length} venues`);
minAuraVenues.forEach((v) => {
  console.log(`  id:${v.id} ${v.name} — ${JSON.stringify(v.styles)}`);
});

// 3. Black Tie & Formal
console.log(`\n\n3. BLACK TIE & FORMAL (Filter: 22, Aura: 11)\n`);
const btMapping = normalizeStyle("Black Tie & Formal");
const btFilter = VENUES.filter((v) => matchesStyleFilter(v, btMapping)).map((v) => v.id).sort((a,b) => a-b);

const btAura = resolveAuraSemanticIntent("Black Tie");
const btAuraVenues = VENUES.filter((v) => matchesStyleFilter(v, btAura)).map((v) => v.id).sort((a,b) => a-b);

console.log(`Filter maps to: ${JSON.stringify(btMapping)}`);
console.log(`Filter IDs: [${btFilter.slice(0, 10).join(", ")}${btFilter.length > 10 ? "..." : ""}]`);
console.log(`Filter count: ${btFilter.length}`);

console.log(`\nAura (resolving "Black Tie") maps to: ${JSON.stringify(btAura)}`);
console.log(`Aura IDs: [${btAuraVenues.slice(0, 10).join(", ")}${btAuraVenues.length > 10 ? "..." : ""}]`);
console.log(`Aura count: ${btAuraVenues.length}`);

const extra = btFilter.filter(id => !btAuraVenues.includes(id));
console.log(`\nExtra in Filter (not in Aura): [${extra.join(", ")}]`);

// Check what styles these extra venues have
console.log(`\nVenues with extra tags:`);
extra.forEach((id) => {
  const v = VENUES.find((v) => v.id === id);
  if (v) {
    console.log(`  id:${id} — ${JSON.stringify(v.styles)}`);
  }
});
