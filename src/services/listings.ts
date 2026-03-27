import { supabase, isSupabaseAvailable } from '../lib/supabaseClient'
import { supabaseAdmin } from '../lib/supabaseAdmin'
import { buildCardImgs, buildCardVideoUrl } from '../utils/mediaMappers'

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Convert camelCase keys to snake_case for database storage
 * Handles acronyms properly (e.g., heroCTA -> hero_cta, not hero_c_t_a)
 */
function camelToSnake(obj: any): any {
  const result: any = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert camelCase to snake_case, handling acronyms
      // heroCTA -> hero_cta (not hero_c_t_a)
      // heroVideoUrl -> hero_video_url
      const snakeKey = key
        .replace(/([a-z])([A-Z])/g, '$1_$2') // Insert _ before uppercase after lowercase
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1_$2') // Handle acronyms like URLParser -> URL_Parser
        .toLowerCase()

      result[snakeKey] = obj[key]
    }
  }

  return result
}

/**
 * Convert snake_case keys back to camelCase for frontend use
 * Database returns snake_case, but frontend expects camelCase
 */
function snakeToCamel(obj: any): any {
  const result: any = {}

  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      // Convert snake_case to camelCase
      // hero_cta -> heroCTA, hero_title -> heroTitle
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase())
      result[camelKey] = obj[key]
    }
  }

  return result
}

/**
 * Central mapper: Converts raw Supabase listing (snake_case) to frontend format (camelCase)
 *
 * This is the single point where all snake_case → camelCase conversion happens.
 * All UI components consume camelCase only. No dual access patterns in components.
 *
 * @param rawListing - Raw snake_case data from Supabase
 * @returns Clean camelCase Listing object for UI consumption
 */
export function mapListingFromDb(rawListing: any): Listing {
  if (!rawListing) return {} as Listing;

  // Convert all fields from snake_case to camelCase
  const listing = snakeToCamel(rawListing) as Listing;

  // Normalize media URLs: prepend "/" to relative paths for public folder access
  if (Array.isArray(listing.mediaItems)) {
    listing.mediaItems = listing.mediaItems.map((item: any) => ({
      ...item,
      url: item.url ? normaliseUrl(item.url) : item.url,
      src: item.src ? normaliseUrl(item.src) : item.src,
    }));
  }

  // Build imgs array from media_items for display
  if (Array.isArray(listing.mediaItems) && !listing.imgs) {
    listing.imgs = buildCardImgs(listing.mediaItems);
  }

  // Fallback: intake listings pushed before media_items fix have hero_images but
  // no media_items JSONB. Build a minimal imgs array from heroImages so QV + cards
  // always have at least a featured image to display.
  if ((!listing.imgs || listing.imgs.length === 0) && Array.isArray(listing.heroImages) && listing.heroImages.length > 0) {
    listing.imgs = listing.heroImages
      .filter((h: any) => h?.url)
      .map((h: any, i: number) => ({
        src:        normaliseUrl(h.url),
        url:        normaliseUrl(h.url),
        alt_text:   '',
        is_featured: h.featured ?? i === 0,
        sort_order:  i,
      }));
  }

  // Build video URL from media_items
  if (Array.isArray(listing.mediaItems) && !listing.videoUrl) {
    listing.videoUrl = buildCardVideoUrl(listing.mediaItems) ?? undefined;
  }

  return listing;
}

/**
 * Normalize URL: prepend "/" to relative paths for public folder access
 * External URLs (http, blob, data) pass through unchanged
 */
function normaliseUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('/') || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return '/' + url;
}

/**
 * Calculate content quality score (0-100) based on editorial completeness
 * Score breakdown:
 * - Section intros completed: 0-40 points (N filled sections / 6 max)
 * - Fact-checked: 30 points
 * - Approved: 30 points
 */
export function calculateContentQualityScore(
  sectionIntros: Record<string, string> | undefined,
  factChecked: boolean,
  approved: boolean
): number {
  let score = 0;

  // Section intros: 0-40 points (6 sections max)
  if (sectionIntros && typeof sectionIntros === 'object') {
    const filledSections = Object.values(sectionIntros)
      .filter(intro => intro && typeof intro === 'string' && intro.trim().length > 0)
      .length;
    const maxSections = Object.keys(sectionIntros).length || 6;
    score += Math.round((filledSections / maxSections) * 40);
  }

  // Fact-checked: 30 points
  if (factChecked === true) score += 30;

  // Approved: 30 points
  if (approved === true) score += 30;

  return Math.min(100, Math.max(0, score));
}

