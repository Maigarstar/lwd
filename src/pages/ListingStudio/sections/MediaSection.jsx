import { useState, useEffect } from 'react';

// ─── CONSTANTS ───────────────────────────────────────────────────────────────
const MAX_HERO          = 5;
const HERO_SPEC         = 'Recommended: 1920 × 1080 px (16:9) · Max 5 MB per image · JPG / PNG / WebP';
const CARD_LIMIT        = 12;   // max items shown in listing card display
const IMAGE_STORAGE_MAX = 100;  // total images stored
const VIDEO_STORAGE_MAX = 20;   // total videos stored
const VIRTUAL_TOUR_MAX  = 3;    // max virtual tour embeds

const GALLERY_SPEC = 'Recommended: 2000 × 1500 px min · Max 10 MB · JPG / PNG / WebP';

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const genId = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });

const extractYouTubeId = url => {
  const m = url?.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return m?.[1] || null;
};

const detectVideoSource = url => {
  if (!url) return 'external';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube';
  if (/instagram\.com/i.test(url)) return 'instagram';
  if (/facebook\.com|fb\.watch/i.test(url)) return 'facebook';
  if (/tiktok\.com/i.test(url)) return 'tiktok';
  if (/vimeo\.com/i.test(url)) return 'vimeo';
  return 'external';
};

const detectTourProvider = url => {
  if (!url) return 'external';
  if (/matterport\.com/i.test(url)) return 'matterport';
  if (/youtube\.com|youtu\.be/i.test(url)) return 'youtube360';
  if (/kuula\.co|roundme\.com|pannellum/i.test(url)) return '360tour';
  return 'external';
};

const ytThumb = url => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

/** Return the IDs that fall within the CARD_LIMIT: featured first, then by sort_order */
const getCardItemIds = (items, limit) => {
  const sorted = [...items].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1;
    if (!a.is_featured && b.is_featured) return 1;
    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
  });
  return new Set(sorted.slice(0, limit).map(i => i.id));
};

/** Migrate old gallery_images + videos into unified media_items */
const initMediaItems = formData => {
  if (Array.isArray(formData?.media_items)) return formData.media_items;
  const items = [];
  (formData?.gallery_images || []).forEach((img, idx) =>
    items.push({
      id: img.id || genId(), type: 'image', source_type: 'upload',
      file: img.file || null, url: img.url || '', thumbnail: null,
      title: img.title || '', caption: img.caption || '', description: img.description || '',
      credit_name: img.credit_name || '', credit_instagram: img.credit_instagram || '', credit_website: img.credit_website || '',
      location: img.location || '', tags: img.tags || [],
      sort_order: img.sort_order ?? idx, is_featured: img.is_featured || false,
    })
  );
  (formData?.videos || []).forEach((v, idx) =>
    items.push({
      id: v.id || genId(), type: 'video', source_type: detectVideoSource(v.url),
      file: null, url: v.url || '', thumbnail: ytThumb(v.url) || null,
      title: v.title || '', caption: v.caption || '', description: '',
      credit_name: v.credit_name || '', credit_instagram: v.credit_instagram || '', credit_website: '',
      location: '', tags: v.tags || [],
      sort_order: (formData?.gallery_images?.length || 0) + idx, is_featured: v.is_featured || false,
    })
  );
  return items;
};

// ─── SHARED STYLES ─────────────────────────────────────────────────────────
const F = {
  width: '100%', padding: '7px 10px', fontSize: 12,
  border: '1px solid #ddd4c8', borderRadius: 3,
  boxSizing: 'border-box', fontFamily: 'inherit',
  backgroundColor: '#fff', color: '#333',
};

// ─── SUB-COMPONENTS ──────────────────────────────────────────────────────────
const SOURCE_META = {
  upload:     { label: 'Upload',     color: '#6B7280', bg: '#F3F4F6' },
  youtube:    { label: 'YouTube',    color: '#DC2626', bg: '#FEF2F2' },
  instagram:  { label: 'Instagram',  color: '#7C3AED', bg: '#F5F3FF' },
  facebook:   { label: 'Facebook',   color: '#2563EB', bg: '#EFF6FF' },
  tiktok:     { label: 'TikTok',     color: '#111827', bg: '#F9FAFB' },
  vimeo:      { label: 'Vimeo',      color: '#1AB7EA', bg: '#F0F9FF' },
  matterport: { label: 'Matterport', color: '#0EA5E9', bg: '#F0F9FF' },
  '360tour':  { label: '360°',       color: '#059669', bg: '#ECFDF5' },
  youtube360: { label: 'YT 360°',    color: '#DC2626', bg: '#FEF2F2' },
  external:   { label: 'External',   color: '#6B7280', bg: '#F9FAFB' },
};
const TYPE_ICONS  = { image: '🖼', video: '▶', virtual_tour: '🌐' };
const TYPE_LABELS = { image: 'Image', video: 'Video', virtual_tour: 'Virtual Tour' };

