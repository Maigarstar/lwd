// ─── src/utils/structuredData.js ─────────────────────────────────────────────
// Pure JSON-LD / Schema.org builder functions.
// NO React imports. These return plain objects - pass them to <JsonLd schema={...} />.
// Accepts both snake_case (DB rows) and camelCase (mapped listing objects).

const SITE_URL = import.meta.env.VITE_SITE_URL || "https://www.luxuryweddingdirectory.co.uk";

const SITE_NAME = "Luxury Wedding Directory";
const SITE_LOGO = `${SITE_URL}/logo.png`;

// ── Helpers ───────────────────────────────────────────────────────────────────

function defined(...values) {
  for (const v of values) {
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return undefined;
}

// ── buildVenueSchema ──────────────────────────────────────────────────────────
// LocalBusiness schema for venue listing pages.
// Accepts both snake_case DB rows and camelCase mapped objects.
/**
 * @param {object} listing - Row from `listings` table (snake_case or camelCase)
 */
export function buildVenueSchema(listing) {
  if (!listing) return null;

  const name   = defined(listing.name, listing.venue_name, listing.venueName);
  const slug   = defined(listing.slug);
  const url    = slug ? `${SITE_URL}/wedding-venues/${slug}` : SITE_URL;

  // Hero image - try both naming conventions
  const image  = defined(
    listing.hero_image,
    listing.heroImage,
    listing.hero_image_set?.[0],
    listing.heroImageSet?.[0],
    listing.imgs?.[0]?.src || listing.imgs?.[0],
    listing.gallery?.[0]?.src || listing.gallery?.[0],
  );

  const desc   = defined(
    listing.seo_description,
    listing.seoDescription,
    listing.short_description,
    listing.shortDescription,
    listing.description,
  );

  const schema = {
    "@context":   "https://schema.org",
    "@type":      "LocalBusiness",
    "name":       name,
    "url":        url,
  };

  if (desc)  schema.description = desc;
  if (image) schema.image       = image;

  const priceRange = defined(listing.priceRange, listing.price_range);
  if (priceRange) schema.priceRange = priceRange;

  // Address
  const streetAddress = defined(listing.address, listing.address_line1, listing.addressLine1);
  const city          = defined(listing.city, listing.location_city, listing.locationCity);
  const region        = defined(listing.region, listing.county);
  const country       = defined(listing.country);
  const postcode      = defined(listing.postcode, listing.postal_code, listing.postalCode);

  if (city || country) {
    schema.address = {
      "@type": "PostalAddress",
      ...(streetAddress && { streetAddress }),
      ...(city          && { addressLocality: city }),
      ...(region        && { addressRegion: region }),
      ...(country       && { addressCountry: country }),
      ...(postcode      && { postalCode: postcode }),
    };
  }

  // Aggregate rating
  const avgRating   = defined(listing.avg_rating,   listing.avgRating,   listing.rating);
  const reviewCount = defined(listing.review_count, listing.reviewCount, listing.reviews);

  if (avgRating && reviewCount > 0) {
    schema.aggregateRating = {
      "@type":       "AggregateRating",
      "ratingValue": parseFloat(avgRating).toFixed(1),
      "reviewCount": reviewCount,
      "bestRating":  "5",
      "worstRating": "1",
    };
  }

  // Telephone / email
  const phone = defined(listing.phone, listing.contact_phone, listing.contactPhone);
  const email = defined(listing.email, listing.contact_email, listing.contactEmail);
  if (phone) schema.telephone = phone;
  if (email) schema.email     = email;

  return schema;
}

// ── buildArticleSchema ────────────────────────────────────────────────────────
// Article schema for magazine post pages.
/**
 * @param {object} post - Row from `magazine_posts` table
 */
export function buildArticleSchema(post) {
  if (!post) return null;

  const url   = post.category_slug && post.slug
    ? `${SITE_URL}/magazine/${post.category_slug}/${post.slug}`
    : SITE_URL;

  const schema = {
    "@context":         "https://schema.org",
    "@type":            "Article",
    "headline":         defined(post.seo_title, post.seoTitle, post.title),
    "description":      defined(post.seo_description, post.seoDescription, post.excerpt),
    "url":              url,
    "publisher": {
      "@type": "Organization",
      "name":  SITE_NAME,
      "logo":  { "@type": "ImageObject", "url": SITE_LOGO },
    },
  };

  if (post.hero_image || post.heroImage) {
    schema.image = defined(post.hero_image, post.heroImage);
  }
  if (post.published_at || post.publishedAt) {
    schema.datePublished = defined(post.published_at, post.publishedAt);
  }
  if (post.updated_at || post.updatedAt) {
    schema.dateModified = defined(post.updated_at, post.updatedAt);
  }

  const authorName = defined(post.author_name, post.authorName, post.author);
  if (authorName) {
    schema.author = { "@type": "Person", "name": authorName };
  }

  return schema;
}

// ── buildBreadcrumbSchema ─────────────────────────────────────────────────────
// BreadcrumbList schema from a simple array of { name, url } objects.
/**
 * @param {Array<{name: string, url: string}>} crumbs
 */
export function buildBreadcrumbSchema(crumbs) {
  if (!crumbs || crumbs.length === 0) return null;

  return {
    "@context":        "https://schema.org",
    "@type":           "BreadcrumbList",
    "itemListElement": crumbs.map((crumb, i) => ({
      "@type":    "ListItem",
      "position": i + 1,
      "name":     crumb.name,
      "item":     crumb.url.startsWith("http") ? crumb.url : `${SITE_URL}${crumb.url}`,
    })),
  };
}

// ── buildFaqSchema ────────────────────────────────────────────────────────────
// FAQPage schema from listing.faq_categories JSONB structure.
/**
 * @param {Array} faqCategories - listing.faq_categories / listing.faqCategories array from DB
 * Each category: { category: string, faqs: [{ question: string, answer: string }] }
 */
export function buildFaqSchema(faqCategories) {
  if (!faqCategories || !Array.isArray(faqCategories)) return null;

  const entities = [];
  for (const cat of faqCategories) {
    if (!Array.isArray(cat.faqs)) continue;
    for (const faq of cat.faqs) {
      if (faq.question && faq.answer) {
        entities.push({
          "@type":          "Question",
          "name":           faq.question,
          "acceptedAnswer": {
            "@type": "Answer",
            "text":  faq.answer,
          },
        });
      }
    }
  }

  if (entities.length === 0) return null;

  return {
    "@context":   "https://schema.org",
    "@type":      "FAQPage",
    "mainEntity": entities,
  };
}

// ── buildWebSiteSchema ────────────────────────────────────────────────────────
// WebSite schema for the homepage - enables Sitelinks Search Box in Google.
export function buildWebSiteSchema() {
  return {
    "@context":        "https://schema.org",
    "@type":           "WebSite",
    "name":            SITE_NAME,
    "url":             SITE_URL,
    "potentialAction": {
      "@type":       "SearchAction",
      "target":      {
        "@type": "EntryPoint",
        "urlTemplate": `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}
