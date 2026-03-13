// ─── src/components/cards/editorial/AmenitiesCard.jsx ─────────────────────────
// Luxury venue amenities / facilities display.
// SVG icon + label grid — 3-col or 4-col. Optional intro text.
// Inspired by Four Seasons, Aman, Rosewood hotel pages.
//
// data.amenities = [{ icon: "golf", label: "18-Hole Golf Course", sublabel: "Championship" }]
// Built-in icon set: golf, spa, pool, restaurant, bar, ballroom, ski, mountain,
//   gym, wine, music, fireplace, terrace, suite, helipad, lake, tennis, yoga
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette } from './cardTokens';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

// ── SVG icon library (line-art, 24×24 viewBox) ───────────────────────────────
const ICONS = {
  golf: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v14"/><path d="M12 2l5 3-5 3"/><circle cx="9" cy="20" r="2"/><path d="M7 20h10"/>
    </svg>
  ),
  spa: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10"/><path d="M12 8c0 2.5-2 4-2 6h4c0-2 2-3.5 2-6a4 4 0 0 0-8 0"/>
    </svg>
  ),
  pool: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20"/><path d="M2 17c1.5-1 3-1 4.5 0s3 1 4.5 0 3-1 4.5 0 3 1 4.5 0"/><circle cx="8" cy="7" r="2"/><path d="M10 9l2 3h2l1-3"/>
    </svg>
  ),
  restaurant: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 2.2 1.8 4 4 4s4-1.8 4-4V2"/><path d="M7 2v20"/><path d="M21 15V2l-3 7h3"/><path d="M18 22V9"/>
    </svg>
  ),
  bar: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8"/><path d="M12 11v11"/><path d="M20 4H4l4 7h8l4-7z"/>
    </svg>
  ),
  ballroom: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="7" width="20" height="14" rx="0"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M2 13h20"/>
    </svg>
  ),
  ski: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="17" cy="4" r="1.5"/><path d="M3 20l7-7 2 2 4-8 4 3"/><path d="M1 22h22"/>
    </svg>
  ),
  mountain: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3l4 8 5-3 3 13H2L8 3z"/><path d="M4.14 21S7 15 11 15s6.86 6 6.86 6"/>
    </svg>
  ),
  gym: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 5v14"/><path d="M18 5v14"/><path d="M6 12h12"/><rect x="2" y="8" width="4" height="8" rx="1"/><rect x="18" y="8" width="4" height="8" rx="1"/>
    </svg>
  ),
  wine: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 22h8"/><path d="M7 10h10"/><path d="M12 15v7"/><path d="M12 15A5 5 0 0 0 7 10V3h10v7a5 5 0 0 1-5 5z"/>
    </svg>
  ),
  music: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
    </svg>
  ),
  fireplace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 21h8"/><path d="M12 21v-4"/><rect x="2" y="3" width="20" height="14" rx="0"/><path d="M12 13c-2-2-2-4 0-5 2 3 4 1 2-1 2 2 2 5 0 6z"/>
    </svg>
  ),
  terrace: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17h18"/><path d="M3 17V9l9-6 9 6v8"/><path d="M9 17v-5h6v5"/>
    </svg>
  ),
  suite: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 9h20"/><path d="M2 9V5a1 1 0 0 1 1-1h18a1 1 0 0 1 1 1v4"/><path d="M2 9v10h20V9"/><path d="M7 14h10"/>
    </svg>
  ),
  helipad: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M8 8v8"/><path d="M8 12h5a2.5 2.5 0 0 0 0-5H8"/><path d="M16 16v-5"/>
    </svg>
  ),
  lake: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 16c1.5-1 3-1 4.5 0S9.5 17 11 16s3-1 4.5 0 3 1 4.5 0"/><path d="M2 20c1.5-1 3-1 4.5 0S9.5 21 11 20s3-1 4.5 0 3 1 4.5 0"/><path d="M12 2L8 8h8l-4-6z"/>
    </svg>
  ),
  tennis: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9"/><path d="M3.6 9a9 9 0 0 1 16.8 0"/><path d="M3.6 15a9 9 0 0 0 16.8 0"/>
    </svg>
  ),
  yoga: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="4" r="1.5"/><path d="M12 6v5l-4 4"/><path d="M12 11l4 4"/><path d="M6 14l2 6"/><path d="M18 14l-2 6"/>
    </svg>
  ),
};

