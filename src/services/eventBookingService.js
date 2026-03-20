// ─── eventBookingService.js ───────────────────────────────────────────────────
// Booking form submission flow:
//   1. Insert into event_bookings (anon INSERT, RLS allows)
//   2. Create a lead via leadEngineService (leadType: 'event_booking')
//   3. Send confirmation email via send-email edge function
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import { createLead } from './leadEngineService'

const IS_DEV = import.meta.env.DEV

// ─── Shape mapper ─────────────────────────────────────────────────────────────

export function dbToBooking(row) {
  if (!row) return null
  return {
    id:                    row.id,
    eventId:               row.event_id,
    venueId:               row.venue_id,
    leadId:                row.lead_id,
    firstName:             row.first_name,
    lastName:              row.last_name,
    email:                 row.email,
    phone:                 row.phone,
    guestCount:            row.guest_count,
    message:               row.message,
    status:                row.status,
    bookingRef:            row.booking_ref,
    confirmedAt:           row.confirmed_at,
    cancelledAt:           row.cancelled_at,
    confirmationSentAt:    row.confirmation_sent_at,
    consentMarketing:      row.consent_marketing,
    consentDataProcessing: row.consent_data_processing,
    createdAt:             row.created_at,
  }
}

// ─── Email builder ────────────────────────────────────────────────────────────

function buildConfirmationEmail({ booking, event, reviewToken }) {
  const venueName = event.locationName || 'the venue'
  const dateStr   = event.startDate
    ? new Date(event.startDate + 'T00:00:00').toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : ''
  const timeStr = event.startTime
    ? event.startTime.slice(0, 5)
    : ''

  const html = `
    <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; color: #1a1a1a;">
      <div style="border-bottom: 2px solid #c9a96e; padding-bottom: 24px; margin-bottom: 32px;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #c9a96e; margin: 0 0 8px;">
          Luxury Wedding Directory
        </p>
        <h1 style="font-size: 28px; font-weight: 400; margin: 0;">
          Your place is confirmed
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">
        Dear ${booking.firstName},
      </p>
      <p style="font-size: 16px; line-height: 1.6;">
        Thank you for registering for <strong>${event.title}</strong>.
        We look forward to welcoming you${event.isVirtual ? ' online' : ` to ${venueName}`}.
      </p>

      <div style="background: #f9f6f0; border-left: 3px solid #c9a96e; padding: 20px 24px; margin: 32px 0;">
        <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a96e; margin: 0 0 16px;">
          Booking Details
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; padding: 6px 0; width: 40%;">Reference</td>
            <td style="font-size: 15px; font-weight: 600; padding: 6px 0;">${booking.bookingRef}</td>
          </tr>
          <tr>
            <td style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; padding: 6px 0;">Event</td>
            <td style="font-size: 15px; padding: 6px 0;">${event.title}</td>
          </tr>
          ${dateStr ? `<tr>
            <td style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; padding: 6px 0;">Date</td>
            <td style="font-size: 15px; padding: 6px 0;">${dateStr}${timeStr ? ' · ' + timeStr : ''}</td>
          </tr>` : ''}
          <tr>
            <td style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; padding: 6px 0;">Guests</td>
            <td style="font-size: 15px; padding: 6px 0;">${booking.guestCount}</td>
          </tr>
          ${event.isVirtual && event.streamUrl ? `<tr>
            <td style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; padding: 6px 0;">Join link</td>
            <td style="font-size: 15px; padding: 6px 0;"><a href="${event.streamUrl}" style="color: #c9a96e;">${event.streamUrl}</a></td>
          </tr>` : ''}
          ${!event.isVirtual && event.locationAddress ? `<tr>
            <td style="font-size: 12px; letter-spacing: 0.1em; text-transform: uppercase; color: #888; padding: 6px 0;">Location</td>
            <td style="font-size: 15px; padding: 6px 0;">${event.locationName || ''}<br/>${event.locationAddress}</td>
          </tr>` : ''}
        </table>
      </div>

      <p style="font-size: 14px; color: #666; line-height: 1.7;">
        If you have any questions before the event, simply reply to this email and our team will be happy to help.
      </p>

      ${reviewToken ? `
      <div style="background: #f9f6f0; border: 1px solid #e0dbd0; border-radius: 4px; padding: 20px 24px; margin: 32px 0; text-align: center;">
        <p style="font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase; color: #c9a96e; margin: 0 0 10px;">
          After the event
        </p>
        <p style="font-size: 14px; color: #555; margin: 0 0 16px; line-height: 1.5;">
          We'd love to hear about your experience. Leave a review to help other couples discover this event.
        </p>
        <a href="https://luxuryweddingdirectory.com/review?token=${reviewToken}"
           style="display: inline-block; background: #1a1a1a; color: #ffffff; font-size: 12px; letter-spacing: 0.15em; text-transform: uppercase; text-decoration: none; padding: 12px 28px; border-radius: 2px;">
          Share Your Experience
        </a>
      </div>` : ''}

      <div style="border-top: 1px solid #e0dbd0; margin-top: 40px; padding-top: 20px;">
        <p style="font-size: 11px; color: #aaa; letter-spacing: 0.1em; text-transform: uppercase; margin: 0;">
          Luxury Wedding Directory · luxuryweddingdirectory.com
        </p>
      </div>
    </div>
  `

  return {
    to:      booking.email,
    subject: `Confirmed: ${event.title} · ${booking.bookingRef}`,
    html,
  }
}

