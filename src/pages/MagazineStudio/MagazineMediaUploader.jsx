/**
 * MagazineMediaUploader
 *
 * Reusable single-asset uploader for Magazine Studio.
 * Images: compressed client-side (Canvas→WebP 88%, max 2400px) before upload.
 * Videos: validated and uploaded with progress tracking. No client-side
 *         transcoding — video goes to the configured pipeline (see VIDEO_PIPELINE).
 *
 * VIDEO_PIPELINE options:
 *   'supabase'  — raw upload to Supabase Storage (Phase 1, works now)
 *   'bunny'     — upload to Bunny Stream (Phase 2, set BUNNY_* env vars)
 *   'mux'       — upload to Mux via direct upload URL (Phase 2)
 *
 * Image shape:  { src, title, alt, caption, credit, focal }
 * Video shape:  { src, poster, title, caption, credit, autoplay, muted, loop,
 *                 pipeline, streamId, duration, originalSize }
 */
import { useState, useRef, useCallback } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { FU, Field } from './StudioShared';

const BUCKET = 'magazine';
const GOLD   = 'var(--s-gold, #c9a96e)';

// ── Video pipeline config ─────────────────────────────────────────────────────
// Phase 1: 'supabase'  — upload raw to Supabase Storage, works immediately
// Phase 2: 'bunny'     — set VITE_BUNNY_LIBRARY_ID + VITE_BUNNY_API_KEY
//          'mux'       — set VITE_MUX_TOKEN_ID + VITE_MUX_TOKEN_SECRET
const VIDEO_PIPELINE = import.meta.env.VITE_VIDEO_PIPELINE || 'supabase';

// Video validation limits
const VIDEO_WARN_MB  = 500;   // show warning above this
const VIDEO_MAX_MB   = 2048;  // hard block above this (2GB)
const VIDEO_FORMATS  = ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo'];
const VIDEO_EXTS     = ['mp4', 'mov', 'webm', 'avi'];

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

// ── Image compression ─────────────────────────────────────────────────────────
/**
 * Compresses an image file using the Canvas API.
 * Returns { file: File, originalSize, compressedSize, savings } or throws.
 *
 * Strategy:
 *   - Very large (>10MB or >5000px): resize to 2000px, quality 82%
 *   - Large (>3MB or >3000px):       resize to 2400px, quality 85%
 *   - Normal:                         resize to 2400px, quality 88%
 *   - Already small (<120KB):         skip compression, return original
 *   - GIF / video:                    skip, return original
 */
async function compressImage(file) {
  // Skip GIFs (animation would break) and videos
  if (file.type === 'image/gif' || file.type.startsWith('video/')) {
    return { file, originalSize: file.size, compressedSize: file.size, savings: 0, skipped: true };
  }
  // Skip already-tiny files
  if (file.size < 120 * 1024) {
    return { file, originalSize: file.size, compressedSize: file.size, savings: 0, skipped: true };
  }

  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const origW = img.naturalWidth;
      const origH = img.naturalHeight;
      const origSize = file.size;

      // Determine target dimension and quality based on file size / resolution
      let maxDim, quality;
      if (origSize > 10 * 1024 * 1024 || Math.max(origW, origH) > 5000) {
        maxDim = 2000; quality = 0.82;
      } else if (origSize > 3 * 1024 * 1024 || Math.max(origW, origH) > 3000) {
        maxDim = 2400; quality = 0.85;
      } else {
        maxDim = 2400; quality = 0.88;
      }

      // Scale down only — never upscale
      let w = origW, h = origH;
      if (Math.max(w, h) > maxDim) {
        if (w >= h) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else        { w = Math.round((w * maxDim) / h); h = maxDim; }
      }

      const canvas = document.createElement('canvas');
      canvas.width  = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      // High-quality downscaling
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, w, h);

      // Try WebP first, fall back to JPEG
      const tryFormat = (format, q) => new Promise(res => {
        canvas.toBlob(blob => res(blob), format, q);
      });

      (async () => {
        let blob = await tryFormat('image/webp', quality);
        let ext  = 'webp';
        let mime = 'image/webp';

        // If browser doesn't support WebP output (very rare), fall back
        if (!blob || blob.type !== 'image/webp') {
          blob = await tryFormat('image/jpeg', quality + 0.04);
          ext  = 'jpg';
          mime = 'image/jpeg';
        }

        if (!blob) { reject(new Error('Canvas compression failed')); return; }

        // If compression somehow made it bigger (rare), return original
        if (blob.size >= origSize) {
          resolve({ file, originalSize: origSize, compressedSize: origSize, savings: 0, skipped: true });
          return;
        }

        const baseName = file.name.replace(/\.[^.]+$/, '');
        const compressed = new File([blob], `${baseName}.${ext}`, { type: mime });
        const savings = Math.round((1 - blob.size / origSize) * 100);
        resolve({ file: compressed, originalSize: origSize, compressedSize: blob.size, savings, skipped: false });
      })();
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Could not load image for compression'));
    };

    img.src = objectUrl;
  });
}

function fmtSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.round(bytes / 1024)} KB`;
}

// ── Validate video file ───────────────────────────────────────────────────────
function validateVideo(file) {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const validType = VIDEO_FORMATS.includes(file.type) || VIDEO_EXTS.includes(ext);
  if (!validType) return { ok: false, error: `Unsupported format. Use MP4, MOV, or WebM.` };
  const mb = file.size / (1024 * 1024);
  if (mb > VIDEO_MAX_MB) return { ok: false, error: `File too large (${Math.round(mb)} MB). Maximum is ${VIDEO_MAX_MB} MB.` };
  return { ok: true, warn: mb > VIDEO_WARN_MB ? `Large file (${Math.round(mb)} MB) — upload may take several minutes.` : null };
}

// ── Read video metadata (duration, resolution) ────────────────────────────────
function getVideoMeta(file) {
  return new Promise(resolve => {
    const video = document.createElement('video');
    const url   = URL.createObjectURL(file);
    video.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve({ duration: Math.round(video.duration), width: video.videoWidth, height: video.videoHeight });
    };
    video.onerror = () => { URL.revokeObjectURL(url); resolve(null); };
    video.src = url;
  });
}

// ── Upload image (year/month path + pre-compressed file) ──────────────────────
async function uploadImage(file) {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const ext    = file.type === 'image/webp' ? 'webp'
    : rawExt === 'png' ? 'png' : rawExt === 'gif' ? 'gif'
    : (rawExt === 'jpg' || rawExt === 'jpeg') ? 'jpg' : 'webp';

  const now   = new Date();
  const id    = `mag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path  = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${id}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '31536000', upsert: false, contentType: file.type || 'image/webp',
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

// ── Upload video via configured pipeline ──────────────────────────────────────
async function uploadVideo(file, onProgress) {
  if (VIDEO_PIPELINE === 'bunny') {
    return uploadVideoViaBunny(file, onProgress);
  }
  if (VIDEO_PIPELINE === 'mux') {
    return uploadVideoViaMux(file, onProgress);
  }
  // Default: Supabase Storage (Phase 1)
  return uploadVideoViaSupabase(file, onProgress);
}

