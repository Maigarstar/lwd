// ─── src/components/sections/FooterForVendors.jsx ────────────────────────────
// Minimal vendor portal footer — utility bar, not a marketing footer.
// Single horizontal strip: brand | context | links
// + bottom line: Powered by Taigenic.ai · AI insights enabled
// ─────────────────────────────────────────────────────────────────────────────

const NU = 'var(--font-body)';
const GD = 'var(--font-heading-primary)';

// ── Tab → context label mapping ───────────────────────────────────────────────
// Shorter, more editorial — less words = more luxury
const TAB_CONTEXT = {
  overview:     { label: 'Performance Overview',     sub: 'Your business at a glance' },
  reviews:      { label: 'Reputation Hub',           sub: 'Reviews & client feedback' },
  leads:        { label: 'Lead Management',          sub: 'Enquiries and new leads' },
  inquiries:    { label: 'Lead Management',          sub: 'Enquiries and new leads' },
  livechat:     { label: 'Live Conversations',       sub: 'Real-time client messaging' },
  analytics:    { label: 'Performance Analytics',   sub: 'Insights & trends' },
  ai:           { label: 'AI Insights',              sub: 'Powered by Taigenic.ai' },
  profile:      { label: 'Your Profile',             sub: 'Listing & brand presence' },
  seo:          { label: 'Search Visibility',        sub: 'SEO & discoverability' },
  billing:      { label: 'Billing',                  sub: 'Plans & payments' },
  calendar:     { label: 'Calendar',                 sub: 'Event scheduling' },
  awards:       { label: 'Artistry Awards',          sub: 'Industry recognition' },
};

const LINKS = [
  { label: 'Privacy',  href: '/privacy' },
  { label: 'Terms',    href: '/terms' },
  { label: 'Support',  href: '/support' },
];

// ── Sub-component: footer link with gold hover — SPA-safe navigation ─────────
function FooterLink({ label, href }) {
  const handleClick = (e) => {
    e.preventDefault();
    window.history.pushState({}, '', href);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  return (
    <a
      href={href}
      onClick={handleClick}
      style={{
        fontFamily: NU,
        fontSize: 11,
        color: 'rgba(255,255,255,0.28)',
        textDecoration: 'none',
        letterSpacing: '0.04em',
        transition: 'color 0.2s, text-decoration-color 0.2s',
        cursor: 'pointer',
        textUnderlineOffset: '3px',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = 'rgba(201,168,76,0.9)';
        e.currentTarget.style.textDecoration = 'underline';
        e.currentTarget.style.textDecorationColor = 'rgba(201,168,76,0.5)';
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

        {/* RIGHT — utility links (increased spacing) */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 20,
            flexShrink: 0,
          }}
        >
          {LINKS.map((l, i) => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
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
        {/* Left: copyright — lighter, cleaner */}
        <span
          style={{
            fontFamily: NU,
            fontSize: 10,
            color: 'rgba(255,255,255,0.32)',
            letterSpacing: '0.03em',
          }}
        >
          © {new Date().getFullYear()} Luxury Wedding Directory · 5 Star Weddings Ltd
        </span>

        {/* Right: Taigenic + AI indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: 'rgba(255,255,255,0.38)',
              letterSpacing: '0.05em',
            }}
          >
            Powered by
          </span>
          <span
            style={{
              fontFamily: NU,
              fontSize: 10,
              color: 'rgba(201,168,76,0.8)',
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
              color: 'rgba(255,255,255,0.38)',
              letterSpacing: '0.05em',
            }}
          >
            AI insights enabled
          </span>
        </div>
      </div>
    </footer>
  );
}
