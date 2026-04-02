// ─── src/components/seo/AuditScoreRing.jsx ───────────────────────────────────
// SVG ring that animates on mount to show an audit score 0-100.
// No external dependencies.
//
// Props:
//   score       number   0-100
//   size        number   outer SVG width/height (default 120)
//   strokeWidth number   ring thickness (default 10)

import { useEffect, useRef } from 'react';
import { scoreLabel, scoreColor } from '../../services/websiteAuditService';

export default function AuditScoreRing({ score = 0, size = 120, strokeWidth = 10 }) {
  const arcRef = useRef(null);

  const radius      = (size - strokeWidth) / 2;
  const circumf     = 2 * Math.PI * radius;
  const cx          = size / 2;
  const cy          = size / 2;
  const color       = scoreColor(score);
  const label       = scoreLabel(score);
  const fontSize    = Math.round(size * 0.22);
  const labelSize   = Math.round(size * 0.11);

  // Target dashoffset (arc ends at score%)
  const targetOffset = circumf - (score / 100) * circumf;

  useEffect(() => {
    const arc = arcRef.current;
    if (!arc) return;

    // Start from full offset (no arc) then animate to target
    arc.style.strokeDashoffset = String(circumf);
    arc.style.transition = 'none';

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        arc.style.transition = 'stroke-dashoffset 900ms cubic-bezier(0.4,0,0.2,1)';
        arc.style.strokeDashoffset = String(targetOffset);
      });
    });

    return () => cancelAnimationFrame(raf);
  }, [score, circumf, targetOffset]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ display: 'block' }}
        aria-label={`Authority score: ${score} out of 100 - ${label}`}
      >
        {/* Background track */}
        <circle
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />

        {/* Score arc - starts from top (rotated -90deg) */}
        <circle
          ref={arcRef}
          cx={cx}
          cy={cy}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumf}
          strokeDashoffset={circumf}
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ willChange: 'stroke-dashoffset' }}
        />

        {/* Score number */}
        <text
          x={cx}
          y={cy - fontSize * 0.1}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#171717"
          fontSize={fontSize}
          fontFamily="'Cormorant Garamond', Georgia, serif"
          fontWeight="600"
        >
          {score}
        </text>

        {/* /100 subscript */}
        <text
          x={cx}
          y={cy + fontSize * 0.6}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#9ca3af"
          fontSize={Math.round(fontSize * 0.55)}
          fontFamily="Inter, sans-serif"
        >
          /100
        </text>
      </svg>

      {/* Label below ring */}
      <span style={{
        fontSize:   labelSize,
        fontWeight: 600,
        color,
        fontFamily: 'Inter, sans-serif',
        letterSpacing: '0.04em',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </div>
  );
}
