/**
 * TierBadge.jsx
 * Compact tier indicator badge for discovery cards
 * Displays quality tier with icon and label
 * Used in: AuraVenueCard, ListingCards, search results
 */

import { getTierProperties } from '../../services/listings';

export default function TierBadge({ tier = 'standard', showLabel = true, size = 'md' }) {
  const tierProps = getTierProperties(tier);

  // Don't show badge for standard tier
  if (tier === 'standard') return null;

  const sizeMap = {
    sm: { icon: 12, label: 10, padding: '4px 8px' },
    md: { icon: 16, label: 12, padding: '6px 12px' },
    lg: { icon: 20, label: 14, padding: '8px 16px' },
  };

  const s = sizeMap[size];

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: s.padding,
        background: tierProps.bgColor,
        border: `1px solid ${tierProps.color}40`,
        borderRadius: 4,
        fontSize: s.label,
        fontWeight: 600,
        color: tierProps.color,
        letterSpacing: '0.02em',
        fontFamily: 'var(--font-body)',
      }}
    >
      {tierProps.icon && (
        <span style={{ fontSize: s.icon, lineHeight: 1 }}>
          {tierProps.icon}
        </span>
      )}
      {showLabel && <span>{tierProps.label}</span>}
    </div>
  );
}