const SourceBadge = ({ sourceType }) => {
  const m = SOURCE_META[sourceType] || SOURCE_META.external;
  return (
    <span style={{
      fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
      padding: '2px 6px', borderRadius: 3, backgroundColor: m.bg, color: m.color,
    }}>
      {m.label}
    </span>
  );
};

const CardDisplayMeter = ({ mediaItems }) => {
  const count = getCardItemIds(mediaItems, CARD_LIMIT).size;
  const pct   = Math.min((count / CARD_LIMIT) * 100, 100);
  const barClr = count >= CARD_LIMIT ? '#ef4444' : count >= CARD_LIMIT * 0.8 ? '#f59e0b' : '#C9A84C';
  return (
    <div style={{ marginBottom: 18 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4 }}>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#666' }}>Card Display Slots</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: count >= CARD_LIMIT ? '#ef4444' : '#333' }}>
          {count} / {CARD_LIMIT}
        </span>
      </div>
      <div style={{ height: 5, backgroundColor: '#ede9e3', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, backgroundColor: barClr, borderRadius: 3, transition: 'width 0.3s ease' }} />
      </div>
      <p style={{ fontSize: 10, color: '#aaa', margin: '3px 0 0', textAlign: 'right' }}>
        {count < CARD_LIMIT
          ? `${CARD_LIMIT - count} slot${CARD_LIMIT - count === 1 ? '' : 's'} available — featured items shown first`
          : 'All card slots filled — increase sort order or remove featured to shift items out'}
      </p>
    </div>
  );
};

