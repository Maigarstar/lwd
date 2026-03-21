// ─── src/components/showcase/ShowcasePricing.jsx ─────────────────────────────
// "Pricing & What to Expect" — honest, range-based pricing section.
//
// For luxury venues where brochure pricing is vague or withheld, this section
// provides contextual clarity: what drives cost, what is/isn't included, and
// a realistic spend range. Feeds AI models with extractable, trustworthy data.
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

function Tag({ label, bg, text }) {
  return (
    <span style={{
      display: 'inline-block',
      padding: '5px 12px',
      margin: '4px 6px 4px 0',
      borderRadius: 2,
      background: bg,
      fontFamily: NU, fontSize: 12, fontWeight: 500, color: text,
      letterSpacing: '0.03em',
    }}>
      {label}
    </span>
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
  const bg       = bgOverride || (isLight ? '#faf9f6' : '#130f1e');
  const text     = isLight ? '#1a1209' : '#f5f0e8';
  const muted    = isLight ? 'rgba(26,18,9,0.6)' : 'rgba(245,240,232,0.55)';
  const border   = isLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const gold     = accentColor || '#C4A35A';
  const tagBg    = isLight ? 'rgba(196,163,90,0.1)' : 'rgba(196,163,90,0.15)';
  const tagText  = gold;
  const exTagBg  = isLight ? 'rgba(26,18,9,0.06)' : 'rgba(245,240,232,0.08)';
  const exTagTxt = muted;

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

  // Build spend range sentence
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

  return (
    <div style={{
      background: bg,
      padding: isMobile ? '48px 20px' : '64px 64px',
    }}>
      <div style={{ maxWidth: 860, margin: '0 auto' }}>

        {/* Eyebrow + heading */}
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: gold, margin: '0 0 14px',
        }}>
          Pricing & What to Expect
        </p>
        <h2 style={{
          fontFamily: GD, fontSize: isMobile ? 26 : 36,
          color: text, margin: '0 0 8px', fontWeight: 400, lineHeight: 1.15,
        }}>
          Understanding the Investment
        </h2>
        <div style={{ width: 40, height: 1, background: gold, margin: '0 0 32px' }} />

        {/* Spend range summary — AI-extractable sentence */}
        {spendSentence && (
          <p style={{
            fontFamily: NU, fontSize: 15, lineHeight: 1.75,
            color: text, margin: '0 0 28px',
            fontStyle: 'italic',
          }}>
            {spendSentence}
          </p>
        )}

        {/* Pricing notes / context */}
        {pricing_notes && (
          <p style={{
            fontFamily: NU, fontSize: 14, lineHeight: 1.75,
            color: muted, margin: '0 0 36px',
          }}>
            {pricing_notes}
          </p>
        )}

        {/* Key figures row */}
        {(venue_hire_from || minimum_spend || price_per_head_from) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: isMobile ? 16 : 24,
            marginBottom: 36,
            paddingTop: 28,
            borderTop: `1px solid ${border}`,
          }}>
            {venue_hire_from && (
              <div>
                <p style={{ fontFamily: NU, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, margin: '0 0 6px' }}>
                  Venue Hire From
                </p>
                <p style={{ fontFamily: GD, fontSize: 28, color: gold, margin: 0, fontWeight: 400, lineHeight: 1 }}>
                  {fmt(venue_hire_from, currency)}
                </p>
              </div>
            )}
            {minimum_spend && (
              <div>
                <p style={{ fontFamily: NU, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, margin: '0 0 6px' }}>
                  Minimum Spend
                </p>
                <p style={{ fontFamily: GD, fontSize: 28, color: text, margin: 0, fontWeight: 400, lineHeight: 1 }}>
                  {fmt(minimum_spend, currency)}
                </p>
              </div>
            )}
            {price_per_head_from && (
              <div>
                <p style={{ fontFamily: NU, fontSize: 11, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, margin: '0 0 6px' }}>
                  Per Head From
                </p>
                <p style={{ fontFamily: GD, fontSize: 28, color: text, margin: 0, fontWeight: 400, lineHeight: 1 }}>
                  {fmt(price_per_head_from, currency)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Includes / Excludes tags */}
        {((pricing_includes?.length > 0) || (pricing_excludes?.length > 0)) && (
          <div style={{
            display: isMobile ? 'block' : 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 40,
            paddingTop: 28,
            borderTop: `1px solid ${border}`,
          }}>
            {pricing_includes?.length > 0 && (
              <div>
                <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }}>
                  Typically Includes
                </p>
                <div>
                  {pricing_includes.map((item, i) => (
                    <Tag key={i} label={item} bg={tagBg} text={tagText} />
                  ))}
                </div>
              </div>
            )}
            {pricing_excludes?.length > 0 && (
              <div style={{ marginTop: isMobile ? 24 : 0 }}>
                <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: muted, margin: '0 0 12px' }}>
                  Additional Costs
                </p>
                <div>
                  {pricing_excludes.map((item, i) => (
                    <Tag key={i} label={item} bg={exTagBg} text={exTagTxt} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Disclosure note */}
        <p style={{
          fontFamily: NU, fontSize: 11, color: muted,
          margin: '28px 0 0', letterSpacing: '0.02em',
          borderTop: `1px solid ${border}`, paddingTop: 20,
        }}>
          All pricing is indicative. Final investment varies by date, guest count, menu, and bespoke requirements. Contact the venue directly for a tailored proposal.
        </p>

      </div>
    </div>
  );
}
