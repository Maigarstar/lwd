import { useState, useEffect } from 'react';

const GD   = 'var(--font-heading-primary)';
const NU   = 'var(--font-body)';
const GOLD = '#C9A84C';

export default function NotFoundPage({ onNavigateHome = () => {}, onNavigateCategory = () => {} }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { setLoaded(true); }, []);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0a0806',
      color: '#ffffff',
      fontFamily: NU,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 24px',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Ambient gold glow */}
      <div style={{
        position: 'fixed',
        top: 0, left: 0, width: '100%', height: '100%',
        background: 'radial-gradient(ellipse at 50% 0%, rgba(201,168,76,0.04) 0%, transparent 65%)',
        pointerEvents: 'none',
        zIndex: 0,
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        zIndex: 1,
        maxWidth: 560,
        width: '100%',
        textAlign: 'center',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 0.9s ease, transform 0.9s ease',
      }}>
        {/* Eyebrow */}
        <p style={{
          fontFamily: NU,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '3px',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.35)',
          marginBottom: 28,
        }}>
          Error · 404
        </p>

        {/* Large 404 */}
        <div style={{
          fontFamily: GD,
          fontSize: 'clamp(80px, 18vw, 140px)',
          fontWeight: 400,
          letterSpacing: '-4px',
          lineHeight: 1,
          marginBottom: 24,
          background: `linear-gradient(135deg, ${GOLD} 0%, #e8c97a 50%, ${GOLD} 100%)`,
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}>
          404
        </div>

        {/* Gold rule */}
        <div style={{
          width: 48,
          height: 1,
          background: `linear-gradient(90deg, transparent, ${GOLD}, transparent)`,
          margin: '0 auto 32px',
        }} />

        {/* Headline */}
        <h1 style={{
          fontFamily: GD,
          fontSize: 'clamp(22px, 4vw, 32px)',
          fontWeight: 400,
          letterSpacing: '-0.3px',
          marginBottom: 14,
          lineHeight: 1.25,
          color: '#ffffff',
        }}>
          Page Not Found
        </h1>

        {/* Body */}
        <p style={{
          fontFamily: NU,
          fontSize: 14,
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 40,
          lineHeight: 1.85,
          letterSpacing: '0.2px',
          maxWidth: 420,
          margin: '0 auto 40px',
        }}>
          The page you're looking for may have moved or no longer exists.
          Let us guide you back to the collection.
        </p>

        {/* CTAs */}
        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 48 }}>
          <button
            onClick={onNavigateHome}
            style={{
              padding: '11px 32px',
              background: `linear-gradient(135deg, ${GOLD}, #e8c97a)`,
              color: '#0a0806',
              border: 'none',
              borderRadius: 'var(--lwd-radius-input, 4px)',
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '1.5px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: NU,
              transition: 'opacity 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
            onMouseLeave={e => e.currentTarget.style.opacity = '1'}
          >
            Back to Home
          </button>

          <button
            onClick={onNavigateCategory}
            style={{
              padding: '11px 28px',
              background: 'none',
              color: GOLD,
              border: `1px solid rgba(201,168,76,0.35)`,
              borderRadius: 'var(--lwd-radius-input, 4px)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '1.2px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              fontFamily: NU,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = GOLD; e.currentTarget.style.background = 'rgba(201,168,76,0.08)'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(201,168,76,0.35)'; e.currentTarget.style.background = 'none'; }}
          >
            Browse Venues
          </button>
        </div>

        {/* Support link */}
        <p style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.25)', letterSpacing: '0.2px' }}>
          Something wrong?{' '}
          <a
            href="mailto:support@luxuryweddingdirectory.com"
            style={{ color: 'rgba(201,168,76,0.7)', textDecoration: 'none', transition: 'color 0.2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = 'rgba(201,168,76,0.7)')}
          >
            Contact support
          </a>
        </p>
      </div>
    </div>
  );
}