const VideoAddPanel = ({ onAdd }) => {
  const [url, setUrl] = useState('');
  const [err, setErr] = useState('');
  const handle = () => {
    const v = url.trim();
    if (!v) { setErr('Please enter a video URL.'); return; }
    if (!v.startsWith('http')) { setErr('URL must start with http(s)://'); return; }
    onAdd(v); setUrl(''); setErr('');
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="url" value={url}
          onChange={e => { setUrl(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="Paste YouTube, Instagram Reel, TikTok, Facebook, or Vimeo URL…"
          style={{ ...F, flex: 1 }}
        />
        <button type="button" onClick={handle} style={{
          padding: '7px 14px', backgroundColor: '#C9A84C', color: '#fff',
          border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          + Add Video
        </button>
      </div>
      {err && <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0' }}>{err}</p>}
      <p style={{ fontSize: 10, color: '#aaa', margin: '3px 0 0' }}>
        YouTube · Instagram Reels · TikTok · Facebook Video · Vimeo
      </p>
    </div>
  );
};

const VirtualTourAddPanel = ({ onAdd }) => {
  const [url, setUrl] = useState('');
  const [provider, setProvider] = useState('');
  const [err, setErr] = useState('');
  const handle = () => {
    const v = url.trim();
    if (!v) { setErr('Please enter a tour URL.'); return; }
    if (!v.startsWith('http')) { setErr('URL must start with http(s)://'); return; }
    onAdd(v, provider || detectTourProvider(v)); setUrl(''); setProvider(''); setErr('');
  };
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input type="url" value={url}
          onChange={e => { setUrl(e.target.value); setErr(''); }}
          onKeyDown={e => e.key === 'Enter' && handle()}
          placeholder="Paste Matterport, 360° tour, or virtual tour embed URL…"
          style={{ ...F, flex: 1 }}
        />
        <select value={provider} onChange={e => setProvider(e.target.value)}
          style={{ ...F, width: 'auto', flexShrink: 0, cursor: 'pointer' }}
        >
          <option value="">Auto-detect</option>
          <option value="matterport">Matterport</option>
          <option value="360tour">360° Tour</option>
          <option value="youtube360">YouTube 360°</option>
          <option value="external">Other</option>
        </select>
        <button type="button" onClick={handle} style={{
          padding: '7px 14px', backgroundColor: '#059669', color: '#fff',
          border: 'none', borderRadius: 3, fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
        }}>
          + Add Tour
        </button>
      </div>
      {err && <p style={{ fontSize: 11, color: '#dc2626', margin: '3px 0 0' }}>{err}</p>}
      <p style={{ fontSize: 10, color: '#aaa', margin: '3px 0 0' }}>
        Matterport · 360° Tours · YouTube 360° · Interactive Tour embeds
      </p>
    </div>
  );
};

const MediaItemCard = ({ item, objectUrls, onUpdate, onRemove, inCard, cardPosition }) => {
  const [expanded, setExpanded] = useState(false);

  let thumbSrc = null;
  if (item.type === 'image') {
    thumbSrc = item.file instanceof File ? objectUrls[item.id] : (item.url || item.thumbnail || null);
  } else if (item.type === 'video') {
    thumbSrc = item.thumbnail || ytThumb(item.url) || null;
  }

  const isVideo = item.type === 'video';
  const isTour  = item.type === 'virtual_tour';

  return (
    <div style={{
      border: `1px solid ${inCard ? 'rgba(201,168,76,0.35)' : '#e5ddd0'}`,
      borderRadius: 4, marginBottom: 8, overflow: 'hidden',
      backgroundColor: inCard ? '#fffdf7' : '#fdfcfb',
    }}>
      {/* ── Header row (always visible) */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', cursor: 'pointer' }}
        onClick={() => setExpanded(p => !p)}
      >
        {/* Thumbnail */}
        <div style={{
          width: 50, height: 50, borderRadius: 3, overflow: 'hidden',
          backgroundColor: '#f0ebe3', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {thumbSrc
            ? <img src={thumbSrc} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span style={{ fontSize: 22 }}>{TYPE_ICONS[item.type]}</span>
          }
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4, flexWrap: 'wrap' }}>
            <SourceBadge sourceType={item.source_type} />
            {inCard ? (
              <span style={{
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
                padding: '2px 6px', borderRadius: 3, backgroundColor: '#fffbf0', color: '#b8860b',
                border: '1px solid rgba(201,168,76,0.3)',
              }}>
                #{cardPosition} Card
              </span>
            ) : (
              <span style={{
                fontSize: 9, fontWeight: 600, textTransform: 'uppercase',
                padding: '2px 5px', borderRadius: 3, backgroundColor: '#f3f4f6', color: '#9ca3af',
              }}>
                Stored
              </span>
            )}
            {item.is_featured && (
              <span style={{
                fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 3,
                backgroundColor: '#fef3c7', color: '#d97706',
              }}>
                ★ Featured
              </span>
            )}
          </div>
          <p style={{
            fontSize: 12, color: '#444', margin: 0,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {item.title || (item.url || item.file?.name || `${TYPE_LABELS[item.type]}`)}
          </p>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }} onClick={e => e.stopPropagation()}>
          <button type="button" onClick={() => setExpanded(p => !p)} style={{
            fontSize: 10, padding: '4px 8px', backgroundColor: '#f0ebe3', color: '#555',
            border: 'none', borderRadius: 3, cursor: 'pointer',
          }}>
            {expanded ? '▲' : '▼ Edit'}
          </button>
          <button type="button" onClick={() => onRemove(item.id)} style={{
            fontSize: 10, padding: '4px 8px', backgroundColor: '#ffebee', color: '#c62828',
            border: 'none', borderRadius: 3, cursor: 'pointer',
          }}>
            Remove
          </button>
        </div>
      </div>

      {/* ── Expanded metadata form */}
      {expanded && (
        <div style={{ padding: '12px 14px', borderTop: '1px solid #f0ebe3' }}>

          {/* URL display for videos/tours */}
          {(isVideo || isTour) && item.url && (
            <div style={{ marginBottom: 10 }}>
              <label style={{ fontSize: 10, fontWeight: 600, color: '#999', display: 'block', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {isTour ? 'Tour URL' : 'Video URL'}
              </label>
              <div style={{
                padding: '6px 10px', backgroundColor: '#f9f7f3',
                borderRadius: 3, fontSize: 11, color: '#666',
                wordBreak: 'break-all', border: '1px solid #e5ddd0',
              }}>
                {item.url}
              </div>
            </div>
          )}

          {/* Virtual tour embed preview */}
          {isTour && item.url && (
            <div style={{ marginBottom: 12, position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 3, border: '1px solid #e5ddd0' }}>
              <iframe
                src={item.url}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                allowFullScreen
                title="Virtual tour preview"
                loading="lazy"
              />
            </div>
          )}

          {/* Title */}
          <input type="text"
            placeholder={isTour ? 'Tour title (e.g. Full Venue Walkthrough)' : `${TYPE_LABELS[item.type]} title`}
            value={item.title || ''}
            onChange={e => onUpdate(item.id, 'title', e.target.value)}
            style={{ ...F, marginBottom: 8 }}
          />

          {/* Caption */}
          <textarea
            placeholder="Caption (optional)"
            value={item.caption || ''}
            onChange={e => onUpdate(item.id, 'caption', e.target.value)}
            style={{ ...F, marginBottom: 8, minHeight: 52, resize: 'vertical' }}
          />

          {/* Credit row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <input type="text"
              placeholder={isVideo ? 'Videographer name' : isTour ? 'Company / provider' : 'Photographer name'}
              value={item.credit_name || ''}
              onChange={e => onUpdate(item.id, 'credit_name', e.target.value)}
              style={F}
            />
            <input type="text"
              placeholder="@instagram handle"
              value={item.credit_instagram || ''}
              onChange={e => onUpdate(item.id, 'credit_instagram', e.target.value)}
              style={F}
            />
          </div>

          {/* Location */}
          <input type="text"
            placeholder={isTour ? 'Area / floor (e.g. Garden Level)' : 'Location / area (e.g. Grand Ballroom)'}
            value={item.location || ''}
            onChange={e => onUpdate(item.id, 'location', e.target.value)}
            style={{ ...F, marginBottom: 8 }}
          />

          {/* Tags */}
          <input type="text"
            placeholder="Tags (comma-separated, e.g. sunset, ceremony, garden)"
            value={(item.tags || []).join(', ')}
            onChange={e => onUpdate(item.id, 'tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
            style={{ ...F, marginBottom: 10 }}
          />

          {/* Sort order + Featured */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <label style={{ fontSize: 11, color: '#888', whiteSpace: 'nowrap' }}>Sort order</label>
              <input type="number" min={0}
                value={item.sort_order ?? 0}
                onChange={e => onUpdate(item.id, 'sort_order', parseInt(e.target.value, 10) || 0)}
                style={{ ...F, width: 64, padding: '5px 8px' }}
              />
            </div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11, color: '#555' }}>
              <input type="checkbox"
                checked={!!item.is_featured}
                onChange={e => onUpdate(item.id, 'is_featured', e.target.checked)}
              />
              ★ Featured — prioritise in card display slots
            </label>
          </div>
        </div>
      )}
    </div>
  );
};


// ─── HERO LAYOUT PICKER ──────────────────────────────────────────────────────
// 4 hero layout styles matching the public VenueProfile.jsx styles:
//   cinematic  — full-width fade slider, name overlaid at bottom (DEFAULT)
//   split      — image left, info panel right
//   magazine   — image top, title bar below
//   video      — autoplay YouTube / Vimeo background loop

const HERO_LAYOUTS = [
  {
    key: 'cinematic',
    label: 'Cinematic',
    desc: '5-image luxury fade · name over gradient',
    // ASCII-art thumbnail
    thumb: (active) => (
      <svg viewBox="0 0 80 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="46" rx="2" fill={active ? 'rgba(201,168,76,0.1)' : '#f5f3ef'} />
        <rect width="80" height="46" rx="2" fill="url(#cin)" />
        <defs>
          <linearGradient id="cin" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#b0a090" stopOpacity="0.5" />
            <stop offset="100%" stopColor="#3a2a1a" stopOpacity="0.85" />
          </linearGradient>
        </defs>
        {/* Image fill */}
        <rect width="80" height="46" rx="2" fill="#c8b89a" opacity="0.55" />
        {/* Gradient overlay */}
        <rect y="20" width="80" height="26" fill="url(#cin)" />
        {/* Title line */}
        <rect x="8" y="30" width="36" height="4" rx="1" fill="white" opacity="0.85" />
        <rect x="8" y="37" width="20" height="2.5" rx="1" fill="white" opacity="0.5" />
        {/* CTA */}
        <rect x="8" y="40.5" width="18" height="3" rx="1" fill="#C9A84C" opacity="0.9" />
      </svg>
    ),
  },
  {
    key: 'split',
    label: 'Editorial Split',
    desc: 'Image left · info panel right',
    thumb: (active) => (
      <svg viewBox="0 0 80 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="46" rx="2" fill={active ? 'rgba(201,168,76,0.1)' : '#f5f3ef'} />
        {/* Image half */}
        <rect width="46" height="46" rx="2" fill="#c8b89a" opacity="0.7" />
        {/* Info half */}
        <rect x="46" width="34" height="46" fill="#faf9f7" />
        <rect x="46" width="1" height="46" fill="#e5ddd0" />
        {/* Info lines */}
        <rect x="51" y="14" width="20" height="3" rx="1" fill="#C9A84C" opacity="0.7" />
        <rect x="51" y="20" width="24" height="2.5" rx="1" fill="#555" opacity="0.5" />
        <rect x="51" y="24.5" width="18" height="2" rx="1" fill="#888" opacity="0.35" />
        <rect x="51" y="32" width="22" height="4" rx="1" fill="#C9A84C" opacity="0.9" />
      </svg>
    ),
  },
  {
    key: 'magazine',
    label: 'Magazine',
    desc: 'Image top · title bar below',
    thumb: (active) => (
      <svg viewBox="0 0 80 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="46" rx="2" fill={active ? 'rgba(201,168,76,0.1)' : '#f5f3ef'} />
        {/* Image top */}
        <rect width="80" height="28" rx="2" fill="#c8b89a" opacity="0.7" />
        {/* Overlay */}
        <rect width="80" height="28" fill="rgba(0,0,0,0.2)" />
        {/* Title bar */}
        <rect y="28" width="80" height="18" fill="#faf9f7" />
        <rect y="28" width="80" height="1" fill="#e5ddd0" />
        {/* Title + CTA */}
        <rect x="8" y="33" width="30" height="3" rx="1" fill="#333" opacity="0.55" />
        <rect x="52" y="31.5" width="20" height="5" rx="1" fill="#C9A84C" opacity="0.85" />
      </svg>
    ),
  },
  {
    key: 'video',
    label: 'Video Hero',
    desc: 'YouTube / Vimeo loop · requires video URL',
    thumb: (active) => (
      <svg viewBox="0 0 80 46" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
        <rect width="80" height="46" rx="2" fill={active ? 'rgba(201,168,76,0.1)' : '#f5f3ef'} />
        <rect width="80" height="46" rx="2" fill="#2a2018" opacity="0.75" />
        {/* Play icon */}
        <circle cx="40" cy="19" r="9" fill="rgba(201,168,76,0.25)" stroke="#C9A84C" strokeWidth="1" />
        <polygon points="37,15 37,23 46,19" fill="#C9A84C" opacity="0.9" />
        {/* Title line */}
        <rect x="14" y="33" width="32" height="3.5" rx="1" fill="white" opacity="0.75" />
        <rect x="14" y="39" width="18" height="3" rx="1" fill="#C9A84C" opacity="0.85" />
      </svg>
    ),
  },
];

const HeroLayoutPicker = ({ value, onChange, videoUrl, onVideoUrlChange }) => (
  <div style={{ marginBottom: 32 }}>
    <label style={{
      display: 'block', fontSize: 12, fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.04em',
      color: '#1a1a1a', marginBottom: 10,
    }}>
      Hero Layout Style
    </label>

    {/* 4-column grid of style cards */}
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
      {HERO_LAYOUTS.map(({ key, label, desc, thumb }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onChange(key)}
            style={{
              padding: 0, border: `2px solid ${active ? '#C9A84C' : '#e5ddd0'}`,
              borderRadius: 4, backgroundColor: active ? 'rgba(201,168,76,0.06)' : '#fafaf8',
              cursor: 'pointer', textAlign: 'left', overflow: 'hidden',
              transition: 'border-color 0.15s, background-color 0.15s',
              boxShadow: active ? '0 0 0 1px rgba(201,168,76,0.35)' : 'none',
            }}
          >
            {/* Thumbnail */}
            <div style={{ aspectRatio: '80/46', width: '100%', display: 'block' }}>
              {thumb(active)}
            </div>
            {/* Label */}
            <div style={{ padding: '7px 8px 8px' }}>
              <div style={{
                fontSize: 11, fontWeight: 700,
                color: active ? '#9a6f0a' : '#333',
                marginBottom: 2,
              }}>
                {label}
                {key === 'cinematic' && (
                  <span style={{
                    marginLeft: 5, fontSize: 9, fontWeight: 600,
                    color: '#C9A84C', textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>Default</span>
                )}
              </div>
              <div style={{ fontSize: 10, color: '#999', lineHeight: 1.35 }}>{desc}</div>
            </div>
          </button>
        );
      })}
    </div>

    {/* Video URL input — shown only when video layout is selected */}
    {value === 'video' && (
      <div style={{ marginTop: 12 }}>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#555', marginBottom: 5 }}>
          Hero Video URL{' '}
          <span style={{ fontWeight: 400, color: '#aaa' }}>(YouTube or Vimeo — autoplays muted &amp; looped)</span>
        </label>
        <input
          type="url"
          value={videoUrl}
          onChange={e => onVideoUrlChange(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=… or https://vimeo.com/…"
          style={{
            width: '100%', padding: '9px 12px', fontSize: 12,
            border: '1px solid #ddd4c8', borderRadius: 3,
            fontFamily: 'inherit', color: '#333', boxSizing: 'border-box',
          }}
        />
        <p style={{ fontSize: 10, color: '#aaa', margin: '4px 0 0' }}>
          The video plays silently in the background. Hero images are still required as poster fallback.
        </p>
      </div>
    )}
  </div>
);


// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────
const MediaSection = ({ formData, onChange }) => {

  // ── Hero images (separate from media pool) ─────────────────────────────────
  const [heroImages, setHeroImages] = useState(() =>
    Array.isArray(formData?.hero_images) ? formData.hero_images :
    formData?.hero_image?.file ? [formData.hero_image] : []
  );
  const [heroObjUrls, setHeroObjUrls] = useState({});

  useEffect(() => {
    const urls = {};
    heroImages.forEach(img => { if (img?.file instanceof File) urls[img.id] = URL.createObjectURL(img.file); });
    setHeroObjUrls(prev => {
      Object.entries(prev).forEach(([k, u]) => { if (!urls[k] && u?.startsWith('blob:')) URL.revokeObjectURL(u); });
      return urls;
    });
    return () => Object.values(urls).forEach(u => u?.startsWith('blob:') && URL.revokeObjectURL(u));
  }, [heroImages]);

  const handleHeroUpload = e => {
    const files = Array.from(e.target.files || []);
    const rem = MAX_HERO - heroImages.length;
    if (rem <= 0) return;
    const toAdd = files.slice(0, rem).map((file, i) => ({
      id: genId(), file,
      title: '', caption: '', credit_name: '',
      sort_order: heroImages.length + i,
      is_primary: heroImages.length === 0 && i === 0,
    }));
    const updated = [...heroImages, ...toAdd];
    setHeroImages(updated); onChange('hero_images', updated);
    e.target.value = '';
  };
  const updateHero = (id, field, val) => {
    const u = heroImages.map(img => img.id === id ? { ...img, [field]: val } : img);
    setHeroImages(u); onChange('hero_images', u);
  };
  const removeHero = id => {
    const u = heroImages.filter(img => img.id !== id).map((img, i) => ({ ...img, sort_order: i, is_primary: i === 0 }));
    setHeroImages(u); onChange('hero_images', u);
  };

  // ── Unified media_items pool ────────────────────────────────────────────────
  const [mediaItems, setMediaItems] = useState(() => initMediaItems(formData));
  const [activeTab, setActiveTab] = useState('all');

  // Object URLs for uploaded image File objects
  const mediaFileKey = mediaItems
    .filter(i => i.file instanceof File)
    .map(i => `${i.id}:${i.file.name}:${i.file.size}`)
    .join('|');
  const [mediaObjUrls, setMediaObjUrls] = useState({});

  useEffect(() => {
    const urls = {};
    mediaItems.forEach(item => {
      if (item.type === 'image' && item.file instanceof File)
        urls[item.id] = URL.createObjectURL(item.file);
    });
    setMediaObjUrls(prev => {
      Object.entries(prev).forEach(([k, u]) => { if (!urls[k] && u?.startsWith('blob:')) URL.revokeObjectURL(u); });
      return urls;
    });
    return () => Object.values(urls).forEach(u => u?.startsWith('blob:') && URL.revokeObjectURL(u));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaFileKey]);

  const notifyMedia = updated => { setMediaItems(updated); onChange('media_items', updated); };

  const addImages = files => {
    const imgCnt  = mediaItems.filter(i => i.type === 'image').length;
    const rem     = IMAGE_STORAGE_MAX - imgCnt;
    if (rem <= 0) { alert(`Maximum ${IMAGE_STORAGE_MAX} images reached.`); return; }
    const toAdd = Array.from(files).slice(0, rem).map((file, idx) => ({
      id: genId(), type: 'image', source_type: 'upload',
      file, url: '', thumbnail: null,
      title: '', caption: '', description: '',
      credit_name: '', credit_instagram: '', credit_website: '',
      location: '', tags: [], sort_order: mediaItems.length + idx, is_featured: false,
    }));
    notifyMedia([...mediaItems, ...toAdd]);
  };

  const addVideo = url => {
    if (mediaItems.filter(i => i.type === 'video').length >= VIDEO_STORAGE_MAX) {
      alert(`Maximum ${VIDEO_STORAGE_MAX} videos reached.`); return;
    }
    const src = detectVideoSource(url);
    notifyMedia([...mediaItems, {
      id: genId(), type: 'video', source_type: src,
      file: null, url, thumbnail: ytThumb(url) || null,
      title: '', caption: '', description: '',
      credit_name: '', credit_instagram: '', credit_website: '',
      location: '', tags: [], sort_order: mediaItems.length, is_featured: false,
    }]);
  };

  const addTour = (url, provider) => {
    if (mediaItems.filter(i => i.type === 'virtual_tour').length >= VIRTUAL_TOUR_MAX) {
      alert(`Maximum ${VIRTUAL_TOUR_MAX} virtual tours allowed.`); return;
    }
    notifyMedia([...mediaItems, {
      id: genId(), type: 'virtual_tour', source_type: provider || detectTourProvider(url),
      file: null, url, thumbnail: null,
      title: '', caption: '', description: '',
      credit_name: '', credit_instagram: '', credit_website: '',
      location: '', tags: [], sort_order: mediaItems.length, is_featured: false,
      provider: provider || detectTourProvider(url),
    }]);
  };

  const updateItem = (id, field, val) =>
    notifyMedia(mediaItems.map(item => item.id === id ? { ...item, [field]: val } : item));

  const removeItem = id => notifyMedia(mediaItems.filter(item => item.id !== id));

  // Tab counts + filtered view
  const imgCnt  = mediaItems.filter(i => i.type === 'image').length;
  const vidCnt  = mediaItems.filter(i => i.type === 'video').length;
  const tourCnt = mediaItems.filter(i => i.type === 'virtual_tour').length;

  const filtered = activeTab === 'all'    ? mediaItems
    : activeTab === 'images' ? mediaItems.filter(i => i.type === 'image')
    : activeTab === 'videos' ? mediaItems.filter(i => i.type === 'video')
    : mediaItems.filter(i => i.type === 'virtual_tour');

  const cardIds       = getCardItemIds(mediaItems, CARD_LIMIT);
  const cardFiltered  = filtered.filter(i => cardIds.has(i.id));
  const storedFiltered = filtered.filter(i => !cardIds.has(i.id));

  // Build ordered card array for position labelling
  const cardOrdered = [...mediaItems]
    .filter(i => cardIds.has(i.id))
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    });
  const cardPositionOf = id => cardOrdered.findIndex(i => i.id === id) + 1;

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5ddd0' }}>
      <h3 style={{ marginBottom: 6, fontSize: 16, fontWeight: 600, color: '#1a1a1a' }}>Media</h3>
      <p style={{ fontSize: 12, color: '#888', marginTop: 0, marginBottom: 28, lineHeight: 1.5 }}>
        Hero images appear prominently at the top of the listing. Gallery, videos and virtual tours appear in the body.
        The first <strong>{CARD_LIMIT}</strong> media items (by featured status + sort order) are shown in listing cards.
      </p>

      {/* ── HERO LAYOUT STYLE ──────────────────────────────────────────────── */}
      <HeroLayoutPicker
        value={formData?.hero_layout || 'cinematic'}
        onChange={style => onChange('hero_layout', style)}
        videoUrl={formData?.hero_video_url || ''}
        onVideoUrlChange={url => onChange('hero_video_url', url)}
      />

      {/* ── HERO IMAGES ─────────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#333' }}>
            Hero Images{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', color: '#aaa' }}>
              ({heroImages.length} / {MAX_HERO})
            </span>
          </label>
          {heroImages.length > 0 && (
            <span style={{ fontSize: 10, color: '#b8860b', fontWeight: 600 }}>First image = primary hero</span>
          )}
        </div>

        {/* Spec banner */}
        <div style={{
          padding: '8px 12px', backgroundColor: '#fffbf0',
          border: '1px solid rgba(201,168,76,0.25)', borderRadius: 3,
          marginBottom: 12, fontSize: 11, color: '#7a5f10',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <span>📐</span><span>{HERO_SPEC}</span>
        </div>

        {/* Upload zone */}
        {heroImages.length < MAX_HERO && (
          <label style={{
            display: 'block', padding: '12px 16px',
            border: '1px dashed #ddd4c8', borderRadius: 3, cursor: 'pointer',
            textAlign: 'center', fontSize: 13, color: '#888', backgroundColor: '#fdfcfb',
            marginBottom: heroImages.length > 0 ? 16 : 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.backgroundColor = '#fffbf0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd4c8'; e.currentTarget.style.backgroundColor = '#fdfcfb'; }}
          >
            <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>🖼</span>
            <span style={{ fontWeight: 600 }}>
              {heroImages.length === 0 ? 'Upload Hero Image(s)' : `+ Add More (${MAX_HERO - heroImages.length} remaining)`}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: '#bbb', marginTop: 3 }}>Click to browse</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleHeroUpload} style={{ display: 'none' }} />
          </label>
        )}
        {heroImages.length >= MAX_HERO && (
          <div style={{ padding: '8px 12px', backgroundColor: '#f9f7f3', borderRadius: 3, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            Maximum {MAX_HERO} hero images reached
          </div>
        )}

        {/* Hero image cards */}
        {heroImages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {heroImages.map((img, idx) => {
              const src = img.file instanceof File ? heroObjUrls[img.id] : (img.url || null);
              return (
                <div key={img.id} style={{
                  border: `1px solid ${idx === 0 ? 'rgba(201,168,76,0.4)' : '#e5ddd0'}`,
                  borderRadius: 4, overflow: 'hidden', backgroundColor: '#fdfcfb',
                }}>
                  <div style={{ position: 'relative', height: 110, backgroundColor: '#f5f0e8' }}>
                    {src
                      ? <img src={src} alt={img.title || `Hero ${idx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 28 }}>🖼</div>
                    }
                    {idx === 0 && (
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        backgroundColor: 'rgba(201,168,76,0.9)', color: '#fff',
                        fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 10,
                      }}>PRIMARY HERO</span>
                    )}
                    <button type="button" onClick={() => removeHero(img.id)} style={{
                      position: 'absolute', top: 8, right: 8,
                      width: 26, height: 26, borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.5)', color: '#fff',
                      border: 'none', cursor: 'pointer', fontSize: 12,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>✕</button>
                  </div>
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                      <input type="text" placeholder="Image title"
                        value={img.title} onChange={e => updateHero(img.id, 'title', e.target.value)}
                        style={F}
                      />
                      <input type="text" placeholder="Photographer / Credit"
                        value={img.credit_name} onChange={e => updateHero(img.id, 'credit_name', e.target.value)}
                        style={F}
                      />
                    </div>
                    <input type="text" placeholder="Caption (optional)"
                      value={img.caption} onChange={e => updateHero(img.id, 'caption', e.target.value)}
                      style={F}
                    />
                    {img.file && (
                      <p style={{ fontSize: 10, color: '#bbb', marginTop: 5, marginBottom: 0 }}>
                        {img.file.name} · {(img.file.size / 1024 / 1024).toFixed(1)} MB
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── GALLERY, VIDEOS & VIRTUAL TOURS ─────────────────────────────────── */}
      <div style={{ borderTop: '2px solid #e5ddd0', paddingTop: 28 }}>
        <h4 style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', margin: '0 0 16px' }}>
          Gallery · Videos · Virtual Tours
        </h4>

        {/* Card display meter */}
        {mediaItems.length > 0 && <CardDisplayMeter mediaItems={mediaItems} />}

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 16, borderBottom: '1px solid #e5ddd0' }}>
          {[
            { key: 'all',    label: `All (${mediaItems.length})` },
            { key: 'images', label: `Images (${imgCnt})` },
            { key: 'videos', label: `Videos (${vidCnt})` },
            { key: 'tours',  label: `Virtual Tours (${tourCnt})` },
          ].map(tab => (
            <button key={tab.key} type="button" onClick={() => setActiveTab(tab.key)} style={{
              padding: '8px 14px', fontSize: 12,
              fontWeight: activeTab === tab.key ? 600 : 400,
              backgroundColor: 'transparent', border: 'none',
              borderBottom: activeTab === tab.key ? '2px solid #C9A84C' : '2px solid transparent',
              color: activeTab === tab.key ? '#C9A84C' : '#888',
              cursor: 'pointer', marginBottom: -1,
            }}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Add panels */}
        <div style={{ marginBottom: 16 }}>
          {(activeTab === 'all' || activeTab === 'images') && (
            <div style={{ marginBottom: 10 }}>
              <label style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 16px', backgroundColor: '#f9f7f3',
                border: '1px solid #ddd4c8', borderRadius: 3,
                fontSize: 12, fontWeight: 600, color: '#555',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#fffbf0'; e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#C9A84C'; }}
                onMouseLeave={e => { e.currentTarget.style.backgroundColor = '#f9f7f3'; e.currentTarget.style.borderColor = '#ddd4c8'; e.currentTarget.style.color = '#555'; }}
              >
                <span>🖼</span>
                <span>+ Add Gallery Images ({imgCnt} / {IMAGE_STORAGE_MAX})</span>
                <input type="file" accept="image/jpeg,image/png,image/webp" multiple
                  onChange={e => { addImages(e.target.files); e.target.value = ''; }}
                  style={{ display: 'none' }}
                />
              </label>
              <p style={{ fontSize: 10, color: '#aaa', margin: '3px 0 0' }}>{GALLERY_SPEC}</p>
            </div>
          )}
          {(activeTab === 'all' || activeTab === 'videos') && <VideoAddPanel onAdd={addVideo} />}
          {(activeTab === 'all' || activeTab === 'tours') && <VirtualTourAddPanel onAdd={addTour} />}
        </div>

        {/* Items list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '28px 0', color: '#ccc', fontSize: 13 }}>
            No {activeTab === 'all' ? 'media' : activeTab === 'tours' ? 'virtual tours' : activeTab} added yet
          </div>
        ) : (
          <>
            {/* In-card items */}
            {cardFiltered.length > 0 && (
              <div style={{ marginBottom: 8 }}>
                <p style={{ fontSize: 10, fontWeight: 700, color: '#b8860b', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 8px' }}>
                  ★ In Card Display
                </p>
                {cardFiltered
                  .sort((a, b) => {
                    if (a.is_featured && !b.is_featured) return -1;
                    if (!a.is_featured && b.is_featured) return 1;
                    return (a.sort_order ?? 999) - (b.sort_order ?? 999);
                  })
                  .map(item => (
                    <MediaItemCard key={item.id} item={item} objectUrls={mediaObjUrls}
                      onUpdate={updateItem} onRemove={removeItem}
                      inCard={true} cardPosition={cardPositionOf(item.id)} />
                  ))
                }
              </div>
            )}

            {/* Stored items */}
            {storedFiltered.length > 0 && (
              <div>
                {cardFiltered.length > 0 && (
                  <div style={{ borderTop: '1px dashed #ddd4c8', paddingTop: 12, marginBottom: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>
                      Stored — outside card display
                    </p>
                  </div>
                )}
                {storedFiltered.map(item => (
                  <MediaItemCard key={item.id} item={item} objectUrls={mediaObjUrls}
                    onUpdate={updateItem} onRemove={removeItem}
                    inCard={false} cardPosition={null} />
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
};

export default MediaSection;
