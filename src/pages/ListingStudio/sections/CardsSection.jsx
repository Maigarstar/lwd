/**
 * CardsSection, Site Card control for Listing Studio
 *
 * Supports three card types:  Venue Card · Vendor Card · GCard
 *
 * Each card has:
 *   • Header:  title, status pill (On/Off), View action
 *   • Media:   image upload (up to 20, drag-to-reorder)
 *              OR 4 video URL slots / 4 reel URL slots / YouTube / Vimeo
 *   • Title (80 chars), Short Description (160 chars)
 *   • CTA text (40 chars) + CTA link (auto-defaults to listing URL)
 *   • Badges:  admin-only, fully editable labels, add/remove custom badges
 *   • Vendor edit permission toggle
 *
 * Data fields on formData (flat, snake_case):
 *   card_{type}_enabled        boolean
 *   card_{type}_media_type     'image' | 'video' | 'reel' | 'youtube' | 'vimeo'
 *   card_{type}_images         [{id, file, url}]       , uploaded images, max 20
 *   card_{type}_video_urls     string[4]               , 4 video URL slots
 *   card_{type}_reel_urls      string[4]               , 4 reel URL slots
 *   card_{type}_media_url      string                  , YouTube / Vimeo URL
 *   card_{type}_title          string (max 80)
 *   card_{type}_description    string (max 160)
 *   card_{type}_cta_text       string (max 40)
 *   card_{type}_cta_link       string
 *   card_{type}_badges         [{value, label, active}], editable badge list
 *   card_{type}_vendor_edit    boolean
 *
 * Auto-fill (one-time, non-destructive):
 *   On first mount when listing data arrives, empty fields are pre-populated:
 *   venue_name → title · summary → description · hero_images → images
 *   slug → cta_link.  Manual edits never overwritten.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Constants ──────────────────────────────────────────────────────────────────

const MAX_CARD_IMAGES   = 20;
const MAX_VIDEO_SLOTS   = 4;
const MAX_REEL_SLOTS    = 4;
const MAX_FILE_BYTES    = 3 * 1024 * 1024; // 3 MB

const CARD_TYPES = [
  { id: 'venue',  label: 'Venue Card' },
  { id: 'vendor', label: 'Vendor Card' },
  { id: 'gcard',  label: 'GCard' },
];

const MEDIA_TYPES = [
  { value: 'image',   label: 'Image' },
  { value: 'video',   label: 'Video' },
  { value: 'reel',    label: 'Reel' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'vimeo',   label: 'Vimeo' },
];

// Default badge definitions, used as seed when no badge data exists yet.
// value is the internal key; label is displayed and fully editable.
const DEFAULT_BADGES = [
  { value: 'estate_of_month', label: 'Estate of the Month', active: false },
  { value: 'editors_pick',    label: "Editor's Pick",       active: false },
  { value: 'verified',        label: 'Verified',            active: false },
  { value: 'featured',        label: 'Featured',            active: false },
  { value: 'luxury_highlight',label: 'Luxury Highlight',    active: false },
];

// ── Helpers ────────────────────────────────────────────────────────────────────

const genId = () => `cimg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

/**
 * Normalize badge data from any format to [{value, label, active}].
 * Handles:
 *   - undefined / null / empty → DEFAULT_BADGES seed
 *   - legacy string[] format  → maps active flags onto DEFAULT_BADGES
 *   - new object[] format     → returned as-is
 */
const normalizeBadges = (raw) => {
  if (!raw || raw.length === 0) return DEFAULT_BADGES.map(b => ({ ...b }));
  if (typeof raw[0] === 'object') return raw;
  // Legacy: string[] of active values
  return DEFAULT_BADGES.map(b => ({ ...b, active: raw.includes(b.value) }));
};

// ── Shared styles ──────────────────────────────────────────────────────────────

const labelStyle = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
  color: '#1a1a1a',
  marginBottom: 6,
};

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  fontSize: 13,
  lineHeight: 1.5,
  border: '1px solid #ddd4c8',
  borderRadius: 3,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
  color: '#333',
  backgroundColor: '#fff',
};

