import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import {
  fetchAdminReviews,
  approveReview,
  rejectReview,
  softDeleteReview,
  bulkApproveReviews,
  bulkRejectReviews,
  bulkSoftDeleteReviews,
  getReviewStats,
  updateReview,
} from '../../services/adminReviewService';

/**
 * ReviewsModule - Admin review management for AdminDashboard
 * Handles moderation, filtering, searching, bulk actions
 */
const ReviewsModule = () => {
  const C = useTheme();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState('pending');
  const [entityTypeFilter, setEntityTypeFilter] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReviews, setSelectedReviews] = useState(new Set());

  // Pagination
  const [offset, setOffset] = useState(0);
  const [total, setTotal] = useState(0);
  const itemsPerPage = 20;

  // Edit mode
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');

  useEffect(() => {
    loadReviews();
    loadStats();
  }, [statusFilter, entityTypeFilter, searchQuery, offset]);

  async function loadReviews() {
    try {
      setLoading(true);
      const { reviews: data, total: count } = await fetchAdminReviews({
        status: statusFilter || null,
        entityType: entityTypeFilter || null,
        searchQuery: searchQuery || null,
        limit: itemsPerPage,
        offset,
      });
      setReviews(data);
      setTotal(count);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadStats() {
    try {
      const data = await getReviewStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  }

  const handleApprove = async (reviewId) => {
    try {
      await approveReview(reviewId);
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleReject = async (reviewId) => {
    try {
      await rejectReview(reviewId);
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (reviewId) => {
    if (window.confirm('Soft delete this review? It will be removed from public view but kept in records.')) {
      try {
        await softDeleteReview(reviewId);
        loadReviews();
        loadStats();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const handleUpdateText = async (reviewId) => {
    if (!editText.trim()) {
      setError('Review text cannot be empty');
      return;
    }
    try {
      await updateReview(reviewId, { review_text: editText });
      setEditingId(null);
      setEditText('');
      loadReviews();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleSelectReview = (reviewId) => {
    const newSelected = new Set(selectedReviews);
    if (newSelected.has(reviewId)) {
      newSelected.delete(reviewId);
    } else {
      newSelected.add(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReviews.size === reviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(reviews.map(r => r.id)));
    }
  };

  const handleBulkApprove = async () => {
    if (selectedReviews.size === 0) {
      setError('Select reviews to approve');
      return;
    }
    try {
      await bulkApproveReviews(Array.from(selectedReviews));
      setSelectedReviews(new Set());
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkReject = async () => {
    if (selectedReviews.size === 0) {
      setError('Select reviews to reject');
      return;
    }
    try {
      await bulkRejectReviews(Array.from(selectedReviews));
      setSelectedReviews(new Set());
      loadReviews();
      loadStats();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedReviews.size === 0) {
      setError('Select reviews to delete');
      return;
    }
    if (window.confirm(`Soft delete ${selectedReviews.size} review(s)?`)) {
      try {
        await bulkSoftDeleteReviews(Array.from(selectedReviews));
        setSelectedReviews(new Set());
        loadReviews();
        loadStats();
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'approved':
        return '#4caf50';
      case 'rejected':
        return '#f44336';
      case 'pending':
        return '#ff9800';
      default:
        return '#999';
    }
  };

  const pagesCount = Math.ceil(total / itemsPerPage);
  const currentPage = Math.floor(offset / itemsPerPage) + 1;

  return (
    <div style={{ padding: '32px' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', color: C.textDark, margin: 0 }}>
          Reviews Management
        </h2>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: C.textMuted, marginTop: '8px' }}>
          Moderate, approve, and manage customer reviews
        </p>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', marginBottom: '32px' }}>
          <StatCard label="Total" value={stats.total} color={C.gold} />
          <StatCard label="Pending" value={stats.pending} color="#ff9800" />
          <StatCard label="Approved" value={stats.approved} color="#4caf50" />
          <StatCard label="Rejected" value={stats.rejected} color="#f44336" />
        </div>
      )}

      {/* Filters & Search */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setOffset(0);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            border: `1px solid ${C.border}`,
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <select
          value={entityTypeFilter || ''}
          onChange={(e) => {
            setEntityTypeFilter(e.target.value || null);
            setOffset(0);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            border: `1px solid ${C.border}`,
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            cursor: 'pointer',
          }}
        >
          <option value="">All Entity Types</option>
          <option value="venue">Venue</option>
          <option value="blog">Blog</option>
          <option value="showcase">Showcase</option>
        </select>

        <input
          type="text"
          placeholder="Search by name, email, or text..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setOffset(0);
          }}
          style={{
            padding: '10px 16px',
            borderRadius: '4px',
            border: `1px solid ${C.border}`,
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
            flex: 1,
            minWidth: '200px',
          }}
        />
      </div>

      {/* Bulk Actions */}
      {selectedReviews.size > 0 && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', padding: '12px', background: C.surface, borderRadius: '4px' }}>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', color: C.textDark, flex: 1 }}>
            {selectedReviews.size} selected
          </span>
          <button
            onClick={handleBulkApprove}
            style={{ padding: '8px 16px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            Approve Selected
          </button>
          <button
            onClick={handleBulkReject}
            style={{ padding: '8px 16px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            Reject Selected
          </button>
          <button
            onClick={handleBulkDelete}
            style={{ padding: '8px 16px', background: '#999', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}
          >
            Delete Selected
          </button>
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#ffebee', border: '1px solid #f44336', borderRadius: '4px', color: '#c62828', marginBottom: '16px', fontFamily: 'Inter, sans-serif', fontSize: '13px' }}>
          {error}
        </div>
      )}

      {/* Reviews Table */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>Loading reviews...</div>
      ) : reviews.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: C.textMuted }}>No reviews found</div>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${C.border}`, background: C.surface }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>
                    <input
                      type="checkbox"
                      checked={selectedReviews.size === reviews.length && reviews.length > 0}
                      onChange={handleSelectAll}
                      style={{ cursor: 'pointer' }}
                    />
                  </th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Reviewer</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Review</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Entity</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Rating</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontWeight: 600 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((review) => (
                  <tr key={review.id} style={{ borderBottom: `1px solid ${C.border}` }}>
                    <td style={{ padding: '12px' }}>
                      <input
                        type="checkbox"
                        checked={selectedReviews.has(review.id)}
                        onChange={() => handleSelectReview(review.id)}
                        style={{ cursor: 'pointer' }}
                      />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 600 }}>{review.reviewer_name}</div>
                      <div style={{ fontSize: '12px', color: C.textMuted }}>{review.reviewer_email}</div>
                      {review.reviewer_location && <div style={{ fontSize: '12px', color: C.textMuted }}>{review.reviewer_location}</div>}
                    </td>
                    <td style={{ padding: '12px', maxWidth: '300px' }}>
                      {editingId === review.id ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            style={{ flex: 1, padding: '8px', borderRadius: '4px', border: `1px solid ${C.border}`, fontFamily: 'Inter, sans-serif', fontSize: '12px', minHeight: '60px' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            <button
                              onClick={() => handleUpdateText(review.id)}
                              style={{ padding: '6px 12px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              style={{ padding: '6px 12px', background: '#999', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div style={{ fontWeight: 600, marginBottom: '4px' }}>{review.review_title}</div>
                          <div style={{ fontSize: '12px', color: C.textMuted, marginBottom: '8px' }}>{review.review_text.substring(0, 100)}...</div>
                          <button
                            onClick={() => {
                              setEditingId(review.id);
                              setEditText(review.review_text);
                            }}
                            style={{ fontSize: '11px', color: C.gold, background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Edit
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '11px', background: '#e3f2fd', color: '#1976d2', padding: '4px 8px', borderRadius: '4px' }}>
                        {review.entity_type}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span style={{ fontSize: '14px' }}>{'★'.repeat(review.overall_rating)}</span>
                      <div style={{ fontSize: '11px', color: C.textMuted }}>{review.overall_rating}/4</div>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          background: getStatusBadgeColor(review.moderation_status),
                          color: '#fff',
                          fontSize: '11px',
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {review.moderation_status}
                      </span>
                    </td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ display: 'flex', gap: '4px' }}>
                        {review.moderation_status !== 'approved' && (
                          <button
                            onClick={() => handleApprove(review.id)}
                            style={{ padding: '4px 8px', background: '#4caf50', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                          >
                            Approve
                          </button>
                        )}
                        {review.moderation_status !== 'rejected' && (
                          <button
                            onClick={() => handleReject(review.id)}
                            style={{ padding: '4px 8px', background: '#f44336', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                          >
                            Reject
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(review.id)}
                          style={{ padding: '4px 8px', background: '#999', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '11px', fontWeight: 600 }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '24px', alignItems: 'center' }}>
            <button
              onClick={() => setOffset(Math.max(0, offset - itemsPerPage))}
              disabled={offset === 0}
              style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '4px', cursor: offset === 0 ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: offset === 0 ? 0.5 : 1 }}
            >
              Prev
            </button>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: C.textMuted }}>
              Page {currentPage} of {pagesCount || 1}
            </span>
            <button
              onClick={() => setOffset(offset + itemsPerPage)}
              disabled={offset + itemsPerPage >= total}
              style={{ padding: '8px 12px', border: `1px solid ${C.border}`, borderRadius: '4px', cursor: offset + itemsPerPage >= total ? 'not-allowed' : 'pointer', fontSize: '12px', opacity: offset + itemsPerPage >= total ? 0.5 : 1 }}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * StatCard component for quick stats display
 */
function StatCard({ label, value, color }) {
  return (
    <div style={{ padding: '16px', background: '#f5f5f5', borderRadius: '8px', borderLeft: `4px solid ${color}` }}>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#999', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600 }}>
        {label}
      </div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 600, color: color }}>
        {value}
      </div>
    </div>
  );
}

export default ReviewsModule;
