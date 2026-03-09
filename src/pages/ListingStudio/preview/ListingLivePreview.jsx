import { useState, useEffect } from 'react';
import ImageGallery from '../../../components/profile/ImageGallery';
import VideoGallery from '../../../components/profile/VideoGallery';
import Lightbox from '../../../components/profile/Lightbox';
import { ThemeCtx, LIGHT } from '../../../components/profile/ProfileDesignSystem';

/**
 * Extract YouTube video ID from any YouTube URL format
 */
const extractYouTubeId = (url) => {
  const match = url?.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return match?.[1] || null;
};

/**
 * Extract Vimeo video ID from any Vimeo URL format
 */
const extractVimeoId = (url) => {
  const match = url?.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match?.[1] || null;
};

/**
 * Live preview of the listing as it would appear on the public venue page.
 * Uses the real ImageGallery, VideoGallery, and Lightbox components.
 * Wraps in ThemeCtx.Provider so gallery components use the LIGHT theme.
 */
const ListingLivePreview = ({ formData }) => {
  const [objectUrls, setObjectUrls] = useState({});
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Create object URLs keyed by image ID so we can reference them in gallery mapping
  useEffect(() => {
    const urls = {};

    // Hero image
    if (formData?.hero_image?.file instanceof File) {
      urls['__hero__'] = URL.createObjectURL(formData.hero_image.file);
    }

    // Gallery images — keyed by item ID
    if (formData?.gallery_images && Array.isArray(formData.gallery_images)) {
      formData.gallery_images.forEach(img => {
        if (img.file instanceof File) {
          urls[img.id] = URL.createObjectURL(img.file);
        }
      });
    }

    setObjectUrls(urls);

    // Cleanup all blob URLs on unmount or dependency change
    return () => {
      Object.values(urls).forEach(url => {
        if (url && typeof url === 'string' && url.startsWith('blob:')) {
          URL.revokeObjectURL(url);
        }
      });
    };
  }, [formData?.hero_image, formData?.gallery_images]);

  // Show placeholder if no venue name entered yet
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
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◻</div>
          <p style={{ fontSize: 14, margin: '0 0 8px 0', fontWeight: 500 }}>
            Live preview will appear here
          </p>
          <p style={{ fontSize: 12, margin: 0 }}>Start typing a venue name →</p>
        </div>
      </div>
    );
  }

  // Resolve hero image URL
  const heroImageUrl = formData.hero_image?.file instanceof File
    ? objectUrls['__hero__']
    : formData.hero_image?.file || formData.hero_image;

  // Map gallery_images → ImageGallery / Lightbox format: {id, src, alt, tags, photographer}
  const galleryForDisplay = (formData?.gallery_images || [])
    .map(img => ({
      id: img.id,
      src: img.file instanceof File
        ? objectUrls[img.id]
        : (img.url || img.file || ''),
      alt: img.caption || img.title || '',
      tags: (img.tags || []).filter(Boolean),
      photographer: img.credit_name
        ? {
            name: img.credit_name,
            area: img.location || '',
            instagram: img.credit_instagram || '',
            website: img.credit_website || '',
          }
        : null,
    }))
    .filter(img => !!img.src);

  // Map videos → VideoGallery format: {id, thumb, title, duration, youtubeId, vimeoId, url, videographer, tags, desc, type}
  const videosForDisplay = (formData?.videos || [])
    .filter(v => v.url)
    .map((v, idx) => {
      const ytId = extractYouTubeId(v.url);
      const vimeoId = extractVimeoId(v.url);
      return {
        id: v.id || `v-${idx}`,
        thumb: ytId
          ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
          : '',
        title: v.title || `Video ${idx + 1}`,
        duration: '',
        youtubeId: ytId || undefined,
        vimeoId: vimeoId || undefined,
        url: !ytId && !vimeoId ? v.url : undefined,
        videographer: v.credit_name
          ? {
              name: v.credit_name,
              area: '',
              instagram: v.credit_instagram || '',
            }
          : null,
        tags: (v.tags || []).filter(Boolean),
        desc: v.caption || '',
        type: 'wedding',
      };
    });

  // Lightbox navigation handlers
  const handleLightboxPrev = () =>
    setLightboxIdx(i => (i - 1 + galleryForDisplay.length) % galleryForDisplay.length);
  const handleLightboxNext = () =>
    setLightboxIdx(i => (i + 1) % galleryForDisplay.length);

  return (
    <ThemeCtx.Provider value={LIGHT}>
      <div style={{ position: 'relative', backgroundColor: '#fff', minHeight: '100%' }}>

        {/* DRAFT label — sticky at top of preview panel */}
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
            📝 DRAFT — Not published
          </div>
        )}

        {/* ── HERO IMAGE ──────────────────────────────────── */}
        {heroImageUrl ? (
          <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
            <img
              src={heroImageUrl}
              alt={formData.venue_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            {/* Gradient overlay for title readability */}
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '140px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
            }} />
            {/* Venue name + location overlaid on hero */}
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
              <h1 style={{
                fontSize: 26,
                fontWeight: 400,
                color: '#fff',
                fontFamily: "'Playfair Display', Georgia, serif",
                margin: 0,
                textShadow: '0 1px 6px rgba(0,0,0,0.5)',
                lineHeight: 1.2,
              }}>
                {formData.venue_name}
              </h1>
              {(formData.location || formData.country || formData.region) && (
                <p style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.85)',
                  margin: '5px 0 0 0',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}>
                  📍 {[formData.location, formData.region, formData.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── MAIN CONTENT ──────────────────────────────── */}
        <div style={{ padding: '28px 20px' }}>

          {/* Title block (only shown when no hero image) */}
          {!heroImageUrl && (
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontSize: 28,
                fontWeight: 600,
                margin: '0 0 6px 0',
                color: '#0a0a0a',
                fontFamily: "'Playfair Display', Georgia, serif",
                lineHeight: 1.2,
              }}>
                {formData.venue_name}
              </h1>
              {(formData.location || formData.country || formData.region) && (
                <p style={{ fontSize: 14, margin: 0, color: '#666' }}>
                  📍 {[formData.location, formData.region, formData.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Commercial Details pill row */}
          {(formData.price_range || formData.capacity) && (
            <div style={{
              display: 'flex',
              gap: 12,
              marginBottom: 24,
              flexWrap: 'wrap',
            }}>
              {formData.price_range && (
                <div style={{
                  padding: '6px 14px',
                  backgroundColor: '#f9f7f3',
                  border: '1px solid #e5ddd0',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#555',
                }}>
                  💰 {formData.price_range}
                </div>
              )}
              {formData.capacity && (
                <div style={{
                  padding: '6px 14px',
                  backgroundColor: '#f9f7f3',
                  border: '1px solid #e5ddd0',
                  borderRadius: 20,
                  fontSize: 12,
                  color: '#555',
                }}>
                  👥 Up to {formData.capacity} guests
                </div>
              )}
            </div>
          )}

          {/* Description */}
          {formData.description && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                margin: '0 0 10px 0',
                color: '#333',
              }}>
                About This Venue
              </h3>
              <p style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: '#555',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {formData.description}
              </p>
            </div>
          )}

          {/* Amenities / Features */}
          {formData.amenities && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1.2px',
                margin: '0 0 10px 0',
                color: '#333',
              }}>
                Features & Amenities
              </h3>
              <p style={{
                fontSize: 13,
                lineHeight: 1.75,
                color: '#555',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}>
                {formData.amenities}
              </p>
            </div>
          )}

          {/* ── REAL VideoGallery component ─────────────── */}
          {videosForDisplay.length > 0 && (
            <VideoGallery videos={videosForDisplay} />
          )}

          {/* ── REAL ImageGallery + Lightbox ───────────── */}
          {galleryForDisplay.length > 0 && (
            <>
              <ImageGallery
                gallery={galleryForDisplay}
                onOpenLight={(idx) => setLightboxIdx(idx)}
              />
              <Lightbox
                gallery={galleryForDisplay}
                idx={lightboxIdx}
                onClose={() => setLightboxIdx(null)}
                onPrev={handleLightboxPrev}
                onNext={handleLightboxNext}
                setLightIdx={setLightboxIdx}
              />
            </>
          )}

          {/* SEO Description (editorial info) */}
          {formData.seo_description && (
            <div style={{
              marginTop: 24,
              paddingTop: 20,
              borderTop: '1px solid #e5ddd0',
            }}>
              <p style={{
                fontSize: 11,
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '1px',
                color: '#bbb',
                margin: '0 0 6px 0',
              }}>
                SEO Description
              </p>
              <p style={{
                fontSize: 12,
                color: '#888',
                lineHeight: 1.65,
                margin: 0,
                fontStyle: 'italic',
              }}>
                {formData.seo_description}
              </p>
            </div>
          )}

        </div>
      </div>
    </ThemeCtx.Provider>
  );
};

export default ListingLivePreview;
