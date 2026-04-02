// ─── src/components/showcase/ShowcasePricing.jsx ─────────────────────────────
// "Pricing & What to Expect" — honest, range-based pricing section.
//
// Price figures are rendered at headline scale — matching the hero stats bar.
// Includes/excludes are rendered as clean editorial lists, not pills.
//
// Props:
//   data        — venue_showcases row (or subset)
//   venueName   — string, used in contextual copy
//   accentColor — gold/brand colour
//   theme       — 'light' | 'dark'
//   bg          — override background colour
// ─────────────────────────────────────────────────────────────────────────────
import { useBreakpoint } from '../../hooks/useWindowWidth';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

function fmt(pence, currency = 'GBP') {
  if (!pence && pence !== 0) return null;
  const amount = Math.round(pence / 100);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

// A single headline price figure: label → big number → optional sub-label
function PriceFigure({ label, value, sub, gold, text, muted }) {
  if (!value) return null;
  return (
    <div style={{ paddingRight: 8 }}>
      <div style={{
        fontFamily: NU, fontSize: 9, fontWeight: 700,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: gold, marginBottom: 10,
      }}>
        {label}
      </div>
      <div style={{
        fontFamily: GD,
        fontSize: 'clamp(36px, 4.5vw, 56px)',
        color: text, lineHeight: 1, marginBottom: 6,
        fontWeight: 400,
      }}>
        {value}
      </div>
      {sub && (
        <div style={{
          fontFamily: NU, fontSize: 11, color: muted, letterSpacing: '0.04em',
        }}>
          {sub}
        </div>
      )}
    </div>
  );
}

// A single item in the includes/excludes editorial list
function ListItem({ item, gold, text, muted, isInclude }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '9px 0',
    }}>
      <span style={{
        fontFamily: NU, fontSize: 13,
        color: isInclude ? gold : muted,
        flexShrink: 0, marginTop: 1, lineHeight: 1,
        opacity: isInclude ? 1 : 0.6,
      }}>
        {isInclude ? '—' : '○'}
      </span>
      <span style={{
        fontFamily: NU, fontSize: 14, color: isInclude ? text : muted,
        lineHeight: 1.5,
      }}>
        {item}
      </span>
    </div>
  );
}