/**
 * Quality tier definitions for editorial curation
 * Tiers are assigned based on content_quality_score (0-100)
 */
export const QUALITY_TIERS = {
  platinum: {
    score: [90, 100],
    label: 'Platinum',
    icon: '◆',
    color: '#D4AF37',
    bgColor: 'rgba(212, 175, 55, 0.1)',
    description: 'Exceptional venue with comprehensive, reviewed content'
  },
  signature: {
    score: [70, 89],
    label: 'Signature',
    icon: '★',
    color: '#C9A84C',
    bgColor: 'rgba(201, 168, 76, 0.1)',
    description: 'Premium venue with strong editorial standards'
  },
  approved: {
    score: [50, 69],
    label: 'Approved',
    icon: '✓',
    color: '#10b981',
    bgColor: 'rgba(16, 185, 129, 0.1)',
    description: 'Verified and approved venue'
  },
  standard: {
    score: [0, 49],
    label: 'Standard',
    icon: null,
    color: '#9ca3af',
    bgColor: 'transparent',
    description: 'Standard listing'
  }
};

/**
 * Get quality tier based on content quality score
 * Maps 0-100 score to tier string: platinum, signature, approved, or standard
 */
export function getQualityTier(contentQualityScore: number): 'platinum' | 'signature' | 'approved' | 'standard' {
  if (contentQualityScore >= 90) return 'platinum';
  if (contentQualityScore >= 70) return 'signature';
  if (contentQualityScore >= 50) return 'approved';
  return 'standard';
}

/**
 * Get tier properties (label, icon, color, etc.) by tier name
 * Returns the tier configuration object with styling and metadata
 */
export function getTierProperties(tier: string): any {
  return QUALITY_TIERS[tier as keyof typeof QUALITY_TIERS] || QUALITY_TIERS.standard;
}

/**
 * Transform Supabase listing data to match frontend UI expectations
 * Maps database field names and values to expected format
 */
