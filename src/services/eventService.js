// ─── eventService.js ─────────────────────────────────────────────────────────
// Public-facing event reads via anon Supabase client.
// RLS allows SELECT on published events only.
// Used by: VenueProfile, EventDetailPage, public events listing.
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'

// ─── Shape mapper ─────────────────────────────────────────────────────────────

export function dbToEvent(row) {
  if (!row) return null
  return {
    id:                 row.id,
    venueId:            row.venue_id,
    managedAccountId:   row.managed_account_id,
    ownerId:            row.owner_id,
    slug:               row.slug,
    title:              row.title,
    subtitle:           row.subtitle,
    eventType:          row.event_type,
    status:             row.status,
    startDate:          row.start_date,
    startTime:          row.start_time,
    endDate:            row.end_date,
    endTime:            row.end_time,
    timezone:           row.timezone || 'Europe/London',
    locationName:       row.location_name,
    locationAddress:    row.location_address,
    bookingMode:        row.booking_mode || 'internal',
    externalBookingUrl: row.external_booking_url,
    capacity:           row.capacity,
    waitlistEnabled:    row.waitlist_enabled,
    isVirtual:          row.is_virtual,
    virtualPlatform:    row.virtual_platform,
    streamUrl:          row.stream_url,
    replayUrl:          row.replay_url,
    isExhibition:       row.is_exhibition,
    exhibitionId:       row.exhibition_id,
    description:        row.description,
    coverImageUrl:      row.cover_image_url,
    galleryUrls:        row.gallery_urls || [],
    videoUrl:           row.video_url || null,
    tagsJson:           row.tags_json || [],
    metaJson:           row.meta_json || {},
    createdAt:          row.created_at,
    updatedAt:          row.updated_at,
    // joined booking count (when selected with count)
    bookingCount:       row.event_bookings?.[0]?.count ?? null,
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Format a date string (YYYY-MM-DD) to display string
 * e.g. "2026-06-14" → "Saturday 14 June 2026"
 */
export function formatEventDate(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T00:00:00')
  return d.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  })
}

/**
 * Format a time string (HH:MM:SS) to display string
 * e.g. "10:00:00" → "10:00am"
 */
export function formatEventTime(timeStr) {
  if (!timeStr) return ''
  const [h, m] = timeStr.split(':').map(Number)
  const ampm = h >= 12 ? 'pm' : 'am'
  const hour = h % 12 || 12
  return `${hour}:${String(m).padStart(2, '0')}${ampm}`
}

/** True if the event is in the future */
export function isUpcoming(event) {
  if (!event?.startDate) return false
  const today = new Date().toISOString().split('T')[0]
  return event.startDate >= today
}

/** Remaining capacity (null = unlimited) */
export function remainingCapacity(event, confirmedCount) {
  if (!event?.capacity) return null
  return Math.max(0, event.capacity - confirmedCount)
}

/** Build a Google Calendar add-to-calendar URL */
export function googleCalendarUrl(event) {
  const base = 'https://www.google.com/calendar/render?action=TEMPLATE'
  const title = encodeURIComponent(event.title)
  const details = encodeURIComponent(event.description || '')
  const location = encodeURIComponent(
    [event.locationName, event.locationAddress].filter(Boolean).join(', ')
  )
  // Format: YYYYMMDDTHHMMSS — use 00:00:00 if no time specified
  const startDt = (event.startDate || '').replace(/-/g, '') +
    'T' + (event.startTime || '000000').replace(/:/g, '').padEnd(6, '0')
  const endDt = (event.endDate || event.startDate || '').replace(/-/g, '') +
    'T' + (event.endTime || event.startTime || '230000').replace(/:/g, '').padEnd(6, '0')
  return `${base}&text=${title}&dates=${startDt}/${endDt}&details=${details}&location=${location}`
}

/** Build an .ics file Blob for download */
export function buildIcsBlob(event) {
  const fmt = (dateStr, timeStr) => {
    const d = (dateStr || '').replace(/-/g, '')
    const t = (timeStr || '000000').replace(/:/g, '').padEnd(6, '0')
    return `${d}T${t}`
  }
  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LuxuryWeddingDirectory//Events//EN',
    'BEGIN:VEVENT',
    `UID:${event.id}@luxuryweddingdirectory.com`,
    `DTSTART:${fmt(event.startDate, event.startTime)}`,
    `DTEND:${fmt(event.endDate || event.startDate, event.endTime || event.startTime)}`,
    `SUMMARY:${event.title}`,
    `DESCRIPTION:${(event.description || '').replace(/\n/g, '\\n')}`,
    `LOCATION:${[event.locationName, event.locationAddress].filter(Boolean).join(', ')}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n')
  return new Blob([ics], { type: 'text/calendar' })
}

// ─── Queries ──────────────────────────────────────────────────────────────────

/**
 * Fetch all published events (optionally filtered)
 */
export async function fetchPublishedEvents({
  venueId, managedAccountId, limit = 20, upcomingOnly = true,
} = {}) {
  if (!isSupabaseAvailable()) return []

  let query = supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('start_date', { ascending: true })
    .limit(limit)

  if (venueId)           query = query.eq('venue_id', venueId)
  if (managedAccountId)  query = query.eq('managed_account_id', managedAccountId)
  if (upcomingOnly) {
    const today = new Date().toISOString().split('T')[0]
    query = query.gte('start_date', today)
  }

  const { data, error } = await query
  if (error) {
    console.warn('[eventService] fetchPublishedEvents:', error.message)
    return []
  }
  return (data || []).map(dbToEvent)
}

/**
 * Fetch a single published event by slug (for the detail page)
 */
export async function fetchEventBySlug(slug) {
  if (!isSupabaseAvailable()) return null

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('slug', slug)
    .eq('status', 'published')
    .single()

  if (error) {
    console.warn('[eventService] fetchEventBySlug:', error.message)
    return null
  }
  return dbToEvent(data)
}

/**
 * Fetch upcoming published events for a specific venue (used by VenueProfile)
 */
export async function fetchUpcomingEventsForVenue(venueId, limit = 6) {
  if (!venueId) return []
  return fetchPublishedEvents({ venueId, limit, upcomingOnly: true })
}
