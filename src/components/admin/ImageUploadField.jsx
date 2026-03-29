// ─── src/components/admin/ImageUploadField.jsx ───────────────────────────────
// Reusable image upload field for all admin modules.
// Shows: URL text input + Upload button + thumbnail preview + Remove button.
// Uploads directly to Supabase Storage on file pick, calls onChange(publicUrl).
//
// Props:
//   label       — field label string
//   value       — current URL string
//   onChange    — (url: string) => void
//   bucket      — Supabase bucket name (default: 'listing-media')
//   folder      — storage path prefix (default: 'uploads')
//   hint        — optional hint text below the field
//   palette     — colour object with: bg, border, text, muted, gold (matches C or LS)
//   previewHeight — height of preview thumbnail (default: 120)
// ─────────────────────────────────────────────────────────────────────────────

import { useRef, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';

const NU = 'var(--font-body)';
const GOLD = '#C9A84C';

export default function ImageUploadField({
  label,
  value,
  onChange,
  bucket = 'listing-media',
  folder = 'uploads',
  hint,
  palette,
  previewHeight = 120,
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);

  // Resolve colour tokens — supports both C (dark admin) and LS (studio palette)
  const bg      = palette?.bg      || palette?.black  || '#1a1a1a';
  const border  = palette?.border                     || '#333';
  const textCol = palette?.text    || palette?.off    || '#e8e4dc';
  const muted   = palette?.muted   || palette?.grey2  || '#666';
  const gold    = palette?.gold                       || GOLD;

  const inputStyle = {
    flex: 1,
    fontFamily: NU, fontSize: 13, color: textCol,
    background: bg, border: `1px solid ${border}`,
    borderRadius: 3, padding: '7px 12px',
    outline: 'none', boxSizing: 'border-box',
    minWidth: 0,
  };

  const labelStyle = {
    display: 'block', fontFamily: NU, fontSize: 10,
    letterSpacing: '0.12em', textTransform: 'uppercase',
    color: muted, fontWeight: 600, marginBottom: 5,
  };

  const hintStyle = {
    fontFamily: NU, fontSize: 10, color: muted, marginTop: 3,
  };

  async function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const rawExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif'].includes(rawExt) ? rawExt : 'jpg';
      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const path = `${folder}/${uid}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          upsert: true,
          contentType: file.type || 'image/jpeg',
          cacheControl: '31536000',
        });

      if (upErr) throw upErr;

      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  return (
    <div>
      {label && <label style={labelStyle}>{label}</label>}

      {/* Input row */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          placeholder="https://... or upload →"
          style={inputStyle}
        />
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          style={{
            flexShrink: 0,
            padding: '7px 12px',
            background: uploading ? `${gold}33` : `${gold}18`,
            border: `1px solid ${gold}44`,
            borderRadius: 3,
            cursor: uploading ? 'default' : 'pointer',
            fontFamily: NU, fontSize: 11,
            color: gold,
            whiteSpace: 'nowrap',
            transition: 'background 0.15s',
          }}
        >
          {uploading ? 'Uploading…' : '↑ Upload'}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*,.webp,.avif"
          onChange={handleFile}
          style={{ display: 'none' }}
        />
      </div>

      {/* Error */}
      {error && (
        <div style={{ fontFamily: NU, fontSize: 10, color: '#f87171', marginTop: 4 }}>
          {error}
        </div>
      )}

      {/* Hint */}
      {hint && !error && <div style={hintStyle}>{hint}</div>}

      {/* Preview */}
      {value && (
        <div style={{ marginTop: 8, position: 'relative', display: 'block' }}>
          <img
            src={value}
            alt=""
            style={{
              width: '100%',
              height: previewHeight,
              objectFit: 'cover',
              borderRadius: 3,
              display: 'block',
              border: `1px solid ${border}`,
            }}
            onError={e => { e.target.style.display = 'none'; }}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            title="Remove image"
            style={{
              position: 'absolute', top: 6, right: 6,
              background: 'rgba(0,0,0,0.65)',
              border: 'none', color: '#fff',
              borderRadius: 3, width: 22, height: 22,
              fontSize: 11, cursor: 'pointer',
              lineHeight: 1, padding: 0,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >✕</button>
        </div>
      )}
    </div>
  );
}
