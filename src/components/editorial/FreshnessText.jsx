/**
 * FreshnessText.jsx
 * Content freshness indicator showing when venue content was last reviewed
 * Displays: "Updated X days ago", "Updated 1 week ago", etc.
 * Only shows when approved = true AND lastReviewedAt exists
 * Used in: AuraVenueCard, venue pages, editorial dashboards
 */

export default function FreshnessText({
  lastReviewedAt,
  color = '#999',
  fontSize = 12,
}) {
  if (!lastReviewedAt) return null;

  const now = new Date();
  const reviewed = new Date(lastReviewedAt);
  const diffMs = now - reviewed;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  let text;

  if (diffDays === 0) {
    text = 'Updated today';
  } else if (diffDays === 1) {
    text = 'Updated yesterday';
  } else if (diffDays < 7) {
    text = `Updated ${diffDays} days ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    text = `Updated ${weeks} week${weeks === 1 ? '' : 's'} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    text = `Updated ${months} month${months === 1 ? '' : 's'} ago`;
  } else {
    const years = Math.floor(diffDays / 365);
    text = `Updated ${years} year${years === 1 ? '' : 's'} ago`;
  }

  return (
    <div
      style={{
        fontSize,
        color,
        fontWeight: 400,
        fontStyle: 'italic',
        fontFamily: 'var(--font-body)',
      }}
    >
      {text}
    </div>
  );
}
