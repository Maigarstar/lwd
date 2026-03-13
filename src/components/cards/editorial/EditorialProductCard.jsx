// ─── src/components/cards/editorial/EditorialProductCard.jsx ─────────────────
// Styled product card for editorial commerce sections.
// Portrait image + brand (gold label) + editorial note (italic) + title +
// price + CTA link.
//
// variants:
//   "default"   → portrait 3:4, full card layout
//   "compact"   → landscape 4:3, reduced text
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, RATIO, GOLD, resolvePalette, ImageBox } from './cardTokens';

export default function EditorialProductCard({ data = {} }) {
  const {
    image, title, brand, editorialNote, price, originalPrice,
    category, href, onClick,
    variant = 'default',
    theme = 'auto',
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);

  const isCompact = variant === 'compact';

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        cursor: onClick || href ? 'pointer' : 'default',
        background: C.card,
        borderRadius: 0,
        overflow: 'hidden',
        border: `1px solid ${C.border}`,
      }}
    >
      {/* Image */}
      <ImageBox
        src={image}
        alt={title}
        ratio={isCompact ? RATIO.landscape : RATIO.portrait}
        zoom={hover}
        bgColor={C.dark}
        style={{ borderRadius: 0 }}
      />

      {/* Content */}
      <div style={{ padding: `${S.md}px ${S.md}px ${S.lg}px` }}>

        {/* Brand label — gold uppercase Nunito */}
        {brand && (
          <p style={{
            ...T.brand,
            color: GOLD,
            margin: `0 0 ${S.xs}px`,
          }}>
            {brand}
          </p>
        )}

        {/* Category fallback label */}
        {!brand && category && (
          <p style={{
            ...T.label,
            color: C.grey,
            margin: `0 0 ${S.xs}px`,
          }}>
            {category}
          </p>
        )}

        {/* Editorial note — italic Nunito */}
        {editorialNote && !isCompact && (
          <p style={{
            ...T.bodySm,
            fontStyle: 'italic',
            color: C.grey,
            margin: `0 0 ${S.sm}px`,
          }}>
            {editorialNote}
          </p>
        )}

        {/* Title */}
        <h3 style={{
          ...T.titleSm,
          color: C.white,
          margin: `0 0 ${S.sm}px`,
          fontSize: isCompact ? 16 : 20,
        }}>
          {title}
        </h3>

        {/* Price row */}
        {(price || originalPrice) && (
          <div style={{
            display: 'flex', alignItems: 'baseline',
            gap: S.sm,
            marginBottom: S.md,
          }}>
            {price && (
              <span style={{ ...T.body, fontWeight: 600, color: C.white }}>
                {price}
              </span>
            )}
            {originalPrice && (
              <span style={{
                ...T.bodySm,
                color: C.grey,
                textDecoration: 'line-through',
              }}>
                {originalPrice}
              </span>
            )}
          </div>
        )}

        {/* CTA link */}
        {href && (
          <a
            href={href}
            onClick={e => e.stopPropagation()}
            style={{
              ...T.label,
              color: GOLD,
              textDecoration: 'none',
              borderBottom: `1px solid ${GOLD}`,
              paddingBottom: 2,
              display: 'inline-block',
              transition: 'opacity 0.2s ease',
              opacity: hover ? 0.75 : 1,
            }}
          >
            Shop Now
          </a>
        )}
      </div>
    </div>
  );
}
