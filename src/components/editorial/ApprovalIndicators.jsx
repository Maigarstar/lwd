/**
 * ApprovalIndicators.jsx
 * Editorial approval status badges (Editor Approved, Fact Checked)
 * Displays approval workflow status for editorial curation visibility
 * Used in: AuraVenueCard, venue pages, editorial dashboards
 */

export default function ApprovalIndicators({
  approved = false,
  factChecked = false,
  layout = 'horizontal',
}) {
  // Don't show if neither is true
  if (!approved && !factChecked) return null;

  const badges = [];

  if (approved) {
    badges.push({
      icon: '★',
      label: 'Editor Approved',
      color: '#C9A84C',
      bgColor: '#faf7f0',
    });
  }

  if (factChecked) {
    badges.push({
      icon: '✓',
      label: 'Fact Checked',
      color: '#10b981',
      bgColor: '#f0f5f0',
    });
  }

  if (layout === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {badges.map((badge, idx) => (
          <div
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: badge.color,
              letterSpacing: '0.02em',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ fontSize: 14 }}>{badge.icon}</span>
            {badge.label}
          </div>
        ))}
      </div>
    );
  }

  // horizontal layout
  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {badges.map((badge, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 8px',
            background: badge.bgColor,
            color: badge.color,
            borderRadius: 4,
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            fontWeight: 600,
          }}
        >
          {badge.icon} {badge.label}
        </span>
      ))}
    </div>
  );
}
