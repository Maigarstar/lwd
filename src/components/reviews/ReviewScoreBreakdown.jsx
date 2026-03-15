import React from 'react';
import { useTheme } from '../../theme/ThemeContext';
import { SUB_RATING_LABELS } from '../../config/reviewConfig';

/**
 * ReviewScoreBreakdown - shows aggregate rating, review count, and sub-rating bars
 * Displays at the top of the reviews section on venue/planner/vendor pages
 */
const ReviewScoreBreakdown = ({ entityType, rating, count, subAverages = {} }) => {
  const C = useTheme();
  const FD = 'Cardo, serif';
  const FB = 'Inter, sans-serif';

  if (rating == null || count === 0) {
    return (
      <div style={{ padding: '24px', textAlign: 'center', color: C.textMuted, fontFamily: FB }}>
        No reviews yet. Be the first to share your experience.
      </div>
    );
  }

  const labels = SUB_RATING_LABELS[entityType] || {};
  const subKeys = Object.keys(subAverages || {});

  return (
    <div style={{ marginBottom: 40 }}>
      {/* Header with overall score */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 32,
          marginBottom: 32,
          paddingBottom: 24,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        {/* Overall rating - large display */}
        <div>
          <div style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 48, fontWeight: 700, color: C.gold }}>
              {rating.toFixed(1)}
            </div>
            <div
              style={{
                fontSize: 14,
                color: '★'.repeat(5),
                marginBottom: 4,
              }}
            >
              {'★'.repeat(Math.round(rating))}
              {'☆'.repeat(5 - Math.round(rating))}
            </div>
          </div>
          <div style={{ fontFamily: FB, fontSize: 13, color: C.textMuted }}>
            Based on {count} {count === 1 ? 'review' : 'reviews'}
          </div>
        </div>

        {/* Empty space for balance */}
        <div />
      </div>

      {/* Sub-rating breakdown (if applicable) */}
      {subKeys.length > 0 && (
        <div>
          <h4
            style={{
              fontFamily: FB,
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              color: C.textMuted,
              marginBottom: 16,
              letterSpacing: '0.5px',
            }}
          >
            Ratings Breakdown
          </h4>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {subKeys.map(key => {
              const value = subAverages[key];
              const label = labels[key] || key;

              return (
                <div key={key} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 40px', gap: 12, alignItems: 'center' }}>
                  <div
                    style={{
                      fontFamily: FB,
                      fontSize: 13,
                      color: C.textLight,
                      textTransform: 'capitalize',
                    }}
                  >
                    {label}
                  </div>

                  {/* Bar */}
                  <div
                    style={{
                      height: 8,
                      background: C.border,
                      borderRadius: 4,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        background: C.gold,
                        width: `${(value / 5) * 100}%`,
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>

                  {/* Score */}
                  <div
                    style={{
                      fontFamily: FB,
                      fontSize: 13,
                      fontWeight: 700,
                      color: C.gold,
                      textAlign: 'right',
                    }}
                  >
                    {value.toFixed(1)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewScoreBreakdown;
