/**
 * BackgroundMediaControl — Premium background media picker
 * Supports: uploaded images, uploaded videos, YouTube, Vimeo
 *
 * Data model:
 * {
 *   backgroundType: 'image' | 'video_upload' | 'youtube' | 'vimeo',
 *   backgroundImage: { url, alt, type (jpg|png|webp|gif|svg) },
 *   backgroundVideo: { url, type (mp4|webm|mov), duration },
 *   backgroundVideoUrl: 'youtube or vimeo URL',
 *   backgroundPosterImage: { url, alt },
 *   autoplay: boolean,
 *   muted: boolean,
 *   loop: boolean,
 * }
 */

import { useState } from 'react';

const MEDIA_TYPES = [
  { id: 'image', label: 'Image Upload', icon: '🖼️' },
  { id: 'video_upload', label: 'Video Upload', icon: '🎬' },
  { id: 'youtube', label: 'YouTube', icon: '▶️' },
  { id: 'vimeo', label: 'Vimeo', icon: '▶️' },
];

const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
const SUPPORTED_VIDEO_FORMATS = ['mp4', 'webm', 'mov'];

// File size limits
const MAX_IMAGE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_VIDEO_SIZE = 500 * 1024 * 1024; // 500 MB

export default function BackgroundMediaControl({ section, onChange, C, NU }) {
  if (!section) return null;

  const bgData = section.backgroundData || {};
  const mediaType = bgData.backgroundType || 'image';

  const handleMediaTypeChange = (type) => {
    onChange(section.id, 'backgroundData', {
      ...bgData,
      backgroundType: type,
    });
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_IMAGE_FORMATS.includes(ext)) {
      alert(`Unsupported image format. Supported: ${SUPPORTED_IMAGE_FORMATS.join(', ')}`);
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      alert(`Image too large. Max size: ${MAX_IMAGE_SIZE / 1024 / 1024}MB. File size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Read file as data URL (for now, Phase 2+ will use Supabase storage)
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(section.id, 'backgroundData', {
        ...bgData,
        backgroundType: 'image',
        backgroundImage: {
          url: event.target.result,
          alt: file.name.split('.')[0],
          type: ext,
          fileName: file.name,
          size: file.size,
        },
      });
    };
    reader.readAsDataURL(file);
  };

  const handleVideoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (!SUPPORTED_VIDEO_FORMATS.includes(ext)) {
      alert(`Unsupported video format. Supported: ${SUPPORTED_VIDEO_FORMATS.join(', ')}`);
      return;
    }

    if (file.size > MAX_VIDEO_SIZE) {
      alert(`Video too large. Max size: ${MAX_VIDEO_SIZE / 1024 / 1024}MB. File size: ${(file.size / 1024 / 1024).toFixed(1)}MB`);
      return;
    }

    // Read file as data URL (for now, Phase 2+ will use Supabase storage)
    const reader = new FileReader();
    reader.onload = (event) => {
      onChange(section.id, 'backgroundData', {
        ...bgData,
        backgroundType: 'video_upload',
        backgroundVideo: {
          url: event.target.result,
          type: ext,
          fileName: file.name,
          size: file.size,
        },
        autoplay: true,
        muted: true,
        loop: true,
      });
    };
    reader.readAsDataURL(file);
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

      {/* Image Upload */}
      {mediaType === 'image' && (
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Upload Image
          </label>
          <div style={{
            border: `2px dashed ${C.border}`,
            borderRadius: 4,
            padding: 16,
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
          }}>
            <input
              type="file"
              accept={SUPPORTED_IMAGE_FORMATS.map(f => `.${f}`).join(',')}
              onChange={handleImageUpload}
              style={{ display: 'none' }}
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              style={{
                display: 'block',
                cursor: 'pointer',
                fontFamily: NU,
                fontSize: 12,
                color: C.grey2,
              }}
            >
              📁 Click to upload or drag and drop
              <div style={{ fontSize: 10, color: C.grey, marginTop: 4 }}>
                Supported: {SUPPORTED_IMAGE_FORMATS.join(', ').toUpperCase()}
                <br />
                Max size: {MAX_IMAGE_SIZE / 1024 / 1024}MB
              </div>
            </label>
          </div>
          {bgData.backgroundImage?.fileName && (
            <div style={{ marginTop: 8, fontFamily: NU, fontSize: 11, color: C.grey2 }}>
              ✓ {bgData.backgroundImage.fileName} ({(bgData.backgroundImage.size / 1024).toFixed(1)} KB)
            </div>
          )}
          {bgData.backgroundImage?.url && (
            <div style={{ marginTop: 8 }}>
              <img
                src={bgData.backgroundImage.url}
                alt="preview"
                style={{
                  maxWidth: '100%',
                  maxHeight: 120,
                  borderRadius: 3,
                  border: `1px solid ${C.border}`,
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Video Upload */}
      {mediaType === 'video_upload' && (
        <div style={{ marginBottom: 16, paddingTop: 12, borderTop: `1px solid ${C.border}` }}>
          <label style={{ fontFamily: NU, fontSize: 10, fontWeight: 600, color: C.grey2, textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>
            Upload Video
          </label>
          <div style={{
            border: `2px dashed ${C.border}`,
            borderRadius: 4,
            padding: 16,
            textAlign: 'center',
            cursor: 'pointer',
          }}>
            <input
              type="file"
              accept={SUPPORTED_VIDEO_FORMATS.map(f => `.${f}`).join(',')}
              onChange={handleVideoUpload}
              style={{ display: 'none' }}
              id="video-upload"
            />
            <label
              htmlFor="video-upload"
              style={{
                display: 'block',
                cursor: 'pointer',
                fontFamily: NU,
                fontSize: 12,
                color: C.grey2,
              }}
            >
              🎬 Click to upload video
              <div style={{ fontSize: 10, color: C.grey, marginTop: 4 }}>
                Supported: {SUPPORTED_VIDEO_FORMATS.join(', ').toUpperCase()}
                <br />
                Max size: {MAX_VIDEO_SIZE / 1024 / 1024}MB
              </div>
            </label>
          </div>
          {bgData.backgroundVideo?.fileName && (
            <div style={{ marginTop: 8, fontFamily: NU, fontSize: 11, color: C.grey2 }}>
              ✓ {bgData.backgroundVideo.fileName} ({(bgData.backgroundVideo.size / 1024 / 1024).toFixed(1)} MB)
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
