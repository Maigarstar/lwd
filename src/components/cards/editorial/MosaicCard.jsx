// ─── src/components/cards/editorial/MosaicCard.jsx ───────────────────────────
// Multi-image mosaic with floating centred text box.
// Inspired by SheerLuxe's "Fitness Brands" 4-panel mosaic card.
//
// Expects data.images (array of 2-5 urls). Falls back to data.image.
//
// variants:
//   "default" → 4-panel equal columns, floating text box centred at bottom
//   "offset"  → left col wider (2/5) + right col narrower + gold bg block offset
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette, MetaRow, BookmarkIcon } from './cardTokens';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

export default function MosaicCard({ data = {} }) {
  const {
    images = [], image,
    title, excerpt, category, date,
    onClick, saved = false, onSave,
    variant = 'default',
    theme = 'auto',
    height = 480,
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);
  const { isMobile } = useBreakpoint();

  // Resolve image list
  const imgs = images.length > 0
    ? images
    : image ? [image, image, image, image] : [];

  // Ensure we have at least 4 slots (pad with first image)
  const panels = Array.from({ length: 4 }, (_, i) => imgs[i] || imgs[0] || null);

  // ── Offset variant (SheerLuxe chandelier card) ───────────────────────────
  if (variant === 'offset') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          position: 'relative',
          cursor: onClick ? 'pointer' : 'default',
          display: 'grid',
          gridTemplateColumns: '3fr 2fr',
          gap: 0,
          height,
          borderRadius: 0,
          overflow: 'hidden',
        }}
      >
        {/* Gold background block (offset, behind the image) */}
        <div style={{
          position: 'absolute',
          top: 0, left: S.xl,
          width: '45%',
          height: '92%',
          background: GOLD,
          opacity: 0.9,
          borderRadius: 2,
          zIndex: 0,
        }} />

        {/* Left: large portrait image */}
        <div style={{ position: 'relative', zIndex: 1, overflow: 'hidden' }}>
          <img
            src={panels[0]} alt={title || ''} loading="lazy"
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hover ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.6s ease',
            }}
          />
        </div>

        {/* Right: text panel */}
        <div style={{
          position: 'relative', zIndex: 1,
          background: C.card,
          display: 'flex', flexDirection: 'column',
          justifyContent: 'flex-end',
          padding: `${S.xl}px ${S.lg}px`,
          margin: `${S.xxxl}px 0 0`,
          boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        }}>
          <MetaRow category={category} date={date} color={C.grey} style={{ marginBottom: S.sm }} />
          <h3 style={{ ...T.titleMd, color: C.white, margin: `0 0 ${S.sm}px` }}>
            {title}
          </h3>
          <a style={{
            ...T.label,
            color: GOLD,
            textDecoration: 'none',
            borderBottom: `1px solid ${GOLD}`,
            paddingBottom: 1,
            display: 'inline-block',
          }}>
            Read More
          </a>
        </div>
      </div>
    );
  }

  // ── Default: 4 equal panels + floating centred text box ──────────────────
  const effectiveHeight = isMobile ? Math.round(height * 0.65) : height;
  const panelCount = isMobile ? 2 : 4;
  const visiblePanels = panels.slice(0, panelCount);

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
        height: effectiveHeight,
      }}
    >
      {/* image grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${panelCount}, 1fr)`,
        height: '100%',
        gap: 0,
      }}>
        {visiblePanels.map((src, i) => (
          <div key={i} style={{ overflow: 'hidden', height: '100%' }}>
            {src && (
              <img
                src={src} alt={`panel ${i + 1}`} loading="lazy"
                style={{
                  width: '100%', height: '100%', objectFit: 'cover',
                  transform: hover ? 'scale(1.04)' : 'scale(1)',
                  transition: 'transform 0.65s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                }}
              />
            )}
          </div>
        ))}
      </div>

      {/* Floating centred text box */}
      <div style={{
        position: 'absolute',
        bottom: isMobile ? S.lg : S.xxl,
        left: '50%',
        transform: 'translateX(-50%)',
        width: isMobile ? 'calc(100% - 32px)' : 'clamp(280px, 55%, 580px)',
        background: C.card,
        padding: isMobile ? `${S.md}px ${S.lg}px` : `${S.xl}px ${S.xxl}px`,
        textAlign: 'center',
        boxShadow: '0 8px 40px rgba(0,0,0,0.18)',
        borderRadius: 2,
      }}>
        <MetaRow
          category={category}
          date={date}
          color={C.grey}
          style={{ justifyContent: 'center', marginBottom: S.sm }}
        />

        <h2 style={{
          ...T.titleLg,
          color: C.white,
          margin: `0 0 ${excerpt ? S.md : 0}px`,
          fontSize: 'clamp(22px, 2.2vw, 34px)',
        }}>
          {title}
        </h2>

        {excerpt && (
          <p style={{
            ...T.body,
            color: C.grey,
            margin: 0,
          }}>
            {excerpt}
          </p>
        )}

        {onSave && (
          <div style={{ position: 'absolute', top: S.md, right: S.md }}>
            <BookmarkIcon filled={saved} color={GOLD} onClick={onSave} />
          </div>
        )}
      </div>
    </div>
  );
}
