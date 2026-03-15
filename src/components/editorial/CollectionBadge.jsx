/**
 * CollectionBadge - Displays editorial collection membership
 * Used for: Signature Venue, Editor's Choice, Iconic Venue (manual), Aura Recommended (system-driven)
 * Compact badge format similar to TierBadge
 */
export default function CollectionBadge({ collection, size = 'md' }) {
  if (!collection || !collection.icon) {
    return null;
  }

  const sizeMap = {
    sm: {
      icon: 12,
      label: 10,
      padding: '4px 8px',
      fontSize: 9
    },
    md: {
      icon: 14,
      label: 12,
      padding: '6px 12px',
      fontSize: 11
    },
    lg: {
      icon: 16,
      label: 14,
      padding: '8px 16px',
      fontSize: 12
    }
  };

  const s = sizeMap[size] || sizeMap.md;

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: s.padding,
        background: `${collection.color}15`,
        border: `1px solid ${collection.color}40`,
        borderRadius: 3,
        fontSize: s.fontSize,
        fontWeight: 600,
        color: collection.color,
        letterSpacing: '0.5px',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap'
      }}
      title={collection.description}
    >
      <span style={{ fontSize: s.icon, lineHeight: 1 }}>
        {collection.icon}
      </span>
      {collection.label}
    </div>
  );
}
