/**
 * mediaMappers.js
 *
 * Converts media_items[] entries (the shape stored in Listing Studio /
 * Supabase JSONB) into the shapes required by every consumer:
 *
 *   1. mapMediaItemToGalleryPhoto  → Lightbox + ImageGallery
 *   2. mapMediaItemToCardImg       → LuxuryVenueCard / LuxuryVendorCard
 *   3. buildMediaAIRecord          → AI information pool (single item)
 *   4. buildListingMediaAIRecords  → AI information pool (full listing batch)
 *
 * Having one source of truth here means every time a new field is added
 * to media_items, it flows automatically to all consumers — frontend,
 * editorial, and AI — without touching each consumer individually.
 */

// ─── 1. GALLERY / LIGHTBOX ────────────────────────────────────────────────────

/**
 * Convert a media_items entry to a Lightbox-compatible gallery photo.
 *
 * @param {object} item       — a media_items[] entry from Listing Studio
 * @param {object} objectUrls — { [id]: blobUrl } for File objects (upload preview)
 * @returns {object} gallery photo consumable by Lightbox.jsx + ImageGallery.jsx
 *
 * Output shape:
 *   { id, src, alt, title, caption, description, tags,
 *     location, image_type, visibility, show_credit, is_featured,
 *     photographer: { name, instagram, website, camera, area },
 *     credit_name, credit_instagram, credit_website, credit_camera, copyright }
 */
export const mapMediaItemToGalleryPhoto = (item, objectUrls = {}) => {
  const src = item.file instanceof File
    ? (objectUrls[item.id] || '')
    : (item.url || '');

  return {
    // Core identity
    id:          item.id,
    src,

    // SEO / accessibility — alt_text is the primary source
    alt:         item.alt_text || item.title || item.caption || '',

    // Editorial
    title:       item.title       || '',
    caption:     item.caption     || '',
    description: item.description || '',
    tags:        Array.isArray(item.tags) ? item.tags : [],

    // Classification
    location:    item.location   || '',
    image_type:  item.image_type || '',

    // Display settings
    visibility:  item.visibility  || 'public',
    show_credit: item.show_credit ?? false,
    is_featured: item.is_featured ?? false,

    // Nested photographer shape (for Lightbox.jsx backwards compat)
    photographer: {
      name:      item.credit_name      || '',
      instagram: item.credit_instagram || '',
      website:   item.credit_website   || '',
      camera:    item.credit_camera    || '',
      area:      item.location         || '',
    },

    // Flat credit fields (for direct access / future components)
    credit_name:      item.credit_name      || '',
    credit_instagram: item.credit_instagram || '',
    credit_website:   item.credit_website   || '',
    credit_camera:    item.credit_camera    || '',
    copyright:        item.copyright        || '',
  };
};


// ─── 2. CARD IMAGE ────────────────────────────────────────────────────────────

/**
 * Convert a media_items entry to a rich card image object.
 * Replaces the plain URL string previously used in v.imgs[].
 *
 * @param {object} item       — a media_items[] entry
 * @param {object} objectUrls — { [id]: blobUrl } for File objects
 * @returns {object} rich image object consumable by LuxuryVenueCard / LuxuryVendorCard
 *
 * Output shape:
 *   { src, url, alt_text, credit_name, credit_instagram, credit_website,
 *     show_credit, image_type, visibility, is_featured, sort_order }
 */
export const mapMediaItemToCardImg = (item, objectUrls = {}) => ({
  src:              item.file instanceof File
                      ? (objectUrls[item.id] || '')
                      : (item.url || ''),
  url:              item.url              || '',
  alt_text:         item.alt_text         || item.title || '',
  credit_name:      item.credit_name      || '',
  credit_instagram: item.credit_instagram || '',
  credit_website:   item.credit_website   || '',
  show_credit:      item.show_credit      ?? false,
  image_type:       item.image_type       || item.type || '',
  visibility:       item.visibility       || 'public',
  is_featured:      item.is_featured      ?? false,
  sort_order:       item.sort_order       ?? 0,
});

