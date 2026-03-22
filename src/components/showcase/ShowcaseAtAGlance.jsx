// ─── src/components/showcase/ShowcaseAtAGlance.jsx ───────────────────────────
// "At a Glance" — premium stat-first venue data block.
//
// Layout:
//   Top    — 4 large headline capacity figures (Ceremony · Dining · Reception · Bedrooms)
//   Below  — 2-column secondary details (Exclusive Use, Catering, Outdoor, Accommodation…)
//
// Props:
//   data        — venue_showcases row (or subset)
//   accentColor — gold/brand colour (default Ritz gold)
//   theme       — 'light' | 'dark'
// ─────────────────────────────────────────────────────────────────────────────
import { useBreakpoint } from '../../hooks/useWindowWidth';

const GD = 'var(--font-heading-primary)';
const NU = 'var(--font-body)';

const CATERING_LABELS = {
  in_house_only: 'In-house only',
  approved_list: 'Approved caterers',
  open:          'Open to external',
};

function fmt(pence, currency = 'GBP') {
  if (!pence && pence !== 0) return null;
  const amount = Math.round(pence / 100);
  return new Intl.NumberFormat('en-GB', {
    style: 'currency', currency, maximumFractionDigits: 0,
  }).format(amount);
}

// Render a single secondary detail row
function DetailRow({ label, value, muted, text, border, paddingRight, paddingLeft, isLeft, borderRight, borderBottom }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 20,
      padding: '13px 0',
      paddingRight, paddingLeft,
      borderRight, borderBottom,
    }}>
      <span style={{
        fontFamily: NU, fontSize: 10, fontWeight: 700,
        letterSpacing: '0.12em', textTransform: 'uppercase',
        color: muted, flexShrink: 0, width: 120, paddingTop: 1,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: NU, fontSize: 13, color: text, lineHeight: 1.55, flex: 1,
      }}>
        {value}
      </span>
    </div>
  );
}

