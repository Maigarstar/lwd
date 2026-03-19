/**
 * ExternalLinkModal
 *
 * Branded exit interstitial shown before redirecting users to external
 * venue or vendor websites. Reinforces LWD as the trusted planning layer.
 *
 * Design: dark card, backdrop blur, gold accents, Cormorant headline.
 *
 * Props:
 *   name       {string}   — venue or vendor name inserted into body copy
 *   url        {string}   — destination URL (opened in new tab on Continue)
 *   onClose    {fn}       — called when user dismisses (✕ or Go Back)
 *   onContinue {fn}       — called when user clicks Continue (before opening URL)
 */

const FD = 'var(--font-heading-primary)';
const FB = 'var(--font-body)';
const GOLD = '#b8a05a';
const GOLD_DIM = 'rgba(184,160,90,0.28)';

export default function ExternalLinkModal({ name, url, onClose, onContinue }) {
  if (!url) return null;

  const handleContinue = (e) => {
    e.preventDefault();
    if (onContinue) onContinue();
    window.open(url, '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(10,10,8,0.55)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#0f0f0d',
          border: `1px solid ${GOLD_DIM}`,
          borderRadius: 2,
          width: 'min(500px, 88vw)',
          padding: '52px 48px 48px',
          position: 'relative',
          textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
        }}
      >
        {/* ✕ Close — very soft, almost whispered */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 18, right: 20,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, color: 'rgba(184,160,90,0.22)', lineHeight: 1,
            transition: 'color 0.3s',
            fontWeight: 300,
          }}
          onMouseEnter={e => e.currentTarget.style.color = 'rgba(184,160,90,0.55)'}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(184,160,90,0.22)'}
          aria-label="Close"
        >✕</button>

        {/* Eyebrow — extra air below before the divider */}
        <div style={{
          fontFamily: FB,
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, marginBottom: 26,
        }}>
          You're being connected
        </div>

        {/* Gold divider */}
        <div style={{ width: 28, height: 1, background: 'rgba(184,160,90,0.28)', margin: '0 auto 30px' }} />

        {/* Headline — name breaks to its own line for emphasis */}
        <p style={{
          fontFamily: FD,
          fontSize: 28, fontWeight: 400, fontStyle: 'italic',
          color: '#f0ede6', lineHeight: 1.5,
          margin: '0 0 18px',
        }}>
          You're being connected to
          {name && (
            <>
              <br />
              <span style={{ color: GOLD }}>{name}</span>
            </>
          )}
        </p>

        {/* "via LWD" — introducer, not the focus. Smaller + lower contrast */}
        <p style={{
          fontFamily: FB,
          fontSize: 11, color: 'rgba(200,196,188,0.62)',
          letterSpacing: '0.04em',
          lineHeight: 1.6, margin: '0 0 10px',
        }}>
          via Luxury Wedding Directory
        </p>

        {/* Legal subtext — context not content, but still legible */}
        <p style={{
          fontFamily: FB,
          fontSize: 11, color: 'rgba(200,196,188,0.48)',
          margin: '0 0 42px',
          letterSpacing: '0.02em',
        }}>
          This site is managed independently
        </p>

        {/* CTAs — wider gap for premium breathing room */}
        <div style={{ display: 'flex', gap: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 32 }}>
          <a
            href={url}
            onClick={handleContinue}
            style={{
              display: 'inline-block',
              padding: '13px 40px',
              background: GOLD,
              color: '#0a0a08',
              fontFamily: FB, fontSize: 11, fontWeight: 800,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textDecoration: 'none', borderRadius: 1,
              transition: 'opacity 0.2s, transform 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.opacity = '0.9'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.transform = 'scale(1)'; }}
          >
            Continue
          </a>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `1px solid ${GOLD_DIM}`,
              color: 'rgba(200,196,188,0.5)',
              fontFamily: FB, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.13em', textTransform: 'uppercase',
              padding: '13px 30px', borderRadius: 1, cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(184,160,90,0.55)';
              e.currentTarget.style.color = '#c8c4bc';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = GOLD_DIM;
              e.currentTarget.style.color = 'rgba(200,196,188,0.5)';
            }}
          >
            Go Back
          </button>
        </div>

        {/* Return line — italic, gold, visually secondary but readable */}
        <p style={{
          fontFamily: FD,
          fontSize: 12, fontStyle: 'italic',
          color: 'rgba(184,160,90,0.55)',
          margin: 0, lineHeight: 1.6,
        }}>
          We'll be here when you're ready to continue planning
        </p>
      </div>
    </div>
  );
}
