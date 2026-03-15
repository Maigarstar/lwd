// venueContentService.js
// Manages venue content (section intros, visibility, approval status, content quality scoring)
// Supports Aura AI integration for venue summaries and editorial intelligence

import { supabase } from '../lib/supabaseClient';

/**
 * Calculate content quality score (0-100)
 * Based on: sections with intros (40), fact-checked (30), approved (30)
 */
function calculateContentScore(sectionIntros, factChecked, approved) {
  let score = 0;

  // Score sections with intros (40 points max, ~6.7 per section)
  if (sectionIntros && typeof sectionIntros === 'object') {
    const filledSections = Object.values(sectionIntros).filter(
      intro => intro && typeof intro === 'string' && intro.trim().length > 0
    ).length;
    const maxSections = Object.keys(sectionIntros).length || 6;
    score += Math.round((filledSections / maxSections) * 40);
  }

  // Score fact-checked status (30 points)
  if (factChecked === true) {
    score += 30;
  }

  // Score approval status (30 points)
  if (approved === true) {
    score += 30;
  }

  return Math.min(100, Math.max(0, score));
}

/**
 * Fetch venue content by venue_id
 * Returns content with fallback defaults if not found
 */
export async function fetchVenueContent(venueId) {
  if (!venueId) {
    console.warn('fetchVenueContent: venueId is required');
    return {
      _offline: true,
      sectionIntros: {},
      sectionVisibility: {
        overview: true,
        spaces: true,
        dining: true,
        rooms: true,
        art: true,
        golf: true,
        weddings: true,
      },
      factChecked: false,
      approved: false,
      lastReviewedAt: null,
    };
  }

  try {
    const { data, error } = await supabase
      .from('venue_content')
      .select('*')
      .eq('venue_id', venueId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found - return defaults
        return {
          _new: true,
          sectionIntros: {},
          sectionVisibility: {
            overview: true,
            spaces: true,
            dining: true,
            rooms: true,
            art: true,
            golf: true,
            weddings: true,
          },
          factChecked: false,
          approved: false,
          lastReviewedAt: null,
        };
      }
      console.error('fetchVenueContent error:', error);
      return {
        _offline: true,
        sectionIntros: {},
        sectionVisibility: {
          overview: true,
          spaces: true,
          dining: true,
          rooms: true,
          art: true,
          golf: true,
          weddings: true,
        },
        factChecked: false,
        approved: false,
        lastReviewedAt: null,
      };
    }

    // Map DB field names to camelCase
    return {
      id: data.id,
      venueId: data.venue_id,
      sectionIntros: data.section_intros || {},
      sectionVisibility: data.section_visibility || {
        overview: true,
        spaces: true,
        dining: true,
        rooms: true,
        art: true,
        golf: true,
        weddings: true,
      },
      factChecked: data.fact_checked || false,
      approved: data.approved || false,
      lastReviewedAt: data.last_reviewed_at,
      contentScore: data.content_score || 0,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('fetchVenueContent exception:', err);
    return {
      _offline: true,
      sectionIntros: {},
      sectionVisibility: {
        overview: true,
        spaces: true,
        dining: true,
        rooms: true,
        art: true,
        golf: true,
        weddings: true,
      },
      factChecked: false,
      approved: false,
      lastReviewedAt: null,
    };
  }
}

/**
 * Fetch venue content by listing slug
 * Joins with listings table to find by slug
 */
