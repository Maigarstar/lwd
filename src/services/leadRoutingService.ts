// ─── Lead Routing Service ────────────────────────────────────────────────────
// Determines where a lead should be routed: partner, internal, or both
// Part of the Taigenic lead intelligence layer
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import type { LeadPayload } from './leadScoringService'

// Route all listing reads through the admin edge function (service_role)
async function getListingById(id: string): Promise<{ name?: string; email?: string; contact_profile?: any } | null> {
  if (!isSupabaseAvailable() || !supabase) return null
  try {
    const { data, error } = await supabase.functions.invoke('admin-listings', {
      body: { action: 'getById', id },
    })
    if (error || !data?.success) return null
    return data.data ?? null
  } catch {
    return null
  }
}

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

  // Try to find partner contact from listing (via service_role edge fn)
  if (payload.listingId && isSupabaseAvailable()) {
    const row = await getListingById(payload.listingId)
    if (row) {
      partnerName  = row.name  || null
      partnerEmail = row.email || row.contact_profile?.email || null
    }
  }

  // Fallback: try vendor_id or venue_id lookup
  if (!partnerEmail && (payload.vendorId || payload.venueId) && isSupabaseAvailable()) {
    const row = await getListingById(payload.vendorId || payload.venueId!)
    if (row) {
      partnerName  = row.name  || null
      partnerEmail = row.email || row.contact_profile?.email || null
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
