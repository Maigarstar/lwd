// ─── TemplatePicker.jsx ──────────────────────────────────────────────────────
// Full-screen modal showing all 12 templates in a filterable grid.

import { useState } from 'react';
import TEMPLATES, { CATEGORIES } from './definitions';
import TemplateCanvas from './TemplateCanvas';

const GOLD   = '#C9A84C';
const NU     = "var(--font-body, 'Nunito Sans', sans-serif)";
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const MUTED  = 'rgba(255,255,255,0.4)';
const BORDER = 'rgba(255,255,255,0.08)';

export default function TemplatePicker({ onSelect, onClose }) {
  const [activeCategory, setActiveCategory] = useState('All');
  const [hoveredId, setHoveredId]           = useState(null);

  const filtered = activeCategory === 'All'
    ? TEMPLATES
    : TEMPLATES.filter(t => t.category === activeCategory);

  const allCategories = ['All', ...CATEGORIES];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 900,
      background: 'rgba(8,7,6,0.96)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      fontFamily: NU,
    }}>

      {/* ── Header ── */}
      <div style={{
        height: 60, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 28px', gap: 16,
        background: 'rgba(14,13,11,0.9)',
      }}>
        <div style={{ fontFamily: GD, fontSize: 20, fontStyle: 'italic', color: '#fff', flex: 1 }}>
          Choose a Template
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED }}>
          {TEMPLATES.length} templates
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none', border: `1px solid ${BORDER}`,
            color: MUTED, cursor: 'pointer', fontSize: 16, lineHeight: 1,
            padding: '5px 10px', borderRadius: 3, fontFamily: NU,
          }}
          title="Close"
        >
          ×
        </button>
      </div>

      {/* ── Category filter pills ── */}
      <div style={{
        padding: '14px 28px 10px',
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', gap: 6, flexWrap: 'wrap',
        background: 'rgba(12,11,9,0.7)',
        flexShrink: 0,
      }}>
        {allCategories.map(cat => {
          const active = activeCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                fontFamily: NU, fontSize: 9, fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                padding: '4px 12px', borderRadius: 10, cursor: 'pointer',
                background: active ? 'rgba(201,168,76,0.14)' : 'none',
                border: `1px solid ${active ? GOLD : BORDER}`,
                color: active ? GOLD : MUTED,
                transition: 'all 0.15s',
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* ── Grid ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: 16,
        }}>
          {filtered.map(tpl => {
            const hov = hoveredId === tpl.id;
            return (
              <div
                key={tpl.id}
                onClick={() => onSelect(tpl)}
                onMouseEnter={() => setHoveredId(tpl.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  cursor: 'pointer',
                  borderRadius: 4,
                  border: `2px solid ${hov ? GOLD : 'rgba(255,255,255,0.1)'}`,
                  overflow: 'hidden',
                  transition: 'all 0.18s',
                  transform: hov ? 'scale(1.02)' : 'scale(1)',
                  boxShadow: hov ? `0 8px 32px rgba(201,168,76,0.18)` : '0 2px 8px rgba(0,0,0,0.4)',
                  background: '#0a0908',
                }}
              >
                {/* Aspect-ratio container for the template preview */}
                <div style={{ position: 'relative', paddingBottom: '141.4%', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'hidden' }}>
                    <TemplateCanvas
                      templateId={tpl.id}
                      fields={{}}
                      pageSize="A4"
                      width={160}
                    />
                  </div>
                </div>

                {/* Card footer */}
                <div style={{ padding: '8px 10px 10px', background: '#0f0e0c' }}>
                  <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: hov ? '#fff' : 'rgba(255,255,255,0.8)', marginBottom: 3, letterSpacing: '0.02em' }}>
                    {tpl.name}
                  </div>
                  <div style={{
                    display: 'inline-block',
                    fontFamily: NU, fontSize: 8, fontWeight: 700,
                    letterSpacing: '0.08em', textTransform: 'uppercase',
                    color: hov ? GOLD : MUTED,
                    padding: '2px 6px', borderRadius: 8,
                    border: `1px solid ${hov ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.1)'}`,
                    transition: 'all 0.15s',
                  }}>
                    {tpl.category}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
