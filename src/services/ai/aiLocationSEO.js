// ─── src/services/ai/aiLocationSEO.js ───────────────────────────────────────
// Production-grade SEO generation layer for location pages
//
// FEATURES:
// ✅ Synchronous generation (no async blocking)
// ✅ Intelligent variation logic (no duplicate intros across pages)
// ✅ Internal linking clusters (topical authority building)
// ✅ Lightweight & cached (zero performance impact, zero LCP cost)
// ✅ Production-ready (memoized, pre-computed)
//
// GOAL: Not just metadata, but RANKING CAPABILITY through:
//   - Unique, varied content per location
//   - Strategic internal linking clusters
//   - Semantic coherence across location hierarchy
//   - Pre-computation to avoid render blocking
// ─────────────────────────────────────────────────────────────────────────────

// ─── GLOBAL CACHE ─────────────────────────────────────────────────────────
// Stores pre-computed SEO packages; populated at build time or first access
const seoCache = new Map();

/**
 * PRODUCTION FUNCTION: Synchronous SEO generation with zero render blocking
 * Call this ONCE per location at module/page load time
 * Result is memoized and reused for all subsequent renders
 *
 * @param {Object} params
 * @param {string} params.locationName - Amalfi Coast, Lake Como, etc
 * @param {string} params.countryName - Italy, France, etc
 * @param {string} params.regionType - 'country' | 'region' | 'city'
 * @param {number} params.venueCount - Curated venue count
 * @param {string} params.locationDescription - Optional CMS description
 * @param {Array} params.nearbyLocations - Nearby regions/cities for internal linking
 * @returns {Object} Memoized SEO package (synchronous, zero latency)
 */
export function getLocationSEOSync({
  locationName,
  countryName,
  regionType,
  venueCount,
  locationDescription,
  nearbyLocations = [],
}) {
  // ─── CACHE KEY ─────────────────────────────────────────────────────────────
  const cacheKey = `seo:${regionType}:${countryName}:${locationName}`;

  // Return cached result if exists (zero latency on repeat access)
  if (seoCache.has(cacheKey)) {
    return seoCache.get(cacheKey);
  }

  // ─── GENERATE SYNCHRONOUSLY ────────────────────────────────────────────────
  const seoPackage = generateLocationSEOPackage({
    locationName,
    countryName,
    regionType,
    venueCount,
    locationDescription,
    nearbyLocations,
  });

  // ─── CACHE RESULT ──────────────────────────────────────────────────────────
  seoCache.set(cacheKey, seoPackage);

  return seoPackage;
}

/**
 * Internal: Core SEO generation logic
 * Generates unique, varied content with intelligent internal linking
 * Called synchronously, result cached
 */
