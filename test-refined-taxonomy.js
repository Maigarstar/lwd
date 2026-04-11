#!/usr/bin/env node
/**
 * Test refined strict taxonomy
 * Ensures no false positives, no generic catch-alls, all categories work correctly
 */

import { VENUES } from "./src/data/italyVenues.js";
import {
  normalizeStyle,
  matchesStyleFilter,
  STYLE_MAP,
  STYLE_TAXONOMY,
  debugStyleMapping,
  validateStyleTaxonomy,
} from "./src/constants/styleMap.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║        REFINED STRICT TAXONOMY - COMPREHENSIVE TEST           ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Step 1: Validate taxonomy integrity
console.log("STEP 1: Validate Taxonomy Integrity");
console.log("───────────────────────────────────\n");
const validation = validateStyleTaxonomy();
console.log(`✓ Categories: ${validation.stats.totalCategories}`);
console.log(`✓ Unique values: ${validation.stats.totalUniqueValues}`);
console.log(`✓ Status: ${validation.valid ? "VALID" : "INVALID"}`);

if (validation.issues.length > 0) {
  console.log("\nIssues found:");
  validation.issues.forEach(issue => {
    console.log(`  ${issue.severity.toUpperCase()}: ${issue.message}`);
    issue.values.forEach(v => console.log(`    - ${v}`));
  });
}
console.log();

// Step 2: Test each category
console.log("STEP 2: Test Each Category");
console.log("──────────────────────────\n");

let totalTests = 0;
let passedTests = 0;
let zeroResultTests = 0;

Object.entries(STYLE_MAP).forEach(([label, values]) => {
  const normalized = normalizeStyle(label);
  const matching = VENUES.filter((v) => matchesStyleFilter(v, normalized));
  
  totalTests++;
  
  // Verify all matched venues actually have the mapped styles
  const allCorrect = matching.every((v) =>
    v.styles.some((s) => normalized.includes(s))
  );
  
  if (allCorrect) {
    passedTests++;
    if (matching.length === 0) {
      zeroResultTests++;
      console.log(`⚠ "${label}"`);
      console.log(`  Maps to: ${JSON.stringify(normalized)}`);
      console.log(`  Matches: 0 venues (might indicate removed values)\n`);
    } else {
      console.log(`✓ "${label}" → ${matching.length} venues`);
    }
  } else {
    console.log(`✗ "${label}" - FAILED (false positives detected)`);
    console.log(`  Maps to: ${JSON.stringify(normalized)}`);
    matching.forEach(v => {
      const matched = v.styles.filter(s => normalized.includes(s));
      if (matched.length === 0) {
        console.log(`  ✗ id:${v.id} ${v.name} - NO MATCHING STYLES`);
      }
    });
  }
});

console.log(`\n\nSUMMARY: ${passedTests}/${totalTests} categories passed`);
if (zeroResultTests > 0) {
  console.log(`⚠ Warning: ${zeroResultTests} categories returned zero results`);
}
console.log();

// Step 3: Focus test - Rustic & Country (critical case)
console.log("STEP 3: Focus Test - Rustic & Country (Tuscany)");
console.log("──────────────────────────────────────────────\n");

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
  console.log(`✓ id:${v.id} ${v.name}`);
  console.log(`  Styles: ${JSON.stringify(v.styles)}`);
  console.log(`  Matched: ${JSON.stringify(matched)}`);
});

const expectedCount = 5;
const resultCorrect = rusticTuscany.length === expectedCount;
console.log(`\nExpected: ${expectedCount} venues`);
console.log(`Actual: ${rusticTuscany.length} venues`);
console.log(`Status: ${resultCorrect ? "✓ PASS" : "✗ FAIL"}\n`);

// Step 4: Verify no false positives (key security check)
console.log("STEP 4: False Positive Security Check");
console.log("─────────────────────────────────────\n");

const falsePosVenues = [
  { id: 14, name: "Villa La Vedetta", styles: ["Black Tie","Romantic","Garden"], shouldNotMatch: "Rustic & Country" },
  { id: 20, name: "Castello di Ama", styles: ["Vineyard","Intimate","Garden"], shouldNotMatch: "Rustic & Country" },
];

let securityPassed = true;
falsePosVenues.forEach(({ id, name, styles, shouldNotMatch }) => {
  const filterValues = normalizeStyle(shouldNotMatch);
  const matches = styles.some(s => filterValues.includes(s));
  
  if (matches) {
    console.log(`✗ FALSE POSITIVE: id:${id} ${name}`);
    console.log(`  Styles: ${JSON.stringify(styles)}`);
    console.log(`  Filter: "${shouldNotMatch}" → ${JSON.stringify(filterValues)}`);
    console.log(`  Should NOT match, but does!\n`);
    securityPassed = false;
  } else {
    console.log(`✓ id:${id} ${name} correctly excluded from "${shouldNotMatch}"`);
  }
});

console.log(`\n${securityPassed ? "✓ SECURITY PASSED" : "✗ SECURITY FAILED"}\n`);

// Step 5: Check Aura aliases
console.log("STEP 5: Aura Query Aliases (for semantic understanding)");
console.log("────────────────────────────────────────────────────────\n");

Object.entries(STYLE_TAXONOMY).forEach(([category, { query_aliases }]) => {
  console.log(`"${category}":`);
  console.log(`  Aliases: ${query_aliases.join(", ")}`);
});

console.log("\n╔══════════════════════════════════════════════════════════════╗");
console.log("║              REFINED TAXONOMY TEST COMPLETE                 ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
