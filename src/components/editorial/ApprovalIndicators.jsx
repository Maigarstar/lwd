/**
 * ApprovalIndicators.jsx
 * Editorial approval status badges (Editor Approved, Fact Checked)
 * Displays approval workflow status for editorial curation visibility
 * Used in: LuxuryVenueCard, venue profile heroes, editorial dashboards
 */

const NU = 'var(--font-body)';

export default function ApprovalIndicators({
  approved = false,
  factChecked = false,
  layout = 'horizontal',
  variant = 'dark', // 'dark' for on-image/dark bg, 'light' for light bg
}) {
  if (!approved && !factChecked) return null;

  const isDark = variant === 'dark';

  const badges = [];

  if (approved) {
    badges.push({
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#C9A84C' : '#C9A84C'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      ),
      label: 'Editor Approved',
      accent: '#C9A84C',
    });
  }

  if (factChecked) {
    badges.push({
      icon: (
        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={isDark ? '#4ade80' : '#10b981'} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ),
      label: 'Fact Checked',
      accent: isDark ? '#4ade80' : '#10b981',
    });
  }

  if (layout === 'vertical') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {badges.map((badge, idx) => (
          <div
            key={idx}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              fontFamily: NU,
              fontSize: 10,
              fontWeight: 600,
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
              color: isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.5)',
            }}
          >
            {badge.icon}
            <span style={{ color: badge.accent, opacity: 0.85 }}>{badge.label}</span>
          </div>
        ))}
      </div>
    );
  }

  // horizontal layout — subtle inline badges
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
      {badges.map((badge, idx) => (
        <span
          key={idx}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
            padding: isDark ? '3px 8px' : '4px 10px',
            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
            backdropFilter: isDark ? 'blur(8px)' : 'none',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'}`,
            borderRadius: 2,
            fontFamily: NU,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            color: badge.accent,
            transition: 'opacity 0.2s',
          }}
        >
          {badge.icon}
          {badge.label}
        </span>
      ))}
    </div>
  );
}
