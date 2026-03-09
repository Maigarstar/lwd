import { useState, useEffect } from 'react';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const MAX_HERO   = 5;
const HERO_SPEC  = 'Recommended: 1920 × 1080 px (16:9) · Max 5 MB per image · JPG / PNG / WebP';

const MediaSection = ({ formData, onChange }) => {
  const MAX_IMAGES = 50;

  // Hero images — array of up to 5 (replaces single hero_image)
  const [heroImages, setHeroImages] = useState(() =>
    Array.isArray(formData?.hero_images) ? formData.hero_images :
    formData?.hero_image?.file ? [formData.hero_image] : []
  );

  // Gallery images state (array of media records)
  const [galleryImages, setGalleryImages] = useState([]);

  // Videos state (array of video records)
  const [videos, setVideos] = useState([]);

  // Object URLs keyed by image id
  const [objectUrls, setObjectUrls] = useState({});

  // Initialize from formData if available
  useEffect(() => {
    if (formData?.gallery_images && Array.isArray(formData.gallery_images)) {
      setGalleryImages(formData.gallery_images);
    }
    if (formData?.videos && Array.isArray(formData.videos)) {
      setVideos(formData.videos);
    }
  }, []);

  // Create / revoke object URLs for hero File objects
  useEffect(() => {
    const urls = {};
    heroImages.forEach(img => {
      if (img?.file instanceof File) {
        urls[img.id] = URL.createObjectURL(img.file);
      }
    });
    setObjectUrls(prev => {
      // Revoke old blob URLs that are no longer needed
      Object.entries(prev).forEach(([k, u]) => {
        if (!urls[k] && u?.startsWith('blob:')) URL.revokeObjectURL(u);
      });
      return urls;
    });
    return () => Object.values(urls).forEach(u => u?.startsWith('blob:') && URL.revokeObjectURL(u));
  }, [heroImages]);

  // Hero images upload (multiple, max 5 total)
  const handleHeroImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const remaining = MAX_HERO - heroImages.length;
    if (remaining <= 0) return;
    const toAdd = files.slice(0, remaining).map((file, i) => ({
      id: generateUUID(),
      file,
      title: '',
      caption: '',
      credit_name: '',
      sort_order: heroImages.length + i,
      is_primary: heroImages.length === 0 && i === 0,
    }));
    const updated = [...heroImages, ...toAdd];
    setHeroImages(updated);
    onChange('hero_images', updated);
    e.target.value = '';
  };

  const updateHeroImage = (id, field, value) => {
    const updated = heroImages.map(img => img.id === id ? { ...img, [field]: value } : img);
    setHeroImages(updated);
    onChange('hero_images', updated);
  };

  const removeHeroImage = (id) => {
    const updated = heroImages.filter(img => img.id !== id).map((img, i) => ({
      ...img,
      sort_order: i,
      is_primary: i === 0,
    }));
    setHeroImages(updated);
    onChange('hero_images', updated);
  };

  // Gallery images upload
  const handleGalleryImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = [...galleryImages, ...files.map((file, idx) => ({
      id: generateUUID(),
      type: 'image',
      file,
      thumbnail: null,
      title: '',
      caption: '',
      description: '',
      credit_name: '',
      credit_instagram: '',
      credit_website: '',
      location: '',
      tags: [],
      sort_order: galleryImages.length + idx,
      is_featured: false,
    }))];

    if (newImages.length > MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images allowed. You selected ${newImages.length}.`);
      return;
    }

    setGalleryImages(newImages);
    onChange('gallery_images', newImages);
  };

  // Video URL input
  const handleVideoUrlsChange = (e) => {
    const text = e.target.value;
    const urls = text.split('\n').filter(url => url.trim());

    const videoRecords = urls.map((url, idx) => ({
      id: generateUUID(),
      type: 'video',
      url: url.trim(),
      title: '',
      caption: '',
      description: '',
      credit_name: '',
      credit_instagram: '',
      credit_website: '',
      location: '',
      tags: [],
      sort_order: idx,
      is_featured: false,
    }));

    setVideos(videoRecords);
    onChange('videos', videoRecords);
  };

  // Update gallery image metadata
  const updateGalleryImage = (id, field, value) => {
    const updated = galleryImages.map(img =>
      img.id === id ? { ...img, [field]: value } : img
    );
    setGalleryImages(updated);
    onChange('gallery_images', updated);
  };

  // Update video metadata
  const updateVideo = (id, field, value) => {
    const updated = videos.map(video =>
      video.id === id ? { ...video, [field]: value } : video
    );
    setVideos(updated);
    onChange('videos', updated);
  };

  // Remove gallery image
  const removeGalleryImage = (id) => {
    const updated = galleryImages.filter(img => img.id !== id);
    setGalleryImages(updated);
    onChange('gallery_images', updated);
  };

  // Remove video
  const removeVideo = (id) => {
    const updated = videos.filter(video => video.id !== id);
    setVideos(updated);
    onChange('videos', updated);
  };

  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5ddd0' }}>
      <h3 style={{ marginBottom: 20 }}>Media</h3>

      {/* HERO IMAGES SECTION (max 5) */}
      <div style={{ marginBottom: 32 }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
          <label style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
            Hero Images{' '}
            <span style={{ fontWeight: 400, textTransform: 'none', color: '#aaa' }}>
              ({heroImages.length} / {MAX_HERO})
            </span>
          </label>
          {heroImages.length > 0 && (
            <span style={{ fontSize: 10, color: '#7a5f10', fontWeight: 600 }}>
              First image = primary hero
            </span>
          )}
        </div>

        {/* Spec guidance */}
        <div style={{
          padding: '8px 12px',
          backgroundColor: '#fffbf0',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: 3,
          marginBottom: 12,
          fontSize: 11,
          color: '#7a5f10',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}>
          <span>📐</span>
          <span>{HERO_SPEC}</span>
        </div>

        {/* Upload button */}
        {heroImages.length < MAX_HERO && (
          <label style={{
            display: 'block',
            padding: '12px 16px',
            border: '1px dashed #ddd4c8',
            borderRadius: 3,
            cursor: 'pointer',
            textAlign: 'center',
            fontSize: 13,
            color: '#888',
            backgroundColor: '#fdfcfb',
            transition: 'border-color 0.15s, background 0.15s',
            marginBottom: heroImages.length > 0 ? 16 : 0,
          }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = '#C9A84C'; e.currentTarget.style.backgroundColor = '#fffbf0'; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = '#ddd4c8'; e.currentTarget.style.backgroundColor = '#fdfcfb'; }}
          >
            <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>🖼</span>
            <span style={{ fontWeight: 600 }}>
              {heroImages.length === 0 ? 'Upload Hero Image(s)' : `+ Add More (${MAX_HERO - heroImages.length} remaining)`}
            </span>
            <span style={{ display: 'block', fontSize: 11, color: '#bbb', marginTop: 3 }}>
              Click to browse or drag and drop
            </span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              multiple
              onChange={handleHeroImageUpload}
              style={{ display: 'none' }}
            />
          </label>
        )}

        {heroImages.length >= MAX_HERO && (
          <div style={{ padding: '8px 12px', backgroundColor: '#f9f7f3', borderRadius: 3, fontSize: 11, color: '#aaa', textAlign: 'center' }}>
            Maximum of {MAX_HERO} hero images reached
          </div>
        )}

        {/* Hero images list */}
        {heroImages.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {heroImages.map((img, idx) => {
              const previewSrc = img.file instanceof File ? objectUrls[img.id] : (img.url || null);
              return (
                <div key={img.id} style={{
                  border: `1px solid ${idx === 0 ? 'rgba(201,168,76,0.4)' : '#e5ddd0'}`,
                  borderRadius: 4,
                  overflow: 'hidden',
                  backgroundColor: '#fdfcfb',
                }}>
                  {/* Image preview strip */}
                  <div style={{ position: 'relative', height: 120, backgroundColor: '#f5f0e8' }}>
                    {previewSrc ? (
                      <img
                        src={previewSrc}
                        alt={img.title || `Hero ${idx + 1}`}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ccc', fontSize: 28 }}>
                        🖼
                      </div>
                    )}

                    {/* Primary badge */}
                    {idx === 0 && (
                      <span style={{
                        position: 'absolute', top: 8, left: 8,
                        backgroundColor: 'rgba(201,168,76,0.9)',
                        color: '#fff',
                        fontSize: 10, fontWeight: 700,
                        padding: '3px 8px', borderRadius: 10,
                      }}>
                        PRIMARY HERO
                      </span>
                    )}

                    {/* Remove button */}
                    <button
                      type="button"
                      onClick={() => removeHeroImage(img.id)}
                      style={{
                        position: 'absolute', top: 8, right: 8,
                        width: 26, height: 26, borderRadius: '50%',
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        color: '#fff', border: 'none',
                        cursor: 'pointer', fontSize: 12,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Metadata fields */}
                  <div style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 8 }}>
                      <input
                        type="text"
                        placeholder="Image title"
                        value={img.title}
                        onChange={e => updateHeroImage(img.id, 'title', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #ddd4c8', borderRadius: 3, boxSizing: 'border-box' }}
                      />
                      <input
                        type="text"
                        placeholder="Photographer / Credit"
                        value={img.credit_name}
                        onChange={e => updateHeroImage(img.id, 'credit_name', e.target.value)}
                        style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #ddd4c8', borderRadius: 3, boxSizing: 'border-box' }}
                      />
                    </div>
                    <input
                      type="text"
                      placeholder="Caption (optional)"
                      value={img.caption}
                      onChange={e => updateHeroImage(img.id, 'caption', e.target.value)}
                      style={{ width: '100%', padding: '7px 10px', fontSize: 12, border: '1px solid #ddd4c8', borderRadius: 3, boxSizing: 'border-box' }}
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

      {/* GALLERY IMAGES SECTION */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Gallery Images ({galleryImages.length} / {MAX_IMAGES})
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleGalleryImageUpload}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>Upload up to {MAX_IMAGES} gallery images</p>

        {/* Gallery images list */}
        {galleryImages.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: '#333' }}>
              Uploaded Images ({galleryImages.length}):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {galleryImages.map((img, idx) => (
                <div
                  key={img.id}
                  style={{
                    padding: 12,
                    backgroundColor: '#f9f7f3',
                    borderRadius: 3,
                    border: '1px solid #e5ddd0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#333', margin: 0 }}>
                      {idx + 1}. {img.file?.name || 'Image'}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeGalleryImage(img.id)}
                      style={{
                        fontSize: 10,
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: 2,
                        cursor: 'pointer',
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Title"
                    value={img.title}
                    onChange={(e) => updateGalleryImage(img.id, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  />

                  <textarea
                    placeholder="Caption"
                    value={img.caption}
                    onChange={(e) => updateGalleryImage(img.id, 'caption', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      minHeight: 50,
                      marginBottom: 6,
                      fontFamily: 'inherit',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Credit Name"
                    value={img.credit_name}
                    onChange={(e) => updateGalleryImage(img.id, 'credit_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={img.tags.join(', ')}
                    onChange={(e) => updateGalleryImage(img.id, 'tags', e.target.value.split(',').map(t => t.trim()))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11 }}>
                    <input
                      type="checkbox"
                      checked={img.is_featured}
                      onChange={(e) => updateGalleryImage(img.id, 'is_featured', e.target.checked)}
                    />
                    <span>Featured Image</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* VIDEOS SECTION */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Videos (Links Only - YouTube & Vimeo)
        </label>
        <textarea
          placeholder="Paste video URLs here, one per line. Example: https://youtube.com/watch?v=..."
          value={videos.map(v => v.url).join('\n')}
          onChange={handleVideoUrlsChange}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            minHeight: 80,
            fontFamily: 'inherit',
          }}
        />
        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
          Paste YouTube, Vimeo, or other video URLs. One URL per line.
        </p>

        {/* Videos list */}
        {videos.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 12, color: '#333' }}>
              Added Videos ({videos.length}):
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {videos.map((video, idx) => (
                <div
                  key={video.id}
                  style={{
                    padding: 12,
                    backgroundColor: '#f9f7f3',
                    borderRadius: 3,
                    border: '1px solid #e5ddd0',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: 8 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#333', margin: 0, wordBreak: 'break-all' }}>
                      {idx + 1}. {video.url}
                    </p>
                    <button
                      type="button"
                      onClick={() => removeVideo(video.id)}
                      style={{
                        fontSize: 10,
                        backgroundColor: '#ffebee',
                        color: '#c62828',
                        border: 'none',
                        padding: '4px 8px',
                        borderRadius: 2,
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                    >
                      Remove
                    </button>
                  </div>

                  <input
                    type="text"
                    placeholder="Video Title"
                    value={video.title}
                    onChange={(e) => updateVideo(video.id, 'title', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  />

                  <textarea
                    placeholder="Caption/Description"
                    value={video.caption}
                    onChange={(e) => updateVideo(video.id, 'caption', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      minHeight: 50,
                      marginBottom: 6,
                      fontFamily: 'inherit',
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Videographer/Credit Name"
                    value={video.credit_name}
                    onChange={(e) => updateVideo(video.id, 'credit_name', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  />

                  <input
                    type="text"
                    placeholder="Tags (comma-separated)"
                    value={video.tags.join(', ')}
                    onChange={(e) => updateVideo(video.id, 'tags', e.target.value.split(',').map(t => t.trim()))}
                    style={{
                      width: '100%',
                      padding: '6px 8px',
                      fontSize: 11,
                      border: '1px solid #ddd4c8',
                      borderRadius: 2,
                      marginBottom: 6,
                    }}
                  />

                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: 11 }}>
                    <input
                      type="checkbox"
                      checked={video.is_featured}
                      onChange={(e) => updateVideo(video.id, 'is_featured', e.target.checked)}
                    />
                    <span>Featured Video</span>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default MediaSection;
