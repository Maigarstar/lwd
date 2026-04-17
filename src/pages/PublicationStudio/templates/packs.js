// ─── packs.js ────────────────────────────────────────────────────────────────
// Template Pack + Tier System for the LWD Publication Studio.
//
// Three tiers in ascending order:
//   starter   — free, included with every account
//   editorial — paid tier 1 (Phase 2 variant templates + editorial depth)
//   flagship  — paid tier 2 (all Phase 3 exclusives + complete library)
//
// To gate a new template, add its ID to the correct pack below.
// To upgrade a user, set brand.studio_tier to 'editorial' or 'flagship'.

export const PACKS = {
  starter: {
    id:    'starter',
    name:  'Starter',
    badge: 'Free',
    color: '#6ee7b7',
    desc:  'Core templates — everything you need for a complete magazine.',
    price: null,
  },
  editorial: {
    id:    'editorial',
    name:  'Editorial Pack',
    badge: '£29 / mo',
    color: '#C9A84C',
    desc:  'Premium variant templates and editorial depth. Phase 2 library.',
    price: '£29',
  },
  flagship: {
    id:    'flagship',
    name:  'Flagship Pack',
    badge: '£79 / mo',
    color: '#a78bfa',
    desc:  'Complete library — every template including Phase 3 exclusives.',
    price: '£79',
  },
};

// Tier hierarchy (lower index = lower tier)
export const TIER_ORDER = ['starter', 'editorial', 'flagship'];

// ── Template → Pack assignment ────────────────────────────────────────────────
// Every template ID must appear in exactly one pack.

const STARTER_IDS = new Set([
  // Cover & Navigation (essentials)
  'vogue-cover', 'editors-letter', 'table-of-contents', 'about-page',
  // Core editorial
  'feature-spread', 'pull-quote',
  // Fashion essentials
  'the-gown', 'beauty-edit',
  // Couple & Wedding essentials
  'couple-story', 'the-portrait', 'ceremony-aisle',
  // Venue essential
  'the-hotel',
  // Commercial
  'full-page-ad', 'venue-advertisement',
  // Back matter
  'back-cover',
]);

const EDITORIAL_IDS = new Set([
  // Phase 2 variant templates
  'cover-split', 'cover-typographic',
  'feature-cinematic', 'feature-minimal',
  'venue-skyline', 'venue-essay',
  'couple-gallery', 'story-chapter',
  // Additional Phase 1 depth
  'the-destination', 'the-runway', 'the-jewel', 'floral-spread',
  'cake-moment', 'reception-table',
  'planner-spotlight', 'the-interview',
  'invitation-suite',
  'the-triptych',
  'venue-portrait',
]);

const FLAGSHIP_IDS = new Set([
  // Phase 3 editorial categories (all exclusive to Flagship)
  'styled-shoot', 'wedding-gallery', 'supplier-credits', 'regional-opener',
  'planning-edit', 'season-opener', 'behind-scenes', 'honeymoon-diary',
  // Remaining Phase 1 templates
  'ring-edit', 'dress-detail', 'fashion-plate', 'dress-flat-lay',
  'aerial-venue', 'venue-directory', 'honeymoon-edit',
  'lux-grid', 'full-bleed',
  'product-showcase-ad',
]);

// ── Lookup helpers ────────────────────────────────────────────────────────────

/** Returns the pack ID ('starter' | 'editorial' | 'flagship') for a template. */
export function getTemplatePack(templateId) {
  if (STARTER_IDS.has(templateId))   return 'starter';
  if (EDITORIAL_IDS.has(templateId)) return 'editorial';
  if (FLAGSHIP_IDS.has(templateId))  return 'flagship';
  return 'starter'; // default fallback — unknown templates are always accessible
}

/**
 * Returns true if a template is locked for the given user tier.
 * @param {string} templateId
 * @param {string} userTier — 'starter' | 'editorial' | 'flagship'
 */
export function isTemplateLocked(templateId, userTier = 'starter') {
  const templateLevel = TIER_ORDER.indexOf(getTemplatePack(templateId));
  const userLevel     = TIER_ORDER.indexOf(userTier);
  return userLevel < templateLevel;
}

/** Returns the human-readable pack name for a template. */
export function getPackLabel(templateId) {
  return PACKS[getTemplatePack(templateId)]?.name || 'Starter';
}
