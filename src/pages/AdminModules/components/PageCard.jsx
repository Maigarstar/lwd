/**
 * PageCard.jsx
 * Single page thumbnail card in the PageGrid.
 * Shows: thumbnail image, page number, source type badge, delete button.
 */

import { useState } from 'react';

const GOLD = '#C9A84C';
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const SOURCE_COLORS = {
  pdf:      { label: 'PDF',      color: '#60a5fa', bg: 'rgba(96,165,250,0.12)'  },
  jpeg:     { label: 'JPEG',     color: GOLD,      bg: 'rgba(201,168,76,0.12)'  },
  template: { label: 'Template', color: '#a78bfa', bg: 'rgba(167,139,250,0.12)' },
};

/**
 * @param {Object}   props
 * @param {Object}   props.page         - magazine_issue_pages row
 * @param {function} [props.onDelete]   - Called with (page) to confirm delete
 * @param {boolean}  [props.selected]   - Highlight as selected
 * @param {function} [props.onClick]    - Called on card click
 */
export default function PageCard({ page, onDelete, selected, onClick }) {
  const [hovered, setHovered] = useState(false);

  const src    = page.source_type || 'pdf';
  const badge  = SOURCE_COLORS[src] || SOURCE_COLORS.pdf;

  return (
    <div
      onClick={() => onClick?.(page)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 4,
        border: `1px solid ${selected ? GOLD : hovered ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.08)'}`,
        overflow: 'hidden',
        background: '#111',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'border-color 0.15s',
        boxShadow: selected ? `0 0 0 1px ${GOLD}` : 'none',
      }}
    >
      {/* Thumbnail */}
      <div style={{ position: 'relative', paddingBottom: '141.4%' /* A4 ratio */ }}>
        {page.thumbnail_url ? (
          <img
            src={page.thumbnail_url}
            alt={`Page ${page.page_number}`}
            loading="lazy"
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', display: 'block',
            }}
          />
        ) : (
          <div style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: '#1a1a18', color: 'rgba(255,255,255,0.2)', fontSize: 24,
          }}>
            📄
          </div>
        )}

        {/* Source badge */}
        <div style={{
          position: 'absolute', top: 5, left: 5,
          fontFamily: NU, fontSize: 8, fontWeight: 700, letterSpacing: '0.06em',
          textTransform: 'uppercase', color: badge.color, background: badge.bg,
          borderRadius: 3, padding: '2px 5px',
        }}>
          {badge.label}
        </div>

        {/* Delete button — visible on hover */}
        {onDelete && hovered && (
          <button
            onClick={e => { e.stopPropagation(); onDelete(page); }}
            style={{
              position: 'absolute', top: 5, right: 5,
              background: 'rgba(248,113,113,0.15)', border: '1px solid rgba(248,113,113,0.4)',
              borderRadius: 3, color: '#f87171', fontFamily: NU, fontSize: 10,
              padding: '2px 6px', cursor: 'pointer', fontWeight: 700,
            }}
          >
            ✕
          </button>
        )}
      </div>

      {/* Page number footer */}
      <div style={{
        padding: '5px 6px',
        background: 'rgba(0,0,0,0.6)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          {page.page_number}
        </span>
        {page.width && page.height && (
          <span style={{ fontFamily: NU, fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>
            {page.width}×{page.height}
          </span>
        )}
      </div>
    </div>
  );
}
