/**
 * CardPreviewSection — Live card preview block for ListingLivePreview
 *
 * Renders the actual LuxuryVenueCard, LuxuryVendorCard, and GCard components
 * using the current formData + card override fields from CardsSection.
 * Placed additively at the bottom of the listing live preview pane.
 *
 * Data resolution priority (per card):
 *   1. card_{type}_images[]      — uploaded card-specific images
 *   2. card_{type}_media_url     — single image URL (legacy / URL fallback)
 *   3. formData.hero_images[]    — listing hero images (auto-fill fallback)
 *
 * Quick View:
 *   Manages its own quickViewItem state. QuickViewModal is rendered here so
 *   all three card types share one modal instance.
 *
 * This file is purely additive — no existing code was changed.
 */

import { useState, useEffect } from 'react';
import LuxuryVenueCard  from '../../../components/cards/LuxuryVenueCard';
import LuxuryVendorCard from '../../../components/cards/LuxuryVendorCard';
import GCard            from '../../../components/cards/GCard';
import QuickViewModal   from '../../../components/modals/QuickViewModal';
import { buildCardImgs } from '../../../utils/mediaMappers';

// ── Resolve a single image object to a URL string ─────────────────────────────
// Handles File objects via a per-object blob URL approach.
// Used only for building the imgs[] array; see useBlobUrls below.
const resolveUrl = (img, blobMap) => {
  if (!img) return '';
  if (img.file instanceof File) return blobMap[img.id] || '';
  return img.url || img.src || '';
};

