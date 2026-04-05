import React from 'react';

// ── FONTS ───────────────────────────────────────────────────────────────
export const FU = '"Crimson Text", serif';  // Utility font: titles, labels
export const FD = '"Dosis", sans-serif';    // Display font: body text

// ── THEME VARS ──────────────────────────────────────────────────────────
export const themeVars = (light = false) => {
  const GOLD = '#c9a96e';
  return {
    '--s-bg':          light ? '#faf8f4' : '#0f0f0d',
    '--s-surface':     light ? '#faf8f4' : '#161614',
    '--s-surface-up':  light ? '#f5f0e8' : '#1e1e1b',
    '--s-border':      light ? 'rgba(20,17,10,0.08)' : 'rgba(245,240,232,0.07)',
    '--s-border-mid':  light ? 'rgba(20,17,10,0.14)' : 'rgba(245,240,232,0.12)',
    '--s-text':        light ? '#1a1208' : '#f5f0e8',
    '--s-muted':       light ? 'rgba(20,17,10,0.45)' : 'rgba(245,240,232,0.45)',
    '--s-faint':       light ? 'rgba(20,17,10,0.2)' : 'rgba(245,240,232,0.2)',
    '--s-input-bg':    light ? 'rgba(20,17,10,0.04)' : 'rgba(245,240,232,0.04)',
    '--s-input-border': light ? 'rgba(20,17,10,0.1)' : 'rgba(245,240,232,0.1)',
    '--s-gold':        GOLD,
    '--s-error':       '#e05555',
    '--s-warn':        '#d4a843',
    '--s-success':     '#5aaa78',
  };
};

// ── GET CURRENT THEME (read CSS vars) ──────────────────────────────────
export const getS = (lightMode = false) => {
  const GOLD = '#c9a96e';
  return {
    bg:          lightMode ? '#faf8f4' : '#0f0f0d',
    surface:     lightMode ? '#faf8f4' : '#161614',
    surfaceUp:   lightMode ? '#f5f0e8' : '#1e1e1b',
    border:      lightMode ? 'rgba(20,17,10,0.08)' : 'rgba(245,240,232,0.07)',
    borderMid:   lightMode ? 'rgba(20,17,10,0.14)' : 'rgba(245,240,232,0.12)',
    text:        lightMode ? '#1a1208' : '#f5f0e8',
    muted:       lightMode ? 'rgba(20,17,10,0.45)' : 'rgba(245,240,232,0.45)',
    faint:       lightMode ? 'rgba(20,17,10,0.2)' : 'rgba(245,240,232,0.2)',
    inputBg:     lightMode ? 'rgba(20,17,10,0.04)' : 'rgba(245,240,232,0.04)',
    inputBorder: lightMode ? 'rgba(20,17,10,0.1)' : 'rgba(245,240,232,0.1)',
    success:     '#5aaa78',
  };
};

// ── DARK MODE SYSTEM ────────────────────────────────────────────────────
export const DARK_S = getS(false);  // Always-dark theme for editor

// ── TONE OPTIONS (Taigenic presets) ─────────────────────────────────────
export const TONE_OPTIONS = [
  'Luxury Editorial',
  'Romantic',
  'Modern Luxury',
  'Classic',
  'Destination-Focused',
];

export const TONE_PRESETS = [
  { key: 'editorial', label: 'Editorial', desc: 'Authoritative, refined' },
  { key: 'romantic', label: 'Romantic', desc: 'Emotional, intimate' },
  { key: 'modern-luxury', label: 'Modern Luxury', desc: 'Contemporary, aspirational' },
  { key: 'classic', label: 'Classic', desc: 'Timeless, sophisticated' },
  { key: 'destination-focused', label: 'Destination', desc: 'Place-centric, discovery' },
];

// ── WORD COUNT / READING TIME ──────────────────────────────────────────
export const computeWordCount = (content = []) => {
  if (!Array.isArray(content)) return 0;
  return content.reduce((sum, block) => {
    if (block.text) {
      return sum + block.text.split(/\s+/).filter(w => w).length;
    }
    return sum;
  }, 0);
};

export const computeReadingTime = (wordCount) => {
  const wpm = 200; // words per minute
  return Math.max(1, Math.ceil(wordCount / wpm));
};

// ── COMPUTE STATUSES ──────────────────────────────────────────────────
export const computeStatuses = (post) => {
  const statuses = [];
  if (post.published) statuses.push('Published');
  if (post.isFeatured) statuses.push('Featured');
  if (post.homepageFeature) statuses.push('Homepage');
  if (post.editorsChoice) statuses.push("Editor's Pick");
  if (post.trending) statuses.push('Trending');
  return statuses;
};

