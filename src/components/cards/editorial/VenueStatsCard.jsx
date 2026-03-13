// ─── src/components/cards/editorial/VenueStatsCard.jsx ────────────────────────
// Luxury venue key-metrics strip.
// A full-width horizontal band of 3–6 numbered stats with labels.
// Inspired by Condé Nast Traveller venue profiles & Four Seasons fact sheets.
//
// data.stats = [{ value: "450", label: "Maximum Guests" }, ...]
// variants:
//   "strip"   (default) → flat bg band, stat columns side by side
//   "over-image"        → stats float over a background image with overlay
// ─────────────────────────────────────────────────────────────────────────────
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette } from './cardTokens';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

export default function VenueStatsCard({ data = {} }) {
  const {
    stats = [],
    eyebrow,
    image,
    accentBg,
    variant = 'strip',
    theme = 'auto',
  } = data;

  const ctx  = useTheme();
  const C    = resolvePalette(ctx, theme);
  const { isMobile } = useBreakpoint();

  const bg        = accentBg || C.dark;
  const isLightBg = bg.startsWith('#f') || bg.startsWith('#e') || bg.startsWith('#d') || bg.startsWith('#c');
  const textColor = isLightBg ? '#1a1209' : '#ffffff';
  const muteColor = isLightBg ? 'rgba(26,18,9,0.5)' : 'rgba(255,255,255,0.55)';
  const divColor  = isLightBg ? 'rgba(26,18,9,0.12)' : 'rgba(255,255,255,0.15)';

  // ── Over-image variant ───────────────────────────────────────────────────
  if (variant === 'over-image') {
    return (
      <div style={{ position: 'relative', overflow: 'hidden' }}>
        {image && (
          <img
            src={image} alt="" loading="lazy"
            style={{ display: 'block', width: '100%', height: isMobile ? 480 : 560, objectFit: 'cover' }}
          />
        )}
        {/* Dark gradient overlay */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.25) 60%, transparent 100%)',
        }} />
        {/* Stats row */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: isMobile ? `${S.xl}px ${S.lg}px` : `${S.xxl}px ${S.xxl}px`,
        }}>
          {eyebrow && (
            <p style={{ ...T.label, color: 'rgba(255,255,255,0.6)', margin: `0 0 ${S.lg}px`, letterSpacing: '0.15em' }}>
              {eyebrow}
            </p>
          )}
          <div style={{
            display: 'flex',
            flexWrap: isMobile ? 'wrap' : 'nowrap',
            gap: isMobile ? `${S.lg}px ${S.xl}px` : 0,
          }}>
            {stats.map((s, i) => (
              <StatCol
                key={i}
                stat={s}
                isLast={i === stats.length - 1}
                textColor="#ffffff"
                muteColor="rgba(255,255,255,0.55)"
                divColor="rgba(255,255,255,0.2)"
                isMobile={isMobile}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Strip variant (default) ──────────────────────────────────────────────
  return (
    <div style={{
      background: bg,
      padding: isMobile ? `${S.xl}px ${S.lg}px` : `${S.xxl}px ${S.xxl}px`,
    }}>
      {eyebrow && (
        <p style={{
          ...T.label, color: muteColor,
          margin: `0 0 ${S.xl}px`,
          letterSpacing: '0.15em',
          textAlign: 'center',
        }}>
          {eyebrow}
        </p>
      )}
      <div style={{
        display: 'flex',
        flexWrap: isMobile ? 'wrap' : 'nowrap',
        gap: isMobile ? `${S.lg}px ${S.xl}px` : 0,
        justifyContent: isMobile ? 'flex-start' : 'center',
      }}>
        {stats.map((s, i) => (
          <StatCol
            key={i}
            stat={s}
            isLast={i === stats.length - 1}
            textColor={textColor}
            muteColor={muteColor}
            divColor={divColor}
            isMobile={isMobile}
            centered={!isMobile}
          />
        ))}
      </div>
    </div>
  );
}

function StatCol({ stat, isLast, textColor, muteColor, divColor, isMobile, centered = true }) {
  return (
    <div style={{
      flex: isMobile ? '0 0 calc(50% - 12px)' : 1,
      borderRight: (!isMobile && !isLast) ? `1px solid ${divColor}` : 'none',
      padding: isMobile ? 0 : `0 ${S.xl}px`,
      textAlign: centered ? 'center' : 'left',
    }}>
      <div style={{
        fontFamily: GD,
        fontSize: isMobile ? 36 : 'clamp(36px, 4vw, 56px)',
        fontWeight: 400,
        color: textColor,
        lineHeight: 1,
        marginBottom: S.xs,
      }}>
        {stat.value}
      </div>
      <p style={{
        ...T.label,
        color: muteColor,
        margin: `0 0 ${stat.sublabel ? S.xs + 'px' : 0}`,
        letterSpacing: '0.1em',
      }}>
        {stat.label}
      </p>
      {stat.sublabel && (
        <p style={{ ...T.meta, color: muteColor, margin: 0, opacity: 0.7 }}>
          {stat.sublabel}
        </p>
      )}
    </div>
  );
}
