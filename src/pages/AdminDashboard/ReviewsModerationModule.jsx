import React, { useState, useEffect } from 'react';
import {
  fetchAdminReviews,
  approveReview,
  rejectReview,
  markVerified,
} from '../../services/reviewService';

/**
 * ReviewsModerationModule - admin panel for review moderation
 * Tabs: Pending / Approved / Rejected
 * Actions: approve, reject, verify, add notes
 */
const ReviewsModerationModule = () => {
  const [status, setStatus] = useState('pending'); // pending, approved, rejected
  const [entityType, setEntityType] = useState(null); // filter by venue, planner, vendor
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedReviewId, setSelectedReviewId] = useState(null);
  const [actionNotes, setActionNotes] = useState('');
  const [processing, setProcessing] = useState(null);

  useEffect(() => {
    loadReviews();
  }, [status, entityType]);

  async function loadReviews() {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchAdminReviews({ status, entityType });
      setReviews(data);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(reviewId) {
    try {
      setProcessing(reviewId);
      await approveReview(reviewId, actionNotes || null);
      setActionNotes('');
      setSelectedReviewId(null);
      loadReviews();
    } catch (err) {
      console.error('Approve error:', err);
      setError('Failed to approve review');
    } finally {
      setProcessing(null);
    }
  }

  async function handleReject(reviewId) {
    try {
      setProcessing(reviewId);
      await rejectReview(reviewId, actionNotes || '');
      setActionNotes('');
      setSelectedReviewId(null);
      loadReviews();
    } catch (err) {
      console.error('Reject error:', err);
      setError('Failed to reject review');
    } finally {
      setProcessing(null);
    }
  }

  async function handleVerify(reviewId, isVerified) {
    try {
      setProcessing(reviewId);
      await markVerified(reviewId, !isVerified);
      loadReviews();
    } catch (err) {
      console.error('Verify error:', err);
      setError('Failed to update verification');
    } finally {
      setProcessing(null);
    }
  }

  const tabStyle = (tab) => ({
    padding: '12px 20px',
    fontSize: 14,
    fontWeight: status === tab ? 700 : 500,
    color: status === tab ? '#1a1a1a' : '#888',
    background: 'transparent',
    border: 'none',
    borderBottom: status === tab ? '2px solid #C9A961' : '1px solid #ddd4c8',
    cursor: 'pointer',
    transition: 'all 0.2s',
  });

  const pendingCount = reviews.filter(r => r.moderation_status === 'pending').length;

  return (
    <div style={{ padding: 20 }}>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, marginBottom: 16 }}>
          Reviews Moderation
        </h2>

        {/* Tabs */}
        <div style={{ borderBottom: '1px solid #ddd4c8', marginBottom: 20 }}>
          {['pending', 'approved', 'rejected'].map(tab => (
            <button
              key={tab}
              onClick={() => setStatus(tab)}
              style={tabStyle(tab)}
            >
              {tab === 'pending' && `Pending (${pendingCount})`}
              {tab === 'approved' && 'Approved'}
              {tab === 'rejected' && 'Rejected'}
            </button>
          ))}
        </div>

        {/* Filter */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 12, fontWeight: 600, marginRight: 12 }}>
            Filter by type:
          </label>
          <select
            value={entityType || ''}
            onChange={e => setEntityType(e.target.value || null)}
            style={{
              fontSize: 13,
              padding: '8px 12px',
              border: '1px solid #ddd4c8',
              borderRadius: 4,
              background: '#fff',
            }}
          >
            <option value="">All types</option>
            <option value="venue">Venues</option>
            <option value="planner">Planners</option>
            <option value="vendor">Vendors</option>
          </select>
        </div>
      </div>

      {error && (
        <div
          style={{
            background: '#ffebee',
            border: '1px solid #ef5350',
            color: '#c62828',
            padding: 12,
            borderRadius: 4,
            marginBottom: 16,
            fontSize: 13,
          }}
        >
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          Loading...
        </div>
      ) : reviews.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#888' }}>
          No reviews to display
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {reviews.map(review => (
            <div
              key={review.id}
              style={{
                border: '1px solid #ddd4c8',
                borderRadius: 6,
                padding: 16,
                background: selectedReviewId === review.id ? '#f5f5f5' : '#fff',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700 }}>
                    {review.reviewer_name}
                    {review.is_verified && (
                      <span
                        style={{
                          marginLeft: 8,
                          fontSize: 11,
                          fontWeight: 700,
                          color: '#C9A961',
                          background: '#fff9e6',
                          padding: '2px 8px',
                          borderRadius: 3,
                        }}
                      >
                        ✓ VERIFIED
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                    {review.entity_type} · {review.event_type} · {review.reviewer_location}
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: '#C9A961' }}>
                    {review.overall_rating}/5
                  </div>
                  <div style={{ fontSize: 11, color: '#888', marginTop: 4 }}>
                    {new Date(review.created_at).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Title + text */}
              <div style={{ marginBottom: 12 }}>
                <h4
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    marginBottom: 6,
                    margin: 0,
                  }}
                >
                  {review.review_title}
                </h4>
                <p
                  style={{
                    fontSize: 13,
                    color: '#555',
                    lineHeight: 1.5,
                    margin: 0,
                  }}
                >
                  {review.review_text}
                </p>
              </div>

              {/* Admin notes */}
              {review.admin_notes && (
                <div
                  style={{
                    background: '#f9f9f9',
                    border: '1px solid #e0e0e0',
                    padding: 8,
                    borderRadius: 3,
                    fontSize: 12,
                    color: '#666',
                    marginBottom: 12,
                  }}
                >
                  <strong>Admin notes:</strong> {review.admin_notes}
                </div>
              )}

              {/* Actions (only for pending) */}
              {status === 'pending' && (
                <div>
                  {selectedReviewId !== review.id ? (
                    <button
                      onClick={() => setSelectedReviewId(review.id)}
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        color: '#C9A961',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      Take Action
                    </button>
                  ) : (
                    <div
                      style={{
                        background: '#f5f5f5',
                        padding: 12,
                        borderRadius: 4,
                        marginTop: 12,
                      }}
                    >
                      <div style={{ marginBottom: 10 }}>
                        <label
                          style={{
                            display: 'block',
                            fontSize: 11,
                            fontWeight: 700,
                            marginBottom: 6,
                            textTransform: 'uppercase',
                          }}
                        >
                          Admin Notes (optional)
                        </label>
                        <textarea
                          value={actionNotes}
                          onChange={e => setActionNotes(e.target.value)}
                          placeholder="e.g., reason for rejection or internal notes"
                          style={{
                            width: '100%',
                            padding: 8,
                            fontSize: 12,
                            border: '1px solid #ddd4c8',
                            borderRadius: 3,
                            fontFamily: 'sans-serif',
                            minHeight: 60,
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleApprove(review.id)}
                          disabled={processing === review.id}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                            background: processing === review.id ? '#ccc' : '#4caf50',
                            border: 'none',
                            borderRadius: 3,
                            cursor: processing === review.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {processing === review.id ? 'Processing...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleReject(review.id)}
                          disabled={processing === review.id}
                          style={{
                            flex: 1,
                            padding: '8px 12px',
                            fontSize: 12,
                            fontWeight: 700,
                            color: '#fff',
                            background: processing === review.id ? '#ccc' : '#f44336',
                            border: 'none',
                            borderRadius: 3,
                            cursor: processing === review.id ? 'not-allowed' : 'pointer',
                          }}
                        >
                          {processing === review.id ? 'Processing...' : 'Reject'}
                        </button>
                        <button
                          onClick={() => setSelectedReviewId(null)}
                          style={{
                            padding: '8px 12px',
                            fontSize: 12,
                            color: '#888',
                            background: 'transparent',
                            border: '1px solid #ddd4c8',
                            borderRadius: 3,
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Verify toggle (for approved reviews) */}
              {status === 'approved' && (
                <button
                  onClick={() => handleVerify(review.id, review.is_verified)}
                  disabled={processing === review.id}
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: review.is_verified ? '#C9A961' : '#888',
                    background: 'transparent',
                    border: 'none',
                    cursor: processing === review.id ? 'not-allowed' : 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  {review.is_verified ? '✓ Remove Verified Badge' : 'Mark as Verified'}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewsModerationModule;