// ── UI COMPONENTS ──────────────────────────────────────────────────────
export const StatusBadge = ({ status, color = '#818cf8' }) => (
  <span style={{
    display: 'inline-block',
    fontSize: 10,
    fontWeight: 600,
    padding: '3px 8px',
    borderRadius: 3,
    background: `${color}18`,
    border: `1px solid ${color}40`,
    color: color,
    fontFamily: FU,
  }}>
    {status}
  </span>
);

export const GoldBtn = ({ small, children, onClick, style, disabled, ...props }) => (
  <button onClick={onClick} disabled={disabled} style={{
    padding: small ? '6px 12px' : '10px 16px',
    background: `linear-gradient(135deg, #c9a96e, #b8922f)`,
    border: 'none',
    color: '#1a1208',
    fontFamily: FU,
    fontSize: small ? 10 : 12,
    fontWeight: 700,
    letterSpacing: '0.1em',
    borderRadius: 3,
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    ...style,
  }} {...props}>
    {children}
  </button>
);

export const GhostBtn = ({ small, children, onClick, style, ...props }) => (
  <button onClick={onClick} style={{
    padding: small ? '6px 12px' : '10px 16px',
    background: 'none',
    border: `1px solid rgba(201,169,110,0.3)`,
    color: 'rgba(245,240,232,0.6)',
    fontFamily: FU,
    fontSize: small ? 10 : 12,
    fontWeight: 600,
    letterSpacing: '0.08em',
    borderRadius: 3,
    cursor: 'pointer',
    ...style,
  }} {...props}>
    {children}
  </button>
);

export const Input = ({ value, onChange, placeholder, type = 'text', ...props }) => (
  <input
    type={type}
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    style={{
      width: '100%',
      boxSizing: 'border-box',
      padding: '8px 10px',
      background: 'rgba(245,240,232,0.04)',
      border: '1px solid rgba(245,240,232,0.1)',
      color: '#f5f0e8',
      fontFamily: FU,
      fontSize: 12,
      borderRadius: 2,
      outline: 'none',
    }}
    {...props}
  />
);

export const Textarea = ({ value, onChange, placeholder, rows = 4, ...props }) => (
  <textarea
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    placeholder={placeholder}
    rows={rows}
    style={{
      width: '100%',
      boxSizing: 'border-box',
      padding: '8px 10px',
      background: 'rgba(245,240,232,0.04)',
      border: '1px solid rgba(245,240,232,0.1)',
      color: '#f5f0e8',
      fontFamily: FU,
      fontSize: 12,
      borderRadius: 2,
      outline: 'none',
      resize: 'vertical',
      lineHeight: 1.5,
    }}
    {...props}
  />
);

export const Select = ({ value, onChange, options, ...props }) => (
  <select
    value={value || ''}
    onChange={e => onChange(e.target.value)}
    style={{
      width: '100%',
      boxSizing: 'border-box',
      padding: '7px 9px',
      background: 'rgba(245,240,232,0.04)',
      border: '1px solid rgba(245,240,232,0.1)',
      color: '#f5f0e8',
      fontFamily: FU,
      fontSize: 12,
      borderRadius: 2,
      outline: 'none',
      cursor: 'pointer',
    }}
    {...props}
  >
    {options?.map(opt => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

export const Toggle = ({ checked, onChange, ...props }) => (
  <input
    type="checkbox"
    checked={checked}
    onChange={e => onChange(e.target.checked)}
    style={{ accentColor: '#c9a96e', cursor: 'pointer' }}
    {...props}
  />
);

export const Field = ({ label, children, right }) => (
  <div>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
      <label style={{
        fontFamily: FU,
        fontSize: 9,
        fontWeight: 600,
        letterSpacing: '0.12em',
        textTransform: 'uppercase',
        color: 'rgba(245,240,232,0.45)',
      }}>
        {label}
      </label>
      {right && <span style={{ fontSize: 9, color: 'rgba(245,240,232,0.2)' }}>{right}</span>}
    </div>
    {children}
  </div>
);

export const Divider = () => (
  <div style={{ height: '1px', background: 'rgba(245,240,232,0.07)', margin: '16px 0' }} />
);

export const SectionLabel = ({ children }) => (
  <div style={{
    fontFamily: FU,
    fontSize: 8,
    fontWeight: 600,
    letterSpacing: '0.18em',
    textTransform: 'uppercase',
    color: '#c9a96e',
    marginBottom: 12,
  }}>
    {children}
  </div>
);
