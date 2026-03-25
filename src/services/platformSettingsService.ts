import { supabase } from '../lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Platform Settings Service
// Manages global feature toggles stored in platform_settings table
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Fetch a platform setting by key
 * Returns null if setting not found
 */
export async function getPlatformSetting(settingKey: string) {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('setting_value')
      .eq('setting_key', settingKey)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Row not found - return null
        return null;
      }
      console.error(`getPlatformSetting error for ${settingKey}:`, error);
      return null;
    }

    return data?.setting_value;
  } catch (err) {
    console.error(`getPlatformSetting exception for ${settingKey}:`, err);
    return null;
  }
}

/**
 * Update a platform setting by key
 * Creates the setting if it doesn't exist
 */
export async function updatePlatformSetting(settingKey: string, settingValue: any) {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .upsert(
        { setting_key: settingKey, setting_value: settingValue },
        { onConflict: 'setting_key' }
      )
      .select();

    if (error) {
      console.error(`updatePlatformSetting error for ${settingKey}:`, error);
      return null;
    }

    return data?.[0];
  } catch (err) {
    console.error(`updatePlatformSetting exception for ${settingKey}:`, err);
    return null;
  }
}

/**
 * Check if editorial curation feature is enabled globally
 * Default: true (feature is enabled)
 */
export async function isEditorialCurationEnabled(): Promise<boolean> {
  try {
    const setting = await getPlatformSetting('editorial_curation_enabled');
    if (!setting) {
      // Default to true if not set
      return true;
    }
    return setting.enabled === true;
  } catch (err) {
    console.error('isEditorialCurationEnabled exception:', err);
    return true; // Default to enabled on error
  }
}

/**
 * Toggle editorial curation feature globally
 */
export async function setEditorialCurationEnabled(enabled: boolean) {
  return updatePlatformSetting('editorial_curation_enabled', { enabled });
}

/**
 * Cache for global settings (avoid repeated DB queries)
 * Invalidate after ~5 minutes
 */
const settingsCache: {
  [key: string]: { value: any; timestamp: number };
} = {};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch editorial curation enabled status with caching
 * Avoids hitting database on every page render
 */
export async function isEditorialCurationEnabledCached(): Promise<boolean> {
  const key = 'editorial_curation_enabled';
  const now = Date.now();

  // Return cached value if fresh
  if (settingsCache[key] && now - settingsCache[key].timestamp < CACHE_TTL) {
    return settingsCache[key].value === true;
  }

  // Fetch fresh value
  const enabled = await isEditorialCurationEnabled();

  // Cache the result
  settingsCache[key] = { value: enabled, timestamp: now };

  return enabled;
}

/**
 * Invalidate settings cache
 * Call after updating any platform settings
 */
export function invalidateSettingsCache() {
  for (const key in settingsCache) {
    delete settingsCache[key];
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Homepage Destination Grid
// Keys: homepage_destination_grid_enabled  →  { enabled: boolean }
//        homepage_country_overrides        →  { [slug: string]: boolean }
// ─────────────────────────────────────────────────────────────────────────────

/** Master switch — is the Browse Iconic Destinations grid shown on homepage? */
export async function getHomepageDestinationGridEnabled(): Promise<boolean> {
  const setting = await getPlatformSetting('homepage_destination_grid_enabled');
  if (setting === null || setting === undefined) return true; // default ON
  return setting?.enabled !== false;
}

export async function setHomepageDestinationGridEnabled(enabled: boolean) {
  return updatePlatformSetting('homepage_destination_grid_enabled', { enabled });
}

/**
 * Per-country overrides map.
 * Returns e.g. { france: false, england: true }
 * Only slugs explicitly toggled in admin are stored.
 * Missing slug → fall back to countryRegistry showOnHomepage default.
 */
export async function getCountryHomepageOverrides(): Promise<Record<string, boolean>> {
  const setting = await getPlatformSetting('homepage_country_overrides');
  if (!setting || typeof setting !== 'object') return {};
  return setting as Record<string, boolean>;
}

export async function setCountryHomepageOverride(slug: string, enabled: boolean) {
  const current = await getCountryHomepageOverrides();
  const updated = { ...current, [slug]: enabled };
  return updatePlatformSetting('homepage_country_overrides', updated);
}

/**
 * Load all homepage destination grid settings in one call.
 * Used by main.jsx on mount to avoid two sequential fetches.
 */
export async function getHomepageDestinationSettings(): Promise<{
  gridEnabled: boolean;
  countryOverrides: Record<string, boolean>;
}> {
  const [gridEnabled, countryOverrides] = await Promise.all([
    getHomepageDestinationGridEnabled(),
    getCountryHomepageOverrides(),
  ]);
  return { gridEnabled, countryOverrides };
}

/**
 * Retrieve all platform settings at once
 * Useful for admin dashboards
 */
export async function getAllPlatformSettings() {
  try {
    const { data, error } = await supabase
      .from('platform_settings')
      .select('*')
      .order('setting_key');

    if (error) {
      console.error('getAllPlatformSettings error:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('getAllPlatformSettings exception:', err);
    return [];
  }
}
