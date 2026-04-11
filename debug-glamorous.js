#!/usr/bin/env node
import { VENUES } from "./src/data/italyVenues.js";
import { STYLE_MAP, normalizeStyle, resolveAuraSemanticIntent, matchesStyleFilter } from "./src/constants/styleMap.js";

console.log("GLAMOROUS & GRAND - Current State\n");
const glamMapping = normalizeStyle("Glamorous & Grand");
const glamFilter = VENUES.filter((v) => matchesStyleFilter(v, glamMapping));

const glamAura = resolveAuraSemanticIntent("Black Tie");  // Try with "Black Tie" first value
const glamAuraVenues = VENUES.filter((v) => matchesStyleFilter(v, glamAura));

console.log(`Filter "Glamorous & Grand" maps to: ${JSON.stringify(glamMapping)}`);
console.log(`Filter results: ${glamFilter.length} venues`);

console.log(`\nAura resolveAuraSemanticIntent("Black Tie") maps to: ${JSON.stringify(glamAura)}`);
console.log(`Aura results: ${glamAuraVenues.length} venues`);

const filterIds = glamFilter.map(v => v.id).sort((a,b) => a-b);
const auraIds = glamAuraVenues.map(v => v.id).sort((a,b) => a-b);

console.log(`\nFilter IDs: [${filterIds.join(", ")}]`);
console.log(`Aura IDs: [${auraIds.join(", ")}]`);

if (JSON.stringify(filterIds) !== JSON.stringify(auraIds)) {
  console.log(`\nMismatch: ${glamFilter.length} vs ${glamAuraVenues.length}`);
}
