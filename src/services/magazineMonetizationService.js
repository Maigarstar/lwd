/**
 * magazineMonetizationService.js
 *
 * Service layer for Tier 4 magazine monetization:
 *   - Ad placement CRUD for magazine_ad_placements
 *   - Paywall settings on magazine_issues
 *   - Reader-side impression / click tracking via RPC
 *   - Issue revenue summary aggregation
 */

import { supabase } from '../lib/supabaseClient';

const TABLE = 'magazine_ad_placements';

// ── Ad Placements ─────────────────────────────────────────────────────────────

/**
 * Fetch all ad placements for an issue, ordered by page number.
 * @param {string} issueId
 * @returns {{ data: Array, error: Error|null }}
 */
export async function fetchAdPlacements(issueId) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('issue_id', issueId)
      .order('page_number', { ascending: true });
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (error) {
    return { data: [], error };
  }
}

/**
 * Upsert a single ad placement. If `placement.id` is present, updates that
 * row; otherwise inserts a new one.
 * @param {Object} placement — must include issue_id and page_number
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function upsertAdPlacement(placement) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .upsert(placement, { onConflict: 'id' })
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * Delete a placement by id.
 * @param {string} id
 * @returns {{ error: Error|null }}
 */
export async function deleteAdPlacement(id) {
  try {
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id);
    if (error) throw error;
    return { error: null };
  } catch (error) {
    return { error };
  }
}

// ── Reader-side analytics (fire-and-forget) ───────────────────────────────────

/**
 * Increment the impressions counter for a placement.
 * Designed to be called without awaiting — failures are silently ignored.
 * @param {string} placementId
 */
export async function trackAdImpression(placementId) {
  try {
    await supabase.rpc('increment_ad_stat', {
      p_placement_id: placementId,
      p_field: 'impressions',
    });
  } catch {
    // non-blocking — analytics loss is acceptable
  }
}

/**
 * Increment the clicks counter for a placement.
 * Designed to be called without awaiting — failures are silently ignored.
 * @param {string} placementId
 */
export async function trackAdClick(placementId) {
  try {
    await supabase.rpc('increment_ad_stat', {
      p_placement_id: placementId,
      p_field: 'clicks',
    });
  } catch {
    // non-blocking — analytics loss is acceptable
  }
}

// ── Paywall settings ──────────────────────────────────────────────────────────

/**
 * Update paywall settings on a magazine issue.
 * @param {string} issueId
 * @param {{ paywallEnabled: boolean, freePageCount: number }} settings
 * @returns {{ data: Object|null, error: Error|null }}
 */
export async function updatePaywallSettings(issueId, { paywallEnabled, freePageCount }) {
  try {
    const { data, error } = await supabase
      .from('magazine_issues')
      .update({
        paywall_enabled: paywallEnabled,
        free_page_count: freePageCount,
      })
      .eq('id', issueId)
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

// ── Revenue summary ───────────────────────────────────────────────────────────

/**
 * Aggregate revenue and engagement metrics for all placements in an issue.
 * @param {string} issueId
 * @returns {{
 *   totalRevenue: number,
 *   placementCount: number,
 *   totalImpressions: number,
 *   totalClicks: number,
 *   avgCtr: number        — expressed as a percentage, e.g. 2.34
 * }}
 */
export async function getIssueRevenueSummary(issueId) {
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('rate_card_gbp, impressions, clicks, is_active')
      .eq('issue_id', issueId);
    if (error) throw error;

    const rows = data || [];
    const totalRevenue    = rows.reduce((sum, r) => sum + (parseFloat(r.rate_card_gbp) || 0), 0);
    const placementCount  = rows.length;
    const totalImpressions = rows.reduce((sum, r) => sum + (r.impressions || 0), 0);
    const totalClicks     = rows.reduce((sum, r) => sum + (r.clicks || 0), 0);
    const avgCtr          = totalImpressions > 0
      ? parseFloat(((totalClicks / totalImpressions) * 100).toFixed(2))
      : 0;

    return { totalRevenue, placementCount, totalImpressions, totalClicks, avgCtr, error: null };
  } catch (error) {
    return { totalRevenue: 0, placementCount: 0, totalImpressions: 0, totalClicks: 0, avgCtr: 0, error };
  }
}
