// ─── src/components/cards/editorial/CarouselCard.jsx ─────────────────────────
// Compact portrait card designed for horizontal scroll carousels.
// Inspired by SheerLuxe's "THE GOLD EDIT" product carousel.
//
// Width is fixed (220px default) — parent carousel handles the scroll container.
// variants:
//   "default"   → portrait 3:4, product name, brand below
//   "editorial" → portrait 3:4, category label, headline (editorial story link)
// ─────────────────────────────────────────────────────────────────────────────
import { useState, useRef } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, RATIO, GOLD, resolvePalette, ImageBox } from './cardTokens';

export default function CarouselCard({ data = {} }) {
  const {
    image, title, brand, category,
    price, onClick,
    variant = 'default',
    theme = 'auto',
    width = 220,
    imagePosition = 'center top',
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        width,
        flexShrink: 0,
        cursor: onClick ? 'pointer' : 'default',
        background: 'transparent',
      }}
    >
      {/* Image */}
      <ImageBox
        src={image}
        alt={title}
        ratio={RATIO.portrait}
        zoom={hover}
        bgColor={C.dark}
        objectPosition={imagePosition}
        style={{ marginBottom: S.sm }}
      />

      {/* Text */}
      <div style={{ paddingTop: S.xs }}>
        {variant === 'editorial' ? (
          <>
            {category && (
              <p style={{ ...T.label, color: C.grey, margin: `0 0 ${S.xs}px` }}>
                {category}
              </p>
            )}
            <h4 style={{
              ...T.titleSm,
              fontSize: 15,
              color: C.white,
              margin: 0,
              // 2-line clamp
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {title}
            </h4>
          </>
        ) : (
          <>
            {/* Product: title then brand */}
            <h4 style={{
              ...T.titleSm,
              fontSize: 15,
              color: C.white,
              margin: `0 0 ${S.xs}px`,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {title}
            </h4>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              {brand && (
                <p style={{ ...T.brand, color: C.grey, margin: 0 }}>
                  {brand}
                </p>
              )}
              {price && (
                <p style={{ ...T.bodySm, fontWeight: 500, color: C.white, margin: 0 }}>
                  {price}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Carousel wrapper (optional helper) ────────────────────────────────────────
// Wraps CarouselCards in a horizontal scroll container.
// Usage: <CarouselRow items={[...]} accentBg="#5c5f4a" label="THE GOLD EDIT" />
export function CarouselRow({
  items = [],
  accentBg,
  label,
  variant = 'default',
  theme = 'auto',
  cardWidth = 220,
}) {
  const ctx      = useTheme();
  const C        = resolvePalette(ctx, theme);
  const trackRef = useRef(null);

  const bg = accentBg || C.dark;
  // Check the actual resolved bg colour (not just accentBg) so cream fallback is also detected
  const isLightBg = bg.startsWith('#f') || bg.startsWith('#e') || bg.startsWith('#d') || bg.startsWith('#c');
  const labelColor = isLightBg ? '#1a1209' : '#ffffff';
  const arrowColor = isLightBg ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)';
  const arrowHover = isLightBg ? '#000000' : '#ffffff';
  const cardTheme  = isLightBg ? 'light' : 'dark';

  const scroll = (dir) => {
    if (!trackRef.current) return;
    trackRef.current.scrollBy({ left: dir * (cardWidth + S.lg) * 2, behavior: 'smooth' });
  };

  return (
    <div style={{ background: bg, overflow: 'hidden' }}>
      {/* Header row: label left, arrows right */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        padding: `${S.xxl}px ${S.xxl}px ${S.lg}px`,
      }}>
        {label && (
          <h3 style={{
            ...T.titleLg,
            color: labelColor,
            margin: 0,
            fontSize: 'clamp(24px, 3vw, 40px)',
            letterSpacing: '0.04em',
          }}>
            {label}
          </h3>
        )}
        {/* Arrow navigation */}
        <div style={{ display: 'flex', gap: S.sm, flexShrink: 0 }}>
          {['←', '→'].map((arrow, i) => (
            <button
              key={arrow}
              onClick={() => scroll(i === 0 ? -1 : 1)}
              style={{
                background: 'none',
                border: `1px solid ${arrowColor}`,
                color: arrowColor,
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontFamily: NU,
                fontSize: 14,
                transition: 'color 0.2s, border-color 0.2s',
                padding: 0,
              }}
              onMouseEnter={e => { e.currentTarget.style.color = arrowHover; e.currentTarget.style.borderColor = arrowHover; }}
              onMouseLeave={e => { e.currentTarget.style.color = arrowColor; e.currentTarget.style.borderColor = arrowColor; }}
            >
              {arrow}
            </button>
          ))}
        </div>
      </div>

      {/* Horizontal scroll track */}
      <div
        ref={trackRef}
        style={{
          display: 'flex',
          gap: S.lg,
          overflowX: 'auto',
          padding: `0 ${S.xxl}px ${S.xxl}px`,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {items.map((item, i) => (
          <CarouselCard
            key={i}
            data={{ ...item, variant, theme: cardTheme, width: cardWidth }}
          />
        ))}
      </div>
    </div>
  );
}
