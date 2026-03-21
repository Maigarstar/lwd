// ─── src/components/cards/editorial/QuoteCard.jsx ────────────────────────────
// Editorial quote / pull-quote block.
// Large decorative quotation mark (Gilda Display, gold) + italic quote +
// attribution. Full-width coloured background, lots of breathing room.
//
// variants:
//   "centered"  (default) → centred layout, no image
//   "with-portrait"       → quote left, optional small portrait image right
// ─────────────────────────────────────────────────────────────────────────────
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette } from './cardTokens';

export default function QuoteCard({ data = {} }) {
  const {
    quote, attribution, attributionRole,
    image,
    accentBg,
    variant = 'centered',
    theme = 'auto',
  } = data;

  const ctx = useTheme();
  const C   = resolvePalette(ctx, theme);

  // Panel background: accentBg prop, or subtle tone based on mode
  const bg = accentBg || (theme === 'light' ? '#f9f6f0' : C.dark);
  const _abLc     = (accentBg || '').toLowerCase();
  const isLightBg = accentBg
    ? (_abLc.startsWith('#f') || _abLc.startsWith('#e') || _abLc.startsWith('#d'))
    : theme === 'light';
  const textColor = isLightBg ? '#1a1209' : '#f5f0e8';
  const muteColor = isLightBg ? 'rgba(30,20,5,0.5)' : 'rgba(245,240,232,0.55)';

  // ── With portrait variant ────────────────────────────────────────────────
  if (variant === 'with-portrait') {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        background: bg,
        borderRadius: 0,
        overflow: 'hidden',
        minHeight: 300,
      }}>
        {/* Quote section */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${S.xxl}px ${S.xxl}px ${S.xxl}px ${S.xxxl}px`,
        }}>
          {/* Big quote mark */}
          <div style={{
            fontFamily: GD,
            fontSize: 80,
            lineHeight: 0.8,
            color: GOLD,
            marginBottom: S.lg,
            userSelect: 'none',
          }}>
            "
          </div>

          <p style={{
            ...T.titleSm,
            fontStyle: 'italic',
            color: textColor,
            margin: `0 0 ${S.lg}px`,
            fontSize: 'clamp(17px, 1.6vw, 24px)',
            lineHeight: 1.5,
          }}>
            {quote}
          </p>

          {attribution && (
            <p style={{
              ...T.label,
              color: muteColor,
              margin: 0,
              letterSpacing: '0.1em',
            }}>
             , {attribution}
              {attributionRole && (
                <span style={{ fontWeight: 300, textTransform: 'none', letterSpacing: 0 }}>
                  , {attributionRole}
                </span>
              )}
            </p>
          )}
        </div>

        {/* Portrait image */}
        {image && (
          <div style={{
            flex: '0 0 240px',
            overflow: 'hidden',
          }}>
            <img
              src={image} alt={attribution || ''} loading="lazy"
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            />
          </div>
        )}
      </div>
    );
  }

  // ── Centered variant (default) ───────────────────────────────────────────
  return (
    <div style={{
      background: bg,
      borderRadius: 0,
      padding: `${S.xxxl}px ${S.xxl}px`,
      textAlign: 'center',
    }}>
      {/* Big decorative quote mark */}
      <div style={{
        fontFamily: GD,
        fontSize: 96,
        lineHeight: 0.7,
        color: GOLD,
        marginBottom: S.xl,
        userSelect: 'none',
      }}>
        "
      </div>

      <p style={{
        ...T.titleSm,
        fontStyle: 'italic',
        color: textColor,
        maxWidth: 680,
        margin: `0 auto ${S.xl}px`,
        fontSize: 'clamp(18px, 1.8vw, 26px)',
        lineHeight: 1.55,
      }}>
        {quote}
      </p>

      {attribution && (
        <div>
          {/* Gold divider line */}
          <div style={{
            width: 32,
            height: 1,
            background: GOLD,
            margin: `0 auto ${S.md}px`,
          }} />
          <p style={{
            ...T.label,
            color: muteColor,
            margin: 0,
            letterSpacing: '0.1em',
          }}>
            {attribution}
          </p>
          {attributionRole && (
            <p style={{
              ...T.meta,
              color: muteColor,
              margin: `${S.xs}px 0 0`,
              fontStyle: 'italic',
              textTransform: 'none',
            }}>
              {attributionRole}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
