// src/components/publications/SocialExportModal.jsx
// Social export modal — lets users download the current page in social-ready formats.
// Pure browser canvas, no server calls.
//
// Props:
//   page    — magazine_issue_pages row ({ page_number, image_url, thumbnail_url })
//   issue   — magazine_issues row ({ title, issue_number, season, year, slug })
//   onClose — callback to close the modal

import { useState, useEffect } from 'react';

// ── Design tokens (match reader) ──────────────────────────────────────────────
const GOLD   = '#C9A84C';
const DARK   = '#0A0908';
const GD     = "var(--font-heading-primary, 'Cormorant Garamond', Georgia, serif)";
const NU     = "var(--font-body, 'Jost', sans-serif)";
const MUTED  = 'rgba(255,255,255,0.45)';

// ── Export format definitions ─────────────────────────────────────────────────
const FORMATS = [
  {
    id:          'pinterest',
    label:       'Pinterest',
    dims:        '1000 × 1500',
    ratio:       '2:3',
    platform:    'Pinterest',
    w:           1000,
    h:           1500,
    icon:        '📌',
    description: 'Vertical pin',
  },
  {
    id:          'stories',
    label:       'Stories',
    dims:        '1080 × 1920',
    ratio:       '9:16',
    platform:    'IG / TikTok',
    w:           1080,
    h:           1920,
    icon:        '▯',
    description: 'Full-screen story',
  },
  {
    id:          'square',
    label:       'Square',
    dims:        '1080 × 1080',
    ratio:       '1:1',
    platform:    'Instagram',
    w:           1080,
    h:           1080,
    icon:        '□',
    description: 'Feed post',
  },
  {
    id:          'full',
    label:       'Full Size',
    dims:        'Original',
    ratio:       'Native',
    platform:    'Press / Print',
    w:           null, // derived from image
    h:           null,
    icon:        '⬛',
    description: 'Full resolution',
  },
];