async function uploadVideoViaSupabase(file, onProgress) {
  const rawExt = file.name.split('.').pop()?.toLowerCase() || '';
  const ext    = rawExt === 'webm' ? 'webm' : rawExt === 'mov' ? 'mov' : 'mp4';
  const now    = new Date();
  const id     = `mag_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const path   = `${now.getFullYear()}/${String(now.getMonth()+1).padStart(2,'0')}/${id}.${ext}`;

  // Use XMLHttpRequest for progress tracking (fetch doesn't support upload progress)
  const { data: { publicUrl: uploadUrl } } = supabase.storage.from(BUCKET).getPublicUrl(path);

  // Supabase JS client doesn't expose upload progress natively — use chunked XHR
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const supabaseUrl  = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey  = import.meta.env.VITE_SUPABASE_ANON_KEY;
    xhr.open('POST', `${supabaseUrl}/storage/v1/object/${BUCKET}/${path}`);
    xhr.setRequestHeader('Authorization', `Bearer ${supabaseKey}`);
    xhr.setRequestHeader('x-upsert', 'false');
    xhr.setRequestHeader('cache-control', 'max-age=31536000');
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else {
        // Fallback: try Supabase SDK if XHR fails (e.g., auth token mismatch)
        supabase.storage.from(BUCKET).upload(path, file, {
          cacheControl: '31536000', upsert: false, contentType: file.type || 'video/mp4',
        }).then(({ error }) => {
          if (error) reject(new Error(`Upload failed: ${error.message}`));
          else { onProgress(100); resolve(); }
        });
      }
    };
    xhr.onerror = () => {
      // SDK fallback
      supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: '31536000', upsert: false, contentType: file.type || 'video/mp4',
      }).then(({ error }) => {
        if (error) reject(new Error(`Upload failed: ${error.message}`));
        else { onProgress(100); resolve(); }
      });
    };
    xhr.send(file);
  });

  return {
    src: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl,
    pipeline: 'supabase',
  };
}

// ── Phase 2 stubs — swap in when Bunny/Mux credentials are configured ─────────
async function uploadVideoViaBunny(file, onProgress) {
  const libraryId = import.meta.env.VITE_BUNNY_LIBRARY_ID;
  const apiKey    = import.meta.env.VITE_BUNNY_API_KEY;
  if (!libraryId || !apiKey) throw new Error('Bunny Stream not configured. Set VITE_BUNNY_LIBRARY_ID and VITE_BUNNY_API_KEY.');

  // 1. Create video in Bunny library
  const createRes = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
    method: 'POST',
    headers: { AccessKey: apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({ title: file.name.replace(/\.[^.]+$/, '') }),
  });
  if (!createRes.ok) throw new Error('Bunny: could not create video');
  const { guid } = await createRes.json();

  // 2. Upload video with progress
  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', `https://video.bunnycdn.com/library/${libraryId}/videos/${guid}`);
    xhr.setRequestHeader('AccessKey', apiKey);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error('Bunny upload failed'));
    xhr.onerror = () => reject(new Error('Bunny upload failed'));
    xhr.send(file);
  });

  const pullZone = import.meta.env.VITE_BUNNY_PULL_ZONE || `https://iframe.mediadelivery.net/play/${libraryId}`;
  return { src: `${pullZone}/${guid}/playlist.m3u8`, pipeline: 'bunny', streamId: guid };
}

async function uploadVideoViaMux(file, onProgress) {
  // Mux requires a server-side upload URL — call your Edge Function to get one
  const res = await fetch('/api/mux-upload-url', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename: file.name, size: file.size }),
  });
  if (!res.ok) throw new Error('Mux: could not create upload URL');
  const { uploadUrl, playbackId } = await res.json();

  await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl);
    xhr.upload.onprogress = e => { if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100)); };
    xhr.onload = () => xhr.status < 300 ? resolve() : reject(new Error('Mux upload failed'));
    xhr.onerror = () => reject(new Error('Mux upload failed'));
    xhr.send(file);
  });

  return { src: `https://stream.mux.com/${playbackId}.m3u8`, pipeline: 'mux', streamId: playbackId };
}

function isVideo(src) {
  return src && /\.(mp4|webm|mov|ogg)(\?|$)/i.test(src);
}

// ── Upload progress bar ───────────────────────────────────────────────────────
function ProgressBar({ pct }) {
  return (
    <div style={{ width: '100%', height: 3, background: 'rgba(245,240,232,0.1)', borderRadius: 2, overflow: 'hidden', marginTop: 8 }}>
      <div style={{ height: '100%', width: `${pct}%`, background: GOLD, borderRadius: 2, transition: 'width 0.3s ease' }} />
    </div>
  );
}

