/**
 * ApprovedLinksDisplay.jsx
 *
 * Displays approved internal links (venues/planners) mentioned in a published article.
 * Part of Phase 3: Internal Linking Engine.
 *
 * Props:
 *   - approvedLinks: array of { name, type, entityId, context }
 *   - compact: boolean - if true, show as inline chips; if false, show as cards
 */

const GOLD = '#C9A84C';

export default function ApprovedLinksDisplay({
  approvedLinks = [],
  compact = false,
}) {
  if (!approvedLinks || approvedLinks.length === 0) {
    return null;
  }

  // Separate venues and planners
  const venues = approvedLinks.filter(l => l.type === 'venue');
  const planners = approvedLinks.filter(l => l.type === 'planner');

  // Compact mode: inline chips
  if (compact) {
    return (
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {approvedLinks.map((link, i) => (
          <a
            key={i}
            href={`/${link.type === 'venue' ? 'venue' : 'planner'}/${link.entityId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '6px 12px',
              background: `${GOLD}12`,
              border: `1px solid ${GOLD}30`,
              borderRadius: 4,
              fontSize: 13,
              color: GOLD,
              textDecoration: 'none',
              transition: 'all 0.15s',
              cursor: 'pointer',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = `${GOLD}20`;
              e.currentTarget.style.borderColor = `${GOLD}50`;
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = `${GOLD}12`;
              e.currentTarget.style.borderColor = `${GOLD}30`;
            }}
          >
            <span>{link.type === 'venue' ? '📍' : '👤'}</span>
            <span>{link.name}</span>
          </a>
        ))}
      </div>
    );
  }

  // Full mode: grouped cards
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Venues Section */}
      {venues.length > 0 && (
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12,
          }}>
            📍 Featured Venues ({venues.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {venues.map((venue, i) => (
              <a
                key={i}
                href={`/venue/${venue.entityId}`}
                style={{
                  display: 'block',
                  padding: 12,
                  background: 'rgba(201, 168, 76, 0.06)',
                  border: `1px solid ${GOLD}30`,
                  borderRadius: 6,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${GOLD}12`;
                  e.currentTarget.style.borderColor = `${GOLD}50`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(201, 168, 76, 0.06)';
                  e.currentTarget.style.borderColor = `${GOLD}30`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontWeight: 500, color: '#1a1208', marginBottom: 4 }}>
                  {venue.name}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  Mentioned in this article
                </div>
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Planners Section */}
      {planners.length > 0 && (
        <div>
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            color: '#666',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: 12,
          }}>
            👤 Featured Planners ({planners.length})
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {planners.map((planner, i) => (
              <a
                key={i}
                href={`/planner/${planner.entityId}`}
                style={{
                  display: 'block',
                  padding: 12,
                  background: 'rgba(201, 168, 76, 0.06)',
                  border: `1px solid ${GOLD}30`,
                  borderRadius: 6,
                  textDecoration: 'none',
                  transition: 'all 0.15s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = `${GOLD}12`;
                  e.currentTarget.style.borderColor = `${GOLD}50`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(201, 168, 76, 0.06)';
                  e.currentTarget.style.borderColor = `${GOLD}30`;
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div style={{ fontWeight: 500, color: '#1a1208', marginBottom: 4 }}>
                  {planner.name}
                </div>
                <div style={{ fontSize: 11, color: '#999' }}>
                  Mentioned in this article
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