const hintStyle = {
  fontSize: 10,
  color: '#aaa',
  margin: '4px 0 0',
};

// ── ImgThumb, single image thumbnail (manages its own blob URL) ───────────────

const ImgThumb = ({ img }) => {
  const [src, setSrc] = useState(() => img?.url || '');

  useEffect(() => {
    if (img?.file instanceof File) {
      const url = URL.createObjectURL(img.file);
      setSrc(url);
      return () => URL.revokeObjectURL(url);
    } else {
      setSrc(img?.url || '');
    }
  }, [img?.file, img?.url]);

  if (!src) return <span style={{ fontSize: 16, opacity: 0.3 }}>📷</span>;
  return (
    <img
      src={src}
      alt=""
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      style={{
        width: '100%', height: '100%', objectFit: 'cover', display: 'block',
        pointerEvents: 'none', userSelect: 'none', WebkitUserDrag: 'none',
      }}
    />
  );
};

// ── CardModule, renders a single card type module ────────────────────────────

const CardModule = ({ typeId, label, formData, onChange }) => {
  const [open, setOpen]         = useState(true);
  const [sizeError, setSizeError] = useState('');
  const fileInputRef            = useRef(null);
  const dragIdx                 = useRef(null);
  const dragOverIdx             = useRef(null);

  const prefix = `card_${typeId}_`;
  const get    = (field) => formData?.[prefix + field];

  // ── Derived field values ─────────────────────────────────────────────────────
  const enabled     = get('enabled')     !== false;
  const mediaType   = get('media_type')  || 'image';
  const images      = get('images')      || [];
  const videoUrls   = get('video_urls')  || ['', '', '', ''];
  const reelUrls    = get('reel_urls')   || ['', '', '', ''];
  const mediaUrl    = get('media_url')   || '';
  const title       = get('title')       || '';
  const description = get('description') || '';
  const ctaText     = get('cta_text')    || '';
  const ctaLink     = get('cta_link')    || '';
  const badges      = normalizeBadges(get('badges'));
  const vendorEdit  = get('vendor_edit') || false;

  const set = (field, value) => onChange(prefix + field, value);

  // ── Image upload ─────────────────────────────────────────────────────────────
  const handleImageUpload = useCallback((e) => {
    const files     = Array.from(e.target.files || []);
    if (!files.length) return;

    // ── 3 MB per-file limit ───────────────────────────────────────────────────
    const oversized = files.filter(f => f.size > MAX_FILE_BYTES);
    const valid     = files.filter(f => f.size <= MAX_FILE_BYTES);
    if (oversized.length > 0) {
      setSizeError(
        `${oversized.length} file${oversized.length > 1 ? 's' : ''} ` +
        `exceeded the 3 MB limit and were skipped.`
      );
    }
    if (!valid.length) { e.target.value = ''; return; }

    const current   = get('images') || [];
    const remaining = MAX_CARD_IMAGES - current.length;
    if (remaining <= 0) { e.target.value = ''; return; }
    const toAdd = valid.slice(0, remaining).map(file => ({
      id: genId(), file, url: '',
    }));
    set('images', [...current, ...toAdd]);
    e.target.value = '';
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, prefix]);

  const removeImage = (id) => set('images', images.filter(img => img.id !== id));

  // ── Image drag-to-reorder ─────────────────────────────────────────────────────
  const handleDragStart = (idx) => { dragIdx.current = idx; };
  const handleDragEnter = (idx) => { dragOverIdx.current = idx; };
  const handleDragEnd   = () => {
    const from = dragIdx.current;
    const to   = dragOverIdx.current;
    if (from === null || to === null || from === to) { dragIdx.current = null; dragOverIdx.current = null; return; }
    const arr = [...images];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    set('images', arr);
    dragIdx.current     = null;
    dragOverIdx.current = null;
  };

  // ── Multi-URL helpers ─────────────────────────────────────────────────────────
  const setVideoUrl = (idx, val) => {
    const updated = [...videoUrls];
    updated[idx]  = val;
    set('video_urls', updated);
  };
  const setReelUrl = (idx, val) => {
    const updated = [...reelUrls];
    updated[idx]  = val;
    set('reel_urls', updated);
  };

  // ── Badge helpers ─────────────────────────────────────────────────────────────
  const updateBadge = (idx, field, value) => {
    const updated = [...badges];
    updated[idx]  = { ...updated[idx], [field]: value };
    set('badges', updated);
  };
  const addBadge = () => {
    set('badges', [...badges, { value: `custom_${Date.now()}`, label: '', active: true }]);
  };
  const removeBadge = (idx) => {
    set('badges', badges.filter((_, i) => i !== idx));
  };

  // ── Derived CTA hint ─────────────────────────────────────────────────────────
  const listingType = formData?.listing_type || 'venue';
  const autoCtaLink = formData?.slug
    ? `/${listingType === 'venue' ? 'venues' : 'vendors'}/${formData.slug}`
    : null;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div style={{ marginBottom: 20 }}>

      {/* ── Card Header ───────────────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 16px',
          backgroundColor: '#F8F6F2',
          border: '1px solid #ddd4c8',
          borderRadius: open ? '8px 8px 0 0' : 8,
          borderBottom: open ? 'none' : undefined,
          cursor: 'pointer', userSelect: 'none',
        }}
        onClick={() => setOpen(o => !o)}
      >
        <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{label}</span>

        {/* Status pill */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); set('enabled', !enabled); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '3px 10px', borderRadius: 12, border: 'none',
            backgroundColor: enabled ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.04)',
            color: enabled ? '#8A6A18' : '#999',
            fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
        >
          <span style={{
            width: 6, height: 6, borderRadius: '50%',
            backgroundColor: enabled ? '#C9A84C' : '#bbb',
            transition: 'background-color 0.15s ease',
          }} />
          {enabled ? 'On' : 'Off'}
        </button>

        {/* View action */}
        <button
          type="button"
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: '3px 10px', borderRadius: 12,
            border: '1px solid #ddd4c8', backgroundColor: 'transparent',
            color: '#777', fontSize: 10, fontWeight: 600,
            textTransform: 'uppercase', letterSpacing: '0.04em',
            cursor: 'pointer', transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.color = '#8A6A18'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#ddd4c8'; e.currentTarget.style.color = '#777'; }}
        >
          View
        </button>

        {/* Collapse chevron */}
        <span style={{
          fontSize: 10, color: '#aaa',
          transform: open ? 'rotate(180deg)' : 'rotate(0)',
          transition: 'transform 0.15s ease', display: 'inline-block',
        }}>▼</span>
      </div>

      {/* ── Card Body ─────────────────────────────────────────────────────── */}
      {open && (
        <div style={{
          padding: 20, backgroundColor: '#fff',
          border: '1px solid #ddd4c8', borderTop: 'none',
          borderRadius: '0 0 8px 8px',
          display: 'flex', flexDirection: 'column', gap: 18,
        }}>

          {/* ── MEDIA ──────────────────────────────────────────────────────── */}
          <div>
            <label style={labelStyle}>Media</label>

            {/* Media type tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
              {MEDIA_TYPES.map(mt => (
                <button
                  key={mt.value}
                  type="button"
                  onClick={() => set('media_type', mt.value)}
                  style={{
                    padding: '5px 12px', borderRadius: 4,
                    border: `1px solid ${mediaType === mt.value ? '#C9A84C' : '#ddd4c8'}`,
                    backgroundColor: mediaType === mt.value ? 'rgba(201,168,76,0.10)' : '#fafaf8',
                    color: mediaType === mt.value ? '#7a5c10' : '#666',
                    fontSize: 11, fontWeight: mediaType === mt.value ? 700 : 500,
                    cursor: 'pointer', transition: 'all 0.13s ease',
                  }}
                >
                  {mt.label}
                </button>
              ))}
            </div>

            {/* IMAGE, upload + reorderable grid */}
            {mediaType === 'image' && (
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  multiple
                  onChange={handleImageUpload}
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={images.length >= MAX_CARD_IMAGES}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    width: '100%', padding: '10px 14px',
                    marginBottom: images.length > 0 ? 10 : 0,
                    border: '1.5px dashed #C9A84C', borderRadius: 4,
                    backgroundColor: 'rgba(201,168,76,0.04)',
                    color: images.length >= MAX_CARD_IMAGES ? '#ccc' : '#8A6A18',
                    fontSize: 12, fontWeight: 600,
                    cursor: images.length >= MAX_CARD_IMAGES ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.13s ease', boxSizing: 'border-box',
                  }}
                  onMouseEnter={(e) => { if (images.length < MAX_CARD_IMAGES) e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.09)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.04)'; }}
                >
                  <span style={{ fontSize: 15 }}>+</span>
                  {images.length >= MAX_CARD_IMAGES
                    ? 'Maximum 20 images reached'
                    : `Upload images  ${images.length} / ${MAX_CARD_IMAGES}`}
                </button>
                {images.length < MAX_CARD_IMAGES && (
                  <p style={{ ...hintStyle, marginTop: 4, marginBottom: images.length > 0 ? 8 : 0, color: '#bbb' }}>
                    JPEG · PNG · WebP · Max 3 MB per image
                  </p>
                )}

                {/* 3 MB size error banner */}
                {sizeError && (
                  <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    gap: 8, padding: '7px 10px', marginBottom: 8,
                    backgroundColor: '#fff4f2', border: '1px solid #f5c5bb',
                    borderRadius: 4, fontSize: 11, color: '#b94038',
                  }}>
                    <span>⚠ {sizeError}</span>
                    <button
                      type="button"
                      onClick={() => setSizeError('')}
                      style={{
                        background: 'none', border: 'none',
                        color: '#b94038', fontSize: 13, lineHeight: 1,
                        cursor: 'pointer', padding: '0 2px', flexShrink: 0,
                      }}
                    >×</button>
                  </div>
                )}

                {images.length > 0 && (
                  <>
                    <p style={{ ...hintStyle, marginBottom: 6, color: '#bbb' }}>
                      Drag thumbnails to reorder · First image = primary
                    </p>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(5, 1fr)',
                      gap: 6,
                      marginBottom: 4,
                    }}>
                      {images.map((img, idx) => (
                        <div
                          key={img.id}
                          draggable
                          onDragStart={() => handleDragStart(idx)}
                          onDragEnter={() => handleDragEnter(idx)}
                          onDragEnd={handleDragEnd}
                          onDragOver={(e) => e.preventDefault()}
                          style={{
                            position: 'relative',
                            paddingBottom: '100%',
                            borderRadius: 4,
                            overflow: 'hidden',
                            backgroundColor: '#f0ece6',
                            border: idx === 0 ? '1.5px solid #C9A84C' : '1px solid #ddd4c8',
                            cursor: 'grab',
                          }}
                        >
                          <div style={{
                            position: 'absolute', inset: 0,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <ImgThumb img={img} />
                          </div>

                          {/* Drag handle hint */}
                          <div style={{
                            position: 'absolute', top: 2, left: 2,
                            fontSize: 8, color: 'rgba(255,255,255,0.7)',
                            backgroundColor: 'rgba(0,0,0,0.3)',
                            padding: '1px 3px', borderRadius: 2,
                            pointerEvents: 'none',
                          }}>⠿</div>

                          {/* Primary badge */}
                          {idx === 0 && (
                            <div style={{
                              position: 'absolute', bottom: 2, left: 2,
                              fontSize: 7, fontWeight: 700, color: '#fff',
                              backgroundColor: 'rgba(201,168,76,0.9)',
                              padding: '1px 4px', borderRadius: 2,
                              textTransform: 'uppercase', letterSpacing: '0.05em',
                            }}>Primary</div>
                          )}

                          {/* Remove */}
                          <button
                            type="button"
                            onClick={() => removeImage(img.id)}
                            style={{
                              position: 'absolute', top: 2, right: 2,
                              width: 16, height: 16, borderRadius: '50%',
                              border: 'none', backgroundColor: 'rgba(0,0,0,0.55)',
                              color: '#fff', fontSize: 9, fontWeight: 700,
                              cursor: 'pointer', display: 'flex',
                              alignItems: 'center', justifyContent: 'center', lineHeight: 1,
                            }}
                          >×</button>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                <p style={hintStyle}>JPG, PNG, WebP · Up to {MAX_CARD_IMAGES} images</p>
              </>
            )}

            {/* VIDEO, 4 URL slots */}
            {mediaType === 'video' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: MAX_VIDEO_SLOTS }, (_, i) => (
                  <div key={i}>
                    <label style={{ ...hintStyle, display: 'block', marginBottom: 4, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Video {i + 1}{i === 0 ? ', Primary' : ''}
                    </label>
                    <input
                      type="url"
                      value={videoUrls[i] || ''}
                      onChange={(e) => setVideoUrl(i, e.target.value)}
                      placeholder="https://example.com/video.mp4"
                      style={fieldStyle}
                    />
                  </div>
                ))}
                <p style={hintStyle}>Up to {MAX_VIDEO_SLOTS} video URLs · First non-empty URL = primary</p>
              </div>
            )}

            {/* REEL, 4 URL slots */}
            {mediaType === 'reel' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {Array.from({ length: MAX_REEL_SLOTS }, (_, i) => (
                  <div key={i}>
                    <label style={{ ...hintStyle, display: 'block', marginBottom: 4, color: '#888', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      Reel {i + 1}{i === 0 ? ', Primary' : ''}
                    </label>
                    <input
                      type="url"
                      value={reelUrls[i] || ''}
                      onChange={(e) => setReelUrl(i, e.target.value)}
                      placeholder="https://www.instagram.com/reel/..."
                      style={fieldStyle}
                    />
                  </div>
                ))}
                <p style={hintStyle}>Up to {MAX_REEL_SLOTS} reel URLs · First non-empty URL = primary</p>
              </div>
            )}

            {/* YOUTUBE / VIMEO, single URL */}
            {(mediaType === 'youtube' || mediaType === 'vimeo') && (
              <>
                <input
                  type="url"
                  value={mediaUrl}
                  onChange={(e) => set('media_url', e.target.value)}
                  placeholder={mediaType === 'youtube' ? 'https://www.youtube.com/watch?v=...' : 'https://vimeo.com/...'}
                  style={fieldStyle}
                />
                <p style={hintStyle}>{mediaType === 'youtube' ? 'YouTube' : 'Vimeo'} URL for this card.</p>
              </>
            )}
          </div>

          {/* ── TITLE ──────────────────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Title</label>
              <span style={{ fontSize: 11, color: title.length >= 75 ? '#dc2626' : title.length >= 65 ? '#f59e0b' : '#bbb' }}>
                {title.length} / 80
              </span>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => { if (e.target.value.length <= 80) set('title', e.target.value); }}
              placeholder="Card headline"
              maxLength={80}
              style={fieldStyle}
            />
          </div>

          {/* ── SHORT DESCRIPTION ──────────────────────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Short Description</label>
              <span style={{ fontSize: 11, color: description.length >= 150 ? '#dc2626' : description.length >= 130 ? '#f59e0b' : '#bbb' }}>
                {description.length} / 160
              </span>
            </div>
            <textarea
              value={description}
              onChange={(e) => { if (e.target.value.length <= 160) set('description', e.target.value); }}
              placeholder="A concise description shown on the card"
              maxLength={160}
              style={{ ...fieldStyle, minHeight: 72, resize: 'vertical' }}
            />
          </div>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ ...labelStyle, marginBottom: 0 }}>CTA Text</label>
                <span style={{ fontSize: 11, color: ctaText.length >= 38 ? '#dc2626' : '#bbb' }}>
                  {ctaText.length} / 40
                </span>
              </div>
              <input
                type="text"
                value={ctaText}
                onChange={(e) => { if (e.target.value.length <= 40) set('cta_text', e.target.value); }}
                placeholder="e.g. View Venue"
                maxLength={40}
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>CTA Link</label>
              <input
                type="url"
                value={ctaLink}
                onChange={(e) => set('cta_link', e.target.value)}
                placeholder={autoCtaLink || 'https://...'}
                style={fieldStyle}
              />
              {!ctaLink && autoCtaLink && (
                <p style={{ ...hintStyle, color: '#C9A84C' }}>
                  Auto-default: {autoCtaLink}
                </p>
              )}
            </div>
          </div>

          {/* ── BADGES, fully editable, admin only ────────────────────────── */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <label style={{ ...labelStyle, marginBottom: 0 }}>Badges</label>
              <span style={{
                fontSize: 9, fontWeight: 700, color: '#C9A84C',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                Admin only
              </span>
            </div>

            {/* Badge rows */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {badges.map((badge, idx) => (
                <div
                  key={badge.value || idx}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '6px 10px',
                    backgroundColor: badge.active ? 'rgba(201,168,76,0.06)' : '#fafaf8',
                    border: `1px solid ${badge.active ? '#C9A84C' : '#e8e0d4'}`,
                    borderRadius: 6,
                  }}
                >
                  {/* Active toggle dot */}
                  <button
                    type="button"
                    onClick={() => updateBadge(idx, 'active', !badge.active)}
                    style={{
                      flexShrink: 0,
                      width: 20, height: 20, borderRadius: '50%',
                      border: `2px solid ${badge.active ? '#C9A84C' : '#ccc'}`,
                      backgroundColor: badge.active ? '#C9A84C' : 'transparent',
                      cursor: 'pointer', display: 'flex',
                      alignItems: 'center', justifyContent: 'center',
                      transition: 'all 0.13s ease',
                    }}
                    title={badge.active ? 'Active, click to deactivate' : 'Inactive, click to activate'}
                  >
                    {badge.active && (
                      <span style={{ fontSize: 9, color: '#fff', fontWeight: 700 }}>✓</span>
                    )}
                  </button>

                  {/* Editable label */}
                  <input
                    type="text"
                    value={badge.label}
                    onChange={(e) => updateBadge(idx, 'label', e.target.value)}
                    placeholder="Badge label…"
                    style={{
                      flex: 1,
                      padding: '4px 8px',
                      fontSize: 12,
                      fontWeight: badge.active ? 600 : 400,
                      border: '1px solid transparent',
                      borderRadius: 3,
                      backgroundColor: 'transparent',
                      fontFamily: 'inherit',
                      color: badge.active ? '#7a5c10' : '#777',
                      outline: 'none',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = '#ddd4c8'; e.currentTarget.style.backgroundColor = '#fff'; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = 'transparent'; e.currentTarget.style.backgroundColor = 'transparent'; }}
                  />

                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeBadge(idx)}
                    style={{
                      flexShrink: 0,
                      width: 18, height: 18, borderRadius: '50%',
                      border: 'none', backgroundColor: 'transparent',
                      color: '#bbb', fontSize: 14, fontWeight: 300,
                      cursor: 'pointer', lineHeight: 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.color = '#dc2626'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.color = '#bbb'; }}
                    title="Remove badge"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Add custom badge */}
            <button
              type="button"
              onClick={addBadge}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                marginTop: 8, padding: '5px 12px',
                border: '1px dashed #C9A84C', borderRadius: 6,
                backgroundColor: 'transparent',
                color: '#8A6A18', fontSize: 11, fontWeight: 600,
                cursor: 'pointer', transition: 'background-color 0.13s ease',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(201,168,76,0.07)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; }}
            >
              <span>+</span> Add custom badge
            </button>

            <p style={hintStyle}>
              Click ● to toggle active · Click label to rename · + Add for custom · Badges are admin-controlled only.
            </p>
          </div>

          {/* ── VENDOR EDIT PERMISSION ─────────────────────────────────────── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '12px 16px', backgroundColor: '#fafaf8',
            border: '1px solid #eee8e0', borderRadius: 6,
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a', margin: '0 0 2px' }}>
                Allow vendor to edit card
              </p>
              <p style={{ ...hintStyle, margin: 0 }}>
                Vendor can edit: media, title, description, CTA text, CTA link. Badges remain admin-only.
              </p>
            </div>
            <button
              type="button"
              onClick={() => set('vendor_edit', !vendorEdit)}
              style={{
                flexShrink: 0, marginLeft: 16,
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 12px', borderRadius: 12, border: 'none',
                backgroundColor: vendorEdit ? 'rgba(201,168,76,0.12)' : 'rgba(0,0,0,0.04)',
                color: vendorEdit ? '#8A6A18' : '#999',
                fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em',
                cursor: 'pointer', transition: 'all 0.15s ease',
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: vendorEdit ? '#C9A84C' : '#bbb', transition: 'background-color 0.15s ease' }} />
              {vendorEdit ? 'On' : 'Off'}
            </button>
          </div>

        </div>
      )}
    </div>
  );
};

// ── CardsSection, top-level section component ────────────────────────────────

const CardsSection = ({ formData, onChange }) => {
  // ── Auto-fill from listing data (one-time, non-destructive) ─────────────────
  const hasAutoFilled = useRef(false);

  useEffect(() => {
    if (hasAutoFilled.current) return;
    const hasData = !!(formData?.venue_name || formData?.slug);
    if (!hasData) return;

    hasAutoFilled.current = true;

    const listingType    = formData.listing_type || 'venue';
    const basePath       = listingType === 'venue' ? '/venues/' : '/vendors/';
    const defaultCtaText = listingType === 'venue' ? 'View Venue' : 'View Profile';

    CARD_TYPES.forEach(({ id: type }) => {
      const p = `card_${type}_`;

      if (!formData[`${p}title`]       && formData.venue_name)
        onChange(`${p}title`, formData.venue_name);

      if (!formData[`${p}description`] && formData.summary)
        onChange(`${p}description`, String(formData.summary).slice(0, 160));

      if (!formData[`${p}cta_link`]    && formData.slug)
        onChange(`${p}cta_link`, basePath + formData.slug);

      if (!formData[`${p}cta_text`])
        onChange(`${p}cta_text`, defaultCtaText);

      if (!formData[`${p}images`]?.length && formData.hero_images?.length) {
        const mapped = formData.hero_images.slice(0, MAX_CARD_IMAGES).map(img => ({
          id:   img.id  || genId(),
          file: img.file || null,
          url:  img.url  || '',
        }));
        onChange(`${p}images`, mapped);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData?.venue_name, formData?.slug]);

  return (
    <section style={{
      marginBottom: 16,
      padding: 20,
      borderRadius: 8,
      border: '1px solid rgba(229,221,208,0.4)',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
    }}>

      {/* ── Section header ─────────────────────────────────────────────────── */}
      <div style={{ marginBottom: 24 }}>
        <h3 style={{
          fontSize: 13, fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: '0.08em', color: '#1a1a1a', margin: '0 0 4px',
        }}>
          Site Cards
        </h3>
        <p style={{ fontSize: 12, color: '#999', margin: 0 }}>
          Control how this listing appears on cards across the site, homepage features, category pages, and campaign highlights.
        </p>
      </div>

      {/* ── Card modules ───────────────────────────────────────────────────── */}
      {CARD_TYPES.map(card => (
        <CardModule
          key={card.id}
          typeId={card.id}
          label={card.label}
          formData={formData}
          onChange={onChange}
        />
      ))}

    </section>
  );
};

export default CardsSection;
