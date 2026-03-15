import { getTierProperties } from '../../services/listings';

/**
 * TierBadge - Displays editorial quality tier (Platinum, Signature, Approved)
 * Compact badge format for use on venue cards (top-right, top-left, etc.)
 * Does not display Standard tier (returns null)
 */
export default function TierBadge({ tier = 'standard', showLabel = true, size = 'sm' }) {
  const tierProps = getTierProperties(tier);

  // Don't show badge for standard listings
  if (tier === 'standard' || !tierProps) {
    return null;
  }

  const sizeMap = {
    sm: {
      icon: 11,
      label: 9,
      padding: '3px 8px',
      fontSize: 9,
      fontWeight: 700
    },
    md: {
      icon: 14,
      label: 11,
      padding: '5px 12px',
      fontSize: 11,
      fontWeight: 600
    },
    lg: {
      icon: 16,
      label: 12,
      padding: '6px 14px',
      fontSize: 12,
      fontWeight: 600
    }
  };

  const s = sizeMap[size] || sizeMap.sm;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: s.padding,
        background: tierProps.bgColor,
        border: `1px solid ${tierProps.color}60`,
        borderRadius: 3,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        color: tierProps.color,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap'
      }}
      title={tierProps.description}
    >
      {tierProps.icon && (
        <span style={{ fontSize: s.icon, lineHeight: 1 }}>
          {tierProps.icon}
        </span>
      )}
      {showLabel && tierProps.label}
    </div>
  );
}
