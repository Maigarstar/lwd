import { useEffect, useRef, useState } from 'react';

export default function EditorialQuote({ quote, attribution, fontDisplay, fontUI }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);

  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.3 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  return (
    <section ref={ref} style={{
      background: '#111',
      padding: 'clamp(48px, 8vw, 96px) clamp(20px, 6vw, 80px)',
      textAlign: 'center',
      borderTop: '1px solid rgba(201,169,110,0.12)',
      borderBottom: '1px solid rgba(201,169,110,0.12)',
    }}>
      {/* Decorative rule */}
      <div style={{
        width: 40,
        height: 1,
        background: '#c9a96e',
        margin: '0 auto 28px',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.8s ease',
      }} />

      <blockquote style={{
        fontFamily: fontDisplay,
        fontSize: 'clamp(22px, 4vw, 42px)',
        fontWeight: 400,
        fontStyle: 'italic',
        color: '#f5f0e8',
        margin: '0 auto 20px',
        maxWidth: 820,
        lineHeight: 1.4,
        letterSpacing: '-0.01em',
        opacity: vis ? 1 : 0,
        transform: vis ? 'translateY(0)' : 'translateY(16px)',
        transition: 'opacity 1s ease 0.1s, transform 1s ease 0.1s',
      }}>
        "{quote}"
      </blockquote>

      {attribution && (
        <p style={{
          fontFamily: fontUI,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.2em',
          textTransform: 'uppercase',
          color: '#c9a96e',
          margin: 0,
          opacity: vis ? 1 : 0,
          transition: 'opacity 0.8s ease 0.4s',
        }}>
          — {attribution}
        </p>
      )}

      {/* Bottom rule */}
      <div style={{
        width: 40,
        height: 1,
        background: '#c9a96e',
        margin: '28px auto 0',
        opacity: vis ? 1 : 0,
        transition: 'opacity 0.8s ease 0.2s',
      }} />
    </section>
  );
}
