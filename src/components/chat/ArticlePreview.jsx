/**
 * ArticlePreview.jsx
 *
 * Displays a single article in chat recommendations.
 * Used by Aura to surface magazine content in recommendations panel.
 *
 * Props:
 *   - article: { title, excerpt, category, categorySlug, image, readingTime, tags, slug, featured, trending }
 *   - onSelect?: (slug) => void — callback when user clicks to view
 *   - compact?: boolean — minimal layout for inline chips (default false)
 */
export default function ArticlePreview({ article, onSelect, compact = false }) {
  if (!article) return null;

  const {
    title = 'Untitled',
    excerpt = '',
    category = 'Magazine',
    categorySlug,
    coverImage,
    heroImage,
    readingTime = 5,
    tags = [],
    slug,
    featured,
    trending,
  } = article;

  const imageUrl = coverImage || heroImage;
  const displayTags = tags.slice(0, 2); // Show top 2 tags

  if (compact) {
    // Minimal layout: used for inline chips in chat
    return (
      <div
        onClick={() => onSelect?.(slug)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(201, 168, 76, 0.08)',
          border: '1px solid rgba(201, 168, 76, 0.3)',
          borderRadius: '6px',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(201, 168, 76, 0.15)';
          e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(201, 168, 76, 0.08)';
          e.currentTarget.style.borderColor = 'rgba(201, 168, 76, 0.3)';
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 500, color: '#1a1208' }}>
          {title}
        </span>
        {featured && (
          <span
            style={{
              fontSize: '10px',
              fontWeight: 600,
              color: '#c9a86e',
              letterSpacing: '0.5px',
            }}
          >
            ✦ FEATURED
          </span>
        )}
      </div>
    );
  }

  // Full layout: card view for recommendation panel
  return (
    <div
      onClick={() => onSelect?.(slug)}
      style={{
        padding: '16px',
        background: '#fefdfb',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '8px',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.12)';
        e.currentTarget.style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.transform = 'translateY(0)';
      }}
    >
      {/* Image thumbnail */}
      {imageUrl && (
        <div
          style={{
            width: '100%',
            height: '140px',
            background: '#e8e6e1',
            borderRadius: '6px',
            marginBottom: '12px',
            overflow: 'hidden',
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}

      {/* Category label */}
      <div
        style={{
          fontSize: '11px',
          fontWeight: 600,
          color: '#c9a86e',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '6px',
        }}
      >
        {category}
      </div>

      {/* Title */}
      <h3
        style={{
          fontSize: '15px',
          fontWeight: 600,
          margin: '0 0 8px',
          color: '#1a1208',
          lineHeight: 1.3,
        }}
      >
        {title}
      </h3>

      {/* Excerpt */}
      {excerpt && (
        <p
          style={{
            fontSize: '13px',
            color: '#666',
            margin: '0 0 12px',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {excerpt}
        </p>
      )}

      {/* Meta row: reading time + badges */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '12px',
          color: '#999',
          marginBottom: '10px',
        }}
      >
        <span>{readingTime} min read</span>
        <div style={{ display: 'flex', gap: '6px' }}>
          {featured && (
            <span
              style={{
                background: 'rgba(201, 168, 76, 0.2)',
                color: '#c9a86e',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Featured
            </span>
          )}
          {trending && (
            <span
              style={{
                background: 'rgba(255, 107, 107, 0.2)',
                color: '#ff6b6b',
                padding: '2px 6px',
                borderRadius: '3px',
                fontSize: '11px',
                fontWeight: 600,
              }}
            >
              Trending
            </span>
          )}
        </div>
      </div>

      {/* Tags */}
      {displayTags.length > 0 && (
        <div
          style={{
            display: 'flex',
            gap: '6px',
            flexWrap: 'wrap',
            marginBottom: '12px',
          }}
        >
          {displayTags.map((tag, i) => (
            <span
              key={i}
              style={{
                fontSize: '11px',
                padding: '3px 8px',
                background: 'rgba(201, 168, 76, 0.1)',
                color: '#8b7355',
                borderRadius: '3px',
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* CTA button */}
      <button
        style={{
          width: '100%',
          padding: '10px',
          background: 'transparent',
          border: '1px solid #c9a86e',
          borderRadius: '4px',
          color: '#c9a86e',
          fontSize: '13px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = '#c9a86e';
          e.currentTarget.style.color = '#fefdfb';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
          e.currentTarget.style.color = '#c9a86e';
        }}
      >
        Read Article →
      </button>
    </div>
  );
}
