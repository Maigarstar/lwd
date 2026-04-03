/**
 * userEventService.js
 *
 * Unified behavioural event tracking.
 * All user intent signals — search, enquiry, shortlist, Aura, etc. —
 * flow through this one service into the user_events table.
 *
 * Design principles:
 *   - Always fire-and-forget. Never block UI or navigation.
 *   - One consistent schema: session_id + event_type + entity + metadata.
 *   - Session ID re-uses the same key as outboundClickService (lwd_session_id).
 *   - Inbound referrer + UTM captured once per session on first call.
 *   - All failures are silently swallowed.
 *
 * Event types:
 *   search              | search_result_click
 *   enquiry_started     | enquiry_submitted
 *   shortlist_add       | shortlist_remove
 *   aura_query          | session_start
 *   returned_after_outbound | profile_view
 */

import { supabase } from '../lib/supabaseClient';

// ─────────────────────────────────────────────────────────────────────────────
// Session ID — shared with outboundClickService via same sessionStorage key
// ─────────────────────────────────────────────────────────────────────────────

const SESSION_ID_KEY    = 'lwd_session_id';
const SESSION_META_KEY  = 'lwd_session_meta';  // referrer + UTM, captured once

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

// ─────────────────────────────────────────────────────────────────────────────
// Inbound referrer + UTM capture
// Stored once per session in sessionStorage. Attached to every event.
// ─────────────────────────────────────────────────────────────────────────────

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
      landing_path: window.location.pathname   || null,
    };

    sessionStorage.setItem(SESSION_META_KEY, JSON.stringify(meta));
    return meta;
  } catch {
    return {};
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Core track function
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track a user intent event. Fire-and-forget — never await at call site.
 *
 * @param {object}        params
 * @param {string}        params.eventType   — see event types above
 * @param {string|null}   params.entityType  — 'venue' | 'vendor' | 'page' | null
 * @param {string|null}   params.entityId    — UUID of the entity
 * @param {object}        params.metadata    — event-specific payload (merged with session meta)
 */
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function trackEvent({ eventType, entityType = null, entityId = null, metadata = {} }) {
  if (!supabase) return;
  if (!eventType) return;

  const sessionMeta = getSessionMeta();

  // entity_id column is UUID type — only pass it when the value is a valid UUID.
  // Non-UUID IDs (integers, slugs) go into metadata only to avoid a silent type error.
  const safeEntityId = entityId && UUID_RE.test(String(entityId)) ? entityId : null;

  const payload = {
    session_id:  getSessionId(),
    event_type:  eventType,
    entity_type: entityType  || null,
    entity_id:   safeEntityId,
    metadata: {
      ...metadata,
      // Preserve raw entity_id in metadata when it can't go in the UUID column
      ...(entityId && !safeEntityId ? { raw_entity_id: String(entityId) } : {}),
      // Always attach session context
      referrer:     sessionMeta.referrer,
      utm_source:   sessionMeta.utm_source,
      utm_medium:   sessionMeta.utm_medium,
      utm_campaign: sessionMeta.utm_campaign,
    },
  };

  // Fire and forget — never block the caller
  supabase
    .from('user_events')
    .insert(payload)
    .then(({ error }) => {
      if (error && import.meta.env.DEV) {
        console.warn('[trackEvent] insert error:', error.message, { eventType, entityType, entityId });
      }
    })
    .catch((err) => {
      if (import.meta.env.DEV) {
        console.warn('[trackEvent] network error:', err?.message, { eventType });
      }
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Typed helpers — use these at call sites for consistency
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Directory/category search executed.
 * @param {{ query?: string, filters?: object, resultsCount: number, zeroResults: boolean, sourceSurface?: string }} p
 */
export function trackSearch({ query = '', filters = {}, resultsCount = 0, zeroResults = false, sourceSurface = null }) {
  trackEvent({
    eventType: 'search',
    metadata: { query: query.trim().slice(0, 200), filters, results_count: resultsCount, zero_results: zeroResults, source_surface: sourceSurface },
  });
}

/**
 * User clicked a result card after searching.
 * @param {{ entityType: string, entityId: string, entityName?: string, position?: number }} p
 */
export function trackSearchResultClick({ entityType, entityId, entityName = null, position = null }) {
  trackEvent({
    eventType:  'search_result_click',
    entityType,
    entityId,
    metadata: { entity_name: entityName, position },
  });
}

/**
 * User opened / started filling an enquiry form.
 * @param {{ entityType: string, entityId: string, entityName?: string, source?: string, sourceSurface?: string }} p
 */
export function trackEnquiryStarted({ entityType, entityId, entityName = null, source = null, sourceSurface = null }) {
  trackEvent({
    eventType:  'enquiry_started',
    entityType,
    entityId,
    metadata: { entity_name: entityName, source, source_surface: sourceSurface || source },
  });
}

/**
 * Enquiry form successfully submitted.
 * @param {{ entityType: string, entityId: string, entityName?: string, source?: string, sourceSurface?: string }} p
 */
export function trackEnquirySubmitted({ entityType, entityId, entityName = null, source = null, sourceSurface = null }) {
  trackEvent({
    eventType:  'enquiry_submitted',
    entityType,
    entityId,
    metadata: { entity_name: entityName, source, source_surface: sourceSurface || source },
  });
}

/**
 * Venue/vendor added to shortlist.
 * @param {{ entityType: string, entityId: string, entityName?: string }} p
 */
export function trackShortlistAdd({ entityType, entityId, entityName = null }) {
  trackEvent({
    eventType:  'shortlist_add',
    entityType: entityType || 'venue',
    entityId,
    metadata: { entity_name: entityName },
  });
}

/**
 * Venue/vendor removed from shortlist.
 * @param {{ entityType: string, entityId: string, entityName?: string }} p
 */
export function trackShortlistRemove({ entityType, entityId, entityName = null }) {
  trackEvent({
    eventType:  'shortlist_remove',
    entityType: entityType || 'venue',
    entityId,
    metadata: { entity_name: entityName },
  });
}

/**
 * Venue or vendor profile viewed.
 * @param {{ entityType: string, entityId: string, entityName?: string, slug?: string, sourceSurface?: string }} p
 */
export function trackProfileView({ entityType, entityId, entityName = null, slug = null, sourceSurface = 'venue_profile' }) {
  trackEvent({
    eventType:  'profile_view',
    entityType,
    entityId,
    metadata: { entity_name: entityName, slug, source_surface: sourceSurface },
  });
}

/**
 * Aura chat message sent by user.
 * @param {{ query: string, venuesRecommended?: string[], sourceSurface?: string }} p
 */
export function trackAuraQuery({ query, venuesRecommended = [], sourceSurface = 'aura_chat' }) {
  trackEvent({
    eventType: 'aura_query',
    metadata: { query: query.trim().slice(0, 500), venues_recommended: venuesRecommended, source_surface: sourceSurface },
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Compare behaviour tracking
//
// Event taxonomy:
//   compare_add    — venue added to compare bar
//   compare_remove — venue removed from compare bar
//   compare_view   — "Compare Now" clicked; user viewed the comparison
//   compare_pair   — one event per pairwise combination (A×B, A×C, B×C)
//                    competitive intelligence: which venues are compared together
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Venue added to the compare bar.
 * @param {{ venueId: string, venueName?: string, compareList?: {id:string,name:string}[], sourceSurface?: string }} p
 */
export function trackCompareAdd({ venueId, venueName = null, compareList = [], sourceSurface = 'venue_profile' }) {
  const peers = compareList.filter(v => v.id !== venueId);
  trackEvent({
    eventType:  'compare_add',
    entityType: 'venue',
    entityId:   venueId,
    metadata: {
      venue_name:          venueName,
      compared_with_ids:   peers.map(v => v.id),
      compared_with_names: peers.map(v => v.name),
      compared_count:      compareList.length + 1,
      source_surface:      sourceSurface,
    },
  });
}

/**
 * Venue removed from the compare bar.
 * @param {{ venueId: string, venueName?: string, compareList?: {id:string,name:string}[], sourceSurface?: string }} p
 */
export function trackCompareRemove({ venueId, venueName = null, compareList = [], sourceSurface = 'compare_bar' }) {
  const peers = compareList.filter(v => v.id !== venueId);
  trackEvent({
    eventType:  'compare_remove',
    entityType: 'venue',
    entityId:   venueId,
    metadata: {
      venue_name:          venueName,
      compared_with_ids:   peers.map(v => v.id),
      compared_with_names: peers.map(v => v.name),
      compared_count:      compareList.length,
      source_surface:      sourceSurface,
    },
  });
}

/**
 * "Compare Now" clicked — user viewed the full comparison.
 * Fires once per comparison view. compareList = all venues in bar.
 * @param {{ compareList: {id:string,name:string}[], sourceSurface?: string }} p
 */
export function trackCompareView({ compareList = [], sourceSurface = 'compare_bar' }) {
  if (compareList.length < 2) return;
  trackEvent({
    eventType: 'compare_view',
    metadata: {
      venues:         compareList.map(v => ({ id: v.id, name: v.name })),
      compared_count: compareList.length,
      source_surface: sourceSurface,
    },
  });
}

/**
 * One event per pairwise combination in the compare bar.
 * Up to 3 venues → up to 3 pair events (A×B, A×C, B×C).
 * Competitive intelligence: which venues users compare head-to-head.
 * @param {{ compareList: {id:string,name:string}[], sourceSurface?: string }} p
 */
export function trackComparePair({ compareList = [], sourceSurface = 'compare_bar' }) {
  if (compareList.length < 2) return;
  for (let i = 0; i < compareList.length; i++) {
    for (let j = i + 1; j < compareList.length; j++) {
      const a = compareList[i];
      const b = compareList[j];
      // Use the first venue as entity anchor, second in metadata
      trackEvent({
        eventType:  'compare_pair',
        entityType: 'venue',
        entityId:   a.id,
        metadata: {
          venue_a_id:     a.id,
          venue_a_name:   a.name,
          venue_b_id:     b.id,
          venue_b_name:   b.name,
          all_venues:     compareList.map(v => ({ id: v.id, name: v.name })),
          compared_count: compareList.length,
          source_surface: sourceSurface,
        },
      });
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Return after outbound — passive detection via visibilitychange
//
// Flow:
//   1. outboundClickService stores a pending marker when any external link fires
//   2. initReturnDetection() sets up a visibilitychange listener once per session
//   3. When the LWD tab becomes visible again:
//      — check for a pending marker < 30 min old
//      — if found: fire returned_after_outbound + clear the marker
//
// Call initReturnDetection() once on app start (e.g. in main.jsx).
// ─────────────────────────────────────────────────────────────────────────────

const PENDING_RETURN_KEY  = 'lwd_pending_return';
const RETURN_WINDOW_MS    = 30 * 60 * 1000; // 30 minutes
let returnDetectionActive = false;

export function initReturnDetection() {
  if (returnDetectionActive || typeof document === 'undefined') return;
  returnDetectionActive = true;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState !== 'visible') return;

    try {
      const raw = sessionStorage.getItem(PENDING_RETURN_KEY);
      if (!raw) return;

      const pending = JSON.parse(raw);
      const elapsed = Date.now() - (pending.ts || 0);

      if (elapsed > 0 && elapsed < RETURN_WINDOW_MS) {
        // User came back within the window — fire the event
        trackEvent({
          eventType:  'returned_after_outbound',
          entityType: pending.entityType || null,
          entityId:   pending.entityId   || null,
          metadata: {
            outbound_url:      pending.url      || null,
            outbound_link_type: pending.linkType || null,
            elapsed_seconds:   Math.round(elapsed / 1000),
            source_surface:    'return_detection',
          },
        });
      }

      // Clear pending marker regardless of whether it was in-window or not
      sessionStorage.removeItem(PENDING_RETURN_KEY);
    } catch {
      // Never fail silently
    }
  });
}

/**
 * Called by outboundClickService to mark that an outbound click just happened.
 * Stores the marker so initReturnDetection() can detect the return.
 */
export function markOutboundPending({ entityType, entityId, linkType, url }) {
  try {
    sessionStorage.setItem(PENDING_RETURN_KEY, JSON.stringify({
      entityType: entityType || null,
      entityId:   entityId   || null,
      linkType:   linkType   || null,
      url:        url        || null,
      ts:         Date.now(),
    }));
  } catch {
    // sessionStorage unavailable
  }
}
