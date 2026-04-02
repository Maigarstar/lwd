import { supabase } from '../lib/supabaseClient';

// ─── Fetch reviews with listing + owner identity joined ───────────────────────
// contact_profile JSONB on listings contains: { name, title, email, phone, whatsapp }
// vendor_account_id links to the platform vendor account if claimed

export async function fetchAdminReviews({
  status = null,
  entityType = null,
  searchQuery = null,
  addedByAdmin = null,
  showDeleted = false,
  limit = 20,
  offset = 0,
} = {}) {
  try {
    let query = supabase
      .from('reviews')
      .select(`
        *,
        listing:listings!entity_id (
          id,
          name,
          slug,
          vendor_account_id,
          contact_profile,
          reputation_score,
          reply_rate,
          review_count
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false });

    if (showDeleted) {
      query = query.not('deleted_at', 'is', null);
    } else {
      query = query.is('deleted_at', null);
    }

    if (status) query = query.eq('moderation_status', status);
    if (entityType) query = query.eq('entity_type', entityType);
    if (addedByAdmin !== null) query = query.eq('added_by_admin', addedByAdmin);

    if (searchQuery) {
      query = query.or(
        `reviewer_name.ilike.%${searchQuery}%,reviewer_email.ilike.%${searchQuery}%,review_text.ilike.%${searchQuery}%,review_title.ilike.%${searchQuery}%`
      );
    }

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;
    if (error) throw error;

    return { reviews: data || [], total: count || 0 };
  } catch (err) {
    console.error('fetchAdminReviews error:', err);
    throw err;
  }
}

// ─── Single review ────────────────────────────────────────────────────────────

export async function getReviewById(reviewId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select(`
        *,
        listing:listings!entity_id (
          id, name, slug,
          vendor_account_id, contact_profile,
          reputation_score, reply_rate, review_count
        )
      `)
      .eq('id', reviewId)
      .is('deleted_at', null)
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('getReviewById error:', err);
    throw err;
  }
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getReviewStats() {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('moderation_status, entity_type')
      .is('deleted_at', null);

    if (error) throw error;

    const stats = {
      total: data.length,
      pending: data.filter(r => r.moderation_status === 'pending').length,
      approved: data.filter(r => r.moderation_status === 'approved').length,
      rejected: data.filter(r => r.moderation_status === 'rejected').length,
      awaiting_reply: data.filter(r => r.moderation_status === 'awaiting_reply').length,
      replied: data.filter(r => r.moderation_status === 'replied').length,
      byType: {},
    };

    data.forEach(r => {
      stats.byType[r.entity_type] = (stats.byType[r.entity_type] || 0) + 1;
    });

    return stats;
  } catch (err) {
    console.error('getReviewStats error:', err);
    throw err;
  }
}

// ─── Update review ────────────────────────────────────────────────────────────

export async function updateReview(reviewId, updates) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .is('deleted_at', null)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('updateReview error:', err);
    throw err;
  }
}

// ─── Moderation actions ───────────────────────────────────────────────────────

async function sendReviewNotification(type, reviewData) {
  // Fire-and-forget — never blocks moderation action
  try {
    if (!reviewData?.reviewer_email) return;
    const subjects = {
      approved: 'Your review has been published — Luxury Wedding Directory',
      rejected: 'Update on your review — Luxury Wedding Directory',
    };
    const bodies = {
      approved: `Hi ${reviewData.reviewer_name || 'there'},\n\nThank you — your review has been verified and published on the Luxury Wedding Directory.\n\nWe appreciate you sharing your experience.\n\nThe LWD Team`,
      rejected: `Hi ${reviewData.reviewer_name || 'there'},\n\nThank you for submitting your review. After moderation, we were unable to publish it at this time.\n\nIf you have questions, please contact our team.\n\nThe LWD Team`,
    };
    const { supabase: sb } = await import('../lib/supabaseClient');
    await sb.functions.invoke('send-email', {
      body: {
        to: reviewData.reviewer_email,
        subject: subjects[type],
        text: bodies[type],
      },
    });
  } catch { /* silent — notification failure must never block moderation */ }
}

export async function approveReview(reviewId, adminNotes = null) {
  const data = await updateReview(reviewId, {
    moderation_status: 'approved',
    admin_notes: adminNotes,
    is_public: true,
  });
  sendReviewNotification('approved', data);
  return data;
}

export async function rejectReview(reviewId, adminNotes = '') {
  const data = await updateReview(reviewId, {
    moderation_status: 'rejected',
    admin_notes: adminNotes,
    is_public: false,
  });
  sendReviewNotification('rejected', data);
  return data;
}

export async function markAwaitingReply(reviewId) {
  return updateReview(reviewId, { moderation_status: 'awaiting_reply' });
}

export async function markReplied(reviewId) {
  return updateReview(reviewId, { moderation_status: 'replied' });
}

export async function toggleFeatured(reviewId, isFeatured, featuredQuote = null) {
  return updateReview(reviewId, {
    is_featured: isFeatured,
    featured_quote: isFeatured ? featuredQuote : null,
  });
}

export async function setVerification(reviewId, isVerifiedBooking, source = 'manual') {
  return updateReview(reviewId, {
    is_verified_booking: isVerifiedBooking,
    verification_source: isVerifiedBooking ? source : null,
    is_verified: isVerifiedBooking,
  });
}

// ─── Soft delete ──────────────────────────────────────────────────────────────

export async function softDeleteReview(reviewId, reason = null) {
  return updateReview(reviewId, {
    deleted_at: new Date().toISOString(),
    deletion_reason: reason,
    is_public: false,
  });
}

export async function hardDeleteReview(reviewId) {
  try {
    const { error } = await supabase.from('reviews').delete().eq('id', reviewId);
    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('hardDeleteReview error:', err);
    throw err;
  }
}

export async function restoreReview(reviewId) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({ deleted_at: null, deletion_reason: null, updated_at: new Date().toISOString() })
      .eq('id', reviewId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } catch (err) {
    console.error('restoreReview error:', err);
    throw err;
  }
}

// ─── Vendor-facing reviews (for vendor dashboard reply flow) ──────────────────

export async function fetchVendorReviews(entityId, { limit = 20, offset = 0 } = {}) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .select('*, messages:review_messages(id, sender_type, message_body, created_at, is_internal_note)')
      .eq('entity_id', entityId)
      .in('moderation_status', ['approved', 'awaiting_reply', 'replied'])
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchVendorReviews error:', err);
    return [];
  }
}

// ─── Bulk actions ─────────────────────────────────────────────────────────────

export async function bulkApproveReviews(reviewIds, adminNotes = null) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        moderation_status: 'approved',
        admin_notes: adminNotes,
        is_public: true,
        updated_at: new Date().toISOString(),
      })
      .in('id', reviewIds)
      .is('deleted_at', null)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('bulkApproveReviews error:', err);
    throw err;
  }
}

export async function bulkRejectReviews(reviewIds, adminNotes = '') {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        moderation_status: 'rejected',
        admin_notes: adminNotes,
        is_public: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', reviewIds)
      .is('deleted_at', null)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('bulkRejectReviews error:', err);
    throw err;
  }
}

export async function bulkSoftDeleteReviews(reviewIds, reason = null) {
  try {
    const { data, error } = await supabase
      .from('reviews')
      .update({
        deleted_at: new Date().toISOString(),
        deletion_reason: reason,
        is_public: false,
        updated_at: new Date().toISOString(),
      })
      .in('id', reviewIds)
      .is('deleted_at', null)
      .select();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('bulkSoftDeleteReviews error:', err);
    throw err;
  }
}

// ─── Admin create review ─────────────────────────────────────────────────────
// For manually uploading offline/verified testimonials.
// review_date = when client gave the review (may differ from created_at).
// added_by_admin = true for all reviews created through this function.

export async function createReview({
  entityId,
  entityType = 'venue',
  reviewerName,
  reviewerEmail = null,
  reviewerRole = null,
  reviewerLocation = null,
  reviewTitle,
  reviewText,
  overallRating,
  subRatings = null,
  eventType = null,
  eventDate = null,
  guestCount = null,
  reviewDate = null,           // when client actually gave the review
  isVerified = false,
  isVerifiedBooking = false,
  verificationSource = 'manual_verified',
  moderationStatus = 'pending',
  isPublic = false,
  isFeatured = false,
}) {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('reviews')
      .insert({
        entity_id: entityId,
        entity_type: entityType,
        reviewer_name: reviewerName,
        reviewer_email: reviewerEmail,
        reviewer_role: reviewerRole,
        reviewer_location: reviewerLocation,
        review_title: reviewTitle,
        review_text: reviewText,
        overall_rating: overallRating,
        sub_ratings: subRatings || {},
        event_type: eventType,
        event_date: eventDate,
        guest_count: guestCount || null,
        review_date: reviewDate,         // original review date
        is_verified: isVerified,
        is_verified_booking: isVerifiedBooking,
        verification_source: isVerifiedBooking ? verificationSource : null,
        moderation_status: moderationStatus,
        is_public: isPublic,
        is_featured: isFeatured,
        added_by_admin: true,
        published_at: isPublic ? now : null,
        created_at: now,
        updated_at: now,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('createReview error:', err);
    throw err;
  }
}

// ─── Search listings (for admin add review venue picker) ─────────────────────

export async function searchListings(query, limit = 10) {
  try {
    // Route through admin edge function (service_role bypasses RLS)
    const { data, error } = await supabase.functions.invoke('admin-listings', {
      body: { action: 'search', nameQuery: query, status: 'published', limit },
    });
    if (error) throw error;
    if (!data?.success) throw new Error(data?.error ?? 'admin-listings/search failed');
    return (data.data || []).map(r => ({
      id: r.id, name: r.name, slug: r.slug,
      listing_type: r.listing_type, country: r.country, city: r.city,
    }));
  } catch (err) {
    console.error('searchListings error:', err);
    throw err;
  }
}

// ─── Conversation threads ─────────────────────────────────────────────────────

export async function fetchReviewMessages(reviewId) {
  try {
    const { data, error } = await supabase
      .from('review_messages')
      .select('*')
      .eq('review_id', reviewId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  } catch (err) {
    console.error('fetchReviewMessages error:', err);
    throw err;
  }
}

export async function addReviewMessage({
  reviewId,
  senderType,
  senderUserId = null,
  senderName = null,
  messageBody,
  isInternalNote = false,
}) {
  try {
    const { data, error } = await supabase
      .from('review_messages')
      .insert({
        review_id: reviewId,
        sender_type: senderType,
        sender_user_id: senderUserId,
        sender_name: senderName,
        message_body: messageBody,
        is_internal_note: isInternalNote,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (err) {
    console.error('addReviewMessage error:', err);
    throw err;
  }
}

export async function deleteReviewMessage(messageId) {
  try {
    const { error } = await supabase
      .from('review_messages')
      .delete()
      .eq('id', messageId);

    if (error) throw error;
    return { success: true };
  } catch (err) {
    console.error('deleteReviewMessage error:', err);
    throw err;
  }
}

// ─── Public reviews (future front-end use) ───────────────────────────────────

export async function fetchPublicReviews(entityId, { limit = 10, offset = 0 } = {}) {
  try {
    const { data, error, count } = await supabase
      .from('reviews')
      .select(
        'id, reviewer_name, reviewer_role, reviewer_location, event_type, event_date, guest_count, overall_rating, sub_ratings, review_title, review_text, is_verified, is_verified_booking, is_featured, featured_quote, reply_count, published_at',
        { count: 'exact' }
      )
      .eq('entity_id', entityId)
      .eq('moderation_status', 'approved')
      .eq('is_public', true)
      .is('deleted_at', null)
      .order('is_featured', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;
    return { reviews: data || [], total: count || 0 };
  } catch (err) {
    console.error('fetchPublicReviews error:', err);
    throw err;
  }
}

export async function fetchPublicOwnerReply(reviewId) {
  try {
    const { data, error } = await supabase
      .from('review_messages')
      .select('sender_name, message_body, created_at')
      .eq('review_id', reviewId)
      .eq('sender_type', 'owner')
      .eq('is_internal_note', false)
      .order('created_at', { ascending: true })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  } catch (err) {
    console.error('fetchPublicOwnerReply error:', err);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC REVIEWS RESPONSE CONTRACT
// This is the locked shape of what the front-end listing page will receive.
// Do not add admin-only fields here (email, admin_notes, internal messages).
// When connecting to listing pages, use fetchPublicReviews + fetchPublicOwnerReply.
//
// PublicReview {
//   id:                  string (UUID)
//   reviewer_name:       string          — display name, no email
//   reviewer_role:       'couple' | 'guest' | 'planner' | 'vendor' | 'corporate' | 'other' | null
//   reviewer_location:   string | null   — city/country, optional
//   event_type:          string | null   — "Wedding & Reception", "Intimate Ceremony" etc.
//   event_date:          string | null   — ISO date (YYYY-MM-DD), display as month/year only
//   guest_count:         number | null   — shown as "X guests"
//   overall_rating:      number          — 1.0–5.0, 1 decimal
//   sub_ratings:         {               — all optional, render only present keys
//     venue?:      number
//     service?:    number
//     catering?:   number
//     atmosphere?: number
//     value?:      number
//   }
//   review_title:        string
//   review_text:         string          — full text, NO truncation on listing page
//   is_verified:         boolean         — LWD Verified Couple badge
//   is_verified_booking: boolean         — LWD Verified Booking badge (higher trust)
//   is_featured:         boolean         — render first, optionally with quote treatment
//   featured_quote:      string | null   — pull-quote for editorial display
//   reply_count:         number          — 0 means no reply; show "Owner replied" indicator
//   published_at:        string (ISO)    — for display sort and "X months ago" label
// }
//
// PublicOwnerReply {
//   sender_name:   string   — business display name (e.g. "Six Senses Krabey Island — Events")
//   message_body:  string   — full reply text
//   created_at:    string   — ISO timestamp
// }
//
// ListingReviewSummary (on listing card + hero) {
//   avg_rating:       number | null   — from listings.rating
//   review_count:     number          — from listings.review_count
//   reputation_score: number | null   — from listings.reputation_score (v1 formula)
// }
//
// ─── LWD BADGE RULES (locked) ────────────────────────────────────────────────
//
// LWD Verified Booking  (◈ gold badge — highest trust)
//   Condition: is_verified_booking = true AND verification_source IN ('booking', 'enquiry')
//   Meaning: reviewer's connection to this venue has been confirmed via a booking record
//            or a tracked enquiry on the LWD platform.
//   Set by: admin only (manual for now; future: auto-link from enquiry/booking record)
//   Display: always shown; takes precedence over Verified Couple if both are true
//
// LWD Verified Couple   (◇ gold badge — standard trust)
//   Condition: is_verified = true AND reviewer_role = 'couple' AND is_verified_booking = false
//   Meaning: reviewer is confirmed as a genuine couple who had an event at this venue.
//            Lower bar — can be manually set by admin after basic validation.
//   Set by: admin only
//   Display: shown only when NOT showing Verified Booking badge
//
// Badge hierarchy: Verified Booking > Verified Couple > no badge
// Only ONE badge shown per review at a time.
//
// ─── FEATURED REVIEWS RULES (locked) ─────────────────────────────────────────
//
// Multiple featured reviews per listing are allowed — there is no DB constraint.
// is_featured = true marks a review as eligible for featured/editorial display.
// On listing pages: show featured reviews first (up to 3), then remaining approved.
// featured_quote is a short pull-quote extracted from the review for hero/callout use.
// Admin sets both is_featured and featured_quote via the moderation studio toggle.
// Featured reviews must be approved AND is_public = true before they render.
//
// ─── REPUTATION SCORE v1 (formula locked until v2) ───────────────────────────
//
// Score = (avg_rating × 0.50) + (recency_ratio × 5 × 0.20)
//       + (verified_ratio × 5 × 0.20) + (reply_rate% / 100 × 5 × 0.10)
//
// Scale: 0.0 – 5.0  |  NULL when review_count = 0
// Recency: ratio of reviews in last 6 months vs total (max contribution: +1.0)
// Verified: ratio of is_verified_booking reviews (max contribution: +1.0)
// Reply rate: % of approved reviews that have ≥1 owner reply (max contribution: +0.5)
//
// v1 decision: reputation_score includes ALL approved non-deleted reviews,
//   regardless of is_public. Rationale: reputation reflects moderated quality,
//   not visibility settings. Temporarily hidden reviews still count.
//
// v2 will add: review length quality weight, sentiment score, review frequency
//   curve (penalise clusters of reviews on the same day), recency decay curve.
// ─────────────────────────────────────────────────────────────────────────────
