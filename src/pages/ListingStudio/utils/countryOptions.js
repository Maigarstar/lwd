// ═══════════════════════════════════════════════════════════════════════════
// Country Options — derived from the canonical Country Registry
// ═══════════════════════════════════════════════════════════════════════════
//
// DO NOT define country lists here. This file derives dropdown options
// from src/data/countryRegistry.js, the single source of truth.
//
// To add a country: edit countryRegistry.js. It appears here automatically.
// ═══════════════════════════════════════════════════════════════════════════

import { getCountryOptions as _getCountryOptions } from "../../../data/countryRegistry.js";

// Pre-built options list for immediate use in components
export const COUNTRY_OPTIONS = _getCountryOptions();

// Call this if you need a fresh copy (e.g., after hot-reload in dev)
export function getCountryOptions() {
  return _getCountryOptions();
}
