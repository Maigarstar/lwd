// ─── src/components/cards/editorial/cardTokens.jsx ───────────────────────────
// Shared design tokens, typography scale, spacing, and micro-components
// for the editorial card system.
//
// Typography rule (SACRED):
//   Gilda Display  → all headlines
//   Nunito Sans    → body text, UI, labels (uppercase for small labels)
//   No new fonts introduced.
// ─────────────────────────────────────────────────────────────────────────────
import { getDarkPalette, getLightPalette } from '../../../theme/tokens';

// ── Font CSS variables (set by ThemeLoader at boot) ──────────────────────────
export const GD = "var(--font-heading-primary)";  // Gilda Display
export const NU = "var(--font-body)";              // Nunito Sans

// ── Typography scale ─────────────────────────────────────────────────────────
export const T = {
  // Small labels — Nunito uppercase (never use GD for labels)
  label:     { fontFamily: NU, fontSize: 9,  letterSpacing: '0.13em', textTransform: 'uppercase', fontWeight: 600 },
  brand:     { fontFamily: NU, fontSize: 10, letterSpacing: '0.09em', textTransform: 'uppercase', fontWeight: 400 },
  meta:      { fontFamily: NU, fontSize: 11, fontWeight: 300 },

  // Body — Nunito light weight for editorial feel
  bodySm:    { fontFamily: NU, fontSize: 12, fontWeight: 300, lineHeight: 1.55 },
  body:      { fontFamily: NU, fontSize: 14, fontWeight: 300, lineHeight: 1.65 },
  bodyMd:    { fontFamily: NU, fontSize: 15, fontWeight: 300, lineHeight: 1.7  },

  // Headlines — Gilda Display only
  titleSm:   { fontFamily: GD, fontSize: 18, fontWeight: 400, lineHeight: 1.3  },
  titleMd:   { fontFamily: GD, fontSize: 24, fontWeight: 400, lineHeight: 1.2  },
  titleLg:   { fontFamily: GD, fontSize: 32, fontWeight: 400, lineHeight: 1.15 },
  titleXl:   { fontFamily: GD, fontSize: 44, fontWeight: 400, lineHeight: 1.1  },
  titleHero: { fontFamily: GD, fontSize: 56, fontWeight: 400, lineHeight: 1.05 },
};

// ── Image aspect ratios ───────────────────────────────────────────────────────
export const RATIO = {
  portrait:  '3 / 4',
  landscape: '4 / 3',
  square:    '1 / 1',
  wide:      '16 / 9',
  tall:      '2 / 3',
};

// ── Spacing scale (px) ───────────────────────────────────────────────────────
export const S = {
  xs:   6,
  sm:   12,
  md:   16,
  lg:   24,
  xl:   32,
  xxl:  48,
  xxxl: 64,
};

// ── Gold accent — matches site-wide value ────────────────────────────────────
export const GOLD = '#C9A84C';

// ── Resolve colour palette based on theme prop ───────────────────────────────
// theme prop: "auto" | "light" | "dark"
// "auto" → uses the ThemeContext palette (respects site toggle)
// "light" → forces light palette regardless of site mode
// "dark"  → forces dark palette regardless of site mode
export function resolvePalette(contextPalette, themeProp) {
  if (themeProp === 'light') return getLightPalette();
  if (themeProp === 'dark')  return getDarkPalette();
  return contextPalette; // "auto"
}

// ── Bookmark icon ─────────────────────────────────────────────────────────────
export function BookmarkIcon({ filled = false, color = GOLD, size = 14, onClick }) {
  return (
    <svg
      width={size}
      height={size * 1.3}
      viewBox="0 0 14 18"
      fill="none"
      onClick={e => { e.stopPropagation(); onClick?.(); }}
      style={{ cursor: 'pointer', flexShrink: 0, display: 'block' }}
    >
      <path
        d="M1 1h12v16l-6-4-6 4V1z"
        stroke={color}
        strokeWidth="1.2"
        fill={filled ? color : 'none'}
      />
    </svg>
  );
}

// ── Meta row: "CATEGORY / date" ───────────────────────────────────────────────
export function MetaRow({ category, date, color = '#888', style = {} }) {
  if (!category && !date) return null;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: S.xs, flexWrap: 'wrap', ...style }}>
      {category && (
        <span style={{ ...T.label, color }}>{category}</span>
      )}
      {category && date && (
        <span style={{ ...T.meta, color, opacity: 0.45 }}>/</span>
      )}
      {date && (
        <span style={{ ...T.meta, color, opacity: 0.7 }}>{date}</span>
      )}
    </div>
  );
}

// ── Responsive image box ──────────────────────────────────────────────────────
// Handles aspect ratio, overflow clip, and hover zoom.
export function ImageBox({ src, alt, ratio = RATIO.portrait, zoom = false, bgColor = '#1a1a1a', style = {}, objectPosition = 'center center' }) {
  return (
    <div style={{
      aspectRatio: ratio,
      overflow: 'hidden',
      borderRadius: 0,
      background: bgColor,
      ...style,
    }}>
      {src && (
        <img
          src={src}
          alt={alt || ''}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition,
            display: 'block',
            transform: zoom ? 'scale(1.05)' : 'scale(1)',
            transition: 'transform 0.55s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        />
      )}
    </div>
  );
}
