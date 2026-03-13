/**
 * MagazineMediaUploader
 *
 * Reusable single-asset uploader for Magazine Studio.
 * Supports images + video, uploads to Supabase `magazine-media` bucket.
 * Emits full asset metadata object on change.
 *
 * Image shape:  { src, title, alt, caption, credit, focal }
 * Video shape:  { src, poster, title, caption, credit, autoplay, muted, loop }
 *
 * All colours use CSS custom properties (--s-*) so the parent can set light/dark
 * theme by injecting themeVars(isLight) on any ancestor element.
 */
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { S, FU, FD, Field, Input, Textarea } from './StudioShared';

const BUCKET = 'listing-media';
// CSS-var-aware gold — picks up --s-gold if set on an ancestor
const GOLD = 'var(--s-gold, #c9a96e)';

const FOCAL_PRESETS = [
  { id: 'top left',     label: 'TL' },
  { id: 'top center',   label: 'TC' },
  { id: 'top right',    label: 'TR' },
  { id: 'center left',  label: 'ML' },
  { id: 'center',       label: 'C' },
  { id: 'center right', label: 'MR' },
  { id: 'bottom left',  label: 'BL' },
  { id: 'bottom center',label: 'BC' },
  { id: 'bottom right', label: 'BR' },
];

async function uploadToMagazineMedia(file) {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const ext = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'webm', 'mov'].includes(rawExt)
    ? rawExt
    : file.type.startsWith('video') ? 'mp4' : 'jpg';

  const id = `mag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path = `${id}.${ext}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, {
      cacheControl: '31536000',
      upsert: false,
      contentType: file.type || 'image/jpeg',
    });

  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

function isVideo(src) {
  return src && /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src);
}

// ── Upload Drop Zone ──────────────────────────────────────────────────────────
function DropZone({ onFile, onUrl, accept, uploading, error }) {
  const [dragging, setDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const fileRef = useRef(null);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) onFile(file);
  }, [onFile]);

  const handleUrlSet = () => {
    const trimmed = urlInput.trim();
    if (trimmed) { onUrl(trimmed); setUrlInput(''); }
  };

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      style={{
        border: `1px dashed ${dragging ? GOLD : 'var(--s-input-border, rgba(245,240,232,0.1))'}`,
        borderRadius: 4,
        padding: '20px 16px',
        textAlign: 'center',
        background: dragging ? 'color-mix(in srgb, var(--s-gold, #c9a96e) 6%, transparent)' : 'var(--s-input-bg, rgba(245,240,232,0.04))',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: 'pointer',
      }}
      onClick={() => !uploading && fileRef.current?.click()}
    >
      <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ''; } }}
      />
      {uploading ? (
        <div style={{ fontFamily: FU, fontSize: 11, color: GOLD }}>Uploading…</div>
      ) : (
        <>
          <div style={{ fontSize: 20, marginBottom: 6 }}>⬆</div>
          <div style={{ fontFamily: FU, fontSize: 11, color: 'var(--s-text, #f5f0e8)', marginBottom: 2 }}>
            Drop file or <span style={{ color: GOLD, textDecoration: 'underline' }}>browse</span>
          </div>
          <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>
            JPG, PNG, WebP, GIF, MP4, WebM
          </div>
        </>
      )}
      {error && (
        <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-error, #e05555)', marginTop: 8 }}>{error}</div>
      )}

      {/* URL input — stop click propagation to prevent file dialog */}
      <div
        onClick={e => e.stopPropagation()}
        style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}
      >
        <div style={{ fontFamily: FU, fontSize: 9, color: 'var(--s-muted, rgba(245,240,232,0.45))', flexShrink: 0 }}>URL</div>
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUrlSet()}
          placeholder="https://…"
          style={{
            flex: 1,
            background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
            border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))',
            borderRadius: 2, padding: '5px 8px',
            color: 'var(--s-text, #f5f0e8)',
            fontFamily: FU, fontSize: 11, outline: 'none',
          }}
        />
        <button
          onClick={handleUrlSet}
          disabled={!urlInput.trim()}
          style={{
            fontFamily: FU, fontSize: 9, fontWeight: 600, letterSpacing: '0.1em',
            padding: '5px 10px', borderRadius: 2, cursor: 'pointer',
            background: urlInput.trim() ? 'color-mix(in srgb, var(--s-gold, #c9a96e) 18%, transparent)' : 'none',
            border: `1px solid ${urlInput.trim() ? GOLD : 'var(--s-border, rgba(245,240,232,0.07))'}`,
            color: urlInput.trim() ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))',
            flexShrink: 0,
          }}
        >Set</button>
      </div>
    </div>
  );
}