// ── Canvas helper: load an image into a Promise ───────────────────────────────
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image: ${src}`));
    img.src = src;
  });
}

// ── Core canvas export ────────────────────────────────────────────────────────
async function exportForSocial(imageUrl, format, issue, pageNum) {
  const img = await loadImage(imageUrl);

  const canvas = document.createElement('canvas');
  const ctx    = canvas.getContext('2d');

  const w = format.w ?? img.naturalWidth;
  const h = format.h ?? img.naturalHeight;
  canvas.width  = w;
  canvas.height = h;

  // Background fill
  ctx.fillStyle = DARK;
  ctx.fillRect(0, 0, w, h);

  // Draw image centered + cover
  const scale = Math.min(w / img.naturalWidth, h / img.naturalHeight);
  const dw    = img.naturalWidth  * scale;
  const dh    = img.naturalHeight * scale;
  const dx    = (w - dw) / 2;
  const dy    = (h - dh) / 2;

  // For stories: blurred background fill first
  if (format.id === 'stories') {
    // Draw a blurred version as background (scale to fill, then blur via ctx shadow)
    const bgScale  = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const bgW      = img.naturalWidth  * bgScale;
    const bgH      = img.naturalHeight * bgScale;
    const bgX      = (w - bgW) / 2;
    const bgY      = (h - bgH) / 2;

    ctx.globalAlpha = 0.5;
    ctx.filter      = 'blur(24px) brightness(0.35)';
    ctx.drawImage(img, bgX, bgY, bgW, bgH);
    ctx.filter      = 'none';
    ctx.globalAlpha = 1;
  }

  // Main image (contained)
  ctx.drawImage(img, dx, dy, dw, dh);

  // ── Watermark bar (non-full formats) ───────────────────────────────────────
  if (format.id !== 'full') {
    const barH   = Math.round(h * 0.045);   // ~4.5% of height
    const fontSize = Math.round(barH * 0.48);

    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, h - barH, w, barH);

    ctx.fillStyle   = '#C9A84C'; // GOLD
    ctx.font        = `600 ${fontSize}px sans-serif`;
    ctx.textAlign   = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('LUXURY WEDDING DIRECTORY', w / 2, h - barH / 2);

    // Page number (right-aligned, small)
    const pageLabel = `Page ${pageNum}`;
    ctx.fillStyle   = 'rgba(201,168,76,0.65)';
    ctx.font        = `400 ${Math.round(fontSize * 0.75)}px sans-serif`;
    ctx.textAlign   = 'right';
    ctx.fillText(pageLabel, w - Math.round(w * 0.025), h - barH / 2);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

// ── Trigger download ──────────────────────────────────────────────────────────
function triggerDownload(dataUrl, filename) {
  const a    = document.createElement('a');
  a.href     = dataUrl;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ── Format card ──────────────────────────────────────────────────────────────
function FormatCard({ format, exporting, exported, onExport }) {
  const isActive  = exporting === format.id;
  const isDone    = exported.includes(format.id);

  // Aspect ratio preview box dimensions (all within a fixed 80px tall container)
  const previewH = 72;
  const ratioMap = { '2:3': 2/3, '9:16': 9/16, '1:1': 1, 'Native': 3/4 };
  const aspectRatio = ratioMap[format.ratio] || 1;
  const previewW = Math.round(previewH * aspectRatio);

  return (
    <div
      style={{
        background:   'rgba(255,255,255,0.04)',
        border:       `1px solid ${isDone ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 4,
        padding:      '14px 12px',
        display:      'flex',
        flexDirection:'column',
        alignItems:   'center',
        gap:          10,
        cursor:       isActive ? 'wait' : 'pointer',
        transition:   'all 0.2s',
        opacity:      isActive ? 0.7 : 1,
      }}
      onClick={() => !isActive && onExport(format)}
      onMouseEnter={e => { if (!isActive) e.currentTarget.style.borderColor = 'rgba(201,168,76,0.45)'; }}
      onMouseLeave={e => { if (!isActive) e.currentTarget.style.borderColor = isDone ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.1)'; }}
    >
      {/* Aspect ratio preview */}
      <div style={{
        width:        previewW,
        height:       previewH,
        background:   'rgba(255,255,255,0.08)',
        border:       `1px solid rgba(255,255,255,0.15)`,
        borderRadius: 2,
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        fontSize:     14,
        flexShrink:   0,
      }}>
        {isDone
          ? <span style={{ color: GOLD, fontSize: 18 }}>✓</span>
          : <span style={{ opacity: 0.3 }}>{format.icon}</span>
        }
      </div>

      {/* Labels */}
      <div style={{ textAlign: 'center', width: '100%' }}>
        <div style={{ fontFamily: NU, fontSize: 10, fontWeight: 700, color: isDone ? GOLD : '#fff', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 2 }}>
          {format.label}
        </div>
        <div style={{ fontFamily: NU, fontSize: 9, color: MUTED, marginBottom: 1 }}>
          {format.platform}
        </div>
        <div style={{ fontFamily: NU, fontSize: 8, color: 'rgba(255,255,255,0.25)' }}>
          {format.dims}
        </div>
      </div>

      {/* Download button */}
      <div style={{
        fontFamily:      NU,
        fontSize:        9,
        fontWeight:      600,
        letterSpacing:   '0.1em',
        textTransform:   'uppercase',
        color:           isActive ? MUTED : (isDone ? GOLD : 'rgba(255,255,255,0.55)'),
        border:          `1px solid ${isActive ? 'rgba(255,255,255,0.1)' : (isDone ? 'rgba(201,168,76,0.4)' : 'rgba(255,255,255,0.15)')}`,
        borderRadius:    2,
        padding:         '5px 10px',
        width:           '100%',
        textAlign:       'center',
        transition:      'all 0.15s',
        boxSizing:       'border-box',
      }}>
        {isActive ? 'Preparing…' : isDone ? '✓ Downloaded' : '⬇ Download'}
      </div>
    </div>
  );
}

