/**
 * ─── src/engine/filterMonitoring.js ────────────────────────────────────────
 * FILTER OPERATION MONITORING & ALERTING SYSTEM
 *
 * Tracks every filter operation to detect:
 * - Performance degradation (filter apply time > 50ms)
 * - Aura/Filter parity mismatches
 * - Zero result states
 * - Unknown style values
 * - Data quality issues
 *
 * Purpose: Ensure production resilience through real-time observability
 * ────────────────────────────────────────────────────────────────────────── */

/**
 * ─── FILTER OPERATION LOG ──────────────────────────────────────────────────
 * Stores in-memory log of all filter operations
 */
const operationLog = [];
const MAX_LOG_SIZE = 1000; // Keep last 1000 operations

/**
 * ─── ALERT EVENTS ─────────────────────────────────────────────────────────
 * Subscribers to alert conditions
 */
const alertListeners = {
  parity_mismatch: [],
  zero_results: [],
  slow_filter: [],
  unknown_style: [],
  data_quality: [],
};

/**
 * Log a filter operation
 * @param {Object} operation - The operation details
 */
export function logFilterOperation(operation) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ...operation,
  };

  operationLog.push(logEntry);
  if (operationLog.length > MAX_LOG_SIZE) {
    operationLog.shift();
  }

  // Check for alert conditions
  checkAlertConditions(logEntry);

  if (process.env.NODE_ENV === "development") {
    console.log("📊 Filter Operation:", logEntry);
  }

  return logEntry;
}

/**
 * Check for alert conditions and emit alerts
 * @param {Object} entry - The log entry
 */
function checkAlertConditions(entry) {
  // Alert: Parity mismatch
  if (entry.parityValid === false) {
    emitAlert("parity_mismatch", {
      category: entry.category,
      filterCount: entry.filterCount,
      auraCount: entry.auraCount,
      difference: Math.abs(entry.filterCount - entry.auraCount),
    });
  }

  // Alert: Zero results
  if (entry.resultCount === 0) {
    emitAlert("zero_results", {
      category: entry.category,
      query: entry.userQuery,
      filters: entry.filters,
    });
  }

  // Alert: Slow filter operation (> 50ms)
  if (entry.duration > 50) {
    emitAlert("slow_filter", {
      category: entry.category,
      duration: entry.duration,
      resultCount: entry.resultCount,
    });
  }

  // Alert: Unknown style value
  if (entry.unknownStyle) {
    emitAlert("unknown_style", {
      style: entry.unknownStyle,
      query: entry.userQuery,
    });
  }

  // Alert: Data quality issues
  if (entry.dataQualityIssue) {
    emitAlert("data_quality", {
      issue: entry.dataQualityIssue,
      listingId: entry.listingId,
      details: entry.dataQualityDetails,
    });
  }
}

/**
 * Emit an alert to all subscribers
 * @param {string} alertType - The type of alert
 * @param {Object} data - The alert data
 */
function emitAlert(alertType, data) {
  const alert = {
    type: alertType,
    timestamp: new Date().toISOString(),
    data,
    severity: getSeverity(alertType),
  };

  if (alertListeners[alertType]) {
    alertListeners[alertType].forEach((listener) => listener(alert));
  }

  // Console warning for development
  if (process.env.NODE_ENV === "development") {
    console.warn(`⚠️ [${alertType.toUpperCase()}]`, data);
  }
}

/**
 * Get severity level for alert type
 * @param {string} alertType - The alert type
 * @returns {string} - 'critical', 'warning', or 'info'
 */
function getSeverity(alertType) {
  const severityMap = {
    parity_mismatch: "critical",
    zero_results: "warning",
    slow_filter: "warning",
    unknown_style: "warning",
    data_quality: "warning",
  };
  return severityMap[alertType] || "info";
}

/**
 * Subscribe to alert events
 * @param {string} alertType - The alert type to listen for
 * @param {Function} callback - The callback function
 */
export function onAlert(alertType, callback) {
  if (!alertListeners[alertType]) {
    console.warn(`Unknown alert type: ${alertType}`);
    return;
  }

  alertListeners[alertType].push(callback);

  // Return unsubscribe function
  return () => {
    const idx = alertListeners[alertType].indexOf(callback);
    if (idx > -1) {
      alertListeners[alertType].splice(idx, 1);
    }
  };
}

/**
 * Get recent operations from the log
 * @param {number} limit - Max number of recent operations to return
 * @returns {Array}
 */
export function getRecentOperations(limit = 50) {
  return operationLog.slice(-limit);
}

/**
 * Get alert statistics
 * @returns {Object} - Count of each alert type
 */
export function getAlertStats() {
  const stats = {
    parity_mismatch: 0,
    zero_results: 0,
    slow_filter: 0,
    unknown_style: 0,
    data_quality: 0,
    total_operations: operationLog.length,
  };

  operationLog.forEach((entry) => {
    if (entry.parityValid === false) stats.parity_mismatch++;
    if (entry.resultCount === 0) stats.zero_results++;
    if (entry.duration > 50) stats.slow_filter++;
    if (entry.unknownStyle) stats.unknown_style++;
    if (entry.dataQualityIssue) stats.data_quality++;
  });

  return stats;
}

/**
 * Get performance metrics
 * @returns {Object} - Performance stats
 */
export function getPerformanceMetrics() {
  if (operationLog.length === 0) {
    return {
      avgFilterTime: 0,
      maxFilterTime: 0,
      minFilterTime: 0,
      p95FilterTime: 0,
    };
  }

  const durations = operationLog
    .filter((o) => o.duration !== undefined)
    .map((o) => o.duration)
    .sort((a, b) => a - b);

  const avg = durations.reduce((sum, d) => sum + d, 0) / durations.length;
  const max = Math.max(...durations);
  const min = Math.min(...durations);
  const p95Idx = Math.floor(durations.length * 0.95);
  const p95 = durations[p95Idx];

  return {
    avgFilterTime: Math.round(avg),
    maxFilterTime: max,
    minFilterTime: min,
    p95FilterTime: p95,
    totalOperations: operationLog.length,
  };
}

/**
 * Clear the operation log (useful for testing)
 */
export function clearLog() {
  operationLog.length = 0;
}

/**
 * Export the full log
 * @returns {Array}
 */
export function exportLog() {
  return [...operationLog];
}
