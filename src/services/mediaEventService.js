/**
 * mediaEventService.js
 *
 * Visual media event tracking — every image and video interaction.
 * Fire-and-forget. Never blocks UI. Mirrors userEventService.js patterns.
 *
 * Event types tracked:
 *   media_view         — image/video entered viewport
 *   media_dwell        — user stayed on image 3+ seconds
 *   media_click        — image clicked / lightbox opened
 *   media_swipe        — swiped to image in carousel
 *   media_gallery_open — full gallery modal opened
 *   media_video_play   — video play initiated
 *   media_video_complete — video watched >80%
 *   media_save         — native long-press save
 *   media_download     — download button clicked
 *   media_share        — share sheet opened
 *   media_enquiry      — enquiry submitted after viewing this image
 *   media_search_click — arrived from Google/Bing image search
 */

import { supabase } from '../lib/supabaseClient';

// ── Session ID (shared key with userEventService / outboundClickService) ────
const SESSION_ID_KEY   = 'lwd_session_id';
const SESSION_META_KEY = 'lwd_session_meta';
const VIEWED_KEY       = 'lwd_media_viewed'; // dedup set: viewed media_ids this session

function getSessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_ID_KEY);
    if (!id) {
      id = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `sess-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      sessionStorage.setItem(SESSION_ID_KEY, id);
    }
    return id;
  } catch {
    return `sess-${Date.now()}`;
  }
}

function getSessionMeta() {
  try {
    const cached = sessionStorage.getItem(SESSION_META_KEY);
    if (cached) return JSON.parse(cached);
    const params = new URLSearchParams(window.location.search);
    const meta = {
      referrer:     document.referrer || null,
      utm_source:   params.get('utm_source')   || null,
      utm_medium:   params.get('utm_medium')   || null,
      utm_campaign: params.get('utm_campaign') || null,
    };
    sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    return meta;
  } catch {
    return {};
  }
}

// ── Session-level dedup for media_view (one view per media_id per session) ──
function hasViewedThisSession(mediaId) {
  try {
    const raw = sessionStorage.getItem(VIEWED_KEY);
    const set = raw ? new Set(JSON.parse(raw)) : new Set();
    return set.has(mediaId);
  } catch { return false; }
}

function markViewedThisSession(mediaId) {
  try {
    const raw = sessionStorage.getItem(VIEWED_KEY);
    const set = raw ? new Set(JSON.parse(raw)) : new Set();
    set.add(mediaId);
    sessionStorage.setItem(VIEWED_KEY, JSON.stringify([...set]));
  } catch {}
}

// ── Last-viewed tracking (for enquiry attribution) ───────────────────────
let lastViewedMediaId = null;

export function getLastViewedMediaId() { return lastViewedMediaId; }

// ── Core insert ──────────────────────────────────────────────────────────
function trackMediaEvent({
  eventType,
  mediaId,
  listingId,
  galleryPosition = null,
  slideIndex = null,
  isHero = false,
  dwellMs = null,
  videoPct = null,
  sharePlatform = null,
}) {
  if (!supabase || !eventType || !mediaId) return;

  const meta = getSessionMeta();
  const isUuid = (v) => typeof v === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);

  const payload = {
    session_id:       getSessionId(),
    event_type:       eventType,
    media_id:         String(mediaId),
    listing_id:       isUuid(listingId) ? listingId : null,
    gallery_position: galleryPosition,
    slide_index:      slideIndex,
    is_hero:          isHero,
    dwell_ms:         dwellMs,
    video_pct:        videoPct,
    share_platform:   sharePlatform,
    referrer:         meta.referrer,
    utm_source:       meta.utm_source,
    utm_medium:       meta.utm_medium,
    utm_campaign:     meta.utm_campaign,
  };

  Promise.resolve(
    supabase.from('media_events').insert(payload)
  ).then(({ error }) => {
    if (error && import.meta.env.DEV) {
      console.warn('[mediaEvent] insert error:', error.message, { eventType, mediaId });
    }
  }).catch(() => {});
}

// ── Dwell timers (per-media-id, auto-cancelled on slide change) ──────────
const dwellTimers = {};

function cancelDwell(mediaId) {
  if (dwellTimers[mediaId]) {
    clearTimeout(dwellTimers[mediaId].timer);
    delete dwellTimers[mediaId];
  }
}

function startDwell(mediaId, listingId, galleryPosition, isHero) {
  cancelDwell(mediaId);
  const start = Date.now();
  dwellTimers[mediaId] = {
    start,
    timer: setTimeout(() => {
      const ms = Date.now() - start;
      trackMediaEvent({ eventType: 'media_dwell', mediaId, listingId, galleryPosition, isHero, dwellMs: ms });
      delete dwellTimers[mediaId];
    }, 3000),
  };
}

// ── Public tracking API ───────────────────────────────────────────────────

/**
 * Image/video entered viewport. Deduped per session per media_id.
 * Also starts 3-second dwell timer.
 */
export function trackMediaView({ mediaId, listingId, galleryPosition = null, isHero = false, slideIndex = null }) {
  if (!mediaId) return;
  lastViewedMediaId = mediaId;

  if (!hasViewedThisSession(mediaId)) {
    markViewedThisSession(mediaId);
    trackMediaEvent({ eventType: 'media_view', mediaId, listingId, galleryPosition, isHero, slideIndex });
  }

  startDwell(mediaId, listingId, galleryPosition, isHero);
}

/** User swiped away from this image — cancel its dwell timer. */
export function cancelMediaDwell(mediaId) {
  cancelDwell(mediaId);
}

/** Image clicked (lightbox / expand). */
export function trackMediaClick({ mediaId, listingId, galleryPosition = null, isHero = false }) {
  if (!mediaId) return;
  lastViewedMediaId = mediaId;
  trackMediaEvent({ eventType: 'media_click', mediaId, listingId, galleryPosition, isHero });
}

/** Swiped to this image in card carousel. */
export function trackMediaSwipe({ mediaId, listingId, galleryPosition = null }) {
  if (!mediaId) return;
  trackMediaEvent({ eventType: 'media_swipe', mediaId, listingId, galleryPosition });
}

/** Full gallery modal opened. */
export function trackGalleryOpen({ mediaId, listingId }) {
  if (!mediaId) return;
  trackMediaEvent({ eventType: 'media_gallery_open', mediaId, listingId });
}

/** Video play initiated. */
export function trackVideoPlay({ mediaId, listingId, galleryPosition = null }) {
  if (!mediaId) return;
  trackMediaEvent({ eventType: 'media_video_play', mediaId, listingId, galleryPosition });
}

/** Video watched to >80%. Only fires once per session per mediaId. */
const videoCompleted = new Set();
export function trackVideoComplete({ mediaId, listingId, videoPct = 100 }) {
  if (!mediaId || videoCompleted.has(mediaId)) return;
  videoCompleted.add(mediaId);
  trackMediaEvent({ eventType: 'media_video_complete', mediaId, listingId, videoPct });
}

/** Mobile long-press save. */
export function trackMediaSave({ mediaId, listingId }) {
  if (!mediaId) return;
  trackMediaEvent({ eventType: 'media_save', mediaId, listingId });
}

/** Download button click. */
export function trackMediaDownload({ mediaId, listingId }) {
  if (!mediaId) return;
  trackMediaEvent({ eventType: 'media_download', mediaId, listingId });
}

/**
 * Share sheet opened.
 * @param {string} platform — 'instagram' | 'pinterest' | 'whatsapp' | 'twitter' | 'copy_link'
 */
export function trackMediaShare({ mediaId, listingId, platform }) {
  if (!mediaId) return;
  trackMediaEvent({ eventType: 'media_share', mediaId, listingId, sharePlatform: platform || null });
}

/**
 * Enquiry submitted — attributes to the last viewed media_id.
 * Call from LuxeEnquiryModal on submit.
 */
export function trackMediaEnquiry({ listingId }) {
  const mediaId = lastViewedMediaId;
  if (!mediaId || !listingId) return;
  trackMediaEvent({ eventType: 'media_enquiry', mediaId, listingId, isHero: false });
}

/**
 * Referrer analysis on page load.
 * If the session arrived from Google/Bing image search, fire media_search_click
 * for the hero image of the listing.
 *
 * Call once on listing profile page mount:
 *   checkSearchReferral({ heroMediaId, listingId })
 */
const SEARCH_REFERRERS = [
  /google\.com\/imgres/i,
  /google\.com\/search.*tbm=isch/i,
  /images\.google\./i,
  /bing\.com\/images/i,
  /pinterest\.com/i,
];
const SEARCH_REFERRAL_KEY = 'lwd_search_referral_fired';

export function checkSearchReferral({ heroMediaId, listingId }) {
  if (!heroMediaId || !listingId) return;
  try {
    if (sessionStorage.getItem(SEARCH_REFERRAL_KEY)) return;
    const ref = document.referrer || '';
    const isSearchReferral = SEARCH_REFERRERS.some(re => re.test(ref));
    if (!isSearchReferral) return;
    sessionStorage.setItem(SEARCH_REFERRAL_KEY, '1');
    trackMediaEvent({ eventType: 'media_search_click', mediaId: heroMediaId, listingId, isHero: true });
  } catch {}
}

// ── Aura-surface tracking ─────────────────────────────────────────────────────
// Track images shown and interacted with inside Aura's chat thread.
// Uses existing event types with metadata.source = 'aura' to separate
// Aura impressions / taps from organic gallery interactions.

const AURA_IMPRESSED_KEY = 'lwd_aura_impressed'; // dedup: don't re-fire impression on re-render

/**
 * Call when Aura image strip mounts with images (impression).
 * Fires media_view with source:aura for each image NOT already impressed this session.
 */
export function trackAuraImpressions(images = []) {
  try {
    const raw = sessionStorage.getItem(AURA_IMPRESSED_KEY);
    const done = raw ? new Set(JSON.parse(raw)) : new Set();

    images.forEach(img => {
      const id = img.media_id;
      if (!id || done.has(id)) return;
      done.add(id);
      // Fire as media_view so it feeds the engagement score system
      Promise.resolve(
        supabase.from('media_events').insert({
          session_id: getSessionId(),
          event_type: 'media_view',
          media_id:   String(id),
          listing_id: img.listing_id || null,
          metadata:   { source: 'aura', surface: 'chat_strip' },
        })
      ).catch(() => {});
    });

    sessionStorage.setItem(AURA_IMPRESSED_KEY, JSON.stringify([...done]));
  } catch {}
}

/**
 * Call when a thumbnail in Aura's image strip is tapped.
 * Fires media_click with source:aura.
 */
export function trackAuraTap(mediaId, listingId) {
  if (!mediaId) return;
  Promise.resolve(
    supabase.from('media_events').insert({
      session_id: getSessionId(),
      event_type: 'media_click',
      media_id:   String(mediaId),
      listing_id: listingId || null,
      metadata:   { source: 'aura', surface: 'chat_strip' },
    })
  ).catch(() => {});
}

/**
 * Call when a lightbox image is navigated (swipe/arrow) within Aura.
 * Fires media_view with source:aura_lightbox.
 * Not deduped — each navigation is intentional engagement.
 */
export function trackAuraLightboxView(mediaId, listingId) {
  if (!mediaId) return;
  Promise.resolve(
    supabase.from('media_events').insert({
      session_id: getSessionId(),
      event_type: 'media_view',
      media_id:   String(mediaId),
      listing_id: listingId || null,
      metadata:   { source: 'aura', surface: 'chat_lightbox' },
    })
  ).catch(() => {});
}
