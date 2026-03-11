import { useState, useEffect } from 'react';
import { injectProseStyles } from '../utils/proseStyles';
import ImageGallery from '../../../components/profile/ImageGallery';
import VideoGallery from '../../../components/profile/VideoGallery';
import Lightbox from '../../../components/profile/Lightbox';
import { ThemeCtx, LIGHT } from '../../../components/profile/ProfileDesignSystem';
import CardPreviewSection from './CardPreviewSection';

const extractYouTubeId = url => {
  const m = url?.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return m?.[1] || null;
};

const extractVimeoId = url => url?.match(/vimeo\.com\/(?:video\/)?(\d+)/)?.[1] || null;

/**
 * Live preview of the listing as it would appear on the public venue page.
 * Consumes:
 *   - formData.hero_images[]        — hero banner images
 *   - formData.media_items[]        — unified gallery images + videos + virtual tours
 * Falls back to legacy formData.gallery_images / formData.videos when media_items is absent.
 */
const ListingLivePreview = ({ formData }) => {
  const [objectUrls, setObjectUrls] = useState({});
  const [lightboxIdx, setLightboxIdx] = useState(null);

  // Inject shared prose styles for HTML content rendering
  useEffect(() => { injectProseStyles(); }, []);

  // ── Derive the items to display ─────────────────────────────────────────
  const mediaItems  = formData?.media_items ?? null;
  const legacyGallery = formData?.gallery_images ?? [];
  const legacyVideos  = formData?.videos ?? [];

  // Resolve gallery images (prefer unified, fall back to legacy)
  const rawImages = mediaItems
    ? mediaItems.filter(i => i.type === 'image')
    : legacyGallery;

  // Resolve videos (prefer unified, fall back to legacy)
  const rawVideos = mediaItems
    ? mediaItems.filter(i => i.type === 'video')
    : legacyVideos;

  // Resolve virtual tours
  const rawTours = mediaItems
    ? mediaItems.filter(i => i.type === 'virtual_tour')
    : [];

  // ── Object URLs for uploaded File objects ────────────────────────────────
  // Key the dependency on file identity so we only re-run when files change
  const fileKey = [
    ...(formData?.hero_images || []),
    ...rawImages,
  ]
    .filter(i => i?.file instanceof File)
    .map(i => `${i.id || '?'}:${i.file.name}:${i.file.size}`)
    .join('|');

  useEffect(() => {
    const urls = {};

    // Hero images
    (formData?.hero_images || []).forEach(img => {
      if (img?.file instanceof File) urls[`hero_${img.id}`] = URL.createObjectURL(img.file);
    });

    // Gallery images in media_items
    rawImages.forEach(img => {
      if (img?.file instanceof File) urls[img.id] = URL.createObjectURL(img.file);
    });

    setObjectUrls(prev => {
      Object.entries(prev).forEach(([k, u]) => {
        if (!urls[k] && u?.startsWith('blob:')) URL.revokeObjectURL(u);
      });
      return urls;
    });

    return () => Object.values(urls).forEach(u => {
      if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey]);

  // ── Placeholder ─────────────────────────────────────────────────────────
  if (!formData?.venue_name) {
    return (
      <div style={{
        padding: '40px 20px', textAlign: 'center', color: '#999',
        height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <div>
          <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.3 }}>◻</div>
          <p style={{ fontSize: 14, margin: '0 0 8px 0', fontWeight: 500 }}>Live preview will appear here</p>
          <p style={{ fontSize: 12, margin: 0 }}>Start typing a venue name →</p>
        </div>
      </div>
    );
  }

  // ── Resolve primary hero image ───────────────────────────────────────────
  const primaryHero   = (formData?.hero_images || [])[0] || null;
  const heroImageUrl  = primaryHero?.file instanceof File
    ? objectUrls[`hero_${primaryHero.id}`]
    : (primaryHero?.url || null);

  // ── Map images → ImageGallery / Lightbox format ──────────────────────────
  const galleryForDisplay = rawImages
    .map(img => ({
      id: img.id,
      src: img.file instanceof File
        ? objectUrls[img.id]
        : (img.url || img.file || ''),
      alt: img.caption || img.title || '',
      tags: (img.tags || []).filter(Boolean),
      photographer: img.credit_name
        ? { name: img.credit_name, area: img.location || '', instagram: img.credit_instagram || '', website: img.credit_website || '' }
        : null,
    }))
    .filter(img => !!img.src);

  // ── Map videos → VideoGallery format ────────────────────────────────────
  const videosForDisplay = rawVideos
    .filter(v => v.url)
    .map((v, idx) => {
      const ytId    = extractYouTubeId(v.url);
      const vimeoId = extractVimeoId(v.url);
      return {
        id: v.id || `v-${idx}`,
        thumb: ytId ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg` : (v.thumbnail || ''),
        title: v.title || `Video ${idx + 1}`,
        duration: '',
        youtubeId: ytId || undefined,
        vimeoId:   vimeoId || undefined,
        url: !ytId && !vimeoId ? v.url : undefined,
        videographer: v.credit_name
          ? { name: v.credit_name, area: '', instagram: v.credit_instagram || '' }
          : null,
        tags: (v.tags || []).filter(Boolean),
        desc: v.caption || '',
        type: 'wedding',
      };
    });

  const handleLightboxPrev = () =>
    setLightboxIdx(i => (i - 1 + galleryForDisplay.length) % galleryForDisplay.length);
  const handleLightboxNext = () =>
    setLightboxIdx(i => (i + 1) % galleryForDisplay.length);

  return (
    <ThemeCtx.Provider value={LIGHT}>
      <div style={{ position: 'relative', backgroundColor: '#fff', minHeight: '100%' }}>

        {/* DRAFT label */}
        {formData.status === 'draft' && (
          <div style={{
            position: 'sticky', top: 0, zIndex: 100,
            backgroundColor: '#f4a460', color: '#fff',
            padding: '8px 20px', fontSize: '12px', fontWeight: 'bold',
            textAlign: 'center', borderBottom: '1px solid #e8954f',
          }}>
            📝 DRAFT — Not published
          </div>
        )}

        {/* ── HERO IMAGE ───────────────────────────────────────────────── */}
        {heroImageUrl ? (
          <div style={{ position: 'relative', width: '100%', height: '300px', overflow: 'hidden' }}>
            <img src={heroImageUrl} alt={formData.venue_name}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '140px',
              background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)',
            }} />
            <div style={{ position: 'absolute', bottom: 20, left: 20, right: 20 }}>
              <h1 style={{
                fontSize: 26, fontWeight: 400, color: '#fff', margin: 0, lineHeight: 1.2,
                fontFamily: "'Playfair Display', Georgia, serif",
                textShadow: '0 1px 6px rgba(0,0,0,0.5)',
              }}>
                {formData.venue_name}
              </h1>
              {formData.summary && (
                <p style={{
                  fontSize: 13, color: 'rgba(255,255,255,0.92)', margin: '7px 0 0 0',
                  lineHeight: 1.5, fontStyle: 'italic',
                  textShadow: '0 1px 4px rgba(0,0,0,0.5)',
                }}>
                  {formData.summary}
                </p>
              )}
              {(formData.region || formData.country) && (
                <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)', margin: '5px 0 0 0', textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
                  📍 {[formData.city, formData.region, formData.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
        ) : null}

        {/* ── MAIN CONTENT ──────────────────────────────────────────────── */}
        <div style={{ padding: '28px 20px' }}>

          {/* Title block (when no hero image) */}
          {!heroImageUrl && (
            <div style={{ marginBottom: 24 }}>
              <h1 style={{
                fontSize: 28, fontWeight: 600, margin: '0 0 8px 0', color: '#0a0a0a', lineHeight: 1.2,
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                {formData.venue_name}
              </h1>
              {formData.summary && (
                <p style={{
                  fontSize: 14, color: '#444', margin: '0 0 8px 0',
                  lineHeight: 1.6, fontStyle: 'italic',
                  fontFamily: "'Playfair Display', Georgia, serif",
                }}>
                  {formData.summary}
                </p>
              )}
              {(formData.region || formData.country) && (
                <p style={{ fontSize: 13, margin: 0, color: '#888' }}>
                  📍 {[formData.city, formData.region, formData.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          )}

          {/* Summary — shown in body when there IS a hero image (editorial intro before description) */}
          {heroImageUrl && formData.summary && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                fontSize: 14, color: '#444', margin: 0,
                lineHeight: 1.65, fontStyle: 'italic',
                fontFamily: "'Playfair Display', Georgia, serif",
              }}>
                {formData.summary}
              </p>
            </div>
          )}

          {/* Commercial pills */}
          {(formData.price_range || formData.capacity) && (
            <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
              {formData.price_range && (
                <div style={{ padding: '6px 14px', backgroundColor: '#f9f7f3', border: '1px solid #e5ddd0', borderRadius: 20, fontSize: 12, color: '#555' }}>
                  💰 {formData.price_range}
                </div>
              )}
              {formData.capacity && (
                <div style={{ padding: '6px 14px', backgroundColor: '#f9f7f3', border: '1px solid #e5ddd0', borderRadius: 20, fontSize: 12, color: '#555' }}>
                  👥 Up to {formData.capacity} guests
                </div>
              )}
            </div>
          )}

          {/* Description — renders rich HTML from TipTap editor */}
          {formData.description && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 10px 0', color: '#333' }}>
                About This Venue
              </h3>
              <div
                className="ldw-prose-body"
                style={{ padding: 0 }}
                dangerouslySetInnerHTML={{
                  __html: formData.description.startsWith('<')
                    ? formData.description
                    : `<p>${formData.description.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}</p>`,
                }}
              />
            </div>
          )}

          {/* Amenities */}
          {formData.amenities && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 10px 0', color: '#333' }}>
                Features & Amenities
              </h3>
              <p style={{ fontSize: 13, lineHeight: 1.75, color: '#555', margin: 0, whiteSpace: 'pre-wrap' }}>
                {formData.amenities}
              </p>
            </div>
          )}

          {/* Virtual Tours */}
          {rawTours.length > 0 && (
            <div style={{ marginBottom: 28 }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1.2px', margin: '0 0 12px 0', color: '#333' }}>
                🌐 Explore the Venue in 3D
              </h3>
              {rawTours.map((tour, idx) => (
                <div key={tour.id || idx} style={{ marginBottom: 16 }}>
                  {tour.title && (
                    <p style={{ fontSize: 13, fontWeight: 600, color: '#333', margin: '0 0 8px' }}>{tour.title}</p>
                  )}
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: 4, border: '1px solid #e5ddd0' }}>
                    <iframe
                      src={tour.url}
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                      allowFullScreen
                      loading="lazy"
                      title={tour.title || `Virtual Tour ${idx + 1}`}
                    />
                  </div>
                  {(tour.caption || tour.location) && (
                    <p style={{ fontSize: 11, color: '#888', margin: '6px 0 0', fontStyle: 'italic' }}>
                      {[tour.caption, tour.location].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Video Gallery */}
          {videosForDisplay.length > 0 && <VideoGallery videos={videosForDisplay} />}

          {/* Image Gallery + Lightbox */}
          {galleryForDisplay.length > 0 && (
            <>
              <ImageGallery
                gallery={galleryForDisplay}
                onOpenLight={idx => setLightboxIdx(idx)}
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

          {/* SEO Description */}
          {formData.seo_description && (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid #e5ddd0' }}>
              <p style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px', color: '#bbb', margin: '0 0 6px 0' }}>
                SEO Description
              </p>
              <p style={{ fontSize: 12, color: '#888', lineHeight: 1.65, margin: 0, fontStyle: 'italic' }}>
                {formData.seo_description}
              </p>
            </div>
          )}

        </div>

        {/* ── CARD PREVIEW — renders live card preview below the listing page preview */}
        <CardPreviewSection formData={formData} />

      </div>
    </ThemeCtx.Provider>
  );
};

export default ListingLivePreview;
