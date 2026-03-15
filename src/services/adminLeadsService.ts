// ─── Admin Leads Service ──────────────────────────────────────────────────────
// Admin-only operations on the leads system using the service role client.
// This service bypasses RLS and is ONLY used by the admin dashboard.
// Public-facing lead creation still goes through leadEngineService.ts (anon key).
// ─────────────────────────────────────────────────────────────────────────────

import { supabaseAdmin, isAdminClientAvailable } from '../lib/supabaseAdmin'
import type { LeadStatus } from './leadEngineService'

// ─── Types ────────────────────────────────────────────────────────────────────

export interface LeadRow {
  id: string
  created_at: string
  updated_at: string
  lead_source: string
  lead_channel: string
  lead_type: string
  status: LeadStatus
  priority: string
  score: number
  listing_id: string | null
  listing_type: string | null
  venue_id: string | null
  vendor_id: string | null
  first_name: string | null
  last_name: string | null
  full_name: string | null
  email: string | null
  phone: string | null
  preferred_contact_method: string | null
  wedding_month: string | null
  wedding_year: number | null
  exact_date_known: boolean
  guest_count: string | null
  budget_range: string | null
  location_preference: string | null
  message: string | null
  intent_summary: string | null
  requirements_json: Record<string, any>
  tags_json: string[]
  consent_marketing: boolean
  vendor_notified_at: string | null
  internal_notified_at: string | null
  responded_at: string | null
  booked_at: string | null
  lost_at: string | null
  loss_reason: string | null
  lead_value_band: string | null
}

// ─── List Leads (admin) ───────────────────────────────────────────────────────

export async function adminListLeads(filters: {
  leadType?: string
  status?: string
  priority?: string
  search?: string
  limit?: number
  offset?: number
} = {}): Promise<{ data: LeadRow[]; count: number; error: any }> {
  if (!isAdminClientAvailable()) {
    return { data: [], count: 0, error: new Error('Admin client not available') }
  }

  let query = supabaseAdmin!
    .from('leads')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })

  if (filters.leadType)  query = query.eq('lead_type', filters.leadType)
  if (filters.status)    query = query.eq('status', filters.status)
  if (filters.priority)  query = query.eq('priority', filters.priority)

  const limit = filters.limit ?? 200
  const offset = filters.offset ?? 0
  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query
  return { data: (data as LeadRow[]) || [], count: count || 0, error }
}

// ─── Get Lead by ID (admin) ───────────────────────────────────────────────────

export async function adminGetLead(leadId: string): Promise<{ data: LeadRow | null; error: any }> {
  if (!isAdminClientAvailable()) {
    return { data: null, error: new Error('Admin client not available') }
  }

  const { data, error } = await supabaseAdmin!
    .from('leads')
    .select('*')
    .eq('id', leadId)
    .single()

  return { data: data as LeadRow | null, error }
}

// ─── Update Lead Status (admin) ───────────────────────────────────────────────
// Controlled update: only status, priority, and loss_reason are writable.

export async function adminUpdateLeadStatus(
  leadId: string,
  newStatus: LeadStatus,
  opts: { lossReason?: string } = {}
): Promise<{ data: LeadRow | null; error: any }> {
  if (!isAdminClientAvailable()) {
    return { data: null, error: new Error('Admin client not available') }
  }

  const updates: Record<string, any> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  }

  // Lifecycle timestamps
  const tsMap: Partial<Record<LeadStatus, string>> = {
    booked:           'booked_at',
    lost:             'lost_at',
    sent_to_partner:  'vendor_notified_at',
    partner_replied:  'responded_at',
  }
  const tsField = tsMap[newStatus]
  if (tsField) updates[tsField] = new Date().toISOString()
  if (newStatus === 'lost' && opts.lossReason) updates.loss_reason = opts.lossReason

  const { data, error } = await supabaseAdmin!
    .from('leads')
    .update(updates)
    .eq('id', leadId)
    .select()
    .single()

  // Record status change event
  if (!error && data) {
    await supabaseAdmin!.from('lead_events').insert({
      lead_id: leadId,
      event_type: 'status_changed',
      event_data: { new_status: newStatus, changed_by: 'admin', loss_reason: opts.lossReason || null },
    })
  }

  return { data: data as LeadRow | null, error }
}

// ─── Get Lead Timeline Events (admin) ────────────────────────────────────────

export async function adminGetLeadEvents(leadId: string): Promise<{ data: any[]; error: any }> {
  if (!isAdminClientAvailable()) {
    return { data: [], error: new Error('Admin client not available') }
  }

  const { data, error } = await supabaseAdmin!
    .from('lead_events')
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  return { data: data || [], error }
}
