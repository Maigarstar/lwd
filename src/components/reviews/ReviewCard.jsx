import React from 'react';
import { useTheme } from '../../theme/ThemeContext';

/**
 * ReviewCard - individual review display
 * Shows reviewer info, ratings, title, text, and verified badge
 */
const ReviewCard = ({ review }) => {
  const C = useTheme();
  const FD = 'Cardo, serif';
  const FB = 'Inter, sans-serif';

  if (!review) return null;

  const {
    reviewer_name,
    reviewer_location,
    event_type,
    event_date,
    overall_rating,
    sub_ratings = {},
    review_title,
    review_text,
    is_verified,
    published_at,
  } = review;

  const publishDate = published_at
    ? new Date(published_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null;

  return (
    <div
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        borderRadius: 8,
        padding: 24,
        marginBottom: 20,
      }}
    >
      {/* Header: reviewer info + verified badge */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: FB,
              fontSize: 14,
              fontWeight: 600,
              color: C.textDark,
              marginBottom: 4,
            }}
          >
            {reviewer_name}
            {reviewer_location && (
              <span style={{ fontWeight: 400, color: C.textMid, marginLeft: 4 }}>
                , {reviewer_location}
              </span>
            )}
          </div>
          <div
            style={{
              fontFamily: FB,
              fontSize: 12,
              color: C.textMuted,
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            {event_type && <span>{event_type}</span>}
            {event_date && <span>{new Date(event_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })}</span>}
            {publishDate && <span>{publishDate}</span>}
          </div>
        </div>

        {is_verified && (
          <div
            style={{
              background: C.goldBg,
              border: `1px solid ${C.gold}`,
              color: C.gold,
              padding: '6px 12px',
              borderRadius: 4,
              fontFamily: FB,
              fontSize: 11,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            ✓ Verified
          </div>
        )}
      </div>

      {/* Overall rating stars */}
      <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ fontSize: 16 }}>
          {'★'.repeat(Math.round(overall_rating))}
          {'☆'.repeat(5 - Math.round(overall_rating))}
        </div>
        <span style={{ fontFamily: FB, fontSize: 13, color: C.textMid }}>
          {overall_rating} out of 5
        </span>
      </div>

      {/* Sub-ratings bars (if present) */}
      {Object.keys(sub_ratings).length > 0 && (
        <div style={{ marginBottom: 16, background: C.bg, padding: 12, borderRadius: 4 }}>
          <div style={{ fontSize: 11, fontFamily: FB, fontWeight: 700, color: C.textMuted, marginBottom: 8, textTransform: 'uppercase' }}>
            Ratings Breakdown
          </div>
          {Object.entries(sub_ratings).map(([key, value]) => (
            <div
              key={key}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginBottom: 6,
                fontSize: 12,
                fontFamily: FB,
              }}
            >
              <span style={{ minWidth: 100, color: C.textMid, textTransform: 'capitalize' }}>
                {key}
              </span>
              <div
                style={{
                  flex: 1,
                  height: 4,
                  background: C.border,
                  borderRadius: 2,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    background: C.gold,
                    width: `${(Number(value) / 5) * 100}%`,
                  }}
                />
              </div>
              <span style={{ minWidth: 20, textAlign: 'right', color: C.gold, fontWeight: 600 }}>
                {value}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Review title */}
      <h3
        style={{
          fontFamily: FD,
          fontSize: 18,
          fontWeight: 400,
          color: C.textDark,
          margin: '0 0 12px 0',
          lineHeight: 1.4,
        }}
      >
        {review_title}
      </h3>

      {/* Review text */}
      <p
        style={{
          fontFamily: FB,
          fontSize: 14,
          color: C.textLight,
          lineHeight: 1.75,
          margin: 0,
        }}
      >
        {review_text}
      </p>
    </div>
  );
};

export default ReviewCard;
