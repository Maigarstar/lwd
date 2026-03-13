/**
 * Artistry Awards Service
 * Handles vendor submissions and admin review for The Wedding Artistry Awards 2026.
 *
 * Table: artistry_submissions
 * Columns:
 *   id            uuid PK
 *   vendor_id     text (vendor's legacy_vendor_id or auth user_id)
 *   vendor_name   text
 *   category      text
 *   location      text
 *   country       text
 *   quote         text
 *   micro_different  text
 *   micro_moment     text
 *   micro_perfect    text
 *   images        text[]  (up to 5 public URLs)
 *   video_url     text
 *   status        text  ('pending' | 'approved' | 'rejected')
 *   admin_note    text
 *   submitted_at  timestamptz
 *   reviewed_at   timestamptz
 *   featured      boolean default false
 */

import { supabase } from '../lib/supabaseClient';

// ── Vendor: get my submission (one per vendor per year) ───────────────────────
export async function getMySubmission(vendorId) {
  try {
    const { data, error } = await supabase
      .from('artistry_submissions')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('getMySubmission:', err);
    return { data: null, error: err };
  }
}

// ── Vendor: create or update submission ───────────────────────────────────────
export async function upsertSubmission(vendorId, payload) {
  try {
    // Check if one already exists
    const { data: existing } = await getMySubmission(vendorId);

    const record = {
      vendor_id:       vendorId,
      vendor_name:     payload.vendor_name,
      category:        payload.category,
      location:        payload.location,
      country:         payload.country,
      quote:           payload.quote,
      micro_different: payload.micro_different,
      micro_moment:    payload.micro_moment,
      micro_perfect:   payload.micro_perfect,
      images:          payload.images || [],
      video_url:       payload.video_url || null,
      status:          existing?.status === 'approved' ? 'approved' : 'pending',
      submitted_at:    new Date().toISOString(),
    };

    let result;
    if (existing?.id) {
      // Only allow re-submit if rejected or pending (not approved)
      if (existing.status === 'approved') {
        return { data: existing, error: null, alreadyApproved: true };
      }
      const { data, error } = await supabase
        .from('artistry_submissions')
        .update(record)
        .eq('id', existing.id)
        .select()
        .single();
      result = { data, error };
    } else {
      const { data, error } = await supabase
        .from('artistry_submissions')
        .insert(record)
        .select()
        .single();
      result = { data, error };
    }

    if (result.error) throw result.error;
    return { data: result.data, error: null };
  } catch (err) {
    console.error('upsertSubmission:', err);
    return { data: null, error: err };
  }
}

// ── Admin: get all submissions ────────────────────────────────────────────────
export async function getAllSubmissions(statusFilter = null) {
  try {
    let query = supabase
      .from('artistry_submissions')
      .select('*')
      .order('submitted_at', { ascending: false });

    if (statusFilter && statusFilter !== 'all') {
      query = query.eq('status', statusFilter);
    }

    const { data, error } = await query;
    if (error) throw error;
    return { data: data || [], error: null };
  } catch (err) {
    console.error('getAllSubmissions:', err);
    return { data: [], error: err };
  }
}

// ── Admin: approve / reject submission ───────────────────────────────────────
export async function reviewSubmission(id, status, adminNote = '') {
  try {
    const { data, error } = await supabase
      .from('artistry_submissions')
      .update({
        status,
        admin_note:   adminNote,
        reviewed_at:  new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('reviewSubmission:', err);
    return { data: null, error: err };
  }
}

// ── Admin: toggle featured ────────────────────────────────────────────────────
export async function toggleFeatured(id, featured) {
  try {
    const { data, error } = await supabase
      .from('artistry_submissions')
      .update({ featured })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { data, error: null };
  } catch (err) {
    console.error('toggleFeatured:', err);
    return { data: null, error: err };
  }
}

// ── Public: get approved submissions (for the awards page) ───────────────────
export async function getApprovedArtists() {
  try {
    const { data, error } = await supabase
      .from('artistry_submissions')
      .select('*')
      .eq('status', 'approved')
      .order('featured', { ascending: false })
      .order('reviewed_at', { ascending: false });

    if (error) throw error;

    // Transform to the shape ArtistryPage/ArtistCard expect
    return {
      data: (data || []).map(r => ({
        id:       r.id,
        name:     r.vendor_name,
        category: r.category,
        location: r.location,
        country:  r.country,
        quote:    r.quote,
        microPrompts: {
          different:  r.micro_different,
          momentFor:  r.micro_moment,
          perfectDay: r.micro_perfect,
        },
        image:    r.images?.[0] || null,
        gallery:  r.images?.slice(1) || [],
        videoUrl: r.video_url || null,
        featured: r.featured || false,
        type:     'image',
      })),
      error: null,
    };
  } catch (err) {
    console.error('getApprovedArtists:', err);
    return { data: [], error: err };
  }
}