export default function AmenitiesCard({ data = {} }) {
  const {
    amenities = [],
    title,
    description,
    accentBg,
    cols = 3,
    variant = 'default',   // "default" | "minimal" | "dark-icons"
    theme = 'auto',
  } = data;

  const ctx  = useTheme();
  const C    = resolvePalette(ctx, theme);
  const { isMobile, isTablet } = useBreakpoint();

  const bg        = accentBg || (theme === 'light' ? '#f9f6f0' : C.dark);
  const isLightBg = bg.startsWith('#f') || bg.startsWith('#e') || bg.startsWith('#d') || bg.startsWith('#c') || bg.startsWith('#FF') || bg === '#ffffff';
  const textColor = isLightBg ? '#1a1209' : '#ffffff';
  const muteColor = isLightBg ? 'rgba(26,18,9,0.5)' : 'rgba(255,255,255,0.5)';
  const iconColor = isLightBg ? '#1a1209' : GOLD;
  const divColor  = isLightBg ? 'rgba(26,18,9,0.1)' : 'rgba(255,255,255,0.1)';

  const effectiveCols = isMobile ? 2 : (isTablet ? Math.min(cols, 3) : cols);

  return (
    <div style={{
      background: bg,
      padding: isMobile ? `${S.xl}px ${S.lg}px` : `${S.xxl}px ${S.xxl}px`,
    }}>
      {/* Optional header */}
      {(title || description) && (
        <div style={{ maxWidth: 640, marginBottom: S.xxl }}>
          {title && (
            <h2 style={{
              ...T.titleLg,
              color: textColor,
              margin: `0 0 ${S.sm}px`,
              fontSize: 'clamp(22px, 2.5vw, 32px)',
            }}>
              {title}
            </h2>
          )}
          {description && (
            <p style={{ ...T.body, color: muteColor, margin: 0 }}>
              {description}
            </p>
          )}
        </div>
      )}

      {/* Amenity grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${effectiveCols}, 1fr)`,
        gap: `1px`,
        background: divColor,
        border: `1px solid ${divColor}`,
      }}>
        {amenities.map((a, i) => (
          <AmenityCell
            key={i}
            amenity={a}
            iconColor={iconColor}
            textColor={textColor}
            muteColor={muteColor}
            bg={bg}
            isMobile={isMobile}
          />
        ))}
      </div>
    </div>
  );
}

function AmenityCell({ amenity, iconColor, textColor, muteColor, bg, isMobile }) {
  const [hover, setHover] = useState(false);
  const icon = ICONS[amenity.icon];

  return (
    <div
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? (bg.startsWith('#f') ? '#f0ead8' : 'rgba(255,255,255,0.05)') : bg,
        padding: isMobile ? `${S.lg}px ${S.md}px` : `${S.xl}px ${S.lg}px`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        gap: S.sm,
        transition: 'background 0.2s ease',
      }}
    >
      {icon && (
        <div style={{
          width: 28,
          height: 28,
          color: hover ? GOLD : iconColor,
          transition: 'color 0.2s ease',
          flexShrink: 0,
        }}>
          {icon}
        </div>
      )}
      <div>
        <p style={{
          ...T.label,
          color: textColor,
          margin: 0,
          letterSpacing: '0.08em',
          fontSize: 10,
        }}>
          {amenity.label}
        </p>
        {amenity.sublabel && (
          <p style={{ ...T.meta, color: muteColor, margin: `${S.xs / 2}px 0 0`, fontSize: 10 }}>
            {amenity.sublabel}
          </p>
        )}
      </div>
    </div>
  );
}