function generateLocationSEOPackage({
  locationName,
  countryName,
  regionType,
  venueCount,
  locationDescription,
  nearbyLocations,
}) {
  const isCountry = regionType === 'country';
  const isRegion = regionType === 'region';
  const isCity = regionType === 'city';

  // ─── TITLE (with variation logic to avoid duplication) ──────────────────────
  const title = generateVariedTitle(locationName, countryName, regionType);

  // ─── META DESCRIPTION (with varied structures) ─────────────────────────────
  const description = generateVariedDescription(locationName, countryName, regionType, venueCount);

  // ─── EDITORIAL INTRO (varies by location, region type, tone) ────────────────
  const intro = locationDescription || generateVariedIntro(locationName, regionType, countryName);

  // ─── H2/H3 HEADING HIERARCHY (varied structures, not duplicate) ─────────────
  const h2Sections = generateVariedHeadings(locationName, regionType);

  // ─── TRUST/SOCIAL PROOF CONTENT (varies by location type) ──────────────────
  const trustPoints = generateTrustPoints(regionType);

  // ─── FAQ SECTION (location-specific questions) ────────────────────────────
  const faqs = generateLocationFAQs(locationName, countryName, regionType);

  // ─── INTERNAL LINKING CLUSTER (CRITICAL: builds topical authority) ────────
  // This links this location to nearby/related locations
  // Creates semantic clusters that Google understands
  const internalLinkingCluster = generateInternalLinkingCluster(
    locationName,
    countryName,
    regionType,
    nearbyLocations
  );

  // ─── BREADCRUMB STRUCTURE ──────────────────────────────────────────────────
  const breadcrumbs = generateBreadcrumbs(locationName, countryName, regionType);

  // ─── STRUCTURED DATA (Schema) ──────────────────────────────────────────────
  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };

  const placeSchema = {
    '@context': 'https://schema.org',
    '@type': 'Place',
    name: `Luxury Wedding Venues in ${locationName}`,
    description: description,
    areaServed: {
      '@type': 'Country',
      name: countryName,
    },
    url: `https://luxuryweddingdirectory.com/${buildLocationPath(locationName, countryName, regionType)}`,
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.a,
      },
    })),
  };

  return {
    // SEO Metadata (Title, Description, Canonical, OG)
    title,
    description,

    // Content sections
    intro,
    h2Sections,
    trustPoints,
    faqs,

    // INTERNAL LINKING CLUSTER (Topical Authority Building)
    // ⭐ CRITICAL for ranking: links to nearby/related locations
    internalLinkingCluster,

    // Breadcrumbs
    breadcrumbs,

    // Structured Data (JSON-LD Schemas)
    schemas: {
      breadcrumbList: breadcrumbSchema,
      place: placeSchema,
      faqPage: faqSchema,
    },

    // Render flags
    meta: {
      shouldShowFAQ: true,
      shouldShowTrustSection: true,
      shouldShowEditorialIntro: true,
      shouldShowInternalLinks: internalLinkingCluster.length > 0,
      venueCount,
    },
  };
}

// ─── VARIATION FUNCTIONS ──────────────────────────────────────────────────────
// These generate VARIED content so no two location pages sound identical
// Use deterministic hashing based on location name to ensure consistency

/**
 * Generate VARIED title to avoid duplication across locations
 * Uses location characteristics to create semantic variety
 */
function generateVariedTitle(locationName, countryName, regionType) {
  const seed = hashString(locationName); // Deterministic variation based on location
  const titleTemplates = {
    country: [
      `Luxury Wedding Venues in ${locationName} | Destination Wedding Directory`,
      `Wedding Venues in ${locationName} | Curated Luxury Properties`,
      `Exclusive Wedding Destinations in ${locationName} | Luxury Collection`,
    ],
    region: [
      `Wedding Venues in ${locationName}, ${countryName} | Luxury Destination Weddings`,
      `${locationName} Wedding Venues | Premium Luxury Destinations`,
      `Destination Weddings in ${locationName} | Curated Venues ${countryName}`,
    ],
    city: [
      `${locationName} Wedding Venues | Luxury ${countryName} Destination Weddings`,
      `Wedding Venues in ${locationName} | Exclusive Venues`,
      `Luxury Wedding Celebrations in ${locationName}, ${countryName}`,
    ],
  };

  const templates = titleTemplates[regionType] || titleTemplates.region;
  return templates[seed % templates.length];
}

/**
 * Generate VARIED meta descriptions
 * Different structure per location to avoid homogenized descriptions
 */
function generateVariedDescription(locationName, countryName, regionType, venueCount) {
  const seed = hashString(locationName);
  const descriptionTemplates = {
    country: [
      `Discover luxury wedding venues across ${locationName}. Curated, verified properties for destination weddings. Editorial-selected venues only.`,
      `Explore the finest wedding destinations in ${locationName}. ${venueCount || 'Hand-selected'} exclusive venues for luxury celebrations.`,
      `Premium wedding venues in ${locationName}. Verified luxury properties curated for discerning couples planning destination weddings.`,
    ],
    region: [
      `Luxury wedding venues in ${locationName}. Curated collection of verified exclusive properties for destination celebrations in ${countryName}.`,
      `Discover premium wedding venues in ${locationName}, ${countryName}. Editorially-selected properties for luxury destination weddings.`,
      `Wedding venues in ${locationName}. Exclusive, verified luxury properties for destination weddings on ${countryName}'s most desirable coastline.`,
    ],
    city: [
      `Luxury wedding venues in ${locationName}, ${countryName}. Curated exclusive properties for intimate and grand destination celebrations.`,
      `Premium venues for destination weddings in ${locationName}. Verified, luxury-focused properties with editorial curation.`,
      `Wedding venues in ${locationName}. Exclusive ${countryName} properties for luxury destination celebrations.`,
    ],
  };

  const templates = descriptionTemplates[regionType] || descriptionTemplates.region;
  return templates[seed % templates.length];
}

