// ─── src/components/cards/editorial/CategoryTileCard.jsx ─────────────────────
// Full-width section header / category divider tile.
// Inspired by SheerLuxe's "THE GOLD EDIT" olive green band.
//
// variants:
//   "banner"  (default) → full-width coloured band, large centred title
//   "tile"              → square aspect-ratio tile (for navigation grids)
//   "with-image"        → background image + overlay + title
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette } from './cardTokens';

// Simple contrast helper: returns white or dark text based on bg
function autoTextColor(bg) {
  if (!bg) return '#ffffff';
  const hex = bg.replace('#', '');
  if (hex.length < 6) return '#ffffff';
  const r = parseInt(hex.slice(0, 2), 16);
  const g = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.55 ? '#1a1209' : '#ffffff';
}

export default function CategoryTileCard({ data = {} }) {
  const {
    title, eyebrow, image,
    accentBg = '#5c5f4a',
    onClick,
    variant = 'banner',
    theme = 'auto',
    align = 'center',
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);

  const textColor    = autoTextColor(accentBg);
  const eyebrowColor = textColor === '#ffffff' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)';

  // ── With-image variant ───────────────────────────────────────────────────
  if (variant === 'with-image') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 0,
          aspectRatio: '16 / 5',
          cursor: onClick ? 'pointer' : 'default',
          background: C.dark,
        }}
      >
        {image && (
          <img
            src={image} alt={title || ''} loading="lazy"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hover ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.6s ease',
            }}
          />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.42)',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: align === 'left' ? 'flex-start' : 'center',
          justifyContent: 'center',
          padding: `${S.xl}px ${S.xxl}px`,
          textAlign: align,
        }}>
          {eyebrow && (
            <p style={{ ...T.label, color: 'rgba(255,255,255,0.65)', margin: `0 0 ${S.sm}px` }}>
              {eyebrow}
            </p>
          )}
          <h2 style={{
            ...T.titleXl,
            color: '#ffffff',
            margin: 0,
            fontSize: 'clamp(32px, 4vw, 60px)',
            letterSpacing: '0.04em',
          }}>
            {title}
          </h2>
        </div>
      </div>
    );
  }

  // ── Tile variant (square, navigation grid) ───────────────────────────────
  if (variant === 'tile') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          aspectRatio: '1 / 1',
          background: accentBg,
          borderRadius: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          cursor: onClick ? 'pointer' : 'default',
          padding: S.xl,
          textAlign: 'center',
          transition: 'opacity 0.2s ease',
          opacity: hover ? 0.88 : 1,
        }}
      >
        {eyebrow && (
          <p style={{ ...T.label, color: eyebrowColor, margin: `0 0 ${S.xs}px` }}>
            {eyebrow}
          </p>
        )}
        <h3 style={{
          ...T.titleMd,
          color: textColor,
          margin: 0,
          fontSize: 'clamp(18px, 1.8vw, 26px)',
        }}>
          {title}
        </h3>
      </div>
    );
  }

  // ── Banner variant (default), full width coloured band ──────────────────
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        background: accentBg,
        padding: `${S.xxl}px ${S.xxl}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'left' ? 'flex-start' : 'center',
        textAlign: align,
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 0,
      }}
    >
      {eyebrow && (
        <p style={{
          ...T.label,
          color: eyebrowColor,
          margin: `0 0 ${S.sm}px`,
          letterSpacing: '0.15em',
        }}>
          {eyebrow}
        </p>
      )}
      <h2 style={{
        ...T.titleHero,
        color: textColor,
        margin: 0,
        fontSize: 'clamp(36px, 5vw, 72px)',
        letterSpacing: '0.04em',
        transition: 'opacity 0.2s ease',
        opacity: hover && onClick ? 0.82 : 1,
      }}>
        {title}
      </h2>
    </div>
  );
}
