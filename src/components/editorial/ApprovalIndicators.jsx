import { isEditorialCurationEnabled } from '../../services/platformSettingsService';

/**
 * ApprovalIndicators - Display editorial approval status badges
 * Shows: ★ Editor Approved (when editorial_approved = true)
 *        ✓ Fact Checked (when editorial_fact_checked = true)
 * Returns null if neither status is true or editorial curation is disabled globally
 */
export default function ApprovalIndicators({
  approved = false,
  factChecked = false,
  layout = 'horizontal'
}) {
  const editorialEnabled = isEditorialCurationEnabled();

  // Don't show if editorial curation disabled globally or if neither status is true
  if (!editorialEnabled || (!approved && !factChecked)) {
    return null;
  }

  const badges = [];

  if (approved) {
    badges.push({
      icon: '★',
      label: 'Editor Approved',
      color: '#C9A84C'
    });
  }

  if (factChecked) {
    badges.push({
      icon: '✓',
      label: 'Fact Checked',
      color: '#10b981'
    });
  }

  if (layout === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {badges.map((badge, idx) => (
          <div
            key={idx}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 12,
              fontWeight: 500,
              color: badge.color,
              letterSpacing: '0.02em',
              whiteSpace: 'nowrap'
            }}
            title={badge.label}
          >
            <span style={{ fontSize: 14 }}>{badge.icon}</span>
            {badge.label}
          </div>
        ))}
      </div>
    );
  }

  // horizontal (default)
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {badges.map((badge, idx) => (
        <div
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            fontSize: 11,
            fontWeight: 500,
            color: badge.color,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap'
          }}
          title={badge.label}
        >
          <span style={{ fontSize: 13 }}>{badge.icon}</span>
          {badge.label}
        </div>
      ))}
    </div>
  );
}
