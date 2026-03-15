/**
 * platformSettingsService.ts
 * Manages global platform settings (editorial curation feature toggle, etc.)
 * Uses localStorage for persistence (can be upgraded to Supabase in future)
 */

export interface PlatformSettings {
  editorial_curation_enabled: boolean;
}

const STORAGE_KEY = 'lwd_platform_settings';

// Default settings
const DEFAULT_SETTINGS: PlatformSettings = {
  editorial_curation_enabled: true,
};

/**
 * Get all platform settings
 */
export function getPlatformSettings(): PlatformSettings {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch (e) {
    console.error('Error reading platform settings:', e);
  }
  return DEFAULT_SETTINGS;
}

/**
 * Get a specific platform setting
 */
export function getPlatformSetting(key: keyof PlatformSettings): boolean {
  const settings = getPlatformSettings();
  return settings[key] ?? DEFAULT_SETTINGS[key];
}

/**
 * Update platform settings
 */
export function setPlatformSettings(updates: Partial<PlatformSettings>): PlatformSettings {
  try {
    const current = getPlatformSettings();
    const updated = { ...current, ...updates };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (e) {
    console.error('Error saving platform settings:', e);
    return getPlatformSettings();
  }
}

/**
 * Update a specific platform setting
 */
export function setPlatformSetting(key: keyof PlatformSettings, value: boolean): PlatformSettings {
  return setPlatformSettings({ [key]: value });
}

/**
 * Check if editorial curation is enabled globally
 */
export function isEditorialCurationEnabled(): boolean {
  return getPlatformSetting('editorial_curation_enabled');
}

/**
 * Toggle editorial curation feature
 */
export function toggleEditorialCuration(): boolean {
  const current = isEditorialCurationEnabled();
  setPlatformSetting('editorial_curation_enabled', !current);
  return !current;
}