export default function ShowcasePricing({
  data = {},
  venueName = 'This venue',
  accentColor,
  theme = 'light',
  bg: bgOverride,
}) {
  const { isMobile } = useBreakpoint();

  const isLight = theme === 'light';
  const bg      = bgOverride || (isLight ? '#faf9f6' : '#130f1e');
  const text    = isLight ? '#1a1209' : '#f5f0e8';
  const muted   = isLight ? 'rgba(26,18,9,0.6)' : 'rgba(245,240,232,0.55)';
  const border  = isLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const gold    = accentColor || '#C4A35A';
  const divider = isLight ? 'rgba(26,18,9,0.12)' : 'rgba(245,240,232,0.12)';

  const {
    currency = 'GBP',
    venue_hire_from,
    typical_wedding_spend_min,
    typical_wedding_spend_max,
    minimum_spend,
    price_per_head_from,
    pricing_notes,
    pricing_includes = [],
    pricing_excludes = [],
  } = data;

  // Spend range sentence — AI-extractable
  const hasSpend = typical_wedding_spend_min || typical_wedding_spend_max;
  const spendMin = fmt(typical_wedding_spend_min, currency);
  const spendMax = fmt(typical_wedding_spend_max, currency);
  const spendSentence = hasSpend
    ? `Weddings at ${venueName} typically represent a total investment of ${[spendMin, spendMax].filter(Boolean).join(' to ')}, depending on guest count, season, and the level of bespoke elements chosen.`
    : null;

  const hasAnyPricingData = [
    venue_hire_from, typical_wedding_spend_min, typical_wedding_spend_max,
    minimum_spend, price_per_head_from, pricing_notes,
    (pricing_includes || []).length, (pricing_excludes || []).length,
  ].some(v => v);

  if (!hasAnyPricingData) return null;

  // Build key price figures for the headline row
  const priceFigures = [
    venue_hire_from   && { label: 'Venue Hire From', value: fmt(venue_hire_from, currency),   sub: 'starting point' },
    minimum_spend     && { label: 'Minimum Spend',   value: fmt(minimum_spend, currency),     sub: 'required investment' },
    price_per_head_from && { label: 'Per Head From', value: fmt(price_per_head_from, currency), sub: 'per guest' },
  ].filter(Boolean);

  return (
    <div style={{
      background: bg,
      padding: isMobile ? '56px 24px' : '80px 64px',
    }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>

        {/* Eyebrow + heading */}
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: gold, margin: '0 0 14px',
        }}>
          Pricing &amp; What to Expect
        </p>
        <h2 style={{
          fontFamily: GD, fontSize: isMobile ? 26 : 38,
          color: text, margin: '0 0 8px', fontWeight: 400, lineHeight: 1.15,
        }}>
          Understanding the Investment
        </h2>
        <div style={{ width: 40, height: 1, background: gold, margin: '0 0 36px' }} />

        {/* Spend range summary — AI-extractable italic sentence */}
        {spendSentence && (
          <p style={{
            fontFamily: NU, fontSize: 15, lineHeight: 1.8,
            color: text, margin: '0 0 28px', fontStyle: 'italic',
          }}>
            {spendSentence}
          </p>
        )}

        {/* Pricing context / notes */}
        {pricing_notes && (
          <p style={{
            fontFamily: NU, fontSize: 14, lineHeight: 1.8,
            color: muted, margin: '0 0 48px',
          }}>
            {pricing_notes}
          </p>
        )}

        {/* ── Headline price figures ── */}
        {priceFigures.length > 0 && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${priceFigures.length}, 1fr)`,
            gap: 0,
            borderTop: `1px solid ${border}`,
            borderBottom: `1px solid ${border}`,
            paddingTop: 32,
            paddingBottom: 32,
            marginBottom: 48,
          }}>
            {priceFigures.map((fig, i) => (
              <div key={i} style={{
                paddingRight: i < priceFigures.length - 1 ? 32 : 0,
                paddingLeft: i > 0 ? 32 : 0,
                borderRight: i < priceFigures.length - 1 ? `1px solid ${divider}` : 'none',
              }}>
                <PriceFigure
                  label={fig.label}
                  value={fig.value}
                  sub={fig.sub}
                  gold={gold}
                  text={text}
                  muted={muted}
                />
              </div>
            ))}
          </div>
        )}

        {/* ── Includes / Excludes — two editorial columns with divider ── */}
        {((pricing_includes?.length > 0) || (pricing_excludes?.length > 0)) && (
          <div style={{
            display: isMobile ? 'block' : 'grid',
            gridTemplateColumns: '1fr 1px 1fr',
            gap: isMobile ? 0 : '0 40px',
            paddingTop: 4,
          }}>
            {/* Column 1: Typically Includes */}
            {pricing_includes?.length > 0 && (
              <div>
                <p style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: gold, margin: '0 0 8px',
                }}>
                  Typically Includes
                </p>
                <div>
                  {pricing_includes.map((item, i) => (
                    <ListItem key={i} item={item} gold={gold} text={text} muted={muted} isInclude={true} />
                  ))}
                </div>
              </div>
            )}

            {/* Vertical divider */}
            {!isMobile && pricing_includes?.length > 0 && pricing_excludes?.length > 0 && (
              <div style={{ background: divider, width: 1 }} />
            )}

            {/* Column 2: Additional Costs */}
            {pricing_excludes?.length > 0 && (
              <div style={{ marginTop: isMobile ? 32 : 0 }}>
                <p style={{
                  fontFamily: NU, fontSize: 10, fontWeight: 700,
                  letterSpacing: '0.14em', textTransform: 'uppercase',
                  color: muted, margin: '0 0 8px',
                }}>
                  Additional Costs
                </p>
                <div>
                  {pricing_excludes.map((item, i) => (
                    <ListItem key={i} item={item} gold={gold} text={text} muted={muted} isInclude={false} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclosure note */}
        <p style={{
          fontFamily: NU, fontSize: 11, color: muted,
          margin: '40px 0 0', letterSpacing: '0.02em',
          borderTop: `1px solid ${border}`, paddingTop: 20,
        }}>
          All pricing is indicative. Final investment varies by date, guest count, menu, and bespoke requirements. Contact the venue directly for a tailored proposal.
        </p>

      </div>
    </div>
  );
}
