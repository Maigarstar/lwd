#!/usr/bin/env node
import { VENUES } from "./src/data/italyVenues.js";
import { STYLE_MAP, normalizeStyle, resolveAuraSemanticIntent, matchesStyleFilter } from "./src/constants/styleMap.js";

// 1. Glamorous & Grand
console.log("GLAMOROUS & GRAND\n");
const glamMapping = normalizeStyle("Glamorous & Grand");
const glamFilter = VENUES.filter((v) => matchesStyleFilter(v, glamMapping)).map((v) => v.id).sort((a,b) => a-b);

const glamAura = resolveAuraSemanticIntent("Exclusive");
const glamAuraVenues = VENUES.filter((v) => matchesStyleFilter(v, glamAura)).map((v) => v.id).sort((a,b) => a-b);

console.log(`Filter maps to: ${JSON.stringify(glamMapping)}`);
console.log(`Filter count: ${glamFilter.length} — IDs: [${glamFilter.slice(0,5).join(",")}...]`);
console.log(`Aura resolves "Exclusive" to: ${JSON.stringify(glamAura)}`);
console.log(`Aura count: ${glamAuraVenues.length} — IDs: [${glamAuraVenues.slice(0,5).join(",")}...]`);
console.log(`Missing: [${glamAuraVenues.filter(id => !glamFilter.includes(id)).join(", ")}]`);
console.log(`Extra: [${glamFilter.filter(id => !glamAuraVenues.includes(id)).join(", ")}]`);

// 2. Minimalist & Chic
console.log(`\n\nMINIMALIST & CHIC\n`);
const minMapping = normalizeStyle("Minimalist & Chic");
console.log(`Filter maps to: ${JSON.stringify(minMapping)}`);
const minFilter = VENUES.filter((v) => matchesStyleFilter(v, minMapping));
console.log(`Filter count: ${minFilter.length}`);

const minAura = resolveAuraSemanticIntent("Minimalist");
console.log(`Aura resolves "Minimalist" to: ${JSON.stringify(minAura)}`);
const minAuraVenues = VENUES.filter((v) => matchesStyleFilter(v, minAura));
console.log(`Aura count: ${minAuraVenues.length}`);
minAuraVenues.forEach((v) => {
  console.log(`  id:${v.id} ${v.name} — ${JSON.stringify(v.styles)}`);
});

console.log(`\nThe issue: "Art Deco" is in STYLE_MAP["Minimalist & Chic"] but also in "Contemporary & Modern"`);
console.log(`Aura resolves "Minimalist" via PRIMARY_MAPPING? No, "Minimalist" is not ambiguous.`);
console.log(`So Aura finds "Minimalist" in "Contemporary & Modern" FIRST in the STYLE_MAP iteration order`);
