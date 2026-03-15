// ─── Lead Notification Service ───────────────────────────────────────────────
// Sends partner and internal notifications for new leads
// Tracks delivery in lead_notifications table
// Part of the Taigenic lead intelligence layer
// ─────────────────────────────────────────────────────────────────────────────

import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'

interface LeadRecord {
  id: string
  lead_source: string
  lead_type: string
  full_name: string | null
  first_name: string | null
  email: string | null
  phone: string | null
  wedding_month: string | null
  wedding_year: number | null
  guest_count: string | null
  budget_range: string | null
  message: string | null
  intent_summary: string | null
  score: number
  priority: string
  requirements_json: Record<string, any>
}

/**
 * Send lead notification to venue/vendor partner
 */
export async function sendPartnerLeadNotification(
  lead: LeadRecord,
  partnerEmail: string,
  partnerName: string | null
): Promise<{ success: boolean; error: any }> {
  try {
    const displayName = lead.full_name || lead.first_name || 'A couple'
    const dateInfo = lead.wedding_month
      ? `${lead.wedding_month}${lead.wedding_year ? ' ' + lead.wedding_year : ''}`
      : 'Not specified'

    const emailPayload = {
      to: partnerEmail,
      subject: `New Wedding Enquiry from ${displayName}`,
      html: `
        <h2>New Lead: ${displayName}</h2>
        <div style="background: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #c9a84c;">
          <p><strong>Name:</strong> ${displayName}</p>
          <p><strong>Email:</strong> ${lead.email || 'Not provided'}</p>
          <p><strong>Phone:</strong> ${lead.phone || 'Not provided'}</p>
          <p><strong>Wedding Date:</strong> ${dateInfo}</p>
          <p><strong>Guest Count:</strong> ${lead.guest_count || 'Not specified'}</p>
          ${lead.budget_range ? `<p><strong>Budget:</strong> ${lead.budget_range}</p>` : ''}
        </div>
        ${lead.message ? `<div style="margin: 20px 0;"><strong>Message:</strong><p>${lead.message}</p></div>` : ''}
        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Lead source: ${lead.lead_source}<br/>
          Luxury Wedding Directory
        </p>
      `,
    }

    // Dev mode: log to console
    if (import.meta.env.DEV) {
      console.log('📧 DEV - Partner Notification:', emailPayload)
      await logNotification(lead.id, 'partner_lead', 'partner', partnerEmail, 'sent', emailPayload)
      return { success: true, error: null }
    }

    // Production: call Supabase Edge Function
    if (isSupabaseAvailable()) {
      const { error } = await supabase.functions.invoke('send-email', { body: emailPayload })
      if (error) throw error
    }

    await logNotification(lead.id, 'partner_lead', 'partner', partnerEmail, 'sent', emailPayload)
    return { success: true, error: null }
  } catch (error) {
    console.error('leadNotificationService: Failed to send partner notification:', error)
    await logNotification(lead.id, 'partner_lead', 'partner', partnerEmail, 'failed', { error: String(error) })
    return { success: false, error }
  }
}

/**
 * Send lead notification to internal admin team
 */
export async function sendInternalLeadNotification(
  lead: LeadRecord
): Promise<{ success: boolean; error: any }> {
  const internalEmail = 'leads@luxuryweddingdirectory.com'

  try {
    const displayName = lead.full_name || lead.first_name || 'Unknown'
    const dateInfo = lead.wedding_month
      ? `${lead.wedding_month}${lead.wedding_year ? ' ' + lead.wedding_year : ''}`
      : 'Not specified'

    const emailPayload = {
      to: internalEmail,
      subject: `[Lead ${lead.priority?.toUpperCase()}] ${displayName} - ${lead.lead_type} (Score: ${lead.score})`,
      html: `
        <h2>New Lead: ${displayName}</h2>
        <table style="border-collapse: collapse; width: 100%; margin: 16px 0;">
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Score</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.score}/100</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Priority</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.priority}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Source</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.lead_source}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Type</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.lead_type}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Name</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${displayName}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Email</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.email || '-'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Phone</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.phone || '-'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Date</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${dateInfo}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Guests</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.guest_count || '-'}</td></tr>
          <tr><td style="padding: 8px; border-bottom: 1px solid #eee;"><strong>Budget</strong></td><td style="padding: 8px; border-bottom: 1px solid #eee;">${lead.budget_range || '-'}</td></tr>
        </table>
        ${lead.message ? `<div style="margin: 16px 0; padding: 12px; background: #f5f5f5; border-radius: 4px;"><strong>Message:</strong><br/>${lead.message}</div>` : ''}
        ${lead.intent_summary ? `<div style="margin: 16px 0;"><strong>Intent:</strong> ${lead.intent_summary}</div>` : ''}
        ${lead.requirements_json && Object.keys(lead.requirements_json).length > 0 ? `<div style="margin: 16px 0;"><strong>Requirements:</strong><pre style="background: #f5f5f5; padding: 12px; border-radius: 4px; font-size: 12px;">${JSON.stringify(lead.requirements_json, null, 2)}</pre></div>` : ''}
      `,
    }

    // Dev mode: log to console
    if (import.meta.env.DEV) {
      console.log('📧 DEV - Internal Notification:', emailPayload)
      await logNotification(lead.id, 'internal_lead', 'internal', internalEmail, 'sent', emailPayload)
      return { success: true, error: null }
    }

    if (isSupabaseAvailable()) {
      const { error } = await supabase.functions.invoke('send-email', { body: emailPayload })
      if (error) throw error
    }

    await logNotification(lead.id, 'internal_lead', 'internal', internalEmail, 'sent', emailPayload)
    return { success: true, error: null }
  } catch (error) {
    console.error('leadNotificationService: Failed to send internal notification:', error)
    await logNotification(lead.id, 'internal_lead', 'internal', internalEmail, 'failed', { error: String(error) })
    return { success: false, error }
  }
}

/**
 * Log a notification record to lead_notifications table
 */
export async function logNotification(
  leadId: string,
  notificationType: string,
  recipientType: string,
  recipientEmail: string,
  deliveryStatus: string,
  payload: Record<string, any>
): Promise<void> {
  if (!isSupabaseAvailable()) return

  try {
    await supabase.from('lead_notifications').insert({
      lead_id: leadId,
      notification_type: notificationType,
      recipient_type: recipientType,
      recipient_email: recipientEmail,
      delivery_status: deliveryStatus,
      payload_json: payload,
      sent_at: deliveryStatus === 'sent' ? new Date().toISOString() : null,
    })
  } catch (err) {
    console.warn('leadNotificationService: Failed to log notification:', err)
  }
}
