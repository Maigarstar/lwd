/**
 * FreshnessText - Display when content was last reviewed
 * Only shows if lastReviewedAt date is provided
 * Format: "Updated 3 days ago", "Updated 1 week ago", etc.
 */
export default function FreshnessText({
  lastReviewedAt,
  color = '#999',
  size = 'sm'
}) {
  if (!lastReviewedAt) {
    return null;
  }

  // Parse the date
  const now = new Date();
  const reviewed = new Date(lastReviewedAt);

  // Calculate time difference
  const diffMs = now - reviewed;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor(diffMs / (1000 * 60));

  // Determine display text
  let text;
  if (days === 0) {
    text = 'Updated today';
  } else if (days === 1) {
    text = 'Updated yesterday';
  } else if (days < 7) {
    text = `Updated ${days} days ago`;
  } else if (days < 30) {
    const weeks = Math.floor(days / 7);
    text = `Updated ${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (days < 365) {
    const months = Math.floor(days / 30);
    text = `Updated ${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    const years = Math.floor(days / 365);
    text = `Updated ${years} year${years > 1 ? 's' : ''} ago`;
  }

  const sizeMap = {
    xs: { fontSize: 10, fontStyle: 'italic' },
    sm: { fontSize: 11, fontStyle: 'italic' },
    md: { fontSize: 12, fontStyle: 'italic' },
    lg: { fontSize: 13, fontStyle: 'italic' }
  };

  const s = sizeMap[size] || sizeMap.sm;

  return (
    <div
      style={{
        fontSize: s.fontSize,
        color,
        fontWeight: 400,
        fontStyle: s.fontStyle,
        letterSpacing: '0.02em'
      }}
      title={`Last reviewed: ${reviewed.toLocaleDateString()}`}
    >
      {text}
    </div>
  );
}
