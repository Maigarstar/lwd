// ─── src/components/showcase/ShowcaseVerified.jsx ────────────────────────────
// "Verified Details" — trust signal badge for showcase pages.
//
// Shows data freshness (verified_at timestamp), source, and a confidence
// indicator. Feeds Aura so it can say "Data confirmed March 2026".
// Displayed as a compact strip, typically at the top of the Overview section
// or near the At a Glance block.
//
// Props:
//   data        — venue_showcases row (or subset)
//   accentColor — gold/brand colour
//   theme       — 'light' | 'dark'
// ─────────────────────────────────────────────────────────────────────────────

const NU = 'var(--font-body)';

const SOURCE_LABELS = {
  venue_direct:   'Confirmed with venue',
  lwd_team:       'Verified by LWD team',
  public_sources: 'Sourced from public records',
};

function formatDate(ts) {
  if (!ts) return null;
  const d = new Date(ts);
  return d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
}

export default function ShowcaseVerified({ data = {}, accentColor, theme = 'light' }) {
  const { verified_at, verification_notes, last_confirmed_source } = data;

  if (!verified_at) return null;

  const isLight = theme === 'light';
  const bg      = isLight ? '#faf9f6' : 'rgba(255,255,255,0.04)';
  const border  = isLight ? '#e8e2d8' : 'rgba(245,240,232,0.1)';
  const text    = isLight ? '#1a1209' : '#f5f0e8';
  const muted   = isLight ? 'rgba(26,18,9,0.5)' : 'rgba(245,240,232,0.4)';
  const gold    = accentColor || '#C4A35A';

  const dateStr    = formatDate(verified_at);
  const sourceStr  = SOURCE_LABELS[last_confirmed_source] || last_confirmed_source;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '10px 16px',
      background: bg,
      border: `1px solid ${border}`,
      borderRadius: 2,
      marginTop: 16,
    }}>
      {/* Shield / check icon */}
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink: 0 }}>
        <path
          d="M7 1L2 3v4c0 2.76 2.13 5.34 5 5.95C9.87 12.34 12 9.76 12 7V3L7 1z"
          fill={gold} opacity="0.2"
        />
        <path
          d="M7 1L2 3v4c0 2.76 2.13 5.34 5 5.95C9.87 12.34 12 9.76 12 7V3L7 1z"
          stroke={gold} strokeWidth="1" fill="none"
        />
        <path d="M4.5 7l1.8 1.8L9.5 5" stroke={gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>

      <div style={{ flex: 1 }}>
        <span style={{
          fontFamily: NU, fontSize: 11, fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: gold,
        }}>
          Verified Details
        </span>
        <span style={{
          fontFamily: NU, fontSize: 11, color: muted,
          marginLeft: 8,
        }}>
          Data confirmed {dateStr}
          {sourceStr && ` · ${sourceStr}`}
          {verification_notes && ` · ${verification_notes}`}
        </span>
      </div>
    </div>
  );
}