// shared input style for metadata fields
const metaInput = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
  border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))',
  color: 'var(--s-text, #f5f0e8)',
  fontFamily: FU, fontSize: 12,
  padding: '7px 10px', borderRadius: 2, outline: 'none',
};

// ── Image Metadata Fields ─────────────────────────────────────────────────────
function ImageMeta({ value, onChange }) {
  const upd = (k, v) => onChange({ ...value, [k]: v });
  const focal = value.focal || 'center';

  return (
    <>
      <Field label="Alt Text">
        <input value={value.alt || ''} onChange={e => upd('alt', e.target.value)} placeholder="Describe the image for accessibility" style={metaInput} />
      </Field>
      <Field label="Caption">
        <input value={value.caption || ''} onChange={e => upd('caption', e.target.value)} placeholder="Caption shown below image" style={metaInput} />
      </Field>
      <Field label="Credit / Copyright">
        <input value={value.credit || ''} onChange={e => upd('credit', e.target.value)} placeholder="© Photographer name" style={metaInput} />
      </Field>

      {/* Focal point 3×3 grid */}
      <Field label="Focal Point" hint="Controls how the image crops">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, maxWidth: 120 }}>
          {FOCAL_PRESETS.map(fp => (
            <button
              key={fp.id}
              onClick={() => upd('focal', fp.id)}
              title={fp.id}
              style={{
                fontFamily: FU, fontSize: 9, padding: '4px 0', borderRadius: 2,
                cursor: 'pointer', transition: 'all 0.12s',
                background: focal === fp.id ? 'color-mix(in srgb, var(--s-gold, #c9a96e) 20%, transparent)' : 'none',
                border: `1px solid ${focal === fp.id ? GOLD : 'var(--s-border, rgba(245,240,232,0.07))'}`,
                color: focal === fp.id ? GOLD : 'var(--s-muted, rgba(245,240,232,0.45))',
              }}
            >{fp.label}</button>
          ))}
        </div>
      </Field>
    </>
  );
}

