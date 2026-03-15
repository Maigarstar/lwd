import React from 'react';

/**
 * ReviewBadge - compact rating display for cards and sidebars
 * Shows: ★ 4.8 (124 reviews)
 */
const ReviewBadge = ({ rating, count, size = 'default' }) => {
  const FB = 'Inter, sans-serif';

  if (rating == null || count === 0) return null;

  const sizeMap = {
    compact: { star: 12, number: 12, text: 11 },
    default: { star: 14, number: 14, text: 12 },
    large: { star: 16, number: 16, text: 14 },
  };

  const s = sizeMap[size] || sizeMap.default;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontFamily: FB,
      }}
    >
      <span style={{ fontSize: s.star, color: '#C9A961', lineHeight: 1 }}>★</span>
      <span style={{ fontSize: s.number, fontWeight: 700, color: '#1A1A1A' }}>
        {rating}
      </span>
      <span style={{ fontSize: s.text, color: '#888', fontWeight: 500 }}>
        ({count} {count === 1 ? 'review' : 'reviews'})
      </span>
    </div>
  );
};

export default ReviewBadge;
