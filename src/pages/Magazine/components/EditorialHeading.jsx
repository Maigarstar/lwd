/**
 * EditorialHeading — Three-layer editorial contrast typography.
 *
 * Follows the Vogue / Condé Nast pattern:
 *   1. Small uppercase label  (Nunito — category / section marker)
 *   2. Large display headline (Gilda Display — the statement)
 *   3. Optional intro text    (Nunito — supporting context)
 *
 * Usage:
 *   <EditorialHeading
 *     label="Featured Destination"
 *     title="The Art of the Amalfi Wedding"
 *     intro="A closer look at the most breathtaking venues along Italy's iconic coastline."
 *     light={isLight}
 *   />
 */
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';

export default function EditorialHeading({
  label,
  title,
  intro,
  light = false,
  align = 'left',
  onViewAll,
  viewAllLabel = 'View All',
  titleSize = 'large',      // 'large' | 'medium'
  className,
  style: wrapperStyle,
}) {
  const T = getMagTheme(light);

  const titleFontSize = titleSize === 'medium'
    ? 'clamp(26px, 3.5vw, 42px)'
    : 'clamp(32px, 5vw, 56px)';

  const introFontSize = titleSize === 'medium'
    ? 'clamp(13px, 1.3vw, 15px)'
    : 'clamp(15px, 1.5vw, 18px)';

  return (
    <div
      className={className}
      style={{
        textAlign: align,
        marginBottom: 'clamp(32px, 4vw, 48px)',
        ...wrapperStyle,
      }}
    >
      {/* Layer 1 — Small label */}
      {label && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          marginBottom: intro ? 14 : 12,
          justifyContent: align === 'center' ? 'center' : 'flex-start',
        }}>
          {align !== 'center' && (
            <div style={{ width: 20, height: 1, background: GOLD }} />
          )}
          <span style={{
            fontFamily: FU,
            fontSize: 'clamp(10px, 1vw, 13px)',
            fontWeight: 700,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: GOLD,
          }}>
            {label}
          </span>
          {align !== 'center' && onViewAll && (
            <div style={{ flex: 1, height: 1, background: `${GOLD}20` }} />
          )}
        </div>
      )}

      {/* Layer 2 — Display headline */}
      {title && (
        <div style={{
          display: 'flex',
          alignItems: align === 'center' ? 'center' : 'flex-end',
          justifyContent: align === 'center' ? 'center' : 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}>
          <h2 style={{
            fontFamily: FD,
            fontSize: titleFontSize,
            fontWeight: 400,
            color: T.text,
            margin: 0,
            lineHeight: 1.08,
            letterSpacing: FD_LS,
          }}>
            {title}
          </h2>
          {onViewAll && align !== 'center' && (
            <button onClick={onViewAll} style={{
              fontFamily: FU, fontSize: 10, fontWeight: 600,
              letterSpacing: '0.15em', textTransform: 'uppercase',
              color: GOLD, background: 'none', border: 'none',
              cursor: 'pointer', padding: '6px 0',
              borderBottom: `1px solid ${GOLD}40`,
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'border-color 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.borderBottomColor = GOLD}
              onMouseLeave={e => e.currentTarget.style.borderBottomColor = `${GOLD}40`}
            >
              {viewAllLabel} →
            </button>
          )}
        </div>
      )}

      {/* Layer 3 — Intro paragraph */}
      {intro && (
        <p style={{
          fontFamily: FU,
          fontSize: introFontSize,
          fontWeight: 300,
          color: T.muted,
          margin: '16px 0 0',
          lineHeight: 1.7,
          letterSpacing: '0.01em',
          maxWidth: align === 'center' ? 640 : 720,
          marginLeft: align === 'center' ? 'auto' : 0,
          marginRight: align === 'center' ? 'auto' : 0,
        }}>
          {intro}
        </p>
      )}
    </div>
  );
}
