import { useEffect, useRef, useState } from 'react';

const MICRO_LABELS = {
  different:  'What makes you different?',
  momentFor:  'The moment you live for?',
  perfectDay: 'Your perfect day?',
};

export default function FeaturedArtist({ artist, fontDisplay, fontUI, onViewProfile, onHoverStart, onHoverEnd }) {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  const [displayArtist, setDisplayArtist] = useState(artist);
  const [fading, setFading] = useState(false);

  // Scroll-in reveal
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVis(true); io.disconnect(); } },
      { threshold: 0.12 }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, []);

  // Fade out → swap → fade in when artist rotates
  useEffect(() => {
    if (artist.id === displayArtist.id) return;
    setFading(true);
    const t = setTimeout(() => {
      setDisplayArtist(artist);
      setFading(false);
    }, 500);
    return () => clearTimeout(t);
  }, [artist]);

  if (!artist) return null;

  return (
    <section ref={ref} className="fa-section" style={{ background: '#0d0d0d', padding: '80px 0', overflow: 'hidden' }}>
      <style>{`
        .fa-section { }

        .fa-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }

        .fa-img-wrap {
          position: relative;
          border-radius: 4px;
          overflow: hidden;
          aspect-ratio: 3/4;
          opacity: 0;
          transform: translateX(-36px);
          transition: opacity 1s ease, transform 1s ease;
        }
        .fa-img-wrap.vis {
          opacity: 1;
          transform: translateX(0);
        }
        .fa-img-wrap img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 8s ease;
        }
        .fa-img-wrap:hover img { transform: scale(1.04); }

        .fa-img-badge {
          position: absolute;
          top: 20px;
          left: 20px;
          background: rgba(0,0,0,0.6);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(201,169,110,0.35);
          border-radius: 2px;
          padding: 5px 12px;
        }

        .fa-content {
          opacity: 0;
          transform: translateX(36px);
          transition: opacity 1s ease 0.22s, transform 1s ease 0.22s;
        }
        .fa-content.vis {
          opacity: 1;
          transform: translateX(0);
        }

        .fa-quote {
          border-left: 2px solid #c9a96e;
          padding: 12px 0 12px 20px;
          margin: 24px 0 32px;
        }

        .fa-prompts { display: flex; flex-direction: column; gap: 20px; margin-bottom: 36px; }

        .fa-prompt { }

        .fa-cta {
          display: inline-block;
          padding: 14px 32px;
          border: 1px solid #c9a96e;
          color: #c9a96e;
          cursor: pointer;
          background: transparent;
          transition: background 0.22s, color 0.22s;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .fa-cta:hover { background: #c9a96e; color: #0d0d0d; }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .fa-section { padding: 56px 0; }

          .fa-inner {
            grid-template-columns: 1fr;
            gap: 32px;
            padding: 0 16px;
          }

          .fa-img-wrap {
            aspect-ratio: 4/3;
            transform: translateY(24px);
          }
          .fa-img-wrap.vis { transform: translateY(0); }

          .fa-content {
            transform: translateY(24px);
          }
          .fa-content.vis { transform: translateY(0); }

          .fa-quote { margin: 16px 0 24px; }
          .fa-prompts { gap: 16px; margin-bottom: 28px; }
        }
      `}</style>

      <div
        className="fa-inner"
        onMouseEnter={() => onHoverStart && onHoverStart()}
        onMouseLeave={() => onHoverEnd && onHoverEnd()}
      >

        {/* Left — Image */}
        <div
          className={`fa-img-wrap${vis ? ' vis' : ''}`}
          style={{ opacity: fading ? 0 : undefined, transition: fading ? 'opacity 0.5s ease' : undefined }}
        >
          <img src={displayArtist.image} alt={displayArtist.name} loading="lazy" />

          <div className="fa-img-badge">
            <span style={{
              fontFamily: fontUI,
              fontSize: 9,
              fontWeight: 700,
              letterSpacing: '0.22em',
              textTransform: 'uppercase',
              color: '#c9a96e',
            }}>
              Featured Artist
            </span>
          </div>
        </div>

        {/* Right — Content */}
        <div
          className={`fa-content${vis ? ' vis' : ''}`}
          style={{ opacity: fading ? 0 : undefined, transition: fading ? 'opacity 0.5s ease' : undefined }}
        >

          {/* Eyebrow */}
          <p style={{
            fontFamily: fontUI,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.26em',
            textTransform: 'uppercase',
            color: '#c9a96e',
            margin: '0 0 14px',
          }}>
            {displayArtist.category} · {displayArtist.location}
          </p>

          {/* Name */}
          <h2 style={{
            fontFamily: fontDisplay,
            fontSize: 'clamp(34px, 5vw, 58px)',
            fontWeight: 400,
            color: '#f5f0e8',
            margin: 0,
            lineHeight: 1.05,
            letterSpacing: '-0.01em',
          }}>
            {displayArtist.name}
          </h2>

          {/* Quote */}
          <div className="fa-quote">
            <p style={{
              fontFamily: fontDisplay,
              fontSize: 'clamp(15px, 2vw, 19px)',
              fontWeight: 400,
              fontStyle: 'italic',
              color: 'rgba(245,240,232,0.75)',
              margin: 0,
              lineHeight: 1.55,
            }}>
              "{displayArtist.quote}"
            </p>
          </div>

          {/* Micro-prompts */}
          <div className="fa-prompts">
            {Object.entries(displayArtist.microPrompts || {}).map(([key, val]) => (
              <div key={key} className="fa-prompt">
                <p style={{
                  fontFamily: fontUI,
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: '0.18em',
                  textTransform: 'uppercase',
                  color: '#c9a96e',
                  margin: '0 0 5px',
                }}>
                  {MICRO_LABELS[key] || key}
                </p>
                <p style={{
                  fontFamily: fontUI,
                  fontSize: 'clamp(12px, 1.5vw, 14px)',
                  fontWeight: 300,
                  color: 'rgba(245,240,232,0.65)',
                  margin: 0,
                  lineHeight: 1.65,
                }}>
                  {val}
                </p>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            className="fa-cta"
            style={{ fontFamily: fontUI, fontSize: 10 }}
            onClick={() => onViewProfile && onViewProfile(displayArtist)}
          >
            View Profile
          </button>
        </div>

      </div>
    </section>
  );
}
