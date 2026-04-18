// ── RatingBar.jsx ─────────────────────────────────────────────────────────────
// Reusable luxury rating bar component.
// Usage: <RatingBar score={8} label="Rooms" />

import { GOLD, MUTED, NU } from './designerConstants';
import { GD } from './designerConstants';

export default function RatingBar({ label, score = 0, maxScore = 10, size = 'md', onChange }) {
  const pct = Math.max(0, Math.min(1, score / maxScore));
  const isEmpty = score === 0;

  const heights = { sm: 3, md: 5, lg: 7 };
  const fontSizes = { sm: 8, md: 9, lg: 11 };
  const trackH = heights[size] || 5;
  const labelSize = fontSizes[size] || 9;

  return (
    <div style={{ marginBottom: size === 'sm' ? 8 : 12 }}>
      {/* Label + score row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{
          fontFamily: NU,
          fontSize: labelSize,
          fontWeight: 700,
          letterSpacing: '0.08em',
          textTransform: 'uppercase',
          color: isEmpty ? 'rgba(255,255,255,0.3)' : GOLD,
        }}>
          {label}
        </span>
        <span style={{
          fontFamily: GD,
          fontSize: size === 'lg' ? 14 : 12,
          fontStyle: 'italic',
          color: isEmpty ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.85)',
        }}>
          {isEmpty ? '—' : `${score}/${maxScore}`}
        </span>
      </div>

      {/* Track */}
      <div style={{
        position: 'relative',
        width: '100%',
        height: trackH,
        background: 'rgba(255,255,255,0.08)',
        borderRadius: 2,
        overflow: 'hidden',
        cursor: onChange ? 'pointer' : 'default',
      }}
        onClick={onChange ? (e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const newScore = Math.round((x / rect.width) * maxScore);
          onChange(Math.max(1, Math.min(maxScore, newScore)));
        } : undefined}
      >
        {/* Fill */}
        <div style={{
          position: 'absolute',
          left: 0, top: 0,
          height: '100%',
          width: `${pct * 100}%`,
          background: isEmpty
            ? 'transparent'
            : `linear-gradient(90deg, ${GOLD}, rgba(201,168,76,0.8))`,
          borderRadius: 2,
          transition: 'width 0.25s ease',
        }} />
      </div>

      {/* 10 tick marks */}
      <div style={{ display: 'flex', gap: 0, marginTop: 3 }}>
        {Array.from({ length: maxScore }).map((_, i) => (
          <div
            key={i}
            onClick={onChange ? () => onChange(i + 1) : undefined}
            style={{
              flex: 1,
              height: 3,
              background: i < score ? GOLD : 'rgba(255,255,255,0.06)',
              marginRight: i < maxScore - 1 ? 2 : 0,
              borderRadius: 1,
              cursor: onChange ? 'pointer' : 'default',
              transition: 'background 0.1s',
            }}
          />
        ))}
      </div>
    </div>
  );
}
