import { useState, useEffect, useRef } from 'react';

const HERO_IMAGE = 'https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1920&q=85';

export default function ArtistryHero({ fontDisplay, fontUI, audioSrc }) {
  const [loaded, setLoaded] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setLoaded(true), 150);
    return () => clearTimeout(t);
  }, []);

  // Mount audio element
  useEffect(() => {
    if (!audioSrc) return;
    const audio = new Audio(audioSrc);
    audio.loop = true;
    audio.volume = 0.35;
    audioRef.current = audio;
    return () => { audio.pause(); audio.src = ''; };
  }, [audioSrc]);

  // Play/pause on toggle
  useEffect(() => {
    if (!audioRef.current) return;
    if (soundOn) {
      audioRef.current.play().catch(() => {});
    } else {
      audioRef.current.pause();
    }
  }, [soundOn]);

  return (
    <section style={{
      position: 'relative',
      height: '100svh',
      minHeight: 520,
      overflow: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <style>{`
        @keyframes lwdKenBurns {
          from { transform: scale(1.07); }
          to   { transform: scale(1); }
        }
        @keyframes lwdScrollPulse {
          0%, 100% { transform: translateX(-50%) translateY(0); opacity: 0.6; }
          50%       { transform: translateX(-50%) translateY(8px); opacity: 0.3; }
        }
      `}</style>

      {/* Background, Ken Burns */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${HERO_IMAGE})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
        animation: 'lwdKenBurns 18s ease-out forwards',
        willChange: 'transform',
      }} />

      {/* Overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.82) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative',
        textAlign: 'center',
        padding: '0 20px',
        maxWidth: 700,
        width: '100%',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(28px)',
        transition: 'opacity 1.3s ease, transform 1.3s ease',
      }}>
        {/* Eyebrow */}
        <p style={{
          fontFamily: fontUI,
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.24em',
          textTransform: 'uppercase',
          color: '#c9a96e',
          margin: '0 0 18px',
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease 0.4s',
        }}>
          Luxury Wedding Directory
        </p>

        {/* Title */}
        <h1 style={{
          fontFamily: fontDisplay,
          fontSize: 'clamp(34px, 8vw, 80px)',
          fontWeight: 400,
          color: '#f5f0e8',
          margin: '0 0 18px',
          lineHeight: 1.05,
          letterSpacing: '-0.01em',
        }}>
          The Wedding Artistry Awards 2026
        </h1>

        {/* Subtitle */}
        <p style={{
          fontFamily: fontUI,
          fontSize: 'clamp(13px, 2vw, 17px)',
          fontWeight: 300,
          color: 'rgba(245,240,232,0.72)',
          margin: 0,
          letterSpacing: '0.07em',
          lineHeight: 1.6,
          opacity: loaded ? 1 : 0,
          transition: 'opacity 1s ease 0.7s',
        }}>
          Celebrating the artists behind extraordinary weddings, worldwide
        </p>
      </div>

      {/* Sound toggle, only shown when audioSrc provided */}
      {audioSrc && (
        <button
          onClick={() => setSoundOn(s => !s)}
          style={{
            position: 'absolute',
            top: 20,
            right: 24,
            background: 'rgba(0,0,0,0.35)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(201,169,110,0.3)',
            borderRadius: 20,
            padding: '7px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 7,
            cursor: 'pointer',
            opacity: loaded ? 1 : 0,
            transition: 'opacity 0.8s ease 1.8s, background 0.2s',
            zIndex: 10,
          }}
          aria-label={soundOn ? 'Mute ambient music' : 'Play ambient music'}
        >
          {/* Animated bars when playing, static when muted */}
          <span style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 12 }}>
            {[1, 0.5, 0.8, 0.3, 0.7].map((h, i) => (
              <span key={i} style={{
                width: 2,
                height: soundOn ? `${h * 100}%` : '30%',
                background: '#c9a96e',
                borderRadius: 1,
                display: 'block',
                transition: soundOn ? `height 0.${3 + i}s ease ${i * 0.08}s` : 'height 0.3s ease',
              }} />
            ))}
          </span>
          <span style={{
            fontFamily: fontUI,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: soundOn ? '#c9a96e' : 'rgba(245,240,232,0.5)',
            transition: 'color 0.2s',
          }}>
            {soundOn ? 'Sound On' : 'Sound Off'}
          </span>
        </button>
      )}

      {/* Scroll indicator */}
      <div style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        opacity: loaded ? 1 : 0,
        transition: 'opacity 1s ease 1.4s',
        animation: loaded ? 'lwdScrollPulse 2.4s ease-in-out 2s infinite' : 'none',
        cursor: 'default',
      }}>
        <span style={{
          fontFamily: fontUI,
          fontSize: 8,
          letterSpacing: '0.22em',
          color: 'rgba(245,240,232,0.5)',
          textTransform: 'uppercase',
        }}>
          Scroll
        </span>
        <div style={{ width: 1, height: 36, background: 'linear-gradient(to bottom, rgba(245,240,232,0.4), transparent)' }} />
      </div>
    </section>
  );
}