// ── Main modal component ──────────────────────────────────────────────────────
export default function SocialExportModal({ page, issue, onClose }) {
  const [exporting, setExporting] = useState(null);   // format.id | null
  const [exported,  setExported]  = useState([]);     // format ids
  const [shareMsg,  setShareMsg]  = useState('');
  const [error,     setError]     = useState('');

  const imageUrl  = page?.image_url || page?.thumbnail_url;
  const pageNum   = page?.page_number || 1;

  // Issue label for filename
  const issueParts = [
    issue?.issue_number ? `issue-${issue.issue_number}` : null,
    issue?.season?.toLowerCase() || null,
    issue?.year || null,
  ].filter(Boolean);
  const issueLabel = issueParts.join('-') || issue?.slug || 'lwd-magazine';

  const handleExport = async (format) => {
    if (!imageUrl) {
      setError('No image available for this page.');
      return;
    }
    setError('');
    setExporting(format.id);
    try {
      const dataUrl  = await exportForSocial(imageUrl, format, issue, pageNum);
      const filename = `lwd-${issueLabel}-page-${pageNum}-${format.id}.jpg`;
      triggerDownload(dataUrl, filename);
      setExported(prev => prev.includes(format.id) ? prev : [...prev, format.id]);
    } catch (err) {
      setError('Export failed. The image may be protected by CORS. Try downloading the PDF instead.');
      console.error('[SocialExportModal] export error:', err);
    } finally {
      setExporting(null);
    }
  };

  const handleShare = async () => {
    if (!issue?.slug) return;
    const url = `${window.location.origin}/publications/${issue.slug}?page=${pageNum}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${issue.title || 'LWD Magazine'} — Page ${pageNum}`,
          text:  `Check out page ${pageNum} of ${issue.title || 'Luxury Wedding Directory Magazine'}`,
          url,
        });
        setShareMsg('Shared!');
      } catch {
        // user cancelled — no error needed
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        setShareMsg('Link copied!');
      } catch {
        setShareMsg('Copy failed — please copy the URL manually.');
      }
    }
    setTimeout(() => setShareMsg(''), 2500);
  };

  // Escape key to close
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      style={{
        position:        'fixed',
        inset:           0,
        zIndex:          700,
        display:         'flex',
        alignItems:      'center',
        justifyContent:  'center',
        background:      'rgba(0,0,0,0.75)',
        backdropFilter:  'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        padding:         '16px',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        style={{
          background:   '#111009',
          border:       '1px solid rgba(255,255,255,0.1)',
          borderRadius: 6,
          width:        '100%',
          maxWidth:     540,
          maxHeight:    '90vh',
          overflowY:    'auto',
          padding:      '28px 24px 24px',
          position:     'relative',
          boxShadow:    '0 24px 80px rgba(0,0,0,0.8)',
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position:   'absolute',
            top:        16,
            right:      16,
            background: 'none',
            border:     'none',
            color:      MUTED,
            cursor:     'pointer',
            fontSize:   18,
            lineHeight: 1,
            padding:    4,
            transition: 'color 0.15s',
          }}
          onMouseEnter={e => e.currentTarget.style.color = '#fff'}
          onMouseLeave={e => e.currentTarget.style.color = MUTED}
          title="Close"
          aria-label="Close export modal"
        >
          ✕
        </button>

        {/* Header */}
        <div style={{ marginBottom: 20, paddingRight: 32 }}>
          <div style={{ fontFamily: NU, fontSize: 9, fontWeight: 700, color: GOLD, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>
            Export & Share
          </div>
          <div style={{ fontFamily: GD, fontSize: 22, fontStyle: 'italic', color: '#F0EBE0', lineHeight: 1.2 }}>
            Page {pageNum}
          </div>
          {issue?.title && (
            <div style={{ fontFamily: NU, fontSize: 11, color: MUTED, marginTop: 4 }}>
              {issue.title}
              {issue.issue_number ? ` · Issue ${issue.issue_number}` : ''}
            </div>
          )}
        </div>

        {/* Format grid */}
        <div style={{
          display:             'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap:                 10,
          marginBottom:        20,
        }}>
          {FORMATS.map(format => (
            <FormatCard
              key={format.id}
              format={format}
              exporting={exporting}
              exported={exported}
              onExport={handleExport}
            />
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{
            fontFamily:   NU,
            fontSize:     11,
            color:        '#E07070',
            background:   'rgba(220,80,80,0.1)',
            border:       '1px solid rgba(220,80,80,0.25)',
            borderRadius: 3,
            padding:      '8px 12px',
            marginBottom: 14,
            lineHeight:   1.5,
          }}>
            {error}
          </div>
        )}

        {/* Share URL button */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleShare}
            style={{
              flex:            1,
              background:      'rgba(201,168,76,0.1)',
              border:          `1px solid rgba(201,168,76,0.35)`,
              borderRadius:    3,
              color:           GOLD,
              fontFamily:      NU,
              fontSize:        10,
              fontWeight:      600,
              letterSpacing:   '0.1em',
              textTransform:   'uppercase',
              padding:         '10px 16px',
              cursor:          'pointer',
              transition:      'all 0.15s',
              display:         'flex',
              alignItems:      'center',
              justifyContent:  'center',
              gap:             6,
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(201,168,76,0.18)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(201,168,76,0.1)'}
          >
            {shareMsg || '↗ Share Page Link'}
          </button>
        </div>

        {/* Fine print */}
        <p style={{
          fontFamily:  NU,
          fontSize:    9,
          color:       'rgba(255,255,255,0.2)',
          margin:      '14px 0 0',
          lineHeight:  1.6,
          textAlign:   'center',
        }}>
          Downloads are for personal use only · © Luxury Wedding Directory
        </p>
      </div>
    </div>
  );
}
