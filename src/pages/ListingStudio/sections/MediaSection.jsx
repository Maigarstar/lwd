import { useState, useEffect } from 'react';

const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const MediaSection = ({ formData, onChange }) => {
  const MAX_IMAGES = 50;

  // Hero image state (with metadata)
  const [heroImage, setHeroImage] = useState({
    file: null,
    title: '',
    caption: '',
    credit_name: '',
  });

  // Gallery images state (array of media records)
  const [galleryImages, setGalleryImages] = useState([]);

  // Videos state (array of video records)
  const [videos, setVideos] = useState([]);

  // Object URLs for preview
  const [objectUrls, setObjectUrls] = useState({});

  // Initialize from formData if available
  useEffect(() => {
    if (formData?.hero_image) {
      setHeroImage(formData.hero_image);
    }
    if (formData?.gallery_images && Array.isArray(formData.gallery_images)) {
      setGalleryImages(formData.gallery_images);
    }
    if (formData?.videos && Array.isArray(formData.videos)) {
      setVideos(formData.videos);
    }
  }, []);

  // Create object URLs for File objects
  useEffect(() => {
    const urls = {};

    if (heroImage?.file instanceof File) {
      urls.hero = URL.createObjectURL(heroImage.file);
    }

    setObjectUrls(urls);

    return () => {
      Object.values(urls).forEach(url => {
        if (url && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [heroImage?.file]);

  // Hero image upload
  const handleHeroImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setHeroImage(prev => ({ ...prev, file }));
    }
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

  // Update hero image metadata
  const updateHeroImage = (field, value) => {
    const updated = { ...heroImage, [field]: value };
    setHeroImage(updated);
    onChange('hero_image', updated);
  };

  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5ddd0' }}>
      <h3 style={{ marginBottom: 20 }}>Media</h3>

      {/* HERO IMAGE SECTION */}
      <div style={{ marginBottom: 32 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Hero Image (Main Display)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleHeroImageUpload}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>Upload a single hero/featured image</p>

        {/* Hero image metadata */}
        {heroImage?.file && (
          <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f9f7f3', borderRadius: 3 }}>
            <p style={{ fontSize: 11, fontWeight: 600, marginBottom: 8, color: '#333' }}>Hero Image: {heroImage.file.name}</p>

            <input
              type="text"
              placeholder="Title"
              value={heroImage.title}
              onChange={(e) => updateHeroImage('title', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                border: '1px solid #ddd4c8',
                borderRadius: 3,
                marginBottom: 8,
              }}
            />

            <textarea
              placeholder="Caption/Description"
              value={heroImage.caption}
              onChange={(e) => updateHeroImage('caption', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                border: '1px solid #ddd4c8',
                borderRadius: 3,
                minHeight: 60,
                marginBottom: 8,
                fontFamily: 'inherit',
              }}
            />

            <input
              type="text"
              placeholder="Photographer/Credit Name"
              value={heroImage.credit_name}
              onChange={(e) => updateHeroImage('credit_name', e.target.value)}
              style={{
                width: '100%',
                padding: '8px 10px',
                fontSize: 12,
                border: '1px solid #ddd4c8',
                borderRadius: 3,
              }}
            />
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