function transformSupabaseListingForUI(listing: any): any {
  const transformed = { ...listing }

  // Map status: draft -> Draft, published -> Published, paused -> Paused, archived -> Archived
  if (transformed.status) {
    transformed.status = transformed.status.charAt(0).toUpperCase() + transformed.status.slice(1)
  }

  // Ensure category field exists (use categorySlug if needed)
  if (!transformed.category && transformed.categorySlug) {
    transformed.category = transformed.categorySlug
  }

  // Set default values for display fields if missing
  if (!transformed.listed) {
    transformed.listed = transformed.createdAt ? new Date(transformed.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
  }
  if (!transformed.lastUpdated) {
    transformed.lastUpdated = transformed.updatedAt ? new Date(transformed.updatedAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'
  }
  if (!transformed.expires) {
    transformed.expires = 'N/A'
  }

  // Build rich imgs[] and primary videoUrl from media_items.
  // Any component rendering LuxuryVenueCard / LuxuryVendorCard from a DB listing will
  // receive structured image objects instead of plain URL strings, and the first
  // public video item's URL will populate the card's autoplay video slot.
  if (Array.isArray(transformed.mediaItems)) {
    if (!transformed.imgs) {
      transformed.imgs = buildCardImgs(transformed.mediaItems)
    }
    if (!transformed.videoUrl) {
      transformed.videoUrl = buildCardVideoUrl(transformed.mediaItems) ?? undefined
    }
  }

  // Fallback: hero_images → imgs for intake listings without media_items
  if ((!transformed.imgs || transformed.imgs.length === 0) && Array.isArray(transformed.heroImages) && transformed.heroImages.length > 0) {
    transformed.imgs = transformed.heroImages
      .filter((h: any) => h?.url)
      .map((h: any, i: number) => ({
        src:         h.url,
        url:         h.url,
        alt_text:    '',
        is_featured: h.featured ?? i === 0,
        sort_order:  i,
      }));
  }

  return transformed
}

/**
 * Normalize HTML content to ensure LTR text direction
 * Removes RTL marks and dir="rtl" attributes, ensures proper text direction
 */
function normalizeHTMLContent(html: string): string {
  if (!html || typeof html !== 'string') return html

  // Remove RTL direction attributes from HTML tags
  let normalized = html
    .replace(/\s+dir=["']?rtl["']?/gi, '') // Remove dir="rtl" or dir='rtl' attributes
    .replace(/\s+dir=["']?ltr["']?/gi, '') // Remove dir="ltr" attributes (we'll add explicit ltr styling)

  // Remove RTL Unicode characters (right-to-left marks, etc.)
  // U+200F = RIGHT-TO-LEFT MARK
  // U+202E = RIGHT-TO-LEFT OVERRIDE
  // U+202D = LEFT-TO-RIGHT OVERRIDE
  // U+061C = ARABIC LETTER MARK
  normalized = normalized
    .replace(/\u200F/g, '') // RLM
    .replace(/\u202E/g, '') // RLO
    .replace(/\u202D/g, '') // LRO
    .replace(/\u061C/g, '') // ALM

  // Add LTR styling to HTML and body tags if they exist
  // Ensure all content containers have LTR text direction
  if (normalized.includes('<div') || normalized.includes('<p') || normalized.includes('<span')) {
    // Content already has HTML structure, ensure top-level direction is set
    // This will be handled by the component's inline styles
  }

  return normalized
}

/**
 * Generate a URL-friendly slug from text
 */
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

/**
 * Prepare listing data for database storage
 * Normalizes HTML content and ensures text direction is LTR
 */
function prepareListingData(data: Listing): Listing {
  const prepared = { ...data }

  // Normalize HTML content fields to remove RTL marks and ensure LTR text direction
  const htmlFields = [
    'description',
    'shortDescription',
    'heroTitle',
    'heroSubtitle',
    'heroDescription',
    'heroButton',
    'cardTitle',
    'cardSubtitle',
    'cardSummary',
    'internalNotes',
    'seoTitle',
    'seoDescription',
    'seoKeywords'
  ]

  for (const field of htmlFields) {
    if ((prepared as any)[field] && typeof (prepared as any)[field] === 'string') {
      (prepared as any)[field] = normalizeHTMLContent((prepared as any)[field])
    }
  }

  // Auto-generate slug if not provided or empty
  if (!prepared.slug || prepared.slug.trim() === '') {
    prepared.slug = generateSlug(prepared.name || 'listing')
  }

  // Ensure all required fields are present
  if (!prepared.listingType) prepared.listingType = 'venue'
  if (!prepared.tier) prepared.tier = 'platinum'

  return prepared
}

/**
 * Map form field names to database field names
 * Complete explicit mapping to ensure no conversion errors
 */
function mapFormToDatabaseFields(data: any): any {
  const mapped: any = {}

  // Complete field mapping from form (camelCase) to database (snake_case)
  const fieldMap: { [key: string]: string } = {
    // Core listing data
    'listingType': 'listing_type',
    'tier': 'tier',
    'name': 'name',
    'heroTagline': 'hero_tagline',
    'slug': 'slug',
    'description': 'description',
    'shortDescription': 'short_description',
    'country': 'country',
    'countrySlug': 'country_slug',
    'region': 'region',
    'regionSlug': 'region_slug',
    'city': 'city',
    'citySlug': 'city_slug',
    'address': 'address',
    'postcode': 'postcode',
    'lat': 'lat',
    'lng': 'lng',
    'nearestAirport': 'nearest_airport',
    'travelTime': 'travel_time',
    'categorySlug': 'category_slug',
    'subCategorySlug': 'sub_category_slug',
    'tags': 'tags',
    'styles': 'styles',
    'cardTitle': 'card_title',
    'cardSubtitle': 'card_subtitle',
    'cardSummary': 'card_summary',
    'cardImage': 'card_image',
    'cardBadge': 'card_badge',
    'cardStyle': 'card_style',
    'cardFeatured': 'card_featured',
    'cardPromoted': 'card_promoted',
    'heroType': 'hero_type',
    'heroLayout': 'hero_layout',
    'heroEyebrow': 'hero_eyebrow',
    'heroTitle': 'hero_title',
    'heroSubtitle': 'hero_subtitle',
    'heroImage': 'hero_image',
    'heroImageSet': 'hero_image_set',
    'heroVideoUrl': 'hero_video_url',
    'heroYoutubeUrl': 'hero_youtube_url',
    'heroVimeoUrl': 'hero_vimeo_url',
    'heroPosterImage': 'hero_poster_image',
    'heroCTA': 'hero_cta',
    'heroBadge': 'hero_badge',
    'capacityMin': 'capacity_min',
    'capacityMax': 'capacity_max',
    'builtYear': 'built_year',
    'propertySize': 'property_size',
    'propertySizeUnit': 'property_size_unit',
    'rating': 'rating',
    'reviewCount': 'review_count',
    'priceLabel': 'price_label',
    'priceFrom': 'price_from',
    'priceCurrency': 'price_currency',
    'venueType': 'venue_type',
    // Exclusive Use block
    'exclusiveUseEnabled':     'exclusive_use_enabled',
    'exclusiveUseTitle':       'exclusive_use_title',
    'exclusiveUseSubtitle':    'exclusive_use_subtitle',
    'exclusiveUsePrice':       'exclusive_use_price',
    'exclusiveUseSubline':     'exclusive_use_subline',
    'exclusiveUseDescription': 'exclusive_use_description',
    'exclusiveUseCtaText':     'exclusive_use_cta_text',
    'exclusiveUseIncludes':    'exclusive_use_includes',
    // Catering cards (max 3, stored as JSONB array)
    'cateringEnabled':         'catering_enabled',
    'cateringCards':           'catering_cards',
    // Wedding Weekend day cards (max 4)
    'weddingWeekendEnabled':   'wedding_weekend_enabled',
    'weddingWeekendSubtitle':  'wedding_weekend_subtitle',
    'weddingWeekendDays':      'wedding_weekend_days',
    // On the Estate + Nearby Experiences
    'estateEnabled':           'estate_enabled',
    'estateItems':             'estate_items',
    'nearbyEnabled':           'nearby_enabled',
    'nearbyItems':             'nearby_items',
    // FAQ section
    'faqEnabled':              'faq_enabled',
    'faqTitle':                'faq_title',
    'faqSubtitle':             'faq_subtitle',
    'faqCtaEnabled':           'faq_cta_enabled',
    'faqCtaHeadline':          'faq_cta_headline',
    'faqCtaSubtext':           'faq_cta_subtext',
    'faqCtaButtonText':        'faq_cta_button_text',
    'faqCategories':           'faq_categories',
    // Venue spaces (max 5, stored as JSONB array)
    'spaces': 'spaces',
    // Rooms & accommodation
    'roomsAccommodationType': 'rooms_accommodation_type',
    'roomsTotal': 'rooms_total',
    'roomsSuites': 'rooms_suites',
    'roomsMaxGuests': 'rooms_max_guests',
    'roomsExclusiveUse': 'rooms_exclusive_use',
    'roomsMinStay': 'rooms_min_stay',
    'roomsDescription': 'rooms_description',
    // Dining
    'diningStyle': 'dining_style',
    'diningChefName': 'dining_chef_name',
    'diningInHouse': 'dining_in_house',
    'diningExternal': 'dining_external',
    'diningMenuStyles': 'dining_menu_styles',
    'diningDietary': 'dining_dietary',
    'diningDrinks': 'dining_drinks',
    'diningDescription': 'dining_description',
    'diningMenuImages': 'dining_menu_images',
    // Rooms images
    'roomsImages': 'rooms_images',
    // Hero caption / credit (from hero_images array)
    'heroCaption': 'hero_caption',
    'heroCredit': 'hero_credit',
    // Videos (JSONB array)
    'videos': 'videos',
    // Contact profile, opening hours, social proof
    'contactProfile': 'contact_profile',
    'weddingsHosted': 'weddings_hosted',
    'memberSince': 'member_since',
    'openingHoursEnabled': 'opening_hours_enabled',
    'openingHours': 'opening_hours',
    'pressFeatures': 'press_features',
    'awards': 'awards',
    'visibility': 'visibility',
    'vendorAccountId': 'vendor_account_id',
    'managedAccountId': 'managed_account_id',
    'ceremonySpaces': 'ceremony_spaces',
    'receptionSpaces': 'reception_spaces',
    'accommodation': 'accommodation',
    'dining': 'dining',
    'amenities': 'amenities',
    'exclusiveUse': 'exclusive_use',
    'indoorOption': 'indoor_option',
    'outdoorOption': 'outdoor_option',
    'fireworksPolicy': 'fireworks_policy',
    'dronePolicy': 'drone_policy',
    'accessibilityNotes': 'accessibility_notes',
    'heroMediaRole': 'hero_media_role',
    'cardMediaRole': 'card_media_role',
    'galleryMediaRole': 'gallery_media_role',
    'seoTitle': 'seo_title',
    'seoDescription': 'seo_description',
    'seoKeywords': 'seo_keywords',
    'focusKeyword': 'focus_keyword',
    'slugPreview': 'slug_preview',
    'internalNotes': 'internal_notes',
    'status': 'status',
    'isFeatured': 'is_featured',
    'isPromoted': 'is_promoted',
    'isHidden': 'is_hidden',
    'isVerified': 'is_verified',
    'showcaseEnabled': 'showcase_enabled',
    'showcaseCategory': 'showcase_category',
    'lwdScore': 'lwd_score',
    'featureStartDate': 'feature_start_date',
    'featureEndDate': 'feature_end_date',
    'enquiries': 'enquiries',
    'viewCount': 'view_count',
    'createdAt': 'created_at',
    'updatedAt': 'updated_at',
    'publishedAt': 'published_at',
    // Rich media items, stored as JSONB; File objects must be stripped before calling
    'mediaItems': 'media_items',
    // Description read-more toggle
    'readmoreEnabled': 'readmore_enabled',
    // Editorial Content Layer (Phase 3)
    'heroSummary': 'hero_summary',
    'sectionIntros': 'section_intros',
    'editorialApproved': 'editorial_approved',
    'editorialFactChecked': 'editorial_fact_checked',
    'editorialLastReviewedAt': 'editorial_last_reviewed_at',
    'editorialLastReviewedBy': 'editorial_last_reviewed_by',
    'refreshNotes': 'refresh_notes',
    'contentQualityScore': 'content_quality_score',
  }

  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      const dbKey = fieldMap[key]
      if (dbKey) {
        mapped[dbKey] = data[key]
      }
    }
  }

  return mapped
}

/**
 * Sanitize listing payload before sending to Supabase
 * Converts empty strings to null for numeric/date fields
 * Converts valid values to appropriate types
 */
function sanitizeListingPayload(data: any): any {
  const sanitized = { ...data }

  // Integer fields that should be null if empty
  const integerFields = [
    'capacity_min',
    'capacity_max',
    'built_year',
    'review_count',
    'enquiries',
    'view_count',
  ]

  // Numeric/decimal fields that should be null if empty
  const numericFields = [
    'lat',
    'lng',
    'property_size',
    'rating',
    'lwd_score',
  ]

  // Date fields that should be null if empty
  const dateFields = [
    'feature_start_date',
    'feature_end_date',
    'published_at',
  ]

  // Process integer fields
  for (const field of integerFields) {
    if (field in sanitized) {
      const value = sanitized[field]
      if (value === '' || value === undefined || value === null) {
        sanitized[field] = null
      } else {
        const num = parseInt(String(value), 10)
        sanitized[field] = isNaN(num) ? null : num
      }
    }
  }

  // Process numeric/decimal fields
  for (const field of numericFields) {
    if (field in sanitized) {
      const value = sanitized[field]
      if (value === '' || value === undefined || value === null) {
        sanitized[field] = null
      } else {
        const num = parseFloat(String(value))
        sanitized[field] = isNaN(num) ? null : num
      }
    }
  }

  // Process date fields
  for (const field of dateFields) {
    if (field in sanitized) {
      const value = sanitized[field]
      if (value === '' || value === undefined || value === null) {
        sanitized[field] = null
      }
      // Keep valid date strings as-is
    }
  }

  return sanitized
}

// ═══════════════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

export interface ListingMedia {
  id: string
  listing_id: string
  type: 'image' | 'video'
  url: string
  caption?: string
  alt_text?: string
  role?: 'hero' | 'card' | 'gallery'
  featured: boolean
  display_order: number
  video_title?: string
  video_type?: 'vimeo' | 'youtube' | 'internal'
  thumbnail?: string
  duration?: string
}

export interface Listing {
  id?: string
  listingType: string
  tier: string
  name: string
  slug: string
  description?: string
  shortDescription?: string
  country?: string
  countrySlug?: string
  region?: string
  regionSlug?: string
  city?: string
  citySlug?: string
  address?: string
  postcode?: string
  lat?: number
  lng?: number
  nearestAirport?: string
  travelTime?: string
  categorySlug?: string
  subCategorySlug?: string
  tags?: string[]
  styles?: string[]
  cardTitle?: string
  cardSubtitle?: string
  cardSummary?: string
  cardImage?: string
  cardBadge?: string
  cardStyle?: string
  cardFeatured?: boolean
  cardPromoted?: boolean
  heroType?: string
  heroEyebrow?: string
  heroTitle?: string
  heroSubtitle?: string
  heroImage?: string
  heroImageSet?: string[]
  heroVideoUrl?: string
  heroYoutubeUrl?: string
  heroVimeoUrl?: string
  heroPosterImage?: string
  heroCTA?: string
  heroBadge?: string
  capacityMin?: number
  capacityMax?: number
  builtYear?: number
  propertySize?: number
  propertySizeUnit?: string
  rating?: number
  reviewCount?: number
  priceLabel?: string
  priceFrom?: string
  priceCurrency?: string
  venueType?: string
  ceremonySpaces?: string
  receptionSpaces?: string
  accommodation?: string
  dining?: string
  amenities?: string[]
  exclusiveUse?: boolean
  indoorOption?: boolean
  outdoorOption?: boolean
  fireworksPolicy?: string
  dronePolicy?: string
  accessibilityNotes?: string
  heroMediaRole?: string
  cardMediaRole?: string
  galleryMediaRole?: string
  seoTitle?: string
  seoDescription?: string
  seoKeywords?: string
  focusKeyword?: string
  slugPreview?: string
  internalNotes?: string
  status?: 'draft' | 'published' | 'paused' | 'archived'
  isFeatured?: boolean
  isPromoted?: boolean
  isHidden?: boolean
  isVerified?: boolean
  lwdScore?: number
  featureStartDate?: string
  featureEndDate?: string
  enquiries?: number
  viewCount?: number
  createdAt?: string
  updatedAt?: string
  publishedAt?: string
  // Editorial Content Layer (Phase 3)
  heroSummary?: string
  sectionIntros?: Record<string, string>
  editorialApproved?: boolean
  editorialFactChecked?: boolean
  editorialLastReviewedAt?: string
  editorialLastReviewedBy?: string
  refreshNotes?: string
  contentQualityScore?: number
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTINGS SERVICE
// ═══════════════════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════════════════
// AI MEDIA INDEX SYNC
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Fire-and-forget: sync a listing's media_items into the media_ai_index table.
 *
 * Called after every successful create / update. Non-blocking, failures are
 * logged as warnings but never throw or affect the save result.
 *
 * @param listingId  , the saved listing's uuid
 * @param data       , the raw form payload (contains mediaItems + meta fields)
 */
function syncMediaAIIndex(listingId: string, data: any): void {
  if (!listingId) return;

  const mediaItems = Array.isArray(data.mediaItems)
    ? data.mediaItems
    : [];

  const listingMeta = {
    id:          listingId,
    name:        data.name        || data.venueName     || '',
    category:    data.categorySlug                      || '',
    country:     data.country                           || '',
    region:      data.region                            || '',
    destination: data.countrySlug || data.destination   || '',
    type:        data.listingType                       || 'venue',
  };

  // Fire-and-forget, do not await
  supabase!.functions
    .invoke('sync-media-ai-index', {
      body: { listing_id: listingId, listing_meta: listingMeta, media_items: mediaItems },
    })
    .then(({ error }) => {
      if (error) {
        console.warn('[AI sync] media_ai_index sync failed (non-blocking):', error);
      }
    })
    .catch((err) =>
      console.warn('[AI sync] media_ai_index invoke error (non-blocking):', err)
    );
}

/**
 * Create a new listing in Supabase
 */
export async function createListing(data: Listing) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    // Prepare data (auto-generate slug, ensure required fields)
    const prepared = prepareListingData(data)

    // Map form field names to database field names
    const mapped = mapFormToDatabaseFields(prepared)

    // Sanitize payload: convert empty strings to null for numeric/date fields
    const dbData = sanitizeListingPayload(mapped)

    let { data: listing, error } = await (supabaseAdmin || supabase)!
      .from('listings')
      .insert([dbData])
      .select()
      .single()

    // Graceful retry: if managed_account_id column doesn't exist yet (schema cache miss), strip and retry
    // Only catches schema/column-not-found errors, not FK constraint violations
    if (error && error.message?.includes('managed_account_id') && error.message?.includes('schema cache')) {
      const { managed_account_id: _ma, ...dbDataWithout } = dbData as any
      const retried = await (supabaseAdmin || supabase)!.from('listings').insert([dbDataWithout]).select().single()
      if (retried.error) throw retried.error
      listing = retried.data
      error = null
    }

    if (error) throw error

    // Fire-and-forget: sync rich media metadata into AI search index
    syncMediaAIIndex(listing.id, data)

    // Convert snake_case database response back to camelCase for frontend
    return snakeToCamel(listing) as Listing
  } catch (error) {
    console.error('Error creating listing:', error)
    throw error
  }
}

/**
 * Update an existing listing
 */
export async function updateListing(id: string, data: Partial<Listing>) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    // Prepare data (auto-generate slug if needed)
    const prepared = prepareListingData({ ...data } as Listing)

    // Map form field names to database field names
    const mapped = mapFormToDatabaseFields({
      ...prepared,
      updatedAt: new Date().toISOString(), // Use camelCase so it gets mapped correctly to updated_at
    })

    // Sanitize payload: convert empty strings to null for numeric/date fields
    const updateData = sanitizeListingPayload(mapped)

    let { data: listing, error } = await (supabaseAdmin || supabase)!
      .from('listings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    // Graceful retry: if managed_account_id column doesn't exist yet (schema cache miss), strip and retry
    // Only catches schema/column-not-found errors, not FK constraint violations
    if (error && error.message?.includes('managed_account_id') && error.message?.includes('schema cache')) {
      const { managed_account_id: _ma, ...updateDataWithout } = updateData as any
      const retried = await (supabaseAdmin || supabase)!.from('listings').update(updateDataWithout).eq('id', id).select().single()
      if (retried.error) throw retried.error
      listing = retried.data
      error = null
    }

    if (error) {
      console.error("Supabase UPDATE error:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      console.error("Error details:", error);
      throw error
    }

    // Fire-and-forget: sync rich media metadata into AI search index
    syncMediaAIIndex(listing.id, data)

    // Convert snake_case database response back to camelCase for frontend
    return snakeToCamel(listing) as Listing
  } catch (error) {
    console.error('Error updating listing:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'N/A')
    throw error
  }
}

/**
 * Fetch a single listing by ID
 */
export async function fetchListingById(id: string) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { data: listing, error } = await supabase!
      .from('listings')
      .select()
      .eq('id', id)
      .single()

    if (error) throw error
    // Map raw DB data to camelCase frontend format (single point of conversion)
    return mapListingFromDb(listing)
  } catch (error) {
    console.error('Error fetching listing:', error)
    throw error
  }
}

/**
 * Fetch the listing linked to a managed account.
 * Returns a lightweight subset used by the client portal.
 */
export async function fetchListingByManagedAccountId(managedAccountId: string) {
  if (!isSupabaseAvailable() || !supabase) return null;
  try {
    const { data, error } = await supabase
      .from('listings')
      .select('id, name, slug, status, hero_image, hero_tagline, card_image, city, country, region, listing_type, review_count, rating, price_from, price_currency')
      .eq('managed_account_id', managedAccountId)
      .maybeSingle();
    if (error || !data) return null;
    return mapListingFromDb(data);
  } catch (err) {
    console.error('[Listings] fetchListingByManagedAccountId error:', err);
    return null;
  }
}

/**
 * Fetch a single listing by slug
 */
export async function fetchListingBySlug(slug: string) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { data: listing, error } = await supabase!
      .from('listings')
      .select()
      .eq('slug', slug)
      .maybeSingle()

    // maybeSingle() returns null (not an error) when no row found
    if (error) throw error
    if (!listing) return null
    // Map raw DB data to camelCase frontend format (single point of conversion)
    return mapListingFromDb(listing)
  } catch (error) {
    throw error
  }
}

