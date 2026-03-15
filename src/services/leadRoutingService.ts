// ─── Lead Routing Service ────────────────────────────────────────────────────
// Determines where a lead should be routed: partner, internal, or both
// Part of the Taigenic lead intelligence layer
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import type { LeadPayload } from './leadScoringService'

export interface RouteDestination {
  partnerEmail: string | null
  partnerName: string | null
  internalEmail: string
  routeType: 'partner_and_internal' | 'internal_only' | 'partner_only'
}

const INTERNAL_ADMIN_EMAIL = 'leads@luxuryweddingdirectory.com'

/**
 * Resolve where a lead should be routed
 * Every lead goes to internal admin. Partner receives if we can identify them.
 */
export async function resolveLeadDestination(payload: LeadPayload): Promise<RouteDestination> {
  let partnerEmail: string | null = null
  let partnerName: string | null = null

  // Try to find partner contact from listing
  if (payload.listingId && isSupabaseAvailable()) {
    try {
      const { data } = await supabase
        .from('listings')
        .select('name, email, contact_profile')
        .eq('id', payload.listingId)
        .single()

      if (data) {
        partnerName = data.name || null
        partnerEmail = data.email || data.contact_profile?.email || null
      }
    } catch (err) {
      console.warn('leadRoutingService: Could not fetch listing for routing:', err)
    }
  }

  // Fallback: try vendor_id or venue_id lookup
  if (!partnerEmail && (payload.vendorId || payload.venueId) && isSupabaseAvailable()) {
    const lookupId = payload.vendorId || payload.venueId
    try {
      const { data } = await supabase
        .from('listings')
        .select('name, email, contact_profile')
        .eq('id', lookupId)
        .single()

      if (data) {
        partnerName = data.name || null
        partnerEmail = data.email || data.contact_profile?.email || null
      }
    } catch (err) {
      // Silent - we'll route to internal only
    }
  }

  return {
    partnerEmail,
    partnerName,
    internalEmail: INTERNAL_ADMIN_EMAIL,
    routeType: partnerEmail ? 'partner_and_internal' : 'internal_only',
  }
}

/**
 * Build partner recipient list for a lead
 */
export function buildPartnerRecipients(destination: RouteDestination): string[] {
  if (!destination.partnerEmail) return []
  return [destination.partnerEmail]
}

/**
 * Build internal recipient list for a lead
 */
export function buildInternalRecipients(destination: RouteDestination): string[] {
  return [destination.internalEmail]
}
