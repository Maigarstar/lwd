#!/usr/bin/env node
/**
 * MONITORING SYSTEM STRESS TEST
 *
 * Validates that the monitoring infrastructure correctly:
 * - Logs operations
 * - Detects and fires alerts
 * - No silent failures
 * - Alert subscribers receive notifications
 */

import {
  logFilterOperation,
  onAlert,
  getAlertStats,
  getPerformanceMetrics,
  clearLog,
  exportLog,
} from "./src/engine/filterMonitoring.js";

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║           MONITORING SYSTEM STRESS TEST                      ║");
console.log("║   Validating alerts, logging, and failure detection          ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");

// Track which alerts fired
const alertsFired = {};
const alertListeners = {};

// Subscribe to all alert types
["parity_mismatch", "zero_results", "slow_filter", "unknown_style", "data_quality"].forEach((type) => {
  alertsFired[type] = [];
  alertListeners[type] = onAlert(type, (alert) => {
    alertsFired[type].push(alert);
    console.log(`✓ ALERT FIRED: ${type.toUpperCase()}`);
    console.log(`  Data: ${JSON.stringify(alert.data)}`);
  });
});

console.log("\n🧪 TEST 1: Parity Mismatch Detection");
console.log("═════════════════════════════════════\n");

logFilterOperation({
  category: "Romantic & Whimsical",
  userQuery: "romantic venues in Tuscany",
  mappedValues: ["Romantic"],
  resultCount: 13,
  filterCount: 13,
  auraCount: 20, // Intentional mismatch!
  parityValid: false,
  duration: 25,
  userAgent: "desktop",
});

if (alertsFired.parity_mismatch.length > 0) {
  console.log("✅ Parity mismatch alert FIRED correctly\n");
} else {
  console.log("❌ FAILED: Parity mismatch alert did not fire\n");
}

console.log("🧪 TEST 2: Zero Results Detection");
console.log("═════════════════════════════════\n");

logFilterOperation({
  category: "Minimalist & Chic",
  userQuery: "minimalist wedding venue",
  mappedValues: ["Minimalist"],
  resultCount: 0, // Zero results!
  filterCount: 0,
  auraCount: 0,
  parityValid: true,
  duration: 8,
  userAgent: "mobile",
});

if (alertsFired.zero_results.length > 0) {
  console.log("✅ Zero results alert FIRED correctly\n");
} else {
  console.log("❌ FAILED: Zero results alert did not fire\n");
}

console.log("🧪 TEST 3: Slow Filter Detection (> 50ms)");
console.log("════════════════════════════════════════\n");

logFilterOperation({
  category: "Festival & Outdoor",
  userQuery: "garden wedding venue",
  mappedValues: ["Garden", "Vineyard", "Coastal"],
  resultCount: 19,
  filterCount: 19,
  auraCount: 19,
  parityValid: true,
  duration: 87, // Slow! > 50ms
  userAgent: "desktop",
});

if (alertsFired.slow_filter.length > 0) {
  console.log("✅ Slow filter alert FIRED correctly\n");
} else {
  console.log("❌ FAILED: Slow filter alert did not fire\n");
}

console.log("🧪 TEST 4: Unknown Style Detection");
console.log("═════════════════════════════════\n");

logFilterOperation({
  category: "Unknown Style",
  userQuery: "futuristic wedding venue",
  mappedValues: [],
  resultCount: 0,
  filterCount: 0,
  auraCount: 0,
  parityValid: true,
  duration: 15,
  userAgent: "mobile",
  unknownStyle: "Futuristic", // Unknown!
});

if (alertsFired.unknown_style.length > 0) {
  console.log("✅ Unknown style alert FIRED correctly\n");
} else {
  console.log("❌ FAILED: Unknown style alert did not fire\n");
}

console.log("🧪 TEST 5: Data Quality Issue Detection");
console.log("════════════════════════════════════════\n");

logFilterOperation({
  category: "Romantic & Whimsical",
  userQuery: "romantic venues in Tuscany",
  mappedValues: ["Romantic"],
  resultCount: 13,
  filterCount: 13,
  auraCount: 13,
  parityValid: true,
  duration: 18,
  userAgent: "desktop",
  dataQualityIssue: "WEAK_LISTING",
  listingId: 20,
  dataQualityDetails: "Only secondary tags, missing primary aesthetic",
});

if (alertsFired.data_quality.length > 0) {
  console.log("✅ Data quality alert FIRED correctly\n");
} else {
  console.log("❌ FAILED: Data quality alert did not fire\n");
}

console.log("📊 STRESS TEST RESULTS");
console.log("═══════════════════════\n");

const stats = getAlertStats();
console.log("Alert Statistics:");
console.log(`  Parity Mismatches: ${stats.parity_mismatch}`);
console.log(`  Zero Results: ${stats.zero_results}`);
console.log(`  Slow Filters: ${stats.slow_filter}`);
console.log(`  Unknown Styles: ${stats.unknown_style}`);
console.log(`  Data Quality Issues: ${stats.data_quality}`);
console.log(`  Total Operations Logged: ${stats.total_operations}`);

const metrics = getPerformanceMetrics();
console.log("\nPerformance Metrics:");
console.log(`  Avg Filter Time: ${metrics.avgFilterTime}ms`);
console.log(`  Max Filter Time: ${metrics.maxFilterTime}ms`);
console.log(`  Min Filter Time: ${metrics.minFilterTime}ms`);
console.log(`  P95 Filter Time: ${metrics.p95FilterTime}ms`);

console.log("\n🔍 ALERT DISTRIBUTION");
console.log("═════════════════════\n");

const totalAlerts = Object.values(alertsFired).reduce((sum, arr) => sum + arr.length, 0);
console.log(`Total Alerts Fired: ${totalAlerts}`);
Object.entries(alertsFired).forEach(([type, alerts]) => {
  console.log(`  ${type}: ${alerts.length}`);
});

console.log("\n✅ MONITORING SYSTEM VALIDATION");
console.log("════════════════════════════════\n");

const testsPassed = [
  alertsFired.parity_mismatch.length > 0,
  alertsFired.zero_results.length > 0,
  alertsFired.slow_filter.length > 0,
  alertsFired.unknown_style.length > 0,
  alertsFired.data_quality.length > 0,
  stats.total_operations === 5,
  metrics.avgFilterTime > 0,
  metrics.maxFilterTime >= 87,
];

const passCount = testsPassed.filter(Boolean).length;
const totalTests = testsPassed.length;

console.log(`Tests Passed: ${passCount}/${totalTests}`);

if (passCount === totalTests) {
  console.log("\n✅ ALL TESTS PASSED");
  console.log("   • Alerts fire correctly");
  console.log("   • Logging is functional");
  console.log("   • No silent failures detected");
  console.log("   • Subscribers receive notifications");
  console.log("   • Performance tracking active");
} else {
  console.log(`\n❌ ${totalTests - passCount} TESTS FAILED`);
  console.log("   Monitoring system needs investigation");
}

console.log("\n🧹 Cleanup: Clearing logs...");
clearLog();
const finalExport = exportLog();
console.log(`Logs cleared. Final export length: ${finalExport.length}\n`);

console.log("╔══════════════════════════════════════════════════════════════╗");
console.log("║              STRESS TEST COMPLETE                           ║");
console.log("╚══════════════════════════════════════════════════════════════╝\n");
