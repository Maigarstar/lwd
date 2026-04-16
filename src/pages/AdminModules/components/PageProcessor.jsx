/**
 * PageProcessor.jsx
 * Progress indicator for PDF processing pipeline.
 * Shows phase labels, progress bar, and final state.
 */

const GOLD = '#C9A84C';
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const PHASE_LABELS = {
  loading:    'Loading PDF…',
  rendering:  'Rendering pages…',
  uploading:  'Uploading to storage…',
  done:       'Processing complete',
  error:      'Processing failed',
};

const PHASE_ICONS = {
  loading:    '⟳',
  rendering:  '⟳',
  uploading:  '⟳',
  done:       '✓',
  error:      '✕',
};

/**
 * @param {Object}  props
 * @param {Object}  props.progress - { current, total, phase, error }
 * @param {Object}  [props.style]  - Extra wrapper styles
 */
export default function PageProcessor({ progress, style = {} }) {
  if (!progress) return null;

  const { current, total, phase, error } = progress;
  const pct = total > 0 ? Math.round((current / total) * 100) : 0;
  const isDone  = phase === 'done';
  const isError = phase === 'error';
  const isActive = !isDone && !isError;

  const barColor = isError ? '#f87171' : isDone ? '#34d399' : GOLD;

  return (
    <div style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid rgba(255,255,255,0.1)`,
      borderRadius: 6,
      padding: '14px 16px',
      ...style,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            fontSize: 14,
            color: barColor,
            display: 'inline-block',
            animation: isActive ? 'spin 1s linear infinite' : 'none',
          }}>
            {PHASE_ICONS[phase] || '⟳'}
          </span>
          <span style={{ fontFamily: NU, fontSize: 12, fontWeight: 600, color: '#fff' }}>
            {PHASE_LABELS[phase] || phase}
          </span>
        </div>
        {total > 0 && (
          <span style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>
            {isDone ? `${total} pages` : `${current}/${total}`}
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div style={{
        height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
      }}>
        <div style={{
          height: '100%', borderRadius: 2,
          width: isDone ? '100%' : total > 0 ? `${pct}%` : '100%',
          background: barColor,
          transition: 'width 0.3s ease',
          animation: isActive && total === 0 ? 'shimmer 1.5s ease-in-out infinite' : 'none',
        }} />
      </div>

      {/* Error message */}
      {isError && error && (
        <div style={{ fontFamily: NU, fontSize: 11, color: '#f87171', marginTop: 8 }}>
          {error}
        </div>
      )}

      {/* Phase detail */}
      {!isError && total > 0 && !isDone && (
        <div style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 6 }}>
          {phase === 'rendering' && `Rendering page ${current + 1} of ${total}…`}
          {phase === 'uploading' && `Uploading page ${current} of ${total}…`}
        </div>
      )}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes shimmer {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1;   }
        }
      `}</style>
    </div>
  );
}