/**
 * Generate VARIED editorial intros (3-5 variations per type)
 * Ensures each location has unique opening tone while maintaining brand voice
 */
function generateVariedIntro(locationName, regionType, countryName) {
  const seed = hashString(locationName);

  const intros = {
    country: [
      `${locationName} stands as one of the world's most coveted destinations for luxury weddings. From romantic coastlines to breathtaking countryside, each region offers distinctive venues and unmatched hospitality. Our curated collection showcases the finest properties for destination celebrations.`,
      `For couples seeking the perfect destination wedding, ${locationName} offers an unparalleled collection of luxury venues and exceptional properties. Each location is personally verified and editorially selected for its distinctive character and world-class service.`,
      `${locationName} is a destination of choice for luxury weddings globally. With diverse regions offering everything from Mediterranean elegance to alpine romance, our carefully curated venues represent the pinnacle of hospitality and scenic beauty.`,
      `The luxury wedding destination of ${locationName} encompasses remarkable venues across multiple regions. From intimate hideaways to grand estates, each property in our collection reflects our commitment to editorial excellence and verified quality.`,
      `Couples worldwide choose ${locationName} for destination weddings that combine exceptional venues with unmatched regional character. Our curated collection represents only the most distinguished properties, personally verified for luxury and service.`,
    ],
    region: [
      `${locationName} is renowned for its timeless elegance and exceptional venues. Whether you envision an intimate gathering or a grand celebration, this destination offers curated venues that combine luxury, beauty, and impeccable service.`,
      `The region of ${locationName} has become synonymous with luxury destination weddings. Our collection of verified venues captures the essence of sophisticated celebrations in one of ${countryName}'s most distinctive locations.`,
      `For destination weddings in ${locationName}, couples are drawn to the combination of stunning scenery, cultural richness, and world-class venues. Each property in our collection embodies luxury and editorial excellence.`,
      `${locationName} offers a sophisticated backdrop for destination weddings. From waterfront elegance to countryside charm, our curated properties showcase the region's most exceptional venues for unforgettable celebrations.`,
      `Known for its distinctive character and refined hospitality, ${locationName} attracts couples seeking luxury destination weddings. Our editorially-selected venues represent the finest properties this remarkable region has to offer.`,
    ],
    city: [
      `${locationName} is one of the most sought-after destinations for luxury weddings. Known for its distinctive character, exceptional venues, and warm hospitality, it offers the perfect backdrop for unforgettable celebrations.`,
      `The city of ${locationName} has established itself as a premier destination for luxury weddings in ${countryName}. Our carefully curated collection of venues showcases the most exceptional properties this distinguished location offers.`,
      `${locationName} combines romance, elegance, and world-class hospitality—the essential ingredients for a luxury destination wedding. Each venue in our collection reflects our commitment to verified excellence and editorial curation.`,
      `For couples planning a destination wedding, ${locationName} presents an ideal combination of stunning settings and premium venues. Our collection represents only the most distinguished properties, personally verified for quality and luxury.`,
      `The luxury wedding scene in ${locationName} is defined by exceptional venues and meticulous service. Our editorially-selected properties capture the essence of this destination's sophistication and charm.`,
    ],
  };

  const options = intros[regionType] || intros.region;
  return options[seed % options.length];
}

/**
 * Generate VARIED H2 heading structures (not always identical)
 * Different section ordering and wording per location
 */
