// Shared design tokens, helpers, and form components for Magazine Studio
import { useEffect, useRef } from 'react';

const DARK_S = {
  bg:          '#0f0f0d',
  surface:     '#161614',
  surfaceUp:   '#1e1e1b',
  border:      'rgba(245,240,232,0.07)',
  borderMid:   'rgba(245,240,232,0.12)',
  text:        '#f5f0e8',
  muted:       'rgba(245,240,232,0.45)',
  faint:       'rgba(245,240,232,0.2)',
  inputBg:     'rgba(245,240,232,0.04)',
  inputBorder: 'rgba(245,240,232,0.1)',
  gold:        '#c9a96e',
  error:       '#e05555',
  warn:        '#d4a843',
  success:     '#5aaa78',
  info:        '#5b9bd5',
  purple:      '#a78bc4',
};

const LIGHT_S = {
  bg:          '#f5f0e8',
  surface:     '#fafaf8',
  surfaceUp:   '#ffffff',
  border:      'rgba(30,28,22,0.08)',
  borderMid:   'rgba(30,28,22,0.14)',
  text:        '#1a1806',
  muted:       'rgba(30,28,22,0.5)',
  faint:       'rgba(30,28,22,0.25)',
  inputBg:     'rgba(30,28,22,0.04)',
  inputBorder: 'rgba(30,28,22,0.12)',
  gold:        '#b8943e',
  error:       '#cc3333',
  warn:        '#b8860b',
  success:     '#3d8b56',
  info:        '#3a7ab8',
  purple:      '#7b5fa8',
};

export const S = DARK_S; // default dark, backwards compat
export function getS(isLight) { return isLight ? LIGHT_S : DARK_S; }
export { LIGHT_S, DARK_S };

/**
 * Returns inline style object with CSS custom properties set to the given theme.
 * Apply to any wrapper div to make all StudioShared children theme-aware.
 */
export function themeVars(isLight) {
  const t = isLight ? LIGHT_S : DARK_S;
  return {
    '--s-bg':           t.bg,
    '--s-surface':      t.surface,
    '--s-surface-up':   t.surfaceUp,
    '--s-border':       t.border,
    '--s-border-mid':   t.borderMid,
    '--s-text':         t.text,
    '--s-muted':        t.muted,
    '--s-faint':        t.faint,
    '--s-input-bg':     t.inputBg,
    '--s-input-border': t.inputBorder,
    '--s-gold':         t.gold,
    '--s-error':        t.error,
    '--s-warn':         t.warn,
    '--s-success':      t.success,
    '--s-info':         t.info,
    '--s-purple':       t.purple,
  };
}

export const FU = "'Inter', 'Helvetica Neue', sans-serif";
export const FD = "'Cormorant Garamond', 'Playfair Display', Georgia, serif";

export const TONE_OPTIONS = [
  'Luxury Editorial',
  'Vogue Style',
  'Tatler Style',
  'Travel Luxe',
  'Wedding Romance',
  'Fashion Editorial',
  'Elegant Sales',
  'Soft Informative',
  'SEO Optimised Luxury',
  'Custom Brand Voice',
];

// ── Article status computation ─────────────────────────────────────────────────
export function computeWordCount(content = []) {
  return content.reduce((total, block) => {
    const text = [block.text, block.body, block.tip, block.standfirst]
      .filter(Boolean).join(' ');
    return total + text.split(/\s+/).filter(Boolean).length;
  }, 0);
}

export function computeReadingTime(wordCount) {
  return Math.max(1, Math.round(wordCount / 200));
}

export function computeStatuses(post) {
  const wc = computeWordCount(post.content);
  const statuses = [];
  if (post.published) statuses.push({ label: 'Published', color: S.success });
  else if (post.scheduledDate && new Date(post.scheduledDate) > new Date())
    statuses.push({ label: 'Scheduled', color: S.info });
  else statuses.push({ label: 'Draft', color: S.faint });
  if (post.featured)       statuses.push({ label: 'Featured',        color: S.gold });
  if (post.editorsChoice)  statuses.push({ label: "Editor's Choice", color: S.purple });
  const needsSEO = !post.excerpt || !post.seoTitle || !post.metaDescription;
  if (needsSEO) statuses.push({ label: 'Needs SEO', color: S.warn });
  if (wc < 300 && (post.content || []).length > 0)
    statuses.push({ label: 'Thin Content', color: S.error });
  return statuses;
}

// ── Form components ────────────────────────────────────────────────────────────
// Uses CSS custom properties so any ancestor can override for light/dark theme.
// Dark defaults are the fallback values; set --s-* on a wrapper to override.
const baseInput = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
  border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))',
  color: 'var(--s-text, #f5f0e8)',
  fontFamily: FU, fontSize: 12,
  padding: '8px 10px', borderRadius: 2, outline: 'none',
  transition: 'border-color 0.15s',
};

export function Field({ label, children, hint, row = false }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && (
        <label style={{
          display: 'block', fontFamily: FU, fontSize: 9, fontWeight: 700,
          letterSpacing: '0.14em', textTransform: 'uppercase',
          color: 'var(--s-gold, #c9a96e)', marginBottom: 5,
        }}>
          {label}
        </label>
      )}
      {row
        ? <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{children}</div>
        : children
      }
      {hint && (
        <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-muted, rgba(245,240,232,0.45))', marginTop: 3, lineHeight: 1.4 }}>
          {hint}
        </div>
      )}
    </div>
  );
}

