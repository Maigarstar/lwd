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
const GOLD_DIM = 'rgba(184,160,90,0.3)';

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
          padding: '52px 48px 46px',
          position: 'relative',
          textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.65)',
        }}
      >
        {/* ✕ Close */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 16, right: 18,
            background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 16, color: 'rgba(184,160,90,0.45)', lineHeight: 1,
            transition: 'color 0.2s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = GOLD}
          onMouseLeave={e => e.currentTarget.style.color = 'rgba(184,160,90,0.45)'}
          aria-label="Close"
        >✕</button>

        {/* Eyebrow */}
        <div style={{
          fontFamily: FB,
          fontSize: 9, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, marginBottom: 18,
        }}>
          You're being connected
        </div>

        {/* Gold divider */}
        <div style={{ width: 28, height: 1, background: 'rgba(184,160,90,0.3)', margin: '0 auto 26px' }} />

        {/* Headline */}
        <p style={{
          fontFamily: FD,
          fontSize: 28, fontWeight: 400, fontStyle: 'italic',
          color: '#f0ede6', lineHeight: 1.45,
          margin: '0 0 12px',
        }}>
          You're being connected to{' '}
          {name && (
            <span style={{ color: GOLD }}>{name}</span>
          )}
        </p>

        {/* Body */}
        <p style={{
          fontFamily: FB,
          fontSize: 13, color: 'rgba(200,196,188,0.75)',
          lineHeight: 1.65, margin: '0 0 6px',
        }}>
          via Luxury Wedding Directory
        </p>

        {/* Subtext */}
        <p style={{
          fontFamily: FB,
          fontSize: 12, color: 'rgba(200,196,188,0.45)',
          margin: '0 0 36px', letterSpacing: '0.01em',
        }}>
          This website is managed independently
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 28 }}>
          <a
            href={url}
            onClick={handleContinue}
            style={{
              display: 'inline-block',
              padding: '13px 38px',
              background: GOLD,
              color: '#0a0a08',
              fontFamily: FB, fontSize: 11, fontWeight: 800,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              textDecoration: 'none', borderRadius: 1,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Continue
          </a>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: `1px solid ${GOLD_DIM}`,
              color: 'rgba(200,196,188,0.55)',
              fontFamily: FB, fontSize: 11, fontWeight: 700,
              letterSpacing: '0.13em', textTransform: 'uppercase',
              padding: '13px 28px', borderRadius: 1, cursor: 'pointer',
              transition: 'border-color 0.2s, color 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(184,160,90,0.6)';
              e.currentTarget.style.color = '#c8c4bc';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = GOLD_DIM;
              e.currentTarget.style.color = 'rgba(200,196,188,0.55)';
            }}
          >
            Go Back
          </button>
        </div>

        {/* Return line — smaller, lighter, visually secondary */}
        <p style={{
          fontFamily: FD,
          fontSize: 13, fontStyle: 'italic',
          color: 'rgba(184,160,90,0.35)',
          margin: 0, lineHeight: 1.5,
        }}>
          We'll be here when you're ready to continue planning
        </p>
      </div>
    </div>
  );
}