// ── Drop Zone ────────────────────────────────────────────────────────────────
function DropZone({ onFile, onUrl, accept, status, uploadPct, error, warn, isVideoType }) {
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
    const v = urlInput.trim();
    if (v) { onUrl(v); setUrlInput(''); }
  };

  const busy = !!status;

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => !busy && fileRef.current?.click()}
      style={{
        border: `1px dashed ${dragging ? GOLD : 'var(--s-input-border, rgba(245,240,232,0.1))'}`,
        borderRadius: 4, padding: '20px 16px', textAlign: 'center',
        background: dragging ? 'color-mix(in srgb, var(--s-gold, #c9a96e) 6%, transparent)' : 'var(--s-input-bg, rgba(245,240,232,0.04))',
        transition: 'border-color 0.15s, background 0.15s',
        cursor: busy ? 'default' : 'pointer',
      }}
    >
      <input ref={fileRef} type="file" accept={accept} style={{ display: 'none' }}
        onChange={e => { const f = e.target.files?.[0]; if (f) { onFile(f); e.target.value = ''; } }}
      />

      {status ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ fontSize: 18, opacity: 0.5 }}>
            {status === 'compressing' ? '⚙' : '⬆'}
          </div>
          <div style={{ fontFamily: FU, fontSize: 11, color: GOLD, letterSpacing: '0.08em' }}>
            {status === 'compressing' ? 'Optimising image…'
              : status === 'uploading' && isVideoType ? `Uploading video… ${uploadPct}%`
              : 'Uploading…'}
          </div>
          {isVideoType && status === 'uploading' && <ProgressBar pct={uploadPct} />}
        </div>
      ) : (
        <>
          <div style={{ fontSize: 20, marginBottom: 6, opacity: 0.6 }}>⬆</div>
          <div style={{ fontFamily: FU, fontSize: 11, color: 'var(--s-text, #f5f0e8)', marginBottom: 2 }}>
            Drop file or <span style={{ color: GOLD, textDecoration: 'underline' }}>browse</span>
          </div>
          <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>
            {isVideoType
              ? 'MP4 · MOV · WebM — up to 2 GB'
              : 'JPG · PNG · WebP · GIF · MP4 — auto-optimised on upload'}
          </div>
        </>
      )}

      {warn && !status && (
        <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-warn, #d4a843)', marginTop: 6, padding: '4px 8px', background: 'rgba(212,168,67,0.08)', borderRadius: 2 }}>
          ⚠ {warn}
        </div>
      )}

      {error && (
        <div style={{ fontFamily: FU, fontSize: 10, color: 'var(--s-error, #e05555)', marginTop: 8 }}>{error}</div>
      )}

      {/* URL input */}
      <div onClick={e => e.stopPropagation()} style={{ display: 'flex', gap: 6, marginTop: 12, alignItems: 'center' }}>
        <div style={{ fontFamily: FU, fontSize: 9, color: 'var(--s-muted, rgba(245,240,232,0.45))', flexShrink: 0 }}>URL</div>
        <input
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleUrlSet()}
          placeholder="https://…"
          style={{
            flex: 1, background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
            border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))',
            borderRadius: 2, padding: '5px 8px',
            color: 'var(--s-text, #f5f0e8)', fontFamily: FU, fontSize: 11, outline: 'none',
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

const metaInput = {
  width: '100%', boxSizing: 'border-box',
  background: 'var(--s-input-bg, rgba(245,240,232,0.04))',
  border: '1px solid var(--s-input-border, rgba(245,240,232,0.1))',
  color: 'var(--s-text, #f5f0e8)',
  fontFamily: FU, fontSize: 12,
  padding: '7px 10px', borderRadius: 2, outline: 'none',
};

