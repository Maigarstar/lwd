// ─── src/components/cards/editorial/ImageOverlayCard.jsx ─────────────────────
// Full-bleed image with text overlaid via gradient.
// Great for destination cards, featured stories, category teasers.
//
// variants:
//   "default"     → gradient overlay, text pinned bottom-left
//   "floating-box"→ SheerLuxe-style: floating cream/dark text box over image
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, RATIO, GOLD, resolvePalette, BookmarkIcon, MetaRow } from './cardTokens';

export default function ImageOverlayCard({ data = {} }) {
  const {
    image, title, category, date, excerpt,
    onClick, saved = false, onSave,
    variant = 'default',
    theme = 'auto',
    ratio = RATIO.landscape,
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);

  // ── Floating box variant (SheerLuxe-style) ───────────────────────────────
  if (variant === 'floating-box') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          borderRadius: 0,
          overflow: 'hidden',
          aspectRatio: ratio,
          background: C.dark,
        }}
      >
        {/* Background image */}
        {image && (
          <img
            src={image} alt={title || ''} loading="lazy"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover',
              transform: hover ? 'scale(1.04)' : 'scale(1)',
              transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            }}
          />
        )}

        {/* Floating text box — centred, appears over image */}
        <div style={{
          position: 'absolute',
          bottom: S.xl,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 'calc(100% - 80px)',
          maxWidth: 520,
          background: C.card,
          padding: `${S.lg}px ${S.xl}px`,
          borderRadius: 2,
          textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.15)',
        }}>
          <MetaRow
            category={category}
            date={date}
            color={C.grey}
            style={{ justifyContent: 'center', marginBottom: S.sm }}
          />
          <h3 style={{ ...T.titleMd, color: C.white, margin: `0 0 ${excerpt ? S.sm : 0}px` }}>
            {title}
          </h3>
          {excerpt && (
            <p style={{ ...T.bodySm, color: C.grey, margin: 0 }}>
              {excerpt}
            </p>
          )}
        </div>
      </div>
    );
  }

  // ── Default: gradient overlay, text bottom-left ───────────────────────────
  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        borderRadius: 0,
        overflow: 'hidden',
        aspectRatio: ratio,
        background: C.dark,
      }}
    >
      {/* Image */}
      {image && (
        <img
          src={image} alt={title || ''} loading="lazy"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            objectFit: 'cover',
            transform: hover ? 'scale(1.04)' : 'scale(1)',
            transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      )}

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.78) 0%, rgba(0,0,0,0.3) 45%, rgba(0,0,0,0) 70%)',
      }} />

      {/* Text — pinned bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0, left: 0, right: 0,
        padding: `${S.lg}px ${S.lg}px ${S.xl}px`,
      }}>
        <MetaRow
          category={category}
          date={date}
          color="rgba(255,255,255,0.75)"
          style={{ marginBottom: S.sm }}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: S.sm }}>
          <h3 style={{
            ...T.titleMd,
            color: '#ffffff',
            margin: 0,
            fontSize: 22,
          }}>
            {title}
          </h3>
          {onSave && (
            <BookmarkIcon filled={saved} color="#ffffff" onClick={onSave} />
          )}
        </div>
      </div>
    </div>
  );
}