/**
 * Fetch all listings with optional filters
 */
export async function fetchListings(filters?: {
  status?: string
  category_slug?: string
  region_slug?: string
  country_slug?: string
  listing_type?: string
}) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    let query = supabase!.from('listings').select()

    if (filters?.status) query = query.eq('status', filters.status)
    if (filters?.category_slug) query = query.eq('category_slug', filters.category_slug)
    if (filters?.region_slug) query = query.eq('region_slug', filters.region_slug)
    if (filters?.country_slug) query = query.eq('country_slug', filters.country_slug)
    if (filters?.listing_type) query = query.eq('listing_type', filters.listing_type)

    const { data: listings, error } = await query.order('created_at', { ascending: false })

    if (error) throw error

    // Convert snake_case database fields back to camelCase for frontend
    const camelListings = listings?.map(listing => snakeToCamel(listing)) ?? []

    // Transform to match UI expectations (status formatting, display fields, etc.)
    const uiListings = camelListings.map(listing => transformSupabaseListingForUI(listing))

    return uiListings as Listing[]
  } catch (error) {
    console.error('Error fetching listings:', error)
    throw error
  }
}

/**
 * Save a listing as draft (status = 'draft')
 */
export async function saveDraft(id: string | undefined, data: Listing) {
  const draftData = {
    ...data,
    status: 'draft' as const,
  }

  if (id) {
    return updateListing(id, draftData)
  } else {
    return createListing(draftData)
  }
}