// ── Video Metadata Fields ─────────────────────────────────────────────────────
function VideoMeta({ value, onChange }) {
  const upd = (k, v) => onChange({ ...value, [k]: v });
  return (
    <>
      <Field label="Poster Image URL" hint="Thumbnail shown before play">
        <input value={value.poster || ''} onChange={e => upd('poster', e.target.value)} placeholder="https://…" style={metaInput} />
      </Field>
      <Field label="Caption">
        <input value={value.caption || ''} onChange={e => upd('caption', e.target.value)} placeholder="Caption shown below video" style={metaInput} />
      </Field>
      <Field label="Credit">
        <input value={value.credit || ''} onChange={e => upd('credit', e.target.value)} placeholder="Video production credit" style={metaInput} />
      </Field>
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
        {[
          { key: 'autoplay', label: 'Autoplay' },
          { key: 'muted',    label: 'Muted' },
          { key: 'loop',     label: 'Loop' },
        ].map(opt => (
          <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={!!value[opt.key]}
              onChange={e => upd(opt.key, e.target.checked)}
              style={{ accentColor: GOLD }}
            />
            <span style={{ fontFamily: FU, fontSize: 11, color: 'var(--s-text, #f5f0e8)' }}>{opt.label}</span>
          </label>
        ))}
      </div>
    </>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function MagazineMediaUploader({
  value = null,
  onChange,
  type = 'image', // 'image' | 'video' | 'any'
  label,
  hint,
  showMeta = true,
}) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const accept = type === 'video'
    ? 'video/mp4,video/webm,video/quicktime'
    : type === 'any'
      ? 'image/*,video/mp4,video/webm'
      : 'image/jpeg,image/png,image/webp,image/gif';

  const handleFile = useCallback(async (file) => {
    setUploadError(null);
    setUploading(true);
    try {
      const src = await uploadToMagazineMedia(file);
      const isVid = file.type.startsWith('video');
      const next = isVid
        ? { src, poster: '', title: '', caption: '', credit: '', autoplay: false, muted: true, loop: false }
        : { src, title: '', alt: '', caption: '', credit: '', focal: 'center' };
      onChange(next);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }, [onChange]);

  const handleUrl = useCallback((url) => {
    setUploadError(null);
    const isVid = isVideo(url);
    const next = isVid
      ? { src: url, poster: '', title: '', caption: '', credit: '', autoplay: false, muted: true, loop: false }
      : { src: url, title: '', alt: '', caption: '', credit: '', focal: 'center' };
    onChange(next);
  }, [onChange]);

  const clear = () => onChange(null);

  const src = value?.src;
  const srcIsVideo = isVideo(src);

  return (
    <div style={{ marginBottom: label ? 0 : undefined }}>
      {label && (
        <div style={{ fontFamily: FU, fontSize: 9, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--s-muted, rgba(245,240,232,0.45))', marginBottom: 6 }}>
          {label}
          {hint && <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, marginLeft: 6, color: 'var(--s-faint, rgba(245,240,232,0.2))' }}>{hint}</span>}
        </div>
      )}

      {!src ? (
        <DropZone
          onFile={handleFile}
          onUrl={handleUrl}
          accept={accept}
          uploading={uploading}
          error={uploadError}
        />
      ) : (
        <div style={{ border: '1px solid var(--s-border, rgba(245,240,232,0.07))', borderRadius: 4, overflow: 'hidden' }}>
          {/* Preview header */}
          <div style={{ position: 'relative', background: '#0a0a0a', height: 160 }}>
            {srcIsVideo ? (
              <video
                src={src}
                poster={value?.poster}
                muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: value?.focal || 'center' }}
              />
            ) : (
              <img
                src={src}
                alt={value?.alt || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: value?.focal || 'center' }}
              />
            )}

            {/* Controls overlay */}
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
              <button
                onClick={clear}
                title="Remove"
                style={{
                  fontFamily: FU, fontSize: 9, padding: '3px 8px', borderRadius: 2,
                  background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)',
                  color: 'rgba(245,240,232,0.7)', cursor: 'pointer',
                }}
              >✕ Remove</button>
            </div>

            {/* Replace file input */}
            <label
              title="Replace with a different file"
              style={{
                position: 'absolute', bottom: 8, right: 8,
                fontFamily: FU, fontSize: 9, padding: '3px 8px', borderRadius: 2,
                background: 'color-mix(in srgb, var(--s-gold, #c9a96e) 22%, transparent)',
                border: `1px solid ${GOLD}`,
                color: GOLD,
                cursor: 'pointer',
              }}
            >
              Replace ↑
              <input type="file" accept={accept} style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
              />
            </label>

            {uploading && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontFamily: FU, fontSize: 11, color: GOLD }}>Uploading…</span>
              </div>
            )}
          </div>

          {/* Metadata fields */}
          {showMeta && (
            <div style={{ padding: '12px 14px', background: 'var(--s-surface, #161614)' }}>
              {srcIsVideo
                ? <VideoMeta value={value} onChange={onChange} />
                : <ImageMeta value={value} onChange={onChange} />
              }
              {uploadError && (
                <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-error, #e05555)', marginTop: 6 }}>{uploadError}</div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
