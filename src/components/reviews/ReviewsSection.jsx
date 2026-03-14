import React, { useState, useEffect } from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { fetchApprovedReviews, fetchReviewStats } from '../../services/reviewService';
import ReviewScoreBreakdown from './ReviewScoreBreakdown';
import ReviewCard from './ReviewCard';

/**
 * ReviewsSection - full reviews display section for venue/planner/vendor pages
 * Shows: aggregate score header + individual review cards (newest first)
 * Includes write review CTA
 */
const ReviewsSection = ({ entityType, entityId, onOpenReviewForm }) => {
  const C = useTheme();
  const FD = 'Cardo, serif';
  const FB = 'Inter, sans-serif';

  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' or 'highest'

  useEffect(() => {
    loadReviews();
  }, [entityType, entityId]);

  async function loadReviews() {
    try {
      setLoading(true);
      setError(null);

      const [reviewsData, statsData] = await Promise.all([
        fetchApprovedReviews(entityType, entityId),
        fetchReviewStats(entityType, entityId),
      ]);

      setReviews(reviewsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading reviews:', err);
      setError('Unable to load reviews');
    } finally {
      setLoading(false);
    }
  }

  const sortedReviews = [...reviews].sort((a, b) => {
    if (sortBy === 'highest') {
      return b.overall_rating - a.overall_rating;
    }
    // 'newest' - already ordered by published_at DESC from query
    return new Date(b.published_at) - new Date(a.published_at);
  });

  if (loading) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: C.textMuted }}>
        Loading reviews...
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 40, textAlign: 'center', color: '#d32f2f' }}>
        {error}
      </div>
    );
  }

  // No reviews state - luxury dark panel
  if (!reviews || reviews.length === 0) {
    return (
      <div
        style={{
          background: '#1a1a1a',
          border: `2px solid ${C.gold}`,
          borderRadius: 2,
          padding: '60px 48px',
          textAlign: 'center',
          marginBottom: 80,
        }}
      >
        <h3
          style={{
            fontFamily: FD,
            fontSize: 32,
            fontWeight: 400,
            color: '#f5f5f5',
            marginBottom: 16,
            letterSpacing: '0.5px',
          }}
        >
          Share Your Experience
        </h3>
        <p
          style={{
            fontFamily: FB,
            fontSize: 15,
            color: '#d4d4d4',
            marginBottom: 32,
            lineHeight: 1.6,
          }}
        >
          Be the first to share your experience with this {entityType}.
        </p>
        <p
          style={{
            fontFamily: FB,
            fontSize: 12,
            color: '#999999',
            marginBottom: 40,
            letterSpacing: '0.3px',
          }}
        >
          All reviews are moderated before publication.
        </p>
        {onOpenReviewForm && (
          <button
            onClick={onOpenReviewForm}
            style={{
              fontFamily: FB,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
              color: '#1a1a1a',
              background: C.gold,
              border: `1px solid ${C.gold}`,
              padding: '14px 40px',
              borderRadius: 1,
              cursor: 'pointer',
              transition: 'all 0.3s ease',
            }}
            onMouseOver={e => {
              e.target.style.background = '#1a1a1a';
              e.target.style.color = C.gold;
            }}
            onMouseOut={e => {
              e.target.style.background = C.gold;
              e.target.style.color = '#1a1a1a';
            }}
          >
            Write a Review
          </button>
        )}
      </div>
    );
  }

  return (
    <div id="reviews" style={{ marginTop: 48 }}>
      {/* Section title */}
      <h2
        style={{
          fontFamily: FD,
          fontSize: 28,
          fontWeight: 400,
          color: C.textDark,
          marginBottom: 32,
          paddingBottom: 16,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        Guest Reviews
      </h2>

      {/* Score breakdown */}
      {stats && (
        <ReviewScoreBreakdown
          entityType={entityType}
          rating={stats.avgRating}
          count={stats.count}
          subAverages={stats.subAverages}
        />
      )}

      {/* Controls: sort + write review */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 32,
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontFamily: FB, fontSize: 13, color: C.textMuted, fontWeight: 500 }}>
            Sort by:
          </span>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            style={{
              fontFamily: FB,
              fontSize: 13,
              color: C.textDark,
              border: `1px solid ${C.border}`,
              borderRadius: 4,
              padding: '8px 12px',
              background: C.surface,
              cursor: 'pointer',
            }}
          >
            <option value="newest">Newest First</option>
            <option value="highest">Highest Rated</option>
          </select>
        </div>

        {onOpenReviewForm && (
          <button
            onClick={onOpenReviewForm}
            style={{
              fontFamily: FB,
              fontSize: 13,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: '#fff',
              background: C.gold,
              border: 'none',
              padding: '10px 24px',
              borderRadius: 4,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseOver={e => (e.target.style.opacity = '0.9')}
            onMouseOut={e => (e.target.style.opacity = '1')}
          >
            Write a Review
          </button>
        )}
      </div>

      {/* Review cards */}
      <div>
        {sortedReviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};

export default ReviewsSection;
