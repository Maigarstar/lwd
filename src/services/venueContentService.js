// venueContentService.js
// Manages venue content (section intros, visibility, approval status)

import { supabase } from '../lib/supabaseClient';

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
 */
export async function saveVenueContent(venueId, contentForm) {
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

    const payload = {
      section_intros: contentForm.sectionIntros || {},
      section_visibility: contentForm.sectionVisibility || {
        overview: true,
        spaces: true,
        dining: true,
        rooms: true,
        art: true,
        golf: true,
        weddings: true,
      },
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
 */
export async function markFactChecked(venueId) {
  if (!venueId) return null;

  try {
    const { data, error } = await supabase
      .from('venue_content')
      .update({ fact_checked: true })
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
 */
export async function approveContent(venueId) {
  if (!venueId) return null;

  try {
    const { data, error } = await supabase
      .from('venue_content')
      .update({
        approved: true,
        last_reviewed_at: new Date().toISOString(),
      })
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
      lastReviewedAt: data.last_reviewed_at,
    };
  } catch (err) {
    console.error('approveContent exception:', err);
    return null;
  }
}