// ── useBlobUrls — create and revoke blob URLs for all File objects ─────────────
// Accepts a deduplicated array of image objects.  Creates one blob URL per
// unique File and revokes stale URLs when the set changes.
function useBlobUrls(images) {
  const [blobMap, setBlobMap] = useState({});

  // Build a stable dependency key from the File identities
  const fileKey = images
    .filter(i => i?.file instanceof File)
    .map(i => `${i.id}:${i.file.size}`)
    .join('|');

  useEffect(() => {
    const created = {};
    images.forEach(img => {
      if (img?.file instanceof File && !created[img.id]) {
        created[img.id] = URL.createObjectURL(img.file);
      }
    });

    setBlobMap(prev => {
      // Revoke any URLs that are no longer needed
      Object.entries(prev).forEach(([k, u]) => {
        if (!created[k] && u?.startsWith('blob:')) URL.revokeObjectURL(u);
      });
      return created;
    });

    return () => {
      Object.values(created).forEach(u => {
        if (u?.startsWith('blob:')) URL.revokeObjectURL(u);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileKey]);

  return blobMap;
}

// ── Get the first active badge label for use as card tag ──────────────────────
// Handles both new [{value,label,active}] format and legacy string[] format.
const badgeToTag = (badges = []) => {
  if (!badges.length) return undefined;
  // New format: [{value, label, active}]
  if (typeof badges[0] === 'object') {
    const first = badges.find(b => b.active && b.label?.trim());
    return first?.label?.trim() || undefined;
  }
  // Legacy string[] format
  if (badges.includes('estate_of_month')) return 'Estate of the Month';
  if (badges.includes('editors_pick'))    return "Editor's Pick";
  if (badges.includes('luxury_highlight')) return 'Luxury Highlight';
  if (badges.includes('featured'))        return 'Featured';
  return undefined;
};

// ── Check if verified badge is active ─────────────────────────────────────────
const isVerified = (badges = []) => {
  if (!badges.length) return false;
  if (typeof badges[0] === 'object') return badges.some(b => b.value === 'verified' && b.active);
  return badges.includes('verified');
};

// ── Get primary video URL from video_urls array ────────────────────────────────
const getPrimaryVideoUrl = (videoUrls = []) =>
  videoUrls.find(u => u && u.trim()) || undefined;

// ── Build a resolved string[] of image URLs for a card ───────────────────────
const buildImgs = (cardImages, heroImages, mediaUrl, mediaType, blobMap) => {
  // 1. Card-specific uploaded images
  if (cardImages?.length > 0) {
    return cardImages.map(img => resolveUrl(img, blobMap)).filter(Boolean);
  }
  // 2. Single image URL (legacy or URL-type entry)
  if (mediaType === 'image' && mediaUrl) {
    return [mediaUrl];
  }
  // 3. Fallback to listing hero images
  if (heroImages?.length > 0) {
    return heroImages.map(img => resolveUrl(img, blobMap)).filter(Boolean);
  }
  return [];
};

// ── CardPreviewSection ────────────────────────────────────────────────────────

export default function CardPreviewSection({ formData }) {
  const [quickViewItem, setQuickViewItem] = useState(null);

  const get = (type, field) => formData?.[`card_${type}_${field}`];

  const heroImages   = formData?.hero_images  || [];
  const mediaItems   = formData?.media_items  || [];   // full gallery
  const venueImages  = get('venue',  'images') || [];
  const vendorImages = get('vendor', 'images') || [];
  const gcardImages  = get('gcard',  'images') || [];

  // ── Collect all unique File-based images for a single blob URL pass ─────────
  // Include media_items so buildCardImgs() can resolve blob URLs for uploaded files.
  const allFileImages = (() => {
    const seen = new Set();
    const out  = [];
    [...heroImages, ...mediaItems, ...venueImages, ...vendorImages, ...gcardImages].forEach(img => {
      if (img?.file instanceof File && !seen.has(img.id)) {
        seen.add(img.id);
        out.push(img);
      }
    });
    return out;
  })();

  const blobMap = useBlobUrls(allFileImages);

  // ── Shared listing fields ────────────────────────────────────────────────────
  const listingType = formData?.listing_type || 'venue';
  const basePath    = listingType === 'venue' ? '/venues/' : '/vendors/';
  const listingUrl  = formData?.slug ? `${basePath}${formData.slug}` : '#';

  // amenities can be a string (newline-separated) or an array (from DB JSONB)
  const amenityLines = (() => {
    const raw = formData?.amenities;
    if (!raw) return [];
    if (Array.isArray(raw)) return raw.map(s => String(s).trim()).filter(Boolean).slice(0, 5);
    return String(raw).split('\n').map(s => s.trim()).filter(Boolean).slice(0, 5);
  })();

  // ── Build per-card v objects ──────────────────────────────────────────────────

  // ── Shared media fallback: rich objects from the full gallery ──────────────
  // Used when no card-section-specific images have been configured.
  const mediaCardImgs = buildCardImgs(mediaItems, blobMap);

  // VENUE CARD
  const venueEnabled   = get('venue', 'enabled') !== false;
  const venueBadges    = get('venue', 'badges')    || [];
  const venueImgs      = (() => {
    const imgs = buildImgs(venueImages, heroImages, get('venue', 'media_url'), get('venue', 'media_type') || 'image', blobMap);
    return imgs.length > 0 ? imgs : mediaCardImgs;   // fallback → media gallery
  })();
  const venueVideoUrl  = getPrimaryVideoUrl(get('venue', 'video_urls') || []);
  const venueV = {
    id:        'studio-preview-venue',
    name:      get('venue', 'title')       || formData?.venue_name || '',
    desc:      get('venue', 'description') || formData?.summary    || '',
    city:      formData?.city    || '',
    region:    formData?.region  || '',
    country:   formData?.country || '',
    imgs:      venueImgs,
    videoUrl:  venueVideoUrl,
    priceFrom: formData?.price_range || '',
    capacity:  formData?.capacity   || '',
    verified:  isVerified(venueBadges),
    tag:       badgeToTag(venueBadges),
    styles:    [formData?.category].filter(Boolean),
    rating:    0,
    reviews:   0,
    online:    true,
    lat:       formData?.lat ? parseFloat(formData.lat) : undefined,
    lng:       formData?.lng ? parseFloat(formData.lng) : undefined,
    includes:  amenityLines,
    slug:      formData?.slug,
    url:       get('venue', 'cta_link') || listingUrl,
  };

  // VENDOR CARD
  const vendorEnabled  = get('vendor', 'enabled') !== false;
  const vendorBadges   = get('vendor', 'badges')   || [];
  const vendorImgs     = (() => {
    const imgs = buildImgs(vendorImages, heroImages, get('vendor', 'media_url'), get('vendor', 'media_type') || 'image', blobMap);
    return imgs.length > 0 ? imgs : mediaCardImgs;   // fallback → media gallery
  })();
  const vendorVideoUrl = getPrimaryVideoUrl(get('vendor', 'video_urls') || []);
  const vendorV = {
    id:          'studio-preview-vendor',
    name:        get('vendor', 'title')       || formData?.venue_name || '',
    desc:        get('vendor', 'description') || formData?.summary    || '',
    description: get('vendor', 'description') || formData?.summary    || '',
    city:        formData?.city    || '',
    region:      formData?.region  || '',
    country:     formData?.country || '',
    imgs:        vendorImgs,
    videoUrl:    vendorVideoUrl,
    priceFrom:   formData?.price_range || '',
    capacity:    formData?.capacity   || '',
    verified:    isVerified(vendorBadges),
    tag:         badgeToTag(vendorBadges),
    specialties: [formData?.category].filter(Boolean),
    styles:      [formData?.category].filter(Boolean),
    rating:      0,
    reviews:     0,
    online:      true,
    lat:         formData?.lat ? parseFloat(formData.lat) : undefined,
    lng:         formData?.lng ? parseFloat(formData.lng) : undefined,
    includes:    amenityLines,
    cat:         formData?.category || '',
    slug:        formData?.slug,
    url:         get('vendor', 'cta_link') || listingUrl,
  };

  // GCARD
  const gcardEnabled   = get('gcard', 'enabled') !== false;
  const gcardBadges    = get('gcard', 'badges')   || [];
  const gcardImgs      = (() => {
    const imgs = buildImgs(gcardImages, heroImages, get('gcard', 'media_url'), get('gcard', 'media_type') || 'image', blobMap);
    return imgs.length > 0 ? imgs : mediaCardImgs;   // fallback → media gallery
  })();
  const gcardV = {
    id:       'studio-preview-gcard',
    name:     get('gcard', 'title')       || formData?.venue_name || '',
    desc:     get('gcard', 'description') || formData?.summary    || '',
    city:     formData?.city   || '',
    region:   formData?.region || '',
    imgs:     gcardImgs.length > 0 ? gcardImgs : [''],
    priceFrom: formData?.price_range || '',
    capacity:  formData?.capacity   || '',
    verified:  isVerified(gcardBadges),
    tag:       badgeToTag(gcardBadges),
    styles:    [formData?.category].filter(Boolean),
    rating:    0,
    reviews:   0,
    online:    true,
    lat:       formData?.lat ? parseFloat(formData.lat) : undefined,
    lng:       formData?.lng ? parseFloat(formData.lng) : undefined,
    includes:  amenityLines,
    slug:      formData?.slug,
    url:       get('gcard', 'cta_link') || listingUrl,
  };

  // Don't render if no name yet
  const hasName = !!(formData?.venue_name);
  const hasAny  = hasName && (venueEnabled || vendorEnabled || gcardEnabled);
  if (!hasAny) return null;

  return (
    <>
      {/* ── SECTION DIVIDER & HEADER ──────────────────────────────────────── */}
      <div style={{
        marginTop: 36,
        paddingTop: 24,
        borderTop: '2px solid #e8e0d4',
      }}>
        <div style={{ padding: '0 20px 4px' }}>
          <p style={{
            fontSize: 9,
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#C9A84C',
            margin: '0 0 2px',
          }}>
            Card Preview
          </p>
          <p style={{ fontSize: 11, color: '#bbb', margin: '0 0 20px' }}>
            Live preview of how this listing appears on site cards
          </p>
        </div>

        {/* ── VENUE CARD ──────────────────────────────────────────────────── */}
        {venueEnabled && (
          <div style={{ padding: '0 16px 24px' }}>
            <p style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#bbb',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 8px',
            }}>
              Venue Card
            </p>
            <div style={{
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 6px 28px rgba(0,0,0,0.14)',
            }}>
              <LuxuryVenueCard
                v={venueV}
                isMobile={false}
                onView={() => {}}
                quickViewItem={quickViewItem}
                setQuickViewItem={setQuickViewItem}
              />
            </div>
          </div>
        )}

        {/* ── VENDOR CARD ─────────────────────────────────────────────────── */}
        {vendorEnabled && (
          <div style={{ padding: '0 16px 24px' }}>
            <p style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#bbb',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 8px',
            }}>
              Vendor Card
            </p>
            <div style={{
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 6px 28px rgba(0,0,0,0.14)',
            }}>
              <LuxuryVendorCard
                v={vendorV}
                isMobile={false}
                onView={() => {}}
                quickViewItem={quickViewItem}
                setQuickViewItem={setQuickViewItem}
              />
            </div>
          </div>
        )}

        {/* ── GCARD ───────────────────────────────────────────────────────── */}
        {gcardEnabled && (
          <div style={{ padding: '0 16px 32px' }}>
            <p style={{
              fontSize: 9,
              fontWeight: 700,
              color: '#bbb',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              margin: '0 0 8px',
            }}>
              GCard
            </p>
            <div style={{
              borderRadius: 10,
              overflow: 'hidden',
              boxShadow: '0 6px 28px rgba(0,0,0,0.14)',
            }}>
              <GCard
                v={gcardV}
                saved={false}
                onSave={() => {}}
                onView={() => {}}
                onQuickView={(item) => setQuickViewItem(item)}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── QUICK VIEW MODAL ──────────────────────────────────────────────── */}
      {quickViewItem && (
        <QuickViewModal
          item={quickViewItem}
          onClose={() => setQuickViewItem(null)}
          onViewFull={() => setQuickViewItem(null)}
        />
      )}
    </>
  );
}
