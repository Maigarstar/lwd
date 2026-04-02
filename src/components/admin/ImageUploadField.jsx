// ─── ImageUploadField.jsx ─────────────────────────────────────────────────────
// Admin image upload component with URL input + preview.
// Props: value, onChange, bucket, folder, hint, palette, previewHeight
// ─────────────────────────────────────────────────────────────────────────────
import { useRef } from 'react';

const NU = 'var(--font-body)';

export default function ImageUploadField({
  value = '',
  onChange,
  hint,
  palette,
  previewHeight = 120,
  label,
}) {
  const C       = palette || {};
  const bg      = C.surface || C.bg || '#111110';
  const border  = C.border  || '#2a2a26';
  const text    = C.text    || '#f5f0e8';
  const muted   = C.muted   || 'rgba(245,240,232,0.55)';
  const gold    = C.accent  || '#C9A84C';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {label && (
        <p style={{ fontFamily: NU, fontSize: 11, fontWeight: 600, color: muted, margin: 0, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </p>
      )}

      {/* URL input */}
      <input
        type="text"
        value={value}
        onChange={e => onChange?.(e.target.value)}
        placeholder="Paste image URL…"
        style={{
          background: bg, border: `1px solid ${border}`,
          color: text, fontFamily: NU, fontSize: 13,
          padding: '8px 12px', borderRadius: 4, width: '100%',
          outline: 'none', boxSizing: 'border-box',
        }}
        onFocus={e => (e.currentTarget.style.borderColor = gold)}
        onBlur={e  => (e.currentTarget.style.borderColor = border)}
      />

      {/* Preview */}
      {value && (
        <div style={{
          position: 'relative', height: previewHeight,
          borderRadius: 4, overflow: 'hidden',
          background: '#000', border: `1px solid ${border}`,
        }}>
          <img
            src={value} alt="Preview"
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
          <button
            onClick={() => onChange?.('')}
            title="Remove"
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.6)', border: 'none',
              color: '#fff', borderRadius: '50%',
              width: 24, height: 24, cursor: 'pointer',
              fontFamily: NU, fontSize: 12, lineHeight: 1,
            }}
          >✕</button>
        </div>
      )}

      {/* Hint */}
      {hint && (
        <p style={{ fontFamily: NU, fontSize: 11, color: muted, margin: 0, lineHeight: 1.5 }}>
          {hint}
        </p>
      )}
    </div>
  );
}
