import { useState } from 'react';
import { getMagTheme, FD, FU, GOLD_CONST as GOLD } from '../magazineTheme';

export default function NewsletterCapture({ isLight = false }) {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const T = getMagTheme(isLight);

  // Newsletter block intentionally has a dark/dramatic editorial feel.
  // In light mode we use a warm cream bg; in dark mode, deep black.
  const bgColor = isLight ? '#f0ebe3' : '#080806';
  const headColor = isLight ? '#1a1806' : '#f5f0e8';
  const subColor = isLight ? 'rgba(30,28,22,0.55)' : 'rgba(245,240,232,0.55)';
  const inputBg = isLight ? 'rgba(30,28,22,0.05)' : 'rgba(255,255,255,0.05)';
  const inputColor = isLight ? '#1a1806' : '#f5f0e8';
  const noteColor = isLight ? 'rgba(30,28,22,0.3)' : 'rgba(245,240,232,0.25)';

  const handleSubmit = e => {
    e.preventDefault();
    if (!email.includes('@')) return;
    setSubmitted(true);
  };

  return (
    <section style={{
      position: 'relative', overflow: 'hidden',
      background: bgColor,
      padding: 'clamp(64px, 10vw, 120px) clamp(24px, 6vw, 80px)',
      transition: 'background 0.3s',
    }}>
      {/* Background texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: 'url(https://images.unsplash.com/photo-1455587734955-081b22074882?auto=format&fit=crop&w=1200&q=40)',
        backgroundSize: 'cover', backgroundPosition: 'center',
        opacity: isLight ? 0.03 : 0.06,
      }} />

      <div style={{ position: 'relative', maxWidth: 600, margin: '0 auto', textAlign: 'center' }}>
        {/* Gold ornament */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, justifyContent: 'center', marginBottom: 32 }}>
          <div style={{ width: 40, height: 1, background: `${GOLD}60` }} />
          <span style={{ color: GOLD, fontSize: 12, letterSpacing: '0.3em' }}>✦</span>
          <div style={{ width: 40, height: 1, background: `${GOLD}60` }} />
        </div>

        <p style={{
          fontFamily: FU, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.26em', textTransform: 'uppercase',
          color: GOLD, margin: '0 0 18px',
        }}>
          The Magazine
        </p>

        <h2 style={{
          fontFamily: FD, fontSize: 'clamp(30px, 5vw, 54px)',
          fontWeight: 400, color: headColor,
          margin: '0 0 16px', lineHeight: 1.1,
        }}>
          Join the World of Luxury Weddings
        </h2>

        <p style={{
          fontFamily: FU, fontSize: 'clamp(13px, 1.5vw, 15px)',
          fontWeight: 300, color: subColor,
          margin: '0 0 40px', lineHeight: 1.7,
          letterSpacing: '0.03em',
        }}>
          Editorial stories, venue discoveries, and exclusive features, delivered with the discretion and elegance our readers expect.
        </p>

        {!submitted ? (
          <form onSubmit={handleSubmit} style={{
            display: 'flex', gap: 0, maxWidth: 440, margin: '0 auto',
            border: `1px solid ${GOLD}40`, borderRadius: 2, overflow: 'hidden',
          }}>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Your email address"
              required
              style={{
                flex: 1, background: inputBg,
                border: 'none', outline: 'none',
                padding: '15px 20px',
                fontFamily: FU, fontSize: 13, color: inputColor,
                letterSpacing: '0.03em',
              }}
            />
            <button type="submit" style={{
              background: GOLD, color: '#0a0a0a', border: 'none',
              padding: '15px 24px', cursor: 'pointer',
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.18em', textTransform: 'uppercase',
              whiteSpace: 'nowrap', flexShrink: 0,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 0.85}
              onMouseLeave={e => e.currentTarget.style.opacity = 1}
            >
              Subscribe
            </button>
          </form>
        ) : (
          <div style={{
            fontFamily: FD, fontSize: 20, fontStyle: 'italic',
            color: headColor, lineHeight: 1.5,
          }}>
            Welcome to the edit. Your first letter arrives shortly.
          </div>
        )}

        <p style={{
          fontFamily: FU, fontSize: 10, color: noteColor,
          margin: '18px 0 0', letterSpacing: '0.05em',
        }}>
          No noise. No spam. Unsubscribe at any time.
        </p>
      </div>
    </section>
  );
}
