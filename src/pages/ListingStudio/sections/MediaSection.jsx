import { useState } from 'react';

const MediaSection = ({ formData, onChange }) => {
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideos, setUploadedVideos] = useState([]);

  const MAX_IMAGES = 50;
  const MAX_VIDEOS = 8;

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newImages = uploadedImages.concat(files);

    if (newImages.length > MAX_IMAGES) {
      alert(`Maximum ${MAX_IMAGES} images allowed. You selected ${newImages.length}.`);
      return;
    }

    setUploadedImages(newImages);
    onChange('gallery_images', newImages); // Pass files to parent
  };

  const handleVideoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    const newVideos = uploadedVideos.concat(files);

    if (newVideos.length > MAX_VIDEOS) {
      alert(`Maximum ${MAX_VIDEOS} videos allowed. You selected ${newVideos.length}.`);
      return;
    }

    setUploadedVideos(newVideos);
    onChange('videos', newVideos); // Pass files to parent
  };

  const removeImage = (index) => {
    const updated = uploadedImages.filter((_, i) => i !== index);
    setUploadedImages(updated);
    onChange('gallery_images', updated);
  };

  const removeVideo = (index) => {
    const updated = uploadedVideos.filter((_, i) => i !== index);
    setUploadedVideos(updated);
    onChange('videos', updated);
  };

  return (
    <section style={{ marginBottom: 40, paddingBottom: 40, borderBottom: '1px solid #e5ddd0' }}>
      <h3 style={{ marginBottom: 20 }}>Media</h3>

      {/* Hero Image Upload */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Hero Image (Main Display Image)
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onChange('hero_image', file);
            }
          }}
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
      </div>

      {/* Gallery Images Upload */}
      <div style={{ marginBottom: 24 }}>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Gallery Images ({uploadedImages.length} / {MAX_IMAGES})
        </label>
        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleImageUpload}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
          Upload up to {MAX_IMAGES} gallery images
        </p>

        {/* Display uploaded images */}
        {uploadedImages.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Uploaded Images ({uploadedImages.length}):
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 8,
              }}
            >
              {uploadedImages.map((file, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    padding: 8,
                    textAlign: 'center',
                    border: '1px solid #ddd4c8',
                  }}
                >
                  <p style={{ fontSize: 10, color: '#666', wordBreak: 'break-word', marginBottom: 4 }}>
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    style={{
                      fontSize: 10,
                      backgroundColor: '#ffebee',
                      color: '#c62828',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: 2,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Videos Upload */}
      <div>
        <label style={{ display: 'block', marginBottom: 6, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>
          Videos ({uploadedVideos.length} / {MAX_VIDEOS})
        </label>
        <input
          type="file"
          accept="video/*"
          multiple
          onChange={handleVideoUpload}
          style={{
            width: '100%',
            padding: '10px 12px',
            fontSize: 13,
            border: '1px solid #ddd4c8',
            borderRadius: 3,
            cursor: 'pointer',
          }}
        />
        <p style={{ fontSize: 12, color: '#999', marginTop: 6 }}>
          Upload up to {MAX_VIDEOS} videos (MP4, WebM, etc.)
        </p>

        {/* Display uploaded videos */}
        {uploadedVideos.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <p style={{ fontSize: 12, fontWeight: 600, marginBottom: 8, color: '#333' }}>
              Uploaded Videos ({uploadedVideos.length}):
            </p>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))',
                gap: 8,
              }}
            >
              {uploadedVideos.map((file, index) => (
                <div
                  key={index}
                  style={{
                    position: 'relative',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 4,
                    padding: 8,
                    textAlign: 'center',
                    border: '1px solid #ddd4c8',
                  }}
                >
                  <p style={{ fontSize: 10, color: '#666', wordBreak: 'break-word', marginBottom: 4 }}>
                    {file.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => removeVideo(index)}
                    style={{
                      fontSize: 10,
                      backgroundColor: '#ffebee',
                      color: '#c62828',
                      border: 'none',
                      padding: '2px 6px',
                      borderRadius: 2,
                      cursor: 'pointer',
                      width: '100%',
                    }}
                  >
                    Remove
                  </button>
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
