// AuraDiscoveryGrid.jsx
// Aura-powered venue discovery grid
// Shows multiple venues ranked by editorial quality and guest reviews
// Demonstrates the full knowledge layer in a discovery interface
// FILE PATH: /Users/taiwoadedayo/LDW-01/.claude/worktrees/peaceful-dhawan/src/components/discovery/AuraDiscoveryGrid.jsx

console.log('[AURA-GRID-FILE] Loading from worktree: /Users/taiwoadedayo/LDW-01/.claude/worktrees/peaceful-dhawan/src/components/discovery/AuraDiscoveryGrid.jsx');

import { useEffect, useState } from 'react';
import { fetchRankedVenuesForDiscovery, markAuraRecommendedVenues, calculateRecommendationScore } from '../../services/auraKnowledgeLayerService';
import { getQualityTier } from '../../services/listings';
import { isEditorialCurationEnabledCached } from '../../services/platformSettingsService';
import AuraVenueCard from '../discovery/AuraVenueCard';

export default function AuraDiscoveryGrid({ minContentScore = 0, onVenueClick, limit = 12, isLight = true }) {
  // Immediate logging at function start
  if (typeof window !== 'undefined') {
    window._gridComponentStarted = true;
    window._gridComponentTime = new Date().toISOString();
    // Initialize debug object to prevent undefined errors
    if (!window._gridDebug) {
      window._gridDebug = {};
    }
  }

  const [venues, setVenues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [editorialEnabled, setEditorialEnabled] = useState(true);

  // Theme colors
  const bgColor = isLight ? '#ffffff' : '#2a2a2a';
  const textColor = isLight ? '#171717' : '#f5f2ec';
  const borderColor = isLight ? '#e4e0d8' : '#3a3a3a';
  const subtextColor = isLight ? '#6b6560' : '#a89f98';
  const lightBg = isLight ? '#faf9f6' : '#242424';

  // Check global editorial curation toggle on mount
  useEffect(() => {
    const checkEditorialEnabled = async () => {
      try {
        const enabled = await isEditorialCurationEnabledCached();
        setEditorialEnabled(enabled);
      } catch (err) {
        console.warn('[AURA] Editorial curation check failed, defaulting to enabled:', err);
        setEditorialEnabled(true);
      }
    };
    checkEditorialEnabled();
  }, []);

  // Load venues with their knowledge layers
  useEffect(() => {
    if (typeof globalThis !== 'undefined') {
      globalThis._useEffectFired = true;
    }

    const loadVenues = async () => {
      if (typeof globalThis !== 'undefined') {
        globalThis._loadVenuesStarted = true;
      }

      try {
        console.log('[AuraDiscoveryGrid] useEffect fired, calling fetchRankedVenuesForDiscovery');

        const result = await fetchRankedVenuesForDiscovery({
          limit: Math.ceil(limit * 1.5),
          minScore: minContentScore,
          sort: 'tier'
        });

        // NORMALIZE: Handle various response shapes
        const rankedVenues = Array.isArray(result) ? result : result?.venues || [];
        console.log('[AuraDiscoveryGrid] Loaded venues:', rankedVenues.length);

        if (!rankedVenues || rankedVenues.length === 0) {
          console.log('[AuraDiscoveryGrid] No venues from fetch');
          setVenues([]);
          setLoading(false);
          return;
        }

        // TRACE: Mark top 3 as Aura Recommended
        const withRecommendationFlags = markAuraRecommendedVenues(rankedVenues, 3);

        // Add computed fields for display and map image fields
        const enriched = withRecommendationFlags.map(v => ({
          ...v,
          contentScore: v.knowledge?.content?.contentScore ?? 0,
          approved: v.knowledge?.content?.approved ?? false,
          averageRating: v.knowledge?.reviews?.averageRating || 0,
          tier: getQualityTier(v.content_quality_score || 0),
          recommendationScore: calculateRecommendationScore(v, v.knowledge),
          // Map snake_case image fields from database to camelCase for component
          heroImage: v.hero_image,
          cardImage: v.card_image,
          heroImageSet: v.hero_image_set,
          galleryImages: v.gallery_images,
        }));


        // Filter by content score
        const filtered = enriched;

        // Apply sort
        let sorted = filtered;
        if (filter === 'approved') {
          const tierOrder = { platinum: 0, signature: 1, approved: 2, standard: 3 };
          sorted = filtered
            .filter(v => v.approved)
            .sort((a, b) => {
              const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
              if (tierDiff !== 0) return tierDiff;
              return b.recommendationScore - a.recommendationScore;
            });
        } else if (filter === 'highest-rated') {
          sorted = filtered.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
        } else if (filter === 'best-editorial') {
          sorted = filtered.sort((a, b) => b.contentScore - a.contentScore);
        } else {
          sorted = filtered;
        }

        setVenues(sorted);
      } catch (err) {
        console.error('[AuraDiscoveryGrid] Exception in loadVenues:', err);
        setVenues([]);
      } finally {
        setLoading(false);
      }
    };

    loadVenues();
  }, [limit, minContentScore]);

  // Reorder when filter changes
  useEffect(() => {
    setVenues(prev => {
      let sorted = [...prev];
      if (filter === 'approved') {
        const tierOrder = { platinum: 0, signature: 1, approved: 2, standard: 3 };
        sorted = sorted
          .filter(v => v.approved)
          .sort((a, b) => {
            const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
            if (tierDiff !== 0) return tierDiff;
            return b.recommendationScore - a.recommendationScore;
          });
      } else if (filter === 'highest-rated') {
        sorted = sorted.sort((a, b) => (b.averageRating || 0) - (a.averageRating || 0));
      } else if (filter === 'best-editorial') {
        const tierOrder = { platinum: 0, signature: 1, approved: 2, standard: 3 };
        sorted = sorted.sort((a, b) => {
          const scoreDiff = b.contentScore - a.contentScore;
          if (Math.abs(scoreDiff) > 10) return scoreDiff;
          return tierOrder[a.tier] - tierOrder[b.tier];
        });
      } else {
        const tierOrder = { platinum: 0, signature: 1, approved: 2, standard: 3 };
        sorted = sorted.sort((a, b) => {
          const tierDiff = tierOrder[a.tier] - tierOrder[b.tier];
          if (tierDiff !== 0) return tierDiff;
          return b.recommendationScore - a.recommendationScore;
        });
      }
      return sorted;
    });
  }, [filter]);

  return (
    <div style={{ width: '100%', padding: '20px' }}>
      <div style={{
        marginBottom: 32,
        display: 'flex',
        flexDirection: 'column',
        gap: 24,
      }}>
        <div>
          <h2 style={{
            margin: 0,
            fontFamily: 'var(--font-heading-primary)',
            fontSize: 32,
            fontWeight: 400,
            color: textColor,
          }}>
            Discover Luxury Wedding Venues
          </h2>
          <p style={{
            margin: '8px 0 0',
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: subtextColor,
            lineHeight: 1.6,
          }}>
            Curated venues ranked by editorial quality and guest experiences. Only our most complete, fact-checked, and approved properties.
          </p>
        </div>

        {/* Filter pills */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All Venues' },
            { id: 'best-editorial', label: 'Best Editorial' },
            { id: 'approved', label: 'Approved Only' },
            { id: 'highest-rated', label: 'Highest Rated' },
          ].map(filterOption => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              style={{
                padding: '10px 16px',
                background: filter === filterOption.id ? '#8f7420' : bgColor,
                color: filter === filterOption.id ? '#ffffff' : textColor,
                border: `1px solid ${filter === filterOption.id ? '#8f7420' : borderColor}`,
                borderRadius: 6,
                fontFamily: 'var(--font-body)',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {filterOption.label}
            </button>
          ))}
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
          gap: 16,
        }}>
          {[
            { label: 'Total Venues', value: venues.length },
            { label: 'Approved', value: venues.filter(v => v.approved).length },
            { label: 'Avg. Editorial Score', value: Math.round(venues.reduce((sum, v) => sum + v.contentScore, 0) / (venues.length || 1)) },
            { label: 'Highest Rated', value: venues.length > 0 ? Math.max(...venues.map(v => v.averageRating || 0)).toFixed(1) : 'N/A' },
          ].map((stat, idx) => (
            <div
              key={idx}
              style={{
                padding: 16,
                background: lightBg,
                border: `1px solid ${borderColor}`,
                borderRadius: 6,
              }}
            >
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-body)',
                fontSize: 11,
                color: subtextColor,
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                fontWeight: 600,
                marginBottom: 6,
              }}>
                {stat.label}
              </p>
              <p style={{
                margin: 0,
                fontFamily: 'var(--font-heading-primary)',
                fontSize: 22,
                fontWeight: 400,
                color: textColor,
              }}>
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div style={{
          textAlign: 'center',
          padding: 48,
          color: subtextColor,
          fontFamily: 'var(--font-body)',
        }}>
          Loading venue intelligence...
        </div>
      )}

      {/* Venues grid */}
      {!loading && venues.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: 24,
        }}>
          {venues.map(venue => (
            <AuraVenueCard
              key={venue.id}
              venue={venue}
              onClick={() => onVenueClick && onVenueClick(venue.slug)}
              isLight={isLight}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && venues.length === 0 && (
        <div style={{
          padding: 48,
          textAlign: 'center',
          background: lightBg,
          borderRadius: 8,
          border: `1px solid ${borderColor}`,
        }}>
          <p style={{
            margin: 0,
            fontFamily: 'var(--font-body)',
            fontSize: 16,
            color: subtextColor,
          }}>
            No venues match your criteria. Try adjusting your filters.
          </p>
        </div>
      )}
    </div>
  );
}
