import { supabase } from '../lib/supabaseClient';

/**
 * Admin Review Management Service
 * Handles delete, edit, approve, reject, and search operations on reviews
 */

/**
 * Fetch all reviews for admin moderation with optional filtering
 */
export async function fetchAdminReviews({
  status = null, // 'pending' | 'approved' | 'rejected'
  entityType = null, // 'venue' | 'blog' | 'showcase'
  searchQuery = null,
  limit = 50,
  offset = 0,
} = {}) {
  try {
    let query = supabase
      .from('reviews')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq('moderation_status', status);
    }
    if (entityType) {
      query = query.eq('entity_type', entityType);
    }

    // Apply search across reviewer name, email, and review text
    if (searchQuery) {
      query = query.or(
        `reviewer_name.ilike.%${searchQuery}%,reviewer_email.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%`
      );
    }

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return {
      reviews: data || [],
      total: count || 0,
    };
  } catch (err) {
    console.error('Error fetching admin reviews:', err);
    throw err;
  }
}

/**
 * Get a single review by ID
 */
export async function getReviewById(reviewId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .eq('id', reviewId)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error fetching review:', err);
    throw err;
  }
}

/**
 * Update review (text, ratings, approval status)
 */
export async function updateReview(reviewId, updates) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', reviewId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error updating review:', err);
    throw err;
  }
}

/**
 * Approve a review
 */
export async function approveReview(reviewId, adminNotes = null) {
  return updateReview(reviewId, {
    moderation_status: 'approved',
    admin_notes: adminNotes,
    published_at: new Date().toISOString(),
  });
}

/**
 * Reject a review
 */
export async function rejectReview(reviewId, adminNotes = '') {
  return updateReview(reviewId, {
    moderation_status: 'rejected',
    admin_notes: adminNotes,
  });
}

/**
 * Soft delete a review (mark as deleted but keep in DB for records)
 */
export async function softDeleteReview(reviewId, reason = null) {
  return updateReview(reviewId, {
    deleted_at: new Date().toISOString(),
    deletion_reason: reason,
  });
}

/**
 * Permanently delete a review (hard delete from DB)
 * Use cautiously - this is permanent
 */
export async function hardDeleteReview(reviewId) {
  try {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', reviewId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('Error deleting review:', err);
    throw err;
  }
}

/**
 * Bulk approve multiple reviews
 */
export async function bulkApproveReviews(reviewIds, adminNotes = null) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        moderation_status: 'approved',
        admin_notes: adminNotes,
        published_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', reviewIds)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error bulk approving reviews:', err);
    throw err;
  }
}

/**
 * Bulk reject multiple reviews
 */
export async function bulkRejectReviews(reviewIds, adminNotes = '') {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        moderation_status: 'rejected',
        admin_notes: adminNotes,
        updated_at: new Date().toISOString(),
      })
      .in('id', reviewIds)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error bulk rejecting reviews:', err);
    throw err;
  }
}

/**
 * Bulk delete multiple reviews (soft delete)
 */
export async function bulkSoftDeleteReviews(reviewIds, reason = null) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_reason: reason,
        updated_at: new Date().toISOString(),
      })
      .in('id', reviewIds)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('Error bulk deleting reviews:', err);
    throw err;
  }
}

/**
 * Get review statistics for dashboard
 */
export async function getReviewStats() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('moderation_status, entity_type');

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(r => r.moderation_status === 'pending').length,
      approved: data.filter(r => r.moderation_status === 'approved').length,
      rejected: data.filter(r => r.moderation_status === 'rejected').length,
      byType: {},
    };

    // Count by entity type
    data.forEach(r => {
      stats.byType[r.entity_type] = (stats.byType[r.entity_type] || 0) + 1;
    });

    return stats;
  } catch (err) {
    console.error('Error fetching review stats:', err);
    throw err;
  }
}
