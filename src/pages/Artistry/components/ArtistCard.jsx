import { useState } from 'react';
import { getEmbedInfo } from './VideoEmbed';

export default function ArtistCard({ artist, fontDisplay, fontUI, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <style>{`
        .ac-card {
          break-inside: avoid;
          margin-bottom: 16px;
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          cursor: pointer;
          background: #111;
          display: block;
          aspect-ratio: 3 / 4;
        }
        .ac-card img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
          transition: transform 0.7s ease;
        }
        .ac-card:hover img { transform: scale(1.06); }

        .ac-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.88) 0%, rgba(0,0,0,0.2) 50%, transparent 100%);
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          padding: 20px 18px;
          opacity: 0;
          transition: opacity 0.3s ease;
        }
        .ac-card:hover .ac-overlay,
        .ac-card:focus .ac-overlay { opacity: 1; }

        /* Always show bottom info on mobile (no hover) */
        .ac-info-always {
          position: absolute;
          bottom: 0; left: 0; right: 0;
          background: linear-gradient(to top, rgba(0,0,0,0.75) 0%, transparent 100%);
          padding: 28px 14px 14px;
        }

        @media (hover: hover) {
          .ac-info-always { display: none; }
        }
        @media (hover: none) {
          .ac-overlay { display: none; }
        }

        @media (max-width: 767px) {
          .ac-card { margin-bottom: 10px; }
        }
      `}</style>

      <div
        className="ac-card"
        style={{}}
        onClick={() => onClick && onClick(artist)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && onClick && onClick(artist)}
        aria-label={`View ${artist.name}`}
      >
        <img src={artist.image} alt={artist.name} loading="lazy" />

        {/* Video badge, top-right, shown when artist has video */}
        {getEmbedInfo(artist.videoUrl) && (
          <div style={{
            position: 'absolute', top: 10, right: 10,
            background: 'rgba(0,0,0,0.6)',
            backdropFilter: 'blur(6px)',
            border: '1px solid rgba(201,169,110,0.4)',
            borderRadius: 12,
            padding: '3px 9px',
            display: 'flex', alignItems: 'center', gap: 4,
            zIndex: 3,
          }}>
            <span style={{ color: '#c9a96e', fontSize: 8 }}>▶</span>
            <span style={{
              fontFamily: fontUI,
              fontSize: 7, fontWeight: 700,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: '#c9a96e',
            }}>
              {artist.videoUrl?.includes('tiktok') ? 'TikTok'
               : artist.videoUrl?.includes('instagram') ? 'Reel'
               : 'Video'}
            </span>
          </div>
        )}

        {/* Hover overlay (desktop) */}
        <div className="ac-overlay">
          <p style={{
            fontFamily: fontUI,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: '#c9a96e',
            margin: '0 0 6px',
          }}>
            {artist.category}
          </p>
          <p style={{
            fontFamily: fontDisplay,
            fontSize: 'clamp(17px, 2.5vw, 22px)',
            fontWeight: 400,
            color: '#f5f0e8',
            margin: '0 0 4px',
            lineHeight: 1.1,
          }}>
            {artist.name}
          </p>
          <p style={{
            fontFamily: fontUI,
            fontSize: 11,
            fontWeight: 300,
            color: 'rgba(245,240,232,0.55)',
            margin: '0 0 12px',
          }}>
            {artist.location}
          </p>
          <p style={{
            fontFamily: fontUI,
            fontSize: 11,
            fontWeight: 300,
            fontStyle: 'italic',
            color: 'rgba(245,240,232,0.7)',
            margin: 0,
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}>
            "{artist.quote}"
          </p>
        </div>

        {/* Always-visible bottom info (touch devices) */}
        <div className="ac-info-always">
          <p style={{
            fontFamily: fontUI,
            fontSize: 8,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#c9a96e',
            margin: '0 0 3px',
          }}>
            {artist.category}
          </p>
          <p style={{
            fontFamily: fontDisplay,
            fontSize: 16,
            fontWeight: 400,
            color: '#f5f0e8',
            margin: 0,
            lineHeight: 1.1,
          }}>
            {artist.name}
          </p>
        </div>
      </div>
    </>
  );
}