export function Input({ value, onChange, placeholder, type = 'text', style: sx, disabled }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
      disabled={disabled}
      style={{ ...baseInput, ...sx, opacity: disabled ? 0.5 : 1 }}
      onFocus={e => { if (!disabled) e.target.style.borderColor = 'var(--s-gold, #c9a96e)'; }}
      onBlur={e => e.target.style.borderColor = 'var(--s-input-border, rgba(245,240,232,0.1))'}
    />
  );
}

export function Textarea({ value, onChange, placeholder, minHeight = 80 }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Preserve the nearest scrollable ancestor's scroll position to prevent page jumps
    let scrollEl = el.parentElement;
    while (scrollEl && scrollEl !== document.body) {
      const { overflow, overflowY } = getComputedStyle(scrollEl);
      if (overflow === 'auto' || overflow === 'scroll' || overflowY === 'auto' || overflowY === 'scroll') break;
      scrollEl = scrollEl.parentElement;
    }
    const prevScrollTop = scrollEl ? scrollEl.scrollTop : window.scrollY;
    el.style.height = 'auto';
    el.style.height = Math.max(minHeight, el.scrollHeight) + 'px';
    if (scrollEl && scrollEl !== document.body) {
      scrollEl.scrollTop = prevScrollTop;
    } else {
      window.scrollTo({ top: prevScrollTop, behavior: 'instant' });
    }
  }, [value, minHeight]);

  return (
    <textarea
      ref={ref}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder || ''}
      style={{ ...baseInput, minHeight, resize: 'vertical', lineHeight: 1.6, overflow: 'hidden' }}
      onFocus={e => e.target.style.borderColor = 'var(--s-gold, #c9a96e)'}
      onBlur={e => e.target.style.borderColor = 'var(--s-input-border, rgba(245,240,232,0.1))'}
    />
  );
}

export function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{ ...baseInput, cursor: 'pointer' }}
    >
      {options.map(o => (
        <option key={o.value ?? o} value={o.value ?? o}>
          {o.label ?? o}
        </option>
      ))}
    </select>
  );
}

export function Toggle({ value, onChange, label }) {
  return (
    <label style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', userSelect: 'none' }}>
      <div
        onClick={() => onChange(!value)}
        style={{
          width: 30, height: 17, borderRadius: 9,
          background: value ? 'var(--s-gold, #c9a96e)' : 'var(--s-input-border, rgba(245,240,232,0.1))',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: value ? 16 : 3,
          width: 11, height: 11, borderRadius: '50%',
          background: value ? 'var(--s-bg, #0a0a0a)' : 'var(--s-muted, rgba(245,240,232,0.45))',
          transition: 'left 0.2s',
        }} />
      </div>
      {label && <span style={{ fontFamily: FU, fontSize: 11, color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>{label}</span>}
    </label>
  );
}

export function StatusBadge({ label, color }) {
  return (
    <span style={{
      fontFamily: FU, fontSize: 8, fontWeight: 700, letterSpacing: '0.12em',
      textTransform: 'uppercase', color,
      border: `1px solid ${color}50`,
      padding: '2px 6px', borderRadius: 1, flexShrink: 0,
    }}>
      {label}
    </span>
  );
}

export function Divider() {
  return <div style={{ height: 1, background: 'var(--s-border, rgba(245,240,232,0.07))', margin: '16px 0' }} />;
}

export function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em',
      textTransform: 'uppercase', color: 'var(--s-gold, #c9a96e)',
      padding: '10px 0 6px', marginBottom: 8,
    }}>
      {children}
    </div>
  );
}

// Gold action button
export function GoldBtn({ children, onClick, small, disabled, style: sx }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        fontFamily: FU, fontSize: small ? 8 : 9, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        background: 'var(--s-gold, #c9a96e)', color: 'var(--s-bg, #0a0a0a)', border: 'none',
        padding: small ? '5px 12px' : '7px 18px',
        borderRadius: 2, cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.5 : 1, transition: 'opacity 0.2s',
        whiteSpace: 'nowrap', ...sx,
      }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = 0.85; }}
      onMouseLeave={e => e.currentTarget.style.opacity = disabled ? 0.5 : 1}
    >
      {children}
    </button>
  );
}

// Ghost / outline button
export function GhostBtn({ children, onClick, small, active, color, style: sx }) {
  const c = color || 'var(--s-muted, rgba(245,240,232,0.45))';
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: FU, fontSize: small ? 8 : 9, fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        background: active ? 'color-mix(in srgb, var(--s-gold, #c9a96e) 15%, transparent)' : 'none',
        border: `1px solid ${active ? 'var(--s-gold, #c9a96e)' : 'var(--s-border, rgba(245,240,232,0.07))'}`,
        color: active ? 'var(--s-gold, #c9a96e)' : c,
        padding: small ? '4px 10px' : '6px 14px',
        borderRadius: 2, cursor: 'pointer', transition: 'all 0.15s',
        whiteSpace: 'nowrap', ...sx,
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--s-gold, #c9a96e)';
        e.currentTarget.style.color = 'var(--s-gold, #c9a96e)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = active ? 'var(--s-gold, #c9a96e)' : 'var(--s-border, rgba(245,240,232,0.07))';
        e.currentTarget.style.color = active ? 'var(--s-gold, #c9a96e)' : c;
      }}
    >
      {children}
    </button>
  );
}
