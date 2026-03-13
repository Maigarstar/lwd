// ─── src/components/cards/editorial/FeatureCard.jsx ──────────────────────────
// Split-screen editorial feature card.
// 60% image + 40% coloured content panel (or reversed).
// Inspired by SheerLuxe's "Key New-Season Pieces" blush panel card.
//
// variants:
//   "image-left"  (default) → image left, text panel right
//   "image-right"           → text panel left, image right
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, RATIO, GOLD, resolvePalette, MetaRow, BookmarkIcon } from './cardTokens';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

export default function FeatureCard({ data = {} }) {
  const {
    image, title, excerpt, category, date,
    onClick, saved = false, onSave,
    accentBg,
    variant = 'image-left',
    theme = 'auto',
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);
  const { isMobile } = useBreakpoint();

  // Determine colours: if accentBg is a light colour, use dark text
  // Default to C.dark for the panel (works in both modes)
  const panelBg   = accentBg || C.dark;
  // Auto-detect if panel bg looks light (starts with #f or rgb > 200)
  const isLightBg = accentBg && (accentBg.startsWith('#f') || accentBg.startsWith('#e') || accentBg.startsWith('#d'));
  const textColor = isLightBg ? '#1a1a1a' : '#ffffff';
  const metaColor = isLightBg ? 'rgba(40,40,40,0.6)' : 'rgba(255,255,255,0.55)';

  const imageCol = (
    <div style={{
      flex: isMobile ? '0 0 100%' : '0 0 60%',
      position: 'relative',
      overflow: 'hidden',
      minHeight: isMobile ? 260 : 360,
    }}>
      {image && (
        <img
          src={image} alt={title || ''} loading="lazy"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: hover ? 'scale(1.03)' : 'scale(1)',
            transition: 'transform 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      )}
    </div>
  );

  const textCol = (
    <div style={{
      flex: isMobile ? '0 0 100%' : '0 0 40%',
      background: panelBg,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      padding: isMobile ? `${S.xl}px ${S.lg}px` : `${S.xxl}px ${S.xl}px`,
      position: 'relative',
    }}>
      <MetaRow
        category={category}
        date={date}
        color={metaColor}
        style={{ marginBottom: S.md }}
      />

      <h2 style={{
        ...T.titleLg,
        color: textColor,
        margin: `0 0 ${S.md}px`,
        fontSize: 'clamp(24px, 2.5vw, 36px)',
      }}>
        {title}
      </h2>

      {excerpt && (
        <p style={{
          ...T.body,
          color: isLightBg ? 'rgba(30,30,30,0.75)' : 'rgba(255,255,255,0.65)',
          margin: `0 0 ${S.lg}px`,
        }}>
          {excerpt}
        </p>
      )}

      {/* Bookmark */}
      {onSave && (
        <div style={{ position: 'absolute', top: S.lg, right: S.lg }}>
          <BookmarkIcon filled={saved} color={isLightBg ? '#8a6b1a' : GOLD} onClick={onSave} />
        </div>
      )}
    </div>
  );

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        display: 'flex',
        flexDirection: isMobile ? 'column' : (variant === 'image-right' ? 'row-reverse' : 'row'),
        overflow: 'hidden',
        borderRadius: 0,
        cursor: onClick ? 'pointer' : 'default',
        minHeight: isMobile ? 0 : 360,
      }}
    >
      {imageCol}
      {textCol}
    </div>
  );
}
