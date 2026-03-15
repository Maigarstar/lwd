// AuraVenueCard.jsx
// Aura-powered venue discovery card showcasing editorial + AI intelligence
// Combines: approved editorial, content quality, guest themes, AI highlights
// Demonstrates the full power of the knowledge layer in a single component

import { useEffect, useState } from 'react';
import { fetchVenueKnowledgeLayer, generateVenueSummary, extractVenueHighlights, analyzeReviewThemes } from '../../services/auraKnowledgeLayerService';
import { getQualityTier } from '../../services/listings';
import TierBadge from '../editorial/TierBadge';
import ApprovalIndicators from '../editorial/ApprovalIndicators';
import FreshnessText from '../editorial/FreshnessText';

/**
 * Format a timestamp as "X days ago"
 */
function formatDaysAgo(timestamp) {
  if (!timestamp) return null;
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays;
}

export default function AuraVenueCard({ venueId, slug, onDetailsClick, isLight = true, editorialEnabled = true }) {
  const [knowledge, setKnowledge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [themes, setThemes] = useState(null);

  // Theme colors
  const bgColor = isLight ? '#ffffff' : '#2a2a2a';
  const textColor = isLight ? '#171717' : '#f5f2ec';
  const borderColor = isLight ? '#e4e0d8' : '#3a3a3a';
  const subtextColor = isLight ? '#6b6560' : '#a89f98';
  const lightBg = isLight ? '#faf9f6' : '#242424';

  // Fetch and process venue knowledge on mount
  useEffect(() => {
    const loadVenueIntelligence = async () => {
      try {
        const k = await fetchVenueKnowledgeLayer(venueId);
        if (!k) {
          setLoading(false);
          return;
        }

        setKnowledge(k);
        setSummary(generateVenueSummary(k));
        setHighlights(extractVenueHighlights(k));
        setThemes(analyzeReviewThemes(k));
      } catch (err) {
        console.error('Failed to load venue intelligence:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVenueIntelligence();
  }, [venueId]);

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e4e0d8',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
        color: '#6b6560',
      }}>
        Loading venue intelligence...
      </div>
    );
  }

  if (!knowledge || !summary) {
    return null;
  }

  const { venue, content, reviews } = knowledge;
  const contentQuality = content.contentScore >= 90 ? 'premium' : content.contentScore >= 70 ? 'high' : content.contentScore >= 40 ? 'medium' : 'low';
  const contentQualityColor = {
    premium: '#15803d',
    high: '#8f7420',
    medium: '#a88338',
    low: '#8a8078',
  }[contentQuality];

  // Calculate quality tier for Phase 4 editorial display
  const tier = getQualityTier(content.contentScore || 0);

  return (
    <div style={{
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      ':hover': {
        borderColor: '#8f7420',
        boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
      },
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#8f7420';
      e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = borderColor;
      e.currentTarget.style.boxShadow = 'none';
    }}
    onClick={() => onDetailsClick?.(slug)}
    >
      {/* Header with venue name and quality badge */}
      <div style={{ padding: '24px 24px 16px', borderBottom: `1px solid ${borderColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              margin: 0,
              fontFamily: 'var(--font-heading-primary)',
              fontSize: 18,
              fontWeight: 400,
              color: textColor,
            }}>
              {venue.name}
            </h3>
            <p style={{
              margin: '6px 0 0',
              fontFamily: 'var(--font-body)',
              fontSize: 13,
              color: subtextColor,
            }}>
              {venue.location}
            </p>
          </div>

          {/* Right column: Tier badge + Content quality score */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 8,
          }}>
            {/* Tier badge (Phase 4) - Hidden if editorial curation disabled globally or per-venue */}
            {editorialEnabled && <TierBadge tier={tier} showLabel={true} size="sm" />}

            {/* Content quality badge */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
            }}>
              <div style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: contentQualityColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontFamily: 'var(--font-body)',
                fontSize: 14,
                fontWeight: 600,
              }}>
                {content.contentScore}
              </div>
              <span style={{
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: '#6b6560',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 600,
              }}>
                {contentQuality}
              </span>
            </div>
          </div>
        </div>

        {/* Phase 4b: Approval indicators and freshness (Phase 4d: Respect editorial_enabled toggle) */}
        {editorialEnabled && (
          <div style={{ marginTop: 12 }}>
            {/* Approval badges */}
            <ApprovalIndicators
              approved={content.editorial_approved || content.approved}
              factChecked={content.editorial_fact_checked || content.factChecked}
              layout="horizontal"
            />

            {/* Freshness indicator */}
            {(content.editorial_approved || content.approved) && (
              <div style={{ marginTop: content.editorial_approved || content.approved ? 8 : 0 }}>
                <FreshnessText
                  lastReviewedAt={content.editorial_last_reviewed_at || content.lastReviewedAt}
                  color={subtextColor}
                  fontSize={11}
                />
              </div>
            )}
          </div>
        )}
      </div>

      {/* Editorial summary */}
      {summary.summary && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede5' }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: 1.6,
            color: '#4a4540',
          }}>
            {summary.summary.length > 180 ? `${summary.summary.substring(0, 180)}...` : summary.summary}
          </p>
        </div>
      )}

      {/* Highlights grid */}
      {highlights.length > 0 && (
        <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede5' }}>
          <p style={{
            margin: '0 0 12px',
            fontFamily: 'var(--font-body)',
            fontSize: 11,
            textTransform: 'uppercase',
            letterSpacing: 0.5,
            color: '#6b6560',
            fontWeight: 600,
          }}>
            Key Highlights
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))',
            gap: 8,
          }}>
            {highlights.slice(0, 4).map((highlight, idx) => (
              <div
                key={idx}
                style={{
                  padding: '8px 12px',
                  background: '#faf9f6',
                  border: '1px solid #f0ede5',
                  borderRadius: 4,
                  fontFamily: 'var(--font-body)',
                  fontSize: 12,
                  color: '#4a4540',
                  fontWeight: 500,
                  textAlign: 'center',
                }}
              >
                {highlight}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews & themes */}
      <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0ede5' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {reviews.averageRating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 14,
                  fontWeight: 600,
                  color: '#171717',
                }}>
                  {reviews.averageRating}
                </span>
                <span style={{
                  fontFamily: 'var(--font-body)',
                  fontSize: 13,
                  color: '#6b6560',
                }}>
                  {reviews.total > 0 ? `from ${reviews.total} reviews` : 'No reviews yet'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Top themes from reviews */}
        {themes && themes.topThemes.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{
              margin: '0 0 8px',
              fontFamily: 'var(--font-body)',
              fontSize: 11,
              color: '#6b6560',
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              fontWeight: 600,
            }}>
              Guest Praise Themes
            </p>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {themes.topThemes.slice(0, 3).map((theme, idx) => (
                <span
                  key={idx}
                  style={{
                    padding: '4px 10px',
                    background: '#f5f2ec',
                    borderRadius: 12,
                    fontFamily: 'var(--font-body)',
                    fontSize: 11,
                    color: '#4a4540',
                    fontWeight: 500,
                  }}
                >
                  {theme.theme} ({theme.percentage}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer CTA */}
      <div style={{
        padding: '12px 24px',
        background: '#faf9f6',
        textAlign: 'center',
      }}>
        <span style={{
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          color: '#8f7420',
          fontWeight: 600,
        }}>
          View Full Profile ↗
        </span>
      </div>
    </div>
  );
}
