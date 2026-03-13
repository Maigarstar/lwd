// ─── src/components/cards/editorial/ParallaxBannerCard.jsx ────────────────────
// Cinematic full-width banner with CSS parallax (background-attachment: fixed).
// The image stays fixed while the page scrolls — reveals different portions.
// Best with wide landscape or aerial photography.
//
// Height: 70vh default (configurable via data.height)
// variants:
//   "centered"   (default) → headline centred, gradient overlay
//   "bottom-text"          → text pinned to bottom-left, darker gradient from bottom
//   "minimal"              → almost no text, just the image + a very faint vignette
// ─────────────────────────────────────────────────────────────────────────────
import { GD, NU, T, S, GOLD } from './cardTokens';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

export default function ParallaxBannerCard({ data = {} }) {
  const {
    image,
    title,
    eyebrow,
    subtitle,
    cta,
    height = '70vh',
    overlay = 'medium',   // "light" | "medium" | "heavy"
    variant = 'centered',
  } = data;

  const { isMobile } = useBreakpoint();

  const overlayMap = {
    light:  'rgba(0,0,0,0.28)',
    medium: 'rgba(0,0,0,0.45)',
    heavy:  'rgba(0,0,0,0.65)',
  };
  const overlayColor = overlayMap[overlay] || overlayMap.medium;

  // On mobile, background-attachment:fixed can behave oddly (iOS ignores it).
  // Fall back to cover with object-fit for mobile.
  const bgStyle = isMobile
    ? {
        backgroundImage: `url(${image})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }
    : {
        backgroundImage: `url(${image})`,
        backgroundAttachment: 'fixed',
        backgroundSize: 'cover',
        backgroundPosition: 'center 40%',
      };

  const containerStyle = {
    position: 'relative',
    overflow: 'hidden',
    height,
    minHeight: isMobile ? 320 : 480,
    ...bgStyle,
  };

  const textPos = variant === 'bottom-text'
    ? { bottom: S.xxl, left: S.xxl, right: 'auto', top: 'auto', textAlign: 'left', alignItems: 'flex-start', justifyContent: 'flex-end' }
    : { inset: 0, textAlign: 'center', alignItems: 'center', justifyContent: 'center' };

  const gradient = variant === 'bottom-text'
    ? `linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 50%, transparent 100%)`
    : `radial-gradient(ellipse at center, transparent 30%, rgba(0,0,0,0.3) 100%), linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, ${overlayColor} 100%)`;

  return (
    <div style={containerStyle}>
      {/* Overlay */}
      <div style={{ position: 'absolute', inset: 0, background: gradient }} />

      {/* Text */}
      {variant !== 'minimal' && (
        <div style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          padding: isMobile ? `0 ${S.lg}px` : `0 ${S.xxl}px`,
          ...textPos,
        }}>
          {eyebrow && (
            <p style={{
              ...T.label,
              color: 'rgba(255,255,255,0.7)',
              margin: `0 0 ${S.md}px`,
              letterSpacing: '0.2em',
            }}>
              {eyebrow}
            </p>
          )}
          {title && (
            <h2 style={{
              fontFamily: GD,
              fontSize: isMobile ? 'clamp(32px, 8vw, 52px)' : 'clamp(44px, 5vw, 80px)',
              fontWeight: 400,
              color: '#ffffff',
              margin: 0,
              lineHeight: 1.05,
              letterSpacing: '0.02em',
              textShadow: '0 2px 20px rgba(0,0,0,0.3)',
              maxWidth: variant === 'bottom-text' ? 640 : 'none',
            }}>
              {title}
            </h2>
          )}
          {subtitle && (
            <p style={{
              ...T.body,
              color: 'rgba(255,255,255,0.75)',
              margin: `${S.md}px 0 0`,
              fontSize: 16,
              maxWidth: 560,
            }}>
              {subtitle}
            </p>
          )}
          {cta && (
            <a
              href={cta.href || '#'}
              onClick={cta.onClick}
              style={{
                display: 'inline-block',
                marginTop: S.lg,
                ...T.label,
                color: '#ffffff',
                letterSpacing: '0.15em',
                border: '1px solid rgba(255,255,255,0.6)',
                padding: `${S.sm}px ${S.xl}px`,
                textDecoration: 'none',
                transition: 'background 0.2s, border-color 0.2s',
                alignSelf: variant === 'centered' ? 'center' : 'flex-start',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = '#ffffff'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.6)'; }}
            >
              {cta.label}
            </a>
          )}
        </div>
      )}
    </div>
  );
}
