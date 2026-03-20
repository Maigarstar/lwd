// ─── adminEventsService.js ───────────────────────────────────────────────────
// Thin fetch wrapper around the admin-events edge function.
// Uses service_role via edge function — never direct Supabase client here.
// Mirrors adminLeadsService.ts exactly in pattern.
// ─────────────────────────────────────────────────────────────────────────────

const EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-events`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callEdge(payload) {
  if (!EDGE_URL || EDGE_URL.startsWith('undefined')) {
    throw new Error('Supabase URL not configured')
  }
  const res = await fetch(EDGE_URL, {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${ANON_KEY}`,
    },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (!json.success) throw new Error(json.error || 'Edge function error')
  return json.data
}

// ─── Events CRUD ──────────────────────────────────────────────────────────────

export async function adminListEvents(filters = {}) {
  try {
    return await callEdge({ action: 'list', ...filters })
  } catch (e) {
    console.warn('[adminEventsService] listEvents:', e.message)
    return { events: [], total: 0 }
  }
}

export async function adminGetEvent(eventId) {
  try {
    return await callEdge({ action: 'get', eventId })
  } catch (e) {
    console.warn('[adminEventsService] getEvent:', e.message)
    return null
  }
}

export async function adminCreateEvent(event) {
  try {
    return await callEdge({ action: 'create', event })
  } catch (e) {
    console.warn('[adminEventsService] createEvent:', e.message)
    return { event: null, error: e.message }
  }
}

export async function adminUpdateEvent(eventId, updates) {
  try {
    return await callEdge({ action: 'update', eventId, updates })
  } catch (e) {
    console.warn('[adminEventsService] updateEvent:', e.message)
    return { event: null, error: e.message }
  }
}

export async function adminDeleteEvent(eventId, hard = false) {
  try {
    return await callEdge({ action: 'delete', eventId, hard })
  } catch (e) {
    console.warn('[adminEventsService] deleteEvent:', e.message)
    return { deleted: false, error: e.message }
  }
}

// ─── Bookings ─────────────────────────────────────────────────────────────────

export async function adminListBookings(eventId, filters = {}) {
  try {
    return await callEdge({ action: 'list_bookings', eventId, ...filters })
  } catch (e) {
    console.warn('[adminEventsService] listBookings:', e.message)
    return { bookings: [], counts: {}, total: 0 }
  }
}

export async function adminUpdateBooking(bookingId, updates) {
  try {
    return await callEdge({ action: 'update_booking', bookingId, updates })
  } catch (e) {
    console.warn('[adminEventsService] updateBooking:', e.message)
    return { booking: null, error: e.message }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function dbToEvent(row) {
  if (!row) return null
  return {
    id:                 row.id,
    venueId:            row.venue_id,
    managedAccountId:   row.managed_account_id,
    ownerId:            row.owner_id,
    createdBy:          row.created_by,
    slug:               row.slug,
    title:              row.title,
    subtitle:           row.subtitle,
    eventType:          row.event_type,
    status:             row.status,
    startDate:          row.start_date,
    startTime:          row.start_time,
    endDate:            row.end_date,
    endTime:            row.end_time,
    timezone:           row.timezone,
    locationName:       row.location_name,
    locationAddress:    row.location_address,
    bookingMode:        row.booking_mode,
    externalBookingUrl: row.external_booking_url,
    capacity:           row.capacity,
    waitlistEnabled:    row.waitlist_enabled,
    isVirtual:          row.is_virtual,
    virtualPlatform:    row.virtual_platform,
    streamUrl:          row.stream_url,
    replayUrl:          row.replay_url,
    isExhibition:       row.is_exhibition,
    description:        row.description,
    coverImageUrl:      row.cover_image_url,
    galleryUrls:        row.gallery_urls || [],
    videoUrl:           row.video_url || null,
    videoHeroMode:      row.video_hero_mode || false,
    isFree:             row.is_free !== false,
    ticketPrice:        row.ticket_price || null,
    ticketCurrency:     row.ticket_currency || 'GBP',
    ticketIncludes:     row.ticket_includes || null,
    tagsJson:           row.tags_json || [],
    nearestAirport:      row.nearest_airport      || null,
    travelTime:          row.travel_time          || null,
    nearestTrainStation: row.nearest_train_station|| null,
    trainTravelTime:     row.train_travel_time    || null,
    transportNotes:      row.transport_notes      || null,
    parkingInfo:         row.parking_info         || null,
    guestLogistics:      row.guest_logistics      || null,
    directionsLink:      row.directions_link      || null,
    editorialIntro:     row.editorial_intro  || null,
    videoLabel:         row.video_label      || 'A Glimpse Inside',
    pricingLabel:       row.pricing_label    || null,
    ctaText:            row.cta_text         || 'Secure your place',
    calendarEnabled:    row.calendar_enabled !== false,
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    bookingCount:       row.event_bookings?.[0]?.count ?? 0,
  }
}

export function eventToDb(event) {
  return {
    venue_id:              event.venueId            || null,
    managed_account_id:    event.managedAccountId   || null,
    owner_id:              event.ownerId             || null,
    created_by:            event.createdBy           || null,
    slug:                  event.slug                || null,
    title:                 event.title               || '',
    subtitle:              event.subtitle            || null,
    event_type:            event.eventType           || 'open_day',
    status:                event.status              || 'draft',
    start_date:            event.startDate           || null,
    start_time:            event.startTime           || null,
    end_date:              event.endDate             || null,
    end_time:              event.endTime             || null,
    timezone:              event.timezone            || 'Europe/London',
    location_name:         event.locationName        || null,
    location_address:      event.locationAddress     || null,
    booking_mode:          event.bookingMode         || 'internal',
    external_booking_url:  event.externalBookingUrl  || null,
    capacity:              event.capacity            || null,
    waitlist_enabled:      event.waitlistEnabled     || false,
    is_virtual:            event.isVirtual           || false,
    virtual_platform:      event.virtualPlatform     || null,
    stream_url:            event.streamUrl           || null,
    replay_url:            event.replayUrl           || null,
    is_exhibition:         event.isExhibition        || false,
    description:           event.description         || null,
    cover_image_url:       event.coverImageUrl       || null,
    gallery_urls:          event.galleryUrls         || [],
    video_url:             event.videoUrl            || null,
    video_hero_mode:       event.videoHeroMode       || false,
    is_free:               event.isFree              !== false,
    ticket_price:          event.ticketPrice         || null,
    ticket_currency:       event.ticketCurrency      || 'GBP',
    ticket_includes:       event.ticketIncludes      || null,
    tags_json:             event.tagsJson            || [],
    nearest_airport:        event.nearestAirport      || null,
    travel_time:            event.travelTime          || null,
    nearest_train_station:  event.nearestTrainStation || null,
    train_travel_time:      event.trainTravelTime     || null,
    transport_notes:        event.transportNotes      || null,
    parking_info:           event.parkingInfo         || null,
    guest_logistics:        event.guestLogistics      || null,
    directions_link:        event.directionsLink      || null,
    editorial_intro:        event.editorialIntro      || null,
    video_label:            event.videoLabel          || null,
    pricing_label:          event.pricingLabel        || null,
    cta_text:               event.ctaText             || null,
    calendar_enabled:       event.calendarEnabled     !== false,
  }
}

/** Auto-generate a URL slug from a title */
export function slugifyTitle(title, suffix = '') {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
  return suffix ? `${base}-${suffix}` : base
}
