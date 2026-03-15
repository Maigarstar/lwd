// AuraVenueCard.jsx
// Luxury editorial venue discovery card
// Photography-focused design with subtle editorial signals

import { useEffect, useState } from 'react';
import { fetchVenueKnowledgeLayer, generateVenueSummary, extractVenueHighlights, analyzeReviewThemes } from '../../services/auraKnowledgeLayerService';
import { getQualityTier } from '../../services/listings';
import TierBadge from '../editorial/TierBadge';
import ApprovalIndicators from '../editorial/ApprovalIndicators';
import FreshnessText from '../editorial/FreshnessText';

export default function AuraVenueCard({ venue: venueObj, venueId, slug, onDetailsClick, onClick, isLight = true, editorialEnabled = true }) {
  const [knowledge, setKnowledge] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null);

  // Theme colors
  const bgColor = isLight ? '#ffffff' : '#2a2a2a';
  const textColor = isLight ? '#171717' : '#f5f2ec';
  const borderColor = isLight ? '#e4e0d8' : '#3a3a3a';
  const subtextColor = isLight ? '#6b6560' : '#a89f98';

  // Fetch and process venue knowledge on mount
  useEffect(() => {
    const loadVenueIntelligence = async () => {
      try {
        let k = venueObj?.knowledge;
        if (!k && venueId) {
          k = await fetchVenueKnowledgeLayer(venueId);
        }
        if (!k) {
          setLoading(false);
          return;
        }

        setKnowledge(k);
        setSummary(generateVenueSummary(k));
      } catch (err) {
        console.error('Failed to load venue intelligence:', err);
      } finally {
        setLoading(false);
      }
    };

    loadVenueIntelligence();
  }, [venueId, venueObj]);

  if (loading) {
    return (
      <div style={{
        background: '#ffffff',
        border: '1px solid #e4e0d8',
        borderRadius: 8,
        padding: 24,
        textAlign: 'center',
        color: '#6b6560',
        minHeight: 300,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        Loading...
      </div>
    );
  }

  if (!knowledge || !summary) {
    return null;
  }

  const { venue, content } = knowledge;
  const tier = getQualityTier(content.contentScore || 0);

  // Get primary image from venue object
  const primaryImage = venueObj?.heroImage || venueObj?.cardImage || (venueObj?.heroImageSet?.[0]) || null;

  // Convert relative image paths to full Supabase Storage URLs
  const resolveImageUrl = (imagePath) => {
    if (!imagePath) return null;
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) {
      return imagePath;
    }
    return `https://qpkggfibwreznussudfh.supabase.co/storage/v1/object/public/listing-media/${imagePath}`;
  };

  // Fallback placeholder image
  const fallbackImage = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300"%3E%3Cdefs%3E%3ClinearGradient id="g1" x1="0%25" y1="0%25" x2="100%25" y2="100%25"%3E%3Cstop offset="0%25" style="stop-color:%23d4af37;stop-opacity:0.1" /%3E%3Cstop offset="100%25" style="stop-color:%238f7420;stop-opacity:0.1" /%3E%3C/linearGradient%3E%3C/defs%3E%3Crect fill="%232a2a2a" width="400" height="300"/%3E%3Crect fill="url(%23g1)" width="400" height="300"/%3E%3Ctext x="50%25" y="45%25" font-family="Georgia, serif" font-size="24" fill="%23d4af37" text-anchor="middle" opacity="0.6"%3ELuxury Venue%3C/text%3E%3Ctext x="50%25" y="60%25" font-family="Georgia, serif" font-size="14" fill="%23a89f98" text-anchor="middle" opacity="0.5"%3EImage Coming Soon%3C/text%3E%3C/svg%3E';
  const imageUrl = resolveImageUrl(primaryImage) || fallbackImage;

  return (
    <div style={{
      position: 'relative',
      background: bgColor,
      border: `1px solid ${borderColor}`,
      borderRadius: 8,
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.borderColor = '#8f7420';
      e.currentTarget.style.boxShadow = '0 12px 32px rgba(0,0,0,0.15)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.borderColor = borderColor;
      e.currentTarget.style.boxShadow = 'none';
    }}
    onClick={() => onClick?.() || onDetailsClick?.(slug)}
    >
      {/* Large Hero Image - Photography is the hero */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: 280,
        overflow: 'hidden',
        borderRadius: '8px 8px 0 0',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        padding: 16,
        gap: 12,
      }}>
        {/* Image with proper object-fit framing */}
        <img
          src={imageUrl}
          alt={venue.name}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
        />

        {/* Subtle overlay for contrast and depth */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(135deg, rgba(0,0,0,0.08) 0%, transparent 50%)',
          pointerEvents: 'none',
        }} />

        {/* Score Badge - Top Left */}
        <div style={{
          position: 'relative',
          zIndex: 10,
          width: 40,
          height: 40,
          borderRadius: '50%',
          background: 'rgba(26, 26, 26, 0.3)',
          border: '1px solid rgba(255, 255, 255, 0.15)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 600,
          color: '#f5f2ec',
          backdropFilter: 'blur(8px)',
        }}>
          {Math.round(content.contentScore || 0)}
        </div>

        {/* Tier badge overlay */}
        {editorialEnabled && tier !== 'standard' && tier !== 'approved' && (
          <div style={{
            position: 'relative',
            zIndex: 10,
            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.2))'
          }}>
            <TierBadge tier={tier} showLabel={true} size="sm" />
          </div>
        )}
      </div>

      {/* Content Section - Clean and Editorial */}
      <div style={{
        padding: '24px 24px 20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Venue Name and Location */}
        <div style={{ marginBottom: 16 }}>
          <h3 style={{
            margin: 0,
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 20,
            fontWeight: 400,
            color: textColor,
            lineHeight: 1.3,
          }}>
            {venue.name}
          </h3>
          <p style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 12,
            color: subtextColor,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
          }}>
            {venue.location}
          </p>
        </div>

        {/* Editorial Summary - Subtle description */}
        {summary.summary && (
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            lineHeight: 1.6,
            color: subtextColor,
            marginBottom: 16,
          }}>
            {summary.summary.length > 160 ? `${summary.summary.substring(0, 160)}...` : summary.summary}
          </p>
        )}

        {/* Editorial Metadata - Approval and Freshness */}
        {editorialEnabled && (content.editorial_approved || content.approved) && (
          <div style={{ marginBottom: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: subtextColor, fontWeight: 400, fontStyle: 'italic' }}>
              <FreshnessText
                lastReviewedAt={content.editorial_last_reviewed_at || content.lastReviewedAt}
                color={subtextColor}
              />
            </div>
            <span style={{
              fontSize: 11,
              fontWeight: 600,
              color: '#10b981',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              whiteSpace: 'nowrap',
            }}>
              <span>✓</span>
              <span>Approved</span>
            </span>
          </div>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* CTA Link - Minimal, Editorial */}
        <div style={{
          paddingTop: 16,
          borderTop: `1px solid ${borderColor}`,
        }}>
          <a style={{
            fontFamily: 'var(--font-body)',
            fontSize: 13,
            fontWeight: 500,
            color: '#8f7420',
            textDecoration: 'none',
            letterSpacing: '0.5px',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
          onMouseEnter={(e) => {
            e.target.style.gap = '10px';
            e.target.style.color = '#a89f98';
          }}
          onMouseLeave={(e) => {
            e.target.style.gap = '6px';
            e.target.style.color = '#8f7420';
          }}
          >
            Discover More
            <span style={{ fontSize: 12 }}>→</span>
          </a>
        </div>
      </div>
    </div>
  );
}
