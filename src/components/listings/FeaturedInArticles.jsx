// ═══════════════════════════════════════════════════════════════════════════
// FeaturedInArticles.jsx — Bi-directional reference display
// Shows which magazine articles feature/reference this listing.
// Used on listing profile pages and vendor dashboards.
// ═══════════════════════════════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { getFeaturedInArticles } from '../../services/referenceService';

const GOLD = '#C9A84C';

export default function FeaturedInArticles({ entityId, entityType = 'listing', maxItems = 4 }) {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!entityId) return;
    setLoading(true);
    getFeaturedInArticles(entityId, entityType)
      .then(setArticles)
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [entityId, entityType]);

  if (loading || articles.length === 0) return null;

  return (
    <div style={{ padding: '28px 0' }}>
      <div style={{
        fontFamily: "'Urbanist', sans-serif",
        fontSize: 10,
        fontWeight: 700,
        letterSpacing: '0.2em',
        textTransform: 'uppercase',
        color: GOLD,
        marginBottom: 16,
        opacity: 0.8,
      }}>
        ✦ Featured In
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${Math.min(articles.length, maxItems)}, 1fr)`,
        gap: 12,
      }}>
        {articles.slice(0, maxItems).map(article => (
          <a
            key={article.post_id}
            href={`/magazine/${article.article_slug}`}
            style={{
              textDecoration: 'none',
              color: 'inherit',
              display: 'block',
              borderRadius: 4,
              overflow: 'hidden',
              border: '1px solid rgba(201,168,76,0.12)',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Cover image */}
            {article.article_image && (
              <div style={{
                height: 100,
                background: `url(${article.article_image}) center/cover`,
              }} />
            )}

            {/* Content */}
            <div style={{ padding: '10px 12px' }}>
              {article.category_label && (
                <div style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 8,
                  fontWeight: 600,
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  color: GOLD,
                  marginBottom: 4,
                  opacity: 0.7,
                }}>
                  {article.category_label}
                </div>
              )}

              <div style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 14,
                fontWeight: 400,
                lineHeight: 1.3,
                color: '#1a1208',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}>
                {article.article_title}
              </div>

              {article.reference_tier && article.reference_tier !== 'linked' && (
                <div style={{
                  fontFamily: "'Urbanist', sans-serif",
                  fontSize: 7,
                  fontWeight: 600,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  color: article.reference_tier === 'featured' ? '#10b981' : article.reference_tier === 'sponsored' ? '#8b5cf6' : '#888',
                  marginTop: 6,
                }}>
                  {article.reference_tier}
                </div>
              )}
            </div>
          </a>
        ))}
      </div>
    </div>
  );
}
