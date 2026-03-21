// ─── venueIntelligenceService.js ─────────────────────────────────────────────
// Fetch and update functions for the venue_intelligence table.
// This is the single source of truth for structured venue data.
// Used by: listing pages, showcase pages, Aura AI layer.
// ─────────────────────────────────────────────────────────────────────────────
import { supabase } from '../lib/supabaseClient';

// ── Formatters ─────────────────────────────────────────────────────────────────
/** Convert pence (integer) to a display string: 250000 → "£2,500" */
export function formatPrice(pence, currency = 'GBP') {
  if (pence == null) return null;
  const symbol = currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  const value = pence / 100;
  return `${symbol}${value.toLocaleString('en-GB', { maximumFractionDigits: 0 })}`;
}

/** Format a price range: "£45,000 – £120,000" */
export function formatPriceRange(minPence, maxPence, currency = 'GBP') {
  const lo = formatPrice(minPence, currency);
  const hi = formatPrice(maxPence, currency);
  if (lo && hi) return `${lo} – ${hi}`;
  if (lo) return `From ${lo}`;
  if (hi) return `Up to ${hi}`;
  return null;
}

/** Format verified_at timestamp to "March 2026" */
export function formatVerifiedDate(isoString) {
  if (!isoString) return null;
  return new Date(isoString).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

// ── Queries ────────────────────────────────────────────────────────────────────

/**
 * Fetch venue intelligence by slug.
 * Used by showcase pages and listing pages to populate the At a Glance +
 * Pricing + Verified components.
 *
 * @param {string} slug - e.g. "the-ritz-london"
 * @returns {Promise<object|null>}
 */
export async function fetchVenueIntelligence(slug) {
  const { data, error } = await supabase
    .from('venue_intelligence')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // not found — graceful
    console.warn('[venueIntelligenceService] fetch error:', error.message);
    return null;
  }
  return data;
}

/**
 * Fetch intelligence for multiple slugs (e.g. for a listing index page).
 * @param {string[]} slugs
 */
export async function fetchVenueIntelligenceBatch(slugs) {
  const { data, error } = await supabase
    .from('venue_intelligence')
    .select('*')
    .in('slug', slugs);

  if (error) {
    console.warn('[venueIntelligenceService] batch fetch error:', error.message);
    return [];
  }
  return data || [];
}

/**
 * Upsert venue intelligence row (admin use only — requires service role).
 * @param {object} record - must include slug + venue_name
 */
export async function upsertVenueIntelligence(record) {
  const { data, error } = await supabase
    .from('venue_intelligence')
    .upsert(
      { ...record, updated_at: new Date().toISOString() },
      { onConflict: 'slug', ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) throw new Error(`[venueIntelligenceService] upsert error: ${error.message}`);
  return data;
}