export async function fetchVenueContentBySlug(slug) {
  if (!slug) return null;

  try {
    const { data, error } = await supabase
      .from('venue_content')
      .select(`
        *,
        listings:listings(id, slug)
      `)
      .eq('listings.slug', slug)
      .single();

    if (error) {
      console.error('fetchVenueContentBySlug error:', error);
      return null;
    }

    return {
      id: data.id,
      venueId: data.venue_id,
      sectionIntros: data.section_intros || {},
      sectionVisibility: data.section_visibility || {
        overview: true,
        spaces: true,
        dining: true,
        rooms: true,
        art: true,
        golf: true,
        weddings: true,
      },
      factChecked: data.fact_checked || false,
      approved: data.approved || false,
      lastReviewedAt: data.last_reviewed_at,
      contentScore: data.content_score || 0,
      updatedBy: data.updated_by,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  } catch (err) {
    console.error('fetchVenueContentBySlug exception:', err);
    return null;
  }
}

/**
 * Save or create venue content
 * contentForm should include sectionIntros and sectionVisibility
 * adminUserId is required for editorial tracking (updated_by column)
 */
export async function saveVenueContent(venueId, contentForm, adminUserId = null) {
  if (!venueId) {
    console.warn('saveVenueContent: venueId is required');
    return {
      _offline: true,
      error: 'venueId is required',
    };
  }

  try {
    // First check if content exists
    const { data: existing, error: checkError } = await supabase
      .from('venue_content')
      .select('id')
      .eq('venue_id', venueId)
      .single();

    const sectionIntros = contentForm.sectionIntros || {};
    const sectionVisibility = contentForm.sectionVisibility || {
      overview: true,
      spaces: true,
      dining: true,
      rooms: true,
      art: true,
      golf: true,
      weddings: true,
    };

    // Calculate content score based on section quality
    const contentScore = calculateContentScore(
      sectionIntros,
      contentForm.factChecked || false,
      contentForm.approved || false
    );

    const payload = {
      section_intros: sectionIntros,
      section_visibility: sectionVisibility,
      content_score: contentScore,
      ...(adminUserId && { updated_by: adminUserId }),
    };

    let result;

    if (!checkError && existing) {
      // Update existing
      result = await supabase
        .from('venue_content')
        .update(payload)
        .eq('venue_id', venueId)
        .select()
        .single();
    } else {
      // Create new
      result = await supabase
        .from('venue_content')
        .insert({
          venue_id: venueId,
          ...payload,
        })
        .select()
        .single();
    }

    if (result.error) {
      console.error('saveVenueContent error:', result.error);
      return {
        _offline: true,
        error: result.error.message,
      };
    }

    return {
      id: result.data.id,
      venueId: result.data.venue_id,
      sectionIntros: result.data.section_intros,
      sectionVisibility: result.data.section_visibility,
      factChecked: result.data.fact_checked,
      approved: result.data.approved,
      lastReviewedAt: result.data.last_reviewed_at,
      contentScore: result.data.content_score,
      updatedBy: result.data.updated_by,
      updatedAt: result.data.updated_at,
    };
  } catch (err) {
    console.error('saveVenueContent exception:', err);
    return {
      _offline: true,
      error: err.message,
    };
  }
}

/**
 * Mark venue content as fact-checked
 * Recalculates content_score when fact-checked status changes
 */
export async function markFactChecked(venueId, adminUserId = null) {
  if (!venueId) return null;

  try {
    // First fetch current content to recalculate score
    const { data: current, error: fetchError } = await supabase
      .from('venue_content')
      .select('section_intros, fact_checked, approved')
      .eq('venue_id', venueId)
      .single();

    if (fetchError || !current) {
      console.error('markFactChecked fetch error:', fetchError);
      return null;
    }

    // Recalculate content score with new fact_checked status
    const contentScore = calculateContentScore(
      current.section_intros,
      true, // fact_checked = true
      current.approved
    );

    const updatePayload = {
      fact_checked: true,
      content_score: contentScore,
      ...(adminUserId && { updated_by: adminUserId }),
    };

    const { data, error } = await supabase
      .from('venue_content')
      .update(updatePayload)
      .eq('venue_id', venueId)
      .select()
      .single();

    if (error) {
      console.error('markFactChecked error:', error);
      return null;
    }

    return {
      id: data.id,
      venueId: data.venue_id,
      factChecked: data.fact_checked,
      approved: data.approved,
      contentScore: data.content_score,
      updatedBy: data.updated_by,
      lastReviewedAt: data.last_reviewed_at,
    };
  } catch (err) {
    console.error('markFactChecked exception:', err);
    return null;
  }
}

/**
 * Approve venue content
 * Sets approved=true and last_reviewed_at=NOW()
 * Recalculates content_score when approval status changes
 */
export async function approveContent(venueId, adminUserId = null) {
  if (!venueId) return null;

  try {
    // First fetch current content to recalculate score
    const { data: current, error: fetchError } = await supabase
      .from('venue_content')
      .select('section_intros, fact_checked, approved')
      .eq('venue_id', venueId)
      .single();

    if (fetchError || !current) {
      console.error('approveContent fetch error:', fetchError);
      return null;
    }

    // Recalculate content score with new approved status
    const contentScore = calculateContentScore(
      current.section_intros,
      current.fact_checked,
      true // approved = true
    );

    const updatePayload = {
      approved: true,
      last_reviewed_at: new Date().toISOString(),
      content_score: contentScore,
      ...(adminUserId && { updated_by: adminUserId }),
    };

    const { data, error } = await supabase
      .from('venue_content')
      .update(updatePayload)
      .eq('venue_id', venueId)
      .select()
      .single();

    if (error) {
      console.error('approveContent error:', error);
      return null;
    }

    return {
      id: data.id,
      venueId: data.venue_id,
      approved: data.approved,
      factChecked: data.fact_checked,
      contentScore: data.content_score,
      updatedBy: data.updated_by,
      lastReviewedAt: data.last_reviewed_at,
    };
  } catch (err) {
    console.error('approveContent exception:', err);
    return null;
  }
}

/**
 * Fetch venues ranked by content quality score
 * Used by Aura AI to identify venues with best editorial content
 * Returns venues with score >= minScore, ordered by score DESC
 */
export async function fetchVenuesByContentScore(minScore = 0, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('venue_content')
      .select(`
        id,
        venue_id,
        section_intros,
        content_score,
        approved,
        fact_checked,
        last_reviewed_at,
        updated_by,
        listings:listings(id, name, slug, location)
      `)
      .gte('content_score', minScore)
      .order('content_score', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('fetchVenuesByContentScore error:', error);
      return [];
    }

    return data.map(row => ({
      id: row.id,
      venueId: row.venue_id,
      venueName: row.listings?.name,
      venueSlug: row.listings?.slug,
      venueLocation: row.listings?.location,
      sectionIntros: row.section_intros || {},
      contentScore: row.content_score,
      approved: row.approved,
      factChecked: row.fact_checked,
      lastReviewedAt: row.last_reviewed_at,
      updatedBy: row.updated_by,
    }));
  } catch (err) {
    console.error('fetchVenuesByContentScore exception:', err);
    return [];
  }
}

/**
 * Get content quality statistics across all venues
 * Used by Aura AI and admin dashboards for insights
 */
export async function getContentQualityStats() {
  try {
    const { data, error } = await supabase
      .from('venue_content')
      .select('content_score, approved, fact_checked');

    if (error) {
      console.error('getContentQualityStats error:', error);
      return null;
    }

    const totalVenues = data.length;
    const approvedCount = data.filter(v => v.approved).length;
    const factCheckedCount = data.filter(v => v.fact_checked).length;
    const avgScore = data.length > 0
      ? Math.round(data.reduce((sum, v) => sum + (v.content_score || 0), 0) / data.length)
      : 0;

    return {
      totalVenues,
      approvedCount,
      approvedPercentage: totalVenues > 0 ? Math.round((approvedCount / totalVenues) * 100) : 0,
      factCheckedCount,
      factCheckedPercentage: totalVenues > 0 ? Math.round((factCheckedCount / totalVenues) * 100) : 0,
      averageContentScore: avgScore,
      maxContentScore: Math.max(...data.map(v => v.content_score || 0)),
      minContentScore: Math.min(...data.map(v => v.content_score || 0)),
    };
  } catch (err) {
    console.error('getContentQualityStats exception:', err);
    return null;
  }
}
