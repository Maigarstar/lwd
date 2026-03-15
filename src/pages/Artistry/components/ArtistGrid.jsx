import { useMemo, useRef, useEffect, useState } from 'react';
import ArtistCard from './ArtistCard';

export default function ArtistGrid({ artists, activeCategory, activeCountry, fontDisplay, fontUI, onCardClick }) {
  const [cols, setCols] = useState(3);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setCols(w < 600 ? 1 : w < 960 ? 2 : 3);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const filtered = useMemo(() => {
    return artists.filter(a => {
      const catOk = activeCategory === 'All' || a.category === activeCategory;
      const countryOk = !activeCountry || activeCountry === 'All' || a.country === activeCountry;
      return catOk && countryOk;
    });
  }, [artists, activeCategory, activeCountry]);

  // Distribute artists into columns for balanced masonry
  const columns = useMemo(() => {
    const arr = Array.from({ length: cols }, () => []);
    filtered.forEach((a, i) => arr[i % cols].push(a));
    return arr;
  }, [filtered, cols]);

  if (filtered.length === 0) {
    return (
      <div style={{
        padding: '80px 28px',
        textAlign: 'center',
        background: '#0a0a0a',
      }}>
        <p style={{
          fontFamily: fontUI,
          fontSize: 13,
          color: 'rgba(245,240,232,0.35)',
          letterSpacing: '0.1em',
        }}>
          No artists found in this category.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .ag-section {
          background: #0a0a0a;
          padding: 40px 0 80px;
        }
        .ag-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 28px;
          display: grid;
          gap: 16px;
        }
        @media (max-width: 599px) {
          .ag-inner { grid-template-columns: 1fr; padding: 0 14px; gap: 10px; }
          .ag-section { padding: 24px 0 60px; }
        }
        @media (min-width: 600px) and (max-width: 959px) {
          .ag-inner { grid-template-columns: 1fr 1fr; }
        }
        @media (min-width: 960px) {
          .ag-inner { grid-template-columns: 1fr 1fr 1fr; }
        }
      `}</style>

      <section className="ag-section">
        <div className="ag-inner">
          {columns.map((col, ci) => (
            <div key={ci} style={{ display: 'flex', flexDirection: 'column' }}>
              {col.map(artist => (
                <ArtistCard
                  key={artist.id}
                  artist={artist}
                  fontDisplay={fontDisplay}
                  fontUI={fontUI}
                  onClick={onCardClick}
                />
              ))}
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