// ─── Submit booking ───────────────────────────────────────────────────────────

/**
 * Full booking submission flow.
 *
 * @param {object} payload
 * @param {object} event  — the event object (from dbToEvent)
 * @returns {{ success, bookingId, bookingRef, leadId, error }}
 */
export async function submitEventBooking(payload, event) {
  try {
    if (!isSupabaseAvailable()) {
      // Dev fallback
      console.log('[eventBookingService] Supabase unavailable, logging locally', payload)
      return {
        success:    true,
        bookingId:  'offline-' + Date.now(),
        bookingRef: 'EVT-DEV1',
        leadId:     null,
        error:      null,
      }
    }

    // 1. Insert booking row
    const bookingRow = {
      event_id:               event.id,
      venue_id:               event.venueId || null,
      first_name:             payload.firstName,
      last_name:              payload.lastName,
      email:                  payload.email,
      phone:                  payload.phone  || null,
      guest_count:            payload.guestCount || 1,
      message:                payload.message || null,
      status:                 'confirmed',   // auto-confirm for now
      consent_marketing:      payload.consentMarketing      || false,
      consent_data_processing: payload.consentDataProcessing !== false,
    }

    const { data: bookingData, error: bookingError } = await supabase
      .from('event_bookings')
      .insert(bookingRow)
      .select('id, booking_ref, status, review_token')
      .single()

    if (bookingError) {
      console.error('[eventBookingService] insert failed:', bookingError.message)
      throw bookingError
    }

    const { id: bookingId, booking_ref: bookingRef, review_token: reviewToken } = bookingData

    // 2. Create lead (fire-and-forget, non-blocking)
    let leadId = null
    createLead({
      leadSource:             'event_booking',
      leadChannel:            'event_form',
      leadType:               'event_booking',
      venueId:                event.venueId,
      firstName:              payload.firstName,
      lastName:               payload.lastName,
      email:                  payload.email,
      phone:                  payload.phone,
      guestCount:             payload.guestCount,
      message:                payload.message,
      consentMarketing:       payload.consentMarketing,
      consentDataProcessing:  payload.consentDataProcessing,
      intentSummary:          `Event booking: ${event.title} on ${event.startDate}`,
      requirementsJson:       { eventId: event.id, bookingRef, eventTitle: event.title },
      tagsJson:               ['event_booking'],
    }).then(result => {
      leadId = result.leadId
      if (result.leadId) {
        // Back-fill lead_id on booking row (best-effort, not critical)
        supabase
          .from('event_bookings')
          .update({ lead_id: result.leadId })
          .eq('id', bookingId)
          .then(() => {})
      }
    }).catch(e => console.warn('[eventBookingService] createLead failed:', e.message))

    // 3. Send confirmation email
    const booking = dbToBooking({ ...bookingRow, id: bookingId, booking_ref: bookingRef })
    const emailPayload = buildConfirmationEmail({ booking, event, reviewToken })

    if (IS_DEV) {
      console.log('[eventBookingService] Confirmation email (dev):', emailPayload)
    } else {
      supabase.functions
        .invoke('send-email', { body: emailPayload })
        .then(({ error }) => {
          if (error) console.warn('[eventBookingService] send-email failed:', error.message)
          else {
            supabase
              .from('event_bookings')
              .update({ confirmation_sent_at: new Date().toISOString() })
              .eq('id', bookingId)
              .then(() => {})
          }
        })
    }

    return { success: true, bookingId, bookingRef, reviewToken: reviewToken || null, leadId, error: null }

  } catch (error) {
    console.error('[eventBookingService] submitEventBooking failed:', error)
    return { success: false, bookingId: null, bookingRef: null, leadId: null, error }
  }
}
