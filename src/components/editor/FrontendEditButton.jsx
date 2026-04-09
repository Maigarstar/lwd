/**
 * FrontendEditButton — Reusable edit trigger for all entity types
 * Used on public pages (articles, listings, showcases, locations, categories)
 * Only visible to authenticated editors
 */
import { useNavigate } from 'react-router-dom';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { buildEditUrl, canUserEdit } from '../../utils/editingUtils';

export default function FrontendEditButton({
  entityType,           // 'article' | 'listing' | 'showcase' | 'location' | 'category'
  slug,                 // entity slug
  returnPath,           // optional, defaults to current pathname
  label = '✦ Edit',     // optional label
  className = '',       // optional CSS class
  visibility = 'authenticated-only', // 'always' | 'authenticated-only'
}) {
  const navigate = useNavigate();
  const { user } = useAdminAuth();

  // Don't render if authentication is required and user is not authenticated
  if (visibility === 'authenticated-only' && !canUserEdit(user)) {
    return null;
  }

  if (!entityType || !slug) {
    console.warn('[FrontendEditButton] Missing required props: entityType and slug');
    return null;
  }

  const handleClick = () => {
    const editUrl = buildEditUrl(entityType, slug, returnPath);
    navigate(editUrl);
  };

  return (
    <button
      onClick={handleClick}
      className={`frontend-edit-button ${className}`}
      title={`Edit this ${entityType}`}
      aria-label={`Edit this ${entityType}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 12px',
        background: 'none',
        border: 'none',
        color: '#c9a96e',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        cursor: 'pointer',
        transition: 'opacity 0.2s, color 0.2s',
        opacity: 0.85,
        fontFamily: "'Nunito', 'Inter', 'Helvetica Neue', sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.opacity = 1;
        e.currentTarget.style.color = '#d4b896';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.opacity = 0.85;
        e.currentTarget.style.color = '#c9a96e';
      }}
    >
      {label}
    </button>
  );
}