// ── Image Metadata ────────────────────────────────────────────────────────────
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
      <Field label="Focal Point" hint="Controls how the image crops in cards and banners">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 3, maxWidth: 120 }}>
          {FOCAL_PRESETS.map(fp => (
            <button key={fp.id} onClick={() => upd('focal', fp.id)} title={fp.id}
              style={{
                fontFamily: FU, fontSize: 9, padding: '4px 0', borderRadius: 2, cursor: 'pointer', transition: 'all 0.12s',
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

// ── Video Metadata ────────────────────────────────────────────────────────────
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
        {[{ key: 'autoplay', label: 'Autoplay' }, { key: 'muted', label: 'Muted' }, { key: 'loop', label: 'Loop' }].map(opt => (
          <label key={opt.key} style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
            <input type="checkbox" checked={!!value[opt.key]} onChange={e => upd(opt.key, e.target.checked)} style={{ accentColor: GOLD }} />
            <span style={{ fontFamily: FU, fontSize: 11, color: 'var(--s-text, #f5f0e8)' }}>{opt.label}</span>
          </label>
        ))}
      </div>
    </>
  );
}

// ── Compression badge ─────────────────────────────────────────────────────────
function CompressionBadge({ stats }) {
  if (!stats || stats.skipped) return null;
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: FU, fontSize: 9, letterSpacing: '0.08em',
      color: 'rgba(90,170,120,0.9)',
      background: 'rgba(90,170,120,0.08)',
      border: '1px solid rgba(90,170,120,0.2)',
      borderRadius: 2, padding: '2px 7px',
    }}>
      ✓ {fmtSize(stats.originalSize)} → {fmtSize(stats.compressedSize)} · −{stats.savings}%
    </div>
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
  const [status, setStatus]           = useState(null); // null | 'compressing' | 'uploading'
  const [uploadPct, setUploadPct]     = useState(0);
  const [uploadError, setUploadError] = useState(null);
  const [uploadWarn, setUploadWarn]   = useState(null);
  const [compStats, setCompStats]     = useState(null);
  const uploadingRef = useRef(false); // Prevent double uploads (drag+input, double-click)

  const accept = type === 'video'
    ? 'video/mp4,video/webm,video/quicktime,video/x-msvideo'
    : type === 'any'
      ? 'image/*,video/mp4,video/webm,video/quicktime'
      : 'image/jpeg,image/png,image/webp,image/gif';

  const handleFile = useCallback(async (file) => {
    if (uploadingRef.current) return; // Block double uploads
    uploadingRef.current = true;

    setUploadError(null);
    setUploadWarn(null);
    setCompStats(null);
    setUploadPct(0);

    const isVid = file.type.startsWith('video/') || VIDEO_EXTS.includes(file.name.split('.').pop()?.toLowerCase());

    if (isVid) {
      // Validate before doing anything
      const validation = validateVideo(file);
      if (!validation.ok) { setUploadError(validation.error); return; }
      if (validation.warn) setUploadWarn(validation.warn);

      try {
        // Read metadata (duration, resolution) in parallel with upload start
        const [meta] = await Promise.all([getVideoMeta(file)]);
        setStatus('uploading');
        const result = await uploadVideo(file, pct => setUploadPct(pct));
        onChange({
          src:          result.src,
          poster:       '',
          title:        file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' '),
          caption:      '',
          credit:       '',
          autoplay:     false,
          muted:        true,
          loop:         false,
          pipeline:     result.pipeline,
          streamId:     result.streamId || null,
          duration:     meta?.duration || null,
          originalSize: file.size,
        });
      } catch (err) {
        setUploadError(err.message);
      } finally {
        setStatus(null);
        setUploadPct(0);
        uploadingRef.current = false;
      }
      return;
    }

    // Image path
    try {
      setStatus('compressing');
      const result = await compressImage(file);
      setCompStats(result);
      setStatus('uploading');
      const src = await uploadImage(result.file);
      onChange({ src, title: '', alt: '', caption: '', credit: '', focal: 'center' });
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setStatus(null);
      uploadingRef.current = false;
    }
  }, [onChange]);

  const handleUrl = useCallback((url) => {
    setUploadError(null);
    setCompStats(null);
    const next = isVideo(url)
      ? { src: url, poster: '', title: '', caption: '', credit: '', autoplay: false, muted: true, loop: false }
      : { src: url, title: '', alt: '', caption: '', credit: '', focal: 'center' };
    onChange(next);
  }, [onChange]);

  const clear = () => { onChange(null); setCompStats(null); };

  const src = value?.src;
  const srcIsVideo = isVideo(src);

  return (
    <div>
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
          status={status}
          uploadPct={uploadPct}
          error={uploadError}
          warn={uploadWarn}
          isVideoType={type === 'video'}
        />
      ) : (
        <div style={{ border: '1px solid var(--s-border, rgba(245,240,232,0.07))', borderRadius: 4, overflow: 'hidden' }}>
          {/* Preview */}
          <div style={{ position: 'relative', background: '#0a0a0a', height: 160 }}>
            {srcIsVideo ? (
              <video src={src} poster={value?.poster} muted
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: value?.focal || 'center' }} />
            ) : (
              <img src={src} alt={value?.alt || ''}
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: value?.focal || 'center' }} />
            )}

            {/* Controls */}
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 4 }}>
              <button onClick={clear} title="Remove"
                style={{ fontFamily: FU, fontSize: 9, padding: '3px 8px', borderRadius: 2, background: 'rgba(0,0,0,0.7)', border: '1px solid rgba(255,255,255,0.2)', color: 'rgba(245,240,232,0.7)', cursor: 'pointer' }}>
                ✕ Remove
              </button>
            </div>

            <label title="Replace" style={{ position: 'absolute', bottom: 8, right: 8, fontFamily: FU, fontSize: 9, padding: '3px 8px', borderRadius: 2, background: 'color-mix(in srgb, var(--s-gold, #c9a96e) 22%, transparent)', border: `1px solid ${GOLD}`, color: GOLD, cursor: 'pointer' }}>
              Replace ↑
              <input type="file" accept={accept} style={{ display: 'none' }}
                onChange={e => { const f = e.target.files?.[0]; if (f) { handleFile(f); e.target.value = ''; } }}
              />
            </label>

            {status && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.72)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '0 24px' }}>
                <span style={{ fontSize: 20, opacity: 0.5 }}>{status === 'compressing' ? '⚙' : '⬆'}</span>
                <span style={{ fontFamily: FU, fontSize: 11, color: GOLD, letterSpacing: '0.08em' }}>
                  {status === 'compressing' ? 'Optimising image…'
                    : srcIsVideo ? `Uploading video… ${uploadPct}%`
                    : 'Uploading…'}
                </span>
                {srcIsVideo && status === 'uploading' && (
                  <div style={{ width: '100%', maxWidth: 200 }}>
                    <ProgressBar pct={uploadPct} />
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Compression stats */}
          {compStats && !compStats.skipped && (
            <div style={{ padding: '6px 12px', background: 'rgba(90,170,120,0.06)', borderBottom: '1px solid rgba(90,170,120,0.15)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <CompressionBadge stats={compStats} />
              <span style={{ fontFamily: FU, fontSize: 9, color: 'rgba(90,170,120,0.6)' }}>WebP · optimised for web</span>
            </div>
          )}

          {/* Video info strip */}
          {srcIsVideo && value?.pipeline && (
            <div style={{ padding: '5px 12px', background: 'rgba(245,240,232,0.03)', borderBottom: '1px solid var(--s-border, rgba(245,240,232,0.07))', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: FU, fontSize: 9, color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                {value.pipeline === 'bunny' ? '▶ Bunny Stream' : value.pipeline === 'mux' ? '▶ Mux' : '▶ Supabase Storage'}
              </span>
              {value.duration && (
                <span style={{ fontFamily: FU, fontSize: 9, color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>
                  {Math.floor(value.duration / 60)}:{String(value.duration % 60).padStart(2, '0')}
                </span>
              )}
              {value.originalSize && (
                <span style={{ fontFamily: FU, fontSize: 9, color: 'var(--s-muted, rgba(245,240,232,0.45))' }}>
                  {fmtSize(value.originalSize)}
                </span>
              )}
              {value.pipeline === 'supabase' && (
                <span style={{ fontFamily: FU, fontSize: 8, color: 'var(--s-warn, #d4a843)', opacity: 0.7 }}>
                  Connect Bunny Stream for adaptive streaming
                </span>
              )}
            </div>
          )}

          {/* Metadata */}
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
