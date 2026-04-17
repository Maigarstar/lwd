/**
 * magazineBrandKitService.js
 * CRUD for the single-row magazine_brand_kit table.
 */

import { supabase } from '../lib/supabaseClient';
import { uploadViaEdgeFunction } from './magazinePageService';

const TABLE = 'magazine_brand_kit';

/**
 * Fetch the brand kit (single row).
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function fetchBrandKit() {
  const { data, error } = await supabase.from(TABLE).select('*').limit(1).single();
  return { data, error };
}

/**
 * Upsert brand kit updates.
 * @param {Object} updates - Fields to update
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function saveBrandKit(updates) {
  const { data, error } = await supabase.from(TABLE).upsert(updates).select().single();
  return { data, error };
}

/**
 * Upload a brand logo to storage and return its public URL.
 * @param {File} file - Image file to upload
 * @param {'light'|'dark'} variant - Which logo variant (light = for dark bg, dark = for light bg)
 * @returns {{ publicUrl: string|null, error: Error|null }}
 */
export async function uploadBrandLogo(file, variant = 'light') {
  try {
    const ext  = file.name.split('.').pop().toLowerCase();
    const path = `brand-kit/logo-${variant}.${ext}`;
    const contentType = file.type || (ext === 'svg' ? 'image/svg+xml' : 'image/jpeg');
    const result = await uploadViaEdgeFunction({ bucket: 'magazine-covers', path, blob: file, contentType });
    return { publicUrl: result.publicUrl, error: null };
  } catch (error) {
    return { publicUrl: null, error };
  }
}