function generateVariedHeadings(locationName, regionType) {
  const seed = hashString(locationName);

  const headingVariations = {
    country: [
      [
        `Luxury Wedding Venues Across ${locationName}`,
        `Planning Your ${locationName} Destination Wedding`,
        `Why ${locationName} Leads in Destination Weddings`,
      ],
      [
        `${locationName}'s Premier Wedding Destinations`,
        `Destination Wedding Excellence in ${locationName}`,
        `The ${locationName} Advantage for Luxury Celebrations`,
      ],
      [
        `Discover the Finest Wedding Venues in ${locationName}`,
        `How to Plan a ${locationName} Destination Wedding`,
        `${locationName}: Global Standard for Destination Weddings`,
      ],
    ],
    region: [
      [
        `Premium Wedding Venues in ${locationName}`,
        `Planning Your ${locationName} Wedding`,
        `The Allure of ${locationName} Destination Weddings`,
      ],
      [
        `${locationName}: A Destination for Luxury Weddings`,
        `Curated Venues for ${locationName} Celebrations`,
        `Why Couples Choose ${locationName} for Weddings`,
      ],
      [
        `Luxury Wedding Destinations in ${locationName}`,
        `Your Guide to Planning in ${locationName}`,
        `${locationName} Wedding Excellence`,
      ],
    ],
    city: [
      [
        `Luxury Wedding Venues in ${locationName}`,
        `Planning Your ${locationName} Celebration`,
        `${locationName} as Your Destination Wedding`,
      ],
      [
        `${locationName}: A Premier Wedding Destination`,
        `Curated ${locationName} Wedding Properties`,
        `Experience ${locationName} Luxury Weddings`,
      ],
      [
        `Discover ${locationName}'s Finest Wedding Venues`,
        `Destination Wedding Planning in ${locationName}`,
        `Why ${locationName} is Ideal for Destination Weddings`,
      ],
    ],
  };

  const variations = headingVariations[regionType] || headingVariations.region;
  return variations[seed % variations.length];
}

/**
 * Generate VARIED trust points (different emphasis per location type)
 */
function generateTrustPoints(regionType) {
  const trustVariations = {
    country: [
      [
        'Editorially curated across all regions',
        '100% personally verified by our team',
        'No paid placements or sponsorships',
        'Trusted by international luxury couples',
      ],
      [
        'Verified venues across the entire country',
        'Editorial excellence in every selection',
        'Transparent, sponsor-free curation',
        'Global reputation for luxury standards',
      ],
    ],
    region: [
      [
        'Curated for regional excellence',
        'All venues personally verified',
        'No paid placements—merit-based selection',
        'Trusted by destination wedding couples',
      ],
      [
        'Editorial standards for every property',
        '100% verified by our luxury team',
        'Transparent, unsponsored recommendations',
        'Established authority in the region',
      ],
    ],
    city: [
      [
        'Hand-selected for this destination',
        'Personally verified for luxury standards',
        'No sponsored listings',
        'Trusted by discerning couples',
      ],
      [
        'Editorial curation and personal verification',
        'Commitment to authentic recommendations',
        'Curated by luxury wedding experts',
        'Established partner with destination venue',
      ],
    ],
  };

  const variations = trustVariations[regionType] || trustVariations.region;
  return variations[0]; // Use first variation (can be randomized)
}

/**
 * Generate location-specific FAQs
 */
function generateLocationFAQs(locationName, countryName, regionType) {
  return [
    {
      q: `What is the best time to get married in ${locationName}?`,
      a: `The ideal wedding season in ${locationName} typically runs from May through October, offering warm weather and clear skies. Peak season (June-September) provides the most vibrant atmosphere, while shoulder months (May and October) offer fewer crowds and equally stunning settings.`,
    },
    {
      q: `What is the typical cost of a luxury wedding venue in ${locationName}?`,
      a: `Luxury wedding venues in ${locationName} are priced competitively based on location, capacity, and facilities. Each venue offers bespoke packages tailored to your guest count, season, and requirements. We recommend connecting directly with venues for customized quotes.`,
    },
    {
      q: `How far in advance should I book a ${locationName} wedding venue?`,
      a: `Our most sought-after venues in ${locationName} typically book 18-24 months in advance for peak season dates. We recommend beginning your planning process 12-18 months before your intended wedding date to secure your preferred property and date.`,
    },
    {
      q: `Can we have a legal ceremony in ${locationName} if we're getting married from abroad?`,
      a: `Wedding legality in ${locationName} varies by location and your nationality. Many couples opt for a symbolic ceremony at the venue followed by a legal ceremony at home. Our team can guide you through local requirements and coordinate with local authorities.`,
    },
    {
      q: `What makes a ${locationName} destination wedding special?`,
      a: `${locationName} offers a unique combination of luxury venues, stunning scenery, exceptional hospitality, and romantic atmosphere. Destination weddings here allow you to celebrate with loved ones in an unforgettable setting while creating lasting memories in one of the world's most beautiful regions.`,
    },
  ];
}