export default function ShowcaseAtAGlance({ data = {}, accentColor, theme = 'light' }) {
  const { isMobile } = useBreakpoint();

  const isLight = theme === 'light';
  const bg      = isLight ? '#ffffff' : '#1a1410';
  const text    = isLight ? '#1a1209' : '#f5f0e8';
  const muted   = isLight ? 'rgba(26,18,9,0.55)' : 'rgba(245,240,232,0.5)';
  const border  = isLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const gold    = accentColor || '#C4A35A';

  const {
    ceremony_capacity, dining_capacity, reception_capacity,
    bedrooms, exclusive_use, exclusive_use_notes,
    currency = 'GBP',
    venue_hire_from, typical_wedding_spend_min, typical_wedding_spend_max,
    minimum_spend, price_per_head_from,
    catering_type, outdoor_ceremony, on_site_accommodation,
    location_summary, style: venueStyle,
  } = data;

  // ── Primary stats (the 4 headline numbers) ────────────────────────────────
  const primaryStats = [
    ceremony_capacity  != null && { label: 'Ceremony',  value: ceremony_capacity,  unit: 'guests' },
    dining_capacity    != null && { label: 'Dining',     value: dining_capacity,    unit: 'guests' },
    reception_capacity != null && { label: 'Reception',  value: reception_capacity, unit: 'guests' },
    bedrooms           != null && { label: 'Bedrooms',   value: bedrooms,           unit: 'rooms & suites' },
  ].filter(Boolean);

  // ── Secondary details ─────────────────────────────────────────────────────
  const exclusiveUseVal = exclusive_use === null || exclusive_use === undefined
    ? null
    : exclusive_use
      ? (exclusive_use_notes || 'Available by arrangement')
      : 'Not available';

  const allDetails = [
    ['Exclusive Use',    exclusiveUseVal],
    ['Catering',         CATERING_LABELS[catering_type] || catering_type],
    ['Outdoor Ceremony', outdoor_ceremony !== null && outdoor_ceremony !== undefined
      ? (outdoor_ceremony ? 'Available' : 'Indoor only') : null],
    ['Accommodation',    on_site_accommodation !== null && on_site_accommodation !== undefined
      ? (on_site_accommodation ? 'On-site' : 'Off-site only') : null],
    ['Location',         location_summary],
    ['Style',            venueStyle],
    ['Venue Hire From',  fmt(venue_hire_from, currency)],
    ['Minimum Spend',    fmt(minimum_spend, currency)],
    ['Per Head From',    fmt(price_per_head_from, currency)],
    ['Typical Spend',    (typical_wedding_spend_min || typical_wedding_spend_max)
      ? [fmt(typical_wedding_spend_min, currency), fmt(typical_wedding_spend_max, currency)]
          .filter(Boolean).join(' – ')
      : null],
  ].filter(([, v]) => v != null && v !== '');

  const hasAnyData = primaryStats.length > 0 || allDetails.length > 0;
  if (!hasAnyData) return null;

  // Format stat value for large display
  function statDisplay(val) {
    if (typeof val === 'number') return val.toLocaleString();
    return String(val);
  }

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      padding: isMobile ? '32px 20px' : '48px 48px',
      marginTop: 40,
    }}>
      {/* Header */}
      <p style={{
        fontFamily: NU, fontSize: 11, fontWeight: 700,
        letterSpacing: '0.15em', textTransform: 'uppercase',
        color: gold, margin: '0 0 10px',
      }}>
        At a Glance
      </p>
      <div style={{ width: 32, height: 1, background: gold, marginBottom: 36 }} />

      {/* ── Primary stats row — 4 large headline numbers ── */}
      {primaryStats.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr 1fr' : `repeat(${primaryStats.length}, 1fr)`,
          borderTop: `1px solid ${border}`,
          borderBottom: `1px solid ${border}`,
          marginBottom: 40,
        }}>
          {primaryStats.map((stat, i) => {
            const isLastCol   = i === primaryStats.length - 1;
            const isTopRow    = isMobile && i < 2;
            return (
              <div key={i} style={{
                padding: isMobile ? '24px 12px' : '32px 0',
                paddingRight: !isMobile && !isLastCol ? 32 : undefined,
                paddingLeft:  !isMobile && i > 0 ? 32 : undefined,
                borderRight: !isMobile && !isLastCol ? `1px solid ${border}` : 'none',
                borderBottom: isMobile && isTopRow ? `1px solid ${border}` : 'none',
              }}>
                <div style={{
                  fontFamily: NU, fontSize: 9, fontWeight: 700,
                  letterSpacing: '0.18em', textTransform: 'uppercase',
                  color: gold, marginBottom: 10,
                }}>
                  {stat.label}
                </div>
                <div style={{
                  fontFamily: GD,
                  fontSize: isMobile ? 'clamp(28px, 8vw, 40px)' : 'clamp(36px, 4vw, 56px)',
                  color: text, lineHeight: 1, marginBottom: 6,
                }}>
                  {statDisplay(stat.value)}
                </div>
                <div style={{
                  fontFamily: NU, fontSize: 11,
                  color: muted, letterSpacing: '0.04em',
                }}>
                  {stat.unit}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── Secondary details — 2-col label/value grid ── */}
      {allDetails.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        }}>
          {allDetails.map(([label, val], i) => {
            const totalRows = allDetails.length;
            const isLeft    = isMobile ? true : i % 2 === 0;
            // Show border-bottom unless it's one of the last two items (last row)
            const lastRowStart = totalRows % 2 === 0 ? totalRows - 2 : totalRows - 1;
            const isLastRow = isMobile ? i === totalRows - 1 : i >= lastRowStart;
            return (
              <DetailRow
                key={i}
                label={label}
                value={val}
                muted={muted}
                text={text}
                border={border}
                paddingRight={!isMobile && isLeft ? 40 : 0}
                paddingLeft={!isMobile && !isLeft ? 40 : 0}
                isLeft={isLeft}
                borderRight={!isMobile && isLeft ? `1px solid ${border}` : 'none'}
                borderBottom={!isLastRow ? `1px solid ${border}` : 'none'}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
