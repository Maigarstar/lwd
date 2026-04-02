// ─── src/components/cards/editorial/TwoColumnEditorialCard.jsx ────────────────
// Magazine-style two-column text spread, no primary image.
// Left column: large serif headline + optional pull-stat or decorative element.
// Right column: 1–3 paragraphs of body copy + optional CTA.
// Inspired by Condé Nast Traveller print double-page editorial spreads.
//
// variants:
//   "default"      → left: headline + gold bar, right: body copy
//   "with-pullstat"→ left: headline + big stat callout, right: body
//   "centered"     → single centered column (max 720px), no split
// ─────────────────────────────────────────────────────────────────────────────
import { useTheme } from '../../../theme/ThemeContext';
import { GD, NU, T, S, GOLD, resolvePalette } from './cardTokens';
import { useBreakpoint } from '../../../hooks/useWindowWidth';

export default function TwoColumnEditorialCard({ data = {} }) {
  const {
    eyebrow,
    title,
    body,           // string or array of paragraph strings
    cta,            // { label, href, onClick }
    pullStat,       // { value: "1,070m", label: "Altitude" }
    accentBg,
    variant = 'default',
    theme = 'auto',
    align = 'left',
  } = data;

  const ctx  = useTheme();
  const C    = resolvePalette(ctx, theme);
  const { isMobile } = useBreakpoint();

  const bg        = accentBg || (theme === 'light' ? '#f9f6f0' : C.dark);
  const _bgLc     = bg.toLowerCase();
  const isLightBg = !accentBg
    ? theme === 'light'
    : (_bgLc.startsWith('#f') || _bgLc.startsWith('#e') || _bgLc.startsWith('#d') || _bgLc.startsWith('#c'));
  const textColor = isLightBg ? '#1a1209' : '#f5f0e8';
  const muteColor = isLightBg ? 'rgba(26,18,9,0.55)' : 'rgba(245,240,232,0.55)';

  const paragraphs = Array.isArray(body) ? body : (body ? [body] : []);

  // ── Centered variant ──────────────────────────────────────────────────────
  if (variant === 'centered') {
    return (
      <div style={{
        background: bg,
        padding: isMobile ? `${S.xxl}px ${S.lg}px` : `${S.xxxl}px ${S.xxl}px`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto' }}>
          {eyebrow && (
            <p style={{ ...T.label, color: GOLD, margin: `0 0 ${S.md}px`, letterSpacing: '0.15em' }}>
              {eyebrow}
            </p>
          )}
          <h2 style={{
            ...T.titleLg,
            color: textColor,
            margin: `0 0 ${S.xl}px`,
            fontSize: 'clamp(28px, 3vw, 44px)',
          }}>
            {title}
          </h2>
          {/* Gold divider */}
          <div style={{ width: 40, height: 1, background: GOLD, margin: `0 auto ${S.xl}px` }} />
          {paragraphs.map((p, i) => (
            <p key={i} style={{
              ...T.body,
              color: muteColor,
              margin: i < paragraphs.length - 1 ? `0 0 ${S.md}px` : 0,
              fontSize: 15,
              lineHeight: 1.75,
            }}>
              {p}
            </p>
          ))}
          {cta && (
            <a
              href={cta.href || '#'}
              onClick={cta.onClick}
              style={{
                display: 'inline-block',
                marginTop: S.xl,
                ...T.label,
                color: GOLD,
                letterSpacing: '0.12em',
                borderBottom: `1px solid ${GOLD}`,
                paddingBottom: 3,
                textDecoration: 'none',
              }}
            >
              {cta.label}
            </a>
          )}
        </div>
      </div>
    );
  }

  // ── Two-column layout ─────────────────────────────────────────────────────
  return (
    <div style={{
      background: bg,
      padding: isMobile ? `${S.xxl}px ${S.lg}px` : `${S.xxxl}px ${S.xxl}px`,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? S.xl : S.xxl,
      alignItems: 'flex-start',
    }}>
      {/* LEFT: headline */}
      <div style={{
        flex: '0 0 auto',
        width: isMobile ? '100%' : '40%',
      }}>
        {eyebrow && (
          <p style={{ ...T.label, color: GOLD, margin: `0 0 ${S.md}px`, letterSpacing: '0.15em' }}>
            {eyebrow}
          </p>
        )}
        <h2 style={{
          ...T.titleLg,
          color: textColor,
          margin: 0,
          fontSize: 'clamp(26px, 3vw, 44px)',
          lineHeight: 1.1,
        }}>
          {title}
        </h2>

        {/* Pull stat or gold bar */}
        {variant === 'with-pullstat' && pullStat ? (
          <div style={{ marginTop: S.xl }}>
            <div style={{
              fontFamily: GD,
              fontSize: 'clamp(52px, 6vw, 80px)',
              color: GOLD,
              lineHeight: 1,
              fontWeight: 400,
            }}>
              {pullStat.value}
            </div>
            <p style={{ ...T.label, color: muteColor, margin: `${S.xs}px 0 0`, letterSpacing: '0.12em' }}>
              {pullStat.label}
            </p>
          </div>
        ) : (
          <div style={{
            width: 40,
            height: 1,
            background: GOLD,
            marginTop: S.xl,
          }} />
        )}
      </div>

      {/* RIGHT: body */}
      <div style={{ flex: 1 }}>
        {paragraphs.map((p, i) => (
          <p key={i} style={{
            ...T.body,
            color: muteColor,
            margin: i < paragraphs.length - 1 ? `0 0 ${S.md}px` : 0,
            fontSize: 15,
            lineHeight: 1.8,
          }}>
            {p}
          </p>
        ))}
        {cta && (
          <a
            href={cta.href || '#'}
            onClick={cta.onClick}
            style={{
              display: 'inline-block',
              marginTop: S.lg,
              ...T.label,
              color: GOLD,
              letterSpacing: '0.12em',
              borderBottom: `1px solid ${GOLD}`,
              paddingBottom: 3,
              textDecoration: 'none',
            }}
          >
            {cta.label}
          </a>
        )}
      </div>
    </div>
  );
}