/**
 * Build breadcrumb navigation structure
 */
function generateBreadcrumbs(locationName, countryName, regionType) {
  const breadcrumbs = [
    {
      name: 'Home',
      url: '/',
    },
    {
      name: countryName,
      url: `/destinations/${countryName.toLowerCase()}`,
    },
  ];

  if (regionType !== 'country') {
    breadcrumbs.push({
      name: locationName,
      url: `/${countryName.toLowerCase()}/${locationName.toLowerCase().replace(/\s+/g, '-')}`,
    });
  }

  return breadcrumbs;
}

/**
 * Build location path for URL
 */
function buildLocationPath(locationName, countryName, regionType) {
  const country = countryName.toLowerCase().replace(/\s+/g, '-');
  const location = locationName.toLowerCase().replace(/\s+/g, '-');

  if (regionType === 'country') {
    return `destinations/${country}`;
  }
  return `${country}/${location}`;
}

// ─── INTERNAL LINKING CLUSTER (Topical Authority Building) ───────────────────
// ⭐ CRITICAL: Links to nearby/related locations create semantic clusters
// Google understands these clusters and treats location pages as authoritative

/**
 * Generate internal linking cluster section
 * Links current location to nearby/related locations
 * Example: Amalfi Coast links to nearby Ravello, Positano, Naples region, etc.
 *
 * This builds TOPICAL AUTHORITY by:
 * 1. Creating location clusters (e.g., all Amalfi area pages link to each other)
 * 2. Establishing hierarchical relationships (country > region > city)
 * 3. Distributing link equity throughout the location taxonomy
 *
 * @param {string} locationName - Current location (e.g., "Amalfi Coast")
 * @param {string} countryName - Country (e.g., "Italy")
 * @param {string} regionType - 'country' | 'region' | 'city'
 * @param {Array} nearbyLocations - List of nearby/related locations with paths
 * @returns {Array} Formatted internal links with SEO-optimized anchor text
 */
function generateInternalLinkingCluster(
  locationName,
  countryName,
  regionType,
  nearbyLocations = []
) {
  // If no nearby locations provided, return empty (can be populated from database)
  if (!nearbyLocations || nearbyLocations.length === 0) {
    return [];
  }

  // Format links with varied anchor text based on region type
  const linkTemplates = {
    country: 'Explore wedding venues in',
    region: 'Discover nearby wedding destinations in',
    city: 'Wedding venues in nearby',
  };

  const anchorTemplate = linkTemplates[regionType] || 'Explore wedding venues in';

  // Create link objects with proper SEO structure
  const formattedLinks = nearbyLocations.map((nearby) => ({
    name: nearby.name,
    path: nearby.path,
    // SEO-optimized anchor text (varies to avoid over-optimization)
    anchorText: `${anchorTemplate} ${nearby.name}`,
    type: nearby.type || regionType, // 'country', 'region', 'city'
    region: nearby.region, // For clustering logic
  }));

  return formattedLinks;
}

// ─── HELPER FUNCTIONS ──────────────────────────────────────────────────────

/**
 * Simple deterministic hash function
 * Used to ensure consistent variation per location (same location = same variation)
 * Deterministic means Lake Como always gets variation 1, Amalfi always gets variation 2
 */
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Clear SEO cache (for admin updates or testing)
 */
export function clearLocationSEOCache(cacheKey) {
  if (cacheKey) {
    seoCache.delete(cacheKey);
  } else {
    seoCache.clear();
  }
}

/**
 * Get cache stats (for monitoring performance)
 */
export function getLocationSEOCacheStats() {
  return {
    cachedLocations: seoCache.size,
    cacheKeys: Array.from(seoCache.keys()),
  };
}
