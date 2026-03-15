/**
 * SectionHeader, Compact two-layer heading for sidebar/tight sections.
 * Gold uppercase label + display headline with optional View All link.
 *
 * Use EditorialHeading for major editorial sections (3 layers with intro).
 * Use SectionHeader for compact sections (Trending, Honeymoons, etc.).
 */
import { getMagTheme, FD, FU, GOLD_CONST as GOLD, FD_LS } from '../magazineTheme';

export default function SectionHeader({ label, title, light = false, onViewAll, viewAllLabel = 'View All' }) {
  const T = getMagTheme(light);
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between',
      marginBottom: 36, gap: 16, flexWrap: 'wrap',
    }}>
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
          <div style={{ width: 20, height: 1, background: GOLD }} />
          <span style={{
            fontFamily: FU, fontSize: 8, fontWeight: 700,
            letterSpacing: '0.26em', textTransform: 'uppercase', color: GOLD,
          }}>
            {label}
          </span>
        </div>
        {title && (
          <h2 style={{
            fontFamily: FD,
            fontSize: 'clamp(26px, 3.5vw, 42px)',
            fontWeight: 400, color: T.text,
            margin: 0, lineHeight: 1.1,
            letterSpacing: FD_LS,
          }}>
            {title}
          </h2>
        )}
      </div>
      {onViewAll && (
        <button
          onClick={onViewAll}
          style={{
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
  );
}
