// ─── src/components/showcase/ShowcaseAtAGlance.jsx ───────────────────────────
// "At a Glance" — structured, labelled, AI-readable venue data block.
//
// Renders explicit key-value fields from the DB (capacities, bedrooms,
// exclusive use, catering type). Designed to be machine-readable as well as
// visually premium.
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

function Row({ label, value, accent, muted, border }) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
      padding: '14px 0',
      borderBottom: `1px solid ${border}`,
    }}>
      <span style={{
        fontFamily: NU, fontSize: 12, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase', color: muted,
      }}>
        {label}
      </span>
      <span style={{
        fontFamily: NU, fontSize: 14, fontWeight: 500, color: accent,
        textAlign: 'right', maxWidth: '55%',
      }}>
        {value}
      </span>
    </div>
  );
}

export default function ShowcaseAtAGlance({ data = {}, accentColor, theme = 'light' }) {
  const { isMobile } = useBreakpoint();

  const isLight   = theme === 'light';
  const bg        = isLight ? '#ffffff' : '#1a1410';
  const text      = isLight ? '#1a1209' : '#f5f0e8';
  const muted     = isLight ? '#6b6258' : 'rgba(245,240,232,0.5)';
  const border    = isLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const gold      = accentColor || '#C4A35A';
  const valueTxt  = isLight ? '#1a1209' : '#f5f0e8';

  const {
    ceremony_capacity, dining_capacity, reception_capacity,
    bedrooms, exclusive_use, exclusive_use_notes,
    currency = 'GBP',
    venue_hire_from, typical_wedding_spend_min, typical_wedding_spend_max,
    minimum_spend, price_per_head_from,
    catering_type, outdoor_ceremony, on_site_accommodation,
  } = data;

  // Spend range string
  const spendRange = (typical_wedding_spend_min || typical_wedding_spend_max)
    ? [
        typical_wedding_spend_min ? `From ${fmt(typical_wedding_spend_min, currency)}` : null,
        typical_wedding_spend_max ? `to ${fmt(typical_wedding_spend_max, currency)}` : null,
      ].filter(Boolean).join(' ')
    : null;

  // Exclusive use string
  const exclusiveUseVal = exclusive_use === null || exclusive_use === undefined
    ? null
    : exclusive_use
      ? (exclusive_use_notes || 'Available')
      : 'Not available';

  const hasAnyData = [
    ceremony_capacity, dining_capacity, reception_capacity, bedrooms,
    exclusive_use, venue_hire_from, typical_wedding_spend_min,
    typical_wedding_spend_max, minimum_spend, price_per_head_from,
    catering_type, outdoor_ceremony, on_site_accommodation,
  ].some(v => v !== null && v !== undefined);

  if (!hasAnyData) return null;

  return (
    <div style={{
      background: bg,
      border: `1px solid ${border}`,
      padding: isMobile ? '28px 20px' : '36px 40px',
      marginTop: 40,
    }}>
      {/* Header */}
      <div style={{ marginBottom: 8 }}>
        <p style={{
          fontFamily: NU, fontSize: 11, fontWeight: 700,
          letterSpacing: '0.15em', textTransform: 'uppercase',
          color: gold, margin: '0 0 10px',
        }}>
          At a Glance
        </p>
        <div style={{ width: 32, height: 1, background: gold, marginBottom: 4 }} />
      </div>

      {/* Two column on desktop */}
      <div style={{
        display: isMobile ? 'block' : 'grid',
        gridTemplateColumns: '1fr 1fr',
        columnGap: 48,
      }}>
        {/* Column 1: Capacities + accommodation */}
        <div>
          <Row label="Ceremony Capacity"   value={ceremony_capacity    ? `Up to ${ceremony_capacity.toLocaleString()} guests`  : null} accent={valueTxt} muted={muted} border={border} />
          <Row label="Dining Capacity"     value={dining_capacity      ? `Up to ${dining_capacity.toLocaleString()} guests`    : null} accent={valueTxt} muted={muted} border={border} />
          <Row label="Reception Capacity"  value={reception_capacity   ? `Up to ${reception_capacity.toLocaleString()} guests` : null} accent={valueTxt} muted={muted} border={border} />
          <Row label="Bedrooms"            value={bedrooms             ? `${bedrooms.toLocaleString()} rooms & suites`         : null} accent={valueTxt} muted={muted} border={border} />
          <Row label="Exclusive Use"       value={exclusiveUseVal}      accent={valueTxt} muted={muted} border={border} />
          {outdoor_ceremony !== null && outdoor_ceremony !== undefined && (
            <Row label="Outdoor Ceremony"  value={outdoor_ceremony ? 'Available' : 'Indoor only'} accent={valueTxt} muted={muted} border={border} />
          )}
          {on_site_accommodation !== null && on_site_accommodation !== undefined && (
            <Row label="Accommodation"     value={on_site_accommodation ? 'On-site' : 'Off-site only'} accent={valueTxt} muted={muted} border={border} />
          )}
        </div>

        {/* Column 2: Pricing */}
        <div style={{ marginTop: isMobile ? 0 : 0 }}>
          <Row label="Venue Hire From"         value={fmt(venue_hire_from, currency)}    accent={gold}     muted={muted} border={border} />
          <Row label="Typical Wedding Spend"   value={spendRange}                        accent={gold}     muted={muted} border={border} />
          <Row label="Minimum Spend"           value={fmt(minimum_spend, currency)}      accent={valueTxt} muted={muted} border={border} />
          <Row label="Per Head From"           value={fmt(price_per_head_from, currency)} accent={valueTxt} muted={muted} border={border} />
          <Row label="Catering"                value={CATERING_LABELS[catering_type] || catering_type} accent={valueTxt} muted={muted} border={border} />
        </div>
      </div>
    </div>
  );
}
