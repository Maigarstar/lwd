/**
 * TierStrip.jsx
 * Horizontal tier indicator strip for venue showcase pages
 * Displays tier with full description and rich styling
 * Used in: DdeShowcasePage, VenueProfilePage, venue detail pages
 */

import { getTierProperties } from '../../services/listings';

export default function TierStrip({ tier = 'standard', fullText = false }) {
  const tierProps = getTierProperties(tier);

  // Don't show strip for standard tier
  if (tier === 'standard') return null;

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '12px 16px',
        background: tierProps.bgColor,
        border: `1px solid ${tierProps.color}40`,
        borderRadius: 4,
        fontSize: 13,
        color: tierProps.color,
        fontWeight: 500,
        fontFamily: 'var(--font-body)',
      }}
    >
      {tierProps.icon && (
        <span style={{ fontSize: 18, lineHeight: 1 }}>
          {tierProps.icon}
        </span>
      )}
      <div>
        <div
          style={{
            fontWeight: 600,
            letterSpacing: '0.05em',
            fontSize: 13,
          }}
        >
          {tierProps.label}
        </div>
        {fullText && (
          <div
            style={{
              fontSize: 11,
              opacity: 0.8,
              marginTop: 2,
              fontWeight: 400,
            }}
          >
            {tierProps.description}
          </div>
        )}
      </div>
    </div>
  );
}
