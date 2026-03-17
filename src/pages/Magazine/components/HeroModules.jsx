import { useState, useEffect, useRef, useCallback } from 'react';

const FD = "'Gilda Display', 'Playfair Display', Georgia, serif";
const FU = "'Nunito', 'Inter', 'Helvetica Neue', sans-serif";
const GOLD = '#c9a96e';
const CREAM = '#f5f0e8';

function CategoryLabel({ label, color = GOLD, style = {} }) {
  return (
    <span style={{
      fontFamily: FU, fontSize: 9, fontWeight: 700,
      letterSpacing: '0.22em', textTransform: 'uppercase',
      color: color, ...style,
    }}>
      {label}
    </span>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Hero Style 1: Full-Width Editorial Statement ──────────────────────────────
export function HeroEditorial({ post, onRead, minHeight = '100svh', textAlign = 'center' }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);

  if (!post) return null;
  return (
    <section style={{ position: 'relative', minHeight, overflow: 'hidden', display: 'flex', alignItems: 'flex-end' }}>
      <style>{`
        @keyframes hEditKB { from { transform: scale(1.06) } to { transform: scale(1) } }
        .he-img { animation: hEditKB 20s ease-out forwards; will-change: transform; }
      `}</style>

      {/* Background */}
      <div className="he-img" style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center 30%',
      }} />

      {/* Gradient overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.15) 100%)',
      }} />

      {/* Content */}
      <div style={{
        position: 'relative', width: '100%',
        padding: 'clamp(40px, 6vw, 80px) clamp(24px, 6vw, 100px) clamp(48px, 7vw, 90px)',
        textAlign,
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(24px)',
        transition: 'opacity 1.2s ease, transform 1.2s ease',
      }}>
        <div style={{ maxWidth: textAlign === 'center' ? 800 : 700, margin: textAlign === 'center' ? '0 auto' : 0 }}>
          <CategoryLabel label={post.categoryLabel} style={{ display: 'block', marginBottom: 22 }} />

          <h1 style={{
            fontFamily: FD,
            fontSize: 'clamp(38px, 7vw, 88px)',
            fontWeight: 400, color: CREAM,
            margin: '0 0 22px', lineHeight: 1.02,
            letterSpacing: '-0.02em',
          }}>
            {post.title}
          </h1>

          <p style={{
            fontFamily: FU, fontSize: 'clamp(14px, 1.8vw, 18px)',
            fontWeight: 300, color: 'rgba(245,240,232,0.72)',
            margin: '0 0 32px', lineHeight: 1.65,
            letterSpacing: '0.02em',
            maxWidth: textAlign === 'center' ? 580 : '100%',
            marginLeft: textAlign === 'center' ? 'auto' : 0,
            marginRight: textAlign === 'center' ? 'auto' : 0,
          }}>
            {post.excerpt}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', gap: 20, justifyContent: textAlign === 'center' ? 'center' : 'flex-start', flexWrap: 'wrap' }}>
            <button onClick={() => onRead && onRead(post)} style={{
              fontFamily: FU, fontSize: 10, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#0a0a0a', background: GOLD,
              border: 'none', padding: '13px 28px',
              cursor: 'pointer', borderRadius: 2,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.target.style.opacity = 0.85}
              onMouseLeave={e => e.target.style.opacity = 1}
            >
              Read Story
            </button>
            <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.45)', letterSpacing: '0.1em' }}>
              {post.author.name} &nbsp;·&nbsp; {post.readingTime} min read
            </span>
          </div>
        </div>
      </div>

      {/* Issue line */}
      <div style={{
        position: 'absolute', top: 28, left: 'clamp(24px, 6vw, 100px)', right: 'clamp(24px, 6vw, 100px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontFamily: FU, fontSize: 9, letterSpacing: '0.22em', textTransform: 'uppercase', color: 'rgba(245,240,232,0.4)' }}>
          Luxury Wedding Directory
        </span>
        <span style={{ fontFamily: FU, fontSize: 9, letterSpacing: '0.15em', color: 'rgba(245,240,232,0.3)', fontStyle: 'italic' }}>
          Spring · Summer 2026
        </span>
      </div>
    </section>
  );
}

// ── Hero Style 2: Split Screen Feature ───────────────────────────────────────
export function HeroSplitScreen({ post, onRead, imageRight = false }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t); }, []);

  if (!post) return null;
  return (
    <section style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      minHeight: 'clamp(520px, 80svh, 820px)',
      background: '#0a0a0a',
    }}>
      <style>{`
        @media (max-width: 767px) {
          .hs-image { min-height: 320px !important; order: -1; }
          .hs-content { padding: 32px 24px 40px !important; }
        }
      `}</style>

      {/* Image side */}
      <div className="hs-image" style={{
        order: imageRight ? 2 : 1,
        position: 'relative', overflow: 'hidden',
        minHeight: 480,
      }}>
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: `url(${post.coverImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center',
          transition: 'transform 0.7s ease',
        }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: imageRight
            ? 'linear-gradient(to right, rgba(10,10,10,0.2) 0%, transparent 60%)'
            : 'linear-gradient(to left, rgba(10,10,10,0.2) 0%, transparent 60%)',
        }} />
      </div>

      {/* Content side */}
      <div className="hs-content" style={{
        order: imageRight ? 1 : 2,
        display: 'flex', flexDirection: 'column', justifyContent: 'center',
        padding: 'clamp(40px, 5vw, 80px) clamp(32px, 5vw, 72px)',
        background: '#0d0d0b',
        borderLeft: imageRight ? 'none' : '1px solid rgba(201,169,110,0.08)',
        borderRight: imageRight ? '1px solid rgba(201,169,110,0.08)' : 'none',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateX(0)' : `translateX(${imageRight ? -20 : 20}px)`,
        transition: 'opacity 1s ease, transform 1s ease',
      }}>
        <div style={{ width: 28, height: 1, background: GOLD, marginBottom: 24 }} />

        <CategoryLabel label={post.categoryLabel} style={{ display: 'block', marginBottom: 18 }} />

        <h2 style={{
          fontFamily: FD, fontSize: 'clamp(28px, 3.5vw, 52px)',
          fontWeight: 400, color: CREAM,
          margin: '0 0 20px', lineHeight: 1.08,
          letterSpacing: '-0.02em',
        }}>
          {post.title}
        </h2>

        <p style={{
          fontFamily: FU, fontSize: 'clamp(13px, 1.4vw, 15px)',
          fontWeight: 300, color: 'rgba(245,240,232,0.6)',
          margin: '0 0 28px', lineHeight: 1.7,
        }}>
          {post.excerpt}
        </p>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.08em' }}>
            {post.author.name}
          </span>
          <span style={{ color: 'rgba(245,240,232,0.2)', fontSize: 8 }}>·</span>
          <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.08em' }}>
            {formatDate(post.date)}
          </span>
          <span style={{ color: 'rgba(245,240,232,0.2)', fontSize: 8 }}>·</span>
          <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.08em' }}>
            {post.readingTime} min
          </span>
        </div>

        <button onClick={() => onRead && onRead(post)} style={{
          alignSelf: 'flex-start',
          fontFamily: FU, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.22em', textTransform: 'uppercase',
          color: GOLD, background: 'transparent',
          border: `1px solid ${GOLD}`, padding: '12px 24px',
          cursor: 'pointer', borderRadius: 2,
          transition: 'background 0.2s, color 0.2s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = GOLD; e.currentTarget.style.color = '#0a0a0a'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = GOLD; }}
        >
          Read Feature →
        </button>
      </div>
    </section>
  );
}

// ── Hero Style 3: Multi-Story Magazine Grid ───────────────────────────────────
export function HeroMagazineGrid({ posts = [], onRead }) {
  const [featured, ...supporting] = posts.slice(0, 5);
  if (!featured) return null;

  return (
    <section style={{ background: '#0a0a0a', padding: '0 0 0' }}>
      <style>{`
        .hmg-grid {
          display: grid;
          grid-template-columns: 3fr 2fr;
          grid-template-rows: auto;
          min-height: clamp(500px, 75svh, 780px);
        }
        .hmg-supporting { display: grid; grid-template-rows: repeat(2, 1fr); }
        @media (max-width: 900px) {
          .hmg-grid { grid-template-columns: 1fr !important; }
          .hmg-supporting { grid-template-rows: auto !important; grid-template-columns: 1fr 1fr; }
        }
        @media (max-width: 560px) {
          .hmg-supporting { grid-template-columns: 1fr !important; }
        }
        .hmg-card:hover .hmg-img-inner { transform: scale(1.04) !important; }
      `}</style>

      <div className="hmg-grid">
        {/* Main featured story */}
        <div className="hmg-card" style={{
          position: 'relative', overflow: 'hidden', cursor: 'pointer',
          borderRight: '1px solid rgba(201,169,110,0.08)',
        }}
          onClick={() => onRead && onRead(featured)}
        >
          <div className="hmg-img-inner" style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${featured.coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
            transition: 'transform 0.8s ease',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.3) 55%, transparent 100%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0,
            padding: 'clamp(24px, 4vw, 48px)',
          }}>
            <div style={{
              display: 'inline-block',
              background: GOLD, color: '#0a0a0a',
              fontFamily: FU, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '4px 10px', marginBottom: 16, borderRadius: 1,
            }}>
              Cover Story
            </div>
            <h2 style={{
              fontFamily: FD, fontSize: 'clamp(26px, 3.5vw, 48px)',
              fontWeight: 400, color: CREAM,
              margin: '0 0 12px', lineHeight: 1.05,
              letterSpacing: '-0.02em',
            }}>
              {featured.title}
            </h2>
            <p style={{
              fontFamily: FU, fontSize: 'clamp(12px, 1.3vw, 14px)',
              fontWeight: 300, color: 'rgba(245,240,232,0.6)',
              margin: '0 0 16px', lineHeight: 1.6,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {featured.excerpt}
            </p>
            <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.38)', letterSpacing: '0.08em' }}>
              {featured.author.name} &nbsp;·&nbsp; {featured.readingTime} min read
            </span>
          </div>
        </div>

        {/* Supporting stories */}
        <div className="hmg-supporting">
          {supporting.slice(0, 2).map((p, i) => (
            <div key={p.id} className="hmg-card" style={{
              position: 'relative', overflow: 'hidden', cursor: 'pointer',
              borderBottom: i === 0 ? '1px solid rgba(201,169,110,0.08)' : 'none',
            }}
              onClick={() => onRead && onRead(p)}
            >
              <div className="hmg-img-inner" style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${p.coverImage})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'transform 0.8s ease',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)',
              }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: 'clamp(16px, 2.5vw, 28px)',
              }}>
                <CategoryLabel label={p.categoryLabel} style={{ display: 'block', marginBottom: 10 }} />
                <h3 style={{
                  fontFamily: FD, fontSize: 'clamp(18px, 2vw, 26px)',
                  fontWeight: 400, color: CREAM,
                  margin: '0 0 8px', lineHeight: 1.1,
                }}>
                  {p.title}
                </h3>
                <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.06em' }}>
                  {p.readingTime} min read
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom ticker row */}
      {supporting.length > 2 && (
        <div style={{
          display: 'flex', gap: 0,
          borderTop: '1px solid rgba(201,169,110,0.1)',
          overflowX: 'auto',
        }}>
          {supporting.slice(2).map((p, i) => (
            <div key={p.id} onClick={() => onRead && onRead(p)} style={{
              flex: '1 0 200px', padding: '16px 20px',
              borderRight: '1px solid rgba(201,169,110,0.08)',
              cursor: 'pointer',
              transition: 'background 0.2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,169,110,0.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <CategoryLabel label={p.categoryLabel} style={{ display: 'block', marginBottom: 6 }} />
              <p style={{
                fontFamily: FD, fontSize: 15, fontWeight: 400, color: CREAM,
                margin: 0, lineHeight: 1.3,
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical', overflow: 'hidden',
              }}>
                {p.title}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Hero Style 4: Carousel / Slider Hero ─────────────────────────────────────
export function HeroCarousel({ posts = [], onRead }) {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchStart = useRef(null);
  const len = posts.length;

  const next = useCallback(() => setActive(a => (a + 1) % len), [len]);
  const prev = useCallback(() => setActive(a => (a - 1 + len) % len), [len]);

  useEffect(() => {
    if (paused || len < 2) return;
    const t = setInterval(next, 5500);
    return () => clearInterval(t);
  }, [paused, next, len]);

  const handleTouchStart = e => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchStart.current = null;
  };

  if (!posts.length) return null;

  return (
    <section
      style={{ position: 'relative', height: '100svh', minHeight: 520, overflow: 'hidden', background: '#0a0a0a' }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <style>{`
        .hc-slide { position: absolute; inset: 0; opacity: 0; transition: opacity 1s ease; pointer-events: none; }
        .hc-slide.active { opacity: 1; pointer-events: auto; }
        .hc-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: rgba(0,0,0,0.35); backdrop-filter: blur(8px); border: 1px solid rgba(245,240,232,0.15); color: rgba(245,240,232,0.8); width: 48px; height: 48px; border-radius: 50%; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 20px; transition: all 0.2s; z-index: 10; opacity: 0; }
        section:hover .hc-arrow { opacity: 1; }
        .hc-arrow:hover { background: rgba(201,169,110,0.3); border-color: rgba(201,169,110,0.5); color: #c9a96e; }
        @media (max-width: 767px) { .hc-arrow { display: none; } }
      `}</style>

      {posts.map((post, i) => (
        <div key={post.id} className={`hc-slide${i === active ? ' active' : ''}`}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${post.coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.1) 100%)',
          }} />
          <div style={{
            position: 'absolute', bottom: 'clamp(80px, 12vh, 130px)',
            left: 'clamp(24px, 6vw, 100px)', right: 'clamp(24px, 6vw, 100px)',
            maxWidth: 720,
          }}>
            <CategoryLabel label={post.categoryLabel} style={{ display: 'block', marginBottom: 16 }} />
            <h2 style={{
              fontFamily: FD, fontSize: 'clamp(30px, 5.5vw, 70px)',
              fontWeight: 400, color: CREAM,
              margin: '0 0 16px', lineHeight: 1.04,
              letterSpacing: '-0.02em',
            }}>
              {post.title}
            </h2>
            <p style={{
              fontFamily: FU, fontSize: 'clamp(13px, 1.5vw, 16px)',
              fontWeight: 300, color: 'rgba(245,240,232,0.65)',
              margin: '0 0 28px', lineHeight: 1.6,
              maxWidth: 520,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {post.excerpt}
            </p>
            <button onClick={() => onRead && onRead(post)} style={{
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#0a0a0a', background: GOLD,
              border: 'none', padding: '12px 24px',
              cursor: 'pointer', borderRadius: 2,
            }}>
              Read Feature
            </button>
          </div>
        </div>
      ))}

      {/* Prev/Next arrows */}
      <button className="hc-arrow" style={{ left: 20 }} onClick={prev} aria-label="Previous">‹</button>
      <button className="hc-arrow" style={{ right: 20 }} onClick={next} aria-label="Next">›</button>

      {/* Progress dots + progress bar */}
      <div style={{
        position: 'absolute', bottom: 32, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', gap: 8, alignItems: 'center', zIndex: 10,
      }}>
        {posts.map((_, i) => (
          <button key={i} onClick={() => setActive(i)} style={{
            width: i === active ? 24 : 6, height: 6,
            borderRadius: 3, background: i === active ? GOLD : 'rgba(245,240,232,0.3)',
            border: 'none', cursor: 'pointer', padding: 0,
            transition: 'width 0.3s ease, background 0.3s ease',
          }} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      {/* Slide counter */}
      <div style={{
        position: 'absolute', top: 28, right: 'clamp(24px, 6vw, 100px)',
        fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.35)',
        letterSpacing: '0.1em',
      }}>
        {String(active + 1).padStart(2, '0')} / {String(len).padStart(2, '0')}
      </div>
    </section>
  );
}

// ── Hero Style 5: Portrait Hero with Bleeding Cards ─────────────────────────
// Lead story on the left, four portrait-oriented cards bleeding from the right edge
export function HeroPortrait({ posts = [], onRead }) {
  const [lead, ...cards] = posts.slice(0, 5);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);

  if (!lead) return null;
  const portraits = cards.slice(0, 4);

  return (
    <section style={{ position: 'relative', background: '#0a0a0a', overflow: 'hidden' }}>
      <style>{`
        .hp5-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          min-height: clamp(520px, 80svh, 820px);
          max-width: 1440px;
          margin: 0 auto;
        }
        .hp5-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          grid-template-rows: 1fr 1fr;
          gap: 3px;
          margin-right: -40px;
        }
        .hp5-card { position: relative; overflow: hidden; cursor: pointer; }
        .hp5-card:hover .hp5-card-img { transform: scale(1.05) !important; }
        @media (max-width: 900px) {
          .hp5-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hp5-cards { margin-right: 0; margin: 0 clamp(16px, 3vw, 40px) clamp(16px, 3vw, 40px); }
          .hp5-lead-content { padding-bottom: 40px !important; }
        }
        @media (max-width: 560px) {
          .hp5-cards { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>

      <div className="hp5-grid">
        {/* Lead story, left side */}
        <div style={{ position: 'relative', overflow: 'hidden' }}>
          <div style={{
            position: 'absolute', inset: 0,
            backgroundImage: `url(${lead.coverImage})`,
            backgroundSize: 'cover', backgroundPosition: 'center 25%',
          }} />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.4) 50%, rgba(0,0,0,0.15) 100%)',
          }} />
          <div className="hp5-lead-content" style={{
            position: 'relative', display: 'flex', flexDirection: 'column',
            justifyContent: 'flex-end', height: '100%',
            padding: 'clamp(32px, 4vw, 64px)',
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(20px)',
            transition: 'opacity 1s ease, transform 1s ease',
          }}>
            <div style={{
              display: 'inline-block', alignSelf: 'flex-start',
              background: GOLD, color: '#0a0a0a',
              fontFamily: FU, fontSize: 8, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '4px 10px', marginBottom: 18, borderRadius: 1,
            }}>
              Cover Feature
            </div>
            <h2 style={{
              fontFamily: FD, fontSize: 'clamp(30px, 4.5vw, 58px)',
              fontWeight: 400, color: CREAM,
              margin: '0 0 14px', lineHeight: 1.04,
              letterSpacing: '-0.02em',
            }}>
              {lead.title}
            </h2>
            <p style={{
              fontFamily: FU, fontSize: 'clamp(13px, 1.4vw, 15px)',
              fontWeight: 300, color: 'rgba(245,240,232,0.6)',
              margin: '0 0 24px', lineHeight: 1.65, maxWidth: 480,
            }}>
              {lead.excerpt}
            </p>
            <button onClick={() => onRead && onRead(lead)} style={{
              alignSelf: 'flex-start',
              fontFamily: FU, fontSize: 9, fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase',
              color: '#0a0a0a', background: GOLD,
              border: 'none', padding: '12px 24px',
              cursor: 'pointer', borderRadius: 2,
              transition: 'opacity 0.2s',
            }}
              onMouseEnter={e => e.target.style.opacity = 0.85}
              onMouseLeave={e => e.target.style.opacity = 1}
            >
              Read Feature
            </button>
          </div>
        </div>

        {/* Portrait cards, right side, bleeding off edge */}
        <div className="hp5-cards">
          {portraits.map((p) => (
            <div key={p.id} className="hp5-card" onClick={() => onRead && onRead(p)}>
              <div className="hp5-card-img" style={{
                position: 'absolute', inset: 0,
                backgroundImage: `url(${p.coverImage})`,
                backgroundSize: 'cover', backgroundPosition: 'center',
                transition: 'transform 0.6s ease',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.15) 55%, transparent 100%)',
              }} />
              <div style={{
                position: 'absolute', bottom: 0, left: 0, right: 0,
                padding: 'clamp(12px, 1.5vw, 20px)',
              }}>
                <CategoryLabel label={p.categoryLabel} style={{ display: 'block', marginBottom: 8 }} />
                <h3 style={{
                  fontFamily: FD, fontSize: 'clamp(15px, 1.6vw, 22px)',
                  fontWeight: 400, color: CREAM,
                  margin: '0 0 6px', lineHeight: 1.12,
                  display: '-webkit-box', WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical', overflow: 'hidden',
                }}>
                  {p.title}
                </h3>
                <span style={{ fontFamily: FU, fontSize: 9, color: 'rgba(245,240,232,0.35)', letterSpacing: '0.06em' }}>
                  {p.readingTime} min read
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ── Hero Style 6: Dual Feature ──────────────────────────────────────────────
// Two side-by-side hero stories with equal visual weight, editorial spread
export function HeroDualFeature({ posts = [], onRead }) {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLoaded(true), 100); return () => clearTimeout(t); }, []);

  const [left, right] = posts.slice(0, 2);
  if (!left) return null;

  const renderSide = (post, side) => (
    <div style={{
      position: 'relative', overflow: 'hidden', cursor: 'pointer',
      borderRight: side === 'left' ? '1px solid rgba(201,169,110,0.06)' : 'none',
    }}
      onClick={() => onRead && onRead(post)}
      className="hdf-side"
    >
      <div className="hdf-img" style={{
        position: 'absolute', inset: 0,
        backgroundImage: `url(${post.coverImage})`,
        backgroundSize: 'cover', backgroundPosition: 'center',
        transition: 'transform 0.8s ease',
      }} />
      <div style={{
        position: 'absolute', inset: 0,
        background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.1) 100%)',
      }} />
      {/* Content */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        padding: 'clamp(24px, 3.5vw, 48px)',
        opacity: loaded ? 1 : 0,
        transform: loaded ? 'translateY(0)' : 'translateY(18px)',
        transition: 'opacity 1s ease 0.15s, transform 1s ease 0.15s',
      }}>
        <div style={{
          display: 'inline-block',
          background: side === 'left' ? GOLD : 'transparent',
          color: side === 'left' ? '#0a0a0a' : GOLD,
          border: side === 'left' ? 'none' : `1px solid ${GOLD}`,
          fontFamily: FU, fontSize: 8, fontWeight: 700,
          letterSpacing: '0.2em', textTransform: 'uppercase',
          padding: '3px 10px', marginBottom: 16, borderRadius: 1,
        }}>
          {side === 'left' ? 'Lead Feature' : 'Also This Issue'}
        </div>
        <h2 style={{
          fontFamily: FD,
          fontSize: side === 'left' ? 'clamp(26px, 3.5vw, 50px)' : 'clamp(22px, 2.8vw, 42px)',
          fontWeight: 400, color: CREAM,
          margin: '0 0 12px', lineHeight: 1.06,
          letterSpacing: '-0.015em',
        }}>
          {post.title}
        </h2>
        <p style={{
          fontFamily: FU, fontSize: 'clamp(12px, 1.2vw, 14px)',
          fontWeight: 300, color: 'rgba(245,240,232,0.6)',
          margin: '0 0 20px', lineHeight: 1.6,
          display: '-webkit-box', WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>
          {post.excerpt}
        </p>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={e => { e.stopPropagation(); onRead && onRead(post); }} style={{
            fontFamily: FU, fontSize: 9, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            color: '#0a0a0a', background: GOLD,
            border: 'none', padding: '10px 20px',
            cursor: 'pointer', borderRadius: 2,
            transition: 'opacity 0.2s',
          }}
            onMouseEnter={e => e.target.style.opacity = 0.85}
            onMouseLeave={e => e.target.style.opacity = 1}
          >
            Read Story
          </button>
          <span style={{ fontFamily: FU, fontSize: 10, color: 'rgba(245,240,232,0.38)', letterSpacing: '0.08em' }}>
            {post.author.name} &nbsp;·&nbsp; {post.readingTime} min
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <section style={{ background: '#0a0a0a' }}>
      <style>{`
        .hdf-grid {
          display: grid;
          grid-template-columns: 1.15fr 1fr;
          min-height: clamp(520px, 85svh, 860px);
        }
        .hdf-side:hover .hdf-img { transform: scale(1.03) !important; }
        @media (max-width: 767px) {
          .hdf-grid { grid-template-columns: 1fr !important; min-height: auto !important; }
          .hdf-side { min-height: clamp(380px, 55svh, 520px) !important; }
        }
      `}</style>

      <div className="hdf-grid">
        {renderSide(left, 'left')}
        {right ? renderSide(right, 'right') : (
          <div style={{
            background: '#0d0d0b',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            borderLeft: '1px solid rgba(201,169,110,0.06)',
          }}>
            <span style={{ fontFamily: FU, fontSize: 11, color: 'rgba(245,240,232,0.2)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
              Feature Coming Soon
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
