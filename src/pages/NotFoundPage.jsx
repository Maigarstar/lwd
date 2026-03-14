import { useState, useEffect } from 'react';

/**
 * NotFoundPage — Elegant 404 page for luxury wedding directory
 * Shows when a route doesn't exist. Features subtle, premium design.
 */
export default function NotFoundPage({ onNavigateHome = () => {}, onNavigateCategory = () => {} }) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: '#0a0a0a',
        color: '#ffffff',
        fontFamily: "'Nunito', sans-serif",
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background decoration */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at 50% 0%, rgba(212, 175, 55, 0.03) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main content */}
      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '600px',
          textAlign: 'center',
          opacity: isLoaded ? 1 : 0,
          transform: isLoaded ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        {/* Large "404" text with gold accent */}
        <div
          style={{
            fontSize: '120px',
            fontWeight: '300',
            letterSpacing: '-4px',
            marginBottom: '20px',
            background: 'linear-gradient(135deg, #d4af37 0%, #f4e8c1 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            fontFamily: "'Georgia', serif",
          }}
        >
          404
        </div>

        {/* Gold divider line */}
        <div
          style={{
            width: '60px',
            height: '2px',
            backgroundColor: '#d4af37',
            margin: '30px auto 30px',
          }}
        />

        {/* Main message */}
        <h1
          style={{
            fontSize: '32px',
            fontWeight: '300',
            letterSpacing: '0.5px',
            marginBottom: '16px',
            lineHeight: '1.4',
          }}
        >
          Page Not Found
        </h1>

        {/* Descriptive text */}
        <p
          style={{
            fontSize: '16px',
            color: '#a0a0a0',
            marginBottom: '40px',
            lineHeight: '1.8',
            letterSpacing: '0.3px',
          }}
        >
          We couldn't find the page you were looking for. It may have moved, or perhaps the
          link you followed was incorrect. Let's get you back on track.
        </p>

        {/* Action buttons */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            justifyContent: 'center',
            flexWrap: 'wrap',
            marginBottom: '40px',
          }}
        >
          {/* Home button */}
          <button
            onClick={onNavigateHome}
            style={{
              padding: '12px 32px',
              backgroundColor: '#d4af37',
              color: '#000000',
              border: 'none',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Nunito', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#f4e8c1';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = '#d4af37';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Go to Home
          </button>

          {/* Browse venues button */}
          <button
            onClick={onNavigateCategory}
            style={{
              padding: '12px 32px',
              backgroundColor: 'transparent',
              color: '#d4af37',
              border: '1px solid #d4af37',
              fontSize: '14px',
              fontWeight: '600',
              letterSpacing: '0.5px',
              cursor: 'pointer',
              transition: 'all 0.3s ease',
              fontFamily: "'Nunito', sans-serif",
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = '#d4af37';
              e.target.style.color = '#000000';
              e.target.style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = '#d4af37';
              e.target.style.transform = 'translateY(0)';
            }}
          >
            Browse Venues
          </button>
        </div>

        {/* Secondary help text */}
        <p
          style={{
            fontSize: '13px',
            color: '#808080',
            letterSpacing: '0.3px',
            lineHeight: '1.6',
          }}
        >
          If you believe this is an error, please contact{' '}
          <a
            href='mailto:support@luxuryweddingdirectory.com'
            style={{
              color: '#d4af37',
              textDecoration: 'none',
              fontWeight: '500',
              transition: 'color 0.3s ease',
            }}
            onMouseEnter={(e) => (e.target.style.color = '#f4e8c1')}
            onMouseLeave={(e) => (e.target.style.color = '#d4af37')}
          >
            our support team
          </a>
          .
        </p>
      </div>
    </div>
  );
}
