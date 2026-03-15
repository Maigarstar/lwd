// ─── Lead Scoring Service ────────────────────────────────────────────────────
// Computes lead quality score and priority based on data completeness and intent
// Part of the Taigenic lead intelligence layer
// ─────────────────────────────────────────────────────────────────────────────

export interface LeadPayload {
  leadSource?: string
  leadChannel?: string
  leadType?: string
  listingId?: string
  listingType?: string
  venueId?: string
  vendorId?: string
  userId?: string
  auraSessionId?: string
  conversationId?: string
  firstName?: string
  lastName?: string
  fullName?: string
  email?: string
  phone?: string
  preferredContactMethod?: string
  weddingDate?: string | null
  weddingMonth?: string
  weddingYear?: number
  exactDateKnown?: boolean
  guestCount?: string
  budgetRange?: string
  locationPreference?: string
  eventLocation?: string
  message?: string
  intentSummary?: string
  requirementsJson?: Record<string, any>
  tagsJson?: string[]
  consentMarketing?: boolean
  consentDataProcessing?: boolean
}

export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent'

/**
 * Score a lead based on data completeness and engagement signals
 * Returns 0-100
 */
export function scoreLead(payload: LeadPayload): number {
  let score = 0

  // Contact completeness
  if (payload.email) score += 15
  if (payload.phone) score += 10

  // Wedding planning signals
  if (payload.weddingDate || payload.weddingMonth) score += 10
  if (payload.guestCount) score += 10
  if (payload.budgetRange) score += 10

  // Message quality
  if (payload.message && payload.message.trim().length > 80) score += 10

  // Channel engagement (chat = higher intent)
  if (payload.leadChannel === 'chat') score += 10

  // Intent clarity
  if (payload.intentSummary) score += 10

  // Requirements depth
  if (payload.requirementsJson && Object.keys(payload.requirementsJson).length > 2) score += 15

  return Math.min(100, score)
}

/**
 * Map a numeric score to a priority band
 */
export function getLeadPriority(score: number): LeadPriority {
  if (score >= 80) return 'urgent'
  if (score >= 60) return 'high'
  if (score >= 30) return 'normal'
  return 'low'
}

/**
 * Estimate lead value band based on budget and guest count
 */
export function getLeadValueBand(payload: LeadPayload): string | null {
  if (!payload.budgetRange) return null

  const budget = payload.budgetRange.toLowerCase()
  if (budget.includes('100,000') || budget.includes('100k')) return 'ultra_premium'
  if (budget.includes('50,000') || budget.includes('50k')) return 'premium'
  if (budget.includes('20,000') || budget.includes('20k')) return 'mid_high'
  if (budget.includes('10,000') || budget.includes('10k')) return 'mid'
  return 'standard'
}
