import { getTierProperties } from '../../services/listings';

/**
 * TierStrip - Displays editorial quality tier as a prominent horizontal strip
 * Used on venue showcase/profile pages to highlight editorial curation status
 * Includes optional full description text
 */
export default function TierStrip({ tier = 'standard', fullText = false }) {
  const tierProps = getTierProperties(tier);

  // Don't show strip for standard listings
  if (tier === 'standard' || !tierProps) {
    return null;
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: tierProps.bgColor,
        border: `1px solid ${tierProps.color}60`,
        borderRadius: 4,
        fontSize: 13,
        color: tierProps.color,
        fontWeight: 500
      }}
    >
      {tierProps.icon && (
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0 }}>
          {tierProps.icon}
        </span>
      )}
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontWeight: 600,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            fontSize: 12,
            marginBottom: fullText ? 2 : 0
          }}
        >
          {tierProps.label}
        </div>
        {fullText && (
          <div
            style={{
              fontSize: 11,
              opacity: 0.85,
              marginTop: 2,
              fontWeight: 400,
              letterSpacing: '0.02em'
            }}
          >
            {tierProps.description}
          </div>
        )}
      </div>
    </div>
  );
}
