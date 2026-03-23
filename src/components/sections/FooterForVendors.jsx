// ─── src/components/sections/FooterForVendors.jsx ────────────────────────────
// Minimal vendor portal footer — utility bar, not a marketing footer.
// Single horizontal strip: brand | context | links
// + bottom line: Powered by Taigenic.ai · AI insights active
// ─────────────────────────────────────────────────────────────────────────────

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';

// ── Tab → context label mapping ───────────────────────────────────────────────
const TAB_CONTEXT = {
  overview:     { label: 'Dashboard Overview',     sub: 'Performance at a glance' },
  reviews:      { label: 'Reputation Hub',         sub: 'Reviews & client feedback' },
  leads:        { label: 'Lead Inbox',             sub: 'Enquiries and new leads' },
  inquiries:    { label: 'Lead Inbox',             sub: 'Enquiries and new leads' },
  livechat:     { label: 'Live Conversations',     sub: 'Real-time client messaging' },
  analytics:    { label: 'Analytics',              sub: 'Performance insights & trends' },
  ai:           { label: 'AI Insights',            sub: 'AI-powered recommendations' },
  profile:      { label: 'My Profile',             sub: 'Listing & brand presence' },
  seo:          { label: 'SEO Tools',              sub: 'Visibility & search optimisation' },
  billing:      { label: 'Billing',                sub: 'Plans & payments' },
  calendar:     { label: 'Calendar',               sub: 'Event scheduling' },
  awards:       { label: 'Artistry Awards',        sub: 'Industry recognition' },
};

const LINKS = [
  { label: 'Privacy',  href: '/privacy' },
  { label: 'Terms',    href: '/terms' },
  { label: 'Support',  href: '/support' },
];

// ── Sub-component: footer link with gold hover ────────────────────────────────
function FooterLink({ label, href }) {
  return (
    <a
      href={href}
      style={{
        fontFamily: NU,
        fontSize: 11,
        color: 'rgba(255,255,255,0.28)',
        textDecoration: 'none',
        letterSpacing: '0.04em',
        transition: 'color 0.2s',
        cursor: 'pointer',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'rgba(201,168,76,0.9)';
        e.currentTarget.style.textDecoration = 'underline';
        e.currentTarget.style.textUnderlineOffset = '3px';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'rgba(255,255,255,0.28)';
        e.currentTarget.style.textDecoration = 'none';
      }}
    >
      {label}
    </a>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function FooterForVendors({ dashTab = 'overview', darkMode = true }) {
  const ctx = TAB_CONTEXT[dashTab] || TAB_CONTEXT.overview;

  return (
    <footer
      aria-label="Vendor portal footer"
      style={{
        width: '100%',
        boxSizing: 'border-box',
        background: darkMode ? '#0d0d0b' : '#1a1a18',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        flexShrink: 0,
      }}
    >
      {/* ── Main bar ─────────────────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: '100%',
          padding: '0 32px',
          height: 52,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        {/* LEFT — brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span
            style={{
              fontFamily: GD,
              fontSize: 13,
              color: 'rgba(201,168,76,0.85)',
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            LWD
          </span>
          <span
            style={{
              width: 1,
              height: 12,
              background: 'rgba(255,255,255,0.12)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: 'rgba(255,255,255,0.3)',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
            }}
          >
            Vendor Portal
          </span>
        </div>

        {/* CENTER — contextual tab label */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: NU,
              fontSize: 11,
              color: 'rgba(255,255,255,0.38)',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
            }}
          >
            {ctx.label}
          </span>
          <span
            style={{
              width: 1,
              height: 10,
              background: 'rgba(255,255,255,0.1)',
              display: 'inline-block',
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: NU,
              fontSize: 11,
              color: 'rgba(255,255,255,0.2)',
              letterSpacing: '0.03em',
              whiteSpace: 'nowrap',
            }}
          >
            {ctx.sub}
          </span>
        </div>

        {/* RIGHT — utility links */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexShrink: 0,
          }}
        >
          {LINKS.map((l, i) => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <FooterLink label={l.label} href={l.href} />
              {i < LINKS.length - 1 && (
                <span
                  style={{
                    width: 1,
                    height: 10,
                    background: 'rgba(255,255,255,0.08)',
                    display: 'inline-block',
                  }}
                />
              )}
            </span>
          ))}
        </div>
      </div>

      {/* ── Bottom strip — Taigenic AI layer ─────────────────────────────── */}
      <div
        style={{
          borderTop: '1px solid rgba(255,255,255,0.04)',
          padding: '6px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        {/* Left: copyright */}
        <span
          style={{
            fontFamily: NU,
            fontSize: 10,
            color: 'rgba(255,255,255,0.15)',
            letterSpacing: '0.03em',
          }}
        >
          © 2026 LuxuryWeddingDirectory.com
        </span>

        {/* Right: Taigenic + AI indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.05em',
            }}
          >
            Powered by
          </span>
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: 'rgba(201,168,76,0.55)',
              letterSpacing: '0.06em',
              fontWeight: 600,
            }}
          >
            Taigenic.ai
          </span>
          <span
            style={{
              width: 1,
              height: 8,
              background: 'rgba(255,255,255,0.08)',
              display: 'inline-block',
            }}
          />
          {/* Live indicator dot */}
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'rgba(201,168,76,0.6)',
              display: 'inline-block',
              flexShrink: 0,
              boxShadow: '0 0 4px rgba(201,168,76,0.4)',
            }}
          />
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: 'rgba(255,255,255,0.18)',
              letterSpacing: '0.05em',
            }}
          >
            AI insights active
          </span>
        </div>
      </div>
    </footer>
  );
}
