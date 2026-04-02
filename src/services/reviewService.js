import { supabase } from '../lib/supabaseClient';

/**
 * Submit a new review for moderation
 * Includes:
 *   - Duplicate prevention (same email + entity + similar content within 24h)
 *   - Auto-verification: email matched against confirmed vendor_enquiries → is_verified_booking
 */
export async function submitReview(entityType, entityId, formData) {
  const { reviewer_email, review_text } = formData;

  // ── Duplicate prevention ────────────────────────────────────────────────────
  try {
    const { data: recent, error: checkError } = await supabase
      .from('reviews')
      .select('id, review_text')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('reviewer_email', reviewer_email)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(1);

    if (checkError) throw checkError;

    if (recent && recent.length > 0) {
      const existingText = recent[0].review_text || '';
      const textSimilarity = existingText.slice(0, 100) === review_text.slice(0, 100);
      const sameLengthAndEntity = existingText.length === review_text.length;

      if (textSimilarity || sameLengthAndEntity) {
        throw new Error(
          'A similar review from this email already exists. Please wait 24 hours before submitting another review for this entity.'
        );
      }
    }
  } catch (error) {
    if (error.message && error.message.includes('similar review')) {
      throw error;
    }
    console.warn('Duplicate check warning:', error.message);
  }

  // ── Enquiry verification check ──────────────────────────────────────────────
  // If reviewer email matches a confirmed booking enquiry → auto-verify
  let isVerifiedBooking = false;
  let verificationSource = null;
  try {
    const { data: enquiry } = await supabase
      .from('vendor_enquiries')
      .select('id')
      .eq('vendor_id', entityId)
      .eq('couple_email', reviewer_email)
      .in('status', ['booked', 'confirmed', 'completed'])
      .limit(1);

    if (enquiry && enquiry.length > 0) {
      isVerifiedBooking = true;
      verificationSource = 'enquiry';
    }
  } catch {
    // Verification check failing should never block submission — silently skip
  }

  // ── Insert as pending ───────────────────────────────────────────────────────
  const { data, error } = await supabase
    .from('reviews')
    .insert({
      entity_type:          entityType,
      entity_id:            entityId,
      reviewer_name:        formData.reviewer_name,
      reviewer_email:       formData.reviewer_email,
      reviewer_location:    formData.reviewer_location || null,
      reviewer_role:        formData.reviewer_role || 'couple',
      event_type:           formData.event_type || null,
      event_date:           formData.event_date || null,
      review_date:          formData.review_date || formData.event_date || null,
      overall_rating:       formData.overall_rating,
      sub_ratings:          formData.sub_ratings || {},
      review_title:         formData.review_title,
      review_text:          formData.review_text,
      moderation_status:    'pending',
      is_verified:          false,
      is_verified_booking:  isVerifiedBooking,
      verification_source:  verificationSource,
      is_public:            true,
      added_by_admin:       false,
    })
    .select()
    .single();

  if (error) throw error;
  return { ...data, isVerifiedBooking };
}

/**
 * Fetch approved reviews for public display
 * Sorted by newest first
 */
export async function fetchApprovedReviews(entityType, entityId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        id, reviewer_name, reviewer_location, reviewer_role,
        event_type, event_date, guest_count,
        overall_rating, sub_ratings,
        review_title, review_text,
        is_verified, is_verified_booking, verification_source,
        is_featured, featured_quote,
        review_date, published_at, reply_count,
        messages:review_messages(sender_type, message_body, created_at, is_internal_note)
      `)
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('moderation_status', 'approved')
      .is('deleted_at', null)
      .order('published_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Supabase error fetching approved reviews:', error);
      return [];
    }
    return data || [];
  } catch (err) {
    console.error('Error fetching approved reviews:', err);
    return [];
  }
}

/**
 * Fetch review statistics (aggregate rating, count, sub-rating averages)
 * Based on approved reviews only
 */
export async function fetchReviewStats(entityType, entityId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('moderation_status', 'approved');

    if (error) {
      console.error('Supabase error fetching review stats:', error);
      return {
        avgRating: null,
        count: 0,
        subAverages: {},
      };
    }

    if (!data || data.length === 0) {
      return {
        avgRating: null,
        count: 0,
        subAverages: {},
      };
    }

    const count = data.length;
    const avgRating = data.reduce((sum, r) => sum + Number(r.overall_rating), 0) / count;

    // Calculate sub-rating averages
    const subAverages = {};
    if (data.length > 0) {
      const allSubRatings = data.map(r => r.sub_ratings || {});
      const subKeys = new Set();
      allSubRatings.forEach(sr => Object.keys(sr).forEach(k => subKeys.add(k)));

      subKeys.forEach(key => {
        const values = allSubRatings
          .map(sr => sr[key])
          .filter(v => typeof v === 'number');
        if (values.length > 0) {
          subAverages[key] = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10;
        }
      });
    }

    return {
      avgRating: Math.round(avgRating * 10) / 10,
      count,
      subAverages,
    };
  } catch (err) {
    console.error('Error fetching review stats:', err);
    return {
      avgRating: null,
      count: 0,
      subAverages: {},
    };
  }
}

/**
 * Fetch all reviews for admin moderation
 * Filter by status and optionally by entity type
 */
export async function fetchAdminReviews({ status = 'pending', entityType = null } = {}) {
  let query = supabase
    .from('reviews')
    .select('*')
    .eq('moderation_status', status)
    .order('created_at', { ascending: false });

  if (entityType) {
    query = query.eq('entity_type', entityType);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data || [];
}

/**
 * Approve a review
 * Sets status to approved, triggers published_at and rating sync
 */
export async function approveReview(reviewId, adminNotes = null) {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      moderation_status: 'approved',
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Reject a review
 * Sets status to rejected with admin notes for the record
 */
export async function rejectReview(reviewId, adminNotes = '') {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      moderation_status: 'rejected',
      admin_notes: adminNotes || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Toggle verified status on a review
 * Admin-only action to mark a review as "Verified Couple" or similar
 */
export async function markVerified(reviewId, isVerified = true) {
  const { data, error } = await supabase
    .from('reviews')
    .update({
      is_verified: isVerified,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reviewId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

/**
 * Get review count for an entity
 * Useful for badges and quick stats
 */
export async function getReviewCount(entityType, entityId) {
  const { count, error } = await supabase
    .from('reviews')
    .select('id', { count: 'exact' })
    .eq('entity_type', entityType)
    .eq('entity_id', entityId)
    .eq('moderation_status', 'approved');

  if (error) throw error;
  return count || 0;
}
