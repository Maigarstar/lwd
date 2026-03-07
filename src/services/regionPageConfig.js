// ════════════════════════════════════════════════════════════════════════════════
// Region Page Configuration Service
// Manages editable premium page design config (separate from base region data)
// ════════════════════════════════════════════════════════════════════════════════

// Default premium page config structure
const DEFAULT_PAGE_CONFIG = {
  about: {
    title: "About",
    content: "",
  },
  hero: {
    title: "",
    intro: "",
    image: "",
    stats: [
      { label: "", value: "" },
      { label: "", value: "" },
      { label: "", value: "" },
    ],
  },
  vibes: {
    enabled: false,
    vibes: [],
  },
  featured: {
    enabled: true,
    itemIds: [],
    count: 6,
    displayType: "carousel", // "carousel" | "grid"
    title: "",
  },
  realWeddings: {
    enabled: false,
    title: "",
    source: "auto", // "auto" | "manual"
    selectedIds: [],
  },
  layout: {
    defaultViewMode: "grid", // "grid" | "list" | "map"
    itemsPerPage: 12,
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// PUGLIA - Initial Premium Page Configuration
// ════════════════════════════════════════════════════════════════════════════════

export const PUGLIA_PAGE_CONFIG = {
  about: {
    title: "About Puglia",
    content: "Puglia (Apulia) — Southern Italy's fastest-growing luxury wedding destination. Masseria estates in olive groves, whitewashed trulli villages, Baroque Lecce, and pristine coastlines offer authentic Italian charm at exceptional value. From Salento's romance to the Itria Valley's countryside, experience world-class cuisine, stunning natural light, and centuries of tradition.",
  },
  hero: {
    title: "Discover Puglia's Finest Wedding Venues",
    intro: "Experience the rustic charm and Mediterranean beauty of Italy's most enchanting wedding destination. Masserie, trulli, and whitewashed coastal towns bring authentic Italian elegance to your celebration.",
    image: "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=80",
    stats: [
      { label: "Luxury Venues", value: "150+" },
      { label: "Coastal Towns", value: "25+" },
      { label: "Wedding Planners", value: "80+" },
    ],
  },
  vibes: {
    enabled: true,
    vibes: [
      {
        id: "masseria-elegance",
        name: "Masseria Elegance",
        description: "Rustic stone estates with olive groves and timeless Puglian charm",
        icon: "🏛️",
        rgbColor: "139, 109, 27", // Gold
      },
      {
        id: "coastal-romance",
        name: "Coastal Romance",
        description: "Seaside celebrations with Adriatic views and Mediterranean magic",
        icon: "🌊",
        rgbColor: "79, 172, 254", // Blue
      },
      {
        id: "baroque-splendor",
        name: "Baroque Splendor",
        description: "Historic Lecce architecture with golden limestone elegance",
        icon: "✨",
        rgbColor: "255, 184, 82", // Warm gold
      },
      {
        id: "trulli-magic",
        name: "Trulli Magic",
        description: "Iconic cone-shaped houses in the enchanting Itria Valley",
        icon: "🏠",
        rgbColor: "240, 245, 250", // Light
      },
      {
        id: "vineyard-romance",
        name: "Vineyard Romance",
        description: "Wine country celebrations amid rolling Salento vineyards",
        icon: "🍷",
        rgbColor: "186, 85, 59", // Wine red
      },
      {
        id: "countryside-bliss",
        name: "Countryside Bliss",
        description: "Garden villas and farmhouses nestled in rural landscapes",
        icon: "🌿",
        rgbColor: "76, 175, 80", // Green
      },
    ],
  },
  featured: {
    enabled: true,
    itemIds: [], // Will be populated from venue database
    count: 6,
    displayType: "carousel",
    title: "Signature Puglia Wedding Venues",
  },
  realWeddings: {
    enabled: true,
    title: "Real Puglia Weddings",
    source: "auto",
    selectedIds: [],
  },
  layout: {
    defaultViewMode: "grid",
    itemsPerPage: 12,
  },
};

// ════════════════════════════════════════════════════════════════════════════════
// In-Memory Config Storage (Phase 1)
// In Phase 2, this will migrate to Supabase JSON columns
// ════════════════════════════════════════════════════════════════════════════════

let configStorage = {
  puglia: JSON.parse(JSON.stringify(PUGLIA_PAGE_CONFIG)),
  // Other regions can be added here
};

// ════════════════════════════════════════════════════════════════════════════════
// PUBLIC API
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Get config for a region
 * @param {string} regionSlug - Region slug (e.g., "puglia")
 * @returns {object} Page config object
 */
export function getRegionPageConfig(regionSlug) {
  if (!configStorage[regionSlug]) {
    configStorage[regionSlug] = JSON.parse(JSON.stringify(DEFAULT_PAGE_CONFIG));
  }
  return configStorage[regionSlug];
}

/**
 * Save/update config for a region
 * @param {string} regionSlug - Region slug
 * @param {object} config - Page config object
 */
export function saveRegionPageConfig(regionSlug, config) {
  configStorage[regionSlug] = JSON.parse(JSON.stringify(config));
  // TODO: In Phase 2, persist to Supabase
  // await supabase.from('region_configs').upsert({ slug: regionSlug, config })
  return configStorage[regionSlug];
}

/**
 * Update a specific section of region config
 * @param {string} regionSlug - Region slug
 * @param {string} section - Config section ("hero", "featured", "realWeddings", "layout")
 * @param {object} sectionData - New section data
 */
export function updateRegionConfigSection(regionSlug, section, sectionData) {
  const config = getRegionPageConfig(regionSlug);
  config[section] = { ...config[section], ...sectionData };
  return saveRegionPageConfig(regionSlug, config);
}

/**
 * Reset region config to defaults
 * @param {string} regionSlug - Region slug
 */
export function resetRegionPageConfig(regionSlug) {
  configStorage[regionSlug] = JSON.parse(JSON.stringify(DEFAULT_PAGE_CONFIG));
  return configStorage[regionSlug];
}

/**
 * Get all region configs (for admin overview)
 * @returns {object} All configs keyed by region slug
 */
export function getAllRegionConfigs() {
  return JSON.parse(JSON.stringify(configStorage));
}

/**
 * Initialize config for multiple regions
 * @param {array} regionSlugs - Array of region slugs
 */
export function initializeRegionConfigs(regionSlugs) {
  regionSlugs.forEach((slug) => {
    if (!configStorage[slug]) {
      configStorage[slug] = JSON.parse(JSON.stringify(DEFAULT_PAGE_CONFIG));
    }
  });
}

/**
 * Export all configs as JSON (for backup)
 */
export function exportAllConfigs() {
  return JSON.stringify(configStorage, null, 2);
}

/**
 * Import configs from JSON (for restore)
 * @param {string} jsonString - JSON string of configs
 */
export function importConfigs(jsonString) {
  try {
    const imported = JSON.parse(jsonString);
    configStorage = { ...configStorage, ...imported };
    return true;
  } catch (error) {
    console.error("Failed to import configs:", error);
    return false;
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// Helper: Validate region config structure
// ════════════════════════════════════════════════════════════════════════════════

export function validateRegionPageConfig(config) {
  const required = ["hero", "featured", "realWeddings", "layout"];
  const missing = required.filter((key) => !config.hasOwnProperty(key));

  if (missing.length > 0) {
    console.warn(`Missing config sections: ${missing.join(", ")}`);
    return false;
  }

  return true;
}

// ════════════════════════════════════════════════════════════════════════════════
// Export default for convenience
// ════════════════════════════════════════════════════════════════════════════════

export default {
  getRegionPageConfig,
  saveRegionPageConfig,
  updateRegionConfigSection,
  resetRegionPageConfig,
  getAllRegionConfigs,
  initializeRegionConfigs,
  exportAllConfigs,
  importConfigs,
  validateRegionPageConfig,
};
