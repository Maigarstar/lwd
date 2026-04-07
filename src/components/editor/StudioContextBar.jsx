/**
 * StudioContextBar — Context bar shown in editor studios
 * Displays what is being edited, return path, and link to live page
 * Used in MagazineStudio, ListingStudio, ShowcaseStudio, LocationStudio, CategoryStudio
 */
import { useNavigate } from 'react-router-dom';
import { getEntityLabel } from '../../utils/editingUtils';

export default function StudioContextBar({
  entityType,   // 'article' | 'listing' | 'showcase' | 'location' | 'category'
  title,        // Display name (e.g., "My Cake", "The Ritz London")
  returnPath,   // URL to return to
  liveUrl,      // optional, live page URL (if omitted, no "open live" button)
}) {
  const navigate = useNavigate();

  if (!entityType || !title || !returnPath) {
    return null;
  }

  const entityLabel = getEntityLabel(entityType);

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        height: 40,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        paddingLeft: 16,
        paddingRight: 16,
        background: 'rgba(20, 16, 12, 0.97)',
        borderBottom: '1px solid rgba(201, 168, 76, 0.15)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
      }}
    >
      {/* Gold accent bar */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: 3,
          background: '#c9a96e',
        }}
      />

      {/* Back button & title */}
      <button
        onClick={() => navigate(returnPath)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          color: 'rgba(245, 240, 232, 0.8)',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'color 0.2s',
          fontFamily: "'Nunito', 'Inter', 'Helvetica Neue', sans-serif",
          maxWidth: 300,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#c9a96e';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = 'rgba(245, 240, 232, 0.8)';
        }}
        title={`Return to ${entityLabel}: ${title}`}
      >
        <span>←</span>
        <span style={{ fontSize: 11, color: 'rgba(245, 240, 232, 0.55)' }}>
          Back to {entityLabel}:
        </span>
        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {title}
        </span>
      </button>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Open live page link */}
      {liveUrl && (
        <a
          href={liveUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '4px 12px',
            background: 'rgba(201, 168, 76, 0.08)',
            border: '1px solid rgba(201, 168, 76, 0.15)',
            borderRadius: 3,
            color: 'rgba(201, 168, 76, 0.8)',
            fontSize: 11,
            fontWeight: 500,
            cursor: 'pointer',
            transition: 'all 0.2s',
            textDecoration: 'none',
            fontFamily: "'Nunito', 'Inter', 'Helvetica Neue', sans-serif",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = 'rgba(201, 168, 76, 0.15)';
            e.currentTarget.style.color = '#c9a96e';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'rgba(201, 168, 76, 0.08)';
            e.currentTarget.style.color = 'rgba(201, 168, 76, 0.8)';
          }}
        >
          <span>Open live</span>
          <span>↗</span>
        </a>
      )}
    </div>
  );
}
