/**
 * IssueDetailsForm.jsx
 * Metadata form for a magazine issue.
 * Fields: title, slug, issue_number, season, year, intro, editor_note,
 *         seo_title, seo_description, is_featured.
 */

import { useState, useEffect } from 'react';

const GOLD = '#C9A84C';
const GD   = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU   = "var(--font-body, 'Nunito Sans', sans-serif)";

const SEASONS = ['Spring', 'Summer', 'Autumn', 'Winter'];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 10 }, (_, i) => CURRENT_YEAR - 2 + i);

function Field({ label, hint, children, error }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
        <label style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {label}
        </label>
        {hint && <span style={{ fontFamily: NU, fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{hint}</span>}
      </div>
      {children}
      {error && <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 3 }}>{error}</div>}
    </div>
  );
}

function Input({ value, onChange, placeholder, disabled, type = 'text', style = {} }) {
  return (
    <input
      type={type}
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13,
        padding: '8px 10px', outline: 'none',
        opacity: disabled ? 0.5 : 1,
        ...style,
      }}
    />
  );
}

function Textarea({ value, onChange, placeholder, rows = 4 }) {
  return (
    <textarea
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      style={{
        width: '100%', boxSizing: 'border-box',
        background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13,
        padding: '8px 10px', outline: 'none', resize: 'vertical',
      }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      style={{
        width: '100%', background: 'rgba(255,255,255,0.05)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 4, color: '#fff', fontFamily: NU, fontSize: 13,
        padding: '8px 10px', outline: 'none', cursor: 'pointer',
      }}
    >
      {options.map(o => (
        <option key={o.value} value={o.value} style={{ background: '#1a1a18' }}>{o.label}</option>
      ))}
    </select>
  );
}

function Toggle({ checked, onChange, label }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
      <div
        onClick={() => onChange(!checked)}
        style={{
          width: 36, height: 20, borderRadius: 10,
          background: checked ? GOLD : 'rgba(255,255,255,0.15)',
          position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
        }}
      >
        <div style={{
          position: 'absolute', top: 3, left: checked ? 19 : 3,
          width: 14, height: 14, borderRadius: '50%', background: '#fff',
          transition: 'left 0.2s',
        }} />
      </div>
      <span style={{ fontFamily: NU, fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>{label}</span>
    </label>
  );
}

function SectionLabel({ children }) {
  return (
    <div style={{
      fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
      textTransform: 'uppercase', color: GOLD, marginBottom: 14, marginTop: 6,
    }}>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '20px 0' }} />;
}

/**
 * @param {Object} props
 * @param {Object}   props.data         - Current form data (controlled)
 * @param {function} props.onChange     - Called with (fieldName, value) on any change
 * @param {boolean}  props.slugLocked   - If true, slug field is read-only
 * @param {boolean}  props.saving       - Shows saving state
 */
export default function IssueDetailsForm({ data, onChange, slugLocked, saving }) {
  const [slugTouched, setSlugTouched] = useState(false);

  // Auto-generate slug from title if user hasn't manually edited it and slug isn't locked
  useEffect(() => {
    if (slugTouched || slugLocked || !data?.title) return;
    const auto = data.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    const year = data.year ? `-${data.year}` : '';
    onChange('slug', `${auto}${year}`);
  }, [data?.title, data?.year]);

  const f = data || {};

  return (
    <div>
      {/* ── Core metadata ── */}
      <SectionLabel>Issue Details</SectionLabel>

      <Field label="Title" hint="required">
        <Input
          value={f.title}
          onChange={v => onChange('title', v)}
          placeholder="e.g. The Grand Wedding Edition"
        />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <Field label="Issue No.">
          <Input
            type="number"
            value={f.issue_number}
            onChange={v => onChange('issue_number', v ? parseInt(v) : null)}
            placeholder="01"
          />
        </Field>
        <Field label="Year">
          <Select
            value={f.year ?? CURRENT_YEAR}
            onChange={v => onChange('year', parseInt(v))}
            options={YEARS.map(y => ({ value: y, label: String(y) }))}
          />
        </Field>
      </div>

      <Field label="Season">
        <Select
          value={f.season ?? ''}
          onChange={v => onChange('season', v || null)}
          options={[{ value: '', label: '— None —' }, ...SEASONS.map(s => ({ value: s, label: s }))]}
        />
      </Field>

      <Field
        label="Slug"
        hint={slugLocked ? '(locked after publish)' : '(auto-generated from title)'}
      >
        <Input
          value={f.slug}
          onChange={v => { setSlugTouched(true); onChange('slug', v); }}
          placeholder="e.g. grand-wedding-edition-2026"
          disabled={slugLocked}
        />
      </Field>

      <Field label="Featured">
        <Toggle
          checked={!!f.is_featured}
          onChange={v => onChange('is_featured', v)}
          label="Show as featured issue on magazine homepage"
        />
      </Field>

      <Divider />

      {/* ── Editorial content ── */}
      <SectionLabel>Editorial Content</SectionLabel>

      <Field label="Introduction" hint="Shown on issue listing page">
        <Textarea
          value={f.intro}
          onChange={v => onChange('intro', v)}
          placeholder="A brief introduction to this issue…"
          rows={3}
        />
      </Field>

      <Field label="Editor's Note" hint="Personal note from the editor">
        <Textarea
          value={f.editor_note}
          onChange={v => onChange('editor_note', v)}
          placeholder="This issue celebrates…"
          rows={4}
        />
      </Field>

      <Divider />

      {/* ── SEO ── */}
      <SectionLabel>SEO</SectionLabel>

      <Field label="SEO Title" hint="max 60 chars">
        <Input
          value={f.seo_title}
          onChange={v => onChange('seo_title', v)}
          placeholder="Leave blank to use issue title"
        />
        {f.seo_title && (
          <div style={{ fontFamily: NU, fontSize: 10, color: f.seo_title.length > 60 ? '#f87171' : 'rgba(255,255,255,0.35)', marginTop: 3 }}>
            {f.seo_title.length}/60
          </div>
        )}
      </Field>

      <Field label="SEO Description" hint="max 155 chars">
        <Textarea
          value={f.seo_description}
          onChange={v => onChange('seo_description', v)}
          placeholder="A luxury editorial magazine issue exploring…"
          rows={3}
        />
        {f.seo_description && (
          <div style={{ fontFamily: NU, fontSize: 10, color: f.seo_description.length > 155 ? '#f87171' : 'rgba(255,255,255,0.35)', marginTop: 3 }}>
            {f.seo_description.length}/155
          </div>
        )}
      </Field>
    </div>
  );
}
