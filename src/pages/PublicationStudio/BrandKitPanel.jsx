// ─── src/pages/PublicationStudio/BrandKitPanel.jsx ───────────────────────────
// Full-screen brand kit panel for the Publication Studio.
// Manages colors, typography, logos, default palette, and custom domain.

import { useState, useEffect, useRef } from 'react';
import { fetchBrandKit, saveBrandKit, uploadBrandLogo } from '../../services/magazineBrandKitService';

// ── Design tokens ──────────────────────────────────────────────────────────────
const GOLD   = '#C9A84C';
const BG     = '#0C0B09';
const SURF   = '#141210';
const SIDE   = '#100F0D';
const BORDER = 'rgba(255,255,255,0.08)';
const MUTED  = 'rgba(255,255,255,0.38)';
const NU     = "var(--font-body,'Nunito Sans',sans-serif)";
const GD     = "var(--font-heading-primary,'Cormorant Garamond',Georgia,serif)";

const INPUT = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.12)',
  borderRadius: 4, color: '#fff',
  fontFamily: NU, fontSize: 13,
  padding: '8px 10px', outline: 'none',
};

const HEADING_FONTS = [
  'Cormorant Garamond',
  'Playfair Display',
  'Bodoni Moda',
  'Libre Baskerville',
  'EB Garamond',
];

const BODY_FONTS = [
  'Jost',
  'Montserrat',
  'Raleway',
  'Lato',
];

const PALETTES = [
  { id: 'obsidian', label: 'Obsidian',  bg: '#0A0806', text: '#E8E3D8' },
  { id: 'ivory',    label: 'Ivory',     bg: '#F5F0E8', text: '#2A2218' },
  { id: 'blush',    label: 'Blush',     bg: '#F9EEE8', text: '#3A2820' },
  { id: 'midnight', label: 'Midnight',  bg: '#0D0E1A', text: '#D8DDF5' },
  { id: 'claret',   label: 'Claret',    bg: '#1A0810', text: '#F5E0E8' },
  { id: 'white',    label: 'White',     bg: '#FFFFFF', text: '#1A1A1A' },
];

function Lbl({ children, hint }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 5 }}>
      <span style={{ fontFamily: NU, fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{children}</span>
      {hint && <span style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>{hint}</span>}
    </div>
  );
}

function SectionHead({ children }) {
  return (
    <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: GOLD, marginBottom: 14, marginTop: 4 }}>
      {children}
    </div>
  );
}

function Hr() {
  return <div style={{ borderTop: `1px solid ${BORDER}`, margin: '22px 0' }} />;
}

// ── Color picker row ──────────────────────────────────────────────────────────
function ColorRow({ label, value, onChange }) {
  const [hex, setHex] = useState(value || '#000000');

  useEffect(() => {
    setHex(value || '#000000');
  }, [value]);

  const handleHexChange = (v) => {
    setHex(v);
    if (/^#[0-9A-Fa-f]{6}$/.test(v)) onChange(v);
  };

  return (
    <div style={{ marginBottom: 14 }}>
      <Lbl>{label}</Lbl>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <input
          type="color"
          value={hex}
          onChange={e => { setHex(e.target.value); onChange(e.target.value); }}
          style={{
            width: 40, height: 36, padding: 2, border: `1px solid ${BORDER}`,
            borderRadius: 4, background: 'none', cursor: 'pointer', flexShrink: 0,
          }}
        />
        <input
          type="text"
          value={hex}
          onChange={e => handleHexChange(e.target.value)}
          placeholder="#C9A96E"
          maxLength={7}
          spellCheck={false}
          style={{ ...INPUT, fontFamily: 'monospace', fontSize: 12, width: 120 }}
        />
        <div style={{
          width: 36, height: 36, borderRadius: 4, flexShrink: 0,
          background: /^#[0-9A-Fa-f]{6}$/.test(hex) ? hex : 'transparent',
          border: `1px solid ${BORDER}`,
        }} />
      </div>
    </div>
  );
}

// ── Logo upload slot ──────────────────────────────────────────────────────────
function LogoSlot({ label, hint, currentUrl, onUpload, uploading }) {
  const ref = useRef(null);
  return (
    <div style={{ marginBottom: 18 }}>
      <Lbl hint={hint}>{label}</Lbl>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {/* Preview */}
        <div style={{
          width: 80, height: 48, flexShrink: 0,
          background: label.toLowerCase().includes('dark') ? '#fff' : '#0A0806',
          border: `1px solid ${BORDER}`, borderRadius: 4,
          display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
        }}>
          {currentUrl
            ? <img src={currentUrl} alt={label} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
            : <span style={{ fontFamily: NU, fontSize: 9, color: MUTED, textAlign: 'center', padding: '0 6px' }}>No logo</span>
          }
        </div>
        <div style={{ flex: 1 }}>
          <button
            onClick={() => ref.current?.click()}
            disabled={uploading}
            style={{
              fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
              textTransform: 'uppercase', background: 'none',
              border: `1px solid ${BORDER}`, borderRadius: 3,
              color: uploading ? MUTED : 'rgba(255,255,255,0.6)',
              padding: '7px 14px', cursor: uploading ? 'default' : 'pointer',
            }}
          >
            {uploading ? 'Uploading…' : currentUrl ? 'Replace' : '↑ Upload'}
          </button>
          {currentUrl && (
            <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginTop: 4, wordBreak: 'break-all', maxWidth: 200 }}>
              {currentUrl.split('/').pop()}
            </div>
          )}
        </div>
        <input
          ref={ref}
          type="file"
          accept="image/png,image/svg+xml,image/webp,image/jpeg"
          style={{ display: 'none' }}
          onChange={e => { const f = e.target.files?.[0]; if (f) { onUpload(f); e.target.value = ''; } }}
        />
      </div>
    </div>
  );
}

