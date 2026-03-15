// ─── PhotoGalleryGrid ─────────────────────────────────────────────────────────
// Airbnb-style 5-photo editorial grid: 1 large left + 2×2 right
// Used in venue profile hero area.
//
// data: {
//   images: [{ src, alt }]  // at least 1, up to 5
//   venueName: string       // for aria labels
//   totalCount: number      // total photo count for "See all" label
//   onViewAll: () => void   // optional
// }
// ─────────────────────────────────────────────────────────────────────────────
import { useState } from 'react';
import { useBreakpoint }          from '../../../hooks/useWindowWidth';

const GOLD  = '#C9A84C';
const RADIUS = 12;

export default function PhotoGalleryGrid({ data = {} }) {
  const { images = [], totalCount, onViewAll } = data;
  const { isMobile } = useBreakpoint();
  const [hovered, setHovered] = useState(null);

  // Pad to 5 slots
  const imgs = [...images];
  while (imgs.length < 5) imgs.push(null);
  const [img1, img2, img3, img4, img5] = imgs;

  // ── Mobile: just first image, full-width, with "See all" pill ────────────
  if (isMobile) {
    return (
      <div style={{ position: 'relative', width: '100%', height: 280, background: '#1a1a18', borderRadius: RADIUS, overflow: 'hidden' }}>
        {img1 && (
          <img
            src={img1.src} alt={img1.alt || ''}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center center', display: 'block' }}
          />
        )}
        {(totalCount || images.length > 1) && (
          <button
            onClick={onViewAll}
            style={{
              position: 'absolute', bottom: 12, right: 12,
              background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(8px)',
              border: 'none', borderRadius: 6, padding: '7px 14px',
              fontFamily: 'var(--font-body)', fontSize: 13, fontWeight: 600,
              color: '#1a1a18', cursor: 'pointer', letterSpacing: '0.03em',
              display: 'flex', alignItems: 'center', gap: 6,
            }}
          >
            <span>⊞</span>
            <span>See all {totalCount || images.length} photos</span>
          </button>
        )}
      </div>
    );
  }

  // ── Desktop: 1 large + 2×2 grid ─────────────────────────────────────────
  const imgStyle = (i, extra = {}) => ({
    width: '100%', height: '100%',
    objectFit: 'cover', objectPosition: 'center center',
    display: 'block',
    transition: 'transform 0.5s ease',
    transform: hovered === i ? 'scale(1.04)' : 'scale(1)',
    ...extra,
  });

  const cellStyle = (i, extra = {}) => ({
    position: 'relative', overflow: 'hidden',
    background: '#2a2a28', cursor: 'pointer',
    ...extra,
  });

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1.4fr 1fr',
        gridTemplateRows: '1fr 1fr',
        gap: 3,
        height: 480,
        borderRadius: RADIUS,
        overflow: 'hidden',
        background: '#111',
      }}
    >
      {/* ── Large left panel, spans both rows ─────────────────────────── */}
      <div
        style={{ ...cellStyle(0, { gridRow: '1 / 3' }) }}
        onMouseEnter={() => setHovered(0)}
        onMouseLeave={() => setHovered(null)}
      >
        {img1 && (
          <img src={img1.src} alt={img1.alt || 'Venue'} style={imgStyle(0)} />
        )}
      </div>

      {/* ── Top-right cell ─────────────────────────────────────────────── */}
      <div
        style={{
          ...cellStyle(1, {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 3,
          }),
        }}
      >
        {/* Top-right first */}
        <div
          style={cellStyle(1)}
          onMouseEnter={() => setHovered(1)}
          onMouseLeave={() => setHovered(null)}
        >
          {img2 && <img src={img2.src} alt={img2.alt || ''} style={imgStyle(1)} />}
        </div>
        {/* Top-right second */}
        <div
          style={cellStyle(2)}
          onMouseEnter={() => setHovered(2)}
          onMouseLeave={() => setHovered(null)}
        >
          {img3 && <img src={img3.src} alt={img3.alt || ''} style={imgStyle(2)} />}
        </div>
      </div>

      {/* ── Bottom-right cell ──────────────────────────────────────────── */}
      <div
        style={{
          ...cellStyle(3, {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 3,
          }),
        }}
      >
        {/* Bottom-right first */}
        <div
          style={cellStyle(3)}
          onMouseEnter={() => setHovered(3)}
          onMouseLeave={() => setHovered(null)}
        >
          {img4 && <img src={img4.src} alt={img4.alt || ''} style={imgStyle(3)} />}
        </div>

        {/* Bottom-right last, "See all" overlay */}
        <div
          style={cellStyle(4)}
          onMouseEnter={() => setHovered(4)}
          onMouseLeave={() => setHovered(null)}
          onClick={onViewAll}
        >
          {img5 && <img src={img5.src} alt={img5.alt || ''} style={imgStyle(4)} />}
          {(totalCount || images.length >= 5) && (
            <div
              style={{
                position: 'absolute', inset: 0,
                background: 'rgba(0,0,0,0.48)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                gap: 6,
                transition: 'background 0.3s',
              }}
            >
              <span style={{ fontSize: 22, color: '#fff' }}>⊞</span>
              <span style={{
                fontFamily: 'var(--font-body)', fontSize: 12, fontWeight: 700,
                color: '#fff', letterSpacing: '0.1em', textTransform: 'uppercase',
              }}>
                See all {totalCount || images.length} photos
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
