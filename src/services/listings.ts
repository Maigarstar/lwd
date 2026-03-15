// Quality Tier System - Computed from content_quality_score (0-100)
export const QUALITY_TIERS = {
  platinum: {
    score: [90, 100],
    label: 'Platinum',
    icon: '◆',
    color: '#D4AF37',        // Bright gold
    bgColor: 'rgba(212, 175, 55, 0.1)',
    description: 'Exceptional venue with comprehensive, reviewed content',
    priority: 1
  },
  signature: {
    score: [70, 89],
    label: 'Signature',
    icon: '★',
    color: '#C9A84C',        // Muted gold
    bgColor: 'rgba(201, 168, 76, 0.1)',
    description: 'Premium venue with strong editorial standards',
    priority: 2
  },
  approved: {
    score: [50, 69],
    label: 'Approved',
    icon: '✓',
    color: '#10b981',        // Green
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Verified and approved venue',
    priority: 3
  },
  standard: {
    score: [0, 49],
    label: 'Standard',
    icon: null,
    color: '#9ca3af',        // Gray
    bgColor: 'transparent',
    description: 'Standard listing',
    priority: 4
  }
};

/**
 * Compute quality tier from content_quality_score (0-100)
 * Used for determining editorial tier badges
 */
export function getQualityTier(contentQualityScore: number): keyof typeof QUALITY_TIERS {
  if (contentQualityScore >= 90) return 'platinum';
  if (contentQualityScore >= 70) return 'signature';
  if (contentQualityScore >= 50) return 'approved';
  return 'standard';
}

/**
 * Get tier properties object
 */
export function getTierProperties(tier: string) {
  return QUALITY_TIERS[tier as keyof typeof QUALITY_TIERS] || QUALITY_TIERS.standard;
}

/**
 * Format tier label with icon
 */
export function formatTierLabel(tier: string): string {
  const props = getTierProperties(tier);
  if (tier === 'standard') return '';
  return props.icon ? `${props.icon} ${props.label}` : props.label;
}

// Manual editorial collections (editor-assigned)
export const EDITORIAL_COLLECTIONS = {
  'signature-venue': {
    label: 'Signature Venue',
    icon: '★',
    color: '#C9A84C',
    description: 'Exceptional venue in our signature collection'
  },
  'editors-choice': {
    label: 'Editor\'s Choice',
    icon: '✨',
    color: '#D4AF37',
    description: 'Handpicked by our editorial team'
  },
  'iconic-venue': {
    label: 'Iconic Venue',
    icon: '◆',
    color: '#8f7420',
    description: 'Historic or legendary venue'
  }
};

// System-driven collection (assigned by recommendation algorithm)
export const AURA_RECOMMENDED_COLLECTION = {
  id: 'aura-recommended',
  label: 'Aura Recommended',
  icon: '✓',
  color: '#10b981',
  description: 'Top match based on your preferences'
};