/**
 * Publish a listing (status = 'published')
 */
export async function publishListing(id: string | undefined, data: Listing) {
  const publishData = {
    ...data,
    status: 'published' as const,
    published_at: new Date().toISOString(),
  }

  if (id) {
    return updateListing(id, publishData)
  } else {
    return createListing(publishData)
  }
}

/**
 * Delete a listing
 */
export async function deleteListing(id: string) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await supabase!
      .from('listings')
      .delete()
      .eq('id', id)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting listing:', error)
    throw error
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LISTING MEDIA SERVICE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Add media to a listing
 */
export async function addListingMedia(listingId: string, media: Omit<ListingMedia, 'id' | 'listing_id'>) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await supabase!
      .from('listing_media')
      .insert([{ ...media, listing_id: listingId }])
      .select()
      .single()

    if (error) throw error
    return data as ListingMedia
  } catch (error) {
    console.error('Error adding listing media:', error)
    throw error
  }
}

/**
 * Fetch media for a listing
 */
export async function fetchListingMedia(listingId: string) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await supabase!
      .from('listing_media')
      .select()
      .eq('listing_id', listingId)
      .order('display_order', { ascending: true })

    if (error) throw error
    return data as ListingMedia[]
  } catch (error) {
    console.error('Error fetching listing media:', error)
    return []
  }
}

/**
 * Update listing media
 */
export async function updateListingMedia(mediaId: string, updates: Partial<ListingMedia>) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { data, error } = await supabase!
      .from('listing_media')
      .update(updates)
      .eq('id', mediaId)
      .select()
      .single()

    if (error) throw error
    return data as ListingMedia
  } catch (error) {
    console.error('Error updating listing media:', error)
    throw error
  }
}

/**
 * Delete listing media
 */
export async function deleteListingMedia(mediaId: string) {
  if (!isSupabaseAvailable()) {
    console.error('Supabase not configured')
    throw new Error('Supabase not configured')
  }

  try {
    const { error } = await supabase!
      .from('listing_media')
      .delete()
      .eq('id', mediaId)

    if (error) throw error
  } catch (error) {
    console.error('Error deleting listing media:', error)
    throw error
  }
}

// Re-export the helper function
export { isSupabaseAvailable }
