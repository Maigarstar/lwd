// ─── src/components/cards/editorial/StandardCard.jsx ─────────────────────────
// The workhorse editorial card. Used in 3-col grids, article lists, etc.
//
// variants:
//   "default"   → portrait 3:4 image, text below (SheerLuxe standard card)
//   "landscape" → landscape 4:3 image, text below
//   "minimal"   → small 72px thumbnail left, text right (compact list)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, RATIO, GOLD, resolvePalette, BookmarkIcon, MetaRow, ImageBox } from './cardTokens';

export default function StandardCard({ data = {} }) {
  const {
    image, title, category, date,
    onClick, href,
    saved = false, onSave,
    variant = 'default',
    theme = 'auto',
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);

  const handlers = {
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    onClick,
    style: { cursor: onClick || href ? 'pointer' : 'default' },
  };

  // ── Minimal variant: thumbnail + text side by side ──────────────────────
  if (variant === 'minimal') {
    return (
      <div
        {...handlers}
        style={{
          ...handlers.style,
          display: 'flex',
          gap: S.md,
          alignItems: 'flex-start',
          paddingBottom: S.lg,
          borderBottom: `1px solid ${C.border}`,
        }}
      >
        <div style={{
          width: 72, height: 72, flexShrink: 0,
          borderRadius: 0,
          overflow: 'hidden',
          background: C.dark,
        }}>
          {image && (
            <img
              src={image} alt={title || ''} loading="lazy"
              style={{
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hover ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform 0.5s ease',
              }}
            />
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <MetaRow category={category} date={date} color={C.grey} style={{ marginBottom: S.xs }} />
          <h3 style={{ ...T.titleSm, color: C.white, margin: 0, fontSize: 16 }}>
            {title}
          </h3>
        </div>
      </div>
    );
  }

  // ── Default / landscape: image top, text below ──────────────────────────
  const ratio = variant === 'landscape' ? RATIO.landscape : RATIO.portrait;

  return (
    <div {...handlers} style={{ ...handlers.style, background: 'transparent' }}>
      <ImageBox
        src={image}
        alt={title}
        ratio={ratio}
        zoom={hover}
        bgColor={C.dark}
      />

      {/* Text block */}
      <div style={{ paddingTop: S.sm }}>
        <div style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: S.sm,
          marginBottom: S.xs,
        }}>
          <MetaRow category={category} date={date} color={C.grey} />
          {onSave && (
            <BookmarkIcon filled={saved} color={GOLD} onClick={onSave} />
          )}
        </div>

        <h3 style={{
          ...T.titleSm,
          color: C.white,
          margin: 0,
          // Subtle underline on hover instead of colour change
          textDecoration: hover ? 'underline' : 'none',
          textDecorationColor: GOLD,
          textUnderlineOffset: '3px',
          transition: 'text-decoration 0.2s ease',
        }}>
          {title}
        </h3>
      </div>
    </div>
  );
}