// ── Main BrandKitPanel ────────────────────────────────────────────────────────
export default function BrandKitPanel({ onClose }) {
  const [kit,      setKit]      = useState(null);
  const [draft,    setDraft]    = useState({});
  const [saving,   setSaving]   = useState(false);
  const [saveMsg,  setSaveMsg]  = useState('');
  const [logoLightUploading, setLogoLightUploading] = useState(false);
  const [logoDarkUploading,  setLogoDarkUploading]  = useState(false);

  // Load brand kit on mount
  useEffect(() => {
    fetchBrandKit().then(({ data }) => {
      if (data) { setKit(data); setDraft(data); }
    });
  }, []);

  const set = (k, v) => setDraft(prev => ({ ...prev, [k]: v }));

  const handleSave = async () => {
    setSaving(true); setSaveMsg('');
    const { data, error } = await saveBrandKit(draft);
    if (!error && data) {
      setKit(data); setDraft(data);
      setSaveMsg('Saved ✓');
      setTimeout(() => setSaveMsg(''), 2500);
    } else {
      setSaveMsg('Save failed');
    }
    setSaving(false);
  };

  const handleLogoUpload = async (file, variant) => {
    const setUploading = variant === 'light' ? setLogoLightUploading : setLogoDarkUploading;
    const field        = variant === 'light' ? 'logo_url'            : 'logo_dark_url';
    setUploading(true);
    const { publicUrl, error } = await uploadBrandLogo(file, variant);
    if (!error && publicUrl) {
      set(field, publicUrl);
    }
    setUploading(false);
  };

  if (!kit) {
    return (
      <div style={{
        position: 'fixed', inset: 0, zIndex: 800, background: BG,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontFamily: NU, fontSize: 12, color: MUTED,
      }}>
        Loading brand kit…
      </div>
    );
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 800,
      background: BG,
      display: 'flex', flexDirection: 'column',
      fontFamily: NU,
    }}>

      {/* ── Top bar ── */}
      <div style={{
        height: 52, flexShrink: 0,
        borderBottom: `1px solid ${BORDER}`,
        display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: 16,
        background: SURF,
      }}>
        <button onClick={onClose} style={{ background: 'none', border: 'none', color: MUTED, cursor: 'pointer', fontSize: 18, lineHeight: 1, padding: 0, flexShrink: 0 }}>←</button>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: GD, fontSize: 18, fontStyle: 'italic', color: '#fff' }}>
            Brand Kit
          </div>
          <div style={{ fontFamily: NU, fontSize: 10, color: MUTED }}>
            Colors, typography, logos, and defaults
          </div>
        </div>
        {saveMsg && (
          <span style={{ fontFamily: NU, fontSize: 10, color: saveMsg.includes('✓') ? '#34d399' : '#f87171' }}>
            {saveMsg}
          </span>
        )}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{
            fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
            textTransform: 'uppercase', background: saving ? 'rgba(201,168,76,0.5)' : GOLD,
            border: 'none', color: '#0A0908', padding: '8px 20px', borderRadius: 2,
            cursor: saving ? 'default' : 'pointer',
          }}
        >
          {saving ? 'Saving…' : 'Save Brand Kit'}
        </button>
      </div>

      {/* ── Scrollable body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px', maxWidth: 760 }}>

        {/* Brand Colors */}
        <SectionHead>Brand Colors</SectionHead>
        <ColorRow label="Primary (Gold)"   value={draft.primary_color}   onChange={v => set('primary_color',   v)} />
        <ColorRow label="Secondary (Dark)" value={draft.secondary_color}  onChange={v => set('secondary_color', v)} />
        <ColorRow label="Accent (Cream)"   value={draft.accent_color}     onChange={v => set('accent_color',    v)} />

        <Hr />

        {/* Typography */}
        <SectionHead>Typography</SectionHead>
        <div style={{ marginBottom: 14 }}>
          <Lbl hint="Used for headings and titles">Heading Font</Lbl>
          <select
            value={draft.heading_font || 'Cormorant Garamond'}
            onChange={e => set('heading_font', e.target.value)}
            style={{ ...INPUT, cursor: 'pointer' }}
          >
            {HEADING_FONTS.map(f => (
              <option key={f} value={f} style={{ background: '#1a1a18' }}>{f}</option>
            ))}
          </select>
          {draft.heading_font && (
            <div style={{ marginTop: 8, fontFamily: `'${draft.heading_font}', Georgia, serif`, fontSize: 22, color: 'rgba(255,255,255,0.7)', fontStyle: 'italic' }}>
              Luxury Wedding Directory
            </div>
          )}
        </div>
        <div style={{ marginBottom: 14 }}>
          <Lbl hint="Used for body copy and UI">Body Font</Lbl>
          <select
            value={draft.body_font || 'Jost'}
            onChange={e => set('body_font', e.target.value)}
            style={{ ...INPUT, cursor: 'pointer' }}
          >
            {BODY_FONTS.map(f => (
              <option key={f} value={f} style={{ background: '#1a1a18' }}>{f}</option>
            ))}
          </select>
          {draft.body_font && (
            <div style={{ marginTop: 8, fontFamily: `'${draft.body_font}', sans-serif`, fontSize: 13, color: MUTED, lineHeight: 1.6 }}>
              Editorial excellence in every detail. Bespoke wedding coverage.
            </div>
          )}
        </div>

        <Hr />

        {/* Logo Upload */}
        <SectionHead>Logos</SectionHead>
        <LogoSlot
          label="Light Logo"
          hint="for dark backgrounds"
          currentUrl={draft.logo_url}
          onUpload={f => handleLogoUpload(f, 'light')}
          uploading={logoLightUploading}
        />
        <LogoSlot
          label="Dark Logo"
          hint="for light backgrounds"
          currentUrl={draft.logo_dark_url}
          onUpload={f => handleLogoUpload(f, 'dark')}
          uploading={logoDarkUploading}
        />

        <Hr />

        {/* Default Palette */}
        <SectionHead>Default Cover Palette</SectionHead>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
          {PALETTES.map(p => {
            const active = (draft.default_palette || 'obsidian') === p.id;
            return (
              <button
                key={p.id}
                onClick={() => set('default_palette', p.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '10px 14px', borderRadius: 4,
                  border: `2px solid ${active ? GOLD : BORDER}`,
                  background: active ? 'rgba(201,168,76,0.08)' : 'rgba(255,255,255,0.03)',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
              >
                <div style={{
                  width: 48, height: 64, borderRadius: 2,
                  background: p.bg,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <div style={{
                    width: 32, height: 2,
                    background: `linear-gradient(to right, #C9A84C, transparent)`,
                    marginBottom: 4,
                  }} />
                </div>
                <span style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', color: active ? GOLD : MUTED, textTransform: 'uppercase' }}>
                  {p.label}
                </span>
              </button>
            );
          })}
        </div>

        <Hr />

        {/* Custom Domain */}
        <SectionHead>Custom Reader Domain</SectionHead>
        <div style={{ marginBottom: 14 }}>
          <Lbl hint="optional">Reader Domain</Lbl>
          <input
            type="text"
            value={draft.custom_domain || ''}
            onChange={e => set('custom_domain', e.target.value)}
            placeholder="magazine.yourbrand.com"
            spellCheck={false}
            style={{ ...INPUT, fontFamily: 'monospace', fontSize: 12 }}
          />
        </div>
        <div style={{
          background: 'rgba(201,168,76,0.05)',
          border: `1px solid rgba(201,168,76,0.2)`,
          borderRadius: 4, padding: '12px 14px', marginBottom: 8,
        }}>
          <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: GOLD, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
            Setup Instructions
          </div>
          <div style={{ fontFamily: NU, fontSize: 11, color: 'rgba(255,255,255,0.65)', lineHeight: 1.7 }}>
            To activate, point a CNAME record at your CDN. Contact support for setup assistance.
          </div>
        </div>
        <div style={{ fontFamily: NU, fontSize: 10, color: MUTED, marginBottom: 4 }}>
          Current live URL:
        </div>
        <div style={{ fontFamily: 'monospace', fontSize: 11, color: GOLD }}>
          luxuryweddingdirectory.com/publications/[slug]
        </div>

        {/* Bottom save button */}
        <div style={{ marginTop: 32, display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              fontFamily: NU, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
              textTransform: 'uppercase', background: saving ? 'rgba(201,168,76,0.5)' : GOLD,
              border: 'none', color: '#0A0908', padding: '10px 28px', borderRadius: 2,
              cursor: saving ? 'default' : 'pointer',
            }}
          >
            {saving ? 'Saving…' : 'Save Brand Kit'}
          </button>
        </div>
      </div>
    </div>
  );
}
