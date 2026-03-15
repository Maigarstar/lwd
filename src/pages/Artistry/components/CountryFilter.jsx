import { useMemo } from 'react';

export default function CountryFilter({ active, onChange, artists, fontUI }) {
  const countries = useMemo(() => {
    const set = new Set(artists.map(a => a.country).filter(Boolean));
    return ['All', ...Array.from(set).sort()];
  }, [artists]);

  // Don't render if only 1 country or no countries tagged yet
  if (countries.length <= 2) return null;

  return (
    <div className="cnf-wrap" style={{ background: '#0a0a0a', paddingTop: 8 }}>
      <style>{`
        .cnf-inner {
          max-width: 1200px;
          margin: 0 auto;
          padding: 10px 28px;
          display: flex;
          align-items: center;
          gap: 6px;
          overflow-x: auto;
          scrollbar-width: none;
          -webkit-overflow-scrolling: touch;
        }
        .cnf-inner::-webkit-scrollbar { display: none; }

        .cnf-label {
          flex-shrink: 0;
          border-right: 1px solid rgba(201,169,110,0.2);
          padding-right: 12px;
          margin-right: 4px;
        }

        .cnf-pill {
          flex-shrink: 0;
          padding: 5px 14px;
          border-radius: 20px;
          border: 1px solid rgba(255,255,255,0.1);
          background: transparent;
          cursor: pointer;
          transition: background 0.18s, border-color 0.18s;
          white-space: nowrap;
        }
        .cnf-pill:hover { border-color: rgba(255,255,255,0.25); }
        .cnf-pill.active {
          background: rgba(201,169,110,0.15);
          border-color: rgba(201,169,110,0.45);
        }

        @media (max-width: 767px) {
          .cnf-inner { padding: 8px 16px; }
        }
      `}</style>

      <div className="cnf-inner">
        <span
          className="cnf-label"
          style={{
            fontFamily: fontUI,
            fontSize: 9,
            fontWeight: 700,
            letterSpacing: '0.2em',
            textTransform: 'uppercase',
            color: 'rgba(201,169,110,0.6)',
          }}
        >
          Country
        </span>

        {countries.map(c => (
          <button
            key={c}
            className={`cnf-pill${active === c ? ' active' : ''}`}
            onClick={() => onChange(c)}
            style={{
              fontFamily: fontUI,
              fontSize: 10,
              letterSpacing: '0.1em',
              color: active === c
                ? '#c9a96e'
                : 'rgba(245,240,232,0.5)',
            }}
          >
            {c}
          </button>
        ))}
      </div>
    </div>
  );
}