/**
 * Build a sorted, card-ready imgs array from a full media_items pool.
 * Filters to images only, excludes private items, sorts featured first.
 *
 * @param {Array}  mediaItems — full media_items[] array
 * @param {object} objectUrls — blob URL map for file previews
 * @param {number} limit      — max items (default: all)
 * @returns {Array} rich image objects ready for v.imgs
 */
export const buildCardImgs = (mediaItems = [], objectUrls = {}, limit = Infinity) =>
  mediaItems
    .filter(i => i.type !== 'video' && i.type !== 'virtual_tour' && i.visibility !== 'private')
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    })
    .slice(0, limit)
    .map(i => mapMediaItemToCardImg(i, objectUrls));

/**
 * Extract the primary video URL from a media_items pool.
 * Used to populate v.videoUrl on cards — enables the hero autoplay video slot.
 * Featured video wins; otherwise first public video by sort_order.
 *
 * @param {Array} mediaItems — full media_items[] array
 * @returns {string|null} URL of the primary public video, or null
 */
export const buildCardVideoUrl = (mediaItems = []) => {
  const vid = mediaItems
    .filter(i => i.type === 'video' && i.visibility !== 'private' && i.url)
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    })[0];
  return vid?.url || null;
};


// ─── 3. AI INFORMATION POOL ───────────────────────────────────────────────────

/**
 * Build a structured AI knowledge record from a single media_items entry.
 *
 * This is the shape that feeds the platform's AI information pool.
 * Each record links the media to its listing, venue, destination, category,
 * and photographer — making it queryable across all those dimensions.
 *
 * @param {object} item        — a media_items[] entry
 * @param {object} listingMeta — { id, name, category, country, region, destination, type }
 * @returns {object} AI-ready structured knowledge record
 *
 * Designed to be stored in:
 *   - A `media_ai_index` Supabase table (rows, indexed for full-text + vector search)
 *   - OR as an enriched JSONB blob alongside the listing record
 *   - OR as the input to an embedding pipeline (text → vector → pgvector)
 */
export const buildMediaAIRecord = (item, listingMeta = {}) => ({
  // ── Identity ──────────────────────────────────────────────────────────────
  media_id:     item.id,
  listing_id:   listingMeta.id       || null,
  listing_name: listingMeta.name     || '',

  // ── Editorial content (text fields for full-text + embedding) ────────────
  title:        item.title           || '',
  caption:      item.caption         || '',
  description:  item.description     || '',
  alt_text:     item.alt_text        || '',

  // ── Classification (for faceted search + AI filtering) ───────────────────
  media_type:   item.type            || 'image',   // image | video | virtual_tour
  image_type:   item.image_type      || '',        // ceremony | reception | detail_shot…
  tags:         Array.isArray(item.tags) ? item.tags : [],

  // ── Geography — destination intelligence ─────────────────────────────────
  location:     item.location        || '',        // free-text from editor
  country:      listingMeta.country  || '',        // e.g. "Italy"
  region:       listingMeta.region   || '',        // e.g. "Tuscany"
  destination:  listingMeta.destination || '',     // e.g. "Lake Como", "Amalfi Coast"

  // ── Entity links — for knowledge graph queries ───────────────────────────
  category:     listingMeta.category || '',        // venue | planner | photographer…
  listing_type: listingMeta.type     || '',        // Historic Villa | Estate | Chapel…

  // ── Photographer / supplier link ─────────────────────────────────────────
  credit_name:      item.credit_name      || '',
  credit_instagram: item.credit_instagram || '',
  credit_website:   item.credit_website   || '',
  credit_camera:    item.credit_camera    || '',
  copyright:        item.copyright        || '',

  // ── Display / access control ─────────────────────────────────────────────
  is_featured:  item.is_featured     ?? false,
  visibility:   item.visibility      || 'public',
  show_credit:  item.show_credit     ?? false,

  // ── Media URL (for vision AI / embedding later) ──────────────────────────
  url:          item.url             || '',

  // ── Derived full-text body (single string for embedding) ─────────────────
  // Concatenate all text signals into one searchable corpus per image.
  // This becomes the input to text-embedding-3-small or similar.
  ai_text_body: [
    listingMeta.name,
    listingMeta.country,
    listingMeta.region,
    listingMeta.destination,
    listingMeta.type,
    listingMeta.category,
    item.title,
    item.caption,
    item.description,
    item.alt_text,
    item.image_type,
    item.location,
    item.credit_name,
    ...(Array.isArray(item.tags) ? item.tags : []),
  ].filter(Boolean).join(' · '),

  indexed_at: new Date().toISOString(),
});

