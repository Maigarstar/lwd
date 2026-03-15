/**
 * BackgroundMediaControl, Premium background media picker
 * Supports: up to 10 rotating images, videos, YouTube, Vimeo
 *
 * Data model:
 * {
 *   backgroundType: 'image' | 'video_upload' | 'youtube' | 'vimeo',
 *   backgroundImages: [{ url, alt, type, fileName, size }, ...] (max 10 images for carousel),
 *   backgroundVideo: { url, type (mp4|webm|mov), duration },
 *   backgroundVideoUrl: 'youtube or vimeo URL',
 *   backgroundPosterImage: { url, alt },
 *   autoplay: boolean,
 *   muted: boolean,
 *   loop: boolean,
 * }
 */

import { useState, useRef } from 'react';

const MEDIA_TYPES = [
  { id: 'image', label: 'Image Upload', icon: '🖼️' },
  { id: 'video_upload', label: 'Video Upload', icon: '🎬' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'vimeo', label: 'Vimeo', icon: '▶️' },
];

const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm', 'mov'];

// File size limits
const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export default function BackgroundMediaControl({ section, onChange, C, NU }) {
  // ── Hooks must come before any conditional return (Rules of Hooks) ────────────
  const dragIdx     = useRef(null);
  const dragOverIdx = useRef(null);
  const vidDragIdx     = useRef(null);
  const vidDragOverIdx = useRef(null);

  if (!section) return null;

  const bgData = section.backgroundData || {};
  const mediaType = bgData.backgroundType || 'image';

  // ── Image drag-to-reorder ─────────────────────────────────────────────────────
  const handleImgDragStart = (idx) => { dragIdx.current = idx; };
  const handleImgDragEnter = (idx) => { dragOverIdx.current = idx; };
  const handleImgDragEnd   = () => {
    const from = dragIdx.current;
    const to   = dragOverIdx.current;
    dragIdx.current     = null;
    dragOverIdx.current = null;
    if (from === null || to === null || from === to) return;
    const arr = [...(bgData.backgroundImages || [])];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(section.id, 'backgroundData', { ...bgData, backgroundImages: arr });
  };

  // ── Video drag-to-reorder ─────────────────────────────────────────────────────
  const handleVidDragStart = (idx) => { vidDragIdx.current = idx; };
  const handleVidDragEnter = (idx) => { vidDragOverIdx.current = idx; };
  const handleVidDragEnd   = () => {
    const from = vidDragIdx.current;
    const to   = vidDragOverIdx.current;
    vidDragIdx.current     = null;
    vidDragOverIdx.current = null;
    if (from === null || to === null || from === to) return;
    const arr = [...(bgData.backgroundVideos || [])];
    const [moved] = arr.splice(from, 1);
    arr.splice(to, 0, moved);
    onChange(section.id, 'backgroundData', { ...bgData, backgroundVideos: arr });
  };

  const handleMediaTypeChange = (type) => {
    onChange(section.id, 'backgroundData', {
      ...bgData,
      backgroundType: type,
    });
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentImages = bgData.backgroundImages || [];
    if (currentImages.length >= 10) {
      alert('Maximum 10 hero images allowed. Please remove some images before adding more.');
      return;
    }

    const newImages = [...currentImages];
    let filesProcessed = 0;

    files.forEach((file, index) => {
      if (newImages.length >= 10) {
        alert(`Can only add ${10 - currentImages.length} more image(s). Skipping remaining.`);
        return;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      if (!SUPPORTED_IMAGE_FORMATS.includes(ext)) {
        alert(`Unsupported format for ${file.name}. Supported: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE) {
        alert(`${file.name} too large. Max: ${MAX_IMAGE_SIZE / 1024 / 1024}MB. Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        newImages.push({
          url: event.target.result,
          alt: file.name.split('.')[0],
          type: ext,
          fileName: file.name,
          size: file.size,
        });

        filesProcessed++;
        if (filesProcessed === files.length) {
          onChange(section.id, 'backgroundData', {
            ...bgData,
            backgroundType: 'image',
            backgroundImages: newImages,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Remove image from carousel
  const handleRemoveImage = (index) => {
    const newImages = (bgData.backgroundImages || []).filter((_, i) => i !== index);
    onChange(section.id, 'backgroundData', {
      ...bgData,
      backgroundImages: newImages,
    });
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const currentVideos = bgData.backgroundVideos || [];
    if (currentVideos.length >= 10) {
      alert('Maximum 10 hero videos allowed. Please remove some videos before adding more.');
      return;
    }

    const newVideos = [...currentVideos];
    let filesProcessed = 0;

    files.forEach((file) => {
      if (newVideos.length >= 10) {
        alert(`Can only add ${10 - currentVideos.length} more video(s). Skipping remaining.`);
        return;
      }

      const ext = file.name.split('.').pop().toLowerCase();
      if (!SUPPORTED_VIDEO_FORMATS.includes(ext)) {
        alert(`Unsupported format for ${file.name}. Supported: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
        return;
      }

      if (file.size > MAX_VIDEO_SIZE) {
        alert(`${file.name} too large. Max: ${MAX_VIDEO_SIZE / 1024 / 1024}MB. Size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        newVideos.push({
          url: event.target.result,
          type: ext,
          fileName: file.name,
          size: file.size,
          isUrl: false,
        });

        filesProcessed++;
        if (filesProcessed === files.length) {
          onChange(section.id, 'backgroundData', {
            ...bgData,
            backgroundType: 'video_upload',
            backgroundVideos: newVideos,
            autoplay: true,
            muted: true,
            loop: true,
          });
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // Add video URL to playlist
  const handleVideoUrlAdd = (url) => {
    if (!url.trim()) return;
    const currentVideos = bgData.backgroundVideos || [];
    if (currentVideos.length >= 10) {
      alert('Maximum 10 hero videos allowed.');
      return;
    }

    const newVideos = [
      ...currentVideos,
      { url: url.trim(), type: 'url', isUrl: true, fileName: 'Video URL' }
    ];

    onChange(section.id, 'backgroundData', {
      ...bgData,
      backgroundType: 'video_upload',
      backgroundVideos: newVideos,
      autoplay: true,
      muted: true,
      loop: true,
    });
  };

  // Remove video from carousel
  const handleRemoveVideo = (index) => {
    const newVideos = (bgData.backgroundVideos || []).filter((_, i) => i !== index);
    onChange(section.id, 'backgroundData', {
      ...bgData,
      backgroundVideos: newVideos,
    });
  };

  const handleVideoUrlChange = (url) => {
    onChange(section.id, 'backgroundData', {
      ...bgData,
      backgroundVideoUrl: url,
    });
  };

  const handleAutoplayChange = (value) => {
    onChange(section.id, 'backgroundData', {
      ...bgData,
      autoplay: value,
    });
  };

  const handleMutedChange = (value) => {
    onChange(section.id, 'backgroundData', {
      ...bgData,
      muted: value,
    });
  };

  const handleLoopChange = (value) => {
    onChange(section.id, 'backgroundData', {
      ...bgData,
      loop: value,
    });
  };

  return (
    <div style={{ backgroundColor: C.card, borderRadius: 4, padding: 12 }}>
      {/* Media Type Selector */}
      <div style={{ marginBottom: 16 }}>
        <p style={{ fontFamily: NU, fontSize: 9, fontWeight: 600, color: C.grey, textTransform: 'uppercase', margin: '0 0 8px 0' }}>
          Background Media Type
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {MEDIA_TYPES.map((type) => (
            <button
              key={type.id}
              onClick={() => handleMediaTypeChange(type.id)}
              style={{
                fontFamily: NU,
                fontSize: 10,
                fontWeight: 600,
                padding: '8px 12px',
                border: `1px solid ${mediaType === type.id ? C.gold : C.border}`,
                backgroundColor: mediaType === type.id ? C.gold : 'transparent',
                color: mediaType === type.id ? '#fff' : C.grey2,
                borderRadius: 3,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
              }}
              onMouseEnter={(e) => {
                if (mediaType !== type.id) {
                  e.currentTarget.style.backgroundColor = `${C.gold}22`;
                }
              }}
              onMouseLeave={(e) => {
                if (mediaType !== type.id) {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }
              }}
            >
              <span>{type.icon}</span> {type.label}
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload, Up to 10 images for carousel */}
      {mediaType === 'image' && (
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Hero Images (Carousel, max 10)
          </label>
          <div style={{
            border: `2px dashed ${C.border}`,
            borderRadius: 4,
            padding: 16,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            opacity: (bgData.backgroundImages || []).length >= 10 ? 0.5 : 1,
            pointerEvents: (bgData.backgroundImages || []).length >= 10 ? 'none' : 'auto',
          }}>
            <input
              type="file"
              multiple
              accept={SUPPORTED_IMAGE_FORMATS.map(f => `.${f}`).join(',')}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
              disabled={(bgData.backgroundImages || []).length >= 10}
            />
            <label
              htmlFor="image-upload"
              style={{
                display: 'block',
                cursor: (bgData.backgroundImages || []).length >= 10 ? 'not-allowed' : 'pointer',
                fontFamily: NU,
                fontSize: 12,
                color: C.grey2,
              }}
            >
              📁 Click to upload or drag and drop
              <div style={{ fontSize: 10, color: C.grey, marginTop: 4 }}>
                {(bgData.backgroundImages || []).length}/10 images loaded
                <br />
                Supported: {SUPPORTED_IMAGE_FORMATS.join(', ').toUpperCase()}
                <br />
                Max size: {MAX_IMAGE_SIZE / 1024 / 1024}MB per image
              </div>
            </label>
          </div>

          {/* Image Carousel Display, drag to reorder */}
          {(bgData.backgroundImages || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              {bgData.backgroundImages.length > 1 && (
                <p style={{
                  fontFamily: NU, fontSize: 9, color: C.grey,
                  margin: '0 0 6px 0', fontStyle: 'italic',
                }}>
                  ↕ Drag thumbnails to reorder · First image = primary
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                {bgData.backgroundImages.map((img, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); handleImgDragStart(index); }}
                    onDragEnter={(e) => { e.stopPropagation(); handleImgDragEnter(index); }}
                    onDragEnd={(e) => { e.stopPropagation(); handleImgDragEnd(); }}
                    onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onDrop={(e) => e.stopPropagation()}
                    style={{
                      position: 'relative',
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: index === 0
                        ? `2px solid ${C.gold}`
                        : `1px solid ${C.border}`,
                      cursor: 'grab',
                      transition: 'opacity 0.15s ease',
                    }}
                    title={`${index + 1}. ${img.fileName}, drag to reorder`}
                  >
                    <img
                      src={img.url}
                      alt={img.alt}
                      draggable={false}
                      onDragStart={(e) => e.preventDefault()}
                      style={{
                        width: '100%',
                        height: 80,
                        objectFit: 'cover',
                        pointerEvents: 'none',
                        userSelect: 'none',
                        WebkitUserDrag: 'none',
                      }}
                    />
                    <button
                      draggable={false}
                      onClick={() => handleRemoveImage(index)}
                      title="Remove image"
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 20,
                        height: 20,
                        padding: 0,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.8)'; }}
                    >
                      ×
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: index === 0 ? C.gold : '#fff',
                        fontSize: 9,
                        padding: '2px 4px',
                        borderRadius: 2,
                        fontWeight: 700,
                      }}
                    >
                      {index === 0 ? '★' : index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Video Carousel, Upload or URL (max 10) */}
      {mediaType === 'video_upload' && (
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Hero Videos (Carousel, max 10)
          </label>
          {/* Upload Videos */}
          <div style={{
            border: `2px dashed ${C.border}`,
            borderRadius: 4,
            padding: 16,
            textAlign: 'center',
            cursor: 'pointer',
            opacity: (bgData.backgroundVideos || []).length >= 10 ? 0.5 : 1,
            pointerEvents: (bgData.backgroundVideos || []).length >= 10 ? 'none' : 'auto',
          }}>
            <input
              type="file"
              multiple
              accept={SUPPORTED_VIDEO_FORMATS.map(f => `.${f}`).join(',')}
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
              id="video-upload"
              disabled={(bgData.backgroundVideos || []).length >= 10}
            />
            <label
              htmlFor="video-upload"
              style={{
                display: 'block',
                cursor: (bgData.backgroundVideos || []).length >= 10 ? 'not-allowed' : 'pointer',
                fontFamily: NU,
                fontSize: 12,
                color: C.grey2,
              }}
            >
              🎬 Click to upload videos
              <div style={{ fontSize: 10, color: C.grey, marginTop: 4 }}>
                {(bgData.backgroundVideos || []).length}/10 videos loaded
              </div>
              <div style={{ fontSize: 10, color: C.grey, marginTop: 4 }}>
                Supported: {SUPPORTED_VIDEO_FORMATS.join(', ').toUpperCase()}
                <br />
                Max size: {MAX_VIDEO_SIZE / 1024 / 1024}MB
              </div>
            </label>
          </div>

          {/* Add Video URL */}
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
            <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              Or Add Video URL
            </label>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <input
                type="url"
                placeholder="Paste video URL (MP4, WebM, YouTube link, etc.)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleVideoUrlAdd(e.target.value);
                    e.target.value = '';
                  }
                }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  fontFamily: NU,
                  fontSize: 12,
                  border: `1px solid ${C.border}`,
                  borderRadius: 3,
                  backgroundColor: C.black,
                  color: C.white,
                  boxSizing: 'border-box',
                }}
              />
              <button
                onClick={(e) => {
                  const input = e.currentTarget.previousElementSibling;
                  handleVideoUrlAdd(input.value);
                  input.value = '';
                }}
                style={{
                  padding: '8px 12px',
                  backgroundColor: C.gold,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 3,
                  cursor: 'pointer',
                  fontFamily: NU,
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                Add
              </button>
            </div>
          </div>

          {/* Video Carousel Display, drag to reorder */}
          {(bgData.backgroundVideos || []).length > 0 && (
            <div style={{ marginTop: 12 }}>
              {bgData.backgroundVideos.length > 1 && (
                <p style={{
                  fontFamily: NU, fontSize: 9, color: C.grey,
                  margin: '0 0 6px 0', fontStyle: 'italic',
                }}>
                  ↕ Drag to reorder · First video plays first
                </p>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: 8 }}>
                {bgData.backgroundVideos.map((vid, index) => (
                  <div
                    key={index}
                    draggable
                    onDragStart={(e) => { e.stopPropagation(); handleVidDragStart(index); }}
                    onDragEnter={(e) => { e.stopPropagation(); handleVidDragEnter(index); }}
                    onDragEnd={(e) => { e.stopPropagation(); handleVidDragEnd(); }}
                    onDragOver={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onDrop={(e) => e.stopPropagation()}
                    style={{
                      position: 'relative',
                      borderRadius: 4,
                      overflow: 'hidden',
                      border: index === 0
                        ? `2px solid ${C.gold}`
                        : `1px solid ${C.border}`,
                      backgroundColor: C.card,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      height: 80,
                      cursor: 'grab',
                      transition: 'opacity 0.15s ease',
                    }}
                    title={`${index + 1}. ${vid.fileName || vid.url}, drag to reorder`}
                  >
                    <span style={{ fontSize: 24, pointerEvents: 'none', userSelect: 'none' }}>🎬</span>
                    <button
                      onClick={() => handleRemoveVideo(index)}
                      title="Remove video"
                      style={{
                        position: 'absolute',
                        top: 2,
                        right: 2,
                        width: 20,
                        height: 20,
                        padding: 0,
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255, 0, 0, 0.8)',
                        color: '#fff',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 12,
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 0, 0, 0.8)'; }}
                    >
                      ×
                    </button>
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 2,
                        left: 2,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        color: index === 0 ? C.gold : '#fff',
                        fontSize: 9,
                        padding: '2px 4px',
                        borderRadius: 2,
                        fontWeight: 700,
                      }}
                    >
                      {index === 0 ? '★' : index + 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Settings */}
          <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bgData.autoplay !== false}
                onChange={(e) => handleAutoplayChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>Autoplay</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bgData.muted !== false}
                onChange={(e) => handleMutedChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>Muted</span>
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={bgData.loop !== false}
                onChange={(e) => handleLoopChange(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span style={{ fontFamily: NU, fontSize: 11, color: C.grey2 }}>Loop</span>
            </label>
          </div>
        </div>
      )}

      {/* YouTube */}
      {mediaType === 'youtube' && (
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            YouTube URL
          </label>
          <input
            type="text"
            value={bgData.backgroundVideoUrl || ''}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            style={{
              width: '100%',
              padding: '8px 10px',
              fontFamily: NU,
              fontSize: 12,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              backgroundColor: C.black,
              color: C.white,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 10, color: C.grey, marginTop: 6 }}>
            Use full YouTube URL (youtube.com/watch?v=...) or short URL (youtu.be/...)
          </div>
        </div>
      )}

      {/* Vimeo */}
      {mediaType === 'vimeo' && (
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Vimeo URL
          </label>
          <input
            type="text"
            value={bgData.backgroundVideoUrl || ''}
            onChange={(e) => handleVideoUrlChange(e.target.value)}
            placeholder="https://vimeo.com/..."
            style={{
              width: '100%',
              padding: '8px 10px',
              fontFamily: NU,
              fontSize: 12,
              border: `1px solid ${C.border}`,
              borderRadius: 3,
              backgroundColor: C.black,
              color: C.white,
              boxSizing: 'border-box',
            }}
          />
          <div style={{ fontSize: 10, color: C.grey, marginTop: 6 }}>
            Use full Vimeo URL (vimeo.com/...)
          </div>
        </div>
      )}

      {/* Storage Note */}
      <div style={{
        marginTop: 12,
        paddingTop: 12,
        borderTop: `1px solid ${C.border}`,
        fontFamily: NU,
        fontSize: 9,
        color: C.grey,
        fontStyle: 'italic',
      }}>
        📦 Uploaded media: Stored as data URLs (Phase 2+: will migrate to Supabase Storage)
      </div>
    </div>
  );
}
