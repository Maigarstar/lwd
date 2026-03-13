import { useEffect, useState, useCallback, useRef } from 'react';
import VideoEmbed, { getEmbedInfo } from './VideoEmbed';

const MICRO_LABELS = {
  different:  'What makes you different?',
  momentFor:  'The moment you live for?',
  perfectDay: 'Your perfect day?',
};

export default function ArtistLightbox({ artists, initialId, onClose, fontDisplay, fontUI }) {
  const idx = artists.findIndex(a => a.id === initialId);
  const [current, setCurrent] = useState(idx >= 0 ? idx : 0);
  const [panelOpen, setPanelOpen] = useState(true);
  const [mediaTab, setMediaTab] = useState('images'); // 'images' | 'video'
  const touchStart = useRef(null);

  const artist = artists[current];
  const allImgs = [artist.image, ...(artist.gallery || [])].filter(Boolean);
  const [imgIdx, setImgIdx] = useState(0);
  const hasVideo = !!getEmbedInfo(artist.videoUrl);

  // Reset image index + tab when artist changes
  useEffect(() => { setImgIdx(0); setMediaTab('images'); }, [current]);

  const prev = useCallback(() => setCurrent(c => (c - 1 + artists.length) % artists.length), [artists.length]);
  const next = useCallback(() => setCurrent(c => (c + 1) % artists.length), [artists.length]);

  useEffect(() => {
    const handleKey = e => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose, next, prev]);

  // Prevent body scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  const handleTouchStart = e => { touchStart.current = e.touches[0].clientX; };
  const handleTouchEnd = e => {
    if (touchStart.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStart.current;
    if (Math.abs(dx) > 50) dx < 0 ? next() : prev();
    touchStart.current = null;
  };

  return (
    <>
      <style>{`
        .alb-root {
          position: fixed;
          inset: 0;
          z-index: 1000;
          background: #000;
          display: flex;
          flex-direction: column;
          animation: lbFadeIn 0.25s ease;
        }
        @keyframes lbFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Header bar */
        .alb-header {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 10;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          background: linear-gradient(to bottom, rgba(0,0,0,0.7), transparent);
        }

        /* Main area */
        .alb-main {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 380px;
          overflow: hidden;
        }
        .alb-main.panel-closed {
          grid-template-columns: 1fr 0;
        }

        /* Image pane */
        .alb-img-pane {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .alb-img-pane img {
          max-width: 100%;
          max-height: 100vh;
          object-fit: contain;
          display: block;
          user-select: none;
          -webkit-user-drag: none;
        }

        /* Nav arrows */
        .alb-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: #fff;
          width: 44px;
          height: 44px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          transition: background 0.18s;
          z-index: 5;
        }
        .alb-arrow:hover { background: rgba(201,169,110,0.25); border-color: rgba(201,169,110,0.5); }
        .alb-arrow.prev { left: 16px; }
        .alb-arrow.next { right: 16px; }

        /* Thumbnail strip */
        .alb-thumbs {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          gap: 6px;
          z-index: 5;
        }
        .alb-thumb {
          width: 40px;
          height: 40px;
          border-radius: 2px;
          overflow: hidden;
          border: 2px solid transparent;
          cursor: pointer;
          transition: border-color 0.18s;
          flex-shrink: 0;
        }
        .alb-thumb.active { border-color: #c9a96e; }
        .alb-thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }

        /* Info panel */
        .alb-panel {
          background: #0d0d0d;
          border-left: 1px solid rgba(255,255,255,0.06);
          overflow-y: auto;
          padding: 80px 28px 40px;
          transition: width 0.3s ease;
          scrollbar-width: thin;
          scrollbar-color: rgba(201,169,110,0.2) transparent;
        }
        .alb-panel::-webkit-scrollbar { width: 4px; }
        .alb-panel::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.2); border-radius: 2px; }

        /* Toggle panel button */
        .alb-panel-toggle {
          position: absolute;
          bottom: 20px;
          right: 20px;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(245,240,232,0.5);
          padding: 6px 14px;
          border-radius: 20px;
          cursor: pointer;
          z-index: 5;
          transition: background 0.18s;
        }
        .alb-panel-toggle:hover { background: rgba(201,169,110,0.15); }

        .alb-prompts { display: flex; flex-direction: column; gap: 22px; }

        /* Counter */
        .alb-counter {
          display: flex;
          gap: 6px;
          align-items: center;
        }
        .alb-dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: rgba(245,240,232,0.25);
          transition: background 0.18s, transform 0.18s;
        }
        .alb-dot.active { background: #c9a96e; transform: scale(1.3); }

        /* ── Mobile ── */
        @media (max-width: 767px) {
          .alb-main {
            grid-template-columns: 1fr !important;
            flex-direction: column;
          }
          .alb-panel {
            display: none;
          }
          .alb-img-pane {
            height: 100vh;
          }
          .alb-header { padding: 16px; }
          .alb-arrow { display: none; }
          .alb-panel-toggle { display: none; }

          /* Mobile slide-up info */
          .alb-mobile-info {
            display: flex !important;
          }
        }

        @media (min-width: 768px) {
          .alb-mobile-info { display: none !important; }
        }

        .alb-mobile-info {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          display: none;
          flex-direction: column;
          background: linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%);
          padding: 40px 20px 24px;
          z-index: 5;
        }
      `}</style>

      <div
        className="alb-root"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Header */}
        <div className="alb-header">
          <div className="alb-counter">
            {artists.map((_, i) => (
              <div
                key={i}
                className={`alb-dot${i === current ? ' active' : ''}`}
                onClick={() => setCurrent(i)}
                style={{ cursor: 'pointer' }}
              />
            ))}
          </div>

          <p style={{
            fontFamily: fontUI,
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(245,240,232,0.4)',
            margin: 0,
          }}>
            {current + 1} / {artists.length}
          </p>

          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(245,240,232,0.7)',
              fontSize: 24,
              cursor: 'pointer',
              padding: '0 4px',
              lineHeight: 1,
              fontFamily: fontUI,
            }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {/* Main area */}
        <div className={`alb-main${panelOpen ? '' : ' panel-closed'}`}>

          {/* Image/Video pane */}
          <div className="alb-img-pane">

            {/* Media tab switcher — only shown when artist has video */}
            {hasVideo && (
              <div style={{
                position: 'absolute', top: 16, left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex', gap: 2,
                background: 'rgba(0,0,0,0.55)',
                backdropFilter: 'blur(8px)',
                borderRadius: 20, padding: '3px',
                zIndex: 10,
              }}>
                {['images', 'video'].map(tab => (
                  <button key={tab} onClick={() => setMediaTab(tab)} style={{
                    fontFamily: fontUI,
                    fontSize: 9, fontWeight: 700,
                    letterSpacing: '0.14em', textTransform: 'uppercase',
                    padding: '5px 14px', borderRadius: 18, border: 'none',
                    cursor: 'pointer',
                    background: mediaTab === tab ? '#c9a96e' : 'transparent',
                    color: mediaTab === tab ? '#0d0d0d' : 'rgba(245,240,232,0.55)',
                    transition: 'background 0.18s, color 0.18s',
                  }}>
                    {tab === 'video' ? '▶ Video' : '⊞ Photos'}
                  </button>
                ))}
              </div>
            )}

            {mediaTab === 'images' ? (
              <img
                key={`${artist.id}-${imgIdx}`}
                src={allImgs[imgIdx] || artist.image}
                alt={artist.name}
                draggable={false}
              />
            ) : (
              <div style={{
                width: '100%', maxWidth: 640,
                padding: '70px 24px 24px',
              }}>
                <VideoEmbed
                  videoUrl={artist.videoUrl}
                  fontUI={fontUI}
                  artistName={artist.name}
                />
              </div>
            )}

            {/* Prev/Next arrows — images only */}
            {mediaTab === 'images' && (
              <>
                <button className="alb-arrow prev" onClick={prev} aria-label="Previous artist">‹</button>
                <button className="alb-arrow next" onClick={next} aria-label="Next artist">›</button>
              </>
            )}

            {/* Thumbnail strip */}
            {mediaTab === 'images' && allImgs.length > 1 && (
              <div className="alb-thumbs">
                {allImgs.map((url, i) => (
                  <div
                    key={i}
                    className={`alb-thumb${i === imgIdx ? ' active' : ''}`}
                    onClick={() => setImgIdx(i)}
                  >
                    <img src={url} alt="" />
                  </div>
                ))}
              </div>
            )}

            {/* Panel toggle */}
            <button
              className="alb-panel-toggle"
              style={{ fontFamily: fontUI, fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase' }}
              onClick={() => setPanelOpen(o => !o)}
            >
              {panelOpen ? 'Hide info' : 'Show info'}
            </button>

            {/* Mobile info strip */}
            <div className="alb-mobile-info">
              <p style={{
                fontFamily: fontUI, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#c9a96e', margin: '0 0 6px',
              }}>
                {artist.category} · {artist.location}
              </p>
              <p style={{
                fontFamily: fontDisplay, fontSize: 24, fontWeight: 400,
                color: '#f5f0e8', margin: 0, lineHeight: 1.1,
              }}>
                {artist.name}
              </p>
            </div>
          </div>

          {/* Info panel (desktop) */}
          {panelOpen && (
            <div className="alb-panel">
              <p style={{
                fontFamily: fontUI,
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: '#c9a96e',
                margin: '0 0 10px',
              }}>
                {artist.category}
              </p>

              <h2 style={{
                fontFamily: fontDisplay,
                fontSize: 'clamp(26px, 3vw, 36px)',
                fontWeight: 400,
                color: '#f5f0e8',
                margin: '0 0 4px',
                lineHeight: 1.05,
              }}>
                {artist.name}
              </h2>

              <p style={{
                fontFamily: fontUI,
                fontSize: 11,
                color: 'rgba(245,240,232,0.4)',
                margin: '0 0 24px',
                letterSpacing: '0.06em',
              }}>
                {artist.location}
              </p>

              <div style={{
                borderLeft: '2px solid #c9a96e',
                paddingLeft: 16,
                marginBottom: 32,
              }}>
                <p style={{
                  fontFamily: fontDisplay,
                  fontSize: 15,
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'rgba(245,240,232,0.7)',
                  margin: 0,
                  lineHeight: 1.6,
                }}>
                  "{artist.quote}"
                </p>
              </div>

              <div className="alb-prompts">
                {Object.entries(artist.microPrompts || {}).map(([key, val]) => (
                  <div key={key}>
                    <p style={{
                      fontFamily: fontUI,
                      fontSize: 9,
                      fontWeight: 700,
                      letterSpacing: '0.18em',
                      textTransform: 'uppercase',
                      color: '#c9a96e',
                      margin: '0 0 6px',
                    }}>
                      {MICRO_LABELS[key] || key}
                    </p>
                    <p style={{
                      fontFamily: fontUI,
                      fontSize: 13,
                      fontWeight: 300,
                      color: 'rgba(245,240,232,0.6)',
                      margin: 0,
                      lineHeight: 1.65,
                    }}>
                      {val}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
