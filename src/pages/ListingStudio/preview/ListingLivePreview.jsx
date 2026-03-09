import { useState, useEffect } from 'react';

/**
 * Live preview of the listing as it would appear on the public venue page
 * Shows images, videos, and content as user edits
 */
const ListingLivePreview = ({ formData, C }) => {
  const [objectUrls, setObjectUrls] = useState({});

  // Create object URLs for File objects so they can be displayed immediately
  useEffect(() => {
    const urls = {};

    // Hero image
    if (formData?.hero_image?.file instanceof File) {
      urls.hero = URL.createObjectURL(formData.hero_image.file);
    }

    // Gallery images
    if (formData?.gallery_images && Array.isArray(formData.gallery_images)) {
      urls.gallery = formData.gallery_images.map(img => {
        if (img.file instanceof File) {
          return URL.createObjectURL(img.file);
        }
        return img.file || img.url;
      });
    }

    setObjectUrls(urls);

    // Cleanup object URLs on unmount or change
    return () => {
      Object.values(urls).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });

      if (urls.gallery && Array.isArray(urls.gallery)) {
        urls.gallery.forEach(url => {
          if (url && typeof url === 'string' && url.startsWith('blob:')) {
            URL.revokeObjectURL(url);
          }
        });
      }
    };
  }, [formData?.hero_image, formData?.gallery_images]);

  // Show placeholder if no venue name
  if (!formData?.venue_name) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        color: '#999',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div>
          <p style={{ fontSize: 14, margin: '0 0 8px 0' }}>Enter venue details to see preview</p>
          <p style={{ fontSize: 12, margin: 0 }}>Start with a venue name →</p>
        </div>
      </div>
    );
  }

  // Get hero image URL
  const heroImageUrl = formData.hero_image?.file instanceof File
    ? objectUrls.hero
    : formData.hero_image?.file || formData.hero_image;

  // Get gallery image URLs
  const galleryUrls = objectUrls.gallery || [];

  // Get videos
  const videosList = formData.videos || [];

  return (
    <div style={{ position: 'relative', backgroundColor: '#fff' }}>
      {/* DRAFT Label */}
      {formData.status === 'draft' && (
        <div style={{
          position: 'sticky',
          top: 0,
          backgroundColor: '#f4a460',
          color: '#fff',
          padding: '8px 20px',
          fontSize: '12px',
          fontWeight: 'bold',
          textAlign: 'center',
          zIndex: 100,
          borderBottom: '1px solid #e8954f',
        }}>
          📝 DRAFT - Not published
        </div>
      )}

      {/* Hero Image Section */}
      {heroImageUrl && (
        <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
          <img
            src={heroImageUrl}
            alt={formData.venue_name}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </div>
      )}

      {/* Venue Details Section */}
      <div style={{ padding: '30px 20px' }}>
        {/* Title */}
        <h1 style={{
          fontSize: 28,
          fontWeight: 600,
          margin: '0 0 8px 0',
          color: '#000',
          fontFamily: "'Playfair Display', Georgia, serif",
        }}>
          {formData.venue_name}
        </h1>

        {/* Location */}
        {(formData.location || formData.country || formData.region) && (
          <p style={{
            fontSize: 14,
            margin: '0 0 20px 0',
            color: '#666',
          }}>
            📍 {[formData.location, formData.region, formData.country].filter(Boolean).join(', ')}
          </p>
        )}

        {/* Description Section */}
        {formData.description && (
          <div style={{ marginBottom: 30 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px 0',
              color: '#333',
            }}>
              About This Venue
            </h3>
            <p style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: '#555',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {formData.description}
            </p>
          </div>
        )}

        {/* Amenities Section */}
        {formData.amenities && (
          <div style={{ marginBottom: 30 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px 0',
              color: '#333',
            }}>
              Features & Amenities
            </h3>
            <p style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: '#555',
              margin: 0,
              whiteSpace: 'pre-wrap',
            }}>
              {formData.amenities}
            </p>
          </div>
        )}

        {/* Gallery Section */}
        {galleryUrls.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 16px 0',
              color: '#333',
            }}>
              Gallery ({galleryUrls.length})
            </h3>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))',
              gap: '12px',
            }}>
              {galleryUrls.map((url, idx) => (
                <div
                  key={idx}
                  style={{
                    position: 'relative',
                    width: '100%',
                    paddingBottom: '100%',
                    overflow: 'hidden',
                    borderRadius: '4px',
                    backgroundColor: '#f5f5f5',
                  }}
                >
                  <img
                    src={url}
                    alt={`Gallery ${idx + 1}`}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Videos Section */}
        {videosList.length > 0 && (
          <div style={{ marginBottom: 30 }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 16px 0',
              color: '#333',
            }}>
              Videos ({videosList.length})
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {videosList.map((video, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px',
                    backgroundColor: '#f9f7f3',
                    borderRadius: '4px',
                    border: '1px solid #e5ddd0',
                  }}
                >
                  <p style={{
                    fontSize: 12,
                    fontWeight: 600,
                    margin: '0 0 6px 0',
                    color: '#333',
                    wordBreak: 'break-all',
                  }}>
                    {video.title || `Video ${idx + 1}`}
                  </p>
                  <p style={{
                    fontSize: 11,
                    margin: 0,
                    color: '#666',
                    wordBreak: 'break-all',
                  }}>
                    {video.url}
                  </p>
                  {video.caption && (
                    <p style={{
                      fontSize: 11,
                      margin: '6px 0 0 0',
                      color: '#555',
                      fontStyle: 'italic',
                    }}>
                      {video.caption}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Commercial Details Section */}
        {(formData.price_range || formData.capacity) && (
          <div style={{
            padding: '20px',
            backgroundColor: '#f9f7f3',
            borderRadius: '4px',
            marginBottom: 30,
          }}>
            <h3 style={{
              fontSize: 14,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              margin: '0 0 12px 0',
              color: '#333',
            }}>
              Details
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {formData.price_range && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0', color: '#999' }}>
                    Price Range
                  </p>
                  <p style={{ fontSize: 13, margin: 0, color: '#333' }}>
                    {formData.price_range}
                  </p>
                </div>
              )}
              {formData.capacity && (
                <div>
                  <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', margin: '0 0 4px 0', color: '#999' }}>
                    Capacity
                  </p>
                  <p style={{ fontSize: 13, margin: 0, color: '#333' }}>
                    {formData.capacity} guests
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SEO Info (if available) */}
        {formData.seo_description && (
          <div style={{ marginTop: 30, paddingTop: 20, borderTop: '1px solid #e5ddd0' }}>
            <p style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              color: '#999',
              margin: '0 0 8px 0',
            }}>
              SEO Description
            </p>
            <p style={{
              fontSize: 12,
              color: '#666',
              lineHeight: 1.6,
              margin: 0,
            }}>
              {formData.seo_description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ListingLivePreview;
