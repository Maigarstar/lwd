// ─── src/components/cards/editorial/EditorialFeatureCard.jsx ─────────────────
// Full-viewport-width hero editorial card.
// Inspired by SheerLuxe's hero with 5 fashion-model panels + centred text box.
//
// Expects data.images (2-5 urls). Falls back to data.image (single).
//
// variants:
//   "mosaic"  (default) → N equal panels side by side + floating centred text
//   "split"             → large image left (70%) + text panel right (30%)
//   "cinematic"         → single full-bleed image + floating text box (no panels)
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette, MetaRow, BookmarkIcon } from './cardTokens';

export default function EditorialFeatureCard({ data = {} }) {
  const {
    images = [], image,
    title, excerpt, category, date,
    onClick, saved = false, onSave,
    variant = 'mosaic',
    theme = 'auto',
    height = '75vh',
  } = data;

  const ctx   = useTheme();
  const C     = resolvePalette(ctx, theme);
  const [hover, setHover] = useState(false);

  // Resolve image list
  const imgs = images.length > 0
    ? images
    : image ? [image] : [];

  const panelCount = Math.min(Math.max(imgs.length, 1), 5);
  const panels     = Array.from({ length: panelCount }, (_, i) => imgs[i] || imgs[0] || null);

  // ── Split variant ────────────────────────────────────────────────────────
  if (variant === 'split') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          display: 'flex',
          borderRadius: 0,
          overflow: 'hidden',
          height,
          cursor: onClick ? 'pointer' : 'default',
        }}
      >
        {/* Large image — 70% */}
        <div style={{ flex: '0 0 70%', position: 'relative', overflow: 'hidden' }}>
          {imgs[0] && (
            <img
              src={imgs[0]} alt={title || ''} loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hover ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
              }}
            />
          )}
        </div>

        {/* Text panel — 30% */}
        <div style={{
          flex: '0 0 30%',
          background: C.card,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: `${S.xxl}px ${S.xl}px`,
          borderLeft: `1px solid ${C.border}`,
        }}>
          <MetaRow category={category} date={date} color={C.grey} style={{ marginBottom: S.lg }} />
          <h1 style={{
            ...T.titleXl,
            color: C.white,
            margin: `0 0 ${S.lg}px`,
            fontSize: 'clamp(28px, 2.5vw, 48px)',
          }}>
            {title}
          </h1>
          {excerpt && (
            <p style={{ ...T.body, color: C.grey, margin: `0 0 ${S.xl}px` }}>
              {excerpt}
            </p>
          )}
          {onSave && <BookmarkIcon filled={saved} color={GOLD} onClick={onSave} />}
        </div>
      </div>
    );
  }

  // ── Cinematic variant (single full-bleed image) ───────────────────────────
  if (variant === 'cinematic') {
    return (
      <div
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onClick={onClick}
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 0,
          height,
          cursor: onClick ? 'pointer' : 'default',
          background: C.dark,
        }}
      >
        {imgs[0] && (
          <img
            src={imgs[0]} alt={title || ''} loading="lazy"
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%', objectFit: 'cover',
              transform: hover ? 'scale(1.03)' : 'scale(1)',
              transition: 'transform 0.7s ease',
            }}
          />
        )}

        {/* Subtle vignette */}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 100%)',
        }} />

        {/* Floating text box */}
        <div style={{
          position: 'absolute',
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'clamp(300px, 50%, 640px)',
          background: C.card,
          padding: `${S.xxl}px ${S.xxxl}px`,
          textAlign: 'center',
          borderRadius: 2,
          boxShadow: '0 12px 60px rgba(0,0,0,0.25)',
        }}>
          <MetaRow
            category={category} date={date} color={C.grey}
            style={{ justifyContent: 'center', marginBottom: S.md }}
          />
          <h1 style={{
            ...T.titleXl,
            color: C.white,
            margin: `0 0 ${excerpt ? S.md : 0}px`,
            fontSize: 'clamp(28px, 3vw, 52px)',
          }}>
            {title}
          </h1>
          {excerpt && (
            <p style={{ ...T.body, color: C.grey, margin: 0 }}>
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

  // ── Mosaic variant (default) — N image panels + floating text ────────────
  // Panel widths: centre panel slightly wider for visual rhythm
  const panelWidths = panelCount === 5
    ? ['18%', '22%', '20%', '22%', '18%']
    : panelCount === 4
    ? ['22%', '28%', '28%', '22%']
    : panelCount === 3
    ? ['28%', '44%', '28%']
    : panelCount === 2
    ? ['50%', '50%']
    : ['100%'];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 0,
        height,
        cursor: onClick ? 'pointer' : 'default',
        gap: 0,
      }}
    >
      {/* Image panels */}
      {panels.map((src, i) => (
        <div
          key={i}
          style={{
            width: panelWidths[i] || `${100 / panelCount}%`,
            flexShrink: 0,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {src && (
            <img
              src={src} alt={`panel ${i + 1}`} loading="lazy"
              style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                transform: hover ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
                // Slight delay offset per panel for wave effect
                transitionDelay: `${i * 0.04}s`,
              }}
            />
          )}
        </div>
      ))}

      {/* Floating centred text box */}
      <div style={{
        position: 'absolute',
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 'clamp(280px, 48%, 620px)',
        background: C.card,
        padding: `${S.xl}px ${S.xxl}px ${S.xxl}px`,
        textAlign: 'center',
        borderRadius: 2,
        boxShadow: '0 16px 64px rgba(0,0,0,0.22)',
        zIndex: 2,
      }}>
        <MetaRow
          category={category} date={date} color={C.grey}
          style={{ justifyContent: 'center', marginBottom: S.md }}
        />
        <h1 style={{
          ...T.titleXl,
          color: C.white,
          margin: `0 0 ${excerpt ? S.md : 0}px`,
          fontSize: 'clamp(26px, 2.8vw, 50px)',
        }}>
          {title}
        </h1>
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