/**
 * Build AI records for all public images in a listing.
 * Excludes private media (visibility: 'private').
 * Typically called when a listing is saved, to sync to the AI index.
 *
 * @param {Array}  mediaItems  — full media_items[] array
 * @param {object} listingMeta — listing-level context
 * @returns {Array} array of AI knowledge records
 */
export const buildListingMediaAIRecords = (mediaItems = [], listingMeta = {}) =>
  mediaItems
    .filter(item => item.visibility !== 'private' && !!item.url)
    .map(item => buildMediaAIRecord(item, listingMeta));


// ─── 5. VENUE PROFILE VIDEO GALLERY ──────────────────────────────────────────

/**
 * Build a YouTube thumbnail URL from a YouTube watch/short URL.
 * Returns null if the URL is not a YouTube URL.
 */
const extractYouTubeId = (url) => {
  const m = url?.match(
    /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/
  );
  return m?.[1] || null;
};

const ytThumb = (url) => {
  const id = extractYouTubeId(url);
  return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
};

/**
 * Extract the numeric Vimeo video ID from a Vimeo URL.
 * Handles: vimeo.com/123456789, vimeo.com/channels/…/123456789, player.vimeo.com/video/123456789
 */
const extractVimeoId = (url) => {
  const m = url?.match(/vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/|album\/[^/]+\/video\/)?(\d+)/);
  return m?.[1] || null;
};

/**
 * Build an embed URL for YouTube or Vimeo.
 * Returns null for unsupported platforms (Instagram, TikTok, etc.).
 */
export const buildVideoEmbedUrl = (url, origin = '') => {
  const ytId = extractYouTubeId(url);
  if (ytId) {
    return `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&showinfo=0&controls=1&playsinline=1&enablejsapi=1${origin ? `&origin=${encodeURIComponent(origin)}` : ''}`;
  }
  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}?autoplay=1&title=0&byline=0&portrait=0&color=C9A84C&badge=0`;
  }
  return null;
};

/**
 * Convert media_items[] videos into the shape expected by VenueProfile VideoGallery.
 * Filters to public videos only, sorts featured/sort_order.
 * Extracts youtubeId + vimeoId so VideoPlayModal can build the correct embed URL.
 *
 * @param {Array} mediaItems — full media_items[] array from a listing
 * @returns {Array} video objects consumable by VideoGallery + VideoPlayModal
 *
 * Output shape per item:
 *   { id, url, youtubeId, vimeoId, title, thumb, desc, duration, type, tags,
 *     source_type, videographer: { name, area } | null }
 */
export const buildVenueVideos = (mediaItems = []) =>
  mediaItems
    .filter(i => i.type === 'video' && i.visibility !== 'private' && i.url)
    .sort((a, b) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;
      return (a.sort_order ?? 999) - (b.sort_order ?? 999);
    })
    .map(item => {
      const ytId    = extractYouTubeId(item.url);
      const vimeoId = extractVimeoId(item.url);
      return {
        id:          item.id,
        url:         item.url,
        youtubeId:   ytId    || null,
        vimeoId:     vimeoId || null,
        title:       item.title    || 'Venue Video',
        thumb:       item.thumbnail || ytThumb(item.url) || null,
        desc:        item.caption  || item.description || '',
        duration:    item.duration || '',
        type:        item.image_type || 'tour',   // 'wedding' | 'tour' | '' — drives label
        tags:        Array.isArray(item.tags) ? item.tags : [],
        source_type: item.source_type || 'external',
        videographer: item.credit_name
          ? { name: item.credit_name, area: item.location || '' }
          : null,
      };
    });
