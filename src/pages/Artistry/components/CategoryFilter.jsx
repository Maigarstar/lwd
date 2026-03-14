import { useEffect, useRef, useState } from 'react';
import { CATEGORIES } from '../data/artists';

export default function CategoryFilter({ active, onChange, fontUI }) {
  const [stuck, setStuck] = useState(false);
  const sentinel = useRef(null);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => setStuck(!e.isIntersecting),
      { threshold: 1, rootMargin: '-1px 0px 0px 0px' }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      {/* Sentinel, 1px element that sits just above the filter bar */}
      <div ref={sentinel} style={{ height: 1 }} />

      <div className="cf-wrap" style={{
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: stuck ? 'rgba(10,10,10,0.92)' : 'transparent',
        backdropFilter: stuck ? 'blur(12px)' : 'none',
        borderBottom: stuck ? '1px solid rgba(201,169,110,0.12)' : '1px solid transparent',
        transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-color 0.3s ease',
      }}>
        <style>{`
          .cf-wrap { }

          .cf-inner {
            max-width: 1200px;
            margin: 0 auto;
            padding: 16px 28px;
            display: flex;
            align-items: center;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            -webkit-overflow-scrolling: touch;
          }
          .cf-inner::-webkit-scrollbar { display: none; }

          .cf-pill {
            flex-shrink: 0;
            padding: 7px 16px;
            border-radius: 20px;
            border: 1px solid rgba(201,169,110,0.3);
            background: transparent;
            cursor: pointer;
            transition: background 0.18s, border-color 0.18s, color 0.18s;
            white-space: nowrap;
          }
          .cf-pill:hover {
            border-color: rgba(201,169,110,0.7);
          }
          .cf-pill.active {
            background: #c9a96e;
            border-color: #c9a96e;
          }

          @media (max-width: 767px) {
            .cf-inner {
              padding: 12px 16px;
              gap: 6px;
            }
            .cf-pill {
              padding: 6px 13px;
            }
          }
        `}</style>

        <div className="cf-inner">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              className={`cf-pill${active === cat ? ' active' : ''}`}
              onClick={() => onChange(cat)}
              style={{
                fontFamily: fontUI,
                fontSize: 10,
                fontWeight: active === cat ? 700 : 400,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: active === cat ? '#0d0d0d' : 'rgba(245,240,232,0.65)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
