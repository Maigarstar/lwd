// ─── Lead Engine Service ─────────────────────────────────────────────────────
// Central orchestration for the lead gen system
// All lead sources normalize into one master payload and flow through here
// Part of the Taigenic lead intelligence layer
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'

// ─── Edge function proxy (service_role — bypasses RLS on leads table) ────────
const LEADS_EDGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-leads`
const ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

async function callLeadsEdge(action: string, params: Record<string, unknown> = {}): Promise<{ success: boolean; data?: any; error?: string }> {
  if (!LEADS_EDGE_URL || LEADS_EDGE_URL.startsWith('undefined')) {
    return { success: false, error: 'Supabase not configured' }
  }
  try {
    const res = await fetch(LEADS_EDGE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
      },
      body: JSON.stringify({ action, ...params }),
    })
    const json = await res.json()
    if (!json.success) return { success: false, error: json.error || `Edge error (HTTP ${res.status})` }
    return { success: true, data: json.data }
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' }
  }
}
import { scoreLead, getLeadPriority, getLeadValueBand } from './leadScoringService'
import type { LeadPayload } from './leadScoringService'
import { resolveLeadDestination } from './leadRoutingService'
import { sendPartnerLeadNotification, sendInternalLeadNotification } from './leadNotificationService'

// ─── Types ───────────────────────────────────────────────────────────────────

export type LeadStatus =
  | 'new'
  | 'qualified'
  | 'sent_to_partner'
  | 'partner_opened'
  | 'partner_replied'
  | 'in_conversation'
  | 'proposal_sent'
  | 'booked'
  | 'lost'
  | 'spam'

export type LeadEventType =
  | 'lead_created'
  | 'lead_scored'
  | 'partner_notified'
  | 'internal_notified'
  | 'partner_opened'
  | 'partner_replied'
  | 'status_changed'
  | 'lead_booked'
  | 'lead_lost'

export interface CreateLeadResult {
  success: boolean
  leadId: string | null
  score: number
  priority: string
  error: any
}

// ─── Core Functions ──────────────────────────────────────────────────────────

/**
 * Create a new lead - the single entry point for all lead sources
 *
 * Flow:
 * 1. Normalize and validate payload
 * 2. Score the lead
 * 3. Insert into leads table
 * 4. Record lead_created event
 * 5. Store initial message in lead_messages
 * 6. Route and send notifications
 * 7. Return result
 */
// Valid UUID v4 check — integer IDs from static data must not be sent to UUID columns
const toUUID = (v: any): string | null => {
  if (!v) return null
  const s = String(v)
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ? s : null
}

export async function createLead(payload: LeadPayload): Promise<CreateLeadResult> {
  try {
    // 1. Score the lead
    const score = scoreLead(payload)
    const priority = getLeadPriority(score)
    const valueBand = getLeadValueBand(payload)

    // 2. Build the database row
    const leadRow = {
      lead_source: payload.leadSource || 'unknown',
      lead_channel: payload.leadChannel || 'form',
      lead_type: payload.leadType || 'venue_enquiry',

      status: 'new' as LeadStatus,
      priority,
      score,

      listing_id: toUUID(payload.listingId),
      listing_type: payload.listingType || null,
      venue_id: toUUID(payload.venueId),
      vendor_id: toUUID(payload.vendorId),

      user_id: payload.userId || null,
      aura_session_id: payload.auraSessionId || null,
      conversation_id: payload.conversationId || null,

      first_name: payload.firstName || null,
      last_name: payload.lastName || null,
      full_name: payload.fullName || buildFullName(payload.firstName, payload.lastName),
      email: payload.email || null,
      phone: payload.phone || null,
      preferred_contact_method: payload.preferredContactMethod || null,

      wedding_date: payload.weddingDate || null,
      wedding_month: payload.weddingMonth || null,
      wedding_year: payload.weddingYear || null,
      exact_date_known: payload.exactDateKnown || false,
      guest_count: payload.guestCount || null,
      budget_range: payload.budgetRange || null,
      location_preference: payload.locationPreference || null,
      event_location: payload.eventLocation || null,

      message: payload.message || null,
      intent_summary: payload.intentSummary || null,
      requirements_json: payload.requirementsJson || {},
      tags_json: payload.tagsJson || [],

      consent_marketing: payload.consentMarketing || false,
      consent_data_processing: payload.consentDataProcessing !== false,

      lead_value_band: valueBand,
    }

    // 3. Insert lead via edge function (service_role bypasses RLS)
    if (!isSupabaseAvailable()) {
      console.log('leadEngineService: Supabase unavailable, logging lead locally')
      return { success: true, leadId: 'offline-' + Date.now(), score, priority, error: null }
    }

    console.log('leadEngineService: inserting lead via edge function')
    const edgeResult = await callLeadsEdge('create', { payload: leadRow })

    if (!edgeResult.success) {
      console.error('leadEngineService: leads INSERT failed —', edgeResult.error)
      throw new Error(edgeResult.error || 'Failed to create lead')
    }
    const leadId = edgeResult.data?.lead?.id
    if (!leadId) throw new Error('No lead ID returned from edge function')
    console.log('leadEngineService: lead created', leadId)

    // 4. Record lead_created event
    await recordLeadEvent(leadId, 'lead_created', {
      source: payload.leadSource,
      channel: payload.leadChannel,
      score,
      priority,
    })

    // 5. Store initial message
    if (payload.message) {
      callLeadsEdge('insert_message', {
        leadId,
        messageType: 'initial_enquiry',
        body: payload.message,
      }).catch(e => console.warn('leadEngineService: message insert failed:', e))
    }

    // 6. Route and send notifications (fire-and-forget)
    routeAndNotify(leadId, leadRow).catch(err =>
      console.error('leadEngineService: Notification routing failed:', err)
    )

    return { success: true, leadId, score, priority, error: null }
  } catch (error) {
    console.error('leadEngineService: Failed to create lead:', error)
    return { success: false, leadId: null, score: 0, priority: 'normal', error }
  }
}

/**
 * Get a lead by ID
 */
export async function getLeadById(leadId: string) {
  if (!isSupabaseAvailable()) return { data: null, error: new Error('Supabase unavailable') }

  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  return { data, error }
}

/**
 * Update a lead
 */
export async function updateLead(leadId: string, updates: Partial<Record<string, any>>) {
  if (!isSupabaseAvailable()) return { data: null, error: new Error('Supabase unavailable') }

  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single()

  return { data, error }
}

/**
 * Update lead status with event logging
 */
export async function updateLeadStatus(leadId: string, newStatus: LeadStatus) {
  const result = await updateLead(leadId, { status: newStatus })

  if (!result.error) {
    await recordLeadEvent(leadId, 'status_changed', { new_status: newStatus })

    // Record lifecycle timestamps
    const timestampMap: Partial<Record<LeadStatus, string>> = {
      booked: 'booked_at',
      lost: 'lost_at',
      sent_to_partner: 'vendor_notified_at',
      partner_replied: 'responded_at',
    }

    const tsField = timestampMap[newStatus]
    if (tsField) {
      await updateLead(leadId, { [tsField]: new Date().toISOString() })
    }
  }

  return result
}

/**
 * Record a timeline event for a lead
 */
export async function recordLeadEvent(
  leadId: string,
  eventType: LeadEventType | string,
  eventData: Record<string, any> = {},
  eventLabel?: string
) {
  if (!isSupabaseAvailable()) {
    console.log(`leadEngineService: Event [${eventType}] for lead ${leadId}:`, eventData)
    return
  }

  try {
    const params: Record<string, unknown> = { leadId, eventType, eventData }
    if (eventLabel) params.eventLabel = eventLabel
    await callLeadsEdge('insert_event', params)
  } catch (err) {
    console.warn('leadEngineService: Failed to record event:', err)
  }
}

/**
 * Attach conversation context from Aura to a lead
 */
export async function attachConversationContext(
  leadId: string,
  context: {
    auraSessionId?: string
    conversationId?: string
    rawSummary?: string
    intentSummary?: string
    requirementsJson?: Record<string, any>
  }
) {
  if (!isSupabaseAvailable()) return { data: null, error: new Error('Supabase unavailable') }

  const { data, error } = await supabase.from('lead_conversations').insert({
    lead_id: leadId,
    aura_session_id: context.auraSessionId || null,
    conversation_id: context.conversationId || null,
    raw_summary: context.rawSummary || null,
    intent_summary: context.intentSummary || null,
    requirements_json: context.requirementsJson || {},
  })

  if (!error) {
    await recordLeadEvent(leadId, 'conversation_attached', {
      aura_session_id: context.auraSessionId,
      has_intent: !!context.intentSummary,
    })
  }

  return { data, error }
}

/**
 * List leads with filters
 */
export async function listLeads(filters: {
  status?: string
  leadSource?: string
  leadType?: string
  vendorId?: string
  venueId?: string
  minScore?: number
  limit?: number
  offset?: number
} = {}) {
  if (!isSupabaseAvailable()) return { data: [], error: new Error('Supabase unavailable'), count: 0 }

  let query = supabase
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.status) query = query.eq('status', filters.status)
  if (filters.leadSource) query = query.eq('lead_source', filters.leadSource)
  if (filters.leadType) query = query.eq('lead_type', filters.leadType)
  if (filters.vendorId) query = query.eq('vendor_id', filters.vendorId)
  if (filters.venueId) query = query.eq('venue_id', filters.venueId)
  if (filters.minScore) query = query.gte('score', filters.minScore)

  const limit = filters.limit || 50
  const offset = filters.offset || 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  return { data: data || [], error, count: count || 0 }
}

// ─── Internal Helpers ────────────────────────────────────────────────────────

function buildFullName(first?: string, last?: string): string | null {
  const parts = [first, last].filter(Boolean)
  return parts.length > 0 ? parts.join(' ') : null
}

/**
 * Internal: route a lead and send notifications
 */
async function routeAndNotify(leadId: string, leadRow: Record<string, any>) {
  try {
    // Resolve routing destination
    const destination = await resolveLeadDestination({
      listingId: leadRow.listing_id,
      vendorId: leadRow.vendor_id,
      venueId: leadRow.venue_id,
    })

    const leadRecord = { id: leadId, ...leadRow } as any

    // Send partner notification
    if (destination.partnerEmail) {
      const partnerResult = await sendPartnerLeadNotification(
        leadRecord,
        destination.partnerEmail,
        destination.partnerName
      )
      if (partnerResult.success) {
        await recordLeadEvent(leadId, 'partner_notified', { email: destination.partnerEmail })
        await updateLead(leadId, {
          vendor_notified_at: new Date().toISOString(),
          status: 'sent_to_partner',
        })
      }
    }

    // Send internal notification (always)
    const internalResult = await sendInternalLeadNotification(leadRecord)
    if (internalResult.success) {
      await recordLeadEvent(leadId, 'internal_notified', { email: destination.internalEmail })
      await updateLead(leadId, { internal_notified_at: new Date().toISOString() })
    }
  } catch (err) {
    console.error('leadEngineService: routeAndNotify failed:', err)
  }
}
